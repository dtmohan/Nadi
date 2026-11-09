import assert from "node:assert/strict";
import test from "node:test";

test("concurrent initial reads share one load, and a failed load can be retried", async () => {
  let saved = [{ id: 7, name: "Synthetic", birthDate: "1991-02-03", birthTime: "10:00", timezone: "UTC", place: "Example", latitude: 0, longitude: 1, events: [] }];
  let calls = 0;
  let release!: () => void;
  let started!: () => void;
  const loadStarted = new Promise<void>((resolve) => { started = resolve; });
  globalThis.caches = { open: async () => ({
    match: async () => {
      calls++;
      if (calls === 1) throw new Error("temporary storage error");
      const snapshot = JSON.stringify(saved);
      started();
      return await new Promise<Response>((resolve) => { release = () => resolve(new Response(snapshot)); });
    },
    put: async (_key: string, response: Response) => { saved = await response.json(); },
  }) } as unknown as CacheStorage;
  const { chartsStore } = await import("../client/src/lib/charts-store");
  await assert.rejects(chartsStore.get(7), /temporary storage error/);
  const update = chartsStore.update(7, { birthTime: "11:00" });
  await loadStarted;
  const concurrent = chartsStore.get(7);
  await Promise.resolve();
  assert.equal(calls, 2, "both callers must share the retry load");
  release();
  await Promise.all([update, concurrent]);
  assert.equal(saved[0].birthTime, "11:00");
  assert.equal((await chartsStore.get(7))?.birthTime, "11:00");
});
