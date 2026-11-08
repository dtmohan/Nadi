import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { bnnRoleSummaryMalayalam } from "../shared/malayalam-bnn-role-summary";
import { translate } from "../shared/localization";
import { buildReport } from "../shared/report";
import type { Chart } from "../shared/schema";

test("BNN role summaries preserve planet, sign, star, companions and unknown qualifiers", () => {
  const person = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases[0];
  const result = computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart);
  const roles = [
    [result.reading.roles.native, "Jeeva karaka", result.reading.jeeva],
    ["Saturn", "Karma karaka", result.reading.karma],
    [result.reading.roles.deha, "Deha karaka", result.reading.deha!],
  ] as const;
  const report = buildReport(result, { plain: false, modules: ["bnn"], locale: "ml" });
  const reportParas = report.sections.find((s) => s.id === "bnn")!.paras;
  for (const [planet, role, entry] of roles) {
    const translated = bnnRoleSummaryMalayalam(result, planet, role, entry.summary)!;
    const p = result.positions.find((x) => x.planet === planet)!;
    for (const fact of [p.planet, p.sign, p.nakshatra, p.nakshatraLord, ...entry.companions]) assert.ok(translated.includes(translate("ml", fact)), fact);
    assert.equal(bnnRoleSummaryMalayalam(result, planet, role, `${entry.summary} Extra condition.`), undefined);
    assert.ok(reportParas.some((p) => p.text === translated && p.lang === "ml"));
  }
  const changed = { ...result, reading: { ...result.reading, strength: result.reading.strength.map((s) => s.planet === result.reading.roles.native ? { ...s, dignityNote: "Unreviewed condition" } : s) } };
  assert.equal(bnnRoleSummaryMalayalam(changed, result.reading.roles.native, "Jeeva karaka", result.reading.jeeva.summary), undefined);
});
