import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { alpMarriageContext } from "@shared/alp-marriage";
import { alpPointAt, computeAlp, type ArpResult } from "@shared/alp";
import { PLANETS, SIGNS, type PlanetPosition } from "@shared/astro";
import { zodiacQuarter } from "@shared/zodiac-quarter";
import { insertChartSchema } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { baselineFor, kpMatchedComparable } from "@shared/rectify-methods";
import { kpNatalFrame, vimshottariLordsAtMs } from "@shared/kp";
import { prepareKpMatchedDates } from "../server/kp-matched-comparison";
import { eventInstant } from "../server/event-time";
import { birthInstant, cuspsAt, julianDay, positionsAt, positionsLite, ascendantAt } from "../server/ephemeris";
import { validateEvents } from "../server/validate";
import { topicReading } from "../server/topic-reading";
import { rectify } from "../server/rectify";

const asOf = "2026-11-01T12:00:00.000Z";
const chart = insertChartSchema.parse({ name: "Synthetic matched test", gender: "female", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean" });
const events: ChartEvent[] = [
  { id: "m", matter: "marriage", date: "2016-11-19", time: "11:15", timezone: "America/New_York" },
  { id: "c", matter: "child", date: "2018-07-22", time: "15:30", timezone: "America/Los_Angeles" },
  { id: "c2", matter: "child", date: "2021-03-15", timezone: "America/Los_Angeles" },
];
const req = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });

test("ALP chapter 25's exact seventh-lord pair is separate from an unresolved natal promise", () => {
  const positions = PLANETS.map((planet, i) => ({ planet, lon: i * 30 + 1, signIndex: i })) as PlanetPosition[];
  const natal = alpPointAt(180), progressed = alpPointAt(240); // Libra natal -> Mars; Sagittarius progressed -> Mercury
  const arp = { dasa: { lord: "Mars" }, bhukti: { lord: "Mercury" } } as ArpResult;
  const m = alpMarriageContext(positions, natal, progressed, arp);
  assert.equal(m.natal.lord, "Mars");
  assert.equal(m.timing.alpSeventhLord, "Mercury");
  assert.equal(m.timing.exactPeriodPair, true);
  assert.equal(m.timing.alpSeventhInPeriod, true);
  assert.equal(m.natal.promise, "unresolved");
  assert.equal(m.natal.lordNavamsaSign, SIGNS[zodiacQuarter(positions.find((p) => p.planet === "Mars")!.lon).navamsaSign]);
  assert.equal(alpMarriageContext(positions, natal, progressed, { ...arp, dasa: { ...arp.dasa, lord: "Mercury" }, bhukti: { ...arp.bhukti, lord: "Mars" } }).timing.exactPeriodPair, true);
  assert.equal(alpMarriageContext(positions, natal, progressed, { ...arp, bhukti: { ...arp.bhukti, lord: "Venus" } }).timing.exactPeriodPair, false);
  const one = alpMarriageContext(positions, natal, progressed, { ...arp, dasa: { ...arp.dasa, lord: "Sun" } });
  assert.equal(one.timing.exactPeriodPair, false);
  assert.equal(one.timing.alpSeventhInPeriod, true); // the printed example permits the progressed lord in either level
  assert.equal(one.timing.natalSeventhInPeriod, false);
  assert.equal(one.timing.natalSeventhAtNatalD9Lagna, zodiacQuarter(positions.find((p) => p.planet === "Mars")!.lon).navamsaSign === natal.navamsaSign);
  assert.equal(one.timing.alpSeventhAtProgressedD9Lagna, zodiacQuarter(positions.find((p) => p.planet === "Mercury")!.lon).navamsaSign === progressed.navamsaSign);
  const boundary = positions.map((p) => p.planet === "Mars" ? { ...p, lon: 10 / 3, signIndex: 0 } : p);
  assert.equal(alpMarriageContext(boundary, natal, progressed, arp).natal.lordNavamsaSign, SIGNS[zodiacQuarter(10 / 3).navamsaSign]);
});

test("matched dates preserve the joint sequence and valid local clocks, without sampling after passing or judgment", () => {
  const pool = prepareKpMatchedDates(req, chart.timezone, "2022-01-01", asOf);
  const a = pool(Date.parse("1990-01-01T06:30:00Z")), b = pool(Date.parse("1990-01-01T06:30:00Z"));
  assert.deepEqual(a, b);
  assert.equal(a.trials.length, 200);
  assert.equal(new Set(a.trials.map((t) => t.offset)).size, a.trials.length);
  for (const trial of a.trials) {
    assert.ok(Math.abs(trial.offset) >= 180 && Math.abs(trial.offset) <= 365);
    for (let i = 0; i < trial.moments.length; i++) {
      const diff = DateTime.fromISO(trial.moments[i].date, { zone: "utc" }).diff(DateTime.fromISO(req[i].date, { zone: "utc" }), "days").days;
      assert.equal(diff, trial.offset);
      assert.ok(trial.moments[i].date <= "2022-01-01");
      assert.ok(!req.some((e) => e.matter === req[i].matter && e.date === trial.moments[i].date));
    }
    assert.ok(trial.moments.every((x, i) => !i || x.ms > trial.moments[i-1].ms));
  }
  assert.ok(prepareKpMatchedDates([req[0]], chart.timezone, undefined, asOf)(Date.parse("1990-01-01T06:30Z")).trials.length >= 40);
  assert.equal(prepareKpMatchedDates([req[0]], chart.timezone, undefined, "2010-01-01T00:00:00Z")(Date.parse("1990-01-01T06:30Z")).trials.length, 0);
});

test("ALP and KP matched context agree between ordinary reading, validation and rectification and replay independently", () => {
  const scan = rectify({ chart, windowMinutes: 1, events: req, judgedAsOf: asOf });
  const s = scan.segments.find((x) => x.given && x.selectable)!;
  const candidate = { ...chart, birthDate: s.midDate!, birthTime: s.mid };
  const v = validateEvents({ ...candidate, events }, asOf);
  assert.deepEqual(s.kpMatched, v.kpMatched);
  assert.deepEqual(s.alpMatched, v.alpMatched);
  assert.equal(v.kpMatched?.status, "available");
  assert.deepEqual(s.events[0].alp?.marriage, v.events[0].alp?.marriage);
  assert.deepEqual(topicReading(candidate, events[0], asOf).alp?.marriage, v.events[0].alp?.marriage);
  assert.deepEqual(baselineFor(s, "kp-events"), v.kpMatched.status === "available" ? v.kpMatched.timing : undefined);
  const birth = birthInstant(candidate).utc, jd = julianDay(birth), opts = { ayanamsa: "kp", nodeType: "mean" } as const;
  const positions = positionsLite(jd, opts), frame = kpNatalFrame(positions, cuspsAt(jd, chart.latitude, chart.longitude, opts));
  const sig = new Map(frame.significators.map((x) => [x.planet, x.houses]));
  const moon = positions.find((p) => p.planet === "Moon")!;
  const trials = prepareKpMatchedDates(req, chart.timezone, undefined, asOf)(birth.toMillis()).trials;
  const jOpts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
  const jp = positionsAt(jd, jOpts), lagna = ascendantAt(jd, chart.latitude, chart.longitude, jOpts);
  if (v.alpMatched?.status === "available") {
    const row = v.alpMatched.rows[0];
    const fact = row.facts.find((f) => f.id === "alp-seventh-lord-in-period")!;
    const independentlyReplayed = trials.reduce((count, trial) => count + Number(computeAlp(jp, lagna, birth.toISO()!, eventInstant(trial.moments[0].date, events[0], chart.timezone).toUTC().toISO()!).marriage.timing.alpSeventhInPeriod), 0);
    assert.equal(fact.matchedTrials, independentlyReplayed);
  } else assert.fail("ALP comparison unavailable");
  const scores = trials.map((trial) => trial.moments.reduce((sum, m, i) => {
    const lords = vimshottariLordsAtMs(moon.lon, birth.toMillis(), m.ms);
    return sum + lords.filter((p) => (sig.get(p) ?? []).some((h) => req[i].houses.includes(h))).length;
  }, 0));
  const mean = scores.reduce((a,b) => a+b, 0) / scores.length;
  if (v.kpMatched?.status === "available") assert.equal(v.kpMatched.timing.mean, Math.round(mean * 10) / 10);
  const direct = computeAlp(jp, lagna, birth.toISO()!, v.events[0].alp!.asOf);
  assert.deepEqual(direct.marriage, v.events[0].alp?.marriage);
  assert.ok(kpMatchedComparable(scan.segments));
  const altered = structuredClone(scan.segments);
  if (altered[0].kpMatched?.status === "available") altered[0].kpMatched.offsets[0]++;
  assert.equal(kpMatchedComparable(altered), false);
});
