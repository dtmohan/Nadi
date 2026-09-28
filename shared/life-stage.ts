// Age-aware reading. A chart holds every promise from birth, but a promise is only worth
// speaking to when the native has reached the age at which that matter is lived.
//
// What the classics give us: Parashara's order for a fresh chart is longevity first,
// "first of all estimate the evils and the checking factors thereof, then declare the
// effects of the 12 bhavas" (BPHS 9.1), and his three life-span classes, short up to 32,
// medium 32 to 64, long 64 to 100 (BPHS 44.10-14). No chapter of BPHS assigns a maturity
// age to each planet; the popular table (Jupiter 16, Sun 22 ... Ketu 48) is later usage
// and is not used here. The onset ages below are practical conventions and are marked
// provisional in the interface.

export type LifeStage = "child" | "youth" | "adult" | "elder";

/** Age in years (decimal) at `asOfIso`. */
export function ageYears(birthIso: string, asOfIso: string): number {
  return (Date.parse(asOfIso) - Date.parse(birthIso)) / (365.25 * 86400e3);
}

/** The instant the life readings are read at: the date of passing when one is recorded and already past, else `asOfIso`. */
export function lifeAsOf(
  chart: { deathDate?: string | null },
  asOfIso: string,
): string {
  const d = chart.deathDate;
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return asOfIso;
  const death = `${d}T12:00:00.000Z`;
  return Date.parse(death) < Date.parse(asOfIso) ? death : asOfIso;
}

/** True when a date of passing is recorded and already past. */
export function isDeceased(
  chart: { deathDate?: string | null },
  asOfIso: string,
): boolean {
  return lifeAsOf(chart, asOfIso) !== asOfIso;
}

/** ISO date at which the native turns `years`. */
export function dateAtAge(birthIso: string, years: number): string {
  return new Date(Date.parse(birthIso) + years * 365.25 * 86400e3)
    .toISOString()
    .slice(0, 10);
}

/** Stage bands: child and youth are conventions (provisional); 64 follows BPHS 44.10-14, where medium life ends and long life begins. */
export function lifeStage(age: number): LifeStage {
  if (age < 12) return "child";
  if (age < 18) return "youth";
  if (age < 64) return "adult";
  return "elder";
}

export const STAGE_LABEL: Record<LifeStage, string> = {
  child: "childhood",
  youth: "youth",
  adult: "adult life",
  elder: "later life",
};

/** Age from which an area is read as a present matter rather than a promise held for later (provisional conventions). Keys are shared across the BNN, Jaimini and KP readings. */
export const AREA_ONSET: Record<string, number> = {
  marriage: 18,
  children: 18,
  career: 16,
  wealth: 16,
};

/** KP timed matters mapped to the area whose onset gates them. */
export const KP_EVENT_AREA: Record<string, string> = {
  marriage: "marriage",
  children: "children",
  job: "career",
  business: "career",
  property: "wealth",
  loan: "wealth",
};

/** Bhava (1-12) mapped to the area whose onset gates its verdict in house-based systems. */
export const HOUSE_AREA: Record<number, string> = {
  5: "children",
  7: "marriage",
  10: "career",
};

export interface AreaSeason {
  inSeason: boolean;
  /** Onset age for the area, when one applies. */
  from?: number;
  /** ISO date on which the area comes into season. */
  fromDate?: string;
}

export function areaSeason(
  area: string,
  birthIso: string,
  asOfIso: string,
): AreaSeason {
  const from = AREA_ONSET[area];
  if (from === undefined) return { inSeason: true };
  const age = ageYears(birthIso, asOfIso);
  return {
    inSeason: age >= from,
    from,
    fromDate: dateAtAge(birthIso, from),
  };
}

/** Earliest date from which a timed window for the area should be searched: today, or the onset if that is later. */
export function seasonStart(
  area: string,
  birthIso: string,
  asOfIso: string,
): string {
  const s = areaSeason(area, birthIso, asOfIso);
  const today = asOfIso.slice(0, 10);
  return s.fromDate && s.fromDate > today ? s.fromDate : today;
}

// ---------------------------------------------------------------------------------------------
// Sensitive-content gate. Length of life, maraka periods, arishta and the loss of a parent are
// read only for a native of 18 or more (at the date of passing when one is recorded); for a
// younger native the server and every computing module strip such statements before anything
// is rendered, so one rule covers the API, the PDF, the report and every tab. The age bound is
// a policy of this app, not a rule of the texts, and is marked provisional in the interface.

import { isSensitive } from "./gentle";

export const SENSITIVE_MIN_AGE = 18;

export interface SensitiveGate {
  /** True when sensitive statements are withheld for this native. */
  withheld: boolean;
  /** Age at the reading instant (the date of passing when recorded and past). */
  ageYears: number;
  minAge: number;
}

export function sensitiveGate(
  chart: { deathDate?: string | null },
  birthIso: string,
  asOfIso: string,
): SensitiveGate {
  const age = ageYears(birthIso, lifeAsOf(chart, asOfIso));
  return { withheld: age < SENSITIVE_MIN_AGE, ageYears: age, minAge: SENSITIVE_MIN_AGE };
}

export const SENSITIVE_WITHHELD_NOTE = `Length-of-life, maraka and arishta statements, and those on the loss of a parent, are not shown for a native under ${SENSITIVE_MIN_AGE}. The combinations remain in the chart and are read when the native comes of age (a policy of this app, provisional).`;

/** Terms beyond the gentle map that mark a statement as withheld for a minor. */
const MINOR_RE =
  /\b(maraka|marakas|longevity|alpayu|madhyayu|purnayu|arishta|balarishta|span of life|length of life|life[- ]span|end of life|one's own end|demise|fatal|loss of (a |the |one's )?(father|mother|parent|parents)|(father|mother|parent)'s (death|passing|end|loss)|risk to life|threat to life|danger to life|killer)\b/i;

/** True when a statement is withheld for a native under the gate age. */
export function withholdText(text: string): boolean {
  return MINOR_RE.test(text) || isSensitive(text);
}

/** Keys that hold identifiers or enumerations, never prose; left untouched by the redaction. */
const KEEP_KEYS = new Set([
  "id", "ruleId", "url", "kind", "layer", "tone", "verdict", "functional", "group", "polarity",
  "chart", "lord", "planet", "planets", "sign", "signName", "karaka", "start", "end", "term",
  "key", "subLord", "starLord", "source", "when", "area", "role", "level", "standing", "status",
  "mode", "type", "house", "cusp", "verse", "verses", "ch", "label", "short", "name", "nakshatra",
]);
/** Keys whose object is dropped from a list when its own text is withheld. */
const HEAD_KEYS = ["text", "title", "topic", "headline", "summary", "blurb", "matters"];

/** A sentence that is a bare list of matters (three or more comma-separated items) loses only the offending items. */
function stripSentence(p: string): string | null {
  if (!withholdText(p)) return p;
  const items = p.split(/,\s*/);
  if (items.length < 3) return null;
  const kept = items.filter((it) => !withholdText(it));
  if (kept.length < 2) return null;
  const tail = /[.;!?]$/.test(p) ? p.slice(-1) : "";
  const joined = kept.join(", ").replace(/[.;!?]$/, "") + tail;
  return /^[A-Z]/.test(p) ? joined.replace(/^./, (c) => c.toUpperCase()) : joined;
}

/** Prose with every withheld sentence removed (a bare list of matters loses only the offending items). */
export function redactProse(s: string): string {
  return stripSentences(s);
}

function stripSentences(s: string): string {
  if (!withholdText(s)) return s;
  const parts = s.split(/(?<=[.;!?])\s+/);
  const kept = parts.map(stripSentence).filter((p): p is string => p !== null);
  return kept.join(" ").trim();
}

/**
 * Deep copy of `value` with every withheld statement removed: sentences are dropped from prose
 * fields, strings are dropped from lists, and an object in a list is dropped when its heading
 * text is entirely withheld. Identifiers and enumerations are kept. Used only when the gate is on.
 */
export function redactSensitive<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    if (key && KEEP_KEYS.has(key)) return value;
    const out = stripSentences(value);
    if (out === "" && key === "maraka") return null as unknown as T;
    return out as unknown as T;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      if (typeof item === "string") {
        const s = stripSentences(item);
        if (s) out.push(s);
      } else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const headed = HEAD_KEYS.some((k) => typeof o[k] === "string");
        const dropped =
          headed &&
          HEAD_KEYS.some((k) => typeof o[k] === "string" && (o[k] as string) !== "" && stripSentences(o[k] as string) === "");
        if (!dropped) out.push(redactSensitive(item));
      } else out.push(item);
    }
    return out as unknown as T;
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) out[k] = KEEP_KEYS.has(k) && typeof o[k] !== "object" ? o[k] : redactSensitive(o[k], k);
    return out as T;
  }
  return value;
}
