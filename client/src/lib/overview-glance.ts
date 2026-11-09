import type { AreaSynthesis } from "@shared/synthesis";
import { nadiAreasClauses } from "@shared/life-areas";

const GENTLE_CLAUSE: Record<string, string> = {
  "rests on firm ground": "shows supportive indications",
  "rest on firm ground": "show supportive indications",
  "needs care": "has indications that may need care",
  "need care": "have indications that may need care",
  "is in dispute, with strong rules both ways": "has differing indications",
  "are in dispute, with strong rules both ways": "have differing indications",
};

/** Summarize Nadi's synthesis in plain terms; other schools are compared separately. */
export function glanceSentence(areas: AreaSynthesis[]): string {
  const clauses = nadiAreasClauses(areas);
  if (!clauses) return "The selected Nadi rules do not give a clear direction for these topics.";
  // Replace in one pass so wording inserted for one clause cannot match a later rule.
  const gentle = clauses.replace(
    /\b(?:rests on firm ground|rest on firm ground|needs care|need care|is in dispute, with strong rules both ways|are in dispute, with strong rules both ways)\b/g,
    (match) => GENTLE_CLAUSE[match],
  );
  return `In the Nadi reading, ${gentle}.`;
}
