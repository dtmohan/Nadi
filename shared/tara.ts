// The Tara classification: nine stars counted from the birth star (the Moon's nakshatra), repeated
// every nine. The 3rd (Vipat), 5th (Pratyari) and 7th (Vadha, also Naidhana) are the adverse stars
// that work against the birth star — the "Vainashika" of the Kerala reading. Each nakshatra has a
// Vimshottari dasa lord, so an adverse tara names the dasa lords whose periods carry the danger.
// Source: Sarvartha Chintamani 10.8-9, 10.14; Prasna Marga glossary "Vipat — third star from the
// birth star".
import { NAKSHATRAS, type Planet } from "./astro";
import { VIMSHOTTARI_ORDER } from "./kp";

export const TARA_NAMES = [
  "Janma",
  "Sampat",
  "Vipat",
  "Kshema",
  "Pratyari",
  "Sadhaka",
  "Vadha",
  "Mitra",
  "Parama-Mitra",
] as const;

/** The adverse tara: the 3rd, 5th and 7th stars from the birth star. */
export const ADVERSE_TARA = [3, 5, 7] as const;

export interface Tara {
  tara: number; // 1..9
  name: (typeof TARA_NAMES)[number];
  /** True for the 3rd, 5th and 7th tara, which work against the birth star. */
  adverse: boolean;
}

/** The tara of a target star (0..26) counted from the birth star (0..26), 1..9. */
export function taraOf(birthStar: number, targetStar: number): Tara {
  const t = ((((targetStar - birthStar) % 27) + 27) % 27) % 9 + 1;
  return { tara: t, name: TARA_NAMES[t - 1], adverse: ADVERSE_TARA.includes(t as (typeof ADVERSE_TARA)[number]) };
}

export interface AdverseTara {
  tara: number;
  name: (typeof TARA_NAMES)[number];
  /** The nakshatra index (0..26) of the adverse star. */
  nakshatra: number;
  nakshatraName: string;
  /** The Vimshottari dasa lord governing that nakshatra. */
  lord: Planet;
}

/** The three adverse stars of a birth star, with the dasa lord each is governed by. */
export function adverseTara(birthStar: number): AdverseTara[] {
  return ADVERSE_TARA.map((t) => {
    const nakshatra = (birthStar + (t - 1)) % 27;
    return {
      tara: t,
      name: TARA_NAMES[t - 1],
      nakshatra,
      nakshatraName: NAKSHATRAS[nakshatra],
      lord: VIMSHOTTARI_ORDER[nakshatra % 9],
    };
  });
}
