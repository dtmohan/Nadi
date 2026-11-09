import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import { parashariHouseChapterMalayalam } from "../shared/malayalam-parashari-house-chapters";
import type { Chart } from "../shared/schema";

test("house chapter translations retain every condition and reject additional clauses", () => {
  const examples: Array<[boolean, string, string[]]> = [
    [false, "Moon, lord of the lagna, is in the 10th, free of malefic company. Parashara promises comforts of the body at all times.", ["ചന്ദ്രൻ", "10-ാം", "പാപഗ്രഹ", "ശാരീരിക"]],
    [true, "Mercury, ruler of your 2nd house, is in your 2nd, its own house. Parashara says the ruler of your 2nd house so placed promotes wealth.", ["ബുധൻ", "2-ാം", "സ്വന്തം", "ധനം"]],
    [true, "Saturn, ruler of your 2nd house, is in your 8th. Parashara says financial conditions decline when the ruler of your 2nd house is in your 6th, 8th or 12th.", ["ശനി", "8-ാം", "ആറിലോ", "പന്ത്രണ്ടിലോ"]],
    [false, "Mars, lord of the 5th, is aspected by Jupiter. Parashara says children are obtained.", ["ചൊവ്വ", "വ്യാഴത്തിന്റെ", "സന്താന"]],
    [true, "Jupiter, ruler of your 7th house, is exalted. Parashara promises full happiness through the spouse and marriage. Parashara adds that particular exaltation of the ruler of your 7th house can also mean more than one marriage.", ["വ്യാഴം", "ഉച്ചത്തിലാണ്", "പൂർണ", "ഒന്നിലധികം"]],
    [false, "Mercury, lord of the 12th, is in the 9th, an angle or trine. Parashara says the native will have a spouse.", ["ബുധൻ", "9-ാം", "കേന്ദ്രമോ", "പങ്കാളി"]],
    [true, "Your 3rd is occupied by the Moon and aspected by Jupiter. Parashara says you have siblings and are courageous.", ["മൂന്നാം", "ചന്ദ്രൻ", "വ്യാഴം", "സഹോദരങ്ങൾ", "ധൈര്യ"]],
    [false, "The 3rd is aspected by Mercury and Venus. Parashara says the native has co-born and is courageous.", ["ബുധൻ", "ശുക്രൻ", "ദൃഷ്ടി"]],
  ];
  for (const [plain, source, terms] of examples) {
    const result = parashariHouseChapterMalayalam(source, plain);
    assert.ok(result, source);
    for (const word of terms) assert.ok(result.includes(word), word);
    assert.equal(parashariHouseChapterMalayalam(source + " Extra condition.", plain), undefined);
  }
  assert.equal(parashariHouseChapterMalayalam("Your 3rd is occupied by Pluto. Parashara says you have siblings and are courageous.", true), undefined);
  assert.equal(parashariHouseChapterMalayalam("Saturn, ruler of your 7th house, is in its own sign. Parashara promises full happiness through the spouse and marriage. Parashara adds that particular exaltation of the ruler of your 7th house can also mean more than one marriage.", true), undefined);
});

test("published development chart keeps house text, citations and provisional status aligned", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const entry = fixture.cases.find((c: { name: string }) => c.name === "Xuxa");
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...entry } as Chart;
    const result = computeChart(chart);
    const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
    let checked = 0;
    for (const plain of [true, false]) {
      const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).filter((s) => /^house-\d+$/.test(s.id));
      const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).filter((s) => /^house-\d+$/.test(s.id));
      for (let i = 0; i < en.length; i++) for (let j = 0; j < en[i].paras.length; j++) {
        const text = en[i].paras[j].text, translated = text && parashariHouseChapterMalayalam(text, plain);
        if (!translated) continue;
        assert.equal(ml[i].paras[j].text, translated);
        assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
        assert.equal(ml[i].paras[j].provisional, en[i].paras[j].provisional);
        assert.equal(ml[i].paras[j].tone, en[i].paras[j].tone);
        checked++;
      }
    }
    assert.ok(checked >= 8);
  } finally { Settings.now = () => Date.now(); }
});
