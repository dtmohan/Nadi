/**
 * Inputs for the separate prose reader. This is a projection of the existing plain-reading
 * adapters: it does not infer a new verdict, combine schools, or change scores.
 */
import { agreementInput, computeAgreement } from "./agreement";
import { briefingFor, type BriefRow, type BeforeNote } from "./briefing";
import { areaSeason, lifeAsOf } from "./life-stage";
import type { Gender } from "./marriage";
import type { ChartResult } from "./schema";
import { expandedSchoolTopicBriefs } from "./school-topics-expanded";
import { type BriefSchool, type SchoolTopicBrief } from "./school-topic-brief";
import { synthesize } from "./synthesis";
import { malayalamTopicWindow, plainTopicBriefs, type PlainTopicBrief } from "./topic-brief";
import { readerPassage } from "./reader-prose";

const SCHOOLS: readonly BriefSchool[] = ["parashari", "kp", "jaimini", "alp", "prasna"];
const PRESENT_ROWS = new Set(["pa-dasa", "nadi-jupiter-now", "nadi-saturn-now"]);

export interface ReaderTopic {
  natal: PlainTopicBrief;
  schools: SchoolTopicBrief[];
  /** Reviewed prose in the same order as the selected themes; absent means use the original. */
  prose: Array<{ en: string; ml: string } | undefined>;
  malayalamWindows: Record<string, { when: string; statement: string; reason: string }>;
}
export interface ReaderExperience {
  topics: ReaderTopic[];
  before: BeforeNote[];
  present: BriefRow[];
  past: boolean;
}

export function readerExperience(result: ChartResult): ReaderExperience {
  // This experience is always a plain reading, regardless of the chart's practitioner toggle.
  const input = agreementInput(result, true);
  const agreement = computeAgreement(input);
  const briefing = briefingFor(result, input);
  const lifeAt = lifeAsOf(result.chart, result.now.asOf);
  const areas = synthesize(result.reading, result.chart.gender as Gender);
  const topics = plainTopicBriefs({
    reading: result.reading, areas, agreement, brief: briefing,
    zone: result.chart.timezone || "UTC",
    inSeason: (topic) => areaSeason(topic, result.utc, lifeAt).inSeason,
  });
  const schoolReadings = SCHOOLS.flatMap((school) =>
    expandedSchoolTopicBriefs(result, school, input, agreement));
  return {
    topics: topics.map((natal) => ({
      natal,
      schools: schoolReadings.filter((b) =>
        b.topic === natal.topic || (natal.topic === "family" && (b.topic === "father" || b.topic === "mother"))),
      prose: (natal.details ?? []).map((_, i) => readerPassage(natal.topic, natal.detailEvidence?.[i]?.ruleId, result.reading.findings)),
      malayalamWindows: Object.fromEntries(natal.windows.flatMap((w) => {
        const translated = malayalamTopicWindow(natal.topic, w, briefing, result.chart.timezone || "UTC");
        return translated ? [[w.id, translated]] : [];
      })),
    })),
    before: briefing.before,
    present: briefing.now.filter((row) => PRESENT_ROWS.has(row.id) && !!row.plainSummary),
    past: briefing.past,
  };
}
