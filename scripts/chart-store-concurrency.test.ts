import assert from "node:assert/strict";
import test from "node:test";
import { chartsStore } from "../client/src/lib/charts-store";
import { setBirthTime } from "../client/src/components/birth-time-editor";
import { queryClient } from "../client/src/lib/queryClient";

test("simultaneous event and birth-setting edits preserve both saved changes", async () => {
  const chart = await chartsStore.create({
    name: "Synthetic", birthDate: "1991-02-03", birthTime: "10:00",
    timezone: "UTC", place: "Example", latitude: 0, longitude: 1,
  });
  await Promise.all([
    chartsStore.update(chart.id, { birthTime: "10:15", ayanamsa: "raman" }),
    chartsStore.update(chart.id, { events: [{ id: "e1", matter: "job", date: "2019-03-04" }] }),
  ]);
  const saved = await chartsStore.get(chart.id);
  assert.equal(saved?.birthTime, "10:15");
  assert.equal(saved?.ayanamsa, "raman");
  assert.equal(saved?.events?.[0]?.id, "e1");
  await chartsStore.remove(chart.id);
});

test("concurrent birth-time edits retain each transition in the audit history", async () => {
  const chart = await chartsStore.create({
    name: "Synthetic", birthDate: "1991-02-03", birthTime: "10:00",
    timezone: "UTC", place: "Example", latitude: 0, longitude: 1,
  });
  await Promise.all([setBirthTime(chart, "10:15"), setBirthTime(chart, "10:30")]);
  const saved = await chartsStore.get(chart.id);
  assert.equal(saved?.birthTime, "10:30");
  assert.match(saved?.notes ?? "", /from 10:00 to 10:15/);
  assert.match(saved?.notes ?? "", /from 10:15 to 10:30/);
  await chartsStore.remove(chart.id);
});

test("deleting a chart removes its cached result and cancels an in-flight result", async () => {
  const chart = await chartsStore.create({
    name: "Synthetic", birthDate: "1991-02-03", birthTime: "10:00",
    timezone: "UTC", place: "Example", latitude: 0, longitude: 1,
  });
  const key = ["chart-result", String(chart.id)];
  queryClient.setQueryData(key, { chart, result: "old" });
  let complete!: (value: unknown) => void;
  const pending = queryClient.fetchQuery({ queryKey: key, staleTime: 0, queryFn: () => new Promise((resolve) => { complete = resolve; }) });
  const settled = pending.catch(() => undefined);
  await chartsStore.remove(chart.id);
  complete({ chart, result: "late" });
  await settled;
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.equal(await chartsStore.get(chart.id), undefined);
});
