import { useState } from "react";
import { signDeg, type ChalitResult } from "@shared/chalit";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

export function ChalitSection({ c }: { c: ChalitResult }) {
  const [caveats, setCaveats] = useState(false);
  const shifted = c.planets.filter((p) => p.shifted);
  const nearSandhi = c.planets.filter((p) => p.sandhiGap < c.sandhiOrb);
  return (
    <div className="mt-8" data-testid="parashari-chalit">
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        Bhava chalit cross-check
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">Sripati, provisional</span>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Parashara measures bhava bala on cusps (<SourceLink source={c.sources.cusps} />) and has bhava charts prepared from the special lagnas (<SourceLink source={c.sources.special} />), but the translation gives no verse for computing the twelve madhyas, so this table uses <SourceLink source={c.sources.method} />: lagna {signDeg(c.asc)} as the 1st madhya, the meridian {signDeg(c.mc)} as the 10th, and the arcs between trisected. Each bhava runs from the midpoint with one neighbour to the midpoint with the other. Every Parashari reading on this page stays on the whole-sign chart; this shows only where a cusp-based reading would differ.
      </p>
      <p className="mt-2 text-xs" data-testid="chalit-summary">
        {shifted.length > 0 ? (
          <>
            Moves house:{" "}
            {shifted.map((p, i) => (
              <span key={p.planet}>
                {i > 0 && ", "}
                <PlanetName planet={p.planet} /> {ord(p.rasiHouse)} to {ord(p.chalitHouse)}
              </span>
            ))}
            .
          </>
        ) : (
          <>No planet changes house between the rasi and chalit bhavas.</>
        )}
        {nearSandhi.length > 0 && (
          <>
            {" "}
            Within {c.sandhiOrb}° of a sandhi:{" "}
            {nearSandhi.map((p, i) => (
              <span key={p.planet}>
                {i > 0 && ", "}
                <PlanetName planet={p.planet} /> ({p.sandhiGap.toFixed(2)}° from the {ord(p.sandhiBetween[0])}–{ord(p.sandhiBetween[1])} sandhi)
              </span>
            ))}
            .
          </>
        )}
      </p>
      <div className="min-w-0 overflow-x-auto">
        <Table className="mt-2" data-testid="chalit-table">
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 sm:px-4">House</TableHead>
              <TableHead className="px-2 sm:px-4">Madhya</TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">Span</TableHead>
              <TableHead className="hidden px-2 md:table-cell md:px-4">By rasi</TableHead>
              <TableHead className="px-2 sm:px-4">By chalit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.bhavas.map((b) => (
              <TableRow key={b.house} data-testid={`chalit-house-${b.house}`}>
                <TableCell className="px-2 py-1.5 tabular-nums sm:px-4">{b.house}</TableCell>
                <TableCell className="px-2 py-1.5 whitespace-nowrap tabular-nums sm:px-4">
                  <SignName signIndex={b.signIndex} /> <span className="text-muted-foreground">{signDeg(b.madhya).slice(4)}</span>
                </TableCell>
                <TableCell className="hidden px-2 py-1.5 whitespace-nowrap tabular-nums text-muted-foreground sm:table-cell sm:px-4">
                  {signDeg(b.start)} – {signDeg(b.end)}
                </TableCell>
                <TableCell className="hidden px-2 py-1.5 md:table-cell md:px-4">
                  {b.rasiPlanets.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    b.rasiPlanets.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ", "}
                        <PlanetName planet={p} />
                      </span>
                    ))
                  )}
                </TableCell>
                <TableCell className="space-x-1 px-2 py-1.5 sm:px-4">
                  {b.planets.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    b.planets.map((p) => {
                      const cp = c.planets.find((x) => x.planet === p)!;
                      return (
                        <span key={p} className={cn("inline-block whitespace-nowrap", cp.shifted && "rounded bg-amber-500/15 px-1")}>
                          <PlanetName planet={p} />
                          {cp.shifted && <span className="text-[10px] text-muted-foreground"> from {ord(cp.rasiHouse)}</span>}
                        </span>
                      );
                    })
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <button className="mt-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => setCaveats((x) => !x)} data-testid="chalit-caveats">
        {caveats ? "Hide" : "Show"} how the chalit was built ({c.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {c.caveats.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
