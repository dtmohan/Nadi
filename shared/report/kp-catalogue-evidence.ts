import { KP_CUSP_TRACE_SOURCE, kpCuspTraceText, type KpEventNatalRules } from "../kp-event-natal-rules";
import type { ReportPara } from "./types";
import { catalogueWording } from "./catalogue-wording";
import { kpCatalogueFindingMalayalam, kpCatalogueSummaryMalayalam, kpCatalogueTraceMalayalam, KP_CATALOGUE_HEALTH_NOTE, KP_CATALOGUE_HEALTH_NOTE_ML } from "../malayalam-kp-catalogue-report";

function translated(p: ReportPara, ml: string | undefined): ReportPara {
  return ml && p.text ? { ...p, translationMl: { source: p.text, text: ml } } : p;
}

export function kpCatalogueParas(evidence: KpEventNatalRules | undefined, label: string,
  cite?: (source: string, url?: string) => number, plain = false): ReportPara[] {
  if (!evidence) return [];
  if (evidence.status !== "assessed") {
    const p: ReportPara = { kind: "note", provisional: true, text: `${label}: ordinary KP natal rules are ${evidence.status === "custom-event" ? "not assigned to these custom houses and cusp" : evidence.status === "withheld" ? "withheld by the reading policy" : "not yet qualified for this matter"}.` };
    return [translated(p, kpCatalogueSummaryMalayalam(evidence, label, p.text!))];
  }
  const promises = evidence.rules.filter((r) => r.role === "promise");
  const result: ReportPara[] = [{ kind: "note", provisional: true,
    text: `${label}: ordinary four-step KP natal conditions, a qualified subset of the catalogue. Qualified promise clues: ${evidence.indication.status}; supporting ${evidence.indication.supports.join(", ") || "none"}; challenging ${evidence.indication.strains.join(", ") || "none"}. Findings set aside by principal-cusp precedence remain notes, not deciding clues. ${promises.length ? `Conditions: ${promises.map((r) => `${r.id} ${r.matched ? "matched" : "not matched"}`).join("; ")}. ` : ""}A non-match does not mean denial. These traditional indications are not added to the experimental score.` }];
  result[0] = translated(result[0], kpCatalogueSummaryMalayalam(evidence, label, result[0].text!));
  if (evidence.matter === "illness" || evidence.matter === "accident") result.push(translated({ kind: "note", provisional: true, text: KP_CATALOGUE_HEALTH_NOTE }, KP_CATALOGUE_HEALTH_NOTE_ML));
  if (evidence.cuspTrace) {
    const p: ReportPara = { kind: "p", provisional: true, text: `${kpCuspTraceText(evidence.cuspTrace)}${cite ? "" : ` (${KP_CUSP_TRACE_SOURCE})`}`, ...(cite ? { cites: [cite(KP_CUSP_TRACE_SOURCE)] } : {}) };
    result.push(translated(p, kpCatalogueTraceMalayalam(evidence, p.text!, !!cite)));
  }
  for (const rule of evidence.rules) if (rule.finding) {
    const p: ReportPara = { kind: "p", provisional: true,
    text: `${rule.role} · ${rule.id}: ${rule.finding.text} (${rule.finding.evidence}).${rule.finding.standing ? ` Standing: ${rule.finding.standing}${rule.finding.decidedBy ? `, set aside by ${rule.finding.decidedBy}` : ""}.` : ""}${cite ? "" : ` ${rule.source}.`}`,
    ...(cite ? { cites: [cite(rule.source, rule.sourceUrl)] } : {}) };
    result.push(translated(p, kpCatalogueFindingMalayalam(rule, p.text!, !!cite)));
  }
  return catalogueWording(result, plain);
}
