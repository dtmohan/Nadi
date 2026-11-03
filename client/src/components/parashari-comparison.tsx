import React from "react";
import type { ComparisonStat, ParashariComparison, ParashariComparisonExample } from "@shared/parashari-comparison";
import { describeEventMoment } from "@shared/events";
import { ManleyEvidencePanel } from "@/components/manley-evidence";
import { ParashariPromisePanel } from "@/components/parashari-promise";
import { ParashariSpecificPanel } from "@/components/parashari-specific";
import { ParashariHierarchyEvent } from "@/components/parashari-hierarchy";

const show = (s: ComparisonStat) => `${s.actual} actual · ${s.mean} comparison mean · ${s.percentile}th percentile`;

/** Descriptive only: does not influence the birth-time ranking or highlighting. */
export function ParashariComparisonPanel({ comparison, example, trials, birthZone }: {
  comparison: ParashariComparison;
  example?: ParashariComparisonExample[];
  trials: number;
  birthZone: string;
}) {
  const staged = comparison.staged;
  const versions = [
    { label: "Version 1", stat: comparison.v1 },
    { label: "Version 2", stat: comparison.v2 },
    { label: "Version 3", stat: comparison.v3 },
  ].filter((x): x is { label: string; stat: ComparisonStat } => !!x.stat);
  return <details className="nadi-info-disclosure mt-3" data-testid="parashari-comparison">
    <summary className="nadi-info-summary">Parashari · compare the same checks on random dates</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>Each of {trials} comparison sets keeps the same eligible events, outcomes, natal candidate, event clock and time zone. Period lords and any transits required by that version are recalculated on each sampled date. Missing event clocks use noon; missing event zones use the birth zone. These comparisons do not change the ranking.</p>
      {versions.map(({ label, stat }) => <p key={label} data-testid={`parashari-comparison-${label.replace(" ", "-").toLowerCase()}`}><strong>{label}:</strong> {show(stat)}.</p>)}
      {!!comparison.unavailable?.length && <p data-testid="parashari-comparison-unavailable">Comparison unavailable for {comparison.unavailable.join(", ")}: at least one trial could not evaluate the same eligible events, so no zero score or percentile was substituted.</p>}
      {comparison.functional && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-functional">
        <p><strong>Functional direct-lord subset:</strong> {show(comparison.functional.stat)} across {comparison.functional.eligibleEvents} eligible events.</p>
        <p>For each favourable mapped event this experimental count includes distinct main and subperiod planets that directly own its house and are individually auspicious or yogakaraka in the same D1 or divisional frame. Repeated lords count once; nodes, conditional pairs and the third period do not count. The same subset is recomputed on sampled dates. A zero leaves the event unresolved; it is not a denial, prediction or birth-time filter. Functional role, dignity and other links still need judgment.</p>
        <p>In five fresh public cases, four adjacent-sign comparisons tied and one favoured the published-sign side. Of 30 dates near held-out events, 29 had the same count as the event. These comparison dates are not verified non-events.</p>
      </div>}
      {comparison.conditional && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-conditional">
        <p><strong>Conditional clues, across {comparison.conditional.eligibleEvents} favourable mapped events:</strong></p>
        <p>Named yoga pair linked to the event house: {show(comparison.conditional.yoga)}.</p>
        <p>Node sign ruler with an indirect event link: {show(comparison.conditional.node)}.</p>
        <p>Period lord in the event house with a direct lord/karaka link: {show(comparison.conditional.event)}.</p>
        <p>Each measure counts events once using main and subperiods in D1 or the relevant division. The measures overlap; they are not added together or used for ranking. The node rule is one hop and retains the ruler's other houses. Pair formation requires conjunction, exchange or mutual full aspect. A missing clue is unresolved, not an event denial. The same checks run on actual and random dates.</p>
        <p>In five fresh public cases, the pair flag appeared in none of 15 events. For five held-out events, 23 of 30 nearby dates had the same node flag and 28 had the same event-combination flag. Those dates are not verified non-events. <a className="underline" href="https://github.com/dtmohan/Nadi/blob/main/docs/parashari-conditional-fresh-review.md" target="_blank" rel="noreferrer">See the case review and limitations</a>.</p>
      </div>}
      {comparison.crossTiming && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-cross-timing">
        <p><strong>D1 and division period clues:</strong> both the main and subperiod lords have listed links in both charts for {comparison.crossTiming.first.actual} of {comparison.crossTiming.eligibleEvents} eligible events; random-date mean {comparison.crossTiming.first.mean}.</p>
        <p>The third period is compared only when both earlier lords have links for the actual event and for its sampled dates.
          {comparison.crossTiming.third ? ` Third-period clues: ${show(comparison.crossTiming.third)}; qualifying dates per event: ${comparison.crossTiming.qualifyingDraws.join(", ")}.` : " No conditional third-period comparison is available."}</p>
        <p>These are timing clues, including the D1 house lord in the division. They are not a complete natal promise, a candidate filter or a validated prediction. The same checks are used for real and comparison dates.</p>
        <p>In a small three-person check, all three held-out dates and all 18 nearby comparison dates had the main-and-subperiod clues. This subset did not distinguish those event dates from the sampled dates.</p>
      </div>}
      {comparison.hierarchy && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-hierarchy">
        <p><strong>Earlier strict gate:</strong> among {comparison.hierarchy.eligibleEvents} eligible events, the cumulative actual counts are D1 {comparison.hierarchy.d1.actual}, division {comparison.hierarchy.division.actual}, main period {comparison.hierarchy.major.actual}, subperiod {comparison.hierarchy.sub.actual}. The random-date mean after the subperiod gate is {comparison.hierarchy.sub.mean}.</p>
        <p>Natal D1 and divisional conditions do not change when only the event date is sampled. The third period is compared only for events whose actual and sampled dates pass all earlier gates.
          {comparison.hierarchy.third ? ` Third-period matches: ${show(comparison.hierarchy.third)}; qualifying draws per event: ${comparison.hierarchy.qualifyingDraws.join(", ")}.` : " No conditional third-period comparison is available."}</p>
        <p>This earlier gate stops at D1 without weighing all cross-chart indications. It cannot rule out an event or establish a birth time.</p>
      </div>}
      {staged && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-staged">
        <p><strong>Earlier divisional-only experiment:</strong> both earlier lords have a primary link for {staged.first.actual} of {staged.eligibleEvents} eligible events. Comparison mean: {staged.first.mean}; {staged.first.percentile}th percentile. This older experiment does not require D1; it is retained for comparison with prior research.</p>
        <p>The third lord is compared only for actual events that passed the earlier checks, using each event's own sampled dates that also passed those checks.
          {staged.third ? ` Third-level matches: ${show(staged.third)}. Each event had ${Math.min(...staged.qualifyingDraws)}–${Math.max(...staged.qualifyingDraws)} qualifying dates out of ${trials}.` : staged.first.actual === 0 ? " No actual event passed that first stage, so the third stage is unresolved." : " At least one such event had no qualifying sampled dates, so no third-stage percentile is available."}</p>
        <p>To form the third-level comparison, the qualifying draws are recombined independently across events. A small number of qualifying dates makes it less stable.</p>
        <p>This is the partial house, house-lord and significator gate used in the staged experiment. A missing link is unresolved; it does not deny an event. The gate does not assess the event's outcome or add a transit rule to the descriptive Manley check.</p>
      </div>}
      <p>Percentiles count ties halfway and describe these sampled dates, not the probability of a correct birth time. They do not adjust for trying multiple birth times or related measures. Random dates may not preserve realistic ages or event order and are not known non-events.</p>
      {example?.length ? <details className="rounded border px-2 py-2" data-testid="parashari-comparison-example">
        <summary className="cursor-pointer font-medium">Inspect the first comparison set</summary>
        {example.map((e, i) => <div key={`${e.label}-${e.date}-${i}`} className="mt-2">
          <p className="font-medium">{e.label} · {e.date} · {describeEventMoment(e, birthZone)}</p>
          {e.promise && <ParashariPromisePanel check={e.promise} />}
          {e.specific && <ParashariSpecificPanel check={e.specific} />}
          {e.divisional && <ParashariSpecificPanel check={e.divisional} />}
          {e.manley && <ManleyEvidencePanel evidence={e.manley} />}
          {e.hierarchy && <ParashariHierarchyEvent event={e.hierarchy} />}
          {!e.promise && !e.manley && <p>No eligible Parashari check for this comparison event.</p>}
        </div>)}
      </details> : null}
    </div>
  </details>;
}
