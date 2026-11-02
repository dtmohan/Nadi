import React from "react";
import type { CatalogueRuleFrequency, EventCatalogueComparison } from "@shared/catalogue-comparison";

function Frequency({ title, value }: { title: string; value: CatalogueRuleFrequency }) {
  if (value.status !== "assessed") return <p>{title}: unavailable for this matter or event instant.</p>;
  return <div className="mt-1"><p>{title}: {value.actual.length ? `${value.actual.length} listed link${value.actual.length === 1 ? "" : "s"} at the event` : "no listed link at the event"}; the identical set appeared on {value.identicalSets} of {value.availableTrials} available comparison dates.</p>
    {value.occurrences.map((v) => <p className="ml-3" key={v.id}>{v.id}: {v.count}/{value.availableTrials} dates</p>)}
  </div>;
}

export function CatalogueComparisonPanel({ rows }: { rows?: EventCatalogueComparison[] }) {
  if (!rows?.length) return null;
  return <details className="mt-2 rounded-md border px-3 py-2 text-xs" data-testid="catalogue-comparison">
    <summary className="cursor-pointer font-medium">How often the same school-rule links appear on comparison dates</summary>
    <p className="mt-2 text-muted-foreground">ALP topic findings, separate marriage-context facts and ordinary Parashari period participants are recomputed on every sampled date. These counts describe recurrence, not a prediction, probability or extra score. Comparison dates are not confirmed non-events. Natal-only findings stay fixed for this birth candidate.</p>
    {rows.map((r, i) => <div className="mt-2" key={`${r.label}-${r.date}-${i}`}><p className="font-medium">{r.label} · {r.date}</p>
      <Frequency title="ALP topic findings" value={r.alp} />{r.alpMarriage && <Frequency title="ALP marriage context facts" value={r.alpMarriage} />}<Frequency title="Parashari period participants" value={r.parashariPeriods} />
    </div>)}
  </details>;
}
