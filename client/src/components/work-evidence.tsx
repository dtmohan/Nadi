import type { WorkTheme } from "@shared/work-journey";
import { workQualifierMalayalam } from "@shared/malayalam-work-journey";

/** Keep every additional interpretation beside its own source and qualifications. */
export function WorkEvidence({ theme, ml }: { theme: WorkTheme; ml: boolean }) {
  return <div className="work-detail-body"><p lang={ml ? "ml" : "en"}>{ml ? theme.evidence.ml : theme.evidence.en}</p>
    {theme.evidence.sourceText && <><p className="work-source-label">{ml ? "ആപ്പിലെ നാഡി നിയമത്തിലെ വാചകം" : "App’s Nadi rule wording"}</p>
    <p lang={ml && theme.evidence.sourceTextMl ? "ml" : "en"}>{ml && theme.evidence.sourceTextMl ? theme.evidence.sourceTextMl : theme.evidence.sourceText}</p>{ml && !theme.evidence.sourceTextMl && <p className="work-fallback">മූലനിയമത്തിലെ വാചകം ഇപ്പോൾ ഇംഗ്ലീഷിലാണ്.</p>}</>}
    {theme.evidence.provenance !== "source" && <p className="work-caption">{theme.evidence.provenance === "mixed" ? (ml ? "ഈ ബന്ധത്തിൽ ഉറവിടത്തിൽ പറഞ്ഞ രീതിയും ആപ്പിന്റെ സമീപരാശി വിപുലീകരണവും ഉൾപ്പെടുന്നു." : "This connection includes both the source relation and the app's adjacent-sign extension.") : theme.evidence.provenance === "extension" ? (ml ? "ഈ ബന്ധം ആപ്പിന്റെ സമീപരാശി വിപുലീകരണത്തെ ആശ്രയിക്കുന്നു." : "This connection depends on the app's adjacent-sign extension.") : (ml ? "ഈ നിയമവ്യവസ്ഥയുടെ ഉറവിട അടിസ്ഥാനം സ്ഥിരീകരിച്ചിട്ടില്ല." : "The source basis for this rule’s condition has not been verified.")}</p>}
    {theme.evidence.testedQualifiers.map((q, j) => <p className="work-caption" key={`tested-${j}`}><span>{ml ? "പരിശോധിച്ച വ്യവസ്ഥ: " : "Checked condition: "}</span><span lang={ml && workQualifierMalayalam(q) ? "ml" : "en"}>{ml ? workQualifierMalayalam(q) ?? q : q}</span></p>)}
    {theme.evidence.untestedQualifiers.map((q, j) => <p className="work-caption" key={`untested-${j}`}><span>{ml ? "പരിശോധിക്കാത്ത വ്യവസ്ഥ: " : "Condition not tested: "}</span><span lang={ml && workQualifierMalayalam(q) ? "ml" : "en"}>{ml ? workQualifierMalayalam(q) ?? q : q}</span></p>)}
    {ml && [...theme.evidence.testedQualifiers, ...theme.evidence.untestedQualifiers].some((q) => !workQualifierMalayalam(q)) && <p className="work-fallback">ചില വ്യവസ്ഥകളുടെ വിശദാംശങ്ങൾ ഇപ്പോൾ ഇംഗ്ലീഷിലാണ്.</p>}
    <p className="work-source"><span>{ml ? "ആപ്പിൽ നൽകിയ ഉറവിട പരാമർശം: " : "Attribution listed by the app: "}</span><span lang="en">{theme.evidence.source ?? "Source not listed"} · {theme.evidence.ruleId}</span></p>
  </div>;
}

export function AdditionalWorkTheme({ theme, ml }: { theme: WorkTheme; ml: boolean }) {
  return <article className="work-theme" data-testid="work-additional-theme">
    <p className="work-theme-text" lang={ml && theme.text.ml ? "ml" : "en"}>{ml && theme.text.ml ? theme.text.ml : theme.text.en}</p>
    {ml && !theme.text.ml && <p className="work-fallback" lang="ml">ഇത് ഇപ്പോൾ ഇംഗ്ലീഷിൽ ലഭ്യമാണ്.</p>}
    {(theme.evidence.provisional || theme.evidence.sourceUnverified || theme.evidence.timeSensitive) && <p className="work-qualifier">
      {theme.evidence.provisional && <span>{ml ? "താൽക്കാലിക വ്യാഖ്യാനം. " : "Provisional interpretation. "}</span>}
      {theme.evidence.sourceUnverified && <span>{ml ? "ഉറവിടം സ്ഥിരീകരിച്ചിട്ടില്ല. " : "Source not verified. "}</span>}
      {theme.evidence.timeSensitive && <span>{ml ? "ജനനസമയ പരിധിയിൽ ഇതു മാറാം." : "This may change within the birth-time range."}</span>}
    </p>}
    <details className="work-detail"><summary><span>{ml ? "ഈ സൂചനയുടെ അടിസ്ഥാനം" : "Why this interpretation?"}</span><span aria-hidden>+</span></summary><WorkEvidence theme={theme} ml={ml} /></details>
  </article>;
}
