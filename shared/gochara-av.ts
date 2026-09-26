// Ashtakavarga marks for a transiting planet in a sign, read beside the Moon-based gochara verdicts.
//
// Parashara judges transit not from the natal Moon but from the marks of the sign in the transiting planet's own
// Ashtakavarga (BPHS 66.70-72; Saturn again in 70.43-44) and from the aggregate count of the sign (72.3-5).
// Rahu and Ketu have no Ashtakavarga of their own (the eight contributors are the seven planets and the lagna),
// so for them only the aggregate is shown.
import type { Planet } from "./astro";
import type { AshtakavargaResult } from "./ashtakavarga";
import type { BalaSource } from "./shadbala";
import { BPHS_URL } from "./parashari-data";

export type AvOwnVerdict = "favourable" | "even" | "adverse";
export type AvBand = "favourable" | "medium" | "adverse";

export interface GocharaAvMark {
  /** The transiting planet's own chart: rekhas in the sign out of eight, and the 66.70-72 reading. Absent for Rahu and Ketu. */
  own?: { rekhas: number; verdict: AvOwnVerdict };
  /** Sarvashtakavarga count of the sign and its 72.3-5 band. */
  sarva: number;
  band: AvBand;
}

const S = (ch: number, verse: string, provisional?: boolean): BalaSource => ({
  label: `Parashara ${ch}.${verse}`,
  url: BPHS_URL(ch),
  provisional,
});

export const GOCHARA_AV_SOURCES: Record<string, BalaSource> = {
  own: S(66, "70-72"),
  saturnOwn: S(70, "43-44"),
  sarva: S(72, "3-5"),
};

export const GOCHARA_AV_NOTES = [
  "Beside each stretch the sign's Ashtakavarga marks are shown: the transiting planet's own chart (rekhas out of eight, Parashara 66.70-72; Saturn again in 70.43-44) and the aggregate count of the sign with its band (72.3-5). Parashara judges transit by these marks, not by the house from the Moon, so a stretch may read well by one method and badly by the other.",
  "A sign holds eight marks, one from each of the seven planets and the lagna. The own-chart reading is taken as favourable at five or more rekhas, adverse at three or fewer and even at four; the verses speak of rekhas against dots without naming a threshold, so the cut is a reading.",
  "Rahu and Ketu have no Ashtakavarga of their own, so only the aggregate count is shown for them. The aggregate bands follow 72.3-5: more than 30 rekhas favourable, 25 to 30 medium, fewer than 25 adverse.",
  "The marks are those of the birth chart and do not change with time; what changes is which sign the planet is in. Parashara adds that the dasa in force conditions the outcome (70.10-14).",
];

export function avOwnVerdict(rekhas: number): AvOwnVerdict {
  return rekhas >= 5 ? "favourable" : rekhas <= 3 ? "adverse" : "even";
}

export function gocharaAvMark(
  av: AshtakavargaResult,
  planet: Planet,
  signIndex: number,
): GocharaAvMark {
  const chart = av.charts.find((c) => c.owner === planet);
  const mark: GocharaAvMark = {
    sarva: av.sarva[signIndex],
    band: av.band[signIndex],
  };
  if (chart)
    mark.own = {
      rekhas: chart.rekhas[signIndex],
      verdict: avOwnVerdict(chart.rekhas[signIndex]),
    };
  return mark;
}

/** One-line text for tables and the PDF, e.g. "4 of 8 · 28 medium" or "aggregate 28 medium". */
export function avMarkText(m: GocharaAvMark): string {
  return m.own
    ? `${m.own.rekhas} of 8 · ${m.sarva} ${m.band}`
    : `aggregate ${m.sarva} ${m.band}`;
}
