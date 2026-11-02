/** Repeatable synthetic workload for profiling rectification; contains no private charts. */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { insertChartSchema } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { rectify } from "../server/rectify";

const events: ChartEvent[] = [
  { id: "a", matter: "job", date: "2011-06-10", time: "16:00", timezone: "America/Los_Angeles" },
  { id: "b", matter: "marriage", date: "2016-11-19", time: "10:45", timezone: "Asia/Kolkata" },
  { id: "c", matter: "child", date: "2021-05-14", timezone: "America/Los_Angeles" },
];
const chart = insertChartSchema.parse({ name: "Synthetic", gender: "male", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", events });
const eventsForScan = events.map((e) => {
  const m = matterOf(e.matter);
  return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area };
});
const windowMinutes = Number(process.argv[2] ?? 30);
if (![10, 30, 60].includes(windowMinutes)) throw new Error("Choose a 10, 30 or 60 minute half-window");
const includeComparisons = !process.argv.slice(3).includes("--quick");
const start = performance.now();
const result = rectify({ chart, windowMinutes, events: eventsForScan, includeComparisons, judgedAsOf: "2026-10-30T00:00:00.000Z" });
const json = JSON.stringify(result);
const output = process.argv.slice(3).find((arg) => arg !== "--quick");
if (output) writeFileSync(output, json);
console.log(JSON.stringify({ windowMinutes, events: events.length, segments: result.segments.length,
  includeComparisons,
  trials: result.baseline?.trials ?? 0, elapsedSeconds: (performance.now() - start) / 1000,
  responseBytes: Buffer.byteLength(json), sha256: createHash("sha256").update(json).digest("hex") }, null, 2));
