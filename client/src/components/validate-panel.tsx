import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, type Planet } from "@shared/astro";
import type { BnnContact, BnnFit, EventValidation, Nature, PlanetTally, ValidationResult, CuspFilter } from "@shared/validate-types";
import type { TransitCheck } from "@shared/rectify-types";
import type { EventOutcome } from "@shared/events";
import { RAO_SOURCE } from "@shared/jaimini-areas";
import { LifeEventsEditor } from "@/components/life-events";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function Mark({ on, title }: { on: boolean; title?: string }) {
  return <span title={title} className={cn("inline-block h-2.5 w-2.5 rounded-full align-middle", on ? "bg-emerald-500" : "bg-muted-foreground/25")} aria-label={on ? "agrees" : "does not agree"} />;
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-block h-1.5 w-10 overflow-hidden rounded bg-muted">
        <span className="absolute inset-y-0 left-0 rounded bg-foreground" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular text-xs">
        {score}/{max}
      </span>
    </span>
  );
}

const OUTCOME_LABEL: Record<EventOutcome, string> = { favourable: "favourable", unfavourable: "unfavourable", mixed: "mixed" };
const NATURE_LABEL: Record<Nature, string> = { benefic: "benefic", malefic: "malefic", mixed: "mixed", unknown: "no evidence" };

function OutcomeBadge({ outcome }: { outcome: EventOutcome }) {
  return (
    <Badge variant="outline" className={cn("no-default-hover-elevate font-normal", outcome === "favourable" ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400" : outcome === "unfavourable" ? "border-primary/60 text-primary" : "")}>
      {OUTCOME_LABEL[outcome]}
    </Badge>
  );
}

function VerdictBadge({ verdict }: { verdict: EventValidation["kp"]["verdict"] }) {
  return (
    <Badge
      variant={verdict === "confirmed" ? "default" : "outline"}
      className={cn("no-default-hover-elevate font-normal", verdict === "confirmed" ? "bg-emerald-600 text-white hover:bg-emerald-600" : verdict === "missed" ? "border-primary/60 text-primary" : "")}
      data-testid={`validate-verdict-${verdict}`}
    >
      {verdict}
    </Badge>
  );
}

function NatureBadge({ nature }: { nature: Nature }) {
  return (
    <Badge variant="outline" className={cn("no-default-hover-elevate font-normal", nature === "benefic" ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400" : nature === "malefic" ? "border-primary/60 text-primary" : "text-muted-foreground")}>
      {NATURE_LABEL[nature]}
    </Badge>
  );
}

function Lord({ planet, on, houses, role, filtered, effective }: { planet: Planet; on: boolean; houses: number[]; role: string; filtered: CuspFilter[]; effective: boolean }) {
  const diverted = on && !effective;
  const cuspNote = filtered.map((f) => `${f.house}: cusp sub lord ${f.cuspSubLord} signifies ${f.delivers.join(", ") || "nothing"}${f.kept ? "" : f.denied ? " (denied: the 12th from it)" : " (diverted)"}`).join("; ");
  const title = `${role} ${planet}: ${on ? `signifies ${houses.join(", ")}` : "signifies none of the matter's houses"}${on ? `. Through the cusps, ${cuspNote}` : ""}${diverted ? ". Every hit is diverted by its cusp sub lord (Part 3 ch. 5; Part 2 ch. 7)" : ""}`;
  return (
    <span className={cn("inline-flex items-center gap-1", diverted && "line-through decoration-primary/60")} title={title} data-diverted={diverted || undefined}>
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
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={`${t.planet} that day in ${parts.map(([k, p, on]) => `${k} ${p}${on ? " (significator)" : ""}`).join(", ")}`}>
      <span className="text-muted-foreground">{PLANET_ABBR[t.planet]}</span>
      {parts.map(([k, p, on]) => (
        <span key={k} className="inline-flex items-center gap-0.5">
          <Mark on={on} />
          <span className={cn(!on && "text-muted-foreground")}>{PLANET_ABBR[p]}</span>
        </span>
      ))}
    </span>
  );
}

function planetList(ps: Planet[]) {
  return ps.length ? ps.map((p) => PLANET_ABBR[p]).join(" ") : "none";
}

const CONTACT_WORD: Record<BnnContact, string> = { over: "over", trine: "trine", opposite: "opp." };

function NadiCell({ fit }: { fit: BnnFit }) {
  const jLine = `Jupiter in ${fit.jupiterSign}, the ${fit.fromJeeva}${ordinal(fit.fromJeeva)} from natal Jupiter${fit.fromDeha ? ` and the ${fit.fromDeha}${ordinal(fit.fromDeha)} from the Deha` : ""}. With ${planetList(fit.conjunct)}; trine ${planetList(fit.trine)}; opposite ${planetList(fit.opposite)}.`;
  const sLine = `Saturn in ${fit.saturnSign} over ${planetList(fit.saturnOver)}.`;
  const parts = [
    `Karakas: ${planetList(fit.karakas)}.`,
    fit.jupiter ? `Jupiter ${CONTACT_WORD[fit.jupiter.contact]} ${fit.jupiter.planet}: ${fit.jupiter.contact === "over" ? 2 : 1}.` : "Jupiter touches no karaka: 0.",
    fit.saturn ? `Saturn ${CONTACT_WORD[fit.saturn.contact]} ${fit.saturn.planet}: 1.` : "Saturn touches no karaka: 0.",
    fit.double ? "Double transit on a karaka: 1." : "No double transit: 0.",
    fit.progression ? "Count from the Jeeva fits the matter: 1." : "Count from the Jeeva does not fit: 0.",
    fit.combination ? `Combination ripened: ${fit.combination} 1.` : "No combination of this area under Jupiter: 0.",
  ];
  const tone = fit.verdict === "strong" ? "text-emerald-700 dark:text-emerald-400" : fit.verdict === "some" ? "" : "text-muted-foreground";
  return (
    <div className="leading-5" title={[jLine, sLine, ...parts].join("\n")} data-testid={`validate-nadi-${fit.verdict}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Ju</span>
        <span>{fit.jupiterSign.slice(0, 3)}</span>
        <Mark on={fit.jupiter !== null} />
        <span className={cn(!fit.jupiter && "text-muted-foreground")}>{fit.jupiter ? `${CONTACT_WORD[fit.jupiter.contact]} ${PLANET_ABBR[fit.jupiter.planet]}` : `${fit.fromJeeva}${ordinal(fit.fromJeeva)}`}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Sa</span>
        <span>{fit.saturnSign.slice(0, 3)}</span>
        <Mark on={fit.saturn !== null} />
        <span className={cn(!fit.saturn && "text-muted-foreground")}>{fit.saturn ? `${CONTACT_WORD[fit.saturn.contact]} ${PLANET_ABBR[fit.saturn.planet]}` : "—"}</span>
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
    queryKey: ["validate", chart.id, chart.birthDate, chart.birthTime, chart.latitude, chart.longitude, chart.ayanamsa, chart.nodeType, chart.gender, eventsKey],
    queryFn: async () => {
      const { id: _id, ...insert } = chart;
      return (await (await apiRequest("POST", "/api/validate", insert)).json()) as ValidationResult;
    },
    enabled: events.length > 0,
  });
  const v = q.data;
  const zone = chart.timezone;
  const fmtDate = (d: string) => DateTime.fromISO(d, { zone }).toFormat("d LLL yyyy");

  return (
    <section data-testid="validate-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold" data-testid="validate-title">
            Check the chart against what happened
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each saved life event is read back at its date with the birth time as recorded: were the KP period lords significators of the matter and did its cusp promise it, did the Jaimini chara dasha carry the area, and did Jupiter and Saturn touch the matter's Nadi karakas. The
            second table turns the same events round to show how each planet's periods actually went, against what its houses lead KP to expect.
          </p>
        </div>
      </div>

      <div className="mt-4" data-testid="validate-events-editor">
        <p className="mb-1.5 text-xs font-medium">
          Life events <span className="text-muted-foreground">saved with the chart; the tables below follow every change</span>
        </p>
        <LifeEventsEditor chart={chart} />
      </div>

      {events.length === 0 && (
        <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-muted-foreground" data-testid="validate-empty">
          Add at least one dated event to check the chart. Marriage, a child, a job change or a parent's death are the surest anchors, as the date is rarely misremembered.
        </div>
      )}

      {events.length > 0 && q.isLoading && (
        <div className="mt-6 space-y-2" aria-busy="true">
          {events.map((e) => (
            <div key={e.id} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {q.error && (
        <p className="mt-6 text-sm text-primary" data-testid="validate-error">
          Could not check the events: {(q.error as Error).message}
        </p>
      )}

      {v && v.events.length > 0 && (
        <div className="mt-6" data-testid="validate-results">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" data-testid="validate-summary">
            <span>
              <span className="font-medium">{v.summary.events}</span> event{v.summary.events === 1 ? "" : "s"} · lagna {v.lagna.sign} at {chart.birthTime}
            </span>
            <span className="inline-flex items-center gap-1.5">
              KP <ScoreBar score={v.summary.kpScore} max={v.summary.kpMax} />
              <span className="text-muted-foreground">
                {v.summary.confirmed} confirmed, {v.summary.partial} partial, {v.summary.missed} missed
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Transits <ScoreBar score={v.summary.transitScore} max={v.summary.transitMax} />
            </span>
            {v.summary.jaiminiEvents > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Jaimini <ScoreBar score={v.summary.jaiminiScore} max={v.summary.jaiminiMax} />
              </span>
            )}
            <span className="inline-flex items-center gap-1.5" data-testid="validate-summary-nadi">
              Nadi <ScoreBar score={v.summary.bnnScore} max={v.summary.bnnMax} />
              <span className="text-muted-foreground">
                {v.summary.bnnStrong} strong
              </span>
            </span>
            <span className="text-muted-foreground" title="By the houses each planet signifies, then by what the sub lords of those cusps let it deliver.">
              Planets: {v.summary.agree} as expected, {v.summary.conflict} against, by houses; {v.summary.agreeByCusp} and {v.summary.conflictByCusp} through the cusps
              {v.summary.diverted > 0 ? `; ${v.summary.diverted} period-lord ${v.summary.diverted === 1 ? "hit" : "hits"} diverted` : ""}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table className="text-xs [&_td]:px-3 [&_th]:px-3" data-testid="validate-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Event</TableHead>
                  <TableHead className="whitespace-nowrap" title="Dasa, bhukti and antara lords running that day; a green mark means the lord signifies one of the matter's houses (four-step). A struck-through lord signifies the matter but the sub lords of those cusps carry it elsewhere (Part 3 ch. 5; Part 2 ch. 7).">
                    KP period lords
                  </TableHead>
                  <TableHead className="whitespace-nowrap" title="Sub lord of the matter's cusp; green when it signifies one of the matter's houses, so the matter is promised.">
                    Cusp
                  </TableHead>
                  <TableHead className="whitespace-nowrap" title="Sign, star and sub the dasa and bhukti lords transited that day; green where the lord is a significator of the matter.">
                    Transit
                  </TableHead>
                  <TableHead className="whitespace-nowrap" title="Chara dasha and antardasha signs running that day and whether each carries the matter's life area (K.N. Rao).">
                    Jaimini
                  </TableHead>
                  <TableHead className="whitespace-nowrap" title="Nadi timing, six points: Jupiter over the matter's karaka (2; trine or opposite 1), Saturn touching a karaka (1), both on the same karaka (1), Jupiter's count from the Jeeva in the matter's signs (1), a natal combination of the area under the passage (1).">
                    Nadi transit
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
                      <div className="tabular whitespace-nowrap text-muted-foreground" title={`Houses of the matter: ${e.houses.join(", ")}; cusp ${e.cusp}`}>
                        {fmtDate(e.date)} · age {e.age}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Lord planet={e.kp.dasa} on={e.kp.hits[0]} houses={e.kp.signified[0]} role="Dasa" filtered={e.kp.filtered[0]} effective={e.kp.effective[0]} />
                        <Lord planet={e.kp.bhukti} on={e.kp.hits[1]} houses={e.kp.signified[1]} role="Bhukti" filtered={e.kp.filtered[1]} effective={e.kp.effective[1]} />
                        <Lord planet={e.kp.antara} on={e.kp.hits[2]} houses={e.kp.signified[2]} role="Antara" filtered={e.kp.filtered[2]} effective={e.kp.effective[2]} />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1" title={`Cusp ${e.cusp} sub lord ${e.kp.cuspSubLord}: ${e.kp.promised ? `signifies ${e.kp.cuspSignified.join(", ")}` : e.kp.deniedAtCusp ? `signifies none of the matter's houses and does signify the 12th from the cusp: the matter is denied even in a fitting period (Part 3 ch. 5 p. 28)` : "signifies none of the matter's houses"}`} data-denied={e.kp.deniedAtCusp || undefined}>
                        <Mark on={e.kp.promised} />
                        <span className="text-muted-foreground">{e.cusp}</span>
                        <PlanetName planet={e.kp.cuspSubLord} abbr tone />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <Transit t={e.kp.transit.dasa} />
                        <Transit t={e.kp.transit.bhukti} />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.jaimini ? (
                        <span className="inline-flex items-center gap-1.5" title={[`Mahadasha ${e.jaimini.mdSignName}: ${e.jaimini.md.triggers.join("; ") || "no trigger"}`, `Antardasha ${e.jaimini.adSignName}: ${e.jaimini.ad.triggers.join("; ") || "no trigger"}`].join("\n")}>
                          <Mark on={e.jaimini.md.hot} />
                          <span className={cn(!e.jaimini.md.hot && "text-muted-foreground")}>{e.jaimini.mdSignName.slice(0, 3)}</span>
                          <span className="text-muted-foreground">/</span>
                          <Mark on={e.jaimini.ad.hot} />
                          <span className={cn(!e.jaimini.ad.hot && "text-muted-foreground")}>{e.jaimini.adSignName.slice(0, 3)}</span>
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
                    <TableCell>
                      <VerdictBadge verdict={e.kp.verdict} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3 className="mt-8 text-base font-semibold" data-testid="validate-planets-title">
            How each planet's periods went
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            KP does not call a planet benefic or malefic by name: a planet tied to houses 6, 8 or 12 gives harm in its periods and one tied to 2, 3, 10 or 11 gives gain, whatever its natural character. The expectation below is read from the houses each
            planet signifies; the observation is the outcome of the events that fell in its dasa or bhukti (weight 2) or antara (weight 1). The second expectation reads the same houses through their cusps: a planet moves, for each house it signifies, only what the sub lord of that
            house's cusp signifies, so its effective portfolio is the union of those deliveries (Part 3 ch. 5 pp. 27-34; Part 2 ch. 7 pp. 52-54). Where the two expectations differ, the events say which the chart follows.
          </p>
          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table className="text-xs" data-testid="validate-planets">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Planet</TableHead>
                  <TableHead className="whitespace-nowrap" title="Houses the planet signifies (four-step); 2, 3, 10, 11 favourable and 6, 8, 12 harmful are marked.">
                    Signifies
                  </TableHead>
                  <TableHead className="whitespace-nowrap" title="From the houses the planet signifies.">By houses</TableHead>
                  <TableHead className="whitespace-nowrap" title="From what the sub lords of those cusps let the planet deliver (Part 3 ch. 5; Part 2 ch. 7).">
                    Through cusps
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Ran at</TableHead>
                  <TableHead className="whitespace-nowrap" title="Weighted outcomes: favourable / unfavourable / mixed.">
                    Tally
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Observed</TableHead>
                  <TableHead className="whitespace-nowrap" title="Left mark: by houses. Right mark: through the cusps.">Agree</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.planets.map((t) => (
                  <PlanetRow key={t.planet} t={t} fmtDate={fmtDate} />
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="mt-4 max-w-3xl text-xs text-muted-foreground" data-testid="validate-sources">
            KP period lords and cusp promise: Astro Secrets & KP Part 1, pp. 167-172; transit of the period lords on the day: Part 2, p. 203; planets turned benefic or malefic by their houses: Part 1, pp. 17-19 (the four-step significators stand in for
            "lord of, or in the star of the lord of" in the text); the cusp sub lord as the limit of what a period lord can give, and its denial when it signifies the 12th from the cusp: Part 3, ch. 5, pp. 27-34, and Part 2, ch. 7, pp. 52-54. Jaimini: <SourceLink source={RAO_SOURCE} />. Nadi transit: Jupiter is the timer and Saturn the second hand (R.G. Rao, Bhrigu Nandi Nadi; Naik on the female Deha); the karakas are the matter's own (Venus or Mars for the spouse, Saturn for work, Sun for the father, Rahu for foreign places), contact is by sign, trine or the 7th, and the count from the natal Jeeva follows the BNN tab. Strong needs 4 of 6. A confirmed verdict needs the cusp promise and
            both dasa and bhukti lords signifying; partial means something links; missed means nothing does. A poor score across several events points to the birth time rather than to the events: take it to the Rectify tab.
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

function PlanetRow({ t, fmtDate }: { t: PlanetTally; fmtDate: (d: string) => string }) {
  const lvl = { dasa: "D", bhukti: "B", antara: "A" } as const;
  return (
    <TableRow data-testid={`validate-planet-${t.planet}`}>
      <TableCell className="whitespace-nowrap">
        <PlanetName planet={t.planet} tone />
      </TableCell>
      <TableCell className="whitespace-nowrap tabular">
        {t.signifies.length === 0 && <span className="text-muted-foreground">none</span>}
        {t.signifies.map((h, i) => (
          <span key={h} className={cn(t.good.includes(h) && "text-emerald-700 dark:text-emerald-400", t.evil.includes(h) && "text-primary", !t.good.includes(h) && !t.evil.includes(h) && "text-muted-foreground")}>
            {i > 0 ? ", " : ""}
            {h}
          </span>
        ))}
      </TableCell>
      <TableCell>
        <NatureBadge nature={t.expected} />
      </TableCell>
      <TableCell className="whitespace-nowrap" title={`Delivers ${[...t.goodKept, ...t.evilKept].sort((a, b) => a - b).join(", ") || "none of the marked houses"} through the sub lords of its cusps`}>
        <span className="inline-flex items-center gap-1.5">
          <NatureBadge nature={t.expectedByCusp} />
          <span className="tabular text-muted-foreground">
            {t.goodKept.length > 0 && <span className="text-emerald-700 dark:text-emerald-400">{t.goodKept.join(",")}</span>}
            {t.goodKept.length > 0 && t.evilKept.length > 0 && " "}
            {t.evilKept.length > 0 && <span className="text-primary">{t.evilKept.join(",")}</span>}
          </span>
        </span>
      </TableCell>
      <TableCell className="min-w-[13rem] max-w-[19rem] whitespace-normal leading-5">
        {t.ran.length === 0 && <span className="text-muted-foreground">no saved event in its periods</span>}
        {t.ran.map((r, i) => (
          <span key={`${r.eventId}-${r.level}`} title={`${r.level} lord at ${r.label}, ${fmtDate(r.date)} (${OUTCOME_LABEL[r.outcome]})`}>
            {i > 0 ? " · " : ""}
            <span className="text-muted-foreground">{lvl[r.level]}</span> {r.label}
          </span>
        ))}
      </TableCell>
      <TableCell className="whitespace-nowrap tabular" title="favourable / unfavourable / mixed, weighted">
        <span className="text-emerald-700 dark:text-emerald-400">{t.favourable}</span> / <span className="text-primary">{t.unfavourable}</span> / <span className="text-muted-foreground">{t.mixed}</span>
      </TableCell>
      <TableCell>
        <NatureBadge nature={t.observed} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="inline-flex items-center gap-2">
          {t.agrees === null ? <span className="text-muted-foreground">—</span> : <Mark on={t.agrees} title={t.agrees ? "Behaved as its houses lead KP to expect" : "Behaved against the house expectation"} />}
          {t.agreesByCusp === null ? <span className="text-muted-foreground">—</span> : <Mark on={t.agreesByCusp} title={t.agreesByCusp ? "Behaved as the cusp sub lords lead KP to expect" : "Behaved against the cusp expectation: a hint that the birth time, or the outcome recorded, wants another look"} />}
        </span>
      </TableCell>
    </TableRow>
  );
}
