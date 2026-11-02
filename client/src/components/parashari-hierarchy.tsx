import type { HierarchyEvent } from "@shared/parashari-hierarchy";
import { CROSS_CHART_SOURCE, hierarchyWindowStages } from "@shared/parashari-hierarchy";
import { Cite } from "@/components/source-link";
import type { RectifyEvent, RectifySegment } from "@shared/rectify-types";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";

const facts = (xs: string[]) => xs.length ? xs.join("; ") : "none in this subset";

export function ParashariHierarchyEvent({ event }: { event: HierarchyEvent }) {
  return <details className="mt-2 rounded border px-2 py-2 text-xs" data-testid="parashari-hierarchy-event">
    <summary className="cursor-pointer font-medium">D1 and {event.division} together · {event.label} · {event.date}</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>Whole-sign house {event.d1.house}. Read the natal house, its lord, the division's house and lord, and the natural significators together. No single placement determines whether the event occurs.</p>
      {event.moment && <p>Event clock: {event.moment.time}{event.moment.timeAssumed ? " (noon assumed)" : ""}; zone: {event.moment.timezone ?? "not supplied"}{event.moment.timezoneAssumed ? " (birth zone assumed)" : ""}.</p>}
      {event.crossChart && <div className="space-y-2" data-testid="parashari-cross-chart">
        {[["D1", event.d1], [event.division, event.divisionCheck]].map(([name, check]) => {
          const c = check as HierarchyEvent["d1"];
          return <div key={name as string} className="rounded border px-2 py-1">
            <p><strong>{name as string} house {c.house}: {c.status}</strong> · partial house assessment</p>
            <p>Support: {facts(c.support)}.</p><p>Contrary indications: {facts(c.strain)}.</p>
          </div>;
        })}
        {event.crossChart.planets.map((p) => {
          const place = (x: typeof p.d1) => `${SIGNS[x.sign]}, house ${x.house}, ${x.dignity === "other" ? (x.relation === "neutral" ? "neutral sign" : `${x.relation}'s sign`) : x.dignity}`;
          return <p key={p.planet}><strong>{p.planet}</strong> ({p.roles.join(", ")}): D1 {place(p.d1)}; {event.division} {place(p.division)}.</p>;
        })}
        <p>A strong placement in {event.division} is a relevant clue, but it does not automatically erase D1 difficulties or guarantee an event. Natural sign-lord relationships and sign dignity are partial; strength, aspects and other combinations still need judgment. A planet with multiple roles is listed once.</p>
        {event.crossChart.periods.map((p) => <div key={p.level} className="rounded border px-2 py-1">
          <p><strong>{p.level} · {p.planet}:</strong> {p.linked ? "listed timing clues in both charts" : "one or both chart links unresolved"}.</p>
          <p>D1: {facts(p.d1)}. {event.division}: {facts(p.division)}.</p>
        </div>)}
        <p>These timing clues include the divisional ascendant, the natal house lord and the secondary house, in addition to the primary house, lord and significator. The first two period links are {event.crossChart.timing.first ? "both present" : "unresolved"}; the third is {event.crossChart.timing.first ? (event.crossChart.timing.third ? "also present" : "unresolved") : "not counted before the first two"}. This is not a complete promise or a tested forecast.</p>
        <p><Cite>Paul Manley, Birth Time Rectification (2022), pp. 64–67, 123–133</Cite> <Cite href={CROSS_CHART_SOURCE.url}>{CROSS_CHART_SOURCE.label}</Cite> <Cite href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=513">Rao, worked example 5</Cite></p>
      </div>}
      <details className="rounded border px-2 py-1"><summary className="cursor-pointer font-medium">Earlier strict gate · research comparison only</summary>
      <p>That older gate can stop at D1 before considering these divisional clues. It is not suitable for ruling out a candidate.</p>
      {[["D1", event.d1], [event.division, event.divisionCheck]].map(([name, check]) => {
        const c = check as HierarchyEvent["d1"];
        return <div key={name as string} className="rounded border px-2 py-1">
          <p><strong>{name as string}: {c.status}</strong>{name !== "D1" && !event.passes.d1 ? " · blocked by D1" : ""}</p>
          <p>Support: {facts(c.support)}.</p><p>Contrary indications: {facts(c.strain)}.</p>
        </div>;
      })}
      {event.periods.map((p, i) => <div key={p.level} className="rounded border px-2 py-1">
        <p><strong>{p.level} · {p.planet}: {p.passes ? "passes this partial screen" : "unresolved"}</strong>
          {!p.passes && (i === 0 ? !event.passes.division : !event.periods[i - 1].passes) ? " · an earlier check is unresolved" : ""}</p>
        <p>D1 links: {facts(p.d1)}. {event.division} links: {facts(p.division)}.</p>
      </div>)}
      <p>These are partial house and primary period links, not a complete natal promise or a transit test. Being a listed significator can itself count as a link. Fourth and deeper periods are not included. Repeated lords are not independent confirmation.</p>
      </details>
    </div>
  </details>;
}

/** All candidate intersections come from the same individual event evidence as Validate. */
export function ParashariHierarchyWindows({ selections, segments, zone }: {
  selections: RectifyEvent[]; segments: RectifySegment[]; zone: string;
}) {
  const result = hierarchyWindowStages(selections, segments.map((s) => s.parashariHierarchy ?? selections.map(() => null)));
  if (!result.stages.length && !result.unassessed.length) return null;
  const describe = (indices: number[]) => {
    const groups: Array<{ first: number; last: number }> = [];
    for (const index of indices) {
      const prev = groups.at(-1);
      if (prev && index === prev.last + 1 && segments[prev.last].endIso === segments[index].startIso) prev.last = index;
      else groups.push({ first: index, last: index });
    }
    const fmt = (s: RectifySegment, end: boolean) => {
      const date = end ? s.endDate : s.startDate, time = end ? s.end : s.start;
      const iso = end ? s.endIso : s.startIso;
      return date ? DateTime.fromISO(`${date}T${time}`, { zone: "utc" }).toFormat("d LLL HH:mm:ss")
        : DateTime.fromISO(iso, { setZone: true }).setZone(zone).toFormat("d LLL HH:mm:ss");
    };
    return groups.map((g) => `${fmt(segments[g.first], false)}–${fmt(segments[g.last], true)}`);
  };
  return <details className="mb-3 rounded-md border px-3 py-2 text-xs" data-testid="parashari-hierarchy-windows">
    <summary className="cursor-pointer font-medium">Earlier strict event funnel · diagnostic only</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>This older experiment intersects narrow D1, relevant division and period conditions across events; it does not require D4 for a marriage event. It can stop at an incomplete D1 check before weighing a strong D1 house lord or significator in the division. Its counts are retained for research, not for excluding or selecting birth times.</p>
      <p>Every slice remains open for review when the evidence is mixed or missing. A later event should not erase an earlier contradiction, but this partial model cannot judge all the combinations needed to establish one. Boundaries come from midpoint samples and can miss shorter changes.</p>
      <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a preliminary test on four fresh public cases, no slice passed the D1 gate for both selected events within the scanned hour. This screen has not shown it can select a birth time; use its results as diagnostics only.</p>
      {!!result.unassessed.length && <p>Not assessed by this favourable-event subset: {result.unassessed.map((i) => `${selections[i].label} ${selections[i].date}`).join("; ")}. The windows below cover only the {result.eligible.length} assessed events.</p>}
      {!result.eligible.length && <p>No selected event is eligible for this screen.</p>}
      {!!result.eligible.length && <details><summary className="cursor-pointer">See each event separately</summary>
        {result.eligible.map((i) => {
          const count = (stage: "d1" | "sub" | "third") => segments.filter((s) => s.parashariHierarchy?.[i]?.passes[stage]).length;
          return <p key={i}>{selections[i].label} · {selections[i].date}: older D1 gate {count("d1")}, through the subperiod {count("sub")}, through the third period {count("third")} of {segments.length} slices. These are not a common window or exclusions.</p>;
        })}
      </details>}
      {result.stages.map((stage) => <div key={stage.label} className="rounded border px-2 py-1">
        <p><strong>{stage.label}:</strong> {stage.indices.length} of {segments.length} sampled slices meet the old strict subset.</p>
        {stage.indices.length ? <details><summary className="cursor-pointer">Show those windows</summary>
          <ul className="list-disc pl-5">{describe(stage.indices).map((window, i) => <li key={i}>{window}</li>)}</ul>
        </details> : <p>No slice meets that old subset. All birth times remain unresolved under the available evidence.</p>}
      </div>)}
    </div>
  </details>;
}
