// Jaimini module: chara karakas (eight-karaka scheme), navamsa and Karakamsa,
// rasi drishti, argala, arudha padas and K.N. Rao's Chara dasha.
// Everything here is whole-sign arithmetic on positions already computed by the ephemeris.
// It is kept apart from the Bhrigu Nandi Nadi engine: the two systems never mix.

import { DateTime } from "luxon";
import { SIGNS, SIGN_LORD, SIGN_QUALITY, houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";
import { evaluateJaimini } from "./rules-jaimini";
import { computeAyur, type AyurResult } from "./jaimini-ayur";

// ── Chara karakas ─────────────────────────────────────────────────────────────

export const CHARA_KARAKAS = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"] as const;
export type CharaKarakaId = (typeof CHARA_KARAKAS)[number];

export const CHARA_KARAKA_INFO: Record<CharaKarakaId, { name: string; meaning: string }> = {
  AK: { name: "Atmakaraka", meaning: "the self, the soul's purpose; the king of the chart" },
  AmK: { name: "Amatyakaraka", meaning: "career, advisers and ministers, how the self acts in the world" },
  BK: { name: "Bhratrikaraka", meaning: "siblings, the guru and one's own initiative" },
  MK: { name: "Matrikaraka", meaning: "mother, home, education and inner comfort" },
  PiK: { name: "Pitrikaraka", meaning: "father, lineage, dharma and protection" },
  PK: { name: "Putrakaraka", meaning: "children, students, creativity and merit" },
  GK: { name: "Gnatikaraka", meaning: "relatives, rivals, disease and obstacles" },
  DK: { name: "Darakaraka", meaning: "spouse, partnerships and close alliances" },
};

export interface CharaKaraka {
  karaka: CharaKarakaId;
  planet: Planet;
  /** Degrees within the sign used for ranking (Rahu counts from the end of its sign). */
  rankDegree: number;
}

const KARAKA_PLANETS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"];

/** Eight-karaka scheme: seven planets and Rahu ranked by degrees within their signs. Rahu, moving backwards, is ranked by 30 minus its degrees. */
export function charaKarakas(positions: PlanetPosition[]): CharaKaraka[] {
  const ranked = KARAKA_PLANETS.map((planet) => {
    const p = positions.find((x) => x.planet === planet)!;
    const rankDegree = planet === "Rahu" ? 30 - p.degInSign : p.degInSign;
    return { planet, rankDegree };
  }).sort((a, b) => b.rankDegree - a.rankDegree);
  return ranked.map((r, i) => ({ karaka: CHARA_KARAKAS[i], planet: r.planet, rankDegree: r.rankDegree }));
}

// ── Navamsa ───────────────────────────────────────────────────────────────────

export interface VargaPosition {
  planet: Planet;
  signIndex: number;
  sign: Sign;
  /** Degrees in the sign in the divisional chart (0..30). */
  degInSign: number;
}

/** Navamsa sign of a longitude: the ninth part of a sign, counted from the sign itself for movable signs (Parashara's continuous scheme). */
export function navamsaOf(lon: number): { signIndex: number; degInSign: number } {
  const signIndex = Math.floor(lon / 30);
  const degInSign = lon - signIndex * 30;
  const part = Math.floor(degInSign / (30 / 9));
  const d9 = (signIndex * 9 + part) % 12;
  return { signIndex: d9, degInSign: ((degInSign % (30 / 9)) * 9) };
}

export function navamsaPositions(positions: PlanetPosition[]): VargaPosition[] {
  return positions.map((p) => {
    const n = navamsaOf(p.lon);
    return { planet: p.planet, signIndex: n.signIndex, sign: SIGNS[n.signIndex], degInSign: n.degInSign };
  });
}

// ── Rasi drishti ──────────────────────────────────────────────────────────────

/** Jaimini sign aspect: movable signs aspect the fixed signs except the adjacent one, fixed signs aspect the movable signs except the adjacent one, dual signs aspect each other. */
export function rasiAspects(fromSign: number, toSign: number): boolean {
  if (fromSign === toSign) return false;
  const q = SIGN_QUALITY[fromSign];
  const t = SIGN_QUALITY[toSign];
  if (q === "Movable") return t === "Fixed" && toSign !== (fromSign + 1) % 12;
  if (q === "Fixed") return t === "Movable" && toSign !== (fromSign + 11) % 12;
  return t === "Dual";
}

export function signsAspectedBy(sign: number): number[] {
  return SIGNS.map((_, i) => i).filter((i) => rasiAspects(sign, i));
}

/** Planets occupying or aspecting (by rasi drishti) a sign. */
export function influencesOn(sign: number, positions: { planet: Planet; signIndex: number }[]): { occupants: Planet[]; aspecting: Planet[] } {
  return {
    occupants: positions.filter((p) => p.signIndex === sign).map((p) => p.planet),
    aspecting: positions.filter((p) => rasiAspects(p.signIndex, sign)).map((p) => p.planet),
  };
}

// ── Argala ────────────────────────────────────────────────────────────────────

export interface Argala {
  /** House counted from the reference sign that intervenes (2, 4, 11 primary; 5 secondary). */
  house: number;
  kind: "primary" | "secondary";
  planets: Planet[];
  /** House whose occupants obstruct this argala (12 for 2, 10 for 4, 3 for 11, 9 for 5). */
  obstructingHouse: number;
  obstructedBy: Planet[];
  /** True when the obstructing house holds at least as many planets. */
  obstructed: boolean;
}

const ARGALA_PAIRS: Array<{ house: number; kind: "primary" | "secondary"; obstructingHouse: number }> = [
  { house: 2, kind: "primary", obstructingHouse: 12 },
  { house: 4, kind: "primary", obstructingHouse: 10 },
  { house: 11, kind: "primary", obstructingHouse: 3 },
  { house: 5, kind: "secondary", obstructingHouse: 9 },
];

export function argalaOn(sign: number, positions: { planet: Planet; signIndex: number }[]): Argala[] {
  const inHouse = (h: number) => positions.filter((p) => houseFrom(sign, p.signIndex) === h).map((p) => p.planet);
  return ARGALA_PAIRS.map(({ house, kind, obstructingHouse }) => {
    const planets = inHouse(house);
    const obstructedBy = inHouse(obstructingHouse);
    return { house, kind, planets, obstructingHouse, obstructedBy, obstructed: planets.length > 0 && obstructedBy.length >= planets.length };
  }).filter((a) => a.planets.length > 0);
}

// ── Arudha padas ──────────────────────────────────────────────────────────────

export const ARUDHA_LABEL = ["AL", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "UL"] as const;
export const ARUDHA_NAME = [
  "Arudha lagna: image, standing, how the world sees the native",
  "Dhana pada: perceived wealth and family",
  "Vikrama pada: siblings, courage, effort",
  "Matri pada: home, mother, property",
  "Mantra pada: children, learning, counsel",
  "Shatru pada: enemies, illness, debts",
  "Dara pada: partners and business",
  "Mrityu pada: longevity, inheritance, secrets",
  "Bhagya pada: fortune, father, dharma",
  "Rajya pada: career and public work",
  "Labha pada: gains and friends",
  "Upapada: marriage and the spouse's family",
];

export interface ArudhaPada {
  house: number; // 1..12
  label: (typeof ARUDHA_LABEL)[number];
  name: string;
  houseSign: number;
  lord: Planet;
  lordSign: number;
  signIndex: number;
  sign: Sign;
  /** The reflection fell in the house itself or its 7th and was moved to the 10th from there. */
  corrected: boolean;
}

/** Pada of a house: count from the house to its lord, then the same count onward. If that lands in the house or its 7th, take the 10th from there. Traditional lords only (Mars for Scorpio, Saturn for Aquarius). */
export function arudhaOf(house: number, lagnaSign: number, positions: PlanetPosition[]): ArudhaPada {
  const houseSign = (lagnaSign + house - 1) % 12;
  const lord = SIGN_LORD[houseSign];
  const lordSign = positions.find((p) => p.planet === lord)!.signIndex;
  let pada = (2 * lordSign - houseSign + 24) % 12;
  const rel = houseFrom(houseSign, pada);
  const corrected = rel === 1 || rel === 7;
  if (corrected) pada = (pada + 9) % 12;
  return { house, label: ARUDHA_LABEL[house - 1], name: ARUDHA_NAME[house - 1], houseSign, lord, lordSign, signIndex: pada, sign: SIGNS[pada], corrected };
}

export function allArudhas(lagnaSign: number, positions: PlanetPosition[]): ArudhaPada[] {
  return Array.from({ length: 12 }, (_, i) => arudhaOf(i + 1, lagnaSign, positions));
}

// ── Chara dasha (K.N. Rao) ────────────────────────────────────────────────────

/** Savya (odd-footed) signs count forward; the rest (apasavya) count backward. */
export const SAVYA = new Set([0, 1, 2, 6, 7, 8]);

export interface DashaYears {
  sign: number;
  years: number;
  /** Lord whose position fixed the count. */
  lord: Planet;
  lordSign: number;
  /** Inclusive count from the sign to the lord's sign in the sign's own direction. */
  count: number;
  note?: string;
}

function coLordFor(sign: number, positions: PlanetPosition[]): { lord: Planet; note?: string } {
  const pair: Planet[] | null = sign === 7 ? ["Mars", "Ketu"] : sign === 10 ? ["Saturn", "Rahu"] : null;
  if (!pair) return { lord: SIGN_LORD[sign] };
  const at = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const inSign = pair.filter((pl) => at(pl).signIndex === sign);
  if (inSign.length === 2) return { lord: pair[0], note: "both lords in the sign: full twelve years" };
  if (inSign.length === 1) {
    const other = pair.find((pl) => pl !== inSign[0])!;
    return { lord: other, note: `${inSign[0]} sits in ${SIGNS[sign]}, so ${other} gives the count` };
  }
  const company = (pl: Planet) => positions.filter((p) => p.signIndex === at(pl).signIndex).length;
  const [a, b] = pair;
  if (company(a) !== company(b)) {
    const w = company(a) > company(b) ? a : b;
    return { lord: w, note: `${w} keeps more company in its sign, so it gives the count` };
  }
  const w = at(a).degInSign >= at(b).degInSign ? a : b;
  return { lord: w, note: `${a} and ${b} equally placed; ${w} is higher by degree and gives the count` };
}

/** Years of a sign's dasha: inclusive count from the sign to its lord (forward for savya, backward for apasavya) less one; a lord in its own sign gives twelve. No exaltation or debilitation adjustment (Rao). */
export function dashaYearsOf(sign: number, positions: PlanetPosition[]): DashaYears {
  const { lord, note } = coLordFor(sign, positions);
  const lordSign = positions.find((p) => p.planet === lord)!.signIndex;
  const count = SAVYA.has(sign) ? houseFrom(sign, lordSign) : houseFrom(lordSign, sign);
  let years = count - 1;
  if (years === 0) years = 12;
  return { sign, years, lord, lordSign, count, note };
}

export interface CharaAntardasha {
  sign: number;
  signName: Sign;
  start: string; // ISO
  end: string;
}

export interface CharaDashaPeriod {
  sign: number;
  signName: Sign;
  years: number;
  lord: Planet;
  lordSign: number;
  note?: string;
  cycle: 1 | 2;
  start: string; // ISO
  end: string;
  ageStart: number;
  antardashas: CharaAntardasha[];
}

export interface CharaDasha {
  direction: "forward" | "backward";
  ninthSign: number;
  periods: CharaDashaPeriod[];
}

/** K.N. Rao's Chara dasha: the sequence starts from the lagna and runs forward when the 9th from the lagna is a savya sign, backward otherwise. Each mahadasha has twelve equal antardashas, starting from the sign next to the dasha sign (in the dasha sign's own direction) and ending on the dasha sign itself. */
export function charaDasha(lagnaSign: number, positions: PlanetPosition[], birthIso: string, maxYears = 120): CharaDasha {
  const ninthSign = (lagnaSign + 8) % 12;
  const direction: "forward" | "backward" = SAVYA.has(ninthSign) ? "forward" : "backward";
  const step = direction === "forward" ? 1 : 11;
  const birth = DateTime.fromISO(birthIso, { zone: "utc" });
  const periods: CharaDashaPeriod[] = [];
  let cursor = birth;
  let elapsed = 0;
  for (const cycle of [1, 2] as const) {
    for (let i = 0; i < 12 && elapsed < maxYears; i++) {
      const sign = (lagnaSign + step * i) % 12;
      const y = dashaYearsOf(sign, positions);
      const end = cursor.plus({ years: y.years });
      const subStep = SAVYA.has(sign) ? 1 : 11;
      const antardashas: CharaAntardasha[] = [];
      let sub = cursor;
      for (let k = 1; k <= 12; k++) {
        const s = (sign + subStep * k) % 12;
        const subEnd = k === 12 ? end : cursor.plus({ months: y.years * k });
        antardashas.push({ sign: s, signName: SIGNS[s], start: sub.toISO()!, end: subEnd.toISO()! });
        sub = subEnd;
      }
      periods.push({ sign, signName: SIGNS[sign], years: y.years, lord: y.lord, lordSign: y.lordSign, note: y.note, cycle, start: cursor.toISO()!, end: end.toISO()!, ageStart: elapsed, antardashas });
      cursor = end;
      elapsed += y.years;
    }
  }
  return { direction, ninthSign, periods };
}

// ── Assembled result ──────────────────────────────────────────────────────────

export interface JaiminiLagna {
  lon: number;
  signIndex: number;
  sign: Sign;
  degInSign: number;
}

export interface JaiminiFinding {
  id: string;
  group: JaiminiRuleGroup;
  text: string;
  planets: Planet[];
  weight: 1 | 2 | 3;
  source: { label: string; url: string; sutra?: string };
  /** Where the rule was read: rasi chart or navamsa. */
  chart: "rasi" | "navamsa";
}

export type JaiminiRuleGroup = "karaka" | "karakamsa" | "arudha" | "upapada" | "dasha";

export interface JaiminiResult {
  lagna: JaiminiLagna;
  navamsaLagna: { signIndex: number; sign: Sign };
  karakas: CharaKaraka[];
  navamsa: VargaPosition[];
  /** Navamsa sign of the Atmakaraka. */
  karakamsa: { signIndex: number; sign: Sign };
  arudhas: ArudhaPada[];
  argala: { target: string; sign: number; items: Argala[] }[];
  charaDasha: CharaDasha;
  findings: JaiminiFinding[];
  /** Hora and Ghatika lagnas (need place and time); absent when the server could not compute sunrise. */
  special?: { horaLagna: JaiminiLagna; ghatikaLagna: JaiminiLagna };
  /** Longevity classification per Jaimini 2.1. */
  ayur: AyurResult;
}

/** Natural benefics for Jaimini purposes. The Sun counts as a benefic when exalted or in a friendly sign (Jaimini 1.4). The Moon is a benefic in its bright half. */
export function isBenefic(p: PlanetPosition, sunLon?: number): boolean {
  if (p.planet === "Jupiter" || p.planet === "Venus" || p.planet === "Mercury") return true;
  if (p.planet === "Moon") {
    if (sunLon === undefined) return true;
    const elong = ((p.lon - sunLon) % 360 + 360) % 360;
    return elong >= 90 && elong < 270;
  }
  if (p.planet === "Sun") return p.dignity === "Exalted" || p.dignity === "Friendly" || p.dignity === "Own sign" || p.dignity === "Moolatrikona";
  return false;
}

// ── Assembly (pure; the server supplies the sidereal ascendant) ───────────────


function lagnaAt(lon: number): JaiminiLagna {
  const signIndex = Math.floor(lon / 30);
  return { lon, signIndex, sign: SIGNS[signIndex], degInSign: lon - signIndex * 30 };
}

export function computeJaimini(positions: PlanetPosition[], lagnaLon: number, birthIso: string, specialLons?: { horaLagna: number; ghatikaLagna: number }): JaiminiResult {
  const lagnaSign = Math.floor(lagnaLon / 30);
  const lagna = lagnaAt(lagnaLon);
  const special = specialLons ? { horaLagna: lagnaAt(specialLons.horaLagna), ghatikaLagna: lagnaAt(specialLons.ghatikaLagna) } : undefined;
  const nl = navamsaOf(lagnaLon);
  const karakas = charaKarakas(positions);
  const navamsa = navamsaPositions(positions);
  const akD9 = navamsa.find((p) => p.planet === karakas[0].planet)!;
  const karakamsa = { signIndex: akD9.signIndex, sign: SIGNS[akD9.signIndex] };
  const arudhas = allArudhas(lagnaSign, positions);
  const argala = [
    { target: "Lagna", sign: lagnaSign, items: argalaOn(lagnaSign, positions) },
    { target: "Arudha lagna", sign: arudhas[0].signIndex, items: argalaOn(arudhas[0].signIndex, positions) },
    { target: "Upapada", sign: arudhas[11].signIndex, items: argalaOn(arudhas[11].signIndex, positions) },
  ];
  const findings = evaluateJaimini({ positions, navamsa, lagnaSign, karakas, karakamsa: karakamsa.signIndex, arudhas, horaLagna: special?.horaLagna.signIndex, ghatikaLagna: special?.ghatikaLagna.signIndex });
  const ayur = computeAyur(positions, lagnaSign, special?.horaLagna.signIndex);
  return {
    lagna,
    navamsaLagna: { signIndex: nl.signIndex, sign: SIGNS[nl.signIndex] },
    karakas,
    navamsa,
    karakamsa,
    arudhas,
    argala,
    charaDasha: charaDasha(lagnaSign, positions, birthIso),
    findings,
    special,
    ayur,
  };
}
