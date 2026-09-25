import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, SIGNS, type Planet } from "@shared/astro";
import { computeParashari, ord, listH, roleLabel, LORDSHIP_LABEL, KENDRA, type ParashariFinding } from "@shared/parashari";
import { LAGNA_NATURE, BPHS_URL } from "@shared/parashari-data";
import { LAYER_LABEL, finePeriodsOf, type DasaReading, type AntarReading, type DasaNote, type FinePeriod } from "@shared/parashari-dasa";
import { SHADBALA_SOURCES, type ShadbalaResult, type PlanetShadbala } from "@shared/shadbala";
import type { AshtakavargaResult, Bhinnashtaka } from "@shared/ashtakavarga";
import { BHAVA_PHALA_CAVEATS, type BhavaPhala, type VargaPhala } from "@shared/bhava-phala";
import { NAKSHATRAS } from "@shared/astro";
import { computeAvTimeline } from "@shared/av-transit";
import { AvTimelineSection } from "@/components/av-timeline";
import { readFatherArishta } from "@shared/father-arishta";
import { readMotherPoint } from "@shared/mother-point";
import { readKinTransits } from "@shared/kin-transits";
import { KinTransitsSection } from "@/components/kin-transits";
import { computeVargas } from "@shared/vargas";
import { VargasSection } from "@/components/vargas";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { PlanetName, SignName, planetColor } from "@/components/planet-name";
import { DasaBar } from "@/components/dasa-bar";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const VERDICT_CLASS: Record<ParashariFinding["tone"], string> = {
  support: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  strain: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  mixed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};
const VERDICT_LABEL: Record<ParashariFinding["tone"], string> = { support: "favourable", strain: "unfavourable", mixed: "mixed" };

const TONE_CLASS: Record<ParashariFinding["tone"], string> = {
  support: "border-l-emerald-500/70",
  strain: "border-l-rose-500/70",
  mixed: "border-l-amber-500/70",
};

const ROLE_CLASS: Record<string, string> = {
  yogakaraka: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  auspicious: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  malefic: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  maraka: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  neutral: "bg-muted text-muted-foreground",
};

function Finding({ f }: { f: ParashariFinding }) {
  return (
    <div className={cn("rounded-md border border-l-4 bg-card p-3", TONE_CLASS[f.tone])} data-testid={`parashari-finding-${f.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{f.title}</span>
        <span className="flex gap-1">
          {f.planets.map((p) => (
            <PlanetName key={p} planet={p} abbr tone className="text-[11px]" />
          ))}
        </span>
        {f.source.provisional && <Badge variant="outline" className="text-[10px]">provisional</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        <SourceLink source={f.source} mark={false} />
      </p>
    </div>
  );
}

export function ParashariPanel({ result }: { result: ChartResult }) {
  const { positions, chart } = result;
  const asOfIso = result.now.asOf;
  const r = useMemo(() => computeParashari(positions, result.jaimini.lagna.lon, result.utc, asOfIso, result.shadbala, result.dasaStarts), [positions, result.jaimini.lagna.lon, result.utc, asOfIso, result.shadbala, result.dasaStarts]);
  const fatherArishta = useMemo(
    () => (result.fatherArishta ? readFatherArishta(result.fatherArishta, r.bhavas[3].lord, r.dashas, r.dasaReadings, result.utc, asOfIso) : undefined),
    [result.fatherArishta, r, result.utc, asOfIso],
  );
  const motherPoint = useMemo(() => readMotherPoint(r.ashtakavarga, result.transits, result.saturnNakshatras, result.moonMonth, r.dasaReadings, result.utc, asOfIso), [r, result.transits, result.saturnNakshatras, result.moonMonth, result.utc, asOfIso]);
  const kinTransits = useMemo(() => readKinTransits(r.ashtakavarga, positions, result.fastTransits, r.shadbala, asOfIso), [r, positions, result.fastTransits, asOfIso]);
  const avTimeline = useMemo(() => computeAvTimeline(r.ashtakavarga, r.lagna.signIndex, result.transits, result.saturnNakshatras, result.utc, asOfIso), [r, result.transits, result.saturnNakshatras, result.utc, asOfIso]);
  const vargas = useMemo(() => computeVargas(positions, result.jaimini.lagna.lon), [positions, result.jaimini.lagna.lon]);
  const [balaOpen, setBalaOpen] = useState<string | null>(null);
  const [focusHouse, setFocusHouse] = useState<number | null>(null);
  const [section, setSection] = useState<"lords" | "yogas">("yogas");
  const [dasaPick, setDasaPick] = useState<string | null>(null);
  const [antarOpen, setAntarOpen] = useState<string | null>(null);

  const nature = LAGNA_NATURE[r.lagna.signIndex];
  const lords = r.findings.filter((f) => f.kind === "lord");
  const yogas = r.findings.filter((f) => f.kind !== "lord");
  const shownLords = focusHouse ? lords.filter((f) => f.id === `pa-lord-${focusHouse}-${r.bhavas[focusHouse - 1].lordIn}` || f.id.endsWith(`-${focusHouse}`)) : lords;
  const focusBhava = focusHouse ? r.bhavas[focusHouse - 1] : null;
  const cur = r.dashas.find((d) => d.current);
  const selDasa: DasaReading | undefined = r.dasaReadings.find((d) => d.lord === dasaPick) ?? r.dasaReadings.find((d) => d.current) ?? r.dasaReadings[0];
  const ageNow = DateTime.fromISO(asOfIso).diff(DateTime.fromISO(result.utc), "days").days / 365.25;

  const badges: Record<number, string[]> = {};
  for (const b of r.bhavas) {
    if (KENDRA.includes(b.house) || [5, 9].includes(b.house)) badges[b.signIndex] = [KENDRA.includes(b.house) ? "kendra" : "trikona"];
  }

  return (
    <div data-testid="parashari-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Parashari</h2>
          <p className="text-sm text-muted-foreground">
            {SIGNS[r.lagna.signIndex]} rising, whole-sign bhavas. Lords in houses from chapter 24, planetary nature for this lagna from chapter 34, aspects from chapter 26, yogas from chapters 34, 36, 41, 42 and 75 of{" "}
            <a href={BPHS_URL(24)} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2">Brihat Parashara Hora Sastra</a> (Santhanam translation). Nodes have no aspect in chapter 26 and own no house; they are read through their sign lord. First pass.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <SouthIndianChart
            positions={positions}
            title={chart.name}
            subtitle="Rasi · whole-sign bhavas"
            lagnaSign={r.lagna.signIndex}
            badges={badges}
            accent={[r.bhavas[0].lord]}
            footer="Click a sign to read its bhava"
            highlightSign={focusHouse ? r.bhavas[focusHouse - 1].signIndex : null}
            onSignClick={(si) => {
              const h = ((si - r.lagna.signIndex + 12) % 12) + 1;
              setFocusHouse((cur) => (cur === h ? null : h));
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">Lagna lord {r.bhavas[0].lord} in the primary colour. Angles and trines are labelled; the 3rd, 6th, 8th, 11th and 12th are the houses Parashara treats with caution (34.4-6).</p>

        </div>

        <div>
          <h3 className="text-sm font-semibold">Bhavas</h3>
          <Table className="mt-2" data-testid="parashari-bhavas">
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead>Sign</TableHead>
                <TableHead>Lord → in</TableHead>
                <TableHead>Occupants</TableHead>
                <TableHead className="hidden md:table-cell">Aspected by (quarters)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.bhavas.map((b) => (
                <TableRow
                  key={b.house}
                  className={cn("cursor-pointer", focusHouse === b.house && "bg-primary/5")}
                  onClick={() => setFocusHouse((cur) => (cur === b.house ? null : b.house))}
                  data-testid={`parashari-bhava-${b.house}`}
                >
                  <TableCell className="py-1.5 font-medium">{b.house}</TableCell>
                  <TableCell className="py-1.5"><SignName signIndex={b.signIndex} abbr /></TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap"><PlanetName planet={b.lord} abbr /> <span className="text-muted-foreground">→ {b.lordIn}</span></TableCell>
                  <TableCell className="py-1.5">
                    <span className="flex flex-wrap gap-1">{b.occupants.map((p) => <PlanetName key={p} planet={p} abbr />)}</span>
                  </TableCell>
                  <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
                    {b.aspects.map((a) => `${PLANET_ABBR[a.planet]} ${a.quarters}`).join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Aspects are sign-based: every planet sees the 7th fully; Saturn the 3rd and 10th, Jupiter the 5th and 9th, Mars the 4th and 8th fully; otherwise 3/10 a quarter, 5/9 a half, 4/8 three quarters, <SourceLink source={{ label: "Parashara 26.2-5", url: BPHS_URL(26) }} />.
          </p>
        </div>
      </div>

      <div className="mt-8">
          <h3 className="text-sm font-semibold">Planets for {SIGNS[r.lagna.signIndex]} rising</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Functional roles as Parashara states them for this rising sign, <SourceLink source={{ label: `Parashara ${nature.verses}`, url: BPHS_URL(34) }} />. {nature.note}{nature.byRule?.length ? <> A planet owning a kendra and a trikona together is a yogakaraka in the special sense, and a malefic kendra lord turns auspicious only by that double lordship, <SourceLink source={{ label: "Parashara 34.13-14", url: BPHS_URL(34) }} />.</> : null}
        </p>
        <Table className="mt-2" data-testid="parashari-natures">
          <TableHeader>
            <TableRow>
              <TableHead>Planet</TableHead>
              <TableHead>Owns</TableHead>
              <TableHead>In</TableHead>
              <TableHead>Role here</TableHead>
              <TableHead className="hidden sm:table-cell">By lordship</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.natures.map((n) => (
              <TableRow key={n.planet} data-testid={`parashari-nature-${n.planet}`}>
                <TableCell className="py-1.5"><PlanetName planet={n.planet} /></TableCell>
                <TableCell className="py-1.5">{n.owns.length ? n.owns.join(", ") : "—"}</TableCell>
                <TableCell className="py-1.5">{n.house}</TableCell>
                <TableCell className="py-1.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", ROLE_CLASS[n.functional])}>{n.functional}</span>
                  {n.naturalBenefic && <span className="ml-1 text-[11px] text-muted-foreground">natural benefic</span>}
                </TableCell>
                <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell">{LORDSHIP_LABEL[n.lordship]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="Parashari section" className="inline-flex rounded-md border p-0.5 text-sm">
            <button role="tab" aria-selected={section === "yogas"} onClick={() => setSection("yogas")} className={cn("rounded px-3 py-1", section === "yogas" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")} data-testid="parashari-section-yogas">
              Yogas and combinations ({yogas.length})
            </button>
            <button role="tab" aria-selected={section === "lords"} onClick={() => setSection("lords")} className={cn("rounded px-3 py-1", section === "lords" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")} data-testid="parashari-section-lords">
              Lords in houses ({shownLords.length}{focusHouse ? ` of 12` : ""})
            </button>
          </div>
          {focusHouse && (
            <button className="text-xs text-muted-foreground underline underline-offset-2" onClick={() => setFocusHouse(null)} data-testid="parashari-clear-focus">
              Clear focus on the {ord(focusHouse)}
            </button>
          )}
        </div>

        {section === "yogas" && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {yogas.map((f) => <Finding key={f.id} f={f} />)}
          </div>
        )}
        {section === "lords" && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {shownLords.map((f) => <Finding key={f.id} f={f} />)}
            <p className="text-[11px] text-muted-foreground md:col-span-2">
              Parashara qualifies all of these by the lord's strength: full effect when strong, half when middling, a quarter when weak; where a planet owns two houses and the results contradict, they cancel, <SourceLink source={{ label: "Parashara 24.145-148", url: BPHS_URL(24) }} />. {r.shadbala ? "The qualifier in each card uses the Shadbala below: full at or above the requirement of 27.32-33, half from three quarters of it, a quarter below that; the thresholds for half and quarter are not stated in the text." : "Strength (Shadbala) needs a recomputed chart; open the chart again to fetch it."}
            </p>
          </div>
        )}
      </div>

      {r.shadbala && <ShadbalaSection sb={r.shadbala} open={balaOpen} setOpen={setBalaOpen} phala={r.bhavaPhala} varga={r.vargaPhala} />}
      <VargasSection v={vargas} name={chart.name} />
      <AshtakavargaSection av={r.ashtakavarga} lagnaIdx={r.lagna.signIndex} />
      <AvTimelineSection tl={avTimeline} asOfIso={asOfIso} arishta={fatherArishta} mother={motherPoint} />
      <KinTransitsSection k={kinTransits} />

      <div className="mt-8">
        <h3 className="text-sm font-semibold">Vimshottari dasa, read by lordship</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Same Vimshottari sequence as the KP panel but from the Lahiri Moon ({positions.find((p) => p.planet === "Moon")?.nakshatra}), balance {r.vimshottari.balanceYears.toFixed(2)} years of {r.vimshottari.dasas[0].lord}. Each lord is glossed by the houses it owns and occupies and by its role for this rising sign. Pick a dasa row to read its effects from ch. 47-48 and its antar dasas from ch. 52-60.
        </p>
        <DasaBar
          className="mt-2"
          nowAt={ageNow}
          segments={r.dashas.map((d) => ({ start: d.ageStart, end: d.ageEnd, color: planetColor(d.lord), label: PLANET_ABBR[d.lord], current: d.current, title: `${d.lord} dasa · ${fmt(d.start)} to ${fmt(d.end)}` }))}
          testId="parashari-dasa-bar"
        />
        <Table className="mt-3" data-testid="parashari-dashas">
          <TableHeader>
            <TableRow>
              <TableHead>Dasa</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
              <TableHead>Reading</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.dashas.map((d) => (
              <TableRow key={d.lord + d.start} className={cn("cursor-pointer", d.current && "bg-primary/5", selDasa?.lord === d.lord && "ring-1 ring-inset ring-primary/40")} onClick={() => { setDasaPick(d.lord); setAntarOpen(null); }} data-testid={`parashari-dasa-${d.lord}`}>
                <TableCell className="py-1.5 whitespace-nowrap">
                  <PlanetName planet={d.lord} />
                  {d.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                </TableCell>
                <TableCell className="py-1.5 text-right whitespace-nowrap">{d.ageStart.toFixed(1)}–{d.ageEnd.toFixed(1)}</TableCell>
                <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell whitespace-nowrap">{fmt(d.start)} – {fmt(d.end)}</TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">
                  <span className={cn("mr-1 rounded px-1.5 py-0.5 text-[11px] font-medium", ROLE_CLASS[d.functional])}>{roleLabel(d.functional)}</span>
                  {d.summary}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {cur && (
          <p className="mt-2 text-xs text-muted-foreground" data-testid="parashari-current">
            Running now: {cur.lord} dasa, {cur.owns.length ? `lord of the ${listH(cur.owns)}` : "a node"} in the {ord(cur.house)}.
          </p>
        )}
      </div>

      {selDasa && <DasaEffects d={selDasa} open={antarOpen} setOpen={setAntarOpen} birthIso={result.utc} asOfIso={asOfIso} />}
    </div>
  );
}

const fmtV = (v: number) => (Math.abs(v) < 0.05 ? "0" : v.toFixed(1).replace(/\.0$/, ""));

function ShadbalaSection({ sb, open, setOpen, phala, varga }: { sb: ShadbalaResult; open: string | null; setOpen: (k: string | null) => void; phala?: BhavaPhala[]; varga?: VargaPhala[] }) {
  const [caveats, setCaveats] = useState(false);
  const [phalaOpen, setPhalaOpen] = useState<number | null>(null);
  const allCaveats = phala ? [...sb.caveats, ...BHAVA_PHALA_CAVEATS] : sb.caveats;
  return (
    <div className="mt-8" data-testid="parashari-shadbala">
      <h3 className="text-sm font-semibold">Strength of the planets (Shadbala)</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The six strengths of <SourceLink source={{ label: "Parashara ch. 27", url: BPHS_URL(27) }} /> in virupas (60 to a rupa): positional (Sthana), directional (Dig), temporal (Kala), motional (Chesta), natural (Naisargika) and aspectual (Drik), with aspect values from 26.6-12 and planetary relationships from 3.55-58. The total is set against the requirement of 27.32-33; nodes have none. The last column gives the Ishta and Kashta phala of <SourceLink source={{ label: "ch. 28", url: BPHS_URL(28) }} />, the benefic and malefic tendency out of 60. Open a row for the working.
        {" "}Lords of the {sb.daytime ? "day" : "night"} birth: year {sb.lords.varsha}, month {sb.lords.masa}, weekday {sb.lords.dina}, hora {sb.lords.hora} (27.13).
        {sb.wars.length > 0 && <> Planetary war (27.20): {sb.wars.map((w) => `${w.victor} over ${w.loser}, ${w.separation.toFixed(2)} deg apart`).join("; ")}; the difference of their totals moves to the victor.</>}
      </p>
      <Table className="mt-2" data-testid="parashari-shadbala-table">
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead className="hidden text-right md:table-cell">Sthana</TableHead>
            <TableHead className="hidden text-right md:table-cell">Dig</TableHead>
            <TableHead className="hidden text-right md:table-cell">Kala</TableHead>
            <TableHead className="hidden text-right md:table-cell">Chesta</TableHead>
            <TableHead className="hidden text-right md:table-cell">Naisargika</TableHead>
            <TableHead className="hidden text-right md:table-cell">Drik</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Needed</TableHead>
            <TableHead>Verdict</TableHead>
            <TableHead className="hidden whitespace-nowrap text-right sm:table-cell">Ishta / Kashta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sb.planets.map((r) => <BalaRows key={r.planet} r={r} sb={sb} varga={varga?.find((v) => v.planet === r.planet)} open={open === r.planet} toggle={() => setOpen(open === r.planet ? null : r.planet)} />)}
        </TableBody>
      </Table>
      <h4 className="mt-6 text-sm font-semibold">Strength of the houses (Bhava bala)</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Each cusp (lagna degree plus multiples of 30) measured from the point 27.26-28 name for its sign, a quarter of each aspect on it added or taken, the whole aspect of Jupiter and Mercury, the lord's Shadbala (27.29), a rupa for Jupiter or Mercury in the house and one less for the Sun, Mars or Saturn (27.30), and 15 virupas by the rising of the sign for a {sb.twilight ? "twilight" : sb.daytime ? "day" : "night"} birth (27.31). No requirement is stated; higher is stronger.
      </p>
      <Table className="mt-2" data-testid="parashari-bhava-bala">
        <TableHeader>
          <TableRow>
            <TableHead>House</TableHead>
            <TableHead>Sign</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Dig</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Drishti</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Lord</TableHead>
            <TableHead className="hidden text-right md:table-cell">Occupants</TableHead>
            <TableHead className="hidden text-right md:table-cell">Rising</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sb.bhavas.map((b) => (
            <TableRow key={b.house} data-testid={`parashari-bhava-bala-${b.house}`}>
              <TableCell className="py-1.5">{b.house}</TableCell>
              <TableCell className="py-1.5"><SignName signIndex={b.signIndex} /></TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">{fmtV(b.dig)}<span className="ml-1 text-[10px] text-muted-foreground">from {b.reference}</span></TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">{fmtV(b.drishti)}</TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">{fmtV(b.lordBala)}<span className="ml-1 text-[10px] text-muted-foreground">{PLANET_ABBR[b.lord]}</span></TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">{b.occupants.length ? b.occupants.map((o) => `${PLANET_ABBR[o.planet]} ${o.value > 0 ? "+" : ""}${o.value}`).join(", ") : "—"}</TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">{b.udaya || "—"}</TableCell>
              <TableCell className="py-1.5 text-right font-medium tabular-nums">{b.total.toFixed(0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-1 text-[11px] text-muted-foreground">
        <SourceLink source={sb.sources.bhavaDig} /> · <SourceLink source={sb.sources.bhavaDrishti} /> · <SourceLink source={sb.sources.bhavaOccupant} /> · <SourceLink source={sb.sources.bhavaUdaya} /> · rising of the signs <SourceLink source={sb.sources.udayaSigns} />
      </p>
      {phala && (
        <>
          <h4 className="mt-6 text-sm font-semibold">Effects of the houses (28.15-20)</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Parashara combines each house's strength with its lord's, then adds to the good and takes from the ill for a benefic in the house, its aspects, the lord's dignity and the Ashtakavarga rekhas of the sign, reversing each for malefics, <SourceLink source={{ label: "Parashara 28.15-20", url: BPHS_URL(28), provisional: true }} />. The verses give the direction of each step, not its scale; the amounts here are a stated reading (see the notes). Open a row for the parts.
          </p>
          <Table className="mt-2" data-testid="parashari-bhava-phala">
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead>Sign</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Good</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Ill</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Reading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phala.map((b) => (
                <PhalaRows key={b.house} b={b} open={phalaOpen === b.house} toggle={() => setPhalaOpen(phalaOpen === b.house ? null : b.house)} />
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((v) => !v)} data-testid="parashari-shadbala-caveats">
        {caveats ? "Hide" : "Show"} how the chapters were applied ({allCaveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground" data-testid="parashari-shadbala-caveat-list">
          {allCaveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      )}
    </div>
  );
}

function PhalaRows({ b, open, toggle }: { b: BhavaPhala; open: boolean; toggle: () => void }) {
  const cls = b.verdict === "auspicious" ? VERDICT_CLASS.support : b.verdict === "inauspicious" ? VERDICT_CLASS.strain : VERDICT_CLASS.mixed;
  return (
    <>
      <TableRow className={cn("cursor-pointer", open && "bg-muted/40")} onClick={toggle} data-testid={`parashari-bhava-phala-${b.house}`}>
        <TableCell className="py-1.5">{b.house}</TableCell>
        <TableCell className="py-1.5"><SignName signIndex={b.signIndex} /></TableCell>
        <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">{b.subha.toFixed(0)}</TableCell>
        <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">{b.asubha.toFixed(0)}</TableCell>
        <TableCell className="py-1.5 text-right font-medium tabular-nums">{b.net > 0 ? "+" : ""}{b.net.toFixed(0)}</TableCell>
        <TableCell className="py-1.5"><span className={cn("whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium", cls)}>{b.verdict} · {Math.round(b.share * 100)}% good</span></TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="px-3 py-2" data-testid={`parashari-bhava-phala-detail-${b.house}`}>
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {b.parts.map((p, i) => (
                <li key={i}>{p.label}: good {p.subha > 0 ? "+" : ""}{p.subha.toFixed(0)}, ill {p.asubha > 0 ? "+" : ""}{p.asubha.toFixed(0)} <SourceLink source={p.source} /></li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function BalaRows({ r, sb, varga, open, toggle }: { r: PlanetShadbala; sb: ShadbalaResult; varga?: VargaPhala; open: boolean; toggle: () => void }) {
  const src = sb.sources;
  const ik = sb.ishta.find((x) => x.planet === r.planet);
  const num = (v: number) => <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">{fmtV(v)}</TableCell>;
  return (
    <>
      <TableRow className={cn("cursor-pointer", open && "bg-muted/40")} onClick={toggle} data-testid={`parashari-shadbala-${r.planet}`}>
        <TableCell className="py-1.5 whitespace-nowrap"><PlanetName planet={r.planet} /></TableCell>
        {num(r.sthana.total)}
        {num(r.dig)}
        {num(r.kala.total)}
        {num(r.chesta)}
        {num(r.naisargika)}
        {num(r.drik)}
        <TableCell className="py-1.5 text-right font-medium tabular-nums">
          {r.total.toFixed(0)}
          {r.yuddha !== 0 && <span className="block whitespace-nowrap text-[10px] font-normal text-muted-foreground">war {r.yuddha > 0 ? "+" : ""}{r.yuddha.toFixed(0)}</span>}
        </TableCell>
        <TableCell className="py-1.5 text-right tabular-nums text-muted-foreground">{r.required}</TableCell>
        <TableCell className="py-1.5">
          <span className={cn("whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium", r.strong ? VERDICT_CLASS.support : VERDICT_CLASS.strain)} data-testid={`parashari-shadbala-verdict-${r.planet}`}>
            {r.strong ? "strong" : "weak"} · {(r.ratio * 100).toFixed(0)}%
          </span>
        </TableCell>
        <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell" data-testid={`parashari-ishta-${r.planet}`}>
          {ik ? <><span className={ik.tendency === "benefic" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>{ik.ishta.toFixed(0)}</span> / {ik.kashta.toFixed(0)}</> : "—"}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={11} className="px-3 py-3" data-testid={`parashari-shadbala-detail-${r.planet}`}>
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="font-medium text-foreground">Sthana bala {fmtV(r.sthana.total)}</p>
                <p>Uchcha {fmtV(r.sthana.uchcha)} <SourceLink source={src.uchcha} /></p>
                <p>Saptavargaja {r.sthana.saptavargaTotal} <SourceLink source={src.saptavarga} />: {r.sthana.saptavarga.map((v) => `${v.varga} ${v.lord === r.planet ? v.relation : `${v.lord}, ${v.relation}`} ${v.virupas}`).join("; ")}. <SourceLink source={src.relations} /></p>
                <p>Ojhayugma {r.sthana.ojhayugma} <SourceLink source={src.ojhayugma} /> · Kendradi {r.sthana.kendradi} <SourceLink source={src.kendradi} /> · Drekkana {r.sthana.drekkana} <SourceLink source={src.drekkana} /></p>
              </div>
              <div>
                <p className="font-medium text-foreground">Kala bala {fmtV(r.kala.total)}</p>
                <p>Nathonnatha {fmtV(r.kala.nathonnatha)} <SourceLink source={src.nathonnatha} /> · Paksha {fmtV(r.kala.paksha)} <SourceLink source={src.paksha} /> · Tribhaga {r.kala.tribhaga} <SourceLink source={src.tribhaga} /></p>
                <p>Year {r.kala.varsha}, month {r.kala.masa}, day {r.kala.dina}, hora {r.kala.hora} <SourceLink source={src.lords} /> · Ayana {fmtV(r.kala.ayana)} <SourceLink source={src.ayana} /></p>
                <p className="mt-1"><span className="font-medium text-foreground">Dig</span> {fmtV(r.dig)} <SourceLink source={src.dig} /> · <span className="font-medium text-foreground">Chesta</span> {fmtV(r.chesta)} <SourceLink source={r.planet === "Sun" || r.planet === "Moon" ? src.chestaLuminaries : src.chesta} /> · <span className="font-medium text-foreground">Naisargika</span> {fmtV(r.naisargika)} <SourceLink source={src.naisargika} /> · <span className="font-medium text-foreground">Drik</span> {fmtV(r.drik)} <SourceLink source={src.drik} />{r.yuddha !== 0 && <> · War {r.yuddha > 0 ? "+" : ""}{fmtV(r.yuddha)} <SourceLink source={src.yuddha} /></>}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Against the requirements</p>
                <p>Total {r.total.toFixed(0)} of {r.required} <SourceLink source={src.required} /></p>
                <p>{r.components.map((c) => `${c.name} ${c.value.toFixed(0)}/${c.required}${c.ok ? "" : " short"}`).join(" · ")} <SourceLink source={src.componentsRequired} /></p>
                <p>Effect for lord-in-house readings: {r.effect} <SourceLink source={src.effect} /></p>
                {ik && (
                  <>
                    <p className="mt-2 font-medium text-foreground">Ishta and Kashta (ch. 28)</p>
                    <p>Uchcha rasmi {ik.uchchaRasmi.toFixed(2)}, Chesta rasmi {ik.chestaRasmi.toFixed(2)} <SourceLink source={src.rasmi} /> · Subha {ik.subhaRasmi.toFixed(2)}, Asubha {ik.asubhaRasmi.toFixed(2)} <SourceLink source={src.subhaRasmi} /></p>
                    <p>Ishta phala {ik.ishta.toFixed(1)}, Kashta phala {ik.kashta.toFixed(1)}: {ik.tendency} tendency <SourceLink source={src.ishta} /></p>
                    <p>Saptavarga subhanka {ik.saptavargaSubha.toFixed(1)} / asubhanka {ik.saptavargaAsubha.toFixed(1)} <SourceLink source={src.subhanka} /> · Dig as effect {fmtV(ik.digSubha)} good, {fmtV(ik.digAsubha)} ill <SourceLink source={src.digSubha} /></p>
                    {varga && <p>Varga effect scaled by the Shadbala total: good {varga.subha.toFixed(1)}, ill {varga.asubha.toFixed(1)} <SourceLink source={{ label: "Parashara 28.13-14", url: BPHS_URL(28), provisional: true }} /></p>}
                  </>
                )}
                {r.notes.map((n, i) => <p key={i} className="mt-1">{n}</p>)}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Note({ n }: { n: DasaNote }) {
  return (
    <li className={cn("rounded-md border border-l-4 bg-card px-3 py-2", TONE_CLASS[n.tone])} data-testid={`parashari-dasa-note-${n.id}`}>
      <p className="text-sm text-muted-foreground">{n.text}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {LAYER_LABEL[n.layer]} · <SourceLink source={n.source} />
      </p>
    </li>
  );
}

function DasaEffects({ d, open, setOpen, birthIso, asOfIso }: { d: DasaReading; open: string | null; setOpen: (k: string | null) => void; birthIso: string; asOfIso: string }) {
  const layers: DasaNote["layer"][] = ["general", "strength", "ashtakavarga", "planet", "lordship", "relation"];
  const running = d.antars.find((a) => a.current);
  return (
    <div className="mt-8" data-testid="parashari-dasa-effects">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">
          <PlanetName planet={d.lord} /> dasa, {fmt(d.start)} to {fmt(d.end)}
        </h3>
        <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", VERDICT_CLASS[d.verdict])} data-testid="parashari-dasa-verdict">{VERDICT_LABEL[d.verdict]} on balance</span>
        {d.current && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Effects of the period from Brihat Parashara Hora Sastra ch. 47 (placement of the lord) and ch. 48 (house lordship and relationships), matched mechanically on whole-sign houses and dignity, with the lord's Shadbala (ch. 27) set against the requirement of 27.32-33, its Ishta and Kashta phala (ch. 28), and its transit house when the dasa begins (48.8). Every matched verse is listed, favourable and unfavourable alike, so contradictions stay visible.
      </p>
      <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground" data-testid="parashari-dasa-timing">
        {d.timing.text} <SourceLink source={d.timing.source} />
      </p>
      <ul className="mt-3 space-y-2">
        {layers.flatMap((l) => d.notes.filter((n) => n.layer === l)).map((n) => (
          <Note key={n.id} n={n} />
        ))}
      </ul>

      <h4 className="mt-6 text-sm font-semibold">Antar dasas in the {d.lord} dasa</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Each sub-lord is checked against the placements Parashara names for it in the {d.lord} dasa chapter: angles and trines from the lagna, dignity, the house it holds from the dasa lord, company, and 2nd/7th lordship (maraka). Open a row for the chapter's own wording.
      </p>
      <Table className="mt-2" data-testid="parashari-antars">
        <TableHeader>
          <TableRow>
            <TableHead>Antar</TableHead>
            <TableHead className="hidden sm:table-cell">Dates</TableHead>
            <TableHead>Verdict</TableHead>
            <TableHead className="hidden sm:table-cell">Placements matched</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.antars.map((a) => {
            const key = `${d.lord}-${a.lord}`;
            const isOpen = open === key;
            return (
              <AntarRows key={key} a={a} isOpen={isOpen} toggle={() => setOpen(isOpen ? null : key)} dasaLord={d.lord} />
            );
          })}
        </TableBody>
      </Table>

      {running?.pratyantars && (
        <div className="mt-6" data-testid="parashari-pratyantars">
          <h4 className="text-sm font-semibold">
            Pratyantar dasas in the running {d.lord}–{running.lord} antar
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            General effects only, from <SourceLink source={{ label: "Parashara 61.2-82", url: BPHS_URL(61) }} />. Verse 61.2 adds that the ill effects do not follow when the pratyantar lord is in a trine, owns or occupies an auspicious house, or is in a benefic varga; apply the same test to each line. Select a pratyantar to divide it further.
          </p>
          <FineLevels dasaLord={d.lord} antarLord={running.lord} pratyantars={running.pratyantars} birthIso={birthIso} asOfIso={asOfIso} />
        </div>
      )}
    </div>
  );
}

const fmtDT = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy HH:mm");

function FineRow({ p, testid, selected, onSelect, withTime }: { p: FinePeriod; testid: string; selected?: boolean; onSelect?: () => void; withTime: boolean }) {
  const inner = (
    <>
      <span className="w-16 shrink-0">
        <PlanetName planet={p.lord} abbr tone />
      </span>
      <span className={cn("shrink-0 text-xs text-muted-foreground whitespace-nowrap tabular-nums", withTime ? "sm:w-64" : "sm:w-44")}>
        {withTime ? `${fmtDT(p.start)} – ${fmtDT(p.end)}` : `${fmtD(p.start)} – ${fmtD(p.end)}`}
      </span>
      {p.current && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
      <span className="min-w-0 basis-full text-xs text-muted-foreground sm:basis-0 sm:flex-1">
        {p.text} <SourceLink source={p.source} />
      </span>
    </>
  );
  const cls = cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-1.5", p.current && "bg-primary/5", selected && "ring-1 ring-inset ring-primary/40");
  return (
    <li data-testid={testid} className={onSelect ? undefined : cls}>
      {onSelect ? (
        <button type="button" className={cn(cls, "w-full text-left")} onClick={onSelect} aria-pressed={selected}>
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  );
}

function FineLevels({ dasaLord, antarLord, pratyantars, birthIso, asOfIso }: { dasaLord: Planet; antarLord: Planet; pratyantars: NonNullable<AntarReading["pratyantars"]>; birthIso: string; asOfIso: string }) {
  const currentP = pratyantars.find((p) => p.current) ?? pratyantars[0];
  const [pSel, setPSel] = useState<string>(currentP.start);
  const pratyantar = pratyantars.find((p) => p.start === pSel) ?? currentP;
  const sookshmas = useMemo(() => finePeriodsOf([dasaLord, antarLord, pratyantar.lord], pratyantar.end, "sookshma", birthIso, asOfIso), [dasaLord, antarLord, pratyantar, birthIso, asOfIso]);
  const [sSel, setSSel] = useState<string | null>(null);
  const sookshma = sookshmas.find((s) => s.start === sSel) ?? sookshmas.find((s) => s.current) ?? sookshmas[0];
  const pranas = useMemo(() => (sookshma ? finePeriodsOf([dasaLord, antarLord, pratyantar.lord, sookshma.lord], sookshma.end, "prana", birthIso, asOfIso) : []), [dasaLord, antarLord, pratyantar, sookshma, birthIso, asOfIso]);
  return (
    <>
      <ul className="mt-2 divide-y rounded-md border text-sm">
        {pratyantars.map((p) => (
          <FineRow key={p.lord + p.start} p={p} testid={`parashari-pratyantar-${p.lord}`} selected={p.start === pratyantar.start} onSelect={() => { setPSel(p.start); setSSel(null); }} withTime={false} />
        ))}
      </ul>

      <h4 className="mt-6 text-sm font-semibold" data-testid="parashari-sookshmas-heading">
        Sookshma dasas in the {dasaLord}–{antarLord}–{pratyantar.lord} pratyantar
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Each sookshma is the pratyantar multiplied by its lord's dasa years over 120 <SourceLink source={{ label: "Parashara 62.1", url: BPHS_URL(62) }} />; the effects are the general ones of <SourceLink source={{ label: "Parashara 62.2-82", url: BPHS_URL(62) }} />, keyed by the pratyantar lord. Select a sookshma to divide it into pranas.
      </p>
      <ul className="mt-2 divide-y rounded-md border text-sm" data-testid="parashari-sookshmas">
        {sookshmas.map((s) => (
          <FineRow key={s.lord + s.start} p={s} testid={`parashari-sookshma-${s.lord}`} selected={sookshma && s.start === sookshma.start} onSelect={() => setSSel(s.start)} withTime={false} />
        ))}
      </ul>

      {sookshma && (
        <>
          <h4 className="mt-6 text-sm font-semibold" data-testid="parashari-pranas-heading">
            Prana dasas in the {sookshma.lord} sookshma, {fmtD(sookshma.start)} to {fmtD(sookshma.end)}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Each prana is the sookshma multiplied by its lord's dasa years over 120 <SourceLink source={{ label: "Parashara 63.1", url: BPHS_URL(63) }} />, effects from <SourceLink source={{ label: "Parashara 63.2-82", url: BPHS_URL(63) }} /> keyed by the sookshma lord. Times are shown in your device's time zone; Parashara closes by asking that dasa, antar, pratyantar, sookshma and prana all be weighed together before predicting <SourceLink source={{ label: "Parashara 63.83", url: BPHS_URL(63) }} />.
          </p>
          <ul className="mt-2 divide-y rounded-md border text-sm" data-testid="parashari-pranas">
            {pranas.map((p) => (
              <FineRow key={p.lord + p.start} p={p} testid={`parashari-prana-${p.lord}`} withTime />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Facts({ a }: { a: AntarReading }) {
  return (
    <>
      {a.facts.favourable.length > 0 && <span className="text-emerald-700 dark:text-emerald-300">{a.facts.favourable.join("; ")}</span>}
      {a.facts.favourable.length > 0 && (a.facts.adverse.length > 0 || a.facts.maraka) && <span> · </span>}
      {a.facts.adverse.length > 0 && <span className="text-rose-700 dark:text-rose-300">{a.facts.adverse.join("; ")}</span>}
      {a.facts.adverse.length > 0 && a.facts.maraka && <span> · </span>}
      {a.facts.maraka && <span className="text-rose-700 dark:text-rose-300">{a.facts.maraka}</span>}
      {!a.facts.favourable.length && !a.facts.adverse.length && !a.facts.maraka && <span>none of the named placements</span>}
    </>
  );
}

function AntarRows({ a, isOpen, toggle, dasaLord }: { a: AntarReading; isOpen: boolean; toggle: () => void; dasaLord: string }) {
  const e = a.entry;
  return (
    <>
      <TableRow className={cn("cursor-pointer", a.current && "bg-primary/5", a.past && !a.current && "text-muted-foreground/80")} onClick={toggle} data-testid={`parashari-antar-${dasaLord}-${a.lord}`} aria-expanded={isOpen}>
        <TableCell className="py-1.5 whitespace-nowrap">
          <PlanetName planet={a.lord} />
          {a.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
        </TableCell>
        <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell whitespace-nowrap">{fmt(a.start)} – {fmt(a.end)}</TableCell>
        <TableCell className="py-1.5">
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", VERDICT_CLASS[a.verdict])}>{VERDICT_LABEL[a.verdict]}</span>
        </TableCell>
        <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell">
          <Facts a={a} />
        </TableCell>
      </TableRow>
      <TableRow className="sm:hidden" onClick={toggle}>
        <TableCell colSpan={4} className="px-3 pb-2 pt-0 text-xs text-muted-foreground">
          <span className="mr-2">{fmt(a.start)} – {fmt(a.end)}.</span>
          <Facts a={a} />
        </TableCell>
      </TableRow>
      {isOpen && e && (
        <TableRow className="bg-muted/30 hover:bg-muted/30" data-testid={`parashari-antar-text-${dasaLord}-${a.lord}`}>
          <TableCell colSpan={4} className="px-3 py-3">
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className={cn("rounded-md border border-l-4 bg-card p-3", TONE_CLASS.support)}>
                <p className="font-medium">When favourable</p>
                <p className="mt-1 text-muted-foreground">Conditions: {e.favourable.conditions}</p>
                <p className="mt-1 text-muted-foreground">{e.favourable.effects}</p>
              </div>
              <div className={cn("rounded-md border border-l-4 bg-card p-3", TONE_CLASS.strain)}>
                <p className="font-medium">When adverse</p>
                <p className="mt-1 text-muted-foreground">Conditions: {e.adverse.conditions}</p>
                <p className="mt-1 text-muted-foreground">{e.adverse.effects}</p>
              </div>
            </div>
            <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
              {e.maraka && (<><dt className="font-medium">Maraka</dt><dd className="text-muted-foreground">{e.maraka}</dd></>)}
              {e.phases && (<><dt className="font-medium">Course</dt><dd className="text-muted-foreground">{e.phases}</dd></>)}
              {e.remedy && (<><dt className="font-medium">Remedy named</dt><dd className="text-muted-foreground">{e.remedy}</dd></>)}
            </dl>
            <p className="mt-2 text-[11px] text-muted-foreground">
              <SourceLink source={a.source} /> · paraphrased from the Santhanam translation
            </p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}


const BAND_CLASS: Record<AshtakavargaResult["band"][number], string> = { favourable: VERDICT_CLASS.support, medium: VERDICT_CLASS.mixed, adverse: VERDICT_CLASS.strain };
const OWNER_ABBR = (o: Bhinnashtaka["owner"]) => (o === "Lagna" ? "La" : PLANET_ABBR[o]);

function AshtakavargaSection({ av, lagnaIdx }: { av: AshtakavargaResult; lagnaIdx: number }) {
  const [pick, setPick] = useState<Bhinnashtaka["owner"] | null>(null);
  const [caveats, setCaveats] = useState(false);
  const chart = pick ? av.charts.find((c) => c.owner === pick) : undefined;
  const src = av.sources;
  return (
    <div className="mt-8" data-testid="parashari-ashtakavarga">
      <h3 className="text-sm font-semibold">Ashtakavarga</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Benefic marks (rekhas) that each of the seven planets and the lagna give to every sign in the chart of each planet, <SourceLink source={src.rekhas} />, summed into the Sarvashtakavarga of <SourceLink source={src.sarva} />: above 30 favourable, 25 to 30 medium, below 25 adverse <SourceLink source={src.bands} />. Rows are the houses from the lagna; pick a planet's column for its reductions and pindas (ch. 67-69).
      </p>
      <Table className="mt-2" data-testid="parashari-sarva">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 sm:px-4">House</TableHead>
            <TableHead className="px-2 sm:px-4">Sign</TableHead>
            {av.charts.map((c) => (
              <TableHead key={c.owner} className={cn("hidden text-right md:table-cell", c.owner === "Lagna" && "text-muted-foreground")}>
                <button className={cn("underline-offset-2 hover:underline", pick === c.owner && "text-primary underline")} onClick={() => setPick(pick === c.owner ? null : c.owner)} data-testid={`parashari-av-pick-${c.owner}`}>{OWNER_ABBR(c.owner)}</button>
              </TableHead>
            ))}
            <TableHead className="px-2 text-right sm:px-4">Total</TableHead>
            <TableHead className="px-2 sm:px-4">Band</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {av.houses.map((h) => (
            <TableRow key={h.house} data-testid={`parashari-sarva-${h.house}`}>
              <TableCell className="px-2 py-1.5 sm:px-4">{h.house}</TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4"><SignName signIndex={h.signIndex} /></TableCell>
              {av.charts.map((c) => (
                <TableCell key={c.owner} className={cn("hidden py-1.5 text-right tabular-nums md:table-cell", c.owner === "Lagna" && "text-muted-foreground", pick === c.owner && "bg-primary/5 font-medium")}>{c.rekhas[h.signIndex]}</TableCell>
              ))}
              <TableCell className="px-2 py-1.5 sm:px-4 text-right font-medium tabular-nums">{h.rekhas}</TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4"><span className={cn("whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium", BAND_CLASS[h.band])}>{h.band}</span></TableCell>
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent">
            <TableCell className="px-2 py-1.5 sm:px-4 text-xs text-muted-foreground" colSpan={2}>Rekhas in each chart</TableCell>
            {av.charts.map((c) => <TableCell key={c.owner} className="hidden px-2 py-1.5 sm:px-4 text-right text-xs tabular-nums text-muted-foreground md:table-cell">{c.total}</TableCell>)}
            <TableCell className="px-2 py-1.5 sm:px-4 text-right text-xs tabular-nums text-muted-foreground">{av.sarva.reduce((a, b) => a + b, 0)}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-1 text-[11px] text-muted-foreground">The total leaves out the lagna's chart, which the text keeps apart; the seven planets give 337 rekhas in all.</p>

      <div className="mt-3 flex flex-wrap gap-1 md:hidden">
        {av.charts.map((c) => (
          <button key={c.owner} className={cn("rounded border px-2 py-0.5 text-xs", pick === c.owner ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setPick(pick === c.owner ? null : c.owner)} data-testid={`parashari-av-pick-sm-${c.owner}`}>{c.owner}</button>
        ))}
      </div>
      {chart && (
        <div className="mt-3 rounded-md border bg-muted/30 p-3 text-xs" data-testid={`parashari-av-detail-${chart.owner}`}>
          <p className="font-medium">{chart.owner}'s Ashtakavarga: {chart.total} rekhas</p>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 text-xs sm:px-4">Sign</TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4">Rekhas</TableHead>
                <TableHead className="hidden text-xs sm:table-cell">Given by</TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4"><span className="sm:hidden">Trik.</span><span className="hidden sm:inline">Trikona</span></TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4"><span className="sm:hidden">Ekad.</span><span className="hidden sm:inline">Ekadhipatya</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 12 }, (_, i) => (lagnaIdx + i) % 12).map((s) => (
                <TableRow key={s}>
                  <TableCell className="py-1"><SignName signIndex={s} /></TableCell>
                  <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums">{chart.rekhas[s]}</TableCell>
                  <TableCell className="hidden px-2 py-1 sm:px-4 text-muted-foreground sm:table-cell">{chart.givers[s].map(OWNER_ABBR).join(" ") || "—"}</TableCell>
                  <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums">{chart.trikona[s]}</TableCell>
                  <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums font-medium">{chart.reduced[s]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-muted-foreground">
            Trikona shodhana <SourceLink source={src.trikona} /> · Ekadhipatya shodhana <SourceLink source={src.ekadhipatya} /> · Rasi pinda {chart.rashiPinda}, Graha pinda {chart.grahaPinda}, Yoga pinda {chart.yogaPinda} <SourceLink source={src.pinda} />{chart.owner !== "Lagna" && <> · Signifies {SIGNIFICATION_TEXT[chart.owner]} <SourceLink source={src.significations} /></>}
          </p>
        </div>
      )}

      <h4 className="mt-6 text-sm font-semibold">Saturn's transit points (ch. 70)</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        For each matter Parashara multiplies the rekhas of the house named by the owner's Yoga pinda; the remainder by 27 marks the nakshatra and by 12 the sign whose transit by Saturn, or by its trines, brings distress in that matter, <SourceLink source={{ label: "Parashara 70.7-44", url: BPHS_URL(70) }} />.
      </p>
      <Table className="mt-2" data-testid="parashari-av-saturn">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 sm:px-4">Matter</TableHead>
            <TableHead className="hidden sm:table-cell">House read</TableHead>
            <TableHead className="px-2 sm:px-4">Nakshatra</TableHead>
            <TableHead className="px-2 sm:px-4">Sign</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {av.saturnPoints.map((s) => (
            <TableRow key={s.matter} data-testid={`parashari-av-saturn-${s.owner}`}>
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">{s.matter} <SourceLink source={s.source} /></TableCell>
              <TableCell className="hidden px-2 py-1.5 sm:px-4 text-xs text-muted-foreground sm:table-cell">{ord(s.houseFrom)} from {s.owner}: {SIGNS[s.signIndex]}, {s.rekhas} rekhas × pinda {s.rekhas ? s.product / s.rekhas : "—"}</TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">{NAKSHATRAS[s.nakshatraIndex]}<span className="block text-[10px] text-muted-foreground">trines {s.trineNakshatras.slice(1).map((n) => NAKSHATRAS[n]).join(", ")}</span></TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">{SIGNS[s.transitSignIndex]}<span className="block text-[10px] text-muted-foreground">trines {s.trineSigns.slice(1).map((n) => SIGNS[n]).join(", ")}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h4 className="mt-6 text-sm font-semibold">Readings from the aggregate (ch. 70-72)</h4>
      <ul className="mt-1 space-y-1 text-xs text-muted-foreground" data-testid="parashari-av-readings">
        <li>{av.wealthYoga.text} <SourceLink source={src.wealth} /></li>
        <li>
          Life in thirds: {av.lifeThirds.map((t) => `${t.span} (${t.houses}) ${t.verdict}${t.benefics.length || t.malefics.length ? ` with ${[...t.benefics, ...t.malefics].map((p) => PLANET_ABBR[p]).join(", ")}` : ", no planets"}`).join("; ")}. <SourceLink source={src.thirds} />
        </li>
        <li>
          Years of distress by Saturn's rekhas: {av.distressYears.lagnaToSaturn} (lagna to Saturn) and {av.distressYears.saturnToLagna} (Saturn to lagna); their sum {av.distressYears.lagnaToSaturn + av.distressYears.saturnToLagna} is the year to watch if an arishta dasa also runs. <SourceLink source={src.longevityYears} />
        </li>
        <li>Longevity by the rekha table, half the eight charts' spans: {av.ayurdaya.toFixed(1)} years. <SourceLink source={src.ayus} /></li>
        <li>Saturn's transit through signs with more rekhas in its own chart is favourable, through signs with more dots only evil ({av.charts.find((c) => c.owner === "Saturn")!.rekhas.map((r, i) => (r >= 5 ? SIGNS[i] : null)).filter(Boolean).join(", ") || "no sign reaches five rekhas"} carry five or more). <SourceLink source={{ label: "Parashara 70.43-44", url: BPHS_URL(70) }} /></li>
      </ul>
      <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((v) => !v)} data-testid="parashari-av-caveats">
        {caveats ? "Hide" : "Show"} how the chapters were applied ({av.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground" data-testid="parashari-av-caveat-list">
          {av.caveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      )}
    </div>
  );
}

const SIGNIFICATION_TEXT: Record<string, string> = {
  Sun: "soul, nature, physical strength, joys and sorrows, father",
  Moon: "mind, wisdom, joy, mother",
  Mars: "co-borns, strength, qualities, land",
  Mercury: "business dealings, livelihood, friends",
  Jupiter: "nourishment of the body, learning, children, wealth and property",
  Venus: "marriage, enjoyments, conveyance, relations with women",
  Saturn: "longevity, source of maintenance, grief, danger, losses, death",
};
