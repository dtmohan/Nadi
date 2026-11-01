import React from "react";
import type { ComparisonStat, ParashariComparison, ParashariComparisonExample } from "@shared/parashari-comparison";
import { describeEventMoment } from "@shared/events";
import { ManleyEvidencePanel } from "@/components/manley-evidence";
import { ParashariPromisePanel } from "@/components/parashari-promise";
import { ParashariSpecificPanel } from "@/components/parashari-specific";

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
  return <details className="mt-3 rounded-md border px-3 py-2 text-xs" data-testid="parashari-comparison">
    <summary className="cursor-pointer font-medium">Parashari · compare the same checks on random dates</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>Each of {trials} comparison sets keeps the same eligible events, outcomes, natal candidate, event clock and time zone. Period lords and any transits required by that version are recalculated on each sampled date. Missing event clocks use noon; missing event zones use the birth zone. These comparisons do not change the ranking.</p>
      {versions.map(({ label, stat }) => <p key={label} data-testid={`parashari-comparison-${label.replace(" ", "-").toLowerCase()}`}><strong>{label}:</strong> {show(stat)}.</p>)}
      {!!comparison.unavailable?.length && <p data-testid="parashari-comparison-unavailable">Comparison unavailable for {comparison.unavailable.join(", ")}: at least one trial could not evaluate the same eligible events, so no zero score or percentile was substituted.</p>}
      {staged && <div className="rounded border px-2 py-2" data-testid="parashari-comparison-staged">
        <p><strong>Staged divisional clues:</strong> both earlier lords have a primary link for {staged.first.actual} of {staged.eligibleEvents} eligible events. Comparison mean: {staged.first.mean}; {staged.first.percentile}th percentile. The links here are in each event's divisional chart; D1 is displayed separately and is not a mandatory predecessor in this partial check.</p>
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
          {!e.promise && !e.manley && <p>No eligible Parashari check for this comparison event.</p>}
        </div>)}
      </details> : null}
    </div>
  </details>;
}
