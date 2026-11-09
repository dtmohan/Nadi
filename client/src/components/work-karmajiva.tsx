import type { WorkKarmajiva } from "@shared/work-karmajiva";
import { KARMAJIVA_SOURCES } from "@shared/karmajiva";

/** A separately attributed historical method, not a combined career score. */
export function WorkKarmajivaSection({ reading, ml }: { reading: WorkKarmajiva; ml: boolean }) {
  if (reading.state !== "available") return null;
  return <section className="work-section" id="work-livelihood" data-testid="work-karmajiva">
    <div className="work-section-head"><span>02</span><div><p className="work-kicker">{ml ? "മറ്റൊരു പരമ്പരാഗത രീതി" : "ANOTHER TRADITIONAL METHOD"}</p><h2>{ml ? "ഉപജീവനത്തെക്കുറിച്ച് ബൃഹജ്ജാതകം" : "Livelihood in Brihat Jataka"}</h2></div></div>
    <p>{ml ? "ഈ ഗ്രന്ഥം മൂന്ന് ജാതക ആധാരങ്ങളിൽനിന്ന് ഉപജീവനത്തിനുള്ള പഴയ ഉദാഹരണങ്ങൾ നൽകുന്നു. നാഡി വായനയുമായി ഇവ കൂട്ടിച്ചേർക്കുകയോ ആധുനിക ജോലി പ്രവചിക്കുകയോ ചെയ്യുന്നില്ല." : "This text gives historical livelihood examples using three chart reference points. They are shown separately from the Nadi reading and do not predict a modern occupation."}</p>
    {reading.birthTimeSensitive && <p className="work-qualifier">{ml ? "നൽകിയ ജനനസമയ പരിധിക്കുള്ളിൽ ഈ വിവരങ്ങൾ മാറാം." : "These details may change within the stated birth-time range."}</p>}
    <details className="work-detail"><summary><span>{ml ? "ഈ ഗ്രന്ഥത്തിലെ സൂചനകൾ കാണുക" : "Explore this traditional reading"}</span><span aria-hidden>+</span></summary>
      <div className="work-detail-body">
        <p>{ml ? reading.methodMl : reading.methodEn}</p>
        <p>{ml ? reading.qualificationMl : reading.qualificationEn}</p>
        {reading.references.map((reference) => <article key={reference.reference} className="work-theme" data-testid={`work-karmajiva-${reference.reference}`}>
          {/\b(kill(?:ing)?|torture|low crafts)\b/i.test(reference.callingEn) ? <details className="work-detail" data-testid={`work-karmajiva-historical-${reference.reference}`}>
            <summary><span>{ml ? "കഠിനമായ പഴയ വാചകങ്ങളുള്ള ഉറവിടവിശദാംശങ്ങൾ" : "Historical source details with harsh wording"}</span><span aria-hidden>+</span></summary>
            <p>{ml ? reference.ml : reference.en}</p>
          </details> : <p>{ml ? reference.ml : reference.en}</p>}
          <p className="work-source"><a href={reference.sourceUrl} target="_blank" rel="noreferrer">Brihat Jataka 10.1</a> · <a href={reference.callingSourceUrl} target="_blank" rel="noreferrer">{["Sun", "Moon", "Mars", "Mercury"].includes(reference.navamsaLord) ? "Brihat Jataka 10.2" : "Brihat Jataka 10.3"}</a></p>
        </article>)}
        <p className="work-source"><a href={reading.alternateSourceUrl} target="_blank" rel="noreferrer">Iyer, pp. 110–112</a> · <a href={KARMAJIVA_SOURCES.commentary.url} target="_blank" rel="noreferrer">Adyar commentary</a></p>
      </div>
    </details>
  </section>;
}
