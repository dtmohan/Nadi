import assert from "node:assert/strict";
import test from "node:test";
import { describePosition, type Planet, type PlanetPosition } from "@shared/astro";
import { computeAshtakavarga } from "@shared/ashtakavarga";
import { computeGochara, gocharaPlainEffect } from "@shared/gochara";
import { readKinTransits } from "@shared/kin-transits";
import { computePrasnaTransits, computePrasnaVedha, computePrasnaVipareetaVedha, PRASNA_TRANSIT_TONES } from "@shared/rules-prasna";
import { computeSarvartha } from "@shared/sarvartha";
import { periodLordMoonHouse } from "@shared/transit-context";
import { vimshottariPathAt } from "@shared/vimshottari-depth";
import { dasaStartTransits } from "../server/routes";
import { julianDay, positionsAt } from "../server/ephemeris";
import { DateTime } from "luxon";

const at = "2026-10-08T00:00:00.000Z";
const pos = (planet: Planet, sign: number, deg = 15): PlanetPosition => describePosition(planet, sign * 30 + deg, 1);
const basePlanets: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

test("Prasna passage tone reads negations and mixed passages, not keyword hits", () => {
  const check = (planet: Planet, house: number) => computePrasnaTransits(0, [pos(planet, house - 1)])[0];
  assert.equal(Object.values(PRASNA_TRANSIT_TONES).flat().length, 84);
  assert.equal(check("Saturn", 12).tone, "hard");
  assert.equal(check("Saturn", 2).tone, "hard");
  assert.equal(check("Sun", 6).tone, "good");
  assert.equal(check("Sun", 12).tone, "hard");
  assert.equal(check("Jupiter", 6).tone, "hard");
  assert.equal(check("Mars", 6).tone, "neutral");
  assert.equal(check("Mars", 10).tone, "good");
  assert.equal(check("Saturn", 10).tone, "neutral");
  const withheld = computePrasnaTransits(0, [pos("Saturn", 4)], true)[0];
  assert.equal(withheld.text, "");
  assert.equal(withheld.tone, "neutral");
});

test("Vedha keeps all obstructors and preserves the two Venus tables", () => {
  const all = computePrasnaVedha([pos("Sun", 2), pos("Mars", 8), pos("Jupiter", 8)], 0)
    .filter((r) => r.planet === "Sun");
  assert.deepEqual(all.map((r) => r.obstructor).sort(), ["Jupiter", "Mars"]);
  const exempt = computePrasnaVedha([pos("Sun", 2), pos("Saturn", 8)], 0);
  assert.ok(!exempt.some((r) => r.planet === "Sun"));
  const sky = [pos("Venus", 0), pos("Mars", 7)];
  assert.ok(!computePrasnaVedha(sky, 0, { venusVariant: "22.50" }).some((r) => r.planet === "Venus"));
  assert.equal(computePrasnaVedha(sky, 0, { venusVariant: "22.42" }).find((r) => r.planet === "Venus")?.vedhaHouse, 8);
  const differing = [pos("Venus", 8), pos("Mars", 10), pos("Moon", 3)];
  assert.equal(computePrasnaVedha(differing, 0, { venusVariant: "22.42" }).find((r) => r.planet === "Venus")?.obstructor, "Mars");
  assert.equal(computePrasnaVedha(differing, 0, { venusVariant: "22.50" }).find((r) => r.planet === "Venus")?.obstructor, "Moon");
});

test("Vipareeta Vedha uses reverse pairs and does not label a known favourable house adverse", () => {
  const reverse = computePrasnaVipareetaVedha([pos("Sun", 8), pos("Mars", 2)], 0);
  assert.deepEqual(reverse.find((r) => r.planet === "Sun"), { planet: "Sun", house: 9, vedhyaHouse: 3, counterObstructor: "Mars" });
  const favourableVenus = computePrasnaVipareetaVedha([pos("Venus", 0), pos("Mars", 2)], 0);
  assert.ok(!favourableVenus.some((r) => r.planet === "Venus"));
  assert.ok(!computePrasnaVipareetaVedha([pos("Sun", 8), pos("Saturn", 2)], 0).some((r) => r.planet === "Sun"));
});

test("gochara retains both an Ashtakavarga relief and a modifier that holds its good back", () => {
  const marks = { Saturn: Array.from({ length: 12 }, () => 5) };
  const s = computeGochara(0, [pos("Saturn", 7)], at, false, { ownMarks: marks }).rows[0];
  assert.equal(s.verdict, "neutral");
  assert.equal(s.voided, "both");
  assert.match(s.dignityNote!.text, /inimical.*good.*void/i);
  assert.match(gocharaPlainEffect(s), /marks ease.*while.*holds back/i);
  const strong = computeGochara(9, [pos("Saturn", 6)], at, false, { ownMarks: marks }).rows[0];
  assert.equal(strong.favourable, false);
  assert.match(strong.dignityNote!.text, /unfavourable Moon-house/);
  assert.doesNotMatch(strong.dignityNote!.text, /in a favourable house/);
});

test("gochara discloses competing aspect and applies combustion even in a strong sign", () => {
  const strong = computeGochara(0, [pos("Jupiter", 8), pos("Saturn", 6)], at).rows[0];
  assert.equal(strong.verdict, "favourable");
  assert.deepEqual(strong.modifierConflict?.by, ["Saturn"]);
  assert.match(strong.modifierConflict!.text, /priority is unresolved/i);
  const combust = computeGochara(0, [pos("Jupiter", 8, 15), pos("Sun", 8, 20)], at).rows[0];
  assert.equal(combust.combust, true);
  assert.equal(combust.verdict, "neutral");
  assert.match(combust.dignityNote!.text, /combust.*good.*void/i);
  const saturn = computeGochara(0, [pos("Saturn", 7, 15), pos("Sun", 7, 20)], at, false,
    { ownMarks: { Saturn: Array.from({ length: 12 }, () => 5) } }).rows[0];
  assert.equal(saturn.voided, "both");
  assert.match(gocharaPlainEffect(saturn), /Saturn is combust/);
});

test("Sarvartha 3.40 requires both aspects and the degree-bounded dignity", () => {
  const make = (sun: number, mars: number, degree: number) => basePlanets.map((p) =>
    p === "Jupiter" ? pos(p, 8, degree) : p === "Sun" ? pos(p, sun) : p === "Mars" ? pos(p, mars) : pos(p, 0));
  const find = (p: PlanetPosition[]) => computeSarvartha(p, 7 * 30).findings.find((f) => f.house === 2 && f.stanza === 40);
  assert.equal(find(make(7, 2, 5)), undefined);
  assert.equal(find(make(2, 7, 5)), undefined);
  assert.equal(find(make(2, 2, 10)), undefined);
  const yes = find(make(2, 2, 9.999));
  assert.ok(yes);
  assert.equal(yes.fidelity, "provisional");
  assert.match(yes.here!.join("; "), /Sun/);
  assert.match(yes.here!.join("; "), /Mars/);
  assert.match(yes.here!.join("; "), /moolatrikona degree range/);
});

test("Sarvartha 3.36 checks both conjunction-and-aspect and angular Mercury alternatives", () => {
  const make = (moon: number, mars: number, mercury: number) => basePlanets.map((p) =>
    p === "Moon" ? pos(p, moon) : p === "Mars" ? pos(p, mars) : p === "Mercury" ? pos(p, mercury) : pos(p, 4));
  const find = (p: PlanetPosition[]) => computeSarvartha(p, 0).findings.find((f) => f.house === 2 && f.stanza === 36);
  assert.equal(find(make(2, 1, 7)), undefined); // Mars alone in the 2nd is insufficient.
  assert.equal(find(make(1, 1, 1)), undefined); // Conjunction alone has no Mercury aspect.
  const aspected = find(make(1, 1, 7));
  assert.ok(aspected);
  assert.equal(aspected.fidelity, "provisional");
  assert.match(aspected.here!.join("; "), /Mars/);
  assert.match(aspected.here!.join("; "), /Moon/);
  assert.match(aspected.here!.join("; "), /2nd aspected by Mercury/);
  const angular = find(make(2, 2, 0));
  assert.ok(angular);
  assert.match(angular.here!.join("; "), /Mercury in the 1st/);
});

test("Sarvartha 3.41 requires the aspects of both Sun and Venus", () => {
  const make = (sun: number, venus: number) => basePlanets.map((p) =>
    p === "Jupiter" ? pos(p, 8, 5) : p === "Sun" ? pos(p, sun) : p === "Venus" ? pos(p, venus) : pos(p, 0));
  const find = (p: PlanetPosition[]) => computeSarvartha(p, 7 * 30).findings.find((f) => f.house === 2 && f.stanza === 41);
  assert.equal(find(make(7, 2)), undefined);
  assert.equal(find(make(2, 7)), undefined);
  const yes = find(make(2, 2));
  assert.ok(yes);
  assert.equal(yes.fidelity, "provisional");
  assert.match(yes.here!.join("; "), /Sun/);
  assert.match(yes.here!.join("; "), /Venus/);
});

test("Sarvartha 3.29 remains reference-only while its additional clauses are unresolved", () => {
  const planets = basePlanets.map((p) => pos(p, p === "Venus" || p === "Jupiter" ? 0 : 3));
  const result = computeSarvartha(planets, 0);
  assert.ok(!result.findings.some((f) => f.house === 2 && f.stanza === 29));
});

test("Mars passages display reduced marks without borrowing the eight-point cutoff", () => {
  const planets = basePlanets.map((p, i) => pos(p, i));
  const av = computeAshtakavarga(planets, 0);
  const mars = av.charts.find((c) => c.owner === "Mars")!;
  mars.rekhas[0] = 5;
  mars.trikona[0] = 0;
  const result = readKinTransits(av, planets, [{ planet: "Mars", signIndex: 0, start: at, end: "2026-12-08T00:00:00.000Z" }], undefined, at);
  const row = result.rows.Mars[0];
  assert.equal(row.rekhas, 5);
  assert.equal(row.trikona, 0);
  assert.equal(row.verdict, "ungraded");
  assert.match(row.text, /5 original.*0 after Trikona/);
  assert.doesNotMatch(row.text, /gain of land/);
});

test("period-lord from natal Moon uses a shared basic table without grading nodes", () => {
  assert.deepEqual(periodLordMoonHouse("Jupiter", 0, [pos("Jupiter", 4)]), { lord: "Jupiter", house: 5, favourableByHouse: true });
  assert.deepEqual(periodLordMoonHouse("Rahu", 0, [pos("Rahu", 2)]), { lord: "Rahu", house: 3, favourableByHouse: null });
});

test("the first Vimshottari start-transit uses its true pre-birth start", () => {
  const birth = "2000-01-01T12:00:00.000Z", moonLon = 49.5;
  const options = { ayanamsa: "lahiri", nodeType: "mean" } as const;
  const first = dasaStartTransits(moonLon, birth, options)[0];
  const expectedStart = Math.ceil(vimshottariPathAt(moonLon, Date.parse(birth), Date.parse(birth), 1)[0].startMs);
  assert.equal(Date.parse(first.start), Date.parse(birth));
  assert.equal(Date.parse(first.actualStart!), expectedStart);
  assert.ok(expectedStart < Date.parse(birth));
  const expected = positionsAt(julianDay(DateTime.fromMillis(expectedStart, { zone: "utc" })), options).find((p) => p.planet === first.lord)!;
  assert.equal(first.signIndex, expected.signIndex);
  assert.equal(first.lon, expected.lon);
  const birthPosition = positionsAt(julianDay(DateTime.fromISO(birth, { zone: "utc" })), options).find((p) => p.planet === first.lord)!;
  assert.notEqual(first.signIndex, birthPosition.signIndex);
});
