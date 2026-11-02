/** Disclosure shared by dated readings and event tools; it does not add an event scoring rule. */
import { houseFrom, type Planet, type PlanetPosition } from "./astro";
import { computeGochara, FAVOURABLE, type GocharaVerdict, type OwnMarks } from "./gochara";
import { taraOf, type Tara } from "./tara";

export const EVENT_TRANSIT_SCOPE = "Event methods that include transits use their own specific checks. General Moon-based gochara can be shown separately at a chosen event time; it is not included in event, rectification or comparison-date scores. Panchanga's chosen date uses the selected place's sunrise, which can give a different sky.";
export const EVENT_MOON_TRANSIT_NOTE = "This general gochara is descriptive context, not an event-specific prediction or a KP rule. It uses the chart's selected ayanamsa; KP's own checks use KP ayanamsa. The Moon-house table is modified by the app's qualified readings of vedha, dignity, combustion, aspects and Ashtakavarga. It does not change any event or comparison score.";

/** Compact, non-sensitive event-time context from the same gochara engine used on the Panchanga page. */
export interface MoonTransitRow {
  planet: Planet;
  signIndex: number;
  moonHouse: number;
  lagnaHouse: number;
  favourableByHouse: boolean;
  verdict: GocharaVerdict;
  vedhaBy: Planet[];
  aspectBy: Planet[];
  modifierConflict?: string;
  avMarks?: number;
  avOverride: boolean;
  dignity?: string;
  combust: boolean;
}
export interface MoonTransitContext {
  asOf: string;
  natalMoonSign: number;
  natalLagnaSign: number;
  birthStar: number;
  transitMoonStar: number;
  tara: Tara;
  periodLordFromMoon?: PeriodLordMoonHouse;
  rows: MoonTransitRow[];
}

export interface PeriodLordMoonHouse {
  lord: Planet;
  house: number;
  /** Null for nodes, for which this comparison is not graded. */
  favourableByHouse: boolean | null;
}

/** Sastri's 20.60 direction, using the basic 26.2 table as a provisional interpretation. */
export function periodLordMoonHouse(lord: Planet, natalMoonSign: number, sky: PlanetPosition[]): PeriodLordMoonHouse | undefined {
  const p = sky.find((item) => item.planet === lord);
  if (!p) return undefined;
  const house = houseFrom(natalMoonSign, p.signIndex);
  return { lord, house, favourableByHouse: lord === "Rahu" || lord === "Ketu" ? null : FAVOURABLE[lord].includes(house) };
}

export function periodLordMoonHouseText(r: PeriodLordMoonHouse, plain = false): string {
  if (plain) {
    const result = r.favourableByHouse === null ? "This comparison is not graded for this planet" : r.favourableByHouse ? "The basic Moon-house table regards this position as favourable" : "The basic Moon-house table does not list this as a favourable position";
    return `Separately, ${r.lord}, the main-period planet, is in house ${r.house} from your birth Moon. ${result}; this does not change event scores.`;
  }
  const judgement = r.favourableByHouse === null ? "not graded for the nodes" : r.favourableByHouse ? "a favourable house in the basic table" : "not a favourable house in the basic table";
  return `Main-period lord ${r.lord} is in house ${r.house} from the natal Moon: ${judgement}. This is the Sastri 20.60 direction with the 26.2 table, without Vedha or other modifiers; it does not change an event score.`;
}

export function moonTransitContext(natalMoon: PlanetPosition, natalLagnaSign: number,
  sky: PlanetPosition[], asOf: string, ownMarks: OwnMarks, periodLord?: Planet): MoonTransitContext {
  const transitMoon = sky.find((p) => p.planet === "Moon");
  if (!transitMoon) throw new Error("Moon-based transit context requires the transiting Moon");
  const reading = computeGochara(natalMoon.signIndex, sky, asOf, true, { ownMarks });
  return { asOf, natalMoonSign: natalMoon.signIndex, natalLagnaSign, birthStar: natalMoon.nakshatraIndex,
    transitMoonStar: transitMoon.nakshatraIndex, tara: taraOf(natalMoon.nakshatraIndex, transitMoon.nakshatraIndex),
    periodLordFromMoon: periodLord ? periodLordMoonHouse(periodLord, natalMoon.signIndex, sky) : undefined,
    rows: reading.rows.map((r) => ({ planet: r.planet, signIndex: r.signIndex, moonHouse: r.house,
      lagnaHouse: houseFrom(natalLagnaSign, r.signIndex), favourableByHouse: r.favourable, verdict: r.verdict,
      vedhaBy: r.vedhaBy, aspectBy: r.aspectNote?.by ?? [], avMarks: r.avMarks, avOverride: !!r.avNote,
      modifierConflict: r.modifierConflict?.text,
      dignity: r.dignityNote ? sky.find((p) => p.planet === r.planet)?.dignity : undefined, combust: r.combust })) };
}

/** The modified verdict remains separate from the plain Moon-house label. */
export function moonTransitDetails(row: MoonTransitRow): string {
  const parts = [row.favourableByHouse ? "favourable house from the Moon" : "other house from the Moon"];
  if (row.avOverride) parts.push(`${row.avMarks} of 8 own Ashtakavarga marks applied`);
  if (row.vedhaBy.length) parts.push(`vedha: ${row.vedhaBy.join(", ")}`);
  if (row.dignity) parts.push(`transit dignity: ${row.dignity.toLowerCase()}${row.combust ? ", combust" : ""}`);
  else if (row.combust) parts.push("combust in transit");
  if (row.aspectBy.length) parts.push(`transit aspect: ${row.aspectBy.join(", ")}`);
  if (row.modifierConflict) parts.push(row.modifierConflict);
  return parts.join("; ");
}
