// Planets gathered in one sign: the "stellium" reading. A sign with two or more planets is a
// conjunction group; the planet ahead by degree leads it (the Nadi degree-order reading), and two of
// the five tara grahas within one degree are at planetary war, the more northern one winning.
// Source: BPHS 27.20 for the war (Sun, Moon and the nodes never fight — the Sun combusts, the Moon
// conjoins); the group and lead planet are this app's summary of the degree-order convention.
import { SIGNS, houseFrom, type PlanetPosition, type Sign } from "./astro";
import type { ShadbalaBase } from "./shadbala";

export const CONJUNCTIONS_NOTE =
  "Planetary war (BPHS 27.20): two of Mars to Saturn within one degree; the more northern one wins (Surya Siddhanta convention). The Sun, Moon and nodes do not fight — the Sun combusts, the Moon conjoins. The lead planet is the one ahead by degree (the Nadi degree-order reading).";

/** The five tara grahas that wage war; the luminaries and nodes never do. */
export const FIGHTERS = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

export interface WarPair {
  victor: string;
  loser: string;
  /** Angular separation in degrees. */
  separation: number;
}

export interface Combination {
  signIndex: number;
  sign: Sign;
  /** House from the lagna sign (1..12). */
  house: number;
  count: number;
  planets: PlanetPosition[];
  /** The planet ahead by degree in the sign. */
  lead: PlanetPosition;
  wars: WarPair[];
  combust: PlanetPosition[];
}

const sep = (a: number, b: number) => {
  const d = Math.abs((((a % 360) + 360) % 360) - (((b % 360) + 360) % 360));
  return d > 180 ? 360 - d : d;
};

/** Planetary war pairs (BPHS 27.20): the five tara grahas within one degree; the more northern wins. */
export function grahaYuddha(
  positions: PlanetPosition[],
  shadbala?: ShadbalaBase,
): WarPair[] {
  if (!shadbala) return [];
  const pos = (p: string) => positions.find((x) => x.planet === p);
  const wars: WarPair[] = [];
  for (let i = 0; i < FIGHTERS.length; i++) {
    for (let j = i + 1; j < FIGHTERS.length; j++) {
      const a = FIGHTERS[i];
      const c = FIGHTERS[j];
      const pa = pos(a);
      const pc = pos(c);
      if (!pa || !pc) continue;
      if (pa.signIndex !== pc.signIndex) continue;
      const separation = sep(pa.lon, pc.lon);
      if (separation > 1) continue;
      const victor = shadbala.bodies[a].lat >= shadbala.bodies[c].lat ? a : c;
      const loser = victor === a ? c : a;
      wars.push({ victor, loser, separation });
    }
  }
  return wars;
}

/** Conjunction groups (two or more planets in a sign), largest first, with war and combustion surfaced. */
export function computeCombinations(
  positions: PlanetPosition[],
  lagnaSign: number,
  shadbala?: ShadbalaBase,
): Combination[] {
  const wars = grahaYuddha(positions, shadbala);
  const bySign = new Map<number, PlanetPosition[]>();
  for (const p of positions) {
    const arr = bySign.get(p.signIndex) ?? [];
    arr.push(p);
    bySign.set(p.signIndex, arr);
  }
  const out: Combination[] = [];
  for (const signIndex of Array.from(bySign.keys())) {
    const ps = bySign.get(signIndex)!;
    if (ps.length < 2) continue;
    ps.sort((a, b) => a.degInSign - b.degInSign);
    const lead = ps[ps.length - 1];
    out.push({
      signIndex,
      sign: SIGNS[signIndex],
      house: houseFrom(lagnaSign, signIndex),
      count: ps.length,
      planets: ps,
      lead,
      wars: wars.filter(
        (w) => positions.find((p) => p.planet === w.victor)?.signIndex === signIndex,
      ),
      combust: ps.filter((p) => p.combust),
    });
  }
  return out.sort((a, b) => b.count - a.count);
}
