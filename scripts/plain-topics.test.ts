import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement, readTopic } from "../shared/agreement";
import { briefingFor, type Briefing, type BriefRow } from "../shared/briefing";
import { areaSeason, lifeAsOf } from "../shared/life-stage";
import { synthesize, synthesizeArea } from "../shared/synthesis";
import { plainTopicBriefs, plainTopicNatal } from "../shared/topic-brief";
import { buildReport } from "../shared/report";
import type { Chart } from "../shared/schema";
import type { Finding } from "../shared/rules";
import { transitDay } from "../shared/transit-date";

// Synthetic inputs; no private chart belongs in the test suite.
const chart = (birthDate = "1990-01-01"): Chart => ({
  id: 0, name: "Synthetic plain topics", gender: "male", birthDate, birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97,
  longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge",
  parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [],
} as Chart);
const result = computeChart(chart());
const areas = synthesize(result.reading, result.reading.roles.gender);
const input = agreementInput(result, true);
const briefing = briefingFor(result, input);
const topics = () => plainTopicBriefs({
  reading: result.reading, areas, agreement: computeAgreement(input), brief: briefing,
  zone: "Asia/Kolkata", inSeason: () => true,
});

test("marriage descriptions distinguish each type of indication from a guaranteed outcome", () => {
  const area = areas.find((a) => a.area === "marriage");
  for (const promised of ["strong", "moderate", "weak", "by-karma", "through-dispositor", "absent"] as const) {
    const reading = structuredClone(result.reading);
    reading.marriage.promised = promised;
    const text = plainTopicNatal("marriage", area, reading);
    assert.match(text.limit, /not a guarantee of marriage/);
    assert.doesNotMatch(text.summary, /marriage (is promised|will happen|comes by karma)/i);
    if (promised === "absent") assert.match(text.summary, /does not rule out/);
    if (promised === "by-karma") assert.match(text.summary, /Saturn.*possible delay/);
    if (promised === "through-dispositor") assert.match(text.summary, /indirect/);
  }
});

test("marriage themes preserve selected source interpretations as possibilities", () => {
  const area = areas.find((a) => a.area === "marriage")!;
  const reading = plainTopicNatal("marriage", area, result.reading);
  assert.match(reading.detailIntro ?? "", /possible relationship themes/);
  assert.equal(reading.details?.length, Math.min(area.key.length, 3));
  assert.match(reading.limit, /not a guarantee/);

  const sensitive = { ...area, key: [
    { ...area.key[0], text: "Venus with Rahu: an attachment outside the marriage; sharp words and risk of separation." },
  ] };
  const theme = plainTopicNatal("marriage", sensitive, result.reading).details?.[0] ?? "";
  assert.match(theme, /commitment or boundaries/);
  assert.match(theme, /communication or conflict/);
  assert.match(theme, /distance or time apart/);
  assert.doesNotMatch(theme, /attachment outside the marriage/);
  assert.match(sensitive.key[0].text, /attachment outside the marriage/);
});

test("plain cross-school marriage comparisons preserve stances without implying a guarantee", () => {
  const plain = readTopic("marriage", { ...input, plain: true });
  const technical = readTopic("marriage", { ...input, plain: false });
  assert.deepEqual(plain.stances.map((s) => s.stance), technical.stances.map((s) => s.stance));
  assert.equal(plain.verdict, technical.verdict);
  assert.doesNotMatch(plain.sentence, /\bpromised\b/i);
  assert.ok(plain.stances.every((s) => !/\bpromised\b/i.test(s.word)));
  assert.match(technical.sentence, /\bpromised\b/i);
});

test("a career difficulty is attributed to its source finding, not to an occupation", () => {
  const mk = (ruleId: string, score: number, text: string): Finding => ({
    ruleId, area: "career", score, planets: ["Saturn", "Ketu"], relation: "conjunct", viaRetro: false, text,
  });
  const career = synthesizeArea("career", [
    mk("work", 3, "Work: technical or research work; breaks and restarts in the career line."),
    { ...mk("other", 2, "Work: a career in teaching."), planets: ["Jupiter", "Mercury"] },
  ], result.reading, "male");
  const plain = plainTopicNatal("career", career, result.reading);
  assert.ok(plain.details?.some((d) => /technical or research/i.test(d)));
  assert.match(plain.contrast ?? "", /breaks and restarts/);
  assert.match(plain.limit, /not a prediction/);
  assert.doesNotMatch(plain.details?.join(" ") ?? "", /yet engineering/);
});

test("career themes do not turn a rule's work or identity wording into a certainty", () => {
  const mk = (ruleId: string, text: string, planets: Finding["planets"]): Finding => ({
    ruleId, area: "career", score: 2, planets, relation: "conjunct", viaRetro: false, text,
  });
  const area = synthesizeArea("career", [
    mk("one", "Work: engineering or construction is the life's work.", ["Jupiter", "Saturn", "Mars"]),
    mk("two", "Work: the native and the profession are bound together; identity comes from work.", ["Saturn", "Mercury"]),
  ], result.reading, "male");
  const text = plainTopicNatal("career", area, result.reading).details?.join(" ") ?? "";
  assert.match(text, /may be a work theme/);
  assert.match(text, /personal identity may be closely linked/);
  assert.doesNotMatch(text, /is the life's work|the native and the profession are bound together/i);
});

test("topic windows come only from a matching Nadi passage and show its own touched planets", () => {
  const row: BriefRow = {
    id: "nadi-jupiter-now", group: "now", start: "2026-01-01T00:00:00Z", end: "2026-08-01T00:00:00Z",
    when: "Jan 2026 – Aug 2026", system: "Nadi", what: "Jupiter through Cancer",
    nadiPlanets: { career: ["Saturn", "Mercury"] },
    tags: [{ area: "career", clause: 1, proposed: false, why: "the Nadi reading of this passage" }],
    link: { tab: "bnn", chapter: "timing" },
  };
  const extra = { ...row, id: "other-system", system: "Parashari" as const };
  const madeUpTag = { ...row, id: "nadi-saturn-next", group: "next" as const,
    tags: [{ area: "marriage" as const, clause: 2 as const, proposed: true, why: "a proposed tag" }],
    nadiPlanets: { marriage: ["Venus" as const] } };
  const stub: Briefing = { ...briefing, now: [row, extra], next: [madeUpTag] };
  const out = plainTopicBriefs({ reading: result.reading, areas, agreement: [], brief: stub, zone: "UTC", inSeason: () => true });
  const career = out.find((t) => t.topic === "career")!;
  assert.equal(career.windows.length, 1);
  assert.match(career.windows[0].reason, /Saturn and Mercury/);
  assert.equal(career.windows[0].start, row.start);
  assert.equal(career.windows[0].end, row.end);
  assert.equal(out.find((t) => t.topic === "marriage")!.windows.length, 0);
});

test("a transit day uses the chart zone, not the browser or server's zone", () => {
  const instant = "2026-10-30T20:00:00.000Z";
  assert.equal(transitDay(instant, "Asia/Kolkata"), "31 Oct 2026");
  assert.equal(transitDay(instant, "America/Los_Angeles"), "30 Oct 2026");
});

test("age gates apply before the new topic cards are built", () => {
  const minor = computeChart(chart("2018-01-01"));
  const lifeAt = lifeAsOf(minor.chart, minor.now.asOf);
  const minorInput = agreementInput(minor, true);
  const out = plainTopicBriefs({
    reading: minor.reading, areas: synthesize(minor.reading, minor.reading.roles.gender),
    agreement: computeAgreement(minorInput), brief: briefingFor(minor, minorInput),
    zone: "Asia/Kolkata", inSeason: (t) => areaSeason(t, minor.utc, lifeAt).inSeason,
  });
  assert.deepEqual(out, []);
});

test("plain report uses the same wording, while the practitioner report retains the original findings", () => {
  const flatten = (doc: ReturnType<typeof buildReport>) => doc.sections.flatMap((s) => [s, ...(s.sub ?? [])]);
  const plain = flatten(buildReport(result, { plain: true, modules: ["bnn"] }));
  const practitioner = flatten(buildReport(result, { plain: false, modules: ["bnn"] }));
  for (const topic of topics()) {
    const area = areas.find((a) => a.area === topic.topic);
    if (!area) continue;
    const plainSection = plain.find((s) => s.id === `bnn-${topic.topic}`)!;
    const technicalSection = practitioner.find((s) => s.id === `bnn-${topic.topic}`)!;
    assert.ok(plainSection.paras.some((p) => p.text === topic.summary), topic.topic);
    assert.ok(plainSection.paras.some((p) => p.text === topic.limit), topic.topic);
    for (const d of topic.details ?? []) assert.ok(plainSection.paras.some((p) => p.text === d), d);
    assert.ok(technicalSection.paras.some((p) => p.text === area.headline), topic.topic);
    assert.ok(technicalSection.paras.some((p) => area.key.some((f) => p.text?.includes(f.text.replace(/\.$/, "")))), topic.topic);
  }
});

test("opposed or delayed findings do not get rewritten into a promised outcome", () => {
  const mk = (id: string, text: string, score: number): Finding => ({
    ruleId: id, area: "marriage", text, score, planets: ["Jupiter", id === "delay" ? "Saturn" : "Venus"],
    relation: "conjunct", viaRetro: false,
  });
  const a = synthesizeArea("marriage", [mk("promise", "Marriage is promised.", 2), mk("delay", "Marriage is delayed.", 2)], result.reading, "male");
  assert.match(a.reconciliation ?? "", /do not settle the outcome or its timing/);
  assert.doesNotMatch(a.reconciliation ?? "", /later rather than never|comes later than average/);
});
