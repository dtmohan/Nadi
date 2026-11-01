import { SIGNS } from "@shared/astro";
import { MANLEY_SOURCE, RAO_EDUCATION_SOURCE, type ManleyEvidence, type ManleyFrame } from "@shared/manley-evidence";
import { Cite } from "@/components/source-link";
import { FUNCTIONAL_SOURCE } from "@shared/parashari-functional";

const show = (xs: string[]) => xs.length ? xs.join("; ") : "none found in this partial check";

/** A source-specific explanation, not a score or a conclusion about the event. */
export function ManleyEvidencePanel({ evidence }: { evidence: ManleyEvidence }) {
  const periods = [...evidence.periods, ...(evidence.antara ? [evidence.antara] : [])];
  const frame = (f: ManleyFrame) => <div key={f.chart} className="rounded border px-2 py-2">
    <p className="font-medium text-foreground">{f.chart} · {SIGNS[f.ascendant]} rising · house {f.house} {SIGNS[f.houseSign]}, lord {f.houseLord}</p>
    {f.functional && <p data-testid={`functional-${f.chart}`}><strong>{f.functional.planet}:</strong> {SIGNS[f.functional.sign]}, house {f.functional.house}, {f.functional.dignity === "other" ? "no listed sign dignity" : f.functional.dignity}; owns {f.functional.owns.length ? `house${f.functional.owns.length > 1 ? "s" : ""} ${f.functional.owns.join(", ")}` : "no houses in this convention"}; functional classification: {f.functional.classification}{f.functional.directMatterLord ? ` · direct house ${f.house} lord` : ""}.
      {f.functional.yogaPair && ` Named pair with ${f.functional.yogaPair.partner} (owns ${f.functional.yogaPair.partnerOwns?.join(", ")}): ${show(f.functional.yogaPair.links)}. App relationship filter: ${show(f.functional.yogaPair.formation ?? [])}; one-way aspect alone does not pass. This filter does not assess every placement or adverse-lordship condition; it is not a complete yoga judgment.`}</p>}
    {f.angleTrinePairs.length > 0 && <p data-testid={`angle-trine-${f.chart}`}>Angle–trine lord connections: {f.angleTrinePairs.map((pair) => `${f.functional?.planet} (owns ${pair.owns.join(", ")}) and ${pair.partner} (owns ${pair.partnerOwns.join(", ")}): ${pair.links.join(", ")}`).join("; ")}. This connection alone does not establish relevance to this event, a complete yoga or an outcome.</p>}
    <p>House: {show(f.primary.house)}.</p>
    <p>House lord: {show(f.primary.houseLord)}.</p>
    <p>Karaka: {show(f.primary.karaka)}.</p>
    <p>Supporting — divisional ascendant: {f.chart === "D1" ? "not applicable in D1" : show(f.supporting.ascendant)}; D1 house lord in the division: {f.chart === "D1" ? "not applicable in D1" : show(f.supporting.natalHouseLord)}; house {f.bhavatHouse} and its lord: {show(f.supporting.bhavat)}.</p>
    {f.supporting.nodes.length > 0 && <p>Node context: {show(f.supporting.nodes)}.</p>}
    {f.nodeDispositor && <p data-testid={`node-dispositor-${f.chart}`}>Node's sign ruler {f.nodeDispositor.planet}: {SIGNS[f.nodeDispositor.sign]}, house {f.nodeDispositor.house}, owns houses {f.nodeDispositor.owns.join(", ")}. One-hop event links: {show(f.nodeDispositor.links)}. These are indirect; its other lordships also matter.</p>}
    {f.eventCombination?.matched && <p data-testid={`event-combination-${f.chart}`}>Same-frame event combination: {show(f.eventCombination.explanations)}.</p>}
  </div>;
  return <details className="mt-2 rounded-md border px-3 py-2 text-xs" data-testid="manley-evidence">
    <summary className="cursor-pointer font-medium">Manley event clues and functional lordship · {evidence.label} · {evidence.date} · D1 and {evidence.division}</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>For {evidence.subject}, the book highlights house {evidence.house}, its lord and {evidence.karakas.join(", ")} as the primary clues. These are partial, unweighted observations, not a promise or birth-time verdict. Whole-sign conjunctions and full sign-based planetary aspects are shown; lunar nodes receive aspects but do not cast them in this app convention. The selected ayanamsa and node setting apply.</p>
      <p>Each period lord's owned houses, sign and functional classification are shown for D1 and the relevant division. Applying the natal rising-sign classification table to a divisional ascendant is Nadi's provisional convention. Functional nature and sign dignity are not complete strength, event quality or a verdict. <Cite href={FUNCTIONAL_SOURCE.url}>{FUNCTIONAL_SOURCE.label}</Cite></p>
      {evidence.moment && <p>Event time: {evidence.moment.time}{evidence.moment.timeAssumed ? " (noon assumed)" : ""} · {evidence.moment.timezone ?? "birth time zone"}{evidence.moment.timezoneAssumed ? " (birth zone assumed)" : ""}. A finer period can change when the event time or zone is uncertain.</p>}
      {evidence.matter === "education" && <p>This event is labelled admission; the book prefers the actual first day of study when known.</p>}
      {periods.map((p) => {
        const fourth = evidence.educationFourth?.find((x) => x.level === p.level);
        const repeated = p.level === "antara" && evidence.periods.some((x) => x.planet === p.planet);
        return <div key={p.level} className="space-y-1.5">
          <p className="font-medium text-foreground">{p.level === "antara" ? "Third period (pratyantardasha)" : p.level}: {p.planet}{repeated ? " · same lord as an earlier period" : ""}</p>
          {p.frames.map(frame)}
          {fourth && <div className="rounded border px-2 py-2" data-testid={`education-fourth-${p.level}`}>
            <p className="font-medium text-foreground">D24 fourth house · {SIGNS[fourth.houseSign]}, lord {fourth.houseLord}</p>
            <p>House: {show(fourth.house)}. House lord: {show(fourth.houseLordLinks)}.</p>
          </div>}
        </div>;
      })}
      {evidence.educationFourth && <p>The D24 fourth house is a separate education interpretation; it is not added to Manley's fifth-house clues or to a score. <Cite href={RAO_EDUCATION_SOURCE.url}>{RAO_EDUCATION_SOURCE.label}</Cite></p>}
      <p>One-hop node-ruler links follow Manley's worked examples (capture pp. 69–72, 140–141, 165). The house-plus-lord/karaka combination follows his childbirth examples; these clues can overlap. The angle–trine connection is a partial BPHS 34.11–15 check, including Manley's Jupiter–Venus D7 example (p. 66); adverse ownership and strength still need judgment. Applying the natal classification table to divisions is provisional. These are observations, not a complete promise or event verdict. The third period is descriptive and does not change the ranking; a repeated lord is not independent confirmation. Many yogas, deeper periods and the full manual funnel remain unimplemented. <Cite>{MANLEY_SOURCE.label}</Cite></p>
    </div>
  </details>;
}
