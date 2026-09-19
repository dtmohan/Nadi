// Transit confirmation for the Jaimini life areas, after K.N. Rao: a Chara dasha period is
// trusted more when Jupiter and Saturn, by transit, are on or aspecting the area's anchors
// (its karaka, its pada, its house) or the running dasha sign. Rao reads these transits with
// the planets' own aspects (Jupiter 5/7/9, Saturn 3/7/10), so that is what is used here;
// it is a confirming layer, kept apart from the rasi drishti used in the dasha reading.
// Source: K.N. Rao, Predicting through Jaimini's Chara Dasa; Rao, "Jaimini's Chara Dasha, my approach".

import { DateTime } from "luxon";
import { SIGNS, type TransitPeriod } from "./astro";
import type { TransitTarget } from "./jaimini-areas";

export type TransitPlanet = "Jupiter" | "Saturn";
export type TransitRelation = "in" | "aspects";

export interface TransitTouch {
  planet: TransitPlanet;
  /** Sign the planet transits. */
  from: number;
  relation: TransitRelation;
  target: TransitTarget;
  start: string;
  end: string;
}

export interface DoubleTransit {
  target: TransitTarget;
  start: string;
  end: string;
  jupiter: { from: number; relation: TransitRelation };
  saturn: { from: number; relation: TransitRelation };
}

export interface TransitConfirmation {
  start: string;
  end: string;
  touches: TransitTouch[];
  double: DoubleTransit[];
  /** 0: neither planet touches an anchor; 1: one does; 2: both do at some time; 3: both at the same time (double transit). */
  grade: 0 | 1 | 2 | 3;
}

/** Full-sign planetary aspects as Rao uses them for transit checks: Jupiter 5th, 7th, 9th; Saturn 3rd, 7th, 10th. */
export function transitAspects(planet: TransitPlanet, from: number): number[] {
  const offs = planet === "Jupiter" ? [4, 6, 8] : [2, 6, 9];
  return offs.map((o) => (from + o) % 12);
}

function relation(planet: TransitPlanet, from: number, target: number): TransitRelation | null {
  if (from === target) return "in";
  if (transitAspects(planet, from).includes(target)) return "aspects";
  return null;
}

const iso = (d: DateTime) => d.toISODate()!;

/** Jupiter and Saturn touches on `targets` inside [start, end), plus the stretches where both touch the same target. */
export function confirmTransits(targets: TransitTarget[], transits: TransitPeriod[], start: string, end: string): TransitConfirmation {
  const s0 = DateTime.fromISO(start);
  const e0 = DateTime.fromISO(end);
  const touches: TransitTouch[] = [];
  for (const t of transits) {
    const ts = DateTime.fromISO(t.start);
    const te = DateTime.fromISO(t.end);
    if (te <= s0 || ts >= e0) continue;
    const cs = ts > s0 ? ts : s0;
    const ce = te < e0 ? te : e0;
    for (const target of targets) {
      const rel = relation(t.planet, t.signIndex, target.sign);
      if (rel) touches.push({ planet: t.planet, from: t.signIndex, relation: rel, target, start: iso(cs), end: iso(ce) });
    }
  }
  const double: DoubleTransit[] = [];
  for (const target of targets) {
    const ju = touches.filter((x) => x.planet === "Jupiter" && x.target.sign === target.sign);
    const sa = touches.filter((x) => x.planet === "Saturn" && x.target.sign === target.sign);
    for (const a of ju) {
      for (const b of sa) {
        const cs = DateTime.max(DateTime.fromISO(a.start), DateTime.fromISO(b.start));
        const ce = DateTime.min(DateTime.fromISO(a.end), DateTime.fromISO(b.end));
        if (ce.diff(cs, "days").days >= 20) {
          double.push({ target, start: iso(cs), end: iso(ce), jupiter: { from: a.from, relation: a.relation }, saturn: { from: b.from, relation: b.relation } });
        }
      }
    }
  }
  double.sort((a, b) => a.start.localeCompare(b.start));
  const hasJu = touches.some((x) => x.planet === "Jupiter");
  const hasSa = touches.some((x) => x.planet === "Saturn");
  const grade: TransitConfirmation["grade"] = double.length ? 3 : hasJu && hasSa ? 2 : hasJu || hasSa ? 1 : 0;
  return { start, end, touches, double, grade };
}

export const TRANSIT_GRADE_LABEL: Record<TransitConfirmation["grade"], string> = {
  0: "no transit support",
  1: "one transit touches",
  2: "both planets touch",
  3: "double transit",
};

/** One line per planet: where it is and which anchors it touches, merging stretches of the same sign. */
export function summarizeTouches(touches: TransitTouch[], planet: TransitPlanet): string[] {
  const bySign = new Map<number, { start: string; end: string; hits: Map<string, TransitRelation> }>();
  for (const t of touches.filter((x) => x.planet === planet)) {
    const cur = bySign.get(t.from) ?? { start: t.start, end: t.end, hits: new Map() };
    if (t.start < cur.start) cur.start = t.start;
    if (t.end > cur.end) cur.end = t.end;
    cur.hits.set(t.target.label, t.relation);
    bySign.set(t.from, cur);
  }
  const fmt = (d: string) => DateTime.fromISO(d).toFormat("LLL yyyy");
  return Array.from(bySign.entries())
    .sort((a, b) => a[1].start.localeCompare(b[1].start))
    .map(([from, v]) => {
      const ins = Array.from(v.hits.entries()).filter(([, r]) => r === "in").map(([l]) => l);
      const asp = Array.from(v.hits.entries()).filter(([, r]) => r === "aspects").map(([l]) => l);
      const parts: string[] = [];
      if (ins.length) parts.push(`on ${ins.join(", ")}`);
      if (asp.length) parts.push(`aspecting ${asp.join(", ")}`);
      return `${planet} in ${SIGNS[from]} ${fmt(v.start)} – ${fmt(v.end)}, ${parts.join("; ")}`;
    });
}
