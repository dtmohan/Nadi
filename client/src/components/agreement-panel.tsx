import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import {
  AGREEMENT_NOTE,
  AGREEMENT_SYSTEM_LABEL,
  type AgreementSystem,
  type AgreementVerdict,
  type Stance,
} from "@shared/agreement";
import { useAgreement } from "@/lib/use-agreement";
import { Soft } from "@/lib/gentle";
import { cn } from "@/lib/utils";

const VERDICT_LABEL: Record<AgreementVerdict, string> = {
  agree: "agree",
  lean: "lean",
  disagree: "disagree",
  quiet: "quiet",
};

const VERDICT_CLASS: Record<AgreementVerdict, string> = {
  agree: "border-verdict-good/40 text-verdict-good",
  lean: "border-verdict-mixed/40 text-verdict-mixed",
  disagree: "border-dashed border-verdict-bad/50 text-verdict-bad",
  quiet: "border-border text-muted-foreground",
};

const STANCE_DOT: Record<Stance, string> = {
  supports: "bg-verdict-good",
  strains: "bg-verdict-bad",
  mixed: "bg-verdict-mixed",
  contested: "bg-verdict-mixed ring-1 ring-verdict-bad/60",
  silent: "bg-muted-foreground/40",
};

const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * One line per topic saying where the four systems land on the same question. Every system word
 * links to its tab; nothing is blended, the panel only reports the comparison.
 */
export function AgreementPanel({
  result,
  onOpenTab,
  className,
}: {
  result: ChartResult;
  onOpenTab: (tab: AgreementSystem) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const topics = useAgreement(result);

  if (!topics.length) return null;
  const disagree = topics.filter((t) => t.verdict === "disagree").length;
  const agree = topics.filter((t) => t.verdict === "agree").length;

  return (
    <section
      className={cn("rounded-md border bg-card", className)}
      data-testid="agreement-panel"
      aria-label="Where the systems agree or differ"
    >
      <button
        type="button"
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid="agreement-toggle"
      >
        <span className="text-sm font-medium">
          Where the systems agree or differ
        </span>
        <span className="text-xs text-muted-foreground">
          {topics.length} {topics.length === 1 ? "topic" : "topics"}
          {agree ? `, ${agree} in agreement` : ""}
          {disagree ? `, ${disagree} in dispute` : ""}
        </span>
        <span className="ml-auto text-muted-foreground">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>
      <ul className="divide-y border-t" data-testid="agreement-topics">
        {topics.map((t) => (
          <li
            key={t.topic}
            className="px-3 py-2"
            data-testid={`agreement-${t.topic}`}
            data-verdict={t.verdict}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="w-20 shrink-0 text-sm font-medium">
                {t.label}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  VERDICT_CLASS[t.verdict],
                )}
              >
                {VERDICT_LABEL[t.verdict]}
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                {t.stances.map((s) => (
                  <button
                    key={s.system}
                    type="button"
                    onClick={() => onOpenTab(s.system)}
                    title={`${AGREEMENT_SYSTEM_LABEL[s.system]}: ${s.word}. ${uc(s.note)}`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 hover:bg-accent",
                      s.stance === "silent" && "text-muted-foreground",
                    )}
                    data-testid={`agreement-link-${t.topic}-${s.system}`}
                    data-stance={s.stance}
                  >
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full",
                        STANCE_DOT[s.stance],
                      )}
                    />
                    {AGREEMENT_SYSTEM_LABEL[s.system]}
                    <span className="text-muted-foreground">{s.word}</span>
                  </button>
                ))}
              </span>
            </div>
            <p
              className="mt-1 text-xs"
              data-testid={`agreement-sentence-${t.topic}`}
            >
              <Soft>{t.sentence}</Soft>
            </p>
            {open && (
              <ul className="mt-1.5 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                {t.stances.map((s) => (
                  <li key={s.system}>
                    <span className="font-medium text-foreground">
                      {AGREEMENT_SYSTEM_LABEL[s.system]}
                    </span>{" "}
                    <Soft>{uc(s.note)}</Soft>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {open && (
        <p
          className="border-t px-3 py-2 text-2xs text-muted-foreground"
          data-testid="agreement-note"
        >
          {AGREEMENT_NOTE}
        </p>
      )}
    </section>
  );
}
