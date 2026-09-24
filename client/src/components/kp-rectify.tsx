import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, fmtDegShort, type Planet } from "@shared/astro";
import type { RectifyResult, RectifySegment, RectifyEvent } from "@shared/rectify-types";
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
import { cn } from "@/lib/utils";

/** Matters a dated event can be checked against: the houses KP times them by and the cusp that must promise them. */
const MATTERS: Array<{ id: string; label: string; houses: number[]; cusp: number }> = [
  { id: "marriage", label: "Marriage", houses: [2, 7, 11], cusp: 7 },
  { id: "child", label: "Birth of a child", houses: [2, 5, 11], cusp: 5 },
  { id: "job", label: "New job, promotion", houses: [2, 6, 10, 11], cusp: 10 },
  { id: "job-loss", label: "Loss of job", houses: [5, 8, 12], cusp: 10 },
  { id: "business", label: "Started a business", houses: [2, 7, 10, 11], cusp: 10 },
  { id: "property", label: "Bought a house or land", houses: [4, 11, 12], cusp: 4 },
  { id: "vehicle", label: "Bought a vehicle", houses: [4, 11], cusp: 4 },
  { id: "education", label: "Admission to higher study", houses: [4, 9, 11], cusp: 4 },
  { id: "abroad", label: "Went abroad", houses: [3, 9, 12], cusp: 12 },
  { id: "return", label: "Returned from abroad", houses: [2, 4, 11], cusp: 4 },
  { id: "illness", label: "Illness, operation, hospital", houses: [6, 8, 12], cusp: 6 },
  { id: "accident", label: "Accident", houses: [6, 8, 12], cusp: 8 },
  { id: "father", label: "Death of father", houses: [3, 4, 8], cusp: 9 },
  { id: "mother", label: "Death of mother", houses: [3, 8, 11], cusp: 4 },
  { id: "spouse", label: "Death of spouse", houses: [1, 2, 6, 10], cusp: 7 },
  { id: "move", label: "Change of residence", houses: [3, 12], cusp: 4 },
  { id: "litigation", label: "Won a case", houses: [1, 6, 11], cusp: 6 },
  { id: "loan", label: "Loan or large receipt", houses: [2, 6, 11], cusp: 6 },
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

export function KpRectify({ result }: { result: ChartResult }) {
  const { chart } = result;
  const { toast } = useToast();
  const [, navigate] = useLocation();
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
          return { label: m.label, date: e.date, houses: m.houses, cusp: m.cusp };
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
      return chartsStore.create({ ...insert, name: `${base} (rectified ${time.slice(0, 5)})`, birthTime: time, notes: `${insert.notes ? insert.notes + "\n" : ""}Birth time rectified by KP from ${chart.birthTime}: lagna sub lord ${seg.subLord}, interval ${seg.start} to ${seg.end}.` });
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
      toast({ title: "Saved a rectified copy", description: `${c.name} at ${c.birthTime}` });
      navigate(`/chart/${c.id}`);
    },
    onError: (e: any) => toast({ title: "Could not save the copy", description: e.message, variant: "destructive" }),
  });

  const data = scan.data;
  const segments = useMemo(() => {
    if (!data) return [];
    const rows = data.segments.map((s, i) => ({ s, i }));
    return sortByScore ? [...rows].sort((a, b) => b.s.score - a.s.score || a.i - b.i) : rows;
  }, [data, sortByScore]);
  const givenIndex = data?.segments.findIndex((s) => s.given) ?? -1;
  const givenCusps = givenIndex >= 0 ? data!.segments[givenIndex].cuspSubLords : null;

  const addEvent = () => setEvents((ev) => [...ev, { key: Date.now(), matter: "marriage", date: "" }]);
  const setEvent = (key: number, patch: Partial<EventRow>) => setEvents((ev) => ev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const removeEvent = (key: number) => setEvents((ev) => ev.filter((e) => e.key !== key));

  return (
    <section className="mt-10" data-testid="section-kp-rectify">
      <h2 className="text-base font-semibold">
        <Term k="kp-rectification">Birth time rectification</Term>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Krishnamurti's test: at the true birth time the lagna's sign lord, star lord and sub lord agree with the <Term k="kp-ruling-planets">ruling planets</Term> of the moment you sit down to judge, and the sub lord is the decisive agreement (Astro Secrets &amp; KP Part 3, ch. 30, pp. 160-163; Part 1, pp. 173-178). Dated events sharpen it: at each event the dasa, bhukti and antara lords must signify the houses of that matter and the cusp concerned must promise it (Part 1, pp. 167-172; Part 2, p. 203). The window around the recorded time {chart.birthTime} is cut at every change of the lagna's lords and each interval is scored.
      </p>

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
        <span className="text-muted-foreground">
          Judging from {judge ? judge.label : `${chart.place} (the birth place; set your own above)`}
        </span>
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
          <p className="mt-1 text-xs text-muted-foreground">
            Recorded time {data.given.time} rises {fmtDegShort(data.given.lagna % 30)} of {data.segments.find((s) => s.given)?.sign ?? "the lagna sign"}. Half-weight badges are doubtful ruling planets (retrograde now) or their stand-ins. Rerun on another day and the ruling planets change; the intervals that agree every time are the ones to trust.
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {data.segments.length} intervals in ± {data.windowMinutes} min · best score {Math.max(...data.segments.map((s) => s.score))} of {data.segments[0]?.max ?? 0}
            </span>
            <button type="button" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground" onClick={() => setSortByScore((v) => !v)} data-testid="button-rectify-sort">
              {sortByScore ? "Sort by time" : "Sort by score"}
            </button>
          </div>

          <div className="mt-2 overflow-x-auto">
            <Table className="text-[11px] leading-5 [&_td]:px-2 [&_td]:py-1.5 [&_th]:h-8 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Interval</TableHead>
                  <TableHead className="whitespace-nowrap">Lagna</TableHead>
                  <TableHead className="whitespace-nowrap">Sign · star · sub</TableHead>
                  <TableHead className="whitespace-nowrap">Ruling</TableHead>
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
                {segments.map(({ s, i }) => {
                  const best = data.best.includes(i);
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
                        <span className="inline-flex items-center gap-1.5">
                          <Mark on={s.rp.sign} title={s.rp.via.sign} /> <PlanetName planet={s.signLord} abbr />
                          <span className="text-muted-foreground">·</span>
                          <Mark on={s.rp.star} title={s.rp.via.star} /> <PlanetName planet={s.starLord} abbr />
                          <span className="text-muted-foreground">·</span>
                          <Mark on={s.rp.sub} title={s.rp.via.sub} /> <PlanetName planet={s.subLord} abbr />
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ScoreBar score={s.rp.score} max={s.rp.max} />
                      </TableCell>
                      {s.events.map((e) => (
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
                        <ScoreBar score={s.score} max={s.max} />
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

          {open !== null && data.segments[open] && (
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
