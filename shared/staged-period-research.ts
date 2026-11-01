/** Research-only scoring. Missing primary links are unresolved, not proof an event is impossible. */
export interface StagedFact { primary: boolean[] }
export type ResearchModel = "M2" | "M3" | "S2" | "S3";

export function researchScore(facts: StagedFact[], model: ResearchModel): number {
  if (model === "S2") return facts.filter(({ primary }) => primary[0] && primary[1]).length;
  if (model === "S3") return facts.filter(({ primary }) => primary[0] && primary[1] && primary[2]).length;
  return facts.reduce((sum, { primary }) => sum + primary.slice(0, model === "M2" ? 2 : 3).filter(Boolean).length, 0);
}

/** Stage 3 breaks ties only within the best stage-2 candidates, and retains every tie. */
export function researchTopIndices(candidates: StagedFact[][], model: ResearchModel): number[] {
  if (!candidates.length) return [];
  const indices = candidates.map((_, i) => i);
  const bestFirst = Math.max(...candidates.map((facts) => researchScore(facts, "S2")));
  const eligible = model === "S3" ? indices.filter((i) => researchScore(candidates[i], "S2") === bestFirst) : indices;
  const best = Math.max(...eligible.map((i) => researchScore(candidates[i], model)));
  return eligible.filter((i) => researchScore(candidates[i], model) === best);
}
