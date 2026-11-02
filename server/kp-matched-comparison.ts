/** A separate KP sensitivity comparison: keep a life-event sequence together
 * and move it by the same 180–365 local calendar days. This is not a set of
 * verified non-events or a calibrated hypothesis test. */
import { DateTime } from "luxon";
import { EVENT_MATTERS, type EventOutcome } from "@shared/events";
import type { KpEventRules } from "@shared/kp-event-evidence";
import { qualifiedComparable, qualifiedEventScores, qualifiedTotals, type QualifiedEventScores } from "@shared/qualified-event-scores";
import type { KpMatchedComparison, KpMatchedStat } from "@shared/kp-matched-types";
import { eventInstant } from "./event-time";

export type MatchedEvent = { date: string; time?: string; timezone?: string; matter?: string; outcome?: EventOutcome; cusp?: number; houses: number[] };
type Moment = { date: string; iso: string; ms: number };
type Trial = { offset: number; moments: Moment[] };

function random(seed: number) {
  let x = seed >>> 0;
  return () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedFor(events: readonly MatchedEvent[]): number {
  let n = 2166136261;
  for (const c of events.map((e) => `${e.date}|${e.matter ?? ""}|${e.time ?? ""}|${e.timezone ?? ""}`).join(";")) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
function shifted(date: string, days: number): string {
  return DateTime.fromISO(date, { zone: "utc" }).plus({ days }).toISODate()!;
}
export function matchedStats(xs: number[], actual: number): KpMatchedStat {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  const pct = Math.round(100 * (xs.filter((x) => x < actual).length + xs.filter((x) => x === actual).length / 2) / xs.length);
  return { actual, mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, percentile: pct,
    verdict: pct >= 95 ? "above" : pct <= 5 ? "below" : "chance" };
}

/** Prepare and shuffle date sets once per scan; select birth-valid sets for each candidate. */
export function prepareKpMatchedDates(events: readonly MatchedEvent[], birthZone: string, deathDate: string | null | undefined, asOfIso: string) {
  const asOf = Date.parse(asOfIso);
  if (!Number.isFinite(asOf)) throw new Error("Invalid comparison judgment instant");
  const actual = events.map((e) => { const d = eventInstant(e.date, e, birthZone).toUTC(); return { date: e.date, iso: d.toISO()!, ms: d.toMillis() }; });
  const offsets = Array.from({ length: 186 }, (_, i) => i + 180).flatMap((n) => [-n, n]);
  const rnd = random(seedFor(events));
  for (let i = offsets.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [offsets[i], offsets[j]] = [offsets[j], offsets[i]]; }
  const pool: Trial[] = [];
  if (events.length) for (const offset of offsets) {
    const moments: Moment[] = [];
    let valid = true;
    for (const e of events) {
      const date = shifted(e.date, offset);
      // Exclude an exactly recorded event of the same type, not all dates that
      // may also contain unrecorded events.
      if ((deathDate && date > deathDate) || events.some((x) => x.matter === e.matter && x.date === date)) { valid = false; break; }
      try { const d = eventInstant(date, e, birthZone).toUTC();
        if (d.toMillis() > asOf) { valid = false; break; }
        moments.push({ date, iso: d.toISO()!, ms: d.toMillis() });
      } catch { valid = false; break; }
    }
    // Different historical zones or DST can change absolute ordering despite a
    // shared calendar shift. Never silently reverse the recorded chronology.
    if (valid) for (let i = 0; i < actual.length; i++) for (let j = i + 1; j < actual.length; j++) {
      const before = Math.sign(actual[i].ms - actual[j].ms);
      if (before && Math.sign(moments[i].ms - moments[j].ms) !== before) valid = false;
    }
    if (valid) pool.push({ offset, moments });
  }
  return (birthMs: number): { actual: Moment[]; available: number; trials: Trial[] } => {
    if (!events.length || actual.some((m) => m.ms < birthMs || m.ms > asOf || (deathDate && m.date > deathDate)))
      return { actual, available: 0, trials: [] };
    const legal = pool.filter((trial) => trial.moments.every((m) => m.ms >= birthMs));
    return { actual, available: legal.length, trials: legal.slice(0, 200) };
  };
}

function qualified(event: MatchedEvent, kp: KpEventRules, birthIso: string, at: Moment): QualifiedEventScores {
  const known = EVENT_MATTERS.find((m) => m.id === event.matter);
  const outcome = event.outcome ?? (known?.nature === "good" ? "favourable" : known?.nature === "bad" ? "unfavourable" : "mixed");
  const custom = !known || event.cusp !== known.cusp || [...event.houses].sort((a,b) => a-b).join(",") !== [...known.houses].sort((a,b) => a-b).join(",");
  return qualifiedEventScores({ matter: event.matter, outcome, custom, birthIso, eventIso: at.iso, natalPositions: [], sky: [], kp });
}

export function summarizeKpMatched(events: readonly MatchedEvent[], selection: ReturnType<ReturnType<typeof prepareKpMatchedDates>>,
  birthIso: string, actual: readonly KpEventRules[], score: (event: MatchedEvent, at: Moment) => KpEventRules): KpMatchedComparison {
  if (selection.trials.length < 40) return { status: "unavailable", eligibleOffsets: selection.available, reason: "Fewer than 40 valid shared offsets; check birth, passing, event dates and judgment date." };
  const actualTiming = actual.reduce((s, k) => s + k.hits.filter(Boolean).length, 0);
  const actualTransit = actual.reduce((s, k) => s + k.transit.score, 0);
  const actualAurora = actual.filter((k) => k.aurora?.allSupported).length;
  const actualV2 = actual.filter((k) => k.auroraV2?.allSupported).length;
  const aq = actual.map((k, i) => qualified(events[i], k, birthIso, selection.actual[i]));
  const timing: number[] = [], transit: number[] = [], aurora: number[] = [], auroraV2: number[] = [], kpQualified: number[] = [];
  let comparable = true;
  for (const trial of selection.trials) {
    const checks = events.map((e, i) => score(e, trial.moments[i]));
    timing.push(checks.reduce((s, k) => s + k.hits.filter(Boolean).length, 0));
    transit.push(checks.reduce((s, k) => s + k.transit.score, 0));
    aurora.push(checks.filter((k) => k.aurora?.allSupported).length);
    auroraV2.push(checks.filter((k) => k.auroraV2?.allSupported).length);
    const sq = checks.map((k, i) => qualified(events[i], k, birthIso, trial.moments[i]));
    if (!qualifiedComparable(aq, sq, "kp")) comparable = false;
    kpQualified.push(qualifiedTotals(sq, "kp").score);
  }
  const total = qualifiedTotals(aq, "kp");
  return { status: "available", trials: selection.trials.length, eligibleOffsets: selection.available,
    offsets: selection.trials.map((t) => t.offset), exampleOffsetDays: selection.trials[0].offset, exampleDates: selection.trials[0].moments.map((m) => m.date),
    timing: matchedStats(timing, actualTiming), timingMax: 3 * events.length,
    transit: matchedStats(transit, actualTransit),
    ...(actual.some((k) => k.aurora) ? { aurora: matchedStats(aurora, actualAurora) } : {}),
    ...(actual.some((k) => k.auroraV2) ? { auroraV2: matchedStats(auroraV2, actualV2) } : {}),
    ...(total.max && comparable ? { qualified: matchedStats(kpQualified, total.score) } : {}),
  };
}
