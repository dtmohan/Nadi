/** Malayalam for the work journey, tied to the exact evaluated English finding.
 * Unknown or edited material returns undefined so the UI can label its English fallback.
 */
import { BNN_SOURCE_SNAPSHOT } from "./malayalam-bnn-snapshot";
import { MALAYALAM_BNN_THEMES } from "./malayalam-bnn-themes";
import { MALAYALAM_READER_THEMES } from "./malayalam-reader-themes";
import { plainTopicNatal } from "./topic-brief";
import { readerPassage } from "./reader-prose";
import { translate } from "./localization";
import type { Finding, Reading } from "./rules";
import type { AreaSynthesis } from "./synthesis";

const WORK_THEMES: Record<string, string> = {
  "Government, administration or a large institution.": "സർക്കാർ, ഭരണനിർവഹണം അല്ലെങ്കിൽ വലിയ സ്ഥാപനങ്ങളുമായി ബന്ധപ്പെട്ട തൊഴിൽ.",
  "Work and personal identity may be closely linked.": "തൊഴിലും വ്യക്തിയുടെ സ്വത്വബോധവും തമ്മിൽ അടുത്ത ബന്ധമുണ്ടാകാം.",
  "Profession linked to finance, arts, luxury goods, vehicles, hospitality or women-centred fields.": "ധനകാര്യം, കല, ആഡംബരവസ്തുക്കൾ, വാഹനങ്ങൾ, അതിഥിസേവനം അല്ലെങ്കിൽ സ്ത്രീകളെ കേന്ദ്രീകരിച്ച മേഖലകൾ എന്നിവയുമായി ബന്ധപ്പെട്ട തൊഴിൽ.",
};

/** Match the complete source, including later qualifiers, against the reviewed snapshot. */
export function workSourceMatchesSnapshot(ruleId: string, sourceFindingText: string): boolean {
  const snapshot = BNN_SOURCE_SNAPSHOT[ruleId];
  if (!snapshot) return false;
  const newerTrio = snapshot.replace(/ linked by sign \(not necessarily in the same sign\):/, " together:");
  return snapshot === sourceFindingText || newerTrio === sourceFindingText;
}

export function workThemeMalayalam(ruleId: string, sourceFindingText: string, plainThemeText: string): string | undefined {
  const finding: Finding = { ruleId, area: "career", text: sourceFindingText, score: 0, planets: [], relation: null, viaRetro: false };
  // Accept the specific trio prefix revision already used by the live rules; no
  // other change to the source or its interpretation silently reuses a translation.
  const editorial = readerPassage("career", ruleId, [finding]);
  const sourceMatches = workSourceMatchesSnapshot(ruleId, sourceFindingText);
  if (editorial && editorial.en === plainThemeText && sourceMatches) return editorial.ml;
  // Plain themes are translated only for an unmodified, reviewed source and the
  // exact theme that the existing career summarizer derives from that source.
  if (!sourceMatches) return undefined;
  // A broader selection can show a full source passage. Accept only an exact
  // catalogue match for that same source, never an edited or shortened clause.
  if (plainThemeText === sourceFindingText) {
    const translated = translate("ml", sourceFindingText);
    return translated !== sourceFindingText ? translated : undefined;
  }
  const area: AreaSynthesis = { area: "career", tone: "descriptive", headline: "", key: [finding], rest: [], coveredBy: {}, balance: 0, total: 0 };
  const derived = plainTopicNatal("career", area, { relations: [] } as unknown as Reading).details?.[0];
  if (derived !== plainThemeText) return undefined;
  return WORK_THEMES[plainThemeText] ?? MALAYALAM_BNN_THEMES[plainThemeText] ?? MALAYALAM_READER_THEMES[plainThemeText];
}

/** Exact reviewed contrast text; changed wording must remain in English until reviewed. */
export function workContrastMalayalam(english: string): string | undefined {
  return MALAYALAM_BNN_THEMES[english];
}

/** These fixed notes describe a source condition, not whether it is satisfied. */
export function workQualifierMalayalam(english: string): string | undefined {
  const notes: Record<string, string> = {
    "The source adds: unless Jupiter joins.": "വ്യാഴം കൂടിച്ചേരുന്നില്ലെങ്കിൽ എന്ന വ്യവസ്ഥയും ഉറവിടം നൽകുന്നു.",
    "The source adds a Jupiter-aspect qualifier.": "വ്യാഴത്തിന്റെ ദൃഷ്ടിയെക്കുറിച്ചുള്ള വ്യവസ്ഥയും ഉറവിടം നൽകുന്നു.",
    "The source adds: if the Moon is weak.": "ചന്ദ്രൻ ദുർബലമാണെങ്കിൽ എന്ന വ്യവസ്ഥയും ഉറവിടം നൽകുന്നു.",
  };
  return notes[english];
}
