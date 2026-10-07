// Sarvartha Chintamani (Venkatesha), J.N. Bhasin translation, Sagar Publications.
//
// A Parashari-lineage bhava-phala text. Its method, stated in its own preface, is to name a house's
// significations first, then read each from the house, its lord, and its significator (karaka). The
// "Amsha" tiers of ch. 1.25-27 are the same ten-fold varga classification the app already computes
// under BPHS 6.42-53 (vargas.ts); only three of the names differ, so they are aliased here rather
// than recomputed. This module harvests the house significations (ch. 2-8) and karakas (ch. 17).
import type { Planet } from "./astro";

/** Ch. 1.25-27: the good-varga count earns a named amsha. Mirrors the app's BPHS varga designation. */
export const SC_AMSHA_TIERS: Array<{ good: number; name: string; bpbsName: string }> = [
  { good: 10, name: "Vaisheshika", bpbsName: "Sridhama" },
  { good: 9, name: "Airavata", bpbsName: "Sakravahana" },
  { good: 8, name: "Amar", bpbsName: "Brahmaloka" },
  { good: 7, name: "Devaloka", bpbsName: "Devaloka" },
  { good: 6, name: "Paravata", bpbsName: "Paravata" },
  { good: 5, name: "Simhasana", bpbsName: "Simhasana" },
  { good: 4, name: "Gopura", bpbsName: "Gopura" },
  { good: 3, name: "Uttama", bpbsName: "Uttama" },
  { good: 2, name: "Parijata", bpbsName: "Parijata" },
];

/** The Sarvartha Chintamani amsha name for a planet's good-varga count (ch. 1.25-27). */
export function scAmshaName(goodVargas: number): string | null {
  const tier = SC_AMSHA_TIERS.find((t) => goodVargas >= t.good);
  return tier ? tier.name : null;
}

export interface ScBhava {
  house: number;
  chapter: number;
  stanza: number;
  /** The significations the chapter opens with, in the author's words. */
  significations: string[];
  /** Primary significator (karaka) from ch. 17. */
  karaka: Planet;
  /** Secondary karakas, where the chapter notes more than one. */
  karakaNote?: string;
}

/** Ch. 2-8 significations and ch. 17 karakas for the twelve houses. */
export const SC_BHAVAS: ScBhava[] = [
  {
    house: 1,
    chapter: 2,
    stanza: 1,
    significations: ["self", "body", "health", "appearance", "character", "comfort of life", "fame"],
    karaka: "Sun",
    karakaNote: "for health and honour",
  },
  {
    house: 2,
    chapter: 3,
    stanza: 1,
    significations: ["those dependent on the native", "face", "mouth", "speech", "the right eye", "accumulated wealth", "education", "eating", "servants", "friends"],
    karaka: "Jupiter",
    karakaNote: "in financial matters",
  },
  {
    house: 3,
    chapter: 4,
    stanza: 1,
    significations: ["brothers", "valour", "medicine", "friends", "throat", "chest", "education", "right ear", "eatables", "planets"],
    karaka: "Mars",
    karakaNote: "for younger brothers",
  },
  {
    house: 4,
    chapter: 4,
    stanza: 54,
    significations: ["relatives (bandhu)", "residence", "mother", "water", "self-prospects", "eatables", "heart", "shoulders", "seat", "sleep", "comforts", "underground", "well"],
    karaka: "Moon",
    karakaNote: "for the mother; Mercury for relations, Saturn for land, Mars for built property, Venus for conveyances",
  },
  {
    house: 5,
    chapter: 5,
    stanza: 1,
    significations: ["son", "intelligence", "ministers", "mantra", "eating", "father", "heart", "belly", "power of discrimination"],
    karaka: "Jupiter",
    karakaNote: "for the son",
  },
  {
    house: 6,
    chapter: 5,
    stanza: 20,
    significations: ["enemies", "thieves", "injuries", "obstacles", "sorrow", "navel region (intestines, kidneys)", "venereal diseases"],
    karaka: "Saturn",
    karakaNote: "for disease; Mars for enemies, litigation and injuries",
  },
  {
    house: 7,
    chapter: 6,
    stanza: 1,
    significations: ["marriage", "wife", "husband", "pulses", "curd", "gur", "milk", "coming and going", "urge for sex", "urinal place", "lost wealth"],
    karaka: "Venus",
    karakaNote: "for the wife",
  },
  {
    house: 8,
    chapter: 7,
    stanza: 1,
    significations: ["longevity", "death", "rectum", "mode of death", "enjoyment of food", "service", "being bitten", "defeat"],
    karaka: "Saturn",
    karakaNote: "for longevity",
  },
  {
    house: 9,
    chapter: 7,
    stanza: 1,
    significations: ["guru", "prospects in life", "father", "grandsons", "compassion", "tapas", "income", "hips", "mind", "family members", "charity", "yoga", "boss", "uncles"],
    karaka: "Sun",
    karakaNote: "for the father; Jupiter for the guru and governmental favour",
  },
  {
    house: 10,
    chapter: 8,
    stanza: 1,
    significations: ["actions", "ruling powers", "fame", "rain", "living away", "acts of public utility", "honour", "profession", "knees", "servants"],
    karaka: "Sun",
    karakaNote: "for ruling power; Jupiter and Mercury for acts of charity",
  },
  {
    house: 11,
    chapter: 8,
    stanza: 1,
    significations: ["income", "feet", "left ear", "hair", "bending in the shoulders", "elder co-borns"],
    karaka: "Jupiter",
    karakaNote: "for the elder brother and for finances",
  },
  {
    house: 12,
    chapter: 8,
    stanza: 1,
    significations: ["expenses", "fall into hell", "loss of a limb", "left eye", "feet", "sleeping place"],
    karaka: "Saturn",
    karakaNote: "as the separator",
  },
];

/** The preface's own statement of the method: read each signification from the house, its lord and its karaka. */
export const SC_METHOD_NOTE =
  "Sarvartha Chintamani's method (its preface): each house's significations are stated first, then read from the house, its lord and its significator (karaka), with the Amsha divisions (ch. 1.25-27) grading strength.";

export interface ScRule {
  stanza: number;
  topic: string;
  when: string;
  then: string;
}

export interface ScHouseRules {
  house: number;
  chapter: number;
  rules: ScRule[];
}

/**
 * Ch. 2-8 bhava phala rules, harvested from the Bhasin translation. The condition ("when") is the
 * author's own; each rule cites its shloka. Rules whose OCR wording was unclear are omitted rather
 * than paraphrased loosely.
 */
export const SC_BHAVA_RULES: ScHouseRules[] = [
  {
    house: 1,
    chapter: 2,
    rules: [
      { stanza: 69, topic: "health", when: "the lagna lord is in its own navamsa, or with or aspected by a benefic", then: "good bodily health" },
      { stanza: 72, topic: "affluence", when: "the lagna lord is very strong, in a benefic varga, exalted, with a friend, in its own navamsa, with a benefic, or with a kendra lord", then: "best affluence, fame, wealth, grains and prosperity" },
      { stanza: 73, topic: "health", when: "the lagna lord is with a malefic, or in the 8th house", then: "harm to health; if well aspected, good health" },
      { stanza: 74, topic: "health", when: "the lagna lord is with the lord of the 6th, 8th or 12th, or a bad-house lord is in the lagna", then: "bodily suffering; none if the lagna lord is weak but in a kendra or trine" },
      { stanza: 75, topic: "health", when: "the dispositor of the lagna lord is in the 6th, 8th or 12th", then: "a weak body" },
      { stanza: 76, topic: "deceit", when: "many malefics occupy the lagna and Gulika is in a trine, or Rahu and Gulika are in the lagna, or the lagna lord is with a malefic and Rahu is in the lagna", then: "prone to be cheated, to thieves and to government officials" },
      { stanza: 80, topic: "injury", when: "Mars is lagna lord in the lagna, afflicted by malefics", then: "head injury by stone or sword" },
      { stanza: 81, topic: "injury", when: "Rahu is in the lagna with Mars", then: "enlarged scrotum" },
      { stanza: 82, topic: "physique", when: "the lagna sign rises in one hour", then: "small head; a sign rising two hours or more gives a large head" },
      { stanza: 85, topic: "physique", when: "a watery sign or planet rules the body", then: "a bulky body" },
      { stanza: 86, topic: "physique", when: "the lagna lord is in a watery sign with a benefic, aspected by a watery planet", then: "a bulky body" },
      { stanza: 87, topic: "physique", when: "a benefic is in the lagna under benefic aspect, or a watery lagna is aspected by Jupiter in a watery sign", then: "a fat body" },
      { stanza: 89, topic: "health", when: "the Sun in the lagna is aspected by Mars", then: "breathing trouble, consumption, spleen trouble" },
      { stanza: 90, topic: "movement", when: "the lagna is a movable sign, or the lagna lord is in a movable sign", then: "mostly on the move" },
      { stanza: 91, topic: "movement", when: "the lagna is fixed with slow planets", then: "stays in his own country, wealthy and lucky; a movable lagna with a fast lord aspected by a fast planet gives foreign lands" },
      { stanza: 92, topic: "movement", when: "the lagna is under both movable and slow planets", then: "luck and fame through bad means by moving to different territories" },
      { stanza: 93, topic: "gait", when: "the lagna lord is strong and exalted", then: "a sober, influential gait; if weak, a fool" },
      { stanza: 94, topic: "trouble", when: "many malefics occupy the lagna", then: "troubles throughout life" },
      { stanza: 97, topic: "comfort", when: "the lagna lord is vargottam or in the navamsa of its exaltation sign, in a friendly decanate, or with/aspect of a benefic", then: "comforts in early and middle life" },
      { stanza: 98, topic: "happiness", when: "Jupiter is in a kendra and the strong lagna lord occupies Paravatamsha", then: "happy with wife, sons, friends and wealth" },
      { stanza: 104, topic: "fame", when: "the lagna lord and the 9th lord are strong and each with a benefic", then: "much fame in life" },
      { stanza: 105, topic: "comfort", when: "Venus is in the lagna", then: "happy in the first half of life; malefics in the 4th and 5th give troubles in the latter half" },
      { stanza: 111, topic: "renunciation", when: "all planets are in kendra or trine, or the 2nd house is in Jupiter's navamsa", then: "takes to sanyas from childhood and lives to the end of a yuga" },
      { stanza: 114, topic: "comfort", when: "the dispositor of the lagna lord's navamsa is in the 2nd house", then: "comforts of life after the age of twenty" },
      { stanza: 115, topic: "comfort", when: "that dispositor is in a kendra, trine or exaltation", then: "comforts after the age of thirty" },
      { stanza: 116, topic: "wealth", when: "the lagna lord is in a benefic sign under benefic aspect, or in Gopuramsha", then: "starts getting wealth from the age of sixteen" },
    ],
  },
  {
    house: 2,
    chapter: 3,
    rules: [
      { stanza: 2, topic: "bones", when: "the lords of the 1st and 2nd are in the 6th, 8th or 12th", then: "bones are broken; the 2nd lord with Venus and the Moon in the lagna gives night-blindness, unless with a benefic or exalted" },
      { stanza: 3, topic: "sight", when: "the 2nd lord, Sun and Venus with the lagna lord are in the 6th, 8th or 12th", then: "born blind" },
      { stanza: 10, topic: "eyes", when: "the 2nd lord is with or aspected by the Sun and Mars", then: "redness in the corners of the eyes" },
      { stanza: 12, topic: "support", when: "the 2nd lord is a natural benefic in kendra, exaltation, a friendly sign, or a benefic's sign", then: "protects and rears his family and many others, with very nice speech" },
      { stanza: 15, topic: "support", when: "the 2nd lord is a natural malefic, exalted but with/aspect of malefics, and the lagna lord is weak with malefics", then: "no one to help him in his living" },
      { stanza: 17, topic: "power", when: "the 2nd lord is in the 3rd, aspected by male planets, in a friendly sign or exaltation", then: "the ruler of all men" },
      { stanza: 18, topic: "support", when: "the 2nd lord is in Gopuramsha and its navamsa dispositor is a benefic or in Simhasanamsha", then: "protects fifty people through his wealth" },
      { stanza: 21, topic: "support", when: "the 2nd lord is with benefics and the Moon in the 2nd is in Paravatamsha", then: "supports twenty people" },
      { stanza: 22, topic: "support", when: "the 2nd lord is in Simhasanamsha or Paravatamsha, aspected by Jupiter", then: "rules over three hundred people" },
      { stanza: 23, topic: "support", when: "the 2nd lord is in its highest exaltation, well aspected by Jupiter", then: "rules over a thousand people by prowess" },
      { stanza: 24, topic: "support", when: "the 2nd lord is in Airavatamsha", then: "protects innumerable people" },
      { stanza: 25, topic: "looks", when: "the 2nd lord is in a kendra, aspected by a benefic, or a benefic occupies the 2nd", then: "good looking" },
      { stanza: 27, topic: "looks", when: "the 2nd contains malefics and its lord is with malefics, debilitated or aspected by malefics", then: "a very bad-looking face" },
      { stanza: 29, topic: "speech", when: "the 2nd lord is with a benefic in kendra or trine, exalted and well aspected, with a male planet", then: "a great speaker with logical speech" },
      { stanza: 31, topic: "speech", when: "the 2nd lord is in kendra in Paravatamsha at its highest exaltation, with Jupiter or Venus in Simhasanamsha with Mercury in its own sign and navamsa", then: "a great speaker" },
      { stanza: 34, topic: "speech", when: "the 2nd lord is with a malefic in the 10th, debilitated, with the Sun and Mandi, and the 2nd is afflicted", then: "unable to speak in any assembly" },
      { stanza: 36, topic: "mathematics", when: "Mars is in the 2nd with the Moon, aspected by Mercury, or Mercury is in a kendra", then: "understands mathematics" },
      { stanza: 37, topic: "mathematics", when: "Mercury is 2nd lord exalted, Jupiter in the lagna and Saturn in the 8th", then: "a mathematician" },
      { stanza: 39, topic: "astrology", when: "the 2nd lord is the Sun or Mars, aspected by Jupiter and Venus, and Mercury is in Paravatamsha", then: "knows the rationale of astrology" },
      { stanza: 40, topic: "logic", when: "the 2nd lord is Jupiter or Venus, aspected by the Sun and Mars, in moolatrikona or exaltation", then: "foremost among knowers of the science of logic" },
      { stanza: 41, topic: "grammar", when: "Jupiter as 2nd lord is strong under aspect of the Sun and Venus", then: "a grammarian" },
      { stanza: 42, topic: "vedanta", when: "Mercury is 2nd lord exalted, Saturn in Gopuramsha and Jupiter in Simhasanamsha", then: "knows Vedanta shastra" },
      { stanza: 50, topic: "wealth", when: "natural benefics are in the 1st, 2nd and 7th, exalted or friendly or in benefic navamsa, in Vaisheshika, aspected by the 2nd lord's navamsa dispositor", then: "much wealth in childhood" },
      { stanza: 51, topic: "wealth", when: "the 11th lord is with the 2nd lord and both are aspected by the 10th lord's navamsa dispositor, the 11th lord exalted in Vaisheshika", then: "very rich" },
      { stanza: 53, topic: "wealth", when: "the 2nd lord is in kendra or trine, in Vaisheshika, with or aspected by benefics", then: "much income" },
      { stanza: 54, topic: "wealth", when: "the lagna lord is in the 2nd, the 2nd lord in the 11th and the 11th lord in the lagna", then: "very rich with a big bank balance" },
      { stanza: 72, topic: "wealth", when: "the lagna lord is weak in the 12th with a malefic, and the 2nd lord is with the Sun or debilitated under malefic aspect", then: "loses wealth at the hands of the government" },
      { stanza: 73, topic: "wealth", when: "the 12th lord is in the 2nd, the 11th lord in the 12th, and the 2nd lord in the 6th, 8th or 12th or debilitated", then: "loses wealth by punishment from government" },
      { stanza: 77, topic: "wealth", when: "the 2nd and 11th lords are in cruel divisions, weak, with malefics and the lords of bad houses", then: "loss at the hands of thieves, fire or the government" },
      { stanza: 88, topic: "wealth", when: "the lagna lord is in Vaisheshikamsha and the 2nd lord in malefic shashtiamsha, both in kendra", then: "born rich" },
      { stanza: 92, topic: "wealth", when: "the lagna lord is in the 2nd, the 11th lord in the 10th, aspected by the 11th lord or Jupiter", then: "earns a thousand" },
      { stanza: 109, topic: "debt", when: "a malefic is in the 2nd and the lagna lord is in the 12th", then: "involved in debts" },
      { stanza: 121, topic: "utensils", when: "the 2nd lord is in kendra with Venus and the Moon", then: "silver utensils" },
      { stanza: 122, topic: "utensils", when: "Mercury with Jupiter is in kendra, or the 2nd lord is in kendra or trine in Vaisheshikamsha", then: "golden utensils" },
      { stanza: 126, topic: "utensils", when: "the 2nd lord is strong in kendra in Vaisheshikamsha with strong Venus, Jupiter or Mercury", then: "a variety of eating utensils" },
      { stanza: 131, topic: "eating", when: "the 2nd lord is in a malefic amsha under malefic aspect", then: "a ferocious eater" },
      { stanza: 134, topic: "eating", when: "the 2nd lord is in exaltation or moolatrikona, strong and well aspected, with the Moon in Vaisheshikamsha", then: "enjoys food in comfort" },
      { stanza: 146, topic: "face", when: "the 2nd lord is in the 1st, 7th, 8th or 2nd with the Sun, aspected by Mars or Saturn", then: "wounds on the face or suffering through fire there" },
      { stanza: 148, topic: "blood", when: "Mars occupies the 1st, 12th, 6th or 7th with Mandi, aspected by the Sun, debilitated and in an inimical sign", then: "troubles of the blood" },
      { stanza: 149, topic: "bites", when: "Saturn is in the 2nd with a malefic", then: "bitten by a dog; Rahu in the 2nd with Gulika gives a serpent bite" },
      { stanza: 151, topic: "speech", when: "Mercury is in the 2nd weak under malefic aspect", then: "defective speech, stammering" },
    ],
  },
];
