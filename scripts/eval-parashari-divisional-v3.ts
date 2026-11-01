/** Frozen paired v2/v3 evaluation. See docs/parashari-divisional-v3-protocol.md.
 * node --import tsx scripts/eval-parashari-divisional-v3.ts > docs/parashari-divisional-v3-results.json
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { vimshottariLordsAt } from "@shared/kp";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariSpecificCheck } from "@shared/parashari-specific";
import { manleyEvidence } from "@shared/manley-evidence";
import { parashariDivisionalCheck } from "@shared/parashari-divisional";
import type { RectifyEvent, RectifySegment } from "@shared/rectify-types";
import { ascendantAt, birthInstant, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";

type Event = ChartEvent & { source: string; description: string };
type Case = { chart: InsertChart; birthSource: string; birthQuality: string; category: string; events: Event[] };
type Version = "v2" | "v3";
const manifestPath = "scripts/fixtures/parashari-divisional-v3-cases.json";
const manifestText = readFileSync(manifestPath, "utf8");
const fixture = JSON.parse(manifestText) as { cases: Case[] };
const round = (n: number) => Math.round(n * 100) / 100;
const key = (e: { date: string; matter: string }) => `${e.date}|${e.matter}`;
const duration = (s: RectifySegment) => Date.parse(s.endIso) - Date.parse(s.startIso);
const rectEvent = (e: ChartEvent): RectifyEvent => {
  const m = matterOf(e.matter);
  return { label: m.label, matter: e.matter, outcome: e.outcome, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
};
function checkFor(segment: RectifySegment, eventKey: string, version: Version) {
  const checks = version === "v2" ? segment.parashariSpecific ?? [] : segment.parashariDivisional ?? [];
  const matching = checks.filter((c) => key(c) === eventKey);
  if (matching.length !== 1) throw new Error(`Expected one ${version} check for ${eventKey} at ${segment.mid}; got ${matching.length}`);
  return matching[0];
}
function scoreFor(segment: RectifySegment, events: Set<string>, version: Version) {
  return Array.from(events).reduce((sum, eventKey) => sum + checkFor(segment, eventKey, version).score, 0);
}
function calculateAtRecorded(chart: InsertChart, event: ChartEvent) {
  const birth = birthInstant(chart).utc;
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const jd = julianDay(birth);
  const natal = positionsAt(jd, opts);
  const lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const moon = natal.find((p) => p.planet === "Moon")!;
  const at = eventInstant(event.date, event, chart.timezone).toUTC();
  if (at < birth) throw new Error(`Pre-birth control for ${chart.name}`);
  const periods = vimshottariLordsAt(moon.lon, birth.toISO()!, at.toISO()!);
  const target = { label: matterOf(event.matter).label, date: event.date, matter: event.matter };
  const varga = parashariVargaEvidence(target, natal, lagna, periods);
  const sky = positionsLite(julianDay(at), opts);
  const v2 = parashariSpecificCheck(varga, event.outcome, natal, sky);
  const manley = manleyEvidence(target, natal, lagna, periods);
  const v3 = parashariDivisionalCheck(v2, manley);
  if (!v2 || !v3 || !manley) throw new Error(`Ineligible ${event.matter} event for ${chart.name}`);
  return { v2: { score: v2.score, max: v2.max, factors: v2.factors.map((f) => ({ id: f.id, matched: f.matched })) },
    v3: { score: v3.score, max: v3.max, factors: v3.factors.map((f) => ({ id: f.id, matched: f.matched })) },
    lords: manley.periods.map(({ level, planet }) => ({ level, planet })) };
}
function bandReference(top: RectifySegment[], start: number, end: number, bandMs: number) {
  const expanded = top.map((s) => [Math.max(start, Date.parse(s.startIso) - bandMs), Math.min(end, Date.parse(s.endIso) + bandMs)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of expanded) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return round(100 * merged.reduce((sum, [a, b]) => sum + b - a, 0) / (end - start));
}

const previous = ["scripts/fixtures/public-figures.json", "scripts/fixtures/rectification-evaluation.json", "scripts/fixtures/parashari-holdout-cases.json", "scripts/fixtures/parashari-specific-v2-cases.json"]
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
  const reportedMs = birthInstant(chart).utc.toMillis();
  const inputKeys = new Set(input.map(key)), holdoutKeys = new Set(holdout.map(key));
  const actualInput = input.map((e) => calculateAtRecorded(chart, e));
  const actualHoldout = holdout.map((e) => calculateAtRecorded(chart, e));
  const validation = validateEvents({ ...chart, events });
  for (const ev of validation.events) {
    const source = events.find((e) => e.id === ev.id)!;
    const actual = calculateAtRecorded(chart, source);
    if (actual.v2.score !== ev.parashariSpecific?.score || actual.v3.score !== ev.parashariDivisional?.score)
      throw new Error(`Direct/Validate disagreement for ${chart.name} ${source.date}`);
  }
  const rows = scan.segments.map((s) => ({ s, ms: duration(s),
    v2: { input: scoreFor(s, inputKeys, "v2"), holdout: scoreFor(s, holdoutKeys, "v2") },
    v3: { input: scoreFor(s, inputKeys, "v3"), holdout: scoreFor(s, holdoutKeys, "v3") } })).filter((r) => r.ms > 0);
  const total = rows.reduce((sum, r) => sum + r.ms, 0);
  const start = Date.parse(rows[0].s.startIso), end = Date.parse(rows.at(-1)!.s.endIso);
  const versionResult = (version: Version) => {
    const maxPerEvent = version === "v2" ? 6 : 8;
    const maximum = Math.max(...rows.map((r) => r[version].input));
    const top = rows.filter((r) => r[version].input === maximum);
    const topMs = top.reduce((sum, r) => sum + r.ms, 0);
    const reportedInput = actualInput.reduce((sum, a) => sum + a[version].score, 0);
    const reportedHoldout = actualHoldout.reduce((sum, a) => sum + a[version].score, 0);
    const below = rows.filter((r) => r[version].input < reportedInput).reduce((sum, r) => sum + r.ms, 0);
    const tied = rows.filter((r) => r[version].input === reportedInput).reduce((sum, r) => sum + r.ms, 0);
    const touches = (ms: number) => top.some(({ s }) => Date.parse(s.startIso) <= reportedMs + ms && Date.parse(s.endIso) >= reportedMs - ms);
    return { inputMax: input.length * maxPerEvent, maximumInputScore: maximum, reportedInput,
      distinctInputScores: new Set(rows.map((r) => r[version].input)).size,
      topCoveragePercent: round(100 * topMs / total),
      topTouchesReportedFiveMinuteBand: touches(300_000), topTouchesReportedTenMinuteBand: touches(600_000),
      uniformReferenceFiveMinuteBandTouchPercent: bandReference(top.map((r) => r.s), start, end, 300_000),
      uniformReferenceTenMinuteBandTouchPercent: bandReference(top.map((r) => r.s), start, end, 600_000),
      reportedInputMidrankPercentile: round(100 * (below + tied / 2) / total),
      heldoutMax: holdout.length * maxPerEvent, reportedHoldout,
      reportedHoldoutNormalized: round(reportedHoldout / (holdout.length * maxPerEvent)),
      topIntervalsWeightedHeldoutMean: round(top.reduce((sum, r) => sum + r.ms * r[version].holdout, 0) / topMs),
      topIntervalsWeightedHeldoutNormalized: round(top.reduce((sum, r) => sum + r.ms * r[version].holdout, 0) / topMs / (holdout.length * maxPerEvent)),
      holdoutByEvent: holdout.map((e, i) => ({ key: key(e), reported: actualHoldout[i][version].score,
        topWeightedMean: round(top.reduce((sum, r) => sum + r.ms * checkFor(r.s, key(e), version).score, 0) / topMs) })),
      topIntervals: top.map(({ s, ms }) => ({ startIso: s.startIso, endIso: s.endIso, midpoint: s.mid, durationSeconds: round(ms / 1000) })) };
  };
  const saturation = events.map((e) => {
    const sample = rows.map((r) => {
      const check = checkFor(r.s, key(e), "v3");
      const evidence = (r.s.manley ?? []).find((m) => key(m) === key(e));
      if (!evidence) throw new Error(`Missing period evidence for ${chart.name} ${key(e)}`);
      const dasa = check.factors.find((f) => f.id === "division-dasa")!;
      const bhukti = check.factors.find((f) => f.id === "division-bhukti")!;
      return { ms: r.ms, dasa: dasa.matched, bhukti: bhukti.matched,
        sameLord: evidence.periods[0].planet === evidence.periods[1].planet };
    });
    const pct = (p: (v: typeof sample[number]) => boolean) => round(100 * sample.filter(p).reduce((n, v) => n + v.ms, 0) / total);
    return { key: key(e), input: inputKeys.has(key(e)), dasaMatchedPercent: pct((v) => v.dasa),
      bhuktiMatchedPercent: pct((v) => v.bhukti), bothMatchedPercent: pct((v) => v.dasa && v.bhukti),
      sameLordPercent: pct((v) => v.sameLord), bothMatchedSameLordPercent: pct((v) => v.dasa && v.bhukti && v.sameLord) };
  });
  const actualDates = new Set(events.map((e) => e.date));
  const controlDiagnostics = holdout.map((e, i) => {
    const controls = [-180, -120, -60, 60, 120, 180].map((offsetDays) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: offsetDays }).toISODate()!;
      if (actualDates.has(date)) return { offsetDays, date, excluded: "same date as a recorded event" };
      const shifted = { ...e, date };
      if (eventInstant(date, shifted, chart.timezone).toUTC().toMillis() < reportedMs)
        return { offsetDays, date, excluded: "before reported birth" };
      return { offsetDays, date, result: calculateAtRecorded(chart, shifted) };
    });
    return { date: e.date, matter: e.matter, actual: actualHoldout[i], controls };
  });
  results.push({ name: chart.name, category: c.category, birthSource: c.birthSource, birthQuality: c.birthQuality,
    reportedBirthTime: chart.birthTime, input: input.map(key), heldout: holdout.map(key), sampleIntervals: rows.length,
    v2: versionResult("v2"), v3: versionResult("v3"), saturation, controlDiagnostics,
    intervals: rows.map((r) => ({ startIso: r.s.startIso, endIso: r.s.endIso, midpoint: r.s.mid, v2: r.v2, v3: r.v3 })) });
}
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
process.stdout.write(JSON.stringify({
  protocol: "docs/parashari-divisional-v3-protocol.md",
  hashes: Object.fromEntries([manifestPath, "docs/parashari-divisional-v3-protocol.md", "scripts/eval-parashari-divisional-v3.ts",
    "shared/parashari-divisional.ts", "shared/manley-evidence.ts", "shared/parashari-specific.ts"].map((p) => [p, sha(p)])),
  cautions: "Convenience sample of public figures; sources may be rounded, remembered, disputed or unverified. Held-out scores and nearby-date controls are descriptive matches, not proof of a date, birth time, or predictive accuracy.",
  results,
}, null, 2) + "\n");
