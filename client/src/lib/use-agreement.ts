import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { agreementFor, type TopicAgreement } from "@shared/agreement";
import { useReadingMode } from "@/lib/reading-mode";

/** The cross-school agreement topics for a chart, shared by the Agreement panel and the Overview. */
export function useAgreement(result: ChartResult): TopicAgreement[] {
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  // The same builder as the report (shared/agreement.ts), so the panel and the report cannot disagree.
  return useMemo(() => agreementFor(result, plain), [result, plain]);
}
