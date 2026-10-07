// Sarvartha Chintamani (Venkatesha), J.N. Bhasin translation, Sagar Publications.
//
// A Parashari-lineage bhava-phala text. Its method, stated in its own preface, is to name a house's
// significations first, then read each from the house, its lord, and its significator (karaka). The
// "Amsha" tiers of ch. 1.25-27 are the same ten-fold varga classification the app already computes
// under BPHS 6.42-53 (vargas.ts); only three of the names differ, so they are aliased here rather
// than recomputed. This module harvests the house significations (ch. 2-8) and karakas (ch. 17).
import { SIGN_LORD, houseFrom, type Dignity, type Planet, type PlanetPosition } from "./astro";
import { naturalBenefic, drishtiQuarters } from "./parashari";
import type { VargasResult } from "./vargas";

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
    stanza: 1,
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
  {
    house: 3,
    chapter: 4,
    rules: [
      { stanza: 2, topic: "brothers", when: "the 3rd lord and Mars are in the 8th, aspected by malefics", then: "loss of younger brothers" },
      { stanza: 4, topic: "brothers", when: "a malefic occupies the 3rd, or the 3rd is aspected by malefics with the 3rd lord between malefics", then: "destruction of brothers" },
      { stanza: 8, topic: "brothers", when: "the 3rd lord is between malefics and Mars is likewise", then: "destruction of brothers" },
      { stanza: 11, topic: "brothers", when: "the 3rd lord and Mars are in the 6th, 8th or 12th with malefics", then: "loss of brothers even if the 3rd lord is exalted" },
      { stanza: 15, topic: "brothers", when: "benefics occupy the 3rd under benefic aspect and the 3rd lord is strong", then: "acquisition of brothers" },
      { stanza: 16, topic: "brothers", when: "the 3rd lord and Mars are with benefics, aspected by them, and the 3rd is full of strength", then: "the rise of brothers" },
      { stanza: 17, topic: "brothers", when: "the 3rd lord and Mars are in kendra or trine, exalted, in a friendly or own sign", then: "acquisition of brothers" },
      { stanza: 18, topic: "brothers", when: "the 3rd lord and Mars are with benefics in benefic navamsa", then: "prosperity of brothers" },
      { stanza: 19, topic: "brothers", when: "the 3rd lord is in Gopuramsha, Mars in Simhasanamsha, and the 3rd lord is a benefic", then: "acquisition of brothers" },
      { stanza: 21, topic: "brothers", when: "the 3rd lord is in the 3rd, exalted or moolatrikona, in strength", then: "acquisition of brothers" },
      { stanza: 24, topic: "brothers", when: "the lagna lord is a friend of the 3rd lord", then: "friendly to his brother; if an enemy, enmity" },
      { stanza: 25, topic: "brothers", when: "the 3rd lord and Mars are in an odd navamsa, aspected by Jupiter, the Sun or Mars in the 3rd", then: "male co-borns" },
      { stanza: 26, topic: "brothers", when: "the 3rd, its lord and Mars are in an even sign or navamsa", then: "sisters; in Saturn's or Mercury's navamsa, a eunuch" },
      { stanza: 31, topic: "valour", when: "the 3rd lord is exalted, strong, in kendra or trine, aspected by benefics, in own moolatrikona, friendly sign or Vaisheshikamsha", then: "patient, brave and learned" },
      { stanza: 32, topic: "valour", when: "the 3rd lord is in a benefic navamsa with a benefic, or Mars is in a benefic's sign", then: "brave" },
      { stanza: 33, topic: "valour", when: "the navamsa dispositor of the 3rd lord is in good vargas", then: "brave, expert in battle and quarrels" },
      { stanza: 36, topic: "valour", when: "the 3rd lord is debilitated or in malefic shashtiamsha, with malefics under malefic aspect", then: "inefficient in battle" },
      { stanza: 37, topic: "valour", when: "the 3rd lord is exalted in the 8th while Mars is weak in malefic shashtiamsha", then: "defeated in battle" },
      { stanza: 38, topic: "valour", when: "the 3rd lord is in Simhasana, Paravata, Gopura or Mridu amsha with benefic aspect", then: "happy to engage in battle" },
      { stanza: 39, topic: "valour", when: "the 3rd lord is with a benefic, exalted, in Vaisheshika amsha or Mridu amsha in strength", then: "a willing soldier adept in battle" },
      { stanza: 40, topic: "valour", when: "the 3rd lord is with the Sun", then: "brave; with the Moon, mental patience; with Mars, dark, foolish and wrathful; with Mercury, satvic intellect" },
      { stanza: 41, topic: "valour", when: "the 3rd lord is with Jupiter", then: "brave and efficient in the shastras; with Venus, given to sex and enraged" },
      { stanza: 42, topic: "valour", when: "the 3rd lord is with Saturn", then: "a fool; with Rahu, brave only outwardly; with Ketu or Mandi, the same" },
      { stanza: 43, topic: "danger", when: "Jupiter is in the lagna with the 3rd lord", then: "danger from animals; a watery 3rd lord in the lagna gives danger from cows and water" },
      { stanza: 44, topic: "danger", when: "the 3rd lord is with Rahu in the lagna", then: "serpent bite; with Mercury, throat disease; a malefic (Mandi) in the 3rd gives throat trouble" },
      { stanza: 45, topic: "danger", when: "a planet in the 3rd is debilitated, in an inimical sign, eclipsed and aspected by malefics", then: "danger from poison" },
      { stanza: 46, topic: "food", when: "the Moon or Venus is in the 3rd in strength, with benefics and benefic aspect, in exaltation, own or friendly varga", then: "takes food in valuable utensils, in comfort" },
      { stanza: 47, topic: "ears", when: "Mars is in the 3rd in Yama amsha", then: "ear disease" },
      { stanza: 48, topic: "ears", when: "Saturn is in the 3rd with Mandi, without benefic influence", then: "nervous trouble in the ear" },
      { stanza: 49, topic: "ears", when: "a malefic is in the 3rd under malefic aspect, or the 3rd lord is in malefic shashtiamsha", then: "trouble in the ear" },
      { stanza: 50, topic: "ears", when: "a benefic is in the 3rd, aspected by a benefic, and the 3rd lord is with benefics", then: "the ears have ornaments" },
      { stanza: 53, topic: "hearing", when: "a benefic sign is in the 3rd", then: "hears religious sermons; a malefic sign gives undesirable hearing" },
    ],
  },
  {
    house: 4,
    chapter: 4,
    rules: [
      { stanza: 55, topic: "house", when: "the 4th lord is strong in kendra, aspected by benefics", then: "acquires a house without effort" },
      { stanza: 56, topic: "house", when: "the 4th lord is in Vaisheshikamsha or the navamsa of its exaltation sign", then: "acquires a house" },
      { stanza: 57, topic: "house", when: "the navamsa dispositor of the 4th lord is in a kendra", then: "acquisition of a house" },
      { stanza: 58, topic: "house", when: "the 9th lord is in kendra, the 4th lord in a friendly sign, and a planet exalted in the 4th", then: "a beautiful house" },
      { stanza: 59, topic: "house", when: "a benefic is in the 3rd and the 4th and 3rd lords are strong", then: "a multi-storey building" },
      { stanza: 62, topic: "house", when: "the 4th lord with the 10th lord and Saturn are in kendra", then: "a house of many storeys built of good material" },
      { stanza: 63, topic: "house", when: "the 4th lord is in the 8th aspected by malefics", then: "the house is destroyed" },
      { stanza: 64, topic: "relatives", when: "the 4th lord is with malefics in malefic shashtiamsha, debilitated or in an inimical sign", then: "forsaken by his relatives" },
      { stanza: 65, topic: "relatives", when: "Jupiter occupies the 4th and the 4th lord is with a benefic, aspected by Jupiter", then: "highly-placed relatives" },
      { stanza: 66, topic: "relatives", when: "the 4th lord is in kendra or trine in Vaisheshikamsha, free of malefics", then: "helps his relatives" },
      { stanza: 67, topic: "relatives", when: "Jupiter, Venus and Mercury are in the 4th in Mridu amsha, aspecting their own signs", then: "very helpful to his relatives" },
      { stanza: 68, topic: "relatives", when: "a benefic is in the 4th under benefic aspect and Mercury is strong", then: "respect from his relatives" },
      { stanza: 69, topic: "relatives", when: "more than two malefics are in the 4th, the 4th lord likewise afflicted, and Mercury afflicted", then: "not liked by his relatives" },
      { stanza: 73, topic: "relatives", when: "the 4th lord is afflicted by malefics, with debilitated or eclipsed planets, without benefic aspect", then: "always hates his relatives" },
      { stanza: 74, topic: "relatives", when: "a planet exalted or in a friendly sign is in the 4th under Jupiter's aspect", then: "respect from his relatives" },
      { stanza: 75, topic: "house", when: "a movable sign is in the 4th and Mars (the karaka) is placed", then: "houses in many places" },
      { stanza: 76, topic: "house", when: "a fixed sign is in the 4th and the 4th lord and Mars are in fixed signs", then: "stability of the house" },
      { stanza: 77, topic: "house", when: "malefics influence the 2nd, 12th and 4th lords", then: "destruction of that number of houses" },
      { stanza: 78, topic: "house", when: "the 2nd, 12th and 4th lords are in kendra or trine", then: "all the houses are good and safe" },
      { stanza: 79, topic: "property", when: "the 4th lord is in the 10th and the 10th lord in the 4th, with Mars strong", then: "much landed property" },
      { stanza: 80, topic: "property", when: "the 10th and 4th lords are strong and mutual friends", then: "much property" },
      { stanza: 82, topic: "property", when: "the 4th lord is in the 5th in Gopura or Mridu amsha", then: "much property" },
      { stanza: 85, topic: "property", when: "the lagna lord is strong in the 4th and the 4th lord strong in the lagna, under benefic influence", then: "a house through his own efforts" },
      { stanza: 88, topic: "property", when: "the 4th lord is strong in its own sign, Paravatamsha or an upachaya, near exaltation, aspected by benefics", then: "much landed property" },
      { stanza: 89, topic: "property", when: "the 4th, its lord and Mars are in Vaisheshikamsha under benefic aspect with the 2nd and 11th lords", then: "a very costly house" },
      { stanza: 90, topic: "property", when: "the 4th lord is with a malefic in the 2nd, debilitated or in an inimical sign", then: "loss of landed property; if exalted but with malefics, the property is sold" },
      { stanza: 93, topic: "property", when: "Mars is with a malefic, aspected by one, in a malefic sign or navamsa", then: "loss of landed property" },
      { stanza: 94, topic: "property", when: "the 10th lord is in the 4th with a malefic in malefic amsha", then: "the house is lost by government orders" },
      { stanza: 97, topic: "comfort", when: "the 4th lord is aspected by Jupiter, a benefic is between benefics, and the 4th holds a benefic", then: "a comfortable life, chief among men" },
      { stanza: 98, topic: "comfort", when: "a strong Jupiter is with the 4th lord and a benefic, or in kendra, or the 4th lord is aspected by Jupiter in Mridu amsha", then: "a comfortable life" },
      { stanza: 99, topic: "comfort", when: "Jupiter or a benefic occupies the 4th, and Jupiter is stronger than the lagna lord", then: "a comfortable life, chief among men" },
      { stanza: 100, topic: "comfort", when: "Jupiter as 4th lord is in the 2nd, 11th or 4th in Gopuramsha", then: "a comfortable life" },
      { stanza: 101, topic: "comfort", when: "malefics occupy the 4th, Jupiter and the 4th lord are weak", then: "an uncomfortable life even when rich" },
      { stanza: 109, topic: "drowning", when: "the 4th lord is debilitated, eclipsed, or in an inimical watery sign and weak", then: "falls in water near the well" },
      { stanza: 110, topic: "drowning", when: "the lagna lord is weak in the 4th and the 4th lord is with a watery planet, weak", then: "drowned" },
      { stanza: 111, topic: "fall", when: "the 4th lord is in the 4th with the lagna lord, aspected by the 10th lord", then: "falls in a well, river or tank" },
      { stanza: 113, topic: "injury", when: "the 4th holds the Sun and Mars, with or aspected by the 10th or 4th lord", then: "injured by stone" },
      { stanza: 114, topic: "injury", when: "the 4th lord is with Saturn and Rahu, aspected by Mars, without benefic aspect", then: "injured by stone" },
      { stanza: 134, topic: "mother", when: "Venus in the 7th from the Moon is with malefics, or Saturn in the 4th is aspected by malefics", then: "the mother is short-lived or dies soon" },
      { stanza: 135, topic: "mother", when: "Saturn in the 4th is under benefic aspect", then: "the mother lives long" },
      { stanza: 139, topic: "mind", when: "a malefic occupies the 4th and its lord is aspected by a malefic or between malefics", then: "a deceitful mind" },
      { stanza: 140, topic: "mind", when: "Saturn, Mars and Rahu are in the 4th without benefic aspect, and the 4th lord is likewise afflicted", then: "a deceitful mind" },
      { stanza: 142, topic: "mind", when: "the Sun and Moon occupy the 4th", then: "deceitful at one moment and not the next" },
      { stanza: 143, topic: "mind", when: "a benefic or an exalted or friendly planet occupies the 4th, and the sign is a benefic's", then: "a mind without deceit or hypocrisy" },
      { stanza: 144, topic: "mind", when: "the 4th lord is strong in Gopura or Mridu amsha", then: "a clean mind, in peace" },
      { stanza: 147, topic: "mind", when: "Rahu is in the 4th under malefic aspect with many malefics", then: "appears innocent but is full of deceit inside" },
      { stanza: 148, topic: "mother", when: "the 1st and 4th lords are mutual friends, with benefics and benefic aspect", then: "specially loved by the mother" },
      { stanza: 150, topic: "mother", when: "the 4th and 1st lords are enemies of the lagna lord, with malefics and malefic aspect", then: "enmity between the native and his mother" },
      { stanza: 151, topic: "mother", when: "the 4th lord is in the 8th from the lagna lord", then: "enmity with the mother" },
      { stanza: 152, topic: "conveyance", when: "the 4th lord is strong, the 4th holds a benefic, and both are aspected by benefics", then: "possesses a conveyance" },
      { stanza: 153, topic: "conveyance", when: "the 4th lord is in the lagna with the lagna lord and the Moon", then: "a horse" },
      { stanza: 154, topic: "conveyance", when: "Venus is in the lagna with the 4th lord", then: "a conveyance driven by men; with Jupiter in the lagna, all sorts of conveyances" },
      { stanza: 155, topic: "conveyance", when: "the 4th lord is in the lagna with the Moon, Jupiter and Venus, none debilitated or eclipsed", then: "three types of conveyance" },
      { stanza: 157, topic: "conveyance", when: "the 4th lord is in the 9th, Jupiter and Venus in the 4th, and the 9th lord in kendra or trine", then: "valuable territory, ornaments, wealth and conveyances" },
      { stanza: 163, topic: "conveyance", when: "the 4th lord is in kendra or the lagna", then: "many conveyances" },
      { stanza: 168, topic: "conveyance", when: "the 4th lord is in the 12th", then: "makes a house in a foreign land" },
      { stanza: 170, topic: "conveyance", when: "the 2nd and 9th lords exchange and the lagna lord is strong", then: "owns a conveyance" },
      { stanza: 171, topic: "conveyance", when: "the 4th lord is strong in Gopuramsha, aspected by the 11th, 10th and 9th lords", then: "gets a conveyance" },
    ],
  },
  {
    house: 5,
    chapter: 5,
    rules: [
      { stanza: 3, topic: "son", when: "a benefic occupies the 5th under benefic aspect, and the benefic 5th lord is under benefic aspect", then: "definitely gets a son" },
      { stanza: 4, topic: "son", when: "the 5th house, its lord and Jupiter are with benefics under benefic aspect", then: "gains a son" },
      { stanza: 5, topic: "son", when: "the lagna lord is in the 5th and the 5th lord and Jupiter are strong", then: "certainly gets a son" },
      { stanza: 6, topic: "son", when: "Jupiter as 5th lord is strong, aspected by the lagna lord", then: "surely gets a son" },
      { stanza: 7, topic: "son", when: "the 5th lord and Jupiter are in Vaisheshikamsha, aspected by a benefic", then: "surely gets a son" },
      { stanza: 9, topic: "son", when: "the 1st and 5th lords are in the same house, aspecting each other, or in each other's sign", then: "surely gets a son" },
      { stanza: 10, topic: "son", when: "the 1st and 5th lords are together in kendra with a benefic, and the 2nd lord is strong", then: "surely gets a son" },
      { stanza: 11, topic: "son", when: "the navamsa dispositor of the 5th lord is with a benefic, aspected by a benefic", then: "surely gets a son" },
      { stanza: 14, topic: "son", when: "the 5th is hemmed in by malefics, and the 5th lord and Jupiter are with malefics", then: "destruction of sons" },
      { stanza: 16, topic: "son", when: "the 5th lord is in a malefic navamsa, debilitated, eclipsed, aspected by malefics, or in a bad house", then: "destruction of sons" },
      { stanza: 18, topic: "son", when: "the 5th lord is in the 6th, 8th or 12th in malefic shashtiamsha, aspected by a malefic", then: "destruction of sons" },
      { stanza: 19, topic: "son", when: "the 5th lord is in Mridu or Gopura amsha", then: "surely gets a son" },
      { stanza: 21, topic: "son", when: "the 5th lord is in Paravatamsha, the 9th lord likewise, and the lagna lord is under benefic aspect", then: "acquisition of a son" },
      { stanza: 23, topic: "family", when: "the Moon is in the 10th, Venus in the 7th, malefics in the 4th, and the lagna lord is with Mercury", then: "discontinuance of the family tree" },
      { stanza: 29, topic: "son", when: "malefics occupy the 5th", then: "denies a son; Mars in the lagna, Saturn in the 8th and the Sun in the 5th also deny" },
      { stanza: 30, topic: "son", when: "Mars is in the lagna, Saturn in the 8th and the Sun in the 5th, but most are aspected by benefics", then: "a son long after marriage" },
      { stanza: 33, topic: "intelligence", when: "the 5th lord at its highest exaltation aspects the 5th, which is between benefics", then: "keen intelligence" },
      { stanza: 34, topic: "intelligence", when: "Mercury is strong, the 5th lord is aspected by a benefic, and the 5th holds a benefic", then: "keen intellect" },
      { stanza: 35, topic: "intelligence", when: "the navamsa dispositor of the 5th lord is aspected by a benefic in Vaisheshikamsha", then: "keen intelligence" },
      { stanza: 37, topic: "intelligence", when: "the 5th is between benefics, occupied by benefics, with Jupiter in kendra or trine", then: "learned and wise" },
      { stanza: 39, topic: "intelligence", when: "the 5th lord is in kendra with a benefic and an exalted planet", then: "highly efficient in taking the meaning of others' words" },
      { stanza: 40, topic: "memory", when: "the 5th lord and Mercury are in Mridu amsha, aspected by benefics", then: "an efficient, retentive memory" },
      { stanza: 42, topic: "intelligence", when: "Mercury is in kendra or trine, aspected by Mercury", then: "quick to understand the least hint" },
      { stanza: 44, topic: "intelligence", when: "a malefic occupies the 5th and the 5th lord is with a malefic in malefic shashtiamsha", then: "very little intelligence" },
      { stanza: 46, topic: "intelligence", when: "Saturn is in the 5th, the lagna lord aspected by Saturn, and the 5th lord with a malefic", then: "very little intelligence" },
      { stanza: 47, topic: "memory", when: "no benefic is in the 5th, Saturn, Mandi and Rahu are there, and the 5th lord is aspected by a malefic", then: "often loses memory" },
      { stanza: 49, topic: "intelligence", when: "a benefic is in the 5th aspected by Jupiter and Venus, and the 5th lord likewise", then: "imparts his learning and intellect to others" },
      { stanza: 52, topic: "ministry", when: "Jupiter with the 5th lord is in Gopuramsha in kendra or trine", then: "a minister, one who can foretell things" },
      { stanza: 53, topic: "knowledge", when: "Jupiter is in its own navamsa and Mridu amsha, aspected by Venus and Mercury in benefic navamsa", then: "knows the past, present and future" },
      { stanza: 54, topic: "son", when: "the 5th lord is in Gopuramsha, in a benefic navamsa, a male planet, aspected by a benefic, with a male planet in a male navamsa", then: "the first birth is a good son" },
      { stanza: 55, topic: "son", when: "the 5th lord is in a female sign with a female planet in a female house", then: "the first birth is a daughter; in a eunuch navamsa, a eunuch" },
      { stanza: 58, topic: "son", when: "the 5th and lagna lords are mutual friends", then: "friendship with his son; mutual enemies, enmity" },
      { stanza: 59, topic: "son", when: "the 1st and 5th lords aspect each other or are in each other's navamsa", then: "the son serves the father" },
      { stanza: 61, topic: "son", when: "the 5th lord is in the 6th, 8th or 12th, aspected by the lagna lord, Mars and Rahu", then: "the son is always opposed to the father" },
      { stanza: 62, topic: "son", when: "the Sun is in the 5th with Jupiter and Venus, or in Jupiter's or Venus's sign in the 5th", then: "the son dominates over the native" },
      { stanza: 64, topic: "charity", when: "the 5th lord is in the 9th with benefics, aspected by them", then: "always engaged in feeding others" },
      { stanza: 65, topic: "belly", when: "a malefic occupies the 5th and the 5th lord is with malefics", then: "disease in the belly" },
    ],
  },
  {
    house: 6,
    chapter: 5,
    rules: [
      { stanza: 2, topic: "boils", when: "the 6th lord is in the lagna with a malefic, or in the 8th with a malefic", then: "boils or wounds in the body" },
      { stanza: 5, topic: "boils", when: "the 6th lord is in the lagna with a malefic, or in the 8th with a malefic", then: "boils or wounds in the body" },
      { stanza: 6, topic: "leprosy", when: "the Moon, Mercury and the lagna lord are together with Rahu or Ketu in a sign", then: "leprosy, in the limb the sign represents if aspected by a benefic" },
      { stanza: 9, topic: "disease", when: "the lagna lord and the 6th lord are both with the Sun", then: "fever; with the Moon, trouble by water; with Mars, from battle, wounds or boils" },
      { stanza: 10, topic: "disease", when: "the lagna and 6th lords are with Mercury", then: "mental trouble; with Jupiter, no disease; with Venus, trouble from the wife; with Saturn, chronic nervous trouble; with Rahu or Ketu, snake bite, thieves, fire and nervous disorders" },
      { stanza: 12, topic: "wife", when: "the 7th lord and Venus are both in the 6th", then: "the wife is sterile" },
      { stanza: 13, topic: "imprisonment", when: "the 6th lord and the lagna lord are with Saturn in kendra or trine", then: "imprisoned" },
      { stanza: 22, topic: "death", when: "the Moon is in the 6th, 8th or 12th, aspected by the lagna lord, with Saturn, Mandi and Rahu", then: "a miserable death" },
      { stanza: 23, topic: "death", when: "Saturn is debilitated, in an inimical sign, eclipsed, with malefics in malefic shashtiamsha", then: "a miserable death" },
      { stanza: 27, topic: "death", when: "the decanate dispositor of Saturn is with or aspected by Mars, or in Mars's sign or navamsa", then: "dies in battle" },
      { stanza: 29, topic: "death", when: "many malefics are in the 8th in Mars's navamsa, in malefic shashtiamsha", then: "sudden death" },
      { stanza: 32, topic: "disease", when: "the Sun occupies the 6th with a malefic, aspected by a malefic", then: "a wound or boil in the navel from excess heat" },
      { stanza: 33, topic: "disease", when: "the Moon is in the 6th with a malefic, aspected by one, in a malefic navamsa", then: "windy troubles; Mars so placed gives heat and defective blood" },
      { stanza: 34, topic: "disease", when: "Mercury is likewise in the 6th", then: "phlegm and windy troubles; Jupiter, a swollen region; Venus, loose motions" },
      { stanza: 35, topic: "disease", when: "Saturn is in the 6th under malefic influence", then: "colic; Rahu or Ketu so placed, trouble through a dead spirit" },
      { stanza: 36, topic: "disease", when: "the Moon is in the 6th with Mars", then: "mental aberration and jaundice" },
      { stanza: 37, topic: "disease", when: "Mars is in the 6th with Mercury, aspected by Venus and the Moon, in a malefic navamsa", then: "consumption" },
      { stanza: 38, topic: "disease", when: "the 6th holds Saturn and Mars, aspected by the Sun and Rahu, with a weak lagna lord", then: "a long-lasting disease" },
      { stanza: 40, topic: "disease", when: "the Moon is in a watery sign in the 6th, the 6th lord watery, aspected by Mercury", then: "urinal troubles" },
      { stanza: 42, topic: "disease", when: "the 6th lord is weak in the lagna, or Mars is in the lagna", then: "trouble in the head or face, and colic" },
      { stanza: 44, topic: "enemies", when: "the 6th lord is in kendra under malefic aspect, or many malefics are in the 6th", then: "trouble from enemies" },
      { stanza: 45, topic: "enemies", when: "the 6th lord is in the 6th, the 6th lord in the 1st with Saturn, Mandi and Rahu", then: "trouble from enemies" },
      { stanza: 46, topic: "enemies", when: "a weak 6th lord is aspected by a malefic or between malefics", then: "trouble from enemies" },
      { stanza: 47, topic: "enemies", when: "the 6th lord is in the 6th, 8th or 12th, debilitated, in an inimical sign or eclipsed, and the lagna lord is strong", then: "the enemy is destroyed" },
      { stanza: 48, topic: "enemies", when: "the 6th lord is aspected by or with a benefic, in a benefic's sign", then: "friendship with the enemy" },
      { stanza: 49, topic: "enemies", when: "the 6th lord is weaker than the lagna lord, with benefics and benefic aspect", then: "friendship with enemies" },
      { stanza: 50, topic: "siblings", when: "the lagna lord is in the 8th, aspected by the 6th lord, or both in the 1st", then: "trouble to maternal brothers and sisters" },
      { stanza: 53, topic: "community", when: "Jupiter as 6th lord is with benefics, aspected by benefics, in Mridu amsha", then: "many members of his community" },
      { stanza: 54, topic: "community", when: "the 6th lord is with malefics, in a malefic navamsa, debilitated or eclipsed, without benefic aspect", then: "destruction of the community" },
      { stanza: 56, topic: "loss", when: "the 9th lord is in the 6th, aspected by the 6th lord, and the 6th lord is with Saturn and Mars", then: "loss by theft or fire" },
      { stanza: 57, topic: "community", when: "the 6th lord is in Gopuramsha aspected by the Sun, and the lagna lord is strong", then: "helps his community members" },
      { stanza: 58, topic: "dishes", when: "a benefic is in the 6th, aspected by benefics, and the 6th lord is with a benefic", then: "likes good dishes" },
      { stanza: 60, topic: "dishes", when: "Jupiter or Venus as 6th lord is in Mridu amsha", then: "likes sweet dishes" },
      { stanza: 61, topic: "dishes", when: "Venus is in the 6th with Mercury, aspected by benefics in a benefic navamsa", then: "always likes sweet dishes" },
      { stanza: 62, topic: "dishes", when: "Mercury is in the 6th aspected by a malefic", then: "does not like sweet things; Venus in an inimical sign with Mercury, sour dishes" },
      { stanza: 63, topic: "dishes", when: "Venus in the 6th is aspected by Mars, or Mars and Venus are together in the 6th aspected by the Sun", then: "likes sour things much" },
      { stanza: 64, topic: "character", when: "the 6th lord is aspected by Mars, and Rahu or Ketu are in Mars's sign", then: "quarrelsome and becomes a thief" },
    ],
  },
  {
    house: 7,
    chapter: 6,
    rules: [
      { stanza: 2, topic: "sex", when: "Venus is in the 7th", then: "overridden with sex; Mercury, affairs with another woman; Jupiter, lives only with his wife; Saturn, affairs with a bad woman; a benefic 7th lord, a good wife" },
      { stanza: 3, topic: "sex", when: "Mars is in the 7th", then: "affairs with other women despite having wives; the Sun, attached to many women" },
      { stanza: 6, topic: "adultery", when: "the 7th lord is with Rahu or Ketu, aspected by malefics", then: "adultery" },
      { stanza: 8, topic: "son", when: "the 7th lord is in the 2nd under Mars's aspect", then: "a son from another woman" },
      { stanza: 9, topic: "son", when: "the 5th, 9th and 7th lords are in the 6th, 8th or 12th without benefic aspect", then: "no son even with many wives" },
      { stanza: 10, topic: "adultery", when: "a weak Moon (within 72 degrees of the Sun) is in the 7th with a malefic, or the 7th lord is in the lagna with a malefic", then: "adulterous" },
      { stanza: 11, topic: "wife", when: "the 5th lord is in the 7th, the 7th lord with a malefic, and Venus weak", then: "the wife dies of pregnancy" },
      { stanza: 12, topic: "wife", when: "Venus is debilitated in the 7th, or the Moon debilitated in the 7th", then: "the wife dies by drowning" },
      { stanza: 13, topic: "wife", when: "the 7th lord is with Rahu and Mandi in a serpent decanate", then: "the wife dies by poison; the 2nd lord in the 2nd and the 7th lord in its own sign in the 7th, one wife only" },
      { stanza: 15, topic: "wife", when: "the 7th lord is retrograde or exalted", then: "many wives; a strong Venus in the lagna likewise" },
      { stanza: 16, topic: "marriage", when: "the lagna lord is in the 8th, the 7th holds a malefic, and the 2nd lord is with a malefic", then: "two marriages" },
      { stanza: 17, topic: "wife", when: "the 7th lord is with Saturn, Mars and Rahu in malefic shashtiamsha", then: "early death of the wife" },
      { stanza: 25, topic: "marriage", when: "the 7th lord is debilitated or eclipsed, in malefic shashtiamsha", then: "marries a second time" },
      { stanza: 30, topic: "wife", when: "the 7th lord is in kendra or trine, exalted or in its own varga, with the 10th lord", then: "lives with many wives" },
      { stanza: 31, topic: "wife", when: "the 7th and 11th lords are together, or aspect each other in a trine in strength", then: "many wives at a time" },
      { stanza: 39, topic: "wife", when: "the 7th lord and its significator are both debilitated, in debilitation navamsa, without benefic influence", then: "a bad wife" },
      { stanza: 40, topic: "wife", when: "the 7th lord is with a benefic, aspected by one, or between benefics", then: "a chaste wife" },
      { stanza: 41, topic: "wife", when: "the 7th lord is in a benefic navamsa, the significator likewise, and the 10th lord is strong", then: "a chaste wife" },
      { stanza: 50, topic: "wife", when: "the 7th lord (Mars) is weak, in malefic shashtiamsha, debilitated, in an inimical sign or eclipsed", then: "a wife of bad character, curt towards her husband" },
      { stanza: 53, topic: "wife", when: "Mercury as 7th lord is strong, in a friendly or exaltation varga or Gopuramsha", then: "a wife purified by vows and fasting, with good sons and comforts" },
      { stanza: 54, topic: "wife", when: "Venus as 7th lord is with a malefic, debilitated, eclipsed, in malefic shashtiamsha", then: "a wife like a prostitute, hard and a thief" },
      { stanza: 55, topic: "wife", when: "Venus as 7th lord is strong, with a benefic, in a benefic navamsa, own sign or Mridu amsha", then: "a wife garrulous but blessed with sons and virtuous" },
      { stanza: 56, topic: "wife", when: "Saturn as 7th lord is with a malefic, debilitated, in an inimical sign under malefic aspect", then: "a wife too old, of bad character, a blot on the family" },
      { stanza: 57, topic: "wife", when: "Saturn as 7th lord is strong under benefic aspect, particularly Jupiter's", then: "a wife devoted to service, to brahmins and gods, religious and dutiful" },
      { stanza: 58, topic: "wife", when: "Rahu or Ketu is in the 7th under malefic aspect, in a malefic navamsa", then: "an adulterous, sinful wife of bad character" },
      { stanza: 59, topic: "marriage", when: "the 7th and 1st lords are in the lagna close in degree", then: "married early in boyhood" },
      { stanza: 60, topic: "marriage", when: "the lagna, 2nd and 7th hold benefics in benefic vargas, with benefic aspect on their lords", then: "marriage in early boyhood" },
      { stanza: 62, topic: "luck", when: "Venus is in the 7th, 3rd, 6th, 10th, 11th or 2nd, and the lagna lord is with or aspected by benefics", then: "luck shines after marriage" },
      { stanza: 68, topic: "wife", when: "the 7th lord is weaker than the lagna lord, in an inimical navamsa, eclipsed or debilitated", then: "a wife from a low family" },
      { stanza: 70, topic: "status", when: "the lagna lord is weaker than the 7th lord, with malefics or debilitated", then: "the native is of inferior status to his wife" },
      { stanza: 71, topic: "status", when: "the lagna lord is stronger than the 7th lord, exalted, in kendra or trine, with benefics", then: "the native is superior in status to his wife" },
      { stanza: 73, topic: "wife", when: "the 7th lord is an enemy of the lagna lord", then: "the wife is inimical towards the native; if friends, her family is friendly" },
      { stanza: 76, topic: "wife", when: "the 7th factors are aspected by Jupiter or Venus", then: "a beautiful wife of good qualities; aspected by malefics, an ugly, evil wife" },
      { stanza: 92, topic: "wife", when: "Mars is in the 7th", then: "the wife has small breasts; Saturn or Rahu, long; the Sun, hard; other planets, good and big" },
      { stanza: 109, topic: "eating", when: "a malefic occupies the 7th and the 7th lord is with malefics in malefic shashtiamsha", then: "seldom enjoys ghee and pulses" },
      { stanza: 110, topic: "eating", when: "the Moon or Jupiter as 7th lord is in a watery sign or navamsa, or aspected by a watery planet", then: "enjoys milk and its products" },
      { stanza: 112, topic: "health", when: "many malefics are in the 7th, or malefics in the 6th and 8th in malefic shashtiamsha", then: "urinary troubles" },
    ],
  },
  {
    house: 8,
    chapter: 7,
    rules: [
      { stanza: 2, topic: "longevity", when: "the 8th lord is in the 12th with malefics, or in the 6th under malefics", then: "short life" },
      { stanza: 3, topic: "longevity", when: "the 8th lord is in the 7th in its own, friendly or exaltation sign", then: "long life" },
      { stanza: 4, topic: "longevity", when: "the 8th and 1st lords are together in the 6th or 12th under benefic aspect", then: "long life" },
      { stanza: 5, topic: "longevity", when: "the 10th lord is in a friendly or exaltation sign, or the 10th, 1st and 8th lords are in kendra", then: "very good longevity, long life" },
      { stanza: 7, topic: "longevity", when: "the lagna lord is in kendra with Jupiter or Venus, or aspected by them there", then: "long-lived" },
      { stanza: 8, topic: "longevity", when: "benefics occupy the kendras and the lagna lord is with a benefic under Jupiter's aspect", then: "full longevity" },
      { stanza: 9, topic: "longevity", when: "malefics occupy the 3rd, 6th and 11th, benefics the kendras and trines, and the lagna lord is strong", then: "full longevity" },
      { stanza: 12, topic: "longevity", when: "three planets are exalted, the 8th lord is in the 1st, and no malefic is in the 8th", then: "long life" },
      { stanza: 13, topic: "longevity", when: "three planets are in the 8th, each exalted, friendly or in its own sign, and the lagna lord is strong", then: "long life" },
      { stanza: 15, topic: "longevity", when: "malefics occupy the 6th, 8th and 12th and the lagna lord is weak, without benefic influence", then: "short-lived and without progeny" },
      { stanza: 17, topic: "longevity", when: "malefics are in kendras without benefic aspect and the lagna lord is weak", then: "very short-lived" },
      { stanza: 19, topic: "longevity", when: "the measure", then: "up to 32 years is short, 32 to 69 middle, beyond 69 long" },
      { stanza: 20, topic: "longevity", when: "the lagna lord is an enemy of the Sun", then: "short life; neutral, middle; a friend, long" },
      { stanza: 23, topic: "longevity", when: "a benefic occupies a kendra or trine, Saturn is strong there, and malefics are in the 6th or 8th", then: "middle longevity" },
      { stanza: 26, topic: "death", when: "the 1st and 8th lords are weak, influenced by Mars and the 6th lord", then: "dies in battle or by weapons" },
      { stanza: 27, topic: "death", when: "the 8th and 1st lords are in the 6th with Rahu, Ketu and Saturn", then: "death through thieves or weapons" },
      { stanza: 28, topic: "death", when: "the 1st and 8th lords are with the 4th lord", then: "death by a conveyance; with Jupiter, through loss of appetite" },
      { stanza: 32, topic: "death", when: "the 6th lord is with Rahu, Ketu and Saturn", then: "dies at the hands of a wild animal; with Jupiter, an elephant; with the Moon, a horse" },
      { stanza: 33, topic: "death", when: "the 6th lord and Saturn are with the Sun", then: "death by an animal's horns; with Mars, fear of a dog" },
      { stanza: 35, topic: "health", when: "a weak Moon is in the 8th with Rahu and Saturn", then: "epilepsy, and trouble from the souls of the dead and water" },
      { stanza: 38, topic: "death", when: "the Sun is in the 6th or 8th, debilitated, aspected by malefics", then: "dies by government punishment, with financial loss" },
      { stanza: 41, topic: "death", when: "the Moon is eclipsed or with Parivesh, aspected by malefics", then: "sudden death" },
      { stanza: 57, topic: "health", when: "many malefics are in the 8th", then: "disease on or near the rectum" },
      { stanza: 58, topic: "comfort", when: "the 8th is occupied or aspected by benefics", then: "a comfortable life and refined food; malefics, coarse food" },
      { stanza: 59, topic: "defeat", when: "the 8th lord is with malefics, aspected by them, between malefics, or a malefic sign is in the 8th", then: "often meets defeat" },
      { stanza: 60, topic: "death", when: "the 8th sign and its lord are movable", then: "dies away from home" },
      { stanza: 62, topic: "death", when: "a fixed sign is in the 8th and the 8th lord is fixed, with Saturn in a fixed navamsa", then: "dies in his own home; common signs, death on the way" },
    ],
  },
  {
    house: 9,
    chapter: 7,
    rules: [
      { stanza: 2, topic: "relations", when: "the 9th is associated with benefics", then: "the relations mentioned are benefitted; otherwise they suffer" },
      { stanza: 3, topic: "conduct", when: "the Moon is in the 9th with a malefic and Venus is afflicted", then: "cohabits with the wife of his guru" },
      { stanza: 6, topic: "religion", when: "the 9th lord is with a benefic through its navamsa, or in Vaisheshikamsha not in malefic shashtiamsha", then: "strongly entrenched in religion and morality" },
      { stanza: 7, topic: "religion", when: "Jupiter or Venus is in its own or a friendly navamsa, and the 9th lord and a benefic are strong", then: "head of a religious institution" },
      { stanza: 8, topic: "religion", when: "the 9th lord is in Jupiter's, Venus's or Mercury's navamsa, aspected by benefics, between benefics", then: "religious" },
      { stanza: 9, topic: "religion", when: "a benefic occupies the 9th but in a malefic navamsa and malefic shashtiamsha", then: "resorts to religion through hypocrisy" },
      { stanza: 10, topic: "religion", when: "the 9th's navamsa, its lord and significator belong to a benefic, with benefic aspect", then: "sincerely devoted to religion and morality" },
      { stanza: 11, topic: "religion", when: "the 9th lord is debilitated, between malefics, or in malefic shashtiamsha", then: "sinful" },
      { stanza: 12, topic: "conduct", when: "Rahu and Saturn occupy the 9th in a malefic navamsa, aspected by Gulik, and the 9th lord is in a malefic navamsa", then: "engages in very cruel deeds" },
      { stanza: 13, topic: "father", when: "the 9th lord is a natural benefic, the 9th holds a benefic, and the Sun is with a benefic", then: "the father lives long and is beneficial" },
      { stanza: 14, topic: "father", when: "the 9th lord is in Paravatamsha with the Sun, in exaltation or friendly navamsa", then: "benefitted from the father for long" },
      { stanza: 16, topic: "father", when: "the Sun is in Gopuramsha, aspected by the 9th lord, free of malefics", then: "comforts from a long-living father" },
      { stanza: 17, topic: "father", when: "the 9th lord and the Sun are with malefics, aspected by them, or between malefics", then: "trouble to the father" },
      { stanza: 19, topic: "father", when: "a natural benefic in the 9th and the 9th lord are with enemies, debilitated, or in malefic shashtiamsha", then: "trouble to the father" },
      { stanza: 20, topic: "father", when: "the navamsa dispositor of the 9th lord is debilitated or in a malefic navamsa", then: "trouble to the father" },
      { stanza: 21, topic: "fortune", when: "the 9th lord is much stronger than the lagna lord, and the Sun is aspected by benefics", then: "lives under the father's protection" },
    ],
  },
  {
    house: 10,
    chapter: 8,
    rules: [
      { stanza: 2, topic: "action", when: "the 10th lord is weak under malefics", then: "frustrations in action; the 10th lord, Jupiter and Mercury strong, service of others" },
      { stanza: 4, topic: "action", when: "the 10th lord, its navamsa dispositor or its sign dispositor is in the 8th, with Rahu or the Sun in the 10th", then: "devoid of acts of public utility" },
      { stanza: 5, topic: "action", when: "Mars is in Pisces in the 10th with benefics", then: "liberation (moksha); Jupiter and a strong Moon in a watery sign in the 10th, sacred baths in the Ganges" },
      { stanza: 14, topic: "action", when: "Mercury is exalted and the 10th lord is exalted, aspected by Mercury and a benefic", then: "religious acts of public utility" },
      { stanza: 15, topic: "power", when: "the 10th lord is a benefic, aspected by one, or in a benefic navamsa", then: "ruling powers" },
      { stanza: 16, topic: "orders", when: "the Sun occupies the 10th with Mars and the 10th lord is in kendra", then: "passes cruel orders" },
      { stanza: 18, topic: "orders", when: "the 10th lord is in kendra with benefics, in a benefic shashtiamsha", then: "gives gentle orders" },
      { stanza: 19, topic: "orders", when: "Rahu and Mandi occupy the 10th, or Rahu or Ketu is in the 8th with the 9th lord debilitated", then: "passes cruel orders" },
      { stanza: 20, topic: "fame", when: "the Moon in Cancer is aspected by Jupiter and Venus, in Paravatamsha", then: "fame in life" },
      { stanza: 22, topic: "fame", when: "a benefic 10th lord is exalted, in a friend's or own sign, or in benefic shashtiamsha", then: "good fame" },
      { stanza: 24, topic: "fame", when: "the 10th lord is weak, with malefics, in malefic shashtiamsha", then: "a bad name in life" },
      { stanza: 26, topic: "honour", when: "the 10th and its lord are with benefics, and the 10th lord is in its own or exaltation sign", then: "firm in good vows, honoured in life" },
      { stanza: 27, topic: "honour", when: "Jupiter or a benefic occupies the 10th and the 10th lord is with benefics", then: "quick of understanding, honoured" },
      { stanza: 28, topic: "honour", when: "a malefic occupies the 10th aspected by a malefic, and the 10th lord is debilitated", then: "devoid of honour" },
      { stanza: 29, topic: "hunting", when: "the 10th lord is in a movable navamsa and a movable sign", then: "goes for hunting; fixed or common, no movement for hunting" },
      { stanza: 30, topic: "servants", when: "the 6th lord occupies the 10th and the 10th lord is with Saturn in kendra or trine", then: "male or maid servants" },
      { stanza: 31, topic: "servants", when: "the navamsa dispositor of the 10th lord is Saturn, linked with the 6th lord", then: "many servants" },
      { stanza: 33, topic: "knees", when: "malefics occupy the 10th", then: "weakness of the knees" },
    ],
  },
  {
    house: 11,
    chapter: 8,
    rules: [
      { stanza: 2, topic: "income", when: "the 11th lord is in kendra or trine, or the 11th is occupied by a malefic", then: "much income" },
      { stanza: 3, topic: "income", when: "the 2nd lord is in the 11th and the 11th lord in the 2nd, or both together in kendra", then: "much gain of wealth" },
      { stanza: 4, topic: "income", when: "the 11th is between two benefics, or the 11th lord likewise, or in Paravatamsha", then: "much income" },
      { stanza: 5, topic: "income", when: "the sign dispositor of the 11th lord is aspected by a benefic or between benefics", then: "much income" },
      { stanza: 6, topic: "income", when: "the navamsa dispositor of the 11th lord is a benefic, aspected by the 2nd lord", then: "much income" },
      { stanza: 8, topic: "income", when: "malefics influence the 11th lord", then: "loss of income" },
      { stanza: 10, topic: "income", when: "a malefic is in the 11th, or a malefic sign is there", then: "loss of income" },
      { stanza: 11, topic: "ears", when: "the 11th lord is a benefic, aspected by a benefic, strong", then: "ornaments of the ear" },
      { stanza: 12, topic: "ears", when: "malefics influence the 11th", then: "trouble to the ear" },
      { stanza: 14, topic: "siblings", when: "benefics influence the 11th", then: "elder brothers or sisters live long" },
      { stanza: 15, topic: "siblings", when: "malefics in or aspecting the 11th", then: "denies elder co-borns" },
    ],
  },
  {
    house: 12,
    chapter: 8,
    rules: [
      { stanza: 2, topic: "expenses", when: "a malefic sign is in the 12th, it holds a malefic, or the 12th lord is aspected by a malefic", then: "spends on illegitimate items" },
      { stanza: 3, topic: "expenses", when: "Saturn, Mandi or Rahu occupy the 12th, or its lord is influenced by them", then: "spends on illegitimate causes" },
      { stanza: 4, topic: "expenses", when: "the navamsa dispositor of the 12th lord is a benefic in a benefic navamsa, surrounded by benefics", then: "spends on legitimate items" },
      { stanza: 5, topic: "expenses", when: "Jupiter and Venus occupy the 12th, or Mercury and the Moon there in Paravatamsha under benefic aspect", then: "spends on legitimate items" },
      { stanza: 8, topic: "expenses", when: "a benefic 10th lord, exalted or in a friend's or own sign, influences the 12th lord", then: "spends on legitimate moral items" },
      { stanza: 9, topic: "expenses", when: "the 12th lord is weak, with or aspected by the 6th lord, or with Gulika", then: "spends to meet his enemy" },
      { stanza: 10, topic: "expenses", when: "the 12th lord is in a malefic navamsa with a weak 7th lord", then: "loses wealth on account of his wife" },
      { stanza: 11, topic: "expenses", when: "the 12th lord is in a malefic navamsa with a weak Mars", then: "loses wealth on account of his brothers" },
      { stanza: 12, topic: "expenses", when: "the 12th lord is in a malefic navamsa with a weak 5th lord", then: "loses wealth on account of his son" },
      { stanza: 13, topic: "expenses", when: "the 12th lord is influenced by the 9th lord or the Sun", then: "spends on his father" },
      { stanza: 14, topic: "expenses", when: "the 12th lord is in a bad house with a malefic, with or aspected by the 4th lord", then: "spends much on his mother" },
      { stanza: 15, topic: "limbs", when: "the 12th lord is weak, in a malefic navamsa or debilitated", then: "loses one of his limbs" },
      { stanza: 23, topic: "afterlife", when: "a natural benefic is in the 12th exalted, aspected by a benefic, in Devlokamsha", then: "attains to heaven" },
      { stanza: 24, topic: "afterlife", when: "Jupiter as 10th lord is in the 12th under benefic aspect", then: "attains to heaven" },
      { stanza: 25, topic: "eyes", when: "the 12th lord is with a benefic in a benefic navamsa, influenced by a benefic", then: "good healthy eyes" },
      { stanza: 26, topic: "eyes", when: "the contrary holds", then: "loss of the eye, and bad for the feet" },
      { stanza: 27, topic: "conveyance", when: "Jupiter, Venus and Mercury are in the 12th", then: "conveyance" },
      { stanza: 28, topic: "sleep", when: "benefics influence the 12th and its lord", then: "palanquin, bed, and the pleasures of sleep" },
      { stanza: 29, topic: "sleep", when: "the 12th lord is exalted, in a benefic varga, under benefic aspect", then: "sleeps on a fine charpoy" },
    ],
  },
];

// ── Computation against a chart ─────────────────────────────────────────────

export interface SarvarthaFinding {
  house: number;
  stanza: number;
  topic: string;
  text: string;
}

export interface SarvarthaResult {
  findings: SarvarthaFinding[];
  /** Rajyogas (ch. 9) that fire for this chart. */
  rajyogas: { stanza: number; text: string }[];
  /** Rules evaluated against the chart. */
  computable: number;
  /** Rules harvested in total (computable + reference-only). */
  total: number;
}

/** A ch. 9 Rajyoga: a chart-level (not house-level) combination for affluence and power. */
export interface ScRajyoga {
  stanza: number;
  when: string;
  then: string;
  test?: ScTest;
}

export const SC_RAJYOGAS: ScRajyoga[] = [
  { stanza: 1, when: "five planets are exalted, with Jupiter strong in the lagna", then: "becomes a king", test: (c) => c.positions.filter((p) => p.dignity === "Exalted").length >= 5 && c.strong("Jupiter") && c.houseOf("Jupiter") === 1 },
  { stanza: 3, when: "all the planets occupy their signs of exaltation", then: "becomes a king", test: (c) => c.positions.every((p) => p.dignity === "Exalted") },
  { stanza: 3, when: "all the planets occupy their own signs", then: "equal in status to a king", test: (c) => c.positions.every((p) => ["Own sign", "Moolatrikona", "Exalted"].includes(p.dignity)) },
  { stanza: 4, when: "three planets are in their moolatrikona signs", then: "status equal to that of a king", test: (c) => c.positions.filter((p) => p.dignity === "Moolatrikona").length >= 3 },
  { stanza: 5, when: "many planets occupy inimical or debilitation signs", then: "devoid of wealth and comforts, foolish and diseased", test: (c) => c.positions.filter((p) => p.dignity === "Debilitated" || p.dignity === "Inimical").length >= 4 },
  { stanza: 9, when: "the Moon is in the lagna, Jupiter in the 4th, Venus in the 10th, and Saturn exalted or own", then: "equal to a king", test: (c) => c.houseOf("Moon") === 1 && c.houseOf("Jupiter") === 4 && c.houseOf("Venus") === 10 && ["Exalted", "Own sign"].includes(c.positions.find((p) => p.planet === "Saturn")!.dignity) },
  { stanza: 11, when: "benefics occupy kendras and trines, malefics the 3rd, 6th and 11th, and the lagna lord is strong", then: "equal to a king", test: (c) => c.strong(c.lordOf(1)) && [1, 4, 5, 7, 9, 10].every((h) => c.houseHas(h, "benefic")) && [3, 6, 11].every((h) => c.houseHas(h, "malefic")) },
  { stanza: 20, when: "Jupiter is in the lagna and Mercury in a kendra", then: "equal in status to that of a king", test: (c) => c.houseOf("Jupiter") === 1 && c.isKendra(c.houseOf("Mercury")) },
  { stanza: 21, when: "Jupiter is in the 7th or a trine, aspected by the lagna lord", then: "equal in status to that of a king", test: (c) => c.houseOf("Jupiter") === 7 || c.isTrine(c.houseOf("Jupiter")) },
  { stanza: 22, when: "Saturn is in a kendra or trine, exalted or own, aspected by the 10th lord", then: "favour from the king", test: (c) => (c.isKendra(c.houseOf("Saturn")) || c.isTrine(c.houseOf("Saturn"))) && ["Exalted", "Own sign", "Moolatrikona"].includes(c.positions.find((p) => p.planet === "Saturn")!.dignity) },
  { stanza: 27, when: "all the planets are in houses 1 to 6 and the 9th lord is in the 2nd with the Moon", then: "becomes a king", test: (c) => c.positions.every((p) => c.houseOf(p.planet) <= 6) && c.lordHouse(9) === 2 && c.houseOf("Moon") === 2 },
  { stanza: 29, when: "the Moon with Mars is in the 2nd or 3rd, and Rahu is in the 5th", then: "king of kings", test: (c) => [2, 3].includes(c.houseOf("Moon")) && c.houseOf("Moon") === c.houseOf("Mars") && c.houseOf("Rahu") === 5 },
  { stanza: 37, when: "Rahu is in the 10th and Saturn in the 11th", then: "equal in status to that of a king", test: (c) => c.houseOf("Rahu") === 10 && c.houseOf("Saturn") === 11 },
];

export interface SarvarthaContext {
  positions: PlanetPosition[];
  lagnaSign: number;
  houseOf(p: Planet): number;
  lordOf(h: number): Planet;
  lordHouse(h: number): number;
  lordDignity(h: number): Dignity;
  /** Whether the lord of house h is a natural benefic. */
  lordNature(h: number): boolean;
  lordWith(h: number, kind: "benefic" | "malefic" | Planet): boolean;
  lordAspected(h: number, kind: "benefic" | "malefic" | Planet): boolean;
  houseHas(h: number, kind: "benefic" | "malefic" | Planet): boolean;
  isKendra(h: number): boolean;
  isTrine(h: number): boolean;
  isBad(h: number): boolean;
  strong(p: Planet): boolean;
  combust(p: Planet): boolean;
  moonStrong: boolean;
  moonWeak: boolean;
  /** The named Amsha tier (ch. 1.25-27) a planet's ten-fold good-varga count earns, or null. */
  amsa(p: Planet): string | null;
}

const MALEFICS: Planet[] = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];

export function buildSarvarthaContext(positions: PlanetPosition[], lagnaLon: number, vargas?: VargasResult): SarvarthaContext {
  const lagnaSign = Math.floor(((lagnaLon % 360) + 360) % 360 / 30);
  const pos = (p: Planet): PlanetPosition => positions.find((x) => x.planet === p)!;
  const dasaGood = (p: Planet): number =>
    vargas?.planets.find((x) => x.planet === p)?.designation?.dasa?.good ?? 0;
  const amsa = (p: Planet): string | null => {
    const g = dasaGood(p);
    return g >= 2 ? scAmshaName(g) : null;
  };
  const isBenefic = (p: PlanetPosition): boolean => naturalBenefic(p, positions);
  const isMalefic = (p: PlanetPosition): boolean =>
    MALEFICS.includes(p.planet) || (p.planet === "Moon" && !isBenefic(p));
  const houseOf = (p: Planet): number => houseFrom(lagnaSign, pos(p).signIndex);
  const lordOf = (h: number): Planet => SIGN_LORD[(lagnaSign + h - 1) % 12];
  const lordHouse = (h: number): number => houseOf(lordOf(h));
  const lordPos = (h: number): PlanetPosition => pos(lordOf(h));
  const inHouse = (h: number): Planet[] =>
    positions.filter((p) => houseOf(p.planet) === h).map((p) => p.planet);
  const matches = (p: PlanetPosition, kind: "benefic" | "malefic" | Planet): boolean =>
    kind === "benefic" ? isBenefic(p) : kind === "malefic" ? isMalefic(p) : p.planet === kind;
  const lordWith = (h: number, kind: "benefic" | "malefic" | Planet): boolean => {
    const lp = lordPos(h);
    return positions.some(
      (p) => p.planet !== lp.planet && p.signIndex === lp.signIndex && matches(p, kind),
    );
  };
  const lordAspected = (h: number, kind: "benefic" | "malefic" | Planet): boolean => {
    const lp = lordPos(h);
    return positions.some(
      (p) => p.signIndex !== lp.signIndex && drishtiQuarters(p.planet, p.signIndex, lp.signIndex) >= 1 && matches(p, kind),
    );
  };
  const houseHas = (h: number, kind: "benefic" | "malefic" | Planet): boolean => {
    const s = (lagnaSign + h - 1) % 12;
    if (kind === "benefic" || kind === "malefic")
      return positions.some((p) => p.signIndex === s && (kind === "benefic" ? isBenefic(p) : isMalefic(p)));
    return positions.some((p) => p.signIndex === s && p.planet === kind);
  };
  const isKendra = (h: number) => [1, 4, 7, 10].includes(h);
  const isTrine = (h: number) => [1, 5, 9].includes(h);
  const isBad = (h: number) => [6, 8, 12].includes(h);
  const combust = (p: Planet): boolean => {
    const sun = pos("Sun");
    const pp = pos(p);
    return Math.abs(pp.lon - sun.lon) < 7;
  };
  const strong = (p: Planet): boolean => {
    const pp = pos(p);
    return ["Exalted", "Own sign", "Moolatrikona", "Friendly"].includes(pp.dignity) && !combust(p);
  };
  const moonElongation = Math.abs((pos("Moon").lon - pos("Sun").lon + 360) % 360);
  const moonWeak = moonElongation <= 72;
  const moonStrong = moonElongation > 72;
  return {
    positions, lagnaSign, houseOf, lordOf, lordHouse, lordNature: (h) => isBenefic(lordPos(h)),
    lordDignity: (h) => lordPos(h).dignity, lordWith, lordAspected, houseHas, isKendra, isTrine, isBad,
    strong, combust, moonStrong, moonWeak, amsa,
  };
}

type ScTest = (c: SarvarthaContext) => boolean;

/** Tests for the rules whose conditions map cleanly to chart facts; keyed "house.stanza". */
const SC_RULE_TESTS: Record<string, ScTest> = {
  // 1st house (ch. 2)
  "1.69": (c) => c.lordWith(1, "benefic") || c.lordAspected(1, "benefic"),
  "1.72": (c) => c.strong(c.lordOf(1)),
  "1.73": (c) => c.lordWith(1, "malefic") || c.lordHouse(1) === 8,
  "1.94": (c) => c.houseHas(1, "malefic"),
  "1.105": (c) => c.houseHas(1, "Venus"),
  // 2nd house (ch. 3)
  "2.12": (c) => c.lordNature(2) && (c.isKendra(c.lordHouse(2)) || ["Exalted", "Friendly"].includes(c.lordDignity(2))),
  "2.15": (c) => !c.lordNature(2) && c.lordWith(2, "malefic"),
  "2.25": (c) => c.isKendra(c.lordHouse(2)) && c.lordAspected(2, "benefic"),
  "2.27": (c) => c.houseHas(2, "malefic") && (c.lordWith(2, "malefic") || c.lordDignity(2) === "Debilitated"),
  "2.29": (c) => c.lordWith(2, "benefic") && (c.isKendra(c.lordHouse(2)) || c.isTrine(c.lordHouse(2))),
  "2.36": (c) => c.houseHas(2, "Mars"),
  "2.40": (c) => (c.lordOf(2) === "Jupiter" || c.lordOf(2) === "Venus") && (c.lordDignity(2) === "Exalted" || c.lordDignity(2) === "Moolatrikona"),
  "2.41": (c) => c.lordOf(2) === "Jupiter" && c.strong(c.lordOf(2)),
  "2.54": (c) => c.lordHouse(1) === 2 && c.lordHouse(2) === 11 && c.lordHouse(11) === 1,
  "2.88": (c) => c.isKendra(c.lordHouse(1)) && c.isKendra(c.lordHouse(2)),
  "2.109": (c) => c.houseHas(2, "malefic") && c.lordHouse(1) === 12,
  "2.121": (c) => c.isKendra(c.lordHouse(2)) && c.lordWith(2, "Venus"),
  "2.149": (c) => c.houseHas(2, "Saturn") || c.houseHas(2, "Rahu"),
  "2.151": (c) => c.houseHas(2, "Mercury") && !c.strong("Mercury"),
  // 3rd house (ch. 4)
  "3.2": (c) => c.lordHouse(3) === 8 && c.lordHouse(8) === 8,
  "3.15": (c) => c.houseHas(3, "benefic") && c.strong(c.lordOf(3)),
  "3.17": (c) => c.isKendra(c.lordHouse(3)) && ["Exalted", "Own sign", "Friendly"].includes(c.lordDignity(3)),
  "3.24": (c) => c.lordOf(1) !== c.lordOf(3),
  "3.31": (c) => c.strong(c.lordOf(3)) && (c.isKendra(c.lordHouse(3)) || c.isTrine(c.lordHouse(3))),
  "3.36": (c) => c.lordDignity(3) === "Debilitated",
  "3.40": (c) => c.lordWith(3, "Sun"),
  "3.42": (c) => c.lordWith(3, "Saturn"),
  "3.44": (c) => c.lordWith(3, "Rahu") || c.lordWith(3, "Mercury"),
  "3.47": (c) => c.houseHas(3, "Mars"),
  "3.48": (c) => c.houseHas(3, "Saturn"),
  // 4th house (ch. 4)
  "4.55": (c) => c.isKendra(c.lordHouse(4)) && c.lordAspected(4, "benefic"),
  "4.57": (c) => c.isKendra(c.lordHouse(4)),
  "4.63": (c) => c.lordHouse(4) === 8,
  "4.64": (c) => c.lordWith(4, "malefic") && (c.lordDignity(4) === "Debilitated" || c.lordDignity(4) === "Inimical"),
  "4.66": (c) => (c.isKendra(c.lordHouse(4)) || c.isTrine(c.lordHouse(4))) && !c.lordWith(4, "malefic"),
  "4.68": (c) => c.houseHas(4, "benefic") && c.strong("Mercury"),
  "4.69": (c) => c.houseHas(4, "malefic") && c.lordWith(4, "malefic"),
  "4.73": (c) => c.lordWith(4, "malefic") && !c.lordAspected(4, "benefic"),
  "4.75": (c) => c.lordHouse(4) === 4,
  "4.79": (c) => c.lordHouse(4) === 10 && c.lordHouse(10) === 4 && c.strong("Mars"),
  "4.90": (c) => c.lordHouse(4) === 2 && c.lordWith(4, "malefic"),
  "4.97": (c) => c.lordAspected(4, "benefic") && c.houseHas(4, "benefic"),
  "4.101": (c) => c.houseHas(4, "malefic") && !c.strong("Jupiter") && !c.strong(c.lordOf(4)),
  "4.110": (c) => c.lordHouse(4) === 4 && c.lordWith(4, "malefic"),
  "4.135": (c) => c.houseHas(4, "Saturn") && c.houseHas(4, "benefic") === false,
  "4.139": (c) => c.houseHas(4, "malefic"),
  "4.143": (c) => c.houseHas(4, "benefic"),
  "4.148": (c) => c.lordHouse(1) === c.lordHouse(4),
  "4.152": (c) => c.strong(c.lordOf(4)) && c.houseHas(4, "benefic"),
  "4.163": (c) => c.isKendra(c.lordHouse(4)),
  "4.168": (c) => c.lordHouse(4) === 12,
  // 5th house (ch. 5)
  "5.3": (c) => c.houseHas(5, "benefic") && c.lordAspected(5, "benefic"),
  "5.4": (c) => c.lordNature(5) && c.lordWith(5, "benefic"),
  "5.5": (c) => c.lordHouse(1) === 5 && c.strong(c.lordOf(5)) && c.strong("Jupiter"),
  "5.6": (c) => c.lordOf(5) === "Jupiter" && c.strong("Jupiter"),
  "5.14": (c) => c.houseHas(5, "malefic") && c.lordWith(5, "malefic"),
  "5.16": (c) => c.lordDignity(5) === "Debilitated" || c.isBad(c.lordHouse(5)),
  "5.18": (c) => c.isBad(c.lordHouse(5)),
  "5.29": (c) => c.houseHas(5, "malefic"),
  "5.33": (c) => c.lordDignity(5) === "Exalted",
  "5.34": (c) => c.strong("Mercury") && c.lordAspected(5, "benefic") && c.houseHas(5, "benefic"),
  "5.44": (c) => c.houseHas(5, "malefic") && c.lordWith(5, "malefic"),
  "5.47": (c) => c.houseHas(5, "Saturn") && c.lordAspected(5, "malefic"),
  "5.58": (c) => c.lordHouse(1) === c.lordHouse(5),
  "5.65": (c) => c.houseHas(5, "malefic") && c.lordWith(5, "malefic"),
  // 6th house (ch. 5)
  "6.2": (c) => c.lordHouse(6) === 1 || c.lordHouse(6) === 8,
  "6.9": (c) => c.lordWith(6, "Sun"),
  "6.12": (c) => c.lordHouse(7) === 6 && c.lordHouse(7) === 6,
  "6.13": (c) => c.isKendra(c.lordHouse(6)) || c.isTrine(c.lordHouse(6)),
  "6.32": (c) => c.houseHas(6, "Sun"),
  "6.33": (c) => c.houseHas(6, "Moon"),
  "6.36": (c) => c.houseHas(6, "Moon") && c.houseHas(6, "Mars"),
  "6.44": (c) => c.isKendra(c.lordHouse(6)),
  "6.45": (c) => c.lordHouse(6) === 6,
  "6.47": (c) => c.isBad(c.lordHouse(6)) && c.strong(c.lordOf(1)),
  "6.48": (c) => c.lordAspected(6, "benefic") || c.lordWith(6, "benefic"),
  "6.53": (c) => c.lordOf(6) === "Jupiter" && c.lordWith(6, "benefic"),
  "6.54": (c) => c.lordWith(6, "malefic"),
  "6.58": (c) => c.houseHas(6, "benefic") && c.lordWith(6, "benefic"),
  // 7th house (ch. 6)
  "7.2": (c) => c.houseHas(7, "Venus"),
  "7.3": (c) => c.houseHas(7, "Mars"),
  "7.6": (c) => c.lordWith(7, "Rahu") || c.lordWith(7, "Ketu"),
  "7.10": (c) => c.moonWeak && c.houseHas(7, "Moon"),
  "7.12": (c) => c.houseHas(7, "Venus") && c.lordDignity(7) === "Debilitated",
  "7.13": (c) => c.lordHouse(2) === 2 && c.lordHouse(7) === 7,
  "7.15": (c) => c.lordDignity(7) === "Exalted",
  "7.16": (c) => c.lordHouse(1) === 8 && c.houseHas(7, "malefic"),
  "7.25": (c) => c.lordDignity(7) === "Debilitated" || c.combust(c.lordOf(7)),
  "7.31": (c) => c.lordHouse(7) === c.lordHouse(11),
  "7.39": (c) => c.lordDignity(7) === "Debilitated",
  "7.40": (c) => c.lordWith(7, "benefic") || c.lordAspected(7, "benefic"),
  "7.50": (c) => c.lordOf(7) === "Mars" && (c.lordDignity(7) === "Debilitated" || c.combust(c.lordOf(7))),
  "7.55": (c) => c.lordOf(7) === "Venus" && c.strong("Venus") && c.lordWith(7, "benefic"),
  "7.56": (c) => c.lordOf(7) === "Saturn" && c.lordWith(7, "malefic"),
  "7.57": (c) => c.lordOf(7) === "Saturn" && c.lordAspected(7, "benefic"),
  "7.58": (c) => c.houseHas(7, "Rahu") || c.houseHas(7, "Ketu"),
  "7.68": (c) => c.lordDignity(7) === "Debilitated" || c.lordDignity(7) === "Inimical",
  "7.73": (c) => c.lordHouse(7) !== c.lordHouse(1),
  "7.92": (c) => c.houseHas(7, "Mars"),
  "7.110": (c) => c.lordOf(7) === "Moon" || c.lordOf(7) === "Jupiter",
  // 8th house (ch. 7)
  "8.2": (c) => c.lordHouse(8) === 12 || c.lordHouse(8) === 6,
  "8.3": (c) => c.lordHouse(8) === 7,
  "8.5": (c) => c.lordDignity(10) === "Exalted" || c.lordDignity(10) === "Friendly",
  "8.7": (c) => c.isKendra(c.lordHouse(1)) && (c.lordWith(1, "Jupiter") || c.lordWith(1, "Venus")),
  "8.8": (c) => c.isKendra(c.lordHouse(1)) && c.lordWith(1, "benefic"),
  "8.15": (c) => c.houseHas(6, "malefic") && c.houseHas(8, "malefic") && c.houseHas(12, "malefic"),
  "8.17": (c) => c.houseHas(6, "malefic") || c.houseHas(8, "malefic"),
  "8.20": (c) => c.lordDignity(1) === "Inimical",
  "8.27": (c) => c.lordHouse(8) === 6 && c.lordHouse(1) === 6,
  "8.57": (c) => c.houseHas(8, "malefic"),
  "8.58": (c) => c.houseHas(8, "benefic"),
  "8.59": (c) => c.lordWith(8, "malefic"),
  // 9th house (ch. 7)
  "9.2": (c) => c.houseHas(9, "benefic"),
  "9.6": (c) => c.lordNature(9) || c.lordDignity(9) === "Exalted",
  "9.8": (c) => c.lordAspected(9, "benefic"),
  "9.11": (c) => c.lordDignity(9) === "Debilitated",
  "9.13": (c) => c.lordNature(9) && c.houseHas(9, "benefic"),
  "9.17": (c) => c.lordWith(9, "malefic"),
  "9.19": (c) => c.lordDignity(9) === "Debilitated" || c.lordWith(9, "malefic"),
  // 10th house (ch. 8)
  "10.2": (c) => c.lordDignity(10) === "Debilitated" || c.lordWith(10, "malefic"),
  "10.15": (c) => c.lordNature(10) || c.lordAspected(10, "benefic"),
  "10.16": (c) => c.houseHas(10, "Sun") && c.houseHas(10, "Mars"),
  "10.18": (c) => c.isKendra(c.lordHouse(10)) && c.lordWith(10, "benefic"),
  "10.22": (c) => c.lordNature(10) && (c.lordDignity(10) === "Exalted" || c.lordDignity(10) === "Own sign" || c.lordDignity(10) === "Friendly"),
  "10.24": (c) => c.lordWith(10, "malefic"),
  "10.27": (c) => c.houseHas(10, "Jupiter") || c.houseHas(10, "Venus"),
  "10.28": (c) => c.houseHas(10, "malefic"),
  "10.30": (c) => c.lordHouse(6) === 10,
  "10.33": (c) => c.houseHas(10, "malefic"),
  // 11th house (ch. 8)
  "11.2": (c) => c.isKendra(c.lordHouse(11)) || c.isTrine(c.lordHouse(11)) || c.houseHas(11, "malefic"),
  "11.3": (c) => c.lordHouse(2) === 11 && c.lordHouse(11) === 2,
  "11.10": (c) => c.houseHas(11, "malefic"),
  "11.11": (c) => c.lordNature(11) && c.lordAspected(11, "benefic") && c.strong(c.lordOf(11)),
  "11.12": (c) => c.lordWith(11, "malefic"),
  "11.14": (c) => c.houseHas(11, "benefic"),
  "11.15": (c) => c.houseHas(11, "malefic"),
  // 12th house (ch. 8)
  "12.2": (c) => c.houseHas(12, "malefic"),
  "12.3": (c) => c.houseHas(12, "Saturn") || c.houseHas(12, "Rahu"),
  "12.5": (c) => c.houseHas(12, "Jupiter") || c.houseHas(12, "Venus"),
  "12.9": (c) => c.lordWith(12, "malefic") || c.lordHouse(12) === 6,
  "12.10": (c) => c.lordDignity(7) === "Debilitated" && c.lordWith(12, "malefic"),
  "12.11": (c) => !c.strong("Mars") && c.lordWith(12, "malefic"),
  "12.12": (c) => !c.strong(c.lordOf(5)) && c.lordWith(12, "malefic"),
  "12.13": (c) => c.lordWith(12, "Sun"),
  "12.15": (c) => c.lordDignity(12) === "Debilitated",
  "12.25": (c) => c.lordWith(12, "benefic"),
  "12.26": (c) => c.lordWith(12, "malefic"),
  "12.27": (c) => c.houseHas(12, "Jupiter") || c.houseHas(12, "Venus") || c.houseHas(12, "Mercury"),
  // Amsha-tier rules (ch. 1.25-27: the ten-fold good-varga count names the tier).
  "2.18": (c) => c.amsa(c.lordOf(2)) === "Gopura",
  "2.21": (c) => c.amsa("Moon") === "Paravata" && c.houseHas(2, "Moon"),
  "2.22": (c) => ["Simhasana", "Paravata"].includes(c.amsa(c.lordOf(2)) ?? ""),
  "2.24": (c) => c.amsa(c.lordOf(2)) === "Airavata",
  "2.53": (c) => (c.isKendra(c.lordHouse(2)) || c.isTrine(c.lordHouse(2))) && c.amsa(c.lordOf(2)) === "Vaisheshika",
  "3.19": (c) => c.amsa(c.lordOf(3)) === "Gopura" && c.amsa("Mars") === "Simhasana",
  "3.23": (c) => c.amsa(c.lordOf(3)) === "Vaisheshika",
  "3.38": (c) => ["Simhasana", "Paravata", "Gopura"].includes(c.amsa(c.lordOf(3)) ?? ""),
  "4.56": (c) => c.amsa(c.lordOf(4)) === "Vaisheshika",
  "4.60": (c) => ["Simhasana", "Gopura"].includes(c.amsa(c.lordOf(4)) ?? ""),
  "4.61": (c) => c.amsa(c.lordOf(4)) === "Paravata",
  "4.82": (c) => c.lordHouse(4) === 5 && c.amsa(c.lordOf(4)) === "Gopura",
  "4.89": (c) => c.amsa(c.lordOf(4)) === "Vaisheshika" && c.amsa("Mars") === "Vaisheshika",
  "4.144": (c) => c.amsa(c.lordOf(4)) === "Gopura",
  "4.171": (c) => c.amsa(c.lordOf(4)) === "Gopura" && c.strong(c.lordOf(4)),
  "5.7": (c) => c.amsa(c.lordOf(5)) === "Vaisheshika" && c.amsa("Jupiter") === "Vaisheshika",
  "5.19": (c) => c.amsa(c.lordOf(5)) === "Gopura",
  "5.21": (c) => c.amsa(c.lordOf(5)) === "Paravata",
  "5.52": (c) => c.amsa("Jupiter") === "Gopura" || c.amsa(c.lordOf(5)) === "Gopura",
  "5.54": (c) => c.amsa(c.lordOf(5)) === "Gopura",
  "6.57": (c) => c.amsa(c.lordOf(6)) === "Gopura",
  "7.36": (c) => c.amsa(c.lordOf(7)) === "Gopura",
  "7.61": (c) => c.amsa(c.lordOf(7)) === "Paravata",
  "9.14": (c) => c.amsa(c.lordOf(9)) === "Paravata",
  "9.16": (c) => c.amsa("Sun") === "Gopura",
};

export function computeSarvartha(positions: PlanetPosition[], lagnaLon: number, vargas?: VargasResult): SarvarthaResult {
  const ctx = buildSarvarthaContext(positions, lagnaLon, vargas);
  const findings: SarvarthaFinding[] = [];
  let computable = 0;
  let total = 0;
  for (const h of SC_BHAVA_RULES) {
    for (const r of h.rules) {
      total++;
      const test = SC_RULE_TESTS[`${h.house}.${r.stanza}`];
      if (!test) continue;
      computable++;
      if (test(ctx)) findings.push({ house: h.house, stanza: r.stanza, topic: r.topic, text: r.then });
    }
  }
  const rajyogas = SC_RAJYOGAS.filter((r) => r.test && r.test(ctx)).map((r) => ({ stanza: r.stanza, text: r.then }));
  return { findings, rajyogas, computable, total };
}

// ── Ch. 13-16 Dasha phala (ruling periods) ─────────────────────────────────

/** A dasha-phala rule: what a main + sub ruling period gives. Keyed by the house whose lord runs the main period. */
export interface ScDashaPhala {
  house: number; // 0 = general rule
  stanza: number;
  when: string;
  then: string;
}

export const SC_DASHA_PHALA: ScDashaPhala[] = [
  { house: 2, stanza: 20, when: "main period of the lord of the 2nd, with the sub-period of Saturn, Mars, Rahu or the Sun", then: "loss of wealth" },
  { house: 2, stanza: 23, when: "main period of a benefic placed in the 2nd, with the sub-period of a benefic lord of the 2nd", then: "wealth, and pleasure from speech and sons" },
  { house: 3, stanza: 24, when: "main period of the lord of the 3rd, with the sub-period of malefics", then: "loss of brothers and rift with them" },
  { house: 3, stanza: 25, when: "main period of a malefic lord of the 3rd", then: "trouble from fire, thieves and government, with inertia of mind; none if aspected by a benefic" },
  { house: 5, stanza: 28, when: "main period of the lord of the 5th, with the sub-period of malefics", then: "confusion of intellect and bad food; not so with a benefic sub-period lord" },
  { house: 6, stanza: 29, when: "main period of the lord of the 6th, with the sub-period of malefics", then: "suffering from the king's orders, thieves, bad habits, and seminal, colic, consumption or bile diseases" },
  { house: 7, stanza: 30, when: "dasa of a malefic lord of the 7th", then: "opposition from the wife or her death, foreign travel, trouble in the semen and rectum, and the government's wrath" },
  { house: 8, stanza: 31, when: "main period of the lord of the 8th, with the sub-period of Rahu, Mars or Saturn", then: "loss of longevity, fame and wealth, and destruction of wife, relatives and brothers" },
  { house: 9, stanza: 32, when: "main period of the lord of the 9th, with the sub-period of Saturn, Mars, Rahu or the Sun", then: "suffering in career, opposition from brothers, foreign travel and rift; modified in a benefic sub-period if the 9th lord is benefic" },
  { house: 10, stanza: 33, when: "main period of the lord of the 10th, with the sub-period of malefics", then: "imprisonment, sorrow, bad dreams, great mental worry and defame" },
  { house: 11, stanza: 35, when: "main period of the lord of the 11th, with the sub-period of the Sun, Mars, Rahu or Saturn", then: "loss of things, paucity of work and income, and the government's wrath" },
  { house: 12, stanza: 35, when: "main period of the lord of the 12th, with the sub-period of Saturn, the Sun or Mars", then: "mental grief, consumption, loss of honour and wealth; in Rahu's sub-period, trouble from a serpent" },
  { house: 0, stanza: 36, when: "the sub-period lord is a temporary friend of the main-period lord", then: "half the bad results it would give as an enemy" },
  { house: 0, stanza: 36, when: "the main and sub-period lords are 6th or 8th to each other", then: "relinquishment of office or even death" },
];

// ── Ch. 10-12 Longevity (span of life) ─────────────────────────────────────

/** A longevity rule from ch. 10 (span of life) or ch. 11 (cancellation of short life). */
export interface ScLongevity {
  chapter: number;
  stanza: number;
  when: string;
  then: string;
}

export const SC_LONGEVITY: ScLongevity[] = [
  { chapter: 10, stanza: 2, when: "the span of life", then: "less than 32 years is short, 32 to 70 medium, above 70 long, and over 100 the highest (uttam)" },
  { chapter: 10, stanza: 7, when: "the lagna lord is an enemy of the Sun", then: "short life; neutral, medium; a friend, long" },
  { chapter: 10, stanza: 10, when: "the lagna lord and the 8th lord are both in movable signs, or one fixed and one common", then: "long life; both in fixed signs, short; both in common, medium" },
  { chapter: 10, stanza: 8, when: "born in a yoga of short life", then: "death in the dasa of the Vipat star (the 3rd asterism from the birth star)" },
  { chapter: 10, stanza: 9, when: "born in a yoga of long life", then: "death in the dasa of the Vadha star (the 7th asterism from the birth star)" },
  { chapter: 10, stanza: 14, when: "the Vipat, Pratyari or Vadha governing planet is aspected by malefics", then: "physical suffering in those three dasas" },
  { chapter: 11, stanza: 1, when: "Jupiter is in the lagna", then: "destroys the evil of weak planets, like bowing to Shiva destroying sin" },
  { chapter: 11, stanza: 2, when: "the lagna lord is very strong in kendra, with benefics and free of malefic aspect", then: "fortunate, and lives a long life" },
  { chapter: 11, stanza: 5, when: "even one of Jupiter, Venus or Mercury is strong in a kendra, free of malefics", then: "destroys all danger to short life" },
  { chapter: 11, stanza: 9, when: "Jupiter away from the Sun is in the 10th house", then: "destroys all danger to short life" },
  { chapter: 11, stanza: 12, when: "the Moon farthest from the Sun is under benefic aspect, free of malefics", then: "destroys all danger to short life" },
];
