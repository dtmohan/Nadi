/**
 * Special stars counted from the birth star (shared/special-stars.ts): the 27-star count, the
 * merging of retrograde returns, the Mars stay threshold, the per-source readings, the gate for a
 * minor, the gentle plain wording, and the passages the server computes for a synthetic chart.
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import type { NakshatraPeriod } from "@shared/astro";
import { isSensitive } from "@shared/gentle";
import { withholdText } from "@shared/life-stage";
import {
  MARS_MIN_DAYS,
  NAMED_STARS,
  STAR_PLANETS,
  specialStars,
  starCount,
  starPassages,
  starReadings,
} from "@shared/special-stars";
import { computeChart } from "../server/routes";

const day = (n: number) =>
  new Date(Date.UTC(2000, 0, 1) + n * 864e5).toISOString();
const period = (
  planet: NakshatraPeriod["planet"],
  nak: number,
  from: number,
  to: number,
): NakshatraPeriod => ({
  planet,
  nakshatraIndex: nak,
  start: day(from),
  end: day(to),
  retrogradeEntry: false,
});

test("the count is in 27 stars with the birth star first", () => {
  assert.equal(starCount(0, 0), 1);
  assert.equal(starCount(0, 1), 2);
  assert.equal(starCount(0, 26), 27);
  assert.equal(starCount(10, 9), 27);
  assert.equal(starCount(10, 24), 15);
  // Sanghatika is the 16th and Vainashika the 23rd (Sutton's text, the quoted verses, Kane).
  assert.equal(NAMED_STARS.find((s) => s.name === "Sanghatika")!.count, 16);
  assert.equal(NAMED_STARS.find((s) => s.name === "Vainashika")!.count, 23);
});

test("a retrograde return joins the earlier stay; a return after a full cycle does not", () => {
  // Birth star Ashwini (0): star 24 is the 25th (Manasa), star 23 the 24th (not named).
  const ps = [
    period("Saturn", 24, 0, 100),
    period("Saturn", 23, 100, 160),
    period("Saturn", 24, 160, 400),
    period("Saturn", 24, 10_000, 10_300),
  ];
  const out = starPassages(ps, 0);
  assert.equal(out.length, 2);
  assert.equal(out[0].count, 25);
  assert.equal(out[0].start, day(0));
  assert.equal(out[0].end, day(400));
  assert.equal(out[0].days, 340);
  assert.equal(out[0].returns, true);
  assert.equal(out[1].returns, false);
});

test("Mars is kept only when it stays six weeks or more", () => {
  const out = starPassages(
    [period("Mars", 0, 0, 30), period("Mars", 9, 400, 400 + MARS_MIN_DAYS + 5)],
    0,
  );
  assert.deepEqual(
    out.map((p) => p.count),
    [10],
  );
});

test("each source reads by the planet's nature, and Jupiter is never read as a malefic", () => {
  const sat1 = starReadings("Saturn", 1);
  assert.deepEqual(
    sat1.map((r) => r.source),
    ["phaladeepika", "sarvatobhadra", "sutton"],
  );
  assert.ok(
    sat1[0].sensitive && sat1[1].sensitive,
    "danger to life and death are tagged",
  );
  const jup1 = starReadings("Jupiter", 1);
  assert.equal(jup1[0].tone, "mixed");
  assert.ok(jup1.every((r) => !r.sensitive));
  assert.equal(jup1[1].tone, "support");
  // Sutton gives nothing for a benefic in the 25th, and names Saturn, Mars and Rahu (not Ketu) for the 23rd.
  assert.equal(starReadings("Jupiter", 25).length, 0);
  assert.ok(starReadings("Rahu", 23).some((r) => r.source === "sutton"));
  assert.ok(!starReadings("Ketu", 23).some((r) => r.source === "sutton"));
  // The quoted Sarvatobhadra verses are for practitioners only.
  for (const p of STAR_PLANETS)
    for (const s of NAMED_STARS)
      for (const r of starReadings(p, s.count))
        if (r.source === "sarvatobhadra") assert.equal(r.plain, "");
});

test("plain wording is gentle, and only the tagged readings carry withheld topics", () => {
  for (const p of STAR_PLANETS)
    for (const s of NAMED_STARS)
      for (const r of starReadings(p, s.count)) {
        if (r.plain) {
          assert.ok(!isSensitive(r.plain), `${p} ${s.count}: ${r.plain}`);
          assert.ok(
            !withholdText(r.plain) || r.sensitive,
            `${p} ${s.count}: ${r.plain}`,
          );
        }
        if (withholdText(r.text))
          assert.ok(r.sensitive, `${p} ${s.count} untagged: ${r.text}`);
      }
});

test("a minor's reading drops the tagged readings and any passage left with none", () => {
  const passages = starPassages(
    [period("Saturn", 2, 0, 300), period("Saturn", 0, 1000, 1300)],
    0,
  ); // the 3rd star (Mantreswara only) and the birth star
  const adult = specialStars({
    passages,
    moonLon: 1,
    asOfIso: day(100),
    withheld: false,
  });
  const minor = specialStars({
    passages,
    moonLon: 1,
    asOfIso: day(100),
    withheld: true,
  });
  assert.equal(adult.passages.length, 2);
  assert.equal(
    adult.byPlanet.find((b) => b.planet === "Saturn")!.now!.count,
    3,
  );
  assert.equal(minor.passages.length, 1);
  assert.equal(minor.passages[0].count, 1);
  assert.ok(minor.passages[0].readings.every((r) => !r.sensitive));
  assert.equal(
    minor.byPlanet.find((b) => b.planet === "Saturn")!.now,
    undefined,
  );
  assert.equal(
    minor.byPlanet.find((b) => b.planet === "Saturn")!.next!.count,
    1,
  );
});

const SYNTHETIC: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "female",
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

test("the server sends merged passages through the named stars for all five planets", () => {
  const r = computeChart(SYNTHETIC);
  const ps = r.specialStars!;
  assert.ok(ps.length > 100);
  for (const planet of STAR_PLANETS)
    assert.ok(
      ps.some((p) => p.planet === planet),
      planet,
    );
  const named = new Set(NAMED_STARS.map((s) => s.count));
  assert.ok(ps.every((p) => named.has(p.count)));
  assert.ok(
    ps.filter((p) => p.planet === "Mars").every((p) => p.days >= MARS_MIN_DAYS),
  );
  // Saturn's passages agree with the chapter-70 ingresses they are made from.
  const sat = ps.filter((p) => p.planet === "Saturn" && !p.returns);
  for (const p of sat)
    assert.ok(
      r.saturnNakshatras!.some(
        (n) => n.start === p.start && n.nakshatraIndex === p.nakshatraIndex,
      ),
    );
  // Rahu and Ketu are always 13.5 stars apart, so they never share a star.
  const rahu = ps.filter((p) => p.planet === "Rahu");
  const ketu = ps.filter((p) => p.planet === "Ketu");
  for (const a of rahu)
    for (const b of ketu)
      if (
        Date.parse(a.start) < Date.parse(b.end) &&
        Date.parse(b.start) < Date.parse(a.end)
      )
        assert.notEqual(a.nakshatraIndex, b.nakshatraIndex);
});
