import { test } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { SUB_TABLE, kpPoint, houseOf, NODES_KP, rulingPlanets, vimshottariLordsAt, type KpPlanet } from "@shared/kp";
import { auroraAscendantLinks } from "@shared/kp-aurora";
import { ascendantAt, cuspsAt, julianDay, positionsAt } from "../server/ephemeris";

// Source: Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024),
// supplied Kindle capture. These check calculations against stated examples;
// they do not test whether an interpretation or rectification is correct.
const kpOpts = { ayanamsa: "kp", nodeType: "mean" } as const;
const lon = (sign: number, degrees: number, minutes: number, seconds: number) =>
  sign * 30 + degrees + minutes / 60 + seconds / 3600;
const lords = (longitude: number) => {
  const { signLord, starLord, subLord, subSubLord } = kpPoint(longitude);
  return { signLord, starLord, subLord, subSubLord };
};

test("Aurora's horary numbers 45 and 123 agree with the 249-part table", () => {
  // Capture page 621: the source's one-based number, sign, star and sub.
  for (const example of [
    { number: 45, sign: "Gemini", signLord: "Mercury", star: "Mars", sub: "Sun" },
    { number: 123, sign: "Virgo", signLord: "Mercury", star: "Mars", sub: "Jupiter" },
  ]) {
    const part = SUB_TABLE[example.number - 1];
    const point = kpPoint((part.start + part.end) / 2);
    assert.deepEqual(
      { sign: point.sign, signLord: point.signLord, star: point.starLord, sub: point.subLord },
      { sign: example.sign, signLord: example.signLord, star: example.star, sub: example.sub },
    );
  }
});

test("Aurora's printed birth-chart longitudes reproduce their listed lords", () => {
  // Capture pages 277–278. These use the book's printed longitudes directly;
  // they are not an independent check of the ephemeris or house calculations.
  const examples = [
    { name: "first cusp", longitude: lon(6, 15, 0, 41), expected: ["Venus", "Rahu", "Ketu", "Saturn"] },
    { name: "ninth cusp", longitude: lon(2, 15, 22, 40), expected: ["Mercury", "Rahu", "Venus", "Venus"] },
    { name: "tenth cusp", longitude: lon(3, 18, 12, 14), expected: ["Moon", "Mercury", "Mercury", "Jupiter"] },
    { name: "Moon", longitude: lon(5, 5, 54, 15), expected: ["Mercury", "Sun", "Mercury", "Moon"] },
  ];
  for (const example of examples) {
    const p = lords(example.longitude);
    assert.deepEqual([p.signLord, p.starLord, p.subLord, p.subSubLord], example.expected, example.name);
  }
});

test("Aurora's Delhi example reproduces the primary ruling planets with stated assumptions", () => {
  // Capture pages 272–275. Birth is in New Delhi; judgment place is not
  // specified in this example, so New Delhi is an explicit assumption.
  const latitude = 28.6139, longitude = 77.209;
  const utc = (iso: string) => DateTime.fromISO(iso, { zone: "Asia/Kolkata" }).toUTC();
  const birth = utc("1982-01-15T01:42:00");
  const judgment = utc("2022-08-22T13:03:27");
  const birthJd = julianDay(birth), judgmentJd = julianDay(judgment);
  const birthSky = positionsAt(birthJd, kpOpts), judgmentSky = positionsAt(judgmentJd, kpOpts);
  const birthCusps = cuspsAt(birthJd, latitude, longitude, kpOpts);
  const cusps = birthCusps.map((lon, i) => ({ ...kpPoint(lon), house: i + 1 }));
  const planets: KpPlanet[] = birthSky.map((p) => ({ ...kpPoint(p.lon), planet: p.planet, retrograde: p.retrograde,
    house: houseOf(p.lon, birthCusps), owns: NODES_KP.includes(p.planet) ? [] : cusps.map((c, i) => c.signLord === p.planet ? i + 1 : 0).filter(Boolean) }));
  assert.deepEqual(
    [1, 9, 10].map((house) => {
      const p = kpPoint(birthCusps[house - 1]);
      return [p.signLord, p.starLord, p.subLord];
    }),
    [["Venus", "Rahu", "Ketu"], ["Mercury", "Rahu", "Venus"], ["Moon", "Mercury", "Mercury"]],
  );
  const links = auroraAscendantLinks(planets, cusps);
  assert.deepEqual([links.firstSub, links.ninthSub, links.firstSubHouse, links.ninthSubHouse, links.sameHouse], ["Ketu", "Venus", 3, 3, true]);
  const rp = rulingPlanets({
    asOf: judgment.toISO()!, positions: judgmentSky,
    ascendant: ascendantAt(judgmentJd, latitude, longitude, kpOpts), weekday: 1,
  });
  assert.deepEqual(rp.list.slice(0, 5).map((item) => item.planet), ["Saturn", "Mars", "Rahu", "Mercury", "Moon"]);
  assert.equal(birthSky.find((p) => p.planet === "Saturn")!.retrograde, false);
  assert.equal(judgmentSky.find((p) => p.planet === "Saturn")!.retrograde, true);
  const moon = birthSky.find((p) => p.planet === "Moon")!.lon;
  for (const when of ["2022-06-21T12:00:00", "2022-08-22T13:03:27"]) {
    assert.deepEqual(vimshottariLordsAt(moon, birth.toISO()!, utc(when).toISO()!), ["Jupiter", "Saturn", "Moon"]);
  }
});

test("a Moon stated only as 29 degrees Taurus does not determine its sub-sub lord", () => {
  // Capture pages 264–265 say 29 degrees Taurus and give Jupiter. Exact
  // 29°00'00" yields Sun, whereas a longitude of 29°45' yields Jupiter.
  // Thus the source's abbreviated degree is not enough for an exact check.
  const a = kpPoint(lon(1, 29, 0, 0)), b = kpPoint(lon(1, 29, 45, 0));
  assert.deepEqual([a.starLord, a.subLord, a.subSubLord], ["Mars", "Saturn", "Sun"]);
  assert.deepEqual([b.starLord, b.subLord, b.subSubLord], ["Mars", "Saturn", "Jupiter"]);
});

test("Aurora's dated marriage sky depends on the missing event time", () => {
  // Capture pages 636–637 give 10 December 2022, but no event time or zone.
  // Interpret the date in India for this calculation; do not infer the actual
  // event instant or use an assumed noon as a disproof of the example.
  const skyAt = (hour: number) => {
    const dt = DateTime.fromISO("2022-12-10T00:00:00", { zone: "Asia/Kolkata" }).plus({ hours: hour });
    const sky = positionsAt(julianDay(dt.toUTC()), kpOpts);
    const point = (planet: string) => kpPoint(sky.find((p) => p.planet === planet)!.lon);
    return { jupiter: point("Jupiter"), venus: point("Venus"), sun: point("Sun"), moon: point("Moon") };
  };
  const noon = skyAt(12), evening = skyAt(20);
  assert.deepEqual([noon.jupiter.sign, noon.jupiter.starLord], ["Pisces", "Saturn"]);
  assert.deepEqual([noon.venus.sign, noon.venus.starLord], ["Sagittarius", "Ketu"]);
  assert.equal(noon.sun.sign, "Scorpio");
  assert.deepEqual([noon.moon.sign, noon.moon.starLord], ["Gemini", "Rahu"]);
  assert.deepEqual([evening.moon.sign, evening.moon.starLord], ["Gemini", "Jupiter"]);
});
