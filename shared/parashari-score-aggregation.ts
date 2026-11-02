import type { ParashariPromiseCheck } from "./parashari-promise";
import type { ParashariSpecificCheck } from "./parashari-specific";
import type { ParashariDivisionalCheck } from "./parashari-divisional";
import { qualifiedTotals, type QualifiedEventScore, type QualifiedEventScores } from "./qualified-event-scores";

type LegacyCheck = ParashariPromiseCheck | ParashariSpecificCheck | ParashariDivisionalCheck;
const NATAL = new Set(["d1-support", "division-support", "d10-lords"]);

/** Preserve a per-event check while marking its date-independent factors for
 * candidate-level aggregation. V1's factor order is documented in its type. */
export function parashariLegacyScore(check: LegacyCheck | undefined): QualifiedEventScore | undefined {
  if (!check) return undefined;
  const factors = "version" in check ? check.factors : check.factors.map((matched, i) => ({
    id: ["d1-support", "division-support", "dasa", "bhukti", "double-transit"][i], matched,
  }));
  const conditions: QualifiedEventScore["conditions"] = factors.map((factor) => ({
    id: factor.id, label: factor.id, status: factor.matched ? "matched" : "unresolved",
    ...(NATAL.has(factor.id) ? { oncePerCandidate: `parashari:${check.matter}:${check.division}:${factor.id}` } : {}),
  }));
  return { score: check.score, max: check.max, conditions };
}

export function aggregateParashariLegacy(scores: Array<QualifiedEventScore | undefined>): { score: number; max: number } {
  return qualifiedTotals(scores.map((score): QualifiedEventScores | undefined => score ? { parashari: score } : undefined), "parashari");
}
