import type { ReactNode } from "react";
import { GLOSSARY } from "@shared/glossary";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** A glossary term with its plain-language meaning on hover or focus. */
export function Term({
  k,
  children,
  className,
}: {
  k: keyof typeof GLOSSARY | string;
  children?: ReactNode;
  className?: string;
}) {
  const g = GLOSSARY[k];
  if (!g) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2",
            className,
          )}
          data-testid={`term-${k}`}
        >
          {children ?? g.term}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        <span className="font-medium">{g.term}.</span> {g.short}
      </TooltipContent>
    </Tooltip>
  );
}
