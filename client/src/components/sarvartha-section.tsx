import { SC_BHAVAS, SC_BHAVA_RULES, SC_METHOD_NOTE } from "@shared/sarvartha";
import { PLANET_ABBR } from "@shared/astro";
import { SectionTitle, ModeText } from "@/components/mode-text";

const ORDINAL = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th",
];

/**
 * Sarvartha Chintamani (Venkatesha): a Parashari-lineage bhava-phala text shown as a second voice
 * on the houses. Significations and the house/lord/karaka method first, then the harvested rules.
 */
export function SarvarthaSection() {
  return (
    <section className="mt-8" data-testid="sarvartha-section">
      <SectionTitle
        plain="Sarvartha Chintamani"
        technical="Sarvartha Chintamani (Venkatesha)"
      />
      <ModeText
        plain={
          <>
            A second classical voice on the twelve houses, from Venkatesha&apos;s
            Sarvartha Chintamani. It names what each house covers, then reads
            each thing from the house, its lord and its significator — with the
            named strength grades (Parijata up to Vaisheshika). The first two
            houses&apos; specific promises are listed below; the rest are being
            added.
          </>
        }
        practitioner={
          <>
            Sarvartha Chintamani (Venkatesha, Bhasin translation, Sagar
            Publications), a Parashari-lineage bhava-phala text. {SC_METHOD_NOTE}{" "}
            Rules are cited by chapter and shloka; the Amsha tiers of 1.25-27
            are the same varga classification as Parashara 6.42-53. Harvest in
            progress: the 1st and 2nd houses are complete.
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
            {h.rules.map((r) => (
              <li key={r.stanza} className="text-muted-foreground">
                <span className="font-medium text-foreground">{r.topic}:</span>{" "}
                {r.when} — {r.then}
                <span className="ml-1 text-muted-foreground/70">
                  ({h.chapter}.{r.stanza})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
