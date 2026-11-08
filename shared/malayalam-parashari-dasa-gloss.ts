// Translate only the complete, known plain period gloss; unknown source text stays English.
import { SIGN_LORD, type PlanetPosition } from "./astro";
import { HOUSE_AREAS_PLAIN, ordH, withGloss, withGlossList } from "./house-gloss";
import { translate } from "./localization";
import type { DashaGloss } from "./parashari";
import { LORD_IN_HOUSE } from "./parashari-data";
import { MALAYALAM_PARASHARI_LORDS } from "./malayalam-parashari-lords";
import { DASHA_LORD_CLAUSES_ML } from "./malayalam-parashari-dasa-clauses";
import { fatherDasaLord } from "./parashari-father";
import { parashariHouseGlossMalayalam } from "./school-topic-malayalam";

const EXPECTED: Record<number, string> = {
  1: "body and nature", 2: "wealth and family", 3: "courage and siblings",
  4: "mother, home and comforts", 5: "learning and children", 6: "enemies and maternal relatives",
  7: "spouse, travel and trade", 8: "inheritance and conflict", 9: "fortune and religion",
  10: "work, honour and authority", 11: "income and prosperity", 12: "expenses",
};

export function parashariDasaGlossMalayalam(
  gloss: DashaGloss, positions: PlanetPosition[], lagnaIdx: number, source: string,
): string | undefined {
  if (!Number.isInteger(lagnaIdx) || lagnaIdx < 0 || lagnaIdx > 11) return undefined;
  const houses = [gloss.house, ...gloss.owns];
  if (houses.some((h) => !Number.isInteger(h) || !EXPECTED[h] || HOUSE_AREAS_PLAIN[h] !== EXPECTED[h] || !parashariHouseGlossMalayalam(h))) return undefined;
  const node = gloss.lord === "Rahu" || gloss.lord === "Ketu";
  const position = positions.find((p) => p.planet === gloss.lord);
  const signLord = position && SIGN_LORD[position.signIndex];
  if (node && (!signLord || gloss.owns.length)) return undefined;
  if (!node && !gloss.owns.length) return undefined;
  const name = signLord && translate("ml", signLord);
  if (node && (!name || name === signLord)) return undefined;
  const father = gloss.lord === fatherDasaLord(lagnaIdx).lord;
  const expected = (node
    ? `In the ${withGloss("parashari", gloss.house)}, giving the results of its sign lord ${signLord} and of the planets with it.`
    : `Rules the ${withGlossList("parashari", gloss.owns)} and stands in the ${withGloss("parashari", gloss.house)}.`)
    + (father ? " The father enjoys happiness in this dasa (70.16)." : "");
  if (source !== expected || gloss.plain !== expected) return undefined;
  const house = (h: number) => `${h}-ാം ഭാവം (${parashariHouseGlossMalayalam(h)})`;
  const placement = `${gloss.house}-ാം ഭാവത്തിൽ (${parashariHouseGlossMalayalam(gloss.house)})`;
  const result = node
    ? `${placement} നിലകൊള്ളുന്നു; രാശ്യാധിപനായ ${name}-ന്റെയും ഒപ്പമുള്ള ഗ്രഹങ്ങളുടെയും ഫലങ്ങൾ നൽകുന്നു.`
    : `${gloss.owns.map(house).join(", ")} ഭരിക്കുന്നു; ${placement} നിലകൊള്ളുന്നു.`;
  return result + (father ? " ഈ ദശയിൽ അച്ഛൻ സന്തോഷം അനുഭവിക്കുമെന്ന് പറയുന്നു (70.16)." : "");
}

/** The practitioner summary gives only the first clause of each verse. Never substitute
 * its full translation, or drop a later bhava/sandhi annotation from the source. */
export function parashariDasaSummaryMalayalam(
  gloss: DashaGloss, positions: PlanetPosition[], lagnaIdx: number, source: string,
): string | undefined {
  if (!Number.isInteger(lagnaIdx) || lagnaIdx < 0 || lagnaIdx > 11) return undefined;
  const houses = [gloss.house, ...gloss.owns];
  if (houses.some((h) => !Number.isInteger(h) || !EXPECTED[h] || HOUSE_AREAS_PLAIN[h] !== EXPECTED[h] || !parashariHouseGlossMalayalam(h))) return undefined;
  const node = gloss.lord === "Rahu" || gloss.lord === "Ketu";
  if (node !== (gloss.owns.length === 0)) return undefined;
  const planet = translate("ml", gloss.lord);
  if (planet === gloss.lord) return undefined;
  const signLord = SIGN_LORD[positions.find((p) => p.planet === gloss.lord)?.signIndex ?? -1];
  const signLordMl = signLord && translate("ml", signLord);
  if (node && (!signLordMl || signLordMl === signLord)) return undefined;
  const effects = gloss.owns.map((h) => LORD_IN_HOUSE[h - 1]?.[gloss.house - 1]);
  const clauses = effects.map((effect) => effect && DASHA_LORD_CLAUSES_ML[effect.verse]);
  if (effects.some((effect, i) => !effect || !clauses[i] || MALAYALAM_PARASHARI_LORDS[effect.verse]?.source !== effect.text || clauses[i].source !== effect.text.split(/[;.]/)[0].trim())) return undefined;
  const lcFirst = (t: string) => /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
  const role = node
    ? `${gloss.lord} in the ${withGloss("parashari", gloss.house)}; it gives the results of its sign lord ${signLord} and of planets in its company`
    : `${gloss.lord} owns the ${withGlossList("parashari", gloss.owns)} and stands in the ${withGloss("parashari", gloss.house)}`;
  const eff = effects.length
    ? ` Lord-in-house verses: ${effects.map((e, i) => `24.${e.verse} (${ordH(gloss.owns[i])} lord in the ${ordH(gloss.house)}: ${lcFirst(e.text.split(/[;.]/)[0].trim())})`).join("; ")}.`
    : "";
  const father = gloss.lord === fatherDasaLord(lagnaIdx).lord;
  const expected = role + "." + eff + (father ? " The father enjoys happiness in this dasa (70.16)." : "");
  if (gloss.summary !== expected || source !== expected) return undefined;
  const h = (n: number) => `${n}-ാം ഭാവം (${parashariHouseGlossMalayalam(n)})`;
  const placement = `${gloss.house}-ാം ഭാവത്തിൽ (${parashariHouseGlossMalayalam(gloss.house)})`;
  const main = node
    ? `${planet} ${placement} നിലകൊള്ളുന്നു; രാശ്യാധിപനായ ${signLordMl}-ന്റെയും ഒപ്പമുള്ള ഗ്രഹങ്ങളുടെയും ഫലങ്ങൾ നൽകുന്നു.`
    : `${planet} ${gloss.owns.map(h).join(", ")} ഭരിക്കുന്നു; ${placement} നിലകൊള്ളുന്നു.`;
  const verses = effects.length ? ` ഭാവാധിപന്റെ സ്ഥാനത്തെക്കുറിച്ചുള്ള ശ്ലോകങ്ങൾ: ${effects.map((e, i) => `24.${e.verse} (${gloss.owns[i]}-ാം ഭാവാധിപൻ ${gloss.house}-ാം ഭാവത്തിൽ: ${clauses[i].text})`).join("; ")}.` : "";
  return main + verses + (father ? " ഈ ദശയിൽ അച്ഛൻ സന്തോഷം അനുഭവിക്കുമെന്ന് പറയുന്നു (70.16)." : "");
}
