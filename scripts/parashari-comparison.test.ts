import assert from "node:assert/strict";
import test from "node:test";
import { summarizeParashariComparisons, type ParashariObservation } from "../shared/parashari-comparison";

const obs = (first: boolean, third: boolean, v1 = 0): ParashariObservation => ({
  v1, staged: { first, third: first && third },
});

test("third-stage comparisons condition each individual event on its own first stage", () => {
  const actual = [obs(true, true, 2), obs(true, false, 0), obs(false, true, 0)];
  const trials = [
    [obs(true, false, 1), obs(true, true, 0), obs(true, true, 0)],
    [obs(true, true, 2), obs(false, true, 0), obs(true, true, 0)],
    [obs(false, true, 2), obs(true, false, 0), obs(true, true, 0)],
  ];
  const result = summarizeParashariComparisons(actual, trials);
  assert.equal(result.v1?.actual, 2);
  assert.equal(result.staged?.first.actual, 2);
  assert.deepEqual(result.staged?.qualifyingDraws, [2, 2]);
  assert.equal(result.staged?.third?.actual, 1);
  assert.equal(result.staged?.third?.mean, 1);
  assert.equal(result.staged?.third?.sd, 0.7);
  assert.equal(result.staged?.third?.percentile, 50);
});

test("no third-level comparison is invented without an earlier match", () => {
  const result = summarizeParashariComparisons([obs(false, true)], [[obs(false, true)], [obs(true, true)]]);
  assert.equal(result.staged?.first.actual, 0);
  assert.deepEqual(result.staged?.qualifyingDraws, []);
  assert.equal(result.staged?.third, undefined);
});

test("third level is unavailable when one real event has no qualifying random date", () => {
  const result = summarizeParashariComparisons([obs(true, true)], [[obs(false, false)], [obs(false, false)]]);
  assert.deepEqual(result.staged?.qualifyingDraws, [0]);
  assert.equal(result.staged?.third, undefined);
});

test("an ineligible random event does not silently become a zero score", () => {
  const actual = [obs(true, true, 0)];
  const result = summarizeParashariComparisons(actual, [[obs(true, false, 1)], [{}]]);
  assert.equal(result.v1, undefined);
  assert.equal(result.staged, undefined);
  assert.deepEqual(result.unavailable, ["v1", "staged"]);
});
