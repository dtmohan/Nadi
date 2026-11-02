/**
 * Shared geometry of the 27 equal nakshatras and their 108 equal quarters.
 * Each quarter is one D9 interval; an interval includes its start and excludes
 * its end. No school-specific meaning or score is assigned here.
 * BPHS 6.12 gives the navamsa sign sequence; the identity with a nakshatra
 * quarter follows from both divisions measuring 3°20′ from the zodiac origin.
 * https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6
 */
export const ZODIAC_QUARTER_DEG = 10 / 3;
export interface ZodiacQuarter {
  longitude: number;
  signIndex: number;
  starIndex: number;
  pada: 1 | 2 | 3 | 4;
  quarterIndex: number;
  quarterOfSign: number;
  navamsaSign: number;
  /** Fraction through this quarter, 0 inclusive and 1 exclusive. */
  fraction: number;
  /** Fraction through this star, 0 inclusive and 1 exclusive. */
  starFraction: number;
}

export function zodiacQuarter(lon: number): ZodiacQuarter {
  if (!Number.isFinite(lon)) throw new RangeError("A finite sidereal longitude is required");
  // Keep the existing normalization away from the edges so downstream period
  // dates do not change merely because of a different floating-point route.
  const wrapped = ((lon % 360) + 360) % 360;
  const scaled = wrapped * 3 / 10;
  const nearest = Math.round(scaled);
  // Only compensate for floating-point representation of a nominal exact
  // edge, not for birth-time, ayanamsa, ephemeris or astrological uncertainty.
  const onEdge = Math.abs(scaled - nearest) <= 16 * Number.EPSILON * 108;
  const index = (onEdge ? nearest : Math.floor(scaled)) % 108;
  const starArc = 360 / 27;
  const quarterArc = starArc / 4;
  const fraction = onEdge ? 0 : (wrapped - Math.floor(index / 4) * starArc - (index % 4) * quarterArc) / quarterArc;
  return {
    longitude: onEdge ? index * ZODIAC_QUARTER_DEG : wrapped,
    signIndex: Math.floor(index / 9),
    starIndex: Math.floor(index / 4),
    pada: (index % 4 + 1) as ZodiacQuarter["pada"],
    quarterIndex: index,
    quarterOfSign: index % 9 + 1,
    navamsaSign: index % 12,
    fraction,
    starFraction: onEdge ? (index % 4) / 4 : (wrapped - Math.floor(index / 4) * starArc) / starArc,
  };
}

export function sameZodiacQuarter(a: number, b: number): boolean {
  return zodiacQuarter(a).quarterIndex === zodiacQuarter(b).quarterIndex;
}

/** Smallest angular distance, independent of whether a quarter boundary intervenes. */
export function zodiacSeparation(a: number, b: number): number {
  const delta = ((a - b) % 360 + 360) % 360;
  return Math.min(delta, 360 - delta);
}
