/** Frozen protocol: docs/pvr-rectification-research-protocol.md. Public cases only. */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { SIGNS } from "../shared/astro";
import { pvrEventEvidence } from "../shared/pvr-event-evidence";
import { insertChartSchema, type InsertChart } from "../shared/schema";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";

type Wedding = { date: string; timezone: string; sources: string[] };
type Case = { name: string; category: string; birthSource: string; birthQuality: string; chart: InsertChart; wedding: Wedding };
const path = "scripts/fixtures/pvr-marriage-fresh.json";
const protocol = "docs/pvr-rectification-research-protocol.md";
const fixture = JSON.parse(readFileSync(path, "utf8")) as { cases: Case[] };
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const oldNames = new Set<string>();
for (const file of readdirSync("scripts/fixtures").filter((p) => p.endsWith(".json") && `scripts/fixtures/${p}` !== path)) {
  const j = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const list = Array.isArray(j) ? j : j.cases ?? j.charts ?? [];
  if (Array.isArray(list)) for (const item of list) {
    const name = item?.name ?? item?.chart?.name ?? item?.chartName;
    if (name) oldNames.add(name);
  }
}

function natalAt(chart: InsertChart, ms: number) {
  const utc = DateTime.fromMillis(ms, { zone: "utc" }), jd = julianDay(utc);
  const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
  return { natal: positionsAt(jd, opts), lagna: ascendantAt(jd, chart.latitude, chart.longitude, opts) };
}

function dayEvidence(chart: InsertChart, birthMs: number, date: string, zone: string) {
  const start = DateTime.fromISO(date, { zone }).startOf("day"), end = start.plus({ days: 1 });
  if (!start.isValid || !end.isValid) throw new Error(`Invalid event date or zone: ${date}, ${zone}`);
  const { natal, lagna } = natalAt(chart, birthMs);
  const portions: Array<{ start: string; end: string; sub: string; clues: string[] }> = [];
  let cursor = start.toMillis();
  while (cursor < end.toMillis()) {
    const e = pvrEventEvidence("marriage", natal, lagna, birthMs, cursor);
    const next = Math.min(end.toMillis(), e.kalachakra.sub.endMs);
    if (next <= cursor) throw new Error("Non-advancing Kalachakra boundary");
    portions.push({ start: DateTime.fromMillis(cursor, { zone }).toISO()!, end: DateTime.fromMillis(next, { zone }).toISO()!,
      sub: SIGNS[e.kalachakra.sub.sign], clues: e.marriageKala!.sub });
    cursor = next;
  }
  return { date, zone, any: portions.some((p) => p.clues.length > 0), all: portions.every((p) => p.clues.length > 0), portions };
}

const results = [];
for (const c of fixture.cases) {
  if (oldNames.has(c.name)) throw new Error(`Previously used public case: ${c.name}`);
  const chart = insertChartSchema.parse(c.chart), center = birthInstant(chart).utc.toMillis();
  const actual = dayEvidence(chart, center, c.wedding.date, c.wedding.timezone);
  const controls = [-180, -120, -60, 60, 120, 180].map((days) => {
    const date = DateTime.fromISO(c.wedding.date, { zone: c.wedding.timezone }).plus({ days }).toISODate()!;
    return { offsetDays: days, ...dayEvidence(chart, center, date, c.wedding.timezone) };
  });
  let any = 0, all = 0;
  for (let seconds = -1800; seconds < 1800; seconds += 30) {
    const day = dayEvidence(chart, center + seconds * 1000, c.wedding.date, c.wedding.timezone);
    any += Number(day.any); all += Number(day.all);
  }
  results.push({ name: c.name, category: c.category, birthSource: c.birthSource, birthQuality: c.birthQuality,
    reportedBirthTime: chart.birthTime, eventSources: c.wedding.sources, actual, controls,
    scan: { samples: 120, spacingSeconds: 30, anySamples: any, allSamples: all,
      anyPercent: Math.round(any / 120 * 10000) / 100, allPercent: Math.round(all / 120 * 10000) / 100 } });
  process.stderr.write(`Evaluated ${c.name}\n`);
}
const hashed = [protocol, path, "scripts/eval-pvr-marriage.ts", "shared/pvr-event-evidence.ts", "shared/pvr-kalachakra.ts",
  "shared/vimshottari-depth.ts", "shared/vargas.ts", "shared/astro.ts", "shared/kalachakra.ts", "server/ephemeris.ts"];
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries(hashed.map((p) => [p, sha(p)])),
  caveat: "Exploratory source-inspired subset, not the complete PVR method, a probability or a birth-time estimate. Nearby dates are not verified non-events.", results }, null, 2) + "\n");
