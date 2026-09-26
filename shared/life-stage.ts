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

import type { LifeArea } from "./rules";

export type LifeStage = "child" | "youth" | "adult" | "elder";

/** Age in years (decimal) at `asOfIso`. */
export function ageYears(birthIso: string, asOfIso: string): number {
  return (Date.parse(asOfIso) - Date.parse(birthIso)) / (365.25 * 86400e3);
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

/** Age from which an area is read as a present matter rather than a promise held for later (provisional conventions). */
export const AREA_ONSET: Partial<Record<LifeArea, number>> = {
  marriage: 18,
  children: 18,
  career: 16,
  wealth: 16,
};

export interface AreaSeason {
  inSeason: boolean;
  /** Onset age for the area, when one applies. */
  from?: number;
  /** ISO date on which the area comes into season. */
  fromDate?: string;
}

export function areaSeason(
  area: LifeArea,
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
  area: LifeArea,
  birthIso: string,
  asOfIso: string,
): string {
  const s = areaSeason(area, birthIso, asOfIso);
  const today = asOfIso.slice(0, 10);
  return s.fromDate && s.fromDate > today ? s.fromDate : today;
}
