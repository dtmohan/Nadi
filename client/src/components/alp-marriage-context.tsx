import React from "react";
import { ALP_MARRIAGE_SOURCE, BPHS_MARRIAGE_SOURCE, type AlpMarriageContext } from "@shared/alp-marriage";
import { Cite } from "@/components/source-link";

export function AlpMarriageContextPanel({ context }: { context?: AlpMarriageContext }) {
  if (!context) return null;
  const n = context.natal, t = context.timing;
  return <details className="mt-2 rounded border px-2 py-2 text-xs" data-testid="alp-marriage-context">
    <summary className="cursor-pointer font-medium">Marriage: birth-chart context and ALP timing clues</summary>
    <p className="mt-1">At birth, the seventh sign is {n.seventhSign}, ruled by {n.lord}; that lord is in {n.lordSign}, house {n.lordHouse}, and {n.lordNavamsaSign} in D9. The natal D9 ascendant is {n.navamsaAscendant}. Seventh-sign occupants: {n.occupants.join(", ") || "none"}.</p>
    <p className="mt-1">Parashari's separate seventh-lord own/exaltation-sign clue for happiness through a spouse is {n.classicalSpouseHappinessClue ? "present" : "not identified"}. This is a sign-level clue about quality, not a complete natal promise or proof that a marriage will or will not occur. <Cite href={BPHS_MARRIAGE_SOURCE}>BPHS 18.1</Cite></p>
    <p className="mt-1">The seventh lords from birth and progressed lagna are {t.janmaSeventhLord} and {t.alpSeventhLord}; they {t.lordIdentity ? "are the same planet" : t.lordsShareNatalSign ? "share a natal sign" : "do not share a natal sign"}. The ALP pada-navamsa condition is {t.padaNavamsaTouches ? "present" : "not identified"}.</p>
    <p className="mt-1">Running Akshaya periods: {t.dasa} / {t.bhukti}. The exact seventh-lord period pair illustrated in the book is {t.exactPeriodPair ? "present" : "not identified"}. Other possible connections are not settled by this narrow test. <Cite href={ALP_MARRIAGE_SOURCE}>ALP Vol. 2, calculation example and ch. 25</Cite></p>
    <p className="mt-1">In the supplied printed edition's chapter 28, one example names the progressed seventh lord alone as the main period or sub-period. Here, {t.alpSeventhLord} {t.alpSeventhInPeriod ? "is" : "is not"} one of the running lords; {t.janmaSeventhLord}, the natal seventh lord, {t.natalSeventhInPeriod ? "is" : "is not"}. Extending that example to every chart remains unverified.</p>
    <p className="mt-1">D9 signs of the natal/progressed seventh lords: {t.natalSeventhD9Sign} / {t.alpSeventhD9Sign}. At the natal D9 ascendant: {t.natalSeventhAtNatalD9Lagna ? "natal lord present" : "natal lord absent"}, {t.alpSeventhAtNatalD9Lagna ? "progressed lord present" : "progressed lord absent"}; at the progressed pada's D9 ascendant: {t.natalSeventhAtProgressedD9Lagna ? "natal lord present" : "natal lord absent"}, {t.alpSeventhAtProgressedD9Lagna ? "progressed lord present" : "progressed lord absent"}. Same-sign placement is one narrow, explicitly displayed interpretation of “connection”; other aspects or definitions are not assessed.</p>
    <p className="mt-1 text-muted-foreground">These observations remain separate. The available ALP passage does not specify a complete natal-promise gate or every kind of connection, so no automatic denial or combined birth-time score is derived.</p>
  </details>;
}
