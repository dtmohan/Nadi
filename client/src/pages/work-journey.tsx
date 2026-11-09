import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { buildWorkJourney } from "@shared/work-journey";
import { workQualifierMalayalam } from "@shared/malayalam-work-journey";
import { SCHOOL_NAME } from "@shared/school-topic-brief";
import { SchoolTopicExplanation } from "@/components/school-topic-brief";
import { LanguageToggle, useLocale } from "@/lib/i18n";
import { chartsStore } from "@/lib/charts-store";
import { apiRequest } from "@/lib/queryClient";
import { readingEntryPath, readingRoomChartKey } from "@/lib/reading-entry";
import "@/work-journey.css";

/** A focused entrance into the existing chart calculations, never a second chart cache. */
export default function WorkJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const ml = locale === "ml";
  const { data, isLoading, isFetching, error } = useQuery<ChartResult>({
    queryKey: readingRoomChartKey(id), enabled: !!id, staleTime: Infinity,
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser.");
      const response = await apiRequest("POST", "/api/compute", chart);
      return { ...((await response.json()) as ChartResult), chart };
    },
  });
  const journey = useMemo(() => data ? buildWorkJourney(data) : null, [data]);
  const allProvisional = !!journey?.themes.length && journey.themes.every((theme) => theme.evidence.provisional);
  // This app uses hash routing; native fragment navigation would replace the route.
  const jump = (id: string, focus = false) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (focus) target?.focus({ preventScroll: true });
  };
  return <div className="work-journey" lang={locale}>
    <a className="work-skip" href="#work-main" onClick={jump("work-main", true)}>{ml ? "വായനയിലേക്ക് പോകുക" : "Skip to the reading"}</a>
    <header className="work-top">
      <Link href="/" className="work-brand"><BookOpen size={17} aria-hidden /> Nadi <span>{ml ? "വ്യക്തിഗത വായന" : "A personal reading"}</span></Link>
      <div className="work-actions"><LanguageToggle /><Link href={`/chart/${id}`}>{ml ? "ജാതകത്തിലേക്ക്" : "Your chart"} <ArrowUpRight size={14} aria-hidden /></Link></div>
    </header>
    {isLoading || isFetching ? <main className="work-message" aria-busy="true">{ml ? "വായന തയ്യാറാക്കുന്നു…" : "Preparing your reading…"}</main>
      : error || !data || !journey ? <main className="work-message" role="alert"><h1>{ml ? "വായന തുറക്കാനായില്ല" : "This reading could not be opened"}</h1><p>{ml ? "ഈ ബ്രൗസറിൽ ജാതകം ലഭ്യമാണെന്ന് ഉറപ്പാക്കുക." : "Make sure the chart is available in this browser."}</p><Link href="/">{ml ? "ജാതകങ്ങളിലേക്ക്" : "Back to charts"}</Link></main>
      : <main id="work-main" className="work-layout" data-testid="work-journey" tabIndex={-1}>
        <aside className="work-rail" aria-label={ml ? "വായനയിലെ വിഭാഗങ്ങൾ" : "In this reading"}>
          <p>{ml ? "ഈ വായനയിൽ" : "IN THIS READING"}</p>
          <a href="#work-themes" onClick={jump("work-themes")}>01 <span>{ml ? "തൊഴിൽ സൂചനകൾ" : "Work themes"}</span></a>
          {journey.state === "available" && <><a href="#work-time" onClick={jump("work-time")}>02 <span>{ml ? "കാലപരിഗണന" : "Time and change"}</span></a><a href="#work-reasoning" onClick={jump("work-reasoning")}>03 <span>{ml ? "ജ്യോതിഷ അടിസ്ഥാനം" : "Astrological reasoning"}</span></a></>}
          <Link className="work-rail-back" href={readingEntryPath(id, locale)}><ArrowLeft size={14} aria-hidden /> {ml ? "മലയാള വായന" : "Full reading"}</Link>
        </aside>
        <div className="work-body">
          <header className="work-hero">
            <p className="work-kicker">{ml ? "നിങ്ങളുടെ ജാതകം · നാഡി വായന" : "YOUR CHART · A NADI READING"}</p>
            <h1>{ml ? "തൊഴിലും ദിശയും" : "Work & direction"}</h1>
            <p className="work-deck">{ml ? "ജാതകത്തിൽ തൊഴിൽജീവിതത്തെക്കുറിച്ച് തിരഞ്ഞെടുത്ത സൂചനകളും അവയുടെ അടിസ്ഥാനവും പരിശോധിക്കാം." : "Explore the work themes selected from your birth chart, and the reasoning behind them."}</p>
            <p className="work-meta">{data.chart.name} <span aria-hidden="true">·</span> {journey.past ? (ml ? "രേഖപ്പെടുത്തിയ മരണതീയതിയിലെ വായന" : "Read at the recorded date of passing") : (ml ? "ജനനജാതക വായന" : "A birth-chart reading")}</p>
          </header>
          {journey.state === "held" ? <section className="work-section" id="work-themes"><h2>{ml ? "ഈ വായന പിന്നീട് ലഭ്യമാകും" : "This reading is held for later"}</h2><p>{ml ? "ജാതകത്തിലെ പ്രായക്രമീകരണം അനുസരിച്ച് തൊഴിൽ വായന ഇപ്പോൾ കാണിക്കുന്നില്ല." : "The chart's age setting holds the work reading for later."}</p></section>
            : <>
              <section className="work-section work-themes" id="work-themes">
                <div className="work-section-head"><span>01</span><div><p className="work-kicker">{ml ? "ജനനജാതകത്തിൽ നിന്ന്" : "FROM YOUR BIRTH CHART"}</p><h2>{ml ? "തൊഴിൽജീവിതത്തിലേക്കൊരു നോട്ടം" : "A look at your working life"}</h2></div></div>
                <p className="work-intro">{ml ? "നാഡി രീതിയിലെ കുറച്ച് തിരഞ്ഞെടുത്ത നിയമങ്ങൾ ഈ ജാതകവുമായി ബന്ധിപ്പിക്കുന്ന തൊഴിൽസാധ്യതകളാണിവ. ഇവ ക്രമപ്പെടുത്തിയ തൊഴിലുകളല്ല; നിങ്ങളുടെ യഥാർത്ഥ തൊഴിൽ പ്രതിഫലിക്കണമെന്നില്ല." : "These are a small selection of Nadi interpretations, not a ranking of likely occupations. They may not describe your actual work."}</p>
                {allProvisional && <p className="work-qualifier">{ml ? "താഴെയുള്ള എല്ലാ സൂചനകളും താൽക്കാലിക വ്യാഖ്യാനങ്ങളാണ്." : "Every theme below is a provisional interpretation."}</p>}
                {journey.connections.length > 0 && <div className="work-connections" data-testid="work-connections">{journey.connections.map((connection) => {
                  const contributing = journey.themes.filter((theme) => connection.themeIds.includes(theme.id));
                  return <div key={connection.id}><p>{ml ? connection.text.ml : connection.text.en}</p>
                    {!allProvisional && contributing.some((theme) => theme.evidence.provisional) && <p className="work-qualifier">{ml ? "ഈ സൂചനകളിൽ താൽക്കാലിക വ്യാഖ്യാനങ്ങളും ഉൾപ്പെടുന്നു." : "These clues include provisional interpretations."}</p>}
                    {contributing.some((theme) => theme.evidence.timeSensitive) && <p className="work-qualifier">{ml ? "ജനനസമയ പരിധിക്കുള്ളിൽ ഇവയിൽ ചിലതു മാറാം." : "Some of these clues may change within the birth-time range."}</p>}
                    {contributing.some((theme) => theme.evidence.sourceUnverified) && <p className="work-qualifier">{ml ? "ഈ സൂചനകളിൽ സ്ഥിരീകരിക്കാത്ത ഉറവിടം ഉൾപ്പെടുന്നു." : "These clues include an unverified source."}</p>}
                  </div>;
                })}</div>}
                {journey.themes.length ? <div className="work-theme-list">{journey.themes.map((theme, i) => <div className="work-theme" key={theme.id} data-testid={`work-theme-${i}`}>
                  <div><p className="work-theme-text" lang={ml && theme.text.ml ? "ml" : "en"}>{ml && theme.text.ml ? theme.text.ml : theme.text.en}</p>
                    {ml && !theme.text.ml && <p className="work-fallback" lang="ml">ഇത് ഇപ്പോൾ ഇംഗ്ലീഷിൽ ലഭ്യമാണ്.</p>}
                    {((theme.evidence.provisional && !allProvisional) || theme.evidence.sourceUnverified || theme.evidence.timeSensitive) && <p className="work-qualifier">
                      {theme.evidence.provisional && !allProvisional && <span>{ml ? "താൽക്കാലിക വ്യാഖ്യാനം." : "Provisional interpretation."} </span>}
                      {theme.evidence.sourceUnverified && <span>{ml ? "ഉറവിടം സ്ഥിരീകരിച്ചിട്ടില്ല." : "Source not verified."} </span>}
                      {theme.evidence.timeSensitive && <span>{ml ? "ജനനസമയ പരിധിയിൽ ഇതു മാറാം." : "This may change within the birth-time range."}</span>}
                    </p>}
                  </div>
                </div>)}<a className="work-basis-link" href="#work-reasoning" onClick={jump("work-reasoning")}>{ml ? "ഈ വായനയുടെ ജ്യോതിഷ അടിസ്ഥാനം" : "Explore the reasoning behind this reading"} <ArrowRight size={15} aria-hidden /></a></div> : <p className="work-empty">{ml ? "തിരഞ്ഞെടുത്ത നിയമങ്ങളിൽ വ്യക്തമായ തൊഴിൽ സൂചനയില്ല. ഇതു തൊഴിൽസാധ്യതകളെക്കുറിച്ചുള്ള നിഗമനമല്ല." : "The selected rules do not provide a clear work theme here. This does not settle your work possibilities."}</p>}
                {journey.contrast && <div className="work-nuance"><p lang={ml && journey.contrastMl ? "ml" : "en"}>{ml && journey.contrastMl ? journey.contrastMl : journey.contrast}</p>{ml && !journey.contrastMl && <p className="work-fallback" lang="ml">ഈ വിശദാംശം ഇപ്പോൾ ഇംഗ്ലീഷിൽ ലഭ്യമാണ്.</p>}</div>}
                <p className="work-caption">{ml ? "ഇവ പരമ്പരാഗത വ്യാഖ്യാനങ്ങളാണ്; ഒരു പ്രത്യേക ജോലി അല്ലെങ്കിൽ സ്ഥാനക്കയറ്റം പ്രവചിക്കുന്നില്ല." : "These are traditional interpretations, not a prediction of a particular job or promotion."} <Link className="work-inline-link" href={`/chart/${id}/bnn`}>{ml ? "കൂടുതൽ നാഡി സൂചനകൾ കാണുക" : "See more Nadi findings"} <ArrowUpRight size={13} aria-hidden /></Link></p>
              </section>
              <section className="work-section" id="work-time">
                <div className="work-section-head"><span>02</span><div><p className="work-kicker">{ml ? "കാലപരിഗണന" : "TIME & CHANGE"}</p><h2>{ml ? "സമയവുമായി ബന്ധപ്പെട്ട സൂചനകൾ" : "A look at timing"}</h2></div></div>
                {journey.past && journey.windows.length > 0 && <p className="work-caption">{ml ? "രേഖപ്പെടുത്തിയ മരണതീയതിയിൽ സജീവമായിരുന്ന സഞ്ചാരമാണ് കാണിക്കുന്നത്. കാലയളവിന്റെ അവസാനം അതിനുശേഷമാണെങ്കിൽ, അതു കണക്കാക്കിയ സഞ്ചാര അതിർത്തിയാണ്; മരണശേഷമുള്ള പ്രവചനമല്ല." : "The passage shown was active at the recorded date of passing. If its end is later, that date is the calculated transit boundary, not a forecast after passing."}</p>}
                {journey.windows.length ? <div className="work-windows"><p className="work-intro">{ml ? "തൊഴിലുമായി ബന്ധപ്പെട്ട ജനനജാതക സൂചനകളോട് ഗ്രഹസഞ്ചാരം ബന്ധപ്പെടുന്ന കാലയളവുകൾ കാണാം. ഈ കാഴ്ചയിൽ ആ ബന്ധം എന്ത് അനുഭവം നൽകുമെന്ന് വിശദീകരിക്കുന്നില്ല." : "Some transits connect with work-related birth-chart findings. This view does not interpret what experience that connection might bring."}</p><details className="work-detail"><summary><span>{ml ? `${journey.windows.length} ${journey.windows.length === 1 ? "കാലയളവ്" : "കാലയളവുകൾ"} കാണുക` : `Explore ${journey.windows.length} ${journey.windows.length === 1 ? "period" : "periods"}`}</span><span aria-hidden>+</span></summary>{journey.windows.map((window) => {
                  const translated = journey.malayalamWindows[window.id];
                  return <article className="work-window" key={window.id}>
                    <p className="work-window-date" lang={ml && translated ? "ml" : "en"}>{ml && translated ? translated.when : window.when}</p>
                    <p lang={ml && translated ? "ml" : "en"}>{ml && translated ? translated.statement : window.statement}</p>
                    <details><summary>{ml ? "ഈ കാലയളവിന്റെ അടിസ്ഥാനം" : "Why this period?"}</summary><p lang={ml && translated ? "ml" : "en"}>{ml && translated ? translated.reason : window.reason}</p></details>
                    {ml && !translated && <p className="work-fallback">ഈ വിശദാംശം ഇപ്പോൾ ഇംഗ്ലീഷിൽ ലഭ്യമാണ്.</p>}
                  </article>;
                })}<p className="work-caption">{ml ? "ഈ തീയതികൾ ജനനസ്ഥലത്തിന്റെ സമയമേഖല പ്രകാരമാണ്. ഇവ തിരഞ്ഞെടുത്ത നാഡി ഗോചര സൂചനകളാണ്; സംഭവത്തിന്റെ ഉറപ്പുള്ള തീയതികളല്ല." : "Dates use the birthplace time zone. These are selected Nadi transit passages, not predicted event dates."}</p></details></div>
                  : <p>{ml ? "തിരഞ്ഞെടുത്ത നാഡി സമയസൂചനകളിൽ ഈ വിഷയത്തിനായി ഒരു കാലയളവ് ഇപ്പോൾ കാണിക്കുന്നില്ല. അതു സംഭവിക്കാനാവില്ലെന്ന നിഗമനമല്ല." : "No matching Nadi timing passage is shown here. That is not a conclusion that an event cannot happen."}</p>}
              </section>
              <section className="work-section" id="work-reasoning">
                <div className="work-section-head"><span>03</span><div><p className="work-kicker">{ml ? "കൂടുതൽ ആഴത്തിൽ" : "GO DEEPER"}</p><h2>{ml ? "ഈ വായനയുടെ അടിസ്ഥാനം" : "Why this reading?"}</h2></div></div>
                <p>{ml ? "മുകളിലെ ഓരോ സൂചനയ്ക്കും ഉപയോഗിച്ച ഗ്രഹബന്ധവും നിയമവും ഇവിടെ പരിശോധിക്കാം." : "Explore the planet connections and source rules behind each theme above."}</p>
                {journey.themes.map((theme, i) => <details className="work-detail" key={theme.id}>
                  <summary><span>{ml ? `${i + 1}. സൂചനയുടെ അടിസ്ഥാനം` : `${i + 1}. The basis for this theme`}</span><span aria-hidden>+</span></summary>
                  <div className="work-detail-body"><p lang={ml ? "ml" : "en"}>{ml ? theme.evidence.ml : theme.evidence.en}</p>
                    {theme.evidence.sourceText && <><p className="work-source-label">{ml ? "മൂലനിയമത്തിലെ വാചകം" : "Source-rule wording"}</p>
                    <p lang={ml && theme.evidence.sourceTextMl ? "ml" : "en"}>{ml && theme.evidence.sourceTextMl ? theme.evidence.sourceTextMl : theme.evidence.sourceText}</p>{ml && !theme.evidence.sourceTextMl && <p className="work-fallback">മൂലനിയമത്തിലെ വാചകം ഇപ്പോൾ ഇംഗ്ലീഷിലാണ്.</p>}</>}
                    {theme.evidence.provenance !== "source" && <p className="work-caption">{theme.evidence.provenance === "mixed" ? (ml ? "ഈ ബന്ധത്തിൽ ഉറവിടത്തിൽ പറഞ്ഞ രീതിയും ആപ്പിന്റെ സമീപരാശി വിപുലീകരണവും ഉൾപ്പെടുന്നു." : "This connection includes both the source relation and the app's adjacent-sign extension.") : theme.evidence.provenance === "extension" ? (ml ? "ഈ ബന്ധം ആപ്പിന്റെ സമീപരാശി വിപുലീകരണത്തെ ആശ്രയിക്കുന്നു." : "This connection depends on the app's adjacent-sign extension.") : (ml ? "ഈ ബന്ധത്തിന്റെ ഉറവിടസ്ഥിതി നിർണയിക്കാനായിട്ടില്ല." : "The provenance of this connection is unresolved.")}</p>}
                    {theme.evidence.testedQualifiers.map((q, j) => <p className="work-caption" key={`tested-${j}`}><span>{ml ? "പരിശോധിച്ച വ്യവസ്ഥ: " : "Checked condition: "}</span><span lang={ml && workQualifierMalayalam(q) ? "ml" : "en"}>{ml ? workQualifierMalayalam(q) ?? q : q}</span></p>)}
                    {theme.evidence.untestedQualifiers.map((q, j) => <p className="work-caption" key={`untested-${j}`}><span>{ml ? "പരിശോധിക്കാത്ത വ്യവസ്ഥ: " : "Condition not tested: "}</span><span lang={ml && workQualifierMalayalam(q) ? "ml" : "en"}>{ml ? workQualifierMalayalam(q) ?? q : q}</span></p>)}
                    {ml && [...theme.evidence.testedQualifiers, ...theme.evidence.untestedQualifiers].some((q) => !workQualifierMalayalam(q)) && <p className="work-fallback">ചില വ്യവസ്ഥകളുടെ വിശദാംശങ്ങൾ ഇപ്പോൾ ഇംഗ്ലീഷിലാണ്.</p>}
                    <p className="work-source" lang="en">{theme.evidence.source ?? "Source not listed"} · {theme.evidence.ruleId}</p>
                  </div>
                </details>)}
                {journey.schools.length > 0 && <details className="work-detail work-other-schools"><summary><span>{ml ? "മറ്റ് സമ്പ്രദായങ്ങൾ ഈ വിഷയം എങ്ങനെ വായിക്കുന്നു" : "How other schools read this"}</span><span aria-hidden>+</span></summary>
                  <div className="work-detail-body"><p className="work-caption">{ml ? "ഓരോ സമ്പ്രദായത്തിന്റെയും പരിഗണനയും നിയമങ്ങളും വ്യത്യസ്തമാണ്; ഇവ ഒറ്റ നിഗമനമായി ചേർക്കുന്നില്ല." : "Each school considers its own rules. These are separate readings, not one combined verdict."}</p>
                    {ml && <p className="work-fallback">ചില സാങ്കേതിക വിവരങ്ങളും ഉറവിട വാചകങ്ങളും മലയാളത്തിൽ ലഭ്യമല്ലെങ്കിൽ ഇംഗ്ലീഷിൽ കാണിക്കും.</p>}
                    {journey.schools.map((school) => <article key={school.school} className="work-school"><h3>{SCHOOL_NAME[school.school]}</h3><SchoolTopicExplanation brief={school} /></article>)}
                  </div>
                </details>}
              </section>
            </>}
          <footer className="work-footer"><Link href={readingEntryPath(id, locale)}>{ml ? "മലയാള വായനയിലേക്ക്" : "Continue to the full reading"} <ArrowRight size={16} aria-hidden /></Link><Link href={`/chart/${id}`}>{ml ? "ജാതകവും മറ്റു രീതികളും" : "Explore the chart and other methods"} <ArrowUpRight size={16} aria-hidden /></Link></footer>
        </div>
      </main>}
  </div>;
}
