import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { agreementInput } from "../shared/agreement";
import { dasaSignifications } from "../shared/parashari-period-significations";
import { parashariPlainSignificationsMalayalam } from "../shared/malayalam-plain-period-karaka";
import { parashariPractitionerSignificationsMalayalam } from "../shared/malayalam-parashari-significations-practitioner";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("plain period significations preserve listed topics, condition, and uncounted status", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
    const result = computeChart(chart), par = agreementInput(result, true).parashari;
    const flatten = (s: ReportSection[]): ReportSection[] => s.flatMap((x) => [x, ...flatten(x.sub ?? [])]);
    const en = flatten(buildReport(result, { plain: true, modules: ["parashari"], locale: "en" }).sections);
    const ml = flatten(buildReport(result, { plain: true, modules: ["parashari"], locale: "ml" }).sections);
    let checked = 0;
    for (const d of par.dasaReadings) {
      const kw = dasaSignifications(d, result.positions, { birthIso: result.utc, asOfIso: result.now.asOf, withheld: false });
      const source = `${kw.textPlain} Shown for context, not counted.`;
      const text = parashariPlainSignificationsMalayalam(kw, source);
      if (!text) continue;
      assert.match(text, /എണ്ണുന്നില്ല/);
      assert.equal(parashariPlainSignificationsMalayalam(kw, source + " Extra condition."), undefined);
      assert.equal(parashariPlainSignificationsMalayalam({ ...kw, words: [...kw.words, "unrecognized matter"] }, source), undefined);
      assert.equal(parashariPlainSignificationsMalayalam({ ...kw, held: [{ area: "marriage", from: 18 }] }, source), undefined);
      const e = en.find((x) => x.id === `dasa-${d.lord}-${d.ageStart}`), m = ml.find((x) => x.id === `dasa-${d.lord}-${d.ageStart}`);
      const index = e?.paras.findIndex((p) => p.text === source) ?? -1;
      if (index < 0) continue;
      assert.equal(m!.paras[index].text, text);
      assert.deepEqual(m!.paras[index].cites, e!.paras[index].cites);
      assert.equal(m!.paras[index].provisional, true);
      assert.equal(m!.paras[index].tone, e!.paras[index].tone);
      checked++;
    }
    assert.ok(checked >= 4);
  } finally { Settings.now = () => Date.now(); }
});

test("practitioner main-period descriptions retain individual citations and condition", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
    const result = computeChart(chart), par = agreementInput(result, false).parashari;
    const flatten = (s: ReportSection[]): ReportSection[] => s.flatMap((x) => [x, ...flatten(x.sub ?? [])]);
    const en = flatten(buildReport(result, { plain: false, modules: ["parashari"], locale: "en" }).sections);
    const ml = flatten(buildReport(result, { plain: false, modules: ["parashari"], locale: "ml" }).sections);
    let checked = 0;
    for (const d of par.dasaReadings) {
      const kw = dasaSignifications(d, result.positions, { birthIso: result.utc, asOfIso: result.now.asOf, withheld: false });
      const source = `${kw.text} Shown, not counted: the period's own lines already name these matters, so this line casts no vote.`;
      const translated = parashariPractitionerSignificationsMalayalam(kw, source);
      if (!translated) continue;
      assert.match(translated, /എണ്ണുന്നില്ല/);
      for (const e of kw.entries) assert.ok(translated.includes(e.ref), e.ref);
      assert.equal(parashariPractitionerSignificationsMalayalam(kw, source + " Extra condition."), undefined);
      assert.equal(parashariPractitionerSignificationsMalayalam({ ...kw, held: [{ area: "marriage", from: 18 }] }, source), undefined);
      if (kw.entries.length) assert.equal(parashariPractitionerSignificationsMalayalam({ ...kw, entries: [{ ...kw.entries[0], ref: "99.99" }, ...kw.entries.slice(1)] }, source), undefined);
      const e = en.find((x) => x.id === `dasa-${d.lord}-${d.ageStart}`), m = ml.find((x) => x.id === `dasa-${d.lord}-${d.ageStart}`);
      const index = e?.paras.findIndex((p) => p.text === source) ?? -1;
      if (index < 0) continue;
      assert.equal(m!.paras[index].text, translated);
      assert.deepEqual(m!.paras[index].cites, e!.paras[index].cites);
      assert.equal(m!.paras[index].provisional, true);
      assert.equal(m!.paras[index].tone, e!.paras[index].tone);
      checked++;
    }
    assert.ok(checked >= 4);
  } finally { Settings.now = () => Date.now(); }
});
