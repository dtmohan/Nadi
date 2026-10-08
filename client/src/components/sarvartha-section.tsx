import { SC_BHAVAS, SC_BHAVA_RULES, SC_RAJYOGAS, SC_DASHA_PHALA, SC_LONGEVITY, SC_METHOD_NOTE, SC_SOURCE, FIDELITY_LABEL, FIDELITY_NOTE, ruleFidelity, type FidelityTier, type SarvarthaResult } from "@shared/sarvartha";
import { PLANET_ABBR } from "@shared/astro";
import { SectionTitle, ModeText } from "@/components/mode-text";
import { cn } from "@/lib/utils";

const ORDINAL = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th",
];

/**
 * Sarvartha Chintamani (Venkatesha): a Parashari-lineage elaboration of the house results, shown
 * under Parashari with its own citations. Significations and the house/lord/karaka method first,
 * then the harvested rules, with the ones that fire for this chart marked.
 */
export function SarvarthaSection({ sarvartha }: { sarvartha?: SarvarthaResult }) {
  const fired = new Set(sarvartha?.findings.map((f) => `${f.house}.${f.stanza}`));
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
            Sarvartha Chintamani. It names what each house covers, then reads
            each thing from the house, its lord and its significator. The rules
            that apply to this chart are marked; the rest are the author&apos;s
            full reference.
          </>
        }
        practitioner={
          <>
            {SC_SOURCE.label}, a Parashari-lineage elaboration of the bhava
            phala. {SC_METHOD_NOTE} Rules are cited by chapter and shloka; the
            Amsha tiers of 1.25-27 are the same varga classification as Parashara
            6.42-53.{" "}
            {sarvartha
              ? `${sarvartha.findings.length} of ${sarvartha.computable} computable rules apply to this chart.`
              : ""}
          </>
        }
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SC_BHAVAS.map((b) => (
          <div key={b.house} className="rounded border p-3">
            <div className="text-sm font-medium">
              {ORDINAL[b.house - 1]} house
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                karaka {PLANET_ABBR[b.karaka]}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {b.significations.join(", ")}.
            </p>
            {b.karakaNote && (
              <p className="mt-1 text-xs italic text-muted-foreground/80">
                {b.karakaNote}.
              </p>
            )}
          </div>
        ))}
      </div>

      {SC_BHAVA_RULES.map((h) => (
        <div key={h.house} className="mt-6">
          <h4 className="text-sm font-semibold">
            {ORDINAL[h.house - 1]} house — chapter {h.chapter}
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-5">
            {h.rules.map((r) => {
              const key = `${h.house}.${r.stanza}`;
              const on = fired.has(key);
              const fidelity: FidelityTier = ruleFidelity(h.house, r.stanza);
              return (
                <li
                  key={r.stanza}
                  className={cn(
                    "text-muted-foreground",
                    on && "font-medium text-foreground",
                  )}
                >
                  {on && <span className="mr-1 text-verdict-good">✓</span>}
                  <span className="font-medium text-foreground">{r.topic}:</span>{" "}
                  {r.when} — {r.then}
                  <span className="ml-1 text-muted-foreground/70">
                    ({h.chapter}.{r.stanza})
                  </span>
                  {fidelity !== "cited" && (
                    <span
                      className={cn(
                        "ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle",
                        fidelity === "provisional"
                          ? "bg-amber-400"
                          : "bg-emerald-500",
                      )}
                      title={FIDELITY_LABEL[fidelity]}
                      aria-label={FIDELITY_LABEL[fidelity]}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Rajyogas — chapter 9</h4>
        {sarvartha && sarvartha.rajyogas.length > 0 && (
          <p className="mt-2 text-xs leading-5">
            <span className="font-medium">Applies to this chart:</span>{" "}
            {sarvartha.rajyogas.map((r) => r.text).join("; ")}.
          </p>
        )}
        <ul className="mt-2 space-y-1.5 text-xs leading-5">
          {SC_RAJYOGAS.map((r) => (
            <li key={r.stanza} className="text-muted-foreground">
              <span className="text-muted-foreground/70">(9.{r.stanza})</span>{" "}
              {r.when} — {r.then}.
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">
          Ruling periods — chapters 13–16
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          What the main period of each house&apos;s lord gives with a
          sub-period, as the author summarises them.
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-5">
          {SC_DASHA_PHALA.map((r, i) => (
            <li key={i} className="text-muted-foreground">
              {r.house > 0 && (
                <span className="font-medium text-foreground">
                  {ORDINAL[r.house - 1]} house —{" "}
                </span>
              )}
              {r.when} — {r.then}.
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">
          Longevity — chapters 10–11
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          The span of life and what cancels a short-life yoga.
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-5">
          {SC_LONGEVITY.map((r, i) => (
            <li key={i} className="text-muted-foreground">
              <span className="text-muted-foreground/70">
                ({r.chapter}.{r.stanza})
              </span>{" "}
              {r.when} — {r.then}.
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 flex items-start gap-2 text-2xs leading-4 text-muted-foreground">
        <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span>{FIDELITY_NOTE}</span>
      </p>
    </section>
  );
}
