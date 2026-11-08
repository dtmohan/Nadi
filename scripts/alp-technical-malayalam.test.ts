import test from "node:test";
import assert from "node:assert/strict";
import type { AlpHouse } from "../shared/alp";
import { alpHouseDetailMalayalam } from "../shared/alp-technical-malayalam";

test("ALP house detail keeps ruler, occupants and both reference frames", () => {
  const h: AlpHouse = { house: 1, signIndex: 0, sign: "Aries", lord: "Mars", planets: ["Venus", "Saturn"], houseFromJanma: 4 };
  const lordHouse: AlpHouse = { ...h, house: 10 };
  const source = "The 1st from the moving point covers self and how life is handled. Mars rules this sign and is in the 10th from the moving point (job, business and profession). Venus and Saturn occupy this sign. The same sign is the 4th from the birth rising sign.";
  const ml = alpHouseDetailMalayalam(h, lordHouse, source)!;
  for (const word of ["1-ാം", "10-ാം", "4-ാം", "ചൊവ്വ", "ശുക്രൻ", "ശനി"]) assert.ok(ml.includes(word), word);
  assert.equal(alpHouseDetailMalayalam(h, lordHouse, `${source} Another condition.`), undefined);
  assert.equal(alpHouseDetailMalayalam({ ...h, houseFromJanma: 13 }, lordHouse, source), undefined);
});

test("ALP house detail preserves empty sign and unknown ruler placement", () => {
  const h: AlpHouse = { house: 2, signIndex: 1, sign: "Taurus", lord: "Venus", planets: [], houseFromJanma: 5 };
  const source = "The 2nd from the moving point covers income, education, family and speech. Venus rules this sign. No planet occupies this sign. The same sign is the 5th from the birth rising sign.";
  const ml = alpHouseDetailMalayalam(h, undefined, source)!;
  assert.match(ml, /ഗ്രഹങ്ങളില്ല/);
  assert.match(ml, /5-ാം/);
});
