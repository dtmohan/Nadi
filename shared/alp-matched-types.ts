export interface AlpMatchedRow {
  label: string; date: string;
  status: "assessed" | "unavailable";
  facts: Array<{ id: string; actual: boolean; matchedTrials: number }>;
}
export type AlpMatchedComparison =
  | { status: "unavailable"; eligibleOffsets: number; reason: string }
  | { status: "available"; eligibleOffsets: number; trials: number; rows: AlpMatchedRow[];
      /** Shared offsets and the joint pada-condition comparison; absent on older results. */
      offsets?: number[];
      pada?: import("./rectify-types").RectifyBaselineStat;
      padaMax?: number };
