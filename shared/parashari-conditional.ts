/** Narrow, separately reported source-adapted observations; never a birth-time filter. */
import { matterOf, type EventOutcome } from "./events";
import type { ManleyEvidence } from "./manley-evidence";

export interface ConditionalObservations { yoga: boolean; node: boolean; event: boolean }

/**
 * Each flag means at least one distinct major/subperiod lord has the specified
 * clue in D1 or the relevant division. The flags overlap, are not additive,
 * and are deliberately not promoted into the older gated ranking.
 */
export function conditionalObservations(evidence: ManleyEvidence | undefined,
  outcome?: EventOutcome): ConditionalObservations | undefined {
  if (!evidence || evidence.periods.length !== 2) return undefined;
  const nature = outcome ?? matterOf(evidence.matter).nature;
  if (nature !== "favourable" && nature !== "good") return undefined;
  for (const period of evidence.periods) {
    if (period.frames.length !== 2 || period.frames[0].chart !== "D1" || period.frames[1].chart !== evidence.division)
      return undefined;
    for (const f of period.frames) {
      if (!f.functional || !f.eventCombination || (f.functional.yogaPair && !f.functional.yogaPair.formation)
        || ((period.planet === "Rahu" || period.planet === "Ketu") && !f.nodeDispositor)) return undefined;
    }
  }
  const frames = evidence.periods.flatMap((p) => p.frames);
  return {
    yoga: frames.some((f) => {
      const y = f.functional!.yogaPair;
      return !!y?.formation?.length && (f.functional!.directMatterLord || !!y.partnerOwns?.includes(f.house));
    }),
    node: frames.some((f) => !!f.nodeDispositor?.links.length),
    event: frames.some((f) => f.eventCombination!.matched),
  };
}
