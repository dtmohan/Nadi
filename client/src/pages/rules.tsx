import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PLANETS, SIGNS, type Planet } from "@shared/astro";
import {
  LIFE_AREAS,
  RELATION_LABEL,
  type LifeArea,
  type Rule,
} from "@shared/rules";
import {
  JAIMINI_GROUP_LABEL,
  type JaiminiRuleInfo,
} from "@shared/rules-jaimini";
import type { JaiminiRuleGroup } from "@shared/jaimini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useParams } from "wouter";
import { SourceLink, Cite } from "@/components/source-link";
import { KP_TRANSIT_EVIDENCE_SOURCE } from "@shared/kp-transit-evidence";
import { SutraLibrary } from "@/components/sutra-library";
import {
  ALP_CHAPTERS,
  ALP_RULES,
  ALP_ROLE_LABEL,
  type AlpRuleWhen,
} from "@shared/rules-alp";
import {
  KP_RULES,
  KP_CUSP_THEMES,
  KP_SOURCES,
  describeKpCondition,
} from "@shared/rules-kp";
import {
  ALP_PLANET_KARAKATWAS,
  ALP_WEEKDAYS,
  ALP_HORA_NOTE,
  ALP_TITHI_NOTE,
  ALP_YOGAS,
  ALP_ELEMENT_HOURS,
  ALP_PANCHANGA_ELEMENTS,
  CLASS_NOTES_SOURCE,
} from "@shared/alp-karakatwas";

function describeAlpCondition(w: AlpRuleWhen) {
  const ord = (h: number) =>
    `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`;
  const parts: string[] = [];
  if (w.role)
    parts.push(
      `${ALP_ROLE_LABEL[w.role]}${w.roleInHouse ? ` in the ${w.roleInHouse.map(ord).join("/")} from the ALP lagna` : ""}${w.roleWith ? ` with ${w.roleWith.join(" or ")}` : ""}`,
    );
  if (w.planet)
    parts.push(
      `${w.planet}${w.planetInHouse ? ` in the ${w.planetInHouse.map(ord).join("/")} from the ALP lagna` : ""}`,
    );
  if (w.activatedHouse)
    parts.push(
      `current pada activates the ${w.activatedHouse.map(ord).join("/")}`,
    );
  if (w.nakshatraLord)
    parts.push(`ALP lagna in a nakshatra of ${w.nakshatraLord.join("/")}`);
  if (w.activatedFromJanma)
    parts.push(
      `current pada's navamsa is the ${w.activatedFromJanma.map(ord).join("/")} from the janma lagna`,
    );
  if (w.roleInHouseFromJanma)
    parts.push(
      `role planet in the ${w.roleInHouseFromJanma.map(ord).join("/")} from the janma lagna`,
    );
  if (w.roleOwnsHouse)
    parts.push(
      `role planet owns the ${w.roleOwnsHouse.map(ord).join("/")} from the ALP lagna`,
    );
  if (w.lordOf)
    parts.push(
      `lord of the ${ord(w.lordOf)} from the ALP lagna${w.lordOfInHouse ? ` in the ${w.lordOfInHouse.map(ord).join("/")}` : ""}`,
    );
  if (w.activatedTouches !== undefined)
    parts.push(
      w.activatedTouches
        ? "pada's navamsa touches ALP lagna, its 7th, janma lagna or its 7th"
        : "pada's navamsa touches none of ALP lagna, its 7th, janma lagna, its 7th",
    );
  if (w.activatedNakLordShashtashtaka !== undefined)
    parts.push(
      `pada's navamsa and the nakshatra lord's sign ${w.activatedNakLordShashtashtaka ? "" : "not "}in 6/8`,
    );
  if (w.lordsTogether)
    parts.push(
      `lords of the ${ord(w.lordsTogether[0])} and ${ord(w.lordsTogether[1])} from the ALP lagna in one sign`,
    );
  if (w.nakshatraStraddlesAhead !== undefined)
    parts.push(
      w.nakshatraStraddlesAhead
        ? "current nakshatra runs into the next sign"
        : "current nakshatra ends within the sign",
    );
  if (w.alpHouseFromJanma)
    parts.push(
      `ALP lagna in the ${w.alpHouseFromJanma.map(ord).join("/")} from the janma lagna`,
    );
  if (w.arpHouseFromAlp)
    parts.push(
      `Akshaya rasi in the ${w.arpHouseFromAlp.map(ord).join("/")} from the ALP lagna`,
    );
  if (w.arpLordFromAlpLord)
    parts.push(
      `Akshaya rasi lord in the ${w.arpLordFromAlpLord.map(ord).join("/")} from the ALP lagna lord`,
    );
  if (w.arpNakLordFromAlpNakLord)
    parts.push(
      `dasa lord in the ${w.arpNakLordFromAlpNakLord.map(ord).join("/")} from the ALP nakshatra lord`,
    );
  if (w.bhuktiFromDasa)
    parts.push(
      `bhukti lord in the ${w.bhuktiFromDasa.map(ord).join("/")} from the dasa lord`,
    );
  if (w.alpHouseFromPlanet)
    parts.push(
      `ALP lagna in the ${w.alpHouseFromPlanet.houses.map(ord).join("/")} from ${w.alpHouseFromPlanet.planet}`,
    );
  if (w.arpNakshatra)
    parts.push(
      `Akshaya rasi in ${w.arpNakshatra}${w.arpPada ? ` pada ${w.arpPada.join("/")}` : ""}`,
    );
  if (w.arpLordFromArp)
    parts.push(
      `Akshaya rasi lord in the ${w.arpLordFromArp.map(ord).join("/")} from the Akshaya rasi`,
    );
  if (w.dasaLordFromArp)
    parts.push(
      `dasa lord in the ${w.dasaLordFromArp.map(ord).join("/")} from the Akshaya rasi`,
    );
  if (w.dasaLordFromAlp)
    parts.push(
      `dasa lord in the ${w.dasaLordFromAlp.map(ord).join("/")} from the ALP lagna`,
    );
  if (w.bhuktiLordFromAlp)
    parts.push(
      `bhukti lord in the ${w.bhuktiLordFromAlp.map(ord).join("/")} from the ALP lagna`,
    );
  if (w.threeWays)
    parts.push(
      `the three ways: ${w.threeWays.present} present, ${w.threeWays.past} past, ${w.threeWays.future} future`,
    );
  if (w.nakLordFromAlpLord)
    parts.push(
      `ALP nakshatra lord in the ${w.nakLordFromAlpLord.map(ord).join("/")} from the ALP lagna lord`,
    );
  if (w.alpArpLordsTogetherFromJanma)
    parts.push(
      `ALP lagna lord and Akshaya rasi lord in one sign, the ${w.alpArpLordsTogetherFromJanma.map(ord).join("/")} from the janma lagna`,
    );
  return parts.join(" · ");
}

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const KP_POLARITY_CLASS = {
  good: "bg-verdict-good",
  bad: "bg-verdict-bad",
  neutral: "bg-muted-foreground/50",
} as const;

function KpRules() {
  return (
    <div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Krishnamurti Paddhati rules, grouped by cusp. Each is written against
        the sub lord of that cusp: the houses it signifies (four-step or
        six-step), where it sits, whose star it is in, and whether it touches
        the badhaka or maraka houses. Paraphrased from the user's own copies and
        cited by volume and page; add rules in{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          shared/rules-kp.ts
        </code>
        .
      </p>
      <section className="mt-5 max-w-3xl rounded-md border px-3 py-3 text-sm" data-testid="kp-transit-rule-note">
        <h2 className="font-semibold">KP event timing and transit evidence</h2>
        <p className="mt-1 text-muted-foreground">
          The cusp and natal significators describe the matter; the cited KP
          example considers their planetary periods together with event-day
          transits. It also examines the Sun, Moon and other planets relative
          to natal planets and cusps, and reads their stars and subs. {" "}
          <SourceLink source={KP_TRANSIT_EVIDENCE_SOURCE} />
        </p>
        <p className="mt-1 text-muted-foreground">
          The KP chart reading, Rectify and Validate show the app's nine transit points separately
          from the existing score for the transiting dasa and bhukti lords. The source
          supplies a worked judgment, not a numerical recipe for combining all
          planets; no such total is inferred here. Without an event time, noon
          is assumed; without an event time zone, the birth zone is assumed.
        </p>
      </section>
      <div className="mt-6 space-y-8">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((cusp) => {
          const rules = KP_RULES.filter((r) => r.cusp === cusp);
          return (
            <section key={cusp} data-testid={`kp-cusp-rules-${cusp}`}>
              <h2 className="text-sm font-semibold">
                Cusp {ROMAN[cusp - 1]} · {KP_CUSP_THEMES[cusp]}{" "}
                <span className="font-normal text-muted-foreground">
                  ({rules.length})
                </span>
              </h2>
              <ul className="mt-2 divide-y">
                {rules.map((r) => (
                  <li
                    key={r.id}
                    className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]"
                    data-testid={`kp-rule-${r.id}`}
                  >
                    <div className="text-xs text-muted-foreground">
                      <div className="font-mono">{r.id}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            KP_POLARITY_CLASS[r.polarity],
                          )}
                        />{" "}
                        {r.topic}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-primary">
                        {describeKpCondition(r.when)}
                      </div>
                      <p className="mt-1 text-sm">{r.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.sourceUrl ? (
                          <Cite href={r.sourceUrl}>{r.source}</Cite>
                        ) : (
                          r.source
                        )}
                        {r.timing &&
                          ` · timing: ${r.timing.join("-")} significators`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section
        className="mt-10 text-xs text-muted-foreground"
        data-testid="kp-rules-sources"
      >
        <h2 className="text-sm font-semibold text-foreground">Sources</h2>
        <ul className="mt-2 space-y-1">
          {KP_SOURCES.map((s) => (
            <li key={s.label}>
              {s.url ? (
                <Cite href={s.url}>{s.label}</Cite>
              ) : (
                <span className="text-foreground">{s.label}</span>
              )}{" "}
              — {s.note}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AlpRules() {
  return (
    <div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Akshaya Lagna Paddhati rules, grouped by the chapter they come from. A
        rule names a role (the ALP lagna lord, the janma lagna lord, the lord of
        the ALP nakshatra or of the activated navamsa sign) and the houses from
        the ALP lagna that count. Chapters from the printed volumes are added
        one at a time in{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          shared/rules-alp.ts
        </code>
        .
      </p>
      <div className="mt-6 space-y-8">
        {ALP_CHAPTERS.map((c) => {
          const rules = ALP_RULES.filter((r) => r.chapter === c.id);
          return (
            <section key={c.id} data-testid={`alp-chapter-${c.id}`}>
              <h2 className="text-sm font-semibold">
                {c.book} · {c.title}{" "}
                <span className="font-normal text-muted-foreground">
                  {rules.length ? `(${rules.length})` : "· pending"}
                </span>
              </h2>
              {c.note && !rules.length && (
                <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
              )}
              {rules.length > 0 && (
                <ul className="mt-2 divide-y">
                  {rules.map((r) => (
                    <li
                      key={r.id}
                      className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]"
                      data-testid={`alp-rule-${r.id}`}
                    >
                      <div className="text-xs text-muted-foreground">
                        <div className="font-mono">{r.id}</div>
                        <div className="mt-1">weight {r.weight}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-primary">
                          {describeAlpCondition(r.when)}
                        </div>
                        <p className="mt-1 text-sm">{r.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.sourceUrl ? (
                            <Cite href={r.sourceUrl}>{r.source}</Cite>
                          ) : (
                            r.source
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className="mt-10" data-testid="alp-reference-planets">
        <h2 className="text-sm font-semibold">
          Reference · Planet karakatwas{" "}
          <span className="font-normal text-muted-foreground">
            ({CLASS_NOTES_SOURCE})
          </span>
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          The significations the readings use for each planet. Book 1's chapter
          on planetary characteristics is not in hand; these are the class
          notes, which follow the common karakatwas. The first line of each
          entry is what the chart page quotes.
        </p>
        <ul className="mt-3 divide-y">
          {ALP_PLANET_KARAKATWAS.map((k) => (
            <li
              key={k.planet}
              className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]"
              data-testid={`alp-karakatwa-${k.planet}`}
            >
              <div className="text-sm font-medium">
                {k.planet}
                <div className="mt-1 text-xs font-normal text-muted-foreground">
                  {k.deity} · {k.gemstone}
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-sm">{k.summary}.</p>
                <p>
                  <span className="text-muted-foreground">
                    People and qualities:{" "}
                  </span>
                  {k.people.join("; ")}.
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Places and things:{" "}
                  </span>
                  {k.things.join("; ")}.
                </p>
                <p>
                  <span className="text-muted-foreground">Body: </span>
                  {k.body.join(", ")}.{" "}
                  <span className="text-muted-foreground">Disease: </span>
                  {k.disease}.
                </p>
                <p>
                  <span className="text-muted-foreground">Metal </span>
                  {k.metal};{" "}
                  <span className="text-muted-foreground">cereal </span>
                  {k.cereal};{" "}
                  <span className="text-muted-foreground">flower </span>
                  {k.flower}
                  {k.taste ? (
                    <>
                      ; <span className="text-muted-foreground">taste </span>
                      {k.taste}
                    </>
                  ) : null}
                  {k.colour ? (
                    <>
                      ; <span className="text-muted-foreground">colour </span>
                      {k.colour}
                    </>
                  ) : null}
                  .
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" data-testid="alp-reference-panchanga">
        <h2 className="text-sm font-semibold">
          Reference · Panchanga notes{" "}
          <span className="font-normal text-muted-foreground">
            ({CLASS_NOTES_SOURCE})
          </span>
        </h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Weekdays, tithi, the nitya yogas, the elements through the day, and
          fasting. Kept as a reference; no chart rule draws on them yet.
        </p>
        <h3 className="mt-4 text-xs font-medium">Weekdays</h3>
        <ul className="mt-1 divide-y text-xs">
          {ALP_WEEKDAYS.map((d) => (
            <li
              key={d.day}
              className="grid gap-x-6 py-2 sm:grid-cols-[11rem_1fr]"
            >
              <div>
                <span className="font-medium">{d.day}</span>
                <div className="text-muted-foreground">{d.planet}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{d.deity}. </span>
                {d.note}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {ALP_HORA_NOTE} {ALP_TITHI_NOTE}
        </p>
        <h3 className="mt-4 text-xs font-medium">
          Nitya yogas (as far as the class went)
        </h3>
        <ul className="mt-1 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          {ALP_YOGAS.map((y) => (
            <li key={y.yoga}>
              <span className="font-medium">{y.yoga}</span>{" "}
              <span className="text-muted-foreground">{y.meaning}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xs font-medium">
          The five elements through the day
        </h3>
        <ul className="mt-1 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          {ALP_ELEMENT_HOURS.map((e) => (
            <li key={e.from}>
              <span className="tabular">
                {e.from} – {e.to}
              </span>{" "}
              <span className="text-muted-foreground">{e.element}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xs font-medium">
          The limbs of the panchanga and fasting
        </h3>
        <ul className="mt-1 space-y-1 text-xs">
          {ALP_PANCHANGA_ELEMENTS.map((e) => (
            <li key={e.limb}>
              <span className="font-medium">{e.limb}</span>{" "}
              <span className="text-muted-foreground">({e.element})</span>:{" "}
              {e.fasting}.
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const SHORT_REL: Record<string, string> = {
  conjunct: "conjunction",
  next: "2nd",
  prev: "12th",
  trine: "trine",
  opposite: "7th",
};

function describeCondition(w: Rule["when"]) {
  const parts: string[] = [];
  if (w.object && w.exchange)
    parts.push(`${w.subject} and ${w.object} exchange signs`);
  else if (w.object && w.house)
    parts.push(
      `${w.object} in the ${w.house.map((h) => `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`).join(" or ")} from ${w.subject}`,
    );
  else if (w.object)
    parts.push(
      `${w.subject} → ${w.object} by ${(w.relation ?? ["conjunct"]).map((r) => SHORT_REL[r] ?? RELATION_LABEL[r]).join(", ")}`,
    );
  else parts.push(w.subject);
  for (const c of w.with ?? [])
    parts.push(
      `with ${c.planet} (${(c.relation ?? ["conjunct", "prev", "next"]).map((r) => SHORT_REL[r]).join(", ")})`,
    );
  if (w.alone) parts.push("no planet conjunct, 2nd or 12th");
  if (w.subjectRetro) parts.push("retrograde");
  if (w.subjectCombust) parts.push("combust");
  if (w.subjectDignity) parts.push(w.subjectDignity.join(" or ").toLowerCase());
  if (w.subjectSign)
    parts.push(`in ${w.subjectSign.map((i) => SIGNS[i]).join("/")}`);
  if (w.subjectSignLord)
    parts.push(`in a sign of ${w.subjectSignLord.join("/")}`);
  if (w.subjectNakshatraLord)
    parts.push(`in a nakshatra of ${w.subjectNakshatraLord.join("/")}`);
  if (w.subjectElement)
    parts.push(`in a ${w.subjectElement.join("/").toLowerCase()} sign`);
  return parts.join(" · ");
}

function JaiminiRules() {
  const { data: rules, isLoading } = useQuery<JaiminiRuleInfo[]>({
    queryKey: ["/api/jaimini-rules"],
  });
  const [group, setGroup] = useState<JaiminiRuleGroup | "all">("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      (rules ?? []).filter(
        (r) =>
          (group === "all" || r.group === group) &&
          (!q ||
            r.text.toLowerCase().includes(q.toLowerCase()) ||
            r.when.toLowerCase().includes(q.toLowerCase()) ||
            r.id.includes(q.toLowerCase())),
      ),
    [rules, group, q],
  );
  return (
    <div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The Jaimini rules read the Karakamsa in the navamsa, and the Arudha
        lagna and Upapada in the rasi chart with rasi drishti. Each rule names
        the sutra it comes from. Chara dasha is computed, not interpreted,
        except for the sign notes on the chart page. Add rules in{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          shared/rules-jaimini.ts
        </code>
        .
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rule text"
          className="w-56"
          data-testid="input-jaimini-rule-search"
        />
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Rule group"
        >
          <Button
            size="sm"
            variant={group === "all" ? "secondary" : "ghost"}
            onClick={() => setGroup("all")}
            data-testid="filter-jgroup-all"
          >
            All groups
          </Button>
          {(Object.keys(JAIMINI_GROUP_LABEL) as JaiminiRuleGroup[]).map((g) => (
            <Button
              key={g}
              size="sm"
              variant={group === g ? "secondary" : "ghost"}
              onClick={() => setGroup(g)}
              data-testid={`filter-jgroup-${g}`}
            >
              {JAIMINI_GROUP_LABEL[g]}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-6 text-xs text-muted-foreground tabular">
        {isLoading
          ? "Loading…"
          : `${filtered.length} of ${rules?.length ?? 0} rules`}
      </div>
      <ul className="mt-2 divide-y">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]"
            data-testid={`jrule-${r.id}`}
          >
            <div>
              <div className="text-sm font-medium">
                {JAIMINI_GROUP_LABEL[r.group]}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                <span className="tabular">weight {r.weight}</span> ·{" "}
                <span className="font-mono">{r.id}</span>
                <span className="ml-1 rounded bg-muted px-1 py-0.5">
                  {r.chart}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm">{r.text}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                when {r.when} · <SourceLink source={r.source} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RulesPage() {
  const params = useParams<{ ref?: string }>();
  const sutraRef = params.ref ? decodeURIComponent(params.ref) : undefined;
  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });
  const [area, setArea] = useState<LifeArea | "all">("all");
  const [planet, setPlanet] = useState<Planet | "all">("all");
  const [q, setQ] = useState("");
  const [frame, setFrame] = useState<"all" | "male" | "female" | "common">(
    "all",
  );

  const filtered = useMemo(
    () =>
      (rules ?? []).filter(
        (r) =>
          (area === "all" || r.area === area) &&
          (frame === "all" ||
            (frame === "common" ? !r.frame : r.frame === frame)) &&
          (planet === "all" ||
            r.when.subject === planet ||
            r.when.object === planet ||
            (r.when.with ?? []).some((c) => c.planet === planet)) &&
          (!q ||
            r.text.toLowerCase().includes(q.toLowerCase()) ||
            r.id.includes(q.toLowerCase())),
      ),
    [rules, area, planet, q, frame],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold tracking-tight">
        Rule book
      </h1>
      <Tabs
        key={sutraRef ?? "rules"}
        defaultValue={sutraRef !== undefined ? "sutras" : "bnn"}
        className="mt-4"
      >
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="bnn" data-testid="tab-rules-bnn">
            Bhrigu Nandi Nadi
          </TabsTrigger>
          <TabsTrigger value="jaimini" data-testid="tab-rules-jaimini">
            Jaimini
          </TabsTrigger>
          <TabsTrigger value="sutras" data-testid="tab-rules-sutras">
            Sutra text
          </TabsTrigger>
          <TabsTrigger value="alp" data-testid="tab-rules-alp">
            ALP
          </TabsTrigger>
          <TabsTrigger value="kp" data-testid="tab-rules-kp">
            KP
          </TabsTrigger>
          <TabsTrigger value="parashari" data-testid="tab-rules-parashari">
            Parashari event check
          </TabsTrigger>
        </TabsList>
        <TabsContent value="parashari">
          <section className="mt-4 max-w-3xl space-y-3 text-sm" data-testid="parashari-ranking-rules">
            <p className="text-muted-foreground">The chart's Matter and date chapter and the Validate and Rectify tools use the same implemented event checks. The Bhrigu Nandi Nadi rule array belongs to that separate system; these Parashari checks are implemented by their own shared evaluators. The natal house factors can be inspected without choosing a date.</p>
            <h2 className="font-semibold">Experimental birth-time event ranking · version 1</h2>
            <p className="text-muted-foreground">The app counts five matches per eligible event. The equal points and their combination are Nadi's experimental convention; they are not a published numerical formula. A difficult house can coexist with an event, and an absent match is not a denial.</p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>D1 matter house has at least one of the partial support conditions the app checks.</li>
              <li>D9, D7 or D10 matter house has a benefic occupant or full aspect, or its ruler is in an own or exaltation sign. Applying the house test to a division is an app interpretation.</li>
              <li>The event's Vimshottari dasa lord rules, occupies or fully aspects the matter house in D1 or its division.</li>
              <li>The bhukti lord meets the same condition.</li>
              <li>At the event instant both Jupiter and Saturn occupy or fully aspect the same D1 matter house or matter lord's sign.</li>
            </ol>
            <p className="text-muted-foreground">D1 house 7 and D9 are used for marriage; house 5 and D7 for childbirth; house 10 and D10 for a new job or promotion. Other events, including job loss, and events explicitly recorded as mixed or unfavourable are not scored. The career timing test extends the cited D10 approach and is particularly provisional.</p>
            <p className="text-muted-foreground">Sources: <a className="underline" href="https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" target="_blank" rel="noreferrer">BPHS 7.1–8 and 11.14–16</a>; M.S. Mehta, <em>Analysing Horoscope Through Modern Techniques</em>, ch. XVIII and profession cases; <a className="underline" href="https://www.scribd.com/document/552741942/Kn-Rao-Astrology-and-Timing-of-Marriage-2008" target="_blank" rel="noreferrer">Astrology and Timing of Marriage, ch. 2</a>; <a className="underline" href="https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf" target="_blank" rel="noreferrer">Astrological Assessment of Timing of Childbirth</a>; and <a className="underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf" target="_blank" rel="noreferrer">P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach</a>.</p>
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a small test on eight new public cases, top-ranked intervals missed the ±5-minute band around every reported time. Some reported times are uncertain. Do not use this ranking on its own to change a birth time.</p>
            <h2 className="pt-4 font-semibold">Event-specific comparison · version 2</h2>
            <p className="text-muted-foreground">The first two of six app-defined points retain the partial D1 and relevant divisional support checks above. The remaining checks differ by event. They use same-sign conjunctions and full sign-based aspects, and are strict subsets of wider source methods. The v1–v3 point totals do not require D1 to pass before awarding other points; the separate funnel below does.</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li><strong>Marriage:</strong> each of the dasa and bhukti lords directly connects to the ascendant, seventh house or their lords in both D1 and D9; Jupiter and Saturn share a natal ascendant/seventh target; and Jupiter aspects the Vivah Saham sign (the sum of the D1 ascendant and seventh lords' longitudes). This aspect check does not count Jupiter occupying the same sign. <a className="underline" href="https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008" target="_blank" rel="noreferrer">Astrology and Timing of Marriage, ch. 2</a>.</li>
              <li><strong>Childbirth:</strong> the dasa and bhukti lords are each checked against the cited list of ascendant, seventh and fifth lords, Jupiter and planets in or aspecting the fifth; Jupiter is checked against the fifth-from-Jupiter lord's D1/D9 signs, and the transiting ascendant lord against a subset of fifth-house targets. <a className="underline" href="https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf" target="_blank" rel="noreferrer">Astrological Assessment of Timing of Childbirth, §§2.6–2.7</a> reproduces these rules from Phaladeepika.</li>
              <li><strong>New job or promotion:</strong> the two period lords are checked for D1 ascendant/tenth lordship or exaltation; Jupiter and Saturn must share both an ascendant target and a career target; and the D1 tenth lord is checked for a relationship with the D10 ascendant lord. <a className="underline" href="https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html" target="_blank" rel="noreferrer">Vishnu Bhaskar, Advanced Techniques of Predictive Astrology, vol. 1 pp. 23–24</a>.</li>
            </ul>
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a separate nine-person public-case test, version 2's top intervals touched the reported-time ±5-minute band in eight cases, but covered 35% of the scanned hour on average. At the reported birth times, held-out event scores were nearly the same as scores on nearby comparison dates. The sample is small and some times are uncertain; the ranking remains experimental.</p>
            <h2 className="pt-4 font-semibold">Divisional period lords · version 3</h2>
            <p className="text-muted-foreground">Version 3 keeps all six version 2 checks and adds one point each for the dasa and bhukti lord. In the relevant divisional chart, a lord matches if it occupies or fully aspects the event house; is, conjoins or has a full sign aspect with its lord; or is, conjoins or has a full sign aspect with an event karaka. A node in the relevant lord or karaka's sign also matches. Nodes receive but do not cast aspects in this subset.</p>
            <p className="text-muted-foreground">The event house and karaka are D7 fifth house and Jupiter for childbirth, D9 seventh house and Venus for marriage, and D10 tenth house and Sun, Mercury, Jupiter or Saturn for a new job or promotion. Being one of these karakas counts by itself, even without a separate house connection. Source: Paul Manley, <em>Birth Time Rectification: How to Find Your Exact Birth Time</em> (2022), ch. 4, pp. 101, 118–122. The eight equal points are Nadi's partial interpretation, not the book's scoring formula. The added checks can repeat v2 evidence or count one planet twice when both period lords are the same. The third period is shown separately as descriptive evidence; it does not change v3. The book's full qualitative judgment and fourth/fifth period levels are not automated.</p>
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In ten fresh public cases, v3's highest intervals came within five minutes of the published time in four cases and covered 29% of the tested hour on average. Held-out event scores resembled scores on nearby dates. The sample is small and some times are uncertain; do not use the ranking on its own to change a birth time.</p>
            <h2 className="pt-4 font-semibold">Staged primary links · exploratory</h2>
            <p className="text-muted-foreground">For one matter, both main- and subperiod lords must have a primary link in the relevant division before the third lord can count as a further match. The partial rule checks the event house, its lord and the listed significators. A missing link is unresolved; this subset does not add a transit condition or claim to implement Manley's full method. The dated chart reading, validation and comparison use the same gate.</p>
            <h2 className="pt-4 font-semibold">D1 and the event's division together · descriptive</h2>
            <p className="text-muted-foreground">The D1 matter lord, the divisional matter lord and the natural significator are displayed in both D1 and the relevant division, including sign, house and a limited sign-dignity and natural sign-lord relationship. A planet with several roles is displayed once. Strong divisional dignity is evidence to consider alongside D1 difficulties; it is not an automatic cancellation or proof of an outcome. <a className="underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=74" target="_blank" rel="noreferrer">P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, §§6.5–6.6</a> and <a className="underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=513" target="_blank" rel="noreferrer">worked example 5</a>; Paul Manley, <em>Birth Time Rectification</em> (2022), pp. 64–67, 123–133.</p>
            <p className="text-muted-foreground">Period clues are examined in D1 and the division without requiring the earlier partial D1 gate to be clean. The divisional links include its ascendant, the D1 house lord and the secondary house, as well as the primary house, lord and significator. Manley discusses a D1 fifth lord as a childbirth period-giver even without the primary D7 links. The third level is reported only after the first two have listed links. These are descriptive timing clues, not a complete D1 promise or a rule that can establish a birth time. Random-date comparisons use the same checks.</p>
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a small three-person check, all three held-out event dates and all 18 nearby comparison dates had the main-and-subperiod clues. This subset did not distinguish those event dates from the sampled dates; the comparison dates are not known non-events.</p>
            <h2 className="pt-4 font-semibold">Earlier D1 → divisional funnel · diagnostic only</h2>
            <p className="text-muted-foreground">The older experiment required the D1 matter house to have a listed supportive condition and no listed contrary condition in the app's partial BPHS 11.14–16 assessment. Its relevant divisional house had to have a benefic occupant or full aspect, or an own/exalted lord, without a debilitated lord. Mixed and missing indications remained unresolved. This can discard a candidate before considering a strong D1 lord in the relevant division, so it must not be used to exclude or select a birth time.</p>
            <p className="text-muted-foreground">The main, sub and third period lords must each have a primary event-house, house-lord or significator link in both D1 and the event's own division; each stage requires all predecessors. The source's significator itself can count without another connection. Move uses D4 fourth house, child D7 fifth, marriage D9 seventh, career D10 tenth and education D24 fifth. The candidate funnel first requires D1 for every assessed event, then intersects D4, D7, D9, D10 and D24 checks as applicable, retaining every earlier assessed event. The third period is checked after these. A marriage event is not required to pass D4. Other matters and explicitly mixed or unfavourable outcomes are unassessed.</p>
            <p className="text-muted-foreground">This omits avasthas, many yogas, event-specific nuances, transits and deeper periods, so it cannot establish a complete promise or birth time. The chart's dated reading, validation, rectification and random-date comparison use the same evaluator. Sources: BPHS 11.14–16; Paul Manley, <em>Birth Time Rectification</em> (2022), ch. 4, pp. 98–128 and the divisional funnel on capture pp. 112–114.</p>
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a preliminary four-person public-case test, no slice in any of the four reported-time ±30-minute windows passed the D1 check for both selected events. This strict partial screen has not demonstrated that it can identify a birth time. Those reported times and some event details are uncertain; a failed gate does not disprove the event.</p>
          </section>
        </TabsContent>
        <TabsContent value="alp">
          <AlpRules />
        </TabsContent>
        <TabsContent value="kp">
          <KpRules />
        </TabsContent>
        <TabsContent value="jaimini">
          <JaiminiRules />
        </TabsContent>
        <TabsContent value="sutras">
          <SutraLibrary initialRef={sutraRef} />
        </TabsContent>
        <TabsContent value="bnn">
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every reading is produced by these declarative rules. A rule names a
            subject planet, an optional object planet with the sign relations
            that count, and conditions on retrogression, dignity, sign lord or
            element. Rules marked male or female belong to one frame: Jupiter is
            the Jeeva in both; in a male chart Venus is the wife, in a female
            chart Venus is the native's own person (Deha) and Mars the husband.
            Add rules in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              shared/rules.ts
            </code>{" "}
            and they apply to every chart.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search rule text"
              className="w-56"
              data-testid="input-rule-search"
            />
            <div
              className="flex flex-wrap gap-1"
              role="group"
              aria-label="Chart frame"
            >
              {(["all", "common", "male", "female"] as const).map((fr) => (
                <Button
                  key={fr}
                  size="sm"
                  variant={frame === fr ? "secondary" : "ghost"}
                  onClick={() => setFrame(fr)}
                  data-testid={`filter-frame-${fr}`}
                >
                  {fr === "all"
                    ? "All frames"
                    : fr === "common"
                      ? "Both charts"
                      : fr === "male"
                        ? "Male chart"
                        : "Female chart"}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={area === "all" ? "secondary" : "ghost"}
                onClick={() => setArea("all")}
                data-testid="filter-area-all"
              >
                All areas
              </Button>
              {(Object.keys(LIFE_AREAS) as LifeArea[]).map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={area === a ? "secondary" : "ghost"}
                  onClick={() => setArea(a)}
                  data-testid={`filter-area-${a}`}
                >
                  {LIFE_AREAS[a].label.split(" &")[0]}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={planet === "all" ? "secondary" : "ghost"}
              onClick={() => setPlanet("all")}
              data-testid="filter-planet-all"
            >
              Any planet
            </Button>
            {PLANETS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={planet === p ? "secondary" : "ghost"}
                onClick={() => setPlanet(p)}
                data-testid={`filter-planet-${p}`}
              >
                {p}
              </Button>
            ))}
          </div>

          <div className="mt-6 text-xs text-muted-foreground tabular">
            {isLoading
              ? "Loading…"
              : `${filtered.length} of ${rules?.length ?? 0} rules`}
          </div>

          <ul className="mt-2 divide-y">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]"
                data-testid={`rule-${r.id}`}
              >
                <div>
                  <div className="text-sm font-medium">
                    {LIFE_AREAS[r.area].label}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    <span className="tabular">weight {r.weight}</span> ·{" "}
                    <span className="font-mono">{r.id}</span>
                    {r.frame && (
                      <span className="ml-1 rounded bg-muted px-1 py-0.5">
                        {r.frame} chart
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className={cn("text-sm")}>{r.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    when {describeCondition(r.when)}
                    {r.source && (
                      <>
                        {" · "}
                        <Cite>{r.source}</Cite>
                      </>
                    )}
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
