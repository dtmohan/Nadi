/** Public presentation review, not an empirical test of astrological prediction. */
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { readerExperience } from "../shared/reader-experience";
import { translate } from "../shared/localization";
import { schoolTopicBasisPlain } from "../shared/school-topic-brief";
import type { Chart } from "../shared/schema";

type Case = Pick<Chart, "name" | "gender" | "birthDate" | "birthTime" | "timeStandard" | "timezone" | "place" | "latitude" | "longitude" | "deathDate"> & {
  birthSource: string; birthSourceNote: string; careerReference: string; careerSource: string;
  alternatives?: Array<{ label: string; birthTime?: string; timeStandard?: string }>;
};
const manifest = JSON.parse(readFileSync("research/reader-expansion/cases.json", "utf8")) as { selection: string; asOf: string; cases: Case[] };
Settings.now = () => Date.parse(manifest.asOf);
const chartDefaults = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [] } as const;

function review(c: Case, override: Partial<Chart> = {}) {
  const { alternatives, birthSource, birthSourceNote, careerReference, careerSource, ...birth } = c;
  const result = computeChart({ ...chartDefaults, ...birth, ...override } as Chart);
  const experience = readerExperience(result);
  const topics = experience.topics.map((t) => ({
    topic: t.natal.topic,
    nadi: (t.natal.details ?? []).map((text, i) => ({
      text, ruleId: t.natal.detailEvidence?.[i]?.ruleId ?? null,
      proseEn: t.prose[i]?.en ?? null, proseMl: t.prose[i]?.ml ?? null,
      existingTranslation: (() => { const theme = text.replace(/^(Father|Mother|Siblings|Family): /, ""); return translate("ml", theme) !== theme; })(),
    })),
    schools: t.visibleSchools.map((b, i) => ({ school: b.school, topic: b.topic, summary: b.summary,
      summaryMl: b.ml?.summary ?? null, context: t.schoolContexts[i],
      conditional: b.conditional, provisional: b.provisional,
      technicalTranslation: {
        explanationTotal: b.explanation?.length ?? 0,
        explanationMalayalam: b.explanation?.filter((_, j) => !!b.ml?.explanation?.[j]).length ?? 0,
        sourceTotal: b.details?.length ?? 0,
        sourceMalayalam: b.details?.filter((d) => !!b.ml?.details?.[d.id]).length ?? 0,
        untranslatedSources: b.details?.filter((d) => !b.ml?.details?.[d.id]).map((d) => ({ id: d.id, text: d.text })) ?? [],
        limitMalayalam: !!b.ml?.limit,
        basisMalayalam: schoolTopicBasisPlain(b) === b.basis && !!b.ml?.basis,
        untranslatedBasis: schoolTopicBasisPlain(b) === b.basis && b.ml?.basis ? null : schoolTopicBasisPlain(b),
      } })),
  }));
  return { birthTime: result.chart.birthTime, timeStandard: result.chart.timeStandard, ascendant: result.jaimini.lagna.sign,
    topics, present: experience.present.map((p) => ({ id: p.id, text: p.plainSummary?.text, ml: p.plainSummary?.ml?.text ?? null })) };
}

const cases = manifest.cases.map((c) => ({ name: c.name, birthSource: c.birthSource, birthSourceNote: c.birthSourceNote,
  careerReference: c.careerReference, careerSource: c.careerSource, primary: review(c),
  alternatives: c.alternatives?.map(({ label, ...override }) => ({ label, reading: review(c, override) })) ?? [] }));
process.stdout.write(JSON.stringify({ selection: manifest.selection, asOf: manifest.asOf, cases }, null, 2) + "\n");
