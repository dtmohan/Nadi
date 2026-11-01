/** Post-hoc diagnostic of the one unresolved case; not a validation or a rectification. */
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { SIGNS, type PlanetPosition } from "../shared/astro";
import { vimshottariLordsAt } from "../shared/kp";
import { manleyEvidence } from "../shared/manley-evidence";
import { insertChartSchema, type InsertChart } from "../shared/schema";
import { vimshottariPathAt } from "../shared/vimshottari-depth";
import type { ChartEvent } from "../shared/events";

const data = JSON.parse(readFileSync("scripts/fixtures/parashari-divisional-v3-cases.json", "utf8")) as {
  cases: { chart: InsertChart; events: ChartEvent[] }[];
};
const person = data.cases.find((c) => c.chart.name === "Emily Deschanel");
if (!person) throw new Error("Missing public case");
const chart = insertChartSchema.parse(person.chart);
const wedding = person.events.find((e) => e.id === "marriage");
const child = person.events.find((e) => e.id === "henry");
if (!wedding || !child) throw new Error("Missing case events");
const baseMs = birthInstant(chart).utc.toMillis();
const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
const weddingMs = eventInstant(wedding.date, { ...wedding, time: "20:00" }, chart.timezone).toUTC().toMillis();
const childMs = eventInstant(child.date, { ...child, time: "12:00" }, chart.timezone).toUTC().toMillis();

function frame(positions: PlanetPosition[], asc: number, birthIso: string, moon: PlanetPosition, event: ChartEvent, eventMs: number) {
  const lords = vimshottariLordsAt(moon.lon, birthIso, DateTime.fromMillis(eventMs, { zone: "utc" }).toISO()!);
  const evidence = manleyEvidence({ label: event.matter, date: event.date, matter: event.matter }, positions, asc, lords);
  if (!evidence) throw new Error(`Unsupported event: ${event.matter}`);
  const primary = evidence.periods.map(({ frames }) => {
    const p = frames[1].primary;
    return !!(p.house.length || p.houseLord.length || p.karaka.length);
  });
  return { lords: lords.slice(0, 2), primary, both: primary.every(Boolean),
    divisionalAscendant: SIGNS[evidence.periods[0].frames[1].ascendant],
    details: evidence.periods.map((p) => ({ planet: p.planet, D1: p.frames[0], division: p.frames[1] })) };
}

type Sample = { offsetSeconds: number; local: string; sameBirthDate: boolean; nakshatra: string;
  wedding: ReturnType<typeof frame>; child: ReturnType<typeof frame> };
const samples: Sample[] = [];
for (let offsetSeconds = -3 * 3600; offsetSeconds <= 3 * 3600; offsetSeconds += 5) {
  const birth = DateTime.fromMillis(baseMs + offsetSeconds * 1000, { zone: "utc" });
  const jd = julianDay(birth), positions = positionsAt(jd, opts);
  const moon = positions.find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Missing Moon");
  const asc = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const local = birth.setZone(chart.timezone);
  samples.push({ offsetSeconds, local: local.toISO()!, sameBirthDate: local.toISODate() === chart.birthDate,
    nakshatra: moon.nakshatra,
    wedding: frame(positions, asc, birth.toISO()!, moon, wedding, weddingMs),
    child: frame(positions, asc, birth.toISO()!, moon, child, childMs) });
}

function windows(xs: Sample[], condition: (s: Sample) => boolean) {
  const result: { first: string; last: string; firstOffsetSeconds: number; lastOffsetSeconds: number; sampleCount: number }[] = [];
  for (const s of xs.filter(condition)) {
    const last = result.at(-1);
    if (last && s.offsetSeconds === last.lastOffsetSeconds + 5) {
      last.last = s.local; last.lastOffsetSeconds = s.offsetSeconds; last.sampleCount++;
    } else result.push({ first: s.local, last: s.local, firstOffsetSeconds: s.offsetSeconds, lastOffsetSeconds: s.offsetSeconds, sampleCount: 1 });
  }
  return result;
}

const original = samples.filter((s) => Math.abs(s.offsetSeconds) <= 1800);
const actual = samples.find((s) => s.offsetSeconds === 0)!;
const dashaShift = [-10, 0, 10].map((minutes) => {
  const b = DateTime.fromMillis(baseMs + minutes * 60_000, { zone: "utc" });
  const moon = positionsAt(julianDay(b), opts).find((p) => p.planet === "Moon")!;
  const path = vimshottariPathAt(moon.lon, b.toMillis(), weddingMs, 3);
  return { offsetMinutes: minutes, moonNakshatra: moon.nakshatra, lords: path.map((p) => p.lord),
    bhuktiStartUtc: DateTime.fromMillis(path[1].startMs, { zone: "utc" }).toISO(),
    bhuktiEndUtc: DateTime.fromMillis(path[1].endMs, { zone: "utc" }).toISO() };
});
process.stdout.write(JSON.stringify({ subject: chart.name, birthSource: "https://www.astro.com/astro-databank/Deschanel%2C_Emily",
  eventSource: "https://www.cbsnews.com/news/emily-deschanel-and-david-hornsby-tie-the-knot/",
  reportedBirthDate: chart.birthDate, reportedBirthTime: chart.birthTime, birthTimeZone: chart.timezone,
  originalWindow: { sampleStepSeconds: 5, moonNakshatras: Array.from(new Set(original.map((s) => s.nakshatra))),
    weddingLords: Array.from(new Set(original.map((s) => s.wedding.lords.join("/")))),
    weddingD9Ascendants: Array.from(new Set(original.map((s) => s.wedding.divisionalAscendant))),
    matchingWeddingSamples: original.filter((s) => s.wedding.both).length },
  atReported: actual, dashaShift,
  expandedWindow: { hoursEitherSide: 3, sampleStepSeconds: 5,
    sameBirthDateWedding: windows(samples, (s) => s.sameBirthDate && s.wedding.both),
    sameBirthDateWeddingAndChild: windows(samples, (s) => s.sameBirthDate && s.wedding.both && s.child.both),
    otherDateWedding: windows(samples, (s) => !s.sameBirthDate && s.wedding.both) },
  assumptions: "Exploratory post-hoc 5-second sampling; actual wedding clock unknown, 20:00 is only an evening scenario, and child's clock is assumed noon. Other-date samples conflict with the stated birth date. Missing primary links are unresolved under the partial model, not full-method failures. Original birth record not inspected." }, null, 2) + "\n");
