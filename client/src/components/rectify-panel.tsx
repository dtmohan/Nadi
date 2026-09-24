import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, fmtDegShort, type Planet } from "@shared/astro";
import type { RectifyResult, RectifySegment, RectifyEvent } from "@shared/rectify-types";
import type { JaiminiArea } from "@shared/jaimini-areas";
import { PlanetName } from "@/components/planet-name";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { chartsStore, CHARTS_QUERY_KEY } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";
import { useJudgePlace } from "@/lib/judge-place";
import { JudgePlaceControl } from "@/components/judge-place";
import { cn } from "@/lib/utils";

/** Rectification methods. One at a time, never blended; each cites its own source. */
export type RectifyMethod = "kp-rp" | "kp-moon" | "kp-events" | "kp-transit" | "jaimini-dasha";
const METHODS: Array<{ id: RectifyMethod; system: string; label: string; short: string; source: string; needsJudge: boolean; needsEvents: boolean }> = [
  {
    id: "kp-rp",
    system: "KP",
    label: "Ruling planets",
    short: "At the true birth time the lagna's sign lord, star lord and sub lord agree with the ruling planets of the moment you sit down to judge; the sub lord is the decisive agreement. A node in a ruling planet's sign or star acts for it; a retrograde ruling planet is doubtful and its star lord is admitted in its place.",
    source: "Astro Secrets & KP Part 3, ch. 30, pp. 160-163; Part 1, pp. 173-178",
    needsJudge: true,
    needsEvents: false,
  },
  {
    id: "kp-moon",
    system: "KP",
    label: "Moon lords",
    short: "At the true birth time the lagna cusp sub lord tells the birth star: it is the star's lord, or it stands in that lord's star, sub, sub-sub or sookshma, or the planet whose sub it occupies does; failing the star it should at least own or stand in the Moon sign. Telling the very birth star is the stronger confirmation, and the corrected time must stay inside the time the family gave. Needs nothing but the chart, so it is a first sieve before the other methods.",
    source: "M.P. Shanmugham, Astro Secrets & KP Part 2, pp. 80-82",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "kp-events",
    system: "KP",
    label: "Dated events",
    short: "At each remembered event the dasa, bhukti and antara lords running that day must be significators of the houses of that matter, and the cusp of the matter must promise it through its sub lord. Intervals where the period lords fail an event are rejected.",
    source: "Astro Secrets & KP Part 1, pp. 167-172; Part 2, p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "kp-transit",
    system: "KP",
    label: "Transits",
    short: "Two hints. The sub the Sun transits on the day you work points to the lagna sub (N. Nataraj). On the day of an event the dasa and bhukti lords transit the sign, star and sub of significators of the matter, so a candidate whose significators they fail is doubtful.",
    source: "Astro Secrets & KP Part 2, p. 192 and p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "jaimini-dasha",
    system: "Jaimini",
    label: "Chara dasha",
    short: "For a doubtful horoscope K.N. Rao runs the chara dasha and asks whether the mahadasha and antardasha signs running at indisputable events carry those matters: the area's karaka, pada or house counted from the dasha sign. The check is by rising sign, so every interval in one sign scores alike; widen the window to test the neighbouring signs.",
    source: "K.N. Rao, Predicting through Jaimini's Chara Dasa, Vani Publications; the triggers are those of the Jaimini tab's timing",
    needsJudge: false,
    needsEvents: true,
  },
];

/** Method label for running text; only "Moon" keeps its capital. */
function methodLabel(m: { label: string }): string {
  return m.label.startsWith("Moon") ? m.label : m.label.toLowerCase();
}

/** Score of one interval under one method. */
function methodScore(s: RectifySegment, m: RectifyMethod): { score: number; max: number } {
  if (m === "kp-rp") return { score: s.rp.score, max: s.rp.max };
  if (m === "kp-moon") return { score: s.moonLords.score, max: s.moonLords.max };
  if (m === "kp-events") return s.events.reduce((acc, e) => ({ score: acc.score + e.score, max: acc.max + e.max }), { score: 0, max: 0 });
  if (m === "jaimini-dasha") return s.events.reduce((acc, e) => ({ score: acc.score + (e.jaimini?.score ?? 0), max: acc.max + (e.jaimini?.max ?? 0) }), { score: 0, max: 0 });
  return s.events.reduce((acc, e) => ({ score: acc.score + e.transit.score, max: acc.max + e.transit.max }), { score: s.sunHint.score, max: s.sunHint.max });
}

/** Matters a dated event can be checked against: the houses KP times them by and the cusp that must promise them. */
/** The Jaimini area column is the life area of the Jaimini tab whose dasha triggers the chara dasha method reuses. */
const MATTERS: Array<{ id: string; label: string; houses: number[]; cusp: number; area?: JaiminiArea }> = [
  { id: "marriage", label: "Marriage", houses: [2, 7, 11], cusp: 7, area: "marriage" },
  { id: "child", label: "Birth of a child", houses: [2, 5, 11], cusp: 5, area: "children" },
  { id: "job", label: "New job, promotion", houses: [2, 6, 10, 11], cusp: 10, area: "career" },
  { id: "job-loss", label: "Loss of job", houses: [5, 8, 12], cusp: 10, area: "career" },
  { id: "business", label: "Started a business", houses: [2, 7, 10, 11], cusp: 10, area: "career" },
  { id: "property", label: "Bought a house or land", houses: [4, 11, 12], cusp: 4, area: "family" },
  { id: "vehicle", label: "Bought a vehicle", houses: [4, 11], cusp: 4, area: "wealth" },
  { id: "education", label: "Admission to higher study", houses: [4, 9, 11], cusp: 4, area: "children" },
  { id: "abroad", label: "Went abroad", houses: [3, 9, 12], cusp: 12, area: "family" },
  { id: "return", label: "Returned from abroad", houses: [2, 4, 11], cusp: 4, area: "family" },
  { id: "illness", label: "Illness, operation, hospital", houses: [6, 8, 12], cusp: 6, area: "health" },
  { id: "accident", label: "Accident", houses: [6, 8, 12], cusp: 8, area: "health" },
  { id: "father", label: "Death of father", houses: [3, 4, 8], cusp: 9, area: "family" },
  { id: "mother", label: "Death of mother", houses: [3, 8, 11], cusp: 4, area: "family" },
  { id: "spouse", label: "Death of spouse", houses: [1, 2, 6, 10], cusp: 7, area: "marriage" },
  { id: "move", label: "Change of residence", houses: [3, 12], cusp: 4, area: "family" },
  { id: "litigation", label: "Won a case", houses: [1, 6, 11], cusp: 6, area: "health" },
  { id: "loan", label: "Loan or large receipt", houses: [2, 6, 11], cusp: 6, area: "wealth" },
];

interface EventRow {
  key: number;
  matter: string;
  date: string;
}

const WINDOWS = [10, 15, 30, 60, 120, 180];

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

const SIGNS3 = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

function Mark({ on, title }: { on: boolean; title?: string }) {
  return (
    <span title={title} className={cn("inline-block h-2.5 w-2.5 rounded-full align-middle", on ? "bg-emerald-500" : "bg-muted-foreground/25")} aria-label={on ? "agrees" : "does not agree"} />
  );
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-block h-1.5 w-10 overflow-hidden rounded bg-muted">
        <span className="absolute inset-y-0 left-0 rounded bg-foreground" style={{ width: `${pct}%` }} />
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
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sortByScore, setSortByScore] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const judge = useJudgePlace();

  const eventPayload = useMemo<RectifyEvent[]>(
    () =>
      events
        .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))
        .map((e) => {
          const m = MATTERS.find((x) => x.id === e.matter) ?? MATTERS[0];
          return { label: m.label, date: e.date, houses: m.houses, cusp: m.cusp, area: m.area };
        }),
    [events],
  );

  const scan = useMutation({
    mutationFn: async () => {
      const { id: _id, ...insert } = chart;
      const res = await apiRequest("POST", "/api/kp/rectify", { chart: insert, windowMinutes, events: eventPayload, judge: judge ? { latitude: judge.latitude, longitude: judge.longitude, timezone: judge.timezone, label: judge.label } : undefined });
      return (await res.json()) as RectifyResult;
    },
    onError: (e: any) => toast({ title: "Could not scan the window", description: e.message, variant: "destructive" }),
  });

  const saveCopy = useMutation({
    mutationFn: async (seg: RectifySegment) => {
      const { id: _id, ...insert } = chart;
      const time = seg.mid;
      const base = chart.name.replace(/\s*\(rectified[^)]*\)\s*$/i, "");
      const sc = methodScore(seg, method);
      const inputs = [
        m.needsJudge && data ? `judged ${DateTime.fromISO(data.ruling.asOf).setZone(data.judgedAt.timezone).toFormat("d LLL yyyy HH:mm")} from ${data.judgedAt.label}` : "",
        m.needsEvents && eventPayload.length ? `events ${eventPayload.map((e) => `${e.label} ${e.date}`).join("; ")}` : "",
      ].filter(Boolean).join("; ");
      return chartsStore.create({ ...insert, name: `${base} (rectified ${time.slice(0, 5)})`, birthTime: time, notes: `${insert.notes ? insert.notes + "\n" : ""}Birth time rectified from ${chart.birthTime} by ${m.system} ${methodLabel(m)} (${m.source}): interval ${seg.start} to ${seg.end}, lagna ${seg.sign} sub lord ${seg.subLord}${method === "jaimini-dasha" ? ` (Jaimini lagna ${seg.jaiminiSign.name}, chara dasha ${seg.jaiminiSign.direction})` : ""}${method === "kp-moon" ? ` (${seg.moonLords.star.via}; birth star ${seg.moonLords.birthStar}, Moon in ${seg.moonLords.moonSign})` : ""}, score ${sc.score} of ${sc.max}${inputs ? "; " + inputs : ""}.` });
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
      toast({ title: "Saved a rectified copy", description: `${c.name} at ${c.birthTime}` });
      navigate(`/chart/${c.id}`);
    },
    onError: (e: any) => toast({ title: "Could not save the copy", description: e.message, variant: "destructive" }),
  });

  const data = scan.data;
  const scored = useMemo(() => (data ? data.segments.map((s, i) => ({ s, i, ...methodScore(s, method) })) : []), [data, method]);
  const top = scored.reduce((t, r) => Math.max(t, r.score), 0);
  const bestSet = useMemo(() => new Set(scored.filter((r) => r.score === top && top > 0).map((r) => r.i)), [scored, top]);
  const segments = useMemo(() => (sortByScore ? [...scored].sort((a, b) => b.score - a.score || a.i - b.i) : scored), [scored, sortByScore]);
  const maxOf = scored[0]?.max ?? 0;
  /** Jaimini is whole-sign: contiguous intervals in one rising sign form one row. */
  const signGroups = useMemo(() => {
    if (!data) return [];
    const groups: Array<{ first: number; last: number; sign: RectifySegment["jaiminiSign"]; score: number; max: number; given: boolean; nearest: number | null }> = [];
    data.segments.forEach((s, i) => {
      const g = groups[groups.length - 1];
      if (g && g.sign.index === s.jaiminiSign.index) {
        g.last = i;
        g.given = g.given || s.given;
      } else {
        const sc = methodScore(s, "jaimini-dasha");
        groups.push({ first: i, last: i, sign: s.jaiminiSign, score: sc.score, max: sc.max, given: s.given, nearest: null });
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
  const sortedGroups = useMemo(() => (sortByScore ? [...signGroups].sort((a, b) => b.score - a.score || a.first - b.first) : signGroups), [signGroups, sortByScore]);
  const missingEvents = m.needsEvents && eventPayload.length === 0;
  const givenIndex = data?.segments.findIndex((s) => s.given) ?? -1;
  const givenCusps = givenIndex >= 0 ? data!.segments[givenIndex].cuspSubLords : null;

  const addEvent = () => setEvents((ev) => [...ev, { key: Date.now(), matter: "marriage", date: "" }]);
  const setEvent = (key: number, patch: Partial<EventRow>) => setEvents((ev) => ev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const removeEvent = (key: number) => setEvents((ev) => ev.filter((e) => e.key !== key));

  return (
    <section data-testid="section-rectify">
      <h2 className="text-base font-semibold">
        <Term k="kp-rectification">Birth time rectification</Term>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The window around the recorded time {chart.birthTime} is cut at every change of the lagna's sign, star and sub lord, and each interval is scored by the method you choose. One scan serves every method; switch between them without scanning again. Saving an interval makes a copy of the chart at that time and leaves this one untouched.
      </p>

      <div role="tablist" aria-label="Rectification method" className="mt-3 inline-flex flex-wrap rounded-md border p-0.5 text-xs">
        {METHODS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={method === x.id}
            onClick={() => setMethod(x.id)}
            className={cn("rounded px-2.5 py-1", method === x.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            data-testid={`rectify-method-${x.id}`}
          >
            <span className="opacity-70">{x.system} ·</span> {x.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground" data-testid="rectify-method-text">
        {m.short} <span className="text-xs">({m.source}.)</span>
      </p>
      {m.needsJudge && <JudgePlaceControl birthPlace={chart.place} birthTimezone={chart.timezone} />}

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2 text-xs">
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          Window
          <Select value={String(windowMinutes)} onValueChange={(v) => setWindowMinutes(Number(v))}>
            <SelectTrigger className="h-8 w-32 text-xs" data-testid="select-rectify-window">
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
        <Button size="sm" variant="outline" className="h-8" onClick={addEvent} data-testid="button-rectify-add-event">
          Add a dated event
        </Button>
        {missingEvents && <span className="text-muted-foreground">This method needs at least one dated event.</span>}
        <Button size="sm" className="h-8" onClick={() => scan.mutate()} disabled={scan.isPending} data-testid="button-rectify-scan">
          {scan.isPending ? "Scanning…" : data ? "Scan again" : "Scan the window"}
        </Button>
      </div>

      {events.length > 0 && (
        <div className="mt-3 space-y-2" data-testid="rectify-events">
          {events.map((e) => (
            <div key={e.key} className="flex flex-wrap items-center gap-2 text-xs">
              <Select value={e.matter} onValueChange={(v) => setEvent(e.key, { matter: v })}>
                <SelectTrigger className="h-8 w-56 text-xs" data-testid={`select-rectify-matter-${e.key}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATTERS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.label} <span className="text-muted-foreground">({m.houses.join(", ")})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={e.date} onChange={(ev) => setEvent(e.key, { date: ev.target.value })} className="h-8 w-40 text-xs tabular" data-testid={`input-rectify-date-${e.key}`} />
              <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={() => removeEvent(e.key)} data-testid={`button-rectify-remove-${e.key}`}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="mt-5" data-testid="rectify-results">
          {method === "kp-rp" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Judged at {DateTime.fromISO(data.ruling.asOf).setZone(data.judgedAt.timezone).toFormat("d LLL yyyy HH:mm")} from {data.judgedAt.label} ({data.judgedAt.timezone}). Accepted as ruling:
              </span>
              {data.accepted.map((a) => (
                <Badge key={a.planet} variant={a.weight < 1 ? "outline" : "secondary"} className="no-default-hover-elevate whitespace-normal text-left" title={a.reason} data-testid={`rectify-accepted-${a.planet}`}>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <PlanetName planet={a.planet} abbr />
                    <span className="text-muted-foreground">{a.reason}</span>
                  </span>
                </Badge>
              ))}
            </div>
          )}
          {method === "kp-moon" && (() => {
            const g = data.segments.find((s) => s.given) ?? data.segments[0];
            return (
              <p className="text-xs text-muted-foreground" data-testid="rectify-moon-lords">
                Birth star {g.moonLords.birthStar}, lord <PlanetName planet={g.moonLords.birthStarLord} abbr />; Moon in {g.moonLords.moonSign}, lord <PlanetName planet={g.moonLords.moonSignLord} abbr />. The Moon's lords do not change across the window; only the lagna sub lord does. Levels: the sub lord is the birth star lord (4), stands in its star (3), in its sub, sub-sub or sookshma (2), or reaches it through the planet whose sub it occupies (1). The score is twice the level, plus one when the sub lord owns or stands in the Moon sign, so the very birth star always outranks a Moon-sign link.
              </p>
            );
          })()}
          {method === "kp-transit" && (
            <p className="text-xs text-muted-foreground" data-testid="rectify-sun-now">
              On {DateTime.fromISO(data.ruling.asOf).setZone(data.judgedAt.timezone).toFormat("d LLL yyyy")} the Sun transits {fmtDegShort(data.sunNow.lon % 30)} in the star of <PlanetName planet={data.sunNow.starLord} abbr /> and the sub of <PlanetName planet={data.sunNow.subLord} abbr />. Intervals whose lagna sub lord is <PlanetName planet={data.sunNow.subLord} abbr /> take the hint (2), a lagna star lord of <PlanetName planet={data.sunNow.subLord} abbr /> half of it (1). Event columns mark whether the sign, star and sub lords of the dasa and bhukti lords' transit on the event day signify the matter.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Recorded time {data.given.time} rises {fmtDegShort(data.given.lagna % 30)} of {data.segments.find((s) => s.given)?.sign ?? "the lagna sign"}.
            {method === "kp-moon" && " Several intervals usually pass at some level; keep those at the top level, then settle between them with the ruling planets or dated events. Shanmugham allows the chain to run to the sookshma because births are timed at different moments (first cry, laid down, head appearing)."}
            {method === "kp-rp" && " Half-weight badges are doubtful ruling planets (retrograde now) or their stand-ins. Rerun on another day and the ruling planets change; the intervals that agree every time are the ones to trust."}
            {method === "kp-events" && (eventPayload.length ? " Green marks are period lords that signify the matter's houses (four-step significators) and cusp sub lords that promise it." : " Add dated events and scan again to score by this method.")}
            {method === "kp-transit" && " The Sun hint changes daily; the event transits do not, so they are the steadier of the two."}
            {method === "jaimini-dasha" && (eventPayload.length ? ` Rows are rising signs, not sub-lord intervals. Each event shows the mahadasha and antardasha signs running that day (fwd, bwd: the direction the dasha runs from that lagna); a full mark means the sign carries the matter by Rao's threshold (the area's karaka in its house, its pada, or the karaka's own sign), a faint one a lighter touch. ${signGroups.length < 2 ? "Only one sign rises in this window; widen it to ± 120 or 180 min to test the neighbouring signs." : ""}` : " Add dated events and scan again to score by this method.")}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {method === "jaimini-dasha"
                ? `${signGroups.length} rising ${signGroups.length === 1 ? "sign" : "signs"} in ± ${data.windowMinutes} min · Jaimini chara dasha · best score ${groupTop} of ${signGroups[0]?.max ?? 0}`
                : `${data.segments.length} intervals in ± ${data.windowMinutes} min · ${m.system} ${methodLabel(m)} · best score ${Number.isInteger(top) ? top : top.toFixed(1)} of ${maxOf}`}
            </span>
            <button type="button" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground" onClick={() => setSortByScore((v) => !v)} data-testid="button-rectify-sort">
              {sortByScore ? "Sort by time" : "Sort by score"}
            </button>
          </div>

          {method === "jaimini-dasha" && (
            <div className="mt-2 overflow-x-auto">
              <Table className="text-[11px] leading-5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Rising</TableHead>
                    <TableHead className="whitespace-nowrap">Lagna sign</TableHead>
                    {eventPayload.map((e) => (
                      <TableHead key={e.label + e.date} className="whitespace-nowrap">
                        {e.label} <span className="text-muted-foreground tabular">{e.date}</span>
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
                      <TableRow key={g.first} className={cn(best && "bg-emerald-500/10", g.given && "outline outline-1 -outline-offset-1 outline-foreground/40")} data-testid={`rectify-sign-${g.first}`}>
                        <TableCell className="whitespace-nowrap tabular">
                          {first.start.slice(0, 5)}<span className="text-muted-foreground">:{first.start.slice(6)}</span>–{last.end.slice(0, 5)}<span className="text-muted-foreground">:{last.end.slice(6)}</span>
                          {g.given && <span className="ml-1.5 rounded border px-1 text-[10px] uppercase tracking-wide text-muted-foreground">given</span>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {g.sign.name} <span className="text-muted-foreground" title={`chara dasha runs ${g.sign.direction} from this sign`}>{g.sign.direction === "forward" ? "fwd" : "bwd"}</span>
                        </TableCell>
                        {first.events.map((e) => {
                          const f = e.jaimini;
                          if (!f) return <TableCell key={e.label + e.date} className="whitespace-nowrap text-muted-foreground">no Jaimini area for this matter</TableCell>;
                          const dot = (lvl: { hot: boolean; score: number; triggers: string[] }, what: string) => (
                            <span title={lvl.triggers.length ? lvl.triggers.join("\n") : `nothing in the ${what} sign speaks to this matter`} className={cn("inline-block h-2.5 w-2.5 rounded-full align-middle", lvl.hot ? "bg-emerald-500" : lvl.score > 0 ? "bg-emerald-500/40" : "bg-muted-foreground/25")} aria-label={lvl.hot ? "carries the matter" : lvl.score > 0 ? "light touch" : "no touch"} />
                          );
                          return (
                            <TableCell key={e.label + e.date} className="whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                {dot(f.md, "dasha")} {SIGNS3[f.mdSign]}
                                <span className="text-muted-foreground">·</span>
                                {dot(f.ad, "antardasha")} {SIGNS3[f.adSign]}
                                {f.cycle === 2 && <span className="text-muted-foreground">2nd cycle</span>}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="whitespace-nowrap">
                          <ScoreBar score={g.score} max={g.max} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {g.given ? (
                            <span className="text-muted-foreground">recorded sign</span>
                          ) : g.nearest !== null ? (
                            <button type="button" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50" title={`Saves the interval of this sign nearest the recorded time, ${data.segments[g.nearest].start} to ${data.segments[g.nearest].end}`} onClick={() => saveCopy.mutate(data.segments[g.nearest!])} disabled={saveCopy.isPending} data-testid={`button-rectify-save-sign-${g.first}`}>
                              Save nearest
                            </button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="mt-2 text-xs text-muted-foreground">
                Jaimini settles the sign; pick the minute inside it with a KP method. Save nearest copies the chart at the interval of that sign closest to the recorded time.
              </p>
            </div>
          )}

          {method !== "jaimini-dasha" && (
          <div className="mt-2 overflow-x-auto">
            <Table className="text-[11px] leading-5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Interval</TableHead>
                  <TableHead className="whitespace-nowrap">Lagna</TableHead>
                  <TableHead className="whitespace-nowrap">{method === "kp-moon" ? "Sign · star" : "Sign · star · sub"}</TableHead>
                  {method === "kp-transit" && <TableHead className="whitespace-nowrap">Sun sub</TableHead>}
                  {method === "kp-moon" && <TableHead className="whitespace-nowrap">Sub lord and birth star</TableHead>}
                  {method === "kp-moon" && <TableHead className="whitespace-nowrap">Moon sign</TableHead>}
                  {method !== "kp-rp" && method !== "kp-moon" &&
                    eventPayload.map((e) => (
                      <TableHead key={e.label + e.date} className="whitespace-nowrap">
                        {e.label} <span className="text-muted-foreground tabular">{e.date}</span>
                        {method === "kp-transit" && <span className="ml-1 text-muted-foreground">transit sign · star · sub</span>}
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
                    <TableRow key={s.startIso} className={cn(best && "bg-emerald-500/10", s.given && "outline outline-1 -outline-offset-1 outline-foreground/40")} data-testid={`rectify-segment-${i}`}>
                      <TableCell className="whitespace-nowrap tabular">
                        {s.start.slice(0, 5)}<span className="text-muted-foreground">:{s.start.slice(6)}</span>–{s.end.slice(0, 5)}<span className="text-muted-foreground">:{s.end.slice(6)}</span>
                        {s.given && <span className="ml-1.5 rounded border px-1 text-[10px] uppercase tracking-wide text-muted-foreground">given</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular">
                        {s.sign.slice(0, 3)} {degRange(s.lagnaFrom, s.lagnaTo)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {method === "kp-rp" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mark on={s.rp.sign} title={s.rp.via.sign} /> <PlanetName planet={s.signLord} abbr />
                            <span className="text-muted-foreground">·</span>
                            <Mark on={s.rp.star} title={s.rp.via.star} /> <PlanetName planet={s.starLord} abbr />
                            <span className="text-muted-foreground">·</span>
                            <Mark on={s.rp.sub} title={s.rp.via.sub} /> <PlanetName planet={s.subLord} abbr />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <PlanetName planet={s.signLord} abbr />
                            <span className="text-muted-foreground">·</span>
                            {method === "kp-transit" && <Mark on={s.sunHint.star} title={s.sunHint.star ? "lagna star lord is the Sun's transit sub lord" : undefined} />} <PlanetName planet={s.starLord} abbr />
                            {method !== "kp-moon" && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                {method === "kp-transit" && <Mark on={s.sunHint.sub} title={s.sunHint.sub ? "lagna sub lord is the Sun's transit sub lord" : undefined} />} <PlanetName planet={s.subLord} abbr />
                              </>
                            )}
                          </span>
                        )}
                      </TableCell>
                      {method === "kp-transit" && (
                        <TableCell className="whitespace-nowrap">
                          <ScoreBar score={s.sunHint.score} max={s.sunHint.max} />
                        </TableCell>
                      )}
                      {method === "kp-moon" && (
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5" title={s.moonLords.star.via}>
                            <span className={cn("rounded border px-1 text-[10px] tabular", s.moonLords.star.level === 4 ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : s.moonLords.star.level > 0 ? "text-foreground" : "text-muted-foreground")}>{s.moonLords.star.level}</span>
                            <Mark on={s.moonLords.star.level > 0} title={s.moonLords.star.via} /> <PlanetName planet={s.moonLords.subLord} abbr />
                            <span className="text-muted-foreground">in</span>
                            <Mark on={s.moonLords.chain.starLord === s.moonLords.birthStarLord} title={`star of ${s.moonLords.chain.starLord}`} /> <PlanetName planet={s.moonLords.chain.starLord} abbr />
                            <Mark on={s.moonLords.chain.subLord === s.moonLords.birthStarLord} title={`sub of ${s.moonLords.chain.subLord}`} /> <PlanetName planet={s.moonLords.chain.subLord} abbr />
                            <Mark on={s.moonLords.chain.subSubLord === s.moonLords.birthStarLord} title={`sub-sub of ${s.moonLords.chain.subSubLord}`} /> <PlanetName planet={s.moonLords.chain.subSubLord} abbr />
                            <Mark on={s.moonLords.chain.sookshmaLord === s.moonLords.birthStarLord} title={`sookshma of ${s.moonLords.chain.sookshmaLord}`} /> <PlanetName planet={s.moonLords.chain.sookshmaLord} abbr />
                            {s.moonLords.star.level === 1 && <span className="text-muted-foreground">via {PLANET_ABBR[s.moonLords.chain.subLord]}</span>}
                          </span>
                        </TableCell>
                      )}
                      {method === "kp-moon" && (
                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Mark on={s.moonLords.sign.owns} title={s.moonLords.sign.owns ? `${s.moonLords.subLord} owns ${s.moonLords.moonSign}` : `${s.moonLords.subLord} does not own ${s.moonLords.moonSign}`} /> owns
                            <Mark on={s.moonLords.sign.occupies} title={s.moonLords.sign.occupies ? `${s.moonLords.subLord} stands in ${s.moonLords.moonSign}` : `${s.moonLords.subLord} is not in ${s.moonLords.moonSign}`} /> in it
                          </span>
                        </TableCell>
                      )}
                      {method === "kp-transit" &&
                        s.events.map((e) => (
                          <TableCell key={e.label + e.date} className="whitespace-nowrap">
                            {[e.transit.dasa, e.transit.bhukti].map((t, k) => (
                              <span key={k} className="flex items-center gap-1.5">
                                <span className="w-9 shrink-0 text-muted-foreground">{k === 0 ? "dasa" : "bhukti"}</span>
                                <PlanetName planet={t.planet} abbr />
                                <span className="text-muted-foreground">in</span>
                                <Mark on={t.hits[0]} title={`sign lord ${t.signLord}`} /> <PlanetName planet={t.signLord} abbr />
                                <Mark on={t.hits[1]} title={`star lord ${t.starLord}`} /> <PlanetName planet={t.starLord} abbr />
                                <Mark on={t.hits[2]} title={`sub lord ${t.subLord}`} /> <PlanetName planet={t.subLord} abbr />
                              </span>
                            ))}
                          </TableCell>
                        ))}
                      {method === "kp-events" &&
                        s.events.map((e) => (
                        <TableCell key={e.label + e.date} className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Mark on={e.hits[0]} title={`dasa ${e.dasa} signifies ${e.signified[0].join(", ") || "none"}`} /> <PlanetName planet={e.dasa} abbr />
                            <Mark on={e.hits[1]} title={`bhukti ${e.bhukti} signifies ${e.signified[1].join(", ") || "none"}`} /> <PlanetName planet={e.bhukti} abbr />
                            <Mark on={e.hits[2]} title={`antara ${e.antara} signifies ${e.signified[2].join(", ") || "none"}`} /> <PlanetName planet={e.antara} abbr />
                            {e.cuspSubLord && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <Mark on={Boolean(e.promised)} title={`cusp sub lord ${e.cuspSubLord} ${e.promised ? "promises" : "does not promise"} ${e.houses.join(", ")}`} /> <PlanetName planet={e.cuspSubLord} abbr />
                              </>
                            )}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="whitespace-nowrap">
                        <ScoreBar score={score} max={max} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <button type="button" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground" onClick={() => setOpen(open === i ? null : i)} data-testid={`button-rectify-cusps-${i}`}>
                          {open === i ? "Hide" : "Cusps"}
                        </button>
                        {!s.given && (
                          <button type="button" className="ml-2 underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground disabled:opacity-50" onClick={() => saveCopy.mutate(s)} disabled={saveCopy.isPending} data-testid={`button-rectify-save-${i}`}>
                            Save
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          )}

          {open !== null && method !== "jaimini-dasha" && data.segments[open] && (
            <div className="mt-3 rounded-md border p-3 text-xs" data-testid="rectify-cusps-detail">
              <p className="font-medium">
                Cusp sub lords at {data.segments[open].mid} <span className="text-muted-foreground">(changes from the recorded time are marked)</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.segments[open].cuspSubLords.map((p, k) => {
                  const changed = givenCusps ? givenCusps[k] !== p : false;
                  return (
                    <Badge key={k} variant={changed ? "secondary" : "outline"} className={cn("no-default-hover-elevate tabular", changed && "ring-1 ring-foreground/50")} title={changed ? `was ${PLANET_ABBR[givenCusps![k] as Planet]}` : undefined}>
                      <span className="inline-flex items-center gap-1">
                        <span className="text-muted-foreground">{k + 1}</span> <PlanetName planet={p} abbr />
                        {changed && givenCusps && <span className="text-muted-foreground">(was {PLANET_ABBR[givenCusps[k]]})</span>}
                      </span>
                    </Badge>
                  );
                })}
              </div>
              <p className="mt-2 text-muted-foreground">
                Moon in this interval: star <PlanetName planet={data.segments[open].moon.starLord} abbr /> · sub <PlanetName planet={data.segments[open].moon.subLord} abbr />. Only the lagna is cut at every change; a cusp may change its sub lord inside an interval, so read the cusps at the exact time you settle on.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
