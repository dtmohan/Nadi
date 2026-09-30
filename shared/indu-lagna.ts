// Indu Lagna, the "wealth ascendant": a special lagna computed from the kalas
// (measures of brilliance) of the lords of the ninth house from the lagna and
// the ninth from the Moon. The calculation is classical — Kalidasa's Uttara
// Kalamrita, Khanda IV, sloka 27 (V. Subrahmanya Sastri's public-domain 1939
// translation, e-text at astrojyoti.com): "The numbers 30, 16, 6, 8, 10, 12
// and 1 denote the kalas of the seven planets from the Sun onwards. Add the
// kalas of the lords of the 9th house reckoned from the Lagna as well as from
// the Moon. Divide the sum by 12. The Rasi counted from the Moon indicated by
// this remainder..." — with the sign landed on read for the scale of wealth.
// S. Prakash's DNA Astrology of Wealth (2022), pp. 92-93, uses this lagna in
// every case study but never defines its calculation; the reading rules below
// carry the book's page cites and the classical verse is the calculation's
// only source. Kept out of the BNN reading entirely: a separate technique,
// shown in the Jaimini tab only because that tab holds the special lagnas.

import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";
import { drishtiQuarters, naturalBenefic } from "./parashari";

/** Kalas of the seven classical planets, UK IV.27. Rahu and Ketu have none and never rule the ninth. */
export const INDU_KALAS: Record<"Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn", number> = {
  Sun: 30,
  Moon: 16,
  Mars: 6,
  Mercury: 8,
  Jupiter: 10,
  Venus: 12,
  Saturn: 1,
};

export const INDU_SOURCE = {
  label: "Uttara Kalamrita IV.27 (Sastri trans.)",
  url: "https://www.astrojyoti.com/uttarakalamritam2.htm",
};

export interface InduNinth {
  signIndex: number;
  sign: Sign;
  lord: Planet;
  kala: number;
}

export interface InduFinding {
  id: string;
  text: string;
  planets: Planet[];
  /** "classical": UK verse(s) of its own; "book": DNA Astrology of Wealth (modern, self-published). */
  source: "classical" | "book";
  /** Label for the classical source when it is not IV.27 itself. */
  sourceLabel?: string;
  pages?: string;
}

export interface InduLagnaResult {
  signIndex: number;
  sign: Sign;
  ninthFromLagna: InduNinth;
  ninthFromMoon: InduNinth;
  sum: number;
  remainder: number;
  /** One planet holds both ninth lordships; its kalas are still counted twice, the verse adding two values. */
  sameLord: boolean;
  occupants: Planet[];
  /** Planets casting full sign-based graha drishti on the Indu Lagna sign. */
  aspecting: Planet[];
  classical: InduFinding[];
  findings: InduFinding[];
  notes: string[];
}

function ord(h: number): string {
  return `${h}${["th", "st", "nd", "rd"][h % 10 < 4 && (h < 11 || h > 13) ? h % 10 : 0]}`;
}

function list(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export function computeInduLagna(positions: PlanetPosition[], lagnaLon: number): InduLagnaResult {
  const lagnaSign = Math.floor(lagnaLon / 30);
  const moon = positions.find((p) => p.planet === "Moon")!;
  const moonSign = moon.signIndex;

  const ninthFromLagna = (lagnaSign + 8) % 12;
  const lordL = SIGN_LORD[ninthFromLagna];
  const ninthFromMoonSign = (moonSign + 8) % 12;
  const lordM = SIGN_LORD[ninthFromMoonSign];

  const sum = INDU_KALAS[lordL as keyof typeof INDU_KALAS] + INDU_KALAS[lordM as keyof typeof INDU_KALAS];
  const remainder = sum % 12 === 0 ? 12 : sum % 12;
  const signIndex = (moonSign + remainder - 1) % 12;

  const inSign = (h: number) => positions.filter((p) => houseFrom(signIndex, p.signIndex) === h);
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const occupants = positions.filter((p) => p.signIndex === signIndex).map((p) => p.planet);
  const aspecting = positions
    .filter((p) => p.signIndex !== signIndex && drishtiQuarters(p.planet, p.signIndex, signIndex) >= 4)
    .map((p) => p.planet);
  const ben = (pl: Planet) => naturalBenefic(pos(pl), positions);

  // ── Classical scale, UK IV.27 ──────────────────────────────────────────────
  const classical: InduFinding[] = [];
  const occBen = occupants.filter(ben);
  const occMal = occupants.filter((pl) => !ben(pl));
  const exaltedMal = occMal.filter((pl) => pos(pl).dignity === "Exalted");
  if (occupants.length === 0) {
    classical.push({
      id: "il-empty",
      text: `The Indu Lagna (${SIGNS[signIndex]}) stands empty. The verse fixes its scale only for occupied signs, so its own tiers are silent here — the lagna is then read through its lord, below, the way any empty bhava is.`,
      planets: [],
      source: "classical",
    });
  } else if (occBen.length > 0 && occMal.length === 0) {
    classical.push({
      id: "il-ben-alone",
      text: `${list(occBen)} ${occBen.length === 1 ? "stands" : "stand"} in the Indu Lagna with no malefic: the verse's scale reads a Koteeswara — its word for a millionaire.`,
      planets: occBen,
      source: "classical",
    });
  } else if (occMal.length > 0 && occBen.length === 0) {
    classical.push(
      exaltedMal.length > 0
        ? {
            id: "il-mal-exalted",
            text: `${list(exaltedMal)} ${exaltedMal.length === 1 ? "is" : "are"} malefic but exalted in the Indu Lagna, which the verse restores to the Koteeswara scale.`,
            planets: occMal,
            source: "classical",
          }
        : {
            id: "il-mal-only",
            text: `${list(occMal)} ${occMal.length === 1 ? "is" : "are"} malefic in the Indu Lagna: the verse's scale reads wealth in thousands — modest against its millionaire tier.`,
            planets: occMal,
            source: "classical",
          },
    );
  } else {
    classical.push({
      id: "il-mixed",
      text: `The Indu Lagna holds benefic ${list(occBen)} together with malefic ${list(occMal)}: the verse scales the benefic-alone and malefic-only cases, so a mixed sign falls between its tiers.`,
      planets: occupants,
      source: "classical",
    });
  }

  // ── The Indu Lagna's own lord ────────────────────────────────────────────
  // The book reads "Indu Lagna lord is X, standing in the Nth from it" in every
  // case study (pp. 172-249), occupied sign or not — when the Indu Lagna stands
  // empty its lord is the primary witness. The flourishing/destruction conditions
  // are the same text's own bhava-lord doctrine (UK IV.10-12, seventeen slokas
  // before the Indu Lagna verse; Phaladeepika XV.2-3 agrees), applied to the
  // Indu Lagna as the bhava concerned — an extension, marked provisional.
  const ilLord = SIGN_LORD[signIndex];
  const lp = pos(ilLord);
  const hIL = houseFrom(signIndex, lp.signIndex);
  const associates = positions.filter((p) => p.planet !== ilLord && p.signIndex === lp.signIndex).map((p) => p.planet);
  const benAssoc = associates.filter(ben);
  const benAspect = positions.some((p) => p.planet !== ilLord && ben(p.planet) && p.signIndex !== lp.signIndex && drishtiQuarters(p.planet, p.signIndex, lp.signIndex) >= 4);
  const aspectsIL = lp.signIndex !== signIndex && drishtiQuarters(ilLord, lp.signIndex, signIndex) >= 4;
  const dignity = lp.dignity;
  const houseRoute = [1, 3, 4, 5, 7, 9, 10, 11].includes(hIL);
  const dignityRoute = ["Friendly", "Exalted", "Own sign", "Moolatrikona"].includes(dignity);
  const harmed = hIL === 8 || dignity === "Debilitated" || dignity === "Inimical";
  const rescued = benAssoc.length > 0 || benAspect;
  const harmedWhy = hIL === 8 ? `in the 8th from it` : dignity === "Debilitated" ? `debilitated in ${lp.sign}` : `in an inimical sign (${lp.sign})`;
  classical.push(
    harmed && !rescued
      ? {
          id: "il-lord-uk",
          text: `${ilLord}, lord of the Indu Lagna, stands ${harmedWhy} with no benefic joined or aspecting it: Uttara Kalamrita IV.10's destruction clause for a bhava lord, read here against the Indu Lagna (an extension; provisional).`,
          planets: [ilLord],
          source: "classical",
          sourceLabel: "Uttara Kalamrita IV.10-12",
        }
      : (houseRoute || dignityRoute) && rescued
        ? {
            id: "il-lord-uk",
            text: `${ilLord}, lord of the Indu Lagna, stands in the ${ord(hIL)} from it${houseRoute ? ", one of IV.11's houses" : ""}${dignityRoute ? `, in a ${dignity.toLowerCase()} sign` : ""}, joined by benefics${benAssoc.length ? ` (${list(benAssoc)})` : ""}${benAspect && !benAssoc.length ? " and aspected by a benefic" : ""}: Uttara Kalamrita IV.11's prosperity clause for a bhava lord, read here against the Indu Lagna (an extension; provisional).`,
            planets: [ilLord, ...benAssoc],
            source: "classical",
            sourceLabel: "Uttara Kalamrita IV.10-12",
          }
        : {
            id: "il-lord-uk",
            text: `${ilLord}, lord of the Indu Lagna, stands in the ${ord(hIL)} from it in ${lp.sign} (${dignity.toLowerCase()}): neither IV.11's prosperity clause nor IV.10's destruction clause is cleanly met, so the lord is read mixed (provisional).`,
            planets: [ilLord],
            source: "classical",
            sourceLabel: "Uttara Kalamrita IV.10-12",
          },
  );

  // ── Reading rules, DNA Astrology of Wealth pp. 92-93 ──────────────────────
  const findings: InduFinding[] = [];
  const PAGES = "DNA Astrology of Wealth, pp. 92-93";

  findings.push({
    id: "il-lord",
    text: `The Indu Lagna's own lord ${ilLord} stands in the ${ord(hIL)} from it, in ${lp.sign}${dignity !== "—" ? ` (${dignity.toLowerCase()})` : ""}${associates.length ? `, with ${list(associates)}` : ", alone"}${aspectsIL ? ", and aspects the Indu Lagna" : ""}.`,
    planets: [ilLord, ...associates],
    source: "book",
    pages: "DNA Astrology of Wealth, case studies pp. 172-249",
  });

  const benInIL = occBen;
  if (benInIL.length) {
    findings.push({
      id: "il-ben-dasha",
      text: `Benefic ${list(benInIL)} in the Indu Lagna: the dasha period of ${benInIL.length === 1 ? "this planet" : "these planets"} gives good results.`,
      planets: benInIL,
      source: "book",
      pages: PAGES,
    });
  }
  const trine = [...inSign(5), ...inSign(9)].filter((p) => ben(p.planet));
  if (trine.length) {
    findings.push({
      id: "il-ben-trine",
      text: `Benefic ${list(trine.map((p) => p.planet))} in trine (the 5th or 9th) from the Indu Lagna: its dasha period is beneficial.`,
      planets: trine.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }
  const kendra = [...inSign(4), ...inSign(7), ...inSign(10)].filter((p) => ben(p.planet));
  if (kendra.length) {
    findings.push({
      id: "il-ben-kendra",
      text: `Benefic ${list(kendra.map((p) => p.planet))} in a Kendra (the 4th, 7th or 10th) from the Indu Lagna: its dasha period is beneficial.`,
      planets: kendra.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }

  const second = inSign(2);
  if (second.length) {
    const parts = second.map((p) => {
      const d = p.dignity;
      if (d === "Exalted") {
        return ben(p.planet)
          ? `${p.planet} exalted: wealth and prosperity come easily`
          : `${p.planet} malefic but exalted: wealth through other means, through hard work`;
      }
      if (d === "Debilitated") return `${p.planet} debilitated: problematic for the native's finances`;
      return `${p.planet} (${d.toLowerCase()}): great riches in its dasha period`;
    });
    findings.push({
      id: "il-second",
      text: `The 2nd from the Indu Lagna holds ${list(second.map((p) => p.planet))} — ${parts.join("; ")}.`,
      planets: second.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }

  const eleventh = [...inSign(11), ...positions.filter((p) => houseFrom(signIndex, p.signIndex) !== 11 && drishtiQuarters(p.planet, p.signIndex, (signIndex + 10) % 12) >= 4)];
  if (eleventh.length) {
    const eBen = eleventh.filter((p) => ben(p.planet)).map((p) => p.planet);
    const eMal = eleventh.filter((p) => !ben(p.planet)).map((p) => p.planet);
    const how = eBen.length && eMal.length ? "by fair and unfair means both" : eBen.length ? "by fair means" : "through an unfair medium";
    findings.push({
      id: "il-eleventh",
      text: `The 11th from the Indu Lagna is occupied or aspected by ${list(eleventh.map((p) => p.planet))}: wealth promise, ${how}.`,
      planets: eleventh.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }

  const SOFT = ["Moon", "Mercury", "Jupiter", "Venus"] as const;
  const soft24 = positions.filter((p) => (SOFT as readonly string[]).includes(p.planet) && (houseFrom(signIndex, p.signIndex) === 2 || houseFrom(signIndex, p.signIndex) === 4));
  if (soft24.length) {
    findings.push({
      id: "il-soft-2-4",
      text: `${list(soft24.map((p) => p.planet))} in the 2nd or 4th from the Indu Lagna: the book's line for becoming wealthy.`,
      planets: soft24.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }
  const soft5911 = positions.filter((p) => (SOFT as readonly string[]).includes(p.planet) && [5, 9, 11].includes(houseFrom(signIndex, p.signIndex)));
  if (soft5911.length) {
    findings.push({
      id: "il-soft-5-9-11",
      text: `${list(soft5911.map((p) => p.planet))} in the 5th, 9th or 11th from the Indu Lagna: the book's second line for becoming wealthy.`,
      planets: soft5911.map((p) => p.planet),
      source: "book",
      pages: PAGES,
    });
  }

  const notes: string[] = [
    `Calculation: the ${ord(remainder)} from the Moon, from the kalas of the two ninth lords (${lordL} ${INDU_KALAS[lordL as keyof typeof INDU_KALAS]} from the lagna, ${lordM} ${INDU_KALAS[lordM as keyof typeof INDU_KALAS]} from the Moon, sum ${sum}). Uttara Kalamrita IV.27, trans. V. Subrahmanya Sastri (1939), public-domain e-text at astrojyoti.com. The Tamil Jataka Alankaram teaches the same rule.`,
    `The DNA Astrology of Wealth book uses this lagna in all twenty-two case studies yet never states the calculation; the reading rules above (2nd and 11th from the Indu Lagna, benefic dashas, the soft planets in 2nd/4th and 5th/9th/11th) are its own, pp. 92-93.`,
    "Benefic and malefic follow BPHS 3.11 natural classification (Jupiter and Venus; the waxing Moon; Mercury unless joined by a malefic). \"Aspected\" means full sign-based graha drishti — the book names no aspect scheme, so that choice is provisional.",
    "The Indu Lagna feeds nothing in the Nadi reading: the systems stay separate, and this panel only reports it.",
    "The Indu Lagna's lord is read in every one of the book's case studies (pp. 172-249) — an empty Indu Lagna is read through it, the way any empty bhava is. The flourishing and destruction conditions come from Uttara Kalamrita IV.10-12, the same text's bhava-lord doctrine seventeen slokas before the Indu Lagna verse (Phaladeepika XV.2-3 agrees, Sastri trans., wisdomlib.org); applying them to the Indu Lagna as the bhava concerned is an extension, so that finding is provisional. Combustion (\"eclipsed\" in IV.10) is left to the eye: the texts differ on the orbs.",
  ];
  if (lordL === lordM) {
    notes.splice(1, 0, `${lordL} rules the ninth from both the lagna and the Moon; its ${INDU_KALAS[lordL as keyof typeof INDU_KALAS]} kalas are counted twice, as the verse adds the two lords' values without an exception clause.`);
  }

  return {
    signIndex,
    sign: SIGNS[signIndex],
    ninthFromLagna: { signIndex: ninthFromLagna, sign: SIGNS[ninthFromLagna], lord: lordL, kala: INDU_KALAS[lordL as keyof typeof INDU_KALAS] },
    ninthFromMoon: { signIndex: ninthFromMoonSign, sign: SIGNS[ninthFromMoonSign], lord: lordM, kala: INDU_KALAS[lordM as keyof typeof INDU_KALAS] },
    sum,
    remainder,
    sameLord: lordL === lordM,
    occupants,
    aspecting,
    classical,
    findings,
    notes,
  };
}
