import type { HierarchyEvent } from "../parashari-hierarchy";
import type { ReportPara } from "./types";

/** Same unweighted event gate shown in the chart, validation and scan. */
export function hierarchyParas(e: HierarchyEvent): ReportPara[] {
  const show = (xs: string[]) => xs.join("; ") || "none in this subset";
  return [{ kind: "note", provisional: true,
    text: `Experimental D1 → ${e.division} gate · ${e.label} ${e.date}. D1 house ${e.d1.house}: ${e.d1.status}; support ${show(e.d1.support)}; contrary ${show(e.d1.strain)}. ${e.division} house ${e.divisionCheck.house}: ${e.divisionCheck.status}; support ${show(e.divisionCheck.support)}; contrary ${show(e.divisionCheck.strain)}. ${e.periods.map((p) => `${p.level} ${p.planet}: ${p.passes ? "passes this partial screen" : "unresolved"}; D1 links ${show(p.d1)}; ${e.division} links ${show(p.division)}`).join(". ")}. Each stage requires its predecessors. Missing or mixed indications do not deny an event; these limited gates do not establish a complete natal promise or birth time. Transits and fourth and deeper periods are omitted. In an initial four-person test, no candidate passed both D1 event checks in the reported-time ±30-minute windows.` }];
}
