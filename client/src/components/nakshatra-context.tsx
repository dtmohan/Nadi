import React from "react";
import type { PlanetContext } from "@shared/planet-context";
import { NAIK_PADA_SOURCE, SUTTON_QUARTER_SOURCE } from "@shared/nakshatra-context";
import { nakshatraDisplayRows } from "@shared/nakshatra-context-display";
import { SourceLink } from "@/components/source-link";

/** The same frame-specific observations appear wherever a chart is being examined. */
export function NakshatraContextPanel({ context, label = "Planet and ascendant quarters" }: { context: PlanetContext; label?: string }) {
  const rows = nakshatraDisplayRows(context);
  return <details className="mt-3 rounded-md border bg-card px-3 py-2 text-xs" data-testid="nakshatra-context">
    <summary className="cursor-pointer font-medium">{label}</summary>
    <p className="mt-2 text-muted-foreground">
      Selected {context.frame.ayanamsa ?? "unspecified"} ayanamsa. Each quarter is one D9 interval, so its D9 sign is the same placement viewed another way; it is not independent confirmation. Close boundaries depend on the birth time and calculation settings.
    </p>
    <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[38rem] text-left">
      <thead><tr className="border-b text-muted-foreground"><th className="py-1 pr-3">Point</th><th className="pr-3">Star · quarter</th><th className="pr-3">Star lord</th><th className="pr-3">D9 sign</th><th className="pr-3">Qualifications</th><th>BNN solar quarter</th></tr></thead>
      <tbody>{rows.map((r) => <tr className="border-b last:border-0" key={r.point} data-testid={`nakshatra-row-${r.point}`}>
        <td className="py-1 pr-3 font-medium">{r.point}</td><td className="pr-3">{r.star}</td><td className="pr-3">{r.starLord}</td><td className="pr-3">{r.navamsa}</td><td className="pr-3">{r.qualifications}</td><td>{r.solar}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="mt-2 text-muted-foreground">
      The labelled qualifications are descriptive and add no event-score points. Sutton's ashtamamsha counts the D9 sign from that point's D1 sign; the ascendant row shows the same geometry. <SourceLink source={SUTTON_QUARTER_SOURCE} />
    </p>
    <p className="mt-1 text-muted-foreground">
      Naik's BNN solar condition uses the Sun's actual quarter. “Near, different quarter” is within 3°20′ but does not satisfy that condition. Sun and nodes are excluded by the app's existing convention; Parashari uses its separate solar orbs. This correction can change BNN readings. <SourceLink source={NAIK_PADA_SOURCE} />
    </p>
  </details>;
}
