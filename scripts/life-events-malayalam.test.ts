import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_MATTERS } from "../shared/events";
import { translate } from "../shared/localization";

test("every event matter has a Malayalam label without changing its stored identifier", () => {
  for (const matter of EVENT_MATTERS) {
    const label = translate("ml", matter.label);
    assert.notEqual(label, matter.label, matter.id);
    assert.match(label, /[\u0d00-\u0d7f]/, matter.id);
    assert.equal(translate("en", matter.label), matter.label);
  }
  for (const outcome of ["Favourable", "Unfavourable", "Mixed"]) assert.notEqual(translate("ml", outcome), outcome);
});
