/** Full local birth-day, event-only demonstration. No recorded birth clock is read. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, julianDay, positionsAt } from "../server/ephemeris";
import { matterOf } from "../shared/events";
import { manleyEvidence } from "../shared/manley-evidence";
import { vimshottariPathAt } from "../shared/vimshottari-depth";

type Event = { id: string; matter: string; date: string; timezone: string; startTime: string; endTime: string;
  role: "input" | "heldout"; description: string; sources: string[] };
type Person = { name: string; birthDate: string; place: string; timezone: string; latitude: number; longitude: number;
  ayanamsa: string; nodeType: "mean" | "true" };
type PathFact = { lords: string[]; primaryD1: boolean[]; primaryDivision: boolean[] };
type Fact = { id: string; matter: string; role: "input" | "heldout"; division: string;
  allFirst: boolean; anyFirst: boolean; allThird: boolean; anyThird: boolean; paths: PathFact[] };
type Row = { start: number; end: number; facts: Fact[] };

const fixturePath = "scripts/fixtures/royal-event-only-case.json";
const protocolPath = "docs/royal-event-only-protocol.md";
const { person, events } = JSON.parse(readFileSync(fixturePath, "utf8")) as { person: Person; events: Event[] };
if ("birthTime" in person) throw new Error("Event-only input must not contain a birth clock");
const opts = { ayanamsa: person.ayanamsa, nodeType: person.nodeType };
const localStart = DateTime.fromISO(`${person.birthDate}T00:00:00`, { zone: person.timezone });
if (!localStart.isValid) throw new Error("Invalid local birth day");
const firstMs = localStart.toUTC().toMillis(), lastMs = localStart.plus({ days: 1 }).toUTC().toMillis();
const eventTimes = events.map((e) => {
  const from = DateTime.fromISO(`${e.date}T${e.startTime}`, { zone: e.timezone });
  const to = DateTime.fromISO(`${e.date}T${e.endTime}`, { zone: e.timezone });
  if (!from.isValid || !to.isValid || from > to) throw new Error(`Invalid event interval: ${e.id}`);
  return { ...e, first: from.toUTC().toMillis(), last: to.toUTC().toMillis() };
});
const round = (n: number) => Math.round(n * 100) / 100;
const utc = (ms: number) => DateTime.fromMillis(ms, { zone: "utc" }).toISO()!;
const local = (ms: number) => DateTime.fromMillis(ms, { zone: "utc" }).setZone(person.timezone).toISO()!;
const hasLink = (p: { house: string[]; houseLord: string[]; karaka: string[] }) => !!(p.house.length || p.houseLord.length || p.karaka.length);

function candidate(birthMs: number): Fact[] {
  const birth = DateTime.fromMillis(birthMs, { zone: "utc" });
  const jd = julianDay(birth), positions = positionsAt(jd, opts);
  const asc = ascendantAt(jd, person.latitude, person.longitude, opts);
  const moon = positions.find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Missing natal Moon");
  return eventTimes.map((e) => {
    const paths: PathFact[] = [];
    let cursor = e.first;
    while (cursor <= e.last) {
      const path = vimshottariPathAt(moon.lon, birthMs, cursor, 3);
      const lords = path.map((x) => x.lord);
      const evidence = manleyEvidence({ label: matterOf(e.matter).label, matter: e.matter, date: e.date,
        time: e.startTime, timezone: e.timezone, birthTimezone: person.timezone }, positions, asc, [lords[0], lords[1], lords[2]]);
      if (!evidence?.antara) throw new Error(`Missing evidence: ${e.id}`);
      const periods = [...evidence.periods, evidence.antara];
      paths.push({ lords, primaryD1: periods.map((p) => hasLink(p.frames[0].primary)),
        primaryDivision: periods.map((p) => hasLink(p.frames[1].primary)) });
      const next = Math.ceil(path[2].endMs);
      if (next <= cursor) throw new Error(`Non-increasing period boundary: ${e.id}`);
      cursor = next;
    }
    const first = paths.map((p) => p.primaryDivision[0] && p.primaryDivision[1]);
    const third = paths.map((p) => p.primaryDivision[0] && p.primaryDivision[1] && p.primaryDivision[2]);
    return { id: e.id, matter: e.matter, role: e.role,
      division: e.matter === "marriage" ? "D9" : e.matter === "child" ? "D7" : "D10",
      allFirst: first.every(Boolean), anyFirst: first.some(Boolean), allThird: third.every(Boolean), anyThird: third.some(Boolean), paths };
  });
}

type Sample = { ms: number; signature: string; facts: Fact[] };
const cache = new Map<number, Sample>();
function sample(ms: number): Sample {
  const old = cache.get(ms);
  if (old) return old;
  const facts = candidate(ms);
  const signature = JSON.stringify(facts.map((f) => [f.allFirst, f.anyFirst, f.allThird, f.anyThird]));
  const value = { ms, signature, facts };
  cache.set(ms, value);
  return value;
}
const boundaries: number[] = [];
function walk(a: Sample, b: Sample): void {
  if (a.signature === b.signature) return;
  if (b.ms - a.ms <= 200) { boundaries.push(b.ms); return; }
  const middle = sample(Math.floor((a.ms + b.ms) / 2));
  walk(a, middle); walk(middle, b);
}
let left = sample(firstMs);
while (left.ms < lastMs) {
  const right = sample(Math.min(lastMs, left.ms + 5000));
  walk(left, right);
  left = right;
}
const bounds = [firstMs, ...Array.from(new Set(boundaries)).sort((a, b) => a - b).filter((x) => x > firstMs && x < lastMs), lastMs];
const rows: Row[] = bounds.slice(0, -1).map((start, i) => ({ start, end: bounds[i + 1], facts: sample(Math.floor((start + bounds[i + 1]) / 2)).facts }));
const inputs = (r: Row) => r.facts.filter((f) => f.role === "input");
const s2 = (r: Row) => inputs(r).filter((f) => f.allFirst).length;
const s3 = (r: Row) => inputs(r).filter((f) => f.allThird).length;
const maxS2 = Math.max(...rows.map(s2));
const top2 = rows.filter((r) => s2(r) === maxS2);
const maxS3 = Math.max(...top2.map(s3));
const top3 = top2.filter((r) => s3(r) === maxS3);

function merged(rowsIn: Row[]) {
  const out: { start: number; end: number }[] = [];
  for (const r of rowsIn) {
    const last = out.at(-1);
    if (last && last.end === r.start) last.end = r.end;
    else out.push({ start: r.start, end: r.end });
  }
  return out;
}
function coverage(rowsIn: Row[]) { return round(100 * rowsIn.reduce((sum, r) => sum + r.end - r.start, 0) / (lastMs - firstMs)); }
function heldoutCoverage(rowsIn: Row[]) {
  const total = rowsIn.reduce((sum, r) => sum + r.end - r.start, 0);
  return eventTimes.filter((e) => e.role === "heldout").map((e) => {
    const weighted = (check: (f: Fact) => boolean) => round(100 * rowsIn.reduce((sum, r) => {
      const f = r.facts.find((x) => x.id === e.id)!;
      return sum + (check(f) ? r.end - r.start : 0);
    }, 0) / total);
    return { id: e.id, firstDefinitePercent: weighted((f) => f.allFirst),
      firstPossiblePercent: weighted((f) => f.anyFirst), thirdDefinitePercent: weighted((f) => f.allThird),
      thirdPossiblePercent: weighted((f) => f.anyThird) };
  });
}
const ranges = (rowsIn: Row[]) => merged(rowsIn).map((r) => ({ startLocal: local(r.start), endLocalExclusive: local(r.end),
  startUtc: utc(r.start), endUtcExclusive: utc(r.end), durationSeconds: round((r.end - r.start) / 1000) }));
const topRanges = merged(top3);
const representatives = topRanges.map((r) => {
  const at = Math.floor((r.start + r.end) / 2);
  return { candidateLocal: local(at), facts: candidate(at) };
});
const hashed = [fixturePath, protocolPath, "scripts/eval-royal-event-only.ts", "shared/vimshottari-depth.ts",
  "shared/manley-evidence.ts", "shared/kp.ts", "shared/vargas.ts", "server/ephemeris.ts"];
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
process.stdout.write(JSON.stringify({ person, events, protocol: protocolPath,
  hashes: Object.fromEntries(hashed.map((p) => [p, sha(p)])),
  caveat: "Retrospective non-blind illustration on a previously studied person. Candidate ranking does not use a birth clock or held-out events. Links are partial and are not calibrated probabilities.",
  birthDay: { localStart: local(firstMs), localEndExclusive: local(lastMs), sampleStepSeconds: 5, detectedBoundaryToleranceMs: 200 },
  scan: { sampleCount: cache.size, segmentCount: rows.length, maximumFirstStageEvents: maxS2, maximumThirdStageEvents: maxS3,
    noFirstStageSupport: maxS2 === 0,
    stage2: { coveragePercent: coverage(top2), intervals: ranges(top2), heldout: heldoutCoverage(top2) },
    stage3: { coveragePercent: coverage(top3), intervals: ranges(top3), heldout: heldoutCoverage(top3) },
    fullDayHeldout: heldoutCoverage(rows), representatives } }, null, 2) + "\n");
