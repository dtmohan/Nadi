import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, type Planet } from "@shared/astro";
import type { EventValidation, Nature, PlanetTally, ValidationResult } from "@shared/validate-types";
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

function Lord({ planet, on, houses, role }: { planet: Planet; on: boolean; houses: number[]; role: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${role} ${planet}: ${on ? `signifies ${houses.join(", ")}` : "signifies none of the matter's houses"}`}>
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

export function ValidatePanel({ result }: { result: ChartResult }) {
  const { chart } = result;
  const events = chart.events ?? [];
  const eventsKey = JSON.stringify(events);
  const q = useQuery<ValidationResult>({
    queryKey: ["validate", chart.id, chart.birthDate, chart.birthTime, chart.latitude, chart.longitude, chart.ayanamsa, chart.nodeType, eventsKey],
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
            Each saved life event is read back at its date with the birth time as recorded: were the KP period lords significators of the matter and did its cusp promise it, did the Jaimini chara dasha carry the area, and where was Jupiter. The
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
            <span className="text-muted-foreground">
              Planets: {v.summary.agree} as expected, {v.summary.conflict} against expectation
            </span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table className="text-xs [&_td]:px-3 [&_th]:px-3" data-testid="validate-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Event</TableHead>
                  <TableHead className="whitespace-nowrap" title="Dasa, bhukti and antara lords running that day; a green mark means the lord signifies one of the matter's houses (four-step).">
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
                  <TableHead className="whitespace-nowrap" title="Jupiter's transit sign that day, which sign it is counted from natal Jupiter (the Jeeva), and the natal planets in it.">
                    Jupiter · from Jeeva
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
                        <Lord planet={e.kp.dasa} on={e.kp.hits[0]} houses={e.kp.signified[0]} role="Dasa" />
                        <Lord planet={e.kp.bhukti} on={e.kp.hits[1]} houses={e.kp.signified[1]} role="Bhukti" />
                        <Lord planet={e.kp.antara} on={e.kp.hits[2]} houses={e.kp.signified[2]} role="Antara" />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1" title={`Cusp ${e.cusp} sub lord ${e.kp.cuspSubLord}: ${e.kp.promised ? `signifies ${e.kp.cuspSignified.join(", ")}` : "signifies none of the matter's houses"}`}>
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
                      <span title={`Jupiter in ${e.bnn.jupiterSign}, the ${e.bnn.fromJeeva}${ordinal(e.bnn.fromJeeva)} sign from natal Jupiter. With ${planetList(e.bnn.conjunct)}; trine ${planetList(e.bnn.trine)}; opposite ${planetList(e.bnn.opposite)}. Saturn in ${e.bnn.saturnSign} over ${planetList(e.bnn.saturnOver)}.`}>
                        {e.bnn.jupiterSign.slice(0, 3)}{" "}
                        <span className="text-muted-foreground">
                          {e.bnn.fromJeeva}
                          {ordinal(e.bnn.fromJeeva)}
                        </span>
                        {e.bnn.conjunct.length > 0 && <span className="ml-1">· {planetList(e.bnn.conjunct)}</span>}
                      </span>
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
            planet signifies; the observation is the outcome of the events that fell in its dasa or bhukti (weight 2) or antara (weight 1).
          </p>
          <div className="mt-3 overflow-x-auto rounded-md border">
            <Table className="text-xs" data-testid="validate-planets">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Planet</TableHead>
                  <TableHead className="whitespace-nowrap" title="Houses the planet signifies (four-step); 2, 3, 10, 11 favourable and 6, 8, 12 harmful are marked.">
                    Signifies
                  </TableHead>
                  <TableHead className="whitespace-nowrap">KP expects</TableHead>
                  <TableHead className="whitespace-nowrap">Ran at</TableHead>
                  <TableHead className="whitespace-nowrap" title="Weighted outcomes: favourable / unfavourable / mixed.">
                    Tally
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Observed</TableHead>
                  <TableHead className="whitespace-nowrap">Agree</TableHead>
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
            "lord of, or in the star of the lord of" in the text). Jaimini: <SourceLink source={RAO_SOURCE} />. Jupiter's transit is the Nadi timer; it is shown for the reader to weigh and is not scored. A confirmed verdict needs the cusp promise and
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
      <TableCell className="max-w-[18rem]">
        {t.ran.length === 0 && <span className="text-muted-foreground">no saved event in its periods</span>}
        {t.ran.map((r, i) => (
          <span key={`${r.eventId}-${r.level}`} title={`${r.level} lord at ${r.label}, ${fmtDate(r.date)} (${OUTCOME_LABEL[r.outcome]})`} className="whitespace-nowrap">
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
      <TableCell>
        {t.agrees === null ? <span className="text-muted-foreground">—</span> : <Mark on={t.agrees} title={t.agrees ? "Behaved as its houses lead KP to expect" : "Behaved against expectation: a hint that the birth time, or the outcome recorded, wants another look"} />}
      </TableCell>
    </TableRow>
  );
}
