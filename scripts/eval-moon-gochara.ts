/** Frozen public-case experiment; --stdin accepts a private chart without saving it. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";
import type { ChartEvent } from "@shared/events";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { validateEvents } from "../server/validate";
import { comparisonDates, observe, ranks, researchFrame, type Observation } from "./moon-gochara-research";

type Event = ChartEvent & { clockQuality?: string; sources?: string[]; alternateDates?: string[] };
type PublicCase = { name: string; category: string; birthSource: string; birthQuality: string; chart: InsertChart;
  alternateBirths?: Partial<InsertChart>[]; events: Event[] };
type EventResult = { id: string; date: string; clockQuality?: string; sources?: string[]; actual: Observation;
  comparisonCount: number; ranks: ReturnType<typeof ranks>; controls: (number | null)[][];
  clockSensitivity: { time: string; moonInSky: string; full: number; all7: number; jupiterVerdict: string; saturnVerdict: string }[];
  alternateDates: { date: string; actual: Observation }[] };
const protocol = "docs/moon-gochara-protocol.md", fixturePath = "scripts/fixtures/moon-gochara-fresh.json";
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const mean = (v: number[]) => v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
// Keep the 2,400 numeric control tuples readable without seven lines per date.
const formatReport = (data: unknown) => JSON.stringify(data, null, 2)
  .replace(/\[\n((?:[ \t]+(?:-?\d+|null),?\n)+)[ \t]*\]/g, (_, values: string) => `[${values.trim().replace(/\s+/g, " ")}]`);

function evaluateEvent(chart: InsertChart, frame: ReturnType<typeof researchFrame>, event: Event, key: string): EventResult {
  const actual = observe(frame, event);
  const dates = comparisonDates(chart, event, key);
  const samples = dates.map(({ date }) => observe(frame, event, date));
  const clockSensitivity = event.clockQuality?.includes("reported by family") || event.clockQuality?.includes("reported by media")
    ? [] : ["00:00", "06:00", "12:00", "18:00"].map((time) => {
      const v = observe(frame, { ...event, time });
      return { time, moonInSky: v.moonInSky, full: v.full, all7: v.all7,
        jupiterVerdict: v.jupiter.verdict, saturnVerdict: v.saturn.verdict };
    });
  return { id: event.id, date: event.date, clockQuality: event.clockQuality, sources: event.sources,
    actual, comparisonCount: samples.length, ranks: ranks(actual, samples),
    controls: samples.map((s, i) => [dates[i].offset, s.full, s.house, s.all7, s.kp, s.kpTransit, s.parashari]),
    clockSensitivity, alternateDates: (event.alternateDates ?? []).map((date) => ({ date, actual: observe(frame, event, date) })) };
}

function summarise(cases: { name: string; events: EventResult[] }[]) {
  const all = cases.flatMap((c) => c.events), keys = ["full", "house", "all7", "kp", "kpWithTieBreak", "kpTransit", "kpTransitWithTieBreak", "parashari", "parashariWithTieBreak"] as const;
  const nums = (ev: EventResult[], key: typeof keys[number]) => ev.map((e) => e.ranks[key]).filter((x): x is number => x !== null);
  return { people: cases.length, events: all.length, controlsPerEvent: 200,
    eventWeightedMeanMidrank: Object.fromEntries(keys.map((key) => [key, mean(nums(all, key))])),
    personWeightedMeanMidrank: Object.fromEntries(keys.map((key) => [key, mean(cases.map((c) => mean(nums(c.events, key))).filter((x): x is number => x !== null))])),
    primaryFullActualCounts: [0, 1, 2].map((n) => ({ value: n, events: all.filter((e) => e.actual.full === n).length,
      controls: all.flatMap((e) => e.controls).filter((c) => c[1] === n).length })),
    clockSensitivity: { checked: all.filter((e) => e.clockSensitivity.length).length,
      moonSignChanges: all.filter((e) => new Set(e.clockSensitivity.map((s) => s.moonInSky)).size > 1).length,
      primaryCountChanges: all.filter((e) => new Set(e.clockSensitivity.map((s) => s.full)).size > 1).length,
      sevenPlanetCountChanges: all.filter((e) => new Set(e.clockSensitivity.map((s) => s.all7)).size > 1).length } };
}

function privateRun(input: { chart: InsertChart; events: Event[]; candidateTimes: string[] }) {
  const cases = input.candidateTimes.map((time) => {
    const chart = insertChartSchema.parse({ ...input.chart, birthTime: time });
    const frame = researchFrame(chart);
    const events = input.events.map((event) => evaluateEvent(chart, frame, event, `private/${event.id}`));
    return { time, natalMoon: SIGNS[frame.moon.signIndex], natalMoonLongitude: frame.moon.lon,
      ascendant: SIGNS[Math.floor(frame.lagna / 30)], ascendantLongitude: frame.lagna, events };
  });
  return { protocol, comparison: "same dates for every candidate; private input is not saved", cases };
}

if (process.argv.includes("--stdin")) {
  const input = JSON.parse(readFileSync(0, "utf8")) as Parameters<typeof privateRun>[0];
  process.stdout.write(formatReport(privateRun(input)) + "\n");
} else {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: PublicCase[] };
  const oldNames = new Set<string>();
  for (const file of readdirSync("scripts/fixtures").filter((p) => p.endsWith(".json") && `scripts/fixtures/${p}` !== fixturePath)) {
    const j = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
    const list = Array.isArray(j) ? j : j.cases ?? j.charts ?? [];
    if (Array.isArray(list)) for (const item of list) {
      const name = item?.name ?? item?.chart?.name ?? item?.chartName;
      if (name) oldNames.add(String(name).toLowerCase());
    }
  }
  const results = fixture.cases.map((item) => {
    if (oldNames.has(item.name.toLowerCase())) throw new Error(`Previously used public case: ${item.name}`);
    process.stderr.write(`Evaluating ${item.name}\n`);
    const chart = insertChartSchema.parse(item.chart), frame = researchFrame(chart);
    const events = item.events.map((event) => evaluateEvent(chart, frame, event, `${item.name}/${event.id}`));
    // Compare with the entire production Validate path for every real event, not a reimplementation.
    const validated = validateEvents({ ...chart, events: item.events });
    for (const e of events) {
      const original = validated.events.find((v) => v.id === e.id);
      assert.ok(original, `Validate omitted ${item.name}/${e.id}`);
      assert.equal(e.actual.kp, original.kp.score, `${item.name}/${e.id} KP period score`);
      assert.equal(e.actual.kpTransit, original.kp.transit.score, `${item.name}/${e.id} KP transit score`);
      assert.equal(e.actual.parashari, original.parashariDivisional?.score ?? null, `${item.name}/${e.id} Parashari score`);
    }
    // Also check the first sampled date for every event through Validate itself.
    const controlEvents = item.events.map((e, i) => ({ ...e,
      date: DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: events[i].controls[0][0]! }).toISODate()! }));
    const checkedControls = validateEvents({ ...chart, events: controlEvents });
    for (let i = 0; i < events.length; i++) {
      const control = checkedControls.events.find((v) => v.id === events[i].id);
      assert.ok(control, `Validate omitted control ${item.name}/${events[i].id}`);
      const row = events[i].controls[0];
      assert.equal(row[4], control.kp.score, `${item.name}/${events[i].id} control KP period score`);
      assert.equal(row[5], control.kp.transit.score, `${item.name}/${events[i].id} control KP transit score`);
      assert.equal(row[6], control.parashariDivisional?.score ?? null, `${item.name}/${events[i].id} control Parashari score`);
    }
    const alternateBirths = (item.alternateBirths ?? []).map((alternative) => {
      const altChart = insertChartSchema.parse({ ...chart, ...alternative }), altFrame = researchFrame(altChart);
      return { alternative, ascendant: SIGNS[Math.floor(altFrame.lagna / 30)], natalMoon: SIGNS[altFrame.moon.signIndex],
        events: item.events.map((event) => ({ id: event.id, actual: observe(altFrame, event) })) };
    });
    return { name: item.name, category: item.category, birthSource: item.birthSource, birthQuality: item.birthQuality,
      timeStandard: chart.timeStandard, birthTime: chart.birthTime, natalMoon: SIGNS[frame.moon.signIndex],
      ascendant: SIGNS[Math.floor(frame.lagna / 30)], parityWithValidate: { actual: true, oneSampledDatePerEvent: true }, events, alternateBirths };
  });
  const files = [protocol, fixturePath, "scripts/eval-moon-gochara.ts", "scripts/moon-gochara-research.ts", "shared/gochara.ts",
    "shared/ashtakavarga.ts", "shared/kp-event-evidence.ts", "shared/kp.ts", "server/parashari-event.ts", "server/validate.ts", "server/event-time.ts", "server/ephemeris.ts"];
  process.stdout.write(formatReport({ protocol, hashes: Object.fromEntries(files.map((p) => [p, sha(p)])),
    columns: ["offsetDays", "full", "house", "all7", "kp", "kpTransit", "parashari"],
    caveat: "Retrospective convenience sample; comparison dates are not verified non-events and ranks are not prediction or birth-time probabilities.",
    summary: summarise(results), results }) + "\n");
}
