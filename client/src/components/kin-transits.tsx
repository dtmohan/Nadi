import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { KinTransitsReading, KinPlanet, KinTransitRow, KinVerdict } from "@shared/kin-transits";
import { KIN_MATTER } from "@shared/kin-transits";
import { SignName, PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { RekhaMarks } from "@/components/av-timeline";
import { cn } from "@/lib/utils";

const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const PILL: Record<KinVerdict, string> = {
  favourable: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  distress: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  lean: "bg-muted text-muted-foreground",
  even: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};
const BORDER: Record<KinVerdict, string> = { favourable: "border-l-emerald-500/70", distress: "border-l-rose-500/70", lean: "border-l-border", even: "border-l-amber-500/70" };
const TONE_PILL = { support: PILL.favourable, strain: PILL.distress, mixed: PILL.even };
const PLANETS: KinPlanet[] = ["Mars", "Mercury", "Venus"];

function Row({ r, open, toggle, source }: { r: KinTransitRow; open: boolean; toggle: () => void; source: { label: string; url: string } }) {
  return (
    <li className={cn("rounded-md border border-l-4 bg-card text-xs", BORDER[r.verdict], r.current && "ring-1 ring-primary/40")} data-testid={`kin-transit-${r.planet}-${r.start.slice(0, 10)}`}>
      <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-left" onClick={toggle} aria-expanded={open}>
        <span className="min-w-[11.5rem] shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">
          {fmtD(r.start)} – {fmtD(r.end)}
        </span>
        <span className="text-sm">
          <SignName signIndex={r.signIndex} />
        </span>
        {r.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <RekhaMarks givers={r.givers} owner={r.planet} />
          <span className="tabular-nums">{r.rekhas}</span>
          {r.trikona !== undefined && <span className="text-[10px] text-muted-foreground">Trik. {r.trikona}</span>}
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", PILL[r.verdict])}>{r.verdict}</span>
        </span>
      </button>
      {open && (
        <div className="border-t px-3 py-2 text-xs" data-testid={`kin-transit-notes-${r.planet}-${r.start.slice(0, 10)}`}>
          {r.text} <SourceLink source={source} className="text-muted-foreground" />
        </div>
      )}
    </li>
  );
}

export function KinTransitsSection({ k }: { k: KinTransitsReading }) {
  const [planet, setPlanet] = useState<KinPlanet>("Mars");
  const [open, setOpen] = useState<string | null>(null);
  const [caveats, setCaveats] = useState(false);
  const rows = useMemo(() => k.rows[planet], [k, planet]);
  const source = planet === "Mars" ? k.sources.brothers : planet === "Mercury" ? k.sources.family : k.sources.marriage;
  return (
    <div className="mt-8" data-testid="parashari-kin-transits">
      <h3 className="text-base font-semibold">Mars, Mercury and Venus through their own charts</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Chapter 70 reads brothers, valour and land from Mars' passage through signs rich in rekhas in Mars' own chart, with distress to brothers where it has none <SourceLink source={k.sources.brothers} />; happiness
        to family, maternal uncle and friends from Mercury's passage through its rekha-rich signs <SourceLink source={k.sources.family} />; and gain of wealth, land, happiness and marriage from Venus' passage through
        its rekha-rich signs <SourceLink source={k.sources.marriage} />. Saturn's strikes on these matters are in the timeline above.
      </p>

      <ul className="mt-3 space-y-1 text-xs" data-testid="kin-natal">
        {k.natal.map((n, i) => (
          <li key={i} className="flex flex-wrap items-start gap-x-2">
            <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", TONE_PILL[n.tone])}>{n.tone === "support" ? "favourable" : n.tone === "strain" ? "adverse" : "note"}</span>
            <span className="min-w-0 flex-1">
              {n.text} <SourceLink source={n.source} className="text-muted-foreground" />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex rounded-md border p-0.5" role="tablist">
          {PLANETS.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={planet === p} className={cn("rounded px-2.5 py-1", planet === p ? "bg-muted font-medium" : "text-muted-foreground")} onClick={() => setPlanet(p)} data-testid={`kin-planet-${p}`}>
              <PlanetName planet={p} />
            </button>
          ))}
        </div>
        <span className="text-muted-foreground">{KIN_MATTER[planet]}</span>
      </div>

      {k.hasTransits ? (
        <ul className="mt-2 space-y-1.5" data-testid={`kin-rows-${planet}`}>
          {rows.map((r) => (
            <Row key={r.start} r={r} open={open === r.start} toggle={() => setOpen((v) => (v === r.start ? null : r.start))} source={source} />
          ))}
          {rows.length === 0 && <li className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No passages computed.</li>}
        </ul>
      ) : (
        <p className="mt-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">These passages are computed when a chart is opened; reopen this chart to see them.</p>
      )}

      <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((v) => !v)} data-testid="kin-caveats">
        {caveats ? "Hide" : "Show"} how 70.24-36 was applied ({k.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {k.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
