// Gates on sensitive readings, end to end on a synthetic chart: the agreement table's life span row is shown only
// against a recorded date of passing, and the gochara calendar withholds the danger houses for a minor before
// anything is rendered. The chart is synthetic (no real person's data).
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";

import type { Chart } from "@shared/schema";
import { buildReport } from "@shared/report";
import type { ReportDoc } from "@shared/report/types";
import { AGREEMENT_TOPIC_LABEL } from "@shared/agreement";
import { saturnShortName } from "@shared/gochara";
import { computeChart } from "../server/routes";
import { gocharaCalendar, calendarWithhold } from "../server/gochara-calendar";
import { julianDay } from "../server/ephemeris";

const ADULT: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "male",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Chennai, India",
  latitude: 13.0827,
  longitude: 80.2707,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
};

function lifeSpanRows(doc: ReportDoc): string[][] {
  const sec = doc.sections.find((s) => s.id === "agreement");
  if (!sec) return [];
  return sec.paras.flatMap((p) =>
    p.kind === "table" ? (p.rows ?? []).filter((r) => r[0] === AGREEMENT_TOPIC_LABEL.lifespan) : [],
  );
}

const closingText = (doc: ReportDoc) =>
  JSON.stringify(doc.sections[doc.sections.length - 1]);

test("agreement: no life span row for the living, in either reading", () => {
  const result = computeChart(ADULT);
  for (const plain of [false, true])
    assert.equal(lifeSpanRows(buildReport(result, { plain })).length, 0, `plain=${plain}`);
  assert.ok(!closingText(buildReport(result, { plain: false })).includes("run its course"));
});

test("agreement: the life span row returns against a recorded date of passing (practitioner reading only)", () => {
  const result = computeChart({ ...ADULT, deathDate: "2010-06-01" });
  const practitioner = buildReport(result, { plain: false });
  assert.equal(lifeSpanRows(practitioner).length, 1);
  assert.ok(closingText(practitioner).includes("run its course"));
  assert.equal(lifeSpanRows(buildReport(result, { plain: true })).length, 0);
});

test("calendar: a minor's danger houses are withheld before rendering; Saturn's passage keeps its practice name", () => {
  // Moon in Aries, first half of 2026: Saturn in sidereal Pisces is in the 12th, a PD 26.33 danger house.
  const jd0 = julianDay(DateTime.fromISO("2026-01-01T00:00:00Z", { zone: "utc" }));
  const opts = { ayanamsa: "lahiri", nodeType: "mean" as const };
  const open = gocharaCalendar(0, jd0, jd0 + 150, opts);
  const gated = gocharaCalendar(0, jd0, jd0 + 150, opts, undefined, true);
  const dangers = (c: typeof open) => c.planets.flatMap((p) => p.segments.filter((s) => s.danger));
  assert.ok(open.planets.find((p) => p.planet === "Saturn")!.segments.some((s) => s.danger));
  assert.equal(dangers(gated).length, 0);
  assert.ok(open.notes.some((n) => /danger houses/.test(n)));
  assert.ok(!gated.notes.some((n) => /danger/.test(n)));
  assert.equal(gated.saturnPassages[0]?.house, 12);
  assert.equal(saturnShortName(gated.saturnPassages[0]!.house), "Sade Sati, first phase");
});

test("calendar gate: decided on the server from the birth instant, withheld by default, never loosened by the caller", () => {
  const now = "2026-10-08T12:00:00.000Z";
  assert.equal(calendarWithhold({}, now), true);
  assert.equal(calendarWithhold({ birthUtc: "not a date" }, now), true);
  assert.equal(calendarWithhold({ birthUtc: "1975-03-14T00:40:00.000Z" }, now), false);
  assert.equal(calendarWithhold({ birthUtc: "2015-05-01T00:00:00.000Z" }, now), true);
  assert.equal(calendarWithhold({ birthUtc: "2015-05-01T00:00:00.000Z", withhold: false }, now), true);
  assert.equal(calendarWithhold({ birthUtc: "1975-03-14T00:40:00.000Z", withhold: true }, now), true);
  // A life that ended in childhood stays gated; one that ended in adulthood does not.
  assert.equal(calendarWithhold({ birthUtc: "1975-03-14T00:40:00.000Z", deathDate: "1985-01-01" }, now), true);
  assert.equal(calendarWithhold({ birthUtc: "1950-01-01T00:00:00.000Z", deathDate: "2010-01-01" }, now), false);
});
