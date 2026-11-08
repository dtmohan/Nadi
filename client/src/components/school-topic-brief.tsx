import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { schoolTopicBasisPlain, SCHOOL_NAME, SCHOOL_TOPIC_LABEL, type BriefSchool, type SchoolTopicBrief } from "@shared/school-topic-brief";
import { expandedSchoolTopicBriefs, type TopicBuildOptions } from "@shared/school-topics-expanded";
import { ordH } from "@shared/house-gloss";
import { useAgreement, useAgreementInput } from "@/lib/use-agreement";
import { usePlain } from "@/components/mode-text";
import { Soft } from "@/lib/gentle";
import { useOpenLink } from "@/components/briefing";
import type { BriefLink } from "@shared/briefing";
import { InfoBox, InfoBoxTitle, InfoBoxDescription, INFO_BOX_ROW_SUMMARY } from "@/components/info-box";
import { cn } from "@/lib/utils";
import { LocalizedText, useLocale, useT } from "@/lib/i18n";
import { kpHouseMalayalam } from "@shared/school-topic-malayalam";

const KP_HOUSE: Partial<Record<SchoolTopicBrief["topic"], number>> = { career: 10, marriage: 7, children: 5, father: 9, mother: 4 };
const PARASHARI_HOUSE: Partial<Record<SchoolTopicBrief["topic"], number>> = { career: 10, marriage: 7, children: 5, father: 10, mother: 4 };

export function schoolDetailsLink(brief: SchoolTopicBrief): BriefLink {
  if (brief.school === "alp") return { tab: "alp", chapter: "reading", target: '[data-testid="section-alp-findings"]' };
  if (brief.school === "prasna") return {
    tab: "prasna", chapter: brief.frame?.startsWith("Question-chart") ? "prasna" : "houses",
    target: brief.detailHouse ? `[data-testid="prasna-${brief.frame?.startsWith("Question-chart") ? "house" : "house-walk"}-${brief.detailHouse}"]` : undefined,
  };
  if (brief.school === "kp") return {
    tab: "kp", chapter: "houses",
    target: brief.detailHouse ? `[data-testid="kp-cusp-reading-${brief.detailHouse}"]` : brief.stance === "silent" ? '[data-testid="section-kp-reading"]' : `[data-testid="kp-cusp-reading-${KP_HOUSE[brief.topic]}"]`,
  };
  if (brief.school === "parashari") { const house = brief.detailHouse ?? PARASHARI_HOUSE[brief.topic]; if (!house) return { tab: "parashari", chapter: "houses" }; return {
    tab: "parashari", chapter: "houses", target: `[data-testid="house-prose-${house}"]`,
    openControl: `[data-testid="button-house-prose-${house}"]`,
  }; }
  const area = brief.detailArea ?? (brief.topic === "father" || brief.topic === "mother" ? "family" : brief.topic === "travel" ? undefined : brief.topic);
  return { tab: "jaimini", chapter: "areas", target: area ? `[data-testid="jarea-${area}"]` : undefined };
}

export function SchoolTopicExplanation({ brief, onOpen }: { brief: SchoolTopicBrief; onOpen?: () => void }) {
  const { locale } = useLocale();
  const t = useT();
  const line = (english: string, malayalam?: string) => locale === "ml" && malayalam
    ? <span lang="ml">{malayalam}</span>
    : <span lang="en"><Soft>{english}</Soft></span>;
  const basis = schoolTopicBasisPlain(brief);
  const basisTranslation = basis === brief.basis ? brief.ml?.basis : t(basis) !== basis ? t(basis) : undefined;
  return <div className="space-y-1.5 text-sm leading-relaxed" lang={locale} data-testid={`plain-school-${brief.school}-${brief.topic}`}>
    {brief.frame && <p className="text-xs font-medium text-muted-foreground">{line(brief.frame, brief.ml?.frame)}</p>}
    <p>{line(brief.summary, brief.ml?.summary)}</p>
    {brief.explanation?.map((text, i) => <p key={i} className="text-xs leading-relaxed" data-testid={`school-topic-context-${brief.school}-${brief.topic}-${i}`}>{line(text, brief.ml?.explanation?.[i])}</p>)}
    {!!brief.explanationHouses?.length && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">{t("What these KP houses mean")}</summary><ul className="mt-1 space-y-0.5">{brief.explanationHouses.map((h) => <li key={h.house}>{locale === "ml" ? `${h.house}-ാം ഭാവം: ${kpHouseMalayalam[h.house]}.` : `${ordH(h.house)}: ${h.meaning}.`}</li>)}</ul></details>}
    {brief.details?.[0] && !brief.summary.includes(brief.details[0].text) && <p className="text-xs leading-relaxed" data-testid={`school-topic-source-${brief.school}-${brief.topic}`}>
      {line(brief.details[0].text, brief.ml?.details?.[brief.details[0].id])}{" "}<span lang="en">{brief.details[0].sourceUrl ? <a className="underline" href={brief.details[0].sourceUrl} target="_blank" rel="noreferrer">{brief.details[0].source}</a> : <span className="text-muted-foreground">{brief.details[0].source}</span>}</span>
    </p>}
    <p className="text-xs text-muted-foreground">{line(brief.limit, brief.ml?.limit)}</p>
    {brief.conditional && <p className="text-xs text-muted-foreground"><LocalizedText>This assessment is conditional on the birth time.</LocalizedText></p>}
    {brief.provisional && <p className="text-xs text-muted-foreground" data-testid="school-topic-provisional">{t("Provisional")}: {line(brief.reason || "This classification includes an app interpretation.", brief.ml?.reason)}</p>}
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium">{t("Show the basis")}</summary>
      <p className="mt-1">{line(basis, basisTranslation)}</p>
      {!!brief.details?.length && <ul className="mt-2 space-y-2">{brief.details.map((d) => <li key={d.id}>
        <p>{line(d.text, brief.ml?.details?.[d.id])}</p>
        <p className="mt-0.5" lang="en">{d.sourceUrl ? <a className="underline" href={d.sourceUrl} target="_blank" rel="noreferrer">{d.source}</a> : d.source}</p>
      </li>)}</ul>}
    </details>
    {onOpen && <button type="button" onClick={onOpen} className="text-xs font-medium text-primary underline-offset-2 hover:underline">{locale === "ml" ? `${SCHOOL_NAME[brief.school]} വിശദാംശങ്ങൾ കാണുക` : `See ${SCHOOL_NAME[brief.school]} details`}</button>}
  </div>;
}

/** General-rule summaries for the topics the existing school adapter actually covers. */
export function SchoolTopicPanel({ result, school, options }: { result: ChartResult; school: BriefSchool; options?: TopicBuildOptions }) {
  const plain = usePlain();
  const input = useAgreementInput(result);
  const agreement = useAgreement(result, input);
  const open = useOpenLink();
  const { locale } = useLocale();
  const t = useT();
  const topics = useMemo(() => expandedSchoolTopicBriefs(result, school, input, agreement, options), [result, school, input, agreement, options]);
  if (!plain) return null;
  if (!topics.length) return null;
  return <InfoBox className="mt-4" lang={locale} data-testid={`plain-school-topics-${school}`}>
    <InfoBoxTitle>{locale === "ml" ? `${SCHOOL_NAME[school]} ജീവിതവിഷയങ്ങൾ` : `Life topics in ${SCHOOL_NAME[school]}`}</InfoBoxTitle>
    <InfoBoxDescription><LocalizedText>Each summary describes selected, entered interpretations with their original scope. A house can cover several matters; a missing rule is not a negative verdict. Birth-time uncertainty can change house-based readings.</LocalizedText></InfoBoxDescription>
    {school === "kp" && <InfoBoxDescription><LocalizedText>These cards use the four-step comparison. The KP table's six-step option is separate; an education sensitivity check is shown when it changes a selected rule.</LocalizedText></InfoBoxDescription>}
    <div className="mt-5 grid grid-cols-1 items-start gap-x-8 sm:grid-cols-2">
      {topics.map((brief) => <details className={cn("min-w-0 border-b border-border/70", "sm:open:col-span-2")} key={brief.topic}>
        <summary className={cn(INFO_BOX_ROW_SUMMARY, "min-h-11 py-3")}>{t(SCHOOL_TOPIC_LABEL[brief.topic])}</summary>
        <div className="max-w-3xl pb-5"><SchoolTopicExplanation brief={brief} onOpen={() => open(schoolDetailsLink(brief))} /></div>
      </details>)}
    </div>
  </InfoBox>;
}
