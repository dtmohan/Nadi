/** Apply ALP marriage facts to the same sequence-preserving dates as KP;
 * results are descriptive frequencies and never enter the partial ALP score. */
import { EVENT_MATTERS } from "@shared/events";
import { alpMarriageFacts } from "@shared/alp-marriage";
import type { AlpEventEvidence } from "@shared/alp-event-evidence";
import type { AlpMatchedComparison, AlpMatchedRow } from "@shared/alp-matched-types";
import type { MatchedEvent, prepareKpMatchedDates } from "./kp-matched-comparison";

type Selection = ReturnType<ReturnType<typeof prepareKpMatchedDates>>;
export function summarizeAlpMatched(events: readonly (MatchedEvent & { label?: string })[], selection: Selection,
  actual: readonly (AlpEventEvidence | undefined)[], score: (matter: string | undefined, asOf: string) => AlpEventEvidence | undefined): AlpMatchedComparison | undefined {
  const marriage = EVENT_MATTERS.find((m) => m.id === "marriage")!;
  const eligible = events.map((e, i) => ({ e, i })).filter(({e}) => e.matter === "marriage" &&
    (e.outcome ?? "favourable") === "favourable" && e.cusp === marriage.cusp &&
    [...e.houses].sort((a,b) => a-b).join(",") === [...marriage.houses].sort((a,b) => a-b).join(","));
  if (!eligible.length) return undefined;
  if (selection.trials.length < 40) return { status: "unavailable", eligibleOffsets: selection.available,
    reason: "Fewer than 40 valid shared date offsets." };
  const rows: AlpMatchedRow[] = eligible.map(({e, i}) => {
    const evidence = actual[i];
    const context = evidence?.status === "assessed" ? evidence.marriage : undefined;
    if (!context) return { label: e.label ?? marriage.label, date: e.date, status: "unavailable", facts: [] };
    const values = alpMarriageFacts(context.timing);
    return { label: e.label ?? marriage.label, date: e.date, status: "assessed", facts: Object.entries(values).map(([id, value]) => ({ id, actual: value, matchedTrials: 0 })) };
  });
  for (const trial of selection.trials) for (let j = 0; j < eligible.length; j++) {
    if (rows[j].status !== "assessed") continue;
    const {e, i} = eligible[j];
    const evidence = score(e.matter, trial.moments[i].iso);
    if (evidence?.status !== "assessed" || !evidence.marriage) { rows[j].status = "unavailable"; rows[j].facts = []; continue; }
    const values = alpMarriageFacts(evidence.marriage.timing);
    for (const fact of rows[j].facts) if (values[fact.id]) fact.matchedTrials++;
  }
  return { status: "available", eligibleOffsets: selection.available, trials: selection.trials.length, rows };
}
