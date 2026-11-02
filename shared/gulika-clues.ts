/**
 * Descriptive birth-chart observations only. The question-chart discussion of 18.68 is not
 * reproduced as a natal prediction. The 19.8 same-sign association is a partial reading of
 * its Kshetra passage; extending the comparison to Beeja is exploratory.
 * Neither observation cancels a house reading, diagnoses fertility, or changes any score.
 */
import { houseFrom, naturalBenefic, type Planet, type PlanetPosition } from "./astro";
import type { GulikaPoint } from "./gulika-methods";
import { directedSignRelation, type DirectedPointRelation } from "./point-relations";

export interface GulikaNatalClues {
  house: number;
  jupiter: DirectedPointRelation;
  /** Separate from the fifth/ninth aspects; do not silently treat a conjunction as an aspect. */
  jupiterFifthOrNinthAspect: boolean;
  /** Classical planet-to-point relationships; nodes have no aspect in this convention. */
  planetaryRelations: DirectedPointRelation[];
  fifth: { signIndex: number; naturalBeneficOccupants: Planet[]; naturalBeneficAspects: Planet[] };
  sphuta: null | { kind: "beeja" | "kshetra"; signIndex: number; sameSignAsGulika: boolean };
}

const CLASSICAL: readonly Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export function gulikaNatalClues(
  positions: PlanetPosition[],
  gulika: Pick<GulikaPoint, "signIndex">,
  lagnaSign: number,
  sphuta?: { kind: "beeja" | "kshetra"; signIndex: number },
): GulikaNatalClues {
  const planets = CLASSICAL.map((planet) => {
    const p = positions.find((pos) => pos.planet === planet);
    if (!p) throw new Error(`Missing ${planet} for Gulika natal clues`);
    return p;
  });
  const planetaryRelations = planets.map((p) => directedSignRelation(p, { id: "Gulika", signIndex: gulika.signIndex }));
  const jupiter = planetaryRelations.find((r) => r.from === "Jupiter")!;
  const fifthSign = (lagnaSign + 4) % 12;
  const benefics = planets.filter((p) => naturalBenefic(p, positions));
  return {
    house: houseFrom(lagnaSign, gulika.signIndex), jupiter,
    jupiterFifthOrNinthAspect: jupiter.fullAspect && [5, 9].includes(jupiter.inclusiveSignDistance),
    planetaryRelations,
    fifth: {
      signIndex: fifthSign,
      naturalBeneficOccupants: benefics.filter((p) => p.signIndex === fifthSign).map((p) => p.planet),
      naturalBeneficAspects: benefics.filter((p) => directedSignRelation(p, { id: "fifth-house sign", signIndex: fifthSign }).fullAspect).map((p) => p.planet),
    },
    sphuta: sphuta ? { ...sphuta, sameSignAsGulika: sphuta.signIndex === gulika.signIndex } : null,
  };
}
