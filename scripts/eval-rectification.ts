/**
 * Reproducible, exploratory checks against a small set of public cases.
 *
 * Run: node --import tsx scripts/eval-rectification.ts > /tmp/nadi-evaluation.json
 * This is a diagnostic, not a statistical test or a basis for fitting weights.
 */
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { baselineFor, highlightedCandidates, methodScore, type RectifyMethod } from "@shared/rectify-methods";
import type { RectifyEvent, RectifySegment } from "@shared/rectify-types";
import { birthInstant, julianDay, positionsLite } from "../server/ephemeris";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";
import { kpPoint } from "@shared/kp";

type EventRef = {
  id: string; description: string; source: string; matter?: string; date?: string; time?: string; timezone?: string;
};
type Case = {
  fixtureName?: string; chart?: InsertChart; birthSource: string; category: string; events: EventRef[];
};

const published = JSON.parse(readFileSync("scripts/fixtures/public-figures.json", "utf8")) as { charts: InsertChart[] };
const manifest = JSON.parse(readFileSync("scripts/fixtures/rectification-evaluation.json", "utf8")) as { cases: Case[] };
const methods: RectifyMethod[] = ["kp-events", "kp-transit", "jaimini-dasha"];

const asRectifyEvent = (e: ChartEvent): RectifyEvent => {
  const m = matterOf(e.matter);
  return { label: m.label, matter: e.matter, outcome: e.outcome, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
};
const score = (summary: ReturnType<typeof validateEvents>["summary"], method: RectifyMethod) => {
  if (method === "kp-events") return { score: summary.kpScore, max: summary.kpMax };
  if (method === "kp-transit") return { score: summary.transitScore, max: summary.transitMax };
  return { score: summary.jaiminiScore, max: summary.jaiminiMax };
};
const duration = (s: { startIso: string; endIso: string }) => Date.parse(s.endIso) - Date.parse(s.startIso);
const includesBand = (s: { startIso: string; endIso: string }, recordedMs: number) =>
  Date.parse(s.startIso) <= recordedMs + 5 * 60_000 && Date.parse(s.endIso) >= recordedMs - 5 * 60_000;
const round = (n: number) => Math.round(n * 10) / 10;

const results = [];
for (const entry of manifest.cases) {
  const sourceChart = entry.chart ?? published.charts.find((c) => c.name === entry.fixtureName);
  if (!sourceChart) throw new Error(`Missing chart: ${entry.fixtureName}`);
  const chart = insertChartSchema.parse(sourceChart);
  const allEvents = entry.events.map((ref) => {
    const original = chart.events?.find((e) => e.id === ref.id);
    const e = original ?? (ref.matter && ref.date ? { id: ref.id, matter: ref.matter, date: ref.date } : undefined);
    if (!e) throw new Error(`Missing event ${ref.id} on ${chart.name}`);
    return { ...e, time: ref.time, timezone: ref.timezone };
  }).sort((a, b) => a.date.localeCompare(b.date));
  // Consecutive events on the same date are assigned together, avoiding date leakage.
  const dates = Array.from(new Set(allEvents.map((e) => e.date)));
  const training = allEvents.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const heldOut = allEvents.filter((e) => dates.indexOf(e.date) % 2 === 1);
  if (training.length < 2 || !heldOut.length) throw new Error(`Too few events: ${chart.name}`);

  process.stderr.write(`Evaluating ${chart.name}: ${training.length} training, ${heldOut.length} held out\n`);
  const scan = rectify({ chart: { ...chart, events: training }, windowMinutes: 30, events: training.map(asRectifyEvent) });
  const recordedMs = birthInstant(chart).utc.toMillis();
  const recorded = scan.segments.find((s) => s.given);
  if (!recorded) throw new Error(`Recorded segment missing: ${chart.name}`);
  const total = scan.segments.reduce((sum, s) => sum + duration(s), 0);
  const givenValidation = validateEvents({ ...chart, events: heldOut });
  const allValidation = validateEvents({ ...chart, events: allEvents });
  const byMethod: Record<string, unknown> = {};
  for (const method of methods) {
    const rows = scan.segments.map((s) => ({ s, score: methodScore(s, method).score, b: baselineFor(s, method) }));
    const max = Math.max(...rows.map((r) => r.score));
    const topRows = rows.filter((r) => r.score === max);
    const selectable = topRows.filter(({ s }) => s.selectable !== false && s.midDate === chart.birthDate && s.candidate);
    // The recorded time is a known, approximate starting point in this experiment.
    // Among tied top samples, choose the midpoint closest to that starting point.
    selectable.sort((a, b) => Math.abs(Date.parse(a.s.candidate!.birthUtc) - recordedMs) - Math.abs(Date.parse(b.s.candidate!.birthUtc) - recordedMs));
    const chosen = selectable[0]?.s;
    const selectedValidation = chosen ? validateEvents({ ...chart, birthTime: chosen.mid, events: heldOut }) : undefined;
    const highlights = highlightedCandidates(rows).map((i) => rows[i].s);
    const supportedVargaEvents = recorded.parashariVargas?.length ?? 0;
    // Count the actual divisional chart factors separately from the broader
    // cross-check, which also includes D1 factors and period links.
    const divisionalPatterns = new Set(topRows.map(({ s }) => JSON.stringify((s.parashariVargas ?? []).map((e) => ({
      matter: e.matter, varga: e.varga, vargaLagnaLord: e.vargaLagnaLord,
    })))));
    const vargaPatterns = new Set(topRows.map(({ s }) => JSON.stringify((s.parashariVargas ?? []).map((e) => ({
      matter: e.matter, rashi: e.rashi, rashiAssessment: e.rashiAssessment, varga: e.varga,
      rashiLordInVarga: e.rashiLordInVarga, vargaLagnaLord: e.vargaLagnaLord, periods: e.periods,
    })))));
    byMethod[method] = {
      recordedScore: methodScore(recorded, method),
      minimumScore: Math.min(...rows.map((r) => r.score)),
      maximumScore: max,
      distinctScores: new Set(rows.map((r) => r.score)).size,
      topSamples: topRows.length,
      topCoveragePercent: round(100 * topRows.reduce((sum, r) => sum + duration(r.s), 0) / total),
      topTouchesRecordedFiveMinuteBand: topRows.some((r) => includesBand(r.s, recordedMs)),
      supportedVargaEvents,
      distinctDivisionalPatternsAmongTopSamples: supportedVargaEvents ? divisionalPatterns.size : null,
      distinctParashariPatternsAmongTopSamples: supportedVargaEvents ? vargaPatterns.size : null,
      eligibleAbovePercentileSamples: rows.filter((r) => r.b?.verdict === "above").length,
      highlightedSamples: highlights.length,
      highlightedCoveragePercent: round(100 * highlights.reduce((sum, s) => sum + duration(s), 0) / total),
      highlightedTouchesRecordedFiveMinuteBand: highlights.some((s) => includesBand(s, recordedMs)),
      selectedTime: chosen?.mid ?? null,
      selectedOffsetMinutes: chosen?.candidate ? round((Date.parse(chosen.candidate.birthUtc) - recordedMs) / 60_000) : null,
      heldOutRecorded: score(givenValidation.summary, method),
      heldOutSelected: selectedValidation ? score(selectedValidation.summary, method) : null,
    };
  }
  const d81 = scan.kundaD81 ?? [];
  const matchedD81 = d81.filter((s) => s.check.trine);
  const moonScores = scan.segments.map((s) => methodScore(s, "kp-moon").score);
  const allBaseline = allValidation.baseline;
  results.push({
    name: chart.name, category: entry.category, reportedBirthTime: chart.birthTime,
    birthSource: entry.birthSource, training: training.map((e) => `${e.date} ${e.matter}`),
    heldOut: heldOut.map((e) => `${e.date} ${e.matter}`), samples: scan.segments.length,
    methods: byMethod,
    kpMoon: { recordedIntervalScore: methodScore(recorded, "kp-moon"), best: Math.max(...moonScores), distinctScores: new Set(moonScores).size },
    kundaD81: { recordedWindowMatches: d81.find((s) => s.given)?.check.trine ?? null,
      matchingCoveragePercent: d81.length ? round(100 * matchedD81.reduce((sum, s) => sum + duration(s), 0) / d81.reduce((sum, s) => sum + duration(s), 0)) : null },
    // Descriptive in-sample checks only, not an out-of-sample forecast.
    recordedChartBaseline: allBaseline ? { kp: allBaseline.kp, transit: allBaseline.transit, jaimini: allBaseline.jaimini, nadi: allBaseline.bnn } : null,
  });
}

// Royal Household gives an actual wedding time. Compare it with the application's noon assumption.
const weddingSky = ["10:30", "12:00"].map((time) => {
  const at = DateTime.fromISO(`1947-11-20T${time}`, { zone: "Europe/London" });
  return { time, sky: positionsLite(julianDay(at.toUTC()), { ayanamsa: "kp", nodeType: "mean" }).map((p) => {
    const pt = kpPoint(p.lon);
    return { planet: p.planet, sign: pt.sign, star: pt.nakshatra, signLord: pt.signLord, starLord: pt.starLord, subLord: pt.subLord };
  }) };
});
process.stdout.write(JSON.stringify({
  protocol: "±30 minute scan; chronological alternate unique dates for train/holdout; top raw score with tied selectable sample nearest reported time; compare holdout with recorded time; ±5 minute tolerance is a chosen reporting band, not certificate precision. The current UI highlight is examined separately.",
  assumptions: "Events use any documented local time and zone, otherwise noon and the birth timezone; KP ayanamsa for KP, chart ayanamsa for other methods; 200 random-date trials for the descriptive comparison. Small public convenience sample, not population-representative; several held-out sets are very small.",
  results, weddingSky,
}, null, 2) + "\n");
