import { describeEventMoment, matterOf } from "../events";
import { EVENT_TRANSIT_SCOPE } from "../transit-context";
import { stagedObservation } from "../parashari-comparison";
import { PARASHARI_VARGA_SOURCE } from "../parashari-varga-evidence";
import { MANLEY_SOURCE, RAO_EDUCATION_SOURCE } from "../manley-evidence";
import { FUNCTIONAL_SOURCE } from "../parashari-functional";
import { RAO_SOURCE } from "../jaimini-areas";
import { KP_TRANSIT_EVIDENCE_SOURCE } from "../kp-transit-evidence";
import { AURORA_SOURCE } from "../kp-aurora";
import { auroraEvidenceParas, auroraV2EvidenceParas } from "./kp-aurora";
import { AURORA_V2_SOURCE } from "../kp-aurora-v2";
import { manleyEvidenceParas } from "./manley-evidence";
import { hierarchyParas } from "./parashari-hierarchy";
import { parashariEvidenceParas } from "./parashari-varga-evidence";
import { transitEvidenceTable } from "./kp-transit-evidence";
import { moonTransitParas } from "./moon-transit";
import type { ReportContext, ReportPara, ReportSection } from "./types";
import { kpCatalogueParas } from "./kp-catalogue-evidence";
import { parashariCatalogueParas } from "./parashari-catalogue-evidence";
import { additionalSchoolParas } from "./additional-school-event-evidence";
import { alpEventParas } from "./alp-event-evidence";
import { qualifiedScoreParas } from "./qualified-event-scores";

/** The chart tab's chosen date, recomputed by the same one-event evaluator for the export. */
export function topicReadingSection(ctx: ReportContext, system: string): ReportSection | undefined {
  if (!["kp", "parashari", "jaimini", "bnn", "alp", "prasna"].includes(system)) return undefined;
  const e = ctx.tools.topicReadings?.[system as "kp" | "parashari" | "jaimini" | "bnn" | "alp" | "prasna"];
  if (!e) return undefined;
  const { cites, S } = ctx;
  const paras: ReportPara[] = [{ kind: "note", provisional: true,
    text: `${e.label} · ${e.date} · ${describeEventMoment(e, ctx.result.chart.timezone)}. This chosen-date reading applies the same conditions as Validate. It does not claim that an event occurred or predict that it will occur.` }];
  paras.push({ kind: "note", text: EVENT_TRANSIT_SCOPE });
  paras.push(...qualifiedScoreParas(e.qualifiedScores, `${e.label} · ${e.date}`, (source, url) => cites.add(source, url), system));
  if (system === "bnn" || system === "jaimini") paras.push(...additionalSchoolParas(e.additionalNatal, e.label, (source, url) => cites.add(source, url), system, ctx.plain));
  if (system === "prasna") paras.push(...additionalSchoolParas(e.additionalNatal, e.label, (source, url) => cites.add(source, url), "prasna", ctx.plain));
  if (system === "alp") paras.push(...alpEventParas(e.alp, e.label, (source, url) => cites.add(source, url), ctx.plain));
  if (system === "parashari") {
    paras.push(...parashariCatalogueParas(e.parashariOrdinary, e.label, (source, url) => cites.add(source, url), ctx.plain));
    if (e.parashariVargas) {
      paras.push({ kind: "note", text: "The natal and divisional frames below use whole-sign houses and the chart's selected ayanamsa.",
        cites: [cites.add(PARASHARI_VARGA_SOURCE.label, PARASHARI_VARGA_SOURCE.url)], provisional: true });
      paras.push(...parashariEvidenceParas(e.parashariVargas));
    }
    if (e.parashariPromise) {
      const p = e.parashariPromise;
      paras.push({ kind: "p", text: `Version 1: ${p.score}/${p.max} partial rule matches. Natal D1 support: ${p.d1Support.join("; ") || "none found"}; D1 strain: ${p.d1Strain.join("; ") || "none found"}; ${p.division} support: ${p.divisionSupport.join("; ") || "none found"}; divisional strain: ${p.divisionStrain.join("; ") || "none found"}. ${p.periods.map((x) => `${x.level} ${x.planet}: ${x.links.join("; ") || "no listed house link"}`).join(". ")}. Double transit: ${p.doubleTransitTargets.join("; ") || "no shared target"}.`, provisional: true });
    }
    for (const p of [e.parashariSpecific, e.parashariDivisional]) if (p) {
      const source = p.matter === "marriage"
        ? cites.add("K.N. Rao-guided Astrology and Timing of Marriage, ch. 2", "https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008")
        : p.matter === "child"
          ? cites.add("Astrological Assessment of Timing of Childbirth, §§2.6–2.7", "https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf")
          : cites.add("Vishnu Bhaskar, Advanced Techniques of Predictive Astrology, vol. 1 pp. 23–24", "https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html");
      paras.push({ kind: "p", text: `Version ${p.version}: ${p.score}/${p.max} partial rule matches. ${p.factors.map((f) => `${f.label}: ${f.matched ? "match" : "no match"} (${f.details.join("; ") || "none found"})`).join(". ")}. D1 strain: ${p.d1Strain.join("; ") || "none found"}; ${p.division} strain: ${p.divisionStrain.join("; ") || "none found"}. Equal points are an app convention.`,
        cites: [source, ...(p.version === 3 ? [cites.add(MANLEY_SOURCE.label)] : [])], provisional: true });
    }
    const stage = stagedObservation(e.manley);
    if (stage) paras.push({ kind: "note", provisional: true,
      text: `Earlier divisional-only staged experiment: earlier lords ${stage.first ? "both found" : "unresolved"}; third lord ${stage.first ? (stage.third ? "a link was found" : "unresolved") : "not counted because the earlier stage is unresolved"}. It does not require D1 or assess outcome or transits.` });
    if (e.parashariHierarchy) paras.push(...hierarchyParas(e.parashariHierarchy));
    if (e.manley) paras.push(...manleyEvidenceParas(e.manley, cites.add(MANLEY_SOURCE.label),
      e.manley.educationFourth ? cites.add(RAO_EDUCATION_SOURCE.label, RAO_EDUCATION_SOURCE.url) : undefined,
      cites.add(FUNCTIONAL_SOURCE.label, FUNCTIONAL_SOURCE.url)));
  } else if (system === "kp") {
    const k = e.kp;
    paras.push(...kpCatalogueParas(k.natalRules, e.label, (source, url) => cites.add(source, url), ctx.plain));
    paras.push({ kind: "p", text: `Matter houses ${e.houses.join(", ")}; cusp ${e.cusp} sub lord ${k.cuspSubLord} signifies ${k.cuspSignified.join(", ") || "none of them"}. ${(["dasa", "bhukti", "antara"] as const).map((level, i) => `${level} ${k[level]}: ${k.signified[i].join(", ") || "no selected house"}`).join("; ")}. Period-lord transit points: ${k.transit.score}/${k.transit.max}. This uses Validate's four-step event check; the broader sky is descriptive.`,
      cites: [cites.add("Astro Secrets & KP, Part 1 pp. 167–172; Part 2 p. 203 (uploaded PDFs)")], provisional: true });
    paras.push({ kind: "p", text: `${(["dasa", "bhukti", "antara"] as const).map((level, i) => `${level} ${k[level]} cusp filter: ${k.filtered[i].map((f) => `house ${f.house} via ${f.cuspSubLord}: ${f.denied ? "denied" : f.kept ? "kept" : "directed elsewhere"}`).join("; ") || "no selected house"}`).join(". ")}. ${(["dasa", "bhukti"] as const).map((level) => { const t = k.transit[level]; return `${level} ${t.planet} transits the sign, star and sub of ${t.signLord}, ${t.starLord}, ${t.subLord}; selected-house links ${t.hits.map((hit) => hit ? "yes" : "no").join(" / ")}`; }).join(". ")}.`, provisional: true });
    paras.push({ kind: "p", text: `${k.deniedAtCusp ? "The app's twelfth-from-cusp condition is present; this limited filter does not establish denial. " : ""}Event-day Sun / Moon links to a running period lord: ${k.transit.luminary.sun ? "yes" : "no"} / ${k.transit.luminary.moon ? "yes" : "no"}. These links are descriptive and do not change the score.`, provisional: true });
    if (k.aurora) paras.push(...auroraEvidenceParas(k.aurora, `${e.label} · ${e.date}`, cites.add(AURORA_SOURCE)));
    if (k.auroraV2) paras.push(...auroraV2EvidenceParas(k.auroraV2, `${e.label} · ${e.date}`, cites.add(AURORA_V2_SOURCE)));
    if (k.transit.evidence) {
      paras.push({ kind: "note", text: "The appendix shows the broader sky against the natal frame; contacts within 1° use an app display convention.", cites: [cites.add(KP_TRANSIT_EVIDENCE_SOURCE.label, KP_TRANSIT_EVIDENCE_SOURCE.url)], provisional: true });
      paras.push(transitEvidenceTable(e.label, k.transit.evidence));
    }
  } else if (system === "jaimini") {
    paras.push(e.jaimini ? { kind: "p", text: `The app maps this matter to Jaimini's ${e.jaimini.area} area. Chara main period ${e.jaimini.mdSignName}: ${S(e.jaimini.md.triggers.join("; ") || "no listed trigger")}. Subperiod ${e.jaimini.adSignName}: ${S(e.jaimini.ad.triggers.join("; ") || "no listed trigger")}. The broad mapping and count are app conventions, not an event-specific forecast.`,
      cites: [cites.add(RAO_SOURCE.label, RAO_SOURCE.url)], provisional: true }
      : { kind: "note", text: "No Jaimini event-area check is available for this matter and date in this reading." });
  } else if (system === "bnn") {
    const n = e.bnn;
    const finding = n.combination ? ctx.result.reading.findings.find((f) => f.text === n.combination) : undefined;
    paras.push({ kind: "p", text: `The app maps this matter to the Nadi ${matterOf(e.matter).bnn.area} area. Jupiter in ${n.jupiterSign}; Saturn in ${n.saturnSign}; matter significators ${n.karakas.join(", ")}. Jupiter contact: ${n.jupiter ? `${n.jupiter.contact} ${n.jupiter.planet}` : "none listed"}; Saturn contact: ${n.saturn ? `${n.saturn.contact} ${n.saturn.planet}` : "none listed"}; both contact the same significator: ${n.double ? "yes" : "no"}. Jupiter's count from natal Jeeva: ${n.fromJeeva}${n.fromDeha !== null ? `; from natal Deha: ${n.fromDeha}` : ""}; listed count match: ${n.progression ? "yes" : "no"}; partial timing points ${n.score}/${n.max}.${n.combination ? ` Related natal rule${finding ? ` ${finding.ruleId}` : ""}: ${S(n.combination)}` : ""} The mapping and combined count are app conventions, not a forecast.`, cites: [cites.add("R.G. Rao, Bhrigu Nandi Nadi"), cites.add("S. Naik, Prediction Secrets: Naadi Astrology"), ...(finding?.source ? [cites.add(finding.source)] : [])], provisional: true });
  }
  if (e.moonTransit) paras.push(...moonTransitParas(e.moonTransit, e.label, e.date,
    describeEventMoment(e, ctx.result.chart.timezone), cites.add("Phaladeepika 26.1–2", "https://www.siva.sh/phaladeepika/26/1")));
  return { id: `${system}-topic-reading`, title: `Matter and date · ${e.label}`, kicker: system.toUpperCase(), paras };
}
