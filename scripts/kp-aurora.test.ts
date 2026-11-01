import { test } from "node:test";
import assert from "node:assert/strict";
import type { Planet } from "@shared/astro";
import { auroraEventEvidence, auroraSelfSignificators } from "@shared/kp-aurora";
import { kpPoint, type KpCusp, type KpPlanet, type KpSignificators } from "@shared/kp";

const frame = (pairs: Array<[Planet, Planet]>) => pairs.map(([planet, starLord]) => ({ planet, starLord }));

test("Aurora's 1959 example identifies empty, own and exchanged stars", () => {
  // Supplied Kindle capture pp. 567–569. The source lists exactly these five.
  const planets = frame([["Sun", "Rahu"], ["Moon", "Sun"], ["Mars", "Mercury"],
    ["Mercury", "Jupiter"], ["Jupiter", "Jupiter"], ["Venus", "Mercury"],
    ["Saturn", "Ketu"], ["Rahu", "Moon"], ["Ketu", "Saturn"]]);
  const got = auroraSelfSignificators(planets);
  assert.deepEqual(got.map((p) => p.planet).sort(), ["Jupiter", "Ketu", "Mars", "Saturn", "Venus"]);
  assert.deepEqual(got.find((p) => p.planet === "Jupiter")!.reasons, ["own-star"]);
  assert.deepEqual(got.find((p) => p.planet === "Saturn")!.exchangeWith, ["Ketu"]);
  assert.deepEqual(got.find((p) => p.planet === "Venus")!.reasons, ["unoccupied-star"]);
});

test("Aurora's 1983 example identifies Moon alone as self-significator", () => {
  // Supplied capture pp. 424–426; the first wording alone is ambiguous, but
  // the printed stars and the named Moon support the empty-star reading.
  const planets = frame([["Sun", "Venus"], ["Moon", "Jupiter"], ["Mars", "Mercury"],
    ["Mercury", "Sun"], ["Jupiter", "Saturn"], ["Venus", "Ketu"],
    ["Saturn", "Rahu"], ["Rahu", "Mars"], ["Ketu", "Mercury"]]);
  assert.deepEqual(auroraSelfSignificators(planets).map((p) => p.planet), ["Moon"]);
});

test("Aurora's Rahu example identifies its four sub-lord cusps", () => {
  // Capture pp. 255–258. Use the source's cusp lords, not a recalculated chart.
  const planets = frame([["Sun", "Ketu"], ["Moon", "Ketu"], ["Mars", "Saturn"],
    ["Mercury", "Sun"], ["Jupiter", "Saturn"], ["Venus", "Ketu"],
    ["Saturn", "Mars"], ["Rahu", "Mars"], ["Ketu", "Mercury"]]);
  const cusps = ["Ketu", "Rahu", "Mercury", "Rahu", "Moon", "Jupiter", "Ketu", "Rahu", "Mercury", "Rahu", "Venus", "Jupiter"].map((subLord, i) => ({
    house: i + 1, starLord: "Sun" as Planet, subLord: subLord as Planet,
  }));
  const rahu = auroraSelfSignificators(planets, cusps).find((p) => p.planet === "Rahu")!;
  assert.deepEqual(rahu.reasons, ["unoccupied-star"]);
  assert.deepEqual(rahu.cuspSub, [2, 4, 8, 10]);
});

test("the experimental chain never promotes later layers after an unresolved predecessor", () => {
  const names: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const planets = names.map((planet, i) => ({ ...kpPoint(i * 35 + 1), planet, house: 1, owns: [], retrograde: false })) as KpPlanet[];
  const cusps = Array.from({ length: 12 }, (_, i) => ({ ...kpPoint(i * 30 + 1), house: i + 1 })) as KpCusp[];
  // No house significations makes the cusp unresolved. Later raw data may be
  // inspected, but it cannot make the chain supported.
  const significators = names.map((planet) => ({ planet, houses: [], housesSix: [], all: [],
    levels: { A: [], B: [], C: [], D: [], E: [], F: [] } })) as KpSignificators[];
  const event = auroraEventEvidence({ matter: "marriage", planets, cusps, significators,
    lords: ["Sun", "Moon", "Mars"], transits: [] })!;
  assert.equal(event.layers[0].eligible, true);
  assert.ok(event.layers.slice(1).every((layer) => !layer.eligible));
  assert.equal(event.allSupported, false);
  assert.equal(event.firstUnresolved, "Cusp 7 sub lord");
  assert.equal(auroraEventEvidence({ matter: "vehicle", planets, cusps, significators,
    lords: ["Sun", "Moon", "Mars"], transits: [] }), undefined);
});
