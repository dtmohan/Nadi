import { test } from "node:test";
import assert from "node:assert/strict";
import { sensitiveTags, withholdText } from "../shared/life-stage";

// Sarvartha Chintamani's own wording for loss and bodily danger is withheld for a minor like the
// wording of the other texts; ordinary statements, and the serpent deities of Prasna Marga, are not.
test("sibling loss and Sarvartha's perils are gated", () => {
  assert.deepEqual(sensitiveTags("brothers: destruction of brothers"), ["sibling-loss"]);
  assert.ok(withholdText("loss of brothers even if the 3rd lord is exalted"));
  for (const t of [
    "serpent bite; with Mercury, throat disease",
    "bitten by a dog; Rahu in the 2nd with Gulika gives a serpent bite",
    "with Rahu or Ketu, snake bite",
    "head injury by stone or sword",
    "injured by stone",
    "falls in a well, river or tank",
    "colic; Rahu or Ketu so placed, trouble through a dead spirit",
    "epilepsy, and trouble from the souls of the dead and water",
    "in Rahu's sub-period, trouble from a serpent",
  ])
    assert.ok(withholdText(t), t);
});

test("ordinary statements stay", () => {
  for (const t of [
    "friendly to his brother; if an enemy, enmity",
    "happy to engage in battle",
    "the serpent deities are propitiated",
    "good bodily health",
    "much income",
  ])
    assert.equal(withholdText(t), false, t);
});
