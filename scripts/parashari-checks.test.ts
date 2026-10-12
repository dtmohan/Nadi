/**
 * The standard per-planet checks behind the Parashari cards' "How this was found" panel
 * (shared/parashari-checks.ts), and the Parashari tab's combustion rule: the Surya Siddhanta orbs
 * quoted under BPHS 7.28-29 in the stellium list and the Sarvartha context, with the Nadi 3°20'
 * flag on each position left for the Nadi systems.
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { drishtiQuarters, houseFrom, type Planet } from "@shared/astro";
import { computeParashari } from "@shared/parashari";
import { planetChecks } from "@shared/parashari-checks";
import { rashiHouseView } from "@shared/house-view";
import { computeCombinations } from "@shared/combinations";
import { buildSarvarthaContext } from "@shared/sarvartha";
import { parashariCombust, parashariCombustOrb } from "@shared/vargas";
import { computeChart } from "../server/routes";

const base: Chart = {
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "UTC",
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
const AS_OF = "2026-10-11T12:00:00.000Z";
const BIRTHS = [
  ["1948-01-07", "01:10"],
  ["1955-10-30", "07:00"],
  ["1962-04-19", "13:25"],
  ["1967-05-05", "16:35"],
  ["1971-08-02", "22:40"],
  ["1979-11-23", "05:55"],
  ["1984-02-29", "17:05"],
  ["1990-06-15", "09:30"],
  ["1996-12-01", "03:20"],
  ["2001-09-09", "14:45"],
  ["2007-03-21", "11:11"],
  ["2012-07-04", "19:50"],
];
const charts = BIRTHS.map(([birthDate, birthTime]) =>
  computeChart({ ...base, birthDate, birthTime }),
);
const read = (r: ReturnType<typeof computeChart>) =>
  computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, AS_OF, r.shadbala, r.dasaStarts);
const PLANETS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const arc = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

test("every planet carries the standard checks, in reading order, with no gaps in the wording", () => {
  for (const r of charts) {
    const p = read(r);
    for (const pl of PLANETS) {
      const checks = p.checks[pl];
      assert.ok(checks && checks.length >= 3, `${r.utc} ${pl} has checks`);
      const kinds = checks.map((c) => c.kind);
      const order = ["place", "dignity", "strength", "combust", "war", "aspects", "with"];
      assert.deepEqual(kinds, [...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b)), `${pl} order`);
      assert.equal(kinds[0], "place");
      assert.ok(kinds.includes("aspects"));
      for (const c of checks) {
        for (const t of [c.text, c.plain]) {
          assert.ok(t.length > 0, `${pl} ${c.kind} empty`);
          assert.ok(!/undefined|NaN|null/.test(t), `${pl} ${c.kind}: ${t}`);
        }
      }
    }
  }
});

test("place: the whole-sign house and the houses the planet rules", () => {
  for (const r of charts) {
    const p = read(r);
    const lagna = r.jaimini.lagna.signIndex;
    for (const pl of PLANETS) {
      const me = r.positions.find((x) => x.planet === pl)!;
      const place = p.checks[pl]!.find((c) => c.kind === "place")!;
      const h = houseFrom(lagna, me.signIndex);
      assert.match(place.text, new RegExp(`^${h}(st|nd|rd|th) house`), `${pl} house`);
      const view = rashiHouseView(lagna, r.positions);
      const owns = Array.from({ length: 12 }, (_, i) => i + 1).filter((k) => view.lordOf(k) === pl);
      if (owns.length) assert.match(place.text, /lord of the/);
      else assert.doesNotMatch(place.text, /lord of/);
    }
  }
});

test("strength: Shadbala total against the 27.32-33 requirement, with a link to the table", () => {
  for (const r of charts) {
    const p = read(r);
    for (const row of p.shadbala!.planets) {
      const c = p.checks[row.planet]!.find((x) => x.kind === "strength")!;
      assert.equal(c.table, "shadbala");
      assert.equal(c.against, !row.strong);
      assert.ok(c.text.includes(`${row.total.toFixed(1)} of the ${row.required} virupas`), c.text);
      assert.ok(c.text.includes(`(${Math.round(row.ratio * 100)}%)`));
      assert.ok(c.plain.startsWith(row.strong ? "Strong enough" : "Short of strength"));
    }
    for (const node of ["Rahu", "Ketu"] as Planet[]) {
      const c = p.checks[node]!.find((x) => x.kind === "strength")!;
      assert.equal(c.table, undefined);
    }
  }
});

test("combustion and war follow the Parashari orbs and the Shadbala war list", () => {
  for (const r of charts) {
    const p = read(r);
    const sun = r.positions.find((x) => x.planet === "Sun")!;
    for (const pl of PLANETS) {
      const me = r.positions.find((x) => x.planet === pl)!;
      const c = p.checks[pl]!.find((x) => x.kind === "combust");
      if (parashariCombustOrb(me) === undefined) {
        assert.equal(c, undefined, `${pl} has no orb`);
        continue;
      }
      assert.ok(c);
      assert.equal(c.against === true, parashariCombust(me, sun.lon), `${r.utc} ${pl} combust`);
      assert.ok(c.text.includes(`${arc(me.lon, sun.lon).toFixed(1)}°`));
      const war = p.shadbala!.wars.find((w) => w.victor === pl || w.loser === pl);
      const wc = p.checks[pl]!.find((x) => x.kind === "war");
      assert.equal(wc !== undefined, war !== undefined, `${pl} war`);
      if (war && wc) assert.equal(wc.against === true, war.loser === pl);
    }
  }
});

test("aspects received: exactly the planets whose graha drishti reaches the floor", () => {
  const r = charts[3];
  for (const floor of [4, 2, 1] as const) {
    const lagna = r.jaimini.lagna.signIndex;
    for (const pl of PLANETS) {
      const me = r.positions.find((x) => x.planet === pl)!;
      const c = planetChecks(pl, {
        positions: r.positions,
        houseView: rashiHouseView(lagna, r.positions),
        aspectFloor: floor,
        shadbala: undefined,
      }).find((x) => x.kind === "aspects")!;
      const expected = PLANETS.filter((q) => {
        if (q === pl) return false;
        const qp = r.positions.find((x) => x.planet === q)!;
        return drishtiQuarters(q, qp.signIndex, me.signIndex) >= floor;
      });
      if (!expected.length) assert.match(c.text, /^No aspect counted/);
      for (const q of expected) assert.ok(c.text.includes(`${q} from`), `${pl} floor ${floor}: ${q} in ${c.text}`);
      assert.doesNotMatch(c.text, /(^|[^e] )(Sun|Moon) /, "the Sun, the Moon");
    }
  }
});

test("combustion: the Parashari tab uses the Surya Siddhanta orbs; the Nadi 3°20' flag stays on the positions", () => {
  let wider = 0;
  for (const r of charts) {
    const sun = r.positions.find((x) => x.planet === "Sun")!;
    const lagnaSign = r.jaimini.lagna.signIndex;
    for (const g of computeCombinations(r.positions, lagnaSign, r.shadbala)) {
      const expected = g.planets.filter((x) => parashariCombust(x, sun.lon)).map((x) => x.planet).sort();
      assert.deepEqual(g.combust.map((x) => x.planet).sort(), expected, `${r.utc} stellium in ${g.sign}`);
    }
    const ctx = buildSarvarthaContext(r.positions, r.jaimini.lagna.lon);
    for (const x of r.positions) {
      if (x.planet === "Sun") continue;
      assert.equal(ctx.combust(x.planet), parashariCombust(x, sun.lon), `${r.utc} Sarvartha ${x.planet}`);
      if (parashariCombust(x, sun.lon) && !x.combust) wider += 1;
    }
  }
  // The orbs are wider than 3°20', so some planet in the set is combust here and not for the Nadi systems.
  assert.ok(wider > 0);
});
