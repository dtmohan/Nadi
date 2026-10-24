// Bhavat bhavam in the timing readings: houses counted from a house (provisional where marked).
//
// Phaladeepika 15.7 (Sastri, wisdomlib ch. 15; the Sanskrit at sanskritdocuments.org) counts from the house
// being judged, as 15.20 directs: in their periods the lord of the 8th from the house, the lord of the 22nd
// drekkana from it, and weak planets in the 6th, 8th and 7th from it (bhava-ari-astama-kama-ga) harm the
// house; strong malefics in the 3rd, 6th and 11th from it, strong benefics in its kendras and trikonas, and
// strong planets friendly to its lord build it. The app's readings: strength is the planet's Shadbala
// against its required strength (shadbala.ts, ch. 27), benefic or malefic is BPHS 3.11 (natures), and
// friendship is natural friendship (astro.ts FRIENDS, the BPHS 3.55 rows for the seven planets). Rahu and
// Ketu have no Shadbala, so they stay out of the clauses that need strength; they rule no sign, so the two
// lordship clauses never name them either. The 22nd drekkana from a house takes the lagna's drekkana into the
// sign eight from the house, as the maraka module does for the lagna (parashari-marakas.ts, 44.17). "Weak"
// is read with the planets in the 6th, 8th and 7th, as the translation has it; the Sanskrit compound could
// also carry it to the two lords. A planet named on both sides is shown on both, and nothing here is netted
// against BPHS 48.2-8.
//
// The count from a house to its lord follows a modern book, Jyotishacharya Shweta, Decoding the Bhavas
// (Volume 2), 2026: ch. 2 §2.3 and the lord-in-house sections of chapters 4-15 read the distance from a
// house to the sign its lord occupies as the way that house delivers, in the sense of the natural house at
// that distance, and §2.2 reads a lord whose count from its house equals the house's own count from the lagna (the
// house 2N-1) as the house's fruition. The book gives no timing rule: carrying the count into the period of
// that lord is the app's step, and §2.4 keeps it a supplement that never changes a verdict. The senses
// below are paraphrased in a few words each, with the sections that state them; nothing is quoted.

import { FRIENDS, SIGNS, SIGN_LORD, type Planet } from "./astro";
import { PHALADEEPIKA_CH15_URL } from "./chalit";
import { listJoin, ordH, thePlanet } from "./house-gloss";
import { shadbalaOf, type ShadbalaResult } from "./shadbala";

export type FromHouseRole = "builds" | "harms";
export type FromHouseClause = "eighth-lord" | "drekkana" | "weak" | "malefic" | "benefic" | "friend";

export interface FromHouseReason {
  role: FromHouseRole;
  clause: FromHouseClause;
  /** Practitioner wording, with the count. */
  text: string;
  /** Plain wording: begins with "it", second person, no verse tags. */
  plain: string;
  /** The same after an earlier reason for the planet: "it also rules ...", strength not repeated. */
  plainAlso: string;
}

export interface FromHouseRow {
  house: number;
  lord: Planet;
  /** The house eight from this one and its lord (the first harming clause). */
  eighth: { house: number; lord: Planet };
  /** The 22nd drekkana from the house; absent when the result carries no lagna degree. */
  drekkana22?: { signIndex: number; index: number; lord: Planet };
  /** False when the chart carries no Shadbala: only the two lordship clauses can be read. */
  rated: boolean;
  /** The planets 15.7 names for this house, in the chart's planet order. */
  named: { planet: Planet; reasons: FromHouseReason[] }[];
}

export interface FromHouseInput {
  lagna: { signIndex: number; degree?: number };
  bhavas: { house: number; signIndex: number; lord: Planet; lordIn: number }[];
  natures: { planet: Planet; house: number; naturalBenefic: boolean }[];
  shadbala?: ShadbalaResult;
}

export const FROM_HOUSE_SOURCE = { label: "Phaladeepika 15.7", url: PHALADEEPIKA_CH15_URL, provisional: true };

/** House n counted on from house `from` (1-based, inclusive): the 1st is the house itself. */
const at = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;
/** How many places on from house `from` house `to` stands (1 = the house itself). */
export const placesFrom = (from: number, to: number) => ((to - from + 12) % 12) + 1;

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];

/** "in the 10th itself" or "in the 4th from the 10th". */
const where = (r: number, house: number) => (r === 1 ? `in the ${ordH(house)} itself` : `in the ${ordH(r)} from the ${ordH(house)}`);
const wherePlain = (r: number, house: number) =>
  r === 1 ? `in your ${ordH(house)} house itself` : `in the ${ordH(r)} counted from your ${ordH(house)} house`;

/** Phaladeepika 15.7 for one house: the planets it names, with the clause behind each. */
export function fromHouse(par: FromHouseInput, house: number): FromHouseRow {
  const bh = (h: number) => par.bhavas.find((b) => b.house === h)!;
  const b = bh(house);
  const lord = b.lord;
  const h8 = at(house, 8);
  const eighth = { house: h8, lord: bh(h8).lord };
  let drekkana22: FromHouseRow["drekkana22"];
  if (par.lagna.degree != null && Number.isFinite(par.lagna.degree)) {
    const index = Math.min(2, Math.max(0, Math.floor(par.lagna.degree / 10)));
    const signIndex = (b.signIndex + 7) % 12;
    drekkana22 = { signIndex, index, lord: SIGN_LORD[(signIndex + index * 4) % 12] as Planet };
  }
  const rated = !!par.shadbala;
  const named: FromHouseRow["named"] = [];
  for (const n of par.natures) {
    const p = n.planet;
    const r = placesFrom(house, n.house);
    const sb = shadbalaOf(par.shadbala, p);
    const reasons: FromHouseReason[] = [];
    if (p === eighth.lord)
      reasons.push({
        role: "harms",
        clause: "eighth-lord",
        text: `lord of the ${ordH(h8)}, the 8th from the ${ordH(house)}`,
        plain: `it rules your ${ordH(h8)} house, the 8th counted from your ${ordH(house)}`,
        plainAlso: `it also rules your ${ordH(h8)} house, the 8th counted from your ${ordH(house)}`,
      });
    if (drekkana22 && p === drekkana22.lord)
      reasons.push({
        role: "harms",
        clause: "drekkana",
        text: `lord of the 22nd drekkana from the ${ordH(house)} (${SIGNS[drekkana22.signIndex]}, ${ordH(drekkana22.index + 1)} drekkana)`,
        plain: `it rules a sensitive third of the 8th sign counted from your ${ordH(house)} house`,
        plainAlso: `it also rules a sensitive third of the 8th sign counted from your ${ordH(house)} house`,
      });
    if (sb && !sb.strong && [6, 8, 7].includes(r))
      reasons.push({
        role: "harms",
        clause: "weak",
        text: `weak by Shadbala (${sb.ratio.toFixed(2)} of the required) ${where(r, house)}`,
        plain: `it is weak and stands ${wherePlain(r, house)}`,
        plainAlso: `it is also weak and stands ${wherePlain(r, house)}`,
      });
    if (sb?.strong) {
      if (!n.naturalBenefic && [3, 6, 11].includes(r))
        reasons.push({
          role: "builds",
          clause: "malefic",
          text: `strong malefic ${where(r, house)}`,
          plain: `it is strong and stands ${wherePlain(r, house)}, where a harsher planet helps`,
          plainAlso: `it also stands ${wherePlain(r, house)}, where a harsher planet helps`,
        });
      if (n.naturalBenefic && (KENDRA.includes(r) || TRIKONA.includes(r)))
        reasons.push({
          role: "builds",
          clause: "benefic",
          text: `strong benefic ${where(r, house)}, ${r === 1 ? "a kendra and a trikona" : KENDRA.includes(r) ? "a kendra" : "a trikona"} from it`,
          plain: `it is strong, gentle by nature, and stands ${wherePlain(r, house)}`,
          plainAlso: `it is also gentle by nature and stands ${wherePlain(r, house)}`,
        });
      if (p !== lord && FRIENDS[lord]?.includes(p))
        reasons.push({
          role: "builds",
          clause: "friend",
          text: `strong natural friend of ${thePlanet(lord)}, the ${ordH(house)} lord`,
          plain: `it is strong and a natural friend of ${thePlanet(lord)}, ruler of your ${ordH(house)} house`,
          plainAlso: `it is also a natural friend of ${thePlanet(lord)}, ruler of your ${ordH(house)} house`,
        });
    }
    if (reasons.length) named.push({ planet: p, reasons });
  }
  return { house, lord, eighth, ...(drekkana22 ? { drekkana22 } : {}), rated, named };
}

/** Builds, harms, or both, for a set of reasons. */
export function roleOf(reasons: FromHouseReason[]): FromHouseRole | "both" {
  if (reasons.every((r) => r.role === "builds")) return "builds";
  if (reasons.every((r) => r.role === "harms")) return "harms";
  return "both";
}

// ── The count from a house to its lord (Shweta, Decoding the Bhavas vol. 2) ──

interface Sense {
  /** Practitioner wording of the book's sense for this distance. */
  text: string;
  /** Plain wording, soft where the book's sense is hard. */
  plain: string;
  /** The book's sections that state the sense. */
  cite: string;
}

/**
 * The reading for each count from a house to the sign of its lord, by the natural house at that distance (§2.3). Index 0
 * is the lord in the house itself (own sign, §1.3 step 1); index 9, the 10th, takes the book's 10th-house
 * meaning (§2.2), since no lord section names it.
 */
export const LORD_DISTANCE: Sense[] = [
  { text: "the house run by its own lord, secure and working with its own means", plain: "a house that runs on its own means", cite: "§1.3" },
  { text: "wealth and accumulation", plain: "growth in money and resources", cite: "§2.3, §14.12" },
  { text: "effort", plain: "results that come through your own effort", cite: "§14.1" },
  { text: "comfort and a stable base", plain: "comfort and a stable base", cite: "§13.1, §14.2" },
  { text: "intelligence, romance and children, a trine to the house", plain: "intelligence, creativity and children", cite: "§10.11, §12.1" },
  { text: "delay, dispute or hard labour", plain: "steady work and patience", cite: "ch. 2, key takeaways" },
  { text: "a mutual gaze with its own house", plain: "a strong, direct link back to the house", cite: "§10.1" },
  { text: "sudden change, transformation or hidden crisis", plain: "change and renewal", cite: "§2.3, §12.4" },
  { text: "luck and dharma", plain: "good fortune and guidance", cite: "§10.3, §14.7" },
  { text: "action, career and authority", plain: "visible action and standing", cite: "§2.2" },
  { text: "gains", plain: "gains", cite: "§9.4" },
  { text: "loss, expenditure or letting go", plain: "spending or letting go", cite: "§2.2, §14.10" },
];

export const LORD_DISTANCE_SOURCE = { label: "Shweta, Decoding the Bhavas vol. 2, §2.3", url: "", provisional: true };

/** The house as many places from `base` as `base` is from the lagna (the house 2N-1): the book's resonant
 *  pair for that house (§2.2), read as the first house's ripening. */
export const pairHouse = (base: number) => ((2 * base - 2) % 12) + 1;

export interface HousePair {
  base: number;
  house: number;
  /** The book's reading of the pair, paraphrased: practitioner and plain. */
  text: string;
  plain: string;
}

/** The two §2.2 pairs that touch a topic of the periods by topic; the classical texts read here give neither. */
export const BOOK_PAIRS: HousePair[] = [
  { base: 5, house: 9, text: "grandchildren, and the 5th's intellect grown into wisdom", plain: "grandchildren, and learning that grows into wisdom" },
  { base: 10, house: 7, text: "business and trade, weighed against the employment of the 10th", plain: "business and trade of your own, set beside the job your 10th house shows" },
];

export const PAIR_SOURCE = { label: "Shweta, Decoding the Bhavas vol. 2, §2.2", url: "", provisional: true };

export interface LordDistance {
  house: number;
  lord: Planet;
  lordIn: number;
  /** 1 = in the house itself, 2 = in the next house, and so on. */
  places: number;
  /** The lord as many places from its house as the house is from the lagna (§2.2), past the 1st. */
  resonance: boolean;
  text: string;
  textPlain: string;
}

/** The book's count from a house to the sign its lord occupies, worded for the period of that lord.
 *  `again`: a second line for the same period, so the plain wording names the author once. */
export function lordDistance(par: Pick<FromHouseInput, "bhavas">, house: number, again = false): LordDistance {
  const b = par.bhavas.find((x) => x.house === house)!;
  const places = placesFrom(house, b.lordIn);
  const s = LORD_DISTANCE[places - 1];
  const resonance = places === house && house !== 1;
  const P = thePlanet(b.lord);
  const text = `Counted from the ${ordH(house)}, ${b.lord} sits ${places === 1 ? "in the house itself" : `${ordH(places)} from it, in the ${ordH(b.lordIn)}`}: Shweta reads that as ${s.text} (${s.cite})${resonance ? `, and a lord as many places from its house as the house is from the lagna as the house's fruition (§2.2)` : ""}.`;
  const textPlain = `Counting from your ${ordH(house)} house, ${P} sits ${places === 1 ? "in that house itself" : `in the ${ordH(places)} from it, your ${ordH(b.lordIn)} house`}, which ${again ? "she" : "Shweta, a modern author,"} reads as ${s.plain}${resonance ? ", and as the house coming to fruition" : ""}.`;
  return { house, lord: b.lord, lordIn: b.lordIn, places, resonance, text, textPlain };
}

export const BHAVAT_NOTE =
  "Counted from the house itself (15.20): in their periods, 15.7 has the 8th lord from a house, the lord of its 22nd drekkana and weak planets in its 6th, 8th and 7th harm it, and strong malefics in its 3rd, 6th and 11th, strong benefics in its kendras and trikonas and strong friends of its lord build it. Work is counted from the 10th, money from the 2nd and 11th, health from the 1st, family from the 5th and 7th. Strength is Shadbala against the required strength (ch. 27), benefics by 3.11, friends by natural friendship; Rahu and Ketu have no Shadbala and are not counted. The 22nd drekkana takes the lagna's drekkana into the 8th sign from the house; \"weak\" is read with the 6th, 8th and 7th only, as the translation has it, though the Sanskrit compound could carry it to the two lords. A period named on both sides is shown as both, and none of it is netted against 48.2-8. Beside each 48.2-8 period, a modern book (Shweta, Decoding the Bhavas vol. 2, §2.3) reads how the house delivers from the place of its lord counted from the house; the book gives no timing, so carrying it into the period is the app's step, and §2.4 keeps it a supplement that never moves a verdict. Two of the book's pairs (§2.2) sit under their topics as lines without tone, each in the period of the second house's lord: the 7th, the 10th from the 10th, for business and trade beside employment, under work; the 9th, the 5th from the 5th, for grandchildren, under family. The classical texts read here give neither pair. The houses chosen and these readings are the app's (provisional).";

export const BHAVAT_NOTE_PLAIN =
  "Phaladeepika also judges a house by counting from the house itself, as if it were the rising sign, and names the periods that help it and those that ask for care with it. Work is counted from your 10th house, money from the 2nd and 11th, health from the 1st, family from the 5th and 7th. A period can be named on both sides, and then both are shown. Under each of Parashara's periods, a modern author, Shweta, adds how the house tends to deliver, from where its ruler sits counted from the house; she gives this for the birth chart, so using it for the period is the app's step. Two more lines come from her pairs of houses, each in the period of that house's ruler: under work, your 7th house, the 10th counted from your 10th, which she reads as business and trade; under family, your 9th house, the 5th counted from your 5th, which she reads as grandchildren. Treat all of these as provisional.";

/** The words for a period's place in 15.7. */
export const FROM_HOUSE_WORD: Record<FromHouseRole | "both", string> = { builds: "builds", harms: "strains", both: "both" };

/** "it rules ..., and it also ..." joined for a plain sentence: strength is said once. */
export const plainReasons = (rs: FromHouseReason[]) =>
  rs.length ? [rs[0].plain, ...rs.slice(1).map((r) => r.plainAlso)].join(", and ") : "";
