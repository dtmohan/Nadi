import test from "node:test";
import assert from "node:assert/strict";
import { ramanBirthStarDiagnostic } from "../shared/raman-birth-star-diagnostic";

test("Raman's stated 33 ghatis 53 vighatis produces Mrigasira, but conflicts with his stated clock interval", () => {
  const result = ramanBirthStarDiagnostic(2033 * 24, 0, 4);
  assert.deepEqual(result, { status: "match", elapsedVighatis: 2033, remainder: 5, possibleStarIndexes: [4, 13, 22] });
  assert.equal(ramanBirthStarDiagnostic(2033 * 24, 0, 7).status, "mismatch");
  assert.deepEqual(ramanBirthStarDiagnostic(13 * 3600 + 17 * 60 + 12, 0, 4),
    { status: "mismatch", elapsedVighatis: 1993, remainder: 7, possibleStarIndexes: [6, 15, 24] });
});

test("a pre-sunrise birth must use the actual preceding sunrise", () => {
  // Kedar, Predictive Astrology, section 6.2: 03:30 after a preceding 06:12 sunrise.
  const precedingSunrise = 6 * 3600 + 12 * 60;
  const birth = 24 * 3600 + 3 * 3600 + 30 * 60;
  assert.deepEqual(ramanBirthStarDiagnostic(birth, precedingSunrise, 18), { status: "inconclusive", reason: "zero-remainder" });
  assert.equal(ramanBirthStarDiagnostic(birth - 48, precedingSunrise, 18).status, "match");
  assert.deepEqual(ramanBirthStarDiagnostic(birth, precedingSunrise + 24 * 3600, 18), { status: "inconclusive", reason: "invalid-input" });
});

test("unresolved fractional and zero-remainder inputs and missing sunrise never become a match", () => {
  assert.deepEqual(ramanBirthStarDiagnostic(2033 * 24 + 0.01, 0, 4), { status: "inconclusive", reason: "fractional-vighati" });
  assert.deepEqual(ramanBirthStarDiagnostic(2033 * 24 - 0.01, 0, 4), { status: "inconclusive", reason: "fractional-vighati" });
  assert.deepEqual(ramanBirthStarDiagnostic(0, 0, 0), { status: "inconclusive", reason: "zero-remainder" });
  assert.deepEqual(ramanBirthStarDiagnostic(100, null, 0), { status: "inconclusive", reason: "missing-sunrise" });
  assert.deepEqual(ramanBirthStarDiagnostic(NaN, 0, 0), { status: "inconclusive", reason: "invalid-input" });
  assert.deepEqual(ramanBirthStarDiagnostic(100, 0, 27), { status: "inconclusive", reason: "invalid-input" });
});
