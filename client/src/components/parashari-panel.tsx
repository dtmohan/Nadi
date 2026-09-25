import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, SIGNS } from "@shared/astro";
import { computeParashari, ord, listH, roleLabel, LORDSHIP_LABEL, KENDRA, type ParashariFinding } from "@shared/parashari";
import { LAGNA_NATURE, BPHS_URL } from "@shared/parashari-data";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { PlanetName, SignName, planetColor } from "@/components/planet-name";
import { DasaBar } from "@/components/dasa-bar";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

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
        <SourceLink source={f.source} />
      </p>
    </div>
  );
}

export function ParashariPanel({ result }: { result: ChartResult }) {
  const { positions, chart } = result;
  const asOfIso = result.now.asOf;
  const r = useMemo(() => computeParashari(positions, result.jaimini.lagna.lon, result.utc, asOfIso), [positions, result.jaimini.lagna.lon, result.utc, asOfIso]);
  const [focusHouse, setFocusHouse] = useState<number | null>(null);
  const [section, setSection] = useState<"lords" | "yogas">("yogas");

  const nature = LAGNA_NATURE[r.lagna.signIndex];
  const lords = r.findings.filter((f) => f.kind === "lord");
  const yogas = r.findings.filter((f) => f.kind !== "lord");
  const shownLords = focusHouse ? lords.filter((f) => f.id === `pa-lord-${focusHouse}-${r.bhavas[focusHouse - 1].lordIn}` || f.id.endsWith(`-${focusHouse}`)) : lords;
  const focusBhava = focusHouse ? r.bhavas[focusHouse - 1] : null;
  const cur = r.dashas.find((d) => d.current);
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
          Functional roles as Parashara states them for this rising sign, <SourceLink source={{ label: `Parashara ${nature.verses}`, url: BPHS_URL(34) }} />. {nature.note}
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
              Parashara qualifies all of these by the lord's strength: full effect when strong, half when middling, a quarter when weak; where a planet owns two houses and the results contradict, they cancel, <SourceLink source={{ label: "Parashara 24.145-148", url: BPHS_URL(24) }} />. Strength (shadbala) is not yet computed here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold">Vimshottari dasa, read by lordship</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Same Vimshottari sequence as the KP panel but from the Lahiri Moon ({positions.find((p) => p.planet === "Moon")?.nakshatra}), balance {r.vimshottari.balanceYears.toFixed(2)} years of {r.vimshottari.dasas[0].lord}. Each lord is glossed by the houses it owns and occupies and by its role for this rising sign; the period effects proper (BPHS ch. 46-64) are the next harvest.
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
              <TableRow key={d.lord + d.start} className={cn(d.current && "bg-primary/5")} data-testid={`parashari-dasa-${d.lord}`}>
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
    </div>
  );
}

