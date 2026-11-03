import test from "node:test";
import assert from "node:assert/strict";
import { describePosition, drishtiQuarters, naturalBenefic, PLANETS, type Planet } from "@shared/astro";
import { formatHouseQuarters, houseQuarterContexts, houseQuarterFrames, pointDispositors, wholeSignHouseArcs } from "@shared/house-dispositor-context";
import { createPlanetContext } from "@shared/planet-context";
import { lordDistance } from "@shared/parashari-bhavat";
import { judgeBhavas, LORD_ASPECT_SOURCE } from "@shared/parashari-houses";
import { rashiHouseView } from "@shared/house-view";
import { createParashariNatalCatalogue, dateParashariNatalCatalogue } from "@shared/parashari-event-natal-rules";
import { zodiacQuarter } from "@shared/zodiac-quarter";

test("lord distance uses zodiac signs and separately retains the selected bhava count", () => {
  const bhavas = [
    { house: 5, signIndex: 10, lord: "Saturn" as const, lordIn: 12, lordSignIndex: 6 },
    { house: 4, signIndex: 9, lord: "Saturn" as const, lordIn: 12, lordSignIndex: 6 },
  ];
  const fifth = lordDistance({ bhavas, lagna: { signIndex: 6 } }, 5);
  assert.deepEqual([fifth.places, fifth.bhavaPlaces, fifth.lordIn, fifth.resonance], [9, 8, 12, false]);
  assert.match(fifth.text, /Aquarius.*Saturn in Libra.*9th sign.*12th/);
  const fourth = lordDistance({ bhavas, lagna: { signIndex: 6 } }, 4);
  assert.deepEqual([fourth.places, fourth.bhavaPlaces], [10, 9]);
  assert.equal(lordDistance({ bhavas }, 4).resonanceAssessed, false);
  // If a chalit midpoint sign does not correspond to its ordinal house, compare
  // sign counts to the lagna, not to that different house ordinal.
  const shifted = [{ house: 4, signIndex: 10, lord: "Saturn" as const, lordIn: 8, lordSignIndex: 2 }];
  assert.equal(lordDistance({ bhavas: shifted, lagna: { signIndex: 6 } }, 4).resonance, true);
});

test("an own-lord aspect is a separate qualified clue even for a natural malefic", () => {
  const positions = PLANETS.map((p) => describePosition(p, (p === "Sun" ? 10 : p === "Saturn" ? 0 : 2) * 30 + 10, 1));
  const judgements = judgeBhavas(positions, rashiHouseView(0, positions), {
    aspect: (p, from, to) => drishtiQuarters(p, from, to) === 4 ? 4 : 0, benefic: naturalBenefic,
  });
  const fifth = judgements[4];
  assert.deepEqual(fifth.support, []);
  assert.deepEqual(fifth.strain, []);
  assert.equal(fifth.tone, "none");
  assert.equal(fifth.lordAspectClue?.planet, "Sun");
  assert.deepEqual(fifth.lordAspectClue?.source, LORD_ASPECT_SOURCE);
  assert.match(fifth.lordAspectClue!.text, /does not establish the complete rule/);
  // The exact same assessment is reused for a mapped topic and every date.
  const natal = createParashariNatalCatalogue({ houseMethod: "rashi", aspectFloor: 4,
    bhavas: [], findings: [], bhavaJudgement: judgements })("child")!;
  assert.deepEqual(natal.assessment, fifth);
  assert.deepEqual(dateParashariNatalCatalogue(natal, ["Sun", "Mercury", "Mars"])!.natal, natal);
  assert.deepEqual(dateParashariNatalCatalogue(natal, ["Venus", "Moon", "Saturn"])!.natal, natal);
});

test("whole-sign houses contain nine quarters with all four star-split patterns", () => {
  const context = createPlanetContext([], { kind: "natal", division: "D1", ascendant: 0 });
  const houses = houseQuarterContexts("rashi", wholeSignHouseArcs(context));
  const splits = new Set<string>();
  for (const h of houses) {
    assert.equal(h.segments.length, 9);
    assert.ok(h.segments.every((p) => !p.partial && p.signIndex === h.house - 1));
    const groups: number[] = [];
    let previous = "";
    for (const q of h.segments) {
      if (q.star !== previous) groups.push(0);
      groups[groups.length - 1]++;
      previous = q.star;
    }
    splits.add(groups.join("+"));
  }
  assert.deepEqual(Array.from(splits).sort(), ["1+4+4", "2+4+3", "3+4+2", "4+4+1"]);
  assert.equal(formatHouseQuarters(houses[0]), "Aries · Ashwini 1–4; Aries · Bharani 1–4; Aries · Krittika 1");
});

test("shifted and unequal spans retain partial quarters and wrap at zero", () => {
  for (const [start, end, width, count] of [[359, 29, 30, 10], [1, 31, 30, 10], [12, 58, 46, 15]] as const) {
    const row = houseQuarterContexts("test", [{ house: 1, start, end }])[0];
    assert.equal(row.segments.length, count);
    assert.ok(row.segments[0].partial && row.segments.at(-1)!.partial);
    assert.equal((formatHouseQuarters(row).match(/\(partial\)/g) ?? []).length, 2);
    assert.ok(Math.abs(row.segments.reduce((n, p) => n + p.length, 0) - width) < 1e-10);
    for (const s of row.segments) assert.equal(zodiacQuarter(s.start + s.length / 2).navamsaSign, s.navamsaSign);
  }
  assert.throws(() => houseQuarterContexts("bad", [{ house: 1, start: 0, end: 0 }]), RangeError);
  assert.throws(() => houseQuarterContexts("bad", [{ house: 1, start: NaN, end: 30 }]), RangeError);
  for (let edge = 0; edge < 108; edge++) {
    const start = edge * 10 / 3;
    const aligned = houseQuarterContexts("aligned", [{ house: 1, start, end: start + 30 }])[0];
    assert.equal(aligned.segments.length, 9, `quarter edge ${edge}`);
    assert.ok(aligned.segments.every((q) => !q.partial), `quarter edge ${edge}`);
    const shifted = houseQuarterContexts("shifted", [{ house: 1, start: start + 1e-7, end: start + 30 + 1e-7 }])[0];
    assert.equal(shifted.segments.length, 10, `just after quarter edge ${edge}`);
  }
});

test("each dispositor is resolved in the same frame, with explicit missing data and D9 houses", () => {
  const positions = PLANETS.map((p, i) => describePosition(p, i * 37 + 1, 1));
  const context = createPlanetContext(positions, { kind: "natal", ascendant: 185, ayanamsa: "lahiri", division: "D1" });
  const d = pointDispositors(context, "Saturn")!;
  for (const lord of d.lords) {
    const actual = context.requirePlanet(lord.planet);
    assert.equal(lord.location?.d1Sign, actual.position.signIndex);
    assert.equal(lord.location?.d1WholeSignHouse, actual.wholeSignHouse);
    assert.equal(lord.location?.d9Sign, zodiacQuarter(actual.position.lon).navamsaSign);
    assert.equal(lord.location?.d9WholeSignHouse, ((actual.nakshatra.navamsaSign - zodiacQuarter(185).navamsaSign + 12) % 12) + 1);
  }
  const incomplete = createPlanetContext([describePosition("Sun", 1, 1)], { kind: "natal", ascendant: 0 });
  assert.equal(pointDispositors(incomplete, "Sun")!.lords[0].location, undefined); // Mars missing
  assert.throws(() => pointDispositors(createPlanetContext(positions, { kind: "divisional", division: "D9" }), "Sun"));
  const kp = createPlanetContext(positions, { kind: "natal", houseMethod: "placidus", ascendant: 0,
    ayanamsa: "kp", cusps: Array.from({ length: 12 }, (_, i) => (i * 30 + 1) % 360) });
  const frames = houseQuarterFrames(kp);
  assert.deepEqual(frames.map((f) => f.label), ["Rashi (whole sign)", "KP Placidus cusps"]);
  assert.equal(frames[1].houses[0].segments.length, 10);
  assert.throws(() => houseQuarterFrames(context, { asc: 100, mc: 1 }));
});
