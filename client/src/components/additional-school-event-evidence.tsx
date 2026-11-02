import React from "react";
import type { AdditionalSchoolNatalEvidence } from "@shared/additional-school-event-rules";
import { Cite } from "@/components/source-link";
import { Soft } from "@/lib/gentle";

export function AdditionalSchoolEventEvidence({ evidence, school = "all" }: {
  evidence?: AdditionalSchoolNatalEvidence; school?: "all" | "bnn" | "jaimini" | "prasna";
}) {
  if (!evidence) return null;
  const show = (name: string) => school === "all" || school === name;
  const b = evidence.bnn, j = evidence.jaimini, p = evidence.prasna;
  return <details className="mt-2 rounded border px-2 py-2" data-testid="additional-school-event-evidence">
    <summary className="cursor-pointer font-medium">Related natal findings from {school === "all" ? "BNN, Jaimini and Prasna Marga" : school === "bnn" ? "BNN" : school === "jaimini" ? "Jaimini" : "Prasna Marga"}</summary>
    <p className="mt-1 text-muted-foreground">These are the ordinary chart's broad area or house findings. They provide context; inclusion does not make each finding an event promise or change an event score.</p>
    {show("bnn") && <div className="mt-2"><p className="font-medium">BNN · {b.area ?? "no mapped area"} · {b.status}</p>
      {b.findings.map((f, i) => <p key={`${f.ruleId}-${i}`}><strong>{f.ruleId}:</strong> <Soft>{f.text}</Soft>{f.source && <> · <Cite>{f.source}</Cite></>}</p>)}
      {b.status === "assessed" && !b.findings.length && <p>No finding in the mapped area.</p>}
    </div>}
    {show("jaimini") && <div className="mt-2"><p className="font-medium">Jaimini · {j.area ?? "no mapped area"} · {j.status}</p>
      {j.findings.map((f, i) => <p key={`${f.id}-${i}`}><strong>{f.id} · {f.chart}:</strong> <Soft>{f.text}</Soft> · <Cite href={f.source.url}>{f.source.label}</Cite></p>)}
      {j.status === "assessed" && !j.findings.length && <p>No finding in the mapped area.</p>}
    </div>}
    {show("prasna") && <div className="mt-2"><p className="font-medium">Prasna Marga · natal house {p.subjectHouse ?? "unmapped"} · {p.status}</p>
      <p className="text-muted-foreground">This is the natal house walk, not a question chart. No horary judgment or timing score is inferred.</p>
      {p.gulikaMethod && <p className="text-muted-foreground">Gulika convention: {p.gulikaMethod}{p.gulikaMethod !== "kerala-ghati" ? "; applying the Prasna Marga house wording to this alternative is a cross-convention comparison" : ""}.</p>}
      {p.houseReading && <p>{p.houseReading.beneficText && <Soft>{p.houseReading.beneficText}</Soft>} {p.houseReading.maleficText && <Soft>{p.houseReading.maleficText}</Soft>} · <Cite>{p.houseReading.source}</Cite></p>}
      {p.gulika && <p><Soft>{p.gulika.text}</Soft> · <Cite>{p.gulika.source}</Cite></p>}
      {p.gulikaClues && <p>Jupiter and Gulika: {p.gulikaClues.jupiter.sameSign ? "same sign (conjunction)" : p.gulikaClues.jupiterFifthOrNinthAspect ? "Jupiter's fifth/ninth full sign aspect" : p.gulikaClues.jupiter.fullAspect ? "full sign aspect" : "no full sign aspect"}. This clue does not by itself cancel a reading or determine an outcome.</p>}
    </div>}
  </details>;
}
