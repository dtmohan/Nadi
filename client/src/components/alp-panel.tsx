import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { NAKSHATRAS, PLANET_ABBR, SIGNS, fmtDegShort, type Planet } from "@shared/astro";

const NAK_ARC = 360 / 27;
import { DEFAULT_ALP_CONFIG, computeAlp, type AlpConfig, type AlpPeriod } from "@shared/alp";
import { ALP_CHAPTERS, ALP_RULES, ALP_SOURCE_MAGAZINE_2, ALP_SOURCE_SITE, KARMA_BHAVAS, KARMA_REMEDY_NOTE, TWO_PLANET_NOTE, ARP_NOTE, ARP_QUESTIONS_NOTE, ALP_TEN_FEATURES, ALP_HOUSE_THEMES, DUSTHANA_NOTE, alpSignReading, threeWaysFor, threeWaysCount, threeWaysText, THREE_WAYS_NOTE, ALP_PLANET_THEMES } from "@shared/rules-alp";
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
      {cols === "pada" && <TableCell className="py-2">{p.nakshatraLord}</TableCell>}
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

function fmtLon360(lon: number): string {
  const l = ((lon % 360) + 360) % 360;
  const d = Math.floor(l);
  const m = Math.round((l - d) * 60);
  return m === 60 ? `${d + 1}°00'` : `${d}°${String(m).padStart(2, "0")}'`;
}

export function AlpPanel({ result }: { result: ChartResult }) {
  const { chart, positions } = result;
  const [asOf, setAsOf] = useState(() => DateTime.local().toISODate()!);
  const config: AlpConfig = DEFAULT_ALP_CONFIG;
  const a = useMemo(() => {
    const iso = DateTime.fromISO(asOf, { zone: chart.timezone }).isValid ? DateTime.fromISO(asOf, { zone: chart.timezone }).toISO()! : DateTime.local().toISO()!;
    return computeAlp(positions, result.jaimini.lagna.lon, result.utc, iso, config);
  }, [asOf, positions, result.jaimini.lagna.lon, result.utc, chart.timezone]);

  const alpLord = a.point.lord;
  const badges: Record<number, string[]> = {};
  badges[a.point.signIndex] = ["ALP"];
  badges[a.natalLagna.signIndex] = [...(badges[a.natalLagna.signIndex] ?? []), "Janma"];
  badges[a.point.navamsaSign] = [...(badges[a.point.navamsaSign] ?? []), "Activated"];
  badges[a.arp.point.signIndex] = [...(badges[a.arp.point.signIndex] ?? []), "AR"];
  const arp = a.arp;
  const arpLordSame = arp.point.lord === a.point.lord;
  const threeWaysJanma = useMemo(() => threeWaysFor(a.natalLagna, a.natalLagna.signIndex, positions), [a.natalLagna, positions]);
  const threeWaysAlp = useMemo(() => threeWaysFor(a.point, a.point.signIndex, positions), [a.point, positions]);
  const signReading = useMemo(() => alpSignReading(a.point.signIndex, a.point.sign), [a.point.signIndex, a.point.sign]);
  const nakLordHouse = a.placements.find((p) => p.planet === a.point.nakshatraLord)?.houseFromAlp ?? 0;
  const planetsIn = (sign: number) => positions.filter((p) => p.signIndex === sign).map((p) => PLANET_ABBR[p.planet]).join(" ");
  const pendingChapters = ALP_CHAPTERS.filter((c) => !ALP_RULES.some((r) => r.chapter === c.id));
  const roleLine = (role: string) => a.placements.find((p) => p.role === role)!;
  const lordP = roleLine("ALP lagna lord");
  const janmaP = roleLine("Janma lagna lord");
  const nakP = roleLine("Lord of the ALP nakshatra");
  const navP = roleLine("Lord of the activated navamsa sign");
  const activatedHouse = ((a.point.navamsaSign - a.point.signIndex + 12) % 12) + 1;
  const curNak = a.nakshatraPeriods.find((n) => n.current);
  const nextNak = curNak ? a.nakshatraPeriods[a.nakshatraPeriods.indexOf(curNak) + 1] : undefined;
  const houseOf = (planet: Planet) => {
    const p = positions.find((x) => x.planet === planet);
    return p ? ((p.signIndex - a.point.signIndex + 12) % 12) + 1 : undefined;
  };
  const nakSigns = (k: number) => {
    const lo = Math.floor((k * NAK_ARC) / 30) % 12;
    const hi = Math.floor(((k + 1) * NAK_ARC - 1e-6) / 30) % 12;
    return lo === hi ? SIGNS[lo] : `${SIGNS[lo]} / ${SIGNS[hi]}`;
  };

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
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-alp-nak-lord">
          Nakshatra&nbsp;lord&nbsp;{a.point.nakshatraLord}&nbsp;·&nbsp;{ordinal(nakP.houseFromAlp)}
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate">
          Activates {SIGNS[a.point.navamsaSign]} ({ordinal(activatedHouse)})
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate tabular">
          Age {a.ageYears.toFixed(1)}
        </Badge>
        <Badge variant="secondary" className="no-default-hover-elevate" data-testid="text-alp-arp">
          <Term k="akshaya-rasi">Akshaya rasi</Term>&nbsp;{arp.point.sign}&nbsp;·&nbsp;{arp.point.nakshatra}&nbsp;{arp.point.pada}
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-alp-dasa">
          Dasa&nbsp;{arp.dasa.lord}&nbsp;·&nbsp;bhukti&nbsp;{arp.bhukti.lord}
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
        <span>
          Next pada {a.nextPadaChange ? fmt(a.nextPadaChange) : "—"} · next nakshatra {a.nextNakshatraChange ? fmt(a.nextNakshatraChange) : "—"} · next sign {a.nextSignChange ? fmt(a.nextSignChange) : "—"}
        </span>
        <span data-testid="text-alp-arp-next">
          Akshaya rasi: next pada {arp.nextPadaChange ? fmt(arp.nextPadaChange) : "—"} · bhukti ends {fmt(arp.bhukti.end)} · dasa ends {fmt(arp.dasa.end)}
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
            Numbers are houses from the ALP lagna; the janma lagna is marked for reference. The ALP lagna lord ({PLANET_ABBR[alpLord]}) is drawn in the accent; the tinted sign is the one the current pada activates; AR marks the Akshaya rasi.
          </p>

          <h2 className="mt-6 text-base font-semibold">Where the mind stands</h2>
          <ul className="mt-3 space-y-2 text-sm" data-testid="list-alp-arp">
            <li>
              The Moon was born in <span className="font-medium">{arp.natalMoon.nakshatra}</span> ({arp.natalMoon.sign}). Shifting one nakshatra with each Vimshottari dasa it has reached <span className="font-medium">{arp.point.nakshatra}</span> pada {arp.point.pada}, so the Akshaya rasi is <span className="font-medium">{arp.point.sign}</span>: the {ordinal(arp.houseFromAlp)} from the ALP lagna, the {ordinal(arp.houseFromJanma)} natally.
            </li>
            <li>
              The running dasa is <span className="font-medium">{arp.dasa.lord}</span> (ages {arp.dasa.ageStart.toFixed(1)}–{arp.dasa.ageEnd.toFixed(1)}), bhukti <span className="font-medium">{arp.bhukti.lord}</span> until {fmt(arp.bhukti.end)}. The dasa lord sits in {SIGNS[arp.dasaLord.signIndex]}, the {ordinal(arp.dasaLord.houseFromArp)} from the Akshaya rasi: the condition of the mind is read from there. The bhukti lord is the {ordinal(arp.bhuktiLord.houseFromDasaLord)} from the dasa lord.
            </li>
            <li>
              {arpLordSame ? (
                <>
                  <span className="font-medium">{a.point.lord}</span> rules both the ALP lagna and the Akshaya rasi: body and mind answer to one planet, placed in the {ordinal(arp.arpLord.houseFromAlp)} from the ALP lagna.
                </>
              ) : (
                <>
                  The Akshaya rasi lord <span className="font-medium">{arp.point.lord}</span> is in {SIGNS[arp.arpLord.signIndex]}, the {ordinal(arp.arpLord.houseFromAlpLord)} from the ALP lagna lord {a.point.lord}; the dasa lord is the {ordinal(arp.nakLordsMutual)} from the ALP nakshatra lord {a.point.nakshatraLord}.
                </>
              )}{" "}
              The pada's navamsa is {SIGNS[arp.point.navamsaSign ?? 0]}, the subtle point of the mind.
            </li>
            <li data-testid="text-alp-questions">
              Questions to expect: the ALP nakshatra lord <span className="font-medium">{a.point.nakshatraLord}</span> stands in the {ordinal(nakLordHouse)} from the ALP lagna, so that house's matters are asked about first; the dasa lord {arp.dasa.lord} is in the {ordinal(arp.dasaLord.houseFromAlp)} and the bhukti lord {arp.bhukti.lord} in the {ordinal(arp.bhuktiLord.houseFromAlp)} from the ALP lagna, the {ordinal(arp.dasaLord.houseFromArp)} and {ordinal(arp.bhuktiLord.houseFromArp)} from the Akshaya rasi (Book 2 pp. 95-96).
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground" data-testid="list-alp-questions-gloss">
                {[
                  { who: "ALP nakshatra lord", planet: a.point.nakshatraLord, house: nakLordHouse },
                  { who: "Dasa lord", planet: arp.dasa.lord, house: arp.dasaLord.houseFromAlp },
                  { who: "Bhukti lord", planet: arp.bhukti.lord, house: arp.bhuktiLord.houseFromAlp },
                ].map((g) => (
                  <li key={g.who}>
                    <span className="font-medium text-foreground">{g.who} {g.planet}</span>, {ordinal(g.house)}: <span className="text-foreground">{ordinal(g.house)} house</span> is {ALP_HOUSE_THEMES[g.house]}; <span className="text-foreground">{g.planet}</span> is {ALP_PLANET_THEMES[g.planet]} (class notes).
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          <Working id="alp-arp-dasas" label="Show the Akshaya rasi working" className="mt-4">
            <p className="text-xs text-muted-foreground">{ARP_NOTE}</p>
            <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Dasa</TableHead>
                  <TableHead>Nakshatra</TableHead>
                  <TableHead className="hidden sm:table-cell">Sign</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arp.dasaTimeline.map((d, i) => (
                  <TableRow key={i} className={cn(d.current && "bg-primary/5")} data-testid={`row-alp-dasa-${i}`}>
                    <TableCell className="py-1.5 font-medium">
                      {d.lord}
                      {d.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                    </TableCell>
                    <TableCell className="py-1.5">{d.nakshatra}</TableCell>
                    <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell">{d.signs.map((x) => SIGNS[x]).join(" / ")}</TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-right">
                      {d.ageStart.toFixed(1)}–{d.ageEnd.toFixed(1)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-muted-foreground">
                      {fmtMonth(d.start)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs font-medium">The four padas of the {arp.dasa.lord} dasa ({arp.dasa.nakshatra})</p>
            <Table className="tabular mt-1 [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Pada</TableHead>
                  <TableHead>Akshaya rasi</TableHead>
                  <TableHead className="hidden sm:table-cell">Navamsa</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arp.padaPeriods.map((p) => (
                  <TableRow key={p.pada} className={cn(p.current && "bg-primary/5")} data-testid={`row-alp-arp-pada-${p.pada}`}>
                    <TableCell className="py-1.5 font-medium">
                      {p.pada}
                      {p.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                    </TableCell>
                    <TableCell className="py-1.5">{SIGNS[p.signs[0]]}</TableCell>
                    <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell">{p.navamsaSign !== undefined ? SIGNS[p.navamsaSign] : ""}</TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-right">
                      {p.ageStart.toFixed(1)}–{p.ageEnd.toFixed(1)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 text-muted-foreground">
                      {fmt(p.start)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-1 text-xs text-muted-foreground">The {arp.dasa.lord} dasa ends {fmt(arp.dasa.end)}; each row runs to the start of the next.</p>
            <p className="mt-3 text-xs font-medium">Bhuktis of the {arp.dasa.lord} dasa</p>
            <p className="mt-1 text-xs text-muted-foreground" data-testid="text-alp-bhuktis">
              {arp.bhuktis.map((b) => `${b.lord} ${fmtMonth(b.start)}${b.current ? " (now)" : ""}`).join(" · ")}
            </p>
          </Working>
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
              Within {a.point.sign} the lagna is in <span className="font-medium">{a.point.nakshatra}</span> (pada {a.point.pada}), ages {curNak?.ageStart.toFixed(1)}–{curNak?.ageEnd.toFixed(1)}; the nakshatra lord <span className="font-medium">{nakP.planet}</span> is in the {ordinal(nakP.houseFromAlp)} from the ALP lagna, the {ordinal(nakP.houseFromJanma)} natally.
              {nextNak && (
                <>
                  {" "}Next comes {nextNak.nakshatra} ({nextNak.nakshatraLord}) from {fmt(nextNak.start)}.
                </>
              )}
            </li>
            <li>
              The pada's navamsa sign is {SIGNS[a.point.navamsaSign]}, the {ordinal(activatedHouse)} from the ALP lagna; its lord <span className="font-medium">{navP.planet}</span> is in the {ordinal(navP.houseFromAlp)}.
            </li>
          </ul>

          <Working id="alp-book-arithmetic" label="Show the Book 2 arithmetic" className="mt-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm tabular" data-testid="text-alp-book-arithmetic">
              <div>
                Age {a.book.years} {a.book.years === 1 ? "year" : "years"} {a.book.months} {a.book.months === 1 ? "month" : "months"} → {a.book.years} × 3° = {a.book.degFromYears}°{a.book.degFromMonths ? `, plus ${a.book.degFromMonths}° for ${a.book.months} months (1° per four months)` : ""} = {a.book.degTravelled}° travelled.
              </div>
              <div className="mt-1">
                Birth lagna point {fmtLon360(a.natalLagna.lon)} ({a.natalLagna.sign}) + {a.book.degTravelled}° = {fmtLon360(a.book.point.lon)} from Aries → {a.book.point.sign} {fmtDegShort(a.book.point.degInSign)}, {a.book.point.nakshatra} pada {a.book.point.pada}.
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {a.book.agreesWithContinuous
                  ? "The book counts in whole degrees; the continuous point above lands in the same pada."
                  : `The book's whole-degree count lands in ${a.book.point.nakshatra} pada ${a.book.point.pada}, while the continuous point is in ${a.point.nakshatra} pada ${a.point.pada}; the lagna is near a boundary, so read both.`}
              </p>
            </div>
          </Working>

          <Working id="alp-houses" label="Show the houses from the ALP lagna" className="mt-4">
            <Table className="tabular [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Sign</TableHead>
                  <TableHead>Lord</TableHead>
                  <TableHead>Planets</TableHead>
                  <TableHead className="hidden whitespace-nowrap sm:table-cell">To see</TableHead>
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
                    <TableCell className="hidden whitespace-nowrap py-1.5 text-muted-foreground sm:table-cell">{a.point.lord === h.lord ? PLANET_ABBR[a.point.lord] : `${PLANET_ABBR[a.point.lord]} + ${PLANET_ABBR[h.lord]}`}</TableCell>
                    <TableCell className="hidden py-1.5 text-right text-muted-foreground sm:table-cell">{h.houseFromJanma}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">{TWO_PLANET_NOTE}</p>
          </Working>
        </div>
      </div>

      <Working id="alp-karma-bhavas" label="Show the karma bhavas (Book 2, ch. 3-5)" className="mt-6">
        <p className="mb-2 text-xs text-muted-foreground">
          Book 2 groups the houses from the ALP lagna as present (1, 4, 7, 10), past (2, 5, 8, 11) and future (3, 6, 9, 12), and gives each one a past-life karma bhava: the 4th from it, the 10th counted backwards. Houses 10 to 3 are free-will bhavas where remedies work; 4 to 9 are destined, and the book asks that no remedy be prescribed for them (p. 57). Signs and planets below are from this chart.
        </p>
        <div className="overflow-x-auto"><Table className="tabular">
          <TableHeader>
            <TableRow>
              <TableHead>House</TableHead>
              <TableHead className="hidden sm:table-cell">Group</TableHead>
              <TableHead className="hidden sm:table-cell">Control</TableHead>
              <TableHead>Karma bhava</TableHead>
              <TableHead>Lords to hold</TableHead>
              <TableHead className="hidden md:table-cell">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {KARMA_BHAVAS.map((k) => {
              const h = a.houses[k.house - 1];
              const kh = a.houses[k.karmaHouse - 1];
              return (
                <TableRow key={k.house} data-testid={`row-alp-karma-${k.house}`}>
                  <TableCell className="py-1.5 align-top">
                    <span className="font-medium">{k.house}</span> <span className="text-muted-foreground">{h.sign}</span>
                    <div className="text-xs text-muted-foreground">{k.theme}</div>
                  </TableCell>
                  <TableCell className="hidden py-1.5 align-top capitalize text-muted-foreground sm:table-cell">{k.group}</TableCell>
                  <TableCell className="hidden py-1.5 align-top text-muted-foreground sm:table-cell">{k.control}</TableCell>
                  <TableCell className="py-1.5 align-top">
                    <span className="font-medium">{k.karmaHouse}</span> <span className="text-muted-foreground">{kh.sign}</span>
                    <div className="text-xs text-muted-foreground">{kh.planets.length ? kh.planets.map((p) => PLANET_ABBR[p]).join(" ") : "empty"}</div>
                  </TableCell>
                  <TableCell className="py-1.5 align-top text-muted-foreground">
                    {h.lord === kh.lord ? h.lord : `${h.lord} & ${kh.lord}`}
                  </TableCell>
                  <TableCell className="hidden py-1.5 align-top text-xs text-muted-foreground md:table-cell">
                    {k.karmaNote} <span className="whitespace-nowrap">({k.page})</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
        <p className="mt-2 text-xs text-muted-foreground">{KARMA_REMEDY_NOTE}</p>
      </Working>

      <Working id="alp-sign-reading" label={`Show the general reading for a ${a.point.sign} ALP lagna (Book 1 class notes)`} className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Each planet rules one or two houses from the ALP lagna; the two houses are read as one theme carried by that planet. Rows marked "class note" are the practitioner's notes from the basic class; the others are built from the same house themes and wait for the notes on this sign.
        </p>
        <div className="overflow-x-auto"><Table className="tabular [&_td]:px-2 [&_th]:px-2">
          <TableHeader>
            <TableRow>
              <TableHead>Planet</TableHead>
              <TableHead>Houses</TableHead>
              <TableHead className="hidden sm:table-cell">Placed</TableHead>
              <TableHead>Reading</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signReading.map((r) => {
              const placed = a.placements.find((p) => p.planet === r.planet) ?? a.houses.flatMap((h) => h.planets.map((pl) => ({ planet: pl, houseFromAlp: h.house }))).find((p) => p.planet === r.planet);
              return (
                <TableRow key={r.planet} data-testid={`row-alp-sign-reading-${r.planet}`}>
                  <TableCell className="py-1.5 align-top font-medium">{r.planet}</TableCell>
                  <TableCell className="py-1.5 align-top whitespace-nowrap">{r.houses.join(", ")}</TableCell>
                  <TableCell className="hidden py-1.5 align-top text-muted-foreground sm:table-cell">{placed ? ordinal(placed.houseFromAlp) : "—"}</TableCell>
                  <TableCell className="py-1.5 align-top text-xs">
                    {r.text}{" "}
                    <span className="text-muted-foreground">({r.fromNotes ? "class note" : "from house themes"})</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </Working>

      <Working id="alp-dusthana" label="Show the 6th, 8th, 10th and 12th (class notes, rules 4-5)" className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">{DUSTHANA_NOTE}</p>
        <p className="text-xs font-medium">Rule 4: where the lords of the 6th, 8th, 10th and 12th stand</p>
        <ul className="mt-1 space-y-1 text-xs" data-testid="list-alp-dusthana-lords">
          {[6, 8, 10, 12].map((h) => {
            const lord = a.houses[h - 1].lord;
            const at = a.houses.find((x) => x.planets.includes(lord));
            return (
              <li key={h}>
                <span className="font-medium">{h}th lord {lord}</span> stands in the {at ? ordinal(at.house) : "?"}{at ? ` (${at.sign})` : ""}: {at && at.house === h ? `its own house, so the ${h}th's matters (${ALP_HOUSE_THEMES[h]}) are lived directly.` : `the ${h}th's matters (${ALP_HOUSE_THEMES[h]}) are felt through the ${at ? ordinal(at.house) : "?"}${at ? `, ${ALP_HOUSE_THEMES[at.house]}` : ""}.`}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs font-medium">Rule 5: planets standing in the 6th, 8th, 10th and 12th</p>
        <ul className="mt-1 space-y-1 text-xs" data-testid="list-alp-dusthana-occupants">
          {[6, 8, 10, 12].flatMap((h) => a.houses[h - 1].planets.map((pl) => {
            const owns = a.houses.filter((x) => x.lord === pl).map((x) => x.house);
            return (
              <li key={`${h}-${pl}`}>
                <span className="font-medium">{pl}</span> in the {ordinal(h)} ({a.houses[h - 1].sign}){owns.length ? `, owning the ${owns.map(ordinal).join(" and ")}: those houses (${owns.map((o) => ALP_HOUSE_THEMES[o]).join("; ")}) meet the ${ordinal(h)}'s ${h === 6 ? "short-term issues" : h === 8 ? "long-term issues" : h === 10 ? "pressure" : "losses"}.` : ": a node, owning nothing; it colours the house it sits in."}
              </li>
            );
          }))}
          {![6, 8, 10, 12].some((h) => a.houses[h - 1].planets.length) && <li className="text-muted-foreground">No planet stands in the 6th, 8th, 10th or 12th from the ALP lagna.</li>}
        </ul>
      </Working>

      <section className="mt-10" data-testid="section-alp-findings">
        <h2 className="text-base font-semibold">Reading</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ALP_RULES.length} rules so far: the framework from the published material, and Book 2 chapters 2 to 17 (pp. 32-99, 137-143), and the Book 1 class notes (rules 1-5). The remaining chapters are entered one at a time.
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
          {config.yearsPerSign} years per sign, counted from the natal lagna degree (Book 2 adds the travelled degrees to the birth lagna point), so the birth sign gets only its remaining arc.
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

        <h3 className="mt-8 text-sm font-semibold" id="alp-nakshatras">Nakshatras within {a.point.sign}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The sign is crossed in three stretches of nakshatra; each brings a second lord into play. The lord's house is counted from the ALP lagna.
        </p>
        <Table className="tabular mt-2" data-testid="table-alp-nakshatras">
          <TableHeader>
            <TableRow>
              <TableHead>Nakshatra</TableHead>
              <TableHead>Lord</TableHead>
              <TableHead className="hidden sm:table-cell">Lord's house</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead>Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {a.nakshatraPeriods.map((n) => (
              <TableRow key={n.nakshatraIndex} className={cn(n.current && "bg-primary/5")} data-testid={`row-alp-nak-${n.nakshatraIndex}`}>
                <TableCell className="py-2 font-medium">
                  {n.nakshatra}
                  {n.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                </TableCell>
                <TableCell className="py-2">{n.nakshatraLord}</TableCell>
                <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">{n.nakshatraLord ? ordinal(houseOf(n.nakshatraLord)!) : ""}</TableCell>
                <TableCell className="py-2 text-right">
                  {n.ageStart.toFixed(1)}–{n.ageEnd.toFixed(1)}
                </TableCell>
                <TableCell className="py-2 text-muted-foreground">
                  {fmt(n.start)} – {fmt(n.end)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Working id="alp-three-ways" label="Show the three ways: present, past, future (Book 2, ch. 17)" className="mt-4">
          <p className="mb-2 text-xs text-muted-foreground">{THREE_WAYS_NOTE}</p>
          {[
            { key: "janma", title: `Birth lagna (the book's reading)`, ways: threeWaysJanma },
            { key: "alp", title: `ALP lagna (example chart 1, pp. 140-141)`, ways: threeWaysAlp },
          ].map(({ key, title, ways }) => {
            const c = threeWaysCount(ways);
            return (
              <div key={key} className="mt-3" data-testid={`three-ways-${key}`}>
                <p className="text-xs font-medium">{title}</p>
                <div className="overflow-x-auto"><Table className="tabular mt-1 [&_td]:px-2 [&_th]:px-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Way</TableHead>
                      <TableHead>House</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ways.map((w) => (
                      <TableRow key={w.label}>
                        <TableCell className="py-1.5 align-top text-xs">
                          <span className="font-medium">{w.label}</span>
                          <div className="text-muted-foreground">{w.detail}</div>
                        </TableCell>
                        <TableCell className="py-1.5 align-top">{ordinal(w.house)}</TableCell>
                        <TableCell className="py-1.5 align-top capitalize">{w.group}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.present} present, {c.past} past, {c.future} future. {threeWaysText(c)}{key === "janma" ? " (This line also appears in the reading below.)" : ""}
                </p>
              </div>
            );
          })}
        </Working>

        <Working id="alp-nak-timeline" label="Show every nakshatra over the 120 years" count={a.nakshatraTimeline.length} className="mt-4">
          <Table className="tabular">
            <TableHeader>
              <TableRow>
                <TableHead>Nakshatra</TableHead>
                <TableHead>Lord</TableHead>
                <TableHead className="hidden sm:table-cell">Sign</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.nakshatraTimeline.map((n, i) => (
                <TableRow key={`${n.nakshatraIndex}-${i}`} className={cn(n.current && "bg-primary/5")}>
                  <TableCell className="py-1.5 font-medium">
                    {n.nakshatra}
                    {n.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                  </TableCell>
                  <TableCell className="py-1.5">{n.nakshatraLord}</TableCell>
                  <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell">{nakSigns(n.nakshatraIndex!)}</TableCell>
                  <TableCell className="py-1.5 text-right">
                    {n.ageStart.toFixed(1)}–{n.ageEnd.toFixed(1)}
                  </TableCell>
                  <TableCell className="py-1.5 text-muted-foreground">
                    {fmtMonth(n.start)} – {fmtMonth(n.end)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">One nakshatra takes 4 years 5 months and a few days; a sign holds two and a quarter of them, so a nakshatra can straddle two signs.</p>
        </Working>

        <Working id="alp-padas" label={`Show the nine padas of ${a.point.sign}`} count={a.padaPeriods.length} className="mt-4">
          <Table className="tabular">
            <TableHeader>
              <TableRow>
                <TableHead>Pada in sign</TableHead>
                <TableHead>Lord</TableHead>
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
          Akshaya Lagna Paddhati moves the ascendant forward with age, ten years to a sign and one nakshatra pada in 1 year 1 month 10 days, so that the whole zodiac is covered in 120 years, and reads the natal planets from the moved lagna. Three layers are tracked: the sign (and its lord), the nakshatra within the sign (and its lord), and the pada (and the navamsa sign it activates). The natal chart, the Vimshottari dasha and transits stay as they are; only the reference point moves.{" "}
          <a href={ALP_SOURCE_SITE} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
            alpastrology.org
          </a>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            The rate is confirmed by the author's second e-magazine: 360° over 120 years, 3° a year, so 1° is four months.{" "}
            <a href={ALP_SOURCE_MAGAZINE_2} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
              ALP e-magazine 2
            </a>
          </li>
          <li>Book 2 (pp. 32-41) settles the start: travelled degrees are added to the birth lagna degree, with 3° for each completed year and 1° for every four months of the remainder. The continuous point used here moves smoothly between those whole-degree steps; the arithmetic is shown in the working above.</li>
          <li>Book 2 (pp. 72-73) derives the Akshaya rasi from the Vimshottari dasa: the Moon moves from its birth nakshatra to the next with each dasa, a pada for each quarter of it, and the sign the current pada falls in is the Akshaya rasi (the mind), judged with the dasa lord and against the ALP lagna (the body). The first dasa is prorated from the Moon's degree, as in Vimshottari.</li>
          <li>{ARP_QUESTIONS_NOTE}</li>
          <li>Book 2 ch. 15 (p. 91) lists ten features to observe before predicting: {ALP_TEN_FEATURES.map((f) => f.toLowerCase()).join("; ")}. The gochar items wait for live planet positions.</li>
          <li>Book 2 ch. 12 (pp. 86-87) frames the reading: a planet gives its effect from the bhava it occupies, "from wherever it is taken, it is returned to the same place", and the scenes change when the time changes.</li>
          <li>Still open: whether the year is solar (365.25 days, used here) or savana (360 days); the gochar rules (transiting Mars through the 8th from the ALP lagna, the Moon through the 8th from the Akshaya rasi, pp. 81-82) which need live planet positions and Book 3; the nakshatra-by-nakshatra readings (Books 3 and 4).</li>
          <li>Kept separate from the Nadi and Jaimini readings; nothing here feeds them.</li>
        </ul>
      </section>
    </div>
  );
}
