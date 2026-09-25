import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VerdictTone } from "@/components/verdict-card";

/** One period on a band: a dasa, a sign passage, a bhukti. Dates are ISO instants. */
export interface TlSegment {
  start: string;
  end: string;
  label: string;
  short?: string;
  color: string;
  title?: string;
  current?: boolean;
}

/** A horizontal band of consecutive periods. */
export interface TlBand {
  id: string;
  label: string;
  segments: TlSegment[];
  /** Half height, for sub-periods under a main band. */
  thin?: boolean;
}

/** A dated life event, drawn as a dot above the bands. */
export interface TlMark {
  id: string;
  date: string;
  label: string;
  tone: VerdictTone;
  title?: string;
}

/** A stretch of time a method singles out (a promised window, a hot antardasha, a Jupiter passage over the Jeeva). */
export interface TlWindow {
  start: string;
  end: string;
  label: string;
  tone: VerdictTone;
  /** 0..1; drives opacity so a strong window reads darker than a faint one. */
  strength?: number;
  /** Optional lane (0-based) so windows of different kinds stack as thin stripes instead of overlapping. */
  lane?: number;
}

export type TlRange = "life" | "decade" | "near";

const GUTTER = 64;
const MARK_ROW = 20;
const WINDOW_ROW = 12;
const LANE_H = 5;
const BAND_H = 22;
const THIN_H = 12;
const GAP = 3;
const AXIS_H = 20;
const YEAR_MS = 365.25 * 86400e3;

const toneFill: Record<VerdictTone, string> = {
  good: "hsl(var(--verdict-good))",
  mixed: "hsl(var(--verdict-mixed))",
  bad: "hsl(var(--verdict-bad))",
  neutral: "hsl(var(--muted-foreground))",
};

const ms = (iso: string) => DateTime.fromISO(iso).toMillis();
const fmtDay = (t: number) => DateTime.fromMillis(t).toFormat("d LLL yyyy");
const fmtMonth = (t: number) => DateTime.fromMillis(t).toFormat("LLL yyyy");

/** Tick spacing in years that gives roughly 60-120 px between ticks. */
function tickStep(spanYears: number, px: number) {
  const target = px / 90;
  const steps = [1 / 12, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50];
  for (const s of steps) if (spanYears / s <= target) return s;
  return 50;
}

/**
 * One horizontal axis for the whole life: the period systems stacked as bands, the recorded events as
 * dots above them, the stretches a method singles out as a tinted row, and a marker for today.
 * Hover or touch a date to read what every band says there; drag to zoom, tap a period to zoom to it.
 */
export function LifeTimeline({
  birthIso,
  asOfIso,
  bands,
  marks = [],
  windows = [],
  windowsLabel = "Windows",
  marksLabel = "Events",
  defaultRange = "life",
  horizonYears = 100,
  testid,
  className,
}: {
  birthIso: string;
  asOfIso: string;
  bands: TlBand[];
  marks?: TlMark[];
  windows?: TlWindow[];
  windowsLabel?: string;
  marksLabel?: string;
  defaultRange?: TlRange;
  horizonYears?: number;
  testid: string;
  className?: string;
}) {
  const birth = useMemo(() => ms(birthIso), [birthIso]);
  const now = useMemo(() => ms(asOfIso), [asOfIso]);
  const lifeEnd = useMemo(() => {
    let end = birth + horizonYears * YEAR_MS;
    for (const b of bands) for (const s of b.segments) end = Math.max(end, ms(s.end));
    return Math.min(end, birth + 120 * YEAR_MS);
  }, [bands, birth, horizonYears]);

  const preset = useCallback(
    (r: TlRange): [number, number] => {
      if (r === "decade") return [Math.max(birth, now - 10 * YEAR_MS), Math.min(lifeEnd, now + 10 * YEAR_MS)];
      if (r === "near") return [Math.max(birth, now - 2.5 * YEAR_MS), Math.min(lifeEnd, now + 2.5 * YEAR_MS)];
      return [birth, lifeEnd];
    },
    [birth, now, lifeEnd],
  );

  // A whole life at phone width is a barcode, so narrow screens open on the ten-year view unless the caller chose otherwise.
  const initialRange: TlRange = defaultRange === "life" && typeof window !== "undefined" && window.innerWidth < 640 ? "decade" : defaultRange;
  const [range, setRange] = useState<[number, number]>(() => preset(initialRange));
  const [rangeKey, setRangeKey] = useState<TlRange | "custom">(initialRange);
  useEffect(() => {
    if (rangeKey !== "custom") setRange(preset(rangeKey));
  }, [preset, rangeKey]);
  const pick = (r: TlRange) => {
    setRangeKey(r);
    setRange(preset(r));
  };
  const zoomTo = (a: number, b: number) => {
    const pad = (b - a) * 0.04;
    setRangeKey("custom");
    setRange([Math.max(birth, a - pad), Math.min(lifeEnd, b + pad)]);
  };

  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - GUTTER);
  const [t0, t1] = range;
  const span = t1 - t0 || 1;
  const x = (t: number) => GUTTER + ((t - t0) / span) * plotW;
  const tAt = (px: number) => t0 + ((px - GUTTER) / plotW) * span;

  const hasMarks = marks.length > 0;
  const hasWindows = windows.length > 0;
  const lanes = useMemo(() => windows.reduce((n, w) => Math.max(n, (w.lane ?? 0) + 1), 1), [windows]);
  const windowRowH = lanes > 1 ? lanes * (LANE_H + 1) - 1 : WINDOW_ROW;
  const rows = useMemo(() => {
    let y = 4;
    const markY = hasMarks ? y + MARK_ROW / 2 : 0;
    if (hasMarks) y += MARK_ROW + GAP;
    const windowY = hasWindows ? y : 0;
    if (hasWindows) y += windowRowH + GAP;
    const bandY = bands.map((b) => {
      const top = y;
      y += (b.thin ? THIN_H : BAND_H) + GAP;
      return top;
    });
    const axisY = y + 2;
    return { markY, windowY, bandY, axisY, height: axisY + AXIS_H };
  }, [bands, hasMarks, hasWindows, windowRowH]);

  // Hover and drag.
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [hoverMark, setHoverMark] = useState<string | null>(null);
  const drag = useRef<{ from: number; to: number; moved: boolean } | null>(null);
  const [sel, setSel] = useState<[number, number] | null>(null);

  const pxOf = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.min(Math.max(e.clientX - rect.left, GUTTER), width);
  };
  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const px = pxOf(e);
    drag.current = { from: px, to: px, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const px = pxOf(e);
    setHoverT(tAt(px));
    if (drag.current) {
      drag.current.to = px;
      if (Math.abs(px - drag.current.from) > 4) {
        drag.current.moved = true;
        setSel([Math.min(drag.current.from, px), Math.max(drag.current.from, px)]);
      }
    }
  };
  const onUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    setSel(null);
    if (d && d.moved) {
      const a = tAt(Math.min(d.from, d.to));
      const b = tAt(Math.max(d.from, d.to));
      if (b - a > 20 * 86400e3) zoomTo(a, b);
      e.stopPropagation();
    }
  };
  const onLeave = () => {
    setHoverT(null);
    setHoverMark(null);
  };

  // Readout: what every band says at the hovered date (today when nothing is hovered).
  const readT = hoverT ?? now;
  const readout = useMemo(() => {
    const age = (readT - birth) / YEAR_MS;
    const lines = bands.map((b) => {
      const seg = b.segments.find((s) => readT >= ms(s.start) && readT < ms(s.end));
      return { band: b, seg };
    });
    const marksHere = hasMarks && hoverT !== null ? marks.filter((m) => Math.abs(ms(m.date) - readT) <= span * 0.006) : [];
    const windowsHere = windows.filter((w) => readT >= ms(w.start) && readT < ms(w.end));
    return { age, lines, marksHere, windowsHere };
  }, [bands, birth, hasMarks, hoverT, marks, readT, span, windows]);

  // Axis ticks.
  const ticks = useMemo(() => {
    if (plotW <= 0) return [] as { t: number; label: string; age: string }[];
    const spanY = span / YEAR_MS;
    const step = tickStep(spanY, plotW);
    const out: { t: number; label: string; age: string }[] = [];
    if (step >= 1) {
      const first = DateTime.fromMillis(t0).startOf("year");
      const y0 = Math.ceil(first.year / step) * step;
      for (let y = y0; ; y += step) {
        const t = DateTime.fromObject({ year: y }).toMillis();
        if (t > t1) break;
        if (t >= t0) out.push({ t, label: String(y), age: `${Math.round((t - birth) / YEAR_MS)}` });
      }
    } else {
      const months = Math.round(step * 12);
      let d = DateTime.fromMillis(t0).startOf("month");
      while (d.month % months !== 1 && months > 1) d = d.plus({ months: 1 });
      for (; d.toMillis() <= t1; d = d.plus({ months })) {
        const t = d.toMillis();
        if (t >= t0) out.push({ t, label: d.toFormat(months >= 12 ? "yyyy" : "LLL yy"), age: ((t - birth) / YEAR_MS).toFixed(1) });
      }
    }
    return out;
  }, [birth, plotW, span, t0, t1]);

  const fits = (w: number, label: string) => w >= label.length * 6 + 8;
  const visible = (s: number, e: number) => e > t0 && s < t1;
  const clipId = `${testid}-clip`;
  const zoomed = rangeKey === "custom";
  // Label a mark only when the next mark to its right leaves room for the text.
  const markLabelOk = useMemo(() => {
    const ok = new Set<string>();
    const vis = marks.map((m) => ({ id: m.id, t: ms(m.date) })).filter((m) => m.t >= t0 && m.t <= t1).sort((a, b) => a.t - b.t);
    for (let i = 0; i < vis.length; i++) {
      const gap = i + 1 < vis.length ? x(vis[i + 1].t) - x(vis[i].t) : width - x(vis[i].t);
      if (gap >= 72) ok.add(vis[i].id);
    }
    return ok;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, t0, t1, plotW, width]);

  return (
    <div className={cn("select-none", className)} data-testid={testid}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Timeline range">
          {(
            [
              ["life", "Whole life"],
              ["decade", "Ten years either side"],
              ["near", "Now ±2½ years"],
            ] as [TlRange, string][]
          ).map(([k, label]) => (
            <Button key={k} type="button" size="sm" variant={rangeKey === k ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => pick(k)} data-testid={`${testid}-range-${k}`}>
              {label}
            </Button>
          ))}
          {zoomed && (
            <span className="ml-1 text-xs text-muted-foreground" data-testid={`${testid}-range-custom`}>
              {fmtMonth(t0)} to {fmtMonth(t1)}
            </span>
          )}
        </div>
        <p className="text-2xs text-muted-foreground">Drag to zoom, tap a period to zoom to it, hover to read a date.</p>
      </div>

      <div ref={hostRef} className="mt-2 w-full">
        {width > 0 && (
          <svg
            width={width}
            height={rows.height}
            viewBox={`0 0 ${width} ${rows.height}`}
            className="block touch-none"
            style={{ cursor: sel ? "col-resize" : "crosshair" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onLeave}
            role="img"
            aria-label={`Timeline of ${bands.map((b) => b.label).join(", ")}${hasMarks ? ` with ${marks.length} events` : ""}`}
            data-testid={`${testid}-svg`}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={GUTTER} y={0} width={plotW} height={rows.height} />
              </clipPath>
            </defs>

            {/* Row labels */}
            {hasMarks && (
              <text x={GUTTER - 8} y={rows.markY + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontWeight={600} letterSpacing={0.6} style={{ textTransform: "uppercase" }}>
                {marksLabel.toUpperCase()}
              </text>
            )}
            {hasWindows && (
              <text x={GUTTER - 8} y={rows.windowY + windowRowH / 2 + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontWeight={600} letterSpacing={0.6}>
                {windowsLabel.toUpperCase()}
              </text>
            )}
            {bands.map((b, i) => (
              <text key={b.id} x={GUTTER - 8} y={rows.bandY[i] + (b.thin ? THIN_H : BAND_H) / 2 + 3} textAnchor="end" className="fill-muted-foreground" fontSize={9} fontWeight={600} letterSpacing={0.6}>
                {b.label.toUpperCase()}
              </text>
            ))}

            <g clipPath={`url(#${clipId})`}>
              {/* Past shading */}
              {now > t0 && <rect x={GUTTER} y={0} width={Math.max(0, x(Math.min(now, t1)) - GUTTER)} height={rows.axisY} className="fill-foreground/[0.035]" />}

              {/* Windows row */}
              {hasWindows &&
                windows.map((w, i) => {
                  const s = ms(w.start);
                  const e = ms(w.end);
                  if (!visible(s, e)) return null;
                  const x0 = x(Math.max(s, t0));
                  const x1 = x(Math.min(e, t1));
                  const ly = lanes > 1 ? rows.windowY + (w.lane ?? 0) * (LANE_H + 1) : rows.windowY;
                  const lh = lanes > 1 ? LANE_H : WINDOW_ROW;
                  return (
                    <rect key={i} x={x0} y={ly} width={Math.max(1.5, x1 - x0)} height={lh} rx={lanes > 1 ? 1 : 2} fill={toneFill[w.tone]} opacity={0.35 + 0.55 * (w.strength ?? 0.7)} data-testid={`${testid}-window`}>
                      <title>
                        {w.label} · {fmtDay(s)} to {fmtDay(e)}
                      </title>
                    </rect>
                  );
                })}

              {/* Bands */}
              {bands.map((b, i) => {
                const h = b.thin ? THIN_H : BAND_H;
                const top = rows.bandY[i];
                return (
                  <g key={b.id} data-testid={`${testid}-band-${b.id}`}>
                    {b.segments.map((s, j) => {
                      const a = ms(s.start);
                      const e = ms(s.end);
                      if (!visible(a, e)) return null;
                      const x0 = x(Math.max(a, t0));
                      const x1 = x(Math.min(e, t1));
                      const w = x1 - x0;
                      const label = fits(w, s.label) ? s.label : s.short && fits(w, s.short) ? s.short : null;
                      const past = e <= now;
                      return (
                        <g key={j} onClick={() => zoomTo(a, e)} style={{ cursor: "zoom-in" }}>
                          <rect x={x0} y={top} width={Math.max(0.5, w)} height={h} fill={s.color} opacity={s.current ? 1 : past ? 0.55 : 0.85} stroke="hsl(var(--background))" strokeWidth={j > 0 && w >= 4 ? 1 : 0}>
                            <title>{s.title ?? `${s.label} · ${fmtDay(a)} to ${fmtDay(e)}`}</title>
                          </rect>
                          {s.current && <rect x={x0 + 0.75} y={top + 0.75} width={Math.max(0, w - 1.5)} height={h - 1.5} fill="none" className="stroke-foreground" strokeWidth={1.5} />}
                          {label && !b.thin && (
                            <text x={(x0 + x1) / 2} y={top + h / 2 + 3.5} textAnchor="middle" fontSize={10} fontWeight={600} className="pointer-events-none fill-white dark:fill-black/80" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 0.6 }}>
                              {label}
                            </text>
                          )}
                          {label && b.thin && w >= 26 && (
                            <text x={(x0 + x1) / 2} y={top + h / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={600} className="pointer-events-none fill-white dark:fill-black/80">
                              {label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Marks */}
              {hasMarks &&
                marks.map((m) => {
                  const t = ms(m.date);
                  if (t < t0 || t > t1) return null;
                  const cx = x(t);
                  const lit = hoverMark === m.id;
                  return (
                    <g key={m.id} onPointerEnter={() => setHoverMark(m.id)} onPointerLeave={() => setHoverMark(null)} data-testid={`${testid}-mark`}>
                      <line x1={cx} x2={cx} y1={rows.markY} y2={rows.axisY} stroke={toneFill[m.tone]} strokeWidth={1} strokeDasharray="2 3" opacity={lit ? 0.9 : 0.45} />
                      <circle cx={cx} cy={rows.markY} r={lit ? 5.5 : 4.5} fill={toneFill[m.tone]} stroke="hsl(var(--background))" strokeWidth={1.5}>
                        <title>{m.title ?? `${m.label} · ${fmtDay(t)}`}</title>
                      </circle>
                      {markLabelOk.has(m.id) && (
                        <text x={cx + 7} y={rows.markY + 3.5} fontSize={9.5} className="pointer-events-none fill-foreground/80" style={{ paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 3 }}>
                          {m.label}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Selection while dragging */}
              {sel && <rect x={sel[0]} y={0} width={sel[1] - sel[0]} height={rows.axisY} className="fill-primary/15 stroke-primary" strokeWidth={1} />}

              {/* Now marker */}
              {now >= t0 && now <= t1 && (
                <g data-testid={`${testid}-now`}>
                  <line x1={x(now)} x2={x(now)} y1={0} y2={rows.axisY} className="stroke-foreground" strokeWidth={1.5} />
                  <polygon points={`${x(now) - 5},0 ${x(now) + 5},0 ${x(now)},6`} className="fill-foreground" />
                </g>
              )}

              {/* Hover hairline */}
              {hoverT !== null && hoverT >= t0 && hoverT <= t1 && <line x1={x(hoverT)} x2={x(hoverT)} y1={0} y2={rows.axisY} className="stroke-primary" strokeWidth={1} strokeDasharray="3 2" />}
            </g>

            {/* Axis */}
            <line x1={GUTTER} x2={width} y1={rows.axisY} y2={rows.axisY} className="stroke-border" />
            {ticks.map((tk) => (
              <g key={tk.t}>
                <line x1={x(tk.t)} x2={x(tk.t)} y1={rows.axisY} y2={rows.axisY + 4} className="stroke-border" />
                <text x={x(tk.t)} y={rows.axisY + 14} textAnchor="middle" fontSize={9.5} className="fill-muted-foreground tabular">
                  {tk.label}
                  <tspan className="fill-muted-foreground/60"> · {tk.age}</tspan>
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Readout */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs" data-testid={`${testid}-readout`} aria-live="polite">
        <span className="tabular font-medium">
          {hoverT === null ? "Today" : fmtDay(readT)}
          <span className="text-muted-foreground"> · age {Math.floor(readout.age)}</span>
        </span>
        {readout.lines.map(({ band, seg }) => (
          <span key={band.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {seg ? <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} /> : null}
            <span className="text-muted-foreground">{band.label}</span> {seg ? seg.label : "—"}
          </span>
        ))}
        {readout.windowsHere.slice(0, 4).map((w, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: toneFill[w.tone] }} />
            {w.label}
          </span>
        ))}
        {(hoverMark ? marks.filter((m) => m.id === hoverMark) : readout.marksHere).slice(0, 2).map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: toneFill[m.tone] }} />
            {m.label} <span className="tabular font-normal text-muted-foreground">{DateTime.fromISO(m.date).toFormat("d LLL yyyy")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Helpers every panel uses to turn its own periods into timeline data. */
export function markTone(outcome: "favourable" | "unfavourable" | "mixed" | undefined): VerdictTone {
  return outcome === "favourable" ? "good" : outcome === "unfavourable" ? "bad" : outcome === "mixed" ? "mixed" : "neutral";
}
