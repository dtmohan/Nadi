import React, { useMemo } from "react";
import { SIGNS } from "@shared/astro";
import { sensitiveEventMatter } from "@shared/events";
import type { ChartResult } from "@shared/schema";
import { parashariNatalConditions, kpNatalConditions } from "@shared/natal-reading-evidence";
import { manleyNatalSummaries } from "@shared/manley-natal-summary";
import { kpQualifiedSummary, parashariQualifiedSummary } from "@shared/qualified-natal-summary";
import { KpCatalogueEvidence } from "@/components/kp-catalogue-evidence";
import { ParashariCatalogueEvidence } from "@/components/parashari-catalogue-evidence";
import { FUNCTIONAL_SOURCE } from "@shared/parashari-functional";
import { Cite } from "@/components/source-link";
import { InfoBox, InfoBoxTitle, InfoBoxDescription, InfoBoxDisclosure } from "@/components/info-box";

const shown = (xs: string[]) => xs.length ? xs.join(". ") : "none listed in this subset";

/** These are natal placements, not imagined event dates or period matches. */
export function ParashariNatalRules({ result }: { result: ChartResult }) {
  const topics = useMemo(() => parashariNatalConditions(result), [result]);
  if (!topics.length) return null;
  return <InfoBox className="mt-4" data-testid="parashari-natal-summary">
    <InfoBoxTitle>What the birth chart shows</InfoBoxTitle>
    <InfoBoxDescription>These are partial D1 and divisional clues, before a date or running periods are chosen. Support and strain can coexist; a missing clue does not settle an outcome. The event checks use whole-sign houses and full aspects.</InfoBoxDescription>
    <ul className="nadi-topic-list">{parashariQualifiedSummary(topics).map((row) => <li key={row.matter} className="nadi-topic-entry"><strong className="nadi-topic-label">{row.label}</strong><p className="nadi-topic-copy">{row.text}</p></li>)}</ul>
    <InfoBoxDisclosure className="mt-4" data-testid="parashari-natal-rules" label="Natal event foundations · D1 and divisions">
    <p className="mt-2 text-muted-foreground">These are the same yoga-pair, node and matter-house combinations used in dated checks, before choosing an event or period. They use whole-sign houses and full aspects even if the main chart uses a different house view. They supplement the existing overview; they do not automatically change its verdict. The D1 table applied to divisional ascendants is provisional; these observations do not promise an outcome. <Cite href={FUNCTIONAL_SOURCE.url}>{FUNCTIONAL_SOURCE.label}</Cite></p>
    {topics.map((topic) => <InfoBoxDisclosure key={topic.matter} className="mt-2" data-testid={`parashari-natal-${topic.matter}`} label={`${topic.subject} · D1 and ${topic.division}`}>
      <ParashariCatalogueEvidence evidence={topic.ordinary} />
      {topic.support && <div className="mt-2 space-y-1 text-muted-foreground"><p>Partial D1 support: {shown(topic.support.d1Support)}; strain: {shown(topic.support.d1Strain)}.</p>
        <p>Partial {topic.division} support: {shown(topic.support.divisionSupport)}; strain: {shown(topic.support.divisionStrain)}.</p></div>}
      {topic.foundation && <div className="mt-2 text-muted-foreground"><p>Earlier partial D1 / divisional screen: {topic.foundation.d1.status} / {topic.foundation.divisionCheck.status}. It is incomplete and does not exclude an event.</p>
        <p>Cross-chart lords and significators: {topic.foundation.planets.map((p) => `${p.planet} (${p.roles.join(", ")}): D1 ${SIGNS[p.d1.sign]} house ${p.d1.house}, ${p.d1.dignity}; ${topic.division} ${SIGNS[p.division.sign]} house ${p.division.house}, ${p.division.dignity}`).join("; ")}.</p></div>}
      {topic.specific?.vivahSaham !== undefined && <p className="mt-2 text-muted-foreground">Marriage timing target: Vivah Saham in {SIGNS[topic.specific.vivahSaham]}. Its Jupiter transit depends on the selected date.</p>}
      {topic.specific?.periodSet && <p className="mt-2 text-muted-foreground">Natal timing set for this subset: {topic.specific.periodSet.map((x) => `${x.planet} (${x.reasons.join(", ")})`).join("; ")}. The running periods still need a date.</p>}
      {topic.specific?.fifthFromJupiter && <p className="mt-2 text-muted-foreground">Fifth-from-Jupiter lord {topic.specific.fifthFromJupiter.planet}: D1 {SIGNS[topic.specific.fifthFromJupiter.d1]}, D9 {SIGNS[topic.specific.fifthFromJupiter.d9]}; the transit is checked at a selected date.</p>}
      {topic.specific?.careerLords && <p className="mt-2 text-muted-foreground">D1 tenth lord and D10 ascendant lord: {topic.specific.careerLords.matched ? "listed connection" : "no listed connection"}; {topic.specific.careerLords.details.join("; ")}.</p>}
      {manleyNatalSummaries(topic).map((frame) => <div key={frame.chart} className="mt-2 space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">{frame.chart} · {SIGNS[frame.ascendant]} rising · house {frame.house}</p>
        <p><strong>Named yoga pair:</strong> {shown(frame.yoga)}.</p>
        <p><strong>Connected angle and trine lords (including named pairs):</strong> {shown(frame.generalPairs)}. Other house ownership and strength remain relevant; the connection alone does not establish its relevance to this topic or a complete yoga.</p>
        <p><strong>Rahu and Ketu:</strong> {shown(frame.nodes)}.</p>
        <p><strong>House plus lord/karaka combinations:</strong> {shown(frame.combinations)}.</p>
        <details><summary className="cursor-pointer font-medium">All planets · lordship and links</summary>
          {frame.planets.map((planet) => <p key={planet} className="mt-1">{planet}.</p>)}
        </details>
      </div>)}
      {topic.educationFourth && <p className="mt-2 text-muted-foreground"><strong>Separate D24 fourth-house education view:</strong> {shown(topic.educationFourth.flatMap(({ planet, frame }) => {
        const links = [...frame.primary.house, ...frame.primary.houseLord];
        return links.length ? [`${planet}: ${links.join("; ")}`] : [];
      }))}. Rao's fourth house is not added to Manley's fifth-house comparison.</p>}
    </InfoBoxDisclosure>)}
    <p className="mt-2 text-muted-foreground">Period and transit evidence needs a chosen date; open Matter and date to see those checks. A missing natal clue is unresolved, not an event denial.</p>
    </InfoBoxDisclosure>
  </InfoBox>;
}

export function KpNatalRules({ result, plain = false }: { result: ChartResult; plain?: boolean }) {
  const topics = useMemo(() => kpNatalConditions(result).filter((topic) => !plain || !sensitiveEventMatter(topic.matter)), [result, plain]);
  if (!topics.length) return null;
  return <InfoBox className="mt-4" data-testid="kp-natal-summary">
    <InfoBoxTitle>What the birth chart shows</InfoBoxTitle>
    <InfoBoxDescription>These are partial cusp links for common topics. The two script checks are research interpretations of the natal stages; a date, its periods and the event sky still need their own assessment.</InfoBoxDescription>
    <ul className="nadi-topic-list">{kpQualifiedSummary(topics).map((row) => <li key={row.matter} className="nadi-topic-entry"><strong className="nadi-topic-label">{row.label}</strong><p className="nadi-topic-copy">{row.text}</p></li>)}</ul>
    <InfoBoxDisclosure className="mt-4" data-testid="kp-natal-rules" label="Natal event foundations · KP cusp scripts">
    <p className="mt-2 text-muted-foreground">The four-step cusp links and the separate Aurora research scripts below are the same natal stages used in event checks. They supplement the existing overview; they do not automatically change its verdict. They do not assume a date or running periods. Aurora's mixed and unresolved stages are not event denials. The optional six-step chart view is a different convention; these event checks use four steps.</p>
    {plain && <p className="mt-1 text-muted-foreground">Additional sensitive matters, when available, are in Practitioner view or can be selected under Matter and date.</p>}
    {topics.map((topic) => <InfoBoxDisclosure key={topic.matter} className="mt-2" data-testid={`kp-natal-${topic.matter}`} label={topic.label}>
      <p className="mt-2">Basic four-step cusp {topic.basic.cusp}: {topic.basic.cuspSubLord} signifies {topic.basic.signified.join(", ") || "none of the listed matter houses"} (matter houses {topic.basic.matterHouses.join(", ")}).{topic.basic.deniedAtCusp ? " The app's separate twelfth-from-cusp condition is also present." : ""}</p>
      <KpCatalogueEvidence evidence={topic.natalRules} />
      {([ ["Strict script", topic.strict?.layers], ["Mixed script v2", topic.mixed?.layers] ] as const).map(([label, layers]) => layers && <div key={label} className="mt-2">
        <p className="font-medium">{label} · natal cusps only</p>
        {layers.map((l) => <p key={l.role}>{l.role}, {l.planet}: star layer {l.star.planet} ({l.star.houses.join(", ") || "none"}), sub layer {l.sub.planet} ({l.sub.houses.join(", ") || "none"}); {l.eligible ? l.status.replaceAll("-", " ") : `not counted after earlier stage (raw: ${l.status.replaceAll("-", " ")})`}.</p>)}
      </div>)}
      {topic.strict && <p className="mt-1 text-muted-foreground">Aurora, <em>The Ultimate Guide to KP Astrology Techniques</em> (2024), supplied capture pp. 252–261, 360–365, 462–474 and 582–599. The staged thresholds and node conventions are provisional.</p>}
    </InfoBoxDisclosure>)}
    </InfoBoxDisclosure>
  </InfoBox>;
}
