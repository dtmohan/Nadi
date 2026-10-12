/**
 * BPHS ch. 45, the six states (Lajjitadi) read from the Sanskrit: the conditions of 45.15-17, the
 * per-planet reading of 45.19-20 with strength deciding between good and harsh states, the house
 * rules of 45.21-23, the effects of 45.24-29 without a dasa, combustion by the Parashari orbs, and
 * the minors' gate on the effect lines.
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { FRIENDS, ENEMIES, SIGN_LORD, type Planet, type PlanetPosition } from "@shared/astro";
import { computeParashari, ruleAspect, naturalBenefic, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { LAJJITADI_EFFECTS } from "@shared/parashari-avasthas";
import { parashariCombust } from "@shared/vargas";
import { redactProse, withholdText } from "@shared/life-stage";
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
const charts = BIRTHS.map(([birthDate, birthTime]) => computeChart({ ...base, birthDate, birthTime }));
const read = (r: ReturnType<typeof computeChart>) =>
  computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, AS_OF, r.shadbala, r.dasaStarts);

const rel = (a: Planet, b: Planet) => (FRIENDS[a]?.includes(b) ? "friend" : ENEMIES[a]?.includes(b) ? "enemy" : "neutral");
const asp = ruleAspect(DEFAULT_ASPECT_FLOOR);

test("45.15-17: thirsty by an enemy's aspect, delighted by friends, agitated by malefics aspecting", () => {
  const fired = { Mudita: 0, Trushita: 0, Kshobhita: 0 };
  for (const r of charts) {
    const p = read(r);
    for (const a of p.avasthas.planets) {
      const me = r.positions.find((x) => x.planet === a.planet)!;
      const co = r.positions.filter((q) => q.planet !== me.planet && q.signIndex === me.signIndex);
      const by = r.positions.filter((q) => q.planet !== me.planet && q.signIndex !== me.signIndex && asp(q.planet, q.signIndex, me.signIndex) > 0);
      const ben = (q: PlanetPosition) => naturalBenefic(q, r.positions);
      const lord = SIGN_LORD[me.signIndex] as Planet;
      const mudita =
        (lord !== me.planet && rel(me.planet, lord) === "friend") ||
        co.some((q) => rel(me.planet, q.planet) === "friend") ||
        by.some((q) => rel(me.planet, q.planet) === "friend") ||
        (me.planet !== "Jupiter" && co.some((q) => q.planet === "Jupiter"));
      const trushita = [3, 7, 11].includes(me.signIndex) && by.some((q) => rel(me.planet, q.planet) === "enemy") && !by.some(ben);
      const kshobhita =
        me.planet !== "Sun" && co.some((q) => q.planet === "Sun") && (by.some((q) => !ben(q)) || by.some((q) => rel(me.planet, q.planet) === "enemy"));
      const has = (n: string) => a.lajjitadi.some((l) => l.name === n);
      assert.equal(has("Mudita"), mudita, `${r.utc} ${a.planet} Mudita`);
      assert.equal(has("Trushita"), trushita, `${r.utc} ${a.planet} Trushita`);
      assert.equal(has("Kshobhita"), kshobhita, `${r.utc} ${a.planet} Kshobhita`);
      if (mudita) fired.Mudita++;
      if (trushita) fired.Trushita++;
      if (kshobhita) fired.Kshobhita++;
    }
  }
  assert.ok(fired.Mudita > 0 && fired.Kshobhita > 0, JSON.stringify(fired));
});

test("Kopa is combustion by the Parashari orbs, not the Nadi 3°20'", () => {
  let parashariOnly = 0;
  for (const r of charts) {
    const p = read(r);
    const sunLon = r.positions.find((x) => x.planet === "Sun")!.lon;
    for (const a of p.avasthas.planets) {
      const me = r.positions.find((x) => x.planet === a.planet)!;
      assert.equal(a.deeptadi.names.includes("Kopa"), parashariCombust(me, sunLon), `${r.utc} ${a.planet}`);
      if (parashariCombust(me, sunLon) && !me.combust) parashariOnly++;
    }
  }
  assert.ok(parashariOnly > 0, "some planet is combust by the Parashari orb but not by the Nadi one");
});

test("45.19-20: one line per planet in a state, and strength decides the side", () => {
  let mixed = 0;
  for (const r of charts) {
    const p = read(r);
    const sunLon = r.positions.find((x) => x.planet === "Sun")!.lon;
    const losers = new Set(p.shadbala!.wars.map((w) => w.loser));
    const held = p.avasthas.planets.filter((a) => a.lajjitadi.length).map((a) => a.planet);
    assert.deepEqual(p.avasthas.lines.map((l) => l.planet), held);
    for (const l of p.avasthas.lines) {
      const me = r.positions.find((x) => x.planet === l.planet)!;
      const sb = p.shadbala!.planets.find((s) => s.planet === l.planet);
      const good = l.names.some((n) => n === "Garvita" || n === "Mudita");
      const harsh = l.names.some((n) => !["Garvita", "Mudita"].includes(n));
      assert.equal(l.mixed, good && harsh);
      if (!sb || !good) {
        assert.equal(l.lean, undefined, `${l.planet}: no lean without Shadbala or a good state`);
        continue;
      }
      const strong = sb.strong && !parashariCombust(me, sunLon) && !losers.has(sb.planet);
      const v20 = l.mixed && l.names.includes("Mudita");
      assert.equal(l.lean, strong ? "good" : v20 ? "loss" : "reduced", `${r.utc} ${l.planet}`);
      if (v20) {
        mixed++;
        assert.match(l.source.label, /45\.19-20, Sanskrit/);
        assert.equal(l.source.provisional, true);
      }
      // The plain line never says "loss"; the practitioner line carries the verse.
      assert.doesNotMatch(l.plain, /\bloss\b/i);
      assert.match(l.text, /45\.(19|20)/);
    }
  }
  assert.ok(mixed > 0, "some planet holds delight with a harsh state");
});

test("45.21-29: house rules renumbered, no unsourced two-state card, effects without a dasa", () => {
  const VERSE: Record<string, string> = { Garvita: "24", Mudita: "25", Lajjita: "26", Kshobhita: "27", Kshudhita: "28", Trushita: "29" };
  for (const r of charts) {
    const p = read(r);
    const ids = p.avasthas.findings.map((f) => f.id);
    for (const gone of ["av-two", "av-garvita", "av-mudita", "av-kshudhita", "av-kshobhita", "av-lajjita", "av-trushita"]) assert.ok(!ids.includes(gone), gone);
    const tenth = p.avasthas.findings.find((f) => f.id === "av-tenth");
    if (tenth) assert.equal(tenth.source.label, "Parashara 45.21, Sanskrit");
    const fifth = p.avasthas.findings.find((f) => f.id === "av-fifth");
    if (fifth) assert.equal(fifth.source.label, "Parashara 45.22");
    const seventh = p.avasthas.findings.find((f) => f.id === "av-seventh");
    if (seventh) assert.equal(seventh.source.label, "Parashara 45.23");
    // The house rules lead with a gentle line in plain view.
    for (const f of p.avasthas.findings.filter((x) => ["av-spoiled", "av-tenth", "av-fifth", "av-seventh"].includes(x.id))) {
      assert.ok(f.plain, f.id);
      assert.doesNotMatch(f.plain!, /\b(loss|end|destroyed|death|dies)\b/i, f.plain);
    }
    for (const e of p.avasthas.effects) {
      assert.equal(e.verse, VERSE[e.name]);
      assert.ok(e.planets.length > 0);
    }
    const prose = [...p.avasthas.effects.flatMap((e) => [e.text, e.plain]), ...p.avasthas.lines.flatMap((l) => [l.text, l.plain, l.brief, l.briefPlain])];
    for (const t of prose) assert.doesNotMatch(t, /\bdasa\b/i, t);
  }
});

test("the minors' gate drops only the loss and intimacy clauses from the effect lines", () => {
  const laj = redactProse(LAJJITADI_EFFECTS.Lajjita.text);
  assert.match(laj, /^Aversion to God/);
  assert.doesNotMatch(laj, /child/);
  const tru = redactProse(LAJJITADI_EFFECTS.Trushita.text);
  assert.match(tru, /loss of honour/);
  assert.doesNotMatch(tru, /intimacy/);
  for (const e of Object.values(LAJJITADI_EFFECTS)) {
    assert.equal(withholdText(redactProse(e.text)), false);
    assert.equal(withholdText(e.plain), false, e.plain);
  }
});
