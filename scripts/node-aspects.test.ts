// Modern node aspects (display only): synthetic cases, the public figures checked against an independent
// mean-node computation, an independent re-derivation of every aspect, and the guard that keeps the
// note out of rules, verdicts and kernels.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { Chart } from "@shared/schema";
import { computeChart } from "../server/routes";
import { describePosition, type Planet, type PlanetPosition } from "@shared/astro";
import {
  modernNodeAspects,
  nodeAspectSentence,
  NODE_ASPECT_CLOSE_DEG,
  NODE_ASPECT_EXACT_DEG,
} from "@shared/parashari-node-aspects";

const FIGURES = JSON.parse(readFileSync(join(process.cwd(), "scripts/fixtures/public-figures.json"), "utf8"))
  .charts as Array<Record<string, unknown> & { name: string }>;
const asChart = (c: Record<string, unknown>) =>
  ({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c }) as unknown as Chart;

// A synthetic chart, Aries rising: Rahu 10° Leo, Ketu 10° Aquarius.
function synthetic(extra: Array<[Planet, number]> = []): PlanetPosition[] {
  const sunLon = 25;
  const base: Array<[Planet, number]> = [
    ["Sun", 25], // Aries, the 9th from Rahu: 15° apart
    ["Moon", 67], // Gemini, Ketu's 5th: 3° apart, close
    ["Mars", 254], // Sagittarius, Rahu's 5th: 4° apart, close
    ["Mercury", 40], // Taurus: no node aspect
    ["Jupiter", 250.5], // Sagittarius, Rahu's 5th: 0.5° apart, exact
    ["Venus", 190.9], // Libra, Ketu's 9th: 0.9° apart, exact
    ["Saturn", 322], // Aquarius, Rahu's 7th: 12° apart
    ["Rahu", 130],
    ["Ketu", 310],
  ];
  const all = new Map<Planet, number>(base);
  for (const [p, lon] of extra) all.set(p, lon);
  return Array.from(all.entries()).map(([p, lon]) => describePosition(p, lon, p === "Rahu" || p === "Ketu" ? -0.05 : 1, sunLon));
}

test("node aspects: the 5th, 7th and 9th by whole sign, with degrees apart and Choudhry's two orbs", () => {
  const [rahu, ketu] = modernNodeAspects(synthetic(), 0);
  assert.equal(rahu.node, "Rahu");
  assert.equal(rahu.sign, "Leo");
  assert.equal(rahu.house, 5);
  assert.equal(rahu.disputed, false);
  assert.deepEqual(
    rahu.targets.map((t) => [t.nth, t.sign, t.house]),
    [
      [5, "Sagittarius", 9],
      [7, "Aquarius", 11],
      [9, "Aries", 1],
    ],
  );
  assert.deepEqual(rahu.targets[0].planets, [
    { planet: "Jupiter", apart: 0.5, exact: true, close: true },
    { planet: "Mars", apart: 4, exact: false, close: true },
  ]);
  assert.deepEqual(rahu.targets[1].planets, [
    { planet: "Ketu", apart: 0, exact: true, close: true },
    { planet: "Saturn", apart: 12, exact: false, close: false },
  ]);
  assert.deepEqual(rahu.targets[2].planets, [{ planet: "Sun", apart: 15, exact: false, close: false }]);

  assert.equal(ketu.node, "Ketu");
  assert.equal(ketu.disputed, true, "Shweta §17.4: Ketu's aspects are disputed");
  assert.deepEqual(
    ketu.targets.map((t) => [t.nth, t.sign, t.house, t.planets.map((h) => [h.planet, h.apart, h.exact, h.close])]),
    [
      [5, "Gemini", 3, [["Moon", 3, false, true]]],
      [7, "Leo", 5, [["Rahu", 0, true, true]]],
      [9, "Libra", 7, [["Venus", 0.9, true, true]]],
    ],
  );
  assert.match(nodeAspectSentence(ketu), /^Ketu in Aquarius \(11th house\), disputed: 5th on Gemini \(3rd house\): Moon 3\.0° apart \(close\)\./);
  assert.doesNotMatch(nodeAspectSentence(rahu), /disputed/);
  assert.match(nodeAspectSentence(rahu), /Jupiter 0\.5° apart \(exact\); Mars 4\.0° apart \(close\)/);
  assert.match(nodeAspectSentence(rahu), /9th on Aries \(1st house\): Sun 15\.0° apart\./);
});

test("node aspects: the orbs are inclusive at 1° and 5°, and an empty sign reads as no planet", () => {
  assert.equal(NODE_ASPECT_EXACT_DEG, 1);
  assert.equal(NODE_ASPECT_CLOSE_DEG, 5);
  // Rahu at 10° Leo: Jupiter at 11° Sagittarius (exactly 1° apart), Mars at 15° (5°), Saturn at 15.1° (5.1°).
  const [rahu] = modernNodeAspects(synthetic([["Jupiter", 251], ["Mars", 255], ["Saturn", 255.1]]), 0);
  assert.deepEqual(
    rahu.targets[0].planets.map((h) => [h.planet, h.apart, h.exact, h.close]),
    [
      ["Jupiter", 1, true, true],
      ["Mars", 5, false, true],
      ["Saturn", 5.1, false, false],
    ],
  );
  // With Venus moved to Cancer, Ketu's 9th (Libra) is empty.
  const [, ketu] = modernNodeAspects(synthetic([["Venus", 100]]), 0);
  assert.deepEqual(ketu.targets[2].planets, []);
  assert.match(nodeAspectSentence(ketu), /9th on Libra \(7th house\): no planet\./);
});

test("node aspects: houses are counted from the lagna, whatever the rising sign", () => {
  for (let lagna = 0; lagna < 12; lagna++) {
    const [rahu, ketu] = modernNodeAspects(synthetic(), lagna);
    const h = (sign: number) => ((sign - lagna + 12) % 12) + 1;
    assert.equal(rahu.house, h(4));
    assert.deepEqual(rahu.targets.map((t) => t.house), [h(8), h(10), h(0)]);
    assert.deepEqual(ketu.targets.map((t) => t.house), [h(2), h(4), h(6)]);
  }
});

// Meeus, Astronomical Algorithms (2nd ed.), eq. 47.7: the mean longitude of the Moon's ascending node.
function meeusMeanNode(jdUt: number): number {
  const T = (jdUt - 2451545.0) / 36525;
  const om = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000;
  return ((om % 360) + 360) % 360;
}
// Lahiri as the Calendar Reform Committee fixed it: 23°15'00.658" on 21 March 1956, carried by the IAU 1976
// general precession in longitude (5029.0966" a century, + 1.11113" T²).
function lahiriByDefinition(jdUt: number): number {
  const T = (jdUt - 2451545.0) / 36525;
  const T0 = (2435553.5 - 2451545.0) / 36525;
  return 23.250182778 + (5029.0966 * (T - T0) + 1.11113 * (T * T - T0 * T0)) / 3600;
}
const diff = (a: number, b: number) => ((a - b + 540) % 360) - 180;

test("node aspects, public figures: the mean nodes agree with Meeus and the Lahiri definition", () => {
  assert.equal(FIGURES.length, 8);
  for (const c of FIGURES) {
    const r = computeChart(asChart(c));
    const jd = 2440587.5 + Date.parse(r.utc) / 86400000;
    const rahu = r.positions.find((p) => p.planet === "Rahu")!;
    const ketu = r.positions.find((p) => p.planet === "Ketu")!;
    const om = meeusMeanNode(jd);
    // The tropical node: the ephemeris's mean node against Meeus's polynomial.
    assert.ok(Math.abs(diff(rahu.lon + r.ayanamsaValue, om)) < 0.001, `${c.name}: tropical Rahu ${rahu.lon + r.ayanamsaValue} vs Meeus ${om}`);
    // The ayanamsa: Swiss Ephemeris's Lahiri sits 0.0047° (16.8") below the 1956 definition, a fixed offset.
    const ayan = lahiriByDefinition(jd);
    assert.ok(Math.abs(r.ayanamsaValue - ayan) < 0.01, `${c.name}: ayanamsa ${r.ayanamsaValue} vs ${ayan}`);
    // The sidereal node, independently: within 0.01°, and no node so near a sign's edge that this matters.
    assert.ok(Math.abs(diff(rahu.lon, om - ayan)) < 0.01, `${c.name}: sidereal Rahu`);
    assert.ok(rahu.degInSign > 0.05 && rahu.degInSign < 29.95, `${c.name}: Rahu clear of a sign's edge`);
    assert.ok(Math.abs(diff(ketu.lon, rahu.lon + 180)) < 1e-9, `${c.name}: mean Ketu opposite Rahu`);
  }
});

test("node aspects, public figures: every aspect matches an independent count from the longitudes", () => {
  for (const c of FIGURES) {
    const r = computeChart(asChart(c));
    const lagnaIdx = Math.floor(r.jaimini.lagna.lon / 30);
    const got = modernNodeAspects(r.positions, lagnaIdx);
    assert.deepEqual(got.map((a) => a.node), ["Rahu", "Ketu"], c.name);
    const signs = new Set<number>();
    for (const a of got) {
      const n = r.positions.find((p) => p.planet === a.node)!;
      for (const t of a.targets) {
        const sign = Math.floor((((n.lon + (t.nth - 1) * 30) % 360) + 360) % 360 / 30);
        assert.equal(t.signIndex, sign, `${c.name}: ${a.node} ${t.nth}th sign`);
        assert.equal(t.house, ((sign - lagnaIdx + 12) % 12) + 1);
        signs.add(sign);
        const want = r.positions
          .filter((p) => p.planet !== a.node && Math.floor(p.lon / 30) === sign)
          .map((p) => [p.planet, Math.round(Math.abs((p.lon % 30) - (n.lon % 30)) * 10) / 10] as const)
          .sort((x, y) => x[1] - y[1]);
        assert.deepEqual(t.planets.map((h) => [h.planet, h.apart]), want, `${c.name}: ${a.node} ${t.nth}th occupants`);
        for (const h of t.planets) {
          assert.equal(h.exact, h.apart <= 1);
          assert.equal(h.close, h.apart <= 5);
        }
      }
    }
    // Rahu's 7th always holds Ketu, exactly, and Ketu's 7th Rahu.
    assert.ok(got[0].targets[1].planets.some((h) => h.planet === "Ketu" && h.apart === 0), `${c.name}: Rahu's 7th`);
    assert.ok(got[1].targets[1].planets.some((h) => h.planet === "Rahu" && h.apart === 0), `${c.name}: Ketu's 7th`);
    // Between them the nodes reach the six signs at an odd count from Rahu.
    const rahuSign = got[0].signIndex;
    assert.deepEqual(
      Array.from(signs).map((s) => (s - rahuSign + 12) % 12).sort((x, y) => x - y),
      [0, 2, 4, 6, 8, 10],
      c.name,
    );
  }
});

test("node aspects: display only, imported by the Parashari panel and the report alone", () => {
  const allowed = new Set(["client/src/components/parashari-panel.tsx", "shared/report/parashari.ts"]);
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /parashari-node-aspects["']/.test(readFileSync(full, "utf8")))
        importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers.filter((f) => !allowed.has(f)).sort(), []);
  assert.deepEqual(importers.sort(), Array.from(allowed).sort());
});
