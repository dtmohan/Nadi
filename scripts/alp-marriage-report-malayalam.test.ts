import test from "node:test";
import assert from "node:assert/strict";
import { alpMarriageParas } from "../shared/report/alp-marriage-context";
import { alpMarriageReportMalayalam } from "../shared/malayalam-alp-marriage-report";
import type { AlpMarriageContext } from "../shared/alp-marriage";

const c: AlpMarriageContext = {
  natal: { seventhSign: "Aries", lord: "Mars", lordSign: "Libra", lordHouse: 1, lordNavamsaSign: "Cancer", navamsaAscendant: "Leo", occupants: ["Moon", "Venus"], ownSign: false, exaltationSign: false, classicalSpouseHappinessClue: false, promise: "unresolved" },
  timing: { alpSeventhLord: "Saturn", janmaSeventhLord: "Mars", lordIdentity: false, lordsShareNatalSign: true, padaNavamsaTouches: true, dasa: "Mars", bhukti: "Saturn", natalSeventhInPeriod: true, alpSeventhInPeriod: true, natalSeventhD9Sign: "Cancer", alpSeventhD9Sign: "Libra", natalSeventhAtNatalD9Lagna: false, alpSeventhAtNatalD9Lagna: true, natalSeventhAtProgressedD9Lagna: true, alpSeventhAtProgressedD9Lagna: false, exactPeriodPair: true },
};

test("ALP marriage translations preserve every condition, date-independent limitation and source guard", () => {
  for (const v of [c, { ...c, natal: { ...c.natal, occupants: [], classicalSpouseHappinessClue: true }, timing: { ...c.timing, lordIdentity: true, lordsShareNatalSign: false, padaNavamsaTouches: false, exactPeriodPair: false, natalSeventhInPeriod: false, alpSeventhInPeriod: false } }]) {
    const paras = alpMarriageParas(v, () => 7);
    assert.equal(paras.length, 3);
    paras.forEach((p, i) => {
      assert.equal(p.provisional, true);
      assert.deepEqual(p.cites, [7]);
      assert.ok(p.translationMl?.text && /[\u0d00-\u0d7f]/.test(p.translationMl.text));
      assert.equal(alpMarriageReportMalayalam(v, i, `${p.text} New condition.`), undefined);
    });
    assert.match(paras[0].translationMl!.text, /പൂർണമായ ജനനജാതക വാഗ്ദാനമല്ല/);
    assert.match(paras[1].translationMl!.text, /സ്ഥാപിക്കുകയോ നിഷേധിക്കുകയോ ചെയ്യുന്നില്ല/);
    assert.match(paras[2].translationMl!.text, /സമഗ്ര പരിശോധനയല്ല/);
    assert.match(paras[1].translationMl!.text, v.timing.exactPeriodPair ? /കൃത്യമായി പൊരുത്തപ്പെടുന്നു/ : /കൃത്യമായി പൊരുത്തപ്പെടുന്നില്ല/);
  }
  assert.equal(alpMarriageReportMalayalam({ ...c, natal: { ...c.natal, seventhSign: "Unknown" } }, 0, alpMarriageParas(c)[0].text!), undefined);
});
