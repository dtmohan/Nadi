import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { SIGNS, SIGN_ABBR } from "@shared/astro";
import { JAIMINI_AREAS, RAO_SOURCE, RAO_NOTES_SOURCE, currentFor, isHot, readAreas, type AreaPeriod, type AreaReading, type JaiminiArea, type Tone } from "@shared/jaimini-areas";
import { TRANSIT_GRADE_LABEL, confirmTransits, summarizeTouches, type TransitConfirmation } from "@shared/jaimini-transit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SourceLink } from "@/components/source-link";

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}
const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

function ToneDot({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-[0.5em] inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        tone === "support" && "bg-[hsl(var(--chart-4))]",
        tone === "strain" && "bg-destructive",
        tone === "neutral" && "bg-foreground/40",
      )}
    />
  );
}

function BalanceBadge({ balance }: { balance: number }) {
  const label = balance >= 2 ? "supported" : balance <= -2 ? "strained" : "mixed";
  return (
    <Badge
      variant="outline"
      className={cn(
        "no-default-hover-elevate text-[10px]",
        label === "supported" && "border-[hsl(var(--chart-4))]/60 text-[hsl(var(--chart-4))]",
        label === "strained" && "border-destructive/60 text-destructive",
      )}
    >
      {label}
    </Badge>
  );
}

function heatClass(score: number, hot: boolean) {
  if (!hot || score === 0) return "bg-muted";
  if (score >= 6) return "bg-primary";
  if (score >= 4) return "bg-primary/70";
  return "bg-primary/40";
}

/** One row per mahadasha, width proportional to years; the running period carries a marker. */
function HeatStrip({ periods, selected, onSelect, now }: { periods: AreaPeriod[]; selected: string | null; onSelect: (k: string) => void; now: DateTime }) {
  const total = periods.reduce((s, p) => s + p.years, 0);
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md border" role="tablist" aria-label="Chara dasha periods">
      {periods.map((p) => {
        const key = `${p.cycle}-${p.sign}`;
        const cur = now >= DateTime.fromISO(p.start) && now < DateTime.fromISO(p.end);
        const hot = isHot(p.triggers);
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected === key}
            title={`${SIGNS[p.sign]} · age ${p.ageStart}–${p.ageStart + p.years}`}
            onClick={() => onSelect(key)}
            style={{ width: `${(p.years / total) * 100}%` }}
            className={cn(
              "relative flex items-center justify-center border-r text-[10px] font-medium leading-none last:border-r-0",
              heatClass(p.score, hot),
              hot && p.score >= 4 ? "text-primary-foreground" : "text-foreground/80",
              selected === key && "ring-2 ring-inset ring-foreground/70",
            )}
            data-testid={`heat-${key}`}
          >
            {p.years >= 3 && <span className={cn(p.years < 5 && "hidden sm:inline")}>{SIGN_ABBR[p.sign]}</span>}
            {cur && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-foreground" />}
          </button>
        );
      })}
    </div>
  );
}

function gradeClass(g: TransitConfirmation["grade"]) {
  return g === 3 ? "border-chart-4/60 bg-chart-4/10 text-foreground" : g === 2 ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground";
}

/** Rao's transit check for one window: where Jupiter and Saturn stand, which anchors they touch, and when both touch the same one. */
function TransitCheck({ c, compact, testId }: { c: TransitConfirmation; compact?: boolean; testId: string }) {
  const [open, setOpen] = useState(false);
  const ju = summarizeTouches(c.touches, "Jupiter");
  const sa = summarizeTouches(c.touches, "Saturn");
  const shownDouble = open || !compact ? c.double : c.double.slice(0, 3);
  return (
    <div className={cn("mt-2 rounded border border-dashed px-2 py-1.5", compact ? "text-[11px]" : "text-xs")} data-testid={testId}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-muted-foreground">Transit check</span>
        <Badge variant="outline" className={cn("no-default-hover-elevate text-[9px]", gradeClass(c.grade))}>
          {TRANSIT_GRADE_LABEL[c.grade]}
        </Badge>
      </div>
      {c.grade === 0 ? (
        <p className="mt-1 text-muted-foreground">Neither Jupiter nor Saturn is on or aspecting the area's anchors in this window; Rao would hold the result lightly.</p>
      ) : (
        <>
          {shownDouble.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {shownDouble.map((d, i) => (
                <li key={i} className="leading-snug">
                  <span className="font-medium">Double transit on {d.target.label}</span> <span className="tabular">{fmt(d.start)} – {fmt(d.end)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    (Jupiter {d.jupiter.relation === "in" ? "in" : "aspecting from"} {SIGNS[d.jupiter.from]}, Saturn {d.saturn.relation === "in" ? "in" : "aspecting from"} {SIGNS[d.saturn.from]})
                  </span>
                </li>
              ))}
            </ul>
          )}
          {compact && c.double.length > 3 && (
            <Button variant="ghost" size="sm" className="mt-0.5 h-6 px-1.5 text-[11px]" onClick={() => setOpen((v) => !v)}>
              {open ? "Fewer" : `${c.double.length - 3} more double transits`}
            </Button>
          )}
          {(!compact || open || c.double.length === 0) && (
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {[...ju, ...sa].map((line, i) => (
                <li key={i} className="leading-snug">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function AreaCard({ a, result, now }: { a: AreaReading; result: ChartResult; now: DateTime }) {
  const spec = JAIMINI_AREAS[a.area];
  const cur = currentFor(a.timing, result.now.asOf);
  const firstCycle = a.timing.periods.filter((p) => p.cycle === 1);
  const [sel, setSel] = useState<string | null>(cur.period ? `${cur.period.cycle}-${cur.period.sign}` : firstCycle[0] ? `1-${firstCycle[0].sign}` : null);
  const [open, setOpen] = useState(false);
  const period = a.timing.periods.find((p) => `${p.cycle}-${p.sign}` === sel);
  const findings = a.findingIds.map((id) => result.jaimini.findings.find((f) => f.id === id)!).filter(Boolean);
  const notes = [...a.karakas.flatMap((k) => k.notes), ...a.padas.flatMap((p) => p.notes)];
  const shownNotes = open ? notes : notes.slice(0, 4);

  return (
    <Card data-testid={`jarea-${a.area}`}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold">{a.label}</h3>
            <BalanceBadge balance={a.balance} />
          </div>
          {cur.period && (
            <span className="text-xs text-muted-foreground" data-testid={`jarea-now-${a.area}`}>
              now {SIGNS[cur.period.sign]}
              {cur.window ? ` / ${SIGNS[cur.window.adSign]}` : ""} · {isHot(cur.period.triggers) || cur.window ? "active" : "quiet"}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{spec.blurb}</p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foundations</h4>
            <ul className="mt-2 space-y-1 text-xs">
              {a.karakas.map((k) => (
                <li key={k.karaka} className="flex flex-wrap gap-x-1.5" data-testid={`jarea-karaka-${a.area}-${k.karaka}`}>
                  <span className="font-semibold text-primary">{k.karaka}</span>
                  <span className="font-medium">{k.planet}</span>
                  <span className="text-muted-foreground">
                    in {SIGNS[k.sign]} ({k.dignity.toLowerCase()}), {ordinal(k.houseFromLagna)} house · D9 {SIGNS[k.d9Sign]}
                    {k.d9Dignity !== "—" ? ` (${k.d9Dignity.toLowerCase()})` : ""}
                  </span>
                </li>
              ))}
              {a.padas.map((p) => (
                <li key={p.label} className="flex flex-wrap gap-x-1.5" data-testid={`jarea-pada-${a.area}-${p.label}`}>
                  <span className="font-semibold text-[hsl(var(--chart-3))]">{p.label}</span>
                  <span className="font-medium">{SIGNS[p.sign]}</span>
                  <span className="text-muted-foreground">
                    {p.occupants.length ? `holds ${p.occupants.join(", ")}` : "empty"}
                    {p.aspectedBy.length ? ` · aspected by ${p.aspectedBy.join(", ")}` : ""}
                  </span>
                </li>
              ))}
              {a.karakamsa.map((x) => (
                <li key={x.house} className="flex flex-wrap gap-x-1.5">
                  <span className="font-semibold text-muted-foreground">D9</span>
                  <span className="text-muted-foreground">
                    {ordinal(x.house)} from the Karakamsa: {x.planets.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1.5 text-sm">
              {shownNotes.map((n, i) => (
                <li key={i} className="flex gap-2 leading-snug">
                  <ToneDot tone={n.tone} />
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
            {notes.length > 4 && (
              <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={() => setOpen((v) => !v)} data-testid={`button-jarea-more-${a.area}`}>
                {open ? "Fewer notes" : `${notes.length - 4} more`}
              </Button>
            )}
            {findings.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From the sutras</h4>
                <ul className="mt-1.5 space-y-1.5 text-sm">
                  {findings.map((f) => (
                    <li key={f.id} className="leading-snug" data-testid={`jarea-finding-${f.id}`}>
                      {f.text}{" "}
                      <span className="text-xs text-muted-foreground">
                        <SourceLink source={f.source} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timing · Chara dasha</h4>
            <p className="mt-1 text-xs text-muted-foreground">First cycle, age 0 to {firstCycle.reduce((s, p) => s + p.years, 0)}. Darker periods carry the area more strongly; the bar under a segment marks the running period. Click a period.</p>
            <div className="mt-2">
              <HeatStrip periods={firstCycle} selected={sel} onSelect={setSel} now={now} />
            </div>
            {period && (
              <div className="mt-3 rounded-md border bg-muted/30 p-3 text-xs" data-testid={`jarea-period-${a.area}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {SIGNS[period.sign]} mahadasha <span className="text-muted-foreground">· age {period.ageStart}–{period.ageStart + period.years}</span>
                  </span>
                  <span className="tabular text-muted-foreground">
                    {fmt(period.start)} – {fmt(period.end)}
                  </span>
                </div>
                {period.triggers.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">Nothing in this period points at {spec.short}; read it from the antardashas below or the other areas.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {period.triggers.map((t, i) => (
                      <li key={i} className="flex gap-2 leading-snug">
                        <ToneDot tone={t.tone} />
                        <span>{t.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <TransitCheck
                  c={confirmTransits([...a.anchors, { label: `${SIGNS[period.sign]} (dasha sign)`, sign: period.sign }], result.transits, period.start, period.end)}
                  compact
                  testId={`jarea-transit-${a.area}-${period.sign}`}
                />
                {period.windows.length > 0 && (
                  <div className="mt-3">
                    <div className="font-semibold text-muted-foreground">Antardashas that carry {spec.short}</div>
                    <ul className="mt-1 divide-y">
                      {period.windows.map((w) => {
                        const curW = now >= DateTime.fromISO(w.start) && now < DateTime.fromISO(w.end);
                        return (
                          <li key={w.adSign} className={cn("py-1.5", curW && "font-medium")} data-testid={`jarea-window-${a.area}-${w.mdSign}-${w.adSign}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span>
                                {SIGNS[w.adSign]}
                                {curW && (
                                  <Badge variant="secondary" className="no-default-hover-elevate ml-1.5 text-[9px]">
                                    now
                                  </Badge>
                                )}
                              </span>
                              <span className="tabular text-muted-foreground">
                                {fmt(w.start)} – {fmt(w.end)}
                              </span>
                            </div>
                            <ul className="mt-0.5 space-y-0.5 font-normal text-muted-foreground">
                              {w.triggers.map((t, i) => (
                                <li key={i} className="flex gap-2 leading-snug">
                                  <ToneDot tone={t.tone} />
                                  <span>{t.text}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="font-normal">
                              <TransitCheck
                                c={confirmTransits([...a.anchors, { label: `${SIGNS[w.adSign]} (antardasha sign)`, sign: w.adSign }, { label: `${SIGNS[w.mdSign]} (dasha sign)`, sign: w.mdSign }].filter((t, i, arr) => arr.findIndex((x) => x.sign === t.sign) === i), result.transits, w.start, w.end)}
                                compact
                                testId={`jarea-transit-${a.area}-${w.mdSign}-${w.adSign}`}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JaiminiAreas({ result }: { result: ChartResult }) {
  const areas = useMemo(() => readAreas(result.jaimini, result.positions), [result]);
  const now = DateTime.fromISO(result.now.asOf);
  const [filter, setFilter] = useState<JaiminiArea | "all">("all");
  const shown = filter === "all" ? areas : areas.filter((a) => a.area === filter);
  return (
    <section className="mt-10" data-testid="section-jaimini-areas">
      <h2 className="text-base font-semibold">Life areas</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each area rests on a chara karaka, its arudha pada and a house from the Karakamsa. Timing follows K.N. Rao: the running Chara dasha sign is treated as the lagna and the houses from it are read for the area, then each antardasha
        the same way. A period is marked when the area's karaka or pada is involved, or several weaker links add up. Rao asks that Chara dasha results be confirmed against Vimshottari and the navamsa; the dasha reading here is Jaimini alone, and the transit check under each period follows Rao's confirming step: Jupiter and Saturn on or aspecting the area's anchors, ideally both at once (double transit).{" "}
        <a href={RAO_SOURCE.url} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
          {RAO_SOURCE.label}
        </a>
        {" · "}
        <a href={RAO_NOTES_SOURCE.url} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
          {RAO_NOTES_SOURCE.label}
        </a>
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setFilter("all")} data-testid="filter-jarea-all">
          All areas
        </Button>
        {areas.map((a) => (
          <Button key={a.area} size="sm" variant={filter === a.area ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setFilter(a.area)} data-testid={`filter-jarea-${a.area}`}>
            {a.label}
          </Button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {shown.map((a) => (
          <AreaCard key={a.area} a={a} result={result} now={now} />
        ))}
      </div>
    </section>
  );
}
