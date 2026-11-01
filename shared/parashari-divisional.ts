/**
 * V3 adds two divisional period-lord observations to the unchanged V2 check.
 * This app-defined score is experimental; see the frozen V3 protocol.
 */
import type { ManleyEvidence, ManleyFrame } from "./manley-evidence";
import type { ParashariSpecificCheck, SpecificFactor } from "./parashari-specific";

export interface ParashariDivisionalCheck {
  version: 3;
  label: string;
  date: string;
  matter: ParashariSpecificCheck["matter"];
  division: ParashariSpecificCheck["division"];
  score: number;
  max: 8;
  factors: SpecificFactor[];
  d1Strain: string[];
  divisionStrain: string[];
}

/** Undefined when either check is ineligible or its event/frame cannot be matched. */
export function parashariDivisionalCheck(
  base: ParashariSpecificCheck | undefined,
  evidence: ManleyEvidence | undefined,
): ParashariDivisionalCheck | undefined {
  if (!base || !evidence || base.date !== evidence.date || base.matter !== evidence.matter || base.division !== evidence.division)
    return undefined;
  const factor = (level: "dasa" | "bhukti"): SpecificFactor | undefined => {
    const period = evidence.periods.find((p) => p.level === level);
    const frame: ManleyFrame | undefined = period?.frames.find((f) => f.chart === base.division);
    if (!period || !frame) return undefined;
    const details = [...frame.primary.house, ...frame.primary.houseLord, ...frame.primary.karaka];
    return {
      id: `division-${level}`,
      label: `${level} lord connects to ${base.division} event house, lord or karaka`,
      matched: details.length > 0,
      details: [`${period.planet}: ${details.length ? details.join("; ") : "no primary link found in this subset"}`],
    };
  };
  const dasa = factor("dasa"), bhukti = factor("bhukti");
  if (!dasa || !bhukti) return undefined;
  const factors = [...base.factors, dasa, bhukti];
  return {
    version: 3, label: base.label, date: base.date, matter: base.matter, division: base.division,
    factors, score: factors.filter((f) => f.matched).length, max: 8,
    d1Strain: base.d1Strain, divisionStrain: base.divisionStrain,
  };
}
