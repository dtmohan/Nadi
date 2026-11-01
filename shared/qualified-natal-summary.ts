import { SIGNS } from "./astro";
import type { KpNatalConditions, ParashariNatalConditions } from "./natal-reading-evidence";
import type { HierarchyNatalCheck } from "./parashari-hierarchy";

const title: Record<string, string> = { marriage: "Marriage", child: "Children", job: "Work", move: "Home", education: "Education" };

function partialHouse(label: string, check: HierarchyNatalCheck): string {
  const positive = check.support.length ? `support such as ${check.support[0]}` : "no listed support";
  const difficulty = check.strain.length ? `strain such as ${check.strain[0]}` : "no listed strain";
  return `${label} house ${check.house}: ${positive}; ${difficulty}`;
}

/** Render only existing natal facts. No dasha, transit, score or event outcome
 * is inferred. The same text is used in the chart and its report. */
export function parashariQualifiedSummary(topics: ParashariNatalConditions[]) {
  return topics.flatMap((topic) => {
    const f = topic.foundation;
    if (!f) return [];
    const lord = f.planets.find((p) => p.roles.includes("D1 house lord"));
    const lordText = lord ? `${lord.planet}, the D1 house lord, is in ${SIGNS[lord.d1.sign]} house ${lord.d1.house} in D1 and ${SIGNS[lord.division.sign]} house ${lord.division.house} in ${topic.division} (${lord.division.dignity === "other" ? "no listed sign dignity" : lord.division.dignity}).` : "";
    return [{ matter: topic.matter, label: title[topic.matter] ?? topic.subject,
      text: `${partialHouse("D1", f.d1)}. ${partialHouse(topic.division, f.divisionCheck)}. ${lordText}`.trim() }];
  });
}

/** A short natal cusp view, separate from the experimental period chain. */
export function kpQualifiedSummary(topics: KpNatalConditions[]) {
  return topics.filter((topic) => ["marriage", "child", "job"].includes(topic.matter)).map((topic) => {
    const b = topic.basic;
    const basic = b.signified.length
      ? `The ${b.cusp}th cusp sub-lord ${b.cuspSubLord} links to matter house${b.signified.length === 1 ? "" : "s"} ${b.signified.join(", ")}`
      : `The ${b.cusp}th cusp sub-lord ${b.cuspSubLord} has no listed matter-house link in this subset`;
    const strictStatus = topic.strict?.allCuspsSupported ? "supported" : "unresolved";
    const mixedStatus = topic.mixed?.allCuspsSupported ? topic.mixed.cautions ? "supported with caution" : "supported" : "unresolved";
    const scripts = topic.strict && topic.mixed
      ? ` The strict and mixed research scripts find the natal cusp stages ${strictStatus} and ${mixedStatus}, respectively.` : "";
    const caution = b.deniedAtCusp ? " The app's separate twelfth-from-cusp condition is present; this limited check does not prove denial." : "";
    return { matter: topic.matter, label: title[topic.matter] ?? topic.label, text: `${basic}.${caution}${scripts}` };
  });
}
