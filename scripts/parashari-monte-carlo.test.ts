import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { vimshottariLordsAt } from "@shared/kp";
import { createManleyEvidenceScorer, manleyEvidence } from "@shared/manley-evidence";
import type { Planet } from "@shared/astro";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseCheck } from "@shared/parashari-promise";
import { parashariSpecificCheck } from "@shared/parashari-specific";
import { parashariDivisionalCheck } from "@shared/parashari-divisional";
import { stagedObservation, type ParashariObservation } from "@shared/parashari-comparison";
import { birthInstant, julianDay, positionsAt, positionsLite, ascendantAt } from "../server/ephemeris";
import { comparisonDate, eventInstant } from "../server/event-time";
import { rectify } from "../server/rectify";
import { comparisonSeed, seeded, validateEvents } from "../server/validate";
import { createParashariEventScorer } from "../server/parashari-event";
import { createParashariHierarchyScorer } from "@shared/parashari-hierarchy";

const chart = {
  name: "Synthetic comparison chart", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean",
} as Parameters<typeof rectify>[0]["chart"];
const options = { ayanamsa: "lahiri", nodeType: "mean" } as const;
const events: ChartEvent[] = [
  { id: "education", matter: "education", date: "2008-03-08", time: "08:15", timezone: "America/Chicago" },
  { id: "marriage", matter: "marriage", date: "2013-03-11", time: "11:15", timezone: "Asia/Kolkata" },
  { id: "child", matter: "child", date: "2016-09-14", time: "14:30", timezone: "America/Los_Angeles" },
  { id: "job", matter: "job", date: "2019-10-04", time: "09:30", timezone: "America/New_York" },
  { id: "mixed-job", matter: "job", date: "2021-06-18", outcome: "unfavourable" },
  { id: "abroad", matter: "abroad", date: "2022-08-09" },
];

/** Recompute with the individual rules, without the cached real/trial scorer. */
function independent(event: ChartEvent, date: string) {
  const birth = birthInstant(chart).utc;
  const birthIso = birth.toISO()!;
  const jd = julianDay(birth);
  const natal = positionsAt(jd, options);
  const lagna = ascendantAt(jd, chart.latitude, chart.longitude, options);
  const instant = eventInstant(date, event, chart.timezone).toUTC();
  const sky = positionsLite(julianDay(instant), options);
  const periods = vimshottariLordsAt(natal.find((p) => p.planet === "Moon")!.lon, birthIso, instant.toISO()!);
  const input = { ...event, label: matterOf(event.matter).label, date, birthTimezone: chart.timezone };
  const varga = parashariVargaEvidence(input, natal, lagna, periods);
  const manley = manleyEvidence(input, natal, lagna, periods);
  const promise = parashariPromiseCheck(varga, event.outcome, natal, sky);
  const specific = parashariSpecificCheck(varga, event.outcome, natal, sky);
  const divisional = parashariDivisionalCheck(specific, manley);
  const hierarchy = createParashariHierarchyScorer(natal, lagna)(manley, event.outcome);
  return { varga, manley, promise, specific, divisional, hierarchy };
}

const observe = (r: ReturnType<typeof independent>): ParashariObservation => ({
  v1: r.promise?.score, v2: r.specific?.score, v3: r.divisional?.score, staged: stagedObservation(r.manley),
  hierarchy: r.hierarchy?.passes, crossTiming: r.hierarchy?.crossChart?.timing,
});

test("Parashari trials independently recompute period lords and transit rules with each event's clock, zone and outcome", () => {
  const result = validateEvents({ ...chart, events });
  const baseline = result.baseline!;
  const comparison = baseline.parashari!;
  const lo = DateTime.fromISO(events[0].date, { zone: "utc" }).toMillis();
  const hi = DateTime.fromISO(events.at(-1)!.date, { zone: "utc" }).toMillis();
  const random = seeded(comparisonSeed(events.map((e) => e.date)));
  const actual = events.map((e) => observe(independent(e, e.date)));
  const trials: ParashariObservation[][] = [];
  const first: ReturnType<typeof independent>[] = [];
  const periodPatterns = new Set<string>();
  const transitPatterns = new Set<string>();
  for (let t = 0; t < baseline.trials; t++) {
    trials.push(events.map((e) => {
      const date = comparisonDate(random, lo, hi, e, chart.timezone);
      const checked = independent(e, date);
      if (t === 0) first.push(checked);
      if (e.id === "marriage") {
        periodPatterns.add(checked.manley!.periods.map((p) => p.planet).join("/"));
        transitPatterns.add(checked.specific!.factors.filter((f) => f.id === "double-transit" || f.id === "vivah-saham")
          .map((f) => String(f.matched)).join("/"));
      }
      return observe(checked);
    }));
  }
  assert.ok(periodPatterns.size > 1, "sample dates should cross period boundaries");
  assert.ok(transitPatterns.size > 1, "sample dates should exercise different transit outcomes");
  for (const version of ["v1", "v2", "v3"] as const) {
    const eligible = actual.flatMap((o, i) => o[version] === undefined ? [] : [i]);
    const total = (set: ParashariObservation[]) => eligible.reduce((sum, i) => sum + set[i][version]!, 0);
    const actualTotal = total(actual);
    const totals = trials.map(total);
    const mean = Math.round(totals.reduce((s, n) => s + n, 0) / totals.length * 10) / 10;
    const percentile = Math.round(100 * (totals.filter((n) => n < actualTotal).length
      + totals.filter((n) => n === actualTotal).length / 2) / totals.length);
    assert.equal(comparison[version]?.actual, actualTotal);
    assert.equal(comparison[version]?.mean, mean);
    assert.equal(comparison[version]?.percentile, percentile);
  }
  const eligible = actual.flatMap((o, i) => o.staged ? [i] : []);
  const firstCount = (set: ParashariObservation[]) => eligible.filter((i) => set[i].staged!.first).length;
  const passed = eligible.filter((i) => actual[i].staged!.first);
  const eventDraws = passed.map((i) => trials.filter((trial) => trial[i].staged!.first));
  assert.equal(comparison.staged?.first.actual, firstCount(actual));
  assert.deepEqual(comparison.staged?.qualifyingDraws, eventDraws.map((d) => d.length));
  if (passed.length && eventDraws.every((d) => d.length)) {
    assert.equal(comparison.staged?.third?.actual, passed.filter((i) => actual[i].staged!.third).length);
    const expected = eventDraws.reduce((sum, draws, n) =>
      sum + draws.filter((trial) => trial[passed[n]].staged!.third).length / draws.length, 0);
    assert.equal(comparison.staged?.third?.mean,
      Math.round(expected * 10) / 10);
  }
  const hierarchyEligible = actual.flatMap((o, i) => o.hierarchy ? [i] : []);
  for (const stage of ["d1", "division", "major", "sub"] as const) {
    const count = (set: ParashariObservation[]) => hierarchyEligible.filter((i) => set[i].hierarchy![stage]).length;
    const expected = trials.reduce((sum, set) => sum + count(set), 0) / trials.length;
    assert.equal(comparison.hierarchy?.[stage].actual, count(actual));
    assert.equal(comparison.hierarchy?.[stage].mean, Math.round(expected * 10) / 10);
  }
  const crossEligible = actual.flatMap((o, i) => o.crossTiming ? [i] : []);
  const crossFirst = (set: ParashariObservation[]) => crossEligible.filter((i) => set[i].crossTiming!.first).length;
  assert.equal(comparison.crossTiming?.first.actual, crossFirst(actual));
  assert.equal(comparison.crossTiming?.first.mean, Math.round(trials.reduce((sum, set) => sum + crossFirst(set), 0) / trials.length * 10) / 10);
  const crossPassed = crossEligible.filter((i) => actual[i].crossTiming!.first);
  assert.deepEqual(comparison.crossTiming?.qualifyingDraws,
    crossPassed.map((i) => trials.filter((trial) => trial[i].crossTiming!.first).length));
  const crossDraws = crossPassed.map((i) => trials.filter((trial) => trial[i].crossTiming!.first));
  if (crossPassed.length && crossDraws.every((d) => d.length)) {
    const expected = crossDraws.reduce((sum, draws, n) =>
      sum + draws.filter((trial) => trial[crossPassed[n]].crossTiming!.third).length / draws.length, 0);
    assert.equal(comparison.crossTiming?.third?.actual, crossPassed.filter((i) => actual[i].crossTiming!.third).length);
    assert.equal(comparison.crossTiming?.third?.mean, Math.round(expected * 10) / 10);
  }
  assert.equal(actual[4].v1, undefined, "unfavourable event is omitted from favourable v1–v3");
  assert.ok(actual[4].staged, "the descriptive staged check still covers this matter");
  assert.equal(baseline.parashariExample!.length, 5, "an unsupported matter is not displayed as a Parashari trial");
  let exampleIndex = 0;
  for (let i = 0; i < events.length; i++) {
    if (actual[i].v1 === undefined && !actual[i].staged) continue;
    const example = baseline.parashariExample![exampleIndex++];
    assert.equal(example.time, events[i].time);
    assert.equal(example.timezone, events[i].timezone);
    assert.deepEqual(example.promise, first[i].promise);
    assert.deepEqual(example.specific, first[i].specific);
    assert.deepEqual(example.divisional, first[i].divisional);
    assert.deepEqual(example.manley, first[i].manley);
    assert.deepEqual(example.hierarchy, first[i].hierarchy);
  }
});

test("both tabs return the same Parashari comparison for the same candidate", () => {
  const requested = events.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, matter: e.matter, date: e.date, time: e.time, timezone: e.timezone,
      outcome: e.outcome, houses: m.houses, cusp: m.cusp, area: m.area };
  });
  const scan = rectify({ chart, windowMinutes: 1, events: requested });
  const candidate = scan.segments.find((s) => s.given && s.selectable)!;
  const validation = validateEvents({ ...chart, birthDate: candidate.midDate ?? chart.birthDate, birthTime: candidate.mid, events });
  assert.deepEqual(candidate.baseline?.parashari, validation.baseline?.parashari);
  assert.deepEqual(candidate.baseline?.parashariExample, validation.baseline?.parashariExample);
  assert.deepEqual(candidate.parashariHierarchy, validation.events.map((e) => e.parashariHierarchy ?? null));
});

test("cached period frames retain the individual event's date, label, clock and zone", () => {
  const birth = birthInstant(chart).utc;
  const jd = julianDay(birth);
  const natal = positionsAt(jd, options);
  const lagna = ascendantAt(jd, chart.latitude, chart.longitude, options);
  const scorer = createParashariEventScorer(natal, lagna, birth.toISO()!, chart.timezone);
  const a = { id: "a", label: "First wedding", matter: "marriage", date: "2013-03-11", time: "09:15", timezone: "Asia/Kolkata" };
  const b = { id: "b", label: "Second wedding", matter: "marriage", date: "2013-03-12", time: "16:30", timezone: "America/Los_Angeles" };
  const run = (e: typeof a) => {
    const instant = eventInstant(e.date, e, chart.timezone).toUTC();
    return scorer(e, e.date, instant.toISO()!, positionsLite(julianDay(instant), options));
  };
  const one = run(a);
  const two = run(b);
  assert.deepEqual(one.manley!.periods.map((p) => p.planet), two.manley!.periods.map((p) => p.planet));
  assert.equal(two.varga?.label, b.label);
  assert.equal(two.varga?.date, b.date);
  assert.equal(two.manley?.label, b.label);
  assert.equal(two.manley?.date, b.date);
  assert.deepEqual(two.manley?.moment, { time: b.time, timeAssumed: false, timezone: b.timezone, timezoneAssumed: false });
  assert.equal(two.promise?.date, b.date);
  assert.equal(two.specific?.label, b.label);
});

test("reused divisional frames match independently rebuilt evidence for every planet and matter", () => {
  const birth = birthInstant(chart).utc, jd = julianDay(birth);
  const natal = positionsAt(jd, options), lagna = ascendantAt(jd, chart.latitude, chart.longitude, options);
  const cached = createManleyEvidenceScorer(natal, lagna);
  const planets: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  for (const matter of ["move", "child", "marriage", "job", "education"]) {
    planets.forEach((p, i) => {
      const event = { label: `${matter} ${i}`, date: `2010-01-${String(i + 1).padStart(2, "0")}`,
        matter, time: i % 2 ? "09:30" : undefined, timezone: "America/Los_Angeles", birthTimezone: chart.timezone };
      const periods: [Planet, Planet, Planet] = [p, planets[(i + 1) % planets.length], planets[(i + 3) % planets.length]];
      assert.deepEqual(cached(event, periods), manleyEvidence(event, natal, lagna, periods), `${matter} ${p}`);
    });
  }
});
