// BPHS 70.16-18: the father yogas that need only the native's chart.
//
// The verses give five rules. Three are applied here: (1) the father enjoys happiness in the dasa of the lord
// of the 4th; (2) the native is obedient to the father if the lord of the 4th is in the lagna or the 11th, or in
// the 11th or 10th from the Moon; (5) the native outshines the father if the lord of the 10th is in the lagna.
// (3) and (4) compare the native's lagna with the father's lagna or Moon and need the father's chart, as does
// 70.15; they are not applied.
import {
  SIGN_LORD,
  houseFrom,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { ParashariFinding, ParashariSource } from "./parashari";

const S = (verse: string): ParashariSource => ({
  label: `Parashara 70.${verse}`,
  url: BPHS_URL(70),
});

export const FATHER_YOGA_CAVEATS = [
  "70.16-18 (3) and (4) read the native's birth sign against the father's lagna or Moon, and 70.15 against the father's 8th; the father's chart is not in the app, so those rules are not applied.",
  "70.17 names the 11th or 10th from the Moon as the alternative seats of the lord of the 4th; the verse is read as either house from the Moon.",
];

export interface FatherDasaNote {
  lord: Planet;
  text: string;
  source: ParashariSource;
}

/** 70.16 (1): the dasa of the lord of the 4th is the father's happy period. */
export function fatherDasaLord(lagnaIdx: number): FatherDasaNote {
  const lord = SIGN_LORD[(lagnaIdx + 3) % 12];
  return {
    lord,
    text: `The dasa of ${lord}, lord of the 4th, is the period in which the father enjoys happiness.`,
    source: S("16"),
  };
}

export function fatherFindings(
  positions: PlanetPosition[],
  lagnaIdx: number,
): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const moonIdx = pos("Moon").signIndex;
  const fromMoon = (pl: Planet) => houseFrom(moonIdx, pos(pl).signIndex);
  const lord4 = SIGN_LORD[(lagnaIdx + 3) % 12];
  const lord10 = SIGN_LORD[(lagnaIdx + 9) % 12];

  // 70.17 (2)
  const h4 = houseOf(lord4);
  const m4 = fromMoon(lord4);
  if (h4 === 1 || h4 === 11 || m4 === 11 || m4 === 10) {
    const where =
      h4 === 1 || h4 === 11
        ? `in the ${h4 === 1 ? "lagna" : "11th"}`
        : `in the ${m4 === 11 ? "11th" : "10th"} from the Moon`;
    F.push({
      id: "pa-father-70-17",
      kind: "yoga",
      title: "Lord of the 4th placed for obedience to the father",
      text: `${lord4}, lord of the 4th, stands ${where}. Parashara reads the native as obedient to the father.`,
      tone: "support",
      planets: [lord4],
      source: S("17"),
    });
  }

  // 70.18 (5)
  if (houseOf(lord10) === 1) {
    F.push({
      id: "pa-father-70-18",
      kind: "yoga",
      title: "Lord of the 10th in the lagna",
      text: `${lord10}, lord of the 10th, stands in the lagna. Parashara reads the native as more distinguished than the father.`,
      tone: "support",
      planets: [lord10],
      source: S("18"),
    });
  }

  return F;
}
