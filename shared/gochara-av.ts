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

// ---------------------------------------------------------------------------------------------------------------
// Solar months: the Sun's passage through each sign read by the Sun's own chart (70.19-20, fitness for auspicious
// functions) and by the sign's Sarvashtakavarga count (72.11-28 for 7 to 30 rekhas, 72.29 above 30).

export type FunctionsVerdict = "fit" | "even" | "unfit";

export interface SolarMonthReading {
  signIndex: number;
  /** The Sun's own-chart rekhas in the sign and the 70.19-20 verdict on auspicious functions. */
  sunRekhas: number;
  functions: FunctionsVerdict;
  sarva: number;
  /** 72.11-29 effect for the month, paraphrased. */
  effect: string;
  /** Remedy the verse prescribes, where one is given. */
  remedy?: string;
  effectSource: BalaSource;
}

/** 72.11-28, one entry per count from 7 (or fewer) to 30; the text pairs each with a remedy except the last. */
export const SOLAR_MONTH_EFFECTS: Record<
  number,
  { effect: string; remedy?: string }
> = {
  7: {
    effect: "danger to life",
    remedy: "gift of twenty tolas of gold and two mounds of sesame",
  },
  8: { effect: "possibility of death", remedy: "tuladana of camphor" },
  9: {
    effect: "danger from snakes",
    remedy: "gift of a chariot with seven horses",
  },
  10: { effect: "danger from weapons", remedy: "gift of armour with a vajra" },
  11: {
    effect: "disgrace without cause",
    remedy: "gift of a Moon image in ten tolas of gold",
  },
  12: {
    effect: "danger of drowning",
    remedy: "gift of land with standing crops",
  },
  13: { effect: "danger from wild animals", remedy: "gift of a Shaligrama" },
  14: { effect: "danger of death", remedy: "gift of a golden Varaha image" },
  15: { effect: "wrath of the ruler", remedy: "gift of an elephant" },
  16: { effect: "calamity (arishta)", remedy: "gift of a golden Kalpavriksha" },
  17: { effect: "danger from disease", remedy: "gift of a cow and jaggery" },
  18: { effect: "conflict", remedy: "gift of a cow, jewels, land and gold" },
  19: {
    effect: "banishment from the homeland",
    remedy: "worship of the family deity",
  },
  20: { effect: "loss of intelligence", remedy: "worship of Saraswati" },
  21: { effect: "distress from disease", remedy: "gift of a mound of grain" },
  22: { effect: "distress to kinsmen", remedy: "gift of gold" },
  23: {
    effect: "distress to the native",
    remedy: "gift of a Sun image in seven tolas of gold",
  },
  24: { effect: "death among kinsmen", remedy: "gift of ten cows" },
  25: { effect: "loss of wisdom", remedy: "worship of Saraswati" },
  26: { effect: "loss of wealth", remedy: "gift of gold" },
  27: { effect: "loss of wealth", remedy: "Sri Sukta japa" },
  28: { effect: "losses in several ways", remedy: "Surya havana" },
  29: {
    effect: "anxieties all round",
    remedy: "gift of ghee, clothes and gold",
  },
  30: { effect: "gain of wealth and grain" },
};

export const SOLAR_MONTH_SOURCES: Record<string, BalaSource> = {
  functions: S(70, "19-20"),
  effects: S(72, "11-28"),
  increase: S(72, "29"),
};

export const SOLAR_MONTH_NOTES = [
  "The solar month is the Sun's passage through a sign. 70.19-20 forbids auspicious functions such as marriage in a month whose sign carries more dots than rekhas in the Sun's own Ashtakavarga and commends one whose sign carries more rekhas; five or more of eight is read as more rekhas, three or fewer as more dots, four as even. The same verse applies the rule to the mean Jupiter's year, which the Parashari tab's Ashtakavarga timeline shows.",
  "72.11-28 names an effect and a remedy for the month of a sign by its Sarvashtakavarga count from seven or fewer to thirty; 72.29 promises all-round increase above thirty and more above forty. The effects are paraphrased and the remedies given as the text states them; 72.30-31 adds that a sign favourable in the aggregate needs no further transit check.",
];

export function functionsVerdict(sunRekhas: number): FunctionsVerdict {
  return sunRekhas >= 5 ? "fit" : sunRekhas <= 3 ? "unfit" : "even";
}

export function solarMonthReading(
  av: AshtakavargaResult,
  signIndex: number,
): SolarMonthReading {
  const sun = av.charts.find((c) => c.owner === "Sun")!;
  const sunRekhas = sun.rekhas[signIndex];
  const sarva = av.sarva[signIndex];
  let effect: string;
  let remedy: string | undefined;
  let effectSource = SOLAR_MONTH_SOURCES.effects;
  if (sarva > 40) {
    effect = "increase in wealth, property, children and repute";
    effectSource = SOLAR_MONTH_SOURCES.increase;
  } else if (sarva > 30) {
    effect =
      "all-round increase in wealth, happiness from children and enjoyments";
    effectSource = SOLAR_MONTH_SOURCES.increase;
  } else {
    const e = SOLAR_MONTH_EFFECTS[Math.max(7, sarva)];
    effect = e.effect;
    remedy = e.remedy;
  }
  return {
    signIndex,
    sunRekhas,
    functions: functionsVerdict(sunRekhas),
    sarva,
    effect,
    remedy,
    effectSource,
  };
}
