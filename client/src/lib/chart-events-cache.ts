import type { QueryClient } from "@tanstack/react-query";
import type { ChartEvent } from "@shared/events";

/** Patch immediately, then reconcile after an already-running calculation settles.
 * Never cancel that calculation: it may include a newly saved birth time or settings.
 */
export function patchChartEvents(
  client: QueryClient,
  chartId: number,
  events: ChartEvent[],
  readLatest: () => Promise<ChartEvent[] | undefined>,
) {
  const key = ["chart-result", String(chartId)] as const;
  const patch = (latest: ChartEvent[]) => client.setQueryData(key, (old: any) =>
    old ? { ...old, chart: { ...old.chart, events: latest } } : old,
  );
  patch(events);
  const pending = client.getQueryCache().find({ queryKey: key, exact: true })?.promise;
  if (pending) {
    // Several edits can occur during one request, so read the store again instead of
    // replaying the captured list and accidentally undoing a later edit.
    void pending.catch(() => undefined).then(async () => {
      const latest = await readLatest();
      if (latest) patch(latest);
    }).catch(() => undefined);
  }
}
