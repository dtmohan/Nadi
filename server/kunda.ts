import { NAKSHATRAS, norm360 } from "@shared/astro";
import { zodiacQuarter } from "@shared/zodiac-quarter";
import type { KundaCheck } from "@shared/rectify-types";

const STAR_ARC = 360 / 27;
const SECOND = 1 / 86400;

/**
 * Nava-navamsa interpretation of Kunda: longitude of lagna × 81, reduced to
 * a circle, then read as one of 27 nakshatras. This is distinct from the
 * arithmetic in Raman's worked example, which the app also retains.
 */
export function kundaD81Check(lagnaLon: number, moonLon: number): KundaCheck {
  const longitude = norm360(lagnaLon * 81);
  const kundaNakshatra = zodiacQuarter(longitude).starIndex;
  const birthStar = zodiacQuarter(moonLon).starIndex;
  const trine = [birthStar, (birthStar + 9) % 27, (birthStar + 18) % 27].includes(
    kundaNakshatra,
  );
  return {
    remainder: longitude,
    kundaNakshatra,
    birthStar,
    trine,
    via: `${NAKSHATRAS[kundaNakshatra]} ${trine ? "is" : "is not"} the birth star ${NAKSHATRAS[birthStar]} or one of its trines`,
    score: trine ? 1 : 0,
    max: 1,
  };
}

export interface KundaD81Interval {
  start: number;
  end: number;
  mid: number;
  check: KundaCheck;
}

/**
 * Scan D81 separately from the KP intervals. The ascendant is sampled at most
 * ten seconds apart; observed rapid motion is subdivided. At extreme latitudes
 * a complete unobserved cycle between samples cannot be ruled out.
 * Boundaries are narrowed to 0.2 seconds, below the UI's one-second precision.
 * The two longitude functions take Julian days and use the chart's ayanamsa.
 */
export function scanKundaD81(
  start: number,
  end: number,
  ascendant: (jd: number) => number,
  moon: (jd: number) => number,
): KundaD81Interval[] {
  type Sample = { jd: number; asc: number; check: KundaCheck; key: string };
  const sample = (jd: number): Sample => {
    const asc = norm360(ascendant(jd));
    const check = kundaD81Check(asc, moon(jd));
    return { jd, asc, check, key: `${check.kundaNakshatra}:${check.birthStar}` };
  };
  const edges: number[] = [];
  const walk = (a: Sample, b: Sample) => {
    const width = b.jd - a.jd;
    if (width <= 0.2 * SECOND) {
      if (a.key !== b.key) edges.push(b.jd);
      return;
    }
    const delta = Math.abs(norm360(b.asc - a.asc + 180) - 180);
    // Half a D81 nakshatra in ascendant longitude. Subdivide fast motion even
    // if both endpoint names match. A full unobserved cycle remains possible.
    if (a.key === b.key && delta <= STAR_ARC / 162) return;
    const m = sample((a.jd + b.jd) / 2);
    walk(a, m);
    walk(m, b);
  };
  let a = sample(start);
  while (a.jd < end) {
    const b = sample(Math.min(end, a.jd + 10 * SECOND));
    walk(a, b);
    a = b;
  }
  const bounds = [start, ...edges.filter((x) => x > start && x < end), end];
  return bounds.slice(0, -1).map((a, i) => {
    const b = bounds[i + 1];
    const mid = (a + b) / 2;
    return { start: a, end: b, mid, check: sample(mid).check };
  });
}
