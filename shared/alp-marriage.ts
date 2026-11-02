/** Source-scoped marriage context for ALP. These are separate observations,
 * not a complete natal promise, an event score, or a denial of marriage. */
import { EXALTATION, OWN_SIGNS, SIGN_LORD, SIGNS, houseFrom, type Planet, type PlanetPosition } from "./astro";
import type { AlpPoint, ArpResult } from "./alp";
import { alpMarriageTouches } from "./rules-alp";
import { zodiacQuarter } from "./zodiac-quarter";

export const ALP_MARRIAGE_SOURCE = "https://www.scribd.com/document/972735161/Jyotish-S-Pothuvudai-Moorthy-Akshaya-Lagna-Pathathi-ALP-Part-2-2021";
export const BPHS_MARRIAGE_SOURCE = "https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-18";

export interface AlpMarriageContext {
  natal: {
    seventhSign: string; lord: Planet; lordSign: string; lordHouse: number;
    lordNavamsaSign: string; navamsaAscendant: string; occupants: Planet[];
    ownSign: boolean; exaltationSign: boolean;
    /** BPHS 18.1 is a marriage-quality clue, not proof of marriage occurrence. */
    classicalSpouseHappinessClue: boolean;
    promise: "unresolved";
  };
  timing: {
    alpSeventhLord: Planet; janmaSeventhLord: Planet;
    lordIdentity: boolean; lordsShareNatalSign: boolean;
    padaNavamsaTouches: boolean;
    dasa: Planet; bhukti: Planet;
    natalSeventhInPeriod: boolean; alpSeventhInPeriod: boolean;
    natalSeventhD9Sign: string; alpSeventhD9Sign: string;
    natalSeventhAtNatalD9Lagna: boolean; alpSeventhAtNatalD9Lagna: boolean;
    natalSeventhAtProgressedD9Lagna: boolean; alpSeventhAtProgressedD9Lagna: boolean;
    /** Narrow reading of the ch. 25 examples: the two running lords are exactly
     * the natal and progressed seventh lords, in either order. */
    exactPeriodPair: boolean;
  };
}

/** Independently inspectable facts; not a combined prediction or score. */
export function alpMarriageFacts(t: AlpMarriageContext["timing"]): Record<string, boolean> {
  return { "pada-navamsa-touches": t.padaNavamsaTouches,
    "natal-seventh-lord-in-period": t.natalSeventhInPeriod,
    "alp-seventh-lord-in-period": t.alpSeventhInPeriod,
    "exact-seventh-lord-period-pair": t.exactPeriodPair,
    "natal-seventh-lord-at-natal-d9-lagna": t.natalSeventhAtNatalD9Lagna,
    "alp-seventh-lord-at-natal-d9-lagna": t.alpSeventhAtNatalD9Lagna,
    "natal-seventh-lord-at-progressed-d9-lagna": t.natalSeventhAtProgressedD9Lagna,
    "alp-seventh-lord-at-progressed-d9-lagna": t.alpSeventhAtProgressedD9Lagna };
}

export function alpMarriageContext(positions: readonly PlanetPosition[], natal: AlpPoint, point: AlpPoint, arp: ArpResult): AlpMarriageContext {
  const seventhSign = (natal.signIndex + 6) % 12;
  const janmaSeventhLord = SIGN_LORD[seventhSign];
  const alpSeventhLord = SIGN_LORD[(point.signIndex + 6) % 12];
  const natalLord = positions.find((p) => p.planet === janmaSeventhLord);
  const alpLord = positions.find((p) => p.planet === alpSeventhLord);
  if (!natalLord || !alpLord) throw new Error("Missing ALP marriage seventh lord");
  const ownSign = OWN_SIGNS[janmaSeventhLord]?.includes(natalLord.signIndex) ?? false;
  const exaltationSign = EXALTATION[janmaSeventhLord]?.sign === natalLord.signIndex;
  const dasa = arp.dasa.lord, bhukti = arp.bhukti.lord;
  const natalLordD9 = zodiacQuarter(natalLord.lon).navamsaSign;
  const alpLordD9 = zodiacQuarter(alpLord.lon).navamsaSign;
  // An exact pair is one explicitly illustrated case. The source does not
  // define all connections or specify which convention to use when one lord
  // rules both sevenths; we do not broaden it into a universal requirement.
  const exactPeriodPair = (dasa === janmaSeventhLord && bhukti === alpSeventhLord) ||
    (bhukti === janmaSeventhLord && dasa === alpSeventhLord);
  return {
    natal: { seventhSign: SIGNS[seventhSign], lord: janmaSeventhLord, lordSign: SIGNS[natalLord.signIndex],
      lordHouse: houseFrom(natal.signIndex, natalLord.signIndex), lordNavamsaSign: SIGNS[zodiacQuarter(natalLord.lon).navamsaSign],
      navamsaAscendant: SIGNS[natal.navamsaSign], occupants: positions.filter((p) => p.signIndex === seventhSign).map((p) => p.planet),
      ownSign, exaltationSign, classicalSpouseHappinessClue: ownSign || exaltationSign, promise: "unresolved" },
    timing: { alpSeventhLord, janmaSeventhLord, lordIdentity: janmaSeventhLord === alpSeventhLord,
      lordsShareNatalSign: natalLord.signIndex === alpLord.signIndex,
      padaNavamsaTouches: alpMarriageTouches(point.signIndex, natal.signIndex, point.navamsaSign),
      dasa, bhukti, exactPeriodPair,
      natalSeventhInPeriod: dasa === janmaSeventhLord || bhukti === janmaSeventhLord,
      alpSeventhInPeriod: dasa === alpSeventhLord || bhukti === alpSeventhLord,
      natalSeventhD9Sign: SIGNS[natalLordD9], alpSeventhD9Sign: SIGNS[alpLordD9],
      natalSeventhAtNatalD9Lagna: natalLordD9 === natal.navamsaSign,
      alpSeventhAtNatalD9Lagna: alpLordD9 === natal.navamsaSign,
      natalSeventhAtProgressedD9Lagna: natalLordD9 === point.navamsaSign,
      alpSeventhAtProgressedD9Lagna: alpLordD9 === point.navamsaSign },
  };
}
