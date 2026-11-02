import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describePosition, drishtiQuarters, type Planet } from "@shared/astro";
import { bphsDignityContext } from "@shared/planet-dignity";
import { createPlanetContext } from "@shared/planet-context";
import { inMoolatrikona, type Seven } from "@shared/shadbala";
import { BphsDignityContextPanel } from "../client/src/components/bphs-dignity-context";
import { computeParashari } from "@shared/parashari";
import { DateTime } from "luxon";
import { julianDay, positionsAt } from "../server/ephemeris";
import { houseFindings } from "@shared/parashari-houses";
import { rashiHouseView } from "@shared/house-view";
import { computePadas } from "@shared/parashari-padas";
import { evaluate } from "@shared/rules";
import { EXTRA_RULES } from "@shared/rules-bnn";
import { buildSarvarthaContext, SC_RAJYOGAS } from "@shared/sarvartha";
import { computePrasnaFructification, prasnaFructificationStrength } from "@shared/rules-prasna";
import { assessStrength } from "@shared/strength";

const synthetic = () => positionsAt(julianDay(DateTime.fromISO("1990-01-01T06:30:00Z", { zone: "utc" })), { ayanamsa: "lahiri", nodeType: "mean" });
const deps = { aspect: drishtiQuarters, benefic: (p: ReturnType<typeof synthetic>[number]) => ["Jupiter", "Venus", "Mercury"].includes(p.planet) };
const move = (positions: ReturnType<typeof synthetic>, planet: Planet, lon: number) => positions.map((p) => p.planet === planet ? describePosition(planet, lon, 1) : p);

test("BPHS 3.51–54 moolatrikona ranges have explicit degree boundaries", () => {
  const bands: Array<[Seven, number, number, number]> = [
    ["Sun", 4, 0, 20], ["Moon", 1, 3, 30], ["Mars", 0, 0, 12], ["Mercury", 5, 15, 20],
    ["Jupiter", 8, 0, 10], ["Venus", 6, 0, 15], ["Saturn", 10, 0, 20],
  ];
  for (const [planet, sign, low, high] of bands) {
    assert.equal(bphsDignityContext(planet, sign, low)!.moolatrikona, true, planet);
    assert.equal(inMoolatrikona(planet, sign, high - 0.0001), true, planet);
    if (low) assert.equal(inMoolatrikona(planet, sign, low - 0.0001), false, planet);
    if (high < 30) assert.equal(inMoolatrikona(planet, sign, high), false, planet);
    assert.equal(inMoolatrikona(planet, (sign + 1) % 12, low), false, planet);
  }
  assert.equal(bphsDignityContext("Rahu", 1, 10), undefined);
  assert.throws(() => bphsDignityContext("Sun", 4, 30), RangeError);
});

test("exaltation sign and degree-specific moolatrikona are preserved as separate facts", () => {
  const moon = bphsDignityContext("Moon", 1, 15)!;
  assert.equal(moon.exaltationSign, true);
  assert.equal(moon.moolatrikona, true);
  assert.equal(moon.explicitExaltationPortion, false);
  const mercury = bphsDignityContext("Mercury", 5, 17)!;
  assert.equal(mercury.exaltationSign, true);
  assert.equal(mercury.ownSign, true);
  assert.equal(mercury.moolatrikona, true);
  assert.equal(bphsDignityContext("Mercury", 5, 21)!.moolatrikona, false);
  assert.equal(bphsDignityContext("Sun", 4, 25)!.moolatrikona, false);
  const positions = ([['Moon', 45], ['Sun', 145], ['Mercury', 167]] as Array<[Planet, number]>)
    .map(([planet, lon]) => describePosition(planet, lon, 1));
  const context = createPlanetContext(positions, { kind: "natal" });
  assert.equal(context.requirePlanet("Moon").bphsDignity?.moolatrikona, true);
  const html = renderToStaticMarkup(createElement(BphsDignityContextPanel, { context }));
  assert.match(html, /moolatrikona degree range/);
  assert.match(html, /existing general reading uses a single sign-based label/i);
});

test("the Venus period's BPHS 47.81–82 rule stops at the moolatrikona degree boundary", () => {
  const birth = "1990-01-01T06:30:00Z", asOf = "2025-01-01T00:00:00Z";
  const base = positionsAt(julianDay(DateTime.fromISO(birth, { zone: "utc" })), { ayanamsa: "lahiri", nodeType: "mean" });
  const reading = (degree: number) => {
    const positions = base.map((p) => p.planet === "Venus" ? describePosition("Venus", 180 + degree, 1) : p);
    return computeParashari(positions, 0, birth, asOf).dasaReadings.find((d) => d.lord === "Venus")!;
  };
  assert.ok(reading(14.9999).notes.some((n) => n.id === "Venus-47-81-82"));
  assert.ok(!reading(15).notes.some((n) => n.id === "Venus-47-81-82"));
  // The preceding rule names Venus's own sign, which remains true on both sides.
  assert.ok(reading(14.9999).notes.some((n) => n.id === "Venus-47-79-80"));
  assert.ok(reading(15).notes.some((n) => n.id === "Venus-47-79-80"));
});

test("Parashari own-sign predicates recognize Mercury in Virgo despite the exalted display label", () => {
  let positions = move(move(synthetic(), "Mercury", 167), "Venus", 35);
  assert.equal(positions.find((p) => p.planet === "Mercury")!.dignity, "Exalted");
  // A bhava frame can place both lords outside angular/trinal houses; the
  // independent sign-ownership condition must still be recognized.
  const view = { ...rashiHouseView(2, positions), houseOf: () => 2 };
  const findings = houseFindings(positions, view, 65, 2, deps);
  assert.ok(findings.some((f) => f.id === "pa-h5-16-1"));
  positions = move(positions, "Mercury", 185);
  assert.ok(!houseFindings(positions, { ...rashiHouseView(2, positions), houseOf: () => 2 }, 65, 2, deps).some((f) => f.id === "pa-h5-16-1"));

  // Pisces rising makes Mercury the seventh lord; the pada reading must also
  // recognize Virgo as his sign even when the display says exalted.
  positions = move(positions, "Mercury", 167);
  const pada = computePadas(positions, 11, 335, deps);
  assert.ok(pada.findings.some((f) => f.id === "pd-30-13" && f.planets.includes("Mercury")));
});

test("BNN dignified Sun and Mars include their own signs despite the sign-level label", () => {
  let positions = move(move(synthetic(), "Sun", 145), "Mars", 25);
  const selected = EXTRA_RULES.filter((r) => ["su-exalt", "ma-exalt", "auth-su-strong"].includes(r.id));
  const ids = evaluate(positions, selected).findings.map((f) => f.ruleId);
  assert.ok(ids.includes("su-exalt") && ids.includes("ma-exalt") && ids.includes("auth-su-strong"));
  positions = move(move(positions, "Sun", 185), "Mars", 95);
  assert.deepEqual(evaluate(positions, selected).findings.map((f) => f.ruleId), []);
});

test("Sarvartha uses the full stated aspect and does not auto-fire incomplete dignity yogas", () => {
  let p = synthetic();
  p = move(move(move(move(p, "Moon", 5), "Jupiter", 95), "Venus", 275), "Saturn", 305);
  const ninth = SC_RAJYOGAS.find((r) => r.stanza === 9)!;
  assert.equal(ninth.test!(buildSarvarthaContext(p, 0)), true);
  p = move(move(p, "Jupiter", 185), "Mars", 5);
  const twentyOne = SC_RAJYOGAS.find((r) => r.stanza === 21)!;
  assert.equal(twentyOne.test!(buildSarvarthaContext(p, 0)), true);
  p = move(p, "Mars", 35);
  assert.equal(twentyOne.test!(buildSarvarthaContext(p, 0)), false);
  for (const stanza of [3, 4, 20, 22]) assert.ok(SC_RAJYOGAS.filter((r) => r.stanza === stanza).every((r) => !r.test));
});

test("Prasna 14.40 leaves unmentioned signs unresolved and does not use BNN effective dignity", () => {
  assert.equal(prasnaFructificationStrength("Neutral"), null);
  assert.equal(prasnaFructificationStrength("Inimical"), null);
  assert.equal(prasnaFructificationStrength("Debilitated"), false);
  assert.equal(prasnaFructificationStrength("Moolatrikona"), true);
  const positions = synthetic();
  const strengths = assessStrength(positions);
  const actual = computePrasnaFructification(positions, strengths, 0);
  const overridden = strengths.map((s) => ({ ...s, effectiveDignity: "Debilitated" as const }));
  assert.deepEqual(actual, computePrasnaFructification(positions, overridden, 0));
  for (const f of actual.filter((f) => f.lordStrong === null || f.karakaStrong === null)) {
    assert.equal(f.verdict, "mixed");
    assert.match(f.note, /unresolved/);
  }
});
