import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { patchChartEvents } from "../client/src/lib/chart-events-cache";
import type { ChartEvent } from "../shared/events";

test("events saved during a settings calculation survive its older snapshot without cancelling it", async () => {
  const client = new QueryClient();
  const key = ["chart-result", "17"];
  client.setQueryData(key, { chart: { birthTime: "10:00", ayanamsa: "lahiri", events: [] }, result: "old" });
  let complete!: (value: unknown) => void;
  const calculation = client.fetchQuery({ queryKey: key, queryFn: () => new Promise((resolve) => { complete = resolve; }) });
  const first = [{ id: "a", matter: "job", date: "2019-03-04" }] as ChartEvent[];
  const latest = [...first, { id: "b", matter: "marriage", date: "2012-08-09" }] as ChartEvent[];
  let stored = first;
  patchChartEvents(client, 17, first, async () => stored);
  stored = latest;
  patchChartEvents(client, 17, latest, async () => stored);
  assert.deepEqual(client.getQueryData<any>(key).chart.events, latest);
  complete({ chart: { birthTime: "10:15", ayanamsa: "raman", events: [] }, result: "new" });
  await calculation;
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(client.getQueryData(key), { chart: { birthTime: "10:15", ayanamsa: "raman", events: latest }, result: "new" });
  client.clear();
});
