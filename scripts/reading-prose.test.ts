import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildReadingInput, composeReading } from "../shared/reading-prose";
import { lintProse } from "../shared/reading-lint";
import type { ChartResult } from "../shared/schema";

const result = JSON.parse(
  readFileSync(new URL("./fixtures/einstein.json", import.meta.url), "utf8"),
) as ChartResult;
const input = buildReadingInput(result);
const doc = composeReading(input);
const prose = doc.sections
  .flatMap((s) => [s.preamble ?? "", ...s.paragraphs.map((p) => p.text)])
  .join("\n\n");
const areas = doc.sections.flatMap((s) => s.paragraphs).filter((p) => p.id.startsWith("area-"));

test("the reading has the agreed chapter shape", () => {
  assert.deepEqual(
    doc.sections.map((s) => s.id),
    ["chart", "native", "work", "bonds", "mind", "conditions", "schools", "time", "sources"],
  );
  assert.equal(areas.length, 11, "every life area has one paragraph");
  assert.equal(doc.summary.length, 5);
  assert.equal(doc.conditions.length, 6);
  assert.ok(doc.conditions.every((c) => c.period.startsWith("Period:")), "every condition states its period");
  assert.ok(doc.conditions.every((c) => c.d9.startsWith("D9:")), "every condition states its D9 positions");
  assert.equal(doc.index.length, 11);
  assert.deepEqual(
    doc.index.map((e) => e.topic),
    ["self", "health", "career", "authority", "wealth", "marriage", "children", "family", "education", "spirituality", "travel"],
  );
  assert.ok(doc.index.every((e) => e.short), "every area needs a contents-rail label");
  assert.match(doc.standfirst, /^Work is unusually clear/);
  assert.match(doc.sections[0].paragraphs[0].text, /Gemini rising at 19°28′/);
  assert.match(doc.sections[0].paragraphs[0].text, /Jupiter, the Jeeva, standing alone in Aquarius/);

  const bonds = doc.sections.find((s) => s.id === "bonds")!;
  const marriage = bonds.paragraphs.find((p) => p.id === "area-marriage")!;
  assert.match(marriage.text, /does not average/);
  assert.match(marriage.text, /Venus with the Sun/);
  assert.match(marriage.text, /Venus, Saturn and Ketu/);

  const work = doc.sections.find((s) => s.id === "work")!;
  assert.ok(work.paragraphs.some((p) => p.id === "area-career" && /tenth house/.test(p.frame ?? "")));
  assert.ok(work.working?.some((w) => w.label === "Jaimini"));
  assert.ok(work.working?.some((w) => w.label === "KP"));
  assert.ok(doc.sections.find((s) => s.id === "native")?.working?.some((w) => w.label === "Jaimini"));
  for (const id of ["native", "work", "bonds", "mind"]) {
    const section = doc.sections.find((s) => s.id === id)!;
    assert.match(section.preamble ?? "", /Lagna Gemini/);
    assert.match(section.preamble ?? "", /Jaimini:/);
    assert.match(section.preamble ?? "", /KP:/);
    assert.ok(section.paragraphs.some((p) => p.id === `close-${id}`), `${id} should have a closing paragraph`);
  }

  assert.equal(doc.comparison.find((r) => r.topic === "marriage")?.cells.length, 4);
  assert.ok(doc.comparison.every((r) => r.cells.length === 4));
  assert.ok(doc.timing.some((t) => /Rahu/.test(t.label)));
  assert.ok(doc.sources.some((s) => /Rao/.test(s.source)));
});

test("the prose is clean, complete and deterministic", () => {
  assert.doesNotMatch(prose, /undefined|NaN|\[object Object\]/);
  assert.doesNotMatch(prose, / {2,}/);
  assert.doesNotMatch(prose, /\.\./);
  assert.doesNotMatch(prose, /Saturn, the Saturn|The native is one of|the 1 house|the 1st house/i);
  assert.doesNotMatch(prose, /\bThe (Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/, "only the Sun and Moon take 'the'");
  assert.deepEqual(lintProse(prose), [], "the lexicon's prose lint should be clean");
  const claims = areas.map((p) => p.text.split(/(?<=[.?!])\s/)[0]);
  assert.equal(new Set(claims).size, claims.length, "every area needs its own opening claim");
  assert.ok(prose.split(/\s+/).length > 1000, "the reading should cover the life areas");
  assert.ok(prose.split(/\s+/).length < 3000, "the reading should not become a rule dump");

  for (const section of doc.sections) {
    for (const p of section.paragraphs) {
      assert.match(p.text, /^[A-Z]/, `${p.id} should start with a capital`);
      assert.match(p.text, /[.!?…”]$/, `${p.id} should end with a stop`);
      assert.ok(p.text.split(/\s+/).length < 300, `${p.id} should stay paragraph-sized`);
    }
  }

  for (const p of areas) {
    assert.ok(p.subhead, `${p.id} should have a subheading`);
    assert.ok(p.frame, `${p.id} should carry its Parashari frame`);
    assert.match(p.frame!, /house/, `${p.id} frame should name a house`);
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
