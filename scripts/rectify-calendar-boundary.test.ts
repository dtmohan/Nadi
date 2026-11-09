import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { resolveTimeBasis } from "../shared/time-basis";
import { eventReadingAllowed } from "../shared/event-reading";
import { sensitiveGate } from "../shared/life-stage";
import { rectificationCandidateChart } from "../server/rectify-age-context";
import { rectify } from "../server/rectify";

const chart = {
  name: "Synthetic boundary", birthDate: "2008-03-10", birthTime: "00:00:00",
  timezone: "UTC", timeStandard: "+05:30", place: "Example", latitude: 1, longitude: 1,
  ayanamsa: "lahiri", nodeType: "mean", deathDate: null,
} as const;

test("each cross-midnight candidate uses its own civil birthday for age gates", () => {
  const basis = resolveTimeBasis(chart.birthDate, chart.birthTime, chart.timezone, chart.longitude, chart.timeStandard);
  const before = DateTime.fromISO("2008-03-09T18:29:59Z", { setZone: true });
  const after = DateTime.fromISO("2008-03-09T18:30:00Z", { setZone: true });
  const first = rectificationCandidateChart(chart, before, basis);
  const second = rectificationCandidateChart(chart, after, basis);
  assert.equal(first.birthDate, "2008-03-09");
  assert.equal(second.birthDate, "2008-03-10");
  const asOf = "2026-03-09T12:00:00Z";
  assert.equal(eventReadingAllowed("marriage", before.toISO()!, asOf, first), true);
  assert.equal(eventReadingAllowed("marriage", after.toISO()!, asOf, second), false);
  assert.equal(sensitiveGate(first, before.toISO()!, asOf).withheld, false);
  assert.equal(sensitiveGate(second, after.toISO()!, asOf).withheld, true);
});

test("candidate dates preserve the seconds in a local-mean-time offset", () => {
  const lmt = { ...chart, timeStandard: "lmt", longitude: 1.01 };
  const basis = resolveTimeBasis(lmt.birthDate, lmt.birthTime, lmt.timezone, lmt.longitude, lmt.timeStandard);
  assert.equal(basis.offsetSeconds, 242);
  assert.equal(rectificationCandidateChart(lmt, DateTime.fromISO("2008-03-09T23:55:57Z", { setZone: true }), basis).birthDate, "2008-03-09");
  assert.equal(rectificationCandidateChart(lmt, DateTime.fromISO("2008-03-09T23:55:58Z", { setZone: true }), basis).birthDate, "2008-03-10");
});

test("rectification segments split at a midnight on the selected fixed-offset clock", () => {
  const scan = rectify({ chart, windowMinutes: 1, events: [], includeComparisons: false });
  const boundary = Date.parse("2008-03-09T18:30:00Z");
  assert.ok(scan.segments.some((s) => Date.parse(s.startIso) < boundary));
  assert.ok(scan.segments.some((s) => Date.parse(s.endIso) > boundary));
  assert.ok(scan.segments.every((s) => !(Date.parse(s.startIso) < boundary && Date.parse(s.endIso) > boundary)));
});
