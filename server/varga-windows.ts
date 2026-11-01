import { norm360 } from "@shared/astro";
import { vargaSignAt } from "@shared/parashari-varga-evidence";

/** The sequence shown in Manley's example funnel; no choice or ranking is made. */
export const MANLEY_WINDOW_DIVISIONS = ["D1", "D4", "D7", "D9", "D10", "D24", "D60"] as const;
export type ManleyWindowDivision = (typeof MANLEY_WINDOW_DIVISIONS)[number];

export interface VargaWindow {
  start: number;
  end: number;
  sign: number;
}

/**
 * Scan ascendant signs independently of the KP/event slices. Initial samples
 * are at most 10 seconds apart; rapid observed ascendant motion is subdivided,
 * and detected changes are bracketed within 0.2 seconds. At extreme latitudes,
 * a complete unobserved cycle between samples cannot be ruled out.
 */
export function scanVargaWindows(
  start: number, end: number, ascendant: (jd: number) => number,
): Record<ManleyWindowDivision, VargaWindow[]> {
  type Sample = { jd: number; asc: number; signs: number[]; key: string };
  const sample = (jd: number): Sample => {
    const asc = norm360(ascendant(jd));
    const signs = MANLEY_WINDOW_DIVISIONS.map((d) => vargaSignAt(d, asc));
    return { jd, asc, signs, key: signs.join(":") };
  };
  const edges: number[] = [];
  const walk = (a: Sample, b: Sample) => {
    const width = b.jd - a.jd;
    if (width <= 0.2 / 86400) {
      if (a.key !== b.key) edges.push(b.jd);
      return;
    }
    const delta = Math.abs(norm360(b.asc - a.asc + 180) - 180);
    // Half of one D60 division, so observed fast motion is not skipped.
    if (a.key === b.key && delta <= 0.25) return;
    const mid = sample((a.jd + b.jd) / 2);
    walk(a, mid);
    walk(mid, b);
  };
  let left = sample(start);
  while (left.jd < end) {
    const right = sample(Math.min(end, left.jd + 10 / 86400));
    walk(left, right);
    left = right;
  }
  const bounds = [start, ...edges.filter((e) => e > start && e < end), end];
  const out = Object.fromEntries(MANLEY_WINDOW_DIVISIONS.map((d) => [d, []])) as unknown as Record<ManleyWindowDivision, VargaWindow[]>;
  for (let i = 0; i + 1 < bounds.length; i++) {
    const a = bounds[i], b = bounds[i + 1];
    if (b <= a) continue;
    const signs = sample((a + b) / 2).signs;
    MANLEY_WINDOW_DIVISIONS.forEach((division, k) => {
      const rows = out[division], last = rows[rows.length - 1];
      if (last && last.sign === signs[k]) last.end = b;
      else rows.push({ start: a, end: b, sign: signs[k] });
    });
  }
  return out;
}
