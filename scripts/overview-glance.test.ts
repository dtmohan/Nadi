import test from "node:test";
import assert from "node:assert/strict";
import { glanceSentence } from "../client/src/lib/overview-glance";
import type { AreaSynthesis, AreaTone } from "../shared/synthesis";
import type { LifeArea } from "../shared/rules";

const area = (name: LifeArea, tone: AreaTone): AreaSynthesis => ({
  area: name, tone, headline: "", key: [], rest: [], coveredBy: {}, balance: 0, total: 0,
});

test("overview uses a single plain qualifier for singular and plural care areas", () => {
  const singular = glanceSentence([area("career", "supportive"), area("health", "care")]);
  assert.equal(singular, "In the Nadi reading, career shows supportive indications; health has indications that may need care.");
  const plural = glanceSentence([area("career", "care"), area("health", "care")]);
  assert.equal(plural, "In the Nadi reading, career and health have indications that may need care.");
  assert.doesNotMatch(singular + plural, /indications that may have indications/);
});

test("overview preserves the source synthesis's supportive, mixed and disputed areas", () => {
  assert.equal(
    glanceSentence([area("career", "supportive"), area("health", "contested"), area("travel", "mixed")]),
    "In the Nadi reading, career shows supportive indications; health has differing indications; other marked areas are mixed.",
  );
  assert.equal(glanceSentence([]), "The selected Nadi rules do not give a clear direction for these topics.");
});
