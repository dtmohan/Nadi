import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { buildReport, localizeReportMalayalam, type ReportDoc } from "../shared/report";
import type { Chart } from "../shared/schema";
import { chartTableRowMalayalam } from "../shared/malayalam-chart-table";

function chart(gender: "male" | "female", birthDate = "1990-01-01", deathDate: string | null = null): Chart {
  return { id: 0, name: "Synthetic", gender, birthDate, birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate, timeUncertaintyMin: 0, events: [] } as Chart;
}

test("chart and Nadi introductions preserve their facts, source citations and life-stage wording", () => {
  for (const input of [chart("male"), chart("female"), chart("male", "1940-01-01", "2000-01-01"), chart("female", "2018-01-01")]) {
    const result = computeChart(input);
    for (const plain of [true, false]) {
      const en = buildReport(result, { plain, modules: ["bnn"], locale: "en" });
      const ml = buildReport(result, { plain, modules: ["bnn"], locale: "ml" });
      const chartEn = en.sections.find((s) => s.id === "chart")!.paras[0];
      const chartMl = ml.sections.find((s) => s.id === "chart")!.paras[0];
      const nadiEn = en.sections.find((s) => s.id === "bnn")!.paras[0];
      const nadiMl = ml.sections.find((s) => s.id === "bnn")!.paras[0];
      assert.equal(chartMl.lang, "ml");
      for (const fact of [input.name, input.place, "12:00", result.timeBasis.label, result.ayanamsaValue.toFixed(3), String(result.positions.find((p) => p.planet === "Moon")!.pada)]) assert.ok(chartMl.text!.includes(fact), fact);
      if (input.deathDate) assert.match(chartMl.text!, /വിയോഗത്തീയതി.*ഭാവിപ്രവചനമല്ല/);
      assert.equal(nadiMl.lang, "ml");
      assert.match(nadiMl.text!, /വ്യാഴം.*ശനി/);
      assert.equal(nadiMl.text!.includes("ദേഹമാണ്"), input.gender === "female");
      assert.deepEqual(chartMl.cites, chartEn.cites);
      assert.deepEqual(nadiMl.cites, nadiEn.cites);
    }
  }
});

test("changed introduction cannot reuse a stale Malayalam translation", () => {
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: [], cites: [], sections: [{ id: "chart", title: "Chart", paras: [{ kind: "lead", text: "Edited introduction.", translationMl: { source: "Original introduction.", text: "ജനനജാതകം" } }] }] };
  const para = localizeReportMalayalam(doc).sections[0].paras[0];
  assert.equal(para.text, "Edited introduction.");
  assert.equal(para.lang, "en");
});

test("chart table localizes all known combined notes but rejects changed table schemas", () => {
  const head = ["Planet", "Sign", "Degree", "Nakshatra", "Notes"];
  const row = ["Mercury", "Virgo", "21°00′", "Hasta 2", "retrograde, combust, own sign"];
  const translated = chartTableRowMalayalam(head, row)!;
  assert.equal(translated[2], row[2]);
  assert.match(translated[3], /2-ാം പാദം/);
  assert.match(translated[4], /വക്രം.*അസ്തംഗതം.*സ്വക്ഷേത്രം/);
  assert.equal(chartTableRowMalayalam(head, [...row.slice(0, 4), "retrograde, new condition"]), undefined);
  assert.equal(chartTableRowMalayalam([...head, "Extra"], row), undefined);
  assert.equal(chartTableRowMalayalam(head, [...row.slice(0, 3), "Unknown 2", row[4]]), undefined);
});
