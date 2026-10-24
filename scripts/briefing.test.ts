// The Overview's briefing (shared/briefing.ts): the lagna-edge note fires near a sign change and stays
// silent mid-sign; each clause of the tagging rule places its tags; the cap of three keeps a source's own
// ranking; held-back areas never get a tag; tags show in one fixed order. Synthetic charts only.
import test from "node:test";
import assert from "node:assert/strict";
import type { Chart } from "@shared/schema";
import type { LifeArea } from "@shared/rules";
import { computeChart } from "../server/routes";
import { agreementInput } from "@shared/agreement";
import { briefingFor, housesRuled, lagnaEdge, tagsFor, LAGNA_EDGE_MINUTES, TAG_CAP } from "@shared/briefing";
import { AREA_ORDER, houseAreas } from "@shared/life-areas";
import { plainViolations, soften } from "@shared/gentle";

const chart = (
  name: string,
  gender: "male" | "female",
  birthDate: string,
  birthTime: string,
  timezone: string,
  place: string,
  latitude: number,
  longitude: number,
): Chart =>
  ({
    id: 0,
    name,
    gender,
    birthDate,
    birthTime,
    timezone,
    timeStandard: "auto",
    place,
    latitude,
    longitude,
    ayanamsa: "lahiri",
    nodeType: "mean",
    sunriseDef: "edge",
    parashariHouseMethod: "rashi",
    notes: "",
    deathDate: null,
    timeUncertaintyMin: 0,
    events: [],
  }) as unknown as Chart;

// Lagna 29°40' Cancer, 1.4 minutes before Leo rises; at 10:00 it is 7.4 minutes away; at 08:30, mid-sign.
const EDGE = chart("Synthetic male, Chennai", "male", "1990-06-15", "10:06", "Asia/Kolkata", "Chennai, India", 13.0827, 80.2707);
const NEAR = chart("Synthetic male, Chennai", "male", "1990-06-15", "10:00", "Asia/Kolkata", "Chennai, India", 13.0827, 80.2707);
const MID = chart("Synthetic male, Chennai", "male", "1990-06-15", "08:30", "Asia/Kolkata", "Chennai, India", 13.0827, 80.2707);
const MINOR = chart("Synthetic girl, Portland", "female", "2016-03-02", "09:40", "America/Los_Angeles", "Portland, Oregon", 45.52345, -122.67621);
const LAGOS = chart("Synthetic male, Lagos", "male", "1992-12-16", "11:45", "Africa/Lagos", "Lagos, Nigeria", 6.5244, 3.3792);

const cache = new Map<Chart, ReturnType<typeof computeChart>>();
const resultOf = (c: Chart) => {
  if (!cache.has(c)) cache.set(c, computeChart(c));
  return cache.get(c)!;
};
const briefOf = (c: Chart, plain = true) => briefingFor(resultOf(c), agreementInput(resultOf(c), plain));

const LIBRA = 6;

test("the lagna-edge note fires within five minutes of a sign change and stays silent mid-sign", () => {
  // 15' before the end of Libra, a minute of clock time from Scorpio.
  const e = lagnaEdge(LIBRA * 30 + 29.75, { D1: { before: 119, after: 1 }, D9: { before: 12, after: 1 }, D10: { before: 9, after: 14 } });
  assert.ok(e);
  assert.equal(e!.later, true);
  assert.equal(e!.signThen, 7);
  assert.equal(e!.arcMin, 15);
  // Libra's last navamsa is Gemini; Scorpio's first is Cancer.
  assert.equal(e!.d9, 2);
  assert.equal(e!.d9Then, 3);
  assert.deepEqual(e!.changing, ["D9"]);
  assert.deepEqual(e!.holding, ["D10"]);
  // 10' into Scorpio, the earlier sign 40 seconds back.
  const b = lagnaEdge(7 * 30 + 10 / 60, { D1: { before: 0.7, after: 118 } });
  assert.ok(b && !b.later && b.signThen === LIBRA);
  // Mid-sign, and just outside the window: silent.
  assert.equal(lagnaEdge(LIBRA * 30 + 15, { D1: { before: 60, after: 60 } }), null);
  assert.equal(lagnaEdge(LIBRA * 30 + 28.2, { D1: { before: 110, after: LAGNA_EDGE_MINUTES + 2.4 } }), null);
  assert.equal(lagnaEdge(LIBRA * 30 + 29.9, undefined), null);

  // The computed windows of real charts.
  const edge = briefOf(EDGE).before.find((n) => n.id === "lagna-edge");
  assert.ok(edge, "fires 1.4 minutes from the change");
  assert.match(edge!.text, /would make Leo the rising sign/);
  assert.equal(edge!.detail, undefined, "the plain view carries no practitioner detail");
  const pract = briefOf(EDGE, false).before.find((n) => n.id === "lagna-edge")!;
  assert.match(pract.detail!, /five-minute trigger is the app's convention \(provisional\)/);
  for (const c of [NEAR, MID]) assert.ok(!briefOf(c).before.some((n) => n.id === "lagna-edge"), c.birthTime);
});

test("each clause of the tagging rule places its own tags", () => {
  // 1. An attached topic comes first and is not marked; Venus then adds marriage (2) and the 1st it rules (3).
  assert.deepEqual(
    tagsFor({ attached: [{ area: "career", why: "the Parashari topic periods" }], lord: "Venus" }, LIBRA).map((t) => [t.area, t.clause, t.proposed]),
    [
      ["career", 1, false],
      ["marriage", 2, true],
      ["self", 3, true],
    ],
  );
  // 2. The Moon is the mother's karaka; it also rules the 10th from Libra (3).
  assert.deepEqual(tagsFor({ lord: "Moon" }, LIBRA).map((t) => [t.area, t.clause]), [
    ["family", 2],
    ["career", 3],
  ]);
  // 3. Lordship alone: Mars rules the 2nd and the 7th from Libra.
  assert.deepEqual(tagsFor({ lord: "Mars" }, LIBRA).map((t) => [t.area, t.clause]), [
    ["marriage", 3],
    ["wealth", 3],
  ]);
  // 4. A transit's house alone, unmarked; the 8th speaks for no area; standing has no house of its own.
  assert.deepEqual(tagsFor({ house: 6 }, LIBRA).map((t) => [t.area, t.clause, t.proposed]), [["health", 4, false]]);
  assert.deepEqual(tagsFor({ house: 8 }, LIBRA), []);
  assert.deepEqual(houseAreas(10), ["career"]);
  // The nodes rule no house and are no signature karaka.
  assert.deepEqual(housesRuled("Rahu", LIBRA), []);
  assert.deepEqual(tagsFor({ lord: "Rahu" }, LIBRA), []);
});

test("the tags cap at three, keep a source's ranking, skip held-back areas and show in one order", () => {
  // Saturn rules the 4th and 5th from Libra: education and family, then children.
  const sat = tagsFor({ lord: "Saturn" }, LIBRA);
  assert.equal(sat.length, TAG_CAP);
  assert.deepEqual(sat.map((t) => t.area), ["children", "education", "family"]);
  // Two attached areas keep their places; one lordship tag fills the third.
  const capped = tagsFor({ attached: [{ area: "spirituality", why: "x" }, { area: "self", why: "x" }], lord: "Saturn" }, LIBRA);
  assert.deepEqual(capped.map((t) => [t.area, t.clause]), [
    ["self", 1],
    ["spirituality", 1],
    ["education", 3],
  ]);
  // A ranked list (a Nadi passage's areas, most weighted first) keeps its first three, in the fixed order.
  const ranked = tagsFor({ attached: (["family", "self", "spirituality", "wealth"] as LifeArea[]).map((area) => ({ area, why: "x" })) }, LIBRA);
  assert.deepEqual(ranked.map((t) => t.area), ["self", "family", "spirituality"]);
  // Held-back areas never appear, whichever clause would place them.
  const held = (a: LifeArea) => a === "marriage" || a === "career" || a === "wealth" || a === "children";
  assert.deepEqual(tagsFor({ lord: "Venus" }, LIBRA, held).map((t) => t.area), ["self"]);
  assert.deepEqual(tagsFor({ house: 7 }, LIBRA, held), []);
  assert.deepEqual(tagsFor({ attached: [{ area: "career", why: "x" }] }, LIBRA, held), []);
  // One order everywhere: by clause, then the fixed area order.
  for (const ts of [sat, capped, ranked])
    for (let i = 1; i < ts.length; i++)
      assert.ok(
        ts[i - 1].clause < ts[i].clause ||
          (ts[i - 1].clause === ts[i].clause && AREA_ORDER.indexOf(ts[i - 1].area) < AREA_ORDER.indexOf(ts[i].area)),
      );
});

test("a minor's briefing tags nothing the gate holds back, and every row names its system", () => {
  const b = briefOf(MINOR);
  const HELD = new Set(["marriage", "children", "career", "wealth"]);
  assert.ok(b.now.some((r) => r.id === "pa-dasa"));
  for (const r of [...b.now, ...b.next]) {
    assert.ok(["Parashari", "Transit", "Jaimini", "ALP", "Nadi"].includes(r.system), r.id);
    assert.ok(r.tags.length <= TAG_CAP, r.id);
    for (const t of r.tags) assert.ok(!HELD.has(t.area), `${r.id} tags ${t.area}`);
  }
  for (let i = 1; i < b.next.length; i++) assert.ok(b.next[i - 1].start <= b.next[i].start, "the next list runs in date order");
  // The lines are gated too: a Nadi passage names only in-season areas, and a period lord's line does not
  // name it the karaka of a held-back area.
  for (const view of [b, briefOf(MINOR, false)])
    for (const r of [...view.now, ...view.next]) {
      if (r.id.startsWith("nadi-")) assert.doesNotMatch(r.line ?? "", /\b(marriage|career|wealth|children)\b/i, r.id);
      assert.doesNotMatch(r.line ?? "", /(stands for|karaka of) (marriage|children)/, r.id);
    }
});

test("the plain briefing holds the practitioner detail back, and the practitioner one shows it", () => {
  const plain = briefOf(LAGOS);
  const pract = briefOf(LAGOS, false);
  for (const r of [...plain.now, ...plain.next]) assert.equal(r.detail, undefined, r.id);
  for (const n of plain.before) assert.equal(n.detail, undefined, n.id);
  assert.ok([...pract.now, ...pract.next].some((r) => r.detail), "some practitioner detail");
  // The same rows in the same order in both views.
  assert.deepEqual(plain.now.map((r) => r.id), pract.now.map((r) => r.id));
  assert.deepEqual(plain.next.map((r) => r.id), pract.next.map((r) => r.id));
  assert.deepEqual(plain.planets.map((p) => p.planet), pract.planets.map((p) => p.planet));
  // The planets in play are the running lords first.
  const dasa = plain.now.find((r) => r.id === "pa-dasa")!;
  assert.equal(plain.planets[0].planet, dasa.dasaLord);
});

test("the plain briefing prints none of the deny-listed phrasings (shared/gentle.ts)", () => {
  for (const c of [LAGOS, EDGE, MINOR]) {
    const b = briefOf(c);
    const texts = [
      ...b.before.map((n) => `${n.title} ${n.text}`),
      // Row lines are shown through <Soft>, as every plain reading line is.
      ...[...b.now, ...b.next].flatMap((r) => [r.what, r.line ? soften(r.line) : ""]),
      ...b.planets.flatMap((p) => [p.place, p.rules, ...p.roles, ...p.states, ...p.systems.map((s) => s.text)]),
    ];
    for (const t of texts) assert.deepEqual(plainViolations(t), [], t);
  }
});
