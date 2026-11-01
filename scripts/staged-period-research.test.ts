import assert from "node:assert/strict";
import test from "node:test";
import { researchScore, researchTopIndices } from "../shared/staged-period-research";

const f = (...primary: boolean[]) => ({ primary });

test("a third-period match cannot count when either earlier period lacks a link", () => {
  const facts = [f(false, true, true), f(true, false, true), f(true, true, false), f(true, true, true)];
  assert.equal(researchScore(facts, "M3"), 9);
  assert.equal(researchScore(facts, "S2"), 2);
  assert.equal(researchScore(facts, "S3"), 1);
});

test("third-stage ranking refines the first-stage winners and retains ties", () => {
  const candidates = [
    [f(true, true, false), f(true, true, true)],
    [f(true, true, true), f(true, true, true)],
    [f(true, true, true), f(false, false, true)],
    [f(true, true, true), f(true, true, true)],
  ];
  assert.deepEqual(researchTopIndices(candidates, "S2"), [0, 1, 3]);
  assert.deepEqual(researchTopIndices(candidates, "S3"), [1, 3]);
});

test("when no event satisfies the first stage, the entire set remains tied", () => {
  const candidates = [[f(true, false, true)], [f(false, true, true)], [f(false, false, false)]];
  assert.deepEqual(researchTopIndices(candidates, "S3"), [0, 1, 2]);
});
