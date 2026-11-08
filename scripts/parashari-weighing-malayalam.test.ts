import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parashariWeighingMalayalam } from "../shared/malayalam-parashari-weighing";
import { parashariPractitionerWeighingMalayalam } from "../shared/malayalam-parashari-weighing-practitioner";
import type { BhavaJudgement } from "../shared/parashari-houses";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("house weighing preserves each positive, negative, and qualified reason", () => {
  const source = "Weighing the house as a whole, Parashara finds signs both ways. In its favour: Jupiter, a benefic, looks at it. Against it: its ruler, the Sun, sits in your 1st and does not look back at it; its ruler, the Sun, shares a sign with Mars, a harsher planet and Mercury, which counts as a harsher planet beside the Sun and Mars.";
  const ml = parashariWeighingMalayalam(source)!;
  for (const word of ["അനുകൂലവും പ്രതികൂലവുമായ", "വ്യാഴം", "ദൃഷ്ടിക്കുന്നു", "സൂര്യൻ", "1-ാം", "ദൃഷ്ടിക്കുന്നില്ല", "ചൊവ്വ", "ബുധനോടും"]) assert.ok(ml.includes(word), word);
  assert.equal(parashariWeighingMalayalam(source + " Another condition."), undefined);
  assert.equal(parashariWeighingMalayalam(source.replace("Mars, a harsher planet", "Pluto, a harsher planet")), undefined);
  assert.equal(parashariWeighingMalayalam(source.replace("its ruler, the Sun, sits", "its ruler, the Sun, perhaps sits")), undefined);
  const moon = "Weighing the house as a whole, Parashara finds signs against it: its ruler, Jupiter, shares a sign with Saturn, a harsher planet and the waning Moon, which counts as a harsher planet.";
  assert.match(parashariWeighingMalayalam(moon)!, /ശനി.*ക്ഷയിച്ചുകൊണ്ടിരിക്കുന്ന ചന്ദ്രനോടും/);
});

test("published chart house paragraphs translate without changing the judgment metadata", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  const en = flat(buildReport(result, { plain: true, modules: ["parashari"], locale: "en" }).sections).filter((s) => /^house-\d+$/.test(s.id));
  const ml = flat(buildReport(result, { plain: true, modules: ["parashari"], locale: "ml" }).sections).filter((s) => /^house-\d+$/.test(s.id));
  let count = 0;
  for (let i = 0; i < en.length; i++) {
    const j = en[i].paras.findIndex((p) => p.text?.startsWith("Weighing the house as a whole"));
    if (j < 0) continue;
    assert.equal(ml[i].paras[j].lang, "ml");
    assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
    assert.equal(ml[i].paras[j].tone, en[i].paras[j].tone);
    assert.equal(ml[i].paras[j].provisional, en[i].paras[j].provisional);
    count++;
  }
  assert.equal(count, 12);
});

test("practitioner weighing preserves supporting and adverse reasons and the provisional bhava note", () => {
  const j = { tone: "mixed", support: ["aspected by Jupiter"], strain: ["lord Sun in the 1st does not aspect the house", "lord Sun with the malefics Mars and Mercury (joined by the Sun and Mars, 3.11)"], chalitNote: "By bhava (provisional): Mercury leaves for the 12th under the equal construction only." } as BhavaJudgement;
  const source = "Signs of the house prospering: aspected by Jupiter. Signs against it: lord Sun in the 1st does not aspect the house and lord Sun with the malefics Mars and Mercury (joined by the Sun and Mars, 3.11). By bhava (provisional): Mercury leaves for the 12th under the equal construction only.";
  const ml = parashariPractitionerWeighingMalayalam(j, source)!;
  for (const part of ["വ്യാഴം", "സൂര്യൻ", "1-ാം", "ദൃഷ്ടിക്കുന്നില്ല", "ചൊവ്വ", "ബുധൻ", "3.11", "താൽക്കാലികം", "സമഭാവ", "12-ാം"]) assert.ok(ml.includes(part), part);
  assert.equal(parashariPractitionerWeighingMalayalam(j, source + " Additional condition."), undefined);
  const changed = { ...j, chalitNote: "By bhava (provisional): Mercury has an unfamiliar condition." };
  assert.equal(parashariPractitionerWeighingMalayalam(changed, source.replace(j.chalitNote!, changed.chalitNote)), undefined);
  const unknown = { ...j, strain: ["lord Sun with the malefic Pluto"] };
  assert.equal(parashariPractitionerWeighingMalayalam(unknown, "Signs of the house prospering: aspected by Jupiter. Signs against it: lord Sun with the malefic Pluto. " + j.chalitNote), undefined);
});

test("published chart practitioner weighing keeps all references and tone", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  const en = flat(buildReport(result, { plain: false, modules: ["parashari"], locale: "en" }).sections).filter((s) => /^house-\d+$/.test(s.id));
  const ml = flat(buildReport(result, { plain: false, modules: ["parashari"], locale: "ml" }).sections).filter((s) => /^house-\d+$/.test(s.id));
  let count = 0;
  for (let i = 0; i < en.length; i++) {
    const j = en[i].paras.findIndex((p) => p.text?.startsWith("Signs of the house prospering:") || p.text?.startsWith("Signs against it:"));
    if (j < 0) continue;
    assert.equal(ml[i].paras[j].lang, "ml");
    assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
    assert.equal(ml[i].paras[j].tone, en[i].paras[j].tone);
    assert.equal(ml[i].paras[j].provisional, en[i].paras[j].provisional);
    count++;
  }
  assert.equal(count, 12);
});
