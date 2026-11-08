import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { buildReport, localizeReportMalayalam, type ReportDoc } from "../shared/report";
import type { Chart } from "../shared/schema";

test("ALP report retains the calculated point, period dates and book-count distinction in Malayalam", () => {
  const chart = { id: 0, name: "Synthetic", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;
  const result = computeChart(chart);
  for (const plain of [true, false]) {
    const en = buildReport(result, { plain, modules: ["alp"], locale: "en" });
    const ml = buildReport(result, { plain, modules: ["alp"], locale: "ml" });
    const a = en.sections.find((s) => s.id === "alp")!, b = ml.sections.find((s) => s.id === "alp")!;
    assert.ok(a && b);
    assert.match(b.paras[0].text!, /അക്ഷയരാശി/);
    assert.match(b.paras[0].text!, /ഭുക്തി/);
    for (const date of a.paras[0].text!.match(/\d{1,2} [A-Za-z]{3} \d{4}/g) ?? []) assert.ok(b.paras[0].text!.includes(date));
    assert.match(b.paras[1].text!, /പൂർണ അംശക്കണക്കനുസരിച്ച്/);
    assert.equal(b.paras[1].provisional, true);
    assert.deepEqual(b.paras[0].cites, a.paras[0].cites);
    assert.deepEqual(b.paras[1].cites, a.paras[1].cites);
  }
});

test("static report translations do not match a changed sentence", () => {
  const source = "These are the birth-chart houses counted from the natal rising sign. They are not a question-time chart and do not answer a horary question.";
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: [], cites: [], sections: [{ id: "sample", title: "Sample", paras: [{ kind: "p", text: source }, { kind: "p", text: `${source} Additional condition.` }] }] };
  const paras = localizeReportMalayalam(doc).sections.find((s) => s.id === "sample")!.paras;
  assert.equal(paras[0].lang, "ml");
  assert.equal(paras[1].text, `${source} Additional condition.`);
  assert.equal(paras[1].lang, "en");
});
