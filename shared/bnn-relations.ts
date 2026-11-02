import { relationOf, type PlanetPosition, type Relation } from "./astro";
import { readsFromPreviousSign } from "./flow";

/** The weights and retrograde alternative are Nadi's existing BNN convention. */
export const BNN_RELATION_STRENGTH: Record<Relation, number> = {
  conjunct: 1, trine: 0.75, prev: 0.7, next: 0.65, opposite: 0.5, none: 0,
};
export const RETRO_STRENGTH = 0.5;

export interface BnnRelation {
  relation: Relation;
  viaRetro: boolean;
  aSign: number;
  bSign: number;
}

/** Directional best relation, including the source's explicitly qualified retrograde shadow. */
export function bestBnnRelation(a: PlanetPosition, b: PlanetPosition, positions: PlanetPosition[]): BnnRelation | null {
  const effectiveSigns = (p: PlanetPosition) => [
    { sign: p.signIndex, viaRetro: false },
    ...(readsFromPreviousSign(p, positions) ? [{ sign: (p.signIndex + 11) % 12, viaRetro: true }] : []),
  ];
  let best: BnnRelation | null = null;
  for (const ea of effectiveSigns(a)) for (const eb of effectiveSigns(b)) {
    const relation = relationOf(ea.sign, eb.sign);
    if (relation === "none") continue;
    const candidate = { relation, viaRetro: ea.viaRetro || eb.viaRetro, aSign: ea.sign, bSign: eb.sign };
    const weight = BNN_RELATION_STRENGTH[relation] * (candidate.viaRetro ? RETRO_STRENGTH : 1);
    const prior = best ? BNN_RELATION_STRENGTH[best.relation] * (best.viaRetro ? RETRO_STRENGTH : 1) : -1;
    if (weight > prior) best = candidate;
  }
  return best;
}
