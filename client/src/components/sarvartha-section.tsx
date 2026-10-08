import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import {
  SC_BHAVAS,
  SC_BHAVA_RULES,
  SC_RAJYOGAS,
  SC_DASHA_PHALA,
  SC_LONGEVITY,
  SC_METHOD_NOTE,
  SC_SOURCE,
  SC_LIFESPAN_TOPICS,
  FIDELITY_LABEL,
  FIDELITY_NOTE,
  ruleFidelity,
  type FidelityTier,
  type SarvarthaResult,
} from "@shared/sarvartha";
import { PLANET_ABBR } from "@shared/astro";
import { SENSITIVE_WITHHELD_NOTE, withholdText } from "@shared/life-stage";
import { SectionTitle, ModeText, usePlain } from "@/components/mode-text";
import { Soft } from "@/lib/gentle";
import { cn } from "@/lib/utils";

const ORDINAL = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th",
];

/**
 * True when a Sarvartha statement is left out of this view. The rules on the length of life, on
 * bereavement and on bodily danger (the sensitive-content gate's topics) are read in the
 * practitioner view only, as written, and never for a native under the sensitive age. The gentle
 * rewording cannot be applied to this text phrase by phrase, so the plain reading leaves them out.
 */
export function sarvarthaLeftOut(
  topic: string,
  text: string,
  plain: boolean,
  withheld: boolean,
): boolean {
  return (
    (plain || withheld) &&
    (SC_LIFESPAN_TOPICS.has(topic) || withholdText(`${topic}: ${text}`))
  );
}

const SC_GENTLE =
  "Venkatesha's rules on the length of life, on bereavement and on bodily danger are shown here as written: checks of the text against the chart, never a forecast of an event or its date. The plain reading leaves them out.";

function ScGentleNote({ testId }: { testId: string }) {
  return (
    <p
      className="mt-2 rounded border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
      data-testid={testId}
    >
      {SC_GENTLE}
    </p>
  );
}

function FidelityDot({ tier }: { tier: FidelityTier }) {
  if (tier === "cited") return null;
  return (
    <span
      className={cn(
        "ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle",
        tier === "provisional" ? "bg-amber-400" : "bg-emerald-500",
      )}
      title={FIDELITY_LABEL[tier]}
      aria-label={FIDELITY_LABEL[tier]}
    />
  );
}

/** A folded part of the full text: closed until the reader asks for it, in either reading mode. */
function Fold({
  testId,
  title,
  count,
  children,
}: {
  testId: string;
  title: ReactNode;
  count?: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-md border bg-card" data-testid={testId}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="min-w-0 flex-1">{title}</span>
        {count !== undefined && (
          <span className="tabular shrink-0 text-xs font-normal text-muted-foreground">
            {count}
          </span>
        )}
      </summary>
      <div className="border-t px-3 pb-3 pt-2">{children}</div>
    </details>
  );
}

/**
 * Sarvartha Chintamani (Venkatesha): a Parashari-lineage elaboration of the house results, shown
 * under Parashari with its own citations. What applies to this chart comes first, house by house;
 * the author's full text follows in folds, so the reference is there without being the page.
 */
export function SarvarthaSection({
  sarvartha,
  withheld = false,
}: {
  sarvartha?: SarvarthaResult;
  /** The native is under the sensitive-content age: leave out the length-of-life and loss rules. */
  withheld?: boolean;
}) {
  const plain = usePlain();
  const leftOut = (topic: string, text: string) =>
    sarvarthaLeftOut(topic, text, plain, withheld);

  const fired = new Set(sarvartha?.findings.map((f) => `${f.house}.${f.stanza}`));
  const findings = (sarvartha?.findings ?? []).filter(
    (f) => !leftOut(f.topic, f.text),
  );
  const byHouse = SC_BHAVA_RULES.map((h) => ({
    ...h,
    found: findings.filter((f) => f.house === h.house),
  })).filter((h) => h.found.length > 0);
  const rajyogas = sarvartha?.rajyogas ?? [];
  const dasha = SC_DASHA_PHALA.filter((r) => !leftOut("", `${r.when} ${r.then}`));
  const showLongevity = !plain && !withheld;

  return (
    <section className="mt-8" data-testid="sarvartha-section">
      <SectionTitle
        plain="Sarvartha Chintamani"
        technical="Sarvartha Chintamani (Venkatesha) — Parashari-lineage"
      />
      <ModeText
        plain={
          <>
            Parashara&apos;s house results, elaborated by Venkatesha in his
            Sarvartha Chintamani: what each house covers, read from the house,
            its lord and its significator. The rules that apply to this chart
            come first; the author&apos;s full text follows, folded.
          </>
        }
        practitioner={
          <>
            {SC_SOURCE.label}, a Parashari-lineage elaboration of the bhava
            phala. {SC_METHOD_NOTE} Rules are cited by chapter and shloka; the
            Amsha tiers of 1.25-27 are the same varga classification as Parashara
            6.42-53.
          </>
        }
      />

      <div className="mt-5" data-testid="sarvartha-applies">
        <h4 className="text-sm font-semibold">
          {plain ? "What applies to this chart" : "Rules that hold for this chart"}
          {sarvartha && (
            <span className="tabular ml-2 text-xs font-normal text-muted-foreground">
              {findings.length} of {sarvartha.computable} checked
            </span>
          )}
        </h4>
        {!sarvartha ? (
          <p className="mt-2 text-xs text-muted-foreground">
            The rules could not be read for this chart.
          </p>
        ) : byHouse.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            None of the rules the app can check holds for this chart.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {byHouse.map((h) => {
              const sig = SC_BHAVAS.find((b) => b.house === h.house);
              return (
                <div
                  key={h.house}
                  className="rounded-md border bg-card p-3"
                  data-testid={`sarvartha-house-${h.house}`}
                >
                  <div className="text-sm font-medium">
                    {ORDINAL[h.house - 1]} house
                    {sig && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {sig.significations.slice(0, 4).join(", ")}
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs leading-5">
                    {h.found.map((f) => (
                      <li key={f.stanza}>
                        <span className="font-medium">{f.topic}:</span>{" "}
                        <Soft>{f.text}</Soft>
                        <span className="ml-1 text-muted-foreground/70">
                          ({h.chapter}.{f.stanza})
                        </span>
                        <FidelityDot tier={f.fidelity} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {rajyogas.length > 0 && (
          <p className="mt-3 text-xs leading-5" data-testid="sarvartha-rajyogas-fired">
            <span className="font-medium">
              {plain ? "Royal combinations that hold" : "Rajyogas that hold"} (ch. 9):
            </span>{" "}
            {rajyogas.map((r) => `${r.text} (9.${r.stanza})`).join("; ")}.
          </p>
        )}
        {withheld ? (
          <p className="mt-3 text-xs text-muted-foreground" data-testid="sarvartha-gate">
            {SENSITIVE_WITHHELD_NOTE}
          </p>
        ) : plain ? (
          <p className="mt-3 text-xs text-muted-foreground" data-testid="sarvartha-gate">
            Rules on the length of life, on bereavement and on bodily danger
            are left out of the plain reading; the practitioner reading shows
            them as written.
          </p>
        ) : (
          <ScGentleNote testId="sarvartha-gentle-note" />
        )}
      </div>

      <div className="mt-8" data-testid="sarvartha-reference">
        <h4 className="text-sm font-semibold">
          {plain ? "The full text, folded" : "Reference: the harvested text"}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Every rule harvested from the book, house by house. Open a fold to
          read it; the rules that hold for this chart are ticked.
        </p>
        <div className="mt-3 space-y-2">
          <Fold
            testId="sarvartha-ref-significations"
            title={plain ? "What each house covers" : "Bhava significations and karakas"}
            count={SC_BHAVAS.length}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {SC_BHAVAS.map((b) => (
                <div key={b.house}>
                  <div className="text-xs font-medium">
                    {ORDINAL[b.house - 1]} house
                    <span className="ml-2 font-normal text-muted-foreground">
                      karaka {PLANET_ABBR[b.karaka]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {b.significations.join(", ")}.
                  </p>
                  {b.karakaNote && (
                    <p className="mt-0.5 text-xs text-muted-foreground/80">
                      {b.karakaNote}.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Fold>

          {SC_BHAVA_RULES.map((h) => {
            const rules = h.rules.filter(
              (r) => !leftOut(r.topic, `${r.when} ${r.then}`),
            );
            const holds = rules.filter((r) => fired.has(`${h.house}.${r.stanza}`)).length;
            if (!rules.length) return null;
            return (
              <Fold
                key={h.house}
                testId={`sarvartha-ref-house-${h.house}`}
                title={`${ORDINAL[h.house - 1]} house · chapter ${h.chapter}`}
                count={holds ? `${holds} of ${rules.length} hold` : `${rules.length} rules`}
              >
                <ul className="mt-1 space-y-1.5 text-xs leading-5">
                  {rules.map((r) => {
                    const on = fired.has(`${h.house}.${r.stanza}`);
                    return (
                      <li
                        key={r.stanza}
                        className={cn(
                          "flex gap-1.5 text-muted-foreground",
                          on && "text-foreground",
                        )}
                      >
                        <span className="mt-1 w-3 shrink-0">
                          {on && (
                            <Check
                              className="h-3 w-3 text-verdict-good"
                              aria-label="Holds for this chart"
                            />
                          )}
                        </span>
                        <span>
                          <span className="font-medium text-foreground">{r.topic}:</span>{" "}
                          <Soft>{`${r.when} — ${r.then}`}</Soft>
                          <span className="ml-1 text-muted-foreground/70">
                            ({h.chapter}.{r.stanza})
                          </span>
                          <FidelityDot tier={ruleFidelity(h.house, r.stanza)} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Fold>
            );
          })}

          <Fold
            testId="sarvartha-ref-rajyogas"
            title={plain ? "Royal combinations · chapter 9" : "Rajyogas · chapter 9"}
            count={SC_RAJYOGAS.length}
          >
            <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
              {SC_RAJYOGAS.map((r, i) => (
                <li key={i}>
                  <span className="text-muted-foreground/70">(9.{r.stanza})</span>{" "}
                  {r.when} — {r.then}.
                </li>
              ))}
            </ul>
          </Fold>

          <Fold
            testId="sarvartha-ref-dasha"
            title={plain ? "What the ruling periods give · chapters 13-16" : "Dasha phala · chapters 13-16"}
            count={dasha.length}
          >
            <p className="mb-2 text-xs text-muted-foreground">
              What the main period of each house&apos;s lord gives with a
              sub-period, as the author summarises them.
            </p>
            <ul className="space-y-1.5 text-xs leading-5 text-muted-foreground">
              {dasha.map((r, i) => (
                <li key={i}>
                  {r.house > 0 && (
                    <span className="font-medium text-foreground">
                      {ORDINAL[r.house - 1]} house —{" "}
                    </span>
                  )}
                  <Soft>{`${r.when} — ${r.then}`}</Soft>.
                </li>
              ))}
            </ul>
          </Fold>

          {showLongevity && (
            <Fold
              testId="sarvartha-ref-longevity"
              title="Longevity · chapters 10-11"
              count={SC_LONGEVITY.length}
            >
              <ScGentleNote testId="sarvartha-longevity-note" />
              <p className="mt-2 text-xs text-muted-foreground">
                The span of life and what cancels a short-life yoga.
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                {SC_LONGEVITY.map((r, i) => (
                  <li key={i}>
                    <span className="text-muted-foreground/70">
                      ({r.chapter}.{r.stanza})
                    </span>{" "}
                    {r.when} — {r.then}.
                  </li>
                ))}
              </ul>
            </Fold>
          )}
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 text-2xs leading-4 text-muted-foreground">
        <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span>{FIDELITY_NOTE}</span>
      </p>
    </section>
  );
}
