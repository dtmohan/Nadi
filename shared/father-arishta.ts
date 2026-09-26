import type { Planet } from "./astro";
import { BPHS_URL } from "./parashari-data";

/**
 * Parashara 70.12-14: Saturn's transit through the father's sign point (Sun's rekha-marked
 * place in the 9th from the Sun) or its trines threatens the father when Rahu, Saturn or Mars
 * stand in the 4th from the Sun at the time of transit. The threat matures if Saturn, joined or
 * aspected by a malefic, is in the 9th from the lagna or the Moon, or the dasa of the lord of the
 * 4th from the lagna is running; a favourable dasa in force averts it.
 */
export interface FatherArishtaWindow {
  start: string;
  end: string;
  saturnSignIndex: number;
  pointKind: "sign" | "trine";
  /** Planets among Rahu, Saturn and Mars standing in the 4th from the natal Sun throughout the window. */
  fourthFromSun: Planet[];
  /** Saturn in the 9th from these reference points (sign-based). */
  saturnNinthFrom: ("lagna" | "Moon")[];
  /** Malefics with or aspecting Saturn, sampled at the middle of the window. */
  maleficsOnSaturn: { planet: Planet; how: "with" | "aspects" }[];
}

export type ArishtaLevel = "watch" | "grave" | "averted";

export interface FatherArishtaReading extends FatherArishtaWindow {
  age: number;
  current: boolean;
  fourthLordDasa: Planet | null;
  runningDasa: { lord: Planet; verdict: "support" | "strain" | "mixed" } | null;
  level: ArishtaLevel;
  text: string;
  sources: { label: string; url: string; provisional?: boolean }[];
}

const SRC = {
  rule: { label: "Parashara 70.12-14", url: BPHS_URL(70) },
  aspects: { label: "Parashara 70.13 aspects", url: BPHS_URL(70), provisional: true },
  dasa: { label: "Parashara 70.14", url: BPHS_URL(70) },
};

export const FATHER_ARISHTA_CAVEATS = [
  "Only Saturn's sign passages through the father's point or its trines are tested; the verse gives no orb, so whole signs are used.",
  "The planets in the 4th from the Sun are the transiting Rahu, Saturn and Mars; the verse does not say whether natal placements also count, so they are not used (provisional).",
  "Malefic association and aspect on Saturn are judged by whole-sign conjunction and the 7th-sign aspect, with Mars' 4th and 8th, at the middle of each window; the nodes' aspects are not in the text (provisional).",
  "The favourable dasa of 70.14 is taken as a Vimshottari maha dasa the app already reads as supportive (chapters 46-64), a provisional identification.",
  "70.15 and 70.16-18 (3)-(4) read the native's chart against the father's and are not applied because the father's birth data are not in the app; the remaining rules of 70.16-18 appear among the yogas and in the dasa list.",
];

interface DasaLike {
  lord: Planet;
  start: string;
  end: string;
}
interface DasaReadingLike {
  lord: Planet;
  start: string;
  end: string;
  verdict: "support" | "strain" | "mixed";
}

export function readFatherArishta(
  windows: FatherArishtaWindow[] | undefined,
  fourthLord: Planet,
  dashas: DasaLike[],
  dasaReadings: DasaReadingLike[],
  birthIso: string,
  asOfIso: string,
): FatherArishtaReading[] {
  if (!windows) return [];
  const birth = Date.parse(birthIso);
  const now = Date.parse(asOfIso);
  return windows.map((w) => {
    const s = Date.parse(w.start);
    const e = Date.parse(w.end);
    const mid = (s + e) / 2;
    const dasa = dashas.find((d) => Date.parse(d.start) <= mid && mid < Date.parse(d.end)) ?? null;
    const reading = dasaReadings.find((d) => Date.parse(d.start) <= mid && mid < Date.parse(d.end)) ?? null;
    const fourthLordDasa = dasa && dasa.lord === fourthLord ? dasa.lord : null;
    const runningDasa = reading ? { lord: reading.lord, verdict: reading.verdict } : null;
    const matured = (w.saturnNinthFrom.length > 0 && w.maleficsOnSaturn.length > 0) || fourthLordDasa !== null;
    const averted = runningDasa?.verdict === "support";
    const level: ArishtaLevel = averted ? "averted" : matured ? "grave" : "watch";
    const parts: string[] = [];
    parts.push(`${w.fourthFromSun.join(", ")} in the 4th from the Sun while Saturn crosses ${w.pointKind === "sign" ? "the father's sign point" : "a trine of the father's point"}: the father's death may be feared.`);
    if (w.saturnNinthFrom.length > 0) {
      parts.push(
        w.maleficsOnSaturn.length > 0
          ? `Saturn is in the 9th from the ${w.saturnNinthFrom.join(" and ")} ${w.maleficsOnSaturn.map((m) => `${m.how === "with" ? "with" : "aspected by"} ${m.planet}`).join(", ")}: the transit can bring it to pass.`
          : `Saturn is in the 9th from the ${w.saturnNinthFrom.join(" and ")} but no malefic joins or aspects it.`,
      );
    }
    if (fourthLordDasa) parts.push(`The dasa of ${fourthLordDasa}, lord of the 4th from the lagna, is running: the transit can bring it to pass.`);
    if (runningDasa) {
      parts.push(
        averted
          ? `The ${runningDasa.lord} dasa reads as favourable, so the death does not take place; only trouble is indicated.`
          : `The ${runningDasa.lord} dasa reads as ${runningDasa.verdict === "strain" ? "adverse" : "mixed"}, so no favourable dasa averts it.`,
      );
    }
    const sources = [SRC.rule];
    if (w.maleficsOnSaturn.length > 0) sources.push(SRC.aspects);
    if (runningDasa || fourthLordDasa) sources.push(SRC.dasa);
    return {
      ...w,
      age: Math.round(((s - birth) / (365.25 * 86400e3)) * 10) / 10,
      current: s <= now && now < e,
      fourthLordDasa,
      runningDasa,
      level,
      text: parts.join(" "),
      sources,
    };
  });
}
