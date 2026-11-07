import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DateTime } from "luxon";
import { computeChart } from "../server/routes";
import { julianDay, positionsAt } from "../server/ephemeris";
import { createPlanetContext, natalPlanetContext, kpPlanetContext } from "../shared/planet-context";
import { createDivisionalPlanetContext } from "../shared/divisional-planet-context";
import { jupiterRelationships } from "../shared/jupiter-relationships";
import { SIGNS, type Planet } from "../shared/astro";
import { JupiterRelationshipsPanel } from "../client/src/components/jupiter-relationships";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const jd = julianDay(DateTime.fromISO("1990-01-01T06:30:00Z"));
const template = positionsAt(jd, { ayanamsa: "lahiri", nodeType: "mean" });
const longitudes: Record<Planet, number> = {
  Sun: 62, Moon: 1, Mars: 33, Mercury: 340, Jupiter: 191, Venus: 95, Saturn: 209, Rahu: 66, Ketu: 246,
};
const positions = template.map((p) => ({ ...p, lon: longitudes[p.planet],
  signIndex: Math.floor(longitudes[p.planet] / 30), sign: SIGNS[Math.floor(longitudes[p.planet] / 30)],
  degInSign: longitudes[p.planet] % 30 }));
const context = createPlanetContext(positions, { kind: "natal", division: "D1", ascendant: 65,
  ayanamsa: "lahiri", houseMethod: "rashi" });

test("Jupiter's targets keep occupants, nodes, sign rulers, and Gulika distinct", () => {
  const r = jupiterRelationships(context, "D1", 10);
  assert.equal(r.house, 5);
  assert.deepEqual(r.targets.map((t) => [t.fromJupiter, t.signIndex, t.house]), [[5, 10, 9], [7, 0, 11], [9, 2, 1]]);
  assert.equal(r.targets[0].gulika, true);
  assert.deepEqual(r.targets[0].occupants, []);
  assert.deepEqual(r.targets[1].occupants, ["Moon"]);
  assert.deepEqual(r.targets[2].classicalOccupants, ["Sun"]);
  assert.deepEqual(r.targets[2].nodeOccupants, ["Rahu"]);
  assert.equal(r.targets[0].lord, "Saturn");
  assert.deepEqual(r.natalOwnedHouses, [7, 10]);
  assert.deepEqual(r.sameSign, [{ planet: "Saturn", natalSeparation: 18 }]);
  assert.ok(!r.incomingFullAspects.includes("Rahu"));
  assert.ok(!r.incomingFullAspects.includes("Saturn")); // same sign is not an incoming aspect
});

test("a fifth-house Jupiter's ninth sign is the ascendant for all twelve rising signs", () => {
  for (let rising = 0; rising < 12; rising++) {
    const jupSign = (rising + 4) % 12;
    const row = positions.map((p) => p.planet === "Jupiter" ? { ...p, lon: jupSign * 30 + 1,
      signIndex: jupSign, sign: SIGNS[jupSign], degInSign: 1 } : p);
    const c = createPlanetContext(row, { kind: "natal", division: "D1", ascendant: rising * 30 + 1 });
    const r = jupiterRelationships(c);
    assert.equal(r.house, 5);
    assert.equal(r.targets[2].signIndex, rising);
    assert.equal(r.targets[2].house, 1);
  }
});

test("D9 and D10 use each division's placements and never project the natal Gulika", () => {
  for (const key of ["D9", "D10"] as const) {
    const result = jupiterRelationships(context, key, 10);
    const independent = createDivisionalPlanetContext(context, key, 65);
    assert.equal(result.risingSign, independent.ascendantSign);
    assert.equal(result.signIndex, independent.requirePlanet("Jupiter").signIndex);
    assert.equal(result.house, independent.requirePlanet("Jupiter").house);
    for (const t of result.targets) {
      assert.deepEqual(t.occupants, independent.occupants(t.signIndex).map((p) => p.planet));
      assert.equal(t.gulika, false);
    }
    assert.ok(result.sameSign.every((p) => p.natalSeparation === null));
    assert.deepEqual(result.natalOwnedHouses, [7, 10]);
  }
});

test("the view rejects mismatched or non-natal frames without banning KP as a chosen ayanamsa", () => {
  assert.throws(() => jupiterRelationships(createPlanetContext(positions, { kind: "transit", division: "D1", ascendant: 65 })), /natal frame/);
  assert.throws(() => jupiterRelationships(createPlanetContext(positions, { kind: "natal", division: "D1", ascendant: 65, houseMethod: "placidus" })), /KP cusp/);
  assert.doesNotThrow(() => jupiterRelationships(createPlanetContext(positions, { kind: "natal", division: "D1", ascendant: 65, ayanamsa: "kp", houseMethod: "rashi" })));
  assert.throws(() => jupiterRelationships(context, "D1", 12), /Gulika sign/);
});

test("the chart view exposes the research limitation without a cancellation verdict", () => {
  const chart = computeChart({ id: 0, name: "Synthetic", gender: "male", birthDate: "1990-01-01", birthTime: "12:00",
    timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
    ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "",
    deathDate: null, timeUncertaintyMin: 0, events: [] });
  const html = renderToStaticMarkup(React.createElement(JupiterRelationshipsPanel, { result: chart }));
  assert.match(html, /data-testid="jupiter-relationships"/);
  assert.match(html, /data-testid="jupiter-target-5"/);
  assert.match(html, /data-testid="jupiter-target-7"/);
  assert.match(html, /data-testid="jupiter-target-9"/);
  assert.match(html, /Whether his rule includes the nodes is unspecified/);
  assert.match(html, /does not automatically cancel a finding or make a prediction/);
  assert.match(html, /whole-sign houses/);
  assert.throws(() => jupiterRelationships(kpPlanetContext(chart)), /KP cusp/);
  assert.equal(jupiterRelationships(natalPlanetContext(chart)).signIndex, chart.positions.find((p) => p.planet === "Jupiter")!.signIndex);
});
