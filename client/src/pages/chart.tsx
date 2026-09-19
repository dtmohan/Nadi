import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { ArrowLeft, Eye, EyeOff, FileDown } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { PLANETS, PLANET_ABBR, SIGNS, fmtDeg, houseFrom, type Planet, type PlanetPosition, KARAKA } from "@shared/astro";
import { LIFE_AREAS, RELATION_LABEL, type Finding, type LifeArea, type PairRelation } from "@shared/rules";
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

function PlanetTable({ positions, selected, onSelect }: { positions: PlanetPosition[]; selected: Planet | null; onSelect: (p: Planet | null) => void }) {
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
                <span className="ml-1.5 text-xs text-muted-foreground" title="Combust">
                  c
                </span>
              )}
            </TableCell>
            <TableCell className="py-2">{p.sign}</TableCell>
            <TableCell className="py-2 text-right text-muted-foreground">{fmtDeg(p.lon)}</TableCell>
            <TableCell className="hidden py-2 sm:table-cell">
              {p.nakshatra} <span className="text-muted-foreground">{p.pada}</span>
            </TableCell>
            <TableCell className="hidden py-2 text-muted-foreground md:table-cell">{p.dignity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KarakaCard({ title, planet, data, positions }: { title: string; planet: Planet; data: ChartResult["reading"]["jeeva"]; positions: PlanetPosition[] }) {
  const p = positions.find((x) => x.planet === planet)!;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-base font-semibold">
            <span className={planet === "Jupiter" ? "text-primary" : "text-[hsl(var(--chart-2))]"}>{planet}</span> · {title}
          </h3>
          <span className="tabular text-xs text-muted-foreground">
            {p.sign} {fmtDeg(p.lon)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {KARAKA[planet].significations.map((s) => (
            <Badge key={s} variant="secondary" className="no-default-hover-elevate font-normal">
              {s}
            </Badge>
          ))}
        </div>
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
        <KarakaCard title="Jeeva karaka · the native" planet="Jupiter" data={reading.jeeva} positions={positions} />
        <KarakaCard title="Karma karaka · the profession" planet="Saturn" data={reading.karma} positions={positions} />
      </div>

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
              <span className="text-xs text-muted-foreground">karaka {LIFE_AREAS[area].karaka}</span>
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
                      {f.viaRetro && " (via retrogression)"}
                      {f.source && ` · ${f.source}`}
                    </p>
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
            onSignClick={(s) => {
              const p = positions.find((x) => x.signIndex === s);
              setSelected(p ? (selected === p.planet ? null : p.planet) : null);
            }}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-primary">Ju</span> Jeeva · <span className="font-semibold text-[hsl(var(--chart-2))]">Sa</span> Karma · ℞ retrograde · <span className="italic">tJu tSa</span> transits today
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowTransit((v) => !v)} data-testid="button-toggle-transit">
              {showTransit ? <EyeOff /> : <Eye />}
              Transits
            </Button>
          </div>
        </div>
        <div className="min-w-0">
          <PlanetTable positions={positions} selected={selected} onSelect={setSelected} />
          <p className="mt-2 text-xs text-muted-foreground">Click a planet to focus the reading on it. Longitudes are sidereal; degrees shown within the sign.</p>
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
          <Timeline transits={data.transits} positions={positions} birthIso={data.utc} />
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
