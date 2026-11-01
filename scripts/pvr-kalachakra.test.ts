import { test } from "node:test";
import assert from "node:assert/strict";
import { SIGNS } from "../shared/astro";
import { pvrKalachakraAt } from "../shared/pvr-kalachakra";
import { vimshottariPathAt } from "../shared/vimshottari-depth";
import { birthInstant, julianDay, positionsAt } from "../server/ephemeris";

const DAY = 86_400_000;
const YEAR = 360 * DAY;
const birth = Date.UTC(2000, 0, 1);
const sign = (i: number) => SIGNS[i];
const approx = (a: number, b: number, tolerance = 1) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test("Rao example 95 continues into the next pada rather than repeating nine signs", () => {
  // Moon 15°50' Taurus: Rohini pada 2, 75% elapsed.
  const moon = 30 + 15 + 50 / 60;
  const atBirth = pvrKalachakraAt(moon, birth, birth);
  assert.deepEqual(atBirth.birthSequence.map(sign), ["Virgo", "Libra", "Scorpio", "Pisces", "Aquarius", "Capricorn", "Sagittarius", "Scorpio", "Libra"]);
  assert.equal(atBirth.totalYears, 83);
  assert.equal(sign(atBirth.major.sign), "Scorpio");
  approx(atBirth.major.endMs, birth + 4.75 * YEAR, 10);
  assert.equal(sign(pvrKalachakraAt(moon, birth, birth + 5 * YEAR).major.sign), "Libra");
  assert.equal(sign(pvrKalachakraAt(moon, birth, birth + 21 * YEAR).major.sign), "Virgo");
});

test("Rao example 96 gives Pisces balance then Scorpio", () => {
  const path = pvrKalachakraAt(93, birth, birth);
  assert.equal(path.nakshatra, "Punarvasu");
  assert.equal(path.pada, 4);
  assert.equal(path.totalYears, 86);
  assert.equal(sign(path.major.sign), "Pisces");
  approx(path.major.endMs, birth + 8.6 * YEAR, 10);
  assert.equal(sign(pvrKalachakraAt(93, birth, birth + 9 * YEAR).major.sign), "Scorpio");
});

test("major/subperiod boundaries are half-open and honor repeated wheel signs", () => {
  const initial = pvrKalachakraAt(45 + 50 / 60, birth, birth);
  const atBoundary = pvrKalachakraAt(45 + 50 / 60, birth, initial.sub.endMs);
  assert.equal(atBoundary.sub.startMs, initial.sub.endMs);
  assert.notEqual(atBoundary.sub.wheelIndex, initial.sub.wheelIndex);
  const next = pvrKalachakraAt(45 + 50 / 60, birth, initial.major.endMs);
  assert.equal(next.major.startMs, initial.major.endMs);
  assert.equal(sign(next.major.sign), "Libra");
});

test("Rao's example 130 reproduces the book's original Taurus/Pisces period", () => {
  const chart = { birthDate: "1966-11-30", birthTime: "10:36", timezone: "Asia/Kolkata",
    longitude: 77 + 47 / 60, latitude: 11 + 19 / 60 };
  const instant = birthInstant(chart).utc;
  const moon = positionsAt(julianDay(instant), { ayanamsa: "lahiri", nodeType: "mean" }).find((p) => p.planet === "Moon")!;
  const date = Date.parse("1996-12-15T06:30:00Z");
  const result = pvrKalachakraAt(moon.lon, instant.toMillis(), date);
  assert.equal(sign(result.major.sign), "Taurus");
  assert.equal(sign(result.sub.sign), "Pisces");
  // The book gives April 1997 for the beginning of Aries, rounded to a month.
  assert.equal(new Date(result.sub.endMs).toISOString().slice(0, 7), "1997-04");
});

test("the book's approximate corrected clock does not force the approximate target date", () => {
  const chart = { birthDate: "1966-11-30", birthTime: "10:42:30", timezone: "Asia/Kolkata",
    longitude: 77 + 47 / 60, latitude: 11 + 19 / 60 };
  const instant = birthInstant(chart).utc;
  const moon = positionsAt(julianDay(instant), { ayanamsa: "lahiri", nodeType: "mean" }).find((p) => p.planet === "Moon")!;
  const result = pvrKalachakraAt(moon.lon, instant.toMillis(), Date.parse("1996-12-31T06:30:00Z"));
  assert.equal(sign(result.major.sign), "Taurus");
  assert.equal(sign(result.sub.sign), "Aries");
  // Rao approximates a Taurus subperiod beginning by the end of 1996. With
  // these explicit settings and an exact ephemeris it starts around Jan 20.
  assert.equal(new Date(result.sub.endMs).toISOString().slice(0, 10), "1997-01-20");
});

test("named dasha-year conventions preserve Nadi's default", () => {
  const event = birth + 17 * 365.25 * DAY;
  assert.deepEqual(vimshottariPathAt(11, birth, event, 3), vimshottariPathAt(11, birth, event, 3, { yearDays: 365.25 }));
  assert.notEqual(vimshottariPathAt(11, birth, event, 3)[0].endMs,
    vimshottariPathAt(11, birth, event, 3, { yearDays: 360 })[0].endMs);
  assert.throws(() => pvrKalachakraAt(0, birth, birth - 1), RangeError);
  assert.throws(() => vimshottariPathAt(0, birth, birth, 3, { yearDays: 0 }), RangeError);
});
