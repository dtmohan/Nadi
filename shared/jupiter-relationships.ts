/**
 * Descriptive, whole-sign Jupiter relationships in a named Parashari chart frame.
 * The ninth-sign occupancy is an observation, not an evaluated cancellation or score.
 */
import { SIGNS, SIGN_LORD, houseFrom, norm360, type Planet } from "./astro";
import { createDivisionalPlanetContext } from "./divisional-planet-context";
import type { PlanetContext } from "./planet-context";

export type JupiterDivision = "D1" | "D9" | "D10";
export interface JupiterSignTarget {
  /** Counted forward, inclusively, from Jupiter's sign. */
  fromJupiter: 5 | 7 | 9;
  signIndex: number;
  house: number;
  lord: Planet;
  occupants: Planet[];
  classicalOccupants: Planet[];
  nodeOccupants: Planet[];
  /** Kerala or another explicitly selected natal Gulika, never projected into D9/D10 here. */
  gulika: boolean;
}
export interface JupiterRelationships {
  division: JupiterDivision;
  risingSign: number;
  signIndex: number;
  house: number;
  /** D1 ownership and division ownership are deliberately separate. */
  natalOwnedHouses: number[];
  divisionOwnedHouses: number[];
  sameSign: Array<{ planet: Planet; natalSeparation: number | null }>;
  incomingFullAspects: Planet[];
  targets: JupiterSignTarget[];
  /** This is natal apparent motion, also when a divisional sign is displayed. */
  natalRetrograde: boolean;
}

const isNode = (planet: Planet) => planet === "Rahu" || planet === "Ketu";
const ownedHouses = (rising: number) => SIGNS.flatMap((_, sign) =>
  SIGN_LORD[sign] === "Jupiter" ? [houseFrom(rising, sign)] : []).sort((a, b) => a - b);

export function jupiterRelationships(
  natal: PlanetContext,
  division: JupiterDivision = "D1",
  gulikaSign?: number,
): JupiterRelationships {
  if (natal.frame.kind !== "natal" || natal.frame.division !== "D1" || natal.frame.ascendant === undefined)
    throw new Error("Jupiter relationships require an identified D1 natal frame with an ascendant");
  if (natal.frame.houseMethod === "placidus")
    throw new Error("This Parashari sign-aspect view does not use a KP cusp frame");
  if (gulikaSign !== undefined && (!Number.isInteger(gulikaSign) || gulikaSign < 0 || gulikaSign > 11))
    throw new RangeError("Gulika sign must be between 0 and 11");

  const chart = createDivisionalPlanetContext(natal, division, natal.frame.ascendant);
  const jupiter = chart.requirePlanet("Jupiter");
  const natalJupiter = natal.requirePlanet("Jupiter").position;
  const natalRising = Math.floor(norm360(natal.frame.ascendant) / 30);
  const sameSign = chart.occupants(jupiter.signIndex).filter((p) => p.planet !== "Jupiter").map((p) => ({
    planet: p.planet,
    natalSeparation: division === "D1" ? Math.abs((((p.natalLongitude - natalJupiter.lon + 180) % 360) + 360) % 360 - 180) : null,
  }));
  const targets = ([5, 7, 9] as const).map((distance): JupiterSignTarget => {
    const signIndex = (jupiter.signIndex + distance - 1) % 12;
    const occupants = chart.occupants(signIndex).map((p) => p.planet);
    return { fromJupiter: distance, signIndex, house: houseFrom(chart.ascendantSign, signIndex),
      lord: SIGN_LORD[signIndex], occupants, classicalOccupants: occupants.filter((p) => !isNode(p)),
      nodeOccupants: occupants.filter(isNode), gulika: division === "D1" && signIndex === gulikaSign };
  });
  return {
    division, risingSign: chart.ascendantSign, signIndex: jupiter.signIndex, house: jupiter.house,
    natalOwnedHouses: ownedHouses(natalRising), divisionOwnedHouses: ownedHouses(chart.ascendantSign),
    sameSign,
    incomingFullAspects: chart.planets.filter((p) => p.planet !== "Jupiter" && chart.fullAspect(p.planet, jupiter.signIndex)).map((p) => p.planet),
    targets, natalRetrograde: natalJupiter.retrograde,
  };
}
