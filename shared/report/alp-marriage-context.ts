import { ALP_MARRIAGE_SOURCE, BPHS_MARRIAGE_SOURCE, type AlpMarriageContext } from "../alp-marriage";
import type { ReportPara } from "./types";
import { alpMarriageReportMalayalam } from "../malayalam-alp-marriage-report";

export function alpMarriageParas(context: AlpMarriageContext | undefined, cite?: (source: string, url?: string) => number): ReportPara[] {
  if (!context) return [];
  const n = context.natal, t = context.timing;
  const paras: ReportPara[] = [
    { kind: "p", provisional: true, text: `Marriage birth context: the seventh sign is ${n.seventhSign}, ruled by ${n.lord}, in ${n.lordSign} (house ${n.lordHouse}) and ${n.lordNavamsaSign} in D9. Natal D9 ascendant: ${n.navamsaAscendant}; seventh-sign occupants: ${n.occupants.join(", ") || "none"}. BPHS's separate own/exaltation-sign clue for happiness through a spouse is ${n.classicalSpouseHappinessClue ? "present" : "not identified"}; it is not a complete natal promise.`, ...(cite ? { cites: [cite("BPHS 18.1", BPHS_MARRIAGE_SOURCE)] } : {}) },
    { kind: "p", provisional: true, text: `ALP timing: natal/progressed seventh lords ${t.janmaSeventhLord}/${t.alpSeventhLord}; ${t.lordIdentity ? "same lord" : t.lordsShareNatalSign ? "same natal sign" : "different natal signs"}. Pada-navamsa condition ${t.padaNavamsaTouches ? "present" : "not identified"}; ${t.dasa}/${t.bhukti} period pair ${t.exactPeriodPair ? "matches both seventh lords" : "does not exactly match both seventh lords"}. Other kinds of connection are not resolved here. The available source does not specify a complete natal-promise gate; these observations do not establish or deny marriage.`, ...(cite ? { cites: [cite("ALP Vol. 2, marriage example and ch. 25", ALP_MARRIAGE_SOURCE)] } : {}) },
    { kind: "p", provisional: true, text: `In the supplied printed edition's chapter 28 example, the progressed seventh lord alone appears as dasa or bhukti: here it is ${t.alpSeventhInPeriod ? "present" : "absent"}; the natal seventh lord is ${t.natalSeventhInPeriod ? "present" : "absent"}. Their D9 signs are ${t.natalSeventhD9Sign}/${t.alpSeventhD9Sign}. At the natal D9 ascendant: natal ${t.natalSeventhAtNatalD9Lagna ? "yes" : "no"}, progressed ${t.alpSeventhAtNatalD9Lagna ? "yes" : "no"}; at the progressed pada's D9 ascendant: natal ${t.natalSeventhAtProgressedD9Lagna ? "yes" : "no"}, progressed ${t.alpSeventhAtProgressedD9Lagna ? "yes" : "no"}. These same-sign observations are a narrow interpretation of the unspecified connection, not an exhaustive test.`, ...(cite ? { cites: [cite("User-provided ALP printed edition, ch. 28, Timing the Marriage Through ALP")] } : {}) },
  ];
  return paras.map((p, i) => {
    const ml = p.text && alpMarriageReportMalayalam(context, i, p.text);
    return ml ? { ...p, translationMl: { source: p.text!, text: ml } } : p;
  });
}
