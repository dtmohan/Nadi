// The birth-star reading: a separate modern layer paraphrased from Sutton, The Nakshatras (2014), ch. 4,
// with her pada qualifications (ch. 3) and the 48' gandanta limit (ch. 7). The checks here are structural:
// the table's order and patterns, Sutton's quarter classifications, the gentle and age gates, and the
// report section. Synthetic charts only (no real person's data).
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { NAKSHATRAS, NAKSHATRA_LORD } from "@shared/astro";
import {
  BIRTH_STARS,
  GANDANTA_DEG,
  birthStarPosition,
  birthStarReading,
  shownBirthStarItems,
} from "@shared/birth-star";
import { soften, plainViolations } from "@shared/gentle";
import { buildReport } from "@shared/report";
import { computeChart } from "../server/routes";

const QUARTER = 10 / 3;
const mid = (star: number, pada: number) => star * (40 / 3) + (pada - 1) * QUARTER + QUARTER / 2;
const pagesOf = (label: string) => {
  const m = label.match(/ch\. (\d+), e-book pp?\. (\d+)(?:–(\d+))?$/);
  assert.ok(m, label);
  return { ch: Number(m![1]), from: Number(m![2]), to: Number(m![3] ?? m![2]) };
};

test("27 star chapters in zodiacal order, each with the app's nakshatra lord", () => {
  assert.equal(BIRTH_STARS.length, 27);
  BIRTH_STARS.forEach((e, i) => {
    assert.equal(e.index, i);
    assert.equal(e.name, NAKSHATRAS[i]);
    assert.equal(e.lord, NAKSHATRA_LORD[i], e.name);
    assert.ok(e.pages[0] <= e.pages[1], e.name);
    if (i) assert.ok(e.pages[0] >= BIRTH_STARS[i - 1].pages[1], `${e.name} follows ${BIRTH_STARS[i - 1].name}`);
  });
});

test("every page cited for a star falls within its chapter, or in chapters 2, 3 and 7", () => {
  for (const e of BIRTH_STARS)
    for (let pada = 1; pada <= 4; pada++) {
      const s = birthStarReading(mid(e.index, pada), { withhold: false })!;
      const cites = [...s.items.map((i) => i.cite), ...s.facts.map((f) => f.cite), ...s.notes.map((n) => n.cite)];
      for (const c of cites) {
        const p = pagesOf(c.label);
        if (p.ch === 4) {
          assert.ok(p.from >= e.pages[0] && p.to <= e.pages[1], `${e.name}: ${c.label} outside ${e.pages.join("–")}`);
          assert.ok(p.from <= p.to, c.label);
        } else assert.ok([2, 3, 7].includes(p.ch), c.label);
      }
      assert.ok(s.facts.find((f) => f.key === "aim")!.cite.label.includes(`p. ${e.facts.aimPage}`), e.name);
    }
});

test("the gunas, doshas and life aims follow the book's regular patterns", () => {
  const G = ["rajas", "tamas", "sattva"];
  const D = ["vata", "pitta", "kapha"];
  // Sutton's chapter aims run with Abhijit between the 21st and the 22nd star (Abhijit: kama).
  const AIMS = "D A K M M K A D D A K M M K A D D A K M M A D D A K M".split(" ");
  const AIM = { D: "dharma", A: "artha", K: "kama", M: "moksha" } as const;
  BIRTH_STARS.forEach((e, i) => {
    assert.deepEqual(
      e.facts.gunas,
      [G[Math.floor(i / 9)], G[Math.floor((i % 9) / 3)], G[i % 3]],
      e.name,
    );
    const zig = i % 6 < 3 ? i % 3 : 2 - (i % 3);
    assert.equal(e.facts.dosha, D[zig], e.name);
    assert.equal(e.facts.aim, AIM[AIMS[i] as keyof typeof AIM], e.name);
  });
});

test("pushkara quarters: the sign-element rule gives Sutton's 24 by star lord", () => {
  const BY_LORD: Record<string, number[]> = { Rahu: [4], Moon: [2], Sun: [1, 4], Jupiter: [2, 4], Saturn: [2], Venus: [3] };
  let n = 0;
  for (let star = 0; star < 27; star++)
    for (let pada = 1; pada <= 4; pada++) {
      const got = birthStarPosition(mid(star, pada))!.flags.pushkara;
      const want = (BY_LORD[NAKSHATRA_LORD[star]] ?? []).includes(pada);
      assert.equal(got, want, `${NAKSHATRAS[star]} ${pada}`);
      if (got) n++;
    }
  assert.equal(n, 24);
});

test("ashtamamsha, vargottama and the 48' gandanta follow Sutton's chapter 3 and 7 tables", () => {
  const ASHTA = new Set(["Bharani 4", "Ardra 2", "Ashlesha 3", "Hasta 1", "Vishakha 2", "Mula 4", "Dhanishta 1", "Uttara Bhadrapada 3"]);
  for (let star = 0; star < 27; star++)
    for (let pada = 1; pada <= 4; pada++) {
      const p = birthStarPosition(mid(star, pada))!;
      assert.equal(p.flags.ashtamamsha, ASHTA.has(`${NAKSHATRAS[star]} ${pada}`), `${NAKSHATRAS[star]} ${pada}`);
      // Vargottama: the 1st navamsa of a movable sign, the 5th of a fixed one, the 9th of a dual one.
      const want = [1, 5, 9][p.signIndex % 3] === p.navamsaOfSign;
      assert.equal(p.flags.vargottama, want, `${NAKSHATRAS[star]} ${pada}`);
    }
  assert.equal(GANDANTA_DEG, 0.8);
  const dm = (d: number, m: number) => d + m / 60;
  assert.equal(birthStarPosition(330 + dm(29, 12))!.flags.gandanta, true);
  assert.equal(birthStarPosition(330 + dm(29, 11))!.flags.gandanta, false);
  assert.equal(birthStarPosition(dm(0, 47))!.flags.gandanta, true);
  assert.equal(birthStarPosition(dm(0, 49))!.flags.gandanta, false);
  assert.equal(birthStarPosition(90 + dm(29, 30))!.flags.gandanta, true, "Cancer into Leo");
  assert.equal(birthStarPosition(240 + dm(0, 30))!.flags.gandanta, true, "Scorpio into Sagittarius");
  assert.equal(birthStarPosition(60 + dm(29, 30))!.flags.gandanta, false, "Gemini into Cancer is not a water-fire junction");
});

test("a Moon at 3°30' Aries reads as Ashwini's Taurus quarter, with the star's own remark", () => {
  const s = birthStarReading(3.5, { withhold: false })!;
  assert.equal(s.name, "Ashwini");
  assert.equal(s.pada, 2);
  assert.equal(s.navamsaSign, 1);
  const ids = s.items.map((i) => i.id);
  assert.ok(ids.includes("quarter"));
  assert.ok(!ids.includes("pada-strength"), "no second line for the same exaltation");
  assert.deepEqual(ids.slice(0, 3), ["nature", "moon", "early"]);
  // Where the star has no remark of its own, the navamsa dignity line appears.
  const pb4 = birthStarReading(mid(24, 4), { withhold: false })!;
  assert.equal(pb4.navamsaSign, 3);
  assert.ok(pb4.items.some((i) => i.id === "pada-strength"));
});

test("plain wording passes the deny-list for every quarter, and the age gate removes what it should", () => {
  for (let star = 0; star < 27; star++)
    for (let pada = 1; pada <= 4; pada++)
      for (const withhold of [false, true]) {
        const s = birthStarReading(mid(star, pada), { withhold })!;
        for (const x of [...s.items, ...s.facts]) {
          assert.ok(x.plain.trim(), `${s.name} ${pada} ${"id" in x ? x.id : x.key} has a plain text`);
          assert.ok(x.text.trim());
          assert.deepEqual(plainViolations(soften(x.plain)), [], `${s.name} ${pada}`);
          assert.deepEqual(plainViolations(soften(x.text)), [], `${s.name} ${pada} (practitioner text, softened)`);
        }
      }
  for (const star of [0, 1, 17]) {
    const open = birthStarReading(mid(star, 1), { withhold: false })!;
    const shut = birthStarReading(mid(star, 1), { withhold: true })!;
    assert.ok(open.items.some((i) => i.id === "relations"), NAKSHATRAS[star]);
    assert.ok(!shut.items.some((i) => i.id === "relations"), NAKSHATRAS[star]);
  }
  const b = birthStarReading(mid(1, 1), { withhold: true })!;
  assert.equal(b.facts.find((f) => f.key === "deity")!.text, "Yama, associated with duty and restraint");
  assert.equal(b.facts.find((f) => f.key === "symbol")!.text, "Yoni, an image of creative power");
  // The plain reading holds close relationships back until the age of marriage; the practitioner reading marks them.
  const rohini = birthStarReading(mid(3, 1), { withhold: false })!;
  assert.ok(!shownBirthStarItems(rohini, true, false).some((i) => i.id === "relations"));
  const marked = shownBirthStarItems(rohini, false, false).find((i) => i.id === "relations")!;
  assert.equal(marked.early, true);
  assert.ok(shownBirthStarItems(rohini, true, true).some((i) => i.id === "relations"));
});

test("the book's own disagreements are kept as notes, and the Bharani gana is marked provisional", () => {
  const notes = (star: number) => birthStarReading(mid(star, 1), { withhold: false })!.notes.map((n) => n.text).join(" ");
  assert.match(notes(0), /vata/);
  assert.match(notes(1), /provisionally/);
  for (const star of [23, 24, 25, 26]) assert.match(notes(star), /^Aim:/, NAKSHATRAS[star]);
  const gana = birthStarReading(mid(1, 1), { withhold: false })!.facts.find((f) => f.key === "gana")!;
  assert.match(gana.text, /provisional/);
});

const synthetic = (birthDate: string): Chart => ({
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate,
  birthTime: "09:40",
  timezone: "Europe/London",
  timeStandard: "auto",
  place: "London, UK",
  latitude: 51.5074,
  longitude: -0.1278,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
});

test("the report carries the birth star as its own section in both readings", () => {
  const r = computeChart(synthetic("1988-04-21"));
  const moon = r.positions.find((p) => p.planet === "Moon")!;
  const s = birthStarReading(moon.lon, { withhold: false })!;
  for (const plain of [true, false]) {
    const doc = buildReport(r, { plain });
    const sec = doc.sections.find((x) => x.id === "birth-star");
    assert.ok(sec, `birth-star section (${plain ? "plain" : "practitioner"})`);
    assert.match(sec!.kicker ?? "", /Sutton/);
    const all = sec!.paras.map((p) => [p.text ?? "", ...(p.rows ?? []).flat()].join(" ")).join(" ");
    assert.ok(all.includes(s.name));
    // The readings follow under their own headings, the same selection as the screen's.
    const shown = shownBirthStarItems(s, plain, true);
    assert.deepEqual(sec!.sub!.map((x) => x.id), shown.map((i) => `birth-star-${i.id}`));
    assert.deepEqual(sec!.sub!.map((x) => x.title), shown.map((i) => (plain ? i.title : (i.technical ?? i.title))));
    if (plain) {
      assert.ok(!sec!.paras.some((p) => p.kind === "table"));
      const words = [...sec!.paras, ...sec!.sub!.flatMap((x) => x.paras)].map((p) => p.text ?? "");
      assert.deepEqual(words.flatMap(plainViolations), []);
    } else assert.deepEqual(sec!.paras.find((p) => p.kind === "table")!.head, ["Fact", "Sutton", "Where"]);
  }
  // The section is a separate layer: it comes after the day of birth and before today's sky.
  const ids = buildReport(r, { plain: true }).sections.map((x) => x.id);
  assert.ok(ids.indexOf("birth-star") > ids.indexOf("day"));
});

test("for a native under 18 the report's birth star holds back adult topics", () => {
  const r = computeChart(synthetic("2016-09-03"));
  const plainSec = buildReport(r, { plain: true }).sections.find((x) => x.id === "birth-star")!;
  const prac = buildReport(r, { plain: false }).sections.find((x) => x.id === "birth-star")!;
  assert.ok(plainSec && prac);
  assert.ok(!plainSec.sub!.some((x) => x.title === "Close relationships"));
  for (const p of [...prac.paras, ...prac.sub!.flatMap((x) => x.paras)])
    assert.doesNotMatch([p.text ?? "", ...(p.rows ?? []).flat()].join(" "), /sexual|sensual/i);
});
