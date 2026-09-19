// Jaimini longevity classification (Jaimini Sutras 2.1.1-14, tr. B. Suryanarain Rao).
// Three pairs of points are compared by the nature of the signs they occupy (movable, fixed, dual):
//   1. lord of the lagna and lord of the 8th        (2.1.1-4)
//   2. the Moon and Saturn                          (2.1.5)
//   3. the lagna and the Hora lagna                 (2.1.6)
// Each pair yields long, middle or short; the majority decides (2.1.7). When all three differ the
// lagna / Hora lagna pair is preferred (2.1.8); when the Moon is in the lagna or the 7th the Moon /
// Saturn pair decides (2.1.9). Saturn in the lagna or 7th lowers the term one step unless he is in
// his own or exalted sign (2.1.10-13); Jupiter in the lagna or 7th with only benefic company raises it
// one step (2.1.14). Ranges follow Rao's notes: short to 32, middle 33-66, long 67-100.
// This is a classical classification of the chart, not a forecast about any person.

import { SIGN_LORD, SIGNS, dignityOf, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { isBenefic, rasiAspects } from "./jaimini";

export type AyurTerm = "short" | "middle" | "long";
export type SignNature = "movable" | "fixed" | "dual";

export const SIGN_NATURE: SignNature[] = ["movable", "fixed", "dual", "movable", "fixed", "dual", "movable", "fixed", "dual", "movable", "fixed", "dual"];

/** Rao's table (2.1.6): same nature → movable long, fixed short, dual middle; movable+fixed middle; movable+dual short; fixed+dual long. */
export function pairTerm(a: SignNature, b: SignNature): AyurTerm {
  if (a === b) return a === "movable" ? "long" : a === "fixed" ? "short" : "middle";
  const s = new Set([a, b]);
  if (s.has("movable") && s.has("fixed")) return "middle";
  if (s.has("movable") && s.has("dual")) return "short";
  return "long";
}

export interface AyurPoint {
  label: string;
  /** Planet when the point is a planet; undefined for the lagna and Hora lagna. */
  planet?: Planet;
  signIndex: number;
  sign: string;
  nature: SignNature;
}

export interface AyurPair {
  id: "lords" | "moon-saturn" | "hora";
  label: string;
  a: AyurPoint;
  b: AyurPoint;
  term: AyurTerm;
  sutra: string;
}

export interface AyurAdjustment {
  planet: Planet;
  direction: "down" | "up" | "none";
  text: string;
  sutra: string;
}

export interface AyurResult {
  pairs: AyurPair[];
  /** Term from the majority or the tie-break rule. */
  baseTerm: AyurTerm;
  decidedBy: string;
  adjustments: AyurAdjustment[];
  term: AyurTerm;
  range: string;
  /** Hora lagna was available (needs birth place and time). */
  hasHoraLagna: boolean;
}

export const AYUR_TERM_LABEL: Record<AyurTerm, string> = { short: "shorter span (alpayu)", middle: "middle span (madhyayu)", long: "long span (purnayu)" };
export const AYUR_RANGE: Record<AyurTerm, string> = { short: "up to about 32 years", middle: "about 33 to 66 years", long: "about 67 to 100 years" };

const ORDER: AyurTerm[] = ["short", "middle", "long"];
function step(t: AyurTerm, by: number): AyurTerm {
  return ORDER[Math.max(0, Math.min(2, ORDER.indexOf(t) + by))];
}

function point(label: string, signIndex: number, planet?: Planet): AyurPoint {
  return { label, planet, signIndex, sign: SIGNS[signIndex], nature: SIGN_NATURE[signIndex] };
}

export function computeAyur(positions: PlanetPosition[], lagnaSign: number, horaLagnaSign: number | undefined): AyurResult {
  const pos = (p: Planet) => positions.find((x) => x.planet === p)!;
  const lagnaLord = SIGN_LORD[lagnaSign];
  const eighthLord = SIGN_LORD[(lagnaSign + 7) % 12];
  const pairs: AyurPair[] = [];
  const p1a = point(`lord of the lagna (${lagnaLord})`, pos(lagnaLord).signIndex, lagnaLord);
  const p1b = point(`lord of the 8th (${eighthLord})`, pos(eighthLord).signIndex, eighthLord);
  pairs.push({ id: "lords", label: "Lords of the lagna and the 8th", a: p1a, b: p1b, term: pairTerm(p1a.nature, p1b.nature), sutra: "2.1.1-4" });
  const p2a = point("Moon", pos("Moon").signIndex, "Moon");
  const p2b = point("Saturn", pos("Saturn").signIndex, "Saturn");
  pairs.push({ id: "moon-saturn", label: "Moon and Saturn", a: p2a, b: p2b, term: pairTerm(p2a.nature, p2b.nature), sutra: "2.1.5" });
  const hasHoraLagna = horaLagnaSign !== undefined;
  if (hasHoraLagna) {
    const p3a = point("Lagna", lagnaSign);
    const p3b = point("Hora lagna", horaLagnaSign!);
    pairs.push({ id: "hora", label: "Lagna and Hora lagna", a: p3a, b: p3b, term: pairTerm(p3a.nature, p3b.nature), sutra: "2.1.6" });
  }

  // Decide the base term.
  const moonHouse = houseFrom(lagnaSign, pos("Moon").signIndex);
  let baseTerm: AyurTerm;
  let decidedBy: string;
  const counts = ORDER.map((t) => pairs.filter((p) => p.term === t).length);
  const max = Math.max(...counts);
  if (moonHouse === 1 || moonHouse === 7) {
    baseTerm = pairs[1].term;
    decidedBy = `the Moon stands in the ${moonHouse === 1 ? "lagna" : "7th"}, so the Moon / Saturn pair decides (2.1.9)`;
  } else if (max >= 2) {
    baseTerm = ORDER[counts.indexOf(max)];
    decidedBy = `${max} of ${pairs.length} pairs agree (2.1.7)`;
  } else if (hasHoraLagna) {
    baseTerm = pairs[2].term;
    decidedBy = "the three pairs differ, so the lagna / Hora lagna pair is preferred (2.1.8)";
  } else {
    baseTerm = pairs[0].term;
    decidedBy = "the two pairs differ and the Hora lagna is unavailable, so the lords' pair is taken";
  }

  // Kakshya hrasa / vriddhi from Saturn and Jupiter in the lagna or the 7th.
  const sunLon = pos("Sun").lon;
  const adjustments: AyurAdjustment[] = [];
  const sat = pos("Saturn");
  const satHouse = houseFrom(lagnaSign, sat.signIndex);
  if (satHouse === 1 || satHouse === 7) {
    const dig = dignityOf("Saturn", sat.signIndex, sat.degInSign);
    const strong = dig === "Exalted" || dig === "Own sign" || dig === "Moolatrikona";
    const malefics = positions.filter((p) => p.planet !== "Saturn" && !isBenefic(p, sunLon) && (p.signIndex === sat.signIndex || rasiAspects(p.signIndex, sat.signIndex)));
    if (strong) adjustments.push({ planet: "Saturn", direction: "none", text: `Saturn in the ${satHouse === 1 ? "lagna" : "7th"} in his ${dig === "Exalted" ? "exaltation" : "own sign"}: no reduction (2.1.12).`, sutra: "2.1.12" });
    else if (malefics.length >= 2) adjustments.push({ planet: "Saturn", direction: "none", text: `Saturn in the ${satHouse === 1 ? "lagna" : "7th"} but under several malefic influences (${malefics.map((m) => m.planet).join(", ")}): no reduction (2.1.13).`, sutra: "2.1.13" });
    else adjustments.push({ planet: "Saturn", direction: "down", text: `Saturn in the ${satHouse === 1 ? "lagna" : "7th"}: the term drops one step (kakshya hrasa, 2.1.10).`, sutra: "2.1.10" });
  }
  const jup = pos("Jupiter");
  const jupHouse = houseFrom(lagnaSign, jup.signIndex);
  if (jupHouse === 1 || jupHouse === 7) {
    const company = positions.filter((p) => p.planet !== "Jupiter" && (p.signIndex === jup.signIndex || rasiAspects(p.signIndex, jup.signIndex)));
    const bad = company.filter((p) => !isBenefic(p, sunLon));
    if (bad.length === 0 && company.length > 0)
      adjustments.push({ planet: "Jupiter", direction: "up", text: `Jupiter in the ${jupHouse === 1 ? "lagna" : "7th"} with only benefic company (${company.map((c) => c.planet).join(", ")}): the term rises one step (kakshya vriddhi, 2.1.14).`, sutra: "2.1.14" });
    else if (bad.length === 0) adjustments.push({ planet: "Jupiter", direction: "up", text: `Jupiter in the ${jupHouse === 1 ? "lagna" : "7th"} free of malefic influence: the term rises one step (kakshya vriddhi, 2.1.14).`, sutra: "2.1.14" });
    else adjustments.push({ planet: "Jupiter", direction: "none", text: `Jupiter in the ${jupHouse === 1 ? "lagna" : "7th"} but touched by ${bad.map((b) => b.planet).join(", ")}: no increase (2.1.14).`, sutra: "2.1.14" });
  }
  let term = baseTerm;
  for (const a of adjustments) term = step(term, a.direction === "down" ? -1 : a.direction === "up" ? 1 : 0);
  return { pairs, baseTerm, decidedBy, adjustments, term, range: AYUR_RANGE[term], hasHoraLagna };
}
