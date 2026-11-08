import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { buildReport } from "../shared/report";
import { LAKSHMI_SPECS, type LakshmiForm, type LakshmiPlanet, type LakshmiReading } from "../shared/lakshmi";
import { lakshmiFormMalayalam, lakshmiHeadlineMalayalam, lakshmiNotesMalayalam, lakshmiPeriodMalayalam } from "../shared/malayalam-lakshmi-report";
import type { Chart } from "../shared/schema";

const ordinal = (h: number) => `${h}${["th", "st", "nd", "rd"][h % 10 < 4 && (h < 11 || h > 13) ? h % 10 : 0]}`;
const formText = (f: LakshmiForm) => `${f.planet} in the ${ordinal(f.house)} from Venus — ${f.form}: ${f.domain}.${f.via === "case-study" ? " Read in the book's case studies, beyond the chapter diagrams." : ""}`;

test("each Lakshmi planet preserves its exact domain and chart house", () => {
  for (const [planet, spec] of Object.entries(LAKSHMI_SPECS) as [LakshmiPlanet, typeof LAKSHMI_SPECS[LakshmiPlanet]][]) {
    for (const via of ["diagram", ...(spec.caseStudy ? ["case-study"] : [])] as LakshmiForm["via"][]) {
      const f: LakshmiForm = { planet, form: spec.form, domain: spec.domain, house: via === "diagram" ? spec.houses[0] : spec.caseStudy![0], via, pages: spec.pages };
      const en = formText(f), ml = lakshmiFormMalayalam(f, en)!;
      assert.ok(ml.includes(`${f.house}-ാം`));
      assert.equal(ml.includes("കേസ്പഠനങ്ങളിൽ"), via === "case-study");
      assert.equal(lakshmiFormMalayalam(f, `${en} Extra condition.`), undefined);
      assert.equal(lakshmiFormMalayalam({ ...f, domain: `${f.domain} extra` }, formText({ ...f, domain: `${f.domain} extra` })), undefined);
    }
  }
});

test("public chart reports include complete translated Lakshmi headline, forms and qualifications", () => {
  const cases = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases.slice(0, 4);
  for (const person of cases) {
    const result = computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart);
    const l = result.reading.lakshmi;
    const headline = lakshmiHeadlineMalayalam(l, l.headline);
    const notes = lakshmiNotesMalayalam(l, l.notes.join(" "));
    assert.ok(headline && notes);
    assert.equal(lakshmiHeadlineMalayalam(l, `${l.headline} Extra.`), undefined);
    assert.equal(lakshmiNotesMalayalam(l, `${l.notes.join(" ")} Extra.`), undefined);
    const report = buildReport(result, { plain: false, modules: ["bnn"], locale: "ml" });
    const paras = report.sections.find((s) => s.id === "bnn")!.sub!.find((s) => s.id === "bnn-lakshmi")!.paras;
    assert.ok(paras.some((p) => p.text === headline && p.lang === "ml"));
    assert.ok(paras.some((p) => p.text === notes && p.lang === "ml"));
    assert.equal(paras.filter((p) => p.lang === "ml").length, l.forms.length + 2);
  }
});

test("period qualification keeps running, passed and death-date states", () => {
  const p = { start: "2010-01-01", end: "2020-01-01", current: true };
  const running = lakshmiPeriodMalayalam(p, "2015-01-01", false, "Mahadasha Jan 2010 to Jan 2020 (running)");
  assert.ok(running?.includes("നടന്നുകൊണ്ടിരിക്കുന്നു"));
  const death = lakshmiPeriodMalayalam(p, "2015-01-01", true, "Mahadasha Jan 2010 to Jan 2020 (running at passing)");
  assert.ok(death?.includes("മരണസമയത്ത്"));
  assert.equal(lakshmiPeriodMalayalam(p, "2015-01-01", true, "Mahadasha Jan 2010 to Jan 2020 (running)"), undefined);
});

test("zero-form headline remains explicitly a non-match", () => {
  const r: LakshmiReading = { venusSign: "Libra", forms: [], headline: "Venus in Libra stands alone in the Lakshmi scheme: no planet occupies the houses the book sets for her forms. Wealth is read from the Rao/Naik combinations instead.", notes: [] };
  assert.ok(lakshmiHeadlineMalayalam(r, r.headline)?.includes("ഗ്രഹങ്ങളൊന്നുമില്ല"));
});
