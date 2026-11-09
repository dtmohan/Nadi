import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GRADE_NOTE, DIRECTION_NOTE } from "../shared/grade";
import { bnnGradeNoteMalayalam } from "../shared/malayalam-bnn-grade-note";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("BNN grading and direction note keeps conventions and uncertainty", () => {
  const base = `${GRADE_NOTE} ${DIRECTION_NOTE}`;
  const translation = bnnGradeNoteMalayalam(base)!;
  for (const word of ["പകുതി", "രണ്ട്", "പന്ത്രണ്ട്", "ഏഴ്", "ഗ്രന്ഥത്തിൽ പറഞ്ഞ നിയമമല്ല", "താൽക്കാലികമാണ്"]) assert.ok(translation.includes(word), word);
  const withBand = `${base} The birth time is taken as ±15 minutes; lines whose direction or bond changes inside that band say so.`;
  assert.ok(bnnGradeNoteMalayalam(withBand, 15)?.includes("±15"));
  assert.equal(bnnGradeNoteMalayalam(withBand, 10), undefined);
  assert.equal(bnnGradeNoteMalayalam(`${base} A new limitation.`), undefined);
});

test("the BNN report preserves source citations and provisional status", () => {
  const entry = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases[0];
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, notes: "", events: [], ...entry } as Chart;
  const result = computeChart(chart);
  const flatten = (sections: ReportSection[]): ReportSection[] => sections.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
  const en = flatten(buildReport(result, { plain: false, locale: "en", modules: ["bnn"] }).sections);
  const ml = flatten(buildReport(result, { plain: false, locale: "ml", modules: ["bnn"] }).sections);
  const section = en.find((s) => s.id === "bnn")!;
  const index = section.paras.findIndex((p) => p.text === `${GRADE_NOTE} ${DIRECTION_NOTE}`);
  assert.ok(index >= 0);
  const translated = ml.find((s) => s.id === "bnn")!.paras[index];
  assert.equal(translated.lang, "ml");
  assert.equal(translated.provisional, true);
  assert.deepEqual(translated.cites, section.paras[index].cites);
});
