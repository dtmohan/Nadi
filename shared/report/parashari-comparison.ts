import { describeEventMoment } from "../events";
import { stagedObservation, type ParashariComparison, type ParashariComparisonExample } from "../parashari-comparison";
import type { ReportPara } from "./types";

/** Report the same descriptive comparison and one inspectable sampled set. */
export function parashariComparisonParas(comparison: ParashariComparison, trials: number,
  example: ParashariComparisonExample[] | undefined, birthZone: string): ReportPara[] {
  const rows: string[][] = [];
  for (const [label, stat] of [["Parashari v1", comparison.v1], ["Parashari v2", comparison.v2], ["Parashari v3", comparison.v3]] as const)
    if (stat) rows.push([label, String(stat.actual), `${stat.mean} ± ${stat.sd}`, String(stat.percentile)]);
  if (comparison.staged) {
    const s = comparison.staged;
    rows.push(["Staged: both broad lords", `${s.first.actual}/${s.eligibleEvents}`, `${s.first.mean} ± ${s.first.sd}`, String(s.first.percentile)]);
    if (s.third) rows.push([`Third lord, conditional on each event's first stage`, String(s.third.actual),
      `${s.third.mean} ± ${s.third.sd}`, String(s.third.percentile)]);
  }
  const paras: ReportPara[] = [{ kind: "note", provisional: true,
    text: `Parashari comparisons use ${trials} sets of random dates, the same eligible events, outcomes and natal candidate, with the same event clock and time zone. Period lords and any transits required by the selected check are recalculated. The staged third level uses actual events that passed the first gate and each event's sampled dates that also passed it, recombined independently across events; this staged gate does not assess outcome or add a transit rule. The partial checks do not deny an event or establish a birth time, and their percentiles do not adjust for trying multiple birth times or related measures. Random dates need not preserve event ages or order and are not known non-events. These comparisons do not change the ranking.` }];
  if (comparison.staged) paras.push({ kind: "note", provisional: true,
    text: "The staged primary links are in each event's divisional chart; D1 is displayed separately and is not a mandatory predecessor in this partial check." });
  if (rows.length) paras.push({ kind: "table", head: ["Measure", "Actual", "Comparison mean ± sd", "Percentile"], rows });
  if (comparison.staged && !comparison.staged.third) paras.push({ kind: "note", provisional: true,
    text: comparison.staged.first.actual === 0 ? "No actual event met the first-stage gate, so the third-stage comparison is unresolved."
      : `At least one qualifying real event had no sampled date that passed its first-stage gate, so the third-stage comparison is unavailable.` });
  if (comparison.staged?.third) paras.push({ kind: "note", provisional: true,
    text: `Across the ${comparison.staged.qualifyingDraws.length} qualifying real events, each had ${Math.min(...comparison.staged.qualifyingDraws)}–${Math.max(...comparison.staged.qualifyingDraws)} qualifying random dates out of ${trials}. Small counts make the conditional comparison less stable.` });
  if (comparison.unavailable?.length) paras.push({ kind: "note", provisional: true,
    text: `Comparison unavailable for ${comparison.unavailable.join(", ")}: a trial could not evaluate the same eligible events; it was not assigned a zero.` });
  if (example?.length) paras.push({ kind: "table", head: ["First comparison set", "Date and local time", "v1 / v2 / v3", "Broad / third gate"],
    rows: example.map((e) => {
      const stage = stagedObservation(e.manley);
      return [e.label, `${e.date} · ${describeEventMoment(e, birthZone)}`,
        [e.promise?.score ?? "—", e.specific?.score ?? "—", e.divisional?.score ?? "—"].join(" / "),
        stage ? `${stage.first ? "link" : "unresolved"} / ${stage.third ? "link" : "unresolved"}` : "—"];
    }) });
  return paras;
}
