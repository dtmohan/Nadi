import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { schoolTopicBriefs, type BriefSchool } from "../shared/school-topic-brief";
import { ALL_SCHOOL_TOPICS, defaultAlpForTopics, expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { ALP_RULES } from "../shared/rules-alp";
import { buildReport } from "../shared/report";
import { sensitiveTags } from "../shared/life-stage";
import type { Chart } from "../shared/schema";
import { readFileSync } from "node:fs";
import { computeKp } from "../shared/kp";

// Synthetic, fixed charts. They do not encode a real person's birth or events.
const chart = (birthDate = "1990-01-01"): Chart => ({
  id: 0, name: "Synthetic", gender: "female", birthDate, birthTime: "12:00", timezone: "Asia/Kolkata",
  timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi",
  timeUncertaintyMin: 0, notes: "", deathDate: null, events: [],
} as Chart);
const result = computeChart(chart());
result.now.asOf = "2026-11-01T12:00:00.000Z";
const input = agreementInput(result, true);
const agreement = computeAgreement(input);
const schools: BriefSchool[] = ["parashari", "kp", "jaimini", "alp", "prasna"];
const briefs = (school: BriefSchool) => expandedSchoolTopicBriefs(result, school, input, agreement);

test("all schools expose the available topics, preserve the existing five stances, and leave the inputs unchanged", () => {
  const before = JSON.stringify({ reading: result.reading, jaimini: result.jaimini, kp: input.kp, parashari: input.parashari });
  for (const school of schools) {
    const got = briefs(school);
    assert.deepEqual(got.map((b) => b.topic), ALL_SCHOOL_TOPICS);
    assert.ok(got.every((b) => b.summary && b.limit));
    if (school === "kp" || school === "parashari" || school === "jaimini") {
      for (const old of schoolTopicBriefs(agreement, school)) {
        const next = got.find((b) => b.topic === old.topic)!;
        assert.equal(next.stance, old.stance);
        assert.equal(next.summary, old.summary);
      }
    }
  }
  assert.equal(JSON.stringify({ reading: result.reading, jaimini: result.jaimini, kp: input.kp, parashari: input.parashari }), before);
});

test("KP matches exact topic labels, preserves a secondary note and does not invent a general verdict", () => {
  const original = input.kp.findings[0];
  assert.ok(original);
  const selected = { ...original, ruleId: "test-specific-education", topic: "Education", text: "The source's specific interpretation concerns university studies.", source: "Test source", standing: "note" as const };
  const other = { ...selected, ruleId: "test-career-only", topic: "Career", text: "Education appears in this unrelated career rule." };
  const changed = { ...input, kp: { ...input.kp, findings: [selected, other] } };
  const got = expandedSchoolTopicBriefs(result, "kp", changed, agreement).find((b) => b.topic === "education")!;
  assert.equal(got.stance, "silent");
  assert.equal(got.details?.length, 1);
  assert.equal(got.details?.[0].id, selected.ruleId);
  assert.match(got.details?.[0].text ?? "", /Secondary note, not the deciding result/);
  const travel = expandedSchoolTopicBriefs(result, "kp", changed, agreement).find((b) => b.topic === "travel")!;
  assert.match(travel.summary, /not a negative conclusion/);
  const mislabeled = { ...selected, ruleId: "kp5-debauch-cash", topic: "Standing", text: "A claim about cash." };
  const ci = { ...input, kp: { ...input.kp, findings: [mislabeled] } };
  assert.match(expandedSchoolTopicBriefs(result, "kp", ci, agreement).find((b) => b.topic === "authority")!.summary, /No entered/);
});

test("a documented education case exposes the four-step versus six-step limitation", () => {
  const fx = JSON.parse(readFileSync("scripts/fixtures/school-topics-fresh-cases.json", "utf8")).cases[0];
  const c = { ...fx, id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeStandard: "auto", timeUncertaintyMin: 5, notes: "", deathDate: null, events: [] } as Chart;
  const r = computeChart(c);
  r.now.asOf = "2006-07-04T12:00:00.000Z";
  const i = agreementInput(r, true);
  const four = i.kp.findings.find((f) => f.ruleId === "kp4-edu-no-11");
  assert.ok(four);
  assert.match(four.text, /not all included here/);
  assert.equal(four.polarity, "neutral");
  const six = computeKp(r.kp, r.utc, r.now.asOf, true, i.withheld);
  assert.ok(!six.findings.some((f) => f.ruleId === "kp4-edu-no-11"));
  const learning = expandedSchoolTopicBriefs(r, "kp", i, computeAgreement(i)).find((b) => b.topic === "education")!;
  assert.ok(learning.details?.some((d) => d.id === "kp-six-step-education-check"));
  assert.ok(learning.provisional);
});

test("birth-time uncertainty remains visible even where a KP comparison was otherwise unqualified", () => {
  const uncertain = { ...result, chart: { ...result.chart, timeUncertaintyMin: 10 } };
  assert.ok(expandedSchoolTopicBriefs(uncertain, "kp", input, agreement).every((b) => b.conditional));
});

test("ALP shows only reviewed rules that actually fired at the selected date", () => {
  const alp = defaultAlpForTopics(result, input.withheld);
  const rule = ALP_RULES.find((r) => r.id === "alp-activated-9")!;
  const mock = { ...alp, asOf: "2024-01-15T00:00:00.000+05:30", findings: [{ ...rule, ruleId: rule.id, planets: [], here: [] }] };
  const got = expandedSchoolTopicBriefs(result, "alp", input, agreement, { alp: mock });
  assert.match(got.find((b) => b.topic === "career")!.summary, /stepping back/);
  assert.match(got.find((b) => b.topic === "travel")!.summary, /travel/);
  assert.equal(got.find((b) => b.topic === "travel")!.details?.[0].id, rule.id);
  assert.match(got.find((b) => b.topic === "career")!.frame!, /15 Jan 2024/);
  assert.match(got.find((b) => b.topic === "education")!.summary, /No reviewed/);
  const noFindings = { ...mock, findings: [] };
  assert.match(expandedSchoolTopicBriefs(result, "alp", input, agreement, { alp: noFindings }).find((b) => b.topic === "career")!.summary, /No reviewed/);
});

test("ALP's historical age and local date are honoured, including after a passing date", () => {
  const alp = defaultAlpForTopics(result, input.withheld);
  assert.match(alp.asOf, /^2026-11-01T00:00:00\.000\+05:30$/);
  const historical = { ...alp, asOf: "1995-01-01T00:00:00.000+05:30" };
  const topics = expandedSchoolTopicBriefs(result, "alp", input, agreement, { alp: historical }).map((b) => b.topic);
  for (const held of ["career", "marriage", "children", "wealth"]) assert.ok(!topics.includes(held as never));
  const deceased = { ...result, chart: { ...result.chart, deathDate: "2020-02-04" } };
  assert.match(defaultAlpForTopics(deceased, false).asOf, /^2020-02-04T00:00:00\.000\+05:30$/);
  assert.match(defaultAlpForTopics(deceased, false, "2025-01-01").asOf, /^2020-02-04T00:00:00/);
  assert.match(defaultAlpForTopics(result, false, "1980-01-01").asOf, /^1990-01-01T00:00:00/);
  const west = { ...result, chart: { ...result.chart, timezone: "America/Los_Angeles" }, now: { ...result.now, asOf: "2026-11-02T01:00:00Z" } };
  assert.match(defaultAlpForTopics(west, false).asOf, /^2026-11-01T00:00:00/);
});

test("Prasna separates the natal house walk from an explicitly selected question chart", () => {
  const natal = briefs("prasna").find((b) => b.topic === "career")!;
  assert.match(natal.frame!, /Birth-chart/);
  const emptyQuestion = expandedSchoolTopicBriefs(result, "prasna", input, agreement, { prasna: { frame: "question", readings: [], arudha: "Aries", asOf: "2026-11-01T12:00:00Z" } }).find((b) => b.topic === "career")!;
  assert.match(emptyQuestion.frame!, /Question-chart.*Arudha Aries/);
  assert.match(emptyQuestion.summary, /no planets.*lord can still matter/);
  assert.doesNotMatch(emptyQuestion.basis, /strong|weak/); // no natal strength used for the question chart
  assert.equal(expandedSchoolTopicBriefs(result, "prasna", input, agreement).find((b) => b.topic === "travel")?.detailHouse, undefined);
});

test("minor views retain the age and sensitive-content gates across every school", () => {
  const child = computeChart(chart("2018-01-01"));
  child.now.asOf = "2026-11-01T12:00:00.000Z";
  const ci = agreementInput(child, true);
  const ca = computeAgreement(ci);
  for (const school of schools) {
    const got = expandedSchoolTopicBriefs(child, school, ci, ca);
    for (const b of got) {
      assert.ok(!["career", "marriage", "children", "wealth"].includes(b.topic));
      for (const d of b.details ?? []) assert.equal(sensitiveTags(d.text).length, 0);
    }
  }
});

test("plain reports use the same summaries and source details as the screen", () => {
  const report = buildReport(result, { plain: true, modules: schools });
  for (const school of schools) {
    const section = report.sections.find((s) => s.id === `${school}-plain-topics`);
    assert.ok(section, school);
    const body = section.paras.map((p) => p.text ?? "").join("\n");
    for (const b of briefs(school)) {
      assert.ok(body.includes(b.summary), `${school}: ${b.topic}`);
      for (const detail of b.details ?? []) assert.ok(body.includes(detail.text));
    }
  }
  assert.ok(report.modules.includes("prasna"));
  assert.match(report.sections.find((s) => s.id === "prasna")!.paras[0].text!, /not a question-time chart/);
});

test("a selected ALP date is retained in both report summaries and source reading", () => {
  const day = "2025-07-15";
  const selected = defaultAlpForTopics(result, input.withheld, day);
  const expected = expandedSchoolTopicBriefs(result, "alp", input, agreement, { alp: selected });
  const report = buildReport(result, { plain: true, modules: ["alp"], tools: { alpAsOf: day } });
  const topics = report.sections.find((s) => s.id === "alp-plain-topics")!;
  const text = topics.paras.map((p) => p.text ?? "").join("\n");
  for (const b of expected) assert.ok(text.includes(b.summary));
  assert.match(report.sections.find((s) => s.id === "alp")!.paras[0].text!, /15 Jul 2025/);
});
