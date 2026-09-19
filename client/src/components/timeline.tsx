import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { PLANET_ABBR, type PlanetPosition, type TransitPeriod, type Planet } from "@shared/astro";
import { LIFE_AREAS, type Finding, type Roles } from "@shared/rules";
import { readTransits, type TransitReading } from "@shared/timing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

function planetTone(p: Planet) {
  return cn("font-semibold", p === "Jupiter" && "text-primary", p === "Saturn" && "text-[hsl(var(--chart-2))]");
}

function Activated({ items, compact }: { items: Finding[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <ul className={cn("mt-1.5 space-y-1", compact ? "text-xs" : "text-sm")}>
      {items.map((f) => (
        <li key={f.ruleId} className="flex gap-2">
          <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" aria-hidden />
          <span>
            <span className="text-muted-foreground">{LIFE_AREAS[f.area].label} · </span>
            {f.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function NowCard({ r, birth }: { r: TransitReading; birth: DateTime }) {
  const t = r.period;
  const age = Math.floor(DateTime.utc().diff(birth, "years").years);
  return (
    <div className="rounded-lg border bg-card p-4" data-testid={`now-${t.planet.toLowerCase()}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm">
          <span className={planetTone(t.planet)}>{t.planet}</span> in <span className="font-medium">{t.sign}</span>
          <span className="text-muted-foreground"> · age {age}</span>
        </div>
        <div className="tabular text-xs text-muted-foreground">
          {fmt(t.start)} – {fmt(t.end)}
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{r.headline}</p>
      <Activated items={r.activated.slice(0, 3)} compact />
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {r.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

export function Timeline({
  transits,
  positions,
  findings,
  birthIso,
  selected,
  roles,
}: {
  transits: TransitPeriod[];
  positions: PlanetPosition[];
  findings: Finding[];
  birthIso: string;
  selected: Planet | null;
  roles?: Roles;
}) {
  const [track, setTrack] = useState<"Jupiter" | "Saturn">("Jupiter");
  const [onlyTouches, setOnlyTouches] = useState(false);
  const now = DateTime.utc();
  const birth = DateTime.fromISO(birthIso);

  const readings = useMemo(() => readTransits(transits, positions, findings, birthIso, roles), [transits, positions, findings, birthIso, roles]);

  const current = useMemo(() => {
    const cur = (planet: "Jupiter" | "Saturn") =>
      readings.find((r) => r.period.planet === planet && now >= DateTime.fromISO(r.period.start) && now < DateTime.fromISO(r.period.end));
    return { Jupiter: cur("Jupiter"), Saturn: cur("Saturn") };
  }, [readings, now]);

  const rows = useMemo(() => {
    return readings
      .filter((r) => r.period.planet === track)
      .map((r) => {
        const start = DateTime.fromISO(r.period.start);
        const end = DateTime.fromISO(r.period.end);
        return { r, start, end, age: start.diff(birth, "years").years, current: now >= start && now < end, past: end < now, days: end.diff(start, "days").days };
      })
      .filter((x) => !onlyTouches || x.r.conjunct.length > 0 || x.r.trine.length > 0)
      .filter((x) => !selected || x.r.conjunct.includes(selected) || x.r.trine.includes(selected) || x.r.opposite.includes(selected));
  }, [readings, track, onlyTouches, birth, now, selected]);

  const next = useMemo(() => {
    return readings.find((r) => r.period.planet === track && (r.conjunct.length > 0 || r.trine.length > 0) && DateTime.fromISO(r.period.start) > now);
  }, [readings, track, now]);

  return (
    <div>
      {(current.Jupiter || current.Saturn) && (
        <section className="mb-6" data-testid="section-now">
          <h3 className="font-display text-base font-semibold">Where the karakas stand now</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Read against this chart's own combinations: a passage ripens the findings its natal planets take part in, and is counted from the natal Jeeva and Karma.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {current.Jupiter && <NowCard r={current.Jupiter} birth={birth} />}
            {current.Saturn && <NowCard r={current.Saturn} birth={birth} />}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          <Button size="sm" variant={track === "Jupiter" ? "default" : "outline"} onClick={() => setTrack("Jupiter")} data-testid="button-track-jupiter">
            Jupiter · yearly
          </Button>
          <Button size="sm" variant={track === "Saturn" ? "default" : "outline"} onClick={() => setTrack("Saturn")} data-testid="button-track-saturn">
            Saturn · 2½ years
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="touches" checked={onlyTouches} onCheckedChange={setOnlyTouches} data-testid="switch-touches" />
          <Label htmlFor="touches" className="text-sm text-muted-foreground">
            Only passages over or in trine to a natal planet
          </Label>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {track === "Jupiter"
          ? `Transiting Jupiter${roles?.gender === "female" ? ", the universal timer (Venus is this native's Jeeva)," : ", the Jeeva,"} wakes whichever natal planet it passes over, together with everything that planet is combined with. Signs of the same direction count too: a passage in trine to a natal planet is a real trigger at about three-quarter strength, the 7th at half. Each row is one sign passage, so retrograde re-entries appear as short repeats.`
          : "Transiting Saturn, the Karma, brings duty, pressure and consolidation to whatever natal planet it passes over, and to the combinations that planet belongs to."}
        {selected && <span> Showing passages that touch {selected}.</span>}
        {next && (
          <span>
            {" "}
            Next passage touching a natal planet: {next.period.sign}, {fmt(next.period.start)} ({next.conjunct.length ? "over" : "trine"}{" "}
            {(next.conjunct.length ? next.conjunct : next.trine).map((p) => PLANET_ABBR[p]).join(" ")}).
          </span>
        )}
      </p>

      <ol className="mt-5 space-y-1">
        {rows.map(({ r, start, end, age, current: isCurrent, past, days }, i) => (
          <li
            key={`${r.period.planet}-${r.period.start}`}
            className={cn(
              "grid grid-cols-[4.5rem_1fr] gap-x-4 rounded-md px-3 py-2.5 sm:grid-cols-[4.5rem_11rem_1fr]",
              isCurrent && "bg-primary/10 ring-1 ring-primary/40",
              past && !isCurrent && "opacity-60",
              r.weight === 3 && !isCurrent && "bg-muted/40",
            )}
            data-testid={`row-transit-${i}`}
          >
            <div className="tabular text-sm">
              <div className="font-medium">{age <= 0.02 ? "Birth" : `Age ${Math.floor(age)}`}</div>
              <div className="text-xs text-muted-foreground">{start.year}</div>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.period.sign}</span>
                {r.period.retrogradeEntry && (
                  <span className="text-xs text-muted-foreground" title="Entered by retrograde motion">
                    ℞
                  </span>
                )}
                {isCurrent && <Badge className="no-default-hover-elevate">Now</Badge>}
              </div>
              <div className="tabular text-xs text-muted-foreground">
                {fmt(r.period.start)} – {fmt(end.toISO()!)}
                {days < 120 && <span> · brief</span>}
              </div>
              {(r.conjunct.length > 0 || r.trine.length > 0 || r.opposite.length > 0) && (
                <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  {r.conjunct.length > 0 && (
                    <span>
                      over{" "}
                      {r.conjunct.map((p) => (
                        <span key={p} className={cn(planetTone(p), "mr-1")}>
                          {PLANET_ABBR[p]}
                        </span>
                      ))}
                    </span>
                  )}
                  {r.trine.length > 0 && <span>trine {r.trine.map((p) => PLANET_ABBR[p]).join(" ")}</span>}
                  {r.opposite.length > 0 && <span>7th {r.opposite.map((p) => PLANET_ABBR[p]).join(" ")}</span>}
                </div>
              )}
            </div>
            <div className="col-span-2 mt-1.5 text-sm sm:col-span-1 sm:mt-0">
              <p className={cn(r.weight === 0 && "text-muted-foreground")}>{r.headline}</p>
              {r.weight >= 2 && <Activated items={r.activated.slice(0, isCurrent ? 4 : 3)} compact />}
              {r.weight === 1 && <Activated items={r.activated.slice(0, 2)} compact />}
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {r.notes.slice(0, r.weight >= 2 ? 3 : 1).map((n, k) => (
                  <li key={k}>{n}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      {rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No passages match the current filter.</p>}
      {!current[track] && rows.length > 0 && <p className="mt-3 text-xs text-muted-foreground">The current date falls outside the listed passages.</p>}
    </div>
  );
}
