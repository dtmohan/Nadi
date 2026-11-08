import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parashariDasaGlossMalayalam, parashariDasaSummaryMalayalam } from "../shared/malayalam-parashari-dasa-gloss";
import { withGloss, withGlossList, HOUSE_AREAS_PLAIN } from "../shared/house-gloss";
import type { DashaGloss } from "../shared/parashari";
import type { PlanetPosition } from "../shared/astro";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("plain period gloss translates complete ownership, node, and father clauses only", () => {
  const source = `Rules the ${withGlossList("parashari", [2, 7])} and stands in the ${withGloss("parashari", 3)}.`;
  const gloss = { lord: "Mars", house: 3, owns: [2, 7], plain: source } as DashaGloss;
  const ml = parashariDasaGlossMalayalam(gloss, [], 0, source)!;
  for (const part of ["2-ാം", "ധനവും കുടുംബവും", "7-ാം", "പങ്കാളി, യാത്ര, വ്യാപാരം", "3-ാം", "ധൈര്യവും സഹോദരങ്ങളും"]) assert.ok(ml.includes(part), part);
  assert.equal(parashariDasaGlossMalayalam(gloss, [], 0, `${source} A further condition.`), undefined);
  assert.equal(parashariDasaGlossMalayalam({ ...gloss, plain: source + " Changed." }, [], 0, source), undefined);
  const nodeSource = `In the ${withGloss("parashari", 4)}, giving the results of its sign lord Mars and of the planets with it.`;
  const node = { ...gloss, lord: "Rahu", house: 4, owns: [], plain: nodeSource } as DashaGloss;
  const positions = [{ planet: "Rahu", signIndex: 0 }] as PlanetPosition[];
  assert.match(parashariDasaGlossMalayalam(node, positions, 0, nodeSource)!, /രാശ്യാധിപനായ ചൊവ്വ.*ഒപ്പമുള്ള ഗ്രഹങ്ങളുടെയും/);
  assert.equal(parashariDasaGlossMalayalam(node, [], 0, nodeSource), undefined);
  const fatherSource = `Rules the ${withGlossList("parashari", [4])} and stands in the ${withGloss("parashari", 1)}. The father enjoys happiness in this dasa (70.16).`;
  const father = { lord: "Moon", house: 1, owns: [4], plain: fatherSource } as DashaGloss;
  assert.match(parashariDasaGlossMalayalam(father, [], 0, fatherSource)!, /അച്ഛൻ സന്തോഷം.*70\.16/);
  assert.equal(parashariDasaGlossMalayalam(father, [], 1, fatherSource), undefined);
  const old = HOUSE_AREAS_PLAIN[3];
  try {
    HOUSE_AREAS_PLAIN[3] = "changed house meaning";
    assert.equal(parashariDasaGlossMalayalam(gloss, [], 0, source), undefined);
  } finally { HOUSE_AREAS_PLAIN[3] = old; }
});

test("plain report carries the translated gloss without changing its metadata", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  const en = flat(buildReport(result, { plain: true, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("dasa-"));
  const ml = flat(buildReport(result, { plain: true, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("dasa-"));
  assert.ok(en.length > 0);
  let translated = 0;
  for (let i = 0; i < en.length; i++) {
    assert.deepEqual(ml[i].paras[0].cites, en[i].paras[0].cites);
    assert.equal(ml[i].paras[0].tone, en[i].paras[0].tone);
    assert.equal(ml[i].paras[0].provisional, en[i].paras[0].provisional);
    if (ml[i].paras[0].lang === "ml") translated++;
  }
  assert.ok(translated >= 6, `only ${translated} period glosses translated`);
});

test("practitioner period summary keeps each specific verse and never adds the rest of a verse", () => {
  const source = `Mars owns the ${withGlossList("parashari", [1, 2])} and stands in the ${withGloss("parashari", 2)}. Lord-in-house verses: 24.2 (1st lord in the 2nd: gainful and learned); 24.14 (2nd lord in the 2nd: wealth and pride).`;
  const gloss = { lord: "Mars", house: 2, owns: [1, 2], summary: source } as DashaGloss;
  const ml = parashariDasaSummaryMalayalam(gloss, [], 0, source)!;
  for (const part of ["ചൊവ്വ", "1-ാം ഭാവാധിപൻ", "2-ാം ഭാവാധിപൻ", "24.2", "24.14", "നേട്ടവും അറിവും", "ധനവും അഭിമാനവും"]) assert.ok(ml.includes(part), part);
  assert.ok(!ml.includes("ദാമ്പത്യ"), "the second clause of verse 14 must not be added");
  assert.equal(parashariDasaSummaryMalayalam(gloss, [], 0, source + " By bhava (provisional): a new condition."), undefined);
  assert.equal(parashariDasaSummaryMalayalam({ ...gloss, summary: source + " Additional text." }, [], 0, source), undefined);
  const nodeSource = `Rahu in the ${withGloss("parashari", 4)}; it gives the results of its sign lord Mars and of planets in its company.`;
  const node = { ...gloss, lord: "Rahu", house: 4, owns: [], summary: nodeSource } as DashaGloss;
  assert.match(parashariDasaSummaryMalayalam(node, [{ planet: "Rahu", signIndex: 0 }] as PlanetPosition[], 0, nodeSource)!, /രാഹു.*ചൊവ്വ.*ഒപ്പമുള്ള ഗ്രഹങ്ങളുടെയും/);
  assert.equal(parashariDasaSummaryMalayalam(node, [], 0, nodeSource), undefined);
});

test("practitioner report applies guarded summaries and retains metadata", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  const en = flat(buildReport(result, { plain: false, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("dasa-"));
  const ml = flat(buildReport(result, { plain: false, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("dasa-"));
  let translated = 0;
  for (let i = 0; i < en.length; i++) {
    assert.deepEqual(ml[i].paras[0].cites, en[i].paras[0].cites);
    assert.equal(ml[i].paras[0].tone, en[i].paras[0].tone);
    assert.equal(ml[i].paras[0].provisional, en[i].paras[0].provisional);
    if (ml[i].paras[0].lang === "ml") translated++;
  }
  assert.ok(translated > 0);
});
