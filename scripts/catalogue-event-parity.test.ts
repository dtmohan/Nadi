import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { computeAlp, DEFAULT_ALP_CONFIG } from "@shared/alp";
import { createAlpEventScorer } from "@shared/alp-event-evidence";
import { ALP_PLAIN_TOPIC_RULES } from "@shared/school-topics-expanded";
import { natalPlanetContext } from "@shared/planet-context";
import { KP_EVENT_NATAL_RULES, summarizeKpNatalIndication, type KpRegisteredNatalRule } from "@shared/kp-event-natal-rules";
import { KP_RULES } from "@shared/rules-kp";
import { createCatalogueComparison, type CatalogueRuleFrequency } from "@shared/catalogue-comparison";
import type { AlpEventEvidence } from "@shared/alp-event-evidence";
import type { ParashariDatedCatalogue } from "@shared/parashari-event-natal-rules";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema } from "@shared/schema";
import { sensitiveGate } from "@shared/life-stage";
import type { ChanceBaseline } from "@shared/validate-types";
import type { RectifySegmentBaseline } from "@shared/rectify-types";
import { computeChart } from "../server/routes";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { comparisonSeed, seeded, validateEvents } from "../server/validate";
import { comparisonDate, eventInstant } from "../server/event-time";

const base = insertChartSchema.parse({ name: "Synthetic catalogue parity", gender: "male", birthDate: "1990-01-01", birthTime: "12:00:00",
  timezone: "Asia/Kolkata", timeStandard: "zone", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "raman", nodeType: "true", parashariHouseMethod: "sripati", gulikaMethod: "kerala-ghati" });
const asOf = "2026-11-01T12:00:00Z";
const chart = computeChart({ ...base, id: 1, gender: "male", timeStandard: "zone", ayanamsa: "raman", nodeType: "true",
  sunriseDef: "edge", parashariHouseMethod: "sripati", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] });
chart.now.asOf = asOf;
const events: ChartEvent[] = [
  { id: "a", matter: "marriage", date: "2012-03-11", time: "11:15", timezone: "America/New_York" },
  { id: "b", matter: "child", date: "2018-07-22", time: "15:30", timezone: "America/Los_Angeles" },
];
const scanEvents = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });

test("KP registrations resolve to one catalogue rule and exclude a particular-party horary conclusion", () => {
  assert.equal(new Set(KP_RULES.map((rule) => rule.id)).size, KP_RULES.length, "ordinary KP rule IDs must be unique");
  for (const entry of KP_EVENT_NATAL_RULES) assert.equal(KP_RULES.filter((rule) => rule.id === entry.id).length, 1, entry.id);
  assert.equal(new Set(KP_EVENT_NATAL_RULES.map((r) => `${r.matter}:${r.id}`)).size, KP_EVENT_NATAL_RULES.length);
  assert.ok(!KP_EVENT_NATAL_RULES.some((r) => r.id === "kp7-marriage-denied"));
  assert.ok(KP_EVENT_NATAL_RULES.some((r) => r.id === "kp7-marriage" && r.role === "promise"));
});

test("a basic KP cusp link is not presented as a complete promise", () => {
  const v = topicReading(base, events[0], asOf);
  assert.equal(v.kp.promised, true);
  assert.equal(v.kp.natalRules?.indication.status, "unresolved");
  assert.equal(v.kp.natalRules?.rules.find((r) => r.id === "kp7-marriage")?.matched, false);
  assert.ok(v.kp.natalRules?.rules.some((r) => r.role === "modifier" && r.matched));
  const custom = rectify({ chart: base, windowMinutes: 1,
    events: [{ ...scanEvents[0], houses: [1, 7] }], judgedAsOf: asOf });
  assert.ok(custom.segments.every((s) => s.events[0].natalRules?.status === "custom-event"));
});

test("KP promise summary respects the ordinary principal-cusp precedence", () => {
  const rules = [
    { id: "principal", role: "promise", matched: true, finding: { polarity: "good", standing: "decides" } },
    { id: "secondary", role: "promise", matched: true, finding: { polarity: "bad", standing: "note", decidedBy: "principal" } },
  ] as KpRegisteredNatalRule[];
  assert.deepEqual(summarizeKpNatalIndication("assessed", rules), { status: "support", supports: ["principal"], strains: [] });
});

test("ALP cached event findings equal the ordinary evaluator at many instants and on both sides of boundaries", () => {
  const context = natalPlanetContext(chart), asc = chart.jaimini.lagna.lon;
  const score = createAlpEventScorer(context, asc, chart.utc, chart.chart, asOf);
  const ref = computeAlp(context, asc, chart.utc, "2015-01-01T00:00:00Z", DEFAULT_ALP_CONFIG);
  const boundaries = [ref.signPeriods.find((p) => p.current), ref.nakshatraPeriods.find((p) => p.current),
    ref.padaPeriods.find((p) => p.current), ref.arp.padaPeriods.find((p) => p.current), ref.arp.dasa, ref.arp.bhukti]
    .flatMap((p) => p ? [Date.parse(p.start), Date.parse(p.end)] : []);
  const times = [
    ...Array.from({ length: 100 }, (_, i) => DateTime.fromISO("2010-01-01T00:00:00Z").plus({ days: i * 43 }).toMillis()),
    ...boundaries.flatMap((time) => [time - 1000, time - 1, time, time + 1, time + 1000]),
  ];
  for (const ms of times) {
    const iso = DateTime.fromMillis(ms, { zone: "utc" }).toISO()!;
    const actual = score("marriage", iso)!;
    const expected = computeAlp(context, asc, chart.utc, iso, DEFAULT_ALP_CONFIG, sensitiveGate(chart.chart, chart.utc, iso).withheld);
    const expectedFindings = expected.findings.flatMap((finding) => {
      const topicMeaning = ALP_PLAIN_TOPIC_RULES[finding.ruleId]?.marriage;
      return topicMeaning ? [{ finding, topicMeaning }] : [];
    });
    assert.deepEqual(actual.findings, expectedFindings, iso);
    assert.deepEqual(actual.point, { sign: expected.point.sign, nakshatra: expected.point.nakshatra, pada: expected.point.pada,
      lord: expected.point.lord, nakshatraLord: expected.point.nakshatraLord, navamsaSign: expected.point.navamsaSign }, iso);
    assert.deepEqual(actual.akshaya, { sign: expected.arp.point.sign, nakshatra: expected.arp.point.nakshatra,
      pada: expected.arp.point.pada, dasa: expected.arp.dasa.lord, bhukti: expected.arp.bhukti.lord }, iso);
  }
  assert.equal(score("marriage", "1989-01-01T00:00:00Z")?.status, "before-birth");
  assert.equal(score("unknown", "2015-01-01T00:00:00Z")?.status, "unmapped");
});

test("ALP frame reuse across different event topics preserves ordinary findings and both period boundaries", () => {
  const context = natalPlanetContext(chart), asc = chart.jaimini.lagna.lon;
  const scorer = createAlpEventScorer(context, asc, chart.utc, chart.chart, asOf);
  const ref = computeAlp(context, asc, chart.utc, "2015-01-01T00:00:00Z", DEFAULT_ALP_CONFIG);
  const boundaries = [ref.arp.dasa, ref.arp.bhukti, ref.padaPeriods.find((p) => p.current)]
    .flatMap((p) => p ? [Date.parse(p.start), Date.parse(p.end)] : []);
  const times = [...Array.from({ length: 35 }, (_, i) => DateTime.fromISO("1990-01-01T06:30:00Z").plus({ days: i * 1277 }).toMillis()),
    ...boundaries.flatMap((ms) => [ms - 2001, ms - 1, ms, ms + 1, ms + 2001])];
  for (const ms of times) {
    const iso = DateTime.fromMillis(ms, { zone: "utc" }).toISO()!;
    const ordinary = computeAlp(context, asc, chart.utc, iso, DEFAULT_ALP_CONFIG,
      sensitiveGate(chart.chart, chart.utc, asOf).withheld || sensitiveGate(chart.chart, chart.utc, iso).withheld);
    for (const [matter, topic] of [["job", "career"], ["marriage", "marriage"], ["child", "children"], ["education", "education"]] as const) {
      const scored = scorer(matter, iso)!;
      const findings = ordinary.findings.flatMap((finding) => { const topicMeaning = ALP_PLAIN_TOPIC_RULES[finding.ruleId]?.[topic];
        return topicMeaning ? [{ finding, topicMeaning }] : []; });
      assert.deepEqual(scored.findings, findings, `${matter} ${iso}`);
      assert.deepEqual(scored.akshaya, { sign: ordinary.arp.point.sign, nakshatra: ordinary.arp.point.nakshatra,
        pada: ordinary.arp.point.pada, dasa: ordinary.arp.dasa.lord, bhukti: ordinary.arp.bhukti.lord }, `${matter} ${iso}`);
    }
  }
});

test("catalogue comparisons count the actual rule set without inventing scores or counting unavailable trials", () => {
  const alp = (ids: string[]) => ({ status: "assessed", findings: ids.map((ruleId) => ({ finding: { ruleId } })) }) as AlpEventEvidence;
  const para = (ids: string[]) => ({ natal: { status: "assessed" }, periods: [{ level: "dasa", planet: "Moon", ruleIds: ids }] }) as ParashariDatedCatalogue;
  const tracker = createCatalogueComparison([{ label: "Synthetic", date: "2020-01-01", alp: alp(["a", "b"]), parashariOrdinary: para(["one"]) }]);
  tracker.observe(0, { alp: alp(["b", "a", "a"]), parashariOrdinary: para(["one"]) });
  tracker.observe(0, { alp: alp(["a", "c"]), parashariOrdinary: para(["two"]) });
  tracker.observe(0, { alp: { status: "unmapped" } as AlpEventEvidence });
  const [r] = tracker.result();
  assert.deepEqual(r.alp, { status: "assessed", actual: ["a", "b"], availableTrials: 2, identicalSets: 1,
    occurrences: [{ id: "a", count: 2 }, { id: "b", count: 1 }] });
  assert.deepEqual(r.parashariPeriods, { status: "assessed", actual: ["dasa:Moon:one"], availableTrials: 2,
    identicalSets: 1, occurrences: [{ id: "dasa:Moon:one", count: 1 }] });
});

test("actual and first random-date sets reuse the same applicable findings in Validate and every candidate", () => {
  const validation = validateEvents({ ...base, events }, asOf);
  assert.equal(validation.baseline?.trials, 200);
  const random = seeded(comparisonSeed(events.map((e) => e.date)));
  const lo = DateTime.fromISO(events[0].date, { zone: "utc" }).toMillis();
  const hi = DateTime.fromISO(events[1].date, { zone: "utc" }).toMillis();
  const alpScore = createAlpEventScorer(natalPlanetContext(chart), chart.jaimini.lagna.lon, chart.utc, base, asOf);
  const ids = (v: AlpEventEvidence | undefined) => Array.from(new Set(v?.findings.map((f) => f.finding.ruleId) ?? [])).sort();
  const observed = events.map(() => ({ same: 0, counts: new Map<string, number>() }));
  for (let t = 0; t < 200; t++) for (let i = 0; i < events.length; i++) {
    const date = comparisonDate(random, lo, hi, events[i], base.timezone);
    const actual = ids(validation.events[i].alp);
    const sample = ids(alpScore(events[i].matter, eventInstant(date, events[i], base.timezone).toUTC().toISO()!));
    if (JSON.stringify(actual) === JSON.stringify(sample)) observed[i].same++;
    for (const id of actual) if (sample.includes(id)) observed[i].counts.set(id, (observed[i].counts.get(id) ?? 0) + 1);
  }
  for (let i = 0; i < events.length; i++) {
    const frequency: CatalogueRuleFrequency = validation.baseline!.catalogueComparison![i].alp;
    assert.equal(frequency.availableTrials, 200);
    assert.equal(frequency.identicalSets, observed[i].same);
    for (const rule of frequency.occurrences) assert.equal(rule.count, observed[i].counts.get(rule.id) ?? 0);
    const example: NonNullable<ChanceBaseline["example"]>[number] = validation.baseline!.example![i];
    const replay = topicReading(base, { ...events[i], date: example.date }, asOf);
    assert.deepEqual(example.natalRules, replay.kp.natalRules);
    assert.deepEqual(example.parashariOrdinary, replay.parashariOrdinary);
    assert.deepEqual(example.additionalNatal, replay.additionalNatal);
    assert.deepEqual(example.alp, replay.alp);
    assert.deepEqual(validation.events[i].kp.natalRules, replay.kp.natalRules);
    assert.deepEqual(validation.events[i].parashariOrdinary?.natal, replay.parashariOrdinary?.natal);
  }
  const scan = rectify({ chart: base, windowMinutes: 1, events: scanEvents, judgedAsOf: asOf });
  const s = scan.segments.find((item) => item.given && item.selectable)!;
  assert.ok(s?.baseline?.catalogueExample);
  const candidate = { ...base, birthDate: s.midDate ?? base.birthDate, birthTime: s.mid };
  const candidateValidation = validateEvents({ ...candidate, events }, asOf);
  assert.deepEqual(s.baseline!.catalogueComparison, candidateValidation.baseline?.catalogueComparison);
  for (let i = 0; i < events.length; i++) {
    const example: NonNullable<RectifySegmentBaseline["catalogueExample"]>[number] = s.baseline!.catalogueExample![i];
    const replay = topicReading(candidate, { ...events[i], date: example.date }, asOf);
    assert.deepEqual(example.natalRules, replay.kp.natalRules);
    assert.deepEqual(example.parashariOrdinary, replay.parashariOrdinary);
    assert.deepEqual(example.additionalNatal, replay.additionalNatal);
    assert.deepEqual(example.alp, replay.alp);
  }
});
