import { SIGNS } from "@shared/astro";
import { MANLEY_SOURCE, RAO_EDUCATION_SOURCE, type ManleyEvidence, type ManleyFrame } from "@shared/manley-evidence";
import { Cite } from "@/components/source-link";

const show = (xs: string[]) => xs.length ? xs.join("; ") : "none found in this partial check";

/** A source-specific explanation, not a score or a conclusion about the event. */
export function ManleyEvidencePanel({ evidence }: { evidence: ManleyEvidence }) {
  const periods = [...evidence.periods, ...(evidence.antara ? [evidence.antara] : [])];
  const frame = (f: ManleyFrame) => <div key={f.chart} className="rounded border px-2 py-2">
    <p className="font-medium text-foreground">{f.chart} · {SIGNS[f.ascendant]} rising · house {f.house} {SIGNS[f.houseSign]}, lord {f.houseLord}</p>
    <p>House: {show(f.primary.house)}.</p>
    <p>House lord: {show(f.primary.houseLord)}.</p>
    <p>Karaka: {show(f.primary.karaka)}.</p>
    <p>Supporting — divisional ascendant: {f.chart === "D1" ? "not applicable in D1" : show(f.supporting.ascendant)}; D1 house lord in the division: {f.chart === "D1" ? "not applicable in D1" : show(f.supporting.natalHouseLord)}; house {f.bhavatHouse} and its lord: {show(f.supporting.bhavat)}.</p>
    {f.supporting.nodes.length > 0 && <p>Node context: {show(f.supporting.nodes)}.</p>}
  </div>;
  return <details className="mt-2 rounded-md border px-3 py-2 text-xs" data-testid="manley-evidence">
    <summary className="cursor-pointer font-medium">Manley event clues · {evidence.label} · {evidence.date} · D1 and {evidence.division}</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>For {evidence.subject}, the book highlights house {evidence.house}, its lord and {evidence.karakas.join(", ")} as the primary clues. These are partial, unweighted observations, not a promise or birth-time verdict. Whole-sign conjunctions and full sign-based planetary aspects are shown; lunar nodes receive aspects but do not cast them in this app convention. The selected ayanamsa and node setting apply.</p>
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
      <p>The third period is descriptive and does not change the ranking. A repeated lord is not independent confirmation. This subset omits indirect links through a node's dispositor, many yogas, fourth and fifth period levels, and the full manual funnel. The first two primary divisional period links also appear in the separate v3 experiment. <Cite>{MANLEY_SOURCE.label}</Cite></p>
    </div>
  </details>;
}
