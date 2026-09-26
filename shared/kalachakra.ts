// Kalachakra dasa: construction from BPHS ch. 46.52-154 (http://jyotishvidya.com/ch46.htm), effects from
// ch. 49 (http://jyotishvidya.com/ch49.htm). Read in R. Santhanam's translation as posted there.
//
// The two chakras: Savya holds Ashwini, Bharani, Krittika and every following triplet that skips one
// (Punarvasu-Ashlesha, Hasta-Swati, Mula-Uttarashadha, Purvabhadra-Revati), Apsavya the other four
// triplets (46.56-58). Each nakshatra pada is a navamsa; a birth navamsa fixes nine signs in a stated
// order (46.60-81), the first being Deha and the last Jiva in Savya and the reverse in Apsavya (46.94).
// Sign years follow their lords (46.84): Sun 5, Moon 21, Mars 7, Mercury 9, Jupiter 10, Venus 16,
// Saturn 4. The nine signs sum to 100, 85, 83 or 86 years by navamsa (46.89). The expired part is the
// fraction of the navamsa passed times that total (46.93); the dasa begins in whichever sign of the
// nine that lands in, and the order then continues and repeats as in the worked example (46.95).
import { NAKSHATRAS, SIGNS, SIGN_LORD, houseFrom, norm360, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { DateTime } from "luxon";

const NAK_ARC = 360 / 27;
const NAV_ARC = NAK_ARC / 4;
const YEAR_DAYS = 365.25;
const CH46 = BPHS_URL(46);
const CH49 = BPHS_URL(49);

/** Years of each sign by its lord, 46.84. */
export const KC_SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10];

const S = (name: string) => SIGNS.indexOf(name as (typeof SIGNS)[number]);
// Savya sequences by the navamsa sign of the Moon, 46.60-69; the same nine serve the 5th and 9th sign
// from each (46.89), so Sagittarius reads as Aries, Capricorn as Taurus and so on.
const SAVYA_SEQ: Record<number, string[]> = {
  0: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"], // 46.60, 100 years
  1: ["Capricorn", "Aquarius", "Pisces", "Scorpio", "Libra", "Virgo", "Cancer", "Leo", "Gemini"], // 46.61, 85
  2: ["Taurus", "Aries", "Pisces", "Aquarius", "Capricorn", "Sagittarius", "Aries", "Taurus", "Gemini"], // 46.62, 83
  3: ["Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"], // 46.63-64, 86
  4: ["Scorpio", "Libra", "Virgo", "Cancer", "Leo", "Gemini", "Taurus", "Aries", "Pisces"], // 46.66, 100
  5: ["Aquarius", "Capricorn", "Sagittarius", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo"], // 46.67, 85
  6: ["Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces", "Scorpio", "Libra", "Virgo"], // 46.68, 83
  7: ["Cancer", "Leo", "Gemini", "Taurus", "Aries", "Pisces", "Aquarius", "Capricorn", "Sagittarius"], // 46.69, 86
};
// amsa 8 (Sagittarius) -> 0, 9 -> 1, 10 -> 2, 11 -> 3; 0-7 as themselves.
function sequenceOf(amsa: number): number[] {
  const key = amsa < 8 ? amsa : amsa - 8;
  return SAVYA_SEQ[key].map(S);
}

/** Is the nakshatra in the Savya chakra (46.56-58)? Triplets alternate starting with Ashwini-Krittika. */
export const isSavya = (nak: number) => Math.floor(nak / 3) % 2 === 0;

export interface KcPeriod {
  sign: number;
  years: number;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  /** Position in the nine-sign cycle (0-8). */
  step: number;
  /** Periods after the first pass through the nine signs, continued as in the worked example 46.95. */
  repeated: boolean;
  /** Movement from the previous sign, 46.96-100. */
  gati?: "Manduki" | "Markati" | "Simhavalokana";
  gatiFrom?: number;
}

export interface KcSubPeriod {
  sign: number;
  years: number;
  start: string;
  end: string;
  current: boolean;
  /** Effect from ch. 49.6-34 for this navamsa sub-period of the dasa sign. */
  effect?: string;
}

export interface KcReading {
  label: string;
  text: string;
  source: { label: string; url: string; provisional?: boolean };
  tone: "support" | "strain" | "mixed";
}

export interface KalachakraResult {
  chakra: "Savya" | "Apsavya";
  nakshatra: string;
  pada: number;
  /** Navamsa sign (0 = Aries) that fixes the sequence, 46.87-88. */
  amsa: number;
  sequence: number[];
  deha: number;
  jiva: number;
  totalYears: number;
  expiredYears: number;
  balanceYears: number;
  periods: KcPeriod[];
  /** 46.120-122: character by birth navamsa. */
  amsaNature?: string;
  /** 46.123-128: planets in the Deha and Jiva signs. */
  dehaJiva: KcReading[];
  subPeriods: (p: KcPeriod) => KcSubPeriod[];
  readingsFor: (p: KcPeriod) => KcReading[];
  caveats: string[];
}

export const KALACHAKRA_CAVEATS: string[] = [
  "Construction follows BPHS 46.52-95: the birth nakshatra is placed in the Savya or Apsavya chakra (46.56-58), the pada gives the navamsa sign and its nine-sign order (46.60-81, 46.87-88), the years are those of the sign lords (46.84) and the expired part at birth is the elapsed fraction of the navamsa times the full total (46.93). After the ninth sign the same order is taken up again, as the worked example does (46.95); some later authors run on into the next navamsa's order instead, which is not what the text shows.",
  "The translation has two visible slips that are corrected here from the stated totals: in the first pada of Rohini the ninth sign is read as Cancer, not Libra, so that the nine sum to 86 as 46.89 requires, and in the second pada of Rohini the ninth sign is read as Libra, not a repeated Scorpio, to sum to 83. Both are marked provisional. The fourth pada of Bharani names Aquarius as Jiva while its order ends in Sagittarius; the order is followed.",
  "Sub-periods take the nine-sign order that ch. 49 itself uses for each sign's navamsa effects (49.6-34), which is the Savya order of that sign's navamsa, in proportion to the sign years; for Apsavya births the same order is reversed, which the text does not state (provisional). Effects by house (46.131-154) and by the sign's lord or occupant (49.1-5) are quoted as written; benefic and malefic signs are taken by the natural nature of the sign lord (provisional). The movements Manduki, Markati and Simhavalokana are read from the named pairs in 46.99-100 only.",
];

const HOUSE_EFFECT: Record<number, { text: string; verses: string; tone: "support" | "strain" | "mixed" }> = {
  1: { text: "the body keeps well and life runs with many comforts; a benefic sign gives this in full, a malefic sign inclines to ill health, and an exalted or own-sign planet in the lagna brings respect from those in power and wealth", verses: "131-132", tone: "support" },
  2: { text: "good food, happiness through spouse and children, gain of wealth, progress in learning, a ready tongue and good company; in full for a benefic sign, mixed otherwise", verses: "133-134", tone: "support" },
  3: { text: "happiness from siblings, courage, patience, comforts, gold, ornaments and clothes, recognition from those in power; in full for a benefic sign, with some adversity otherwise", verses: "135-136", tone: "support" },
  4: { text: "good relations with kin, gain of land, houses or authority, conveyances and clothes, sound health; in full for a benefic sign, with adverse results as well for a malefic one", verses: "137-138", tone: "support" },
  5: { text: "spouse and children, favours from the state, health, good friends, fame, learning, patience and courage; in full for a benefic sign, with adverse results as well for a malefic one", verses: "139-140", tone: "support" },
  6: { text: "danger from those in power, fire and weapons, and illnesses such as diabetes, abdominal swellings and jaundice; in full for a malefic sign, softened for a benefic one", verses: "141-142", tone: "strain" },
  7: { text: "marriage, conjugal happiness, children, gain of produce, cattle and clothes, favour and recognition from the state, fame; in full for a benefic sign, meagre for a malefic one", verses: "143-144", tone: "support" },
  8: { text: "loss of a dwelling, distress, loss of wealth, poverty and danger from enemies; in full for a malefic sign, softened for a benefic one", verses: "145-146", tone: "strain" },
  9: { text: "felicity through spouse, children, house and fields, pious deeds, religious inclination and the company of religious leaders; in full for a benefic sign, very little for a malefic one", verses: "147-148", tone: "support" },
  10: { text: "gain of authority, recognition from those in power, happiness from spouse and children, success in ventures and pious deeds; in full for a benefic sign, few for a malefic one", verses: "149-150", tone: "support" },
  11: { text: "felicity from spouse, children and kin, favours from the state, wealth and clothes, good company; in full for a benefic sign, very little for a malefic one", verses: "151-152", tone: "support" },
  12: { text: "failure in efforts, bodily pain, loss of position, poverty and needless spending; in full for a malefic sign, some good for a benefic one", verses: "153-154", tone: "strain" },
};

/** 49.1-5, by the planet owning or occupying the dasa sign. */
const PLANET_EFFECT: Record<string, { text: string; tone: "support" | "strain" | "mixed" }> = {
  Sun: { text: "ill health through blood or bile", tone: "strain" },
  Moon: { text: "gain of wealth and clothes, name and fame, birth of children", tone: "support" },
  Mars: { text: "bilious fever, gout and wounds", tone: "strain" },
  Mercury: { text: "gain of wealth and birth of children", tone: "support" },
  Jupiter: { text: "more children, gain of wealth and enjoyment", tone: "support" },
  Venus: { text: "learning, marriage and gain of wealth", tone: "support" },
  Saturn: { text: "adverse happenings of every kind", tone: "strain" },
};

/** 49.6-34: effect of each navamsa sub-period within a sign's dasa, keyed by dasa sign then sub-period step. */
const SUB_EFFECT: Record<number, (string | undefined)[]> = {
  0: ["distress from disorders of the blood", "growth of wealth and produce", "advance in knowledge", "gain of wealth", "danger from enemies", "distress to the spouse", "authority", "death-like danger, shown as written", "gain of wealth"], // 49.6-7
  1: ["undesirable deeds and other adverse effects", "profit in trade", "success in all ventures", "danger from fire", "recognition from the state and respect from all", "danger from enemies", "distress to the spouse", "eye disease", "obstacles to livelihood"], // 49.8-10
  2: ["gain of wealth", "attacks of fever", "affection with the maternal uncle", "more enemies", "danger from thieves", "more weapons", undefined, "injury by a weapon", "enjoyment"], // 49.11-12 (the seventh sub-period is not given)
  3: ["distress", "displeasure of those in power", "respect from kin", "beneficence", "obstacles through the father", "growth of learning and wealth", "danger from water", "growth of produce", "more wealth and enjoyment"], // 49.13-15
  4: ["distress and disputes", "extraordinary gains", "gain of wealth", "danger from wild animals", "birth of a son", "more enemies", "gain from sale of cattle", "danger from animals", "journeys to distant places"], // 49.16-17
  5: ["gain of wealth", "financial gain", "mingling with kin", "happiness from the mother", "birth of children", "more enemies", "love with a woman", "aggravation of disease", "birth of children"], // 49.18-19
  6: ["financial gain", "good relations with kin", "happiness from the father", "disputes with the mother", "birth of a son and financial gain", "entanglement with enemies", "disputes with women", "danger from water", "more financial gain"], // 49.20-22
  7: ["financial gain", "opposition to those in power", "gain of land", "financial gain", "danger from reptiles", "danger from water", "profit in trade", "possible disease", "financial gain"], // 49.23-24
  8: ["financial gain", "more land", "success in ventures", "success all round", "growth of accumulated wealth", "disputes", "financial gain", "affliction by disease", "happiness from children"], // 49.25-27
  9: ["happiness from children", "gain of produce", "well-being", "danger from poison", "financial gain", "more enemies", "gain of property", "danger from wild animals", "danger of a fall from a tree"], // 49.28-29
  10: ["financial gain", "eye disease", "journeys to distant places", "growth of wealth", "success in all ventures", "more enemies", "loss of happiness and enjoyment", "death-like danger, shown as written", "well-being"], // 49.30-32
  11: ["growth of wealth", "recognition from the state", "financial gain", "gains from all sources", "fever", "more enemies", "conjugal disputes", "danger from water", "good fortune all round"], // 49.33-34
};
const SUB_VERSES: Record<number, string> = { 0: "6-7", 1: "8-10", 2: "11-12", 3: "13-15", 4: "16-17", 5: "18-19", 6: "20-22", 7: "23-24", 8: "25-27", 9: "28-29", 10: "30-32", 11: "33-34" };

const AMSA_NATURE: Record<number, string> = { 0: "brave, and inclined to take what is not given", 1: "wealthy", 2: "learned", 3: "one who rules", 4: "respected by those in power", 5: "learned", 6: "a minister or adviser", 8: "sinful, shown as written", 10: "a person of business", 11: "wealthy" };

/** 46.99-100, the named movements. */
function gatiOf(from: number, to: number): KcPeriod["gati"] | undefined {
  const f = SIGNS[from], t = SIGNS[to];
  if ((f === "Virgo" && t === "Cancer") || (f === "Leo" && t === "Gemini")) return "Manduki";
  if (f === "Leo" && t === "Cancer") return "Markati";
  if ((f === "Pisces" && t === "Scorpio") || (f === "Sagittarius" && t === "Aries")) return "Simhavalokana";
  return undefined;
}

const GATI_EFFECT: Record<"Savya" | "Apsavya", Record<string, string>> = {
  Savya: {
    Manduki: "distress to friends, relations, parents and elders, and trouble from poison, weapons, thieves and enemies; from Leo to Gemini also danger to the mother or the self, trouble from the state and brain fever (46.101-102)",
    Markati: "loss of wealth, produce and animals, loss of the father or an elder relation, lethargy (46.103)",
    Simhavalokana: "injury from animals, loss of friends' goodwill, distress to near relations, falls and drowning, harm from poison, weapons and disease, loss of the dwelling (46.104-105)",
  },
  Apsavya: {
    Manduki: "distress to the spouse, loss of children, fevers and loss of position (46.106)",
    Markati: "danger from water, loss of position, distress from the father, punishment from the state and wandering (46.107)",
    Simhavalokana: "loss of the dwelling and loss of the father (46.108)",
  },
};
const GATI_PAIR: Record<string, string> = {
  "Pisces-Scorpio": "fever (46.109)",
  "Virgo-Cancer": "loss of brothers and kin (46.109)",
  "Leo-Gemini": "ill health of the spouse (46.110)",
  "Leo-Cancer": "danger to life, shown as written (46.110)",
  "Sagittarius-Aries": "loss of uncles and like relations (46.111)",
};

export function computeKalachakra(positions: PlanetPosition[], lagnaLon: number, birthIso: string, asOfIso: string, benefic: (p: PlanetPosition) => boolean, maxAge = 100): KalachakraResult {
  const birth = DateTime.fromISO(birthIso);
  const asOf = DateTime.fromISO(asOfIso);
  const age = (d: DateTime) => d.diff(birth, "days").days / YEAR_DAYS;
  const lagnaIdx = Math.floor(norm360(lagnaLon) / 30);
  const moonLon = norm360(positions.find((p) => p.planet === "Moon")!.lon);
  const nak = Math.floor(moonLon / NAK_ARC) % 27;
  const padaIdx = Math.floor((moonLon - nak * NAK_ARC) / NAV_ARC); // 0-3
  const fracNav = (moonLon - nak * NAK_ARC - padaIdx * NAV_ARC) / NAV_ARC;
  const savya = isSavya(nak);
  const t = nak % 3; // position within the triplet
  // Savya: navamsa from Aries onwards (46.87-88). Apsavya: the chakra runs from Scorpio backwards (46.71-72),
  // so Rohini's padas read Scorpio, Libra, Virgo, Leo, Mrigashira's Cancer to Aries, Ardra's Pisces to Sagittarius,
  // as the stated sequences and totals of 46.73-81 show.
  const amsa = savya ? (t * 4 + padaIdx) % 12 : (((7 - t * 4 - padaIdx) % 12) + 12) % 12;
  const base = sequenceOf(amsa);
  const sequence = savya ? base : Array.from(base).reverse();
  const totalYears = sequence.reduce((s, si) => s + KC_SIGN_YEARS[si], 0);
  const deha = savya ? sequence[0] : sequence[8];
  const jiva = savya ? sequence[8] : sequence[0];
  const expiredYears = fracNav * totalYears;

  // Find the starting sign and balance (46.93, 46.95).
  let acc = 0, step = 0;
  while (step < 8 && acc + KC_SIGN_YEARS[sequence[step]] <= expiredYears) {
    acc += KC_SIGN_YEARS[sequence[step]];
    step++;
  }
  const balanceYears = acc + KC_SIGN_YEARS[sequence[step]] - expiredYears;

  const periods: KcPeriod[] = [];
  let tm = birth;
  let i = step, n = 0;
  while (age(tm) < maxAge && n < 40) {
    const s = i % 9;
    const sign = sequence[s];
    const yrs = n === 0 ? balanceYears : KC_SIGN_YEARS[sign];
    const e = tm.plus({ days: yrs * YEAR_DAYS });
    const prev = periods.length ? periods[periods.length - 1].sign : undefined;
    const g = prev !== undefined ? gatiOf(prev, sign) : undefined;
    periods.push({ sign, years: yrs, start: tm.toISO()!, end: e.toISO()!, ageStart: age(tm), ageEnd: age(e), current: asOf >= tm && asOf < e, step: s, repeated: i >= 9, gati: g, gatiFrom: g ? prev : undefined });
    tm = e;
    i++;
    n++;
  }

  const inSign = (si: number) => positions.filter((p) => p.signIndex === si);
  const isMal = (p: PlanetPosition) => !benefic(p);
  const dehaJiva: KcReading[] = [];
  {
    const dj = [...inSign(deha), ...(jiva !== deha ? inSign(jiva) : [])];
    const mals = dj.filter(isMal);
    const bens = dj.filter((p) => !isMal(p));
    const where = deha === jiva ? `${SIGNS[deha]} (Deha and Jiva)` : `${SIGNS[deha]} (Deha) and ${SIGNS[jiva]} (Jiva)`;
    if (dj.length === 0) dehaJiva.push({ label: "Deha and Jiva", text: `No planet stands in ${where}, so the sharp lines of 46.123-128 do not arise.`, source: { label: "Parashara 46.123-128", url: CH46 }, tone: "support" });
    else {
      const parts: string[] = [];
      const hard = dj.filter((p) => ["Sun", "Mars", "Saturn", "Rahu"].includes(p.planet));
      if (hard.length) parts.push(`${hard.map((p) => p.planet).join(", ")} in the Deha or Jiva sign: the text gives danger to life, shown as written, worse when two or more of the Sun, Mars, Saturn and Rahu are so placed`);
      if (mals.length === 1) parts.push(`one malefic there gives ill health (Deha) or timidity (Jiva)`);
      if (mals.length === 2) parts.push(`two malefics give distress and disease`);
      if (mals.length >= 3) parts.push(`${mals.length} malefics: the text speaks of an early end, shown as written`);
      const fear: Record<string, string> = { Sun: "fire", Moon: "water", Mars: "weapons", Mercury: "windy disorders", Saturn: "abdominal swellings", Rahu: "poison", Ketu: "poison" };
      const fears = dj.filter((p) => fear[p.planet]).map((p) => `${p.planet} for ${fear[p.planet]}`);
      if (fears.length) parts.push(`specific fears: ${fears.join(", ")}`);
      if (bens.length && !mals.length) parts.push(`with only benefics (${bens.map((p) => p.planet).join(", ")}) there: wealth, every comfort and good health`);
      if (bens.length && mals.length) parts.push(`benefics and malefics together give mixed results`);
      dehaJiva.push({ label: "Deha and Jiva", text: `${dj.map((p) => p.planet).join(", ")} in ${where}. ${parts.join("; ")}.`, source: { label: "Parashara 46.123-128", url: CH46 }, tone: mals.length && !bens.length ? "strain" : mals.length ? "mixed" : "support" });
    }
  }

  const beneficSign = (si: number) => ["Jupiter", "Venus", "Mercury", "Moon"].includes(SIGN_LORD[si]);

  const readingsFor = (p: KcPeriod): KcReading[] => {
    const out: KcReading[] = [];
    const h = houseFrom(lagnaIdx, p.sign);
    const he = HOUSE_EFFECT[h];
    const bs = beneficSign(p.sign);
    out.push({ label: `Sign in the ${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"} house`, text: `${SIGNS[p.sign]} is the ${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"} sign from the lagna and a ${bs ? "benefic" : "malefic"} sign by its lord ${SIGN_LORD[p.sign]}: ${he.text}.`, source: { label: `Parashara 46.${he.verses}`, url: CH46, provisional: true }, tone: he.tone === "support" ? (bs ? "support" : "mixed") : bs ? "mixed" : "strain" });
    const occ = inSign(p.sign);
    const lord = SIGN_LORD[p.sign];
    const occTxt = occ.filter((o) => PLANET_EFFECT[o.planet]).map((o) => `${o.planet} occupying: ${PLANET_EFFECT[o.planet].text}`);
    const lordTxt = PLANET_EFFECT[lord] ? `${lord} owning: ${PLANET_EFFECT[lord].text}` : "";
    const tones = [PLANET_EFFECT[lord]?.tone, ...occ.map((o) => PLANET_EFFECT[o.planet]?.tone)].filter(Boolean) as string[];
    out.push({ label: "By lord and occupant", text: `${[lordTxt, ...occTxt].filter(Boolean).join("; ")}.${occ.length ? "" : " No planet occupies the sign."}`, source: { label: "Parashara 49.1-5", url: CH49 }, tone: tones.every((x) => x === "support") ? "support" : tones.every((x) => x === "strain") ? "strain" : "mixed" });
    const bensIn = occ.filter((o) => !isMal(o)).length, malsIn = occ.filter(isMal).length;
    if (occ.length) out.push({ label: "Nature of the sign", text: `${bs ? "A benefic" : "A malefic"} sign ${malsIn && !bensIn ? "occupied by malefics" : bensIn && !malsIn ? "occupied by benefics" : "occupied by both kinds"}: ${(bs && bensIn && !malsIn) ? "favourable" : (!bs && malsIn && !bensIn) ? "body and spirit in distress" : "mixed"} (46.129-130); 46.111 likewise reads a sign joined by a malefic as adverse and by a benefic as favourable.`, source: { label: "Parashara 46.129-130", url: CH46, provisional: true }, tone: (bs && bensIn && !malsIn) ? "support" : (!bs && malsIn && !bensIn) ? "strain" : "mixed" });
    if (p.gati && p.gatiFrom !== undefined) {
      const pair = GATI_PAIR[`${SIGNS[p.gatiFrom]}-${SIGNS[p.sign]}`];
      out.push({ label: `${p.gati} gati`, text: `The order moves from ${SIGNS[p.gatiFrom]} to ${SIGNS[p.sign]}, a ${p.gati} movement${savya ? "" : " in the Apsavya chakra"}: ${GATI_EFFECT[savya ? "Savya" : "Apsavya"][p.gati]}${pair ? `; for this pair the text adds ${pair}` : ""}.`, source: { label: "Parashara 46.96-111", url: CH46 }, tone: "strain" });
    }
    return out;
  };

  const subPeriods = (p: KcPeriod): KcSubPeriod[] => {
    const order = sequenceOf(p.sign);
    const seq = savya ? order : Array.from(order).reverse();
    const tot = seq.reduce((s, si) => s + KC_SIGN_YEARS[si], 0);
    const ps = DateTime.fromISO(p.start);
    const pe = DateTime.fromISO(p.end);
    // For the first (balance) period the sub-periods that expired before birth are dropped: the sub-period
    // series is laid over the full sign years ending at the period's end.
    const fullDays = KC_SIGN_YEARS[p.sign] * YEAR_DAYS;
    const t0 = pe.minus({ days: fullDays });
    const out: KcSubPeriod[] = [];
    let tm = t0;
    const effects = SUB_EFFECT[p.sign];
    seq.forEach((si, k) => {
      const days = (KC_SIGN_YEARS[si] / tot) * fullDays;
      const e = tm.plus({ days });
      if (e > ps) {
        const st = tm < ps ? ps : tm;
        out.push({ sign: si, years: e.diff(st, "days").days / YEAR_DAYS, start: st.toISO()!, end: e.toISO()!, current: asOf >= st && asOf < e, effect: effects?.[savya ? k : 8 - k] });
      }
      tm = e;
    });
    return out;
  };

  return {
    chakra: savya ? "Savya" : "Apsavya",
    nakshatra: NAKSHATRAS[nak],
    pada: padaIdx + 1,
    amsa,
    sequence,
    deha,
    jiva,
    totalYears,
    expiredYears,
    balanceYears,
    periods,
    amsaNature: AMSA_NATURE[amsa],
    dehaJiva,
    subPeriods,
    readingsFor,
    caveats: KALACHAKRA_CAVEATS,
  };
}

export const KC_SUB_VERSES = SUB_VERSES;
export const KC_CH46 = CH46;
export const KC_CH49 = CH49;
