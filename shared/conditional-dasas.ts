// BPHS chapter 46 (dasas of the planets), read from http://jyotishvidya.com/ch46.htm.
// 46.2-5 keeps Vimshottari for the general run of charts (computed in kp.ts from 46.12-16) and names
// the other nakshatra dasas as systems for special cases; 46.17-43 gives each its condition, its
// starting nakshatra, its order of lords and its years. Yogini (46.195-199) is given without a
// condition. Kala, Chakra, Kalachakra (ch. 49), the rasi dasas of 46.155-190, Panchaswara and the
// ayurdaya dasas are not computed here.
import { NAKSHATRAS, SIGN_LORD, SIGNS, norm360, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { DateTime } from "luxon";

const NAK_ARC = 360 / 27;
const YEAR_DAYS = 365.25;
const CH46 = BPHS_URL(46);

export interface ConditionalPeriod {
  lord: Planet;
  /** Yogini name, only for the Yogini dasa. */
  yogini?: string;
  years: number;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  /** True for periods after the first full cycle (the text does not say the cycle repeats). */
  repeated: boolean;
}

export interface ConditionalDasa {
  id: string;
  name: string;
  verses: string;
  url: string;
  /** Whether Parashara's condition for adopting this dasa holds in the chart. */
  applies: boolean;
  condition: string;
  /** Why the condition holds or fails in this chart. */
  reason: string;
  totalYears: number;
  firstLord: Planet;
  balanceYears: number;
  balanceNote: string;
  provisional: boolean;
  periods: ConditionalPeriod[];
}

export interface ConditionalDasasResult {
  systems: ConditionalDasa[];
  caveats: string[];
}

export const CONDITIONAL_DASA_CAVEATS: string[] = [
  "Chapter 46 keeps Vimshottari for the general run of charts (46.2-5, 46.12-16, shown above) and names nine other nakshatra dasas for special cases, each with the condition under which the sages adopt it (46.17-43). A chart can satisfy several conditions at once; Parashara does not rank them, so every system whose condition holds is listed and none is preferred. Yogini (46.195-199) is given without a condition and is always shown.",
  "Balance at birth: Ashtottari follows 46.21-22 (one nakshatra is a quarter of a malefic's dasa and a third of a benefic's, with Abhijit as the last quarter of Uttarashadha plus the first fifteenth of Shravana). Yogini follows 46.199 (the expired fraction of the birth nakshatra). For the other systems Parashara states no balance rule, so the expired fraction of the birth nakshatra is applied by analogy with 46.16 and marked provisional; for Dwadashottari, counted backwards to Revati, the same fraction is used. In Shashtihayani the translation assigns no lord to Chitra, which is taken with the Moon's group (provisional). The cycles are shorter than a life; periods after the first cycle are shown as repeated, which the text does not state. Sunrise and sunset for day and night birth come from the Shadbala module.",
  "The Ashtottari condition (46.17) is read as Rahu in an angle or trine counted from the sign of the lagna lord, but not in the lagna itself, a provisional reading of an ambiguous line. The hora of the lagna is the Parashari hora of chapter 6 (first half of an odd sign to the Sun, of an even sign to the Moon).",
];

type Spec = {
  id: string;
  name: string;
  verses: string;
  order: Planet[];
  years: Record<string, number>;
  /** Nakshatra (0 = Ashwini) from which the count begins, or a function giving the lord and count position. */
  from?: number;
  /** Count backwards to Revati (Dwadashottari). */
  toRevati?: boolean;
  condition: string;
  test: () => { ok: boolean; reason: string };
  provisional: boolean;
};

const ODD = (si: number) => si % 2 === 0;
const horaOfLagna = (si: number, deg: number): Planet => (deg < 15 ? (ODD(si) ? "Sun" : "Moon") : ODD(si) ? "Moon" : "Sun");
const navamsaOf = (si: number, deg: number) => (si * 9 + Math.floor(deg / (30 / 9))) % 12;
const dwadasamsaOf = (si: number, deg: number) => (si + Math.floor(deg / 2.5)) % 12;

/** 28-nakshatra index and the fraction elapsed inside it, with Abhijit per 46.22. */
function nak28(lon: number): { idx: number; frac: number } {
  const l = norm360(lon);
  const uaStart = 20 * NAK_ARC; // Uttarashadha 266°40'
  const abhStart = uaStart + (3 * NAK_ARC) / 4; // 276°40'
  const abhEnd = 21 * NAK_ARC + NAK_ARC / 15; // 280°53'20"
  const shrEnd = 22 * NAK_ARC; // 293°20'
  if (l >= uaStart && l < abhStart) return { idx: 20, frac: (l - uaStart) / (abhStart - uaStart) };
  if (l >= abhStart && l < abhEnd) return { idx: 21, frac: (l - abhStart) / (abhEnd - abhStart) };
  if (l >= abhEnd && l < shrEnd) return { idx: 22, frac: (l - abhEnd) / (shrEnd - abhEnd) };
  const n = Math.floor(l / NAK_ARC) % 27;
  return { idx: n >= 22 ? n + 1 : n, frac: (l - n * NAK_ARC) / NAK_ARC };
}
const NAK28_NAMES = [...NAKSHATRAS.slice(0, 21), "Abhijit", ...NAKSHATRAS.slice(21)];

/** Ashtottari groups, 46.17-20: four nakshatras from Ardra to the Sun, then three, four, three... */
const ASHTOTTARI_ORDER: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Rahu", "Venus"];
const ASHTOTTARI_YEARS: Record<string, number> = { Sun: 6, Moon: 15, Mars: 8, Mercury: 17, Saturn: 10, Jupiter: 19, Rahu: 12, Venus: 21 };
const ASHTOTTARI_GROUPS: number[][] = (() => {
  const g: number[][] = [];
  let n = 5; // Ardra
  for (let i = 0; i < 8; i++) {
    const len = i % 2 === 0 ? 4 : 3;
    g.push(Array.from({ length: len }, (_, k) => (n + k) % 28));
    n += len;
  }
  return g;
})();

/** Shashtihayani table, 46.41 (Chitra, unassigned in the translation, is taken with the Moon). */
const SHASHTI_ORDER: Planet[] = ["Jupiter", "Sun", "Mars", "Moon", "Mercury", "Venus", "Saturn", "Rahu"];
const SHASHTI_YEARS: Record<string, number> = { Jupiter: 10, Sun: 10, Mars: 10, Moon: 6, Mercury: 6, Venus: 6, Saturn: 6, Rahu: 6 };
const SHASHTI_GROUPS: number[][] = [[0, 1, 2, 6], [3, 4, 5, 20], [7, 8, 9, 27], [10, 11, 12, 13], [14, 15, 16], [17, 18, 19], [21, 22, 23], [24, 25, 26]];

const YOGINI_NAMES: Record<string, string> = { Moon: "Mangala", Sun: "Pingala", Jupiter: "Dhanya", Mars: "Bhramari", Mercury: "Bhadrika", Saturn: "Ulka", Venus: "Siddha", Rahu: "Sankata" };

export function conditionalDasas(positions: PlanetPosition[], lagnaLon: number, birthIso: string, asOfIso: string, daytime?: boolean, maxAge = 100): ConditionalDasasResult {
  const birth = DateTime.fromISO(birthIso);
  const asOf = DateTime.fromISO(asOfIso);
  const age = (d: DateTime) => d.diff(birth, "days").days / YEAR_DAYS;
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const lagnaIdx = Math.floor(norm360(lagnaLon) / 30);
  const lagnaDeg = norm360(lagnaLon) - lagnaIdx * 30;
  const houseOf = (pl: Planet) => ((pos(pl).signIndex - lagnaIdx + 12) % 12) + 1;
  const l1 = SIGN_LORD[lagnaIdx] as Planet;
  const l10 = SIGN_LORD[(lagnaIdx + 9) % 12] as Planet;
  const moon = pos("Moon"), sun = pos("Sun");
  const moonLon = norm360(moon.lon);
  const nak27 = Math.floor(moonLon / NAK_ARC) % 27;
  const frac27 = (moonLon - nak27 * NAK_ARC) / NAK_ARC;
  const shukla = norm360(moon.lon - sun.lon) < 180;
  const hora = horaOfLagna(lagnaIdx, lagnaDeg);
  const dayTxt = daytime === undefined ? "day or night birth not known" : daytime ? "a day birth" : "a night birth";
  const pakshaTxt = shukla ? "the bright half" : "the dark half";

  const build = (spec: { id: string; name: string; verses: string; condition: string; ok: boolean; reason: string; provisional: boolean; order: Planet[]; years: Record<string, number>; firstLord: Planet; balance: number; balanceNote: string; yogini?: boolean }): ConditionalDasa => {
    const total = spec.order.reduce((s, p) => s + spec.years[p], 0);
    const periods: ConditionalPeriod[] = [];
    let i = spec.order.indexOf(spec.firstLord);
    let t = birth;
    let first = true;
    let count = 0;
    while (age(t) < maxAge && count < 60) {
      const lord = spec.order[i % spec.order.length];
      const yrs = first ? spec.balance : spec.years[lord];
      const e = t.plus({ days: yrs * YEAR_DAYS });
      periods.push({ lord, yogini: spec.yogini ? YOGINI_NAMES[lord] : undefined, years: yrs, start: t.toISO()!, end: e.toISO()!, ageStart: age(t), ageEnd: age(e), current: asOf >= t && asOf < e, repeated: count >= spec.order.length });
      t = e;
      i++;
      first = false;
      count++;
    }
    return { id: spec.id, name: spec.name, verses: spec.verses, url: CH46, applies: spec.ok, condition: spec.condition, reason: spec.reason, totalYears: total, firstLord: spec.firstLord, balanceYears: spec.balance, balanceNote: spec.balanceNote, provisional: spec.provisional, periods };
  };

  /** Cyclic count from a starting nakshatra, lord = order[(count - 1) mod k]; balance by the expired fraction. */
  const cyclic = (id: string, name: string, verses: string, condition: string, t: { ok: boolean; reason: string }, from: number, order: Planet[], years: Record<string, number>, provisional: boolean, balanceNote: string, yogini = false, offset = 0) => {
    const count = ((nak27 - from + 27) % 27) + 1 + offset;
    const lord = order[(count - 1) % order.length];
    return build({ id, name, verses, condition, ok: t.ok, reason: t.reason, provisional, order, years, firstLord: lord, balance: years[lord] * (1 - frac27), balanceNote: `${NAKSHATRAS[nak27]} is the ${count}${count === 1 ? "st" : count === 2 ? "nd" : count === 3 ? "rd" : "th"} nakshatra counted from ${NAKSHATRAS[from]}${offset ? ` plus ${offset}` : ""}, giving ${lord}; ${balanceNote}`, yogini });
  };

  const systems: ConditionalDasa[] = [];

  // Ashtottari, 46.17-22
  {
    const rahuH = ((pos("Rahu").signIndex - pos(l1).signIndex + 12) % 12) + 1;
    const ok = houseOf("Rahu") !== 1 && [1, 4, 5, 7, 9, 10].includes(rahuH);
    const n28 = nak28(moonLon);
    const gi = ASHTOTTARI_GROUPS.findIndex((g) => g.includes(n28.idx));
    const lord = ASHTOTTARI_ORDER[gi];
    const group = ASHTOTTARI_GROUPS[gi];
    const done = group.indexOf(n28.idx);
    const share = ASHTOTTARI_YEARS[lord] / group.length;
    const balance = ASHTOTTARI_YEARS[lord] - share * (done + n28.frac);
    systems.push(build({
      id: "ashtottari", name: "Ashtottari (108 years)", verses: "17-22", condition: "Rahu in an angle or trine from the lagna lord, but not in the lagna",
      ok, reason: `Rahu is in the ${rahuH}${rahuH === 1 ? "st" : rahuH === 4 ? "th" : rahuH === 5 ? "th" : rahuH === 7 ? "th" : rahuH === 9 ? "th" : "th"} sign from ${l1}, the lagna lord${houseOf("Rahu") === 1 ? ", and in the lagna" : ""}.`,
      provisional: true, order: ASHTOTTARI_ORDER, years: ASHTOTTARI_YEARS, firstLord: lord, balance,
      balanceNote: `${NAK28_NAMES[n28.idx]} is the ${done + 1}${done === 0 ? "st" : done === 1 ? "nd" : done === 2 ? "rd" : "th"} of ${lord}'s ${group.length} nakshatras, each ${share.toFixed(2)} years (46.21-22).`,
    }));
  }
  // Shodashottari, 46.23-26
  {
    const byPaksha = daytime === undefined ? false : (daytime && !shukla) || (!daytime && shukla);
    const byHora = (hora === "Moon" && !shukla) || (hora === "Sun" && shukla);
    systems.push(cyclic("shodashottari", "Shodashottari (116 years)", "23-26", "day birth in the dark half or night birth in the bright half (46.23), or the lagna in the Moon's hora with a dark-half birth or in the Sun's hora with a bright-half birth (46.24)",
      { ok: byPaksha || byHora, reason: `${dayTxt.charAt(0).toUpperCase()}${dayTxt.slice(1)} in ${pakshaTxt}; the lagna at ${lagnaDeg.toFixed(1)} deg of ${SIGNS[lagnaIdx]} is in the ${hora}'s hora.` },
      7, ["Sun", "Mars", "Jupiter", "Saturn", "Ketu", "Moon", "Mercury", "Venus"], { Sun: 11, Mars: 12, Jupiter: 13, Saturn: 14, Ketu: 15, Moon: 16, Mercury: 17, Venus: 18 }, true, "balance by the expired fraction of the nakshatra (provisional)."));
  }
  // Dwadashottari, 46.27-28
  {
    const nl = SIGN_LORD[navamsaOf(lagnaIdx, lagnaDeg)] as Planet;
    const count = 27 - nak27;
    const order: Planet[] = ["Sun", "Jupiter", "Ketu", "Mercury", "Rahu", "Mars", "Saturn", "Moon"];
    const years: Record<string, number> = { Sun: 7, Jupiter: 9, Ketu: 11, Mercury: 13, Rahu: 15, Mars: 17, Saturn: 19, Moon: 21 };
    const lord = order[(count - 1) % 8];
    systems.push(build({ id: "dwadashottari", name: "Dwadashottari (112 years)", verses: "27-28", condition: "the lagna in a navamsa of Venus", ok: nl === "Venus", reason: `The lagna's navamsa is ${SIGNS[navamsaOf(lagnaIdx, lagnaDeg)]}, ruled by ${nl}.`, provisional: true, order, years, firstLord: lord, balance: years[lord] * (1 - frac27), balanceNote: `${count} nakshatras from ${NAKSHATRAS[nak27]} to Revati, giving ${lord}; balance by the expired fraction (provisional).` }));
  }
  // Panchottari, 46.29-30
  systems.push(cyclic("panchottari", "Panchottari (105 years)", "29-30", "Cancer lagna, also in a Cancer dwadasamsa",
    { ok: lagnaIdx === 3 && dwadasamsaOf(lagnaIdx, lagnaDeg) === 3, reason: `The lagna is ${SIGNS[lagnaIdx]}, in the ${SIGNS[dwadasamsaOf(lagnaIdx, lagnaDeg)]} dwadasamsa.` },
    16, ["Sun", "Mercury", "Saturn", "Mars", "Venus", "Moon", "Jupiter"], { Sun: 12, Mercury: 13, Saturn: 14, Mars: 15, Venus: 16, Moon: 17, Jupiter: 18 }, true, "balance by the expired fraction (provisional)."));
  // Shatabdika, 46.31-34
  systems.push(cyclic("shatabdika", "Shatabdika (100 years)", "31-34", "the lagna vargottama (the same sign in the rasi and the navamsa)",
    { ok: navamsaOf(lagnaIdx, lagnaDeg) === lagnaIdx, reason: `The lagna is ${SIGNS[lagnaIdx]} with its navamsa in ${SIGNS[navamsaOf(lagnaIdx, lagnaDeg)]}.` },
    26, ["Sun", "Moon", "Venus", "Mercury", "Jupiter", "Mars", "Saturn"], { Sun: 5, Moon: 5, Venus: 10, Mercury: 10, Jupiter: 20, Mars: 20, Saturn: 30 }, true, "balance by the expired fraction (provisional)."));
  // Chaturashiti-sama, 46.35-36
  systems.push(cyclic("chaturashiti", "Chaturashiti-sama (84 years)", "35-36", "the 10th lord in the 10th",
    { ok: houseOf(l10) === 10, reason: `${l10}, lord of the 10th, is in the ${houseOf(l10)}${houseOf(l10) === 1 ? "st" : houseOf(l10) === 2 ? "nd" : houseOf(l10) === 3 ? "rd" : "th"}.` },
    14, ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"], { Sun: 12, Moon: 12, Mars: 12, Mercury: 12, Jupiter: 12, Venus: 12, Saturn: 12 }, true, "balance by the expired fraction (provisional)."));
  // Dwisaptati-sama, 46.37-39
  systems.push(cyclic("dwisaptati", "Dwisaptati-sama (72 years)", "37-39", "the lagna lord in the lagna or the 7th",
    { ok: [1, 7].includes(houseOf(l1)), reason: `${l1}, lord of the lagna, is in the ${houseOf(l1)}${houseOf(l1) === 1 ? "st" : houseOf(l1) === 2 ? "nd" : houseOf(l1) === 3 ? "rd" : "th"}.` },
    18, ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu"], { Sun: 9, Moon: 9, Mars: 9, Mercury: 9, Jupiter: 9, Venus: 9, Saturn: 9, Rahu: 9 }, true, "balance by the expired fraction (provisional)."));
  // Shashtihayani, 46.40-41
  {
    const n28 = nak28(moonLon);
    const gi = SHASHTI_GROUPS.findIndex((g) => g.includes(n28.idx));
    const lord = SHASHTI_ORDER[gi];
    systems.push(build({ id: "shashtihayani", name: "Shashtihayani (60 years)", verses: "40-41", condition: "the Sun in the lagna", ok: houseOf("Sun") === 1, reason: `The Sun is in the ${houseOf("Sun")}${houseOf("Sun") === 1 ? "st" : houseOf("Sun") === 2 ? "nd" : houseOf("Sun") === 3 ? "rd" : "th"}.`, provisional: true, order: SHASHTI_ORDER, years: SHASHTI_YEARS, firstLord: lord, balance: SHASHTI_YEARS[lord] * (1 - n28.frac), balanceNote: `${NAK28_NAMES[n28.idx]} falls to ${lord} in the table of 46.41; balance by the expired fraction (provisional).` }));
  }
  // Shat-trimshat-sama, 46.42-43
  systems.push(cyclic("shattrimshat", "Shat-trimshat-sama (36 years)", "42-43", "day birth with the lagna in the Sun's hora, or night birth with the lagna in the Moon's hora",
    { ok: daytime === undefined ? false : (daytime && hora === "Sun") || (!daytime && hora === "Moon"), reason: `${dayTxt.charAt(0).toUpperCase()}${dayTxt.slice(1)}; the lagna is in the ${hora}'s hora.` },
    21, ["Moon", "Sun", "Jupiter", "Mars", "Mercury", "Saturn", "Venus", "Rahu"], { Moon: 1, Sun: 2, Jupiter: 3, Mars: 4, Mercury: 5, Saturn: 6, Venus: 7, Rahu: 8 }, true, "balance by the expired fraction (provisional)."));
  // Yogini, 46.195-199
  systems.push(cyclic("yogini", "Yogini (36 years)", "195-199", "none stated",
    { ok: true, reason: "Parashara gives the Yogini dasa for every chart." },
    0, ["Moon", "Sun", "Jupiter", "Mars", "Mercury", "Saturn", "Venus", "Rahu"], { Moon: 1, Sun: 2, Jupiter: 3, Mars: 4, Mercury: 5, Saturn: 6, Venus: 7, Rahu: 8 }, false, "balance from the expired part of the nakshatra (46.199).", true, 3));

  return { systems, caveats: CONDITIONAL_DASA_CAVEATS };
}
