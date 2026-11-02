import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { schoolTopicBasisPlain, SCHOOL_NAME, SCHOOL_TOPIC_LABEL, type BriefSchool, type SchoolTopicBrief } from "@shared/school-topic-brief";
import { expandedSchoolTopicBriefs, type TopicBuildOptions } from "@shared/school-topics-expanded";
import { useAgreement, useAgreementInput } from "@/lib/use-agreement";
import { usePlain } from "@/components/mode-text";
import { Soft } from "@/lib/gentle";
import { useOpenLink } from "@/components/briefing";
import type { BriefLink } from "@shared/briefing";

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
  return <div className="space-y-1.5 text-sm leading-relaxed" data-testid={`plain-school-${brief.school}-${brief.topic}`}>
    {brief.frame && <p className="text-xs font-medium text-muted-foreground">{brief.frame}</p>}
    <p>{brief.summary}</p>
    <p className="text-xs text-muted-foreground">{brief.limit}</p>
    {brief.conditional && <p className="text-xs text-muted-foreground">This assessment is conditional on the birth time.</p>}
    {brief.provisional && <p className="text-xs text-muted-foreground" data-testid="school-topic-provisional">Provisional: {brief.reason || "This classification includes an app interpretation."}</p>}
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium">Show the basis</summary>
      <p className="mt-1"><Soft>{schoolTopicBasisPlain(brief)}</Soft></p>
      {!!brief.details?.length && <ul className="mt-2 space-y-2">{brief.details.map((d) => <li key={d.id}>
        <p><Soft>{d.text}</Soft></p>
        <p className="mt-0.5">{d.sourceUrl ? <a className="underline" href={d.sourceUrl} target="_blank" rel="noreferrer">{d.source}</a> : d.source}</p>
      </li>)}</ul>}
    </details>
    {onOpen && <button type="button" onClick={onOpen} className="text-xs font-medium text-primary underline-offset-2 hover:underline">See {SCHOOL_NAME[brief.school]} details</button>}
  </div>;
}

/** General-rule summaries for the topics the existing school adapter actually covers. */
export function SchoolTopicPanel({ result, school, options }: { result: ChartResult; school: BriefSchool; options?: TopicBuildOptions }) {
  const plain = usePlain();
  const input = useAgreementInput(result);
  const agreement = useAgreement(result, input);
  const open = useOpenLink();
  const topics = useMemo(() => expandedSchoolTopicBriefs(result, school, input, agreement, options), [result, school, input, agreement, options]);
  if (!plain) return null;
  if (!topics.length) return null;
  return <section className="mt-4 rounded-lg border bg-card p-4" data-testid={`plain-school-topics-${school}`}>
    <h3 className="font-display text-base font-semibold">Life topics in {SCHOOL_NAME[school]}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Each summary describes selected, entered interpretations with their original scope. A house can cover several matters; a missing rule is not a negative verdict. Birth-time uncertainty can change house-based readings.</p>
    {school === "kp" && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">These cards use the four-step comparison. The KP table's six-step option is separate; an education sensitivity check is shown when it changes a selected rule.</p>}
    <div className="mt-3 grid grid-cols-2 items-start gap-2 lg:grid-cols-3">
      {topics.map((brief) => <details className="rounded-md border p-3 open:col-span-2 lg:open:col-span-3" key={brief.topic}>
        <summary className="cursor-pointer text-sm font-semibold">{SCHOOL_TOPIC_LABEL[brief.topic]}</summary>
        <div className="mt-2"><SchoolTopicExplanation brief={brief} onOpen={() => open(schoolDetailsLink(brief))} /></div>
      </details>)}
    </div>
  </section>;
}
