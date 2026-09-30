import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, type Planet } from "@shared/astro";
import type {
  BaselineStat,
  ChanceBaseline,
  BnnContact,
  BnnFit,
  EventValidation,
  Nature,
  PlanetTally,
  ValidationResult,
  CuspFilter,
} from "@shared/validate-types";
import type { TransitCheck } from "@shared/rectify-types";
import type { EventOutcome } from "@shared/events";
import { RAO_SOURCE } from "@shared/jaimini-areas";
import { LifeEventsEditor } from "@/components/life-events";
import { LifeTimeline, type TlMark } from "@/components/life-timeline";
import { charaBands, transitBand, vimshottariBands } from "@/lib/timeline-data";
import { vimshottari } from "@shared/kp";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function Mark({ on, title }: { on: boolean; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full align-middle",
        on ? "bg-verdict-good" : "bg-muted-foreground/25",
      )}
      aria-label={on ? "agrees" : "does not agree"}
    />
  );
}

/** How the real events compare with the same matters at random dates: the test a birth time can fail. */
function BaselineLine({
  b,
  hasJaimini,
}: {
  b: ChanceBaseline;
  hasJaimini: boolean;
}) {
  const cells: Array<{ key: string; label: string; s: BaselineStat }> = [
    { key: "confirmed", label: "confirmed", s: b.confirmed },
    { key: "kp", label: "KP", s: b.kp },
    { key: "transit", label: "transits", s: b.transit },
    ...(hasJaimini ? [{ key: "jaimini", label: "Jaimini", s: b.jaimini }] : []),
    { key: "bnn", label: "Nadi", s: b.bnn },
    { key: "bnnWindow", label: "Nadi windows", s: b.bnnWindow },
    { key: "kpWindow", label: "KP periods", s: b.kpWindow },
    { key: "kpFullWindow", label: "KP full", s: b.kpFullWindow },
    { key: "kpStrictWindow", label: "KP strict", s: b.kpStrictWindow },
    {
      key: "kpStrictFullWindow",
      label: "KP strict full",
      s: b.kpStrictFullWindow,
    },
    { key: "luminary", label: "Sun/Moon", s: b.luminary },
  ];
  // Several metrics are read at once, so one of them clears the 95th by chance more often than one in twenty.
  // Bonferroni: a single metric counts as a signal only from the (100 - 5/n)th percentile.
  const n = cells.length;
  const familyChance = Math.round((1 - Math.pow(0.95, n)) * 100);
  const corrected = Math.ceil(100 - 5 / n);
  const tone = (pct: number, v: BaselineStat["verdict"]) =>
    pct >= corrected
      ? "text-verdict-good"
      : v === "below"
        ? "text-verdict-bad"
        : "text-muted-foreground";
  const anyAbove = cells.some((c) => c.s.percentile >= corrected);
  return (
    <span
      className="basis-full text-muted-foreground"
      data-testid="validate-baseline"
      title={`Each matter re-scored at ${b.trials} sets of random dates between ${b.span[0]} and ${b.span[1]}. The percentile is the share of those trials the real dates beat; 50 is pure chance. With ${n} metrics read together, at least one reaches the 95th by chance about ${familyChance}% of the time, so a single metric is read as a signal only from the ${corrected}${ordinal(corrected)} percentile (Bonferroni, 5% over the family).`}
    >
      Against chance ({b.trials} random-date trials):{" "}
      {cells.map((c, i) => (
        <span key={c.key} data-testid={`validate-baseline-${c.key}`}>
          {i > 0 && " · "}
          {c.label}{" "}
          <span className={cn("tabular", tone(c.s.percentile, c.s.verdict))}>
            {c.s.percentile}
            {ordinal(c.s.percentile)}
          </span>
          <span className="tabular"> (chance {c.s.mean})</span>
        </span>
      ))}
      <span className="block" data-testid="validate-baseline-family">
        {n} metrics at once: one clears the 95th by chance about {familyChance}%
        of the time, so a signal here needs the {corrected}
        {ordinal(corrected)} percentile
        {anyAbove ? "; reached" : "; none reaches it"}. One chart is one
        witness, not a test of the method.
      </span>
    </span>
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-block h-1.5 w-10 overflow-hidden rounded bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded bg-foreground"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="tabular text-xs">
        {score}/{max}
      </span>
    </span>
  );
}

const OUTCOME_LABEL: Record<EventOutcome, string> = {
  favourable: "favourable",
  unfavourable: "unfavourable",
  mixed: "mixed",
};
const NATURE_LABEL: Record<Nature, string> = {
  benefic: "benefic",
  malefic: "malefic",
  mixed: "mixed",
  unknown: "no evidence",
};

function OutcomeBadge({ outcome }: { outcome: EventOutcome }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "no-default-hover-elevate font-normal",
        outcome === "favourable"
          ? "border-verdict-good/60 text-verdict-good"
          : outcome === "unfavourable"
            ? "border-primary/60 text-primary"
            : "",
      )}
    >
      {OUTCOME_LABEL[outcome]}
    </Badge>
  );
}

function VerdictBadge({
  verdict,
}: {
  verdict: EventValidation["kp"]["verdict"];
}) {
  return (
    <Badge
      variant={verdict === "confirmed" ? "default" : "outline"}
      className={cn(
        "no-default-hover-elevate font-normal",
        verdict === "confirmed"
          ? "bg-verdict-good text-white hover:bg-verdict-good"
          : verdict === "missed"
            ? "border-primary/60 text-primary"
            : "",
      )}
      data-testid={`validate-verdict-${verdict}`}
    >
      {verdict}
    </Badge>
  );
}

function NatureBadge({ nature }: { nature: Nature }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "no-default-hover-elevate font-normal",
        nature === "benefic"
          ? "border-verdict-good/60 text-verdict-good"
          : nature === "malefic"
            ? "border-primary/60 text-primary"
            : "text-muted-foreground",
      )}
    >
      {NATURE_LABEL[nature]}
    </Badge>
  );
}

function Lord({
  planet,
  on,
  houses,
  role,
  filtered,
  effective,
}: {
  planet: Planet;
  on: boolean;
  houses: number[];
  role: string;
  filtered: CuspFilter[];
  effective: boolean;
}) {
  const diverted = on && !effective;
  const cuspNote = filtered
    .map(
      (f) =>
        `${f.house}: cusp sub lord ${f.cuspSubLord} signifies ${f.delivers.join(", ") || "nothing"}${f.kept ? "" : f.denied ? " (denied: the 12th from it)" : " (diverted)"}`,
    )
    .join("; ");
  const title = `${role} ${planet}: ${on ? `signifies ${houses.join(", ")}` : "signifies none of the matter's houses"}${on ? `. Through the cusps, ${cuspNote}` : ""}${diverted ? ". Every hit is diverted by its cusp sub lord (Part 3 ch. 5; Part 2 ch. 7)" : ""}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        diverted && "line-through decoration-primary/60",
      )}
      title={title}
      data-diverted={diverted || undefined}
    >
      <Mark on={on} />
      <PlanetName planet={planet} abbr tone />
    </span>
  );
}

function Transit({ t }: { t: TransitCheck }) {
  const parts: Array<[string, Planet, boolean]> = [
    ["sign", t.signLord, t.hits[0]],
    ["star", t.starLord, t.hits[1]],
    ["sub", t.subLord, t.hits[2]],
  ];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      title={`${t.planet} that day in ${parts.map(([k, p, on]) => `${k} ${p}${on ? " (significator)" : ""}`).join(", ")}`}
    >
      <span className="text-muted-foreground">{PLANET_ABBR[t.planet]}</span>
      {parts.map(([k, p, on]) => (
        <span key={k} className="inline-flex items-center gap-0.5">
          <Mark on={on} />
          <span className={cn(!on && "text-muted-foreground")}>
            {PLANET_ABBR[p]}
          </span>
        </span>
      ))}
    </span>
  );
}

function planetList(ps: Planet[]) {
  return ps.length ? ps.map((p) => PLANET_ABBR[p]).join(" ") : "none";
}

const CONTACT_WORD: Record<BnnContact, string> = {
  over: "over",
  trine: "trine",
  opposite: "opp.",
};

function NadiCell({ fit }: { fit: BnnFit }) {
  const jLine = `Jupiter in ${fit.jupiterSign}, the ${fit.fromJeeva}${ordinal(fit.fromJeeva)} from natal Jupiter${fit.fromDeha ? ` and the ${fit.fromDeha}${ordinal(fit.fromDeha)} from the Deha` : ""}. With ${planetList(fit.conjunct)}; trine ${planetList(fit.trine)}; opposite ${planetList(fit.opposite)}.`;
  const sLine = `Saturn in ${fit.saturnSign} over ${planetList(fit.saturnOver)}.`;
  const parts = [
    `Karakas: ${planetList(fit.karakas)}.`,
    fit.jupiter
      ? `Jupiter ${CONTACT_WORD[fit.jupiter.contact]} ${fit.jupiter.planet}: ${fit.jupiter.contact === "over" ? 2 : 1}.`
      : "Jupiter touches no karaka: 0.",
    fit.saturn
      ? `Saturn ${CONTACT_WORD[fit.saturn.contact]} ${fit.saturn.planet}: 1.`
      : "Saturn touches no karaka: 0.",
    fit.double ? "Double transit on a karaka: 1." : "No double transit: 0.",
    fit.progression
      ? "Count from the Jeeva fits the matter: 1."
      : "Count from the Jeeva does not fit: 0.",
    fit.combination
      ? `Combination ripened: ${fit.combination} 1.`
      : "No combination of this area under Jupiter: 0.",
  ];
  const tone =
    fit.verdict === "strong"
      ? "text-verdict-good"
      : fit.verdict === "some"
        ? ""
        : "text-muted-foreground";
  return (
    <div
      className="leading-5"
      title={[jLine, sLine, ...parts].join("\n")}
      data-testid={`validate-nadi-${fit.verdict}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Ju</span>
        <span>{fit.jupiterSign.slice(0, 3)}</span>
        <Mark on={fit.jupiter !== null} />
        <span className={cn(!fit.jupiter && "text-muted-foreground")}>
          {fit.jupiter
            ? `${CONTACT_WORD[fit.jupiter.contact]} ${PLANET_ABBR[fit.jupiter.planet]}`
            : `${fit.fromJeeva}${ordinal(fit.fromJeeva)}`}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Sa</span>
        <span>{fit.saturnSign.slice(0, 3)}</span>
        <Mark on={fit.saturn !== null} />
        <span className={cn(!fit.saturn && "text-muted-foreground")}>
          {fit.saturn
            ? `${CONTACT_WORD[fit.saturn.contact]} ${PLANET_ABBR[fit.saturn.planet]}`
            : "—"}
        </span>
        <span className={cn("tabular ml-1", tone)}>
          {fit.score}/{fit.max}
        </span>
      </div>
    </div>
  );
}

export function ValidatePanel({ result }: { result: ChartResult }) {
  const { chart } = result;
  const events = chart.events ?? [];
  const eventsKey = JSON.stringify(events);
  const q = useQuery<ValidationResult>({
    queryKey: [
      "validate",
      chart.id,
      chart.birthDate,
      chart.birthTime,
      chart.latitude,
      chart.longitude,
      chart.ayanamsa,
      chart.nodeType,
      chart.gender,
      eventsKey,
    ],
    queryFn: async () => {
      const { id: _id, ...insert } = chart;
      return (await (
        await apiRequest("POST", "/api/validate", insert)
      ).json()) as ValidationResult;
    },
    enabled: events.length > 0,
  });
  const v = q.data;
  const zone = chart.timezone;
  const fmtDate = (d: string) =>
    DateTime.fromISO(d, { zone }).toFormat("d LLL yyyy");

  // Shared timeline: the three clocks the events are checked against, with each event tinted by how KP read it.
  const tlBands = useMemo(() => {
    const moon = result.kp.positions.find((p) => p.planet === "Moon");
    const vim = moon
      ? vimshottariBands(vimshottari(moon.lon, result.utc, result.now.asOf), {
          label: "KP dasa",
        })
      : [];
    return [
      ...vim,
      ...charaBands(result.jaimini.charaDasha, result.now.asOf).slice(0, 1),
      transitBand(result.transits, "Jupiter", result.now.asOf),
    ];
  }, [
    result.kp.positions,
    result.utc,
    result.now.asOf,
    result.jaimini.charaDasha,
    result.transits,
  ]);
  const tlMarks = useMemo<TlMark[]>(
    () =>
      (v?.events ?? []).map((e) => ({
        id: e.id,
        date: DateTime.fromISO(e.date, { zone }).toISO()!,
        label: `${e.label} · KP ${e.kp.verdict}`,
        tone:
          e.kp.verdict === "confirmed"
            ? "good"
            : e.kp.verdict === "partial"
              ? "mixed"
              : "bad",
        title: `${e.label} · ${fmtDate(e.date)} · KP ${e.kp.verdict} (${e.kp.score}/${e.kp.max}); Nadi ${e.bnn.score}/${e.bnn.max}${e.jaimini ? `; Chara ${e.jaimini.mdSignName}–${e.jaimini.adSignName}` : ""}`,
      })),
    [v, zone],
  );

  return (
    <section data-testid="validate-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold" data-testid="validate-title">
            Check the chart against what happened
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each saved life event is read back at its date with the birth time
            as recorded: were the KP period lords significators of the matter
            and did its cusp promise it, did the Jaimini chara dasha carry the
            area, and did Jupiter and Saturn touch the matter's Nadi karakas.
            The window tables read the same events the other way round: which
            timing windows, named in advance by each system, the dates fell
            inside. The planet table then shows how each planet's periods
            actually went, against what its houses lead KP to expect.
          </p>
        </div>
      </div>

      <div className="mt-4" data-testid="validate-events-editor">
        <p className="mb-1.5 text-xs font-medium">
          Life events{" "}
          <span className="text-muted-foreground">
            saved with the chart; the tables below follow every change
          </span>
        </p>
        <LifeEventsEditor chart={chart} />
      </div>

      {events.length === 0 && (
        <div
          className="mt-6 rounded-md border border-dashed p-6 text-sm text-muted-foreground"
          data-testid="validate-empty"
        >
          Add at least one dated event to check the chart. Marriage, a child, a
          job change or a parent's death are the surest anchors, as the date is
          rarely misremembered.
        </div>
      )}

      {events.length > 0 && q.isLoading && (
        <div
          className="mt-6 space-y-3"
          aria-busy="true"
          data-testid="validate-skeleton"
        >
          <p className="text-xs text-muted-foreground">
            Reading each event back at its date: KP period lords, Chara dasha
            and Jupiter's transit.
          </p>
          <div className="h-32 animate-pulse rounded-md bg-muted" />
          <div className="space-y-1.5">
            {events.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[6rem_1fr_4rem_4rem] gap-3"
              >
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div
                  className="h-8 animate-pulse rounded bg-muted"
                  style={{ opacity: 0.7 }}
                />
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div
                  className="h-8 animate-pulse rounded bg-muted"
                  style={{ opacity: 0.7 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {q.error && (
        <p className="mt-6 text-sm text-primary" data-testid="validate-error">
          Could not check the events: {(q.error as Error).message}
        </p>
      )}

      {v && v.events.length > 0 && (
        <div className="mt-6" data-testid="validate-results">
          <LifeTimeline
            className="mb-5"
            testid="validate-timeline"
            birthIso={result.utc}
            asOfIso={result.now.asOf}
            bands={tlBands}
            marks={tlMarks}
            marksLabel="Checked"
          />
          <p className="mb-4 text-xs text-muted-foreground">
            Each event is tinted by the KP verdict at its date: green confirmed,
            amber partial, red missed. The bands beneath are the clocks it was
            read against; hover an event to see the Nadi and Chara scores as
            well.
          </p>
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
            data-testid="validate-summary"
          >
            <span>
              <span className="font-medium">{v.summary.events}</span> event
              {v.summary.events === 1 ? "" : "s"} · lagna {v.lagna.sign} at{" "}
              {chart.birthTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              KP <ScoreBar score={v.summary.kpScore} max={v.summary.kpMax} />
              <span className="text-muted-foreground">
                {v.summary.confirmed} confirmed, {v.summary.partial} partial,{" "}
                {v.summary.missed} missed
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Transits{" "}
              <ScoreBar
                score={v.summary.transitScore}
                max={v.summary.transitMax}
              />
            </span>
            {v.summary.jaiminiEvents > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Jaimini{" "}
                <ScoreBar
                  score={v.summary.jaiminiScore}
                  max={v.summary.jaiminiMax}
                />
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5"
              data-testid="validate-summary-nadi"
            >
              Nadi{" "}
              <ScoreBar score={v.summary.bnnScore} max={v.summary.bnnMax} />
              <span className="text-muted-foreground">
                {v.summary.bnnStrong} strong
              </span>
            </span>
            {v.baseline && (
              <BaselineLine
                b={v.baseline}
                hasJaimini={v.summary.jaiminiEvents > 0}
              />
            )}
            <span
              className="text-muted-foreground"
              title="By the houses each planet signifies, then by what the sub lords of those cusps let it deliver."
            >
              Planets: {v.summary.agree} as expected, {v.summary.conflict}{" "}
              against, by houses; {v.summary.agreeByCusp} and{" "}
              {v.summary.conflictByCusp} through the cusps
              {v.summary.diverted > 0
                ? `; ${v.summary.diverted} period-lord ${v.summary.diverted === 1 ? "hit" : "hits"} diverted`
                : ""}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table
              className="text-xs [&_td]:px-3 [&_th]:px-3"
              data-testid="validate-table"
              cards
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Event</TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Dasa, bhukti and antara lords running that day; a green mark means the lord signifies one of the matter's houses (four-step). A struck-through lord signifies the matter but the sub lords of those cusps carry it elsewhere (Part 3 ch. 5; Part 2 ch. 7)."
                  >
                    KP period lords
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Sub lord of the matter's cusp; green when it signifies one of the matter's houses, so the matter is promised."
                  >
                    Cusp
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Sign, star and sub the dasa and bhukti lords transited that day; green where the lord is a significator of the matter."
                  >
                    Transit
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Chara dasha and antardasha signs running that day and whether each carries the matter's life area (K.N. Rao)."
                  >
                    Jaimini
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Nadi timing, six points: Jupiter over the matter's karaka (2; trine or opposite 1), Saturn touching a karaka (1), both on the same karaka (1), Jupiter's count from the Jeeva in the matter's signs (1), a natal combination of the area under the passage (1)."
                  >
                    Nadi transit
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Whether the date fell inside a timing window the system itself names in advance: Jupiter's passage over the matter's karaka or its count-signs from the Jeeva for Nadi; for KP, the conjoined period of the matter's significators at the dasa-bhukti level, with the antara as a refinement."
                  >
                    Window
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.events.map((e) => (
                  <TableRow key={e.id} data-testid={`validate-event-${e.id}`}>
                    <TableCell className="min-w-[10rem]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium">{e.label}</span>
                        <OutcomeBadge outcome={e.outcome} />
                      </div>
                      <div
                        className="tabular whitespace-nowrap text-muted-foreground"
                        title={`Houses of the matter: ${e.houses.join(", ")}; cusp ${e.cusp}`}
                      >
                        {fmtDate(e.date)} · age {e.age}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Lord
                          planet={e.kp.dasa}
                          on={e.kp.hits[0]}
                          houses={e.kp.signified[0]}
                          role="Dasa"
                          filtered={e.kp.filtered[0]}
                          effective={e.kp.effective[0]}
                        />
                        <Lord
                          planet={e.kp.bhukti}
                          on={e.kp.hits[1]}
                          houses={e.kp.signified[1]}
                          role="Bhukti"
                          filtered={e.kp.filtered[1]}
                          effective={e.kp.effective[1]}
                        />
                        <Lord
                          planet={e.kp.antara}
                          on={e.kp.hits[2]}
                          houses={e.kp.signified[2]}
                          role="Antara"
                          filtered={e.kp.filtered[2]}
                          effective={e.kp.effective[2]}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1"
                        title={`Cusp ${e.cusp} sub lord ${e.kp.cuspSubLord}: ${e.kp.promised ? `signifies ${e.kp.cuspSignified.join(", ")}` : e.kp.deniedAtCusp ? `signifies none of the matter's houses and does signify the 12th from the cusp: the matter is denied even in a fitting period (Part 3 ch. 5 p. 28)` : "signifies none of the matter's houses"}`}
                        data-denied={e.kp.deniedAtCusp || undefined}
                      >
                        <Mark on={e.kp.promised} />
                        <span className="text-muted-foreground">{e.cusp}</span>
                        <PlanetName planet={e.kp.cuspSubLord} abbr tone />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <Transit t={e.kp.transit.dasa} />
                        <Transit t={e.kp.transit.bhukti} />
                        <span
                          className="inline-flex items-center gap-1 text-muted-foreground"
                          title="The luminaries complete the timing (Part 2 p. 26): within the conjoined period, the event takes place when the Sun or Moon transits the sign, star or sub of the dasa, bhukti or antara lord (provisional reading; the book's wording also allows the significators, which holds on almost any day). Su marks the Sun, Mo the Moon."
                        >
                          Su <Mark on={e.kp.transit.luminary.sun} /> Mo{" "}
                          <Mark on={e.kp.transit.luminary.moon} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.jaimini ? (
                        <span
                          className="inline-flex items-center gap-1.5"
                          title={[
                            `Mahadasha ${e.jaimini.mdSignName}: ${e.jaimini.md.triggers.join("; ") || "no trigger"}`,
                            `Antardasha ${e.jaimini.adSignName}: ${e.jaimini.ad.triggers.join("; ") || "no trigger"}`,
                          ].join("\n")}
                        >
                          <Mark on={e.jaimini.md.hot} />
                          <span
                            className={cn(
                              !e.jaimini.md.hot && "text-muted-foreground",
                            )}
                          >
                            {e.jaimini.mdSignName.slice(0, 3)}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <Mark on={e.jaimini.ad.hot} />
                          <span
                            className={cn(
                              !e.jaimini.ad.hot && "text-muted-foreground",
                            )}
                          >
                            {e.jaimini.adSignName.slice(0, 3)}
                          </span>
                          <span className="tabular text-muted-foreground">
                            {e.jaimini.score}/{e.jaimini.max}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">no area</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <NadiCell fit={e.bnn} />
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap"
                      data-testid={`validate-event-windows-${e.id}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            !e.windows.bnn && "text-muted-foreground",
                          )}
                          title={
                            e.windows.bnn
                              ? `Jupiter in ${e.windows.bnn.sign} from ${fmtDate(e.windows.bnn.start)} to ${fmtDate(e.windows.bnn.end)}; ${e.windows.bnn.via === "count" ? "by count from the Jeeva only" : `${e.windows.bnn.contact} ${e.windows.bnn.karaka}`}`
                              : "No Nadi window for this matter was open at the date"
                          }
                        >
                          {e.windows.bnn
                            ? `Ju in ${e.windows.bnn.sign}, ${
                                e.windows.bnn.contact
                                  ? `${e.windows.bnn.contact} ${e.windows.bnn.karaka}`
                                  : `${e.windows.bnn.fromJeeva}${ordinal(e.windows.bnn.fromJeeva)} from Jeeva`
                              }`
                            : "Ju: no window"}
                        </span>
                        <span
                          className={cn(
                            !e.windows.kp && "text-muted-foreground",
                          )}
                          title={
                            e.windows.kp
                              ? `${e.windows.kp.dasaLord}-${e.windows.kp.bhuktiLord} from ${fmtDate(e.windows.kp.start)} to ${fmtDate(e.windows.kp.end)}; ${e.windows.kp.verdict} at best among its antara windows, score ${e.windows.kp.score}/${e.windows.kp.max}; ${e.windows.kp.fullAntaras.length} antara${e.windows.kp.fullAntaras.length === 1 ? "" : "s"} whose lord also signifies`
                              : "No KP joint period for this matter was open at the date"
                          }
                        >
                          {e.windows.kp
                            ? `${e.windows.kp.dasaLord}-${e.windows.kp.bhuktiLord} (${e.windows.kp.verdict}), antara ${e.windows.kp.antaraSignifies ? "yes" : "no"}`
                            : "KP: no window"}
                        </span>
                        <span
                          className={cn(
                            !e.windows.kpStrict && "text-muted-foreground",
                          )}
                          title={
                            e.windows.kpStrict
                              ? `Strict reading (Part 2 p. 151: ordered hierarchy, fruitful sub): ${e.windows.kpStrict.dasaLord}-${e.windows.kpStrict.bhuktiLord} from ${fmtDate(e.windows.kpStrict.start)} to ${fmtDate(e.windows.kpStrict.end)}; antara lord ${e.windows.kpStrict.antaraSignifies ? "also qualified" : "did not qualify"}`
                              : "No strict KP joint period for this matter was open at the date"
                          }
                        >
                          {e.windows.kpStrict
                            ? `strict ${e.windows.kpStrict.dasaLord}-${e.windows.kpStrict.bhuktiLord}, antara ${e.windows.kpStrict.antaraSignifies ? "yes" : "no"}`
                            : "strict: no window"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <VerdictBadge verdict={e.kp.verdict} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3
            className="mt-8 text-base font-semibold"
            data-testid="validate-windows-title"
          >
            Which timing windows the events fell in
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The table above asks what was running on the day; this one asks the
            prior question. Was the date inside a window the system itself names
            in advance — for Nadi, a Jupiter passage over the matter's karaka or
            in its count-signs from the Jeeva; for KP, the conjoined period of
            the matter's significators, read at the dasa-bhukti level the books'
            worked marriages are dated by, with the antara carried as a
            refinement? Only the past windows that caught a recorded event are
            listed, with the counts giving the honest denominator of windows
            that caught nothing; the chance line above carries the same
            measures, so a window real events fall in no more often than random
            dates reads as chance, not as a hit.
          </p>
          <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="validate-windows-summary"
          >
            {v.windows.events} recorded{" "}
            {v.windows.events === 1 ? "event" : "events"}: Nadi windows caught{" "}
            {v.windows.bnnCaught}, of {v.windows.bnnPast} past windows for these
            matters; KP joint periods caught {v.windows.kpCaught}, of{" "}
            {v.windows.kpPast}, of which {v.windows.kpFull} also had the antara
            lord signifying (full three-level match); the strict reading
            (ordered hierarchy and fruitful sub, Part 2 p. 151) caught{" "}
            {v.windows.kpStrictCaught} of {v.windows.kpStrictPast}, of which{" "}
            {v.windows.kpStrictFull} full.
          </p>
          {v.events.some(
            (e) => !e.windows.bnn && !e.windows.kp && !e.windows.kpStrict,
          ) && (
            <p
              className="mt-1 text-xs text-muted-foreground"
              data-testid="validate-windows-missed"
            >
              No window of its matter was open at:{" "}
              {v.events
                .filter(
                  (e) => !e.windows.bnn && !e.windows.kp && !e.windows.kpStrict,
                )
                .map((e) => `${e.label.toLowerCase()} (${fmtDate(e.date)})`)
                .join("; ")}
              .
            </p>
          )}
          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table
              className="text-xs [&_td]:px-3 [&_th]:px-3"
              data-testid="validate-windows-table"
              cards
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">System</TableHead>
                  <TableHead className="whitespace-nowrap">Matter</TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="The window as the system names it, and the dates it was open."
                  >
                    Window
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Caught</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.windows.bnn.length === 0 &&
                  v.windows.kp.length === 0 &&
                  v.windows.kpStrict.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground"
                      data-testid="validate-windows-none"
                    >
                      No past window caught a recorded event.
                    </TableCell>
                  </TableRow>
                )}
                {v.windows.bnn.map((w) => (
                  <TableRow
                    key={`bnn-${w.matter}-${w.start}`}
                    data-testid="validate-window-bnn"
                  >
                    <TableCell className="whitespace-nowrap">Nadi</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.matterLabel}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      Jupiter in {w.sign},{" "}
                      {w.contact
                        ? `${w.contact} ${w.karaka}`
                        : `${w.fromJeeva}${ordinal(w.fromJeeva)} from the Jeeva`}
                      , {fmtDate(w.start)} to {fmtDate(w.end)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.events.map((e) => (
                        <span key={e.id} className="mr-2">
                          {e.label}, {fmtDate(e.date)}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {v.windows.kp.map((w) => (
                  <TableRow
                    key={`kp-${w.matter}-${w.start}`}
                    data-testid="validate-window-kp"
                  >
                    <TableCell className="whitespace-nowrap">KP</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.matterLabel}
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap"
                      title={`Best antara window scores ${w.score}/${w.max}; ${w.fullAntaras.length} antara${w.fullAntaras.length === 1 ? "" : "s"} whose lord also signifies`}
                    >
                      {w.dasaLord}-{w.bhuktiLord} ({w.verdict}),{" "}
                      {fmtDate(w.start)} to {fmtDate(w.end)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.events.map((e) => (
                        <span key={e.id} className="mr-2">
                          {e.label}, {fmtDate(e.date)}
                          {e.note ? ` (${e.note})` : ""}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
                {v.windows.kpStrict.map((w) => (
                  <TableRow
                    key={`ks-${w.matter}-${w.start}`}
                    data-testid="validate-window-kp-strict"
                  >
                    <TableCell className="whitespace-nowrap">
                      KP strict
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.matterLabel}
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap"
                      title={`Strict reading: significators by the ordered hierarchy of Part 2 p. 151, kept only when deposited in the sub of another significator of the matter. Best antara window scores ${w.score}/${w.max}; ${w.fullAntaras.length} antara${w.fullAntaras.length === 1 ? "" : "s"} whose lord also qualifies`}
                    >
                      {w.dasaLord}-{w.bhuktiLord} ({w.verdict}),{" "}
                      {fmtDate(w.start)} to {fmtDate(w.end)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {w.events.map((e) => (
                        <span key={e.id} className="mr-2">
                          {e.label}, {fmtDate(e.date)}
                          {e.note ? ` (${e.note})` : ""}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3
            className="mt-8 text-base font-semibold"
            data-testid="validate-planets-title"
          >
            How each planet's periods went
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            KP does not call a planet benefic or malefic by name: a planet tied
            to houses 6, 8 or 12 gives harm in its periods and one tied to 2, 3,
            10 or 11 gives gain, whatever its natural character. The expectation
            below is read from the houses each planet signifies; the observation
            is the outcome of the events that fell in its dasa or bhukti (weight
            2) or antara (weight 1). The second expectation reads the same
            houses through their cusps: a planet moves, for each house it
            signifies, only what the sub lord of that house's cusp signifies, so
            its effective portfolio is the union of those deliveries (Part 3 ch.
            5 pp. 27-34; Part 2 ch. 7 pp. 52-54). Where the two expectations
            differ, the events say which the chart follows.
          </p>
          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table className="text-xs" data-testid="validate-planets" cards>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Planet</TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Houses the planet signifies (four-step); 2, 3, 10, 11 favourable and 6, 8, 12 harmful are marked."
                  >
                    Signifies
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="From the houses the planet signifies."
                  >
                    By houses
                  </TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="From what the sub lords of those cusps let the planet deliver (Part 3 ch. 5; Part 2 ch. 7)."
                  >
                    Through cusps
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Ran at</TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Weighted outcomes: favourable / unfavourable / mixed."
                  >
                    Tally
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Observed</TableHead>
                  <TableHead
                    className="whitespace-nowrap"
                    title="Left mark: by houses. Right mark: through the cusps."
                  >
                    Agree
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.planets.map((t) => (
                  <PlanetRow key={t.planet} t={t} fmtDate={fmtDate} />
                ))}
              </TableBody>
            </Table>
          </div>

          <p
            className="mt-4 max-w-3xl text-xs text-muted-foreground"
            data-testid="validate-sources"
          >
            KP period lords and cusp promise: Astro Secrets & KP Part 1, pp.
            167-172; transit of the period lords on the day: Part 2, p. 203; the
            luminaries' transit of a significator's sign, star or sub: Part 2,
            p. 26; planets turned benefic or malefic by their houses: Part 1,
            pp. 17-19 (the four-step significators stand in for "lord of, or in
            the star of the lord of" in the text); the cusp sub lord as the
            limit of what a period lord can give, and its denial when it
            signifies the 12th from the cusp: Part 3, ch. 5, pp. 27-34, and Part
            2, ch. 7, pp. 52-54. Jaimini: <SourceLink source={RAO_SOURCE} />.
            Nadi transit: Jupiter is the timer and Saturn the second hand (R.G.
            Rao, Bhrigu Nandi Nadi; Naik on the female Deha); the karakas are
            the matter's own (Venus or Mars for the spouse, Saturn for work, Sun
            for the father, Rahu for foreign places), contact is by sign, trine
            or the 7th, and the count from the natal Jeeva follows the BNN tab.
            Strong needs 4 of 6. A confirmed verdict needs the cusp promise and
            both dasa and bhukti lords signifying; partial means something
            links; missed means nothing does. Timing windows: a Nadi window is a
            Jupiter passage over the matter's karaka or in its count-signs from
            the Jeeva (R.G. Rao; Naik on the female Deha), the same tests as the
            day score; a KP joint period is the dasa-bhukti of the matter's
            significators (the houses for each matter: Part 3 p. 15; worked
            marriages dated at this level: Part 3 pp. 25, 65), with the antara
            counted separately as the full three-level match and Method I grades
            (Part 2 p. 24) carried on the window, not used to set it aside. The
            strict KP window rereads the same periods through the ordered
            significator hierarchy (Part 2 p. 151: planets in the stars of a
            bhava's occupants first, then the occupants, then the stars of the
            owner, then the owner) and keeps a significator only when deposited
            in the sub of another significator of the matter (the same page;
            stated there for the job houses 2-6-10-11, so its use for every
            matter is provisional). A
            poor score across several events points to the birth time rather
            than to the events: take it to the Rectify tab.
          </p>
        </div>
      )}
    </section>
  );
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
}

function PlanetRow({
  t,
  fmtDate,
}: {
  t: PlanetTally;
  fmtDate: (d: string) => string;
}) {
  const lvl = { dasa: "D", bhukti: "B", antara: "A" } as const;
  return (
    <TableRow data-testid={`validate-planet-${t.planet}`}>
      <TableCell className="whitespace-nowrap">
        <PlanetName planet={t.planet} tone />
      </TableCell>
      <TableCell className="whitespace-nowrap tabular">
        {t.signifies.length === 0 && (
          <span className="text-muted-foreground">none</span>
        )}
        {t.signifies.map((h, i) => (
          <span
            key={h}
            className={cn(
              t.good.includes(h) && "text-verdict-good",
              t.evil.includes(h) && "text-primary",
              !t.good.includes(h) &&
                !t.evil.includes(h) &&
                "text-muted-foreground",
            )}
          >
            {i > 0 ? ", " : ""}
            {h}
          </span>
        ))}
      </TableCell>
      <TableCell>
        <NatureBadge nature={t.expected} />
      </TableCell>
      <TableCell
        className="whitespace-nowrap"
        title={`Delivers ${[...t.goodKept, ...t.evilKept].sort((a, b) => a - b).join(", ") || "none of the marked houses"} through the sub lords of its cusps`}
      >
        <span className="inline-flex items-center gap-1.5">
          <NatureBadge nature={t.expectedByCusp} />
          <span className="tabular text-muted-foreground">
            {t.goodKept.length > 0 && (
              <span className="text-verdict-good">{t.goodKept.join(",")}</span>
            )}
            {t.goodKept.length > 0 && t.evilKept.length > 0 && " "}
            {t.evilKept.length > 0 && (
              <span className="text-primary">{t.evilKept.join(",")}</span>
            )}
          </span>
        </span>
      </TableCell>
      <TableCell className="min-w-[13rem] max-w-[19rem] whitespace-normal leading-5">
        {t.ran.length === 0 && (
          <span className="text-muted-foreground">
            no saved event in its periods
          </span>
        )}
        {t.ran.map((r, i) => (
          <span
            key={`${r.eventId}-${r.level}`}
            title={`${r.level} lord at ${r.label}, ${fmtDate(r.date)} (${OUTCOME_LABEL[r.outcome]})`}
          >
            {i > 0 ? " · " : ""}
            <span className="text-muted-foreground">{lvl[r.level]}</span>{" "}
            {r.label}
          </span>
        ))}
      </TableCell>
      <TableCell
        className="whitespace-nowrap tabular"
        title="favourable / unfavourable / mixed, weighted"
      >
        <span className="text-verdict-good">{t.favourable}</span> /{" "}
        <span className="text-primary">{t.unfavourable}</span> /{" "}
        <span className="text-muted-foreground">{t.mixed}</span>
      </TableCell>
      <TableCell>
        <NatureBadge nature={t.observed} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="inline-flex items-center gap-2">
          {t.agrees === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Mark
              on={t.agrees}
              title={
                t.agrees
                  ? "Behaved as its houses lead KP to expect"
                  : "Behaved against the house expectation"
              }
            />
          )}
          {t.agreesByCusp === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Mark
              on={t.agreesByCusp}
              title={
                t.agreesByCusp
                  ? "Behaved as the cusp sub lords lead KP to expect"
                  : "Behaved against the cusp expectation: a hint that the birth time, or the outcome recorded, wants another look"
              }
            />
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}
