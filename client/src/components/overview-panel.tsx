import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { vimshottari } from "@shared/kp";
import { ageYears, lifeAsOf, areaSeason, heldAreasAt, mentionsHeldArea } from "@shared/life-stage";
import { areaNoun, nadiAreasClauses } from "@shared/life-areas";
import type { Gender } from "@shared/marriage";
import {
  synthesize,
  AREA_TONE_LABEL,
  type AreaSynthesis,
  type AreaTone,
} from "@shared/synthesis";
import {
  computeGochara,
  gocharaPlainEffect,
  natalOwnMarks,
  type GocharaVerdict,
} from "@shared/gochara";
import { adverseTara } from "@shared/tara";
import { Soft, useSoften } from "@/lib/gentle";
import { usePlain } from "@/components/mode-text";
import { sarvarthaLeftOut } from "@/components/sarvartha-section";
import { LocalizedText, useLocale, useT } from "@/lib/i18n";
import { malayalamNadiGlance } from "@/lib/overview-locale";
import { useAgreement, useAgreementInput } from "@/lib/use-agreement";
import { briefingFor, type BriefLink, type Briefing } from "@shared/briefing";
import { BriefingBefore, BriefingNow, BriefingPlanets, useOpenLink } from "@/components/briefing";
import { PlanetName, SignName } from "@/components/planet-name";
import { cn } from "@/lib/utils";
import { PLAIN_TOPIC_LABEL, plainTopicBriefs, planetTopicExamples, malayalamTopicWindow, type PlainTopicBrief } from "@shared/topic-brief";
import { SCHOOL_NAME, SCHOOL_TOPIC_LABEL, type BriefSchool, type SchoolTopicBrief } from "@shared/school-topic-brief";
import { defaultAlpForTopics, expandedSchoolTopicBriefs } from "@shared/school-topics-expanded";
import { schoolDetailsLink, SchoolTopicExplanation } from "@/components/school-topic-brief";
import { TopicThemes } from "@/components/topic-themes";
import { gocharaContext } from "@shared/chart-explanations";
import { AGREEMENT_SYSTEM_LABEL } from "@shared/agreement";
import { agreementSentenceMalayalam } from "@shared/malayalam-agreement";
import type { Stance } from "@shared/kernel";
import { plainSarvarthaHighlights } from "@shared/sarvartha-plain";
import { InfoBox, INFO_BOX_EYEBROW, INFO_BOX_INSET, INFO_BOX_ROW_SUMMARY } from "@/components/info-box";

const VERDICT_PILL: Record<GocharaVerdict, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  obstructed: "bg-verdict-mixed/15 text-verdict-mixed",
  neutral: "bg-muted text-muted-foreground",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};

const ord = (h: number) =>
  h === 1 ? "1st" : h === 2 ? "2nd" : h === 3 ? "3rd" : `${h}th`;

const TONE_CLASS: Record<AreaTone, string> = {
  supportive: "border-verdict-good/40 text-verdict-good",
  mixed: "border-verdict-mixed/40 text-verdict-mixed",
  care: "border-verdict-bad/40 text-verdict-bad",
  contested: "border-dashed border-verdict-mixed/60 text-verdict-mixed",
  descriptive: "border-border text-muted-foreground",
  quiet: "border-border text-muted-foreground",
};

const joinList = (xs: string[], locale: "en" | "ml" = "en") =>
  xs.length <= 1
    ? xs.join("")
    : locale === "ml" ? xs.join(", ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

const PLAIN_SCHOOL_STANCE: Record<Stance, string> = {
  supports: "supportive indications",
  "leans-supports": "indications leaning supportive",
  mixed: "mixed indications",
  contested: "conflicting indications",
  "leans-strains": "indications leaning challenging",
  strains: "challenging indications",
  silent: "no conclusion in this comparison",
};

/** The Nadi verdict across the areas, named as Nadi's: the other systems are weighed under Across the systems. */
function glanceSentence(areas: AreaSynthesis[]): string {
  const clauses = nadiAreasClauses(areas);
  return clauses
    ? `In the Nadi reading, ${clauses
        .replace(/\brests on firm ground/g, "shows supportive indications")
        .replace(/\brest on firm ground/g, "show supportive indications")
        .replace(/\bneeds care/g, "has indications that may need care")
        .replace(/\bneed care/g, "have indications that may need care")
        .replace(/\bis in dispute, with strong rules both ways/g, "has differing indications")
        .replace(/\bare in dispute, with strong rules both ways/g, "have differing indications")}.`
    : "The selected Nadi rules do not give a clear direction for these topics.";
}

/** The same source-grounded card is used for the two featured topics and the compact disclosures. */
function PlainTopicContent({ topic, brief, zone, past, onOpen, comparisons, compact = false }: { topic: PlainTopicBrief; brief: Briefing; zone: string; past: boolean; onOpen: (link: BriefLink) => void; comparisons: SchoolTopicBrief[]; compact?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const soften = useSoften();
  const passage = (w: PlainTopicBrief["windows"][number]) => {
    const translated = locale === "ml" ? malayalamTopicWindow(topic.topic, w, brief, zone) : undefined;
    return (
    <li key={w.id} data-testid={`plain-topic-window-${topic.topic}-${w.id}`}>
      <p className="text-sm font-medium tabular">{translated?.when ?? w.when}</p>
      <p className="mt-0.5 text-sm leading-relaxed">{translated ? translated.statement : <LocalizedText>{w.statement}</LocalizedText>}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("Why")}: {translated ? translated.reason : <LocalizedText>{w.reason}</LocalizedText>}</p>
      <button type="button" className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => onOpen(w.link)}>{t("See the transit details")}</button>
    </li>
    );
  };
  const more = <>
      <div className="mt-4 border-t pt-3">
        <p className="text-xs font-semibold">{t(topic.topic === "health" ? "About timing" : past ? "At passing" : "Periods to explore")}</p>
        {topic.windows.length ? (
          <>
            <ul className="mt-2 space-y-3">{topic.windows.slice(0, 1).map(passage)}</ul>
            {topic.windows.length > 1 && <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium text-primary">{t("More passages")} ({topic.windows.length - 1})</summary>
              <ul className="mt-2 space-y-3">{topic.windows.slice(1).map(passage)}</ul>
            </details>}
          </>
        ) : topic.topic !== "health" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("No matching Nadi passage is shown in this briefing. That is not a conclusion about whether an event can occur.")}</p>}
        {(topic.windows.length > 0 || topic.topic === "health") && <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><LocalizedText>{topic.timingNote}</LocalizedText></p>}
      </div>
      <button type="button" className="mt-3 text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => onOpen(topic.hasArea ? { tab: "bnn", chapter: "areas", target: `[data-testid="section-area-${topic.topic}"]` } : { tab: "bnn", chapter: "karakas" })}>{t("See Nadi details")}</button>
      {comparisons.length > 0 && <details className="mt-3 border-t pt-3" data-testid={`plain-topic-schools-${topic.topic}`}>
        <summary className="cursor-pointer text-xs font-semibold">{t("See other schools")}</summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("Each school is shown separately. ALP is a progressed reading for the date shown; Prasna Marga here uses the birth chart, not a question chart. Specific questions can use additional rules.")}</p>
        <div className="mt-2 space-y-3">
          {comparisons.map((b) => <div key={`${b.school}-${b.topic}`} className="rounded-md bg-muted/40 p-2">
            <p className="mb-1 text-xs font-semibold">{t(SCHOOL_NAME[b.school])}{topic.topic === "family" ? ` · ${t(SCHOOL_TOPIC_LABEL[b.topic])}` : ""}</p>
            <div lang={locale === "ml" ? "en" : undefined}><SchoolTopicExplanation brief={b} onOpen={() => onOpen(schoolDetailsLink(b))} /></div>
          </div>)}
        </div>
      </details>}
  </>;
  return (
    <>
      <p className="mt-2 text-sm leading-relaxed"><LocalizedText>{soften(topic.summary)}</LocalizedText></p>
      {topic.detailIntro && <p className="mt-2 text-sm leading-relaxed"><LocalizedText>{topic.detailIntro}</LocalizedText></p>}
      <TopicThemes topic={topic} compact={compact} />
      {topic.contrast && <p className="mt-2 text-sm leading-relaxed text-muted-foreground"><LocalizedText>{topic.contrast}</LocalizedText></p>}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><LocalizedText>{topic.limit}</LocalizedText></p>
      {topic.comparison && <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><LocalizedText>{topic.comparison}</LocalizedText></p>}
      {compact ? <details className="mt-3" data-testid={`plain-topic-more-${topic.topic}`}>
        <summary className="cursor-pointer text-sm font-medium text-primary">{t("Explore timing and other schools")}</summary>
        {more}
      </details> : more}
    </>
  );
}

/**
 * The overview: what a reader who is not a practitioner wants first. Identity, one glance sentence,
 * the life areas as a set of plain cards, and the period and slow planets running now. Everything
 * else on the page is the working behind these lines.
 */
export function OverviewPanel({
  result,
  onOpenTab,
  alpAsOf,
}: {
  result: ChartResult;
  alpAsOf?: string;
  /** Switch the reading tab; the briefing's links open a tab at the line they summarise. */
  onOpenTab?: (tab: BriefLink["tab"]) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const { reading, chart, now, positions } = result;
  const gender = chart.gender as Gender;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const rising = result.jaimini.lagna.sign;

  const lifeAt = lifeAsOf(chart, now.asOf);
  const age = ageYears(result.utc, lifeAt);
  const deceased = lifeAt !== now.asOf;
  const agreementIn = useAgreementInput(result);
  const agreement = useAgreement(result, agreementIn);
  const brief = useMemo(() => briefingFor(result, agreementIn), [result, agreementIn]);
  const openLink = useOpenLink(onOpenTab);
  const plain = usePlain();
  // Sarvartha's own length-of-life rules stay in the practitioner reading, and the gate's topics stay out for a minor.
  const scShown = (result.sarvartha?.findings ?? []).filter(
    (f) =>
      !sarvarthaLeftOut(f.topic, f.text, plain, result.sensitive?.withheld ?? false),
  );
  const scPlain = plainSarvarthaHighlights(scShown);
  const crossSchool = agreement.filter(
    (a) => a.verdict === "disagree" || a.verdict === "lean" || a.verdict === "mixed",
  );

  const sun = positions.find((p) => p.planet === "Sun")!;

  // Notable planet states: retrogrades (the nodes always move "retrograde" and are left out)
  // and the dignities a reader actually notices — the strong and the weak, as the engine grades
  // them (effective dignity, after the cancellation rules), not the raw sign dignity.
  const retro = positions
    .filter((p) => p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu")
    .map((p) => p.planet);
  const NOTABLE_DIGNITY = new Set([
    "Exalted",
    "Moolatrikona",
    "Own sign",
    "Debilitated",
    "Inimical",
  ]);
  const dignityPhrase = (d: string) =>
    d === "Own sign"
      ? "in own sign"
      : d === "Inimical"
        ? "in inimical sign"
        : d === "Moolatrikona"
          ? "in the moolatrikona sign"
          : d.toLowerCase();
  const noteParts: string[] = [];
  if (retro.length) noteParts.push(`${joinList(retro.map(t), locale)} ${t("retrograde")}`);
  for (const s of reading.strength) {
    if (NOTABLE_DIGNITY.has(s.effectiveDignity)) {
      noteParts.push(`${t(s.planet)} ${t(dignityPhrase(s.effectiveDignity))}`);
    } else if (
      NOTABLE_DIGNITY.has(s.dignity) &&
      s.dignity !== s.effectiveDignity
    ) {
      noteParts.push(`${t(s.planet)} ${t(dignityPhrase(s.dignity))} ${t("(set aside)")}`);
    }
  }

  const allAreas = useMemo(() => synthesize(reading, gender), [reading, gender]);
  const areas = allAreas.filter((a) =>
    areaSeason(a.area, result.utc, lifeAt).inSeason,
  );
  const topics = plainTopicBriefs({
    reading,
    areas: allAreas,
    agreement,
    brief,
    zone: chart.timezone || "UTC",
    inSeason: (topic) => areaSeason(topic, result.utc, lifeAt).inSeason,
  });
  const schoolBriefs = useMemo(() => (["parashari", "kp", "jaimini", "alp", "prasna"] as BriefSchool[]).flatMap((s) => expandedSchoolTopicBriefs(result, s, agreementIn, agreement, s === "alp" ? { alp: defaultAlpForTopics(result, agreementIn.withheld, alpAsOf) } : undefined)), [result, agreementIn, agreement, alpAsOf]);
  const comparisonsFor = (topic: PlainTopicBrief) => schoolBriefs.filter((b) =>
    b.topic === topic.topic || (topic.topic === "family" && (b.topic === "father" || b.topic === "mother")),
  );
  // The first eligible topics are shown without an extra click. For children the age gate may
  // withhold career and marriage, so choose from the already-filtered list rather than hardcoding them.
  const featuredTopics = topics.slice(0, 2);
  const otherTopics = topics.slice(2);
  const deferred = allAreas.filter(
    (a) => !areaSeason(a.area, result.utc, lifeAt).inSeason,
  );

  const glance = locale === "ml" ? malayalamNadiGlance(areas) : glanceSentence(areas);
  const firm = areas
    .filter((a) => a.tone === "supportive")
    .sort((x, y) => y.balance - x.balance);
  const watch = areas
    .filter((a) => a.tone === "care" || a.tone === "contested")
    .sort((x, y) => x.balance - y.balance);

  const vim = vimshottari(moon.lon, result.utc, lifeAt);
  const adverse = adverseTara(Math.floor(moon.lon / (360 / 27)));
  const adverseNow = adverse.find((a) => a.lord === vim.current.dasa.lord);
  // A chart read after its 120-year Vimshottari sequence has ended (no date of death recorded).
  const pastEnd =
    !deceased && lifeAt >= vim.dasas[vim.dasas.length - 1].end;

  // Transits read against the natal Moon (Phaladeepika 26.1 names it the chief lagna for gochara).
  const gochara = useMemo(
    () =>
      computeGochara(
        moon.signIndex,
        now.positions,
        now.asOf,
        result.sensitive?.withheld ?? false,
        { ownMarks: natalOwnMarks(result.positions, result.jaimini.lagna.lon) },
      ),
    [
      moon.signIndex,
      now.positions,
      now.asOf,
      result.sensitive?.withheld,
      result.positions,
      result.jaimini.lagna.lon,
    ],
  );
  const jupRow = gochara.rows.find((r) => r.planet === "Jupiter");
  const satRow = gochara.rows.find((r) => r.planet === "Saturn");

  return (
    <section
      className="animate-in fade-in-0 duration-300"
      data-testid="overview-panel"
      aria-label={t("Overview")}
    >
      {/* Identity and the glance sentence */}
      <InfoBox as="div">
        <p className={INFO_BOX_EYEBROW}>
          {t("Overview · your reading")}
        </p>
        <h2
          className="font-display mt-2 max-w-[40ch] text-xl font-semibold leading-snug"
          data-testid="overview-glance"
        >
          {glance}
        </h2>
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="overview-identity"
        >
          {deceased ? t("Read at age ") : t("Age ")}
          {Math.floor(age)}
        </p>
        <details className="mt-3" open={!plain} data-testid="overview-chart-basics">
          <summary className="cursor-pointer text-sm font-medium text-primary">{t("Birth chart basics")}</summary>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Rising")}
            </dt>
            <dd className="text-sm font-medium">{t(rising)}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Sun")}
            </dt>
            <dd className="text-sm font-medium">{t(sun.sign)}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Moon")}
            </dt>
            <dd className="text-sm font-medium">{t(moon.sign)}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Birth star")}
            </dt>
            <dd className="text-sm font-medium">
              {locale === "ml" ? `${t(moon.nakshatra)} · ${moon.pada}-ാം പാദം · നക്ഷത്രാധിപൻ ${t(moon.nakshatraLord)}` : `${moon.nakshatra} · ${moon.nakshatraLord}, p${moon.pada}`}
            </dd>
          </div>
        </dl>
        {plain && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{locale === "ml"
          ? `ജനനസമയത്ത് കിഴക്കൻ ചക്രവാളത്തിൽ ഉദിച്ചിരുന്ന രാശിയാണ് ലഗ്നം: ${t(rising)}. അപ്പോൾ സൂര്യനും ചന്ദ്രനും നിന്ന രാശികളാണ് മുകളിൽ കാണുന്നത്. ജന്മനക്ഷത്രം, ${t(moon.nakshatra)}, ജനനസമയത്ത് ചന്ദ്രൻ നിന്ന നക്ഷത്രമാണ്. അതിന്റെ ${moon.pada}-ാം പാദത്തിലാണ് ചന്ദ്രൻ. നക്ഷത്രാധിപൻ: ${t(moon.nakshatraLord)}.`
          : `The rising sign, ${rising}, was on the eastern horizon at birth. The Sun and Moon entries show their signs at that moment. The birth star, ${moon.nakshatra}, is the zodiac section occupied by the Moon; it is in quarter ${moon.pada}, and its traditional star ruler is ${moon.nakshatraLord}.`}</p>}
        <button type="button" className="mt-3 min-h-11 text-left text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" data-testid="overview-open-jupiter" onClick={() => openLink({ tab: "parashari", chapter: "planets", target: '[data-testid="jupiter-relationships"]' })}>
          {locale === "ml" ? "വ്യാഴത്തിന്റെ ബന്ധങ്ങൾ പരാശരിയിൽ കാണുക" : "Explore Jupiter's connections in Parashari"}
        </button>
        {noteParts.length > 0 && (
          plain ? <details className="mt-2 text-xs text-muted-foreground" data-testid="overview-notable"><summary className="cursor-pointer font-medium text-primary">{t("Other birth-chart conditions")}</summary><p className="mt-1">{noteParts.join(" · ")}</p><p className="mt-1" lang="en">Retrograde means a planet appears to move backward as seen from Earth. A planet's own or enemy sign describes traditional relationships between planets and signs, not relationships between people.</p></details> : <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="overview-notable"
          >
            {noteParts.join(" · ")}
          </p>
        )}
        </details>

        {!plain && (firm.length > 0 || watch.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {firm.length > 0 && (
              <div
                className="rounded-md border border-verdict-good/30 bg-verdict-good/[0.06] p-3"
                data-testid="overview-firm"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-good">
                  {t("Firm ground")} · {t("Nadi")}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(firm.map((a) => t(areaNoun(a.area))), locale)}
                </p>
              </div>
            )}
            {watch.length > 0 && (
              <div
                className="rounded-md border border-verdict-bad/30 bg-verdict-bad/[0.05] p-3"
                data-testid="overview-watch"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-bad">
                  {t("Asks for care")} · {t("Nadi")}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(watch.map((a) => t(areaNoun(a.area))), locale)}
                </p>
              </div>
            )}
          </div>
        )}
      </InfoBox>

      <BriefingBefore notes={brief.before} onOpen={openLink} />

      {plain && topics.length > 0 && (
        <InfoBox className="mt-4" aria-label={t("Life topics")} data-testid="plain-topic-briefs">
          <h2 className={INFO_BOX_EYEBROW}>{t("Life topics")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("These short readings use the Nadi method. Other schools have their own readings.")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("Open a topic to compare selected interpretations from the other schools. Their coverage differs; ALP is date-specific and Prasna Marga here uses the birth chart.")}</p>
          {(chart.timeUncertaintyMin ?? 0) > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{locale === "ml" ? `നൽകിയ ജനനസമയത്തിൽ ±${chart.timeUncertaintyMin} മിനിറ്റിന്റെ അനിശ്ചിതത്വമുണ്ട്. ഈ പരിധിക്കുള്ളിൽ ചില വിശദാംശങ്ങൾ മാറാം.` : `The entered birth time has an uncertainty of ±${chart.timeUncertaintyMin} minutes. Some details can change within that range.`}</p>
          )}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {featuredTopics.map((topic) => (
              <article key={topic.topic} className={cn(INFO_BOX_INSET, "scroll-mt-4 p-4")} data-testid={`overview-area-${topic.topic}`}>
                <h3 className="font-display text-lg font-semibold">{t(PLAIN_TOPIC_LABEL[topic.topic])}</h3>
                <PlainTopicContent topic={topic} brief={brief} zone={chart.timezone || "UTC"} past={!!brief.past} onOpen={openLink} comparisons={comparisonsFor(topic)} compact />
              </article>
            ))}
          </div>
          {otherTopics.length > 0 && (
            <details className="mt-4 rounded-md border" data-testid="plain-more-topics">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{t("More life topics")}</summary>
              <div className="grid grid-cols-1 items-start gap-2 border-t p-3 md:grid-cols-2 xl:grid-cols-3">
                {otherTopics.map((topic) => (
                  <details key={topic.topic} className={cn(INFO_BOX_INSET, "scroll-mt-24")} data-testid={`overview-area-${topic.topic}`}>
                    <summary className={INFO_BOX_ROW_SUMMARY}>{t(PLAIN_TOPIC_LABEL[topic.topic])}</summary>
                    <PlainTopicContent topic={topic} brief={brief} zone={chart.timezone || "UTC"} past={!!brief.past} onOpen={openLink} comparisons={comparisonsFor(topic)} />
                  </details>
                ))}
              </div>
            </details>
          )}
        </InfoBox>
      )}

      {/* The full timing and planet detail remains available, with each school's clock separate. */}
      <details className="mt-4 rounded-md border" open={!plain} data-testid="overview-timing-details">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{t("Timing, transits and planets")}</summary>
        <div className="px-3 pb-3">
      <BriefingNow
        brief={brief}
        plain={plain}
        onOpen={openLink}
        moonWeather={deceased ? undefined : { Jupiter: jupRow, Saturn: satRow }}
        heading={deceased ? t("At passing") : pastEnd ? t("Past the periods") : t("Now and next")}
      >
        <div className="mt-4 border-t pt-3" data-testid="overview-from-moon" lang={locale === "ml" ? "en" : undefined}>
          <p className="text-xs font-medium text-muted-foreground" lang={locale}>{t("From the Moon")}</p>
          {/* The adverse tara: the 3rd, 5th and 7th stars from the birth star, and the dasa lords they name. */}
          {plain ? <div className="mt-3 space-y-1.5 text-xs leading-relaxed" data-testid="overview-tara">
            <p>The Moon's birth star is {moon.nakshatra}. A birth star, or nakshatra, is the section of the zodiac where the Moon was at birth. One traditional method compares other stars with it and treats three of them as more challenging.</p>
            <p>{adverseNow ? `The planet assigned to the current long period, ${vim.current.dasa.lord}, is associated with one of those stars in this comparison.` : "The planet assigned to the current long period is not associated with any of those three stars in this comparison."} This is one indication to consider alongside the rest of the reading.</p>
            <details className="text-muted-foreground"><summary className="cursor-pointer font-medium text-primary">Show the star comparison</summary><p className="mt-1">{adverse.map((a) => `${a.name} ${a.nakshatraName} (${a.lord})`).join(" · ")}{adverseNow ? ` · current ${vim.current.dasa.lord} dasa: ${adverseNow.name}-tara lord.` : "."}</p></details>
          </div> : <p
            className="mt-3 text-xs text-muted-foreground"
            data-testid="overview-tara"
          >
            {adverse.map((a) => (
              <span key={a.tara} className="mr-1">
                {a.name} {a.nakshatraName} ({a.lord})
              </span>
            ))}
            {adverseNow ? (
              <span className="text-verdict-mixed">
                — the current {vim.current.dasa.lord} dasa is the{" "}
                {adverseNow.name}-tara lord.
              </span>
            ) : (
              <span>
                — the three stars that work against the birth star; none rules
                the current dasa.
              </span>
            )}
          </p>}

          {/* Transit weather: the slow planets read against the natal Moon (today's sky; the deceased are read at passing, not against it). */}
          {!deceased && (jupRow || satRow) && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[jupRow, satRow].filter(Boolean).map((r) => (
                <li
                  key={r!.planet}
                  className="nadi-info-card text-xs"
                  data-testid={`overview-weather-${r!.planet}`}
                  data-verdict={r!.verdict}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      <PlanetName planet={r!.planet} />
                    </span>
                    <span className="text-muted-foreground">
                      <SignName signIndex={r!.signIndex} /> · your {ord(r!.house)}{" "}
                      from the Moon
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded px-1.5 py-0.5 text-xs font-medium",
                        VERDICT_PILL[r!.verdict],
                      )}
                    >
                      {r!.verdict}
                    </span>
                  </div>
                  {plain && <p className="mt-2 leading-relaxed" data-testid={`overview-weather-explanation-${r!.planet}`}>{gocharaContext(r!, moon.signIndex)}</p>}
                  {plain && r!.voided ? (
                    <p
                      className="mt-1.5 leading-relaxed text-foreground/90"
                      data-testid={`overview-weather-voided-${r!.planet}`}
                    >
                      {gocharaPlainEffect(r!)}
                    </p>
                  ) : (
                    r!.effect.pd && (!plain || !mentionsHeldArea(r!.effect.pd.text, heldAreasAt(result.utc, lifeAt))) && (
                      <p className="mt-1.5 leading-relaxed text-foreground/90">
                        {plain && "The source associates this position with: "}<Soft>{r!.effect.pd.text}</Soft>
                        {r!.voided && (
                          <span className="block text-muted-foreground">
                            {gocharaPlainEffect(r!)}
                          </span>
                        )}
                      </p>
                    )
                  )}
                  {r!.modifierConflict && (
                    <p className="mt-1.5 text-muted-foreground" data-testid={`overview-weather-conflict-${r!.planet}`}>
                      {r!.modifierConflict.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!deceased && (
            <p className="mt-3 text-2xs text-muted-foreground">
              {plain ? "This is a Moon-based transit reading: it compares today's positions with the Moon's position at birth. It uses a different method from the Ashtakavarga grades above, so their indications can differ. More detail is in Panchanga." : "Moon-based gochara, counted from the natal Moon (Phaladeepika 26.1). Its verdict can differ from the sign-based Ashtakavarga transit grade above; the full gochara, with vedha, is on the Panchanga tab."}
            </p>
          )}
        </div>
      </BriefingNow>

      <BriefingPlanets planets={brief.planets} plain={plain} uncertainty={chart.timeUncertaintyMin ?? 0} examples={plain ? planetTopicExamples(topics, reading, heldAreasAt(result.utc, lifeAt)) : undefined} />
        </div>
      </details>

      {/* The life areas as plain cards */}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.filter(() => !plain).map((a) => (
          <li
            key={a.area}
            className="scroll-mt-4 nadi-info-card"
            data-testid={`overview-area-${a.area}`}
            data-tone={a.tone}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {t(areaNoun(a.area))}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  TONE_CLASS[a.tone],
                )}
              >
                {t(AREA_TONE_LABEL[a.tone])}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
              <Soft>{a.headline}</Soft>
            </p>
          </li>
        ))}
      </ul>
      {deferred.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {locale === "ml" ? `പ്രായം കുറഞ്ഞ വായനക്കാർക്കായി ${joinList(deferred.map((a) => t(areaNoun(a.area))), locale)} എന്നീ വിഷയങ്ങൾ ആപ്പ് പിന്നീട് കാണിക്കുന്നതിനായി മാറ്റിവയ്ക്കുന്നു. ഇത് ആപ്പിന്റെ ക്രമീകരണമാണ്; ഈ വിഷയങ്ങൾ എപ്പോൾ പ്രസക്തമാകുമെന്ന പ്രവചനമല്ല.` : plain ? <>For younger readers, the app holds back {joinList(deferred.map((a) => t(areaNoun(a.area))))} until later. This is an app setting, not a prediction of when these areas will matter.</> : <>{joinList(deferred.map((a) => t(areaNoun(a.area))))} is held back for later: {deferred.length === 1 ? "it is" : "they are"} not a present matter at this age.</>}
        </p>
      )}

      {/* Cross-school agreement feedback */}
      {crossSchool.length > 0 && (
        <div
          className="mt-4 rounded-md border border-verdict-mixed/40 bg-verdict-mixed/[0.05] p-3"
          data-testid="overview-agreement"
        >
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Across the systems")}
          </p>
          {plain && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("These traditions use different rules to interpret the same birth chart. Their labels describe chart indications, not established facts about a person or their family.")}</p>}
          <div className="mt-2 space-y-2">
            {crossSchool.map((a) => (
              plain ? <div key={a.topic} className="text-xs leading-relaxed">
                <p><strong>{t(a.label)}:</strong> {t(a.verdict === "disagree" ? "The schools give differing indications, so the app cannot combine them into a single conclusion." : a.verdict === "mixed" ? "The combined indications are mixed, without a clear overall direction." : `The combined indications lean ${a.stance === "leans-supports" ? "supportive" : a.stance === "leans-strains" ? "challenging" : "in one direction"}, but the schools do not all agree.`)}</p>
                <p className="mt-1 text-muted-foreground">{a.stances.map((s) => `${t(AGREEMENT_SYSTEM_LABEL[s.system])}: ${t(PLAIN_SCHOOL_STANCE[s.stance])}`).join("; ")}.</p>
                <details className="mt-1 text-muted-foreground"><summary className="cursor-pointer font-medium text-primary">{t("See the schools' labels")}</summary><p className="mt-1" lang={locale === "ml" && agreementSentenceMalayalam(a, a.sentence) ? "ml" : "en"}>{locale === "ml" ? agreementSentenceMalayalam(a, a.sentence) ?? a.sentence : a.sentence}</p><p className="mt-1" lang="en">“Supported” and “strained” are shorthand for the rules each school found; they do not prove an outcome.</p></details>
              </div> : <p key={a.topic} lang={locale === "ml" ? (agreementSentenceMalayalam(a, a.sentence) ? "ml" : "en") : undefined} className={cn("text-xs leading-relaxed", a.verdict === "disagree" ? "text-verdict-bad" : "text-verdict-mixed")}>{locale === "ml" ? agreementSentenceMalayalam(a, a.sentence) ?? a.sentence : a.sentence}</p>
            ))}
          </div>
        </div>
      )}

      {/* Sarvartha Chintamani highlights (Parashari-lineage) */}
      {result.sarvartha && scShown.length > 0 && (
        <InfoBox as="div"
          className="mt-4"
          data-testid="overview-sarvartha"
        >
          <p className={INFO_BOX_EYEBROW}>
            Parashari · Sarvartha Chintamani
          </p>
          {plain ? <div className="mt-2 space-y-2 text-sm leading-relaxed">
            <p>Sarvartha Chintamani is a classical text that connects chart placements with different areas of life. The app found {scShown.length} matching {scShown.length === 1 ? "rule" : "rules"} in its current selection; some rules use provisional interpretations.</p>
            {scPlain.length ? <ul className="list-disc space-y-1 pl-5">{scPlain.slice(0, 2).map((f) => <li key={`${f.house}.${f.stanza}`}>{f.text} <span className="text-xs text-muted-foreground">(Sarvartha Chintamani {f.ref}{f.provisional ? "; provisional" : ""})</span></li>)}</ul> : <p>No reviewed everyday-language highlight is available for these matches yet.</p>}
            <p>These passages use the language and assumptions of their time. They are traditional interpretations, not guarantees or assessments of anyone's health.</p>
            <button type="button" className="text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => openLink({ tab: "parashari", chapter: "sarvartha" })}>Explore the source readings in Parashari</button>
            {!agreementIn.withheld && <details className="text-xs"><summary className="cursor-pointer font-medium text-primary">See the original highlights</summary><div className="mt-2 space-y-1">{scShown.slice(0, 3).map((f) => <p key={`${f.house}.${f.stanza}`}><strong>{f.topic}:</strong> <Soft>{f.text}</Soft>{f.herePlain?.length ? ` Chart factors: ${f.herePlain.join("; ")}.` : ""}</p>)}{result.sarvartha.rajyogas.length > 0 && <p><strong>Rajyoga (a traditional status combination):</strong> {result.sarvartha.rajyogas.map((r) => r.text).join("; ")}.</p>}</div></details>}
          </div> : <>
          <p className="mt-2 text-sm leading-relaxed">
            {scShown.slice(0, 3).map((f) => (
              <span key={`${f.house}.${f.stanza}`} className="block">
                <span className="font-medium">{f.topic}:</span>{" "}
                <Soft>{f.text}</Soft>
              </span>
            ))}
          </p>
          {result.sarvartha.rajyogas.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed">
              <span className="font-medium">Rajyoga:</span>{" "}
              {result.sarvartha.rajyogas.map((r) => r.text).join("; ")}.
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {scShown.length} of {result.sarvartha.computable}{" "}
            computable rules apply to this chart — the full house-walk is in the
            Parashari tab.
          </p>
          </>}
        </InfoBox>
      )}

    </section>
  );
}
