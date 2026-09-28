// Swiss Ephemeris wrapper. Everything sidereal; ayanamsa selectable.
import sweph from "sweph";
import { resolveTimeBasis, birthUtc, type TimeBasis } from "@shared/time-basis";
import path from "node:path";
import fs from "node:fs";
import { DateTime } from "luxon";
import {
  lordsAt,
  type KpBase,
  type KpStability,
  type KpStabilityPoint,
} from "@shared/kp";
import type { SunriseDefinition } from "@shared/schema";
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
for (const candidate of [
  path.resolve(process.cwd(), "ephe"),
  path.resolve(process.cwd(), "../ephe"),
  process.env.EPHE_PATH ?? "",
]) {
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
  /** Sunrise convention; the refracted upper limb unless set. */
  sunrise?: SunriseDefinition;
}

/** Swiss Ephemeris rise flags for each sunrise convention. */
const SUNRISE_FLAGS: Record<SunriseDefinition, number> = {
  edge: 0,
  centre: C.SE_BIT_DISC_CENTER,
  "edge-true": C.SE_BIT_NO_REFRACTION,
  "centre-true": C.SE_BIT_HINDU_RISING,
};
const sunriseFlags = (def?: SunriseDefinition) =>
  SUNRISE_FLAGS[def ?? "edge"] ?? 0;

function setMode(opts: EphemerisOptions) {
  sweph.set_sid_mode(AYANAMSA_MODE[opts.ayanamsa] ?? C.SE_SIDM_LAHIRI, 0, 0);
}

export function localToUtc(date: string, time: string, zone: string): DateTime {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone });
  if (!dt.isValid)
    throw new Error(`Invalid birth datetime: ${dt.invalidExplanation}`);
  return dt.toUTC();
}

/**
 * Birth instant under the chart's time standard. Before standard time the zone database returns the mean time of
 * the zone's reference city; the automatic standard substitutes the birthplace's own mean time (see shared/time-basis).
 */
export function birthInstant(chart: {
  birthDate: string;
  birthTime: string;
  timezone: string;
  longitude: number;
  latitude?: number;
  timeStandard?: string;
}): { utc: DateTime; basis: TimeBasis } {
  const basis = resolveTimeBasis(
    chart.birthDate,
    chart.birthTime,
    chart.timezone,
    chart.longitude,
    chart.timeStandard ?? "auto",
    chart.latitude,
  );
  if (basis.error) throw new Error(basis.error);
  return { utc: birthUtc(chart.birthDate, chart.birthTime, basis), basis };
}

export function julianDay(utc: DateTime): number {
  const r = sweph.utc_to_jd(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second + utc.millisecond / 1000,
    C.SE_GREG_CAL,
  );
  if (r.flag < 0) throw new Error(r.error);
  return r.data[1]; // UT
}

export function jdToIso(jd: number): string {
  const r = sweph.jdut1_to_utc(jd, C.SE_GREG_CAL) as unknown as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
  // Nearest second, not the floor: UT1-to-UTC conversion leaves a fraction that truncation turned into a one-second drift.
  return DateTime.utc(r.year, r.month, r.day, r.hour, r.minute, 0)
    .plus({ seconds: Math.round(r.second) })
    .toISO()!;
}

function siderealLon(
  jd: number,
  body: number,
  opts: EphemerisOptions,
): { lon: number; speed: number } {
  setMode(opts);
  const b =
    body === C.SE_MEAN_NODE && opts.nodeType === "true" ? C.SE_TRUE_NODE : body;
  const r = sweph.calc_ut(jd, b, FLAGS);
  if (r.flag < 0) throw new Error(r.error);
  return { lon: norm360(r.data[0]), speed: r.data[3] };
}

/** Sidereal Sun at each day (12:00 UT) from jdStart to jdEnd inclusive. */
export function sunPath(
  jdStart: number,
  jdEnd: number,
  opts: EphemerisOptions,
): Array<{ jd: number; lon: number }> {
  const out: Array<{ jd: number; lon: number }> = [];
  for (let jd = jdStart; jd <= jdEnd + 1e-6; jd += 1)
    out.push({ jd, lon: siderealLon(jd, C.SE_SUN, opts).lon });
  return out;
}

export function ayanamsaAt(jd: number, opts: EphemerisOptions): number {
  setMode(opts);
  return sweph.get_ayanamsa_ut(jd);
}

export function positionsAt(
  jd: number,
  opts: EphemerisOptions,
): PlanetPosition[] {
  const sun = siderealLon(jd, C.SE_SUN, opts);
  return PLANETS.map((planet) => {
    let { lon, speed } = siderealLon(jd, BODY[planet], opts);
    if (planet === "Ketu") lon = norm360(lon + 180);
    const pos = describePosition(
      planet,
      lon,
      speed,
      planet === "Sun" ? undefined : sun.lon,
    );
    if (pos.retrograde && planet !== "Rahu" && planet !== "Ketu")
      pos.retrogradeEntry = enteredByRetrogression(
        jd,
        planet,
        pos.signIndex,
        opts,
      );
    return pos;
  });
}

// Did a retrograde planet back into its current sign from the sign ahead? Walk back until the sign changes.
function enteredByRetrogression(
  jd: number,
  planet: Planet,
  signIndex: number,
  opts: EphemerisOptions,
): boolean {
  const step = planet === "Mercury" || planet === "Venus" ? 0.25 : 1;
  for (let t = jd - step; t > jd - 220; t -= step) {
    const { lon } = siderealLon(t, BODY[planet], opts);
    const s = Math.floor(norm360(lon) / 30);
    if (s !== signIndex) return s === (signIndex + 1) % 12;
  }
  return false;
}

// Sign-ingress periods for a slow planet between two Julian days.
export function transitPeriods(
  planet: "Jupiter" | "Saturn",
  jdStart: number,
  jdEnd: number,
  opts: EphemerisOptions,
): TransitPeriod[] {
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
      periods.push({
        planet,
        signIndex: s0,
        sign: SIGNS[s0],
        start: jdToIso(periodStart),
        end: jdToIso(hi),
        retrogradeEntry: false,
      });
      periodStart = hi;
      s0 = s1;
    }
    t0 = t1;
  }
  periods.push({
    planet,
    signIndex: s0,
    sign: SIGNS[s0],
    start: jdToIso(periodStart),
    end: jdToIso(jdEnd),
    retrogradeEntry: false,
  });

  // A period is entered by retrograde motion when its sign is the one before the previous period's sign.
  for (let i = 1; i < periods.length; i++) {
    periods[i].retrogradeEntry =
      (periods[i - 1].signIndex - periods[i].signIndex + 12) % 12 === 1;
  }
  return periods;
}

/** Sign-ingress periods for any planet between two Julian days (step chosen by speed; Ketu is Rahu plus six signs). */
export function signPeriodsOf(
  planet: Planet,
  jdStart: number,
  jdEnd: number,
  opts: EphemerisOptions,
): { signIndex: number; start: number; end: number }[] {
  const body = BODY[planet];
  const step =
    planet === "Moon"
      ? 0.25
      : planet === "Sun" || planet === "Mercury" || planet === "Venus"
        ? 1
        : planet === "Mars"
          ? 2
          : 5;
  const signAt = (jd: number) => {
    let lon = siderealLon(jd, body, opts).lon;
    if (planet === "Ketu") lon = norm360(lon + 180);
    return signOf(lon);
  };
  const out: { signIndex: number; start: number; end: number }[] = [];
  let t0 = jdStart;
  let s0 = signAt(t0);
  let periodStart = jdStart;
  while (t0 < jdEnd) {
    const t1 = Math.min(t0 + step, jdEnd);
    const s1 = signAt(t1);
    if (s1 !== s0) {
      let lo = t0;
      let hi = t1;
      while (hi - lo > 1e-4) {
        const mid = (lo + hi) / 2;
        if (signAt(mid) === s0) lo = mid;
        else hi = mid;
      }
      out.push({ signIndex: s0, start: periodStart, end: hi });
      periodStart = hi;
      s0 = s1;
    }
    t0 = t1;
  }
  out.push({ signIndex: s0, start: periodStart, end: jdEnd });
  return out;
}

export const isoToJd = (iso: string) =>
  julianDay(DateTime.fromISO(iso, { zone: "utc" }));

/** Nakshatra-ingress periods for a slow planet between two Julian days (27 equal divisions of 13°20'). */
export function nakshatraPeriods(
  planet: "Jupiter" | "Saturn",
  jdStart: number,
  jdEnd: number,
  opts: EphemerisOptions,
): NakshatraPeriod[] {
  const body = BODY[planet];
  const step = planet === "Jupiter" ? 1 : 3;
  const nakAt = (jd: number) =>
    Math.floor(norm360(siderealLon(jd, body, opts).lon) / (360 / 27)) % 27;
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
      periods.push({
        planet,
        nakshatraIndex: n0,
        start: jdToIso(periodStart),
        end: jdToIso(hi),
        retrogradeEntry: false,
      });
      periodStart = hi;
      n0 = n1;
    }
    t0 = t1;
  }
  periods.push({
    planet,
    nakshatraIndex: n0,
    start: jdToIso(periodStart),
    end: jdToIso(jdEnd),
    retrogradeEntry: false,
  });
  for (let i = 1; i < periods.length; i++) {
    periods[i].retrogradeEntry =
      (periods[i - 1].nakshatraIndex - periods[i].nakshatraIndex + 27) % 27 ===
      1;
  }
  return periods;
}

/** Sidereal ascendant (Placidus cusps are irrelevant; only the ascendant is used). */
export function ascendantAt(
  jd: number,
  latitude: number,
  longitude: number,
  opts: EphemerisOptions,
): number {
  setMode(opts);
  const r = sweph.houses_ex(
    jd,
    C.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "P",
  ) as unknown as {
    flag: number;
    data: { houses: number[]; points: number[] };
  };
  if (r.flag < 0) throw new Error("Could not compute the ascendant");
  return norm360(r.data.points[0]);
}

/** The twelve Placidus cusps (sidereal) for a moment and place. */
export function cuspsAt(
  jd: number,
  latitude: number,
  longitude: number,
  opts: EphemerisOptions,
): number[] {
  setMode(opts);
  const r = sweph.houses_ex(
    jd,
    C.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "P",
  ) as unknown as {
    flag: number;
    data: { houses: number[]; points: number[] };
  };
  if (r.flag < 0) throw new Error("Could not compute the Placidus cusps");
  return r.data.houses.slice(0, 12).map(norm360);
}

export function nowJd(): number {
  return julianDay(DateTime.utc());
}

/** Julian day of the last sunrise at or before `jd` for the given place, under the chosen convention (refracted upper limb by default). */
export function sunriseBefore(
  jd: number,
  latitude: number,
  longitude: number,
  def?: SunriseDefinition,
): number {
  const rise = (start: number) => {
    const r = sweph.rise_trans(
      start,
      C.SE_SUN,
      "",
      C.SEFLG_SWIEPH,
      C.SE_CALC_RISE | sunriseFlags(def),
      [longitude, latitude, 0],
      1013.25,
      15,
    ) as unknown as { flag: number; data: number[] | number };
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

function riseOrSetAfter(
  start: number,
  latitude: number,
  longitude: number,
  kind: number,
  def?: SunriseDefinition,
): number {
  const r = sweph.rise_trans(
    start,
    C.SE_SUN,
    "",
    C.SEFLG_SWIEPH,
    kind | sunriseFlags(def),
    [longitude, latitude, 0],
    1013.25,
    15,
  ) as unknown as { flag: number; data: number[] | number };
  if (r.flag < 0) throw new Error("Could not compute sunrise or sunset");
  return Array.isArray(r.data) ? r.data[0] : r.data;
}

/**
 * Ephemeris facts for Shadbala (BPHS ch. 27): sidereal ascendant and meridian, the day's sunrise and sunset,
 * local mean time, the Hindu weekday, the Kali-epoch day count, and each planet's declination, latitude
 * and tropical longitude. The arithmetic of the six strengths lives in shared/shadbala.ts.
 */
export function shadbalaBase(
  jd: number,
  latitude: number,
  longitude: number,
  opts: EphemerisOptions,
): ShadbalaBase {
  setMode(opts);
  const h = sweph.houses_ex(
    jd,
    C.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "P",
  ) as unknown as {
    flag: number;
    data: { houses: number[]; points: number[] };
  };
  if (h.flag < 0) throw new Error("Could not compute the meridian");
  const asc = norm360(h.data.points[0]);
  const mc = norm360(h.data.points[1]);
  const ayanamsa = sweph.get_ayanamsa_ut(jd);
  const sunriseJd = sunriseBefore(jd, latitude, longitude, opts.sunrise);
  const sunsetJd = riseOrSetAfter(
    sunriseJd + 0.01,
    latitude,
    longitude,
    C.SE_CALC_SET,
    opts.sunrise,
  );
  const nextSunriseJd = riseOrSetAfter(
    sunsetJd + 0.01,
    latitude,
    longitude,
    C.SE_CALC_RISE,
    opts.sunrise,
  );
  const lmtHours = ((((jd + 0.5 + longitude / 360) % 1) + 1) % 1) * 24;
  const dayNumber = Math.floor(sunriseJd + longitude / 360 + 0.5);
  const weekday = (dayNumber + 1) % 7;
  const ahargana = dayNumber - 588466; // day 0 = 18 Feb 3102 BCE, a Friday
  const bodies = {} as ShadbalaBase["bodies"];
  for (const p of [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ] as Seven[]) {
    const ecl = sweph.calc_ut(jd, BODY[p], C.SEFLG_SWIEPH | C.SEFLG_SPEED);
    const equ = sweph.calc_ut(jd, BODY[p], C.SEFLG_SWIEPH | C.SEFLG_EQUATORIAL);
    if (ecl.flag < 0 || equ.flag < 0) throw new Error(ecl.error || equ.error);
    bodies[p] = {
      tropLon: norm360(ecl.data[0]),
      lat: ecl.data[1],
      decl: equ.data[1],
    };
  }
  return {
    jd,
    ayanamsa,
    asc,
    mc,
    sunriseJd,
    sunsetJd,
    nextSunriseJd,
    lmtHours,
    weekday,
    ahargana,
    bodies,
  };
}

/** Jaimini special lagnas: Hora lagna advances one sign per hour and Ghatika lagna one sign per ghati (24 min) from the Sun's sidereal longitude at sunrise. */
export function specialLagnas(
  jd: number,
  latitude: number,
  longitude: number,
  opts: EphemerisOptions,
): { horaLagna: number; ghatikaLagna: number; sunriseJd: number } {
  const sunriseJd = sunriseBefore(jd, latitude, longitude, opts.sunrise);
  setMode(opts);
  const sun = sweph.calc_ut(sunriseJd, C.SE_SUN, FLAGS) as unknown as {
    flag: number;
    data: number[];
  };
  const sunLon = norm360(sun.data[0]);
  const hours = (jd - sunriseJd) * 24;
  return {
    horaLagna: norm360(sunLon + hours * 30),
    ghatikaLagna: norm360(sunLon + hours * 75),
    sunriseJd,
  };
}

/**
 * Krishnamurti Paddhati base data: the nine planets and the twelve Placidus cusps with the
 * Krishnamurti ayanamsa, plus the snapshot used for the ruling planets at the moment of judgement
 * (ascendant computed for the birth place; the weekday is that of the last sunrise there).
 */
export function kpBase(
  jd: number,
  latitude: number,
  longitude: number,
  zone: string,
  nodeType: EphemerisOptions["nodeType"],
): KpBase {
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType };
  const positions = positionsAt(jd, opts);
  setMode(opts);
  const r = sweph.houses_ex(
    jd,
    C.SEFLG_SIDEREAL,
    latitude,
    longitude,
    "P",
  ) as unknown as {
    flag: number;
    data: { houses: number[]; points: number[] };
  };
  if (r.flag < 0) throw new Error("Could not compute the Placidus cusps");
  const cusps = r.data.houses.slice(0, 12).map(norm360);
  return {
    ayanamsaValue: ayanamsaAt(jd, opts),
    positions,
    cusps,
    stability: kpStability(jd, latitude, longitude, nodeType),
    now: judgementNow(latitude, longitude, zone, nodeType),
  };
}

/** Signed offset of `lon` from `target` in (-180, 180]. */
function offset(lon: number, target: number): number {
  const d = norm360(lon - target);
  return d > 180 ? d - 360 : d;
}

/**
 * Seconds from jd0 to the moment `lonAt` crosses `target`, searching forward (dir = 1) or back
 * (dir = -1) up to `window` seconds; null when the crossing lies beyond the window. The point is
 * assumed to move forward monotonically over the window, which holds for the cusps over an hour and
 * for the Moon over a day.
 */
function crossingSeconds(
  lonAt: (jd: number) => number,
  jd0: number,
  target: number,
  dir: 1 | -1,
  window: number,
): number | null {
  const DAY = 86400;
  const far = jd0 + (dir * window) / DAY;
  // Forward: the offset is negative now and turns non-negative at the crossing. Back: it is
  // non-negative now and was negative before the crossing.
  const crossed = (jd: number) =>
    dir === 1 ? offset(lonAt(jd), target) >= 0 : offset(lonAt(jd), target) < 0;
  if (!crossed(far)) return null;
  let near = jd0;
  let beyond = far;
  for (let i = 0; i < 22; i++) {
    const mid = (near + beyond) / 2;
    if (crossed(mid)) beyond = mid;
    else near = mid;
  }
  return Math.abs(beyond - jd0) * DAY;
}

function stabilityOf(
  lonAt: (jd: number) => number,
  jd0: number,
  window: number,
  label: string,
  house?: number,
): KpStabilityPoint {
  const lon0 = lonAt(jd0);
  const L = lordsAt(lon0);
  const EPS = 1e-6;
  const after = crossingSeconds(lonAt, jd0, L.subEnd, 1, window);
  const before = crossingSeconds(lonAt, jd0, L.subStart, -1, window);
  return {
    house,
    label,
    starLord: L.starLord,
    subLord: L.subLord,
    before: before === null ? null : Math.round(before * 10) / 10,
    after: after === null ? null : Math.round(after * 10) / 10,
    prevSub: before === null ? null : lordsAt(L.subStart - EPS).subLord,
    nextSub: after === null ? null : lordsAt(L.subEnd + EPS).subLord,
  };
}

/**
 * How long each cusp, and the Moon, keeps its sub lord either side of the recorded time. Cusps are
 * searched an hour each way, the Moon a day; the sub table is the KP one (shared/kp.ts).
 */
export function kpStability(
  jd: number,
  latitude: number,
  longitude: number,
  nodeType: EphemerisOptions["nodeType"],
): KpStability {
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType };
  const CUSP_WINDOW = 3600;
  const MOON_WINDOW = 86400;
  const cuspCache = new Map<number, number[]>();
  const cuspsMemo = (t: number) => {
    let c = cuspCache.get(t);
    if (!c) {
      c = cuspsAt(t, latitude, longitude, opts);
      cuspCache.set(t, c);
    }
    return c;
  };
  const ord = (n: number) =>
    n === 2 ? "2nd" : n === 3 ? "3rd" : n === 11 || n === 12 ? `${n}th` : `${n}th`;
  const cusps = Array.from({ length: 12 }, (_, i) =>
    stabilityOf(
      (t) => cuspsMemo(t)[i],
      jd,
      CUSP_WINDOW,
      i === 0 ? "Lagna" : `${ord(i + 1)} cusp`,
      i + 1,
    ),
  );
  const moon = stabilityOf(
    (t) => siderealLon(t, C.SE_MOON, opts).lon,
    jd,
    MOON_WINDOW,
    "Moon",
  );
  return { cuspWindow: CUSP_WINDOW, moonWindow: MOON_WINDOW, cusps, moon };
}

/**
 * Snapshot for the ruling planets: the planets, the rising degree and the Hindu weekday (from the
 * last sunrise) at this moment for the place where the astrologer is judging. KP takes the ruling
 * planets for the judge's place, not the birth place.
 */
export function judgementNow(
  latitude: number,
  longitude: number,
  zone: string,
  nodeType: EphemerisOptions["nodeType"],
): KpBase["now"] {
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType };
  const nj = nowJd();
  let weekday: number;
  try {
    weekday = weekdayOf(sunriseBefore(nj, latitude, longitude), zone);
  } catch {
    weekday = weekdayOf(nj, zone);
  }
  return {
    asOf: DateTime.utc().toISO()!,
    positions: positionsAt(nj, opts),
    ascendant: ascendantAt(nj, latitude, longitude, opts),
    weekday,
  };
}

/** Weekday (0 = Sunday) of a Julian day, read on the civil calendar of the given zone. */
function weekdayOf(jd: number, zone: string): number {
  return DateTime.fromMillis((jd - 2440587.5) * 86400000, { zone }).weekday % 7;
}

// ---------------------------------------------------------------------------------------------------------------
// Panchanga (Surya Siddhanta 1.36, 2.64-69; arithmetic in shared/panchanga.ts)

import {
  tithiOf,
  nakshatraOf,
  yogaOf,
  karanaOf,
  moonPhase,
  tithiIndex,
  nakshatraIndex,
  yogaIndex,
  karanaSlot,
  WEEKDAY_NAMES,
  WEEKDAY_LORD,
  type PanchangaDay,
  type LimbSegment,
} from "@shared/panchanga";

function sunMoon(
  jd: number,
  opts: EphemerisOptions,
): { sun: number; moon: number } {
  return {
    sun: siderealLon(jd, C.SE_SUN, opts).lon,
    moon: siderealLon(jd, C.SE_MOON, opts).lon,
  };
}

/** Segments of one limb from `from` to `to`: the element in force at `from`, then each successor with its exact ending time. */
function limbRun(
  from: number,
  to: number,
  at: number,
  opts: EphemerisOptions,
  index: (sm: { sun: number; moon: number }) => number,
  describe: (sm: { sun: number; moon: number }) => {
    name: string;
    detail?: string;
  },
): LimbSegment[] {
  const out: LimbSegment[] = [];
  let t = from;
  let idx = index(sunMoon(t, opts));
  let desc = describe(sunMoon(t, opts));
  const step = 1 / 48; // thirty minutes
  for (let guard = 0; guard < 12; guard++) {
    // Walk forward until the index changes or the day ends.
    let a = t;
    let b = Math.min(to, t + step);
    let changed = false;
    while (b <= to + 1e-9) {
      if (index(sunMoon(b, opts)) !== idx) {
        changed = true;
        break;
      }
      if (b >= to) break;
      a = b;
      b = Math.min(to, b + step);
    }
    if (!changed) {
      out.push({ ...desc, current: t <= at && at < to + 1e-9 });
      break;
    }
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      if (index(sunMoon(m, opts)) === idx) a = m;
      else b = m;
    }
    out.push({ ...desc, end: jdToIso(b), current: t <= at && at < b });
    t = b;
    idx = index(sunMoon(t + 1e-6, opts));
    desc = describe(sunMoon(t + 1e-6, opts));
  }
  return out;
}

/**
 * The five limbs for the civil day containing `jd` at a place, read at `jd` itself (sunrise for a calendar date, the birth
 * instant for a birth panchanga), with each limb's changes until the next sunrise.
 */
export function panchangaAt(
  jd: number,
  latitude: number,
  longitude: number,
  zone: string,
  opts: EphemerisOptions,
  date?: string,
  sunriseJd?: number,
): PanchangaDay {
  const sunrise =
    sunriseJd ?? sunriseBefore(jd, latitude, longitude, opts.sunrise);
  const sunset = riseOrSetAfter(
    sunrise,
    latitude,
    longitude,
    C.SE_CALC_SET,
    opts.sunrise,
  );
  const nextSunrise = riseOrSetAfter(
    sunrise + 0.01,
    latitude,
    longitude,
    C.SE_CALC_RISE,
    opts.sunrise,
  );
  const sm = sunMoon(jd, opts);
  const weekday = weekdayOf(sunrise, zone);
  const local = DateTime.fromMillis((sunrise - 2440587.5) * 86400000, { zone });
  return {
    date: date ?? local.toISODate()!,
    timezone: zone,
    latitude,
    longitude,
    sunriseDef: opts.sunrise ?? "edge",
    sunrise: jdToIso(sunrise),
    sunset: jdToIso(sunset),
    nextSunrise: jdToIso(nextSunrise),
    at: jdToIso(jd),
    weekday,
    vara: { name: WEEKDAY_NAMES[weekday], lord: WEEKDAY_LORD[weekday] },
    tithi: tithiOf(sm.moon, sm.sun),
    nakshatra: nakshatraOf(sm.moon),
    yoga: yogaOf(sm.moon, sm.sun),
    karana: karanaOf(sm.moon, sm.sun),
    phase: moonPhase(sm.moon, sm.sun),
    sunLon: sm.sun,
    moonLon: sm.moon,
    runs: {
      tithi: limbRun(
        sunrise,
        nextSunrise,
        jd,
        opts,
        (s) => tithiIndex(s.moon, s.sun),
        (s) => {
          const t = tithiOf(s.moon, s.sun);
          return { name: t.name, detail: t.paksha };
        },
      ),
      nakshatra: limbRun(
        sunrise,
        nextSunrise,
        jd,
        opts,
        (s) => nakshatraIndex(s.moon),
        (s) => {
          const n = nakshatraOf(s.moon);
          return { name: n.name, detail: n.lord };
        },
      ),
      yoga: limbRun(
        sunrise,
        nextSunrise,
        jd,
        opts,
        (s) => yogaIndex(s.moon, s.sun),
        (s) => ({ name: yogaOf(s.moon, s.sun).name }),
      ),
      karana: limbRun(
        sunrise,
        nextSunrise,
        jd,
        opts,
        (s) => karanaSlot(s.moon, s.sun),
        (s) => {
          const k = karanaOf(s.moon, s.sun);
          return { name: k.name, detail: k.fixed ? "fixed" : undefined };
        },
      ),
    },
    ayanamsa: { key: opts.ayanamsa, value: ayanamsaAt(jd, opts) },
  };
}

/** Panchanga for a calendar date at a place: read at that day's sunrise. */
export function panchangaForDate(
  date: string,
  latitude: number,
  longitude: number,
  zone: string,
  opts: EphemerisOptions,
): { day: PanchangaDay; positions: PlanetPosition[] } {
  const noon = julianDay(DateTime.fromISO(`${date}T12:00`, { zone }).toUTC());
  const sunrise = sunriseBefore(noon, latitude, longitude, opts.sunrise);
  const day = panchangaAt(
    sunrise,
    latitude,
    longitude,
    zone,
    opts,
    date,
    sunrise,
  );
  return { day, positions: positionsAt(sunrise, opts) };
}

/** Positions without the retrograde-entry walk; enough for sign, dignity and combustion, and cheap enough to sample daily. */
export function positionsLite(
  jd: number,
  opts: EphemerisOptions,
): PlanetPosition[] {
  const sun = siderealLon(jd, C.SE_SUN, opts);
  return PLANETS.map((planet) => {
    let { lon, speed } = siderealLon(jd, BODY[planet], opts);
    if (planet === "Ketu") lon = norm360(lon + 180);
    return describePosition(
      planet,
      lon,
      speed,
      planet === "Sun" ? undefined : sun.lon,
    );
  });
}
