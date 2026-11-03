import type { PlainTopicNatal } from "@shared/topic-brief";
import { Cite } from "@/components/source-link";
import { useSoften } from "@/lib/gentle";
import { LocalizedText, useLocale } from "@/lib/i18n";

/** Every explanation is attached to the actual source finding from which that theme was selected. */
export function TopicThemes({ topic, compact = false }: { topic: PlainTopicNatal; compact?: boolean }) {
  const soften = useSoften();
  const { locale } = useLocale();
  if (!topic.details?.length) return null;
  return <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
    {topic.details.map((detail, i) => {
      const evidence = topic.detailEvidence?.[i];
      return <li key={`${detail}-${i}`}>
        <LocalizedText>{soften(detail)}</LocalizedText>
        {evidence?.provisional && <>{" "}<span className="text-xs font-medium text-muted-foreground">{locale === "ml" ? "താൽക്കാലിക വ്യാഖ്യാനം." : "Provisional interpretation."}</span></>}
        {evidence?.sourceUnverified && <>{" "}<span className="text-xs font-medium text-muted-foreground">{locale === "ml" ? "ഉറവിടം സ്ഥിരീകരിച്ചിട്ടില്ല." : "Source not verified."}</span></>}
        {evidence?.timeSensitive && <>{" "}<span className="text-xs font-medium text-muted-foreground">{locale === "ml" ? "നൽകിയ ജനനസമയ പരിധിയിൽ ഈ സൂചന മാറാം." : "This may change within the birth-time range."}</span></>}
        {evidence && (compact ? <details className="mt-0.5 text-xs text-muted-foreground" data-testid={`theme-basis-${evidence.ruleId}`}>
          <summary className="cursor-pointer font-medium text-primary">{locale === "ml" ? "ഈ സൂചനയുടെ അടിസ്ഥാനം" : "Why this theme?"}</summary>
          <p className="mt-1" lang={locale}>{locale === "ml" ? evidence.textMl : evidence.text} {evidence.source && <span lang="en"><Cite>{evidence.source}</Cite></span>}</p>
        </details> : <span className="mt-0.5 block text-xs text-muted-foreground" lang={locale} data-testid={`theme-basis-${evidence.ruleId}`}>
          {locale === "ml" ? evidence.textMl : evidence.text} {evidence.source && <span lang="en"><Cite>{evidence.source}</Cite></span>}
        </span>)}
      </li>;
    })}
  </ul>;
}
