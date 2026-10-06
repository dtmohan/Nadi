import { useMemo, useState } from "react";
import type { ChartResult } from "@shared/schema";
import { SIGNS } from "@shared/astro";
import {
  computePrasna,
  computePrasnaDispositions,
  computePrasnaFructification,
  PRASNA_BHAVA_SIGNIFICATIONS,
  PRASNA_CAVEATS,
  PRASNA_KARAKAS,
  PRASNA_KARAKA_RULE,
  PRASNA_NODE_NOTE,
  type PrasnaBhavaVerdict,
  type PrasnaHouseReading,
} from "@shared/rules-prasna";
import { PlanetName } from "@/components/planet-name";
import { Soft } from "@/lib/gentle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ord = (h: number) =>
  h === 1 ? "1st" : h === 2 ? "2nd" : h === 3 ? "3rd" : `${h}th`;

const FRUCT_LABEL: Record<PrasnaBhavaVerdict, string> = {
  full: "Ripens",
  "seen-not-enjoyed": "Seen, not enjoyed",
  little: "A little",
  mixed: "Mixed",
  negative: "Negative",
};

const FRUCT_CLASS: Record<PrasnaBhavaVerdict, string> = {
  full: "border border-verdict-good/40 text-verdict-good",
  "seen-not-enjoyed": "border border-verdict-mixed/40 text-verdict-mixed",
  little: "border border-verdict-mixed/40 text-verdict-mixed",
  mixed: "border border-verdict-mixed/40 text-verdict-mixed",
  negative: "border border-verdict-bad/40 text-verdict-bad",
};

/** The eight directions and the signs each holds (Prasna Marga 2.7–9). */
const DIRECTION_NOTE =
  "Arudha by direction (2.7–9): east Aries/Taurus · south-east Gemini · south Cancer/Leo · south-west Virgo · west Libra/Scorpio · north-west Sagittarius · north Capricorn/Aquarius · north-east Pisces. In uncertain cases the querist touches a point on a direction circle and that sign is the Arudha (2.11).";

function HouseEffectsList({ readings }: { readings: PrasnaHouseReading[] }) {
  return (
    <ul className="space-y-3">
      {readings.map((r) => (
        <li
          key={r.house}
          className="rounded-md border bg-card p-3"
          data-testid={`prasna-house-${r.house}`}
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">
              {ord(r.house)} house
            </span>
            <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {r.occupants.map((p) => (
                <PlanetName key={p.planet} planet={p.planet} />
              ))}
            </span>
            <span className="ml-auto text-2xs text-muted-foreground">
              {r.source}
            </span>
          </div>
          {r.maleficText && (
            <p className="mt-1.5 border-l-2 border-verdict-bad/60 pl-2 text-xs leading-relaxed text-foreground/90">
              <span className="font-medium text-verdict-bad">
                {r.malefics.map((p) => p.planet).join(", ")} ·{" "}
              </span>
              <Soft>{r.maleficText}</Soft>
            </p>
          )}
          {r.beneficText && (
            <p className="mt-1.5 border-l-2 border-verdict-good/60 pl-2 text-xs leading-relaxed text-foreground/90">
              <span className="font-medium text-verdict-good">
                {r.benefics.map((p) => p.planet).join(", ")} ·{" "}
              </span>
              <Soft>{r.beneficText}</Soft>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Prasna Marga. The prasna (query) mode is primary: an Arudha lagna is derived at query time and
 * the current planets are read from it. The birth-chart reading follows, since the text's house
 * effects are also read against a natal lagna.
 */
export function PrasnaPanel({ result }: { result: ChartResult }) {
  const { positions, reading, now } = result;
  const birthLagnaIdx = result.jaimini.lagna.signIndex;
  const [arudhaIdx, setArudhaIdx] = useState<number | null>(null);

  const natal = useMemo(
    () => computePrasna(positions, birthLagnaIdx),
    [positions, birthLagnaIdx],
  );
  const dispositions = useMemo(
    () => computePrasnaDispositions(reading.strength),
    [reading.strength],
  );
  const fructification = useMemo(
    () => computePrasnaFructification(positions, reading.strength, birthLagnaIdx),
    [positions, reading.strength, birthLagnaIdx],
  );
  const prasna = useMemo(
    () => (arudhaIdx === null ? null : computePrasna(now.positions, arudhaIdx)),
    [now.positions, arudhaIdx],
  );

  return (
    <section data-testid="prasna-panel" aria-label="Prasna Marga">
      <h2 className="text-xl font-semibold">Prasna Marga</h2>
      <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">
        The Kerala horary classic. A query is read from an Arudha lagna derived
        at the time of asking, with the planets as they stand now; the same
        house rules are also read against the birth chart below.
      </p>

      {/* Prasna (query) */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="text-base font-semibold">Cast a prasna</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Derive an Arudha lagna and read the current sky from it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setArudhaIdx(Math.floor(Math.random() * 12))}
            data-testid="prasna-generate-arudha"
          >
            Generate Arudha
          </Button>
          <select
            value={arudhaIdx ?? ""}
            onChange={(e) =>
              setArudhaIdx(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-8 rounded-md border bg-background px-2 text-sm"
            data-testid="prasna-select-arudha"
            aria-label="Pick the Arudha sign"
          >
            <option value="">Pick a sign</option>
            {SIGNS.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {prasna && arudhaIdx !== null && (
          <div className="mt-3" data-testid="prasna-result">
            <p className="text-sm">
              Arudha lagna:{" "}
              <span className="font-semibold">{SIGNS[arudhaIdx]}</span>{" "}
              <span className="text-muted-foreground">· the sky now</span>
            </p>
            <div className="mt-2">
              <HouseEffectsList readings={prasna} />
            </div>
          </div>
        )}
        {arudhaIdx === null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Generate an Arudha, or pick a sign, to read the query chart.
          </p>
        )}
        <p className="mt-3 text-2xs text-muted-foreground">{DIRECTION_NOTE}</p>
      </div>

      {/* Birth chart */}
      <section className="mt-6" aria-label="Birth chart">
        <h3 className="text-sm font-semibold">Birth chart</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Effects of planets in houses (Prasna Marga 14.50–65), read whole-sign
          from the {SIGNS[birthLagnaIdx]} ascendant.
        </p>
        <div className="mt-3">
          <HouseEffectsList readings={natal} />
        </div>

        {dispositions.length > 0 && (
          <div className="mt-6" aria-label="Favourable and unfavourable planets">
            <h4 className="text-sm font-semibold">How each planet stands</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Favourable and unfavourable positions of planets (Prasna Marga
              14.90–100), read from the app's strength pass.
            </p>
            <ul className="mt-3 space-y-3">
              {dispositions.map((d) => (
                <li
                  key={d.planet}
                  className="rounded-md border bg-card p-3"
                  data-testid={`prasna-disposition-${d.planet}`}
                  data-disposition={d.disposition}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      <PlanetName planet={d.planet} />
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                        d.disposition === "favourable"
                          ? "border border-verdict-good/40 text-verdict-good"
                          : "border border-verdict-bad/40 text-verdict-bad",
                      )}
                    >
                      {d.disposition}
                    </span>
                    <span className="ml-auto text-2xs text-muted-foreground">
                      {d.source}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
                    <Soft>{d.text}</Soft>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6" aria-label="Fructification of bhavas">
          <h4 className="text-sm font-semibold">
            Does each house's promise ripen?
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Fructification of bhavas (Prasna Marga 14.39–41), from each
            house's lord and karaka — their strength and their place.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fructification.map((f) => (
              <li
                key={f.house}
                className="rounded-md border bg-card p-3"
                data-testid={`prasna-fruct-${f.house}`}
                data-verdict={f.verdict}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold">
                    {ord(f.house)} house
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                      FRUCT_CLASS[f.verdict],
                    )}
                  >
                    {FRUCT_LABEL[f.verdict]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  lord <PlanetName planet={f.lord} /> · karaka{" "}
                  <PlanetName planet={f.karaka} />
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  {f.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reference: house significations and karakas */}
      <details className="mt-6" data-testid="prasna-bhava-significations">
        <summary className="cursor-pointer text-sm font-semibold">
          What each house signifies
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          Significations of the twelve bhavas (Prasna Marga 14.3–14).
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {PRASNA_BHAVA_SIGNIFICATIONS.map((b) => (
            <li key={b.house} className="text-xs leading-relaxed">
              <span className="font-medium">{ord(b.house)} house</span>{" "}
              <span className="text-muted-foreground">· 14.{b.stanza}</span> —{" "}
              {b.text}
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3" data-testid="prasna-karakas">
        <summary className="cursor-pointer text-sm font-semibold">
          Karakas or significators
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          The planets' significations (Prasna Marga 14.31).
        </p>
        <ul className="mt-2 space-y-1.5">
          {PRASNA_KARAKAS.map((k) => (
            <li key={k.planet} className="text-xs leading-relaxed">
              <PlanetName planet={k.planet} /> — {k.text}{" "}
              <span className="text-muted-foreground">· 14.{k.stanza}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {PRASNA_KARAKA_RULE}
        </p>
      </details>

      <ul className="mt-4 space-y-1 text-2xs text-muted-foreground">
        {PRASNA_CAVEATS.map((c, i) => (
          <li key={i} data-testid={`prasna-caveat-${i}`}>
            {c}
          </li>
        ))}
        <li>{PRASNA_NODE_NOTE}</li>
      </ul>
    </section>
  );
}
