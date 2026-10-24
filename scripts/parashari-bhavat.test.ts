// Houses counted from a house (shared/parashari-bhavat.ts) in the periods by topic: Phaladeepika 15.7 names
// the periods that build or strain a house counted from that house, and a modern book's count from a house
// to its lord sits under each 48.2-8 period. Every clause is re-derived here from the chart; nodes are never
// counted; the wording keeps the plain view's rules; the minors' gate holds the adult topics back as before;
// the maraka notes carry the 8th from the 8th. Synthetic charts only.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { FRIENDS, SIGN_LORD, type Planet } from "@shared/astro";
import { computeParashari, DEFAULT_ASPECT_FLOOR, type ParashariResult } from "@shared/parashari";
import { MARAKA_CAVEATS } from "@shared/parashari-marakas";
import {
  BHAVAT_NOTE,
  BHAVAT_NOTE_PLAIN,
  FROM_HOUSE_SOURCE,
  LORD_DISTANCE,
  LORD_DISTANCE_SOURCE,
  fromHouse,
  lordDistance,
  placesFrom,
} from "@shared/parashari-bhavat";
import { PHALADEEPIKA_CH15_URL } from "@shared/chalit";
import { PERIOD_TOPICS, topicPeriods, type TopicPeriods } from "@shared/parashari-topic-periods";
import { shadbalaOf } from "@shared/shadbala";
import { sensitiveGate, withholdText } from "@shared/life-stage";
import { plainViolations, soften } from "@shared/gentle";
import { buildReport } from "@shared/report";
import type { ReportSection } from "@shared/report/types";
import { computeChart } from "../server/routes";

const AS_OF = "2026-10-24T00:00:00.000Z";

const chart = (birthDate: string, birthTime: string, lat = 20, lon = 78, deathDate: string | null = null): Chart => ({
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate,
  birthTime,
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Synthetic, India",
  latitude: lat,
  longitude: lon,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate,
  timeUncertaintyMin: 0,
  events: [],
});

interface Run {
  label: string;
  minor: boolean;
  asOf: string;
  deceased: boolean;
  par: ParashariResult;
  topics: TopicPeriods[];
}

function run(d: string, t: string, lat = 20, lon = 78, deathDate: string | null = null): Run {
  const c = chart(d, t, lat, lon, deathDate);
  const r = computeChart(c);
  const asOf = deathDate ? `${deathDate}T00:00:00.000Z` : AS_OF;
  const minor = sensitiveGate(c, r.utc, asOf).withheld;
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, asOf, r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, minor, "rashi");
  const topics = topicPeriods(par, { birthIso: r.utc, asOfIso: asOf, deceased: !!deathDate });
  return { label: `${d} ${t}${minor ? " minor" : ""}${deathDate ? " deceased" : ""}`, minor, asOf, deceased: !!deathDate, par, topics };
}

const PUNE = run("1968-07-02", "14:35", 18.5204, 73.8567);
const RUNS: Run[] = [
  PUNE,
  run("1951-03-14", "05:10"),
  run("1968-07-02", "14:35"),
  run("1979-04-17", "09:50"),
  run("1990-02-28", "16:45"),
  run("2016-03-14", "09:30"),
  run("1931-11-20", "06:15", 20, 78, "2004-05-01"),
];

const NODES: Planet[] = ["Rahu", "Ketu"];

test("15.7, re-derived for every house: each clause names exactly the planets the verse describes", () => {
  for (const { label, par } of RUNS) {
    assert.ok(par.lagna.degree != null && par.lagna.degree >= 0 && par.lagna.degree < 30, `${label}: lagna degree`);
    const dIdx = Math.min(2, Math.floor(par.lagna.degree! / 10));
    for (let h = 1; h <= 12; h++) {
      const row = fromHouse(par, h);
      const bh = (x: number) => par.bhavas.find((b) => b.house === x)!;
      const lord = bh(h).lord;
      const h8 = ((h + 6) % 12) + 1;
      const d22Sign = (bh(h).signIndex + 7) % 12;
      const want = new Map<Planet, Set<string>>();
      const add = (p: Planet, c: string) => want.set(p, (want.get(p) ?? new Set()).add(c));
      for (const n of par.natures) {
        const r = ((n.house - h + 12) % 12) + 1;
        const sb = shadbalaOf(par.shadbala, n.planet);
        if (n.planet === bh(h8).lord) add(n.planet, "eighth-lord");
        if (n.planet === SIGN_LORD[(d22Sign + dIdx * 4) % 12]) add(n.planet, "drekkana");
        if (sb && !sb.strong && [6, 7, 8].includes(r)) add(n.planet, "weak");
        if (sb?.strong && !n.naturalBenefic && [3, 6, 11].includes(r)) add(n.planet, "malefic");
        if (sb?.strong && n.naturalBenefic && [1, 4, 5, 7, 9, 10].includes(r)) add(n.planet, "benefic");
        if (sb?.strong && n.planet !== lord && FRIENDS[lord].includes(n.planet)) add(n.planet, "friend");
      }
      const got = new Map(row.named.map((x) => [x.planet, new Set(x.reasons.map((r) => r.clause))]));
      assert.deepEqual(
        [...Array.from(got.entries())].map(([p, cs]) => [p, Array.from(cs).sort()]),
        [...Array.from(want.entries())].map(([p, cs]) => [p, Array.from(cs).sort()]),
        `${label}: house ${h}`,
      );
      for (const x of row.named) {
        assert.ok(!NODES.includes(x.planet), `${label}: house ${h} names ${x.planet}`);
        for (const r of x.reasons) assert.equal(r.role, ["eighth-lord", "drekkana", "weak"].includes(r.clause) ? "harms" : "builds");
      }
      assert.equal(row.eighth.house, h8);
      assert.equal(row.drekkana22?.signIndex, d22Sign);
    }
  }
});

test("15.7 on the synthetic Libra chart: the planets the review's probe found", () => {
  const names = (h: number, role: "builds" | "harms") =>
    fromHouse(PUNE.par, h)
      .named.filter((x) => x.reasons.some((r) => r.role === role))
      .map((x) => x.planet)
      .sort();
  assert.equal(PUNE.par.lagna.sign, "Libra");
  assert.deepEqual(names(10, "builds"), ["Mercury", "Sun"]);
  assert.deepEqual(names(10, "harms"), ["Mercury", "Saturn"]);
  assert.deepEqual(names(2, "builds"), ["Jupiter", "Saturn", "Sun"]);
  assert.deepEqual(names(2, "harms"), ["Mercury", "Venus"]);
  assert.deepEqual(names(11, "builds"), ["Jupiter", "Mars", "Mercury", "Sun"]);
  // Rahu stands in the 8th from the 11th but has no Shadbala, so it is not counted.
  assert.deepEqual(names(11, "harms"), ["Jupiter", "Moon"]);
  // Saturn, lord of the 4th and 5th in the 7th: 4th from its 4th (the house's fruition), 3rd from its 5th.
  const four = lordDistance(PUNE.par, 4);
  assert.deepEqual([four.lord, four.lordIn, four.places, four.resonance], ["Saturn", 7, 4, true]);
  const five = lordDistance(PUNE.par, 5);
  assert.deepEqual([five.lord, five.places, five.resonance], ["Saturn", 3, false]);
});

test("in the periods by topic: 15.7 reads the same periods as 48.2-8, and the book's count sits under each 48.2-8 period", () => {
  for (const { label, par, topics, asOf, deceased } of RUNS) {
    // The window both voices read: the running dasa and three more begun before 90, or the whole life.
    const i = par.dasaReadings.findIndex((d) => d.end > asOf);
    const window = deceased ? par.dasaReadings.filter((d) => d.start < asOf) : par.dasaReadings.slice(i, i + 4).filter((d) => d.ageStart < 90);
    for (const t of topics) {
      const def = PERIOD_TOPICS.find((x) => x.topic === t.topic)!;
      if (t.held) {
        assert.equal(t.fromHouse, undefined, `${label} ${t.topic}: held topics carry no 15.7 periods`);
        continue;
      }
      assert.ok(t.fromHouse, `${label} ${t.topic}`);
      assert.deepEqual(t.fromHouse!.houses, def.fromHouse);
      for (const p of t.fromHouse!.periods) {
        assert.ok(!NODES.includes(p.lord), `${label} ${t.topic}: ${p.lord}`);
        const d = par.dasaReadings.find((x) => x.lord === p.lord && x.start === p.start);
        assert.ok(d, `${label} ${t.topic}: ${p.lord} ${p.start} is a dasa of the chart`);
        for (const x of p.houses) {
          const row = fromHouse(par, x.house);
          assert.deepEqual(x.reasons, row.named.find((n) => n.planet === p.lord)!.reasons);
        }
        const roles = new Set(p.houses.flatMap((x) => x.reasons.map((r) => r.role)));
        assert.equal(p.role, roles.size > 1 ? "both" : Array.from(roles)[0]);
        assert.equal(p.tone, p.role === "builds" ? "support" : p.role === "harms" ? "strain" : "mixed");
        assert.deepEqual(p.sources, [FROM_HOUSE_SOURCE]);
        assert.equal(p.sources[0].url, PHALADEEPIKA_CH15_URL);
      }
      for (const p of [...t.periods, ...t.fromHouse!.periods])
        assert.ok(window.some((d) => d.lord === p.lord && d.start === p.start), `${label} ${t.topic}: ${p.lord} ${p.start} in the window`);
      // Every dasa lord of the window that 15.7 names for the topic's houses is listed.
      for (const d of window) {
        const named = def.fromHouse.some((h) => fromHouse(par, h).named.some((n) => n.planet === d.lord));
        assert.equal(t.fromHouse!.periods.some((p) => p.start === d.start), named, `${label} ${t.topic}: ${d.lord} ${d.start}`);
      }
      for (const p of t.periods) {
        assert.ok(p.delivery, `${label} ${t.topic} ${p.lord}: the book's count`);
        assert.deepEqual(p.delivery!.sources, [LORD_DISTANCE_SOURCE]);
        for (const h of p.houses) {
          const b = par.bhavas.find((x) => x.house === h)!;
          const n = placesFrom(h, b.lordIn);
          assert.ok(p.delivery!.text.includes(LORD_DISTANCE[n - 1].text), `${label} ${t.topic} ${p.lord} ${h}: ${p.delivery!.text}`);
          assert.ok(p.delivery!.textPlain.includes(LORD_DISTANCE[n - 1].plain), `${label} ${t.topic} ${p.lord} ${h}`);
        }
        // The count never moves the 48.2-8 tone (tested against the lean in parashari-topic-periods.test.ts).
      }
      assert.match(t.summary, /15\.7, counted from the/, `${label} ${t.topic}`);
    }
  }
});

test("the wording: plain lines soft, second person, untagged; nothing withheld for a minor", () => {
  const plainTexts = (t: TopicPeriods) => [
    t.summaryPlain,
    ...(t.fromHouse ? [t.fromHouse.labelPlain, t.fromHouse.summaryPlain, ...t.fromHouse.periods.map((p) => p.textPlain)] : []),
    ...t.periods.map((p) => p.delivery?.textPlain ?? ""),
  ];
  for (const x of [BHAVAT_NOTE_PLAIN, ...LORD_DISTANCE.map((s) => s.plain), ...RUNS.flatMap((r) => r.topics.flatMap(plainTexts))]) {
    if (!x) continue;
    assert.ok(!/\b\d+\.\d+\b|\bdasa\b|\blord of\b|\bnative\b|§/.test(x), `"${x}"`);
    assert.deepEqual(plainViolations(x), [], `"${x}"`);
    assert.equal(soften(x), x, `the softener rewrites "${x}"`);
  }
  // Strain is worded as care in the plain view; the practitioner view keeps the verse's side.
  for (const { topics } of RUNS)
    for (const t of topics)
      for (const p of t.fromHouse?.periods ?? []) {
        assert.ok(!/\bharm|\bstrain|\bdestro/i.test(p.textPlain), p.textPlain);
        if (p.role !== "builds") assert.match(p.textPlain, /asks for care/);
        if (p.role !== "harms") assert.match(p.text, /build the house/);
      }
  for (const { label, minor, topics } of RUNS) {
    if (!minor) continue;
    for (const t of topics)
      for (const x of [t.summary, t.summaryPlain, ...t.periods.flatMap((p) => [p.delivery?.text ?? "", p.delivery?.textPlain ?? ""]), ...(t.fromHouse?.periods.flatMap((p) => [p.text, p.textPlain]) ?? [])])
        assert.ok(!withholdText(x), `${label} ${t.topic}: "${x}"`);
  }
  assert.ok(RUNS.some((r) => r.minor), "a minor is among the charts");
  // The practitioner note names both readings as the app's and keeps 15.7 apart from 48.2-8.
  assert.match(BHAVAT_NOTE, /not netted|none of it is netted/);
  assert.match(BHAVAT_NOTE, /provisional/);
});

test("the maraka notes carry the 8th from the 8th, with 44.2", () => {
  const n = MARAKA_CAVEATS.find((c) => /8th counted from the 8th/.test(c));
  assert.ok(n, "a bhavat bhavam note among the maraka caveats");
  assert.match(n!, /44\.2/);
  assert.match(n!, /Laghu Parashari/);
});

const walk = (secs: ReportSection[], f: (s: ReportSection) => void) => {
  for (const s of secs) {
    f(s);
    walk(s.sub ?? [], f);
  }
};

test("the report: the note cites both readings, the book's count rides under its period, 15.7 periods carry their tone", () => {
  const r = computeChart(chart("1968-07-02", "14:35", 18.5204, 73.8567));
  for (const plain of [true, false]) {
    const doc = buildReport(r, { plain });
    let topicsSec: ReportSection | undefined;
    walk(doc.sections, (s) => {
      if (s.id === "periods-by-topic") topicsSec = s;
    });
    assert.ok(topicsSec, "periods by topic");
    const note = topicsSec!.paras[1];
    assert.equal(note.kind, "note");
    assert.equal(note.text, plain ? BHAVAT_NOTE_PLAIN : BHAVAT_NOTE);
    const labels = (note.cites ?? []).map((n) => doc.cites.find((c) => c.n === n)!.label);
    assert.deepEqual(labels, [FROM_HOUSE_SOURCE.label, LORD_DISTANCE_SOURCE.label]);
    const wealth = topicsSec!.sub!.find((s) => s.id === "topic-wealth")!;
    const asides = wealth.paras.filter((p) => p.kind === "p" && p.aside);
    assert.ok(asides.length > 0 && asides.every((p) => /Shweta/.test(p.aside!)), "the book's count under the 48.2-8 periods");
    const career = topicsSec!.sub!.find((s) => s.id === "topic-career")!;
    const toned = career.paras.filter((p) => p.kind === "p" && p.tone);
    assert.ok(toned.length > 0, "15.7 periods for work even with no 48.2-8 period in the window");
    assert.ok(career.paras.some((p) => p.kind === "note" && /Phaladeepika|house itself/.test(p.text ?? "")));
  }
});
