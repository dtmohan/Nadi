import { useEffect, useMemo, useRef, useState } from "react";
import { Cite } from "@/components/source-link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JAIMINI_TEXT_SOURCE } from "@shared/rules-jaimini";
import { PADA_TITLE, matchesRef, parseRef, type Sutra } from "@/lib/sutras";

const PADAS = Object.keys(PADA_TITLE);

export function SutraLibrary({ initialRef }: { initialRef?: string }) {
  const { data, isLoading } = useQuery<Sutra[]>({
    queryKey: ["/api/jaimini-sutras"],
    staleTime: Infinity,
  });
  const [q, setQ] = useState("");
  const [pada, setPada] = useState<string>("all");
  const [ref, setRef] = useState<string | undefined>(initialRef);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const firstHit = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    setRef(initialRef);
    if (initialRef) {
      setQ("");
      setPada("all");
    }
  }, [initialRef]);

  const filtered = useMemo(() => {
    const all = data ?? [];
    if (ref && parseRef(ref)) return all.filter((s) => matchesRef(s, ref));
    const needle = q.trim().toLowerCase();
    const asRef = parseRef(needle);
    return all.filter((s) => {
      if (pada !== "all" && `${s.ch}.${s.pd}` !== pada) return false;
      if (!needle) return true;
      if (asRef) return matchesRef(s, needle);
      return (
        s.text.toLowerCase().includes(needle) ||
        s.sanskrit.toLowerCase().includes(needle) ||
        s.notes.toLowerCase().includes(needle) ||
        s.ref.startsWith(needle)
      );
    });
  }, [data, q, pada, ref]);

  useEffect(() => {
    if (ref && firstHit.current)
      firstHit.current.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [ref, filtered.length]);

  const toggle = (r: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });

  return (
    <div data-testid="sutra-library">
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The text of Jaimini Sutras, Adhyayas 1 and 2, in{" "}
        <Cite href={JAIMINI_TEXT_SOURCE.url}>
          B. Suryanarain Rao's English translation
        </Cite>{" "}
        with his notes. The text was recovered from a scanned copy and has not
        been proofread, so expect split words and a few missing sutras. Findings
        that cite a sutra link here.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setRef(undefined);
          }}
          placeholder="Search text, transliteration or a reference like 1.2.16"
          className="w-72"
          data-testid="input-sutra-search"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Pada">
          <Button
            size="sm"
            variant={pada === "all" && !ref ? "secondary" : "ghost"}
            onClick={() => {
              setPada("all");
              setRef(undefined);
            }}
            data-testid="filter-pada-all"
          >
            All
          </Button>
          {PADAS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={pada === p && !ref ? "secondary" : "ghost"}
              onClick={() => {
                setPada(p);
                setRef(undefined);
              }}
              data-testid={`filter-pada-${p.replace(".", "-")}`}
              title={PADA_TITLE[p]}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
      {ref && parseRef(ref) && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="rounded bg-muted px-2 py-0.5 tabular">
            Showing {ref}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRef(undefined)}
            data-testid="button-sutra-clear"
          >
            Show all
          </Button>
        </div>
      )}
      {pada !== "all" && !ref && (
        <div className="mt-3 text-sm text-muted-foreground">
          {PADA_TITLE[pada]}
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground tabular">
        {isLoading
          ? "Loading…"
          : `${filtered.length} of ${data?.length ?? 0} sutras`}
      </div>
      <ul className="mt-2 divide-y">
        {filtered.map((s, i) => (
          <li
            key={s.ref}
            ref={i === 0 ? firstHit : undefined}
            className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[5rem_1fr] scroll-mt-20"
            data-testid={`sutra-${s.ref}`}
          >
            <div className="text-sm font-medium tabular">{s.ref}</div>
            <div>
              {s.sanskrit && (
                <div className="text-xs text-muted-foreground">
                  {s.sanskrit}
                </div>
              )}
              <div className="mt-0.5 text-sm">{s.text}</div>
              {s.notes && (
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => toggle(s.ref)}
                    className="text-xs text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
                    data-testid={`button-sutra-notes-${s.ref}`}
                  >
                    {open.has(s.ref) ? "Hide Rao's notes" : "Rao's notes"}
                  </button>
                  {open.has(s.ref) && (
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                      {s.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
