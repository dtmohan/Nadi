/** A reader-facing projection of existing chart readings; no new rule or score is calculated. */
import type { ChartResult } from "./schema";
import { areaSeason, heldAreasAt, lifeAsOf, sensitiveGate, withholdText, mentionsHeldArea } from "./life-stage";
import { readerExperience } from "./reader-experience";
import { findingProvenance, findingQualifiers } from "./reading-rule-audit";
import type { PlainTopicWindow } from "./topic-brief";
import type { SchoolTopicBrief } from "./school-topic-brief";
import { workThemeMalayalam, workContrastMalayalam, workSourceMatchesSnapshot } from "./malayalam-work-journey";
import { translate } from "./localization";

export interface WorkTheme {
  id: string;
  text: { en: string; ml?: string };
  evidence: {
    ruleId: string;
    source?: string;
    en: string;
    ml: string;
    /** Omitted when the original text contains an age-held or withheld topic. */
    sourceText?: string;
    sourceTextMl?: string;
    planets: string[];
    provisional: boolean;
    timeSensitive: boolean;
    sourceUnverified: boolean;
    provenance: "source" | "mixed" | "extension" | "unresolved";
    testedQualifiers: string[];
    untestedQualifiers: string[];
  };
}

export interface WorkJourney {
  state: "available" | "held";
  /** Date of passing when recorded and in the past; otherwise the calculation date. */
  asOf: string;
  past: boolean;
  themes: WorkTheme[];
  /** Connections derived only where several selected source passages explicitly share a theme. */
  connections: Array<{ id: string; text: { en: string; ml: string }; themeIds: string[] }>;
  contrast?: string;
  contrastMl?: string;
  windows: PlainTopicWindow[];
  malayalamWindows: Record<string, { when: string; statement: string; reason: string }>;
  schools: SchoolTopicBrief[];
}

const CONNECTIONS = [
  { id: "technology", pattern: /\b(technolog\w*|technical|computing|computer|coding|software|engineering)\b/i,
    en: "More than one selected Nadi interpretation mentions technical or technology-related work.",
    ml: "തിരഞ്ഞെടുത്ത ഒന്നിലധികം നാഡി വ്യാഖ്യാനങ്ങൾ സാങ്കേതികമോ സാങ്കേതികവിദ്യയുമായി ബന്ധപ്പെട്ടതോ ആയ തൊഴിൽ പരാമർശിക്കുന്നു." },
  { id: "institutions", pattern: /\b(administration|administrative|government|institution\w*)\b/i,
    en: "More than one selected Nadi interpretation mentions institutions, government or administration.",
    ml: "തിരഞ്ഞെടുത്ത ഒന്നിലധികം നാഡി വ്യാഖ്യാനങ്ങൾ സ്ഥാപനങ്ങളെയോ സർക്കാരിനെയോ ഭരണനിർവഹണത്തെയോ പരാമർശിക്കുന്നു." },
  { id: "learning", pattern: /\b(teaching|scholarly|academic|education)\b/i,
    en: "More than one selected Nadi interpretation mentions teaching, education or scholarly work.",
    ml: "തിരഞ്ഞെടുത്ത ഒന്നിലധികം നാഡി വ്യാഖ്യാനങ്ങൾ അധ്യാപനമോ വിദ്യാഭ്യാസമോ വിജ്ഞാനാധിഷ്ഠിതമായ ജോലിയോ പരാമർശിക്കുന്നു." },
  { id: "international", pattern: /\b(international|foreign|overseas|abroad)\b/i,
    en: "More than one selected Nadi interpretation mentions an international or foreign connection to work.",
    ml: "തിരഞ്ഞെടുത്ത ഒന്നിലധികം നാഡി വ്യാഖ്യാനങ്ങൾ തൊഴിലുമായി ബന്ധപ്പെട്ട വിദേശമോ അന്താരാഷ്ട്രമോ ആയ ബന്ധം പരാമർശിക്കുന്നു." },
] as const;

/** No negated or missing source is treated as a positive shared theme. */
export function workConnections(themes: readonly WorkTheme[]): WorkJourney["connections"] {
  return CONNECTIONS.flatMap(({ id, pattern, en, ml }) => {
    const matching = themes.filter((t) => pattern.test(t.text.en) && !!t.evidence.sourceText &&
      !/\b(no|not|never|without|rather than)\b/i.test(t.text.en) &&
      !/\b(if|unless|when|provided|subject to|except|only)\b/i.test(t.evidence.sourceText) &&
      !t.evidence.testedQualifiers.length && !t.evidence.untestedQualifiers.length);
    const distinct = new Set(matching.map((t) => t.evidence.ruleId));
    return distinct.size >= 2 ? [{ id, text: { en, ml }, themeIds: matching.map((t) => t.id) }] : [];
  });
}

/**
 * The career section uses the exact same selection as the existing guided reader.
 * Array order is its presentation order, not a reliability or likelihood ranking.
 * Reviewed bilingual paraphrases require a matching source clause; missing Malayalam
 * stays undefined so a caller can visibly label an English fallback.
 */
export function buildWorkJourney(result: ChartResult): WorkJourney {
  const asOf = lifeAsOf(result.chart, result.now.asOf);
  const past = asOf !== result.now.asOf;
  const base: WorkJourney = { state: "held", asOf, past, themes: [], connections: [], windows: [], malayalamWindows: {}, schools: [] };
  if (!areaSeason("career", result.utc, asOf, result.chart).inSeason) return base;

  const experience = readerExperience(result);
  const topic = experience.topics.find((item) => item.natal.topic === "career");
  if (!topic) return { ...base, state: "available" };
  const held = heldAreasAt(result.utc, asOf, result.chart);
  const withheld = sensitiveGate(result.chart, result.utc, asOf).withheld;
  const themes = (topic.natal.details ?? []).flatMap((detail, i): WorkTheme[] => {
    const context = topic.natal.detailEvidence?.[i];
    if (!context) return [];
    // Rule ids are ordinarily unique, but do not attach a guessed source if they are not.
    const matches = result.reading.findings.filter((f) => f.area === "career" && f.ruleId === context.ruleId);
    if (matches.length !== 1) return [];
    const finding = matches[0];
    // A matched clause is not enough: a source may have gained a condition elsewhere.
    // Keep the reviewed interpretation only while its full source still matches.
    const sourceReviewed = !!finding && workSourceMatchesSnapshot(finding.ruleId, finding.text);
    const passage = sourceReviewed ? topic.prose[i] : undefined;
    const safeOriginal = finding && !mentionsHeldArea(finding.text, held) && !(withheld && withholdText(finding.text));
    const qualifiers = finding && safeOriginal ? findingQualifiers(finding, result.positions) : { tested: [], untested: [] };
    // Unknown or changed source wording can contain a qualification the extracted
    // short theme omits. Show the complete source when safe; otherwise withhold it.
    if (!sourceReviewed && !safeOriginal) return [];
    const textEn = !sourceReviewed ? finding.text : passage?.en ?? detail;
    const textMl = finding ? workThemeMalayalam(finding.ruleId, finding.text, textEn) : undefined;
    const translatedSource = safeOriginal ? translate("ml", finding.text) : undefined;
    return [{
      id: `${context.ruleId}-${i}`,
      text: { en: textEn, ml: textMl },
      evidence: {
        ruleId: context.ruleId, source: context.source, en: context.text, ml: context.textMl,
        sourceText: safeOriginal ? finding.text : undefined,
        sourceTextMl: translatedSource && translatedSource !== finding?.text ? translatedSource : undefined,
        planets: finding?.planets ?? [], provisional: context.provisional,
        timeSensitive: context.timeSensitive, sourceUnverified: context.sourceUnverified,
        provenance: finding ? findingProvenance(finding, result.reading.relations) : "unresolved",
        testedQualifiers: qualifiers.tested, untestedQualifiers: qualifiers.untested,
      },
    }];
  });
  // Editorial passages can occur in any position after chart-based selection.
  // Do not begin the reading with a reference to a previous passage that is not there.
  if (themes[0]) {
    const first = themes[0];
    first.text.en = first.text.en
      .replace(/^A further rule\b/, "One rule")
      .replace(/^Another source\b/, "One source")
      .replace(/^Another interpretation\b/, "One interpretation")
      .replace(/^Another rule\b/, "One rule")
      .replace(/^Another\b/, "One interpretation")
      .replace(/^A different association\b/, "One association")
      .replace(/^A separate rule\b/, "One rule");
    if (first.text.ml) first.text.ml = first.text.ml.replace(/^(മറ്റൊരു|വേറൊരു)/, "ഒരു");
  }
  // The reviewed t-ju-sa-ke paraphrase already contains every element of this
  // exact secondary clause (break, return, or a late spiritual turn). Suppress
  // only this fully reviewed duplication; any changed source or wording stays.
  const duplicateContrast = topic.natal.contrast === "Another part of a selected rule mentions a career with a break and a return, or a late spiritual turn." &&
    themes.some((theme) => theme.evidence.ruleId === "t-ju-sa-ke" &&
      theme.text.en === "One source describes technical or research work and also raises the possibility of a break followed by a return, or a later spiritual turn." &&
      !!theme.evidence.sourceText && workSourceMatchesSnapshot(theme.evidence.ruleId, theme.evidence.sourceText));
  const contrastPrefix = "Another part of a selected rule mentions ";
  const contrastClause = topic.natal.contrast?.startsWith(contrastPrefix)
    ? topic.natal.contrast.slice(contrastPrefix.length).replace(/[.]$/, "").toLowerCase() : undefined;
  // A secondary clause may have come from a finding we had to withhold. It is
  // shown only when an attached, age-safe source actually contains that clause.
  const contrastIsTraceable = !!contrastClause && themes.some((theme) =>
    theme.evidence.sourceText?.toLowerCase().includes(contrastClause));
  const contrast = !duplicateContrast && contrastIsTraceable ? topic.natal.contrast : undefined;
  return {
    state: "available", asOf, past, themes, connections: workConnections(themes),
    contrast,
    contrastMl: contrast ? workContrastMalayalam(contrast) : undefined,
    windows: topic.natal.windows,
    malayalamWindows: topic.malayalamWindows,
    schools: topic.visibleSchools,
  };
}
