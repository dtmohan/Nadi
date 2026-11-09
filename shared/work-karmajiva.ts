/** Brihat Jataka's livelihood method, separately attributed from the Nadi career reading. */
import { SIGNS, type Planet } from "./astro";
import { computeKarmajiva, KARMAJIVA_SOURCES, type Reference } from "./karmajiva";
import { natalPlanetContext } from "./planet-context";
import { areaSeason, heldAreasAt, isDeceased, lifeAsOf, mentionsHeldArea, sensitiveGate, withholdText } from "./life-stage";
import { translate } from "./localization";
import type { ChartResult } from "./schema";

/** Translations of the traditional examples recorded in NAVAMSA_CALLING; not modern job predictions. */
const CALLING_ML: Partial<Record<Planet, string>> = {
  Sun: "പുല്ലും ഔഷധസസ്യങ്ങളും, സ്വർണം, കമ്പിളി, മരുന്നുകൾ",
  Moon: "കൃഷിയും ജലോത്പന്നങ്ങളും (മുത്ത്, ശംഖ്, മത്സ്യം), സ്ത്രീകളുമായുള്ള ഇടപാടുകളും",
  Mars: "ലോഹങ്ങളും ധാതുക്കളും, അഗ്നി, ആയുധങ്ങൾ, ധീരപ്രവൃത്തികൾ",
  Mercury: "എഴുത്ത്, കണക്ക്, ഗണിതം, ശാസ്ത്രങ്ങൾ, കവിത, കലകളും കൈത്തൊഴിലുകളും",
  Jupiter: "ബ്രാഹ്മണർ, പണ്ഡിതർ, ദേവതകൾ, ഖനികൾ, മതപരവും സൽപ്രവൃത്തികളുമായ കാര്യങ്ങൾ",
  Venus: "രത്നങ്ങൾ, വെള്ളിയും മറ്റു ലോഹങ്ങളും, പശുക്കളും എരുമകളും",
  Saturn: "കഠിനാധ്വാനം, കൊല്ലലും പീഡനവും, ഭാരം ചുമക്കൽ, താഴ്ന്നതായി കണക്കാക്കിയ കൈത്തൊഴിലുകൾ",
};

const REFERENCE_ML: Record<Reference, string> = { Lagna: "ലഗ്നത്തിൽനിന്ന്", Moon: "ജന്മചന്ദ്രനിൽനിന്ന്", Sun: "ജന്മസൂര്യനിൽനിന്ന്" };

export interface WorkKarmajivaReference {
  reference: Reference;
  tenthLord: Planet;
  navamsaSign: string;
  navamsaLord: Planet;
  callingEn: string;
  callingMl: string;
  /** Full traceable chain in reader language, kept in both languages. */
  en: string;
  ml: string;
  sourceUrl: string;
  callingSourceUrl: string;
}

export interface WorkKarmajiva {
  state: "available" | "held";
  asOf: string;
  past: boolean;
  birthTimeSensitive: boolean;
  references: WorkKarmajivaReference[];
  methodEn: string;
  methodMl: string;
  qualificationEn: string;
  qualificationMl: string;
  sourceUrl: string;
  alternateSourceUrl: string;
}

/** No event, career score or occupational probability is inferred from these chains. */
export function buildWorkKarmajiva(result: ChartResult): WorkKarmajiva {
  const asOf = lifeAsOf(result.chart, result.now.asOf);
  const methodEn = "Brihat Jataka 10.1–3 considers the ruler of the ninth-division sign occupied by the ruler of the tenth house, counted separately from the rising sign, the birth Moon and the birth Sun. The app paraphrases traditional livelihood examples associated with each resulting planet.";
  const methodMl = "ബൃഹജ്ജാതകം 10.1–3 പ്രകാരം ലഗ്നം, ജന്മചന്ദ്രൻ, ജന്മസൂര്യൻ എന്നിവയിൽനിന്ന് പ്രത്യേകം പത്താം ഭാവത്തിന്റെ അധിപനെ കണ്ടെത്തുന്നു. ആ അധിപൻ നിൽക്കുന്ന നവാംശരാശിയുടെ അധിപനെ ഉപജീവന സൂചനയായി പരിഗണിക്കുന്നു. ആ ഗ്രഹങ്ങളുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത ഉപജീവന ഉദാഹരണങ്ങൾ ആപ്പ് ആശയരൂപത്തിൽ നൽകുന്നു.";
  const qualificationEn = "These are the app's paraphrases of historical examples, not a ranked list of likely jobs. Translations of some examples differ; consult the linked editions. The quoted Aiyar translation reads the navamsa chain for all three references, without requiring the tenth house to be empty. Modern equivalents are not inferred here.";
  const qualificationMl = "ഇവ പഴയ ഗ്രന്ഥത്തിലെ ഉദാഹരണങ്ങളുടെ ആപ്പിലെ ആശയവിവരണമാണ്; സാധ്യതാക്രമത്തിൽ നൽകിയ ജോലിപ്പട്ടികയല്ല. ചില ഉദാഹരണങ്ങളുടെ വിവർത്തനങ്ങൾ തമ്മിൽ വ്യത്യാസമുണ്ട്; നൽകിയിരിക്കുന്ന പതിപ്പുകൾ പരിശോധിക്കാം. നൽകിയിരിക്കുന്ന അയ്യരുടെ വിവർത്തനം പത്താം ഭാവം ഒഴിഞ്ഞിരിക്കണമെന്ന ഉപാധിയില്ലാതെ മൂന്നു ആധാരങ്ങളിൽനിന്നും നവാംശരീതി വായിക്കുന്നു. ആധുനിക തൊഴിലുകൾ ഇവിടെ ഊഹിക്കുന്നില്ല.";
  const base: WorkKarmajiva = {
    state: "held", asOf, past: isDeceased(result.chart, result.now.asOf),
    birthTimeSensitive: (result.chart.timeUncertaintyMin ?? 0) > 0,
    references: [], methodEn, methodMl, qualificationEn, qualificationMl,
    sourceUrl: KARMAJIVA_SOURCES.v1.url, alternateSourceUrl: KARMAJIVA_SOURCES.iyer.url,
  };
  if (!areaSeason("career", result.utc, asOf, result.chart).inSeason) return base;
  const calculation = computeKarmajiva(natalPlanetContext(result), result.jaimini.lagna.signIndex);
  const held = heldAreasAt(result.utc, asOf, result.chart);
  const withheld = sensitiveGate(result.chart, result.utc, asOf).withheld;
  const references = calculation.references.map((r): WorkKarmajivaReference => {
    // A career can be eligible before age 18 while other topics remain held.
    // Do not show the ancient examples where they name a held/sensitive topic.
    const hideCalling = mentionsHeldArea(r.calling, held) || (withheld && withholdText(r.calling));
    const callingEn = hideCalling ? "some traditional examples are held for later" : r.calling;
    const callingMl = hideCalling ? "ചില പരമ്പരാഗത ഉദാഹരണങ്ങൾ പിന്നീട് കാണുന്നതിനായി മാറ്റിവച്ചിരിക്കുന്നു" : CALLING_ML[r.navamsaLord] ?? "";
    const sign = SIGNS[r.navamsaSign];
    const refEn = r.reference === "Lagna" ? "the rising sign" : r.reference === "Moon" ? "the birth Moon" : "the birth Sun";
    const en = `From ${refEn}, the tenth-house ruler is ${r.tenthLord}. It occupies ${sign} in the ninth division (navamsa), whose ruler is ${r.navamsaLord}. The app's paraphrase of traditional examples for ${r.navamsaLord}: ${callingEn}.`;
    const ml = `${REFERENCE_ML[r.reference]} പത്താം ഭാവാധിപൻ ${translate("ml", r.tenthLord)} ആണ്. ആ ഗ്രഹം നവാംശത്തിൽ ${translate("ml", sign)} രാശിയിലാണ്; അതിന്റെ അധിപൻ ${translate("ml", r.navamsaLord)} ആണ്. ഈ ഗ്രഹത്തിനുള്ള പരമ്പരാഗത ഉദാഹരണങ്ങളുടെ ആപ്പ് വിവരണം: ${callingMl}.`;
    const callingSourceUrl = ["Sun", "Moon", "Mars", "Mercury"].includes(r.navamsaLord) ? KARMAJIVA_SOURCES.v2.url : KARMAJIVA_SOURCES.v3.url;
    return { reference: r.reference, tenthLord: r.tenthLord, navamsaSign: sign, navamsaLord: r.navamsaLord, callingEn, callingMl, en, ml, sourceUrl: KARMAJIVA_SOURCES.v1.url, callingSourceUrl };
  });
  return { ...base, state: "available", references };
}
