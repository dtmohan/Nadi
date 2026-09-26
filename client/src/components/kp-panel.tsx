import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import type { KpBase } from "@shared/kp";
import { apiRequest } from "@/lib/queryClient";
import { useJudgePlace } from "@/lib/judge-place";
import { JudgePlaceControl } from "@/components/judge-place";
import {
  PLANET_ABBR,
  SIGN_ABBR,
  fmtDegShort,
  type Planet,
} from "@shared/astro";
import {
  computeKp,
  significatorMap,
  jointPeriods,
  type KpPeriod,
  type SignificatorLevel,
} from "@shared/kp";
import {
  ageYears,
  areaSeason,
  seasonStart,
  HOUSE_AREA,
  KP_EVENT_AREA,
} from "@shared/life-stage";
import {
  scoreWindows,
  sunPeaks,
  negatingHouses,
  FRUIT_LABEL,
  LEVEL_LABEL,
  type ScoredWindow,
  type SunSample,
  type LordCheck,
  type WindowVerdict,
} from "@shared/kp-windows";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  KP_RULES,
  KP_CUSP_THEMES,
  KP_SOURCES,
  KP_TYPE_LEVEL_LABEL,
  type KpFinding,
} from "@shared/rules-kp";
import { Working } from "@/components/working";
import { VerdictCard, type VerdictSignature } from "@/components/verdict-card";
import { gist, firstClause } from "@shared/synthesis";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { useReadingMode } from "@/lib/reading-mode";
import {
  PlanetName,
  SignName,
  PlanetLegend,
  planetColor,
} from "@/components/planet-name";
import { LifeTimeline, type TlWindow } from "@/components/life-timeline";
import { eventMarks, vimshottariBands } from "@/lib/timeline-data";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const fmtMonth = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const ordinal = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** Event templates: the houses whose significators' conjoined periods KP times a matter by. */
const EVENTS: Array<{
  id: string;
  label: string;
  houses: number[];
  cusp: number;
}> = [
  { id: "marriage", label: "Marriage", houses: [2, 7, 11], cusp: 7 },
  { id: "children", label: "Childbirth", houses: [2, 5, 11], cusp: 5 },
  {
    id: "job",
    label: "Employment, promotion",
    houses: [2, 6, 10, 11],
    cusp: 10,
  },
  { id: "business", label: "Business gains", houses: [2, 7, 10, 11], cusp: 10 },
  { id: "property", label: "House, property", houses: [4, 11, 12], cusp: 4 },
  { id: "vehicle", label: "Vehicle", houses: [3, 11, 12], cusp: 4 }, // Part 1 pp. 135-137: roadworthy vehicles need 3, 11, 12; the 4th alone is static
  { id: "education", label: "Higher education", houses: [4, 9, 11], cusp: 4 },
  { id: "foreign", label: "Foreign travel", houses: [3, 9, 12], cusp: 12 },
  { id: "loan", label: "Loans, money received", houses: [2, 6, 11], cusp: 6 },
  {
    id: "litigation",
    label: "Litigation success",
    houses: [1, 6, 11],
    cusp: 6,
  },
  {
    id: "recovery",
    label: "Recovery from illness",
    houses: [1, 5, 9, 11],
    cusp: 1,
  },
  {
    id: "illness",
    label: "Illness, hospitalisation",
    houses: [6, 8, 12],
    cusp: 6,
  },
  { id: "move", label: "Change of residence", houses: [3, 12], cusp: 4 },
];

const POLARITY_CLASS = {
  good: "bg-verdict-good",
  bad: "bg-verdict-bad",
  neutral: "bg-muted-foreground/50",
} as const;

function Houses({
  houses,
  hilite = [],
}: {
  houses: number[];
  hilite?: number[];
}) {
  if (!houses.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="tabular">
      {houses.map((h, i) => (
        <span
          key={h}
          className={cn(hilite.includes(h) && "font-semibold text-foreground")}
        >
          {h}
          {i < houses.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}

function PlanetList({ planets }: { planets: Planet[] }) {
  if (!planets.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5">
      {planets.map((p) => (
        <PlanetName key={p} planet={p} abbr />
      ))}
    </span>
  );
}

function PeriodRow({
  p,
  testId,
  sig,
}: {
  p: KpPeriod;
  testId: string;
  sig: Map<Planet, number[]>;
}) {
  return (
    <TableRow className={cn(p.current && "bg-primary/5")} data-testid={testId}>
      <TableCell className="py-1.5 font-medium">
        <PlanetName planet={p.lord} />
        {p.current && (
          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
            now
          </span>
        )}
      </TableCell>
      <TableCell className="py-1.5 text-right tabular">
        {p.ageStart.toFixed(1)}–{p.ageEnd.toFixed(1)}
      </TableCell>
      <TableCell className="py-1.5 tabular">{fmtMonth(p.start)}</TableCell>
      <TableCell className="hidden py-1.5 tabular sm:table-cell">
        {fmtMonth(p.end)}
      </TableCell>
      <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
        <Houses houses={sig.get(p.lord) ?? []} />
      </TableCell>
    </TableRow>
  );
}

const sunPeakLabel = (a: string, b: string) => {
  const s = DateTime.fromISO(a);
  const e = DateTime.fromISO(b);
  if (s.hasSame(e, "day")) return s.toFormat("d LLL yyyy");
  if (s.hasSame(e, "month"))
    return `${s.toFormat("d")}–${e.toFormat("d LLL yyyy")}`;
  if (s.hasSame(e, "year"))
    return `${s.toFormat("d LLL")}–${e.toFormat("d LLL yyyy")}`;
  return `${s.toFormat("d LLL yyyy")}–${e.toFormat("d LLL yyyy")}`;
};

const VERDICT_STYLE: Record<WindowVerdict, string> = {
  strong:
    "border-emerald-700/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300",
  fair: "border-amber-700/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  weak: "border-border bg-muted text-muted-foreground",
};

function VerdictChip({
  verdict,
  score,
  max,
}: {
  verdict: WindowVerdict;
  score: number;
  max: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        VERDICT_STYLE[verdict],
      )}
      data-testid="kp-window-verdict"
    >
      {verdict}
      <span className="font-normal normal-case tabular opacity-80">
        {score}/{max}
      </span>
    </span>
  );
}

const ROLE_LABEL: Record<
  LordCheck["role"],
  { plain: string; practitioner: string }
> = {
  dasa: { plain: "period", practitioner: "dasa" },
  bhukti: { plain: "sub-period", practitioner: "bhukti" },
  antara: { plain: "sub-sub-period", practitioner: "antara" },
};

/** The drill-down for one window: each lord's grade, its sub lord's verdict, the cuspal promise and the Sun's runs. */
function WindowDrill({
  w,
  houses,
  plain,
  sunState,
}: {
  w: ScoredWindow;
  houses: number[];
  plain: boolean;
  sunState: "loading" | "error" | "ready";
}) {
  const key = plain ? "plain" : "practitioner";
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {w.lords.map((l) => (
          <li
            key={l.role}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            data-testid={`kp-drill-${l.role}`}
          >
            <span className="w-24 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
              {ROLE_LABEL[l.role][key]}
            </span>
            <PlanetName planet={l.planet} />
            <span>
              {plain ? "speaks for" : "signifies"}{" "}
              <Houses houses={l.hits} hilite={houses} /> (
              {LEVEL_LABEL[l.bestLevel]})
              {l.negHits.length ? (
                <span className="text-muted-foreground">
                  , {plain ? "also against" : "also negating"}{" "}
                  {l.negHits.join(", ")}
                </span>
              ) : null}
              {l.retrograde ? (
                <span className="text-muted-foreground">
                  {" "}
                  · retrograde (delay, provisional)
                </span>
              ) : null}
            </span>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span>
              {plain ? "stands in the sub of" : "in the sub of"}{" "}
              <PlanetName planet={l.subLord} abbr />{" "}
              <span
                className={cn(
                  l.fruit === "fruitful" &&
                    "text-emerald-700 dark:text-emerald-300",
                  l.fruit === "denied" && "text-destructive",
                  l.fruit === "mixed" && "text-amber-700 dark:text-amber-300",
                )}
              >
                {FRUIT_LABEL[l.fruit][key]}
              </span>
              {l.subHits.length || l.subNeg.length ? (
                <span className="text-muted-foreground">
                  {" "}
                  (
                  {[...l.subHits, ...l.subNeg].sort((a, b) => a - b).join(", ")}
                  )
                </span>
              ) : null}
            </span>
            {l.tenants.length ? (
              <span className="text-muted-foreground">
                · {plain ? "its stars hold" : "stars tenanted by"}{" "}
                {l.tenants.map((t) => PLANET_ABBR[t]).join(" ")}
              </span>
            ) : null}
            <span className="ml-auto tabular text-muted-foreground">
              {l.points}/{l.max}
            </span>
          </li>
        ))}
        <li
          className="flex flex-wrap items-baseline gap-x-2"
          data-testid="kp-drill-cusp"
        >
          <span className="w-24 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
            {plain ? `${ordinal(w.cusp)} house` : `${ordinal(w.cusp)} cusp`}
          </span>
          <span>
            {plain ? "decided by" : "sub lord"}{" "}
            <PlanetName planet={w.cuspSubLord} abbr />,{" "}
            {w.promised
              ? plain
                ? "which promises the matter"
                : "signifying the matter: promised"
              : plain
                ? "which does not promise the matter"
                : "not signifying the matter: not promised"}
          </span>
          <span className="ml-auto tabular text-muted-foreground">
            {w.promised ? 2 : 0}/2
          </span>
        </li>
        <li
          className="flex flex-wrap items-baseline gap-x-2"
          data-testid="kp-drill-sun"
        >
          <span className="w-24 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
            Sun
          </span>
          <span>
            {sunState === "loading" ? (
              <span className="text-muted-foreground">
                working out the Sun's path…
              </span>
            ) : sunState === "error" || !w.sun ? (
              <span className="text-muted-foreground">
                Sun transit unavailable
              </span>
            ) : w.sun.length ? (
              <>
                {plain
                  ? "crosses a zone ruled by these planets on "
                  : "transits the sensitive zone "}
                {w.sun.map((p, i) => (
                  <span key={p.start}>
                    {i > 0 && "; "}
                    <span className="font-medium text-foreground">
                      {sunPeakLabel(p.start, p.end)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      (
                      {[
                        p.via.sign && `${PLANET_ABBR[p.via.sign]} sign`,
                        p.via.star && `${PLANET_ABBR[p.via.star]} star`,
                        p.via.sub && `${PLANET_ABBR[p.via.sub]} sub`,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      )
                    </span>
                  </span>
                ))}
                {plain
                  ? ". The Moon then picks the day."
                  : ". Moon's transit picks the day (Part 2 p. 145)."}
              </>
            ) : (
              <span className="text-muted-foreground">
                {plain
                  ? "never crosses a zone ruled by two of these planets inside this window"
                  : "no day in the window has the Sun's star and another of its lords among the three"}
              </span>
            )}
          </span>
        </li>
      </ul>
      <p className="text-2xs text-muted-foreground">
        {plain
          ? "Grade 1-4 for how the planet speaks, plus 2 to minus 2 for the planet whose sub it stands in, minus 1 when it also speaks against the matter; the house promise adds 2. Strong needs the promise, at least two of the three sub lords speaking for the matter alone, and 13 or more of 20. A sub lord that is silent or speaks only against the matter makes the window weak."
          : "Points: grade 1-4 by step (A-D), fruit +2 fruitful / +1 mixed / 0 barren / -2 denied, -1 when the lord itself signifies a negating house (provisional); cuspal promise +2. Strong: promised, at least two lords fruitful, 13 or more of 20 (threshold provisional). Weak: any lord barren or denied by its sub lord (Method I, Part 2 p. 24)."}
      </p>
    </div>
  );
}

export function KpPanel({ result }: { result: ChartResult }) {
  const { chart } = result;
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  const [asOf, setAsOf] = useState(() => DateTime.local().toISODate()!);
  const [sixStep, setSixStep] = useState(false);
  // Default to the first matter that is in season at the native's age; a child's chart opens on education, not marriage.
  const [event, setEvent] = useState<string>(() =>
    areaSeason("marriage", result.utc, DateTime.local().toISO()!).inSeason
      ? "marriage"
      : "education",
  );
  const [showAllCusps, setShowAllCusps] = useState(false);

  const asOfIso = useMemo(() => {
    const d = DateTime.fromISO(asOf, { zone: chart.timezone });
    return d.isValid ? d.toISO()! : DateTime.local().toISO()!;
  }, [asOf, chart.timezone]);

  // Ruling planets are taken for the astrologer's place when one is set; the server's snapshot is for the birth place.
  const judge = useJudgePlace();
  const judgeNow = useQuery<KpBase["now"]>({
    queryKey: [
      "kp-ruling",
      judge?.latitude,
      judge?.longitude,
      judge?.timezone,
      chart.nodeType,
      result.utc,
    ],
    enabled: Boolean(judge),
    queryFn: async () =>
      (await (
        await apiRequest("POST", "/api/kp/ruling", {
          latitude: judge!.latitude,
          longitude: judge!.longitude,
          timezone: judge!.timezone,
          label: judge!.label,
          nodeType: chart.nodeType === "true" ? "true" : "mean",
        })
      ).json()) as KpBase["now"],
    staleTime: 60_000,
  });
  const kpBase = useMemo<KpBase>(
    () =>
      judge && judgeNow.data ? { ...result.kp, now: judgeNow.data } : result.kp,
    [result.kp, judge, judgeNow.data],
  );
  const judgeZone = judge?.timezone ?? chart.timezone;
  const judgeLabel = judge?.label ?? chart.place;
  const kp = useMemo(
    () => computeKp(kpBase, result.utc, asOfIso, sixStep),
    [kpBase, result.utc, asOfIso, sixStep],
  );
  const sig = useMemo(() => significatorMap(kp, sixStep), [kp, sixStep]);
  const ev = EVENTS.find((e) => e.id === event) ?? EVENTS[0];
  const evArea = KP_EVENT_AREA[ev.id];
  const evSeason = evArea
    ? areaSeason(evArea, result.utc, asOfIso)
    : { inSeason: true as const };
  // For a matter not yet in season the conjoined periods are searched from the onset age, not from today.
  const searchFrom = useMemo(
    () =>
      evArea
        ? DateTime.fromISO(seasonStart(evArea, result.utc, asOfIso), {
            zone: chart.timezone,
          }).toISO()!
        : asOfIso,
    [evArea, result.utc, asOfIso, chart.timezone],
  );
  const rawWindows = useMemo(() => {
    const ws = jointPeriods(
      kp.vimshottari,
      sig,
      ev.houses,
      result.utc,
      searchFrom,
      30,
    );
    if (searchFrom === asOfIso) return ws;
    // Windows before the onset are not windows for this matter; past and running flags stay relative to the real as-of date.
    return ws
      .filter((w) => w.end >= searchFrom)
      .map((w) => ({
        ...w,
        past: w.end < asOfIso,
        current: w.start <= asOfIso && asOfIso < w.end,
      }));
  }, [kp.vimshottari, sig, ev, result.utc, searchFrom, asOfIso]);
  const [showPast, setShowPast] = useState(false);
  // The Sun's daily path over the span the windows cover, for the transit check (Part 2 pp. 143-145, 219-220).
  const sunSpan = useMemo(() => {
    if (!rawWindows.length) return null;
    const earliest = rawWindows
      .reduce((m, w) => (w.start < m ? w.start : m), rawWindows[0].start)
      .slice(0, 10);
    const yearAgo = DateTime.fromISO(asOfIso).minus({ years: 1 }).toISODate()!;
    const a = showPast ? earliest : earliest > yearAgo ? earliest : yearAgo;
    const b = rawWindows
      .reduce((m, w) => (w.end > m ? w.end : m), rawWindows[0].end)
      .slice(0, 10);
    return { start: a, end: b };
  }, [rawWindows, showPast, asOfIso]);
  const sunPath = useQuery<SunSample[]>({
    queryKey: ["kp-sun-path", sunSpan?.start, sunSpan?.end],
    enabled: Boolean(sunSpan),
    queryFn: async () => {
      const r = (await (
        await apiRequest("POST", "/api/kp/sun-path", sunSpan)
      ).json()) as { start: string; lons: number[] };
      const d0 = DateTime.fromISO(r.start, { zone: "utc" });
      return r.lons.map((lon, i) => ({
        date: d0.plus({ days: i }).toISODate()!,
        lon,
      }));
    },
    staleTime: 6 * 60 * 60 * 1000,
  });
  const allWindows = useMemo<ScoredWindow[]>(() => {
    const scored = scoreWindows(
      rawWindows,
      ev.houses,
      ev.cusp,
      kp.planets,
      kp.cusps,
      kp.significators,
      sig,
    );
    if (!sunPath.data) return scored;
    return scored.map((w) => ({ ...w, sun: sunPeaks(w, sunPath.data!) }));
  }, [
    rawWindows,
    ev,
    kp.planets,
    kp.cusps,
    kp.significators,
    sig,
    sunPath.data,
  ]);
  const [showWeak, setShowWeak] = useState(false);
  const [openWindow, setOpenWindow] = useState<string | null>(null);
  const windows = useMemo(
    () =>
      allWindows.filter(
        (w) => (showPast || !w.past) && (showWeak || w.verdict !== "weak"),
      ),
    [allWindows, showPast, showWeak],
  );
  const pastCount = allWindows.filter(
    (w) => w.past && (showWeak || w.verdict !== "weak"),
  ).length;
  const weakCount = allWindows.filter(
    (w) => w.verdict === "weak" && (showPast || !w.past),
  ).length;
  const strongCount = allWindows.filter(
    (w) => w.verdict === "strong" && !w.past,
  ).length;
  const negating = useMemo(() => negatingHouses(ev.houses), [ev]);

  // Shared timeline: the dasas and bhuktis, the joint periods that carry the chosen matter, and the recorded events.
  const tlBands = useMemo(
    () => vimshottariBands(kp.vimshottari),
    [kp.vimshottari],
  );
  const tlWindows = useMemo<TlWindow[]>(
    () =>
      allWindows
        .filter((w) => showWeak || w.verdict !== "weak")
        .map((w) => ({
          start: w.start,
          end: w.end,
          label: `${ev.label}: ${PLANET_ABBR[w.dasaLord]}–${PLANET_ABBR[w.bhuktiLord]}–${PLANET_ABBR[w.antaraLord]} (${w.verdict}, ${w.score}/${w.max})`,
          tone: w.verdict === "weak" ? ("mixed" as const) : ("good" as const),
          strength:
            w.verdict === "strong" ? 1 : w.verdict === "fair" ? 0.55 : 0.3,
        })),
    [allWindows, ev.label, showWeak],
  );
  const tlMarks = useMemo(
    () => eventMarks(chart.events, chart.timezone),
    [chart.events, chart.timezone],
  );

  const lagna = kp.cusps[0];
  const moon = kp.planets.find((p) => p.planet === "Moon")!;
  const cur = kp.vimshottari.current;
  const findingsByCusp = useMemo(() => {
    const m = new Map<number, KpFinding[]>();
    for (const f of kp.findings) m.set(f.cusp, [...(m.get(f.cusp) ?? []), f]);
    return m;
  }, [kp.findings]);
  const levels: SignificatorLevel[] = sixStep
    ? ["A", "B", "C", "D", "E", "F"]
    : ["A", "B", "C", "D"];
  const cuspsToShow =
    mode === "practitioner" || showAllCusps
      ? kp.cusps
      : kp.cusps.filter((c) =>
          (findingsByCusp.get(c.house) ?? []).some(
            (f) => f.polarity !== "neutral" || f.topic !== "Sources of income",
          ),
        );
  const planetsFor = (houses: number[]) =>
    kp.planets
      .filter((p) => (sig.get(p.planet) ?? []).some((h) => houses.includes(h)))
      .map((p) => p.planet);
  const houseLabel = (h: number) =>
    h === kp.badhaka
      ? `${h} (badhaka)`
      : kp.marakas.includes(h)
        ? `${h} (maraka)`
        : `${h}`;
  const briefFindings = kp.findings.filter(
    (f) => f.topic !== "Sources of income",
  );
  const goodSet = new Set(
    briefFindings.filter((f) => f.polarity === "good").map((f) => f.cusp),
  );
  const badSet = new Set(
    briefFindings.filter((f) => f.polarity === "bad").map((f) => f.cusp),
  );
  const byHouse = (a: Set<number>, b: Set<number>, both: boolean) =>
    Array.from(a)
      .filter((h) => b.has(h) === both)
      .sort((x, y) => x - y);
  const age = ageYears(result.utc, asOfIso);
  const heldHouses = Object.entries(HOUSE_AREA)
    .filter(([, area]) => !areaSeason(area, result.utc, asOfIso).inSeason)
    .map(([h]) => Number(h));
  const inSeasonHouse = (h: number) => !heldHouses.includes(h);
  const promisedCusps = byHouse(goodSet, badSet, false).filter(inSeasonHouse);
  const deniedCusps = byHouse(badSet, goodSet, false).filter(inSeasonHouse);
  const mixedCusps = byHouse(goodSet, badSet, true).filter(inSeasonHouse);
  const heldWithVerdict = heldHouses
    .filter((h) => goodSet.has(h) || badSet.has(h))
    .sort((x, y) => x - y);
  const nextWindow = allWindows.find((w) => !w.past);
  const kpSignatures: VerdictSignature[] = useMemo(() => {
    const order = [1, 7, 10, 2, 5, 4, 11, 6, 8, 12, 3, 9];
    const out: VerdictSignature[] = [];
    for (const h of order) {
      if (heldHouses.includes(h)) continue;
      const f = briefFindings.find(
        (x) => x.cusp === h && x.polarity !== "neutral",
      );
      if (!f) continue;
      out.push({
        planets: [f.subLord],
        label: `${ordinal(h)} house · ${KP_CUSP_THEMES[h].split(",")[0]}`,
        text: firstClause(gist(f.text)),
        tone: f.polarity === "good" ? "good" : "bad",
      });
      if (out.length >= 3) break;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kp.findings, heldHouses.join(",")]);
  const themeList = (hs: number[]) => {
    const names = hs
      .slice(0, 3)
      .map((h) => KP_CUSP_THEMES[h].split(",")[0].toLowerCase());
    const more = hs.length - names.length;
    const base =
      names.length <= 1
        ? names.join("")
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    return more > 0 ? `${base} (${more} more)` : base;
  };
  const listHouses = (hs: number[]) =>
    hs
      .map(
        (h) =>
          `${ordinal(h)} (${KP_CUSP_THEMES[h].split(",")[0].toLowerCase()})`,
      )
      .join(", ");

  return (
    <div data-testid="kp-panel">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="outline" className="no-default-hover-elevate tabular">
          KP ayanamsa {kp.ayanamsaValue.toFixed(3)}°
        </Badge>
        <Badge
          variant="secondary"
          className="no-default-hover-elevate tabular"
          data-testid="text-kp-lagna"
        >
          {plain ? "Rising sign" : "Lagna"} {lagna.sign}{" "}
          {fmtDegShort(lagna.degInSign)}
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate"
          data-testid="text-kp-lagna-lords"
        >
          <span className="inline-flex items-center gap-1.5">
            <Term k="kp-sub-lord">{plain ? "decided by" : "sub lord"}</Term>{" "}
            <PlanetName planet={lagna.subLord} abbr /> ·{" "}
            {plain ? "in the star of" : "star"}{" "}
            <PlanetName planet={lagna.starLord} abbr />
          </span>
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate"
          data-testid="text-kp-moon"
        >
          <span className="inline-flex items-center gap-1.5">
            Moon {plain ? "in " : ""}
            {moon.nakshatra} · {plain ? "star of " : ""}
            <PlanetName planet={moon.starLord} abbr />
            {plain ? "" : " star"}
          </span>
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate"
          data-testid="text-kp-badhaka"
        >
          <Term k="kp-badhaka">{plain ? "Obstructing house" : "Badhaka"}</Term>
          &nbsp;{kp.badhaka}th
          {plain ? "" : ` (${kp.lagnaQuality.toLowerCase()} lagna)`} ·{" "}
          {plain ? "harming houses" : "marakas"} 2, 7
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate"
          data-testid="text-kp-dasa"
        >
          <span className="inline-flex items-center gap-1.5">
            {plain ? "Period " : ""}
            <PlanetName planet={cur.dasa.lord} abbr />{" "}
            {plain ? "· sub " : "dasa · "}
            <PlanetName planet={cur.bhukti.lord} abbr />{" "}
            {plain ? "· sub-sub " : "bhukti · "}
            <PlanetName planet={cur.antara.lord} abbr />
            {plain ? "" : " antara"}
          </span>
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          As of
          <Input
            type="date"
            value={asOf}
            onChange={(e) => e.target.value && setAsOf(e.target.value)}
            className="h-7 w-40 text-xs"
            data-testid="input-kp-asof"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => setAsOf(DateTime.local().toISODate()!)}
            data-testid="button-kp-today"
          >
            Today
          </Button>
        </label>
        <div
          role="radiogroup"
          aria-label="Significator depth"
          className="inline-flex rounded-md border p-0.5"
        >
          {(
            [
              [false, "4-step"],
              [true, "6-step"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={sixStep === v}
              onClick={() => setSixStep(v)}
              className={cn(
                "rounded px-2 py-0.5",
                sixStep === v
                  ? "bg-foreground text-background"
                  : "hover:text-foreground",
              )}
              data-testid={`kp-steps-${label}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span>
          {plain
            ? sixStep
              ? "Six steps: each planet also speaks for the houses of the planet whose sub it stands in (class notes)."
              : "Four steps: each planet speaks for the houses its star's ruler stands in and owns, then for its own."
            : `${sixStep ? "Six steps: the class-note table adds the sub lord's occupancy and ownership." : "Krishnamurti's four steps: star lord's house, own house, star lord's ownership, own ownership."} Placidus cusps; the KP ayanamsa is used here whatever the chart's setting.`}
        </span>
      </div>

      <VerdictCard
        system="Krishnamurti Paddhati"
        headline={
          <>
            {promisedCusps.length ? (
              <>The sub lords promise {themeList(promisedCusps)}</>
            ) : (
              <>No house is promised outright by the rules entered so far</>
            )}
            {deniedCusps.length ? (
              <>
                {promisedCusps.length ? " and" : "; the sub lords"} caution{" "}
                {themeList(deniedCusps)}
              </>
            ) : null}
            {mixedCusps.length ? (
              <>
                ;{" "}
                {mixedCusps.length === 1
                  ? "one house carries"
                  : `${mixedCusps.length} houses carry`}{" "}
                both a promise and a caution
              </>
            ) : null}
            .
          </>
        }
        lead={
          <>
            The rising point is {lagna.sign} {fmtDegShort(lagna.degInSign)},
            decided by {lagna.subLord}, which speaks for houses{" "}
            {(sig.get(lagna.subLord) ?? []).join(", ") || "none"}. The{" "}
            {ordinal(kp.badhaka)} house obstructs for this rising sign; the 2nd
            and 7th can harm health.
          </>
        }
        signatures={kpSignatures}
        timing={[
          {
            label: "Now",
            when: "present",
            text: (
              <>
                {cur.dasa.lord}'s period to {fmt(cur.dasa.end)};{" "}
                {cur.bhukti.lord}'s sub-period until {fmt(cur.bhukti.end)},{" "}
                {cur.antara.lord}'s sub-sub-period until {fmt(cur.antara.end)}
              </>
            ),
          },
          nextWindow
            ? {
                label: ev.label,
                when: nextWindow.current ? "present" : "future",
                text: (
                  <>
                    {fmt(nextWindow.start)} to {fmt(nextWindow.end)} (
                    {nextWindow.dasaLord}-{nextWindow.bhuktiLord}-
                    {nextWindow.antaraLord})
                    {nextWindow.current ? ", running now" : ""}
                    {!evSeason.inSeason
                      ? `; searched from age ${evSeason.from}, the provisional onset for this matter`
                      : ""}
                  </>
                ),
              }
            : {
                label: ev.label,
                when: "future",
                text: (
                  <>
                    no period in the next thirty years has all three period
                    planets speaking for houses {ev.houses.join(", ")}
                  </>
                ),
              },
        ]}
        lines={[
          ...(promisedCusps.length
            ? [{ label: "Promised", text: `The ${listHouses(promisedCusps)}.` }]
            : []),
          ...(deniedCusps.length
            ? [{ label: "Cautioned", text: `The ${listHouses(deniedCusps)}.` }]
            : []),
          ...(mixedCusps.length
            ? [{ label: "Both", text: `The ${listHouses(mixedCusps)}.` }]
            : []),
          ...(heldWithVerdict.length
            ? [
                {
                  label: "Held for later",
                  text: `At age ${Math.floor(age)} the ${listHouses(heldWithVerdict)} ${heldWithVerdict.length === 1 ? "is" : "are"} not yet in season; ${heldWithVerdict.length === 1 ? "its verdict is" : "their verdicts are"} written out below but kept out of the brief (onset ages are provisional conventions).`,
                },
              ]
            : []),
          {
            label: "Method",
            text: "The planet ruling the sub at which a house begins decides whether the house delivers; a matter happens when the period, sub-period and sub-sub-period planets all speak for its houses.",
          },
          {
            label: "Verdicts",
            text: `${briefFindings.length} cuspal ${briefFindings.length === 1 ? "verdict" : "verdicts"} written out below, house by house; pick another matter under When things happen.`,
          },
        ]}
        caveat="Arithmetic complete (KP ayanamsa, Placidus cusps, subs, significators, Vimshottari); the cuspal readings paraphrase Astro Secrets & KP Part 3 and the Kalpurush class notes and are a first pass, not a verdict."
        testid="kp-verdict"
        className="mt-4"
      />

      <ModeText
        className="mt-4 max-w-[76ch] text-sm"
        plain={
          <>
            Krishnamurti's method divides each of the 27 lunar mansions into
            nine unequal parts. The planet ruling the part in which a house
            begins decides whether that house delivers what it promises, and it
            speaks for the houses it is tied to through its star. A matter
            happens when the planets ruling the running period, sub-period and
            sub-sub-period all speak for the houses of that matter. The books
            call the deciding planet the sub lord and say it signifies the
            houses it speaks for; the verdicts below keep that wording. Hover a
            dotted term for its meaning; switch to Practitioner for the cusp,
            planet and significator tables and the page references.
          </>
        }
        practitioner={
          <>
            Krishnamurti Paddhati: Placidus cusps, 249 subs, four-step (or
            six-step) significators, cuspal sub lord verdicts cross-checked
            against Dutta, Vimshottari timing by conjoined periods, ruling
            planets for the moment of judgement.
          </>
        }
      />

      {/* Cusps and planets */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <section data-testid="section-kp-cusps">
          <SectionTitle
            as="h2"
            plain="Where each house begins"
            technical="Cusps"
            className="text-base"
          />
          <ModeText
            plain={
              <>
                Each house begins at a degree; the planet ruling the sub at that
                degree is the one that decides the house.
              </>
            }
            practitioner={
              <>
                Each cusp's sign lord, star lord, sub lord and sub-sub lord. The
                sub lord is the one that decides.
              </>
            }
          />
          <Working id="kp-cusps" label="Show the cusp table" className="mt-3">
            <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2" cards>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Cusp</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Sign</TableHead>
                  <TableHead>Star</TableHead>
                  <TableHead>Sub</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Sub-sub
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kp.cusps.map((c) => (
                  <TableRow
                    key={c.house}
                    data-testid={`row-kp-cusp-${c.house}`}
                    className={cn(c.house === kp.badhaka && "bg-verdict-bad/5")}
                  >
                    <TableCell className="py-1.5 font-medium">
                      {ROMAN[c.house - 1]}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <SignName signIndex={c.signIndex} abbr />{" "}
                        {fmtDegShort(c.degInSign)}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <PlanetName planet={c.signLord} abbr />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <PlanetName planet={c.starLord} abbr />
                    </TableCell>
                    <TableCell className="py-1.5 font-semibold">
                      <PlanetName planet={c.subLord} abbr tone />
                    </TableCell>
                    <TableCell className="hidden py-1.5 sm:table-cell">
                      <PlanetName planet={c.subSubLord} abbr />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Working>
        </section>

        <section data-testid="section-kp-planets">
          <SectionTitle
            as="h2"
            plain="Where the planets stand"
            technical="Planets"
            className="text-base"
          />
          <ModeText
            plain={
              <>
                Each planet's degree, the star and sub it falls in, the house it
                stands in and the houses it owns. Rahu and Ketu own nothing and
                act for the planets they stand with.
              </>
            }
            practitioner={
              <>
                Bhava occupied runs from one cusp to the next (Placidus).
                Ownership is the lordship of the sign on the cusp; Rahu and Ketu
                own nothing and act for their sign lord and companions.
              </>
            }
          />
          <Working
            id="kp-planets"
            label="Show the planet table"
            className="mt-3"
          >
            <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2" cards>
              <TableHeader>
                <TableRow>
                  <TableHead>Planet</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Star</TableHead>
                  <TableHead>Sub</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Sub-sub
                  </TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Owns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kp.planets.map((p) => (
                  <TableRow
                    key={p.planet}
                    data-testid={`row-kp-planet-${p.planet}`}
                  >
                    <TableCell className="py-1.5 font-medium">
                      <PlanetName planet={p.planet} />
                      {p.retrograde &&
                        p.planet !== "Rahu" &&
                        p.planet !== "Ketu" && (
                          <span className="ml-1 text-2xs text-muted-foreground">
                            R
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <SignName signIndex={p.signIndex} abbr />{" "}
                        {fmtDegShort(p.degInSign)}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <PlanetName planet={p.starLord} abbr />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <PlanetName planet={p.subLord} abbr />
                    </TableCell>
                    <TableCell className="hidden py-1.5 sm:table-cell">
                      <PlanetName planet={p.subSubLord} abbr />
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      {p.house}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Houses houses={p.owns} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Working>
        </section>
      </div>

      {/* Significators */}
      <section className="mt-10" data-testid="section-kp-significators">
        <SectionTitle
          as="h2"
          plain="Which planets speak for which houses"
          technical="Significators"
          term="kp-significator"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              A planet speaks for the houses that the ruler of its star stands
              in and owns, and then for the houses it stands in and owns itself,
              in that order of strength. Verdicts and timing both rest on these
              links.
            </>
          }
          practitioner={
            <>
              A planet signifies the houses its star lord occupies and owns, and
              the houses it occupies and owns itself, in that order of strength.
              The house-wise table reads the same links from the other side.
            </>
          }
        />
        <Working
          id="kp-significators"
          label="Show the planet-wise and house-wise tables"
          className="mt-4"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-medium">Planet-wise</p>
              <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2" cards>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planet</TableHead>
                    {levels.map((lv) => (
                      <TableHead
                        key={lv}
                        className="text-center"
                        title={KP_TYPE_LEVEL_LABEL[lv]}
                      >
                        {lv}
                      </TableHead>
                    ))}
                    <TableHead>Signifies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kp.significators.map((s) => (
                    <TableRow
                      key={s.planet}
                      data-testid={`row-kp-sig-${s.planet}`}
                    >
                      <TableCell className="py-1.5 font-medium">
                        <PlanetName planet={s.planet} abbr />
                        {s.agentFor && (
                          <span
                            className="ml-1 text-2xs text-muted-foreground"
                            title={`Acts for ${s.agentFor.join(", ")}`}
                          >
                            ({s.agentFor.map((a) => PLANET_ABBR[a]).join(" ")})
                          </span>
                        )}
                      </TableCell>
                      {levels.map((lv) => (
                        <TableCell
                          key={lv}
                          className="py-1.5 text-center text-xs"
                        >
                          <Houses houses={s.levels[lv]} />
                        </TableCell>
                      ))}
                      <TableCell className="py-1.5 font-medium">
                        <Houses
                          houses={sixStep ? s.housesSix : s.houses}
                          hilite={[kp.badhaka, ...kp.marakas]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-xs text-muted-foreground">
                {levels
                  .map((lv) => `${lv} ${KP_TYPE_LEVEL_LABEL[lv].toLowerCase()}`)
                  .join(" · ")}
                . Bold in the last column: the badhaka ({kp.badhaka}) and maraka
                (2, 7) houses.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">House-wise</p>
              <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2" cards>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">House</TableHead>
                    <TableHead>In star of occupants</TableHead>
                    <TableHead>Occupants</TableHead>
                    <TableHead>In star of owner</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Cusp sub
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kp.houseSignificators.map((h) => (
                    <TableRow
                      key={h.house}
                      data-testid={`row-kp-house-${h.house}`}
                    >
                      <TableCell className="py-1.5 font-medium">
                        {h.house}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs">
                        <PlanetList planets={h.inStarOfOccupants} />
                      </TableCell>
                      <TableCell className="py-1.5 text-xs">
                        <PlanetList planets={h.occupants} />
                      </TableCell>
                      <TableCell className="py-1.5 text-xs">
                        <PlanetList planets={h.inStarOfOwner} />
                      </TableCell>
                      <TableCell className="py-1.5 text-xs">
                        <PlanetName planet={h.owner} abbr />
                      </TableCell>
                      <TableCell className="hidden py-1.5 text-xs lg:table-cell">
                        <PlanetName
                          planet={kp.cusps[h.house - 1].subLord}
                          abbr
                          tone
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Working>
      </section>

      {/* Cuspal sub lord reading */}
      <section className="mt-10" data-testid="section-kp-reading">
        <SectionTitle
          as="h2"
          plain="What each house promises"
          technical="What the cuspal sub lords say"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              For each house, its deciding planet is matched against the{" "}
              {KP_RULES.length} rules entered from the KP books. Green:
              promised. Red: denied or a caution. Grey: descriptive. Only houses
              with a verdict are shown unless you ask for every one.
            </>
          }
          practitioner={
            <>
              {KP_RULES.length} rules so far: the 1st and 2nd cusps from the
              class notes, the consolidated cusp-by-cusp rules of Astro Secrets
              Part 3 chapter 6, and the house-by-house chapter of Part 1 (the
              3rd to 12th houses entered) cross-checked against Dr. Andrew
              Dutta's free bhava rules. Each verdict names the sub lord and the
              houses it signifies. Green: promised. Red: denied or a caution.
              Grey: descriptive.
            </>
          }
        />
        {mode === "plain" && (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setShowAllCusps((v) => !v)}
            data-testid="toggle-kp-all-cusps"
          >
            {showAllCusps
              ? "Show only the houses with a verdict"
              : "Show every house"}
          </button>
        )}
        <div className="mt-4 space-y-6">
          {cuspsToShow.map((c) => {
            const fs = findingsByCusp.get(c.house) ?? [];
            const sl = kp.planets.find((p) => p.planet === c.subLord)!;
            const houses = sig.get(c.subLord) ?? [];
            const main = fs.filter((f) => f.topic !== "Sources of income");
            const income = fs.filter((f) => f.topic === "Sources of income");
            return (
              <article
                key={c.house}
                className="rounded-lg border p-4"
                data-testid={`kp-cusp-reading-${c.house}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {plain
                      ? `${ordinal(c.house)} house`
                      : `Cusp ${ROMAN[c.house - 1]}`}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {KP_CUSP_THEMES[c.house]}
                    </span>
                  </h3>
                  <span className="inline-flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                    <SignName signIndex={c.signIndex} abbr />{" "}
                    {fmtDegShort(c.degInSign)} ·{" "}
                    {plain ? "decided by" : "sub lord"}{" "}
                    <PlanetName planet={c.subLord} abbr tone /> in the{" "}
                    {ordinal(sl.house)}, {plain ? "in the star of" : "star of"}{" "}
                    <PlanetName planet={sl.starLord} abbr /> ·{" "}
                    {plain ? "speaks for" : "signifies"}{" "}
                    <Houses
                      houses={houses}
                      hilite={[kp.badhaka, ...kp.marakas]}
                    />
                  </span>
                </div>
                {main.length ? (
                  <ul className="mt-3 space-y-2">
                    {main.map((f) => (
                      <li
                        key={f.ruleId}
                        className="flex gap-3 text-sm"
                        data-testid={`kp-finding-${f.ruleId}`}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            POLARITY_CLASS[f.polarity],
                          )}
                          aria-label={f.polarity}
                        />
                        <span>
                          <span className="mr-1.5 text-xs font-medium text-muted-foreground">
                            {f.topic}.
                          </span>
                          {f.text}
                          {f.timing && (
                            <span
                              className="ml-1.5 text-xs text-muted-foreground"
                              data-testid={`kp-finding-timing-${f.ruleId}`}
                            >
                              {plain ? (
                                <>
                                  Timing: when the running periods belong to
                                  planets speaking for houses{" "}
                                  {f.timing.join(", ")} (
                                  {planetsFor(f.timing)
                                    .map((p) => PLANET_ABBR[p])
                                    .join(" ")}
                                  ).
                                </>
                              ) : (
                                <>
                                  Timing: joint periods of {f.timing.join("-")}{" "}
                                  significators (
                                  {planetsFor(f.timing)
                                    .map((p) => PLANET_ABBR[p])
                                    .join(" ")}
                                  ).
                                </>
                              )}
                            </span>
                          )}
                          {mode === "practitioner" && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {f.evidence}.{" "}
                              {f.sourceUrl ? (
                                <a
                                  href={f.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                                >
                                  {f.source}
                                </a>
                              ) : (
                                f.source
                              )}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plain
                      ? "No rule entered yet applies to this deciding planet; the houses it speaks for are what the books would be read against."
                      : "No rule entered yet fires for this sub lord; the houses it signifies are what the books would be read against."}
                  </p>
                )}
                {income.length > 0 && (
                  <Working
                    id={`kp-income-${c.house}`}
                    label="Show the sources of income"
                    count={income.length}
                    className="mt-3"
                  >
                    <ul className="space-y-1 text-sm">
                      {income.map((f) => (
                        <li
                          key={f.ruleId}
                          className="text-muted-foreground"
                          data-testid={`kp-finding-${f.ruleId}`}
                        >
                          {f.text}
                        </li>
                      ))}
                    </ul>
                    {mode === "practitioner" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {income[0].source}
                      </p>
                    )}
                  </Working>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Timing */}
      <section className="mt-10" data-testid="section-kp-timing">
        <SectionTitle
          as="h2"
          plain="When things happen"
          technical="Timing: Vimshottari from the Moon"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              Life runs in planetary periods counted from the Moon's star at
              birth, each split into sub-periods and sub-sub-periods. A promised
              matter comes about when all three running planets speak for its
              houses. Pick a matter and the windows in the next thirty years are
              listed; the house must be promised above first.
            </>
          }
          practitioner={
            <>
              A promised matter fructifies when the dasa, bhukti and antara
              lords are all significators of its houses. Pick a matter and the
              windows in the next thirty years are listed; the sub lord of the
              cusp above must promise it first.
            </>
          }
        />
        <LifeTimeline
          className="mt-3"
          testid="kp-timeline"
          birthIso={result.utc}
          asOfIso={asOfIso}
          bands={tlBands}
          windows={tlWindows}
          windowsLabel={ev.label.length > 9 ? "Matter" : ev.label}
          marks={tlMarks}
          defaultRange="decade"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {plain
            ? `${kp.vimshottari.balanceYears.toFixed(2)} years of ${kp.vimshottari.dasas[0].lord}'s period were left at birth. Moon at ${moon.sign} ${fmtDegShort(moon.degInSign)}, ${moon.nakshatra}.`
            : `Balance at birth: ${kp.vimshottari.balanceYears.toFixed(2)} years of ${kp.vimshottari.dasas[0].lord}. Moon at ${moon.sign} ${fmtDegShort(moon.degInSign)}, ${moon.nakshatra}.`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {plain
            ? `The ${ev.label.toLowerCase()} row marks the stretches in the next thirty years when all three running planets speak for the matter's houses and pass the checks below; darkest where the window is strong. Running now: ${cur.dasa.lord}'s period, ${cur.bhukti.lord}'s sub-period (${fmt(cur.dasa.start)} to ${fmt(cur.dasa.end)}).`
            : `The ${ev.label.toLowerCase()} row marks the joint dasa–bhukti–antara periods of the next thirty years whose lords all signify the matter's houses, graded by the checks below; darkest where strong. Running: ${cur.dasa.lord} dasa, ${cur.bhukti.lord} bhukti (${fmt(cur.dasa.start)} to ${fmt(cur.dasa.end)}).`}
        </p>
        <PlanetLegend className="mt-3" />

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Matter:</span>
          {EVENTS.map((e) => (
            <Button
              key={e.id}
              size="sm"
              variant={event === e.id ? "secondary" : "ghost"}
              className={cn(
                "h-7 px-2 text-xs",
                KP_EVENT_AREA[e.id] &&
                  !areaSeason(KP_EVENT_AREA[e.id], result.utc, asOfIso)
                    .inSeason &&
                  "text-muted-foreground/70",
              )}
              title={
                KP_EVENT_AREA[e.id] &&
                !areaSeason(KP_EVENT_AREA[e.id], result.utc, asOfIso).inSeason
                  ? `Not yet in season; read from age ${areaSeason(KP_EVENT_AREA[e.id], result.utc, asOfIso).from}`
                  : undefined
              }
              onClick={() => setEvent(e.id)}
              data-testid={`kp-event-${e.id}`}
            >
              {e.label}
            </Button>
          ))}
        </div>
        {!evSeason.inSeason && (
          <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="text-kp-event-season"
          >
            {ev.label} is not yet in season at age {Math.floor(age)}; the
            periods below are searched from age {evSeason.from} (
            {DateTime.fromISO(evSeason.fromDate!).toFormat("LLL yyyy")}), a
            provisional onset. Greyed matters are the ones held for later.
          </p>
        )}
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-testid="text-kp-event-sig"
        >
          Houses {ev.houses.join(", ")} ·{" "}
          {plain ? "planets speaking for them" : "significators"}:{" "}
          {planetsFor(ev.houses).length
            ? planetsFor(ev.houses)
                .map((p) => PLANET_ABBR[p])
                .join(" ")
            : "none"}{" "}
          · the {ordinal(ev.cusp)}{" "}
          {plain ? "house is decided by" : "cusp sub lord"}{" "}
          <PlanetName planet={kp.cusps[ev.cusp - 1].subLord} abbr />
          {plain ? ", which speaks for" : " signifies"}{" "}
          <Houses
            houses={sig.get(kp.cusps[ev.cusp - 1].subLord) ?? []}
            hilite={ev.houses}
          />
          {" · "}
          {plain ? "houses that work against it" : "negating houses"}{" "}
          {negating.join(", ")}
        </p>
        <ModeText
          className="mt-2 text-xs text-muted-foreground"
          plain={
            <>
              Each window is then drilled the way a birth time is checked: how
              strongly each of the three running planets speaks for the matter,
              whether the planet whose sub it stands in also speaks for it or
              against it, whether the house itself is promised, and on which
              days the Sun crosses a zone ruled by those planets. Windows where
              a running planet stands in the sub of a planet that is silent on
              the matter, or speaks only against it, are set aside as weak.
              (Astro Secrets &amp; KP Part 2 pp. 24-25, 143-148, 219-220; Part 1
              pp. 263-264.)
            </>
          }
          practitioner={
            <>
              Each joint period is drilled as in rectification: the grade of
              each lord's signification (star of occupant, occupant, star of
              owner, owner; Part 2 p. 148), whether the lord is a fruitful
              significator by standing in the sub of a significator of the
              matter (Method I, Part 2 p. 24; p. 148), whether its sub lord
              touches the negating houses, the 12th from each house of the
              matter (Part 2 pp. 24-25; Part 1 pp. 263-264), the cuspal promise,
              and the Sun's transit through a sensitive zone whose sign, star
              and sub lords are the window's own lords (Part 2 pp. 143-145, 154,
              219-220). A lord whose sub lord is not connected with the matter,
              or connected only to its negating houses, marks the window weak
              (Part 2 p. 24). A lord that itself signifies both the matter and a
              negating house loses a point: Part 2 p. 25 rejects it outright,
              the Part 1 worked example keeps it (pp. 264, 274), so the
              weighting is provisional. A retrograde lord is flagged, not
              scored: the delay rule is stated for horary ruling planets (Part 2
              p. 128, p. 220) and is provisional here.
            </>
          }
        />
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-testid="text-kp-window-counts"
        >
          {strongCount} strong window{strongCount === 1 ? "" : "s"} ahead
          {windows.length > 100
            ? ` · first 100 of ${windows.length} listed`
            : ""}
          {sunPath.isPending && sunSpan
            ? " · Sun transit loading"
            : sunPath.isError
              ? " · Sun transit unavailable"
              : ""}
          {pastCount > 0 && (
            <>
              {" · "}
              <button
                type="button"
                className="font-medium underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                onClick={() => setShowPast((v) => !v)}
                data-testid="toggle-kp-past-windows"
              >
                {showPast
                  ? "hide the past windows"
                  : `show ${pastCount} past window${pastCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}
          {weakCount > 0 && (
            <>
              {" · "}
              <button
                type="button"
                className="font-medium underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                onClick={() => setShowWeak((v) => !v)}
                data-testid="toggle-kp-weak-windows"
              >
                {showWeak
                  ? "hide the weak windows"
                  : `show ${weakCount} weak window${weakCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </p>
        {windows.length ? (
          <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2" cards>
            <TableHeader>
              <TableRow>
                <TableHead>{plain ? "Period" : "Dasa"}</TableHead>
                <TableHead>{plain ? "Sub" : "Bhukti"}</TableHead>
                <TableHead>{plain ? "Sub-sub" : "Antara"}</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead className="hidden md:table-cell">
                  Sun agrees
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {windows.slice(0, 100).map((w, i) => {
                const key = `${w.dasaLord}-${w.bhuktiLord}-${w.antaraLord}-${w.start}`;
                const open = openWindow === key;
                return (
                  <Fragment key={key}>
                    <TableRow
                      className={cn(
                        "cursor-pointer",
                        w.current && "bg-primary/5",
                        w.past && "text-muted-foreground",
                        open && "bg-muted/40",
                      )}
                      onClick={() => setOpenWindow(open ? null : key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenWindow(open ? null : key);
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={open}
                      data-testid={`row-kp-window-${i}`}
                    >
                      <TableCell className="py-1.5">
                        <span className="inline-flex items-center gap-1">
                          {open ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          <PlanetName planet={w.dasaLord} abbr />
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <PlanetName planet={w.bhuktiLord} abbr />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <PlanetName planet={w.antaraLord} abbr />
                        {w.current && (
                          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
                            now
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 whitespace-nowrap">
                        {fmt(w.start)}
                      </TableCell>
                      <TableCell className="hidden py-1.5 whitespace-nowrap sm:table-cell">
                        {fmt(w.end)}
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        {w.ageStart.toFixed(1)}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <VerdictChip
                          verdict={w.verdict}
                          score={w.score}
                          max={w.max}
                        />
                      </TableCell>
                      <TableCell className="hidden py-1.5 text-xs md:table-cell">
                        {w.sun === undefined ? (
                          <span className="text-muted-foreground">…</span>
                        ) : w.sun.length ? (
                          w.sun
                            .slice(0, 3)
                            .map((p) => sunPeakLabel(p.start, p.end))
                            .join(" · ") +
                          (w.sun.length > 3 ? ` +${w.sun.length - 3}` : "")
                        ) : (
                          <span className="text-muted-foreground">no run</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow
                        className="hover:bg-transparent"
                        data-detail=""
                        data-testid={`row-kp-window-${i}-detail`}
                      >
                        <TableCell
                          colSpan={8}
                          className="bg-muted/30 px-3 py-3 text-xs"
                        >
                          <WindowDrill
                            w={w}
                            houses={ev.houses}
                            plain={plain}
                            sunState={
                              sunPath.isPending
                                ? "loading"
                                : sunPath.isError
                                  ? "error"
                                  : "ready"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p
            className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground"
            data-testid="text-kp-windows-empty"
          >
            {allWindows.length
              ? plain
                ? `Every window in the next thirty years for houses ${ev.houses.join(", ")} is weak or already past; use the links above to show them.`
                : `Every joint period in the next thirty years for houses ${ev.houses.join("-")} is weak or past; show them with the links above.`
              : plain
                ? `No running or coming period in the next thirty years has all three period planets speaking for houses ${ev.houses.join(", ")}.`
                : `No running or coming dasa-bhukti-antara in the next thirty years has all three lords among the ${ev.houses.join("-")} significators.`}
          </p>
        )}

        <Working
          id="kp-antaras"
          label={
            plain
              ? "Show the sub-sub-periods of the running sub-period"
              : "Show the antaras of the running bhukti"
          }
          className="mt-4"
        >
          <p className="text-xs font-medium">
            {plain
              ? `${cur.dasa.lord}'s period · ${cur.bhukti.lord}'s sub-period`
              : `${cur.dasa.lord} dasa · ${cur.bhukti.lord} bhukti`}{" "}
            ({fmt(cur.bhukti.start)} to {fmt(cur.bhukti.end)})
          </p>
          <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2" cards>
            <TableHeader>
              <TableRow>
                <TableHead>{plain ? "Sub-sub" : "Antara"}</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="hidden md:table-cell">
                  {plain ? "Speaks for" : "Signifies"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kp.vimshottari.antaras.map((a, i) => (
                <PeriodRow
                  key={i}
                  p={a}
                  testId={`row-kp-antara-${i}`}
                  sig={sig}
                />
              ))}
            </TableBody>
          </Table>
        </Working>
      </section>

      {/* Ruling planets */}
      <section className="mt-10" data-testid="section-kp-ruling">
        <SectionTitle
          as="h2"
          plain="Planets ruling this moment"
          technical="Ruling planets at this moment"
          term="kp-ruling-planets"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              Krishnamurti also reads the sky at the moment the chart is judged
              (
              {DateTime.fromISO(kp.ruling.asOf)
                .setZone(judgeZone)
                .toFormat("d LLL yyyy HH:mm")}{" "}
              at {judgeLabel}; reload the chart to refresh): the rulers of the
              sign and star rising now, of the Moon's sign and star now, and of
              the weekday. They help confirm a birth time and settle between
              planets that both speak for a matter. The as-of date above moves
              only the periods.
            </>
          }
          practitioner={
            <>
              Taken for the moment of judgement, which is when this chart was
              opened (
              {DateTime.fromISO(kp.ruling.asOf)
                .setZone(judgeZone)
                .toFormat("d LLL yyyy HH:mm")}{" "}
              at {judgeLabel}, {judgeZone}; reload the chart to refresh): the
              lords of the rising sign and star, of the Moon's sign and star,
              and of the weekday counted from sunrise. Krishnamurti uses them to
              verify birth time and to pick between competing significators; a
              node in a ruling planet's sign joins them. The as-of date above
              moves only the dasa.
            </>
          }
        />
        <JudgePlaceControl
          birthPlace={chart.place}
          birthTimezone={chart.timezone}
        />
        {judge && judgeNow.isFetching && (
          <p className="mt-2 text-xs text-muted-foreground">
            Recomputing the rising sign for {judge.label}…
          </p>
        )}
        {judge && judgeNow.isError && (
          <p className="mt-2 text-xs text-destructive">
            Could not compute the ruling planets for {judge.label}; showing the
            birth place instead.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kp.ruling.list.map((l) => (
            <Badge
              key={l.role}
              variant={l.role.includes("sub") ? "outline" : "secondary"}
              className="no-default-hover-elevate"
              data-testid={`kp-rp-${l.role.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted-foreground">{l.role}</span>{" "}
                <PlanetName planet={l.planet} abbr />
              </span>
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Rising now: {kp.ruling.lagna.sign}{" "}
          {fmtDegShort(kp.ruling.lagna.degInSign)} ({kp.ruling.lagna.nakshatra})
          · Moon now: {kp.ruling.moon.sign}{" "}
          {fmtDegShort(kp.ruling.moon.degInSign)} ({kp.ruling.moon.nakshatra}) ·
          distinct:{" "}
          {kp.ruling.planets
            .map(
              (p) =>
                `${PLANET_ABBR[p.planet]}${p.count > 1 ? `×${p.count}` : ""}`,
            )
            .join(" ")}
        </p>
      </section>

      <section
        className="mt-10 border-t pt-6 text-xs text-muted-foreground"
        data-testid="section-kp-sources"
      >
        <p className="font-medium text-foreground">Method and sources</p>
        <p className="mt-1">
          Sidereal longitudes with the Krishnamurti ayanamsa; Placidus cusps;
          the 249 subs from the nakshatra divided in Vimshottari proportion
          starting with its own lord; sub-subs by the same division of the sub.
          Signification follows Krishnamurti's four steps (star lord's
          occupancy, own occupancy, star lord's ownership, own ownership); the
          six-step toggle adds the sub lord's occupancy and ownership as taught
          in the class notes. Rahu and Ketu stand in for their sign lord and the
          planets sharing their sign. Exaltation, debilitation and their
          cancellation play no part: the strength of a planet is read from the
          sub it occupies, not from its sign (Part 2 p. 13, p. 24). Rules are
          paraphrased and cited by volume and page.
        </p>
        <ul className="mt-2 space-y-1">
          {KP_SOURCES.map((s) => (
            <li key={s.label}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                >
                  {s.label}
                </a>
              ) : (
                <span className="text-foreground">{s.label}</span>
              )}{" "}
              — {s.note}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Pending: Part 1 ch. 17, the twelve lagnas; profession (chs. 34-35);
          ruling planets in depth (Part 2); Jupiter's transit over the sensitive
          zone (the year) and the Moon's (the day); horary.
        </p>
      </section>
    </div>
  );
}
