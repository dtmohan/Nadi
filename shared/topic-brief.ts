// A presentation of existing Nadi findings and briefing passages. This does not add or score
// astrological rules, predict an event, or combine the schools into a new verdict.
import type { TopicAgreement } from "./agreement";
import type { Briefing, BriefLink, BriefRow } from "./briefing";
import type { LifeArea, Reading } from "./rules";
import { gist, toneOf, type AreaSynthesis } from "./synthesis";
import { transitDay } from "./transit-date";
import { sensitiveTags } from "./life-stage";

export type PlainTopic = LifeArea;

/** These are presentation labels, not new rules or claims of coverage by another school. */
export const PLAIN_TOPIC_ORDER: PlainTopic[] = [
  "career", "marriage", "self", "authority", "children", "wealth", "education", "family", "health", "spirituality", "travel",
];

export const PLAIN_TOPIC_LABEL: Record<PlainTopic, string> = {
  career: "Career", marriage: "Marriage", self: "Self", authority: "Standing",
  children: "Children", wealth: "Money and assets", education: "Learning", family: "Parents and family",
  health: "Well-being", spirituality: "Spiritual life", travel: "Travel and living abroad",
};

const TOPIC_WORD: Record<PlainTopic, string> = {
  career: "work", marriage: "marriage", self: "personality and approach to life", authority: "standing and responsibility",
  children: "children and family", wealth: "money and assets", education: "learning", family: "parents and family",
  health: "well-being", spirituality: "spiritual life", travel: "travel and foreign ties",
};

export interface PlainTopicNatal {
  summary: string;
  detailIntro?: string;
  details?: string[];
  limit: string;
  contrast?: string;
}

export interface PlainTopicWindow {
  id: string;
  when: string;
  statement: string;
  reason: string;
  link: BriefLink;
  start: string;
  end: string;
}

export interface PlainTopicBrief extends PlainTopicNatal {
  topic: PlainTopic;
  hasArea: boolean;
  windows: PlainTopicWindow[];
  timingNote: string;
  comparison?: string;
}

/** Summarize sensitive relationship claims without presenting them as facts about a partner. */
function marriageTheme(f: { text: string }): string {
  const source = gist(f.text).trim().replace(/[.!?]+$/, "");
  const concerns: string[] = [];
  if (/attachment outside|relationship outside|extra.?marital|unfaith|adulter|\baffair\b|\blover\b|more than one attachment/i.test(source))
    concerns.push("commitment or boundaries");
  if (/short[- ]temper|quarrel|sharp words|misunderstand|cold detachment|conflict|hostility|unsettled married|must listen|\bdefers\b/i.test(source))
    concerns.push("communication or conflict");
  if (/separat|divorc|estrang|often away/i.test(source))
    concerns.push("distance or time apart");
  if (/delay|\blate\b|obstacle/i.test(source))
    concerns.push("timing or delays");
  if (/\bdenial\b|\bdenied\b/i.test(source))
    concerns.push("whether marriage occurs");
  if (/\bhealth\b|health[- ]troubled|\billness\b|\bdisease\b/i.test(source))
    concerns.push("a partner's circumstances, which the chart cannot assess medically");
  if (concerns.length) {
    const names = concerns.length === 1 ? concerns[0] : `${concerns.slice(0, -1).join(", ")} and ${concerns[concerns.length - 1]}`;
    return `One interpretation raises questions about ${names}; see the source finding for its wording.`;
  }
  // A technical afterthought can make an otherwise plain theme hard to understand;
  // its complete wording remains in the source finding.
  const plain = source.replace(/;\s*[^;]*\b(previous sign|next sign|nakshatra|star lord|sub[- ]lord|karaka)\b.*$/i, "");
  return plain ? `${plain.charAt(0).toUpperCase()}${plain.slice(1)}.` : "";
}

/** Show only what a selected source finding says, with technical clauses left in the source. */
function generalTheme(topic: PlainTopic, text: string): string | undefined {
  if (sensitiveTags(text).length) return undefined;
  let source = gist(text).replace(/\s*\(provisional\)\s*/gi, "").trim();
  // Some long technical prefixes exceed gist's cutoff; retain the interpretation after the colon.
  if (/\b(jupiter|saturn|venus|rahu|ketu|mars|mercury|karaka|nakshatra|star)\b/i.test(source.split(":")[0] ?? "") && source.includes(":"))
    source = source.slice(source.indexOf(":") + 1).trim();
  if (topic === "family" && /\bhealth\b|\billness\b|\bdisease\b/i.test(source))
    return "One interpretation discusses a parent's circumstances; it cannot assess a parent's health.";
  if (topic === "family" && /separat|estrang|\bdeath\b|\bloss\b/i.test(source))
    return "One interpretation mentions possible challenges affecting family matters; the source finding gives its context.";
  if (/past-life skill touch|foreign or unconventional matters express/i.test(source)) return undefined;
  let clause = source.split(/[.;]/)[0]?.trim();
  if (!clause || /\b(maraka|nakshatra|star lord|sub[- ]lord|karaka|dasa|bhukti|previous sign|rasi|house|jupiter|saturn|venus|rahu|ketu|mars|mercury)\b/i.test(clause)) return undefined;
  clause = clause.replace(/\bthe native's\b/gi, "your").replace(/\bthe native\b/gi, "the person").replace(/\bnative\b/gi, "person")
    .replace(/^a genuine spiritual guide appears$/i, "An interest in spiritual guidance")
    .replace(/^your fortune improves in a foreign land$/i, "Possible growth connected with a foreign place")
    .replace(/\bare in the grain of the life$/i, "may be recurring themes");
  clause = clause.replace(/\s*[—–-]\s*$/, "").replace(/[.!?]+$/, "");
  return clause ? `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.` : undefined;
}

function otherNatal(topic: Exclude<PlainTopic, "career" | "marriage">, area: AreaSynthesis | undefined, reading: Reading): PlainTopicNatal {
  if (topic === "family") {
    const findings = area ? [...area.key, ...area.rest] : [];
    const subjects: Array<[string, RegExp]> = [["Father", /\bfather\b/i], ["Mother", /\bmother\b/i],
      ["Siblings", /\b(sibling|siblings|brother|sister)\b/i], ["Family", /\b(parents|family|home)\b/i]];
    const details = subjects.flatMap(([label, pattern]) => {
      const finding = findings.find((f) => pattern.test(gist(f.text)) &&
        (label !== "Family" || !/\b(father|mother|sibling|siblings|brother|sister)\b/i.test(gist(f.text))) &&
        generalTheme("family", f.text));
      const theme = finding && generalTheme("family", finding.text);
      return theme ? [`${label}: ${theme}`] : [];
    });
    return { summary: findings.length ? "The selected Nadi rules discuss different family members separately."
      : "The selected Nadi rules do not provide a family interpretation here.", details,
      limit: "These are traditional possibilities in individual findings, not a combined verdict about your family." };
  }
  if (topic === "children") {
    const link = reading.children.promised;
    return {
      summary: link === "unsigned"
        ? "This Nadi check does not find its usual Jupiter–Venus connection for this topic. That does not rule out having children."
        : "This Nadi check finds a traditional connection between Jupiter and Venus that it associates with children and family.",
      limit: "This is a traditional association. It cannot determine fertility, pregnancy, the number or sex of children, or whether, when or how someone becomes a parent.",
    };
  }
  if (topic === "health") {
    const sourceText = (area?.key ?? []).map((f) => gist(f.text)).join(" ");
    const details = [
      /emotion|mood|feeling|mind|mental|nervous|stress|anxie/i.test(sourceText) ? "Emotions or mental well-being." : undefined,
      /\benergy\b|vitali|stamina|fatigue/i.test(sourceText) ? "Energy or vitality." : undefined,
      /\bhealth\b|\bbody\b|heart|kidney|liver|blood|eyes?|sight|hearing|hormone|skin|disease|illness|allerg|surg/i.test(sourceText) ? "Physical well-being." : undefined,
      /accident|mishap|injur|sharp edges|machines/i.test(sourceText) ? "Physical safety." : undefined,
    ].filter((d): d is string => !!d);
    return {
      summary: area?.key.length
        ? "The selected Nadi rules include interpretations about well-being. Their original wording is available in the source findings."
        : "The selected Nadi rules do not provide a well-being interpretation here.",
      detailIntro: details.length ? "The source interpretations mention these subjects:" : undefined,
      details,
      limit: "A birth chart cannot diagnose a condition, assess health risks or replace medical care.",
    };
  }
  const selected = (area?.key ?? []).slice(0, 3);
  const details = Array.from(new Set(selected.map((f) => generalTheme(topic, f.text)).filter((d): d is string => !!d)));
  const hasWithheldTheme = selected.some((f) => sensitiveTags(f.text).length);
  const all = area ? [...area.key, ...area.rest] : [];
  const good = all.some((f) => toneOf(f) === "good");
  const hard = all.some((f) => toneOf(f) === "hard");
  const contrast = good && hard
    ? "Other selected findings include both supportive and difficult themes; their details are in the Nadi reading."
    : hasWithheldTheme ? "A selected finding contains sensitive material and is available in the source reading." : undefined;
  const limit = topic === "wealth"
    ? "These are traditional interpretations, not a forecast of financial outcomes or a basis for financial decisions."
    : "These are traditional possibilities from selected rules, not established facts or a prediction of a specific event.";
  return {
    summary: details.length
      ? `The selected Nadi rules describe these possible themes about ${TOPIC_WORD[topic]}:`
      : `The selected Nadi rules do not give a clear plain-language theme about ${TOPIC_WORD[topic]} here.`,
    details,
    contrast,
    limit,
  };
}

/** The natal wording is also used by the Nadi tab and its plain report/PDF. */
export function plainTopicNatal(topic: PlainTopic, area: AreaSynthesis | undefined, reading: Reading): PlainTopicNatal {
  if (topic !== "career" && topic !== "marriage") return otherNatal(topic, area, reading);
  if (topic === "career") {
    const findings = area ? [...area.key.slice(0, area.careerAlternative ? 2 : 3), ...(area.careerAlternative ? [area.careerAlternative] : [])] : [];
    const details = findings.map((f) => {
      const clauses = gist(f.text).split(/[.;]/).map((s) => s.trim()).filter(Boolean);
      // Some combination rules start with a general trait before naming work. Prefer the
      // work clause, exactly as the rule describes it, without guessing a person's occupation.
      const clause = /\b(intellect|intelligence|personality|temperament)\b/i.test(clauses[0] ?? "") && clauses[1] ? clauses[1] : clauses[0];
      const plain = clause
        ?.replace(/^Livelihood takes the colour of .*? significations \(([^)]+)\)$/i, "Livelihood linked to $1")
        .replace(/^The native and the profession are bound together$/i, "Work and personal identity may be closely linked")
        .replace(/\bis the life's work$/i, "may be a work theme");
      return plain ? `${plain.charAt(0).toUpperCase()}${plain.slice(1)}.` : "";
    }).filter(Boolean);
    const difficult = findings.flatMap((f) => gist(f.text).split(/[.;]/).slice(1))
      .map((s) => s.trim())
      .find((s) => /\b(breaks?|restarts?|interrupt\w*|setbacks?|delay\w*|friction|loss\w*|unrecognised)\b/i.test(s));
    return {
      summary: details.length ? "The selected Nadi rules describe these possible work themes or experiences:" : "The Nadi rules selected here do not give a specific work theme.",
      details,
      contrast: difficult ? `Another part of a selected rule mentions ${difficult.charAt(0).toLowerCase()}${difficult.slice(1)}.` : undefined,
      limit: "These are alternative interpretations, not a prediction of a particular occupation, promotion or job change. The full reading shows the other findings.",
    };
  }

  const m = reading.marriage;
  const summary = m.promised === "absent"
    ? "This Nadi check does not find its usual direct or indirect link for marriage. That does not rule out a marriage or a relationship."
    : m.promised === "through-dispositor"
      ? "This Nadi check finds an indirect link between the planets it uses for you and a partner. It treats that as an indication related to marriage."
      : m.promised === "by-karma"
        ? "This Nadi check finds a link for marriage through Saturn. The method associates it with responsibility or possible delay."
        : "This Nadi check finds a direct link between the planets it uses for you and a partner. The method reads that as supportive of the possibility of marriage.";
  const findings = area ? [...area.key, ...area.rest, ...(area.careerAlternative ? [area.careerAlternative] : [])] : [];
  // Keep the selected source interpretations visible, including conflicting themes. The
  // introductory label and limit frame them as possibilities, not facts about a partner.
  const details = (area?.key ?? []).slice(0, 3).map(marriageTheme).filter(Boolean);
  const contrast = findings.some((f) => toneOf(f) === "good") && findings.some((f) => toneOf(f) === "hard")
    ? "Other Nadi findings describe both supportive and difficult relationship themes; their details are available in the Nadi reading."
    : undefined;
  return {
    summary,
    detailIntro: details.length ? "Other selected Nadi rules describe these possible relationship themes:" : undefined,
    details,
    limit: "This is a traditional indication, not a guarantee of marriage, its timing or the quality of a relationship.",
    contrast,
  };
}

const list = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
function windowFor(topic: PlainTopic, row: BriefRow, zone: string): PlainTopicWindow | undefined {
  if (row.system !== "Nadi" || !row.end || !row.tags.some((t) => t.area === topic && t.clause === 1)) return undefined;
  // The row and the attached topic come from readTransits, as in the ordinary Overview. These
  // are the app's selected passages, not an exhaustive search of all possible event periods.
  const planet = row.id.includes("jupiter") ? "Jupiter" : row.id.includes("saturn") ? "Saturn" : undefined;
  const touched = row.nadiPlanets?.[topic];
  if (!planet || !touched?.length) return undefined;
  return {
    id: row.id,
    when: `${transitDay(row.start, zone)} – ${transitDay(row.end, zone)}`,
    statement: `The Nadi transit reading connects this passage to ${TOPIC_WORD[topic]}.`,
    reason: `${planet}'s passage is read in relation to ${list(touched)} in the birth-chart findings selected for ${topic}.`,
    link: row.link,
    start: row.start,
    end: row.end,
  };
}

export function plainTopicBriefs(args: {
  reading: Reading;
  areas: AreaSynthesis[];
  agreement: TopicAgreement[];
  brief: Briefing;
  zone: string;
  inSeason: (topic: PlainTopic) => boolean;
}): PlainTopicBrief[] {
  return PLAIN_TOPIC_ORDER.filter(args.inSeason).map((topic) => {
    const area = args.areas.find((a) => a.area === topic);
    const natal = plainTopicNatal(topic, area, args.reading);
    const verdicts = args.agreement.filter((a) => a.topic === topic || (topic === "family" && (a.topic === "father" || a.topic === "mother"))).map((a) => a.verdict);
    const comparison = verdicts.some((verdict) => ["disagree", "mixed", "lean"].includes(verdict))
      ? "Other methods read this topic differently. Their findings remain separate in the comparison."
      : undefined;
    return {
      topic,
      hasArea: !!area,
      ...natal,
      comparison,
      windows: (topic === "health" ? [] : [...args.brief.now, ...args.brief.next])
        .map((row) => windowFor(topic, row, args.zone))
        .filter((row): row is PlainTopicWindow => !!row)
        .sort((a, b) => a.start.localeCompare(b.start)),
      timingNote: topic === "health"
        ? "Transit passages are not presented here as health forecasts."
        : "Dates use the birth-place time zone; transitions may occur during the displayed day. These selected passages are not predicted event dates. Topic selection is the app's convention.",
    };
  });
}
