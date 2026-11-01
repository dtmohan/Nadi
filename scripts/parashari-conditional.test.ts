import test from "node:test";
import assert from "node:assert/strict";
import { describePosition, type Planet } from "@shared/astro";
import { manleyEvidence } from "@shared/manley-evidence";
import { conditionalObservations } from "@shared/parashari-conditional";
import { summarizeParashariComparisons } from "@shared/parashari-comparison";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";

const planets: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const positions = (signs: Record<Planet, number>) => planets.map((p) => describePosition(p, signs[p] * 30 + 1, 0));
const base: Record<Planet, number> = { Sun: 9, Moon: 4, Mars: 0, Mercury: 10, Jupiter: 3, Venus: 11, Saturn: 5, Rahu: 2, Ketu: 8 };

test("Manley's Raman example: Ketu's Mercury dispositor is in the D1 seventh and with Venus", () => {
  // Birth Time Rectification, capture p. 72. This is a source example, not a fresh validation case.
  const chart = { birthDate: "1912-08-08", birthTime: "19:42", timezone: "Asia/Kolkata", timeStandard: "auto",
    latitude: 12.9833, longitude: 77.5833 } as Parameters<typeof birthInstant>[0];
  const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const, jd = julianDay(birthInstant(chart).utc);
  const event = manleyEvidence({ label: "marriage", date: "1930-10-30", matter: "marriage" },
    positionsAt(jd, opts), ascendantAt(jd, chart.latitude!, chart.longitude!, opts), ["Rahu", "Ketu", "Venus"])!;
  const d1 = event.periods[1].frames[0].nodeDispositor!;
  assert.equal(d1.planet, "Mercury");
  assert.ok(d1.links.includes("Mercury is in house 7"));
  assert.ok(d1.links.some((x) => x.includes("Mercury and Venus share")));
});

test("Manley's Raman D7 childbirth example retains the Jupiter–Venus angle/trine connection and both other lordships", () => {
  // Birth Time Rectification, capture pp. 65–67: Aries D7; Jupiter (9,12)
  // and Venus (2,7) are together in its fifth. The source calls this a yoga;
  // the app reports the connection without resolving other lordship or strength.
  const chart = { birthDate: "1912-08-08", birthTime: "19:42", timezone: "Asia/Kolkata", timeStandard: "auto",
    latitude: 12.9833, longitude: 77.5833 } as Parameters<typeof birthInstant>[0];
  const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const, jd = julianDay(birthInstant(chart).utc);
  const event = manleyEvidence({ label: "childbirth example", date: "1940-01-01", matter: "child" },
    positionsAt(jd, opts), ascendantAt(jd, chart.latitude!, chart.longitude!, opts), ["Jupiter", "Moon", "Venus"])!;
  const d7 = event.periods[0].frames[1];
  assert.equal(d7.ascendant, 0);
  assert.equal(d7.functional?.house, 5);
  const pair = d7.angleTrinePairs.find((x) => x.partner === "Venus");
  assert.deepEqual(pair, { partner: "Venus", owns: [9, 12], partnerOwns: [2, 7], links: ["same-sign conjunction"] });
  assert.equal(d7.functional?.yogaPair, undefined, "this general connection is distinct from the named BPHS pair table");
  assert.equal(conditionalObservations(event)?.yoga, false, "the older named-pair diagnostic must not change");
});

test("the general angle/trine subset requires an eligible relation and does not count any same-sign placement", () => {
  const event = (jupiter: number, venus: number) => manleyEvidence({ label: "child", date: "2010-01-01", matter: "child" },
    positions({ ...base, Jupiter: jupiter, Venus: venus }), 1, ["Jupiter", "Moon", "Sun"])!.periods[0].frames[0];
  assert.ok(event(4, 4).angleTrinePairs.some((x) => x.partner === "Venus" && x.links.includes("same-sign conjunction")));
  assert.ok(!event(5, 5).angleTrinePairs.some((x) => x.partner === "Venus"), "conjunction in house six alone is outside this BPHS subset");
  assert.ok(event(6, 8).angleTrinePairs.some((x) => x.partner === "Venus" && x.links.includes("sign exchange")));
});

test("named pair requires a classical formation and one-way aspect alone remains descriptive", () => {
  // Pisces ascendant: Mars/Jupiter is the named 9th/10th pair. Mars aspects
  // Jupiter from Aries to Cancer, but Jupiter does not aspect Mars back.
  const oneWay = manleyEvidence({ label: "job", date: "2010-01-01", matter: "job" }, positions(base), 331, ["Jupiter", "Mercury", "Mars"])!;
  const pair = oneWay.periods[0].frames[0].functional!.yogaPair!;
  assert.ok(pair.links.some((x) => x.includes("Mars fully aspects Jupiter")));
  assert.deepEqual(pair.formation, []);
  assert.equal(conditionalObservations(oneWay)?.yoga, false);
  const conjunction = manleyEvidence({ label: "job", date: "2010-01-01", matter: "job" }, positions({ ...base, Jupiter: 0 }), 331, ["Jupiter", "Mercury", "Mars"])!;
  assert.ok(conjunction.periods[0].frames[0].functional!.yogaPair!.formation!.includes("same-sign conjunction"));
  assert.equal(conditionalObservations(conjunction)?.yoga, true);
});

test("node ruler's one-hop matter link is preserved separately with its other lordships", () => {
  // Libra rising, Rahu in Gemini; Mercury rules Gemini and is in the seventh.
  const natal = positions({ ...base, Mercury: 0 });
  const event = manleyEvidence({ label: "marriage", date: "2010-01-01", matter: "marriage" }, natal, 181, ["Rahu", "Sun", "Ketu"])!;
  const d1 = event.periods[0].frames[0];
  assert.equal(d1.nodeDispositor?.planet, "Mercury");
  assert.equal(d1.nodeDispositor?.house, 7);
  assert.deepEqual(d1.nodeDispositor?.owns, [9, 12]);
  assert.ok(d1.nodeDispositor?.links.includes("Mercury is in house 7"));
  assert.ok(!d1.primary.house.includes("Mercury is in house 7"));
  assert.equal(conditionalObservations(event)?.node, true);
  assert.equal(conditionalObservations(event, "mixed"), undefined);
});

test("event combination is same-frame placement plus a direct connection, not the node's tautological sign ruler", () => {
  // Scorpio ascendant, Taurus seventh with Venus occupying its own house.
  const event = manleyEvidence({ label: "marriage", date: "2010-01-01", matter: "marriage" }, positions({ ...base, Venus: 1 }), 211, ["Venus", "Sun", "Saturn"])!;
  assert.equal(event.periods[0].frames[0].eventCombination?.matched, true);
  assert.equal(conditionalObservations(event)?.event, true);
  const nodeOnly = manleyEvidence({ label: "marriage", date: "2010-01-01", matter: "marriage" },
    positions({ ...base, Rahu: 1, Ketu: 7, Venus: 11, Sun: 9, Moon: 4, Mars: 0, Mercury: 10, Jupiter: 3, Saturn: 5 }),
    211, ["Rahu", "Rahu", "Rahu"])!;
  assert.ok(nodeOnly.periods[0].frames[0].primary.houseLord.some((x) => x.includes("Venus's sign")));
  assert.equal(nodeOnly.periods[0].frames[0].eventCombination?.matched, false);
});

test("missing conditional evidence is unavailable, not a zero or failed event", () => {
  const event = manleyEvidence({ label: "child", date: "2010-01-01", matter: "child" }, positions(base), 181, ["Rahu", "Sun", "Mercury"])!;
  delete event.periods[0].frames[0].nodeDispositor;
  assert.equal(conditionalObservations(event), undefined);
  const result = summarizeParashariComparisons([{ conditional: { yoga: true, node: true, event: false } }], [[{}]]);
  assert.ok(result.unavailable?.includes("conditional"));
  assert.equal(result.conditional, undefined);
});
