import type { PlanetPosition, Relation } from "./astro";
import { provenanceOf, qualifiersOf, RULES, type Finding, type PairRelation } from "./rules";

/** Reconstruct every combination edge from the same structured relations used by the evaluator.
 * Grade explanations omit same-sign extra companions, so prose is not a reliable source of edges. */
export function findingProvenance(
  f: Pick<Finding, "source" | "planets" | "relation">,
  relations: readonly PairRelation[],
): "source" | "mixed" | "extension" | "unresolved" {
  if (!/adjacent-sign extension provisional/i.test(f.source ?? "")) return "source";
  const [subject, ...others] = f.planets;
  if (!subject || !others.length) return "unresolved";
  const edges: Array<{ relation: Relation }> = [];
  for (let index = 0; index < others.length; index++) {
    const other = others[index];
    const relation = index === 0 && f.relation ? f.relation : relations.find((r) => r.subject === subject && r.object === other)?.relation;
    if (!relation || relation === "none") return "unresolved";
    edges.push({ relation });
  }
  return provenanceOf(f.source, edges);
}

/** A tested exception is distinct from text-only Jupiter-aspect / weak-Moon qualifiers. */
export function findingQualifiers(
  f: Pick<Finding, "ruleId" | "text">,
  positions: readonly PlanetPosition[],
): { tested: string[]; untested: string[] } {
  const qualifiers = qualifiersOf(f.text);
  const condition = RULES.find((r) => r.id === f.ruleId)?.when.without;
  const testedJupiter = f.ruleId === "f-ma-ke" && condition?.planet === "Jupiter" &&
    (condition.relation ?? ["conjunct"]).includes("conjunct") && positions.some((p) => p.planet === "Jupiter");
  const tested: string[] = testedJupiter ? qualifiers.filter((q) => q === "The source adds: unless Jupiter joins.") : [];
  return { tested, untested: qualifiers.filter((q) => !tested.includes(q)) };
}
