// The life areas as one vocabulary for every summary that names them. The Overview's glance and the
// Nadi tab's brief read the same synthesis (shared/synthesis.ts) and must say the same thing in the
// same words; both build their sentence here.
import { LIFE_AREAS, type LifeArea } from "./rules";
import type { AreaSynthesis } from "./synthesis";

/** The life area's short name, the first part of its label: "Self", "Career", "Standing", "Parents". */
export const areaNoun = (area: LifeArea): string => LIFE_AREAS[area].label.split(" &")[0];

/** The same name inside a sentence: "self", "career", "spiritual path". */
export const areaWord = (area: LifeArea): string => areaNoun(area).toLowerCase();

const joinList = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/**
 * The Nadi verdict across the areas in one clause list, without a lead-in: every area on firm ground
 * (firmest first), every area that needs care, every area in dispute, and the rest as mixed. Null when
 * no area is marked either way. The caller adds its own lead-in and full stop.
 */
export function nadiAreasClauses(areas: AreaSynthesis[]): string | null {
  const firm = areas
    .filter((a) => a.tone === "supportive")
    .sort((x, y) => y.balance - x.balance)
    .map((a) => areaWord(a.area));
  const care = areas
    .filter((a) => a.tone === "care")
    .sort((x, y) => x.balance - y.balance)
    .map((a) => areaWord(a.area));
  const contested = areas.filter((a) => a.tone === "contested").map((a) => areaWord(a.area));
  const parts: string[] = [];
  if (firm.length) parts.push(`${joinList(firm)} ${firm.length === 1 ? "rests" : "rest"} on firm ground`);
  if (care.length) parts.push(`${joinList(care)} ${care.length === 1 ? "needs" : "need"} care`);
  if (contested.length)
    parts.push(`${joinList(contested)} ${contested.length === 1 ? "is" : "are"} in dispute, with strong rules both ways`);
  const mixedN = areas.filter((a) => a.tone === "mixed").length;
  if (mixedN) parts.push(parts.length ? "the rest is mixed" : "the picture is mixed");
  return parts.length ? parts.join("; ") : null;
}

// ---- Area tags for the briefing (provisional) ----------------------------------------------------
// The briefing tags a running period or a transit with the life areas it touches. The rule is an app
// convention with no text behind it, so every tag carries the clause that placed it (shared/briefing.ts).

/** The fixed order of the areas wherever they are listed: Nadi's eleven, as shared/rules.ts gives them. */
export const AREA_ORDER = Object.keys(LIFE_AREAS) as LifeArea[];

/**
 * The houses that speak for each area when a period lord rules one or a transit stands in one
 * (provisional: the app's mapping). Parents and family take the 9th for the father and the 4th for the
 * mother. Standing has no house of its own, so that matters of the 10th are not tagged twice.
 */
export const AREA_HOUSES: Record<LifeArea, number[]> = {
  self: [1],
  career: [10],
  authority: [],
  marriage: [7],
  children: [5],
  wealth: [2, 11],
  education: [4, 5],
  family: [9, 4],
  health: [6],
  spirituality: [9, 12],
  travel: [9, 12],
};

/**
 * Signature karakas: a period lord that signifies an area in its own right (provisional). Venus for
 * marriage, the Sun for the father, the Moon for the mother and Jupiter for children. Used only by the
 * tagging rule; Nadi's own area karaka stays in shared/rules.ts.
 */
export const AREA_TAG_KARAKA: Partial<Record<string, { area: LifeArea; as: string; plain: string }>> = {
  Venus: { area: "marriage", as: "the karaka of marriage", plain: "stands for marriage" },
  Sun: { area: "family", as: "the karaka of the father", plain: "stands for the father" },
  Moon: { area: "family", as: "the karaka of the mother", plain: "stands for the mother" },
  Jupiter: { area: "children", as: "the karaka of children", plain: "stands for children" },
};

/** The areas a house speaks for, in the fixed order. */
export function houseAreas(house: number): LifeArea[] {
  return AREA_ORDER.filter((a) => AREA_HOUSES[a].includes(house));
}
