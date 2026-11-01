/**
 * Explore a private chart without putting it in the repository.
 * Usage: node --import tsx scripts/research-pvr-candidates.ts /private/tmp/case.json
 * The input contains { chart, scan: {start, end, stepSeconds}, events }, where
 * each event has id, matter, date, timezone, optional endDate, time and
 * marginMinutes. Date-only spans cover the full local day(s); an exact time
 * has a one-millisecond span. Output is JSON; redirect it to a private path.
 */
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { SIGNS } from "../shared/astro";
import { pvrEventEvidence, type PvrD24Variant, type PvrMatter } from "../shared/pvr-event-evidence";
import { insertChartSchema } from "../shared/schema";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";

interface Event {
  id: string;
  matter: PvrMatter;
  date: string;
  /** Inclusive final calendar day for month-precision events. */
  endDate?: string;
  timezone: string;
  time?: string;
  marginMinutes?: number;
}
type Input = { chart: unknown; scan: { start: string; end: string; stepSeconds?: number }; events: Event[] };
const file = process.argv[2];
if (!file) throw new Error("Provide a private input file path");
const input = JSON.parse(readFileSync(file, "utf8")) as Input;
const chart = insertChartSchema.parse(input.chart);
const start = birthInstant({ ...chart, birthTime: input.scan.start }).utc.toMillis();
const end = birthInstant({ ...chart, birthTime: input.scan.end }).utc.toMillis();
const step = (input.scan.stepSeconds ?? 30) * 1000;
if (!(step >= 1000 && end >= start && (end - start) / step <= 3000)) throw new RangeError("Invalid or too large scan");
const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };

function eventSpan(e: Event) {
  const date = DateTime.fromISO(e.date, { zone: e.timezone });
  if (!date.isValid) throw new Error(`Invalid event date/zone: ${e.id}`);
  if (e.time && e.endDate) throw new Error(`Cannot combine a clock with a multi-day range: ${e.id}`);
  if (e.time) {
    const middle = DateTime.fromISO(`${e.date}T${e.time}`, { zone: e.timezone });
    const margin = e.marginMinutes ?? 0;
    if (!middle.isValid || margin < 0) throw new Error(`Invalid event time: ${e.id}`);
    return [middle.minus({ minutes: margin }).toMillis(), middle.plus({ minutes: margin }).toMillis() + 1] as const;
  }
  const last = DateTime.fromISO(e.endDate ?? e.date, { zone: e.timezone });
  if (!last.isValid || last < date) throw new Error(`Invalid event end date: ${e.id}`);
  return [date.startOf("day").toMillis(), last.startOf("day").plus({ days: 1 }).toMillis()] as const;
}
const spans = input.events.map(eventSpan);
const samples = [];
for (let birth = start; birth <= end; birth += step) {
  const utc = DateTime.fromMillis(birth, { zone: "utc" }), jd = julianDay(utc);
  const natal = positionsAt(jd, opts), lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const events = input.events.map((event, index) => {
    const [rangeStart, rangeEnd] = spans[index];
    const variants: PvrD24Variant[] = event.matter === "education"
      ? ["book-2000-forward", "article-2013-reverse-even"] : ["book-2000-forward"];
    const result = variants.map((variant) => {
      let cursor = rangeStart;
      const intervals = [];
      while (cursor < rangeEnd) {
        const evidence = pvrEventEvidence(event.matter, natal, lagna, birth, cursor, variant);
        const next = Math.min(rangeEnd, evidence.kalachakra.sub.endMs, ...evidence.vimshottari.map((p) => p.endMs));
        if (next <= cursor) throw new Error(`Non-advancing period for ${event.id}`);
        const f = evidence.divisionFrame;
        intervals.push({ start: DateTime.fromMillis(cursor, { zone: event.timezone }).toISO(),
          end: DateTime.fromMillis(next, { zone: event.timezone }).toISO(),
          d1: { ascendant: SIGNS[evidence.d1.ascendant], house: evidence.d1.matterHouse,
            lord: evidence.d1.houseLord, periods: evidence.d1.periods },
          division: { chart: f.division, ascendant: SIGNS[f.ascendant], house: f.matterHouse,
            houseSign: SIGNS[f.houseSign], lord: f.houseLord,
            arudhaLagna: f.arudhaLagna === undefined ? undefined : SIGNS[f.arudhaLagna],
            signs: Object.fromEntries(Object.entries(f.signs).map(([p, s]) => [p, SIGNS[s]])),
            periods: f.periods.map((p) => ({ ...p, sign: SIGNS[p.sign] })) },
          kalachakra: { major: SIGNS[evidence.kalachakra.major.sign], sub: SIGNS[evidence.kalachakra.sub.sign],
            marriageClues: evidence.marriageKala },
        });
        cursor = next;
      }
      return { variant, intervals };
    });
    return { id: event.id, matter: event.matter, date: event.date, endDate: event.endDate, timezone: event.timezone,
      time: event.time, marginMinutes: event.marginMinutes, variants: result };
  });
  samples.push({ birth: utc.setZone(chart.timezone).toFormat("yyyy-LL-dd HH:mm:ss"), lagna: SIGNS[Math.floor(lagna / 30)], events });
}
process.stdout.write(JSON.stringify({ caveat: "Partial PVR-inspired descriptive clues, not an event promise or rectified time. Sampling can miss shorter candidate intervals.",
  scan: input.scan, samples }, null, 2) + "\n");
