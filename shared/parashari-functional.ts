/** Partial house-lordship context and a separately measured direct-lord subset. */
import { SIGN_LORD, houseFrom, type Planet } from "./astro";
import { matterOf, type EventOutcome } from "./events";
import type { ManleyEvidence } from "./manley-evidence";
import { LAGNA_NATURE } from "./parashari-data";
import { signDignity, type PlacementDignity } from "./parashari-varga-evidence";

export const FUNCTIONAL_SOURCE = {
  label: "BPHS 34.1–17, 19–44 · functional lordship; divisional application is provisional",
  url: "https://www.astrosumitbajaj.com/wp-content/uploads/2020/04/Brihat-Parasara-Hora-Shastra.pdf",
};
export type FunctionalClass = "yogakaraka" | "auspicious" | "malefic" | "neutral" | "unclassified";
export interface FunctionalFrame {
  planet: Planet;
  sign: number;
  house: number;
  dignity: PlacementDignity | "not graded";
  owns: number[];
  classification: FunctionalClass;
  /** A named pair is not independently promoted to an auspicious planet. */
  yogaPair?: { partner: Planet; links: string[]; formation?: string[]; partnerOwns?: number[] };
  directMatterLord: boolean;
}

/** BPHS 34's natal table is also applied to divisional ascendants provisionally. */
export function functionalFrame(planet: Planet, ascendant: number, sign: number, matterHouse: number,
  relation: (other: Planet) => string[], formation?: (other: Planet) => string[]): FunctionalFrame {
  const node = planet === "Rahu" || planet === "Ketu";
  const n = LAGNA_NATURE[ascendant];
  const owns = node ? [] : Array.from({ length: 12 }, (_, i) => i + 1)
    .filter((house) => SIGN_LORD[(ascendant + house - 1) % 12] === planet);
  const classification: FunctionalClass = node ? "unclassified" : n.yogakaraka.includes(planet) ? "yogakaraka"
    : n.auspicious.includes(planet) ? "auspicious" : n.malefic.includes(planet) ? "malefic"
      : n.neutral.includes(planet) ? "neutral" : "unclassified";
  const partner = n.yogaPair?.includes(planet) ? n.yogaPair.find((p) => p !== planet) : undefined;
  return { planet, sign, house: houseFrom(ascendant, sign), dignity: node ? "not graded" : signDignity(planet, sign),
    owns, classification, yogaPair: partner ? { partner, links: relation(partner),
      formation: formation?.(partner), partnerOwns: Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((house) => SIGN_LORD[(ascendant + house - 1) % 12] === partner) } : undefined,
    directMatterLord: owns.includes(matterHouse) };
}

/**
 * An experimental count of DISTINCT main/sub lords with a direct matter-house
 * lordship and an independently auspicious/yogakaraka label in that same frame.
 * Other evidence and the third level are not scored. Undefined means ineligible.
 */
export function functionalObservation(evidence: ManleyEvidence | undefined, outcome?: EventOutcome): number | undefined {
  if (!evidence || evidence.periods.length !== 2) return undefined;
  const nature = outcome ?? matterOf(evidence.matter).nature;
  if (nature !== "favourable" && nature !== "good") return undefined;
  if (evidence.periods.some((p) => p.frames.length !== 2 || p.frames.some((f) => !f.functional))) return undefined;
  const qualifying = evidence.periods.filter((p) => p.frames.some((f) =>
    f.functional?.directMatterLord && (f.functional.classification === "auspicious" || f.functional.classification === "yogakaraka")));
  return new Set(qualifying.map((p) => p.planet)).size;
}
