import type { ManleyEvidence } from "../manley-evidence";
import { SIGNS } from "../astro";
import type { ReportPara } from "./types";

/** Compact practitioner observations; no point score or automatic verdict. */
export function manleyEvidenceParas(e: ManleyEvidence, source: number, educationSource?: number): ReportPara[] {
  const shown = (items: string[]) => items.length ? items.join("; ") : "none found";
  const periods = [...e.periods, ...(e.antara ? [e.antara] : [])];
  const moment = e.moment ? ` Event time ${e.moment.time}${e.moment.timeAssumed ? " (noon assumed)" : ""}, ${e.moment.timezone ?? "birth zone"}${e.moment.timezoneAssumed ? " (birth zone assumed)" : ""}.` : "";
  const paras: ReportPara[] = [{
    kind: "p",
    text: `Manley event clues · ${e.label} · ${e.date} · D1 and ${e.division}.${moment} ${periods.map((p) =>
      `${p.level} ${p.planet}: ${p.frames.map((f) => `${f.chart} house ${f.house}: ${shown(f.primary.house)}; house lord: ${shown(f.primary.houseLord)}; karaka: ${shown(f.primary.karaka)}; supporting: ${shown([...f.supporting.ascendant, ...f.supporting.natalHouseLord, ...f.supporting.bhavat, ...f.supporting.nodes])}`).join(". ")}`,
    ).join(". ")}.`,
    cites: [source],
    provisional: true,
  }];
  if (e.educationFourth?.length && educationSource !== undefined) paras.push({
    kind: "p",
    text: `D24 fourth-house education clues, separately from Manley's fifth: ${e.educationFourth.map((p) => `${p.level} ${p.planet}, fourth sign ${SIGNS[p.houseSign]}, lord ${p.houseLord}: ${shown(p.house)}; lord: ${shown(p.houseLordLinks)}`).join(". ")}.`,
    cites: [educationSource],
    provisional: true,
  });
  return paras;
}
