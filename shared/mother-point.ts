import { NAKSHATRAS, SIGNS, type TransitPeriod, type NakshatraPeriod, type SignPeriod } from "./astro";
import { bhinnaOf, type AshtakavargaResult } from "./ashtakavarga";
import { BPHS_URL } from "./parashari-data";

/**
 * Parashara 70.21-23. Three rules from the Moon's Ashtakavarga: (a) no auspicious functions while the Moon
 * transits a sign holding more dots than rekhas in the Moon's chart; (b) mother, house and village are read
 * from the 4th from the Moon, its rekhas times the Moon's yoga pinda giving, by 27, the nakshatra whose Saturn
 * transit brings death or distress to the mother and, by 12, the sign whose transit may bring her death;
 * (c) trines of that nakshatra and sign bring distress only.
 *
 * The sensitive-content gate (shared/life-stage.ts): for a native under 18 the rows whose severity names the
 * mother's passing are dropped here — the sign-point and nakshatra-point rows — while the trine rows, which
 * the verse limits to distress, remain. The generic redaction still strips the caveat that quotes the verse.
 */
export type MotherSeverity = "death or distress" | "death may occur" | "distress";

export interface MotherPointRow {
  kind: "nakshatra" | "sign" | "trine nakshatra" | "trine sign";
  label: string;
  start: string;
  end: string;
  retrogradeEntry: boolean;
  age: number;
  current: boolean;
  severity: MotherSeverity;
  /** Running Vimshottari maha dasa and the app's verdict on it, offered by analogy with 70.11 and 70.14 (provisional). */
  runningDasa: { lord: string; verdict: "support" | "strain" | "mixed" } | null;
  text: string;
}

export interface MoonCalendarRow {
  start: string;
  end: string;
  signIndex: number;
  rekhas: number;
  current: boolean;
  verdict: "avoid" | "fit" | "even";
}

export interface MotherPointReading {
  pointSign: number;
  pointNakshatra: number;
  rekhas: number;
  product: number;
  rows: MotherPointRow[];
  hasNakshatras: boolean;
  calendar: MoonCalendarRow[] | null;
  sources: typeof MOTHER_SOURCES;
  caveats: string[];
}

export const MOTHER_SOURCES = {
  point: { label: "Parashara 70.21-23", url: BPHS_URL(70) },
  calendar: { label: "Parashara 70.21", url: BPHS_URL(70) },
  dasa: { label: "Parashara 70.11, 70.14 by analogy", url: BPHS_URL(70), provisional: true },
};

export const MOTHER_CAVEATS = [
  "70.21-23 gives the mother no counterpart to the 4th-from-Sun planets of 70.12: only the nakshatra, the sign and their trines are tested, with the severity the verses assign to each.",
  "The running dasa is shown by analogy with 70.11 and 70.14 (death when an unfavourable dasa runs, adverse effects only when a favourable one does); the verses on the mother do not state this, so it is provisional.",
  "\"Larger number of dots\" for the Moon's monthly rule is taken as fewer than four rekhas of eight; four is read as even and five or more as fit (provisional threshold, as for the Sun's rule).",
  "The Moon's sign passages are computed for thirty days from the day the chart was opened; reopen the chart for a fresh month.",
];

interface DasaReadingLike {
  lord: string;
  start: string;
  end: string;
  verdict: "support" | "strain" | "mixed";
}

export function readMotherPoint(
  av: AshtakavargaResult,
  transits: TransitPeriod[],
  saturnNakshatras: NakshatraPeriod[] | undefined,
  moonMonth: SignPeriod[] | undefined,
  dasaReadings: DasaReadingLike[],
  birthIso: string,
  asOfIso: string,
  withhold = false,
): MotherPointReading | null {
  const point = av.saturnPoints.find((p) => p.owner === "Moon" && p.houseFrom === 4);
  if (!point) return null;
  const birth = Date.parse(birthIso);
  const now = Date.parse(asOfIso);
  const age = (iso: string) => Math.round(((Date.parse(iso) - birth) / (365.25 * 86400e3)) * 10) / 10;
  const isNow = (s: string, e: string) => Date.parse(s) <= now && now < Date.parse(e);
  const dasaAt = (s: string, e: string) => {
    const mid = (Date.parse(s) + Date.parse(e)) / 2;
    const d = dasaReadings.find((x) => Date.parse(x.start) <= mid && mid < Date.parse(x.end));
    return d ? { lord: d.lord, verdict: d.verdict } : null;
  };
  const rows: MotherPointRow[] = [];
  for (const t of transits) {
    if (t.planet !== "Saturn") continue;
    const kind = t.signIndex === point.transitSignIndex ? "sign" : point.trineSigns.includes(t.signIndex) ? "trine sign" : null;
    if (!kind) continue;
    const severity: MotherSeverity = kind === "sign" ? "death may occur" : "distress";
    const dasa = dasaAt(t.start, t.end);
    rows.push({
      kind,
      label: SIGNS[t.signIndex],
      start: t.start,
      end: t.end,
      retrogradeEntry: t.retrogradeEntry,
      age: age(t.start),
      current: isNow(t.start, t.end),
      severity,
      runningDasa: dasa,
      text: kind === "sign" ? `Saturn in ${SIGNS[t.signIndex]}, the mother's sign point: her death may occur.` : `Saturn in ${SIGNS[t.signIndex]}, a trine of the mother's sign point: distress to the mother.`,
    });
  }
  for (const n of saturnNakshatras ?? []) {
    const kind = n.nakshatraIndex === point.nakshatraIndex ? "nakshatra" : point.trineNakshatras.includes(n.nakshatraIndex) ? "trine nakshatra" : null;
    if (!kind) continue;
    const severity: MotherSeverity = kind === "nakshatra" ? "death or distress" : "distress";
    rows.push({
      kind,
      label: NAKSHATRAS[n.nakshatraIndex],
      start: n.start,
      end: n.end,
      retrogradeEntry: n.retrogradeEntry,
      age: age(n.start),
      current: isNow(n.start, n.end),
      severity,
      runningDasa: dasaAt(n.start, n.end),
      text: kind === "nakshatra" ? `Saturn in ${NAKSHATRAS[n.nakshatraIndex]}, the mother's nakshatra point: death of, or distress to, the mother.` : `Saturn in ${NAKSHATRAS[n.nakshatraIndex]}, a trine of the mother's nakshatra point: distress to the mother.`,
    });
  }
  rows.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  for (const r of rows) {
    if (r.runningDasa) {
      r.text +=
        r.runningDasa.verdict === "support"
          ? ` The ${r.runningDasa.lord} dasa reads as favourable, which by analogy with 70.11 and 70.14 would limit this to adverse effects.`
          : r.runningDasa.verdict === "strain"
            ? ` The ${r.runningDasa.lord} dasa reads as adverse, which by analogy with 70.11 gives no such relief.`
            : ` The ${r.runningDasa.lord} dasa reads as mixed.`;
    }
  }
  const shown = withhold ? rows.filter((r) => r.severity === "distress") : rows;
  const moon = bhinnaOf(av, "Moon");
  const calendar: MoonCalendarRow[] | null =
    moonMonth && moon
      ? moonMonth.map((m) => {
          const rekhas = moon.rekhas[m.signIndex];
          return { start: m.start, end: m.end, signIndex: m.signIndex, rekhas, current: isNow(m.start, m.end), verdict: rekhas <= 3 ? "avoid" : rekhas >= 5 ? "fit" : "even" };
        })
      : null;
  return {
    pointSign: point.transitSignIndex,
    pointNakshatra: point.nakshatraIndex,
    rekhas: point.rekhas,
    product: point.product,
    rows: shown,
    hasNakshatras: !!saturnNakshatras,
    calendar,
    sources: MOTHER_SOURCES,
    caveats: MOTHER_CAVEATS,
  };
}
