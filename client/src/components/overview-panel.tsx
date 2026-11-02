import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { vimshottari } from "@shared/kp";
import { ageYears, lifeAsOf, areaSeason } from "@shared/life-stage";
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
import { Soft } from "@/lib/gentle";
import { usePlain } from "@/components/mode-text";
import { sarvarthaLeftOut } from "@/components/sarvartha-section";
import { useT } from "@/lib/i18n";
import { useAgreement, useAgreementInput } from "@/lib/use-agreement";
import { briefingFor, type BriefLink } from "@shared/briefing";
import { BriefingBefore, BriefingNow, BriefingPlanets, useOpenLink } from "@/components/briefing";
import { PlanetName, SignName } from "@/components/planet-name";
import { cn } from "@/lib/utils";
import { PLAIN_TOPIC_LABEL, plainTopicBriefs, type PlainTopicBrief } from "@shared/topic-brief";
import { SCHOOL_NAME, SCHOOL_TOPIC_LABEL, type BriefSchool, type SchoolTopicBrief } from "@shared/school-topic-brief";
import { defaultAlpForTopics, expandedSchoolTopicBriefs } from "@shared/school-topics-expanded";
import { schoolDetailsLink, SchoolTopicExplanation } from "@/components/school-topic-brief";

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
  quiet: "border-border text-muted-foreground",
};

const joinList = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** The Nadi verdict across the areas, named as Nadi's: the other systems are weighed under Across the systems. */
function glanceSentence(areas: AreaSynthesis[]): string {
  const clauses = nadiAreasClauses(areas);
  return clauses
    ? `In the Nadi reading, ${clauses}.`
    : "The Nadi rules mark nothing in this chart strongly one way or the other; it is a quiet chart.";
}

/** The same source-grounded card is used for the two featured topics and the compact disclosures. */
function PlainTopicContent({ topic, past, onOpen, comparisons }: { topic: PlainTopicBrief; past: boolean; onOpen: (link: BriefLink) => void; comparisons: SchoolTopicBrief[] }) {
  const t = useT();
  const passage = (w: PlainTopicBrief["windows"][number]) => (
    <li key={w.id} data-testid={`plain-topic-window-${topic.topic}-${w.id}`}>
      <p className="text-sm font-medium tabular">{w.when}</p>
      <p className="mt-0.5 text-sm leading-relaxed">{w.statement}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t("Why")}: {w.reason}</p>
      <button type="button" className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => onOpen(w.link)}>{t("See the transit details")}</button>
    </li>
  );
  return (
    <>
      <p className="mt-2 text-sm leading-relaxed"><Soft>{topic.summary}</Soft></p>
      {topic.detailIntro && <p className="mt-2 text-sm leading-relaxed">{topic.detailIntro}</p>}
      {!!topic.details?.length && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">{topic.details.map((detail, i) => <li key={i}><Soft>{detail}</Soft></li>)}</ul>}
      {topic.contrast && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.contrast}</p>}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{topic.limit}</p>
      {topic.comparison && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{topic.comparison}</p>}
      <div className="mt-4 border-t pt-3">
        <p className="text-xs font-semibold">{topic.topic === "health" ? "About timing" : t(past ? "At passing" : "Periods to explore")}</p>
        {topic.windows.length ? (
          <>
            <ul className="mt-2 space-y-3">{topic.windows.slice(0, 1).map(passage)}</ul>
            {topic.windows.length > 1 && <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium text-primary">{t("More passages")} ({topic.windows.length - 1})</summary>
              <ul className="mt-2 space-y-3">{topic.windows.slice(1).map(passage)}</ul>
            </details>}
          </>
        ) : topic.topic !== "health" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">No matching Nadi passage is shown in this briefing. That is not a conclusion about whether an event can occur.</p>}
        {(topic.windows.length > 0 || topic.topic === "health") && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{topic.timingNote}</p>}
      </div>
      <button type="button" className="mt-3 text-xs font-medium text-primary underline-offset-2 hover:underline" onClick={() => onOpen(topic.hasArea ? { tab: "bnn", chapter: "areas", target: `[data-testid="section-area-${topic.topic}"]` } : { tab: "bnn", chapter: "karakas" })}>{t("See Nadi details")}</button>
      {comparisons.length > 0 && <details className="mt-3 border-t pt-3" data-testid={`plain-topic-schools-${topic.topic}`}>
        <summary className="cursor-pointer text-xs font-semibold">See other schools</summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Each school is shown separately. ALP is a progressed reading for the date shown; Prasna Marga here uses the birth chart, not a question chart. Specific questions can use additional rules.</p>
        <div className="mt-2 space-y-3">
          {comparisons.map((b) => <div key={`${b.school}-${b.topic}`} className="rounded-md bg-muted/40 p-2">
            <p className="mb-1 text-xs font-semibold">{SCHOOL_NAME[b.school]}{topic.topic === "family" ? ` · ${SCHOOL_TOPIC_LABEL[b.topic]}` : ""}</p>
            <SchoolTopicExplanation brief={b} onOpen={() => onOpen(schoolDetailsLink(b))} />
          </div>)}
        </div>
      </details>}
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
          ? "in moolatrikona"
          : d.toLowerCase();
  const noteParts: string[] = [];
  if (retro.length) noteParts.push(`${joinList(retro)} ${t("retrograde")}`);
  for (const s of reading.strength) {
    if (NOTABLE_DIGNITY.has(s.effectiveDignity)) {
      noteParts.push(`${s.planet} ${t(dignityPhrase(s.effectiveDignity))}`);
    } else if (
      NOTABLE_DIGNITY.has(s.dignity) &&
      s.dignity !== s.effectiveDignity
    ) {
      noteParts.push(`${s.planet} ${t(dignityPhrase(s.dignity))} ${t("(set aside)")}`);
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
  const deferred = allAreas.filter(
    (a) => !areaSeason(a.area, result.utc, lifeAt).inSeason,
  );

  const glance = glanceSentence(areas);
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
      aria-label="Overview"
    >
      {/* Identity and the glance sentence */}
      <div className="rounded-lg border bg-card p-5 sm:p-6">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("Overview · the chart in a minute")}
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
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Rising")}
            </dt>
            <dd className="text-sm font-medium">{rising}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Sun")}
            </dt>
            <dd className="text-sm font-medium">{sun.sign}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Moon")}
            </dt>
            <dd className="text-sm font-medium">{moon.sign}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Birth star")}
            </dt>
            <dd className="text-sm font-medium">
              {moon.nakshatra} · {moon.nakshatraLord}, p{moon.pada}
            </dd>
          </div>
        </dl>
        {noteParts.length > 0 && (
          <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="overview-notable"
          >
            {noteParts.join(" · ")}
          </p>
        )}

        {(firm.length > 0 || watch.length > 0) && (
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
                  {joinList(firm.map((a) => t(areaNoun(a.area))))}
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
                  {joinList(watch.map((a) => t(areaNoun(a.area))))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BriefingBefore notes={brief.before} onOpen={openLink} />

      {plain && topics.length > 0 && (
        <section className="mt-4 rounded-lg border bg-card p-5 sm:p-6" aria-label="Life topics" data-testid="plain-topic-briefs">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("Life topics")}</p>
          <p className="mt-1 text-sm text-muted-foreground">These short readings use the Nadi method. Other schools have their own readings.</p>
          <p className="mt-1 text-xs text-muted-foreground">Open a topic to compare selected interpretations from the other schools. Their coverage differs; ALP is date-specific and Prasna Marga here uses the birth chart.</p>
          {(chart.timeUncertaintyMin ?? 0) > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">The entered birth time has an uncertainty of ±{chart.timeUncertaintyMin} minutes. Some details can change within that range.</p>
          )}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {topics.filter((topic) => topic.topic === "career" || topic.topic === "marriage").map((topic) => (
              <article key={topic.topic} className="min-w-0 scroll-mt-4 rounded-md border p-4" data-testid={`overview-area-${topic.topic}`}>
                <h3 className="font-display text-lg font-semibold">{t(PLAIN_TOPIC_LABEL[topic.topic])}</h3>
                <PlainTopicContent topic={topic} past={!!brief.past} onOpen={openLink} comparisons={comparisonsFor(topic)} />
              </article>
            ))}
          </div>
          {topics.some((topic) => topic.topic !== "career" && topic.topic !== "marriage") && (
            <details className="mt-4 rounded-md border" data-testid="plain-more-topics">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{t("More life topics")}</summary>
              <div className="grid grid-cols-2 items-start gap-2 border-t p-3 lg:grid-cols-3">
                {topics.filter((topic) => topic.topic !== "career" && topic.topic !== "marriage").map((topic) => (
                  <details key={topic.topic} className="min-w-0 scroll-mt-24 rounded-md border p-3 open:col-span-2 lg:open:col-span-3" data-testid={`overview-area-${topic.topic}`}>
                    <summary className="cursor-pointer text-sm font-semibold">{t(PLAIN_TOPIC_LABEL[topic.topic])}</summary>
                    <PlainTopicContent topic={topic} past={!!brief.past} onOpen={openLink} comparisons={comparisonsFor(topic)} />
                  </details>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {/* Now and next: each system's clock side by side, built in shared/briefing.ts */}
      <BriefingNow
        brief={brief}
        plain={plain}
        onOpen={openLink}
        heading={deceased ? t("At passing") : pastEnd ? t("Past the periods") : t("Now and next")}
      >
        <div className="mt-4 border-t pt-3" data-testid="overview-from-moon">
          <p className="text-xs font-medium text-muted-foreground">{t("From the Moon")}</p>
          {/* The adverse tara: the 3rd, 5th and 7th stars from the birth star, and the dasa lords they name. */}
          <p
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
          </p>

          {/* Transit weather: the slow planets read against the natal Moon (today's sky; the deceased are read at passing, not against it). */}
          {!deceased && (jupRow || satRow) && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[jupRow, satRow].filter(Boolean).map((r) => (
                <li
                  key={r!.planet}
                  className="rounded-md border bg-card p-3 text-xs"
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
                  {plain && r!.voided ? (
                    <p
                      className="mt-1.5 leading-relaxed text-foreground/90"
                      data-testid={`overview-weather-voided-${r!.planet}`}
                    >
                      {gocharaPlainEffect(r!)}
                    </p>
                  ) : (
                    r!.effect.pd && (
                      <p className="mt-1.5 leading-relaxed text-foreground/90">
                        <Soft>{r!.effect.pd.text}</Soft>
                        {r!.voided && (
                          <span className="block text-muted-foreground">
                            {gocharaPlainEffect(r!)}
                          </span>
                        )}
                      </p>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
          {!deceased && (
            <p className="mt-3 text-2xs text-muted-foreground">
              Moon-based gochara, counted from the natal Moon (Phaladeepika 26.1). Its verdict can differ
              from the sign-based Ashtakavarga transit grade above; the full gochara, with vedha, is on the Panchanga tab.
            </p>
          )}
        </div>
      </BriefingNow>

      <BriefingPlanets planets={brief.planets} />

      {/* The life areas as plain cards */}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.filter(() => !plain).map((a) => (
          <li
            key={a.area}
            className="scroll-mt-4 rounded-md border bg-card p-3"
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
          {joinList(deferred.map((a) => t(areaNoun(a.area))))} is held back for
          later: {deferred.length === 1 ? "it is" : "they are"} not a present
          matter at this age.
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
          <div className="mt-1 space-y-1">
            {crossSchool.map((a) => (
              <p
                key={a.topic}
                className={cn(
                  "text-xs leading-relaxed",
                  a.verdict === "disagree"
                    ? "text-verdict-bad"
                    : "text-verdict-mixed",
                )}
              >
                {a.sentence}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sarvartha Chintamani highlights (Parashari-lineage) */}
      {result.sarvartha && scShown.length > 0 && (
        <div
          className="mt-4 rounded-lg border bg-card p-5 sm:p-6"
          data-testid="overview-sarvartha"
        >
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Parashari · Sarvartha Chintamani
          </p>
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
        </div>
      )}

    </section>
  );
}
