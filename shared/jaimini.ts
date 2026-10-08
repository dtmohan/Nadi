// Jaimini module: chara karakas (eight-karaka scheme), navamsa and Karakamsa,
// rasi drishti, argala, arudha padas and K.N. Rao's Chara dasha.
// Everything here is whole-sign arithmetic on positions already computed by the ephemeris.
// It is kept apart from the Bhrigu Nandi Nadi engine: the two systems never mix.

import { DateTime } from "luxon";
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";
import { rasiAspects, isBenefic, argalaOn, type Argala } from "./jaimini-core";
import { evaluateJaimini } from "./rules-jaimini";
import { computeAyur, type AyurResult } from "./jaimini-ayur";
import { computeInduLagna, type InduLagnaResult } from "./indu-lagna";

export { rasiAspects, isBenefic, argalaOn, type Argala };

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

// ── Sthira dasha ──────────────────────────────────────────────────────────────

export interface SthiraDashaPeriod {
  sign: number;
  signName: Sign;
  years: number; // seven, or the fractional remainder at birth for the first
  start: string;
  end: string;
  ageStart: number;
}

export interface SthiraDasha {
  akPlanet: Planet;
  akSign: number;
  direction: "forward" | "backward";
  /** The twelve sign-periods; the first is the Atmakaraka's sign, prorated from birth. */
  periods: SthiraDashaPeriod[];
}

/**
 * Sthira dasha: seven fixed years for every sign, starting from the Atmakaraka's rasi sign,
 * forward when that sign is savya (odd-footed), backward otherwise. The remainder at birth is
 * (30° minus the Atmakaraka's degree) over 30 of seven years. Twelve signs make an 84-year cycle.
 */
export function sthiraDasha(positions: PlanetPosition[], birthIso: string, maxYears = 84): SthiraDasha {
  const ak = charaKarakas(positions)[0];
  const akPos = positions.find((p) => p.planet === ak.planet)!;
  const akSign = akPos.signIndex;
  const direction: "forward" | "backward" = SAVYA.has(akSign) ? "forward" : "backward";
  const step = direction === "forward" ? 1 : 11;
  const firstYears = ((30 - akPos.degInSign) / 30) * 7;
  const birth = DateTime.fromISO(birthIso, { zone: "utc" });
  const periods: SthiraDashaPeriod[] = [];
  let cursor = birth;
  let elapsed = 0;
  let years = firstYears;
  for (let i = 0; i < 12 && elapsed < maxYears; i++) {
    const sign = (akSign + step * i) % 12;
    const end = cursor.plus({ years });
    periods.push({ sign, signName: SIGNS[sign], years, start: cursor.toISO()!, end: end.toISO()!, ageStart: elapsed });
    cursor = end;
    elapsed += years;
    years = 7;
  }
  return { akPlanet: ak.planet, akSign, direction, periods };
}

// ── Kerala Jaimini dashas: Manduka (frog) and Brahma ──────────────────────────

export interface SignDashaPeriod {
  sign: number;
  signName: Sign;
  years: number;
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
}

/** Build mahadasha periods from an ordered sign sequence, each sign taking its Chara-dasha years. */
function sequenceDasha(sequence: number[], positions: PlanetPosition[], birthIso: string): SignDashaPeriod[] {
  const birth = DateTime.fromISO(birthIso, { zone: "utc" });
  const periods: SignDashaPeriod[] = [];
  let cursor = birth;
  let elapsed = 0;
  for (const sign of sequence) {
    const y = dashaYearsOf(sign, positions);
    const end = cursor.plus({ years: y.years });
    periods.push({ sign, signName: SIGNS[sign], years: y.years, lord: y.lord, start: cursor.toISO()!, end: end.toISO()!, ageStart: elapsed });
    cursor = end;
    elapsed += y.years;
  }
  return periods;
}

export interface MandukaDasha {
  lagnaSign: number;
  /** Odd signs first when the lagna is odd, even first when it is even. */
  leap: "odd-first" | "even-first";
  periods: SignDashaPeriod[];
}

/**
 * Manduka ("frog") dasha of the Kerala tradition: the signs leap by skipping alternates — the odd
 * signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius) in order, then the even, when the lagna
 * is odd, and the reverse when it is even. Each sign takes its Chara-dasha years.
 */
export function mandukaDasha(lagnaSign: number, positions: PlanetPosition[], birthIso: string): MandukaDasha {
  const odd = [0, 2, 4, 6, 8, 10];
  const even = [1, 3, 5, 7, 9, 11];
  const leap: MandukaDasha["leap"] = lagnaSign % 2 === 0 ? "odd-first" : "even-first";
  const sequence = leap === "odd-first" ? [...odd, ...even] : [...even, ...odd];
  return { lagnaSign, leap, periods: sequenceDasha(sequence, positions, birthIso) };
}

export interface BrahmaDasha {
  brahmaPlanet: Planet;
  brahmaSign: number;
  direction: "forward" | "backward";
  periods: SignDashaPeriod[];
}

/** A planet is Brahma-strong when exalted, in its own or moolatrikona sign, or in a kendra or trine. */
function brahmaStrong(positions: PlanetPosition[], lagnaSign: number, p: Planet): boolean {
  const pos = positions.find((x) => x.planet === p)!;
  if (["Exalted", "Own sign", "Moolatrikona"].includes(pos.dignity)) return true;
  const h = houseFrom(lagnaSign, pos.signIndex);
  return [1, 4, 7, 10, 5, 9].includes(h);
}

/**
 * Brahma dasha of the Kerala tradition: the Brahma planet is the stronger of the lagna lord and
 * the 8th lord (exaltation, own sign, moolatrikona, or kendra/trikona placement), the lagna lord
 * winning a tie. The dasha runs from the Brahma planet's sign, forward for savya and backward
 * otherwise, each sign taking its Chara-dasha years.
 */
export function brahmaDasha(positions: PlanetPosition[], lagnaSign: number, birthIso: string): BrahmaDasha {
  const lagnaLord = SIGN_LORD[lagnaSign];
  const eighthLord = SIGN_LORD[(lagnaSign + 7) % 12];
  const l = brahmaStrong(positions, lagnaSign, lagnaLord);
  const e = brahmaStrong(positions, lagnaSign, eighthLord);
  const brahmaPlanet = l === e ? lagnaLord : l ? lagnaLord : eighthLord;
  const brahmaSign = positions.find((x) => x.planet === brahmaPlanet)!.signIndex;
  const direction: "forward" | "backward" = SAVYA.has(brahmaSign) ? "forward" : "backward";
  const step = direction === "forward" ? 1 : 11;
  const sequence = Array.from({ length: 12 }, (_, i) => (brahmaSign + step * i) % 12);
  return { brahmaPlanet, brahmaSign, direction, periods: sequenceDasha(sequence, positions, birthIso) };
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
  sthiraDasha: SthiraDasha;
  mandukaDasha: MandukaDasha;
  brahmaDasha: BrahmaDasha;
  findings: JaiminiFinding[];
  /** Hora and Ghatika lagnas (need place and time); absent when the server could not compute sunrise. */
  special?: { horaLagna: JaiminiLagna; ghatikaLagna: JaiminiLagna };
  /** Longevity classification per Jaimini 2.1; null when withheld for a native under the sensitive-content age. */
  ayur: AyurResult | null;
  /** Indu Lagna, the wealth ascendant of Uttara Kalamrita IV.27 — a Parashari-lineage special lagna shown here beside the others, not a Jaimini technique. */
  indu: InduLagnaResult;
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
  const indu = computeInduLagna(positions, lagnaLon);
  return {
    lagna,
    navamsaLagna: { signIndex: nl.signIndex, sign: SIGNS[nl.signIndex] },
    karakas,
    navamsa,
    karakamsa,
    arudhas,
    argala,
    charaDasha: charaDasha(lagnaSign, positions, birthIso),
    sthiraDasha: sthiraDasha(positions, birthIso),
    mandukaDasha: mandukaDasha(lagnaSign, positions, birthIso),
    brahmaDasha: brahmaDasha(positions, lagnaSign, birthIso),
    findings,
    special,
    ayur,
    indu,
  };
}
