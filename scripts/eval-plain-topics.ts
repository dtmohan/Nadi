// Public presentation audit by default. A separate --fixture may be supplied for a private local review;
// the caller chooses where to save its output. No personal chart is embedded here.
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { briefingFor } from "../shared/briefing";
import { areaSeason, lifeAsOf } from "../shared/life-stage";
import { synthesize } from "../shared/synthesis";
import { plainTopicBriefs } from "../shared/topic-brief";
import { buildReport } from "../shared/report";
import { DateTime } from "luxon";
import type { Chart } from "../shared/schema";

type CaseEvent = { topic: "career" | "marriage"; date: string; timezone?: string; description: string; source?: string; corroboration?: string; locationNote?: string };
type Case = {
  chart: Partial<Chart> & { name: string };
  birthSource?: string;
  birthQuality?: string;
  career?: string;
  careerSource?: string;
  marriage?: string;
  marriageSource?: string;
  events?: CaseEvent[];
};
const arg = process.argv.indexOf("--fixture");
const fixture = arg < 0 ? new URL("./fixtures/plain-topics-fresh.json", import.meta.url) : process.argv[arg + 1];
const input = JSON.parse(readFileSync(fixture, "utf8")) as { cases: Case[]; events?: CaseEvent[] };

const cases = input.cases.map((item) => {
  const chart = { ...item.chart, id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: item.chart.deathDate ?? null, timeUncertaintyMin: item.chart.timeUncertaintyMin ?? 0, events: [] } as Chart;
  const result = computeChart(chart);
  const lifeAt = lifeAsOf(chart, result.now.asOf);
  const areas = synthesize(result.reading, result.reading.roles.gender);
  const agreementIn = agreementInput(result, true);
  const agreement = computeAgreement(agreementIn);
  const brief = briefingFor(result, agreementIn);
  const topics = plainTopicBriefs({
    reading: result.reading,
    areas,
    agreement,
    brief,
    zone: chart.timezone,
    inSeason: (topic) => areaSeason(topic, result.utc, lifeAt).inSeason,
  });
  const report = buildReport(result, { plain: true, modules: ["bnn"] });
  const practitioner = buildReport(result, { plain: false, modules: ["bnn"] });
  const sections = (doc: typeof report) => doc.sections.flatMap((s) => [s, ...(s.sub ?? [])]);
  const reportSections = sections(report);
  const practitionerSections = sections(practitioner);
  const material = topics.map((topic) => {
    const area = areas.find((a) => a.area === topic.topic);
    const plainSection = reportSections.find((s) => s.id === `bnn-${topic.topic}`);
    const technicalSection = practitionerSections.find((s) => s.id === `bnn-${topic.topic}`);
    return {
      topic: topic.topic,
      beforeOverview: area?.headline ?? null,
      after: topic,
      sourceFindings: area?.key.map((f) => ({ id: f.ruleId, text: f.text, source: f.source ?? null })) ?? [],
      technicalMarriageHeadline: topic.topic === "marriage" ? result.reading.marriage.headline : undefined,
      reportContainsSummary: !!plainSection?.paras.some((p) => p.text === topic.summary),
      practitionerContainsFindings: !!technicalSection?.paras.some((p) => (area?.key ?? []).some((f) => p.text?.includes(f.text.replace(/\.$/, "")))),
    };
  });
  const eventChecks = (item.events ?? input.events ?? []).map((event) => {
    const zone = event.timezone ?? chart.timezone;
    const evaluateDay = (shift: number) => {
      const day = DateTime.fromISO(event.date, { zone }).startOf("day").plus({ days: shift });
      const asOf = day.minus({ days: 90 }).toUTC().toISO()!;
      // Only the clock changes; events are never inserted into the chart or its rule inputs.
      const at = { ...result, now: { ...result.now, asOf } };
      const atLife = lifeAsOf(chart, asOf);
      const atInput = agreementInput(at, true);
      const atBrief = briefingFor(at, atInput);
      const card = plainTopicBriefs({ reading: at.reading, areas, agreement: computeAgreement(atInput), brief: atBrief,
        zone: chart.timezone, inSeason: (topic) => areaSeason(topic, at.utc, atLife).inSeason }).find((t) => t.topic === event.topic);
      const dayStart = day.toMillis();
      const dayEnd = day.plus({ days: 1 }).toMillis();
      const windows = card?.windows ?? [];
      return {
        date: day.toISODate(), asOf, zone,
        possibleDayOverlap: windows.some((w) => Date.parse(w.start) < dayEnd && Date.parse(w.end) > dayStart),
        windows: windows.map((w) => ({ when: w.when, start: w.start, end: w.end, reason: w.reason })),
      };
    };
    return { event, actual: evaluateDay(0), comparisons: [-180, 180].map(evaluateDay) };
  });
  return {
    name: chart.name,
    birthSource: item.birthSource,
    birthQuality: item.birthQuality,
    career: item.career,
    careerSource: item.careerSource,
    marriage: item.marriage,
    marriageSource: item.marriageSource,
    asOf: lifeAt,
    timeBasis: result.timeBasis.label,
    ascendant: result.jaimini.lagna.sign,
    material,
    eventChecks,
  };
});
process.stdout.write(JSON.stringify({ protocol: "docs/plain-topics-fresh-protocol.md", cases }, null, 2) + "\n");
