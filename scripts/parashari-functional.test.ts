import test from "node:test";
import assert from "node:assert/strict";
import { functionalFrame, functionalObservation } from "@shared/parashari-functional";
import type { ManleyEvidence, ManleyFrame } from "@shared/manley-evidence";
import type { Planet } from "@shared/astro";
import { summarizeParashariComparisons } from "@shared/parashari-comparison";

test("Saturn changes functional role and house across Libra/Scorpio while keeping its sign dignity", () => {
  const libra = functionalFrame("Saturn", 6, 6, 5, () => []);
  const scorpio = functionalFrame("Saturn", 7, 6, 5, () => []);
  assert.deepEqual({ owns: libra.owns, nature: libra.classification, dignity: libra.dignity, house: libra.house },
    { owns: [4, 5], nature: "yogakaraka", dignity: "exaltation sign", house: 1 });
  assert.deepEqual({ owns: scorpio.owns, nature: scorpio.classification, dignity: scorpio.dignity, house: scorpio.house },
    { owns: [3, 4], nature: "malefic", dignity: "exaltation sign", house: 12 });
  assert.equal(libra.directMatterLord, true);
  assert.equal(scorpio.directMatterLord, false);
});

test("nodes and conditional yoga-pair members do not inherit an independent favourable classification", () => {
  const rahu = functionalFrame("Rahu", 6, 6, 5, () => []);
  assert.deepEqual(rahu.owns, []);
  assert.equal(rahu.classification, "unclassified");
  assert.equal(rahu.dignity, "not graded");
  const sun = functionalFrame("Sun", 7, 6, 10, () => ["Sun and Moon share a sign"]);
  assert.equal(sun.classification, "unclassified");
  assert.equal(sun.yogaPair?.partner, "Moon");
  assert.ok(sun.directMatterLord);
});

test("direct-lord diagnostic counts distinct planets and requires lordship and favourable classification in the same frame", () => {
  const f = (planet: Planet, asc: number, sign: number, house = 5) =>
    ({ functional: functionalFrame(planet, asc, sign, house, () => []) } as ManleyFrame);
  const event = { matter: "child", periods: [
    { level: "dasa", planet: "Saturn", frames: [f("Saturn", 6, 6), f("Saturn", 7, 6)] },
    { level: "bhukti", planet: "Saturn", frames: [f("Saturn", 6, 6), f("Saturn", 7, 6)] },
  ], antara: { level: "antara", planet: "Jupiter", frames: [f("Jupiter", 7, 8), f("Jupiter", 7, 8)] } } as unknown as ManleyEvidence;
  assert.equal(functionalObservation(event), 1, "same planet at two levels is counted once");
  assert.equal(functionalObservation(event, "unfavourable"), undefined);
  assert.equal(functionalObservation(event, "mixed"), undefined);
  const noMixedFrames = { ...event, periods: [
    { level: "dasa", planet: "Saturn", frames: [f("Saturn", 7, 6, 4), f("Saturn", 6, 6, 10)] },
    { level: "bhukti", planet: "Rahu", frames: [f("Rahu", 6, 6), f("Rahu", 7, 6)] },
  ] } as unknown as ManleyEvidence;
  assert.equal(functionalObservation(noMixedFrames), 0, "lordship in a malefic frame does not borrow the other frame's label");
  assert.equal(functionalObservation({ ...event, matter: "move" }), undefined, "a default mixed event is not scored");
  assert.equal(functionalObservation({ ...event, matter: "move" }, "favourable"), 1);
  const missingFrame = { ...event, periods: [event.periods[0],
    { ...event.periods[1], frames: [event.periods[1].frames[0], {}] }] } as unknown as ManleyEvidence;
  assert.equal(functionalObservation(missingFrame), undefined, "missing evidence is not turned into a zero");
});

test("functional random comparison becomes unavailable if any eligible trial loses evidence", () => {
  const comparison = summarizeParashariComparisons([{ functional: 1 }], [[{ functional: 1 }], [{}]]);
  assert.equal(comparison.functional, undefined);
  assert.ok(comparison.unavailable?.includes("functional"));
});
