import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReadingMode } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";

/**
 * Chapters: a system tab read one part at a time instead of as one long page.
 *
 * A tab declares its chapters (a label for each reading mode, a one-line note for the contents
 * list) and wraps each part of its layout in <Chapter id>. Parts that share an id are gathered
 * into one chapter in source order, so a panel keeps its code layout while the reader sees one
 * chapter at a time; "All" restores the whole tab on one page. The open chapter of each tab is
 * remembered while the chart page stays open, in React state only (no browser storage).
 */

export interface ChapterDef {
  id: string;
  /** Label in the plain reading. */
  plain: string;
  /** Label for practitioners; the plain label when omitted. */
  technical?: string;
  /** One line for the contents list on the first chapter. */
  blurb?: string;
  /** A count shown after the label, such as the number of yogas that hold. */
  count?: number;
  /** Leave the chapter out, e.g. when it has nothing for this chart. */
  hidden?: boolean;
}

export const ALL_CHAPTERS = "all";

type Memory = Record<string, string>;
const MemoryContext = createContext<{
  memory: Memory;
  remember: (tab: string, id: string) => void;
} | null>(null);

/** Holds the open chapter of every tab for one chart; remount it (key by chart) to start afresh. */
export function ChapterMemoryProvider({ children }: { children: ReactNode }) {
  const [memory, setMemory] = useState<Memory>({});
  const remember = useCallback(
    (tab: string, id: string) =>
      setMemory((m) => (m[tab] === id ? m : { ...m, [tab]: id })),
    [],
  );
  const value = useMemo(() => ({ memory, remember }), [memory, remember]);
  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

/** Open a chapter of a tab from elsewhere in the panel, e.g. a chart click that leads into a list. */
export function useChapterNav(tab: string): (id: string) => void {
  const ctx = useContext(MemoryContext);
  return useCallback((id: string) => ctx?.remember(tab, id), [ctx, tab]);
}

/** One part of a chapter. Outside <Chapters> it renders its content unchanged. */
export function Chapter({ children }: { id: string; children?: ReactNode }) {
  return <>{children}</>;
}

function collect(nodes: ReactNode, into: Map<string, ReactNode[]>) {
  Children.forEach(nodes, (node) => {
    if (!isValidElement(node)) return;
    const props = node.props as { id?: string; children?: ReactNode };
    if (node.type === Fragment) return collect(props.children, into);
    if (node.type !== Chapter || !props.id) return;
    const parts = into.get(props.id) ?? [];
    parts.push(
      <Fragment key={`${props.id}-${parts.length}`}>{props.children}</Fragment>,
    );
    into.set(props.id, parts);
  });
}

/** The scrolling element that holds the page: the app's <main>, else the document. */
function scroller(el: HTMLElement): HTMLElement {
  return (
    (el.closest("main") as HTMLElement | null) ??
    (document.scrollingElement as HTMLElement)
  );
}

export function Chapters({
  tab,
  chapters,
  children,
  contents = true,
  className,
}: {
  /** The system tab these chapters belong to; also the prefix of every test id. */
  tab: string;
  chapters: ChapterDef[];
  children: ReactNode;
  /** List the other chapters, with their notes, at the end of the first one. */
  contents?: boolean;
  className?: string;
}) {
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  const label = (c: ChapterDef) => (plain ? c.plain : (c.technical ?? c.plain));

  const parts = new Map<string, ReactNode[]>();
  collect(children, parts);
  const list = chapters.filter((c) => !c.hidden && parts.has(c.id));

  const ctx = useContext(MemoryContext);
  const [local, setLocal] = useState<string>();
  const stored = ctx ? ctx.memory[tab] : local;
  const active =
    stored === ALL_CHAPTERS || list.some((c) => c.id === stored)
      ? stored!
      : (list[0]?.id ?? ALL_CHAPTERS);
  const all = active === ALL_CHAPTERS;

  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const open = (id: string, scroll: "if-past" | "always" = "if-past") => {
    if (ctx) ctx.remember(tab, id);
    else setLocal(id);
    // Start the new chapter at its beginning when the reader has scrolled into the old one.
    requestAnimationFrame(() => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const box = scroller(anchor);
      const boxTop =
        box === document.scrollingElement ? 0 : box.getBoundingClientRect().top;
      const top = anchor.getBoundingClientRect().top - boxTop + box.scrollTop;
      if (scroll === "always" || box.scrollTop > top + 1)
        box.scrollTo({ top: Math.max(0, top) });
    });
  };

  // Fade the strip's edges while more chapters sit beyond them (narrow screens).
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, []);

  // Keep the open chapter's label in view along the strip, without moving the page.
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!strip || !el) return;
    const left = el.offsetLeft - strip.offsetLeft;
    if (
      left < strip.scrollLeft ||
      left + el.offsetWidth > strip.scrollLeft + strip.clientWidth
    )
      strip.scrollTo({ left: Math.max(0, left - 24), behavior: "smooth" });
  }, [active, mode]);

  const ids = [...list.map((c) => c.id), ALL_CHAPTERS];
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ids.indexOf(active);
    const to =
      e.key === "ArrowRight"
        ? ids[(i + 1) % ids.length]
        : e.key === "ArrowLeft"
          ? ids[(i - 1 + ids.length) % ids.length]
          : e.key === "Home"
            ? ids[0]
            : e.key === "End"
              ? ids[ids.length - 1]
              : null;
    if (!to) return;
    e.preventDefault();
    open(to);
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-chapter="${to}"]`)
        ?.focus(),
    );
  };

  if (!list.length) return <div className={className}>{children}</div>;

  const at = list.findIndex((c) => c.id === active);
  const prev = at > 0 ? list[at - 1] : null;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;
  const tabBtn = (id: string, text: ReactNode, selected: boolean) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={`chapter-tab-${tab}-${id}`}
      aria-selected={selected}
      aria-controls={`chapter-panel-${tab}`}
      tabIndex={selected ? 0 : -1}
      data-chapter={id}
      onClick={() => open(id)}
      className={cn(
        "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected
          ? "font-medium text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
      data-testid={`chapter-${tab}-${id}`}
    >
      {text}
    </button>
  );

  return (
    <div className={className} data-testid={`chapters-${tab}`}>
      <div ref={anchorRef} aria-hidden />
      <nav
        aria-label="Chapters in this tab"
        className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        data-testid={`chapter-bar-${tab}`}
      >
        <div
          ref={listRef}
          role="tablist"
          aria-label="Chapters"
          onKeyDown={onKey}
          className="flex items-stretch"
        >
          <div className="relative min-w-0 flex-1">
            <div
              ref={stripRef}
              className="flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
            {list.map((c) =>
              tabBtn(
                c.id,
                <>
                  {label(c)}
                  {c.count !== undefined && (
                    <span className="tabular ml-1.5 text-xs font-normal text-muted-foreground">
                      {c.count}
                    </span>
                  )}
                </>,
                active === c.id,
              ),
            )}
            </div>
            {edges.left && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
              />
            )}
            {edges.right && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
              />
            )}
          </div>
          <span aria-hidden className="mx-1 my-2.5 w-px shrink-0 bg-border" />
          {tabBtn(ALL_CHAPTERS, plain ? "Everything" : "All", all)}
        </div>
      </nav>

      {all ? (
        <div
          role="tabpanel"
          id={`chapter-panel-${tab}`}
          aria-labelledby={`chapter-tab-${tab}-${ALL_CHAPTERS}`}
          data-testid={`chapter-panel-${tab}-${ALL_CHAPTERS}`}
        >
          {list.map((c, i) => (
            <section
              key={c.id}
              aria-labelledby={`chapter-h-${tab}-${c.id}`}
              className={cn(i === 0 ? "pt-6" : "mt-12 border-t pt-8")}
            >
              <h2
                id={`chapter-h-${tab}-${c.id}`}
                className="text-lg font-semibold"
              >
                {label(c)}
              </h2>
              <div className="[&>*:first-child]:!mt-3">{parts.get(c.id)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div
          key={active}
          role="tabpanel"
          id={`chapter-panel-${tab}`}
          aria-labelledby={`chapter-tab-${tab}-${active}`}
          className="pt-6 animate-in fade-in-0 duration-200 [&>*:first-child]:!mt-0"
          data-testid={`chapter-panel-${tab}-${active}`}
        >
          {parts.get(active)}

          {contents && at === 0 && list.length > 2 && (
            <nav
              aria-label="In this tab"
              className="mt-10"
              data-testid={`chapter-contents-${tab}`}
            >
              <h3 className="text-sm font-semibold">
                {plain ? "Also in this tab" : "Chapters"}
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {list.slice(1).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => open(c.id, "always")}
                      className="flex h-full w-full flex-col rounded-md border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                      data-testid={`chapter-contents-${tab}-${c.id}`}
                    >
                      <span className="flex w-full items-baseline justify-between gap-2 text-sm font-medium">
                        {label(c)}
                        {c.count !== undefined && (
                          <span className="tabular text-xs font-normal text-muted-foreground">
                            {c.count}
                          </span>
                        )}
                      </span>
                      {c.blurb && (
                        <span className="mt-1 text-xs leading-5 text-muted-foreground">
                          {c.blurb}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {(prev || next) && (
            <div
              className="mt-12 flex items-center justify-between gap-3 border-t pt-4 text-sm"
              data-testid={`chapter-pager-${tab}`}
            >
              {prev ? (
                <button
                  type="button"
                  onClick={() => open(prev.id, "always")}
                  className="inline-flex min-w-0 items-center gap-1 text-muted-foreground hover:text-foreground"
                  data-testid={`chapter-prev-${tab}`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label(prev)}</span>
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => open(next.id, "always")}
                  className="inline-flex min-w-0 items-center gap-1 text-right font-medium text-foreground hover:text-primary"
                  data-testid={`chapter-next-${tab}`}
                >
                  <span className="truncate">
                    {plain ? "Next: " : ""}
                    {label(next)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
