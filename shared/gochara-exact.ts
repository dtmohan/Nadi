// Exact transit aspects: a modern timing marker on the transit calendar, shown in the practitioner view only. It never
// colours anything and nothing counts it; the classical verdicts (Brihat Samhita 104, Phaladeepika 26) are unchanged.
//
// V.K. Choudhry and K.R. Chaudhary, Impact of Rahu & Ketu (Systems' Approach), paraphrased:
//  - the influence of a transit or natal conjunction or aspect is greatest within one degree on either side and
//    tapers as it separates (printed pp. 41-42);
//  - every planet aspects the 7th; Saturn also the 3rd and 10th; Jupiter, Rahu and Ketu also the 5th and 9th; an
//    aspect within one degree is exact (ch. 3, printed pp. 19-20).
// Shweta, Decoding the Bhavas vol. 2, §17.4 (p. 145): Rahu's 5th, 7th and 9th aspects are widely accepted; Ketu's
// are disputed. Parashara gives the nodes no aspects (BPHS 26).
//
// Slow planets only (Jupiter, Saturn, Rahu, Ketu), as approved. Counted by whole sign, with "apart" the difference of
// degrees within the two signs, as in the natal node-aspect note (shared/parashari-node-aspects.ts) and in
// Choudhry's own example (p. 42). A node's 7th always falls on the other node, so it is shown once, as the other
// node's conjunction (the axis). The transiting nodes are not tested on the natal nodes: that is the 18.6-year
// return of the axis, not an aspect. Provisional.

import type { Planet } from "./astro";

export const EXACT_TRANSIT_PLANETS = ["Jupiter", "Saturn", "Rahu", "Ketu"] as const;
export type ExactTransitPlanet = (typeof EXACT_TRANSIT_PLANETS)[number];

/** Choudhry, pp. 41-42: greatest within one degree on either side. */
export const EXACT_ORB_DEG = 1;

/** Houses counted from the transiting planet: 1 is the conjunction. The nodes' 7th is the other node's conjunction. */
export const EXACT_ASPECTS: Readonly<Record<ExactTransitPlanet, readonly number[]>> = {
  Jupiter: [1, 5, 7, 9],
  Saturn: [1, 3, 7, 10],
  Rahu: [1, 5, 9],
  Ketu: [1, 5, 9],
};

const NATAL_TARGETS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const EXACT_SOURCES = {
  orb: { label: "V.K. Choudhry, Impact of Rahu & Ketu, pp. 41-42", url: "", provisional: true },
  aspects: { label: "V.K. Choudhry, Impact of Rahu & Ketu, ch. 3, pp. 19-20", url: "", provisional: true },
  rahu: { label: "Shweta, Decoding the Bhavas vol. 2, §17.4, p. 145", url: "", provisional: true },
} as const;

export const EXACT_LABEL = "Modern timing marker: within 1° of exact, shown only, never colouring or counted";

export interface ExactHit {
  planet: ExactTransitPlanet;
  natal: Planet;
  /** House from the transiting planet: 1 conjunction, else the aspect. */
  nth: number;
  /** Degrees apart within the signs. */
  apart: number;
}

export interface ExactPass extends ExactHit {
  start: string; // ISO UTC, first day within the orb
  end: string; // ISO UTC, last day within the orb
  /** The day it comes closest, and `apart` is the distance then. */
  peak: string;
}

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const degIn = (lon: number) => (((lon % 360) + 360) % 360) % 30;

/** The slow planets within one degree of an exact conjunction or aspect to a natal planet at one instant. */
export function exactHits(
  transit: ReadonlyArray<{ planet: Planet; lon: number }>,
  natal: ReadonlyArray<{ planet: Planet; lon: number }>,
): ExactHit[] {
  const out: ExactHit[] = [];
  for (const t of transit) {
    const nths = EXACT_ASPECTS[t.planet as ExactTransitPlanet];
    if (!nths) continue;
    const node = t.planet === "Rahu" || t.planet === "Ketu";
    for (const n of natal) {
      if (!NATAL_TARGETS.includes(n.planet)) continue;
      if (node && (n.planet === "Rahu" || n.planet === "Ketu")) continue;
      const nth = ((signOf(n.lon) - signOf(t.lon) + 12) % 12) + 1;
      if (!nths.includes(nth)) continue;
      const apart = Math.abs(degIn(t.lon) - degIn(n.lon));
      if (apart <= EXACT_ORB_DEG) out.push({ planet: t.planet as ExactTransitPlanet, natal: n.planet, nth, apart });
    }
  }
  return out;
}

const ORD = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const natalName = (p: Planet) => (p === "Sun" || p === "Moon" ? `the natal ${p}` : `natal ${p}`);

/** "Jupiter's 5th aspect on the natal Moon"; "Rahu conjunct natal Venus (the axis: Ketu opposite)". */
export function exactPassLabel(p: ExactHit): string {
  if (p.nth === 1) {
    const other = p.planet === "Rahu" ? "Ketu" : p.planet === "Ketu" ? "Rahu" : null;
    return `${p.planet} conjunct ${natalName(p.natal)}${other ? ` (the axis: ${other} opposite)` : ""}`;
  }
  return `${p.planet}'s ${ORD(p.nth)} aspect on ${natalName(p.natal)}${p.planet === "Ketu" ? " (Ketu's aspects are disputed)" : ""}`;
}

/** The sources for one pass: the orb, the aspects, and for the nodes' aspects Shweta. */
export function exactPassSources(p: ExactHit) {
  const s: Array<{ label: string; url: string; provisional?: boolean }> = [EXACT_SOURCES.orb, EXACT_SOURCES.aspects];
  if ((p.planet === "Rahu" || p.planet === "Ketu") && p.nth !== 1) s.push(EXACT_SOURCES.rahu);
  return s;
}

/**
 * Group daily samples into passes: consecutive days within the orb for the same planet, natal planet and aspect.
 * A retrograde loop gives separate passes. `samples` must be in time order.
 */
export function groupExactPasses(samples: ReadonlyArray<{ iso: string; hits: ExactHit[] }>): ExactPass[] {
  const open = new Map<string, ExactPass>();
  const done: ExactPass[] = [];
  for (let i = 0; i < samples.length; i++) {
    const { iso, hits } = samples[i];
    const seen = new Set<string>();
    for (const h of hits) {
      const key = `${h.planet}|${h.natal}|${h.nth}`;
      seen.add(key);
      const o = open.get(key);
      if (!o) open.set(key, { ...h, start: iso, end: iso, peak: iso });
      else {
        o.end = iso;
        if (h.apart < o.apart) {
          o.apart = h.apart;
          o.peak = iso;
        }
      }
    }
    for (const key of Array.from(open.keys()))
      if (!seen.has(key)) {
        done.push(open.get(key)!);
        open.delete(key);
      }
  }
  done.push(...Array.from(open.values()));
  return done.sort((a, b) => a.start.localeCompare(b.start) || a.planet.localeCompare(b.planet));
}
