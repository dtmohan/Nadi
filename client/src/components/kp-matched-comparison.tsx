import type { KpMatchedComparison } from "@shared/kp-matched-types";

export function KpMatchedComparisonPanel({ comparison }: { comparison?: KpMatchedComparison }) {
  if (!comparison) return null;
  if (comparison.status !== "available") return <p className="mt-2 text-xs text-muted-foreground" data-testid="kp-matched-unavailable">Sequence-preserving KP comparison unavailable: {comparison.reason} Eligible offsets: {comparison.eligibleOffsets}.</p>;
  const timing = comparison.timing;
  return <div className="mt-2 rounded border px-3 py-2 text-xs" data-testid="kp-matched-comparison">
    <p><strong>KP comparison with event sequence retained:</strong> period links {timing.actual}/{comparison.timingMax}; shifted-date mean {timing.mean}, spread {timing.sd}, mid-rank {timing.percentile}%.</p>
    <p className="mt-1">Other KP checks, actual / shifted mean / mid-rank: transit {comparison.transit.actual} / {comparison.transit.mean} / {comparison.transit.percentile}%{comparison.qualified ? `; qualified stages ${comparison.qualified.actual} / ${comparison.qualified.mean} / ${comparison.qualified.percentile}%` : ""}{comparison.aurora ? `; Aurora ${comparison.aurora.actual} / ${comparison.aurora.mean} / ${comparison.aurora.percentile}%` : ""}{comparison.auroraV2 ? `; Aurora v2 ${comparison.auroraV2.actual} / ${comparison.auroraV2.mean} / ${comparison.auroraV2.percentile}%` : ""}.</p>
    <p className="mt-1 text-muted-foreground">The natal cusp indication is held fixed and excluded from these timing counts. {timing.sd === 0 && timing.actual === timing.mean ? "All sampled scores match the recorded score, so this test does not distinguish the dates. " : ""}Each of {comparison.trials} reproducibly sampled sets shifts every event by the same 180–365 calendar days, preserving their local clocks, zones and order. {comparison.eligibleOffsets} offsets were eligible; the first shift is {comparison.exampleOffsetDays > 0 ? "+" : ""}{comparison.exampleOffsetDays} days ({comparison.exampleDates.join(", ")}).</p>
    <p className="mt-1 text-muted-foreground">The shifted dates are not verified non-events and can still be implausible. The mid-rank is descriptive, not a probability of a birth time. The older independent-date comparison is shown separately where available.</p>
  </div>;
}
