import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeoHit } from "@shared/schema";
import { useT } from "@/lib/i18n";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function placeLabel(h: GeoHit): string {
  return [h.name, h.admin1, h.country].filter(Boolean).join(", ");
}

export function PlaceSearch({
  value,
  onPick,
  onEdit,
  placeholder,
  className,
  inputClassName,
  id = "place",
  testId = "input-place",
}: {
  value: string;
  onPick: (hit: GeoHit) => void;
  onEdit?: (text: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  testId?: string;
}) {
  const t = useT();
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const dq = useDebounced(q, 300);
  const { data, isFetching, isError } = useQuery<GeoHit[]>({
    queryKey: ["/api/geocode?q=" + encodeURIComponent(dq)],
    enabled: dq.trim().length >= 2 && open,
  });
  useEffect(() => setQ(value), [value]);
  // Do not offer the previous query's cities while a new query is debouncing.
  const hits = dq === q ? data : undefined;
  const listId = `${id}-options`;
  const expanded = open && !!hits?.length;
  const pick = (hit: GeoHit) => {
    onPick(hit);
    setQ(placeLabel(hit));
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={q}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && active >= 0 && active < hits!.length ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setQ(e.target.value);
            onEdit?.(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setActive(-1); return; }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              setOpen(true);
              if (!hits?.length) return;
              e.preventDefault();
              setActive((i) => e.key === "ArrowDown" ? (i + 1) % hits.length : (i <= 0 ? hits.length - 1 : i - 1));
            } else if (e.key === "Enter" && expanded && active >= 0 && hits?.[active]) {
              e.preventDefault();
              pick(hits[active]);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? t("City of birth")}
          className={cn("pl-9", inputClassName)}
          autoComplete="off"
          data-testid={testId}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && hits && hits.length > 0 && (
        <ul
          id={listId}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-popover-border bg-popover shadow-md"
          role="listbox"
        >
          {hits.map((h, i) => (
            <li key={`${h.name}:${h.latitude}:${h.longitude}`} id={`${listId}-${i}`} role="option" aria-selected={active === i}
              className={cn("flex w-full cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover-elevate", active === i && "bg-accent")}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(h)}
              data-testid={`option-place-${i}`}>
                <span className="truncate">
                  {h.name}
                  {h.admin1 ? `, ${h.admin1}` : ""}
                  {h.matchedAlias ? ` (also known as ${h.matchedAlias})` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {h.country}
                </span>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim().length >= 2 && dq === q && !isFetching && (isError || (hits && hits.length === 0)) && (
        <p className="mt-1 text-xs text-muted-foreground" role="status">
          {t(isError ? "Place search is unavailable. Try again or enter coordinates manually." : "No matching places found. Try another name or enter coordinates manually.")}
        </p>
      )}
    </div>
  );
}
