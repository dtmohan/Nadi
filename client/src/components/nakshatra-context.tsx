import React from "react";
import type { PlanetContext } from "@shared/planet-context";
import { NAIK_PADA_SOURCE, SUTTON_QUARTER_SOURCE } from "@shared/nakshatra-context";
import { dispositorDisplayRows, nakshatraDisplayRows } from "@shared/nakshatra-context-display";
import { formatHouseQuarters, houseQuarterFrames } from "@shared/house-dispositor-context";
import type { ShadbalaBase } from "@shared/shadbala";
import { SourceLink } from "@/components/source-link";

/** The same frame-specific observations appear wherever a chart is being examined. */
export function NakshatraContextPanel({ context, angles, label = "Planet and ascendant quarters" }: { context: PlanetContext; angles?: Pick<ShadbalaBase, "asc" | "mc">; label?: string }) {
  const rows = nakshatraDisplayRows(context);
  const dispositors = dispositorDisplayRows(context);
  const frames = houseQuarterFrames(context, angles);
  const kpFrame = context.frame.houseMethod === "placidus";
  return <details className="nadi-info-card mt-3 text-xs" data-testid="nakshatra-context">
    <summary className="nadi-info-summary">{label}</summary>
    <p className="mt-2 text-muted-foreground">
      Selected {context.frame.ayanamsa ?? "unspecified"} ayanamsa. Each quarter is one D9 interval, so its D9 sign is the same placement viewed another way; it is not independent confirmation. Close boundaries depend on the birth time and calculation settings.
    </p>
    <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[38rem] text-left">
      <thead><tr className="border-b text-muted-foreground"><th className="py-1 pr-3">Point</th><th className="pr-3">Star · quarter</th><th className="pr-3">Star lord</th><th className="pr-3">D9 sign</th><th className="pr-3">Qualifications</th>{!kpFrame && <th>BNN solar quarter</th>}</tr></thead>
      <tbody>{rows.map((r) => <tr className="border-b last:border-0" key={r.point} data-testid={`nakshatra-row-${r.point}`}>
        <td className="py-1 pr-3 font-medium">{r.point}</td><td className="pr-3">{r.star}</td><td className="pr-3">{r.starLord}</td><td className="pr-3">{r.navamsa}</td><td className="pr-3">{r.qualifications}</td>{!kpFrame && <td>{r.solar}</td>}
      </tr>)}</tbody>
    </table></div>
    <p className="mt-2 text-muted-foreground">
      The labelled qualifications are descriptive and add no event-score points. Sutton's ashtamamsha counts the D9 sign from that point's D1 sign; the ascendant row shows the same geometry. <SourceLink source={SUTTON_QUARTER_SOURCE} />
    </p>
    {!kpFrame && <p className="mt-1 text-muted-foreground">
      Naik's BNN solar condition uses the Sun's actual quarter. “Near, different quarter” is within 3°20′ but does not satisfy that condition. Sun and nodes are excluded by the app's existing convention; Parashari uses its separate solar orbs. This correction can change BNN readings. <SourceLink source={NAIK_PADA_SOURCE} />
    </p>}
    {kpFrame && <p className="mt-1 text-muted-foreground">This is the KP ayanamsa and Placidus frame. The D9 and Sutton labels are comparative geometry, not KP sub-lords or KP event conditions.</p>}
    <details className="mt-3 border-t pt-2" data-testid="dispositor-explorer">
      <summary className="cursor-pointer font-medium">Where the sign, star and D9 lords are</summary>
      <p className="mt-1 text-muted-foreground">Descriptive placements in the selected {context.frame.ayanamsa ?? "unspecified"} D1 frame. H means whole-sign house from the D1 or D9 ascendant, respectively; counts run from the point to its lord. A D9 lord is not a KP sub-lord. A relationship alone adds no score or prediction.</p>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[52rem] text-left">
        <thead><tr className="border-b text-muted-foreground"><th className="pr-3">Point</th><th className="pr-3">Sign lord</th><th className="pr-3">Star lord</th><th>D9 sign lord</th></tr></thead>
        <tbody>{dispositors.map((r) => <tr className="border-b last:border-0" key={r.point} data-testid={`dispositor-row-${r.point}`}><td className="py-1 pr-3 font-medium">{r.point}</td><td className="pr-3">{r.signLord}</td><td className="pr-3">{r.starLord}</td><td>{r.navamsaLord}</td></tr>)}</tbody>
      </table></div>
    </details>
    <details className="mt-3 border-t pt-2" data-testid="house-quarter-explorer">
      <summary className="cursor-pointer font-medium">Houses, stars and quarters</summary>
      <p className="mt-1 text-muted-foreground">These are the quarters intersecting each house's actual span. A whole-sign house contains nine complete quarters; a shifted or unequal house can intersect partial quarters. This is geometry, not an independent prediction.</p>
      {frames.map((frame) => <details className="mt-2" key={frame.label}><summary className="cursor-pointer">{frame.label}</summary><div className="overflow-x-auto"><table className="mt-1 w-full text-left"><tbody>{frame.houses.map((house) => <tr className="border-b last:border-0" key={house.house}><td className="py-1 pr-3 align-top font-medium">H{house.house}</td><td>{formatHouseQuarters(house)}</td></tr>)}</tbody></table></div></details>)}
    </details>
  </details>;
}
