import type { BaselineStat } from "./validate-types";
export type KpMatchedStat = BaselineStat;
export type KpMatchedComparison =
  | { status: "unavailable"; eligibleOffsets: number; reason: string }
  | { status: "available"; trials: number; eligibleOffsets: number; offsets: number[]; exampleOffsetDays: number; exampleDates: string[];
      /** Timing only: natal cusp points are constant and excluded. */
      timing: KpMatchedStat; timingMax: number; transit: KpMatchedStat;
      qualified?: KpMatchedStat; aurora?: KpMatchedStat; auroraV2?: KpMatchedStat };
