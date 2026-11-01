/** Reproduce the fixed protocol in docs/kp-aurora-validation-protocol.md. */
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { kpPoint, houseOf, computeSignificators, vimshottariLordsAt, NODES_KP, type KpCusp, type KpPlanet } from "@shared/kp";
import { auroraEventEvidence, type AuroraEventEvidence } from "@shared/kp-aurora";
import type { ChartEvent } from "@shared/events";
import { birthInstant, cuspsAt, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { comparisonDate, eventInstant } from "../server/event-time";
import { comparisonSeed, seeded } from "../server/validate";

interface Case {
  chart: InsertChart; birthSource: string; birthQuality: string; alternativeBirthTimes?: string[];
  alternativeWindows?: string[]; excluded?: string;
  events: Array<ChartEvent & { source: string; description: string }>;
}
const cases = (JSON.parse(readFileSync("scripts/fixtures/kp-aurora-fresh-cases.json", "utf8")) as { cases: Case[] }).cases;
const opt = { ayanamsa: "kp", nodeType: "mean" } as const;
type Options = { ayanamsa: string; nodeType: "mean" | "true" };
const millisPerDay = 86_400_000;
const eventPositionCache = new Map<string, ReturnType<typeof positionsLite>>();

function eventMoment(e: ChartEvent, zone: string) { return eventInstant(e.date, e, zone).toUTC(); }
function sky(e: ChartEvent, zone: string, options: Options) {
  const dt = eventMoment(e, zone), iso = dt.toISO()!, key = `${iso}:${options.ayanamsa}:${options.nodeType}`;
  if (!eventPositionCache.has(key)) eventPositionCache.set(key, positionsLite(julianDay(dt), options));
  return { iso, positions: eventPositionCache.get(key)! };
}
function makeFrame(chart: InsertChart, birth: DateTime, options: Options = opt) {
  const jd = julianDay(birth), positions = positionsAt(jd, options);
  const lon = cuspsAt(jd, chart.latitude, chart.longitude, options);
  const cusps: KpCusp[] = lon.map((v, i) => ({ ...kpPoint(v), house: i + 1 }));
  const owners = cusps.map((c) => c.signLord);
  const planets: KpPlanet[] = positions.map((p) => ({ ...kpPoint(p.lon), planet: p.planet, retrograde: p.retrograde,
    house: houseOf(p.lon, lon), owns: NODES_KP.includes(p.planet) ? [] : owners.map((o, i) => o === p.planet ? i + 1 : 0).filter(Boolean) }));
  const significators = computeSignificators(planets);
  const moon = planets.find((p) => p.planet === "Moon")!;
  return { planets, cusps, significators, moon, birth: birth.toISO()!, options };
}
function evaluate(frame: ReturnType<typeof makeFrame>, e: ChartEvent, zone: string): AuroraEventEvidence {
  const t = sky(e, zone, frame.options);
  const lords = vimshottariLordsAt(frame.moon.lon, frame.birth, t.iso);
  const evidence = auroraEventEvidence({ matter: e.matter, planets: frame.planets, cusps: frame.cusps,
    significators: frame.significators, lords, transits: t.positions });
  if (!evidence) throw new Error(`Unsupported matter ${e.matter}`);
  return evidence;
}
const compact = (e: ChartEvent, v: AuroraEventEvidence) => ({ date: e.date, time: e.time ?? "12:00 assumed",
  timezone: e.timezone, matter: e.matter, supported: v.allSupported, passed: v.passed,
  firstUnresolved: v.firstUnresolved, stages: v.layers.map((l) => ({ role: l.role, planet: l.planet, status: l.status, eligible: l.eligible })) });
const score = (frame: ReturnType<typeof makeFrame>, events: ChartEvent[], zone: string) =>
  events.reduce((n, e) => n + (evaluate(frame, e, zone).allSupported ? 1 : 0), 0);

const results = [];
for (const c of cases) {
  const original = insertChartSchema.parse(c.chart);
  const events = [...c.events].sort((a, b) => a.date.localeCompare(b.date));
  const dates = Array.from(new Set(events.map((e) => e.date)));
  const training = events.filter((e) => dates.indexOf(e.date) % 2 === 0);
  const held = events.filter((e) => dates.indexOf(e.date) % 2 === 1);
  const anchors = [original.birthTime, ...(c.alternativeWindows ?? [])];
  process.stderr.write(`Evaluating ${original.name}: ${anchors.length} window(s), ${events.length} dated events\n`);
  const windows = [];
  for (const time of anchors) {
    const birth = birthInstant({ ...original, birthTime: time }).utc;
    const frame = makeFrame(original, birth);
    const reported = events.map((e) => compact(e, evaluate(frame, e, original.timezone)));
    const samples = [];
    for (let offset = -30; offset <= 30; offset += 2) {
      const candidate = birth.plus({ minutes: offset });
      const f = offset === 0 ? frame : makeFrame(original, candidate);
      samples.push({ offsetMinutes: offset, training: score(f, training, original.timezone), frame: f });
    }
    const best = Math.max(...samples.map((s) => s.training));
    const top = samples.filter((s) => s.training === best);
    const varies = new Set(samples.map((s) => s.training)).size > 1;
    const selected = best > 0 && varies && held.length
      ? [...top].sort((a, b) => Math.abs(a.offsetMinutes) - Math.abs(b.offsetMinutes) || a.offsetMinutes - b.offsetMinutes)[0]
      : null;
    let baseline: unknown = null;
    if (events.length >= 2) {
      const days = events.map((e) => DateTime.fromISO(e.date, { zone: "utc" }).toMillis());
      const lo = Math.min(...days), hi = Math.max(...days);
      if (hi - lo >= 365 * millisPerDay) {
        const rnd = seeded(comparisonSeed(events.map((e) => e.date)));
        const draws = Array.from({ length: 200 }, () => events.map((e) => ({ ...e, date: comparisonDate(rnd, lo, hi, e, original.timezone) })));
        const scores = draws.map((es) => score(frame, es, original.timezone));
        baseline = { actual: score(frame, events, original.timezone), mean: scores.reduce((a, b) => a + b, 0) / scores.length,
          trials: scores.length, minimum: Math.min(...scores), maximum: Math.max(...scores) };
      }
    }
    const timeSensitivity = events.filter((e) => !e.time).map((e) => {
      const variants = ["00:00", "12:00", "23:59"].map((time) => evaluate(frame, { ...e, time }, original.timezone));
      const signatures = variants.map((v) => v.layers.map((l) => `${l.planet}:${l.status}:${l.eligible}`).join("|"));
      return { date: e.date, matter: e.matter, stagesChangeAcrossDay: new Set(signatures).size > 1,
        fullChainChangesAcrossDay: new Set(variants.map((v) => v.allSupported)).size > 1 };
    });
    const alternatives = (c.alternativeBirthTimes ?? []).map((alt) => {
      const a = birthInstant({ ...original, birthTime: alt }).utc;
      const f = makeFrame(original, a);
      return { time: alt, training: score(f, training, original.timezone), heldOut: score(f, held, original.timezone) };
    });
    // These are explicitly post-hoc robustness diagnostics, not another
    // independent holdout and not a basis for modifying the frozen rule.
    const signature = (v: AuroraEventEvidence) => v.layers.map((l) => `${l.planet}:${l.status}:${l.eligible}`).join("|");
    const reference = events.map((e) => evaluate(frame, e, original.timezone));
    const sensitivity = [
      { label: "KP true nodes", chart: original, options: { ayanamsa: "kp", nodeType: "true" as const } },
      { label: "Lahiri mean nodes (alternative ayanamsa)", chart: original, options: { ayanamsa: "lahiri", nodeType: "mean" as const } },
      { label: "latitude and longitude +0.05 degrees at fixed birth instant", chart: { ...original, latitude: original.latitude + 0.05, longitude: original.longitude + 0.05 }, options: opt },
      { label: "latitude and longitude -0.05 degrees at fixed birth instant", chart: { ...original, latitude: original.latitude - 0.05, longitude: original.longitude - 0.05 }, options: opt },
    ].map(({ label, chart, options }) => {
      const f = makeFrame(chart, birth, options), alternatives = events.map((e) => evaluate(f, e, original.timezone));
      return { label, fullChains: alternatives.filter((v) => v.allSupported).length,
        stageSignaturesChanged: alternatives.filter((v, i) => signature(v) !== signature(reference[i])).length };
    });
    windows.push({ anchor: time, trainDates: training.map((e) => e.date), heldOutDates: held.map((e) => e.date),
      sampleCount: samples.length, topSampleCount: top.length, topScore: best, anchorScore: score(frame, training, original.timezone),
      varies, selectedOffsetMinutes: selected?.offsetMinutes ?? null,
      heldOutAtAnchor: held.length ? score(frame, held, original.timezone) : null,
      heldOutAtSelected: selected ? score(selected.frame, held, original.timezone) : null,
      baseline, reported, timeSensitivity, alternatives, sensitivity });
  }
  results.push({ name: original.name, birthSource: c.birthSource, birthQuality: c.birthQuality,
    events: events.map(({ id, source, description }) => ({ id, source, description })), excluded: c.excluded, windows });
}
process.stdout.write(JSON.stringify({ protocol: "docs/kp-aurora-validation-protocol.md", results }, null, 2) + "\n");
