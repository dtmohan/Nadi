/** Frozen public-case audit: node --import tsx scripts/eval-parashari-functional.ts */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";
import { matterOf, type ChartEvent } from "@shared/events";
import { functionalObservation } from "@shared/parashari-functional";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { ascendantAt, birthInstant, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { createParashariEventScorer } from "../server/parashari-event";
import { validateEvents } from "../server/validate";

type PublicEvent = ChartEvent & { sources: string[]; alternateDates?: string[]; alternateTimes?: string[] };
type PublicCase = { name: string; category: string; birthSource: string; birthQuality: string;
  chart: InsertChart; alternateBirthTimes?: string[]; events: PublicEvent[] };
const protocol = "docs/parashari-functional-lordship-protocol.md";
const fixturePath = "scripts/fixtures/parashari-functional-fresh.json";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: PublicCase[] };
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

function frameAt(chart: InsertChart, utc: DateTime) {
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const jd = julianDay(utc), natal = positionsAt(jd, opts), lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  return { opts, natal, lagna, scorer: createParashariEventScorer(natal, lagna, utc.toISO()!, chart.timezone) };
}
function eventAt(chart: InsertChart, frame: ReturnType<typeof frameAt>, e: PublicEvent) {
  const at = eventInstant(e.date, e, chart.timezone).toUTC();
  const manley = frame.scorer({ ...e, label: matterOf(e.matter).label }, e.date, at.toISO()!,
    positionsLite(julianDay(at), frame.opts)).manley;
  const count = functionalObservation(manley, e.outcome);
  if (!manley || count === undefined) throw new Error(`Unassessed ${chart.name}: ${e.id}`);
  return { id: e.id, matter: e.matter, date: e.date, time: e.time ?? "12:00 assumed", timezone: e.timezone ?? chart.timezone,
    count, division: manley.division, periods: [...manley.periods, ...(manley.antara ? [manley.antara] : [])].map((p) => ({
      level: p.level, planet: p.planet, frames: p.frames.map((f) => ({ chart: f.chart, ascendant: SIGNS[f.ascendant],
        matterHouse: f.house, matterLord: f.houseLord, functional: f.functional, primary: f.primary, supporting: f.supporting }))
    })) };
}

/** Select only from the geometry of the rising sign, before using event values. */
function nearestBoundary(chart: InsertChart, reported: DateTime) {
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  const signAt = (ms: number) => Math.floor(ascendantAt(julianDay(DateTime.fromMillis(ms, { zone: "utc" })), chart.latitude, chart.longitude, opts) / 30);
  const center = reported.toMillis(), start = center - 120 * 60_000, end = center + 120 * 60_000;
  const hits: number[] = [];
  let previous = start, prevSign = signAt(previous);
  for (let now = start + 60_000; now <= end; now += 60_000) {
    const current = signAt(now);
    if (current !== prevSign) {
      let lo = previous, hi = now;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (signAt(mid) === prevSign) lo = mid; else hi = mid; }
      hits.push(hi);
    }
    previous = now; prevSign = current;
  }
  const boundary = hits.sort((a, b) => Math.abs(a - center) - Math.abs(b - center) || a - b)[0];
  if (boundary === undefined) return undefined;
  const wall = DateTime.fromISO(`${chart.birthDate}T${chart.birthTime}`, { zone: "utc" });
  const localLabel = (ms: number) => wall.plus({ milliseconds: ms - center }).toFormat("yyyy-LL-dd HH:mm:ss");
  return { utc: DateTime.fromMillis(boundary, { zone: "utc" }).toISO(), local: localLabel(boundary),
    minutesFromReported: Math.round((boundary - center) / 600) / 100,
    before: { utc: DateTime.fromMillis(boundary - 30_000, { zone: "utc" }), local: localLabel(boundary - 30_000) },
    after: { utc: DateTime.fromMillis(boundary + 30_000, { zone: "utc" }), local: localLabel(boundary + 30_000) } };
}

// Guard freshness against all existing structured case lists, independently of the results.
const oldNames = new Set<string>();
for (const file of readdirSync("scripts/fixtures").filter((p) => p.endsWith(".json") && `scripts/fixtures/${p}` !== fixturePath)) {
  const j = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const list = Array.isArray(j) ? j : j.cases ?? j.charts ?? [];
  if (Array.isArray(list)) for (const item of list) { const name = item?.name ?? item?.chart?.name ?? item?.chartName; if (name) oldNames.add(name); }
}
const results = [];
for (const c of fixture.cases) {
  if (oldNames.has(c.name)) throw new Error(`Previously used public case: ${c.name}`);
  if (c.events.length !== 3) throw new Error(`Expected two reference events and one holdout: ${c.name}`);
  const chart = insertChartSchema.parse(c.chart), reported = birthInstant(chart).utc, frame = frameAt(chart, reported);
  const input = c.events.slice(0, 2), heldout = c.events[2];
  process.stderr.write(`Evaluating ${c.name}\n`);
  const actual = c.events.map((e) => eventAt(chart, frame, e));
  const validation = validateEvents({ ...chart, events: input });
  const validationCounts = input.map((e) => {
    const result = validation.events.find((v) => v.id === e.id)!;
    return functionalObservation(result.manley, result.outcome);
  });
  assert.deepEqual(actual.slice(0, 2).map((a) => a.count), validationCounts, `${c.name} direct/Validate mismatch`);
  if (validation.baseline?.parashari?.functional)
    assert.equal(actual.slice(0, 2).reduce((sum, a) => sum + a.count, 0), validation.baseline.parashari.functional.stat.actual);
  const controls = [-180, -120, -60, 60, 120, 180].map((n) => {
    const date = DateTime.fromISO(heldout.date, { zone: "utc" }).plus({ days: n }).toISODate()!;
    return { offsetDays: n, ...eventAt(chart, frame, { ...heldout, date }) };
  });
  const boundary = nearestBoundary(chart, reported);
  const candidate = (side: { utc: DateTime; local: string }) => {
    const f = frameAt(chart, side.utc);
    const events = c.events.map((e) => eventAt(chart, f, e));
    return { local: side.local, utc: side.utc.toISO(), ascendant: SIGNS[Math.floor(f.lagna / 30)],
      referenceCount: events.slice(0, 2).reduce((sum, e) => sum + e.count, 0), heldoutCount: events[2].count, events };
  };
  const sides = boundary ? { before: candidate(boundary.before), after: candidate(boundary.after) } : undefined;
  const reportedSign = SIGNS[Math.floor(frame.lagna / 30)];
  const alternateBirths = (c.alternateBirthTimes ?? []).map((birthTime) => {
    const alternative = { ...chart, birthTime }, f = frameAt(alternative, birthInstant(alternative).utc);
    return { birthTime, ascendant: SIGNS[Math.floor(f.lagna / 30)], events: c.events.map((e) => eventAt(alternative, f, e)) };
  });
  const alternateEvents = c.events.flatMap((e) => [
    ...(e.alternateDates ?? []).map((date) => eventAt(chart, frame, { ...e, date })),
    ...(e.alternateTimes ?? []).map((time) => eventAt(chart, frame, { ...e, time })),
  ]);
  results.push({ name: c.name, category: c.category, birthSource: c.birthSource, birthQuality: c.birthQuality,
    reportedBirthTime: chart.birthTime, timeStandard: chart.timeStandard, reportedSign, events: actual,
    randomComparison: validation.baseline?.parashari?.functional ?? null,
    randomComparisonUnavailable: validation.baseline ? undefined : "Reference dates span less than one year", controls, alternateBirths, alternateEvents,
    boundary: boundary && sides ? { local: boundary.local, utc: boundary.utc, minutesFromReported: boundary.minutesFromReported,
      reportedSide: sides.before.ascendant === reportedSign ? "before" : sides.after.ascendant === reportedSign ? "after" : "neither",
      ...sides } : null });
}

const hashed = [protocol, fixturePath, "scripts/eval-parashari-functional.ts", "shared/astro.ts", "shared/vargas.ts", "shared/kp.ts",
  "shared/events.ts", "shared/parashari-data.ts", "shared/parashari-functional.ts", "shared/manley-evidence.ts", "shared/parashari-comparison.ts",
  "shared/parashari-varga-evidence.ts", "server/ephemeris.ts", "server/event-time.ts", "server/parashari-event.ts", "server/validate.ts"];
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries(hashed.map((p) => [p, sha(p)])),
  caveat: "Small convenience sample; reported times and event clocks may be uncertain. Comparisons are unvalidated subsets, not predictions, verified non-events or birth-time estimates.", results }, null, 2) + "\n");
