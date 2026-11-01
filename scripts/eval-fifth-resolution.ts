/** Post-hoc illustration of fifth-level birth-time sensitivity, not a rectification. */
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { birthInstant, julianDay, positionsAt } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { insertChartSchema, type InsertChart } from "../shared/schema";
import { vimshottariPathAt } from "../shared/vimshottari-depth";
import type { ChartEvent } from "../shared/events";

const fixture = JSON.parse(readFileSync("scripts/fixtures/parashari-third-period-fresh-cases.json", "utf8")) as {
  cases: { chart: InsertChart; events: ChartEvent[] }[];
};
const subject = fixture.cases.find((c) => c.chart.name === "Audrey Hepburn");
if (!subject) throw new Error("Missing source case");
const event = subject.events.find((e) => e.id === "wedding2");
if (!event?.time) throw new Error("Missing stated event clock");
const chart = insertChartSchema.parse(subject.chart);
const reportedMs = birthInstant(chart).utc.toMillis();
const eventMs = eventInstant(event.date, event, chart.timezone).toUTC().toMillis();
const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
const samples = Array.from({ length: 61 }, (_, i) => {
  const offsetSeconds = i - 30;
  const birthMs = reportedMs + offsetSeconds * 1000;
  const jd = julianDay(DateTime.fromMillis(birthMs, { zone: "utc" }));
  const moon = positionsAt(jd, opts).find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Missing Moon");
  return { offsetSeconds, fifthLord: vimshottariPathAt(moon.lon, birthMs, eventMs, 5)[4].lord };
});
const changes = samples.slice(1).filter((s, i) => s.fifthLord !== samples[i].fifthLord).length;
const distinctLords = Array.from(new Set(samples.map((s) => s.fifthLord)));
process.stdout.write(JSON.stringify({ sourceCase: chart.name, event: `${event.date}|${event.matter}`,
  eventClock: event.time, timezone: event.timezone ?? chart.timezone, rangeSeconds: [-30, 30],
  sampleStepSeconds: 1, changesBetweenSamples: changes, distinctLords, samples,
  caveat: "Post-hoc illustration only; one-second sampling can itself miss changes, and event/birth clocks and year convention are uncertain." }, null, 2) + "\n");
