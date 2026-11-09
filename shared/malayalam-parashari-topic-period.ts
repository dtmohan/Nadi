import { DateTime } from "luxon";
import { LEAN_CLAUSE, verdictOfLean } from "./parashari-dasa";
import { listJoin, ordH, thePlanet } from "./house-gloss";
import { translate } from "./localization";
import { PERIOD_TOPICS, type PeriodTopic, type TopicPeriod } from "./parashari-topic-periods";

// Each pair is a full source snapshot: changes in meaning or the gentle register need review.
const meanings: Record<string, { plain: string; ml: string; plainMl: string; tone: "support" | "strain" }> = {
  "recognition from and awards by the government": { plain: "recognition and honours from those in authority", ml: "സർക്കാരിൽനിന്നുള്ള അംഗീകാരവും പുരസ്കാരങ്ങളും", plainMl: "അധികാരസ്ഥാനത്തുള്ളവരിൽനിന്നുള്ള അംഗീകാരവും ബഹുമതികളും", tone: "support" },
  "unexpected gains of wealth": { plain: "unexpected gains", ml: "അപ്രതീക്ഷിത ധനലാഭം", plainMl: "അപ്രതീക്ഷിത നേട്ടങ്ങൾ", tone: "support" },
  "acquisition of house and land": { plain: "a home or land of your own", ml: "വീടും ഭൂമിയും ലഭിക്കൽ", plainMl: "സ്വന്തമായി വീടോ ഭൂമിയോ ലഭിക്കൽ", tone: "support" },
  "obstacles in gains of wealth": { plain: "gains that come more slowly", ml: "ധനനേട്ടങ്ങൾക്ക് തടസ്സങ്ങൾ", plainMl: "നേട്ടങ്ങൾ പതുക്കെ ലഭിക്കൽ", tone: "strain" },
  "financial losses": { plain: "a need for care with money", ml: "സാമ്പത്തിക നഷ്ടങ്ങൾ", plainMl: "പണത്തിന്റെ കാര്യത്തിൽ ശ്രദ്ധ ആവശ്യമായി വരിക", tone: "strain" },
  "physical well-being": { plain: "physical well-being", ml: "ശാരീരിക സൗഖ്യം", plainMl: "ശാരീരിക സൗഖ്യം", tone: "support" },
  "danger from enemies and ill health": { plain: "a need to look after your health and steer clear of disputes", ml: "ശത്രുക്കളിൽനിന്നുള്ള അപകടവും ആരോഗ്യക്കുറവും", plainMl: "ആരോഗ്യം ശ്രദ്ധിക്കുകയും തർക്കങ്ങൾ ഒഴിവാക്കുകയും ചെയ്യേണ്ട ആവശ്യം", tone: "strain" },
  "the possibility of diseases": { plain: "a need to look after your health", ml: "രോഗസാധ്യത", plainMl: "ആരോഗ്യം ശ്രദ്ധിക്കേണ്ട ആവശ്യം", tone: "strain" },
  "distress and danger from diseases": { plain: "a need to look after your health", ml: "രോഗം മൂലമുള്ള വിഷമവും അപകടവും", plainMl: "ആരോഗ്യം ശ്രദ്ധിക്കേണ്ട ആവശ്യം", tone: "strain" },
  "progress in education and happiness from the children": { plain: "happiness through children and progress in learning", ml: "വിദ്യാഭ്യാസത്തിൽ പുരോഗതിയും സന്താനത്തിലൂടെ സന്തോഷവും", plainMl: "സന്താനത്തിലൂടെ സന്തോഷവും പഠനത്തിൽ പുരോഗതിയും", tone: "support" },
  "distress to the spouse": { plain: "a need for care with your spouse's well-being", ml: "പങ്കാളിക്കുള്ള വിഷമം", plainMl: "പങ്കാളിയുടെ ക്ഷേമത്തിൽ ശ്രദ്ധ ആവശ്യമായി വരിക", tone: "strain" },
};
const leanSnapshot: Record<string, { en: string; ml: string }> = {
  favourable: { en: "reads favourable", ml: "അനുകൂലമായി വായിക്കുന്നു" },
  "leans-favourable": { en: "leans favourable", ml: "അനുകൂലതയിലേക്കു ചായുന്നു" },
  balanced: { en: "is evenly balanced", ml: "തുല്യമായ നിലയിലാണ്" },
  "leans-trying": { en: "leans trying", ml: "ബുദ്ധിമുട്ടിലേക്കു ചായുന്നു" },
  trying: { en: "reads trying", ml: "ബുദ്ധിമുട്ടുള്ളതായി വായിക്കുന്നു" },
};
const verses: Record<number, string> = { 1: "2", 4: "3", 5: "4", 6: "4", 7: "5", 8: "5", 9: "6", 10: "6", 11: "7", 12: "7" };
const joinMl = (xs: string[]) => xs.join("യും ");

/** Reconstruct the entire selected report sentence before translating; changed clauses fall back. */
export function parashariTopicPeriodMalayalam(p: TopicPeriod, topic: PeriodTopic, source: string, plain: boolean): string | undefined {
  const def = PERIOD_TOPICS.find((x) => x.topic === topic);
  const st = def?.statements.filter((s) => p.houses.includes(s.house)).sort((a, b) => a.house - b.house) ?? [];
  if (!st.length || JSON.stringify(st.map((s) => s.house)) !== JSON.stringify(p.houses)) return undefined;
  if (st.some((s) => !meanings[s.said] || meanings[s.said].plain !== s.saidPlain || meanings[s.said].tone !== s.tone || !verses[s.house])) return undefined;
  const lean = leanSnapshot[p.lean.step];
  if (!lean || LEAN_CLAUSE[p.lean.step] !== lean.en) return undefined;
  const statementTone = st.every((s) => s.tone === "support") ? "support" : st.every((s) => s.tone === "strain") ? "strain" : "mixed";
  if (statementTone !== p.statementTone) return undefined;
  const leanTone = verdictOfLean(p.lean), planetMl = translate("ml", p.lord);
  if (planetMl === p.lord) return undefined;
  const start = DateTime.fromISO(p.start).toUTC(), end = DateTime.fromISO(p.end).toUTC();
  if (!start.isValid || !end.isValid) return undefined;
  const ageStart = Math.floor(p.ageStart), ageEnd = Math.floor(p.ageEnd);
  const P = thePlanet(p.lord), Pc = P.charAt(0).toUpperCase() + P.slice(1);
  const sup = st.filter((s) => s.tone === "support").map((s) => s.saidPlain);
  const strain = Array.from(new Set(st.filter((s) => s.tone === "strain").map((s) => s.saidPlain)));
  const reads = sup.length ? `Parashara reads ${listJoin(sup)} in its period${strain.length ? `, and also ${listJoin(strain)}` : ""}` : `Parashara reads ${listJoin(strain)} in its period`;
  const balance = leanTone === "support" ? `On balance the period ${lean.en}${statementTone === "strain" ? ", which softens this" : ""}.` : leanTone === "strain" ? `On balance the period ${lean.en}${statementTone === "support" ? ", which weakens this" : ""}.` : "On balance the period is evenly weighted.";
  const expectedPlain = `${Pc}'s period, ${start.toFormat("LLLL yyyy")} to ${end.toFormat("LLLL yyyy")} (ages ${ageStart} to ${ageEnd})${p.current ? ", running now" : ""}: ${P} rules your ${listJoin(p.houses.map(ordH))} house${p.houses.length > 1 ? "s" : ""}, and ${reads}. ${balance}`;
  const explanation = statementTone === "strain" && leanTone === "support" ? "; 48.1 and 48.8 let a well-placed lord turn the result" : statementTone === "support" && leanTone === "strain" ? "; 48.1 and 48.8 let an ill-placed lord spoil the result" : "";
  const expected = `${p.lord} dasa, ${start.toFormat("LLL yyyy")} to ${end.toFormat("LLL yyyy")} (ages ${ageStart}-${ageEnd})${p.current ? ", running" : ""}: lord of the ${listJoin(p.houses.map(ordH))}; ${listJoin(st.map((s) => `48.${verses[s.house]} reads ${s.said}`))}. ${p.lean.favour || p.lean.against ? `The dasa ${lean.en} (${p.lean.favour} favourable, ${p.lean.against} trying)` : "The dasa's lines take no side"}${explanation}.`;
  if (source !== (plain ? expectedPlain : expected)) return undefined;
  const dates = `${start.setLocale("ml-IN").toFormat("LLLL yyyy")} മുതൽ ${end.setLocale("ml-IN").toFormat("LLLL yyyy")} വരെ`;
  const houses = p.houses.map((h) => `${h}-ാം`).join(", ");
  const houseWord = p.houses.length > 1 ? "ഭാവങ്ങളുടെ" : "ഭാവത്തിന്റെ";
  if (plain) {
    const supMl = st.filter((s) => s.tone === "support").map((s) => meanings[s.said].plainMl);
    const strainMl = Array.from(new Set(st.filter((s) => s.tone === "strain").map((s) => meanings[s.said].plainMl)));
    const combined = supMl.length ? `${joinMl(supMl)}${strainMl.length ? `, കൂടാതെ ${joinMl(strainMl)}` : ""}` : joinMl(strainMl);
    const bal = leanTone === "mixed" ? "മൊത്തത്തിൽ ഈ കാലയളവിലെ സൂചനകൾ തുല്യമാണ്." : `മൊത്തത്തിൽ ഈ കാലയളവ് ${lean.ml}${statementTone === "strain" && leanTone === "support" ? "; ഇത് മുൻസൂചനയുടെ കാഠിന്യം കുറയ്ക്കുന്നു" : statementTone === "support" && leanTone === "strain" ? "; ഇത് മുൻസൂചനയെ ദുർബലമാക്കുന്നു" : ""}.`;
    return `${planetMl}-ന്റെ കാലയളവ്, ${dates} (പ്രായം ${ageStart} മുതൽ ${ageEnd} വരെ)${p.current ? ", ഇപ്പോൾ നടക്കുന്നു" : ""}: ${planetMl} നിങ്ങളുടെ ${houses} ${houseWord} അധിപനാണ്. ഈ കാലയളവിൽ ${combined} എന്നാണു പരാശരിയുടെ വായന. ${bal}`;
  }
  const clauses = st.map((s) => `48.${verses[s.house]} ${meanings[s.said].ml} വായിക്കുന്നു`).join("; ");
  const counts = p.lean.favour || p.lean.against ? `ദശ ${lean.ml} (${p.lean.favour} അനുകൂലവും ${p.lean.against} ബുദ്ധിമുട്ടുള്ളതുമായ വരികൾ)` : "ദശയുടെ വരികൾ ഒരു പക്ഷവും എടുക്കുന്നില്ല";
  const qualifier = statementTone === "strain" && leanTone === "support" ? "; അനുകൂലസ്ഥാനത്തുള്ള അധിപൻ ഫലം മാറ്റാമെന്ന് 48.1, 48.8 പറയുന്നു" : statementTone === "support" && leanTone === "strain" ? "; അനനുകൂലസ്ഥാനത്തുള്ള അധിപൻ ഫലം കുറയ്ക്കാമെന്ന് 48.1, 48.8 പറയുന്നു" : "";
  return `${planetMl} ദശ, ${dates} (പ്രായം ${ageStart}–${ageEnd})${p.current ? ", ഇപ്പോൾ നടക്കുന്നു" : ""}: ${houses} ${houseWord} അധിപൻ; ${clauses}. ${counts}${qualifier}.`;
}
