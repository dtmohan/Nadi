import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { ArrowLeft, Eye, EyeOff, FileDown } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { PLANETS, PLANET_ABBR, SIGNS, fmtDeg, fmtDegShort, houseFrom, type Planet, type PlanetPosition, KARAKA } from "@shared/astro";
import { GIVES, RECEIVES, flowGloss, tierLabel, approachLabel, type DegreeChain } from "@shared/flow";
import { nextMarriageWindow, type MarriageReading } from "@shared/marriage";
import { nextChildWindow, type ChildrenReading } from "@shared/children";
import { LIFE_AREAS, RELATION_LABEL, areaKaraka, type Finding, type LifeArea, type PairRelation } from "@shared/rules";
import type { PlanetStrength } from "@shared/strength";
import { housesFrom, HOUSE_CLASS_LABEL, type HouseClass } from "@shared/houses";
import { SouthIndianChart, planetClass } from "@/components/south-indian-chart";
import { Timeline } from "@/components/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/queryClient";

const CLASSICAL = new Set<Planet>(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);

function PlanetTable({ positions, strength, selected, onSelect }: { positions: PlanetPosition[]; strength: PlanetStrength[]; selected: Planet | null; onSelect: (p: Planet | null) => void }) {
  const stOf = (p: Planet) => strength.find((x) => x.planet === p);
  return (
    <Table className="tabular">
      <TableHeader>
        <TableRow>
          <TableHead>Planet</TableHead>
          <TableHead>Sign</TableHead>
          <TableHead className="text-right">Degree</TableHead>
          <TableHead className="hidden sm:table-cell">Nakshatra</TableHead>
          <TableHead className="hidden md:table-cell">Dignity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((p) => (
          <TableRow
            key={p.planet}
            onClick={() => onSelect(selected === p.planet ? null : p.planet)}
            className={cn("cursor-pointer", selected === p.planet && "bg-primary/10")}
            data-testid={`row-planet-${p.planet}`}
          >
            <TableCell className="py-2">
              <span className={cn("font-medium", p.planet === "Jupiter" && "text-primary", p.planet === "Saturn" && "text-[hsl(var(--chart-2))]")}>{p.planet}</span>
              {p.retrograde && CLASSICAL.has(p.planet) && (
                <span className="ml-1.5 text-xs text-muted-foreground" title="Retrograde">
                  ℞
                </span>
              )}
              {p.combust && (
                <span className={cn("ml-1.5 text-xs", stOf(p.planet)?.effectiveCombust ? "text-primary" : "text-muted-foreground")} title={stOf(p.planet)?.notes.find((n) => n.startsWith("Combust")) ?? "Combust (within the Sun's pada)"}>
                  c
                </span>
              )}
              {!!stOf(p.planet)?.winningOver.length && (
                <span className="ml-1.5 text-xs text-muted-foreground" title={`Leads ${stOf(p.planet)!.winningOver.join(", ")} by degree`}>
                  w
                </span>
              )}
            </TableCell>
            <TableCell className="py-2">{p.sign}</TableCell>
            <TableCell className="py-2 text-right text-muted-foreground">{fmtDeg(p.lon)}</TableCell>
            <TableCell className="hidden py-2 sm:table-cell">
              {p.nakshatra} <span className="text-muted-foreground">{p.pada}</span>
            </TableCell>
            <TableCell className="hidden py-2 text-muted-foreground md:table-cell" title={stOf(p.planet)?.dignityNote ?? undefined}>
              {stOf(p.planet) && stOf(p.planet)!.effectiveDignity !== p.dignity ? (
                <span>
                  <span className="line-through decoration-muted-foreground/60">{p.dignity}</span>
                  <span className="ml-1.5 text-xs">set aside</span>
                </span>
              ) : (
                p.dignity
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KarakaCard({ title, planet, data, positions, tone }: { title: string; planet: Planet; data: ChartResult["reading"]["jeeva"]; positions: PlanetPosition[]; tone: "jeeva" | "karma" }) {
  const p = positions.find((x) => x.planet === planet)!;
  return (
    <Card data-testid={`card-${tone}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span className={tone === "jeeva" ? "text-primary" : "text-[hsl(var(--chart-2))]"}>{planet}</span> · {title}
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {p.sign} {fmtDeg(p.lon)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(tone === "jeeva" && planet === "Venus" ? ["the native", "charm", "comforts", "arts", "finance"] : KARAKA[planet].significations).map((s) => (
            <Badge key={s} variant="secondary" className="no-default-hover-elevate font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const PROMISE_LABEL: Record<MarriageReading["promised"], string> = {
  strong: "Promised, strong",
  moderate: "Promised, half strength",
  weak: "Promised, lesser strength",
  "by-karma": "Promised through Saturn",
  "through-dispositor": "Indirect, via dispositor",
  absent: "No structural signature",
};

function MarriageCard({ m, positions, transits, asOf }: { m: MarriageReading; positions: PlanetPosition[]; transits: ChartResult["transits"]; asOf: string }) {
  const sp = positions.find((x) => x.planet === m.spouse)!;
  const win = nextMarriageWindow(m, transits, asOf.slice(0, 10));
  const gender = m.gender === "female" ? "female chart" : m.gender === "male" ? "male chart" : "gender not set, read as male";
  return (
    <Card data-testid="card-marriage">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span className="text-[hsl(var(--chart-3))]">{m.spouse}</span> · Kalatra karaka · marriage
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {sp.sign} {fmtDeg(sp.lon)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {gender}: {m.native} is the native, {m.spouse} the {m.gender === "female" ? "husband" : m.gender === "male" ? "wife" : "spouse"}. No house lords; the two karakas are read against each other.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge variant="secondary" className="no-default-hover-elevate mr-1.5 font-normal" data-testid="badge-marriage-promise">
            {PROMISE_LABEL[m.promised]}
          </Badge>
          {m.headline}
        </p>
        {m.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
            {m.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground" data-testid="text-marriage-window">
          Triggers: Jupiter over {m.spouseSign} (full) or its trines {m.triggerSigns.slice(1).join(", ")} (three-quarter).
          {win
            ? ` Next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}

const CHILD_PROMISE_LABEL: Record<ChildrenReading["promised"], string> = {
  strong: "Promised, strong",
  moderate: "Promised, moderate",
  weak: "Promised, lesser strength",
  faint: "Faint signature",
  unsigned: "No Venus signature",
};

function ChildrenCard({ c, positions, transits, asOf, birthIso }: { c: ChildrenReading; positions: PlanetPosition[]; transits: ChartResult["transits"]; asOf: string; birthIso: string }) {
  const ju = positions.find((x) => x.planet === "Jupiter")!;
  const win = nextChildWindow(c, transits, asOf.slice(0, 10), birthIso);
  const counted = c.inFifth.length + c.aspectingFifth.length;
  return (
    <Card data-testid="card-children">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span className="text-primary">Jupiter</span> · Putra karaka · children
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            5th from Jupiter: {c.fifthSign}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          No 5th lord: children are read from Jupiter in both charts, promise from his link with Venus, count and sex from the planets in and aspecting the 5th from Jupiter ({ju.sign} → {c.fifthSign}).
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <Badge variant="secondary" className="no-default-hover-elevate mr-1.5 font-normal" data-testid="badge-children-promise">
            {CHILD_PROMISE_LABEL[c.promised]}
          </Badge>
          {c.headline}
        </p>
        {counted > 0 && (
          <p className="mt-2 text-sm leading-relaxed" data-testid="text-children-count">
            Count from the 5th: {counted} planet{counted === 1 ? "" : "s"} → {c.sons} son{c.sons === 1 ? "" : "s"}, {c.daughters} daughter{c.daughters === 1 ? "" : "s"}
            {c.undecided.filter((p) => p === "Rahu" || p === "Ketu").length ? `, ${c.undecided.filter((p) => p === "Rahu" || p === "Ketu").join(" and ")} left open` : ""}
            {c.undecided.filter((p) => p === "Mercury" || p === "Saturn").length ? ` (${c.undecided.filter((p) => p === "Mercury" || p === "Saturn").join(", ")} by sign parity)` : ""}. Read as an upper bound, not a promise.
          </p>
        )}
        {c.notes.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
            {c.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground" data-testid="text-children-window">
          Triggers: Jupiter's return over {c.karakaSign}, or his passage over {c.fifthSign} and its trine {c.triggerSigns.filter((x) => x !== c.karakaSign && x !== c.fifthSign).join(", ")}.
          {win
            ? ` Next (from age 18): Jupiter ${win.kind === "return" ? "returns to" : win.kind === "fifth" ? "over the 5th," : "in trine,"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function ScoreDots({ score }: { score: number }) {
  const n = Math.max(1, Math.min(3, Math.round(score)));
  return (
    <span className="inline-flex gap-0.5" aria-label={`strength ${n} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= n ? "bg-foreground" : "bg-border")} />
      ))}
    </span>
  );
}

function Reading({ result, selected }: { result: ChartResult; selected: Planet | null }) {
  const { reading, positions } = result;
  const grouped = useMemo(() => {
    const g = new Map<LifeArea, Finding[]>();
    for (const f of reading.findings) {
      if (selected && !f.planets.includes(selected)) continue;
      g.set(f.area, [...(g.get(f.area) ?? []), f]);
    }
    return g;
  }, [reading, selected]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <KarakaCard title={reading.roles.gender === "female" ? "Jeeva karaka · the native (female chart)" : "Jeeva karaka · the native"} planet={reading.roles.native} data={reading.jeeva} positions={positions} tone="jeeva" />
        <KarakaCard title="Karma karaka · the profession" planet="Saturn" data={reading.karma} positions={positions} tone="karma" />
        <div className="lg:col-span-2">
          <MarriageCard m={reading.marriage} positions={positions} transits={result.transits} asOf={result.now.asOf} />
        </div>
        <div className="lg:col-span-2">
          <ChildrenCard c={reading.children} positions={positions} transits={result.transits} asOf={result.now.asOf} birthIso={result.utc} />
        </div>
      </div>

      <StrengthNotes strength={reading.strength} chains={reading.chains} selected={selected} />

      {selected && (
        <p className="text-sm text-muted-foreground">
          Showing findings that involve <span className="font-medium text-foreground">{selected}</span>. Click the row again to clear.
        </p>
      )}

      {(Object.keys(LIFE_AREAS) as LifeArea[]).map((area) => {
        const items = grouped.get(area);
        if (!items?.length) return null;
        return (
          <section key={area} aria-labelledby={`area-${area}`}>
            <div className="flex items-baseline justify-between border-b pb-2">
              <h3 id={`area-${area}`} className="text-base font-semibold">
                {LIFE_AREAS[area].label}
              </h3>
              <span className="text-xs text-muted-foreground">karaka {areaKaraka(area, reading.roles.gender)}</span>
            </div>
            <ul className="mt-3 space-y-3">
              {items.map((f) => (
                <li key={f.ruleId} className="grid grid-cols-[auto_1fr] gap-x-3 text-sm" data-testid={`finding-${f.ruleId}`}>
                  <div className="pt-1.5">
                    <ScoreDots score={f.score} />
                  </div>
                  <div>
                    <p className="leading-relaxed">{f.text}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.planets.join(" · ")}
                      {f.relation && ` — ${RELATION_LABEL[f.relation]}`}
                      {f.house && ` — in the ${ordinal(f.house)} from ${f.planets[0]}`}
                      {f.viaRetro && " (via retrogression)"}
                      {f.modifier && ` · ${f.modifier}`}
                      {f.source && ` · ${f.source}`}
                    </p>
                    {f.flow && (
                      <p className="mt-0.5 text-xs text-muted-foreground" title={flowGloss(f.flow)}>
                        <span className="font-medium text-foreground/80">{f.flow.from} ahead</span> → {f.flow.to}
                        {f.flow.tier !== "sign" ? ` · ${tierLabel(f.flow.tier)}` : ""}{f.flow.approach === "closing" ? " · closing" : ""}: {GIVES[f.flow.from]} colour {RECEIVES[f.flow.to]}.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function StrengthNotes({ strength, chains, selected }: { strength: PlanetStrength[]; chains: DegreeChain[]; selected: Planet | null }) {
  const rows = strength.filter((s) => s.notes.length && (!selected || s.planet === selected));
  const shownChains = chains.filter((c) => !selected || c.order.some((p) => p.planet === selected));
  if (!rows.length && !shownChains.length) return null;
  return (
    <section aria-labelledby="strength-heading" data-testid="section-strength">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h3 id="strength-heading" className="text-base font-semibold">
          Planetary strength
        </h3>
        <span className="text-xs text-muted-foreground">Rao's basic rules · Naik</span>
      </div>
      <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map((s) => (
          <li key={s.planet} className="grid grid-cols-[4.5rem_1fr] gap-x-2" data-testid={`strength-${s.planet}`}>
            <span className={cn("font-medium", s.planet === "Jupiter" && "text-primary", s.planet === "Saturn" && "text-[hsl(var(--chart-2))]")}>{s.planet}</span>
            <span className="text-muted-foreground">
              {s.notes.map((n, i) => (
                <span key={i} className="block leading-relaxed">
                  {n}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {shownChains.length > 0 && (
        <div className="mt-4" data-testid="section-chains">
          <h4 className="text-sm font-medium">Degree order by direction</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The three signs of a trine are one direction and their planets are read as one combination in degree order: the planet ahead hands its matters to the one behind (Rao, rule 1).
            Bonds within one pada are the tightest; across signs, planets within a degree stand "at the same degree". Direct planets move to higher degrees, retrograde ones and the nodes to
            lower, so a closing pair binds more strongly than a separating one. A retrograde planet keeps its place by degree but is also entered, at half strength, in the direction of
            its previous sign; Rahu and Ketu are always retrograde, so this rule does not apply to them.
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {shownChains.map((c) => (
              <li key={c.direction} className="grid grid-cols-[4.5rem_1fr] gap-x-2" data-testid={`chain-${c.direction}`}>
                <span>
                  <span className="block font-medium">{c.direction}</span>
                  <span className="block text-xs text-muted-foreground">{c.signs.map((sg) => sg.slice(0, 3)).join(" ")}</span>
                </span>
                <span>
                  <span className="tabular">
                    {c.order.map((p, i) => (
                      <span key={p.planet}>
                        {i > 0 && <span className="text-muted-foreground"> › </span>}
                        <span className={cn("font-medium", p.viaRetro && "opacity-70", p.planet === "Jupiter" && "text-primary", p.planet === "Saturn" && "text-[hsl(var(--chart-2))]")}>
                          {p.planet}
                          {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? <sup className="ml-0.5 text-[0.65em]">R</sup> : null}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {fmtDegShort(p.degInSign)}
                          {c.signs.length > 1 || p.viaRetro ? ` ${p.sign.slice(0, 3)}` : ""}
                          {p.viaRetro ? <span className="ml-1 rounded-sm border border-border px-1 text-[0.7em] align-middle" title="Read here from its previous sign by retrogression, at half strength">by retro</span> : null}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {c.links.map((l) => (
                      <span key={`${l.from}-${l.to}`} className="block">
                        {l.from} → {l.to} ({tierLabel(l.tier)}, {approachLabel(l.approach)}{l.viaRetro ? ", by retrogression at half strength" : ""}): {GIVES[l.from]} colour {RECEIVES[l.to]}.
                      </span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const HOUSE_CLASS_TONE: Record<HouseClass, string> = {
  best: "border-primary/40 text-primary",
  good: "border-foreground/30 text-foreground/80",
  middling: "border-border text-muted-foreground",
  adverse: "border-destructive/40 text-destructive",
};

const HOUSE_KARAKAS: Planet[] = ["Jupiter", "Saturn", "Venus"];

function HousesPanel({ positions, karaka, native, onChange, selected }: { positions: PlanetPosition[]; karaka: Planet; native: Planet; onChange: (p: Planet) => void; selected: Planet | null }) {
  const houses = housesFrom(positions, karaka);
  if (!houses.length) return null;
  const roleWord = karaka === native ? "the native" : karaka === "Saturn" ? "the work" : karaka === "Venus" ? "the spouse" : "the life force";
  return (
    <section className="mt-6" data-testid="section-houses">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Houses from {karaka}</h3>
        <div className="flex gap-1" role="group" aria-label="Count houses from">
          {HOUSE_KARAKAS.map((k) => (
            <Button key={k} size="sm" variant={k === karaka ? "secondary" : "ghost"} onClick={() => onChange(k)} data-testid={`house-from-${k}`}>
              {k}
              {k === native ? <span className="ml-1 text-[0.7em] text-muted-foreground">Jeeva</span> : null}
            </Button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Whole signs counted from {karaka}'s rashi as the 1st: {roleWord} is the reference, not the ascendant, and {karaka}'s degree moves no boundary. Trines are best, quadrants good,
        the 6th, 8th and 12th adverse; 2, 3 and 11 not so good.
      </p>
      <ul className="mt-3 divide-y divide-border text-sm">
        {houses.map((h) => {
          const dim = selected && !h.planets.includes(selected) && h.house !== 1;
          return (
            <li key={h.house} className={cn("grid grid-cols-[1.5rem_2.5rem_1fr] gap-x-2 py-1.5", dim && "opacity-50", h.planets.length === 0 && !dim && "opacity-75")} data-testid={`house-${h.house}`}>
              <span className={cn("tabular font-semibold", h.house === 1 && "text-primary")}>{h.house}</span>
              <span className="text-muted-foreground">{h.sign.slice(0, 3)}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{h.house === 1 ? [karaka, ...h.planets].join(", ") : h.planets.length ? h.planets.join(", ") : <span className="font-normal text-muted-foreground">empty</span>}</span>
                  <span className={cn("rounded-sm border px-1 text-[0.68rem] leading-4", HOUSE_CLASS_TONE[h.cls])}>{HOUSE_CLASS_LABEL[h.cls]}</span>
                </span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{h.meaning}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const REL_ABBR: Record<string, string> = { conjunct: "C", next: "2", prev: "12", trine: "T", opposite: "7", none: "" };

function Relations({ relations, positions }: { relations: PairRelation[]; positions: PlanetPosition[] }) {
  const lookup = new Map(relations.map((r) => [`${r.subject}|${r.object}`, r]));
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Row planet is the subject; column planet is the object. C conjunct · 2 object is in the 2nd sign ahead · 12 object is in the 12th behind · T trine · 7 opposite. An asterisk marks a link that only
        exists through the retrograde rule (a retrograde planet also acts from the previous sign).
      </p>
      <div className="overflow-x-auto">
        <table className="tabular w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-muted-foreground">from ↓ to →</th>
              {PLANETS.map((p) => (
                <th key={p} className="p-2 text-center text-xs font-medium">
                  {PLANET_ABBR[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((s) => (
              <tr key={s} className="border-t">
                <th className="p-2 text-left font-medium">{s}</th>
                {PLANETS.map((o) => {
                  const r = lookup.get(`${s}|${o}`);
                  return (
                    <td key={o} className={cn("p-2 text-center", s === o && "bg-muted/60", r?.relation === "conjunct" && "font-semibold")} data-testid={`rel-${s}-${o}`}>
                      {s === o ? "" : r ? `${REL_ABBR[r.relation]}${r.viaRetro ? "*" : ""}` : <span className="text-muted-foreground">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((p) => {
          const links = relations.filter((r) => r.subject === p.planet);
          return (
            <Card key={p.planet}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className={cn("font-semibold", p.planet === "Jupiter" && "text-primary", p.planet === "Saturn" && "text-[hsl(var(--chart-2))]")}>{p.planet}</span>
                  <span className="text-xs text-muted-foreground">{p.sign}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {links.length === 0 && <li className="text-muted-foreground">Stands alone.</li>}
                  {links.map((r) => (
                    <li key={r.object} className="flex justify-between gap-2">
                      <span>{r.object}</span>
                      <span className="text-muted-foreground">
                        {RELATION_LABEL[r.relation]}
                        {r.viaRetro ? " *" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<ChartResult>({ queryKey: ["/api/charts", id] });
  const [selected, setSelected] = useState<Planet | null>(null);
  const [showTransit, setShowTransit] = useState(true);
  const [houseKaraka, setHouseKaraka] = useState<Planet | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,28rem)_1fr]">
          <div className="aspect-square animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            {PLANETS.map((p) => (
              <div key={p} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="text-lg font-semibold">Chart unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error)?.message ?? "Not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const { chart, positions, now } = data;
  const birthLocal = DateTime.fromISO(data.utc).setZone(chart.timezone);
  const selectedSign = selected ? positions.find((p) => p.planet === selected)?.signIndex ?? null : null;
  const transitNow = now.positions.filter((p) => p.planet === "Jupiter" || p.planet === "Saturn");

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" data-testid="text-chart-name">
            {chart.name}
          </h1>
          <p className="tabular mt-1 text-sm text-muted-foreground" data-testid="text-birth-details">
            {birthLocal.toFormat("d LLLL yyyy, HH:mm")} · {chart.place}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Badge variant="outline" className="no-default-hover-elevate tabular">
            Ayanamsa {chart.ayanamsa} {data.ayanamsaValue.toFixed(3)}°
          </Badge>
          <Badge variant="outline" className="no-default-hover-elevate">
            {chart.nodeType} node
          </Badge>
          <Badge variant="outline" className="no-default-hover-elevate">
            {chart.timezone}
          </Badge>
          <Button asChild size="sm" variant="outline" className="ml-1">
            <a href={`${API_BASE}/api/charts/${chart.id}/pdf`} target="_blank" rel="noopener noreferrer" data-testid="button-export-pdf">
              <FileDown className="h-4 w-4" />
              Export PDF
            </a>
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
        <div>
          <SouthIndianChart
            positions={positions}
            transit={showTransit ? transitNow : []}
            title={chart.name}
            subtitle={birthLocal.toFormat("d LLL yyyy · HH:mm")}
            highlightSign={selectedSign}
            jeeva={data.reading.roles.native}
            houseKaraka={houseKaraka ?? data.reading.roles.native}
            onSignClick={(s) => {
              const p = positions.find((x) => x.signIndex === s);
              setSelected(p ? (selected === p.planet ? null : p.planet) : null);
            }}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-primary">{PLANET_ABBR[data.reading.roles.native]}</span> Jeeva{data.reading.roles.gender === "female" ? " (female chart)" : ""} · <span className="font-semibold text-[hsl(var(--chart-2))]">Sa</span> Karma · ℞ retrograde · <span className="italic">tJu tSa</span> transits today
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowTransit((v) => !v)} data-testid="button-toggle-transit">
              {showTransit ? <EyeOff /> : <Eye />}
              Transits
            </Button>
          </div>
          <HousesPanel positions={positions} karaka={houseKaraka ?? data.reading.roles.native} native={data.reading.roles.native} onChange={setHouseKaraka} selected={selected} />
        </div>
        <div className="min-w-0">
          <PlanetTable positions={positions} strength={data.reading.strength} selected={selected} onSelect={setSelected} />
          <p className="mt-2 text-xs text-muted-foreground">Click a planet to focus the reading on it. Longitudes are sidereal. c combust (within the Sun's pada) · w leads an enemy by degree · struck dignity is set aside by a Nadi rule.</p>
        </div>
      </div>

      <Tabs defaultValue="reading" className="mt-10">
        <TabsList>
          <TabsTrigger value="reading" data-testid="tab-reading">
            Reading
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            Timing
          </TabsTrigger>
          <TabsTrigger value="relations" data-testid="tab-relations">
            Relations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reading" className="mt-6">
          <Reading result={data} selected={selected} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6">
          <Timeline transits={data.transits} positions={positions} findings={data.reading.findings} birthIso={data.utc} selected={selected} roles={data.reading.roles} />
        </TabsContent>
        <TabsContent value="relations" className="mt-6">
          <Relations relations={data.reading.relations} positions={positions} />
        </TabsContent>
      </Tabs>

      <footer className="mt-12 border-t pt-4 text-xs text-muted-foreground">
        Interpretive text follows the general principles of Bhrigu Nandi Nadi as taught by R.G. Rao and Satyanarayana Naik. It is a starting set of rules meant to be extended, not a verdict.
      </footer>
    </div>
  );
}
