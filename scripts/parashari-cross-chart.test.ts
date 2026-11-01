import assert from "node:assert/strict";
import test from "node:test";
import { describePosition, SIGNS } from "@shared/astro";
import { manleyEvidence } from "@shared/manley-evidence";
import { createParashariHierarchyScorer } from "@shared/parashari-hierarchy";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";

const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
const evidenceInput = { label: "Childbirth illustration", date: "1949-01-01", matter: "child" };

test("Manley's Raman example retains the D1 fifth lord in D7 even without its primary links", () => {
  // Manley, Birth Time Rectification, capture pp. 65–67 and 132–133. The
  // illustrative period lords are supplied deliberately; this is a rule and
  // chart transcription check, not a claim about this synthetic event date.
  const chart = { birthDate: "1912-08-08", birthTime: "19:42", timezone: "Asia/Kolkata",
    timeStandard: "auto", latitude: 12.9833, longitude: 77.5833 } as Parameters<typeof birthInstant>[0];
  const jd = julianDay(birthInstant(chart).utc);
  const natal = positionsAt(jd, opts), asc = ascendantAt(jd, chart.latitude!, chart.longitude!, opts);
  const ev = manleyEvidence(evidenceInput, natal, asc, ["Jupiter", "Mercury", "Saturn"])!;
  const d7 = ev.periods[1].frames[1];
  assert.equal(ev.periods[1].frames[0].houseLord, "Mercury");
  assert.deepEqual(Object.values(d7.primary).flat(), []);
  assert.ok(d7.supporting.natalHouseLord.some((s) => s.includes("Mercury is the D1 house 5 lord")));
  const result = createParashariHierarchyScorer(natal, asc)(ev)!;
  assert.equal(result.passes.d1, false, "the old strict screen stops here");
  assert.equal(result.crossChart!.periods[1].linked, true, "the natal fifth-lord clue survives in D7");
  assert.equal(result.crossChart!.timing.first, true);
});

test("a D1 house lord in an enemy sign and its own divisional sign remain visible together", () => {
  const chart = { birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata",
    timeStandard: "auto", latitude: 12.9716, longitude: 77.5946 } as Parameters<typeof birthInstant>[0];
  const jd = julianDay(birthInstant(chart).utc);
  const natal = positionsAt(jd, opts).map((p) => p.planet === "Jupiter" ? describePosition("Jupiter", 201.5, 0) : p);
  const asc = 215; // Scorpio: Jupiter rules the D1 fifth; 201.5° is in Libra and Pisces D7.
  const ev = manleyEvidence(evidenceInput, natal, asc, ["Jupiter", "Mercury", "Saturn"])!;
  const result = createParashariHierarchyScorer(natal, asc)(ev)!;
  const jupiter = result.crossChart!.planets.find((p) => p.roles.includes("D1 house lord"))!;
  assert.equal(jupiter.planet, "Jupiter");
  assert.equal(SIGNS[jupiter.d1.sign], "Libra");
  assert.equal(jupiter.d1.relation, "enemy");
  assert.equal(SIGNS[jupiter.division.sign], "Pisces");
  assert.equal(jupiter.division.dignity, "own sign");
  assert.equal(result.crossChart!.planets.filter((p) => p.planet === "Jupiter").length, 1, "overlapping roles are not duplicate planets");
  assert.ok(jupiter.roles.includes("natural significator"));
});
