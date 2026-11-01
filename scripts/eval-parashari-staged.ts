/** Exploratory staged follow-up. See docs/parashari-staged-protocol.md. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { matterOf, type ChartEvent } from "../shared/events";
import { vimshottariLordsAt } from "../shared/kp";
import { manleyEvidence, manleyTopicFor, type ManleyFrame } from "../shared/manley-evidence";
import { insertChartSchema, type InsertChart } from "../shared/schema";
import { researchScore, researchTopIndices, type ResearchModel } from "../shared/staged-period-research";
import { vimshottariPathAt } from "../shared/vimshottari-depth";

type PublicEvent = ChartEvent & { source: string; description: string };
type PublicCase = { chart: InsertChart; birthSource: string; birthQuality: string; category: string; events: PublicEvent[] };
type Fact = { date: string; matter: string; lords: string[]; primary: boolean[]; firstStage: boolean; thirdStage: boolean };
type Row = { start: number; end: number; facts: Fact[] };

const paths = {
  sevenPreviouslyEvaluated: "scripts/fixtures/parashari-third-period-fresh-cases.json",
  tenPreviouslyEvaluated: "scripts/fixtures/parashari-divisional-v3-cases.json",
};
const round = (n: number) => Math.round(n * 100) / 100;
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const key = (e: { date: string; matter: string }) => `${e.date}|${e.matter}`;
const iso = (ms: number) => DateTime.fromMillis(ms, { zone: "utc" }).toISO()!;
const link = (f: ManleyFrame) => !!(f.primary.house.length || f.primary.houseLord.length || f.primary.karaka.length);

function context(chart: InsertChart, birthMs: number) {
  const birth = DateTime.fromMillis(birthMs, { zone: "utc" });
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const jd = julianDay(birth);
  const natal = positionsAt(jd, opts);
  const asc = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const moon = natal.find((p) => p.planet === "Moon");
  if (!moon) throw new Error(`Missing Moon: ${chart.name}`);
  return { birth, natal, asc, moon };
}

function atEvent(chart: InsertChart, ctx: ReturnType<typeof context>, e: ChartEvent, atMs?: number): Fact {
  const eventMs = atMs ?? eventInstant(e.date, e, chart.timezone).toUTC().toMillis();
  if (eventMs < ctx.birth.toMillis()) throw new Error(`Event precedes birth: ${chart.name} ${e.date}`);
  const lords = vimshottariLordsAt(ctx.moon.lon, ctx.birth.toISO()!, iso(eventMs));
  const ev = manleyEvidence({ label: matterOf(e.matter).label, date: e.date, matter: e.matter,
    time: e.time, timezone: e.timezone, birthTimezone: chart.timezone }, ctx.natal, ctx.asc, lords);
  if (!ev?.antara) throw new Error(`Unsupported event: ${chart.name} ${key(e)}`);
  const primary = [...ev.periods, ev.antara].map((p) => link(p.frames[1]));
  return { date: e.date, matter: e.matter, lords, primary,
    firstStage: primary[0] && primary[1], thirdStage: primary[0] && primary[1] && primary[2] };
}

function scan(chart: InsertChart, inputEvents: ChartEvent[]) {
  const recorded = birthInstant(chart).utc.toMillis();
  const start = recorded - 30 * 60_000, end = recorded + 30 * 60_000;
  type Sample = { ms: number; signature: string; facts: Fact[] };
  const cache = new Map<number, Sample>();
  const sample = (ms: number): Sample => {
    const old = cache.get(ms);
    if (old) return old;
    const c = context(chart, ms);
    const facts = inputEvents.map((e) => atEvent(chart, c, e));
    const value = { ms, facts, signature: JSON.stringify(facts.map((f) => f.primary)) };
    cache.set(ms, value);
    return value;
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
  const rows: Row[] = bounds.slice(0, -1).map((a, i) => ({ start: a, end: bounds[i + 1], facts: sample(Math.floor((a + bounds[i + 1]) / 2)).facts }));
  return { rows, recorded };
}

function reportModel(rows: Row[], recorded: number, model: ResearchModel) {
  const candidates = rows.map((r) => r.facts);
  const maximumFirstStage = Math.max(...candidates.map((facts) => researchScore(facts, "S2")));
  const top = researchTopIndices(candidates, model).map((i) => rows[i]);
  const maximum = researchScore(top[0].facts, model);
  const total = rows.at(-1)!.end - rows[0].start;
  const topMs = top.reduce((n, r) => n + r.end - r.start, 0);
  const merged: { start: number; end: number }[] = [];
  for (const r of top) {
    const last = merged.at(-1);
    if (last && last.end === r.start) last.end = r.end;
    else merged.push({ start: r.start, end: r.end });
  }
  const expanded: { start: number; end: number }[] = [];
  for (const r of merged) {
    const s = Math.max(rows[0].start, r.start - 300_000);
    const e = Math.min(rows.at(-1)!.end, r.end + 300_000);
    const last = expanded.at(-1);
    if (last && last.end >= s) last.end = Math.max(last.end, e);
    else expanded.push({ start: s, end: e });
  }
  return { maximum, maximumFirstStage,
    noFirstStageSupport: maximumFirstStage === 0,
    topCoveragePercent: round(100 * topMs / total),
    topTouchesFiveMinuteBand: top.some((r) => r.start <= recorded + 300_000 && r.end >= recorded - 300_000),
    topTouchesTenMinuteBand: top.some((r) => r.start <= recorded + 600_000 && r.end >= recorded - 600_000),
    expandedFiveMinuteReferencePercent: round(100 * expanded.reduce((n, r) => n + r.end - r.start, 0) / total),
    topIntervals: merged.map((r) => ({ startUtc: iso(r.start), endUtc: iso(r.end),
      startOffsetSeconds: round((r.start - recorded) / 1000), endOffsetSeconds: round((r.end - recorded) / 1000) })) };
}

function fiveLevels(chart: InsertChart, ctx: ReturnType<typeof context>, e: ChartEvent, eventMs: number) {
  const path = vimshottariPathAt(ctx.moon.lon, ctx.birth.toMillis(), eventMs, 5);
  const p = path.map((x) => x.lord);
  const make = (a: typeof p[number], b: typeof p[number], c: typeof p[number]) => manleyEvidence(
    { label: matterOf(e.matter).label, date: e.date, matter: e.matter, time: e.time, timezone: e.timezone, birthTimezone: chart.timezone },
    ctx.natal, ctx.asc, [a, b, c]);
  const first = make(p[0], p[1], p[2]);
  const deeper = make(p[3], p[4], p[2]);
  if (!first?.antara || !deeper) throw new Error(`Missing period evidence: ${chart.name} ${e.date}`);
  const primary = [...first.periods, first.antara, ...deeper.periods].map((x) => link(x.frames[1]));
  return { eventUtc: iso(eventMs), lords: p, primary,
    gatedPrefix: primary.map((_, i) => primary.slice(0, i + 1).every(Boolean)),
    intervals: path.map(({ level, lord, startMs, endMs }) => ({ level, lord, startUtc: iso(startMs), endUtc: iso(endMs) })) };
}

function runCase(raw: PublicCase) {
  const chart = insertChartSchema.parse(raw.chart);
  const events = raw.events.map(({ id, matter, date, time, timezone, outcome }) => ({ id, matter, date, time, timezone, outcome }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(events.map(key)).size !== events.length || events.some((e) => !manleyTopicFor(e.matter)))
    throw new Error(`Invalid or unsupported events: ${chart.name}`);
  const dates = Array.from(new Set(events.map((e) => e.date)));
  const inputs = events.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const heldout = events.filter((e) => dates.indexOf(e.date) % 2 === 1);
  if (!inputs.length || !heldout.length) throw new Error(`Need input and heldout dates: ${chart.name}`);
  const { rows, recorded } = scan(chart, inputs);
  const ctx = context(chart, recorded);
  const models = Object.fromEntries((["M2", "M3", "S2", "S3"] as const).map((m) => [m, reportModel(rows, recorded, m)]));
  const actual = events.map((e) => atEvent(chart, ctx, e));
  const knownDates = new Set(events.map((e) => e.date));
  const controls = heldout.map((e) => ({ event: key(e), actual: atEvent(chart, ctx, e),
    comparisons: [-180, -120, -60, 60, 120, 180].map((delta) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: delta }).toISODate()!;
      if (knownDates.has(date)) return { delta, date, excluded: "recorded event date" };
      const shifted = { ...e, date };
      if (eventInstant(date, shifted, chart.timezone).toUTC().toMillis() < recorded) return { delta, date, excluded: "before birth" };
      return { delta, date, fact: atEvent(chart, ctx, shifted) };
    }) }));
  const dateOnlyClockSensitivity = events.filter((e) => !e.time).map((e) => ({ event: key(e),
    timezone: e.timezone ?? `${chart.timezone} (birth zone assumed)`,
    variants: ["00:01", "12:00", "23:59"].map((time) => {
      try { return { time, fact: atEvent(chart, ctx, { ...e, time }) }; }
      catch (error) { return { time, error: error instanceof Error ? error.message : String(error) }; }
    }) }));
  const timedEvents = events.filter((e) => e.time).map((e) => {
    const eventMs = eventInstant(e.date, e, chart.timezone).toUTC().toMillis();
    return { event: key(e), source: raw.events.find((x) => key(x) === key(e))?.source,
      statedTime: e.time, timezone: e.timezone ?? `${chart.timezone} (birth zone assumed)`,
      part: inputs.includes(e) ? "input" : "heldout",
      // A stated clock is not assumed to be accurate; these are sensitivity scenarios.
      scenarios: [-60, 0, 60].map((minutes) => ({ minutes, ...fiveLevels(chart, ctx, e, eventMs + minutes * 60_000) })) };
  });
  return { name: chart.name, category: raw.category, birthSource: raw.birthSource, birthQuality: raw.birthQuality,
    basis: chart.timeStandard, reportedBirthUtc: iso(recorded), inputs: inputs.map(key), heldout: heldout.map(key),
    segmentCount: rows.length, actual, models, controls, dateOnlyClockSensitivity, timedEvents };
}

const cohorts: Record<string, ReturnType<typeof runCase>[]> = {};
for (const [name, path] of Object.entries(paths)) {
  const data = JSON.parse(readFileSync(path, "utf8")) as { cases: PublicCase[] };
  cohorts[name] = data.cases.map((c) => {
    process.stderr.write(`Evaluating ${name}: ${c.chart.name}\n`);
    return runCase(c);
  });
}
const hashed = ["docs/parashari-staged-protocol.md", ...Object.values(paths), "scripts/eval-parashari-staged.ts",
  "shared/staged-period-research.ts", "shared/vimshottari-depth.ts", "shared/manley-evidence.ts", "shared/kp.ts", "shared/vargas.ts", "server/ephemeris.ts", "server/event-time.ts"];
process.stdout.write(JSON.stringify({ protocol: "docs/parashari-staged-protocol.md",
  hashes: Object.fromEntries(hashed.map((p) => [p, sha(p)])),
  caution: "Exploratory, previously seen cases. An absent partial link is unresolved, not proof of failure. Date-only events use assumed noon for the three-level scan. Levels 4–5 are not ranked.",
  cohorts }, null, 2) + "\n");
