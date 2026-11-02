import type { KpEventNatalRules } from "../kp-event-natal-rules";
import type { ReportPara } from "./types";
import { catalogueWording } from "./catalogue-wording";

export function kpCatalogueParas(evidence: KpEventNatalRules | undefined, label: string,
  cite?: (source: string, url?: string) => number, plain = false): ReportPara[] {
  if (!evidence) return [];
  if (evidence.status !== "assessed") return [{ kind: "note", provisional: true, text: `${label}: ordinary KP natal rules are ${evidence.status === "custom-event" ? "not assigned to these custom houses and cusp" : evidence.status === "withheld" ? "withheld by the reading policy" : "not yet qualified for this matter"}.` }];
  const promises = evidence.rules.filter((r) => r.role === "promise");
  const result: ReportPara[] = [{ kind: "note", provisional: true,
    text: `${label}: ordinary four-step KP natal conditions, a qualified subset of the catalogue. Qualified promise clues: ${evidence.indication.status}; supporting ${evidence.indication.supports.join(", ") || "none"}; challenging ${evidence.indication.strains.join(", ") || "none"}. Findings set aside by principal-cusp precedence remain notes, not deciding clues. ${promises.length ? `Conditions: ${promises.map((r) => `${r.id} ${r.matched ? "matched" : "not matched"}`).join("; ")}. ` : ""}A non-match does not mean denial. These traditional indications are not added to the experimental score.` }];
  if (evidence.matter === "illness" || evidence.matter === "accident") result.push({ kind: "note", provisional: true, text: "These interpretations cannot diagnose a condition, assess injury risk or determine an accident's severity." });
  for (const rule of evidence.rules) if (rule.finding) result.push({ kind: "p", provisional: true,
    text: `${rule.role} · ${rule.id}: ${rule.finding.text} (${rule.finding.evidence}).${rule.finding.standing ? ` Standing: ${rule.finding.standing}${rule.finding.decidedBy ? `, set aside by ${rule.finding.decidedBy}` : ""}.` : ""}${cite ? "" : ` ${rule.source}.`}`,
    ...(cite ? { cites: [cite(rule.source, rule.sourceUrl)] } : {}) });
  return catalogueWording(result, plain);
}
