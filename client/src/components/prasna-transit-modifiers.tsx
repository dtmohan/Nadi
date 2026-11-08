import type { Planet } from "@shared/astro";
import type { PrasnaVedhaAffliction, PrasnaVipareetaVedha } from "@shared/rules-prasna";
import { prasnaTransitModifierMalayalam } from "@shared/prasna-transit-malayalam";
import { useLocale } from "@/lib/i18n";

/** Qualify a planet's source-text tone with every relevant Vedha observation. */
export function PrasnaTransitModifiers({ planet, vedha, vipareeta }: {
  planet: Planet;
  vedha: PrasnaVedhaAffliction[];
  vipareeta: PrasnaVipareetaVedha[];
}) {
  const { locale } = useLocale();
  const obstructors = vedha.filter((v) => v.planet === planet);
  const counter = vipareeta.filter((v) => v.planet === planet);
  if (!obstructors.length && !counter.length) return null;
  return <div className="mt-1.5 flex flex-wrap gap-1" data-testid={`prasna-transit-modifiers-${planet}`}>
    {obstructors.map((v) => { const source = `Vedha: obstructed by ${v.obstructor} in house ${v.vedhaHouse}`; const ml = locale === "ml" ? prasnaTransitModifierMalayalam("vedha", v.obstructor, v.vedhaHouse, source) : undefined; return <span key={`${v.obstructor}-${v.vedhaHouse}`} lang={ml ? "ml" : "en"} className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5" data-testid="prasna-card-vedha">{ml ?? source}</span>; })}
    {counter.map((v) => { const source = `Vipareeta Vedha: possible relief from ${v.counterObstructor} in house ${v.vedhyaHouse}`; const ml = locale === "ml" ? prasnaTransitModifierMalayalam("vipareeta", v.counterObstructor, v.vedhyaHouse, source) : undefined; return <span key={`${v.counterObstructor}-${v.vedhyaHouse}`} lang={ml ? "ml" : "en"} className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5" data-testid="prasna-card-vipareeta">{ml ?? source}</span>; })}
  </div>;
}
