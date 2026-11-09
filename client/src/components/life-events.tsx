import { useRef, useState } from "react";
import { DateTime } from "luxon";
import { ChevronDown } from "lucide-react";
import type { Chart } from "@shared/schema";
import {
  EVENT_MATTERS,
  EVENT_OUTCOMES,
  matterOf,
  newEventId,
  sanitiseEvents,
  type ChartEvent,
  type EventOutcome,
} from "@shared/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { queryClient } from "@/lib/queryClient";
import { patchChartEvents } from "@/lib/chart-events-cache";
import { chartsStore } from "@/lib/charts-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { translate, useLocale, useT, type Locale } from "@/lib/i18n";

const OUTCOME_LABEL: Record<EventOutcome, string> = {
  favourable: "Favourable",
  unfavourable: "Unfavourable",
  mixed: "Mixed",
};
const NONE = "__none";

let queue: Promise<unknown> = Promise.resolve();

/**
 * Change the chart's events on this device and update the open chart without recomputing it.
 * The change is a function of the latest stored list, and writes are run one after another, so
 * quick successive edits (typing, then changing a select) cannot overwrite each other. Events do
 * not change the planets, so the reading query is patched in place rather than refetched.
 */
export function saveEvents(
  chart: Chart,
  change: (events: ChartEvent[]) => ChartEvent[],
): Promise<ChartEvent[]> {
  const run = async () => {
    const latest =
      (await chartsStore.get(chart.id))?.events ?? chart.events ?? [];
    const clean = sanitiseEvents(change(latest));
    await chartsStore.update(chart.id, { events: clean });
    patchChartEvents(queryClient, chart.id, clean, async () => (await chartsStore.get(chart.id))?.events);
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
export function LifeEventsEditor({
  chart,
  className,
}: {
  chart: Chart;
  className?: string;
}) {
  const { toast } = useToast();
  const { locale } = useLocale();
  const t = useT();
  const events = chart.events ?? [];
  // Rows being typed: a date input emits partial values while the user types, and those must not be saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [timeDrafts, setTimeDrafts] = useState<Record<string, string>>({});
  const [zoneDrafts, setZoneDrafts] = useState<Record<string, string>>({});

  const persist = async (
    change: (events: ChartEvent[]) => ChartEvent[],
  ): Promise<void> => {
    try {
      await saveEvents(chart, change);
    } catch (e: any) {
      toast({
        title: locale === "ml" ? "സംഭവങ്ങൾ സൂക്ഷിക്കാനായില്ല" : "Could not save the events",
        description: e.message,
        variant: "destructive",
      });
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
  // Dates: the field keeps its own draft while it has focus. A date input reports a full value at every
  // keystroke in the year (0001, 0019, 0198, 1982), and writing each of those back into the field resets the
  // year being typed; so the draft is displayed until blur and only a year of four real digits is saved,
  // after a short pause or on blur.
  const dateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const fullDate = (v: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 1000;
  const typeDate = (id: string, value: string) => {
    setDrafts((d) => ({ ...d, [id]: value }));
    clearTimeout(dateTimers.current[id]);
    if (fullDate(value))
      dateTimers.current[id] = setTimeout(
        () => void update(id, { date: value }),
        700,
      );
  };
  const blurDate = (id: string, value: string) => {
    clearTimeout(dateTimers.current[id]);
    if (fullDate(value)) void update(id, { date: value });
    setDrafts((d) => {
      const { [id]: _drop, ...rest } = d;
      return rest;
    });
  };
  // A new row is saved once it has a date; until then it lives only here.
  const [pending, setPending] = useState<ChartEvent[]>([]);
  const add = () => {
    const id = newEventId();
    setDrafts((d) => ({ ...d, [id]: "" }));
    setPending((p) => [...p, { id, matter: "marriage", date: "" }]);
  };
  const rows: ChartEvent[] = [
    ...events,
    ...pending.filter((p) => !events.some((e) => e.id === p.id)),
  ];

  const update = (id: string, patch: Partial<ChartEvent>): Promise<void> => {
    const inSaved = events.some((e) => e.id === id);
    if (inSaved) {
      if (patch.date !== undefined && !fullDate(patch.date)) {
        // Partial date: hold it as a draft and keep the saved date until it is complete.
        setDrafts((d) => ({ ...d, [id]: patch.date! }));
        return Promise.resolve();
      }
      return persist((list) =>
        list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    } else if (!pending.some((p) => p.id === id)) {
      // The row has just been saved and the list has not re-rendered yet: patch it in the store.
      return persist((list) =>
        list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    } else {
      // A note still being typed goes with the row when its date completes it.
      const typed = noteDrafts[id];
      const row = {
        ...(pending.find((p) => p.id === id) ?? {
          id,
          matter: "marriage",
          date: "",
        }),
        ...(typed !== undefined && patch.note === undefined
          ? { note: typed.trim() || undefined }
          : {}),
        ...patch,
      };
      if (fullDate(row.date)) {
        setPending((p) => p.filter((x) => x.id !== id));
        return persist((list) =>
          list.some((e) => e.id === row.id)
            ? list.map((e) => (e.id === row.id ? { ...e, ...patch } : e))
            : [...list, row],
        );
      }
      setPending((p) => p.map((x) => (x.id === id ? row : x)));
      if (patch.date !== undefined)
        setDrafts((d) => ({ ...d, [id]: patch.date! }));
      return Promise.resolve();
    }
  };
  const remove = (id: string) => {
    setPending((p) => p.filter((x) => x.id !== id));
    if (events.some((e) => e.id === id))
      void persist((list) => list.filter((e) => e.id !== id));
  };

  return (
    <div className={className} data-testid="life-events">
      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground" lang={locale}>
          {locale === "ml" ? "സംഭവങ്ങളൊന്നും ഇതുവരെ സൂക്ഷിച്ചിട്ടില്ല. ഓർമ്മയിലുള്ള സംഭവങ്ങളും അവയുടെ തീയതികളും ചേർക്കുക; അവ ഈ ഉപകരണത്തിൽ ജാതകത്തോടൊപ്പം സൂക്ഷിക്കുകയും ബാക്കപ്പ് ഫയലിൽ ഉൾപ്പെടുത്തുകയും ചെയ്യും." : <>No events saved yet. Add the dated events the native remembers; they
          are kept with the chart on this device and travel with the backup
          file.</>}
        </p>
      )}
      {rows.length > 0 && (
        <div className="space-y-2" data-testid="life-events-rows">
          {rows.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center gap-2 text-xs"
              data-testid={`life-event-${e.id}`}
            >
              <Select
                value={matterOf(e.matter).id}
                onValueChange={(v) => update(e.id, { matter: v })}
              >
                <SelectTrigger
                  className="h-8 w-auto min-w-56 max-w-full text-xs"
                  data-testid={`select-event-matter-${e.id}`}
                  lang={locale === "ml" && t(matterOf(e.matter).label) === matterOf(e.matter).label ? "en" : locale}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_MATTERS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs" lang={locale === "ml" && t(m.label) === m.label ? "en" : locale}>
                      {t(m.label)}{" "}
                      <span className="text-muted-foreground">
                        ({m.houses.join(", ")})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={drafts[e.id] ?? e.date}
                onChange={(ev) => typeDate(e.id, ev.target.value)}
                onBlur={(ev) => blurDate(e.id, ev.target.value)}
                min="1000-01-01"
                max="2999-12-31"
                className="h-8 w-40 text-xs tabular"
                data-testid={`input-event-date-${e.id}`}
              />
              <details
                className="rounded border px-2 py-1 text-muted-foreground"
              >
                <summary className="cursor-pointer" lang={locale}>
                  {locale === "ml" ? "സമയവും സമയമേഖലയും (നിർബന്ധമല്ല)" : "Time and zone (optional)"}{e.time || e.timezone ? ` · ${e.time ?? (locale === "ml" ? "ഉച്ച" : "noon")}, ${e.timezone ?? chart.timezone}` : ""}
                </summary>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <span lang={locale}>{locale === "ml" ? "സമയം" : "Time"}</span>
                    <Input
                      type="time"
                      aria-label={locale === "ml" ? "സംഭവത്തിന്റെ പ്രാദേശിക സമയം (നിർബന്ധമല്ല)" : "Event local time (optional)"}
                      lang={locale}
                      value={timeDrafts[e.id] ?? e.time ?? ""}
                      onChange={(ev) => setTimeDrafts((d) => ({ ...d, [e.id]: ev.target.value }))}
                      onBlur={(ev) => {
                        void update(e.id, { time: ev.target.value || undefined });
                        setTimeDrafts((d) => { const { [e.id]: _drop, ...rest } = d; return rest; });
                      }}
                      className="h-8 w-32 text-xs tabular"
                      data-testid={`input-event-time-${e.id}`}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <span lang={locale}>{locale === "ml" ? "സമയമേഖല" : "Time zone"}</span>
                    <Input
                      aria-label={locale === "ml" ? "സംഭവത്തിന്റെ സമയമേഖല (നിർബന്ധമല്ല)" : "Event time zone (optional)"}
                      lang={locale}
                      placeholder={chart.timezone}
                      value={zoneDrafts[e.id] ?? e.timezone ?? ""}
                      onChange={(ev) => setZoneDrafts((d) => ({ ...d, [e.id]: ev.target.value }))}
                      onBlur={(ev) => {
                        const zone = ev.target.value.trim();
                        if (zone && !DateTime.now().setZone(zone).isValid) {
                          toast({ title: locale === "ml" ? "തിരിച്ചറിയാത്ത സമയമേഖല" : "Unknown time zone", description: locale === "ml" ? "Asia/Kolkata പോലുള്ള IANA പേര് അല്ലെങ്കിൽ UTC-04:00 പോലുള്ള സ്ഥിരമായ സമയവ്യത്യാസം ഉപയോഗിക്കുക." : "Use an IANA name such as Asia/Kolkata, or a fixed offset such as UTC-04:00.", variant: "destructive" });
                        } else {
                          void update(e.id, { timezone: zone || undefined });
                        }
                        setZoneDrafts((d) => { const { [e.id]: _drop, ...rest } = d; return rest; });
                      }}
                      className="h-8 w-44 text-xs"
                      data-testid={`input-event-timezone-${e.id}`}
                    />
                  </label>
                </div>
              </details>
              <Select
                value={e.outcome ?? NONE}
                onValueChange={(v) =>
                  update(e.id, {
                    outcome: v === NONE ? undefined : (v as EventOutcome),
                  })
                }
              >
                <SelectTrigger
                  className="h-8 w-36 text-xs"
                  data-testid={`select-event-outcome-${e.id}`}
                  lang={locale}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} className="text-xs" lang={locale}>
                    {locale === "ml" ? "വിഷയത്തിന്റെ സാധാരണ ഫലം" : "Outcome as usual"}
                  </SelectItem>
                  {EVENT_OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o} className="text-xs" lang={locale}>
                      {t(OUTCOME_LABEL[o])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={noteDrafts[e.id] ?? e.note ?? ""}
                placeholder={locale === "ml" ? "കുറിപ്പ് (നിർബന്ധമല്ല)" : "Note (optional)"}
                maxLength={300}
                onChange={(ev) => typeNote(e.id, ev.target.value)}
                onBlur={(ev) =>
                  noteDrafts[e.id] !== undefined &&
                  void commitNote(e.id, ev.target.value)
                }
                className="h-8 w-56 text-xs"
                data-testid={`input-event-note-${e.id}`}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => remove(e.id)}
                data-testid={`button-event-remove-${e.id}`}
              >
                <span lang={locale}>{locale === "ml" ? "നീക്കുക" : "Remove"}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={add}
          data-testid="button-event-add"
        >
          <span lang={locale}>{locale === "ml" ? "ഒരു സംഭവം ചേർക്കുക" : "Add an event"}</span>
        </Button>
        {rows.length > 0 && (
          <span className="text-muted-foreground" lang={locale}>
            {locale === "ml" ? <>ടൈപ്പ് ചെയ്യുമ്പോൾ സൂക്ഷിക്കുന്നു; പൂർണ തീയതി നൽകിയാൽ ആ വരി നിലനിർത്തും. “വിഷയത്തിന്റെ സാധാരണ ഫലം” എന്നത് ആ വിഷയത്തിന്റെ സ്വഭാവമാണ് (വിവാഹം അനുകൂലം, രോഗം പ്രതികൂലം). സമയശുദ്ധീകരണവും സ്ഥിരീകരണവും ഐച്ഛികമായ സംഭവസമയവും സമയമേഖലയും ഉപയോഗിക്കുന്നു: സമയം നൽകാതിരുന്നാൽ ഉച്ചയും സമയമേഖല നൽകാതിരുന്നാൽ {chart.timezone}-ഉം ഉപയോഗിക്കുന്നു. തീയതി അടിസ്ഥാനമാക്കിയ മറ്റു പരിശോധനകൾ തീയതി മാത്രം ഉപയോഗിച്ചേക്കാം. സംഭവം മറ്റൊരു സ്ഥലത്തായിരുന്നെങ്കിൽ Asia/Kolkata പോലുള്ള IANA സമയമേഖല ഉപയോഗിക്കുക.</> : <>Saved as you type; a row is kept once it has a full date. "Outcome
            as usual" means the matter's own nature (marriage favourable,
            illness unfavourable). Rectify and Validate use the optional event
            time and time zone: an empty time uses noon; an empty zone uses
            {" "}{chart.timezone}. Other date-based tools may still use the date only.
            Use an IANA zone such as Asia/Kolkata when the event was elsewhere.</>}
          </span>
        )}
      </div>
    </div>
  );
}

/** One-line summary of the saved events, for the chart header. */
export function eventsSummary(events: ChartEvent[], zone: string, locale: Locale = "en"): string {
  if (!events.length) return translate(locale, "none saved");
  return (
    events
      .slice(0, 4)
      .map(
        (e) =>
          `${translate(locale, matterOf(e.matter).label)} ${DateTime.fromISO(e.date, { zone }).setLocale(locale === "ml" ? "ml-IN" : "en").toFormat("LLL yyyy")}`,
      )
      .join(" · ") + (events.length > 4 ? locale === "ml" ? ` · ${events.length - 4} എണ്ണം കൂടി` : ` · ${events.length - 4} more` : "")
  );
}

/** Folded Life events block for the chart page: a summary line that opens into the editor. */
export function LifeEventsSection({ chart }: { chart: Chart }) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const t = useT();
  const events = chart.events ?? [];
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-4 rounded-md border px-3 py-2"
      data-testid="section-life-events"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left text-xs"
          aria-expanded={open}
          data-testid="toggle-life-events"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="font-medium" lang={locale}>
            {t("Life events")}{" "}
            <span className="tabular text-muted-foreground">
              ({events.length})
            </span>
          </span>
          <span
            className="text-muted-foreground"
            data-testid="text-life-events-summary"
          >
            {eventsSummary(events, chart.timezone, locale)}
            {events.length === 0
              ? locale === "ml" ? " · തീയതികൾ ചേർത്താൽ ഓരോ രീതിയുടെയും സമയസൂചനകൾ സംഭവങ്ങളുമായി താരതമ്യം ചെയ്യാം" : " · dated events let Validate read each system's timing against what happened"
              : ""}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3" lang={locale === "ml" ? "en" : undefined}>
        <p className="mb-2 text-xs text-muted-foreground" lang={locale}>
          {locale === "ml" ? "ഓർമ്മയിലുള്ള സംഭവങ്ങളും തീയതികളും. സമയശുദ്ധീകരണം ഇവ ഉപയോഗിച്ച് സാധ്യമായ ജനനസമയങ്ങൾക്ക് സ്കോർ നൽകുന്നു; പ്രവചനങ്ങൾ പരിശോധിക്കാനും ഓരോ ഗ്രഹത്തിന്റെയും കാലഘട്ടങ്ങൾ എങ്ങനെയായിരുന്നെന്ന് കണക്കാക്കാനും ഇവ ഉപയോഗിക്കും." : <>Dated events the native remembers. Rectification scores candidate
          birth times by them; they will also serve to check predictions and to
          tally how each planet's periods turned out.</>}
        </p>
        <LifeEventsEditor chart={chart} />
      </CollapsibleContent>
    </Collapsible>
  );
}
