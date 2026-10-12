import { Soft } from "@/lib/gentle";
import { type ReactNode } from "react";
import type { Planet } from "@shared/astro";
import {
  PlanetDot,
  TimePill,
  type TimeGroupKey,
} from "@/components/planet-name";
import { Expander, HOW_FOUND } from "@/components/working";
import { cn } from "@/lib/utils";

export type VerdictTone = "good" | "mixed" | "bad" | "neutral";

export interface VerdictSignature {
  /** The planet or planets carrying the signature; drawn as identity dots. */
  planets?: Planet[];
  /** Short label for the signature (one line). */
  label: ReactNode;
  /** What it says, in one clause. */
  text: ReactNode;
  tone: VerdictTone;
}

export interface VerdictTiming {
  /** "Now", "Marriage", "Children" ... */
  label: string;
  text: ReactNode;
  when: TimeGroupKey;
}

export interface VerdictLine {
  label: string;
  text: ReactNode;
}

const TONE_TILE: Record<VerdictTone, string> = {
  good: "border-l-verdict-good bg-verdict-good/[0.08]",
  mixed: "border-l-verdict-mixed bg-verdict-mixed/[0.08]",
  bad: "border-l-verdict-bad bg-verdict-bad/[0.08]",
  neutral: "border-l-border bg-muted/40",
};

const TONE_WORD: Record<VerdictTone, string> = {
  good: "supportive",
  mixed: "mixed",
  bad: "caution",
  neutral: "noted",
};

/**
 * The answer, first. One serif sentence that says what the method concludes, the two or three
 * signatures that carry it, the timing that matters next, and the brief lines a reader needs to
 * orient. Everything below the card on the page is the working.
 */
export function VerdictCard({
  system,
  headline,
  lead,
  signatures,
  timing,
  lines,
  caveat,
  testid,
  className,
}: {
  system: string;
  headline: ReactNode;
  lead?: ReactNode;
  signatures?: VerdictSignature[];
  timing?: VerdictTiming[];
  lines?: VerdictLine[];
  caveat?: ReactNode;
  testid: string;
  className?: string;
}) {
  const sigs = (signatures ?? []).slice(0, 3);
  return (
    <section
      className={cn("rounded-lg border bg-card p-5 sm:p-6", className)}
      data-testid={testid}
      aria-label={`${system} verdict`}
    >
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {system} · the reading in brief
      </p>
      <h2
        className="font-display mt-2 max-w-[38ch] text-xl font-semibold leading-snug text-foreground"
        data-testid={`${testid}-headline`}
      >
        {headline}
      </h2>
      {lead && (
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
          {lead}
        </p>
      )}

      {sigs.length > 0 && (
        <ul
          className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          data-testid={`${testid}-signatures`}
        >
          {sigs.map((s, i) => (
            <li
              key={i}
              className={cn(
                "rounded-md border border-l-[3px] px-3 py-2 text-xs leading-snug",
                TONE_TILE[s.tone],
              )}
              data-tone={s.tone}
            >
              <div className="flex flex-wrap items-center gap-x-1.5">
                {s.planets?.map((p) => (
                  <PlanetDot key={p} planet={p} />
                ))}
                <span className="font-semibold text-foreground">{s.label}</span>
                <span className="ml-auto whitespace-nowrap text-2xs text-muted-foreground">
                  {TONE_WORD[s.tone]}
                </span>
              </div>
              <p className="mt-1 text-foreground/90">
                <Soft>{s.text}</Soft>
              </p>
            </li>
          ))}
        </ul>
      )}

      {timing && timing.length > 0 && (
        <dl
          className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"
          data-testid={`${testid}-timing`}
        >
          {timing.map((t, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <dt>
                <TimePill group={t.when} className="align-baseline">
                  {t.label}
                </TimePill>
              </dt>
              <dd className="text-foreground">
                <Soft>{t.text}</Soft>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {lines && lines.length > 0 && (
        <Expander
          testId={`${testid}-more`}
          label={HOW_FOUND}
          className="mt-4 border-t pt-3"
          contentClassName=""
        >
          <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(7rem,max-content)_1fr]">
            {lines.map((l, i) => (
              <div key={i} className="contents">
                <dt className="text-muted-foreground">{l.label}</dt>
                <dd className="max-w-[68ch] leading-relaxed">
                  <Soft>{l.text}</Soft>
                </dd>
              </div>
            ))}
          </dl>
        </Expander>
      )}
      {caveat && (
        <p className="mt-3 text-2xs text-muted-foreground">{caveat}</p>
      )}
    </section>
  );
}
