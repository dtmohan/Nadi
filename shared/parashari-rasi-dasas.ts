// Parashara's dasas of signs: BPHS ch. 46.155-190 (Chara, Sthira, Yogardha, Kendradi, Karaka, Manduka,
// Shula, Trikona, Drig and the nakshatra-based rasi dasa; http://jyotishvidya.com/ch46.htm), with the
// sub-periods of ch. 51.5-12 (http://jyotishvidya.com/ch51.htm) and the effects of ch. 50 read on the
// running sign. R. Santhanam's translation as posted there; rules the text leaves open are marked
// provisional. The Jaimini tab keeps K.N. Rao's Chara dasa separately; this module follows Parashara only.
import { SIGNS, SIGN_LORD, SIGN_QUALITY, houseFrom, norm360, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { charaKarakas, rasiAspects, CHARA_KARAKA_INFO, type CharaKaraka } from "./jaimini";
import { rasiDasaReadings, rasiAntarNote, type RasiReading, type RasiDasaDeps, type RasiAntarNote } from "./kalachakra-effects";
import type { ShadbalaResult } from "./shadbala";
import { DateTime } from "luxon";

const CH46 = BPHS_URL(46);
const CH51 = BPHS_URL(51);
export const RASI_DASA_CH = { ch46: CH46, ch51: CH51, ch50: BPHS_URL(50) };
const YEAR_DAYS = 365.25;
const NAK_ARC = 360 / 27;

/** Odd padas: the text groups the signs in threes from Aries; the 1st and 3rd groups count onwards, the 2nd and 4th in reverse (46.156). */
export const ODD_PADA = new Set([0, 1, 2, 6, 7, 8]);
const isOddSign = (s: number) => s % 2 === 0;
const q = (s: number) => SIGN_QUALITY[s];
const natureRank = (s: number) => (q(s) === "Dual" ? 3 : q(s) === "Fixed" ? 2 : 1);
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

export interface CharaYear {
  sign: number;
  lords: Planet[];
  /** Lord whose sign fixed the count. */
  lord: Planet;
  lordSign: number;
  forward: boolean;
  count: number;
  adjust: number;
  years: number;
  note: string;
  provisional?: boolean;
}

export interface SignPick {
  sign: number;
  why: string;
  provisional?: boolean;
}

export interface RasiAntar {
  sign: number;
  start: string;
  end: string;
  current: boolean;
  /** 50.90-96 read on the sub-period sign. */
  note?: RasiAntarNote;
}

export interface RasiPeriod {
  sign: number;
  /** Karaka dasa only. */
  karaka?: string;
  planet?: Planet;
  years: number;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  repeated: boolean;
  antardasas?: RasiAntar[];
  antarStart?: SignPick;
  antarRule?: string;
}

export interface RasiDasa {
  id: string;
  name: string;
  verses: string;
  url: string;
  summary: string;
  start: SignPick;
  direction: "forward" | "backward";
  directionWhy: string;
  yearsRule: string;
  provisional: boolean;
  balanceNote?: string;
  /** A verse on death, shown as written and not judged. */
  asWritten?: string;
  periods: RasiPeriod[];
  /** Ch. 50 read on the running sign. */
  readings: RasiReading[];
}

export interface RasiDasasResult {
  systems: RasiDasa[];
  charaYears: CharaYear[];
  brahma: { planet?: Planet; sign?: number; reason: string; provisional: boolean };
  karakas: CharaKaraka[];
  caveats: string[];
  notComputed: string[];
}

export const RASI_DASA_CAVEATS_46: string[] = [
  "Years of a sign in the Chara dasa are the count from the sign to the sign its lord occupies, onwards for the 1st and 3rd groups of three signs from Aries and in reverse for the 2nd and 4th (46.155-156), less one; a lord in its own sign gives twelve, the reading the text states for Scorpio and Aquarius (46.158) and here applied to every sign (provisional). One year is added for an exalted lord and one taken for a debilitated lord; the text gives this within the Scorpio and Aquarius rules (46.164-165) and it is applied to all signs here (provisional).",
  "Scorpio is owned by Mars and Ketu and Aquarius by Saturn and Rahu (46.157). Both lords in the sign give twelve years; one lord in the sign sends the count to the other; lords in different signs send it to the stronger sign, judged by the number of planets in it, then a dual sign over a fixed and a fixed over a movable, then the larger count, with a sign holding an exalted planet taken outright (46.158-166). The exaltation clause is applied before the occupant count here (provisional as to order).",
  "Where the text says the stronger of two signs, or ranks signs by strength (46.174-176, 46.179, 46.181, 46.183, 51.6) without defining the test, the sign with more planets is taken as stronger, then a dual over a fixed over a movable sign as in 46.162, then the sign whose lord is further advanced in degrees as in 46.173 (provisional).",
  "The Brahma planet (46.170-173) is the strongest among the lords of the 6th, 8th and 12th that stands in the visible half of the chart (houses 1 to 7) in an odd sign, the 8th lord in the 8th also qualifying; Saturn, Rahu and Ketu are allowed as the text says; among several the one furthest in degrees is taken. When none qualifies the strongest of the three lords is used and flagged. The phrase within the sixth bhava is read as houses 1 to 7 (provisional).",
  "Sub-periods follow 51.5-12: twelve equal parts, starting from the dasa sign or its 7th, whichever is stronger; sequential for a movable dasa sign, every sixth sign for a fixed sign, and for a dual sign the angles from it, then from its 5th, then from its 9th; onwards from an odd dasa sign and in reverse from an even one. The text names the Chara, Sthira and Trikona dasas for this scheme (51.12); it is shown on the other sign dasas as well, marked provisional.",
  "The Karaka dasa counts from the lagna to the sign of each karaka inclusively (46.178), eight karakas as set for this chart. The Drig, nakshatra-based and Kendradi dasas take the Chara years, which the text implies but does not state for the Drig and nakshatra systems (provisional). Only the nakshatra-based dasa has a balance at birth (46.190); the others begin their first period at birth.",
  "Chapter 50, Parashara's effects for the dasas of signs, is read on the running period of each system: the sign's house from the lagna, its occupants and aspects, its lord and the sub-period sign, with the same limits as on the Kalachakra page. Each sub-period sign also carries the reading of 50.90-96: its own lord or a friend of that lord in it, the 6th, 8th or 12th from the dasa sign taken as the lagna of the period, a malefic, debilitated or ill-placed occupant, and its Sarvashtakavarga count banded by 72.3-4 (provisional, since 50.93 compares counts without a threshold).",
  "50.90 opens the sub-periods from the sign the dasa lord occupies, while 51.5-6 open them from the dasa sign or its 7th; the app follows ch. 51 and does not show the 50.90 order. 50.95 names the sign from which the dasa commences as the lagna for the sub-periods; it is read here as the dasa sign (provisional).",
];

const NOT_COMPUTED = [
  "Pancha Swara dasa (46.191-194) works from the letters of the name and is not computed.",
  "The Kendradi dasa of planets (46.176-177) and its sub-periods (51.3-4) are not computed; the sign dasas from the lagna and from the Atmakaraka are.",
  "The Shula dasa is written for the time of death (46.181-182); it is listed with its periods, and the death clause is shown as written without judgement.",
];

function occupants(sign: number, positions: PlanetPosition[]): PlanetPosition[] {
  return positions.filter((p) => p.signIndex === sign);
}

function lordsOf(sign: number): Planet[] {
  return sign === 7 ? ["Mars", "Ketu"] : sign === 10 ? ["Saturn", "Rahu"] : [SIGN_LORD[sign]];
}

/** Provisional sign-strength test: occupants, then dual over fixed over movable, then the lord's degrees. */
export function strongerSign(a: number, b: number, positions: PlanetPosition[]): SignPick {
  const oa = occupants(a, positions).length, ob = occupants(b, positions).length;
  if (oa !== ob) {
    const w = oa > ob ? a : b;
    return { sign: w, why: `${SIGNS[w]} holds ${Math.max(oa, ob)} ${Math.max(oa, ob) === 1 ? "planet" : "planets"} against ${Math.min(oa, ob)} in ${SIGNS[w === a ? b : a]}`, provisional: true };
  }
  if (natureRank(a) !== natureRank(b)) {
    const w = natureRank(a) > natureRank(b) ? a : b;
    return { sign: w, why: `equal occupants; ${SIGNS[w]} is a ${q(w).toLowerCase()} sign and outranks the ${q(w === a ? b : a).toLowerCase()} ${SIGNS[w === a ? b : a]} (46.162)`, provisional: true };
  }
  const deg = (s: number) => Math.max(...lordsOf(s).map((l) => positions.find((p) => p.planet === l)?.degInSign ?? 0));
  const w = deg(a) >= deg(b) ? a : b;
  return { sign: w, why: `equal occupants and nature; ${SIGNS[w]}'s lord is further advanced in degrees (46.173)`, provisional: true };
}

function strongestOf(signs: number[], positions: PlanetPosition[]): SignPick {
  let pick: SignPick = { sign: signs[0], why: "" };
  for (const s of signs.slice(1)) {
    const r = strongerSign(pick.sign, s, positions);
    pick = r;
  }
  return { ...pick, why: pick.why || `${SIGNS[pick.sign]}`, provisional: true };
}

export function charaYearsOf(sign: number, positions: PlanetPosition[]): CharaYear {
  const lords = lordsOf(sign);
  const forward = ODD_PADA.has(sign);
  const at = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const count = (to: number) => (forward ? houseFrom(sign, to) : houseFrom(to, sign));
  const dir = forward ? "onwards" : "in reverse";
  const adjOf = (pl: Planet) => (at(pl).dignity === "Exalted" ? 1 : at(pl).dignity === "Debilitated" ? -1 : 0);
  const finish = (lord: Planet, base: number, note: string, provisional?: boolean): CharaYear => {
    const adjust = base === 12 && at(lord).signIndex === sign ? 0 : adjOf(lord);
    const years = Math.min(12, Math.max(1, base + adjust));
    const adjTxt = adjust === 1 ? `; one added for the exalted ${lord} (46.164)` : adjust === -1 ? `; one taken for the debilitated ${lord} (46.165)` : "";
    return { sign, lords, lord, lordSign: at(lord).signIndex, forward, count: count(at(lord).signIndex), adjust, years, note: note + adjTxt, provisional };
  };
  if (lords.length === 1) {
    const l = lords[0];
    const ls = at(l).signIndex;
    if (ls === sign) return finish(l, 12, `${l} is in its own sign: twelve years`, true);
    const c = count(ls);
    return finish(l, c - 1, `counted ${dir} from ${SIGNS[sign]} to ${l} in ${SIGNS[ls]}: ${c}, less one`);
  }
  const [a, b] = lords;
  const sa = at(a).signIndex, sb = at(b).signIndex;
  if (sa === sign && sb === sign) return finish(a, 12, `${a} and ${b} both in ${SIGNS[sign]}: twelve years (46.158)`);
  if (sa === sign) return finish(b, count(sb) - 1, `${a} is in ${SIGNS[sign]}, so the count runs ${dir} to ${b} in ${SIGNS[sb]} (46.160)`);
  if (sb === sign) return finish(a, count(sa) - 1, `${b} is in ${SIGNS[sign]}, so the count runs ${dir} to ${a} in ${SIGNS[sa]} (46.160)`);
  if (sa === sb) return finish(a, count(sa) - 1, `${a} and ${b} together in ${SIGNS[sa]}: counted ${dir} to that sign`);
  const exA = at(a).dignity === "Exalted", exB = at(b).dignity === "Exalted";
  if (exA !== exB) {
    const w = exA ? a : b;
    return finish(w, count(at(w).signIndex) - 1, `${w} is exalted in ${SIGNS[at(w).signIndex]}, so the count runs ${dir} to that sign (46.164)`, true);
  }
  const oa = occupants(sa, positions).length, ob = occupants(sb, positions).length;
  if (oa !== ob) {
    const w = oa > ob ? a : b;
    return finish(w, count(at(w).signIndex) - 1, `${SIGNS[at(w).signIndex]} (${w}) holds more planets than ${SIGNS[at(w === a ? b : a).signIndex]}, so the count runs ${dir} to it (46.161)`);
  }
  if (natureRank(sa) !== natureRank(sb)) {
    const w = natureRank(sa) > natureRank(sb) ? a : b;
    return finish(w, count(at(w).signIndex) - 1, `equal occupants; ${SIGNS[at(w).signIndex]} (${w}) is the ${q(at(w).signIndex).toLowerCase()} sign and outranks the other (46.162)`);
  }
  const w = count(sa) >= count(sb) ? a : b;
  return finish(w, count(at(w).signIndex) - 1, `equal in occupants and nature; the larger count, to ${w} in ${SIGNS[at(w).signIndex]}, is taken (46.163)`);
}

export const STHIRA_YEARS = (sign: number) => (q(sign) === "Movable" ? 7 : q(sign) === "Fixed" ? 8 : 9);

function brahmaGraha(positions: PlanetPosition[], lagnaIdx: number, shadbala?: ShadbalaResult): RasiDasasResult["brahma"] {
  const at = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const house = (pl: Planet) => houseFrom(lagnaIdx, at(pl).signIndex);
  const cands = Array.from(new Set([6, 8, 12].flatMap((h) => lordsOf((lagnaIdx + h - 1) % 12))));
  const l8 = SIGN_LORD[(lagnaIdx + 7) % 12];
  const qualifies = (pl: Planet) => (house(pl) <= 7 && isOddSign(at(pl).signIndex)) || (pl === l8 && house(pl) === 8);
  const ok = cands.filter(qualifies);
  const sb = (pl: Planet) => shadbala?.planets.find((x) => x.planet === pl)?.ratio ?? 0;
  if (ok.length) {
    const w = ok.slice().sort((a, b) => at(b).degInSign - at(a).degInSign || sb(b) - sb(a))[0];
    const owns = [6, 8, 12].filter((h) => lordsOf((lagnaIdx + h - 1) % 12).includes(w)).map(ord).join(" and ");
    const why = w === l8 && house(w) === 8 ? `${w}, lord of the 8th, stands in the 8th (46.172)` : `${w}, lord of the ${owns}, stands in the ${ord(house(w))} in the odd sign ${SIGNS[at(w).signIndex]} (46.170-171)`;
    const more = ok.length > 1 ? `; among ${ok.join(", ")} it is furthest in degrees (46.173)` : "";
    return { planet: w, sign: at(w).signIndex, reason: `${why}${more}.`, provisional: false };
  }
  const w = cands.slice().sort((a, b) => sb(b) - sb(a) || at(b).degInSign - at(a).degInSign)[0];
  return { planet: w, sign: at(w).signIndex, reason: `None of ${cands.join(", ")} stands in houses 1 to 7 in an odd sign, nor is the 8th lord in the 8th; ${w}, the strongest of them${shadbala ? " by Shadbala" : " by degrees"}, is used.`, provisional: true };
}

function antarOrder(D: number, positions: PlanetPosition[]): { order: number[]; start: SignPick; rule: string } {
  const start = strongerSign(D, (D + 6) % 12, positions);
  const P = start.sign;
  const step = isOddSign(D) ? 1 : -1;
  const at = (k: number) => ((P + step * k) % 12 + 12) % 12;
  let order: number[];
  let rule: string;
  if (q(D) === "Movable") {
    order = Array.from({ length: 12 }, (_, k) => at(k));
    rule = `movable dasa sign: the twelve signs in order from ${SIGNS[P]}, ${step === 1 ? "onwards" : "in reverse"} (51.7)`;
  } else if (q(D) === "Fixed") {
    order = Array.from({ length: 12 }, (_, k) => at(5 * k));
    rule = `fixed dasa sign: from ${SIGNS[P]}, every sixth sign ${step === 1 ? "onwards" : "in reverse"} (51.8)`;
  } else {
    const kendras = (base: number) => [0, 3, 6, 9].map((k) => at(base + k));
    order = [...kendras(0), ...kendras(4), ...kendras(8)];
    rule = `dual dasa sign: ${SIGNS[P]} and its angles, then the angles from its 5th, then from its 9th, ${step === 1 ? "onwards" : "in reverse"} (51.9)`;
  }
  return { order, start, rule };
}

interface Spec {
  id: string;
  name: string;
  verses: string;
  summary: string;
  start: SignPick;
  direction: "forward" | "backward";
  directionWhy: string;
  order: number[];
  years: (sign: number, i: number) => number;
  yearsRule: string;
  provisional: boolean;
  balanceYears?: number;
  balanceNote?: string;
  asWritten?: string;
  antar: boolean;
  antarProvisional?: boolean;
  karakaLabels?: { karaka: string; planet: Planet }[];
}

export function computeRasiDasas(positions: PlanetPosition[], lagnaLon: number, birthIso: string, asOfIso: string, deps: RasiDasaDeps, shadbala?: ShadbalaResult): RasiDasasResult {
  const lagnaIdx = Math.floor(norm360(lagnaLon) / 30);
  const at = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const charaYears = SIGNS.map((_, s) => charaYearsOf(s, positions));
  const cy = (s: number) => charaYears[s].years;
  const sy = STHIRA_YEARS;
  const seq = (start: number, dir: "forward" | "backward") => Array.from({ length: 12 }, (_, k) => ((start + (dir === "forward" ? k : -k)) % 12 + 12) % 12);
  const parityDir = (s: number): "forward" | "backward" => (isOddSign(s) ? "forward" : "backward");
  const parityWhy = (s: number) => `${SIGNS[s]} is an ${isOddSign(s) ? "odd" : "even"} sign, so the signs run ${isOddSign(s) ? "onwards" : "in reverse"}`;
  const H = (h: number) => (lagnaIdx + h - 1) % 12;
  const brahma = brahmaGraha(positions, lagnaIdx, shadbala);
  const karakas = charaKarakas(positions);
  const ak = karakas.find((k) => k.karaka === "AK")!;
  const birth = DateTime.fromISO(birthIso, { zone: "utc" });
  const asOf = DateTime.fromISO(asOfIso, { zone: "utc" });

  const specs: Spec[] = [];

  // Chara, 46.155-167.
  {
    const ninth = H(9);
    const dir: "forward" | "backward" = ODD_PADA.has(ninth) ? "forward" : "backward";
    specs.push({
      id: "chara", name: "Chara", verses: "155-167",
      summary: "Dasas of the twelve signs from the lagna, each as long as the count from the sign to its lord.",
      start: { sign: lagnaIdx, why: "the lagna (46.167)" },
      direction: dir, directionWhy: `${SIGNS[ninth]}, the sign of the 9th house, is in an ${ODD_PADA.has(ninth) ? "odd" : "even"} group of three, so the signs run ${dir === "forward" ? "onwards" : "in reverse"} from the lagna (46.167)`,
      order: seq(lagnaIdx, dir), years: cy, yearsRule: "count from the sign to its lord (46.155-166)", provisional: false, antar: true,
    });
  }
  // Sthira, 46.168-173.
  {
    const s = brahma.sign ?? lagnaIdx;
    specs.push({
      id: "sthira", name: "Sthira", verses: "168-173",
      summary: "Fixed spans of seven, eight and nine years for movable, fixed and dual signs, starting from the sign of the Brahma planet.",
      start: { sign: s, why: `the sign of the Brahma planet ${brahma.planet ?? ""} (46.169)`, provisional: brahma.provisional },
      direction: parityDir(s), directionWhy: parityWhy(s) + " (46.169)",
      order: seq(s, parityDir(s)), years: sy, yearsRule: "7, 8, 9 years for movable, fixed, dual signs (46.168)", provisional: brahma.provisional, antar: true,
    });
  }
  // Yogardha, 46.174.
  {
    const st = strongerSign(lagnaIdx, H(7), positions);
    specs.push({
      id: "yogardha", name: "Yogardha", verses: "174",
      summary: "Half the sum of the Chara and Sthira years for each sign, from the stronger of the lagna and the 7th.",
      start: { ...st, why: `the stronger of the lagna and the 7th: ${st.why}` },
      direction: parityDir(st.sign), directionWhy: parityWhy(st.sign) + " (46.174)",
      order: seq(st.sign, parityDir(st.sign)), years: (s) => (cy(s) + sy(s)) / 2, yearsRule: "half of Chara plus Sthira years (46.174)", provisional: true, antar: true, antarProvisional: true,
    });
  }
  // Kendradi from the lagna and from the Atmakaraka, 46.175-176.
  const kendradi = (id: string, name: string, base: SignPick, summary: string) => {
    const dir = parityDir(base.sign);
    const step = dir === "forward" ? 1 : -1;
    const at12 = (k: number) => ((base.sign + step * k) % 12 + 12) % 12;
    const group = (offs: number[]) => {
      const signs = offs.map(at12);
      // Rank within the group by the provisional strength test.
      return signs.slice().sort((a, b) => (strongerSign(a, b, positions).sign === a ? -1 : 1));
    };
    const order = [...group([0, 3, 6, 9]), ...group([1, 4, 7, 10]), ...group([2, 5, 8, 11])];
    specs.push({
      id, name, verses: "175-176", summary,
      start: base, direction: dir, directionWhy: parityWhy(base.sign) + "; the angles first, then the succedent and cadent signs, each set ranked by strength (46.175-176)",
      order, years: cy, yearsRule: "as in the Chara dasa (46.176)", provisional: true, antar: true, antarProvisional: true,
    });
  };
  {
    const st = strongerSign(lagnaIdx, H(7), positions);
    kendradi("kendradi-lagna", "Kendradi (lagna)", { ...st, why: `the stronger of the lagna and the 7th: ${st.why}` }, "The angles from the stronger of the lagna and the 7th, then the succedent and cadent signs, with Chara years.");
    kendradi("kendradi-ak", "Kendradi (Atmakaraka)", { sign: at(ak.planet).signIndex, why: `the sign of the Atmakaraka ${ak.planet} (46.176)` }, "The same order reckoned from the Atmakaraka's sign.");
  }
  // Karaka, 46.178.
  {
    specs.push({
      id: "karaka", name: "Karaka", verses: "178",
      summary: "The Atmakaraka's period first, then the other seven karakas in order; each as long as the count from the lagna to the karaka's sign.",
      start: { sign: at(ak.planet).signIndex, why: `the Atmakaraka ${ak.planet} (46.178)` },
      direction: "forward", directionWhy: "the karakas in their order: Atmakaraka to Darakaraka (46.178)",
      order: karakas.map((k) => at(k.planet).signIndex), years: (s) => houseFrom(lagnaIdx, s), yearsRule: "signs counted from the lagna to the karaka, inclusive (46.178)", provisional: true, antar: false,
      karakaLabels: karakas.map((k) => ({ karaka: k.karaka, planet: k.planet })),
    });
  }
  // Manduka, 46.179-180.
  {
    const st = strongerSign(lagnaIdx, H(7), positions);
    const dir = parityDir(st.sign);
    const step = dir === "forward" ? 1 : -1;
    const at12 = (k: number) => ((st.sign + step * k) % 12 + 12) % 12;
    const order = [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11].map(at12);
    specs.push({
      id: "manduka", name: "Manduka", verses: "179-180",
      summary: "Frog-leap order, every third sign from the stronger of the lagna and the 7th, with Sthira years.",
      start: { ...st, why: `the stronger of the lagna and the 7th: ${st.why}` },
      direction: dir, directionWhy: parityWhy(st.sign) + ", each dasa leaping to the third sign (46.180)",
      order, years: sy, yearsRule: "as in the Sthira dasa (46.180)", provisional: true, antar: true, antarProvisional: true,
    });
  }
  // Shula, 46.181-182.
  {
    const st = strongerSign(H(2), H(8), positions);
    specs.push({
      id: "shula", name: "Shula", verses: "181-182",
      summary: "From the stronger of the 2nd and 8th, with Sthira years; the sages framed it for the time of death.",
      start: { ...st, why: `the stronger of the 2nd and the 8th: ${st.why}` },
      direction: parityDir(st.sign), directionWhy: parityWhy(st.sign) + " (46.182)",
      order: seq(st.sign, parityDir(st.sign)), years: sy, yearsRule: "as in the Sthira dasa (46.182)", provisional: true, antar: true, antarProvisional: true,
      asWritten: "Death is possible in the dasa of the stronger maraka sign (46.182). Shown as written; this app does not judge the life span (chapter 43 is not applied).",
    });
  }
  // Trikona, 46.183-184.
  {
    const st = strongestOf([H(1), H(5), H(9)], positions);
    specs.push({
      id: "trikona", name: "Trikona", verses: "183-184",
      summary: "Like the Chara dasa, but starting from the strongest of the lagna, the 5th and the 9th.",
      start: { ...st, why: `the strongest of the lagna, 5th and 9th: ${st.why}` },
      direction: parityDir(st.sign), directionWhy: parityWhy(st.sign) + " (46.184)",
      order: seq(st.sign, parityDir(st.sign)), years: cy, yearsRule: "as in the Chara dasa (46.184)", provisional: true, antar: true,
    });
  }
  // Drig, 46.185-187.
  {
    const aspected = (s: number) => {
      const xs = SIGNS.map((_, i) => i).filter((i) => rasiAspects(s, i));
      const fwd = q(s) === "Fixed" || (q(s) === "Dual" && isOddSign(s));
      return xs.slice().sort((a, b) => (fwd ? houseFrom(s, a) - houseFrom(s, b) : houseFrom(a, s) - houseFrom(b, s)));
    };
    const raw = [9, 10, 11].flatMap((h) => [H(h), ...aspected(H(h))]);
    const order = raw.filter((s, i) => raw.indexOf(s) === i);
    const dropped = raw.length - order.length;
    specs.push({
      id: "drig", name: "Drig", verses: "185-187",
      summary: `The 9th sign and the signs it aspects, then the 10th and its aspected signs, then the 11th and its.${dropped ? ` For this lagna the scheme names ${order.length} distinct signs, ${dropped} of them twice; a sign already listed is not repeated (provisional), so ${SIGNS.map((_, i) => i).filter((i) => !order.includes(i)).map((i) => SIGNS[i]).join(" and ")} get no period.` : ""}`,
      start: { sign: H(9), why: "the sign of the 9th house (46.185)" },
      direction: "forward", directionWhy: "aspected signs run in reverse from a movable sign, onwards from a fixed sign, and by odd or even from a dual sign (46.187)",
      order, years: cy, yearsRule: "Chara years, which the text does not state for this dasa", provisional: true, antar: true, antarProvisional: true,
    });
  }
  // Nakshatra-based rasi dasa, 46.188-190.
  {
    const moon = at("Moon");
    const frac = (moon.lon % NAK_ARC) / NAK_ARC;
    const point = norm360(lagnaLon + frac * 360);
    const s = Math.floor(point / 30);
    const expired = point - s * 30;
    const y = cy(s);
    const bal = y * (1 - expired / 30);
    specs.push({
      id: "nakshatra", name: "Nakshatra-based", verses: "188-190",
      summary: "The Moon's progress in its nakshatra, taken twelve-fold and added to the lagna, fixes the opening sign and the balance at birth.",
      start: { sign: s, why: `the lagna plus ${(frac * 12).toFixed(2)} signs, the Moon having covered ${(frac * 100).toFixed(1)} percent of ${moon.nakshatra} (46.188-189)` },
      direction: parityDir(s), directionWhy: parityWhy(s) + " (46.189)",
      order: seq(s, parityDir(s)), years: cy, yearsRule: "Chara years, which the text does not state for this dasa", provisional: true, antar: true, antarProvisional: true,
      balanceYears: bal, balanceNote: `${expired.toFixed(2)} degrees of ${SIGNS[s]} expired: ${y} years less ${(y * expired / 30).toFixed(2)} leaves ${bal.toFixed(2)} years (46.190)`,
    });
  }

  const systems: RasiDasa[] = specs.map((sp) => {
    const periods: RasiPeriod[] = [];
    let cursor = birth;
    let elapsed = 0;
    const cycleYears = sp.order.reduce((a, s, i) => a + sp.years(s, i), 0);
    const maxYears = Math.max(100, cycleYears);
    for (let cycle = 0; cycle < 3 && elapsed < maxYears; cycle++) {
      for (let i = 0; i < sp.order.length && elapsed < maxYears; i++) {
        const sign = sp.order[i];
        let years = sp.years(sign, i);
        if (cycle === 0 && i === 0 && sp.balanceYears !== undefined) years = sp.balanceYears;
        const end = cursor.plus({ days: years * YEAR_DAYS });
        const current = asOf >= cursor && asOf < end;
        const p: RasiPeriod = { sign, years, start: cursor.toISO()!, end: end.toISO()!, ageStart: elapsed, ageEnd: elapsed + years, current, repeated: cycle > 0 };
        if (sp.karakaLabels) {
          p.karaka = sp.karakaLabels[i].karaka;
          p.planet = sp.karakaLabels[i].planet;
        }
        if (sp.antar) {
          const { order, start, rule } = antarOrder(sign, positions);
          const span = years / 12;
          p.antardasas = order.map((s, k) => {
            const a0 = cursor.plus({ days: span * k * YEAR_DAYS });
            const a1 = k === 11 ? end : cursor.plus({ days: span * (k + 1) * YEAR_DAYS });
            return { sign: s, start: a0.toISO()!, end: a1.toISO()!, current: asOf >= a0 && asOf < a1, note: rasiAntarNote(sign, s, deps) };
          });
          p.antarStart = start;
          p.antarRule = rule;
        }
        periods.push(p);
        cursor = end;
        elapsed += years;
      }
    }
    const cur = periods.find((p) => p.current);
    const readings = cur ? rasiDasaReadings(cur.sign, deps) : [];
    return {
      id: sp.id, name: sp.name, verses: sp.verses, url: CH46, summary: sp.summary, start: sp.start, direction: sp.direction, directionWhy: sp.directionWhy,
      yearsRule: sp.yearsRule, provisional: sp.provisional, balanceNote: sp.balanceNote, asWritten: sp.asWritten, periods, readings,
    };
  });

  return { systems, charaYears, brahma, karakas, caveats: RASI_DASA_CAVEATS_46, notComputed: NOT_COMPUTED };
}

export const KARAKA_NAME = (k: string) => CHARA_KARAKA_INFO[k as keyof typeof CHARA_KARAKA_INFO]?.name ?? k;
