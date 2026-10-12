/**
 * "Now and next" for the Parashari Timing chapter: the running Vimshottari periods (BPHS ch. 46-61),
 * the Sudarshana year (ch. 74), Saturn's and Jupiter's present passages scored by the Ashtakavarga
 * (ch. 66-72), and the changes due within a horizon.
 *
 * Display only. Every value is read from results computed elsewhere, so nothing here adds a rule;
 * gating and wording stay with the sources (pass the gated timeline for a minor).
 */
import { DateTime } from "luxon";
import type { Planet } from "./astro";
import type { DasaReading, Tone } from "./parashari-dasa";
import type { DashaGloss, ParashariFinding } from "./parashari";
import type { SudarshanaResult } from "./sudarshana";
import type { AvTimeline, AvTransitRow } from "./av-transit";

export type NowTone = "favourable" | "mixed" | "unfavourable";

const fromTone = (t: Tone): NowTone =>
  t === "support" ? "favourable" : t === "strain" ? "unfavourable" : "mixed";

export interface NowPeriod {
  lord: Planet;
  start: string;
  end: string;
  /** The period's verdict; spells (pratyantars) carry none. */
  tone?: NowTone;
}

export interface NowYear {
  /** Completed years at the start of the year. */
  age: number;
  /** The bhava that rules the year (74.24-26). */
  house: number;
  start: string;
  end: string;
  tone: NowTone;
  plus: number;
  minus: number;
}

export interface NowTransit {
  planet: "Saturn" | "Jupiter";
  signIndex: number;
  house: number;
  start: string;
  end: string;
  tone: NowTone;
  /** Sarvashtakavarga rekhas in the sign. */
  points: number;
  retrogradeEntry: boolean;
}

export type ChangeKind = "spell" | "sub-period" | "period" | "year" | "transit";

/** The five Vimshottari levels, named as the Parashari tab names them (Santhanam's spellings). */
export type DasaLevel = "dasa" | "antar" | "pratyantar" | "sookshma" | "prana";

export const LEVEL_GLOSS: Record<DasaLevel, string> = {
  dasa: "main period",
  antar: "sub-period",
  pratyantar: "third-level period",
  sookshma: "fourth-level period",
  prana: "fifth-level period",
};

/** "Mars antar" in the practitioner reading, "Mars antar (sub-period)" in the plain one: the level is always named. */
export function levelName(level: DasaLevel, plain: boolean): string {
  return plain ? `${level} (${LEVEL_GLOSS[level]})` : level;
}

export interface TimingChange {
  kind: ChangeKind;
  /** ISO instant the change takes effect. */
  date: string;
  end?: string;
  tone?: NowTone;
  /** Spell, sub-period and period: the incoming lord. */
  lord?: Planet;
  /** Spell: the running antar's lord. Sub-period: the running dasa's lord. */
  parent?: Planet;
  /** Period: its length in whole years. */
  years?: number;
  /** Period: the incoming lord's lordship gloss. */
  gloss?: DashaGloss;
  /** Year: the bhava that rules it. Transit: the whole-sign house entered. */
  house?: number;
  transit?: NowTransit;
}

export interface TimingNow {
  dasa?: NowPeriod;
  antar?: NowPeriod;
  pratyantar?: NowPeriod;
  year?: NowYear;
  saturn?: NowTransit;
  jupiter?: NowTransit;
  /** Changes within the horizon, earliest first; empty after a recorded death. */
  next: TimingChange[];
}

const toTransit = (r: AvTransitRow): NowTransit => ({
  planet: r.planet,
  signIndex: r.signIndex,
  house: r.house,
  start: r.start,
  end: r.end,
  tone: fromTone(r.tone),
  points: r.sarva,
  retrogradeEntry: r.retrogradeEntry,
});

export function timingNow(o: {
  dasaReadings: DasaReading[];
  dashas: DashaGloss[];
  sudarshana?: SudarshanaResult;
  av?: AvTimeline;
  asOfIso: string;
  /** How far ahead to list changes; 18 months by default. */
  horizonMonths?: number;
  /** After a recorded death the running state is read at that date and nothing is listed ahead. */
  past?: boolean;
}): TimingNow {
  const asOf = DateTime.fromISO(o.asOfIso);
  const horizon = asOf.plus({ months: o.horizonMonths ?? 18 });
  const within = (iso: string) => {
    const t = DateTime.fromISO(iso);
    return t > asOf && t <= horizon;
  };
  const out: TimingNow = { next: [] };

  const di = o.dasaReadings.findIndex((d) => d.current);
  const d = di >= 0 ? o.dasaReadings[di] : undefined;
  const ai = d ? d.antars.findIndex((a) => a.current) : -1;
  const a = d && ai >= 0 ? d.antars[ai] : undefined;
  const pi = a?.pratyantars ? a.pratyantars.findIndex((p) => p.current) : -1;
  const p = a?.pratyantars && pi >= 0 ? a.pratyantars[pi] : undefined;
  if (d) out.dasa = { lord: d.lord, start: d.start, end: d.end, tone: fromTone(d.verdict) };
  if (a) out.antar = { lord: a.lord, start: a.start, end: a.end, tone: fromTone(a.verdict) };
  if (p) out.pratyantar = { lord: p.lord, start: p.start, end: p.end };

  const sud = o.sudarshana?.applicable ? o.sudarshana : undefined;
  const y = sud?.currentYear;
  if (y)
    out.year = { age: y.age, house: y.house, start: y.start, end: y.end, tone: y.verdict, plus: y.plus, minus: y.minus };
  const sat = o.av?.saturn.find((r) => r.current);
  const jup = o.av?.jupiter.find((r) => r.current);
  if (sat) out.saturn = toTransit(sat);
  if (jup) out.jupiter = toTransit(jup);

  if (o.past) return out;
  const next: TimingChange[] = [];
  // The spell after the running one, inside the running sub-period; a sub-period change covers the rest.
  const np = a?.pratyantars && pi >= 0 ? a.pratyantars[pi + 1] : undefined;
  if (np && within(np.start)) next.push({ kind: "spell", date: np.start, end: np.end, lord: np.lord, parent: a?.lord });
  // The next sub-period in the running period; the first of the next period comes with the period change.
  const na = d && ai >= 0 ? d.antars[ai + 1] : undefined;
  if (na && within(na.start))
    next.push({ kind: "sub-period", date: na.start, end: na.end, lord: na.lord, parent: d?.lord, tone: fromTone(na.verdict) });
  const nd = di >= 0 ? o.dasaReadings[di + 1] : undefined;
  if (nd && within(nd.start))
    next.push({
      kind: "period",
      date: nd.start,
      end: nd.end,
      lord: nd.lord,
      tone: fromTone(nd.verdict),
      years: Math.round(DateTime.fromISO(nd.end).diff(DateTime.fromISO(nd.start), "years").years),
      gloss: o.dashas.find((g) => g.lord === nd.lord && g.start === nd.start) ?? o.dashas.find((g) => g.lord === nd.lord),
    });
  const ny = sud?.years.find((x) => DateTime.fromISO(x.start) > asOf);
  if (ny && within(ny.start)) next.push({ kind: "year", date: ny.start, end: ny.end, house: ny.house, tone: ny.verdict });
  // The first sign change of each slow planet; the back-and-forth of retrogression stays in the transit table.
  for (const rows of [o.av?.saturn ?? [], o.av?.jupiter ?? []]) {
    const r = rows.find((x) => within(x.start));
    if (r) {
      const t = toTransit(r);
      next.push({ kind: "transit", date: r.start, end: r.end, house: r.house, tone: t.tone, transit: t });
    }
  }
  out.next = next.sort((x, z) => DateTime.fromISO(x.date).toMillis() - DateTime.fromISO(z.date).toMillis());
  return out;
}

const SEVEN: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** Parashara's combination that the text itself ties to its planets' periods: 41.16-17, wealth in the dasas of the 5th and 9th lords and planets joined to them. */
export const PERIOD_TIED_FINDINGS = new Set(["pa-wealth-5-9"]);

export interface RunningCombination {
  finding: ParashariFinding;
  /** The running lords that take part in it. */
  lords: Planet[];
  /** True when the text ties this combination to its planets' periods; otherwise the link is provisional. */
  sourced: boolean;
}

/**
 * Parashara's combinations (yogas and testing combinations) that a running period lord takes part in.
 * Only 41.16-17 says a combination gives its results in its planets' periods; BPHS ch. 34 and 39 state
 * no general rule, so every other link is provisional.
 */
export function runningCombinations(findings: ParashariFinding[], lords: Planet[]): RunningCombination[] {
  const uniq = Array.from(new Set(lords));
  return findings
    .filter(
      (f) =>
        (f.kind === "yoga" || f.kind === "strain") &&
        // The Nabhasa yogas of number and shape (ch. 35) are made by all seven planets together, so no one planet's period carries them.
        f.planets.filter((pl) => SEVEN.includes(pl)).length < SEVEN.length &&
        f.planets.some((pl) => uniq.includes(pl)),
    )
    .map((f) => ({ finding: f, lords: uniq.filter((l) => f.planets.includes(l)), sourced: PERIOD_TIED_FINDINGS.has(f.id) }))
    .sort((x, z) => Number(z.sourced) - Number(x.sourced));
}
