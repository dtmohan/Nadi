import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import type { KpBase } from "@shared/kp";
import { apiRequest } from "@/lib/queryClient";
import { useJudgePlace } from "@/lib/judge-place";
import { JudgePlaceControl } from "@/components/judge-place";
import { PLANET_ABBR, SIGN_ABBR, fmtDegShort, type Planet } from "@shared/astro";
import { computeKp, significatorMap, jointPeriods, type KpPeriod, type SignificatorLevel } from "@shared/kp";
import { KP_RULES, KP_CUSP_THEMES, KP_SOURCES, KP_TYPE_LEVEL_LABEL, type KpFinding } from "@shared/rules-kp";
import { Working } from "@/components/working";
import { useReadingMode } from "@/lib/reading-mode";
import { PlanetName, SignName, PlanetLegend, planetColor } from "@/components/planet-name";
import { DasaBar } from "@/components/dasa-bar";
import { Term } from "@/components/term";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const fmtMonth = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** Event templates: the houses whose significators' conjoined periods KP times a matter by. */
const EVENTS: Array<{ id: string; label: string; houses: number[]; cusp: number }> = [
  { id: "marriage", label: "Marriage", houses: [2, 7, 11], cusp: 7 },
  { id: "children", label: "Childbirth", houses: [2, 5, 11], cusp: 5 },
  { id: "job", label: "Employment, promotion", houses: [2, 6, 10, 11], cusp: 10 },
  { id: "business", label: "Business gains", houses: [2, 7, 10, 11], cusp: 10 },
  { id: "property", label: "House, property", houses: [4, 11, 12], cusp: 4 },
  { id: "vehicle", label: "Vehicle", houses: [4, 11], cusp: 4 },
  { id: "education", label: "Higher education", houses: [4, 9, 11], cusp: 4 },
  { id: "foreign", label: "Foreign travel", houses: [3, 9, 12], cusp: 12 },
  { id: "loan", label: "Loans, money received", houses: [2, 6, 11], cusp: 6 },
  { id: "litigation", label: "Litigation success", houses: [1, 6, 11], cusp: 6 },
  { id: "recovery", label: "Recovery from illness", houses: [1, 5, 9, 11], cusp: 1 },
  { id: "illness", label: "Illness, hospitalisation", houses: [6, 8, 12], cusp: 6 },
  { id: "move", label: "Change of residence", houses: [3, 12], cusp: 4 },
];

const POLARITY_CLASS = { good: "bg-emerald-500", bad: "bg-rose-500", neutral: "bg-muted-foreground/50" } as const;

function Houses({ houses, hilite = [] }: { houses: number[]; hilite?: number[] }) {
  if (!houses.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="tabular">
      {houses.map((h, i) => (
        <span key={h} className={cn(hilite.includes(h) && "font-semibold text-foreground")}>
          {h}
          {i < houses.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}

function PlanetList({ planets }: { planets: Planet[] }) {
  if (!planets.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5">
      {planets.map((p) => (
        <PlanetName key={p} planet={p} abbr />
      ))}
    </span>
  );
}

function PeriodRow({ p, testId, sig }: { p: KpPeriod; testId: string; sig: Map<Planet, number[]> }) {
  return (
    <TableRow className={cn(p.current && "bg-primary/5")} data-testid={testId}>
      <TableCell className="py-1.5 font-medium">
        <PlanetName planet={p.lord} />
        {p.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
      </TableCell>
      <TableCell className="py-1.5 text-right tabular">
        {p.ageStart.toFixed(1)}–{p.ageEnd.toFixed(1)}
      </TableCell>
      <TableCell className="py-1.5 tabular">{fmtMonth(p.start)}</TableCell>
      <TableCell className="hidden py-1.5 tabular sm:table-cell">{fmtMonth(p.end)}</TableCell>
      <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
        <Houses houses={sig.get(p.lord) ?? []} />
      </TableCell>
    </TableRow>
  );
}

export function KpPanel({ result }: { result: ChartResult }) {
  const { chart } = result;
  const { mode } = useReadingMode();
  const [asOf, setAsOf] = useState(() => DateTime.local().toISODate()!);
  const [sixStep, setSixStep] = useState(false);
  const [event, setEvent] = useState<string>("marriage");
  const [showAllCusps, setShowAllCusps] = useState(false);

  const asOfIso = useMemo(() => {
    const d = DateTime.fromISO(asOf, { zone: chart.timezone });
    return d.isValid ? d.toISO()! : DateTime.local().toISO()!;
  }, [asOf, chart.timezone]);

  // Ruling planets are taken for the astrologer's place when one is set; the server's snapshot is for the birth place.
  const judge = useJudgePlace();
  const judgeNow = useQuery<KpBase["now"]>({
    queryKey: ["kp-ruling", judge?.latitude, judge?.longitude, judge?.timezone, chart.nodeType, result.utc],
    enabled: Boolean(judge),
    queryFn: async () => (await (await apiRequest("POST", "/api/kp/ruling", { latitude: judge!.latitude, longitude: judge!.longitude, timezone: judge!.timezone, label: judge!.label, nodeType: chart.nodeType === "true" ? "true" : "mean" })).json()) as KpBase["now"],
    staleTime: 60_000,
  });
  const kpBase = useMemo<KpBase>(() => (judge && judgeNow.data ? { ...result.kp, now: judgeNow.data } : result.kp), [result.kp, judge, judgeNow.data]);
  const judgeZone = judge?.timezone ?? chart.timezone;
  const judgeLabel = judge?.label ?? chart.place;
  const kp = useMemo(() => computeKp(kpBase, result.utc, asOfIso, sixStep), [kpBase, result.utc, asOfIso, sixStep]);
  const sig = useMemo(() => significatorMap(kp, sixStep), [kp, sixStep]);
  const ev = EVENTS.find((e) => e.id === event) ?? EVENTS[0];
  const allWindows = useMemo(() => jointPeriods(kp.vimshottari, sig, ev.houses, result.utc, asOfIso, 30), [kp.vimshottari, sig, ev, result.utc, asOfIso]);
  const [showPast, setShowPast] = useState(false);
  const windows = useMemo(() => (showPast ? allWindows : allWindows.filter((w) => !w.past)), [allWindows, showPast]);
  const pastCount = allWindows.length - allWindows.filter((w) => !w.past).length;

  const lagna = kp.cusps[0];
  const moon = kp.planets.find((p) => p.planet === "Moon")!;
  const cur = kp.vimshottari.current;
  const findingsByCusp = useMemo(() => {
    const m = new Map<number, KpFinding[]>();
    for (const f of kp.findings) m.set(f.cusp, [...(m.get(f.cusp) ?? []), f]);
    return m;
  }, [kp.findings]);
  const levels: SignificatorLevel[] = sixStep ? ["A", "B", "C", "D", "E", "F"] : ["A", "B", "C", "D"];
  const cuspsToShow = mode === "practitioner" || showAllCusps ? kp.cusps : kp.cusps.filter((c) => (findingsByCusp.get(c.house) ?? []).some((f) => f.polarity !== "neutral" || f.topic !== "Sources of income"));
  const planetsFor = (houses: number[]) => kp.planets.filter((p) => (sig.get(p.planet) ?? []).some((h) => houses.includes(h))).map((p) => p.planet);
  const houseLabel = (h: number) => (h === kp.badhaka ? `${h} (badhaka)` : kp.marakas.includes(h) ? `${h} (maraka)` : `${h}`);

  return (
    <div data-testid="kp-panel">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="outline" className="no-default-hover-elevate tabular">
          KP ayanamsa {kp.ayanamsaValue.toFixed(3)}°
        </Badge>
        <Badge variant="secondary" className="no-default-hover-elevate tabular" data-testid="text-kp-lagna">
          Lagna {lagna.sign} {fmtDegShort(lagna.degInSign)}
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-kp-lagna-lords">
          <span className="inline-flex items-center gap-1.5">
            <Term k="kp-sub-lord">sub lord</Term> <PlanetName planet={lagna.subLord} abbr /> · star <PlanetName planet={lagna.starLord} abbr />
          </span>
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-kp-moon">
          <span className="inline-flex items-center gap-1.5">
            Moon {moon.nakshatra} · <PlanetName planet={moon.starLord} abbr /> star
          </span>
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-kp-badhaka">
          <Term k="kp-badhaka">Badhaka</Term>&nbsp;{kp.badhaka}th ({kp.lagnaQuality.toLowerCase()} lagna) · marakas 2, 7
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate" data-testid="text-kp-dasa">
          <span className="inline-flex items-center gap-1.5">
            <PlanetName planet={cur.dasa.lord} abbr /> dasa · <PlanetName planet={cur.bhukti.lord} abbr /> bhukti · <PlanetName planet={cur.antara.lord} abbr /> antara
          </span>
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          As of
          <Input type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} className="h-7 w-40 text-xs" data-testid="input-kp-asof" />
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAsOf(DateTime.local().toISODate()!)} data-testid="button-kp-today">
            Today
          </Button>
        </label>
        <div role="radiogroup" aria-label="Significator depth" className="inline-flex rounded-md border p-0.5">
          {(
            [
              [false, "4-step"],
              [true, "6-step"],
            ] as const
          ).map(([v, label]) => (
            <button key={label} type="button" role="radio" aria-checked={sixStep === v} onClick={() => setSixStep(v)} className={cn("rounded px-2 py-0.5", sixStep === v ? "bg-foreground text-background" : "hover:text-foreground")} data-testid={`kp-steps-${label}`}>
              {label}
            </button>
          ))}
        </div>
        <span>
          {sixStep ? "Six steps: the class-note table adds the sub lord's occupancy and ownership." : "Krishnamurti's four steps: star lord's house, own house, star lord's ownership, own ownership."} Placidus cusps; the KP ayanamsa is used here whatever the chart's setting.
        </span>
      </div>

      {/* Cusps and planets */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <section data-testid="section-kp-cusps">
          <h2 className="text-base font-semibold">Cusps</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each cusp's sign lord, star lord, sub lord and sub-sub lord. The sub lord is the one that decides.</p>
          <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Cusp</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Sign</TableHead>
                <TableHead>Star</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead className="hidden sm:table-cell">Sub-sub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kp.cusps.map((c) => (
                <TableRow key={c.house} data-testid={`row-kp-cusp-${c.house}`} className={cn(c.house === kp.badhaka && "bg-rose-500/5")}>
                  <TableCell className="py-1.5 font-medium">{ROMAN[c.house - 1]}</TableCell>
                  <TableCell className="py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <SignName signIndex={c.signIndex} abbr /> {fmtDegShort(c.degInSign)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={c.signLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={c.starLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5 font-semibold">
                    <PlanetName planet={c.subLord} abbr tone />
                  </TableCell>
                  <TableCell className="hidden py-1.5 sm:table-cell">
                    <PlanetName planet={c.subSubLord} abbr />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section data-testid="section-kp-planets">
          <h2 className="text-base font-semibold">Planets</h2>
          <p className="mt-1 text-xs text-muted-foreground">Bhava occupied runs from one cusp to the next (Placidus). Ownership is the lordship of the sign on the cusp; Rahu and Ketu own nothing and act for their sign lord and companions.</p>
          <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead>Planet</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Star</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead className="hidden sm:table-cell">Sub-sub</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Owns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kp.planets.map((p) => (
                <TableRow key={p.planet} data-testid={`row-kp-planet-${p.planet}`}>
                  <TableCell className="py-1.5 font-medium">
                    <PlanetName planet={p.planet} />
                    {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" && <span className="ml-1 text-[10px] text-muted-foreground">R</span>}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <SignName signIndex={p.signIndex} abbr /> {fmtDegShort(p.degInSign)}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={p.starLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={p.subLord} abbr />
                  </TableCell>
                  <TableCell className="hidden py-1.5 sm:table-cell">
                    <PlanetName planet={p.subSubLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5 text-right">{p.house}</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Houses houses={p.owns} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>

      {/* Significators */}
      <section className="mt-10" data-testid="section-kp-significators">
        <h2 className="text-base font-semibold">
          <Term k="kp-significator">Significators</Term>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A planet signifies the houses its star lord occupies and owns, and the houses it occupies and owns itself, in that order of strength. The house-wise table reads the same links from the other side.
        </p>
        <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-medium">Planet-wise</p>
            <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Planet</TableHead>
                  {levels.map((lv) => (
                    <TableHead key={lv} className="text-center" title={KP_TYPE_LEVEL_LABEL[lv]}>
                      {lv}
                    </TableHead>
                  ))}
                  <TableHead>Signifies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kp.significators.map((s) => (
                  <TableRow key={s.planet} data-testid={`row-kp-sig-${s.planet}`}>
                    <TableCell className="py-1.5 font-medium">
                      <PlanetName planet={s.planet} abbr />
                      {s.agentFor && <span className="ml-1 text-[10px] text-muted-foreground" title={`Acts for ${s.agentFor.join(", ")}`}>({s.agentFor.map((a) => PLANET_ABBR[a]).join(" ")})</span>}
                    </TableCell>
                    {levels.map((lv) => (
                      <TableCell key={lv} className="py-1.5 text-center text-xs">
                        <Houses houses={s.levels[lv]} />
                      </TableCell>
                    ))}
                    <TableCell className="py-1.5 font-medium">
                      <Houses houses={sixStep ? s.housesSix : s.houses} hilite={[kp.badhaka, ...kp.marakas]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {levels.map((lv) => `${lv} ${KP_TYPE_LEVEL_LABEL[lv].toLowerCase()}`).join(" · ")}. Bold in the last column: the badhaka ({kp.badhaka}) and maraka (2, 7) houses.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium">House-wise</p>
            <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">House</TableHead>
                  <TableHead>In star of occupants</TableHead>
                  <TableHead>Occupants</TableHead>
                  <TableHead>In star of owner</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Cusp sub</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kp.houseSignificators.map((h) => (
                  <TableRow key={h.house} data-testid={`row-kp-house-${h.house}`}>
                    <TableCell className="py-1.5 font-medium">{h.house}</TableCell>
                    <TableCell className="py-1.5 text-xs">
                      <PlanetList planets={h.inStarOfOccupants} />
                    </TableCell>
                    <TableCell className="py-1.5 text-xs">
                      <PlanetList planets={h.occupants} />
                    </TableCell>
                    <TableCell className="py-1.5 text-xs">
                      <PlanetList planets={h.inStarOfOwner} />
                    </TableCell>
                    <TableCell className="py-1.5 text-xs">
                      <PlanetName planet={h.owner} abbr />
                    </TableCell>
                    <TableCell className="hidden py-1.5 text-xs lg:table-cell">
                      <PlanetName planet={kp.cusps[h.house - 1].subLord} abbr tone />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Cuspal sub lord reading */}
      <section className="mt-10" data-testid="section-kp-reading">
        <h2 className="text-base font-semibold">What the cuspal sub lords say</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {KP_RULES.length} rules so far: the 1st and 2nd cusps from the class notes, the consolidated cusp-by-cusp rules of Astro Secrets Part 3 chapter 6, and the house-by-house chapter of Part 1 (the 3rd to 12th houses entered) cross-checked against Dr. Andrew Dutta's free bhava rules. Each verdict names the sub lord and the houses it signifies. Green: promised. Red: denied or a caution. Grey: descriptive.
        </p>
        {mode === "plain" && (
          <button type="button" className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setShowAllCusps((v) => !v)} data-testid="toggle-kp-all-cusps">
            {showAllCusps ? "Show only the cusps with a verdict" : "Show every cusp"}
          </button>
        )}
        <div className="mt-4 space-y-6">
          {cuspsToShow.map((c) => {
            const fs = findingsByCusp.get(c.house) ?? [];
            const sl = kp.planets.find((p) => p.planet === c.subLord)!;
            const houses = sig.get(c.subLord) ?? [];
            const main = fs.filter((f) => f.topic !== "Sources of income");
            const income = fs.filter((f) => f.topic === "Sources of income");
            return (
              <article key={c.house} className="rounded-lg border p-4" data-testid={`kp-cusp-reading-${c.house}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    Cusp {ROMAN[c.house - 1]} <span className="font-normal text-muted-foreground">· {KP_CUSP_THEMES[c.house]}</span>
                  </h3>
                  <span className="inline-flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                    <SignName signIndex={c.signIndex} abbr /> {fmtDegShort(c.degInSign)} · sub lord <PlanetName planet={c.subLord} abbr tone /> in the {ordinal(sl.house)}, star of <PlanetName planet={sl.starLord} abbr /> · signifies{" "}
                    <Houses houses={houses} hilite={[kp.badhaka, ...kp.marakas]} />
                  </span>
                </div>
                {main.length ? (
                  <ul className="mt-3 space-y-2">
                    {main.map((f) => (
                      <li key={f.ruleId} className="flex gap-3 text-sm" data-testid={`kp-finding-${f.ruleId}`}>
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", POLARITY_CLASS[f.polarity])} aria-label={f.polarity} />
                        <span>
                          <span className="mr-1.5 text-xs font-medium text-muted-foreground">{f.topic}.</span>
                          {f.text}
                          {f.timing && (
                            <span className="ml-1.5 text-xs text-muted-foreground" data-testid={`kp-finding-timing-${f.ruleId}`}>
                              Timing: joint periods of {f.timing.join("-")} significators ({planetsFor(f.timing).map((p) => PLANET_ABBR[p]).join(" ")}).
                            </span>
                          )}
                          {mode === "practitioner" && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {f.evidence}.{" "}
                              {f.sourceUrl ? (
                                <a href={f.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
                                  {f.source}
                                </a>
                              ) : (
                                f.source
                              )}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No rule entered yet fires for this sub lord; the houses it signifies are what the books would be read against.</p>
                )}
                {income.length > 0 && (
                  <Working id={`kp-income-${c.house}`} label="Show the sources of income" count={income.length} className="mt-3">
                    <ul className="space-y-1 text-sm">
                      {income.map((f) => (
                        <li key={f.ruleId} className="text-muted-foreground" data-testid={`kp-finding-${f.ruleId}`}>
                          {f.text}
                        </li>
                      ))}
                    </ul>
                    {mode === "practitioner" && <p className="mt-1 text-xs text-muted-foreground">{income[0].source}</p>}
                  </Working>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Timing */}
      <section className="mt-10" data-testid="section-kp-timing">
        <h2 className="text-base font-semibold">Timing: Vimshottari from the Moon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A promised matter fructifies when the dasa, bhukti and antara lords are all significators of its houses. Pick a matter and the windows in the next thirty years are listed; the sub lord of the cusp above must promise it first.
        </p>
        <DasaBar
          className="mt-3"
          testId="bar-kp-dasas"
          nowAt={kp.ageYears}
          ticks={[0, 20, 40, 60, 80, 100, 120]}
          segments={kp.vimshottari.dasas.map((d) => ({ start: d.ageStart, end: d.ageEnd, color: planetColor(d.lord), label: PLANET_ABBR[d.lord], current: d.current, title: `${d.lord} dasa · ${fmt(d.start)} to ${fmt(d.end)}` }))}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Balance at birth: {kp.vimshottari.balanceYears.toFixed(2)} years of {kp.vimshottari.dasas[0].lord}. Moon at {moon.sign} {fmtDegShort(moon.degInSign)}, {moon.nakshatra}.</p>
        <p className="mt-3 text-xs font-medium">Bhuktis of the {cur.dasa.lord} dasa ({fmt(cur.dasa.start)} to {fmt(cur.dasa.end)})</p>
        <DasaBar
          className="mt-2"
          testId="bar-kp-bhuktis"
          nowAt={kp.ageYears}
          segments={kp.vimshottari.bhuktis.filter((b) => b.dasaLord === cur.dasa.lord).map((b) => ({ start: b.ageStart, end: b.ageEnd, color: planetColor(b.lord), label: PLANET_ABBR[b.lord], current: b.current, title: `${b.dasaLord}–${b.lord} · ${fmt(b.start)} to ${fmt(b.end)}` }))}
        />
        <PlanetLegend className="mt-3" />

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Matter:</span>
          {EVENTS.map((e) => (
            <Button key={e.id} size="sm" variant={event === e.id ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setEvent(e.id)} data-testid={`kp-event-${e.id}`}>
              {e.label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground" data-testid="text-kp-event-sig">
          Houses {ev.houses.join(", ")} · significators: {planetsFor(ev.houses).length ? planetsFor(ev.houses).map((p) => PLANET_ABBR[p]).join(" ") : "none"} · the {ordinal(ev.cusp)} cusp sub lord{" "}
          <PlanetName planet={kp.cusps[ev.cusp - 1].subLord} abbr /> signifies <Houses houses={sig.get(kp.cusps[ev.cusp - 1].subLord) ?? []} hilite={ev.houses} />
          {pastCount > 0 && (
            <>
              {" · "}
              <button type="button" className="font-medium underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground" onClick={() => setShowPast((v) => !v)} data-testid="toggle-kp-past-windows">
                {showPast ? "hide the past windows" : `show ${pastCount} past window${pastCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </p>
        {windows.length ? (
          <Table className="tabular mt-3 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead>Dasa</TableHead>
                <TableHead>Bhukti</TableHead>
                <TableHead>Antara</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead className="hidden md:table-cell">Houses hit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {windows.slice(0, 60).map((w, i) => (
                <TableRow key={i} className={cn(w.current && "bg-primary/5", w.past && "text-muted-foreground")} data-testid={`row-kp-window-${i}`}>
                  <TableCell className="py-1.5">
                    <PlanetName planet={w.dasaLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={w.bhuktiLord} abbr />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <PlanetName planet={w.antaraLord} abbr />
                    {w.current && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">now</span>}
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">{fmt(w.start)}</TableCell>
                  <TableCell className="hidden py-1.5 whitespace-nowrap sm:table-cell">{fmt(w.end)}</TableCell>
                  <TableCell className="py-1.5 text-right">{w.ageStart.toFixed(1)}</TableCell>
                  <TableCell className="hidden py-1.5 text-xs md:table-cell">
                    {w.hits.dasa.join(",")} · {w.hits.bhukti.join(",")} · {w.hits.antara.join(",")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground" data-testid="text-kp-windows-empty">
            No running or coming dasa-bhukti-antara in the next thirty years has all three lords among the {ev.houses.join("-")} significators.
          </p>
        )}

        <Working id="kp-antaras" label="Show the antaras of the running bhukti" className="mt-4">
          <p className="text-xs font-medium">
            {cur.dasa.lord} dasa · {cur.bhukti.lord} bhukti ({fmt(cur.bhukti.start)} to {fmt(cur.bhukti.end)})
          </p>
          <Table className="tabular mt-2 [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead>Antara</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="hidden md:table-cell">Signifies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kp.vimshottari.antaras.map((a, i) => (
                <PeriodRow key={i} p={a} testId={`row-kp-antara-${i}`} sig={sig} />
              ))}
            </TableBody>
          </Table>
        </Working>
      </section>

      {/* Ruling planets */}
      <section className="mt-10" data-testid="section-kp-ruling">
        <h2 className="text-base font-semibold">
          <Term k="kp-ruling-planets">Ruling planets</Term> at this moment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Taken for the moment of judgement, which is when this chart was opened ({DateTime.fromISO(kp.ruling.asOf).setZone(judgeZone).toFormat("d LLL yyyy HH:mm")} at {judgeLabel}, {judgeZone}; reload the chart to refresh): the lords of the rising sign and star, of the Moon's sign and star, and of the weekday counted from sunrise. Krishnamurti uses them to verify birth time and to pick between competing significators; a node in a ruling planet's sign joins them. The as-of date above moves only the dasa.
        </p>
        <JudgePlaceControl birthPlace={chart.place} birthTimezone={chart.timezone} />
        {judge && judgeNow.isFetching && <p className="mt-2 text-xs text-muted-foreground">Recomputing the rising sign for {judge.label}…</p>}
        {judge && judgeNow.isError && <p className="mt-2 text-xs text-destructive">Could not compute the ruling planets for {judge.label}; showing the birth place instead.</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kp.ruling.list.map((l) => (
            <Badge key={l.role} variant={l.role.includes("sub") ? "outline" : "secondary"} className="no-default-hover-elevate" data-testid={`kp-rp-${l.role.toLowerCase().replace(/\s+/g, "-")}`}>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted-foreground">{l.role}</span> <PlanetName planet={l.planet} abbr />
              </span>
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Rising now: {kp.ruling.lagna.sign} {fmtDegShort(kp.ruling.lagna.degInSign)} ({kp.ruling.lagna.nakshatra}) · Moon now: {kp.ruling.moon.sign} {fmtDegShort(kp.ruling.moon.degInSign)} ({kp.ruling.moon.nakshatra}) · distinct: {kp.ruling.planets.map((p) => `${PLANET_ABBR[p.planet]}${p.count > 1 ? `×${p.count}` : ""}`).join(" ")}
        </p>
      </section>


      <section className="mt-10 border-t pt-6 text-xs text-muted-foreground" data-testid="section-kp-sources">
        <p className="font-medium text-foreground">Method and sources</p>
        <p className="mt-1">
          Sidereal longitudes with the Krishnamurti ayanamsa; Placidus cusps; the 249 subs from the nakshatra divided in Vimshottari proportion starting with its own lord; sub-subs by the same division of the sub. Signification follows Krishnamurti's four steps (star lord's occupancy, own occupancy, star lord's ownership, own ownership); the six-step toggle adds the sub lord's occupancy and ownership as taught in the class notes. Rahu and Ketu stand in for their sign lord and the planets sharing their sign. Rules are paraphrased and cited by volume and page.
        </p>
        <ul className="mt-2 space-y-1">
          {KP_SOURCES.map((s) => (
            <li key={s.label}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
                  {s.label}
                </a>
              ) : (
                <span className="text-foreground">{s.label}</span>
              )}{" "}
              — {s.note}
            </li>
          ))}
        </ul>
        <p className="mt-2">Pending: Part 1 ch. 17, the twelve lagnas; profession (chs. 34-35); ruling planets in depth (Part 2); transits; horary.</p>
      </section>
    </div>
  );
}
