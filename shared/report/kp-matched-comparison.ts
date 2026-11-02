import type { KpMatchedComparison } from "../kp-matched-types";
import type { ReportPara } from "./types";

export function kpMatchedParas(c: KpMatchedComparison | undefined): ReportPara[] {
  if (!c) return [];
  if (c.status === "unavailable") return [{ kind: "note", provisional: true, text: `Sequence-preserving KP comparison unavailable: ${c.reason} Eligible offsets: ${c.eligibleOffsets}.` }];
  return [{ kind: "note", provisional: true, text: `Sequence-preserving KP comparison: ${c.timing.actual}/${c.timingMax} period links; shifted-date mean ${c.timing.mean}, sd ${c.timing.sd}, mid-rank ${c.timing.percentile}%. Other checks, actual / shifted mean / mid-rank: transit ${c.transit.actual} / ${c.transit.mean} / ${c.transit.percentile}%${c.qualified ? `; qualified ${c.qualified.actual} / ${c.qualified.mean} / ${c.qualified.percentile}%` : ""}${c.aurora ? `; Aurora ${c.aurora.actual} / ${c.aurora.mean} / ${c.aurora.percentile}%` : ""}${c.auroraV2 ? `; Aurora v2 ${c.auroraV2.actual} / ${c.auroraV2.mean} / ${c.auroraV2.percentile}%` : ""}. ${c.trials} of ${c.eligibleOffsets} eligible common shifts of 180–365 days were sampled without replacement, preserving clocks, zones and event order. Natal cusp points are excluded from the timing count. The first offset is ${c.exampleOffsetDays} days (${c.exampleDates.join(", ")}). ${c.timing.sd === 0 && c.timing.actual === c.timing.mean ? "The scores do not distinguish the actual dates from these samples. " : ""}Shifted dates are not verified non-events; the mid-rank is not a birth-time probability.` }];
}
