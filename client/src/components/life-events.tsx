import { useRef, useState } from "react";
import { DateTime } from "luxon";
import { ChevronDown } from "lucide-react";
import type { Chart } from "@shared/schema";
import { EVENT_MATTERS, EVENT_OUTCOMES, matterOf, newEventId, sanitiseEvents, type ChartEvent, type EventOutcome } from "@shared/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { queryClient } from "@/lib/queryClient";
import { chartsStore } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const OUTCOME_LABEL: Record<EventOutcome, string> = { favourable: "Favourable", unfavourable: "Unfavourable", mixed: "Mixed" };
const NONE = "__none";

let queue: Promise<unknown> = Promise.resolve();

/**
 * Change the chart's events on this device and update the open chart without recomputing it.
 * The change is a function of the latest stored list, and writes are run one after another, so
 * quick successive edits (typing, then changing a select) cannot overwrite each other. Events do
 * not change the planets, so the reading query is patched in place rather than refetched.
 */
export function saveEvents(chart: Chart, change: (events: ChartEvent[]) => ChartEvent[]): Promise<ChartEvent[]> {
  const run = async () => {
    const latest = (await chartsStore.get(chart.id))?.events ?? chart.events ?? [];
    const clean = sanitiseEvents(change(latest));
    await chartsStore.update(chart.id, { events: clean });
    queryClient.setQueryData(["chart-result", String(chart.id)], (old: any) => (old ? { ...old, chart: { ...old.chart, events: clean } } : old));
    return clean;
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

/**
 * Editor for the life events kept with a chart. Every change is saved at once; there is no separate
 * save step. Used on the chart page and inside the Rectify tab, so both edit the same list.
 */
export function LifeEventsEditor({ chart, className }: { chart: Chart; className?: string }) {
  const { toast } = useToast();
  const events = chart.events ?? [];
  // Rows being typed: a date input emits partial values while the user types, and those must not be saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const persist = async (change: (events: ChartEvent[]) => ChartEvent[]): Promise<void> => {
    try {
      await saveEvents(chart, change);
    } catch (e: any) {
      toast({ title: "Could not save the events", description: e.message, variant: "destructive" });
    }
  };
  // Notes are saved when typing pauses or the field loses focus, not on every keystroke.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const commitNote = async (id: string, value: string) => {
    clearTimeout(noteTimers.current[id]);
    await update(id, { note: value.trim() || undefined });
    // Drop the draft only once the saved value is in place, and only if nothing newer was typed meanwhile.
    setNoteDrafts((d) => {
      if (d[id] !== value) return d;
      const { [id]: _drop, ...rest } = d;
      return rest;
    });
  };
  const typeNote = (id: string, value: string) => {
    setNoteDrafts((d) => ({ ...d, [id]: value }));
    clearTimeout(noteTimers.current[id]);
    noteTimers.current[id] = setTimeout(() => commitNote(id, value), 600);
  };
  // A new row is saved once it has a date; until then it lives only here.
  const [pending, setPending] = useState<ChartEvent[]>([]);
  const add = () => {
    const id = newEventId();
    setDrafts((d) => ({ ...d, [id]: "" }));
    setPending((p) => [...p, { id, matter: "marriage", date: "" }]);
  };
  const rows: ChartEvent[] = [...events, ...pending.filter((p) => !events.some((e) => e.id === p.id))];

  const update = (id: string, patch: Partial<ChartEvent>): Promise<void> => {
    const inSaved = events.some((e) => e.id === id);
    if (inSaved) {
      if (patch.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) {
        // Partial date: hold it as a draft and keep the saved date until it is complete.
        setDrafts((d) => ({ ...d, [id]: patch.date! }));
        return Promise.resolve();
      }
      setDrafts((d) => {
        const { [id]: _drop, ...rest } = d;
        return rest;
      });
      return persist((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    } else if (!pending.some((p) => p.id === id)) {
      // The row has just been saved and the list has not re-rendered yet: patch it in the store.
      return persist((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    } else {
      // A note still being typed goes with the row when its date completes it.
      const typed = noteDrafts[id];
      const row = { ...(pending.find((p) => p.id === id) ?? { id, matter: "marriage", date: "" }), ...(typed !== undefined && patch.note === undefined ? { note: typed.trim() || undefined } : {}), ...patch };
      if (/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        setPending((p) => p.filter((x) => x.id !== id));
        setDrafts((d) => {
          const { [id]: _drop, ...rest } = d;
          return rest;
        });
        return persist((list) => (list.some((e) => e.id === row.id) ? list.map((e) => (e.id === row.id ? { ...e, ...patch } : e)) : [...list, row]));
      }
      setPending((p) => p.map((x) => (x.id === id ? row : x)));
      if (patch.date !== undefined) setDrafts((d) => ({ ...d, [id]: patch.date! }));
      return Promise.resolve();
    }
  };
  const remove = (id: string) => {
    setPending((p) => p.filter((x) => x.id !== id));
    if (events.some((e) => e.id === id)) void persist((list) => list.filter((e) => e.id !== id));
  };

  return (
    <div className={className} data-testid="life-events">
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No events saved yet. Add the dated events the native remembers; they are kept with the chart on this device and travel with the backup file.</p>}
      {rows.length > 0 && (
        <div className="space-y-2" data-testid="life-events-rows">
          {rows.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-2 text-xs" data-testid={`life-event-${e.id}`}>
              <Select value={matterOf(e.matter).id} onValueChange={(v) => update(e.id, { matter: v })}>
                <SelectTrigger className="h-8 w-56 text-xs" data-testid={`select-event-matter-${e.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_MATTERS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.label} <span className="text-muted-foreground">({m.houses.join(", ")})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={drafts[e.id] ?? e.date} onChange={(ev) => update(e.id, { date: ev.target.value })} className="h-8 w-40 text-xs tabular" data-testid={`input-event-date-${e.id}`} />
              <Select value={e.outcome ?? NONE} onValueChange={(v) => update(e.id, { outcome: v === NONE ? undefined : (v as EventOutcome) })}>
                <SelectTrigger className="h-8 w-36 text-xs" data-testid={`select-event-outcome-${e.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} className="text-xs">
                    Outcome as usual
                  </SelectItem>
                  {EVENT_OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o} className="text-xs">
                      {OUTCOME_LABEL[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={noteDrafts[e.id] ?? e.note ?? ""}
                placeholder="Note (optional)"
                maxLength={300}
                onChange={(ev) => typeNote(e.id, ev.target.value)}
                onBlur={(ev) => noteDrafts[e.id] !== undefined && void commitNote(e.id, ev.target.value)}
                className="h-8 w-56 text-xs"
                data-testid={`input-event-note-${e.id}`}
              />
              <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={() => remove(e.id)} data-testid={`button-event-remove-${e.id}`}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <Button size="sm" variant="outline" className="h-8" onClick={add} data-testid="button-event-add">
          Add an event
        </Button>
        {rows.length > 0 && <span className="text-muted-foreground">Saved as you type; a row is kept once it has a full date. "Outcome as usual" means the matter's own nature (marriage favourable, illness unfavourable).</span>}
      </div>
    </div>
  );
}

/** One-line summary of the saved events, for the chart header. */
export function eventsSummary(events: ChartEvent[], zone: string): string {
  if (!events.length) return "none saved";
  return events
    .slice(0, 4)
    .map((e) => `${matterOf(e.matter).label} ${DateTime.fromISO(e.date, { zone }).toFormat("LLL yyyy")}`)
    .join(" · ") + (events.length > 4 ? ` · ${events.length - 4} more` : "");
}

/** Folded Life events block for the chart page: a summary line that opens into the editor. */
export function LifeEventsSection({ chart }: { chart: Chart }) {
  const [open, setOpen] = useState(false);
  const events = chart.events ?? [];
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-4 rounded-md border px-3 py-2" data-testid="section-life-events">
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left text-xs" aria-expanded={open} data-testid="toggle-life-events">
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          <span className="font-medium">
            Life events <span className="tabular text-muted-foreground">({events.length})</span>
          </span>
          <span className="text-muted-foreground" data-testid="text-life-events-summary">
            {eventsSummary(events, chart.timezone)}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <p className="mb-2 text-xs text-muted-foreground">Dated events the native remembers. Rectification scores candidate birth times by them; they will also serve to check predictions and to tally how each planet's periods turned out.</p>
        <LifeEventsEditor chart={chart} />
      </CollapsibleContent>
    </Collapsible>
  );
}
