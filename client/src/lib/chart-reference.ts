import { norm360, type PlanetPosition } from "@shared/astro";
import type { ChartResult } from "@shared/schema";

/** The persistent view is always D1 at the entered birth time, not a candidate or event chart. */
export interface ChartReferenceFrame {
  kind: "natal" | "kp";
  positions: PlanetPosition[];
  risingSign: number;
  transits: PlanetPosition[];
  transitAsOf: string;
}

/** Truncate within the actual sign; rounding 29°59′59″ up must not display 0° in the old sign. */
export function referenceDegree(longitude: number): string {
  const seconds = Math.min(30 * 3600 - 1, Math.floor((norm360(longitude) % 30) * 3600));
  const degree = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = seconds % 60;
  return `${degree}°${String(minute).padStart(2, "0")}′${String(second).padStart(2, "0")}″`;
}

/** Choose both natal and transit positions from the same ayanamsa frame as the selected school. */
export function chartReferenceFrame(result: ChartResult, mode: string): ChartReferenceFrame | null {
  if (mode === "kp") {
    const kp = result.kp;
    const ascendant = kp?.cusps?.[0];
    if (!kp?.positions || !kp.now?.positions || !Number.isFinite(ascendant)) return null;
    return {
      kind: "kp",
      positions: kp.positions,
      risingSign: Math.floor(norm360(ascendant) / 30),
      transits: kp.now.positions.filter((p) => p.planet === "Jupiter" || p.planet === "Saturn"),
      transitAsOf: kp.now.asOf,
    };
  }
  if (!result.positions || !Number.isInteger(result.jaimini?.lagna?.signIndex)) return null;
  return {
    kind: "natal",
    positions: result.positions,
    risingSign: result.jaimini.lagna.signIndex,
    transits: result.now.positions.filter((p) => p.planet === "Jupiter" || p.planet === "Saturn"),
    transitAsOf: result.now.asOf,
  };
}
