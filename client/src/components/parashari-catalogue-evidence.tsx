import React from "react";
import type { ParashariDatedCatalogue, ParashariNatalCatalogue } from "@shared/parashari-event-natal-rules";
import { Cite } from "@/components/source-link";
import { Soft } from "@/lib/gentle";
import { useReadingMode } from "@/lib/reading-mode";

export function ParashariCatalogueEvidence({ evidence }: { evidence?: ParashariDatedCatalogue | ParashariNatalCatalogue }) {
  const { mode } = useReadingMode();
  if (!evidence) return null;
  const natal = "natal" in evidence ? evidence.natal : evidence;
  const periods = "natal" in evidence ? evidence.periods : [];
  if (natal.status !== "assessed") return <p className="mt-1 text-muted-foreground">{natal.status === "withheld" ? "Natal rule context is withheld under the reading policy." : "Natal rule context has not been mapped for this event."}</p>;
  return <details className="mt-2 rounded border px-2 py-2" data-testid="parashari-catalogue-event-evidence">
    <summary className="cursor-pointer font-medium">Ordinary Parashari house and related yoga context · house {natal.subjectHouse}</summary>
    <p className="mt-1 text-muted-foreground">The main chart's {natal.houseMethod} construction and aspect floor {natal.aspectFloor}/4 are used here. The separate D1/divisional research checks use whole signs and full aspects. A house covers several subjects; a yoga involving its lord is related context, not an event prediction. These findings do not add points or impose a hard gate.</p>
    {natal.houseMethodNote && <p className="mt-1 text-muted-foreground">{natal.houseMethodNote}</p>}
    {natal.assessment && <p className="mt-1">House assessment: {natal.assessment.tone}; support: <Soft>{natal.assessment.support.join("; ") || "none listed"}</Soft>; strain: <Soft>{natal.assessment.strain.join("; ") || "none listed"}</Soft>.</p>}
    {natal.assessment?.lordAspectClue && <p className="mt-1"><Soft>{mode === "plain" ? natal.assessment.lordAspectClue.plain : natal.assessment.lordAspectClue.text}</Soft> · <Cite href={natal.assessment.lordAspectClue.source.url}>{natal.assessment.lordAspectClue.source.label}</Cite> (provisional, no points).</p>}
    {periods.map((p) => <p className="mt-1" key={p.level}>{p.level} {p.planet} is named in: {p.ruleIds.join(", ") || "no listed ordinary finding"}. This is a participant link, not a timing verdict.</p>)}
    {natal.rules.length ? natal.rules.filter((item) => mode !== "plain" || !item.finding.id.startsWith("pa-curse-")).map((item, i) => <p className="mt-1" key={`${item.finding.id}-${i}`}><strong>{item.role} · <Soft>{mode === "plain" ? item.finding.titlePlain ?? item.finding.title : item.finding.title}</Soft>:</strong> <Soft>{mode === "plain" ? item.finding.nullified?.text ?? item.finding.textPlain ?? item.finding.plain ?? item.finding.text : item.finding.text}</Soft>{mode !== "plain" && item.finding.nullified && <> <Soft>{item.finding.nullified.text}</Soft></>}{item.finding.debilityCancelled && <> <Soft>{mode === "plain" ? item.finding.debilityCancelled.plain : item.finding.debilityCancelled.text}</Soft></>} · <Cite href={item.finding.source.url}>{item.finding.source.label}</Cite></p>)
      : <p className="mt-1">No matching ordinary house or related yoga findings were listed.</p>}
  </details>;
}
