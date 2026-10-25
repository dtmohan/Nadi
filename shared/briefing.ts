/**
 * The Overview's briefing (phase 1 of "Overview as a briefing"): what to know before reading, what runs
 * now and within eighteen months, and the planets in play.
 *
 * Display only. Each clock is read by its own system's module and shown side by side under its own
 * label; nothing here weighs one system against another, and no line here adds a rule. The area tags
 * follow tagsFor, an app convention with no text behind it (provisional), and every tag says which of
 * its four clauses placed it. Gating stays with the sources: held-back areas get no tags, and the
 * transit timeline is redacted for a minor before it is read.
 */
import { DateTime } from "luxon";
import { SIGNS, type Planet, type PlanetPosition } from "./astro";
import type { ChartResult } from "./schema";
import type { LifeArea } from "./rules";
import type { AgreementInput } from "./agreement";
import { heldAreasAt, lifeAsOf, redactSensitive } from "./life-stage";
import { DEFAULT_ASPECT_FLOOR } from "./parashari";
import { dasaCombinations, timingNow, levelName, type DasaCombinations, type TimingChange, type TimingNow } from "./timing-now";
import { computeSudarshana } from "./sudarshana";
import { computeAvTimeline, type AvTimeline, type AvTransitRow } from "./av-transit";
import { topicPeriods, type PeriodTopic } from "./parashari-topic-periods";
import { readTransits, type TransitReading } from "./timing";
import { computeAlp, type AlpResult } from "./alp";
import { ALP_HOUSE_THEMES } from "./rules-alp";
import { computeChalit, type ChalitResult } from "./chalit";
import { isConditional, nearestChangeText, KP_CONDITIONAL_SECONDS, VIMSHOTTARI_YEARS } from "./kp";
import { VARGA_BY_KEY, type VargaKey } from "./vargas";
import type { LagnaWindows } from "./time-windows";
import { CHARA_KARAKA_INFO } from "./jaimini";
import { saturnPracticeName, saturnShortName } from "./gochara";
import { AREA_HOUSES, AREA_ORDER, AREA_TAG_KARAKA, houseAreas } from "./life-areas";
import { ALP_HOUSE_GLOSS, listJoin, ordH, thePlanet } from "./house-gloss";

// ---- Shapes --------------------------------------------------------------------------------------

export type BriefSystem = "Parashari" | "Transit" | "Jaimini" | "ALP" | "Nadi";

/** Where a line opens: a tab, optionally one of its chapters and an element to scroll to (a CSS selector). */
export interface BriefLink {
  tab: "parashari" | "kp" | "jaimini" | "alp" | "bnn" | "rectify";
  chapter?: string;
  target?: string;
  /** A fold to open on arrival (its Expander id), when the line summarises what the fold holds. */
  open?: string;
}

export interface BeforeNote {
  id: "lagna-edge" | "kp-cusps" | "bhava-shift";
  title: string;
  text: string;
  /** Practitioner detail; undefined in the plain view. */
  detail?: string;
  action: string;
  link: BriefLink;
}

export interface AreaTag {
  area: LifeArea;
  clause: 1 | 2 | 3 | 4;
  /** Placed by clause 2 or 3: shown as a proposed tag. */
  proposed: boolean;
  /** What placed it, for the practitioner view: "the Parashari topic periods", "rules the 7th". */
  why: string;
}

export interface BriefRow {
  id: string;
  group: "now" | "next";
  start: string;
  end?: string;
  /** The dates as shown: "Apr 2021 – Apr 2028", "19 Oct – 15 Dec 2026", "31 Oct 2026". */
  when: string;
  system: BriefSystem;
  what: string;
  lean?: string;
  line?: string;
  /** Practitioner detail; undefined in the plain view. */
  detail?: string;
  tags: AreaTag[];
  link: BriefLink;
  /** The running dasa row carries its lord, so the Overview can fold the period's combinations under it. */
  dasaLord?: Planet;
}

export interface PlanetBrief {
  planet: Planet;
  /** Why it is in play: "Dasa lord, Apr 2021 – Apr 2028", "In transit through your 6th". */
  roles: string[];
  place: string;
  states: string[];
  rules: string;
  /** One line per system that gives the planet a role, labelled. */
  systems: { system: string; text: string }[];
}

export interface Briefing {
  before: BeforeNote[];
  now: BriefRow[];
  next: BriefRow[];
  planets: PlanetBrief[];
  horizonMonths: number;
  /** At a recorded date of passing the rows read "at passing", and nothing comes next. */
  past: boolean;
  /** The running dasa's combinations and how its sub-periods carry them, folded under the dasa row. */
  dasaCombos?: DasaCombinations;
  /** The Vimshottari sequence has run its course (very long lives); no period rows then. */
  pastEnd: boolean;
}

export const BRIEF_HORIZON_MONTHS = 18;

// ---- Small helpers -------------------------------------------------------------------------------

const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const num = (n: number) => NUM[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const norm360 = (x: number) => ((x % 360) + 360) % 360;
const dm = (deg: number) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}'`;
};
const dms = (deg: number) => {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.floor((mf - m) * 60);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
};
const ordList = (hs: number[]) => listJoin([...hs].sort((a, b) => a - b).map(ordH));

function fmt(iso: string, zone: string, f: string): string {
  const d = DateTime.fromISO(iso, { zone });
  return d.isValid ? d.toFormat(f) : iso.slice(0, 10);
}
/** "Apr 2021 – Apr 2028". */
const spanM = (a: string, b: string, z: string) => `${fmt(a, z, "LLL yyyy")} – ${fmt(b, z, "LLL yyyy")}`;
/** "19 Oct – 15 Dec 2026", or with both years when they differ. */
function spanD(a: string, b: string, z: string): string {
  const sameYear = fmt(a, z, "yyyy") === fmt(b, z, "yyyy");
  return `${fmt(a, z, sameYear ? "d LLL" : "d LLL yyyy")} – ${fmt(b, z, "d LLL yyyy")}`;
}
const day = (a: string, z: string) => fmt(a, z, "d LLL yyyy");

/** The sign a planet or the lagna would rule-count from: the lord of each house from the lagna sign. */
const SIGN_LORD: Planet[] = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];

/** The houses a planet rules, counted from the lagna sign; none for the nodes. */
export function housesRuled(planet: Planet, lagnaSign: number): number[] {
  const out: number[] = [];
  for (let h = 1; h <= 12; h++) if (SIGN_LORD[(lagnaSign + h - 1) % 12] === planet) out.push(h);
  return out;
}

// ---- The tagging rule ----------------------------------------------------------------------------

export const TAG_CAP = 3;

/**
 * The life areas an item touches (provisional; an app convention with no text behind it), checked in
 * this order: 1. the app already attaches the area's topic to the item; 2. the period lord is the
 * area's signature karaka; 3. the period lord rules one of the area's houses; 4. a transiting point
 * stands in one of the area's houses, counted from the lagna. Each area is tagged once, by the first
 * clause that places it; held-back areas get no tag; at most three tags, the first three placed, shown
 * by clause and then in the fixed area order.
 */
export function tagsFor(
  item: { attached?: { area: LifeArea; why: string }[]; lord?: Planet; house?: number },
  lagnaSign: number,
  held: (area: LifeArea) => boolean = () => false,
): AreaTag[] {
  const out: AreaTag[] = [];
  const add = (area: LifeArea, clause: AreaTag["clause"], why: string) => {
    if (held(area) || out.some((t) => t.area === area)) return;
    out.push({ area, clause, proposed: clause === 2 || clause === 3, why });
  };
  for (const a of item.attached ?? []) add(a.area, 1, a.why);
  if (item.lord) {
    const k = AREA_TAG_KARAKA[item.lord];
    if (k) add(k.area, 2, k.as);
    for (const h of housesRuled(item.lord, lagnaSign))
      for (const area of houseAreas(h)) add(area, 3, `rules the ${ordH(h)}`);
  }
  if (item.house) for (const area of houseAreas(item.house)) add(area, 4, `stands in the ${ordH(item.house)}`);
  // The cap keeps the first three placed, so a clause-1 list keeps its source's own ranking; the kept
  // tags are then shown by clause and in the fixed area order.
  return out
    .slice(0, TAG_CAP)
    .sort((x, y) => x.clause - y.clause || AREA_ORDER.indexOf(x.area) - AREA_ORDER.indexOf(y.area));
}

/** The Parashari topic periods that carry a running dasa lord, as clause-1 attachments. */
function topicAttachments(
  topics: ReturnType<typeof topicPeriods>,
  lord: Planet,
): { area: LifeArea; why: string }[] {
  const AREA: Record<Exclude<PeriodTopic, "family">, LifeArea> = { career: "career", wealth: "wealth", health: "health" };
  const out: { area: LifeArea; why: string }[] = [];
  const why = "the Parashari topic periods";
  for (const t of topics) {
    if (t.held) continue;
    const inPeriods = t.periods.filter((p) => p.lord === lord && p.current);
    if (t.topic === "family") {
      // Family splits by the house of its statements: the 5th for children, the 7th for marriage.
      const hs = new Set<number>();
      for (const p of inPeriods) for (const h of p.houses) hs.add(h);
      if (t.pair && t.pair.periods.some((p) => p.lord === lord && p.current)) hs.add(t.pair.base);
      if (hs.has(5)) out.push({ area: "children", why });
      if (hs.has(7)) out.push({ area: "marriage", why });
      continue;
    }
    const carried =
      inPeriods.length > 0 ||
      (t.fromHouse?.periods ?? []).some((p) => p.lord === lord && p.current) ||
      (t.pair?.periods ?? []).some((p) => p.lord === lord && p.current);
    if (carried) out.push({ area: AREA[t.topic], why });
  }
  return out;
}

// ---- Before you read -----------------------------------------------------------------------------

/** The rasi lagna is this close to a sign boundary, in minutes of clock time (the app's convention). */
export const LAGNA_EDGE_MINUTES = 5;

export interface LagnaEdge {
  /** Clock minutes to the change, and whether it lies after the recorded time. */
  minutes: number;
  later: boolean;
  sign: number;
  signThen: number;
  degInSign: number;
  /** Arc from the lagna to the boundary, in minutes of arc. */
  arcMin: number;
  d9: number;
  d9Then: number;
  /** Divisional lagnas that change at the same moment, and those that hold. */
  changing: VargaKey[];
  holding: VargaKey[];
}

/** The rasi lagna within LAGNA_EDGE_MINUTES of a sign change, from the server's lagna windows; null otherwise. */
export function lagnaEdge(lagnaLon: number, windows: LagnaWindows | undefined, limit = LAGNA_EDGE_MINUTES): LagnaEdge | null {
  const w = windows?.D1;
  if (!w) return null;
  const later = w.after <= w.before;
  const minutes = later ? w.after : w.before;
  if (!(minutes <= limit) || (later ? w.afterCapped : w.beforeCapped)) return null;
  const lon = norm360(lagnaLon);
  const sign = Math.floor(lon / 30);
  const degInSign = lon - sign * 30;
  const signThen = (sign + (later ? 1 : 11)) % 12;
  const edgeLon = later ? (sign + 1) * 30 : sign * 30;
  const d9of = (x: number) => {
    const l = norm360(x);
    const s = Math.floor(l / 30);
    return VARGA_BY_KEY.D9.signOf(s, l - s * 30);
  };
  const changing: VargaKey[] = [];
  const holding: VargaKey[] = [];
  for (const [k, v] of Object.entries(windows ?? {}) as [VargaKey, { before: number; after: number }][]) {
    if (k === "D1" || !v) continue;
    ((later ? v.after : v.before) <= minutes + 0.05 ? changing : holding).push(k);
  }
  return {
    minutes,
    later,
    sign,
    signThen,
    degInSign,
    arcMin: Math.max(1, Math.round((later ? 30 - degInSign : degInSign) * 60)),
    d9: d9of(lon),
    d9Then: d9of(later ? edgeLon + 1e-6 : edgeLon - 1e-6),
    changing,
    holding,
  };
}

function lagnaEdgeNote(result: ChartResult, plain: boolean): BeforeNote | null {
  const e = lagnaEdge(result.jaimini.lagna.lon, result.lagnaWindows as LagnaWindows | undefined);
  if (!e) return null;
  const time = result.chart.birthTime;
  const mins = e.minutes < 1 ? "less than a minute" : `about ${e.minutes.toFixed(1)} minutes`;
  // How far the dasa dates move: the Moon's motion over those minutes, at the rate of its birth star's lord.
  const moon = result.positions.find((p) => p.planet === "Moon");
  let dasa = "";
  if (moon) {
    const years = VIMSHOTTARI_YEARS[moon.nakshatraLord as Planet] ?? 0;
    const days = ((Math.abs(moon.speed) * e.minutes) / 1440) * (years / (40 / 3)) * 365.25;
    dasa = days < 1 ? "the dasa dates by less than a day" : `the dasa dates by about ${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`;
  }
  const text =
    `Your rising degree is ${dm(e.degInSign)} ${SIGNS[e.sign]}, ${e.arcMin}' from ${SIGNS[e.signThen]}. ` +
    `A birth ${mins} ${e.later ? "later" : "earlier"} than ${time} would make ${SIGNS[e.signThen]} the rising sign and move the navamsa lagna from ${SIGNS[e.d9]} to ${SIGNS[e.d9Then]}. ` +
    `House-based readings would change; planet signs would not, and the change would move ${dasa || "the dasa dates very little"}.`;
  const perDeg = e.minutes / (e.arcMin / 60);
  const detail = plain
    ? undefined
    : `Lagna ${dms(e.degInSign)} ${SIGNS[e.sign]}; about ${perDeg.toFixed(1)} minutes of clock time per degree here. ` +
      `D9 lagna ${SIGNS[e.d9]}; ${SIGNS[e.d9Then]} if ${SIGNS[e.signThen]} rises. ` +
      (e.changing.length ? `Changing at the same moment: ${e.changing.join(", ")}. ` : "") +
      (e.holding.length ? `Holding: ${e.holding.join(", ")}. ` : "") +
      `The ${num(LAGNA_EDGE_MINUTES)}-minute trigger is the app's convention (provisional).`;
  return {
    id: "lagna-edge",
    title: "Birth time close to a sign change",
    text,
    detail,
    action: "Check with Rectify",
    link: { tab: "rectify" },
  };
}

function kpNote(input: AgreementInput, result: ChartResult, plain: boolean): BeforeNote | null {
  const cusps = (input.kp.stability?.cusps ?? result.kp?.stability?.cusps ?? [])
    .filter((p) => p.house !== undefined && isConditional(p))
    .sort((a, b) => a.house! - b.house!);
  if (!cusps.length) return null;
  const n = cusps.length;
  const limit = KP_CONDITIONAL_SECONDS / 60;
  const within = `${limit === 2 ? "two" : limit} minutes`;
  const ords = listJoin(cusps.map((p) => ordH(p.house!)));
  return {
    id: "kp-cusps",
    title: `${cap(num(n))} KP cusp${n === 1 ? " is" : "s are"} time-sensitive`,
    text: `The ${ords} ${n === 1 ? "cusp changes" : "cusps change"} sub lord within ${within} of ${result.chart.birthTime}, so KP lines for ${n === 1 ? "that house are" : "those houses are"} provisional.`,
    detail: plain
      ? undefined
      : `${cap(cusps.map((p) => `the ${ordH(p.house!)} (sub lord ${p.subLord}) ${nearestChangeText(p)}`).join("; "))}. ` +
        `The books make a correct birth time the first condition of a KP reading (Astro Secrets & KP Part 1 pp. 172-173; Part 3 p. 12); the ${limit === 2 ? "two" : limit}-minute margin is the app's convention (provisional).`,
    action: "Open KP",
    link: { tab: "kp", chapter: "brief" },
  };
}

function bhavaNote(result: ChartResult, chalit: ChalitResult | undefined, plain: boolean): BeforeNote | null {
  if (!chalit) return null;
  const moved = chalit.comparison.filter((c) => c.agree && !c.unchanged);
  const junction = chalit.comparison.filter((c) => c.sripati.atSandhi || c.equal.atSandhi);
  if (!moved.length && !junction.length) return null;
  const sentences: string[] = [];
  // One clause per move, grouped by the houses it runs between: "Mars and Ketu from the 3rd to the 2nd".
  const groups = new Map<string, { from: number; to: number; names: string[] }>();
  for (const c of moved) {
    const k = `${c.rasiHouse}-${c.sripati.chalitHouse}`;
    const g = groups.get(k) ?? { from: c.rasiHouse, to: c.sripati.chalitHouse, names: [] };
    g.names.push(thePlanet(c.planet));
    groups.set(k, g);
  }
  const moves: string[] = [];
  groups.forEach((g) => {
    const verb = moves.length ? "" : g.names.length === 1 ? " moves" : " move";
    moves.push(`${listJoin(g.names)}${verb} from ${moves.length ? "the" : "your"} ${ordH(g.from)} to the ${ordH(g.to)}`);
  });
  if (moves.length) sentences.push(`By bhava, in both constructions, ${moves.join("; ")}.`);
  if (junction.length) {
    const byPair = new Map<string, string[]>();
    for (const c of junction) {
      const m = c.sripati.atSandhi ? c.sripati : c.equal;
      const pair = `${ordH(m.sandhiBetween[0])}/${ordH(m.sandhiBetween[1])}`;
      byPair.set(pair, [...(byPair.get(pair) ?? []), thePlanet(c.planet)]);
    }
    const parts: string[] = [];
    byPair.forEach((names, pair) =>
      parts.push(parts.length ? `${listJoin(names)} on the ${pair}` : `${cap(listJoin(names))} ${names.length === 1 ? "sits" : "sit"} on the ${pair} junction`),
    );
    sentences.push(`${listJoin(parts)}; Phaladeepika reads a planet on a junction as giving little in its own periods.`);
  }
  const method = result.chart.parashariHouseMethod;
  sentences.push(
    method === "sripati" || method === "equal"
      ? `This chart is set to read houses by the ${method === "sripati" ? "Sripati" : "equal-house"} bhava.`
      : "The app reads houses by sign and notes the bhava house beside each reading.",
  );
  const n = moved.length || junction.length;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return {
    id: "bhava-shift",
    title: moved.length
      ? `${cap(num(n))} planet${n === 1 ? " changes" : "s change"} house by bhava`
      : `${cap(num(n))} planet${n === 1 ? " sits" : "s sit"} on a house junction`,
    text: sentences.join(" "),
    detail: plain
      ? undefined
      : `Sripati and equal-house constructions (not Parashara; provisional). ` +
        (junction.length
          ? `${cap(junction.map((c) => `${thePlanet(c.planet)} keeps ${pct(c.sripati.effect)} (Sripati) and ${pct(c.equal.effect)} (equal) of its bhava's effect`).join("; "))}. Phaladeepika 15.13: a planet on the junction is ineffective in its dasa and bhukti, however strong.`
          : ""),
    action: "Open Parashari houses",
    link: {
      tab: "parashari",
      chapter: "houses",
      target: '[data-testid="toggle-working-parashari-chalit"]',
      open: "working-parashari-chalit",
    },
  };
}

// ---- Now and next --------------------------------------------------------------------------------

const AV_TARGET = '[data-testid="parashari-timing-transits"]';
const PERIOD_TARGET = '[data-testid="parashari-timing-periods"]';
const YEAR_TARGET = '[data-testid="parashari-timing-year"]';

/**
 * "Venus rules your 1st and 8th and is the karaka of marriage" (plain: "and stands for marriage"). A
 * yogakaraka rules an angle and a trine together (BPHS ch. 34).
 */
function lordLine(
  lord: Planet,
  lagnaSign: number,
  yogakaraka: boolean,
  plain: boolean,
  held: (a: LifeArea) => boolean,
): string {
  const hs = housesRuled(lord, lagnaSign);
  if (!hs.length) return `${cap(thePlanet(lord))} rules no house.`;
  // A karaka of an area held back for a minor is not named ("stands for marriage" at ten).
  const kk = AREA_TAG_KARAKA[lord];
  const k = kk && !held(kk.area) ? kk : undefined;
  const extra: string[] = [];
  if (plain) {
    if (k) extra.push(k.plain);
    const base = `${cap(thePlanet(lord))} rules your ${ordList(hs)}${extra.length ? ` and ${listJoin(extra)}` : ""}`;
    return yogakaraka
      ? `${base}; ruling an angle and a trine together, it is the planet Parashara counts as a giver of good results for your rising sign (a yogakaraka).`
      : `${base}.`;
  }
  if (yogakaraka) extra.push("is your yogakaraka, owning an angle and a trine");
  if (k) extra.push(`is ${k.as}`);
  return `${cap(thePlanet(lord))} rules your ${ordList(hs)}${extra.length ? ` and ${listJoin(extra)}` : ""}.`;
}

function transitLine(row: AvTransitRow | undefined, points: number, plain: boolean): string {
  const own = row ? `${row.ownRekhas} of 8 marks in ${row.planet}'s own Ashtakavarga; ` : "";
  return plain ? `${cap(own)}${points} points in all.` : `${cap(own)}${points} in the Sarvashtakavarga (BPHS ch. 66-72).`;
}

function avRowFor(av: AvTimeline, planet: "Saturn" | "Jupiter", start: string): AvTransitRow | undefined {
  return (planet === "Saturn" ? av.saturn : av.jupiter).find((r) => r.start === start);
}

/** Saturn's house from the Moon, named when regional practice names it. */
function saturnFromMoon(signIndex: number, moonSign: number, plain: boolean): string | undefined {
  const h = ((signIndex - moonSign + 12) % 12) + 1;
  const name = plain ? saturnShortName(h) : saturnPracticeName(h);
  if (!name) return plain ? undefined : `${ordH(h)} from the Moon.`;
  return plain ? `Practice calls this passage ${name}.` : `${ordH(h)} from the Moon: ${name}; the names are regional practice (provisional).`;
}

const NADI_WINDOW_WEIGHT = 2;

export function briefingFor(result: ChartResult, input: AgreementInput, horizonMonths = BRIEF_HORIZON_MONTHS): Briefing {
  const { chart, positions } = result;
  const zone = chart.timezone || "UTC";
  const plain = input.plain;
  const par = input.parashari;
  const asOf = result.now.asOf;
  const lifeAt = lifeAsOf(chart, asOf);
  const past = lifeAt !== asOf;
  const withheld = input.withheld;
  const lagnaSign = par.lagna.signIndex;
  const held: (a: LifeArea) => boolean = heldAreasAt(result.utc, lifeAt);
  const horizonEnd = DateTime.fromISO(lifeAt).plus({ months: horizonMonths }).toISO()!;
  const moonSign = positions.find((p) => p.planet === "Moon")?.signIndex ?? 0;
  const yk = (p: Planet) => par.natures.some((n) => n.planet === p && n.functional === "yogakaraka");

  const chalit = result.shadbala ? computeChalit(positions, result.shadbala.asc, result.shadbala.mc) : undefined;

  // Before you read.
  const before = [lagnaEdgeNote(result, plain), kpNote(input, result, plain), bhavaNote(result, chalit, plain)].filter(
    (n): n is BeforeNote => n !== null,
  );

  // The Parashari clocks, read as the Timing chapter reads them.
  const sudarshana = computeSudarshana(positions, lagnaSign, result.utc, lifeAt, par.ashtakavarga, par.shadbala, DEFAULT_ASPECT_FLOOR);
  const avAll = computeAvTimeline(par.ashtakavarga, lagnaSign, result.transits, result.saturnNakshatras, result.utc, lifeAt);
  const av = withheld ? redactSensitive(avAll) : avAll;
  const tn: TimingNow = timingNow({ dasaReadings: par.dasaReadings, dashas: par.dashas, sudarshana, av, asOfIso: lifeAt, past });
  const topics = topicPeriods(par, { birthIso: result.utc, asOfIso: lifeAt, deceased: past });

  const now: BriefRow[] = [];
  const next: BriefRow[] = [];
  const periodLink: BriefLink = { tab: "parashari", chapter: "timing", target: PERIOD_TARGET };

  if (tn.dasa) {
    const d = tn.dasa;
    const lean = par.dasaReadings.find((x) => x.current)?.lean;
    now.push({
      id: "pa-dasa",
      group: "now",
      start: d.start,
      end: d.end,
      when: spanM(d.start, d.end, zone),
      system: "Parashari",
      what: `${d.lord} ${levelName("dasa", plain)}`,
      lean: d.tone,
      line: lean ? `The app's lines for this period run ${num(lean.favour)} favourable to ${num(lean.against)} trying.` : undefined,
      detail: plain || !lean ? undefined : `Lean ${lean.step}: ${lean.favour} for, ${lean.against} against (the app's count, provisional).`,
      tags: tagsFor({ attached: topicAttachments(topics, d.lord), lord: d.lord }, lagnaSign, held),
      link: periodLink,
      dasaLord: d.lord,
    });
  }
  for (const [key, p] of [["antar", tn.antar], ["pratyantar", tn.pratyantar]] as const) {
    if (!p) continue;
    now.push({
      id: `pa-${key}`,
      group: "now",
      start: p.start,
      end: p.end,
      when: spanD(p.start, p.end, zone),
      system: "Parashari",
      what: `${p.lord} ${levelName(key, plain)}`,
      lean: p.tone,
      line: lordLine(p.lord, lagnaSign, yk(p.lord), plain, held),
      tags: tagsFor({ lord: p.lord }, lagnaSign, held),
      link: periodLink,
    });
  }
  if (tn.year) {
    const y = tn.year;
    now.push({
      id: "pa-year",
      group: "now",
      start: y.start,
      end: y.end,
      when: spanD(y.start, y.end, zone),
      system: "Parashari",
      what: plain ? `The ${ordH(y.house)} house takes ${past ? "that" : "this"} year of life` : `Sudarshana year-lagna in the ${ordH(y.house)} bhava`,
      lean: y.tone,
      line: plain ? `${cap(num(y.plus))} placements for it, ${num(y.minus)} against.` : `Tally +${y.plus} −${y.minus} (BPHS ch. 74).`,
      tags: tagsFor({ house: y.house }, lagnaSign, held),
      link: { tab: "parashari", chapter: "timing", target: YEAR_TARGET },
    });
  }
  for (const t of [tn.saturn, tn.jupiter]) {
    if (!t) continue;
    const row = avRowFor(av, t.planet, t.start);
    const moonNote = t.planet === "Saturn" ? saturnFromMoon(t.signIndex, moonSign, plain) : plain ? undefined : `${ordH(((t.signIndex - moonSign + 12) % 12) + 1)} from the Moon.`;
    now.push({
      id: `tr-${t.planet.toLowerCase()}`,
      group: "now",
      start: t.start,
      end: t.end,
      when: spanM(t.start, t.end, zone),
      system: "Transit",
      what: `${t.planet} in ${SIGNS[t.signIndex]}, your ${ordH(t.house)}`,
      lean: t.tone,
      line: plain ? [transitLine(row, t.points, true), moonNote].filter(Boolean).join(" ") : transitLine(row, t.points, false),
      detail: plain ? undefined : moonNote,
      tags: tagsFor({ house: t.house }, lagnaSign, held),
      link: { tab: "parashari", chapter: "timing", target: AV_TARGET },
    });
  }
  for (const c of tn.next) next.push(changeRow(c));

  function changeRow(c: TimingChange): BriefRow {
    const base = { group: "next" as const, start: c.date, when: day(c.date, zone), lean: c.tone };
    switch (c.kind) {
      case "spell":
      case "sub-period": {
        const level = c.kind === "spell" ? "pratyantar" : "antar";
        return {
          ...base,
          id: `next-${c.kind}`,
          system: "Parashari",
          what: `${c.lord} ${levelName(level, plain)} begins`,
          line: lordLine(c.lord!, lagnaSign, yk(c.lord!), plain, held),
          tags: tagsFor({ lord: c.lord }, lagnaSign, held),
          link: periodLink,
        };
      }
      case "period":
        return {
          ...base,
          id: "next-period",
          system: "Parashari",
          what: `${c.lord} ${levelName("dasa", plain)} begins, ${c.years} years`,
          line: c.gloss ? (plain ? c.gloss.plain : c.gloss.summary) : lordLine(c.lord!, lagnaSign, yk(c.lord!), plain, held),
          tags: tagsFor({ lord: c.lord }, lagnaSign, held),
          link: periodLink,
        };
      case "year":
        return {
          ...base,
          id: "next-year",
          system: "Parashari",
          what: plain ? `The ${ordH(c.house!)} house takes the next year of life` : `Year-lagna moves to the ${ordH(c.house!)} bhava`,
          tags: tagsFor({ house: c.house }, lagnaSign, held),
          link: { tab: "parashari", chapter: "timing", target: YEAR_TARGET },
        };
      default: {
        const t = c.transit!;
        const row = avRowFor(av, t.planet, t.start);
        const moonNote = t.planet === "Saturn" ? saturnFromMoon(t.signIndex, moonSign, plain) : undefined;
        return {
          ...base,
          id: `next-${t.planet.toLowerCase()}`,
          system: "Transit",
          what: `${t.planet} enters ${SIGNS[t.signIndex]}, your ${ordH(t.house)}`,
          line: plain ? [transitLine(row, t.points, true), moonNote].filter(Boolean).join(" ") : transitLine(row, t.points, false),
          detail: plain ? undefined : moonNote,
          tags: tagsFor({ house: t.house }, lagnaSign, held),
          link: { tab: "parashari", chapter: "timing", target: AV_TARGET },
        };
      }
    }
  }

  // Jaimini: the chara dasha sign running now, and the next sign if it begins within the horizon.
  const chara = result.jaimini.charaDasha.periods;
  const ci = chara.findIndex((p) => p.start <= lifeAt && lifeAt < p.end);
  if (ci >= 0) {
    const p = chara[ci];
    const notes = signNotes(result, p.sign, plain, held);
    const antar = p.antardashas.find((a) => a.start <= lifeAt && lifeAt < a.end);
    now.push({
      id: "jm-chara",
      group: "now",
      start: p.start,
      end: p.end,
      when: spanM(p.start, p.end, zone),
      system: "Jaimini",
      what: `Chara dasha of ${p.signName}`,
      line: `${notes ? `${notes} ` : ""}The app ties no topic to this period yet.`,
      detail: plain || !antar ? undefined : `${antar.signName} antardasha, ${spanD(antar.start, antar.end, zone)}.`,
      tags: [],
      link: { tab: "jaimini", chapter: "dashas" },
    });
    const n = chara[ci + 1];
    if (!past && n && n.start < horizonEnd)
      next.push({
        id: "next-chara",
        group: "next",
        start: n.start,
        when: day(n.start, zone),
        system: "Jaimini",
        what: `Chara dasha of ${n.signName} begins, ${n.years} years`,
        line: signNotes(result, n.sign, plain, held) || undefined,
        tags: [],
        link: { tab: "jaimini", chapter: "dashas" },
      });
  }

  // ALP: the progressed lagna's sign now, as the ALP tab reads it.
  const alp: AlpResult = computeAlp(positions, result.jaimini.lagna.lon, result.utc, lifeAt, undefined, withheld);
  {
    const sp = alp.signPeriods.find((s) => s.start <= lifeAt && lifeAt < s.end);
    const nakP = alp.placements.find((p) => p.role === "Lord of the ALP nakshatra");
    const attached = nakP ? houseAreas(nakP.houseFromAlp).map((area) => ({ area, why: `the ALP reading (the ${ordH(nakP.houseFromAlp)} house's questions)` })) : [];
    now.push({
      id: "alp",
      group: "now",
      start: sp?.start ?? lifeAt,
      end: sp?.end,
      when: sp ? spanM(sp.start, sp.end, zone) : "running",
      system: "ALP",
      what: `Progressed lagna in ${alp.point.sign}, your ${ordH(alp.houseFromJanma)}`,
      line: nakP
        ? plain
          ? `The point is crossing ${alp.point.nakshatra}, ruled by ${nakP.planet}, which stands in the ${ordH(nakP.houseFromAlp)} house from it, so the questions of the ${ordH(nakP.houseFromAlp)} house (${ALP_HOUSE_GLOSS[nakP.houseFromAlp]}) come to the front.`
          : `${alp.point.nakshatra}, the point's star, is ruled by ${nakP.planet}, in the ${ordH(nakP.houseFromAlp)} from the ALP lagna: the questions of the ${ordH(nakP.houseFromAlp)} house (${ALP_HOUSE_THEMES[nakP.houseFromAlp]}) come to the front.`
        : undefined,
      detail: plain
        ? undefined
        : `ALP lagna ${dm(alp.point.degInSign)} ${alp.point.sign}, ${alp.point.nakshatra} pada ${alp.point.pada}${nakP ? "" : `; nakshatra lord ${alp.point.nakshatraLord}`}.`,
      tags: tagsFor({ attached, house: alp.houseFromJanma }, lagnaSign, held),
      link: { tab: "alp", chapter: "brief" },
    });
    if (!past && alp.nextSignChange && alp.nextSignChange < horizonEnd) {
      const nextSign = (alp.point.signIndex + 1) % 12;
      const h = ((nextSign - lagnaSign + 12) % 12) + 1;
      next.push({
        id: "next-alp",
        group: "next",
        start: alp.nextSignChange,
        when: day(alp.nextSignChange, zone),
        system: "ALP",
        what: `Progressed lagna enters ${SIGNS[nextSign]}, your ${ordH(h)}`,
        tags: tagsFor({ house: h }, lagnaSign, held),
        link: { tab: "alp", chapter: "timeline" },
      });
    }
  }

  // Nadi windows: Jupiter's and Saturn's passages that wake natal planets (weight 2 or more), running now
  // or beginning within the horizon; only the first coming passage of each planet, as for the transits.
  // The shared reader names no held-back area for a minor (as on the Nadi tab and in the PDF); a passage
  // left with no in-season area is not shown here.
  const anyHeld = AREA_ORDER.some(held);
  const nadi: TransitReading[] = readTransits(result.transits, positions, result.reading.findings, result.utc, result.reading.roles, held);
  const shown = (x: TransitReading | undefined): x is TransitReading =>
    !!x && x.weight >= NADI_WINDOW_WEIGHT && (!anyHeld || x.areas.length > 0);
  for (const planet of ["Jupiter", "Saturn"] as const) {
    const mine = nadi.filter((x) => x.period.planet === planet);
    const cur = mine.find((x) => x.period.start <= lifeAt && lifeAt < x.period.end);
    if (shown(cur)) now.push(nadiRow(cur, "now"));
    if (past) continue;
    const coming = mine.find((x) => x.period.start > lifeAt && x.period.start < horizonEnd && x.period.signIndex !== cur?.period.signIndex);
    if (shown(coming)) next.push(nadiRow(coming, "next"));
  }
  function nadiRow(x: TransitReading, group: "now" | "next"): BriefRow {
    const areas = x.areas.filter((a) => !held(a)).map((area) => ({ area, why: "the Nadi reading of this passage" }));
    return {
      id: `nadi-${x.period.planet.toLowerCase()}-${group}`,
      group,
      start: x.period.start,
      end: x.period.end,
      when: group === "now" ? spanM(x.period.start, x.period.end, zone) : day(x.period.start, zone),
      system: "Nadi",
      what: group === "now" ? `${x.period.planet} through ${SIGNS[x.period.signIndex]}` : `${x.period.planet} enters ${SIGNS[x.period.signIndex]}`,
      line: x.headline,
      detail: plain ? undefined : `Weight ${x.weight} of 3 (Rao and Naik: Jupiter from the native, Saturn from karma).`,
      tags: tagsFor({ attached: areas }, lagnaSign, held),
      link: { tab: "bnn", chapter: "timing" },
    };
  }

  next.sort((a, b) => a.start.localeCompare(b.start));
  const planets = planetsInPlay(result, input, tn, chalit, zone, plain);
  const running = par.dasaReadings.find((d) => d.current);
  const yogas = par.findings.filter((f) => f.kind !== "lord" && f.kind !== "house" && f.kind !== "evil");
  const dasaCombos = running ? dasaCombinations(yogas, running, par.ties, par.natures) : undefined;
  const pastEnd = !running && par.dasaReadings.length > 0 && par.dasaReadings[par.dasaReadings.length - 1].end <= lifeAt;
  return { before, now, next: past ? [] : next, planets, horizonMonths, past, dasaCombos, pastEnd };
}

/**
 * What a sign holds for Jaimini: the Karakamsa, the Arudha lagna, the Upapada (the plain view glosses
 * each). The Upapada speaks of marriage, so it is left out while that area is held back for a minor.
 */
function signNotes(result: ChartResult, sign: number, plain: boolean, held: (a: LifeArea) => boolean): string {
  const j = result.jaimini;
  const holds: string[] = [];
  if (j.karakamsa?.signIndex === sign)
    holds.push(plain ? "the sign of your soul planet in the navamsa (the Karakamsa)" : "your Karakamsa");
  const al = j.arudhas?.find((a) => a.label === "AL");
  if (al?.signIndex === sign) holds.push(plain ? "the image you show the world (the Arudha lagna)" : "your Arudha lagna");
  const ul = j.arudhas?.find((a) => a.label === "UL");
  if (ul?.signIndex === sign && !held("marriage")) holds.push(plain ? "the pointer to marriage (the Upapada)" : "your Upapada");
  return holds.length ? `${SIGNS[sign]} is ${listJoin(holds)}.` : "";
}

// ---- Planets in play -----------------------------------------------------------------------------

const DIGNITY_WORD: Record<string, string> = {
  Exalted: "exalted",
  Moolatrikona: "in its moolatrikona",
  "Own sign": "in its own sign",
  Friendly: "in a friend's sign",
  Neutral: "in a neutral sign",
  Inimical: "in an enemy's sign",
  Debilitated: "debilitated",
};

/** Within this share of the requirement either way, a strength reads as borderline (the app's convention). */
export const STRENGTH_BORDER = 0.05;

function planetsInPlay(
  result: ChartResult,
  input: AgreementInput,
  tn: TimingNow,
  chalit: ChalitResult | undefined,
  zone: string,
  plain: boolean,
): PlanetBrief[] {
  const par = input.parashari;
  const lagnaSign = par.lagna.signIndex;
  const roles = new Map<Planet, string[]>();
  const add = (p: Planet | undefined, r: string) => {
    if (!p) return;
    roles.set(p, [...(roles.get(p) ?? []), r]);
  };
  if (tn.dasa) add(tn.dasa.lord, `${cap(levelName("dasa", plain))} lord, ${spanM(tn.dasa.start, tn.dasa.end, zone)}`);
  if (tn.antar) add(tn.antar.lord, `${cap(levelName("antar", plain))} lord, ${spanD(tn.antar.start, tn.antar.end, zone)}`);
  if (tn.pratyantar) add(tn.pratyantar.lord, `${cap(levelName("pratyantar", plain))} lord, ${spanD(tn.pratyantar.start, tn.pratyantar.end, zone)}`);
  for (const t of [tn.saturn, tn.jupiter]) if (t) add(t.planet, `In transit through ${SIGNS[t.signIndex]}, your ${ordH(t.house)}`);
  const nextPeriod = tn.next.find((c) => c.kind === "period");
  if (nextPeriod?.lord) add(nextPeriod.lord, `Next ${levelName("dasa", plain)} lord, from ${day(nextPeriod.date, zone)}`);

  const out: PlanetBrief[] = [];
  roles.forEach((rs, planet) => {
    const pos = result.positions.find((p) => p.planet === planet) as PlanetPosition | undefined;
    if (!pos) return;
    const house = ((pos.signIndex - lagnaSign + 12) % 12) + 1;
    const cmp = chalit?.comparison.find((c) => c.planet === planet);
    const withP = result.positions
      .filter((p) => p.planet !== planet && p.signIndex === pos.signIndex && ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].includes(p.planet))
      .map((p) => thePlanet(p.planet));
    const place = [
      `${pos.sign}, your ${ordH(house)}`,
      cmp && cmp.agree && !cmp.unchanged ? `${ordH(cmp.sripati.chalitHouse)} by bhava` : undefined,
      withP.length ? `with ${listJoin(withP)}` : undefined,
      `${pos.nakshatra} ${pos.pada}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const states: string[] = [];
    const dig = DIGNITY_WORD[pos.dignity];
    const nadi = result.reading.strength.find((s) => s.planet === planet);
    if (dig && pos.dignity !== "Neutral") {
      const setAside = nadi && nadi.effectiveDignity !== nadi.dignity && (pos.dignity === "Exalted" || pos.dignity === "Debilitated");
      states.push(
        setAside
          ? plain
            ? `${cap(dig)}, though the Nadi reading sets this aside`
            : `${cap(dig)}; Nadi reads it as ${nadi!.effectiveDignity.toLowerCase()}: ${nadi!.dignityNote ?? "set aside"}`
          : cap(dig),
      );
    }
    const sb = par.shadbala?.planets.find((p) => p.planet === planet);
    if (sb) {
      const pct = Math.round(sb.ratio * 100);
      const border = Math.abs(sb.ratio - 1) <= STRENGTH_BORDER;
      states.push(
        plain
          ? `${pct}% of the strength Parashara asks for${border ? (sb.ratio < 1 ? ", just short" : ", just over") : ""}`
          : `Shadbala ${Math.round(sb.total)} of ${Math.round(sb.required)} virupas, ${pct}% (BPHS 27.32-33)${border ? `; within ${Math.round(STRENGTH_BORDER * 100)}% of the line, borderline (the app's convention)` : ""}`,
      );
    }
    const line = par.avasthas.lines.find((l) => l.planet === planet);
    if (line?.combust) states.push(plain ? "Close to the Sun (combust)" : "Combust by Parashari orbs");
    if (cmp && (cmp.sripati.atSandhi || cmp.equal.atSandhi)) {
      const m = cmp.sripati.atSandhi ? cmp.sripati : cmp.equal;
      const pair = m.sandhiBetween ? `${ordH(m.sandhiBetween[0])}/${ordH(m.sandhiBetween[1])}` : "a";
      states.push(plain ? `On the ${pair} house junction` : `At the ${pair} bhava sandhi (Phaladeepika 15.13)`);
    }
    for (const w of par.shadbala?.wars ?? []) {
      if (w.victor === planet) states.push(`Wins the planetary war with ${w.loser}${plain ? "" : " (BPHS 27.20)"}`);
      if (w.loser === planet) states.push(`Loses the planetary war with ${w.victor}${plain ? "" : " (BPHS 27.20)"}`);
    }
    if (line) states.push(plain ? line.briefPlain : line.brief);

    const hs = housesRuled(planet, lagnaSign);
    const isYk = par.natures.some((n) => n.planet === planet && n.functional === "yogakaraka");
    const rules = hs.length ? `Rules your ${ordList(hs)}${isYk ? " · yogakaraka" : ""}` : "Rules no house";

    const systems: { system: string; text: string }[] = [];
    const nadiRoles = result.reading.roles;
    const nr: string[] = [];
    if (nadiRoles.native === planet) nr.push("the native");
    if (nadiRoles.spouse === planet) nr.push(result.chart.gender === "female" ? "the husband" : "the wife");
    if (nadiRoles.karma === planet) nr.push("karma, the work");
    if (nr.length) systems.push({ system: "Nadi", text: `Stands for ${listJoin(nr)}` });
    const ck = result.jaimini.karakas.find((k) => k.planet === planet);
    if (ck) {
      const info = CHARA_KARAKA_INFO[ck.karaka as keyof typeof CHARA_KARAKA_INFO];
      if (info) systems.push({ system: "Jaimini", text: plain ? `${info.name}: ${info.meaning}` : `${info.name} (${ck.karaka}), ${dm(ck.rankDegree)} in its sign` });
    }
    const subOf = input.kp.cusps.filter((c) => c.subLord === planet).map((c) => c.house);
    if (subOf.length) systems.push({ system: "KP", text: `Sub lord of the ${ordList(subOf)} cusp${subOf.length === 1 ? "" : "s"}` });

    out.push({ planet, roles: rs, place, states: states.map(cap), rules, systems });
  });
  return out;
}
