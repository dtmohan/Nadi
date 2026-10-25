import { DateTime } from "luxon";
import { PLANET_ABBR, SIGNS, SIGN_ABBR, type Planet, type TransitPeriod } from "@shared/astro";
import type { Vimshottari, KpPeriod } from "@shared/kp";
import type { CharaDasha } from "@shared/jaimini";
import { effectiveOutcome, matterOf, type ChartEvent } from "@shared/events";
import type { AvTransitRow } from "@shared/av-transit";
import { LIFE_AREAS, type LifeArea } from "@shared/rules";
import { areaTouches, type AreaTouch, type TransitReading } from "@shared/timing";
import { AREA_ONSET, dateAtAge } from "@shared/life-stage";
import { elementColor, planetColor } from "@/components/planet-name";
import { markTone, type TlBand, type TlMark, type TlRow, type TlWindow } from "@/components/life-timeline";

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

/** Jupiter's or Saturn's sign passages as one band, coloured by the sign's element. */
export function transitBand(transits: TransitPeriod[], planet: "Jupiter" | "Saturn", asOfIso: string): TlBand {
  const now = DateTime.fromISO(asOfIso);
  return {
    id: planet.toLowerCase(),
    label: planet,
    segments: transits
      .filter((t) => t.planet === planet)
      .map((t) => ({
        start: t.start,
        end: t.end,
        label: SIGN_ABBR[t.signIndex],
        color: elementColor(t.signIndex),
        current: now >= DateTime.fromISO(t.start) && now < DateTime.fromISO(t.end),
        title: `${planet} in ${t.sign} · ${fmt(t.start)} to ${fmt(t.end)}`,
      })),
  };
}

type Verdict3 = "support" | "strain" | "mixed";
const VERDICT_WORD: Record<Verdict3, string> = { support: "favourable", mixed: "mixed", strain: "trying" };
/** Verdict fills; in the plain reading the trying end is drawn lighter (gentle-results policy). */
function verdictFill(t: Verdict3, plain?: boolean): string {
  if (t === "support") return "hsl(var(--verdict-good))";
  if (t === "mixed") return "hsl(var(--verdict-mixed))";
  return plain ? "hsl(var(--verdict-bad) / 0.6)" : "hsl(var(--verdict-bad))";
}

/**
 * Vimshottari dasas and, as a thin band beneath, their bhuktis. With `bhuktiVerdict` (Parashari only) each
 * bhukti is tinted by its antar verdict instead of its lord's colour. With `dasaMatters` and `bhuktiMatters`
 * (Parashari only) each period's hover title and readout carry its matters, as the Timing chapter gives them; they
 * change no colour.
 */
export function vimshottariBands(
  vim: Vimshottari,
  opts: {
    label?: string;
    bhuktis?: boolean;
    bhuktiVerdict?: (b: KpPeriod) => { verdict: Verdict3; source?: string } | undefined;
    dasaMatters?: (d: KpPeriod) => string | undefined;
    bhuktiMatters?: (b: KpPeriod) => string | undefined;
    plain?: boolean;
  } = {},
): TlBand[] {
  const out: TlBand[] = [
    {
      id: "dasa",
      label: opts.label ?? "Dasa",
      segments: vim.dasas.map((d) => {
        const matters = opts.dasaMatters?.(d);
        const title = `${d.lord} ${opts.plain ? "period" : "dasa"} · ${fmt(d.start)} to ${fmt(d.end)}`;
        return { start: d.start, end: d.end, label: d.lord, short: PLANET_ABBR[d.lord], color: planetColor(d.lord), current: d.current, title: matters ? `${title}\n${matters}` : title, matters };
      }),
    },
  ];
  if (opts.bhuktis !== false) {
    out.push({
      id: "bhukti",
      label: "Bhukti",
      thin: true,
      segments: vim.bhuktis.map((b) => {
        const v = opts.bhuktiVerdict?.(b);
        const matters = opts.bhuktiMatters?.(b);
        const word = opts.plain ? "sub-period" : "bhukti";
        const title = v
          ? `${b.dasaLord}–${b.lord} ${word} · ${fmt(b.start)} to ${fmt(b.end)} · ${VERDICT_WORD[v.verdict]}${v.source && !opts.plain ? ` (${v.source})` : ""}`
          : `${b.dasaLord}–${b.lord} bhukti · ${fmt(b.start)} to ${fmt(b.end)}`;
        return {
          start: b.start,
          end: b.end,
          label: PLANET_ABBR[b.lord],
          color: v ? verdictFill(v.verdict, opts.plain) : planetColor(b.lord),
          ink: v && v.verdict === "strain" && opts.plain ? ("fg" as const) : undefined,
          current: b.current,
          readout: v ? `${PLANET_ABBR[b.lord]}, ${VERDICT_WORD[v.verdict]}` : undefined,
          title: matters ? `${title}\n${matters}` : title,
          matters,
        };
      }),
    });
  }
  return out;
}

/** Chara mahadashas and, as a thin band beneath, their antardashas; coloured by the sign's element. */
export function charaBands(chara: CharaDasha, asOfIso: string): TlBand[] {
  const now = DateTime.fromISO(asOfIso);
  const running = (s: string, e: string) => now >= DateTime.fromISO(s) && now < DateTime.fromISO(e);
  return [
    {
      id: "chara",
      label: "Chara",
      segments: chara.periods.map((p) => ({ start: p.start, end: p.end, label: p.signName, short: SIGN_ABBR[p.sign], color: elementColor(p.sign), current: running(p.start, p.end), title: `${p.signName} mahadasha · ${p.years} years · ${fmt(p.start)} to ${fmt(p.end)}` })),
    },
    {
      id: "chara-ad",
      label: "Antar",
      thin: true,
      segments: chara.periods.flatMap((p) => p.antardashas.map((a) => ({ start: a.start, end: a.end, label: SIGN_ABBR[a.sign], color: elementColor(a.sign), current: running(a.start, a.end), title: `${p.signName}–${SIGNS[a.sign]} antardasha · ${fmt(a.start)} to ${fmt(a.end)}` }))),
    },
  ];
}

/** The chart's recorded life events as dots, tinted by their outcome (or the matter's nature). */
export function eventMarks(events: ChartEvent[] | undefined, zone: string): TlMark[] {
  return (events ?? []).map((e) => {
    const m = matterOf(e.matter);
    const iso = DateTime.fromISO(e.date, { zone }).toISO()!;
    return { id: e.id, date: iso, label: m.label, tone: markTone(effectiveOutcome(e)), title: `${m.label}${e.note ? ` · ${e.note}` : ""} · ${DateTime.fromISO(e.date).toFormat("d LLL yyyy")}` };
  });
}

const AV_OWN_PLAIN: Record<AvTransitRow["ownVerdict"], string> = {
  favourable: "favourable by its own points",
  even: "even by its own points",
  adverse: "low by its own points",
};
const AV_BAND_PLAIN: Record<AvTransitRow["band"], string> = {
  favourable: "a strong sign by everyone's points",
  medium: "a middling sign by everyone's points",
  adverse: "a weak sign by everyone's points",
};

/**
 * Jupiter's or Saturn's sign passages coloured by the Transits section's joint tone: the planet's own
 * Ashtakavarga marks in the sign (66.70-72) with the sign's aggregate (72.3-5). The chapter-70 points
 * are not drawn here.
 */
export function avTransitBand(rows: AvTransitRow[], planet: "Jupiter" | "Saturn", plain?: boolean): TlBand {
  return {
    id: planet.toLowerCase(),
    label: planet,
    segments: rows.map((r) => ({
      start: r.start,
      end: r.end,
      label: SIGN_ABBR[r.signIndex],
      color: verdictFill(r.tone, plain),
      ink: r.tone === "strain" && plain ? ("fg" as const) : undefined,
      current: r.current,
      readout: `${SIGN_ABBR[r.signIndex]}, ${VERDICT_WORD[r.tone]}`,
      title: plain
        ? `${planet} in ${SIGNS[r.signIndex]} · ${fmt(r.start)} to ${fmt(r.end)} · ${AV_OWN_PLAIN[r.ownVerdict]}, in ${AV_BAND_PLAIN[r.band]}: ${VERDICT_WORD[r.tone]}`
        : `${planet} in ${SIGNS[r.signIndex]} · ${fmt(r.start)} to ${fmt(r.end)} · ${r.ownRekhas} of 8 rekhas in its own chart (${r.ownVerdict}, 66.70-72), ${r.sarva} in the aggregate (${r.band}, 72.3-5): ${VERDICT_WORD[r.tone]}`,
    })),
  };
}

/** Opacity of a BNN passage by how much of the chart it wakes (readTransit weight 0-3). */
const WEIGHT_ALPHA = [0.16, 0.38, 0.7, 1] as const;
const abbrs = (ps: Planet[]) => ps.map((p) => PLANET_ABBR[p]).join(" ");

/**
 * BNN: Jupiter's or Saturn's passages in the planet's own colour, deeper the more of the birth chart the
 * passage wakes: faint when it touches no natal planet, full over a planet, strongest over a cluster or
 * in a double transit (readTransit weight). Labels name the natal planets passed over.
 */
export function bnnPassageBand(
  readings: TransitReading[],
  planet: "Jupiter" | "Saturn",
  asOfIso: string,
  soften: (t: string) => string = (t) => t,
): TlBand {
  const now = DateTime.fromISO(asOfIso);
  const hue = `--planet-${planet.toLowerCase()}`;
  return {
    id: planet.toLowerCase(),
    label: planet,
    segments: readings
      .filter((r) => r.period.planet === planet)
      .map((r) => {
        const t = r.period;
        const sign = SIGN_ABBR[t.signIndex];
        const what = r.conjunct.length
          ? `over ${abbrs(r.conjunct)}`
          : r.trine.length
            ? `trine ${abbrs(r.trine)}`
            : r.opposite.length
              ? `facing ${abbrs(r.opposite)}`
              : "quiet";
        const current = now >= DateTime.fromISO(t.start) && now < DateTime.fromISO(t.end);
        return {
          start: t.start,
          end: t.end,
          label: r.weight >= 2 ? (r.conjunct.length ? `${sign} · ${abbrs(r.conjunct)}` : sign) : "",
          short: r.weight >= 2 ? sign : undefined,
          color: `hsl(var(${hue}) / ${WEIGHT_ALPHA[r.weight]})`,
          // Translucent fills take a text-coloured label with a halo; the running full-strength passage keeps the usual label.
          ink: current && r.weight === 3 ? undefined : ("fg" as const),
          current,
          readout: `${sign}, ${what}`,
          title: `${planet} in ${t.sign} · ${fmt(t.start)} to ${fmt(t.end)} · ${soften(r.headline)}`,
        };
      }),
  };
}

const CONTACT_WORD: Record<AreaTouch["contact"], string> = { over: "over", trine: "in trine to", "7th": "facing" };
const CONTACT_SHORT: Record<AreaTouch["contact"], string> = { over: "over", trine: "trine", "7th": "facing" };
/** Drawn opacity for the contacts: over full, trine lighter, the 7th faintest. */
const CONTACT_STRENGTH_DRAWN: Record<AreaTouch["contact"], number> = { over: 1, trine: 0.45, "7th": 0.1 };
const CONTACT_SHARE: Record<AreaTouch["contact"], string> = {
  over: "full strength",
  trine: "about three-quarter strength",
  "7th": "about half strength",
};
const AREA_PLAIN: Record<string, string> = {
  career: "work matters come forward",
  wealth: "money matters come forward",
  health: "health matters come forward",
  family: "family matters come forward",
};
const AREA_ROW_LABEL: Record<string, string> = { career: "Career", wealth: "Wealth", health: "Health", family: "Family" };

/**
 * BNN matter rows: for each area, the passages that bring the area's own lines to life (the areas the
 * Timing list names for a passage), Jupiter in the top lane and Saturn in the lower one, so both lit at
 * once is the double transit. Rows open at the area's onset age where one is set (life-stage.ts).
 */
export function bnnAreaRows(
  readings: TransitReading[],
  areas: readonly LifeArea[],
  birthIso: string,
  plain: boolean,
  soften: (t: string) => string = (t) => t,
): TlRow[] {
  return areas.map((area) => {
    const onset = AREA_ONSET[area] !== undefined ? Date.parse(dateAtAge(birthIso, AREA_ONSET[area])) : -Infinity;
    const windows: TlWindow[] = [];
    for (const r of readings) {
      const planet = r.period.planet;
      if (planet !== "Jupiter" && planet !== "Saturn") continue;
      if (Date.parse(r.period.end) <= onset) continue;
      const touch = areaTouches(r, [area])[0];
      if (!touch) continue;
      const start = Date.parse(r.period.start) < onset ? new Date(onset).toISOString() : r.period.start;
      const lead = touch.findings[0];
      windows.push({
        start,
        end: r.period.end,
        lane: planet === "Jupiter" ? 0 : 1,
        tone: "neutral",
        color: planetColor(planet),
        strength: CONTACT_STRENGTH_DRAWN[touch.contact],
        short: `${PLANET_ABBR[planet]} ${CONTACT_SHORT[touch.contact]} ${abbrs(touch.planets)}`,
        label: plain
          ? `${planet} in ${r.period.sign}, ${CONTACT_WORD[touch.contact]} your ${touch.planets.join(", ")}: ${AREA_PLAIN[area] ?? "these matters come forward"}`
          : `${planet} in ${r.period.sign} ${CONTACT_WORD[touch.contact]} natal ${touch.planets.join(", ")}: ${touch.findings.length} ${LIFE_AREAS[area].label.toLowerCase()} line${touch.findings.length === 1 ? "" : "s"} brought to life at ${CONTACT_SHARE[touch.contact]} (provisional)${lead ? `; first: ${soften(lead.text)}` : ""}`,
      });
    }
    return { id: area, label: AREA_ROW_LABEL[area] ?? LIFE_AREAS[area].label, windows, lanes: 2 };
  });
}
