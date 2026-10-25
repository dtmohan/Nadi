// The modern exact-aspect marker on the transit calendar (T4): practitioner view only, never colouring or counted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DateTime } from "luxon";
import type { Chart } from "@shared/schema";
import type { Planet } from "@shared/astro";
import { exactHits, exactPassLabel, groupExactPasses, type ExactHit } from "@shared/gochara-exact";
import { exactPasses } from "../server/gochara-calendar";
import { julianDay } from "../server/ephemeris";
import { computeChart } from "../server/routes";

const at = (sign: number, deg: number) => sign * 30 + deg;
const P = (planet: Planet, lon: number) => ({ planet, lon });

test("exact hits: by whole sign, within 1° of the degree, the slow planets' own aspects", () => {
  // Jupiter at 10.5° Aries: its 5th is Leo.
  assert.deepEqual(exactHits([P("Jupiter", at(0, 10.5))], [P("Moon", at(4, 10))]), [
    { planet: "Jupiter", natal: "Moon", nth: 5, apart: 0.5 },
  ]);
  assert.deepEqual(exactHits([P("Jupiter", at(0, 10.5))], [P("Moon", at(4, 11.6))]), [], "1.1° apart");
  // 29.8° Aries + 120° lands on 29.8° Leo; a natal planet at 0.3° Virgo is in the 6th sign, so no aspect.
  assert.deepEqual(exactHits([P("Jupiter", at(0, 29.8))], [P("Moon", at(5, 0.3))]), []);
  // Saturn's 3rd and 10th; not its 5th.
  const sat = exactHits([P("Saturn", at(0, 5))], [P("Sun", at(2, 5.2)), P("Mars", at(9, 4.9)), P("Venus", at(4, 5))]);
  assert.deepEqual(sat.map((h) => `${h.natal} ${h.nth}`), ["Sun 3", "Mars 10"]);
});

test("exact hits: a node's 7th is the other node's conjunction; the nodes are not tested on the natal nodes", () => {
  const nodes = [P("Rahu", at(0, 5)), P("Ketu", at(6, 5))];
  const h = exactHits(nodes, [P("Venus", at(6, 5.5)), P("Rahu", at(0, 5)), P("Ketu", at(6, 5))]);
  assert.deepEqual(h, [{ planet: "Ketu", natal: "Venus", nth: 1, apart: 0.5 }]);
  assert.equal(exactPassLabel(h[0]), "Ketu conjunct natal Venus (the axis: Rahu opposite)");
  // Jupiter and Saturn are tested on the natal nodes.
  assert.equal(exactHits([P("Jupiter", at(8, 5))], [P("Rahu", at(0, 5.3))])[0].nth, 5);
  const k: ExactHit = { planet: "Ketu", natal: "Mercury", nth: 9, apart: 0.1 };
  assert.equal(exactPassLabel(k), "Ketu's 9th aspect on natal Mercury (Ketu's aspects are disputed)");
  assert.equal(exactPassLabel({ planet: "Saturn", natal: "Moon", nth: 10, apart: 0 }), "Saturn's 10th aspect on the natal Moon");
});

test("passes: consecutive days group into one pass, a gap starts another, and the peak is the closest day", () => {
  const hit = (apart: number): ExactHit[] => [{ planet: "Jupiter", natal: "Sun", nth: 9, apart }];
  const ps = groupExactPasses([
    { iso: "2027-01-01", hits: hit(0.9) },
    { iso: "2027-01-02", hits: hit(0.2) },
    { iso: "2027-01-03", hits: hit(0.6) },
    { iso: "2027-01-04", hits: [] },
    { iso: "2027-03-01", hits: hit(0.4) },
  ]);
  assert.equal(ps.length, 2);
  assert.deepEqual([ps[0].start, ps[0].end, ps[0].peak, ps[0].apart], ["2027-01-01", "2027-01-03", "2027-01-02", 0.2]);
  assert.deepEqual([ps[1].start, ps[1].end], ["2027-03-01", "2027-03-01"]);
});

test("Tendulkar, the year from 25 Oct 2026: 14 passes, sparse, with no node 7th and no node on node", () => {
  const pub = JSON.parse(readFileSync("scripts/fixtures/public-figures.json", "utf8")).charts;
  const c0 = pub.find((c: { name: string }) => c.name === "Sachin Tendulkar");
  const r = computeChart({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c0 } as unknown as Chart);
  const start = DateTime.fromISO("2026-10-25", { zone: "utc" });
  const ps = exactPasses(
    r.positions.map((p) => ({ planet: p.planet, lon: p.lon })),
    julianDay(start),
    julianDay(start.plus({ years: 1 })),
    { ayanamsa: "lahiri", nodeType: "mean" },
  );
  assert.equal(ps.length, 14);
  const sm = ps.find((p) => p.planet === "Saturn" && p.natal === "Mercury" && p.nth === 1)!;
  assert.deepEqual([sm.start.slice(0, 10), sm.end.slice(0, 10), sm.peak.slice(0, 10)], ["2027-01-28", "2027-02-18", "2027-02-08"]);
  // Jupiter's retrograde loop over natal Mars gives two passes.
  assert.equal(ps.filter((p) => p.planet === "Jupiter" && p.natal === "Mars" && p.nth === 7).length, 2);
  for (const p of ps) {
    const node = p.planet === "Rahu" || p.planet === "Ketu";
    assert.ok(!(node && p.nth === 7), "a node's 7th is shown as the axis");
    assert.ok(!(node && (p.natal === "Rahu" || p.natal === "Ketu")), "no node on node");
    assert.ok(p.apart <= 1);
  }
});

test("the exact marker stays out of the verdicts: only the calendar builder, its type and the calendar view read it", () => {
  const allowed = new Set(["server/gochara-calendar.ts", "shared/gochara-calendar.ts", "client/src/components/gochara-calendar.tsx"]);
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /gochara-exact["']/.test(readFileSync(full, "utf8"))) importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers.filter((f) => !allowed.has(f)), []);
  // The calendar type imports it for the type only.
  assert.match(readFileSync("shared/gochara-calendar.ts", "utf8"), /import type \{ ExactPass \} from "\.\/gochara-exact"/);
});
