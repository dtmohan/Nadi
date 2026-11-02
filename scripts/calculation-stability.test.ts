import assert from "node:assert/strict";
import test from "node:test";
import { DateTime, Settings } from "luxon";
import { alpLonAt, alpPointAt } from "@shared/alp";
import { matterOf } from "@shared/events";
import { insertChartSchema, type Chart } from "@shared/schema";
import { ascendantAt, julianDay, planetLonAt } from "../server/ephemeris";
import { rectify } from "../server/rectify";
import { computeChart } from "../server/routes";
import { validateEvents } from "../server/validate";

test("Julian day uses the instant rather than the caller's wall-clock fields", () => {
  const utc = DateTime.fromISO("2000-01-01T12:00:00Z", { zone: "utc" });
  // Swiss returns UT1; its difference from UTC is less than one second here.
  assert.ok(Math.abs(julianDay(utc) - 2451545) < 1 / 86400);
  for (const zone of ["America/Los_Angeles", "Asia/Kolkata", "Pacific/Auckland"]) {
    assert.equal(julianDay(utc.setZone(zone)), julianDay(utc), zone);
  }
  assert.throws(() => julianDay(DateTime.invalid("test")), /Invalid instant/);
});

test("the natal Moon can move substantially within a half-hour birth window", () => {
  const first = DateTime.fromISO("1990-01-01T06:30:00Z", { zone: "utc" });
  const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
  const a = planetLonAt("Moon", julianDay(first), opts).lon;
  const b = planetLonAt("Moon", julianDay(first.plus({ minutes: 30 })), opts).lon;
  const movement = (b - a + 360) % 360;
  assert.ok(movement > 0.2 && movement < 0.35, `30-minute Moon movement ${movement}°`);
});

test("a marriage scan splits the actual-event ALP pada change that fell inside an older interval", () => {
  const chart = { name: "Synthetic ALP boundary", birthDate: "1990-01-01", birthTime: "12:00",
    timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
    ayanamsa: "lahiri", nodeType: "mean" } as Parameters<typeof rectify>[0]["chart"];
  const m = matterOf("marriage");
  const event = { label: m.label, matter: "marriage", date: "2016-11-19", houses: m.houses, cusp: m.cusp, area: m.area };
  const scan = rectify({ chart, windowMinutes: 30, includeComparisons: false, events: [event], judgedAsOf: "2026-10-01T00:00:00Z" });
  const when = DateTime.fromISO("2016-11-19T12:00:00", { zone: chart.timezone }).toUTC();
  const frame = (ms: number) => {
    const birth = DateTime.fromMillis(ms, { zone: "utc" });
    const lagna = ascendantAt(julianDay(birth), chart.latitude, chart.longitude, { ayanamsa: "lahiri", nodeType: "mean" });
    const point = alpPointAt(alpLonAt(lagna, birth, when));
    const janma = Math.floor(lagna / 30);
    return { sign: point.signIndex, pada: point.pada, navamsa: point.navamsaSign,
      matches: [point.signIndex, (point.signIndex + 6) % 12, janma, (janma + 6) % 12].includes(point.navamsaSign) };
  };
  const matches = new Set<boolean>();
  for (const segment of scan.segments) {
    const start = Date.parse(segment.startIso), end = Date.parse(segment.endIso);
    if (end - start < 2500) continue; // rendered endpoints are rounded to seconds
    const first = frame(start + 1000), last = frame(end - 1000);
    assert.deepEqual(first, last, `${segment.start}–${segment.end}`);
    matches.add(first.matches);
    assert.equal(segment.events[0].alp?.findings.some((f) => f.finding.ruleId === "b2-marriage-navamsa-touches"), first.matches);
  }
  assert.deepEqual(matches, new Set([true, false]));
});

test("missing daily sunrise leaves solar-dependent readings unavailable without inventing them", () => {
  const originalNow = Settings.now;
  Settings.now = () => Date.parse("2026-10-01T12:00:00Z");
  try {
    // At 66.2°N Placidus is available for this instant, but the Sun does not
    // rise on the selected day under the default atmospheric convention.
    const chart = insertChartSchema.parse({ name: "Synthetic Arctic", gender: "male", birthDate: "1990-06-21", birthTime: "14:00",
      timezone: "Europe/Oslo", place: "Norway", latitude: 66.2, longitude: 18.9553, ayanamsa: "lahiri", nodeType: "mean",
      events: [{ id: "marriage", matter: "marriage", date: "2016-11-19" }] });
    const result = computeChart({ ...chart, id: 0 } as Chart);
    assert.equal(result.gulika, undefined);
    assert.equal(result.panchanga, undefined);
    assert.equal(result.shadbala, undefined);
    assert.ok(result.kp.cusps.length === 12 && result.positions.length === 9);
    const validation = validateEvents(chart, "2026-10-01T12:00:00Z");
    assert.equal(validation.events[0].additionalNatal?.prasna.gulika, undefined);
    const m = matterOf("marriage");
    const event = { label: m.label, matter: "marriage", date: "2016-11-19", houses: m.houses, cusp: m.cusp, area: m.area };
    const scan = rectify({ chart, events: [event], windowMinutes: 1, includeComparisons: false, judgedAsOf: "2026-10-01T12:00:00Z" });
    assert.ok(scan.segments.length > 0);
    assert.equal(scan.segments[0].events[0].additionalNatal?.prasna.gulika, undefined);
    const polar = { ...chart, latitude: 69.6492 };
    assert.throws(() => computeChart({ ...polar, id: 0 } as Chart), /Placidus houses are unavailable/);
    assert.throws(() => validateEvents(polar, "2026-10-01T12:00:00Z"), /Placidus houses are unavailable/);
    assert.throws(() => rectify({ chart: polar, events: [event], windowMinutes: 1, judgedAsOf: "2026-10-01T12:00:00Z" }), /Placidus houses are unavailable/);
  } finally { Settings.now = originalNow; }
});
