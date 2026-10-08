// Jaimini primitives with no dependency on the assembled Jaimini result, so they can be shared by
// jaimini.ts, jaimini-ayur.ts and the Jaimini rule modules without a module cycle.
import { SIGN_QUALITY, houseFrom, type Planet, type PlanetPosition } from "./astro";

/** Jaimini rasi drishti: movable aspects fixed (not the 2nd), fixed aspects movable (not the 12th), dual aspects dual. */
export function rasiAspects(fromSign: number, toSign: number): boolean {
  if (fromSign === toSign) return false;
  const q = SIGN_QUALITY[fromSign];
  const t = SIGN_QUALITY[toSign];
  if (q === "Movable") return t === "Fixed" && toSign !== (fromSign + 1) % 12;
  if (q === "Fixed") return t === "Movable" && toSign !== (fromSign + 11) % 12;
  return t === "Dual";
}

/** Jaimini benefic: Jupiter, Venus and Mercury, and the Moon away from the Sun; the Sun only when dignified. */
export function isBenefic(p: PlanetPosition, sunLon?: number): boolean {
  if (p.planet === "Jupiter" || p.planet === "Venus" || p.planet === "Mercury") return true;
  if (p.planet === "Moon") {
    if (sunLon === undefined) return true;
    const elong = ((p.lon - sunLon) % 360 + 360) % 360;
    return elong >= 90 && elong < 270;
  }
  if (p.planet === "Sun") return p.dignity === "Exalted" || p.dignity === "Friendly" || p.dignity === "Own sign" || p.dignity === "Moolatrikona";
  return false;
}

export interface Argala {
  /** House counted from the reference sign that intervenes (2, 4, 11 primary; 5 secondary). */
  house: number;
  kind: "primary" | "secondary";
  planets: Planet[];
  /** House whose occupants obstruct this argala (12 for 2, 10 for 4, 3 for 11, 9 for 5). */
  obstructingHouse: number;
  obstructedBy: Planet[];
  /** True when the obstructing house holds at least as many planets. */
  obstructed: boolean;
}

const ARGALA_PAIRS: Array<{ house: number; kind: "primary" | "secondary"; obstructingHouse: number }> = [
  { house: 2, kind: "primary", obstructingHouse: 12 },
  { house: 4, kind: "primary", obstructingHouse: 10 },
  { house: 11, kind: "primary", obstructingHouse: 3 },
  { house: 5, kind: "secondary", obstructingHouse: 9 },
];

export function argalaOn(sign: number, positions: { planet: Planet; signIndex: number }[]): Argala[] {
  const inHouse = (h: number) => positions.filter((p) => houseFrom(sign, p.signIndex) === h).map((p) => p.planet);
  return ARGALA_PAIRS.map(({ house, kind, obstructingHouse }) => {
    const planets = inHouse(house);
    const obstructedBy = inHouse(obstructingHouse);
    return { house, kind, planets, obstructingHouse, obstructedBy, obstructed: planets.length > 0 && obstructedBy.length >= planets.length };
  }).filter((a) => a.planets.length > 0);
}
