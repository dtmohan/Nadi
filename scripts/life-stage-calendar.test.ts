import test from "node:test";
import assert from "node:assert/strict";
import { areaSeason, calendarAge, calendarDateAtAge, dateAtAge, heldAreasAt, lifeAsOf, seasonStart, sensitiveGate } from "../shared/life-stage";

test("age gates use the birthday in the chart timezone, including before UTC midnight", () => {
  const chart = { birthDate: "2008-03-01", timezone: "Asia/Kolkata" };
  const birth = "2008-02-29T18:30:00.000Z";
  const before = "2026-02-28T18:29:59.000Z";
  const birthday = "2026-02-28T18:30:00.000Z";
  assert.deepEqual(sensitiveGate(chart, birth, before), { withheld: true, ageYears: 17, minAge: 18 });
  assert.deepEqual(sensitiveGate(chart, birth, birthday), { withheld: false, ageYears: 18, minAge: 18 });
  assert.deepEqual(areaSeason("marriage", birth, before, chart), { inSeason: false, from: 18, fromDate: "2026-03-01" });
  assert.equal(heldAreasAt(birth, birthday, chart)("marriage"), false);
  assert.equal(seasonStart("marriage", birth, before, chart), "2026-03-01");
});

test("a western local birthday does not open at the earlier UTC date boundary", () => {
  const chart = { birthDate: "2008-03-01", timezone: "America/Los_Angeles" };
  const birth = "2008-03-01T08:00:00.000Z";
  assert.equal(sensitiveGate(chart, birth, "2026-03-01T07:59:59.000Z").withheld, true);
  assert.equal(sensitiveGate(chart, birth, "2026-03-01T08:00:00.000Z").withheld, false);
});

test("February 29 birthdays open March 1 in non-leap years", () => {
  const chart = { birthDate: "2008-02-29", timezone: "UTC" };
  const birth = "2008-02-29T00:00:00.000Z";
  assert.equal(calendarDateAtAge(birth, 16, chart), "2024-02-29");
  assert.equal(calendarDateAtAge(birth, 18, chart), "2026-03-01");
  assert.equal(sensitiveGate(chart, birth, "2026-02-28T23:59:59.000Z").withheld, true);
  assert.equal(sensitiveGate(chart, birth, "2026-03-01T00:00:00.000Z").withheld, false);
});

test("recorded passing uses its civil date even in UTC+14", () => {
  const chart = { birthDate: "2008-03-01", timezone: "Pacific/Kiritimati", deathDate: "2026-02-28" };
  const birth = "2008-02-29T10:00:00.000Z";
  const later = "2026-03-05T00:00:00.000Z";
  assert.equal(lifeAsOf(chart, later), "2026-02-28T12:00:00.000Z");
  assert.deepEqual(sensitiveGate(chart, birth, later), { withheld: true, ageYears: 17, minAge: 18 });
  assert.equal(areaSeason("marriage", birth, later, chart).inSeason, false);
  assert.equal(areaSeason("marriage", birth, lifeAsOf(chart, later), chart).inSeason, false);
});

test("unknown zones and invalid dates cannot open early", () => {
  const birth = "2008-01-01T23:00:00.000Z";
  assert.equal(sensitiveGate({}, birth, "2026-01-01T23:59:59.000Z").withheld, true);
  assert.equal(sensitiveGate({ timezone: "invalid/zone" }, birth, "2026-01-02T11:59:59.000Z").withheld, true);
  assert.equal(sensitiveGate({}, birth, "2026-01-02T12:00:00.000Z").withheld, false);
  assert.equal(calendarAge("invalid", "2026-01-01"), undefined);
  assert.equal(sensitiveGate({}, "invalid", "2026-01-01").withheld, true);
  assert.equal(areaSeason("marriage", "invalid", "2026-01-01").inSeason, false);
  assert.equal(seasonStart("marriage", "invalid", "2026-01-01"), "9999-12-31");
});

test("existing 365.25-day timing calculation stays unchanged", () => {
  const birth = "2008-02-29T00:00:00.000Z";
  const expected = new Date(Date.parse(birth) + 18 * 365.25 * 86400e3).toISOString().slice(0, 10);
  assert.equal(dateAtAge(birth, 18), expected);
});
