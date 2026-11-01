/** Reproducible research only. No result of this module is used in production scoring. */
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { SIGNS, type Planet } from "@shared/astro";
import { matterOf, type ChartEvent } from "@shared/events";
import { computeGochara, natalOwnMarks } from "@shared/gochara";
import { kpNatalFrame, vimshottariLordsAt } from "@shared/kp";
import { createKpEventScorer } from "@shared/kp-event-evidence";
import type { InsertChart } from "@shared/schema";
import { ascendantAt, birthInstant, cuspsAt, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { createParashariEventScorer } from "../server/parashari-event";

const CLASSICAL: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export function researchFrame(chart: InsertChart) {
  const utc = birthInstant(chart).utc, birthIso = utc.toISO()!, jd = julianDay(utc);
  const nodeType = chart.nodeType === "true" ? "true" as const : "mean" as const;
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType };
  const kpOpts = { ayanamsa: "kp", nodeType };
  const natal = positionsAt(jd, opts), lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const kpNatal = positionsAt(jd, kpOpts), cusps = cuspsAt(jd, chart.latitude, chart.longitude, kpOpts);
  const kp = kpNatalFrame(kpNatal, cusps);
  const moon = natal.find((p) => p.planet === "Moon")!;
  const kpMoon = kpNatal.find((p) => p.planet === "Moon")!;
  return { chart, birthIso, opts, kpOpts, natal, lagna, moon, kpMoon,
    ownMarks: natalOwnMarks(natal, lagna), kpScore: createKpEventScorer(kp.cusps, kp.significators, kp.planets),
    parashariScore: createParashariEventScorer(natal, lagna, birthIso, chart.timezone) };
}

export type ResearchFrame = ReturnType<typeof researchFrame>;
export type Observation = ReturnType<typeof observe>;

/** Uses exactly the event moment and production KP and Parashari scorer inputs. */
export function observe(frame: ResearchFrame, event: ChartEvent, date = event.date) {
  const at = eventInstant(date, event, frame.chart.timezone).toUTC(), iso = at.toISO()!, jd = julianDay(at);
  const sky = positionsLite(jd, frame.opts), kpSky = positionsLite(jd, frame.kpOpts);
  const gochara = computeGochara(frame.moon.signIndex, sky, iso, false, { ownMarks: frame.ownMarks });
  const row = (planet: Planet) => {
    const r = gochara.rows.find((p) => p.planet === planet);
    if (!r) throw new Error(`Missing transit ${planet}`);
    return { house: r.house, houseFavourable: r.favourable, verdict: r.verdict,
      marks: r.avMarks ?? null, marksOverride: !!r.avNote, vedhaBy: r.vedhaBy,
      dignity: r.dignityNote?.text ?? null, aspectBy: r.aspectNote?.by ?? [] };
  };
  const jupiter = row("Jupiter"), saturn = row("Saturn");
  const matter = matterOf(event.matter);
  const lords = vimshottariLordsAt(frame.kpMoon.lon, frame.birthIso, iso);
  const kp = frame.kpScore(matter.houses, matter.cusp, lords, kpSky, matter.id, false);
  const para = frame.parashariScore({ label: matter.label, matter: matter.id, outcome: event.outcome,
    time: event.time, timezone: event.timezone }, date, iso, sky);
  return { date, iso, moonInSky: SIGNS[sky.find((p) => p.planet === "Moon")!.signIndex],
    jupiter, saturn,
    full: Number(jupiter.verdict === "favourable") + Number(saturn.verdict === "favourable"),
    house: Number(jupiter.houseFavourable) + Number(saturn.houseFavourable),
    all7: CLASSICAL.filter((p) => row(p).verdict === "favourable").length,
    kp: kp.score, kpTransit: kp.transit.score, parashari: para.divisional?.score ?? null };
}

/** Stable and independent for each person/event; Fisher-Yates selects dates without replacement. */
export function offsetsFor(key: string) {
  let state = createHash("sha256").update(`moon-gochara-v1/${key}`).digest().readUInt32LE(0);
  const rnd = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const offsets = Array.from({ length: 716 }, (_, i) => i < 358 ? i - 365 : i - 350);
  for (let i = offsets.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [offsets[i], offsets[j]] = [offsets[j], offsets[i]];
  }
  return offsets;
}

/** Keep the local clock/zone, sample without replacement and skip DST gaps and folds. */
export function comparisonDates(chart: InsertChart, event: ChartEvent, key: string, n = 200) {
  const out: { date: string; offset: number }[] = [];
  const day = DateTime.fromISO(event.date, { zone: "utc" });
  for (const offset of offsetsFor(key)) {
    const date = day.plus({ days: offset }).toISODate()!;
    if (date < chart.birthDate || (chart.deathDate && date > chart.deathDate)) continue;
    try {
      if (eventInstant(date, event, chart.timezone).toMillis() < Date.parse(birthInstant(chart).utc.toISO()!)) continue;
    } catch { continue; }
    out.push({ date, offset });
    if (out.length === n) return out;
  }
  throw new Error(`Fewer than ${n} valid comparison dates for ${key}`);
}

/** Fraction below plus half the fraction tied; the comparator must order low to high. */
export function midrank<T>(actual: T, controls: T[], compare: (a: T, b: T) => number) {
  if (!controls.length) throw new Error("Need comparison dates");
  let below = 0, tied = 0;
  for (const control of controls) { const c = compare(control, actual); if (c < 0) below++; else if (c === 0) tied++; }
  return (below + tied / 2) / controls.length;
}

export function ranks(actual: Observation, controls: Observation[]) {
  const plain = (field: "full" | "house" | "all7" | "kp" | "kpTransit" | "parashari") => {
    if (actual[field] === null || controls.some((c) => c[field] === null)) return null;
    return midrank(actual, controls, (a, b) => a[field]! - b[field]!);
  };
  const tie = (field: "kp" | "kpTransit" | "parashari") => {
    if (actual[field] === null || controls.some((c) => c[field] === null)) return null;
    return midrank(actual, controls, (a, b) => (a[field]! - b[field]!) || (a.full - b.full));
  };
  return { full: plain("full"), house: plain("house"), all7: plain("all7"), kp: plain("kp"),
    kpWithTieBreak: tie("kp"), kpTransit: plain("kpTransit"), kpTransitWithTieBreak: tie("kpTransit"),
    parashari: plain("parashari"), parashariWithTieBreak: tie("parashari") };
}
