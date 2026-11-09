import test from "node:test";
import assert from "node:assert/strict";
import { lordDistance, plainReasons, type FromHouseReason } from "../shared/parashari-bhavat";
import { bhavatDeliveryMalayalam, bhavatPairMalayalam } from "../shared/malayalam-parashari-bhavat-period";
import { topicPeriods, type FromHousePeriod, type TopicPeriod, type TopicPeriodsInput } from "../shared/parashari-topic-periods";
import { phaladeepikaFromHouseMalayalam } from "../shared/malayalam-parashari-from-house";
import { computeChart } from "../server/routes";
import { computeParashari } from "../shared/parashari";
import { readFileSync } from "node:fs";
import type { Chart } from "../shared/schema";
import { buildReport, type ReportSection } from "../shared/report";
import { Settings } from "luxon";
import { listJoin } from "../shared/house-gloss";

test("Shweta house-pair translations preserve the specific pair, dates and attribution", () => {
  const par: TopicPeriodsInput = {
    bhavas: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, signIndex: i, lord: i === 6 || i === 8 ? "Sun" as const : "Moon" as const, lordIn: 1, lordSignIndex: 0 })),
    dasaReadings: [{ lord: "Sun", start: "2021-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z", ageStart: 20, ageEnd: 26, current: true, lean: { step: "favourable", favour: 6, against: 1 } }],
  };
  const topics = topicPeriods(par, { birthIso: "2000-01-01T00:00:00Z", asOfIso: "2025-01-01T00:00:00Z", deceased: false });
  for (const topic of ["career", "family"] as const) {
    const pair = topics.find((t) => t.topic === topic)!.pair!;
    const p = pair.periods[0];
    for (const plain of [true, false]) {
      const source = plain ? p.textPlain : p.text;
      const ml = bhavatPairMalayalam(p, pair, source, plain)!;
      for (const value of ["സൂര്യൻ", "2021", "2027", "20", "26", `${pair.house}-ാം`, `${pair.base}-ാം`, "ശ്വേത"]) assert.ok(ml.includes(value), value);
      assert.equal(bhavatPairMalayalam(p, pair, source + " Another condition.", plain), undefined);
      assert.equal(bhavatPairMalayalam(p, { ...pair, house: 2 }, source, plain), undefined);
    }
  }
});

test("Phaladeepika from-house lines retain all reasons, dates, roles, and changed-source fallback", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  let count = 0;
  const seen = new Set<string>();
  for (const entry of fixture.cases.slice(0, 3)) {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...entry } as Chart;
    const result = computeChart(chart);
    const asOf = chart.deathDate ? `${chart.deathDate}T00:00:00.000Z` : fixture.asOf;
    const par = computeParashari(result.positions, result.jaimini.lagna.lon, result.utc, asOf, result.shadbala, result.dasaStarts);
    const topics = topicPeriods(par, { birthIso: result.utc, asOfIso: asOf, deceased: !!chart.deathDate });
    for (const t of topics) for (const p of t.fromHouse?.periods ?? []) {
      for (const h of p.houses) for (const r of h.reasons) seen.add(r.clause);
      for (const plain of [true, false]) {
        const source = plain ? p.textPlain : p.text;
        const ml = phaladeepikaFromHouseMalayalam(p, source, plain);
        assert.ok(ml, `${t.topic} ${p.lord}: ${source}`);
        for (const h of p.houses) assert.ok(ml.includes(`${h.house}-ാം`));
        assert.equal(phaladeepikaFromHouseMalayalam(p, source + " Extra condition.", plain), undefined);
        assert.equal(phaladeepikaFromHouseMalayalam({ ...p, role: p.role === "both" ? "builds" : "both" }, source, plain), undefined);
        count++;
      }
    }
  }
  assert.ok(count > 5);
  assert.ok(seen.has("eighth-lord") && seen.has("friend") && seen.has("benefic"));
});

test("all six from-house reason families retain mixed support and strain", () => {
  const rs: FromHouseReason[] = [
    { clause: "eighth-lord", role: "harms", text: "lord of the 12th, the 8th from the 5th", plain: "it rules your 12th house, the 8th counted from your 5th", plainAlso: "it also rules your 12th house, the 8th counted from your 5th" },
    { clause: "drekkana", role: "harms", text: "lord of the 22nd drekkana from the 5th (Sagittarius, 2nd drekkana)", plain: "it rules a sensitive third of the 8th sign counted from your 5th house", plainAlso: "it also rules a sensitive third of the 8th sign counted from your 5th house" },
    { clause: "weak", role: "harms", text: "weak by Shadbala (0.90 of the required) in the 6th from the 5th", plain: "it is weak and stands in the 6th counted from your 5th house", plainAlso: "it is also weak and stands in the 6th counted from your 5th house" },
    { clause: "malefic", role: "builds", text: "strong malefic in the 3rd from the 5th", plain: "it is strong and stands in the 3rd counted from your 5th house, where a harsher planet helps", plainAlso: "it also stands in the 3rd counted from your 5th house, where a harsher planet helps" },
    { clause: "benefic", role: "builds", text: "strong benefic in the 5th itself, a kendra and a trikona from it", plain: "it is strong, gentle by nature, and stands in your 5th house itself", plainAlso: "it is also gentle by nature and stands in your 5th house itself" },
    { clause: "friend", role: "builds", text: "strong natural friend of the Sun, the 5th lord", plain: "it is strong and a natural friend of the Sun, ruler of your 5th house", plainAlso: "it is also a natural friend of the Sun, ruler of your 5th house" },
  ];
  const helps = rs.filter((r) => r.role === "builds"), harms = rs.filter((r) => r.role === "harms");
  const text = `Sun dasa, Jan 2021 to Jan 2027 (ages 20-26), running: from the 5th, ${listJoin(rs.map((r) => r.text))}, so 15.7 names it both among the periods that build the house and among those that strain it.`;
  const textPlain = `The Sun's period, January 2021 to January 2027 (ages 20 to 26), running now: counting from your 5th house, Phaladeepika says this period both helps it, as ${plainReasons(helps)}, and asks for care with it, as ${plainReasons(harms)}.`;
  const p: FromHousePeriod = { lord: "Sun", start: "2021-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z", ageStart: 20, ageEnd: 26, current: true, houses: [{ house: 5, role: "both", reasons: rs }], role: "both", tone: "mixed", text, textPlain, sources: [] };
  for (const plain of [true, false]) {
    const result = phaladeepikaFromHouseMalayalam(p, plain ? textPlain : text, plain)!;
    for (const s of ["5-ാം", "12-ാം", "8-ാം", "6-ാം", "3-ാം", "സൂര്യൻ"]) assert.ok(result.includes(s), `${plain}: ${s}`);
    if (!plain) assert.ok(result.includes("0.90") && result.includes("22-ാം") && result.includes("2-ാം"));
    assert.equal(phaladeepikaFromHouseMalayalam({ ...p, houses: [{ house: 5, role: "both", reasons: [{ ...rs[0], plainAlso: "A changed qualifier" }, ...rs.slice(1)] }] }, plain ? textPlain : text, plain), undefined);
  }
});

test("delivery asides preserve sign counts, selected house, citation and equal-count qualification", () => {
  const par: TopicPeriodsInput = {
    lagna: { signIndex: 0 },
    bhavas: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, signIndex: i, lord: "Sun" as const, lordIn: 7, lordSignIndex: i })),
    dasaReadings: [],
  };
  const p: TopicPeriod = { lord: "Sun", start: "2021-01-01", end: "2027-01-01", ageStart: 20, ageEnd: 26, current: true, houses: [4], statementTone: "support", lean: { step: "balanced", favour: 1, against: 1 }, tone: "mixed", text: "", textPlain: "", sources: [], delivery: { text: "", textPlain: "", sources: [] } };
  for (let places = 1; places <= 12; places++) {
    par.bhavas[3].lordSignIndex = (3 + places - 1) % 12;
    const row = lordDistance(par, 4);
    for (const plain of [true, false]) {
      const source = plain ? row.textPlain : row.text;
      const ml = bhavatDeliveryMalayalam(par, p, source, plain)!;
      for (const value of ["4-ാം", `${places}-ാം`, "7-ാം", "സൂര്യൻ", "ശ്വേത"]) assert.ok(ml.includes(value), `${places}: ${value}`);
      if (places === 4) assert.ok(ml.includes("ഫലപ്രാപ്തി"));
      if (!plain) assert.ok(ml.includes("§" ) || ml.includes("ch. 2"));
      assert.equal(bhavatDeliveryMalayalam(par, p, source + " Extra qualification.", plain), undefined);
    }
  }
});

test("published report integrates from-house and delivery translations without changing metadata", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const oldNow = Settings.now;
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
    const result = computeChart(chart);
    const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
    let lines = 0, asides = 0;
    for (const plain of [true, false]) {
      const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("topic-"));
      const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("topic-"));
      for (let i = 0; i < en.length; i++) for (let j = 0; j < en[i].paras.length; j++) {
        const a = en[i].paras[j], b = ml[i].paras[j];
        if (a.aside && b.aside !== a.aside && /[\u0d00-\u0d7f]/.test(b.aside ?? "")) asides++;
        if (a.text && (a.text.includes("counting from your") || a.text.includes("so 15.7 counts")) && b.lang === "ml") {
          assert.deepEqual(b.cites, a.cites); assert.equal(b.tone, a.tone); assert.equal(b.provisional, a.provisional);
          lines++;
        }
      }
    }
    assert.ok(lines > 0); assert.ok(asides > 0);
  } finally { Settings.now = oldNow; }
});
