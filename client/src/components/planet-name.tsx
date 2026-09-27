import type { ReactNode } from "react";
import { PLANET_ABBR, SIGNS, SIGN_ABBR, type Planet } from "@shared/astro";
import { cn } from "@/lib/utils";
import { useChartFocus } from "@/components/chart-focus";

/** CSS colour for a planet: identity colour, used consistently across every panel. */
export function planetColor(p: Planet) {
  return `hsl(var(--planet-${p.toLowerCase()}))`;
}

export type Element = "fire" | "earth" | "air" | "water";
const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];

export function elementOf(signIndex: number): Element {
  return ELEMENTS[((signIndex % 4) + 4) % 4];
}

export function elementColor(signIndex: number) {
  return `hsl(var(--elem-${elementOf(signIndex)}))`;
}

export type TimeGroupKey = "present" | "past" | "future";
export function timeColor(g: TimeGroupKey) {
  return `hsl(var(--time-${g}))`;
}

export function PlanetDot({
  planet,
  className,
}: {
  planet: Planet;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full align-middle",
        className,
      )}
      style={{ backgroundColor: planetColor(planet) }}
    />
  );
}

/**
 * Planet name with its identity dot. `tone` colours the text as well; default keeps the text neutral.
 * Hovering lights the same planet everywhere on the page, including the chart.
 */
export function PlanetName({
  planet,
  abbr,
  tone,
  className,
}: {
  planet: Planet;
  abbr?: boolean;
  tone?: boolean;
  className?: string;
}) {
  const { hovered, setHovered } = useChartFocus();
  const lit = hovered === planet;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-0.5 -mx-0.5 transition-colors",
        className,
      )}
      style={{
        color: tone ? planetColor(planet) : undefined,
        backgroundColor: lit
          ? `color-mix(in srgb, ${planetColor(planet)} 14%, transparent)`
          : undefined,
      }}
      onMouseEnter={() => setHovered(planet)}
      onMouseLeave={() => setHovered(null)}
      data-planet={planet}
    >
      <PlanetDot planet={planet} />
      {abbr ? PLANET_ABBR[planet] : planet}
    </span>
  );
}

export function ElementSwatch({
  signIndex,
  className,
}: {
  signIndex: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-[2px] align-middle",
        className,
      )}
      style={{ backgroundColor: elementColor(signIndex) }}
    />
  );
}

/** Sign name with its element swatch (fire, earth, air, water). */
export function SignName({
  signIndex,
  abbr,
  className,
}: {
  signIndex: number;
  abbr?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        className,
      )}
    >
      <ElementSwatch signIndex={signIndex} />
      {abbr ? SIGN_ABBR[signIndex] : SIGNS[signIndex]}
    </span>
  );
}

export function TimePill({
  group,
  className,
  children,
}: {
  group: TimeGroupKey;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        !children && "capitalize",
        className,
      )}
      style={{
        color: timeColor(group),
        borderColor: `color-mix(in srgb, ${timeColor(group)} 45%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: timeColor(group) }}
      />
      {children ?? group}
    </span>
  );
}

const PLANETS: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
];

export function PlanetLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      data-testid="legend-planets"
    >
      {PLANETS.map((p) => (
        <li key={p}>
          <PlanetName planet={p} />
        </li>
      ))}
    </ul>
  );
}

export function ElementLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      data-testid="legend-elements"
    >
      {ELEMENTS.map((e, i) => (
        <li key={e} className="inline-flex items-center gap-1.5 capitalize">
          <ElementSwatch signIndex={i} />
          {e}
        </li>
      ))}
    </ul>
  );
}
