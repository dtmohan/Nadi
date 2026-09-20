import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { NAKSHATRAS, PLANET_ABBR, SIGNS, fmtDegShort } from "@shared/astro";
import { DEFAULT_ALP_CONFIG, computeAlp, type AlpConfig, type AlpPeriod } from "@shared/alp";
import { ALP_CHAPTERS, ALP_RULES, ALP_SOURCE_SITE } from "@shared/rules-alp";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { Working } from "@/components/working";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}
const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const fmtMonth = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

function PeriodRow({ p, planets, cols }: { p: AlpPeriod; planets: string; cols: "sign" | "pada" }) {
  return (
    <TableRow className={cn(p.current && "bg-primary/5")} data-testid={cols === "sign" ? `row-alp-sign-${p.signIndex}` : `row-alp-pada-${p.padaInSign}`}>
      <TableCell className="py-2 font-medium">
        {cols === "sign" ? p.sign : `${p.padaInSign} · ${p.nakshatraIndex !== undefined ? NAKSHATRAS[p.nakshatraIndex] : ""} ${p.pada ?? ""}`}
        {p.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
      </TableCell>
      {cols === "pada" && <TableCell className="hidden py-2 sm:table-cell">{p.navamsaSign !== undefined ? SIGNS[p.navamsaSign] : ""}</TableCell>}
      <TableCell className="py-2 text-right">
        {p.ageStart.toFixed(1)}–{p.ageEnd.toFixed(1)}
      </TableCell>
      <TableCell className="py-2 text-muted-foreground">
        {cols === "sign" ? `${fmtMonth(p.start)} – ${fmtMonth(p.end)}` : `${fmt(p.start)} – ${fmt(p.end)}`}
      </TableCell>
      {cols === "sign" && <TableCell className="hidden py-2 sm:table-cell">{p.lord}</TableCell>}
      {cols === "sign" && <TableCell className="hidden py-2 text-muted-foreground md:table-cell">{planets || "—"}</TableCell>}
    </TableRow>
  );
}

export function AlpPanel({ result }: { result: ChartResult }) {
  const { chart, positions } = result;
  const [asOf, setAsOf] = useState(() => DateTime.local().toISODate()!);
  const [config, setConfig] = useState<AlpConfig>(DEFAULT_ALP_CONFIG);
  const a = useMemo(() => {
    const iso = DateTime.fromISO(asOf, { zone: chart.timezone }).isValid ? DateTime.fromISO(asOf, { zone: chart.timezone }).toISO()! : DateTime.local().toISO()!;
    return computeAlp(positions, result.jaimini.lagna.lon, result.utc, iso, config);
  }, [asOf, config, positions, result.jaimini.lagna.lon, result.utc, chart.timezone]);

  const alpLord = a.point.lord;
  const badges: Record<number, string[]> = {};
  badges[a.point.signIndex] = ["ALP"];
  badges[a.natalLagna.signIndex] = [...(badges[a.natalLagna.signIndex] ?? []), "Janma"];
  badges[a.point.navamsaSign] = [...(badges[a.point.navamsaSign] ?? []), "Activated"];
  const planetsIn = (sign: number) => positions.filter((p) => p.signIndex === sign).map((p) => PLANET_ABBR[p.planet]).join(" ");
  const pendingChapters = ALP_CHAPTERS.filter((c) => !ALP_RULES.some((r) => r.chapter === c.id));
  const roleLine = (role: string) => a.placements.find((p) => p.role === role)!;
  const lordP = roleLine("ALP lagna lord");
  const janmaP = roleLine("Janma lagna lord");
  const nakP = roleLine("Lord of the ALP nakshatra");
  const navP = roleLine("Lord of the activated navamsa sign");
  const activatedHouse = ((a.point.navamsaSign - a.point.signIndex + 12) % 12) + 1;

  return (
    <div data-testid="alp-panel">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="outline" className="no-default-hover-elevate tabular">
          <Term k="lagna">Janma lagna</Term>&nbsp;{a.natalLagna.sign} {fmtDegShort(a.natalLagna.lon)}
        </Badge>
        <Badge variant="secondary" className="no-default-hover-elevate tabular" data-testid="text-alp-lagna">
          <Term k="alp-lagna">ALP lagna</Term>&nbsp;{a.point.sign} {fmtDegShort(a.point.lon)}
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-alp-pada">
          {a.point.nakshatra}&nbsp;<Term k="alp-pada">pada</Term>&nbsp;{a.point.pada}&nbsp;·&nbsp;{a.point.padaInSign}/9&nbsp;in&nbsp;sign
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate">
          Activates {SIGNS[a.point.navamsaSign]} ({ordinal(activatedHouse)})
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate tabular">
          Age {a.ageYears.toFixed(1)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          As of
          <Input type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} className="h-7 w-40 text-xs" data-testid="input-alp-asof" />
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAsOf(DateTime.local().toISODate()!)} data-testid="button-alp-today">
            Today
          </Button>
        </label>
        <div role="radiogroup" aria-label="Progression start" className="inline-flex rounded-md border p-0.5">
          {(["degree", "sign"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={config.start === s}
              onClick={() => setConfig({ ...config, start: s })}
              className={cn("rounded px-2 py-0.5", config.start === s ? "bg-foreground text-background" : "hover:text-foreground")}
              data-testid={`alp-start-${s}`}
              title={s === "degree" ? "Count from the exact lagna degree; the birth sign is lived through only for its remaining arc." : "Count from the start of the lagna sign; every sign gets the full ten years."}
            >
              {s === "degree" ? "From lagna degree" : "From sign start"}
            </button>
          ))}
        </div>
        <span>
          Next pada {a.nextPadaChange ? fmt(a.nextPadaChange) : "—"} · next sign {a.nextSignChange ? fmt(a.nextSignChange) : "—"}
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <SouthIndianChart
            positions={positions}
            title={chart.name}
            subtitle={`Natal planets from the ALP lagna · ${a.point.sign}`}
            lagnaSign={a.point.signIndex}
            badges={badges}
            accent={[alpLord]}
            footer="Rasi · houses from the ALP lagna"
            highlightSign={a.point.signIndex}
            secondarySigns={[a.point.navamsaSign]}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Numbers are houses from the ALP lagna; the janma lagna is marked for reference. The ALP lagna lord ({PLANET_ABBR[alpLord]}) is drawn in the accent; the tinted sign is the one the current pada activates.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Where the decade stands</h2>
          <ul className="mt-3 space-y-2 text-sm" data-testid="list-alp-placements">
            <li>
              The ALP lagna has reached <span className="font-medium">{a.point.sign}</span>, the {ordinal(a.houseFromJanma)} from the janma lagna, for ages {a.signPeriods.find((p) => p.current)?.ageStart.toFixed(1)}–{a.signPeriods.find((p) => p.current)?.ageEnd.toFixed(1)}.
            </li>
            <li>
              Its lord <span className="font-medium">{lordP.planet}</span> sits in {SIGNS[lordP.signIndex]}: the {ordinal(lordP.houseFromAlp)} from the ALP lagna, the {ordinal(lordP.houseFromJanma)} natally.
            </li>
            <li>
              The janma lagna lord <span className="font-medium">{janmaP.planet}</span> falls in the {ordinal(janmaP.houseFromAlp)} from the ALP lagna.
            </li>
            <li>
              The lagna is in {a.point.nakshatra}, pada {a.point.pada}; its lord <span className="font-medium">{nakP.planet}</span> is in the {ordinal(nakP.houseFromAlp)} from the ALP lagna.
            </li>
            <li>
              The pada's navamsa sign is {SIGNS[a.point.navamsaSign]}, the {ordinal(activatedHouse)} from the ALP lagna; its lord <span className="font-medium">{navP.planet}</span> is in the {ordinal(navP.houseFromAlp)}.
            </li>
          </ul>

          <Working id="alp-houses" label="Show the houses from the ALP lagna" className="mt-4">
            <Table className="tabular">
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Sign</TableHead>
                  <TableHead>Lord</TableHead>
                  <TableHead>Planets</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Natal house</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {a.houses.map((h) => (
                  <TableRow key={h.house} data-testid={`row-alp-house-${h.house}`}>
                    <TableCell className="py-1.5 font-medium">{h.house}</TableCell>
                    <TableCell className="py-1.5">{h.sign}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">{h.lord}</TableCell>
                    <TableCell className="py-1.5">{h.planets.map((p) => PLANET_ABBR[p]).join(" ") || "—"}</TableCell>
                    <TableCell className="hidden py-1.5 text-right text-muted-foreground sm:table-cell">{h.houseFromJanma}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Working>
        </div>
      </div>

      <section className="mt-10" data-testid="section-alp-findings">
        <h2 className="text-base font-semibold">Reading</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ALP_RULES.length} starting rules, taken from the published material. The book chapters are entered one at a time; until then this is a framework, not a reading.
        </p>
        {a.findings.length ? (
          <ul className="mt-3 space-y-3">
            {a.findings.map((f) => (
              <li key={f.ruleId} className="flex gap-3 text-sm" data-testid={`alp-finding-${f.ruleId}`}>
                <span className="mt-1.5 flex shrink-0 gap-0.5" aria-label={`weight ${f.weight}`}>
                  {[1, 2, 3].map((i) => (
                    <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= f.weight ? "bg-foreground" : "bg-muted-foreground/30")} />
                  ))}
                </span>
                <span>
                  {f.text}{" "}
                  {f.sourceUrl ? (
                    <a href={f.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
                      {f.source}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{f.source}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground" data-testid="text-alp-empty">
            None of the starting rules fire for this placement. The placements above are what a rule from the books would be written against.
          </p>
        )}
        {pendingChapters.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Pending chapters: {pendingChapters.map((c) => `${c.book} · ${c.title}`).join("; ")}.
          </p>
        )}
      </section>

      <section className="mt-10" data-testid="section-alp-timeline">
        <h2 className="text-base font-semibold">The lagna through the signs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.yearsPerSign} years per sign, {config.start === "degree" ? "counted from the natal lagna degree, so the birth sign gets only its remaining arc" : "counted from the start of the natal lagna sign"}.
        </p>
        <Table className="tabular mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Sign</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="hidden sm:table-cell">Lord</TableHead>
              <TableHead className="hidden md:table-cell">Natal planets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {a.signPeriods.map((p, i) => (
              <PeriodRow key={`${p.signIndex}-${i}`} p={p} planets={planetsIn(p.signIndex)} cols="sign" />
            ))}
          </TableBody>
        </Table>

        <Working id="alp-padas" label={`Show the nine padas of ${a.point.sign}`} count={a.padaPeriods.length} className="mt-4">
          <Table className="tabular">
            <TableHeader>
              <TableRow>
                <TableHead>Pada in sign</TableHead>
                <TableHead className="hidden sm:table-cell">Activates</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.padaPeriods.map((p) => (
                <PeriodRow key={p.padaInSign} p={p} planets="" cols="pada" />
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">One pada is ten-ninths of a year, about 1 year 1 month 10 days. "Activates" is the navamsa sign of the pada.</p>
        </Working>
      </section>

      <section className="mt-10" data-testid="section-alp-method">
        <h2 className="text-base font-semibold">Method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Akshaya Lagna Paddhati moves the ascendant forward with age, ten years to a sign and one nakshatra pada in 1 year 1 month 10 days, so that the whole zodiac is covered in 120 years, and reads the natal planets from the moved lagna. The natal chart, the Vimshottari dasha and transits stay as they are; only the reference point moves.{" "}
          <a href={ALP_SOURCE_SITE} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
            alpastrology.org
          </a>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Open points to settle from the books: whether the count starts from the lagna degree or the sign start; whether the year is solar (365.25 days, used here) or savana (360 days); how the nine padas of a sign are assigned to planets; how the moving rasi (ARP) is derived.</li>
          <li>Kept separate from the Nadi and Jaimini readings; nothing here feeds them.</li>
        </ul>
      </section>
    </div>
  );
}
