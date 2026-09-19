// Jaimini life areas: what each area rests on (karaka, pada, house from the Karakamsa)
// and when the Chara dasha brings it forward. Follows K.N. Rao's method: the running
// dasha sign is treated as a temporary lagna and the houses from it are read for the
// area; the antardasha sign is read the same way. Pure functions over JaiminiResult.

import { DateTime } from "luxon";
import { SIGNS, SIGN_LORD, dignityOf, houseFrom, type Dignity, type Planet, type PlanetPosition } from "./astro";
import { isBenefic, rasiAspects, type CharaKarakaId, type JaiminiResult } from "./jaimini";

export type JaiminiArea = "self" | "career" | "wealth" | "marriage" | "children" | "family" | "health";

export const JAIMINI_AREA_ORDER: JaiminiArea[] = ["self", "career", "wealth", "marriage", "children", "family", "health"];

export type Tone = "support" | "strain" | "neutral";

interface AreaSpec {
  label: string;
  short: string;
  /** Karakas that carry the area, most important first. */
  karakas: CharaKarakaId[];
  /** Padas (house numbers 1..12) that show the area's worldly face. */
  padas: number[];
  /** Houses from the Karakamsa, read in the navamsa. */
  karakamsaHouses: number[];
  /** Houses from the running dasha sign that carry the area, with the tone a planet there brings. */
  dashaHouses: Array<{ house: number; tone: Tone; gloss: string }>;
  blurb: string;
}

export const JAIMINI_AREAS: Record<JaiminiArea, AreaSpec> = {
  self: {
    label: "Self & purpose",
    short: "self",
    karakas: ["AK"],
    padas: [1],
    karakamsaHouses: [1, 12],
    dashaHouses: [],
    blurb: "The Atmakaraka is the king of the chart; its navamsa sign (Karakamsa) and the Arudha lagna show the inner purpose and the public image.",
  },
  career: {
    label: "Career & position",
    short: "career",
    karakas: ["AmK", "AK"],
    padas: [10, 1],
    karakamsaHouses: [10],
    dashaHouses: [{ house: 10, tone: "support", gloss: "rise in work and position" }],
    blurb: "The Amatyakaraka is the minister who carries out the soul's work; the Rajya pada (A10) is the career as the world sees it.",
  },
  wealth: {
    label: "Wealth & gains",
    short: "wealth",
    karakas: [],
    padas: [2, 11],
    karakamsaHouses: [2, 11],
    dashaHouses: [
      { house: 2, tone: "support", gloss: "accumulation" },
      { house: 11, tone: "support", gloss: "gains" },
      { house: 12, tone: "strain", gloss: "outflow" },
    ],
    blurb: "Jaimini reads money from the padas: Dhana pada (A2) for savings and family wealth, Labha pada (A11) for income, and the 2nd, 11th and 12th from the Arudha lagna.",
  },
  marriage: {
    label: "Marriage & partnership",
    short: "marriage",
    karakas: ["DK"],
    padas: [12, 7],
    karakamsaHouses: [7],
    dashaHouses: [{ house: 7, tone: "support", gloss: "partnership" }],
    blurb: "The Darakaraka is the spouse; the Upapada (UL) is the marriage and the spouse's family; the Dara pada (A7) is partnership and business.",
  },
  children: {
    label: "Children & learning",
    short: "children",
    karakas: ["PK"],
    padas: [5],
    karakamsaHouses: [5],
    dashaHouses: [{ house: 5, tone: "support", gloss: "children and study" }],
    blurb: "The Putrakaraka carries children and students; the Mantra pada (A5) is their visible side; the 5th from the Karakamsa gives talents and learning.",
  },
  family: {
    label: "Parents, siblings & home",
    short: "family",
    karakas: ["MK", "PiK", "BK"],
    padas: [4, 9, 3],
    karakamsaHouses: [4, 9, 3],
    dashaHouses: [
      { house: 4, tone: "support", gloss: "home and mother" },
      { house: 9, tone: "support", gloss: "father and fortune" },
      { house: 12, tone: "strain", gloss: "separation or residence away from home" },
    ],
    blurb: "Matrikaraka for the mother and home, Pitrikaraka for the father and lineage, Bhratrikaraka for siblings and one's own effort; the 4th and 9th from the Karakamsa show the dwelling and dharma.",
  },
  health: {
    label: "Health & conflict",
    short: "health",
    karakas: ["GK"],
    padas: [6, 8],
    karakamsaHouses: [6, 8],
    dashaHouses: [
      { house: 6, tone: "strain", gloss: "illness, disputes, rivals" },
      { house: 8, tone: "strain", gloss: "reversals and serious obstacles" },
    ],
    blurb: "The Gnatikaraka carries relatives, rivals, disease and obstacles; the Shatru pada (A6) and Mrityu pada (A8) are their outer face.",
  },
};

/** Which life area an existing sutra finding speaks to. Unmapped rules stay under 'What the sutras say' only. */
export const AREA_OF_RULE: Record<string, JaiminiArea> = {
  "jk-ak-sign": "self",
  "jk-ak-amk-together": "career",
  "jks-sun": "career",
  "jks-moon": "career",
  "jks-mars": "career",
  "jks-mercury": "career",
  "jks-jupiter": "career",
  "jks-venus": "career",
  "jks-saturn": "career",
  "jks-rahu": "career",
  "jks-ketu": "career",
  "jks-sun-rahu": "health",
  "jks-author": "children",
  "jks-5th-venus": "children",
  "jks-5th-jupiter": "children",
  "jks-5th-mercury": "children",
  "jks-5th-mars": "children",
  "jks-5th-moon": "children",
  "jks-5th-sun": "children",
  "jks-5th-ketu": "children",
  "jks-5th-saturn": "children",
  "jks-3rd-malefic": "self",
  "jks-3rd-benefic": "self",
  "jks-4th-moon-venus": "family",
  "jks-4th-material": "family",
  "jks-9th-benefic": "family",
  "jks-9th-malefic": "family",
  "jks-7th-spouse": "marriage",
  "jks-12th-benefic": "self",
  "jks-12th-ketu": "self",
  "jks-12th-deity": "self",
  "jks-2nd-ketu": "self",
  "ja-al-occupant": "career",
  "ja-al-2nd-benefic": "wealth",
  "ja-al-11th": "wealth",
  "ja-al-12th": "wealth",
  "ja-al-rahu-7-12": "self",
  "ja-al-3-11-nodes-saturn": "family",
  "ja-al-3-11-benefic": "family",
  "ja-al-6th-malefic": "health",
  "ja-kemadruma": "wealth",
  "ju-ul-benefic": "marriage",
  "ju-ul-malefic": "marriage",
  "ju-ul-lord-exalted": "marriage",
  "ju-ul-lord-debilitated": "marriage",
  "ju-2nd-benefic": "marriage",
  "ju-2nd-afflicted": "marriage",
  "ju-2nd-exalted": "marriage",
  "ju-2nd-gemini": "marriage",
  "ju-2nd-saturn-rahu": "marriage",
  "ju-2nd-venus-ketu": "marriage",
  "ju-own-lord": "marriage",
};

export const RAO_SOURCE = { label: "K.N. Rao, Predicting through Jaimini's Chara Dasa", url: "https://pdfcoffee.com/jyotish-predicting-through-jaiminix27s-chara-dasa-kn-rao-pdf-free.html" };
export const RAO_NOTES_SOURCE = { label: "K.N. Rao, Jaimini notes on karakas and marriage timing", url: "https://www.scribd.com/document/397026238/K-N-RAO-JAIMINI" };

// ── Static reading ────────────────────────────────────────────────────────────

export interface Note {
  text: string;
  tone: Tone;
}

export interface KarakaReading {
  karaka: CharaKarakaId;
  planet: Planet;
  sign: number;
  dignity: Dignity;
  houseFromLagna: number;
  d9Sign: number;
  d9Dignity: Dignity;
  with: Planet[];
  aspectedBy: Planet[];
  notes: Note[];
}

export interface PadaReading {
  label: string;
  house: number;
  sign: number;
  occupants: Planet[];
  aspectedBy: Planet[];
  /** Unobstructed argala planets, by house. */
  argala: Array<{ house: number; planets: Planet[] }>;
  notes: Note[];
}

/** A natal sign the area hangs on, used for the transit confirmation. */
export interface TransitTarget {
  label: string;
  sign: number;
}

export interface AreaReading {
  area: JaiminiArea;
  label: string;
  blurb: string;
  karakas: KarakaReading[];
  padas: PadaReading[];
  karakamsa: Array<{ house: number; planets: Planet[] }>;
  findingIds: string[];
  /** Overall balance of support and strain, -n..+n. */
  balance: number;
  timing: AreaTiming;
  /** Natal anchors (karakas, padas, the area's house from the lagna) for Jupiter/Saturn transit checks. */
  anchors: TransitTarget[];
}

/** What each chara karaka "means" when a period brings it forward: the concrete matters it carries. */
export const KARAKA_MATTERS: Record<CharaKarakaId, string> = {
  AK: "the self, its purpose and standing",
  AmK: "work, position, advisers and one's role in the world",
  BK: "siblings, the guru and one's own initiative",
  MK: "mother, home, property and inner comfort",
  PiK: "father, lineage, dharma and protection",
  PK: "children, students, creativity and merit",
  GK: "relatives, rivals, disputes and illness",
  DK: "the spouse, partnerships and close alliances",
};

/** What each arudha pada shows: the area as the world sees it. Keyed by house number. */
export const PADA_MATTERS: Record<number, string> = {
  1: "image, name and public standing",
  2: "savings, family wealth and what is accumulated",
  3: "siblings, courage and undertakings",
  4: "home, property, mother and comfort",
  5: "children, students and one's visible talents",
  6: "enemies, disputes, debts and illness",
  7: "partnership, business and the partner as seen by others",
  8: "reversals, inheritance and hidden trouble",
  9: "father, teachers, fortune and travel",
  10: "career, rank and recognition",
  11: "income, gains and allies",
  12: "the marriage, the spouse's family and the marital home",
};

/** How a karaka in the running sign is likely to play out, from its dignity there. */
function karakaState(ctx: Ctx, planet: Planet): string {
  const p = ctx.at(planet);
  if (planet === "Rahu" || planet === "Ketu") return "";
  if (GOOD_DIGNITY.has(p.dignity)) return ` ${planet} is ${p.dignity.toLowerCase()} there, so they tend to prosper.`;
  if (BAD_DIGNITY.has(p.dignity)) return ` ${planet} is ${p.dignity.toLowerCase()} there, so they come with effort or delay.`;
  return "";
}

const KENDRA_TRIKONA = new Set([1, 4, 5, 7, 9, 10]);
const DUSTHANA = new Set([6, 8, 12]);
const GOOD_DIGNITY = new Set<Dignity>(["Exalted", "Moolatrikona", "Own sign", "Friendly"]);
const BAD_DIGNITY = new Set<Dignity>(["Debilitated", "Inimical"]);

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}
function list(ps: Planet[]) {
  return ps.length === 0 ? "none" : ps.length === 1 ? ps[0] : `${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`;
}

interface Ctx {
  j: JaiminiResult;
  positions: PlanetPosition[];
  benefic: Set<Planet>;
  malefic: Set<Planet>;
  at: (p: Planet) => PlanetPosition;
  d9: (p: Planet) => { signIndex: number; degInSign: number };
}

function makeCtx(j: JaiminiResult, positions: PlanetPosition[]): Ctx {
  const sun = positions.find((p) => p.planet === "Sun")!.lon;
  const benefic = new Set(positions.filter((p) => isBenefic(p, sun)).map((p) => p.planet));
  const malefic = new Set(positions.filter((p) => !benefic.has(p.planet)).map((p) => p.planet));
  return {
    j,
    positions,
    benefic,
    malefic,
    at: (p) => positions.find((x) => x.planet === p)!,
    d9: (p) => j.navamsa.find((x) => x.planet === p)!,
  };
}

function readKaraka(ctx: Ctx, id: CharaKarakaId): KarakaReading {
  const k = ctx.j.karakas.find((x) => x.karaka === id)!;
  const p = ctx.at(k.planet);
  const d9 = ctx.d9(k.planet);
  const d9Dignity = dignityOf(k.planet, d9.signIndex, d9.degInSign);
  const houseFromLagna = houseFrom(ctx.j.lagna.signIndex, p.signIndex);
  const withP = ctx.positions.filter((x) => x.signIndex === p.signIndex && x.planet !== k.planet).map((x) => x.planet);
  const aspectedBy = ctx.positions.filter((x) => rasiAspects(x.signIndex, p.signIndex)).map((x) => x.planet);
  const notes: Note[] = [];
  const ak = ctx.j.karakas[0].planet;
  if (GOOD_DIGNITY.has(p.dignity)) notes.push({ text: `${k.planet} is ${p.dignity.toLowerCase()} in ${SIGNS[p.signIndex]}: the karaka is strong enough to deliver.`, tone: "support" });
  if (BAD_DIGNITY.has(p.dignity)) notes.push({ text: `${k.planet} is ${p.dignity.toLowerCase()} in ${SIGNS[p.signIndex]}: what it promises comes with effort or delay.`, tone: "strain" });
  if (k.planet !== "Rahu" && GOOD_DIGNITY.has(d9Dignity) && !GOOD_DIGNITY.has(p.dignity)) notes.push({ text: `In the navamsa ${k.planet} is ${d9Dignity.toLowerCase()} in ${SIGNS[d9.signIndex]}, which repairs the rasi placement.`, tone: "support" });
  if (k.planet !== "Rahu" && BAD_DIGNITY.has(d9Dignity) && GOOD_DIGNITY.has(p.dignity)) notes.push({ text: `In the navamsa ${k.planet} is ${d9Dignity.toLowerCase()} in ${SIGNS[d9.signIndex]}: the rasi strength is not fully backed.`, tone: "strain" });
  if ((id === "AK" || id === "AmK") && DUSTHANA.has(houseFromLagna)) notes.push({ text: `${id} in the ${ordinal(houseFromLagna)} from the lagna: position comes through struggle (Rao).`, tone: "strain" });
  if (id === "AmK") {
    const fromAK = houseFrom(ctx.at(ak).signIndex, p.signIndex);
    const fromAKd9 = houseFrom(ctx.j.karakamsa.signIndex, d9.signIndex);
    if (KENDRA_TRIKONA.has(fromAK) || fromAK === 11 || KENDRA_TRIKONA.has(fromAKd9) || fromAKd9 === 11) {
      notes.push({ text: `AmK is in the ${ordinal(KENDRA_TRIKONA.has(fromAK) || fromAK === 11 ? fromAK : fromAKd9)} from the Atmakaraka${KENDRA_TRIKONA.has(fromAK) || fromAK === 11 ? "" : " in the navamsa"}: a good position in life attained with less struggle (Rao).`, tone: "support" });
    }
    if (fromAK === 1) notes.push({ text: "AK and AmK together: work becomes the vehicle of the self, a Jaimini raja yoga.", tone: "support" });
  }
  const goodCompany = withP.filter((x) => ctx.benefic.has(x));
  const badCompany = withP.filter((x) => ctx.malefic.has(x));
  if (goodCompany.length) notes.push({ text: `Joined by ${list(goodCompany)}: benefic company increases what the karaka promises.`, tone: "support" });
  if (badCompany.length) notes.push({ text: `Joined by ${list(badCompany)}: the karaka is afflicted, so ${KARAKA_MATTERS[id]} meet resistance.`, tone: "strain" });
  const goodAsp = aspectedBy.filter((x) => ctx.benefic.has(x));
  const badAsp = aspectedBy.filter((x) => ctx.malefic.has(x));
  if (goodAsp.length && !goodCompany.length) notes.push({ text: `Aspected by ${list(goodAsp)} (rasi drishti): support from outside its own sign.`, tone: "support" });
  if (badAsp.length && !badCompany.length && badAsp.length >= 2) notes.push({ text: `Aspected by ${list(badAsp)} (rasi drishti): pressure from outside its own sign.`, tone: "strain" });
  return { karaka: id, planet: k.planet, sign: p.signIndex, dignity: p.dignity, houseFromLagna, d9Sign: d9.signIndex, d9Dignity, with: withP, aspectedBy, notes };
}

function readPada(ctx: Ctx, house: number): PadaReading {
  const a = ctx.j.arudhas[house - 1];
  const occupants = ctx.positions.filter((x) => x.signIndex === a.signIndex).map((x) => x.planet);
  const aspectedBy = ctx.positions.filter((x) => rasiAspects(x.signIndex, a.signIndex)).map((x) => x.planet);
  const inHouse = (h: number) => ctx.positions.filter((p) => houseFrom(a.signIndex, p.signIndex) === h).map((p) => p.planet);
  const argala = [
    [2, 12],
    [4, 10],
    [11, 3],
  ]
    .map(([h, o]) => ({ house: h, planets: inHouse(h), blockers: inHouse(o) }))
    .filter((x) => x.planets.length && x.blockers.length < x.planets.length)
    .map(({ house: h, planets }) => ({ house: h, planets }));
  const notes: Note[] = [];
  const bOcc = occupants.filter((p) => ctx.benefic.has(p));
  const mOcc = occupants.filter((p) => ctx.malefic.has(p));
  const bAsp = aspectedBy.filter((p) => ctx.benefic.has(p));
  const mAsp = aspectedBy.filter((p) => ctx.malefic.has(p));
  if (bOcc.length) notes.push({ text: `${a.label} in ${SIGNS[a.signIndex]} holds ${list(bOcc)}: the area shows well to the world.`, tone: "support" });
  if (mOcc.length) notes.push({ text: `${a.label} in ${SIGNS[a.signIndex]} holds ${list(mOcc)}: the outer face of the area is harder or contested.`, tone: "strain" });
  if (!occupants.length) notes.push({ text: `${a.label} in ${SIGNS[a.signIndex]} is empty; read it from its lord ${SIGN_LORD[a.signIndex]} in ${SIGNS[ctx.at(SIGN_LORD[a.signIndex]).signIndex]} and from the planets aspecting it.`, tone: "neutral" });
  if (bAsp.length) notes.push({ text: `Aspected by ${list(bAsp)}: benefic rasi drishti supports it.`, tone: "support" });
  if (mAsp.length >= 2) notes.push({ text: `Aspected by ${list(mAsp)}: malefic rasi drishti weighs on it.`, tone: "strain" });
  const argB = argala.flatMap((x) => x.planets).filter((p) => ctx.benefic.has(p));
  const argM = argala.flatMap((x) => x.planets).filter((p) => ctx.malefic.has(p));
  if (argB.length) notes.push({ text: `Unobstructed argala from ${list(argB)}: benefic intervention keeps the area moving.`, tone: "support" });
  if (argM.length > argB.length) notes.push({ text: `Unobstructed argala from ${list(argM)}: malefic intervention presses on it.`, tone: "strain" });
  return { label: a.label, house, sign: a.signIndex, occupants, aspectedBy, argala, notes };
}

// ── Timing (Chara dasha as a temporary lagna) ─────────────────────────────────

export interface Trigger {
  text: string;
  tone: Tone;
  weight: 1 | 2;
}

export interface AreaWindow {
  cycle: 1 | 2;
  mdSign: number;
  adSign: number;
  start: string;
  end: string;
  score: number;
  triggers: Trigger[];
}

export interface AreaPeriod {
  cycle: 1 | 2;
  sign: number;
  start: string;
  end: string;
  ageStart: number;
  years: number;
  score: number;
  triggers: Trigger[];
  /** Antardashas within this period that carry the area. */
  windows: AreaWindow[];
}

export interface AreaTiming {
  periods: AreaPeriod[];
}

function signTriggers(ctx: Ctx, area: JaiminiArea, sign: number, level: "mahadasha" | "antardasha"): Trigger[] {
  const spec = JAIMINI_AREAS[area];
  const out: Trigger[] = [];
  const name = SIGNS[sign];
  const seen = new Set<Planet>();
  const areaKarakaPlanets = spec.karakas.map((k) => ctx.j.karakas.find((x) => x.karaka === k)!.planet);
  const ak = ctx.j.karakas[0].planet;

  // Houses from the dasha sign (Rao: treat the running sign as the lagna).
  for (const dh of spec.dashaHouses) {
    const target = (sign + dh.house - 1) % 12;
    const here = ctx.positions.filter((p) => p.signIndex === target).map((p) => p.planet);
    if (!here.length) continue;
    here.forEach((p) => seen.add(p));
    const kar = here.filter((p) => areaKarakaPlanets.includes(p));
    const ben = here.filter((p) => ctx.benefic.has(p));
    const mal = here.filter((p) => ctx.malefic.has(p));
    if (dh.tone === "support") {
      if (kar.length) out.push({ text: `${list(kar)} (${spec.karakas.filter((k) => kar.includes(ctx.j.karakas.find((x) => x.karaka === k)!.planet)).join(", ")}) in the ${ordinal(dh.house)} from ${name}: the area's own karaka stands in its house, the strongest sign for ${dh.gloss}.`, tone: "support", weight: 2 });
      if (ben.filter((p) => !kar.includes(p)).length) out.push({ text: `${list(ben.filter((p) => !kar.includes(p)))} in the ${ordinal(dh.house)} from ${name}: benefic support for ${dh.gloss}.`, tone: "support", weight: 1 });
      if (mal.filter((p) => !kar.includes(p)).length) out.push({ text: `${list(mal.filter((p) => !kar.includes(p)))} in the ${ordinal(dh.house)} from ${name}: effort or conflict around ${dh.gloss}.`, tone: "strain", weight: 1 });
    } else {
      if (mal.length) out.push({ text: `${list(mal)} in the ${ordinal(dh.house)} from ${name}: ${dh.gloss}.`, tone: "strain", weight: mal.some((p) => areaKarakaPlanets.includes(p) || p === ak) ? 2 : 1 });
      if (ben.length && !mal.length) out.push({ text: `${list(ben)} in the ${ordinal(dh.house)} from ${name}: ${dh.gloss} kept mild by benefics.`, tone: "neutral", weight: 1 });
    }
  }

  // The dasha sign is, aspects, or faces (1-7 axis) the area's pada.
  for (const h of spec.padas) {
    const a = ctx.j.arudhas[h - 1];
    const shows = PADA_MATTERS[h];
    if (a.signIndex === sign) out.push({ text: `${name} is the ${a.label} sign: ${shows} are on stage.`, tone: "neutral", weight: 2 });
    else if (houseFrom(a.signIndex, sign) === 7) out.push({ text: `${name} is 7th from the ${a.label}: it faces the pada across the 1–7 axis, so ${shows} are activated (Rao).`, tone: "neutral", weight: 1 });
    else if (rasiAspects(sign, a.signIndex)) out.push({ text: `${name} aspects the ${a.label} (${SIGNS[a.signIndex]}) by rasi drishti: a lighter touch on ${shows}.`, tone: "neutral", weight: 1 });
  }

  // The dasha sign holds, aspects, or faces the area's karaka (and, for marriage, the DK's navamsa sign and the 7th lord).
  const anchors: Array<{ label: string; sign: number; matters: string; planet?: Planet }> = spec.karakas.map((k) => {
    const kp = ctx.j.karakas.find((x) => x.karaka === k)!;
    return { label: `${k} ${kp.planet}`, sign: ctx.at(kp.planet).signIndex, matters: KARAKA_MATTERS[k], planet: kp.planet };
  });
  if (area === "marriage") {
    const dk = ctx.j.karakas.find((x) => x.karaka === "DK")!.planet;
    anchors.push({ label: `the navamsa sign of DK ${dk}`, sign: ctx.d9(dk).signIndex, matters: "the spouse and the marriage" });
    const seventhLord = SIGN_LORD[(ctx.j.lagna.signIndex + 6) % 12];
    anchors.push({ label: `the 7th lord ${seventhLord}`, sign: ctx.at(seventhLord).signIndex, matters: "marriage and partnership", planet: seventhLord });
  }
  if (area === "self") anchors.push({ label: "the Karakamsa", sign: ctx.j.karakamsa.signIndex, matters: "the soul's own agenda" });
  const dedupe = new Set<string>();
  for (const an of anchors) {
    const key = `${an.sign}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    if (an.sign === sign) {
      if (area === "self" && an.label.startsWith("AK")) out.push({ text: `${name} holds the Atmakaraka: a period that tests the self; Rao asks for care, since AK periods can bring a fall as well as a rise.`, tone: "neutral", weight: 2 });
      else if (an.label === "the Karakamsa") out.push({ text: `${name} is the Karakamsa sign (Swamsa): the soul's own agenda comes forward.`, tone: "neutral", weight: 2 });
      else if (an.label.startsWith("the navamsa sign")) out.push({ text: `${name} is ${an.label}: ${an.matters} come to the front.`, tone: "neutral", weight: 2 });
      else out.push({ text: `${name} holds ${an.label}: ${an.matters} come to the front.${an.planet ? karakaState(ctx, an.planet) : ""}`, tone: "neutral", weight: 2 });
    } else if (houseFrom(an.sign, sign) === 7) out.push({ text: `${name} is 7th from ${an.label}: it faces the karaka across the 1–7 axis, so ${an.matters} are activated.`, tone: "neutral", weight: 1 });
    else if (rasiAspects(sign, an.sign)) out.push({ text: `${name} aspects ${an.label} by rasi drishti: a lighter touch on ${an.matters}.`, tone: "neutral", weight: 1 });
  }

  // Area-specific cautions from Rao.
  if (area === "children" && houseFrom(ctx.j.lagna.signIndex, sign) === 6) out.push({ text: `${name} is the 6th from the lagna, the 2nd from the 5th and so a maraka house for children: care is needed for their health (Rao).`, tone: "strain", weight: 1 });
  if (area === "health" || area === "career") {
    if (sign === 4 || sign === 8) out.push({ text: `${name} periods are known for rises and falls${level === "antardasha" ? ", especially as sub-periods" : ""} (Rao).`, tone: "neutral", weight: 1 });
  }
  if (area === "health") {
    if (sign === 8 && rasiAspects(ctx.at(ak).signIndex, 8)) out.push({ text: `Sagittarius aspected by the Atmakaraka: Rao warns of violent events to the self or the family.`, tone: "strain", weight: 2 });
    if (houseFrom(sign, ctx.at(ak).signIndex) === 8) out.push({ text: `The Atmakaraka falls in the 8th from ${name}: predictions must be made carefully (Rao).`, tone: "strain", weight: 1 });
  }
  if (area === "self" && ctx.j.arudhas[0].signIndex === sign) out.push({ text: `${name} is the Arudha lagna: standing and image are on show.`, tone: "neutral", weight: 1 });
  return out;
}

function adRelationTriggers(ctx: Ctx, area: JaiminiArea, mdSign: number, adSign: number): Trigger[] {
  const out: Trigger[] = [];
  const rel = houseFrom(mdSign, adSign);
  if (area === "health" && (rel === 6 || rel === 8)) {
    const ak = ctx.j.karakas[0].planet;
    const akAspects = rasiAspects(ctx.at(ak).signIndex, adSign);
    out.push({ text: `${SIGNS[adSign]} is the ${ordinal(rel)} from the mahadasha sign ${SIGNS[mdSign]}: a sub-period to be careful in${akAspects ? ", more so as the Atmakaraka aspects it" : ""} (Rao).`, tone: "strain", weight: akAspects ? 2 : 1 });
  }
  return out;
}

function score(ts: Trigger[]) {
  return ts.reduce((s, t) => s + t.weight, 0);
}

/** A period carries the area when it has a strong trigger (karaka in its house, pada sign, karaka sign) or several weak ones. */
export function isHot(ts: Trigger[]) {
  return ts.some((t) => t.weight === 2) || score(ts) >= 3;
}

function timingFor(ctx: Ctx, area: JaiminiArea, maxAge = 100): AreaTiming {
  const periods: AreaPeriod[] = [];
  for (const p of ctx.j.charaDasha.periods) {
    if (p.ageStart >= maxAge) continue;
    const triggers = signTriggers(ctx, area, p.sign, "mahadasha");
    const windows: AreaWindow[] = p.antardashas
      .map((a) => {
        const ts = [...signTriggers(ctx, area, a.sign, "antardasha"), ...adRelationTriggers(ctx, area, p.sign, a.sign)];
        return { cycle: p.cycle, mdSign: p.sign, adSign: a.sign, start: a.start, end: a.end, score: score(ts), triggers: ts };
      })
      .filter((w) => isHot(w.triggers));
    periods.push({ cycle: p.cycle, sign: p.sign, start: p.start, end: p.end, ageStart: p.ageStart, years: p.years, score: score(triggers), triggers, windows });
  }
  return { periods };
}

// ── Assembly ──────────────────────────────────────────────────────────────────

export function readAreas(j: JaiminiResult, positions: PlanetPosition[]): AreaReading[] {
  const ctx = makeCtx(j, positions);
  return JAIMINI_AREA_ORDER.map((area) => {
    const spec = JAIMINI_AREAS[area];
    const karakas = spec.karakas.map((k) => readKaraka(ctx, k));
    const padas = spec.padas.map((h) => readPada(ctx, h));
    const karakamsa = spec.karakamsaHouses
      .map((h) => ({ house: h, planets: j.navamsa.filter((p) => houseFrom(j.karakamsa.signIndex, p.signIndex) === h).map((p) => p.planet) }))
      .filter((x) => x.planets.length);
    const findingIds = j.findings.filter((f) => AREA_OF_RULE[f.id] === area).map((f) => f.id);
    const notes = [...karakas.flatMap((k) => k.notes), ...padas.flatMap((p) => p.notes)];
    const balance = notes.reduce((s, n) => s + (n.tone === "support" ? 1 : n.tone === "strain" ? -1 : 0), 0);
    return { area, label: spec.label, blurb: spec.blurb, karakas, padas, karakamsa, findingIds, balance, timing: timingFor(ctx, area), anchors: transitAnchors(ctx, area) };
  });
}

/** Natal signs Rao checks Jupiter and Saturn against for an area: its karakas, its padas, its house from the lagna (and, for marriage, the 7th lord). */
function transitAnchors(ctx: Ctx, area: JaiminiArea): TransitTarget[] {
  const spec = JAIMINI_AREAS[area];
  const raw: TransitTarget[] = [];
  for (const k of spec.karakas) {
    const kp = ctx.j.karakas.find((x) => x.karaka === k)!;
    raw.push({ label: `${k} ${kp.planet}`, sign: ctx.at(kp.planet).signIndex });
  }
  for (const h of spec.padas) {
    const a = ctx.j.arudhas[h - 1];
    raw.push({ label: a.label, sign: a.signIndex });
  }
  for (const dh of spec.dashaHouses.filter((d) => d.tone === "support")) {
    raw.push({ label: `${ordinal(dh.house)} house`, sign: (ctx.j.lagna.signIndex + dh.house - 1) % 12 });
  }
  if (area === "self") raw.push({ label: "lagna", sign: ctx.j.lagna.signIndex });
  if (area === "marriage") {
    const seventhLord = SIGN_LORD[(ctx.j.lagna.signIndex + 6) % 12];
    raw.push({ label: `7th lord ${seventhLord}`, sign: ctx.at(seventhLord).signIndex });
  }
  if (area === "health") raw.push({ label: "lagna", sign: ctx.j.lagna.signIndex });
  // merge labels that share a sign
  const bySign = new Map<number, string[]>();
  for (const t of raw) bySign.set(t.sign, [...(bySign.get(t.sign) ?? []), t.label]);
  return Array.from(bySign.entries()).map(([sign, labels]) => ({ sign, label: labels.join(", ") }));
}

/** The period and window (if any) running at `asOf`, for one area. */
export function currentFor(t: AreaTiming, asOf: string): { period?: AreaPeriod; window?: AreaWindow } {
  const now = DateTime.fromISO(asOf);
  const period = t.periods.find((p) => now >= DateTime.fromISO(p.start) && now < DateTime.fromISO(p.end));
  const window = period?.windows.find((w) => now >= DateTime.fromISO(w.start) && now < DateTime.fromISO(w.end));
  return { period, window };
}
