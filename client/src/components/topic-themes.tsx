import type { PlainTopicNatal } from "@shared/topic-brief";
import { Cite } from "@/components/source-link";
import { useSoften } from "@/lib/gentle";
import { LocalizedText, useLocale } from "@/lib/i18n";

/** Every explanation is attached to the actual source finding from which that theme was selected. */
export function TopicThemes({ topic }: { topic: PlainTopicNatal }) {
  const soften = useSoften();
  const { locale } = useLocale();
  if (!topic.details?.length) return null;
  return <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
    {topic.details.map((detail, i) => {
      const evidence = topic.detailEvidence?.[i];
      return <li key={`${detail}-${i}`}>
        <LocalizedText>{soften(detail)}</LocalizedText>
        {evidence && <span className="mt-0.5 block text-xs text-muted-foreground" lang={locale === "ml" ? "en" : undefined} data-testid={`theme-basis-${evidence.ruleId}`}>
          {evidence.text} {evidence.source && <Cite>{evidence.source}</Cite>}
        </span>}
      </li>;
    })}
  </ul>;
}
