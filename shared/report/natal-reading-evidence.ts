import { SIGNS } from "../astro";
import type { KpNatalConditions, ParashariNatalConditions } from "../natal-reading-evidence";
import { manleyNatalSummaries } from "../manley-natal-summary";
import type { ReportPara } from "./types";

export function parashariNatalConditionsParas(items: ParashariNatalConditions[], source: number): ReportPara[] {
  const paras: ReportPara[] = [{ kind: "note", provisional: true, cites: [source], text: "Natal event foundations reuse the dated-check frames without choosing a period or event. They supplement the existing overview and do not automatically change its verdict. D1 and divisions use whole-sign houses and full aspects; applying the natal functional table to divisions is provisional. The named pair, node and house combinations overlap and do not establish an outcome." }];
  for (const topic of items) {
    if (topic.support) paras.push({ kind: "p", provisional: true, text: `${topic.subject}: D1 support ${topic.support.d1Support.join("; ") || "none listed"}; D1 strain ${topic.support.d1Strain.join("; ") || "none listed"}; ${topic.division} support ${topic.support.divisionSupport.join("; ") || "none listed"}; strain ${topic.support.divisionStrain.join("; ") || "none listed"}.` });
    if (topic.foundation) paras.push({ kind: "p", provisional: true, text: `Earlier partial D1/divisional screen: ${topic.foundation.d1.status}/${topic.foundation.divisionCheck.status}; it cannot exclude an event. Cross-chart lords and significators: ${topic.foundation.planets.map((p) => `${p.planet} (${p.roles.join(", ")}): D1 ${SIGNS[p.d1.sign]} house ${p.d1.house}, ${p.d1.dignity}; ${topic.division} ${SIGNS[p.division.sign]} house ${p.division.house}, ${p.division.dignity}`).join("; ")}.` });
    const specific = topic.specific;
    if (specific?.vivahSaham !== undefined) paras.push({ kind: "p", provisional: true, text: `Marriage timing target: Vivah Saham in ${SIGNS[specific.vivahSaham]}; Jupiter's transit requires a date.` });
    if (specific?.periodSet) paras.push({ kind: "p", provisional: true, text: `Natal timing set: ${specific.periodSet.map((x) => `${x.planet} (${x.reasons.join(", ")})`).join("; ")}. The running periods require a date.` });
    if (specific?.fifthFromJupiter) paras.push({ kind: "p", provisional: true, text: `Fifth-from-Jupiter lord ${specific.fifthFromJupiter.planet}: D1 ${SIGNS[specific.fifthFromJupiter.d1]}, D9 ${SIGNS[specific.fifthFromJupiter.d9]}.` });
    if (specific?.careerLords) paras.push({ kind: "p", provisional: true, text: `${specific.careerLords.label}: ${specific.careerLords.matched ? "listed connection" : "no listed connection"}; ${specific.careerLords.details.join("; ")}.` });
    for (const f of manleyNatalSummaries(topic)) {
      paras.push({ kind: "p", provisional: true,
        text: `${topic.subject}, ${f.chart} ${SIGNS[f.ascendant]} rising, house ${f.house}: named pair ${f.yoga.join("; ") || "none listed"}. Nodes: ${f.nodes.join("; ") || "none listed"}. House plus lord/karaka: ${f.combinations.join("; ") || "none listed"}.` });
      paras.push({ kind: "p", provisional: true, text: `${f.chart} planet lordships and links: ${f.planets.join(". ")}.` });
    }
    if (topic.educationFourth) {
      const links = topic.educationFourth.flatMap(({ planet, frame }) => {
        const values = [...frame.primary.house, ...frame.primary.houseLord];
        return values.length ? [`${planet}: ${values.join("; ")}`] : [];
      });
      paras.push({ kind: "p", provisional: true, text: `Separate D24 fourth-house education view: ${links.join("; ") || "none listed"}. This is not added to Manley's fifth-house comparison.` });
    }
  }
  return paras;
}

export function kpNatalConditionsParas(items: KpNatalConditions[], source: number): ReportPara[] {
  const rows = items.flatMap((e) => ([ ["Strict", e.strict?.layers], ["Mixed v2", e.mixed?.layers] ] as const).flatMap(([method, layers]) => (layers ?? []).map((l) => [
    e.label, method, l.role, l.planet, `${l.star.planet}: ${l.star.houses.join(", ") || "—"}`,
    `${l.sub.planet}: ${l.sub.houses.join(", ") || "—"}`, l.eligible ? l.status : `not counted (raw: ${l.status})`,
  ])));
  return [
    { kind: "note", provisional: true, cites: [source], text: "These are the natal cusp stages of the same KP dated-event checks. They supplement the existing overview and do not automatically change its verdict. They use four-step significators and the separately named strict and mixed Aurora research scripts; no period or event date is inferred. Mixed and unresolved stages do not deny an event." },
    { kind: "p", provisional: true, text: items.map((e) => `${e.label}: basic cusp ${e.basic.cusp}, sub lord ${e.basic.cuspSubLord}, matter-house links ${e.basic.signified.join(", ") || "none listed"}${e.basic.deniedAtCusp ? "; twelfth-from-cusp condition present" : ""}`).join(". ") + "." },
    { kind: "table", head: ["Matter", "Script", "Cusp stage", "Planet", "Star houses", "Sub houses", "Status"], rows },
  ];
}
