import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { agreementFor, AGREEMENT_METHOD, AGREEMENT_NOTE, AGREEMENT_PARENTS_NOTE } from "../shared/agreement";
import { agreementSentenceMalayalam } from "../shared/malayalam-agreement";
import { agreementNoteMalayalam } from "../shared/malayalam-agreement-notes";
import { soften } from "../shared/gentle";
import type { Chart } from "../shared/schema";

test("agreement translation preserves every named system and refuses changed wording", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const entry = fixture.cases[0];
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, notes: "", events: [], ...entry } as Chart;
  const result = computeChart(chart);
  const names: Record<string, string> = { bnn: "നാഡി", parashari: "പരാശരി", jaimini: "ജൈമിനി", kp: "KP" };
  let translated = 0;
  for (const t of agreementFor(result, true)) {
    const source = soften(t.sentence), ml = agreementSentenceMalayalam(t, source);
    if (!ml) continue;
    translated++;
    if (t.stances.some((s) => s.stance !== "silent")) for (const s of t.stances) assert.ok(ml.includes(names[s.system]), s.system);
    assert.equal(agreementSentenceMalayalam(t, `${source} Additional condition.`), undefined);
  }
  assert.ok(translated > 0);
});

test("agreement methods and provisos are translated only for the complete known source", () => {
  for (const source of [...Object.values(AGREEMENT_METHOD), AGREEMENT_NOTE, AGREEMENT_PARENTS_NOTE]) {
    assert.ok(agreementNoteMalayalam(source));
    assert.equal(agreementNoteMalayalam(`${source} A new condition.`), undefined);
  }
  const ml = agreementNoteMalayalam(AGREEMENT_NOTE)!;
  for (const qualifier of ["മൂന്നിൽ രണ്ടു", "താൽക്കാലികം", "പ്രായപൂർത്തിയാകാത്ത", "മിനിറ്റുകൾ"]) assert.ok(ml.includes(qualifier));
});
