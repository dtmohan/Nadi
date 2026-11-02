// Plain summaries of the existing agreement adapters. These do not calculate a new verdict,
// merge schools, or infer a topic from keywords in unrelated rules.
import type { AgreementSystem, AgreementTopic, Stance, TopicAgreement } from "./agreement";

export type BriefSchool = Exclude<AgreementSystem, "bnn">;
export type SchoolTopic = Exclude<AgreementTopic, "lifespan">;

export const SCHOOL_TOPICS: SchoolTopic[] = ["career", "marriage", "children", "father", "mother"];
export const SCHOOL_TOPIC_LABEL: Record<SchoolTopic, string> = {
  career: "Career", marriage: "Marriage", children: "Children", father: "Father", mother: "Mother",
};
export const SCHOOL_NAME: Record<BriefSchool, string> = { parashari: "Parashari", kp: "KP", jaimini: "Jaimini" };

export interface SchoolTopicBrief {
  school: BriefSchool;
  topic: SchoolTopic;
  stance: Stance;
  summary: string;
  limit: string;
  basis: string;
  conditional: boolean;
  provisional: boolean;
  reason?: string;
}

/** Keep the traditional source text accessible in the school detail without making it a plain claim. */
export function schoolTopicBasisPlain(brief: SchoolTopicBrief): string {
  if (brief.topic === "children")
    return "The selected source interpretation concerns a traditional children-related combination. The original wording is in the practitioner reading; it cannot determine family size or an individual outcome.";
  if ((brief.topic === "father" || brief.topic === "mother") && /\bhealth\b|\billness\b|\bdisease\b|\bdies?\b|\bdeath\b|\blongevity\b/i.test(brief.basis))
    return "The selected source discusses a parent's circumstances. Its original wording is in the practitioner reading; it cannot assess a parent's health or lifespan.";
  return brief.basis;
}

const ABOUT: Record<SchoolTopic, string> = {
  career: "career and work", marriage: "marriage", children: "children and family",
  father: "the father", mother: "the mother",
};

/** The stance and evidence come directly from the named school's existing agreement voice. */
export function schoolTopicBriefs(agreement: TopicAgreement[], school: BriefSchool): SchoolTopicBrief[] {
  return SCHOOL_TOPICS.flatMap((topic) => {
    const voice = agreement.find((a) => a.topic === topic)?.stances.find((s) => s.system === school);
    // No agreement row also includes topics held by the age/sensitivity gates; do not recreate it.
    if (!voice) return [];
    const about = ABOUT[topic];
    const text: Record<Stance, string> = {
      supports: `The selected ${SCHOOL_NAME[school]} interpretations are supportive about ${about}.`,
      "leans-supports": `The selected ${SCHOOL_NAME[school]} interpretations lean supportive about ${about}, with qualifications.`,
      strains: `The selected ${SCHOOL_NAME[school]} interpretations emphasize cautions about ${about}.`,
      "leans-strains": `The selected ${SCHOOL_NAME[school]} interpretations lean cautionary about ${about}, with qualifications.`,
      mixed: `The selected ${SCHOOL_NAME[school]} interpretations give a mixed or inconclusive picture about ${about}.`,
      contested: `The selected ${SCHOOL_NAME[school]} interpretations disagree about ${about}; support and caution are both retained.`,
      silent: `The selected ${SCHOOL_NAME[school]} rules do not give a general conclusion about ${about} in this comparison. A more specific rule may still appear in that school's reading.`,
    };
    const limit = topic === "children"
      ? "These are traditional associations, not an assessment of fertility or a prediction of whether, when or how someone has children."
      : topic === "father" || topic === "mother"
        ? "This is a traditional interpretation; it cannot establish a parent's health, personality or life events."
        : "These are selected traditional interpretations, not a guarantee of an event, its outcome or its timing.";
    return [{
      school, topic, stance: voice.stance, summary: text[voice.stance], limit,
      basis: voice.note, conditional: /conditional/i.test(voice.word),
      provisional: voice.tier !== "sourced", reason: voice.reason,
    }];
  });
}
