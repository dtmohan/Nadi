import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { buildReport, buildContext } from "../shared/report";
import { jaiminiHeldMalayalam, jaiminiInduMalayalam, jaiminiLeadMalayalam, jaiminiPeriodMalayalam } from "../shared/malayalam-jaimini-report";
import { Settings } from "luxon";
import { translate } from "../shared/localization";
import type { Chart } from "../shared/schema";

const chart: Chart = { id: 0, name: "Synthetic", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;

test("minor report translates only the already-held Jaimini topics", () => {
  const oldNow = Settings.now;
  Settings.now = () => Date.parse("2026-11-08T12:00:00Z");
  try {
    const result = computeChart({ ...chart, birthDate: "2020-01-01" });
    assert.equal(result.sensitive?.withheld, true);
    const en = buildReport(result, { plain: true, modules: ["jaimini"], locale: "en" });
    const ml = buildReport(result, { plain: true, modules: ["jaimini"], locale: "ml" });
    const a = en.sections.find((s) => s.id === "jaimini")!;
    const b = ml.sections.find((s) => s.id === "jaimini")!;
    const n = a.paras.findIndex((p) => p.text?.startsWith("Held for later at this age:"));
    assert.ok(n >= 0);
    assert.equal(b.paras[n].lang, "ml");
    assert.match(b.paras[n].text!, /പിന്നീട് കാണിക്കാൻ മാറ്റിവച്ച/);
    assert.deepEqual(a.sub?.map((s) => s.id), b.sub?.map((s) => s.id));
    assert.equal(jaiminiHeldMalayalam(["wealth & gains"], "Held for later at this age: wealth & gains. Extra."), undefined);
    assert.equal(jaiminiHeldMalayalam(["unknown"], "Held for later at this age: unknown."), undefined);
  } finally { Settings.now = oldNow; }
});

for (const deathDate of [null, "2020-01-01"]) test(`Jaimini report translation retains roles, dates and the recorded life stage (${deathDate ?? "living"})`, () => {
  const result = computeChart({ ...chart, deathDate });
  const en = buildReport(result, { plain: false, modules: ["jaimini"], locale: "en" });
  const ml = buildReport(result, { plain: false, modules: ["jaimini"], locale: "ml" });
  const a = en.sections.find((s) => s.id === "jaimini")!, b = ml.sections.find((s) => s.id === "jaimini")!;
  const lead = a.paras.find((p) => p.kind === "lead")!, leadMl = b.paras.find((p) => p.kind === "lead")!;
  assert.match(leadMl.text!, /കാരകാംശം/);
  for (const k of result.jaimini.karakas) assert.ok(leadMl.text!.includes(translate("ml", k.planet)), k.planet);
  assert.equal(jaiminiLeadMalayalam(result.jaimini, `${lead.text} Additional condition.`), undefined);
  assert.deepEqual(leadMl.cites, lead.cites);
  const period = a.paras.find((p) => p.text?.includes("Chara dasha"));
  if (period) {
    const periodMl = b.paras[a.paras.indexOf(period)];
    assert.match(periodMl.text!, deathDate ? /വിയോഗത്തീയതിയിലെ/ : /നിലവിലെ/);
    for (const date of period.text!.match(/\d{1,2} [A-Za-z]{3} \d{4}/g) ?? []) assert.ok(periodMl.text!.includes(date));
    const ctx = buildContext(result, false);
    assert.equal(jaiminiPeriodMalayalam(result.jaimini, ctx.lifeAt, ctx.deceased, `${period.text} Additional condition.`), undefined);
    assert.match(periodMl.aside!, /പന്ത്രണ്ട് അന്തർദശകൾ/);
  }
  const indu = a.sub!.find((s) => s.id === "jaimini-indu")!.paras[0];
  const induMl = b.sub!.find((s) => s.id === "jaimini-indu")!.paras[0];
  const i = result.jaimini.indu;
  for (const n of [i.ninthFromLagna.kala, i.ninthFromMoon.kala, i.sum, i.remainder]) assert.ok(induMl.text!.includes(String(n)));
  assert.match(induMl.text!, /പന്ത്രണ്ടുകൊണ്ട്/);
  assert.match(induMl.aside!, /നാഡി വായനയിലേക്ക് ഒന്നും ചേർക്കുന്നില്ല/);
  assert.equal(jaiminiInduMalayalam(i, result.positions.find((p) => p.planet === "Moon")!.sign, `${indu.text} Extra condition.`), undefined);
  assert.deepEqual(induMl.cites, indu.cites);
});

test("Indu findings retain source qualifications and dated periods, and reject changed clauses", () => {
  const cases: [string, RegExp][] = [
    ["The Indu Lagna (Virgo) stands empty. The verse fixes its scale only for occupied signs, so its own tiers are silent here — the lagna is then read through its lord, below, the way any empty bhava is.", /കന്നി.*ശൂന്യഭാവങ്ങളെപ്പോലെ/],
    ["Mercury, lord of the Indu Lagna, stands in the 10th from it, one of IV.11's houses, in a own sign sign, joined by benefics (Venus): Uttara Kalamrita IV.11's prosperity clause for a bhava lord, read here against the Indu Lagna (an extension; provisional).", /IV\.11.*ശുക്രൻ.*വിപുലീകരണം; താൽക്കാലിക/],
    ["The Indu Lagna's own lord Mercury stands in the 10th from it, in Gemini (own sign), with Sun, Venus and Rahu.", /10-ാം.*മിഥുനം.*സൂര്യൻ, ശുക്രൻ, രാഹു/],
    ["Benefic Venus in a Kendra (the 4th, 7th or 10th) from the Indu Lagna: its dasha period is beneficial. Venus 17 Oct 2061 to 17 Oct 2081.", /കേന്ദ്രത്തിൽ.*17 Oct 2061 മുതൽ 17 Oct 2081 വരെ/],
    ["The 11th from the Indu Lagna is occupied or aspected by Moon: wealth promise, through an unfair medium.", /ചന്ദ്രൻ.*അന്യായമായ മാർഗത്തിലൂടെ/],
    ["Moon in the 5th, 9th or 11th from the Indu Lagna: the book's second line for becoming wealthy.", /ചന്ദ്രൻ.*രണ്ടാമത്തെ/],
    ["Benefic Mercury and Venus in the Indu Lagna: the dasha period of these planets gives good results. Mercury 1 Jan 2020 to 1 Jan 2037 and Venus 1 Jan 2037 to 1 Jan 2057.", /ഈ ഗ്രഹങ്ങളുടെ.*ബുധൻ 1 Jan 2020.*ശുക്രൻ 1 Jan 2037/],
  ];
  for (const [source, expected] of cases) {
    assert.match(translate("ml", source), expected, source);
    assert.equal(translate("ml", `${source} Additional condition.`), `${source} Additional condition.`);
  }
  const unknown = "The 11th from the Indu Lagna is occupied or aspected by Pluto: wealth promise, by fair means.";
  assert.equal(translate("ml", unknown), unknown);
  const altered = cases[1][0].replace("(an extension; provisional)", "(confirmed)");
  assert.equal(translate("ml", altered), altered);
  const mismatched = "Benefic Mercury and Venus in the Indu Lagna: the dasha period of this planet gives good results.";
  assert.equal(translate("ml", mismatched), mismatched);
});
