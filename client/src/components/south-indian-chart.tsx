import { Fragment } from "react";
import { SOUTH_INDIAN_CELLS, SIGN_ABBR, SIGNS, PLANET_ABBR, houseFrom, type PlanetPosition, type Planet } from "@shared/astro";
import { useChartFocus, type ChartLayout } from "@/components/chart-focus";
import { planetColor } from "@/components/planet-name";

const CELL = 100;
const PAD = 2;
const SIZE = CELL * 4;

/** Minimal planet placement accepted by the chart (rasi positions and divisional positions alike). */
export interface ChartPlanet {
  planet: Planet;
  signIndex: number;
  degInSign: number;
  retrograde?: boolean;
}

/* ------------------------------------------------------------------ glyphs */

/** Stroke-drawn planet glyphs in a 10 x 10 box, so every device renders the same marks. */
const GLYPH: Record<Planet, (c: string) => JSX.Element> = {
  Sun: (c) => (
    <>
      <circle cx={5} cy={5} r={3.7} />
      <circle cx={5} cy={5} r={0.9} fill={c} stroke="none" />
    </>
  ),
  Moon: (c) => <path d="M6.6 1.1 A4 4 0 1 0 6.6 8.9 A3.1 3.1 0 1 1 6.6 1.1 Z" fill={c} stroke="none" />,
  Mars: () => (
    <>
      <circle cx={4.1} cy={5.9} r={2.9} />
      <path d="M6.2 3.8 L9 1 M6.3 1 H9 V3.7" />
    </>
  ),
  Mercury: () => (
    <>
      <circle cx={5} cy={4.7} r={2.3} />
      <path d="M5 7 V10 M3.3 8.6 H6.7 M2.7 0.9 A2.4 2.4 0 0 0 7.3 0.9" />
    </>
  ),
  Jupiter: () => <path d="M1.4 2.7 Q1.9 0.9 3.5 1 Q5.4 1.1 5.2 3 Q5 4.9 2.5 7.1 H9.2 M7.2 4.3 V9.8" />,
  Venus: () => (
    <>
      <circle cx={5} cy={3.9} r={2.9} />
      <path d="M5 6.8 V10 M3.1 8.5 H6.9" />
    </>
  ),
  Saturn: () => <path d="M2.3 0.8 V7.4 M1 2.7 H4.3 M2.3 4.9 Q6.5 2.3 6.8 5.8 Q7 8.3 4.9 9.7" />,
  Rahu: () => <path d="M0.9 9.2 H3.2 Q1.6 7.6 1.6 5.1 A3.4 3.4 0 0 1 8.4 5.1 Q8.4 7.6 6.8 9.2 H9.1" />,
  Ketu: () => <path d="M0.9 0.8 H3.2 Q1.6 2.4 1.6 4.9 A3.4 3.4 0 0 0 8.4 4.9 Q8.4 2.4 6.8 0.8 H9.1" />,
};

export function PlanetGlyph({ planet, x, y, size = 10, color }: { planet: Planet; x: number; y: number; size?: number; color?: string }) {
  const c = color ?? planetColor(planet);
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 10})`} fill="none" stroke={c} strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {GLYPH[planet](c)}
    </g>
  );
}

/* ------------------------------------------------------------------ shared */

interface Props {
  positions: ChartPlanet[];
  transit?: PlanetPosition[];
  title?: string;
  subtitle?: string;
  /** Sign lit as the chosen one; with `secondarySigns` the chart also draws aspect lines from it. */
  highlightSign?: number | null;
  onSignClick?: (signIndex: number) => void;
  jeeva?: Planet;
  /** Female chart: Venus, the native as a person. */
  deha?: Planet;
  /** Number the cells as whole-sign houses counted from this planet's sign. */
  houseKaraka?: Planet | null;
  /** Jaimini and Parashari: mark the ascendant sign and number houses from it. */
  lagnaSign?: number | null;
  /** Small labels drawn at the foot of a cell (arudha padas, karakamsa). */
  badges?: Record<number, string[]>;
  /** Superscript tag after a planet (chara karaka). */
  tags?: Partial<Record<Planet, string>>;
  /** Centre caption; defaults to the BNN caption. */
  footer?: string;
  /** Planets given weight (bold) over the rest; colour always stays the planet's own. */
  accent?: Planet[];
  /** Signs tinted as aspected by the highlighted sign; lines are drawn to them. */
  secondarySigns?: number[];
  /** Force a layout; otherwise the user's preference from the chart settings applies. */
  layout?: ChartLayout;
}

interface Entry {
  p: ChartPlanet;
  x: number;
  y: number;
  size: number;
}

function PlanetEntry({ p, x, y, size, tag, bold, hovered, onHover }: Entry & { tag?: string; bold: boolean; hovered: boolean; onHover: (p: Planet | null) => void }) {
  const color = planetColor(p.planet);
  const fs = size; // abbreviation size; glyph and degree scale from it
  const g = fs * 0.78;
  return (
    <g
      onMouseEnter={() => onHover(p.planet)}
      onMouseLeave={() => onHover(null)}
      className="cursor-default"
      data-testid={`chart-planet-${p.planet}`}
      data-hovered={hovered || undefined}
    >
      {hovered && <rect x={x - 3} y={y - fs - 1} width={fs * 3.4} height={fs + 6} rx={3} style={{ fill: color, fillOpacity: 0.14 }} />}
      <PlanetGlyph planet={p.planet} x={x} y={y - g + 0.5} size={g} />
      <text x={x + g + 3} y={y} fontSize={fs} fontWeight={bold || hovered ? 700 : 600} style={{ fill: color }} className="select-none">
        {PLANET_ABBR[p.planet]}
        {p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? (
          <tspan fontSize={fs * 0.62} dy={-fs * 0.35} dx={0.5}>
            R
          </tspan>
        ) : null}
        {tag ? (
          <tspan fontSize={fs * 0.58} className="fill-primary" dx={1} dy={p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? 0 : -fs * 0.35}>
            {tag}
          </tspan>
        ) : (
          <tspan fontSize={fs * 0.68} className="fill-muted-foreground tabular" dx={2} dy={p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? fs * 0.35 : 0} fontWeight={400}>
            {Math.floor(p.degInSign)}°
          </tspan>
        )}
      </text>
    </g>
  );
}

/** Straight lines from one cell centre to each aspected cell, drawn over the frame. */
function AspectLines({ from, to }: { from: { x: number; y: number }; to: Array<{ x: number; y: number }> }) {
  return (
    <g className="pointer-events-none" data-testid="chart-aspect-lines">
      {to.map((t, i) => (
        <Fragment key={i}>
          <line x1={from.x} y1={from.y} x2={t.x} y2={t.y} className="stroke-primary" strokeWidth={1.4} strokeOpacity={0.55} strokeDasharray="4 3" />
          <circle cx={t.x} cy={t.y} r={3.2} className="fill-primary" fillOpacity={0.85} />
        </Fragment>
      ))}
      <circle cx={from.x} cy={from.y} r={4.2} className="fill-primary" />
    </g>
  );
}

/* ------------------------------------------------------------------ south */

function southCentre(signIndex: number) {
  const c = SOUTH_INDIAN_CELLS.find((k) => k.signIndex === signIndex)!;
  return { x: PAD + c.col * CELL + CELL / 2, y: PAD + c.row * CELL + CELL / 2 };
}

function SouthLayout(props: Props & { hovered: Planet | null; onHover: (p: Planet | null) => void; refSign: number | null; bold: (p: Planet) => boolean }) {
  const { positions, transit, title, subtitle, highlightSign, onSignClick, lagnaSign, badges, tags, footer, secondarySigns, houseKaraka, hovered, onHover, refSign, bold } = props;
  const bySign = new Map<number, ChartPlanet[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const transitBySign = new Map<number, PlanetPosition[]>();
  for (const p of transit ?? []) transitBySign.set(p.signIndex, [...(transitBySign.get(p.signIndex) ?? []), p]);
  const hoveredSign = hovered ? positions.find((p) => p.planet === hovered)?.signIndex ?? null : null;
  const drawLines = highlightSign !== null && highlightSign !== undefined && (secondarySigns?.length ?? 0) > 0;

  return (
    <svg viewBox={`0 0 ${SIZE + PAD * 2} ${SIZE + PAD * 2}`} className="h-auto w-full" role="img" aria-label="South Indian chart">
      <rect x={PAD} y={PAD} width={SIZE} height={SIZE} className="fill-card stroke-foreground" strokeWidth={1.5} />
      {SOUTH_INDIAN_CELLS.map(({ signIndex, row, col }) => {
        const x = PAD + col * CELL;
        const y = PAD + row * CELL;
        const natal = bySign.get(signIndex) ?? [];
        const tr = transitBySign.get(signIndex) ?? [];
        const active = highlightSign === signIndex;
        const aspected = !active && secondarySigns?.includes(signIndex);
        const houseNo = refSign !== null ? houseFrom(refSign, signIndex) : null;
        return (
          <g key={signIndex} onClick={onSignClick ? () => onSignClick(signIndex) : undefined} className={onSignClick ? "cursor-pointer" : undefined} data-testid={`cell-sign-${signIndex}`}>
            <rect x={x} y={y} width={CELL} height={CELL} className={active ? "fill-primary/10 stroke-foreground" : aspected ? "fill-primary/[0.04] stroke-foreground" : "fill-transparent stroke-foreground"} strokeWidth={0.8} />
            {hoveredSign === signIndex && <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} className="pointer-events-none" style={{ fill: planetColor(hovered!), fillOpacity: 0.07 }} />}
            {aspected && <rect x={x + 3} y={y + 3} width={CELL - 6} height={CELL - 6} className="fill-transparent stroke-primary" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 3" />}
            <text x={x + 7} y={y + 14} className="fill-muted-foreground select-none" fontSize={10.5} fontWeight={500} letterSpacing={0.3}>
              {SIGN_ABBR[signIndex]}
            </text>
            {houseNo !== null && (
              <g data-testid={`house-number-${signIndex}`}>
                <circle cx={x + CELL - 13} cy={y + 12} r={8} className={houseNo === 1 ? "fill-primary" : "fill-muted"} />
                <text x={x + CELL - 13} y={y + 15.5} textAnchor="middle" fontSize={9.5} fontWeight={600} className={houseNo === 1 ? "fill-primary-foreground" : "fill-foreground"}>
                  {houseNo}
                </text>
              </g>
            )}
            {lagnaSign === signIndex && (
              <text x={x + 7} y={y + 27} fontSize={10} fontWeight={700} className="fill-primary" data-testid="lagna-marker">
                As
              </text>
            )}
            {natal.map((p, i) => {
              const r = Math.floor(i / 2);
              const c = i % 2;
              const px = x + 7 + c * 46;
              const py = y + (lagnaSign === signIndex ? 42 : 36) + r * 20;
              return <PlanetEntry key={p.planet} p={p} x={px} y={py} size={13} tag={tags?.[p.planet]} bold={bold(p.planet)} hovered={hovered === p.planet} onHover={onHover} />;
            })}
            {badges?.[signIndex]?.length ? (
              <text x={x + 7} y={y + CELL - 7} fontSize={9} fontWeight={600} className="fill-primary" data-testid={`badge-sign-${signIndex}`}>
                {badges[signIndex].join(" · ")}
              </text>
            ) : null}
            {tr.length > 0 && (
              <text x={x + CELL - 6} y={y + CELL - 8} fontSize={10.5} textAnchor="end" className="fill-muted-foreground" fontStyle="italic">
                {tr.map((p) => `t${PLANET_ABBR[p.planet]}`).join(" ")}
              </text>
            )}
          </g>
        );
      })}
      {/* aspect lines run beneath the centre panel, so the caption stays clean */}
      {drawLines && <AspectLines from={southCentre(highlightSign!)} to={secondarySigns!.map(southCentre)} />}
      <rect x={PAD + CELL} y={PAD + CELL} width={CELL * 2} height={CELL * 2} className="fill-card stroke-foreground" strokeWidth={0.8} />
      <g className="pointer-events-none">
        {title && (
          <text x={PAD + CELL * 2} y={PAD + CELL * 2 - 4} textAnchor="middle" fontSize={17} fontWeight={600} className="fill-foreground font-display">
            {title}
          </text>
        )}
        {subtitle && (
          <text x={PAD + CELL * 2} y={PAD + CELL * 2 + 15} textAnchor="middle" fontSize={10.5} className="fill-muted-foreground tabular">
            {subtitle}
          </text>
        )}
        <text x={PAD + CELL * 2} y={PAD + CELL * 3 - 12} textAnchor="middle" fontSize={9.5} className="fill-muted-foreground">
          {footer ?? `Rasi · sidereal${houseKaraka ? ` · houses from ${houseKaraka}` : ""}`}
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ north */

type Pt = [number, number];
interface NorthHouse {
  poly: Pt[];
  anchor: Pt;
  label: Pt;
  /** Columns the planet block may use and the row pitch. */
  cols: number;
}

const NORTH: NorthHouse[] = [
  { poly: [[200, 0], [300, 100], [200, 200], [100, 100]], anchor: [200, 108], label: [200, 18], cols: 2 },
  { poly: [[0, 0], [200, 0], [100, 100]], anchor: [100, 48], label: [100, 14], cols: 2 },
  { poly: [[0, 0], [100, 100], [0, 200]], anchor: [48, 100], label: [14, 22], cols: 1 },
  { poly: [[0, 200], [100, 100], [200, 200], [100, 300]], anchor: [108, 200], label: [22, 200], cols: 2 },
  { poly: [[0, 200], [100, 300], [0, 400]], anchor: [48, 300], label: [14, 378], cols: 1 },
  { poly: [[0, 400], [100, 300], [200, 400]], anchor: [100, 356], label: [100, 390], cols: 2 },
  { poly: [[200, 400], [100, 300], [200, 200], [300, 300]], anchor: [200, 296], label: [200, 386], cols: 2 },
  { poly: [[200, 400], [300, 300], [400, 400]], anchor: [300, 356], label: [300, 390], cols: 2 },
  { poly: [[400, 400], [300, 300], [400, 200]], anchor: [352, 300], label: [386, 378], cols: 1 },
  { poly: [[400, 200], [300, 300], [200, 200], [300, 100]], anchor: [296, 200], label: [382, 200], cols: 2 },
  { poly: [[400, 200], [300, 100], [400, 0]], anchor: [352, 100], label: [386, 22], cols: 1 },
  { poly: [[400, 0], [300, 100], [200, 0]], anchor: [300, 48], label: [300, 14], cols: 2 },
];

function NorthLayout(props: Props & { hovered: Planet | null; onHover: (p: Planet | null) => void; refSign: number; bold: (p: Planet) => boolean }) {
  const { positions, transit, highlightSign, onSignClick, lagnaSign, badges, tags, secondarySigns, hovered, onHover, refSign, bold } = props;
  const bySign = new Map<number, ChartPlanet[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const transitBySign = new Map<number, PlanetPosition[]>();
  for (const p of transit ?? []) transitBySign.set(p.signIndex, [...(transitBySign.get(p.signIndex) ?? []), p]);
  const hoveredSign = hovered ? positions.find((p) => p.planet === hovered)?.signIndex ?? null : null;
  const houseOf = (signIndex: number) => NORTH[houseFrom(refSign, signIndex) - 1];
  const centreOf = (signIndex: number) => ({ x: PAD + houseOf(signIndex).anchor[0], y: PAD + houseOf(signIndex).anchor[1] });
  const drawLines = highlightSign !== null && highlightSign !== undefined && (secondarySigns?.length ?? 0) > 0;
  const FS = 12;
  const ROW = 19;

  return (
    <svg viewBox={`0 0 ${SIZE + PAD * 2} ${SIZE + PAD * 2}`} className="h-auto w-full" role="img" aria-label="North Indian chart">
      <rect x={PAD} y={PAD} width={SIZE} height={SIZE} className="fill-card stroke-foreground" strokeWidth={1.5} />
      {NORTH.map((h, i) => {
        const signIndex = (refSign + i) % 12;
        const natal = bySign.get(signIndex) ?? [];
        const tr = transitBySign.get(signIndex) ?? [];
        const active = highlightSign === signIndex;
        const aspected = !active && secondarySigns?.includes(signIndex);
        const pts = h.poly.map(([x, y]) => `${x + PAD},${y + PAD}`).join(" ");
        const cols = natal.length <= 3 && h.cols === 1 ? 1 : natal.length <= 2 ? Math.min(natal.length, 2) : 2;
        const rows = Math.ceil(natal.length / cols);
        const colW = cols === 1 ? 0 : 42;
        const blockW = cols === 1 ? 36 : 42 * cols;
        const x0 = PAD + h.anchor[0] - blockW / 2 + 2;
        const y0 = PAD + h.anchor[1] - ((rows - 1) * ROW) / 2 + FS * 0.35;
        return (
          <g key={i} onClick={onSignClick ? () => onSignClick(signIndex) : undefined} className={onSignClick ? "cursor-pointer" : undefined} data-testid={`cell-sign-${signIndex}`}>
            <polygon points={pts} className={active ? "fill-primary/10 stroke-foreground" : aspected ? "fill-primary/[0.04] stroke-foreground" : "fill-transparent stroke-foreground"} strokeWidth={0.8} strokeLinejoin="round" />
            {hoveredSign === signIndex && <polygon points={pts} className="pointer-events-none" style={{ fill: planetColor(hovered!), fillOpacity: 0.07 }} />}
            <text x={PAD + h.label[0]} y={PAD + h.label[1] + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={i === 0 ? 700 : 500} className={i === 0 ? "fill-primary select-none" : "fill-muted-foreground select-none"} data-testid={`house-number-${signIndex}`}>
              {i === 0 && lagnaSign === signIndex ? `As ${SIGN_ABBR[signIndex]}` : SIGN_ABBR[signIndex]}
            </text>
            {natal.map((p, k) => {
              const r = Math.floor(k / cols);
              const c = k % cols;
              return <PlanetEntry key={p.planet} p={p} x={x0 + c * colW} y={y0 + r * ROW} size={FS} tag={tags?.[p.planet]} bold={bold(p.planet)} hovered={hovered === p.planet} onHover={onHover} />;
            })}
            {badges?.[signIndex]?.length ? (
              <text x={PAD + h.anchor[0]} y={PAD + h.anchor[1] + ((rows - 1) * ROW) / 2 + FS + 10} textAnchor="middle" fontSize={8.5} fontWeight={600} className="fill-primary" data-testid={`badge-sign-${signIndex}`}>
                {badges[signIndex].join(" · ")}
              </text>
            ) : null}
            {tr.length > 0 && (
              <text x={PAD + h.anchor[0]} y={PAD + h.anchor[1] + ((rows - 1) * ROW) / 2 + FS + 8} textAnchor="middle" fontSize={9.5} className="fill-muted-foreground" fontStyle="italic">
                {tr.map((p) => `t${PLANET_ABBR[p.planet]}`).join(" ")}
              </text>
            )}
          </g>
        );
      })}
      {lagnaSign !== null && lagnaSign !== undefined && lagnaSign !== refSign && (
        <text x={PAD + houseOf(lagnaSign).label[0]} y={PAD + houseOf(lagnaSign).label[1] + 14} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-primary" data-testid="lagna-marker">
          As
        </text>
      )}
      {drawLines && <AspectLines from={centreOf(highlightSign!)} to={secondarySigns!.map(centreOf)} />}
    </svg>
  );
}

/* ------------------------------------------------------------------ public */

/**
 * The chart. Renders the South Indian grid (signs fixed) or the North Indian diamond (houses
 * fixed) according to the reader's preference, with the same data and the same interactions:
 * hover a planet to light it across the page, click a sign to explore what it aspects.
 */
export function SouthIndianChart(props: Props) {
  const focus = useChartFocus();
  const layout = props.layout ?? focus.layout;
  const { positions, houseKaraka, lagnaSign, jeeva = "Jupiter", deha, accent } = props;
  const karakaSign = houseKaraka ? positions.find((p) => p.planet === houseKaraka)?.signIndex ?? null : lagnaSign ?? null;
  const bold = (p: Planet) => (accent ? accent.includes(p) : p === jeeva || p === "Saturn" || (!!deha && p === deha));

  if (layout === "north") {
    const refSign = karakaSign ?? positions.find((p) => p.planet === jeeva)?.signIndex ?? 0;
    return (
      <div>
        <NorthLayout {...props} hovered={focus.hovered} onHover={focus.setHovered} refSign={refSign} bold={bold} />
        {(props.title || props.subtitle || props.footer) && (
          <p className="mt-1.5 text-center text-xs text-muted-foreground" data-testid="chart-caption">
            {props.title && <span className="font-display font-semibold text-foreground">{props.title}</span>}
            {props.subtitle && <span className="tabular"> · {props.subtitle}</span>}
            <span className="block text-2xs">
              {props.footer ?? `Rasi · sidereal${houseKaraka ? ` · houses from ${houseKaraka}` : ""}`} · first house {SIGNS[refSign]} at the top
            </span>
          </p>
        )}
      </div>
    );
  }
  return <SouthLayout {...props} hovered={focus.hovered} onHover={focus.setHovered} refSign={karakaSign} bold={bold} />;
}

export function signName(i: number) {
  return SIGNS[i];
}
