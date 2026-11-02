/** Frame-independent geometry and explicitly attributed modern quarter tags.
 * The caller supplies the frame/ayanamsa. These tags do not infer an event. */
import { EXALTATION, NAKSHATRAS, NAKSHATRA_LORD, OWN_SIGNS, SIGN_LORD, SIGNS, type Planet } from "./astro";
import { sameZodiacQuarter, zodiacQuarter, zodiacSeparation, ZODIAC_QUARTER_DEG, type ZodiacQuarter } from "./zodiac-quarter";

export const SUTTON_QUARTER_SOURCE = {
  label: "Komilla Sutton, The Nakshatras (2014), ch. 3 pp. 28–37 and ch. 7 pp. 267–270",
  url: "https://www.wessexastrologer.com/product/wanak001/",
} as const;
export const SUTTON_GANDANTA_DEG = 48 / 60;
export const NAIK_PADA_SOURCE = {
  label: "Satyanarayana Naik, Prediction Secrets – Naadi Astrology, Modified Moods of Planets",
  url: "https://www.everand.com/book/589336080/Prediction-Secrets-Naadi-Astrology",
} as const;

export interface NakshatraContext extends ZodiacQuarter {
  star: string;
  starLord: Planet;
  navamsa: string;
  navamsaLord: Planet;
  /** The same D1 and D9 sign, a geometric relationship also used by classical texts. */
  vargottama: boolean;
  /** Sutton's definitions, not a universal evaluation or cancellation. */
  sutton: Readonly<{ pushkara: boolean; ashtamamsha: boolean; gandanta: boolean; junctionDistanceDeg: number }>;
}

export function nakshatraContext(lon: number): Readonly<NakshatraContext> {
  const q = zodiacQuarter(lon);
  const pushkara = [[6, 8], [2, 4], [5, 7], [0, 2]][q.signIndex % 4].includes(q.quarterOfSign - 1);
  const distance = Math.min(...[0, 120, 240].map((b) => Math.abs(((q.longitude - b + 540) % 360) - 180)));
  return Object.freeze({ ...q, star: NAKSHATRAS[q.starIndex], starLord: NAKSHATRA_LORD[q.starIndex],
    navamsa: SIGNS[q.navamsaSign], navamsaLord: SIGN_LORD[q.navamsaSign], vargottama: q.signIndex === q.navamsaSign,
    sutton: Object.freeze({ pushkara, ashtamamsha: (q.navamsaSign - q.signIndex + 12) % 12 === 7,
      gandanta: distance <= SUTTON_GANDANTA_DEG + 1e-10, junctionDistanceDeg: distance }) });
}

/** Sign-level dignity only; nodes have no adopted exaltation scheme here. */
export function navamsaDignity(planet: Planet, sign: number): "exaltation" | "own" | "debilitation" | "other" | "unassessed" {
  const ex = EXALTATION[planet];
  if (!ex) return "unassessed";
  if (sign === ex.sign) return "exaltation";
  if (sign === (ex.sign + 6) % 12) return "debilitation";
  if (OWN_SIGNS[planet]?.includes(sign)) return "own";
  return "other";
}

/** Existing Nadi scope excludes the Sun and nodes; the source's brief rule
 * does not explicitly settle the nodes. Proximity is an alternative diagnostic. */
export function naikSolarContact(planet: Planet, lon: number, sunLon: number) {
  if (planet === "Sun" || planet === "Rahu" || planet === "Ketu") return undefined;
  const separation = zodiacSeparation(lon, sunLon);
  return Object.freeze({ samePada: sameZodiacQuarter(lon, sunLon), separationDeg: separation,
    withinPadaWidth: separation <= ZODIAC_QUARTER_DEG });
}
