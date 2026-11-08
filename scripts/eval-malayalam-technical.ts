/** Translation-coverage and English/Malayalam report-parity audit for public fixtures. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { readerExperience } from "../shared/reader-experience";
import { buildReport, type ReportSection } from "../shared/report";
import { LORD_IN_HOUSE } from "../shared/parashari-data";
import { MALAYALAM_PARASHARI_LORDS } from "../shared/malayalam-parashari-lords";
import { SUTRA_RULES } from "../shared/rules-jaimini-sutras";
import { KP_RULES, kpFindingPlain } from "../shared/rules-kp";
import { RULES } from "../shared/rules";
import { ALP_RULES } from "../shared/rules-alp";
import { PRASNA_HOUSE_EFFECTS, PRASNA_TRANSIT_EFFECTS, PRASNA_GULIKA_EFFECTS } from "../shared/rules-prasna";
import { PRASNA_HOUSE_EFFECT_PLAIN } from "../shared/prasna-plain";
import { soften } from "../shared/gentle";
import { translate } from "../shared/localization";
import type { Chart } from "../shared/schema";

type Case = Pick<Chart, "name" | "gender" | "birthDate" | "birthTime" | "timeStandard" | "timezone" | "place" | "latitude" | "longitude" | "deathDate"> & {
  alternatives?: Array<{ label: string; birthTime?: string; timeStandard?: string }>;
};
const manifest = JSON.parse(readFileSync(process.argv[2] ?? "research/malayalam-technical/cases.json", "utf8")) as { asOf: string; cases: Case[] };
Settings.now = () => Date.parse(manifest.asOf);
const defaults = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [] as Chart["events"] } as const;
const flatten = (sections: ReportSection[]): ReportSection[] => sections.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
/** Count source strings with English words, excluding numbers and glyphs that need no translation.
 * A changed string containing Malayalam counts as translated, not as reviewed or semantically correct. */
const coverage = (pairs: Array<[string | undefined, string | undefined]>) => {
  const text = pairs.filter(([en]) => !!en && /[a-zA-Z]/.test(en));
  return { total: text.length, translated: text.filter(([en, ml]) => ml !== en && /[\u0d00-\u0d7f]/.test(ml ?? "")).length };
};
const kp = KP_RULES.map((r) => soften(kpFindingPlain({ ruleId: r.id, text: r.text })));
const catalogue = (texts: string[]) => ({ total: texts.length, translated: texts.filter((s) => translate("ml", s) !== s).length });
const catalogues = {
  parashariLord: { total: LORD_IN_HOUSE.flat().length, translated: LORD_IN_HOUSE.flat().filter((r) => MALAYALAM_PARASHARI_LORDS[r.verse]?.source === r.text && !!MALAYALAM_PARASHARI_LORDS[r.verse]?.text).length },
  jaiminiSutras: { total: SUTRA_RULES.length, translated: SUTRA_RULES.filter((r) => translate("ml", r.text) !== r.text).length },
  kpPlain: catalogue(kp),
  bnnRaw: catalogue(RULES.map((r) => r.text)),
  alpRaw: catalogue(ALP_RULES.map((r) => r.text)),
  prasnaPlainHouse: catalogue(Object.values(PRASNA_HOUSE_EFFECT_PLAIN).flatMap((r) => [r.benefic, r.malefic])),
  prasnaRawHouse: catalogue(PRASNA_HOUSE_EFFECTS.flatMap((r) => [r.benefic, r.malefic])),
  prasnaRawTransit: catalogue(Object.values(PRASNA_TRANSIT_EFFECTS).flat()),
  prasnaRawGulika: catalogue(PRASNA_GULIKA_EFFECTS),
};

const variants = manifest.cases.flatMap((c) => [c, ...(c.alternatives ?? []).map(({ label, ...override }) => ({ ...c, ...override, name: `${c.name} (${label})` }))]);
const cases = variants.map((c) => {
  const result = computeChart({ ...defaults, ...c } as Chart);
  const reader = readerExperience(result);
  const schools: Record<string, { selected: number; translated: number }> = {};
  for (const topic of reader.topics) for (const b of topic.visibleSchools) {
    const count = schools[b.school] ??= { selected: 0, translated: 0 };
    for (const d of b.details ?? []) { count.selected++; if (b.ml?.details?.[d.id]) count.translated++; }
  }
  const reports = [true, false].map((plain) => {
    const en = buildReport(result, { plain, locale: "en" });
    const ml = buildReport(result, { plain, locale: "ml" });
    const a = flatten(en.sections), b = flatten(ml.sections).filter((s) => s.id !== "translation-notice");
    assert.deepEqual(b.map((s) => s.id), a.map((s) => s.id));
    assert.deepEqual(ml.cites, en.cites);
    for (let i = 0; i < a.length; i++) {
      assert.equal(b[i].paras.length, a[i].paras.length);
      for (let j = 0; j < a[i].paras.length; j++) {
        assert.deepEqual(b[i].paras[j].cites, a[i].paras[j].cites);
        assert.equal(b[i].paras[j].provisional, a[i].paras[j].provisional);
        assert.equal(b[i].paras[j].kind, a[i].paras[j].kind);
      }
    }
    const lines = b.flatMap((s) => s.paras).filter((p) => !!p.text);
    const bySection = ml.sections.filter((s) => s.id !== "translation-notice").map((section) => {
      const paragraphs = flatten([section]).flatMap((s) => s.paras).filter((p) => !!p.text);
      return { id: section.id, paragraphs: paragraphs.length, translated: paragraphs.filter((p) => p.lang === "ml").length };
    }).filter((s) => s.paragraphs);
    const headings: Array<[string | undefined, string | undefined]> = [];
    const asides: Array<[string | undefined, string | undefined]> = [];
    const tableHeaders: Array<[string | undefined, string | undefined]> = [];
    const tableCells: Array<[string | undefined, string | undefined]> = [];
    for (let i = 0; i < a.length; i++) {
      headings.push([a[i].title, b[i].title], [a[i].kicker, b[i].kicker]);
      for (let j = 0; j < a[i].paras.length; j++) {
        const x = a[i].paras[j], y = b[i].paras[j];
        asides.push([x.aside, y.aside]);
        for (let k = 0; k < (x.head?.length ?? 0); k++) tableHeaders.push([x.head?.[k], y.head?.[k]]);
        for (let r = 0; r < (x.rows?.length ?? 0); r++) for (let c = 0; c < (x.rows?.[r]?.length ?? 0); c++)
          tableCells.push([x.rows?.[r]?.[c], y.rows?.[r]?.[c]]);
      }
    }
    return { mode: plain ? "plain" : "practitioner", paragraphs: lines.length, translated: lines.filter((p) => p.lang === "ml").length, bySection,
      otherContent: { headings: coverage(headings), asides: coverage(asides), tableHeaders: coverage(tableHeaders), tableCells: coverage(tableCells),
        citations: coverage(en.cites.map((cite, i) => [cite.label, ml.cites[i]?.label])) },
      // These counts include repeated selections and technical notes; they are not a quality score.
    };
  });
  return { name: c.name, ascendant: result.jaimini.lagna.sign, schools, reports };
});
process.stdout.write(JSON.stringify({ asOf: manifest.asOf, catalogues, cases }, null, 2) + "\n");
