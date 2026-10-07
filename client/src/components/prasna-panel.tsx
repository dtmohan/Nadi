import { useMemo, useState } from "react";
import type { ChartResult } from "@shared/schema";
import { NAKSHATRAS, SIGNS } from "@shared/astro";
import {
  computeGulikaReading,
  computePrasna,
  computePrasnaDispositions,
  computePrasnaFructification,
  computePrasnaTransits,
  computeProgeny,
  computeSantanaTrisphuta,
  computeSphutas,
  rasiAgreement,
  PRASNA_SPHUTA_NOTE,
  PRASNA_TRANSIT_NOTES,
  PRASNA_BHAVA_SIGNIFICATIONS,
  PRASNA_CAVEATS,
  PRASNA_KARAKAS,
  PRASNA_KARAKA_RULE,
  PRASNA_NODE_NOTE,
  type PrasnaBhavaVerdict,
  type PrasnaHouseReading,
  type PrasnaSphutaVerdict,
  type PrasnaSphutas,
  type RasiVerdict,
} from "@shared/rules-prasna";
import { PlanetName } from "@/components/planet-name";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { Soft } from "@/lib/gentle";
import { Button } from "@/components/ui/button";
import {
  prasnaStore,
  useSavedPrasnas,
  type PrasnaOutcome,
} from "@/lib/prasna-store";
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

const OUTCOME_CLASS: Record<PrasnaOutcome, string> = {
  pending: "border border-muted-foreground/40 text-muted-foreground",
  yes: "border border-verdict-good/40 text-verdict-good",
  no: "border border-verdict-bad/40 text-verdict-bad",
  partial: "border border-verdict-mixed/40 text-verdict-mixed",
};

const SPHUTA_CLASS: Record<PrasnaSphutaVerdict, string> = {
  strong: "border border-verdict-good/40 text-verdict-good",
  remedy: "border border-verdict-mixed/40 text-verdict-mixed",
  weak: "border border-verdict-bad/40 text-verdict-bad",
};

const RASI_CLASS: Record<RasiVerdict, string> = {
  good: "border border-verdict-good/40 text-verdict-good",
  moderate: "border border-verdict-mixed/40 text-verdict-mixed",
  bad: "border border-verdict-bad/40 text-verdict-bad",
};

/** The eight directions and the signs each holds (Prasna Marga 2.7–9). */
const DIRECTION_NOTE =
  "Arudha by direction (2.7–9): east Aries/Taurus · south-east Gemini · south Cancer/Leo · south-west Virgo · west Libra/Scorpio · north-west Sagittarius · north Capricorn/Aquarius · north-east Pisces. In uncertain cases the querist touches a point on a direction circle and that sign is the Arudha (2.11).";

function buildPrasnaSummary(readings: PrasnaHouseReading[]): string {
  return readings
    .map((r) => {
      const occ = r.occupants.map((p) => p.planet).join(", ");
      const bits = [`${ord(r.house)}: ${occ}`];
      if (r.maleficText) bits.push(`malefic — ${r.maleficText}`);
      if (r.beneficText) bits.push(`benefic — ${r.beneficText}`);
      return bits.join(" | ");
    })
    .join("\n");
}

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
  const [question, setQuestion] = useState("");
  const savedPrasnas = useSavedPrasnas();

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
  const progeny = useMemo(
    () => computeProgeny(positions, result.chart.gender as "male" | "female" | "unspecified"),
    [positions, result.chart.gender],
  );
  const trisphuta = useMemo(
    () => computeSantanaTrisphuta(positions, birthLagnaIdx),
    [positions, birthLagnaIdx],
  );
  const natalMoon = positions.find((p) => p.planet === "Moon")!;
  const transits = useMemo(
    () => computePrasnaTransits(natalMoon.signIndex, now.positions),
    [natalMoon.signIndex, now.positions],
  );
  const gulika = useMemo(
    () =>
      result.gulika
        ? computeGulikaReading(result.gulika, birthLagnaIdx)
        : null,
    [result.gulika, birthLagnaIdx],
  );
  const sphutas = useMemo(() => {
    if (!result.gulika) return null;
    const lon = (p: string) => positions.find((x) => x.planet === p)!.lon;
    return computeSphutas(
      result.jaimini.lagna.lon,
      lon("Moon"),
      lon("Sun"),
      lon("Rahu"),
      result.gulika.lon,
    );
  }, [result.gulika, result.jaimini.lagna.lon, positions]);
  const [partnerMoon, setPartnerMoon] = useState<number | null>(null);
  const femaleChart = result.chart.gender === "female";
  const agreement = useMemo(() => {
    if (partnerMoon === null) return null;
    const maleSign = femaleChart ? partnerMoon : natalMoon.signIndex;
    const femaleSign = femaleChart ? natalMoon.signIndex : partnerMoon;
    return rasiAgreement(maleSign, femaleSign);
  }, [partnerMoon, femaleChart, natalMoon.signIndex]);
  const prasna = useMemo(
    () => (arudhaIdx === null ? null : computePrasna(now.positions, arudhaIdx)),
    [now.positions, arudhaIdx],
  );

  const register = () => {
    if (arudhaIdx === null || !prasna) return;
    void prasnaStore.register({
      question: question.trim() || "(no question noted)",
      askedAt: now.asOf,
      arudhaIdx,
      arudhaSign: SIGNS[arudhaIdx],
      summary: buildPrasnaSummary(prasna),
    });
    setQuestion("");
  };
  const confirm = (id: string, outcome: PrasnaOutcome) =>
    void prasnaStore.setOutcome(id, outcome);

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
          Read the current sky from an Arudha lagna.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setArudhaIdx(Math.floor(Math.random() * 12))}
            data-testid="prasna-generate-arudha"
          >
            Random Arudha
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
            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
              <SouthIndianChart
                positions={now.positions}
                lagnaSign={arudhaIdx}
                title="Prasna"
                subtitle={`Arudha · ${SIGNS[arudhaIdx]}`}
              />
              <HouseEffectsList readings={prasna} />
            </div>
          </div>
        )}
        {arudhaIdx === null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Generate a random Arudha, or pick a sign, to read the query chart.
          </p>
        )}
        <p className="mt-3 text-2xs text-muted-foreground" data-testid="prasna-arudha-caveat">
          The “Random Arudha” is a demonstration: the classical determination —
          by the querist's direction, breath or touch (2.7–11) — is not yet
          implemented. Use “Pick a sign” to set the direction-based Arudha, or
          treat a random cast as practice, not a live reading.
        </p>
        {prasna && arudhaIdx !== null && (
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">
                What is the query about? (kept on this device)
              </span>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="mt-1 block h-8 w-full rounded-md border bg-background px-2 text-sm"
                placeholder="e.g. Will the pending matter resolve soon?"
                data-testid="prasna-question"
              />
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={register}
              data-testid="prasna-register"
            >
              Register this prasna
            </Button>
          </div>
        )}
        <p className="mt-3 text-2xs text-muted-foreground">{DIRECTION_NOTE}</p>
      </div>

      {/* Registered prasnas: confirmed later against what actually happened */}
      {savedPrasnas.data && savedPrasnas.data.length > 0 && (
        <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="text-base font-semibold">Registered prasnas</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Kept on this device. Mark the outcome when it is known, and the
            rules can be checked against what actually happened.
          </p>
          <ul className="mt-3 space-y-2">
            {savedPrasnas.data.map((p) => (
              <li
                key={p.id}
                className="rounded-md border bg-background p-3"
                data-testid={`prasna-saved-${p.id}`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">
                    {p.question || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.arudhaSign} ·{" "}
                    {new Date(p.askedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                      OUTCOME_CLASS[p.outcome],
                    )}
                  >
                    {p.outcome}
                  </span>
                </div>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Reading
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">
                    {p.summary}
                  </pre>
                </details>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {(["yes", "no", "partial"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => confirm(p.id, o)}
                      className={cn(
                        "rounded border px-2 py-0.5 text-xs",
                        p.outcome === o
                          ? "border-foreground bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      data-testid={`prasna-confirm-${o}-${p.id}`}
                    >
                      {o}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void prasnaStore.remove(p.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-verdict-bad"
                  >
                    delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transits now, from the natal Moon */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="text-base font-semibold">Transits now</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The seven planets' effects in transit, read from the natal Moon
          (Prasna Marga 22.1–24).
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {transits.map((t) => (
            <li
              key={t.planet}
              className={cn(
                "rounded-md border border-l-[3px] p-2.5 text-xs leading-relaxed",
                t.tone === "good"
                  ? "border-l-verdict-good/70"
                  : t.tone === "hard"
                    ? "border-l-verdict-bad/70"
                    : "border-l-border",
              )}
              data-testid={`prasna-transit-${t.planet}`}
              data-tone={t.tone}
            >
              <div className="flex items-baseline gap-2">
                <PlanetName planet={t.planet} />
                <span className="text-muted-foreground">
                  {ord(t.house)} from the Moon
                </span>
              </div>
              <p className="mt-0.5">
                <Soft>{t.text}</Soft>
              </p>
            </li>
          ))}
        </ul>
        <ul className="mt-2 space-y-0.5 text-2xs text-muted-foreground">
          {PRASNA_TRANSIT_NOTES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
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

        <div className="mt-6" aria-label="Progeny">
          <h4 className="text-sm font-semibold">Progeny</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {progeny.kind === "beeja" ? "Beeja" : "Kshetra"} Sphuta, the sum of
            the three relevant longitudes (Prasna Marga 19.6–11).
          </p>
          <div
            className="mt-2 rounded-md border bg-card p-3"
            data-testid="prasna-progeny"
            data-verdict={progeny.verdict}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium">
                {progeny.kind === "beeja" ? "Beeja Sphuta" : "Kshetra Sphuta"}
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  SPHUTA_CLASS[progeny.verdict],
                )}
              >
                {progeny.verdict}
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {progeny.source}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular">
              {SIGNS[progeny.signIndex]} · navamsa {progeny.navamsaIndex + 1} ·{" "}
              {progeny.longitude.toFixed(2)}° · {progeny.parityOk ? "right" : "wrong"}{" "}
              sign/navamsa · {progeny.beneficSupport ? "benefic-supported" : "no benefic support"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">
              {progeny.note}
            </p>
          </div>

          <div
            className="mt-2 rounded-md border bg-card p-3"
            data-testid="prasna-trisphuta"
            data-afflicted={trisphuta.afflicted}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium">Santana Trisphuta</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  trisphuta.afflicted
                    ? "border border-verdict-bad/40 text-verdict-bad"
                    : "border border-verdict-good/40 text-verdict-good",
                )}
              >
                {trisphuta.afflicted ? "afflicted" : "clear"}
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {trisphuta.source}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">
              {trisphuta.note}
            </p>
          </div>

          {gulika && (
            <div
              className="mt-2 rounded-md border bg-card p-3"
              data-testid="prasna-gulika"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-medium">Gulika</span>
                <span className="text-xs text-muted-foreground">
                  {SIGNS[gulika.signIndex]} · {ord(gulika.house)} house
                </span>
                <span className="ml-auto text-2xs text-muted-foreground">
                  {gulika.source}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                <Soft>{gulika.text}</Soft>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Marriage compatibility: Rasi agreement */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="text-base font-semibold">Marriage compatibility</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Rasi agreement (Prasna Marga 21.1–16): the groom's Moon counted from
          the bride's.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {femaleChart ? "Partner's" : "This chart's"} Moon is{" "}
            {SIGNS[natalMoon.signIndex]}. Partner's Moon:
          </span>
          <select
            value={partnerMoon ?? ""}
            onChange={(e) =>
              setPartnerMoon(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-8 rounded-md border bg-background px-2 text-sm"
            data-testid="prasna-partner-moon"
            aria-label="Partner's Moon sign"
          >
            <option value="">Pick a sign</option>
            {SIGNS.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {agreement && (
          <div
            className="mt-3 rounded-md border bg-card p-3"
            data-testid="prasna-rasi-agreement"
            data-verdict={agreement.verdict}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium">
                {ord(agreement.house)} from the bride's Moon
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  RASI_CLASS[agreement.verdict],
                )}
              >
                {agreement.verdict}
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {agreement.source}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">
              {agreement.note}
            </p>
          </div>
        )}
      </div>

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

      {sphutas && (
        <details className="mt-3" data-testid="prasna-sphutas">
          <summary className="cursor-pointer text-sm font-semibold">
            The sphutas
          </summary>
          <p className="mt-1 text-xs text-muted-foreground">
            Derived points read by sign and nakshatra (Prasna Marga 5.17–23).
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {(
              [
                ["Thrisphuta", sphutas.thrisphuta, ""],
                ["Chatusphuta", sphutas.chatusphuta, ""],
                ["Panchasphuta", sphutas.panchasphuta, ""],
                ["Pranasphuta", sphutas.pranasphuta, ""],
                ["Dehasphuta", sphutas.dehasphuta, ""],
                ["Mrityusphuta", sphutas.mrityusphuta, ""],
                ...(result.timeSphutas
                  ? ([
                      ["Pranasphuta (by ghatis)", result.timeSphutas.pranasphutaAlt, "alt"],
                      ["Mrityusphuta (by weekday)", result.timeSphutas.mrityusphutaAlt, "alt"],
                      ["Kalasphuta", result.timeSphutas.kalasphuta, "alt"],
                    ] as const)
                  : []),
              ] as ReadonlyArray<readonly [string, number, string]>
            ).map(([name, lon]) => {
              const sign = Math.floor(lon / 30);
              const nak = NAKSHATRAS[Math.floor(lon / (360 / 27))];
              const deg = lon - sign * 30;
              return (
                <li
                  key={name}
                  className="text-xs leading-relaxed"
                  data-testid={`prasna-sphuta-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <span className="font-medium">{name}</span>{" "}
                  <span className="tabular">{deg.toFixed(1)}°</span> {SIGNS[sign]}{" "}
                  <span className="text-muted-foreground">· {nak}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-2xs text-muted-foreground">
            {PRASNA_SPHUTA_NOTE}
          </p>
        </details>
      )}

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
