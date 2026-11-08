import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildReadingInput, composeReading } from "../shared/reading-prose";
import type { ChartResult } from "../shared/schema";

const result = JSON.parse(
  readFileSync(new URL("./fixtures/einstein.json", import.meta.url), "utf8"),
) as ChartResult;
const input = buildReadingInput(result);
const doc = composeReading(input);
const prose = doc.sections
  .flatMap((s) => s.paragraphs.map((p) => p.text))
  .join("\n\n");

test("the reading has the shape the room expects", () => {
  assert.equal(doc.sections.length, 9);
  assert.match(doc.standfirst, /^Work is unusually clear/);
  assert.match(doc.sections[0].paragraphs[0].text, /Gemini rising at 19°28′/);
  assert.match(doc.sections[0].paragraphs[0].text, /Jupiter, the Jeeva, standing alone in Aquarius/);
  assert.match(doc.sections[3].title, /marriage/i);
  assert.match(doc.sections[3].paragraphs[0].text, /does not average/);
  assert.equal(doc.comparison.find((r) => r.topic === "marriage")?.cells.length, 4);
  assert.ok(doc.comparison.every((r) => r.cells.length === 4));
  assert.ok(doc.timing.some((t) => /Rahu/.test(t.label)));
  assert.ok(doc.sources.some((s) => /Rao/.test(s.source)));
});

test("the prose is clean, complete and deterministic", () => {
  assert.doesNotMatch(prose, /undefined|NaN|\[object Object\]/);
  assert.doesNotMatch(prose, / {2,}/);
  assert.doesNotMatch(prose, /\.\./);
  assert.doesNotMatch(prose, /Saturn, the Saturn|The native is one of/i);
  assert.ok(prose.split(/\s+/).length > 700, "the reading should say enough to be a reading");
  assert.ok(prose.split(/\s+/).length < 1600, "the reading should not become a rule dump");

  for (const section of doc.sections) {
    for (const p of section.paragraphs) {
      assert.match(p.text, /^[A-Z]/, `${p.id} should start with a capital`);
      assert.match(p.text, /[.!?…”]$/, `${p.id} should end with a stop`);
      assert.ok(p.text.split(/\s+/).length < 260, `${p.id} should stay paragraph-sized`);
    }
  }

  const again = composeReading(buildReadingInput(result));
  assert.equal(JSON.stringify(again), JSON.stringify(doc), "same chart, same prose");
});

test("the evidence marks distinguish source, provisional and calculation", () => {
  const marks = new Set(
    doc.sections.flatMap((s) => s.paragraphs.flatMap((p) => p.evidence.map((e) => e.mark))),
  );
  assert.ok(marks.has("source"));
  assert.ok(marks.has("provisional"));
  assert.ok(marks.has("calculation"));
});
