import assert from "node:assert/strict";
import { test } from "node:test";
import { DateTime } from "luxon";
import { insertChartSchema } from "@shared/schema";
import { methodScore } from "@shared/rectify-methods";
import { nashtaNakshatra } from "@shared/brihat-jataka";
import { ascendantAt, julianDay, positionsLite } from "../server/ephemeris";
import { bjNashtaCheck, rectify } from "../server/rectify";
import { registerRoutes } from "../server/routes";

const chart = insertChartSchema.parse({ name: "Synthetic query", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean", events: [] });
const judge = { latitude: 51.5072, longitude: -0.1276, timezone: "Europe/London", label: "London" };
const query = "2022-05-14T09:45:00Z";
const base = { chart, windowMinutes: 1, events: [], includeComparisons: false, judgedAsOf: "2026-11-01T12:00:00Z" };

test("lost horoscope compares the exact birth star, including at boundaries, never its trine", () => {
  const inferred = nashtaNakshatra(25, []);
  const width = 360 / 27;
  const match = bjNashtaCheck(25, inferred * width + 0.001, []);
  assert.equal(match.exact, true);
  assert.equal(bjNashtaCheck(25, ((inferred + 9) % 27) * width + 0.001, []).exact, false);
  assert.equal(bjNashtaCheck(25, ((inferred + 26) % 27) * width + width - 0.001, []).exact, false);
  assert.equal(bjNashtaCheck(25, inferred * width + width - 0.001, []).exact, true);
});

test("nodes in the question ascendant do not receive an invented Graha factor", () => {
  const lagna = 25;
  const classical = [{ planet: "Jupiter", signIndex: 0 }];
  const withNodes = [...classical, { planet: "Rahu", signIndex: 0 }, { planet: "Ketu", signIndex: 0 }];
  const expected = nashtaNakshatra(lagna, ["Jupiter"]);
  // A factor of five for either node would alter this particular answer.
  assert.notEqual(expected, nashtaNakshatra(lagna, ["Jupiter", "Sun"]));
  assert.equal(bjNashtaCheck(lagna, 0, withNodes).nakshatra, expected);
  assert.equal(bjNashtaCheck(lagna, 0, classical).nakshatra, expected);
});

test("explicit question instant and place are both required and are replayed independently of KP judgment", () => {
  for (const req of [base, { ...base, judge }, { ...base, bjQueryAsOf: query }]) {
    const out = rectify(req);
    assert.equal(out.bjQueryAsOf, undefined);
    assert.ok(out.segments.every((s) => !s.bjNashta && methodScore(s, "bj-nashta").max === 0));
  }
  const out = rectify({ ...base, judge, bjQueryAsOf: query });
  const replay = rectify({ ...base, judge, bjQueryAsOf: query, judgedAsOf: "2024-01-01T00:00:00Z" });
  const jd = julianDay(DateTime.fromISO(query).toUTC());
  const opts = { ayanamsa: "lahiri" as const, nodeType: "mean" as const };
  const lagna = ascendantAt(jd, judge.latitude, judge.longitude, opts);
  const expected = nashtaNakshatra(lagna, positionsLite(jd, opts).filter((p) => p.signIndex === Math.floor(lagna / 30)).map((p) => p.planet));
  assert.ok(out.segments.length > 0);
  assert.ok(out.segments.every((s) => s.bjNashta?.nakshatra === expected));
  assert.deepEqual(out.segments.map((s) => s.bjNashta), replay.segments.map((s) => s.bjNashta));
  assert.equal(DateTime.fromISO(out.bjQueryAsOf!).toMillis(), DateTime.fromISO(query).toMillis());
  const first = out.segments[0];
  assert.deepEqual(methodScore({ ...first, bjNashta: { ...first.bjNashta!, basis: undefined, trine: true } }, "bj-nashta"), { score: 0, max: 0 });
  assert.deepEqual(methodScore({ ...first, bjNashta: { ...first.bjNashta!, intervalStable: false } }, "bj-nashta"), { score: 0, max: 0 });
});

test("live rectification endpoint retains the explicit question instant", async () => {
  const handlers = new Map<string, (req: any, res: any) => void>();
  const app = { post: (path: string, fn: (req: any, res: any) => void) => { handlers.set(path, fn); }, get: () => {} };
  await registerRoutes({} as Parameters<typeof registerRoutes>[0], app as unknown as Parameters<typeof registerRoutes>[1]);
  const response: { status: number; body?: any } = { status: 200 };
  const res = { status: (status: number) => { response.status = status; return res; }, vary: () => res, json: (body: unknown) => { response.body = body; return res; } };
  handlers.get("/api/kp/rectify")!({ body: { ...base, judge, bjQueryAsOf: query }, headers: {} }, res);
  assert.equal(response.status, 200);
  assert.equal(DateTime.fromISO(response.body.bjQueryAsOf).toMillis(), DateTime.fromISO(query).toMillis());
  assert.ok(response.body.segments.every((s: any) => s.bjNashta?.basis === "query-26.9-10"));
});

test("quick and random-date comparison scans use the same question and birth-star check", () => {
  const events = [
    { label: "Marriage", matter: "marriage", date: "2012-03-11", houses: [2, 7, 11], cusp: 7 },
    { label: "Job", matter: "job", date: "2021-06-01", houses: [2, 6, 10, 11], cusp: 10 },
  ];
  const req = { ...base, judge, bjQueryAsOf: query, events };
  const quick = rectify({ ...req, includeComparisons: false });
  const full = rectify({ ...req, includeComparisons: true });
  assert.ok(full.baseline);
  assert.deepEqual(quick.segments.map((s) => s.bjNashta), full.segments.map((s) => s.bjNashta));
});
