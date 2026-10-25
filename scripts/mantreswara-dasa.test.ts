/**
 * Mantreswara's period rules in the Parashari dasa reading (Phaladeepika 20.22, 20.30, 20.57; provisional), on
 * synthetic positions (no real person's data):
 * - a vargottama lord reads favourable, or mixed when it is combust or debilitated (20.22, first half);
 * - a combust lord reads like a debilitated one (20.30), softened to mixed with its good in the second half when it
 *   stands in an auspicious sign or navamsa, read by dignity (20.57);
 * - combustion is counted once: a BPHS 47 line that fires on combustion alone is shown but left out of the lean.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { dignityOf, SIGNS, type Planet, type PlanetPosition } from "@shared/astro";
import { vimshottari } from "@shared/kp";
import {
  computeDasaReadings,
  countedTones,
  leanOf,
  COMBUST_COUNTED_ONCE,
  type DasaReading,
} from "@shared/parashari-dasa";
import { parashariCombust } from "@shared/vargas";

const PLANETS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const BIRTH = "1990-01-01T00:00:00.000Z";
const AS_OF = "2026-10-25T12:00:00.000Z";

const mk = (planet: Planet, lon: number): PlanetPosition => {
  const L = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(L / 30);
  const degInSign = L - signIndex * 30;
  return {
    planet,
    lon: L,
    signIndex,
    sign: SIGNS[signIndex],
    degInSign,
    speed: 1,
    retrograde: planet === "Rahu" || planet === "Ketu",
    nakshatraIndex: Math.floor(L / (360 / 27)) % 27,
    nakshatra: "",
    nakshatraLord: "Ketu",
    pada: 1,
    dignity: dignityOf(planet, signIndex, degInSign),
    combust: false,
    signLord: "Sun",
  } as PlanetPosition;
};

const read = (lons: Record<Planet, number>, lagnaIdx: number) => {
  const positions = PLANETS.map((p) => mk(p, lons[p]));
  const vim = vimshottari(lons.Moon, BIRTH, AS_OF);
  return { positions, readings: computeDasaReadings(positions, lagnaIdx, [], vim, BIRTH, AS_OF) };
};
const of = (rs: DasaReading[], lord: Planet) => rs.find((d) => d.lord === lord)!;
const ids = (d: DasaReading) => d.notes.map((n) => n.id);

test("a combust Saturn exalted in the lagna: 20.57 softens, and its ch. 47 line is shown but not counted", () => {
  // Libra rising; the Sun at 15 Libra, Saturn at 10 Libra (5 degrees away, navamsa Capricorn).
  const { readings } = read(
    { Sun: 195, Moon: 40, Mars: 100, Mercury: 220, Jupiter: 280, Venus: 160, Saturn: 190, Rahu: 130, Ketu: 310 },
    6,
  );
  const d = of(readings, "Saturn");
  const n47 = d.notes.find((n) => n.id === "Saturn-47-57-58")!;
  assert.ok(n47, "the BPHS line still shows");
  assert.equal(n47.notCounted, COMBUST_COUNTED_ONCE);
  const pd = d.notes.find((n) => n.id === "Saturn-pd-20-57")!;
  assert.equal(pd.tone, "mixed");
  assert.match(pd.text, /exaltation sign \(Libra\)/);
  assert.match(pd.text, /second half/);
  assert.ok(pd.source.provisional);
  assert.ok(!ids(d).includes("Saturn-pd-20-30"));
  assert.ok(!ids(d).includes("Saturn-pd-20-22"), "not vargottama");
  // The lean leaves the uncounted line out.
  assert.deepEqual(d.lean, leanOf(countedTones(d.notes)));
  assert.equal(leanOf(d.notes.map((n) => n.tone)).against, d.lean.against + 1);
});

test("a combust Jupiter in an enemy's sign and navamsa keeps 20.30's line against the period", () => {
  // Jupiter at 18 Taurus (navamsa Gemini, Mercury's), the Sun at 25 Taurus (7 degrees away).
  const { readings } = read(
    { Sun: 55, Moon: 200, Mars: 300, Mercury: 80, Jupiter: 48, Venus: 10, Saturn: 250, Rahu: 130, Ketu: 310 },
    0,
  );
  const d = of(readings, "Jupiter");
  const pd = d.notes.find((n) => n.id === "Jupiter-pd-20-30")!;
  assert.ok(pd, ids(d).join(", "));
  assert.equal(pd.tone, "strain");
  assert.ok(!pd.notCounted);
  assert.match(pd.detail ?? "", /Gemini/);
  assert.ok(!ids(d).includes("Jupiter-pd-20-57"));
  // Jupiter's own ch. 47 line is mixed, so it never takes a side and is not marked.
  const n47 = d.notes.find((n) => n.id === "Jupiter-47-49-51");
  if (n47) assert.equal(n47.notCounted, undefined);
});

test("a vargottama lord reads favourable, or mixed when combust (20.22)", () => {
  // Mars at 1 Aries (Aries navamsa); the Sun far away at 25 Taurus.
  const far = read(
    { Sun: 55, Moon: 200, Mars: 1, Mercury: 80, Jupiter: 150, Venus: 70, Saturn: 250, Rahu: 130, Ketu: 310 },
    3,
  );
  const m = of(far.readings, "Mars").notes.find((n) => n.id === "Mars-pd-20-22")!;
  assert.equal(m.tone, "support");
  assert.match(m.text, /in Aries in both the birth chart and the navamsa/);
  // Mercury at 1 Libra (Libra navamsa), with the Sun at 5 Libra.
  const near = read(
    { Sun: 185, Moon: 40, Mars: 100, Mercury: 181, Jupiter: 280, Venus: 160, Saturn: 250, Rahu: 130, Ketu: 310 },
    0,
  );
  const me = of(near.readings, "Mercury");
  assert.equal(me.notes.find((n) => n.id === "Mercury-pd-20-22")!.tone, "mixed");
  assert.ok(ids(me).includes("Mercury-pd-20-57"), "a friend's sign is auspicious by dignity");
});

test("Mars's ch. 47 strain line names combustion and is not counted when combustion is its only cause", () => {
  // Aries rising. Mars at 25 Aries; the Sun at 2 Taurus (7 degrees away, in the next sign); no malefic with or aspecting Mars.
  const { readings } = read(
    { Sun: 32, Moon: 70, Mars: 25, Mercury: 40, Jupiter: 160, Venus: 300, Saturn: 345, Rahu: 130, Ketu: 310 },
    0,
  );
  const d = of(readings, "Mars");
  const n47 = d.notes.find((n) => n.id === "Mars-47-33")!;
  assert.ok(n47, ids(d).join(", "));
  assert.match(n47.text, /^Mars combust:/);
  assert.equal(n47.notCounted, COMBUST_COUNTED_ONCE);
  assert.equal(d.notes.find((n) => n.id === "Mars-pd-20-57")!.tone, "mixed", "Aries is its own sign");
});

test("on random positions the lines follow the conditions and the lean counts only counted lines", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  let combustSeen = 0,
    softened = 0,
    vargottamaSeen = 0,
    uncountedSeen = 0;
  for (let i = 0; i < 150; i++) {
    const lons = Object.fromEntries(PLANETS.map((p) => [p, rnd() * 360])) as Record<Planet, number>;
    // Bring a planet near the Sun in most charts so combustion is exercised.
    const near = PLANETS[2 + (i % 5)];
    lons[near] = lons.Sun + (rnd() - 0.5) * 16;
    lons.Ketu = (lons.Rahu + 180) % 360;
    const { positions, readings } = read(lons, Math.floor(rnd() * 12));
    const sunLon = positions.find((p) => p.planet === "Sun")!.lon;
    for (const d of readings) {
      const pp = positions.find((p) => p.planet === d.lord)!;
      const combust = parashariCombust(pp, sunLon);
      const nav = (pp.signIndex * 9 + Math.floor(pp.degInSign / (10 / 3))) % 12;
      const pd = d.notes.filter((n) => n.layer === "mantreswara");
      const combustLines = pd.filter((n) => n.id.endsWith("-pd-20-30") || n.id.endsWith("-pd-20-57"));
      assert.equal(combustLines.length, combust ? 1 : 0, `${d.lord} on chart ${i}`);
      if (combust) combustSeen++;
      if (pd.some((n) => n.id.endsWith("-pd-20-57"))) softened++;
      assert.equal(pd.some((n) => n.id.endsWith("-pd-20-22")), nav === pp.signIndex, `${d.lord} vargottama on chart ${i}`);
      if (nav === pp.signIndex) vargottamaSeen++;
      for (const n of pd) {
        assert.ok(n.source.provisional, n.id);
        assert.ok(!/undefined|NaN|\bnull\b|death|\bdie\b/i.test(`${n.text} ${n.detail ?? ""}`), `${n.id}: ${n.text}`);
      }
      for (const n of d.notes.filter((x) => x.notCounted)) {
        uncountedSeen++;
        assert.equal(n.layer, "planet", n.id);
        assert.notEqual(n.tone, "mixed", n.id);
        assert.ok(combust, `${n.id} is marked only when the lord is combust`);
      }
      assert.deepEqual(d.lean, leanOf(countedTones(d.notes)), `${d.lord} on chart ${i}`);
    }
  }
  assert.ok(combustSeen > 50 && softened > 10 && vargottamaSeen > 20 && uncountedSeen > 3, `${combustSeen} ${softened} ${vargottamaSeen} ${uncountedSeen}`);
});

test("the report keeps Mantreswara's combustion line beside a line shown but not counted", async () => {
  const { reportPeriodLines } = await import("@shared/report/parashari");
  // The Mars case above: its ch. 47 line is shown but not counted, and 20.57 comes later in the list.
  const { readings } = read(
    { Sun: 32, Moon: 70, Mars: 25, Mercury: 40, Jupiter: 160, Venus: 300, Saturn: 345, Rahu: 130, Ketu: 310 },
    0,
  );
  const d = of(readings, "Mars");
  const lines = reportPeriodLines(d);
  assert.ok(lines.some((n) => n.notCounted), lines.map((n) => n.id).join(", "));
  assert.ok(lines.some((n) => n.id === "Mars-pd-20-57"), lines.map((n) => n.id).join(", "));
  assert.ok(lines.length <= 7);
  // Without a line shown but not counted, the report keeps its first six.
  const plainD = { ...d, notes: d.notes.map((n) => ({ ...n, notCounted: undefined })) };
  assert.deepEqual(
    reportPeriodLines(plainD).map((n) => n.id),
    d.notes.filter((n) => n.layer !== "condition").slice(0, 6).map((n) => n.id),
  );
});
