import assert from "node:assert/strict";
import test from "node:test";
import { vimshottari, vimshottariLordsAt, vimshottariLordsAtMs } from "../shared/kp";
import { Settings } from "luxon";
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

test("preparsed instants retain the same third-level lords across offsets and boundaries", () => {
  const birthIso = "1990-01-01T07:30:00.125+05:30", birthMs = Date.parse(birthIso);
  const eventIso = "2025-04-30T14:21:32.456-07:00", eventMs = Date.parse(eventIso), moon = 137.1;
  assert.deepEqual(vimshottariLordsAtMs(moon, birthMs, eventMs), vimshottariLordsAt(moon, birthIso, eventIso));
  const boundary = vimshottariPathAt(moon, birthMs, eventMs, 3)[2].endMs;
  for (const at of [Math.floor(boundary) - 50, Math.ceil(boundary) + 50]) {
    const fast = vimshottariLordsAtMs(moon, birthMs, at);
    assert.deepEqual(fast, vimshottariLordsAt(moon, birthIso, new Date(at).toISOString()));
    assert.deepEqual(fast, vimshottariPathAt(moon, birthMs, at, 3).map((p) => p.lord));
  }
});

test("nested period path rejects impossible inputs", () => {
  assert.throws(() => vimshottariPathAt(0, 1, 0), RangeError);
  assert.throws(() => vimshottariPathAt(0, 0, 1, 7), RangeError);
  assert.throws(() => vimshottariPathAt(NaN, 0, 1), RangeError);
});

test("display and fast period lords agree across time zones and exact boundaries", () => {
  const originalZone = Settings.defaultZone;
  const birth = "1900-01-01T00:00:00Z", birthMs = Date.parse(birth);
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Kolkata"]) {
      Settings.defaultZone = zone;
      for (const moon of [0, 23.333333333, 109.2, 359.99999]) for (const years of [5, 28, 108, 121]) {
        const asOf = new Date(birthMs + years * 365.25 * 86400000).toISOString();
        const display = vimshottari(moon, birth, asOf);
        assert.ok(display.current.dasa.current && display.current.bhukti.current && display.current.antara.current);
        const points = [Date.parse(asOf), ...display.antaras.flatMap((p) => [Date.parse(p.start) - 1, Date.parse(p.start), Date.parse(p.end) - 1, Date.parse(p.end)])];
        for (const ms of points) {
          if (ms < birthMs) continue;
          const moment = new Date(ms).toISOString();
          const v = vimshottari(moon, birth, moment);
          assert.deepEqual([v.current.dasa.lord, v.current.bhukti.lord, v.current.antara.lord],
            vimshottariLordsAt(moon, birth, moment), `${zone}: ${moon} at ${moment}`);
        }
      }
    }
  } finally { Settings.defaultZone = originalZone; }
  assert.throws(() => vimshottari(0, birth, "1899-12-31T23:59:59Z"), RangeError);
});
