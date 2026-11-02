import { SIGNS } from "./astro";
import { navamsaDignity, type NakshatraContext } from "./nakshatra-context";
import type { PlanetContext } from "./planet-context";

/** One descriptive row, reused by the screen and report. */
export interface NakshatraDisplayRow {
  point: string;
  star: string;
  starLord: string;
  navamsa: string;
  qualifications: string;
  solar: string;
}

export function nakshatraDisplayRows(context: PlanetContext): NakshatraDisplayRow[] {
  const traits = (n: NakshatraContext, dignity?: string) => [
    n.vargottama ? "vargottama" : "",
    n.sutton.pushkara ? "Sutton pushkara" : "",
    n.sutton.ashtamamsha ? "Sutton ashtamamsha" : "",
    n.sutton.gandanta ? "Sutton gandanta" : "",
    dignity && dignity !== "other" && dignity !== "unassessed" ? `D9 ${dignity}` : "",
  ].filter(Boolean).join(", ") || "—";
  const rows: NakshatraDisplayRow[] = [];
  if (context.ascendantNakshatra) {
    const n = context.ascendantNakshatra;
    rows.push({ point: "Ascendant", star: `${n.star} ${n.pada}`, starLord: n.starLord,
      navamsa: n.navamsa, qualifications: traits(n), solar: "—" });
  }
  for (const p of context.planets) {
    const n = p.nakshatra;
    const solar = p.naikSolarContact;
    rows.push({ point: p.planet, star: `${n.star} ${n.pada}`, starLord: n.starLord,
      navamsa: SIGNS[n.navamsaSign], qualifications: traits(n, navamsaDignity(p.planet, n.navamsaSign)),
      solar: !solar ? "—" : solar.samePada ? "same quarter" : solar.withinPadaWidth ? "near, different quarter" : "different quarter" });
  }
  return rows;
}
