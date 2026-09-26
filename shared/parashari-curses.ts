// BPHS chapter 83 (effects of curses in the previous birth), read from
// http://jyotishvidya.com/ch83.htm. Every yoga in the chapter concerns want of a male
// issue (the translator's note under 83.33), grouped by the source of the curse, each
// group followed by its remedial verses. Houses are whole signs from the lagna,
// "associated with" is read as conjunction in one sign, hemming as malefics in both
// adjacent signs with no benefic in either, strength as Shadbala (chapter 27).
import { SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { computeVargas } from "./vargas";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const navamsaSign = (p: PlanetPosition) => (p.signIndex * 9 + Math.floor(p.degInSign / (30 / 9))) % 12;
const DUS = [6, 8, 12];
/** Signs owned by the natural malefics Sun, Mars and Saturn (provisional reading of "malefic Rashi"). */
const MALEFIC_SIGNS = [0, 4, 7, 9, 10];

export const CURSE_CAVEATS: string[] = [
  "Chapter 83 lists the yogas Parashara gives for want of a male issue through a curse carried from the previous birth: of a serpent (83.9-16), the father (83.20-30), the mother (83.34-50), a brother (83.51-61), the maternal uncle (83.65-68), a Brahmin (83.71-78), the spouse (83.82-92) and departed souls whose rites were not performed (83.95-105), each with its remedial verses. The translator's note under 83.33 says childlessness in this chapter means want of a male issue. For an adult chart this is a fact that can be checked, so these cards serve the same purpose as the parental verses of chapter 9. The wording is Parashara's and is shown as written.",
  "Houses are whole signs from the lagna, association means conjunction in one sign, hemming means malefics in the two adjacent signs with no benefic in either, a malefic sign or navamsa is one owned by Sun, Mars or Saturn (provisional), and strength means Shadbala, so 83.7-8 and the strength clauses of 83.15 and 83.23 are withheld without it. Not applied: the two yogas that need Gulika (83.12 and 83.103), which is not computed, and the second brother yoga (83.52), whose translation places Mars in the 1st and the 8th at once. The remedies of 83.109-111 (by the planet responsible) are not listed.",
];

type Combo = { verse: string; test: () => string | null };

export function curseFindings(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const L = (h: number): Planet => SIGN_LORD[signOfHouse(h)] as Planet;
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const inSign = (si: number) => positions.filter((p) => p.signIndex === si);
  const inHouse = (h: number) => inSign(signOfHouse(h));
  const has = (h: number, pl: Planet) => houseOf(pl) === h;
  const allIn = (h: number, pls: Planet[]) => pls.every((pl) => has(h, pl));
  const malIn = (h: number) => inHouse(h).some((p) => !isBen(p));
  const withPl = (a: Planet, b: Planet) => a !== b && pos(a).signIndex === pos(b).signIndex;
  const withMal = (pl: Planet) => inSign(pos(pl).signIndex).some((p) => p.planet !== pl && !isBen(p));
  const withBen = (pl: Planet) => inSign(pos(pl).signIndex).some((p) => p.planet !== pl && isBen(p));
  const inDus = (pl: Planet) => DUS.includes(houseOf(pl));
  const deb = (pl: Planet) => pos(pl).dignity === "Debilitated";
  const inimical = (pl: Planet) => pos(pl).dignity === "Inimical";
  const aspects = (a: Planet, b: Planet) => a !== b && pos(a).signIndex !== pos(b).signIndex && deps.aspect(a, pos(a).signIndex, pos(b).signIndex) > 0;
  const malAspecting = (pl: Planet) => positions.filter((p) => !isBen(p) && aspects(p.planet, pl)).map((p) => p.planet);
  const hemmedByMal = (si: number) => {
    const a = inSign((si + 11) % 12), b = inSign((si + 1) % 12);
    return a.some((p) => !isBen(p)) && b.some((p) => !isBen(p)) && !a.some(isBen) && !b.some(isBen);
  };
  const hemmedPl = (pl: Planet) => hemmedByMal(pos(pl).signIndex);
  const navLord = (pl: Planet): Planet => SIGN_LORD[navamsaSign(pos(pl))] as Planet;
  const exchange = (a: number, b: number) => houseOf(L(a)) === b && houseOf(L(b)) === a;
  const strong = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl)?.strong;
  const weak = (pl: Planet) => strong(pl) === false;
  const vargas = computeVargas(positions, lagnaLon);
  const combust = (pl: Planet) => vargas.planets.find((v) => v.planet === pl)?.combust === true;
  const sun = pos("Sun"), moon = pos("Moon");
  const waning = ((((moon.lon - sun.lon) % 360) + 360) % 360) >= 180;
  const lordTxt = (h: number) => `${L(h)} (lord of the ${ord(h)})`;
  const l1 = L(1), l5 = L(5), l10 = L(10);
  const sign5 = signOfHouse(5);

  const group = (id: string, title: string, planets: Planet[], combos: Combo[], verses: string, remedy: string, remedyVerse: string) => {
    const hits = combos.map((c) => ({ verse: c.verse, text: c.test() })).filter((c) => c.text);
    if (!hits.length) return;
    const body = hits.map((h) => `${h.text} (83.${h.verse})`).join("; ");
    F.push({
      id, kind: "evil", title, tone: "strain", planets: Array.from(new Set(planets)), source: S(83, verses),
      text: `${body}. Parashara reads want of a male issue through ${title.charAt(0).toLowerCase()}${title.slice(1)} and prescribes ${remedy} (83.${remedyVerse}); shown as written.`,
    });
  };

  // ---- 83.7-8: general want of issue (Shadbala) ----
  if (shadbala) {
    if (weak("Jupiter") && weak(l1) && weak(l5)) {
      F.push({ id: "pa-curse-83-7", kind: "evil", title: "Jupiter and the lords of the 1st and 5th all weak", tone: "strain", planets: ["Jupiter", l1, l5], source: S(83, "7"),
        text: `Jupiter, ${lordTxt(1)} and ${lordTxt(5)} are all below their Shadbala requirement. Parashara reads want of a son; shown as written.` });
    }
    const strongMal5 = (["Sun", "Mars", "Saturn"] as Planet[]).filter((pl) => has(5, pl) && strong(pl) === true);
    if (has(5, "Rahu")) strongMal5.push("Rahu");
    if (strongMal5.length && weak("Jupiter") && weak(l5)) {
      F.push({ id: "pa-curse-83-8", kind: "evil", title: "Strong malefics in the 5th, its lord and Jupiter weak", tone: "strain", planets: [...strongMal5, "Jupiter", l5], source: S(83, "8"),
        text: `${list(strongMal5)} in the 5th${strongMal5.some((p) => p !== "Rahu") ? " above the Shadbala requirement" : ""}, while Jupiter and ${lordTxt(5)} are weak. Parashara reads want of a son; shown as written.` });
    }
  }

  // ---- 83.9-16: curse of a serpent ----
  group("pa-curse-83-9", "The curse of a serpent", ["Rahu", l5, "Jupiter"], [
    { verse: "9", test: () => (has(5, "Rahu") && aspects("Mars", "Rahu") ? "Rahu in the 5th aspected by Mars" : null) },
    { verse: "10", test: () => (withPl(l5, "Rahu") && has(5, "Moon") && aspects("Saturn", "Moon") ? `${lordTxt(5)} with Rahu, the Moon in the 5th aspected by Saturn` : null) },
    { verse: "11", test: () => (withPl("Jupiter", "Mars") && has(1, "Rahu") && inDus(l5) ? `Jupiter, significator of children, with Mars, Rahu in the lagna and ${lordTxt(5)} in the ${ord(houseOf(l5))}` : null) },
    { verse: "13", test: () => ([0, 7].includes(sign5) && (withPl(l5, "Rahu") || withPl(l5, "Mercury")) ? `the 5th is ${sign5 === 0 ? "Aries" : "Scorpio"} and its lord Mars is with ${withPl(l5, "Rahu") ? "Rahu" : "Mercury"}` : null) },
    { verse: "14-15", test: () => (allIn(5, ["Sun", "Saturn", "Mars", "Rahu", "Mercury", "Jupiter"]) && shadbala && weak(l5) && weak(l1) ? "Sun, Saturn, Mars, Rahu, Mercury and Jupiter all in the 5th with the lords of the 5th and the lagna weak" : null) },
    { verse: "16", test: () => ((withPl(l1, "Rahu") || withPl("Jupiter", "Rahu")) && withPl(l5, "Mars") ? `${withPl(l1, "Rahu") ? lordTxt(1) : "Jupiter"} with Rahu and ${lordTxt(5)} with Mars` : null) },
  ], "9-16", "worship of the serpent king with gifts of a cow, land, sesame and gold", "17-19");

  // ---- 83.20-30: curse of the father ----
  group("pa-curse-83-20", "The curse of the father", ["Sun", l5, l1, l10, "Jupiter"], [
    { verse: "20", test: () => (deb("Sun") && navLord("Sun") === "Saturn" && hemmedPl("Sun") && has(5, "Sun") ? "the debilitated Sun in the 5th, in Saturn's navamsa and hemmed by malefics" : null) },
    { verse: "21", test: () => (l5 === "Sun" && [1, 5, 9].includes(houseOf("Sun")) && withMal("Sun") && hemmedPl("Sun") && malAspecting("Sun").length ? "the Sun as 5th lord in a trine with a malefic, hemmed by malefics and under malefic aspect" : null) },
    { verse: "22", test: () => (pos("Jupiter").signIndex === 4 && withPl(l5, "Sun") && malIn(1) && malIn(5) ? `Jupiter in Leo, ${lordTxt(5)} with the Sun, malefics in the lagna and the 5th` : null) },
    { verse: "23", test: () => (shadbala && weak(l1) && has(5, l1) && combust(l5) && malIn(1) && malIn(5) ? `${lordTxt(1)} weak in the 5th, ${lordTxt(5)} combust, malefics in the lagna and the 5th` : null) },
    { verse: "24", test: () => (exchange(5, 10) && malIn(1) && malIn(5) ? "the lords of the 5th and 10th exchanged, malefics in the lagna and the 5th" : null) },
    { verse: "25", test: () => (l10 === "Mars" && withPl("Mars", l5) && malIn(1) && malIn(5) && malIn(10) ? `Mars as 10th lord with ${lordTxt(5)}, malefics in the lagna, 5th and 10th` : null) },
    { verse: "26", test: () => (inDus(l10) && MALEFIC_SIGNS.includes(pos("Jupiter").signIndex) && withMal(l1) && withMal(l5) ? `${lordTxt(10)} in the ${ord(houseOf(l10))}, Jupiter in a malefic sign, the lords of the lagna and the 5th each with a malefic` : null) },
    { verse: "27", test: () => (["Sun", "Mars", "Saturn"].every((pl) => [1, 5].includes(houseOf(pl as Planet))) && ["Rahu", "Jupiter"].every((pl) => [8, 12].includes(houseOf(pl as Planet))) ? "Sun, Mars and Saturn in the lagna and the 5th, Rahu and Jupiter in the 8th and the 12th" : null) },
    { verse: "28", test: () => (has(8, "Sun") && has(5, "Saturn") && withPl(l5, "Rahu") && malIn(1) ? `Sun in the 8th, Saturn in the 5th, ${lordTxt(5)} with Rahu, a malefic in the lagna` : null) },
    { verse: "29", test: () => (has(1, L(12)) && has(5, L(8)) && has(8, l10) ? `${lordTxt(12)} in the lagna, ${lordTxt(8)} in the 5th, ${lordTxt(10)} in the 8th` : null) },
    { verse: "30", test: () => (has(5, L(6)) && has(6, l10) && withPl("Jupiter", "Rahu") ? `${lordTxt(6)} in the 5th, ${lordTxt(10)} in the 6th, Jupiter with Rahu` : null) },
  ], "20-30", "shraddha at Gaya, feeding Brahmins, kanyadana and the gift of a cow", "31-33");

  // ---- 83.34-50: curse of the mother ----
  group("pa-curse-83-34", "The curse of the mother", ["Moon", l5, L(4)], [
    { verse: "34", test: () => (l5 === "Moon" && (deb("Moon") || hemmedPl("Moon")) && malIn(4) && malIn(5) ? `the Moon as 5th lord ${deb("Moon") ? "debilitated" : "hemmed by malefics"}, malefics in the 4th and 5th` : null) },
    { verse: "35", test: () => (has(11, "Saturn") && malIn(4) && has(5, "Moon") && deb("Moon") ? "Saturn in the 11th, malefics in the 4th, the debilitated Moon in the 5th" : null) },
    { verse: "36", test: () => (inDus(l5) && deb(l1) && withMal("Moon") ? `${lordTxt(5)} in the ${ord(houseOf(l5))}, ${lordTxt(1)} debilitated, the Moon with malefics` : null) },
    { verse: "37", test: () => (inDus(l5) && MALEFIC_SIGNS.includes(navamsaSign(moon)) && malIn(1) && malIn(5) ? `${lordTxt(5)} in the ${ord(houseOf(l5))}, the Moon in a malefic navamsa, malefics in the lagna and the 5th` : null) },
    { verse: "38", test: () => ([5, 9].includes(houseOf("Moon")) && withPl(l5, "Moon") && ["Saturn", "Rahu", "Mars"].every((pl) => withPl("Moon", pl as Planet)) ? `${lordTxt(5)} and the Moon with Saturn, Rahu and Mars in the ${ord(houseOf("Moon"))}` : null) },
    { verse: "39", test: () => (L(4) === "Mars" && withPl("Mars", "Saturn") && withPl("Mars", "Rahu") && has(5, "Sun") && has(1, "Moon") ? "Mars as 4th lord with Saturn and Rahu, the Sun in the 5th and the Moon in the lagna" : null) },
    { verse: "40", test: () => (has(6, l1) && has(6, l5) && has(8, L(4)) && has(1, L(8)) && has(1, l10) ? "the lords of the lagna and 5th in the 6th, the 4th lord in the 8th, the lords of the 8th and 10th in the lagna" : null) },
    { verse: "41", test: () => (has(1, L(6)) && has(1, L(8)) && has(12, L(4)) && has(5, "Moon") && has(5, "Jupiter") && withMal("Moon") ? "the lords of the 6th and 8th in the lagna, the 4th lord in the 12th, Moon and Jupiter with malefics in the 5th" : null) },
    { verse: "42", test: () => (hemmedByMal(lagnaIdx) && waning && has(7, "Moon") && has(4, "Rahu") && has(5, "Saturn") ? "the lagna hemmed by malefics, the waning Moon in the 7th, Rahu in the 4th and Saturn in the 5th" : null) },
    { verse: "43", test: () => (exchange(5, 8) && inDus(L(4)) && inDus("Moon") ? `the lords of the 5th and 8th exchanged, ${lordTxt(4)} and the Moon in dusthanas` : null) },
    { verse: "44", test: () => (lagnaIdx === 3 && has(1, "Mars") && has(1, "Rahu") && has(5, "Moon") && has(5, "Saturn") ? "Cancer lagna with Mars and Rahu, Moon and Saturn in the 5th" : null) },
    { verse: "45", test: () => (has(1, "Mars") && has(5, "Rahu") && has(8, "Sun") && has(12, "Saturn") && inDus(l1) && inDus(L(4)) ? "Mars, Rahu, Sun and Saturn in the 1st, 5th, 8th and 12th, the lords of the lagna and 4th in dusthanas" : null) },
    { verse: "46", test: () => (allIn(8, ["Mars", "Rahu", "Jupiter"]) && allIn(5, ["Saturn", "Moon"]) ? "Mars, Rahu and Jupiter in the 8th, Saturn and the Moon in the 5th" : null) },
  ], "34-50", "a bath at Setu, a lakh of Gayatri, gifts for the afflicting planets and circling a pipal tree", "47-50");

  // ---- 83.51-61: curse of a brother ----
  group("pa-curse-83-51", "The curse of a brother", ["Mars", L(3), l5], [
    { verse: "51", test: () => (has(5, L(3)) && withPl(L(3), "Rahu") && withPl(L(3), "Mars") && has(8, l1) && has(8, l5) ? `${lordTxt(3)} with Rahu and Mars in the 5th, the lords of the lagna and 5th in the 8th` : null) },
    { verse: "53", test: () => (deb("Jupiter") && has(3, "Jupiter") && has(5, "Saturn") && allIn(8, ["Moon", "Mars"]) ? "the debilitated Jupiter in the 3rd, Saturn in the 5th, Moon and Mars in the 8th" : null) },
    { verse: "54", test: () => (has(12, l1) && has(5, "Mars") && has(8, l5) && withMal(l5) ? `${lordTxt(1)} in the 12th, Mars in the 5th, ${lordTxt(5)} with a malefic in the 8th` : null) },
    { verse: "55", test: () => (hemmedByMal(lagnaIdx) && hemmedByMal(sign5) && inDus(l1) && inDus(l5) ? "the lagna and the 5th both hemmed by malefics, their lords in dusthanas" : null) },
    { verse: "56", test: () => (has(3, l10) && withMal(l10) && has(5, "Mars") && withBen("Mars") ? `${lordTxt(10)} with a malefic in the 3rd, a benefic with Mars in the 5th` : null) },
    { verse: "57", test: () => ([2, 5].includes(sign5) && allIn(5, ["Saturn", "Rahu"]) && allIn(12, ["Mercury", "Mars"]) ? "the 5th in Mercury's sign holding Saturn and Rahu, Mercury and Mars in the 12th" : null) },
    { verse: "58", test: () => (has(3, l1) && has(5, L(3)) && malIn(1) && malIn(3) && malIn(5) ? `${lordTxt(1)} in the 3rd, ${lordTxt(3)} in the 5th, malefics in the lagna, 3rd and 5th` : null) },
    { verse: "59", test: () => (has(8, L(3)) && has(5, "Jupiter") && withPl("Jupiter", "Saturn") ? `${lordTxt(3)} in the 8th, Jupiter with Saturn in the 5th` : null) },
    { verse: "60-61", test: () => (has(5, L(8)) && has(5, L(3)) && allIn(8, ["Mars", "Saturn"]) ? `${lordTxt(8)} with ${lordTxt(3)} in the 5th, Mars and Saturn in the 8th` : null) },
  ], "51-61", "the Chandrayana fast, hearing the Harivamsa, planting a pipal by a sacred river and gifts of cows and land", "62-64");

  // ---- 83.65-68: curse of the maternal uncle ----
  group("pa-curse-83-65", "The curse of the maternal uncle", ["Mercury", "Saturn", l1, l5], [
    { verse: "65", test: () => (allIn(5, ["Mercury", "Jupiter", "Mars", "Rahu"]) && has(1, "Saturn") ? "Mercury, Jupiter, Mars and Rahu in the 5th with Saturn in the lagna" : null) },
    { verse: "66", test: () => (has(5, l1) && has(5, l5) && allIn(5, ["Saturn", "Mars", "Mercury"]) ? "the lords of the lagna and 5th in the 5th with Saturn, Mars and Mercury" : null) },
    { verse: "67", test: () => (has(1, L(6)) && combust(L(6)) && has(7, "Saturn") && withPl(l1, "Mercury") ? `the combust ${lordTxt(6)} in the lagna, Saturn in the 7th, ${lordTxt(1)} with Mercury` : null) },
    { verse: "68", test: () => (has(1, l1) && has(1, L(4)) && allIn(5, ["Moon", "Mercury", "Mars"]) ? "the lords of the lagna and 4th in the lagna, Moon, Mercury and Mars in the 5th" : null) },
  ], "65-68", "installing an image of Vishnu and building a well, dam or reservoir", "69-70");

  // ---- 83.71-78: curse of a Brahmin ----
  group("pa-curse-83-71", "The curse of a Brahmin", ["Jupiter", "Rahu", l5, L(9)], [
    { verse: "72", test: () => ([8, 11].includes(pos("Rahu").signIndex) && has(5, "Jupiter") ? "Rahu in Jupiter's sign and Jupiter in the 5th" : null) },
    { verse: "73", test: () => (has(5, L(9)) && has(8, l5) && ["Jupiter", "Mars", "Rahu"].every((pl) => withPl(l5, pl as Planet)) ? `${lordTxt(9)} in the 5th, ${lordTxt(5)} in the 8th with Jupiter, Mars and Rahu` : null) },
    { verse: "74", test: () => (deb(L(9)) && has(5, L(12)) && withPl(L(12), "Rahu") ? `${lordTxt(9)} debilitated, ${lordTxt(12)} with Rahu in the 5th` : null) },
    { verse: "75", test: () => (deb("Jupiter") && [1, 5].includes(houseOf("Rahu")) && inDus(l5) ? `Jupiter debilitated, Rahu in the ${ord(houseOf("Rahu"))}, ${lordTxt(5)} in the ${ord(houseOf(l5))}` : null) },
    { verse: "76", test: () => (has(8, l5) && ((has(8, "Jupiter") && withMal(l5) && withMal("Jupiter")) || (withPl(l5, "Sun") && withPl(l5, "Moon"))) ? `${lordTxt(5)} in the 8th ${has(8, "Jupiter") && l5 !== "Jupiter" ? "with Jupiter and malefics" : "with the Sun and Moon"}` : null) },
    { verse: "77", test: () => (navLord("Jupiter") === "Saturn" && withPl("Jupiter", "Saturn") && withPl("Jupiter", "Mars") && has(12, l5) ? `Jupiter in Saturn's navamsa with Saturn and Mars, ${lordTxt(5)} in the 12th` : null) },
    { verse: "78", test: () => ((has(1, "Jupiter") && withPl("Jupiter", "Saturn") && has(9, "Rahu")) || (has(12, "Jupiter") && withPl("Jupiter", "Rahu")) ? (has(12, "Jupiter") ? "Jupiter with Rahu in the 12th" : "Jupiter with Saturn in the lagna and Rahu in the 9th") : null) },
  ], "71-78", "the Chandrayana fast, penance, feeding Brahmins and the gift of a cow and five gems with gold", "79-81");

  // ---- 83.82-92: curse of the spouse ----
  group("pa-curse-83-82", "The curse of the spouse", ["Venus", L(7), l5], [
    { verse: "82", test: () => (has(5, l1) && navLord("Saturn") === L(7) && has(8, l5) ? `${lordTxt(1)} in the 5th, Saturn in the navamsa of ${lordTxt(7)}, ${lordTxt(5)} in the 8th` : null) },
    { verse: "83", test: () => (has(8, L(7)) && has(5, L(12)) && withMal("Jupiter") ? `${lordTxt(7)} in the 8th, ${lordTxt(12)} in the 5th, Jupiter with a malefic` : null) },
    { verse: "84", test: () => (has(5, "Venus") && has(8, L(7)) && malIn(5) ? `Venus in the 5th with a malefic, ${lordTxt(7)} in the 8th` : null) },
    { verse: "85", test: () => (malIn(2) && malIn(5) && has(8, L(7)) ? `malefics in the 2nd and 5th, ${lordTxt(7)} in the 8th` : null) },
    { verse: "86", test: () => (has(9, "Venus") && has(8, L(7)) && malIn(1) && malIn(5) ? `Venus in the 9th, ${lordTxt(7)} in the 8th, malefics in the lagna and 5th` : null) },
    { verse: "87", test: () => (L(9) === "Venus" && inimical(l5) && inDus(l1) && inDus(L(7)) && inDus("Jupiter") ? `Venus as 9th lord, ${lordTxt(5)} in an inimical sign, the lords of the lagna and 7th and Jupiter all in dusthanas` : null) },
    { verse: "88", test: () => ([1, 6].includes(sign5) && allIn(5, ["Sun", "Moon"]) && malIn(12) && malIn(1) && malIn(2) ? `the 5th in ${sign5 === 1 ? "Taurus" : "Libra"} holding Sun and Moon, malefics in the 12th, lagna and 2nd` : null) },
    { verse: "89", test: () => (allIn(7, ["Saturn", "Venus"]) && has(5, L(8)) && allIn(1, ["Sun", "Rahu"]) ? `Saturn and Venus in the 7th, ${lordTxt(8)} in the 5th, Sun and Rahu in the lagna` : null) },
    { verse: "90", test: () => (has(2, "Mars") && has(12, "Jupiter") && allIn(5, ["Venus", "Rahu"]) ? "Mars in the 2nd, Jupiter in the 12th, Venus and Rahu in the 5th" : null) },
    { verse: "91", test: () => (has(8, L(2)) && has(8, L(7)) && has(5, "Mars") && has(1, "Saturn") && withMal("Jupiter") ? "the lords of the 2nd and 7th in the 8th, Mars in the 5th, Saturn in the lagna, Jupiter with a malefic" : null) },
    { verse: "92", test: () => (has(1, "Rahu") && has(5, "Saturn") && has(9, "Mars") && has(8, l5) && has(8, L(7)) ? "Rahu in the lagna, Saturn in the 5th, Mars in the 9th, the lords of the 5th and 7th in the 8th" : null) },
  ], "82-92", "kanyadana, or in its place gifts of a Lakshminarayana image, a cow, a bed, ornaments and garments to a Brahmin couple", "93-94");

  // ---- 83.95-105: curse of departed souls (rites not performed) ----
  group("pa-curse-83-95", "The curse of departed souls", ["Saturn", "Sun", "Rahu", "Jupiter", l5], [
    { verse: "96", test: () => (allIn(5, ["Saturn", "Sun"]) && waning && has(7, "Moon") && allIn(12, ["Rahu", "Jupiter"]) ? "Saturn and the Sun in the 5th, the waning Moon in the 7th, Rahu and Jupiter in the 12th" : null) },
    { verse: "97", test: () => (l5 === "Saturn" && has(8, "Saturn") && has(1, "Mars") && has(8, "Jupiter") ? "Saturn as 5th lord in the 8th with Jupiter, Mars in the lagna" : null) },
    { verse: "98", test: () => (malIn(1) && has(12, "Sun") && allIn(5, ["Mars", "Saturn", "Mercury"]) && has(8, l5) ? `malefics in the lagna, the Sun in the 12th, Mars, Saturn and Mercury in the 5th, ${lordTxt(5)} in the 8th` : null) },
    { verse: "99", test: () => (has(1, "Rahu") && has(5, "Saturn") && has(8, "Jupiter") ? "Rahu in the lagna, Saturn in the 5th, Jupiter in the 8th" : null) },
    { verse: "100", test: () => (allIn(1, ["Venus", "Jupiter", "Rahu", "Moon"]) && has(8, "Saturn") && has(8, l1) ? `Venus, Jupiter, Rahu and the Moon in the lagna, Saturn and ${lordTxt(1)} in the 8th` : null) },
    { verse: "101", test: () => {
      if (!(deb(l5) && deb("Jupiter"))) return null;
      const debAsp = positions.filter((p) => p.dignity === "Debilitated" && (aspects(p.planet, l5) || aspects(p.planet, "Jupiter"))).map((p) => p.planet);
      return debAsp.length ? `${lordTxt(5)} and Jupiter both debilitated and aspected by the debilitated ${list(debAsp)}` : null;
    } },
    { verse: "102", test: () => (has(1, "Saturn") && has(5, "Rahu") && has(8, "Sun") && has(12, "Mars") ? "Saturn in the lagna, Rahu in the 5th, the Sun in the 8th, Mars in the 12th" : null) },
    { verse: "104-105", test: () => (has(5, L(8)) && allIn(5, ["Saturn", "Venus"]) && deb("Jupiter") ? `${lordTxt(8)} with Saturn and Venus in the 5th, Jupiter debilitated` : null) },
  ], "95-105", "pinda dana, Rudrabhisheka and gifts of a Brahma image, a cow, a silver vessel and a sapphire", "106-108");

  return F;
}
