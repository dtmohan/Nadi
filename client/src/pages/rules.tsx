import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PLANETS, type Planet } from "@shared/astro";
import { LIFE_AREAS, RELATION_LABEL, type LifeArea, type Rule } from "@shared/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SHORT_REL: Record<string, string> = { conjunct: "conjunction", next: "2nd", prev: "12th", trine: "trine", opposite: "7th" };

function describeCondition(w: Rule["when"]) {
  const parts: string[] = [];
  if (w.object) parts.push(`${w.subject} → ${w.object} by ${(w.relation ?? ["conjunct"]).map((r) => SHORT_REL[r] ?? RELATION_LABEL[r]).join(", ")}`);
  else parts.push(w.subject);
  if (w.subjectRetro) parts.push("retrograde");
  if (w.subjectCombust) parts.push("combust");
  if (w.subjectDignity) parts.push(w.subjectDignity.join(" or ").toLowerCase());
  if (w.subjectSignLord) parts.push(`in a sign of ${w.subjectSignLord.join("/")}`);
  if (w.subjectElement) parts.push(`in a ${w.subjectElement.join("/").toLowerCase()} sign`);
  return parts.join(" · ");
}

export default function RulesPage() {
  const { data: rules, isLoading } = useQuery<Rule[]>({ queryKey: ["/api/rules"] });
  const [area, setArea] = useState<LifeArea | "all">("all");
  const [planet, setPlanet] = useState<Planet | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      (rules ?? []).filter(
        (r) =>
          (area === "all" || r.area === area) &&
          (planet === "all" || r.when.subject === planet || r.when.object === planet) &&
          (!q || r.text.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q.toLowerCase())),
      ),
    [rules, area, planet, q],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold tracking-tight">Rule book</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every reading is produced by these declarative rules. A rule names a subject planet, an optional object planet with the sign relations that count, and conditions on retrogression,
        dignity, sign lord or element. Add rules in <code className="rounded bg-muted px-1 py-0.5 text-xs">shared/rules.ts</code> and they apply to every chart.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rule text" className="w-56" data-testid="input-rule-search" />
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant={area === "all" ? "secondary" : "ghost"} onClick={() => setArea("all")} data-testid="filter-area-all">
            All areas
          </Button>
          {(Object.keys(LIFE_AREAS) as LifeArea[]).map((a) => (
            <Button key={a} size="sm" variant={area === a ? "secondary" : "ghost"} onClick={() => setArea(a)} data-testid={`filter-area-${a}`}>
              {LIFE_AREAS[a].label.split(" &")[0]}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant={planet === "all" ? "secondary" : "ghost"} onClick={() => setPlanet("all")} data-testid="filter-planet-all">
          Any planet
        </Button>
        {PLANETS.map((p) => (
          <Button key={p} size="sm" variant={planet === p ? "secondary" : "ghost"} onClick={() => setPlanet(p)} data-testid={`filter-planet-${p}`}>
            {p}
          </Button>
        ))}
      </div>

      <div className="mt-6 text-xs text-muted-foreground tabular">
        {isLoading ? "Loading…" : `${filtered.length} of ${rules?.length ?? 0} rules`}
      </div>

      <ul className="mt-2 divide-y">
        {filtered.map((r) => (
          <li key={r.id} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]" data-testid={`rule-${r.id}`}>
            <div>
              <div className="text-sm font-medium">{LIFE_AREAS[r.area].label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                <span className="tabular">weight {r.weight}</span> · <span className="font-mono">{r.id}</span>
              </div>
            </div>
            <div>
              <div className={cn("text-sm")}>{r.text}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                when {describeCondition(r.when)}
                {r.source && ` · ${r.source}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
