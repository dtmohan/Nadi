import assert from "node:assert/strict";
import test from "node:test";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema } from "@shared/schema";
import { buildReport } from "@shared/report";
import type { RectifyMethod } from "@shared/rectify-methods";
import { rectify } from "../server/rectify";
import { computeChart } from "../server/routes";

const events: ChartEvent[] = [
  { id: "marriage", matter: "marriage", date: "2012-03-11", time: "11:15", timezone: "America/New_York" },
  { id: "child", matter: "child", date: "2018-07-22", time: "15:30", timezone: "America/Los_Angeles" },
  { id: "job", matter: "job", date: "2021-06-01", timezone: "America/Los_Angeles" },
];
const chart = insertChartSchema.parse({ name: "Synthetic quick scan", gender: "female", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", parashariHouseMethod: "equal", events });
const requestedEvents = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
const request = { chart, windowMinutes: 1, events: requestedEvents, judgedAsOf: "2026-11-01T12:00:00Z" };

test("quick scan skips only comparisons and preserves all candidate and event results", () => {
  // Omission remains the backward-compatible full scan.
  const full = rectify(request);
  const quick = rectify({ ...request, includeComparisons: false });
  assert.equal(full.baseline?.trials, 200);
  assert.equal(quick.baseline, null);
  assert.ok(full.segments.every((s) => s.baseline));
  assert.ok(quick.segments.every((s) => s.baseline === undefined));
  assert.ok(full.segments.every((s) => s.kpMatched));
  assert.ok(quick.segments.every((s) => s.kpMatched === undefined));
  const withoutBaseline = (segments: typeof full.segments) => segments.map(({ baseline: _ignored, kpMatched: _matched, alpMatched: _alp, ...s }) => s);
  assert.deepEqual(withoutBaseline(quick.segments), withoutBaseline(full.segments));
  const withoutExamples = (transits: NonNullable<typeof full.eventTransits>) => transits.map(({ example: _ignored, ...e }) => e);
  assert.deepEqual(withoutExamples(quick.eventTransits!), withoutExamples(full.eventTransits!));
  assert.ok(full.eventTransits!.every((e) => e.example));
  assert.ok(quick.eventTransits!.every((e) => !e.example));
  assert.deepEqual(quick.vargaWindows, full.vargaWindows);
  assert.deepEqual(quick.kundaD81, full.kundaD81);

  const computed = computeChart({ ...chart, id: 0, gender: "female", timeStandard: "auto", ayanamsa: "lahiri", nodeType: "mean",
    sunriseDef: "edge", parashariHouseMethod: "equal", notes: "", deathDate: null, timeUncertaintyMin: 0, events });
  for (const method of ["parashari-events-v3", "kp-qualified", "parashari-events-v4", "alp-marriage", "bnn-marriage"] as RectifyMethod[]) {
    const state = { method, windowMinutes: 1, events: requestedEvents, confirmedMarks: [], includeComparisons: false };
    const report = buildReport(computed, { plain: false, modules: ["rectify"], tools: { rectify: { result: quick, state } } });
    assert.match(JSON.stringify(report.sections), /Quick scan: random-date comparisons were not computed/, method);
    assert.match(JSON.stringify(report.sections), /date-independent clues count once per candidate and matter/, method);
  }
});

test("deprecated API totals use a named single-method basis without events", () => {
  const scan = rectify({ ...request, events: [], includeComparisons: false });
  assert.equal(scan.legacyScoreBasis, "kp-rp-basic");
  assert.ok(scan.segments.every((s) => s.score === s.rp.score && s.max === s.rp.max));
  assert.ok(scan.best.every((i) => scan.segments[i].score === Math.max(...scan.segments.map((s) => s.rp.score))));
});
