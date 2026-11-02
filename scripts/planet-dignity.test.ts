import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describePosition, type Planet } from "@shared/astro";
import { bphsDignityContext } from "@shared/planet-dignity";
import { createPlanetContext } from "@shared/planet-context";
import { inMoolatrikona, type Seven } from "@shared/shadbala";
import { BphsDignityContextPanel } from "../client/src/components/bphs-dignity-context";
import { computeParashari } from "@shared/parashari";
import { DateTime } from "luxon";
import { julianDay, positionsAt } from "../server/ephemeris";

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
