import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { readingEntryPath, readingRoomChartKey } from "../client/src/lib/reading-entry";

test("the default chart entry follows the chosen language", () => {
  assert.equal(readingEntryPath(17, "en"), "/chart/17/room");
  assert.equal(readingEntryPath(17, "ml"), "/chart/17/reading");
});

test("the room observes edits and invalidation through the existing chart cache", async () => {
  const client = new QueryClient();
  const key = readingRoomChartKey("17");
  client.setQueryData(["chart-result", "17"], { chart: { birthTime: "10:00", events: [] } });
  assert.equal(client.getQueryData<{chart:{birthTime:string}}>(key)?.chart.birthTime, "10:00");
  client.setQueryData(["chart-result", "17"], { chart: { birthTime: "10:15", events: [{ id: "e1" }] } });
  assert.equal(client.getQueryData<{chart:{birthTime:string}}>(key)?.chart.birthTime, "10:15");
  await client.invalidateQueries({ queryKey: ["chart-result", "17"] });
  assert.equal(client.getQueryState(key)?.isInvalidated, true);
  assert.equal(client.getQueryData(["reading-room", "17"]), undefined);
  client.clear();
});
