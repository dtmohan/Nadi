import { test } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { methodScore } from "@shared/rectify-methods";
import { insertChartSchema } from "@shared/schema";
import { validateEvents } from "../server/validate";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { computeChart } from "../server/routes";
import { buildReport } from "@shared/report";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuroraEventPanel, AuroraV2Panel } from "../client/src/components/kp-aurora-evidence";

const events: ChartEvent[] = [
  { id: "marriage", matter: "marriage", date: "2010-04-17", time: "10:45", timezone: "Asia/Kolkata" },
  { id: "job", matter: "job", date: "2014-10-06", time: "14:20", timezone: "America/Los_Angeles" },
];
const chart = insertChartSchema.parse({ name: "Synthetic", gender: "male", birthDate: "1990-01-01",
  birthTime: "12:00:00", timezone: "Asia/Kolkata", timeStandard: "zone", place: "Synthetic Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean", events });
const asRectifyEvent = (e: ChartEvent) => {
  const m = matterOf(e.matter);
  return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area };
};

test("chart reading, saved validation and a random-date replay use the same Aurora evaluator", () => {
  const result = validateEvents(chart);
  const reading = topicReading(chart, events[0], "2026-01-01T00:00:00Z");
  assert.deepEqual(reading.kp.aurora, result.events[0].kp.aurora);
  assert.deepEqual(reading.kp.auroraV2, result.events[0].kp.auroraV2);
  const html = renderToStaticMarkup(createElement(AuroraEventPanel, { evidence: reading.kp.aurora!, label: reading.label }));
  assert.match(html, /aurora-event-evidence/);
  assert.match(html, /strict rule is an app convention/);
  assert.match(html, /not counted/);
  const v2html = renderToStaticMarkup(createElement(AuroraV2Panel, { evidence: reading.kp.auroraV2!, label: reading.label }));
  assert.match(v2html, /aurora-v2-event-evidence/);
  assert.match(v2html, /mixed sub remains unresolved/);
  assert.match(v2html, /no complete chains passed at the reported birth times/);
  const example = result.baseline!.auroraExample![0];
  const event = { ...events[0], date: example.date, time: example.time, timezone: example.timezone };
  const replay = validateEvents({ ...chart, events: [event] }).events[0];
  assert.deepEqual(replay.kp.aurora, example.evidence);
  assert.deepEqual(replay.kp.auroraV2, result.baseline!.auroraV2Example![0].evidence);
  assert.equal(result.baseline!.aurora!.actual, result.events.filter((e) => e.kp.aurora?.allSupported).length);
  assert.equal(result.baseline!.auroraV2!.actual, result.events.filter((e) => e.kp.auroraV2?.allSupported).length);
});

test("rectification and its random-date examples match a recast at the candidate time", () => {
  const scan = rectify({ chart, windowMinutes: 1, events: events.map(asRectifyEvent) });
  const segment = scan.segments.find((s) => s.selectable && s.candidate)!;
  assert.ok(segment);
  const local = DateTime.fromISO(segment.candidate!.birthUtc, { setZone: true }).setZone(chart.timezone);
  const candidate = { ...chart, birthDate: local.toISODate()!, birthTime: local.toFormat("HH:mm:ss") };
  const actual = validateEvents(candidate);
  assert.deepEqual(segment.events[0].aurora, actual.events[0].kp.aurora);
  assert.deepEqual(segment.events[0].auroraV2, actual.events[0].kp.auroraV2);
  const example = segment.baseline!.auroraExample![0];
  const replay = validateEvents({ ...candidate, events: [{ ...events[0], date: example.date,
    time: example.time, timezone: example.timezone }] }).events[0];
  assert.deepEqual(example.evidence, replay.kp.aurora);
  assert.deepEqual(segment.baseline!.auroraV2Example![0].evidence, replay.kp.auroraV2);
  assert.equal(methodScore(segment, "kp-aurora").score, segment.events.filter((e) => e.aurora?.allSupported).length);
  assert.equal(segment.baseline!.aurora!.actual, methodScore(segment, "kp-aurora").score);
  assert.equal(segment.baseline!.auroraV2!.actual, methodScore(segment, "kp-aurora-v2").score);
  const fullChart = { ...chart, id: 0, gender: "male", timeStandard: "zone", ayanamsa: "lahiri", nodeType: "mean",
    sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events };
  const state = { method: "kp-aurora" as const, windowMinutes: 1, events: events.map(asRectifyEvent), confirmedMarks: [] };
  const report = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: scan, state } } });
  const rendered = JSON.stringify(report.sections);
  assert.match(rendered, /Aurora staged scripts/);
  assert.match(rendered, /Aurora-style staged research adapter/);
  assert.doesNotMatch(rendered, /"Mahadasha","Antardasha","Score"/);
  const v2state = { ...state, method: "kp-aurora-v2" as const };
  const v2report = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: scan, state: v2state } } });
  const v2rendered = JSON.stringify(v2report.sections);
  assert.match(v2rendered, /Aurora mixed-script v2/);
  assert.match(v2rendered, /not validated for ranking birth times/);
  assert.doesNotMatch(v2rendered, /"Mahadasha","Antardasha","Score"/);
  const tiedScan = structuredClone(scan);
  for (const s of tiedScan.segments) if (s.baseline?.auroraV2)
    s.baseline.auroraV2 = { actual: 0, mean: 0, sd: 0, percentile: 50, verdict: "chance" };
  const tiedReport = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: tiedScan, state: v2state } } });
  assert.match(JSON.stringify(tiedReport.sections), /comparison does not distinguish the dates/);
});
