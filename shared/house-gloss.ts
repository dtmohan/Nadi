/**
 * Short glosses for the twelve houses, one list per system, so a reading that names a house can say
 * what the house stands for in that system's own terms. Each system draws only on its own list:
 * nothing is blended. The picks leave out the matters the gentle reading softens (death, disease,
 * accidents, loss, body parts); the full lists stay with each system (HOUSE_MATTERS in
 * parashari-houses.ts, ALP_HOUSE_THEMES in rules-alp.ts, KP_CUSP_THEMES in rules-kp.ts,
 * PRASNA_BHAVA_SIGNIFICATIONS in rules-prasna.ts).
 *
 * This module imports nothing, so any module can use it without an import cycle.
 */

export type GlossSystem = "parashari" | "alp" | "kp" | "prasna";

/**
 * Parashari: a short plain label per house, picked from the BPHS 11.2-13 matters (HOUSE_MATTERS).
 */
export const HOUSE_AREAS_PLAIN: Record<number, string> = {
  1: "body and nature",
  2: "wealth and family",
  3: "courage and siblings",
  4: "mother, home and comforts",
  5: "learning and children",
  6: "enemies and maternal relatives",
  7: "spouse, travel and trade",
  8: "inheritance and conflict",
  9: "fortune and religion",
  10: "work, honour and authority",
  11: "income and prosperity",
  12: "expenses",
};

/** ALP: picked from the Book 1 class notes on what each house from the ALP lagna stands for (ALP_HOUSE_THEMES). */
export const ALP_HOUSE_GLOSS: Record<number, string> = {
  1: "self and how life is handled",
  2: "income, education, family and speech",
  3: "efforts, communication and the younger sibling",
  4: "house, vehicles and the mother",
  5: "mind, love and children",
  6: "short-term debts, enemies and disputes",
  7: "marriage, spouse and partnership",
  8: "long-term debts, disputes and sudden luck",
  9: "blessings, the father and spiritual travel",
  10: "job, business and profession",
  11: "gains, promotion and the elder sibling",
  12: "travel, foreign lands, expenses and investments",
};

/**
 * KP: picked from K. S. Shanmugam, Astro Secrets & KP Part 1, ch. 16 "The 12 Houses" (the page of
 * each house's list is in KP_HOUSE_GLOSS_PAGES), with the 1st from Part 3 ch. 6 pp. 39-40.
 */
export const KP_HOUSE_GLOSS: Record<number, string> = {
  1: "health, appearance and temperament",
  2: "money, speech and family",
  3: "siblings, communications and short travel",
  4: "mother, education, home and vehicles",
  5: "children, intelligence and love affairs",
  6: "service, enemies and obstacles",
  7: "marriage, partners and agreements",
  8: "inheritance, insurance and debts",
  9: "worship, research and long journeys",
  10: "profession, name and honour",
  11: "gains, fulfilment of desires and friends",
  12: "expenses, investment and going abroad",
};

/** Where each KP pick is found in the user's copy of the books. */
export const KP_HOUSE_GLOSS_PAGES: Record<number, string> = {
  1: "Part 3 ch. 6 pp. 39-40",
  2: "Part 1 ch. 16 p. 118",
  3: "Part 1 ch. 16 p. 132",
  4: "Part 1 ch. 16 p. 136",
  5: "Part 1 ch. 16 p. 144",
  6: "Part 1 ch. 16 p. 153",
  7: "Part 1 ch. 16 p. 158",
  8: "Part 1 ch. 16 p. 180",
  9: "Part 1 ch. 16 p. 183",
  10: "Part 1 ch. 16 p. 191",
  11: "Part 1 ch. 16 pp. 200-201",
  12: "Part 1 ch. 16 p. 206",
};

/** Prasna Marga: picked from the bhava significations of 14.3-14 (PRASNA_BHAVA_SIGNIFICATIONS). */
export const PRASNA_HOUSE_GLOSS: Record<number, string> = {
  1: "the body, health and strength",
  2: "family, wealth and speech",
  3: "courage, brothers and help",
  4: "mother, relatives, house and vehicles",
  5: "intelligence, children and the mind",
  6: "enemies, obstacles and worries",
  7: "marriage, the spouse and relations with others",
  8: "obstructions, servants and outhouses",
  9: "fortune, the father and preceptors",
  10: "actions, the power to command and service",
  11: "gains of things desired and the elder brother",
  12: "expenses",
};

const LISTS: Record<GlossSystem, Record<number, string>> = {
  parashari: HOUSE_AREAS_PLAIN,
  alp: ALP_HOUSE_GLOSS,
  kp: KP_HOUSE_GLOSS,
  prasna: PRASNA_HOUSE_GLOSS,
};

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th". */
export function ordH(n: number): string {
  const m = n % 100;
  const s = m >= 11 && m <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${s}`;
}

/** "the Sun", "the Moon"; every other planet by its bare name. */
export function thePlanet(p: string): string {
  return p === "Sun" || p === "Moon" ? `the ${p}` : p;
}

/** "a", "a and b", "a, b and c". */
export function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** The short gloss of a house in a system's own list ("" outside 1..12). */
export function houseGloss(system: GlossSystem, h: number): string {
  return LISTS[system][h] ?? "";
}

/** "5th (learning and children)". */
export function withGloss(system: GlossSystem, h: number): string {
  const g = houseGloss(system, h);
  return g ? `${ordH(h)} (${g})` : ordH(h);
}

/** "4th (mother, home and comforts) and 9th (fortune and religion)"; `the` puts "the" before each later house. */
export function withGlossList(system: GlossSystem, hs: number[], opts: { the?: boolean } = {}): string {
  const parts = hs.map((h, i) => (opts.the && i > 0 ? `the ${withGloss(system, h)}` : withGloss(system, h)));
  return listJoin(parts);
}
