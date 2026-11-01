/** Fixed protocol: docs/parashari-d1-divisional-hierarchy.md. Public fixtures only. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { birthInstant } from "../server/ephemeris";
import { rectify } from "../server/rectify";
import { validateEvents } from "../server/validate";
import { matterOf, type ChartEvent } from "../shared/events";
import { insertChartSchema } from "../shared/schema";
import { hierarchyWindowStages } from "../shared/parashari-hierarchy";

type FixtureEvent = ChartEvent & { sources: string[] };
type Case = { name: string; birthSource: string; birthQuality: string; chart: unknown; events: FixtureEvent[] };
const fixturePath = "scripts/fixtures/parashari-hierarchy-fresh.json";
const protocol = "docs/parashari-d1-divisional-hierarchy.md";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: Case[] };
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const results = [];

for (const c of fixture.cases) {
  const chart = insertChartSchema.parse(c.chart);
  const input = c.events.slice(0, 2);
  const heldout = c.events[2];
  const requested = input.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, matter: e.matter, outcome: e.outcome, date: e.date, time: e.time, timezone: e.timezone,
      houses: m.houses, cusp: m.cusp, area: m.area };
  });
  process.stderr.write(`Evaluating ${chart.name}\n`);
  const scan = rectify({ chart: { ...chart, events: input }, windowMinutes: 30, events: requested });
  const selected = hierarchyWindowStages(requested, scan.segments.map((s) => s.parashariHierarchy ?? []));
  if (selected.unassessed.length) throw new Error(`Unexpected unassessed event in ${chart.name}`);
  const recorded = birthInstant(chart).utc.toMillis();
  const first = Date.parse(scan.segments[0].startIso), last = Date.parse(scan.segments.at(-1)!.endIso);
  const stages = selected.stages.map((stage) => {
    const durations = stage.indices.map((i) => Date.parse(scan.segments[i].endIso) - Date.parse(scan.segments[i].startIso));
    const containsRecorded = stage.indices.some((i) => Date.parse(scan.segments[i].startIso) <= recorded && recorded < Date.parse(scan.segments[i].endIso));
    const touchesFiveMinutes = stage.indices.some((i) => Date.parse(scan.segments[i].startIso) <= recorded + 300_000 && Date.parse(scan.segments[i].endIso) >= recorded - 300_000);
    return { label: stage.label, slices: stage.indices.length,
      coveragePercent: Math.round(10000 * durations.reduce((a, b) => a + b, 0) / (last - first)) / 100,
      containsRecorded, touchesFiveMinutes };
  });
  const runHeldout = (date: string) => {
    const e = { ...heldout, date };
    const v = validateEvents({ ...chart, events: [e] }).events[0].parashariHierarchy;
    if (!v) throw new Error(`Missing holdout for ${chart.name}`);
    return { date, d1: v.d1.status, division: v.divisionCheck.status, passes: v.passes,
      periodLords: v.periods.map((p) => p.planet) };
  };
  const heldoutControls = [-180, -120, -60, 60, 120, 180].map((days) =>
    runHeldout(DateTime.fromISO(heldout.date, { zone: "utc" }).plus({ days }).toISODate()!));
  const sensitivity = c.name === "Monica Bellucci" ? [runHeldout("2010-05-20")] : [];
  const given = scan.segments.find((s) => s.given)!;
  results.push({ name: c.name, birthSource: c.birthSource, birthQuality: c.birthQuality, reportedTime: chart.birthTime,
    input: input.map((e) => ({ id: e.id, date: e.date, sources: e.sources })),
    baselineTrials: scan.baseline?.trials ?? 0, segments: scan.segments.length, stages,
    reportedSample: given.parashariHierarchy?.map((e) => e && ({ d1: e.d1.status, division: e.divisionCheck.status, passes: e.passes })),
    heldout: { ...runHeldout(heldout.date), sources: heldout.sources }, heldoutControls, sensitivity });
}
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries([protocol, fixturePath, "shared/parashari-hierarchy.ts",
  "shared/parashari-houses.ts", "shared/house-view.ts", "shared/astro.ts", "shared/vargas.ts", "shared/kp.ts",
  "shared/manley-evidence.ts", "server/ephemeris.ts", "server/event-time.ts", "server/parashari-event.ts",
  "server/rectify.ts", "server/validate.ts", "scripts/eval-parashari-hierarchy.ts"].map((path) => [path, sha(path)])),
  caveat: "Convenience sample; reported times are uncertain. Only two events filter each scan. Control dates are not known non-events. No result establishes a birth time.", results }, null, 2) + "\n");
