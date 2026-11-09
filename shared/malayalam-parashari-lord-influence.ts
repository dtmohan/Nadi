import type { LordInfluenceClue } from "./parashari-houses";
import { thePlanet } from "./house-gloss";
import { PLANETS } from "./astro";
import { translate } from "./localization";

/** A complete Phaladeepika clue only; every printed observation and limitation must match. */
export function parashariLordInfluenceMalayalam(clue: LordInfluenceClue, source: string, plain: boolean): string | undefined {
  const { planet, kind, qualifiers: q } = clue;
  const all = [planet, ...q.otherMaleficOccupants, ...q.otherMaleficAspects];
  if ((kind !== "aspects" && kind !== "occupies") || all.some((p) => !(PLANETS as readonly string[]).includes(p) || translate("ml", p) === p)) return undefined;
  const combustion: Record<LordInfluenceClue["qualifiers"]["lordCombustion"], string> = {
    combust: "അസ്തംഗതം", "not-combust": "അസ്തംഗതമല്ല", "not-applicable": "ബാധകമല്ല", unavailable: "ലഭ്യമല്ല",
  };
  if (!combustion[q.lordCombustion] || typeof q.lordDebilitated !== "boolean" || typeof q.lordInNaturalEnemySign !== "boolean") return undefined;
  const enList = (ps: string[]) => !ps.length ? "none found in this test" : ps.length === 1 ? ps[0] : `${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`;
  const mlList = (ps: string[]) => ps.length ? ps.map((p) => translate("ml", p)).join(", ") : "ഈ പരിശോധനയിൽ കണ്ടെത്തിയില്ല";
  const qualification = "A house lord's occupation or aspect is one condition in Phaladeepika 15.1. The verse also discusses freedom from malefic influence and the condition of the planets; this clue alone does not establish the complete rule or an event promise.";
  const checks = `Other natural malefic occupants: ${enList(q.otherMaleficOccupants)}; other natural malefic aspects at the selected floor: ${enList(q.otherMaleficAspects)}. The lord is ${q.lordDebilitated ? "in its debilitation sign" : "not in its debilitation sign"}, ${q.lordInNaturalEnemySign ? "in a natural enemy's sign" : "not in a natural enemy's sign"}; its solar-combustion check is ${q.lordCombustion} (Surya Siddhanta 9.6–9, 10.1 longitude convention). These are partial checks, not the complete rule or an event promise.`;
  const checksPlain = `Other traditionally challenging planets in this house: ${enList(q.otherMaleficOccupants)}; looking at its sign: ${enList(q.otherMaleficAspects)}. Its ruler is ${q.lordDebilitated ? "in a traditionally weak sign" : "not in its traditionally weak sign"} and ${q.lordInNaturalEnemySign ? "in a sign ruled by a traditional enemy" : "not in a sign ruled by a traditional enemy"}. Its proximity-to-the-Sun check is ${q.lordCombustion.replaceAll("-", " ")}. These are partial checks, not a complete judgment or event promise.`;
  const expected = plain ? `${thePlanet(planet)}, this house's ruler, ${kind === "aspects" ? "looks at its sign" : "is in this house"}. Mantreswara treats this as one helpful clue; his full rule also considers challenging influences and the planets' condition. ${checksPlain}` : `${planet}, the house lord, ${kind === "aspects" ? "aspects this house's sign" : "occupies this selected house"}. ${qualification} ${checks}`;
  if (source !== expected || source !== (plain ? clue.plain : clue.text)) return undefined;
  const lord = translate("ml", planet);
  const position = kind === "aspects" ? "ഈ ഭാവത്തിന്റെ രാശിയിലേക്ക് ദൃഷ്ടി നൽകുന്നു" : "തിരഞ്ഞെടുത്ത ഈ ഭാവത്തിൽ സ്ഥിതിചെയ്യുന്നു";
  const condition = plain ? "മന്ത്രേശ്വരൻ ഇതിനെ സഹായകമായ ഒരു സൂചനയായി കാണുന്നു; അദ്ദേഹത്തിന്റെ പൂർണ നിയമം പ്രതികൂല സ്വാധീനങ്ങളും ഗ്രഹങ്ങളുടെ അവസ്ഥയും കൂടി പരിഗണിക്കുന്നു." : "ഭാവാധിപന്റെ സ്ഥിതിയോ ദൃഷ്ടിയോ ഫലദീപിക 15.1-ലെ ഒരു വ്യവസ്ഥയാണ്. പാപഗ്രഹ സ്വാധീനത്തിൽനിന്നുള്ള മോചനവും ഗ്രഹങ്ങളുടെ അവസ്ഥയും ശ്ലോകം പരിഗണിക്കുന്നു; ഈ ഒരു സൂചനകൊണ്ട് പൂർണ നിയമമോ ഒരു സംഭവവാഗ്ദാനമോ ഉറപ്പിക്കാനാവില്ല.";
  const others = plain ? `ഈ ഭാവത്തിലെ മറ്റു പരമ്പരാഗതമായി ബുദ്ധിമുട്ട് സൂചിപ്പിക്കുന്ന ഗ്രഹങ്ങൾ: ${mlList(q.otherMaleficOccupants)}; അതിന്റെ രാശിയിലേക്ക് ദൃഷ്ടി നൽകുന്നവ: ${mlList(q.otherMaleficAspects)}.` : `മറ്റു സ്വാഭാവിക പാപഗ്രഹ സ്ഥാനങ്ങൾ: ${mlList(q.otherMaleficOccupants)}; തിരഞ്ഞെടുത്ത ദൃഷ്ടിബലപരിധിയിൽ മറ്റു സ്വാഭാവിക പാപഗ്രഹ ദൃഷ്ടികൾ: ${mlList(q.otherMaleficAspects)}.`;
  const dignity = plain ? `${q.lordDebilitated ? "പരമ്പരാഗതമായി ദുർബലമായ രാശിയിലാണ്" : "തന്റെ പരമ്പരാഗതമായി ദുർബലമായ രാശിയിലല്ല"}; ${q.lordInNaturalEnemySign ? "പരമ്പരാഗത ശത്രു ഭരിക്കുന്ന രാശിയിലാണ്" : "പരമ്പരാഗത ശത്രു ഭരിക്കുന്ന രാശിയിലല്ല"}` : `${q.lordDebilitated ? "നീചരാശിയിലാണ്" : "നീചരാശിയിലല്ല"}; ${q.lordInNaturalEnemySign ? "സ്വാഭാവിക ശത്രുവിന്റെ രാശിയിലാണ്" : "സ്വാഭാവിക ശത്രുവിന്റെ രാശിയിലല്ല"}`;
  const end = plain ? "ഇവ ഭാഗിക പരിശോധനകളാണ്; പൂർണ വിധിയോ സംഭവവാഗ്ദാനമോ അല്ല." : "ഇവ ഭാഗിക പരിശോധനകളാണ്; പൂർണ നിയമമോ സംഭവവാഗ്ദാനമോ അല്ല.";
  return `ഭാവാധിപനായ ${lord} ${position}. ${condition} ${others} അധിപൻ ${dignity}. ${plain ? "സൂര്യനോടുള്ള സാമീപ്യ പരിശോധന" : "സൂര്യനാൽ അസ്തംഗതമായോ എന്ന പരിശോധന"}: ${combustion[q.lordCombustion]}${plain ? "" : " (സൂര്യസിദ്ധാന്തം 9.6–9, 10.1 രേഖാംശ രീതി)"}. ${end}`;
}
