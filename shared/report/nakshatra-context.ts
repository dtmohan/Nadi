import type { PlanetContext } from "../planet-context";
import { nakshatraDisplayRows } from "../nakshatra-context-display";
import { NAIK_PADA_SOURCE, SUTTON_QUARTER_SOURCE } from "../nakshatra-context";
import type { Cites, ReportPara } from "./types";

export function nakshatraContextParas(context: PlanetContext, cites: Cites, label: string): ReportPara[] {
  return [
    { kind: "note", text: `${label}: selected ${context.frame.ayanamsa ?? "unspecified"} ayanamsa. A star quarter is one D9 interval; the two descriptions are not independent confirmations. Boundaries depend on the birth time and calculation settings.`,
      cites: [cites.add(SUTTON_QUARTER_SOURCE.label, SUTTON_QUARTER_SOURCE.url)] },
    { kind: "table", head: ["Point", "Star · quarter", "Star lord", "D9 sign", "Qualifications", "BNN solar quarter"],
      rows: nakshatraDisplayRows(context).map((r) => [r.point, r.star, r.starLord, r.navamsa, r.qualifications, r.solar]), appendix: true },
    { kind: "note", text: "Qualifications are descriptive and do not add event-score points. Sutton's ashtamamsha counts D9 from the point's D1 sign. Naik's BNN solar condition uses the Sun's same quarter; within 3°20′ across a boundary does not satisfy it. Sun and nodes are excluded by the app's convention. Parashari has separate solar orbs. The corrected BNN condition can change BNN readings.",
      cites: [cites.add(SUTTON_QUARTER_SOURCE.label, SUTTON_QUARTER_SOURCE.url), cites.add(NAIK_PADA_SOURCE.label, NAIK_PADA_SOURCE.url)] },
  ];
}
