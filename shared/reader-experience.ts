/**
 * Inputs for the separate prose reader. This is a projection of the existing plain-reading
 * adapters: it does not infer a new verdict, combine schools, or change scores.
 */
import { agreementInput, computeAgreement } from "./agreement";
import { briefingFor, type BriefRow, type BeforeNote } from "./briefing";
import { areaSeason, lifeAsOf, mentionsHeldArea } from "./life-stage";
import type { Gender } from "./marriage";
import type { ChartResult } from "./schema";
import { defaultAlpForTopics, expandedSchoolTopicBriefs } from "./school-topics-expanded";
import { type BriefSchool, type SchoolTopicBrief } from "./school-topic-brief";
import { synthesize } from "./synthesis";
import { malayalamTopicWindow, plainTopicBriefs, type PlainTopicBrief } from "./topic-brief";
import { readerPassage } from "./reader-prose";
import { readerSchoolContext, type ReaderSchoolParagraph } from "./reader-school-prose";
import { natalPlanetContext } from "./planet-context";
import { computePrasna, computePrasnaFructification } from "./rules-prasna";
import { ordH } from "./house-gloss";

const SCHOOLS: readonly BriefSchool[] = ["parashari", "kp", "jaimini", "alp", "prasna"];
const PRESENT_ROWS = new Set(["pa-dasa", "nadi-jupiter-now", "nadi-saturn-now"]);

export interface ReaderTopic {
  natal: PlainTopicBrief;
  schools: SchoolTopicBrief[];
  /** The selected briefs with age-held subject passages removed for display. */
  visibleSchools: SchoolTopicBrief[];
  /** Reviewed prose in the same order as the selected themes; absent means use the original. */
  prose: Array<{ en: string; ml: string } | undefined>;
  /** Explanations of each selected school's own chart frame, in the same order as schools. */
  schoolContexts: ReaderSchoolParagraph[][];
  nadiContext?: { en: string; ml: string };
  malayalamWindows: Record<string, { when: string; statement: string; reason: string }>;
}
export interface ReaderExperience {
  topics: ReaderTopic[];
  before: BeforeNote[];
  present: BriefRow[];
  past: boolean;
}

/** A shared house or karaka can name an area that is held back for a young reader. */
function ageSafeSchool(b: SchoolTopicBrief, held: (topic: "career" | "wealth" | "marriage" | "children") => boolean): SchoolTopicBrief {
  const allowed = (text: string) => !mentionsHeldArea(text, held);
  const explanation = (b.explanation ?? []).flatMap((text, index) => allowed(text) ? [{ text, ml: b.ml?.explanation?.[index] }] : []);
  const details = b.details?.filter((d) => allowed(d.text));
  const summaryHeld = !allowed(b.summary);
  const basisHeld = !allowed(b.basis);
  const limitHeld = !allowed(b.limit);
  return {
    ...b,
    summary: summaryHeld ? "This reading shares its chart area with other topics held back at this age." : b.summary,
    basis: basisHeld ? "Some source detail is held back at this age." : b.basis,
    limit: limitHeld ? "This is a traditional interpretation, not a guarantee of an event or outcome." : b.limit,
    explanation: explanation.map((e) => e.text),
    explanationHouses: b.explanationHouses?.filter((h) => allowed(h.meaning)),
    details,
    reason: b.reason && allowed(b.reason) ? b.reason : undefined,
    ml: { ...b.ml,
      summary: summaryHeld ? "ഈ വായനയിലെ ജാതകമേഖല, ഈ പ്രായത്തിൽ പിന്നീട് കാണുന്നതിനായി മാറ്റിവച്ച മറ്റു വിഷയങ്ങളുമായും പങ്കിടുന്നു." : b.ml?.summary,
      basis: basisHeld ? "ചില ഉറവിടവിശദാംശങ്ങൾ ഈ പ്രായത്തിൽ പിന്നീട് കാണുന്നതിനായി മാറ്റിവച്ചിരിക്കുന്നു." : b.ml?.basis,
      limit: limitHeld ? "ഇത് ഒരു പരമ്പരാഗത വ്യാഖ്യാനമാണ്; സംഭവമോ ഫലമോ ഉറപ്പിക്കുന്നില്ല." : b.ml?.limit,
      explanation: explanation.map((e) => e.ml),
      reason: b.reason && allowed(b.reason) ? b.ml?.reason : undefined },
  };
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
    inSeason: (topic) => areaSeason(topic, result.utc, lifeAt, result.chart).inSeason,
  });
  const alp = defaultAlpForTopics(result, input.withheld);
  const prasna = { frame: "natal" as const, readings: computePrasna(natalPlanetContext(result), result.jaimini.lagna.signIndex),
    fructification: computePrasnaFructification(result.positions, result.reading.strength, result.jaimini.lagna.signIndex) };
  const schoolReadings = SCHOOLS.flatMap((school) =>
    expandedSchoolTopicBriefs(result, school, input, agreement, school === "alp" ? { alp } : school === "prasna" ? { prasna } : undefined));
  const held = (topic: "career" | "wealth" | "marriage" | "children") => !input.inSeason(topic);
  return {
    topics: topics.map((natal) => {
      const schools = schoolReadings.filter((b) =>
        b.topic === natal.topic || (natal.topic === "family" && (b.topic === "father" || b.topic === "mother"))),
        children = result.reading.children;
      const nadiContext = natal.topic === "children" && children.venusHouse >= 1 && children.venusHouse <= 12
        ? { en: `In this Nadi comparison, Venus is ${children.venusHouse === 1 ? "in the same sign as Jupiter" : `in the ${ordH(children.venusHouse)} sign counted from Jupiter`}. This is one chart relationship considered for the topic.`,
          ml: `ഈ നാഡി താരതമ്യത്തിൽ ശുക്രൻ ${children.venusHouse === 1 ? "വ്യാഴത്തിന്റെ അതേ രാശിയിലാണ്" : `വ്യാഴത്തിൽനിന്ന് ${children.venusHouse}-ാം രാശിയിലാണ്`}. ഈ വിഷയത്തിനായി പരിഗണിക്കുന്ന ഒരു ജാതകബന്ധമാണിത്.` } : undefined;
      return {
        natal, schools, visibleSchools: schools.map((b) => ageSafeSchool(b, held)), nadiContext,
        schoolContexts: schools.map((b) => readerSchoolContext(result, input, b, alp, prasna.readings)),
        prose: (natal.details ?? []).map((_, i) => {
          const passage = readerPassage(natal.topic, natal.detailEvidence?.[i]?.ruleId, result.reading.findings);
          return passage && !mentionsHeldArea(passage.en, held) ? passage : undefined;
        }),
        malayalamWindows: Object.fromEntries(natal.windows.flatMap((w) => {
        const translated = malayalamTopicWindow(natal.topic, w, briefing, result.chart.timezone || "UTC");
        return translated ? [[w.id, translated]] : [];
        })),
      };
    }),
    before: briefing.before,
    present: briefing.now.filter((row) => PRESENT_ROWS.has(row.id) && !!row.plainSummary),
    past: briefing.past,
  };
}
