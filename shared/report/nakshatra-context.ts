import type { PlanetContext } from "../planet-context";
import { dispositorDisplayRows, nakshatraDisplayRows } from "../nakshatra-context-display";
import { formatHouseQuarters, houseQuarterFrames } from "../house-dispositor-context";
import type { ShadbalaBase } from "../shadbala";
import { NAIK_PADA_SOURCE, SUTTON_QUARTER_SOURCE } from "../nakshatra-context";
import type { Cites, ReportPara } from "./types";

export function nakshatraContextParas(context: PlanetContext, cites: Cites, label: string, angles?: Pick<ShadbalaBase, "asc" | "mc">): ReportPara[] {
  const kpFrame = context.frame.houseMethod === "placidus";
  return [
    { kind: "note", text: `${label}: selected ${context.frame.ayanamsa ?? "unspecified"} ayanamsa. A star quarter is one D9 interval; the two descriptions are not independent confirmations. Boundaries depend on the birth time and calculation settings.`,
      cites: [cites.add(SUTTON_QUARTER_SOURCE.label, SUTTON_QUARTER_SOURCE.url)] },
    { kind: "table", head: ["Point", "Star · quarter", "Star lord", "D9 sign", "Qualifications", ...(!kpFrame ? ["BNN solar quarter"] : [])],
      rows: nakshatraDisplayRows(context).map((r) => [r.point, r.star, r.starLord, r.navamsa, r.qualifications, ...(!kpFrame ? [r.solar] : [])]), appendix: true },
    { kind: "note", text: kpFrame
      ? "This is the KP ayanamsa and Placidus frame. D9 and Sutton labels are comparative geometry, not KP sub-lords or KP event conditions. Qualifications do not add event-score points."
      : "Qualifications are descriptive and do not add event-score points. Sutton's ashtamamsha counts D9 from the point's D1 sign. Naik's BNN solar condition uses the Sun's same quarter; within 3°20′ across a boundary does not satisfy it. Sun and nodes are excluded by the app's convention. Parashari has separate solar orbs. The corrected BNN condition can change BNN readings.",
      cites: [cites.add(SUTTON_QUARTER_SOURCE.label, SUTTON_QUARTER_SOURCE.url), ...(!kpFrame ? [cites.add(NAIK_PADA_SOURCE.label, NAIK_PADA_SOURCE.url)] : [])] },
    { kind: "note", text: "Lord placements use this frame's D1 and D9 whole-sign houses; the count runs from the point to the lord. The D9 sign lord is not a KP sub-lord. These are descriptive facts, with no new points or event prediction." },
    { kind: "table", head: ["Point", "Sign lord", "Star lord", "D9 sign lord"], appendix: true,
      rows: dispositorDisplayRows(context).map((r) => [r.point, r.signLord, r.starLord, r.navamsaLord]) },
    ...houseQuarterFrames(context, angles).map((frame): ReportPara => ({ kind: "table", appendix: true,
      head: [`${frame.label} house`, "Intersecting stars and quarters (partial where marked)"],
      rows: frame.houses.map((house) => [`H${house.house}`, formatHouseQuarters(house)]) })),
  ];
}
