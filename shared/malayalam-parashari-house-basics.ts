import type { Bhava, ParashariResult } from "./parashari";
import type { HouseProsePart } from "./parashari-house-prose";
import { HOUSE_AREAS_PLAIN, listJoin, ordH, thePlanet } from "./house-gloss";
import { HOUSE_MATTERS } from "./parashari-houses";
import { translate } from "./localization";

// Frozen English labels: changed source, redaction or gloss falls back to English.
const plain: Array<[string, string]> = [
  ["body and nature", "ശരീരവും സ്വഭാവവും"],
  ["wealth and family", "ധനവും കുടുംബവും"],
  ["courage and siblings", "ധൈര്യവും സഹോദരങ്ങളും"],
  ["mother, home and comforts", "അമ്മ, വീട്, സുഖസൗകര്യങ്ങൾ"],
  ["learning and children", "പഠനവും സന്താനവും"],
  ["enemies and maternal relatives", "ശത്രുക്കളും മാതൃബന്ധുക്കളും"],
  ["spouse, travel and trade", "ജീവിതപങ്കാളി, യാത്ര, വ്യാപാരം"],
  ["inheritance and conflict", "അനന്തരാവകാശവും സംഘർഷവും"],
  ["fortune and religion", "ഭാഗ്യവും മതവും"],
  ["work, honour and authority", "തൊഴിൽ, ബഹുമാനം, അധികാരം"],
  ["income and prosperity", "വരുമാനവും സമൃദ്ധിയും"],
  ["expenses", "ചെലവുകൾ"],
];
const practitioner: Array<[string, string]> = [
  ["body, appearance, intellect, complexion, vigour and weakness, happiness and grief, innate nature", "ശരീരം, രൂപം, ബുദ്ധി, നിറം, ഊർജവും ബലക്കുറവും, സന്തോഷവും ദുഃഖവും, സഹജസ്വഭാവം"],
  ["wealth, food and grains, family, death, enemies, metals and precious stones", "ധനം, ഭക്ഷണവും ധാന്യവും, കുടുംബം, മരണം, ശത്രുക്കൾ, ലോഹങ്ങളും രത്നങ്ങളും"],
  ["valour, servants, brothers and sisters, initiation, journeys, a parent's death", "ശൗര്യം, സേവകർ, സഹോദരങ്ങൾ, ദീക്ഷ, യാത്രകൾ, മാതാപിതാക്കളിലൊരാളുടെ മരണം"],
  ["conveyances, relatives, mother, happiness, treasure, lands and houses", "വാഹനങ്ങൾ, ബന്ധുക്കൾ, അമ്മ, സന്തോഷം, നിധി, ഭൂമിയും വീടുകളും"],
  ["amulets and sacred spells, learning, knowledge, sons, authority, fall from position", "യന്ത്രങ്ങളും വിശുദ്ധ മന്ത്രങ്ങളും, പഠനം, ജ്ഞാനം, പുത്രന്മാർ, അധികാരം, സ്ഥാനത്തിൽനിന്നുള്ള വീഴ്ച"],
  ["maternal uncle, doubts about death, enemies, ulcers, step-mother", "അമ്മാവൻ, മരണത്തെക്കുറിച്ചുള്ള സംശയങ്ങൾ, ശത്രുക്കൾ, വ്രണങ്ങൾ, രണ്ടാനമ്മ"],
  ["wife, travel, trade, loss of sight, death", "ഭാര്യ, യാത്ര, വ്യാപാരം, കാഴ്ച നഷ്ടപ്പെടൽ, മരണം"],
  ["longevity, battle, enemies, forts, wealth of the dead, past and future births", "ആയുർദൈർഘ്യം, യുദ്ധം, ശത്രുക്കൾ, കോട്ടകൾ, മരിച്ചവരുടെ ധനം, കഴിഞ്ഞതും വരാനിരിക്കുന്നതുമായ ജന്മങ്ങൾ"],
  ["fortune, wife's brother, religion, brother's wife, visits to shrines", "ഭാഗ്യം, ഭാര്യയുടെ സഹോദരൻ, മതം, സഹോദരന്റെ ഭാര്യ, തീർഥദർശനം"],
  ["authority, place, profession and livelihood, honour, father, living abroad, debts", "അധികാരം, സ്ഥാനം, തൊഴിലും ഉപജീവനവും, ബഹുമാനം, അച്ഛൻ, വിദേശവാസം, കടങ്ങൾ"],
  ["all articles, son's wife, income, prosperity, quadrupeds", "എല്ലാ വസ്തുക്കളും, പുത്രന്റെ ഭാര്യ, വരുമാനം, സമൃദ്ധി, നാലുകാലികൾ"],
  ["expenses, history of enemies, one's own death", "ചെലവുകൾ, ശത്രുക്കളുടെ ചരിത്രം, സ്വന്തം മരണം"],
];
const QUARTER: Record<number, string> = { 1: "1/4", 2: "1/2", 3: "3/4", 4: "full" };
const QUARTER_PLAIN: Record<number, string> = { 1: "at a quarter strength", 2: "at half strength", 3: "at three-quarter strength", 4: "fully" };
const QUARTER_ML: Record<number, string> = { 1: "കാൽബലത്തിൽ", 2: "പകുതിബലത്തിൽ", 3: "മുക്കാൽബലത്തിൽ", 4: "പൂർണബലത്തിൽ" };
const FLOOR: Record<number, string> = { 4: "full aspects only", 2: "half or stronger", 1: "every quarter" };
const FLOOR_PLAIN: Record<number, string> = { 4: " with full strength", 2: " with half strength or more", 1: "" };
const FLOOR_ML: Record<number, string> = { 4: "പൂർണ ദൃഷ്ടികൾ മാത്രം", 2: "പകുതിബലമോ അതിലധികമോ ഉള്ള ദൃഷ്ടികൾ", 1: "ഓരോ കാൽബലവും" };
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Full explanatory notes are matched exactly, including the provisional qualifier. */
export function parashariHouseNoteMalayalam(text: string): string | undefined {
  if (text === "Each house in turn: its matters (11.2-13); the lord's placement (ch. 24), with the strength qualifier of 24.145; the occupants by Phaladeepika ch. 8 (8.25-33 for the nodes), in the chart's house method; the aspects at the rules' floor (26.2-5); the house chapter (ch. 12-23); and the test of 11.14-16, read as the house's lean (provisional).")
    return "ഓരോ ഭാവവും ക്രമത്തിൽ: അതിന്റെ വിഷയങ്ങൾ (11.2–13); 24.145-ലെ ബലവ്യവസ്ഥ സഹിതം അധിപന്റെ സ്ഥാനം (അധ്യായം 24); ജാതകം തിരഞ്ഞെടുത്ത ഭാവരീതിയിൽ ഫലദീപിക അധ്യായം 8 അനുസരിച്ചുള്ള ഗ്രഹസ്ഥാനങ്ങൾ (രാഹുകേതുക്കൾക്ക് 8.25–33); നിയമങ്ങളുടെ ബലപരിധിയിലുള്ള ദൃഷ്ടികൾ (26.2–5); ഭാവത്തിന്റെ അധ്യായം (12–23); ഭാവത്തിന്റെ പ്രവണതയായി വായിക്കുന്ന 11.14–16-ലെ പരിശോധന (താൽക്കാലികം).";
  if (text === "Each house is read in the same order: what it covers, where its ruler sits, the planets in it, the planets that look at it, what Parashara's chapter on the house adds, and his own weighing of it. The house and ruler readings are Parashara's, from the Brihat Parashara Hora Sastra; the planets in each house are read from Mantreswara's Phaladeepika. Each line is one book's reading of one part of the chart, so the lines can pull different ways: read them as views to weigh, not as a sum.")
    return "ഓരോ ഭാവവും ഒരേ ക്രമത്തിൽ വായിക്കുന്നു: അതിലെ വിഷയങ്ങൾ, അധിപന്റെ സ്ഥാനം, അവിടെ നിൽക്കുന്ന ഗ്രഹങ്ങൾ, അതിനെ നോക്കുന്ന ഗ്രഹങ്ങൾ, ഭാവത്തെക്കുറിച്ചുള്ള പരാശരിയുടെ അധ്യായം ചേർക്കുന്നത്, ഭാവത്തെക്കുറിച്ചുള്ള അദ്ദേഹത്തിന്റെ വിലയിരുത്തൽ. ഭാവവും അധിപനും സംബന്ധിച്ച വായനകൾ ബൃഹത് പരാശര ഹോര ശാസ്ത്രത്തിൽ നിന്നുള്ളതാണ്; ഭാവത്തിലെ ഗ്രഹങ്ങളെ മന്ത്രേശ്വരന്റെ ഫലദീപികയിൽനിന്നാണ് വായിക്കുന്നത്. ഓരോ വരിയും ജാതകത്തിന്റെ ഒരു ഭാഗത്തെ ഒരു ഗ്രന്ഥത്തിന്റെ വായനയാണ്; അതിനാൽ വരികൾ വ്യത്യസ്ത ദിശകളിലേക്ക് ചായാം. അവ കൂട്ടിച്ചേർക്കാതെ തൂക്കിനോക്കേണ്ട കാഴ്ചപ്പാടുകളായി വായിക്കുക.";
  return undefined;
}

/** Translate only facts that reconstruct the complete original paragraph. */
export function parashariBasicHouseMalayalam(par: ParashariResult, bhava: Bhava, part: HouseProsePart, isPlain: boolean): string | undefined {
  const h = bhava.house;
  if (!Number.isInteger(h) || h < 1 || h > 12) return undefined;
  const original = isPlain ? part.textPlain : part.text;
  if (part.key === "weighing") {
    const expected = isPlain ? "Weighing the house as a whole, Parashara's test finds no sign either way." : "11.14-16: no sign of the house prospering or failing holds.";
    if (original === expected) return isPlain ? "ഭാവത്തെ മൊത്തത്തിൽ വിലയിരുത്തുമ്പോൾ അനുകൂലമായോ പ്രതികൂലമായോ സൂചനയൊന്നും പരാശരിയുടെ പരിശോധന കണ്ടെത്തുന്നില്ല." : "11.14–16: ഭാവം അഭിവൃദ്ധിപ്പെടുന്നതിന്റെയോ തകരുന്നതിന്റെയോ സൂചനയൊന്നും പൊരുത്തപ്പെടുന്നില്ല.";
    return undefined;
  }
  if (part.key === "both") {
    const alternatives: Record<string, string> = {
      "leans to the house prospering": "ഭാവത്തിന്റെ അഭിവൃദ്ധിയിലേക്ക് ചായുന്നു",
      "leans against the house": "ഭാവത്തിന് പ്രതികൂലമായ ദിശയിലേക്ക് ചായുന്നു",
      "finds signs on both sides": "ഇരുവശത്തേക്കുമുള്ള സൂചനകൾ കണ്ടെത്തുന്നു",
      "finds no sign either way": "ഇരുവശത്തേക്കും സൂചന കണ്ടെത്തുന്നില്ല",
    };
    for (const [en, ml] of Object.entries(alternatives)) {
      const expected = isPlain ? `The readings above run both ways, and the books do not rank them. Parashara's own test of a house, below, ${en}; read the lines as views to weigh, not as a sum.` : `The readings above run both ways and the books do not rank them. Parashara's test for judging a house (11.14-16) ${en}; read the verses as views to weigh, not a sum.`;
      if (original === expected) return isPlain ? `മുകളിലെ വായനകൾ ഇരുവശത്തേക്കും പോകുന്നു; ഗ്രന്ഥങ്ങൾ അവയ്ക്ക് ക്രമം നൽകുന്നില്ല. താഴെയുള്ള ഭാവത്തെക്കുറിച്ചുള്ള പരാശരിയുടെ സ്വന്തം പരിശോധന ${ml}. വാചകങ്ങൾ കൂട്ടിച്ചേർക്കാതെ, തൂക്കിനോക്കേണ്ട കാഴ്ചപ്പാടുകളായി വായിക്കുക.` : `മുകളിലെ വായനകൾ ഇരുവശത്തേക്കും പോകുന്നു; ഗ്രന്ഥങ്ങൾ അവയ്ക്ക് ക്രമം നൽകുന്നില്ല. ഭാവത്തെ വിലയിരുത്താനുള്ള പരാശരിയുടെ പരിശോധന (11.14–16) ${ml}. ശ്ലോകങ്ങൾ കൂട്ടിച്ചേർക്കാതെ, തൂക്കിനോക്കേണ്ട കാഴ്ചപ്പാടുകളായി വായിക്കുക.`;
    }
    return undefined;
  }
  if (part.key === "covers") {
    const source = isPlain ? HOUSE_AREAS_PLAIN[h] : HOUSE_MATTERS[h - 1]?.matters;
    const pair = (isPlain ? plain : practitioner)[h - 1];
    if (!pair || source !== pair[0]) return undefined;
    const expected = isPlain ? `Your ${ordH(h)} house covers ${source}. It falls in ${bhava.sign}, and its ruler is ${thePlanet(bhava.lord)}.` : `The ${ordH(h)} house, ${bhava.sign}, lord ${bhava.lord}: ${source}.`;
    const sign = translate("ml", bhava.sign), lord = translate("ml", bhava.lord);
    if (original !== expected || sign === bhava.sign || lord === bhava.lord) return undefined;
    return isPlain ? `നിങ്ങളുടെ ${h}-ാം ഭാവം ${pair[1]} എന്നിവ ഉൾക്കൊള്ളുന്നു. അത് ${sign} രാശിയിലാണ്; അതിന്റെ അധിപൻ ${lord} ആണ്.` : `${h}-ാം ഭാവം, ${sign} രാശി, അധിപൻ ${lord}: ${pair[1]}.`;
  }
  if (part.key === "empty") {
    const expected = isPlain ? `No planet sits in your ${ordH(h)} house.` : `No planet occupies the ${ordH(h)}.`;
    return original === expected ? `${h}-ാം ഭാവത്തിൽ ഗ്രഹങ്ങളില്ല.` : undefined;
  }
  if (part.key !== "aspects") return undefined;
  const floor = par.aspectFloor, aspects = bhava.aspects.filter((a) => a.quarters >= floor);
  if (!FLOOR[floor] || aspects.some((a) => !QUARTER[a.quarters] || translate("ml", a.planet) === a.planet)) return undefined;
  const expected = isPlain ? (aspects.length
    ? `${capital(listJoin(aspects.map((a) => (floor === 4 ? thePlanet(a.planet) : `${thePlanet(a.planet)} ${QUARTER_PLAIN[a.quarters]}`))))} ${aspects.length === 1 ? "looks" : "look"} at your ${ordH(h)} house${floor === 4 ? " with full strength" : ""}.`
    : `No planet looks at your ${ordH(h)} house${FLOOR_PLAIN[floor]}.`)
    : (aspects.length ? `Aspected by ${listJoin(aspects.map((a) => `${a.planet} (${QUARTER[a.quarters]})`))}; the rules count ${FLOOR[floor]}.` : `No aspect at the rules' floor (${FLOOR[floor]}).`);
  if (original !== expected) return undefined;
  if (!aspects.length) return isPlain ? `${h}-ാം ഭാവത്തിലേക്ക് ${floor === 4 ? "പൂർണബലത്തിൽ" : floor === 2 ? "പകുതിബലത്തിലോ അതിലധികമോ" : ""} ഒരു ഗ്രഹത്തിന്റെയും ദൃഷ്ടിയില്ല.` : `നിയമങ്ങളുടെ പരിധിയിൽ ദൃഷ്ടിയില്ല (${FLOOR_ML[floor]}).`;
  const names = aspects.map((a) => `${translate("ml", a.planet)}${isPlain && floor === 4 ? "" : ` (${QUARTER_ML[a.quarters]})`}`).join(", ");
  return isPlain ? `${names} ${h}-ാം ഭാവത്തിലേക്ക്${floor === 4 ? " പൂർണബലത്തിൽ" : ""} ദൃഷ്ടി നൽകുന്നു.` : `ദൃഷ്ടി നൽകുന്നത്: ${names}; നിയമങ്ങൾ എണ്ണുന്നത് ${FLOOR_ML[floor]} ആണ്.`;
}
