/** Prospective implementation/sensitivity check. Run: node --import tsx scripts/eval-angle-trine.ts */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { parashariNatalConditions } from "@shared/natal-reading-evidence";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import type { EventValidation } from "@shared/validate-types";
import { computeChart } from "../server/routes";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";
import { rectify } from "../server/rectify";

type PublicEvent = ChartEvent & { sources: string[]; clockNote?: string; alternateTimes?: string[]; alternateDates?: string[] };
type PublicCase = { name: string; background: string; birthSource: string; birthQuality: string;
  chart: InsertChart; alternateBirthTimes?: string[]; alternateBirthStandards?: string[]; events: PublicEvent[] };
const fixturePath = "scripts/fixtures/angle-trine-fresh.json", protocol = "docs/angle-trine-fresh-protocol.md";
const cases = (JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: PublicCase[] }).cases;
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const norm = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const old = new Set<string>();
for (const f of readdirSync("scripts/fixtures").filter((f) => f.endsWith(".json") && `scripts/fixtures/${f}` !== fixturePath)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${f}`, "utf8"));
  const rows = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(rows)) for (const row of rows) {
    const name = row?.name ?? row?.chart?.name ?? row?.chartName;
    if (name) old.add(norm(name));
  }
}
const asOf = "2026-11-01T12:00:00Z";
function flags(v: EventValidation) {
  if (!v.manley) throw new Error(`No mapped frame for ${v.id}`);
  const periods = v.manley.periods;
  const pairs = periods.flatMap((period) => period.frames.flatMap((frame) => frame.angleTrinePairs.map((pair) => ({
    level: period.level, planet: period.planet, chart: frame.chart, partner: pair.partner,
    owns: pair.owns, partnerOwns: pair.partnerOwns, links: pair.links,
  }))));
  return { d1: pairs.some((p) => p.chart === "D1"), division: pairs.some((p) => p.chart === v.manley!.division), pairs };
}
function checkNatal(result: ReturnType<typeof computeChart>, v: EventValidation) {
  const topic = parashariNatalConditions(result).find((x) => x.matter === v.matter);
  assert.ok(topic && v.manley, `${v.id}: mapped natal frame`);
  for (const p of [...v.manley.periods, v.manley.antara!])
    assert.deepEqual(topic.planets.find((n) => n.planet === p.planet)?.frames, p.frames, `${v.id}: ${p.level}`);
}
function rectified(chart: InsertChart, event: PublicEvent) {
  const m = matterOf(event.matter);
  const scan = rectify({ chart, windowMinutes: 1, events: [{ ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }] });
  const segment = scan.segments.find((s) => s.given && s.selectable);
  assert.ok(segment, chart.name);
  const candidate = { ...chart, birthDate: segment.midDate ?? chart.birthDate, birthTime: segment.mid };
  const dateReading = topicReading(candidate, event, asOf);
  assert.deepEqual(segment.manley?.[0], dateReading.manley, `${chart.name} rectification frame`);
  return { time: segment.mid, date: segment.midDate ?? chart.birthDate, event: event.id, wholeManleyFrameEqual: true };
}
const results = cases.map((c, i) => {
  if (old.has(norm(c.name))) throw new Error(`Previously used case: ${c.name}`);
  if (c.events.length !== 2) throw new Error(`Expected two events: ${c.name}`);
  process.stderr.write(`Checking ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const natal = computeChart({ ...chart, id: i + 1, gender: chart.gender ?? "unspecified", timeStandard: chart.timeStandard ?? "auto",
    ayanamsa: chart.ayanamsa ?? "lahiri", nodeType: chart.nodeType ?? "mean", sunriseDef: chart.sunriseDef ?? "edge",
    parashariHouseMethod: chart.parashariHouseMethod ?? "rashi", notes: chart.notes ?? "", deathDate: chart.deathDate ?? null,
    timeUncertaintyMin: chart.timeUncertaintyMin ?? 0, events: [] });
  natal.now.asOf = asOf;
  const events = c.events.map((event) => {
    const value = topicReading(chart, event, asOf);
    assert.deepEqual(value, validateEvents({ ...chart, events: [event] }).events[0], `${event.id} chart/Validate`);
    checkNatal(natal, value);
    const controls = [-180, -120, -60, 60, 120, 180].map((offsetDays) => {
      const date = DateTime.fromISO(event.date, { zone: "utc" }).plus({ days: offsetDays }).toISODate()!;
      return { date, offsetDays, ...flags(topicReading(chart, { ...event, date }, asOf)) };
    });
    const alternatives = [
      ...(event.alternateTimes ?? []).map((time) => ({ assumption: `time ${time}`, ...flags(topicReading(chart, { ...event, time }, asOf)) })),
      ...(event.alternateDates ?? []).map((date) => ({ assumption: `date ${date}`, ...flags(topicReading(chart, { ...event, date }, asOf)) })),
    ];
    return { id: event.id, matter: event.matter, date: event.date, localTime: event.time ?? "12:00 assumed",
      timezone: event.timezone, clockNote: event.clockNote, sources: event.sources, natalAndDateEqual: true,
      dateAndValidationEqual: true, actual: flags(value), controls, alternatives };
  });
  const alternateBirths = [
    ...(c.alternateBirthTimes ?? []).map((birthTime) => ({ assumption: `time ${birthTime}`, chart: { ...chart, birthTime } })),
    ...(c.alternateBirthStandards ?? []).map((timeStandard) => ({ assumption: `birth offset ${timeStandard}`, chart: { ...chart, timeStandard } })),
  ].map((a) => ({ assumption: a.assumption, events: c.events.map((e) => ({ id: e.id, ...flags(topicReading(a.chart, e, asOf)) })) }));
  return { name: c.name, background: c.background, birthSource: c.birthSource, birthQuality: c.birthQuality,
    birthInput: `${chart.birthDate} ${chart.birthTime} ${chart.timezone} (${chart.timeStandard})`,
    events, rectification: rectified(chart, c.events[0]), alternateBirths };
});
const files = [protocol, fixturePath, "scripts/eval-angle-trine.ts", "shared/manley-evidence.ts", "shared/parashari-functional.ts",
  "shared/astro.ts", "shared/vargas.ts", "shared/natal-reading-evidence.ts", "shared/parashari-hierarchy.ts", "server/ephemeris.ts", "server/event-time.ts",
  "server/parashari-event.ts", "server/topic-reading.ts", "server/validate.ts", "server/rectify.ts"];
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries(files.map((p) => [p, sha(p)])),
  caveat: "A small convenience sample and date-sensitivity check, not a study of true non-events or birth-time accuracy.", results }, null, 2) + "\n");
