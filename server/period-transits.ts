/**
 * Period lords in transit (T5): the server only walks the ephemeris. For each period the client sends (a dasa or a
 * bhukti and its lord) it returns the stretches over which the lord's sign, retrograde motion and combustion stay the
 * same, with each change narrowed to about an hour, and the Sun's sign stretches over the whole range. The rules that
 * read them (Phaladeepika 20.34-38, 20.59) are in shared/period-lord-transits.ts. Nothing is stored.
 */
import { z } from "zod";
import { DateTime } from "luxon";
import type { Planet } from "@shared/astro";
import { ssCombust } from "@shared/combustion";
import { PERIOD_TRANSIT_PLANETS, type PeriodTransitsWire, type WireRow } from "@shared/period-lord-transits";
import { julianDay, planetLonAt, type EphemerisOptions } from "./ephemeris";

/** Days between samples, by how fast each moves (every change is then narrowed by halving to RESOLVE). */
const STEP: Record<Planet, number> = {
  Sun: 5,
  Moon: 0.25,
  Mercury: 2,
  Venus: 2,
  Mars: 3,
  Jupiter: 5,
  Saturn: 7,
  Rahu: 10,
  Ketu: 10,
};
const RESOLVE = 1 / 24;
/** Limits: a request covers at most two levels of a 125-year life. */
export const PERIOD_TRANSIT_MAX_SPANS = 240;
const MAX_SPAN_DAYS = 21 * 365.25;
const MAX_TOTAL_DAYS = 2 * 125 * 365.25;

const iso = z
  .string()
  .max(40)
  .refine((s) => !Number.isNaN(Date.parse(s)), "must be an ISO instant");
export const periodTransitsSchema = z.object({
  spans: z
    .array(z.object({ planet: z.enum(PERIOD_TRANSIT_PLANETS), start: iso, end: iso }))
    .min(1)
    .max(PERIOD_TRANSIT_MAX_SPANS),
  /** Also return the Sun's sign stretches over the whole range (for 20.38). */
  sun: z.boolean().optional(),
  ayanamsa: z.string().max(32).optional(),
  nodeType: z.enum(["mean", "true"]).optional(),
});
export type PeriodTransitsRequest = z.infer<typeof periodTransitsSchema>;

interface State {
  sign: number;
  retro: boolean;
  combust: boolean;
  /** Planet minus Sun, -180 to 180: its sign flips at a conjunction. */
  elong?: number;
}
const keyOf = (s: State) => `${s.sign}|${s.retro ? 1 : 0}|${s.combust ? 1 : 0}`;
const msOf = (jd: number) => Math.round((jd - 2440587.5) * 86400000);

function stateAt(planet: Planet, jd: number, opts: EphemerisOptions): State {
  const p = planetLonAt(planet, jd, opts);
  const sign = Math.floor(p.lon / 30) % 12;
  // The Sun is never retrograde or combust; the nodes are read by sign only (they are not graded by 20.37).
  if (planet === "Sun" || planet === "Rahu" || planet === "Ketu") return { sign, retro: false, combust: false };
  const retro = p.speed < 0;
  const sun = planetLonAt("Sun", jd, opts).lon;
  return {
    sign,
    retro,
    combust: ssCombust({ planet, retrograde: retro, lon: p.lon }, sun),
    elong: ((((p.lon - sun) % 360) + 540) % 360) - 180,
  };
}

/**
 * The lord's stretches over [jd0, jd1], a new one whenever its sign, retrograde motion or combustion changes, as wire
 * rows [start ms, sign, flags (1 retrograde, 2 combust), closest]. The closest approach to the Sun is kept for
 * combust stretches: 0 when the elongation changes sign inside (a conjunction), else the least sampled distance.
 */
export function sampleLord(planet: Planet, jd0: number, jd1: number, opts: EphemerisOptions): WireRow[] {
  const step = STEP[planet];
  const out: WireRow[] = [];
  let cur = stateAt(planet, jd0, opts);
  let segStart = jd0;
  let closest = cur.elong === undefined ? Infinity : Math.abs(cur.elong);
  let lastElong = cur.elong;
  const see = (s: State) => {
    if (s.elong === undefined) return;
    if (lastElong !== undefined && Math.sign(s.elong) !== Math.sign(lastElong) && Math.abs(s.elong) < 90) closest = 0;
    closest = Math.min(closest, Math.abs(s.elong));
    lastElong = s.elong;
  };
  const close = (s: State) => {
    const flags = (s.retro ? 1 : 0) | (s.combust ? 2 : 0);
    out.push(s.combust ? [msOf(segStart), s.sign, flags, Math.round(closest * 10) / 10] : [msOf(segStart), s.sign, flags]);
  };
  let t = jd0;
  while (t < jd1) {
    const tn = Math.min(t + step, jd1);
    const sn = stateAt(planet, tn, opts);
    if (keyOf(sn) !== keyOf(cur)) {
      let a = t;
      let b = tn;
      let sb = sn;
      while (b - a > RESOLVE) {
        const m = (a + b) / 2;
        const sm = stateAt(planet, m, opts);
        if (keyOf(sm) === keyOf(cur)) {
          a = m;
          see(sm);
        } else {
          b = m;
          sb = sm;
        }
      }
      // The old stretch runs to b: its last sample is just before b, so read the distance at a as well.
      see(stateAt(planet, a, opts));
      close(cur);
      segStart = b;
      cur = sb;
      closest = cur.elong === undefined ? Infinity : Math.abs(cur.elong);
      lastElong = cur.elong;
      t = b;
      continue;
    }
    see(sn);
    t = tn;
  }
  close(cur);
  return out;
}

const jdOf = (s: string) => julianDay(DateTime.fromISO(s, { zone: "utc" }));

/** Validates the limits and walks every span; the spans come back in the order they were sent. */
export function periodTransits(req: PeriodTransitsRequest): PeriodTransitsWire {
  const opts: EphemerisOptions = { ayanamsa: req.ayanamsa ?? "lahiri", nodeType: req.nodeType ?? "mean" };
  let total = 0;
  const ranges = req.spans.map((s) => {
    const a = jdOf(s.start);
    const b = jdOf(s.end);
    if (!(b > a)) throw new Error("each span must end after it starts");
    if (b - a > MAX_SPAN_DAYS) throw new Error("a span may cover at most 21 years");
    total += b - a;
    return [a, b] as const;
  });
  if (total > MAX_TOTAL_DAYS) throw new Error("the spans may cover at most 250 years in all");
  const spans = req.spans.map((s, i) => ({
    planet: s.planet,
    start: s.start,
    end: s.end,
    rows: sampleLord(s.planet, ranges[i][0], ranges[i][1], opts),
  }));
  let sun: PeriodTransitsWire["sun"] = { end: 0, rows: [] };
  if (req.sun) {
    const lo = Math.min(...ranges.map((r) => r[0]));
    const hi = Math.max(...ranges.map((r) => r[1]));
    if (hi - lo > 125 * 365.25) throw new Error("the Sun's stretches cover at most 125 years");
    sun = { end: msOf(hi), rows: sampleLord("Sun", lo, hi, opts).map((r) => [r[0], r[1]] as [number, number]) };
  }
  return { spans, sun };
}
