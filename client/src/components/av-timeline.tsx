import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { NAKSHATRAS, type Planet } from "@shared/astro";
import { CONTRIBUTORS } from "@shared/ashtakavarga";
import type { AvTimeline, AvTransitRow, AvNakshatraRow, AvTone } from "@shared/av-transit";
import { SignName, PlanetName, planetColor } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const TONE_BORDER: Record<AvTone, string> = {
  support: "border-l-emerald-500/70",
  strain: "border-l-rose-500/70",
  mixed: "border-l-amber-500/70",
};
const TONE_PILL: Record<AvTone, string> = {
  support: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  strain: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  mixed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};
const TONE_LABEL: Record<AvTone, string> = { support: "favourable", strain: "unfavourable", mixed: "mixed" };
const BAND_PILL: Record<AvTransitRow["band"], string> = { favourable: TONE_PILL.support, medium: TONE_PILL.mixed, adverse: TONE_PILL.strain };

type Range = "around" | "life";

/** Eight boxes, one per contributor in the fixed order Sun to Saturn then lagna; filled where that contributor gave a rekha. */
function RekhaMarks({ givers, owner }: { givers: string[]; owner: Planet }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={`${givers.length} rekhas from ${givers.join(", ") || "none"}`}>
      {CONTRIBUTORS.map((c) => {
        const on = givers.includes(c);
        return (
          <span
            key={c}
            title={`${c}: ${on ? "rekha" : "dot"}`}
            className={cn("inline-block h-2.5 w-2.5 rounded-[2px] border", on ? "border-transparent" : "border-muted-foreground/40 bg-transparent")}
            style={on ? { backgroundColor: planetColor(owner), opacity: 0.85 } : undefined}
          />
        );
      })}
    </span>
  );
}

function Row({ r, open, toggle }: { r: AvTransitRow; open: boolean; toggle: () => void }) {
  return (
    <li className={cn("rounded-md border border-l-4 bg-card", TONE_BORDER[r.tone], r.current && "ring-1 ring-primary/40")} data-testid={`av-transit-${r.planet}-${r.start.slice(0, 10)}`}>
      <button className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left" onClick={toggle} aria-expanded={open}>
        <span className="w-[8.5rem] shrink-0 text-xs tabular-nums text-muted-foreground">
          {fmt(r.start)} – {fmt(r.end)}
        </span>
        <span className="flex items-center gap-2 text-sm">
          <SignName signIndex={r.signIndex} />
          <span className="text-xs text-muted-foreground">{r.house}H</span>
          {r.retrogradeEntry && <span className="rounded border px-1 text-[10px] text-muted-foreground">retrograde re-entry</span>}
          {r.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RekhaMarks givers={r.givers} owner={r.planet} />
            {r.ownRekhas}
          </span>
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", BAND_PILL[r.band])}>{r.sarva} · {r.band}</span>
          {r.hits.map((h) => (
            <span key={h.matter + h.kind} className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", h.kind === "sign" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border border-rose-500/40 text-rose-700/80 dark:text-rose-300/80")}>
              {h.matter.split(",")[0]}{h.kind === "trine" ? " (trine)" : ""}
            </span>
          ))}
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", TONE_PILL[r.tone])}>{TONE_LABEL[r.tone]}</span>
        </span>
      </button>
      {open && (
        <ul className="space-y-1 border-t px-3 py-2 text-xs text-muted-foreground" data-testid={`av-transit-notes-${r.planet}-${r.start.slice(0, 10)}`}>
          <li>
            Enters {fmtD(r.start)} at age {r.age.toFixed(1)}, leaves {fmtD(r.end)}.
          </li>
          {r.notes.map((n, i) => (
            <li key={i}>
              {n.text} <SourceLink source={n.source} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function NakRow({ r }: { r: AvNakshatraRow }) {
  return (
    <li className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-l-4 border-l-rose-500/70 bg-card px-3 py-1.5 text-xs", r.current && "ring-1 ring-primary/40")} data-testid={`av-nak-${r.start.slice(0, 10)}`}>
      <span className="w-[8.5rem] shrink-0 tabular-nums text-muted-foreground">
        {fmt(r.start)} – {fmt(r.end)}
      </span>
      <span className="text-sm">{NAKSHATRAS[r.nakshatraIndex]}</span>
      {r.retrogradeEntry && <span className="rounded border px-1 text-[10px] text-muted-foreground">retrograde re-entry</span>}
      {r.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
      <span className="ml-auto flex flex-wrap gap-1">
        {r.hits.map((h) => (
          <span key={h.matter + h.kind} className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", h.kind === "nakshatra" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border border-rose-500/40 text-rose-700/80 dark:text-rose-300/80")}>
            {h.matter.split(",")[0]}{h.kind === "trine nakshatra" ? " (trine)" : ""} <SourceLink source={h.source} className="font-normal text-muted-foreground" />
          </span>
        ))}
      </span>
    </li>
  );
}

export function AvTimelineSection({ tl, asOfIso }: { tl: AvTimeline; asOfIso: string }) {
  const [planet, setPlanet] = useState<"Saturn" | "Jupiter">("Saturn");
  const [range, setRange] = useState<Range>("around");
  const [open, setOpen] = useState<string | null>(null);
  const [caveats, setCaveats] = useState(false);

  const now = DateTime.fromISO(asOfIso);
  const inRange = (start: string, end: string) => {
    if (range === "life") return true;
    const lo = now.minus({ years: planet === "Saturn" ? 3 : 2 });
    const hi = now.plus({ years: 12 });
    return DateTime.fromISO(end) >= lo && DateTime.fromISO(start) <= hi;
  };
  const rows = useMemo(() => (planet === "Saturn" ? tl.saturn : tl.jupiter).filter((r) => inRange(r.start, r.end)), [planet, range, tl, asOfIso]);
  const naks = useMemo(() => tl.saturnNakshatras.filter((r) => inRange(r.start, r.end)), [range, tl, asOfIso, planet]);
  const src = tl.sources;

  return (
    <div className="mt-8" data-testid="parashari-av-timeline">
      <h3 className="text-sm font-semibold">Ashtakavarga transits</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Each sign Saturn or Jupiter passes is read by the planet's own chart, a passage through rekha-marked places being favourable and through dot-marked places not <SourceLink source={src.own} />, <SourceLink source={src.saturnOwn} />; by the
        aggregate band of the sign <SourceLink source={src.sarva} />, with Jupiter's year of a sign above 30 rekhas read by <SourceLink source={src.samvatsara} /> and by the Sun's chart <SourceLink source={src.sunYear} />; and, for Saturn, against
        the nakshatra and sign points of <SourceLink source={src.points} /> with their trines. The eight boxes show which of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the lagna gave a rekha to the sign. Filled red tags mark the exact point of chapter 70, outlined ones a trine of it.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border p-0.5" role="tablist">
          {(["Saturn", "Jupiter"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={planet === p}
              className={cn("rounded px-2.5 py-1 text-xs", planet === p ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground")}
              onClick={() => {
                setPlanet(p);
                setOpen(null);
              }}
              data-testid={`av-timeline-planet-${p}`}
            >
              <PlanetName planet={p} abbr={false} />
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-md border p-0.5">
          {(["around", "life"] as const).map((k) => (
            <button
              key={k}
              className={cn("rounded px-2.5 py-1 text-xs", range === k ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setRange(k)}
              data-testid={`av-timeline-range-${k}`}
            >
              {k === "around" ? "Around now" : "Whole life"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{rows.length} passages{planet === "Saturn" ? `, ${naks.length} nakshatra points struck` : ""}</span>
      </div>

      <ul className="mt-3 space-y-1.5" data-testid={`av-timeline-rows-${planet}`}>
        {rows.map((r) => (
          <Row key={r.start} r={r} open={open === r.start} toggle={() => setOpen(open === r.start ? null : r.start)} />
        ))}
        {rows.length === 0 && <li className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No passages in this range.</li>}
      </ul>

      {planet === "Saturn" && (
        <>
          <h4 className="mt-6 text-sm font-semibold">Nakshatra points struck by Saturn</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Saturn's passages through the nakshatras named by the products of chapter 70, or their trines (the 10th and 19th from each). Only passages that touch a point are listed.
          </p>
          {tl.hasNakshatras ? (
            <ul className="mt-2 space-y-1.5" data-testid="av-timeline-naks">
              {naks.map((r) => (
                <NakRow key={r.start} r={r} />
              ))}
              {naks.length === 0 && <li className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No nakshatra point is struck in this range.</li>}
            </ul>
          ) : (
            <p className="mt-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">Saturn's nakshatra ingresses are computed when a chart is cast; reopen this chart to see them.</p>
          )}

          <h4 className="mt-6 text-sm font-semibold">Years to watch</h4>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground" data-testid="av-timeline-years">
            {tl.distressYears.map((y) => (
              <li key={y.label}>
                Age {y.age}, from {fmtD(y.date)}: {y.label}. <SourceLink source={src.distressYears} />
              </li>
            ))}
          </ul>
        </>
      )}

      <button className="mt-3 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((v) => !v)} data-testid="av-timeline-caveats">
        {caveats ? "Hide" : "Show"} how the chapters were applied ({tl.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {tl.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

