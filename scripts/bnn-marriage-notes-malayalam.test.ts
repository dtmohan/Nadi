import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { computeChart } from "../server/routes";
import type { Chart } from "../shared/schema";
import { bnnMarriageNotesMalayalam, bnnMarriageWindowMalayalam } from "../shared/malayalam-bnn-marriage-notes";
import { buildReport, type ReportSection } from "../shared/report";
import { nextMarriageWindow } from "../shared/marriage";
import { fmtMonth } from "../shared/report/types";

function example() {
  const entry = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases.find((c: { name: string }) => c.name === "P. T. Usha");
  return computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, notes: "", events: [], ...entry } as Chart);
}

test("marriage note translation retains relation, qualified age, node and Jupiter conditions", () => {
  const m = example().reading.marriage;
  const notes = [
    `Saturn in trine to ${m.spouse}: the classic delay; marriage tends to come later than the family norm (the delay is sourced; any specific age is provisional).`,
    `Rahu in trine to ${m.spouse}: obstacles before marriage and disputes after it, at trine strength; a partner from another community, region or country is likely; Jupiter's aspect brings compromise.`,
  ];
  const candidate = { ...m, notes };
  const source = notes.join(" ");
  const ml = bnnMarriageNotesMalayalam(candidate, source)!;
  for (const word of ["ത്രികോണത്തിൽ", "താമസത്തിന് ഉറവിടമുണ്ട്", "പ്രത്യേക പ്രായം താൽക്കാലികമാണ്", "സമുദായത്തിൽനിന്നോ", "പ്രദേശത്തുനിന്നോ", "രാജ്യത്തുനിന്നോ", "വ്യാഴത്തിന്റെ ദൃഷ്ടി"]) assert.ok(ml.includes(word), word);
  assert.equal(bnnMarriageNotesMalayalam(candidate, `${source} Extra condition.`), undefined);
  assert.equal(bnnMarriageNotesMalayalam({ ...candidate, notes: [...notes, "Unknown condition."] }, `${source} Unknown condition.`), undefined);
});

test("marriage transit aside keeps date range and does not add a future window for the deceased", () => {
  const r = example(), m = r.reading.marriage;
  const win = nextMarriageWindow(m, r.transits, r.now.asOf.slice(0, 10));
  const source = `Jupiter over ${m.spouseSign} or its trines brings the matter forward${win ? `; next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}` : ""}.`;
  const ml = bnnMarriageWindowMalayalam(m, win, false, source);
  assert.ok(ml);
  if (win) for (const date of [fmtMonth(win.period.start), fmtMonth(win.period.end)]) assert.ok(ml.includes(date));
  const deceasedSource = `Jupiter over ${m.spouseSign} or its trines brings the matter forward.`;
  assert.ok(bnnMarriageWindowMalayalam(m, win, true, deceasedSource));
  if (win) assert.equal(bnnMarriageWindowMalayalam(m, win, true, source), undefined);
  assert.equal(bnnMarriageWindowMalayalam(m, win, false, `${source} Extra condition.`), undefined);
});

test("practitioner report retains marriage note sources and translates the full aside", () => {
  const r = example();
  const flatten = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
  const en = flatten(buildReport(r, { plain: false, locale: "en", modules: ["bnn"] }).sections);
  const ml = flatten(buildReport(r, { plain: false, locale: "ml", modules: ["bnn"] }).sections);
  const e = en.find((s) => s.id === "bnn-marriage")!;
  const index = e.paras.findIndex((p) => p.aside?.startsWith("Jupiter over "));
  assert.ok(index >= 0);
  const t = ml.find((s) => s.id === "bnn-marriage")!.paras[index];
  assert.equal(t.lang, "ml");
  assert.ok(t.aside?.includes("വ്യാഴം"));
  assert.deepEqual(t.cites, e.paras[index].cites);
});
