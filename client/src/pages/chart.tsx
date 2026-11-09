import { displayLocal } from "@shared/time-basis";
import { LocalizedText, useLocale, useT } from "@/lib/i18n";
import { DeceasedProvider } from "@/components/mode-text";
import { bnnGradeNoteMalayalam } from "@shared/malayalam-bnn-grade-note";
import { Soft } from "@/lib/gentle";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEventHandler, type ReactNode } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileDown,
  Orbit,
  Compass,
  Footprints,
  Crosshair,
  BookOpen,
  Clock,
  CheckCheck,
  CalendarDays,
  FileText,
  HelpCircle,
} from "lucide-react";
import type { ChartResult } from "@shared/schema";
import type { ChartEvent } from "@shared/events";
import { TopicReadingPanel, type TopicReadingSystem } from "@/components/topic-reading";
import { ReferenceChart } from "@/components/reference-chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopicThemes } from "@/components/topic-themes";
import { natalPlanetContext } from "@shared/planet-context";
import { sensitiveTags } from "@shared/life-stage";
import {
  PLANETS,
  PLANET_ABBR,
  SIGNS,
  SIGN_LORD,
  fmtDeg,
  fmtDegShort,
  houseFrom,
  type Planet,
  type PlanetPosition,
  KARAKA,
} from "@shared/astro";
import {
  DIRECTION_SOURCE,
  directionClause,
  flowGloss,
  givesOf,
  receivesOf,
  tierLabel,
  approachLabel,
  type DegreeChain,
} from "@shared/flow";
import {
  DIRECTION_NOTE,
  GRADE_DOTS,
  GRADE_LABEL,
  GRADE_NOTE,
  gradeReasons,
} from "@shared/grade";
import {
  nextMarriageWindow,
  lastMarriageWindow,
  type Gender,
  type MarriageReading,
} from "@shared/marriage";
import {
  nextChildWindow,
  lastChildWindow,
  type ChildrenReading,
} from "@shared/children";
import { type LakshmiReading } from "@shared/lakshmi";
import { type NakshatraWealthReading, NAKSHATRA_WEALTH_THEMES } from "@shared/nakshatra-wealth";
import { vimshottari, type KpPeriod } from "@shared/kp";
import {
  calendarAge,
  areaSeason,
  lifeStage,
  seasonStart,
  STAGE_LABEL,
  type AreaSeason,
  lifeAsOf,
  isDeceased,
  lifePeriods,
  periodStateLabel,
} from "@shared/life-stage";
import {
  LIFE_AREAS,
  RELATION_LABEL,
  areaKarakaLabel,
  bandSentence,
  type Finding,
  type LifeArea,
  type PairRelation,
  type Reading as BnnReading,
} from "@shared/rules";
import {
  synthesize,
  toneOf,
  gist,
  firstClause,
  AREA_TONE_LABEL,
  type AreaSynthesis,
  type AreaTone,
} from "@shared/synthesis";
import { areaWord, nadiAreasClauses } from "@shared/life-areas";
import {
  VerdictCard,
  type VerdictSignature,
  type VerdictTiming,
} from "@/components/verdict-card";
import { Term } from "@/components/term";
import { Working, ReadingModeToggle } from "@/components/working";
import {
  Chapter,
  ChapterMemoryProvider,
  Chapters,
  type ChapterDef,
} from "@/components/chapters";
import { useReadingMode } from "@/lib/reading-mode";
import { downloadReportPdf } from "@/lib/report-pdf";
import type { RectifyExportState } from "@shared/rectify-methods";
import type { PlanetStrength } from "@shared/strength";
import {
  housesFrom,
  retroNotes,
  HOUSE_CLASS_LABEL,
  type HouseClass,
} from "@shared/houses";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { useChartLayout } from "@/components/chart-focus";
import { PlanetName, planetColor } from "@/components/planet-name";
import { ChartSettings } from "@/components/chart-settings";
import { OverviewPanel } from "@/components/overview-panel";
import { JaiminiPanel } from "@/components/jaimini-panel";
import { AlpPanel } from "@/components/alp-panel";
import { KpPanel } from "@/components/kp-panel";
import { ParashariPanel } from "@/components/parashari-panel";
import { RectifyPanel } from "@/components/rectify-panel";
import { LifeEventsSection } from "@/components/life-events";
import { AgreementPanel } from "@/components/agreement-panel";
import { plainTopicNatal } from "@shared/topic-brief";
import { BirthTimeEditor } from "@/components/birth-time-editor";
import { ValidatePanel } from "@/components/validate-panel";
import { PanchangaPanel } from "@/components/panchanga-panel";
import { PrasnaPanel } from "@/components/prasna-panel";
import { Timeline, BnnLifeTimeline } from "@/components/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cite } from "@/components/source-link";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { chartsStore } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";

const CLASSICAL = new Set<Planet>([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
]);

function PlanetTable({
  positions,
  strength,
  selected,
  onSelect,
}: {
  positions: PlanetPosition[];
  strength: PlanetStrength[];
  selected: Planet | null;
  onSelect: (p: Planet | null) => void;
}) {
  const stOf = (p: Planet) => strength.find((x) => x.planet === p);
  return (
    <Table className="tabular" cards>
      <TableHeader>
        <TableRow>
          <TableHead>Planet</TableHead>
          <TableHead>Sign</TableHead>
          <TableHead className="text-right">Degree</TableHead>
          <TableHead className="hidden sm:table-cell">Nakshatra</TableHead>
          <TableHead className="hidden md:table-cell">Dignity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((p) => (
          <TableRow
            key={p.planet}
            onClick={() => onSelect(selected === p.planet ? null : p.planet)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(selected === p.planet ? null : p.planet);
              }
            }}
            tabIndex={0}
            aria-selected={selected === p.planet}
            className={cn(
              "cursor-pointer",
              selected === p.planet && "bg-primary/10",
            )}
            data-testid={`row-planet-${p.planet}`}
          >
            <TableCell className="whitespace-nowrap py-2">
              <PlanetName planet={p.planet} tone className="font-medium" />
              {p.retrograde && CLASSICAL.has(p.planet) && (
                <span
                  className="ml-1.5 text-xs text-muted-foreground"
                  title="Retrograde"
                >
                  ℞
                </span>
              )}
              {p.combust && (
                <span
                  className={cn(
                    "ml-1.5 text-xs",
                    stOf(p.planet)?.effectiveCombust
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                  title={
                    stOf(p.planet)?.notes.find((n) =>
                      n.startsWith("Combust"),
                    ) ?? "Combust (within the Sun's pada)"
                  }
                >
                  c
                </span>
              )}
              {!!stOf(p.planet)?.winningOver.length && (
                <span
                  className="ml-1.5 text-xs text-muted-foreground"
                  title={`Leads ${stOf(p.planet)!.winningOver.join(", ")} by degree`}
                >
                  w
                </span>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap py-2">{p.sign}</TableCell>
            <TableCell className="py-2 text-right text-muted-foreground">
              {fmtDeg(p.lon)}
            </TableCell>
            <TableCell className="hidden whitespace-nowrap py-2 sm:table-cell">
              {p.nakshatra}{" "}
              <span className="text-muted-foreground">{p.pada}</span>
            </TableCell>
            <TableCell
              className="hidden py-2 text-muted-foreground md:table-cell"
              title={stOf(p.planet)?.dignityNote ?? undefined}
            >
              {stOf(p.planet) &&
              stOf(p.planet)!.effectiveDignity !== p.dignity ? (
                <span>
                  <span className="line-through decoration-muted-foreground/60">
                    {p.dignity}
                  </span>
                  <span className="ml-1.5 text-xs">set aside</span>
                </span>
              ) : (
                p.dignity
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KarakaCard({
  title,
  planet,
  data,
  positions,
  tone,
}: {
  title: string;
  planet: Planet;
  data: ChartResult["reading"]["jeeva"];
  positions: PlanetPosition[];
  tone: "jeeva" | "karma" | "deha";
}) {
  const p = positions.find((x) => x.planet === planet)!;
  return (
    <Card data-testid={`card-${tone}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span style={{ color: planetColor(planet) }}>{planet}</span> ·{" "}
            {title}
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {p.sign} {fmtDeg(p.lon)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(tone === "deha"
            ? ["her person", "body", "charm", "comforts", "arts", "finance"]
            : KARAKA[planet].significations
          ).map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="no-default-hover-elevate font-normal"
            >
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** A planet-centred view of the same gated Nadi findings used by the life-area reading. */
function BnnPlanetExplanations({ result }: { result: ChartResult }) {
  const { positions, reading, chart } = result;
  const context = useMemo(() => natalPlanetContext(result), [result]);
  const views = useMemo(() => positions.map((p) => {
    const findings = reading.findings.filter((f) => f.planets.includes(p.planet));
    const areas = synthesize(reading, chart.gender as Gender, findings)
      .filter((a) => a.area !== "health" && a.area !== "children" && areaSeason(a.area, result.utc, result.now.asOf, result.chart).inSeason)
      .map((a) => ({ area: a.area, topic: plainTopicNatal(a.area, a, reading) }))
      .filter((a) => a.topic.details?.length);
    return { p, areas };
  }), [positions, reading, chart, result.utc, result.now.asOf]);
  return <section data-testid="bnn-planet-explanations">
    <h3 className="text-base font-semibold">Your planets, one by one</h3>
    <p className="mt-1 text-xs text-muted-foreground">These are Bhrigu Nandi Nadi significators and evaluated planet-to-planet rules. The same planet can take part in different subjects; the selected themes below are possibilities, with their individual source connections.{(chart.timeUncertaintyMin ?? 0) > 0 && ` A stated ±${chart.timeUncertaintyMin}-minute birth-time range can affect positions near a boundary.`}</p>
    <div className="mt-2 divide-y rounded-md border">{views.map(({ p, areas }) => {
      const fact = context.planet(p.planet);
      const matters = KARAKA[p.planet].significations.filter((s) => !sensitiveTags(s).length).slice(0, 3);
      return <details key={p.planet} className="px-3 py-2" data-testid={`bnn-planet-explanation-${p.planet}`}>
        <summary className="cursor-pointer text-sm font-medium">{p.planet} · {p.sign} · {p.nakshatra}, quarter {p.pada}</summary>
        <div className="mt-2 space-y-2 text-xs leading-relaxed">
          <p>In Nadi, {p.planet} is associated with {matters.join(", ")}. Here it is in {p.sign}, whose ruler is {SIGN_LORD[p.signIndex]}; its star lord is {fact?.nakshatra.starLord ?? "not available"}. These are different roles, not a prediction by themselves.</p>
          {areas.map(({ area, topic }) => <div key={area}><p className="font-medium">{LIFE_AREAS[area].label}</p><TopicThemes topic={topic} /></div>)}
          {!areas.length && <p className="text-muted-foreground">No additional non-sensitive life-area theme is selected for this planet here. Its detailed findings remain in the relevant life-area view.</p>}
        </div>
      </details>;
    })}</div>
  </section>;
}

const PROMISE_LABEL: Record<MarriageReading["promised"], string> = {
  strong: "Promised, strong",
  moderate: "Promised, half strength",
  weak: "Promised, lesser strength",
  "by-karma": "Promised through Saturn",
  "through-dispositor": "Indirect, via dispositor",
  absent: "No structural signature",
};

function MarriageCard({
  m,
  positions,
  transits,
  asOf,
  birthIso,
  chart,
}: {
  m: MarriageReading;
  positions: PlanetPosition[];
  transits: ChartResult["transits"];
  asOf: string;
  birthIso: string;
  chart: ChartResult["chart"];
}) {
  const sp = positions.find((x) => x.planet === m.spouse)!;
  const win = nextMarriageWindow(
    m,
    transits,
    seasonStart("marriage", birthIso, asOf, chart),
  );
  const lastWin = lastMarriageWindow(m, transits, asOf, birthIso);
  const gender =
    m.gender === "female"
      ? "female chart"
      : m.gender === "male"
        ? "male chart"
        : "gender not set, read as male";
  return (
    <Card data-testid="card-marriage">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span style={{ color: planetColor(m.spouse) }}>{m.spouse}</span> ·
            Kalatra karaka · marriage
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {sp.sign} {fmtDeg(sp.lon)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {gender}: {m.native} is the native
          {m.gender === "female" ? " as a person (Deha)" : ""}, {m.spouse} the{" "}
          {m.gender === "female"
            ? "husband"
            : m.gender === "male"
              ? "wife"
              : "spouse"}
          . No house lords; the two karakas are read against each other.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge
            variant="secondary"
            className="no-default-hover-elevate mr-1.5 font-normal"
            data-testid="badge-marriage-promise"
          >
            {PROMISE_LABEL[m.promised]}
          </Badge>
          <Soft>{m.headline}</Soft>
        </p>
        {m.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
            {m.notes.map((n) => (
              <li key={n}>
                <Soft>{n}</Soft>
              </li>
            ))}
          </ul>
        )}
        <p
          className="mt-3 text-xs text-muted-foreground"
          data-testid="text-marriage-window"
        >
          Triggers: Jupiter over {m.spouseSign} (full) or its trines{" "}
          {m.triggerSigns.slice(1).join(", ")} (three-quarter).
          {lastWin
            ? ` Last: Jupiter ${lastWin.kind === "over" ? "over" : "in trine from"} ${lastWin.period.sign}, ${DateTime.fromISO(lastWin.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(lastWin.period.end).toFormat("LLL yyyy")} (passed).`
            : ""}
          {win
            ? ` Next${!areaSeason("marriage", birthIso, asOf, chart).inSeason ? " (from age 18, provisional onset)" : ""}: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}

const CHILD_PROMISE_LABEL: Record<ChildrenReading["promised"], string> = {
  strong: "Prominent Jupiter–Venus link",
  moderate: "Jupiter–Venus opposition",
  weak: "Less prominent link",
  faint: "More distant link",
  unsigned: "No link in this rule",
};

function ChildrenCard({
  c,
  positions,
  transits,
  asOf,
  birthIso,
}: {
  c: ChildrenReading;
  positions: PlanetPosition[];
  transits: ChartResult["transits"];
  asOf: string;
  birthIso: string;
}) {
  const ju = positions.find((x) => x.planet === "Jupiter")!;
  const win = nextChildWindow(c, transits, asOf.slice(0, 10), birthIso);
  const lastWin2 = lastChildWindow(c, transits, asOf.slice(0, 10), birthIso);
  const counted = c.inFifth.length + c.aspectingFifth.length;
  return (
    <Card data-testid="card-children">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span style={{ color: planetColor("Jupiter") }}>Jupiter</span> ·
            Putra karaka · children
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            5th from Jupiter: {c.fifthSign}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This Nadi reading uses Jupiter, its link with Venus, and the fifth
          sign from Jupiter ({ju.sign} → {c.fifthSign}). These are traditional
          interpretations; they do not determine fertility, a child's sex or
          the number of children.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge
            variant="secondary"
            className="no-default-hover-elevate mr-1.5 font-normal"
            data-testid="badge-children-promise"
          >
            {CHILD_PROMISE_LABEL[c.promised]}
          </Badge>
          <Soft>{c.headline}</Soft>
        </p>
        {counted > 0 && (
          <p
            className="mt-2 text-sm leading-relaxed"
            data-testid="text-children-count"
          >
            {counted} planet{counted === 1 ? " is" : "s are"} in or aspecting
            the fifth from Jupiter. This count is a chart observation, not an
            estimate of family size.
          </p>
        )}
        {c.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
            {c.notes.map((n) => (
              <li key={n}>
                <Soft>{n}</Soft>
              </li>
            ))}
          </ul>
        )}
        <p
          className="mt-3 text-xs text-muted-foreground"
          data-testid="text-children-window"
        >
          Traditional windows (not event predictions): Jupiter's return over {c.karakaSign}, or his passage over{" "}
          {c.fifthSign} and its trine{" "}
          {c.triggerSigns
            .filter((x) => x !== c.karakaSign && x !== c.fifthSign)
            .join(", ")}
          .
          {lastWin2
            ? ` Last (from age 18): Jupiter ${lastWin2.kind === "return" ? "returns to" : lastWin2.kind === "fifth" ? "over the 5th," : "in trine,"} ${lastWin2.period.sign}, ${DateTime.fromISO(lastWin2.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(lastWin2.period.end).toFormat("LLL yyyy")} (passed).`
            : ""}
          {win
            ? ` Next (from age 18): Jupiter ${win.kind === "return" ? "returns to" : win.kind === "fifth" ? "over the 5th," : "in trine,"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function LakshmiCard({
  l,
  positions,
  asOf,
  deceased,
  birthIso,
}: {
  l: LakshmiReading;
  positions: PlanetPosition[];
  /** The reading date, or the recorded date of passing when that is earlier. */
  asOf: string;
  deceased: boolean;
  birthIso: string;
}) {
  const moon = positions.find((x) => x.planet === "Moon")!;
  // After a date of passing, mahadashas that begin later are dropped: nothing is read as a forecast.
  let dasas: KpPeriod[] = [];
  try {
    dasas = lifePeriods(
      vimshottari(moon.lon, birthIso, asOf).dasas,
      asOf,
      deceased,
    );
  } catch {
    dasas = [];
  }
  const dasaOf = (planet: Planet): KpPeriod | undefined =>
    dasas.find((d) => d.lord === planet);
  return (
    <Card data-testid="card-lakshmi">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span style={{ color: planetColor("Venus") }}>Venus</span> ·
            Lakshmi lagna · wealth
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            Venus in {l.venusSign}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Venus is Lakshmi. Taking her as lagna, each planet standing in set
          houses from her promises one of her eight forms, and each form ripens
          in that planet's mahadasha (DNA Astrology of Wealth, pp. 53-91; the
          timing from case 1, p. 173).
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge
            variant="secondary"
            className="no-default-hover-elevate mr-1.5 font-normal"
            data-testid="badge-lakshmi-count"
          >
            {l.forms.length} of 8 forms
          </Badge>
          <Soft>{l.headline}</Soft>
        </p>
        {l.forms.length > 0 && (
          <ul
            className="mt-2 space-y-1.5 text-sm leading-relaxed"
            data-testid="list-lakshmi-forms"
          >
            {l.forms.map((f) => {
              const d = dasaOf(f.planet);
              const state = d ? periodStateLabel(d, asOf, deceased) : "";
              return (
                <li key={f.planet} className="text-muted-foreground">
                  <span style={{ color: planetColor(f.planet) }}>
                    {f.planet}
                  </span>{" "}
                  in the {ordinal(f.house)} from Venus —{" "}
                  <span className="text-foreground">{f.form}</span>: {f.domain}
                  .
                  {d
                    ? ` Mahadasha ${DateTime.fromISO(d.start).toFormat("yyyy")}–${DateTime.fromISO(d.end).toFormat("yyyy")}${state}.`
                    : ""}
                  {f.via === "case-study"
                    ? " Read in the book's case studies, beyond the chapter diagrams."
                    : ""}
                </li>
              );
            })}
          </ul>
        )}
        {l.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            {l.notes.map((n) => (
              <li key={n}>
                <Soft>{n}</Soft>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function NakshatraWealthCard({ nw }: { nw: NakshatraWealthReading }) {
  const theme = (nak: string) =>
    (NAKSHATRA_WEALTH_THEMES as Record<string, string>)[nak] ?? "";
  return (
    <Card data-testid="card-nakshatra-wealth">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            Wealth nakshatras · the twenty stars
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            Lagna in {nw.lagnaNakshatra ?? "—"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The book's twenty "important nakshatras of wealth" each carry their
          own rule lists: a planet (or the lagna) in the star, conditioned on
          the house class it occupies (wealth 2/5/9/11, Kendra 1/4/7/10, Trikon
          1/5/9). (DNA Astrology of Wealth, pp. 96-169.)
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge
            variant="secondary"
            className="no-default-hover-elevate mr-1.5 font-normal"
            data-testid="badge-nakshatra-wealth-count"
          >
            {nw.hits.length} rule{nw.hits.length === 1 ? "" : "s"}
          </Badge>
          <Soft>{nw.headline}</Soft>
        </p>
        {nw.hits.length > 0 && (
          <ul
            className="mt-2 space-y-1.5 text-sm leading-relaxed"
            data-testid="list-nakshatra-wealth"
          >
            {nw.hits.map((h) => (
              <li
                key={`${h.nakshatra}-${h.planet}-${h.conjunctWith ?? ""}`}
                className="text-muted-foreground"
              >
                {h.text}{" "}
                {theme(h.nakshatra)
                  ? `${h.nakshatra} — ${theme(h.nakshatra)}`
                  : h.nakshatra}{" "}
                ({h.pages.replace("DNA Astrology of Wealth, ", "")})
              </li>
            ))}
          </ul>
        )}
        {nw.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            {nw.notes.map((n) => (
              <li key={n}>
                <Soft>{n}</Soft>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Enhanced 3, full 2, reduced 1, cancelled none; older saved results without a grade fall back to the score. */
function GradeDots({ f }: { f: Finding }) {
  const n = f.grade
    ? GRADE_DOTS[f.grade.level]
    : Math.max(1, Math.min(3, Math.round(f.score)));
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={
        f.grade
          ? `grade: ${GRADE_LABEL[f.grade.level].toLowerCase()}`
          : `strength ${n} of 3`
      }
      title={f.grade ? GRADE_LABEL[f.grade.level] : undefined}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= n ? "bg-foreground" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

const TONE_CLASS: Record<AreaTone, string> = {
  supportive: "border-verdict-good/40 text-verdict-good",
  mixed: "border-verdict-mixed/40 text-verdict-mixed",
  care: "border-verdict-bad/40 text-verdict-bad",
  contested: "border-dashed border-verdict-mixed/60 text-verdict-mixed",
  descriptive: "border-border text-muted-foreground",
  quiet: "border-border text-muted-foreground",
};

/** Relation of each companion to the subject, so "Saturn · Mercury · Rahu" says which is conjunct and which in trine. */
function companionLabels(f: Finding, relations: PairRelation[]): string {
  if (f.planets.length < 3)
    return (
      f.planets.join(" · ") +
      (f.relation ? ` — ${RELATION_LABEL[f.relation]}` : "")
    );
  const [subject, ...rest] = f.planets;
  return `${subject} · ${rest
    .map((p) => {
      const r = relations.find((x) => x.subject === subject && x.object === p);
      return r ? `${p} (${RELATION_LABEL[r.relation]})` : p;
    })
    .join(" · ")}`;
}

function FindingMeta({
  f,
  relations,
  coveredBy,
}: {
  f: Finding;
  relations: PairRelation[];
  coveredBy?: string;
}) {
  return (
    <>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {companionLabels(f, relations)}
        {f.house && ` — in the ${ordinal(f.house)} from ${f.planets[0]}`}
        {f.viaRetro && " (via retrogression)"}
        {f.source && (
          <>
            {" · "}
            <Cite>{f.source}</Cite>
          </>
        )}
        {coveredBy && (
          <span className="italic"> · said within the combination above</span>
        )}
      </p>
    </>
  );
}

function FindingItem({
  f,
  relations,
  full,
  coveredBy,
  female = false,
}: {
  f: Finding;
  relations: PairRelation[];
  full: boolean;
  coveredBy?: string;
  female?: boolean;
}) {
  const tone = toneOf(f);
  const band = bandSentence(f, female);
  return (
    <li
      className="grid grid-cols-[auto_1fr] gap-x-3 text-sm"
      data-testid={`finding-${f.ruleId}`}
    >
      <div className="pt-1.5">
        <GradeDots f={f} />
      </div>
      <div className={cn(coveredBy && "text-muted-foreground")}>
        <p className="leading-relaxed">
          <Soft>{f.text}</Soft>
          {!full &&
            !f.grade &&
            f.relation &&
            f.relation !== "conjunct" &&
            f.planets.length === 2 && (
              <>
                {" "}
                <span
                  className="text-xs text-muted-foreground"
                  data-testid={`finding-relation-${f.ruleId}`}
                >
                  ({f.planets[1]} {RELATION_LABEL[f.relation]}
                  {f.viaRetro ? ", via retrogression" : ""})
                </span>
              </>
            )}
          {!full &&
            !f.grade &&
            f.planets.length >= 3 &&
            (() => {
              // "Together" in the rule text covers any Nadi contact; say which companions are not in the same sign.
              const [subject, ...rest] = f.planets;
              const apart = rest
                .map((p) => ({
                  p,
                  r: relations.find(
                    (x) => x.subject === subject && x.object === p,
                  ),
                }))
                .filter((x) => x.r && x.r.relation !== "conjunct");
              if (!apart.length) return null;
              return (
                <>
                  {" "}
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid={`finding-relation-${f.ruleId}`}
                  >
                    (
                    {apart
                      .map((x) => `${x.p} ${RELATION_LABEL[x.r!.relation]}`)
                      .join(", ")}
                    )
                  </span>
                </>
              );
            })()}
          {!full && f.source && (
            <Cite
              className="ml-1.5"
              title={`${f.source}${f.relation ? ` · ${f.planets.join(", ")}, ${RELATION_LABEL[f.relation]}` : ""}`}
            >
              {f.source.split(/[,(]/)[0].trim()}
            </Cite>
          )}
        </p>
        {f.grade && (
          <p
            className="mt-0.5 text-xs text-muted-foreground"
            data-testid={`grade-${f.ruleId}`}
          >
            <span className="font-medium text-foreground/80">
              {GRADE_LABEL[f.grade.level]}
            </span>
            {": "}
            {gradeReasons(f.grade, full)}
            {full && f.grade.ratio !== 1 && (
              <span className="tabular"> · net ×{f.grade.ratio.toFixed(2)}</span>
            )}
          </p>
        )}
        {f.flow && (
          <p
            className="mt-0.5 text-xs leading-relaxed"
            title={flowGloss(f.flow, female)}
            data-testid={`direction-${f.ruleId}`}
          >
            <span className="text-muted-foreground">Direction: </span>
            <Soft>{`${directionClause(f.flow, female)}.`}</Soft>
            {full && (
              <span className="text-muted-foreground">
                {" "}
                ({DIRECTION_SOURCE}; wording provisional)
              </span>
            )}
          </p>
        )}
        {band && (
          <p
            className="mt-0.5 text-xs text-muted-foreground"
            data-testid={`direction-band-${f.ruleId}`}
          >
            <Soft>{band}</Soft>
          </p>
        )}
        {full && (
          <FindingMeta f={f} relations={relations} coveredBy={coveredBy} />
        )}
        {!full && tone !== "neutral" && (
          <span className="sr-only">
            {tone === "good" ? "supportive" : "caution"}
          </span>
        )}
      </div>
    </li>
  );
}

function AreaSection({
  s,
  reading,
  gender,
  season,
}: {
  s: AreaSynthesis;
  reading: BnnReading;
  gender: Gender;
  season: AreaSeason;
}) {
  const { mode } = useReadingMode();
  const full = mode === "practitioner";
  const area = s.area;
  const plainTopic = !full ? plainTopicNatal(area, s, reading) : undefined;
  const [showEarly, setShowEarly] = useState(false);
  const keyFindings = (
    <>
      <ul className="space-y-3">
        {s.key.map((f) => (
          <FindingItem key={f.ruleId} f={f} relations={reading.relations} full={full} female={gender === "female"} />
        ))}
      </ul>
      {s.careerAlternative && (
        <div className="mt-3" data-testid="career-alternative">
          <p className="mb-1 text-xs text-muted-foreground">Another Jupiter or Saturn career interpretation; its selection threshold is the app's convention.</p>
          <ul><FindingItem f={s.careerAlternative} relations={reading.relations} full={full} female={gender === "female"} /></ul>
        </div>
      )}
    </>
  );
  if (!season.inSeason && !showEarly)
    return (
      <section
        aria-labelledby={`area-${area}`}
        data-testid={`section-area-${area}`}
        data-deferred="true"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
          <h3 id={`area-${area}`} className="text-base font-semibold">
            {LIFE_AREAS[area].label}
            <Badge
              variant="outline"
              className="no-default-hover-elevate ml-2 align-middle font-normal text-muted-foreground"
              data-testid={`badge-tone-${area}`}
            >
              Not yet in season
            </Badge>
          </h3>
          <span className="text-xs text-muted-foreground">
            read from age {season.from} ·{" "}
            {DateTime.fromISO(season.fromDate!).toFormat("LLL yyyy")}
          </span>
        </div>
        <p
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
          data-testid={`text-verdict-${area}`}
        >
          The chart holds its promise for this area from birth, but it is not a
          present matter at this age, so the reading is kept for later.{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowEarly(true)}
            data-testid={`button-show-early-${area}`}
          >
            Show the promise anyway
          </button>
        </p>
      </section>
    );
  return (
    <section
      aria-labelledby={`area-${area}`}
      data-testid={`section-area-${area}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
        <h3 id={`area-${area}`} className="text-base font-semibold">
          {LIFE_AREAS[area].label}
          <Badge
            variant="outline"
            className={cn(
              "no-default-hover-elevate ml-2 align-middle font-normal",
              TONE_CLASS[s.tone],
            )}
            data-testid={`badge-tone-${area}`}
          >
            {area === "children" ? "Traditional interpretation" : AREA_TONE_LABEL[s.tone]}
          </Badge>
        </h3>
        <span className="text-xs text-muted-foreground">
          <Term k="karaka">{area === "family" ? "karakas" : "karaka"}</Term>{" "}
          {areaKarakaLabel(area, gender as Gender)}
          {full && s.tone !== "descriptive" && (
            <span className="tabular">
              {" "}
              · balance {s.balance > 0 ? "+" : ""}
              {s.balance} · {s.total} findings
            </span>
          )}
        </span>
      </div>
      {!season.inSeason && (
        <p
          className="mt-3 text-xs text-muted-foreground"
          data-testid={`text-early-${area}`}
        >
          Read early: the native reaches the age from which this area is
          normally read ({season.from}) in{" "}
          {DateTime.fromISO(season.fromDate!).toFormat("LLL yyyy")}. Until then
          this is the promise held in the chart, not a present verdict.
        </p>
      )}
      <p
        className="mt-3 text-sm leading-relaxed"
        data-testid={`text-verdict-${area}`}
      >
        <Soft>{plainTopic?.summary ?? s.headline}</Soft>
      </p>
      {plainTopic?.detailIntro && <p className="mt-2 text-sm leading-relaxed">{plainTopic.detailIntro}</p>}
      {plainTopic && <TopicThemes topic={plainTopic} />}
      {plainTopic && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{plainTopic.limit}</p>}
      {plainTopic?.contrast && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{plainTopic.contrast}</p>}
      {s.reconciliation && (
        <p
          className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
          data-testid={`text-reconcile-${area}`}
        >
          {s.reconciliation}
        </p>
      )}
      {plainTopic ? (
        <Working id={`topic-findings-${area}`} label="Show the source findings" className="mt-3">{keyFindings}</Working>
      ) : <div className="mt-3">{keyFindings}</div>}
      {s.rest.length > 0 && (
        <Working
          id={area}
          label="Show the working"
          count={s.rest.length}
          className="mt-3"
        >
          <ul className="space-y-3">
            {s.rest.map((f) => (
              <FindingItem
                key={f.ruleId}
                f={f}
                relations={reading.relations}
                full
                coveredBy={s.coveredBy[f.ruleId]}
                female={gender === "female"}
              />
            ))}
          </ul>
        </Working>
      )}
    </section>
  );
}

const joinList = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const fmtMY = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

/** The BNN answer, first: what the Nadi rules conclude across the life areas, the three strongest signatures and the timing that matters next. */
function BnnVerdict({ result }: { result: ChartResult }) {
  const { reading, chart, transits, now } = result;
  const gender = chart.gender as Gender;
  const allAreas = useMemo(
    () => synthesize(reading, gender),
    [reading, gender],
  );
  // Timing is read at the reading date, or at the recorded date of passing; after a death date
  // nothing ahead is offered, so the "next" windows are dropped.
  const lifeAt = lifeAsOf(result.chart, now.asOf);
  const deceased = lifeAt !== now.asOf;
  const asOf = lifeAt.slice(0, 10);
  const age = calendarAge(result.utc, lifeAt, chart) ?? 0;
  const stage = lifeStage(age);
  const deferred = allAreas
    .map((a) => a.area)
    .filter((a) => !areaSeason(a, result.utc, lifeAt, result.chart).inSeason);
  // Areas not yet in season are held back from the verdict; a child is not told about marriage.
  const areas = allAreas.filter((a) => !deferred.includes(a.area));

  // The same sentence as the Overview's glance (shared/life-areas.ts): every firm area, every area that needs care,
  // every area in dispute, and the rest as mixed.
  const clauses = nadiAreasClauses(areas);
  const stageNote =
    deferred.length > 0
      ? ` At age ${Math.floor(age)} (${STAGE_LABEL[stage]}) ${joinList(deferred.map((a) => areaWord(a)))} ${deferred.length === 1 ? "is" : "are"} not yet in season and ${deferred.length === 1 ? "is" : "are"} held for later.${stage === "child" ? " Parashara's order for a child's chart is the evils at birth and their antidotes first (BPHS 9.1), read under Parashari." : ""}`
      : "";
  const headline = clauses
    ? clauses.replace(/^./, (c) => c.toUpperCase()) + "."
    : "The Nadi rules mark no area strongly in this chart.";
  const jeevaP = result.positions.find(
    (p) => p.planet === reading.roles.native,
  );
  const lead = `${reading.roles.native}, the life force, stands in ${reading.jeeva.sign}${reading.jeeva.companions.length ? ` with ${joinList(reading.jeeva.companions)}` : " alone"}${reading.jeeva.retro ? ", retrograde" : ""}${jeevaP ? ` at ${fmtDeg(jeevaP.lon)}` : ""}.${reading.deha ? ` ${reading.roles.deha}, her own person, stands in ${reading.deha.sign}${reading.deha.companions.length ? ` with ${joinList(reading.deha.companions)}` : ""}.` : ""} Saturn, the work, is in ${reading.karma.sign}.${stageNote}`;

  const signatures: VerdictSignature[] = useMemo(() => {
    // One signature per life area, the areas that are marked most strongly first, and no rule twice.
    const seen = new Set<string>();
    const usedArea = new Set<LifeArea>();
    // A supportive area is carried by a supportive finding, an area needing care by a hard one; mixed areas take their strongest.
    const fits = (a: AreaSynthesis, f: Finding) =>
      a.tone === "supportive"
        ? toneOf(f) !== "hard"
        : a.tone === "care"
          ? toneOf(f) !== "good"
          : true;
    const all = areas.flatMap((a) =>
      a.key
        .filter((f) => fits(a, f))
        .map((f) => ({ f, area: a.area, ab: Math.abs(a.balance) })),
    );
    // Within an area the strongest rule speaks, the same order as the area's own headline; a spoken tone only breaks ties.
    const spoken = (f: Finding) => (toneOf(f) === "neutral" ? 0 : 1);
    all.sort(
      (x, y) =>
        y.ab - x.ab ||
        Math.abs(y.f.score) - Math.abs(x.f.score) ||
        spoken(y.f) - spoken(x.f),
    );
    const out: VerdictSignature[] = [];
    for (const { f, area } of all) {
      if (seen.has(f.ruleId) || usedArea.has(area) || out.length >= 3) continue;
      seen.add(f.ruleId);
      usedArea.add(area);
      const t = toneOf(f);
      out.push({
        planets: f.planets,
        label: LIFE_AREAS[area].label.split(" & ")[0],
        text: firstClause(gist(f.text)),
        tone: t === "good" ? "good" : t === "hard" ? "bad" : "neutral",
      });
    }
    return out;
  }, [areas]);

  const timing: VerdictTiming[] = [];
  const ju = transits.find(
    (t) => t.planet === "Jupiter" && t.start <= asOf && asOf < t.end,
  );
  if (ju)
    timing.push({
      label: deceased ? "At passing" : "Now",
      when: "present",
      text: deceased ? (
        <>
          Jupiter was in {ju.sign}, {fmtMY(ju.start)} to {fmtMY(ju.end)}
        </>
      ) : (
        <>
          Jupiter moves through {ju.sign} until {fmtMY(ju.end)}
        </>
      ),
    });
  if (
    reading.marriage.promised !== "absent" &&
    !deferred.includes("marriage")
  ) {
    const lw = lastMarriageWindow(reading.marriage, transits, asOf, result.utc);
    if (lw)
      timing.push({
        label: "Marriage · last",
        when: "past",
        text: (
          <>
            Jupiter {lw.kind === "over" ? "over" : "in trine from"}{" "}
            {lw.period.sign}, {fmtMY(lw.period.start)} to {fmtMY(lw.period.end)}
          </>
        ),
      });
    const w = deceased
      ? null
      : nextMarriageWindow(reading.marriage, transits, asOf);
    if (w)
      timing.push({
        label: "Marriage",
        when: w.period.start <= asOf ? "present" : "future",
        text: (
          <>
            Jupiter {w.kind === "over" ? "over" : "in trine from"}{" "}
            {w.period.sign}, {fmtMY(w.period.start)} to {fmtMY(w.period.end)}
          </>
        ),
      });
  }
  if (
    reading.children.promised !== "unsigned" &&
    !deferred.includes("children")
  ) {
    const lw = lastChildWindow(reading.children, transits, asOf, result.utc);
    if (lw)
      timing.push({
        label: "Children · traditional transit, last",
        when: "past",
        text: (
          <>
            Jupiter{" "}
            {lw.kind === "return"
              ? "returns to"
              : lw.kind === "fifth"
                ? "reaches the 5th from"
                : "trines"}{" "}
            {lw.period.sign}, {fmtMY(lw.period.start)} to {fmtMY(lw.period.end)}
          </>
        ),
      });
    const w = deceased
      ? null
      : nextChildWindow(reading.children, transits, asOf, result.utc);
    if (w)
      timing.push({
        label: "Children · traditional transit",
        when: w.period.start <= asOf ? "present" : "future",
        text: (
          <>
            Jupiter{" "}
            {w.kind === "return"
              ? "returns to"
              : w.kind === "fifth"
                ? "reaches the 5th from"
                : "trines"}{" "}
            {w.period.sign}, {fmtMY(w.period.start)} to {fmtMY(w.period.end)}
          </>
        ),
      });
  }

  const lines = [
    { label: `${reading.roles.native} · Jeeva`, text: reading.jeeva.summary },
    ...(reading.deha
      ? [{ label: `${reading.roles.deha} · Deha`, text: reading.deha.summary }]
      : []),
    { label: "Saturn · Karma", text: reading.karma.summary },
    {
      label: "Marriage",
      text: `${PROMISE_LABEL[reading.marriage.promised]}, read between ${reading.roles.deha} and ${reading.roles.spouse}.${deferred.includes("marriage") ? " Not yet in season; held for later." : ""}`,
    },
    {
      label: "Children",
      text: `${CHILD_PROMISE_LABEL[reading.children.promised]}.${deferred.includes("children") ? " Not yet in season; held for later." : ""}`,
    },
    {
      label: "Rules",
      text: `${reading.findings.length} Nadi rules fire on this chart across ${allAreas.filter((a) => a.total > 0).length} life areas; each area below opens with its balance, then the signatures that carry it.${deferred.length ? ` Onset ages (${deferred.map((a) => `${areaWord(a)} ${areaSeason(a, result.utc, now.asOf, result.chart).from}`).join(", ")}) are practical conventions, provisional; BPHS has no chapter assigning ages to planets or matters.` : ""}`,
    },
  ];

  return (
    <VerdictCard
      system="Bhrigu Nandi Nadi"
      headline={headline}
      lead={lead}
      signatures={signatures}
      timing={timing}
      lines={lines}
      caveat="A starting set of Nadi rules after R.G. Rao and Satyanarayana Naik, weighed by sign relation and degree order. A reading, not a verdict."
      testid="bnn-verdict"
      className="mt-8"
    />
  );
}

function Reading({
  result,
  selected,
  part,
}: {
  result: ChartResult;
  selected: Planet | null;
  /** The karaka cards, or the life areas with their notes; both when omitted. */
  part?: "karakas" | "areas";
}) {
  const { reading, positions, chart } = result;
  const { mode } = useReadingMode();
  const { locale } = useLocale();
  const t = useT();
  const uncertainty = chart.timeUncertaintyMin ?? 0;
  const gradeNote = `${GRADE_NOTE} ${DIRECTION_NOTE}${uncertainty > 0 ? ` The birth time is taken as ±${uncertainty} minutes; lines whose direction or bond changes inside that band say so.` : ""}`;
  const gradeNoteMl = locale === "ml" ? bnnGradeNoteMalayalam(gradeNote, uncertainty) : undefined;
  const areas = useMemo(() => {
    const findings = selected
      ? reading.findings.filter((f) => f.planets.includes(selected))
      : reading.findings;
    return synthesize(reading, chart.gender as Gender, findings);
  }, [reading, selected, chart.gender]);

  return (
    <div className="space-y-8">
      {part !== "areas" && (
      <div className="grid gap-4">
        <KarakaCard
          title={
            reading.roles.gender === "female"
              ? "Jeeva karaka · the life force (both charts)"
              : "Jeeva karaka · the native"
          }
          planet={reading.roles.native}
          data={reading.jeeva}
          positions={positions}
          tone="jeeva"
        />
        <KarakaCard
          title="Karma karaka · the profession"
          planet="Saturn"
          data={reading.karma}
          positions={positions}
          tone="karma"
        />
        {reading.deha && (
          <div className="lg:col-span-2">
            <KarakaCard
              title="Deha karaka · the native herself (female chart)"
              planet={reading.roles.deha}
              data={reading.deha}
              positions={positions}
              tone="deha"
            />
          </div>
        )}
        <div className="lg:col-span-2">
          <MarriageCard
            m={reading.marriage}
            positions={positions}
            transits={result.transits}
            asOf={result.now.asOf}
            birthIso={result.utc}
            chart={result.chart}
          />
        </div>
        <div className="lg:col-span-2">
          <ChildrenCard
            c={reading.children}
            positions={positions}
            transits={result.transits}
            asOf={result.now.asOf}
            birthIso={result.utc}
          />
        </div>
        <div className="lg:col-span-2">
          <LakshmiCard
            l={reading.lakshmi}
            positions={positions}
            asOf={lifeAsOf(result.chart, result.now.asOf)}
            deceased={isDeceased(result.chart, result.now.asOf)}
            birthIso={result.utc}
          />
        </div>
        {result.nakshatraWealth && (
          <div className="lg:col-span-2">
            <NakshatraWealthCard nw={result.nakshatraWealth} />
          </div>
        )}
      </div>
      )}

      {part !== "areas" && mode === "plain" && <BnnPlanetExplanations result={result} />}

      {part !== "karakas" && (
      <>
      <Working id="strength" label="Show planetary strength and degree order">
        <StrengthNotes
          strength={reading.strength}
          chains={reading.chains}
          selected={selected}
          female={chart.gender === "female"}
        />
      </Working>

      {selected && (
        <p className="text-sm text-muted-foreground">
          {locale === "ml" ? <>{t(selected)} ഉൾപ്പെടുന്ന സൂചനകളാണ് കാണിക്കുന്നത്. ഗ്രഹ തിരഞ്ഞെടുപ്പ് ഒഴിവാക്കുകയോ പട്ടികയിലെ അതേ വരി വീണ്ടും തിരഞ്ഞെടുക്കുകയോ ചെയ്യാം.</> : <>Showing findings that involve <span className="font-medium text-foreground">{selected}</span>. Clear the planet selector or select its row again to show all findings.</>}
        </p>
      )}

      {mode === "plain" && (
        <p
          className="text-xs text-muted-foreground"
          data-testid="text-plain-note"
        >
          Each area opens with selected Nadi interpretations. Family members are
          read separately. "Show the working" lists the findings and sources.
        </p>
      )}
      <details className="text-xs leading-relaxed text-muted-foreground" open={mode !== "plain"}>
        <summary className="cursor-pointer font-medium" lang={locale}>{locale === "ml" ? "നിലയും ദിശയും എങ്ങനെ കണക്കാക്കുന്നു" : "How the grades and directions work"}</summary>
        <p className="mt-2" data-testid="text-grade-note" lang={locale === "ml" && gradeNoteMl ? "ml" : "en"}>
          {gradeNoteMl ?? gradeNote}
        </p>
      </details>

      {areas.map((s) => (
        <AreaSection
          key={s.area}
          s={s}
          reading={reading}
          gender={chart.gender as Gender}
          season={areaSeason(s.area, result.utc, result.now.asOf, result.chart)}
        />
      ))}
      </>
      )}
    </div>
  );
}

function StrengthNotes({
  strength,
  chains,
  selected,
  female = false,
}: {
  strength: PlanetStrength[];
  chains: DegreeChain[];
  selected: Planet | null;
  female?: boolean;
}) {
  const rows = strength.filter(
    (s) => s.notes.length && (!selected || s.planet === selected),
  );
  const shownChains = chains.filter(
    (c) => !selected || c.order.some((p) => p.planet === selected),
  );
  if (!rows.length && !shownChains.length) return null;
  return (
    <section aria-labelledby="strength-heading" data-testid="section-strength">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h3 id="strength-heading" className="text-base font-semibold">
          Planetary strength
        </h3>
        <span className="text-xs text-muted-foreground">
          Rao's basic rules · Naik
        </span>
      </div>
      <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map((s) => (
          <li
            key={s.planet}
            className="grid grid-cols-[4.5rem_1fr] gap-x-2"
            data-testid={`strength-${s.planet}`}
          >
            <PlanetName planet={s.planet} tone className="font-medium" />
            <span className="text-muted-foreground">
              {s.notes.map((n, i) => (
                <span key={i} className="block leading-relaxed">
                  {n}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {shownChains.length > 0 && (
        <div className="mt-4" data-testid="section-chains">
          <h4 className="text-sm font-medium">Degree order by direction</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The three signs of a trine are one direction and their planets are
            read as one combination in degree order: the planet ahead hands its
            matters to the one behind (Rao, rule 1). Bonds within one pada are
            the tightest; across signs, planets within a degree stand "at the
            same degree". Direct planets move to higher degrees, retrograde ones
            and the nodes to lower, so a closing pair binds more strongly than a
            separating one. A retrograde planet keeps its place by degree but is
            also entered, at half strength, in the direction of its previous
            sign; Rahu and Ketu are always retrograde, so this rule does not
            apply to them.
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {shownChains.map((c) => (
              <li
                key={c.direction}
                className="grid grid-cols-[4.5rem_1fr] gap-x-2"
                data-testid={`chain-${c.direction}`}
              >
                <span>
                  <span className="block font-medium">{c.direction}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.signs.map((sg) => sg.slice(0, 3)).join(" ")}
                  </span>
                </span>
                <span>
                  <span className="tabular">
                    {c.order.map((p, i) => (
                      <span key={p.planet}>
                        {i > 0 && (
                          <span className="text-muted-foreground"> › </span>
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            p.viaRetro && "opacity-70",
                          )}
                          style={{ color: planetColor(p.planet) }}
                        >
                          {p.planet}
                          {p.retrograde &&
                          p.planet !== "Rahu" &&
                          p.planet !== "Ketu" ? (
                            <sup className="ml-0.5 text-[0.65em]">R</sup>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {fmtDegShort(p.degInSign)}
                          {c.signs.length > 1 || p.viaRetro
                            ? ` ${p.sign.slice(0, 3)}`
                            : ""}
                          {p.viaRetro ? (
                            <span
                              className="ml-1 rounded-sm border border-border px-1 text-[0.7em] align-middle"
                              title="Read here from its previous sign by retrogression, at half strength"
                            >
                              by retro
                            </span>
                          ) : null}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {c.links.map((l) => (
                      <span key={`${l.from}-${l.to}`} className="block">
                        {l.from} → {l.to} ({tierLabel(l.tier)},{" "}
                        {approachLabel(l.approach)}
                        {l.viaRetro
                          ? ", by retrogression at half strength"
                          : ""}
                        ): {givesOf(l.from, female)} colour{" "}
                        {receivesOf(l.to, female)}.
                      </span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const HOUSE_CLASS_TONE: Record<HouseClass, string> = {
  best: "border-primary/40 text-primary",
  good: "border-foreground/30 text-foreground/80",
  middling: "border-border text-muted-foreground",
  adverse: "border-destructive/40 text-destructive",
};

const HOUSE_KARAKAS: Planet[] = ["Jupiter", "Saturn", "Venus"];

function HousesPanel({
  positions,
  karaka,
  native,
  deha,
  onChange,
  selected,
}: {
  positions: PlanetPosition[];
  karaka: Planet;
  native: Planet;
  deha: Planet;
  onChange: (p: Planet) => void;
  selected: Planet | null;
}) {
  const houses = housesFrom(positions, karaka);
  if (!houses.length) return null;
  const stayPut = retroNotes(positions, karaka);
  const female = deha !== native;
  const roleWord =
    karaka === native
      ? "the life force"
      : karaka === "Saturn"
        ? "the work"
        : female
          ? "the native herself"
          : "the spouse";
  return (
    <section className="mt-6" data-testid="section-houses">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Houses from {karaka}</h3>
        <div className="flex gap-1" role="group" aria-label="Count houses from">
          {HOUSE_KARAKAS.map((k) => (
            <Button
              key={k}
              size="sm"
              variant={k === karaka ? "secondary" : "ghost"}
              onClick={() => onChange(k)}
              data-testid={`house-from-${k}`}
            >
              {k}
              {k === native ? (
                <span className="ml-1 text-[0.7em] text-muted-foreground">
                  Jeeva
                </span>
              ) : female && k === deha ? (
                <span className="ml-1 text-[0.7em] text-muted-foreground">
                  Deha
                </span>
              ) : null}
            </Button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Whole signs counted from {karaka}'s rashi as the 1st: {roleWord} is the
        reference, not the ascendant, and {karaka}'s degree moves no boundary.
        Trines are best, quadrants good, the 6th, 8th and 12th adverse; 2, 3 and
        11 not so good.
      </p>
      <ul className="mt-3 divide-y divide-border text-sm">
        {houses.map((h) => {
          const dim =
            selected && !h.planets.includes(selected) && h.house !== 1;
          return (
            <li
              key={h.house}
              className={cn(
                "grid grid-cols-[1.5rem_2.5rem_1fr] gap-x-2 py-1.5",
                dim && "opacity-50",
                h.planets.length === 0 && !dim && "opacity-75",
              )}
              data-testid={`house-${h.house}`}
            >
              <span
                className={cn(
                  "tabular font-semibold",
                  h.house === 1 && "text-primary",
                )}
              >
                {h.house}
              </span>
              <span className="text-muted-foreground">
                {h.sign.slice(0, 3)}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">
                    {h.house === 1 ? (
                      [karaka, ...h.planets].join(", ")
                    ) : h.planets.length ? (
                      h.planets.join(", ")
                    ) : (
                      <span className="font-normal text-muted-foreground">
                        empty
                      </span>
                    )}
                  </span>
                  {h.viaRetro.length > 0 && (
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid={`house-${h.house}-retro`}
                    >
                      + {h.viaRetro.join(", ")} by retro, half strength
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-sm border px-1 text-[0.68rem] leading-4",
                      HOUSE_CLASS_TONE[h.cls],
                    )}
                  >
                    {HOUSE_CLASS_LABEL[h.cls]}
                  </span>
                </span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  {h.meaning}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {stayPut.length > 0 && (
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-testid="houses-retro-note"
        >
          {stayPut
            .map(
              (n) =>
                `${n.planet} is retrograde but stays in the ${ordinal(n.house)}: ${n.reason}.`,
            )
            .join(" ")}{" "}
          A retrograde planet's own house is always read at full strength.
        </p>
      )}
    </section>
  );
}

const REL_ABBR: Record<string, string> = {
  conjunct: "C",
  next: "2",
  prev: "12",
  trine: "T",
  opposite: "7",
  none: "",
};

function Relations({
  relations,
  positions,
}: {
  relations: PairRelation[];
  positions: PlanetPosition[];
}) {
  const lookup = new Map(relations.map((r) => [`${r.subject}|${r.object}`, r]));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Row planet is the subject; column planet is the object. C conjunct · 2
        object is in the 2nd sign ahead · 12 object is in the 12th behind · T
        trine · 7 opposite. An asterisk marks a link that only exists through
        the retrograde rule (a retrograde planet also acts from the previous
        sign).
      </p>
      <div className="overflow-x-auto">
        <table className="tabular w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                from ↓ to →
              </th>
              {PLANETS.map((p) => (
                <th key={p} className="p-2 text-center text-xs font-medium">
                  {PLANET_ABBR[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((s) => (
              <tr key={s} className="border-t">
                <th className="p-2 text-left font-medium">{s}</th>
                {PLANETS.map((o) => {
                  const r = lookup.get(`${s}|${o}`);
                  return (
                    <td
                      key={o}
                      className={cn(
                        "p-2 text-center",
                        s === o && "bg-muted/60",
                        r?.relation === "conjunct" && "font-semibold",
                      )}
                      data-testid={`rel-${s}-${o}`}
                    >
                      {s === o ? (
                        ""
                      ) : r ? (
                        `${REL_ABBR[r.relation]}${r.viaRetro ? "*" : ""}`
                      ) : (
                        <span className="text-muted-foreground">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(11rem,100%),1fr))] gap-3">
        {positions.map((p) => {
          const links = relations.filter((r) => r.subject === p.planet);
          return (
            <Card key={p.planet}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between">
                  <PlanetName
                    planet={p.planet}
                    tone
                    className="font-semibold"
                  />
                  <span className="text-xs text-muted-foreground">
                    {p.sign}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {links.length === 0 && (
                    <li className="text-muted-foreground">Stands alone.</li>
                  )}
                  {links.map((r) => (
                    <li key={r.object} className="flex justify-between gap-2">
                      <span>{r.object}</span>
                      <span className="text-muted-foreground">
                        {RELATION_LABEL[r.relation]}
                        {r.viaRetro ? " *" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type SystemMode =
  | "overview"
  | "bnn"
  | "jaimini"
  | "alp"
  | "kp"
  | "parashari"
  | "prasna"
  | "panchanga"
  | "rectify"
  | "validate";

/** The report module each reading tab exports on its own (shared/report); the two tools have none. */
const TAB_MODULE: Partial<Record<SystemMode, string>> = {
  bnn: "bnn",
  jaimini: "jaimini",
  alp: "alp",
  kp: "kp",
  parashari: "parashari",
  prasna: "prasna",
  panchanga: "panchanga",
  rectify: "rectify",
  validate: "validate",
};

/** The nine tabs, in order; the first is the overview and the last two are tools rather than reading systems. */
const MODES: {
  id: SystemMode;
  label: string;
  short: string;
  title?: string;
  tool?: boolean;
  Icon: typeof Orbit;
}[] = [
  { id: "overview", label: "Overview", short: "Overview", Icon: Eye },
  { id: "bnn", label: "Bhrigu Nandi Nadi", short: "Nadi", Icon: Orbit },
  { id: "jaimini", label: "Jaimini", short: "Jaimini", Icon: Compass },
  {
    id: "alp",
    label: "ALP",
    short: "ALP",
    title: "Akshaya Lagna Paddhati",
    Icon: Footprints,
  },
  {
    id: "kp",
    label: "KP",
    short: "KP",
    title: "Krishnamurti Paddhati",
    Icon: Crosshair,
  },
  {
    id: "parashari",
    label: "Parashari",
    short: "Parashari",
    title: "Brihat Parashara Hora Sastra",
    Icon: BookOpen,
  },
  {
    id: "prasna",
    label: "Prasna Marga",
    short: "Prasna",
    title: "Prasna Marga (Kerala): effects of planets in houses",
    Icon: HelpCircle,
  },
  {
    id: "panchanga",
    label: "Panchanga",
    short: "Panchanga",
    title:
      "Panchanga and gochara (Surya Siddhanta, Brihat Samhita, Phaladeepika)",
    Icon: CalendarDays,
  },
  {
    id: "rectify",
    label: "Rectify",
    short: "Rectify",
    title: "Birth time rectification",
    tool: true,
    Icon: Clock,
  },
  {
    id: "validate",
    label: "Validate",
    short: "Validate",
    title: "Check the chart against saved life events",
    tool: true,
    Icon: CheckCheck,
  },
];

function ModeBar({
  mode,
  onPick,
  onOpenChart,
}: {
  mode: SystemMode;
  onPick: (m: SystemMode) => void;
  onOpenChart: MouseEventHandler<HTMLButtonElement>;
}) {
  const t = useT();
  return (
    <nav
      aria-label={t("Reading system")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm md:hidden"
      data-testid="mode-bar"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <label htmlFor="mobile-reading-system" className="sr-only sm:not-sr-only sm:shrink-0 sm:text-sm sm:font-medium">{t("Reading system")}</label>
        <select
          id="mobile-reading-system"
          value={mode}
          onChange={(event) => onPick(event.target.value as SystemMode)}
          className="min-h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          data-testid="mode-picker"
        >
          <optgroup label={t("Readings")}>
            {MODES.filter((m) => !m.tool).map((m) => <option key={m.id} value={m.id}>{t(m.label)}</option>)}
          </optgroup>
          <optgroup label={t("Chart tools")}>
            {MODES.filter((m) => m.tool).map((m) => <option key={m.id} value={m.id}>{t(m.label)}</option>)}
          </optgroup>
        </select>
        <button type="button" aria-haspopup="dialog" onClick={onOpenChart} className="min-h-11 shrink-0 rounded-md border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" data-testid="reference-mobile-open">{t("Chart")}</button>
      </div>
    </nav>
  );
}

export default function ChartPage() {
  const t = useT();
  const { locale } = useLocale();
  const englishFallback = locale === "ml" ? "en" : undefined;
  const { id, mode: routeMode } = useParams<{ id: string; mode?: string }>();
  const [, navigate] = useLocation();
  const mode = MODES.find((m) => m.id === routeMode)?.id ?? "overview";
  const setMode = (next: SystemMode) => {
    if (next !== mode) navigate(`/chart/${id}${next === "overview" ? "" : `/${next}`}`);
  };
  const { data, isLoading, error } = useQuery<ChartResult>({
    queryKey: ["chart-result", id],
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser");
      const result = (await (
        await apiRequest("POST", "/api/compute", chart)
      ).json()) as ChartResult;
      return { ...result, chart };
    },
  });
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [alpAsOf, setAlpAsOf] = useState<string | undefined>();
  useEffect(() => setAlpAsOf(undefined), [id]);
  const [selected, setSelected] = useState<Planet | null>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referencePlanet, setReferencePlanet] = useState<Planet | null>(null);
  const [referenceTransits, setReferenceTransits] = useState(false);
  const [wideReference, setWideReference] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1400px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1400px)");
    const update = () => setWideReference(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, []);
  const referenceTrigger = useRef<HTMLButtonElement | null>(null);
  const openReference: MouseEventHandler<HTMLButtonElement> = (event) => {
    referenceTrigger.current = event.currentTarget;
    if (mode === "bnn") setReferencePlanet(selected);
    setReferenceOpen(true);
  };
  useEffect(() => {
    setReferenceOpen(false);
    setReferencePlanet(null);
    setReferenceTransits(false);
  }, [id]);
  const { mode: readingMode } = useReadingMode();
  const { layout: chartLayout } = useChartLayout();
  // The report PDF: the same sections as the Report page, one module per system, in the current
  // reading mode. With no modules the whole report; with one, that tab's section alone.
  // The Rectify tab reports what it is looking at, so its export reruns the same scan on the server.
  const rectifyState = useRef<RectifyExportState | null>(null);
  const topicState = useRef<Partial<Record<TopicReadingSystem, ChartEvent>>>({});
  const rememberTopic = (system: TopicReadingSystem, event: ChartEvent | null) => {
    if (event) topicState.current[system] = event;
    else delete topicState.current[system];
  };
  const exportPdf = async (modules?: string[]) => {
    if (!data) return;
    if (modules?.includes("rectify") && !rectifyState.current) {
      toast({
        title: "Nothing to export yet",
        description: "Open the Rectify tab and choose a method first.",
      });
      return;
    }
    setExporting(modules?.[0] ?? "all");
    try {
      await downloadReportPdf(data.chart, {
        plain: readingMode === "plain",
        locale,
        modules,
        tools: { ...(modules?.includes("rectify") ? { rectify: rectifyState.current! } : {}), topicReadings: topicState.current, alpAsOf },
      });
    } catch (e: any) {
      toast({
        title: "Could not export PDF",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };
  const [showTransit, setShowTransit] = useState(true);
  const [houseKaraka, setHouseKaraka] = useState<Planet | null>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const onSystemKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = MODES.findIndex((item) => item.id === mode);
    const next = event.key === "ArrowRight" ? MODES[(index + 1) % MODES.length]
      : event.key === "ArrowLeft" ? MODES[(index - 1 + MODES.length) % MODES.length]
        : event.key === "Home" ? MODES[0]
          : event.key === "End" ? MODES[MODES.length - 1] : undefined;
    if (!next) return;
    event.preventDefault();
    setMode(next.id);
    requestAnimationFrame(() => document.getElementById(`system-tab-${next.id}`)?.focus());
  };
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,28rem)_1fr]">
          <div className="aspect-square animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            {PLANETS.map((p) => (
              <div key={p} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="text-lg font-semibold">{t("Chart unavailable")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <LocalizedText>{(error as Error)?.message ?? "Not found."}</LocalizedText>
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            <ArrowLeft /> {t("Back")}
          </Link>
        </Button>
      </div>
    );
  }

  const { chart, positions, now } = data;
  const birthLocal = displayLocal(data.utc, data.timeBasis, chart.timezone);
  const selectedSign = selected
    ? (positions.find((p) => p.planet === selected)?.signIndex ?? null)
    : null;
  const transitNow = now.positions.filter(
    (p) => p.planet === "Jupiter" || p.planet === "Saturn",
  );
  const transitInstant = DateTime.fromISO(now.asOf, { setZone: true }).setZone(chart.timezone || "UTC").setLocale(locale === "ml" ? "ml-IN" : "en");
  const transitSnapshot = transitInstant.isValid ? transitInstant.toFormat("d LLL yyyy, HH:mm ZZZZ") : now.asOf;

  // The Nadi tab in chapters: the sticky rasi chart stays beside every chapter after the brief.
  const bnnChartColumn = (
        <div
          className={cn(!wideReference && "lg:sticky lg:top-14 lg:max-h-[calc(100svh-4.5rem)] lg:overflow-y-auto lg:pr-1")}
          data-testid="bnn-chart-column"
        >
          <SouthIndianChart
            positions={positions}
            transit={showTransit ? transitNow : []}
            title={t("Nadi chart")}
            compactPlanets={wideReference}
            subtitle={`${PLANET_ABBR[data.reading.roles.native]} Jeeva · Sa Karma${data.reading.roles.deha !== data.reading.roles.native ? ` · ${PLANET_ABBR[data.reading.roles.deha]} Deha` : ""}`}
            highlightSign={selectedSign}
            secondarySigns={
              selectedSign === null
                ? undefined
                : [
                    (selectedSign + 4) % 12,
                    (selectedSign + 8) % 12,
                    (selectedSign + 6) % 12,
                  ]
            }
            jeeva={data.reading.roles.native}
            deha={
              data.reading.roles.deha !== data.reading.roles.native
                ? data.reading.roles.deha
                : undefined
            }
            houseKaraka={houseKaraka ?? data.reading.roles.native}
            onSignClick={(s) => {
              const p = positions.find((x) => x.signIndex === s);
              setSelected(
                p ? (selected === p.planet ? null : p.planet) : null,
              );
            }}
          />
          <label className="mt-3 block text-sm font-medium">
            {t("Focus on a planet")}
            <select value={selected ?? ""} onChange={(event) => setSelected((event.target.value || null) as Planet | null)} className="mt-1 min-h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" data-testid="bnn-chart-planet-select">
              <option value="">{t("Choose a planet")}</option>
              {positions.map((p) => <option key={p.planet} value={p.planet}>{t(p.planet)}</option>)}
            </select>
          </label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("In some Nadi chapters, choosing a planet also filters the displayed findings.")}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span
                className="font-semibold"
                style={{ color: planetColor(data.reading.roles.native) }}
              >
                {PLANET_ABBR[data.reading.roles.native]}
              </span>{" "}
              {locale === "ml" ? "ജീവകാരകൻ" : "Jeeva"} ·{" "}
              <span
                className="font-semibold"
                style={{ color: planetColor("Saturn") }}
              >
                Sa
              </span>{" "}
              {locale === "ml" ? "കർമ്മകാരകൻ" : "Karma"}
              {data.reading.roles.deha !== data.reading.roles.native && (
                <>
                  {" · "}
                  <span
                    className="font-semibold"
                    style={{
                      color: planetColor(data.reading.roles.deha),
                    }}
                  >
                    {PLANET_ABBR[data.reading.roles.deha]}
                  </span>{" "}
                  {locale === "ml" ? "ദേഹകാരകൻ (സ്ത്രീജാതകം)" : "Deha (female chart)"}
                </>
              )}{" "}
              · R {locale === "ml" ? "വക്രഗതി" : "retrograde"} · <span className="italic">tJu tSa</span>{" "}
              {locale === "ml" ? `ഗോചര ആകാശനില: ${transitSnapshot}. ഒരു രാശി തിരഞ്ഞെടുക്കുമ്പോൾ അതിന്റെ ത്രികോണവും ഏഴാം രാശിയും കാണാം.` : `sky snapshot: ${transitSnapshot}. Choose a sign to see its trines and seventh.`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={showTransit}
              onClick={() => setShowTransit((v) => !v)}
              data-testid="button-toggle-transit"
            >
              {showTransit ? <EyeOff /> : <Eye />}
              {t("Transits")}
            </Button>
          </div>
          <Working
            id="houses"
            label="Show the twelve houses from the karaka"
            className="mt-4"
          >
            <HousesPanel
              positions={positions}
              karaka={houseKaraka ?? data.reading.roles.native}
              native={data.reading.roles.native}
              deha={data.reading.roles.deha}
              onChange={setHouseKaraka}
              selected={selected}
            />
          </Working>
        </div>
  );
  const bnnGrid = (content: ReactNode) => (
    <div className={cn("grid gap-8 lg:items-start", !wideReference && "lg:grid-cols-[minmax(0,20rem)_1fr] xl:grid-cols-[minmax(0,27rem)_1fr]")}>
      {!wideReference && bnnChartColumn}
      <div className="min-w-0 max-w-[76ch]">{content}</div>
    </div>
  );
  const bnnChapters: ChapterDef[] = [
    { id: "brief", plain: "In brief", technical: "Summary" },
    {
      id: "areas",
      plain: "Life areas",
      technical: "Areas",
      blurb: "Each area of life with its balance, the signatures that carry it and the rules behind them.",
    },
    {
      id: "karakas",
      plain: "Key planets",
      technical: "Karakas",
      blurb: "Jupiter for the native and Saturn for work, with marriage, children and wealth read from their karakas.",
    },
    {
      id: "timing",
      plain: "Timing",
      technical: "Transits",
      blurb: "When the passages of Jupiter and Saturn over the birth planets bring each matter forward.",
    },
    { id: "topic-check", plain: "Matter and date", technical: "Matter and date", blurb: "Check this matter's natal Nadi rules and the transiting timers on a chosen date." },
    {
      id: "relations",
      plain: "Relations",
      technical: "Relations",
      blurb: "A grid of how each planet links to the others: together, next door, in trine or opposite.",
    },
  ];

  return (
    <DeceasedProvider
      deceased={!!data && isDeceased(data.chart, new Date().toISOString())}
    >
      <ChapterMemoryProvider key={chart.id}>
      <div className="mx-auto max-w-6xl px-5 py-8 pb-24 md:px-10 min-[1400px]:pb-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="font-display text-xl font-bold tracking-tight"
              data-testid="text-chart-name"
            >
              {chart.name}
            </h1>
            <BirthTimeEditor chart={chart} birthLocal={birthLocal} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <ChartSettings
              chart={chart}
              ayanamsaValue={data.ayanamsaValue}
              timeBasis={data.timeBasis}
            />
            <Button size="sm" asChild>
              <Link
                href={`/chart/${chart.id}/room`}
                data-testid="link-reading-room"
                title="The reading room: the full editorial reading"
              >
                <BookOpen className="h-4 w-4" />
                {t("Reading room")}
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link
                href={`/chart/${chart.id}/reading`}
                data-testid="link-reading-experience"
                title={locale === "ml" ? "ലളിതമായ പുതിയ വായന തുറക്കുക" : "Open the guided reading, one theme at a time"}
              >
                <BookOpen className="h-4 w-4" />
                {locale === "ml" ? "പുതിയ വായന" : "New reading"}
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link
                href={`/chart/${chart.id}/report`}
                data-testid="link-report"
                title="The whole reading as one prose document, printable"
              >
                <FileText className="h-4 w-4" />
                {t("Report")}
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportPdf()}
              disabled={exporting !== null}
              data-testid="button-export-pdf"
            >
              <FileDown className="h-4 w-4" />
              {t(exporting === "all" ? "Preparing PDF" : "Export PDF")}
            </Button>
          </div>
        </header>

        <div className="min-[1400px]:grid min-[1400px]:grid-cols-[minmax(0,1fr)_18rem] min-[1400px]:gap-6">
        <aside className="hidden self-start min-[1400px]:sticky min-[1400px]:top-4 min-[1400px]:col-start-2 min-[1400px]:row-start-1 min-[1400px]:block min-[1400px]:max-h-[calc(100svh-2rem)] min-[1400px]:overflow-y-auto" aria-label={t(mode === "bnn" ? "Nadi chart" : "Birth chart reference")}>
          <div className="mt-8 rounded-lg border bg-card p-4">
            {mode === "bnn" && wideReference ? <div data-testid="nadi-reference-chart">
              <h2 className="font-display text-base font-semibold">{t("Nadi chart")}</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">{locale === "ml"
                ? `നാഡി രാശികൾ താരതമ്യം ചെയ്യുന്ന ആധാരഗ്രഹം: ${t(houseKaraka ?? data.reading.roles.native)}.${chartLayout === "north" ? " വടക്കേ ഇന്ത്യൻ ദൃശ്യത്തിലും ക്രമീകരണം ഈ ഗ്രഹത്തിൽ നിന്നാണ്." : ""}`
                : `Nadi compares signs from ${houseKaraka ?? data.reading.roles.native}, the reference planet.${chartLayout === "north" ? " The North Indian layout is also oriented from that planet." : ""}`}</p>
              <button type="button" aria-haspopup="dialog" onClick={openReference} className="mb-3 min-h-11 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" data-testid="reference-enlarge">{t("Open birth chart")}</button>
              {bnnChartColumn}
            </div> : <ReferenceChart result={data} mode={mode} selected={referencePlanet} onSelect={setReferencePlanet} showTransits={referenceTransits} onToggleTransits={() => setReferenceTransits((v) => !v)} instance="rail" onEnlarge={openReference} />}
          </div>
        </aside>
        <div className="min-w-0 min-[1400px]:col-start-1 min-[1400px]:row-start-1">
        <AgreementPanel
          className="mt-4"
          compact={mode !== "overview" || readingMode === "plain"}
          result={data}
          onOpenTab={(t) => {
            setMode(t);
            if (tablistRef.current?.offsetParent)
              tablistRef.current.scrollIntoView({ block: "nearest" });
            else document.querySelector("main")?.scrollTo({ top: 0 });
          }}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div
            role="tablist"
            aria-label={t("Reading system")}
            onKeyDown={onSystemKey}
            className="hidden max-w-full flex-wrap whitespace-nowrap rounded-md border p-0.5 text-sm md:inline-flex"
            ref={tablistRef}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`system-tab-${m.id}`}
                aria-selected={mode === m.id}
                aria-controls="system-panel"
                tabIndex={mode === m.id ? 0 : -1}
                onClick={() => setMode(m.id)}
                className={cn(
                  "min-h-10 rounded px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:px-3",
                  m.id === "rectify" && "ml-1 border-l",
                  mode === m.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-testid={`mode-${m.id}`}
                title={m.title}
              >
                <span className="lg:hidden">{t(m.short)}</span>
                <span className="hidden lg:inline">{t(m.label)}</span>
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite" data-testid="mode-current">
            {MODES.find((m) => m.id === mode)?.title ??
              MODES.find((m) => m.id === mode)?.label}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className={cn("text-xs text-muted-foreground", mode === "overview" && "hidden md:block")}>
              <LocalizedText>{mode === "overview"
                ? "An introduction to this chart's life topics, timing and the different schools' readings."
                : mode === "bnn"
                  ? "Planet-to-planet reading, no ascendant or houses."
                  : mode === "jaimini"
                  ? readingMode === "plain"
                    ? "Jaimini's method: the planets ranked into roles, how each house appears to the world, life periods by sign. Kept separate from the Nadi reading."
                    : "Ascendant-based: karakas, padas, navamsa and Chara dasha. Kept separate from the Nadi reading."
                  : mode === "alp"
                    ? readingMode === "plain"
                      ? "A moving rising point: it advances one sign every ten years and the birth planets are read from where it stands now. Framework stage."
                      : "Progressed lagna: the ascendant moves ten years to a sign and the natal planets are read from where it stands now. Framework stage."
                    : mode === "parashari"
                      ? readingMode === "plain"
                        ? "The classical system: which planets help or hinder this rising sign, how strong they are, the notable combinations, and the life period running now. Kept separate from the other readings."
                        : "Parashara's system: whole-sign bhavas from the lagna, house lords, sign aspects, functional nature by rising sign, Shadbala, vargas, Ashtakavarga, yogas and Vimshottari with dasa effects. Kept separate from the other readings. First pass."
                      : mode === "prasna"
                        ? "Prasna Marga, the Kerala classic: what a malefic and what a benefic bring in each occupied house, read from the ascendant. First pass."
                        : mode === "panchanga"
                        ? readingMode === "plain"
                          ? "The five limbs of the day for the birth and any date, and the planets' transits from the birth Moon read with Brihat Samhita and Phaladeepika."
                          : "Panchanga per Surya Siddhanta 1.36, 2.64-69; gochara from the natal Moon per Brihat Samhita 104 and Phaladeepika 26, with vedha. Not Parashari."
                        : mode === "rectify"
                          ? readingMode === "plain"
                            ? "Checking the birth time: the minutes around the recorded time, scored by one method at a time. Not a reading."
                            : "Birth time rectification: candidate intervals around the recorded time, scored by one method at a time. Not a reading."
                          : mode === "validate"
                            ? "Saved life events read back at their dates: KP period lords and cusp promise, Jaimini chara dasha, Jupiter's transit, and how each planet's periods turned out. Not a reading."
                            : readingMode === "plain"
                              ? "Krishnamurti's method: each house has a deciding planet, houses are promised or denied, and timing comes from the planetary periods. Kept separate from the other readings. First pass."
                              : "Stellar method: Placidus cusps, star and sub lords, significators and Vimshottari timing. KP ayanamsa. First pass."}</LocalizedText>
            </p>
            <ReadingModeToggle />
            {TAB_MODULE[mode] && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => exportPdf([TAB_MODULE[mode]!])}
                disabled={exporting !== null}
                title={
                  mode === "rectify"
                    ? "Export the scan shown here (method, window and events) as a PDF"
                    : mode === "validate"
                      ? "Export the events read back against the chart as a PDF"
                      : `Export the ${MODES.find((m) => m.id === mode)?.label} section alone as a PDF, in the current reading mode`
                }
                data-testid="button-export-tab-pdf"
              >
                <FileDown className="h-3.5 w-3.5" />
                {t(exporting === TAB_MODULE[mode]
                  ? "Preparing PDF"
                  : "This tab as PDF")}
              </Button>
            )}
          </div>
        </div>

        <div id="system-panel" role="tabpanel" aria-labelledby={`system-tab-${mode}`} tabIndex={0}>
        {mode === "overview" && (
          <div className="mt-8 animate-in fade-in-0 duration-300">
            <OverviewPanel
              result={data}
              alpAsOf={alpAsOf}
              onOpenTab={(t) => {
                setMode(t);
                document.querySelector("main")?.scrollTo({ top: 0 });
              }}
            />
          </div>
        )}

        {mode === "jaimini" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <JaiminiPanel result={data} onTopicSelected={(event) => rememberTopic("jaimini", event)} />
          </div>
        )}

        {mode === "alp" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <AlpPanel result={data} initialAsOf={alpAsOf} onAsOfChange={setAlpAsOf} onTopicSelected={(event) => rememberTopic("alp", event)} />
          </div>
        )}

        {mode === "kp" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <KpPanel result={data} onTopicSelected={(event) => rememberTopic("kp", event)} />
          </div>
        )}

        {mode === "parashari" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <ParashariPanel
              result={data}
              onTopicSelected={(event) => rememberTopic("parashari", event)}
              onOpenOverview={() => {
                setMode("overview");
                window.setTimeout(() => {
                  const details = document.querySelector<HTMLDetailsElement>('[data-testid="overview-timing-details"]');
                  if (details) details.open = true;
                  document.querySelector('[data-testid="brief-now"]')?.scrollIntoView({ block: "start" });
                }, 150);
              }}
            />
          </div>
        )}

        {mode === "prasna" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <PrasnaPanel result={data} onTopicSelected={(event) => rememberTopic("prasna", event)} />
          </div>
        )}

        {mode === "panchanga" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <PanchangaPanel result={data} />
          </div>
        )}

        {mode === "rectify" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <RectifyPanel
              result={data}
              onExportState={(s) => {
                rectifyState.current = s;
              }}
            />
          </div>
        )}

        {mode === "validate" && (
          <div className="mt-8 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <ValidatePanel result={data} />
          </div>
        )}

        {mode === "bnn" && (
          <div className="mt-6 animate-in fade-in-0 duration-300" lang={englishFallback}>
            <Chapters tab="bnn" chapters={bnnChapters}>
              <Chapter id="topic-check"><TopicReadingPanel result={data} system="bnn" onSelected={(event) => rememberTopic("bnn", event)} /></Chapter>
              <Chapter id="brief">
                <BnnVerdict result={data} />
                <BnnLifeTimeline
                  className="mt-6"
                  transits={data.transits}
                  positions={positions}
                  findings={data.reading.findings}
                  birthIso={data.utc}
                  chart={data.chart}
                  roles={data.reading.roles}
                  asOfIso={data.now.asOf}
                  deathIso={data.chart.deathDate}
                  events={data.chart.events}
                  zone={data.chart.timezone}
                />
              </Chapter>
              <Chapter id="areas">
                {bnnGrid(
                  <>
                    <Working
                      id="planet-table"
                      label="Show the planet table"
                      count={positions.length}
                    >
                      <PlanetTable
                        positions={positions}
                        strength={data.reading.strength}
                        selected={selected}
                        onSelect={setSelected}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Click a planet to focus the reading on it. Longitudes are
                        sidereal. c <Term k="combust">combust</Term> · w leads an
                        enemy by <Term k="degree-order">degree</Term> · struck
                        dignity is <Term k="set-aside">set aside</Term> by a Nadi
                        rule.
                      </p>
                    </Working>
                    <div className="mt-8">
                      <Reading result={data} selected={selected} part="areas" />
                    </div>
                  </>,
                )}
              </Chapter>
              <Chapter id="karakas">
                {bnnGrid(
                  <Reading result={data} selected={selected} part="karakas" />,
                )}
              </Chapter>
              <Chapter id="timing">
                {bnnGrid(
                  <Timeline
                    transits={data.transits}
                    positions={positions}
                    findings={data.reading.findings}
                    birthIso={data.utc}
                    chart={data.chart}
                    selected={selected}
                    roles={data.reading.roles}
                    asOfIso={lifeAsOf(data.chart, new Date().toISOString())}
                    zone={data.chart.timezone || "UTC"}
                  />,
                )}
              </Chapter>
              <Chapter id="relations">
                {bnnGrid(
                  <Relations
                    relations={data.reading.relations}
                    positions={positions}
                  />,
                )}
              </Chapter>
            </Chapters>
          </div>
        )}

        </div>
        <LifeEventsSection chart={chart} />
        <footer className="mt-12 border-t pt-4 text-xs text-muted-foreground" lang={englishFallback}>
          {mode === "bnn"
            ? "Interpretive text follows the general principles of Bhrigu Nandi Nadi as taught by R.G. Rao and Satyanarayana Naik. It is a starting set of rules meant to be extended, not a verdict."
            : mode === "alp"
              ? "Akshaya Lagna Paddhati is Dr. S. Pothuvudaimoorthy's method. The progression arithmetic follows the published rate; the interpretive rules are being entered from the printed volumes chapter by chapter and are a framework, not a verdict."
              : mode === "parashari"
                ? "Parashari text is paraphrased from Brihat Parashara Hora Sastra in R. Santhanam's translation (chapters 24, 26, 34, 36, 41, 42, 75), softened and with verse numbers kept for checking. Planetary strength (ch. 27-28), divisional charts (ch. 6-7), Ashtakavarga (ch. 66-72) and the dasa chapters (46 for the conditional systems and Kalachakra, 47-49 and 52-61 for effects) are applied mechanically; the Sripati chalit, portion stages and the effect amounts of 28.15-20 are provisional readings. A first pass, not a verdict."
                : mode === "rectify" || mode === "validate"
                  ? "Rectification and validation are exploratory checks. Each method scores one system at a time. A high score can occur across a wide range of birth times and does not by itself establish the birth time or validate a rule."
                  : mode === "kp"
                    ? "Krishnamurti Paddhati is Prof. K.S. Krishnamurti's stellar method. The arithmetic (KP ayanamsa, Placidus cusps, subs, significators, Vimshottari) is complete; the cuspal readings are paraphrased from Astro Secrets & KP Part 3 and the Kalpurush class notes and are a first pass, not a verdict."
                    : mode === "overview"
                      ? "The Overview sets each system's own reading side by side and shows where they agree or differ. Nothing is blended: every line comes from one tab and is read there in full."
                      : mode === "prasna"
                        ? "Prasna Marga is paraphrased from B.V. Raman's English translation and cited by chapter and stanza. The house walk uses the birth chart; the separate question view currently uses a stored sky snapshot at the birth location, which must not be assumed to be the question's time and place. A first pass, not a verdict."
                        : mode === "panchanga"
                          ? "The panchanga follows Surya Siddhanta (tr. Burgess) with ending times from the ephemeris; transits from the birth Moon follow Brihat Samhita 104 and Phaladeepika 26. These are day-and-transit tables, not a reading of the chart."
                          : "Jaimini text follows the Jaimini Sutras and the Upapada chapter of Brihat Parashara Hora Sastra; Chara dasha follows K.N. Rao's method. It is a starting set of rules meant to be extended, not a verdict."}
        </footer>
        </div>
        </div>

        <ModeBar
          mode={mode}
          onPick={(m) => {
            setMode(m);
            document.querySelector("main")?.scrollTo({ top: 0 });
          }}
          onOpenChart={openReference}
        />
        <button type="button" aria-haspopup="dialog" onClick={openReference} className="reference-floating-trigger fixed bottom-4 right-4 z-40 hidden min-h-11 rounded-full border bg-card px-4 text-sm font-medium shadow-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:block" data-testid="reference-floating-open">{t("Open birth chart")}</button>
        <Dialog open={referenceOpen} onOpenChange={setReferenceOpen}>
          <DialogContent
            closeLabel={t("Close chart")}
            closeClassName="right-2 top-2 flex h-11 w-11 items-center justify-center"
            className="max-h-[90svh] w-[min(94vw,42rem)] max-w-none overflow-y-auto p-5 sm:p-6"
            onCloseAutoFocus={(event) => {
              const candidates = [referenceTrigger.current, ...Array.from(document.querySelectorAll<HTMLButtonElement>('[data-testid="reference-mobile-open"], [data-testid="reference-floating-open"], [data-testid="reference-enlarge"]'))];
              const trigger = candidates.find((candidate) => candidate?.isConnected && candidate.getClientRects().length);
              if (trigger) {
                event.preventDefault();
                trigger.focus();
              }
            }}
          >
            <DialogHeader className="pr-12 text-left">
              <DialogTitle>{t("Birth chart reference")}</DialogTitle>
              <DialogDescription>{t("Explore the positions at the entered birth time.")}</DialogDescription>
            </DialogHeader>
            <ReferenceChart result={data} mode={mode} selected={referencePlanet} onSelect={setReferencePlanet} showTransits={referenceTransits} onToggleTransits={() => setReferenceTransits((v) => !v)} instance="dialog" />
          </DialogContent>
        </Dialog>
      </div>
      </ChapterMemoryProvider>
    </DeceasedProvider>
  );
}
