import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { SIGNS, houseFrom, PLANET_ABBR, type PlanetPosition, type TransitPeriod, type Planet } from "@shared/astro";
import { TRANSIT_ACTIVATION } from "@shared/rules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

export function Timeline({ transits, positions, birthIso }: { transits: TransitPeriod[]; positions: PlanetPosition[]; birthIso: string }) {
  const [track, setTrack] = useState<"Jupiter" | "Saturn">("Jupiter");
  const [onlyTouches, setOnlyTouches] = useState(false);
  const now = DateTime.utc();
  const birth = DateTime.fromISO(birthIso);

  const rows = useMemo(() => {
    return transits
      .filter((t) => t.planet === track)
      .map((t) => {
        const start = DateTime.fromISO(t.start);
        const end = DateTime.fromISO(t.end);
        const conj = positions.filter((p) => p.signIndex === t.signIndex);
        const trine = positions.filter((p) => [5, 9].includes(houseFrom(t.signIndex, p.signIndex)));
        const opp = positions.filter((p) => houseFrom(t.signIndex, p.signIndex) === 7);
        const age = start.diff(birth, "years").years;
        return { ...t, startDt: start, endDt: end, conj, trine, opp, age, current: now >= start && now < end, past: end < now, days: end.diff(start, "days").days };
      })
      .filter((r) => !onlyTouches || r.conj.length > 0);
  }, [transits, positions, track, onlyTouches, birth, now]);

  const currentIdx = rows.findIndex((r) => r.current);

  return (
    <div>
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
            Only periods over a natal planet
          </Label>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {track === "Jupiter"
          ? "In Nadi timing, transiting Jupiter (the Jeeva) activates whichever natal planet it passes over; trines and the 7th are secondary triggers. Each row is one sign passage, so retrograde re-entries appear as short repeats."
          : "Transiting Saturn (the Karma) brings duty, pressure and consolidation to whatever natal planet it passes over."}
      </p>

      <ol className="mt-5 space-y-1">
        {rows.map((r, i) => (
          <li
            key={`${r.planet}-${r.start}`}
            className={cn(
              "grid grid-cols-[4.5rem_1fr] gap-x-4 rounded-md px-3 py-2.5 sm:grid-cols-[4.5rem_11rem_1fr]",
              r.current && "bg-primary/10 ring-1 ring-primary/40",
              r.past && !r.current && "opacity-60",
            )}
            data-testid={`row-transit-${i}`}
          >
            <div className="tabular text-sm">
              <div className="font-medium">{r.age <= 0.02 ? "Birth" : `Age ${Math.floor(r.age)}`}</div>
              <div className="text-xs text-muted-foreground">{r.startDt.year}</div>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{SIGNS[r.signIndex]}</span>
                {r.retrogradeEntry && (
                  <span className="text-xs text-muted-foreground" title="Entered by retrograde motion">
                    ℞
                  </span>
                )}
                {r.current && <Badge className="no-default-hover-elevate">Now</Badge>}
              </div>
              <div className="tabular text-xs text-muted-foreground">
                {fmt(r.start)} – {fmt(r.end)}
                {r.days < 120 && <span> · brief</span>}
              </div>
            </div>
            <div className="col-span-2 mt-1.5 text-sm sm:col-span-1 sm:mt-0">
              {r.conj.length === 0 && r.trine.length === 0 && r.opp.length === 0 && <span className="text-muted-foreground">Empty sign: a quieter passage.</span>}
              {r.conj.map((p) => (
                <div key={p.planet} className="flex gap-2">
                  <span className={cn("shrink-0 font-semibold", p.planet === "Jupiter" && "text-primary", p.planet === "Saturn" && "text-[hsl(var(--chart-2))]")}>{p.planet}</span>
                  <span>{TRANSIT_ACTIVATION[track][p.planet as Planet]}</span>
                </div>
              ))}
              {(r.trine.length > 0 || r.opp.length > 0) && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {r.trine.length > 0 && <span>Trine {r.trine.map((p) => PLANET_ABBR[p.planet]).join(" ")}</span>}
                  {r.trine.length > 0 && r.opp.length > 0 && <span> · </span>}
                  {r.opp.length > 0 && <span>7th {r.opp.map((p) => PLANET_ABBR[p.planet]).join(" ")}</span>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {currentIdx === -1 && rows.length > 0 && <p className="mt-3 text-xs text-muted-foreground">The current date falls outside the listed passages.</p>}
    </div>
  );
}
