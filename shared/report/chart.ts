// The chart itself: the birth line and the positions table.
import { fmtDeg, SIGNS } from "../astro";
import { fmtDate, type ReportModule, type ReportPara } from "./types";
import { translate } from "../localization";

export const chartModule: ReportModule = {
  id: "chart",
  label: "The chart",
  short: "Chart",
  tab: "chart",
  build(ctx) {
    const { result, deceased, age, birthLocal, lagnaIdx, pos } = ctx;
    const { chart, positions } = result;
    const moon = pos("Moon");
    const paras: ReportPara[] = [];
    const text = `${chart.name} was born on ${birthLocal.toFormat("cccc d LLLL yyyy")} at ${birthLocal.toFormat("HH:mm")} in ${chart.place}, with ${SIGNS[lagnaIdx]} rising at ${fmtDeg(result.jaimini.lagna.lon)} and the Moon in ${moon.nakshatra}, pada ${moon.pada}, in ${moon.sign}. The clock used is ${result.timeBasis.label}; the sidereal positions follow the ${chart.ayanamsa} ayanamsa (${result.ayanamsaValue.toFixed(3)}°) with the ${chart.nodeType} node.${deceased ? ` A date of passing is recorded (${fmtDate(chart.deathDate!)}); the ages in this report stop there and nothing here is a forecast.` : ` The native is ${Math.floor(age)} at the time of writing.`}`;
    // Independent English snapshot: changes to the paragraph require translation review.
    const expected = `${chart.name} was born on ${birthLocal.toFormat("cccc d LLLL yyyy")} at ${birthLocal.toFormat("HH:mm")} in ${chart.place}, with ${SIGNS[lagnaIdx]} rising at ${fmtDeg(result.jaimini.lagna.lon)} and the Moon in ${moon.nakshatra}, pada ${moon.pada}, in ${moon.sign}. The clock used is ${result.timeBasis.label}; the sidereal positions follow the ${chart.ayanamsa} ayanamsa (${result.ayanamsaValue.toFixed(3)}°) with the ${chart.nodeType} node.${deceased ? ` A date of passing is recorded (${fmtDate(chart.deathDate!)}); the ages in this report stop there and nothing here is a forecast.` : ` The native is ${Math.floor(age)} at the time of writing.`}`;
    const sign = translate("ml", SIGNS[lagnaIdx]), moonStar = translate("ml", moon.nakshatra), moonSign = translate("ml", moon.sign);
    // Unknown time standards and ayanamsa names are retained verbatim as labels, rather
    // than inferring their meaning; a changed or gated source cannot use this translation.
    const node = chart.nodeType === "mean" ? "ശരാശരി രാഹുകേതു സ്ഥാനം" : chart.nodeType === "true" ? "യഥാർത്ഥ രാഹുകേതു സ്ഥാനം" : undefined;
    const ml = text === expected && node && sign !== SIGNS[lagnaIdx] && moonStar !== moon.nakshatra && moonSign !== moon.sign
      ? `${chart.name} ${birthLocal.setLocale("ml-IN").toFormat("cccc d LLLL yyyy")} തീയതി ${birthLocal.toFormat("HH:mm")}-ന് ${chart.place} എന്ന സ്ഥലത്ത് ജനിച്ചു. ലഗ്നം ${sign} രാശിയിൽ ${fmtDeg(result.jaimini.lagna.lon)}-ലും ചന്ദ്രൻ ${moonSign} രാശിയിൽ ${moonStar} നക്ഷത്രത്തിന്റെ ${moon.pada}-ാം പാദത്തിലുമാണ്. ഉപയോഗിച്ച സമയരീതി: ${result.timeBasis.label}; നിരയണ ഗ്രഹസ്ഥാനങ്ങൾ ${chart.ayanamsa} അയനാംശം (${result.ayanamsaValue.toFixed(3)}°), ${node} എന്നിവ അനുസരിച്ചാണ്.${deceased ? ` വിയോഗത്തീയതി രേഖപ്പെടുത്തിയിട്ടുണ്ട് (${fmtDate(chart.deathDate!)}); ഈ റിപ്പോർട്ടിലെ പ്രായങ്ങൾ അവിടെ അവസാനിക്കുന്നു, ഇവയൊന്നും ഭാവിപ്രവചനമല്ല.` : ` റിപ്പോർട്ട് തയ്യാറാക്കുമ്പോൾ പ്രായം ${Math.floor(age)} ആണ്.`}` : undefined;
    paras.push({
      kind: "lead",
      text,
      ...(ml ? { translationMl: { source: text, text: ml } } : {}),
    });
    paras.push({
      kind: "table",
      head: ["Planet", "Sign", "Degree", "Nakshatra", "Notes"],
      rows: positions.map((p) => [
        p.planet,
        p.sign,
        fmtDeg(p.lon),
        `${p.nakshatra} ${p.pada}`,
        [
          p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu"
            ? "retrograde"
            : "",
          p.combust ? "combust" : "",
          p.dignity !== "Neutral" && p.dignity !== "—"
            ? p.dignity.toLowerCase()
            : "",
        ]
          .filter(Boolean)
          .join(", "),
      ]),
    });
    return [{ id: "chart", title: "The chart", paras }];
  },
};
