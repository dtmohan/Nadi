import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay, saturnPortionIndex, sunriseBefore } from "../server/ephemeris";
import { computeChart } from "../server/routes";
import { computeGulikaReading, computeSphutas } from "@shared/rules-prasna";
import { DEFAULT_GULIKA_METHOD, GULIKA_METHODS, normaliseGulikaMethod } from "@shared/gulika-methods";
import type { Chart } from "@shared/schema";

const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
const jd = (local: string, zone: string) => julianDay(DateTime.fromISO(local, { zone }).toUTC());
const delta = (actual: number, expected: number) => Math.abs((((actual - expected) + 540) % 360) - 180);

test("Saturn's index uses seven weekday lords for all days and nights", () => {
  const day = [6, 5, 4, 3, 2, 1, 0];
  const night = [2, 1, 0, 6, 5, 4, 3];
  for (let weekday = 0; weekday < 7; weekday++) {
    assert.equal(saturnPortionIndex(weekday, true), day[weekday]);
    assert.equal(saturnPortionIndex(weekday, false), night[weekday]);
  }
  assert.throws(() => saturnPortionIndex(7, true));
  assert.throws(() => saturnPortionIndex(-1, false));
});

test("Poddar's printed night Mandi table differs from a seven-lord midpoint on four nights", () => {
  // 26 Jan 2023 is Thursday; sample consecutive day and night periods for every weekday.
  // Poddar's printed table has night values 10, 6, 2, 30, 26, 22, 18 over 32, while
  // the seven-lord Saturn midpoint gives 10, 6, 2, 26, 22, 18, 14 over 32.
  const zone = "Asia/Kolkata", lat = 23.0225, lon = 72.5714;
  for (let i = 0; i < 7; i++) {
    const date = DateTime.fromISO("2023-01-22", { zone }).plus({ days: i }); // Sunday first
    for (const hour of [12, 22]) {
      const values = gulikaComparisons(julianDay(date.set({ hour }).toUTC()), lat, lon, zone, opts);
      const eighth = values["saturn-end"].risingJd - values["saturn-start"].risingJd;
      const difference = values["poddar-table"].risingJd - values["saturn-middle"].risingJd;
      const expected = hour === 22 && i >= 3 ? eighth : 0;
      assert.ok(Math.abs(difference - expected) * 86400 < 0.01, `${date.toISODate()} hour ${hour}`);
    }
  }
});

test("Poddar's JFK example: end and midpoint reproduce the printed longitudes approximately", () => {
  // Sarajit Poddar, Aprakash Grahas, Upagrahas & Pranapada, pp. 3–4:
  // 29 May 1917, 15:00, Brookline 42°20′ N 71°07′ W, fixed UTC−5. His sunrise and sunset
  // are rounded source values, so independently computed rise/set times differ slightly.
  const lat = 42 + 20 / 60, lon = -(71 + 7 / 60), zone = "UTC-5";
  const v = gulikaComparisons(jd("1917-05-29T15:00", zone), lat, lon, zone, opts);
  const bookEnd = 150 + 10 + 35 / 60 + 28 / 3600;
  const bookMiddle = 120 + 29 + 37 / 60 + 22 / 3600;
  assert.ok(delta(v["saturn-end"].lon, bookEnd) < 0.06);
  assert.ok(delta(v["saturn-middle"].lon, bookMiddle) < 0.10);
  // Holding the book's own stated rising instant fixed isolates the ascendant computation.
  const bookRise = jd("1917-05-29T13:34:31", zone);
  assert.ok(delta(ascendantAt(bookRise, lat, lon, opts), bookEnd) < 0.002);
});

test("BPHS translation's Friday-night Delhi example uses the start of Saturn's portion", () => {
  // BPHS English translation, ch. 4 example, 17 Feb 1984 22:35 IST, Delhi. Book's Gulika:
  // 208°32′06″. It does not state the coordinates or rise/set convention; Delhi's modern
  // centre is an assumption, so a 0.3° tolerance is appropriate for this example only.
  const zone = "Asia/Kolkata";
  const v = gulikaComparisons(jd("1984-02-17T22:35", zone), 28.6139, 77.209, zone, opts);
  const book = 208 + 32 / 60 + 6 / 3600;
  assert.equal(v["saturn-start"].day, false);
  assert.ok(delta(v["saturn-start"].lon, book) < 0.30);
  assert.ok(delta(v["saturn-end"].lon, book) > 10); // the earlier incorrect eight-lord night cycle
});

test("published Ahmedabad day and night examples retain their stated start convention", () => {
  // Bhadoriya and Joshi, Astrological Study of Mandi, examples 1 and 2 (26 Jan 2023).
  // The stated 10:08:30 and 02:30:15 rising times use rounded sunrise/sunset; geographic
  // coordinates and ayanamsa are unstated, so these are approximate comparisons.
  const zone = "Asia/Kolkata", lat = 23.0225, lon = 72.5714;
  const day = gulikaComparisons(jd("2023-01-26T14:00", zone), lat, lon, zone, opts);
  const night = gulikaComparisons(jd("2023-01-26T20:00", zone), lat, lon, zone, opts);
  const bookDay = 330 + 2 + 29 / 60, bookNight = 210 + 2 + 59 / 60;
  assert.ok(delta(day["saturn-start"].lon, bookDay) < 0.8);
  assert.ok(delta(night["saturn-start"].lon, bookNight) < 0.30);
  assert.ok(delta(ascendantAt(jd("2023-01-26T10:08:30", zone), lat, lon, opts), bookDay) < 0.15);
  assert.ok(delta(ascendantAt(jd("2023-01-27T02:30:15", zone), lat, lon, opts), bookNight) < 0.05);
});

test("1994 book's Mandi is near the midpoint with true-centre sunrise, as a hypothesis", () => {
  const zone = "Asia/Kolkata";
  const v = gulikaComparisons(jd("1994-11-11T19:25", zone), 10 + 31 / 60, 76 + 13 / 60, zone,
    { ...opts, sunrise: "centre-true" });
  const printed = 120 + 4 + 44 / 60;
  assert.ok(delta(v["saturn-middle"].lon, printed) < 0.01);
  assert.ok(delta(v["kerala-ghati"].lon, printed) > 6);
  // The book does not disclose these settings: the close match is not proof of its method.
});

test("before sunrise belongs to the preceding night and flips exactly at sunrise", () => {
  const zone = "Asia/Kolkata", lat = 23.0225, lon = 72.5714;
  const rise = sunriseBefore(jd("2023-01-26T12:00", zone), lat, lon, opts.sunrise);
  const before = gulikaComparisons(rise - 2 / 86400, lat, lon, zone, opts);
  const after = gulikaComparisons(rise + 2 / 86400, lat, lon, zone, opts);
  assert.equal(before["kerala-ghati"].day, false);
  assert.equal(after["kerala-ghati"].day, true);
  assert.notEqual(before["kerala-ghati"].risingJd, after["kerala-ghati"].risingJd);
});

test("a fifth-house Gulika does not assert that a person is childless", () => {
  const reading = computeGulikaReading({ signIndex: 10, day: true }, 6);
  assert.equal(reading.house, 5);
  assert.match(reading.text, /cannot establish whether someone has children/i);
  assert.doesNotMatch(reading.text, /deprived of issues|will not have children/i);
});

test("chart selection drives the birth and snapshot points and dependent sphutas", () => {
  const chart: Chart = {
    id: 1, name: "Published Delhi example", gender: "unspecified", birthDate: "1984-02-17",
    birthTime: "22:35", timezone: "Asia/Kolkata", timeStandard: "zone", place: "New Delhi, India",
    latitude: 28.6139, longitude: 77.209, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge",
    parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [],
  };
  assert.equal(normaliseGulikaMethod(undefined), DEFAULT_GULIKA_METHOD);
  assert.equal(normaliseGulikaMethod("unknown"), DEFAULT_GULIKA_METHOD);
  const chosen = computeChart(chart);
  assert.deepEqual(chosen.gulika, chosen.gulikaComparisons![DEFAULT_GULIKA_METHOD]);
  for (const method of GULIKA_METHODS) {
    const result = computeChart({ ...chart, gulikaMethod: method.id });
    assert.deepEqual(result.gulika, result.gulikaComparisons![method.id]);
    assert.deepEqual(result.now.gulika, result.now.gulikaComparisons![method.id]);
    assert.deepEqual(result.positions, chosen.positions);
    assert.deepEqual(result.reading, chosen.reading); // no new KP or Parashari event score is inferred
    const lon = (planet: string) => result.positions.find((p) => p.planet === planet)!.lon;
    const sphuta = computeSphutas(result.jaimini.lagna.lon, lon("Moon"), lon("Sun"), lon("Rahu"), result.gulika!.lon);
    assert.ok(delta(sphuta.thrisphuta, (result.jaimini.lagna.lon + lon("Moon") + result.gulika!.lon) % 360) < 1e-8);
  }
});
