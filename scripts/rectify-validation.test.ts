import { test } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";
import { matterOf, type ChartEvent } from "@shared/events";
import { computeSignificators, houseOf, kpPoint, vimshottariLordsAt, NODES_KP, type KpPlanet } from "@shared/kp";
import { drishtiQuarters } from "@shared/astro";
import { baselineFor, groupNemaniSegments, highlightedCandidates, methodScore, rawScoreCoverage, RECTIFY_METHODS } from "@shared/rectify-methods";
import { buildReport } from "@shared/report";
import { birthInstant, julianDay, utcAtJulianDay, positionsAt, positionsLite, cuspsAt, ascendantAt, planetLonAt } from "../server/ephemeris";
import { comparisonDate, eventAtNoon, eventInstant } from "../server/event-time";
import { kundaD81Check, scanKundaD81 } from "../server/kunda";
import { kundaCheck, rectify } from "../server/rectify";
import { comparisonSeed, seeded, validateEvents } from "../server/validate";
import { kpTransitEvidence } from "@shared/kp-transit-evidence";
import { nemaniRpMoonCheck } from "@shared/kp-nemani-rp";
import { vargaSignAt, vargaTopicFor } from "@shared/parashari-varga-evidence";
import { manleyEvidence, manleyTopicFor } from "@shared/manley-evidence";
import { parashariDivisionalCheck } from "@shared/parashari-divisional";
import type { ParashariSpecificCheck } from "@shared/parashari-specific";
import { parashariPromiseCheck } from "@shared/parashari-promise";
import { parashariSpecificCheck } from "@shared/parashari-specific";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { computeVargas } from "@shared/vargas";
import { computeChart } from "../server/routes";
import { scanVargaWindows, MANLEY_WINDOW_DIVISIONS } from "../server/varga-windows";

const chart = {
  name: "Synthetic test chart", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean",
} as Parameters<typeof rectify>[0]["chart"];
const kpOpts = { ayanamsa: "kp", nodeType: "mean" } as const;
const chartOpts = { ayanamsa: "lahiri", nodeType: "mean" } as const;

test("Nemani RP Moon uses the judgment chart and reproduces the book's first and third examples", () => {
  // The supplied Kindle edition, ch. 4, locations 341–390, gives both the judgment
  // instants and the three candidate ascendant lords. This checks the method's
  // calculation, not the historical birth-time accuracy of these examples.
  const asc = { signLord: "Mercury", starLord: "Rahu", subLord: "Rahu" } as const;
  const check = (utc: string) => {
    const sky = positionsAt(julianDay(DateTime.fromISO(utc, { setZone: true })), kpOpts);
    const p = kpPoint(sky.find((x) => x.planet === "Moon")!.lon);
    const moon = { signLord: p.signLord, starLord: p.starLord, subLord: p.subLord };
    return nemaniRpMoonCheck(asc, moon, sky);
  };
  const first = check("2007-09-10T02:35:22Z");
  assert.deepEqual(first.moon, { signLord: "Sun", starLord: "Ketu", subLord: "Rahu" });
  assert.deepEqual(first.linked, { sign: true, star: true, sub: true });
  assert.match(first.via.sign, /Sun.*Venus.*Mercury/);
  assert.match(first.via.star, /Ketu.*Mercury.*Rahu/);
  assert.equal(first.all, true);

  const third = check("2007-09-12T11:43:12Z");
  assert.deepEqual(third.moon, { signLord: "Mercury", starLord: "Sun", subLord: "Mercury" });
  assert.equal(third.linked.sign, true);
  assert.equal(third.linked.star, false);
  assert.equal(third.all, false);
});

test("Kunda D81 retains full longitude precision for examples in the supplied book", () => {
  const lon = (sign: number, degrees: number, minutes: number, seconds: number) =>
    sign * 30 + degrees + minutes / 60 + seconds / 3600;
  // Nehru's two software longitudes from the book (Cancer = sign 3).
  const before = kundaD81Check(lon(3, 28, 18, 17.07), lon(3, 18, 5, 39.31));
  const after = kundaD81Check(lon(3, 28, 24, 51.96), lon(3, 18, 5, 54.21));
  assert.equal(before.trine, false);
  assert.equal(after.trine, true);
  assert.ok(Math.abs(before.remainder - (222 + 41 / 60 + 2.8 / 3600)) < 0.001);
  assert.ok(Math.abs(after.remainder - (231 + 34 / 60 + 8.67 / 3600)) < 0.001);

  // The book prints 148.05° as Purva Phalguni in the Indira Gandhi example;
  // 148.05° is in Uttara Phalguni, an accepted trine for its stated birth star.
  const indira = kundaD81Check(lon(3, 27, 23, 31), 270);
  assert.equal(indira.kundaNakshatra, 11);
  assert.equal(indira.trine, true);
});

test("report recomputation preserves the original judgment instant and Nemani links", () => {
  const judgedAsOf = "2007-09-10T02:35:22.000Z";
  const request = {
    chart,
    windowMinutes: 10,
    events: [],
    judge: { latitude: 44.8897, longitude: -93.3497, timezone: "America/Chicago", label: "Minnesota" },
    judgedAsOf,
  };
  const first = rectify(request);
  const exported = rectify(request);
  assert.equal(first.ruling.asOf, judgedAsOf);
  assert.equal(exported.ruling.asOf, judgedAsOf);
  assert.deepEqual(exported.ruling.moon, first.ruling.moon);
  assert.deepEqual(exported.segments.map((s) => s.nemani), first.segments.map((s) => s.nemani));
  const groups = groupNemaniSegments(first.segments);
  assert.ok(groups.length < first.segments.length);
  assert.equal(groups[0].first.startIso, first.segments[0].startIso);
  assert.equal(groups.at(-1)!.last.endIso, first.segments.at(-1)!.endIso);
  assert.equal(groups.filter((g) => g.given).length, 1);
  const duration = (start: string, end: string) => Date.parse(end) - Date.parse(start);
  assert.equal(
    groups.filter((g) => g.first.nemani?.all).reduce((n, g) => n + duration(g.first.startIso, g.last.endIso), 0),
    first.segments.filter((s) => s.nemani?.all).reduce((n, s) => n + duration(s.startIso, s.endIso), 0),
  );

  const fullChart = { ...chart, id: 0, gender: "male", timeStandard: "auto", ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };
  const state = { method: "kp-nemani-rp" as const, windowMinutes: request.windowMinutes, events: [], judge: request.judge, judgedAsOf, confirmedMarks: [] };
  const report = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: exported, state } } });
  const section = report.sections.find((s) => s.id === "rectify")!;
  const table = section.paras.find((p) => p.kind === "table" && p.head?.includes("Connections"));
  assert.equal(table?.rows?.length, groups.length);
  assert.ok(section.paras.some((p) => p.text?.includes("9 Sep 2007 21:35:22")));
});

test("top-score coverage uses elapsed duration, including intervals crossing midnight", () => {
  const result = rawScoreCoverage([
    { score: 3, startIso: "2024-01-01T23:58:00Z", endIso: "2024-01-02T00:00:00Z", given: false },
    { score: 1, startIso: "2024-01-02T00:00:00Z", endIso: "2024-01-02T00:03:00Z", given: true },
    { score: 3, startIso: "2024-01-02T00:03:00Z", endIso: "2024-01-02T00:04:00Z", given: false },
  ]);
  assert.deepEqual(result, { top: 3, percent: 50, recorded: 1 });
  assert.equal(rawScoreCoverage([]), undefined);
});

test("date-only events share local noon, including daylight-saving changes", () => {
  assert.equal(eventAtNoon("2024-03-10", "America/New_York").toUTC().toISO(), "2024-03-10T16:00:00.000Z");
  assert.equal(eventAtNoon("2024-01-10", "America/New_York").toUTC().toISO(), "2024-01-10T17:00:00.000Z");
  assert.throws(() => eventAtNoon("not-a-date", "UTC"));
});

test("event times use their own zone and reject daylight-saving gaps or ambiguous times", () => {
  assert.equal(eventInstant("1992-10-03", { time: "10:30", timezone: "America/Chicago" }, "Pacific/Honolulu").toUTC().toISO(), "1992-10-03T15:30:00.000Z");
  assert.equal(eventInstant("1992-10-03", { timezone: "America/Chicago" }, "Pacific/Honolulu").toUTC().toISO(), "1992-10-03T17:00:00.000Z");
  assert.throws(() => eventInstant("2024-03-10", { time: "02:30", timezone: "America/New_York" }, "UTC"), /nonexistent/);
  assert.throws(() => eventInstant("2024-11-03", { time: "01:30", timezone: "America/New_York" }, "UTC"), /Ambiguous/);
  assert.equal(eventInstant("2024-11-03", { time: "01:30", timezone: "UTC-04:00" }, "UTC").toUTC().toISO(), "2024-11-03T05:30:00.000Z");
});

test("comparison dates redraw an ambiguous local clock time", () => {
  const lo = DateTime.fromISO("2024-11-03T00:00:00Z", { setZone: true }).toMillis();
  const hi = lo + 2 * 86400000;
  const draws = [0, 0.75];
  const date = comparisonDate(() => draws.shift()!, lo, hi, { time: "01:30", timezone: "America/New_York" }, "UTC");
  assert.equal(date, "2024-11-04");
  assert.equal(draws.length, 0);
});

test("timing windows use the event instant when an ingress occurs during the day", () => {
  // Jupiter enters sidereal Aries on 8 May 2011 at about 14:14 in India.
  const events: ChartEvent[] = [
    { id: "before", matter: "marriage", date: "2011-05-08", time: "12:00", timezone: "Asia/Kolkata" },
    { id: "after", matter: "marriage", date: "2011-05-08", time: "15:00", timezone: "Asia/Kolkata" },
  ];
  const v = validateEvents({ ...chart, events });
  assert.equal(v.events[0].windows.bnn, null);
  assert.equal(v.events[1].windows.bnn?.sign, "Aries");
  assert.deepEqual(v.windows.bnn.flatMap((w) => w.events.map((e) => e.id)), ["after"]);
});

test("published royal wedding time changes a transit sub-lord from the date-only assumption", () => {
  // Royal Household: Westminster Abbey, 20 November 1947, 10:30 local time.
  // https://www.royal.uk/70-facts-about-queen-and-duke-edinburghs-wedding?page=1
  const figures = JSON.parse(readFileSync("scripts/fixtures/public-figures.json", "utf8"));
  const queen = figures.charts.find((c: { name: string }) => c.name === "Elizabeth II");
  const wedding = { id: "wedding", matter: "marriage", date: "1947-11-20" };
  const actual = validateEvents({ ...queen, events: [{ ...wedding, time: "10:30", timezone: "Europe/London" }] });
  const assumed = validateEvents({ ...queen, events: [wedding] });
  const jupiter = (v: typeof actual) => v.events[0].kp.transit.evidence!.find((p) => p.planet === "Jupiter")!;
  assert.equal(jupiter(actual).subLord, "Mars");
  assert.equal(jupiter(assumed).subLord, "Rahu");
  assert.equal(actual.events[0].time, "10:30");
  assert.equal(actual.events[0].timezone, "Europe/London");
});

test("timed events, including two on one date, agree in both tabs and comparison trials", () => {
  const events: ChartEvent[] = [
    { id: "a", matter: "marriage", date: "2008-05-01", time: "03:00", timezone: "Asia/Kolkata" },
    { id: "b", matter: "child", date: "2008-05-01", time: "19:30", timezone: "America/Los_Angeles" },
    { id: "c", matter: "job", date: "2012-12-04", time: "10:00", timezone: "Europe/London" },
  ];
  const requested = events.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
  });
  const scan = rectify({ chart, windowMinutes: 5, events: requested });
  const candidate = scan.segments.find((s) => s.given && s.selectable)!;
  const validated = validateEvents({ ...chart, birthTime: candidate.mid, events });
  assert.equal(scan.eventTransits!.length, events.length);
  for (let i = 0; i < events.length; i++) {
    const expected = positionsAt(julianDay(eventInstant(events[i].date, events[i], chart.timezone).toUTC()), kpOpts);
    const sky = scan.eventTransits![i];
    assert.equal(sky.positions.find((p) => p.planet === "Moon")!.lon, expected.find((p) => p.planet === "Moon")!.lon);
    assert.equal(candidate.events[i].transit.score, validated.events[i].kp.transit.score);
    assert.equal(candidate.events[i].time, events[i].time);
    assert.equal(sky.example!.date, validated.baseline!.example![i].date);
    assert.equal(sky.example!.time, events[i].time);
    assert.equal(sky.example!.timezone, events[i].timezone);
  }
  assert.notEqual(scan.eventTransits![0].positions.find((p) => p.planet === "Moon")!.lon, scan.eventTransits![1].positions.find((p) => p.planet === "Moon")!.lon);
  assert.deepEqual(candidate.baseline?.transit, validated.baseline?.transit);
  assert.deepEqual(candidate.baseline?.kpEvents, validated.baseline?.kp);
});

test("Parashari event cross-checks use D1 with the relevant divisional chart and agree between tabs", () => {
  const events: ChartEvent[] = [
    { id: "wedding", matter: "marriage", date: "2010-04-05" },
    { id: "child", matter: "child", date: "2013-05-06" },
    { id: "job", matter: "job", date: "2017-06-07" },
  ];
  const rectEvents = events.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, matter: e.matter, date: e.date, houses: m.houses, cusp: m.cusp, area: m.area };
  });
  const scan = rectify({ chart, windowMinutes: 10, events: rectEvents });
  const sample = scan.segments.find((s) => s.given && s.selectable)!;
  const validation = validateEvents({ ...chart, birthTime: sample.mid, events });
  const actual = sample.parashariVargas!;
  assert.deepEqual(actual.map((e) => e.division), ["D9", "D7", "D10"]);
  assert.deepEqual(actual, validation.events.map((e) => e.parashariVargas));
  assert.deepEqual(sample.parashariPromise, validation.events.map((e) => e.parashariPromise));
  assert.deepEqual(sample.parashariSpecific, validation.events.map((e) => e.parashariSpecific));
  assert.deepEqual(sample.parashariDivisional, validation.events.map((e) => e.parashariDivisional));
  assert.equal(methodScore(sample, "parashari-events").max, 15);
  assert.equal(methodScore(sample, "parashari-events-v2").max, 18);
  assert.equal(methodScore(sample, "parashari-events-v3").max, 24);
  for (let i = 0; i < events.length; i++) {
    assert.deepEqual(sample.parashariDivisional![i].factors.slice(0, 6), sample.parashariSpecific![i].factors);
    assert.equal(sample.parashariDivisional![i].score,
      sample.parashariSpecific![i].score + sample.parashariDivisional![i].factors.slice(6).filter((f) => f.matched).length);
  }
  const jd = julianDay(DateTime.fromISO(sample.candidate!.birthUtc, { setZone: true }));
  const positions = positionsAt(jd, chartOpts);
  const lagna = ascendantAt(jd, chart.latitude, chart.longitude, chartOpts);
  const vargas = computeVargas(positions, lagna);
  for (let i = 0; i < actual.length; i++) {
    const e = actual[i];
    const v = vargas.charts[e.division];
    assert.equal(e.varga.lagnaSign, v.lagnaSign);
    assert.equal(e.varga.houseSign, (v.lagnaSign + e.varga.house - 1) % 12);
    assert.deepEqual(e.varga.occupants, v.positions.filter((p) => p.signIndex === e.varga.houseSign).map((p) => p.planet));
    assert.equal(e.rashiLordInVarga.sign, v.positions.find((p) => p.planet === e.rashi.houseLord)!.signIndex);
    const eventUtc = eventInstant(events[i].date, events[i], chart.timezone).toUTC().toISO()!;
    const expectedPeriods = vimshottariLordsAt(positions.find((p) => p.planet === "Moon")!.lon, sample.candidate!.birthUtc, eventUtc);
    assert.deepEqual(e.periods.map((p) => p.planet), expectedPeriods);
    assert.equal(sample.events[i].score, validation.events[i].kp.score);
    assert.equal(sample.events[i].transit.score, validation.events[i].kp.transit.score);
    assert.equal(sample.events[i].jaimini?.score, validation.events[i].jaimini?.score);
  }
  // A chart about a spouse is not automatically a prediction of a spouse's death.
  assert.equal(vargaTopicFor("spouse"), undefined);
  assert.equal(vargaTopicFor("illness"), undefined);
  assert.ok(new Set(scan.segments.map((s) => JSON.stringify(s.parashariVargas?.map((e) => [e.division, e.varga.lagnaSign])))).size > 1);
  // A D9 ascendant change must be available for review even if the KP event
  // score is tied on the samples immediately on either side of the change.
  assert.ok(scan.segments.slice(1).some((right, i) => {
    const left = scan.segments[i];
    return left.parashariVargas?.[0].varga.lagnaSign !== right.parashariVargas?.[0].varga.lagnaSign
      && methodScore(left, "kp-events").score === methodScore(right, "kp-events").score;
  }));
  const natal = positions;
  const first = actual[0];
  const sky = [
    { planet: "Jupiter" as const, signIndex: first.rashi.houseSign },
    { planet: "Saturn" as const, signIndex: first.rashi.houseSign },
  ];
  const check = parashariPromiseCheck(first, undefined, natal, sky)!;
  assert.equal(check.factors[4], true);
  assert.ok(check.doubleTransitTargets.includes("D1 house 7"));
  assert.equal(check.score, check.factors.filter(Boolean).length);
  const noContact = (planet: "Jupiter" | "Saturn") => Array.from({ length: 12 }, (_, signIndex) => ({ planet, signIndex }))
    .find((p) => [first.rashi.houseSign, first.rashi.lordSign].every((target) => p.signIndex !== target && drishtiQuarters(planet, p.signIndex, target) < 4))!;
  const otherSky = [noContact("Jupiter"), noContact("Saturn")];
  const other = parashariPromiseCheck(first, undefined, natal, otherSky)!;
  assert.equal(other.factors[4], false);
  assert.deepEqual(other.factors.slice(0, 4), check.factors.slice(0, 4));
  assert.equal(other.score + 1, check.score);
  assert.equal(parashariPromiseCheck(first, "mixed", natal, sky), undefined);
  assert.equal(parashariPromiseCheck({ ...first, matter: "job-loss" }, undefined, natal, sky), undefined);
  assert.equal(parashariPromiseCheck({ ...first, periods: [] }, undefined, natal, sky), undefined);
  assert.throws(() => parashariPromiseCheck(first, undefined, natal, []), /Jupiter and Saturn/);
});

test("Manley's Harry example reproduces the D7 and D9 clues with true nodes", () => {
  // Manley, Birth Time Rectification, chs. 3 and 5. This checks transcription
  // and chart conventions against the supplied author's example, not accuracy.
  const birth = DateTime.fromISO("1984-09-15T16:20:00", { zone: "Europe/London" }).toUTC();
  const jd = julianDay(birth);
  const evidence = (matter: "child" | "marriage", date: string, nodeType: "true" | "mean") => {
    const options = { ayanamsa: "lahiri", nodeType };
    const positions = positionsAt(jd, options);
    const ascendant = ascendantAt(jd, 51.5014, -0.1419, options);
    const event = eventInstant(date, {}, "Europe/London").toUTC();
    const periods = vimshottariLordsAt(positions.find((p) => p.planet === "Moon")!.lon, birth.toISO()!, event.toISO()!);
    return manleyEvidence({ label: matter, matter, date }, positions, ascendant, periods)!;
  };
  const child = evidence("child", "2019-05-06", "true");
  assert.deepEqual(child.periods.map((p) => p.planet), ["Rahu", "Venus"]);
  assert.ok(child.antara);
  assert.equal(child.antara!.level, "antara");
  const rahuD7 = child.periods[0].frames[1];
  const venusD7 = child.periods[1].frames[1];
  assert.equal(rahuD7.ascendant, 0); // Aries
  assert.ok(rahuD7.supporting.bhavat.some((s) => s.includes("house 9")));
  assert.ok(rahuD7.primary.karaka.some((s) => s.includes("Jupiter's sign")));
  assert.ok(venusD7.primary.house.some((s) => s.includes("house 5")));
  assert.ok(venusD7.primary.houseLord.some((s) => s.includes("Sun fully aspects Venus")));
  assert.ok(venusD7.primary.karaka.some((s) => s.includes("Jupiter fully aspects Venus")));
  const base: ParashariSpecificCheck = {
    version: 2, label: "child", date: "2019-05-06", matter: "child", division: "D7",
    score: 2, max: 6,
    factors: Array.from({ length: 6 }, (_, i) => ({ id: `base-${i}`, label: `base ${i}`, matched: i < 2, details: [] })),
    d1Strain: [], divisionStrain: [],
  };
  const v3 = parashariDivisionalCheck(base, child)!;
  assert.equal(v3.score, 4); // Rahu's Jupiter-sign link; Venus in the fifth with aspects.
  assert.equal(v3.max, 8);
  assert.deepEqual(v3.factors.slice(0, 6), base.factors);
  assert.deepEqual(v3.factors.slice(6).map((f) => f.matched), [true, true]);
  assert.ok(v3.factors[7].details[0].includes("Venus is in house 5"));
  assert.deepEqual(parashariDivisionalCheck(base, { ...child, antara: undefined }), v3);
  assert.equal(parashariDivisionalCheck(base, { ...child, date: "2019-05-07" }), undefined);
  assert.equal(parashariDivisionalCheck(undefined, child), undefined);
  assert.equal(parashariDivisionalCheck(base, undefined), undefined);
  // A supporting-only clue must not become a primary scored match.
  const noPrimary = structuredClone(child);
  noPrimary.periods[0].frames[1].primary = { house: [], houseLord: [], karaka: [] };
  const oneMatch = parashariDivisionalCheck(base, noPrimary)!;
  assert.deepEqual(oneMatch.factors.slice(6).map((f) => f.matched), [false, true]);
  assert.equal(oneMatch.score, base.score + 1);
  // The frozen rule counts both levels even when the planet is the same.
  const duplicateLord = structuredClone(child);
  duplicateLord.periods[1] = { ...duplicateLord.periods[0], level: "bhukti" };
  assert.equal(parashariDivisionalCheck(base, duplicateLord)!.score, base.score + 2);
  duplicateLord.periods = duplicateLord.periods.slice(0, 1);
  assert.equal(parashariDivisionalCheck(base, duplicateLord), undefined);

  const wedding = evidence("marriage", "2018-05-19", "true");
  assert.deepEqual(wedding.periods.map((p) => p.planet), ["Rahu", "Ketu"]);
  const rahuD9 = wedding.periods[0].frames[1];
  const ketuD9 = wedding.periods[1].frames[1];
  assert.equal(rahuD9.ascendant, 5); // Virgo
  assert.ok(rahuD9.primary.houseLord.some((s) => s.includes("Jupiter fully aspects Rahu")));
  assert.ok(rahuD9.primary.karaka.some((s) => s.includes("Venus fully aspects Rahu")));
  assert.ok(ketuD9.primary.karaka.some((s) => s.includes("Ketu and Venus share Leo")));
  const mean = evidence("marriage", "2018-05-19", "mean");
  assert.ok(mean.periods[0].frames[1].supporting.nodes.some((s) => s.includes("Pisces")));
  assert.ok(!mean.periods[1].frames[1].primary.karaka.some((s) => s.includes("share Leo")));
});

test("Manley ascendant windows cover the scan and approximately reproduce Harry's published ranges", () => {
  const start = 2451545;
  const end = start + 30 / 86400;
  const ascendant = (jd: number) => (359.6 + (jd - start) * 86400 * 0.03) % 360;
  const windows = scanVargaWindows(start, end, ascendant);
  for (const division of MANLEY_WINDOW_DIVISIONS) {
    const rows = windows[division];
    assert.equal(rows[0].start, start);
    assert.equal(rows.at(-1)!.end, end);
    rows.forEach((w, i) => {
      assert.ok(w.end > w.start);
      assert.equal(w.sign, vargaSignAt(division, ascendant((w.start + w.end) / 2)));
      if (i) { assert.equal(rows[i - 1].end, w.start); assert.notEqual(rows[i - 1].sign, w.sign); }
    });
  }
  assert.ok(windows.D1.some((w) => w.sign === 11));
  assert.ok(windows.D1.some((w) => w.sign === 0));

  const birth = DateTime.fromISO("1984-09-15T16:20:00", { zone: "Europe/London" });
  const jd = julianDay(birth.toUTC());
  const real = scanVargaWindows(jd - 30 / 1440, jd + 30 / 1440,
    (t) => ascendantAt(t, 51.5014, -0.1419, { ayanamsa: "lahiri", nodeType: "true" }));
  for (const [division, sign, from, to] of [
    ["D7", 0, "16:17:33", "16:33:08"],
    ["D9", 5, "16:15:46", "16:28:03"],
  ] as const) {
    const row = real[division].find((w) => w.start <= jd && jd < w.end)!;
    assert.equal(row.sign, sign);
    const printed = (time: string) => DateTime.fromISO(`1984-09-15T${time}`, { zone: "Europe/London" }).toMillis();
    assert.ok(Math.abs(utcAtJulianDay(row.start).toMillis() - printed(from)) < 15000);
    assert.ok(Math.abs(utcAtJulianDay(row.end).toMillis() - printed(to)) < 15000);
  }
});

test("Manley clues agree between Rectify, Validate and both report models without changing scores", () => {
  const matters = ["move", "child", "marriage", "job", "education"] as const;
  const events: ChartEvent[] = matters.map((matter, i) => ({ id: matter, matter, date: `${2010 + i}-05-06` }));
  const rectEvents = events.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, matter: e.matter, date: e.date, houses: m.houses, cusp: m.cusp, area: m.area };
  });
  assert.equal(manleyTopicFor("abroad"), undefined);
  assert.equal(manleyTopicFor("job-loss"), undefined);
  const scan = rectify({ chart, windowMinutes: 5, events: rectEvents });
  const sample = scan.segments.find((s) => s.given && s.selectable)!;
  const validation = validateEvents({ ...chart, birthTime: sample.mid, events });
  assert.deepEqual(sample.manley?.map((e) => e.division), ["D4", "D7", "D9", "D10", "D24"]);
  assert.deepEqual(sample.manley, validation.events.map((e) => e.manley));
  assert.ok(sample.manley?.every((e) => e.antara?.level === "antara"));
  assert.ok(sample.manley?.every((e) => e.moment?.time === "12:00" && e.moment.timeAssumed && e.moment.timezoneAssumed));
  assert.deepEqual(sample.manley?.at(-1)?.educationFourth?.map((e) => e.level), ["dasa", "bhukti", "antara"]);
  assert.ok(sample.manley?.slice(0, -1).every((e) => !e.educationFourth));
  assert.deepEqual(methodScore(sample, "parashari-events-v2"), methodScore({ ...sample, manley: undefined }, "parashari-events-v2"));
  assert.deepEqual(scan.vargaWindows?.map((w) => w.division), MANLEY_WINDOW_DIVISIONS);
  assert.ok(scan.vargaWindows?.every((w) => w.windows.filter((x) => x.given).length === 1));

  const fullChart = { ...chart, id: 0, gender: "male", timeStandard: "auto", ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events };
  const state = { method: "parashari-events-v2" as const, windowMinutes: 5, events: rectEvents, judge: { latitude: chart.latitude, longitude: chart.longitude, timezone: chart.timezone, label: chart.place }, confirmedMarks: [] };
  const rectifyReport = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: scan, state } } });
  const rectifySection = rectifyReport.sections.find((s) => s.id === "rectify")!;
  assert.ok(rectifySection.paras.some((p) => p.text?.includes("Manley event clues")));
  assert.ok(rectifySection.paras.some((p) => p.text?.includes("D24 fourth-house education clues")));
  assert.ok(rectifySection.paras.some((p) => p.text?.includes("antara ")));
  assert.ok(rectifySection.paras.some((p) => p.text?.includes("recombined independently across events")));
  assert.ok(rectifySection.paras.some((p) => p.kind === "table" && p.rows?.some((row) => row[0] === "Parashari v3")));
  assert.ok(rectifySection.paras.some((p) => p.kind === "table" && p.head?.includes("Recorded-time ascendant")));
  const validateReport = buildReport(computeChart({ ...fullChart, birthTime: sample.mid }), { plain: true, modules: ["validate"], tools: { validation } });
  assert.ok(validateReport.sections.find((s) => s.id === "validate")!.paras.some((p) => p.text?.includes("Manley event clues")));
  assert.ok(validateReport.sections.find((s) => s.id === "validate")!.paras.some((p) => p.text?.includes("v3 rule matches")));
  assert.ok(validateReport.sections.find((s) => s.id === "validate")!.sub?.find((s) => s.id === "validate-baseline")?.paras
    .some((p) => p.text?.includes("recombined independently across events")));
  const v3Report = buildReport(computeChart(fullChart), { plain: true, modules: ["rectify"], tools: { rectify: { result: scan, state: { ...state, method: "parashari-events-v3" } } } });
  const v3Section = v3Report.sections.find((s) => s.id === "rectify")!;
  assert.ok(v3Section.title?.includes("v3"));
  assert.ok(v3Section.paras.some((p) => p.text?.includes("added period-lord checks")));
});

test("third-period education evidence keeps Rao's fourth separate from Manley's fifth", () => {
  // Construct D24 Aquarius rising. Mercury is its fifth lord; Sun joins Venus,
  // the fourth lord. No real person's birth or event is used in this fixture.
  const lon: Record<string, number> = { Sun: 13.8, Moon: 0.1, Mars: 5.1, Mercury: 2.6, Jupiter: 8.8, Venus: 13.9, Saturn: 2.7, Rahu: 6.4, Ketu: 11.4 };
  const natal = positionsAt(julianDay(birthInstant(chart).utc), chartOpts).map((p) => ({ ...p, lon: lon[p.planet] }));
  const e = manleyEvidence({ label: "Study", matter: "education", date: "2015-04-20", birthTimezone: "Asia/Kolkata" }, natal, 7.6, ["Sun", "Saturn", "Mercury"])!;
  assert.equal(e.periods.length, 2);
  assert.equal(e.antara?.planet, "Mercury");
  assert.equal(e.antara?.frames[1].ascendant, 10); // Aquarius D24.
  assert.ok(e.antara?.frames[1].primary.houseLord.includes("Mercury is the house 5 lord"));
  const fourth = e.educationFourth!.find((p) => p.level === "dasa")!;
  assert.equal(fourth.houseSign, 1); // Taurus is fourth from Aquarius.
  assert.equal(fourth.houseLord, "Venus");
  assert.ok(fourth.houseLordLinks.some((link) => link.includes("Sun and Venus share Cancer")));
  assert.equal(e.periods[0].frames[1].house, 5); // Rao's fourth did not replace Manley's fifth.
  assert.deepEqual(e.moment, { time: "12:00", timeAssumed: true, timezone: "Asia/Kolkata", timezoneAssumed: true });
});

test("third-period evidence uses the event clock and splits candidate intervals at changes", () => {
  const e: ChartEvent = { id: "study", matter: "education", date: "2015-04-20", time: "09:45", timezone: "America/New_York" };
  const m = matterOf(e.matter);
  const requested = { label: m.label, matter: e.matter, date: e.date, time: e.time, timezone: e.timezone, houses: m.houses, cusp: m.cusp, area: m.area };
  const scan = rectify({ chart, windowMinutes: 30, events: [requested] });
  const thirds = new Set(scan.segments.map((s) => s.manley?.[0]?.antara?.planet));
  assert.ok(thirds.size > 1, "fixture must span a third-lord transition");
  const given = scan.segments.find((s) => s.given && s.selectable)!;
  const validation = validateEvents({ ...chart, birthTime: given.mid, events: [e] });
  assert.deepEqual(given.manley?.[0], validation.events[0].manley);
  for (const segment of scan.segments) {
    const evidence = segment.manley?.[0];
    assert.ok(evidence?.antara);
    assert.deepEqual(evidence.moment, { time: "09:45", timeAssumed: false, timezone: "America/New_York", timezoneAssumed: false });
    const birth = DateTime.fromISO(segment.candidate!.birthUtc, { setZone: true });
    const moon = positionsAt(julianDay(birth), chartOpts).find((p) => p.planet === "Moon")!;
    const event = eventInstant(e.date, e, chart.timezone).toUTC();
    assert.equal(evidence.antara.planet, vimshottariLordsAt(moon.lon, birth.toISO()!, event.toISO()!)[2]);
  }
});

test("event-specific rules distinguish marriage, childbirth and career timing", () => {
  const signs: Record<string, number> = { Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 11, Venus: 4, Saturn: 0, Rahu: 2, Ketu: 8 };
  const natal = positionsAt(julianDay(birthInstant(chart).utc), chartOpts).map((p) => ({ ...p, signIndex: signs[p.planet], lon: signs[p.planet] * 30 + 1 }));
  const makeEvidence = (matter: "marriage" | "child" | "job", periods: [typeof natal[number]["planet"], typeof natal[number]["planet"], typeof natal[number]["planet"]]) =>
    parashariVargaEvidence({ label: matter, date: "2020-01-01", matter }, natal, 1, periods)!;
  const sky = natal.map((p) => ({ planet: p.planet, signIndex: p.planet === "Jupiter" ? 0 : p.planet === "Saturn" ? 0 : p.planet === "Mars" ? 4 : p.planet === "Sun" ? 8 : p.signIndex }));
  const factor = (c: NonNullable<ReturnType<typeof parashariSpecificCheck>>, id: string) => c.factors.find((f) => f.id === id)!.matched;

  // Aries lagna makes Mars the D1 and D9 lagna lord, while Jupiter has no D1
  // link to either the ascendant/seventh or their lords in this constructed chart.
  const wedding = parashariSpecificCheck(makeEvidence("marriage", ["Mars", "Jupiter", "Sun"]), undefined, natal, sky)!;
  assert.equal(factor(wedding, "dasa"), true);
  assert.equal(factor(wedding, "bhukti"), false);
  assert.equal(factor(wedding, "vivah-saham"), true); // Mars + Venus longitude falls in Leo, Jupiter in Aries aspects it.
  const weddingWithoutSaham = parashariSpecificCheck(makeEvidence("marriage", ["Mars", "Jupiter", "Sun"]), undefined, natal,
    sky.map((p) => p.planet === "Jupiter" ? { ...p, signIndex: 1 } : p))!;
  assert.equal(factor(weddingWithoutSaham, "vivah-saham"), false);

  // Jupiter is in the explicitly listed childbirth set; Saturn is not in it.
  const child = parashariSpecificCheck(makeEvidence("child", ["Jupiter", "Saturn", "Sun"]), undefined, natal, sky)!;
  assert.equal(factor(child, "dasa"), true);
  assert.equal(factor(child, "bhukti"), false);
  assert.equal(factor(child, "asc-lord-transit"), true); // transiting Mars in natal fifth, Leo
  const childOtherSky = parashariSpecificCheck(makeEvidence("child", ["Jupiter", "Saturn", "Sun"]), undefined, natal,
    sky.map((p) => p.planet === "Mars" ? { ...p, signIndex: 5 } : p))!;
  assert.equal(factor(childOtherSky, "asc-lord-transit"), false);
  const childJupiter = parashariSpecificCheck(makeEvidence("child", ["Jupiter", "Saturn", "Sun"]), undefined, natal,
    sky.map((p) => p.planet === "Jupiter" ? { ...p, signIndex: 1 } : p))!;
  assert.equal(factor(childJupiter, "jupiter-trine"), true); // fifth from natal Jupiter is Cancer, ruled by Moon in Taurus

  // Career's period subset includes the D1 ascendant lord Mars, but not Venus.
  const job = parashariSpecificCheck(makeEvidence("job", ["Mars", "Venus", "Sun"]), undefined, natal, sky)!;
  assert.equal(factor(job, "dasa"), true);
  assert.equal(factor(job, "bhukti"), false);
  assert.equal(factor(job, "d10-lords"), true); // both D1 tenth lord Saturn and D10 lagna lord Mars are in Aries D10
  assert.equal(factor(job, "double-transit"), true); // both contact Aries, also the natal tenth lord's sign
  const jobOtherSky = parashariSpecificCheck(makeEvidence("job", ["Mars", "Venus", "Sun"]), undefined, natal,
    sky.map((p) => p.planet === "Saturn" ? { ...p, signIndex: 8 } : p))!;
  assert.equal(factor(jobOtherSky, "double-transit"), false);
  assert.equal(parashariSpecificCheck(makeEvidence("job", ["Mars", "Venus", "Sun"]), "mixed", natal, sky), undefined);
  assert.equal(job.score, job.factors.filter((f) => f.matched).length);
});

test("Swiss UT Julian days round-trip to UTC at subsecond precision", () => {
  for (const value of ["1990-01-01T06:30:43.000Z", "1880-01-01T06:49:40.000Z", "2024-03-10T16:00:00.000Z"]) {
    const instant = DateTime.fromISO(value, { zone: "utc" });
    assert.ok(Math.abs(utcAtJulianDay(julianDay(instant)).toMillis() - instant.toMillis()) <= 2);
  }
});

test("the two named Kunda calculations remain distinct and the D81 example uses all 27 stars", () => {
  assert.ok(RECTIFY_METHODS.some((m) => m.id === "kunda"));
  assert.ok(RECTIFY_METHODS.some((m) => m.id === "kunda-d81"));
  const raman = kundaCheck(11 + 34 / 60, 54);
  assert.equal(raman.remainder, 6);
  assert.equal(raman.kundaNakshatra, 5);
  // C.S. Patel's worked D81 example: Cancer 8°53′ × 81 → Gemini 29°33′.
  const d81 = kundaD81Check(90 + 8 + 53 / 60, 89.55);
  assert.ok(Math.abs(d81.remainder - 89.55) < 1e-8);
  assert.equal(d81.kundaNakshatra, 6);
  assert.equal(d81.trine, true);
  assert.equal(kundaD81Check((26 * (360 / 27) + 1) / 81, 26 * (360 / 27) + 1).kundaNakshatra, 26);
});

test("KP Reader IV's published 24 June 1970 transit example agrees at noon in India", () => {
  // Reader IV pp. 113–114 lists Sun in Gemini/Ardra/Jupiter sub, Moon in
  // Shatabhisha, Mercury in Mars' star/Rahu sub, and both nodes in Mercury sub.
  // https://www.scribd.com/document/1017596238/04-Jyotish-KP-Reader-4-Marriage-Married-Life-Children
  const at = eventInstant("1970-06-24", { time: "12:00", timezone: "Asia/Kolkata" }, "UTC");
  const positions = positionsLite(julianDay(at.toUTC()), kpOpts);
  const point = (planet: string) => kpPoint(positions.find((p) => p.planet === planet)!.lon);
  assert.deepEqual([point("Sun").sign, point("Sun").nakshatra, point("Sun").subLord], ["Gemini", "Ardra", "Jupiter"]);
  assert.equal(point("Moon").nakshatra, "Shatabhisha");
  assert.deepEqual([point("Mercury").starLord, point("Mercury").subLord], ["Mars", "Rahu"]);
  assert.deepEqual([point("Rahu").subLord, point("Ketu").subLord], ["Mercury", "Mercury"]);
});

test("the independent D81 scan follows star changes over the longitude wrap", () => {
  const start = 2451545;
  const end = start + 30 / 86400;
  const asc = (jd: number) => (359.6 + (jd - start) * 86400 * 0.03) % 360;
  const moon = () => 10;
  const windows = scanKundaD81(start, end, asc, moon);
  assert.ok(windows.length > 4);
  assert.equal(windows[0].start, start);
  assert.equal(windows.at(-1)?.end, end);
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    assert.equal(w.check.kundaNakshatra, kundaD81Check(asc(w.mid), moon()).kundaNakshatra);
    if (i) assert.equal(windows[i - 1].end, w.start);
  }
  assert.ok(windows.some((w) => w.check.kundaNakshatra === 26));
  assert.ok(windows.some((w) => w.check.kundaNakshatra === 0));
});

test("Rectify and Validate agree on a period change between midnight and noon", () => {
  const birth = birthInstant(chart).utc;
  const moon = positionsAt(julianDay(birth), kpOpts).find((p) => p.planet === "Moon")!;
  let date = DateTime.fromISO("2008-01-01", { zone: chart.timezone });
  let found = false;
  for (let i = 0; i < 3650; i++, date = date.plus({ days: 1 })) {
    const midnight = vimshottariLordsAt(moon.lon, birth.toISO()!, date.toUTC().toISO()!);
    const noon = vimshottariLordsAt(moon.lon, birth.toISO()!, date.plus({ hours: 12 }).toUTC().toISO()!);
    if (midnight.join() !== noon.join()) { found = true; break; }
  }
  assert.ok(found, "fixture must cross a period boundary between midnight and noon");
  const eventDate = date.toISODate()!;
  const matter = matterOf("marriage");
  const event = { label: matter.label, date: eventDate, houses: matter.houses, cusp: matter.cusp, area: matter.area };
  const scan = rectify({ chart, windowMinutes: 10, events: [event] });
  const sample = scan.segments.find((s) => s.given)!;
  assert.ok(sample);
  const checked = validateEvents({ ...chart, birthTime: sample.mid, events: [{ id: "marriage", matter: "marriage", date: eventDate }] });
  const r = sample.events[0];
  const v = checked.events[0];
  assert.deepEqual([r.dasa, r.bhukti, r.antara], [v.kp.dasa, v.kp.bhukti, v.kp.antara]);
  assert.deepEqual(r.hits, v.kp.hits);
  assert.deepEqual(r.transit.dasa, v.kp.transit.dasa);
  assert.deepEqual(r.transit.bhukti, v.kp.transit.bhukti);
  const independent = positionsLite(julianDay(eventAtNoon(eventDate, chart.timezone).toUTC()), kpOpts);
  assert.equal(r.transit.dasa.lon, independent.find((p) => p.planet === r.dasa)!.lon);
  const sky = scan.eventTransits!.find((x) => x.date === eventDate)!;
  const evidence = kpTransitEvidence(sky.positions, sample.candidate!.kpPlanets, sample.candidate!.kpCusps, event.houses);
  assert.deepEqual(evidence, v.kp.transit.evidence);
  assert.equal(evidence.length, 9);
  assert.ok(evidence.some((p) => p.planet === "Sun"));
  assert.ok(evidence.some((p) => p.planet === "Moon"));
  const natalMoon = sample.candidate!.kpPlanets.find((p) => p.planet === "Moon")!;
  const close = kpTransitEvidence([{ planet: "Sun", lon: natalMoon.lon + 0.5 }], sample.candidate!.kpPlanets, sample.candidate!.kpCusps, event.houses)[0];
  assert.ok(close.contacts.some((c) => c.kind === "conjunction" && c.target === "natal Moon" && Math.abs(c.orb - 0.5) < 1e-8));
});

test("comparison transit scores use each sampled date and the natal significators", () => {
  const events: ChartEvent[] = [
    { id: "job", matter: "job", date: "2011-06-10" },
    { id: "marriage", matter: "marriage", date: "2016-11-19" },
  ];
  const validation = validateEvents({ ...chart, events });
  assert.ok(validation.baseline);
  const birth = birthInstant(chart).utc;
  const jd = julianDay(birth);
  const cuspLons = cuspsAt(jd, chart.latitude, chart.longitude, kpOpts);
  const owners = cuspLons.map((lon) => kpPoint(lon).signLord);
  const planets: KpPlanet[] = positionsAt(jd, kpOpts).map((p) => ({
    ...kpPoint(p.lon), planet: p.planet, retrograde: p.retrograde,
    house: houseOf(p.lon, cuspLons),
    owns: NODES_KP.includes(p.planet) ? [] : owners.map((o, i) => o === p.planet ? i + 1 : 0).filter(Boolean),
  }));
  const sig = new Map(computeSignificators(planets).map((s) => [s.planet, s.houses]));
  const moon = planets.find((p) => p.planet === "Moon")!;
  const lo = DateTime.fromISO(events[0].date, { zone: "utc" }).toMillis();
  const hi = DateTime.fromISO(events[1].date, { zone: "utc" }).toMillis();
  const random = seeded(comparisonSeed(events.map((e) => e.date)));
  const sampledDates = new Set<string>();
  let total = 0;
  for (let trial = 0; trial < validation.baseline.trials; trial++) {
    for (const e of events) {
      const date = DateTime.fromMillis(lo + Math.floor(random() * (hi - lo)), { zone: "utc" }).toISODate()!;
      sampledDates.add(date);
      const instant = eventAtNoon(date, chart.timezone).toUTC();
      const lords = vimshottariLordsAt(moon.lon, birth.toISO()!, instant.toISO()!);
      const day = positionsLite(julianDay(instant), kpOpts);
      for (const lord of lords.slice(0, 2)) {
        const pt = kpPoint(day.find((p) => p.planet === lord)!.lon);
        for (const owner of [pt.signLord, pt.starLord, pt.subLord]) {
          if ((sig.get(owner) ?? []).some((h) => matterOf(e.matter).houses.includes(h))) total++;
        }
      }
    }
  }
  assert.ok(sampledDates.size > 100);
  assert.equal(validation.baseline.transit.mean, Math.round(total / validation.baseline.trials * 10) / 10);

  // At the same natal midpoint, both tabs must now use the same comparison
  // dates and therefore obtain the same period and transit statistics.
  const requestEvents = events.map((e) => {
    const m = matterOf(e.matter);
    return { label: m.label, date: e.date, houses: m.houses, cusp: m.cusp, area: m.area };
  });
  const scan = rectify({ chart, windowMinutes: 1, events: requestEvents });
  const candidate = scan.segments.find((s) => s.given)!;
  const atCandidate = validateEvents({ ...chart, birthTime: candidate.mid, events });
  assert.deepEqual(candidate.baseline?.transit, atCandidate.baseline?.transit);
  assert.deepEqual(candidate.baseline?.kpEvents, atCandidate.baseline?.kp);
  assert.ok(candidate.candidate);
  for (let i = 0; i < events.length; i++) {
    const example = scan.eventTransits![i].example!;
    const fromValidate = atCandidate.baseline!.example![i];
    assert.equal(example.date, fromValidate.date);
    const calculated = kpTransitEvidence(example.positions, candidate.candidate!.kpPlanets, candidate.candidate!.kpCusps, matterOf(events[i].matter).houses);
    assert.deepEqual(calculated, fromValidate.evidence);
  }
});

test("candidate ayanamsa, transit scores and highlighting stay method-specific", () => {
  const matter = matterOf("marriage");
  const scan = rectify({ chart, windowMinutes: 10, events: [{ label: matter.label, date: "2016-11-19", houses: matter.houses, cusp: matter.cusp, area: matter.area }] });
  const sample = scan.segments.find((s) => s.given)!;
  const jd = julianDay(DateTime.fromISO(sample.candidate!.birthUtc, { zone: "utc" }));
  const asc = ascendantAt(jd, chart.latitude, chart.longitude, chartOpts);
  const moon = planetLonAt("Moon", jd, chartOpts).lon;
  assert.equal(sample.kundaD81?.kundaNakshatra, kundaD81Check(asc, moon).kundaNakshatra);
  assert.equal(sample.kunda?.kundaNakshatra, kundaCheck(asc, moon).kundaNakshatra);
  const score = methodScore(sample, "kp-transit");
  assert.equal(score.score, sample.events.reduce((n, e) => n + e.transit.score, 0));
  assert.equal(score.max, sample.events.reduce((n, e) => n + e.transit.max, 0));
  assert.equal(baselineFor(sample, "kp-transit"), sample.baseline?.transit);
  const stat = (actual: number, mean: number, verdict: "above" | "chance") => ({ actual, mean, sd: 1, percentile: verdict === "above" ? 98 : 50, verdict });
  assert.deepEqual(highlightedCandidates([{ score: 10, b: stat(10, 9, "chance") }, { score: 8, b: stat(8, 4, "above") }]), [1]);
  assert.deepEqual(highlightedCandidates([{ score: 10, b: stat(10, 0, "chance") }, { score: 8, b: stat(8, 4, "above") }]), [1]);
});

test("Jaimini periods are recalculated for different birth times within one rising sign", () => {
  const m = matterOf("marriage");
  // For this synthetic chart, the relevant Chara period starts at local noon
  // on this anniversary. Candidates either side must not share a cached fit.
  const scan = rectify({ chart, windowMinutes: 30, events: [{ label: m.label, date: "2014-01-01", houses: m.houses, cusp: m.cusp, area: m.area }] });
  const before = scan.segments.find((s) => s.mid < "11:59:30" && s.candidate)!;
  const after = scan.segments.find((s) => s.mid > "12:00:30" && s.candidate && s.jaiminiSign.index === before.jaiminiSign.index)!;
  assert.ok(before.events[0].jaimini && after.events[0].jaimini);
  assert.notEqual(before.events[0].jaimini!.mdSign, after.events[0].jaimini!.mdSign);
  assert.notEqual(before.candidate!.birthUtc, after.candidate!.birthUtc);
});

test("a scan crossing midnight records the candidate's civil date", () => {
  const scan = rectify({ chart: { ...chart, birthTime: "00:05" }, windowMinutes: 10, events: [] });
  assert.ok(scan.segments.some((s) => s.midDate === "1989-12-31"));
  assert.ok(scan.segments.some((s) => s.midDate === "1990-01-01"));
  assert.ok(scan.kundaD81?.some((s) => s.midDate === "1989-12-31"));
});

test("a historical local-mean-time candidate agrees with validation", () => {
  const historical = { ...chart, birthDate: "1880-01-01" };
  const matter = matterOf("marriage");
  const date = "1905-04-12";
  const scan = rectify({ chart: historical, windowMinutes: 2, events: [{ label: matter.label, date, houses: matter.houses, cusp: matter.cusp, area: matter.area }] });
  const sample = scan.segments.find((s) => s.given)!;
  assert.ok(sample.candidate);
  const validation = validateEvents({ ...historical, birthTime: sample.mid, events: [{ id: "historical", matter: "marriage", date }] });
  const sky = scan.eventTransits![0];
  const evidence = kpTransitEvidence(sky.positions, sample.candidate!.kpPlanets, sample.candidate!.kpCusps, matter.houses);
  assert.deepEqual(evidence, validation.events[0].kp.transit.evidence);
});
