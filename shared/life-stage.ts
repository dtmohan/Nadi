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
