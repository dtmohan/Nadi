import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { agreementInput } from "../shared/agreement";
import { buildReport } from "../shared/report";
import { parashariBasicHouseMalayalam, parashariHouseNoteMalayalam } from "../shared/malayalam-parashari-house-basics";
import { HOUSE_PROSE_NOTE, HOUSE_PROSE_NOTE_PLAIN } from "../shared/parashari-house-prose";
import { translate } from "../shared/localization";
import type { Chart } from "../shared/schema";

const chart = { id: 0, name: "Synthetic", gender: "male", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;

test("house-method notes retain their source qualifications and reject edits", () => {
  for (const source of [HOUSE_PROSE_NOTE, HOUSE_PROSE_NOTE_PLAIN]) {
    assert.ok(parashariHouseNoteMalayalam(source));
    assert.equal(parashariHouseNoteMalayalam(`${source} Additional condition.`), undefined);
  }
  assert.match(parashariHouseNoteMalayalam(HOUSE_PROSE_NOTE)!, /താൽക്കാലികം/);
});

test("house descriptions, empty houses and aspect facts preserve both report registers", () => {
  const r = computeChart(chart);
  for (const plain of [true, false]) {
    const par = agreementInput(r, plain).parashari;
    const en = buildReport(r, { plain, modules: ["parashari"], locale: "en" });
    const ml = buildReport(r, { plain, modules: ["parashari"], locale: "ml" });
    const enH = en.sections.find((s) => s.id === "parashari")!.sub!;
    const mlH = ml.sections.find((s) => s.id === "parashari")!.sub!;
    for (const house of par.houseProse!) {
      const b = par.bhavas.find((x) => x.house === house.house)!;
      for (const part of house.parts.filter((x) => ["covers", "empty", "aspects", "weighing", "both"].includes(x.key))) {
        const text = plain ? part.textPlain : part.text;
        const expected = parashariBasicHouseMalayalam(par, b, part, plain);
        if (!expected && (part.key === "weighing" || part.key === "both")) continue;
        assert.ok(expected, `${house.house} ${part.key} ${plain}`);
        const changed = { ...part, ...(plain ? { textPlain: `${text} Extra condition.` } : { text: `${text} Extra condition.` }) };
        assert.equal(parashariBasicHouseMalayalam(par, b, changed, plain), undefined);
        const index = enH.find((s) => s.id === `house-${house.house}`)!.paras.findIndex((p) => p.text === text);
        assert.ok(index >= 0);
        const translated = mlH.find((s) => s.id === `house-${house.house}`)!.paras[index];
        assert.equal(translated.text, expected);
        assert.deepEqual(translated.cites, enH.find((s) => s.id === `house-${house.house}`)!.paras[index].cites);
        if (part.key === "aspects") for (const aspect of b.aspects.filter((a) => a.quarters >= par.aspectFloor))
          assert.ok(expected!.includes(translate("ml", aspect.planet)));
      }
    }
  }
});

test("a redacted practitioner house does not restore the original source matters", () => {
  const r = computeChart({ ...chart, birthDate: "2018-01-01" });
  const par = agreementInput(r, false).parashari;
  const house = par.houseProse!.find((x) => x.house === 2)!;
  const part = house.parts.find((x) => x.key === "covers")!;
  const b = par.bhavas.find((x) => x.house === 2)!;
  assert.equal(parashariBasicHouseMalayalam(par, b, part, false), undefined);
});
