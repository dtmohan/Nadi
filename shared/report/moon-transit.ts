import { NAKSHATRAS, SIGNS } from "../astro";
import { EVENT_MOON_TRANSIT_NOTE, moonTransitDetails, type MoonTransitContext } from "../transit-context";
import type { ReportPara } from "./types";

/** Identical event-time observations for topic and validation exports. */
export function moonTransitParas(context: MoonTransitContext, label: string, date: string, when: string, source: number): ReportPara[] {
  const slow = context.rows.filter((r) => r.planet === "Jupiter" || r.planet === "Saturn");
  return [
    { kind: "p", text: `Moon-based transit context · ${label} · ${date} · ${when}. Birth Moon: ${SIGNS[context.natalMoonSign]}; ascendant: ${SIGNS[context.natalLagnaSign]}. Transiting Moon in ${NAKSHATRAS[context.transitMoonStar]} gives ${context.tara.name} tara from birth star ${NAKSHATRAS[context.birthStar]}. The star can change during the day.`, cites: [source] },
    { kind: "p", text: `${slow.map((r) => `${r.planet}: house ${r.moonHouse} from the Moon, ${r.verdict}`).join("; ")}.` },
    { kind: "note", text: `${EVENT_MOON_TRANSIT_NOTE} The ascendant column shows position only; it is not a second gochara verdict.`, provisional: true },
    { kind: "table", head: ["Transit", "From Moon", "From ascendant", "Moon verdict", "Basis"], appendix: true,
      rows: context.rows.map((r) => [`${r.planet} · ${SIGNS[r.signIndex]}`, `House ${r.moonHouse}`, `House ${r.lagnaHouse}`, r.verdict, moonTransitDetails(r)]) },
  ];
}
