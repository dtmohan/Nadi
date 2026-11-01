/** Compare the already-saved event-only result with the public contemporary birth notice. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, julianDay, positionsAt } from "../server/ephemeris";
import { SIGNS, type PlanetPosition } from "../shared/astro";
import { manleyEvidence } from "../shared/manley-evidence";
import { vimshottariPathAt } from "../shared/vimshottari-depth";

type Event = { id: string; matter: string; date: string; timezone: string; startTime: string; endTime: string; role: "input" | "heldout" };
type Person = { name: string; birthDate: string; timezone: string; latitude: number; longitude: number; ayanamsa: string; nodeType: "mean" | "true" };
type Span = { startUtc: string; endUtcExclusive: string; startLocal: string; endLocalExclusive: string };
const searchPath = "docs/royal-event-only-results.json";
const searchBytes = readFileSync(searchPath);
const search = JSON.parse(searchBytes.toString()) as { person: Person; events: Event[]; scan: {
  stage2: { intervals: Span[] }; stage3: { intervals: Span[] } } };
const person = search.person, events = search.events;
const opts = { ayanamsa: person.ayanamsa, nodeType: person.nodeType };
// Contemporary official notice, consulted for comparison, not read by the search.
const reference = DateTime.fromISO(`${person.birthDate}T21:03:00`, { zone: person.timezone });
if (!reference.isValid) throw new Error("Invalid reference time");
const refMs = reference.toUTC().toMillis();
function compare(spans: Span[]) {
  const enriched = spans.map((s) => ({ ...s, startMs: Date.parse(s.startUtc), endMs: Date.parse(s.endUtcExclusive) }));
  const nearest = [...enriched].sort((a, b) => {
    const gap = (x: typeof a) => Math.max(x.startMs - refMs, refMs - x.endMs, 0);
    return gap(a) - gap(b) || a.startMs - b.startMs;
  })[0];
  const gapMs = Math.max(nearest.startMs - refMs, refMs - nearest.endMs, 0);
  return { containsReference: enriched.some((s) => s.startMs <= refMs && refMs < s.endMs),
    touchesPlusMinusFiveMinutes: enriched.some((s) => s.startMs <= refMs + 300_000 && s.endMs >= refMs - 300_000),
    nearestGapSeconds: Math.round(gapMs / 10) / 100,
    nearestInterval: { startLocal: nearest.startLocal, endLocalExclusive: nearest.endLocalExclusive } };
}
const comparisons = { stage2: compare(search.scan.stage2.intervals), stage3: compare(search.scan.stage3.intervals) };

function eventFact(event: Event, birthMs: number, positions: PlanetPosition[], asc: number, moon: PlanetPosition) {
  const from = DateTime.fromISO(`${event.date}T${event.startTime}`, { zone: event.timezone }).toUTC().toMillis();
  const to = DateTime.fromISO(`${event.date}T${event.endTime}`, { zone: event.timezone }).toUTC().toMillis();
  const paths: { lords: string[]; primaryD1: boolean[]; primaryDivision: boolean[]; details: unknown[] }[] = [];
  let cursor = from;
  while (cursor <= to) {
    const path = vimshottariPathAt(moon.lon, birthMs, cursor, 3), p = path.map((x) => x.lord);
    const evidence = manleyEvidence({ label: event.id, date: event.date, matter: event.matter }, positions, asc, [p[0], p[1], p[2]]);
    if (!evidence?.antara) throw new Error(`Missing evidence for ${event.id}`);
    const period = [...evidence.periods, evidence.antara];
    const link = (f: typeof period[number]["frames"][number]) => !!(f.primary.house.length || f.primary.houseLord.length || f.primary.karaka.length);
    paths.push({ lords: p, primaryD1: period.map((p) => link(p.frames[0])), primaryDivision: period.map((p) => link(p.frames[1])),
      details: period.map((p) => ({ planet: p.planet, d1: p.frames[0], division: p.frames[1] })) });
    const next = Math.ceil(path[2].endMs);
    if (next <= cursor) throw new Error("Non-increasing period boundary");
    cursor = next;
  }
  const first = paths.map((x) => x.primaryDivision[0] && x.primaryDivision[1]);
  const third = paths.map((x) => x.primaryDivision[0] && x.primaryDivision[1] && x.primaryDivision[2]);
  return { id: event.id, role: event.role, allFirst: first.every(Boolean), anyFirst: first.some(Boolean),
    allThird: third.every(Boolean), anyThird: third.some(Boolean), paths };
}

function atCandidate(birthMs: number) {
  const birth = DateTime.fromMillis(birthMs, { zone: "utc" }), jd = julianDay(birth);
  const positions = positionsAt(jd, opts), moon = positions.find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Missing Moon");
  const asc = ascendantAt(jd, person.latitude, person.longitude, opts);
  const facts = events.map((e) => eventFact(e, birthMs, positions, asc, moon));
  const controls = events.filter((e) => e.role === "heldout").map((e) => ({ event: e.id,
    shifts: [-180, -120, -60, 60, 120, 180].map((days) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days }).toISODate()!;
      const f = eventFact({ ...e, date }, birthMs, positions, asc, moon);
      return { days, date, allFirst: f.allFirst, allThird: f.allThird };
    }) }));
  return { candidateLocal: birth.setZone(person.timezone).toISO(), natalAscendant: SIGNS[Math.floor(((asc % 360) + 360) % 360 / 30)],
    moonNakshatra: moon.nakshatra, inputFirst: facts.filter((f) => f.role === "input" && f.allFirst).length,
    inputThird: facts.filter((f) => f.role === "input" && f.allThird).length, facts, controls };
}

const earliest = search.scan.stage3.intervals[0];
const nearest = comparisons.stage3.nearestInterval;
const nearestSpan = search.scan.stage3.intervals.find((s) => s.startLocal === nearest.startLocal && s.endLocalExclusive === nearest.endLocalExclusive)!;
const midpoint = (s: Span) => Math.floor((Date.parse(s.startUtc) + Date.parse(s.endUtcExclusive)) / 2);
process.stdout.write(JSON.stringify({ sourceResult: searchPath,
  sourceResultSha256: createHash("sha256").update(searchBytes).digest("hex"),
  referenceSource: "https://www.thegazette.co.uk/London/issue/49027/page/8215/data.pdf",
  referenceLocal: reference.toISO(), comparisons,
  referenceFacts: atCandidate(refMs),
  examples: { earliestTopIntervalMidpoint: atCandidate(midpoint(earliest)),
    nearestTopIntervalMidpointChosenAfterReference: atCandidate(midpoint(nearestSpan)) },
  caution: "Retrospective, non-blind, one-person comparison. Shifted dates are not verified non-events. The nearest example was selected after inspecting the published time. First/third links use an incomplete model." }, null, 2) + "\n");
