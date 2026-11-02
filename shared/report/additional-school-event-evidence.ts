import type { AdditionalSchoolNatalEvidence } from "../additional-school-event-rules";
import type { ReportPara } from "./types";
import { catalogueWording } from "./catalogue-wording";

export function additionalSchoolParas(e: AdditionalSchoolNatalEvidence | undefined, label: string,
  cite?: (source: string, url?: string) => number, school: "all" | "bnn" | "jaimini" | "prasna" = "all", plain = false): ReportPara[] {
  if (!e) return [];
  const show = (name: string) => school === "all" || school === name;
  const result: ReportPara[] = [{ kind: "note", provisional: true, text: `${label}: related natal area/house findings are contextual; they do not constitute event promises or alter any score.` }];
  if (show("bnn")) {
    result.push({ kind: "p", provisional: true, text: `BNN · ${e.bnn.area ?? "unmapped"} · ${e.bnn.status}.` });
    for (const f of e.bnn.findings) result.push({ kind: "p", provisional: true, text: `${f.ruleId}: ${f.text}`,
      ...(cite && f.source ? { cites: [cite(f.source)] } : {}) });
  }
  if (show("jaimini")) {
    result.push({ kind: "p", provisional: true, text: `Jaimini · ${e.jaimini.area ?? "unmapped"} · ${e.jaimini.status}.` });
    for (const f of e.jaimini.findings) result.push({ kind: "p", provisional: true, text: `${f.id} · ${f.chart}: ${f.text}`,
      ...(cite ? { cites: [cite(f.source.label, f.source.url)] } : {}) });
  }
  if (show("prasna")) {
    const p = e.prasna;
    result.push({ kind: "note", provisional: true, text: `Prasna Marga natal house ${p.subjectHouse ?? "unmapped"} · ${p.status}. The natal house walk is not a horary question chart and provides no event timing score.${p.gulikaMethod ? ` Gulika convention: ${p.gulikaMethod}${p.gulikaMethod !== "kerala-ghati" ? "; applying the Prasna Marga house wording to this alternative is a cross-convention comparison" : ""}.` : ""}` });
    if (p.houseReading) result.push({ kind: "p", provisional: true, text: [p.houseReading.beneficText, p.houseReading.maleficText].filter(Boolean).join(" "),
      ...(cite ? { cites: [cite(p.houseReading.source)] } : {}) });
    if (p.gulika) result.push({ kind: "p", provisional: true, text: p.gulika.text,
      ...(cite ? { cites: [cite(p.gulika.source)] } : {}) });
    if (p.gulikaClues) result.push({ kind: "p", provisional: true, text: `Jupiter and Gulika: ${p.gulikaClues.jupiter.sameSign ? "same sign (conjunction)" : p.gulikaClues.jupiterFifthOrNinthAspect ? "Jupiter's fifth/ninth full sign aspect" : p.gulikaClues.jupiter.fullAspect ? "full sign aspect" : "no full sign aspect"}. This is a clue, not an automatic cancellation or outcome.` });
  }
  return catalogueWording(result, plain);
}
