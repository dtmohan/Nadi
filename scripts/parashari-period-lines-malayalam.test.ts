import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parashariPeriodLineMalayalam } from "../shared/malayalam-parashari-period-lines";
import { HOUSE_LORD_DASA } from "../shared/parashari-dasa";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("complete period lines retain house, placement and adverse conditions", () => {
  for (const rule of HOUSE_LORD_DASA) assert.ok(parashariPeriodLineMalayalam(`As ${rule.text}.`), rule.text);
  assert.match(parashariPeriodLineMalayalam("As lord of the 7th: distress to the spouse and a threat to life (maraka).")!, /പങ്കാളിക്കു വിഷമവും.*ജീവന് ഭീഷണിയും.*മാരകം/);
  assert.match(parashariPeriodLineMalayalam("Venus is in a friendly sign (Gemini): the general rule reads the dasa as favourable.")!, /ശുക്രൻ.*മിഥുനം.*മിത്രരാശി.*അനുകൂലമായി/);
  const source = "Saturn is in the 8th and debilitated: the general rule reads the dasa as unfavourable.";
  assert.match(parashariPeriodLineMalayalam(source)!, /8-ാം.*നീചസ്ഥിതി.*പ്രതികൂലമായി/);
  assert.equal(parashariPeriodLineMalayalam(source + " Cancellation applies."), undefined);
  assert.equal(parashariPeriodLineMalayalam(source.replace("8th", "9th")), undefined);
  assert.equal(parashariPeriodLineMalayalam("Venus is in a friendly sign (Unknown): the general rule reads the dasa as favourable."), undefined);
});

test("generated report period lines retain citations and tone", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  for (const plain of [true, false]) {
    const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("dasa-"));
    const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("dasa-"));
    let count = 0;
    for (let i = 0; i < en.length; i++) for (let j = 0; j < en[i].paras.length; j++) {
      if (!en[i].paras[j].text?.includes("the general rule reads the dasa")) continue;
      if (!parashariPeriodLineMalayalam(en[i].paras[j].text!)) continue;
      assert.equal(ml[i].paras[j].lang, "ml");
      assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
      assert.equal(ml[i].paras[j].tone, en[i].paras[j].tone);
      count++;
    }
    assert.ok(count >= 5, `${count} period lines`);
  }
});
