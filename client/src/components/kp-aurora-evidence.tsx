import * as React from "react";
import { auroraAscendantLinks, auroraSelfSignificators, type AuroraAscendantLinks, type AuroraEventEvidence } from "@shared/kp-aurora";
import type { KpCusp, KpPlanet } from "@shared/kp";
import { auroraV2StageCounts, type AuroraV2Evidence, type AuroraV2StageComparison } from "@shared/kp-aurora-v2";

/** Cumulative survival, with the same gates applied to the random-date sets. */
export function AuroraV2StagesPanel({ evidence, comparison, trials }: {
  evidence: Array<AuroraV2Evidence | undefined>;
  comparison?: AuroraV2StageComparison<{ actual: number; mean: number }>;
  trials?: number;
}) {
  const counts = auroraV2StageCounts(evidence);
  if (!counts.eligibleEvents) return null;
  const rows = [
    { key: "cusps" as const, label: "All required cusps" },
    { key: "major" as const, label: "Then major period" },
    { key: "sub" as const, label: "Then sub-period" },
    { key: "third" as const, label: "Then third period" },
  ];
  const comparable = comparison?.eligibleEvents === counts.eligibleEvents ? comparison : undefined;
  return <div className="nadi-info-disclosure mt-3" data-testid="aurora-v2-stage-counts">
    <p className="font-medium">Where events stop in the staged check</p>
    <p className="mt-1 text-muted-foreground">Counts are cumulative: an event reaches the next row only after all earlier rows pass. Supported-with-caution is included; a mixed sub or other unresolved stage stops that event.</p>
    <p className="mt-1 text-muted-foreground">These rows are nested period lords, not the positional star, sub and sub-sub of a planet or cusp. V2 uses a planet's positional sub-sub in its own-star and repeated-star/sub conventions; it does not separately apply the book's repeated-star/sub cusp exception.</p>
    <div className="mt-2 overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Stage</th><th>Actual events</th>{comparable && <th>Random-date mean</th>}</tr></thead>
      <tbody>{rows.map(({ key, label }) => <tr key={key}><td className="pr-2">{label}</td>
        <td>{counts[key]} / {counts.eligibleEvents}</td>{comparable && <td>{comparable[key].mean} / {counts.eligibleEvents}</td>}
      </tr>)}</tbody></table></div>
    {comparable && <p className="mt-1 text-muted-foreground">The same gates were applied to {trials ?? 200} comparison sets. The natal cusp result is fixed for a candidate, so changing event dates does not test it. Random dates are not known non-events.</p>}
  </div>;
}

const reason: Record<string, string> = {
  "unoccupied-star": "no natal planet in its stars",
  "own-star": "in its own star",
  "mutual-star": "mutual star exchange",
};

export function AuroraSelfPanel({ planets, cusps }: { planets: KpPlanet[]; cusps: KpCusp[] }) {
  const entries = auroraSelfSignificators(planets, cusps);
  return <details className="nadi-info-disclosure mt-3" data-testid="aurora-self-significators">
    <summary className="nadi-info-summary">Aurora's self-significators · research</summary>
    <p className="mt-2 text-muted-foreground">This is a separately attributed interpretation. The empty-star wording is read as no natal planet occupying a star ruled by that planet, as illustrated by the author's examples.</p>
    <ul className="mt-2 space-y-1">{entries.map((entry) => <li key={entry.planet}>
      <strong>{entry.planet}</strong>: {entry.reasons.map((r) => reason[r]).join("; ")}
      {entry.exchangeWith.length ? ` with ${entry.exchangeWith.join(", ")}` : ""}.
      {` Cusps in its star: ${entry.cuspStar.join(", ") || "none"}; cusps in its sub: ${entry.cuspSub.join(", ") || "none"}.`}
    </li>)}</ul>
    <p className="mt-2 text-muted-foreground">Leena Aurora, <em>The Ultimate Guide to KP Astrology Techniques</em> (2024), supplied Kindle capture pp. 252–261, 424–426 and 567–569. These labels alone do not verify a birth time.</p>
    <AuroraLinkDetail links={auroraAscendantLinks(planets, cusps)} />
  </details>;
}

export function AuroraLinkDetail({ links }: { links: AuroraAscendantLinks }) {
  return <div className="mt-2 rounded border px-2 py-1" data-testid="aurora-ascendant-links">
    <p className="font-medium">First and ninth cusp links · descriptive</p>
    <p>First cusp star/sub: {links.firstStar}/{links.firstSub}; ninth cusp sub: {links.ninthSub}.
      {` Same sub: ${links.sameSub ? "yes" : "no"}; first star equals ninth sub: ${links.firstStarMatchesNinthSub ? "yes" : "no"}.`}</p>
    <p>Sub-lord script rulers shared: {links.sharedScriptLords.join(", ") || "none"}; sub lords occupy houses {links.firstSubHouse} and {links.ninthSubHouse}{links.sameHouse ? " (the same house)" : ""}.</p>
    <p className="text-muted-foreground">Aurora's example uses a shared house, while her text also describes other links (capture pp. 271–274). The relationship is not a genetic test or an automatic rectification verdict.</p>
  </div>;
}

export function AuroraEventPanel({ evidence, label }: { evidence: AuroraEventEvidence; label: string }) {
  return <details className="nadi-info-disclosure mt-2" data-testid="aurora-event-evidence">
    <summary className="nadi-info-summary">Aurora staged scripts · {label} · {evidence.allSupported ? "all stages supported" : "unresolved"}</summary>
    <p className="mt-2 text-muted-foreground">Experimental adapter: Nadi's four-step houses plus Aurora's self-significator cusp links and own-star adjustment. Both layers must have a supporting house and no adverse house to pass; this strict rule is an app convention. Mixed, adverse and silent stages remain unresolved. Later stages cannot pass the chain after a predecessor fails. A small fresh-case check produced no complete chains and did not narrow the sampled birth times.</p>
    <p className="mt-1">Supporting houses: {evidence.supporting.join(", ")}; adverse houses: {evidence.adverse.join(", ")}.</p>
    <div className="mt-2 overflow-x-auto"><table className="w-full text-left">
      <thead><tr><th>Stage</th><th>Planet</th><th>Star layer</th><th>Sub layer</th><th>Chain</th></tr></thead>
      <tbody>{evidence.layers.map((layer) => <tr key={layer.role}>
        <td className="pr-2">{layer.role}</td><td className="pr-2">{layer.planet}{layer.ownStar ? " · own star" : ""}</td>
        <td className="pr-2">{layer.star.planet}: {layer.star.houses.join(", ") || "—"}</td>
        <td className="pr-2">{layer.sub.planet}: {layer.sub.houses.join(", ") || "—"}</td>
        <td>{layer.eligible ? layer.status : `not counted (raw: ${layer.status})`}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="mt-2">Event sky: {evidence.transit.map((t) => `${t.role} ${t.planet}: ${t.signLord}/${t.starLord}/${t.subLord}`).join(" · ") || "not available"}.</p>
    <p className="mt-2 text-muted-foreground">The sky is descriptive and is not scored. The book leaves some mixed results and node links open to judgment; an unresolved chain is not proof that an event cannot occur. Source: Aurora (2024), supplied Kindle capture pp. 252–261, 266–268 and the relevant matter chapter.</p>
  </details>;
}

export function AuroraV2Panel({ evidence, label }: { evidence: AuroraV2Evidence; label: string }) {
  return <details className="nadi-info-disclosure mt-2" data-testid="aurora-v2-event-evidence">
    <summary className="nadi-info-summary">Aurora mixed scripts · v2 · {label} · {evidence.allSupported ? "chain supported" : "unresolved"}</summary>
    <p className="mt-2 text-muted-foreground">V2 reads each planet's own occupied and owned houses, with explicit node agents. A mixed star may proceed with caution when the sub supports and has no adverse houses. A mixed sub remains unresolved. Later stages cannot pass after an unresolved predecessor. Node aspects, self-significator promotion and repeated star/sub handling are provisional app conventions.</p>
    <p className="mt-1">Supporting houses: {evidence.supporting.join(", ")}; adverse houses: {evidence.adverse.join(", ")}.</p>
    <div className="mt-2 overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Stage</th><th>Planet</th><th>Star layer</th><th>Sub layer</th><th>Chain</th></tr></thead>
      <tbody>{evidence.layers.map((layer) => <tr key={layer.role}>
        <td className="pr-2">{layer.role}</td><td className="pr-2">{layer.planet}{layer.ownStar ? " · own star" : ""}{layer.repeatedStarSub ? " · repeated star/sub" : ""}</td>
        <td className="pr-2">{layer.star.planet}: {layer.star.houses.join(", ") || "—"}</td>
        <td className="pr-2">{layer.sub.planet}: {layer.sub.houses.join(", ") || "—"}</td>
        <td>{layer.eligible ? layer.status.replaceAll("-", " ") : `not counted (raw: ${layer.status.replaceAll("-", " ")})`}</td>
      </tr>)}</tbody></table></div>
    <div className="mt-2 space-y-1">{evidence.layers.map((layer) => <p key={`${layer.role}-links`}>
      {layer.role}: {layer.star.agents.length ? `star node agents ${layer.star.agents.map((a) => `${a.planet} (${a.via})`).join(", ")}; ` : ""}
      {layer.star.promoted.length ? `star promotions ${layer.star.promoted.map((p) => `${p.planet}: ${p.houses.join(", ")}`).join("; ")}; ` : ""}
      {layer.sub.agents.length ? `sub node agents ${layer.sub.agents.map((a) => `${a.planet} (${a.via})`).join(", ")}; ` : ""}
      supportive {layer.star.supporting.join(", ") || "—"}/{layer.sub.supporting.join(", ") || "—"}; adverse {layer.star.adverse.join(", ") || "—"}/{layer.sub.adverse.join(", ") || "—"} (star/sub).
    </p>)}</div>
    <p className="mt-2">Event sky: {evidence.transit.map((t) => `${t.role} ${t.planet}: ${t.signLord}/${t.starLord}/${t.subLord}`).join(" · ") || "not available"}.</p>
    <p className="mt-2 text-muted-foreground">In an initial check of 12 published events for four people, no complete chains passed at the reported birth times; every sampled training window tied. This method has not been validated for ranking birth times. The sky is descriptive and not a trigger. Source: Aurora (2024), supplied Kindle capture pp. 260–262, 360–365, 462–474 and 582–599.</p>
  </details>;
}
