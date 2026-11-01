import { SIGNS, fmtDegShort } from "../astro";
import type { KpTransitEvidence } from "../kp-transit-evidence";
import type { ReportPara } from "./types";

/** Practitioner appendix: the data is descriptive and is not converted to a verdict. */
export function transitEvidenceTable(label: string, evidence: KpTransitEvidence[]): ReportPara {
  const lord = (planet: string, houses: number[]) => `${planet}: ${houses.length ? houses.join(", ") : "—"}`;
  return {
    kind: "table",
    appendix: true,
    text: label,
    head: ["Transit", "Position", "Natal house", "Sign lord", "Star lord", "Sub lord", "Natal contacts within 1°"],
    rows: evidence.map((p) => [
      p.planet, `${SIGNS[Math.floor(p.lon / 30)]} ${fmtDegShort(p.lon % 30)}`, String(p.house),
      lord(p.signLord, p.signHouses), lord(p.starLord, p.starHouses), lord(p.subLord, p.subHouses),
      p.contacts.map((c) => `${c.kind} ${c.target} (${c.orb.toFixed(2)}°)`).join("; ") || "—",
    ]),
  };
}
