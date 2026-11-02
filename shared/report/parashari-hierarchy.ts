import type { CrossChartPlacement, HierarchyEvent } from "../parashari-hierarchy";
import { SIGNS } from "../astro";
import type { ReportPara } from "./types";

/** Same unweighted event gate shown in the chart, validation and scan. */
export function hierarchyParas(e: HierarchyEvent): ReportPara[] {
  const show = (xs: string[]) => xs.join("; ") || "none in this subset";
  const out: ReportPara[] = [];
  if (e.crossChart) {
    const place = (p: CrossChartPlacement) => `${SIGNS[p.sign]}, house ${p.house}, ${p.dignity === "other" ? `${p.relation} sign-lord relationship` : p.dignity}`;
    out.push({ kind: "p", provisional: true,
      text: `D1 and ${e.division} together · ${e.label} ${e.date}. D1 house ${e.d1.house}: ${e.d1.status}; support ${show(e.d1.support)}; contrary ${show(e.d1.strain)}. ${e.division} house ${e.divisionCheck.house}: ${e.divisionCheck.status}; support ${show(e.divisionCheck.support)}; contrary ${show(e.divisionCheck.strain)}. ${e.crossChart.planets.map((p) => `${p.planet} (${p.roles.join(", ")}): D1 ${place(p.d1)}; ${e.division} ${place(p.division)}`).join(". ")}. A strong divisional placement is a clue, not automatic cancellation of D1 difficulties or proof of an event. A planet with multiple roles is listed once. Sign dignity and natural sign-lord relationships do not measure full strength. Sources: Paul Manley, Birth Time Rectification (2022), pp. 64–67, 123–133; P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, §§6.5–6.6 and real-life example 5.` });
    out.push({ kind: "p", provisional: true,
      text: `Period clues: ${e.crossChart.periods.map((p) => `${p.level} ${p.planet}, D1 ${show(p.d1)}; ${e.division} ${show(p.division)}`).join(". ")}. The first two links ${e.crossChart.timing.first ? "are present" : "are unresolved"}; the third ${e.crossChart.timing.first ? (e.crossChart.timing.third ? "is also present" : "is unresolved") : "is not counted before the first two"}. These are descriptive timing clues, not a natal promise or candidate filter.` });
  }
  out.push({ kind: "note", provisional: true,
    text: `Earlier experimental strict D1 → ${e.division} gate · ${e.label} ${e.date}. D1 house ${e.d1.house}: ${e.d1.status}; support ${show(e.d1.support)}; contrary ${show(e.d1.strain)}. ${e.division} house ${e.divisionCheck.house}: ${e.divisionCheck.status}; support ${show(e.divisionCheck.support)}; contrary ${show(e.divisionCheck.strain)}. ${e.periods.map((p) => `${p.level} ${p.planet}: ${p.passes ? "passes this partial screen" : "unresolved"}; D1 links ${show(p.d1)}; ${e.division} links ${show(p.division)}`).join(". ")}. The earlier strict screen can stop before considering divisional strength and must not be used to exclude candidates. Missing or mixed indications do not deny an event. In an initial four-person test, no candidate passed both D1 event checks in the reported-time ±30-minute windows.` });
  return out;
}
