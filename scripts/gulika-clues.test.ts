import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay, positionsAt } from "../server/ephemeris";
import { directedSignRelation } from "@shared/point-relations";
import { gulikaNatalClues } from "@shared/gulika-clues";
import { computeProgeny } from "@shared/rules-prasna";

const options = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
test("directed sign relations distinguish conjunction, Jupiter's 5th/9th and 7th, and direction", () => {
  const target = (signIndex: number) => ({ id: "Gulika", signIndex });
  const jupiter = { planet: "Jupiter" as const, signIndex: 6 };
  assert.deepEqual([0, 4, 6, 8].map((d) => directedSignRelation(jupiter, target((6 + d) % 12)).fullAspect), [false, true, true, true]);
  assert.equal(directedSignRelation(jupiter, target(6)).sameSign, true);
  assert.equal(directedSignRelation({ planet: "Venus", signIndex: 6 }, target(10)).fullAspect, false);
  assert.equal(directedSignRelation({ planet: "Rahu", signIndex: 6 }, target(0)).fullAspect, false);
});

test("fresh fifth-house examples distinguish special aspects, seventh aspects, and sphuta associations", () => {
  const examples = [
    { name: "James Carter", date: "1911-11-12T08:15", zone: "UTC-6", lat: 39 + 46 / 60, lon: -(86 + 9 / 60), distance: 5, special: true },
    { name: "Curley Culp", date: "1946-03-10T09:00", zone: "UTC-7", lat: 32 + 44 / 60, lon: -(114 + 37 / 60), distance: 11, special: false },
    { name: "George Chisholm", date: "1915-03-29T07:05", zone: "UTC+0", lat: 55 + 52 / 60, lon: -(4 + 15 / 60), distance: 7, special: false },
  ];
  for (const c of examples) {
    const jd = julianDay(DateTime.fromISO(c.date, { zone: c.zone }).toUTC());
    const positions = positionsAt(jd, options);
    const asc = Math.floor(ascendantAt(jd, c.lat, c.lon, options) / 30);
    const gulika = gulikaComparisons(jd, c.lat, c.lon, c.zone, options)["kerala-ghati"];
    const beeja = computeProgeny(positions, "male");
    const clue = gulikaNatalClues(positions, gulika, asc, { kind: beeja.kind, signIndex: beeja.signIndex });
    assert.equal(clue.house, 5, c.name);
    assert.equal(clue.jupiter.inclusiveSignDistance, c.distance, c.name);
    assert.equal(clue.jupiterFifthOrNinthAspect, c.special, c.name);
    assert.equal(clue.jupiter.fullAspect, c.distance === 5 || c.distance === 7, c.name);
    if (c.name === "Curley Culp") assert.equal(clue.sphuta?.sameSignAsGulika, true);
    assert.equal(gulikaNatalClues(positions, gulika, asc).sphuta, null);
  }
});

test("the chosen Gulika convention changes the natal clue when the point changes", () => {
  const jd = julianDay(DateTime.fromISO("1911-11-12T08:15", { zone: "UTC-6" }).toUTC());
  const lat = 39 + 46 / 60, lon = -(86 + 9 / 60);
  const positions = positionsAt(jd, options);
  const asc = Math.floor(ascendantAt(jd, lat, lon, options) / 30);
  const points = gulikaComparisons(jd, lat, lon, "UTC-6", options);
  const kerala = gulikaNatalClues(positions, points["kerala-ghati"], asc);
  const saturnStart = gulikaNatalClues(positions, points["saturn-start"], asc);
  assert.equal(kerala.house, 5);
  assert.equal(kerala.jupiterFifthOrNinthAspect, true);
  assert.equal(saturnStart.house, 4);
  assert.equal(saturnStart.jupiterFifthOrNinthAspect, false);
});
