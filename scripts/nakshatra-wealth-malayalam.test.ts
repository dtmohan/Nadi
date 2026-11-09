import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAKSHATRA_WEALTH, type NakshatraWealthHit } from "../shared/nakshatra-wealth";
import { nakshatraWealthHeadlineMalayalam, nakshatraWealthHitMalayalam, nakshatraWealthNotesMalayalam } from "../shared/malayalam-nakshatra-wealth";
import { buildReport, type ReportSection } from "../shared/report";
import { computeChart } from "../server/routes";
import { translate } from "../shared/localization";
import type { Chart } from "../shared/schema";

test("all twenty-star source sentences retain all printed planets, stars and conditions", () => {
  let count = 0;
  for (const [nakshatra, spec] of Object.entries(NAKSHATRA_WEALTH)) for (const rule of spec.rules) {
    const h: NakshatraWealthHit = { nakshatra, planet: rule.planet, houses: rule.houses ?? "any", conjunctWith: rule.conjunctWith, special: rule.special, text: rule.text, pages: spec.pages };
    const ml = nakshatraWealthHitMalayalam(h, h.text);
    assert.ok(ml, h.text);
    assert.ok(ml.includes(translate("ml", nakshatra)), h.text);
    if (h.planet) assert.ok(ml.includes(translate("ml", h.planet)), h.text);
    if (h.conjunctWith) assert.ok(ml.includes(translate("ml", h.conjunctWith)), h.text);
    if (h.text.includes(" conjunct ")) assert.ok(ml.includes("കൂടിച്ചേർന്നു"), h.text);
    assert.equal(nakshatraWealthHitMalayalam(h, `${h.text} Another condition.`), undefined);
    count++;
  }
  assert.equal(count, 144);
  const andRule = NAKSHATRA_WEALTH["Purva Ashadha"].rules.find((r) => r.text.includes("Trikon and wealth-giving"))!;
  const orRule = NAKSHATRA_WEALTH.Pushya.rules.find((r) => r.text.includes("Trikon or wealth-giving"))!;
  const makeHit = (star: string, rule: typeof andRule): NakshatraWealthHit => ({ nakshatra: star, planet: rule.planet, houses: rule.houses ?? "any", conjunctWith: rule.conjunctWith, text: rule.text, pages: "" });
  assert.ok(nakshatraWealthHitMalayalam(makeHit("Purva Ashadha", andRule), andRule.text)!.includes("ത്രികോണവും ധനദായകവുമായ"));
  assert.ok(nakshatraWealthHitMalayalam(makeHit("Pushya", orRule), orRule.text)!.includes("ത്രികോണമോ ധനദായകമോ"));
});

test("wealth-nakshatra report retains its counts, source qualification and citations", () => {
  const person = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases[0];
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart;
  const result = computeChart(chart), reading = result.nakshatraWealth!;
  assert.ok(nakshatraWealthHeadlineMalayalam(reading, reading.headline));
  assert.equal(nakshatraWealthHeadlineMalayalam(reading, `${reading.headline} Another claim.`), undefined);
  assert.ok(nakshatraWealthNotesMalayalam(reading.notes.join(" "))?.includes("ആധുനിക ഗവേഷണ"));
  assert.equal(nakshatraWealthNotesMalayalam(`${reading.notes.join(" ")} Another claim.`), undefined);
  const flat = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  const en = flat(buildReport(result, { plain: false, modules: ["bnn"], locale: "en" }).sections).find((s) => s.id === "bnn-nakshatra-wealth")!;
  const ml = flat(buildReport(result, { plain: false, modules: ["bnn"], locale: "ml" }).sections).find((s) => s.id === en.id)!;
  assert.ok(en.paras.length >= 2);
  en.paras.forEach((p, i) => {
    assert.equal(ml.paras[i].lang, "ml", p.text);
    assert.deepEqual(ml.paras[i].cites, p.cites);
    assert.equal(ml.paras[i].provisional, p.provisional);
  });
});
