import test from "node:test";
import assert from "node:assert/strict";
import { SIGNS } from "../shared/astro";
import { LAGNA_NATURE } from "../shared/parashari-data";
import { soften } from "../shared/gentle";
import { list } from "../shared/report/types";
import { parashariLagnaNatureMalayalam } from "../shared/malayalam-parashari-lagna-nature";

const source = (i: number, plain: boolean) => {
  const n = LAGNA_NATURE[i];
  return `Parashara reads from the rising sign. With ${SIGNS[i]} rising, ${list(n.auspicious)} ${n.auspicious.length === 1 ? "is" : "are"} auspicious and ${list(n.malefic)} ${n.malefic.length === 1 ? "is" : "are"} not${n.yogakaraka.length ? `; ${list(n.yogakaraka)} can give yoga alone, owning an angle and a trine` : ""}${n.yogaPair ? `; ${n.yogaPair[0]} and ${n.yogaPair[1]} give the raja yoga only as a pair, the verse naming the two in the dual` : ""}. ${plain ? soften(n.note) : n.note}`;
};

test("Libra and Scorpio retain distinct single-planet and pair-only rules in each register", () => {
  for (const index of [6, 7]) for (const plain of [true, false]) {
    const en = source(index, plain), ml = parashariLagnaNatureMalayalam(index, en, plain)!;
    assert.ok(ml);
    assert.match(ml, /ഒരുമിച്ചു മാത്രമേ|ജോഡിയിൽനിന്നു മാത്രമാണ്/);
    assert.ok(ml.includes(index === 6 ? "ഒറ്റഗ്രഹ യോഗകാരകനാണ്" : "ഒറ്റഗ്രഹ യോഗകാരകനില്ല"));
    assert.match(ml, plain ? /മാരക/ : /കൊല്ല/);
    assert.equal(parashariLagnaNatureMalayalam(index, en + " Additional qualification.", plain), undefined);
    assert.equal(parashariLagnaNatureMalayalam(index, en.replace("only as a pair", "alone"), plain), undefined);
  }
});

test("all twelve lagna notes translate only for the complete source", () => {
  for (const index of Array.from({ length: 12 }, (_, i) => i)) for (const plain of [true, false]) {
    const en = source(index, plain);
    const ml = parashariLagnaNatureMalayalam(index, en, plain);
    assert.ok(ml, `${SIGNS[index]}, plain ${plain}`);
    assert.equal(parashariLagnaNatureMalayalam(index, en + " Changed.", plain), undefined);
    if ([0, 2, 5, 6, 7, 8, 9, 11].includes(index)) {
      assert.match(ml, plain ? /മാരക/ : /കൊല്ല|മരണകാരക/);
      assert.equal(parashariLagnaNatureMalayalam(index, source(index, !plain), plain), undefined);
    }
  }
  assert.equal(parashariLagnaNatureMalayalam(12, "unknown", false), undefined);
});
