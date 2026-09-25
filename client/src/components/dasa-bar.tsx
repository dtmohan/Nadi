import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface DasaSegment {
  /** Start and end on a shared numeric axis (age in years, usually). */
  start: number;
  end: number;
  color: string;
  /** Short label drawn inside the segment when there is room. */
  label: string;
  /** Shorter fallback label when the full one does not fit. */
  short?: string;
  title?: string;
  current?: boolean;
  testId?: string;
}

/**
 * A proportional strip of periods: each segment's width is its share of the whole, coloured by
 * the planet or element that rules it, with a marker for "now". Reads the sequence at a glance;
 * the table underneath carries the detail.
 */
export function DasaBar({ segments, nowAt, ticks, className, testId }: { segments: DasaSegment[]; nowAt?: number; ticks?: number[]; className?: string; testId?: string }) {
  if (!segments.length) return null;
  const min = Math.min(...segments.map((s) => s.start));
  const max = Math.max(...segments.map((s) => s.end));
  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const fits = (w: number, label: string) => width > 0 && (w / 100) * width >= label.length * 6.5 + 6;
  return (
    <div ref={ref} className={cn("relative", className)} data-testid={testId}>
      <div className="flex h-6 w-full overflow-hidden rounded-sm ring-1 ring-inset ring-foreground/15">
        {segments.map((s, i) => {
          const w = pct(s.end) - pct(s.start);
          return (
            <div
              key={i}
              className={cn("relative flex items-center justify-center overflow-hidden text-2xs font-semibold leading-none text-white/95 dark:text-black/80", i > 0 && "border-l border-background/70")}
              style={{ width: `${w}%`, backgroundColor: s.color, opacity: s.current || nowAt === undefined ? 1 : s.end <= nowAt ? 0.55 : 0.85 }}
              title={s.title ?? s.label}
              data-testid={s.testId}
            >
              {(fits(w, s.label) || (s.short && fits(w, s.short))) && <span className="whitespace-nowrap px-0.5 drop-shadow-[0_0_1px_rgba(0,0,0,0.6)] dark:drop-shadow-none">{fits(w, s.label) ? s.label : s.short}</span>}
            </div>
          );
        })}
      </div>
      {nowAt !== undefined && nowAt >= min && nowAt <= max && (
        <div className="pointer-events-none absolute -top-1 bottom-0 w-0" style={{ left: `${pct(nowAt)}%` }} aria-hidden>
          <div className="h-[calc(100%+4px)] w-0 border-l-2 border-foreground" />
          <div className="absolute -left-[5px] -top-1 h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-foreground" />
        </div>
      )}
      {ticks && ticks.length > 0 && (
        <div className="relative mt-0.5 h-4 text-2xs tabular text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${pct(t)}%` }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
