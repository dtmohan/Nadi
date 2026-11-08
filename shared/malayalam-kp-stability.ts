import { fmtHold, isConditional, KP_CONDITIONAL_SECONDS, nearestChangeText, type KpStability } from "./kp";
import { translate } from "./localization";

/** Preserve the complete conditional-cusp and Moon stability note, or fall back. */
export function kpStabilityMalayalam(stability: KpStability, source: string): string | undefined {
  const conditional = stability.cusps.filter(isConditional);
  if (conditional.some((p) => !p.house || p.house < 1 || p.house > 12)) return undefined;
  const ord = (h: number) => `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`;
  const limit = KP_CONDITIONAL_SECONDS / 60;
  const expected = `A cusp moves about a degree every four minutes and a sub spans 46' to 2°13', so a cusp sub lord holds for minutes; the books make a correct birth time the first condition of a reading. ${conditional.length ? `${conditional.length === 1 ? "One cusp" : `${conditional.length} cusps`} (${conditional.map((p) => ord(p.house!)).join(", ")}) ${conditional.length === 1 ? "changes its" : "change their"} sub lord within ${limit} minutes of the recorded time, so ${conditional.length === 1 ? "its verdict is" : "their verdicts are"} conditional on the minute.` : `No cusp sub lord changes within ${limit} minutes of the recorded time.`} The Moon's sub lord ${nearestChangeText(stability.moon)}. The two-minute margin is the app's convention.`;
  if (source !== expected) return undefined;
  const before = stability.moon.before ?? Infinity, after = stability.moon.after ?? Infinity;
  let moon: string;
  if (!Number.isFinite(before) && !Number.isFinite(after)) moon = "പരിശോധിച്ച സമയപരിധിക്കുള്ളിൽ മാറുന്നില്ല";
  else {
    const next = after <= before, planet = next ? stability.moon.nextSub : stability.moon.prevSub;
    if (!planet || translate("ml", planet) === planet) return undefined;
    const duration = fmtHold(next ? after : before).replaceAll("over an hour", "ഒരു മണിക്കൂറിലധികം").replaceAll(" min", " മിനിറ്റ്").replaceAll(" s", " സെക്കൻഡ്");
    moon = next ? `${duration} കഴിഞ്ഞ് ${translate("ml", planet)} ആയി മാറുന്നു` : `${duration} മുമ്പുവരെ ${translate("ml", planet)} ആയിരുന്നു`;
  }
  const cusp = conditional.length
    ? `${conditional.length === 1 ? "ഒരു കസ്പിന്റെ" : `${conditional.length} കസ്പുകളുടെ`} (${conditional.map((p) => `${p.house}-ാം`).join(", ")}) സഹാധിപൻ രേഖപ്പെടുത്തിയ സമയത്തിന് ${limit} മിനിറ്റിനുള്ളിൽ മാറുന്നു; അതിനാൽ ${conditional.length === 1 ? "അതിന്റെ നിഗമനം" : "അവയുടെ നിഗമനങ്ങൾ"} ജനനമിനിറ്റിനെ ആശ്രയിച്ചിരിക്കുന്നു.`
    : `രേഖപ്പെടുത്തിയ സമയത്തിന് ${limit} മിനിറ്റിനുള്ളിൽ ഒരു കസ്പിന്റെയും സഹാധിപൻ മാറുന്നില്ല.`;
  return `ഒരു കസ്പ് ഏകദേശം നാലു മിനിറ്റിൽ ഒരു അംശം നീങ്ങുന്നു; ഉപവിഭാഗം 46' മുതൽ 2°13' വരെ നീളുന്നതിനാൽ കസ്പിന്റെ സഹാധിപൻ മിനിറ്റുകൾ മാത്രമേ നിലനിൽക്കൂ. കൃത്യമായ ജനനസമയം വായനയുടെ ആദ്യ വ്യവസ്ഥയായി ഗ്രന്ഥങ്ങൾ കാണുന്നു. ${cusp} ചന്ദ്രന്റെ സഹാധിപൻ ${moon}. രണ്ട് മിനിറ്റ് പരിധി ആപ്പിന്റെ രീതിയാണ്.`;
}
