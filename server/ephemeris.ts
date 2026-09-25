// Swiss Ephemeris wrapper. Everything sidereal; ayanamsa selectable.
import sweph from "sweph";
import path from "node:path";
import fs from "node:fs";
import { DateTime } from "luxon";
import type { KpBase } from "@shared/kp";
import type { ShadbalaBase, Seven } from "@shared/shadbala";
import {
  PLANETS,
  type Planet,
  type PlanetPosition,
  type TransitPeriod,
  type NakshatraPeriod,
  describePosition,
  norm360,
  signOf,
  SIGNS,
} from "@shared/astro";

const C = sweph.constants;

// Locate ephemeris data files (works from project root in dev and prod).
for (const candidate of [path.resolve(process.cwd(), "ephe"), path.resolve(process.cwd(), "../ephe"), process.env.EPHE_PATH ?? ""]) {
  if (!candidate) continue;
  if (fs.existsSync(path.join(candidate, "sepl_18.se1"))) {
    sweph.set_ephe_path(candidate);
    break;
  }
}

const AYANAMSA_MODE: Record<string, number> = {
  lahiri: C.SE_SIDM_LAHIRI,
  raman: C.SE_SIDM_RAMAN,
  kp: C.SE_SIDM_KRISHNAMURTI,
  yukteshwar: C.SE_SIDM_YUKTESHWAR,
};

const BODY: Record<Planet, number> = {
  Sun: C.SE_SUN,
  Moon: C.SE_MOON,
  Mars: C.SE_MARS,
  Mercury: C.SE_MERCURY,
  Jupiter: C.SE_JUPITER,
  Venus: C.SE_VENUS,
  Saturn: C.SE_SATURN,
  Rahu: C.SE_MEAN_NODE,
  Ketu: C.SE_MEAN_NODE,
};

const FLAGS = C.SEFLG_SWIEPH | C.SEFLG_SIDEREAL | C.SEFLG_SPEED;

export interface EphemerisOptions {
  ayanamsa: string; // key of AYANAMSA_MODE
  nodeType: "mean" | "true";
}

function setMode(opts: EphemerisOptions) {
  sweph.set_sid_mode(AYANAMSA_MODE[opts.ayanamsa] ?? C.SE_SIDM_LAHIRI, 0, 0);
}

export function localToUtc(date: string, time: string, zone: string): DateTime {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone });
  if (!dt.isValid) throw new Error(`Invalid birth datetime: ${dt.invalidExplanation}`);
  return dt.toUTC();
}

export function julianDay(utc: DateTime): number {
  const r = sweph.utc_to_jd(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second + utc.millisecond / 1000, C.SE_GREG_CAL);
  if (r.flag < 0) throw new Error(r.error);
  return r.data[1]; // UT
}

export function jdToIso(jd: number): string {
  const r = sweph.jdut1_to_utc(jd, C.SE_GREG_CAL) as unknown as { year: number; month: number; day: number; hour: number; minute: number; second: number };
  return DateTime.utc(r.year, r.month, r.day, r.hour, r.minute, Math.floor(r.second)).toISO()!;
}

function siderealLon(jd: number, body: number, opts: EphemerisOptions): { lon: number; speed: number } {
  setMode(opts);
  const b = body === C.SE_MEAN_NODE && opts.nodeType === "true" ? C.SE_TRUE_NODE : body;
  const r = sweph.calc_ut(jd, b, FLAGS);
  if (r.flag < 0) throw new Error(r.error);
  return { lon: norm360(r.data[0]), speed: r.data[3] };
}

export function ayanamsaAt(jd: number, opts: EphemerisOptions): number {
  setMode(opts);
  return sweph.get_ayanamsa_ut(jd);
}

export function positionsAt(jd: number, opts: EphemerisOptions): PlanetPosition[] {
  const sun = siderealLon(jd, C.SE_SUN, opts);
  return PLANETS.map((planet) => {
    let { lon, speed } = siderealLon(jd, BODY[planet], opts);
    if (planet === "Ketu") lon = norm360(lon + 180);
    const pos = describePosition(planet, lon, speed, planet === "Sun" ? undefined : sun.lon);
    if (pos.retrograde && planet !== "Rahu" && planet !== "Ketu") pos.retrogradeEntry = enteredByRetrogression(jd, planet, pos.signIndex, opts);
    return pos;
  });
}

// Did a retrograde planet back into its current sign from the sign ahead? Walk back until the sign changes.
function enteredByRetrogression(jd: number, planet: Planet, signIndex: number, opts: EphemerisOptions): boolean {
  const step = planet === "Mercury" || planet === "Venus" ? 0.25 : 1;
  for (let t = jd - step; t > jd - 220; t -= step) {
    const { lon } = siderealLon(t, BODY[planet], opts);
    const s = Math.floor(norm360(lon) / 30);
    if (s !== signIndex) return s === (signIndex + 1) % 12;
  }
  return false;
}

// Sign-ingress periods for a slow planet between two Julian days.
export function transitPeriods(planet: "Jupiter" | "Saturn", jdStart: number, jdEnd: number, opts: EphemerisOptions): TransitPeriod[] {
  const body = BODY[planet];
  const step = planet === "Jupiter" ? 2 : 5;
  const signAt = (jd: number) => signOf(siderealLon(jd, body, opts).lon);

  const periods: TransitPeriod[] = [];
  let t0 = jdStart;
  let s0 = signAt(t0);
  let periodStart = jdStart;

  while (t0 < jdEnd) {
    let t1 = Math.min(t0 + step, jdEnd);
    let s1 = signAt(t1);
    if (s1 !== s0) {
      // bisect to ~10 seconds
      let lo = t0;
      let hi = t1;
      while (hi - lo > 1e-4) {
        const mid = (lo + hi) / 2;
        if (signAt(mid) === s0) lo = mid;
        else hi = mid;
      }
      periods.push({ planet, signIndex: s0, sign: SIGNS[s0], start: jdToIso(periodStart), end: jdToIso(hi), retrogradeEntry: false });
      periodStart = hi;
      s0 = s1;
    }
    t0 = t1;
  }
  periods.push({ planet, signIndex: s0, sign: SIGNS[s0], start: jdToIso(periodStart), end: jdToIso(jdEnd), retrogradeEntry: false });

  // A period is entered by retrograde motion when its sign is the one before the previous period's sign.
  for (let i = 1; i < periods.length; i++) {
    periods[i].retrogradeEntry = (periods[i - 1].signIndex - periods[i].signIndex + 12) % 12 === 1;
  }
  return periods;
}

/** Nakshatra-ingress periods for a slow planet between two Julian days (27 equal divisions of 13°20'). */
export function nakshatraPeriods(planet: "Jupiter" | "Saturn", jdStart: number, jdEnd: number, opts: EphemerisOptions): NakshatraPeriod[] {
  const body = BODY[planet];
  const step = planet === "Jupiter" ? 1 : 3;
  const nakAt = (jd: number) => Math.floor(norm360(siderealLon(jd, body, opts).lon) / (360 / 27)) % 27;
  const periods: NakshatraPeriod[] = [];
  let t0 = jdStart;
  let n0 = nakAt(t0);
  let periodStart = jdStart;
  while (t0 < jdEnd) {
    const t1 = Math.min(t0 + step, jdEnd);
    const n1 = nakAt(t1);
    if (n1 !== n0) {
      let lo = t0;
      let hi = t1;
      while (hi - lo > 1e-4) {
        const mid = (lo + hi) / 2;
        if (nakAt(mid) === n0) lo = mid;
        else hi = mid;
      }
      periods.push({ planet, nakshatraIndex: n0, start: jdToIso(periodStart), end: jdToIso(hi), retrogradeEntry: false });
      periodStart = hi;
      n0 = n1;
    }
    t0 = t1;
  }
  periods.push({ planet, nakshatraIndex: n0, start: jdToIso(periodStart), end: jdToIso(jdEnd), retrogradeEntry: false });
  for (let i = 1; i < periods.length; i++) {
    periods[i].retrogradeEntry = (periods[i - 1].nakshatraIndex - periods[i].nakshatraIndex + 27) % 27 === 1;
  }
  return periods;
}

/** Sidereal ascendant (Placidus cusps are irrelevant; only the ascendant is used). */
export function ascendantAt(jd: number, latitude: number, longitude: number, opts: EphemerisOptions): number {
  setMode(opts);
  const r = sweph.houses_ex(jd, C.SEFLG_SIDEREAL, latitude, longitude, "P") as unknown as { flag: number; data: { houses: number[]; points: number[] } };
  if (r.flag < 0) throw new Error("Could not compute the ascendant");
  return norm360(r.data.points[0]);
}

/** The twelve Placidus cusps (sidereal) for a moment and place. */
export function cuspsAt(jd: number, latitude: number, longitude: number, opts: EphemerisOptions): number[] {
  setMode(opts);
  const r = sweph.houses_ex(jd, C.SEFLG_SIDEREAL, latitude, longitude, "P") as unknown as { flag: number; data: { houses: number[]; points: number[] } };
  if (r.flag < 0) throw new Error("Could not compute the Placidus cusps");
  return r.data.houses.slice(0, 12).map(norm360);
}

export function nowJd(): number {
  return julianDay(DateTime.utc());
}

/** Julian day of the last sunrise (upper limb, standard refraction) at or before `jd` for the given place. */
export function sunriseBefore(jd: number, latitude: number, longitude: number): number {
  const rise = (start: number) => {
    const r = sweph.rise_trans(start, C.SE_SUN, "", C.SEFLG_SWIEPH, C.SE_CALC_RISE, [longitude, latitude, 0], 1013.25, 15) as unknown as { flag: number; data: number[] | number };
    if (r.flag < 0) throw new Error("Could not compute sunrise");
    return Array.isArray(r.data) ? r.data[0] : r.data;
  };
  let t = rise(jd - 1.05);
  // Step forward while the next sunrise is still not after `jd`.
  for (let i = 0; i < 3; i++) {
    const next = rise(t + 0.5);
    if (next > jd) break;
    t = next;
  }
  return t;
}

function riseOrSetAfter(start: number, latitude: number, longitude: number, kind: number): number {
  const r = sweph.rise_trans(start, C.SE_SUN, "", C.SEFLG_SWIEPH, kind, [longitude, latitude, 0], 1013.25, 15) as unknown as { flag: number; data: number[] | number };
  if (r.flag < 0) throw new Error("Could not compute sunrise or sunset");
  return Array.isArray(r.data) ? r.data[0] : r.data;
}

/**
 * Ephemeris facts for Shadbala (BPHS ch. 27): sidereal ascendant and meridian, the day's sunrise and sunset,
 * local mean time, the Hindu weekday, the Kali-epoch day count, and each planet's declination, latitude
 * and tropical longitude. The arithmetic of the six strengths lives in shared/shadbala.ts.
 */
export function shadbalaBase(jd: number, latitude: number, longitude: number, opts: EphemerisOptions): ShadbalaBase {
  setMode(opts);
  const h = sweph.houses_ex(jd, C.SEFLG_SIDEREAL, latitude, longitude, "P") as unknown as { flag: number; data: { houses: number[]; points: number[] } };
  if (h.flag < 0) throw new Error("Could not compute the meridian");
  const asc = norm360(h.data.points[0]);
  const mc = norm360(h.data.points[1]);
  const ayanamsa = sweph.get_ayanamsa_ut(jd);
  const sunriseJd = sunriseBefore(jd, latitude, longitude);
  const sunsetJd = riseOrSetAfter(sunriseJd + 0.01, latitude, longitude, C.SE_CALC_SET);
  const nextSunriseJd = riseOrSetAfter(sunsetJd + 0.01, latitude, longitude, C.SE_CALC_RISE);
  const lmtHours = ((((jd + 0.5 + longitude / 360) % 1) + 1) % 1) * 24;
  const dayNumber = Math.floor(sunriseJd + longitude / 360 + 0.5);
  const weekday = (dayNumber + 1) % 7;
  const ahargana = dayNumber - 588466; // day 0 = 18 Feb 3102 BCE, a Friday
  const bodies = {} as ShadbalaBase["bodies"];
  for (const p of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as Seven[]) {
    const ecl = sweph.calc_ut(jd, BODY[p], C.SEFLG_SWIEPH | C.SEFLG_SPEED);
    const equ = sweph.calc_ut(jd, BODY[p], C.SEFLG_SWIEPH | C.SEFLG_EQUATORIAL);
    if (ecl.flag < 0 || equ.flag < 0) throw new Error(ecl.error || equ.error);
    bodies[p] = { tropLon: norm360(ecl.data[0]), lat: ecl.data[1], decl: equ.data[1] };
  }
  return { jd, ayanamsa, asc, mc, sunriseJd, sunsetJd, nextSunriseJd, lmtHours, weekday, ahargana, bodies };
}

/** Jaimini special lagnas: Hora lagna advances one sign per hour and Ghatika lagna one sign per ghati (24 min) from the Sun's sidereal longitude at sunrise. */
export function specialLagnas(jd: number, latitude: number, longitude: number, opts: EphemerisOptions): { horaLagna: number; ghatikaLagna: number; sunriseJd: number } {
  const sunriseJd = sunriseBefore(jd, latitude, longitude);
  setMode(opts);
  const sun = sweph.calc_ut(sunriseJd, C.SE_SUN, FLAGS) as unknown as { flag: number; data: number[] };
  const sunLon = norm360(sun.data[0]);
  const hours = (jd - sunriseJd) * 24;
  return { horaLagna: norm360(sunLon + hours * 30), ghatikaLagna: norm360(sunLon + hours * 75), sunriseJd };
}

/**
 * Krishnamurti Paddhati base data: the nine planets and the twelve Placidus cusps with the
 * Krishnamurti ayanamsa, plus the snapshot used for the ruling planets at the moment of judgement
 * (ascendant computed for the birth place; the weekday is that of the last sunrise there).
 */
export function kpBase(jd: number, latitude: number, longitude: number, zone: string, nodeType: EphemerisOptions["nodeType"]): KpBase {
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType };
  const positions = positionsAt(jd, opts);
  setMode(opts);
  const r = sweph.houses_ex(jd, C.SEFLG_SIDEREAL, latitude, longitude, "P") as unknown as { flag: number; data: { houses: number[]; points: number[] } };
  if (r.flag < 0) throw new Error("Could not compute the Placidus cusps");
  const cusps = r.data.houses.slice(0, 12).map(norm360);
  return {
    ayanamsaValue: ayanamsaAt(jd, opts),
    positions,
    cusps,
    now: judgementNow(latitude, longitude, zone, nodeType),
  };
}

/**
 * Snapshot for the ruling planets: the planets, the rising degree and the Hindu weekday (from the
 * last sunrise) at this moment for the place where the astrologer is judging. KP takes the ruling
 * planets for the judge's place, not the birth place.
 */
export function judgementNow(latitude: number, longitude: number, zone: string, nodeType: EphemerisOptions["nodeType"]): KpBase["now"] {
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType };
  const nj = nowJd();
  let weekday: number;
  try {
    weekday = weekdayOf(sunriseBefore(nj, latitude, longitude), zone);
  } catch {
    weekday = weekdayOf(nj, zone);
  }
  return { asOf: DateTime.utc().toISO()!, positions: positionsAt(nj, opts), ascendant: ascendantAt(nj, latitude, longitude, opts), weekday };
}

/** Weekday (0 = Sunday) of a Julian day, read on the civil calendar of the given zone. */
function weekdayOf(jd: number, zone: string): number {
  return DateTime.fromMillis((jd - 2440587.5) * 86400000, { zone }).weekday % 7;
}
