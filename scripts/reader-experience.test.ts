import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Router } from "wouter";
import { Settings } from "luxon";
import type { Chart } from "../shared/schema";
import type { Gender } from "../shared/marriage";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { briefingFor } from "../shared/briefing";
import { areaSeason, lifeAsOf, mentionsHeldArea } from "../shared/life-stage";
import { synthesize } from "../shared/synthesis";
import { plainTopicBriefs } from "../shared/topic-brief";
import { expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { readerExperience } from "../shared/reader-experience";
import { readerPassage } from "../shared/reader-prose";
import { ReaderContent } from "../client/src/pages/reader";
import { translate } from "../shared/localization";
import { schoolSourceMalayalam } from "../shared/school-topic-malayalam";

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

test("fresh public charts retain their school-specific chart facts in both languages", () => {
  const manifest = JSON.parse(readFileSync("research/reader-expansion/cases.json", "utf8")) as { asOf: string; cases: Array<Partial<Chart>> };
  const previousNow = Settings.now;
  Settings.now = () => Date.parse(manifest.asOf);
  try {
    const kinds = new Set<string>();
    for (const c of manifest.cases) {
      const result = computeChart({ ...base, ...c } as Chart);
      const input = agreementInput(result, true);
      const experience = readerExperience(result);
      for (const item of experience.topics) {
        assert.equal(item.schoolContexts.length, item.schools.length);
        assert.equal(item.visibleSchools.length, item.schools.length);
        for (let i = 0; i < item.schools.length; i++) {
          const b = item.schools[i];
          for (const p of item.schoolContexts[i]) {
            kinds.add(p.kind);
            assert.match(p.ml, /[\u0d00-\u0d7f]/);
            if (p.kind === "parashari-house") {
              const h = input.parashari.bhavas.find((h) => h.house === b.detailHouse);
              assert.ok(h);
              assert.ok(p.en.includes(h.sign) && p.en.includes(h.lord));
              assert.ok(p.en.includes(translate("en", h.sign)) && p.ml.includes(translate("ml", h.sign)));
            } else if (p.kind === "kp-cusp") {
              const cusp = input.kp.cusps.find((h) => h.house === b.detailHouse);
              assert.ok(cusp);
              assert.ok(p.en.includes(cusp.sign) && p.en.includes(cusp.subLord));
              assert.ok(p.ml.includes(translate("ml", cusp.subLord)));
            } else if (p.kind === "jaimini-karaka") {
              const area = input.jaimini.find((a) => a.area === b.detailArea);
              assert.ok(area?.karakas.some((k) => p.en.includes(`${k.planet} is ${k.karaka}`)));
            } else if (p.kind === "alp-point") {
              assert.equal(b.school, "alp");
              assert.match(p.en, /moving point/);
            } else if (p.kind === "prasna-house") {
              assert.equal(b.frame, "Birth-chart house reading");
              assert.match(p.en, /birth-chart application/i);
            }
          }
          assert.ok(item.visibleSchools[i].ml?.summary, `missing summary for ${c.name}, ${b.school}, ${b.topic}`);
        }
      }
      for (const row of experience.present) {
        assert.ok(row.plainSummary?.ml?.text);
        const planet = /(?:assigns |passage|passing through )/.test(row.plainSummary!.text) &&
          row.plainSummary!.title.match(/^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)/)?.[1];
        if (planet) assert.ok(row.plainSummary!.ml!.title.includes(translate("ml", planet)));
      }
    }
    assert.deepEqual(Array.from(kinds).sort(), ["alp-point", "jaimini-karaka", "kp-cusp", "parashari-house", "prasna-house"]);
  } finally { Settings.now = previousNow; }
});

test("all reader-visible school paragraphs and expanded prose respect age-held areas", () => {
  const previousNow = Settings.now;
  Settings.now = () => Date.parse("2026-11-07T12:00:00Z");
  try {
    for (const birthDate of ["2018-05-15", "2009-05-15"]) {
      const result = computeChart({ ...base, birthDate });
      const input = agreementInput(result, true);
      const held = (area: "career" | "wealth" | "marriage" | "children") => !input.inSeason(area);
      for (const topic of readerExperience(result).topics) {
        for (const passage of topic.prose) if (passage) assert.equal(mentionsHeldArea(passage.en, held), false);
        for (const contexts of topic.schoolContexts) for (const p of contexts)
          assert.equal(mentionsHeldArea(p.en, held), false);
        for (const b of topic.visibleSchools) {
          for (const text of [b.summary, b.basis, b.limit, b.reason, ...(b.explanation ?? []),
            ...(b.explanationHouses ?? []).map((h) => h.meaning), ...(b.details ?? []).map((d) => d.text)]) {
            if (text) assert.equal(mentionsHeldArea(text, held), false, `${birthDate} ${topic.natal.topic} ${b.school}: ${text}`);
          }
        }
      }
    }
  } finally { Settings.now = previousNow; }
});

test("exact Malayalam themes fall back honestly when wording is unknown", () => {
  for (const theme of ["An unconventional life.", "Austerity, service and detachment as a path.",
    "Breaks in education, or a turn toward research, computing and esoteric subjects.", "Frequent relocation.",
    "The father is educated and prosperous, in finance, arts or administration."])
    assert.match(translate("ml", theme), /[\u0d00-\u0d7f]/);
  const unknown = "A newly authored theme without a reviewed translation.";
  assert.equal(translate("ml", unknown), unknown);
  const technical = "The 4th sub lord signifies 8 and 12: interruptions and breaks in education.";
  assert.match(schoolSourceMalayalam(technical)!, /4-ാം.*8.*12.*വിദ്യാഭ്യാസ/);
  assert.equal(schoolSourceMalayalam(technical + " Additional unreviewed condition."), undefined);
});
