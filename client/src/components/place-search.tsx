import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeoHit } from "@shared/schema";

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

export function PlaceSearch({ value, onPick, placeholder = "City of birth", className, inputClassName, id = "place", testId = "input-place" }: { value: string; onPick: (hit: GeoHit) => void; placeholder?: string; className?: string; inputClassName?: string; id?: string; testId?: string }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q, 300);
  const { data: hits, isFetching } = useQuery<GeoHit[]>({
    queryKey: ["/api/geocode?q=" + encodeURIComponent(dq)],
    enabled: dq.trim().length >= 2 && open,
  });
  useEffect(() => setQ(value), [value]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={cn("pl-9", inputClassName)}
          autoComplete="off"
          data-testid={testId}
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && hits && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-popover-border bg-popover shadow-md" role="listbox">
          {hits.map((h, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover-elevate"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(h);
                  setQ(placeLabel(h));
                  setOpen(false);
                }}
                data-testid={`option-place-${i}`}
              >
                <span className="truncate">
                  {h.name}
                  {h.admin1 ? `, ${h.admin1}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{h.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
