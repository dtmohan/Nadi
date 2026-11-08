/** Malayalam presentation of already selected school evidence, never a new interpretation. */
import type { AgreementInput } from "./agreement";
import { translate } from "./localization";
import type { SchoolTopicBrief } from "./school-topic-brief";
import type { TopicBuildOptions } from "./school-topics-expanded";
import type { ChartResult } from "./schema";
import { DateTime } from "luxon";
import { SIGNS } from "./astro";
import { parashariHouseContext, kpHouseContext } from "./chart-explanations";
import { LORD_IN_HOUSE } from "./parashari-data";
import { MALAYALAM_PARASHARI_LORDS } from "./malayalam-parashari-lords";
import { ordH, thePlanet, HOUSE_AREAS_PLAIN } from "./house-gloss";
import { toYou } from "./parashari-house-prose";
import { soften } from "./gentle";
import { redactProse } from "./life-stage";
import { strengthQualifierPlain } from "./shadbala";
import type { KpFinding } from "./rules-kp";
import type { Planet } from "./astro";
import type { Bhava, ParashariResult } from "./parashari";
import type { HouseProsePart } from "./parashari-house-prose";

const parH: Record<number, string> = { 1: "ശരീരവും സ്വഭാവവും", 2: "ധനവും കുടുംബവും", 3: "ധൈര്യവും സഹോദരങ്ങളും", 4: "അമ്മ, വീട്, സുഖസൗകര്യങ്ങൾ", 5: "പഠനവും സന്താനവും", 6: "ശത്രുക്കളും മാതൃബന്ധുക്കളും", 7: "പങ്കാളി, യാത്ര, വ്യാപാരം", 8: "അനന്തരാവകാശവും സംഘർഷവും", 9: "ഭാഗ്യവും മതവും", 10: "ജോലി, ബഹുമാനം, അധികാരം", 11: "വരുമാനവും സമൃദ്ധിയും", 12: "ചെലവുകൾ" };
export const parashariHouseGlossMalayalam = (house: number) => parH[house];
export const kpHouseMalayalam: Record<number, string> = { 1: "ആരോഗ്യം, രൂപം, സ്വഭാവം", 2: "ധനം, സംസാരം, കുടുംബം", 3: "സഹോദരങ്ങൾ, ആശയവിനിമയം, ചെറുയാത്രകൾ", 4: "അമ്മ, വിദ്യാഭ്യാസം, വീട്, വാഹനങ്ങൾ", 5: "സന്താനം, ബുദ്ധി, പ്രണയബന്ധങ്ങൾ", 6: "ഉദ്യോഗം, ശത്രുക്കൾ, തടസ്സങ്ങൾ", 7: "വിവാഹം, പങ്കാളികൾ, കരാറുകൾ", 8: "അനന്തരാവകാശം, ഇൻഷുറൻസ്, കടങ്ങൾ", 9: "ആരാധന, ഗവേഷണം, ദീർഘയാത്രകൾ", 10: "തൊഴിൽ, പേര്, ബഹുമാനം", 11: "ലാഭം, ആഗ്രഹപൂർത്തി, സുഹൃത്തുക്കൾ", 12: "ചെലവുകൾ, നിക്ഷേപം, വിദേശയാത്ര" };
const prasnaH: Record<number, string> = { 1: "ശരീരം, ആരോഗ്യം, ബലം", 2: "കുടുംബം, ധനം, സംസാരം", 3: "ധൈര്യം, സഹോദരങ്ങൾ, സഹായം", 4: "അമ്മ, ബന്ധുക്കൾ, വീട്, വാഹനങ്ങൾ", 5: "ബുദ്ധി, സന്താനം, മനസ്സ്", 6: "ശത്രുക്കൾ, തടസ്സങ്ങൾ, ആശങ്കകൾ", 7: "വിവാഹം, ജീവിതപങ്കാളി, മറ്റുള്ളവരുമായുള്ള ബന്ധങ്ങൾ", 8: "തടസ്സങ്ങൾ, സേവകർ, പുറംകെട്ടിടങ്ങൾ", 9: "ഭാഗ്യം, അച്ഛൻ, ഗുരുക്കന്മാർ", 10: "പ്രവൃത്തികൾ, ആജ്ഞാപിക്കാനുള്ള അധികാരം, സേവനം", 11: "ആഗ്രഹിച്ച വസ്തുക്കളുടെ ലഭ്യതയും മൂത്ത സഹോദരനും", 12: "ചെലവുകൾ" };
const topicNames: Partial<Record<SchoolTopicBrief["topic"], string>> = { career: "തൊഴിലിനെയും ജോലിയെയും", marriage: "വിവാഹത്തെയും", children: "സന്താനത്തെയും കുടുംബത്തെയും", father: "അച്ഛനെയും", mother: "അമ്മയെയും" };
const names: Record<SchoolTopicBrief["school"], string> = { parashari: "പരാശരി", kp: "KP", jaimini: "ജൈമിനി", alp: "ALP", prasna: "പ്രശ്ന മാർഗം" };
const karaka: Record<string, string> = { AK: "സ്വയം, ജീവിതലക്ഷ്യം, സ്ഥാനം", AmK: "ജോലി, പദവി, ഉപദേശകർ, സമൂഹത്തിലെ പങ്ക്", BK: "സഹോദരങ്ങൾ, ഗുരു, സ്വന്തം പരിശ്രമം", MK: "അമ്മ, വീട്, സ്വത്ത്, മനസ്സുഖം", PiK: "അച്ഛൻ, പാരമ്പര്യം, ധർമം, സംരക്ഷണം", PK: "സന്താനം, വിദ്യാർഥികൾ, സർഗാത്മകത, പുണ്യം", GK: "ബന്ധുക്കൾ, എതിരാളികൾ, തർക്കങ്ങൾ, രോഗം", DK: "ജീവിതപങ്കാളി, പങ്കാളിത്തം, അടുത്ത ബന്ധങ്ങൾ" };
const tr = (text: string) => translate("ml", text);
const translated = (text: string | undefined) => text && tr(text) !== text ? tr(text) : undefined;

/** Don't drop a rule's extra facts: keep the English line when they lack a translation. */
export function kpHereMalayalam(f: Pick<KpFinding, "cusp" | "subLord" | "used" | "inHouse" | "facts">): string | undefined {
  if (f.facts?.length) return undefined;
  const where = f.inHouse ? ` ${f.inHouse}-ാം ഭാവത്തിലാണ് (${kpHouseMalayalam[f.inHouse]}).` : "";
  const used = f.used?.length ? ` ഈ നിയമത്തിൽ ${f.used.map((h) => `${h}-ാം ഭാവം (${kpHouseMalayalam[h]})`).join(", ")} സൂചിപ്പിക്കുന്നു.` : "";
  return `ഇവിടെ ${f.cusp}-ാം ഭാവത്തിന്റെ തീരുമാനഗ്രഹം ${tr(f.subLord)} ആണ്.${where}${used}`;
}

export function kpTimingMalayalam(houses: number[], planets: Planet[], all: number): string {
  const hs = houses.map((h) => `${h}-ാം`);
  const list = hs.length > 1 ? `${hs.slice(0, -1).join(", ")} അല്ലെങ്കിൽ ${hs[hs.length - 1]}` : hs[0];
  const prefix = `സമയം: ${list} ഭാവ${houses.length === 1 ? "ത്തെ" : "ങ്ങളിൽ ഏതെങ്കിലും ഒന്നിനെ"} സൂചിപ്പിക്കുന്ന ഗ്രഹങ്ങളുടെ കാലങ്ങൾ.`;
  if (planets.length >= all) return `${prefix} ഈ ജാതകത്തിൽ എല്ലാ ഗ്രഹങ്ങളും അങ്ങനെ ചെയ്യുന്നതിനാൽ ഒരു പ്രത്യേക കാലം വേർതിരിക്കുന്നില്ല.`;
  if (!planets.length) return `${prefix} ഈ ജാതകത്തിൽ അത്തരത്തിലുള്ള ഗ്രഹങ്ങളില്ല.`;
  return `${prefix} ഈ ജാതകത്തിൽ: ${planets.map(tr).join(", ")}.`;
}

export function parashariHouseContextMalayalam(bhava: Bhava): string {
  const occupants = bhava.occupants.length ? `ഈ ഭാവത്തിൽ ${bhava.occupants.map(tr).join(", ")} സ്ഥിതിചെയ്യുന്നു.` : "ഈ ഭാവത്തിൽ ഗ്രഹങ്ങളില്ല. എന്നാലും ഭാവത്തിന് അധിപനുണ്ട്; മറ്റ് ഗ്രഹങ്ങളുടെ ദൃഷ്ടിയും ലഭിക്കാം. ദൃഷ്ടി ജാതകസ്ഥാനങ്ങൾ തമ്മിൽ കണക്കാക്കുന്ന ഒരു പരമ്പരാഗത ബന്ധമാണ്.";
  return `${bhava.house}-ാം ഭാവം ${parH[bhava.house]} എന്നീ ജീവിതവിഷയങ്ങളുമായി ബന്ധപ്പെടുത്തുന്ന ജാതകഭാഗമാണ്; ഇത് ഒരു കെട്ടിടമല്ല. ഈ ജാതകത്തിൽ ആ ഭാവം ${tr(bhava.sign)} രാശിയിലാണ്. ഈ രാശിയുടെ പരമ്പരാഗത അധിപൻ ${tr(bhava.lord)} ആണ്; ഇവിടെ ആ ഗ്രഹം ${bhava.lordIn}-ാം ഭാവത്തിലാണ് (${parH[bhava.lordIn]}). ${occupants}`;
}

/** Translate a complete, unchanged seventh- or tenth-lord paragraph, including its strength
 * qualification. Untranslated cancellations, redaction or changed wording fall back to English. */
export function parashariLordMalayalam(par: ParashariResult, bhava: Bhava, part: HouseProsePart): string | undefined {
  if (part.key !== "lord" || (bhava.house !== 7 && bhava.house !== 10)) return undefined;
  const e = LORD_IN_HOUSE[bhava.house - 1][bhava.lordIn - 1];
  const translatedEffect = MALAYALAM_PARASHARI_LORDS[e.verse];
  const card = par.findings.find((f) => f.id === `pa-lord-${bhava.house}-${bhava.lordIn}`);
  const sb = par.shadbala?.planets.find((p) => p.planet === bhava.lord);
  const Lord = thePlanet(bhava.lord).replace(/^./, (c) => c.toUpperCase());
  const where = bhava.lordIn === bhava.house ? "in the house itself" : `in your ${ordH(bhava.lordIn)} (${HOUSE_AREAS_PLAIN[bhava.lordIn]})`;
  const qualifier = sb ? ` ${strengthQualifierPlain(Lord, sb)}.` : "";
  const effect = toYou(soften(e.text));
  const lower = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Parashara|Mantreswara)\b/.test(effect) ? effect : effect.charAt(0).toLowerCase() + effect.slice(1);
  const expected = `Since ${thePlanet(bhava.lord)}, ruler of your ${ordH(bhava.house)} house, sits ${where}, Parashara reads: ${lower}${qualifier}`;
  if (card?.nullified || card?.debilityCancelled || translatedEffect?.source !== e.text || soften(e.text) !== e.text || redactProse(e.text) !== e.text || part.textPlain !== expected || soften(expected) !== expected) return undefined;
  const place = bhava.lordIn === bhava.house ? "അതേ ഭാവത്തിൽ" : `${bhava.lordIn}-ാം ഭാവത്തിൽ (${parH[bhava.lordIn]})`;
  const strength = !sb ? "" : sb.effect === "full"
    ? ` ${tr(bhava.lord)} ആപ്പിന്റെ ബലമാനദണ്ഡം കൈവരിക്കുന്നു. കൂടുതൽ ബലം കൂടുതൽ പൂർണഫലവുമായി ഉറവിടം ബന്ധിപ്പിക്കുന്നു; ഈ പരിശോധന മാത്രം ഫലം സ്ഥാപിക്കുന്നില്ല.`
    : ` ${tr(bhava.lord)} പറഞ്ഞിരിക്കുന്ന ബലാവശ്യത്തിന്റെ ${Math.round(sb.total / sb.required * 100)}% കൈവരിക്കുന്നു; ആപ്പ് താൽക്കാലികമായി ഇതിനെ ഉറവിടത്തിലെ ${sb.effect === "half" ? "മധ്യമബല" : "കുറഞ്ഞബല"} വിഭാഗത്തിൽ ഉൾപ്പെടുത്തുന്നു.`;
  return `${bhava.house}-ാം ഭാവാധിപനായ ${tr(bhava.lord)} ${place} നിൽക്കുന്നതിനാൽ പരാശരി പറയുന്നത്: ${translatedEffect.text}${strength}`;
}

/** Only return a translation when its exact original is known. */
export function schoolSourceMalayalam(text: string): string | undefined {
  const prefix = text.startsWith("Secondary note: ") ? "Secondary note: " : text.startsWith("Secondary note, not the deciding result: ") ? "Secondary note, not the deciding result: " : "";
  const body = prefix ? text.slice(prefix.length) : text;
  const value = translated(body);
  if (!value) return undefined;
  return `${prefix ? "ദ്വിതീയ സൂചന (തീരുമാനിക്കുന്ന ഫലമല്ല): " : ""}${value}`;
}

export function withSchoolMalayalam(b: SchoolTopicBrief, result: ChartResult, input: AgreementInput, options: TopicBuildOptions = {}): SchoolTopicBrief {
  const ml: NonNullable<SchoolTopicBrief["ml"]> = { ...b.ml };
  const topic = topicNames[b.topic];
  // The comparison stances exist only for the legacy five topics and these three schools.
  if (topic && ["parashari", "kp", "jaimini"].includes(b.school)) {
    const school = names[b.school];
    const stance = {
      supports: `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ${topic} അനുകൂലമായി കാണുന്നു.`,
      "leans-supports": `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ചില വ്യവസ്ഥകളോടെ ${topic} പൊതുവേ അനുകൂലമായി കാണുന്നു.`,
      strains: `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ${topic} ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾക്ക് പ്രാധാന്യം നൽകുന്നു.`,
      "leans-strains": `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ചില വ്യവസ്ഥകളോടെ ${topic} പൊതുവേ ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങളിലേക്ക് വിരൽചൂണ്ടുന്നു.`,
      mixed: `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ${topic} സമ്മിശ്രമോ വ്യക്തമായ നിഗമനമില്ലാത്തതോ ആയ ചിത്രം നൽകുന്നു.`,
      contested: `തിരഞ്ഞെടുത്ത ${school} വ്യാഖ്യാനങ്ങൾ ${topic} വിയോജിക്കുന്നു; അനുകൂല സൂചനകളും ശ്രദ്ധാസൂചനകളും രണ്ടും നിലനിർത്തിയിരിക്കുന്നു.`,
      silent: `ഈ താരതമ്യത്തിൽ തിരഞ്ഞെടുത്ത ${school} നിയമങ്ങൾ ${topic} പൊതുവായ നിഗമനം നൽകുന്നില്ല. കൂടുതൽ പ്രത്യേകമായ നിയമം ആ രീതിയുടെ വായനയിൽ കാണാം.`,
    } as const;
    ml.summary = stance[b.stance];
  }
  ml.frame = translated(b.frame);
  ml.limit = translated(b.limit);
  ml.basis = translated(b.basis);
  ml.reason = translated(b.reason);
  if (b.details?.length) {
    const details = Object.fromEntries(b.details.flatMap((d) => { const text = schoolSourceMalayalam(d.text); return text ? [[d.id, text]] : []; }));
    if (Object.keys(details).length) ml.details = details;
  }
  if (b.school === "parashari" && b.detailHouse && b.explanation?.length) {
    const bhava = input.parashari.bhavas.find((h) => h.house === b.detailHouse);
    if (bhava && b.explanation[0] === parashariHouseContext(bhava)) {
      ml.explanation = [parashariHouseContextMalayalam(bhava), ...b.explanation.slice(1).map(translated)];
    }
    // Reconstruct only an unchanged, already selected source line. Any extra cancellation or
    // redaction stays in English until its exact wording has a translation of its own.
    const d = b.details?.find((v) => v.id === `house-${b.detailHouse}-lord`);
    const part = input.parashari.houseProse?.find((h) => h.house === b.detailHouse)?.parts.find((p) => p.key === "lord");
    const sourceMl = bhava && part ? parashariLordMalayalam(input.parashari, bhava, part) : undefined;
    if (d && part && sourceMl && ["House-level source interpretation: ", "A house-level interpretation: "].some((prefix) => d.text === `${prefix}${soften(part.textPlain)}`))
      ml.details = { ...ml.details, [d.id]: `ഭാവത്തെക്കുറിച്ചുള്ള ഉറവിടവ്യാഖ്യാനം: ${sourceMl}` };
  }
  if (b.school === "kp" && b.detailHouse && b.explanation?.length) {
    const c = input.kp.cusps.find((x) => x.house === b.detailHouse);
    const sl = c && input.kp.planets.find((p) => p.planet === c.subLord);
    const sig = c && input.kp.significators.find((p) => p.planet === c.subLord);
    if (c && sl && sig && b.explanation[0] === kpHouseContext(c, sl, sig.houses, false)) {
      const houses = sig.houses.length ? sig.houses.map((h) => `${h}-ാം`).join(", ") + " ഭാവങ്ങളുമായി" : "തിരഞ്ഞെടുത്ത പട്ടികയിൽ ഒരു ഭാവവുമായും";
      ml.explanation = [`KP രീതിയിൽ ${kpHouseMalayalam[c.house]} എന്നീ വിഷയങ്ങൾ പരിശോധിക്കുന്നത് ${c.house}-ാം ഭാവത്തിന്റെ ആരംഭബിന്ദുവിലൂടെയാണ്; അതിനെ കസ്പ് എന്നു പറയുന്നു. 27 നക്ഷത്രവിഭാഗങ്ങളെ ചെറിയ ഭാഗങ്ങളായി വിഭജിക്കുമ്പോൾ ഈ കസ്പ് വരുന്ന ഭാഗത്തിന്റെ സഹാധിപൻ (ഉപ അധിപൻ / sub-lord) ${tr(c.subLord)} ആണ്. KP ജാതകത്തിൽ ${tr(c.subLord)} ${sl.house}-ാം ഭാവത്തിലും ${tr(sl.starLord)} നക്ഷത്രാധിപനായ നക്ഷത്രത്തിലുമാണ്. നാലുഘട്ട പട്ടിക ഈ ഗ്രഹത്തെ ${houses} ബന്ധിപ്പിക്കുന്നു. ആ ഭാവങ്ങൾ പ്രത്യേക നിയമം പരിഗണിക്കുന്ന മറ്റു വിഷയങ്ങളാണ്; ഇവ മാത്രം പൂർണ പ്രവചനമല്ല.`];
    }
  }
  if (b.school === "jaimini" && b.detailArea && b.explanation?.length) {
    const area = input.jaimini.find((a) => a.area === b.detailArea);
    if (area && area.karakas.length === b.explanation.length) ml.explanation = area.karakas.map((k) => `${translate("ml", area.label)} എന്ന വിഷയത്തിൽ ${tr(k.planet)} ${k.karaka} ആണ്. ഇത് ${karaka[k.karaka]} എന്നിവയെ സൂചിപ്പിക്കുന്ന ചരകാരകമാണ്. ജനനജാതകമായ D1-ൽ ${tr(SIGNS[k.sign])} രാശിയിലും നവാംശമായ D9-ൽ ${tr(SIGNS[k.d9Sign])} രാശിയിലുമാണ് ഈ ഗ്രഹം.`);
  }
  if (b.school === "alp" && options.alp) {
    const day = DateTime.fromISO(options.alp.asOf, { setZone: true }).setZone(result.chart.timezone).setLocale("ml-IN").toFormat("d LLL yyyy");
    ml.frame = `${day} തീയതിയിലെ പുരോഗമന വായന`;
    const first = b.details?.[0] && schoolSourceMalayalam(b.details[0].text);
    if (first) ml.summary = `${first}${b.details!.length > 1 ? ` തിരഞ്ഞെടുത്ത മറ്റ് ${b.details!.length - 1} വ്യാഖ്യാനങ്ങൾ താഴെ കാണാം.` : ""}`;
    else if (!b.details?.length) ml.summary = `${day} തീയതിയിൽ പരിശോധിച്ച വിഷയനിർദിഷ്ട ALP നിയമങ്ങളൊന്നും പൊരുത്തപ്പെട്ടില്ല. അതുകൊണ്ട് ഈ വിഷയത്തിന്റെ സാധ്യത ഉണ്ടെന്നോ ഇല്ലെന്നോ തീർപ്പാക്കാനാവില്ല.`;
  }
  if (b.school === "prasna" && b.detailHouse && options.prasna) {
    const house = b.detailHouse; const pm = options.prasna; const occupants = pm.readings.find((r) => r.house === house);
    ml.frame = pm.frame === "natal" ? "ജനനജാതകത്തിലെ ഭാവവായന" : `പ്രശ്നജാതകത്തിലെ ആകാശനില${pm.asOf ? ` · ${pm.asOf}` : ""}${pm.arudha ? ` · ആരൂഢം ${pm.arudha}` : ""}`;
    ml.summary = `${house}-ാം ഭാവം ${prasnaH[house]} എന്നിവ ഉൾക്കൊള്ളുന്നു. ${occupants ? "തിരഞ്ഞെടുത്ത ജാതകത്തിൽ ഈ ഭാവത്തിൽ ഗ്രഹങ്ങളുണ്ട്." : "തിരഞ്ഞെടുത്ത ജാതകത്തിൽ ഈ ഭാവത്തിൽ ഗ്രഹങ്ങളില്ല; അതിന്റെ അധിപൻ എങ്കിലും പ്രധാനമാകാം."}`;
    if (occupants && b.explanation?.length) ml.explanation = [`തിരഞ്ഞെടുത്ത ${pm.frame === "natal" ? "ജനന" : "പ്രശ്ന"}ജാതകത്തിൽ ഈ ഭാവത്തിലുള്ള ഗ്രഹങ്ങൾ: ${occupants.occupants.map((p) => tr(p.planet)).join(", ")}. ഗ്രഹങ്ങളുള്ള ഭാവത്തെക്കുറിച്ചുള്ള ഉറവിടവ്യാഖ്യാനം മുഴുവൻ ഭാവത്തെയും ബാധിക്കുന്നു; ഓരോ വിഷയത്തെയും പ്രത്യേകമായി ബാധിക്കണമെന്നില്ല.`];
    const suffix = "A house-level assessment is not a verdict on this particular matter.";
    const limit = b.limit.endsWith(suffix) ? b.limit.slice(0, -suffix.length).trim() : "";
    if (limit && translated(limit)) ml.limit = `${tr(limit)} ${tr(suffix)}`;
    if (b.details?.[0]) ml.details = { ...ml.details, [b.details[0].id]: `ഈ ഭാവം ${prasnaH[house]} എന്നിവ ഉൾക്കൊള്ളുന്നു; യഥാർത്ഥ വ്യവസ്ഥകൾ ഭാവവിശദാംശങ്ങളിൽ കാണുക.` };
  }
  if (b.school === "prasna" && !b.detailHouse) ml.summary = translated(b.summary);
  return { ...b, ml };
}
