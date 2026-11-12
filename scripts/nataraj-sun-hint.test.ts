import test from "node:test";
import assert from "node:assert/strict";
import { NATARAJ_SUN_HINT_SCOPE, RECTIFY_METHODS, methodScore } from "../shared/rectify-methods";
import type { RectifySegment } from "../shared/rectify-types";

test("Nataraj's broad hint is distinguished from the app's equality and weighting", () => {
  const transit = RECTIFY_METHODS.find((m) => m.id === "kp-transit");
  assert.ok(transit);
  assert.match(transit.source, /Part 2, p\. 192/);
  assert.match(transit.short, /Nataraj.*does not specify an equality test or weights/);
  assert.match(NATARAJ_SUN_HINT_SCOPE, /equality test and 2:1 weights are the app's interpretation/);
  assert.match(NATARAJ_SUN_HINT_SCOPE, /separate from the event-transit score and comparison/);
});

test("changing the Sun hint leaves the KP event-transit score unchanged", () => {
  const segment = {
    events: [{ transit: { score: 2, max: 4 } }],
    sunHint: { star: false, sub: false, score: 0, max: 3 },
  } as unknown as RectifySegment;
  const before = methodScore(segment, "kp-transit");
  segment.sunHint = { star: true, sub: true, score: 3, max: 3 };
  assert.deepEqual(methodScore(segment, "kp-transit"), before);
  assert.deepEqual(before, { score: 2, max: 4 });
});
