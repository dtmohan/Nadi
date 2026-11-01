import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { computeGochara } from "@shared/gochara";
import { insertChartSchema } from "@shared/schema";
import { julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { comparisonDates, midrank, observe, offsetsFor, researchFrame } from "./moon-gochara-research";

const chart = insertChartSchema.parse({ name: "Test", birthDate: "1980-02-27", birthTime: "23:24", timezone: "America/Chicago",
  place: "Little Rock", latitude: 34.75, longitude: -92.2833, ayanamsa: "lahiri", nodeType: "mean" });

test("comparison dates are deterministic, distinct, in the declared band, and keep valid local clocks", () => {
  const event = { id: "test", matter: "marriage", date: "2010-07-31", time: "01:30", timezone: "America/New_York" };
  const one = comparisonDates(chart, event, "test"), two = comparisonDates(chart, event, "test");
  assert.deepEqual(one, two);
  assert.equal(one.length, 200);
  assert.equal(new Set(one.map((x) => x.date)).size, 200);
  assert.ok(one.every(({ offset }) => Math.abs(offset) >= 8 && Math.abs(offset) <= 365));
  // A November 01:30 fall-back fold must never be silently treated as a definite moment.
  assert.ok(!one.some((x) => x.date === "2010-11-07"));
  const offsets = offsetsFor("test");
  assert.equal(new Set(offsets).size, 716);
  assert.deepEqual([...offsets].sort((a, b) => a - b), [...Array.from({ length: 358 }, (_, i) => i - 365), ...Array.from({ length: 358 }, (_, i) => i + 8)]);
});

test("midrank credits half of tied controls, including when every score ties", () => {
  const cmp = (a: number, b: number) => a - b;
  assert.equal(midrank(1, [0, 1, 1, 2], cmp), 0.5);
  assert.equal(midrank(1, [1, 1, 1], cmp), 0.5);
  assert.equal(midrank(2, [0, 1, 2, 2], cmp), 0.75);
});

test("lite transit sky agrees with full sky for all full gochara verdicts", () => {
  const at = DateTime.fromISO("2014-09-26T19:03", { zone: "America/New_York" }).toUTC();
  const frame = researchFrame(chart), jd = julianDay(at);
  const full = computeGochara(frame.moon.signIndex, positionsAt(jd, frame.opts), at.toISO()!, false, { ownMarks: frame.ownMarks });
  const lite = computeGochara(frame.moon.signIndex, positionsLite(jd, frame.opts), at.toISO()!, false, { ownMarks: frame.ownMarks });
  assert.deepEqual(lite.rows.map((r) => [r.planet, r.house, r.favourable, r.verdict, r.avMarks, r.vedhaBy]),
    full.rows.map((r) => [r.planet, r.house, r.favourable, r.verdict, r.avMarks, r.vedhaBy]));
});

test("same natal Moon sign keeps house-only results unchanged across birth candidates", () => {
  const a = researchFrame(chart), b = researchFrame({ ...chart, birthTime: "22:24" });
  assert.equal(a.moon.signIndex, b.moon.signIndex);
  const event = { id: "test", matter: "marriage", date: "2010-07-31", time: "18:00", timezone: "America/New_York" };
  const x = observe(a, event), y = observe(b, event);
  assert.deepEqual([x.jupiter.house, x.saturn.house, x.jupiter.houseFavourable, x.saturn.houseFavourable],
    [y.jupiter.house, y.saturn.house, y.jupiter.houseFavourable, y.saturn.houseFavourable]);
  // The full verdict can still vary: the ascendant participates in Ashtakavarga.
});
