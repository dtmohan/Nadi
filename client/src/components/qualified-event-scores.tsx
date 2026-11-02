import React from "react";
import { QUALIFIED_SCORE_KEYS, type QualifiedEventScores, type QualifiedScoreKey } from "@shared/qualified-event-scores";
import type { BaselineStat } from "@shared/validate-types";

const LABEL: Record<QualifiedScoreKey, string> = {
  kp: "KP natal then periods", parashari: "Parashari v4", alp: "ALP marriage pada", bnn: "BNN marriage Jupiter contact",
};
const SOURCE: Record<QualifiedScoreKey, { label: string; url?: string }> = {
  kp: { label: "Shanmugham, Astro Secrets & KP; Aurora, KP Astrology Techniques" },
  parashari: { label: "BPHS 16.16; Manley, Birth Time Rectification", url: "https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" },
  alp: { label: "Pothuvudaimoorthy, ALP vol. 2 p. 35", url: "https://www.scribd.com/document/972735161/Jyotish-S-Pothuvudai-Moorthy-Akshaya-Lagna-Pathathi-ALP-Part-2-2021" },
  bnn: { label: "Shastry, Brighu Naadi Sangraha", url: "https://ashramsofindia.com/wp-content/uploads/2023/09/Brighu-Naadi-Sangraha-by-N-Srinivasan-Shastry.pdf" },
};

export function QualifiedEventScoresPanel({ scores, school }: { scores?: QualifiedEventScores; school?: string }) {
  const keys = QUALIFIED_SCORE_KEYS.filter((k) => (!school || school === "all" || k === school) && scores?.[k]);
  if (!keys.length) return null;
  return <div className="mt-2 rounded border border-border/60 px-2 py-2" data-testid="qualified-event-scores">
    <p className="font-medium">Source-scoped research checks</p>
    <p className="text-muted-foreground">Counts are app conventions, not probabilities. Unresolved conditions do not deny an event; other findings can conflict.</p>
    {keys.map((key) => { const s = scores![key]!, src = SOURCE[key]; return <details className="mt-1" key={key}>
      <summary className="cursor-pointer">{LABEL[key]}: {s.score}/{s.max} listed conditions</summary>
      <ul className="ml-4 list-disc">{s.conditions.map((c) => <li key={c.id}>{c.label}: {c.status === "matched" ? "matched" : c.status === "not-reached" ? "not assessed after an unresolved earlier stage" : "unresolved in this subset"}{c.detail ? ` — ${c.detail}` : ""}</li>)}</ul>
      <p className="text-muted-foreground">Source: {src.url ? <a href={src.url} target="_blank" rel="noreferrer" className="underline">{src.label}</a> : src.label}. This is a partial interpretation.</p>
    </details>; })}
  </div>;
}

export function QualifiedComparisonPanel({ comparison, trials }: { comparison?: Partial<Record<QualifiedScoreKey, BaselineStat>>; trials?: number }) {
  const keys = QUALIFIED_SCORE_KEYS.filter((k) => comparison?.[k]);
  if (!keys.length) return null;
  return <details className="mt-2 rounded border px-2 py-2 text-xs" data-testid="qualified-comparison">
    <summary className="cursor-pointer font-medium">Research checks on {trials ?? 200} comparison-date sets</summary>
    <p className="text-muted-foreground">Each set applies the same conditions to the same eligible events. Dates are not verified non-events; mid-rank percentiles are exploratory.</p>
    {keys.map((key) => { const s = comparison![key]!; return <p key={key}>{LABEL[key]}: actual {s.actual}; comparison mean {s.mean}, spread {s.sd}; mid-rank {s.percentile}%.</p>; })}
  </details>;
}
