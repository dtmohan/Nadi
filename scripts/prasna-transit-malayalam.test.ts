import test from "node:test";
import assert from "node:assert/strict";
import { prasnaTransitModifierMalayalam } from "../shared/prasna-transit-malayalam";
import { PRASNA_TRANSIT_NOTES } from "../shared/rules-prasna";
import { translate } from "../shared/localization";

test("Prasna transit modifiers retain every planet, house and relief qualification", () => {
  const vedha = "Vedha: obstructed by Mars in house 8";
  assert.match(prasnaTransitModifierMalayalam("vedha", "Mars", 8, vedha)!, /8-ാം.*ചൊവ്വ.*തടസ്സ/);
  const vipareeta = "Vipareeta Vedha: possible relief from Saturn in house 3";
  assert.match(prasnaTransitModifierMalayalam("vipareeta", "Saturn", 3, vipareeta)!, /3-ാം.*ശനി.*ലഭിച്ചേക്കാം/);
  assert.equal(prasnaTransitModifierMalayalam("vedha", "Mars", 8, `${vedha}; extra condition`), undefined);
  assert.equal(prasnaTransitModifierMalayalam("vedha", "Mars", 0, "Vedha: obstructed by Mars in house 0"), undefined);
  assert.equal(prasnaTransitModifierMalayalam("vipareeta", "Mars", 8, vedha), undefined);
});

test("Prasna transit source notes have exact-source Malayalam and changed notes fall back", () => {
  assert.equal(PRASNA_TRANSIT_NOTES.length, 4);
  for (const source of PRASNA_TRANSIT_NOTES) {
    assert.match(translate("ml", source), /[\u0d00-\u0d7f]/);
    assert.equal(translate("ml", `${source} Another condition.`), `${source} Another condition.`);
  }
  assert.match(translate("ml", PRASNA_TRANSIT_NOTES[0]), /ജന്മചന്ദ്രനിൽനിന്നാണ്/);
  assert.match(translate("ml", PRASNA_TRANSIT_NOTES[1]), /സംഭവങ്ങളുടെ സ്കോറുകളല്ല/);
});
