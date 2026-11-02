import type { AlpMatchedComparison } from "../alp-matched-types";
import type { ReportPara } from "./types";
export function alpMatchedParas(c?: AlpMatchedComparison): ReportPara[] {
  if (!c) return [];
  if (c.status === "unavailable") return [{ kind: "note", provisional: true, text: `ALP shifted-date context unavailable: ${c.reason}` }];
  return [{ kind: "note", provisional: true, text: `ALP marriage facts were also evaluated on ${c.trials} sequence-preserving shifts. These are separate facts, not an event score. The natal seventh lord at the natal D9 ascendant is fixed for this birth chart; the progressed seventh lord can change with the event date. Shifted dates are not verified non-events.` },
    ...c.rows.map((r): ReportPara => ({ kind: "p", provisional: true, text: `${r.label} · ${r.date}: ${r.status === "unavailable" ? "context unavailable" : r.facts.map((f) => `${f.id}: ${f.actual ? "present" : "not identified"} at event, ${f.matchedTrials}/${c.trials} shifted dates`).join("; ")}.` }))];
}
