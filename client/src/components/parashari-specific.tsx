import type { ParashariSpecificCheck } from "@shared/parashari-specific";
import type { ParashariDivisionalCheck } from "@shared/parashari-divisional";
import { MANLEY_SOURCE } from "@shared/manley-evidence";

export function ParashariSpecificPanel({ check }: { check: ParashariSpecificCheck | ParashariDivisionalCheck }) {
  const show = (items: string[]) => items.length ? items.join("; ") : "none found in this partial check";
  return (
    <details className="nadi-info-disclosure mt-2" data-testid="parashari-specific-check">
      <summary className="nadi-info-summary">Version {check.version} · {check.label} · {check.date} · {check.score} of {check.max} event-specific matches</summary>
      <div className="mt-2 space-y-1.5 text-muted-foreground">
        {check.factors.map((f) => <p key={f.id}><strong>{f.matched ? "Match" : "No match"}:</strong> {f.label}. {show(f.details)}.{f.id === "vivah-saham" && " This check counts full aspects; Jupiter occupying the same sign is not counted."}</p>)}
        <p>D1 difficult factors: {show(check.d1Strain)}. {check.division} difficult factors: {show(check.divisionStrain)}.</p>
        <p>Each point is an app convention. Some checks are strict subsets of broader rules; an absent match does not deny an event or identify a birth time.</p>
        {check.version === 3 && <p>The two additional divisional links can overlap with v2 factors or with each other when the period lords are the same. They do not implement the book's full qualitative funnel. {MANLEY_SOURCE.label}.</p>}
        <p>Sources: <a className="underline" href="https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" target="_blank" rel="noreferrer">BPHS 7.1–8, 11.14–16</a>;{" "}
          {check.matter === "marriage" && <a className="underline" href="https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008" target="_blank" rel="noreferrer">Astrology and Timing of Marriage, ch. 2</a>}
          {check.matter === "child" && <a className="underline" href="https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf" target="_blank" rel="noreferrer">Astrological Assessment of Timing of Childbirth, §§2.6–2.7 (citing Phaladeepika)</a>}
          {check.matter === "job" && <a className="underline" href="https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html" target="_blank" rel="noreferrer">Vishnu Bhaskar, Advanced Techniques of Predictive Astrology, vol. 1 pp. 23–24</a>}.
        </p>
      </div>
    </details>
  );
}
