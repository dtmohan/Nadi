import { useState } from "react";
import { DateTime } from "luxon";
import { Pencil } from "lucide-react";
import type { Chart } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chartsStore, CHARTS_QUERY_KEY } from "@/lib/charts-store";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocale, useT } from "@/lib/i18n";

/** "14:05" or "14:05:30" for display; the stored value may carry seconds. */
export function fmtBirthTime(t: string): string {
  return /:\d\d:00$/.test(t) ? t.slice(0, 5) : t;
}

/**
 * Change the birth time of a saved chart in place. The chart keeps its id, name and life events;
 * every reading recomputes from the new time. A line is added to the notes so the change is on record.
 */
export async function setBirthTime(
  chart: Chart,
  birthTime: string,
  reason?: string,
): Promise<Chart | undefined> {
  const latest = (await chartsStore.get(chart.id)) ?? chart;
  const stamp = DateTime.now().toFormat("d LLL yyyy");
  const line = `Birth time changed from ${latest.birthTime} to ${birthTime} on ${stamp}${reason ? ` (${reason})` : ""}.`;
  const updated = await chartsStore.update(chart.id, {
    birthTime,
    notes: `${latest.notes ? latest.notes + "\n" : ""}${line}`,
  });
  await queryClient.invalidateQueries({
    queryKey: ["chart-result", String(chart.id)],
  });
  await queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
  return updated;
}

function pad(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

/** Birth details line with an inline editor for the time. */
export function BirthTimeEditor({
  chart,
  birthLocal,
}: {
  chart: Chart;
  birthLocal: DateTime;
}) {
  const { toast } = useToast();
  const { locale } = useLocale();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(pad(chart.birthTime));
  const [saving, setSaving] = useState(false);
  const dirty = value && value !== pad(chart.birthTime);

  const save = async () => {
    if (!/^\d\d:\d\d(:\d\d)?$/.test(value)) {
      toast({
        title: t("Enter a time as HH:MM or HH:MM:SS"),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await setBirthTime(chart, value, "edited on the chart page");
      toast({
        title: t("Birth time updated"),
        description: locale === "ml" ? `${chart.name} എന്ന ജാതകത്തിന് ഇപ്പോൾ ${fmtBirthTime(value)} ആണ് സമയം. എല്ലാ ഭാഗങ്ങളും വീണ്ടും കണക്കാക്കിയിട്ടുണ്ട്.` : `${chart.name} now reads from ${fmtBirthTime(value)}; every tab has been recomputed.`,
      });
      setEditing(false);
    } catch (e: any) {
      toast({
        title: t("Could not change the birth time"),
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <p
        className="tabular mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
        data-testid="text-birth-details"
      >
        <span>
          {(locale === "ml" ? birthLocal.setLocale("ml-IN") : birthLocal).toFormat("d LLLL yyyy")}, {fmtBirthTime(chart.birthTime)}{" "}
          · {chart.place}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground"
          onClick={() => {
            setValue(pad(chart.birthTime));
            setEditing(true);
          }}
          data-testid="button-edit-birth-time"
        >
          <Pencil className="h-3 w-3" /> {t("Edit time")}
        </button>
      </p>
    );
  }

  return (
    <div
      className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      data-testid="birth-time-editor"
    >
      <span className="tabular">{(locale === "ml" ? birthLocal.setLocale("ml-IN") : birthLocal).toFormat("d LLLL yyyy")},</span>
      <Input
        type="time"
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="tabular h-8 w-36 text-sm"
        aria-label={t("Birth time")}
        data-testid="input-edit-birth-time"
      />
      <span className="tabular">· {chart.place}</span>
      <Button
        size="sm"
        className="h-8"
        onClick={save}
        disabled={!dirty || saving}
        data-testid="button-save-birth-time"
      >
        {t(saving ? "Saving…" : "Save time")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8"
        onClick={() => setEditing(false)}
        disabled={saving}
        data-testid="button-cancel-birth-time"
      >
        {t("Cancel")}
      </Button>
      <span className="basis-full text-xs">
        {t("The chart keeps its name and life events; every reading recomputes from the new time, and the change is added to the notes.")}
      </span>
    </div>
  );
}
