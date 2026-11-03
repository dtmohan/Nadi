import { SIGNS, fmtDegShort } from "@shared/astro";
import { KP_TRANSIT_EVIDENCE_SOURCE, type KpTransitEvidence } from "@shared/kp-transit-evidence";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Evidence from the whole event-day sky, deliberately kept outside the two-lord tally. */
export function KpTransitEvidencePanel({
  label,
  date,
  when,
  evidence,
}: {
  label: string;
  date: string;
  when: string;
  evidence: KpTransitEvidence[];
}) {
  const houses = (xs: number[]) => xs.length ? xs.join(", ") : "—";
  return (
    <details className="nadi-info-disclosure mt-2" data-testid="kp-transit-evidence">
      <summary className="nadi-info-summary">
        Event-day sky against the natal chart · {label} · {date} · {when}
      </summary>
      <p className="mt-2 max-w-4xl text-muted-foreground">
        The app's nine transit points, including the nodes, are located in the
        candidate's natal houses. Each point's
        sign, star and sub rulers are followed back to the event houses they
        signify in that natal chart. The contacts column lists major geometric
        aspects within 1° of a natal planet or cusp; 1° is a display convention,
        not a sourced cutoff. These are observations, not a combined score, and
        are not included in the two-period-lord comparison. An event ascendant
        needs the actual time and place; it is not calculated here. {" "}
        <SourceLink source={KP_TRANSIT_EVIDENCE_SOURCE} />
      </p>
      <div className="mt-2 overflow-x-auto">
        <Table className="text-xs [&_td]:px-2 [&_th]:px-2">
          <TableHeader>
            <TableRow>
              <TableHead>Transiting</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Natal house</TableHead>
              <TableHead>Sign ruler · event houses</TableHead>
              <TableHead>Star ruler · event houses</TableHead>
              <TableHead>Sub-lord · event houses</TableHead>
              <TableHead>Contacts to natal planets / cusps</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidence.map((p) => (
              <TableRow key={p.planet}>
                <TableCell><PlanetName planet={p.planet} /></TableCell>
                <TableCell className="whitespace-nowrap">{SIGNS[Math.floor(p.lon / 30)]} {fmtDegShort(p.lon % 30)}</TableCell>
                <TableCell>{p.house}</TableCell>
                <TableCell><PlanetName planet={p.signLord} abbr /> · {houses(p.signHouses)}</TableCell>
                <TableCell><PlanetName planet={p.starLord} abbr /> · {houses(p.starHouses)}</TableCell>
                <TableCell><PlanetName planet={p.subLord} abbr /> · {houses(p.subHouses)}</TableCell>
                <TableCell>{p.contacts.length ? p.contacts.map((c) => `${c.kind} ${c.target} (${c.orb.toFixed(2)}°)`).join("; ") : "No listed contact within 1°"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </details>
  );
}
