/**
 * KP event windows, drilled: a joint dasa–bhukti–antara period is only the first sieve. The books
 * refine it in four ways, each paraphrased from the practitioner's copies of Astro Secrets &
 * Krishnamurti Padhdhati (cited by part and printed page; nothing reproduced):
 *
 * 1. Grade of signification (Part 2 p. 148, "exhaustive list"): a planet in the star of an occupant
 *    is the strongest significator; the occupant next; a planet in the star of the owner; the owner
 *    last, and only strong when nothing occupies the bhava or its stars.
 * 2. Fruitful significators, Method I (Part 2 p. 24, KP & Astrology July 1990; Part 2 p. 148): count
 *    the sub each significator stands in; select it when the sub lord is itself a strong significator
 *    of the matter, set it aside when the sub lord is not connected with the matter's houses. The sub
 *    tells the strength of the planet (Part 2 p. 13).
 * 3. Negating houses (Part 2 pp. 24-25; Part 1 pp. 263-264): the 12th from each house of the matter
 *    negates it (2-7-11 → 1-6-10). A planet in the sub of a lord connected only to the negating
 *    houses is eliminated; one whose sub lord mixes needed and negating houses is kept but doubted
 *    (Part 1 p. 264, p. 274). Part 2 p. 25 rejects a planet that itself signifies both the matter and
 *    its negation, while the Part 1 worked example keeps such planets when the needed houses are
 *    present (pp. 264, 274); here it costs a point rather than the window, a provisional weighting.
 * 4. Transit (Part 2 pp. 143-145 and p. 154; pp. 219-220 items 28-31; p. 148): the matter comes when
 *    the exciting Sun crosses a sensitive point, the zone whose sign, star and sub lords are the
 *    fructifying significators, the dasa and bhukti lords above all; Jupiter's transit picks the
 *    year, the Sun the month, the Moon the day. Krishnamurti's own first rule was the Sun in the
 *    dasa lord's sign and the bhukti lord's star, later refined to the star for the dasa and the sub
 *    for the bhukti (Part 2 pp. 143-144).
 *
 * Provisional (marked so in the UI): a retrograde significator delaying the matter until direct is
 * stated for ruling planets in horary (Part 2 p. 128, p. 220 item 32); it is shown as a flag here,
 * never scored.
 */
import { DateTime } from "luxon";
import type { Planet } from "./astro";
import { kpPoint, type JointPeriod, type KpCusp, type KpPlanet, type KpSignificators, type SignificatorLevel } from "./kp";

export type Fruit = "fruitful" | "mixed" | "barren" | "denied";
export type WindowVerdict = "strong" | "fair" | "weak";

export interface LordCheck {
  role: "dasa" | "bhukti" | "antara";
  planet: Planet;
  /** Wanted houses the lord signifies, and the strongest step it does so by. */
  hits: number[];
  bestLevel: SignificatorLevel;
  /** 4 for A (star of occupant) down to 1 for D (owner); E/F count 1. */
  grade: number;
  /** Negating houses the lord itself signifies. */
  negHits: number[];
  subLord: Planet;
  subHits: number[];
  subNeg: number[];
  fruit: Fruit;
  retrograde: boolean;
  /** Planets standing in this lord's stars: its own occupation and ownership pass through them (Part 2 p. 148 iv). */
  tenants: Planet[];
  points: number;
  max: number;
}

export interface SunPeak {
  start: string;
  end: string;
  /** Which of the Sun's sign, star and sub lords were among the window's three lords. */
  via: { sign?: Planet; star?: Planet; sub?: Planet };
  /** 3 when all three agree, 2 when two do. */
  level: number;
}

export interface ScoredWindow extends JointPeriod {
  lords: [LordCheck, LordCheck, LordCheck];
  cusp: number;
  cuspSubLord: Planet;
  promised: boolean;
  negating: number[];
  score: number;
  max: number;
  verdict: WindowVerdict;
  /** Filled in when the Sun's path is known. */
  sun?: SunPeak[];
}

const LEVEL_GRADE: Record<SignificatorLevel, number> = { A: 4, B: 3, C: 2, D: 1, E: 1, F: 1 };
const LEVEL_ORDER: SignificatorLevel[] = ["A", "B", "C", "D", "E", "F"];

/** The 12th from each house of the matter, less the matter's own houses (Part 2 p. 24). */
export function negatingHouses(houses: number[]): number[] {
  const neg = houses.map((h) => ((h + 10) % 12) + 1).filter((h) => !houses.includes(h));
  return Array.from(new Set(neg)).sort((a, b) => a - b);
}

export function fruitOf(subHits: number[], subNeg: number[]): Fruit {
  if (subHits.length && !subNeg.length) return "fruitful";
  if (subHits.length && subNeg.length) return "mixed";
  if (!subHits.length && subNeg.length) return "denied";
  return "barren";
}

const FRUIT_POINTS: Record<Fruit, number> = { fruitful: 2, mixed: 1, barren: 0, denied: -2 };

export function checkLord(
  role: LordCheck["role"],
  planet: Planet,
  houses: number[],
  negating: number[],
  planets: KpPlanet[],
  sigs: KpSignificators[],
  sig: Map<Planet, number[]>,
): LordCheck {
  const kp = planets.find((p) => p.planet === planet)!;
  const s = sigs.find((x) => x.planet === planet)!;
  const mine = sig.get(planet) ?? [];
  const hits = mine.filter((h) => houses.includes(h));
  const negHits = mine.filter((h) => negating.includes(h));
  let bestLevel: SignificatorLevel = "D";
  for (const lv of LEVEL_ORDER) {
    if (s.levels[lv].some((h) => houses.includes(h))) {
      bestLevel = lv;
      break;
    }
  }
  const subHouses = sig.get(kp.subLord) ?? [];
  const subHits = subHouses.filter((h) => houses.includes(h));
  const subNeg = subHouses.filter((h) => negating.includes(h));
  const fruit = fruitOf(subHits, subNeg);
  const tenants = planets.filter((p) => p.planet !== planet && p.starLord === planet).map((p) => p.planet);
  // Grade 1-4, fruit -2..+2, own negation -1 when the lord also speaks for a negating house; floor 0, ceiling 6.
  const raw = LEVEL_GRADE[bestLevel] + FRUIT_POINTS[fruit] - (negHits.length ? 1 : 0);
  const points = Math.max(0, Math.min(6, raw));
  return { role, planet, hits, bestLevel, grade: LEVEL_GRADE[bestLevel], negHits, subLord: kp.subLord, subHits, subNeg, fruit, retrograde: kp.retrograde && planet !== "Rahu" && planet !== "Ketu", tenants, points, max: 6 };
}

export function scoreWindows(
  windows: JointPeriod[],
  houses: number[],
  cusp: number,
  planets: KpPlanet[],
  cusps: KpCusp[],
  sigs: KpSignificators[],
  sig: Map<Planet, number[]>,
): ScoredWindow[] {
  const negating = negatingHouses(houses);
  const cuspSubLord = cusps[cusp - 1].subLord;
  const promised = (sig.get(cuspSubLord) ?? []).some((h) => houses.includes(h));
  return windows.map((w) => {
    const lords: [LordCheck, LordCheck, LordCheck] = [
      checkLord("dasa", w.dasaLord, houses, negating, planets, sigs, sig),
      checkLord("bhukti", w.bhuktiLord, houses, negating, planets, sigs, sig),
      checkLord("antara", w.antaraLord, houses, negating, planets, sigs, sig),
    ];
    const score = lords.reduce((s, l) => s + l.points, 0) + (promised ? 2 : 0);
    const max = 18 + 2;
    // Method I (Part 2 p. 24): a lord whose sub lord is not connected with the matter is weak and set aside,
    // whether the sub lord is silent (barren) or speaks only for the negating houses (denied).
    const rejected = lords.some((l) => l.fruit === "denied" || l.fruit === "barren");
    const verdict: WindowVerdict = rejected ? "weak" : promised && score >= 13 && lords.filter((l) => l.fruit === "fruitful").length >= 2 ? "strong" : "fair";
    return { ...w, lords, cusp, cuspSubLord, promised, negating, score, max, verdict };
  });
}

export interface SunSample {
  /** ISO date (UTC midnight of the day). */
  date: string;
  lon: number;
}

/**
 * Days inside a window when the Sun's sign, star and sub lords are among the window's three lords:
 * the exciting planet crossing the sensitive zone (Part 2 p. 145, pp. 219-220). A run needs at
 * least two of the three to agree, one of them the star lord, since Krishnamurti's own refinement
 * moved the dasa lord from the sign to the star (Part 2 p. 144).
 */
export function sunPeaks(w: Pick<JointPeriod, "start" | "end" | "dasaLord" | "bhuktiLord" | "antaraLord">, path: SunSample[]): SunPeak[] {
  const lords = new Set<Planet>([w.dasaLord, w.bhuktiLord, w.antaraLord]);
  const start = DateTime.fromISO(w.start);
  const end = DateTime.fromISO(w.end);
  const out: SunPeak[] = [];
  let run: { start: string; end: string; via: SunPeak["via"]; level: number } | null = null;
  const flush = () => {
    if (run) out.push({ ...run });
    run = null;
  };
  for (const s of path) {
    const d = DateTime.fromISO(s.date);
    if (d < start) continue;
    if (d > end) break;
    const pt = kpPoint(s.lon);
    const via: SunPeak["via"] = {};
    if (lords.has(pt.signLord)) via.sign = pt.signLord;
    if (lords.has(pt.starLord)) via.star = pt.starLord;
    if (lords.has(pt.subLord)) via.sub = pt.subLord;
    const level = (via.sign ? 1 : 0) + (via.star ? 1 : 0) + (via.sub ? 1 : 0);
    const ok = level >= 2 && Boolean(via.star);
    if (!ok) {
      flush();
      continue;
    }
    const same = run && run.level === level && run.via.sign === via.sign && run.via.star === via.star && run.via.sub === via.sub;
    if (same) run!.end = s.date;
    else {
      flush();
      run = { start: s.date, end: s.date, via, level };
    }
  }
  flush();
  // Merge runs that touch (consecutive days) into one peak, keeping the higher level's via.
  const merged: SunPeak[] = [];
  for (const p of out) {
    const last = merged[merged.length - 1];
    if (last && DateTime.fromISO(p.start).diff(DateTime.fromISO(last.end), "days").days <= 1.5) {
      last.end = p.end;
      if (p.level > last.level) {
        last.level = p.level;
        last.via = p.via;
      }
    } else merged.push({ ...p });
  }
  return merged;
}

export const FRUIT_LABEL: Record<Fruit, { plain: string; practitioner: string }> = {
  fruitful: { plain: "its sub lord also speaks for the matter", practitioner: "fruitful: sub lord signifies the matter" },
  mixed: { plain: "its sub lord speaks for the matter and against it", practitioner: "mixed: sub lord signifies the matter and a negating house" },
  barren: { plain: "its sub lord is silent on the matter", practitioner: "barren: sub lord signifies neither" },
  denied: { plain: "its sub lord speaks only against the matter", practitioner: "denied: sub lord signifies only negating houses" },
};

export const LEVEL_LABEL: Record<SignificatorLevel, string> = {
  A: "in the star of an occupant",
  B: "occupant",
  C: "in the star of the owner",
  D: "owner",
  E: "in the sub of an occupant",
  F: "in the sub of the owner",
};
