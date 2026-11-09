import type { ChanceBaseline } from "@shared/validate-types";
import type { Locale } from "@shared/localization";

/** Labels for the existing comparison measures; this does not change the samples or scores. */
export const BASELINE_LABEL_ML: Record<string, string> = {
  confirmed: "കാലഘട്ട/ഭാവസ്ഫുട പൊരുത്തങ്ങൾ", kp: "KP", transit: "ദശാനാഥരുടെ ഗോചരം",
  jaimini: "ജൈമിനി", bnn: "നാഡി", bnnWindow: "നാഡി കാലപരിധികൾ", kpWindow: "KP കാലഘട്ടങ്ങൾ",
  kpFullWindow: "KP പൂർണം", kpStrictWindow: "KP കർശനം", kpStrictFullWindow: "KP കർശനവും പൂർണവും", luminary: "സൂര്യൻ/ചന്ദ്രൻ",
};

export function baselineExplanation(b: Pick<ChanceBaseline, "trials" | "span">, locale: Locale) {
  if (locale === "ml") return {
    title: `ഓരോ വിഷയവും ${b.span[0]} മുതൽ ${b.span[1]} വരെ സ്വതന്ത്രമായി തിരഞ്ഞെടുത്ത തീയതികളുടെ ${b.trials} സെറ്റുകളിൽ വീണ്ടും സ്കോർ ചെയ്യുന്നു. താഴ്ന്ന സ്കോറുകളും തുല്യ സ്കോറുകളുടെ പകുതിയും മധ്യറാങ്ക് ശതമാനസ്ഥാനത്തിൽ കണക്കാക്കുന്നു. ഇത് ഈ സാമ്പിളുകളെ വിവരിക്കുന്നു; ജനനസമയം ശരിയാകാനുള്ള സാധ്യതയല്ല.`,
    family: "ഓരോ തീയതിയിലെയും ഗോചരസ്ഥാനങ്ങൾ അതേ ജനനജാതകത്തിനെതിരെ പരിശോധിക്കുന്നു. തുല്യ സ്കോറുകൾ ശതമാനസ്ഥാനത്തിൽ പകുതിയായി കണക്കാക്കുന്നു. ബന്ധപ്പെട്ട അളവുകൾക്കോ പല ജനനസമയങ്ങളിൽനിന്നുള്ള തിരഞ്ഞെടുപ്പിനോ തിരുത്തൽ വരുത്തിയിട്ടില്ല; ഈ ഫലങ്ങൾ വിവരണാത്മകമാണ്. ക്രമരഹിത തീയതികൾ സംഭവങ്ങൾക്ക് യുക്തിസഹമായ പ്രായമോ സംഭവങ്ങളുടെ ക്രമമോ നിലനിർത്തണമെന്നില്ല.",
    sets: "സെറ്റുകൾ", mean: "താരതമ്യ ശരാശരി", percentile: "ശതമാനസ്ഥാനം",
  };
  return {
    title: `Each matter is rescored at ${b.trials} sets of dates selected independently between ${b.span[0]} and ${b.span[1]}. The mid-rank percentile counts lower scores plus half of tied scores. This describes these samples and is not a probability that a birth time is correct.`,
    family: "Each date uses its own transit positions against the same natal chart. Percentiles count ties halfway and are descriptive, with no adjustment for the related measures or for choosing among birth times. Random dates need not preserve plausible event ages or order.",
    sets: "sets", mean: "comparison mean", percentile: "",
  };
}
