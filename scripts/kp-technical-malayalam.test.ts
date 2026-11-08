import test from "node:test";
import assert from "node:assert/strict";
import type { KpPlanet, SignificatorLevel } from "../shared/kp";
import { kpStageLabel } from "../shared/chart-explanations";
import { listJoin, withGloss } from "../shared/house-gloss";
import { kpPlanetDetailMalayalam, kpStageDetailMalayalam, kpCuspTraceMalayalam, kpRawEvidenceMalayalam } from "../shared/kp-technical-malayalam";
import { kpCuspTraceText, type KpCuspTrace } from "../shared/kp-event-natal-rules";
import type { KpFinding } from "../shared/rules-kp";

const planet = { planet: "Rahu", sign: "Aries", house: 3, starLord: "Ketu", subLord: "Venus" } as KpPlanet;

test("KP technical planet wording retains sign, house and separate star and sub lords", () => {
  const source = "In this chart Rahu is in Aries, in the 3rd house (siblings, communications and short travel). Its star lord is Ketu and its sub-lord is Venus.";
  const translated = kpPlanetDetailMalayalam(planet, source)!;
  for (const text of ["രാഹു", "മേടം", "3-ാം", "കേതു", "ശുക്രൻ", "നക്ഷത്രാധിപൻ", "സഹാധിപൻ"]) assert.ok(translated.includes(text), text);
  assert.equal(kpPlanetDetailMalayalam(planet, `${source} Additional condition.`), undefined);
});

test("raw KP event evidence retains all emitted facts and rejects changes", () => {
  const f: KpFinding = { ruleId: "example", cusp: 7, subLord: "Venus", inHouse: 4, used: [2, 7], facts: ["in the star of the Moon", "in the sub of Mars", "in a dual sign"], text: "source", topic: "Marriage", polarity: "neutral", source: "source", evidence: "Venus is the sub lord of cusp 7; signifies 2, 7; in the star of Moon; in the sub of Mars; in a dual sign; posited in the 4th" };
  const ml = kpRawEvidenceMalayalam(f, f.evidence)!;
  for (const text of ["ശുക്രൻ", "2, 7", "ചന്ദ്രന്റെ", "ചൊവ്വയുടെ", "ഉഭയരാശിയിൽ", "4-ാം"]) assert.ok(ml.includes(text), text);
  assert.equal(kpRawEvidenceMalayalam(f, `${f.evidence}; extra fact`), undefined);
  assert.equal(kpRawEvidenceMalayalam({ ...f, facts: [...f.facts!, "unknown fact"] }, f.evidence), undefined);
});

test("KP event cusp trace retains the node agency and all four-stage house links", () => {
  const trace: KpCuspTrace = { cusp: 7, cuspSignLord: "Mars", cuspStarLord: "Moon", subLord: "Rahu", subLordHouse: 3, subLordOwns: [], subLordStarLord: "Ketu", starLordHouse: 9, starLordOwns: [], starLordAgency: ["Jupiter"], levels: { A: [1, 2], B: [3], C: [4], D: [5, 11] }, agency: ["Saturn", "Mars"], matterHouses: [2, 7, 11], matchingHouses: [2, 11] };
  const en = kpCuspTraceText(trace);
  const text = kpCuspTraceMalayalam(trace, en)!;
  for (const word of ["7", "ചൊവ്വ", "ചന്ദ്രൻ", "രാഹു", "കേതു", "വ്യാഴം", "ശനി", "A 1, 2", "B 3", "C 4", "D 5, 11", "2, 11", "പോയിന്റുകൾ കൂട്ടുകയോ ചെയ്യുന്നില്ല"]) assert.ok(text.includes(word), word);
  assert.equal(kpCuspTraceMalayalam(trace, `${en} Extra condition.`), undefined);
});

test("KP technical stages keep the selected houses and the node representation convention", () => {
  for (const stage of ["A", "B", "C", "D", "E", "F"] as SignificatorLevel[]) {
    const houses = [2, 11];
    const source = `${kpStageLabel(planet, stage)} the ${listJoin(houses.map((h) => withGloss("kp", h)))}.`;
    const translated = kpStageDetailMalayalam(planet, stage, houses, source)!;
    assert.ok(translated.includes("2-ാം") && translated.includes("11-ാം"));
    if (stage === "C" || stage === "D") assert.match(translated, /രാശ്യാധിപനിലൂടെയും/);
    assert.equal(kpStageDetailMalayalam(planet, stage, houses, `${source} New fact.`), undefined);
  }
  assert.equal(kpStageDetailMalayalam(planet, "A", [13], "unknown"), undefined);
});
