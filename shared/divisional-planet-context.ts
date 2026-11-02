/** Sign-only divisional frame. Natal longitude is identified as natal, not a Dn longitude. */
import { houseFrom, type Planet } from "./astro";
import { directedSignRelation } from "./point-relations";
import { vargaSignAt } from "./varga-sign";
import type { VargaKey } from "./vargas";
import { assertContextAscendant, type PlanetContext } from "./planet-context";

export interface DivisionalPlanetFact {
  readonly planet: Planet;
  readonly natalLongitude: number;
  readonly signIndex: number;
  readonly house: number;
}
export interface DivisionalPlanetContext {
  readonly kind: "divisional-signs";
  readonly division: VargaKey;
  readonly natal: PlanetContext;
  readonly ascendantSign: number;
  readonly planets: readonly DivisionalPlanetFact[];
  planet(id: Planet): DivisionalPlanetFact | undefined;
  requirePlanet(id: Planet): DivisionalPlanetFact;
  occupants(signIndex: number): readonly DivisionalPlanetFact[];
  fullAspect(from: Planet, targetSign: number): boolean;
}

export function createDivisionalPlanetContext(natal: PlanetContext, division: VargaKey, natalAscendant: number): DivisionalPlanetContext {
  if (natal.frame.kind !== "natal" && natal.frame.kind !== "unspecified")
    throw new Error("A divisional chart requires a natal frame");
  assertContextAscendant(natal, natalAscendant);
  const ascendantSign = vargaSignAt(division, natalAscendant);
  const planets = Object.freeze(natal.planets.map((p) => {
    const signIndex = vargaSignAt(division, p.position.lon);
    return Object.freeze({ planet: p.planet, natalLongitude: p.position.lon, signIndex, house: houseFrom(ascendantSign, signIndex) });
  }));
  const byId = new Map(planets.map((p) => [p.planet, p]));
  const get = (id: Planet) => {
    const p = byId.get(id);
    if (!p) throw new Error(`Missing ${id} in ${division}`);
    return p;
  };
  return Object.freeze({ kind: "divisional-signs", division, natal, ascendantSign, planets,
    planet: (id: Planet) => byId.get(id), requirePlanet: get,
    occupants: (signIndex: number) => Object.freeze(planets.filter((p) => p.signIndex === signIndex)),
    fullAspect: (from: Planet, targetSign: number) => directedSignRelation(get(from), { id: "sign", signIndex: targetSign }).fullAspect,
  });
}
