import { SOUTH_INDIAN_CELLS, type Planet } from "@shared/astro";
import { PlanetGlyph } from "@/components/south-indian-chart";
import { planetColor } from "@/components/planet-name";

export interface MiniPlanet {
  planet: Planet;
  signIndex: number;
  retrograde?: boolean;
}

const CELL = 26;
const SIZE = CELL * 4;
const GLYPH = 7;

/**
 * Thumbnail South Indian chart for list cards: the twelve fixed cells, planet glyphs only,
 * the lagna cell marked by a corner tick, Jupiter and Saturn drawn heavier as the Nadi anchors.
 */
export function MiniChart({
  positions,
  lagnaIdx,
  emphasis = ["Jupiter", "Saturn"],
  className,
}: {
  positions: MiniPlanet[];
  lagnaIdx?: number;
  emphasis?: Planet[];
  className?: string;
}) {
  const bySign = new Map<number, MiniPlanet[]>();
  for (const p of positions)
    bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      className={className}
      aria-hidden
      data-testid="mini-chart"
    >
      <rect
        x={0.5}
        y={0.5}
        width={SIZE - 1}
        height={SIZE - 1}
        rx={2}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
      />
      {SOUTH_INDIAN_CELLS.map(({ signIndex, row, col }) => {
        const x = col * CELL;
        const y = row * CELL;
        const here = bySign.get(signIndex) ?? [];
        const cols = here.length > 4 ? 3 : 2;
        const isLagna = lagnaIdx === signIndex;
        return (
          <g key={signIndex}>
            <rect
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={isLagna ? "hsl(var(--primary) / 0.08)" : "none"}
              stroke="hsl(var(--border))"
              strokeWidth={0.6}
            />
            {isLagna && (
              <path
                d={`M${x + 1} ${y + 6} L${x + 6} ${y + 1}`}
                stroke="hsl(var(--primary))"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            )}
            {here.map((p, i) => {
              const gx =
                x +
                3 +
                (i % cols) * (cols === 3 ? 7 : 10) +
                (cols === 3 ? 0 : 1.5);
              const gy =
                y +
                3 +
                Math.floor(i / cols) * 9.5 +
                (here.length <= cols ? 5 : 0);
              const strong = emphasis.includes(p.planet);
              return (
                <g key={p.planet} opacity={strong ? 1 : 0.7}>
                  <PlanetGlyph
                    planet={p.planet}
                    x={gx}
                    y={gy}
                    size={strong ? GLYPH + 1.5 : GLYPH}
                    color={planetColor(p.planet)}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
