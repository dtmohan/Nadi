import test from "node:test";
import assert from "node:assert/strict";
import { NAKSHATRAS, SIGNS, SIGN_LORD, type PlanetPosition, type TransitPeriod } from "@shared/astro";
import type { AshtakavargaResult } from "@shared/ashtakavarga";
import { computeAvTimeline } from "@shared/av-transit";
import { computeGochara } from "@shared/gochara";

const jupiter: PlanetPosition = {
  planet: "Jupiter", lon: 135, signIndex: 4, sign: SIGNS[4], degInSign: 15,
  speed: 0.1, retrograde: false, nakshatraIndex: Math.floor(135 / (360 / 27)),
  nakshatra: NAKSHATRAS[Math.floor(135 / (360 / 27))], nakshatraLord: "Ketu", pada: 1,
  dignity: "Friendly", combust: false, signLord: SIGN_LORD[4],
};
const from = "2026-01-01T00:00:00.000Z", to = "2027-01-01T00:00:00.000Z";
const passage = [{ planet: "Jupiter", signIndex: 4, start: from, end: to, retrogradeEntry: false }] as TransitPeriod[];
const marks = Array.from({ length: 12 }, () => 3);
const av = {
  charts: ["Sun", "Jupiter", "Saturn"].map((owner) => ({ owner, rekhas: marks, givers: Array.from({ length: 12 }, () => []) })),
  sarva: Array.from({ length: 12 }, () => 20), band: Array.from({ length: 12 }, () => "adverse"),
  saturnPoints: [], distressYears: { lagnaToSaturn: 1, saturnToLagna: 1 },
} as unknown as AshtakavargaResult;

test("Moon-based gochara and sign-based Ashtakavarga keep their reference frames distinct", () => {
  // Aries natal Moon: Jupiter in Leo is fifth and favourable. Gemini ascendant: Leo is third.
  const moonReading = computeGochara(0, [jupiter], from).rows[0];
  assert.equal(moonReading.house, 5);
  assert.equal(moonReading.verdict, "favourable");
  const lagnaReading = computeAvTimeline(av, 2, passage, undefined, "1990-01-01T00:00:00.000Z", from).jupiter[0];
  assert.equal(lagnaReading.house, 3);
  assert.equal(lagnaReading.tone, "strain", "the sign has three own marks and an adverse aggregate");
  assert.match(lagnaReading.notes[1].text, /3rd house from the natal ascendant/);

  // Hold the entire natal Ashtakavarga table fixed and change only the displayed reference.
  const changedReference = computeAvTimeline(av, 3, passage, undefined, "1990-01-01T00:00:00.000Z", from).jupiter[0];
  assert.equal(changedReference.house, 2);
  assert.equal(changedReference.tone, lagnaReading.tone);
  assert.equal(changedReference.ownRekhas, lagnaReading.ownRekhas);
  assert.equal(changedReference.sarva, lagnaReading.sarva);
  // Changing the Moon anchor while keeping the same sky changes the gochara house and grade.
  const otherMoon = computeGochara(2, [jupiter], from).rows[0];
  assert.equal(otherMoon.house, 3);
  assert.equal(otherMoon.verdict, "unfavourable");
});
