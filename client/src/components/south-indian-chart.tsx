import { SOUTH_INDIAN_CELLS, SIGN_ABBR, SIGNS, PLANET_ABBR, houseFrom, type PlanetPosition, type Planet } from "@shared/astro";

const CELL = 100;
const PAD = 2;

export function planetClass(p: Planet, jeeva: Planet = "Jupiter", deha?: Planet) {
  if (p === jeeva) return "fill-primary font-semibold";
  if (p === "Saturn") return "fill-[hsl(var(--chart-2))] font-semibold";
  if (deha && p === deha) return "fill-[hsl(var(--chart-3))] font-semibold";
  return "fill-foreground";
}

export function SouthIndianChart({
  positions,
  transit,
  title,
  subtitle,
  highlightSign,
  onSignClick,
  jeeva = "Jupiter",
  deha,
  houseKaraka,
}: {
  jeeva?: Planet;
  /** Female chart: Venus, the native as a person, drawn in the third accent. */
  deha?: Planet;
  /** Number the cells as whole-sign houses counted from this planet's sign. */
  houseKaraka?: Planet | null;
  positions: PlanetPosition[];
  transit?: PlanetPosition[];
  title?: string;
  subtitle?: string;
  highlightSign?: number | null;
  onSignClick?: (signIndex: number) => void;
}) {
  const bySign = new Map<number, PlanetPosition[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const transitBySign = new Map<number, PlanetPosition[]>();
  for (const p of transit ?? []) transitBySign.set(p.signIndex, [...(transitBySign.get(p.signIndex) ?? []), p]);
  const karakaSign = houseKaraka ? positions.find((p) => p.planet === houseKaraka)?.signIndex ?? null : null;

  return (
    <svg viewBox={`0 0 ${CELL * 4 + PAD * 2} ${CELL * 4 + PAD * 2}`} className="h-auto w-full" role="img" aria-label="South Indian chart">
      <rect x={PAD} y={PAD} width={CELL * 4} height={CELL * 4} className="fill-card stroke-foreground" strokeWidth={1.5} />
      {SOUTH_INDIAN_CELLS.map(({ signIndex, row, col }) => {
        const x = PAD + col * CELL;
        const y = PAD + row * CELL;
        const natal = bySign.get(signIndex) ?? [];
        const tr = transitBySign.get(signIndex) ?? [];
        const active = highlightSign === signIndex;
        return (
          <g
            key={signIndex}
            onClick={onSignClick ? () => onSignClick(signIndex) : undefined}
            className={onSignClick ? "cursor-pointer" : undefined}
            data-testid={`cell-sign-${signIndex}`}
          >
            <rect x={x} y={y} width={CELL} height={CELL} className={active ? "fill-primary/10 stroke-foreground" : "fill-transparent stroke-foreground"} strokeWidth={1} />
            <text x={x + 6} y={y + 14} className="fill-muted-foreground" fontSize={11} fontWeight={500}>
              {SIGN_ABBR[signIndex]}
            </text>
            {karakaSign !== null && (
              <g data-testid={`house-number-${signIndex}`}>
                <circle cx={x + CELL - 13} cy={y + 12} r={8} className={houseFrom(karakaSign, signIndex) === 1 ? "fill-primary" : "fill-muted"} />
                <text x={x + CELL - 13} y={y + 15.5} textAnchor="middle" fontSize={9.5} fontWeight={600} className={houseFrom(karakaSign, signIndex) === 1 ? "fill-primary-foreground" : "fill-foreground"}>
                  {houseFrom(karakaSign, signIndex)}
                </text>
              </g>
            )}
            {natal.map((p, i) => {
              const perRow = 2;
              const r = Math.floor(i / perRow);
              const c = i % perRow;
              const px = x + 8 + c * 46;
              const py = y + 34 + r * 20;
              return (
                <text key={p.planet} x={px} y={py} fontSize={14} className={planetClass(p.planet, jeeva, deha)}>
                  {PLANET_ABBR[p.planet]}
                  {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? "\u211e" : ""}
                  <tspan fontSize={10} className="fill-muted-foreground tabular" dx={2}>
                    {Math.floor(p.degInSign)}°
                  </tspan>
                </text>
              );
            })}
            {tr.length > 0 && (
              <text x={x + CELL - 6} y={y + CELL - 8} fontSize={11} textAnchor="end" className="fill-muted-foreground" fontStyle="italic">
                {tr.map((p) => `t${PLANET_ABBR[p.planet]}`).join(" ")}
              </text>
            )}
          </g>
        );
      })}
      {/* centre */}
      <g>
        <rect x={PAD + CELL} y={PAD + CELL} width={CELL * 2} height={CELL * 2} className="fill-card stroke-foreground" strokeWidth={1} />
        {title && (
          <text x={PAD + CELL * 2} y={PAD + CELL * 2 - 6} textAnchor="middle" fontSize={16} fontWeight={600} className="fill-foreground font-display">
            {title}
          </text>
        )}
        {subtitle && (
          <text x={PAD + CELL * 2} y={PAD + CELL * 2 + 14} textAnchor="middle" fontSize={11} className="fill-muted-foreground tabular">
            {subtitle}
          </text>
        )}
        <text x={PAD + CELL * 2} y={PAD + CELL * 3 - 12} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
          Rasi · sidereal{houseKaraka ? ` · houses from ${houseKaraka}` : ""}
        </text>
      </g>
    </svg>
  );
}

export function signName(i: number) {
  return SIGNS[i];
}
