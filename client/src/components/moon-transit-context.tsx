import { NAKSHATRAS, SIGNS } from "@shared/astro";
import { PD } from "@shared/gochara";
import { EVENT_MOON_TRANSIT_NOTE, moonTransitDetails, periodLordMoonHouseText, type MoonTransitContext } from "@shared/transit-context";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** General, unscored event-time context; also used for the first comparison-date example. */
export function MoonTransitContextPanel({ context, label, date, when }: {
  context: MoonTransitContext; label: string; date: string; when: string;
}) {
  const slow = context.rows.filter((r) => r.planet === "Jupiter" || r.planet === "Saturn");
  return <details className="nadi-info-disclosure mt-2" data-testid="moon-transit-context">
    <summary className="nadi-info-summary">Moon-based transit context · {label} · {date} · {when}</summary>
    <p className="mt-2 max-w-4xl text-muted-foreground">{EVENT_MOON_TRANSIT_NOTE} <SourceLink source={PD("1-2")} /></p>
    <p className="mt-2 font-medium" data-testid="moon-transit-slow-summary">{slow.map((r) => `${r.planet}: house ${r.moonHouse} from the Moon, ${r.verdict}`).join(" · ")}.</p>
    {context.periodLordFromMoon && <p className="mt-2 text-muted-foreground" data-testid="period-lord-from-moon">{periodLordMoonHouseText(context.periodLordFromMoon)}</p>}
    <p className="mt-2 text-muted-foreground">Birth Moon: {SIGNS[context.natalMoonSign]} · birth ascendant: {SIGNS[context.natalLagnaSign]}.
      At this moment the Moon is in {NAKSHATRAS[context.transitMoonStar]}, giving {context.tara.name} tara from the birth star {NAKSHATRAS[context.birthStar]}.
      The Moon's star can change during the day, so an assumed time may give a different tara.</p>
    <div className="mt-2 overflow-x-auto"><Table className="text-xs [&_td]:px-2 [&_th]:px-2">
      <TableHeader><TableRow><TableHead>Transit</TableHead><TableHead>From Moon</TableHead>
        <TableHead>From ascendant</TableHead><TableHead>Moon-based verdict</TableHead><TableHead>How the verdict was read</TableHead></TableRow></TableHeader>
      <TableBody>{context.rows.map((r) => <TableRow key={r.planet}>
        <TableCell><PlanetName planet={r.planet} /> · {SIGNS[r.signIndex]}</TableCell>
        <TableCell>House {r.moonHouse}</TableCell><TableCell>House {r.lagnaHouse}</TableCell>
        <TableCell>{r.verdict}</TableCell><TableCell>{moonTransitDetails(r)}</TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
    <p className="mt-2 text-muted-foreground">The ascendant column is a position only; it does not apply the Moon-house verdict table to the ascendant. The tara name is shown for the selected instant and is not a recommendation to choose or avoid a date.</p>
  </details>;
}
