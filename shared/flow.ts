import { SIGNS, SIGN_ABBR, fmtDegShort, houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";

/**
 * Direction by degree, across the trinal group.
 *
 * Nadi reads planets that combine (same sign or trine) in degree order: "degree-wise a
 * planet ahead will give its karakatwa to the planet behind" (Rao's basic rules; Naik).
 * The three signs of one trine are one direction (East: Aries, Leo, Sagittarius; South:
 * Taurus, Virgo, Capricorn; West: Gemini, Libra, Aquarius; North: Cancer, Scorpio, Pisces)
 * and "planets in the same direction are conjunct, irrespective of their signs", written
 * "in the ascending order of their degrees". So Saturn at 20° Leo is ahead of Mercury at
 * 10° Aries and hands work and duty to Mercury's learning.
 *
 * The bond is tightest inside one pada (3°20'), then one nakshatra, then the sign; across
 * signs, planets within a degree of each other are "at the same degree", otherwise merely in
 * trine. Retrogression shows the direction of approach: a direct planet moves to higher
 * degrees, a retrograde one (and the nodes) to lower, so two planets closing on each other
 * bind more strongly than two separating.
 */

export type BondTier = "pada" | "nakshatra" | "sign" | "degree" | "trine";
export type Approach = "closing" | "separating" | "following";

export interface Flow {
  /** Planet ahead by degree: the giver. */
  from: Planet;
  /** Planet behind by degree: the receiver. */
  to: Planet;
  tier: BondTier;
  /** Whether the two are moving toward each other, apart, or in the same direction. */
  approach: Approach;
  /** Whether the two share a sign; otherwise they are in trine. */
  sameSign: boolean;
}

export type Direction = "East" | "South" | "West" | "North";
export const DIRECTIONS: Direction[] = ["East", "South", "West", "North"];
export const DIRECTION_SIGNS: Record<Direction, number[]> = {
  East: [0, 4, 8],
  South: [1, 5, 9],
  West: [2, 6, 10],
  North: [3, 7, 11],
};
export function directionOf(signIndex: number): Direction {
  return DIRECTIONS[signIndex % 4];
}

export interface DegreeChain {
  direction: Direction;
  /** Signs of this direction that hold a planet. */
  signs: Sign[];
  /** Highest degree first: the planet furthest ahead leads the chain. */
  order: PlanetPosition[];
  /** Adjacent hand-offs along the chain. */
  links: Flow[];
}

/** What a planet hands on when it is ahead. */
export const GIVES: Record<Planet, string> = {
  Sun: "authority, the father and status",
  Moon: "the mind, the mother and the public",
  Mars: "drive, property and technical force",
  Mercury: "learning, speech and commerce",
  Jupiter: "the native's own purpose, wisdom and wealth",
  Venus: "the spouse, comforts and the arts",
  Saturn: "work, duty and delay",
  Rahu: "foreign ties, ambition and the unconventional",
  Ketu: "detachment, spirit and endings",
};

/** What a planet's matters are, when it receives. */
export const RECEIVES: Record<Planet, string> = {
  Sun: "the father and career standing",
  Moon: "the mother and the emotional life",
  Mars: "siblings, property and courage",
  Mercury: "education, speech and trade",
  Jupiter: "the native's life direction",
  Venus: "marriage and comforts",
  Saturn: "the profession",
  Rahu: "foreign and worldly ambitions",
  Ketu: "the spiritual path",
};

function combined(a: PlanetPosition, b: PlanetPosition): boolean {
  return [1, 5, 9].includes(houseFrom(a.signIndex, b.signIndex));
}

export function bondTier(a: PlanetPosition, b: PlanetPosition): BondTier | null {
  if (!combined(a, b)) return null;
  if (a.signIndex === b.signIndex) {
    if (a.nakshatraIndex === b.nakshatraIndex && a.pada === b.pada) return "pada";
    if (a.nakshatraIndex === b.nakshatraIndex) return "nakshatra";
    return "sign";
  }
  return Math.abs(a.degInSign - b.degInSign) <= 1 ? "degree" : "trine";
}

/** Direct planets move to higher degrees; retrograde planets and the nodes to lower. */
function movesUp(p: PlanetPosition): boolean {
  if (p.planet === "Rahu" || p.planet === "Ketu") return false;
  return !p.retrograde;
}

export function approachOf(ahead: PlanetPosition, behind: PlanetPosition): Approach {
  const aheadUp = movesUp(ahead);
  const behindUp = movesUp(behind);
  if (aheadUp === behindUp) return "following";
  // Ahead moving down toward behind, and behind moving up toward ahead: closing.
  return !aheadUp && behindUp ? "closing" : "separating";
}

/** Flow between two planets in the same sign or in trine, or null if they do not combine. */
export function flowBetween(a: PlanetPosition, b: PlanetPosition): Flow | null {
  const tier = bondTier(a, b);
  if (!tier) return null;
  const [ahead, behind] = a.degInSign >= b.degInSign ? [a, b] : [b, a];
  return { from: ahead.planet, to: behind.planet, tier, approach: approachOf(ahead, behind), sameSign: a.signIndex === b.signIndex };
}

export function tierLabel(t: BondTier): string {
  return t === "pada" ? "same pada" : t === "nakshatra" ? "same nakshatra" : t === "sign" ? "same sign" : t === "degree" ? "same degree, in trine" : "in trine";
}

export function approachLabel(a: Approach): string {
  return a === "closing" ? "closing on each other" : a === "separating" ? "separating" : "moving the same way";
}

export function flowGloss(f: Flow): string {
  const bond = f.tier === "pada" ? "same pada, the tightest bond" : tierLabel(f.tier);
  return `${f.from} ahead by degree hands ${GIVES[f.from]} to ${f.to}: read ${RECEIVES[f.to]} in that light (${bond}, ${approachLabel(f.approach)}).`;
}

export function degreeChains(positions: PlanetPosition[]): DegreeChain[] {
  const chains: DegreeChain[] = [];
  for (const direction of DIRECTIONS) {
    const ps = positions.filter((p) => directionOf(p.signIndex) === direction);
    if (ps.length < 2) continue;
    const order = [...ps].sort((a, b) => b.degInSign - a.degInSign);
    const links: Flow[] = [];
    for (let i = 0; i < order.length - 1; i++) links.push(flowBetween(order[i], order[i + 1])!);
    const signs = DIRECTION_SIGNS[direction].filter((i) => ps.some((p) => p.signIndex === i)).map((i) => SIGNS[i]);
    chains.push({ direction, signs, order, links });
  }
  return chains.sort((a, b) => b.order.length - a.order.length);
}

/** "Saturn 3°09' Li" when the chain spans several signs, else just the degree. */
export function chainPlanetLabel(p: PlanetPosition, c: DegreeChain): string {
  return `${p.planet} ${fmtDegShort(p.degInSign)}${c.signs.length > 1 ? ` ${SIGN_ABBR[p.signIndex]}` : ""}`;
}

export function chainSummary(c: DegreeChain): string {
  const seq = c.order.map((p) => chainPlanetLabel(p, c)).join(" › ");
  const tight = c.links.filter((l) => l.tier === "pada").map((l) => `${l.from} and ${l.to} share a pada`);
  const near = c.links.filter((l) => l.tier === "nakshatra").map((l) => `${l.from} and ${l.to} share a nakshatra`);
  const same = c.links.filter((l) => l.tier === "degree").map((l) => `${l.from} and ${l.to} stand at the same degree across signs`);
  const closing = c.links.filter((l) => l.approach === "closing").map((l) => `${l.from} and ${l.to} are closing`);
  const tail = [...tight, ...near, ...same, ...closing];
  return `${c.direction} (${c.signs.join(", ")}): ${seq}. Matters flow from the planet ahead to the one behind${tail.length ? `; ${tail.join("; ")}` : ""}.`;
}
