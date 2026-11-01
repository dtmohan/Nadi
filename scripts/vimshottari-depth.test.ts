import assert from "node:assert/strict";
import test from "node:test";
import { vimshottariLordsAt } from "../shared/kp";
import { vimshottariPathAt } from "../shared/vimshottari-depth";

test("nested periods agree with Nadi's existing three-level path across longitudes and dates", () => {
  const birthMs = Date.parse("1990-01-01T02:00:00Z");
  for (const moonLon of [0, 0.5, 13.333, 47, 137.1, 210, 359.999]) {
    for (const years of [0, 1, 13, 29, 65, 119, 130, 250]) {
      const eventMs = birthMs + years * 365.25 * 86_400_000;
      const existing = vimshottariLordsAt(moonLon, new Date(birthMs).toISOString(), new Date(eventMs).toISOString());
      const path = vimshottariPathAt(moonLon, birthMs, eventMs, 6);
      assert.deepEqual(path.slice(0, 3).map((p) => p.lord), existing);
      assert.equal(path.length, 6);
      path.forEach((p, i) => {
        assert.ok(p.startMs <= eventMs && eventMs < p.endMs);
        if (i) assert.ok(p.startMs >= path[i - 1].startMs && p.endMs <= path[i - 1].endMs + 1);
      });
    }
  }
});

test("fifth-level boundary changes the nested lord without changing its parent", () => {
  const birthMs = Date.parse("2000-01-01T00:00:00Z");
  const first = vimshottariPathAt(0, birthMs, birthMs + 1, 5);
  assert.deepEqual(first.map((p) => p.lord), ["Ketu", "Ketu", "Ketu", "Ketu", "Ketu"]);
  const boundary = first[4].endMs;
  const before = vimshottariPathAt(0, birthMs, boundary - 1, 5);
  const after = vimshottariPathAt(0, birthMs, boundary + 1, 5);
  assert.deepEqual(before.map((p) => p.lord), ["Ketu", "Ketu", "Ketu", "Ketu", "Ketu"]);
  assert.deepEqual(after.map((p) => p.lord), ["Ketu", "Ketu", "Ketu", "Ketu", "Venus"]);
});

test("nested period path rejects impossible inputs", () => {
  assert.throws(() => vimshottariPathAt(0, 1, 0), RangeError);
  assert.throws(() => vimshottariPathAt(0, 0, 1, 7), RangeError);
  assert.throws(() => vimshottariPathAt(NaN, 0, 1), RangeError);
});
