import { SIGNS, houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";
import { readsFromPreviousSign } from "./flow";

/**
 * Houses in BNN are whole signs counted from a karaka, never from the ascendant.
 *
 * "Sage Brighu has not concentrated on Ascendent (Lagna); on the other hand, he concentrates on
 * Jupiter, calling it the life force ... the author treats Jupiter as the ascendent and the 12
 * houses therefrom" (Bhrigu Naadi principles). Jupiter's whole rashi is the 1st, the next rashi
 * the 2nd, and so on; Jupiter's degree does not move a house boundary. Profession is counted from
 * Saturn, the spouse and comforts from Venus, and in a female chart Venus takes the 1st house.
 */

export type HouseClass = "best" | "good" | "middling" | "adverse";

/** "Trine 1, 5, 9: best; quadrants 1, 4, 7, 10: good; 6, 8, 12: bad; 2, 3, 11: not so good." */
export function houseClass(h: number): HouseClass {
  if ([1, 5, 9].includes(h)) return "best";
  if ([4, 7, 10].includes(h)) return "good";
  if ([6, 8, 12].includes(h)) return "adverse";
  return "middling";
}

export const HOUSE_CLASS_LABEL: Record<HouseClass, string> = {
  best: "trine, best",
  good: "quadrant, good",
  middling: "not so good",
  adverse: "dusthana, adverse",
};

/** Houses from Jupiter (the life force), condensed from Sitharsastrology's BNN house guide. */
export const HOUSES_FROM_JUPITER: string[] = [
  "Self, life force and core identity; planets here shape the native's fundamental nature.",
  "Finances, family of origin, speech and accumulated wealth; the resources that support the life force.",
  "Communication, courage, younger siblings, short journeys, writing and skills.",
  "Home, mother, emotional foundation, vehicles, landed property and domestic happiness.",
  "Children, creativity, romance, intelligence and past-life merit; what the life force creates and loves.",
  "Health, daily routine, service, debts, enemies and obstacles the life force must overcome.",
  "Marriage, partnerships, business alliances and public image; the one-to-one relationships.",
  "Transformation, secrets, inheritance, longevity, occult knowledge and sudden events.",
  "Higher learning, long journeys, spirituality, the guru, fortune and the father.",
  "Career, reputation, social status and public standing; the life force's role in the world.",
  "Friends, networks, gains, income, aspirations and elder siblings.",
  "Losses, expenses, isolation, foreign lands, sleep, liberation and endings; what must be released.",
];

/** Houses from Saturn (karma), from Rao's practice and the BNN profession bootcamp. */
export const HOUSES_FROM_SATURN: string[] = [
  "The work itself: Saturn's sign and companions describe the nature of the profession.",
  "Gain from work and the plan of action; a planet here often supplies the source of livelihood.",
  "Start of the professional life (Saturn's 3rd aspect).",
  "The workplace's fixed assets: land, home base, vehicles connected to work.",
  "Fruits of work, subordinates and trainees; skills carried from past effort.",
  "Service, debts and competitors; the daily grind and its obstacles.",
  "Middle part of the profession (Saturn's 7th aspect); partners, rivals and contracts.",
  "Hidden matters of work: research, insurance, inheritance, sudden changes of employment.",
  "Higher purpose of the work; teachers, long journeys and fortune through effort.",
  "End part of the profession (Saturn's 10th aspect); the standing finally reached.",
  "Income and networks from work; friends made through the profession.",
  "The work environment and background: malefics here make it hard, benefics make it enjoyable.",
];

/** Houses from Venus (the spouse in a male chart; the native herself in a female chart). */
export const HOUSES_FROM_VENUS: string[] = [
  "Venus's own sign: the spouse's nature (male chart) or the native's own (female chart).",
  "Family and finances of the partnership; what the marriage accumulates.",
  "Siblings-in-law, communication in the marriage, short journeys together.",
  "Home and comforts of the married life; the vehicle and the household.",
  "Children and romance; planets here (with the 2nd, 7th and 9th) indicate the husband, his nature and profession in a female chart.",
  "Strain in comforts: health of the partner, debts, service.",
  "The partner's counterpart and open partnerships; the marriage bond itself.",
  "Longevity of the marriage; inheritance and hidden matters between partners.",
  "Fortune through the partner; long journeys and the in-laws' guidance.",
  "The partner's standing and profession.",
  "Gains and friendships through the partner.",
  "Comforts spent, separations and distance; the bed and foreign residence.",
];

export const HOUSE_MEANINGS: Partial<Record<Planet, string[]>> = {
  Jupiter: HOUSES_FROM_JUPITER,
  Saturn: HOUSES_FROM_SATURN,
  Venus: HOUSES_FROM_VENUS,
};

export interface HouseFromKaraka {
  house: number;
  signIndex: number;
  sign: Sign;
  planets: Planet[];
  /** Retrograde planets in the next sign that also read from this house, at half strength (Rao: "aspect the rear sign by 1/2 strength"). */
  viaRetro: Planet[];
  cls: HouseClass;
  meaning: string;
}

/** A retrograde planet that stays put: it does not read from the previous house, and why. */
export interface RetroNote {
  planet: Planet;
  house: number;
  reason: string;
}

/**
 * Retrograde planets that keep their house only. A retrograde planet's placement never moves:
 * the house it occupies is read at full strength; the previous house is added at half strength
 * unless rule 11 (it backed into this sign) or rule 12 (under Rahu or Ketu) applies.
 */
export function retroNotes(positions: PlanetPosition[], karaka: Planet): RetroNote[] {
  const k = positions.find((p) => p.planet === karaka);
  if (!k) return [];
  const out: RetroNote[] = [];
  for (const p of positions) {
    if (!p.retrograde || p.planet === "Rahu" || p.planet === "Ketu" || readsFromPreviousSign(p, positions)) continue;
    const node = positions.find((o) => (o.planet === "Rahu" || o.planet === "Ketu") && [1, 5, 9].includes(houseFrom(p.signIndex, o.signIndex)));
    const reason = p.retrogradeEntry
      ? `backed into ${SIGNS[p.signIndex]} from ${SIGNS[(p.signIndex + 1) % 12]}, so it is not counted again from the sign before (rule 11)`
      : node
        ? `under ${node.planet}${node.signIndex === p.signIndex ? " in the same sign" : ` by trine from ${SIGNS[node.signIndex]}`}, so the retrogression gives no effect on the previous sign (rule 12)`
        : "";
    if (reason) out.push({ planet: p.planet, house: houseFrom(k.signIndex, p.signIndex), reason });
  }
  return out;
}

export function housesFrom(positions: PlanetPosition[], karaka: Planet): HouseFromKaraka[] {
  const k = positions.find((p) => p.planet === karaka);
  if (!k) return [];
  const meanings = HOUSE_MEANINGS[karaka] ?? HOUSES_FROM_JUPITER;
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (k.signIndex + i) % 12;
    return {
      house,
      signIndex,
      sign: SIGNS[signIndex],
      planets: positions.filter((p) => p.signIndex === signIndex && p.planet !== karaka).map((p) => p.planet),
      viaRetro: positions.filter((p) => p.planet !== karaka && p.signIndex === (signIndex + 1) % 12 && readsFromPreviousSign(p, positions)).map((p) => p.planet),
      cls: houseClass(house),
      meaning: meanings[i],
    };
  });
}

/** House number of `sign` counted from the karaka's sign, or null if the karaka is absent. */
export function houseNumberFrom(positions: PlanetPosition[], karaka: Planet, signIndex: number): number | null {
  const k = positions.find((p) => p.planet === karaka);
  return k ? houseFrom(k.signIndex, signIndex) : null;
}
