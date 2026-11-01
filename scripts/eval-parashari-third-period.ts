/**
 * Offline, pre-specified M2/M3 experiment. These counts are not production
 * scores. Run: node --import tsx scripts/eval-parashari-third-period.ts > results.json
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { birthInstant, julianDay, positionsAt, ascendantAt } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { matterOf, type ChartEvent } from "../shared/events";
import { vimshottariLordsAt } from "../shared/kp";
import { manleyEvidence, manleyTopicFor, type ManleyEvidence, type ManleyFrame } from "../shared/manley-evidence";
import { insertChartSchema, type InsertChart } from "../shared/schema";

type PublicEvent = ChartEvent & { source: string; description: string };
type PublicCase = { chart: InsertChart; birthSource: string; birthQuality: string; category: string; events: PublicEvent[] };
type Mode = "all" | "house";
type Model = "M2" | "M3";
type Fact = {
  date: string; matter: string; division: string; lords: string[];
  all: boolean[]; house: boolean[]; fourth: boolean[] | null;
  details: { house: string[]; houseLord: string[]; karaka: string[] }[];
};
type Row = { start: number; end: number; facts: Fact[] };

const paths = {
  reused: "scripts/fixtures/parashari-divisional-v3-cases.json",
  fresh: "scripts/fixtures/parashari-third-period-fresh-cases.json",
};
const round = (n: number) => Math.round(n * 100) / 100;
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const key = (e: { date: string; matter: string }) => `${e.date}|${e.matter}`;
const instant = (ms: number) => DateTime.fromMillis(ms, { zone: "utc" }).toISO()!;
const duration = (r: Row) => r.end - r.start;
const evidenceFactor = (frame: ManleyFrame, mode: Mode) =>
  frame.primary.house.length > 0 || frame.primary.houseLord.length > 0 ||
  (mode === "all" && frame.primary.karaka.length > 0);

function fact(e: ManleyEvidence): Fact {
  if (!e.antara) throw new Error(`Missing third-period evidence for ${e.label} ${e.date}`);
  const periods = [...e.periods, e.antara];
  const frames = periods.map((p) => p.frames[1]);
  return {
    date: e.date, matter: e.matter, division: e.division,
    lords: periods.map((p) => p.planet),
    all: frames.map((f) => evidenceFactor(f, "all")),
    house: frames.map((f) => evidenceFactor(f, "house")),
    fourth: e.educationFourth ? e.educationFourth.map((f) => f.house.length > 0 || f.houseLordLinks.length > 0) : null,
    details: frames.map((f) => f.primary),
  };
}

function context(chart: InsertChart, birthMs: number) {
  const birth = DateTime.fromMillis(birthMs, { zone: "utc" });
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const jd = julianDay(birth);
  const natal = positionsAt(jd, opts);
  const asc = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const moon = natal.find((p) => p.planet === "Moon");
  if (!moon) throw new Error(`Missing natal Moon: ${chart.name}`);
  return { birth, opts, natal, asc, moon };
}

function atEvent(chart: InsertChart, ctx: ReturnType<typeof context>, event: ChartEvent): Fact {
  const at = eventInstant(event.date, event, chart.timezone).toUTC();
  if (at.toMillis() < ctx.birth.toMillis()) throw new Error(`Event before birth: ${chart.name} ${event.date}`);
  const periods = vimshottariLordsAt(ctx.moon.lon, ctx.birth.toISO()!, at.toISO()!);
  const evidence = manleyEvidence({ label: matterOf(event.matter).label, date: event.date, matter: event.matter,
    time: event.time, timezone: event.timezone, birthTimezone: chart.timezone }, ctx.natal, ctx.asc, periods);
  if (!evidence) throw new Error(`Unsupported event: ${chart.name} ${key(event)}`);
  return fact(evidence);
}

function scan(chart: InsertChart, events: ChartEvent[]): { rows: Row[]; recorded: number } {
  const recorded = birthInstant(chart).utc.toMillis();
  const start = recorded - 30 * 60_000, end = recorded + 30 * 60_000;
  type Sample = { ms: number; signature: string; facts: Fact[] };
  const cache = new Map<number, Sample>();
  const sample = (ms: number): Sample => {
    const cached = cache.get(ms);
    if (cached) return cached;
    const c = context(chart, ms);
    const facts = events.map((event) => atEvent(chart, c, event));
    const item = { ms, facts, signature: JSON.stringify(facts) };
    cache.set(ms, item);
    return item;
  };
  const boundaries: number[] = [];
  const walk = (a: Sample, b: Sample): void => {
    if (a.signature === b.signature) return;
    if (b.ms - a.ms <= 200) { boundaries.push(b.ms); return; }
    const middle = sample(Math.floor((a.ms + b.ms) / 2));
    walk(a, middle); walk(middle, b);
  };
  let left = sample(start);
  while (left.ms < end) {
    const right = sample(Math.min(end, left.ms + 5000));
    walk(left, right);
    left = right;
  }
  const bounds = [start, ...Array.from(new Set(boundaries)).sort((a, b) => a - b).filter((b) => b > start && b < end), end];
  const rows = bounds.slice(0, -1).map((a, i) => ({ start: a, end: bounds[i + 1], facts: sample(Math.floor((a + bounds[i + 1]) / 2)).facts }));
  return { rows, recorded };
}

function score(row: Row | { facts: Fact[] }, keys: Set<string>, mode: Mode, model: Model): number {
  return row.facts.filter((f) => keys.has(key(f))).reduce((sum, f) =>
    sum + f[mode].slice(0, model === "M2" ? 2 : 3).filter(Boolean).length, 0);
}

function expandedCoverage(rows: Row[], start: number, end: number, bandMs: number): number {
  const spans = rows.map((r) => [Math.max(start, r.start - bandMs), Math.min(end, r.end + bandMs)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const span of spans) {
    const last = merged.at(-1);
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push([...span]);
  }
  return round(100 * merged.reduce((n, [a, b]) => n + b - a, 0) / (end - start));
}

function summarize(rows: Row[], actual: Fact[], recorded: number, inputs: ChartEvent[], heldout: ChartEvent[], mode: Mode, model: Model) {
  const inputKeys = new Set(inputs.map(key)), heldKeys = new Set(heldout.map(key));
  const max = Math.max(...rows.map((r) => score(r, inputKeys, mode, model)));
  const top = rows.filter((r) => score(r, inputKeys, mode, model) === max);
  const start = rows[0].start, end = rows.at(-1)!.end, total = end - start;
  const topMs = top.reduce((n, r) => n + duration(r), 0);
  const actualInput = score({ facts: actual }, inputKeys, mode, model);
  const actualHeld = score({ facts: actual }, heldKeys, mode, model);
  const below = rows.filter((r) => score(r, inputKeys, mode, model) < actualInput).reduce((n, r) => n + duration(r), 0);
  const ties = rows.filter((r) => score(r, inputKeys, mode, model) === actualInput).reduce((n, r) => n + duration(r), 0);
  const touches = (bandMs: number) => top.some((r) => r.start <= recorded + bandMs && r.end >= recorded - bandMs);
  const ranges: { start: number; end: number }[] = [];
  for (const r of top) { const last = ranges.at(-1); if (last && last.end === r.start) last.end = r.end; else ranges.push({ start: r.start, end: r.end }); }
  return {
    inputCount: inputs.length, heldoutCount: heldout.length, inputMax: inputs.length * (model === "M2" ? 2 : 3),
    maximumInputScore: max, reportedInput: actualInput, topCoveragePercent: round(100 * topMs / total),
    topTouchesFiveMinuteBand: touches(300_000), topTouchesTenMinuteBand: touches(600_000),
    expandedFiveMinuteReferencePercent: expandedCoverage(top, start, end, 300_000),
    reportedInputMidrankPercentile: round(100 * (below + ties / 2) / total),
    reportedHeldoutNormalized: round(actualHeld / (heldout.length * (model === "M2" ? 2 : 3))),
    topWeightedHeldoutNormalized: round(top.reduce((n, r) => n + duration(r) * score(r, heldKeys, mode, model), 0) / topMs / (heldout.length * (model === "M2" ? 2 : 3))),
    topIntervals: ranges.map((r) => ({ startUtc: instant(r.start), endUtc: instant(r.end),
      startOffsetSeconds: round((r.start - recorded) / 1000), endOffsetSeconds: round((r.end - recorded) / 1000) })),
  };
}

function runCase(raw: PublicCase, sourceBasis = true) {
  const chart = insertChartSchema.parse(sourceBasis ? raw.chart : { ...raw.chart, timeStandard: "zone" });
  const events = raw.events.map(({ id, matter, date, time, timezone, outcome }) => ({ id, matter, date, time, timezone, outcome }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(events.map(key)).size !== events.length) throw new Error(`Repeated matter/date: ${chart.name}`);
  for (const e of events) if (!manleyTopicFor(e.matter)) throw new Error(`Unsupported fixture matter: ${chart.name} ${e.matter}`);
  const dates = Array.from(new Set(events.map((e) => e.date)));
  const inputs = events.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const heldout = events.filter((e) => dates.indexOf(e.date) % 2 === 1);
  if (!inputs.length || !heldout.length) throw new Error(`Need input and heldout dates: ${chart.name}`);
  const { rows, recorded } = scan(chart, events);
  const ctx = context(chart, recorded), actual = events.map((e) => atEvent(chart, ctx, e));
  const knownDates = new Set(events.map((e) => e.date));
  const controls = heldout.map((e) => ({ event: key(e), actual: actual.find((a) => key(a) === key(e))!,
    comparisons: [-180, -120, -60, 60, 120, 180].map((delta) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: delta }).toISODate()!;
      if (knownDates.has(date)) return { delta, date, excluded: "recorded event date" };
      const shifted = { ...e, date };
      if (eventInstant(date, shifted, chart.timezone).toUTC().toMillis() < recorded) return { delta, date, excluded: "before birth" };
      return { delta, date, fact: atEvent(chart, ctx, shifted) };
    }) }));
  const eventHours = events.map((e) => {
    const n = rows.reduce((s, r) => s + duration(r), 0);
    const pct = (predicate: (f: Fact) => boolean) => round(100 * rows.reduce((s, r) => {
      const f = r.facts.find((f) => key(f) === key(e));
      if (!f) throw new Error(`Missing scanned event: ${chart.name} ${key(e)}`);
      return s + (predicate(f) ? duration(r) : 0);
    }, 0) / n);
    return { event: key(e), thirdMatchedPercent: pct((f) => f.all[2]),
      thirdHouseMatchedPercent: pct((f) => f.house[2]),
      thirdMatchesEarlierLordPercent: pct((f) => f.all[2] && f.lords.slice(0, 2).includes(f.lords[2])),
      thirdSameAsEarlierLordPercent: pct((f) => f.lords.slice(0, 2).includes(f.lords[2])) };
  });
  const clocks = events.filter((e) => !e.time).map((e) => ({ event: key(e), timezone: e.timezone ?? `${chart.timezone} (birth zone assumed)`,
    variants: ["00:01", "12:00", "23:59"].map((time) => {
      try { const v = atEvent(chart, ctx, { ...e, time }); return { time, lords: v.lords, thirdMatched: v.all[2], thirdHouseMatched: v.house[2], fourth: v.fourth }; }
      catch (error) { return { time, error: error instanceof Error ? error.message : String(error) }; }
    }) }));
  const models = Object.fromEntries((["all", "house"] as const).map((mode) => [mode,
    Object.fromEntries((["M2", "M3"] as const).map((model) => [model, summarize(rows, actual, recorded, inputs, heldout, mode, model)]))]));
  return { name: chart.name, category: raw.category, birthSource: raw.birthSource, birthQuality: raw.birthQuality,
    basis: chart.timeStandard, reportedBirthUtc: instant(recorded), inputs: inputs.map(key), heldout: heldout.map(key),
    segmentCount: rows.length, actual, models, eventHours, controls, clockSensitivity: clocks };
}

const reused = JSON.parse(readFileSync(paths.reused, "utf8")) as { cases: PublicCase[] };
const fresh = JSON.parse(readFileSync(paths.fresh, "utf8")) as { cases: PublicCase[] };
const oldPaths = ["scripts/fixtures/public-figures.json", "scripts/fixtures/rectification-evaluation.json",
  "scripts/fixtures/parashari-holdout-cases.json", "scripts/fixtures/parashari-specific-v2-cases.json", paths.reused];
const oldNames = new Set(oldPaths.flatMap((path) => {
  const data = JSON.parse(readFileSync(path, "utf8"));
  return (data.charts ?? data.cases ?? []).map((c: any) => c.chart?.name ?? c.name ?? c.chartName ?? c.fixtureName).filter(Boolean);
}));
for (const c of fresh.cases) if (oldNames.has(c.chart.name)) throw new Error(`Fresh case already used: ${c.chart.name}`);
if (new Set(fresh.cases.map((c) => c.chart.name)).size !== fresh.cases.length) throw new Error("Duplicate fresh subject");
const cohorts: Record<string, ReturnType<typeof runCase>[]> = { reused: [], fresh: [] };
for (const [name, data] of [["reused", reused], ["fresh", fresh]] as const) for (const c of data.cases) {
  process.stderr.write(`Evaluating ${name}: ${c.chart.name}\n`);
  cohorts[name].push(runCase(c));
}
const historical = fresh.cases.find((c) => c.chart.name === "F. Scott Fitzgerald");
if (!historical) throw new Error("Missing pre-specified historical sensitivity case");
process.stderr.write("Evaluating historical zone-basis sensitivity\n");
const basisSensitivity = runCase(historical, false);
const hashed = [paths.reused, paths.fresh, "docs/parashari-third-period-protocol.md", "scripts/eval-parashari-third-period.ts",
  "shared/manley-evidence.ts", "shared/kp.ts", "shared/vargas.ts", "server/ephemeris.ts", "server/event-time.ts"];
process.stdout.write(JSON.stringify({ protocol: "docs/parashari-third-period-protocol.md",
  hashes: Object.fromEntries(hashed.map((path) => [path, sha(path)])),
  caution: "M2 and M3 are research-only counts, not probabilities. Samples are small; the reused cohort is not fresh; comparison dates are not known non-events; original birth documents were not inspected.",
  cohorts, basisSensitivity }, null, 2) + "\n");
