import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useReadingMode } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";

/** The method, the same for every chart. */
export const HOW_COMPUTED = "How this is computed";
/** This chart's checks and numbers, on a card. */
export const HOW_FOUND = "How this was found";

const OPEN_EVENT = "nadi:open-expander";

/** Open an expander by its id from elsewhere on the page, e.g. a "back to the card" link. */
export function openExpander(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
}

/**
 * The one inline expander. Folded by default in both readings, so the practitioner reading keeps
 * the plain reading's structure, order and folding; explanations open as text in place, never in a
 * popup. Standard labels: HOW_COMPUTED for the method, HOW_FOUND for a card's own checks; content
 * disclosures (a table, a list of verses) keep their own label.
 */
export function Expander({
  id,
  label,
  openLabel,
  count,
  testId,
  children,
  className,
  contentClassName,
  defaultOpen,
  open: openProp,
  onOpenChange,
}: {
  /** Lets openExpander() reach it. */
  id?: string;
  label: ReactNode;
  /** Shown while open; the label when omitted. */
  openLabel?: ReactNode;
  /** A count after the label, such as the number of notes. */
  count?: number;
  testId?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [inner, setInner] = useState(defaultOpen ?? false);
  const open = openProp ?? inner;
  const setOpen = (v: boolean) => {
    setInner(v);
    onOpenChange?.(v);
  };
  useEffect(() => {
    if (!id) return;
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) return;
      setInner(true);
      onOpenChange?.(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [id, onOpenChange]);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="inline-flex items-start gap-1 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
          data-testid={testId ?? (id ? `toggle-${id}` : undefined)}
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "mt-px h-3.5 w-3.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
          <span>
            {open && openLabel ? openLabel : label}
            {count !== undefined ? (
              <span className="tabular font-normal text-muted-foreground/80">
                {" "}
                ({count})
              </span>
            ) : null}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={contentClassName ?? "mt-2"}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * "Show the working": a table or supporting detail. Folded in both readings; it opens the same way
 * for a practitioner as for a plain reader.
 */
export function Working({
  id,
  label,
  count,
  children,
  className,
  defaultOpen,
  open,
  onOpenChange,
}: {
  id: string;
  label: string;
  count?: number;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Expander
      id={`working-${id}`}
      testId={`toggle-working-${id}`}
      label={label}
      openLabel={label.startsWith("Show ") ? `Hide ${label.slice(5)}` : undefined}
      count={count}
      className={className}
      contentClassName="mt-3"
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </Expander>
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
      title="Plain reading: everyday words and a summary first. Practitioner: the same layout with the technical names, every rule, weight, degree and verse reference, and the verse wording that the plain reading softens. Tables and method notes stay folded in both."
    >
      {opt("plain", "Plain reading")}
      {opt("practitioner", "Practitioner")}
    </div>
  );
}
