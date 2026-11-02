/** Reproducible public-only study; the fixture and protocol were frozen before the run. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { methodScore } from "@shared/rectify-methods";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";
import { birthInstant, julianDay, positionsAt, ascendantAt } from "../server/ephemeris";
import { assessStrength } from "@shared/strength";
import { computePrasnaFructification } from "@shared/rules-prasna";
import { evaluate } from "@shared/rules";
import { EXTRA_RULES } from "@shared/rules-bnn";

type PublicCase = { name: string; category: string; birthQuality: string; birthSource: string;
  chart: InsertChart; events: Array<ChartEvent & { sources: string[] }> };
const fixture = "scripts/fixtures/alp-dignity-fresh.json";
const input = JSON.parse(readFileSync(fixture, "utf8")) as { protocol: string; cases: PublicCase[] };
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
for (const c of input.cases) for (const file of readdirSync("scripts/fixtures").filter((f) => f.endsWith(".json") && `scripts/fixtures/${f}` !== fixture)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const rows = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(rows)) for (const row of rows) if (normalize(row?.name ?? row?.chart?.name ?? "") === normalize(c.name))
    throw new Error(`${c.name} was already in ${file}`);
}
const asOf = "2026-11-01T12:00:00.000Z";
const compact = (score: ReturnType<typeof topicReading>["qualifiedScores"]) =>
  Object.fromEntries(["kp", "parashari", "alp", "bnn"].map((k) => [k, score?.[k as keyof NonNullable<typeof score>] ?? null]));
const results = input.cases.map((c) => {
  process.stderr.write(`Checking ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const jd = julianDay(birthInstant(chart).utc);
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" : "mean" } as const;
  const positions = positionsAt(jd, opts);
  const lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const prasna = computePrasnaFructification(positions, assessStrength(positions), Math.floor(lagna / 30))
    .filter((f) => [5, 7, 10].includes(f.house)).map((f) => ({ house: f.house, lord: f.lord, lordStrong: f.lordStrong,
      karaka: f.karaka, karakaStrong: f.karakaStrong, verdict: f.verdict }));
  const bnnRules = EXTRA_RULES.filter((r) => ["su-exalt", "ma-exalt", "auth-su-strong"].includes(r.id));
  const bnnDignityFindings = evaluate(positions, bnnRules, chart.gender as "male" | "female" | "unspecified").findings.map((f) => f.ruleId);
  const validate = validateEvents({ ...chart, events: c.events }, asOf);
  const req = c.events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
  const scan = rectify({ chart, windowMinutes: 10, events: req, judgedAsOf: asOf });
  const segment = scan.segments.find((s) => s.given && s.selectable);
  const band = scan.alpComparisonBands?.find((b) => b.given && b.selectable);
  assert.ok(segment && band, `${c.name}: missing selectable recorded-time sample`);
  const atSegment = validateEvents({ ...chart, birthDate: segment.midDate!, birthTime: segment.mid, events: c.events }, asOf);
  const atBand = validateEvents({ ...chart, birthDate: band.midDate, birthTime: band.mid, events: c.events }, asOf);
  assert.deepEqual(methodScore(segment, "kp-events"), { score: atSegment.summary.kpScore, max: atSegment.summary.kpMax });
  assert.deepEqual(segment.baseline?.kpEvents, atSegment.baseline?.kp);
  assert.deepEqual(band.baseline, atBand.baseline?.qualified?.alp);
  assert.equal(band.score, atBand.events.reduce((n, e) => n + (e.qualifiedScores?.alp?.score ?? 0), 0));
  const bands = scan.alpComparisonBands!;
  const rawTop = Math.max(...bands.map((b) => b.score));
  const totalMs = bands.reduce((n, b) => n + Date.parse(b.endIso) - Date.parse(b.startIso), 0);
  const topMs = bands.filter((b) => b.score === rawTop).reduce((n, b) => n + Date.parse(b.endIso) - Date.parse(b.startIso), 0);
  const rows = c.events.map((e, i) => {
    const reading = topicReading(chart, e, asOf);
    assert.deepEqual(reading.qualifiedScores, validate.events[i].qualifiedScores);
    return { id: e.id, date: e.date, matter: e.matter, note: e.note, sources: e.sources,
      reading: compact(reading.qualifiedScores),
      controls: [-180, -60, 60, 180].map((days) => {
        const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days }).toISODate()!;
        return { days, date, scores: compact(topicReading(chart, { ...e, date }, asOf).qualifiedScores) };
      }) };
  });
  const sensitivity: Array<{ scenario: string; scores: unknown }> = [];
  const alt = (scenario: string, candidate: InsertChart, ev: ChartEvent) => sensitivity.push({ scenario, scores: compact(topicReading(candidate, ev, asOf).qualifiedScores) });
  if (c.name === "Bridget Fonda") alt("Wedding Nov 30, alternative date", chart, { ...c.events[0], date: "2003-11-30" });
  if (c.name === "Élodie Gossuin") {
    alt("First twins Dec 20, alternative date", chart, { ...c.events[1], date: "2007-12-20" });
    alt("Second twins Oct 11, alternative date", chart, { ...c.events[2], date: "2013-10-11" });
    for (const e of c.events) alt(`Speculative 02:30 birth and ${e.id}`, { ...chart, birthTime: "02:30" }, e);
  }
  return { name: c.name, category: c.category, birthQuality: c.birthQuality, birthSource: c.birthSource,
    anchor: `${chart.birthDate} ${chart.birthTime} ${chart.timezone} (${chart.timeStandard})`,
    kp: { actual: validate.summary.kpScore, max: validate.summary.kpMax, baseline: validate.baseline?.kp ?? null,
      eventScores: validate.events.map((e) => ({ id: e.id, score: e.kp.score, max: e.kp.max })) },
    alp: { bandCount: bands.length, anchorBand: band, rawTop, topCoveragePercent: Math.round(1000 * topMs / totalMs) / 10 },
    segmentMidpoint: segment.mid, dignity: { prasna, bnnDignityFindings }, rows, sensitivity };
});
const files = [fixture, input.protocol, "scripts/eval-alp-dignity-fresh.ts", "server/rectify.ts", "server/validate.ts",
  "shared/alp-event-evidence.ts", "shared/rules-alp.ts", "shared/qualified-event-scores.ts", "shared/kp-legacy-aggregation.ts",
  "shared/rectify-methods.ts", "shared/parashari-houses.ts", "shared/parashari-padas.ts", "shared/rules-bnn.ts",
  "shared/sarvartha.ts", "shared/jaimini-areas.ts", "shared/planet-dignity.ts", "shared/rules-prasna.ts",
  "shared/strength.ts", "shared/rules.ts", "server/ephemeris.ts"];
const hash = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
console.log(JSON.stringify({ protocol: input.protocol, hashes: Object.fromEntries(files.map((f) => [f, hash(f)])),
  caution: "Public convenience sample; no source establishes the sampled birth second. Dates may conflict and random dates are not verified non-events.", results }, null, 2));
