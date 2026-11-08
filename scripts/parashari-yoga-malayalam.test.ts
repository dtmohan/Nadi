import test from "node:test";
import assert from "node:assert/strict";
import { parashariYogaMalayalam } from "../shared/malayalam-parashari-yogas";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import { readFileSync } from "node:fs";
import type { Chart } from "../shared/schema";

test("yoga translations retain all planets, ownership, relationship and dilution", () => {
  const text = "Kendra-trikona raja yoga: Mercury (lord of the 1st and 4th) and Saturn (lord of the 8th and 9th) are conjoined. A relationship between an angle lord and a trine lord confers yoga. One of the pair also owns a 3rd, 6th, 8th, 11th or 12th, which Parashara says dilutes the yoga (34.14-15).";
  const ml = parashariYogaMalayalam(text)!;
  for (const piece of ["ബുധൻ", "ശനി", "1-ാം", "4-ാം", "8-ാം", "9-ാം", "ഒന്നിച്ചിരിക്കുന്നു", "3, 6, 8, 11", "ദുർബലപ്പെടുത്തുമെന്ന്"]) assert.ok(ml.includes(piece), piece);
  assert.equal(parashariYogaMalayalam(text + " A further condition."), undefined);
  assert.equal(parashariYogaMalayalam(text.replace("Mercury", "Pluto")), undefined);
  const solar = "Vosi yoga: Venus and Mercury in the 12th from the Sun. Parashara gives skill, charity, fame, learning and strength. Formed by a mix of benefics and malefics; 38.4 gives the stated effects for the benefics and their contrary for the malefics.";
  assert.match(parashariYogaMalayalam(solar)!, /ശുക്രൻ.*ബുധൻ/);
  assert.match(parashariYogaMalayalam(solar)!, /വിപരീതവും/);
  assert.equal(parashariYogaMalayalam(solar.replace("38.4", "38.5")), undefined);
  const wealth = "Wealth-giving periods: Venus (5th lord) and Saturn (9th lord) can bestow wealth, as can Mercury, Jupiter, Rahu joined to them. Their dasa periods are the ones to watch for gains, read together with their strength and functional nature (41.17).";
  for (const text of ["ശുക്രൻ", "ശനി", "ബുധൻ", "വ്യാഴം", "രാഹു", "ബലവും", "സ്വഭാവവും"]) assert.ok(parashariYogaMalayalam(wealth)?.includes(text), text);
  assert.equal(parashariYogaMalayalam(wealth.replace("Rahu", "Unknown")), undefined);
  const roles = "Karakas in angles or trines: Mars (Atmakaraka) in the 1st and Saturn (Amatyakaraka) in the 10th. Parashara gives the favour and patronage of those in power, and happiness from it.";
  for (const text of ["ആത്മകാരകൻ", "ചൊവ്വ", "1-ാം", "അമാത്യകാരകൻ", "ശനി", "10-ാം"]) assert.ok(parashariYogaMalayalam(roles)?.includes(text), text);
  assert.equal(parashariYogaMalayalam(roles + " Another qualification."), undefined);
});

test("report uses yoga translations with the original citations and tone", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  for (const plain of [true, false]) {
    const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).find((s) => s.id === "yogas")!;
    const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).find((s) => s.id === "yogas")!;
    const index = en.paras.findIndex((p) => p.text?.startsWith("Kendra-trikona raja yoga:"));
    assert.ok(index >= 0);
    assert.equal(ml.paras[index].lang, "ml");
    assert.deepEqual(ml.paras[index].cites, en.paras[index].cites);
    assert.equal(ml.paras[index].tone, en.paras[index].tone);
    assert.equal(ml.paras[index].provisional, en.paras[index].provisional);
  }
});
