import { SIGNS, SIGN_LORD, type Planet } from "./astro";
import { readsFromPreviousSign } from "./flow";
import { translate } from "./localization";
import type { ChartResult } from "./schema";

/** Complete BNN role summary, only when every printed sentence is recognized. */
export function bnnRoleSummaryMalayalam(result: ChartResult, planet: Planet, role: "Jeeva karaka" | "Karma karaka" | "Deha karaka", source: string): string | undefined {
  const p = result.positions.find((x) => x.planet === planet);
  const st = result.reading.strength.find((x) => x.planet === planet);
  if (!p || !st || st.dignityNote || st.combustNote || st.effectiveDignity !== p.dignity) return undefined;
  const dignity: Record<string, string> = { Exalted: "ഉച്ചം", Moolatrikona: "മൂലത്രികോണം", "Own sign": "സ്വക്ഷേത്രം", Friendly: "മിത്രരാശി", Neutral: "സമരാശി", Inimical: "ശത്രുരാശി", Debilitated: "നീചം", "—": "നില രേഖപ്പെടുത്തിയിട്ടില്ല" };
  if (!dignity[p.dignity]) return undefined;
  const tr = (s: string) => translate("ml", s);
  const others = result.positions.filter((q) => q.planet !== p.planet && q.signIndex === p.signIndex).map((q) => q.planet);
  const names = [p.planet, p.sign, p.nakshatra, p.nakshatraLord, SIGN_LORD[p.signIndex], ...others, ...st.winningOver, ...st.losingTo];
  if (names.some((name) => tr(name) === name)) return undefined;
  const isClassical = !(["Rahu", "Ketu"] as Planet[]).includes(p.planet);
  const english: string[] = [`${p.planet} (${role}) in ${SIGNS[p.signIndex]}${p.retrograde && isClassical ? ", retrograde" : ""}, ${p.dignity.toLowerCase()}.`];
  const roleMl = role === "Jeeva karaka" ? "ജീവകാരകൻ" : role === "Karma karaka" ? "കർമകാരകൻ" : "ദേഹകാരകൻ";
  const ml: string[] = [`${tr(p.planet)} (${roleMl}) ${tr(p.sign)} രാശിയിൽ${p.retrograde && isClassical ? ", വക്രഗതിയിൽ" : ""}; രാശിയിലെ നില: ${dignity[p.dignity]}.`];
  if (others.length) { english.push(`Conjunct ${others.join(", ")}.`); ml.push(`ഒരേ രാശിയിൽ ${others.map(tr).join(", ")}.`); }
  if (st.winningOver.length) { english.push(`Leads ${st.winningOver.join(", ")} by degree.`); ml.push(`അംശത്തിൽ ${st.winningOver.map(tr).join(", ")} എന്നിവയെക്കാൾ മുന്നിലാണ്.`); }
  if (st.losingTo.length) { english.push(`Yields to ${st.losingTo.join(", ")} by degree.`); ml.push(`അംശത്തിൽ ${st.losingTo.map(tr).join(", ")} എന്നിവയ്ക്കു പിന്നിലാണ്.`); }
  if (p.combust) { english.push("Combust within the Sun's pada."); ml.push("സൂര്യന്റെ പാദത്തിനുള്ളിൽ അസ്തംഗതമാണ്."); }
  if (readsFromPreviousSign(p, result.positions)) {
    const previous = SIGNS[(p.signIndex + 11) % 12];
    if (tr(previous) === previous) return undefined;
    english.push(`Also reads from ${previous} by retrogression, at half strength.`);
    ml.push(`വക്രഗതി കാരണം ${tr(previous)} എന്ന മുൻരാശിയിൽനിന്നും പകുതി ബലത്തിൽ വായിക്കുന്നു.`);
  } else if (p.retrograde && isClassical) {
    const next = SIGNS[(p.signIndex + 1) % 12];
    if (tr(next) === next) return undefined;
    english.push(p.retrogradeEntry ? `Backed into ${SIGNS[p.signIndex]} from ${next}, so it is not read from the sign before.` : "Under Rahu or Ketu, so it is not read from the previous sign.");
    ml.push(p.retrogradeEntry ? `${tr(next)} രാശിയിൽനിന്ന് വക്രഗതിയിൽ ${tr(p.sign)} രാശിയിൽ എത്തിയതിനാൽ അതിന് മുൻപുള്ള രാശിയിൽനിന്ന് വീണ്ടും വായിക്കുന്നില്ല.` : "രാഹുവിന്റെയോ കേതുവിന്റെയോ സ്വാധീനമുള്ളതിനാൽ മുൻരാശിയിൽനിന്ന് വായിക്കുന്നില്ല.");
  }
  english.push(`Sign lord ${SIGN_LORD[p.signIndex]}; nakshatra ${p.nakshatra} (${p.nakshatraLord}).`);
  ml.push(`രാശ്യാധിപൻ ${tr(SIGN_LORD[p.signIndex])}; നക്ഷത്രം ${tr(p.nakshatra)} (${tr(p.nakshatraLord)}).`);
  return english.join(" ") === source ? ml.join(" ") : undefined;
}
