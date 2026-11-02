/** Frozen public-only research study; no user data. Reproduce with node --import tsx. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { QUALIFIED_SCORE_KEYS } from "@shared/qualified-event-scores";
import { methodScore, type RectifyMethod } from "@shared/rectify-methods";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";

type PublicCase = { name: string; category: string; birthQuality: string; birthSource: string;
  chart: InsertChart; events: Array<ChartEvent & { sources: string[] }> };
const fixture = process.argv[2] ?? "scripts/fixtures/event-score-fresh.json";
const input = JSON.parse(readFileSync(fixture, "utf8")) as { protocol: string; cases: PublicCase[] };
const asOf = "2026-11-01T12:00:00.000Z";
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
for (const c of input.cases) for (const file of readdirSync("scripts/fixtures").filter((f) => f.endsWith(".json") && `scripts/fixtures/${f}` !== fixture)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const rows = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(rows)) for (const row of rows) if (normalize(row?.name ?? row?.chart?.name ?? "") === normalize(c.name))
    throw new Error(`${c.name} was already in ${file}`);
}
const methods: RectifyMethod[] = ["kp-qualified", "parashari-events-v4", "alp-marriage", "bnn-marriage"];
function compact(scores: ReturnType<typeof topicReading>["qualifiedScores"]) {
  return Object.fromEntries(QUALIFIED_SCORE_KEYS.map((k) => [k, scores?.[k] ? {
    score: scores[k]!.score, max: scores[k]!.max,
    conditions: scores[k]!.conditions.map((c) => ({ id: c.id, status: c.status })) } : null]));
}
const results = input.cases.map((c) => {
  process.stderr.write(`Checking ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const validation = validateEvents({ ...chart, events: c.events }, asOf);
  const scan = rectify({ chart, windowMinutes: 10, events: c.events.map((e) => { const m = matterOf(e.matter);
    return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; }), judgedAsOf: asOf });
  const s = scan.segments.find((item) => item.given && item.selectable);
  if (!s) throw new Error(`${c.name}: recorded midpoint is not selectable`);
  const candidate = { ...chart, birthDate: s.midDate ?? chart.birthDate, birthTime: s.mid };
  const candidateValidation = validateEvents({ ...candidate, events: c.events }, asOf);
  assert.deepEqual(s.baseline?.qualified, candidateValidation.baseline?.qualified, `${c.name}: all random-score aggregates`);
  const events = c.events.map((e, i) => {
    const exact = topicReading(chart, e, asOf);
    assert.deepEqual(exact.qualifiedScores, validation.events[i].qualifiedScores, `${c.name}: exact reading and Validate`);
    assert.deepEqual(s.events[i].qualifiedScores, candidateValidation.events[i].qualifiedScores, `${c.name}: scan midpoint and Validate`);
    if (s.baseline?.catalogueExample) {
      const example = s.baseline.catalogueExample[i];
      assert.deepEqual(example.qualifiedScores, topicReading(candidate, { ...e, date: example.date }, asOf).qualifiedScores, `${c.name}: first random replay`);
    }
    const controls = [-180, -60, 60, 180].map((days) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days }).toISODate()!;
      return { offsetDays: days, date, scores: compact(topicReading(chart, { ...e, date }, asOf).qualifiedScores) };
    });
    return { id: e.id, matter: e.matter, date: e.date, clock: e.time ?? "noon assumed", zone: e.timezone ?? `${chart.timezone} assumed`,
      note: e.note, sources: e.sources, recorded: compact(exact.qualifiedScores), controls };
  });
  const rankings = methods.map((method) => {
    const rows = scan.segments.map((seg) => ({ seg, ...methodScore(seg, method) }));
    const max = rows[0]?.max ?? 0, comparable = max > 0 && rows.every((r) => r.max === max);
    const top = comparable ? Math.max(...rows.map((r) => r.score)) : null;
    const selected = top === null ? [] : rows.filter((r) => r.score === top);
    const duration = (r: typeof rows[number]) => Date.parse(r.seg.endIso) - Date.parse(r.seg.startIso);
    const total = rows.reduce((a, r) => a + duration(r), 0), topDuration = selected.reduce((a, r) => a + duration(r), 0);
    return { method, comparable, topScore: top, max, recordedSegmentScore: rows.find((r) => r.seg.given)?.score ?? null,
      recordedSegmentIsTop: selected.some((r) => r.seg.given), topIntervals: selected.length, totalIntervals: rows.length,
      topCoveragePct: comparable && total ? Math.round(1000 * topDuration / total) / 10 : null,
      comparison: s.baseline?.qualified?.[method === "kp-qualified" ? "kp" : method === "parashari-events-v4" ? "parashari" : method === "alp-marriage" ? "alp" : "bnn"] ?? null };
  });
  let sensitivity: unknown;
  if (c.name === "Annie Glenn") {
    const alt = { ...chart, timezone: "America/New_York" };
    sensitivity = { scenario: "Birth zone America/New_York rather than Astro-Databank's UTC-06:00; same local clock",
      scores: c.events.map((e) => ({ id: e.id, scores: compact(topicReading(alt, e, asOf).qualifiedScores) })) };
  } else if (c.name === "Catherine Rich" || c.name === "Karina") {
    const dates = c.name === "Catherine Rich" ? ["1959-06-20"] : ["1998-06-21", "1998-06-27"];
    sensitivity = dates.map((date) => ({ date, scores: compact(topicReading(chart, { ...c.events[0], date }, asOf).qualifiedScores) }));
  }
  return { name: c.name, category: c.category, birthQuality: c.birthQuality, birthSource: c.birthSource,
    reportedBirth: `${chart.birthDate} ${chart.birthTime} ${chart.timezone}`, midpoint: `${s.midDate} ${s.mid}`,
    scanHalfWindowMinutes: 10, comparisons: validation.baseline?.qualified ?? null, rankings, events, sensitivity };
});
const files = [fixture, input.protocol, "scripts/eval-qualified-event-fresh.ts", "shared/qualified-event-scores.ts",
  "shared/kp-event-natal-rules.ts", "shared/parashari-divisional.ts", "shared/parashari-event-natal-rules.ts", "shared/alp-event-evidence.ts",
  "shared/kp.ts", "shared/planet-context.ts", "shared/planet-dignity.ts", "shared/parashari.ts", "shared/parashari-dasa.ts",
  "shared/rectify-methods.ts", "shared/parashari-score-aggregation.ts", "shared/parashari-comparison.ts",
  "server/ephemeris.ts", "server/additional-school-events.ts", "server/parashari-event.ts", "server/validate.ts", "server/rectify.ts"];
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
console.log(JSON.stringify({ protocol: input.protocol, hashes: Object.fromEntries(files.map((f) => [f, hash(f)])),
  warning: "Small public convenience sample; scores and controls do not verify reported times or test whether astrology predicts events. Top intervals use midpoint sampling; controls are not known non-events.", results }, null, 2));
