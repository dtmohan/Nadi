/** A reader-facing projection of existing chart readings; no new rule or score is calculated. */
import type { ChartResult } from "./schema";
import { areaSeason, heldAreasAt, lifeAsOf, sensitiveGate, withholdText, mentionsHeldArea } from "./life-stage";
import { readerExperience } from "./reader-experience";
import { readerPassage } from "./reader-prose";
import { plainTopicNatal } from "./topic-brief";
import { bnnFindingContext } from "./chart-explanations";
import type { Finding, Reading } from "./rules";
import type { AreaSynthesis } from "./synthesis";
import { findingProvenance, findingQualifiers } from "./reading-rule-audit";
import type { PlainTopicWindow } from "./topic-brief";
import type { SchoolTopicBrief } from "./school-topic-brief";
import { workThemeMalayalam, workContrastMalayalam, workSourceMatchesSnapshot } from "./malayalam-work-journey";
import { translate } from "./localization";
import { buildWorkKarmajiva, type WorkKarmajiva } from "./work-karmajiva";

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
  /** Remaining separately worded findings, not omitted by planet-subset deduplication. */
  additionalThemes: WorkTheme[];
  /** Connections derived only where several selected source passages explicitly share a theme. */
  connections: Array<{ id: string; text: { en: string; ml: string }; themeIds: string[] }>;
  contrast?: string;
  contrastMl?: string;
  windows: PlainTopicWindow[];
  malayalamWindows: Record<string, { when: string; statement: string; reason: string }>;
  schools: SchoolTopicBrief[];
  /** Separate Brihat Jataka method; never folded into Nadi scores or selection. */
  karmajiva: WorkKarmajiva;
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

/**
 * An exact, one-sentence work effect in the simple Saturn-pair family can use
 * the existing plain adapter only when it retains every word of that effect.
 * The chart relationship remains attached as evidence. Multi-clause and
 * conditional effects need a reviewed paraphrase; they do not pass this gate.
 */
export function completeSimpleWorkTheme(finding: Finding, reading: Reading): string | undefined {
  if (!workSourceMatchesSnapshot(finding.ruleId, finding.text)) return undefined;
  const match = /^Karma with (?:Sun|Moon|Mars|Mercury|Jupiter|Venus|Rahu|Ketu):\s*(.+)$/i.exec(finding.text);
  const effect = match?.[1]?.trim();
  if (!effect || /[;!?]|\.(?=\s*\S)|\b(?:if|unless|when|only|provided|except|until|should)\b/i.test(effect)) return undefined;
  const single = { key: [finding], rest: [] } as unknown as AreaSynthesis;
  const plain = plainTopicNatal("career", single, reading).details?.[0];
  const normalized = (text: string) => text.toLowerCase().replace(/[.\s]+$/g, "").replace(/\s+/g, " ");
  return plain && normalized(plain) === normalized(effect) ? plain : undefined;
}

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
 * Retain the previously displayed eligible passages, then fill up to four
 * slots from other rule families. This avoids silently demoting a previous
 * source-backed lead merely to satisfy a presentation pattern. The old leads
 * and family mix use app conventions; neither is a vocational probability.
 */
export function selectWorkThemes(themes: readonly WorkTheme[], findings: readonly Finding[], previousRuleIds: readonly string[] = []): WorkTheme[] {
  const byId = new Map(findings.map((finding) => [finding.ruleId, finding]));
  const eligible = themes.filter((theme) => {
    const source = byId.get(theme.evidence.ruleId);
    return !!source && workSourceMatchesSnapshot(source.ruleId, source.text) &&
      (!!readerPassage("career", source.ruleId, [source]) ||
       theme.text.en === completeSimpleWorkTheme(source, { relations: [] } as unknown as Reading));
  });
  const hasId = (theme: WorkTheme, pattern: RegExp) => pattern.test(theme.evidence.ruleId);
  const families = [
    (t: WorkTheme) => hasId(t, /^sa-(?:su|mo|ma|me|ju|ve|ra|ke)$/),
    (t: WorkTheme) => hasId(t, /^t-/),
    (t: WorkTheme) => hasId(t, /^sa-(?:lord-|fire$|earth$|air$|water$)/),
    (t: WorkTheme) => hasId(t, /^(?:[a-z]+-(?:next|prev)-|f-ve-(?:next|prev)-)/),
  ];
  const chosen: WorkTheme[] = previousRuleIds.flatMap((ruleId) => {
    const candidate = eligible.find((theme) => theme.evidence.ruleId === ruleId);
    return candidate ? [candidate] : [];
  }).filter((theme, i, all) => all.indexOf(theme) === i).slice(0, 3);
  for (const family of families) {
    if (chosen.length >= 4) break;
    if (chosen.some(family)) continue;
    const first = eligible.find((theme) => !chosen.includes(theme) && family(theme));
    if (first) chosen.push(first);
  }
  const secondPair = eligible.find((theme) => !chosen.includes(theme) && families[0](theme));
  if (secondPair && chosen.length < 4) chosen.push(secondPair);
  // Sparse charts may have no reviewed line in those families: expose one
  // reviewed passage from the remaining eligible findings, never raw jargon.
  if (!chosen.length && eligible.length) chosen.push(eligible[0]);
  return chosen;
}

/**
 * Select from all fired career findings, not the general area's score-first top
 * three or planet-subset deduplication. Different rules involving the same planets
 * can describe different work. The featured sample retains previously displayed
 * eligible lines and adds family variety where possible; it is not a claim about
 * vocational likelihood or source priority.
 * The rest stay available with their individual source and conditions.
 */
export function buildWorkJourney(result: ChartResult): WorkJourney {
  const asOf = lifeAsOf(result.chart, result.now.asOf);
  const past = asOf !== result.now.asOf;
  const base: WorkJourney = { state: "held", asOf, past, themes: [], additionalThemes: [], connections: [], windows: [], malayalamWindows: {}, schools: [], karmajiva: buildWorkKarmajiva(result) };
  if (!areaSeason("career", result.utc, asOf, result.chart).inSeason) return base;

  const experience = readerExperience(result);
  const topic = experience.topics.find((item) => item.natal.topic === "career");
  if (!topic) return { ...base, state: "available" };
  const held = heldAreasAt(result.utc, asOf, result.chart);
  const withheld = sensitiveGate(result.chart, result.utc, asOf).withheld;
  const candidates = result.reading.findings.filter((f) => f.area === "career");
  const countById = new Map<string, number>();
  for (const finding of candidates) countById.set(finding.ruleId, (countById.get(finding.ruleId) ?? 0) + 1);
  const allThemes = candidates.flatMap((finding, i): WorkTheme[] => {
    // Do not attach a guessed source where the rule id is ambiguous.
    const matches = countById.get(finding.ruleId);
    if (matches !== 1) return [];
    const context = bnnFindingContext(finding, result.reading.relations);
    // A matched clause is not enough: a source may have gained a condition elsewhere.
    // Keep the reviewed interpretation only while its full source still matches.
    const sourceReviewed = !!finding && workSourceMatchesSnapshot(finding.ruleId, finding.text);
    const passage = sourceReviewed ? readerPassage("career", finding.ruleId, [finding]) : undefined;
    const simple = !passage ? completeSimpleWorkTheme(finding, result.reading) : undefined;
    const safeOriginal = finding && !mentionsHeldArea(finding.text, held) && !(withheld && withholdText(finding.text));
    const qualifiers = finding && safeOriginal ? findingQualifiers(finding, result.positions) : { tested: [], untested: [] };
    // Unknown or changed source wording can contain a qualification the extracted
    // short theme omits. Show the complete source when safe; otherwise withhold it.
    if (!sourceReviewed && !safeOriginal) return [];
    // Even a known source may contain important conditions in a later clause.
    // Use its whole safe text if no source-specific editorial passage exists.
    if (!passage && !safeOriginal) return [];
    const textEn = passage?.en ?? simple ?? finding.text;
    if (mentionsHeldArea(textEn, held) || (withheld && withholdText(textEn))) return [];
    const translatedSource = safeOriginal ? translate("ml", finding.text) : undefined;
    const textMl = workThemeMalayalam(finding.ruleId, finding.text, textEn) ??
      (textEn === finding.text && translatedSource !== finding.text ? translatedSource : undefined);
    return [{
      id: `${context.ruleId}-${i}`,
      text: { en: textEn, ml: textMl },
      evidence: {
        ruleId: context.ruleId, source: context.source, en: context.text, ml: context.textMl,
        sourceText: safeOriginal ? finding.text : undefined,
        sourceTextMl: translatedSource && translatedSource !== finding?.text ? translatedSource : undefined,
        planets: finding?.planets ?? [], provisional: context.provisional,
        timeSensitive: context.timeSensitive, sourceUnverified: !finding.source || context.sourceUnverified,
        // Only the explicitly documented adjacent-sign trio audit establishes
        // source/extension relation provenance. A book citation alone does not
        // establish that an individual condition was present in that text.
        provenance: finding.planets.length >= 3 && /adjacent-sign extension provisional/i.test(finding.source ?? "")
          ? findingProvenance(finding, result.reading.relations) : "unresolved",
        testedQualifiers: qualifiers.tested, untestedQualifiers: qualifiers.untested,
      },
    }];
  });
  const previousRuleIds = (topic.natal.detailEvidence ?? []).flatMap((e) => e ? [e.ruleId] : []);
  const themes = selectWorkThemes(allThemes, candidates, previousRuleIds);
  const featuredIds = new Set(themes.map((theme) => theme.id));
  const additionalThemes = allThemes.filter((theme) => !featuredIds.has(theme.id));
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
      theme.text.en === "One Nadi catalogue rule describes technical or research work and also raises the possibility of a break followed by a return, or a later spiritual turn." &&
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
    state: "available", asOf, past, themes, additionalThemes, connections: workConnections(themes),
    contrast,
    contrastMl: contrast ? workContrastMalayalam(contrast) : undefined,
    windows: topic.natal.windows,
    malayalamWindows: topic.malayalamWindows,
    schools: topic.visibleSchools,
    karmajiva: base.karmajiva,
  };
}
