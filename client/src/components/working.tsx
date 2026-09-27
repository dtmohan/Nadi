import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useReadingMode } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";

/**
 * "Show the working": content a practitioner wants open and a reader wants folded away.
 * Open by default in practitioner mode; a labelled disclosure in plain mode.
 */
export function Working({
  id,
  label,
  count,
  children,
  className,
  defaultOpen,
}: {
  id: string;
  label: string;
  count?: number;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const { mode } = useReadingMode();
  const [open, setOpen] = useState(defaultOpen ?? false);
  if (mode === "practitioner")
    return <div className={className}>{children}</div>;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          data-testid={`toggle-working-${id}`}
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open && "rotate-180",
            )}
          />
          {open ? `Hide the working` : label}
          {count !== undefined && !open ? (
            <span className="tabular text-muted-foreground/80">({count})</span>
          ) : null}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ReadingModeToggle() {
  const { mode, setMode } = useReadingMode();
  const opt = (m: typeof mode, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "rounded px-2.5 py-1",
        mode === m
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
      data-testid={`reading-mode-${m}`}
    >
      {label}
    </button>
  );
  return (
    <div
      role="radiogroup"
      aria-label="Reading depth"
      className="inline-flex rounded-md border p-0.5 text-xs"
      title="Plain reading: everyday words, a summary first, and the detailed tables folded away. Practitioner: the technical names, every rule, weight, degree and verse reference."
    >
      {opt("plain", "Plain reading")}
      {opt("practitioner", "Practitioner")}
    </div>
  );
}
