// Krishnamurti Paddhati (KP): the stellar method of Prof. K.S. Krishnamurti.
//
// Arithmetic only, pure. Positions and Placidus cusps come from the ephemeris with the
// Krishnamurti ayanamsa (the KP tab always uses it, whatever the chart's own setting); the
// "as of" moment and the ruling-planet snapshot come from the caller. Interpretation lives
// in rules-kp.ts and is entered chapter by chapter from the practitioner's books and class notes.
//
// Core ideas (Astro Secrets Part 3, "Principle of Sublords and Relevant Houses", pp. 35-37):
// every point of the zodiac has a sign lord, a star (nakshatra) lord and a sub lord, the sub being
// the nakshatra divided into nine unequal parts in Vimshottari proportion; the sub lord of a cusp
// decides whether the matter of that house fructifies, and the houses a planet signifies are read
// through its star lord first (occupancy, then ownership) and then through the planet itself.

import { DateTime } from "luxon";
import { NAKSHATRAS, NAKSHATRA_LORD, SIGNS, SIGN_LORD, SIGN_QUALITY, norm360, type Planet, type PlanetPosition, type Sign } from "./astro";
import { evaluateKp, type KpFinding } from "./rules-kp";

export const VIMSHOTTARI_ORDER: Planet[] = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
export const VIMSHOTTARI_YEARS: Record<Planet, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

const NAK_ARC = 360 / 27;
const YEAR_DAYS = 365.25;

/** Data the ephemeris must provide (computed server-side with the Krishnamurti ayanamsa). */
export interface KpBase {
  ayanamsaValue: number;
  positions: PlanetPosition[];
  /** Placidus cusps 1..12, sidereal longitudes. */
  cusps: number[];
  /** Snapshot for the ruling planets: the moment of judgement at the birth place. */
  now: { asOf: string; positions: PlanetPosition[]; ascendant: number; /** Weekday of the Hindu day (sunrise to sunrise), 0 = Sunday. */ weekday: number };
}

// ---------- the 249 subs ----------

export interface SubDivision {
  index: number; // 0..248
  nakshatraIndex: number;
  nakshatra: string;
  starLord: Planet;
  subLord: Planet;
  start: number; // sidereal longitude
  end: number;
  signIndex: number; // sign at the start of the sub
}

function subsOf(nakIndex: number): SubDivision[] {
  const starLord = NAKSHATRA_LORD[nakIndex];
  const startOrder = VIMSHOTTARI_ORDER.indexOf(starLord);
  const base = nakIndex * NAK_ARC;
  const out: SubDivision[] = [];
  let acc = 0;
  for (let k = 0; k < 9; k++) {
    const lord = VIMSHOTTARI_ORDER[(startOrder + k) % 9];
    const arc = (NAK_ARC * VIMSHOTTARI_YEARS[lord]) / 120;
    out.push({ index: 0, nakshatraIndex: nakIndex, nakshatra: NAKSHATRAS[nakIndex], starLord, subLord: lord, start: base + acc, end: base + acc + arc, signIndex: Math.floor((base + acc) / 30) % 12 });
    acc += arc;
  }
  return out;
}

/** Krishnamurti's table of 249 subs: 27 nakshatras × 9 subs, with the six subs that straddle a sign boundary split in two. */
export const SUB_TABLE: SubDivision[] = (() => {
  const all: SubDivision[] = [];
  for (let n = 0; n < 27; n++) {
    for (const s of subsOf(n)) {
      const startSign = Math.floor(s.start / 30 + 1e-9);
      const endSign = Math.floor((s.end - 1e-9) / 30);
      if (startSign !== endSign) {
        const cut = (startSign + 1) * 30;
        all.push({ ...s, end: cut });
        all.push({ ...s, start: cut, signIndex: endSign });
      } else all.push(s);
    }
  }
  return all.map((s, i) => ({ ...s, index: i }));
})();

/** Divide the arc [start, end) in Vimshottari proportion starting from `lord`, and return the division holding `l`. */
function divisionAt(l: number, start: number, end: number, lord: Planet): { lord: Planet; start: number; end: number } {
  const startOrder = VIMSHOTTARI_ORDER.indexOf(lord);
  const span = end - start;
  let acc = start;
  for (let k = 0; k < 9; k++) {
    const p = VIMSHOTTARI_ORDER[(startOrder + k) % 9];
    const arc = (span * VIMSHOTTARI_YEARS[p]) / 120;
    if (l < acc + arc || k === 8) return { lord: p, start: acc, end: acc + arc };
    acc += arc;
  }
  return { lord, start, end };
}

/** Sub lord, sub-sub lord and sookshma (fourth level) lord of a sidereal longitude. */
export function lordsAt(lon: number): { starLord: Planet; subLord: Planet; subSubLord: Planet; sookshmaLord: Planet; nakshatraIndex: number; subStart: number; subEnd: number } {
  const l = norm360(lon);
  const nak = Math.floor(l / NAK_ARC) % 27;
  const subs = subsOf(nak);
  const sub = subs.find((s) => l >= s.start && l < s.end) ?? subs[subs.length - 1];
  // Sub-sub: the sub divided again in Vimshottari proportion, starting from the sub lord; sookshma: the sub-sub divided once more.
  const subSub = divisionAt(l, sub.start, sub.end, sub.subLord);
  const sookshma = divisionAt(l, subSub.start, subSub.end, subSub.lord);
  return { starLord: NAKSHATRA_LORD[nak], subLord: sub.subLord, subSubLord: subSub.lord, sookshmaLord: sookshma.lord, nakshatraIndex: nak, subStart: sub.start, subEnd: sub.end };
}

// ---------- points ----------

export interface KpPoint {
  lon: number;
  signIndex: number;
  sign: Sign;
  degInSign: number;
  signLord: Planet;
  nakshatraIndex: number;
  nakshatra: string;
  starLord: Planet;
  subLord: Planet;
  subSubLord: Planet;
  sookshmaLord: Planet;
}

export function kpPoint(lon: number): KpPoint {
  const l = norm360(lon);
  const signIndex = Math.floor(l / 30) % 12;
  const { starLord, subLord, subSubLord, sookshmaLord, nakshatraIndex } = lordsAt(l);
  return { lon: l, signIndex, sign: SIGNS[signIndex], degInSign: l - signIndex * 30, signLord: SIGN_LORD[signIndex], nakshatraIndex, nakshatra: NAKSHATRAS[nakshatraIndex], starLord, subLord, subSubLord, sookshmaLord };
}

export interface KpCusp extends KpPoint {
  house: number; // 1..12
}

export interface KpPlanet extends KpPoint {
  planet: Planet;
  retrograde: boolean;
  /** Bhava occupied (Placidus: from this cusp to the next). */
  house: number;
  /** Houses whose cusp falls in a sign this planet rules. Nodes own nothing. */
  owns: number[];
}

/** House a longitude falls in, Placidus: house h runs from cusp h to cusp h+1. */
export function houseOf(lon: number, cusps: number[]): number {
  const l = norm360(lon);
  for (let h = 0; h < 12; h++) {
    const a = cusps[h];
    const b = cusps[(h + 1) % 12];
    const inside = a <= b ? l >= a && l < b : l >= a || l < b;
    if (inside) return h + 1;
  }
  return 1;
}

// ---------- significators ----------

export type SignificatorLevel = "A" | "B" | "C" | "D" | "E" | "F";

export interface Signification {
  house: number;
  /**
   * A: the planet's star lord occupies the house (strongest).
   * B: the planet itself occupies the house.
   * C: the planet's star lord owns the house.
   * D: the planet itself owns the house (weakest of the four Krishnamurti steps).
   * E/F: the sub lord's occupancy / ownership (the six-step table taught in the class notes).
   */
  level: SignificatorLevel;
  via?: Planet; // the star lord or sub lord that carries the link
}

export interface KpSignificators {
  planet: Planet;
  /** Houses at each level, in the order of the class-note table. */
  levels: Record<SignificatorLevel, number[]>;
  /** Union of the four Krishnamurti steps A-D. */
  houses: number[];
  /** Union including the sub-lord steps E-F. */
  housesSix: number[];
  all: Signification[];
  /** Planets a node stands in for (its sign lord and the planets sharing its sign). */
  agentFor?: Planet[];
}

const NODES: Planet[] = ["Rahu", "Ketu"];
export const NODES_KP = NODES;

function uniqSorted(xs: number[]): number[] {
  return Array.from(new Set(xs)).sort((a, b) => a - b);
}

export function computeSignificators(planets: KpPlanet[]): KpSignificators[] {
  const byName = new Map(planets.map((p) => [p.planet, p]));
  const occ = (p: Planet) => [byName.get(p)!.house];
  const own = (p: Planet) => byName.get(p)!.owns;

  // A node carries the results of its sign lord and of planets sharing its sign (Astro Secrets Part 1, "Rahu & Kethu").
  const agency = (p: KpPlanet): Planet[] => {
    if (!NODES.includes(p.planet)) return [];
    const withIt = planets.filter((q) => q.planet !== p.planet && !NODES.includes(q.planet) && q.signIndex === p.signIndex).map((q) => q.planet);
    return uniqSortedPlanets([p.signLord, ...withIt]);
  };

  return planets.map((p) => {
    const star = byName.get(p.starLord)!;
    const sub = byName.get(p.subLord)!;
    const agents = agency(p);
    const ownWithAgency = (q: KpPlanet): number[] => (NODES.includes(q.planet) ? agency(q).flatMap(own) : q.owns);
    const levels: Record<SignificatorLevel, number[]> = {
      A: uniqSorted(occ(star.planet)),
      B: uniqSorted(occ(p.planet)),
      C: uniqSorted(ownWithAgency(star)),
      D: uniqSorted(agents.length ? agents.flatMap(own) : p.owns),
      E: uniqSorted(occ(sub.planet)),
      F: uniqSorted(ownWithAgency(sub)),
    };
    const all: Signification[] = [];
    (Object.keys(levels) as SignificatorLevel[]).forEach((lv) => levels[lv].forEach((h) => all.push({ house: h, level: lv, via: lv === "A" || lv === "C" ? p.starLord : lv === "E" || lv === "F" ? p.subLord : undefined })));
    return {
      planet: p.planet,
      levels,
      houses: uniqSorted([...levels.A, ...levels.B, ...levels.C, ...levels.D]),
      housesSix: uniqSorted([...levels.A, ...levels.B, ...levels.C, ...levels.D, ...levels.E, ...levels.F]),
      all,
      agentFor: agents.length ? agents : undefined,
    };
  });
}

function uniqSortedPlanets(xs: Planet[]): Planet[] {
  return Array.from(new Set(xs));
}

/** House-wise view: the four (or six) columns of the class-note cusp significator table. */
export interface HouseSignificators {
  house: number;
  /** Planets in the star of the occupants. */
  inStarOfOccupants: Planet[];
  occupants: Planet[];
  /** Planets in the star of the owner. */
  inStarOfOwner: Planet[];
  owner: Planet;
  /** Six-step extras: planets in the sub of the occupants / of the owner. */
  inSubOfOccupants: Planet[];
  inSubOfOwner: Planet[];
}

export function houseSignificators(planets: KpPlanet[], cusps: KpCusp[]): HouseSignificators[] {
  return cusps.map((c) => {
    const occupants = planets.filter((p) => p.house === c.house).map((p) => p.planet);
    const owner = c.signLord;
    return {
      house: c.house,
      inStarOfOccupants: planets.filter((p) => occupants.includes(p.starLord)).map((p) => p.planet),
      occupants,
      inStarOfOwner: planets.filter((p) => p.starLord === owner).map((p) => p.planet),
      owner,
      inSubOfOccupants: planets.filter((p) => occupants.includes(p.subLord)).map((p) => p.planet),
      inSubOfOwner: planets.filter((p) => p.subLord === owner).map((p) => p.planet),
    };
  });
}

// ---------- badhaka, maraka ----------

/** Badhaka house from the lagna sign: 11th for a movable lagna, 9th for fixed, 7th for dual. Marakas are the 2nd and 7th. */
export function badhakaHouse(lagnaSign: number): number {
  const q = SIGN_QUALITY[lagnaSign];
  return q === "Movable" ? 11 : q === "Fixed" ? 9 : 7;
}
export const MARAKA_HOUSES = [2, 7];

// ---------- Vimshottari ----------

export interface KpPeriod {
  level: "dasa" | "bhukti" | "antara";
  lord: Planet;
  dasaLord: Planet;
  bhuktiLord?: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
}

export interface Vimshottari {
  balanceYears: number;
  dasas: KpPeriod[];
  /** Bhuktis of every dasa, in order. */
  bhuktis: KpPeriod[];
  /** Antaras of the current bhukti. */
  antaras: KpPeriod[];
  current: { dasa: KpPeriod; bhukti: KpPeriod; antara: KpPeriod };
}

export function vimshottari(moonLon: number, birthIso: string, asOfIso: string): Vimshottari {
  const birth = DateTime.fromISO(birthIso);
  const asOf = DateTime.fromISO(asOfIso);
  const age = (iso: DateTime) => iso.diff(birth, "days").days / YEAR_DAYS;
  const nak = Math.floor(norm360(moonLon) / NAK_ARC) % 27;
  const lord = NAKSHATRA_LORD[nak];
  const frac = (norm360(moonLon) - nak * NAK_ARC) / NAK_ARC;
  const balance = VIMSHOTTARI_YEARS[lord] * (1 - frac);
  const order = VIMSHOTTARI_ORDER;
  const idx = order.indexOf(lord);

  const mk = (level: KpPeriod["level"], l: Planet, s: DateTime, e: DateTime, dasaLord: Planet, bhuktiLord?: Planet): KpPeriod => ({
    level,
    lord: l,
    dasaLord,
    bhuktiLord,
    start: s.toISO()!,
    end: e.toISO()!,
    ageStart: age(s),
    ageEnd: age(e),
    current: asOf >= s && asOf < e,
  });

  const dasas: KpPeriod[] = [];
  const bhuktis: KpPeriod[] = [];
  let t = birth;
  // First dasa runs from before birth so the bhuktis are prorated the same way as the balance.
  const firstStart = birth.minus({ days: (VIMSHOTTARI_YEARS[lord] - balance) * YEAR_DAYS });
  for (let i = 0; i < 9; i++) {
    const dl = order[(idx + i) % 9];
    const s = i === 0 ? firstStart : t;
    const e = s.plus({ days: VIMSHOTTARI_YEARS[dl] * YEAR_DAYS });
    dasas.push(mk("dasa", dl, i === 0 ? birth : s, e, dl));
    let bt = s;
    for (let j = 0; j < 9; j++) {
      const bl = order[(order.indexOf(dl) + j) % 9];
      const be = bt.plus({ days: (VIMSHOTTARI_YEARS[dl] * VIMSHOTTARI_YEARS[bl] * YEAR_DAYS) / 120 });
      if (be > birth) bhuktis.push(mk("bhukti", bl, bt < birth ? birth : bt, be, dl, bl));
      bt = be;
    }
    t = e;
  }
  const dasa = dasas.find((d) => d.current) ?? dasas[dasas.length - 1];
  const bhukti = bhuktis.find((b) => b.current) ?? bhuktis[bhuktis.length - 1];
  const antaras = antarasOf(bhukti, birth, asOf);
  const antara = antaras.find((a) => a.current) ?? antaras[0];
  return { balanceYears: balance, dasas, bhuktis, antaras, current: { dasa, bhukti, antara } };
}

/** Antaras (sub-periods) of a bhukti, Vimshottari proportion starting from the bhukti lord. */
export function antarasOf(bhukti: KpPeriod, birth: DateTime, asOf: DateTime): KpPeriod[] {
  const out: KpPeriod[] = [];
  const bl = bhukti.bhuktiLord ?? bhukti.lord;
  const dl = bhukti.dasaLord;
  // Reconstruct the full bhukti span (the first bhukti may have been clipped at birth).
  const fullDays = (VIMSHOTTARI_YEARS[dl] * VIMSHOTTARI_YEARS[bl] * YEAR_DAYS) / 120;
  const end = DateTime.fromISO(bhukti.end);
  let t = end.minus({ days: fullDays });
  const idx = VIMSHOTTARI_ORDER.indexOf(bl);
  for (let k = 0; k < 9; k++) {
    const al = VIMSHOTTARI_ORDER[(idx + k) % 9];
    const e = t.plus({ days: (fullDays * VIMSHOTTARI_YEARS[al]) / 120 });
    if (e > birth) {
      const s = t < birth ? birth : t;
      out.push({ level: "antara", lord: al, dasaLord: dl, bhuktiLord: bl, start: s.toISO()!, end: e.toISO()!, ageStart: s.diff(birth, "days").days / YEAR_DAYS, ageEnd: e.diff(birth, "days").days / YEAR_DAYS, current: asOf >= s && asOf < e });
    }
    t = e;
  }
  return out;
}

// ---------- joint periods ----------

export interface JointPeriod {
  dasaLord: Planet;
  bhuktiLord: Planet;
  antaraLord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  /** Which of the wanted houses each lord signifies. */
  hits: { dasa: number[]; bhukti: number[]; antara: number[] };
  current: boolean;
  past: boolean;
}

/**
 * Windows in which the dasa, bhukti and antara lords all signify at least one of the wanted houses:
 * the "conjoined period of the significators" in which KP expects the matter to fructify.
 */
export function jointPeriods(v: Vimshottari, sig: Map<Planet, number[]>, houses: number[], birthIso: string, asOfIso: string, yearsAhead = 30): JointPeriod[] {
  const birth = DateTime.fromISO(birthIso);
  const asOf = DateTime.fromISO(asOfIso);
  const limit = asOf.plus({ days: yearsAhead * YEAR_DAYS });
  const hit = (p: Planet) => (sig.get(p) ?? []).filter((h) => houses.includes(h));
  const out: JointPeriod[] = [];
  for (const b of v.bhuktis) {
    if (DateTime.fromISO(b.end) < birth || DateTime.fromISO(b.start) > limit) continue;
    const hd = hit(b.dasaLord);
    const hb = hit(b.lord);
    if (!hd.length || !hb.length) continue;
    for (const a of antarasOf(b, birth, asOf)) {
      const ha = hit(a.lord);
      if (!ha.length) continue;
      if (DateTime.fromISO(a.start) > limit) continue;
      out.push({ dasaLord: b.dasaLord, bhuktiLord: b.lord, antaraLord: a.lord, start: a.start, end: a.end, ageStart: a.ageStart, ageEnd: a.ageEnd, hits: { dasa: hd, bhukti: hb, antara: ha }, current: a.current, past: DateTime.fromISO(a.end) < asOf });
    }
  }
  return out;
}

// ---------- ruling planets ----------

export interface RulingPlanets {
  asOf: string;
  dayLord: Planet;
  lagna: KpPoint;
  moon: KpPoint;
  /** In KP order: lagna star lord, lagna sign lord, Moon star lord, Moon sign lord, day lord; sub lords added as the finer grade. */
  list: Array<{ role: string; planet: Planet }>;
  /** Distinct planets, strongest first, with how many times each appears. */
  planets: Array<{ planet: Planet; count: number }>;
}

const DAY_LORD: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Sunday..Saturday

export function rulingPlanets(now: KpBase["now"]): RulingPlanets {
  // The Hindu day runs sunrise to sunrise; the ephemeris supplies the weekday of the last sunrise at the place.
  const dayLord = DAY_LORD[now.weekday];
  const lagna = kpPoint(now.ascendant);
  const moonPos = now.positions.find((p) => p.planet === "Moon")!;
  const moon = kpPoint(moonPos.lon);
  const list = [
    { role: "Lagna star lord", planet: lagna.starLord },
    { role: "Lagna sign lord", planet: lagna.signLord },
    { role: "Moon star lord", planet: moon.starLord },
    { role: "Moon sign lord", planet: moon.signLord },
    { role: "Day lord", planet: dayLord },
    { role: "Lagna sub lord", planet: lagna.subLord },
    { role: "Moon sub lord", planet: moon.subLord },
  ];
  const counts = new Map<Planet, number>();
  for (const l of list.slice(0, 5)) counts.set(l.planet, (counts.get(l.planet) ?? 0) + 1);
  // A node in the sign of a ruling planet joins the ruling planets (KP convention).
  const extras: Planet[] = [];
  for (const node of NODES) {
    const np = now.positions.find((p) => p.planet === node)!;
    if (counts.has(SIGN_LORD[np.signIndex]) && !counts.has(node)) extras.push(node);
  }
  const planets = Array.from(counts.entries())
    .map(([planet, count]) => ({ planet, count }))
    .sort((a, b) => b.count - a.count);
  for (const e of extras) planets.push({ planet: e, count: 0 });
  return { asOf: now.asOf, dayLord, lagna, moon, list, planets };
}

// ---------- the whole result ----------

export interface KpResult {
  ayanamsaValue: number;
  cusps: KpCusp[];
  planets: KpPlanet[];
  significators: KpSignificators[];
  houseSignificators: HouseSignificators[];
  badhaka: number;
  marakas: number[];
  lagnaQuality: (typeof SIGN_QUALITY)[number];
  vimshottari: Vimshottari;
  ruling: RulingPlanets;
  findings: KpFinding[];
  ageYears: number;
}

export function computeKp(base: KpBase, birthIso: string, asOfIso: string, sixStep = false): KpResult {
  const cusps: KpCusp[] = base.cusps.map((lon, i) => ({ ...kpPoint(lon), house: i + 1 }));
  const owners = cusps.map((c) => c.signLord);
  const planets: KpPlanet[] = base.positions.map((p) => ({
    ...kpPoint(p.lon),
    planet: p.planet,
    retrograde: p.retrograde,
    house: houseOf(p.lon, base.cusps),
    owns: NODES.includes(p.planet) ? [] : owners.map((o, i) => (o === p.planet ? i + 1 : 0)).filter(Boolean),
  }));
  const significators = computeSignificators(planets);
  const hs = houseSignificators(planets, cusps);
  const lagnaSign = cusps[0].signIndex;
  const moon = base.positions.find((p) => p.planet === "Moon")!;
  const vim = vimshottari(moon.lon, birthIso, asOfIso);
  const ruling = rulingPlanets(base.now);
  const ageYears = DateTime.fromISO(asOfIso).diff(DateTime.fromISO(birthIso), "days").days / YEAR_DAYS;
  const partial: Omit<KpResult, "findings"> = {
    ayanamsaValue: base.ayanamsaValue,
    cusps,
    planets,
    significators,
    houseSignificators: hs,
    badhaka: badhakaHouse(lagnaSign),
    marakas: MARAKA_HOUSES,
    lagnaQuality: SIGN_QUALITY[lagnaSign],
    vimshottari: vim,
    ruling,
    ageYears,
  };
  const findings = evaluateKp(partial, sixStep);
  return { ...partial, findings };
}

/** Houses a planet signifies, four-step by default. */
export function signifiedBy(r: Pick<KpResult, "significators">, planet: Planet, sixStep = false): number[] {
  const s = r.significators.find((x) => x.planet === planet);
  return s ? (sixStep ? s.housesSix : s.houses) : [];
}

export function significatorMap(r: Pick<KpResult, "significators">, sixStep = false): Map<Planet, number[]> {
  return new Map(r.significators.map((s) => [s.planet, sixStep ? s.housesSix : s.houses]));
}
