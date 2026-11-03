import type { AlpEventEvidence } from "../alp-event-evidence";
import type { ReportPara } from "./types";
import { catalogueWording } from "./catalogue-wording";
import { alpMarriageParas } from "./alp-marriage-context";

export function alpEventParas(e: AlpEventEvidence | undefined, label: string,
  cite?: (source: string, url?: string) => number, plain = false): ReportPara[] {
  if (!e) return [];
  if (e.status !== "assessed") return [{ kind: "note", provisional: true, text: `${label}: ALP event context is ${e.status}.` }];
  const result: ReportPara[] = [{ kind: "note", provisional: true,
    text: `${label}: the ordinary default ALP evaluator was read at ${e.asOf}, the event's actual or assumed instant. The chart date picker uses local start of day and can differ at a boundary. These topic associations provide context, not an event score.` }];
  if (e.point) result.push({ kind: "p", provisional: true, text: `ALP ${e.point.sign}, ${e.point.nakshatra} pada ${e.point.pada}; Akshaya ${e.akshaya?.sign}, ${e.akshaya?.nakshatra} pada ${e.akshaya?.pada}; period ${e.akshaya?.dasa} / ${e.akshaya?.bhukti}.` });
  if (e.natalThreeWays && e.progressedThreeWays) {
    const source = "Akshaya Lagna Paddhati, vol. 2, ch. 17, pp. 137–141";
    result.push({ kind: "note", provisional: true, text: `The source's past/present/future groups are interpretive context, not a literal event-date gate.${cite ? "" : ` ${source}.`}`, ...(cite ? { cites: [cite(source)] } : {}) });
    for (const [label, ways] of [["Birth", e.natalThreeWays], ["Progressed", e.progressedThreeWays]] as const) result.push({ kind: "p", provisional: true, text: `${label}: ${ways.map((w) => `${w.label}: ${w.detail} (${w.group})`).join("; ")}.` });
  }
  result.push(...alpMarriageParas(e.marriage, cite));
  for (const { finding, topicMeaning } of e.findings) result.push({ kind: "p", provisional: true,
    text: `${topicMeaning} ${finding.text}`, ...(cite ? { cites: [cite(finding.source, finding.sourceUrl)] } : {}) });
  if (!e.findings.length) result.push({ kind: "p", provisional: true, text: "No reviewed topic finding matched at this instant; that does not decide the event." });
  return catalogueWording(result, plain);
}
