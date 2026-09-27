import { useCallback, type ReactNode } from "react";
import { GENTLE_NOTE, soften } from "@shared/gentle";
import { useReadingMode } from "@/lib/reading-mode";

/**
 * The gentle register for sensitive results. In the plain reading every sentence about
 * death, loss or disease is reworded into risk and strain (shared/gentle.ts); the
 * practitioner reading shows the verse wording. Use `useSoften()` for strings and
 * `<Soft>` for inline text.
 */
export function useSoften(): (text: string) => string {
  const { mode } = useReadingMode();
  return useCallback(
    (text: string) => (mode === "plain" ? soften(text) : text),
    [mode],
  );
}

export function Soft({ children }: { children: ReactNode }) {
  const s = useSoften();
  return <>{typeof children === "string" ? s(children) : children}</>;
}

/** One-line content note for blocks that reproduce classical rules on length of life or loss. */
export function GentleNote({ testId }: { testId?: string }) {
  return (
    <p
      className="mt-2 rounded border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
      data-testid={testId ?? "gentle-note"}
    >
      {GENTLE_NOTE}
    </p>
  );
}
