import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, fmtDegShort, type Planet } from "@shared/astro";
import type {
  RectifyResult,
  RectifySegment,
  RectifyEvent,
} from "@shared/rectify-types";
import { matterOf } from "@shared/events";
import { LifeEventsEditor } from "@/components/life-events";
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
import { useJudgePlace } from "@/lib/judge-place";
import { JudgePlaceControl } from "@/components/judge-place";
import { setBirthTime } from "@/components/birth-time-editor";
import { Cite } from "@/components/source-link";
import {
  limbTermsFor,
  scoreMarks,
  type BodyMarksResult,
} from "@shared/body-marks";
import {
  LimbDots,
  MarksChecklist,
  MarksDetail,
} from "@/components/rectify-marks";
import { cn } from "@/lib/utils";

/** Rectification methods. One at a time, never blended; each cites its own source. */
export type RectifyMethod =
  | "kp-rp"
  | "kp-moon"
  | "kp-events"
  | "kp-transit"
  | "jaimini-dasha"
  | "bj-marks";
const METHODS: Array<{
  id: RectifyMethod;
  system: string;
  label: string;
  plainLabel: string;
  short: string;
  plainShort: string;
  source: string;
  needsJudge: boolean;
  needsEvents: boolean;
}> = [
  {
    id: "kp-rp",
    system: "KP",
    label: "Ruling planets",
    plainLabel: "Planets ruling now",
    plainShort:
      "Krishnamurti holds that the planets ruling the sky at the moment you sit down to judge also rule the true rising degree: its sign ruler, star ruler and, most of all, its deciding planet should be among them. Rahu or Ketu can stand in for a planet whose sign or star they occupy; a planet moving backwards today is doubtful and its star ruler is admitted instead. Rerun on another day and trust the minutes that agree every time.",
    short:
      "At the true birth time the lagna's sign lord, star lord and sub lord agree with the ruling planets of the moment you sit down to judge; the sub lord is the decisive agreement. A node in a ruling planet's sign or star acts for it; a retrograde ruling planet is doubtful and its star lord is admitted in its place.",
    source:
      "Astro Secrets & KP Part 3, ch. 30, pp. 160-163; Part 1, pp. 173-178",
    needsJudge: true,
    needsEvents: false,
  },
  {
    id: "kp-moon",
    system: "KP",
    label: "Moon lords",
    plainLabel: "Moon's star",
    plainShort:
      "At the true birth time the deciding planet of the rising degree should point to the star the Moon was in at birth: it is that star's ruler, or stands in that ruler's star or in one of its finer divisions; failing that it should at least own or stand in the Moon's sign. It needs nothing but the chart, so it is the first sieve before the other methods, and the corrected time must stay inside what the family remembers.",
    short:
      "At the true birth time the lagna cusp sub lord tells the birth star: it is the star's lord, or it stands in that lord's star, sub, sub-sub or sookshma, or the planet whose sub it occupies does; failing the star it should at least own or stand in the Moon sign. Telling the very birth star is the stronger confirmation, and the corrected time must stay inside the time the family gave. Needs nothing but the chart, so it is a first sieve before the other methods.",
    source: "M.P. Shanmugham, Astro Secrets & KP Part 2, pp. 80-82",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "kp-events",
    system: "KP",
    label: "Dated events",
    plainLabel: "Dated events",
    plainShort:
      "For every event you remember with a date, the three planets whose periods were running that day should speak for the houses of that matter, and the house itself should be promised by its deciding planet. Minutes where the period planets fail an event are set aside.",
    short:
      "At each remembered event the dasa, bhukti and antara lords running that day must be significators of the houses of that matter, and the cusp of the matter must promise it through its sub lord. Intervals where the period lords fail an event are rejected.",
    source: "Astro Secrets & KP Part 1, pp. 167-172; Part 2, p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "kp-transit",
    system: "KP",
    label: "Transits",
    plainLabel: "Sky on the day",
    plainShort:
      "Two hints. The sub the Sun is passing through today points to the sub of the true rising degree (N. Nataraj). On the day of an event, the planets whose period and sub-period were running should be passing through the sign, star and sub of planets that speak for that matter; a candidate time whose planets fail this is doubtful.",
    short:
      "Two hints. The sub the Sun transits on the day you work points to the lagna sub (N. Nataraj). On the day of an event the dasa and bhukti lords transit the sign, star and sub of significators of the matter, so a candidate whose significators they fail is doubtful.",
    source: "Astro Secrets & KP Part 2, p. 192 and p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "jaimini-dasha",
    system: "Jaimini",
    label: "Chara dasha",
    plainLabel: "Sign periods",
    plainShort:
      "K.N. Rao's check for a doubtful chart: run Jaimini's sign-based periods and ask whether the period and sub-period signs running on the day of an undisputed event carry that matter. The check is by rising sign, so every minute in one sign scores alike; widen the window to test the neighbouring signs.",
    short:
      "For a doubtful horoscope K.N. Rao runs the chara dasha and asks whether the mahadasha and antardasha signs running at indisputable events carry those matters: the area's karaka, pada or house counted from the dasha sign. The check is by rising sign, so every interval in one sign scores alike; widen the window to test the neighbouring signs.",
    source:
      "K.N. Rao, Predicting through Jaimini's Chara Dasa, Vani Publications; the triggers are those of the Jaimini tab's timing",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "bj-marks",
    system: "Brihat Jataka",
    label: "Marks on the body",
    plainLabel: "Marks on the body",
    plainShort:
      "Varahamihira makes the twelve houses the parts of the body, head first, and which set of parts they stand for depends on which third of the rising sign is up: the head, the trunk or the lower body. A harsh planet in a house leaves a wound or scar on that part, a helpful one, or its gaze, a mole or birthmark; parts on the right for houses two to six, on the left for eight to twelve. Tick the marks you actually carry and see which third of the sign explains them. It settles the ten-degree third, not the minute.",
    short:
      "The twelve bhavas are the limbs of the body by the rising drekkana: the first drekkana gives the head, the second the trunk from the neck, the third the body from the pelvis; houses 2-6 are the right side, 8-12 the left. A malefic in a bhava wounds that limb, a benefic or a benefic's aspect marks it; own sign, own navamsa or a fixed sign makes the mark congenital. Three planets in one sign mark the limb without fail; a malefic in the 6th wounds. Confirm the limbs that carry marks and the drekkana that explains them is the sieve; it settles the drekkana, not the minute.",
    source:
      "Brihat Jataka 5.22-26 (Iyer 1885, pp. 49-53; Adyar 1951, pp. 301-308)",
    needsJudge: false,
    needsEvents: false,
  },
];

/** Method label for running text; only "Moon" keeps its capital. */
function methodLabel(m: { label: string }): string {
  return m.label.startsWith("Moon") ? m.label : m.label.toLowerCase();
}

/** Score of one interval under one method. */
function methodScore(
  s: RectifySegment,
  m: RectifyMethod,
  marks?: { table: Record<number, BodyMarksResult>; confirmed: Set<string> },
): { score: number; max: number } {
  if (m === "bj-marks") {
    const r = marks?.table[s.drekkana];
    if (!r) return { score: 0, max: 0 };
    const sc = scoreMarks(r, marks!.confirmed);
    return { score: sc.score, max: sc.max };
  }
  if (m === "kp-rp") return { score: s.rp.score, max: s.rp.max };
  if (m === "kp-moon")
    return { score: s.moonLords.score, max: s.moonLords.max };
  if (m === "kp-events")
    return s.events.reduce(
      (acc, e) => ({ score: acc.score + e.score, max: acc.max + e.max }),
      { score: 0, max: 0 },
    );
  if (m === "jaimini-dasha")
    return s.events.reduce(
      (acc, e) => ({
        score: acc.score + (e.jaimini?.score ?? 0),
        max: acc.max + (e.jaimini?.max ?? 0),
      }),
      { score: 0, max: 0 },
    );
  return s.events.reduce(
    (acc, e) => ({
      score: acc.score + e.transit.score,
      max: acc.max + e.transit.max,
    }),
    { score: s.sunHint.score, max: s.sunHint.max },
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

export function RectifyPanel({ result }: { result: ChartResult }) {
  const { chart } = result;
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [method, setMethod] = useState<RectifyMethod>("kp-rp");
  const m = METHODS.find((x) => x.id === method)!;
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [sortByScore, setSortByScore] = useState(false);
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
      events.map((e) => {
        const m = matterOf(e.matter);
        return {
          label: m.label,
          date: e.date,
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

  /** Why this interval was chosen, for the notes of the copy or of this chart. */
  const provenance = (seg: RectifySegment) => {
    const sc = methodScore(seg, method, marksCtx);
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
    return `by ${m.system} ${methodLabel(m)} (${m.source}): interval ${seg.start} to ${seg.end}, lagna ${seg.sign} sub lord ${seg.subLord}${method === "jaimini-dasha" ? ` (Jaimini lagna ${seg.jaiminiSign.name}, chara dasha ${seg.jaiminiSign.direction})` : ""}${method === "kp-moon" ? ` (${seg.moonLords.star.via}; birth star ${seg.moonLords.birthStar}, Moon in ${seg.moonLords.moonSign})` : ""}${method === "bj-marks" && data ? ` (${data.marks[seg.drekkana]?.drekkanaLabel}; confirmed ${Array.from(confirmedMarks).join(", ") || "none"})` : ""}, score ${sc.score} of ${sc.max}${inputs ? "; " + inputs : ""}`;
  };

  const saveCopy = useMutation({
    mutationFn: async (seg: RectifySegment) => {
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
    mutationFn: async (seg: RectifySegment) => {
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
        ? data.segments.map((s, i) => ({
            s,
            i,
            ...methodScore(s, method, marksCtx),
          }))
        : [],
    [data, method, marksCtx],
  );
  const top = scored.reduce((t, r) => Math.max(t, r.score), 0);
  const bestSet = useMemo(
    () =>
      new Set(scored.filter((r) => r.score === top && top > 0).map((r) => r.i)),
    [scored, top],
  );
  const segments = useMemo(
    () =>
      sortByScore
        ? [...scored].sort((a, b) => b.score - a.score || a.i - b.i)
        : scored,
    [scored, sortByScore],
  );
  const maxOf = scored[0]?.max ?? 0;

  // Shared timeline for the event methods: the candidate under review (the opened interval, else the best), its clock, and each event tinted by how well that candidate fits it.
  const focusIdx =
    open !== null && data && data.segments[open]
      ? open
      : bestSet.size
        ? Math.min(...Array.from(bestSet))
        : null;
  const focus = focusIdx !== null && data ? data.segments[focusIdx] : null;
  const tlBands = useMemo<TlBand[]>(() => {
    if (!focus) return [];
    if (method === "jaimini-dasha")
      return charaBands(
        charaDasha(focus.jaiminiSign.index, result.positions, result.utc),
        result.now.asOf,
      );
    const moon = result.kp.positions.find((p) => p.planet === "Moon");
    return moon
      ? vimshottariBands(vimshottari(moon.lon, result.utc, result.now.asOf), {
          label: "KP dasa",
        })
      : [];
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
        date: DateTime.fromISO(e.date, { zone: chart.timezone }).toISO()!,
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
  /** Jaimini is whole-sign: contiguous intervals in one rising sign form one row. */
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
    }> = [];
    data.segments.forEach((s, i) => {
      const g = groups[groups.length - 1];
      if (g && g.sign.index === s.jaiminiSign.index) {
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
        });
      }
    });
    const givenIdx = data.segments.findIndex((s) => s.given);
    for (const g of groups) {
      if (g.given) continue;
      g.nearest = givenIdx < g.first ? g.first : g.last;
    }
    return groups;
  }, [data]);
  const groupTop = signGroups.reduce((t, g) => Math.max(t, g.score), 0);
  // Brihat Jataka marks: rows are rising drekkanas, since every interval in one drekkana reads alike.
  const drekkanaGroups = useMemo(() => {
    if (!data) return [];
    const groups: Array<{
      first: number;
      last: number;
      drekkana: number;
      score: number;
      max: number;
      given: boolean;
      nearest: number | null;
    }> = [];
    data.segments.forEach((s, i) => {
      const g = groups[groups.length - 1];
      if (g && g.drekkana === s.drekkana) {
        g.last = i;
        g.given = g.given || s.given;
      } else {
        const sc = methodScore(s, "bj-marks", marksCtx);
        groups.push({
          first: i,
          last: i,
          drekkana: s.drekkana,
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
      g.nearest = givenIdx < g.first ? g.first : g.last;
    }
    return groups;
  }, [data, marksCtx]);
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
    drekkanaGroups.find((g) => g.given)?.drekkana ??
    drekkanaGroups[0]?.drekkana ??
    null;
  const sortedGroups = useMemo(
    () =>
      sortByScore
        ? [...signGroups].sort((a, b) => b.score - a.score || a.first - b.first)
        : signGroups,
    [signGroups, sortByScore],
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
      <ModeText
        className="text-sm"
        plain={
          <>
            Recorded birth times are often a few minutes off, and a few minutes
            can change the planet that decides the rising degree. The minutes
            around the recorded time {chart.birthTime} are cut into slices
            wherever that deciding planet, its star ruler or the rising sign
            changes, and each slice is scored by one method at a time; the
            methods are never blended. One scan serves every method. Use here
            moves this chart to that time, keeping its name and life events;
            Save makes a copy at that time and leaves this one untouched.
          </>
        }
        practitioner={
          <>
            The window around the recorded time {chart.birthTime} is cut at
            every change of the lagna's sign, star and sub lord, and each
            interval is scored by the method you choose. One scan serves every
            method; switch between them without scanning again. Use here moves
            this chart to that interval's midpoint, keeping its name and events;
            Save makes a copy at that time and leaves this one untouched.
          </>
        }
      />

      <div
        role="tablist"
        aria-label="Rectification method"
        className="mt-3 inline-flex flex-wrap rounded-md border p-0.5 text-xs"
      >
        {METHODS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={method === x.id}
            onClick={() => setMethod(x.id)}
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
            . Usually a few seconds.
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
          {method === "kp-moon" &&
            (() => {
              const g = data.segments.find((s) => s.given) ?? data.segments[0];
              return (
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="rectify-moon-lords"
                >
                  {plain ? (
                    <>
                      The Moon was in the star {g.moonLords.birthStar}, ruled by{" "}
                      <PlanetName planet={g.moonLords.birthStarLord} abbr />,
                      and in the sign {g.moonLords.moonSign}, ruled by{" "}
                      <PlanetName planet={g.moonLords.moonSignLord} abbr />;
                      these do not change across the window, only the rising
                      degree's deciding planet does. Levels: the deciding planet
                      is the star's ruler (4), stands in that ruler's star (3),
                      in one of its finer divisions (2), or reaches it through
                      the planet whose sub it stands in (1). The score is twice
                      the level, plus one when it owns or stands in the Moon's
                      sign, so hitting the very star always outranks a sign
                      link.
                    </>
                  ) : (
                    <>
                      Birth star {g.moonLords.birthStar}, lord{" "}
                      <PlanetName planet={g.moonLords.birthStarLord} abbr />;
                      Moon in {g.moonLords.moonSign}, lord{" "}
                      <PlanetName planet={g.moonLords.moonSignLord} abbr />. The
                      Moon's lords do not change across the window; only the
                      lagna sub lord does. Levels: the sub lord is the birth
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
                ? " Outlined badges are doubtful rulers (moving backwards today) or their stand-ins and count half. Rerun on another day and the ruling planets change; the slices that agree every time are the ones to trust."
                : " Half-weight badges are doubtful ruling planets (retrograde now) or their stand-ins. Rerun on another day and the ruling planets change; the intervals that agree every time are the ones to trust.")}
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
                  ? ` Rows are rising signs, not minute slices. Each event shows the period and sub-period signs running that day (fwd, bwd: the direction the periods run from that rising sign); a full dot means the sign carries the matter by Rao's threshold, a faint one a lighter touch. ${signGroups.length < 2 ? "Only one sign rises in this window; widen it to ± 120 or 180 min to test the neighbouring signs." : ""}`
                  : ` Rows are rising signs, not sub-lord intervals. Each event shows the mahadasha and antardasha signs running that day (fwd, bwd: the direction the dasha runs from that lagna); a full mark means the sign carries the matter by Rao's threshold (the area's karaka in its house, its pada, or the karaka's own sign), a faint one a lighter touch. ${signGroups.length < 2 ? "Only one sign rises in this window; widen it to ± 120 or 180 min to test the neighbouring signs." : ""}`
                : " Add dated events and scan again to score by this method.")}
            {method === "bj-marks" &&
              (plain
                ? ` Rows are thirds of the rising sign, not minute slices; each lists the body parts the planets should have marked, green where you ticked the part above. ${drekkanaGroups.length < 2 ? "Only one third rises in this window; widen it to ± 60 min or more to test the neighbouring thirds." : ""}`
                : ` Rows are rising drekkanas, not sub-lord intervals; each lists the limbs the planets and benefic aspects predict, green where confirmed above. ${drekkanaGroups.length < 2 ? "Only one drekkana rises in this window; widen it to ± 60 min or more to test the neighbouring drekkanas." : ""}`)}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {method === "jaimini-dasha"
                ? `${signGroups.length} rising ${signGroups.length === 1 ? "sign" : "signs"} in ± ${data.windowMinutes} min · ${plain ? "Jaimini sign periods" : "Jaimini chara dasha"} · best score ${groupTop} of ${signGroups[0]?.max ?? 0}`
                : method === "bj-marks"
                  ? `${drekkanaGroups.length} rising ${drekkanaGroups.length === 1 ? "drekkana" : "drekkanas"} in ± ${data.windowMinutes} min · Brihat Jataka marks · ${confirmedMarks.size ? `best ${drekkanaTop} confirmed` : "tick your marks above to score"}`
                  : `${data.segments.length} ${plain ? "slices" : "intervals"} in ± ${data.windowMinutes} min · ${m.system} ${plain ? m.plainLabel.toLowerCase() : methodLabel(m)} · best score ${Number.isInteger(top) ? top : top.toFixed(1)} of ${maxOf}`}
            </span>
            <button
              type="button"
              className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
              onClick={() => setSortByScore((v) => !v)}
              data-testid="button-rectify-sort"
            >
              {sortByScore ? "Sort by time" : "Sort by score"}
            </button>
          </div>

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
                      ? "the best-scoring interval; open another row to compare"
                      : "the opened row"}
                    . Green events fit fully, amber in part, red not at all.
                  </span>
                </p>
                <LifeTimeline
                  className="mt-2"
                  testid="rectify-timeline"
                  birthIso={result.utc}
                  asOfIso={result.now.asOf}
                  bands={tlBands}
                  marks={tlMarks}
                  marksLabel="Fit"
                />
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
                    const r = data.marks[g.drekkana];
                    const best = g.score === drekkanaTop && drekkanaTop > 0;
                    const shown = shownDrekkana === g.drekkana;
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
                              setOpenDrekkana(shown ? null : g.drekkana)
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
              {shownDrekkana !== null && data.marks[shownDrekkana] && (
                <MarksDetail
                  r={data.marks[shownDrekkana]}
                  confirmed={confirmedMarks}
                  plain={plain}
                  degrees={`${(shownDrekkana % 3) * 10}°–${(shownDrekkana % 3) * 10 + 10}°`}
                />
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                The marks settle the drekkana; pick the minute inside it with a
                KP method. Use nearest here moves this chart to the{" "}
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
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((g) => {
                    const first = data.segments[g.first];
                    const last = data.segments[g.last];
                    const best = g.score === groupTop && groupTop > 0;
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
                Jaimini settles the sign; pick the minute inside it with a KP
                method. Use nearest here moves this chart to the{" "}
                {plain ? "slice" : "interval"} of that sign closest to the
                recorded time; Save nearest makes a copy there.
              </p>
            </div>
          )}

          {method !== "jaimini-dasha" && method !== "bj-marks" && (
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
                    <TableHead className="whitespace-nowrap">
                      {method === "kp-moon"
                        ? plain
                          ? "Sign · star rulers"
                          : "Sign · star"
                        : plain
                          ? "Sign · star · deciding"
                          : "Sign · star · sub"}
                    </TableHead>
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
                    {method !== "kp-rp" &&
                      method !== "kp-moon" &&
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
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map(({ s, i, score, max }) => {
                    const best = bestSet.has(i);
                    return (
                      <TableRow
                        key={s.startIso}
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
                        <TableCell className="whitespace-nowrap">
                          <ScoreBar score={score} max={max} />
                        </TableCell>
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
                                disabled={busy}
                                data-testid={`button-rectify-use-${i}`}
                              >
                                Use here
                              </button>
                              <button
                                type="button"
                                className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50"
                                title={`Saves a copy of the chart at ${s.mid}`}
                                onClick={() => saveCopy.mutate(s)}
                                disabled={busy}
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
            method !== "jaimini-dasha" &&
            method !== "bj-marks" &&
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
                    ? "Only the rising degree is cut at every change; another house may change its deciding planet inside a slice, so read the houses at the exact time you settle on."
                    : "Only the lagna is cut at every change; a cusp may change its sub lord inside an interval, so read the cusps at the exact time you settle on."}
                </p>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
