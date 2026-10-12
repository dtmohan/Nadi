import { test } from "node:test";
import assert from "node:assert/strict";
import { redactProse, redactSensitive, sensitiveTags, withholdText } from "../shared/life-stage";
import { sarvarthaLeftOut } from "../shared/sarvartha";
import { PRASNA_DISEASE_REMEDIES, diseaseCauses } from "../shared/prasna-diseases";
import { YOGAS, gateYogas } from "../shared/yoga";

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

// Sexual matters are withheld for a minor by phrase; the same word used for gender, anatomy or a
// planet's class is not, nor is milder marriage wording.
test("sexual wording is tagged intimacy", () => {
  for (const t of [
    "Increase in desires for sexual acts with women",
    "Interest in unnatural sexual intercourse",
    "Intimacy with female servants and distant journeys.",
    "a strong sex instinct",
    "urge for sex",
    "overridden with sex",
    "sex",
    "adultery",
    "an adulterous, sinful wife",
    "a wife like a prostitute",
    "addiction to courtesans",
    "drawn to others' spouses",
    "coveting others' wives",
    "affairs with another woman",
    "association with many women",
    "the company of bad women",
    "casting glances at other women",
    "fond of carnal pleasures",
    "given to lust",
    "licentious and wicked",
    "a sensual, self-serving streak",
    "venereal diseases",
    "bed comforts with the spouse alone",
    "Venus semen",
  ])
    assert.ok(sensitiveTags(t).includes("intimacy"), t);
});

test("gender, anatomy and marriage wording stay", () => {
  for (const t of [
    "the count and sex of children",
    "co-born of both sexes",
    "Planet sex from 3.19",
    "charts of either sex",
    "Yoni (sex of the asterism)",
    "the sex organs",
    "in a eunuch navamsa, a eunuch",
    "loss of luster",
    "a lustrous body",
    "illustrious",
    "love affairs, courtship",
    "engaged in the affairs of the state",
    "passionate attraction",
    "many wives at a time",
    "a chaste wife",
    "relations with others",
    "control over passions",
    "Wholesome food, bed comfort and the gain of valuable things.",
  ])
    assert.equal(sensitiveTags(t).includes("intimacy"), false, t);
});

test("a list loses only its sexual items, and no dangling semicolon", () => {
  assert.equal(redactProse("honourable but sluggish, given to lust, financial ruin"), "honourable but sluggish, financial ruin");
  assert.equal(
    redactProse("rich, charming virtues, valorous, destroys fierce enemies, skilled in pleasures with courtesans, as written"),
    "rich, charming virtues, valorous, destroys fierce enemies, as written",
  );
  assert.equal(redactProse("in the lagna: lame with reddish eyes; elsewhere licentious and wicked, as written"), "in the lagna: lame with reddish eyes");
  assert.equal(
    redactProse("Marriage, sexual instincts, wife or husband, relations with others, beds and cots, the wife's birthplace, lost or hidden things, and sex relations."),
    "Marriage, wife or husband, relations with others, beds and cots, the wife's birthplace, lost or hidden things.",
  );
  assert.equal(redactProse("Increase in desires for sexual acts with women, eloquence, hunger, physical distress."), "");
});

test("Sarvartha: sexual rules are left out for a minor, kept in an adult's plain reading", () => {
  const sex = "Venus is in the 7th overridden with sex";
  assert.equal(sarvarthaLeftOut("sex", sex, true, false), false);
  assert.equal(sarvarthaLeftOut("sex", sex, false, true), true);
  assert.equal(sarvarthaLeftOut("adultery", "the 7th lord is with Rahu adultery", false, true), true);
  // The gentle topics are still left out of the plain reading.
  assert.equal(sarvarthaLeftOut("wife", "Venus is debilitated in the 7th the wife dies by drowning", true, false), true);
});

test("Prasna diseases: a minor's view drops whole sexual acts", () => {
  const row = (d: string) => PRASNA_DISEASE_REMEDIES.find((r) => r.disease === d)!;
  // "poisoning or wounding" is the gate's danger-to-life topic, withheld too.
  assert.equal(diseaseCauses(row("Colic"), true), "forbidden food, back-biting");
  assert.equal(diseaseCauses(row("Extreme thirst"), true), "");
  assert.equal(diseaseCauses(row("Prameha")), "intimacy with animals, virgins, the preceptor's wife or widows; hatred of teachers; stealing Brahmins' food");
  for (const r of PRASNA_DISEASE_REMEDIES)
    assert.equal(sensitiveTags(diseaseCauses(r, true)).includes("intimacy"), false, r.disease);
});

test("fired yogas: a minor's result loses its sexual items", () => {
  const y = YOGAS.find((x) => x.result.includes("adulterous"))!;
  const [g] = gateYogas([y], true);
  assert.equal(g.result, "protects cows, duels, skilled in work, a gambler");
  assert.equal(gateYogas([y], false)[0].result, y.result);
  assert.deepEqual(gateYogas([{ ...y, result: "adultery" }], true), []);
});

// The chapter-70 Saturn points and the transit hits made from them are headed by "matter": for a
// minor the longevity point is dropped whole, not left behind as an empty tag.
test("a withheld chapter-70 point is dropped from a minor's list, not shown as an empty tag", () => {
  const source = { label: "Parashara 70.7-42", url: "" };
  const out = redactSensitive({
    hits: [
      { matter: "father", kind: "trine", source },
      { matter: "longevity and death", kind: "sign", source },
      { matter: "mother, house and village", kind: "trine", source },
    ],
  });
  assert.deepEqual(
    out.hits.map((h) => h.matter),
    ["father", "mother, house and village"],
  );
});

