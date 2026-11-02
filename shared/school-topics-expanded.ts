/** Plain topic views of existing, separately calculated school readings.
 * Mappings here are presentation metadata: they neither add rules nor award scores.
 * A new rule is not assigned to a topic until its wording and scope are reviewed.
 */
import { DateTime } from "luxon";
import { natalPlanetContext } from "./planet-context";
import type { ChartResult } from "./schema";
import type { AgreementInput, TopicAgreement } from "./agreement";
import { PLAIN_TOPIC_ORDER } from "./topic-brief";
import { type BriefSchool, type SchoolTopic, type SchoolTopicBrief, schoolTopicBriefs } from "./school-topic-brief";
import { computeAlp, DEFAULT_ALP_CONFIG, type AlpResult } from "./alp";
import { computePrasna, computePrasnaFructification, type PrasnaHouseReading, type PrasnaBhavaFructification } from "./rules-prasna";
import { HOUSE_AREAS_PLAIN, PRASNA_HOUSE_GLOSS, ordH } from "./house-gloss";
import { areaSeason, lifeAsOf, sensitiveGate, sensitiveTags } from "./life-stage";
import { computeKp, isConditional } from "./kp";
import { kpFindingPlain } from "./rules-kp";
import { soften } from "./gentle";

export const ALL_SCHOOL_TOPICS: SchoolTopic[] = [...PLAIN_TOPIC_ORDER, "father", "mother"];

// Each mapping reflects the named school's own entered house significations. A house may
// cover many matters: its overall judgement is never promoted to a topic-specific verdict.
const PAR_HOUSE: Record<SchoolTopic, number> = {
  self: 1, authority: 10, wealth: 2, education: 5, family: 2, health: 1, spirituality: 9, travel: 7,
  career: 10, marriage: 7, children: 5, father: 10, mother: 4,
};
const PM_HOUSE: Partial<Record<SchoolTopic, number>> = {
  self: 1, authority: 10, wealth: 2, education: 2, family: 4, health: 1, spirituality: 9,
  career: 10, marriage: 7, children: 5, father: 9, mother: 4,
};
// Exact existing KP topic labels, never a word search over rule prose. Each source's
// particular question remains visible; a finding is not generalized to the whole topic.
const KP_TOPICS: Partial<Record<SchoolTopic, string[]>> = {
  self: ["Mind", "Temperament"], authority: ["Standing", "Public life"],
  wealth: ["Finance", "Wealth", "Sources of income", "Gains", "Possessions", "Property"],
  education: ["Education", "Learning"], family: ["Family"], health: ["Health"],
  spirituality: ["Faith", "Practice"], travel: ["Travel", "Journeys", "Foreign lands"],
};
// These inherited labels include money/property or personal accusations rather than a
// general standing reading. Keep the original rules in KP, without attributing them here.
const KP_EXCLUDED: Partial<Record<SchoolTopic, string[]>> = {
  authority: ["kp5-debauch-cash", "kp5-debauch-property", "kp5-debauch-prestige"],
  education: ["kp9-astrologer", "kp9-astrology-genius", "kp9-astrology-false", "kp9-astrology-unconnected", "kp9-scientist", "kp10-astrologer-expert", "kp10-astrologer-popular", "kp10-instant-prediction"],
};

// Reviewed ALP rule IDs and what that *particular* rule says. Avoid assigning a whole
// house-effect sentence to every matter of its house or assuming other rules mean the same.
export const ALP_PLAIN_TOPIC_RULES: Record<string, Partial<Record<SchoolTopic, string>>> = {
  "alp-activated-6-10": { career: "This period rule raises work duties and possible obstacles." },
  "alp-activated-9": { career: "This period rule mentions stepping back from work or turning to teaching.", travel: "This period rule includes travel among several possible themes.", spirituality: "This period rule includes belief among several possible themes." },
  "alp2-nak-lord-7": { marriage: "The selected period rule highlights partnership and agreements." },
  "alp2-nak-lord-2-11": { wealth: "The selected period rule highlights money or property." },
  "alp2-nak-lord-10": { career: "The selected period rule highlights work or a possible employment change.", authority: "The selected period rule includes a possible change in standing." },
  "alp2-nak-lord-5": { children: "The selected period rule includes children among several themes." },
  "b2-alp-in-janma-1": { self: "The current progressed position highlights the person's own direction." },
  "b2-alp-in-janma-2": { family: "The current progressed position includes family among its themes.", wealth: "The current progressed position includes money among its themes.", education: "The current progressed position includes education among its themes." },
  "b2-alp-in-janma-3": { family: "The current progressed position includes siblings among its themes.", travel: "The current progressed position includes short journeys among its themes." },
  "b2-alp-in-janma-4": { family: "The current progressed position includes home and mother among its themes.", mother: "The current progressed position includes mother and home among its themes.", wealth: "The current progressed position includes property among its themes." },
  "b2-alp-in-janma-5": { children: "The current progressed position includes children among its themes.", self: "The current progressed position includes the mind and personal matters among its themes." },
  "b2-alp-in-janma-6": { career: "The current progressed position includes service among several themes." },
  "b2-alp-in-janma-7": { marriage: "The current progressed position includes spouse and partnership among its themes." },
  "b2-alp-in-janma-8": { wealth: "The current progressed position includes inheritance among several themes." },
  "b2-alp-in-janma-9": { father: "The current progressed position includes the father among its themes.", family: "The current progressed position includes the father among its themes.", spirituality: "The current progressed position includes belief among its themes." },
  "b2-alp-in-janma-10": { career: "The current progressed position includes profession among its themes.", authority: "The current progressed position includes standing among its themes." },
  "b2-alp-in-janma-11": { wealth: "The current progressed position includes gains among its themes.", family: "The current progressed position includes elder siblings among its themes." },
  "b2-alp-in-janma-12": { travel: "The current progressed position includes distant places among several themes." },
  "b2-marriage-navamsa-touches": { marriage: "One marriage-specific pada condition is present; it does not establish a complete natal promise." },
  "b2-marriage-navamsa-away": { marriage: "The selected marriage condition is not met in this pada. The cited example does not establish a universal exclusion, and this alone cannot rule marriage out." },
  "b2-12th-lord-in-4": { family: "One source interpretation concerns possible spending on the home or family.", mother: "One source interpretation concerns possible spending connected with the mother." },
  "b2-4th-lord-in-12": { wealth: "One source interpretation raises the possibility of giving up property." },
  "b2-10th-lord-dusthana": { career: "One source interpretation describes possible dissatisfaction or delay in work." },
  "b2c12-10th-lord-in-5": { career: "One source interpretation describes possible stagnation in work.", wealth: "One source interpretation also discusses a possible financial standstill." },
  "b2c12-10th-lord-in-2": { career: "One source interpretation regards work as supported in this period.", wealth: "The same source interpretation mentions support for income." },
  "b2c12-4th-lord-in-11": { family: "One source suggests care around home or family matters.", mother: "One source suggests care around matters connected with the mother.", wealth: "One source suggests care around home or property." },
  "b2c12-7th-lord-in-11": { marriage: "One source describes satisfaction through a partner or other people, with a qualification about distraction from work." },
  "b2c16-arp-in-10": { career: "One source associates this position with possible questions about profession." },
  "b1n-alp-lord-10": { career: "The class-note rule associates this decade with pressure around work and profession." },
  "b1n-alp-lord-12": { travel: "The class-note rule includes travel and foreign connections among several possible themes." },
  "b1n-nak-lord-10": { career: "The class-note rule associates this nakshatra stretch with pressure around work." },
  "b1n-nak-lord-12": { travel: "The class-note rule includes travel and foreign connections among several possible themes." },
  "ch17-3w-present-3": { authority: "The three-ways interpretation includes position and status among several themes." },
  "ch17-3w-all-three": { authority: "The three-ways interpretation includes public recognition among its themes." },
  "ch17-3w-present-2-future-1": { authority: "The three-ways interpretation includes standing and recognition among its themes.", wealth: "The same interpretation includes wealth among its themes." },
  "ch17-dasa-1-bhukti-9": { father: "The source links the native's and father's experiences in this period.", family: "The source links the native's and father's experiences in this period." },
};

const JAIMINI_AREA: Partial<Record<SchoolTopic, string>> = {
  self: "self", authority: "career", wealth: "wealth", education: "children", family: "family", health: "health",
};
const JAIMINI_SPECIFIC: Partial<Record<SchoolTopic, string[]>> = {
  education: ["jks-author", "jks-5th-venus", "jks-5th-jupiter", "jks-5th-mercury", "jks-5th-mars", "jks-5th-moon", "jks-5th-sun", "jks-5th-ketu"],
  spirituality: ["jks-12th-ketu", "jks-12th-deity"],
};

function safe(text: string, topic: SchoolTopic): string | undefined {
  if (!text || sensitiveTags(text).length || topic === "health" || topic === "children") return undefined;
  if (/\b(health|illness|disease|fertil|pregnan|surgery|injur|medical|death|dies|lifespan)\b/i.test(text)) return undefined;
  return soften(text);
}
function base(school: BriefSchool, topic: SchoolTopic): SchoolTopicBrief {
  return { school, topic, stance: "silent", summary: "", basis: "", limit: "These are traditional interpretations, not a guarantee of an event, its outcome or timing.", conditional: false, provisional: false };
}
function topicLimit(topic: SchoolTopic): string {
  if (topic === "health") return "Astrological indications cannot diagnose illness or assess medical risk.";
  if (topic === "children") return "These indications cannot determine fertility, whether or when someone has children, or family size.";
  if (topic === "father" || topic === "mother") return "This cannot establish a parent's health, personality or life events.";
  return "These are traditional interpretations, not a guarantee of an event, its outcome or timing.";
}

/** ALP's default is the snapshot's civil date in the chart's zone, capped at a recorded passing. */
export function defaultAlpDay(result: ChartResult): string {
  const lifeAt = lifeAsOf(result.chart, result.now.asOf);
  if (lifeAt !== result.now.asOf && result.chart.deathDate) return result.chart.deathDate;
  return DateTime.fromISO(lifeAt, { setZone: true }).setZone(result.chart.timezone).toISODate()!;
}

/** Match ALP's date picker: the date is interpreted at midnight in the chart's zone. */
export function defaultAlpForTopics(result: ChartResult, withheld: boolean, selectedDay?: string): AlpResult {
  const parsed = selectedDay && /^\d{4}-\d{2}-\d{2}$/.test(selectedDay) && DateTime.fromISO(selectedDay).isValid ? selectedDay : defaultAlpDay(result);
  const passing = lifeAsOf(result.chart, result.now.asOf) !== result.now.asOf ? result.chart.deathDate : null;
  const day = passing && parsed > passing ? passing : parsed < result.chart.birthDate ? result.chart.birthDate : parsed;
  const when = DateTime.fromISO(day, { zone: result.chart.timezone }).toISO()!;
  return computeAlp(natalPlanetContext(result), result.jaimini.lagna.lon, result.utc, when, DEFAULT_ALP_CONFIG, withheld || sensitiveGate(result.chart, result.utc, when).withheld);
}

export interface TopicBuildOptions {
  alp?: AlpResult;
  prasna?: { readings: PrasnaHouseReading[]; fructification?: PrasnaBhavaFructification[]; frame: "natal" | "question"; arudha?: string; asOf?: string };
}

export function expandedSchoolTopicBriefs(result: ChartResult, school: BriefSchool, input: AgreementInput, agreement: TopicAgreement[], options: TopicBuildOptions = {}): SchoolTopicBrief[] {
  const lifeAt = lifeAsOf(result.chart, result.now.asOf);
  const legacy = school === "parashari" || school === "kp" || school === "jaimini" ? schoolTopicBriefs(agreement, school) : [];
  const alp = school === "alp" ? options.alp ?? defaultAlpForTopics(result, input.withheld) : undefined;
  const topicAt = alp ? lifeAsOf(result.chart, alp.asOf) : lifeAt;
  const allowed = (topic: SchoolTopic) => areaSeason(topic, result.utc, topicAt).inSeason;
  const pm = school === "prasna" ? options.prasna ?? {
    frame: "natal" as const,
    readings: computePrasna(natalPlanetContext(result), result.jaimini.lagna.signIndex),
    fructification: computePrasnaFructification(result.positions, result.reading.strength, result.jaimini.lagna.signIndex),
  } : undefined;
  return ALL_SCHOOL_TOPICS.filter(allowed).flatMap((topic) => {
    const prior = legacy.find((b) => b.topic === topic);
    if (prior) return [{ ...prior, ...(school === "kp" ? { frame: "Birth chart · four-step KP comparison" } : {}), conditional: prior.conditional || (school === "kp" && (result.chart.timeUncertaintyMin ?? 0) > 0) }];
    // Legacy agreement intentionally suppresses some topics; never recreate a hidden row.
    if ((school === "parashari" || school === "kp" || school === "jaimini") && ["career", "marriage", "children", "father", "mother"].includes(topic)) return [];
    const b = base(school, topic);
    b.limit = topicLimit(topic);
    if (school === "parashari") {
      const house = PAR_HOUSE[topic];
      const h = input.parashari.houseProse?.find((p) => p.house === house);
      const canShowSharedHouse = house !== 5 || input.inSeason("children");
      b.detailHouse = canShowSharedHouse ? house : undefined;
      b.summary = `For this topic the reading refers to the ${ordH(house)} house, which also covers ${HOUSE_AREAS_PLAIN[house]}. ${!canShowSharedHouse ? "The shared house interpretation is held back at this age." : h ? "Its overall house interpretation is shown below." : "No house interpretation is available here."}`;
      const sentence = canShowSharedHouse && h ? safe(h.summaryPlain, topic) : undefined;
      b.basis = sentence ?? "See the full house reading; its several matters cannot be treated as one topic-specific verdict.";
      const part = canShowSharedHouse ? h?.parts.find((p) => p.key === "lord" && safe(p.textPlain, topic)) : undefined;
      if (part && part.sources[0]) b.details = [{ id: `house-${house}-lord`, text: `A house-level interpretation: ${safe(part.textPlain, topic)}`, source: part.sources[0].label, sourceUrl: part.sources[0].url }];
      b.provisional = true;
      b.reason = "The app's house-level assessment covers several matters and is not a separate verdict for this topic.";
      b.frame = "Birth chart";
    } else if (school === "kp") {
      const labels = KP_TOPICS[topic] ?? [];
      const matched = input.kp.findings.filter((f) => labels.includes(f.topic) && !(KP_EXCLUDED[topic] ?? []).includes(f.ruleId));
      const shown = matched.flatMap((f) => {
        const text = safe(kpFindingPlain(f), topic);
        return text ? [{ id: f.ruleId, text: `${f.standing === "note" ? "Secondary note, not the deciding result: " : ""}${text}`, source: f.source, sourceUrl: f.sourceUrl }] : [];
      });
      const named = Array.from(new Set(matched.map((f) => f.topic.toLowerCase())));
      b.summary = matched.length ? `The entered KP rules have ${matched.length} specific ${matched.length === 1 ? "interpretation" : "interpretations"} in this area${named.length ? `, including ${named.join(", ")}` : ""}. Each addresses its own question.` : "No entered topic-specific KP rule matched here; this is not a negative conclusion.";
      b.basis = `These examples retain their source's particular scope and the KP precedence of deciding and secondary findings.${shown.length > 4 ? " More interpretations remain in the full KP reading." : ""}`;
      b.details = shown.slice(0, 4);
      b.detailHouse = matched[0]?.cusp;
      b.conditional = (result.chart.timeUncertaintyMin ?? 0) > 0 || matched.some((f) => isConditional(input.kp.stability?.cusps.find((c) => c.house === f.cusp)));
      if (matched.some((f) => /^kp4-edu-(?:no-(?:11|9)|intermediate)$|^kp4-line-/.test(f.ruleId))) {
        b.provisional = true;
        b.reason = "The education checks shown here do not implement every sub-level and close-conjunction condition described in the source.";
      }
      const incomplete = matched.filter((f) => /^kp4-edu-(?:no-(?:11|9)|intermediate)$/.test(f.ruleId));
      if (incomplete.length) {
        const six = computeKp(result.kp, result.utc, lifeAt, true, input.withheld);
        const changed = incomplete.filter((f) => !six.findings.some((other) => other.ruleId === f.ruleId));
        if (changed.length) b.details.unshift({
          id: "kp-six-step-education-check",
          text: "The app's six-step significations add a house missing from the four-step check, so the cited education limitation no longer matches under that alternative. This is a sensitivity check, not a complete judgment; the source's other conditions still require review.",
          source: "KP class notes 3.1–3.2; Astro Secrets & KP Part 1, ch. 16, pp. 138–141",
        });
      }
      b.frame = "Birth chart · four-step KP comparison";
    } else if (school === "jaimini") {
      const area = JAIMINI_AREA[topic];
      const a = input.jaimini.find((x) => x.area === area);
      const findings = result.jaimini.findings.filter((f) => (JAIMINI_SPECIFIC[topic] ?? []).includes(f.id));
      b.detailArea = area ?? (topic === "spirituality" ? "self" : undefined);
      b.details = findings.flatMap((f) => { const text = safe(f.text, topic); return text ? [{ id: f.id, text, source: f.source.label, sourceUrl: f.source.url }] : []; }).slice(0, 3);
      if (topic === "education") b.summary = `The entered Jaimini reading places learning alongside children in a shared area${findings.length ? ` and has ${findings.length} learning-related source ${findings.length === 1 ? "finding" : "findings"}` : "; no selected learning-specific rule matched"}. The shared area's overall balance is not an education verdict.`;
      else if (topic === "spirituality") b.summary = findings.length ? "The entered Karakamsa rules include spiritual themes in this chart; the individual source interpretations are below." : "No selected spiritual-life rule matched. That is not a conclusion about your beliefs or practice.";
      else if (topic === "travel") b.summary = "The existing Jaimini area reading does not separate travel into its own general interpretation.";
      else if (a) b.summary = `The Jaimini reading examines ${a.label.toLowerCase()} as a shared area. Its indicators are not a separate verdict for every subject within it.`;
      else b.summary = "No separate general Jaimini reading is available for this topic.";
      const notes = a?.karakas.flatMap((k) => k.notes.map((n) => n.text)).concat(a.padas.flatMap((p) => p.notes.map((n) => n.text))) ?? [];
      b.basis = topic === "education" || topic === "authority" || topic === "health" ? "See the shared area and its original conditions; its combined notes need not describe this particular subject." : safe(notes[0] ?? "", topic) ?? "See the source area for its karakas, padas and individual conditions.";
      b.provisional = !!a;
      b.reason = "The area's balance and some karaka and pada interpretations are the app's provisional conventions.";
      b.frame = "Birth chart";
    } else if (school === "alp" && alp) {
      const date = DateTime.fromISO(alp.asOf, { setZone: true }).setZone(result.chart.timezone).toFormat("d LLL yyyy");
      const selected = alp.findings.flatMap((f) => { const text = ALP_PLAIN_TOPIC_RULES[f.ruleId]?.[topic]; return text ? [{ id: f.ruleId, text, source: f.source, sourceUrl: f.sourceUrl }] : []; });
      b.frame = `Progressed reading for ${date}`;
      b.summary = selected.length ? `${selected[0].text}${selected.length > 1 ? ` ${selected.length - 1} more selected ${selected.length === 2 ? "interpretation is" : "interpretations are"} available below.` : ""}` : `No reviewed, topic-specific ALP rule matched on ${date}. That does not rule the matter in or out.`;
      b.basis = "The selected finding comes from this date's progressed lagna and is not a natal or event-specific verdict.";
      b.details = selected;
      b.provisional = true;
      b.reason = "The ALP source coverage is partial; some entered rules come from class notes or worked examples.";
    } else if (school === "prasna" && pm) {
      const house = PM_HOUSE[topic];
      b.frame = pm.frame === "natal" ? "Birth-chart house reading" : `Question-chart sky snapshot${pm.asOf ? ` at ${pm.asOf}` : ""}${pm.arudha ? `; Arudha ${pm.arudha}` : ""}`;
      b.detailHouse = house;
      b.provisional = true;
      b.reason = "Planet classifications and the house-level strength mapping include app conventions.";
      if (!house) { b.summary = "No separate topic-specific interpretation is included in this house-based view."; b.basis = "The entered house significations do not supply a dedicated reading for this subject."; }
      else {
        const occupants = pm.readings.find((r) => r.house === house);
        const f = pm.fructification?.find((r) => r.house === house);
        b.summary = `The ${ordH(house)} house includes ${PRASNA_HOUSE_GLOSS[house]}. ${occupants ? "The selected chart has planets in this house." : "The selected chart has no planets in this house; its lord can still matter."}`;
        b.basis = f && topic !== "health" && topic !== "children" ? safe(f.notePlain, topic) ?? "See the house walk for the lord and karaka assessment." : "See the house walk for the individual source conditions. This house covers several matters.";
        b.details = [{ id: `prasna-house-${house}`, text: `This house covers ${PRASNA_HOUSE_GLOSS[house]}; see the house walk for the original conditions.`, source: `Prasna Marga, chapter XIV: house ${house} and ${f ? "verses 39–41" : "occupied-house effects"}` }];
        b.limit = `${topicLimit(topic)} A house-level assessment is not a verdict on this particular matter.`;
      }
    }
    return [b];
  });
}

/** Preserve the server's gate when it is present, including cached charts. */
export function topicWithheld(result: ChartResult): boolean {
  return result.sensitive?.withheld ?? sensitiveGate(result.chart, result.utc, result.now.asOf).withheld;
}
