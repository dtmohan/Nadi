import { QUALIFIED_SCORE_KEYS, type QualifiedEventScores, type QualifiedScoreKey } from "../qualified-event-scores";
import type { BaselineStat } from "../validate-types";
import type { ReportPara } from "./types";

const sources: Record<QualifiedScoreKey, [string, string?]> = {
  kp: ["Shanmugham, Astro Secrets & KP; Leena Aurora, KP Astrology Techniques"],
  parashari: ["BPHS 16.16; Manley, Birth Time Rectification", "https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf"],
  alp: ["Pothuvudaimoorthy, Akshaya Lagna Paddhathi vol. 2 p. 35", "https://www.scribd.com/document/972735161/Jyotish-S-Pothuvudai-Moorthy-Akshaya-Lagna-Pathathi-ALP-Part-2-2021"],
  bnn: ["Shastry, Brighu Naadi Sangraha", "https://ashramsofindia.com/wp-content/uploads/2023/09/Brighu-Naadi-Sangraha-by-N-Srinivasan-Shastry.pdf"],
};
export function qualifiedScoreParas(scores: QualifiedEventScores | undefined, label: string,
  cite: (source: string, url?: string) => number, school?: string): ReportPara[] {
  return QUALIFIED_SCORE_KEYS.flatMap((key) => {
    const score = scores?.[key];
    if (!score || (school && school !== "all" && school !== key)) return [];
    return [{ kind: "p" as const, provisional: true, cites: [cite(...sources[key])],
      text: `${label} · ${key.toUpperCase()} source-scoped research: ${score.score}/${score.max} listed conditions. ${score.conditions.map((c) => `${c.label}: ${c.status}${c.detail ? ` (${c.detail})` : ""}`).join("; ")}. Counts are app conventions, not probabilities; an unresolved clue does not deny the event.` }];
  });
}
export function qualifiedComparisonParas(comparison?: Partial<Record<QualifiedScoreKey, BaselineStat>>): ReportPara[] {
  const rows = QUALIFIED_SCORE_KEYS.flatMap((key) => { const s = comparison?.[key];
    return s ? [[key.toUpperCase(), String(s.actual), `${s.mean} ± ${s.sd}`, `${s.percentile}%`]] : []; });
  return rows.length ? [{ kind: "table", head: ["Research check", "Actual", "Comparison mean ± sd", "Mid-rank"], rows },
    { kind: "note", text: "Each comparison uses the same eligible-event conditions. A natal condition can be counted again for each event; repeated points are not independent evidence. Random dates are not verified non-events; percentiles are descriptive.", provisional: true }] : [];
}
