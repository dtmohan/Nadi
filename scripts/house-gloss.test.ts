/**
 * Readings that name a house say what the house stands for, in the system's own terms
 * (shared/house-gloss.ts): the Parashari judgement, lord cards, running period, Sarvartha,
 * ALP, KP, Validate, yogas, avasthas, period effects and the Prasna house walk.
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { computeParashari, runningNowText } from "@shared/parashari";
import { agreementFor } from "@shared/agreement";
import { computeAlp } from "@shared/alp";
import { computeKp } from "@shared/kp";
import { kpHerePlain, kpTimingPlain, kpUsedGloss } from "@shared/rules-kp";
import { computeYogas } from "@shared/yoga";
import { computePrasnaFructification } from "@shared/rules-prasna";
import { markedHousesText, agreeWord, KP_MARKED_KEY } from "@shared/validate-types";
import { redactSensitive, sensitiveTags } from "@shared/life-stage";
import { isSensitive } from "@shared/gentle";
import { dignityOf, SIGNS, type Planet, type PlanetPosition } from "@shared/astro";
import {
  ALP_HOUSE_GLOSS,
  HOUSE_AREAS_PLAIN,
  KP_HOUSE_GLOSS,
  KP_HOUSE_GLOSS_PAGES,
  PRASNA_HOUSE_GLOSS,
  houseGloss,
  listJoin,
  ordH,
  thePlanet,
  withGloss,
  withGlossList,
} from "@shared/house-gloss";
import { computeChart } from "../server/routes";

const SYNTHETIC: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "female",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "Asia/Kolkata",
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
const result = computeChart(SYNTHETIC);
const par = computeParashari(
  result.positions,
  result.jaimini.lagna.lon,
  result.utc,
  AS_OF,
  result.shadbala,
  result.dasaStarts,
);

test("house glosses: twelve per system, none touching a withheld or softened topic", () => {
  for (const [name, list] of Object.entries({
    parashari: HOUSE_AREAS_PLAIN,
    alp: ALP_HOUSE_GLOSS,
    kp: KP_HOUSE_GLOSS,
    prasna: PRASNA_HOUSE_GLOSS,
  })) {
    for (let h = 1; h <= 12; h++) {
      const g = list[h];
      assert.ok(g, `${name} ${h}`);
      assert.deepEqual(sensitiveTags(g), [], `${name} ${h}: ${g}`);
      assert.ok(!isSensitive(g), `${name} ${h}: ${g}`);
    }
  }
  for (let h = 1; h <= 12; h++) assert.match(KP_HOUSE_GLOSS_PAGES[h], /^Part [13] ch\. (6|16) pp?\. \d/);
});

test("house glosses: ordinals, articles and lists", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 11, 12, 13, 21, 22, 23].map(ordH),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd"],
  );
  assert.equal(thePlanet("Sun"), "the Sun");
  assert.equal(thePlanet("Saturn"), "Saturn");
  assert.equal(listJoin(["a", "b", "c"]), "a, b and c");
  assert.equal(houseGloss("parashari", 13), "");
  assert.equal(withGloss("parashari", 5), "5th (learning and children)");
  assert.equal(withGloss("kp", 13), "13th");
  assert.equal(
    withGlossList("parashari", [4, 9], { the: true }),
    "4th (mother, home and comforts) and the 9th (fortune and religion)",
  );
});

test("Parashari: the running period names the houses its lord rules and holds", () => {
  const cur = par.dashas.find((d) => d.current);
  assert.ok(cur);
  assert.equal(
    runningNowText(cur, true),
    "Running now: Venus dasa. Venus rules the 4th (mother, home and comforts) and the 9th (fortune and religion), and stands in the 2nd (wealth and family).",
  );
});

test("Parashari: lord cards say ruler of which house and what it covers, without virupas in plain", () => {
  const lords = par.findings.filter((f) => f.kind === "lord");
  assert.ok(lords.length >= 12);
  const first = lords[0];
  assert.equal(first.titlePlain, "Saturn, ruler of the 1st, in the 5th");
  assert.match(first.textPlain ?? "", /^Saturn rules the 1st \(body and nature\) and stands in the 5th \(learning and children\), in Gemini\./);
  for (const f of lords) assert.ok(!/virupa/i.test(f.textPlain ?? ""), f.textPlain);
});

test("Parashari: the house judgement names the planet and the rule, gently in plain", () => {
  const seventh = par.bhavaJudgement.find((j) => j.house === 7);
  assert.ok(seventh);
  assert.ok(
    seventh.strainPlain.some((s) => s.includes("its ruler, the Sun, shares a sign with Mercury, which counts as a harsher planet beside the Sun (3.11)")),
    seventh.strainPlain.join(" | "),
  );
  for (const j of par.bhavaJudgement)
    for (const s of [...j.supportPlain, ...j.strainPlain]) assert.ok(!/malefic/i.test(s), `house ${j.house}: ${s}`);
});

test("Agreement: Parashara's voice names the house rule in plain words", () => {
  const plain = agreementFor(result, true);
  const marriage = plain.find((t) => t.topic === "marriage");
  assert.ok(marriage);
  const note = marriage.stances.find((s) => s.system === "parashari")?.note ?? "";
  assert.match(note, /Parashara counts (this )?against the house \(11\.14-16\)/);
});

test("Parashari: place checks gloss the house a planet holds and the houses it rules", () => {
  const sun = par.checks.Sun?.find((c) => c.kind === "place");
  assert.ok(sun);
  assert.equal(sun.text, "1st house (body and nature), Aquarius 29.3°; lord of the 7th (spouse, travel and trade).");
  assert.equal(sun.plain, "In the 1st house (body and nature), in Aquarius; it rules the 7th (spouse, travel and trade).");
});

test("Parashari: the maraka statement has a plain wording that the minor's gate withholds with it", () => {
  const facts = par.dasaReadings.flatMap((d) => d.antars.map((a) => a.facts)).filter((f) => f.maraka);
  assert.ok(facts.length > 0);
  for (const f of facts) {
    assert.ok(f.marakaPlain, f.maraka ?? "");
    assert.ok(!/maraka/i.test(f.marakaPlain), f.marakaPlain);
    assert.match(f.marakaPlain, /ch\. 44/);
  }
  const redacted = redactSensitive({
    facts: {
      favourable: [],
      adverse: [],
      maraka: "owns the 7th (maraka house)",
      marakaPlain: "rules the 7th (spouse, travel and trade), one of the two houses ch. 44 reads for strain on health",
    },
  });
  assert.equal(redacted.facts.maraka, null);
  assert.equal(redacted.facts.marakaPlain, null);
  // Period notes keep the term for the practitioner in `detail`, which the gate strips.
  const notes = par.dasaReadings.flatMap((d) => d.notes);
  const n50 = notes.find((n) => /-50-43$/.test(n.id));
  assert.ok(n50);
  assert.ok(!/maraka/i.test(n50.text), n50.text);
  assert.match(n50.detail ?? "", /maraka houses of ch\. 44/);
});

test("Parashari: with the minor's gate on, no maraka wording survives in the period rows or notes", () => {
  const gated = computeParashari(
    result.positions,
    result.jaimini.lagna.lon,
    result.utc,
    AS_OF,
    result.shadbala,
    result.dasaStarts,
    undefined,
    true,
  );
  for (const d of gated.dasaReadings) {
    for (const a of d.antars) {
      assert.equal(a.facts.maraka ?? null, null, `${d.lord}/${a.lord}`);
      assert.equal(a.facts.marakaPlain ?? null, null, `${d.lord}/${a.lord}`);
    }
    for (const n of d.notes) {
      assert.ok(!/maraka/i.test(n.text), n.text);
      assert.ok(!/maraka/i.test(n.detail ?? ""), n.detail);
    }
  }
  assert.ok(!JSON.stringify(gated.dasaReadings).includes("strain on health"));
});

test("Avasthas: the spoiled houses are named with what they cover", () => {
  const spoiled = par.avasthas.findings.find((f) => f.id === "av-spoiled");
  assert.ok(spoiled);
  assert.equal(
    spoiled.plain,
    "Under strain (45.18): the 1st (body and nature) from the Sun; the 2nd (wealth and family) from Jupiter and Venus; the 10th (work, honour and authority) from Rahu. Parashara has each weighed by the planet's strength (45.19).",
  );
});

test("Sarvartha Chintamani: each stanza says what on this chart meets it", () => {
  const sc = result.sarvartha;
  assert.ok(sc);
  const f = sc.findings.find((x) => x.house === 1 && x.stanza === 94);
  assert.ok(f);
  assert.ok((f.herePlain ?? []).includes("the Sun, a harsher planet, stands in the 1st"), (f.herePlain ?? []).join(" | "));
  for (const x of sc.findings) {
    for (const s of x.herePlain ?? []) assert.ok(!/malefic|undefined|NaN/.test(s), s);
    for (const s of x.here ?? []) assert.ok(!/undefined|NaN/.test(s), s);
  }
});

test("ALP: every finding says which planets and houses meet its condition", () => {
  const a = computeAlp(result.positions, result.jaimini.lagna.lon, result.utc, AS_OF);
  assert.ok(a.findings.length > 0);
  for (const f of a.findings) {
    assert.ok(f.here.length > 0, f.ruleId);
    for (const s of f.here) assert.ok(!/undefined|NaN/.test(s), `${f.ruleId}: ${s}`);
  }
  const kendra = a.findings.find((f) => f.ruleId === "alp-lord-kendra");
  if (kendra)
    assert.equal(
      kendra.here[0],
      "the Sun, lord of the ALP lagna, stands in the 7th from the ALP lagna (marriage, spouse and partnership)",
    );
});

test("KP: ordinals are right, and the plain line names the deciding planet and its houses", () => {
  const k = computeKp(result.kp, result.utc, AS_OF, false, false);
  for (const f of k.findings) assert.ok(!/\b(1|2|3)th\b/.test(f.evidence), f.evidence);
  const rec = k.findings.find((f) => f.ruleId === "kp1-recovery");
  assert.ok(rec);
  assert.equal(
    kpHerePlain(rec),
    "Here the 1st house's deciding planet is Ketu, which speaks for the 1st (health, appearance and temperament) and the 3rd (siblings, communications and short travel).",
  );
  assert.equal(kpUsedGloss([1, 3]), "1st: health, appearance and temperament; 3rd: siblings, communications and short travel");
});

test("KP: the plain timing line says which periods are singled out on this chart", () => {
  const all: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  assert.equal(
    kpTimingPlain([1, 3, 11], all, all.length),
    "Timing: periods of planets that speak for the 1st, 3rd or 11th. On this chart every planet does, so no period is singled out.",
  );
  assert.equal(kpTimingPlain([7], [], 9), "Timing: periods of planets that speak for the 7th; on this chart none does.");
  assert.equal(
    kpTimingPlain([2, 11], ["Sun", "Saturn"], 9),
    "Timing: periods of planets that speak for the 2nd or 11th: here the Sun and Saturn.",
  );
});

test("Validate: the marked houses read as words, with a key from the KP book", () => {
  assert.equal(markedHousesText([2, 11], [8]), "2nd and 11th favourable; 8th harmful");
  assert.equal(markedHousesText([], []), "none of the marked houses");
  assert.equal(agreeWord(null), "no reading");
  assert.equal(agreeWord(true), "agrees");
  assert.equal(agreeWord(false), "against");
  assert.match(KP_MARKED_KEY, /^Favourable: the 2nd \(money, speech and family\), the 3rd .* Harmful: the 6th \(service, enemies and obstacles\)/);
});

test("Yogas: a fired yoga says which planets and houses make it", () => {
  const ys = computeYogas({ positions: result.positions, lagnaIdx: result.jaimini.lagna.signIndex });
  const byId = new Map(ys.map((y) => [y.id, y]));
  assert.equal(byId.get("sukha-raja")?.here, "Mercury stands in the ascendant");
  assert.equal(byId.get("sun-mercury")?.here, "the Sun and Mercury share Aquarius, the 1st");
});

test("Yogas: on random charts every fired yoga has a filled-in 'here'", () => {
  let seed = 20261017;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const planets: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const mk = (planet: Planet, lon: number): PlanetPosition => {
    const signIndex = Math.floor(lon / 30) % 12;
    const degInSign = lon % 30;
    return {
      planet,
      lon,
      signIndex,
      sign: SIGNS[signIndex],
      degInSign,
      speed: 1,
      retrograde: false,
      nakshatraIndex: Math.floor(lon / (360 / 27)) % 27,
      nakshatra: "",
      nakshatraLord: "Ketu",
      pada: 1,
      dignity: dignityOf(planet, signIndex, degInSign),
      combust: false,
      signLord: "Sun",
    } as PlanetPosition;
  };
  let fired = 0;
  for (let i = 0; i < 400; i++) {
    const lons = planets.map(() => rnd() * 360);
    lons[8] = (lons[7] + 180) % 360; // Ketu opposite Rahu
    const positions = planets.map((p, j) => mk(p, lons[j]));
    const lagnaIdx = Math.floor(rnd() * 12);
    for (const y of computeYogas({ positions, lagnaIdx })) {
      fired++;
      if (!y.id.startsWith("sc-raja")) assert.ok(y.here && y.here.trim(), `${y.id} on chart ${i}`);
      for (const s of [y.here, y.herePlain]) if (s) assert.ok(!/undefined|NaN|\bnull\b/.test(s), `${y.id}: ${s}`);
    }
  }
  assert.ok(fired > 400, `only ${fired} yogas fired`);
});

test("Prasna: the fructification names the lord and karaka, with a gentler plain ending", () => {
  const strength = result.positions.map((p) => ({ planet: p.planet, dignity: p.dignity, effectiveDignity: p.dignity }));
  const fr = computePrasnaFructification(
    result.positions,
    strength as Parameters<typeof computePrasnaFructification>[1],
    result.jaimini.lagna.signIndex,
  );
  assert.equal(fr.length, 12);
  assert.equal(
    fr[0].note,
    "Its lord, Saturn in the 5th, is strong and well placed; its karaka, the Sun in the 1st, is weak and well placed. The influence is mixed.",
  );
  for (const f of fr) {
    assert.ok(f.note.includes(thePlanet(f.lord)), f.note);
    assert.ok(f.note.includes(thePlanet(f.karaka)), f.note);
  }
  // A house whose lord and karaka are both weak and badly placed.
  const pos = result.positions.map((p) =>
    p.planet === "Mars" || p.planet === "Saturn" ? { ...p, signIndex: (result.jaimini.lagna.signIndex + 5) % 12 } : p,
  );
  const weak = pos.map((p) => ({ planet: p.planet, dignity: "Debilitated", effectiveDignity: "Debilitated" }));
  const neg = computePrasnaFructification(
    pos,
    weak as Parameters<typeof computePrasnaFructification>[1],
    result.jaimini.lagna.signIndex,
  ).filter((f) => f.verdict === "negative");
  assert.ok(neg.length > 0);
  for (const f of neg) {
    assert.match(f.note, /turn negative/);
    assert.ok(!/negative/.test(f.notePlain), f.notePlain);
    assert.match(f.notePlain, /more effort and patience\.$/);
  }
});
