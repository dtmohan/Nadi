import type { HierarchyEvent } from "@shared/parashari-hierarchy";
import { hierarchyWindowStages } from "@shared/parashari-hierarchy";
import type { RectifyEvent, RectifySegment } from "@shared/rectify-types";
import { DateTime } from "luxon";

const facts = (xs: string[]) => xs.length ? xs.join("; ") : "none in this subset";

export function ParashariHierarchyEvent({ event }: { event: HierarchyEvent }) {
  return <details className="mt-2 rounded border px-2 py-2 text-xs" data-testid="parashari-hierarchy-event">
    <summary className="cursor-pointer font-medium">D1 → {event.division} → periods · {event.label} · {event.date}</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>Whole-sign house {event.d1.house}. This conservative screen is partial: mixed or missing indications remain unresolved, not a denial of the event.</p>
      {event.moment && <p>Event clock: {event.moment.time}{event.moment.timeAssumed ? " (noon assumed)" : ""}; zone: {event.moment.timezone ?? "not supplied"}{event.moment.timezoneAssumed ? " (birth zone assumed)" : ""}.</p>}
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
    const fmt = (iso: string) => DateTime.fromISO(iso, { setZone: true }).setZone(zone).toFormat("d LLL HH:mm:ss");
    return groups.map((g) => `${fmt(segments[g.first].startIso)}–${fmt(segments[g.last].endIso)}`);
  };
  return <details className="mb-3 rounded-md border px-3 py-2 text-xs" data-testid="parashari-hierarchy-windows">
    <summary className="cursor-pointer font-medium">Experimental D1 → divisional event funnel</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>Each assessed event starts with its own D1 house, then its relevant division and first two period lords. A candidate must retain every earlier assessed event as divisions are added. The third period is applied only after all earlier checks. D4 is not required for a marriage event.</p>
      <p>Mixed and missing clues are unresolved, not proof that an event is impossible. These app-defined gates omit other natal factors and transits; they do not establish a birth time. Boundaries come from midpoint samples and can miss shorter changes.</p>
      <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">In a preliminary test on four fresh public cases, no slice passed the D1 gate for both selected events within the scanned hour. This screen has not shown it can select a birth time; use its results as diagnostics only.</p>
      {!!result.unassessed.length && <p>Not assessed by this favourable-event subset: {result.unassessed.map((i) => `${selections[i].label} ${selections[i].date}`).join("; ")}. The windows below cover only the {result.eligible.length} assessed events.</p>}
      {!result.eligible.length && <p>No selected event is eligible for this screen.</p>}
      {!!result.eligible.length && <details><summary className="cursor-pointer">See each event separately</summary>
        {result.eligible.map((i) => {
          const count = (stage: "d1" | "sub" | "third") => segments.filter((s) => s.parashariHierarchy?.[i]?.passes[stage]).length;
          return <p key={i}>{selections[i].label} · {selections[i].date}: D1 {count("d1")}, through the subperiod {count("sub")}, through the third period {count("third")} of {segments.length} slices. These individual counts are not a common window.</p>;
        })}
      </details>}
      {result.stages.map((stage) => <div key={stage.label} className="rounded border px-2 py-1">
        <p><strong>{stage.label}:</strong> {stage.indices.length} of {segments.length} sampled slices remain.</p>
        {stage.indices.length ? <details><summary className="cursor-pointer">Show retained windows</summary>
          <ul className="list-disc pl-5">{describe(stage.indices).map((window, i) => <li key={i}>{window}</li>)}</ul>
        </details> : <p>No surviving slice under this partial screen; the birth time remains unresolved.</p>}
      </div>)}
    </div>
  </details>;
}
