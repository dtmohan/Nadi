import type { ChartResult } from "@shared/schema";
import { schoolTopicBasisPlain, schoolTopicBriefs, SCHOOL_NAME, SCHOOL_TOPIC_LABEL, type BriefSchool, type SchoolTopicBrief } from "@shared/school-topic-brief";
import { useAgreement } from "@/lib/use-agreement";
import { usePlain } from "@/components/mode-text";
import { Soft } from "@/lib/gentle";
import { useOpenLink } from "@/components/briefing";
import type { BriefLink } from "@shared/briefing";

const KP_HOUSE = { career: 10, marriage: 7, children: 5, father: 9, mother: 4 } as const;
const PARASHARI_HOUSE = { career: 10, marriage: 7, children: 5, father: 10, mother: 4 } as const;

export function schoolDetailsLink(brief: SchoolTopicBrief): BriefLink {
  if (brief.school === "kp") return {
    tab: "kp", chapter: "houses",
    target: brief.stance === "silent" ? '[data-testid="section-kp-reading"]' : `[data-testid="kp-cusp-reading-${KP_HOUSE[brief.topic]}"]`,
  };
  if (brief.school === "parashari") return {
    tab: "parashari", chapter: "houses", target: `[data-testid="house-prose-${PARASHARI_HOUSE[brief.topic]}"]`,
    openControl: `[data-testid="button-house-prose-${PARASHARI_HOUSE[brief.topic]}"]`,
  };
  const area = brief.topic === "father" || brief.topic === "mother" ? "family" : brief.topic;
  return { tab: "jaimini", chapter: "areas", target: `[data-testid="jarea-${area}"]` };
}

export function SchoolTopicExplanation({ brief, onOpen }: { brief: SchoolTopicBrief; onOpen?: () => void }) {
  return <div className="space-y-1.5 text-sm leading-relaxed" data-testid={`plain-school-${brief.school}-${brief.topic}`}>
    <p>{brief.summary}</p>
    <p className="text-xs text-muted-foreground">{brief.limit}</p>
    {brief.conditional && <p className="text-xs text-muted-foreground">This assessment is conditional on the birth time.</p>}
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer font-medium">Show the basis</summary>
      <p className="mt-1"><Soft>{schoolTopicBasisPlain(brief)}</Soft></p>
      {brief.provisional && <p className="mt-1">Provisional: {brief.reason || "This classification includes an app interpretation."}</p>}
    </details>
    {onOpen && <button type="button" onClick={onOpen} className="text-xs font-medium text-primary underline-offset-2 hover:underline">See {SCHOOL_NAME[brief.school]} details</button>}
  </div>;
}

/** General-rule summaries for the topics the existing school adapter actually covers. */
export function SchoolTopicPanel({ result, school }: { result: ChartResult; school: BriefSchool }) {
  const plain = usePlain();
  const agreement = useAgreement(result);
  const open = useOpenLink();
  if (!plain) return null;
  const topics = schoolTopicBriefs(agreement, school);
  if (!topics.length) return null;
  return <section className="mt-4 rounded-lg border bg-card p-4" data-testid={`plain-school-topics-${school}`}>
    <h3 className="font-display text-base font-semibold">Life topics in {SCHOOL_NAME[school]}</h3>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">These summarize only the general rules included in this comparison. A specific question and date can use additional checks in this school. Birth-time uncertainty can change house-based readings.</p>
    <div className="mt-3 grid grid-cols-2 items-start gap-2 lg:grid-cols-3">
      {topics.map((brief) => <details className="rounded-md border p-3 open:col-span-2 lg:open:col-span-3" key={brief.topic}>
        <summary className="cursor-pointer text-sm font-semibold">{SCHOOL_TOPIC_LABEL[brief.topic]}</summary>
        <div className="mt-2"><SchoolTopicExplanation brief={brief} onOpen={() => open(schoolDetailsLink(brief))} /></div>
      </details>)}
    </div>
  </section>;
}
