import type { BirthStarReading } from "./birth-star";
import { soften } from "./gentle";
import { translate } from "./localization";
import { endStop } from "./report/types";

/** Full plain facts only, after the caller's sensitive-content gate. */
const VALUES: Record<string, string> = {
  "Ashwini Kumaras, the twin physicians": "അശ്വിനീകുമാരന്മാർ, ഇരട്ട വൈദ്യന്മാർ",
  "Yama, associated with duty and restraint": "യമൻ, കർത്തവ്യവും സംയമനവുമായി ബന്ധപ്പെട്ട ദേവത",
  "Agni, the fire deity": "അഗ്നി, അഗ്നിദേവൻ", Brahma: "ബ്രഹ്മാവ്",
  "Soma, the Moon deity": "സോമൻ, ചന്ദ്രദേവൻ", "Rudra, a form of Shiva": "രുദ്രൻ, ശിവന്റെ ഒരു രൂപം",
  "Aditi, associated with infinity": "അദിതി, അനന്തതയുമായി ബന്ധപ്പെട്ട ദേവത", Brihaspati: "ബൃഹസ്പതി",
  "Nagas, the serpents": "നാഗങ്ങൾ, സർപ്പങ്ങൾ", "Pitris, the ancestors": "പിതൃക്കൾ, പൂർവികർ",
  "Bhaga, associated with good fortune": "ഭഗൻ, സൗഭാഗ്യവുമായി ബന്ധപ്പെട്ട ദേവത",
  "Aryaman, associated with honour and social bonds": "അര്യമാവ്, ബഹുമാനവും സാമൂഹികബന്ധങ്ങളുമായി ബന്ധപ്പെട്ട ദേവത",
  "Savitar, the solar deity": "സവിതാവ്, സൂര്യദേവൻ", "Tvashtar, the celestial architect": "ത്വഷ്ടാവ്, ദേവശില്പി",
  "Vayu, associated with wind and life breath": "വായു, കാറ്റിനും പ്രാണനും ബന്ധപ്പെട്ട ദേവത",
  "Agni and Indra": "അഗ്നിയും ഇന്ദ്രനും", "Mitra, associated with light": "മിത്രൻ, പ്രകാശവുമായി ബന്ധപ്പെട്ട ദേവത", Indra: "ഇന്ദ്രൻ",
  "Nirriti, associated with dismantling old forms": "നിരൃതി, പഴയ രൂപങ്ങൾ അഴിച്ചുമാറ്റുന്നതുമായി ബന്ധപ്പെട്ട ദേവത",
  "Apas, associated with water": "അപസ്, ജലവുമായി ബന്ധപ്പെട്ട ദേവതകൾ", "Vishwadevas, the universal deities": "വിശ്വദേവന്മാർ, സാർവത്രിക ദേവതകൾ",
  "Vishnu, the preserver": "വിഷ്ണു, പരിപാലകൻ", "The eight Vasus": "എട്ട് വസുക്കൾ",
  "Varuna, associated with the sea": "വരുണൻ, സമുദ്രവുമായി ബന്ധപ്പെട്ട ദേവത",
  "Aja Ekapada, the one-footed goat": "അജ ഏകപാദൻ, ഒറ്റക്കാലുള്ള ആട്", "Ahir Budhnya, the deep-ocean serpent": "അഹിർബുധ്ന്യൻ, ആഴക്കടലിലെ സർപ്പം",
  "Pushan, a solar deity": "പൂഷാവ്, ഒരു സൂര്യദേവൻ",
  "Horse's head": "കുതിരയുടെ തല", "Yoni, an image of creative power": "യോനി, സൃഷ്ടിശക്തിയുടെ പ്രതീകം",
  Razor: "ക്ഷൗരക്കത്തി", Chariot: "തേര്", "Deer's head": "മാനിന്റെ തല", "Head, teardrop or jewel": "തല, കണ്ണുനീർത്തുള്ളി അല്ലെങ്കിൽ രത്നം",
  Bow: "വില്ല്", "Flower, arrow or circle": "പുഷ്പം, അമ്പ് അല്ലെങ്കിൽ വൃത്തം", Serpent: "സർപ്പം", Palanquin: "പല്ലക്ക്",
  "Fireplace, bed or platform": "അടുപ്പ്, കിടക്ക അല്ലെങ്കിൽ വേദി", "Four legs of a cot": "കട്ടിലിന്റെ നാല് കാലുകൾ", "Palm of the hand": "ഉള്ളംകൈ",
  Pearl: "മുത്ത്", Coral: "പവിഴം", "Potter's wheel or archway": "കുശവന്റെ ചക്രമോ കവാടകമാനമോ", Lotus: "താമര", Earring: "കമ്മൽ",
  "Lion's tail or elephant's goad": "സിംഹത്തിന്റെ വാലോ ആനയുടെ അങ്കുശമോ", "Elephant's tusk": "ആനക്കൊമ്പ്", "Planks of a bed": "കട്ടിലിന്റെ പലകകൾ",
  "Ear or three footsteps": "ചെവിയോ മൂന്ന് കാൽപ്പാടുകളോ", "Mridanga drum and flute": "മൃദംഗവും ഓടക്കുഴലും", "Hundred stars": "നൂറ് നക്ഷത്രങ്ങൾ", Sword: "വാൾ", Twins: "ഇരട്ടകൾ", Fish: "മീൻ",
  "Duty and right action": "കർത്തവ്യവും ശരിയായ പ്രവർത്തനവും", "Practical purpose and resources": "പ്രായോഗിക ലക്ഷ്യവും വിഭവങ്ങളും",
  "Desire and fulfilment": "ആഗ്രഹവും സാക്ഷാത്കാരവും", "Inner freedom and realisation": "ആന്തരിക സ്വാതന്ത്ര്യവും തിരിച്ചറിവും",
};
const LABELS: Record<string, [string, string]> = {
  ruler: ["Star ruler", "നക്ഷത്രാധിപൻ"], deity: ["Deity", "ദേവത"], symbol: ["Symbol", "പ്രതീകം"], aim: ["Life aim", "ജീവിതലക്ഷ്യം"],
};

export function birthStarPlainFactsMalayalam(star: BirthStarReading, source: string): string | undefined {
  const facts = star.facts.filter((f) => !f.practitionerOnly);
  if (facts.length !== 4 || facts.map((f) => f.key).join(",") !== "ruler,deity,symbol,aim") return undefined;
  if (facts.some((f) => !LABELS[f.key] || f.label !== LABELS[f.key][0])) return undefined;
  const raw = facts.map((f) => endStop(`${f.label}: ${f.plain}`)).join(" ");
  const expected = soften(raw);
  // Never restore wording changed by a present or future plain-reading softener.
  if (raw !== expected || source !== expected) return undefined;
  const values = facts.map((f) => f.key === "ruler" ? translate("ml", f.plain) : VALUES[f.plain]);
  if (values.some((v, i) => !v || v === facts[i].plain)) return undefined;
  return facts.map((f, i) => `${LABELS[f.key][1]}: ${values[i]}.`).join(" ");
}
