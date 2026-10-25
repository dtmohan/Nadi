// Modern node aspects: display only, a labelled note that is never counted.
//
// BPHS 26.2-5 gives Rahu and Ketu no aspects, and the Parashari readings follow it. Modern authors give
// the nodes the 5th, 7th and 9th aspects, as Jupiter has:
//  - V.K. Choudhry, Impact of Rahu & Ketu, ch. 3 (printed pp. 19-20): both nodes; an aspect is exact
//    within one degree and close within five;
//  - Jyotishacharya Shweta, Decoding the Bhavas vol. 2, §17.4 (p. 145): Rahu's are widely accepted;
//    Ketu's are disputed, some lineages giving it none and others the 5th and 9th.
// Counted by whole sign from the node, as the app's other sign aspects are; for the 5th, 7th and 9th the
// direction of counting makes no difference. "Apart" is the difference of degrees within the signs, which
// is Choudhry's longitude difference for planets in aspecting signs. Shown in the practitioner view of the
// houses chapter. No rule, verdict, lean or kernel module reads it (guarded in node-aspects.test.ts).
// Provisional.

import { SIGNS, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";

export const NODE_ASPECT_NTHS = [5, 7, 9] as const;
export type NodeAspectNth = (typeof NODE_ASPECT_NTHS)[number];

/** Choudhry, ch. 3, p. 19: an aspect within one degree is exact, within five close. */
export const NODE_ASPECT_EXACT_DEG = 1;
export const NODE_ASPECT_CLOSE_DEG = 5;

export const NODE_ASPECT_SOURCES = {
  bphs: { label: "Parashara 26.2-5", url: BPHS_URL(26) },
  choudhry: { label: "V.K. Choudhry, Impact of Rahu & Ketu, ch. 3, pp. 19-20", url: "", provisional: true },
  shweta: { label: "Shweta, Decoding the Bhavas vol. 2, §17.4, p. 145", url: "", provisional: true },
} as const;

export const NODE_ASPECT_LABEL = "Modern convention, not used by Parashara (BPHS 26)";

export interface NodeAspectHit {
  planet: Planet;
  /** Degrees apart within the signs. */
  apart: number;
  exact: boolean;
  close: boolean;
}

export interface NodeAspectTarget {
  nth: NodeAspectNth;
  signIndex: number;
  sign: string;
  /** House from the lagna (whole signs). */
  house: number;
  planets: NodeAspectHit[];
}

export interface NodeAspects {
  node: "Rahu" | "Ketu";
  signIndex: number;
  sign: string;
  house: number;
  degInSign: number;
  /** Ketu's aspects are disputed (Shweta §17.4). */
  disputed: boolean;
  targets: NodeAspectTarget[];
}

const houseFromLagna = (signIndex: number, lagnaIdx: number) => ((signIndex - lagnaIdx + 12) % 12) + 1;

/** The 5th, 7th and 9th aspects of each node, with the planets they fall on. */
export function modernNodeAspects(positions: PlanetPosition[], lagnaIdx: number): NodeAspects[] {
  const out: NodeAspects[] = [];
  for (const node of ["Rahu", "Ketu"] as const) {
    const n = positions.find((p) => p.planet === node);
    if (!n) continue;
    const targets: NodeAspectTarget[] = NODE_ASPECT_NTHS.map((nth) => {
      const signIndex = (n.signIndex + nth - 1) % 12;
      const planets = positions
        .filter((p) => p.planet !== node && p.signIndex === signIndex)
        .map((p) => {
          const apart = Math.round(Math.abs(p.degInSign - n.degInSign) * 10) / 10;
          return {
            planet: p.planet,
            apart,
            exact: apart <= NODE_ASPECT_EXACT_DEG,
            close: apart <= NODE_ASPECT_CLOSE_DEG,
          };
        })
        .sort((a, b) => a.apart - b.apart);
      return { nth, signIndex, sign: SIGNS[signIndex], house: houseFromLagna(signIndex, lagnaIdx), planets };
    });
    out.push({
      node,
      signIndex: n.signIndex,
      sign: SIGNS[n.signIndex],
      house: houseFromLagna(n.signIndex, lagnaIdx),
      degInSign: Math.round(n.degInSign * 10) / 10,
      disputed: node === "Ketu",
      targets,
    });
  }
  return out;
}

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** One practitioner sentence per node, for the report and tests. */
export function nodeAspectSentence(a: NodeAspects): string {
  const parts = a.targets.map((t) => {
    const who = t.planets.length
      ? t.planets
          .map((h) => `${h.planet} ${h.apart.toFixed(1)}° apart${h.exact ? " (exact)" : h.close ? " (close)" : ""}`)
          .join("; ")
      : "no planet";
    return `${ord(t.nth)} on ${t.sign} (${ord(t.house)} house): ${who}`;
  });
  return `${a.node} in ${a.sign} (${ord(a.house)} house)${a.disputed ? ", disputed" : ""}: ${parts.join(". ")}.`;
}
