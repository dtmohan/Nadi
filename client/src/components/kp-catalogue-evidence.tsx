import React from "react";
import { KP_CUSP_TRACE_SOURCE, kpCuspTraceText, type KpEventNatalRules } from "@shared/kp-event-natal-rules";
import { Cite } from "@/components/source-link";
import { Soft } from "@/lib/gentle";

/** The ordinary KP findings selected for this event; no new score is implied. */
export function KpCatalogueEvidence({ evidence }: { evidence?: KpEventNatalRules }) {
  if (!evidence) return null;
  if (evidence.status === "withheld") return <p className="mt-1 text-muted-foreground">The natal rule reading for this matter is not available at the native's reading age.</p>;
  if (evidence.status !== "assessed") return <p className="mt-1 text-muted-foreground">{evidence.status === "custom-event"
    ? "The selected cusp or houses differ from this matter's registered definition; ordinary event rules are not automatically assigned."
    : "Ordinary natal rules have not yet been qualified for this event."}</p>;
  const fired = evidence.rules.filter((rule) => rule.matched && rule.finding);
  const promise = evidence.rules.filter((rule) => rule.role === "promise");
  return <details className="nadi-info-disclosure mt-2" data-testid="kp-catalogue-event-evidence">
    <summary className="nadi-info-summary">Ordinary KP natal rules for this event · {fired.length} of {evidence.rules.length} registered conditions matched</summary>
    <p className="mt-1 text-muted-foreground">The same four-step chart rules are evaluated for this birth time. A condition that did not match is unresolved, not the opposite conclusion. These findings are traditional interpretations; they do not establish an outcome or change the experimental point total.</p>
    {(evidence.matter === "illness" || evidence.matter === "accident") && <p className="mt-1 text-muted-foreground">These interpretations cannot diagnose a condition, assess injury risk or determine an accident's severity.</p>}
    <p className="mt-1">Qualified promise clues: <strong>{evidence.indication.status}</strong>{evidence.indication.supports.length ? ` · supporting ${evidence.indication.supports.join(", ")}` : ""}{evidence.indication.strains.length ? ` · challenging ${evidence.indication.strains.join(", ")}` : ""}. Findings set aside by principal-cusp precedence remain visible as notes and do not determine this summary. This describes registered clues, not proof of an outcome.</p>
    {evidence.cuspTrace && <p className="mt-1" data-testid="kp-cusp-dispositor-trace">{kpCuspTraceText(evidence.cuspTrace)} · <Cite>{KP_CUSP_TRACE_SOURCE}</Cite></p>}
    {promise.length > 0 && <p className="mt-1">Registered promise conditions: {promise.map((rule) => `${rule.id} ${rule.matched ? "matched" : "not matched"}`).join(" · ")}.</p>}
    {fired.length ? fired.map((rule, i) => <p className="mt-1" key={`${rule.id}-${i}`}><strong>{rule.role} · {rule.id}:</strong> <Soft>{rule.finding!.text}</Soft> <span className="text-muted-foreground">({rule.finding!.evidence})</span> · <Cite href={rule.sourceUrl}>{rule.source}</Cite>{rule.finding!.standing && <> · {rule.finding!.standing}</>}</p>)
      : <p className="mt-1 text-muted-foreground">None of the registered conditions matched in this chart.</p>}
    <p className="mt-1 text-muted-foreground">This is a qualified subset of the ordinary catalogue; other natal rules remain outside this event check.</p>
  </details>;
}
