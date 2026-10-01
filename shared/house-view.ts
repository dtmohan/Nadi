/**
 * Parashari house placement: which of the twelve houses a planet is read in, and which sign and lord
 * stand for that house. The default is rashi — one sign per house, the convention the quoted texts
 * state their results in. The two bhava-chalit constructions from shared/chalit.ts can be selected
 * instead: then a house is the span around its madhya, it is named after the madhya's sign, its lord
 * is that sign's lord (a stated reading, not a verse), and the readings that follow are marked as
 * bhava-chalit reinterpretations of sources that speak by whole-sign houses.
 *
 * Scope: this view is used by the Parashari house, node and house-effects readings only. Company
 * (planets sharing a sign), planet-to-planet counts, yogas, Jaimini, BNN, ALP and KP keep their own
 * conventions; KP places planets by Placidus cusps.
 */
import { SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import type { ChalitMethod, ChalitResult } from "./chalit";

export type ParashariHouseMethod = "rashi" | ChalitMethod;

export const PARASHARI_HOUSE_METHODS: ParashariHouseMethod[] = ["rashi", "sripati", "equal"];

export const PARASHARI_HOUSE_METHOD_LABEL: Record<ParashariHouseMethod, string> = {
  rashi: "Rashi (whole sign)",
  sripati: "Bhava chalit — Sripati",
  equal: "Bhava chalit — equal",
};

/** Shown beside the Parashari readings whenever a chalit construction is selected. */
export const HOUSE_METHOD_CAVEAT =
  "This chart is read with bhava chalit: a planet's house is the bhava whose madhya span holds it, the house is named after its madhya's sign, and its lord is that sign's lord — a stated reading, not a verse. Phaladeepika and BPHS state the results quoted here by whole sign from the lagna, so the house, node, house-effects and house-lord readings on this page are bhava-chalit reinterpretations and are marked provisional. Company by sign, planet-to-planet counts, the sign-counted yoga layers, evils, marriage, children, arishta, padas and dasa effects, Jaimini, BNN, ALP and KP keep their own conventions; KP places planets by Placidus cusps.";

export interface HouseView {
  method: ParashariHouseMethod;
  /** The house a planet is read in. */
  houseOf(p: PlanetPosition): number;
  /** The sign the house is named after (the madhya's sign under chalit). */
  signOfHouse(h: number): number;
  /** Lord of the house: the madhya sign's lord under chalit, a stated reading. */
  lordOf(h: number): Planet;
  /** Planets occupying the house by the selected construction. */
  occupantsOf(h: number): PlanetPosition[];
}

export function rashiHouseView(lagnaIdx: number, positions: PlanetPosition[]): HouseView {
  return {
    method: "rashi",
    houseOf: (p) => houseFrom(lagnaIdx, p.signIndex),
    signOfHouse: (h) => (lagnaIdx + h - 1) % 12,
    lordOf: (h) => SIGN_LORD[(lagnaIdx + h - 1) % 12],
    occupantsOf: (h) => positions.filter((p) => houseFrom(lagnaIdx, p.signIndex) === h),
  };
}

export function chalitHouseView(method: ChalitMethod, c: ChalitResult, positions: PlanetPosition[]): HouseView {
  const k = c[method];
  return {
    method,
    houseOf: (p) => k.planets.find((x) => x.planet === p.planet)?.chalitHouse ?? houseFrom(Math.floor(c.asc / 30), p.signIndex),
    signOfHouse: (h) => k.bhavas[h - 1]?.signIndex ?? 0,
    lordOf: (h) => SIGN_LORD[k.bhavas[h - 1]?.signIndex ?? 0],
    occupantsOf: (h) => positions.filter((p) => k.planets.find((x) => x.planet === p.planet)?.chalitHouse === h),
  };
}

/**
 * The view for the selected method. Falls back to rashi, reporting it, when a chalit construction
 * was asked for but the chart carries no chalit result (no ephemeris facts for the ascendant and
 * meridian).
 */
export function houseViewFor(
  method: ParashariHouseMethod,
  lagnaIdx: number,
  positions: PlanetPosition[],
  chalit?: ChalitResult,
): { view: HouseView; fellBack: boolean } {
  if (method === "rashi" || !chalit) return { view: rashiHouseView(lagnaIdx, positions), fellBack: method !== "rashi" };
  return { view: chalitHouseView(method, chalit, positions), fellBack: false };
}

/** Whole-sign house of a planet, for the reinterpretation notes. */
export function rashiHouseOf(lagnaIdx: number, p: PlanetPosition): number {
  return houseFrom(lagnaIdx, p.signIndex);
}
