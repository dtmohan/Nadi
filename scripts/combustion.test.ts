// Combustion distances (C1) and transit combustion (T1). The Surya Siddhanta table in shared/combustion.ts is shared by
// the Parashari rule (vargas.ts) and the transit rules (gochara.ts); BNN keeps its 3°20' flag on the position.
// Synthetic positions isolate each rule; one calendar case uses the ephemeris.
//
// Run from the repository root: `npm test`.

import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";

import { SIGNS, SIGN_LORD, NAKSHATRAS, COMBUSTION_ORB_DEG, type Dignity, type Planet, type PlanetPosition } from "@shared/astro";
import { SS_COMBUST_ORB, SS_NOTE_DIFFERENCE, ssCombust, ssCombustOrb, sunDistance } from "@shared/combustion";
import { parashariCombust, parashariCombustOrb } from "@shared/vargas";
import { computeGochara, GOCHARA_CAVEATS } from "@shared/gochara";
import { gocharaCalendar } from "../server/gochara-calendar";
import { julianDay, positionsAt } from "../server/ephemeris";

function P(planet: Planet, lon: number, opts: { retrograde?: boolean; dignity?: Dignity } = {}): PlanetPosition {
  const l = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(l / 30);
  const nak = Math.floor(l / (360 / 27));
  return {
    planet,
    lon: l,
    signIndex,
    sign: SIGNS[signIndex],
    degInSign: l - signIndex * 30,
    speed: opts.retrograde ? -0.1 : 0.1,
    retrograde: !!opts.retrograde,
    nakshatraIndex: nak,
    nakshatra: NAKSHATRAS[nak],
    nakshatraLord: "Ketu",
    pada: 1,
    dignity: opts.dignity ?? "Neutral",
    combust: false,
    signLord: SIGN_LORD[signIndex],
  };
}

const SEVEN_BUT_SUN: Planet[] = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

test("C1: the Surya Siddhanta distances, with Saturn at 15 (9.6) and no retrograde figure for the outer planets", () => {
  assert.deepEqual(SS_COMBUST_ORB.Saturn, [15, 15]);
  assert.deepEqual(SS_COMBUST_ORB.Jupiter, [11, 11]);
  assert.deepEqual(SS_COMBUST_ORB.Mars, [17, 17]);
  assert.deepEqual(SS_COMBUST_ORB.Venus, [10, 8]);
  assert.deepEqual(SS_COMBUST_ORB.Mercury, [14, 12]);
  assert.deepEqual(SS_COMBUST_ORB.Moon, [12, 12]);
  for (const pl of ["Sun", "Rahu", "Ketu"] as Planet[]) {
    assert.equal(ssCombustOrb(P(pl, 100)), undefined);
    assert.equal(ssCombust(P(pl, 100), 100), false);
  }
  // The practitioner detail records where the table departs from the translator's note under BPHS 7.28-29.
  assert.ok(SS_NOTE_DIFFERENCE.includes("16°") && SS_NOTE_DIFFERENCE.includes("15°"));
});

test("C1: the Parashari rule reads the same table; Saturn is combust inside 15°, not at 15.5°", () => {
  const sun = 100;
  assert.equal(parashariCombust(P("Saturn", sun + 14.9), sun), true);
  assert.equal(parashariCombust(P("Saturn", sun - 15.5), sun), false); // the note's 16° counted this
  assert.equal(parashariCombustOrb(P("Mars", sun + 180, { retrograde: true })), 17);
  for (const pl of SEVEN_BUT_SUN)
    for (const retrograde of [false, true])
      assert.equal(parashariCombustOrb(P(pl, 10, { retrograde })), ssCombustOrb(P(pl, 10, { retrograde })));
  // Distances wrap at 0°.
  assert.equal(sunDistance(P("Venus", 355), 3), 8);
  assert.equal(ssCombust(P("Venus", 355, { retrograde: true }), 3), true);
  assert.equal(ssCombust(P("Venus", 354.5, { retrograde: true }), 3), false);
  assert.equal(ssCombust(P("Venus", 354.5), 3), true);
});

test("BNN keeps 3°20': the position's own combust flag is not the Surya Siddhanta rule", () => {
  assert.ok(Math.abs(COMBUSTION_ORB_DEG - 10 / 3) < 1e-9);
});

test("T1: transit combustion is measured from the transiting Sun by the Surya Siddhanta distances", () => {
  // Moon in Aries; Jupiter in the 11th from it (Aquarius), a favourable house (PD 26).
  const sun = 10 * 30 + 5;
  const at = (ju: PlanetPosition) =>
    computeGochara(0, [P("Sun", sun), ju], "2026-01-01").rows.find((x) => x.planet === "Jupiter")!;
  // 9° from the Sun: combust by 11°, though outside the Nadi 3°20' (the position's own flag stays false).
  const near = at(P("Jupiter", sun + 9));
  assert.equal(near.combust, true);
  assert.ok(near.dignityNote?.text.includes("combust"));
  assert.equal(near.voided, "good");
  assert.notEqual(near.verdict, "favourable");
  // 12° from the Sun: clear, and the house's good stands.
  const far = at(P("Jupiter", sun + 12));
  assert.equal(far.combust, false);
  assert.equal(far.dignityNote, undefined);
  assert.equal(far.verdict, "favourable");
});

test("T1: retrograde distances apply; the Moon counts; the Sun and the nodes never do; no Sun, no combustion", () => {
  const sun = 40;
  const rows = computeGochara(
    0,
    [
      P("Sun", sun),
      P("Venus", sun + 9, { retrograde: true }), // outside 8°
      P("Mercury", sun - 11, { retrograde: true }), // inside 12°
      P("Moon", sun + 11), // inside 12°
      P("Rahu", sun + 1),
      P("Ketu", sun + 181),
    ],
    "2026-01-01",
  ).rows;
  const by = (pl: Planet) => rows.find((r) => r.planet === pl)!;
  assert.equal(by("Venus").combust, false);
  assert.equal(by("Mercury").combust, true);
  assert.equal(by("Moon").combust, true);
  assert.equal(by("Sun").combust, false);
  assert.equal(by("Rahu").combust, false);
  assert.equal(by("Ketu").combust, false);
  const noSun = computeGochara(0, [P("Jupiter", 305)], "2026-01-01").rows[0];
  assert.equal(noSun.combust, false);
});

test("T1: the caveat calls the distances the app's choice and provisional, and keeps BNN's 3°20' apart", () => {
  const c = GOCHARA_CAVEATS.join(" ");
  assert.ok(c.includes("Surya Siddhanta distances (9.6-9"));
  assert.ok(c.includes("app's choice") && c.includes("provisional"));
  assert.ok(c.includes("3°20'"));
  assert.ok(!c.includes("Nadi combustion orb (3°20')"));
});

test("T1: the calendar's combust flag follows the transit rule, not the Nadi flag (Jupiter, June 2025)", () => {
  // Jupiter met the Sun on 24 June 2025. From 12 to 17 June it was 9.2° to 5.6° away: combust by the
  // Surya Siddhanta's 11°, outside the Nadi 3°20'. The distance does not depend on the ayanamsa.
  const opts = { ayanamsa: "lahiri", nodeType: "mean" as const };
  const jd0 = julianDay(DateTime.fromISO("2025-06-12T00:00:00Z", { zone: "utc" }));
  const jd1 = jd0 + 5;
  for (let jd = jd0; jd <= jd1; jd++) {
    const pos = positionsAt(jd, opts);
    const ju = pos.find((p) => p.planet === "Jupiter")!;
    assert.equal(ju.combust, false);
    assert.equal(ssCombust(ju, pos.find((p) => p.planet === "Sun")!.lon), true);
  }
  const segs = gocharaCalendar(0, jd0, jd1, opts).planets.find((p) => p.planet === "Jupiter")!.segments;
  assert.ok(segs.length > 0);
  assert.ok(segs.every((s) => s.combust));
});
