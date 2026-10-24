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
