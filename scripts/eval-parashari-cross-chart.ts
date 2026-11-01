/** Descriptive public-case audit fixed in docs/parashari-cross-chart-protocol.md. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { validateEvents } from "../server/validate";
import { insertChartSchema } from "../shared/schema";
import type { ChartEvent } from "../shared/events";

type PublicEvent = ChartEvent & { sources: string[] };
type PublicCase = { name: string; birthSource: string; birthQuality: string; chart: unknown;
  alternateBirthTime?: string; events: PublicEvent[] };
const protocol = "docs/parashari-cross-chart-protocol.md";
const fixturePath = "scripts/fixtures/parashari-cross-chart-fresh.json";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: PublicCase[] };
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const results = [];

for (const c of fixture.cases) {
  const chart = insertChartSchema.parse(c.chart);
  const input = c.events.slice(0, 2), heldout = c.events[2];
  process.stderr.write(`Evaluating ${c.name}\n`);
  const training = validateEvents({ ...chart, events: input });
  const describe = (event: PublicEvent, birthTime = chart.birthTime) => {
    const e = validateEvents({ ...chart, birthTime, events: [event] }).events[0].parashariHierarchy;
    if (!e?.crossChart) throw new Error(`Missing cross-chart evidence for ${c.name}: ${event.date}`);
    return { date: event.date, time: event.time ?? "12:00 assumed", timezone: event.timezone ?? chart.timezone,
      d1House: e.d1.status, divisionHouse: e.divisionCheck.status,
      d1Lord: e.crossChart.planets.find((p) => p.roles.includes("D1 house lord")),
      periodLords: e.crossChart.periods.map((p) => p.planet), timingClues: e.crossChart.timing,
      oldStrictFirst: e.passes.sub };
  };
  const controls = [-180, -120, -60, 60, 120, 180].map((days) => describe({ ...heldout,
    date: DateTime.fromISO(heldout.date, { zone: "utc" }).plus({ days }).toISODate()! }));
  const sensitivity = c.name === "Angelina Jolie" ? [
    describe({ ...heldout, date: "2006-05-27", time: "20:00" }),
    describe({ ...heldout, date: "2006-05-28", time: "01:00" }),
  ] : [];
  const alternateBirth = c.alternateBirthTime ? {
    time: c.alternateBirthTime,
    inputs: input.map((e) => describe(e, c.alternateBirthTime)),
    heldout: describe(heldout, c.alternateBirthTime),
  } : undefined;
  results.push({ name: c.name, birthSource: c.birthSource, birthQuality: c.birthQuality, reportedTime: chart.birthTime,
    input: input.map((e) => ({ ...describe(e), sources: e.sources })), trials: training.baseline?.trials ?? 0,
    crossTimingComparison: training.baseline?.parashari?.crossTiming,
    oldStrictComparison: training.baseline?.parashari?.hierarchy,
    heldout: { ...describe(heldout), sources: heldout.sources }, controls, sensitivity, alternateBirth });
}
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries([protocol, fixturePath, "shared/astro.ts", "shared/vargas.ts",
  "shared/house-view.ts", "shared/parashari-houses.ts", "shared/parashari-varga-evidence.ts", "shared/manley-evidence.ts",
  "shared/parashari-hierarchy.ts", "shared/parashari-comparison.ts", "shared/kp.ts", "server/ephemeris.ts", "server/event-time.ts",
  "server/parashari-event.ts", "server/validate.ts", "scripts/eval-parashari-cross-chart.ts"].map((path) => [path, sha(path)])),
  caveat: "Three public cases and descriptive comparison dates; uncertain birth/event times; no candidate ranking or evidence of predictive accuracy.", results }, null, 2) + "\n");
