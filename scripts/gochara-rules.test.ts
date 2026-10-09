// Gochara colour rules (Phaladeepika 26.30 aspects, 26.41 Ashtakavarga) and the practitioner checks beside them.
// Positions are synthetic so that each case isolates one rule; dignity is set by hand for the same reason.
//
// Run from the repository root: `npm test`.

import test from "node:test";
import assert from "node:assert/strict";

import { SIGNS, SIGN_LORD, NAKSHATRAS, type Dignity, type Planet, type PlanetPosition, type TransitPeriod } from "@shared/astro";
import { computeGochara, natureOf, GOCHARA_CAVEATS, saturnPracticeName, saturnShortName } from "@shared/gochara";
import { gocharaPractice, saturnLoops, GOCHARA_PRACTICE_NOTES } from "@shared/gochara-practice";

function P(planet: Planet, signIndex: number, deg = 15, dignity: Dignity = "Neutral", lonOverride?: number): PlanetPosition {
  const lon = lonOverride ?? signIndex * 30 + deg;
  const nak = Math.floor(lon / (360 / 27));
  return {
    planet,
    lon,
    signIndex,
    sign: SIGNS[signIndex],
    degInSign: lon - signIndex * 30,
    speed: 0.1,
    retrograde: false,
    nakshatraIndex: nak,
    nakshatra: NAKSHATRAS[nak],
    nakshatraLord: "Ketu",
    pada: 1,
    dignity,
    combust: false,
    signLord: SIGN_LORD[signIndex],
  };
}
const row = (g: ReturnType<typeof computeGochara>, p: Planet) => g.rows.find((r) => r.planet === p)!;
const ARIES = 0;
const AS_OF = "2026-10-08T00:00:00Z";

test("26.30: a malefic's aspect voids a good house", () => {
  // Jupiter in Leo is the 5th from an Aries Moon (good); Saturn in Gemini casts its 3rd aspect on Leo.
  const g = computeGochara(ARIES, [P("Jupiter", 4, 15, "Friendly"), P("Saturn", 2, 15, "Friendly")], AS_OF);
  const j = row(g, "Jupiter");
  assert.equal(j.favourable, true);
  assert.equal(j.verdict, "neutral");
  assert.deepEqual(j.aspectNote?.by, ["Saturn"]);
  assert.match(j.aspectNote!.text, /good of this house is void \(26\.30\)/);
  assert.ok(j.aspectNote!.sources.some((s) => s.label === "Phaladeepika 26.30" && s.provisional));
  // Saturn itself is in the 3rd (good) and nothing aspects it.
  assert.equal(row(g, "Saturn").verdict, "favourable");
});

test("26.30: a benefic's aspect voids an ill house and sets the danger reading aside", () => {
  // Saturn in Scorpio is the 8th from an Aries Moon (ill); Jupiter in Cancer casts its 5th aspect on Scorpio.
  const g = computeGochara(ARIES, [P("Saturn", 7), P("Jupiter", 3, 15, "Exalted")], AS_OF);
  const s = row(g, "Saturn");
  assert.equal(s.favourable, false);
  assert.equal(s.verdict, "neutral");
  assert.match(s.aspectNote!.text, /ill of this house is void \(26\.30\)\. The danger reading of 26\.33-34 is set aside here\./);
  assert.equal(s.danger, undefined);
  // Without the aspect the danger reading stands.
  assert.equal(row(computeGochara(ARIES, [P("Saturn", 7)], AS_OF), "Saturn").danger?.source.label, "Phaladeepika 26.33");
});

test("26.31: an exalted planet in a danger house does no harm, so the danger reading is set aside", () => {
  // Exalted Mars in Capricorn, the 1st from a Capricorn Moon (26.33 names the 1st for Mars).
  const m = row(computeGochara(9, [P("Mars", 9, 15, "Exalted")], AS_OF), "Mars");
  assert.equal(m.verdict, "neutral");
  assert.match(m.dignityNote!.text, /does no harm \(26\.31\)\. The danger reading/);
  assert.equal(m.danger, undefined);
  // A weak planet there aggravates the ill, and the danger reading stands.
  const w = row(computeGochara(9, [P("Mars", 9, 15, "Inimical")], AS_OF), "Mars");
  assert.equal(w.danger?.source.label, "Phaladeepika 26.33");
});

test("26.30 with BS 104.53: an enemy's aspect voids the good even from a benefic", () => {
  // Venus in Aquarius aspects Leo by the 7th; Venus is benefic but Jupiter's enemy.
  const g = computeGochara(ARIES, [P("Jupiter", 4, 15, "Friendly"), P("Venus", 10, 15, "Friendly")], AS_OF);
  const j = row(g, "Jupiter");
  assert.equal(j.verdict, "neutral");
  assert.match(j.aspectNote!.text, /Venus \(benefic, its enemy, 7th aspect\)/);
  assert.ok(j.aspectNote!.sources.some((s) => s.label === "Brihat Samhita 104.53"));
});

test("dignity decides before the aspect rule", () => {
  // Debilitated Jupiter in Capricorn, the 7th from a Cancer Moon (good house): 26.32 voids it; Venus's aspect is not applied.
  const g1 = computeGochara(3, [P("Jupiter", 9, 15, "Debilitated"), P("Venus", 3, 15, "Exalted")], AS_OF);
  const j1 = row(g1, "Jupiter");
  assert.equal(j1.verdict, "neutral");
  assert.match(j1.dignityNote!.text, /good of this house is void/);
  assert.equal(j1.aspectNote, undefined);
  assert.ok(j1.aspects.some((a) => a.by === "Venus"));
  // Jupiter in its own Sagittarius, the 9th from an Aries Moon: full results (26.31) although Saturn aspects it from Libra.
  const g2 = computeGochara(ARIES, [P("Jupiter", 8, 15, "Own sign"), P("Saturn", 6, 15, "Exalted")], AS_OF);
  const j2 = row(g2, "Jupiter");
  assert.equal(j2.verdict, "favourable");
  assert.match(j2.dignityNote!.text, /full results/);
  assert.equal(j2.aspectNote, undefined);
});

test("26.41: five marks of eight make an ill house good and set the danger aside; four do not", () => {
  const marks = (n: number) => ({ Saturn: Array.from({ length: 12 }, (_, i) => (i === 7 ? n : 3)) });
  const g5 = computeGochara(ARIES, [P("Saturn", 7)], AS_OF, false, { ownMarks: marks(5) });
  const s5 = row(g5, "Saturn");
  assert.equal(s5.favourable, false, "the house itself is still the 8th");
  assert.equal(s5.verdict, "favourable");
  assert.equal(s5.avMarks, 5);
  assert.match(s5.avNote!.text, /5 of 8 marks .* \(26\.41\)\. The danger reading of 26\.33-34 is set aside here\./);
  assert.equal(s5.danger, undefined);
  const g4 = computeGochara(ARIES, [P("Saturn", 7)], AS_OF, false, { ownMarks: marks(4) });
  const s4 = row(g4, "Saturn");
  assert.equal(s4.verdict, "unfavourable");
  assert.equal(s4.avNote, undefined);
  assert.equal(s4.danger?.source.label, "Phaladeepika 26.33");
  // Without marks the rule is not applied at all.
  assert.equal(row(computeGochara(ARIES, [P("Saturn", 7)], AS_OF), "Saturn").verdict, "unfavourable");
});

test("26.41 for a minor: the danger sentence is withheld, the rest of the note stays", () => {
  const ownMarks = { Saturn: Array.from({ length: 12 }, () => 6) };
  const s = row(computeGochara(ARIES, [P("Saturn", 7)], AS_OF, true, { ownMarks }), "Saturn");
  assert.match(s.avNote!.text, /6 of 8 marks/);
  assert.doesNotMatch(s.avNote!.text, /danger/i);
});

test("the nodes cast no aspect", () => {
  const g = computeGochara(ARIES, [P("Jupiter", 4, 15, "Friendly"), P("Rahu", 10), P("Ketu", 4)], AS_OF);
  const j = row(g, "Jupiter");
  assert.equal(j.verdict, "favourable");
  assert.equal(j.aspects.length, 0);
});

test("the waning Moon is malefic, the waxing Moon benefic (Phaladeepika ch. 26 notes)", () => {
  // Moon in Aquarius (315°) aspects Leo by the 7th. Sun in Gemini (65°): 250° behind, so the Moon is waning.
  const waning = [P("Jupiter", 4, 15, "Friendly"), P("Moon", 10), P("Sun", 2, 5)];
  assert.equal(natureOf("Moon", waning), "malefic");
  assert.equal(row(computeGochara(ARIES, waning, AS_OF), "Jupiter").verdict, "neutral");
  // Sun in Scorpio (215°): 100° behind, waxing.
  const waxing = [P("Jupiter", 4, 15, "Friendly"), P("Moon", 10), P("Sun", 7, 5)];
  assert.equal(natureOf("Moon", waxing), "benefic");
  assert.equal(row(computeGochara(ARIES, waxing, AS_OF), "Jupiter").verdict, "favourable");
});

test("Mercury with a malefic is malefic", () => {
  // Venus in Gemini, the 3rd from an Aries Moon (good); Mercury and Mars together in Sagittarius aspect it by the 7th.
  const ps = [P("Venus", 2, 15, "Friendly"), P("Mercury", 8), P("Mars", 8, 20, "Friendly")];
  assert.equal(natureOf("Mercury", ps), "malefic");
  assert.equal(natureOf("Mercury", [P("Mercury", 8)]), "benefic");
  const v = row(computeGochara(ARIES, ps, AS_OF), "Venus");
  assert.equal(v.verdict, "neutral");
  assert.deepEqual([...v.aspectNote!.by].sort(), ["Mars", "Mercury"]);
});

test("the not-implemented caveat names the right verses", () => {
  const last = GOCHARA_CAVEATS[GOCHARA_CAVEATS.length - 1];
  assert.match(last, /nakshatra tara tables \(26\.26-29\)/);
  assert.match(last, /limb tables \(26\.35-40\)/);
  assert.doesNotMatch(last, /26\.26-30|35-41/);
});

const fmtDate = (iso: string) => iso.slice(0, 10);

test("practice: Saturn's 3rd aspect on the Moon from the 11th is flagged as a disagreement", () => {
  const checks = gocharaPractice({
    natalMoonSign: ARIES,
    natalLagnaSign: 3,
    birthStar: 0,
    positions: [P("Saturn", 10), P("Jupiter", 6)],
    asOf: AS_OF,
    fmtDate,
  });
  const onMoon = checks.find((c) => c.id === "moon-aspects")!;
  const sat = onMoon.lines.find((l) => l.planet === "Saturn")!;
  assert.match(sat.text, /11th from the Moon casts its 3rd aspect/);
  assert.ok(sat.conflict);
  const jup = onMoon.lines.find((l) => l.planet === "Jupiter")!;
  assert.match(jup.text, /7th from the Moon casts its 7th aspect .* colour is unchanged/);
  // Lagna lens: Saturn is the 11th from the Moon (good) but the 8th from a Cancer lagna.
  const lens = checks.find((c) => c.id === "lagna")!.lines.find((l) => l.planet === "Saturn")!;
  assert.equal(lens.tone, "mixed");
  assert.match(lens.text, /outward life may strain/);
  assert.ok(onMoon.sources.every((s) => s.provisional));
});

test("practice: tara, node axis and Mars stay", () => {
  // Birth star Ashwini (0); the Moon in Uttara Phalguni (11) is the 12th star: Vipat.
  const moon = P("Moon", 5, 0, "Neutral", 11 * (360 / 27) + 1);
  const checks = gocharaPractice({
    natalMoonSign: ARIES,
    natalLagnaSign: ARIES,
    birthStar: 0,
    positions: [moon, P("Rahu", 1), P("Ketu", 7), P("Mars", 4)],
    asOf: AS_OF,
    marsStay: { planet: "Mars", signIndex: 4, start: "2026-06-01T00:00:00Z", end: "2026-11-15T00:00:00Z" },
    fmtDate,
  });
  const tara = checks.find((c) => c.id === "tara")!.lines[0];
  assert.match(tara.text, /12th star from the birth star Ashwini: Vipat tara, less supportive/);
  assert.equal(tara.tone, "strain");
  assert.match(checks.find((c) => c.id === "nodes")!.lines[0].text, /2nd-8th axis/);
  assert.match(checks.find((c) => c.id === "mars")!.lines[0].text, /Mars stays in Leo/);
  const brief = gocharaPractice({
    natalMoonSign: ARIES,
    natalLagnaSign: ARIES,
    birthStar: 0,
    positions: [P("Mars", 4)],
    asOf: AS_OF,
    marsStay: { planet: "Mars", signIndex: 4, start: "2026-09-20T00:00:00Z", end: "2026-11-05T00:00:00Z" },
    fmtDate,
  });
  assert.match(brief.find((c) => c.id === "mars")!.lines[0].text, /passes through Leo .* passing influence/);
  // No wording of danger or destruction anywhere in the strip.
  for (const c of [...checks, ...brief]) for (const l of c.lines) assert.doesNotMatch(l.text, /danger|destruct|death/i);
});

test("practice: Saturn's retrograde loop is found from the sign periods", () => {
  const per = (signIndex: number, start: string, end: string, retrogradeEntry: boolean): TransitPeriod => ({
    planet: "Saturn",
    signIndex,
    sign: SIGNS[signIndex],
    start,
    end,
    retrogradeEntry,
  });
  const periods = [
    per(9, "2020-01-24", "2022-04-29", false),
    per(10, "2022-04-29", "2022-07-12", false),
    per(9, "2022-07-12", "2023-01-17", true),
    per(10, "2023-01-17", "2025-03-29", false),
  ];
  const loops = saturnLoops(periods, "2022-10-01T00:00:00Z");
  assert.equal(loops.length, 1);
  assert.equal(loops[0].settles, "2023-01-17");
  assert.equal(saturnLoops(periods, "2026-10-01T00:00:00Z").length, 0);
});

test("practice notes leave out the author's dasa weighting", () => {
  assert.ok(GOCHARA_PRACTICE_NOTES.some((n) => /Not used: the author's weighting of dasa against gochara \(ch\. 7\)/.test(n)));
});

test("Saturn's practice names: provisional labels by house from the Moon, on Saturn's row only", () => {
  assert.deepEqual(
    [12, 1, 2, 4, 7, 8, 10].map(saturnShortName),
    ["Sade Sati, first phase", "Sade Sati, middle phase", "Sade Sati, last phase", "Ardhashtama or Kandaka Shani", "Kandaka Shani", "Ashtama Shani", "Kandaka Shani"],
  );
  for (const h of [3, 5, 6, 9, 11]) assert.equal(saturnShortName(h), undefined);
  // Moon in Aries: Saturn in Scorpio is the 8th; Jupiter in Scorpio carries no name; Saturn in Gemini (3rd) carries none.
  const g = computeGochara(ARIES, [P("Saturn", 7), P("Jupiter", 7)], AS_OF);
  const sat = row(g, "Saturn").practiceName!;
  assert.equal(sat.text, saturnPracticeName(8));
  assert.ok(sat.source.provisional);
  assert.equal(row(g, "Jupiter").practiceName, undefined);
  assert.equal(row(computeGochara(ARIES, [P("Saturn", 2)], AS_OF), "Saturn").practiceName, undefined);
});

test("caveats: the medical-care line is among the three the report prints", () => {
  assert.ok(GOCHARA_CAVEATS.slice(0, 3).some((c) => /not a diagnosis/.test(c) && /doctor/.test(c)));
});
