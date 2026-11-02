import { useMemo, useState } from "react";
import type { ChartResult } from "@shared/schema";
import type { ChartEvent } from "@shared/events";
import { TopicReadingPanel } from "@/components/topic-reading";
import { NAKSHATRAS, SIGN_LORD, SIGNS } from "@shared/astro";
import { GULIKA_METHODS, normaliseGulikaMethod } from "@shared/gulika-methods";
import { gulikaNatalClues } from "@shared/gulika-clues";
import { createPlanetContext, natalPlanetContext } from "@shared/planet-context";
import {
  arudhaFromHandful,
  ashtamangalaFromGroups,
  simulateCowrieGroups,
  PRASNA_COWRIES,
  computeArudhaReading,
  computeGulikaReading,
  computePrasna,
  computePrasnaDispositions,
  computePrasnaFructification,
  computePrasnaTransits,
  computePrasnaVedha,
  computeProgeny,
  computeSantanaTrisphuta,
  computeSphutas,
  computeTertiaryReading,
  computeFructificationTiming,
  PRASNA_TIME_PERIODS,
  rasiAgreement,
  PRASNA_SPHUTA_NOTE,
  PRASNA_TRANSIT_NOTES,
  PRASNA_BHAVA_SIGNIFICATIONS,
  PRASNA_CAVEATS,
  PRASNA_KARAKAS,
  PRASNA_KARAKA_RULE,
  PRASNA_NODE_NOTE,
  type ArudhaVerdict,
  type PrasnaBhavaFructification,
  type PrasnaBhavaVerdict,
  type PrasnaDispositionReading,
  type PrasnaHouseReading,
  type PrasnaSphutaVerdict,
  type PrasnaSphutas,
  type RasiVerdict,
} from "@shared/rules-prasna";
import { PlanetName } from "@/components/planet-name";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { Soft } from "@/lib/gentle";
import { redactProse, sensitiveGate } from "@shared/life-stage";
import { computeKootas } from "@shared/prasna-kootas";
import { PRASNA_DISEASE_REMEDIES, PRASNA_DISEASE_NOTES, diseaseCauses } from "@shared/prasna-diseases";
import {
  PRASNA_DEITY_MAPPING,
  PRASNA_DEITY_REMEDIES,
  PRASNA_DEITY_NOTE,
} from "@shared/prasna-deities";
import { ModeText, SectionTitle, usePlain } from "@/components/mode-text";
import { houseGloss } from "@shared/house-gloss";
import { Button } from "@/components/ui/button";
import {
  prasnaStore,
  useSavedPrasnas,
  type PrasnaOutcome,
} from "@/lib/prasna-store";
import { cn } from "@/lib/utils";
import { Chapter, Chapters, type ChapterDef } from "@/components/chapters";
import { SchoolTopicPanel } from "@/components/school-topic-brief";

const ord = (h: number) =>
  h === 1 ? "1st" : h === 2 ? "2nd" : h === 3 ? "3rd" : `${h}th`;

const FRUCT_LABEL: Record<PrasnaBhavaVerdict, string> = {
  full: "Ripens",
  "seen-not-enjoyed": "Seen, not enjoyed",
  little: "A little",
  mixed: "Mixed",
  negative: "Negative",
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

const ARUDHA_CLASS: Record<ArudhaVerdict, string> = {
  fortunate: "border border-verdict-good/40 text-verdict-good",
  mixed: "border border-verdict-mixed/40 text-verdict-mixed",
  danger: "border border-verdict-bad/40 text-verdict-bad",
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

function HouseEffectsList({ readings, withheld }: { readings: PrasnaHouseReading[]; withheld: boolean }) {
  const plain = usePlain();
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
              {plain ? "The app has a challenging house-effects line; the source may require additional conditions." : <Soft>{withheld ? redactProse(r.maleficText) : r.maleficText}</Soft>}
            </p>
          )}
          {r.beneficText && (
            <p className="mt-1.5 border-l-2 border-verdict-good/60 pl-2 text-xs leading-relaxed text-foreground/90">
              <span className="font-medium text-verdict-good">
                {r.benefics.map((p) => p.planet).join(", ")} ·{" "}
              </span>
              {plain ? "The source associates these occupants with supportive themes for this house as a whole." : <Soft>{withheld ? redactProse(r.beneficText) : r.beneficText}</Soft>}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The twelve-house walk: signification, occupants, fructification and the lord's standing, together. */
function HouseWalk({
  natal,
  fructification,
  dispositions,
  lagnaIdx,
  withheld,
}: {
  natal: PrasnaHouseReading[];
  fructification: PrasnaBhavaFructification[];
  dispositions: PrasnaDispositionReading[];
  lagnaIdx: number;
  /** A native under the sensitive age: the significations lose their withheld items. */
  withheld: boolean;
}) {
  const plain = usePlain();
  const byHouse = new Map(natal.map((r) => [r.house, r]));
  const fruct = new Map(fructification.map((f) => [f.house, f]));
  const disp = new Map(dispositions.map((d) => [d.planet, d]));
  return (
    <ul className="space-y-3">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
        const sign = (lagnaIdx + house - 1) % 12;
        const lord = SIGN_LORD[sign];
        const sig = PRASNA_BHAVA_SIGNIFICATIONS[house - 1];
        const r = byHouse.get(house);
        const f = fruct.get(house);
        const d = disp.get(lord);
        return (
          <li
            key={house}
            className="rounded-md border bg-card p-3"
            data-testid={`prasna-house-walk-${house}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-semibold">{ord(house)} house</span>
              <span className="text-xs text-muted-foreground">
                {SIGNS[sign]} · lord <PlanetName planet={lord} />
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                Prasna Marga 14.{sig.stanza}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <Soft>{plain ? houseGloss("prasna", house) : withheld ? redactProse(sig.text) : sig.text}</Soft>
            </p>
            {r ? (
              <>
                {r.maleficText && (
                  <p className="mt-1.5 border-l-2 border-verdict-bad/60 pl-2 text-xs leading-relaxed text-foreground/90">
                    <span className="font-medium text-verdict-bad">
                      {r.malefics.map((p) => p.planet).join(", ")} ·{" "}
                    </span>
                    {plain ? "The app has a challenging house-effects line; the source may require additional conditions." : <Soft>{withheld ? redactProse(r.maleficText) : r.maleficText}</Soft>}
                  </p>
                )}
                {r.beneficText && (
                  <p className="mt-1.5 border-l-2 border-verdict-good/60 pl-2 text-xs leading-relaxed text-foreground/90">
                    <span className="font-medium text-verdict-good">
                      {r.benefics.map((p) => p.planet).join(", ")} ·{" "}
                    </span>
                    {plain ? "The source associates these occupants with supportive themes for this whole house." : <Soft>{withheld ? redactProse(r.beneficText) : r.beneficText}</Soft>}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                No planet stands in it.
              </p>
            )}
            {f && (
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
                {!plain && <><span className="font-medium">{FRUCT_LABEL[f.verdict]}.</span>{" "}</>}
                <span data-testid={`prasna-fruct-note-${house}`}>
                  {plain ? "The ruler and significator are assessed for this entire house; this is not a verdict on any one of its matters." : f.note}
                </span>
              </p>
            )}
            {d && (
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                <span className="font-medium">Its lord {d.planet} is {d.disposition}.</span>{" "}
                {!plain && <Soft>{withheld ? redactProse(d.text) : d.text}</Soft>}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Prasna Marga. The prasna (query) mode is primary: an Arudha lagna is derived at query time and
 * the current planets are read from it. The birth-chart reading follows, since the text's house
 * effects are also read against a natal lagna.
 */
export function PrasnaPanel({ result, onTopicSelected }: { result: ChartResult; onTopicSelected?: (event: ChartEvent | null) => void }) {
  const { positions, reading, now } = result;
  const plain = usePlain();
  const birthLagnaIdx = result.jaimini.lagna.signIndex;
  const gulikaMethod = normaliseGulikaMethod(result.chart.gulikaMethod);
  const gulikaMethodInfo = GULIKA_METHODS.find((method) => method.id === gulikaMethod)!;
  const withheld = result.sensitive?.withheld ?? sensitiveGate(result.chart, result.utc, result.now.asOf).withheld;
  const [arudhaIdx, setArudhaIdx] = useState<number | null>(null);
  const [shellCast, setShellCast] = useState<{
    handful: number;
    remainder: number;
    groups: [number, number, number];
  } | null>(null);
  const [observedHeaps, setObservedHeaps] = useState<[string, string, string]>(["", "", ""]);
  const [question, setQuestion] = useState("");

  const observedCounts = observedHeaps.map((value) => /^\d+$/.test(value) ? Number(value) : NaN);
  const validObservedHeaps = observedCounts.every((count) => Number.isSafeInteger(count) && count > 0)
    && observedCounts.reduce((sum, count) => sum + count, 0) === PRASNA_COWRIES;
  const observedRemainders = validObservedHeaps
    ? ashtamangalaFromGroups(observedCounts[0], observedCounts[1], observedCounts[2])
    : null;
  const observedOneToEight = validObservedHeaps
    ? ashtamangalaFromGroups(observedCounts[0], observedCounts[1], observedCounts[2], "one-through-eight")
    : null;

  const castShells = () => {
    const handful = 1 + Math.floor(Math.random() * PRASNA_COWRIES);
    const remainder = handful % 12;
    setArudhaIdx(arudhaFromHandful(handful));
    // A simulation of three positive heaps, not the physical act of placing the gold Arudha.
    const groups = simulateCowrieGroups();
    setShellCast({
      handful,
      remainder,
      groups,
    });
  };
  const savedPrasnas = useSavedPrasnas();

  const natal = useMemo(
    () => computePrasna(natalPlanetContext(result), birthLagnaIdx),
    [result, birthLagnaIdx],
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
    () => computePrasnaTransits(natalMoon.signIndex, now.positions, withheld),
    [natalMoon.signIndex, now.positions, withheld],
  );
  const vedha = useMemo(
    () => computePrasnaVedha(now.positions, natalMoon.signIndex),
    [now.positions, natalMoon.signIndex],
  );
  const gulika = useMemo(
    () =>
      result.gulika
        ? computeGulikaReading(result.gulika, birthLagnaIdx)
        : null,
    [result.gulika, birthLagnaIdx],
  );
  const gulikaClues = useMemo(() => {
    if (!result.gulika) return null;
    // An unspecified gender must not silently select Beeja as a personal association.
    const sphuta = result.chart.gender === "male" || result.chart.gender === "female"
      ? { kind: progeny.kind, signIndex: progeny.signIndex } : undefined;
    return gulikaNatalClues(natalPlanetContext(result), result.gulika, birthLagnaIdx, sphuta);
  }, [result, birthLagnaIdx, progeny]);
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
  const tertiary = useMemo(
    () =>
      computeTertiaryReading(
        positions.find((p) => p.planet === "Sun")!.lon,
        birthLagnaIdx,
        withheld,
      ),
    [positions, birthLagnaIdx, withheld],
  );
  const timing = useMemo(
    () =>
      computeFructificationTiming(
        positions,
        result.jaimini.lagna.lon,
        birthLagnaIdx,
      ),
    [positions, result.jaimini.lagna.lon, birthLagnaIdx],
  );
  const [partnerNak, setPartnerNak] = useState<number | null>(null);
  const femaleChart = result.chart.gender === "female";
  const agreement = useMemo(() => {
    if (partnerNak === null) return null;
    const partnerSign = Math.floor((partnerNak * (360 / 27)) / 30);
    const maleSign = femaleChart ? partnerSign : natalMoon.signIndex;
    const femaleSign = femaleChart ? natalMoon.signIndex : partnerSign;
    return rasiAgreement(maleSign, femaleSign);
  }, [partnerNak, femaleChart, natalMoon.signIndex]);
  const kootas = useMemo(() => {
    if (partnerNak === null) return null;
    const partnerLon = partnerNak * (360 / 27);
    const maleLon = femaleChart ? partnerLon : natalMoon.lon;
    const femaleLon = femaleChart ? natalMoon.lon : partnerLon;
    return computeKootas(maleLon, femaleLon);
  }, [partnerNak, femaleChart, natalMoon.lon]);
  const prasna = useMemo(
    () => (arudhaIdx === null ? null : computePrasna(createPlanetContext(now.positions, {
      kind: "transit", instant: now.asOf, latitude: result.chart.latitude, longitude: result.chart.longitude,
      timezone: result.chart.timezone, ayanamsa: result.chart.ayanamsa, nodeType: result.chart.nodeType,
      ascendant: now.lagnaLon, precision: "full",
    }), arudhaIdx)),
    [result, now, arudhaIdx],
  );
  const arudhaReading = useMemo(() => {
    if (arudhaIdx === null || now.lagnaLon === undefined) return null;
    const sunSign = now.positions.find((p) => p.planet === "Sun")!.signIndex;
    const nowLagna = Math.floor(now.lagnaLon / 30);
    return computeArudhaReading(now.positions, sunSign, arudhaIdx, nowLagna);
  }, [now.positions, now.lagnaLon, arudhaIdx]);
  const prasnaGulika = useMemo(() => {
    if (arudhaIdx === null || !now.gulika) return null;
    return computeGulikaReading(now.gulika, arudhaIdx);
  }, [now.gulika, arudhaIdx]);

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

  const chapterDefs: ChapterDef[] = [
    { id: "houses", plain: "The twelve houses", technical: "Bhava phala" },
    { id: "topic-check", plain: "Matter and natal context", technical: "Event context" },
    {
      id: "prasna",
      plain: "Ask a question",
      technical: "Prasna",
      blurb: "Explore a selected Arudha against the stored sky snapshot; a true question chart needs the question's time and place.",
    },
    {
      id: "transits",
      plain: "Transits now",
      technical: "Gochara",
      blurb: "The planets as they move now, counted from the birth Moon (ch. 22).",
    },
    {
      id: "marriage",
      plain: "Marriage",
      technical: "Vivaha",
      blurb: "Two charts compared by the agreement of their signs and by the kootas (ch. 21).",
    },
    {
      id: "reference",
      plain: "Reference",
      technical: "Reference",
      blurb: "What each house signifies, diseases and remedies, deities, karakas, the sphutas, the tertiary planets and when the houses fructify.",
    },
  ];

  return (
    <section data-testid="prasna-panel" aria-label="Prasna Marga">
      <h2 className="text-xl font-semibold">Prasna Marga</h2>
      <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">
        The Kerala horary classic. A genuine query needs its question time,
        location and Arudha; this app's query view currently uses a stored sky
        snapshot at the birth-chart location. The birth-chart view is separate.
      </p>
      <p className="mt-2 max-w-[80ch] text-xs text-muted-foreground" data-testid="prasna-gulika-convention">
        Gulika / Mandi uses {gulikaMethodInfo.short}. The Kerala weekday constants are the Prasna
        Marga default; other conventions are comparisons. Change the method in chart settings.
        A traditional interpretation of one placement does not establish an outcome.
      </p>
      {result.gulikaComparisons && (
        <details className="mt-2 rounded-md border p-3 text-xs" data-testid="prasna-gulika-comparison">
          <summary className="cursor-pointer font-medium">Compare birth-chart Gulika / Mandi conventions</summary>
          <p className="mt-2 text-muted-foreground">Each position uses this chart's sunrise definition and ayanamsa. The same setting also selects the snapshot point and the Gulika-dependent sphutas.</p>
          <ul className="mt-2 space-y-1">
            {GULIKA_METHODS.map((method) => {
              const point = result.gulikaComparisons![method.id];
              const house = (point.signIndex - birthLagnaIdx + 12) % 12 + 1;
              return <li key={method.id} data-testid={`prasna-gulika-${method.id}`}>
                {method.label}: <span className="tabular">{(point.lon % 30).toFixed(2)}°</span> {SIGNS[point.signIndex]} · {ord(house)} house{method.id === gulikaMethod ? " · selected" : ""}
              </li>;
            })}
          </ul>
          <p className="mt-2 text-muted-foreground">The sources use the names differently. Prasna Marga's house interpretation is tied to its Kerala method; other selections are explicitly comparisons.</p>
        </details>
      )}

      <Chapters tab="prasna" chapters={chapterDefs} className="mt-4">
      <Chapter id="topic-check"><TopicReadingPanel result={result} system="prasna" onSelected={onTopicSelected} /></Chapter>
      <Chapter id="prasna">

      {/* Prasna (query) */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <SectionTitle plain="Cast a prasna" technical="Prasna kriya" as="h3" />
        <ModeText
          plain="Choose an Arudha and explore the stored sky snapshot. Verify the question's actual time and place before treating it as a horary chart."
          practitioner="The selected Arudha (4.51-55) is read against the stored sky snapshot at the birth-chart location, not a separately cast question time and place."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={castShells}
            data-testid="prasna-generate-arudha"
          >
            Cast shells
          </Button>
          <select
            value={arudhaIdx ?? ""}
            onChange={(e) => {
              setArudhaIdx(e.target.value === "" ? null : Number(e.target.value));
              setShellCast(null);
            }}
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

        <details className="mt-3 rounded-md border p-3" data-testid="prasna-observed-heaps">
          <summary className="cursor-pointer text-sm font-medium">Calculate observed cowrie heaps</summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Enter the three positive heap counts from a physical consultation, totalling 108. The heaps
            give an Ashtamangala number; the gold-placement Arudha is a separate input.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {(["Left / north", "Middle", "Right / south"] as const).map((label, index) => (
              <label key={label} className="flex flex-col gap-1 text-xs text-muted-foreground">
                {label}
                <input
                  type="number"
                  min="1"
                  max="106"
                  step="1"
                  inputMode="numeric"
                  value={observedHeaps[index]}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setObservedHeaps((previous) => {
                      const next: [string, string, string] = [...previous];
                      next[index] = value;
                      return next;
                    });
                  }}
                  className="h-8 w-24 rounded-md border bg-background px-2 text-sm text-foreground"
                  aria-label={`${label} cowries`}
                />
              </label>
            ))}
          </div>
          {observedRemainders && observedOneToEight ? (
            <p className="mt-2 text-xs tabular" data-testid="prasna-observed-heap-result">
              0–7 remainder: {observedRemainders.digits.join(" · ")} ({observedRemainders.digits.join("")})
              {" · "}1–8 interpretation: {observedOneToEight.digits.join(" · ")} ({observedOneToEight.digits.join("")})
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Enter three whole numbers greater than zero that add up to 108.</p>
          )}
          <p className="mt-1 text-2xs text-muted-foreground">
            Prashnanushthana Paddhati, chapter 5, describes digits 1–8; reading a positive multiple of
            8 as 8 is an interpretation of that convention. The 0–7 remainder is shown alongside it.
          </p>
        </details>

        {prasna && arudhaIdx !== null && (
          <div className="mt-3" data-testid="prasna-result">
            <p className="text-sm">
              Arudha lagna:{" "}
              <span className="font-semibold">{SIGNS[arudhaIdx]}</span>{" "}
              <span className="text-muted-foreground">· stored sky snapshot</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Snapshot: {now.asOf}; location: {result.chart.place} (the birth-chart coordinates). To judge an actual question, its own time, place and Arudha must be established; this snapshot does not establish them.</p>
            {shellCast && (
              <p className="mt-1 text-xs text-muted-foreground tabular" data-testid="prasna-shell-cast">
                A simulated handful of {shellCast.handful} cowries ÷ 12 → remainder{" "}
                {shellCast.remainder === 0 ? 12 : shellCast.remainder} →{" "}
                {SIGNS[arudhaIdx]}. Simulated heaps (left, middle, right): {shellCast.groups.join(" · ")};{" "}
                0–7 remainder: {ashtamangalaFromGroups(...shellCast.groups).digits.join("")};{" "}
                1–8 interpretation: {ashtamangalaFromGroups(...shellCast.groups, "one-through-eight").digits.join("")}.
              </p>
            )}
            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
              <SouthIndianChart
                positions={now.positions}
                lagnaSign={arudhaIdx}
                title="Prasna"
                subtitle={`Arudha · ${SIGNS[arudhaIdx]}`}
                badges={
                  now.gulika ? { [now.gulika.signIndex]: ["Gulika"] } : undefined
                }
              />
              <HouseEffectsList readings={prasna} withheld={withheld} />
            </div>
            <SchoolTopicPanel result={result} school="prasna" options={{ prasna: { readings: prasna, frame: "question", arudha: SIGNS[arudhaIdx], asOf: now.asOf } }} />
            {arudhaReading && (
              <div
                className="mt-3 rounded-md border bg-card p-3"
                data-testid="prasna-arudha-reading"
                data-verdict={arudhaReading.verdict}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">Effects of Arudha</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                      ARUDHA_CLASS[arudhaReading.verdict],
                    )}
                  >
                    {plain ? "traditional classification" : arudhaReading.verdict}
                  </span>
                  <span className="ml-auto text-2xs text-muted-foreground">
                    {arudhaReading.source}
                  </span>
                </div>
                {!plain && <p className="mt-1 text-xs text-muted-foreground tabular">
                  Arudha governs {arudhaReading.arudhaPart} · lagna governs{" "}
                  {arudhaReading.lagnaPart} · Chatra {SIGNS[arudhaReading.chatraSign]}
                </p>}
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  {plain ? "The traditional Arudha assessment depends on the query chart. This snapshot cannot establish danger or diagnose a condition." : <Soft>{withheld ? redactProse(arudhaReading.note) : arudhaReading.note}</Soft>}
                </p>
              </div>
            )}
            {prasnaGulika && (
              <div
                className="mt-3 rounded-md border bg-card p-3"
                data-testid="prasna-gulika-reading"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">Gulika / Mandi · {gulikaMethodInfo.short}</span>
                  <span className="text-xs text-muted-foreground">
                    {SIGNS[prasnaGulika.signIndex]} · {ord(prasnaGulika.house)}{" "}
                    from the Arudha
                  </span>
                  <span className="ml-auto text-2xs text-muted-foreground">
                    {prasnaGulika.source}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  {plain ? "The source gives a traditional interpretation for this placement; see practitioner mode for its wording." : <Soft>{withheld ? redactProse(prasnaGulika.text) : prasnaGulika.text}</Soft>}
                </p>
              </div>
            )}
          </div>
        )}
        {arudhaIdx === null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Cast shells, or pick a sign, to read the query chart.
          </p>
        )}
        <p className="mt-3 text-2xs text-muted-foreground" data-testid="prasna-arudha-caveat">
          “Cast shells” is an exploratory simulation that divides a random handful by 12.
          The cited Prasna Marga passages instead describe gold placement for Arudha (4.51–53)
          and three cowrie heaps for Ashtamangala (4.54–55). The simulation does not recreate that ritual.
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
              Register this snapshot
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
            Kept on this device. The recorded time is the stored sky snapshot,
            not necessarily the question time. Outcomes can be noted for follow-up.
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
                    {p.arudhaSign} · snapshot {" "}
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
                    {plain ? "The saved house effects are available in practitioner mode; the snapshot is not a verified question-time chart." : withheld ? redactProse(p.summary) : p.summary}
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

      </Chapter>

      <Chapter id="transits">
      {/* Transits now, from the natal Moon */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <SectionTitle plain="Transits now" technical="Gochara (22)" as="h3" />
        <ModeText
          plain="How the planets moving now touch this chart."
          practitioner="The seven planets' effects in transit, read from the natal Moon (22.1-24), with the Vedha obstructions (22.34-53)."
        />
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
              {t.text ? (
                <p className="mt-0.5">
                  <Soft>{t.text}</Soft>
                </p>
              ) : (
                <p className="mt-0.5 text-muted-foreground">
                  held back for a minor
                </p>
              )}
            </li>
          ))}
        </ul>
        <ul className="mt-2 space-y-0.5 text-2xs text-muted-foreground">
          {PRASNA_TRANSIT_NOTES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        {vedha.length > 0 && (
          <p
            className="mt-2 rounded-md border border-verdict-mixed/40 bg-verdict-mixed/[0.06] p-2 text-xs"
            data-testid="prasna-vedha"
          >
            Vedha (22.34–53):{" "}
            {vedha
              .map(
                (v) =>
                  `${v.planet} in its ${ord(v.house)} (a favourable place) is obstructed by ${v.obstructor} in the ${ord(v.vedhaHouse)}`,
              )
              .join("; ")}
            .
          </p>
        )}
      </div>

      </Chapter>

      <Chapter id="houses">
      {/* Birth chart: the twelve-house walk */}
      <SchoolTopicPanel result={result} school="prasna" options={{ prasna: { readings: natal, fructification, frame: "natal" } }} />
      <section className="mt-6" aria-label="Birth chart">
        <SectionTitle plain="The twelve houses" technical="Bhava phala (14)" as="h3" />
        <ModeText
          plain="Each house covers several matters. Its traditional indications cannot establish a specific event."
          practitioner={`Each house read whole-sign from the ${SIGNS[birthLagnaIdx]} ascendant: its signification (14.3-14), the planets in it (14.50-65), how the promise ripens (14.39-41) and the lord's standing (14.90-100).`}
        />
        <div className="mt-3">
          <HouseWalk
            natal={natal}
            fructification={fructification}
            dispositions={dispositions}
            lagnaIdx={birthLagnaIdx}
            withheld={withheld}
          />
        </div>

        <div className="mt-6" aria-label="Progeny">
          <SectionTitle plain="Progeny" technical="Santhana (19)" as="h4" />
          <ModeText
            plain="Traditional chart factors relating to children. They cannot determine fertility or whether, when or how someone has children."
            practitioner={`${progeny.kind === "beeja" ? "Beeja" : "Kshetra"} Sphuta from the relevant planets' expired nakshatra portions (19.5-9), and the Santana Trisphuta (19.18).`}
          />
          {!plain && !withheld && <><div
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
          </div></>}

          {!gulika && <p className="mt-2 text-xs text-muted-foreground">Natal Gulika / Mandi is unavailable when the required sunrise or sunset cannot be computed.</p>}
          {gulika && (
            <div
              className="mt-2 rounded-md border bg-card p-3"
              data-testid="prasna-gulika"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-medium">Gulika / Mandi · {gulikaMethodInfo.short}</span>
                <span className="text-xs text-muted-foreground">
                  {SIGNS[gulika.signIndex]} · {ord(gulika.house)} house
                </span>
                <span className="ml-auto text-2xs text-muted-foreground">
                  {gulika.source}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                {plain ? "The source gives a traditional interpretation for this placement; see practitioner mode for its wording." : <Soft>{withheld ? redactProse(gulika.text) : gulika.text}</Soft>}
              </p>
              {gulikaClues && <div className="mt-3 space-y-2 border-t pt-2 text-xs leading-relaxed" data-testid="prasna-gulika-clues">
                <p><strong>Jupiter and Gulika:</strong>{" "}
                  Jupiter is in {SIGNS[gulikaClues.jupiter.fromSign]}; Gulika in {SIGNS[gulikaClues.jupiter.toSign]} is{" "}
                  {gulikaClues.jupiter.sameSign ? "in the same sign (a conjunction, shown separately from aspects)" :
                    gulikaClues.jupiterFifthOrNinthAspect ? `${ord(gulikaClues.jupiter.inclusiveSignDistance)} from Jupiter, receiving its full sign aspect` :
                    gulikaClues.jupiter.fullAspect ? `${ord(gulikaClues.jupiter.inclusiveSignDistance)} from Jupiter, receiving its full sign aspect but not the 5th/9th trine` :
                    `${ord(gulikaClues.jupiter.inclusiveSignDistance)} from Jupiter, without its full sign aspect`}.
                  {" "}Prasna Marga 18.68 considers a Jupiter–Gulika trine in a question-chart discussion; this birth-chart comparison is exploratory, not an automatic cancellation.
                </p>
                <p><strong>Fifth-house context:</strong>{" "}
                  Natural benefics in the fifth sign: {gulikaClues.fifth.naturalBeneficOccupants.join(", ") || "none listed"};
                  {" "}casting a full sign aspect: {gulikaClues.fifth.naturalBeneficAspects.join(", ") || "none listed"}.
                  {" "}Occupation and aspect are shown separately; this is a partial natal context, not a complete promise or a fertility judgment.
                </p>
                {gulikaClues.sphuta && !withheld && <p><strong>Gulika and {gulikaClues.sphuta.kind === "beeja" ? "Beeja" : "Kshetra"} Sphuta:</strong>{" "}
                  {gulikaClues.sphuta.sameSignAsGulika ? "They share a sign" : "They occupy different signs"} under the selected calculation.
                  {" "}Prasna Marga 19.8 discusses Gulika association in its Kshetra passage;{gulikaClues.sphuta.kind === "beeja" ? " applying it to Beeja is exploratory." : " this is only the same-sign subset."} The app does not evaluate Gulika's aspects or establish an outcome.
                </p>}
                {!plain && <details><summary className="cursor-pointer font-medium">Planet relationships to Gulika · full sign aspects</summary>
                  <ul className="mt-1 space-y-1">{gulikaClues.planetaryRelations.map((relation) => <li key={relation.from}>
                    {relation.from} in {SIGNS[relation.fromSign]}: {relation.sameSign ? "same sign" : relation.fullAspect ? `${ord(relation.inclusiveSignDistance)} full aspect` : "no full aspect"}.
                  </li>)}</ul>
                  <p className="mt-1 text-muted-foreground">These are directional sign facts in the named convention, not interpretations shared automatically across schools. Nodes are not assigned aspects here.</p>
                </details>}
              </div>}
            </div>
          )}
        </div>
      </section>

      </Chapter>

      <Chapter id="marriage">
      {/* Marriage compatibility: Rasi agreement + kootas */}
      <div className="mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <SectionTitle plain="Marriage compatibility" technical="Vivaha (21)" as="h3" />
        <ModeText
          plain="How well two charts agree."
          practitioner="Rasi agreement (21.1-16) and the star- and lord-based kootas (21.17-50): the groom read from the bride."
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {femaleChart ? "Partner's" : "This chart's"} Moon is{" "}
            {SIGNS[natalMoon.signIndex]} ({natalMoon.nakshatra}). Partner's Moon
            star:
          </span>
          <select
            value={partnerNak ?? ""}
            onChange={(e) =>
              setPartnerNak(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-8 rounded-md border bg-background px-2 text-sm"
            data-testid="prasna-partner-moon"
            aria-label="Partner's Moon nakshatra"
          >
            <option value="">Pick a star</option>
            {NAKSHATRAS.map((n, i) => (
              <option key={n} value={i}>
                {n}
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
        {kootas && (
          <div
            className="mt-3 rounded-md border bg-card p-3"
            data-testid="prasna-kootas"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium">The kootas</span>
              <span className="text-xs text-muted-foreground">
                {kootas.good} of {kootas.total} good
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                Prasna Marga 21.17–50
              </span>
            </div>
            <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {(
                [
                  ["Vasya", kootas.vasya],
                  ["Rasyadhipati", kootas.rasyadhipati],
                  ["Mahendra", kootas.mahendra],
                  ["Dina", kootas.dina],
                  ["Streedeergha", kootas.streedeegha],
                  ["Gana", kootas.gana],
                  ["Yoni", kootas.yoni],
                  ["Varna", kootas.varna],
                  ["Vedha", kootas.vedha],
                  ["Rajju", kootas.rajju],
                  ["Bhuta", kootas.bhuta],
                ] as const
              ).map(([name, k]) => (
                <li
                  key={name}
                  className="text-xs leading-relaxed"
                  data-testid={`prasna-koota-${name.toLowerCase()}`}
                >
                  <span className="font-medium">{name}</span>{" "}
                  <span
                    className={cn(
                      "rounded px-1 py-0.5 text-2xs uppercase",
                      k.grade === "good"
                        ? "text-verdict-good"
                        : k.grade === "fair"
                          ? "text-verdict-mixed"
                          : "text-verdict-bad",
                    )}
                  >
                    {k.grade}
                  </span>{" "}
                  — <Soft>{k.text}</Soft>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-2xs text-muted-foreground">
              Not applied: Gotra, Vihanga, the animal-yoni enmities, Vaya by
              ages, the Ashtakavarga agreement, Aya/Vyaya and Rinanukulya.
            </p>
          </div>
        )}
      </div>

      </Chapter>

      <Chapter id="reference">
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
              <Soft>{withheld ? redactProse(b.text) : b.text}</Soft>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3" data-testid="prasna-diseases">
        <summary className="cursor-pointer text-sm font-semibold">
          Diseases, their causes and remedies
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          The Karma Vipaka table (Prasna Marga 23.2–37): for each disease, the
          past-life act it names as cause and the remedy. Reference, not a
          diagnosis.
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {PRASNA_DISEASE_REMEDIES.map((d) => {
            const causes = diseaseCauses(d, withheld);
            return (
            <li
              key={d.disease}
              className="text-xs leading-relaxed"
              data-testid={`prasna-disease-${d.disease.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="font-medium">
                <Soft>{d.disease}</Soft>
              </span>{" "}
              {causes && (
                <span className="text-muted-foreground">
                  — <Soft>{causes}</Soft>.
                </span>
              )}{" "}
              <Soft>{`${d.remedy}.`}</Soft>{" "}
              <span className="text-muted-foreground">({d.source})</span>
            </li>
            );
          })}
        </ul>
        <ul className="mt-2 space-y-0.5 text-2xs text-muted-foreground">
          {PRASNA_DISEASE_NOTES.map((n, i) => (
            <li key={i}>
              <Soft>{n}</Soft>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3" data-testid="prasna-deities">
        <summary className="cursor-pointer text-sm font-semibold">
          Deities behind the karma
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          The Deva Kopa mapping (Prasna Marga 15.3–7): which deity each planet
          signifies, by its sign, drekkana and strength.
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {PRASNA_DEITY_MAPPING.map((d) => (
            <li
              key={`${d.planet}-${d.deity}`}
              className="text-xs leading-relaxed"
              data-testid={`prasna-deity-${d.planet.toLowerCase()}`}
            >
              <span className="font-medium">{d.planet}</span>{" "}
              <span className="text-muted-foreground">· {d.condition}</span> —{" "}
              {d.deity}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Palliatives: {PRASNA_DEITY_REMEDIES.join(" ")}
        </p>
        <p className="mt-2 text-2xs text-muted-foreground">{PRASNA_DEITY_NOTE}</p>
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
              <PlanetName planet={k.planet} /> — <Soft>{k.text}</Soft>{" "}
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
            The first six points use the selected birth-chart Gulika / Mandi (Prasna Marga 5.17–19).
            The separately labelled ghati points use the stored current snapshot, not the birth instant.
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
                      ["Pranasphuta (snapshot ghatis)", result.timeSphutas.pranasphutaAlt, "alt"],
                      ["Mrityusphuta (snapshot weekday)", result.timeSphutas.mrityusphutaAlt, "alt"],
                      ["Kalasphuta (snapshot)", result.timeSphutas.kalasphuta, "alt"],
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

      <details className="mt-3" data-testid="prasna-tertiary">
        <summary className="cursor-pointer text-sm font-semibold">
          The five tertiary planets
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          Dhuma, Vyatipata, Parivesha, Indrachapa and Upaketu, from the Sun
          (14.72), read by the house each occupies from the lagna (14.73–79).
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {tertiary.map((t) => (
            <li
              key={t.name}
              className="text-xs leading-relaxed"
              data-testid={`prasna-tertiary-${t.name.toLowerCase()}`}
            >
              <span className="font-medium">{t.name}</span>{" "}
              <span className="text-muted-foreground">
                · {ord(t.house)} house
              </span>
              {t.text ? (
                <span> — <Soft>{t.text}</Soft></span>
              ) : (
                <span className="text-muted-foreground"> — held back for a minor</span>
              )}
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3" data-testid="prasna-fructification-timing">
        <summary className="cursor-pointer text-sm font-semibold">
          When bhavas fructify
        </summary>
        <p className="mt-1 text-xs text-muted-foreground">
          The period a bhava's promise takes to show, from its lord's allotted
          time (14.81–85). The seven periods follow Brihat Jataka.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {timing.periods
            .map((p) => `${p.planet} ${p.classical} (${p.label})`)
            .join(" · ")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-foreground/90">
          <Soft>{timing.lagnaNavamsa.text}</Soft>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/90">
          <Soft>{timing.sorrow.text}</Soft>
        </p>
        <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {timing.houses.map((h) => (
            <li
              key={h.house}
              className="text-xs leading-relaxed"
              data-testid={`prasna-timing-house-${h.house}`}
            >
              <span className="font-medium">{ord(h.house)}</span>{" "}
              <span className="text-muted-foreground">
                ({houseGloss("prasna", h.house)}):
              </span>{" "}
              <Soft>{h.text}</Soft>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-2xs text-muted-foreground">
          {timing.source}. The transit trigger of 14.86 (the event when the Sun,
          Moon or effect-giver crosses the lagna, its sign or its exaltation)
          and the "other methods" pointer of 14.84 are noted, not computed.
        </p>
      </details>

      <ul className="mt-4 space-y-1 text-2xs text-muted-foreground">
        {PRASNA_CAVEATS.map((c, i) => (
          <li key={i} data-testid={`prasna-caveat-${i}`}>
            <Soft>{c}</Soft>
          </li>
        ))}
        <li>
          <Soft>{PRASNA_NODE_NOTE}</Soft>
        </li>
      </ul>
      </Chapter>
      </Chapters>
    </section>
  );
}
