import { PLANETS, type Planet } from "./astro";
import { thePlanet } from "./house-gloss";
import { translate } from "./localization";

// Exact planet, source, verse and complete entry: altered or partially gated lists fall back.
const entries: Array<[string, string, string, string, string]> = [
  ["Sun", "BPHS", "3.12-13", "soul", "ആത്മാവ്"],
  ["Sun", "BPHS", "3.14-15", "royal", "രാജകീയം"],
  ["Sun", "BPHS", "32.18-24", "father if stronger than Venus, with the 9th from it", "ശുക്രനെക്കാൾ ശക്തനാണെങ്കിൽ അച്ഛൻ; അതിൽനിന്നുള്ള ഒമ്പതാം സ്ഥാനവും"],
  ["Sun", "Phaladeepika", "2.1", "father, prowess, government service, glory", "അച്ഛൻ, പരാക്രമം, സർക്കാർ സേവനം, കീർത്തി"],
  ["Sun", "Phaladeepika", "2.17", "physicians among its people", "അതിന്റെ ആളുകളിൽ വൈദ്യർ"],
  ["Sun", "Phaladeepika", "2.25", "father in a day birth", "പകൽ ജനനത്തിൽ അച്ഛൻ"],
  ["Sun", "Phaladeepika", "2.26", "soul", "ആത്മാവ്"],
  ["Moon", "BPHS", "3.12-13", "mind", "മനസ്സ്"],
  ["Moon", "BPHS", "3.14-15", "royal", "രാജകീയം"],
  ["Moon", "BPHS", "3.21", "commerce", "വ്യാപാരം"],
  ["Moon", "BPHS", "32.18-24", "mother if stronger than Mars, with the 4th from it", "ചൊവ്വയെക്കാൾ ശക്തനാണെങ്കിൽ അമ്മ; അതിൽനിന്നുള്ള നാലാം സ്ഥാനവും"],
  ["Moon", "Phaladeepika", "2.2", "mother, water, milk, fame, tenderness", "അമ്മ, ജലം, പാൽ, പ്രശസ്തി, മൃദുത്വം"],
  ["Moon", "Phaladeepika", "2.25", "mother in a night birth", "രാത്രി ജനനത്തിൽ അമ്മ"],
  ["Moon", "Phaladeepika", "2.26", "body", "ശരീരം"],
  ["Mars", "BPHS", "3.12-13", "strength", "ബലം"],
  ["Mars", "BPHS", "3.14-15", "army chief", "സൈന്യാധിപൻ"],
  ["Mars", "BPHS", "32.18-24", "younger brother, sister, brother-in-law, and mother if stronger than the Moon, with the 3rd from it for brothers", "ഇളയ സഹോദരൻ, സഹോദരി, അളിയൻ, ചന്ദ്രനെക്കാൾ ശക്തനാണെങ്കിൽ അമ്മ; സഹോദരന്മാർക്ക് അതിൽനിന്നുള്ള മൂന്നാം സ്ഥാനവും"],
  ["Mars", "Phaladeepika", "2.3", "brothers, products of the earth, fire, daring, weapons, wounds, energy", "സഹോദരന്മാർ, ഭൂമിയിൽനിന്നുള്ള ഉൽപന്നങ്ങൾ, അഗ്നി, ധൈര്യം, ആയുധങ്ങൾ, മുറിവുകൾ, ഊർജം"],
  ["Mars", "Phaladeepika", "2.25", "youngest brother", "ഏറ്റവും ഇളയ സഹോദരൻ"],
  ["Mercury", "BPHS", "3.12-13", "speech", "സംസാരം"],
  ["Mercury", "BPHS", "3.14-15", "prince", "രാജകുമാരൻ"],
  ["Mercury", "BPHS", "3.21", "commerce", "വ്യാപാരം"],
  ["Mercury", "BPHS", "32.18-24", "maternal relatives, with the 6th from it for the maternal uncle", "മാതൃബന്ധുക്കൾ; അമ്മാവന് അതിൽനിന്നുള്ള ആറാം സ്ഥാനവും"],
  ["Mercury", "Phaladeepika", "2.4", "learning, eloquence, fine arts, maternal uncle, mechanical arts", "പഠനം, വാഗ്മിത്വം, ലളിതകലകൾ, അമ്മാവൻ, യന്ത്രസംബന്ധമായ കലകൾ"],
  ["Mercury", "Phaladeepika", "2.18", "accountants and artisans among its people", "അതിന്റെ ആളുകളിൽ കണക്കുകാരും കരകൗശലക്കാരും"],
  ["Mercury", "Phaladeepika", "2.25", "adopted son", "ദത്തുപുത്രൻ"],
  ["Jupiter", "BPHS", "3.12-13", "knowledge and happiness", "ജ്ഞാനവും സന്തോഷവും"],
  ["Jupiter", "BPHS", "3.14-15", "minister", "മന്ത്രി"],
  ["Jupiter", "BPHS", "32.18-24", "paternal grandfather, with the 5th from it for sons", "അച്ഛന്റെ അച്ഛൻ; പുത്രന്മാർക്ക് അതിൽനിന്നുള്ള അഞ്ചാം സ്ഥാനവും"],
  ["Jupiter", "Phaladeepika", "2.5", "knowledge, sons, teaching, religious faith, treasure-house, wisdom", "ജ്ഞാനം, പുത്രന്മാർ, അധ്യാപനം, മതവിശ്വാസം, നിധിശാല, വിവേകം"],
  ["Jupiter", "Phaladeepika", "2.19", "preceptors among its people", "അതിന്റെ ആളുകളിൽ ആചാര്യന്മാർ"],
  ["Jupiter", "Phaladeepika", "2.25", "eldest brother", "മൂത്ത സഹോദരൻ"],
  ["Venus", "BPHS", "3.12-13", "potency", "ലൈംഗികശേഷി"],
  ["Venus", "BPHS", "3.14-15", "minister", "മന്ത്രി"],
  ["Venus", "BPHS", "32.18-24", "husband, and father if stronger than the Sun, with the 7th from it for the wife", "ഭർത്താവ്; സൂര്യനെക്കാൾ ശക്തനാണെങ്കിൽ അച്ഛൻ; ഭാര്യയ്ക്ക് അതിൽനിന്നുള്ള ഏഴാം സ്ഥാനവും"],
  ["Venus", "Phaladeepika", "2.6", "wealth, vehicles, ornaments, music, dance, poetry, wife, marriage, charming speech", "ധനം, വാഹനങ്ങൾ, ആഭരണങ്ങൾ, സംഗീതം, നൃത്തം, കവിത, ഭാര്യ, വിവാഹം, ആകർഷകമായ സംസാരം"],
  ["Venus", "Phaladeepika", "2.25", "mother in a day birth", "പകൽ ജനനത്തിൽ അമ്മ"],
  ["Saturn", "BPHS", "3.12-13", "grief", "ദുഃഖം"],
  ["Saturn", "BPHS", "3.14-15", "servant", "സേവകൻ"],
  ["Saturn", "BPHS", "32.18-21", "sons", "പുത്രന്മാർ"],
  ["Saturn", "BPHS", "32.22-24", "longevity, from the 8th from it", "ആയുർദൈർഘ്യം; അതിൽനിന്നുള്ള എട്ടാം സ്ഥാനത്തുനിന്ന്"],
  ["Saturn", "Phaladeepika", "2.7", "longevity", "ആയുർദൈർഘ്യം"],
  ["Saturn", "Phaladeepika", "2.7", "labourers, constancy", "തൊഴിലാളികൾ, സ്ഥിരത"],
  ["Saturn", "Phaladeepika", "2.20", "servants and blacksmiths among its people", "അതിന്റെ ആളുകളിൽ സേവകരും കൊല്ലപ്പണിക്കാരും"],
  ["Saturn", "Phaladeepika", "2.25", "father in a night birth", "രാത്രി ജനനത്തിൽ അച്ഛൻ"],
  ["Rahu", "BPHS", "3.14-15", "army, with Ketu", "കേതുവിനൊപ്പം സൈന്യം"],
  ["Ketu", "BPHS", "3.14-15", "army, with Rahu", "രാഹുവിനൊപ്പം സൈന്യം"],
  ["Ketu", "BPHS", "32.18-21", "wife, father, mother, parents-in-law, maternal grandfather", "ഭാര്യ, അച്ഛൻ, അമ്മ, പങ്കാളിയുടെ മാതാപിതാക്കൾ, അമ്മയുടെ അച്ഛൻ"],
];
const ENTRY = new Map(entries.map(([planet, book, verse, en, ml]) => [`${planet}|${book}|${verse}|${en}`, ml]));
type PeriodCondition = "supported" | "moderate" | "mixed" | "strained" | "ungraded";
/** Structural display input keeps the period calculator independent of translation. */
interface PeriodView {
  level: "dasa" | "antar";
  lord: Planet;
  held: unknown[];
  withheldCount: number;
  condition: PeriodCondition;
  entries: Array<{ tier: string; planet: Planet; source: string; ref: string; word: string }>;
  why: string;
  text: string;
  notCounted: string;
}
const CONDITION: Record<PeriodCondition, string> = { supported: "അനുകൂലം", moderate: "മധ്യം", mixed: "സമ്മിശ്രം", strained: "ബുദ്ധിമുട്ട്", ungraded: "നില നിർണയിച്ചിട്ടില്ല" };

export function parashariPractitionerSignificationsMalayalam(kw: PeriodView, source: string): string | undefined {
  if (kw.level !== "dasa" || kw.held.length || kw.withheldCount || !(PLANETS as readonly string[]).includes(kw.lord) || !CONDITION[kw.condition]) return undefined;
  const planet = translate("ml", kw.lord), name = thePlanet(kw.lord).replace(/^./, (c) => c.toUpperCase());
  if (planet === kw.lord || kw.entries.some((e) => e.tier !== "classical" || e.planet !== kw.lord || !ENTRY.has(`${e.planet}|${e.source}|${e.ref}|${e.word}`))) return undefined;
  const refs = kw.entries.map((e) => `${e.word} (${e.source === "BPHS" ? "" : "Phaladeepika "}${e.ref})`).join("; ");
  const refsMl = kw.entries.map((e) => `${ENTRY.get(`${e.planet}|${e.source}|${e.ref}|${e.word}`)} (${e.source === "BPHS" ? "" : "Phaladeepika "}${e.ref})`).join("; ");
  const originalCondition: Record<PeriodCondition, string> = { supported: "supported", moderate: "moderate", mixed: "mixed", strained: "under strain", ungraded: "not graded" };
  const expectedText = `General effects of the ${kw.lord} dasa (Parashara 47.2; Phaladeepika 21.1): ${refs || "none left to show"}. Condition: ${originalCondition[kw.condition]}. ${kw.why}`;
  const tail = "The period's own lines already name these matters, so this line casts no vote.";
  if (kw.notCounted !== tail || kw.text !== expectedText || source !== `${expectedText} Shown, not counted: the period's own lines already name these matters, so this line casts no vote.`) return undefined;
  const variants: Array<[PeriodCondition, string, string]> = [
    ["ungraded", `${kw.lord} has no sign dignity in this reading, so the measure of strength in 47.3-4 gives no grade; the period's own lines carry its condition.`, `ഈ വായനയിൽ ${planet}യ്ക്ക് രാശിദിഗ്നിറ്റി ഇല്ല; അതിനാൽ 47.3–4-ലെ ബലമാപനം നില നിർണയിക്കുന്നില്ല. കാലഘട്ടത്തിന്റെ സ്വന്തം വരികളിലാണ് അതിന്റെ അവസ്ഥ പറയുന്നത്.`],
    ["mixed", `${name} is combust, but stands in an auspicious sign or navamsa: Mantreswara reads it as mixed, the good results coming in the second half (Phaladeepika 20.57).`, `${planet} അസ്തംഗതനാണെങ്കിലും ശുഭരാശിയിലോ ശുഭനവാംശത്തിലോ നിൽക്കുന്നു. മന്ത്രേശ്വരൻ ഇത് സമ്മിശ്രമായി വായിക്കുന്നു; നല്ല ഫലങ്ങൾ രണ്ടാം പകുതിയിൽ വരുന്നു (ഫലദീപിക 20.57).`],
    ["strained", `${name} is combust, which Mantreswara counts like debilitation (Phaladeepika 20.30), and neither its sign nor its navamsa relieves it.`, `${planet} അസ്തംഗതനാണ്; മന്ത്രേശ്വരൻ അതിനെ നീചത്തിന് തുല്യമായി എണ്ണുന്നു (ഫലദീപിക 20.30). രാശിയോ നവാംശമോ അതിന് ആശ്വാസം നൽകുന്നില്ല.`],
    ...([ ["exalted", "ഉച്ചത്തിലാണ്"], ["in its moolatrikona sign", "മൂലത്രികോണ രാശിയിലാണ്"], ["in its own sign", "സ്വക്ഷേത്രത്തിലാണ്"] ] as const).map(([en, ml]): [PeriodCondition, string, string] => ["supported", `${name} is ${en}: by 47.3-4 a strong lord gives its effects in full.`, `${planet} ${ml}; 47.3–4 അനുസരിച്ച് ശക്തനായ അധിപൻ പൂർണഫലം നൽകുന്നു.`]),
    ...([ ["debilitated", "നീചത്തിലാണ്"], ["in an inimical sign", "ശത്രുരാശിയിലാണ്"] ] as const).map(([en, ml]): [PeriodCondition, string, string] => ["strained", `${name} is ${en}: by 47.3-4 the effects follow the planet's strength.`, `${planet} ${ml}; 47.3–4 അനുസരിച്ച് ഫലങ്ങൾ ഗ്രഹത്തിന്റെ ബലം പിന്തുടരുന്നു.`]),
    ...([ ["in a friend's sign", "മിത്രരാശിയിലാണ്"], ["in a neutral sign", "സമരാശിയിലാണ്"] ] as const).map(([en, ml]): [PeriodCondition, string, string] => ["moderate", `${name} is ${en}, neither strong nor weak by the measure of 47.3-4; the period's own lines carry its condition.`, `${planet} ${ml}; 47.3–4-ലെ അളവനുസരിച്ച് ശക്തനോ ദുർബലനോ അല്ല. കാലഘട്ടത്തിന്റെ സ്വന്തം വരികളിലാണ് അതിന്റെ അവസ്ഥ പറയുന്നത്.`]),
  ];
  const condition = variants.find(([grade, en]) => grade === kw.condition && en === kw.why);
  if (!condition || (kw.condition === "ungraded" && kw.lord !== "Rahu" && kw.lord !== "Ketu")) return undefined;
  return `${planet} ദശയുടെ പൊതുഫലങ്ങൾ (പരാശരൻ 47.2; ഫലദീപിക 21.1): ${refsMl || "കാണിക്കാൻ ഒന്നും ശേഷിക്കുന്നില്ല"}. അവസ്ഥ: ${CONDITION[kw.condition]}. ${condition[2]} കാണിച്ചിരിക്കുന്നു, എണ്ണുന്നില്ല: കാലഘട്ടത്തിന്റെ സ്വന്തം വരികളിൽ ഈ വിഷയങ്ങൾ നേരത്തെ പറഞ്ഞതിനാൽ ഈ വരി വേറൊരു വോട്ടായി കണക്കാക്കുന്നില്ല.`;
}
