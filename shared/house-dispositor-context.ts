/** Descriptive D1 geometry. Interpretations remain in the school evaluators. */
import { houseFrom, NAKSHATRAS, SIGN_LORD, SIGNS, type Planet } from "./astro";
import type { PlanetContext } from "./planet-context";
import { zodiacQuarter, ZODIAC_QUARTER_DEG } from "./zodiac-quarter";
import { computeChalit } from "./chalit";
import type { ShadbalaBase } from "./shadbala";
import type { PlanetPosition } from "./astro";
import { ordH } from "./house-gloss";

export type DispositorRole = "sign" | "star" | "navamsa";
export interface DispositorPlacement {
  role: DispositorRole;
  planet: Planet;
  /** Undefined if this context does not contain the lord's position. */
  location?: {
    d1Sign: number;
    d1WholeSignHouse?: number;
    /** Inclusive sign count from the point to this lord; no interpretation implied. */
    signsFromPoint: number;
    d9Sign: number;
    d9WholeSignHouse?: number;
  };
}
export interface PointDispositors {
  point: Planet | "Ascendant";
  d1Sign: number;
  star: string;
  pada: number;
  d9Sign: number;
  lords: DispositorPlacement[];
}

/** All placements use the supplied frame, not an implicit Lahiri or KP chart. */
export function pointDispositors(context: PlanetContext, point: Planet | "Ascendant"): PointDispositors | undefined {
  if (context.frame.kind === "divisional" || (context.frame.division && context.frame.division !== "D1"))
    throw new Error("Dispositors require a D1 longitude frame");
  const quarter = point === "Ascendant" ? context.ascendantNakshatra : context.planet(point)?.nakshatra;
  if (!quarter) return undefined;
  const d9Asc = context.frame.ascendant === undefined ? undefined : zodiacQuarter(context.frame.ascendant).navamsaSign;
  const lord = (role: DispositorRole, planet: Planet): DispositorPlacement => {
    const fact = context.planet(planet);
    if (!fact) return { role, planet };
    return { role, planet, location: { d1Sign: fact.position.signIndex, d1WholeSignHouse: fact.wholeSignHouse,
      signsFromPoint: houseFrom(quarter.signIndex, fact.position.signIndex), d9Sign: fact.nakshatra.navamsaSign,
      d9WholeSignHouse: d9Asc === undefined ? undefined : houseFrom(d9Asc, fact.nakshatra.navamsaSign) } };
  };
  return { point, d1Sign: quarter.signIndex, star: quarter.star, pada: quarter.pada, d9Sign: quarter.navamsaSign,
    lords: [lord("sign", SIGN_LORD[quarter.signIndex]), lord("star", quarter.starLord), lord("navamsa", quarter.navamsaLord)] };
}

export interface HouseArc { house: number; start: number; end: number }
export interface HouseQuarterSegment {
  start: number;
  end: number;
  length: number;
  signIndex: number;
  star: string;
  pada: number;
  navamsaSign: number;
  partial: boolean;
}
export interface HouseQuarterContext extends HouseArc {
  frame: string;
  segments: HouseQuarterSegment[];
}

const norm = (x: number) => ((x % 360) + 360) % 360;
const epsilon = 64 * Number.EPSILON * 360;

/** Intersect each actual half-open house arc with quarter boundaries, including
 * partially intersected quarters and arcs crossing 0°. A start=end arc is
 * ambiguous, so it is rejected rather than guessed to be a whole zodiac. */
export function houseQuarterContexts(frame: string, houses: readonly HouseArc[]): HouseQuarterContext[] {
  return houses.map(({ house, start, end }) => {
    if (![start, end].every(Number.isFinite)) throw new RangeError("Finite house endpoints are required");
    const first = norm(start), width = norm(end - start);
    if (width < epsilon) throw new RangeError("House arc must have positive length below 360 degrees");
    const finish = first + width;
    const segments: HouseQuarterSegment[] = [];
    let cursor = first;
    while (cursor < finish - epsilon) {
      let next = (Math.floor((cursor + epsilon) / ZODIAC_QUARTER_DEG) + 1) * ZODIAC_QUARTER_DEG;
      if (next <= cursor + epsilon) next += ZODIAC_QUARTER_DEG;
      const to = Math.min(next, finish);
      const q = zodiacQuarter((cursor + to) / 2);
      const length = to - cursor;
      segments.push({ start: norm(cursor), end: norm(to), length, signIndex: q.signIndex,
        star: NAKSHATRAS[q.starIndex], pada: q.pada, navamsaSign: q.navamsaSign,
        partial: length < ZODIAC_QUARTER_DEG - epsilon });
      cursor = to;
    }
    return { house, start: first, end: norm(end), frame, segments };
  });
}

/** Rashi spans only. Other house systems must supply their real endpoints. */
export function wholeSignHouseArcs(context: PlanetContext): HouseArc[] {
  if (context.frame.ascendant === undefined) return [];
  const ascSign = zodiacQuarter(context.frame.ascendant).signIndex;
  return Array.from({ length: 12 }, (_, i) => {
    const sign = (ascSign + i) % 12;
    return { house: i + 1, start: sign * 30, end: ((sign + 1) % 12) * 30 };
  });
}

export interface HouseQuarterFrame { label: string; houses: HouseQuarterContext[] }

/** Real spans, explicitly labelled. Chalit angles must belong to this chart;
 * KP cusp starts are used only in the KP frame that supplied them. */
export function houseQuarterFrames(context: PlanetContext, angles?: Pick<ShadbalaBase, "asc" | "mc">): HouseQuarterFrame[] {
  const whole = wholeSignHouseArcs(context);
  const frames: HouseQuarterFrame[] = whole.length ? [{ label: "Rashi (whole sign)", houses: houseQuarterContexts("rashi", whole) }] : [];
  if (angles && context.frame.ascendant !== undefined) {
    const difference = Math.abs(norm(angles.asc - context.frame.ascendant + 180) - 180);
    if (difference > 1e-8) throw new Error("House angles do not belong to this frame");
    const chalit = computeChalit(context.positions as PlanetPosition[], angles.asc, angles.mc);
    for (const method of ["sripati", "equal"] as const) {
      const label = method === "sripati" ? "Bhava chalit (Sripati)" : "Bhava chalit (equal)";
      frames.push({ label, houses: houseQuarterContexts(method, chalit[method].bhavas) });
    }
  }
  const cusps = context.frame.houseMethod === "placidus" ? context.frame.cusps : undefined;
  if (cusps?.length === 12) {
    const arcs = cusps.map((start, i) => ({ house: i + 1, start, end: cusps[(i + 1) % 12] }));
    frames.push({ label: "KP Placidus cusps", houses: houseQuarterContexts("placidus", arcs) });
  }
  return frames;
}

export function formatHouseQuarters(house: HouseQuarterContext): string {
  const groups: HouseQuarterSegment[][] = [];
  for (const segment of house.segments) {
    const last = groups[groups.length - 1];
    if (!last || last[0].star !== segment.star || last[0].signIndex !== segment.signIndex) groups.push([segment]);
    else last.push(segment);
  }
  return groups.map((group) => {
    const parts: string[] = [];
    let run: number[] = [];
    const flush = () => {
      if (run.length) parts.push(run.length === 1 ? `${run[0]}` : `${run[0]}–${run[run.length - 1]}`);
      run = [];
    };
    for (const q of group) {
      if (q.partial) { flush(); parts.push(`${q.pada} (partial)`); }
      else run.push(q.pada);
    }
    flush();
    return `${SIGNS[group[0].signIndex]} · ${group[0].star} ${parts.join(", ")}`;
  }).join("; ");
}

/** Human-readable locations shared by the screen and report. */
export function formatDispositorLocation(lord: DispositorPlacement): string {
  const p = lord.location;
  if (!p) return `${lord.planet}: position unavailable`;
  return `${lord.planet}: D1 ${SIGNS[p.d1Sign]}${p.d1WholeSignHouse === undefined ? "" : `, H${p.d1WholeSignHouse}`} (${ordH(p.signsFromPoint)} sign from point); D9 ${SIGNS[p.d9Sign]}${p.d9WholeSignHouse === undefined ? "" : `, H${p.d9WholeSignHouse}`}`;
}
