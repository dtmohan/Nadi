import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PLANETS, SIGNS, type Planet } from "@shared/astro";
import { LIFE_AREAS, RELATION_LABEL, type LifeArea, type Rule } from "@shared/rules";
import { JAIMINI_GROUP_LABEL, type JaiminiRuleInfo } from "@shared/rules-jaimini";
import type { JaiminiRuleGroup } from "@shared/jaimini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SHORT_REL: Record<string, string> = { conjunct: "conjunction", next: "2nd", prev: "12th", trine: "trine", opposite: "7th" };

function describeCondition(w: Rule["when"]) {
  const parts: string[] = [];
  if (w.object && w.exchange) parts.push(`${w.subject} and ${w.object} exchange signs`);
  else if (w.object && w.house) parts.push(`${w.object} in the ${w.house.map((h) => `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`).join(" or ")} from ${w.subject}`);
  else if (w.object) parts.push(`${w.subject} → ${w.object} by ${(w.relation ?? ["conjunct"]).map((r) => SHORT_REL[r] ?? RELATION_LABEL[r]).join(", ")}`);
  else parts.push(w.subject);
  for (const c of w.with ?? []) parts.push(`with ${c.planet} (${(c.relation ?? ["conjunct", "prev", "next"]).map((r) => SHORT_REL[r]).join(", ")})`);
  if (w.alone) parts.push("no planet conjunct, 2nd or 12th");
  if (w.subjectRetro) parts.push("retrograde");
  if (w.subjectCombust) parts.push("combust");
  if (w.subjectDignity) parts.push(w.subjectDignity.join(" or ").toLowerCase());
  if (w.subjectSign) parts.push(`in ${w.subjectSign.map((i) => SIGNS[i]).join("/")}`);
  if (w.subjectSignLord) parts.push(`in a sign of ${w.subjectSignLord.join("/")}`);
  if (w.subjectNakshatraLord) parts.push(`in a nakshatra of ${w.subjectNakshatraLord.join("/")}`);
  if (w.subjectElement) parts.push(`in a ${w.subjectElement.join("/").toLowerCase()} sign`);
  return parts.join(" · ");
}

function JaiminiRules() {
  const { data: rules, isLoading } = useQuery<JaiminiRuleInfo[]>({ queryKey: ["/api/jaimini-rules"] });
  const [group, setGroup] = useState<JaiminiRuleGroup | "all">("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (rules ?? []).filter((r) => (group === "all" || r.group === group) && (!q || r.text.toLowerCase().includes(q.toLowerCase()) || r.when.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q.toLowerCase()))),
    [rules, group, q],
  );
  return (
    <div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The Jaimini rules read the Karakamsa in the navamsa, and the Arudha lagna and Upapada in the rasi chart with rasi drishti. Each rule names the sutra it comes from. Chara dasha is computed, not
        interpreted, except for the sign notes on the chart page. Add rules in <code className="rounded bg-muted px-1 py-0.5 text-xs">shared/rules-jaimini.ts</code>.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rule text" className="w-56" data-testid="input-jaimini-rule-search" />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Rule group">
          <Button size="sm" variant={group === "all" ? "secondary" : "ghost"} onClick={() => setGroup("all")} data-testid="filter-jgroup-all">
            All groups
          </Button>
          {(Object.keys(JAIMINI_GROUP_LABEL) as JaiminiRuleGroup[]).map((g) => (
            <Button key={g} size="sm" variant={group === g ? "secondary" : "ghost"} onClick={() => setGroup(g)} data-testid={`filter-jgroup-${g}`}>
              {JAIMINI_GROUP_LABEL[g]}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-6 text-xs text-muted-foreground tabular">{isLoading ? "Loading…" : `${filtered.length} of ${rules?.length ?? 0} rules`}</div>
      <ul className="mt-2 divide-y">
        {filtered.map((r) => (
          <li key={r.id} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]" data-testid={`jrule-${r.id}`}>
            <div>
              <div className="text-sm font-medium">{JAIMINI_GROUP_LABEL[r.group]}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                <span className="tabular">weight {r.weight}</span> · <span className="font-mono">{r.id}</span>
                <span className="ml-1 rounded bg-muted px-1 py-0.5">{r.chart}</span>
              </div>
            </div>
            <div>
              <div className="text-sm">{r.text}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                when {r.when} ·{" "}
                <a href={r.source.url} target="_blank" rel="noreferrer" className="underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground">
                  {r.source.label}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RulesPage() {
  const { data: rules, isLoading } = useQuery<Rule[]>({ queryKey: ["/api/rules"] });
  const [area, setArea] = useState<LifeArea | "all">("all");
  const [planet, setPlanet] = useState<Planet | "all">("all");
  const [q, setQ] = useState("");
  const [frame, setFrame] = useState<"all" | "male" | "female" | "common">("all");

  const filtered = useMemo(
    () =>
      (rules ?? []).filter(
        (r) =>
          (area === "all" || r.area === area) &&
          (frame === "all" || (frame === "common" ? !r.frame : r.frame === frame)) &&
          (planet === "all" || r.when.subject === planet || r.when.object === planet || (r.when.with ?? []).some((c) => c.planet === planet)) &&
          (!q || r.text.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q.toLowerCase())),
      ),
    [rules, area, planet, q, frame],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold tracking-tight">Rule book</h1>
      <Tabs defaultValue="bnn" className="mt-4">
        <TabsList>
          <TabsTrigger value="bnn" data-testid="tab-rules-bnn">
            Bhrigu Nandi Nadi
          </TabsTrigger>
          <TabsTrigger value="jaimini" data-testid="tab-rules-jaimini">
            Jaimini
          </TabsTrigger>
        </TabsList>
        <TabsContent value="jaimini">
          <JaiminiRules />
        </TabsContent>
        <TabsContent value="bnn">
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every reading is produced by these declarative rules. A rule names a subject planet, an optional object planet with the sign relations that count, and conditions on retrogression,
        dignity, sign lord or element. Rules marked male or female belong to one frame: Jupiter is the Jeeva in both; in a male chart Venus is the wife, in a female chart Venus is the native's own person (Deha) and Mars the husband. Add rules in <code className="rounded bg-muted px-1 py-0.5 text-xs">shared/rules.ts</code> and they apply to every chart.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rule text" className="w-56" data-testid="input-rule-search" />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Chart frame">
          {(["all", "common", "male", "female"] as const).map((fr) => (
            <Button key={fr} size="sm" variant={frame === fr ? "secondary" : "ghost"} onClick={() => setFrame(fr)} data-testid={`filter-frame-${fr}`}>
              {fr === "all" ? "All frames" : fr === "common" ? "Both charts" : fr === "male" ? "Male chart" : "Female chart"}
            </Button>
          ))}
        </div>
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
                {r.frame && <span className="ml-1 rounded bg-muted px-1 py-0.5">{r.frame} chart</span>}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
