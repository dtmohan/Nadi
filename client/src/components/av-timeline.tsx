import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { NAKSHATRAS, type Planet } from "@shared/astro";
import { CONTRIBUTORS } from "@shared/ashtakavarga";
import type { AvTimeline, AvTransitRow, AvNakshatraRow, AvTone } from "@shared/av-transit";
import { FATHER_ARISHTA_CAVEATS, type FatherArishtaReading, type ArishtaLevel } from "@shared/father-arishta";
import type { MotherPointReading, MotherPointRow, MotherSeverity } from "@shared/mother-point";
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

const LEVEL_PILL: Record<ArishtaLevel, string> = { watch: TONE_PILL.mixed, grave: TONE_PILL.strain, averted: TONE_PILL.support };
const LEVEL_LABEL: Record<ArishtaLevel, string> = { watch: "to watch", grave: "grave", averted: "averted by dasa" };
const LEVEL_BORDER: Record<ArishtaLevel, string> = { watch: TONE_BORDER.mixed, grave: TONE_BORDER.strain, averted: TONE_BORDER.support };

const SEVERITY_PILL: Record<MotherSeverity, string> = { "death or distress": TONE_PILL.strain, "death may occur": TONE_PILL.strain, distress: TONE_PILL.mixed };
const SEVERITY_BORDER: Record<MotherSeverity, string> = { "death or distress": TONE_BORDER.strain, "death may occur": TONE_BORDER.strain, distress: TONE_BORDER.mixed };
const fmtDT = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL HH:mm");

function MotherRow({ r, open, toggle, sources }: { r: MotherPointRow; open: boolean; toggle: () => void; sources: MotherPointReading["sources"] }) {
  const key = `${r.kind.replace(" ", "-")}-${r.start.slice(0, 10)}`;
  return (
    <li className={cn("rounded-md border border-l-4 bg-card text-xs", SEVERITY_BORDER[r.severity], r.current && "ring-1 ring-primary/40")} data-testid={`av-mother-${key}`}>
      <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-left" onClick={toggle} aria-expanded={open}>
        <span className="w-[8.5rem] shrink-0 tabular-nums text-muted-foreground">
          {fmt(r.start)} – {fmt(r.end)}
        </span>
        <span className="text-sm">{r.label}</span>
        <span className="text-[10px] text-muted-foreground">{r.kind === "sign" || r.kind === "nakshatra" ? `${r.kind} point` : r.kind}</span>
        {r.retrogradeEntry && <span className="rounded border px-1 text-[10px] text-muted-foreground">retrograde re-entry</span>}
        {r.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
        <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium", SEVERITY_PILL[r.severity])}>{r.severity}</span>
      </button>
      {open && (
        <div className="border-t px-3 py-2 text-xs" data-testid={`av-mother-notes-${key}`}>
          <p>
            Age {r.age}. {r.text}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
            <SourceLink source={sources.point} />
            {r.runningDasa && <SourceLink source={sources.dasa} />}
          </p>
        </div>
      )}
    </li>
  );
}

function MotherSection({ m, inRange }: { m: MotherPointReading; inRange: (s: string, e: string) => boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [caveats, setCaveats] = useState(false);
  const rows = m.rows.filter((r) => inRange(r.start, r.end));
  const CAL_PILL: Record<"avoid" | "fit" | "even", string> = { avoid: TONE_PILL.strain, fit: TONE_PILL.support, even: TONE_PILL.mixed };
  return (
    <div data-testid="av-timeline-mother">
      <h4 className="mt-6 text-sm font-semibold">Mother's point under Saturn</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Mother, house and village are read from the 4th from the Moon: its {m.rekhas} rekhas in the Moon's chart times the Moon's yoga pinda give {m.product}, whose remainders by 27 and 12 name{" "}
        {NAKSHATRAS[m.pointNakshatra]} and <SignName signIndex={m.pointSign} />. Saturn in that nakshatra brings death of, or distress to, the mother; in that sign her death may occur; in their trines,
        distress. <SourceLink source={m.sources.point} /> The verses give no planetary condition like 70.12 for the mother, so none is tested.
      </p>
      <ul className="mt-2 space-y-1.5" data-testid="av-timeline-mother-rows">
        {rows.map((r) => {
          const k = r.kind + r.start;
          return <MotherRow key={k} r={r} open={open === k} toggle={() => setOpen((v) => (v === k ? null : k))} sources={m.sources} />;
        })}
        {rows.length === 0 && <li className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No passage over the mother's point in this range.</li>}
      </ul>
      {!m.hasNakshatras && <p className="mt-2 text-xs text-muted-foreground">Nakshatra passages appear once this chart is reopened.</p>}

      <h4 className="mt-5 text-sm font-semibold">Moon's month for auspicious functions</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        No auspicious function while the Moon transits a sign holding more dots than rekhas in the Moon's own chart. <SourceLink source={m.sources.calendar} /> Thirty days from the day the chart was opened, times in this device's zone.
      </p>
      {m.calendar ? (
        <ul className="mt-2 grid gap-1 sm:grid-cols-2" data-testid="av-timeline-moon-month">
          {m.calendar.map((c) => (
            <li key={c.start} className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border bg-card px-2.5 py-1 text-xs", c.current && "ring-1 ring-primary/40")} data-testid={`av-moon-${c.start.slice(0, 10)}`}>
              <span className="min-w-[11rem] shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">
                {fmtDT(c.start)} – {fmtDT(c.end)}
              </span>
              <SignName signIndex={c.signIndex} />
              <span className="text-[10px] text-muted-foreground">{c.rekhas} rekhas</span>
              {c.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
              <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium", CAL_PILL[c.verdict])}>{c.verdict}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">The Moon's month is computed when a chart is opened; reopen this chart to see it.</p>
      )}
      <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((v) => !v)} data-testid="av-timeline-mother-caveats">
        {caveats ? "Hide" : "Show"} how 70.21-23 was applied ({m.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {m.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArishtaRow({ r, open, toggle }: { r: FatherArishtaReading; open: boolean; toggle: () => void }) {
  return (
    <li className={cn("rounded-md border border-l-4 bg-card text-xs", LEVEL_BORDER[r.level], r.current && "ring-1 ring-primary/40")} data-testid={`av-arishta-${r.start.slice(0, 10)}`}>
      <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-left" onClick={toggle} aria-expanded={open}>
        <span className="min-w-[11.5rem] shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">
          {fmtD(r.start)} – {fmtD(r.end)}
        </span>
        <span className="flex items-center gap-1 text-sm">
          Saturn in <SignName signIndex={r.saturnSignIndex} />
          <span className="text-[10px] text-muted-foreground">({r.pointKind === "sign" ? "father's point" : "trine"})</span>
        </span>
        <span className="flex flex-wrap items-center gap-1">
          {r.fourthFromSun.map((p) => (
            <PlanetName key={p} planet={p} abbr />
          ))}
          <span className="text-[10px] text-muted-foreground">in 4th from Sun</span>
        </span>
        {r.current && <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">now</span>}
        <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium", LEVEL_PILL[r.level])}>{LEVEL_LABEL[r.level]}</span>
      </button>
      {open && (
        <div className="border-t px-3 py-2 text-xs" data-testid={`av-arishta-notes-${r.start.slice(0, 10)}`}>
          <p>
            Age {r.age}. {r.text}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
            {r.sources.map((s) => (
              <SourceLink key={s.label} source={s} />
            ))}
          </p>
        </div>
      )}
    </li>
  );
}

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

export function AvTimelineSection({ tl, asOfIso, arishta, mother }: { tl: AvTimeline; asOfIso: string; arishta?: FatherArishtaReading[]; mother?: MotherPointReading | null }) {
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
  const arishtaRows = useMemo(() => (arishta ?? []).filter((r) => inRange(r.start, r.end)), [range, arishta, asOfIso, planet]);
  const [openArishta, setOpenArishta] = useState<string | null>(null);
  const [arishtaCaveats, setArishtaCaveats] = useState(false);
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

          <h4 className="mt-6 text-sm font-semibold">Father's point under Saturn</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Windows when Saturn crosses the father's sign point or a trine of it while Rahu, Saturn or Mars stand in the 4th from the natal Sun (70.12). The threat matures if Saturn, joined or aspected by a
            malefic, is in the 9th from the lagna or the Moon, or the dasa of the 4th lord runs (70.13); a favourable dasa averts it (70.14).
          </p>
          {arishta ? (
            <ul className="mt-2 space-y-1.5" data-testid="av-timeline-arishta">
              {arishtaRows.map((r) => (
                <ArishtaRow key={r.start} r={r} open={openArishta === r.start} toggle={() => setOpenArishta((v) => (v === r.start ? null : r.start))} />
              ))}
              {arishtaRows.length === 0 && <li className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No 70.12 window in this range.</li>}
            </ul>
          ) : (
            <p className="mt-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">These windows are computed when a chart is cast; reopen this chart to see them.</p>
          )}
          <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setArishtaCaveats((v) => !v)} data-testid="av-timeline-arishta-caveats">
            {arishtaCaveats ? "Hide" : "Show"} how 70.12-14 was applied ({FATHER_ARISHTA_CAVEATS.length} notes)
          </button>
          {arishtaCaveats && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {FATHER_ARISHTA_CAVEATS.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}

          {mother && <MotherSection m={mother} inRange={inRange} />}

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

