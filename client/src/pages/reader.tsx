import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link, useParams } from "wouter";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { readerExperience, type ReaderExperience, type ReaderTopic } from "@shared/reader-experience";
import { PLAIN_TOPIC_LABEL, type PlainTopic } from "@shared/topic-brief";
import { SCHOOL_NAME, SCHOOL_TOPIC_LABEL } from "@shared/school-topic-brief";
import { apiRequest } from "@/lib/queryClient";
import { chartsStore } from "@/lib/charts-store";
import { LocalizedText, useLocale, useT } from "@/lib/i18n";
import { SchoolTopicExplanation } from "@/components/school-topic-brief";
import { TopicThemes } from "@/components/topic-themes";
import { cn } from "@/lib/utils";

const TOPIC_LEAD: Record<PlainTopic, { en: string; ml: string }> = {
  career: { en: "A closer look at work", ml: "തൊഴിലിലേക്കൊരു അടുത്തുനോട്ടം" },
  marriage: { en: "A closer look at partnership", ml: "പങ്കാളിത്തത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  children: { en: "A closer look at family and children", ml: "കുടുംബത്തെയും സന്താനത്തെയും കുറിച്ച്" },
  self: { en: "A closer look at the self", ml: "സ്വന്തം ജീവിതത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  authority: { en: "A closer look at standing and responsibility", ml: "സ്ഥാനത്തെയും ഉത്തരവാദിത്തത്തെയും കുറിച്ച്" },
  wealth: { en: "A closer look at money and assets", ml: "സമ്പത്തിനെയും ആസ്തികളെയും കുറിച്ച്" },
  education: { en: "A closer look at learning", ml: "പഠനത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  family: { en: "A closer look at family", ml: "കുടുംബത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  health: { en: "A closer look at well-being", ml: "ക്ഷേമത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  spirituality: { en: "A closer look at spiritual life", ml: "ആത്മീയജീവിതത്തിലേക്കൊരു അടുത്തുനോട്ടം" },
  travel: { en: "A closer look at travel and distant places", ml: "യാത്രയെയും വിദേശബന്ധങ്ങളെയും കുറിച്ച്" },
};
const ROUTE: Record<string, string> = { parashari: "parashari", kp: "kp", jaimini: "jaimini", alp: "alp", prasna: "prasna" };

/** Texts are kept as independent source selections, so an editor cannot silently merge or strengthen them. */
function TopicStory({ topic, chartId }: { topic: ReaderTopic; chartId: string }) {
  const { locale } = useLocale();
  const t = useT();
  const ml = locale === "ml";
  const n = topic.natal;
  const anyProvisional = n.detailEvidence?.some((e) => e?.provisional);
  const anyUnverified = n.detailEvidence?.some((e) => e?.sourceUnverified);
  const anySensitive = n.detailEvidence?.some((e) => e?.timeSensitive);

  return <article className="min-w-0" data-testid={`reader-topic-${n.topic}`}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{ml ? "ജീവിതവിഷയം" : "A life theme"}</p>
    <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
      {ml ? TOPIC_LEAD[n.topic].ml : TOPIC_LEAD[n.topic].en}
    </h2>
    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{ml ? "നാഡി · ജനനജാതകം" : "Nadi · the birth chart"}</p>
    <div className="mt-3 max-w-3xl space-y-4 text-base leading-8 text-foreground/90 sm:text-lg">
      <p>{n.topic === "career" && !!n.details?.length
        ? (ml ? "നാഡി വായന തൊഴിൽജീവിതത്തിലെ സാധ്യതകൾ പരിശോധിക്കുന്നു." : "The Nadi reading explores possible themes in your work.")
        : <LocalizedText>{n.summary}</LocalizedText>}</p>
      {!!n.details?.length && <div className="space-y-4" data-testid="reader-nadi-themes">
        {n.details.map((detail, index) => {
          const prose = topic.prose[index];
          return <p key={`${detail}-${index}`}>{prose
            ? (ml ? prose.ml : prose.en)
            : <>{ml ? "തിരഞ്ഞെടുത്ത മറ്റൊരു വ്യാഖ്യാനം: " : "Another selected interpretation: "}<LocalizedText>{detail}</LocalizedText></>}</p>;
        })}
        <details className="mt-3 border-l-2 border-primary/40 pl-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">{ml ? "ഓരോ സൂചനയുടെയും അടിസ്ഥാനം" : "Why these themes?"}</summary>
          <div className="mt-2"><TopicThemes topic={n} /></div>
        </details>
      </div>}
      {n.contrast && <p><LocalizedText>{n.contrast}</LocalizedText></p>}
    </div>
    {(anyProvisional || anyUnverified || anySensitive) && <p className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-relaxed" data-testid="reader-evidence-caution">
      {anyProvisional && (ml ? "ചില വ്യാഖ്യാനങ്ങൾ താൽക്കാലികമാണ്. " : "Some interpretations are provisional. ")}
      {anyUnverified && (ml ? "ഒരു ഉറവിടം സ്ഥിരീകരിച്ചിട്ടില്ല. " : "A source has not been verified. ")}
      {anySensitive && (ml ? "ജനനസമയ പരിധിയിൽ ചില സൂചനകൾ മാറാം. " : "Some indications change within the birth-time range. ")}
      {ml ? "ഓരോ സൂചനയുടെയും അടിസ്ഥാനം മുകളിൽ കാണാം." : "The basis for each theme is available above."}
    </p>}
    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground"><LocalizedText>{n.limit}</LocalizedText></p>
    <Link href={`/chart/${chartId}/bnn`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" data-testid="reader-open-nadi">
      {ml ? "നാഡിയിലെ പൂർണവായന" : "Open the full Nadi reading"} <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>

    {n.windows.length > 0 && <section className="mt-10 border-t pt-7" data-testid="reader-topic-timing">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{ml ? "സമയം" : "Timing"}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">{ml ? "പരിശോധിക്കാവുന്ന കാലയളവുകൾ" : "Periods to explore"}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ml ? "നാഡിയിലെ തിരഞ്ഞെടുത്ത ഗോചരബന്ധങ്ങൾ ഈ വിഷയവുമായി ബന്ധപ്പെട്ടേക്കാവുന്ന സമയങ്ങളാണിവ. ഇവ സംഭവത്തീയതികളല്ല." : "These are selected Nadi transit connections to this topic, offered as periods to explore—not dates of promised events."}</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {n.windows.slice(0, 2).map((w) => {
          const translated = ml ? topic.malayalamWindows[w.id] : undefined;
          return <li key={w.id} className="rounded-lg border bg-card/50 px-4 py-4" data-testid={`reader-window-${w.id}`}>
            <p className="text-sm font-semibold tabular-nums" lang={translated ? "ml" : "en"}>{translated?.when ?? w.when}</p>
            <p className="mt-2 text-sm leading-relaxed">{translated ? translated.statement : <LocalizedText>{w.statement}</LocalizedText>}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{translated ? translated.reason : <LocalizedText>{w.reason}</LocalizedText>}</p>
          </li>;
        })}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground"><LocalizedText>{n.timingNote}</LocalizedText></p>
    </section>}

    {topic.schools.length > 0 && <section className="mt-10 border-t pt-7" data-testid="reader-school-comparison">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{ml ? "മറ്റു കാഴ്ചപ്പാടുകൾ" : "Other perspectives"}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold">{ml ? "മറ്റു രീതികൾ എന്തു പറയുന്നു" : "What the other schools see"}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ml
        ? "ഓരോ രീതിയും സ്വന്തം നിയമങ്ങൾ ഉപയോഗിക്കുന്നു. ALP തീയതി അനുസരിച്ചുള്ള പുരോഗമനവായനയാണ്; ഇവിടെ പ്രശ്നമാർഗം ജനനജാതകമാണ് വായിക്കുന്നത്."
        : "Each school uses its own rules. ALP is a date-specific progressed reading; Prasna Marga here reads the birth chart, not a question chart."}</p>
      <div className="mt-5 grid items-start gap-3 sm:grid-cols-2">
        {topic.schools.map((b) => <article key={`${b.school}-${b.topic}`} className="min-w-0 rounded-lg border bg-card/50 p-4" data-testid={`reader-school-${b.school}-${b.topic}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-display text-lg font-semibold">{t(SCHOOL_NAME[b.school])}{b.topic !== n.topic ? ` · ${t(SCHOOL_TOPIC_LABEL[b.topic])}` : ""}</h4>
            {b.provisional && <span className="text-xs font-medium text-muted-foreground">{t("Provisional")}</span>}
          </div>
          {b.frame && <p className="mt-1 text-xs text-muted-foreground">{ml && b.ml?.frame ? <span lang="ml">{b.ml.frame}</span> : <span lang="en">{b.frame}</span>}</p>}
          <p className="mt-3 text-sm leading-relaxed">{ml && b.ml?.summary ? <span lang="ml">{b.ml.summary}</span> : <span lang="en">{b.summary}</span>}</p>
          {b.conditional && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ml ? "ഈ വിലയിരുത്തൽ ജനനസമയത്തെ ആശ്രയിക്കുന്നു." : "This assessment is conditional on the birth time."}</p>}
          <details className="mt-3 border-t pt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary">{ml ? "അടിസ്ഥാനവും ഉറവിടവും" : "See the basis and source"}</summary>
            <div className="mt-3"><SchoolTopicExplanation brief={b} /></div>
            <Link href={`/chart/${chartId}/${ROUTE[b.school]}`} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">
              {ml ? `${SCHOOL_NAME[b.school]} പൂർണവായന` : `Open the full ${SCHOOL_NAME[b.school]} reading`} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </details>
        </article>)}
      </div>
    </section>}
  </article>;
}

export function ReaderContent({ result, experience, chartId }: { result: ChartResult; experience: ReaderExperience; chartId: string }) {
  const { locale } = useLocale();
  const t = useT();
  const ml = locale === "ml";
  const [selected, setSelected] = useState<PlainTopic | null>(null);
  const active = experience.topics.find((item) => item.natal.topic === selected) ?? experience.topics[0];
  const moon = result.positions.find((p) => p.planet === "Moon");
  const birth = DateTime.fromISO(result.chart.birthDate).setLocale(ml ? "ml-IN" : "en").toLocaleString(DateTime.DATE_MED);
  const topicIds = experience.topics.map((item) => item.natal.topic);

  return <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8 lg:px-12" data-testid="reader-experience">
    <Link href={`/chart/${chartId}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden /> {ml ? "ജാതകത്തിലേക്ക് മടങ്ങുക" : "Back to the chart"}
    </Link>
    <header className="relative mt-5 overflow-hidden rounded-2xl border bg-card px-6 py-8 sm:px-10 sm:py-11">
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full border border-primary/15 sm:h-64 sm:w-64">
        <div className="absolute inset-5 rounded-full border border-primary/15" />
        <div className="absolute inset-10 rounded-full border border-primary/15" />
      </div>
      <div className="relative max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-4 w-4" aria-hidden /> {ml ? "നാഡി · വായന" : "Nadi · a reading"}</p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl" data-testid="reader-title">{ml ? "നിങ്ങളുടെ ജാതകം, ഒരു വായന" : "Your chart, in perspective."}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{ml
          ? "ജീവിതത്തിലെ ഒരു വിഷയം തിരഞ്ഞെടുത്ത്, ജാതകത്തിൽ നിന്നുള്ള തിരഞ്ഞെടുത്ത സൂചനകളും അവയുടെ അടിസ്ഥാനവും വായിക്കാം."
          : "Begin with the part of life you are curious about. Each chapter brings together selected chart indications, their context, and the sources behind them."}</p>
        <p className="mt-6 text-sm font-medium">{result.chart.name} <span className="text-muted-foreground">· {birth}</span></p>
      </div>
    </header>

    <section className="mt-6 rounded-xl border px-5 py-4 sm:px-6" data-testid="reader-chart-context">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{ml ? "ആദ്യം ജാതകം" : "First, the chart"}</p>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">{moon && (ml
        ? `നൽകിയ ജനനസമയത്ത് ${t(result.jaimini.lagna.sign)} ലഗ്നമായിരുന്നു; ചന്ദ്രൻ ${t(moon.sign)} രാശിയിലും ${t(moon.nakshatra)} നക്ഷത്രത്തിലുമായിരുന്നു. വ്യത്യസ്ത രീതികൾ ഈ സ്ഥാനങ്ങളെ സ്വന്തം നിയമങ്ങൾ പ്രകാരം വായിക്കുന്നു.`
        : `At the entered birth time, ${result.jaimini.lagna.sign} was rising and the Moon was in ${moon.sign}, in the birth star ${moon.nakshatra}. Each tradition reads these positions through its own set of rules.`)}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ml ? "ഇവ പരമ്പരാഗത വ്യാഖ്യാനങ്ങളാണ്; ജീവിതസംഭവങ്ങൾ ഉറപ്പിക്കുന്ന പ്രവചനങ്ങളല്ല. ജനനസമയം മാറുമ്പോൾ ചില വായനകളും മാറാം." : "These are traditional interpretations, not established facts or guarantees. Some readings can change if the birth time changes."}</p>
      <details className="mt-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-primary">{ml ? "ഈ വായന എങ്ങനെ എഴുതുന്നു" : "How this reading is written"}</summary>
        <p className="mt-2 max-w-3xl leading-relaxed">{ml
          ? "നിലവിലുള്ള കണക്കുകളിലെ തിരഞ്ഞെടുത്ത സൂചനകളാണ് ഇവിടെ ഉപയോഗിക്കുന്നത്. പരിശോധിച്ച ചില നാഡി തൊഴിൽ–വിവാഹ സൂചനകൾ കൂടുതൽ വിശദമായി എഴുതിയിരിക്കുന്നു; മറ്റുള്ളവ നിലവിലുള്ള ലളിതവായനയിൽ നിന്നാണ്. ഓരോ രീതിയുടെയും ഉറവിടം പ്രത്യേകം കാണാം."
          : "This page uses selected findings from the existing calculations. Reviewed prose expands some Nadi career and marriage findings; other passages use the existing plain summaries. Each school's basis remains separate."}</p>
      </details>
      {experience.before.length > 0 && <details className="mt-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-primary">{ml ? "ഈ ജാതകത്തിന്റെ സമയപരിധി അറിയുക" : "What to know about this chart"}</summary>
        <ul className="mt-2 space-y-2">{experience.before.map((n) => <li key={n.id}><strong lang="en">{n.title}.</strong>{" "}<LocalizedText>{n.text}</LocalizedText></li>)}</ul>
      </details>}
    </section>

    {active ? <div className="mt-10 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label={ml ? "ജീവിതവിഷയങ്ങൾ" : "Life themes"} className="min-w-0 lg:sticky lg:top-5 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{ml ? "ഒരു വിഷയം തിരഞ്ഞെടുക്കുക" : "Choose a theme"}</p>
        <div className="flex gap-2 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible">
          {experience.topics.map(({ natal }) => <button key={natal.topic} type="button" onClick={() => setSelected(natal.topic)}
            aria-pressed={active.natal.topic === natal.topic}
            className={cn("min-h-11 shrink-0 rounded-md border px-3 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active.natal.topic === natal.topic ? "border-primary/40 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground")}
            data-testid={`reader-select-${natal.topic}`}>{t(PLAIN_TOPIC_LABEL[natal.topic])}</button>)}
        </div>
      </nav>
      <div className="mt-5 min-w-0 lg:mt-0" aria-live="polite">
        <TopicStory key={active.natal.topic} topic={active} chartId={chartId} />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="text-sm text-muted-foreground">{ml ? "മറ്റൊരു ജീവിതവിഷയം വായിക്കുക" : "Continue to another theme"}</p>
          {topicIds.length > 1 && <button type="button" onClick={() => setSelected(topicIds[(topicIds.indexOf(active.natal.topic) + 1) % topicIds.length])}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted" data-testid="reader-next-topic">
            {ml ? "അടുത്ത വിഷയം" : "Next theme"} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>}
        </div>
      </div>
    </div> : <p className="mt-8 text-sm text-muted-foreground">{ml ? "ഇപ്പോൾ കാണിക്കാവുന്ന ജീവിതവിഷയം ലഭ്യമല്ല." : "No age-appropriate life themes are available in this reading."}</p>}

    {!!experience.present.length && <section className="mt-16 border-t pt-8" data-testid="reader-present">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{ml ? "കാലവും ഗോചരവും" : "Time and movement"}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold">{experience.past ? (ml ? "രേഖപ്പെടുത്തിയ സമയത്തെ കാലയളവുകൾ" : "At the recorded date") : (ml ? "ഇപ്പോൾ പരിശോധിക്കാവുന്നത്" : "The present, in context")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{ml ? "ഓരോ കാലയളവും അതതു രീതി പ്രകാരമാണ്. ഇവ പ്രത്യേക സംഭവങ്ങളുടെ ഉറപ്പായ സമയങ്ങളല്ല." : "Each passage is described by the method that uses it. These are not guaranteed dates for an event."}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {experience.present.map((row) => <article key={row.id} className="rounded-lg border bg-card/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.system} · <span lang="en">{row.when}</span></p>
          <h3 className="mt-2 font-display text-lg font-semibold"><LocalizedText>{row.plainSummary!.title}</LocalizedText></h3>
          <p className="mt-2 text-sm leading-relaxed"><LocalizedText>{row.plainSummary!.text}</LocalizedText></p>
          {row.plainSummary?.basis && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-primary">{ml ? "കണക്കിന്റെ അടിസ്ഥാനം" : "Calculation basis"}</summary><p className="mt-2" lang="en">{row.plainSummary.basis}</p></details>}
        </article>)}
      </div>
    </section>}
    <footer className="mt-12 flex items-center gap-2 border-t pt-5 text-xs text-muted-foreground"><BookOpen className="h-4 w-4" aria-hidden /> {ml ? "ഒരേ കണക്ക് · ഓരോ രീതിക്കും സ്വന്തം വായന" : "One chart · each tradition in its own voice"}</footer>
  </div>;
}

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const { data, isLoading, error } = useQuery<ChartResult>({
    queryKey: ["chart-result", id],
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser");
      const result = await (await apiRequest("POST", "/api/compute", chart)).json() as ChartResult;
      return { ...result, chart };
    },
  });
  const experience = useMemo(() => data ? readerExperience(data) : null, [data]);
  if (isLoading) return <p className="p-8 text-sm text-muted-foreground" data-testid="reader-loading">{locale === "ml" ? "വായന തയ്യാറാക്കുന്നു…" : "Preparing your reading…"}</p>;
  if (error || !data || !experience) return <div className="p-8 text-sm" data-testid="reader-error">
    <p>{locale === "ml" ? "ഈ ജാതകം ഈ ബ്രൗസറിൽ കണ്ടെത്താനായില്ല." : ((error as Error)?.message ?? "Could not prepare the reading.")}</p>
    <Link href="/" className="mt-3 inline-block text-primary underline">{locale === "ml" ? "ജാതകങ്ങളിലേക്ക് മടങ്ങുക" : "Back to charts"}</Link>
  </div>;
  return <ReaderContent key={id} result={data} experience={experience} chartId={id} />;
}
