import React from "react";
import { KP_CUSP_TRACE_SOURCE, kpCuspTraceText, type KpEventNatalRules } from "@shared/kp-event-natal-rules";
import { Cite } from "@/components/source-link";
import { Soft } from "@/lib/gentle";
import { useLocale } from "@/lib/i18n";
import { kpCuspTraceMalayalam, kpRawEvidenceMalayalam } from "@shared/kp-technical-malayalam";

/** The ordinary KP findings selected for this event; no new score is implied. */
export function KpCatalogueEvidence({ evidence }: { evidence?: KpEventNatalRules }) {
  const { locale } = useLocale();
  const ml = locale === "ml";
  if (!evidence) return null;
  if (evidence.status === "withheld") return <p className="mt-1 text-muted-foreground">{ml ? "വായനയ്ക്കുള്ള പ്രായത്തിൽ ഈ വിഷയത്തിന്റെ ജനനജാതക നിയമവായന ലഭ്യമല്ല." : "The natal rule reading for this matter is not available at the native's reading age."}</p>;
  if (evidence.status !== "assessed") return <p className="mt-1 text-muted-foreground">{evidence.status === "custom-event"
    ? (ml ? "തിരഞ്ഞെടുത്ത കസ്പോ ഭാവങ്ങളോ ഈ വിഷയത്തിനായി രജിസ്റ്റർ ചെയ്ത നിർവചനത്തിൽനിന്ന് വ്യത്യസ്തമാണ്; സാധാരണ സംഭവനിയമങ്ങൾ സ്വമേധയാ ചേർക്കുന്നില്ല." : "The selected cusp or houses differ from this matter's registered definition; ordinary event rules are not automatically assigned.")
    : (ml ? "ഈ സംഭവത്തിനായി സാധാരണ ജനനജാതക നിയമങ്ങൾ ഇതുവരെ യോഗ്യമാക്കിയിട്ടില്ല." : "Ordinary natal rules have not yet been qualified for this event.")}</p>;
  const fired = evidence.rules.filter((rule) => rule.matched && rule.finding);
  const promise = evidence.rules.filter((rule) => rule.role === "promise");
  const status: Record<KpEventNatalRules["indication"]["status"], string> = { support: "അനുകൂലം", strain: "പ്രതികൂലം", mixed: "സമ്മിശ്രം", unresolved: "തീരുമാനിക്കാത്തത്", "context-only": "പശ്ചാത്തലം മാത്രം", unavailable: "ലഭ്യമല്ല" };
  const roles = { promise: "വാഗ്ദാനസൂചന", modifier: "മാറ്റം വരുത്തുന്ന ഘടകം", context: "പശ്ചാത്തലം" };
  const trace = evidence.cuspTrace && kpCuspTraceText(evidence.cuspTrace);
  const traceMl = ml && trace && evidence.cuspTrace ? kpCuspTraceMalayalam(evidence.cuspTrace, trace) : undefined;
  return <details className="nadi-info-disclosure mt-2" data-testid="kp-catalogue-event-evidence">
    <summary className="nadi-info-summary">{ml ? `ഈ സംഭവത്തിനുള്ള സാധാരണ KP ജനനജാതക നിയമങ്ങൾ · രജിസ്റ്റർ ചെയ്ത ${evidence.rules.length} നിബന്ധനകളിൽ ${fired.length} പൊരുത്തപ്പെട്ടു` : `Ordinary KP natal rules for this event · ${fired.length} of ${evidence.rules.length} registered conditions matched`}</summary>
    <p className="mt-1 text-muted-foreground">{ml ? "ഈ ജനനസമയത്തിനായി അതേ നാലുഘട്ട ജാതകനിയമങ്ങൾ പരിശോധിക്കുന്നു. പൊരുത്തപ്പെടാത്ത നിബന്ധന തീരുമാനിക്കാത്തതാണ്; അതിന്റെ വിപരീത നിഗമനമല്ല. ഇവ പരമ്പരാഗത വ്യാഖ്യാനങ്ങളാണ്; ഫലം സ്ഥാപിക്കുകയോ പരീക്ഷണാത്മക പോയിന്റ് ആകെ മാറ്റുകയോ ചെയ്യുന്നില്ല." : "The same four-step chart rules are evaluated for this birth time. A condition that did not match is unresolved, not the opposite conclusion. These findings are traditional interpretations; they do not establish an outcome or change the experimental point total."}</p>
    {(evidence.matter === "illness" || evidence.matter === "accident") && <p className="mt-1 text-muted-foreground">{ml ? "ഈ വ്യാഖ്യാനങ്ങൾക്ക് രോഗനിർണയം നടത്താനോ പരിക്കിന്റെ സാധ്യത വിലയിരുത്താനോ അപകടത്തിന്റെ തീവ്രത നിർണയിക്കാനോ കഴിയില്ല." : "These interpretations cannot diagnose a condition, assess injury risk or determine an accident's severity."}</p>}
    <p className="mt-1">{ml ? "യോഗ്യമാക്കിയ വാഗ്ദാനസൂചനകൾ:" : "Qualified promise clues:"} <strong>{ml ? status[evidence.indication.status] : evidence.indication.status}</strong>{evidence.indication.supports.length ? ` · ${ml ? "അനുകൂലം" : "supporting"} ${evidence.indication.supports.join(", ")}` : ""}{evidence.indication.strains.length ? ` · ${ml ? "പ്രതികൂലം" : "challenging"} ${evidence.indication.strains.join(", ")}` : ""}. {ml ? "പ്രധാന കസ്പിന്റെ മുൻഗണന മൂലം മാറ്റിവച്ച സൂചനകൾ കുറിപ്പുകളായി കാണാം; ഈ സംഗ്രഹം അവ നിർണയിക്കുന്നില്ല. രജിസ്റ്റർ ചെയ്ത സൂചനകളാണ് ഇവിടെ വിവരിക്കുന്നത്; ഫലത്തിന്റെ തെളിവല്ല." : "Findings set aside by principal-cusp precedence remain visible as notes and do not determine this summary. This describes registered clues, not proof of an outcome."}</p>
    {trace && <p className="mt-1" data-testid="kp-cusp-dispositor-trace"><span lang={traceMl ? "ml" : "en"}>{traceMl ?? trace}</span> · <Cite>{KP_CUSP_TRACE_SOURCE}</Cite></p>}
    {promise.length > 0 && <p className="mt-1">{ml ? "രജിസ്റ്റർ ചെയ്ത വാഗ്ദാന നിബന്ധനകൾ:" : "Registered promise conditions:"} {promise.map((rule) => `${rule.id} ${rule.matched ? (ml ? "പൊരുത്തപ്പെട്ടു" : "matched") : (ml ? "പൊരുത്തപ്പെട്ടില്ല" : "not matched")}`).join(" · ")}.</p>}
    {fired.length ? fired.map((rule, i) => { const finding = rule.finding!; const line = ml ? kpRawEvidenceMalayalam(finding, finding.evidence) : undefined; return <p className="mt-1" key={`${rule.id}-${i}`}><strong>{ml ? roles[rule.role] : rule.role} · {rule.id}:</strong> <Soft>{finding.text}</Soft> <span className="text-muted-foreground" lang={line ? "ml" : "en"}>({line ?? finding.evidence})</span> · <Cite href={rule.sourceUrl}>{rule.source}</Cite>{finding.standing && <> · {finding.standing}</>}</p>; })
      : <p className="mt-1 text-muted-foreground">{ml ? "ഈ ജാതകത്തിൽ രജിസ്റ്റർ ചെയ്ത നിബന്ധനകളൊന്നും പൊരുത്തപ്പെട്ടില്ല." : "None of the registered conditions matched in this chart."}</p>}
    <p className="mt-1 text-muted-foreground">{ml ? "സാധാരണ നിയമശേഖരത്തിൽ നിന്ന് യോഗ്യമാക്കിയ ഒരു ഭാഗമാണിത്; മറ്റു ജനനജാതക നിയമങ്ങൾ ഈ സംഭവപരിശോധനയ്ക്ക് പുറത്താണ്." : "This is a qualified subset of the ordinary catalogue; other natal rules remain outside this event check."}</p>
  </details>;
}
