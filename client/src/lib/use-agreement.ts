import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { agreementInput, computeAgreement, type AgreementInput, type TopicAgreement } from "@shared/agreement";
import { useReadingMode } from "@/lib/reading-mode";

/** The adapters' input for a chart (Parashari, KP, Jaimini and the gate), computed once per chart and mode. */
export function useAgreementInput(result: ChartResult): AgreementInput {
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  return useMemo(() => agreementInput(result, plain), [result, plain]);
}

/** The cross-school agreement topics for a chart, shared by the Agreement panel and the Overview. */
export function useAgreement(result: ChartResult, input?: AgreementInput): TopicAgreement[] {
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  // An input already computed by the caller is reused; otherwise it is built here.
  const use = useMemo(() => input ?? agreementInput(result, plain), [input, result, plain]);
  // The same builder as the report (shared/agreement.ts), so the panel and the report cannot disagree.
  return useMemo(() => computeAgreement(use), [use]);
}
