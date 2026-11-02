/** Public-only frozen cohort; personal data must not be added here. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { baselineFor, methodScore } from "@shared/rectify-methods";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";
import { topicReading } from "../server/topic-reading";

type Case = { name: string; category: string; birthSource: string; quality: string; chart: InsertChart; events: Array<ChartEvent & { sources: string[] }> };
const fixture = process.argv[2] ?? "scripts/fixtures/alp-kp-matched-fresh.json";
const input = JSON.parse(readFileSync(fixture, "utf8")) as { protocol: string; cases: Case[] };
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
for (const c of input.cases) for (const f of readdirSync("scripts/fixtures").filter((x) => x.endsWith(".json") && `scripts/fixtures/${x}` !== fixture)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${f}`, "utf8"));
  const rows = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(rows) && rows.some((r) => normalize(r?.name ?? r?.chart?.name ?? "") === normalize(c.name))) throw new Error(`${c.name} already in ${f}`);
}
const asOf = "2026-11-01T12:00:00.000Z";
const results = input.cases.map((c) => {
  process.stderr.write(`Evaluating ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const v = validateEvents({ ...chart, events: c.events }, asOf);
  const ev = c.events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
  const scan = rectify({ chart, events: ev, windowMinutes: 5, judgedAsOf: asOf });
  const seg = scan.segments.find((s) => s.given && s.selectable);
  assert.ok(seg);
  const candidate = { ...chart, birthDate: seg.midDate!, birthTime: seg.mid };
  const mid = validateEvents({ ...candidate, events: c.events }, asOf);
  assert.deepEqual(seg.kpMatched, mid.kpMatched);
  assert.deepEqual(seg.alpMatched, mid.alpMatched);
  assert.deepEqual(methodScore(seg, "kp-events"), { score: mid.summary.kpScore, max: mid.summary.kpMax });
  assert.deepEqual(baselineFor(seg, "kp-events"), mid.kpMatched?.status === "available" ? mid.kpMatched.timing : undefined);
  for (let i = 0; i < c.events.length; i++) {
    assert.deepEqual(topicReading(chart, c.events[i], asOf).alp?.marriage, v.events[i].alp?.marriage);
    assert.deepEqual(seg.events[i].alp?.marriage, mid.events[i].alp?.marriage);
  }
  const weddings = v.events.filter((e) => e.matter === "marriage").map((e) => ({ id: e.id, date: e.date, context: e.alp?.marriage, scoredPada: e.qualifiedScores?.alp }));
  const sensitivity = c.name === "Cindy Crawford" ? { label: "02:08 AM alternative", result: validateEvents({ ...chart, birthTime: "02:08", events: c.events }, asOf) }
    : c.name === "Flore Landru" ? { label: "29 September birth-date alternative", result: validateEvents({ ...chart, birthDate: "1835-09-29", events: c.events }, asOf) }
    : c.name === "Tony Martin" ? { label: "10:00 AM Oakland alternative", result: validateEvents({ ...chart, birthTime: "10:00", place: "Oakland, California", latitude: 37.8044, longitude: -122.2712, events: c.events }, asOf) } : undefined;
  return { name: c.name, category: c.category, birthSource: c.birthSource, quality: c.quality,
    anchor: `${chart.birthDate} ${chart.birthTime} ${chart.timezone} (${chart.timeStandard})`,
    weddings, alpMatched: v.alpMatched, kp: { total: v.summary.kpScore, max: v.summary.kpMax, old: v.baseline?.kp ?? null, matched: v.kpMatched },
    scan: { rangeMinutes: 5, segments: scan.segments.length, givenMidpoint: seg.mid,
      kpTotal: methodScore(seg, "kp-events"), matched: seg.kpMatched,
      distinctMatchedOffsets: new Set(scan.segments.map((s) => JSON.stringify(s.kpMatched?.status === "available" ? s.kpMatched.offsets : null))).size },
    ...(sensitivity ? { sensitivity: { label: sensitivity.label, weddings: sensitivity.result.events.filter((e) => e.matter === "marriage").map((e) => ({ id: e.id, context: e.alp?.marriage })), kpMatched: sensitivity.result.kpMatched } } : {}),
  };
});
const files = [fixture, input.protocol, "scripts/eval-alp-kp-matched.ts", "shared/alp-marriage.ts", "shared/alp.ts", "shared/alp-event-evidence.ts", "shared/catalogue-comparison.ts", "shared/kp-matched-types.ts", "shared/alp-matched-types.ts", "shared/rectify-methods.ts", "server/kp-matched-comparison.ts", "server/alp-matched-comparison.ts", "server/rectify.ts", "server/validate.ts", "server/topic-reading.ts", "server/ephemeris.ts"];
const hash = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
console.log(JSON.stringify({ protocol: input.protocol, hashes: Object.fromEntries(files.map((f) => [f, hash(f)])),
  caution: "Small retrospective convenience sample; sources can conflict, records were not independently inspected, and shifted dates are not verified non-events.", results }, null, 2));
