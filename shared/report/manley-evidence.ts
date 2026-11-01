import type { ManleyEvidence } from "../manley-evidence";
import { SIGNS } from "../astro";
import type { ReportPara } from "./types";

/** Compact practitioner observations; no point score or automatic verdict. */
export function manleyEvidenceParas(e: ManleyEvidence, source: number, educationSource?: number, functionalSource?: number): ReportPara[] {
  const shown = (items: string[]) => items.length ? items.join("; ") : "none found";
  const periods = [...e.periods, ...(e.antara ? [e.antara] : [])];
  const moment = e.moment ? ` Event time ${e.moment.time}${e.moment.timeAssumed ? " (noon assumed)" : ""}, ${e.moment.timezone ?? "birth zone"}${e.moment.timezoneAssumed ? " (birth zone assumed)" : ""}.` : "";
  const paras: ReportPara[] = [{
    kind: "p",
    text: `Manley event clues · ${e.label} · ${e.date} · D1 and ${e.division}.${moment} ${periods.map((p) =>
      `${p.level} ${p.planet}: ${p.frames.map((f) => `${f.chart} house ${f.house}: ${shown(f.primary.house)}; house lord: ${shown(f.primary.houseLord)}; karaka: ${shown(f.primary.karaka)}; supporting: ${shown([...f.supporting.ascendant, ...f.supporting.natalHouseLord, ...f.supporting.bhavat, ...f.supporting.nodes])}${f.functional ? `; period lord in ${SIGNS[f.functional.sign]} house ${f.functional.house}, ${f.functional.dignity}; owns ${f.functional.owns.join(", ") || "no houses in this convention"}; functional classification ${f.functional.classification}${f.functional.yogaPair ? `; named pair with ${f.functional.yogaPair.partner}: ${shown(f.functional.yogaPair.links)}; formation: ${shown(f.functional.yogaPair.formation ?? [])}; partner owns ${f.functional.yogaPair.partnerOwns?.join(", ")}` : ""}` : ""}${f.nodeDispositor ? `; node's sign ruler ${f.nodeDispositor.planet} in ${SIGNS[f.nodeDispositor.sign]} house ${f.nodeDispositor.house}, owns ${f.nodeDispositor.owns.join(", ")}: ${shown(f.nodeDispositor.links)}` : ""}${f.eventCombination?.matched ? `; same-frame event combination: ${shown(f.eventCombination.explanations)}` : ""}`).join(". ")}`,
    ).join(". ")}.`,
    cites: [source],
    provisional: true,
  }];
  for (const p of periods) for (const f of p.frames) if (f.angleTrinePairs.length) paras.push({ kind: "p", provisional: true,
    text: `${p.level} ${p.planet}, ${f.chart}: angle/trine lord connections: ${f.angleTrinePairs.map((pair) => `${p.planet} (owns ${pair.owns.join(", ")}) and ${pair.partner} (owns ${pair.partnerOwns.join(", ")}): ${pair.links.join(", ")}`).join("; ")}. Other house ownership and strength remain relevant; this connection alone does not establish relevance to the event or a complete yoga.`,
    cites: [source, ...(functionalSource === undefined ? [] : [functionalSource])] });
  paras.push({ kind: "note", provisional: true, text: "Functional classifications use BPHS 34's rising-sign table. Applying it to the division is a provisional app convention; the named-pair relationship is not an individually favourable label. The separate angle/trine check covers 4/7/10 and 5/9 lords through selected conjunctions, exchanges or mutual full aspects. It omits other forms and does not settle adverse lordship exceptions. Node-ruler links are one hop and may include difficult lordships. The event-house combination uses placement plus a direct house-lord or karaka link; these clues can overlap. Dignity and these partial observations are not event verdicts." });
  if (e.educationFourth?.length && educationSource !== undefined) paras.push({
    kind: "p",
    text: `D24 fourth-house education clues, separately from Manley's fifth: ${e.educationFourth.map((p) => `${p.level} ${p.planet}, fourth sign ${SIGNS[p.houseSign]}, lord ${p.houseLord}: ${shown(p.house)}; lord: ${shown(p.houseLordLinks)}`).join(". ")}.`,
    cites: [educationSource],
    provisional: true,
  });
  return paras;
}
