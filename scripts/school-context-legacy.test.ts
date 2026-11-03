import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DateTime } from "luxon";
import { createPlanetContext } from "@shared/planet-context";
import { evaluate, RULES } from "@shared/rules";
import { computeJaimini } from "@shared/jaimini";
import { computeParashari, computeParashariNatal } from "@shared/parashari";
import { computeKp } from "@shared/kp";
import { computeAlp } from "@shared/alp";
import { computePrasna } from "@shared/rules-prasna";
import { ascendantAt, ayanamsaAt, cuspsAt, julianDay, positionsAt, shadbalaBase } from "../server/ephemeris";

// Natal projections independently captured at UTC instants from the archived
// pre-PlanetContext commit. Time-period changes and corrected ALP timeline
// boundaries have dedicated tests; do not regenerate this from current code.
const reference = JSON.parse(readFileSync("scripts/fixtures/school-context-utc-natal-hashes.json", "utf8"));
const examples = [
  { birth: "1990-01-01T06:30:00Z", lat: 12.9716, lon: 77.5946, aya: "lahiri", node: "mean", gender: "male", house: "rashi" },
  { birth: "1950-02-14T21:25:00Z", lat: 51.5074, lon: -0.1278, aya: "raman", node: "true", gender: "female", house: "equal" },
  { birth: "1911-11-12T14:15:00Z", lat: 39.7667, lon: -86.15, aya: "kp", node: "mean", gender: "unspecified", house: "sripati" },
] as const;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value, (_key, v) =>
  typeof v === "number" && Number.isFinite(v) ? Number(v.toPrecision(12)) : v)).digest("hex");
const pick = (value: any, keys: string[]) => Object.fromEntries(keys.map((key) => [key, value[key]]));

// Recreate the three deliberately corrected BNN rules when checking the
// archived pre-migration hashes. Current behavior has separate counterexample
// tests; changing an immutable historical fixture would hide regressions.
const historicalBnnRules = RULES.map((rule) => rule.id === "su-exalt" ? { ...rule,
  when: { ...rule.when, subjectDignity: ["Exalted", "Own sign"] as const },
  text: "Sun dignified: a respected father and a native with strong self-esteem and vitality.", source: "General Nadi principles (Rao, Naik)" } :
  rule.id === "ma-exalt" ? { ...rule, when: { ...rule.when, subjectDignity: ["Exalted", "Own sign"] as const },
    text: "Mars dignified: property and technical ability come easily; siblings are capable.", source: "General Nadi principles (Rao, Naik)" } :
  rule.id === "auth-su-strong" ? { ...rule, when: { ...rule.when, subjectDignity: ["Own sign", "Exalted"] as const },
    text: "the Sun in his own strength: born to authority; command sits naturally on the native and others defer. (provisional)",
    source: "General Nadi principles (Rao, Naik)" } : rule);

// Commit 50c156e deliberately qualified these ALP interpretations after the
// independent historical capture. Restore only the old wording for this
// comparison; the live rules and their source qualifications stay unchanged.
const historicalAlpText: Record<string, string> = {
  "b2-marriage-navamsa-touches": "The current pada's navamsa sign touches the ALP lagna, its 7th, the janma lagna or its 7th: this is a period in which a marriage or alliance can take place, if the chart otherwise allows it.",
  "b2-marriage-navamsa-away": "The current pada's navamsa sign touches none of the ALP lagna, its 7th, the janma lagna or its 7th. The cited example does not select certain such padas for marriage; extending that example to every chart is provisional and this condition alone cannot rule marriage out.",
  "b2c3-nak-lord-past": "The lord of the ALP nakshatra stands in the 2nd, 5th, 8th or 11th from the ALP lagna: what the period brings is rooted in the past; the native lives out the fruit of earlier deeds rather than starting new ones.",
};

test("school natal readings retain independent pre-migration outputs at correct UTC instants", () => {
  const asOf = "2025-01-01T00:00:00Z";
  for (let i = 0; i < examples.length; i++) {
    const e = examples[i];
    const jd = julianDay(DateTime.fromISO(e.birth));
    const opts = { ayanamsa: e.aya, nodeType: e.node, sunrise: "edge" as const };
    const ko = { ayanamsa: "kp", nodeType: e.node };
    const positions = positionsAt(jd, opts), asc = ascendantAt(jd, e.lat, e.lon, opts);
    const context = createPlanetContext(positions, { kind: "natal", instant: e.birth, ayanamsa: e.aya,
      nodeType: e.node, ascendant: asc, houseMethod: e.house, precision: "full" });
    const kpos = positionsAt(jd, ko), cusps = cuspsAt(jd, e.lat, e.lon, ko);
    const nowJd = julianDay(DateTime.fromISO(asOf));
    const base = { ayanamsaValue: ayanamsaAt(jd, ko), positions: kpos, cusps,
      now: { asOf, positions: positionsAt(nowJd, ko), ascendant: ascendantAt(nowJd, e.lat, e.lon, ko), weekday: 3 } };
    const shadbala = shadbalaBase(jd, e.lat, e.lon, opts);
    const parashari = computeParashari(context, asc, e.birth, asOf, shadbala, undefined, undefined, false, e.house);
    // Restore only the historical shape: current independent tests cover the
    // newly exposed sign and qualified own-lord-aspect clue. Do not regenerate
    // the archived baseline or hide changes to the prior house verdict.
    const historicalParashari = { ...parashari,
      bhavas: parashari.bhavas.map(({ lordSignIndex: _lordSignIndex, ...b }) => b),
      bhavaJudgement: parashari.bhavaJudgement.map(({ lordAspectClue: _clue, lordOccupancyClue: _occupancy, ...b }) => b),
      houseProse: parashari.houseProse?.map((h) => ({ ...h, parts: h.parts.filter((p) => p.key !== "lord-aspect" && p.key !== "lord-occupancy") })) };
    const kp = computeKp(base, e.birth, asOf);
    const alp = computeAlp(context, asc, e.birth, asOf);
    const output = {
      bnn: evaluate(context, historicalBnnRules as typeof RULES, e.gender), jaimini: computeJaimini(context, asc, e.birth),
      parashari: pick(historicalParashari, ["aspectFloor", "houseMethod", "lagna", "bhavas", "natures", "findings", "ties", "neechaBhanga", "bhavaJudgement", "shadbala", "ashtakavarga", "bhavaPhala", "vargaPhala", "houseProse"]),
      kp: pick(kp, ["ayanamsaValue", "cusps", "planets", "significators", "houseSignificators", "badhaka", "marakas", "lagnaQuality", "ruling", "findings"]),
      alp: pick({ ...alp, findings: alp.findings.map((f) => historicalAlpText[f.ruleId] ? { ...f, text: historicalAlpText[f.ruleId] } : f) },
        ["config", "natalLagna", "point", "houseFromJanma", "houses", "placements", "book", "findings"]),
      prasna: computePrasna(context, Math.floor(asc / 30)),
    };
    if (i === 0) {
      assert.equal(alp.nakshatraTimeline.find((p) => p.nakshatra === "Mrigashira")?.sign, "Gemini");
      assert.equal(alp.nakshatraTimeline.find((p) => p.nakshatra === "Chitra")?.sign, "Libra");
    }
    for (const [school, result] of Object.entries(output)) {
      assert.equal(digest(result), reference.hashes[i][school], `chart ${i}, ${school}`);
    }
  }
});

test("the faster natal-only Parashari frame matches the full ordinary reading under every house method and gate", () => {
  const asOf = "2025-01-01T00:00:00Z";
  for (const e of examples) {
    const jd = julianDay(DateTime.fromISO(e.birth));
    const opts = { ayanamsa: e.aya, nodeType: e.node, sunrise: "edge" as const };
    const positions = positionsAt(jd, opts), asc = ascendantAt(jd, e.lat, e.lon, opts);
    const shadbala = shadbalaBase(jd, e.lat, e.lon, opts);
    for (const house of ["rashi", "equal", "sripati"] as const) for (const withhold of [false, true]) for (const strength of [shadbala, undefined]) {
      const full = computeParashari(positions, asc, e.birth, asOf, strength, undefined, undefined, withhold, house);
      const fast = computeParashariNatal(positions, asc, e.birth, asOf, strength, undefined, withhold, house);
      for (const key of ["aspectFloor", "houseMethod", "houseMethodNote", "bhavas", "findings", "bhavaJudgement"] as const)
        assert.deepEqual(fast[key], full[key], `${e.birth} ${house} withhold=${withhold} strength=${!!strength} ${key}`);
    }
  }
});
