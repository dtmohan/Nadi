import test from "node:test";
import assert from "node:assert/strict";
import { KP_RULES, kpFindingPlain } from "../shared/rules-kp";
import { translate } from "../shared/localization";
import { soften } from "../shared/gentle";
import { KP_TENTH_SNAPSHOT } from "../shared/malayalam-kp-tenth-snapshot";
import { KP_ELEVENTH_SNAPSHOT } from "../shared/malayalam-kp-eleventh-snapshot";
import { KP_EIGHTH_SNAPSHOT } from "../shared/malayalam-kp-eighth-snapshot";
import { KP_TWELFTH_SNAPSHOT } from "../shared/malayalam-kp-twelfth-snapshot";

test("KP tenth-cusp translations retain complete source snapshots and fallback on edits", () => {
  const rules = KP_RULES.filter((r) => r.cusp === 10);
  assert.equal(rules.length, 57);
  for (const rule of rules) {
    assert.equal(KP_TENTH_SNAPSHOT[rule.id], rule.text, rule.id);
    const plain = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text }));
    for (const text of [rule.text, plain]) {
      assert.match(translate("ml", text), /[\u0d00-\u0d7f]/, rule.id);
      assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
    }
  }
  const reinstatement = KP_RULES.find((r) => r.id === "kp10-reinstatement-denied")!;
  assert.match(translate("ml", reinstatement.text), /തൊഴിൽജീവിതത്തെ നിഷേധിക്കുന്നില്ല/);
  const industry = KP_RULES.find((r) => r.id === "kp10-industrialist")!;
  assert.match(translate("ml", industry.text), /സ്വന്തം സഹാധിപനും അതേ ഭാവങ്ങൾ/);
});

test("all entered KP rules have source-guarded plain and practitioner translations", () => {
  assert.equal(KP_RULES.length, 463);
  for (const rule of KP_RULES) {
    if (rule.cusp === 8) assert.equal(KP_EIGHTH_SNAPSHOT[rule.id], rule.text, rule.id);
    if (rule.cusp === 12) assert.equal(KP_TWELFTH_SNAPSHOT[rule.id], rule.text, rule.id);
    const plain = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text }));
    for (const text of [rule.text, plain]) {
      assert.match(translate("ml", text), /[\u0d00-\u0d7f]/, rule.id);
      assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
    }
  }
  const confinement = KP_RULES.find((r) => r.id === "kp12-confinement")!;
  const plain = soften(kpFindingPlain({ ruleId: confinement.id, text: confinement.text }));
  assert.match(translate("ml", plain), /സഞ്ചാരനിയന്ത്രണ/);
  assert.doesNotMatch(translate("ml", plain), /തടങ്കൽ/);
  const harm = KP_RULES.find((r) => r.id === "kp12-self-harm")!;
  const safe = soften(kpFindingPlain({ ruleId: harm.id, text: harm.text }));
  assert.match(translate("ml", safe), /മാനസിക/);
  assert.doesNotMatch(translate("ml", safe), /സ്വയംനാശ/);
});

test("KP eleventh-cusp translations retain conditions in both registers and reject edits", () => {
  const rules = KP_RULES.filter((r) => r.cusp === 11);
  assert.equal(rules.length, 40);
  for (const rule of rules) {
    assert.equal(KP_ELEVENTH_SNAPSHOT[rule.id], rule.text, rule.id);
    const plain = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text }));
    for (const text of [rule.text, plain]) {
      assert.match(translate("ml", text), /[\u0d00-\u0d7f]/, rule.id);
      assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
    }
  }
  const marital = KP_RULES.find((r) => r.id === "kp11-marital")!;
  assert.match(translate("ml", marital.text), /താൽക്കാലിക/);
  const movable = KP_RULES.find((r) => r.id === "kp11-badhaka-movable")!;
  assert.match(translate("ml", movable.text), /വിദേശയാത്രയ്ക്കോ ഗവേഷണത്തിനോ/);
});
