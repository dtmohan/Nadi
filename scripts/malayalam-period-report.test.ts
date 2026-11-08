import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { buildReport, localizeReportMalayalam, type ReportDoc, type ReportSection } from "../shared/report";
import { MALAYALAM_PERIOD_REPORT_NOTES } from "../shared/malayalam-period-report-notes";
import type { Chart } from "../shared/schema";

const flatten = (sections: ReportSection[]): ReportSection[] => sections.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
const base = { id: 0, name: "Synthetic", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;

test("Vimshottari report preserves both running dates and deceased limitation", () => {
  for (const deathDate of [null, "2020-01-01"]) for (const plain of [true, false]) {
    const result = computeChart({ ...base, deathDate });
    const en = buildReport(result, { plain, modules: ["parashari"], locale: "en" });
    const ml = buildReport(result, { plain, modules: ["parashari"], locale: "ml" });
    const e = flatten(en.sections).find((s) => s.id === "timing")!;
    const m = flatten(ml.sections).find((s) => s.id === "timing")!;
    assert.equal(m.paras[0].lang, "ml");
    assert.match(m.paras[0].text!, /വിമ്ശോത്തരി.*നക്ഷത്ര/);
    assert.equal(m.paras[0].text!.includes("ഇപ്പോൾ നടക്കുന്നത്"), !deathDate);
    for (const date of e.paras[0].text!.match(/\d{1,2} [A-Za-z]{3} \d{4}/g) ?? []) assert.ok(m.paras[0].text!.includes(date), date);
    assert.deepEqual(m.paras[0].cites, e.paras[0].cites);
    const note = e.paras.find((p) => !!p.text && !!MALAYALAM_PERIOD_REPORT_NOTES[p.text]);
    assert.ok(note);
    const i = e.paras.indexOf(note);
    assert.equal(m.paras[i].text, MALAYALAM_PERIOD_REPORT_NOTES[note.text!]);
    assert.equal(m.paras[i].provisional, true);
    assert.deepEqual(m.paras[i].cites, note.cites);
  }
});

test("changed period-method wording is not translated by an old snapshot", () => {
  const source = Object.keys(MALAYALAM_PERIOD_REPORT_NOTES)[0];
  const changed = `${source} Additional condition.`;
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: [], cites: [], sections: [{ id: "test", title: "Test", paras: [{ kind: "note", text: changed }] }] };
  assert.equal(localizeReportMalayalam(doc).sections.find((s) => s.id === "test")!.paras[0].text, changed);
});
