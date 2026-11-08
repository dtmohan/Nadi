import test from "node:test";
import assert from "node:assert/strict";
import { kpCatalogueParas } from "../shared/report/kp-catalogue-evidence";
import { kpCatalogueFindingMalayalam, kpCatalogueSummaryMalayalam, kpCatalogueTraceMalayalam } from "../shared/malayalam-kp-catalogue-report";
import { KP_TENTH_SNAPSHOT } from "../shared/malayalam-kp-tenth-snapshot";
import type { KpEventNatalRules, KpCuspTrace, KpRegisteredNatalRule } from "../shared/kp-event-natal-rules";

const trace: KpCuspTrace = { cusp: 10, cuspSignLord: "Mars", cuspStarLord: "Moon", subLord: "Rahu", subLordHouse: 3, subLordOwns: [], subLordStarLord: "Ketu", starLordHouse: 9, starLordOwns: [], starLordAgency: ["Jupiter"], levels: { A: [2], B: [3], C: [10], D: [11] }, agency: ["Saturn"], matterHouses: [2, 6, 10, 11], matchingHouses: [2, 10, 11] };
const rule: KpRegisteredNatalRule = { id: "kp10-buy-house", role: "promise", matched: true, source: "Book, page 5", finding: { ruleId: "kp10-buy-house", cusp: 10, subLord: "Venus", inHouse: 4, used: [4, 6, 9, 12], facts: [], text: KP_TENTH_SNAPSHOT["kp10-buy-house"], topic: "Home", polarity: "good", source: "Book, page 5", evidence: "Venus is the sub lord of cusp 10; signifies 4, 6, 9, 12; posited in the 4th", standing: "note", decidedBy: "kp10-no-house" } };
const data: KpEventNatalRules = { matter: "property", convention: "four-step", status: "assessed", rules: [rule, { id: "kp10-no-house", role: "promise", matched: false, source: "Book, page 5" }], cuspTrace: trace, indication: { status: "unresolved", supports: [], strains: [] } };

test("KP catalogue report retains summary, four-step trace, evidence, precedence and citation", () => {
  for (const cited of [false, true]) {
    const paras = kpCatalogueParas(data, "Bought a house or land", cited ? () => 7 : undefined);
    assert.equal(paras.length, 3);
    paras.forEach((p) => assert.equal(p.translationMl?.source, p.text));
    const [summary, chain, finding] = paras.map((p) => p.translationMl!.text);
    for (const token of ["kp10-buy-house", "kp10-no-house", "പൊരുത്തപ്പെട്ടു", "പൊരുത്തപ്പെട്ടില്ല", "നിഷേധിക്കുന്നു എന്നല്ല", "സ്കോറിൽ ചേർക്കുന്നില്ല"]) assert.ok(summary.includes(token), token);
    for (const token of ["A 2", "B 3", "C 10", "D 11", "രാഹു", "കേതു", "ശനി", "വ്യാഴം"]) assert.ok(chain.includes(token), token);
    for (const token of ["kp10-buy-house", "4, 6, 9, 12", "kp10-no-house", "മാറ്റിവച്ചു"]) assert.ok(finding.includes(token), token);
    assert.equal(finding.includes("Book, page 5"), !cited);
    if (cited) assert.deepEqual(paras[2].cites, [7]);
    assert.equal(kpCatalogueSummaryMalayalam(data, "Bought a house or land", `${paras[0].text} changed`), undefined);
    assert.equal(kpCatalogueTraceMalayalam(data, `${paras[1].text} changed`, cited), undefined);
    assert.equal(kpCatalogueFindingMalayalam(rule, `${paras[2].text} changed`, cited), undefined);
    assert.equal(kpCatalogueFindingMalayalam({ ...rule, finding: { ...rule.finding!, facts: ["unknown fact"] } }, paras[2].text!, cited), undefined);
  }
});

test("unavailable and withheld states do not invent evidence; health caveat survives", () => {
  for (const status of ["custom-event", "withheld", "unmapped"] as const) {
    const paras = kpCatalogueParas({ ...data, status, rules: [] }, "Marriage");
    assert.equal(paras.length, 1);
    assert.equal(paras[0].translationMl?.source, paras[0].text);
  }
  const health = kpCatalogueParas({ ...data, matter: "accident" }, "Accident");
  assert.ok(health[1].translationMl?.text.includes("രോഗനിർണയം"));
});

test("plain softened text never uses a translation of stronger source", () => {
  const [p] = kpCatalogueParas(data, "death of mother", undefined, true);
  assert.ok(p.text?.startsWith("loss of mother:"));
  assert.ok(p.translationMl?.source.startsWith("death of mother:"));
  // Report rendering only accepts translationMl when its source equals the final text.
  assert.notEqual(p.translationMl?.source, p.text);
});
