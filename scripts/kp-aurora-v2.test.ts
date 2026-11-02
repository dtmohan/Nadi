import { test } from "node:test";
import assert from "node:assert/strict";
import type { Planet } from "@shared/astro";
import { houseOf, kpPoint, NODES_KP, vimshottariLordsAt, type KpCusp, type KpPlanet } from "@shared/kp";
import { auroraV2AtomicCoordinates, auroraV2Classify, auroraV2Evidence, auroraV2StageCounts } from "@shared/kp-aurora-v2";
import { DateTime } from "luxon";
import { julianDay, positionsAt } from "../server/ephemeris";

const longitude = (s: number, d: number, m: number, sec: number) => 30 * s + d + m / 60 + sec / 3600;

/** Independently transcribed coordinates from Aurora's 1983 worked chart,
 * supplied Kindle capture pp. 424–426 and 582–587. */
function sourceChart() {
  const cuspPositions = [
    [5,6,17,43], [6,3,50,58], [7,4,17,43], [8,6,17,3], [9,8,16,21], [10,8,43,23],
    [11,6,17,43], [0,3,50,58], [1,4,17,43], [2,6,17,3], [3,8,16,21], [4,8,43,23],
  ].map(([s,d,m,sec]) => longitude(s,d,m,sec));
  const cusps: KpCusp[] = cuspPositions.map((lon, i) => ({ ...kpPoint(lon), house: i + 1 }));
  const entries: Array<[Planet, number, number, number, number]> = [
    ["Sun",4,16,29,19], ["Moon",2,20,16,52], ["Mars",3,19,32,17], ["Mercury",5,7,10,46],
    ["Jupiter",7,9,25,7], ["Venus",4,2,47,2], ["Saturn",6,7,16,51], ["Rahu",1,28,13,1], ["Ketu",7,28,13,1],
  ];
  const planets: KpPlanet[] = entries.map(([planet,s,d,m,sec]) => {
    const point = kpPoint(longitude(s,d,m,sec));
    return { ...point, planet, retrograde: false, house: houseOf(point.lon, cuspPositions),
      owns: NODES_KP.includes(planet) ? [] : cusps.filter((c) => c.signLord === planet).map((c) => c.house) };
  });
  return { planets, cusps };
}

/** The separate 1988 marriage example, capture pp. 462–474. */
function marriageSourceChart() {
  const cuspPositions = [
    [1,29,43,0], [2,22,17,22], [3,15,12,22], [4,11,56,30], [5,15,8,57], [6,23,23,13],
    [7,29,43,0], [8,22,17,22], [9,15,12,32], [10,11,56,30], [11,15,8,57], [0,23,23,13],
  ].map(([s,d,m,sec]) => longitude(s,d,m,sec));
  const cusps: KpCusp[] = cuspPositions.map((lon, i) => ({ ...kpPoint(lon), house: i + 1 }));
  const entries: Array<[Planet, number, number, number, number]> = [
    ["Sun",11,27,31,18], ["Moon",1,29,45,0], ["Mars",1,1,23,57], ["Mercury",0,15,3,40],
    ["Jupiter",6,9,3,20], ["Venus",0,16,12,52], ["Saturn",0,16,0,4], ["Rahu",10,17,42,52], ["Ketu",4,17,42,52],
  ];
  const planets: KpPlanet[] = entries.map(([planet,s,d,m,sec]) => {
    const point = kpPoint(longitude(s,d,m,sec));
    return { ...point, planet, retrograde: false, house: houseOf(point.lon, cuspPositions),
      owns: NODES_KP.includes(planet) ? [] : cusps.filter((c) => c.signLord === planet).map((c) => c.house) };
  });
  return { planets, cusps };
}

test("atomic coordinates reproduce the author's 1983 birth chart, including node agents", () => {
  const { planets } = sourceChart();
  for (const [planet, expected] of [
    ["Saturn", [2,5,6]], ["Mars", [3,8,11]], ["Venus", [2,9,11]], ["Jupiter", [3,4,7]],
    ["Rahu", [2,3,4,7,9,11]], ["Ketu", [3,4,7,8,11]],
  ] as Array<[Planet, number[]]>) assert.deepEqual(auroraV2AtomicCoordinates(planets, planet).houses, expected, planet);
  assert.ok(auroraV2AtomicCoordinates(planets, "Rahu").agents.some((a) => a.planet === "Jupiter" && a.via.includes("full sign aspect")));
});

test("repeated star and sub can use sub-sub even when the planet is not in its own star", () => {
  const frame = sourceChart();
  const sun = frame.planets.find((p) => p.planet === "Sun")!;
  sun.starLord = "Venus";
  sun.subLord = "Venus";
  sun.subSubLord = "Mars";
  const getLayer = () => auroraV2Evidence({ matter: "marriage", ...frame, lords: ["Sun", "Moon", "Jupiter"], transits: [] })!
    .layers.find((l) => l.role === "Major period")!;
  const first = getLayer();
  assert.equal(first.ownStar, false);
  assert.equal(first.repeatedStarSub, true);
  assert.equal(first.sub.planet, "Mars");
  // A fresh candidate frame avoids the deliberately scoped evaluator cache.
  const planets = frame.planets.map((p) => p.planet === "Sun" ? { ...p, subSubLord: "Saturn" as Planet } : { ...p });
  const second = auroraV2Evidence({ matter: "marriage", planets, cusps: frame.cusps, lords: ["Sun", "Moon", "Jupiter"], transits: [] })!
    .layers.find((l) => l.role === "Major period")!;
  assert.equal(second.sub.planet, "Saturn");
});

test("the book's 2013 childbirth example carries a mixed star with a supportive sub", () => {
  const frame = sourceChart();
  const evidence = auroraV2Evidence({ matter: "child", ...frame, lords: ["Saturn", "Rahu", "Jupiter"], transits: [] })!;
  assert.deepEqual(evidence.layers.map((l) => l.status), [
    "supported-with-caution", "supported-with-caution", "supported-with-caution", "supported",
  ]);
  assert.deepEqual(evidence.layers[2].star.houses, [3,8,11]);
  assert.deepEqual(evidence.layers[2].sub.houses, [2,5,6]);
  assert.equal(evidence.allSupported, true);
});

test("stage counts retain earlier matches and never revive a stopped chain", () => {
  const evidence = auroraV2Evidence({ matter: "child", ...sourceChart(), lords: ["Saturn", "Rahu", "Jupiter"], transits: [] })!;
  const stoppedMajor = structuredClone(evidence);
  stoppedMajor.layers[1].status = "mixed-sub";
  stoppedMajor.layers[2].eligible = false;
  stoppedMajor.layers[3].eligible = false;
  const stoppedCusp = structuredClone(evidence);
  stoppedCusp.layers[0].status = "opposed";
  stoppedCusp.layers.slice(1).forEach((l) => { l.eligible = false; });
  assert.deepEqual(auroraV2StageCounts([evidence, stoppedMajor, stoppedCusp, undefined]),
    { eligibleEvents: 3, cusps: 2, major: 1, sub: 1, third: 1 });
});

test("the source's 2013 period boundary depends on its printed versus recalculated Moon", () => {
  const birth = DateTime.fromISO("1983-09-03T07:44:00", { zone: "Asia/Kolkata" }).toUTC();
  const event = DateTime.fromISO("2013-09-29T12:00:00", { zone: "Asia/Kolkata" }).toUTC();
  const moon = positionsAt(julianDay(birth), { ayanamsa: "kp", nodeType: "mean" }).find((p) => p.planet === "Moon")!;
  const printed = longitude(2, 20, 16, 52);
  assert.deepEqual(vimshottariLordsAt(printed, birth.toISO()!, event.toISO()!), ["Saturn", "Rahu", "Jupiter"]);
  assert.deepEqual(vimshottariLordsAt(moon.lon, birth.toISO()!, event.toISO()!), ["Saturn", "Rahu", "Saturn"]);
  assert.ok(Math.abs(moon.lon - printed) < 0.02); // less than 1.2 arcminutes, but period differs
});

test("mixed sub-lord indications remain unresolved instead of becoming a pass or denial", () => {
  // Aurora's 1988 marriage discussion, capture pp. 471–472: Venus's
  // mixed star [1,6,11], Mercury's sub [7,12]. The author weighs context;
  // this adapter does not turn the mixed sub into a deterministic result.
  const v = auroraV2Classify({ supporting: [11], adverse: [1,6] }, { supporting: [7], adverse: [12] });
  assert.equal(v, "mixed-sub");
  assert.equal(auroraV2Classify({ supporting: [11], adverse: [8] }, { supporting: [2,5], adverse: [] }), "supported-with-caution");
  assert.equal(auroraV2Classify({ supporting: [11], adverse: [8] }, { supporting: [], adverse: [12] }), "opposed");
  assert.equal(auroraV2Classify({ supporting: [], adverse: [8] }, { supporting: [2], adverse: [] }), "unresolved");
});

test("the 1988 marriage example reproduces its node coordinates and shows the remaining mixed-sub limit", () => {
  const frame = marriageSourceChart();
  assert.deepEqual(auroraV2AtomicCoordinates(frame.planets, "Rahu").houses, [5,8,9,10,11]);
  assert.deepEqual(auroraV2AtomicCoordinates(frame.planets, "Ketu").houses, [4,7,11,12]);
  const e = auroraV2Evidence({ matter: "marriage", ...frame, lords: ["Rahu", "Sun", "Saturn"], transits: [] })!;
  assert.equal(e.layers[0].status, "supported-with-caution");
  assert.equal(e.layers[1].status, "mixed-sub");
  assert.equal(e.layers[2].eligible, false);
  assert.equal(e.allSupported, false); // The author proceeds; the unresolved disagreement stays visible.
});

test("a later period never passes after a mixed predecessor", () => {
  const { planets, cusps } = sourceChart();
  const evidence = auroraV2Evidence({ matter: "marriage", planets, cusps,
    lords: ["Sun", "Mars", "Mercury"], transits: [] })!;
  const firstFailure = evidence.layers.findIndex((l) => l.eligible && !["supported", "supported-with-caution"].includes(l.status));
  assert.ok(firstFailure >= 0);
  assert.ok(evidence.layers.slice(firstFailure + 1).every((l) => !l.eligible));
  assert.equal(evidence.allSupported, false);
});
