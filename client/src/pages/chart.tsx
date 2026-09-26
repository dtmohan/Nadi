import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { ArrowLeft, Eye, EyeOff, FileDown, Orbit, Compass, Footprints, Crosshair, BookOpen, Clock, CheckCheck } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { PLANETS, PLANET_ABBR, SIGNS, fmtDeg, fmtDegShort, houseFrom, type Planet, type PlanetPosition, KARAKA } from "@shared/astro";
import { GIVES, RECEIVES, flowGloss, tierLabel, approachLabel, type DegreeChain } from "@shared/flow";
import { nextMarriageWindow, type Gender, type MarriageReading } from "@shared/marriage";
import { nextChildWindow, type ChildrenReading } from "@shared/children";
import { LIFE_AREAS, RELATION_LABEL, areaKarakaLabel, type Finding, type LifeArea, type PairRelation, type Reading as BnnReading } from "@shared/rules";
import { synthesize, toneOf, gist, firstClause, AREA_TONE_LABEL, type AreaSynthesis, type AreaTone } from "@shared/synthesis";
import { VerdictCard, type VerdictSignature, type VerdictTiming } from "@/components/verdict-card";
import { Term } from "@/components/term";
import { Working, ReadingModeToggle } from "@/components/working";
import { useReadingMode } from "@/lib/reading-mode";
import type { PlanetStrength } from "@shared/strength";
import { housesFrom, retroNotes, HOUSE_CLASS_LABEL, type HouseClass } from "@shared/houses";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { PlanetName, planetColor } from "@/components/planet-name";
import { ChartSettings } from "@/components/chart-settings";
import { JaiminiPanel } from "@/components/jaimini-panel";
import { AlpPanel } from "@/components/alp-panel";
import { KpPanel } from "@/components/kp-panel";
import { ParashariPanel } from "@/components/parashari-panel";
import { RectifyPanel } from "@/components/rectify-panel";
import { LifeEventsSection } from "@/components/life-events";
import { BirthTimeEditor } from "@/components/birth-time-editor";
import { ValidatePanel } from "@/components/validate-panel";
import { Timeline, BnnLifeTimeline } from "@/components/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { chartsStore } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";

const CLASSICAL = new Set<Planet>(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);

function PlanetTable({ positions, strength, selected, onSelect }: { positions: PlanetPosition[]; strength: PlanetStrength[]; selected: Planet | null; onSelect: (p: Planet | null) => void }) {
  const stOf = (p: Planet) => strength.find((x) => x.planet === p);
  return (
    <Table className="tabular" cards>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(selected === p.planet ? null : p.planet);
              }
            }}
            tabIndex={0}
            aria-selected={selected === p.planet}
            className={cn("cursor-pointer", selected === p.planet && "bg-primary/10")}
            data-testid={`row-planet-${p.planet}`}
          >
            <TableCell className="whitespace-nowrap py-2">
              <PlanetName planet={p.planet} tone className="font-medium" />
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
            <TableCell className="whitespace-nowrap py-2">{p.sign}</TableCell>
            <TableCell className="py-2 text-right text-muted-foreground">{fmtDeg(p.lon)}</TableCell>
            <TableCell className="hidden whitespace-nowrap py-2 sm:table-cell">
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

function KarakaCard({ title, planet, data, positions, tone }: { title: string; planet: Planet; data: ChartResult["reading"]["jeeva"]; positions: PlanetPosition[]; tone: "jeeva" | "karma" | "deha" }) {
  const p = positions.find((x) => x.planet === planet)!;
  return (
    <Card data-testid={`card-${tone}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span style={{ color: planetColor(planet) }}>{planet}</span> · {title}
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {p.sign} {fmtDeg(p.lon)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(tone === "deha" ? ["her person", "body", "charm", "comforts", "arts", "finance"] : KARAKA[planet].significations).map((s) => (
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
            <span style={{ color: planetColor(m.spouse) }}>{m.spouse}</span> · Kalatra karaka · marriage
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {sp.sign} {fmtDeg(sp.lon)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {gender}: {m.native} is the native{m.gender === "female" ? " as a person (Deha)" : ""}, {m.spouse} the {m.gender === "female" ? "husband" : m.gender === "male" ? "wife" : "spouse"}. No house lords; the two karakas are read against each other.
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
            <span style={{ color: planetColor("Jupiter") }}>Jupiter</span> · Putra karaka · children
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

const TONE_CLASS: Record<AreaTone, string> = {
  supportive: "border-verdict-good/40 text-verdict-good",
  mixed: "border-verdict-mixed/40 text-verdict-mixed",
  care: "border-verdict-bad/40 text-verdict-bad",
  quiet: "border-border text-muted-foreground",
};

/** Relation of each companion to the subject, so "Saturn · Mercury · Rahu" says which is conjunct and which in trine. */
function companionLabels(f: Finding, relations: PairRelation[]): string {
  if (f.planets.length < 3) return f.planets.join(" · ") + (f.relation ? ` — ${RELATION_LABEL[f.relation]}` : "");
  const [subject, ...rest] = f.planets;
  return `${subject} · ${rest
    .map((p) => {
      const r = relations.find((x) => x.subject === subject && x.object === p);
      return r ? `${p} (${RELATION_LABEL[r.relation]})` : p;
    })
    .join(" · ")}`;
}

function FindingMeta({ f, relations, coveredBy }: { f: Finding; relations: PairRelation[]; coveredBy?: string }) {
  return (
    <>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {companionLabels(f, relations)}
        {f.house && ` — in the ${ordinal(f.house)} from ${f.planets[0]}`}
        {f.viaRetro && " (via retrogression)"}
        {f.modifier && ` · ${f.modifier}`}
        {f.source && ` · ${f.source}`}
        {coveredBy && <span className="italic"> · said within the combination above</span>}
      </p>
      {f.flow && (
        <p className="mt-0.5 text-xs text-muted-foreground" title={flowGloss(f.flow)}>
          <span className="font-medium text-foreground/80">{f.flow.from} ahead</span> → {f.flow.to}
          {f.flow.tier !== "sign" ? ` · ${tierLabel(f.flow.tier)}` : ""}{f.flow.approach === "closing" ? " · closing" : ""}: {GIVES[f.flow.from]} colour {RECEIVES[f.flow.to]}.
        </p>
      )}
    </>
  );
}

function FindingItem({ f, relations, full, coveredBy }: { f: Finding; relations: PairRelation[]; full: boolean; coveredBy?: string }) {
  const tone = toneOf(f);
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-3 text-sm" data-testid={`finding-${f.ruleId}`}>
      <div className="pt-1.5">
        <ScoreDots score={f.score} />
      </div>
      <div className={cn(coveredBy && "text-muted-foreground")}>
        <p className="leading-relaxed">
          {f.text}
          {!full && f.source && (
            <span className="ml-1.5 text-xs text-muted-foreground" title={`${f.planets.join(", ")}${f.relation ? `, ${RELATION_LABEL[f.relation]}` : ""}`}>
              {f.source.split(/[,(]/)[0].trim()}
            </span>
          )}
        </p>
        {full && <FindingMeta f={f} relations={relations} coveredBy={coveredBy} />}
        {!full && tone !== "neutral" && <span className="sr-only">{tone === "good" ? "supportive" : "caution"}</span>}
      </div>
    </li>
  );
}

function AreaSection({ s, reading, gender }: { s: AreaSynthesis; reading: BnnReading; gender: Gender }) {
  const { mode } = useReadingMode();
  const full = mode === "practitioner";
  const area = s.area;
  return (
    <section aria-labelledby={`area-${area}`} data-testid={`section-area-${area}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
        <h3 id={`area-${area}`} className="text-base font-semibold">
          {LIFE_AREAS[area].label}
          <Badge variant="outline" className={cn("no-default-hover-elevate ml-2 align-middle font-normal", TONE_CLASS[s.tone])} data-testid={`badge-tone-${area}`}>
            {AREA_TONE_LABEL[s.tone]}
          </Badge>
        </h3>
        <span className="text-xs text-muted-foreground">
          <Term k="karaka">karaka</Term> {areaKarakaLabel(area, gender as Gender)}
          {full && <span className="tabular"> · balance {s.balance > 0 ? "+" : ""}{s.balance} · {s.total} findings</span>}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed" data-testid={`text-verdict-${area}`}>
        {s.headline}
      </p>
      {s.reconciliation && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground" data-testid={`text-reconcile-${area}`}>
          {s.reconciliation}
        </p>
      )}
      <ul className="mt-3 space-y-3">
        {s.key.map((f) => (
          <FindingItem key={f.ruleId} f={f} relations={reading.relations} full={full} />
        ))}
      </ul>
      {s.rest.length > 0 && (
        <Working id={area} label="Show the working" count={s.rest.length} className="mt-3">
          <ul className="space-y-3">
            {s.rest.map((f) => (
              <FindingItem key={f.ruleId} f={f} relations={reading.relations} full coveredBy={s.coveredBy[f.ruleId]} />
            ))}
          </ul>
        </Working>
      )}
    </section>
  );
}

const AREA_SHORT: Record<LifeArea, string> = {
  self: "temperament",
  career: "career",
  marriage: "marriage",
  children: "children",
  wealth: "wealth",
  education: "learning",
  family: "family",
  health: "health",
  spirituality: "the inner life",
  travel: "travel",
};

const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const fmtMY = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

/** The BNN answer, first: what the Nadi rules conclude across the life areas, the three strongest signatures and the timing that matters next. */
function BnnVerdict({ result }: { result: ChartResult }) {
  const { reading, chart, transits, now } = result;
  const gender = chart.gender as Gender;
  const areas = useMemo(() => synthesize(reading, gender), [reading, gender]);
  const asOf = now.asOf.slice(0, 10);

  // Lead with the three firmest areas and every area that needs care; the rest is "mixed" in one word.
  const firmAll = areas.filter((a) => a.tone === "supportive").sort((x, y) => y.balance - x.balance);
  const firm = firmAll.slice(0, 3).map((a) => AREA_SHORT[a.area]);
  const careAll = areas.filter((a) => a.tone === "care").sort((x, y) => x.balance - y.balance).map((a) => AREA_SHORT[a.area]);
  const care = careAll.slice(0, 3);
  const careMore = careAll.length - care.length;
  const mixedN = areas.filter((a) => a.tone === "mixed").length + Math.max(0, firmAll.length - 3);
  const parts: string[] = [];
  if (firm.length) parts.push(`${joinList(firm)} ${firm.length === 1 ? "rests" : "rest"} on firm ground`);
  if (care.length) parts.push(`${joinList(careMore > 0 ? [...care, `${careMore} more`] : care)} ${care.length === 1 ? "needs" : "need"} care`);
  if (mixedN) parts.push(parts.length ? "the rest is mixed" : "every area is mixed");
  const headline = parts.length ? parts.join("; ").replace(/^./, (c) => c.toUpperCase()) + "." : "The Nadi rules mark no area strongly in this chart.";
  const jeevaP = result.positions.find((p) => p.planet === reading.roles.native);
  const lead = `${reading.roles.native}, the life force, stands in ${reading.jeeva.sign}${reading.jeeva.companions.length ? ` with ${joinList(reading.jeeva.companions)}` : " alone"}${reading.jeeva.retro ? ", retrograde" : ""}${jeevaP ? ` at ${fmtDeg(jeevaP.lon)}` : ""}.${reading.deha ? ` ${reading.roles.deha}, her own person, stands in ${reading.deha.sign}${reading.deha.companions.length ? ` with ${joinList(reading.deha.companions)}` : ""}.` : ""} Saturn, the work, is in ${reading.karma.sign}.`;

  const signatures: VerdictSignature[] = useMemo(() => {
    // One signature per life area, the areas that are marked most strongly first, and no rule twice.
    const seen = new Set<string>();
    const usedArea = new Set<LifeArea>();
    // A supportive area is carried by a supportive finding, an area needing care by a hard one; mixed areas take their strongest.
    const fits = (a: AreaSynthesis, f: Finding) => (a.tone === "supportive" ? toneOf(f) !== "hard" : a.tone === "care" ? toneOf(f) !== "good" : true);
    const all = areas.flatMap((a) => a.key.filter((f) => fits(a, f)).map((f) => ({ f, area: a.area, ab: Math.abs(a.balance) })));
    const spoken = (f: Finding) => (toneOf(f) === "neutral" ? 0 : 1);
    all.sort((x, y) => y.ab - x.ab || spoken(y.f) - spoken(x.f) || Math.abs(y.f.score) - Math.abs(x.f.score));
    const out: VerdictSignature[] = [];
    for (const { f, area } of all) {
      if (seen.has(f.ruleId) || usedArea.has(area) || out.length >= 3) continue;
      seen.add(f.ruleId);
      usedArea.add(area);
      const t = toneOf(f);
      out.push({ planets: f.planets, label: LIFE_AREAS[area].label.split(" & ")[0], text: firstClause(gist(f.text)), tone: t === "good" ? "good" : t === "hard" ? "bad" : "neutral" });
    }
    return out;
  }, [areas]);

  const timing: VerdictTiming[] = [];
  const ju = transits.find((t) => t.planet === "Jupiter" && t.start <= asOf && asOf < t.end);
  if (ju) timing.push({ label: "Now", when: "present", text: <>Jupiter moves through {ju.sign} until {fmtMY(ju.end)}</> });
  if (reading.marriage.promised !== "absent") {
    const w = nextMarriageWindow(reading.marriage, transits, asOf);
    if (w) timing.push({ label: "Marriage", when: w.period.start <= asOf ? "present" : "future", text: <>Jupiter {w.kind === "over" ? "over" : "in trine from"} {w.period.sign}, {fmtMY(w.period.start)} to {fmtMY(w.period.end)}</> });
  }
  if (reading.children.promised !== "unsigned") {
    const w = nextChildWindow(reading.children, transits, asOf, result.utc);
    if (w) timing.push({ label: "Children", when: w.period.start <= asOf ? "present" : "future", text: <>Jupiter {w.kind === "return" ? "returns to" : w.kind === "fifth" ? "reaches the 5th from" : "trines"} {w.period.sign}, {fmtMY(w.period.start)} to {fmtMY(w.period.end)}</> });
  }

  const lines = [
    { label: `${reading.roles.native} · Jeeva`, text: reading.jeeva.summary },
    ...(reading.deha ? [{ label: `${reading.roles.deha} · Deha`, text: reading.deha.summary }] : []),
    { label: "Saturn · Karma", text: reading.karma.summary },
    { label: "Marriage", text: `${PROMISE_LABEL[reading.marriage.promised]}, read between ${reading.roles.deha} and ${reading.roles.spouse}.` },
    { label: "Children", text: `${CHILD_PROMISE_LABEL[reading.children.promised]}.` },
    { label: "Rules", text: `${reading.findings.length} Nadi rules fire on this chart across ${areas.filter((a) => a.total > 0).length} life areas; each area below opens with its balance, then the signatures that carry it.` },
  ];

  return (
    <VerdictCard
      system="Bhrigu Nandi Nadi"
      headline={headline}
      lead={lead}
      signatures={signatures}
      timing={timing}
      lines={lines}
      caveat="A starting set of Nadi rules after R.G. Rao and Satyanarayana Naik, weighed by sign relation and degree order. A reading, not a verdict."
      testid="bnn-verdict"
      className="mt-8"
    />
  );
}

function Reading({ result, selected }: { result: ChartResult; selected: Planet | null }) {
  const { reading, positions, chart } = result;
  const { mode } = useReadingMode();
  const areas = useMemo(() => {
    const findings = selected ? reading.findings.filter((f) => f.planets.includes(selected)) : reading.findings;
    return synthesize(reading, chart.gender as Gender, findings);
  }, [reading, selected, chart.gender]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        <KarakaCard title={reading.roles.gender === "female" ? "Jeeva karaka · the life force (both charts)" : "Jeeva karaka · the native"} planet={reading.roles.native} data={reading.jeeva} positions={positions} tone="jeeva" />
        <KarakaCard title="Karma karaka · the profession" planet="Saturn" data={reading.karma} positions={positions} tone="karma" />
        {reading.deha && (
          <div className="lg:col-span-2">
            <KarakaCard title="Deha karaka · the native herself (female chart)" planet={reading.roles.deha} data={reading.deha} positions={positions} tone="deha" />
          </div>
        )}
        <div className="lg:col-span-2">
          <MarriageCard m={reading.marriage} positions={positions} transits={result.transits} asOf={result.now.asOf} />
        </div>
        <div className="lg:col-span-2">
          <ChildrenCard c={reading.children} positions={positions} transits={result.transits} asOf={result.now.asOf} birthIso={result.utc} />
        </div>
      </div>

      <Working id="strength" label="Show planetary strength and degree order">
        <StrengthNotes strength={reading.strength} chains={reading.chains} selected={selected} />
      </Working>

      {selected && (
        <p className="text-sm text-muted-foreground">
          Showing findings that involve <span className="font-medium text-foreground">{selected}</span>. Click the row again to clear.
        </p>
      )}

      {mode === "plain" && (
        <p className="text-xs text-muted-foreground" data-testid="text-plain-note">
          Each area opens with the balance of what the Nadi rules say, then the two or three signatures that carry it. "Show the working" lists every rule that fired, with its source.
        </p>
      )}

      {areas.map((s) => (
        <AreaSection key={s.area} s={s} reading={reading} gender={chart.gender as Gender} />
      ))}
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
            <PlanetName planet={s.planet} tone className="font-medium" />
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
                        <span className={cn("font-medium", p.viaRetro && "opacity-70")} style={{ color: planetColor(p.planet) }}>
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

function HousesPanel({ positions, karaka, native, deha, onChange, selected }: { positions: PlanetPosition[]; karaka: Planet; native: Planet; deha: Planet; onChange: (p: Planet) => void; selected: Planet | null }) {
  const houses = housesFrom(positions, karaka);
  if (!houses.length) return null;
  const stayPut = retroNotes(positions, karaka);
  const female = deha !== native;
  const roleWord = karaka === native ? "the life force" : karaka === "Saturn" ? "the work" : female ? "the native herself" : "the spouse";
  return (
    <section className="mt-6" data-testid="section-houses">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Houses from {karaka}</h3>
        <div className="flex gap-1" role="group" aria-label="Count houses from">
          {HOUSE_KARAKAS.map((k) => (
            <Button key={k} size="sm" variant={k === karaka ? "secondary" : "ghost"} onClick={() => onChange(k)} data-testid={`house-from-${k}`}>
              {k}
              {k === native ? <span className="ml-1 text-[0.7em] text-muted-foreground">Jeeva</span> : female && k === deha ? <span className="ml-1 text-[0.7em] text-muted-foreground">Deha</span> : null}
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
                  {h.viaRetro.length > 0 && (
                    <span className="text-xs text-muted-foreground" data-testid={`house-${h.house}-retro`}>
                      + {h.viaRetro.join(", ")} by retro, half strength
                    </span>
                  )}
                  <span className={cn("rounded-sm border px-1 text-[0.68rem] leading-4", HOUSE_CLASS_TONE[h.cls])}>{HOUSE_CLASS_LABEL[h.cls]}</span>
                </span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{h.meaning}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {stayPut.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="houses-retro-note">
          {stayPut.map((n) => `${n.planet} is retrograde but stays in the ${ordinal(n.house)}: ${n.reason}.`).join(" ")} A retrograde planet's own house is always read at full strength.
        </p>
      )}
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
                  <PlanetName planet={p.planet} tone className="font-semibold" />
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

type SystemMode = "bnn" | "jaimini" | "alp" | "kp" | "parashari" | "rectify" | "validate";

/** The seven tabs, in order; the last two are tools rather than reading systems and are set apart in both bars. */
const MODES: { id: SystemMode; label: string; short: string; title?: string; tool?: boolean; Icon: typeof Orbit }[] = [
  { id: "bnn", label: "Bhrigu Nandi Nadi", short: "Nadi", Icon: Orbit },
  { id: "jaimini", label: "Jaimini", short: "Jaimini", Icon: Compass },
  { id: "alp", label: "ALP", short: "ALP", title: "Akshaya Lagna Paddhati", Icon: Footprints },
  { id: "kp", label: "KP", short: "KP", title: "Krishnamurti Paddhati", Icon: Crosshair },
  { id: "parashari", label: "Parashari", short: "Parashari", title: "Brihat Parashara Hora Sastra", Icon: BookOpen },
  { id: "rectify", label: "Rectify", short: "Rectify", title: "Birth time rectification", tool: true, Icon: Clock },
  { id: "validate", label: "Validate", short: "Validate", title: "Check the chart against saved life events", tool: true, Icon: CheckCheck },
];

export default function ChartPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<ChartResult>({
    queryKey: ["chart-result", id],
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser");
      const result = (await (await apiRequest("POST", "/api/compute", chart)).json()) as ChartResult;
      return { ...result, chart };
    },
  });
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const res = await apiRequest("POST", "/api/pdf", data.chart);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nadi-${data.chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "Could not export PDF", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };
  const [selected, setSelected] = useState<Planet | null>(null);
  const [showTransit, setShowTransit] = useState(true);
  const [houseKaraka, setHouseKaraka] = useState<Planet | null>(null);
  const [mode, setMode] = useState<SystemMode>("bnn");
  const tablistRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Keep the selected system tab in view when the strip scrolls horizontally on narrow screens.
    const list = tablistRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-testid="mode-${mode}"]`);
    if (!list || !el) return;
    const left = el.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + el.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
  }, [mode]);
  const { mode: readingMode } = useReadingMode();

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
    <div className="mx-auto max-w-6xl px-5 py-8 pb-24 md:px-10 md:pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" data-testid="text-chart-name">
            {chart.name}
          </h1>
          <BirthTimeEditor chart={chart} birthLocal={birthLocal} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <ChartSettings chart={chart} ayanamsaValue={data.ayanamsaValue} />
          <Button size="sm" variant="outline" onClick={exportPdf} disabled={exporting} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4" />
            {exporting ? "Preparing PDF" : "Export PDF"}
          </Button>
        </div>
      </header>

      <LifeEventsSection chart={chart} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div role="tablist" aria-label="Reading system" className="inline-flex max-w-full overflow-x-auto whitespace-nowrap rounded-md border p-0.5 text-sm" ref={tablistRef}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn("rounded px-3 py-1 transition-colors", m.id === "rectify" && "ml-1 border-l", mode === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              data-testid={`mode-${m.id}`}
              title={m.title}
            >
              <span className="sm:hidden">{m.short}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite" data-testid="mode-current">{MODES.find((m) => m.id === mode)?.title ?? MODES.find((m) => m.id === mode)?.label}</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">{mode === "bnn" ? "Planet-to-planet reading, no ascendant or houses." : mode === "jaimini" ? (readingMode === "plain" ? "Jaimini's method: the planets ranked into roles, how each house appears to the world, life periods by sign. Kept separate from the Nadi reading." : "Ascendant-based: karakas, padas, navamsa and Chara dasha. Kept separate from the Nadi reading.") : mode === "alp" ? (readingMode === "plain" ? "A moving rising point: it advances one sign every ten years and the birth planets are read from where it stands now. Framework stage." : "Progressed lagna: the ascendant moves ten years to a sign and the natal planets are read from where it stands now. Framework stage.") : mode === "parashari" ? (readingMode === "plain" ? "The classical system: which planets help or hinder this rising sign, how strong they are, the notable combinations, and the life period running now. Kept separate from the other readings." : "Parashara's system: whole-sign bhavas from the lagna, house lords, sign aspects, functional nature by rising sign, Shadbala, vargas, Ashtakavarga, yogas and Vimshottari with dasa effects. Kept separate from the other readings. First pass.") : mode === "rectify" ? (readingMode === "plain" ? "Checking the birth time: the minutes around the recorded time, scored by one method at a time. Not a reading." : "Birth time rectification: candidate intervals around the recorded time, scored by one method at a time. Not a reading.") : mode === "validate" ? "Saved life events read back at their dates: KP period lords and cusp promise, Jaimini chara dasha, Jupiter's transit, and how each planet's periods turned out. Not a reading." : (readingMode === "plain" ? "Krishnamurti's method: each house has a deciding planet, houses are promised or denied, and timing comes from the planetary periods. Kept separate from the other readings. First pass." : "Stellar method: Placidus cusps, star and sub lords, significators and Vimshottari timing. KP ayanamsa. First pass.")}</p>
          <ReadingModeToggle />
        </div>
      </div>

      {mode === "jaimini" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <JaiminiPanel result={data} />
        </div>
      )}

      {mode === "alp" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <AlpPanel result={data} />
        </div>
      )}

      {mode === "kp" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <KpPanel result={data} />
        </div>
      )}

      {mode === "parashari" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <ParashariPanel result={data} />
        </div>
      )}

      {mode === "rectify" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <RectifyPanel result={data} />
        </div>
      )}

      {mode === "validate" && (
        <div className="mt-8 animate-in fade-in-0 duration-300">
          <ValidatePanel result={data} />
        </div>
      )}

      {mode === "bnn" && (
      <div className="animate-in fade-in-0 duration-300">
      <BnnVerdict result={data} />
      <BnnLifeTimeline className="mt-6" transits={data.transits} positions={positions} findings={data.reading.findings} birthIso={data.utc} roles={data.reading.roles} asOfIso={data.now.asOf} events={data.chart.events} zone={data.chart.timezone} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,27rem)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto lg:pr-1" data-testid="bnn-chart-column">
          <SouthIndianChart
            positions={positions}
            transit={showTransit ? transitNow : []}
            title="Rasi"
            subtitle={`${PLANET_ABBR[data.reading.roles.native]} Jeeva · Sa Karma${data.reading.roles.deha !== data.reading.roles.native ? ` · ${PLANET_ABBR[data.reading.roles.deha]} Deha` : ""}`}
            highlightSign={selectedSign}
            secondarySigns={selectedSign === null ? undefined : [(selectedSign + 4) % 12, (selectedSign + 8) % 12, (selectedSign + 6) % 12]}
            jeeva={data.reading.roles.native}
            deha={data.reading.roles.deha !== data.reading.roles.native ? data.reading.roles.deha : undefined}
            houseKaraka={houseKaraka ?? data.reading.roles.native}
            onSignClick={(s) => {
              const p = positions.find((x) => x.signIndex === s);
              setSelected(p ? (selected === p.planet ? null : p.planet) : null);
            }}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-semibold" style={{ color: planetColor(data.reading.roles.native) }}>{PLANET_ABBR[data.reading.roles.native]}</span> Jeeva · <span className="font-semibold" style={{ color: planetColor("Saturn") }}>Sa</span> Karma
              {data.reading.roles.deha !== data.reading.roles.native && (
                <>
                  {" · "}
                  <span className="font-semibold" style={{ color: planetColor(data.reading.roles.deha) }}>{PLANET_ABBR[data.reading.roles.deha]}</span> Deha (female chart)
                </>
              )}{" "}
              · R retrograde · <span className="italic">tJu tSa</span> transits today · click a sign for its trines and 7th
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowTransit((v) => !v)} data-testid="button-toggle-transit">
              {showTransit ? <EyeOff /> : <Eye />}
              Transits
            </Button>
          </div>
          <Working id="houses" label="Show the twelve houses from the karaka" className="mt-4">
            <HousesPanel positions={positions} karaka={houseKaraka ?? data.reading.roles.native} native={data.reading.roles.native} deha={data.reading.roles.deha} onChange={setHouseKaraka} selected={selected} />
          </Working>
        </div>
        <div className="min-w-0 max-w-[76ch]">
          <Working id="planet-table" label="Show the planet table" count={positions.length}>
            <PlanetTable positions={positions} strength={data.reading.strength} selected={selected} onSelect={setSelected} />
            <p className="mt-2 text-xs text-muted-foreground">
              Click a planet to focus the reading on it. Longitudes are sidereal. c <Term k="combust">combust</Term> · w leads an enemy by <Term k="degree-order">degree</Term> · struck dignity is <Term k="set-aside">set aside</Term> by a Nadi rule.
            </p>
          </Working>

      <Tabs defaultValue="reading" className="mt-8">
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
        </div>
      </div>
      </div>
      )}

      <footer className="mt-12 border-t pt-4 text-xs text-muted-foreground">
        {mode === "bnn"
          ? "Interpretive text follows the general principles of Bhrigu Nandi Nadi as taught by R.G. Rao and Satyanarayana Naik. It is a starting set of rules meant to be extended, not a verdict."
          : mode === "alp"
          ? "Akshaya Lagna Paddhati is Dr. S. Pothuvudaimoorthy's method. The progression arithmetic follows the published rate; the interpretive rules are being entered from the printed volumes chapter by chapter and are a framework, not a verdict."
          : mode === "parashari"
          ? "Parashari text is paraphrased from Brihat Parashara Hora Sastra in R. Santhanam's translation (chapters 24, 26, 34, 36, 41, 42, 75), softened and with verse numbers kept for checking. Planetary strength (ch. 27-28), divisional charts (ch. 6-7), Ashtakavarga (ch. 66-72) and the dasa chapters (46 for the conditional systems and Kalachakra, 47-49 and 52-61 for effects) are applied mechanically; the Sripati chalit, portion stages and the effect amounts of 28.15-20 are provisional readings. A first pass, not a verdict."
          : mode === "rectify" || mode === "validate"
          ? "Rectification and validation are checks, not readings. Each method scores by one system's rules at a time (KP sub lords and significators, or K.N. Rao's Chara dasha) and the systems are never blended; a high score narrows the birth time or confirms a rule, it does not prove either."
          : mode === "kp"
          ? "Krishnamurti Paddhati is Prof. K.S. Krishnamurti's stellar method. The arithmetic (KP ayanamsa, Placidus cusps, subs, significators, Vimshottari) is complete; the cuspal readings are paraphrased from Astro Secrets & KP Part 3 and the Kalpurush class notes and are a first pass, not a verdict."
          : "Jaimini text follows the Jaimini Sutras and the Upapada chapter of Brihat Parashara Hora Sastra; Chara dasha follows K.N. Rao's method. It is a starting set of rules meant to be extended, not a verdict."}
      </footer>

      <nav aria-label="Reading system" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" data-testid="mode-bar">
        <ul className="mx-auto grid max-w-md grid-cols-7">
          {MODES.map((m) => (
            <li key={m.id} className={cn("relative", m.id === "rectify" && "before:absolute before:inset-y-2 before:left-0 before:w-px before:bg-border")}>
              <button
                type="button"
                aria-current={mode === m.id ? "page" : undefined}
                onClick={() => {
                  setMode(m.id);
                  document.querySelector("main")?.scrollTo({ top: 0 });
                }}
                className={cn("flex w-full flex-col items-center gap-0.5 px-0.5 pb-2 pt-2 text-[10px] leading-none transition-colors", mode === m.id ? "text-primary" : "text-muted-foreground")}
                data-testid={`mode-bar-${m.id}`}
                title={m.title}
              >
                <m.Icon className="h-4 w-4" strokeWidth={mode === m.id ? 2.2 : 1.7} />
                <span className={cn("truncate", mode === m.id && "font-semibold")}>{m.short}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
