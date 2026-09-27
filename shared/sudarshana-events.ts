/**
 * Sudarshana chakra against recorded events.
 *
 * Parashara allots one year of life to each bhava in turn, and one month inside each year (74.21-23), and
 * says which placements make the year good or bad (74.24-26). This module places every recorded event on that
 * calendar and asks whether the year and month the event fell in read the way the event went. A shuffled-date
 * baseline answers whether the agreement is better than the same events at random dates in the same span.
 *
 * Source: BPHS ch. 74 (jyotishvidya.com/ch74.htm). The comparison itself is a validation device and is marked
 * provisional; the chapter does not describe checking the chakra against a life history.
 */
import { DateTime } from "luxon";
import {
  effectiveOutcome,
  matterOf,
  type ChartEvent,
  type EventOutcome,
} from "./events";
import { BPHS_URL } from "./parashari-data";
import type { ParashariSource } from "./parashari";
import type { SudarshanaHouseYear, SudarshanaResult } from "./sudarshana";

export type SudarshanaAgreement = "agree" | "conflict" | "open";

export interface SudarshanaEventRow {
  id: string;
  date: string;
  matter: string;
  matterLabel: string;
  outcome: EventOutcome;
  /** Completed years at the event. */
  age: number;
  yearHouse: number;
  yearStart: string;
  yearEnd: string;
  year: SudarshanaHouseYear;
  monthIndex: number;
  monthHouse: number;
  month: SudarshanaHouseYear;
  yearAgreement: SudarshanaAgreement;
  monthAgreement: SudarshanaAgreement;
  /** The year-lagna is one of the houses KP times the matter by, or its cusp (provisional relevance mark). */
  yearHouseFitsMatter: boolean;
  monthHouseFitsMatter: boolean;
}

export interface SudarshanaBaselineStat {
  actual: number;
  mean: number;
  sd: number;
  /** Share of random trials the real events beat, ties counted half (0-100). */
  percentile: number;
  verdict: "above" | "chance" | "below";
}

export interface SudarshanaEventsResult {
  rows: SudarshanaEventRow[];
  summary: {
    events: number;
    year: Record<SudarshanaAgreement, number>;
    month: Record<SudarshanaAgreement, number>;
    yearFits: number;
    monthFits: number;
  };
  /** Null with fewer than two events or a span under a year. */
  baseline: {
    trials: number;
    span: [string, string];
    year: SudarshanaBaselineStat;
    month: SudarshanaBaselineStat;
    fits: SudarshanaBaselineStat;
  } | null;
  sources: Record<string, ParashariSource>;
  caveats: string[];
}

const S = (verse: string, provisional?: boolean): ParashariSource => ({
  label: `Parashara 74.${verse}`,
  url: BPHS_URL(74),
  provisional,
});

export const SUDARSHANA_EVENT_SOURCES = {
  dasa: S("21-23"),
  effects: S("24-26"),
  comparison: S("21-26", true),
  relevance: S("21-23", true),
} satisfies Record<string, ParashariSource>;

const BASELINE_TRIALS = 400;

/** Deterministic generator so the baseline is reproducible for a given event list (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function agreement(
  verdict: SudarshanaHouseYear["verdict"],
  outcome: EventOutcome,
): SudarshanaAgreement {
  if (verdict === "mixed" || outcome === "mixed") return "open";
  return verdict === outcome ? "agree" : "conflict";
}

/** Where a UTC instant falls on the bhava dasa: the year's house and the month's house. */
export function sudarshanaAt(s: SudarshanaResult, at: DateTime) {
  const birth = DateTime.fromISO(s.birthIso, { zone: "utc" });
  const age = Math.max(0, Math.floor(at.diff(birth, "years").years));
  const yearStart = birth.plus({ years: age });
  const yearEnd = birth.plus({ years: age + 1 });
  const frac =
    at.diff(yearStart, "milliseconds").milliseconds /
    yearEnd.diff(yearStart, "milliseconds").milliseconds;
  const monthIndex = Math.min(11, Math.max(0, Math.floor(frac * 12)));
  const yearHouse = (age % 12) + 1;
  const monthHouse = ((yearHouse - 1 + monthIndex) % 12) + 1;
  return { age, yearHouse, yearStart, yearEnd, monthIndex, monthHouse };
}

export function compareSudarshanaEvents(
  s: SudarshanaResult,
  events: ChartEvent[],
  timezone: string,
): SudarshanaEventsResult {
  const toUtc = (date: string) =>
    DateTime.fromISO(date, { zone: timezone }).plus({ hours: 12 }).toUTC();

  const score = (e: ChartEvent, date: string): SudarshanaEventRow => {
    const outcome = effectiveOutcome(e);
    const m = matterOf(e.matter);
    const at = sudarshanaAt(s, toUtc(date));
    const year = s.houseYears[at.yearHouse - 1];
    const month = s.houseYears[at.monthHouse - 1];
    const fits = (h: number) => m.houses.includes(h) || m.cusp === h;
    return {
      id: e.id,
      date,
      matter: e.matter,
      matterLabel: m.label,
      outcome,
      age: at.age,
      yearHouse: at.yearHouse,
      yearStart: at.yearStart.toISO()!,
      yearEnd: at.yearEnd.toISO()!,
      year,
      monthIndex: at.monthIndex,
      monthHouse: at.monthHouse,
      month,
      yearAgreement: agreement(year.verdict, outcome),
      monthAgreement: agreement(month.verdict, outcome),
      yearHouseFitsMatter: fits(at.yearHouse),
      monthHouseFitsMatter: fits(at.monthHouse),
    };
  };

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const rows = sorted.map((e) => score(e, e.date));
  const count = (
    pick: (r: SudarshanaEventRow) => SudarshanaAgreement,
  ): Record<SudarshanaAgreement, number> => ({
    agree: rows.filter((r) => pick(r) === "agree").length,
    conflict: rows.filter((r) => pick(r) === "conflict").length,
    open: rows.filter((r) => pick(r) === "open").length,
  });
  const summary = {
    events: rows.length,
    year: count((r) => r.yearAgreement),
    month: count((r) => r.monthAgreement),
    yearFits: rows.filter((r) => r.yearHouseFitsMatter).length,
    monthFits: rows.filter((r) => r.monthHouseFitsMatter).length,
  };

  // Shuffled-date baseline: the same events, each moved to a random date inside the span of the real ones.
  let baseline: SudarshanaEventsResult["baseline"] = null;
  if (sorted.length >= 2) {
    const lo = toUtc(sorted[0].date).toMillis();
    const hi = toUtc(sorted[sorted.length - 1].date).toMillis();
    if (hi - lo >= 365 * 86400000) {
      const rnd = seeded(
        sorted.reduce(
          (a, e) => a + e.date.length * 31 + e.matter.length + e.id.length,
          sorted.length,
        ),
      );
      const measures = {
        year: (rs: SudarshanaEventRow[]) =>
          rs.filter((r) => r.yearAgreement === "agree").length -
          rs.filter((r) => r.yearAgreement === "conflict").length,
        month: (rs: SudarshanaEventRow[]) =>
          rs.filter((r) => r.monthAgreement === "agree").length -
          rs.filter((r) => r.monthAgreement === "conflict").length,
        fits: (rs: SudarshanaEventRow[]) =>
          rs.filter((r) => r.yearHouseFitsMatter || r.monthHouseFitsMatter)
            .length,
      };
      const keys = Object.keys(measures) as (keyof typeof measures)[];
      const samples: Record<keyof typeof measures, number[]> = {
        year: [],
        month: [],
        fits: [],
      };
      for (let t = 0; t < BASELINE_TRIALS; t++) {
        const trial = sorted.map((e) =>
          score(
            e,
            DateTime.fromMillis(lo + Math.floor(rnd() * (hi - lo)), {
              zone: timezone,
            }).toISODate()!,
          ),
        );
        for (const k of keys) samples[k].push(measures[k](trial));
      }
      const stat = (k: keyof typeof measures): SudarshanaBaselineStat => {
        const xs = samples[k];
        const actual = measures[k](rows);
        const mean = xs.reduce((a, x) => a + x, 0) / xs.length;
        const sd = Math.sqrt(
          xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length,
        );
        const below = xs.filter((x) => x < actual).length;
        const equal = xs.filter((x) => x === actual).length;
        const percentile = Math.round(((below + equal / 2) / xs.length) * 100);
        return {
          actual,
          mean: Math.round(mean * 10) / 10,
          sd: Math.round(sd * 10) / 10,
          percentile,
          verdict:
            percentile >= 95 ? "above" : percentile <= 5 ? "below" : "chance",
        };
      };
      baseline = {
        trials: BASELINE_TRIALS,
        span: [sorted[0].date, sorted[sorted.length - 1].date],
        year: stat("year"),
        month: stat("month"),
        fits: stat("fits"),
      };
    }
  }

  const caveats = [
    "An event agrees when its recorded outcome (or the matter's own nature) matches the verdict of the bhava ruling the year, and separately the month, it fell in; mixed on either side is left open. The chapter gives the year and month rulers and their conditions but does not describe checking them against a life history (provisional).",
    "The relevance mark asks whether the year-lagna or month-lagna is one of the houses the matter is timed by in KP, or its promising cusp; the chapter does not tie a bhava's year to that bhava's matters (provisional).",
    "The shuffled-date baseline moves each event to a random date inside the span of the real ones and repeats the count, so a chart whose bhavas are mostly favourable is not credited for favourable events falling anywhere. The score is agreements minus conflicts.",
  ];

  return {
    rows,
    summary,
    baseline,
    sources: SUDARSHANA_EVENT_SOURCES,
    caveats,
  };
}
