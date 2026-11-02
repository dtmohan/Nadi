import type { CatalogueRuleFrequency, EventCatalogueComparison } from "../catalogue-comparison";
import type { ReportPara } from "./types";

export function catalogueComparisonParas(rows?: EventCatalogueComparison[]): ReportPara[] {
  if (!rows?.length) return [];
  const text = (name: string, value: CatalogueRuleFrequency) => value.status !== "assessed"
    ? `${name}: unavailable.`
    : `${name}: ${value.actual.length ? `${value.actual.length} listed links at the event` : "no listed link at the event"}; identical set on ${value.identicalSets}/${value.availableTrials} available dates${value.occurrences.length ? `; ${value.occurrences.map((v) => `${v.id} ${v.count}/${value.availableTrials}`).join("; ")}` : ""}.`;
  return [{ kind: "note", provisional: true, text: "The existing ALP topic rules and Parashari ordinary period participants are recomputed for every comparison date. Counts describe recurrence, not probability, event success or additional points. Comparison dates are not confirmed non-events. Natal-only context stays fixed for this candidate." },
    ...rows.map((r): ReportPara => ({ kind: "p", provisional: true, text: `${r.label} · ${r.date}. ${text("ALP", r.alp)} ${text("Parashari periods", r.parashariPeriods)}` }))];
}
