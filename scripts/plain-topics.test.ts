import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement, readTopic } from "../shared/agreement";
import { briefingFor, type Briefing, type BriefRow } from "../shared/briefing";
import { areaSeason, lifeAsOf } from "../shared/life-stage";
import { synthesize, synthesizeArea } from "../shared/synthesis";
import { PLAIN_TOPIC_ORDER, plainTopicBriefs, plainTopicNatal } from "../shared/topic-brief";
import { buildReport } from "../shared/report";
import type { Chart } from "../shared/schema";
import type { Finding } from "../shared/rules";
import { transitDay } from "../shared/transit-date";
import { schoolTopicBasisPlain, schoolTopicBriefs, SCHOOL_TOPICS, type BriefSchool } from "../shared/school-topic-brief";
import { KP_RULES, kpFindingPlain } from "../shared/rules-kp";

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

  sensitive.key[0].text = "Mars and Sun: the wife holds authority and the husband must listen, else hostility; an unsettled married life.";
  const behaviour = plainTopicNatal("marriage", sensitive, result.reading).details?.[0] ?? "";
  assert.match(behaviour, /communication or conflict/);
  assert.doesNotMatch(behaviour, /husband must listen|wife holds authority/);
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

test("family summaries keep different people separate without a combined verdict", () => {
  const mk = (ruleId: string, text: string, planets: Finding["planets"]): Finding => ({
    ruleId, area: "family", score: 2, planets, relation: "conjunct", viaRetro: false, text,
  });
  const findings = [mk("father", "Sun with Saturn: father faces hardship; the family bears the burden.", ["Sun", "Saturn"]),
    mk("mother", "Moon with Jupiter: nurturing, wise mother.", ["Moon", "Jupiter"]),
    mk("sibling", "Mars with Jupiter: supportive siblings.", ["Mars", "Jupiter"])];
  const family = synthesize(result.reading, "male", findings).find((a) => a.area === "family")!;
  assert.equal(family.tone, "descriptive");
  assert.equal(family.contest, undefined);
  assert.deepEqual([...family.key, ...family.rest].map((f) => f.ruleId).sort(), ["father", "mother", "sibling"]);
  const plain = plainTopicNatal("family", family, result.reading);
  assert.match(plain.details?.join(" ") ?? "", /Father:.*Mother:.*Siblings:/);
  assert.ok(!plain.details?.some((detail) => detail.startsWith("Family:")), "a father's finding is not repeated as a separate family finding");
  assert.match(plain.limit, /not a combined verdict/);
  // Parent-specific synthesis is still available to the agreement view.
  assert.notEqual(synthesizeArea("family", [findings[0]], result.reading, "male").tone, "descriptive");
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
    zone: "Asia/Kolkata", inSeason: (t) => areaSeason(t, minor.utc, lifeAt, minor.chart).inSeason,
  });
  assert.deepEqual(out.map((t) => t.topic), PLAIN_TOPIC_ORDER.filter((t) => !["career", "authority", "marriage", "children", "wealth"].includes(t)));
  const minorAgreement = computeAgreement(minorInput);
  for (const school of ["parashari", "kp", "jaimini"] as BriefSchool[])
    assert.ok(schoolTopicBriefs(minorAgreement, school).every((b) => b.topic !== "career" && b.topic !== "marriage" && b.topic !== "children"));
});

test("a younger reader's eligible topic does not surface a held career theme", () => {
  const mk = (id: string, text: string): Finding => ({
    ruleId: id, area: "self", score: 2, planets: ["Jupiter"], relation: "conjunct", viaRetro: false, text,
  });
  const self = synthesizeArea("self", [
    mk("held-work", "Life is organised around work, duty and responsibility."),
    mk("retained", "An interest in art and learning."),
  ], result.reading, "male");
  const out = plainTopicBriefs({
    reading: result.reading, areas: [self], agreement: [], brief: briefing, zone: "UTC",
    inSeason: (topic) => !["career", "wealth", "marriage", "children"].includes(topic),
  });
  const personal = out.find((item) => item.topic === "self")!;
  assert.ok(personal.details?.some((text) => /art and learning/i.test(text)));
  assert.ok(!personal.details?.some((text) => /work/i.test(text)));
  assert.equal(personal.details?.length, personal.detailEvidence?.length);
  assert.equal(personal.detailEvidence?.[0]?.ruleId, "retained");
});

test("an eligible career card does not surface a held marriage in its secondary clause", () => {
  const finding: Finding = {
    ruleId: "synthetic-career-marriage", area: "career", score: 2,
    planets: ["Saturn", "Mercury"], relation: "conjunct", viaRetro: false,
    text: "Work: technical or research work; delays in marriage.",
  };
  const career = synthesizeArea("career", [finding], result.reading, "male");
  const build = (inSeason: (topic: typeof PLAIN_TOPIC_ORDER[number]) => boolean) =>
    plainTopicBriefs({ reading: result.reading, areas: [career], agreement: [], brief: briefing, zone: "UTC", inSeason })
      .find((item) => item.topic === "career")!;
  const younger = build((topic) => topic !== "marriage" && topic !== "children");
  assert.ok(younger.details?.some((text) => /technical or research/i.test(text)));
  assert.equal(younger.detailEvidence?.[0]?.ruleId, finding.ruleId);
  assert.doesNotMatch([younger.summary, younger.detailIntro, younger.contrast, ...(younger.details ?? [])].join(" "), /marriage/i);
  assert.match(build(() => true).contrast ?? "", /delays in marriage/i);
});

test("all BNN topics have a plain explanation without changing their source findings", () => {
  const out = topics();
  assert.deepEqual(out.map((t) => t.topic), PLAIN_TOPIC_ORDER);
  for (const topic of out) {
    assert.ok(topic.summary.length > 0, topic.topic);
    assert.ok(topic.limit.length > 0, topic.topic);
    assert.equal(topic.hasArea, areas.some((a) => a.area === topic.topic));
  }
  const health = out.find((t) => t.topic === "health")!;
  assert.match(health.limit, /cannot diagnose/);
  assert.deepEqual(health.windows, []);
  const children = out.find((t) => t.topic === "children")!;
  assert.match(children.limit, /cannot determine fertility/);
  assert.doesNotMatch(children.summary, /will have|will not have|guarantee/i);
});

test("plain family themes do not make a medical claim about a parent", () => {
  const area = areas.find((a) => a.area === "family")!;
  const family = { ...area, key: [{ ...area.key[0], text: "Moon with Rahu: mother's health or circumstances are unusual." }] };
  const plain = plainTopicNatal("family", family, result.reading);
  const mother = plain.details?.find((detail) => detail.startsWith("Mother:")) ?? "";
  assert.match(mother, /cannot assess a parent's health/);
  assert.doesNotMatch(mother, /health .*unusual/i);
  assert.match(family.key[0].text, /health or circumstances are unusual/);
});

test("other-school summaries keep each existing voice, including silent and conditional ones", () => {
  const agreement = computeAgreement(input);
  for (const school of ["parashari", "kp", "jaimini"] as BriefSchool[]) {
    const briefs = schoolTopicBriefs(agreement, school);
    assert.deepEqual(briefs.map((b) => b.topic), SCHOOL_TOPICS);
    for (const b of briefs) {
      const voice = agreement.find((a) => a.topic === b.topic)!.stances.find((s) => s.system === school)!;
      assert.equal(b.stance, voice.stance);
      assert.equal(b.basis, voice.note);
      assert.equal(b.conditional, /conditional/i.test(voice.word));
      if (b.stance === "silent") assert.match(b.summary, /do not give a general conclusion/);
      if (b.topic === "children") assert.match(b.limit, /not an assessment of fertility/);
      if ((b.topic === "father" || b.topic === "mother") && /\bhealth\b|\billness\b|\bdisease\b|\bdies?\b|\bdeath\b|\blongevity\b/i.test(b.basis))
        assert.match(schoolTopicBasisPlain(b), /cannot assess a parent's health/);
    }
    const doc = buildReport(result, { plain: true, modules: [school] });
    const section = doc.sections.find((s) => s.id === `${school}-plain-topics`)!;
    assert.ok(section, school);
    for (const b of briefs) assert.ok(section.paras.some((p) => p.text?.includes(b.summary)), `${school} ${b.topic}`);
    assert.ok(!buildReport(result, { plain: false, modules: [school] }).sections.some((s) => s.id === `${school}-plain-topics`));
  }
});

test("KP's plain reading does not predict a child's sex or family size from traditional rules", () => {
  for (const id of ["kp5-child-male", "kp5-child-female", "kp5-twins", "kp5-children-limited"]) {
    const rule = KP_RULES.find((r) => r.id === id)!;
    const original = rule.text;
    const plain = kpFindingPlain({ ruleId: id, text: original });
    assert.match(plain, /cannot determine/i, id);
    assert.doesNotMatch(plain, /likely a boy|likely a girl|a twin birth, girls|restricts the number/i, id);
    assert.equal(rule.text, original);
  }
  const report = JSON.stringify(buildReport(result, { plain: true, modules: ["kp"] }));
  assert.doesNotMatch(report, /first child is likely a (?:boy|girl)|a twin birth, girls/i);
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
