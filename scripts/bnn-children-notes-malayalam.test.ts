import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { computeChart } from "../server/routes";
import type { Chart } from "../shared/schema";
import { bnnChildrenNotesMalayalam } from "../shared/malayalam-bnn-children-notes";
import { buildReport, type ReportSection } from "../shared/report";

function example() {
  const entry = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases.find((c: { name: string }) => c.name === "P. T. Usha");
  return computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, notes: "", events: [], ...entry } as Chart);
}

test("children notes keep all linked placements and reject added or changed clauses", () => {
  const c = example().reading.children;
  const source = c.notes.join(" ").trim();
  const ml = bnnChildrenNotesMalayalam(c, source);
  assert.ok(ml);
  assert.ok(ml.includes("എണ്ണമോ ലിംഗമോ"));
  assert.ok(ml.includes("താൽക്കാലികമാണ്"));
  assert.ok(ml.includes("താമസം സ്ഥാപിക്കുന്നില്ല"));
  assert.equal(bnnChildrenNotesMalayalam(c, `${source} Additional claim.`), undefined);
  assert.equal(bnnChildrenNotesMalayalam({ ...c, notes: [...c.notes, "An unrecognized condition."] }, `${source} An unrecognized condition.`), undefined);
});

test("the practitioner report retains children-note citations and original limitations", () => {
  const r = example();
  const flatten = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
  const en = flatten(buildReport(r, { plain: false, locale: "en", modules: ["bnn"] }).sections);
  const ml = flatten(buildReport(r, { plain: false, locale: "ml", modules: ["bnn"] }).sections);
  const e = en.find((s) => s.id === "bnn-children")!;
  const index = e.paras.findIndex((p) => p.text === r.reading.children.notes.join(" ").trim());
  assert.ok(index >= 0);
  const translated = ml.find((s) => s.id === "bnn-children")!.paras[index];
  assert.equal(translated.lang, "ml");
  assert.deepEqual(translated.cites, e.paras[index].cites);
  assert.ok(translated.text?.includes("ലിംഗമോ"));
});
