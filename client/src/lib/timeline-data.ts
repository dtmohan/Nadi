import { DateTime } from "luxon";
import { PLANET_ABBR, SIGNS, SIGN_ABBR, type TransitPeriod } from "@shared/astro";
import type { Vimshottari } from "@shared/kp";
import type { CharaDasha } from "@shared/jaimini";
import { effectiveOutcome, matterOf, type ChartEvent } from "@shared/events";
import { elementColor, planetColor } from "@/components/planet-name";
import { markTone, type TlBand, type TlMark } from "@/components/life-timeline";

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

/** Vimshottari dasas and, as a thin band beneath, their bhuktis. */
export function vimshottariBands(vim: Vimshottari, opts: { label?: string; bhuktis?: boolean } = {}): TlBand[] {
  const out: TlBand[] = [
    {
      id: "dasa",
      label: opts.label ?? "Dasa",
      segments: vim.dasas.map((d) => ({ start: d.start, end: d.end, label: d.lord, short: PLANET_ABBR[d.lord], color: planetColor(d.lord), current: d.current, title: `${d.lord} dasa · ${fmt(d.start)} to ${fmt(d.end)}` })),
    },
  ];
  if (opts.bhuktis !== false) {
    out.push({
      id: "bhukti",
      label: "Bhukti",
      thin: true,
      segments: vim.bhuktis.map((b) => ({ start: b.start, end: b.end, label: PLANET_ABBR[b.lord], color: planetColor(b.lord), current: b.current, title: `${b.dasaLord}–${b.lord} bhukti · ${fmt(b.start)} to ${fmt(b.end)}` })),
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
