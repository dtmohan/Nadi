/**
 * Reader-facing context from an already-selected school topic. These paragraphs explain
 * chart facts; the school still supplies its own interpretation, scope and qualifications.
 */
import { DateTime } from "luxon";
import { SIGNS } from "./astro";
import type { AgreementInput } from "./agreement";
import type { AlpResult } from "./alp";
import { parashariHouseContext, kpHouseContext } from "./chart-explanations";
import { listJoin, ordH } from "./house-gloss";
import { mentionsHeldArea } from "./life-stage";
import { translate } from "./localization";
import type { PrasnaHouseReading } from "./rules-prasna";
import type { ChartResult } from "./schema";
import type { SchoolTopicBrief } from "./school-topic-brief";

export interface ReaderSchoolParagraph {
  kind: "parashari-house" | "kp-cusp" | "jaimini-karaka" | "alp-point" | "prasna-house";
  en: string;
  ml: string;
}
const tr = (text: string) => translate("ml", text);
const jaiminiRole: Record<string, { en: string; ml: string }> = {
  AK: { en: "the self and personal direction", ml: "സ്വയത്തെയും വ്യക്തിജീവിത ദിശയെയും" },
  AmK: { en: "work, position and one's role in the world", ml: "തൊഴിൽ, സ്ഥാനം, സമൂഹത്തിലെ പങ്ക് എന്നിവയെയും" },
  BK: { en: "siblings, teachers and personal initiative", ml: "സഹോദരങ്ങൾ, ഗുരു, സ്വന്തം പരിശ്രമം എന്നിവയെയും" },
  MK: { en: "mother, home and inner comfort", ml: "അമ്മ, വീട്, മനസ്സുഖം എന്നിവയെയും" },
  PiK: { en: "father, lineage and dharma", ml: "അച്ഛൻ, പാരമ്പര്യം, ധർമം എന്നിവയെയും" },
  PK: { en: "children, students and creativity", ml: "സന്താനം, വിദ്യാർഥികൾ, സർഗാത്മകത എന്നിവയെയും" },
  GK: { en: "relatives, rivals and disputes", ml: "ബന്ധുക്കൾ, എതിരാളികൾ, തർക്കങ്ങൾ എന്നിവയെയും" },
  DK: { en: "partners and close alliances", ml: "പങ്കാളിയെയും അടുത്ത ബന്ധങ്ങളെയും" },
};

export function readerSchoolContext(
  result: ChartResult,
  input: AgreementInput,
  brief: SchoolTopicBrief,
  alp: AlpResult,
  prasna: readonly PrasnaHouseReading[],
): ReaderSchoolParagraph[] {
  const held = (topic: "career" | "wealth" | "marriage" | "children") => !input.inSeason(topic);
  const safe = (p: ReaderSchoolParagraph): ReaderSchoolParagraph[] =>
    mentionsHeldArea(p.en, held) ? [] : [p];
  if (brief.school === "parashari" && brief.detailHouse) {
    const h = input.parashari.bhavas.find((b) => b.house === brief.detailHouse);
    if (!h || !brief.explanation?.includes(parashariHouseContext(h))) return [];
    return safe({ kind: "parashari-house",
      en: `In the selected Parashari house scheme, the ${ordH(h.house)} house falls in ${h.sign}. Its ruler is ${h.lord}, placed in the ${ordH(h.lordIn)} house. This position is part of the house reading; the house also covers other matters.`,
      ml: `തിരഞ്ഞെടുത്ത പരാശരി ഭാവരീതിയിൽ ${h.house}-ാം ഭാവം ${tr(h.sign)} രാശിയിലാണ്. ആ രാശിയുടെ അധിപൻ ${tr(h.lord)} ആണ്; ഈ ഗ്രഹം ${h.lordIn}-ാം ഭാവത്തിലുണ്ട്. ഇത് ഭാവവായനയിലെ ഒരു ഘടകമാണ്; അതേ ഭാവം മറ്റു വിഷയങ്ങളും ഉൾക്കൊള്ളുന്നു.` });
  }
  if (brief.school === "kp" && brief.detailHouse) {
    const cusp = input.kp.cusps.find((c) => c.house === brief.detailHouse);
    const planet = cusp && input.kp.planets.find((p) => p.planet === cusp.subLord);
    const sig = cusp && input.kp.significators.find((p) => p.planet === cusp.subLord);
    if (!cusp || !planet || !sig || !brief.explanation?.includes(kpHouseContext(cusp, planet, sig.houses, false))) return [];
    const houses = sig.houses.length ? `links this planet to ${listJoin(sig.houses.map((h) => `the ${ordH(h)} house`))}` : "does not link this planet to a house";
    const mlHouses = sig.houses.length ? `നാലുഘട്ട പട്ടിക ഈ ഗ്രഹത്തെ ${sig.houses.map((h) => `${h}-ാം`).join(", ")} ഭാവങ്ങളുമായി ബന്ധിപ്പിക്കുന്നു.` : "തിരഞ്ഞെടുത്ത നാലുഘട്ട പട്ടികയിൽ ഈ ഗ്രഹവുമായി ബന്ധിപ്പിച്ച ഭാവങ്ങളില്ല.";
    return safe({ kind: "kp-cusp",
      en: `KP starts here with the ${ordH(cusp.house)} house cusp—the house's starting point—which falls in ${cusp.sign}. Its sub-lord is ${cusp.subLord}; the four-step table ${houses}. The links need the particular rule's conditions before they can be interpreted.`,
      ml: `KP ഇവിടെ ${cusp.house}-ാം ഭാവത്തിന്റെ ആരംഭബിന്ദുവായ കസ്പിൽ നിന്നാണ് തുടങ്ങുന്നത്. അത് ${tr(cusp.sign)} രാശിയിലാണ്; അതിന്റെ സഹാധിപൻ ${tr(cusp.subLord)} ആണ്. ${mlHouses} ഈ ബന്ധങ്ങൾ വ്യാഖ്യാനിക്കാൻ അതത് നിയമത്തിന്റെ വ്യവസ്ഥകളും പരിശോധിക്കണം.` });
  }
  if (brief.school === "jaimini" && brief.detailArea && brief.explanation?.length) {
    const area = input.jaimini.find((a) => a.area === brief.detailArea);
    if (!area) return [];
    return area.karakas.slice(0, 2).flatMap((k) => {
      const role = jaiminiRole[k.karaka];
      if (!role || !brief.explanation?.some((line) => line.includes(`${k.planet} is ${k.karaka}`))) return [];
      return safe({ kind: "jaimini-karaka",
        en: `For this shared Jaimini area, ${k.planet} is ${k.karaka}, a movable significator associated with ${role.en}. It is in ${SIGNS[k.sign]} in the birth chart and ${SIGNS[k.d9Sign]} in D9, a division calculated from the same birth chart.`,
        ml: `പങ്കുവയ്ക്കപ്പെട്ട ഈ ജൈമിനി മേഖലയിൽ ${tr(k.planet)} ${k.karaka} ആണ്. ${role.ml} സൂചിപ്പിക്കാൻ ഈ രീതി ഉപയോഗിക്കുന്ന ചരകാരകമാണത്. ജനനജാതകത്തിൽ ${tr(SIGNS[k.sign])} രാശിയിലും അതിൽനിന്ന് കണക്കാക്കുന്ന D9-ൽ ${tr(SIGNS[k.d9Sign])} രാശിയിലുമാണ് ഈ ഗ്രഹം.` });
    });
  }
  if (brief.school === "alp" && brief.frame?.startsWith("Progressed reading")) {
    const day = DateTime.fromISO(alp.asOf, { setZone: true }).setZone(result.chart.timezone);
    const enDay = day.setLocale("en").toFormat("d LLL yyyy");
    const mlDay = day.setLocale("ml-IN").toFormat("d LLL yyyy");
    return safe({ kind: "alp-point",
      en: `For ${enDay}, the ALP moving point is in ${alp.point.sign}, in the star section ${alp.point.nakshatra}. ALP uses this progressed position to explore the period; the summary above says whether a reviewed rule for this topic matched.`,
      ml: `${mlDay} തീയതിയിൽ ALP-യുടെ ചലിക്കുന്ന ബിന്ദു ${tr(alp.point.sign)} രാശിയിലും ${tr(alp.point.nakshatra)} നക്ഷത്രത്തിലുമാണ്. ആ കാലയളവ് പരിശോധിക്കാൻ ALP ഈ പുരോഗമനസ്ഥാനം ഉപയോഗിക്കുന്നു; ഈ വിഷയത്തിലെ പരിശോധിച്ച നിയമം പൊരുത്തപ്പെട്ടോ എന്ന് മുകളിലെ ചുരുക്കത്തിൽ കാണാം.` });
  }
  if (brief.school === "prasna" && brief.detailHouse && brief.frame === "Birth-chart house reading") {
    const house = brief.detailHouse;
    const occupants = prasna.find((r) => r.house === house)?.occupants ?? [];
    const names = occupants.map((p) => p.planet);
    return safe({ kind: "prasna-house",
      en: `This birth-chart application of Prasna Marga looks at the ${ordH(house)} house for this topic. ${names.length ? `Its ${names.length === 1 ? "occupant is" : "occupants are"} ${listJoin(names)}.` : "No planet occupies this house; the house and its ruler still remain part of the chart."} The source reads the house as a whole, not just this one subject.`,
      ml: `പ്രശ്നമാർഗത്തിന്റെ ഈ ജനനജാതക വായനയിൽ ഈ വിഷയത്തിനായി ${house}-ാം ഭാവം പരിശോധിക്കുന്നു. ${names.length ? `ആ ഭാവത്തിലെ ഗ്രഹങ്ങൾ: ${names.map(tr).join(", ")}.` : "ഈ ഭാവത്തിൽ ഗ്രഹമില്ല; എന്നിരുന്നാലും ഭാവവും അധിപനും ജാതകത്തിന്റെ ഭാഗമാണ്."} ഉറവിടം ഭാവത്തെ മൊത്തത്തിലാണ് വായിക്കുന്നത്; ഒരു വിഷയത്തെ മാത്രം വേർതിരിച്ചല്ല.` });
  }
  return [];
}
