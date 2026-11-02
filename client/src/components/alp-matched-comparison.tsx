import type { AlpMatchedComparison } from "@shared/alp-matched-types";

const labels: Record<string, string> = {
  "pada-navamsa-touches": "Pada-navamsa clue",
  "natal-seventh-lord-in-period": "Natal seventh lord in a period",
  "alp-seventh-lord-in-period": "Progressed seventh lord in a period",
  "exact-seventh-lord-period-pair": "Exact seventh-lord period pair",
  "natal-seventh-lord-at-natal-d9-lagna": "Natal seventh lord in natal D9 ascendant sign",
  "alp-seventh-lord-at-natal-d9-lagna": "Progressed seventh lord in natal D9 ascendant sign",
  "natal-seventh-lord-at-progressed-d9-lagna": "Natal seventh lord in progressed D9 ascendant sign",
  "alp-seventh-lord-at-progressed-d9-lagna": "Progressed seventh lord in progressed D9 ascendant sign",
};
export function AlpMatchedComparisonPanel({ comparison }: { comparison?: AlpMatchedComparison }) {
  if (!comparison) return null;
  if (comparison.status === "unavailable") return <p className="mt-2 text-xs text-muted-foreground">ALP shifted-date context unavailable: {comparison.reason}</p>;
  return <details className="mt-2 rounded border px-3 py-2 text-xs" data-testid="alp-matched-comparison">
    <summary className="cursor-pointer font-medium">ALP marriage facts on shifted dates</summary>
    <p className="mt-1 text-muted-foreground">The same {comparison.trials} sequence-preserving shifts used for KP are applied to each marriage. Facts are shown separately and do not add to the ALP pada score. The natal seventh lord at the natal D9 ascendant is fixed for a birth chart; the progressed seventh lord can change with the event date. Shifted dates are not verified non-events.</p>
    {comparison.rows.map((row, i) => <div className="mt-2" key={`${row.date}-${i}`}><p className="font-medium">{row.label} · {row.date}</p>
      {row.status === "unavailable" ? <p>Context unavailable.</p> : row.facts.map((fact) => <p key={fact.id}>{labels[fact.id] ?? fact.id}: {fact.actual ? "present" : "not identified"} at the event; present on {fact.matchedTrials}/{comparison.trials} shifted dates.</p>)}
    </div>)}
  </details>;
}
