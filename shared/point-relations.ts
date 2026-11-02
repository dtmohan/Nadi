import { drishtiQuarters, houseFrom, type Planet, type PlanetPosition } from "./astro";

/**
 * A directional, whole-sign graha relationship. This is a factual view under one named
 * convention, not a universal planetary relationship or an interpretation. In particular,
 * the reverse direction can differ, and occupation is not an aspect in this representation.
 */
export interface DirectedPointRelation {
  convention: "parashari-full-sign";
  from: Planet;
  to: string;
  fromSign: number;
  toSign: number;
  inclusiveSignDistance: number;
  sameSign: boolean;
  fullAspect: boolean;
}

export function directedSignRelation(
  from: Pick<PlanetPosition, "planet" | "signIndex">,
  target: { id: string; signIndex: number },
): DirectedPointRelation {
  return {
    convention: "parashari-full-sign", from: from.planet, to: target.id,
    fromSign: from.signIndex, toSign: target.signIndex,
    inclusiveSignDistance: houseFrom(from.signIndex, target.signIndex),
    sameSign: from.signIndex === target.signIndex,
    fullAspect: drishtiQuarters(from.planet, from.signIndex, target.signIndex) >= 4,
  };
}
