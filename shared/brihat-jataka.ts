import type { Planet } from "./astro";

/**
 * Brihat Jataka ch. 26 "Lost Horoscope" (Nashta Jataka), stanzas 9-10: Varahamihira's method for
 * recovering the querent's birth nakshatra from the query lagna. The lagna is multiplied by the
 * Rasi factor (9.1) and, for each planet in the rising sign, by the Graha factor (9.2), the products
 * are reduced by 12, summed, multiplied by 7, adjusted by 9 for the sign's character, and reduced
 * by 27 (10). The worked example (lagna 5s 10°20' in Virgo with Jupiter and Venus) gives a sum of
 * 9s 17°20'. The unit of the ±9 adjustment follows the text's own note that every remainder is in
 * signs; Bhatta-Utpala instead keys it to the rising drekkana, so the adjustment is provisional.
 */

export const BJ_RASI_FACTOR: number[] = [
  7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12, // Aries .. Pisces
];

export const BJ_GRAHA_FACTOR: Partial<Record<Planet, number>> = {
  Sun: 5,
  Moon: 5,
  Mars: 8,
  Mercury: 5,
  Jupiter: 10,
  Venus: 7,
  Saturn: 5,
  Rahu: 5,
  Ketu: 5,
};

const norm = (x: number, m: number) => ((x % m) + m) % m;

/** The Rasi + Graha factor sum (stanza 9), in signs. */
export function nashtaFactorSum(lagnaLon: number, planetsInSign: Planet[]): number {
  const signIdx = Math.floor(norm(lagnaLon, 360) / 30);
  const lagnaSigns = lagnaLon / 30;
  const rasi = BJ_RASI_FACTOR[signIdx];
  const R = norm(lagnaSigns * rasi, 12);
  const G = planetsInSign.reduce(
    (acc, p) => acc + norm(lagnaSigns * (BJ_GRAHA_FACTOR[p] ?? 5), 12),
    0,
  );
  return R + G;
}

/** The birth nakshatra read from the query lagna (stanzas 9-10). */
export function nashtaNakshatra(lagnaLon: number, planetsInSign: Planet[]): number {
  const signIdx = Math.floor(norm(lagnaLon, 360) / 30);
  const sum = nashtaFactorSum(lagnaLon, planetsInSign);
  const movable = [0, 3, 6, 9].includes(signIdx);
  const common = [2, 5, 8, 11].includes(signIdx);
  const adj = movable ? 9 : common ? -9 : 0;
  return Math.floor(norm(sum * 7 + adj, 27)) % 27;
}
