/** Reviewed, deliberately limited paraphrases of individual matched Sarvartha rules. */
import type { SarvarthaFinding } from "./sarvartha";

const PLAIN: Record<string, { ref: string; text: string }> = {
  "1.90": { ref: "2.90", text: "The text associates this condition with being frequently on the move." },
  "2.12": { ref: "3.12", text: "The text associates this condition with caring for family and others, and with pleasant speech." },
  "2.36": { ref: "3.36", text: "The text associates this condition with understanding mathematics." },
  "2.40": { ref: "3.40", text: "The text associates this condition with skill in logic." },
  "2.41": { ref: "3.41", text: "The text associates this condition with knowledge of grammar." },
  "3.31": { ref: "4.31", text: "The text associates this condition with patience, courage and learning." },
};

/** Only paraphrase the exact rule that fired; absence of a reviewed paraphrase is not a finding. */
export function plainSarvarthaHighlights(findings: readonly SarvarthaFinding[]) {
  return findings.flatMap((f) => {
    const interpretation = PLAIN[`${f.house}.${f.stanza}`];
    return interpretation ? [{ ...interpretation, house: f.house, stanza: f.stanza, provisional: f.fidelity === "provisional" }] : [];
  });
}
