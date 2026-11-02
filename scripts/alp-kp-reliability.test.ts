import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema } from "@shared/schema";
import { alpBandRanking, methodScore } from "@shared/rectify-methods";
import { kpLegacyTotals } from "@shared/kp-legacy-aggregation";
import { rectify } from "../server/rectify";
import { comparisonSeed, seeded, validateEvents } from "../server/validate";
import { comparisonDate, eventInstant } from "../server/event-time";
import { kpNatalFrame, vimshottariLordsAtMs } from "@shared/kp";
import { birthInstant, julianDay, positionsLite, cuspsAt } from "../server/ephemeris";

const chart = insertChartSchema.parse({ name: "Synthetic boundaries", gender: "female", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean" });
const events: ChartEvent[] = [
  { id: "m", matter: "marriage", date: "2016-11-19", time: "11:15", timezone: "America/New_York" },
  { id: "c1", matter: "child", date: "2018-07-22", time: "15:30", timezone: "America/Los_Angeles" },
  { id: "c2", matter: "child", date: "2021-03-15", timezone: "America/Los_Angeles" },
];
const request = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });

test("ALP bands resolve comparison-date changes and agree with the complete validation calculation", () => {
  const scan = rectify({ chart, windowMinutes: 5, events: request, judgedAsOf: "2026-11-01T12:00:00Z" });
  const bands = scan.alpComparisonBands!;
  assert.ok(bands.length > 1);
  assert.equal(Date.parse(bands.at(-1)!.endIso) - Date.parse(bands[0].startIso), 600000);
  assert.ok(bands.every((b, i) => !i || bands[i - 1].endIso === b.startIso));
  assert.ok(bands.some((b, i) => i > 0 && b.score === bands[i - 1].score &&
    b.baseline?.percentile !== bands[i - 1].baseline?.percentile), "a random-date boundary changes the comparison without changing the event score");
  // The full Validate pipeline independently evaluates all 200 comparisons;
  // check both ends and midpoints, including random-date transitions.
  const chosen = Array.from(new Set([0, Math.floor(bands.length / 2), bands.length - 1]));
  for (const i of chosen) {
    const band = bands[i];
    for (const ms of Array.from(new Set([Date.parse(band.startIso), Date.parse(band.endIso) - 1000,
      DateTime.fromISO(`${band.midDate}T${band.mid}`, { zone: chart.timezone }).toMillis()]))) {
      const t = DateTime.fromMillis(ms, { zone: chart.timezone });
      const v = validateEvents({ ...chart, birthDate: t.toISODate()!, birthTime: t.toFormat("HH:mm:ss"), events });
      const score = v.events.reduce((s, e) => s + (e.qualifiedScores?.alp?.score ?? 0), 0);
      assert.equal(score, band.score, `${i} ${t.toISO()}`);
      assert.deepEqual(v.baseline?.qualified?.alp, band.baseline, `${i} ${t.toISO()}`);
    }
  }
  assert.equal(alpBandRanking(bands, true).comparable, true);
  assert.equal(alpBandRanking([{ ...bands[0], baseline: undefined }, ...bands.slice(1)], true).comparable, false);
});

test("repeated KP natal cusp links are counted once in validation, rectification and comparisons", () => {
  const scan = rectify({ chart, windowMinutes: 1, events: request, judgedAsOf: "2026-11-01T12:00:00Z" });
  const s = scan.segments.find((x) => x.given && x.selectable)!;
  const v = validateEvents({ ...chart, birthDate: s.midDate!, birthTime: s.mid, events });
  assert.equal(v.summary.kpMax, 11); // three sets of period lords plus marriage and child natal links
  assert.equal(v.events.reduce((n, e) => n + e.kp.max, 0), 12);
  assert.deepEqual(methodScore(s, "kp-events"), { score: v.summary.kpScore, max: v.summary.kpMax });
  assert.deepEqual(s.baseline?.kpEvents, v.baseline?.kp);
  // Rebuild the KP frame and independently replay all 200 random sets, adding
  // one cusp point per matter plus each dated period-lord hit.
  const candidate = { ...chart, birthDate: s.midDate!, birthTime: s.mid };
  const birth = birthInstant(candidate).utc;
  const jd = julianDay(birth), opts = { ayanamsa: "kp", nodeType: "mean" } as const;
  const positions = positionsLite(jd, opts);
  const frame = kpNatalFrame(positions, cuspsAt(jd, chart.latitude, chart.longitude, opts));
  const sig = new Map(frame.significators.map((x) => [x.planet, x.houses]));
  const moon = positions.find((p) => p.planet === "Moon")!;
  const random = seeded(comparisonSeed(events.map((e) => e.date)));
  const lo = Date.parse(`${events[0].date}T00:00:00Z`), hi = Date.parse(`${events.at(-1)!.date}T00:00:00Z`);
  const samples: number[] = [];
  for (let t = 0; t < 200; t++) {
    const seen = new Set<string>();
    let total = 0;
    for (const e of events) {
      const date = comparisonDate(random, lo, hi, e, chart.timezone);
      const instant = eventInstant(date, e, chart.timezone).toMillis();
      const matter = matterOf(e.matter);
      const lords = vimshottariLordsAtMs(moon.lon, birth.toMillis(), instant);
      total += lords.filter((lord) => (sig.get(lord) ?? []).some((h) => matter.houses.includes(h))).length;
      if (!seen.has(e.matter)) {
        const sub = frame.cusps[matter.cusp - 1].subLord;
        total += Number((sig.get(sub) ?? []).some((h) => matter.houses.includes(h)));
        seen.add(e.matter);
      }
    }
    samples.push(total);
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
  const actual = v.summary.kpScore;
  const percentile = Math.round(100 * (samples.filter((x) => x < actual).length + samples.filter((x) => x === actual).length / 2) / samples.length);
  assert.deepEqual([v.baseline?.kp.mean, v.baseline?.kp.sd, v.baseline?.kp.percentile],
    [Math.round(10 * mean) / 10, Math.round(10 * sd) / 10, percentile]);
});

test("ALP bands keep custom, unfavourable and post-death events unavailable", () => {
  const invalid = [
    { ...request[0], outcome: "unfavourable" as const },
    { ...request[0], houses: [1, 7] },
  ];
  for (const event of invalid) {
    const scan = rectify({ chart, windowMinutes: 1, events: [event], includeComparisons: false });
    assert.ok(scan.alpComparisonBands!.every((b) => b.max === 0 && !b.baseline));
  }
  const scan = rectify({ chart: { ...chart, deathDate: "2015-01-01" }, windowMinutes: 1, events: request });
  assert.ok(scan.alpComparisonBands!.every((b) => b.max === 0 && !b.baseline));
});

test("ALP bands keep true UTC boundaries and civil labels for local mean time and midnight", () => {
  const historic = { ...chart, birthDate: "1890-01-01", birthTime: "00:00:00", timezone: "Europe/London",
    timeStandard: "lmt", longitude: -9.1333, latitude: 38.7167 };
  const marriage = { ...request[0], date: "1916-11-19", time: undefined, timezone: "Europe/London" };
  const scan = rectify({ chart: historic, windowMinutes: 1, events: [marriage], includeComparisons: false });
  const bands = scan.alpComparisonBands!;
  assert.equal(Date.parse(bands[0].startIso), birthInstant(historic).utc.toMillis() - 60000);
  assert.equal(Date.parse(bands.at(-1)!.endIso), birthInstant(historic).utc.toMillis() + 60000);
  assert.equal(bands[0].startDate, "1889-12-31");
  for (const band of bands) {
    assert.equal(birthInstant({ ...historic, birthDate: band.startDate, birthTime: band.start }).utc.toMillis(), Date.parse(band.startIso));
    assert.equal(birthInstant({ ...historic, birthDate: band.endDate, birthTime: band.end }).utc.toMillis(), Date.parse(band.endIso));
  }
});

test("KP aggregation retains distinct cusps and house sets and rejects contradictory natal inputs", () => {
  const kp = { hits: [true, false, true], cuspSubLord: "Mercury", promised: true, score: 3, max: 4 };
  const a = { matter: "child", cusp: 5, houses: [2, 5, 11], kp };
  assert.deepEqual(kpLegacyTotals([a, a]), { score: 5, max: 7 });
  assert.deepEqual(kpLegacyTotals([a, { ...a, houses: [5, 9] }]), { score: 6, max: 8 });
  assert.deepEqual(kpLegacyTotals([a, { ...a, cusp: 9 }]), { score: 6, max: 8 });
  assert.throws(() => kpLegacyTotals([a, { ...a, kp: { ...kp, promised: false } }]), /Inconsistent natal/);
});
