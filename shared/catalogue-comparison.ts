import type { AlpEventEvidence } from "./alp-event-evidence";
import type { ParashariDatedCatalogue } from "./parashari-event-natal-rules";

/** Descriptive frequencies, not an event score or a forecast. */
export interface CatalogueRuleFrequency {
  status: "assessed" | "unavailable";
  actual: string[];
  availableTrials: number;
  identicalSets: number;
  occurrences: Array<{ id: string; count: number }>;
}
export interface EventCatalogueComparison {
  label: string;
  date: string;
  alp: CatalogueRuleFrequency;
  parashariPeriods: CatalogueRuleFrequency;
}
interface Evidence { alp?: AlpEventEvidence; parashariOrdinary?: ParashariDatedCatalogue }
interface EventEvidence extends Evidence { label: string; date: string }
type Extractor = (e: Evidence) => string[] | undefined;

const alp: Extractor = (e) => e.alp?.status === "assessed"
  ? e.alp.findings.map((f) => f.finding.ruleId) : undefined;
const parashariPeriods: Extractor = (e) => e.parashariOrdinary?.natal.status === "assessed" && e.parashariOrdinary.periods.length
  ? e.parashariOrdinary.periods.flatMap((p) => p.ruleIds.map((id) => `${p.level}:${p.planet}:${id}`)) : undefined;
const unique = (ids: string[]) => Array.from(new Set(ids)).sort();

/** One accumulator per event. Natal-only context is date-invariant for a
 * candidate, so only the two existing date-dependent projections are counted. */
export function createCatalogueComparison(events: EventEvidence[]) {
  const make = (actual: Evidence, extract: Extractor): CatalogueRuleFrequency => {
    const ids = extract(actual);
    const selected = ids ? unique(ids) : [];
    return { status: ids ? "assessed" : "unavailable", actual: selected, availableTrials: 0, identicalSets: 0,
      occurrences: selected.map((id) => ({ id, count: 0 })) };
  };
  const rows: EventCatalogueComparison[] = events.map((e) => ({ label: e.label, date: e.date,
    alp: make(e, alp), parashariPeriods: make(e, parashariPeriods) }));
  const update = (out: CatalogueRuleFrequency, extract: Extractor, value: Evidence) => {
    if (out.status !== "assessed") return;
    const ids = extract(value);
    if (!ids) return;
    const sample = unique(ids), present = new Set(sample);
    out.availableTrials++;
    if (sample.length === out.actual.length && sample.every((id, i) => id === out.actual[i])) out.identicalSets++;
    for (const entry of out.occurrences) if (present.has(entry.id)) entry.count++;
  };
  return {
    observe(index: number, value: Evidence) {
      const row = rows[index];
      if (!row) throw new Error("Catalogue comparison event index is out of range");
      update(row.alp, alp, value);
      update(row.parashariPeriods, parashariPeriods, value);
    },
    result: () => rows,
  };
}
