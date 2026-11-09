import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { agreementInput } from "../shared/agreement";
import { buildReport, type ReportSection } from "../shared/report";
import { parashariLordInfluenceMalayalam } from "../shared/malayalam-parashari-lord-influence";
import { translate } from "../shared/localization";
import type { Chart } from "../shared/schema";

test("house-lord clues retain every observation and reject edited or gated source", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
    const result = computeChart(chart);
    let tested = 0;
    for (const plain of [true, false]) {
      const par = agreementInput(result, plain).parashari;
      const flatten = (s: ReportSection[]): ReportSection[] => s.flatMap((x) => [x, ...flatten(x.sub ?? [])]);
      const en = flatten(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections);
      const ml = flatten(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections);
      for (const j of par.bhavaJudgement) for (const clue of [j.lordAspectClue, j.lordOccupancyClue]) {
        if (!clue) continue;
        const source = plain ? clue.plain : clue.text;
        const translated = parashariLordInfluenceMalayalam(clue, source, plain);
        assert.ok(translated, source);
        for (const planet of [clue.planet, ...clue.qualifiers.otherMaleficOccupants, ...clue.qualifiers.otherMaleficAspects]) assert.ok(translated.includes(translate("ml", planet)));
        assert.match(translated, /ഭാഗിക പരിശോധന/);
        assert.match(translated, /സംഭവവാഗ്ദാനമോ അല്ല/);
        assert.equal(parashariLordInfluenceMalayalam(clue, source + " Additional condition.", plain), undefined);
        assert.equal(parashariLordInfluenceMalayalam({ ...clue, qualifiers: { ...clue.qualifiers, lordDebilitated: !clue.qualifiers.lordDebilitated } }, source, plain), undefined);
        const e = en.find((s) => s.id === `house-${j.house}`), m = ml.find((s) => s.id === `house-${j.house}`);
        const index = e?.paras.findIndex((p) => p.text === source) ?? -1;
        if (index >= 0) {
          assert.equal(m!.paras[index].text, translated);
          assert.deepEqual(m!.paras[index].cites, e!.paras[index].cites);
          assert.equal(m!.paras[index].provisional, e!.paras[index].provisional);
          tested++;
        }
      }
    }
    assert.ok(tested > 0);
  } finally { Settings.now = () => Date.now(); }
});
