// Public chart reading audit. See docs/reading-audit-protocol.md; no personal charts here.
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { computeKp } from "../shared/kp";
import { agreementFor } from "../shared/agreement";
import { synthesize } from "../shared/synthesis";
import type { Chart } from "../shared/schema";

type Case = {
  chart: Partial<Chart> & { name: string; gender: "male" | "female" };
  birthSource: string; birthQuality: string; profession: "technical" | "writing" | "music" | "sport";
  professionSource: string; knownChild?: string; childSource?: string;
};
const fixtureArg = process.argv.indexOf("--fixture");
const fixture = fixtureArg >= 0 ? process.argv[fixtureArg + 1] : new URL("./fixtures/reading-audit-cases.json", import.meta.url);
const input = JSON.parse(readFileSync(fixture, "utf8")) as { cases: Case[] };
const words: Record<Case["profession"], RegExp> = {
  technical: /\b(?:engineer|technical|technology|information technology|software|comput|machine|mechanic|mathematic|research|electronic)\w*/i,
  writing: /\b(?:writ\w*|author(?:s|ship)?|poet\w*|publish\w*|journalis\w*|literar\w*)\b/i,
  music: /\b(?:music|sing|vocal|perform|entertain|cinema|artis)\w*/i,
  sport: /\b(?:chess|sport|athlet|competition|competitive|game)\w*/i,
};
const cases = input.cases.map((item) => {
  const chart = { ...item.chart, id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: item.chart.deathDate ?? null, timeUncertaintyMin: 0, events: [] } as Chart;
  const result = computeChart(chart);
  const areas = synthesize(result.reading, chart.gender as "male" | "female");
  const career = areas.find((a) => a.area === "career");
  const children = areas.find((a) => a.area === "children");
  const kp = computeKp(result.kp, result.utc, result.now.asOf);
  const agreements = agreementFor(result, true);
  const kpCareer = agreements.find((a) => a.topic === "career")?.stances.find((s) => s.system === "kp");
  const childrenAgreement = agreements.find((a) => a.topic === "children");
  const careerText = [career?.headline ?? "", ...(career?.key ?? []).map((f) => f.text), career?.careerAlternative?.text ?? ""].join(" ");
  return {
    name: chart.name, birthSource: item.birthSource, birthQuality: item.birthQuality,
    timeBasis: result.timeBasis.label, profession: item.profession, professionSource: item.professionSource,
    knownChild: item.knownChild, childSource: item.childSource,
    career: { headline: career?.headline, key: career?.key.map((f) => ({ id: f.ruleId, score: f.score, text: f.text })), additional: career?.careerAlternative && { id: career.careerAlternative.ruleId, score: career.careerAlternative.score, text: career.careerAlternative.text }, categoryMentioned: words[item.profession].test(careerText) },
    children: { headline: children?.headline, key: children?.key.map((f) => ({ id: f.ruleId, text: f.text })), cardHeadline: result.reading.children.headline, cardNotes: result.reading.children.notes,
      overview: childrenAgreement?.stances.filter((s) => s.system === "bnn" || s.system === "kp").map((s) => ({ system: s.system, word: s.word, note: s.note })) },
    kp: { career: kpCareer && { stance: kpCareer.stance, word: kpCareer.word, note: kpCareer.note },
      rules: kp.findings.filter((f) => ["kp7-harmony", "kp7-opponent", "kp11-marital", "kp10-reinstatement-denied"].includes(f.ruleId)).map((f) => ({ id: f.ruleId, text: f.text, used: f.used, evidence: f.evidence })) },
  };
});
const baselineArg = process.argv.indexOf("--compare");
const baseline = baselineArg >= 0 ? JSON.parse(readFileSync(process.argv[baselineArg + 1], "utf8")) : undefined;
// Re-score the stored raw before text with exactly the same matcher as the after text. The first
// draft accidentally matched "author" inside "authority"; raw snapshots make this correction fair.
const before = baseline?.cases?.map((c: any) => {
  const profession = input.cases.find((x) => x.chart.name === c.name)!.profession;
  const text = [c.career.headline ?? "", ...(c.career.key ?? []).map((f: any) => f.text)].join(" ");
  return { name: c.name, career: { ...c.career, categoryMentioned: words[profession].test(text) }, children: c.children, kp: c.kp };
});
const summary = { cases: cases.length, professionMentioned: cases.filter((c) => c.career.categoryMentioned).length,
  knownChildCases: cases.filter((c) => c.knownChild).length };
const beforeSummary = before && { cases: before.length, professionMentioned: before.filter((c: any) => c.career.categoryMentioned).length, knownChildCases: summary.knownChildCases };
process.stdout.write(JSON.stringify({ protocol: "docs/reading-audit-protocol.md", summary, ...(baseline ? { beforeSummary, before } : {}), cases }, null, 2) + "\n");
