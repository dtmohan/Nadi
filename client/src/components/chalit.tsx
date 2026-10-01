import { useState } from "react";
import {
  CHALIT_METHODS,
  CHALIT_METHOD_LABEL,
  signDeg,
  type ChalitConstruction,
  type ChalitMethod,
  type ChalitPlanet,
  type ChalitResult,
} from "@shared/chalit";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ModeText, SectionTitle } from "@/components/mode-text";

const ord = (n: number) =>
  `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

const pct = (x: number) => `${Math.round(x * 100)}%`;

function EffectPill({ p }: { p: ChalitPlanet }) {
  return (
    <span
      className={cn(
        "rounded px-1 py-0.5 text-2xs tabular-nums",
        p.atSandhi
          ? "bg-verdict-bad/10 text-verdict-bad"
          : p.effect >= 0.5
            ? "bg-verdict-good/15 text-verdict-good"
            : "bg-muted text-muted-foreground",
      )}
      title={`${pct(p.effect)} of the bhava's full effect; ${p.sandhiGap.toFixed(2)}° from the ${ord(p.sandhiBetween[0])}–${ord(p.sandhiBetween[1])} sandhi`}
    >
      {p.atSandhi ? "sandhi" : pct(p.effect)}
    </span>
  );
}

function HouseCell({ p }: { p: ChalitPlanet }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap",
        p.shifted && "rounded bg-verdict-mixed/15 px-1",
      )}
    >
      <span className="tabular-nums">{ord(p.chalitHouse)}</span>
      <EffectPill p={p} />
    </span>
  );
}

function HouseTable({ k }: { k: ChalitConstruction }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <Table className="mt-2" data-testid={`chalit-table-${k.method}`}>
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 sm:px-4">House</TableHead>
            <TableHead
              className="px-2 sm:px-4"
              title="Midpoint of the house; the house is named after this sign"
            >
              <span className="sm:hidden">Madhya</span>
              <span className="hidden sm:inline">Madhya (house sign)</span>
            </TableHead>
            <TableHead className="hidden px-2 sm:table-cell sm:px-4">
              Span
            </TableHead>
            <TableHead className="hidden px-2 md:table-cell md:px-4">
              By rasi
            </TableHead>
            <TableHead className="px-2 sm:px-4">By bhava · effect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {k.bhavas.map((b) => (
            <TableRow
              key={b.house}
              data-testid={`chalit-${k.method}-house-${b.house}`}
            >
              <TableCell className="px-2 py-1.5 tabular-nums sm:px-4">
                {b.house}
              </TableCell>
              <TableCell className="px-2 py-1.5 whitespace-nowrap tabular-nums sm:px-4">
                <SignName signIndex={b.signIndex} />{" "}
                <span className="text-muted-foreground">
                  {signDeg(b.madhya).slice(4)}
                </span>
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
                    const cp = k.planets.find((x) => x.planet === p)!;
                    return (
                      <span
                        key={p}
                        className={cn(
                          "inline-flex items-center gap-1 whitespace-nowrap",
                          cp.shifted && "rounded bg-verdict-mixed/15 px-1",
                        )}
                      >
                        <PlanetName planet={p} />
                        <span className="text-2xs text-muted-foreground">
                          {signDeg(cp.lon)}
                        </span>
                        {cp.shifted && (
                          <span className="text-2xs text-muted-foreground">
                            · from {ord(cp.rasiHouse)}
                          </span>
                        )}
                        <EffectPill p={cp} />
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
  );
}

export function ChalitSection({
  c,
  defaultMethod,
}: {
  c: ChalitResult;
  /** The chart's Parashari house method, when it is a chalit construction; opens the picker on it. */
  defaultMethod?: ChalitMethod;
}) {
  const [caveats, setCaveats] = useState(false);
  const [method, setMethod] = useState<ChalitMethod>(defaultMethod ?? "sripati");
  const k = c[method];
  const moved = c.comparison.filter((x) => !x.unchanged);
  const differ = c.comparison.filter((x) => !x.agree);
  const sandhi = c.comparison.filter(
    (x) => x.sripati.atSandhi || x.equal.atSandhi,
  );
  return (
    <div className="mt-8" data-testid="parashari-chalit">
      <SectionTitle
        plain="House-boundary cross-check"
        technical="Bhava chalit, two constructions"
        term="chalit"
      >
        <span className="rounded bg-verdict-mixed/15 px-1.5 py-0.5 text-xs font-medium text-verdict-mixed">
          provisional
        </span>
      </SectionTitle>
      <ModeText
        plain={
          <>
            The readings on this page treat each whole sign as one house. Two
            other ways draw house boundaries from the exact rising degree (
            {signDeg(c.asc)}): one keeps every house thirty degrees wide, the
            other stretches or squeezes them toward the meridian, so a house can
            straddle two signs. A planet that moves house this way keeps its
            sign, degree and nakshatra; only the house whose matters it speaks
            for changes, and the percentage shows how much of that house's
            effect the old texts allow it (full at the middle, none at a
            boundary). Where the two ways disagree, the choice is yours.
          </>
        }
        practitioner={
          <>
            Two constructions, neither preferred.{" "}
            <SourceLink source={c.sources.sripati} />: lagna {signDeg(c.asc)} as
            the 1st madhya, the meridian {signDeg(c.mc)} as the 10th, the arcs
            between trisected. <SourceLink source={c.sources.equal} />: madhya
            at the lagna degree of every sign, fifteen degrees either side.
            Parashara measures bhava bala on cusps (
            <SourceLink source={c.sources.cusps} />) and prepares bhava charts
            from the special lagnas (<SourceLink source={c.sources.special} />)
            but the translation gives no verse for the madhyas. The effect share
            follows <SourceLink source={c.sources.effect} />: full at the
            madhya, nil at a sandhi, rule of three between;{" "}
            <SourceLink source={c.sources.sandhi} /> reads a sandhi planet as
            ineffective in its dasa and bhukti. A planet that changes bhava
            keeps its sign, degree, nakshatra, dignity and lordships; every
            Parashari reading on this page stays on the whole-sign chart.
          </>
        }
      />

      <p className="mt-2 text-xs" data-testid="chalit-summary">
        {moved.length > 0 ? (
          <>
            Moves house in at least one construction:{" "}
            {moved.map((x, i) => (
              <span key={x.planet}>
                {i > 0 && ", "}
                <PlanetName planet={x.planet} /> ({signDeg(x.lon)}){" "}
                {ord(x.rasiHouse)} to{" "}
                {x.agree
                  ? ord(x.sripati.chalitHouse)
                  : `${ord(x.sripati.chalitHouse)} by Sripati, ${ord(x.equal.chalitHouse)} by equal houses`}
              </span>
            ))}
            .
          </>
        ) : (
          <>No planet changes house in either construction.</>
        )}{" "}
        {differ.length > 0 ? (
          <>
            The constructions disagree on{" "}
            {differ.map((x, i) => (
              <span key={x.planet}>
                {i > 0 && ", "}
                <PlanetName planet={x.planet} />
              </span>
            ))}
            .
          </>
        ) : (
          <>The two constructions agree on every planet.</>
        )}
        {sandhi.length > 0 && (
          <>
            {" "}
            In a sandhi:{" "}
            {sandhi.map((x, i) => (
              <span key={x.planet}>
                {i > 0 && ", "}
                <PlanetName planet={x.planet} /> (
                {[
                  x.sripati.atSandhi ? "Sripati" : null,
                  x.equal.atSandhi ? "equal" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                )
              </span>
            ))}
            .
          </>
        )}
      </p>

      <div className="min-w-0 overflow-x-auto">
        <Table className="mt-3" data-testid="chalit-compare">
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 sm:px-4">Planet</TableHead>
              <TableHead className="px-2 sm:px-4">Rasi</TableHead>
              <TableHead className="px-2 sm:px-4">
                <span className="sm:hidden">Sripati</span>
                <span className="hidden sm:inline">
                  {CHALIT_METHOD_LABEL.sripati}
                </span>
              </TableHead>
              <TableHead className="px-2 sm:px-4">
                <span className="sm:hidden">Equal</span>
                <span className="hidden sm:inline">
                  {CHALIT_METHOD_LABEL.equal}
                </span>
              </TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                Verdict
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.comparison.map((x) => (
              <TableRow
                key={x.planet}
                data-testid={`chalit-compare-${x.planet}`}
              >
                <TableCell className="px-2 py-1.5 whitespace-nowrap sm:px-4">
                  <PlanetName planet={x.planet} />{" "}
                  <span className="hidden text-2xs text-muted-foreground sm:inline">
                    {signDeg(x.lon)}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-1.5 tabular-nums sm:px-4">
                  {ord(x.rasiHouse)}
                </TableCell>
                <TableCell className="px-2 py-1.5 sm:px-4">
                  <HouseCell p={x.sripati} />
                </TableCell>
                <TableCell className="px-2 py-1.5 sm:px-4">
                  <HouseCell p={x.equal} />
                </TableCell>
                <TableCell className="hidden px-2 py-1.5 text-xs text-muted-foreground sm:table-cell sm:px-4">
                  {x.unchanged
                    ? "same as rasi"
                    : x.agree
                      ? `both read the ${ord(x.sripati.chalitHouse)}`
                      : "constructions differ"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div
        className="mt-4 inline-flex rounded-md border bg-muted/40 p-0.5 text-xs"
        role="tablist"
        aria-label="Bhava construction"
      >
        {CHALIT_METHODS.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={method === m}
            onClick={() => setMethod(m)}
            className={cn(
              "rounded px-3 py-1",
              method === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`chalit-method-${m}`}
          >
            {CHALIT_METHOD_LABEL[m]}
          </button>
        ))}
      </div>
      <p className="mt-1 text-2xs text-muted-foreground">
        Houses by <SourceLink source={k.source} />
      </p>
      <HouseTable k={k} />

      <button
        className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setCaveats((x) => !x)}
        data-testid="chalit-caveats"
      >
        {caveats ? "Hide" : "Show"} how the chalit was built ({c.caveats.length}{" "}
        notes)
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
