// The Overview's briefing: Before you read, Now and next, and Planets in play (shared/briefing.ts builds
// every line; this file only lays them out). Each row names its system; tags scroll to the area cards
// below, and "Open" takes the reader to the tab, chapter and section the line summarises.
import { useState } from "react";
import type { LifeArea } from "@shared/rules";
import type { AreaTag, BeforeNote, BriefLink, BriefRow, Briefing, PlanetBrief } from "@shared/briefing";
import { areaNoun } from "@shared/life-areas";
import { PlanetName } from "@/components/planet-name";
import { DasaCombinationsBody } from "@/components/dasa-combinations";
import { useRememberChapter } from "@/components/chapters";
import { openExpander } from "@/components/working";
import { Soft } from "@/lib/gentle";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TAB_NAME: Record<BriefLink["tab"], string> = {
  parashari: "Parashari",
  kp: "KP",
  jaimini: "Jaimini",
  alp: "ALP",
  bnn: "Nadi",
  rectify: "Rectify",
};

const LEAN_PILL: Record<string, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};

const card = "mt-4 scroll-mt-4 rounded-lg border bg-card p-5 sm:p-6";
const label = "text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";

/** Open a tab at a chapter, then bring the section into view once the tab has drawn it. */
export function useOpenLink(onOpenTab?: (tab: BriefLink["tab"]) => void) {
  const remember = useRememberChapter();
  return (link: BriefLink) => {
    if (link.chapter) remember(link.tab, link.chapter);
    onOpenTab?.(link.tab);
    if (!link.target) return;
    // A jump, not a smooth scroll: the new tab is still drawing, and a smooth scroll would crawl.
    let tries = 0;
    const seek = () => {
      const el = document.querySelector(link.target!);
      if (!el) {
        if (tries++ < 20) window.setTimeout(seek, 100);
        return;
      }
      // A fold's toggle has no header margin, so it is centred; sections land below the sticky header.
      if (link.open) openExpander(link.open);
      window.requestAnimationFrame(() => el.scrollIntoView({ block: link.open ? "center" : "start" }));
    };
    window.setTimeout(seek, 150);
  };
}

function scrollToArea(area: LifeArea) {
  document
    .querySelector(`[data-testid="overview-area-${area}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <section className={card} data-testid="brief-before">
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
    </section>
  );
}

// ---- Now and next --------------------------------------------------------------------------------

function Tags({ row, practitioner }: { row: BriefRow; practitioner: boolean }) {
  if (!row.tags.length) return null;
  const proposed = row.tags.some((t) => t.proposed);
  return (
    <>
      <span className="text-xs text-muted-foreground">Areas:</span>
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
}: {
  row: BriefRow;
  brief: Briefing;
  plain: boolean;
  onOpen: (link: BriefLink) => void;
}) {
  const [combosOpen, setCombosOpen] = useState(false);
  const combos = row.dasaLord && brief.dasaCombos ? brief.dasaCombos : undefined;
  return (
    <li className="border-t py-3 first:border-t-0 first:pt-0" data-testid={`brief-row-${row.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="w-full text-xs tabular text-muted-foreground sm:w-auto">{row.when}</span>
        <span className="text-sm font-medium">{row.what}</span>
        <span className="text-xs text-muted-foreground" data-testid={`brief-system-${row.id}`}>
          {row.system}
        </span>
        {row.lean && (
          <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", LEAN_PILL[row.lean])}>{row.lean}</span>
        )}
      </div>
      {row.line && (
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
}: {
  brief: Briefing;
  plain: boolean;
  onOpen: (link: BriefLink) => void;
  heading: string;
  children?: React.ReactNode;
}) {
  const t = useT();
  return (
    <section className={card} data-testid="brief-now">
      <p className={label}>{heading}</p>
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
              <Row key={r.id} row={r} brief={brief} plain={plain} onOpen={onOpen} />
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
        Each line is read by its own system and labelled; nothing here is weighed across systems. Area tags follow
        a fixed rule of the app (provisional); dashed tags rest on the period lord alone.
      </p>
      {children}
    </section>
  );
}

// ---- Planets in play -----------------------------------------------------------------------------

function PlanetCard({ p }: { p: PlanetBrief }) {
  return (
    <li className="rounded-md border bg-card p-3" data-testid={`brief-planet-${p.planet}`}>
      <p className="text-sm font-medium">
        <PlanetName planet={p.planet} />
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{p.roles.join(" · ")}</p>
      <p className="mt-2 text-sm">{p.place}</p>
      {p.states.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-foreground/90">
          {p.states.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">{p.rules}</p>
      {p.systems.length > 0 && (
        <dl className="mt-1.5 space-y-0.5 text-xs">
          {p.systems.map((s) => (
            <div key={s.system} className="flex gap-1.5">
              <dt className="shrink-0 font-medium text-muted-foreground">{s.system}</dt>
              <dd>{s.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function BriefingPlanets({ planets }: { planets: PlanetBrief[] }) {
  const t = useT();
  if (!planets.length) return null;
  return (
    <section className={card} data-testid="brief-planets">
      <p className={label}>{t("Planets in play")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        The lords of the running periods, the slow planets in transit and the next dasa lord, with their state in
        the birth chart.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {planets.map((p) => (
          <PlanetCard key={p.planet} p={p} />
        ))}
      </ul>
    </section>
  );
}
