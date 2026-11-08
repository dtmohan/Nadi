import type { AlpHouse } from "./alp";
import { alpHouseGlossMalayalam } from "./malayalam-alp-evidence";
import { houseGloss, listJoin, ordH } from "./house-gloss";
import { translate } from "./localization";

/** Translate the complete displayed facts only if the original line and glosses match. */
export function alpHouseDetailMalayalam(h: AlpHouse, lordHouse: AlpHouse | undefined, source: string): string | undefined {
  const expected = `The ${ordH(h.house)} from the moving point covers ${houseGloss("alp", h.house)}. ${h.lord} rules this sign${lordHouse ? ` and is in the ${ordH(lordHouse.house)} from the moving point (${houseGloss("alp", lordHouse.house)})` : ""}. ${h.planets.length ? `${listJoin(h.planets)} ${h.planets.length === 1 ? "occupies" : "occupy"} this sign` : "No planet occupies this sign"}. The same sign is the ${ordH(h.houseFromJanma)} from the birth rising sign.`;
  const current = alpHouseGlossMalayalam(h.house), lordGloss = lordHouse && alpHouseGlossMalayalam(lordHouse.house);
  const lord = translate("ml", h.lord), occupants = h.planets.map((p) => translate("ml", p));
  if (source !== expected || !current || lordHouse && !lordGloss || lord === h.lord || occupants.some((p, i) => p === h.planets[i]) || h.houseFromJanma < 1 || h.houseFromJanma > 12) return undefined;
  return `മുന്നോട്ടു നീങ്ങുന്ന ബിന്ദുവിൽനിന്നുള്ള ${h.house}-ാം ഭാവം ${current} എന്നീ വിഷയങ്ങൾ ഉൾക്കൊള്ളുന്നു. ഈ രാശിയുടെ അധിപൻ ${lord} ആണ്${lordHouse ? `; ആ ഗ്രഹം മുന്നോട്ടു നീങ്ങുന്ന ബിന്ദുവിൽനിന്ന് ${lordHouse.house}-ാം ഭാവത്തിലാണ് (${lordGloss})` : ""}. ${occupants.length ? `${occupants.join(", ")} ഈ രാശിയിൽ നിൽക്കുന്നു` : "ഈ രാശിയിൽ ഗ്രഹങ്ങളില്ല"}. അതേ രാശി ജന്മലഗ്നത്തിൽനിന്ന് ${h.houseFromJanma}-ാം ഭാവമാണ്.`;
}
