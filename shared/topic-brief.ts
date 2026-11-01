// A presentation of existing Nadi findings and briefing passages. This does not add or score
// astrological rules, predict an event, or combine the schools into a new verdict.
import type { TopicAgreement } from "./agreement";
import type { Briefing, BriefLink, BriefRow } from "./briefing";
import type { Reading } from "./rules";
import { gist, toneOf, type AreaSynthesis } from "./synthesis";
import { transitDay } from "./transit-date";

export type PlainTopic = "career" | "marriage";

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
  comparison?: string;
}

/** Summarize sensitive relationship claims without presenting them as facts about a partner. */
function marriageTheme(f: { text: string }): string {
  const source = gist(f.text).trim().replace(/[.!?]+$/, "");
  const concerns: string[] = [];
  if (/attachment outside|relationship outside|extra.?marital|unfaith|adulter|\baffair\b|\blover\b|more than one attachment/i.test(source))
    concerns.push("commitment or boundaries");
  if (/short[- ]temper|quarrel|sharp words|misunderstand|cold detachment|conflict/i.test(source))
    concerns.push("communication or conflict");
  if (/separat|divorc|estrang|often away/i.test(source))
    concerns.push("distance or time apart");
  if (/delay|\blate\b|obstacle/i.test(source))
    concerns.push("timing or delays");
  if (/\bdenial\b|\bdenied\b/i.test(source))
    concerns.push("whether marriage occurs");
  if (concerns.length) {
    const names = concerns.length === 1 ? concerns[0] : `${concerns.slice(0, -1).join(", ")} and ${concerns[concerns.length - 1]}`;
    return `One interpretation raises questions about ${names}; see the source finding for its wording.`;
  }
  // A technical afterthought can make an otherwise plain theme hard to understand;
  // its complete wording remains in the source finding.
  const plain = source.replace(/;\s*[^;]*\b(previous sign|next sign|nakshatra|star lord|sub[- ]lord|karaka)\b.*$/i, "");
  return plain ? `${plain.charAt(0).toUpperCase()}${plain.slice(1)}.` : "";
}

/** The natal wording is also used by the Nadi tab and its plain report/PDF. */
export function plainTopicNatal(topic: PlainTopic, area: AreaSynthesis | undefined, reading: Reading): PlainTopicNatal {
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
    statement: `The Nadi transit reading connects this passage to ${topic === "career" ? "work" : "marriage"}.`,
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
  return (["career", "marriage"] as const).filter(args.inSeason).map((topic) => {
    const area = args.areas.find((a) => a.area === topic);
    const natal = plainTopicNatal(topic, area, args.reading);
    const verdict = args.agreement.find((a) => a.topic === topic)?.verdict;
    const comparison = verdict && ["disagree", "mixed", "lean"].includes(verdict)
      ? "Other methods read this topic differently. Their findings remain separate in the comparison."
      : undefined;
    return {
      topic,
      hasArea: !!area,
      ...natal,
      comparison,
      windows: [...args.brief.now, ...args.brief.next]
        .map((row) => windowFor(topic, row, args.zone))
        .filter((row): row is PlainTopicWindow => !!row)
        .sort((a, b) => a.start.localeCompare(b.start)),
    };
  });
}
