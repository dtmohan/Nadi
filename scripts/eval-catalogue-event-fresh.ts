/** Reproduce the frozen public-only catalogue parity study; write results to stdout. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { computeAlp, DEFAULT_ALP_CONFIG } from "@shared/alp";
import { ALP_PLAIN_TOPIC_RULES } from "@shared/school-topics-expanded";
import { natalPlanetContext } from "@shared/planet-context";
import { additionalSchoolNatalConditions, kpNatalConditions, parashariNatalConditions } from "@shared/natal-reading-evidence";
import { KP_EVENT_FIELDS } from "@shared/reading-rule-catalog";
import { methodScore, type RectifyMethod } from "@shared/rectify-methods";
import { sensitiveGate } from "@shared/life-stage";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import type { EventValidation } from "@shared/validate-types";
import { computeChart } from "../server/routes";
import { eventInstant } from "../server/event-time";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";

type CaseEvent = ChartEvent & { sources: string[] };
type PublicCase = { name: string; category: string; birthQuality: string; birthSource: string; chart: InsertChart; events: CaseEvent[] };
const fixture = process.argv[2] ?? "scripts/fixtures/catalogue-event-fresh.json";
const input = JSON.parse(readFileSync(fixture, "utf8")) as { cases: PublicCase[] };
const protocol = (JSON.parse(readFileSync(fixture, "utf8")) as { protocol: string }).protocol;
const asOf = "2026-11-01T12:00:00.000Z";
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
for (const c of input.cases) for (const file of readdirSync("scripts/fixtures").filter((f) => f.endsWith(".json") && `scripts/fixtures/${f}` !== fixture)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const rows = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(rows)) for (const row of rows) if (normalize(row?.name ?? row?.chart?.name ?? "") === normalize(c.name)) throw new Error(`${c.name} is not fresh: ${file}`);
}
function compact(v: EventValidation) {
  return { kp: v.kp.score, kpTransit: v.kp.transit.score,
    kpIndication: v.kp.natalRules?.indication ?? null,
    kpNatalMatched: v.kp.natalRules?.rules.filter((r) => r.matched).map((r) => `${r.id}:${r.role}`) ?? [],
    kpPromiseMatched: v.kp.natalRules?.rules.filter((r) => r.matched && r.role === "promise").map((r) => ({ id: r.id, polarity: r.finding?.polarity })) ?? [],
    parashari: { v1: v.parashariPromise?.score ?? null, v2: v.parashariSpecific?.score ?? null,
      v3: v.parashariDivisional?.score ?? null, natalTone: v.parashariOrdinary?.natal.assessment?.tone ?? null,
      natalRules: v.parashariOrdinary?.natal.rules.map((r) => r.finding.id) ?? [],
      periods: v.parashariOrdinary?.periods.map((p) => ({ level: p.level, planet: p.planet, ruleIds: p.ruleIds })) ?? [] },
    additional: { bnnRules: v.additionalNatal?.bnn.findings.map((r) => r.ruleId) ?? [],
      jaiminiRules: v.additionalNatal?.jaimini.findings.map((r) => r.id) ?? [],
      gulikaHouse: v.additionalNatal?.prasna.gulikaClues?.house ?? null,
      jupiterGulika: v.additionalNatal?.prasna.gulikaClues?.jupiterFifthOrNinthAspect ?? null },
    alp: v.alp ? { status: v.alp.status, point: v.alp.point, akshaya: v.alp.akshaya,
      findings: v.alp.findings.map((f) => f.finding.ruleId) } : null };
}
const scores = (v: EventValidation) => [v.kp.score, v.kp.transit.score, v.parashariPromise?.score ?? null,
  v.parashariSpecific?.score ?? null, v.parashariDivisional?.score ?? null];
const alpKey = (v: EventValidation) => JSON.stringify(v.alp && [v.alp.point, v.alp.akshaya, v.alp.findings.map((r) => r.finding.ruleId)]);

const results = input.cases.map((c, index) => {
  process.stderr.write(`Checking ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const full = computeChart({ ...chart, id: index + 1, gender: chart.gender ?? "unspecified", timeStandard: chart.timeStandard ?? "auto",
    ayanamsa: chart.ayanamsa ?? "lahiri", nodeType: chart.nodeType ?? "mean", sunriseDef: chart.sunriseDef ?? "edge",
    parashariHouseMethod: chart.parashariHouseMethod ?? "rashi", notes: "", deathDate: chart.deathDate ?? null,
    timeUncertaintyMin: chart.timeUncertaintyMin ?? 0, events: chart.events ?? [] });
  full.now.asOf = asOf;
  const kpNatal = kpNatalConditions(full), parNatal = parashariNatalConditions(full), extraNatal = additionalSchoolNatalConditions(full);
  const validation = validateEvents({ ...chart, events: c.events }, asOf);
  const scanned = rectify({ chart, windowMinutes: 5, events: c.events.map((e) => { const m = matterOf(e.matter);
    return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; }), judgedAsOf: asOf });
  const mid = scanned.segments.find((s) => s.given && s.selectable);
  if (!mid) throw new Error(`${c.name}: no selectable recorded midpoint`);
  const candidate = { ...chart, birthDate: mid.midDate ?? chart.birthDate, birthTime: mid.mid };
  const candidateValidation = validateEvents({ ...candidate, events: c.events }, asOf);
  assert.deepEqual(mid.baseline?.catalogueComparison, candidateValidation.baseline?.catalogueComparison, `${c.name} comparison frequencies`);
  const rows = c.events.map((e, i) => {
    const actual = topicReading(chart, e, asOf);
    assert.deepEqual(actual, validation.events[i], `${c.name} ${e.id} Validate`);
    assert.deepEqual(kpNatal.find((x) => x.matter === e.matter)?.natalRules, actual.kp.natalRules, `${c.name} ${e.id} KP natal`);
    assert.deepEqual(parNatal.find((x) => x.matter === e.matter)?.ordinary, actual.parashariOrdinary?.natal, `${c.name} ${e.id} Parashari natal`);
    assert.deepEqual(extraNatal.find((x) => x.matter === e.matter), actual.additionalNatal, `${c.name} ${e.id} extra natal`);
    if (actual.alp?.status === "assessed" && actual.alp.topic) {
      const when = eventInstant(e.date, e, chart.timezone).toUTC().toISO()!;
      const alp = computeAlp(natalPlanetContext(full), full.jaimini.lagna.lon, full.utc, when, DEFAULT_ALP_CONFIG,
        sensitiveGate(chart, full.utc, asOf).withheld || sensitiveGate(chart, full.utc, when).withheld);
      const expected = alp.findings.flatMap((finding) => { const topicMeaning = ALP_PLAIN_TOPIC_RULES[finding.ruleId]?.[actual.alp!.topic!];
        return topicMeaning ? [{ finding, topicMeaning }] : []; });
      assert.deepEqual(actual.alp.findings, expected, `${c.name} ${e.id} ALP ordinary`);
    }
    const replay = topicReading(candidate, e, asOf), r = mid.events[i];
    for (const key of Object.keys(KP_EVENT_FIELDS) as Array<keyof typeof KP_EVENT_FIELDS>) {
      if (key === "transit") { const { evidence: _evidence, ...shared } = replay.kp.transit; assert.deepEqual(r.transit, shared); }
      else assert.deepEqual(r[key], replay.kp[key], `${c.name} ${e.id} KP ${key}`);
    }
    assert.deepEqual(mid.parashariOrdinary?.[i], replay.parashariOrdinary, `${c.name} ${e.id} Parashari candidate`);
    assert.deepEqual(r.additionalNatal, replay.additionalNatal, `${c.name} ${e.id} extra candidate`);
    assert.deepEqual(r.alp, replay.alp, `${c.name} ${e.id} ALP candidate`);
    const controls = [-180, -120, -60, 60, 120, 180].map((offsetDays) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: offsetDays }).toISODate()!;
      const v = topicReading(chart, { ...e, date }, asOf);
      return { offsetDays, date, scores: scores(v), sameScoreVector: JSON.stringify(scores(v)) === JSON.stringify(scores(actual)),
        sameAlpState: alpKey(v) === alpKey(actual) };
    });
    if (validation.baseline?.example) {
      const sample = validation.baseline.example[i];
      const trial = topicReading(chart, { ...e, date: sample.date }, asOf);
      assert.deepEqual(sample.natalRules, trial.kp.natalRules);
      assert.deepEqual(sample.parashariOrdinary, trial.parashariOrdinary);
      assert.deepEqual(sample.additionalNatal, trial.additionalNatal);
      assert.deepEqual(sample.alp, trial.alp);
    }
    return { id: e.id, matter: e.matter, date: e.date, clock: e.time ?? "12:00 assumed",
      zone: e.timezone ?? `${chart.timezone} assumed`, note: e.note, sources: e.sources, exactParity: true,
      actual: compact(actual), controls, catalogueComparison: validation.baseline?.catalogueComparison?.[i],
      randomComparison: validation.baseline ? "200 sets; first set replayed; descriptive rule frequencies compared" : "unavailable: fewer than two events or span under one year" };
  });
  const rankings = (["kp-events", "parashari-events-v3"] as RectifyMethod[]).map((method) => {
    const values = scanned.segments.map((s) => ({ s, ...methodScore(s, method) }));
    const maxScore = Math.max(...values.map((v) => v.score));
    const eligible = values.some((v) => v.max > 0);
    const top = eligible ? values.filter((v) => v.score === maxScore) : [];
    const span = values.reduce((a, v) => a + Date.parse(v.s.endIso) - Date.parse(v.s.startIso), 0);
    const topSpan = top.reduce((a, v) => a + Date.parse(v.s.endIso) - Date.parse(v.s.startIso), 0);
    return { method, eligible, topScore: eligible ? maxScore : null, givenSampleIsTop: top.some((v) => v.s.given),
      topSegments: top.length, totalSegments: values.length, topCoveragePct: span ? Math.round(1000 * topSpan / span) / 10 : null };
  });
  return { name: c.name, category: c.category, birthQuality: c.birthQuality, birthSource: c.birthSource,
    reportedBirth: `${chart.birthDate} ${chart.birthTime} ${chart.timezone}`, midpoint: `${mid.midDate} ${mid.mid}`,
    scanHalfWindowMinutes: 5, rankings, events: rows };
});
const hashed = [protocol, fixture, "scripts/eval-catalogue-event-fresh.ts", "shared/kp-event-natal-rules.ts",
  "shared/parashari-event-natal-rules.ts", "shared/additional-school-event-rules.ts", "shared/alp-event-evidence.ts", "shared/catalogue-comparison.ts",
  "shared/rules-kp.ts", "shared/parashari.ts", "shared/rules-alp.ts", "server/validate.ts", "server/rectify.ts", "server/parashari-event.ts", "server/additional-school-events.ts"];
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
console.log(JSON.stringify({ protocol, hashes: Object.fromEntries(hashed.map((path) => [path, hash(path)])),
  warning: "Public convenience cases. Path parity does not establish a prediction or verify reported times. Comparison dates are not known non-events.", results }, null, 2));
