import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { SIGNS } from "@shared/astro";
import {
  computePrasna,
  PRASNA_CAVEATS,
} from "@shared/rules-prasna";
import { PlanetName } from "@/components/planet-name";
import { Soft } from "@/lib/gentle";
import { cn } from "@/lib/utils";

const ord = (h: number) =>
  h === 1 ? "1st" : h === 2 ? "2nd" : h === 3 ? "3rd" : `${h}th`;

/**
 * Prasna Marga, natal slice: "Effects of Planets in Houses" read for the chart. Each occupied
 * house states what a malefic there brings and what a benefic there brings, as the occupants fall.
 * First pass: the special planet-and-house effects and the empty-house readings are not yet entered.
 */
export function PrasnaPanel({ result }: { result: ChartResult }) {
  const { positions } = result;
  const lagnaIdx = result.jaimini.lagna.signIndex;
  const readings = useMemo(
    () => computePrasna(positions, lagnaIdx),
    [positions, lagnaIdx],
  );

  return (
    <section data-testid="prasna-panel" aria-label="Prasna Marga">
      <h2 className="text-xl font-semibold">Prasna Marga</h2>
      <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">
        The effects of planets in houses, from Prasna Marga (Chapter XIV),
        read whole-sign from the {SIGNS[lagnaIdx]} ascendant. Each occupied
        house states what a malefic there brings and what a benefic there
        brings.
      </p>

      <ul className="mt-4 space-y-3">
        {readings.map((r) => (
          <li
            key={r.house}
            className="rounded-md border bg-card p-3"
            data-testid={`prasna-house-${r.house}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-semibold">
                {ord(r.house)} house
              </span>
              <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {r.occupants.map((p) => (
                  <span key={p.planet} className="inline-flex items-center gap-1">
                    <PlanetName planet={p.planet} />
                  </span>
                ))}
              </span>
              <span className="ml-auto text-2xs text-muted-foreground">
                {r.source}
              </span>
            </div>
            {r.maleficText && (
              <p
                className="mt-1.5 border-l-2 border-verdict-bad/60 pl-2 text-xs leading-relaxed text-foreground/90"
                data-testid={`prasna-malefic-${r.house}`}
              >
                <span className="font-medium text-verdict-bad">
                  {r.malefics.map((p) => p.planet).join(", ")} ·{" "}
                </span>
                <Soft>{r.maleficText}</Soft>
              </p>
            )}
            {r.beneficText && (
              <p
                className="mt-1.5 border-l-2 border-verdict-good/60 pl-2 text-xs leading-relaxed text-foreground/90"
                data-testid={`prasna-benefic-${r.house}`}
              >
                <span className="font-medium text-verdict-good">
                  {r.benefics.map((p) => p.planet).join(", ")} ·{" "}
                </span>
                <Soft>{r.beneficText}</Soft>
              </p>
            )}
          </li>
        ))}
      </ul>

      <ul className={cn("mt-4 space-y-1 text-2xs text-muted-foreground")}>
        {PRASNA_CAVEATS.map((c, i) => (
          <li key={i} data-testid={`prasna-caveat-${i}`}>
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
