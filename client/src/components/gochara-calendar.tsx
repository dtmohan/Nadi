import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import type { Planet } from "@shared/astro";
import { SIGNS } from "@shared/astro";
import type { GocharaVerdict } from "@shared/gochara";
import {
  CALENDAR_PLANETS,
  type GocharaCalendar as Calendar,
  type GocharaSegment,
} from "@shared/gochara-calendar";
import { apiRequest } from "@/lib/queryClient";
import { PlanetName, SignName } from "@/components/planet-name";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ORD = (h: number) =>
  `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`;
const fmtD = (iso: string, zone: string) =>
  DateTime.fromISO(iso).setZone(zone).toFormat("d LLL yyyy");

const BAR: Record<GocharaVerdict, string> = {
  favourable: "bg-verdict-good/70",
  obstructed: "bg-verdict-mixed/70",
  unfavourable: "bg-verdict-bad/60",
  neutral: "bg-muted-foreground/30",
};
const PILL: Record<GocharaVerdict, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  obstructed: "bg-verdict-mixed/15 text-verdict-mixed",
  neutral: "bg-muted text-muted-foreground",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};

/** Slow movers open by default; the fast ones would swamp the list. */
const OPEN_BY_DEFAULT = new Set<Planet>(["Jupiter", "Saturn", "Rahu", "Ketu"]);
const HORIZONS = [1, 2, 5, 10];

function segmentTitle(s: GocharaSegment, zone: string): string {
  const parts = [
    `${fmtD(s.start, zone)} – ${fmtD(s.end, zone)}`,
    `${SIGNS[s.signIndex]}, ${ORD(s.house)} from the Moon`,
    s.verdict,
  ];
  if (s.vedhaBy.length) parts.push(`vedha by ${s.vedhaBy.join(", ")}`);
  if (s.combust && !s.note) parts.push("combust for part of the stretch");
  if (s.note) parts.push(s.note);
  if (s.danger)
    parts.push(
      s.danger === "33" ? "danger house (26.33)" : "worst house (26.34)",
    );
  return parts.join(" · ");
}

function Timeline({ cal, zone }: { cal: Calendar; zone: string }) {
  const t0 = DateTime.fromISO(cal.from).toMillis();
  const t1 = DateTime.fromISO(cal.to).toMillis();
  const span = t1 - t0;
  const x = (iso: string) =>
    Math.min(
      100,
      Math.max(0, ((DateTime.fromISO(iso).toMillis() - t0) / span) * 100),
    );
  const years: Array<{ label: string; x: number }> = [];
  let y = DateTime.fromMillis(t0)
    .setZone(zone)
    .startOf("year")
    .plus({ years: 1 });
  while (y.toMillis() < t1) {
    years.push({
      label: String(y.year),
      x: ((y.toMillis() - t0) / span) * 100,
    });
    y = y.plus({ years: 1 });
  }
  const now = DateTime.now().toMillis();
  const nowX = now > t0 && now < t1 ? ((now - t0) / span) * 100 : null;

  return (
    <div
      className="rounded-md border bg-card p-3"
      data-testid="gochara-calendar-timeline"
    >
      <div className="grid grid-cols-[4.5rem_1fr] gap-x-3">
        <div />
        <div className="relative h-4 text-2xs text-muted-foreground">
          {years.map((yr) => (
            <span
              key={yr.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${yr.x}%` }}
            >
              {yr.label}
            </span>
          ))}
        </div>
        {cal.planets.map((p) => (
          <Fragment key={p.planet}>
            <div className="flex h-6 items-center text-xs font-medium">
              <PlanetName planet={p.planet} />
            </div>
            <div
              className="relative h-6 overflow-hidden rounded-sm bg-muted/40"
              data-testid={`gochara-calendar-bar-${p.planet}`}
            >
              {years.map((yr) => (
                <span
                  key={yr.label}
                  className="absolute inset-y-0 w-px bg-border"
                  style={{ left: `${yr.x}%` }}
                />
              ))}
              {p.segments.map((s, i) => {
                const left = x(s.start);
                const width = Math.max(0.15, x(s.end) - left);
                return (
                  <span
                    key={i}
                    className={cn(
                      "absolute inset-y-1 rounded-[1px]",
                      BAR[s.verdict],
                      s.danger && "ring-1 ring-inset ring-verdict-bad/60",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={segmentTitle(s, zone)}
                  />
                );
              })}
              {nowX !== null && (
                <span
                  className="absolute inset-y-0 w-px bg-foreground/70"
                  style={{ left: `${nowX}%` }}
                />
              )}
            </div>
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-2xs text-muted-foreground">
        {(Object.keys(BAR) as GocharaVerdict[]).map((v) => (
          <span key={v} className="flex items-center gap-1">
            <span
              className={cn("inline-block h-2.5 w-4 rounded-[1px]", BAR[v])}
            />{" "}
            {v}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-[1px] ring-1 ring-inset ring-verdict-bad/60" />{" "}
          danger house (26.33-34)
        </span>
        {nowX !== null && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-px bg-foreground/70" /> today
          </span>
        )}
      </div>
    </div>
  );
}

function SegmentList({
  planet,
  segments,
  zone,
}: {
  planet: Planet;
  segments: GocharaSegment[];
  zone: string;
}) {
  const [open, setOpen] = useState(OPEN_BY_DEFAULT.has(planet));
  return (
    <div
      className="rounded-md border bg-card text-xs"
      data-testid={`gochara-calendar-list-${planet}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`gochara-calendar-toggle-${planet}`}
      >
        <span className="font-medium">
          <PlanetName planet={planet} />
          <span className="ml-2 font-normal text-muted-foreground">
            {segments.length} stretches
          </span>
        </span>
        <span className="text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="overflow-x-auto border-t">
          <table className="w-full text-xs tabular">
            <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 text-left font-normal">From</th>
                <th className="px-3 py-1.5 text-left font-normal">To</th>
                <th className="px-3 py-1.5 text-left font-normal">Verdict</th>
                <th className="px-3 py-1.5 text-left font-normal">Sign</th>
                <th className="px-3 py-1.5 text-left font-normal">House</th>
                <th className="hidden px-3 py-1.5 text-left font-normal sm:table-cell">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => {
                const why = [
                  s.vedhaBy.length ? `vedha by ${s.vedhaBy.join(", ")}` : "",
                  s.note
                    ? s.note
                        .replace(/ \((26\.3[12]|26\.32; BS 104\.53)\)\.?/g, "")
                        .replace(/\.\s*$/, "")
                    : s.combust
                      ? "combust for part of the stretch"
                      : "",
                  s.danger
                    ? s.danger === "33"
                      ? "danger house, 26.33"
                      : "worst house, 26.34"
                    : "",
                ].filter(Boolean);
                return (
                  <tr
                    key={i}
                    className="border-t"
                    data-testid={`gochara-calendar-row-${planet}-${i}`}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {fmtD(s.start, zone)}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {fmtD(s.end, zone)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-medium",
                          PILL[s.verdict],
                        )}
                      >
                        {s.verdict}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <SignName signIndex={s.signIndex} />
                    </td>
                    <td className="px-3 py-1.5">{ORD(s.house)}</td>
                    <td className="hidden px-3 py-1.5 text-muted-foreground sm:table-cell">
                      {why.join(" · ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function GocharaCalendarSection({
  result,
  zone,
}: {
  result: ChartResult;
  zone: string;
}) {
  const chart = result.chart;
  const natalMoon = result.positions.find((p) => p.planet === "Moon")!;
  const [from, setFrom] = useState(() =>
    DateTime.now().setZone(zone).toISODate()!,
  );
  const [years, setYears] = useState(5);
  const validFrom =
    /^\d{4}-\d{2}-\d{2}$/.test(from) && DateTime.fromISO(from).isValid;

  const query = useQuery<Calendar>({
    queryKey: [
      "gochara-calendar",
      natalMoon.signIndex,
      from,
      years,
      chart.ayanamsa,
      chart.nodeType,
    ],
    enabled: validFrom,
    queryFn: async () =>
      (await (
        await apiRequest("POST", "/api/gochara-calendar", {
          moonSignIndex: natalMoon.signIndex,
          from,
          years,
          ayanamsa: chart.ayanamsa,
          nodeType: chart.nodeType === "true" ? "true" : "mean",
        })
      ).json()) as Calendar,
    staleTime: 30 * 60_000,
  });
  const cal = query.data;

  const upcoming = useMemo(() => {
    if (!cal) return [];
    const now = DateTime.now().toMillis();
    const items: Array<{ at: string; planet: Planet; s: GocharaSegment }> = [];
    for (const p of cal.planets)
      for (const s of p.segments)
        if (DateTime.fromISO(s.start).toMillis() > now)
          items.push({ at: s.start, planet: p.planet, s });
    return items.sort((a, b) => a.at.localeCompare(b.at)).slice(0, 12);
  }, [cal]);

  return (
    <section data-testid="gochara-calendar">
      <SectionTitle plain="Transit calendar" technical="Gochara calendar">
        <span className="text-xs font-normal text-muted-foreground">
          Moon in {SIGNS[natalMoon.signIndex]} · dates in {zone}
        </span>
      </SectionTitle>
      <ModeText
        plain={
          <>
            The same transit verdicts laid out over the coming years: when each
            planet enters a good or bad house from the birth Moon, when another
            planet spoils a good stretch, and when Saturn crosses the sign
            before, of and after the Moon.
          </>
        }
        practitioner={
          <>
            Verdicts follow the day view (BS 104.4, PD 26.2-8, 26.31-34) sampled
            daily and narrowed to the hour. The Moon is omitted as row and as
            obstructor; its vedha is a matter of days and is shown on the day
            view. Saturn's 12th-1st-2nd passage is listed from BS 104.44-45 and
            PD 26.23.
          </>
        }
      />
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">
          From
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 h-8 w-44 text-xs tabular"
            data-testid="gochara-calendar-from"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Span
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 block h-8 rounded-md border bg-background px-2 text-xs"
            data-testid="gochara-calendar-years"
          >
            {HORIZONS.map((h) => (
              <option key={h} value={h}>
                {h} {h === 1 ? "year" : "years"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="h-8 rounded-md border px-2 text-xs hover:bg-muted"
          onClick={() => setFrom(DateTime.now().setZone(zone).toISODate()!)}
          data-testid="gochara-calendar-today"
        >
          From today
        </button>
      </div>

      <div className="mt-3 space-y-3" data-testid="gochara-calendar-result">
        {!validFrom && (
          <p className="text-xs text-muted-foreground">Enter a start date.</p>
        )}
        {validFrom && query.isLoading && (
          <p className="text-xs text-muted-foreground">
            Walking the ephemeris…
          </p>
        )}
        {query.isError && (
          <p className="text-xs text-verdict-bad">
            Could not compute the calendar.
          </p>
        )}
        {cal && (
          <>
            <Timeline cal={cal} zone={zone} />

            {cal.saturnPassages.length > 0 && (
              <div
                className="rounded-md border border-l-4 border-l-verdict-bad/70 bg-card p-3 text-xs"
                data-testid="gochara-calendar-saturn"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    Saturn over the 12th, 1st and 2nd from the Moon
                  </span>
                  <Badge variant="outline" className="text-2xs">
                    sade sati: name provisional
                  </Badge>
                </div>
                <ul className="mt-2 space-y-0.5 text-muted-foreground">
                  {cal.saturnPassages.map((p, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap justify-between gap-2"
                    >
                      <span>
                        {ORD(p.house)} from the Moon ·{" "}
                        <SignName
                          signIndex={(cal.moonSignIndex + p.house - 1) % 12}
                        />
                      </span>
                      <span className="tabular">
                        {fmtD(p.start, zone)} – {fmtD(p.end, zone)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-2xs text-muted-foreground">
                  Results: Brihat Samhita 104.44-45 and Phaladeepika 26.23
                  (12th: much grief; 1st: danger to life, position and wealth
                  per 26.33-34; 2nd: loss of wealth and comfort). Both texts
                  scale this by the running dasa (BS 104.46) and by dignity (PD
                  26.31-32).
                </p>
              </div>
            )}

            {upcoming.length > 0 && (
              <div
                className="rounded-md border bg-card p-3 text-xs"
                data-testid="gochara-calendar-upcoming"
              >
                <div className="font-medium">Next changes</div>
                <ul className="mt-2 space-y-1">
                  {upcoming.map((u, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2">
                      <span className="tabular text-muted-foreground">
                        {fmtD(u.at, zone)}
                      </span>
                      <PlanetName planet={u.planet} />
                      <span>
                        <SignName signIndex={u.s.signIndex} />, {ORD(u.s.house)}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-medium",
                          PILL[u.s.verdict],
                        )}
                      >
                        {u.s.verdict}
                      </span>
                      {u.s.vedhaBy.length > 0 && (
                        <span className="text-muted-foreground">
                          vedha by {u.s.vedhaBy.join(", ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              {CALENDAR_PLANETS.map((planet) => {
                const p = cal.planets.find((q) => q.planet === planet);
                return p ? (
                  <SegmentList
                    key={planet}
                    planet={planet}
                    segments={p.segments}
                    zone={zone}
                  />
                ) : null;
              })}
            </div>

            <ul
              className="list-disc space-y-1 pl-5 text-2xs text-muted-foreground"
              data-testid="gochara-calendar-notes"
            >
              {cal.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
