import { test } from "node:test";
import assert from "node:assert/strict";
import { SIGNS } from "../shared/astro";
import { pvrEventEvidence, pvrVargaSign } from "../shared/pvr-event-evidence";
import { birthInstant, julianDay, positionsAt, ascendantAt } from "../server/ephemeris";

test("D24 book and later PVR even-sign conventions stay separately named", () => {
  // In the 2000 book, example 22 places 19 Scorpio in Libra.
  assert.equal(SIGNS[pvrVargaSign("D24", 229, "book-2000-forward")], "Libra");
  // The later article specifies reverse counting from Cancer in even signs.
  assert.equal(SIGNS[pvrVargaSign("D24", 229, "article-2013-reverse-even")], "Aries");
  // Odd signs keep the same direction in both variants.
  assert.equal(pvrVargaSign("D24", 71, "book-2000-forward"), pvrVargaSign("D24", 71, "article-2013-reverse-even"));
});

test("book example 130 reconstructs its foreign-residence and education combinations", () => {
  // 10:38 gives the Taurus D9 and Gemini D24 alternatives described by Rao.
  // 1982 is a test date chosen to exercise Jupiter's period, not a claimed event date.
  const chart = { birthDate: "1966-11-30", birthTime: "10:38", timezone: "Asia/Kolkata",
    longitude: 77 + 47 / 60, latitude: 11 + 19 / 60 };
  const birth = birthInstant(chart).utc, jd = julianDay(birth), opts = { ayanamsa: "lahiri", nodeType: "mean" as const };
  const natal = positionsAt(jd, opts), lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const event = Date.parse("1982-07-01T06:30:00Z");
  const overseas = pvrEventEvidence("abroad", natal, lagna, birth.toMillis(), event);
  assert.equal(SIGNS[overseas.divisionFrame.ascendant], "Aries");
  assert.equal(overseas.divisionFrame.periods[0].planet, "Jupiter");
  assert.deepEqual(overseas.divisionFrame.periods[0].clues,
    ["owns house 12", "owns house 9", "occupies house 7", "conjoins Rahu"]);
  const education = pvrEventEvidence("education", natal, lagna, birth.toMillis(), event);
  assert.equal(SIGNS[education.divisionFrame.ascendant], "Gemini");
  assert.equal(education.divisionFrame.houseLord, "Mercury");
  assert.ok(education.divisionFrame.periods[0].clues.includes("fully aspects house 4"));
  assert.ok(education.divisionFrame.periods[0].clues.includes("conjoins house 4 lord Mercury"));
});
