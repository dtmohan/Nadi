import { SIGNS } from "../astro";
import type { ParashariVargaEvidence } from "../parashari-varga-evidence";
import type { ReportPara } from "./types";

/** Descriptive evidence only; the rows do not become a candidate score. */
export function parashariEvidenceParas(e: ParashariVargaEvidence, options?: { natalOnly?: boolean }): ReportPara[] {
  const rows = [e.rashi, e.varga].map((h) => [
    h.chart, `house ${h.house}: ${SIGNS[h.houseSign]}`,
    `${h.houseLord} in house ${h.lordHouse}, ${SIGNS[h.lordSign]}${h.lordDignity === "other" ? "" : ` (${h.lordDignity})`}`,
    h.occupants.join(", ") || "none", h.fullAspects.join(", ") || "none",
  ]);
  const natal = e.rashiLordInVarga;
  const rising = e.vargaLagnaLord;
  return [
    { kind: "p", text: `${e.label}${options?.natalOnly ? " · natal" : ` · ${e.date}`}: ${e.division} for ${e.subject}. D1 and ${e.division} use whole-sign houses and full sign-based aspects; this convention excludes aspects from lunar nodes. The following is descriptive, not a yes/no confirmation.`, provisional: true },
    { kind: "table", head: ["Chart", "Matter house", "House lord", "Occupants", "Full aspects"], rows },
    { kind: "p", text: `D1 house factors (partial BPHS 11.14–16 check): supporting ${e.rashiAssessment.support.join("; ") || "none found"}; difficult ${e.rashiAssessment.strain.join("; ") || "none found"}. Shadbala and other omitted conditions are not assessed here.`, provisional: true },
    { kind: "p", text: `${e.division} rises in ${SIGNS[e.varga.lagnaSign]}; ascendant lord ${rising.planet} is in house ${rising.house}, ${SIGNS[rising.sign]}${rising.dignity === "other" ? "" : ` (${rising.dignity})`}. D1 house lord ${natal.planet} is in ${e.division} house ${natal.house}, ${SIGNS[natal.sign]}${natal.dignity === "other" ? "" : ` (${natal.dignity})`}. ${options?.natalOnly ? "These natal placements do not depend on a selected date." : `Event periods in the chart's ayanamsa: ${e.periods.length ? e.periods.map((p) => `${p.level} ${p.planet} (${p.links.length ? p.links.join("; ") : "no listed house link"})`).join("; ") : "event precedes birth; periods not calculated"}.`} House reading: ${e.practitionerSource}.`, provisional: true },
  ];
}
