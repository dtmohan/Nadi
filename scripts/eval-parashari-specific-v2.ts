/**
 * Run the frozen protocol in docs/parashari-specific-v2-protocol.md.
 * The case manifest is selected before this script is run. Do not tune the
 * rules on these cases and then call the same cases independent validation.
 *
 * node --import tsx scripts/eval-parashari-specific-v2.ts > docs/parashari-specific-v2-results.json
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { vimshottariLordsAt } from "@shared/kp";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseCheck } from "@shared/parashari-promise";
import { parashariSpecificCheck } from "@shared/parashari-specific";
import type { RectifyEvent, RectifySegment } from "@shared/rectify-types";
import { ascendantAt, birthInstant, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";

type Event = ChartEvent & { source: string; description: string };
type Case = { chart: InsertChart; birthSource: string; birthQuality: string; category: string; events: Event[] };
type Version = "v1" | "v2";
const manifestPath = "scripts/fixtures/parashari-specific-v2-cases.json";
const manifestText = readFileSync(manifestPath, "utf8");
const fixture = JSON.parse(manifestText) as { cases: Case[] };
const round = (n: number) => Math.round(n * 10) / 10;
const key = (e: { date: string; matter: string }) => `${e.date}|${e.matter}`;
const duration = (s: RectifySegment) => Date.parse(s.endIso) - Date.parse(s.startIso);
const rectEvent = (e: ChartEvent): RectifyEvent => {
  const m = matterOf(e.matter);
  return { label: m.label, matter: e.matter, outcome: e.outcome, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
};

function scoredEvents(segment: RectifySegment, events: Set<string>, version: Version) {
  const checks = version === "v1" ? segment.parashariPromise ?? [] : segment.parashariSpecific ?? [];
  const selected = checks.filter((c) => events.has(key(c)));
  if (selected.length !== events.size) throw new Error(`Missing ${version} event checks at ${segment.mid}`);
  return selected.reduce((sum, c) => sum + c.score, 0);
}

function calculateAtRecorded(chart: InsertChart, event: ChartEvent) {
  const basis = birthInstant(chart);
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const birthJd = julianDay(basis.utc);
  const natal = positionsAt(birthJd, opts);
  const lagna = ascendantAt(birthJd, chart.latitude, chart.longitude, opts);
  const moon = natal.find((p) => p.planet === "Moon")!;
  const eventUtc = eventInstant(event.date, event, chart.timezone).toUTC();
  if (eventUtc < basis.utc) throw new Error(`Pre-birth control for ${chart.name}`);
  const evidence = parashariVargaEvidence({ label: matterOf(event.matter).label, date: event.date, matter: event.matter }, natal, lagna,
    vimshottariLordsAt(moon.lon, basis.utc.toISO()!, eventUtc.toISO()!));
  const sky = positionsLite(julianDay(eventUtc), opts);
  const v1 = parashariPromiseCheck(evidence, event.outcome, natal, sky);
  const v2 = parashariSpecificCheck(evidence, event.outcome, natal, sky);
  if (!v1 || !v2) throw new Error(`Ineligible ${event.matter} event for ${chart.name}`);
  return { v1: { score: v1.score, max: v1.max, factors: v1.factors },
    v2: { score: v2.score, max: v2.max, factors: v2.factors.map((f) => ({ id: f.id, matched: f.matched })) } };
}

function bandReference(top: RectifySegment[], start: number, end: number) {
  const expanded = top.map((s) => [Math.max(start, Date.parse(s.startIso) - 300_000), Math.min(end, Date.parse(s.endIso) + 300_000)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of expanded) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return round(100 * merged.reduce((sum, [a, b]) => sum + b - a, 0) / (end - start));
}

const previous = ["scripts/fixtures/public-figures.json", "scripts/fixtures/rectification-evaluation.json", "scripts/fixtures/parashari-holdout-cases.json"]
  .map((path) => JSON.parse(readFileSync(path, "utf8")));
const oldNames = new Set(previous.flatMap((f) => (f.charts ?? f.cases ?? []).map((c: any) => c.chart?.name ?? c.name ?? c.chartName ?? c.fixtureName).filter(Boolean)));
const results = [];
for (const c of fixture.cases) {
  const chart = insertChartSchema.parse(c.chart);
  if (oldNames.has(chart.name)) throw new Error(`Case appeared in an earlier fixture: ${chart.name}`);
  const events = c.events.map((e) => ({ id: e.id, matter: e.matter, date: e.date, time: e.time, timezone: e.timezone, outcome: e.outcome }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(events.map(key)).size !== events.length) throw new Error(`Duplicate event matter/date: ${chart.name}`);
  const dates = Array.from(new Set(events.map((e) => e.date)));
  const input = events.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const holdout = events.filter((e) => dates.indexOf(e.date) % 2 === 1);
  if (!input.length || !holdout.length) throw new Error(`Insufficient distinct dates: ${chart.name}`);
  process.stderr.write(`Evaluating ${chart.name}: ${input.length} input and ${holdout.length} held out\n`);
  const scan = rectify({ chart: { ...chart, events }, windowMinutes: 30, events: events.map(rectEvent) });
  const recordedMs = birthInstant(chart).utc.toMillis();
  const inputKeys = new Set(input.map(key)), holdoutKeys = new Set(holdout.map(key));
  const actualInput = input.map((e) => calculateAtRecorded(chart, e));
  const actualHoldout = holdout.map((e) => calculateAtRecorded(chart, e));
  // The direct event calculator must agree with the user-facing Validate path.
  const validation = validateEvents({ ...chart, events });
  for (const ev of validation.events) {
    const source = events.find((e) => e.id === ev.id)!;
    const actual = calculateAtRecorded(chart, source);
    if (actual.v1.score !== ev.parashariPromise?.score || actual.v2.score !== ev.parashariSpecific?.score)
      throw new Error(`Rectify/Validate disagreement for ${chart.name} ${source.date}`);
  }
  const rows = scan.segments.map((s) => ({ s, ms: duration(s),
    v1: { input: scoredEvents(s, inputKeys, "v1"), holdout: scoredEvents(s, holdoutKeys, "v1") },
    v2: { input: scoredEvents(s, inputKeys, "v2"), holdout: scoredEvents(s, holdoutKeys, "v2") } }));
  const total = rows.reduce((sum, r) => sum + r.ms, 0);
  const start = Date.parse(scan.segments[0].startIso), end = Date.parse(scan.segments.at(-1)!.endIso);
  const versionResult = (version: Version) => {
    const maximum = Math.max(...rows.map((r) => r[version].input));
    const top = rows.filter((r) => r[version].input === maximum);
    const topMs = top.reduce((sum, r) => sum + r.ms, 0);
    const recordedInput = actualInput.reduce((sum, a) => sum + a[version].score, 0);
    const recordedHoldout = actualHoldout.reduce((sum, a) => sum + a[version].score, 0);
    const below = rows.filter((r) => r[version].input < recordedInput).reduce((sum, r) => sum + r.ms, 0);
    const tied = rows.filter((r) => r[version].input === recordedInput).reduce((sum, r) => sum + r.ms, 0);
    return { inputMax: input.length * (version === "v1" ? 5 : 6), maximumInputScore: maximum, recordedInput,
      distinctInputScores: new Set(rows.map((r) => r[version].input)).size,
      topCoveragePercent: round(100 * topMs / total),
      topTouchesRecordedFiveMinuteBand: top.some(({ s }) => Date.parse(s.startIso) <= recordedMs + 300_000 && Date.parse(s.endIso) >= recordedMs - 300_000),
      uniformReferenceBandTouchPercent: bandReference(top.map((r) => r.s), start, end),
      recordedInputMidrankPercentile: round(100 * (below + tied / 2) / total),
      heldoutMax: holdout.length * (version === "v1" ? 5 : 6), recordedHoldout,
      topIntervalsWeightedHeldoutMean: round(top.reduce((sum, r) => sum + r.ms * r[version].holdout, 0) / topMs),
      topIntervals: top.map(({ s, ms }) => ({ startIso: s.startIso, endIso: s.endIso, midpoint: s.mid, durationSeconds: round(ms / 1000) })) };
  };

  const actualDates = new Set(events.map((e) => e.date));
  const controlDiagnostics = holdout.map((e, i) => {
    const controls = [-180, -120, -60, 60, 120, 180].map((offsetDays) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: offsetDays }).toISODate()!;
      if (actualDates.has(date)) return { offsetDays, date, excluded: "same date as a recorded event" };
      const shifted = { ...e, date };
      if (eventInstant(date, shifted, chart.timezone).toUTC().toMillis() < recordedMs)
        return { offsetDays, date, excluded: "before recorded birth" };
      return { offsetDays, date, result: calculateAtRecorded(chart, shifted) };
    });
    return { date: e.date, matter: e.matter, actual: actualHoldout[i], controls };
  });
  results.push({ name: chart.name, category: c.category, birthSource: c.birthSource, birthQuality: c.birthQuality,
    reportedBirthTime: chart.birthTime, input: input.map(key), heldout: holdout.map(key), sampleIntervals: rows.length,
    v1: versionResult("v1"), v2: versionResult("v2"), controlDiagnostics,
    intervals: rows.map((r) => ({ startIso: r.s.startIso, endIso: r.s.endIso, midpoint: r.s.mid, v1: r.v1, v2: r.v2 })) });
}
process.stdout.write(JSON.stringify({
  protocol: "docs/parashari-specific-v2-protocol.md",
  manifestSha256: createHash("sha256").update(manifestText).digest("hex"),
  protocolSha256: createHash("sha256").update(readFileSync("docs/parashari-specific-v2-protocol.md")).digest("hex"),
  ruleSha256: createHash("sha256").update(readFileSync("shared/parashari-specific.ts")).digest("hex"),
  cautions: "Convenience sample of public figures; sources may be rounded, remembered, disputed or unverified. Held-out scores and nearby-date controls are descriptive rule matches, not proof of an event, a time, or predictive accuracy.",
  results,
}, null, 2) + "\n");
