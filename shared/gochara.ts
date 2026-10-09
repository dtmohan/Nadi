/**
 * Gochara — transit results counted from the natal Moon, after Brihat Samhita ch. 104 (Varahamihira, tr. N. Chidambaram
 * Iyer, 1884) and Phaladeepika ch. 26 (Mantreswara, tr. V. Subrahmanya Sastri, 1937). Both texts take the Moon's sign as
 * the reference (Phaladeepika 26.1), list the same favourable houses (BS 104.4, PD 26.2), and give house-by-house
 * results (BS 104.5-45, PD 26.9-24). Phaladeepika adds the vedha (obstruction) points (26.3-8), the aspect rule (26.30,
 * with BS 104.52-53), the dignity rule (26.31-32), the danger houses (26.33-34) and the Ashtakavarga rule (26.41). Nothing
 * here is Parashari: BPHS treats transit only through Ashtakavarga.
 */
import { redactSensitive } from "./life-stage";
import { ENEMIES, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { computeAshtakavarga, type AshtakavargaResult } from "./ashtakavarga";

export const BS_URL = "https://www.wisdomlib.org/hinduism/book/brihat-samhita/d/doc229368.html";
export const PD_URL = "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html";

export interface GocharaSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export const BS = (verse: string, provisional?: boolean): GocharaSource => ({ label: `Brihat Samhita 104.${verse}`, url: BS_URL, ...(provisional ? { provisional: true } : {}) });
export const PD = (verse: string, provisional?: boolean): GocharaSource => ({ label: `Phaladeepika 26.${verse}`, url: PD_URL, ...(provisional ? { provisional: true } : {}) });

export type GocharaPlanet = Planet;

/** Houses from the Moon in which each planet gives good results (BS 104.4; PD 26.2). Rahu and Ketu follow the Sun in Phaladeepika only. */
export const FAVOURABLE: Record<Planet, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 10, 11],
  Ketu: [3, 6, 10, 11],
};

/** Vedha: favourable house → the house whose occupant spoils it (PD 26.3-8), with the planet exempt from causing it. */
export const VEDHA: Record<Planet, { points: Record<number, number>; exempt?: Planet; source: GocharaSource }> = {
  Sun: { points: { 11: 5, 3: 9, 10: 4, 6: 12 }, exempt: "Saturn", source: PD("3") },
  Moon: { points: { 7: 2, 1: 5, 6: 12, 11: 8, 10: 4, 3: 9 }, exempt: "Mercury", source: PD("4") },
  Mars: { points: { 3: 12, 11: 5, 6: 9 }, source: PD("5") },
  Saturn: { points: { 3: 12, 11: 5, 6: 9 }, exempt: "Sun", source: PD("5") },
  Mercury: { points: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 }, exempt: "Moon", source: PD("6") },
  Jupiter: { points: { 2: 12, 11: 8, 9: 10, 5: 4, 7: 3 }, source: PD("7") },
  Venus: { points: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 12: 6, 11: 3 }, source: PD("8") },
  // Phaladeepika gives no vedha table for the nodes; the Sun's is applied because 26.2 makes them "similar to the Sun".
  Rahu: { points: { 11: 5, 3: 9, 10: 4, 6: 12 }, exempt: "Saturn", source: PD("2-3", true) },
  Ketu: { points: { 11: 5, 3: 9, 10: 4, 6: 12 }, exempt: "Saturn", source: PD("2-3", true) },
};

/** Which planets can cause vedha: the seven visible planets (the nodes are not named as obstructors in 26.3-8). */
const OBSTRUCTORS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/**
 * Full aspects, counted sign to sign from the aspecting planet: every planet the 7th; Mars also the 4th and 8th, Jupiter the
 * 5th and 9th, Saturn the 3rd and 10th. Phaladeepika 26.30 does not say which aspects count, so full aspects only is a
 * reading (provisional). The nodes cast none here, and as with vedha only the seven visible planets aspect.
 */
export const FULL_ASPECTS: Partial<Record<Planet, number[]>> = {
  Sun: [7],
  Moon: [7],
  Mercury: [7],
  Venus: [7],
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
};

/** Phaladeepika's own classes, given in its notes on the Sarvatobhadra chakra (ch. 26, after 26.48). */
export const NATURE_SOURCE: GocharaSource = { label: "Phaladeepika 26.48 notes", url: PD_URL };
const NATURAL_MALEFICS = new Set<Planet>(["Saturn", "Sun", "Rahu", "Ketu", "Mars"]);

/**
 * Benefic or malefic in transit as Phaladeepika classes them (ch. 26, Sarvatobhadra notes): Saturn, the Sun, Rahu, Ketu and
 * Mars are malefic and the rest benefic; Mercury is malefic when with a malefic (read here as in the same sign), and so is the
 * waning Moon (more than 180° past the Sun).
 */
export function natureOf(planet: Planet, transits: PlanetPosition[]): "benefic" | "malefic" {
  if (NATURAL_MALEFICS.has(planet)) return "malefic";
  const me = transits.find((p) => p.planet === planet);
  if (!me) return "benefic";
  if (planet === "Mercury" && transits.some((q) => q.planet !== "Mercury" && NATURAL_MALEFICS.has(q.planet) && q.signIndex === me.signIndex)) return "malefic";
  if (planet === "Moon") {
    const sun = transits.find((p) => p.planet === "Sun");
    if (sun && ((((me.lon - sun.lon) % 360) + 360) % 360) >= 180) return "malefic";
  }
  return "benefic";
}

export interface GocharaAspect {
  by: Planet;
  /** Which aspect, counted from the aspecting planet (3, 4, 5, 7, 8, 9 or 10). */
  aspect: number;
  nature: "benefic" | "malefic";
  /** The aspecting planet is a natural enemy of the aspected one (the seven planets' rows of the friendship table). */
  enemy: boolean;
}

/** Full aspects falling on a transiting planet from the other transiting planets. */
export function aspectsOn(target: PlanetPosition, transits: PlanetPosition[]): GocharaAspect[] {
  const out: GocharaAspect[] = [];
  for (const q of transits) {
    if (q.planet === target.planet || !OBSTRUCTORS.includes(q.planet)) continue;
    const n = houseFrom(q.signIndex, target.signIndex);
    if (!FULL_ASPECTS[q.planet]?.includes(n)) continue;
    out.push({
      by: q.planet,
      aspect: n,
      nature: natureOf(q.planet, transits),
      // The node rows of the friendship table follow the Nadi convention, so the nodes are never counted as enemies here.
      enemy: OBSTRUCTORS.includes(target.planet) && ENEMIES[target.planet].includes(q.planet),
    });
  }
  return out;
}

/** Rekhas (benefic marks, 0-8) per sign in each planet's own Ashtakavarga of the birth chart, Aries first. */
export type OwnMarks = Partial<Record<Planet, number[]>>;

export function ownMarksFrom(av: AshtakavargaResult): OwnMarks {
  const out: OwnMarks = {};
  for (const c of av.charts) if (c.owner !== "Lagna") out[c.owner] = [...c.rekhas];
  return out;
}

/** The own-Ashtakavarga marks of a birth chart (BPHS 66), from the natal positions and the lagna's longitude. */
export function natalOwnMarks(positions: PlanetPosition[], lagnaLon: number): OwnMarks {
  return ownMarksFrom(computeAshtakavarga(positions, Math.floor((((lagnaLon % 360) + 360) % 360) / 30)));
}

export interface GocharaOptions {
  /** The birth chart's own-Ashtakavarga marks, for Phaladeepika 26.41. Without them that rule is not applied. */
  ownMarks?: OwnMarks;
}

/** Marks of eight at or above which Phaladeepika 26.41's "more benefic dots" is read as met (provisional). */
export const AV_GOOD_MARKS = 5;

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const aspectText = (a: GocharaAspect) => `${a.by} (${a.nature}${a.enemy ? ", its enemy" : ""}, ${ordinal(a.aspect)} aspect)`;

interface HouseText {
  bs?: { verse: string; text: string };
  pd?: { verse: string; text: string };
}

/** Paraphrased house results, indexed 1..12 from the natal Moon. */
const HOUSE_TEXT: Record<Planet, Record<number, HouseText>> = {
  Sun: {
    1: { bs: { verse: "5", text: "fatigue, loss of wealth, chest pain, travel on foot" }, pd: { verse: "9", text: "fatigue, loss of wealth, irritability, illness, a wearisome journey" } },
    2: { bs: { verse: "5", text: "loss of wealth, discomfort, eye trouble, deceit" }, pd: { verse: "9", text: "loss of wealth, unhappiness, being duped" } },
    3: { bs: { verse: "5", text: "return home, wealth, happiness, health, enemies defeated" }, pd: { verse: "9", text: "new position, money, happiness, freedom from sickness, enemies destroyed" } },
    4: { bs: { verse: "5", text: "disease and obstruction" }, pd: { verse: "9", text: "disease; impediments to conjugal life" } },
    5: { bs: { verse: "6", text: "disease and enemies" }, pd: { verse: "10", text: "mental agitation, ill health, embarrassment" } },
    6: { bs: { verse: "6", text: "freed from disease, enemies and grief" }, pd: { verse: "10", text: "diseases removed, enemies destroyed, sorrows dispelled" } },
    7: { bs: { verse: "6", text: "fatigue of travel, chest pain, humiliation, wasting" }, pd: { verse: "10", text: "wearisome travel, stomach trouble, humiliation" } },
    8: { bs: { verse: "6", text: "estrangement from the spouse" }, pd: { verse: "10", text: "fear, disease, quarrel, royal displeasure, heat" } },
    9: { bs: { verse: "7", text: "accidents, humiliation, disease, mental pain, opposition" }, pd: { verse: "11", text: "danger, humiliation, separation from kin, depression" } },
    10: { bs: { verse: "7", text: "great success, the object gained" }, pd: { verse: "11", text: "a mighty undertaking completed" } },
    11: { bs: { verse: "7", text: "success, return home, respect, prosperity, health" }, pd: { verse: "11", text: "new position, honour, wealth, freedom from disease" } },
    12: { bs: { verse: "7", text: "the object gained only by just means" }, pd: { verse: "11", text: "sorrow, loss of wealth, quarrel with friends, fever" } },
  },
  Moon: {
    1: { bs: { verse: "8", text: "good meals, bed and clothes" }, pd: { verse: "12", text: "dawning of fortune" } },
    2: { bs: { verse: "8", text: "loss of respect and wealth, obstacles" }, pd: { verse: "12", text: "loss of wealth" } },
    3: { bs: { verse: "8", text: "clothes, companionship, wealth in abundance" }, pd: { verse: "12", text: "success" } },
    4: { bs: { verse: "8", text: "restlessness and harshness" }, pd: { verse: "12", text: "fear" } },
    5: { bs: { verse: "9", text: "humiliation, disease, mental pain, obstacles" }, pd: { verse: "12", text: "sorrow" } },
    6: { bs: { verse: "9", text: "wealth, comfort, enemies ruined, health" }, pd: { verse: "12", text: "freedom from disease" } },
    7: { bs: { verse: "9", text: "conveyance, respect, good bed and meals, wealth" }, pd: { verse: "12", text: "happiness" } },
    8: { bs: { verse: "9", text: "fear of evils" }, pd: { verse: "12", text: "untoward events" } },
    9: { bs: { verse: "10", text: "confinement, mental pain, bodily fatigue, chest pain" }, pd: { verse: "12", text: "sickness" } },
    10: { bs: { verse: "10", text: "orders carried out, success in work" }, pd: { verse: "12", text: "cherished wishes attained" } },
    11: { bs: { verse: "10", text: "prosperity, new friends, wealth" }, pd: { verse: "12", text: "joy" } },
    12: { bs: { verse: "10", text: "injury from cattle" }, pd: { verse: "12", text: "expenditure" } },
  },
  Mars: {
    1: { bs: { verse: "11", text: "troubles" }, pd: { verse: "13", text: "dejection, separation from relations, disorders of blood, bile or heat" } },
    2: { bs: { verse: "11", text: "trouble from the ruler, quarrels, enemies, disgrace, thieves, bilious and windy complaints" }, pd: { verse: "13", text: "fear, hot words, loss of wealth" } },
    3: { bs: { verse: "12", text: "gains, brightness, authority, wealth, metals and gems" }, pd: { verse: "13", text: "success, happiness, golden ornaments" } },
    4: { bs: { verse: "13", text: "fever, belly ache, bleeding, misery through the wicked" }, pd: { verse: "13", text: "loss of position, bowel disease, sorrow through relations" } },
    5: { bs: { verse: "14", text: "enemies, disease, fear, troublesome children, dimmed appearance" }, pd: { verse: "14", text: "fever, improper desires, anguish through a child, quarrel with relations" } },
    6: { bs: { verse: "15", text: "freed from enemies and quarrels; gold, coral, copper; independence" }, pd: { verse: "14", text: "strife ends, enemies withdraw, disease eases, victory, gain, success" } },
    7: { bs: { verse: "16", text: "a quarrelsome spouse, eye disease, belly ache" }, pd: { verse: "15", text: "misunderstanding with the spouse, eye disease, stomach ache" } },
    8: { bs: { verse: "16", text: "bloodshed, loss of wealth and respect" }, pd: { verse: "15", text: "fever, blood disorder, loss of wealth and honour" } },
    9: { bs: { verse: "16", text: "disgrace, loss of wealth, slow gait, weakness" }, pd: { verse: "15", text: "humiliation through loss, retarded gait, bodily weakness" } },
    10: { bs: { verse: "17", text: "much wealth" }, pd: { verse: "16", text: "misbehaviour or failure in attempts, exhaustion" } },
    11: { bs: { verse: "17", text: "success, renown, rule over a province" }, pd: { verse: "16", text: "financial gain, health, addition to landed property" } },
    12: { bs: { verse: "18", text: "expenses, troubles, eye disease, an angry spouse, bilious complaints" }, pd: { verse: "16", text: "loss of wealth, diseases from excessive heat" } },
  },
  Mercury: {
    1: { bs: { verse: "19", text: "loss through bad advice and tale bearers, confinement, quarrels, bad news on a journey" }, pd: { verse: "17", text: "loss of wealth" } },
    2: { bs: { verse: "20", text: "disgrace, yet success and wealth" }, pd: { verse: "17", text: "financial gain" } },
    3: { bs: { verse: "20", text: "friends, fear of the ruler and enemies, leaving home through one's own misdeeds" }, pd: { verse: "17", text: "fear from enemies" } },
    4: { bs: { verse: "21", text: "kin and family increase, much gain" }, pd: { verse: "17", text: "influx of money" } },
    5: { bs: { verse: "21", text: "quarrels with spouse and children" }, pd: { verse: "17", text: "quarrel with spouse and children" } },
    6: { bs: { verse: "22", text: "liked by all, renown" }, pd: { verse: "17", text: "success" } },
    7: { bs: { verse: "22", text: "dimmed appearance, quarrels" }, pd: { verse: "17", text: "misunderstandings" } },
    8: { bs: { verse: "22", text: "children, success, clothes, wealth, happiness, power" }, pd: { verse: "17", text: "acquisition of children and wealth" } },
    9: { bs: { verse: "23", text: "obstacles to work" }, pd: { verse: "17", text: "impediments" } },
    10: { bs: { verse: "23", text: "enemies ruined, wealth, the spouse's company, fine clothing" }, pd: { verse: "17", text: "happiness all round" } },
    11: { bs: { verse: "24", text: "wealth, comfort, children, friends, conveyance, good news" }, pd: { verse: "17", text: "prosperity" } },
    12: { bs: { verse: "24", text: "disgrace from enemies, disease, estrangement from the spouse" }, pd: { verse: "17", text: "fear of humiliation" } },
  },
  Jupiter: {
    1: { bs: { verse: "25", text: "loss of wealth and judgement, leaving home, many quarrels" }, pd: { verse: "18", text: "leaving the country, heavy expenditure, ill will" } },
    2: { bs: { verse: "25", text: "no enemies; wealth and companionship" }, pd: { verse: "18", text: "money, domestic happiness, weighty words" } },
    3: { bs: { verse: "26", text: "leaving home, obstacles in work" }, pd: { verse: "18", text: "loss of position, separation from friends, obstacles, disease" } },
    4: { bs: { verse: "26", text: "trouble from kin, resignation, delight in nothing" }, pd: { verse: "18", text: "sorrow through relations, humiliation, danger from cattle" } },
    5: { bs: { verse: "27", text: "servants, prosperity, children, cattle, gold, houses, gems, good qualities" }, pd: { verse: "19", text: "children, friendship with the good, royal favour" } },
    6: { bs: { verse: "28", text: "affliction of heart; no delight in pleasant things" }, pd: { verse: "19", text: "trouble from enemies and cousins, disease" } },
    7: { bs: { verse: "29", text: "good bed, an excellent partner, wealth, meals, conveyance, good speech" }, pd: { verse: "19", text: "auspicious travel, happiness with the spouse, children" } },
    8: { bs: { verse: "30", text: "confinement, disease, heavy grief, fatigue of travel" }, pd: { verse: "19", text: "wearisome journeys, bad luck, loss of money, misery" } },
    9: { bs: { verse: "30", text: "efficiency, influence, children, success, wealth, grain" }, pd: { verse: "20", text: "all prosperity" } },
    10: { bs: { verse: "31", text: "leaving home, loss of health and wealth" }, pd: { verse: "20", text: "danger to property, position and children" } },
    11: { bs: { verse: "31", text: "return home, health and wealth recovered" }, pd: { verse: "20", text: "children, new position, honour" } },
    12: { bs: { verse: "31", text: "grief on the return journey" }, pd: { verse: "20", text: "grief and fear through property" } },
  },
  Venus: {
    1: { bs: { verse: "32-33", text: "perfumes, flowers, clothes, houses, bed, meals, companionship" }, pd: { verse: "21", text: "all kinds of enjoyment" } },
    2: { bs: { verse: "32-33", text: "gains (verse partly illegible in the scan)" }, pd: { verse: "21", text: "financial gain" } },
    3: { bs: { verse: "34", text: "influence, wealth, respect, return home, clothes, enemies ruined" }, pd: { verse: "21", text: "prosperity" } },
    4: { bs: { verse: "34", text: "friends, great power" }, pd: { verse: "21", text: "increase of happiness and friends" } },
    5: { bs: { verse: "35", text: "happiness, kin, children, wealth, friends, no defeat" }, pd: { verse: "21", text: "acquisition of children" } },
    6: { bs: { verse: "36", text: "disgrace, disease, danger" }, pd: { verse: "21", text: "mishap" } },
    7: { bs: { verse: "36", text: "injury through relationships" }, pd: { verse: "21", text: "trouble to the spouse" } },
    8: { bs: { verse: "36", text: "houses, luxuries, a beautiful partner" }, pd: { verse: "21", text: "wealth" } },
    9: { bs: { verse: "37", text: "virtue, happiness, wealth, plenty of clothes" }, pd: { verse: "21", text: "happiness" } },
    10: { bs: { verse: "37", text: "disgrace and quarrels" }, pd: { verse: "21", text: "quarrel" } },
    11: { bs: { verse: "38", text: "friends' wealth, perfumes, clothes" }, pd: { verse: "21", text: "safety" } },
    12: { bs: { verse: "38", text: "very few clothes" }, pd: { verse: "21", text: "acquisition of money" } },
  },
  Saturn: {
    1: { bs: { verse: "39", text: "poison and fire, exile from kin, confinement, foreign travel, loss of wealth and children, humiliation" }, pd: { verse: "22", text: "disease; funeral rites" } },
    2: { bs: { verse: "40", text: "loss of beauty and comfort, weakness, wealth from others not kept long" }, pd: { verse: "22", text: "trouble to wealth and children" } },
    3: { bs: { verse: "41", text: "wealth, servants, animals, houses, influence, health, victory" }, pd: { verse: "22", text: "position or employment, servants, money" } },
    4: { bs: { verse: "42", text: "separation from friends, wealth and spouse; suspicion, no happiness" }, pd: { verse: "22", text: "loss of spouse, relations and wealth" } },
    5: { bs: { verse: "43", text: "separation from children and wealth, quarrels" }, pd: { verse: "22", text: "wealth declines, loss of children, confusion" } },
    6: { bs: { verse: "43", text: "freed from enemies and disease; companionship" }, pd: { verse: "22", text: "happiness all round" } },
    7: { bs: { verse: "44", text: "separation from spouse and children, pitiable travel on foot" }, pd: { verse: "22", text: "the spouse suffers, travel, fear" } },
    8: { bs: { verse: "44", text: "separation from spouse and children, pitiable travel on foot" }, pd: { verse: "22", text: "loss of children and cattle" } },
    9: { bs: { verse: "44", text: "as the 8th, with hatred, chest pain, confinement, neglect of daily duties" }, pd: { verse: "23", text: "loss in finance, obstacles to good acts, death of an elder, sorrow" } },
    10: { bs: { verse: "45", text: "work, but loss of wealth, learning and fame" }, pd: { verse: "23", text: "a sinful deed, loss of honour, disease" } },
    11: { bs: { verse: "45", text: "cruelty; companionship and wealth" }, pd: { verse: "23", text: "all happiness, wealth and honour" } },
    12: { bs: { verse: "45", text: "much grief" }, pd: { verse: "23", text: "fruitless business, robbed by enemies, family suffers" } },
  },
  Rahu: {
    1: { pd: { verse: "24", text: "sickness or death" } },
    2: { pd: { verse: "24", text: "loss of wealth" } },
    3: { pd: { verse: "24", text: "happiness" } },
    4: { pd: { verse: "24", text: "sorrow" } },
    5: { pd: { verse: "24", text: "financial loss" } },
    6: { pd: { verse: "24", text: "happiness" } },
    7: { pd: { verse: "24", text: "loss" } },
    8: { pd: { verse: "24", text: "danger to life" } },
    9: { pd: { verse: "24", text: "loss" } },
    10: { pd: { verse: "24", text: "gain" } },
    11: { pd: { verse: "24", text: "happiness" } },
    12: { pd: { verse: "24", text: "expenditure" } },
  },
  // Phaladeepika lists results for Rahu only (26.24); Ketu's row repeats them because 26.2 pairs the two nodes, and is provisional.
  Ketu: {},
};
for (let h = 1; h <= 12; h++) HOUSE_TEXT.Ketu[h] = HOUSE_TEXT.Rahu[h];

/** Portion of the sign in which a planet's results are felt: BS 104.49-51 and PD 26.25 (which differ for Jupiter and Venus). */
export const EFFECTIVE_PORTION: Record<Planet, { bs?: string; pd: string }> = {
  Sun: { bs: "first half of the sign (49)", pd: "first 10° (25)" },
  Mars: { bs: "first half of the sign (49)", pd: "first 10° (25)" },
  Moon: { bs: "second half of the sign (49)", pd: "last 10° (25)" },
  Saturn: { bs: "second half of the sign (49)", pd: "last 10° (25)" },
  Mercury: { bs: "throughout the sign (50)", pd: "throughout the sign (25)" },
  Jupiter: { bs: "middle of odd signs brings misery (51)", pd: "middle 10° (25)" },
  Venus: { pd: "middle 10° (25)" },
  Rahu: { pd: "throughout the sign (25)" },
  Ketu: { pd: "as Rahu, provisional (25)" },
};

/** PD 26.33: Saturn, Sun, Mars and Jupiter in the 12th, 8th or 1st from the Moon threaten life, position and wealth. */
export const DANGER_33: Partial<Record<Planet, number[]>> = { Saturn: [12, 8, 1], Sun: [12, 8, 1], Mars: [12, 8, 1], Jupiter: [12, 8, 1] };
/** PD 26.34: the single worst house for each planet, "if all the conditions exist". */
export const DANGER_34: Partial<Record<Planet, number>> = { Moon: 8, Mars: 7, Rahu: 9, Venus: 6, Jupiter: 3, Sun: 5, Saturn: 1, Mercury: 4 };

export type GocharaVerdict = "favourable" | "obstructed" | "unfavourable" | "neutral";

export interface GocharaRow {
  planet: Planet;
  signIndex: number;
  degInSign: number;
  retrograde: boolean;
  house: number;
  favourable: boolean;
  /** Planets standing in the vedha point of this favourable house (empty when clear or when the house is not favourable). */
  vedhaBy: Planet[];
  vedhaPoint?: number;
  verdict: GocharaVerdict;
  /** Dignity modifier from PD 26.31-32 / BS 104.53, 55. */
  dignityNote?: { text: string; sources: GocharaSource[] };
  /** Full aspects on this planet from the other transiting planets (see FULL_ASPECTS). */
  aspects: GocharaAspect[];
  /** PD 26.30 applied: an aspect that voids the good or the ill of this house. */
  aspectNote?: { text: string; sources: GocharaSource[]; by: Planet[] };
  /** Rekhas of eight in the planet's own Ashtakavarga for this sign, when the birth chart's marks were given. */
  avMarks?: number;
  /** PD 26.41 applied: enough marks in the planet's own Ashtakavarga make an unfavourable house good. */
  avNote?: { text: string; sources: GocharaSource[] };
  danger?: { text: string; source: GocharaSource };
  effect: { bs?: { text: string; source: GocharaSource }; pd?: { text: string; source: GocharaSource } };
  portion: { bs?: string; pd: string };
  favourableSources: GocharaSource[];
  vedhaSource: GocharaSource;
}

export interface GocharaReading {
  moonSignIndex: number;
  asOf: string;
  rows: GocharaRow[];
  caveats: string[];
}

const STRONG = new Set(["Exalted", "Moolatrikona", "Own sign"]);
const WEAK = new Set(["Debilitated", "Inimical"]);

/**
 * The order of the rules is a reading, not stated in the texts: the house from the Moon (BS 104.4, PD 26.2), the Ashtakavarga
 * rule (26.41), vedha (26.3-8), dignity and combustion (26.31-32), and last the aspect rule (26.30), which is not applied
 * where dignity has already decided the house.
 */
export function computeGochara(
  natalMoonSign: number,
  transits: PlanetPosition[],
  asOf: string,
  withhold = false,
  opts: GocharaOptions = {},
): GocharaReading {
  const bySign = (h: number) => transits.filter((p) => houseFrom(natalMoonSign, p.signIndex) === h).map((p) => p.planet);
  const rows: GocharaRow[] = transits.map((p) => {
    const house = houseFrom(natalMoonSign, p.signIndex);
    const favourable = FAVOURABLE[p.planet].includes(house);
    // PD 26.41: a sign with more benefic marks in the planet's own Ashtakavarga gives good results even in the 12th, 6th or 8th.
    const avMarks = opts.ownMarks?.[p.planet]?.[p.signIndex];
    const avGood = !favourable && typeof avMarks === "number" && avMarks >= AV_GOOD_MARKS;
    const good = favourable || avGood;
    const v = VEDHA[p.planet];
    // Vedha points are given only for the favourable houses, so a house made good by 26.41 has none.
    const vedhaPoint = favourable ? v.points[house] : undefined;
    const vedhaBy = vedhaPoint ? bySign(vedhaPoint).filter((q) => OBSTRUCTORS.includes(q) && q !== p.planet && q !== v.exempt) : [];
    let verdict: GocharaVerdict = good ? (vedhaBy.length ? "obstructed" : "favourable") : "unfavourable";

    const wouldDanger = !!DANGER_33[p.planet]?.includes(house) || DANGER_34[p.planet] === house;
    // When a rule voids the ill of the house (26.41, 26.31, 26.30), the danger reading of 26.33-34 is set aside and the note
    // says so. For a minor the danger houses are withheld altogether, so the note does not mention them either.
    const SET_ASIDE = wouldDanger && !withhold ? " The danger reading of 26.33-34 is set aside here." : "";
    let illVoid = avGood;
    const avNote: GocharaRow["avNote"] = avGood
      ? {
          text: `${avMarks} of 8 marks in ${p.planet}'s own Ashtakavarga: good even in this house (26.41).${SET_ASIDE}`,
          sources: [PD("41", true)],
        }
      : undefined;

    let dignityNote: GocharaRow["dignityNote"];
    const isNode = p.planet === "Rahu" || p.planet === "Ketu";
    if (!isNode && STRONG.has(p.dignity) && !good) {
      dignityNote = { text: `${p.dignity} in transit: an unfavourable house does no harm (26.31).${SET_ASIDE}`, sources: [PD("31")] };
      verdict = "neutral";
      illVoid = true;
    } else if (!isNode && STRONG.has(p.dignity) && good && !vedhaBy.length) {
      dignityNote = { text: `${p.dignity} in a favourable house: full results (26.31).`, sources: [PD("31")] };
    } else if (!isNode && (WEAK.has(p.dignity) || p.combust)) {
      const why = p.combust ? "combust" : p.dignity.toLowerCase();
      if (good) {
        dignityNote = { text: `${why} in transit: the good of this house is void (26.32; BS 104.53).`, sources: [PD("32"), BS("53")] };
        verdict = "neutral";
      } else {
        dignityNote = { text: `${why} in transit: the ill of this house is aggravated (26.32).`, sources: [PD("32")] };
      }
      if (p.planet === "Saturn" && p.combust) dignityNote = { text: "Saturn combust does not trouble the righteous (BS 104.55), though 26.32 voids his good results.", sources: [BS("55"), PD("32")] };
    }

    // PD 26.30: a benefic's aspect voids an ill result, a malefic's voids a good one, and an enemy's voids either; BS 104.53
    // agrees that an enemy's aspect spoils the good. Applied only where dignity has not already decided the house.
    const aspects = aspectsOn(p, transits);
    let aspectNote: GocharaRow["aspectNote"];
    if (!dignityNote && (verdict === "favourable" || verdict === "unfavourable")) {
      const goodVoid = verdict === "favourable";
      const hits = aspects.filter((a) => a.enemy || a.nature === (goodVoid ? "malefic" : "benefic"));
      if (hits.length) {
        if (!goodVoid) illVoid = true;
        aspectNote = {
          text: `Aspected by ${hits.map(aspectText).join(", ")}: the ${goodVoid ? "good" : "ill"} of this house is void (26.30).${goodVoid ? "" : SET_ASIDE}`,
          sources: [PD("30", true), ...(goodVoid && hits.some((a) => a.enemy) ? [BS("53")] : [])],
          by: hits.map((a) => a.by),
        };
        verdict = "neutral";
      }
    }

    let danger: GocharaRow["danger"];
    if (illVoid) danger = undefined;
    else if (DANGER_33[p.planet]?.includes(house)) danger = { text: "12th, 8th or 1st from the Moon: danger to life, position and wealth.", source: PD("33") };
    else if (DANGER_34[p.planet] === house) danger = { text: "The worst house for this planet: loss of honour and wealth, danger to life, if all conditions concur.", source: PD("34") };

    const t = HOUSE_TEXT[p.planet][house] ?? {};
    const ketuProv = p.planet === "Ketu";
    return {
      planet: p.planet,
      signIndex: p.signIndex,
      degInSign: p.degInSign,
      retrograde: p.retrograde,
      house,
      favourable,
      vedhaBy,
      vedhaPoint,
      verdict,
      dignityNote,
      aspects,
      aspectNote,
      avMarks,
      avNote,
      danger,
      effect: {
        bs: t.bs ? { text: t.bs.text, source: BS(t.bs.verse) } : undefined,
        pd: t.pd ? { text: t.pd.text, source: PD(t.pd.verse, ketuProv) } : undefined,
      },
      portion: EFFECTIVE_PORTION[p.planet],
      favourableSources: isNode ? [PD("2", ketuProv)] : [BS("4"), PD("2")],
      vedhaSource: v.source,
    };
  });
  const out: GocharaReading = { moonSignIndex: natalMoonSign, asOf, rows, caveats: GOCHARA_CAVEATS };
  // The sensitive-content gate (shared/life-stage.ts) strips statements of death and danger to life for a minor.
  if (!withhold) return out;
  const r = redactSensitive(out);
  for (const row of r.rows) {
    if (row.effect.bs && !row.effect.bs.text) row.effect.bs = undefined;
    if (row.effect.pd && !row.effect.pd.text) row.effect.pd = undefined;
    if (row.danger && !row.danger.text) row.danger = undefined;
  }
  return r;
}

export const GOCHARA_CAVEATS: string[] = [
  "Counted from the natal Moon's sign, which Phaladeepika 26.1 names the chief lagna for transits; Brihat Samhita 104 does the same throughout.",
  "A favourable planet gives results only in proportion to the running dasa and the person's station (Brihat Samhita 104.46); read this layer under the Vimshottari and Ashtakavarga layers, not above them.",
  "Vedha follows Phaladeepika 26.3-8: Saturn does not obstruct the Sun, Mercury does not obstruct the Moon, the Sun does not obstruct Saturn. The nodes are not named as obstructors and their own vedha points are borrowed from the Sun, which is provisional.",
  "Prasna Marga 22.46-51 gives a different Vedha table (the Moon's 3rd/10th and Mercury's 4th pair differently, Venus and the nodes diverge, and the nodes take Saturn's points); the Prasna Marga tab shows that table, and the two are kept apart rather than reconciled.",
  "Rahu and Ketu are absent from Brihat Samhita 104; Phaladeepika 26.2 treats them like the Sun and 26.24 gives Rahu's house results. Ketu's row repeats Rahu's and is provisional.",
  "Dignity here is the sidereal sign dignity and the Nadi combustion orb (3°20'); Phaladeepika 26.32 speaks of depression, inimical houses and eclipse without giving an orb.",
  "Effective portions of the sign (Brihat Samhita 104.49-51; Phaladeepika 26.25) differ between the two texts and are shown, not applied to the verdict.",
  "Aspects follow Phaladeepika 26.30: a planet giving ill results that is aspected by a benefic, or one giving good results that is aspected by a malefic, gives neither, and the same holds when the aspect comes from the planet's enemy; Brihat Samhita 104.53 agrees that an enemy's aspect spoils the good. The verse does not say which planets aspect or how, so these choices are provisional: the aspecting planets are the other planets in transit (as with vedha), only full aspects count (the 7th for all; Mars also the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th), sign to sign, and the nodes cast none. Benefic and malefic follow Phaladeepika's own list in its Sarvatobhadra notes (ch. 26); enemies follow the natural friendships of the seven planets, so for Rahu and Ketu as the aspected planet only the benefic and malefic part applies (the node rows of the friendship table follow the Nadi convention). Brihat Samhita 104.52 on a benefic and a malefic together in one sign is not applied.",
  "The order of the rules is a reading, not stated in either text: the house from the Moon, then the Ashtakavarga rule (26.41), vedha, dignity (26.31-32) and last the aspect. Where dignity has already decided the house, the aspect is not applied. Where a rule voids the ill of a house (26.31, 26.30 or 26.41), the danger reading of 26.33-34 is set aside with it; that too is a reading.",
  "Phaladeepika 26.41: a planet passing through a sign with more benefic dots in the Ashtakavarga gives good results always, even in the 12th, 6th or 8th. Here 'more' is read as five or more of eight in the planet's own Ashtakavarga, and the marks are those of the BPHS Ashtakavarga computed for the birth chart (Phaladeepika's own tables in ch. 23 are not checked against them); where the rule applies, the danger houses of 26.33-34 are set aside. All three choices are provisional. Rahu and Ketu have no Ashtakavarga of their own, so the rule does not apply to them.",
  "Not implemented: Phaladeepika's nakshatra tara tables (26.26-29), the Sun-transit limb tables (26.35-40), latta (26.42-47) and the Sarvatobhadra chakra (26.48).",
];
