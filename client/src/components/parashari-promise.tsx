import type { ParashariPromiseCheck } from "@shared/parashari-promise";

/** Show every scored factor and conflicting house indications together. */
export function ParashariPromisePanel({ check }: { check: ParashariPromiseCheck }) {
  const show = (items: string[]) => items.length ? items.join("; ") : "none found in this partial check";
  return (
    <details className="mt-2 rounded-md border px-3 py-2 text-xs" data-testid="parashari-promise-check">
      <summary className="cursor-pointer font-medium">
        Version 1 · {check.label} · {check.date} · {check.score} of 5 rule matches
      </summary>
      <div className="mt-2 space-y-1.5 text-muted-foreground">
        <p>D1 support: {show(check.d1Support)}. D1 difficult factors: {show(check.d1Strain)}.</p>
        <p>{check.division} support: {show(check.divisionSupport)}. {check.division} difficult factors: {show(check.divisionStrain)}.</p>
        {check.periods.map((p) => <p key={p.level}>{p.level}: {p.planet} — {show(p.links)}.</p>)}
        <p>Event-day Jupiter and Saturn both contact: {show(check.doubleTransitTargets)}.</p>
        <p>One point each for D1 support, divisional support, a matter-house link from each of the two periods, and a shared transit target. These equal weights are Nadi's experimental convention. Support can coexist with difficulty; neither establishes whether an event will happen.</p>
        <p>Sources: <a className="underline" href="https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" target="_blank" rel="noreferrer">BPHS 7.1–8, 11.14–16</a>;{" "}
          {check.matter === "marriage" && <a className="underline" href="https://www.scribd.com/document/552741942/Kn-Rao-Astrology-and-Timing-of-Marriage-2008" target="_blank" rel="noreferrer">Astrology and Timing of Marriage, ch. 2</a>}
          {check.matter === "child" && <a className="underline" href="https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf" target="_blank" rel="noreferrer">Astrological Assessment of Timing of Childbirth</a>}
          {check.matter === "job" && <a className="underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf" target="_blank" rel="noreferrer">P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach</a>}.
          The exact five-point synthesis is Nadi's.{check.matter === "job" && " The career timing test is an exploratory extension."}
        </p>
      </div>
    </details>
  );
}
