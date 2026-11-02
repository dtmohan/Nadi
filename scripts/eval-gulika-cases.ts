// Fixed public-case evaluation: see docs/gulika-mandi-validation-protocol.md.
// Run from repository root: node --import tsx scripts/eval-gulika-cases.ts
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay } from "../server/ephemeris";
import { SIGNS } from "@shared/astro";
import { GULIKA_METHODS } from "@shared/gulika-methods";

const cases = [
  { name: "Nina Simone", at: "1933-02-21T06:00:00", zone: "UTC-5", latitude: 35 + 12 / 60, longitude: -(82 + 14 / 60) },
  { name: "Glenn T. Seaborg", at: "1912-04-19T04:30:00", zone: "UTC-6", latitude: 46 + 29 / 60, longitude: -(87 + 40 / 60) },
  { name: "Terence Hill", at: "1939-03-29T15:05:00", zone: "UTC+1", latitude: 45 + 27 / 60, longitude: 12 + 21 / 60 },
  { name: "Chaka Khan", at: "1953-03-23T21:05:00", zone: "UTC-6", latitude: 42 + 18 / 60, longitude: -(87 + 50 / 60) },
  // This separately selected follow-up set was fixed after the first set had no fifth-house cases.
  { name: "France Gall", at: "1947-10-09T07:30:00", zone: "UTC+1", latitude: 48 + 52 / 60, longitude: 2 + 20 / 60 },
  { name: "Zoë Saldaña", at: "1978-06-19T08:49:00", zone: "UTC-4", latitude: 40 + 51 / 60, longitude: -(74 + 8 / 60) },
  { name: "Alberto Gironella", at: "1929-09-26T20:00:00", zone: "UTC-6", latitude: 19 + 24 / 60, longitude: -(99 + 9 / 60) },
  { name: "Aldo Miyashiro", at: "1976-02-09T16:23:00", zone: "UTC-5", latitude: -(12 + 7 / 60), longitude: -(77 + 2 / 60) },
  // A final set fixed after the first two batches had no fifth-house cases; see protocol.
  { name: "Penélope Cruz", at: "1974-04-28T07:00:00", zone: "UTC+2", latitude: 40 + 32 / 60, longitude: -(3 + 38 / 60) },
  { name: "Antonio Banderas", at: "1960-08-10T21:00:00", zone: "UTC+1", latitude: 36 + 43 / 60, longitude: -(4 + 25 / 60) },
  { name: "Ronaldinho", at: "1980-03-21T03:20:00", zone: "UTC-3", latitude: -(30 + 1 / 60 + 59 / 3600), longitude: -(51 + 13 / 60 + 48 / 3600) },
  { name: "Neymar", at: "1992-02-05T02:15:00", zone: "UTC-2", latitude: -(23 + 31 / 60), longitude: -(46 + 11 / 60) },
  { name: "Sebastián Piñera", at: "1949-12-01T05:30:00", zone: "UTC-4", latitude: -(33 + 27 / 60), longitude: -(70 + 40 / 60) },
] as const;
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
const offsets = [-15, -5, 0, 5, 15];

const results = cases.map((subject) => {
  const instant = DateTime.fromISO(subject.at, { zone: subject.zone });
  if (!instant.isValid) throw new Error(`Invalid fixed offset: ${subject.zone}`);
  const samples = offsets.map((minutes) => {
    const at = instant.plus({ minutes });
    const jd = julianDay(at.toUTC());
    const asc = ascendantAt(jd, subject.latitude, subject.longitude, opts);
    const ascSign = Math.floor(asc / 30);
    const points = gulikaComparisons(jd, subject.latitude, subject.longitude, subject.zone, opts);
    const values = Object.fromEntries(GULIKA_METHODS.map(({ id }) => {
      const point = points[id];
      return [id, {
        longitude: point.lon,
        sign: SIGNS[point.signIndex],
        house: (point.signIndex - ascSign + 12) % 12 + 1,
        day: point.day,
      }];
    }));
    return { offsetMinutes: minutes, localTime: at.toFormat("HH:mm"), ascendant: SIGNS[ascSign], values };
  });
  const fifthAt = samples.filter((s) => s.values["kerala-ghati"].house === 5).map((s) => s.offsetMinutes);
  return {
    name: subject.name,
    birthData: { local: subject.at, zone: subject.zone, latitude: subject.latitude, longitude: subject.longitude },
    recordedParent: true,
    nominal: samples.find((s) => s.offsetMinutes === 0),
    sensitivity: samples.map((s) => ({ offsetMinutes: s.offsetMinutes, localTime: s.localTime, ascendant: s.ascendant, ...s.values["kerala-ghati"] })),
    literalFifthHouseClaim: fifthAt.length === 0 ? "not triggered in the sampled times" :
      fifthAt.length === samples.length ? "contradicted at every sampled time" : "contradicted at sampled times: " + fifthAt.join(", ") + " minutes",
  };
});
console.log(JSON.stringify({
  protocol: "docs/gulika-mandi-validation-protocol.md",
  assumptions: opts,
  limitations: "Parent-selected, non-random, not blind; a non-trigger is not a positive fit and ± samples do not prove the true time.",
  results,
}, null, 2));
