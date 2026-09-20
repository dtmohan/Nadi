// Akshaya Lagna Paddhati (ALP): Dr. S. Pothuvudaimoorthy's progressed-lagna method.
// The lagna is moved forward with age at ten years per sign (120 years for the zodiac),
// so one nakshatra pada takes ten-ninths of a year, about 1 year 1 month 10 days.
// The natal planets are then read from the progressed ("ALP") lagna.
//
// This file is the arithmetic only. It is pure: positions and the sidereal ascendant come
// from the ephemeris, the "as of" date from the caller. Interpretation lives in rules-alp.ts
// and is filled in chapter by chapter from the published books.
//
// Framework choices that the books may refine are collected in AlpConfig with their defaults.

import { DateTime } from "luxon";
import { NAKSHATRAS, NAKSHATRA_LORD, SIGNS, SIGN_LORD, houseFrom, norm360, type Planet, type PlanetPosition, type Sign } from "./astro";
import { navamsaOf } from "./jaimini";
import { evaluateAlp, type AlpFinding } from "./rules-alp";

export interface AlpConfig {
  /** Years the ALP lagna spends in one sign. The published figure is 10. */
  yearsPerSign: number;
  /**
   * Where the progression starts.
   * "degree": from the exact natal lagna degree, so the birth sign is only partly lived through (the remaining arc is prorated).
   * "sign": from the start of the natal lagna sign, so every sign gets the full ten years (the second sign begins in the 11th year).
   */
  start: "degree" | "sign";
}

export const DEFAULT_ALP_CONFIG: AlpConfig = { yearsPerSign: 10, start: "degree" };

const YEAR_DAYS = 365.25;
const PADA_ARC = 360 / 108; // 3°20'

export interface AlpPoint {
  lon: number;
  signIndex: number;
  sign: Sign;
  degInSign: number;
  lord: Planet;
  nakshatraIndex: number;
  nakshatra: string;
  nakshatraLord: Planet;
  /** Pada of the nakshatra, 1..4. */
  pada: number;
  /** Pada counted within the sign, 1..9. */
  padaInSign: number;
  /** Navamsa sign of the pada: the sign the pada "activates". */
  navamsaSign: number;
}

export interface AlpPeriod {
  signIndex: number;
  sign: Sign;
  lord: Planet;
  /** For pada periods: nakshatra pada in this sign. */
  nakshatraIndex?: number;
  pada?: number;
  padaInSign?: number;
  navamsaSign?: number;
  start: string; // ISO
  end: string; // ISO
  ageStart: number;
  ageEnd: number;
  current: boolean;
}

export interface AlpHouse {
  house: number;
  signIndex: number;
  sign: Sign;
  lord: Planet;
  planets: Planet[];
  /** The same sign as a house from the janma lagna. */
  houseFromJanma: number;
}

export interface AlpPlacement {
  planet: Planet;
  role: string;
  signIndex: number;
  houseFromAlp: number;
  houseFromJanma: number;
}

export interface AlpResult {
  config: AlpConfig;
  asOf: string;
  ageYears: number;
  natalLagna: AlpPoint;
  point: AlpPoint;
  /** The ALP sign counted as a house from the janma lagna. */
  houseFromJanma: number;
  houses: AlpHouse[];
  placements: AlpPlacement[];
  signPeriods: AlpPeriod[];
  padaPeriods: AlpPeriod[];
  nextSignChange: string | null;
  nextPadaChange: string | null;
  findings: AlpFinding[];
}

export function alpPointAt(lon: number): AlpPoint {
  const l = norm360(lon);
  const signIndex = Math.floor(l / 30);
  const degInSign = l - signIndex * 30;
  const nakshatraIndex = Math.floor(l / (360 / 27)) % 27;
  const pada = Math.floor((l % (360 / 27)) / PADA_ARC) + 1;
  const padaInSign = Math.floor(degInSign / PADA_ARC) + 1;
  return {
    lon: l,
    signIndex,
    sign: SIGNS[signIndex],
    degInSign,
    lord: SIGN_LORD[signIndex],
    nakshatraIndex,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraLord: NAKSHATRA_LORD[nakshatraIndex],
    pada,
    padaInSign,
    navamsaSign: navamsaOf(l).signIndex,
  };
}

/** Degrees the ALP lagna moves per day. */
export function alpRate(config: AlpConfig): number {
  return 30 / (config.yearsPerSign * YEAR_DAYS);
}

/** Longitude the progression counts from (unwrapped, may exceed 360 when advanced). */
function startLon(natalLon: number, config: AlpConfig): number {
  const l = norm360(natalLon);
  return config.start === "sign" ? Math.floor(l / 30) * 30 : l;
}

/** ALP longitude at an instant: natal lagna advanced at the configured rate. */
export function alpLonAt(natalLon: number, birth: DateTime, asOf: DateTime, config: AlpConfig = DEFAULT_ALP_CONFIG): number {
  const days = asOf.diff(birth, "days").days;
  return norm360(startLon(natalLon, config) + alpRate(config) * Math.max(0, days));
}

function periodsBetween(natalLon: number, birth: DateTime, asOf: DateTime, config: AlpConfig, arc: number, maxYears: number): AlpPeriod[] {
  const rate = alpRate(config);
  const s0 = startLon(natalLon, config);
  const out: AlpPeriod[] = [];
  const horizonDays = maxYears * YEAR_DAYS;
  // Boundaries of `arc`-sized divisions, starting at the division containing s0.
  let lo = Math.floor(s0 / arc) * arc;
  while ((lo - s0) / rate < horizonDays) {
    const hi = lo + arc;
    const startDays = Math.max(0, (lo - s0) / rate);
    const endDays = Math.min(horizonDays, (hi - s0) / rate);
    const mid = norm360(lo + arc / 2);
    const pt = alpPointAt(mid);
    {
      const start = birth.plus({ days: startDays });
      const end = birth.plus({ days: endDays });
      out.push({
        signIndex: pt.signIndex,
        sign: pt.sign,
        lord: pt.lord,
        ...(arc < 30 ? { nakshatraIndex: pt.nakshatraIndex, pada: pt.pada, padaInSign: pt.padaInSign, navamsaSign: pt.navamsaSign } : {}),
        start: start.toISO()!,
        end: end.toISO()!,
        ageStart: startDays / YEAR_DAYS,
        ageEnd: endDays / YEAR_DAYS,
        current: asOf >= start && asOf < end,
      });
    }
    lo = hi;
  }
  return out;
}

export function computeAlp(positions: PlanetPosition[], natalLagnaLon: number, birthIso: string, asOfIso: string, config: AlpConfig = DEFAULT_ALP_CONFIG): AlpResult {
  const birth = DateTime.fromISO(birthIso, { setZone: true });
  const asOf = DateTime.fromISO(asOfIso, { setZone: true });
  const ageYears = Math.max(0, asOf.diff(birth, "days").days / YEAR_DAYS);
  const natalLagna = alpPointAt(natalLagnaLon);
  const point = alpPointAt(alpLonAt(natalLagnaLon, birth, asOf, config));
  const janma = natalLagna.signIndex;
  const alp = point.signIndex;

  const houses: AlpHouse[] = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (alp + i) % 12;
    return {
      house: i + 1,
      signIndex,
      sign: SIGNS[signIndex],
      lord: SIGN_LORD[signIndex],
      planets: positions.filter((p) => p.signIndex === signIndex).map((p) => p.planet),
      houseFromJanma: houseFrom(janma, signIndex),
    };
  });

  const place = (planet: Planet, role: string): AlpPlacement => {
    const p = positions.find((x) => x.planet === planet)!;
    return { planet, role, signIndex: p.signIndex, houseFromAlp: houseFrom(alp, p.signIndex), houseFromJanma: houseFrom(janma, p.signIndex) };
  };
  const placements: AlpPlacement[] = [
    place(point.lord, "ALP lagna lord"),
    place(natalLagna.lord, "Janma lagna lord"),
    place(point.nakshatraLord, "Lord of the ALP nakshatra"),
    place(SIGN_LORD[point.navamsaSign], "Lord of the activated navamsa sign"),
  ];

  const signPeriods = periodsBetween(natalLagnaLon, birth, asOf, config, 30, 120);
  const curSign = signPeriods.find((s) => s.current);
  // The nine padas of the current sign period (the birth sign may show fewer when the start is the natal degree).
  const padaPeriods = curSign
    ? periodsBetween(natalLagnaLon, birth, asOf, config, PADA_ARC, 120).filter((p) => p.signIndex === alp && p.ageStart >= curSign.ageStart - 1e-6 && p.ageEnd <= curSign.ageEnd + 1e-6)
    : [];
  const curPada = padaPeriods.find((s) => s.current);

  const findings = evaluateAlp({ positions, janma, alp, point, natalLagna, houses, placements });

  return {
    config,
    asOf: asOf.toISO()!,
    ageYears,
    natalLagna,
    point,
    houseFromJanma: houseFrom(janma, alp),
    houses,
    placements,
    signPeriods,
    padaPeriods,
    nextSignChange: curSign ? curSign.end : null,
    nextPadaChange: curPada ? curPada.end : null,
    findings,
  };
}
