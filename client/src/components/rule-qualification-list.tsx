import React from "react";
import { RULE_QUALIFICATIONS, type RuleQualification } from "@shared/rule-qualifications";
import { Cite } from "@/components/source-link";

/** A source-adapted subset and an app research convention are different
 * claims; neither label means that predictions have been validated. */
export function RuleQualificationList({ system }: { system: RuleQualification["system"] }) {
  const entries: readonly RuleQualification[] = RULE_QUALIFICATIONS.filter((rule) => rule.system === system);
  return <details className="nadi-info-disclosure mt-4" data-testid={`rule-qualifications-${system.toLowerCase()}`}>
    <summary className="nadi-info-summary">How the event rules are qualified · {entries.length} {entries.length === 1 ? "check" : "checks"}</summary>
    <p className="mt-2 text-muted-foreground">A source-adapted subset implements part of a cited method; a research convention adds Nadi's thresholds or synthesis. A birth-time diagnostic tests a candidate. These labels describe the rule, not proof that it predicts an event. Open a check for its inputs, limits and source.</p>
    <div className="mt-2 space-y-2">{entries.map((rule) => <details key={rule.id} className="nadi-info-disclosure" data-testid={`qualified-rule-${rule.id}`}>
      <summary className="nadi-info-summary">{rule.title}<span className="ml-2 text-xs font-normal text-muted-foreground">{rule.status}</span></summary>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p><strong>Needs:</strong> {rule.needs}.</p>
        <p><strong>Checks:</strong> {rule.checks}</p>
        <p><strong>Qualification:</strong> {rule.limits}</p>
        <p><Cite href={rule.source.url}>{rule.source.label}</Cite></p>
      </div>
    </details>)}</div>
  </details>;
}
