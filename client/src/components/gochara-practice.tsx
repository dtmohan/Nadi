import {
  GOCHARA_PRACTICE_NOTES,
  type PracticeCheck,
  type PracticeTone,
} from "@shared/gochara-practice";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DOT: Record<PracticeTone, string> = {
  support: "bg-verdict-good",
  strain: "bg-verdict-bad",
  mixed: "bg-verdict-mixed",
  info: "bg-muted-foreground/50",
};

/**
 * Practitioner checks beside the classical gochara (Pande, Gochara Deep Dive, 2026). Shown for comparison only: they never
 * change the verdict colours above, and every one is provisional.
 */
export function GocharaPracticeCard({ checks }: { checks: PracticeCheck[] }) {
  if (!checks.length) return null;
  return (
    <div
      className="mt-6 rounded-md border border-dashed bg-card p-3 text-xs"
      data-testid="gochara-practice"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">Practitioner checks</h3>
        <Badge variant="outline" className="text-2xs uppercase tracking-wide">
          modern practice · provisional
        </Badge>
      </div>
      <p className="mt-1 text-muted-foreground">
        From Shivanshu Pande, Gochara Deep Dive (2026), paraphrased. Not in
        Brihat Samhita or Phaladeepika; shown beside the verdicts above and
        never changing them.
      </p>
      <ul className="mt-3 space-y-3">
        {checks.map((c) => (
          <li key={c.id} data-testid={`gochara-practice-${c.id}`}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium">{c.title}</span>
              {c.sources.map((s) => (
                <SourceLink
                  key={s.label}
                  source={s}
                  mark={false}
                  className="text-2xs text-muted-foreground"
                />
              ))}
            </div>
            <ul className="mt-1 space-y-1">
              {c.lines.map((l, i) => (
                <li
                  key={i}
                  className="flex gap-2"
                  data-testid={`gochara-practice-${c.id}-${l.planet ?? i}`}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      DOT[l.tone],
                    )}
                  />
                  <span className="min-w-0">
                    {l.text}
                    {l.conflict && (
                      <span
                        className="mt-0.5 block text-2xs text-muted-foreground"
                        data-testid={`gochara-practice-conflict-${l.planet ?? i}`}
                      >
                        {l.conflict.text}{" "}
                        {l.conflict.sources.map((s, j) => (
                          <span key={s.label}>
                            {j > 0 && ", "}
                            <SourceLink source={s} />
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <ul
        className="mt-3 list-disc space-y-1 pl-5 text-2xs text-muted-foreground"
        data-testid="gochara-practice-notes"
      >
        {GOCHARA_PRACTICE_NOTES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
