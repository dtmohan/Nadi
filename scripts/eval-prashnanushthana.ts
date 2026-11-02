// Reproduce the astronomical inputs and Gulika-method comparison in the source audit.
// Run from the repository root: node --import tsx scripts/eval-prashnanushthana.ts
import { DateTime } from "luxon";
import { ascendantAt, gulikaLongitude, julianDay, keralaMandiLongitude, positionsAt } from "../server/ephemeris";
import { ashtamangalaFromGroups } from "@shared/rules-prasna";

const zone = "Asia/Kolkata";
const at = DateTime.fromISO("1994-11-11T19:25", { zone }).toUTC();
const jd = julianDay(at);
const latitude = 10 + 31 / 60;
const longitude = 76 + 13 / 60;
// Lahiri and the upper-limb sunrise are research assumptions, not stated in the worked chart.
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
const positions = positionsAt(jd, opts);
const lon = (planet: string) => positions.find((p) => p.planet === planet)!.lon;
const mandi = keralaMandiLongitude(jd, latitude, longitude, zone, opts);
const book = { ascendant: 30 + 17 + 32 / 60, sun: 6 * 30 + 25 + 9 / 60, moon: 10 * 30 + 10 + 55 / 60, mandi: 4 * 30 + 4 + 44 / 60 };
// A second question from ch. 13: apply the stated Yama Shukra method to the source's own
// stated sunrise and day length, so the ephemeris sunrise convention cannot explain the discrepancy.
const marriageAt = DateTime.fromISO("2008-12-11T08:25", { zone }).toUTC();
const marriageJd = julianDay(marriageAt);
const marriageLatitude = 15 + 50 / 60;
const marriageLongitude = 78 + 3 / 60;
const sourceSunrise = DateTime.fromISO("2008-12-11T06:38:44", { zone });
const sourceDayGhatis = 27 + 42 / 60;
const yamaGhatis = sourceDayGhatis * 6 / 30; // Thursday day constant = 6
const yamaInstant = sourceSunrise.plus({ seconds: yamaGhatis * 24 * 60 }).toUTC();
console.log(JSON.stringify({
  assumptions: { ayanamsa: opts.ayanamsa, sunrise: opts.sunrise, zone, latitude, longitude },
  bookDegrees: book,
  computedDegrees: {
    ascendant: ascendantAt(jd, latitude, longitude, opts),
    sun: lon("Sun"),
    moon: lon("Moon"),
    currentGulika: gulikaLongitude(jd, latitude, longitude, zone, opts).lon,
    keralaMandiResearch: mandi.lon,
  },
  keralaMandiRising: DateTime.fromMillis((mandi.risingJd - 2440587.5) * 86400000, { zone }).toISO(),
  cowrieExample: ashtamangalaFromGroups(34, 39, 35),
  differingInterpretations: {
    remainders: ashtamangalaFromGroups(32, 40, 36),
    oneThroughEight: ashtamangalaFromGroups(32, 40, 36, "one-through-eight"),
  },
  marriageQuestion: {
    lagnaBook: 8 * 30 + 20,
    lagnaComputed: ascendantAt(marriageJd, marriageLatitude, marriageLongitude, opts),
    sourceDayGhatis,
    yamaGhatis,
    yamaInstant: yamaInstant.setZone(zone).toISO(),
    yamaBook: 8 * 30 + 24 + 53 / 60,
    yamaComputedFromSourceSunrise: ascendantAt(julianDay(yamaInstant), marriageLatitude, marriageLongitude, opts),
  },
}, null, 2));
