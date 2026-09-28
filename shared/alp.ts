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

import { redactSensitive } from "./life-stage";
import { DateTime } from "luxon";
import { NAKSHATRAS, NAKSHATRA_LORD, SIGNS, SIGN_LORD, houseFrom, norm360, type Planet, type PlanetPosition, type Sign } from "./astro";
import { navamsaOf } from "./jaimini";
import { evaluateAlp, type AlpFinding } from "./rules-alp";

// Akshaya Rasi (AR / ARP), Book 2 ch. 6-8 (pp. 68-77): the Moon's birth nakshatra is the birth rasi;
// with each Vimshottari dasa the Moon "shifts" to the next nakshatra, one pada for each quarter of the
// dasa, and the sign the current pada falls in is the Akshaya rasi, read for the mind as the Akshaya
// lagna is read for the body.
export const VIMSHOTTARI_ORDER: Planet[] = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
export const VIMSHOTTARI_YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

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
const NAK_ARC = 360 / 27; // 13°20'

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
  /** For nakshatra and pada periods. */
  nakshatraIndex?: number;
  nakshatra?: string;
  nakshatraLord?: Planet;
  /** For pada periods: nakshatra pada in this sign. */
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

export interface ArpPeriod {
  lord: Planet;
  nakshatraIndex: number;
  nakshatra: string;
  /** Sign(s) the stretch falls in: one for a pada, one or two for a whole nakshatra. */
  signs: number[];
  pada?: number;
  navamsaSign?: number;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
}

export interface ArpResult {
  natalMoon: AlpPoint;
  /** The progressed Moon: the current nakshatra pada of the Akshaya rasi. */
  point: AlpPoint;
  houseFromAlp: number;
  houseFromJanma: number;
  /** The running dasa: its lord is the lord of the ARP nakshatra. */
  dasa: ArpPeriod;
  bhukti: { lord: Planet; start: string; end: string; ageStart: number; ageEnd: number };
  bhuktis: { lord: Planet; start: string; end: string; ageStart: number; ageEnd: number; current: boolean }[];
  /** The four padas of the running dasa, each a quarter of it. */
  padaPeriods: ArpPeriod[];
  /** The nine dasas from birth (the first prorated from the Moon's degree). */
  dasaTimeline: ArpPeriod[];
  nextPadaChange: string | null;
  /** Dasa lord (ARP nakshatra lord) as placed in the natal chart. */
  dasaLord: { planet: Planet; signIndex: number; houseFromArp: number; houseFromAlp: number };
  bhuktiLord: { planet: Planet; signIndex: number; houseFromArp: number; houseFromDasaLord: number; houseFromAlp: number };
  arpLord: { planet: Planet; signIndex: number; houseFromArp: number; houseFromAlp: number; houseFromAlpLord: number };
  /** House of the ARP nakshatra lord's sign counted from the ALP nakshatra lord's sign. */
  nakLordsMutual: number;
}

export interface AlpResult {
  config: AlpConfig;
  /** The Akshaya rasi (the mind), Book 2 ch. 6-8. */
  arp: ArpResult;
  asOf: string;
  ageYears: number;
  natalLagna: AlpPoint;
  point: AlpPoint;
  /** The ALP sign counted as a house from the janma lagna. */
  houseFromJanma: number;
  houses: AlpHouse[];
  placements: AlpPlacement[];
  signPeriods: AlpPeriod[];
  /** The nakshatra stretches inside the current sign, clipped to the sign's boundaries. */
  nakshatraPeriods: AlpPeriod[];
  /** Every nakshatra the lagna passes through over the 120-year cycle (about 4.4 years each). */
  nakshatraTimeline: AlpPeriod[];
  padaPeriods: AlpPeriod[];
  nextSignChange: string | null;
  nextNakshatraChange: string | null;
  nextPadaChange: string | null;
  /** The whole-degree arithmetic as Book 2 lays it out: completed years x 3, plus 1 degree per four months. */
  book: AlpBookArithmetic;
  findings: AlpFinding[];
}

export interface AlpBookArithmetic {
  years: number;
  months: number;
  degFromYears: number;
  degFromMonths: number;
  degTravelled: number;
  point: AlpPoint;
  /** True when the whole-degree point lands in the same nakshatra pada as the continuous one. */
  agreesWithContinuous: boolean;
}

/** Book 2 (pp. 32-41): degrees = completed years x 3 + one degree per four months of the remainder (7 months -> 2, 8 -> 2, 9 -> 2, 5 -> 1, 1 -> 0). */
export function bookArithmetic(natalLon: number, birth: DateTime, asOf: DateTime, continuous: AlpPoint): AlpBookArithmetic {
  const d = asOf.diff(birth, ["years", "months"]);
  const years = Math.max(0, Math.floor(d.years));
  const months = Math.max(0, Math.floor(d.months));
  const degFromYears = years * 3;
  const degFromMonths = Math.floor(months / 4 + 0.5);
  const degTravelled = degFromYears + degFromMonths;
  const point = alpPointAt(norm360(natalLon) + degTravelled);
  return {
    years,
    months,
    degFromYears,
    degFromMonths,
    degTravelled,
    point,
    agreesWithContinuous: point.nakshatraIndex === continuous.nakshatraIndex && point.pada === continuous.pada,
  };
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
        ...(arc < 30 ? { nakshatraIndex: pt.nakshatraIndex, nakshatra: pt.nakshatra, nakshatraLord: pt.nakshatraLord } : {}),
        ...(arc <= PADA_ARC ? { pada: pt.pada, padaInSign: pt.padaInSign, navamsaSign: pt.navamsaSign } : {}),
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

/** Progressed Moon longitude after `days` from birth: each nakshatra takes its Vimshottari lord's years (Book 2 pp. 72-73). */
export function arpLonAt(moonLon: number, days: number): number {
  let lon = norm360(moonLon);
  let rem = Math.max(0, days);
  for (let guard = 0; guard < 60; guard++) {
    const k = Math.floor(lon / NAK_ARC);
    const yrs = VIMSHOTTARI_YEARS[NAKSHATRA_LORD[k % 27]];
    const nakEnd = (k + 1) * NAK_ARC;
    const daysToEnd = ((nakEnd - lon) / NAK_ARC) * yrs * YEAR_DAYS;
    if (rem < daysToEnd) return norm360(lon + (rem / (yrs * YEAR_DAYS)) * NAK_ARC);
    rem -= daysToEnd;
    lon = nakEnd;
  }
  return norm360(lon);
}

function computeArp(positions: PlanetPosition[], birth: DateTime, asOf: DateTime, janma: number, alp: number, alpPoint: AlpPoint): ArpResult {
  const moon = positions.find((p) => p.planet === "Moon")!;
  const natalMoon = alpPointAt(moon.lon);
  const days = Math.max(0, asOf.diff(birth, "days").days);
  const point = alpPointAt(arpLonAt(moon.lon, days));
  const signsOf = (lo: number, hi: number) => {
    const a = Math.floor(lo / 30) % 12;
    const b = Math.floor((hi - 1e-6) / 30) % 12;
    return a === b ? [a] : [a, b];
  };
  const at = (d: number) => birth.plus({ days: d });
  const iso = (d: number) => at(d).toISO()!;
  const between = (d0: number, d1: number) => asOf >= at(d0) && asOf < at(d1);

  // Dasa timeline: from the Moon's degree, nakshatra by nakshatra, through the 120-year cycle.
  const dasaTimeline: ArpPeriod[] = [];
  let lon = norm360(moon.lon);
  let d = 0;
  for (let i = 0; i < 27 && d < 120 * YEAR_DAYS - 1; i++) {
    const k = Math.floor(lon / NAK_ARC);
    const lord = NAKSHATRA_LORD[k % 27];
    const yrs = VIMSHOTTARI_YEARS[lord];
    const nakEnd = (k + 1) * NAK_ARC;
    const span = ((nakEnd - lon) / NAK_ARC) * yrs * YEAR_DAYS;
    dasaTimeline.push({ lord, nakshatraIndex: k % 27, nakshatra: NAKSHATRAS[k % 27], signs: signsOf(lon, nakEnd), start: iso(d), end: iso(d + span), ageStart: d / YEAR_DAYS, ageEnd: (d + span) / YEAR_DAYS, current: between(d, d + span) });
    d += span;
    lon = nakEnd;
  }
  const dasa = dasaTimeline.find((x) => x.current) ?? dasaTimeline[dasaTimeline.length - 1];
  const dasaYears = VIMSHOTTARI_YEARS[dasa.lord];
  // The first dasa began before birth: its full span is the lord's years ending at dasa.end.
  const dasaStartDays = DateTime.fromISO(dasa.end).diff(birth, "days").days - dasaYears * YEAR_DAYS;

  const padaPeriods: ArpPeriod[] = Array.from({ length: 4 }, (_, i) => {
    const q = dasaYears * YEAR_DAYS / 4;
    const d0 = dasaStartDays + i * q;
    const d1 = d0 + q;
    const lo = dasa.nakshatraIndex * NAK_ARC + i * PADA_ARC;
    const pt = alpPointAt(lo + PADA_ARC / 2);
    return { lord: dasa.lord, nakshatraIndex: dasa.nakshatraIndex, nakshatra: dasa.nakshatra, signs: [pt.signIndex], pada: i + 1, navamsaSign: pt.navamsaSign, start: iso(d0), end: iso(d1), ageStart: d0 / YEAR_DAYS, ageEnd: d1 / YEAR_DAYS, current: between(d0, d1) };
  });
  const curPada = padaPeriods.find((p) => p.current);

  const startIdx = VIMSHOTTARI_ORDER.indexOf(dasa.lord);
  let bd = dasaStartDays;
  const bhuktis = VIMSHOTTARI_ORDER.map((_, i) => {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
    const span = (dasaYears * VIMSHOTTARI_YEARS[lord] / 120) * YEAR_DAYS;
    const row = { lord, start: iso(bd), end: iso(bd + span), ageStart: bd / YEAR_DAYS, ageEnd: (bd + span) / YEAR_DAYS, current: between(bd, bd + span) };
    bd += span;
    return row;
  });
  const bhukti = bhuktis.find((b) => b.current) ?? bhuktis[bhuktis.length - 1];

  const arpSign = point.signIndex;
  const pos = (planet: Planet) => positions.find((p) => p.planet === planet)!;
  const dl = pos(dasa.lord);
  const bl = pos(bhukti.lord);
  const al = pos(point.lord);
  const alpLordPos = pos(alpPoint.lord);
  const alpNakLordPos = pos(alpPoint.nakshatraLord);
  return {
    natalMoon,
    point,
    houseFromAlp: houseFrom(alp, arpSign),
    houseFromJanma: houseFrom(janma, arpSign),
    dasa,
    bhukti: { lord: bhukti.lord, start: bhukti.start, end: bhukti.end, ageStart: bhukti.ageStart, ageEnd: bhukti.ageEnd },
    bhuktis,
    padaPeriods,
    dasaTimeline,
    nextPadaChange: curPada ? curPada.end : null,
    dasaLord: { planet: dasa.lord, signIndex: dl.signIndex, houseFromArp: houseFrom(arpSign, dl.signIndex), houseFromAlp: houseFrom(alp, dl.signIndex) },
    bhuktiLord: { planet: bhukti.lord, signIndex: bl.signIndex, houseFromArp: houseFrom(arpSign, bl.signIndex), houseFromDasaLord: houseFrom(dl.signIndex, bl.signIndex), houseFromAlp: houseFrom(alp, bl.signIndex) },
    arpLord: { planet: point.lord, signIndex: al.signIndex, houseFromArp: houseFrom(arpSign, al.signIndex), houseFromAlp: houseFrom(alp, al.signIndex), houseFromAlpLord: houseFrom(alpLordPos.signIndex, al.signIndex) },
    nakLordsMutual: houseFrom(alpNakLordPos.signIndex, dl.signIndex),
  };
}

export function computeAlp(positions: PlanetPosition[], natalLagnaLon: number, birthIso: string, asOfIso: string, config: AlpConfig = DEFAULT_ALP_CONFIG, withhold = false): AlpResult {
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

  // Nakshatra stretches within the current sign: nakshatra boundaries clipped to the sign, in unwrapped longitude.
  const nakshatraPeriods: AlpPeriod[] = [];
  if (curSign) {
    const rate = alpRate(config);
    const s0 = startLon(natalLagnaLon, config);
    const signLo = Math.floor((s0 + ageYears * YEAR_DAYS * rate) / 30) * 30;
    const signHi = signLo + 30;
    for (let k = Math.floor(signLo / NAK_ARC); k * NAK_ARC < signHi - 1e-9; k++) {
      const lo = Math.max(k * NAK_ARC, signLo);
      const hi = Math.min((k + 1) * NAK_ARC, signHi);
      const endDays = (hi - s0) / rate;
      if (endDays <= 0) continue;
      const startDays = Math.max(0, (lo - s0) / rate);
      const pt = alpPointAt(norm360((lo + hi) / 2));
      const start = birth.plus({ days: startDays });
      const end = birth.plus({ days: endDays });
      nakshatraPeriods.push({
        signIndex: pt.signIndex,
        sign: pt.sign,
        lord: pt.lord,
        nakshatraIndex: pt.nakshatraIndex,
        nakshatra: pt.nakshatra,
        nakshatraLord: pt.nakshatraLord,
        start: start.toISO()!,
        end: end.toISO()!,
        ageStart: startDays / YEAR_DAYS,
        ageEnd: endDays / YEAR_DAYS,
        current: asOf >= start && asOf < end,
      });
    }
  }
  const curNak = nakshatraPeriods.find((s) => s.current);
  const nakshatraTimeline = periodsBetween(natalLagnaLon, birth, asOf, config, NAK_ARC, 120);

  const book = bookArithmetic(natalLagnaLon, birth, asOf, point);
  const nakStraddlesAhead = (() => {
    // The current nakshatra continues past the end of the current sign (Book 2 p. 42: a "split" nakshatra).
    const nakEnd = (point.nakshatraIndex + 1) * NAK_ARC;
    const signEnd = (point.signIndex + 1) * 30;
    return nakEnd > signEnd + 1e-9;
  })();
  const arp = computeArp(positions, birth, asOf, janma, alp, point);
  const findings0 = evaluateAlp({ positions, janma, alp, point, natalLagna, houses, placements, nakStraddlesAhead, arp });
  // The sensitive-content gate (shared/life-stage.ts) strips longevity statements for a minor.
  const findings = withhold ? redactSensitive(findings0) : findings0;

  return {
    config,
    arp,
    asOf: asOf.toISO()!,
    ageYears,
    natalLagna,
    point,
    houseFromJanma: houseFrom(janma, alp),
    houses,
    placements,
    signPeriods,
    nakshatraPeriods,
    nakshatraTimeline,
    padaPeriods,
    nextSignChange: curSign ? curSign.end : null,
    nextNakshatraChange: curNak ? curNak.end : null,
    nextPadaChange: curPada ? curPada.end : null,
    book,
    findings,
  };
}
