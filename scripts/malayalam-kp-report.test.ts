import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { buildReport, localizeReportMalayalam, type ReportDoc } from "../shared/report";
import { MALAYALAM_KP_REPORT_NOTES } from "../shared/malayalam-kp-report-notes";
import type { Chart } from "../shared/schema";

test("KP report introduction and method notes preserve citations and chart-specific facts", () => {
  const chart = { id: 0, name: "Synthetic", gender: "male", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;
  const result = computeChart(chart);
  for (const plain of [true, false]) {
    const en = buildReport(result, { plain, modules: ["kp"], locale: "en" });
    const ml = buildReport(result, { plain, modules: ["kp"], locale: "ml" });
    const a = en.sections.find((s) => s.id === "kp")!, b = ml.sections.find((s) => s.id === "kp")!;
    assert.match(b.paras[0].text!, /നക്ഷത്രാധിപൻ.*സഹാധിപൻ/);
    assert.deepEqual(b.paras[0].cites, a.paras[0].cites);
    for (const source of Object.keys(MALAYALAM_KP_REPORT_NOTES)) {
      const i = a.paras.findIndex((p) => p.text === source);
      assert.ok(i >= 0);
      assert.equal(b.paras[i].text, MALAYALAM_KP_REPORT_NOTES[source]);
      assert.deepEqual(b.paras[i].cites, a.paras[i].cites);
    }
  }
});

test("KP method note falls back when an extra condition is added", () => {
  const source = Object.keys(MALAYALAM_KP_REPORT_NOTES)[0];
  const changed = `${source} Additional condition.`;
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: [], cites: [], sections: [{ id: "kp", title: "KP", paras: [{ kind: "note", text: changed }] }] };
  assert.equal(localizeReportMalayalam(doc).sections.find((s) => s.id === "kp")!.paras[0].text, changed);
});
