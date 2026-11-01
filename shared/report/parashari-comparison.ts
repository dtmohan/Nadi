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
  if (comparison.hierarchy) {
    const h = comparison.hierarchy;
    for (const [label, stat] of [["Hierarchy: D1", h.d1], ["Hierarchy: division", h.division],
      ["Hierarchy: main period", h.major], ["Hierarchy: subperiod", h.sub], ["Hierarchy: third period, conditional", h.third]] as const)
      if (stat) rows.push([label, String(stat.actual), `${stat.mean} ± ${stat.sd}`, String(stat.percentile)]);
  }
  if (comparison.crossTiming) {
    const c = comparison.crossTiming;
    rows.push(["Cross-chart timing: main and subperiod", `${c.first.actual}/${c.eligibleEvents}`, `${c.first.mean} ± ${c.first.sd}`, String(c.first.percentile)]);
    if (c.third) rows.push(["Cross-chart timing: third, conditional", String(c.third.actual), `${c.third.mean} ± ${c.third.sd}`, String(c.third.percentile)]);
  }
  if (comparison.functional) {
    const s = comparison.functional.stat;
    rows.push(["Functional direct-lord subset", `${s.actual} (${comparison.functional.eligibleEvents} events)`, `${s.mean} ± ${s.sd}`, String(s.percentile)]);
  }
  if (comparison.conditional) {
    const c = comparison.conditional;
    for (const [label, stat] of [["Conditional yoga pair", c.yoga], ["Node sign-ruler link", c.node], ["Event-house combination", c.event]] as const)
      rows.push([label, `${stat.actual}/${c.eligibleEvents}`, `${stat.mean} ± ${stat.sd}`, String(stat.percentile)]);
  }
  const paras: ReportPara[] = [{ kind: "note", provisional: true,
    text: `Parashari comparisons use ${trials} sets of random dates, the same eligible events, outcomes and natal candidate, with the same event clock and time zone. Period lords and any transits required by the selected check are recalculated. The staged third level uses actual events that passed the first gate and each event's sampled dates that also passed it, recombined independently across events; this staged gate does not assess outcome or add a transit rule. The partial checks do not deny an event or establish a birth time, and their percentiles do not adjust for trying multiple birth times or related measures. Random dates need not preserve event ages or order and are not known non-events. These comparisons do not change the ranking.` }];
  if (comparison.staged) paras.push({ kind: "note", provisional: true,
    text: "The older staged primary links are in each event's divisional chart and do not require D1. They are retained for comparison with earlier research." });
  if (comparison.hierarchy) paras.push({ kind: "note", provisional: true,
    text: `The earlier strict hierarchy requires a partial D1 gate before considering the division. It can miss divisional strength and must not be used to exclude candidates. Its third-period comparison uses only actual and sampled dates passing all earlier gates for each event. Qualifying sampled-date counts: ${comparison.hierarchy.qualifyingDraws.join(", ") || "none"}. In four fresh public cases no candidate passed the D1 gate for both selected events in a reported-time ±30-minute scan.` });
  if (comparison.crossTiming) paras.push({ kind: "note", provisional: true,
    text: `Cross-chart timing clues include the divisional ascendant, D1 house lord and secondary house, as well as the primary house, its lord and significators. Each qualifying period has a listed link in both charts; third-level comparisons are conditional on the first two. Qualifying sampled-date counts: ${comparison.crossTiming.qualifyingDraws.join(", ") || "none"}. These describe timing clues, not a complete natal promise, a candidate filter or a validated forecast. In a small three-person check, all three held-out dates and all 18 nearby comparison dates had the main-and-subperiod clues; the comparison dates are not known non-events.` });
  if (comparison.functional) paras.push({ kind: "note", provisional: true,
    text: "The functional direct-lord subset counts distinct main/subperiod lords that directly own the mapped event house and are independently auspicious or yogakaraka in that same D1 or divisional frame. A repeated lord counts once. It is an app convention for favourable mapped events, recomputed on random dates; it is not a natal promise, event prediction or birth-time filter. Nodes, conditional pairs and third periods are not scored. In five fresh public cases, four adjacent-sign comparisons tied and one favoured the published-sign side; 29 of 30 nearby comparison dates had the same count as the held-out event. Those dates are not verified non-events." });
  if (comparison.conditional) paras.push({ kind: "note", provisional: true,
    text: "Conditional measures separately count events with a formed named yoga pair linked to the matter house, an indirect one-hop node sign-ruler link, and a period lord in the matter house with a direct house-lord or karaka link. They use main/subperiods in D1 or the event's division for favourable mapped events and are recomputed on random dates. They can overlap and are not summed, ranked or used to deny events. In five fresh public cases the pair flag appeared in none of 15 events. Of 30 dates near held-out events, 23 had the same node flag and 28 had the same combination flag. Comparison dates are not verified non-events." });
  if (rows.length) paras.push({ kind: "table", head: ["Measure", "Actual", "Comparison mean ± sd", "Percentile"], rows });
  if (comparison.staged && !comparison.staged.third) paras.push({ kind: "note", provisional: true,
    text: comparison.staged.first.actual === 0 ? "No actual event met the first-stage gate, so the third-stage comparison is unresolved."
      : `At least one qualifying real event had no sampled date that passed its first-stage gate, so the third-stage comparison is unavailable.` });
  if (comparison.staged?.third) paras.push({ kind: "note", provisional: true,
    text: `Across the ${comparison.staged.qualifyingDraws.length} qualifying real events, each had ${Math.min(...comparison.staged.qualifyingDraws)}–${Math.max(...comparison.staged.qualifyingDraws)} qualifying random dates out of ${trials}. Small counts make the conditional comparison less stable.` });
  if (comparison.unavailable?.length) paras.push({ kind: "note", provisional: true,
    text: `Comparison unavailable for ${comparison.unavailable.join(", ")}: a trial could not evaluate the same eligible events; it was not assigned a zero.` });
  if (example?.length) paras.push({ kind: "table", head: ["First comparison set", "Date and local time", "v1 / v2 / v3", "Older broad / third", "Hierarchy sub / third"],
    rows: example.map((e) => {
      const stage = stagedObservation(e.manley);
      return [e.label, `${e.date} · ${describeEventMoment(e, birthZone)}`,
        [e.promise?.score ?? "—", e.specific?.score ?? "—", e.divisional?.score ?? "—"].join(" / "),
        stage ? `${stage.first ? "link" : "unresolved"} / ${stage.third ? "link" : "unresolved"}` : "—",
        e.hierarchy ? `${e.hierarchy.passes.sub ? "pass" : "unresolved"} / ${e.hierarchy.passes.third ? "pass" : "unresolved"}` : "—"];
    }) });
  return paras;
}
