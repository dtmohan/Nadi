import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DateTime } from "luxon";
import { ChevronDown } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { NAKSHATRAS, PLANET_ABBR, fmtDegShort, type Planet } from "@shared/astro";
import type {
  RectifyBaselineStat,
  RectifyResult,
  RectifySegment,
  RectifySegmentStability,
  RectifyEvent,
  KundaD81Window,
} from "@shared/rectify-types";
import { describeEventMoment, matterOf } from "@shared/events";
import { LifeEventsEditor } from "@/components/life-events";
import { KpTransitEvidencePanel } from "@/components/kp-transit-evidence";
import { ParashariVargaEvidencePanel } from "@/components/parashari-varga-evidence";
import { ParashariPromisePanel } from "@/components/parashari-promise";
import { ParashariSpecificPanel } from "@/components/parashari-specific";
import { ManleyEvidencePanel } from "@/components/manley-evidence";
import { ParashariHierarchyEvent, ParashariHierarchyWindows } from "@/components/parashari-hierarchy";
import { AuroraEventPanel, AuroraLinkDetail, AuroraV2Panel, AuroraV2StagesPanel } from "@/components/kp-aurora-evidence";
import { ParashariComparisonPanel } from "@/components/parashari-comparison";
import { VargaWindowsPanel } from "@/components/varga-windows";
import { kpTransitEvidence } from "@shared/kp-transit-evidence";
import {
  LifeTimeline,
  type TlBand,
  type TlMark,
} from "@/components/life-timeline";
import { charaBands, vimshottariBands } from "@/lib/timeline-data";
import { vimshottari } from "@shared/kp";
import { charaDasha } from "@shared/jaimini";
import { PlanetName } from "@/components/planet-name";
import { ModeText, SectionTitle, usePlain } from "@/components/mode-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { chartsStore, CHARTS_QUERY_KEY } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/lib/i18n";
import { useJudgePlace } from "@/lib/judge-place";
import { JudgePlaceControl } from "@/components/judge-place";
import { setBirthTime } from "@/components/birth-time-editor";
import { Cite } from "@/components/source-link";
import { limbTermsFor, type BodyMarksResult } from "@shared/body-marks";
import {
  RECTIFY_METHODS,
  EVENT_METHODS,
  methodLabel,
  methodScore,
  baselineFor,
  highlightedCandidates,
  rawScoreCoverage,
  groupNemaniSegments,
  type RectifyMethod,
  type RectifyExportState,
} from "@shared/rectify-methods";
import {
  LimbDots,
  MarksChecklist,
  MarksDetail,
} from "@/components/rectify-marks";
import { cn } from "@/lib/utils";

/** Excess over chance and percentile, coloured only when the interval clears the 95th or falls under the 5th. */
function VsChance({ b }: { b: RectifyBaselineStat | undefined }) {
  if (!b) return <span className="text-muted-foreground">—</span>;
  const excess = b.actual - b.mean;
  return (
    <span
      className={cn(
        "tabular text-xs",
        b.verdict === "above"
          ? "text-verdict-good"
          : b.verdict === "below"
            ? "text-verdict-bad"
            : "text-muted-foreground",
      )}
      title={`${b.actual} against a random-date mean of ${b.mean} (sd ${b.sd}); ${ordinalOf(b.percentile)} mid-rank percentile`}
      data-testid="rectify-vs-chance"
    >
      {excess >= 0 ? "+" : "−"}
      {Math.abs(excess).toFixed(1)} · {ordinalOf(b.percentile)}
    </span>
  );
}

const WINDOWS = [10, 15, 30, 60, 120, 180, 240, 360, 720];

/** Degrees within the sign of `from`, so an interval ending on the sign boundary reads 30°00' rather than 0°00'. */
function degRange(from: number, to: number): string {
  const base = Math.floor(from / 30) * 30;
  let a = from - base;
  let b = to - base;
  if (b < a) b += 360;
  const f = (d: number) => {
    const total = Math.round(d * 60);
    return `${Math.floor(total / 60)}°${String(total % 60).padStart(2, "0")}'`;
  };
  return `${f(a)}–${f(Math.min(b, 30))}`;
}

const SIGNS3 = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
];

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

/**
 * Cusps whose sub lord holds through the whole interval, of twelve. A matter cusp (one a dated event
 * names) that changes inside the interval is called out: for that question the interval is two
 * candidates, not one.
 */
function FirmCell({
  st,
  plain,
}: {
  st: RectifySegmentStability | undefined;
  plain: boolean;
}) {
  if (!st) return <span className="text-muted-foreground">—</span>;
  const split = st.matterFirm === false;
  const matterChanging = st.changing.filter((c) => st.matterCusps.includes(c));
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 tabular",
        split && "text-verdict-mixed",
      )}
      title={
        st.changing.length
          ? `${plain ? "Deciding planet changes inside this slice for the" : "Sub lord changes inside the interval on the"} ${st.changing.map(ordinalOf).join(", ")}${split ? `; the matter's ${matterChanging.map(ordinalOf).join(", ")} among them` : ""}. Interval ${Math.round(st.seconds)} s long.`
          : `Every cusp has the same sub lord at the sampled start, midpoint and end (${Math.round(st.seconds)} s).`
      }
      data-testid="rectify-firm"
      data-split={split}
    >
      {st.firm}/12
      {split && (
        <span className="rounded border border-verdict-mixed/50 px-1 text-2xs uppercase tracking-wide">
          {plain ? "splits" : "matter cusp splits"}
        </span>
      )}
    </span>
  );
}

const ordinalOf = (n: number) => {
  const lastTwo = n % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${suffix}`;
};

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
        {Number.isInteger(score) ? score : score.toFixed(1)}/{max}
      </span>
    </span>
  );
}

export function RectifyPanel({
  result,
  onExportState,
}: {
  result: ChartResult;
  /** Reports what the tab is looking at, so the chart page can export the same scan as a PDF. */
  onExportState?: (s: RectifyExportState | null) => void;
}) {
  const { chart } = result;
  const { locale } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  // Open on the dated events when the chart has any: that method can be checked against chance; the ruling planets cannot.
  const [method, setMethod] = useState<RectifyMethod>(
    chart.events?.length ? "kp-events" : "kp-rp",
  );
  const m = RECTIFY_METHODS.find((x) => x.id === method)!;
  const isParashariMethod = method === "parashari-events" || method === "parashari-events-v2" || method === "parashari-events-v3";
  const [showHow, setShowHow] = useState(false);
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [sortByScore, setSortByScore] = useState(false);
  const [showAllKunda, setShowAllKunda] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  // Limbs the person confirms a mark on (Brihat Jataka 5.24-26); memory only, never stored.
  const [confirmedMarks, setConfirmedMarks] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleMark = (l: string) =>
    setConfirmedMarks((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  const judge = useJudgePlace();
  const plain = usePlain();

  // The chart's saved life events are the dated events every method reads.
  const events = chart.events ?? [];
  const eventPayload = useMemo<RectifyEvent[]>(
    () =>
      [...events].sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
        const m = matterOf(e.matter);
        return {
          label: m.label,
          matter: e.matter,
          outcome: e.outcome,
          date: e.date,
          time: e.time,
          timezone: e.timezone,
          houses: m.houses,
          cusp: m.cusp,
          area: m.area,
        };
      }),
    [events],
  );

  const scan = useMutation({
    mutationFn: async () => {
      const { id: _id, ...insert } = chart;
      const res = await apiRequest("POST", "/api/kp/rectify", {
        chart: insert,
        windowMinutes,
        events: eventPayload,
        judge: judge
          ? {
              latitude: judge.latitude,
              longitude: judge.longitude,
              timezone: judge.timezone,
              label: judge.label,
            }
          : undefined,
      });
      return (await res.json()) as RectifyResult;
    },
    onError: (e: any) =>
      toast({
        title: "Could not scan the window",
        description: e.message,
        variant: "destructive",
      }),
  });
  const scanInputsKey = JSON.stringify([
    chart.id, chart.birthDate, chart.birthTime, chart.timezone, chart.timeStandard,
    chart.latitude, chart.longitude, chart.ayanamsa, chart.nodeType, chart.gender,
    windowMinutes, eventPayload, judge,
  ]);
  useEffect(() => {
    // Never keep displaying scores after any of their inputs have changed.
    scan.reset();
    setOpen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanInputsKey]);
  useEffect(() => {
    onExportState?.({
      method,
      windowMinutes,
      events: eventPayload,
      judge: judge
        ? {
            latitude: judge.latitude,
            longitude: judge.longitude,
            timezone: judge.timezone,
            label: judge.label,
          }
        : undefined,
      judgedAsOf: scan.data?.ruling.asOf,
      confirmedMarks: Array.from(confirmedMarks),
    });
    return () => onExportState?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, windowMinutes, eventPayload, judge, confirmedMarks, scan.data?.ruling.asOf]);

  /** Why this interval was chosen, for the notes of the copy or of this chart. */
  const provenance = (seg: RectifySegment | KundaD81Window) => {
    if ("check" in seg) {
      return `by ${m.system} ${methodLabel(m)} (${m.source}): D81 interval ${seg.start} to ${seg.end}, midpoint ${seg.mid}; ${seg.check.via}`;
    }
    const sc = methodScore(seg, method, marksCtx);
    if (method === "kunda") {
      return `by ${m.system} ${methodLabel(m)} (${m.source}): sampled midpoint ${seg.mid}; ${seg.kunda?.via ?? "no result"}. This is not a scan of the full interval`;
    }
    const inputs = [
      m.needsJudge && data
        ? `judged ${DateTime.fromISO(data.ruling.asOf).setZone(data.judgedAt.timezone).toFormat("d LLL yyyy HH:mm")} from ${data.judgedAt.label}`
        : "",
      m.needsEvents && eventPayload.length
        ? `events ${eventPayload.map((e) => `${e.label} ${e.date}`).join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("; ");
    return `by ${m.system} ${methodLabel(m)} (${m.source}): interval ${seg.start} to ${seg.end}, lagna ${seg.sign} sub lord ${seg.subLord}${method === "jaimini-dasha" ? ` (Jaimini lagna ${seg.jaiminiSign.name}, chara dasha ${seg.jaiminiSign.direction})` : ""}${method === "kp-moon" ? ` (${seg.moonLords.star.via}; birth star ${seg.moonLords.birthStar}, Moon in ${seg.moonLords.moonSign})` : ""}${method === "bj-marks" && data ? ` (${data.marks[seg.marksKey ?? seg.drekkana]?.drekkanaLabel}; confirmed ${Array.from(confirmedMarks).join(", ") || "none"})` : ""}${method === "bj-nashta" && seg.bjNashta ? ` (${seg.bjNashta.via})` : ""}, score ${sc.score} of ${sc.max}${inputs ? "; " + inputs : ""}`;
  };

  const saveCopy = useMutation({
    mutationFn: async (seg: RectifySegment | KundaD81Window) => {
      if (seg.selectable === false || (seg.midDate && seg.midDate !== chart.birthDate))
        throw new Error("This candidate cannot be saved on the recorded birth date at whole-second precision.");
      const { id: _id, ...insert } = chart;
      const time = seg.mid;
      const base = chart.name.replace(/\s*\(rectified[^)]*\)\s*$/i, "");
      return chartsStore.create({
        ...insert,
        name: `${base} (rectified ${time.slice(0, 5)})`,
        birthTime: time,
        notes: `${insert.notes ? insert.notes + "\n" : ""}Birth time rectified from ${chart.birthTime} ${provenance(seg)}.`,
      });
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
      toast({
        title: "Saved a rectified copy",
        description: `${c.name} at ${c.birthTime}`,
      });
      navigate(`/chart/${c.id}`);
    },
    onError: (e: any) =>
      toast({
        title: "Could not save the copy",
        description: e.message,
        variant: "destructive",
      }),
  });

  /** Change this chart's birth time in place; the id, name and events stay, every tab recomputes. */
  const useHere = useMutation({
    mutationFn: async (seg: RectifySegment | KundaD81Window) => {
      if (seg.selectable === false || (seg.midDate && seg.midDate !== chart.birthDate))
        throw new Error("This candidate cannot be applied on the recorded birth date at whole-second precision.");
      const c = await setBirthTime(
        chart,
        seg.mid,
        `rectified ${provenance(seg)}`,
      );
      if (!c) throw new Error("Chart not found in this browser");
      return c;
    },
    onSuccess: (c) =>
      toast({
        title: "Birth time updated",
        description: `${c.name} now reads from ${c.birthTime}; every tab has been recomputed. Scan again to re-mark the given interval.`,
      }),
    onError: (e: any) =>
      toast({
        title: "Could not change the birth time",
        description: e.message,
        variant: "destructive",
      }),
  });
  const busy = saveCopy.isPending || useHere.isPending;

  const data = scan.data;
  const marksCtx = useMemo(
    () => (data ? { table: data.marks, confirmed: confirmedMarks } : undefined),
    [data, confirmedMarks],
  );
  const scored = useMemo(
    () =>
      data
        ? data.segments.map((s, i) => {
            const b = baselineFor(s, method);
            return {
              s,
              i,
              ...methodScore(s, method, marksCtx),
              b,
              excess: b ? b.actual - b.mean : undefined,
            };
          })
        : [],
    [data, method, marksCtx],
  );
  // The 95th-percentile cutoff is an exploratory display convention, not a test of the selected time.
  const baselined =
    EVENT_METHODS.includes(method) && scored.some((r) => r.b !== undefined);
  const maxOf = scored[0]?.max ?? 0;
  // A score of 0/0 is not a ranking, and totals cannot be compared when an
  // event is before birth for only part of the candidate window.
  const parashariComparable = maxOf > 0 && scored.every((r) => r.max === maxOf);
  const anyParashariScore = scored.some((r) => r.max > 0);
  const top = scored.reduce((t, r) => Math.max(t, r.score), 0);
  const topExcess = scored.reduce(
    (t, r) => Math.max(t, r.excess ?? -Infinity),
    -Infinity,
  );
  const bestSet = useMemo(
    () =>
      method === "kunda" || (isParashariMethod && !parashariComparable)
        ? new Set<number>() : new Set(highlightedCandidates(scored)),
    [scored, method, parashariComparable, isParashariMethod],
  );
  // Ranking: the method's score (or its excess over chance) first. Among equals: intervals whose matter
  // cusps keep their sub lord throughout (the cusp in question depends on the corrected time, Astro
  // Secrets Part 1 pp. 176-177, Part 3 p. 4), then more firm cusps of twelve (the app's convention), then
  // the interval nearer the recorded time (the texts correct a recorded time minimally, Part 2 pp. 60-61,
  // Part 3 pp. 160-162), then clock order. Firmness never outranks a score.
  const matterIntact = (s: RectifySegment) =>
    s.stability?.matterFirm === false ? 0 : 1;
  const firmCount = (s: RectifySegment) => s.stability?.firm ?? 0;
  const secondsOf = (hms: string) => {
    const [h, m, sec] = hms.split(":").map(Number);
    return h * 3600 + m * 60 + (sec || 0);
  };
  const givenSec = data ? secondsOf(data.given.time) : 0;
  const distance = (s: RectifySegment) => {
    const d = Math.abs(secondsOf(s.mid) - givenSec);
    return Math.min(d, 86400 - d);
  };
  const segments = useMemo(
    () =>
      sortByScore
        ? [...scored].sort(
            (a, b) =>
              (baselined
                ? (b.excess ?? 0) - (a.excess ?? 0)
                : b.score - a.score) ||
              (isParashariMethod ? 0 : matterIntact(b.s) - matterIntact(a.s)) ||
              (isParashariMethod ? 0 : firmCount(b.s) - firmCount(a.s)) ||
              distance(a.s) - distance(b.s) ||
              a.i - b.i,
          )
        : scored,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scored, sortByScore, baselined, givenSec],
  );
  // KP's fine cusp boundaries can create many adjacent slices with identical
  // Parashari evidence. Group only when the full displayed evidence agrees.
  const parashariGroups = useMemo(() => {
    type Row = (typeof scored)[number];
    const groups: Array<{ first: Row; last: Row; representative: Row; given: boolean; signature: string }> = [];
    for (const row of scored) {
      const check = method === "parashari-events-v3" ? row.s.parashariDivisional : method === "parashari-events-v2" ? row.s.parashariSpecific : row.s.parashariPromise;
      const signature = JSON.stringify([check, row.s.parashariVargas, row.s.manley, row.s.baseline?.parashari]);
      const previous = groups[groups.length - 1];
      if (previous && previous.signature === signature && previous.last.s.midDate === row.s.midDate) {
        previous.last = row;
        previous.given ||= row.s.given;
        if (row.s.selectable !== false && (!previous.representative.s.candidate || distance(row.s) < distance(previous.representative.s)))
          previous.representative = row;
      } else groups.push({ first: row, last: row, representative: row, given: row.s.given, signature });
    }
    return sortByScore && parashariComparable ? groups.sort((a, b) => b.first.score - a.first.score || distance(a.representative.s) - distance(b.representative.s)) : groups;
    // distance depends only on the recorded clock, included through givenSec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scored, sortByScore, givenSec, parashariComparable, method]);
  // Cusp and event boundaries can split the same Nemani result into dozens of
  // slices. Preserve every change in the displayed lords or linkage, but join
  // adjacent slices that carry exactly the same evidence.
  const nemaniGroups = useMemo(() => groupNemaniSegments(scored.map((r) => r.s)), [scored]);
  const hasStability = !isParashariMethod && scored.some((r) => r.s.stability);
  // Body-mark maxima can differ by candidate; the Kunda variants use separate
  // sampling rules. Do not imply their midpoint scores are comparable here.
  const coverage = method !== "bj-marks" && method !== "kunda" && method !== "kunda-d81" && !(method === "kp-nemani-rp" && top === 0) && maxOf > 0 && (!isParashariMethod || parashariComparable)
    ? rawScoreCoverage(scored.map((r) => ({ score: r.score, startIso: r.s.startIso, endIso: r.s.endIso, given: r.s.given })))
    : undefined;

  // Shared timeline for the event methods: the candidate under review (the opened interval, else the best), its clock, and each event tinted by how well that candidate fits it.
  const focusIdx =
    open !== null && data && data.segments[open]
      ? open
      : bestSet.size
        ? Math.min(...Array.from(bestSet))
        : data ? data.segments.findIndex((s) => s.given) : null;
  const focus = focusIdx !== null && data ? data.segments[focusIdx] : null;
  const tlBands = useMemo<TlBand[]>(() => {
    if (!focus?.candidate) return [];
    if (method === "jaimini-dasha")
      return charaBands(
        charaDasha(focus.jaiminiSign.index, focus.candidate.positions, focus.candidate.birthUtc),
        result.now.asOf,
      );
    return vimshottariBands(vimshottari(focus.candidate.kpMoonLon, focus.candidate.birthUtc, result.now.asOf), {
          label: "KP dasa",
        });
  }, [
    focus,
    method,
    result.positions,
    result.utc,
    result.now.asOf,
    result.kp.positions,
  ]);
  const tlMarks = useMemo<TlMark[]>(() => {
    if (!focus) return [];
    return focus.events.map((e, i) => {
      const sc = method === "jaimini-dasha" ? (e.jaimini?.score ?? 0) : e.score;
      const mx = method === "jaimini-dasha" ? (e.jaimini?.max ?? 0) : e.max;
      const ratio = mx > 0 ? sc / mx : 0;
      return {
        id: `${e.label}-${e.date}-${i}`,
        date: DateTime.fromISO(`${e.date}T${e.time ?? "12:00"}`, { zone: e.timezone ?? chart.timezone }).toISO()!,
        label: `${e.label} ${sc}/${mx}`,
        tone:
          mx === 0
            ? "neutral"
            : ratio >= 0.75
              ? "good"
              : ratio >= 0.4
                ? "mixed"
                : "bad",
        title:
          method === "jaimini-dasha"
            ? `${e.label} · ${e.date} · Chara ${e.jaimini ? `${sc}/${mx}` : "no area"}`
            : `${e.label} · ${e.date} · ${e.dasa}–${e.bhukti}–${e.antara} · ${sc}/${mx}${e.promised === undefined ? "" : e.promised ? " · promised" : " · not promised at the cusp"}`,
      };
    });
  }, [focus, method, chart.timezone]);
  /** Group adjacent Jaimini intervals only when their actual event results agree. */
  const signGroups = useMemo(() => {
    if (!data) return [];
    const groups: Array<{
      first: number;
      last: number;
      sign: RectifySegment["jaiminiSign"];
      score: number;
      max: number;
      given: boolean;
      nearest: number | null;
      b?: RectifyBaselineStat;
      signature: string;
      date?: string;
    }> = [];
    data.segments.forEach((s, i) => {
      const g = groups[groups.length - 1];
      const signature = JSON.stringify({
        events: s.events.map((e) => e.jaimini),
        baseline: s.baseline?.jaimini,
      });
      if (g && g.sign.index === s.jaiminiSign.index && g.signature === signature && g.date === s.midDate) {
        g.last = i;
        g.given = g.given || s.given;
      } else {
        const sc = methodScore(s, "jaimini-dasha");
        groups.push({
          first: i,
          last: i,
          sign: s.jaiminiSign,
          score: sc.score,
          max: sc.max,
          given: s.given,
          nearest: null,
          b: s.baseline?.jaimini,
          signature,
          date: s.midDate,
        });
      }
    });
    const givenIdx = data.segments.findIndex((s) => s.given);
    for (const g of groups) {
      if (g.given) continue;
      const eligible = data.segments.slice(g.first, g.last + 1)
        .map((s, n) => s.selectable === false || (s.midDate && s.midDate !== chart.birthDate) ? null : g.first + n)
        .filter((n): n is number => n !== null);
      g.nearest = (givenIdx < g.first ? eligible[0] : eligible.at(-1)) ?? null;
    }
    return groups;
  }, [data, chart.birthDate]);
  const groupBaselined = signGroups.some((g) => g.b !== undefined);
  const groupTopExcess = signGroups.reduce(
    (t, g) => Math.max(t, g.b?.verdict === "above" ? g.b.actual - g.b.mean : -Infinity),
    -Infinity,
  );
  const groupBest = (g: { score: number; b?: RectifyBaselineStat }) =>
    groupBaselined
      ? g.b?.verdict === "above" &&
        Math.abs(g.b.actual - g.b.mean - groupTopExcess) < 1e-9
      : g.score === groupTop && groupTop > 0;
  const groupTop = signGroups.reduce((t, g) => Math.max(t, g.score), 0);
  // Group only identical body-mark calculations, even inside the same drekkana.
  const drekkanaGroups = useMemo(() => {
    if (!data) return [];
    const groups: Array<{
      first: number;
      last: number;
      drekkana: number;
      marksKey: number;
      date?: string;
      score: number;
      max: number;
      given: boolean;
      nearest: number | null;
    }> = [];
    data.segments.forEach((s, i) => {
      const g = groups[groups.length - 1];
      const marksKey = s.marksKey ?? s.drekkana;
      if (g && g.drekkana === s.drekkana && g.marksKey === marksKey && g.date === s.midDate) {
        g.last = i;
        g.given = g.given || s.given;
      } else {
        const sc = methodScore(s, "bj-marks", marksCtx);
        groups.push({
          first: i,
          last: i,
          drekkana: s.drekkana,
          marksKey,
          date: s.midDate,
          score: sc.score,
          max: sc.max,
          given: s.given,
          nearest: null,
        });
      }
    });
    const givenIdx = data.segments.findIndex((s) => s.given);
    for (const g of groups) {
      if (g.given) continue;
      const eligible = data.segments.slice(g.first, g.last + 1)
        .map((s, n) => s.selectable === false || (s.midDate && s.midDate !== chart.birthDate) ? null : g.first + n)
        .filter((n): n is number => n !== null);
      g.nearest = (givenIdx < g.first ? eligible[0] : eligible.at(-1)) ?? null;
    }
    return groups;
  }, [data, marksCtx, chart.birthDate]);
  const drekkanaTop = drekkanaGroups.reduce((t, g) => Math.max(t, g.score), 0);
  const sortedDrekkanas = useMemo(
    () =>
      sortByScore
        ? [...drekkanaGroups].sort(
            (a, b) => b.score - a.score || a.first - b.first,
          )
        : drekkanaGroups,
    [drekkanaGroups, sortByScore],
  );
  const [openDrekkana, setOpenDrekkana] = useState<number | null>(null);
  const shownDrekkana =
    openDrekkana ??
    drekkanaGroups.find((g) => g.given)?.first ??
    drekkanaGroups[0]?.first ??
    null;
  const shownMarksGroup = drekkanaGroups.find((g) => g.first === shownDrekkana);
  const sortedGroups = useMemo(
    () =>
      sortByScore
        ? [...signGroups].sort((a, b) =>
            groupBaselined
              ? (b.b ? b.b.actual - b.b.mean : 0) -
                  (a.b ? a.b.actual - a.b.mean : 0) || a.first - b.first
              : b.score - a.score || a.first - b.first,
          )
        : signGroups,
    [signGroups, sortByScore, groupBaselined],
  );
  const missingEvents = m.needsEvents && eventPayload.length === 0;
  const givenIndex = data?.segments.findIndex((s) => s.given) ?? -1;
  const givenCusps =
    givenIndex >= 0 ? data!.segments[givenIndex].cuspSubLords : null;

  return (
    <section data-testid="section-rectify">
      <SectionTitle
        as="h2"
        plain="Checking the birth time"
        technical="Birth time rectification"
        term="kp-rectification"
        className="text-base"
      />
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowHow((v) => !v)}
          aria-expanded={showHow}
          data-testid="toggle-rectify-how"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              showHow && "rotate-180",
            )}
          />
          How the scan works
        </button>
        {showHow && (
          <ModeText
            className="mt-2 text-sm"
            plain={
              <>
                Recorded birth times are often a few minutes off, and a few
                minutes can change the planet that decides the rising degree.
                The minutes around the recorded time {chart.birthTime} are cut
                into slices wherever that deciding planet, its star ruler or the
                rising sign changes, and each slice is scored by one method at a
                time; the methods are never blended. One scan serves every
                method. Use here moves this chart to that time, keeping its name
                and life events; Save makes a copy at that time and leaves this
                one untouched.
              </>
            }
            practitioner={
              <>
                The window around the recorded time {chart.birthTime} is cut at
                changes in the rising degree and the event-related KP cusps and
                natal inputs. Each interval is scored at its midpoint; other
                fine divisions can still change within it. D81 Kunda has its own
                independently scanned intervals. One scan serves every method;
                switch between them without scanning again. Use
                here moves this chart to that interval's midpoint, keeping its
                name and events; Save makes a copy at that time and leaves this
                one untouched.
              </>
            }
          />
        )}
      </div>

      <div
        role="tablist"
        aria-label="Rectification method"
        className="mt-3 inline-flex flex-wrap rounded-md border p-0.5 text-xs"
      >
        {RECTIFY_METHODS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={method === x.id}
            onClick={() => {
              setMethod(x.id);
              setOpen(null);
            }}
            className={cn(
              "rounded px-2.5 py-1",
              method === x.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`rectify-method-${x.id}`}
          >
            <span className="opacity-70">{x.system} ·</span>{" "}
            {plain ? x.plainLabel : x.label}
          </button>
        ))}
      </div>
      <p
        className="mt-2 text-sm text-muted-foreground"
        data-testid="rectify-method-text"
      >
        {plain ? m.plainShort : m.short} <Cite>{m.source}</Cite>
      </p>
      {locale === "ml" && (
        <p className="mt-1 text-xs text-muted-foreground">
          പദങ്ങൾ: രാശ്യാധിപൻ (sign lord), ഭാവാധിപൻ (house lord), നക്ഷത്രാധിപൻ
          (star lord), സഹാധിപൻ (sub-lord; നിർദ്ദേശിച്ച പദം).
        </p>
      )}
      {m.needsEvents && (
        <p className="mt-1 text-xs text-muted-foreground">
          Without an event time, both tabs use noon; without an event time zone,
          they use the birth time zone ({chart.timezone}). Periods and transits
          can change during the day. Random dates keep the same local time and zone.
        </p>
      )}
      {m.needsJudge && (
        <JudgePlaceControl
          birthPlace={chart.place}
          birthTimezone={chart.timezone}
        />
      )}
      {method === "bj-marks" && (
        <MarksChecklist
          confirmed={confirmedMarks}
          onToggle={toggleMark}
          plain={plain}
          terms={limbTermsFor(chart.gender)}
        />
      )}

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2 text-xs">
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          Window
          <Select
            value={String(windowMinutes)}
            onValueChange={(v) => setWindowMinutes(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-32 text-xs"
              data-testid="select-rectify-window"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w} value={String(w)} className="text-xs">
                  ± {w} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {missingEvents && (
          <span className="text-muted-foreground">
            This method needs at least one dated event; add one below.
          </span>
        )}
        <Button
          size="sm"
          className="h-8"
          onClick={() => scan.mutate()}
          disabled={scan.isPending}
          data-testid="button-rectify-scan"
        >
          {scan.isPending
            ? "Scanning…"
            : data
              ? "Scan again"
              : "Scan the window"}
        </Button>
      </div>

      <div className="mt-3" data-testid="rectify-events">
        <p className="mb-1.5 text-xs font-medium">
          {plain ? "Dated life events" : "Life events"}{" "}
          <span className="text-muted-foreground">
            saved with the chart
            {data && eventPayload.length
              ? "; scan again after changing them"
              : ""}
          </span>
        </p>
        <LifeEventsEditor chart={chart} />
      </div>

      {scan.isPending && !data && (
        <div
          className="mt-5 space-y-3"
          aria-busy="true"
          data-testid="rectify-skeleton"
        >
          <p className="text-xs text-muted-foreground">
            Scanning the window: casting each candidate time and scoring it
            {method === "kp-events" || method === "jaimini-dasha"
              ? " against every dated event"
              : ""}
            . Larger event lists or wider windows can take longer.
          </p>
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          {(method === "kp-events" || method === "jaimini-dasha") &&
            eventPayload.length > 0 && (
              <div className="h-28 animate-pulse rounded-md bg-muted" />
            )}
          <div className="space-y-1.5 pt-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="grid grid-cols-[5rem_1fr_3rem] gap-3">
                <div className="h-7 animate-pulse rounded bg-muted" />
                <div
                  className="h-7 animate-pulse rounded bg-muted"
                  style={{ opacity: 0.7 }}
                />
                <div className="h-7 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div
          className={cn(
            "mt-5 transition-opacity",
            scan.isPending && "opacity-60",
          )}
          aria-busy={scan.isPending || undefined}
          data-testid="rectify-results"
        >
          {data.vargaWindows && <VargaWindowsPanel rows={data.vargaWindows} birthDate={chart.birthDate} />}
          {data.hierarchySelections?.length && <ParashariHierarchyWindows selections={data.hierarchySelections} segments={data.segments} zone={chart.timezone} />}
          {method === "kp-rp" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Judged at{" "}
                {DateTime.fromISO(data.ruling.asOf)
                  .setZone(data.judgedAt.timezone)
                  .toFormat("d LLL yyyy HH:mm")}{" "}
                from {data.judgedAt.label} ({data.judgedAt.timezone}).{" "}
                {plain ? "Planets ruling that moment:" : "Accepted as ruling:"}
              </span>
              {data.accepted.map((a) => (
                <Badge
                  key={a.planet}
                  variant={a.weight < 1 ? "outline" : "secondary"}
                  className="no-default-hover-elevate whitespace-normal text-left"
                  title={a.reason}
                  data-testid={`rectify-accepted-${a.planet}`}
                >
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <PlanetName planet={a.planet} abbr />
                    <span className="text-muted-foreground">{a.reason}</span>
                  </span>
                </Badge>
              ))}
            </div>
          )}
          {method === "kp-nemani-rp" && (() => {
            const g = data.segments.find((s) => s.given) ?? data.segments[0];
            const n = g?.nemani;
            return <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground" data-testid="rectify-nemani-explanation">
              <p>Judged at {DateTime.fromISO(data.ruling.asOf).setZone(data.judgedAt.timezone).toFormat("d LLL yyyy HH:mm:ss")} from {data.judgedAt.label} ({data.judgedAt.timezone}). The judgment Moon's sign, star and sub lords are compared level by level with the candidate's ascendant lords; the connections between the planets use their positions at judgment.</p>
              <p className="mt-1">A 1/1 match requires all three links, using equality or a direct or two-step star/sub chain in either direction. This is an experimental interpretation; neither a match nor a narrow interval confirms a birth time. The book recommends checking life events separately.</p>
              {n && <p className="mt-1">Recorded-time interval midpoint: sign — {n.via.sign}; star — {n.via.star}; sub — {n.via.sub}.</p>}
              {!n && <p className="mt-1">Scan again to calculate this check.</p>}
            </div>;
          })()}
          {method === "kp-moon" &&
            (() => {
              const g = data.segments.find((s) => s.given) ?? data.segments[0];
              const moonVaries = data.segments.some(
                (s) =>
                  s.moonLords.birthStar !== g.moonLords.birthStar ||
                  s.moonLords.moonSign !== g.moonLords.moonSign,
              );
              return (
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="rectify-moon-lords"
                >
                  {plain ? (
                    <>
                      At the midpoint of the recorded-time slice, the Moon was in the star {g.moonLords.birthStar}, ruled by{" "}
                      <PlanetName planet={g.moonLords.birthStarLord} abbr />,
                      and in the sign {g.moonLords.moonSign}, ruled by{" "}
                      <PlanetName planet={g.moonLords.moonSignLord} abbr />.{" "}
                      {moonVaries
                        ? "The Moon's star or sign changes across this scan; each slice uses its own midpoint. "
                        : "The sampled slices have the same Moon star and sign; each is read at its midpoint. "}
                      Levels: the deciding planet
                      is the star's ruler (4), stands in that ruler's star (3),
                      in one of its finer divisions (2), or reaches it through
                      the planet whose sub it stands in (1). The score is twice
                      the level, plus one when it owns or stands in the Moon's
                      sign, so hitting the very star always outranks a sign
                      link.
                    </>
                  ) : (
                    <>
                      At the recorded-time interval's midpoint: birth star {g.moonLords.birthStar}, lord{" "}
                      <PlanetName planet={g.moonLords.birthStarLord} abbr />;
                      Moon in {g.moonLords.moonSign}, lord{" "}
                      <PlanetName planet={g.moonLords.moonSignLord} abbr />.{" "}
                      {moonVaries
                        ? "The Moon's star or sign changes across the scan; each interval uses its own midpoint. "
                        : "The sampled intervals have the same Moon star and sign; each is read at its midpoint. "}
                      Levels: the sub lord is the birth
                      star lord (4), stands in its star (3), in its sub, sub-sub
                      or sookshma (2), or reaches it through the planet whose
                      sub it occupies (1). The score is twice the level, plus
                      one when the sub lord owns or stands in the Moon sign, so
                      the very birth star always outranks a Moon-sign link.
                    </>
                  )}
                </p>
              );
            })()}
          {method === "kp-transit" && (
            <p
              className="text-xs text-muted-foreground"
              data-testid="rectify-sun-now"
            >
              On{" "}
              {DateTime.fromISO(data.ruling.asOf)
                .setZone(data.judgedAt.timezone)
                .toFormat("d LLL yyyy")}{" "}
              the Sun {plain ? "stands at" : "transits"}{" "}
              {fmtDegShort(data.sunNow.lon % 30)} in the star of{" "}
              <PlanetName planet={data.sunNow.starLord} abbr /> and the sub of{" "}
              <PlanetName planet={data.sunNow.subLord} abbr />.{" "}
              {plain ? (
                <>
                  Slices whose rising degree is decided by{" "}
                  <PlanetName planet={data.sunNow.subLord} abbr /> take the hint
                  (2), those whose star ruler is{" "}
                  <PlanetName planet={data.sunNow.subLord} abbr /> half of it
                  (1). Event columns mark whether the sign, star and sub the
                  period planets were passing through on the event day belong to
                  planets that speak for the matter.
                </>
              ) : (
                <>
                  Intervals whose lagna sub lord is{" "}
                  <PlanetName planet={data.sunNow.subLord} abbr /> take the hint
                  (2), a lagna star lord of{" "}
                  <PlanetName planet={data.sunNow.subLord} abbr /> half of it
                  (1). Event columns mark whether the sign, star and sub lords
                  of the dasa and bhukti lords' transit on the event day signify
                  the matter.
                </>
              )}
              {" "}The Sun hint is separate from the event-transit score and comparison.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {plain
              ? `At the recorded time ${data.given.time} the rising degree is ${fmtDegShort(data.given.lagna % 30)} of ${data.segments.find((s) => s.given)?.sign ?? "the rising sign"}.`
              : `Recorded time ${data.given.time} rises ${fmtDegShort(data.given.lagna % 30)} of ${data.segments.find((s) => s.given)?.sign ?? "the lagna sign"}.`}
            {method === "kp-moon" &&
              (plain
                ? " Several slices usually pass at some level; keep those at the top level, then settle between them with the planets ruling now or with dated events. Shanmugham lets the chain run to the finest division because births are timed at different moments (first cry, laid down, head appearing)."
                : " Several intervals usually pass at some level; keep those at the top level, then settle between them with the ruling planets or dated events. Shanmugham allows the chain to run to the sookshma because births are timed at different moments (first cry, laid down, head appearing).")}
            {method === "kp-rp" &&
              (plain
                ? " Outlined badges are doubtful rulers or stand-ins and count half. The second set is Nadi's Dutta-inspired mixed-chart check: it compares a birth-chart position with a judgment-time position. Its weights are app choices. The separate Nemani method uses the judgment chart for both sides. Neither check establishes a birth time."
                : " Half-weight badges are doubtful ruling planets or stand-ins. The RP Moon marks are Nadi's Dutta-inspired mixed-chart interpretation, comparing a natal position with a judgment-time position; the combined weights are app choices. Nemani's separately named method reads both planets in the judgment chart. Neither check establishes a birth time.")}
            {method === "kp-events" &&
              (eventPayload.length
                ? plain
                  ? " Green dots are period planets that speak for the matter's houses and deciding planets that promise it; grey dots fail."
                  : " Green marks are period lords that signify the matter's houses (four-step significators) and cusp sub lords that promise it."
                : " Add dated events and scan again to score by this method.")}
            {method === "kp-transit" &&
              (plain
                ? " The Sun hint changes daily; the event-day positions do not, so they are the steadier of the two."
                : " The Sun hint changes daily; the event transits do not, so they are the steadier of the two.")}
            {method === "jaimini-dasha" &&
              (eventPayload.length
                ? plain
                  ? " Adjacent slices are grouped when their rising sign and event results agree. A full dot means the period sign carries the matter by Rao's threshold; a faint one is a lighter touch. Each slice is checked at its midpoint."
                  : " Adjacent intervals are grouped when their lagna sign and event results agree. Period boundaries can change within a sign; each interval is checked at its midpoint. A full mark means Rao's threshold is met, a faint one a lighter touch."
                : " Add dated events and scan again to score by this method.")}
            {method === "bj-marks" &&
              (plain
                ? " Adjacent slices with the same third of the rising sign and identical body-mark calculations are grouped. Each uses its midpoint."
                : " Adjacent intervals with the same rising drekkana and identical body-mark calculations are grouped. Each uses its midpoint.")}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {method === "kunda-d81"
                ? `${data.kundaD81?.length ?? 0} D81 intervals · ${(data.kundaD81 ?? []).filter((s) => s.check.trine).length} match the birth star or a trine`
                : method === "kunda"
                  ? `${data.segments.length} midpoint samples · Raman's arithmetic is not resolved into time intervals`
                  : method === "jaimini-dasha"
                ? `${signGroups.length} Jaimini result ${signGroups.length === 1 ? "group" : "groups"} in ± ${data.windowMinutes} min · highest raw score ${groupTop} of ${signGroups[0]?.max ?? 0}`
                : method === "bj-marks"
                  ? `${drekkanaGroups.length} body-mark result ${drekkanaGroups.length === 1 ? "group" : "groups"} in ± ${data.windowMinutes} min · ${confirmedMarks.size ? `highest ${drekkanaTop} confirmed` : "tick your marks above to score"}`
                  : method === "kp-nemani-rp"
                    ? `${nemaniGroups.length} groups from ${data.segments.length} sampled slices · ${top ? "some intervals match all three levels" : "no interval matches all three levels"}`
                  : isParashariMethod && !parashariComparable
                  ? `${data.segments.length} slices in ± ${data.windowMinutes} min · ${anyParashariScore ? "event eligibility differs across the window" : "no eligible events to score"}`
                  : `${data.segments.length} ${plain ? "slices" : "intervals"} in ± ${data.windowMinutes} min · ${m.system} ${plain ? m.plainLabel.toLowerCase() : methodLabel(m)} · highest raw score ${Number.isInteger(top) ? top : top.toFixed(1)} of ${maxOf}${baselined ? ` · highest difference from comparison mean ${topExcess >= 0 ? "+" : "−"}${Math.abs(topExcess).toFixed(1)}` : ""}`}
            </span>
            {method !== "kp-nemani-rp" && method !== "kunda-d81" && method !== "kunda" && (!isParashariMethod || parashariComparable) && <button
              type="button"
              className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
              onClick={() => setSortByScore((v) => !v)}
              data-testid="button-rectify-sort"
            >
              {sortByScore ? "Sort by time" : "Sort by score"}
            </button>}
            {method !== "kp-nemani-rp" && method !== "kunda-d81" && method !== "kunda" && hasStability && sortByScore && (
              <span className="text-2xs text-muted-foreground">
                ties broken by matter cusps intact, firm cusps, then nearness to
                the recorded time
              </span>
            )}
          </div>
          {data.segments.some((s) => s.midDate && s.midDate !== chart.birthDate) && (
            <p className="mt-2 text-xs text-muted-foreground">
              This window crosses a calendar date. Candidates on another date
              are labelled and cannot be applied to this chart; create a chart
              for that date and scan again to use one.
            </p>
          )}
          {coverage && (
            <p className="mt-2 rounded border px-3 py-1.5 text-xs text-muted-foreground" data-testid="rectify-score-coverage">
              At the sampled midpoints, the highest raw score ({coverage.top} of {maxOf})
              covers about {coverage.percent}% of this time window.
              {coverage.recorded !== undefined && ` The midpoint of the recorded-time interval scores ${coverage.recorded} of ${maxOf}.`}
              {" "}This estimates how much the score narrows the window; scores can change
              within an interval. Highlights use a separate comparison when available.
            </p>
          )}
          {method === "kp-nemani-rp" && (
            <div className="mt-3 overflow-x-auto" data-testid="rectify-nemani-groups">
              <p className="mb-2 text-xs text-muted-foreground">Adjacent slices are grouped only when their rising sign, three lords and displayed connections agree. Open a group to see its three links.</p>
              <Table className="text-xs">
                <TableHeader><TableRow><TableHead>Time interval</TableHead><TableHead>Rising sign and lords</TableHead><TableHead>Connections</TableHead></TableRow></TableHeader>
                <TableBody>{nemaniGroups.map((g) => {
                  const s = g.first;
                  const n = s.nemani;
                  return <TableRow key={`${s.startIso}-${g.firstIndex}`}>
                    <TableCell className="whitespace-nowrap">{s.midDate && s.midDate !== chart.birthDate ? `${s.midDate} ` : ""}{s.start}–{g.last.end}{g.given ? " · recorded" : ""}</TableCell>
                    <TableCell>{s.sign} · {s.signLord} · {s.starLord} · {s.subLord}</TableCell>
                    <TableCell>{n ? <details><summary className="cursor-pointer">{n.all ? "All three link" : "Not all three link"}</summary><p>Sign: {n.via.sign}.</p><p>Star: {n.via.star}.</p><p>Sub: {n.via.sub}.</p></details> : "Scan again"}</TableCell>
                  </TableRow>;
                })}</TableBody>
              </Table>
            </div>
          )}
          {EVENT_METHODS.includes(method) && scored.length > 1 && scored.every((r) => r.score === scored[0].score) && (
            <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200" data-testid="rectify-flat-score-note">
              Every sampled interval has the same raw score, so that score alone
              cannot narrow this birth-time window. The random-date comparisons
              may still differ; none establishes the correct time.
            </p>
          )}
          {EVENT_METHODS.includes(method) &&
            eventPayload.length > 0 &&
            (() => {
              const isJ = method === "jaimini-dasha";
              const on = isJ ? groupBaselined : baselined;
              const above = isJ
                ? signGroups.filter((g) => g.b?.verdict === "above").length
                : scored.filter((r) => r.b?.verdict === "above").length;
              return (
                <p
                  className={cn(
                    "mt-2 rounded border px-3 py-1.5 text-xs",
                    on && above === 0
                      ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-border/60 bg-muted/30 text-muted-foreground",
                  )}
                  data-testid="rectify-baseline-note"
                >
                  {!on
                    ? "A random-date comparison needs at least two events at least a year apart."
                    : `${data.baseline?.trials ?? 200} sets of comparison dates were independently selected between ${data.baseline?.span[0]} and ${data.baseline?.span[1]}; transits are recalculated on each date against this candidate's natal chart. ${above} ${above === 1 ? "result reaches" : "results reach"} the 95th mid-rank percentile. Highlighting uses that exploratory cutoff and the difference from the comparison mean; it does not account for trying multiple measures or candidates and does not establish a correct birth time. Random dates need not preserve plausible event ages or order.`}
                </p>
              );
            })()}

          {EVENT_METHODS.includes(method) && focus && eventPayload.length > 0 && (
            <div className="mt-3" data-testid="rectify-parashari-cross-check">
              <p className="text-xs text-muted-foreground">
                Parashari cross-check at candidate midpoint {focus.midDate} {focus.mid}.
                Use Houses or Cusps on another row to compare its birth-chart and divisional evidence.
                Available for marriage, children and career events; no automatic verdict.
              </p>
              {(focus.parashariVargas ?? []).map((e, i) => (
                <ParashariVargaEvidencePanel key={`${e.matter}-${e.date}-${i}`} evidence={e} />
              ))}
              {!focus.parashariVargas?.length && (
                <p className="mt-1 text-xs text-muted-foreground">No supported event was supplied for this cross-check.</p>
              )}
            </div>
          )}

          {(isParashariMethod || EVENT_METHODS.includes(method)) && !!focus?.manley?.length && <details className="mt-3 rounded-md border px-3 py-2 text-xs" data-testid="rectify-manley-clues">
            <summary className="cursor-pointer font-medium">Manley event clues and functional lordship · candidate midpoint {focus.midDate} {focus.mid}</summary>
            {(focus.manley ?? []).map((e, i) => <ManleyEvidencePanel key={`${e.matter}-${e.date}-${i}`} evidence={e} />)}
          </details>}
          {(isParashariMethod || EVENT_METHODS.includes(method)) && focus?.parashariHierarchy?.map((e, i) => e && <ParashariHierarchyEvent key={`hierarchy-${i}`} event={e} />)}

          {isParashariMethod && (
            <div className="mt-3" data-testid="rectify-parashari-ranking">
              <p className="text-xs text-muted-foreground">
                Each supported event contributes up to {method === "parashari-events-v3" ? "eight" : method === "parashari-events-v2" ? "six" : "five"} experimental rule matches. Marriage, childbirth,
                and a new job or promotion are scored; other or explicitly mixed or unfavourable events are omitted.
                D1 and divisional indications are partial and can conflict. These scores are not probabilities
                or proof of a birth time. The random-date comparison is exploratory and is not calibrated to select a birth time.
                These older point totals do not require D1 to pass before awarding later points. The older strict funnel above also has known gaps and cannot rule out a candidate. Inspect D1 and the relevant division together below; these clues do not change this ranking.
                Adjacent slices are grouped only when their displayed Parashari evidence agrees; Inspect chooses
                a midpoint near the recorded time in that group.
                {sortByScore && parashariComparable ? " Ties are displayed nearest the recorded time first." : ""}
              </p>
              {!parashariComparable && anyParashariScore && <p className="mt-2 text-xs text-muted-foreground">
                The eligible events differ across candidate times, so their totals cannot be ranked. Check event dates and times relative to birth.
              </p>}
              <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                {method === "parashari-events" ? "In an initial eight-person public-case test, the v1 highest scores missed the ±5-minute band around the reported birth time in all eight cases. " : method === "parashari-events-v2" ? "In nine new public cases, v2's highest intervals touched the reported-time ±5-minute band in eight but covered 35% of the hour on average. At the reported birth times, held-out event scores were nearly the same on nearby comparison dates. " : "In ten fresh public cases, v3's highest intervals came within five minutes of the reported time in four cases and covered 29% of the hour on average. Held-out event scores resembled nearby dates. The added links can overlap and equal weights are app choices. "}
                The ranking should not be used on its own to change a birth time.
              </p>
              {focus && <>
                <p className="mt-2 text-xs font-medium">Candidate midpoint {focus.midDate} {focus.mid}</p>
                {focus.baseline?.parashari && data.baseline && <ParashariComparisonPanel comparison={focus.baseline.parashari}
                  example={focus.baseline.parashariExample} trials={data.baseline.trials} birthZone={chart.timezone} />}
                {method === "parashari-events-v3"
                  ? (focus.parashariDivisional ?? []).map((check, i) => <ParashariSpecificPanel key={`${check.matter}-${check.date}-${i}`} check={check} />)
                  : method === "parashari-events-v2"
                  ? (focus.parashariSpecific ?? []).map((check, i) => <ParashariSpecificPanel key={`${check.matter}-${check.date}-${i}`} check={check} />)
                  : (focus.parashariPromise ?? []).map((check, i) => <ParashariPromisePanel key={`${check.matter}-${check.date}-${i}`} check={check} />)}
                {(focus.parashariVargas ?? []).map((e, i) => <ParashariVargaEvidencePanel key={`varga-${e.matter}-${e.date}-${i}`} evidence={e} />)}
                {!(method === "parashari-events-v3" ? focus.parashariDivisional : method === "parashari-events-v2" ? focus.parashariSpecific : focus.parashariPromise)?.length && <p className="text-xs text-muted-foreground">No eligible event is available to score.</p>}
              </>}
              {anyParashariScore && <div className="mt-3 overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader><TableRow><TableHead>Time interval</TableHead><TableHead>Rule matches</TableHead><TableHead>Candidate</TableHead></TableRow></TableHeader>
                  <TableBody>{parashariGroups.map((g) => <TableRow key={`${g.first.s.startIso}-${g.first.i}`}>
                    <TableCell>{g.first.s.start}–{g.last.s.end}{g.given ? " · recorded" : ""}</TableCell>
                    <TableCell>{g.first.score} / {g.first.max}{parashariComparable && g.first.score === top ? " · highest" : ""}</TableCell>
                    <TableCell><button type="button" className="underline" onClick={() => setOpen(open === g.representative.i ? null : g.representative.i)}>{open === g.representative.i ? "Hide" : "Inspect"}</button></TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>}
            </div>
          )}

          {(method === "kp-events" || method === "jaimini-dasha") &&
            focus &&
            tlBands.length > 0 &&
            eventPayload.length > 0 && (
              <div
                className="mt-3 rounded-md border bg-card p-3"
                data-testid="rectify-timeline-card"
              >
                <p className="text-xs">
                  <span className="font-medium">
                    {plain
                      ? "How the candidate fits the events"
                      : "Event fit of the candidate interval"}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {focus.start.slice(0, 5)}–{focus.end.slice(0, 5)}
                    {method === "jaimini-dasha"
                      ? `, ${focus.jaiminiSign.name} rising`
                      : `, lagna sub lord ${focus.subLord}`}
                    {focus.given ? " (the given time)" : ""};{" "}
                    {open === null
                      ? bestSet.size ? "a highlighted interval; open another row to compare" : "the recorded-time interval; open another row to compare"
                      : "the opened row"}
                    . Green events fit fully, amber in part, red not at all.
                  </span>
                </p>
                <LifeTimeline
                  className="mt-2"
                  testid="rectify-timeline"
                  birthIso={focus.candidate?.birthUtc ?? result.utc}
                  asOfIso={result.now.asOf}
                  bands={tlBands}
                  marks={tlMarks}
                  marksLabel="Fit"
                />
              </div>
            )}

          {method === "kp-transit" && focus?.candidate && data.eventTransits && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                Natal chart at {focus.midDate} {focus.mid}; use Houses on a row
                below to inspect another candidate. The full transit context is
                descriptive and does not change the two-period-lord score.
              </p>
              {focus.events.map((e, i) => {
                const sky = data.eventTransits?.[i];
                return sky ? <KpTransitEvidencePanel key={`${e.label}-${e.date}-${i}`} label={e.label} date={e.date} when={describeEventMoment(e, chart.timezone)} evidence={kpTransitEvidence(sky.positions, focus.candidate!.kpPlanets, focus.candidate!.kpCusps, e.houses)} /> : null;
              })}
              {data.baseline && (
                <details className="mt-2 rounded-md border px-3 py-2 text-xs" data-testid="rectify-comparison-example">
                  <summary className="cursor-pointer font-medium">Inspect one randomly selected comparison set</summary>
                  <p className="mt-2 text-muted-foreground">
                    These are the first dates in the reproducible comparison,
                    using this candidate's natal chart and each selected date's sky.
                  </p>
                  {focus.events.map((e, i) => {
                    const example = data.eventTransits?.[i]?.example;
                    return example ? <KpTransitEvidencePanel key={`${e.label}-${example.date}-${i}`} label={`${e.label} · comparison`} date={example.date} when={describeEventMoment(example, chart.timezone)} evidence={kpTransitEvidence(example.positions, focus.candidate!.kpPlanets, focus.candidate!.kpCusps, e.houses)} /> : null;
                  })}
                </details>
              )}
            </div>
          )}

          {method === "kp-aurora" && focus && <div className="mt-3" data-testid="rectify-aurora-evidence">
            <p className="text-xs text-muted-foreground">At the selected candidate, only complete staged chains are counted. Ties and unresolved stages do not identify a birth time. Event skies are descriptive.</p>
            {focus.auroraAscendant && <AuroraLinkDetail links={focus.auroraAscendant} />}
            {focus.events.map((e, i) => e.aurora && <AuroraEventPanel key={`${e.label}-${e.date}-${i}`} evidence={e.aurora} label={`${e.label} · ${e.date}`} />)}
            {!focus.events.some((e) => e.aurora) && <p className="mt-2 text-xs text-muted-foreground">None of the selected events is supported by this research adapter.</p>}
            {focus.baseline?.aurora && <p className="mt-2 text-xs text-muted-foreground">Full chains on the events: {focus.baseline.aurora.actual}; random-date mean: {focus.baseline.aurora.mean}. Random dates are not known non-events.</p>}
          </div>}
          {method === "kp-aurora-v2" && focus && <div className="mt-3" data-testid="rectify-aurora-v2-evidence">
            <p className="text-xs text-muted-foreground">Only complete v2 chains are counted. A supported mixed star retains its caution; a mixed sub remains unresolved. Ties do not identify a birth time.</p>
            <AuroraV2StagesPanel evidence={focus.events.map((e) => e.auroraV2)} comparison={focus.baseline?.auroraV2Stages} trials={data.baseline?.trials} />
            {focus.auroraAscendant && <AuroraLinkDetail links={focus.auroraAscendant} />}
            {focus.events.map((e, i) => e.auroraV2 && <AuroraV2Panel key={`${e.label}-${e.date}-${i}`} evidence={e.auroraV2} label={`${e.label} · ${e.date}`} />)}
            {!focus.events.some((e) => e.auroraV2) && <p className="mt-2 text-xs text-muted-foreground">None of the selected events is supported by this research adapter.</p>}
            {focus.baseline?.auroraV2 && <p className="mt-2 text-xs text-muted-foreground">Full v2 chains on the events: {focus.baseline.auroraV2.actual}; random-date mean: {focus.baseline.auroraV2.mean}. {focus.baseline.auroraV2.sd === 0 && focus.baseline.auroraV2.actual === focus.baseline.auroraV2.mean ? "The comparison scores show no spread and match the events, so this comparison does not distinguish the dates. " : ""}Random dates are not known non-events.</p>}
          </div>}

          {method === "kunda" && (
            <div className="mt-3 overflow-x-auto" data-testid="rectify-kunda-raman">
              <p className="mb-2 text-xs text-muted-foreground">
                Samples use the chart's selected ayanamsa. Their times come from
                the general scan; those boundaries are not Raman Kunda intervals.
                A row marked recorded contains the recorded time, but its result
                is calculated at the sample time shown.
              </p>
              <Table className="text-xs [&_td]:px-3 [&_th]:px-3">
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample time</TableHead>
                    <TableHead>Kunda star</TableHead>
                    <TableHead>Birth star</TableHead>
                    <TableHead>Check</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.segments.map((s, i) => (
                    <TableRow key={`${s.startIso}-${i}`}>
                      <TableCell className="whitespace-nowrap tabular">
                        {s.mid}{s.midDate && s.midDate !== chart.birthDate ? ` (${s.midDate})` : ""}{s.given ? " · contains recorded time" : ""}
                      </TableCell>
                      <TableCell>{s.kunda ? NAKSHATRAS[s.kunda.kundaNakshatra] : "—"}</TableCell>
                      <TableCell>{s.kunda ? NAKSHATRAS[s.kunda.birthStar] : "—"}</TableCell>
                      <TableCell>{s.kunda ? (s.kunda.trine ? "matches" : "does not match") : "Not representable at whole-second precision"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {!s.given && (
                          <button
                            type="button"
                            className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                            onClick={() => saveCopy.mutate(s)}
                            disabled={busy || s.selectable === false || Boolean(s.midDate && s.midDate !== chart.birthDate)}
                            title={`Save a copy at the sampled time ${s.mid}`}
                          >
                            Save sampled midpoint
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {method === "kunda-d81" && (
            <div className="mt-3 overflow-x-auto" data-testid="rectify-kunda-d81">
              <p className="mb-2 text-xs text-muted-foreground">
                D81 uses the chart's selected ayanamsa. The scan samples Kunda
                and Moon-star changes; boundaries are rounded to seconds and
                very rapid changes can be missed, especially near the poles.
                A midpoint that cannot be represented within its interval at
                whole-second precision cannot be saved.
                Matching a star is a traditional check, not proof of a birth time.
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                {showAllKunda ? "Showing all intervals." : "Showing matching intervals and the recorded-time interval."}{" "}
                <button type="button" className="underline underline-offset-2" onClick={() => setShowAllKunda((v) => !v)}>
                  {showAllKunda ? "Show matching intervals" : "Show all intervals"}
                </button>
              </p>
              <Table className="text-xs [&_td]:px-3 [&_th]:px-3">
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Midpoint</TableHead>
                    <TableHead>Kunda star</TableHead>
                    <TableHead>Birth star</TableHead>
                    <TableHead>Check</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.kundaD81 ?? []).filter((s) => showAllKunda || s.check.trine || s.given).map((s, i) => (
                    <TableRow key={`${s.startIso}-${i}`} data-testid={`rectify-d81-${i}`}>
                      <TableCell className="whitespace-nowrap">{s.start}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.end}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.mid}{s.midDate !== chart.birthDate ? ` (${s.midDate})` : ""}{s.given ? " · recorded" : ""}</TableCell>
                      <TableCell>{NAKSHATRAS[s.check.kundaNakshatra]}</TableCell>
                      <TableCell>{NAKSHATRAS[s.check.birthStar]}</TableCell>
                      <TableCell>{s.check.trine ? "matches" : "does not match"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {!s.given && (
                          <button
                            type="button"
                            className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                            onClick={() => saveCopy.mutate(s)}
                            disabled={busy || !s.selectable || s.midDate !== chart.birthDate}
                            title={!s.selectable ? "The rounded midpoint lies outside this short interval" : s.midDate !== chart.birthDate ? "This candidate is on a different date; create a chart for that date and scan again" : `Save a copy at ${s.mid}`}
                          >
                            Save midpoint copy
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!data.kundaD81 && (
                <p className="mt-2 text-xs text-muted-foreground">Scan again to calculate the D81 intervals.</p>
              )}
            </div>
          )}

          {method === "bj-marks" && (
            <div className="mt-2 overflow-x-auto" data-testid="rectify-marks">
              <Table className="text-xs leading-5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Rising</TableHead>
                    <TableHead className="whitespace-nowrap">
                      {plain ? "Third of the sign" : "Drekkana"}
                    </TableHead>
                    <TableHead>
                      {plain
                        ? "Parts that should be marked"
                        : "Predicted limbs"}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDrekkanas.map((g) => {
                    const first = data.segments[g.first];
                    const last = data.segments[g.last];
                    const r = data.marks[g.marksKey];
                    const best = g.score === drekkanaTop && drekkanaTop > 0;
                    const shown = shownDrekkana === g.first;
                    return (
                      <TableRow
                        key={g.first}
                        className={cn(
                          best && "bg-verdict-good/10",
                          g.given &&
                            "outline outline-1 -outline-offset-1 outline-foreground/40",
                        )}
                        data-testid={`rectify-drekkana-${g.drekkana}`}
                      >
                        <TableCell className="whitespace-nowrap tabular align-top">
                          {first.start.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{first.start.slice(6)}
                          </span>
                          –{last.end.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{last.end.slice(6)}
                          </span>
                          {first.midDate && first.midDate !== chart.birthDate && <span className="ml-1 text-muted-foreground">({first.midDate})</span>}
                          {g.given && (
                            <span className="ml-1.5 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground">
                              given
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          {r ? (
                            <>
                              {SIGNS3[r.lagnaSign]}{" "}
                              {["1st", "2nd", "3rd"][r.drekkana - 1]}{" "}
                              <span className="text-muted-foreground">
                                {["head", "trunk", "lower"][r.drekkana - 1]}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {r ? (
                            <LimbDots r={r} confirmed={confirmedMarks} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          <ScoreBar score={g.score} max={g.max} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right align-top">
                          <button
                            type="button"
                            className={cn(
                              "underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground",
                              shown && "font-medium no-underline",
                            )}
                            onClick={() =>
                              setOpenDrekkana(shown ? null : g.first)
                            }
                            data-testid={`button-rectify-marks-open-${g.drekkana}`}
                          >
                            {shown ? "Shown below" : "Show limbs"}
                          </button>
                          {g.given ? (
                            <span className="ml-2 text-muted-foreground">
                              recorded drekkana
                            </span>
                          ) : g.nearest !== null ? (
                            <>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Moves this chart to the interval of this drekkana nearest the recorded time, ${data.segments[g.nearest].start} to ${data.segments[g.nearest].end}`}
                                onClick={() =>
                                  useHere.mutate(data.segments[g.nearest!])
                                }
                                disabled={busy}
                                data-testid={`button-rectify-use-drekkana-${g.drekkana}`}
                              >
                                Use nearest here
                              </button>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Saves a copy at the interval of this drekkana nearest the recorded time, ${data.segments[g.nearest].start} to ${data.segments[g.nearest].end}`}
                                onClick={() =>
                                  saveCopy.mutate(data.segments[g.nearest!])
                                }
                                disabled={busy}
                                data-testid={`button-rectify-save-drekkana-${g.drekkana}`}
                              >
                                Save nearest
                              </button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {shownMarksGroup && data.marks[shownMarksGroup.marksKey] && (
                <MarksDetail
                  r={data.marks[shownMarksGroup.marksKey]}
                  confirmed={confirmedMarks}
                  plain={plain}
                  degrees={`${(shownMarksGroup.drekkana % 3) * 10}°–${(shownMarksGroup.drekkana % 3) * 10 + 10}°`}
                />
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Body marks provide a separate traditional check, not an exact
                birth time. Use nearest here moves this chart to the{" "}
                {plain ? "slice" : "interval"} of that drekkana closest to the
                recorded time; Save nearest makes a copy there.
              </p>
            </div>
          )}

          {method === "jaimini-dasha" && (
            <div className="mt-2 overflow-x-auto">
              <Table className="text-xs leading-5 [&_button]:[word-spacing:0.2em] [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Rising</TableHead>
                    <TableHead className="whitespace-nowrap">
                      {plain ? "Rising sign" : "Lagna sign"}
                    </TableHead>
                    {eventPayload.map((e) => (
                      <TableHead
                        key={e.label + e.date}
                        className="whitespace-nowrap"
                      >
                        {e.label}{" "}
                        <span className="text-muted-foreground tabular">
                          {e.date}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    {groupBaselined && (
                      <TableHead className="whitespace-nowrap">
                        Difference · percentile
                      </TableHead>
                    )}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((g) => {
                    const first = data.segments[g.first];
                    const last = data.segments[g.last];
                    const best = groupBest(g);
                    return (
                      <TableRow
                        key={g.first}
                        className={cn(
                          best && "bg-verdict-good/10",
                          g.given &&
                            "outline outline-1 -outline-offset-1 outline-foreground/40",
                        )}
                        data-testid={`rectify-sign-${g.first}`}
                      >
                        <TableCell className="whitespace-nowrap tabular">
                          {first.start.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{first.start.slice(6)}
                          </span>
                          –{last.end.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{last.end.slice(6)}
                          </span>
                          {first.midDate && first.midDate !== chart.birthDate && <span className="ml-1 text-muted-foreground">({first.midDate})</span>}
                          {g.given && (
                            <span className="ml-1.5 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground">
                              given
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {g.sign.name}{" "}
                          <span
                            className="text-muted-foreground"
                            title={`chara dasha runs ${g.sign.direction} from this sign`}
                          >
                            {g.sign.direction === "forward" ? "fwd" : "bwd"}
                          </span>
                        </TableCell>
                        {first.events.map((e) => {
                          const f = e.jaimini;
                          if (!f)
                            return (
                              <TableCell
                                key={e.label + e.date}
                                className="whitespace-nowrap text-muted-foreground"
                              >
                                no Jaimini area for this matter
                              </TableCell>
                            );
                          const dot = (
                            lvl: {
                              hot: boolean;
                              score: number;
                              triggers: string[];
                            },
                            what: string,
                          ) => (
                            <span
                              title={
                                lvl.triggers.length
                                  ? lvl.triggers.join("\n")
                                  : `nothing in the ${what} sign speaks to this matter`
                              }
                              className={cn(
                                "inline-block h-2.5 w-2.5 rounded-full align-middle",
                                lvl.hot
                                  ? "bg-verdict-good"
                                  : lvl.score > 0
                                    ? "bg-verdict-good/40"
                                    : "bg-muted-foreground/25",
                              )}
                              aria-label={
                                lvl.hot
                                  ? "carries the matter"
                                  : lvl.score > 0
                                    ? "light touch"
                                    : "no touch"
                              }
                            />
                          );
                          return (
                            <TableCell
                              key={e.label + e.date}
                              className="whitespace-nowrap"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {dot(f.md, "dasha")} {SIGNS3[f.mdSign]}
                                <span className="text-muted-foreground">·</span>
                                {dot(f.ad, "antardasha")} {SIGNS3[f.adSign]}
                                {f.cycle === 2 && (
                                  <span className="text-muted-foreground">
                                    2nd cycle
                                  </span>
                                )}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="whitespace-nowrap">
                          <ScoreBar score={g.score} max={g.max} />
                        </TableCell>
                        {groupBaselined && (
                          <TableCell className="whitespace-nowrap">
                            <VsChance b={g.b} />
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap text-right">
                          {g.given ? (
                            <span className="text-muted-foreground">
                              recorded sign
                            </span>
                          ) : g.nearest !== null ? (
                            <>
                              <button
                                type="button"
                                className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Moves this chart to the interval of this sign nearest the recorded time, ${data.segments[g.nearest].start} to ${data.segments[g.nearest].end}`}
                                onClick={() =>
                                  useHere.mutate(data.segments[g.nearest!])
                                }
                                disabled={busy}
                                data-testid={`button-rectify-use-sign-${g.first}`}
                              >
                                Use nearest here
                              </button>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Saves a copy at the interval of this sign nearest the recorded time, ${data.segments[g.nearest].start} to ${data.segments[g.nearest].end}`}
                                onClick={() =>
                                  saveCopy.mutate(data.segments[g.nearest!])
                                }
                                disabled={busy}
                                data-testid={`button-rectify-save-sign-${g.first}`}
                              >
                                Save nearest
                              </button>
                            </>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="mt-2 text-xs text-muted-foreground">
                This check samples each candidate; it does not establish an exact
                birth time. Use nearest here moves this chart to the{" "}
                {plain ? "slice" : "interval"} of that sign closest to the
                recorded time; Save nearest makes a copy there.
              </p>
            </div>
          )}

          {!isParashariMethod && method !== "kp-nemani-rp" && method !== "jaimini-dasha" && method !== "bj-marks" && method !== "kunda-d81" && method !== "kunda" && (
            <div className="mt-2 overflow-x-auto">
              <Table className="text-xs leading-5 [&_button]:[word-spacing:0.2em] [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      {plain ? "Slice" : "Interval"}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      {plain ? "Rising degree" : "Lagna"}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead className="whitespace-nowrap">
                      {method === "kp-moon"
                        ? plain
                          ? "Sign · star rulers"
                          : "Sign · star"
                        : plain
                          ? "Sign · star · deciding"
                          : "Sign · star · sub"}
                    </TableHead>
                    {method === "kp-rp" && (
                      <TableHead className="whitespace-nowrap">
                        {plain ? "Moon ruling now" : "RP Moon link"}
                      </TableHead>
                    )}
                    {method === "kp-transit" && (
                      <TableHead className="whitespace-nowrap">
                        {plain ? "Sun's hint" : "Sun sub"}
                      </TableHead>
                    )}
                    {method === "kp-moon" && (
                      <TableHead className="whitespace-nowrap">
                        {plain
                          ? "Deciding planet and the Moon's star"
                          : "Sub lord and birth star"}
                      </TableHead>
                    )}
                    {method === "kp-moon" && (
                      <TableHead className="whitespace-nowrap">
                        Moon sign
                      </TableHead>
                    )}
                    {method === "bj-nashta" && (
                      <TableHead className="whitespace-nowrap">
                        {plain ? "Lost horoscope" : "Nashta star vs birth star"}
                      </TableHead>
                    )}
                    {(method === "kp-events" || method === "kp-transit") &&
                      eventPayload.map((e) => (
                        <TableHead
                          key={e.label + e.date}
                          className="whitespace-nowrap"
                        >
                          {e.label}{" "}
                          <span className="text-muted-foreground tabular">
                            {e.date}
                          </span>
                          {method === "kp-transit" && (
                            <span className="ml-1 text-muted-foreground">
                              {plain
                                ? "passing through sign · star · sub"
                                : "transit sign · star · sub"}
                            </span>
                          )}
                        </TableHead>
                      ))}
                    {hasStability && (
                      <TableHead
                        className="whitespace-nowrap"
                        title="Cusps whose sub lord agrees at the sampled start, midpoint and end, of 12"
                      >
                        {plain ? "Firm houses" : "Firm cusps"}
                      </TableHead>
                    )}
                    {baselined && (
                      <TableHead className="whitespace-nowrap">
                        Difference · percentile
                      </TableHead>
                    )}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map(({ s, i, score, max, b }) => {
                    const best = bestSet.has(i);
                    const rpMoonLink = s.dutta;
                    return (
                      <TableRow
                        key={`${s.startIso}-${i}`}
                        className={cn(
                          best && "bg-verdict-good/10",
                          s.given &&
                            "outline outline-1 -outline-offset-1 outline-foreground/40",
                        )}
                        data-testid={`rectify-segment-${i}`}
                      >
                        <TableCell className="whitespace-nowrap tabular">
                          {s.start.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{s.start.slice(6)}
                          </span>
                          –{s.end.slice(0, 5)}
                          <span className="text-muted-foreground">
                            :{s.end.slice(6)}
                          </span>
                          {s.midDate && s.midDate !== chart.birthDate && <span className="ml-1 text-muted-foreground">({s.midDate})</span>}
                          {s.given && (
                            <span className="ml-1.5 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground">
                              given
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular">
                          {s.sign.slice(0, 3)}{" "}
                          {degRange(s.lagnaFrom, s.lagnaTo)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <ScoreBar score={score} max={max} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {method === "kp-rp" ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Mark on={s.rp.sign} title={s.rp.via.sign} />{" "}
                              <PlanetName planet={s.signLord} abbr />
                              <span className="text-muted-foreground">·</span>
                              <Mark on={s.rp.star} title={s.rp.via.star} />{" "}
                              <PlanetName planet={s.starLord} abbr />
                              <span className="text-muted-foreground">·</span>
                              <Mark on={s.rp.sub} title={s.rp.via.sub} />{" "}
                              <PlanetName planet={s.subLord} abbr />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <PlanetName planet={s.signLord} abbr />
                              <span className="text-muted-foreground">·</span>
                              {method === "kp-transit" && (
                                <Mark
                                  on={s.sunHint.star}
                                  title={
                                    s.sunHint.star
                                      ? "lagna star lord is the Sun's transit sub lord"
                                      : undefined
                                  }
                                />
                              )}{" "}
                              <PlanetName planet={s.starLord} abbr />
                              {method !== "kp-moon" && (
                                <>
                                  <span className="text-muted-foreground">
                                    ·
                                  </span>
                                  {method === "kp-transit" && (
                                    <Mark
                                      on={s.sunHint.sub}
                                      title={
                                        s.sunHint.sub
                                          ? "lagna sub lord is the Sun's transit sub lord"
                                          : undefined
                                      }
                                    />
                                  )}{" "}
                                  <PlanetName planet={s.subLord} abbr />
                                </>
                              )}
                            </span>
                          )}
                        </TableCell>
                        {method === "kp-rp" && (
                          <TableCell className="whitespace-nowrap">
                            {rpMoonLink ? (
                              <span
                                className="inline-flex items-center gap-1.5"
                                title={`RP Moon's lords, judged now: ${rpMoonLink.moon.signLord} (sign), ${rpMoonLink.moon.starLord} (star), ${rpMoonLink.moon.subLord} (sub)`}
                              >
                                <Mark
                                  on={rpMoonLink.linked.sign}
                                  title={rpMoonLink.via.sign}
                                />{" "}
                                <PlanetName
                                  planet={rpMoonLink.moon.signLord}
                                  abbr
                                />
                                <span className="text-muted-foreground">·</span>
                                <Mark
                                  on={rpMoonLink.linked.star}
                                  title={rpMoonLink.via.star}
                                />{" "}
                                <PlanetName
                                  planet={rpMoonLink.moon.starLord}
                                  abbr
                                />
                                <span className="text-muted-foreground">·</span>
                                <Mark
                                  on={rpMoonLink.linked.sub}
                                  title={rpMoonLink.via.sub}
                                />{" "}
                                <PlanetName
                                  planet={rpMoonLink.moon.subLord}
                                  abbr
                                />
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        )}
                        {method === "kp-transit" && (
                          <TableCell className="whitespace-nowrap">
                            <ScoreBar
                              score={s.sunHint.score}
                              max={s.sunHint.max}
                            />
                          </TableCell>
                        )}
                        {method === "kp-moon" && (
                          <TableCell className="whitespace-nowrap">
                            <span
                              className="inline-flex items-center gap-1.5"
                              title={s.moonLords.star.via}
                            >
                              <span
                                className={cn(
                                  "rounded border px-1 text-2xs tabular",
                                  s.moonLords.star.level === 4
                                    ? "border-verdict-good text-verdict-good"
                                    : s.moonLords.star.level > 0
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                )}
                              >
                                {s.moonLords.star.level}
                              </span>
                              <Mark
                                on={s.moonLords.star.level > 0}
                                title={s.moonLords.star.via}
                              />{" "}
                              <PlanetName planet={s.moonLords.subLord} abbr />
                              <span className="text-muted-foreground">in</span>
                              <Mark
                                on={
                                  s.moonLords.chain.starLord ===
                                  s.moonLords.birthStarLord
                                }
                                title={`star of ${s.moonLords.chain.starLord}`}
                              />{" "}
                              <PlanetName
                                planet={s.moonLords.chain.starLord}
                                abbr
                              />
                              <Mark
                                on={
                                  s.moonLords.chain.subLord ===
                                  s.moonLords.birthStarLord
                                }
                                title={`sub of ${s.moonLords.chain.subLord}`}
                              />{" "}
                              <PlanetName
                                planet={s.moonLords.chain.subLord}
                                abbr
                              />
                              <Mark
                                on={
                                  s.moonLords.chain.subSubLord ===
                                  s.moonLords.birthStarLord
                                }
                                title={`sub-sub of ${s.moonLords.chain.subSubLord}`}
                              />{" "}
                              <PlanetName
                                planet={s.moonLords.chain.subSubLord}
                                abbr
                              />
                              <Mark
                                on={
                                  s.moonLords.chain.sookshmaLord ===
                                  s.moonLords.birthStarLord
                                }
                                title={`sookshma of ${s.moonLords.chain.sookshmaLord}`}
                              />{" "}
                              <PlanetName
                                planet={s.moonLords.chain.sookshmaLord}
                                abbr
                              />
                              {s.moonLords.star.level === 1 && (
                                <span className="text-muted-foreground">
                                  via {PLANET_ABBR[s.moonLords.chain.subLord]}
                                </span>
                              )}
                            </span>
                          </TableCell>
                        )}
                        {method === "kp-moon" && (
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Mark
                                on={s.moonLords.sign.owns}
                                title={
                                  s.moonLords.sign.owns
                                    ? `${s.moonLords.subLord} owns ${s.moonLords.moonSign}`
                                    : `${s.moonLords.subLord} does not own ${s.moonLords.moonSign}`
                                }
                              />{" "}
                              owns
                              <Mark
                                on={s.moonLords.sign.occupies}
                                title={
                                  s.moonLords.sign.occupies
                                    ? `${s.moonLords.subLord} stands in ${s.moonLords.moonSign}`
                                    : `${s.moonLords.subLord} is not in ${s.moonLords.moonSign}`
                                }
                              />{" "}
                              in it
                            </span>
                          </TableCell>
                        )}
                        {method === "bj-nashta" && s.bjNashta && (
                          <TableCell className="whitespace-nowrap">
                            <span
                              className="inline-flex items-center gap-1.5"
                              title={s.bjNashta.via}
                            >
                              <Mark on={s.bjNashta.trine} title={s.bjNashta.via} />
                              <span
                                className={cn(
                                  s.bjNashta.trine
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {NAKSHATRAS[s.bjNashta.nakshatra]}
                              </span>
                              <span className="text-muted-foreground">
                                vs {NAKSHATRAS[s.bjNashta.birthStar]}
                              </span>
                            </span>
                          </TableCell>
                        )}
                        {method === "kp-transit" &&
                          s.events.map((e) => (
                            <TableCell
                              key={e.label + e.date}
                              className="whitespace-nowrap"
                            >
                              {[e.transit.dasa, e.transit.bhukti].map(
                                (t, k) => (
                                  <span
                                    key={k}
                                    className="flex items-center gap-1.5"
                                  >
                                    <span className="w-9 shrink-0 text-muted-foreground">
                                      {k === 0
                                        ? plain
                                          ? "period"
                                          : "dasa"
                                        : plain
                                          ? "sub"
                                          : "bhukti"}
                                    </span>
                                    <PlanetName planet={t.planet} abbr />
                                    <span className="text-muted-foreground">
                                      in
                                    </span>
                                    <Mark
                                      on={t.hits[0]}
                                      title={`sign lord ${t.signLord}`}
                                    />{" "}
                                    <PlanetName planet={t.signLord} abbr />
                                    <Mark
                                      on={t.hits[1]}
                                      title={`star lord ${t.starLord}`}
                                    />{" "}
                                    <PlanetName planet={t.starLord} abbr />
                                    <Mark
                                      on={t.hits[2]}
                                      title={`sub lord ${t.subLord}`}
                                    />{" "}
                                    <PlanetName planet={t.subLord} abbr />
                                  </span>
                                ),
                              )}
                            </TableCell>
                          ))}
                        {method === "kp-events" &&
                          s.events.map((e) => (
                            <TableCell
                              key={e.label + e.date}
                              className="whitespace-nowrap"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Mark
                                  on={e.hits[0]}
                                  title={`dasa ${e.dasa} signifies ${e.signified[0].join(", ") || "none"}`}
                                />{" "}
                                <PlanetName planet={e.dasa} abbr />
                                <Mark
                                  on={e.hits[1]}
                                  title={`bhukti ${e.bhukti} signifies ${e.signified[1].join(", ") || "none"}`}
                                />{" "}
                                <PlanetName planet={e.bhukti} abbr />
                                <Mark
                                  on={e.hits[2]}
                                  title={`antara ${e.antara} signifies ${e.signified[2].join(", ") || "none"}`}
                                />{" "}
                                <PlanetName planet={e.antara} abbr />
                                {e.cuspSubLord && (
                                  <>
                                    <span className="text-muted-foreground">
                                      ·
                                    </span>
                                    <Mark
                                      on={Boolean(e.promised)}
                                      title={`cusp sub lord ${e.cuspSubLord} ${e.promised ? "promises" : "does not promise"} ${e.houses.join(", ")}`}
                                    />{" "}
                                    <PlanetName planet={e.cuspSubLord} abbr />
                                  </>
                                )}
                              </span>
                            </TableCell>
                          ))}
                        {hasStability && (
                          <TableCell className="whitespace-nowrap">
                            <FirmCell st={s.stability} plain={plain} />
                          </TableCell>
                        )}
                        {baselined && (
                          <TableCell className="whitespace-nowrap">
                            <VsChance b={b} />
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap text-right">
                          <button
                            type="button"
                            className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                            onClick={() => setOpen(open === i ? null : i)}
                            data-testid={`button-rectify-cusps-${i}`}
                          >
                            {open === i ? "Hide" : plain ? "Houses" : "Cusps"}
                          </button>
                          {!s.given && (
                            <>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Moves this chart to ${s.mid}`}
                                onClick={() => useHere.mutate(s)}
                                disabled={busy || s.selectable === false || Boolean(s.midDate && s.midDate !== chart.birthDate)}
                                data-testid={`button-rectify-use-${i}`}
                              >
                                Use here
                              </button>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Saves a copy of the chart at ${s.mid}`}
                                onClick={() => saveCopy.mutate(s)}
                                disabled={busy || s.selectable === false || Boolean(s.midDate && s.midDate !== chart.birthDate)}
                                data-testid={`button-rectify-save-${i}`}
                              >
                                Save copy
                              </button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {open !== null &&
            !isParashariMethod &&
            method !== "kp-nemani-rp" &&
            method !== "jaimini-dasha" &&
            method !== "bj-marks" &&
            method !== "kunda" &&
            method !== "kunda-d81" &&
            data.segments[open] && (
              <div
                className="mt-3 rounded-md border p-3 text-xs"
                data-testid="rectify-cusps-detail"
              >
                <p className="font-medium">
                  {plain
                    ? "Deciding planet of each house at"
                    : "Cusp sub lords at"}{" "}
                  {data.segments[open].mid}{" "}
                  <span className="text-muted-foreground">
                    (changes from the recorded time are marked)
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.segments[open].cuspSubLords.map((p, k) => {
                    const changed = givenCusps ? givenCusps[k] !== p : false;
                    return (
                      <Badge
                        key={k}
                        variant={changed ? "secondary" : "outline"}
                        className={cn(
                          "no-default-hover-elevate tabular",
                          changed && "ring-1 ring-foreground/50",
                        )}
                        title={
                          changed
                            ? `was ${PLANET_ABBR[givenCusps![k] as Planet]}`
                            : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          <span className="text-muted-foreground">{k + 1}</span>{" "}
                          <PlanetName planet={p} abbr />
                          {changed && givenCusps && (
                            <span className="text-muted-foreground">
                              (was {PLANET_ABBR[givenCusps[k]]})
                            </span>
                          )}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
                <p className="mt-2 text-muted-foreground">
                  Moon in this {plain ? "slice" : "interval"}: star{" "}
                  <PlanetName planet={data.segments[open].moon.starLord} abbr />{" "}
                  · sub{" "}
                  <PlanetName planet={data.segments[open].moon.subLord} abbr />.{" "}
                  {plain
                    ? "Relevant house changes are sampled during the scan; other house rulers may still change inside a slice. Recheck the chart at any time you select."
                    : "The scan samples changes to relevant cusps; other cusp sub lords may still change within an interval. Recheck the chart at any selected time."}
                </p>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
