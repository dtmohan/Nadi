// The Overview's briefing: Before you read, Now and next, and Planets in play (shared/briefing.ts builds
// every line; this file only lays them out). Each row names its system; tags scroll to the area cards
// below, and "Open" takes the reader to the tab, chapter and section the line summarises.
import { useState } from "react";
import type { LifeArea } from "@shared/rules";
import type { AreaTag, BeforeNote, BriefLink, BriefRow, Briefing, PlanetBrief } from "@shared/briefing";
import type { GocharaRow } from "@shared/gochara";
import { PLAIN_TOPIC_LABEL, type PlanetTopicExample } from "@shared/topic-brief";
import { areaNoun } from "@shared/life-areas";
import { PlanetName } from "@/components/planet-name";
import { DasaCombinationsBody } from "@/components/dasa-combinations";
import { useRememberChapter } from "@/components/chapters";
import { openExpander } from "@/components/working";
import { Soft } from "@/lib/gentle";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { InfoBox, INFO_BOX_EYEBROW, INFO_BOX_INSET } from "@/components/info-box";

const TAB_NAME: Record<BriefLink["tab"], string> = {
  parashari: "Parashari",
  kp: "KP",
  jaimini: "Jaimini",
  alp: "ALP",
  prasna: "Prasna Marga",
  bnn: "Nadi",
  rectify: "Rectify",
};

const LEAN_PILL: Record<string, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};

const card = "mt-4 scroll-mt-4";
const label = INFO_BOX_EYEBROW;

/** Open a tab at a chapter, then bring the section into view once the tab has drawn it. */
export function useOpenLink(onOpenTab?: (tab: BriefLink["tab"]) => void) {
  const remember = useRememberChapter();
  return (link: BriefLink) => {
    if (link.chapter) remember(link.tab, link.chapter);
    onOpenTab?.(link.tab);
    if (!link.target) return;
    // A jump, not a smooth scroll: the new tab is still drawing, and a smooth scroll would crawl.
    let tries = 0;
    let selectedTransit = false;
    const seek = () => {
      if (link.transitPlanet && !selectedTransit) {
        const track = document.querySelector<HTMLButtonElement>(`[data-testid="button-track-${link.transitPlanet.toLowerCase()}"]`);
        if (!track) {
          if (tries++ < 20) window.setTimeout(seek, 100);
          return;
        }
        track.click();
        selectedTransit = true;
        window.setTimeout(seek, 100);
        return;
      }
      const el = document.querySelector(link.target!);
      if (!el) {
        if (tries++ < 20) window.setTimeout(seek, 100);
        return;
      }
      // A fold's toggle has no header margin, so it is centred; sections land below the sticky header.
      if (link.open) openExpander(link.open);
      if (link.openControl) {
        const toggle = document.querySelector<HTMLButtonElement>(link.openControl);
        if (toggle?.getAttribute("aria-expanded") === "false") toggle.click();
      }
      window.requestAnimationFrame(() => el.scrollIntoView({ block: link.open ? "center" : "start" }));
    };
    window.setTimeout(seek, 150);
  };
}

function scrollToArea(area: LifeArea) {
  const el = document.querySelector<HTMLElement>(`[data-testid="overview-area-${area}"]`);
  if (!el) return;
  // Additional topics are compact disclosures. Open the topic and its enclosing list first.
  for (let fold = el.closest<HTMLDetailsElement>("details"); fold; fold = fold.parentElement?.closest<HTMLDetailsElement>("details") ?? null)
    fold.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- Before you read -----------------------------------------------------------------------------

export function BriefingBefore({
  notes,
  onOpen,
}: {
  notes: BeforeNote[];
  onOpen: (link: BriefLink) => void;
}) {
  const t = useT();
  if (!notes.length) return null;
  return (
    <InfoBox className={card} data-testid="brief-before">
      <p className={label}>{t("Before you read")}</p>
      <ul className="mt-3 space-y-4">
        {notes.map((n) => (
          <li key={n.id} data-testid={`brief-before-${n.id}`}>
            <p className="text-sm font-medium">{n.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{n.text}</p>
            {n.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.detail}</p>}
            <button
              type="button"
              onClick={() => onOpen(n.link)}
              className="mt-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
              data-testid={`brief-before-open-${n.id}`}
            >
              {n.action}
            </button>
          </li>
        ))}
      </ul>
    </InfoBox>
  );
}

// ---- Now and next --------------------------------------------------------------------------------

function Tags({ row, practitioner }: { row: BriefRow; practitioner: boolean }) {
  if (!row.tags.length) return null;
  const proposed = row.tags.some((t) => t.proposed);
  return (
    <>
      <span className="text-xs text-muted-foreground">{row.system === "Ashtakavarga transit" ? "Areas from ascendant:" : "Areas:"}</span>
      {row.tags.map((t: AreaTag) => (
        <button
          key={t.area}
          type="button"
          onClick={() => scrollToArea(t.area)}
          className={cn(
            "rounded border px-1.5 py-0.5 text-xs hover:bg-muted",
            t.proposed && "border-dashed",
          )}
          data-testid={`brief-tag-${row.id}-${t.area}`}
          data-clause={t.clause}
        >
          {areaNoun(t.area)}
          {practitioner && <span className="text-muted-foreground"> ({t.why})</span>}
        </button>
      ))}
      {proposed && (
        <span className="text-xs text-muted-foreground" data-testid={`brief-tag-proposed-${row.id}`}>
          {row.tags.every((t) => t.proposed) ? "proposed tags" : "dashed: proposed tags"}
        </span>
      )}
    </>
  );
}

function Row({
  row,
  brief,
  plain,
  onOpen,
  moonWeather,
}: {
  row: BriefRow;
  brief: Briefing;
  plain: boolean;
  onOpen: (link: BriefLink) => void;
  moonWeather?: Partial<Record<"Jupiter" | "Saturn", GocharaRow>>;
}) {
  const [combosOpen, setCombosOpen] = useState(false);
  const combos = row.dasaLord && brief.dasaCombos ? brief.dasaCombos : undefined;
  const moonRow = row.id === "tr-jupiter" ? moonWeather?.Jupiter : row.id === "tr-saturn" ? moonWeather?.Saturn : undefined;
  return (
    <li className="border-t py-3 first:border-t-0 first:pt-0" data-testid={`brief-row-${row.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="w-full text-xs tabular text-muted-foreground sm:w-auto">{row.when}</span>
        <span className="text-sm font-medium">{plain && row.plainSummary ? row.plainSummary.title : row.what}</span>
        <span className="text-xs text-muted-foreground" data-testid={`brief-system-${row.id}`}>
          {row.system}
        </span>
        {row.lean && (
          <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", LEAN_PILL[row.lean])}>{row.system === "Ashtakavarga transit" ? "Ashtakavarga: " : ""}{row.lean}</span>
        )}
        {moonRow && <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium" data-testid={`brief-moon-${row.id}`}>
          {plain ? "Moon-based transit" : "Moon gochara"}: {moonRow.verdict}{!plain && ` · house ${moonRow.house} from Moon`}
        </span>}
      </div>
      {plain && row.plainMoon ? <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed" data-testid="brief-moon-plain-explanation">
        <p>{row.plainMoon.reading}</p>
        <p>{row.plainMoon.why}</p>
        {row.plainMoon.comparison && <p>{row.plainMoon.comparison}</p>}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-primary">How this was worked out</summary>
          <p className="mt-1.5">{row.plainMoon.basis}</p>
          <a className="mt-1 inline-block text-primary underline" href="https://vedicpupil.in/library/books/phaladipika/chapter-20" target="_blank" rel="noreferrer">Phaladeepika, chapter 20</a>
        </details>
      </div> : plain && row.plainSummary ? <div className="mt-1.5 space-y-1 text-sm leading-relaxed" data-testid={`brief-plain-${row.id}`}>
        <p>{row.plainSummary.text}</p>
        {row.plainSummary.basis && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-primary">Show the calculation</summary><p className="mt-1">{row.what}. <Soft>{row.plainSummary.basis}</Soft></p></details>}
      </div> : row.line && (
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
          {plain ? <Soft>{row.line}</Soft> : row.line}
        </p>
      )}
      {row.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Tags row={row} practitioner={!plain} />
        <button
          type="button"
          onClick={() => onOpen(row.link)}
          className="ml-auto text-xs font-medium text-primary underline-offset-2 hover:underline"
          data-testid={`brief-open-${row.id}`}
        >
          Open in {TAB_NAME[row.link.tab]}
        </button>
      </div>
      {combos && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setCombosOpen((o) => !o)}
            aria-expanded={combosOpen}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            data-testid="brief-combos-toggle"
          >
            {combosOpen ? "Hide" : "Show"} the combinations in this period
          </button>
          {combosOpen && (
            <div className="mt-2" data-testid="brief-combos">
              <DasaCombinationsBody dc={combos} plain={plain} deceased={brief.past} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function BriefingNow({
  brief,
  plain,
  onOpen,
  heading,
  children,
  moonWeather,
}: {
  brief: Briefing;
  plain: boolean;
  onOpen: (link: BriefLink) => void;
  heading: string;
  children?: React.ReactNode;
  moonWeather?: Partial<Record<"Jupiter" | "Saturn", GocharaRow>>;
}) {
  const t = useT();
  return (
    <InfoBox className={card} data-testid="brief-now">
      <p className={label}>{heading}</p>
      {plain && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A planetary period is a traditional time cycle calculated from the birth chart. A long period contains shorter periods, each associated with a planet. Transits are the planets' positions on the reading date; the different schools interpret these cycles separately.</p>}
      {brief.pastEnd && (
        <p className="mt-3 text-sm text-muted-foreground">The 120-year Vimshottari sequence has run its course.</p>
      )}
      {brief.now.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {brief.past ? t("At passing") : t("Running now")}
          </p>
          <ul className="mt-2" data-testid="brief-now-list">
            {brief.now.map((r) => (
              <Row key={r.id} row={r} brief={brief} plain={plain} onOpen={onOpen} moonWeather={moonWeather} />
            ))}
          </ul>
        </>
      )}
      {brief.next.length > 0 && (
        <>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {t("Next {n} months").replace("{n}", String(brief.horizonMonths))}
          </p>
          <ul className="mt-2" data-testid="brief-next-list">
            {brief.next.map((r) => (
              <Row key={r.id} row={r} brief={brief} plain={plain} onOpen={onOpen} />
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {plain ? "Each line names the school that produced it. The area labels suggest related topics using a provisional app rule; dashed labels are suggested from the period's planet alone and do not mean an event is predicted." : "Each line is read by its own system and labelled; nothing here is weighed across systems. Area tags follow a fixed rule of the app (provisional); dashed tags rest on the period lord alone."}
      </p>
      {children}
    </InfoBox>
  );
}

// ---- Planets in play -----------------------------------------------------------------------------

function PlanetTechnical({ p }: { p: PlanetBrief }) {
  return <>
    <p className="mt-0.5 text-xs text-muted-foreground">{p.roles.join(" · ")}</p>
    <p className="mt-2 text-sm">{p.place}</p>
    {p.states.length > 0 && <ul className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-foreground/90">{p.states.map((s) => <li key={s}>{s}</li>)}</ul>}
    <p className="mt-1.5 text-xs text-muted-foreground">{p.rules}</p>
    {p.systems.length > 0 && !p.plainReading?.withheld && <dl className="mt-1.5 space-y-0.5 text-xs">{p.systems.map((s) => <div key={s.system} className="flex gap-1.5"><dt className="shrink-0 font-medium text-muted-foreground">{s.system}</dt><dd>{s.text}</dd></div>)}</dl>}
    {p.plainReading?.withheld && <p className="mt-1.5 text-xs text-muted-foreground">Some school-specific roles are held back here for younger readers. Available technical details are in the practitioner view.</p>}
  </>;
}

function PlanetCard({ p, example }: { p: PlanetBrief; example?: PlanetTopicExample }) {
  return (
    <li className={INFO_BOX_INSET} data-testid={`brief-planet-${p.planet}`}>
      <p className="text-sm font-medium">
        <PlanetName planet={p.planet} />
      </p>
      {p.plainReading ? <div className="mt-2 space-y-2 text-sm leading-relaxed" data-testid={`brief-planet-explanation-${p.planet}`}>
        <p>{p.plainReading.meaning}</p>
        {example ? <div data-testid={`brief-planet-example-${p.planet}`}><p className="text-xs font-semibold">One interpretation in this chart</p><p className="mt-1">A Nadi rule involving {p.planet} describes this possible theme: <Soft>{example.text}</Soft>{example.source && <span className="text-xs text-muted-foreground"> ({example.source})</span>}</p><button type="button" className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => scrollToArea(example.topic)}>Explore {PLAIN_TOPIC_LABEL[example.topic]}</button></div> : <p className="text-xs text-muted-foreground">No separate plain-language interpretation involving this planet was selected in the life topics.</p>}
        <div><p className="text-xs font-semibold">Why it appears here</p>{p.plainReading.whyNow.map((line) => <p className="mt-1" key={line}>{line}</p>)}</div>
        <div><p className="text-xs font-semibold">In the birth chart</p><p className="mt-1">{p.plainReading.birth}</p></div>
        <details className="border-t pt-2"><summary className="cursor-pointer text-xs font-medium text-primary">Explore its houses, star and condition</summary><div className="mt-2 space-y-2"><p>{p.plainReading.houses}</p><p>{p.plainReading.star}</p>{p.plainReading.conditions.length > 0 && <div><p className="text-xs font-semibold">How the placement is assessed</p>{p.plainReading.conditions.map((line) => <p className="mt-1" key={line}>{line}</p>)}</div>}</div></details>
        <details className="border-t pt-2"><summary className="cursor-pointer text-xs font-medium text-primary">Show the technical details</summary><PlanetTechnical p={p} /></details>
      </div> : <PlanetTechnical p={p} />}
      {p.ruleContext && p.ruleContext.length > 0 && (
        <details className="mt-2 text-xs leading-relaxed" data-testid={`brief-rule-context-${p.planet}`}>
          <summary className="cursor-pointer font-medium">Rule links by school</summary>
          <p className="mt-1 text-muted-foreground">These matched rules link this planet directly or through a stated sign-lord, star-lord or cusp-sub-lord condition. Other dependencies and sections may add more; the links do not change a score. KP uses its own ayanamsa.</p>
          <ul className="mt-1 space-y-1">{p.ruleContext.map((group) => (
            <li key={group.school} title={group.coverage}>
              <strong>{group.school}</strong> · {group.count} {group.count === 1 ? "match" : "matches"}
              <ul className="ml-3 mt-0.5 space-y-1">{group.examples.map((e, i) => <li key={`${e.id}-${i}`}>{e.chart ? `${e.chart} · ` : ""}{e.via ? `${e.attribution} of ${e.via} · ` : ""}<Soft>{e.text}</Soft>{e.source ? ` (${e.source})` : ""}{e.asOf ? ` · reading date ${e.asOf.slice(0, 10)}` : ""}</li>)}</ul>
              {group.count > group.examples.length && <span className="text-muted-foreground">More in the school reading.</span>}
            </li>
          ))}</ul>
        </details>
      )}
    </li>
  );
}

export function BriefingPlanets({ planets, plain, uncertainty, examples }: { planets: PlanetBrief[]; plain: boolean; uncertainty: number; examples?: Partial<Record<string, PlanetTopicExample>> }) {
  const t = useT();
  if (!planets.length) return null;
  return (
    <InfoBox className={card} data-testid="brief-planets">
      <p className={label}>{t("Planets in play")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {plain ? "These are the planets associated with the current time cycles, the next long cycle, or the current positions of Jupiter and Saturn. Each card distinguishes the birth chart from the sky on the reading date." : "The lords of the running periods, the slow planets in transit and the next dasa lord, with their state in the birth chart."}
      </p>
      {plain && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">In a birth chart, houses are twelve chart areas associated with life topics. The whole-sign view starts with the sign rising on the eastern horizon at birth; each sign has a traditionally assigned ruler. The themes below are traditional possibilities, not facts about the person or guaranteed events.</p>}
      {plain && uncertainty > 0 && <p className="mt-1 text-xs text-muted-foreground">The entered birth time has an uncertainty of ±{uncertainty} minutes; some house, star-quarter and timing details may change within that range.</p>}
      <ul className={cn("mt-3 grid items-start gap-2", planets.length === 2 ? "sm:grid-cols-2" : planets.length > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "")}>
        {planets.map((p) => (
          <PlanetCard key={p.planet} p={p} example={examples?.[p.planet]} />
        ))}
      </ul>
    </InfoBox>
  );
}
