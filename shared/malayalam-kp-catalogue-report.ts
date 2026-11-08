/** Translation of already selected KP catalogue evidence; this does not evaluate rules. */
import { translate } from "./localization";
import { kpCuspTraceMalayalam, kpRawEvidenceMalayalam } from "./kp-technical-malayalam";
import { KP_CUSP_TRACE_SOURCE, kpCuspTraceText, type KpEventNatalRules, type KpRegisteredNatalRule } from "./kp-event-natal-rules";

const statuses: Record<KpEventNatalRules["indication"]["status"], string> = {
  support: "അനുകൂല സൂചന", strain: "വെല്ലുവിളിയുടെ സൂചന", mixed: "സമ്മിശ്രം",
  unresolved: "തീരുമാനമായിട്ടില്ല", "context-only": "പശ്ചാത്തല സൂചനകൾ മാത്രം", unavailable: "ലഭ്യമല്ല",
};
const labels: Record<string, string> = {
  "Marriage": "വിവാഹം", "Birth of a child": "സന്താനജനനം", "New job, promotion": "പുതിയ ജോലി, സ്ഥാനക്കയറ്റം",
  "Loss of job": "ജോലി നഷ്ടം", "Started a business": "വ്യാപാരം ആരംഭിക്കൽ", "Bought a house or land": "വീടോ സ്ഥലമോ വാങ്ങൽ",
  "Bought a vehicle": "വാഹനം വാങ്ങൽ", "Admission to higher study": "ഉന്നതപഠന പ്രവേശനം", "Went abroad": "വിദേശത്തേക്കുള്ള യാത്ര",
  "Returned from abroad": "വിദേശത്തുനിന്നുള്ള മടക്കം", "Illness, operation, hospital": "രോഗം, ശസ്ത്രക്രിയ, ആശുപത്രി",
  "Accident": "അപകടം", "Change of residence": "താമസം മാറൽ", "Won a case": "വ്യവഹാരത്തിൽ വിജയം", "Loan or large receipt": "വായ്പ അല്ലെങ്കിൽ വലിയ വരവ്",
};
const showLabel = (label: string) => {
  const [name, date, ...rest] = label.split(" · ");
  return labels[name] && !rest.length && (!date || /^\d{4}-\d{2}-\d{2}$/.test(date))
    ? `${labels[name]}${date ? ` · ${date}` : ""}` : label;
};
const ids = (xs: string[]) => xs.join(", ") || "ഒന്നുമില്ല";

export function kpCatalogueSummaryMalayalam(e: KpEventNatalRules, label: string, source: string): string | undefined {
  if (e.status !== "assessed") {
    const phrase = e.status === "custom-event" ? "not assigned to these custom houses and cusp" : e.status === "withheld" ? "withheld by the reading policy" : "not yet qualified for this matter";
    if (source !== `${label}: ordinary KP natal rules are ${phrase}.`) return undefined;
    const ml = e.status === "custom-event" ? "തിരഞ്ഞെടുത്ത ഇഷ്ടാനുസൃത ഭാവങ്ങൾക്കും കസ്പിനും സാധാരണ KP ജനനനിയമങ്ങൾ നിശ്ചയിച്ചിട്ടില്ല" : e.status === "withheld" ? "വായനാനയം അനുസരിച്ച് സാധാരണ KP ജനനനിയമങ്ങൾ മറച്ചിരിക്കുന്നു" : "ഈ വിഷയത്തിന് സാധാരണ KP ജനനനിയമങ്ങൾ ഇനിയും യോഗ്യമാക്കിയിട്ടില്ല";
    return `${showLabel(label)}: ${ml}.`;
  }
  const promises = e.rules.filter((r) => r.role === "promise");
  const expected = `${label}: ordinary four-step KP natal conditions, a qualified subset of the catalogue. Qualified promise clues: ${e.indication.status}; supporting ${e.indication.supports.join(", ") || "none"}; challenging ${e.indication.strains.join(", ") || "none"}. Findings set aside by principal-cusp precedence remain notes, not deciding clues. ${promises.length ? `Conditions: ${promises.map((r) => `${r.id} ${r.matched ? "matched" : "not matched"}`).join("; ")}. ` : ""}A non-match does not mean denial. These traditional indications are not added to the experimental score.`;
  if (source !== expected || !statuses[e.indication.status] || [...e.indication.supports, ...e.indication.strains, ...promises.map((r) => r.id)].some((id) => !/^kp[0-9]+-[a-z0-9-]+$/.test(id))) return undefined;
  const conditions = promises.length ? ` വ്യവസ്ഥകൾ: ${promises.map((r) => `${r.id} ${r.matched ? "പൊരുത്തപ്പെട്ടു" : "പൊരുത്തപ്പെട്ടില്ല"}`).join("; ")}.` : "";
  return `${showLabel(label)}: സാധാരണ നാലുഘട്ട KP ജനനവ്യവസ്ഥകൾ; നിയമസമാഹാരത്തിലെ യോഗ്യമാക്കിയ ഒരു ഭാഗം. യോഗ്യമായ സാധ്യതാസൂചനകൾ: ${statuses[e.indication.status]}; അനുകൂലമായവ ${ids(e.indication.supports)}; വെല്ലുവിളി സൂചിപ്പിക്കുന്നവ ${ids(e.indication.strains)}. പ്രധാന കസ്പിന്റെ മുൻഗണനയാൽ മാറ്റിവച്ച കണ്ടെത്തലുകൾ നിർണായക സൂചനകളല്ല, കുറിപ്പുകൾ മാത്രമാണ്.${conditions} ഒരു വ്യവസ്ഥ പൊരുത്തപ്പെടാത്തത് ഫലം നിഷേധിക്കുന്നു എന്നല്ല. ഈ പരമ്പരാഗത സൂചനകൾ പരീക്ഷണാത്മക സ്കോറിൽ ചേർക്കുന്നില്ല.`;
}

export function kpCatalogueTraceMalayalam(e: KpEventNatalRules, source: string, cited: boolean): string | undefined {
  if (!e.cuspTrace) return undefined;
  const trace = kpCuspTraceText(e.cuspTrace);
  if (source !== `${trace}${cited ? "" : ` (${KP_CUSP_TRACE_SOURCE})`}`) return undefined;
  const ml = kpCuspTraceMalayalam(e.cuspTrace, trace);
  return ml ? `${ml}${cited ? "" : ` (${KP_CUSP_TRACE_SOURCE})`}` : undefined;
}

export function kpCatalogueFindingMalayalam(rule: KpRegisteredNatalRule, source: string, cited: boolean): string | undefined {
  const f = rule.finding;
  if (!f || !/^kp[0-9]+-[a-z0-9-]+$/.test(rule.id) || f.ruleId !== rule.id) return undefined;
  const expected = `${rule.role} · ${rule.id}: ${f.text} (${f.evidence}).${f.standing ? ` Standing: ${f.standing}${f.decidedBy ? `, set aside by ${f.decidedBy}` : ""}.` : ""}${cited ? "" : ` ${rule.source}.`}`;
  if (source !== expected || (f.standing && !["note", "decides"].includes(f.standing)) || (f.decidedBy && !/^kp[0-9]+-[a-z0-9-]+$/.test(f.decidedBy))) return undefined;
  const finding = translate("ml", f.text), evidence = kpRawEvidenceMalayalam(f, f.evidence);
  const role = { promise: "സാധ്യതാസൂചന", modifier: "മാറ്റം വരുത്തുന്ന സൂചന", context: "പശ്ചാത്തല സൂചന" }[rule.role];
  if (finding === f.text || !evidence || !role) return undefined;
  const standing = f.standing ? ` നില: ${f.standing === "decides" ? "നിർണായകം" : "കുറിപ്പ്"}${f.decidedBy ? `; ${f.decidedBy} മൂലം മാറ്റിവച്ചു` : ""}.` : "";
  return `${role} · ${rule.id}: ${finding} (${evidence}).${standing}${cited ? "" : ` ${rule.source}.`}`;
}

export const KP_CATALOGUE_HEALTH_NOTE = "These interpretations cannot diagnose a condition, assess injury risk or determine an accident's severity.";
export const KP_CATALOGUE_HEALTH_NOTE_ML = "ഈ വ്യാഖ്യാനങ്ങൾ രോഗനിർണയം നടത്താനോ പരിക്കിന്റെ അപകടസാധ്യത വിലയിരുത്താനോ അപകടത്തിന്റെ തീവ്രത നിർണയിക്കാനോ കഴിയില്ല.";
