import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import type { Chart } from "../shared/schema";
import type { Gender } from "../shared/marriage";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { briefingFor } from "../shared/briefing";
import { areaSeason, lifeAsOf } from "../shared/life-stage";
import { synthesize } from "../shared/synthesis";
import { plainTopicBriefs } from "../shared/topic-brief";
import { expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { readerExperience } from "../shared/reader-experience";
import { readerPassage } from "../shared/reader-prose";
import { ReaderContent } from "../client/src/pages/reader";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const base: Chart = { id: 0, name: "Synthetic", gender: "male", birthDate: "1990-02-01", birthTime: "13:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi",
  notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };

// Public birth data from the independently selected Jupiter study. These test presentation
// parity, not whether an astrological interpretation describes these people's lives.
const publicCases: Chart[] = [
  { ...base, name: "David Cushman", birthDate: "1939-11-15", birthTime: "07:23",
    timezone: "America/Indiana/Indianapolis", timeStandard: "-06:00", place: "Indianapolis", latitude: 39.7666667, longitude: -86.15 },
  { ...base, name: "Sergio Castellitto", birthDate: "1953-08-18", birthTime: "18:20",
    timezone: "Europe/Rome", timeStandard: "+01:00", place: "Rome", latitude: 41.9, longitude: 12.4833333 },
  { ...base, name: "Santiago Carrillo", birthDate: "1915-01-18", birthTime: "02:30",
    timezone: "Europe/Madrid", timeStandard: "+00:00", place: "Gijón", latitude: 43.5333333, longitude: -5.6666667 },
];

test("reader preserves the ordinary plain topic and school adapters on public charts", () => {
  for (const chart of publicCases) {
    const result = computeChart(chart);
    const before = JSON.stringify(result.reading);
    const experience = readerExperience(result);
    const input = agreementInput(result, true);
    const agreement = computeAgreement(input);
    const brief = briefingFor(result, input);
    const lifeAt = lifeAsOf(chart, result.now.asOf);
    const topics = plainTopicBriefs({ reading: result.reading, areas: synthesize(result.reading, chart.gender as Gender),
      agreement, brief, zone: chart.timezone, inSeason: (topic) => areaSeason(topic, result.utc, lifeAt).inSeason });
    assert.deepEqual(experience.topics.map((v) => v.natal), topics);
    const schools = (["parashari", "kp", "jaimini", "alp", "prasna"] as const)
      .flatMap((school) => expandedSchoolTopicBriefs(result, school, input, agreement));
    for (const item of experience.topics) {
      const expected = schools.filter((b) => b.topic === item.natal.topic ||
        (item.natal.topic === "family" && (b.topic === "father" || b.topic === "mother")));
      assert.deepEqual(item.schools, expected);
      assert.equal(item.prose.length, item.natal.details?.length ?? 0);
      for (const evidence of item.natal.detailEvidence ?? []) if (evidence)
        assert.ok(result.reading.findings.some((f) => f.ruleId === evidence.ruleId && f.area === item.natal.topic));
    }
    assert.equal(JSON.stringify(result.reading), before);
    assert.ok(experience.present.every((r) => brief.now.some((v) => v.id === r.id && v.plainSummary?.text === r.plainSummary?.text)));
  }
});

test("editorial passages require both the exact topic and the original evaluated clause", () => {
  const chart = computeChart(base);
  const finding = chart.reading.findings.find((f) => f.ruleId === "t-sa-me-ra" && f.area === "career");
  assert.ok(finding);
  assert.match(readerPassage("career", finding.ruleId, [finding])!.en, /clients abroad/);
  assert.equal(readerPassage("marriage", finding.ruleId, [finding]), undefined);
  assert.equal(readerPassage("career", finding.ruleId, [{ ...finding, text: "A changed rule." }]), undefined);
  assert.equal(readerPassage("career", "unknown", [finding]), undefined);
});

test("the reader retains the existing life-stage gate for a child", () => {
  const child = computeChart({ ...base, name: "Synthetic child", birthDate: "2018-05-15" });
  assert.equal(child.sensitive?.withheld, true);
  const experience = readerExperience(child);
  const ids = experience.topics.map((v) => v.natal.topic);
  for (const held of ["career", "marriage", "children", "wealth"]) assert.ok(!ids.includes(held as never));
  assert.ok(ids.includes("education"));
  for (const item of experience.topics) {
    assert.ok(!item.schools.some((s) => ["career", "marriage", "children", "wealth"].includes(s.topic)));
    assert.ok(item.natal.windows.every((w) => !/marriage|children|career|wealth/i.test(w.statement)));
  }
});

test("the separate reader renders source links and qualified selected prose", () => {
  const result = computeChart(base);
  const experience = readerExperience(result);
  const html = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/chart/42/reading",
    children: React.createElement(ReaderContent, { result, experience, chartId: "42" }) }));
  assert.match(html, /reader-experience/);
  assert.match(html, /reader-select-career/);
  assert.match(html, /engineering, software, mathematics and mechanical trades/);
  assert.match(html, /reader-evidence-caution/);
  assert.match(html, /reader-school-parashari-career/);
  assert.match(html, /reader-school-kp-career/);
  assert.match(html, /reader-school-jaimini-career/);
  assert.match(html, /reader-school-alp-career/);
  assert.match(html, /reader-school-prasna-career/);
  assert.match(html, /\/chart\/42\/bnn/);
});
