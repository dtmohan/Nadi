import type { Planet } from "@shared/astro";
import type { PrasnaVedhaAffliction, PrasnaVipareetaVedha } from "@shared/rules-prasna";

/** Qualify a planet's source-text tone with every relevant Vedha observation. */
export function PrasnaTransitModifiers({ planet, vedha, vipareeta }: {
  planet: Planet;
  vedha: PrasnaVedhaAffliction[];
  vipareeta: PrasnaVipareetaVedha[];
}) {
  const obstructors = vedha.filter((v) => v.planet === planet);
  const counter = vipareeta.filter((v) => v.planet === planet);
  if (!obstructors.length && !counter.length) return null;
  return <div className="mt-1.5 flex flex-wrap gap-1" data-testid={`prasna-transit-modifiers-${planet}`}>
    {obstructors.map((v) => <span key={`${v.obstructor}-${v.vedhaHouse}`} className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5" data-testid="prasna-card-vedha">
      Vedha: obstructed by {v.obstructor} in house {v.vedhaHouse}
    </span>)}
    {counter.map((v) => <span key={`${v.counterObstructor}-${v.vedhyaHouse}`} className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5" data-testid="prasna-card-vipareeta">
      Vipareeta Vedha: possible relief from {v.counterObstructor} in house {v.vedhyaHouse}
    </span>)}
  </div>;
}
