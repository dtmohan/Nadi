import { SIGNS } from "@shared/astro";
import { PARASHARI_VARGA_SOURCE, type ParashariVargaEvidence, type PromiseHouseEvidence } from "@shared/parashari-varga-evidence";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";

/** A readable cross-check, not a numerical verdict or a claim of confirmation. */
export function ParashariVargaEvidencePanel({ evidence, natalOnly = false }: { evidence: ParashariVargaEvidence; natalOnly?: boolean }) {
  const names = (xs: string[]) => xs.length ? xs.join(", ") : "none";
  const placement = (h: PromiseHouseEvidence) => (
    <p>
      <strong>{h.chart} · house {h.house}</strong> is {SIGNS[h.houseSign]}, ruled by{" "}
      <PlanetName planet={h.houseLord} />, in house {h.lordHouse} ({SIGNS[h.lordSign]}
      {h.lordDignity !== "other" ? `, ${h.lordDignity}` : ""}). Occupants: {names(h.occupants)}.
      Full aspects: {names(h.fullAspects)}.
    </p>
  );
  const natal = evidence.rashiLordInVarga;
  const rising = evidence.vargaLagnaLord;
  return (
    <details className="nadi-info-disclosure mt-2" data-testid="parashari-varga-evidence">
      <summary className="nadi-info-summary">
        Parashari cross-check · {evidence.label}{natalOnly ? " · natal" : ` · ${evidence.date}`} · D1 and {evidence.division}
      </summary>
      <div className="mt-2 space-y-1.5 text-muted-foreground">
        <p>
          {evidence.division} is read for {evidence.subject}. Compare the relevant
          house and its ruler in the birth chart and the division; these are
          observations to weigh together, not a confirmation that the event
          was promised. D1 and the division use whole-sign houses and the chart's
          selected ayanamsa. Full sign-based aspects are shown; this convention
          excludes aspects from the lunar nodes. A planet's total strength and
          other conditions are not reduced to a single yes/no.
        </p>
        {placement(evidence.rashi)}
        <p>
          D1 house factors (partial BPHS 11.14–16 check): supporting:{" "}
          {names(evidence.rashiAssessment.support)}; difficult:{" "}
          {names(evidence.rashiAssessment.strain)}. Shadbala and the other
          omitted conditions are not assessed here.
        </p>
        {placement(evidence.varga)}
        <p>
          {evidence.division} rises in {SIGNS[evidence.varga.lagnaSign]}; its
          ascendant ruler <PlanetName planet={rising.planet} /> is in house{" "}
          {rising.house} ({SIGNS[rising.sign]}
          {rising.dignity !== "other" ? `, ${rising.dignity}` : ""}).
        </p>
        <p>
          The D1 house ruler, <PlanetName planet={natal.planet} />, falls in{" "}
          {evidence.division} house {natal.house} ({SIGNS[natal.sign]}
          {natal.dignity !== "other" ? `, ${natal.dignity}` : ""}).
        </p>
        <p>
          {natalOnly ? "Natal placements do not depend on a selected date. Choose a date to inspect its periods and transit rules." : <>At the event: {evidence.periods.length ? evidence.periods.map((p) =>
            `${p.level} ${p.planet} (${p.links.length ? p.links.join("; ") : "no listed house link"})`,
          ).join(" · ") : "event precedes birth; periods are not calculated"}.
          These links use the chart's ayanamsa and may differ from KP's.</>}
        </p>
        <p>
          This descriptive evidence is separate from the KP and Jaimini scores.
          Nadi's experimental Parashari ranking uses a limited subset of these factors.
          A career chart also does not by itself distinguish a job
          gain from a job loss. <SourceLink source={PARASHARI_VARGA_SOURCE} />
          {" "}{evidence.practitionerSource}.
        </p>
      </div>
    </details>
  );
}
