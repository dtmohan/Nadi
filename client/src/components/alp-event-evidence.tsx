import React from "react";
import type { AlpEventEvidence } from "@shared/alp-event-evidence";
import { Cite } from "@/components/source-link";
import { Soft } from "@/lib/gentle";
import { AlpMarriageContextPanel } from "@/components/alp-marriage-context";

export function AlpEventEvidencePanel({ evidence }: { evidence?: AlpEventEvidence }) {
  if (!evidence) return null;
  if (evidence.status !== "assessed") return <p className="mt-1 text-muted-foreground">ALP context for this matter is {evidence.status === "withheld" ? "withheld by the reading policy" : evidence.status === "before-birth" ? "unavailable before birth" : "not yet mapped"}.</p>;
  return <details className="mt-2 rounded border px-2 py-2" data-testid="alp-event-evidence">
    <summary className="cursor-pointer font-medium">ALP · selected event instant · {evidence.findings.length} related findings</summary>
    <p className="mt-1 text-muted-foreground">The same default ALP evaluator as the chart tab is read at the event's instant, using its supplied or assumed time and zone. The tab's date picker uses the start of its selected day, so it can differ at a boundary. These topic associations are contextual and do not form an event score.</p>
    {evidence.point && <p>ALP: {evidence.point.sign}, {evidence.point.nakshatra} pada {evidence.point.pada}; Akshaya: {evidence.akshaya?.sign}, {evidence.akshaya?.nakshatra} pada {evidence.akshaya?.pada}; period {evidence.akshaya?.dasa} / {evidence.akshaya?.bhukti}.</p>}
    <AlpMarriageContextPanel context={evidence.marriage} />
    {evidence.findings.map(({ finding, topicMeaning }, i) => <p className="mt-1" key={`${finding.ruleId}-${i}`}><strong>{topicMeaning}</strong> <Soft>{finding.text}</Soft> · <Cite href={finding.sourceUrl}>{finding.source}</Cite></p>)}
    {!evidence.findings.length && <p className="mt-1">No reviewed topic finding matched at this instant; that does not decide the event.</p>}
  </details>;
}
