import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QUALIFIED_SCORE_KEYS, qualifiedComparable, qualifiedEventScores, qualifiedTotals, type QualifiedEventScores } from "@shared/qualified-event-scores";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema } from "@shared/schema";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { comparisonSeed, seeded, validateEvents } from "../server/validate";
import { comparisonDate } from "../server/event-time";
import { buildReport } from "@shared/report";
import { computeChart } from "../server/routes";
import { QualifiedEventScoresPanel } from "../client/src/components/qualified-event-scores";
import type { RectifyMethod } from "@shared/rectify-methods";

const base = insertChartSchema.parse({ name: "Synthetic score parity", gender: "female", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", parashariHouseMethod: "equal" });
const asOf = "2026-11-01T12:00:00Z";
const events: ChartEvent[] = [
  { id: "m", matter: "marriage", date: "2012-03-11", time: "11:15", timezone: "America/New_York" },
  { id: "c", matter: "child", date: "2018-07-22", time: "15:30", timezone: "America/Los_Angeles" },
];
const request = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });

test("sequential natal and period conditions stop on unresolved stages; contextual and non-favourable events are unavailable", () => {
  const real = topicReading(base, events[0], asOf);
  const common = { matter: "marriage", outcome: "favourable" as const, birthIso: "1990-01-01T00:00:00Z", eventIso: "2012-03-11T12:00:00Z",
    gender: "female", natalPositions: [{ planet: "Mars" as const, signIndex: 1 }], sky: [{ planet: "Jupiter" as const, signIndex: 1 }],
    kp: real.kp, alp: real.alp, additional: real.additionalNatal };
  const natal = real.kp.natalRules!;
  const kp = { ...real.kp, hits: [true, false, true] as [boolean, boolean, boolean],
    natalRules: { ...natal, indication: { ...natal.indication, status: "support" as const } } };
  const score = qualifiedEventScores({ ...common, kp });
  assert.equal(score.kp?.score, 2);
  assert.deepEqual(score.kp?.conditions.map((c) => c.status), ["matched", "matched", "unresolved", "not-reached"]);
  assert.equal(score.bnn?.score, 1);
  assert.equal(qualifiedEventScores({ ...common, kp: { ...kp, natalRules: { ...kp.natalRules,
    indication: { ...kp.natalRules.indication, status: "mixed" } } } }).kp?.score, 0);
  assert.deepEqual(qualifiedEventScores({ ...common, outcome: "mixed", kp }), {});
  assert.deepEqual(qualifiedEventScores({ ...common, custom: true, kp }), {});
  assert.deepEqual(qualifiedEventScores({ ...common, afterDeath: true, kp }), {});
  assert.equal(qualifiedEventScores({ ...common, gender: "unspecified", kp }).bnn, undefined);
  assert.equal(qualifiedEventScores({ ...common, sky: [{ planet: "Jupiter", signIndex: 2 }], kp }).bnn?.score, 0);
  assert.equal(qualifiedEventScores({ ...common, matter: "vehicle", kp: { ...kp, natalRules: { ...kp.natalRules, rules: [] } } }).kp, undefined);
});

test("actual and all 200 comparison sets use exactly the same research checks in Validate and Rectify", () => {
  const validation = validateEvents({ ...base, events }, asOf);
  const scan = rectify({ chart: base, windowMinutes: 1, events: request, judgedAsOf: asOf });
  const seg = scan.segments.find((s) => s.given && s.selectable)!;
  const candidate = { ...base, birthDate: seg.midDate ?? base.birthDate, birthTime: seg.mid };
  const check = validateEvents({ ...candidate, events }, asOf);
  assert.deepEqual(seg.baseline?.qualified, check.baseline?.qualified);
  for (let i = 0; i < events.length; i++) {
    assert.deepEqual(validation.events[i].qualifiedScores, topicReading(base, events[i], asOf).qualifiedScores);
    assert.deepEqual(seg.events[i].qualifiedScores, check.events[i].qualifiedScores);
    const ex = seg.baseline!.catalogueExample![i];
    assert.deepEqual(ex.qualifiedScores, topicReading(candidate, { ...events[i], date: ex.date }, asOf).qualifiedScores);
  }
  const rnd = seeded(comparisonSeed(events.map((e) => e.date)));
  const lo = DateTime.fromISO(events[0].date, { zone: "utc" }).toMillis(), hi = DateTime.fromISO(events[1].date, { zone: "utc" }).toMillis();
  const actual = validation.events.map((v) => v.qualifiedScores);
  const samples: Record<string, number[]> = { kp: [], parashari: [], alp: [], bnn: [] };
  for (let t = 0; t < 200; t++) {
    const results = events.map((e) => topicReading(base, { ...e, date: comparisonDate(rnd, lo, hi, e, base.timezone) }, asOf).qualifiedScores);
    for (const key of QUALIFIED_SCORE_KEYS) {
      assert.ok(qualifiedComparable(actual, results, key));
      samples[key].push(qualifiedTotals(results, key).score);
    }
  }
  for (const key of QUALIFIED_SCORE_KEYS) {
    const total = qualifiedTotals(actual, key), baseline = validation.baseline?.qualified?.[key];
    if (!total.max) { assert.equal(baseline, undefined); continue; }
    const xs = samples[key];
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    const percentile = Math.round((xs.filter((n) => n < total.score).length + xs.filter((n) => n === total.score).length / 2) / xs.length * 100);
    assert.deepEqual([baseline?.actual, baseline?.mean, baseline?.sd, baseline?.percentile],
      [total.score, Math.round(mean * 10) / 10, Math.round(sd * 10) / 10, percentile], key);
  }
});

test("missing sampled eligibility is never counted as a zero", () => {
  const assessed: QualifiedEventScores = { alp: { score: 0, max: 1, conditions: [] } };
  assert.equal(qualifiedComparable([assessed], [{}], "alp"), false);
  assert.equal(qualifiedComparable([assessed], [assessed], "alp"), true);
  assert.deepEqual(qualifiedTotals([{}, assessed], "alp"), { score: 0, max: 1 });
});

test("registered natal conditions count once per candidate and matter while event timing remains per date", () => {
  const child: QualifiedEventScores = { parashari: { score: 3, max: 4, conditions: [
    { id: "d1-support", label: "D1", status: "matched", oncePerCandidate: "parashari:child:D7:d1-support" },
    { id: "pa-h5-16-16", label: "Fifth-lord clue", status: "matched", oncePerCandidate: "parashari:child:rashi:pa-h5-16-16" },
    { id: "dasa", label: "Dasa", status: "matched" },
    { id: "bhukti", label: "Bhukti", status: "unresolved" },
  ] } };
  const second: QualifiedEventScores = { parashari: { ...child.parashari!, score: 2,
    conditions: child.parashari!.conditions.map((c) => c.id === "dasa" ? { ...c, status: "unresolved" as const } : c) } };
  assert.deepEqual(qualifiedTotals([child, second], "parashari"), { score: 3, max: 6 });
  assert.ok(qualifiedComparable([child, second], [second, child], "parashari"));
  const conflict = { parashari: { ...second.parashari!, conditions: second.parashari!.conditions.map((c) =>
    c.id === "d1-support" ? { ...c, status: "unresolved" as const } : c) } };
  assert.throws(() => qualifiedTotals([child, conflict], "parashari"), /Inconsistent natal condition/);
  const otherMatter = { parashari: { ...child.parashari!, conditions: child.parashari!.conditions.map((c) =>
    c.oncePerCandidate ? { ...c, oncePerCandidate: c.oncePerCandidate.replace("child", "marriage") } : c) } };
  assert.deepEqual(qualifiedTotals([child, otherMatter], "parashari"), { score: 6, max: 8 });
  assert.equal(qualifiedComparable([child], [otherMatter], "parashari"), false);
});

test("the registered children and ALP findings change only their own eligible source-scoped counts", () => {
  const child = topicReading(base, events[1], asOf);
  assert.ok(child.parashariDivisional && child.parashariOrdinary);
  const ordinary = child.parashariOrdinary;
  const representative = ordinary.natal.rules[0];
  assert.ok(representative);
  const without = { ...ordinary, natal: { ...ordinary.natal,
    rules: ordinary.natal.rules.filter((r) => r.finding.id !== "pa-h5-16-16") } };
  const withClue = { ...without, natal: { ...without.natal, rules: [...without.natal.rules,
    { ...representative, finding: { ...representative.finding, id: "pa-h5-16-16", text: "Synthetic BPHS condition" } }] } };
  const args = { matter: "child", outcome: "favourable" as const, birthIso: "1990-01-01T00:00:00Z", eventIso: "2018-07-22T12:00:00Z",
    gender: "female", natalPositions: [], sky: [], kp: child.kp, divisional: child.parashariDivisional, ordinary: without };
  const unlisted = qualifiedEventScores(args).parashari!;
  const matched = qualifiedEventScores({ ...args, ordinary: withClue }).parashari!;
  assert.equal(unlisted.score, child.parashariDivisional.score);
  assert.equal(matched.score, child.parashariDivisional.score + 1);
  assert.equal(matched.max, 9);
  assert.equal(qualifiedEventScores({ ...args, ordinary: { ...withClue, natal: { ...withClue.natal, status: "withheld" } } }).parashari, undefined);

  const marriage = topicReading(base, events[0], asOf);
  assert.ok(marriage.alp);
  const ordinaryAlp = { ...marriage.alp, findings: marriage.alp.findings.filter((f) => f.finding.ruleId !== "b2-marriage-navamsa-touches") };
  const someFinding = marriage.alp.findings[0];
  assert.ok(someFinding);
  const alpMatched = { ...ordinaryAlp, findings: [...ordinaryAlp.findings,
    { ...someFinding, finding: { ...someFinding.finding, ruleId: "b2-marriage-navamsa-touches" } }] };
  const marriageArgs = { ...args, matter: "marriage", kp: marriage.kp, alp: ordinaryAlp };
  assert.equal(qualifiedEventScores(marriageArgs).alp?.score, 0);
  assert.equal(qualifiedEventScores({ ...marriageArgs, alp: alpMatched }).alp?.score, 1);
  assert.equal(qualifiedEventScores({ ...marriageArgs, matter: "job", alp: alpMatched }).alp, undefined);
  assert.equal(qualifiedEventScores({ ...marriageArgs, alp: { ...alpMatched, status: "withheld" } }).alp, undefined);
});

test("qualified research checks are visible in each selected school and rectification report", () => {
  const scan = rectify({ chart: base, windowMinutes: 1, events: request, judgedAsOf: asOf });
  const example = topicReading(base, events[0], asOf);
  const html = renderToStaticMarkup(createElement(QualifiedEventScoresPanel, { scores: example.qualifiedScores, school: "alp" }));
  assert.match(html, /ALP marriage pada/);
  assert.doesNotMatch(html, /KP natal then periods/);
  const full = computeChart({ ...base, id: 0, gender: "female", timeStandard: "auto", ayanamsa: "lahiri", nodeType: "mean",
    sunriseDef: "edge", parashariHouseMethod: "equal", notes: "", deathDate: null, timeUncertaintyMin: 0, events });
  for (const method of ["kp-qualified", "parashari-events-v4", "alp-marriage", "bnn-marriage"] as RectifyMethod[]) {
    const state = { method, windowMinutes: 1, events: request, confirmedMarks: [] };
    const doc = buildReport(full, { plain: false, modules: ["rectify"], tools: { rectify: { result: scan, state } } });
    const content = JSON.stringify(doc.sections);
    assert.match(content, /source-scoped research/i, method);
    assert.doesNotMatch(content, /"Mahadasha","Antardasha","Score"/, method);
  }
});
