// Brihat Jataka adhyaya 6 (Balarishta, early death), Varahamihira. A second witness to
// Parashara's chapter 9 arishtas: the twelve verses are tested on the chart as written,
// whole-sign houses from the lagna, Parashari drishti at the tab's floor, natural benefics
// per BPHS 3.11. Verse text: Neely (wisdomlib) and Iyer 1885 pp. 53-58; the Sanskrit
// checked in the Adyar 1951 edition pp. 310-329 (Adyar splits 6.2 in two, so its numbers
// run one ahead from there). The counteracting yogas printed by Iyer (pp. 58-59) are the
// commentator's, not Varahamihira's, and are marked provisional.
import {
  houseFrom,
  SIGN_LORD,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { moonWaxing, type ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";
import type { ShadbalaResult } from "./shadbala";

const BJ_BASE =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc";
/** Verse page for Brihat Jataka 6.N on wisdomlib (Neely's translation). */
export const BJ6_URL = (verse: number) => `${BJ_BASE}${1501660 + verse}.html`;
const IYER = "https://archive.org/details/brihatjatakavar00iyergoog";
const V = (verse: number, provisional?: boolean): ParashariSource => ({
  label: `Brihat Jataka 6.${verse}`,
  url: BJ6_URL(verse),
  provisional,
});

export type ArishtaStanding = "holds" | "clear" | "partial" | "untested";

export interface ArishtaRule {
  key: string;
  verse: number;
  /** Paraphrase of the verse as applied. */
  rule: string;
  /** What the verse says follows. */
  result: string;
  standing: ArishtaStanding;
  /** Why it holds or falls, planet by planet. */
  detail: string;
  source: ParashariSource;
  iyer: string;
  adyar: string;
  provisional?: string;
}

export interface Antidote {
  key: string;
  rule: string;
  standing: ArishtaStanding;
  detail: string;
}

export interface BalarishtaResult {
  rules: ArishtaRule[];
  antidotes: Antidote[];
  held: number;
  /** 6.6 gives the only stated term: 8 years under a benefic aspect, 4 under both. */
  horizonYears: number;
  shadbalaKnown: boolean;
  caveats: string[];
  sources: { chapter: ParashariSource; antidotes: ParashariSource };
}

const KENDRA = [1, 4, 7, 10];
const MALEFIC_SEVEN: Planet[] = ["Sun", "Mars", "Saturn"];
const list = (xs: string[]) =>
  xs.length === 0
    ? "none"
    : xs.length === 1
      ? xs[0]
      : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const ord = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

export const BALARISHTA_CAVEATS = [
  "Chapter 6 is Varahamihira's list of combinations for death in infancy; 6.6 gives the only stated terms (at once, eight years, four years, a month) and 6.12 gives the timing by the Moon's return. For a native past eight years the verses are read as arishtas already lived through, which makes the chapter a second witness beside Parashara's chapter 9 rather than a prediction.",
  "Houses are whole signs from the lagna, aspects are Parashari drishti at the tab's floor, benefics and malefics natural (3.11) with the waning Moon and Mercury in bad company counted malefic; the nodes count as malefics where a verse says malefics but never as the Moon's companion in 6.9. Strength means Shadbala at or above its requirement; where Shadbala is absent, verses that ask for a strong planet are shown untested.",
  "Readings the verse leaves open are marked provisional: the twilight of 6.1 is the Shadbala module's one ghati of sunrise or sunset (Varahamihira defines sandhya in the Brihat Samhita), the eastern and western halves of 6.2 are houses 10 to 3 and 4 to 9, the eclipsed luminary of 6.9 is one in a node's sign, and the 6.7 hemming means malefics in both adjacent signs with no benefic in either.",
];

export function computeBalarishta(
  positions: PlanetPosition[],
  lagnaLon: number,
  deps: HouseDeps,
  shadbala?: ShadbalaResult,
): BalarishtaResult {
  const lagnaIdx = Math.floor((((lagnaLon % 360) + 360) % 360) / 30);
  const lagnaDeg = (((lagnaLon % 360) + 360) % 360) - lagnaIdx * 30;
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl);
  const moon = pos("Moon")!;
  const sun = pos("Sun")!;
  const houseOf = (p: PlanetPosition) => houseFrom(lagnaIdx, p.signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const isMal = (p: PlanetPosition) => !isBen(p);
  const inSign = (si: number) => positions.filter((p) => p.signIndex === si);
  const inHouse = (h: number) => inSign(signOfHouse(h));
  const names = (ps: PlanetPosition[]) => ps.map((p) => p.planet as string);
  const malIn = (h: number) => inHouse(h).filter(isMal);
  const benIn = (h: number) => inHouse(h).filter(isBen);
  const withPl = (p: PlanetPosition) =>
    inSign(p.signIndex).filter((x) => x.planet !== p.planet);
  const aspectsSign = (a: PlanetPosition, si: number) =>
    a.signIndex !== si && deps.aspect(a.planet, a.signIndex, si) > 0;
  const aspecting = (target: PlanetPosition) =>
    positions.filter(
      (a) => a.planet !== target.planet && aspectsSign(a, target.signIndex),
    );
  const strong = (p: PlanetPosition) =>
    shadbala?.planets.find((x) => x.planet === p.planet)?.strong;
  const strongBen = (p: PlanetPosition) => isBen(p) && strong(p) === true;
  const strongMal = (p: PlanetPosition) => isMal(p) && strong(p) === true;
  const waxing = moonWaxing(positions);
  const benInKendras = KENDRA.flatMap((h) => benIn(h));
  const hemmedByMal = (si: number) => {
    const a = inSign((si + 11) % 12),
      b = inSign((si + 1) % 12);
    return a.some(isMal) && b.some(isMal) && !a.some(isBen) && !b.some(isBen);
  };
  const hemmedByBen = (si: number) => {
    const a = inSign((si + 11) % 12),
      b = inSign((si + 1) % 12);
    return a.some(isBen) && b.some(isBen) && !a.some(isMal) && !b.some(isMal);
  };
  const lastNavamsa = (p: PlanetPosition) => p.degInSign >= 30 - 30 / 9;
  const sk = shadbala !== undefined;
  const mh = houseOf(moon);
  const moonSign = moon.signIndex;
  const moonBenAsp = aspecting(moon).filter(isBen);
  const moonMalAsp = aspecting(moon).filter(isMal);
  const moonMalWith = withPl(moon).filter(isMal);
  const nodeSigns = positions
    .filter((p) => p.planet === "Rahu" || p.planet === "Ketu")
    .map((p) => p.signIndex);
  const eclipsed = (p: PlanetPosition) => nodeSigns.includes(p.signIndex);
  const st = (b: boolean): ArishtaStanding => (b ? "holds" : "clear");

  const rules: ArishtaRule[] = [];

  // 6.1a: twilight, lunar hora rising, malefics in the last navamsas.
  {
    const lunarHora = lagnaIdx % 2 === 0 ? lagnaDeg >= 15 : lagnaDeg < 15;
    const lastMal = positions.filter((p) => isMal(p) && lastNavamsa(p));
    const twilight = shadbala?.twilight;
    const parts = [
      twilight === undefined
        ? "twilight unknown"
        : twilight
          ? "born in the twilight"
          : "not a twilight birth",
      lunarHora ? "the Moon's hora rises" : "the Sun's hora rises",
      lastMal.length
        ? `${list(names(lastMal))} in a last navamsa`
        : "no malefic in a last navamsa",
    ];
    const holds = twilight === true && lunarHora && lastMal.length > 0;
    rules.push({
      key: "sandhya",
      verse: 1,
      rule: "Birth in the twilight while the Moon's hora rises, with malefics in the last navamsas of their signs",
      result: "death soon after birth",
      standing:
        twilight === undefined && lunarHora && lastMal.length
          ? "untested"
          : st(holds),
      detail: parts.join("; "),
      source: V(1, true),
      iyer: "p. 53",
      adyar: "p. 310",
      provisional:
        "Twilight is the Shadbala module's one ghati of sunrise or sunset; sandhya is defined in the Brihat Samhita, not here. The hora follows Parashara 6.5-6 (odd signs: Sun's half first).",
    });
  }
  // 6.1b: the Moon and three malefics in the four kendras, one each.
  {
    const kendraMal = KENDRA.map((h) =>
      malIn(h).filter((p) => p.planet !== "Moon"),
    );
    const moonInK = KENDRA.includes(mh);
    const others = KENDRA.filter((h) => h !== mh);
    const oneEach =
      moonInK && others.every((h) => malIn(h).some((p) => p.planet !== "Moon"));
    rules.push({
      key: "kendras",
      verse: 1,
      rule: "The Moon and three malefics occupy the four kendras, one in each",
      result: "death soon after birth",
      standing: st(oneEach),
      detail: `Moon in the ${ord(mh)}; malefics in the kendras: ${list(
        KENDRA.map((h, i) =>
          kendraMal[i].length
            ? `${ord(h)} ${names(kendraMal[i]).join("+")}`
            : "",
        ).filter(Boolean),
      )}`,
      source: V(1),
      iyer: "p. 53",
      adyar: "p. 310",
    });
  }
  // 6.2a: Cancer or Scorpio rising, malefics east, benefics west.
  {
    const rising = lagnaIdx === 3 || lagnaIdx === 7;
    const east = [10, 11, 12, 1, 2, 3];
    const mals = positions.filter(isMal);
    const bens = positions.filter(isBen);
    const malEast = mals.every((p) => east.includes(houseOf(p)));
    const benWest = bens.every((p) => !east.includes(houseOf(p)));
    rules.push({
      key: "halves",
      verse: 2,
      rule: "Cancer or Scorpio rising, the malefics all in the eastern half and the benefics all in the western half",
      result: "death at once",
      standing: st(rising && malEast && benWest),
      detail: `${rising ? "Cancer or Scorpio rises" : "the lagna is neither Cancer nor Scorpio"}; malefics ${malEast ? "all east" : "not all east"}, benefics ${benWest ? "all west" : "not all west"}`,
      source: V(2, true),
      iyer: "p. 54",
      adyar: "pp. 313-14",
      provisional:
        "The halves are taken as houses 10 to 3 and 4 to 9 by whole signs; the commentator measures them from the meridian degree.",
    });
  }
  // 6.2b: malefics in 12 and 2, or 6 and 8.
  {
    const a = malIn(12).length > 0 && malIn(2).length > 0;
    const b = malIn(6).length > 0 && malIn(8).length > 0;
    rules.push({
      key: "pairs",
      verse: 2,
      rule: "Malefics in the 12th and 2nd, or in the 6th and 8th, from the lagna",
      result: "death",
      standing: st(a || b),
      detail: `12th ${list(names(malIn(12)))}, 2nd ${list(names(malIn(2)))}; 6th ${list(names(malIn(6)))}, 8th ${list(names(malIn(8)))}`,
      source: V(2),
      iyer: "p. 54",
      adyar: "p. 314",
      provisional:
        "Iyer notes that some commentators require all four houses, and Garga allows any of four pairings; the two pairs of the verse are used.",
    });
  }
  // 6.3: malefics in lagna, 7th and Moon's sign, Moon unaspected by benefics.
  {
    const a = malIn(1).length > 0,
      b = malIn(7).length > 0,
      c = inSign(moonSign).some((p) => isMal(p) && p.planet !== "Moon");
    const holds = a && b && c && moonBenAsp.length === 0;
    rules.push({
      key: "threeSigns",
      verse: 3,
      rule: "A malefic in each of the rising sign, the setting sign and the Moon's sign, the Moon without a benefic aspect",
      result: "death at once",
      standing: st(holds),
      detail: `lagna ${list(names(malIn(1)))}; 7th ${list(names(malIn(7)))}; with the Moon ${list(names(moonMalWith))}; benefics aspecting the Moon ${list(names(moonBenAsp))}`,
      source: V(3),
      iyer: "pp. 54-55",
      adyar: "p. 316",
    });
  }
  // 6.4: waning Moon in 12th, malefics in lagna and 8th, no benefic in kendras.
  rules.push({
    key: "twelfth",
    verse: 4,
    rule: "The waning Moon in the 12th, malefics in the lagna and the 8th, no benefic in a kendra",
    result: "death at once",
    standing: st(
      !waxing &&
        mh === 12 &&
        malIn(1).length > 0 &&
        malIn(8).length > 0 &&
        benInKendras.length === 0,
    ),
    detail: `Moon ${waxing ? "waxing" : "waning"} in the ${ord(mh)}; lagna ${list(names(malIn(1)))}, 8th ${list(names(malIn(8)))}; benefics in kendras ${list(names(benInKendras))}`,
    source: V(4),
    iyer: "p. 55",
    adyar: "p. 317",
  });
  // 6.5: Moon with a malefic in 1/7/8/12, no benefic in kendras.
  rules.push({
    key: "moonMalefic",
    verse: 5,
    rule: "The Moon joined by a malefic in the 1st, 7th, 8th or 12th, no benefic in a kendra",
    result: "death soon after birth",
    standing: st(
      [1, 7, 8, 12].includes(mh) &&
        moonMalWith.length > 0 &&
        benInKendras.length === 0,
    ),
    detail: `Moon in the ${ord(mh)} with ${list(names(moonMalWith))}; benefics in kendras ${list(names(benInKendras))}`,
    source: V(5),
    iyer: "p. 55",
    adyar: "pp. 317-19",
  });
  // 6.6: Moon in 6 or 8 under aspect; benefic there under strong malefics; lagna lord defeated in the 7th.
  {
    const inSixEight = mh === 6 || mh === 8;
    let term = "";
    if (inSixEight) {
      if (moonMalAsp.length && moonBenAsp.length)
        term = "four years (both aspect)";
      else if (moonMalAsp.length) term = "at once (malefic aspect)";
      else if (moonBenAsp.length) term = "eight years (benefic aspect only)";
      else term = "no aspect, the verse is silent";
    }
    const benUnder = [6, 8]
      .flatMap((h) => benIn(h))
      .filter((b) => aspecting(b).some(strongMal));
    const lordPos = positions.find((p) => p.planet === SIGN_LORD[lagnaIdx]);
    const losers = new Set(
      (shadbala?.wars ?? []).map((w) => w.loser as Planet),
    );
    const lordDefeated =
      lordPos !== undefined &&
      houseOf(lordPos) === 7 &&
      losers.has(lordPos.planet) &&
      (shadbala?.wars ?? []).some(
        (w) => w.loser === lordPos.planet && MALEFIC_SEVEN.includes(w.victor),
      );
    const holds =
      (inSixEight && (moonMalAsp.length > 0 || moonBenAsp.length > 0)) ||
      benUnder.length > 0 ||
      lordDefeated;
    rules.push({
      key: "sixEight",
      verse: 6,
      rule: "The Moon in the 6th or 8th: a malefic aspect kills at once, a benefic aspect alone in eight years, both in four; a benefic there under strong malefic aspects, or the lagna lord in the 7th defeated by a malefic in war, in a month",
      result: "death at the stated term",
      standing:
        !sk && !inSixEight && lordPos && houseOf(lordPos) === 7
          ? "untested"
          : st(holds),
      detail: `Moon in the ${ord(mh)}${term ? `: ${term}` : ""}; benefics in 6/8 under strong malefic aspect ${list(names(benUnder))}; lagna lord ${lordPos?.planet ?? "?"} in the ${lordPos ? ord(houseOf(lordPos)) : "?"}${lordDefeated ? ", defeated in war" : ""}`,
      source: V(6),
      iyer: "pp. 55-56",
      adyar: "pp. 319-20",
    });
  }
  // 6.7
  {
    const a =
      !waxing &&
      mh === 1 &&
      malIn(8).length > 0 &&
      KENDRA.some((h) => malIn(h).some((p) => p.planet !== "Moon"));
    const b = [4, 7, 8].includes(mh) && hemmedByMal(moonSign);
    const both =
      mh === 1 &&
      hemmedByMal(moonSign) &&
      malIn(7).length > 0 &&
      malIn(8).length > 0 &&
      !moonBenAsp.some(strongBen);
    rules.push({
      key: "hemmed",
      verse: 7,
      rule: "The waning Moon in the lagna with malefics in the 8th and a kendra, or the Moon in the 4th, 7th or 8th hemmed by malefics: the child dies; the Moon in the lagna hemmed by malefics with malefics in the 7th and 8th and no strong benefic aspect: mother and child",
      result: "death of the child, or of mother and child",
      standing: st(a || b || both),
      detail: `Moon ${waxing ? "waxing" : "waning"} in the ${ord(mh)}${hemmedByMal(moonSign) ? ", hemmed by malefics" : ""}; 7th ${list(names(malIn(7)))}, 8th ${list(names(malIn(8)))}${both ? "; the mother-and-child clause holds" : ""}`,
      source: V(7, true),
      iyer: "p. 56",
      adyar: "pp. 320-22",
      provisional:
        "Hemming is read as malefics in both adjacent signs with no benefic in either.",
    });
  }
  // 6.8
  {
    const a = lastNavamsa(moon) && moonBenAsp.length === 0;
    const b = malIn(5).length > 0 && malIn(9).length > 0;
    const c = mh === 1 && malIn(7).length > 0;
    rules.push({
      key: "lastNavamsa",
      verse: 8,
      rule: "The Moon in the last navamsa of a sign without a benefic aspect; or malefics in the 5th and 9th; or the Moon in the lagna with malefics in the 7th",
      result: "death soon after birth",
      standing: st(a || b || c),
      detail: `Moon at ${moon.degInSign.toFixed(1)}° of ${moon.sign}${lastNavamsa(moon) ? " (last navamsa)" : ""}, benefics aspecting ${list(names(moonBenAsp))}; 5th ${list(names(malIn(5)))}, 9th ${list(names(malIn(9)))}; 7th ${list(names(malIn(7)))}`,
      source: V(8),
      iyer: "p. 56",
      adyar: "p. 324",
    });
  }
  // 6.9
  {
    const marsIn8 = houseOf(pos("Mars")!) === 8;
    const lumRule = (L: PlanetPosition) =>
      houseOf(L) === 1 &&
      eclipsed(L) &&
      withPl(L).some(
        (p) => isMal(p) && p.planet !== "Rahu" && p.planet !== "Ketu",
      ) &&
      marsIn8;
    const a = lumRule(moon),
      b = lumRule(sun);
    const lumC = (L: PlanetPosition) =>
      houseOf(L) === 1 &&
      malIn(5).length > 0 &&
      malIn(8).length > 0 &&
      malIn(9).length > 0 &&
      !withPl(L).some(strongBen) &&
      !aspecting(L).some(strongBen);
    const c = lumC(moon) || lumC(sun);
    const needsStrength =
      !sk &&
      (houseOf(moon) === 1 || houseOf(sun) === 1) &&
      malIn(5).length > 0 &&
      malIn(8).length > 0 &&
      malIn(9).length > 0;
    rules.push({
      key: "eclipsed",
      verse: 9,
      rule: "The eclipsed Moon in the lagna with a malefic and Mars in the 8th: mother and child die; the Sun so placed: by weapons. Either luminary in the lagna with malefics in the 5th, 8th and 9th and no strong benefic with or aspecting it: the child dies",
      result: "death of mother and child, or of the child",
      standing: needsStrength ? "untested" : st(a || b || c),
      detail: `Moon in the ${ord(houseOf(moon))}${eclipsed(moon) ? " in a node's sign" : ""}, Sun in the ${ord(houseOf(sun))}${eclipsed(sun) ? " in a node's sign" : ""}; Mars in the ${ord(houseOf(pos("Mars")!))}; 5th ${list(names(malIn(5)))}, 8th ${list(names(malIn(8)))}, 9th ${list(names(malIn(9)))}`,
      source: V(9, true),
      iyer: "pp. 56-57",
      adyar: "p. 324",
      provisional:
        "An eclipsed luminary is read as one in the sign of Rahu or Ketu; the commentator names Saturn as the companion.",
    });
  }
  // 6.10
  {
    const holds =
      houseOf(pos("Saturn")!) === 12 &&
      houseOf(sun) === 9 &&
      mh === 1 &&
      houseOf(pos("Mars")!) === 8;
    const jup = pos("Jupiter")!;
    const saved =
      holds &&
      strong(jup) === true &&
      [pos("Saturn")!, sun, moon, pos("Mars")!].every((p) =>
        aspectsSign(jup, p.signIndex),
      );
    rules.push({
      key: "fourPlaces",
      verse: 10,
      rule: "Saturn in the 12th, the Sun in the 9th, the Moon in the lagna and Mars in the 8th, not all aspected by a strong Jupiter",
      result: "death soon after birth",
      standing: holds && !sk ? "untested" : st(holds && !saved),
      detail: `Saturn ${ord(houseOf(pos("Saturn")!))}, Sun ${ord(houseOf(sun))}, Moon ${ord(mh)}, Mars ${ord(houseOf(pos("Mars")!))}${saved ? "; a strong Jupiter aspects all four" : ""}`,
      source: V(10),
      iyer: "p. 57",
      adyar: "p. 326",
    });
  }
  // 6.11
  {
    const inPlace = [5, 7, 9, 12, 1, 8].includes(mh) && moonMalWith.length > 0;
    const saviours: Planet[] = ["Venus", "Mercury", "Jupiter"];
    const saved = positions.some(
      (p) =>
        saviours.includes(p.planet) &&
        strong(p) === true &&
        (p.signIndex === moonSign || aspectsSign(p, moonSign)),
    );
    rules.push({
      key: "moonSix",
      verse: 11,
      rule: "The Moon with a malefic in the 5th, 7th, 9th, 12th, 1st or 8th, neither joined nor aspected by a strong Venus, Mercury or Jupiter",
      result: "death soon after birth",
      standing: inPlace && !sk ? "untested" : st(inPlace && !saved),
      detail: `Moon in the ${ord(mh)} with ${list(names(moonMalWith))}${saved ? "; a strong Venus, Mercury or Jupiter joins or aspects" : ""}`,
      source: V(11),
      iyer: "p. 57",
      adyar: "p. 326",
      provisional:
        "Saravali reads the Moon here as waning (Iyer note); the verse does not say so and the test does not require it.",
    });
  }
  // 6.12 timing
  rules.push({
    key: "timing",
    verse: 12,
    rule: "The death falls when the Moon, strong and aspected by strong malefics, returns to the sign of the planet that causes it, to her natal sign or to the rising sign; the sages give a year",
    result: "timing of the death",
    standing: "untested",
    detail: "Transit timing; not computed here.",
    source: V(12),
    iyer: "pp. 57-58",
    adyar: "p. 327",
  });

  const held = rules.filter((r) => r.standing === "holds").length;

  // Counteracting yogas, from the commentator (Iyer pp. 58-59). Provisional throughout.
  const jup = pos("Jupiter")!;
  const lagnaLord = positions.find((p) => p.planet === SIGN_LORD[lagnaIdx]);
  const moonD3Lord = drekkanaLord(moon);
  const benD3 = ["Jupiter", "Mercury", "Venus"].includes(moonD3Lord);
  const benSigns = [1, 2, 3, 5, 6, 8, 11]; // Taurus, Gemini, Cancer, Virgo, Libra, Sagittarius, Pisces (benefic lords)
  const moonSignLord = positions.find((p) => p.planet === SIGN_LORD[moonSign]);
  const kendraSigns = KENDRA.map(signOfHouse);
  const daytime = shadbala?.daytime;
  const antidotes: Antidote[] = [
    {
      key: "jupiterLagna",
      rule: "A strong Jupiter in the rising sign",
      standing:
        houseOf(jup) === 1
          ? sk
            ? st(strong(jup) === true)
            : "untested"
          : "clear",
      detail: `Jupiter in the ${ord(houseOf(jup))}${strong(jup) === true ? ", strong" : strong(jup) === false ? ", weak" : ""}`,
    },
    {
      key: "lagnaLord",
      rule: "The lagna lord strong, free of malefic aspects and aspected by benefics in kendras",
      standing: !lagnaLord
        ? "untested"
        : !sk
          ? "untested"
          : st(
              strong(lagnaLord) === true &&
                !aspecting(lagnaLord).some(isMal) &&
                aspecting(lagnaLord).some(
                  (b) => isBen(b) && kendraSigns.includes(b.signIndex),
                ),
            ),
      detail: lagnaLord
        ? `${lagnaLord.planet}: aspected by ${list(names(aspecting(lagnaLord)))}`
        : "lagna lord not in the chart",
    },
    {
      key: "moonDrekkana",
      rule: "The Moon in the 6th or 8th but in a drekkana of Jupiter, Mercury or Venus",
      standing: mh === 6 || mh === 8 ? st(benD3) : "clear",
      detail: `Moon in the ${ord(mh)}, drekkana of ${moonD3Lord}`,
    },
    {
      key: "fullMoon",
      rule: "The Moon bright, in a benefic's sign, hemmed by benefics and aspected by Venus",
      standing: st(
        waxing &&
          benSigns.includes(moonSign) &&
          hemmedByBen(moonSign) &&
          aspectsSign(pos("Venus")!, moonSign),
      ),
      detail: `Moon ${waxing ? "waxing" : "waning"} in ${moon.sign}${hemmedByBen(moonSign) ? ", hemmed by benefics" : ""}${aspectsSign(pos("Venus")!, moonSign) ? ", aspected by Venus" : ""}`,
    },
    {
      key: "beneficKendra",
      rule: "A strong Mercury, Venus or Jupiter in a kendra, even with a malefic",
      standing: sk
        ? st(
            positions.some(
              (p) =>
                ["Mercury", "Venus", "Jupiter"].includes(p.planet) &&
                KENDRA.includes(houseOf(p)) &&
                strong(p) === true,
            ),
          )
        : "untested",
      detail: list(
        positions
          .filter(
            (p) =>
              ["Mercury", "Venus", "Jupiter"].includes(p.planet) &&
              KENDRA.includes(houseOf(p)),
          )
          .map(
            (p) =>
              `${p.planet} ${ord(houseOf(p))}${strong(p) === true ? " strong" : strong(p) === false ? " weak" : ""}`,
          ),
      ),
    },
    {
      key: "brightHemmed",
      rule: "The Moon bright and hemmed by benefics",
      standing: st(waxing && hemmedByBen(moonSign)),
      detail: `Moon ${waxing ? "waxing" : "waning"}${hemmedByBen(moonSign) ? ", hemmed by benefics" : ""}`,
    },
    {
      key: "dayNight",
      rule: "The Moon in the 6th or 8th but bright, or waning by day, or waxing by night",
      standing:
        mh === 6 || mh === 8
          ? daytime === undefined
            ? waxing
              ? "holds"
              : "untested"
            : st(waxing || (daytime && !waxing) || (!daytime && waxing))
          : "clear",
      detail: `Moon in the ${ord(mh)}, ${waxing ? "waxing" : "waning"}, ${daytime === undefined ? "day or night unknown" : daytime ? "day birth" : "night birth"}`,
    },
    {
      key: "jupiterAspect",
      rule: "The Moon bright and aspected by Jupiter from a kendra",
      standing: st(
        waxing && KENDRA.includes(houseOf(jup)) && aspectsSign(jup, moonSign),
      ),
      detail: `Jupiter in the ${ord(houseOf(jup))}${aspectsSign(jup, moonSign) ? ", aspects the Moon" : ""}`,
    },
    {
      key: "rahu",
      rule: "Rahu in the 3rd, 6th or 11th aspected by benefics",
      standing: (() => {
        const r = pos("Rahu");
        if (!r) return "untested" as ArishtaStanding;
        return st([3, 6, 11].includes(houseOf(r)) && aspecting(r).some(isBen));
      })(),
      detail: (() => {
        const r = pos("Rahu");
        return r
          ? `Rahu in the ${ord(houseOf(r))}, aspected by ${list(names(aspecting(r).filter(isBen)))}`
          : "";
      })(),
    },
    {
      key: "moonLordKendra",
      rule: "The lord of the Moon's sign, or a benefic, in a kendra",
      standing: st(
        (moonSignLord !== undefined &&
          KENDRA.includes(houseOf(moonSignLord))) ||
          benInKendras.length > 0,
      ),
      detail: `${moonSignLord?.planet ?? "?"} in the ${moonSignLord ? ord(houseOf(moonSignLord)) : "?"}; benefics in kendras ${list(names(benInKendras))}`,
    },
    {
      key: "allAspect",
      rule: "The bright Moon aspected by all the planets",
      standing: st(
        waxing &&
          positions
            .filter(
              (p) =>
                p.planet !== "Moon" &&
                p.planet !== "Rahu" &&
                p.planet !== "Ketu",
            )
            .every((p) => aspectsSign(p, moonSign)),
      ),
      detail: `aspecting the Moon: ${list(names(aspecting(moon)))}`,
    },
  ];

  const caveats = [...BALARISHTA_CAVEATS];
  if (!sk)
    caveats.push(
      "Shadbala is not available for this chart, so the strength tests of 6.6, 6.9-11 and several antidotes are shown untested.",
    );

  return {
    rules,
    antidotes,
    held,
    horizonYears: 8,
    shadbalaKnown: sk,
    caveats,
    sources: {
      chapter: { label: "Brihat Jataka 6", url: `${BJ_BASE}1501541.html` },
      antidotes: {
        label: "Commentary in Iyer 1885, pp. 58-59",
        url: IYER,
        provisional: true,
      },
    },
  };
}

/** Lord of the drekkana: first third the sign's own lord, second the 5th sign's, third the 9th's (BPHS 6.7-8; BJ 1.11). */
function drekkanaLord(p: PlanetPosition): Planet {
  const part = Math.floor(p.degInSign / 10);
  const si = (p.signIndex + [0, 4, 8][Math.min(part, 2)]) % 12;
  return SIGN_LORD[si];
}
