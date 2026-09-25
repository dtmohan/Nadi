import type { Planet, PlanetPosition, TransitPeriod } from "@shared/astro";
import { computeAshtakavarga } from "@shared/ashtakavarga";
import type { FatherArishtaWindow } from "@shared/father-arishta";
import { signPeriodsOf, positionsAt, isoToJd, jdToIso, type EphemerisOptions } from "./ephemeris";

const MALEFICS: Planet[] = ["Sun", "Mars", "Rahu", "Ketu"];

/** Whole-sign aspect: every planet sees the 7th; Mars also the 4th and 8th (ch. 26, sign-based simplification). */
function aspects(from: Planet, fromSign: number, toSign: number): boolean {
  const d = ((toSign - fromSign + 12) % 12) + 1;
  if (d === 7) return true;
  if (from === "Mars" && (d === 4 || d === 8)) return true;
  return false;
}

/**
 * 70.12-14 windows: Saturn in the father's sign point or its trines while transiting Rahu, Saturn or Mars
 * stand in the 4th from the natal Sun. Association and aspect of malefics on Saturn are sampled mid-window.
 */
export function fatherArishtaWindows(positions: PlanetPosition[], lagnaIdx: number, saturnPeriods: TransitPeriod[], opts: EphemerisOptions): FatherArishtaWindow[] {
  const av = computeAshtakavarga(positions, lagnaIdx);
  const point = av.saturnPoints.find((p) => p.owner === "Sun" && p.houseFrom === 9);
  if (!point) return [];
  const sun = positions.find((p) => p.planet === "Sun")!;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const target = (sun.signIndex + 3) % 12;
  const out: FatherArishtaWindow[] = [];
  for (const sp of saturnPeriods) {
    if (sp.planet !== "Saturn") continue;
    const kind = sp.signIndex === point.transitSignIndex ? "sign" : point.trineSigns.includes(sp.signIndex) ? "trine" : null;
    if (!kind) continue;
    const jd0 = isoToJd(sp.start);
    const jd1 = isoToJd(sp.end);
    const mars = signPeriodsOf("Mars", jd0, jd1, opts);
    const rahu = signPeriodsOf("Rahu", jd0, jd1, opts);
    const bounds = Array.from(new Set([jd0, jd1, ...mars.map((m) => m.end), ...rahu.map((r) => r.end)])).sort((a, b) => a - b);
    const saturnIn = sp.signIndex === target;
    let open: { start: number; end: number; set: Planet[] } | null = null;
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i];
      const b = bounds[i + 1];
      if (b - a < 0.01) continue;
      const mid = (a + b) / 2;
      const set: Planet[] = [];
      if (rahu.find((r) => r.start <= mid && mid < r.end)?.signIndex === target) set.push("Rahu");
      if (saturnIn) set.push("Saturn");
      if (mars.find((m) => m.start <= mid && mid < m.end)?.signIndex === target) set.push("Mars");
      if (set.length === 0) {
        if (open) out.push(finish(open, sp.signIndex, kind));
        open = null;
        continue;
      }
      if (open && open.set.join() === set.join()) open.end = b;
      else {
        if (open) out.push(finish(open, sp.signIndex, kind));
        open = { start: a, end: b, set };
      }
    }
    if (open) out.push(finish(open, sp.signIndex, kind));
  }
  return out;

  function finish(w: { start: number; end: number; set: Planet[] }, saturnSign: number, pointKind: "sign" | "trine"): FatherArishtaWindow {
    const ninth: ("lagna" | "Moon")[] = [];
    if ((saturnSign - lagnaIdx + 12) % 12 === 8) ninth.push("lagna");
    if ((saturnSign - moon.signIndex + 12) % 12 === 8) ninth.push("Moon");
    const mid = positionsAt((w.start + w.end) / 2, opts);
    const malefics: FatherArishtaWindow["maleficsOnSaturn"] = [];
    for (const m of MALEFICS) {
      const pos = mid.find((p) => p.planet === m)!;
      if (pos.signIndex === saturnSign) malefics.push({ planet: m, how: "with" });
      else if (aspects(m, pos.signIndex, saturnSign)) malefics.push({ planet: m, how: "aspects" });
    }
    return { start: jdToIso(w.start), end: jdToIso(w.end), saturnSignIndex: saturnSign, pointKind, fourthFromSun: w.set, saturnNinthFrom: ninth, maleficsOnSaturn: malefics };
  }
}
