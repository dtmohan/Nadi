import assert from "node:assert/strict";
import test from "node:test";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import { areaSeason } from "../shared/life-stage";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { defaultAlpForTopics, expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import type { Chart } from "../shared/schema";

const priorNow = Settings.now;
Settings.now = () => Date.parse("2026-11-08T12:00:00Z");
test.after(() => { Settings.now = priorNow; });
const chart = {
  id: 0, name: "Synthetic", gender: "female", birthDate: "2018-02-01", birthTime: "13:00", deathDate: null,
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97,
  longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge",
  parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [],
} as Chart;

function sections(all: ReportSection[]): ReportSection[] {
  return all.flatMap((section) => [section, ...sections(section.sub ?? [])]);
}
function reportText(all: ReportSection[]) {
  return sections(all).filter((section) => section.id !== "reading").flatMap((section) =>
    section.paras.flatMap((p) => [p.text, p.aside, ...(p.head ?? []), ...(p.rows ?? []).flat()].filter(Boolean)),
  ).join("\n");
}

test("held topics cannot leak across schools or into report tables and translations", () => {
  const result = computeChart(chart);
  for (const plain of [true, false]) {
    const english = buildReport(result, { plain });
    const ml = buildReport(result, { plain, locale: "ml" });
    const text = reportText(english.sections);
    assert.doesNotMatch(text, /a marriage in this stretch comes as a sudden event/i);
    assert.doesNotMatch(text, /work is found or kept only with strain/i);
    assert.doesNotMatch(text, /happiness through siblings, wealth and children/i);
    assert.doesNotMatch(text, /name and reputation come through work/i);
    // Localization happens after filtering, so the removed source cannot reappear as a translation.
    const mlText = reportText(ml.sections);
    assert.doesNotMatch(mlText, /a marriage in this stretch comes as a sudden event/i);
    assert.doesNotMatch(mlText, /ഈ കാലയളവിൽ വിവാഹം/);
    assert.ok(english.sections.some((s) => s.id === "reading" && s.paras.some((p) => p.text?.startsWith("Matters not yet in season"))));
  }
});

test("adult report still contains eligible marriage context", () => {
  const result = computeChart({ ...chart, birthDate: "1980-01-01" });
  const doc = buildReport(result, { plain: true, modules: ["alp"] });
  assert.match(reportText(doc.sections), /Marriage birth context:/);
});

test("standing follows career's onset in both the shared gate and school briefs", () => {
  const result = computeChart(chart);
  assert.equal(areaSeason("authority", result.utc, result.now.asOf, chart).inSeason, false);
  const input = agreementInput(result, true);
  const briefs = expandedSchoolTopicBriefs(result, "parashari", input, computeAgreement(input));
  assert.ok(!briefs.some((brief) => brief.topic === "authority"));
  const teenager = computeChart({ ...chart, birthDate: "2009-01-01" });
  assert.equal(areaSeason("authority", teenager.utc, teenager.now.asOf, teenager.chart).inSeason, true);
});

test("deceased minor remains held at the date of passing", () => {
  const result = computeChart({ ...chart, birthDate: "2000-02-01", deathDate: "2010-02-01" });
  const doc = buildReport(result, { plain: true, modules: ["alp"] });
  assert.doesNotMatch(reportText(doc.sections), /Marriage birth context:|ALP timing: natal\/progressed seventh lords/);
});

test("ALP selected dates require eligibility both then and at the present life date", () => {
  for (const [birthDate, selected] of [["1980-01-01", "1985-01-01"], ["2018-02-01", "2040-02-01"]] as const) {
    const result = computeChart({ ...chart, birthDate });
    const input = agreementInput(result, true);
    const doc = buildReport(result, { plain: true, modules: ["alp"], tools: { alpAsOf: selected } });
    const alp = doc.sections.filter((s) => s.id === "alp" || s.id === "alp-plain-topics");
    assert.doesNotMatch(reportText(alp), /Marriage birth context:|a marriage in this stretch|no chance of marriage|\bmarriage\b|\bspouse\b/i);
    const selectedAlp = defaultAlpForTopics(result, input.withheld, selected);
    const briefs = expandedSchoolTopicBriefs(result, "alp", input, computeAgreement(input), { alp: selectedAlp });
    assert.ok(!briefs.some((brief) => brief.topic === "marriage" || brief.topic === "children"));
  }
});
