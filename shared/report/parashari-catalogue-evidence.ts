import type { ParashariDatedCatalogue, ParashariNatalCatalogue } from "../parashari-event-natal-rules";
import type { ReportPara } from "./types";
import { catalogueWording } from "./catalogue-wording";

export function parashariCatalogueParas(evidence: ParashariDatedCatalogue | ParashariNatalCatalogue | undefined,
  label: string, cite?: (source: string, url?: string) => number, plain = false): ReportPara[] {
  if (!evidence) return [];
  const n = "natal" in evidence ? evidence.natal : evidence;
  const periods = "natal" in evidence ? evidence.periods : [];
  if (n.status !== "assessed") return [{ kind: "note", provisional: true, text: `${label}: ordinary Parashari natal context is ${n.status === "withheld" ? "withheld by the reading policy" : "not mapped for this event"}.` }];
  const result: ReportPara[] = [{ kind: "note", provisional: true,
    text: `${label}: ordinary house ${n.subjectHouse} and yoga context uses ${n.houseMethod}, aspect floor ${n.aspectFloor}/4. The separate D1/divisional research checks use whole signs and full aspects. A house covers several topics; a yoga naming its lord is related context, not an event verdict. No points or hard gate are added.${n.houseMethodNote ? ` ${n.houseMethodNote}` : ""}` }];
  if (n.assessment) result.push({ kind: "p", provisional: true, text: `House assessment ${n.assessment.tone}; support: ${n.assessment.support.join("; ") || "none listed"}; strain: ${n.assessment.strain.join("; ") || "none listed"}.` });
  for (const clue of [n.assessment?.lordAspectClue, n.assessment?.lordOccupancyClue].filter((c) => c != null)) {
    result.push({ kind: "p", provisional: true, text: `${plain ? clue.plain : clue.text} No points are added.${cite ? "" : ` (${clue.source.label})`}`,
      ...(cite ? { cites: [cite(clue.source.label, clue.source.url), cite(clue.combustionSource.label, clue.combustionSource.url)] } : {}) });
  }
  if (periods.length) result.push({ kind: "p", provisional: true, text: `Period-lord participants: ${periods.map((p) => `${p.level} ${p.planet}: ${p.ruleIds.join(", ") || "none listed"}`).join("; ")}. These links do not establish timing.` });
  for (const { role, finding: f } of n.rules) {
    if (plain && f.id.startsWith("pa-curse-")) continue;
    const body = plain ? (f.nullified?.text ?? f.textPlain ?? f.plain ?? f.text) : f.text;
    result.push({ kind: "p", provisional: true,
    text: `${role} · ${plain ? f.titlePlain ?? f.title : f.title}: ${body}${!plain && f.nullified ? ` ${f.nullified.text}` : ""}${f.debilityCancelled ? ` ${plain ? f.debilityCancelled.plain : f.debilityCancelled.text}` : ""}${cite ? "" : ` (${f.source.label})`}`,
    ...(cite ? { cites: [cite(f.source.label, f.source.url)] } : {}) });
  }
  return catalogueWording(result, plain);
}
