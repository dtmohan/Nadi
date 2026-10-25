// The Nadi transit reader names no held-back area for a minor (life-stage.ts AREA_ONSET: marriage and children
// before 18, career and wealth before 16): not in the headline, the notes, the progression or the lines it
// activates, on the Nadi tab's timeline and in the PDF alike. An adult's passages read exactly as before.
// Synthetic charts only.
import test from "node:test";
import assert from "node:assert/strict";
import PDFDocument from "pdfkit";
import type { Chart } from "@shared/schema";
import { computeChart } from "../server/routes";
import { buildChartPdf } from "../server/pdf";
import { readTransits } from "@shared/timing";
import { heldAreasAt, lifeAsOf } from "@shared/life-stage";

const chart = (
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
    name: `Synthetic ${gender}, ${place}`,
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

const GIRL = chart("female", "2016-03-02", "09:40", "America/Los_Angeles", "Portland, Oregon", 45.52345, -122.67621);
const BOY = chart("male", "2014-08-20", "09:40", "America/Los_Angeles", "Portland, Oregon", 45.52345, -122.67621);
const ADULT = chart("male", "1992-12-16", "11:45", "Africa/Lagos", "Lagos, Nigeria", 6.5244, 3.3792);

// Words that speak of each gated area in the reader's sentences (headlines, notes, progressions, activations).
const WORDS: Record<string, RegExp> = {
  marriage: /\b(marriage|married|spouse|husband|wife|partnerships?)\b/i,
  children: /\b(children|child)\b/i,
  career: /\b(career|profession|promotion|livelihood|work)\b/i,
  wealth: /\b(wealth|financial|gains?|earnings|money|debts?|inheritance|expenses|property)\b/i,
};

const read = (c: Chart, gate: boolean) => {
  const r = computeChart(c);
  const held = heldAreasAt(r.utc, lifeAsOf(r.chart, r.now.asOf));
  const readings = readTransits(r.transits, r.positions, r.reading.findings, r.utc, r.reading.roles, gate ? held : undefined);
  return { r, held, readings };
};

test("a minor's passages name no held-back area, in the headline, the notes or the lines they wake", () => {
  for (const c of [GIRL, BOY]) {
    const { held, readings } = read(c, true);
    const gated = Object.keys(WORDS).filter((a) => held(a));
    assert.deepEqual(gated.sort(), ["career", "children", "marriage", "wealth"], "a ten-year-old holds all four back");
    for (const x of readings) {
      for (const f of x.activated) assert.ok(!held(f.area), `${x.period.planet} ${x.period.sign}: ${f.area} line`);
      for (const a of x.areas) assert.ok(!held(a), `${x.period.planet} ${x.period.sign}: ${a}`);
      for (const text of [x.headline, ...x.notes])
        for (const a of gated) assert.doesNotMatch(text, WORDS[a], `${c.birthDate} ${x.period.planet} ${x.period.sign}`);
    }
    // The gate changes something for these charts, so the checks above are not empty.
    const before = read(c, false).readings;
    assert.ok(before.some((x, i) => x.headline !== readings[i].headline || x.notes.join() !== readings[i].notes.join()));
  }
});

test("an adult's passages read exactly as before", () => {
  const gated = read(ADULT, true).readings;
  const before = read(ADULT, false).readings;
  assert.deepEqual(gated, before);
});

test("the PDF prints the gated passages for a minor, never the ungated wording", async () => {
  for (const c of [GIRL, BOY]) {
    const { r, readings } = read(c, true);
    const before = read(c, false).readings;
    const printed: string[] = [];
    const proto = PDFDocument.prototype as unknown as { text: (...args: unknown[]) => unknown };
    const original = proto.text;
    proto.text = function (this: unknown, ...args: unknown[]) {
      if (typeof args[0] === "string") printed.push(args[0]);
      return original.apply(this, args);
    };
    try {
      const doc = buildChartPdf(r);
      await new Promise<void>((done) => {
        doc.on("data", () => {});
        doc.on("end", () => done());
      });
    } finally {
      proto.text = original;
    }
    const all = printed.join("\n");
    let changed = 0;
    for (let i = 0; i < before.length; i++) {
      if (before[i].headline !== readings[i].headline) {
        changed++;
        assert.ok(!all.includes(before[i].headline), `ungated headline printed: ${before[i].headline}`);
      }
      for (const n of before[i].notes) if (!readings[i].notes.includes(n)) assert.ok(!all.includes(n), `ungated note printed: ${n}`);
    }
    assert.ok(changed > 0, "the gate changes at least one headline");
    // The passages running now are printed in their gated wording.
    const at = Date.parse(r.now.asOf);
    for (const x of readings)
      if (Date.parse(x.period.start) <= at && at < Date.parse(x.period.end)) assert.ok(all.includes(x.headline), x.headline);
  }
});
