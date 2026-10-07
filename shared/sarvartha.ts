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
