import { ReactNode, createContext, useContext } from "react";
import { useReadingMode } from "@/lib/reading-mode";
import { Term } from "@/components/term";
import { cn } from "@/lib/utils";

/** One of two wordings for the same idea: everyday language in the plain reading, the technical text for practitioners. */
export function ModeText({
  plain,
  practitioner,
  className,
  testId,
}: {
  plain: ReactNode;
  practitioner: ReactNode;
  className?: string;
  testId?: string;
}) {
  const { mode } = useReadingMode();
  return (
    <p
      className={cn("mt-1 text-xs text-muted-foreground", className)}
      data-testid={testId}
      data-mode={mode}
    >
      {mode === "plain" ? plain : practitioner}
    </p>
  );
}

/**
 * Section heading that leads with everyday words in the plain reading and with the technical name for practitioners.
 * The other name follows in muted type so either reader can connect the two; `term` links it to the glossary.
 */
export function SectionTitle({
  plain,
  technical,
  term,
  as: Tag = "h3",
  className,
  children,
}: {
  plain: string;
  technical: string;
  term?: string;
  as?: "h2" | "h3" | "h4";
  className?: string;
  children?: ReactNode;
}) {
  const { mode } = useReadingMode();
  const lead = mode === "plain" ? plain : technical;
  const trail = mode === "plain" ? technical : plain;
  const trailNode = term ? <Term k={term}>{trail}</Term> : trail;
  return (
    <Tag
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold",
        className,
      )}
    >
      <span>{lead}</span>
      <span className="text-xs font-normal text-muted-foreground">
        {trailNode}
      </span>
      {children}
    </Tag>
  );
}

/**
 * Whether the chart being read has a recorded date of passing. Every "now" marker in the period
 * tables then reads "at passing", since the reading is taken at that date, not today.
 */
const DeceasedContext = createContext(false);
export function DeceasedProvider({
  deceased,
  children,
}: {
  deceased: boolean;
  children: ReactNode;
}) {
  return (
    <DeceasedContext.Provider value={deceased}>
      {children}
    </DeceasedContext.Provider>
  );
}
export function useDeceased() {
  return useContext(DeceasedContext);
}
/** The word for the running period: "now", or "at passing" for a native with a recorded date of passing. */
export function NowWord({ cap = false }: { cap?: boolean }) {
  const deceased = useDeceased();
  const w = deceased ? "at passing" : "now";
  return <>{cap ? w.charAt(0).toUpperCase() + w.slice(1) : w}</>;
}
export function useNowLabel(cap = true): string {
  const deceased = useDeceased();
  const w = deceased ? "at passing" : "now";
  return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

export function usePlain() {
  return useReadingMode().mode === "plain";
}
