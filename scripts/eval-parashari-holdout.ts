/**
 * Fixed protocol: docs/parashari-ranking-protocol.md. Do not adjust the rule
 * based on these results and then report this same set as independent testing.
 * Run: node --import tsx scripts/eval-parashari-holdout.ts > docs/parashari-holdout-results.json
 */
import { readFileSync } from "node:fs";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { methodScore } from "@shared/rectify-methods";
import type { RectifyEvent } from "@shared/rectify-types";
import { birthInstant } from "../server/ephemeris";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";

type Event = ChartEvent & { source: string; description: string };
type Case = { chart: InsertChart; birthSource: string; birthQuality: string; category: string; events: Event[] };
const fixture = JSON.parse(readFileSync("scripts/fixtures/parashari-holdout-cases.json", "utf8")) as { cases: Case[] };
const round = (n: number) => Math.round(n * 10) / 10;
const elapsed = (s: { startIso: string; endIso: string }) => Date.parse(s.endIso) - Date.parse(s.startIso);
const asRectify = (e: ChartEvent): RectifyEvent => {
  const m = matterOf(e.matter);
  return { label: m.label, matter: e.matter, outcome: e.outcome, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
};
const actualScore = (chart: InsertChart, events: ChartEvent[]) => {
  const validation = validateEvents({ ...chart, events });
  const checks = validation.events.map((e) => e.parashariPromise);
  if (checks.some((x) => !x)) throw new Error(`An event was not eligible in ${chart.name}`);
  return { score: checks.reduce((sum, x) => sum + x!.score, 0), max: 5 * checks.length,
    details: checks.map((x) => ({ date: x!.date, matter: x!.matter, score: x!.score, factors: x!.factors })) };
};

const results = [];
for (const c of fixture.cases) {
  const chart = insertChartSchema.parse(c.chart);
  const all = c.events.map((e) => ({ id: e.id, matter: e.matter, date: e.date, time: e.time, timezone: e.timezone, outcome: e.outcome }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const dates = Array.from(new Set(all.map((e) => e.date)));
  const training = all.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const heldOut = all.filter((e) => dates.indexOf(e.date) % 2 === 1);
  if (!training.length || !heldOut.length) throw new Error(`Insufficient dates: ${chart.name}`);
  process.stderr.write(`Evaluating ${chart.name}: ${training.length} input, ${heldOut.length} held out\n`);
  const scan = rectify({ chart: { ...chart, events: training }, windowMinutes: 30, events: training.map(asRectify) });
  const recordedMs = birthInstant(chart).utc.toMillis();
  const rows = scan.segments.map((s) => ({ s, score: methodScore(s, "parashari-events").score, ms: elapsed(s) }));
  const max = Math.max(...rows.map((r) => r.score));
  const top = rows.filter((r) => r.score === max);
  const selectable = top.filter((r) => r.s.selectable !== false && r.s.midDate === chart.birthDate && r.s.candidate);
  selectable.sort((a, b) => Math.abs(Date.parse(a.s.candidate!.birthUtc) - recordedMs) - Math.abs(Date.parse(b.s.candidate!.birthUtc) - recordedMs));
  const chosen = selectable[0]?.s;
  const recordedInput = actualScore(chart, training);
  const recordedHoldout = actualScore(chart, heldOut);
  const selectedHoldout = chosen ? actualScore({ ...chart, birthTime: chosen.mid }, heldOut) : null;
  const total = rows.reduce((sum, r) => sum + r.ms, 0);
  const below = rows.filter((r) => r.score < recordedInput.score).reduce((sum, r) => sum + r.ms, 0);
  const tied = rows.filter((r) => r.score === recordedInput.score).reduce((sum, r) => sum + r.ms, 0);
  // A uniformly chosen reference time would have a ±5-minute band touching a
  // top interval exactly when it falls within that interval expanded by five
  // minutes, clipped to the scanned hour. Merge overlaps before measuring.
  const windowStart = Date.parse(scan.segments[0].startIso);
  const windowEnd = Date.parse(scan.segments[scan.segments.length - 1].endIso);
  const expanded = top.map(({ s }) => [Math.max(windowStart, Date.parse(s.startIso) - 300_000), Math.min(windowEnd, Date.parse(s.endIso) + 300_000)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of expanded) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const chanceBandTouch = merged.reduce((sum, r) => sum + r[1] - r[0], 0) / (windowEnd - windowStart);
  results.push({
    name: chart.name, category: c.category, reportedBirthTime: chart.birthTime, birthSource: c.birthSource, birthQuality: c.birthQuality,
    input: training.map((e) => `${e.date} ${e.matter}`), heldOut: heldOut.map((e) => `${e.date} ${e.matter}`),
    recordedInput, recordedHoldout, selectedHoldout, samples: rows.length,
    minScore: Math.min(...rows.map((r) => r.score)), maxScore: max, distinctScores: new Set(rows.map((r) => r.score)).size,
    topCoveragePercent: round(100 * top.reduce((sum, r) => sum + r.ms, 0) / total),
    topTouchesRecordedFiveMinuteBand: top.some(({ s }) => Date.parse(s.startIso) <= recordedMs + 300_000 && Date.parse(s.endIso) >= recordedMs - 300_000),
    uniformReferenceFiveMinuteBandTouchPercent: round(100 * chanceBandTouch),
    recordedMidpointScore: rows.find((r) => r.s.given)?.score ?? null,
    recordedAgainstUniformCandidate: { belowPercent: round(100 * below / total), equalPercent: round(100 * tied / total),
      abovePercent: round(100 * (total - below - tied) / total), midrankPercentile: round(100 * (below + tied / 2) / total) },
    selectedTime: chosen?.mid ?? null,
    selectedOffsetMinutes: chosen?.candidate ? round((Date.parse(chosen.candidate.birthUtc) - recordedMs) / 60_000) : null,
  });
}
process.stdout.write(JSON.stringify({
  protocol: "Fixed source-informed five-factor rule; ±30 minutes; alternate unique dates for input/holdout. Ties choose selectable midpoint nearest reported time, so selection is not blind. Two-event cases use one input. Recorded scores use the exact recorded instant.",
  limitations: "Public convenience sample, not independent of celebrity selection; birth times can be rounded, disputed, or based on memory; chronology is retrospective; noon is assumed where event time is not documented. Scores are not probabilities or proof of birth time.",
  results,
}, null, 2) + "\n");
