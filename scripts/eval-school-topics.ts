// Reproducible presentation/source audit. No private charts or events belong in the fixture.
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { expandedSchoolTopicBriefs, defaultAlpForTopics } from "../shared/school-topics-expanded";
import type { BriefSchool } from "../shared/school-topic-brief";
import type { Chart } from "../shared/schema";

const fixture = JSON.parse(readFileSync("scripts/fixtures/school-topics-fresh-cases.json", "utf8"));
const schools: BriefSchool[] = ["parashari", "kp", "jaimini", "alp", "prasna"];
const out = fixture.cases.map((item: Record<string, string>) => {
  const chart = { ...item, id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeStandard: "auto", timeUncertaintyMin: 5, notes: "", deathDate: null, events: [] } as unknown as Chart;
  const result = computeChart(chart);
  // The snapshot's positions are not used for natal or ALP readings. Noon UTC preserves the intended date;
  // defaultAlpForTopics then selects start of that civil day in the birth-zone, not an assumed event time.
  result.now.asOf = `${item.asOfDay}T12:00:00.000Z`;
  const input = agreementInput(result, true);
  const agreement = computeAgreement(input);
  const alp = defaultAlpForTopics(result, input.withheld);
  const readings = Object.fromEntries(schools.map((school) => {
    const briefs = expandedSchoolTopicBriefs(result, school, input, agreement);
    const selected = briefs.filter((b) => ["career", "education", "travel", "authority"].includes(b.topic));
    return [school, { topics: briefs.map((b) => b.topic), selected: selected.map((b) => ({ topic: b.topic, summary: b.summary, stance: b.stance, frame: b.frame, basis: b.basis, conditional: b.conditional, provisional: b.provisional, details: b.details })) }];
  }));
  return { name: item.name, birthTime: item.birthTime, birthSource: item.birthSource, factSource: item.factSource, asOfDay: item.asOfDay, asOfPurpose: item.asOfPurpose, lagna: result.jaimini.lagna.sign, alpAsOf: alp.asOf, alpRuleIds: alp.findings.map((f) => f.ruleId), readings };
});
process.stdout.write(JSON.stringify({ protocol: fixture.protocol, warning: "Descriptive presentation audit, not evidence of event prediction or horoscope accuracy; ALP evaluated at the selected day, not event instant.", cases: out }, null, 2) + "\n");
