// Neechabhanga: the classical cancellations of Phaladeepika 7.26-29 and Jataka Parijata 7.13-14, 7.20 (with 7.55 on
// Vaidyanatha's own conditions), and the cancellation named beside each line that states a cancelled debility (N1-N7).
// Public figures and synthetic positions only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Chart } from "@shared/schema";
import { drishtiQuarters, type Planet, type PlanetPosition } from "@shared/astro";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import {
  authorOf,
  cancellationNote,
  cancellationSources,
  debilityLink,
  JATAKA_PARIJATA_CH7_URL,
  navamsaOf,
  neechaBhanga,
  PHALADEEPIKA_CH7_URL,
  statesDebility,
} from "@shared/neechabhanga";
import { combustQualifiers } from "@shared/combustion-modern";
import { dasaCondition } from "@shared/parashari-period-significations";
import { computeChart } from "../server/routes";

const FIXTURES: Array<Record<string, unknown> & { name: string }> = JSON.parse(
  readFileSync("scripts/fixtures/public-figures.json", "utf8"),
).charts;
function chartOf(name: string) {
  const c0 = FIXTURES.find((c) => c.name === name)!;
  const r = computeChart({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c0 } as unknown as Chart);
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, "2026-10-25T00:00:00Z", r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, false, "rashi");
  return { r, par };
}

// Synthetic positions: debilitation by sign only, enough for these rules.
const DEBIL: Partial<Record<Planet, number>> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const P = (planet: Planet, lon: number): PlanetPosition =>
  ({
    planet,
    lon,
    signIndex: Math.floor(lon / 30),
    degInSign: lon % 30,
    dignity: DEBIL[planet] === Math.floor(lon / 30) ? "Debilitated" : "Neutral",
    retrograde: false,
  }) as unknown as PlanetPosition;
// Taurus lagna. The Sun (Libra 21°, navamsa Aries) and Venus (Virgo 8°, navamsa Pisces) are both debilitated and both
// in the navamsa of their exaltation sign; no condition of Phaladeepika 7.26-28 or Jataka Parijata 7.13-14 holds, and
// no enemy or debilitated planet aspects either of them.
const LAGNA = 1;
const twoPlanets = (moonLon = 130, venusLon = 158) => [
  P("Sun", 201),
  P("Moon", moonLon),
  P("Mars", 10),
  P("Mercury", 205),
  P("Jupiter", 70),
  P("Venus", venusLon),
  P("Saturn", 220),
  P("Rahu", 250),
  P("Ketu", 70),
];
const nbOf = (planet: Planet, pos: PlanetPosition[], lagna = LAGNA) => neechaBhanga(planet, pos, lagna, drishtiQuarters)!;

test("neechabhanga: the synthetic chart is what it claims", () => {
  const pos = twoPlanets();
  assert.equal(navamsaOf(pos.find((p) => p.planet === "Sun")!), 0, "Sun in the Aries navamsa");
  assert.equal(navamsaOf(pos.find((p) => p.planet === "Venus")!), 11, "Venus in the Pisces navamsa");
});

test("JP 7.20: two debilitated planets in their exaltation navamsa cancel; one alone stays later practice", () => {
  const pos = twoPlanets();
  for (const pl of ["Sun", "Venus"] as Planet[]) {
    const nb = nbOf(pl, pos);
    const c = nb.conditions.find((x) => x.id === "navamsa-exalted")!;
    assert.ok(c.met && !c.provisional, `${pl}: classical`);
    assert.equal(c.source, "Jataka Parijata 7.20");
    assert.ok(c.text.includes("2 debilitated planets so placed"), c.text);
    assert.ok(nb.cancelled, `${pl}: cancelled`);
    assert.deepEqual(nb.pdVerses, []);
    assert.deepEqual(nb.jpVerses, ["7.20"]);
    assert.equal(nb.verses, "Jataka Parijata 7.20");
    const src = cancellationSources(nb);
    assert.deepEqual(src.source, { label: "Jataka Parijata 7.20", url: JATAKA_PARIJATA_CH7_URL });
    assert.equal(src.also, undefined);
  }
  // Venus moved out of its exaltation navamsa: the Sun alone is so placed, which 7.20 does not cover.
  const one = twoPlanets(130, 152);
  const sun = nbOf("Sun", one);
  const c = sun.conditions.find((x) => x.id === "navamsa-exalted")!;
  assert.ok(c.met && c.provisional, "one planet: later practice");
  assert.ok(c.text.includes("asks for two to four"), c.text);
  assert.ok(!sun.cancelled && sun.provisionalOnly, "shown, not applied");
  assert.equal(sun.verses, "");
});

test("JP 7.55: an enemy's aspect withholds Vaidyanatha's conditions only", () => {
  // The Moon in Aquarius aspects Venus in Virgo (8th, three-quarter); the Moon is Venus's enemy.
  const pos = twoPlanets(310);
  const ve = nbOf("Venus", pos);
  assert.deepEqual(ve.jp755?.by, ["Moon"]);
  assert.ok(ve.jp755!.text.includes("Jataka Parijata 7.55 withholds Vaidyanatha's royal yogas"), ve.jp755!.text);
  assert.ok(!ve.cancelled, "no condition of Mantreswara's holds, and Vaidyanatha's is withheld");
  assert.deepEqual(ve.jpVerses, []);
  // The Sun is not aspected by an enemy or a debilitated planet: its 7.20 stands.
  const sun = nbOf("Sun", pos);
  assert.equal(sun.jp755, undefined);
  assert.ok(sun.cancelled && sun.verses === "Jataka Parijata 7.20");
  // A real chart: Mercury aspects Jupiter, so 7.55 withholds Jataka Parijata 7.13-14; Phaladeepika 7.26, 7.29 stand.
  const { par } = chartOf("Barack Obama");
  const ju = par.neechaBhanga.find((n) => n.planet === "Jupiter")!;
  assert.deepEqual(ju.jp755?.by, ["Mercury"]);
  assert.ok(ju.cancelled);
  assert.deepEqual(ju.pdVerses, ["7.26", "7.29"]);
  assert.deepEqual(ju.jpVerses, []);
  assert.equal(ju.verses, "Phaladeepika 7.26, 7.29");
  const f = par.findings.find((x) => x.id === "pa-neecha-Jupiter")!;
  assert.ok(f.text.includes("Mantreswara's verses are not touched"), f.text);
  assert.ok(f.text.includes("Mantreswara cancels the debility"), f.text);
  assert.equal(f.sourceAlso, undefined);
});

test("JP 7.13 is cited beside Phaladeepika 7.26 and 7.29", () => {
  const { par } = chartOf("Elizabeth II");
  const me = par.neechaBhanga.find((n) => n.planet === "Mercury")!;
  assert.equal(me.verses, "Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13");
  const f = par.findings.find((x) => x.id === "pa-neecha-Mercury")!;
  assert.deepEqual(f.source, { label: "Phaladeepika 7.26, 7.29", url: PHALADEEPIKA_CH7_URL });
  assert.deepEqual(f.sourceAlso, { label: "Jataka Parijata 7.13", url: JATAKA_PARIJATA_CH7_URL });
  assert.ok(f.text.includes("Mantreswara and Vaidyanatha cancel the debility"), f.text);
  // N5: the modern reading, for the practitioner view only.
  assert.ok(f.detail!.startsWith("Modern authors read a cancellation as a lift, not by itself a royal yoga (Pande, Kundali Deep Dive, ch. 1; Shweta, Decoding the Bhavas vol. 2, §28.4)."), f.detail);
  assert.ok(f.detail!.endsWith("The verses promise the yoga."), f.detail);
  // Phaladeepika 7.28 alone (the dispositor's aspect) cites no Jataka Parijata verse.
  const ju = par.neechaBhanga.find((n) => n.planet === "Jupiter")!;
  assert.equal(ju.verses, "Phaladeepika 7.28");
});

test("JP 7.14: the movable-lagna reading is classical; the lagna lord in a movable navamsa is provisional", () => {
  // Cancer rising: Venus, lord of Jupiter's navamsa (Taurus), is in the 10th. Only 7.14 cancels.
  const s = chartOf("Sachin Tendulkar").par;
  const ju = s.neechaBhanga.find((n) => n.planet === "Jupiter")!;
  const c = ju.conditions.find((x) => x.id === "jp-navamsa-lord")!;
  assert.ok(c.met && !c.provisional && c.source === "Jataka Parijata 7.14", c.text);
  assert.ok(c.text.includes("the lagna, Cancer, is a movable sign"), c.text);
  assert.equal(ju.verses, "Jataka Parijata 7.14");
  const f = s.findings.find((x) => x.id === "pa-neecha-Jupiter")!;
  assert.deepEqual(f.source, { label: "Jataka Parijata 7.14", url: JATAKA_PARIJATA_CH7_URL });
  assert.ok(f.text.includes("Vaidyanatha cancels the debility"), f.text);
  assert.ok(f.detail!.endsWith("Vaidyanatha's verse promises the yoga."), f.detail);
  // Gemini rising (not movable), its lord in a movable navamsa: the other reading, provisional.
  const e = chartOf("Albert Einstein").par;
  const mo = e.neechaBhanga.find((n) => n.planet === "Moon")!;
  const m = mo.conditions.find((x) => x.id === "jp-navamsa-lord")!;
  assert.ok(m.met && m.provisional, m.text);
  assert.ok(m.text.includes("the other reading of the verse's second clause"), m.text);
  assert.ok(!mo.jpVerses.includes("7.14"), "the other reading is not cited as cancelling");
});

test("statesDebility: the app's sentence shapes", () => {
  const yes: Array<[string, Planet, boolean?]> = [
    ["Sun, lord of the 11th, is debilitated.", "Sun"],
    ["The Sun debilitated: anxieties, losses.", "Sun"],
    ["Sun, debilitated, a malefic, in it (50.92)", "Sun"],
    ["Sun, Saturn debilitated in the sign", "Saturn"],
    ["Jupiter, its lord, debilitated: loss of fortune (50.40-41).", "Jupiter"],
    ["A debilitated Moon: loss of wealth.", "Moon"],
    ["Moon is in the 6th and debilitated: the general rule reads the dasa as unfavourable.", "Moon", true],
    ["Mercury at 11.0 deg of Pisces ... and by its debilitated sign Adhama.", "Mercury", true],
  ];
  const no: Array<[string, Planet, boolean?]> = [
    ["Jupiter, lord of the 5th, is debilitated in the 3rd while Mercury and Ketu occupy the 5th", "Mercury"],
    ["Mars, the lagna lord, is in the 8th with a malefic while Sun, the 2nd lord, is debilitated.", "Mars"],
    ["Mars, Jupiter malefic or debilitated in the 4th from the sign: loss of house (50.62).", "Jupiter"],
    ["Mercury is combust, which Mantreswara counts like debilitation, but it stands in a friend's navamsa.", "Mercury", true],
    ["Its dispositor Venus is debilitated in Virgo.", "Sun", true],
  ];
  for (const [t, p, own] of yes) assert.ok(statesDebility(t, p, own), `${p}: ${t}`);
  for (const [t, p, own] of no) assert.ok(!statesDebility(t, p, own), `${p}: ${t}`);
  assert.equal(authorOf("Parashara 47.5-6"), "Parashara");
  assert.equal(authorOf("Phaladeepika 20.30, 20.57"), "Mantreswara");
  assert.equal(authorOf("Jataka Parijata 7.14"), "Vaidyanatha");
});

test("N1: the house findings and the dasa notes that state a cancelled debility name the cancellation", () => {
  const { par } = chartOf("Elizabeth II");
  for (const id of ["pa-h7-18-5", "pa-h7-18-17", "pa-h7-18-19"]) {
    const f = par.findings.find((x) => x.id === id)!;
    assert.ok(f, id);
    assert.equal(f.debilityCancelled?.text, "Mercury: debility cancelled in Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13; Parashara does not state the cancellation.");
    assert.equal(f.debilityCancelled?.plain, "Another classical rule cancels this weakness, so expect effort before results.");
    assert.ok(f.text.startsWith("Mercury, lord of the 7th, is debilitated"), "the line keeps its wording");
  }
  // The neechabhanga findings themselves and the supports are not annotated.
  for (const f of par.findings)
    if (f.id.startsWith("pa-neecha-") || f.tone === "support") assert.equal(f.debilityCancelled, undefined, f.id);
  // The house-by-house prose carries the clause in both views.
  const h7 = par.houseProse!.find((h) => h.house === 7)!;
  const part = h7.parts.find((p) => p.text.includes("Parashara reads the spouse's life as cut short"))!;
  assert.ok(part.text.includes("Mercury: debility cancelled in Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13"), part.text);
  assert.ok(part.textPlain.includes("Another classical rule cancels this weakness"), part.textPlain);

  // Dasa notes: Parashara's lines carry the clause; the 20.57 combustion note does not state the debility.
  const e = chartOf("Albert Einstein").par;
  const me = e.dasaReadings.find((d) => d.lord === "Mercury")!;
  const n6 = me.notes.find((n) => n.id === "Mercury-47-6")!;
  assert.ok(n6.debilityCancelled?.text.endsWith("Parashara does not state the cancellation."), n6.debilityCancelled?.text);
  assert.equal(me.notes.find((n) => n.id === "Mercury-pd-20-57")?.debilityCancelled, undefined);
  // The neecha note cites the verses that hold, not a fixed range.
  const nn = me.notes.find((n) => n.id === "Mercury-neecha")!;
  assert.ok(nn.text.includes("(Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13)"), nn.text);
  assert.deepEqual(nn.source, { label: "Phaladeepika 7.26, 7.29", url: PHALADEEPIKA_CH7_URL });
  assert.deepEqual(nn.sourceAlso, { label: "Jataka Parijata 7.13", url: JATAKA_PARIJATA_CH7_URL });
  // A lord in the 6th: the clause says the cancellation is less full there (Phaladeepika 7.28).
  const mo = e.dasaReadings.find((d) => d.lord === "Moon")!;
  assert.ok(mo.notes.find((n) => n.id === "Moon-48-1b")!.debilityCancelled!.text.includes("less fully in the 6th (Phaladeepika 7.28)"));
  assert.ok(mo.debilityCancelled!.plain.includes("in part"));
  // N3: the counts are unchanged; the strain lines stay strain.
  assert.equal(n6.tone, "strain");
});

test("N1: the dignity check, the antar facts and the sign-dasa readings", () => {
  const { par } = chartOf("Barack Obama");
  const chk = par.checks.Jupiter!.find((c) => c.kind === "dignity")!;
  assert.equal(chk.text, "Debilitated (debility cancelled in Phaladeepika 7.26, 7.29; Parashara does not state the cancellation).");
  assert.ok(chk.plain.endsWith("Another classical rule cancels this weakness, so expect effort before results."), chk.plain);
  assert.equal(chk.against, true, "still counted against");
  const antars = par.dasaReadings.flatMap((d) => d.antars.filter((a) => a.lord === "Jupiter"));
  assert.ok(antars.length > 0);
  for (const a of antars)
    assert.equal(Boolean(a.debilityCancelled), a.facts.adverse.includes("debilitated"), `${a.lord}: ${a.facts.adverse.join("; ")}`);
  // Kalachakra: a reading that names Jupiter as debilitated carries the clause; the generic lists do not.
  const kc = par.kalachakra!;
  const rds = kc.periods.flatMap((p) => kc.readingsFor(p));
  const named = rds.filter((rd) => /Jupiter(, its lord,)? debilitated/.test(rd.text));
  assert.ok(named.length > 0);
  for (const rd of named) assert.ok(rd.debilityCancelled?.planets.includes("Jupiter"), rd.text);
  for (const rd of rds.filter((x) => x.tone === "support")) assert.equal(rd.debilityCancelled, undefined);
});

test("N2: the period condition of a cancelled debility reads mixed; the lean is unchanged", () => {
  const { r, par } = chartOf("Barack Obama");
  const d = par.dasaReadings.find((x) => x.lord === "Jupiter")!;
  const c = dasaCondition(d, r.positions);
  assert.equal(c.condition, "mixed");
  assert.equal(c.tag, "mixed: debilitated, cancelled (Phaladeepika 7.26, 7.29)");
  assert.equal(c.whyPlain, "Jupiter is weak by sign, but another rule cancels that, so these matters may take effort before they settle.");
  assert.ok(c.why.includes("the period's strain lines stay counted"), c.why);
  // Without the cancellation the same lord reads strained.
  const { debilityCancelled: _drop, ...bare } = d;
  assert.equal(dasaCondition(bare, r.positions).condition, "strained");
});

test("N4: PVR's p. 84 note gains its caveat in the practitioner text only", () => {
  const S = (planet: Planet, lon: number, dignity = "Neutral"): PlanetPosition =>
    ({ planet, lon, signIndex: Math.floor(lon / 30), dignity, retrograde: false }) as unknown as PlanetPosition;
  const pos = [S("Sun", 185, "Debilitated"), S("Jupiter", 190), S("Mars", 195), S("Venus", 180), S("Saturn", 30), S("Rahu", 186)];
  const base = combustQualifiers("Jupiter", pos).find((n) => n.id === "Jupiter-modern-sun-debilitated")!;
  const withC = combustQualifiers("Jupiter", pos, { sunCancelled: "Phaladeepika 7.26, 7.29" }).find((n) => n.id === "Jupiter-modern-sun-debilitated")!;
  assert.ok(!base.text.includes("cancelled"));
  assert.equal(withC.text, `${base.text} PVR does not say whether a cancelled debility changes this; here the Sun's debility is cancelled (Phaladeepika 7.26, 7.29).`);
  assert.equal(withC.plain, base.plain, "plain unchanged");
});

test("cancellationNote and debilityLink: authors, several planets, and nothing for an uncancelled debility", () => {
  const pos = twoPlanets();
  const nbs = [nbOf("Sun", pos), nbOf("Venus", pos)];
  const both = cancellationNote(nbs)!;
  assert.deepEqual(both.planets, ["Sun", "Venus"]);
  // The Sun is in the 6th from the Taurus lagna, where Phaladeepika 7.28 expects less: "in part".
  assert.equal(both.plain, "Another classical rule cancels the weakness of the Sun and Venus in part, so expect effort before results.");
  assert.ok(both.text.startsWith("Sun: debility cancelled in Jataka Parijata 7.20, less fully in the 6th (Phaladeepika 7.28); Venus: debility cancelled in Jataka Parijata 7.20;"), both.text);
  assert.equal(debilityLink(nbs, "Sun, Venus debilitated in the sign", ["Sun", "Venus"])?.planets.length, 2);
  assert.ok(debilityLink(nbs, "Venus is debilitated.", ["Venus"], { author: "Mantreswara" })!.text.endsWith("Mantreswara gives the cancellation in ch. 7, not in this verse."));
  assert.equal(debilityLink(nbs, "Mars is debilitated.", ["Mars"]), undefined);
  const one = twoPlanets(130, 152);
  assert.equal(debilityLink([nbOf("Sun", one)], "Sun is debilitated.", ["Sun"]), undefined, "provisional only: no clause");
});
