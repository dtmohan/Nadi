import { PLANETS, type Planet } from "./astro";
import { thePlanet } from "./house-gloss";
import { translate } from "./localization";

// Closed translations of the plain list items; unknown or changed terms are left in English.
const WORDS: Record<string, string> = {
  brothers: "സഹോദരന്മാർ", "charming speech": "ആകർഷകമായ സംസാരം", constancy: "സ്ഥിരത", dance: "നൃത്തം", daring: "ധൈര്യം",
  eloquence: "വാഗ്മിത്വം", energy: "ഊർജം", fame: "പ്രശസ്തി", father: "അച്ഛൻ", "fine arts": "ലളിതകലകൾ", fire: "അഗ്നി", glory: "കീർത്തി",
  "government service": "സർക്കാർ സേവനം", "knowledge and happiness": "ജ്ഞാനവും സന്തോഷവും", labourers: "തൊഴിലാളികൾ", learning: "പഠനം",
  marriage: "വിവാഹം", "maternal grandfather": "അമ്മയുടെ അച്ഛൻ", "maternal uncle": "അമ്മാവൻ", "mechanical arts": "യന്ത്രസംബന്ധമായ കലകൾ",
  milk: "പാൽ", mind: "മനസ്സ്", mother: "അമ്മ", music: "സംഗീതം", ornaments: "ആഭരണങ്ങൾ", "parents-in-law": "പങ്കാളിയുടെ മാതാപിതാക്കൾ",
  poetry: "കവിത", "products of the earth": "ഭൂമിയിൽനിന്നുള്ള ഉൽപന്നങ്ങൾ", prowess: "പരാക്രമം", "religious faith": "മതവിശ്വാസം",
  sons: "പുത്രന്മാർ", soul: "ആത്മാവ്", speech: "സംസാരം", strength: "ബലം", teaching: "അധ്യാപനം", tenderness: "മൃദുത്വം",
  "the army": "സൈന്യം", "treasure-house": "നിധിശാല", vehicles: "വാഹനങ്ങൾ", water: "ജലം", wealth: "ധനം", weapons: "ആയുധങ്ങൾ", wife: "ഭാര്യ", wisdom: "ജ്ഞാനം",
};

type PeriodCondition = "supported" | "moderate" | "mixed" | "strained" | "ungraded";
/** Structural display input keeps the period calculator independent of translation. */
interface PeriodView {
  level: "dasa" | "antar";
  lord: Planet;
  words: string[];
  held: unknown[];
  withheldCount: number;
  condition: PeriodCondition;
  whyPlain: string;
  textPlain: string;
}

/** Translate a complete, already-gated main-period paragraph; unknown items and conditions fall back. */
export function parashariPlainSignificationsMalayalam(kw: PeriodView, source: string): string | undefined {
  if (kw.level !== "dasa" || kw.held.length || kw.withheldCount || !(PLANETS as readonly string[]).includes(kw.lord) || kw.words.some((w) => !WORDS[w])) return undefined;
  const planet = translate("ml", kw.lord);
  if (planet === kw.lord) return undefined;
  const name = thePlanet(kw.lord).replace(/^./, (c) => c.toUpperCase());
  const other = kw.lord === "Rahu" ? "Ketu" : "Rahu";
  const join = (items: string[]) => items.length < 2 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  const isNode = kw.lord === "Rahu" || kw.lord === "Ketu";
  const army = kw.words.length === 1 && kw.words[0] === "the army" && isNode;
  const opening = army ? `The classical lists give ${kw.lord} one matter of its own, the army, which it shares with ${other}. ` : kw.words.length ? `${name}'s own matters come forward in this period: ${join(kw.words)}. ` : `The classical lists give ${thePlanet(kw.lord)} few matters of its own to show here. `;
  const patterns: Array<[PeriodCondition, string, string]> = [
    ["ungraded", `${kw.lord} has no strength by sign of its own, so how these go rests on the period's other lines.`, `${planet}യ്ക്ക് സ്വന്തമായ രാശിബലമില്ല; അതിനാൽ ഇവ എങ്ങനെ ഫലിക്കുമെന്നത് ഈ കാലഘട്ടത്തിലെ മറ്റു വരികളെ ആശ്രയിക്കുന്നു.`],
    ["mixed", `${name} is close to the Sun (combust) but well placed by sign, so these come with mixed results, the better ones later in the period.`, `${planet} സൂര്യനോട് അടുത്ത് അസ്തംഗതനാണെങ്കിലും രാശിയിൽ നല്ല സ്ഥാനത്താണ്; അതിനാൽ ഫലങ്ങൾ സമ്മിശ്രമാണ്, മെച്ചപ്പെട്ടവ കാലഘട്ടത്തിന്റെ പിന്നീടുള്ള ഭാഗത്താണ്.`],
    ["strained", `${name} is close to the Sun (combust) here, so these matters may ask for more care in this period.`, `${planet} ഇവിടെ സൂര്യനോട് അടുത്ത് അസ്തംഗതനാണ്; അതിനാൽ ഈ കാലഘട്ടത്തിൽ ഈ വിഷയങ്ങളിൽ കൂടുതൽ ശ്രദ്ധ വേണ്ടിവന്നേക്കാം.`],
    ["mixed", `${name} is weak by sign, but another rule cancels that, so these matters may take effort before they settle.`, `${planet} രാശിയിൽ ദുർബലനാണ്, എന്നാൽ മറ്റൊരു നിയമം അതു റദ്ദാക്കുന്നു; അതിനാൽ ഈ കാര്യങ്ങൾ സ്ഥിരതയിലെത്താൻ ശ്രമം വേണ്ടിവന്നേക്കാം.`],
    ["mixed", `${name} is weak by sign, but another rule cancels that in part, so these matters may take effort before they settle.`, `${planet} രാശിയിൽ ദുർബലനാണ്, എന്നാൽ മറ്റൊരു നിയമം അതു ഭാഗികമായി റദ്ദാക്കുന്നു; അതിനാൽ ഈ കാര്യങ്ങൾ സ്ഥിരതയിലെത്താൻ ശ്രമം വേണ്ടിവന്നേക്കാം.`],
    ["strained", `${name} is weak by sign here, so these matters may ask for more care in this period.`, `${planet} ഇവിടെ രാശിയിൽ ദുർബലനാണ്; അതിനാൽ ഈ കാലഘട്ടത്തിൽ ഈ വിഷയങ്ങളിൽ കൂടുതൽ ശ്രദ്ധ വേണ്ടിവന്നേക്കാം.`],
    ["supported", `${name} is strong by sign here, so these matters are favoured.`, `${planet} ഇവിടെ രാശിയിൽ ശക്തനാണ്; അതിനാൽ ഈ വിഷയങ്ങൾ അനുകൂലമാണ്.`],
    ["moderate", `${name} is neither strong nor weak by sign here, so how these go rests on the period's other lines.`, `${planet} ഇവിടെ രാശിയിൽ ശക്തനോ ദുർബലനോ അല്ല; അതിനാൽ ഇവ എങ്ങനെ ഫലിക്കുമെന്നത് ഈ കാലഘട്ടത്തിലെ മറ്റു വരികളെ ആശ്രയിക്കുന്നു.`],
  ];
  const condition = patterns.find(([grade, en]) => grade === kw.condition && en === kw.whyPlain);
  if (!condition || (kw.condition === "ungraded" && !isNode) || kw.textPlain !== opening + kw.whyPlain || source !== `${kw.textPlain} Shown for context, not counted.`) return undefined;
  const intro = army ? `പരമ്പരാഗത പട്ടികകൾ ${planet}യ്ക്ക് സ്വന്തമായി ഒരു വിഷയം നൽകുന്നു: സൈന്യം. അത് ${translate("ml", other)}യുമായി പങ്കിടുന്നു.` : kw.words.length ? `${planet}യുടെ സ്വന്തം വിഷയങ്ങൾ ഈ കാലഘട്ടത്തിൽ മുന്നോട്ടുവരുന്നു: ${kw.words.map((w) => WORDS[w]).join(", ")}.` : `പരമ്പരാഗത പട്ടികകളിൽ ${planet}യ്ക്ക് സ്വന്തമായി ഇവിടെ കാണിക്കാൻ കുറച്ച് വിഷയങ്ങളേയുള്ളൂ.`;
  return `${intro} ${condition[2]} സന്ദർഭത്തിനായി കാണിക്കുന്നു; എണ്ണുന്നില്ല.`;
}
