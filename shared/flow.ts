import { SIGNS, fmtDegShort, type Planet, type PlanetPosition, type Sign } from "./astro";

/**
 * Direction within a sign.
 *
 * Nadi reads planets sharing a sign in degree order: "degree-wise a planet ahead
 * will give its karakatwa to the planet behind" (Rao's basic rules; Naik). So
 * Saturn ahead of Mercury colours Mercury's learning and commerce with work and
 * duty, while Mercury ahead of Saturn makes the profession itself Mercurial.
 * The bond is tightest inside one pada (3°20'), then one nakshatra, then the sign.
 */

export type BondTier = "pada" | "nakshatra" | "sign";

export interface Flow {
  /** Planet ahead by degree: the giver. */
  from: Planet;
  /** Planet behind by degree: the receiver. */
  to: Planet;
  tier: BondTier;
}

export interface DegreeChain {
  signIndex: number;
  sign: Sign;
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

export function bondTier(a: PlanetPosition, b: PlanetPosition): BondTier | null {
  if (a.signIndex !== b.signIndex) return null;
  if (a.nakshatraIndex === b.nakshatraIndex && a.pada === b.pada) return "pada";
  if (a.nakshatraIndex === b.nakshatraIndex) return "nakshatra";
  return "sign";
}

/** Flow between two planets in the same sign, or null if they are not together. */
export function flowBetween(a: PlanetPosition, b: PlanetPosition): Flow | null {
  const tier = bondTier(a, b);
  if (!tier) return null;
  const [ahead, behind] = a.degInSign >= b.degInSign ? [a, b] : [b, a];
  return { from: ahead.planet, to: behind.planet, tier };
}

export function flowGloss(f: Flow): string {
  const bond = f.tier === "pada" ? "same pada, the tightest bond" : f.tier === "nakshatra" ? "same nakshatra" : "same sign";
  return `${f.from} ahead by degree hands ${GIVES[f.from]} to ${f.to}: read ${RECEIVES[f.to]} in that light (${bond}).`;
}

export function degreeChains(positions: PlanetPosition[]): DegreeChain[] {
  const bySign = new Map<number, PlanetPosition[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const chains: DegreeChain[] = [];
  for (const [signIndex, ps] of Array.from(bySign.entries())) {
    if (ps.length < 2) continue;
    const order = [...ps].sort((a, b) => b.degInSign - a.degInSign);
    const links: Flow[] = [];
    for (let i = 0; i < order.length - 1; i++) links.push(flowBetween(order[i], order[i + 1])!);
    chains.push({ signIndex, sign: SIGNS[signIndex], order, links });
  }
  return chains.sort((a, b) => b.order.length - a.order.length);
}

export function chainSummary(c: DegreeChain): string {
  const seq = c.order.map((p) => `${p.planet} ${fmtDegShort(p.degInSign)}`).join(" › ");
  const tight = c.links.filter((l) => l.tier === "pada").map((l) => `${l.from} and ${l.to} share a pada`);
  const near = c.links.filter((l) => l.tier === "nakshatra").map((l) => `${l.from} and ${l.to} share a nakshatra`);
  const tail = [...tight, ...near];
  return `${c.sign}: ${seq}. Matters flow from the planet ahead to the one behind${tail.length ? `; ${tail.join("; ")}` : ""}.`;
}
