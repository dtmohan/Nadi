/**
 * BPHS chapters 11-13: what each house signifies (11.2-13), when a house prospers or fails (11.14-16),
 * and the stated effects of the 1st (ch. 12) and 2nd (ch. 13) houses.
 * Text: Santhanam's translation at jyotishvidya.com. Rules the text does not state as applied are marked provisional.
 */
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { computeVargas } from "./vargas";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const EVIL_LORDS = [3, 6, 8, 11, 12];
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const v = (xs: unknown[], sing: string, plur: string) => (xs.length === 1 ? sing : plur);
const list = (xs: string[]) => (xs.length === 0 ? "none" : xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** 11.2-13, paraphrased. */
export const HOUSE_MATTERS: { house: number; verse: string; matters: string }[] = [
  { house: 1, verse: "2", matters: "body, appearance, intellect, complexion, vigour and weakness, happiness and grief, innate nature" },
  { house: 2, verse: "3", matters: "wealth, food and grains, family, death, enemies, metals and precious stones" },
  { house: 3, verse: "4", matters: "valour, servants, brothers and sisters, initiation, journeys, a parent's death" },
  { house: 4, verse: "5", matters: "conveyances, relatives, mother, happiness, treasure, lands and houses" },
  { house: 5, verse: "6", matters: "amulets and sacred spells, learning, knowledge, sons, authority, fall from position" },
  { house: 6, verse: "7", matters: "maternal uncle, doubts about death, enemies, ulcers, step-mother" },
  { house: 7, verse: "8", matters: "wife, travel, trade, loss of sight, death" },
  { house: 8, verse: "9", matters: "longevity, battle, enemies, forts, wealth of the dead, past and future births" },
  { house: 9, verse: "10", matters: "fortune, wife's brother, religion, brother's wife, visits to shrines" },
  { house: 10, verse: "11", matters: "authority, place, profession and livelihood, honour, father, living abroad, debts" },
  { house: 11, verse: "12", matters: "all articles, son's wife, income, prosperity, quadrupeds" },
  { house: 12, verse: "13", matters: "expenses, history of enemies, one's own death" },
];
export const HOUSE_MATTERS_SOURCE = S(11, "2-13");

export interface BhavaJudgement {
  house: number;
  signIndex: number;
  lord: Planet;
  lordHouse: number;
  /** 11.14-15 signs of prosperity that hold. */
  support: string[];
  /** 11.16 signs of annihilation that hold. */
  strain: string[];
  tone: "support" | "strain" | "mixed" | "none";
  source: ParashariSource;
}
export const BHAVA_JUDGEMENT_SOURCE = S(11, "14-16", true);
export const BHAVA_JUDGEMENT_CAVEATS = [
  "11.14-15 also count the lord in Yuva, Prabuddha or Kaumara avastha as prosperity and 11.16 the Vriddha, Mrita and Supta avasthas as failure; avasthas (ch. 45) are not yet computed, so those clauses are not applied.",
  "A lord standing in its own house is not counted as failing to aspect it; the text does not settle the case, so that reading is provisional.",
  "Defeat in planetary war is taken from the Shadbala pass (27.20) when the ephemeris facts are present.",
];

export interface HouseDeps {
  aspect: (planet: Planet, fromSign: number, toSign: number) => number;
  benefic: (p: PlanetPosition, all: PlanetPosition[]) => boolean;
}

export function judgeBhavas(positions: PlanetPosition[], lagnaIdx: number, deps: HouseDeps, shadbala?: ShadbalaResult): BhavaJudgement[] {
  const losers = new Set<Planet>((shadbala?.wars ?? []).map((w) => w.loser));
  const out: BhavaJudgement[] = [];
  for (let h = 1; h <= 12; h++) {
    const si = (lagnaIdx + h - 1) % 12;
    const lord = SIGN_LORD[si];
    const lp = positions.find((p) => p.planet === lord)!;
    const lordHouse = houseFrom(lagnaIdx, lp.signIndex);
    const occupants = positions.filter((p) => p.signIndex === si);
    const support: string[] = [];
    const strain: string[] = [];
    const benIn = occupants.filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
    if (benIn.length) support.push(`${list(benIn)} in the house`);
    const benAsp = positions.filter((p) => p.signIndex !== si && deps.benefic(p, positions) && deps.aspect(p.planet, p.signIndex, si) > 0).map((p) => p.planet);
    if (benAsp.length) support.push(`aspected by ${list(benAsp)}`);
    if (lordHouse === 10) support.push(`lord ${lord} in the 10th`);
    if (lp.signIndex !== si && deps.aspect(lord, lp.signIndex, si) === 0) strain.push(`lord ${lord} does not aspect the house`);
    const withMal = positions.filter((p) => p.signIndex === lp.signIndex && p.planet !== lord && !deps.benefic(p, positions)).map((p) => p.planet);
    if (withMal.length) strain.push(`lord with ${list(withMal)}`);
    const evilLords = EVIL_LORDS.map((e) => SIGN_LORD[(lagnaIdx + e - 1) % 12]).filter((e) => e !== lord);
    const withEvil = positions.filter((p) => p.signIndex === lp.signIndex && p.planet !== lord && evilLords.includes(p.planet) && !withMal.includes(p.planet)).map((p) => `${p.planet} (lord of the ${list(EVIL_LORDS.filter((e) => SIGN_LORD[(lagnaIdx + e - 1) % 12] === p.planet).map(ord))})`);
    if (withEvil.length) strain.push(`lord with ${list(withEvil)}`);
    if (losers.has(lord)) strain.push(`lord ${lord} defeated in planetary war`);
    const tone = support.length && strain.length ? "mixed" : support.length ? "support" : strain.length ? "strain" : "none";
    out.push({ house: h, signIndex: si, lord, lordHouse, support, strain, tone, source: BHAVA_JUDGEMENT_SOURCE });
  }
  return out;
}

const QUADRUPED = new Set([0, 1, 4, 9]); // Aries, Taurus, Leo, Capricorn (whole-sign reading; Sagittarius' second half omitted)
const navamsaSign = (p: PlanetPosition) => (p.signIndex * 9 + Math.floor(p.degInSign / (30 / 9))) % 12;

/** Findings for the 1st (ch. 12) and 2nd (ch. 13) houses. */
export function houseFindings(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const lordOf = (h: number) => SIGN_LORD[signOfHouse(h)];
  const ben = (pl: Planet) => deps.benefic(pos(pl), positions);
  const inSign = (si: number) => positions.filter((p) => p.signIndex === si);
  const withPl = (pl: Planet) => inSign(pos(pl).signIndex).filter((p) => p.planet !== pl);
  const maleficsWith = (pl: Planet) => withPl(pl).filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
  const beneficsWith = (pl: Planet) => withPl(pl).filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  const aspectingSign = (si: number, want: "benefic" | "malefic") => positions.filter((p) => p.signIndex !== si && deps.aspect(p.planet, p.signIndex, si) > 0 && deps.benefic(p, positions) === (want === "benefic")).map((p) => p.planet);
  const aspectingPlanet = (pl: Planet, want: "benefic" | "malefic") => aspectingSign(pos(pl).signIndex, want);
  const vargas = computeVargas(positions, lagnaLon);
  const combust = (pl: Planet) => vargas.planets.find((v) => v.planet === pl)?.combust ?? false;
  const strong = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl)?.strong;
  const inKT = (h: number) => KENDRA.includes(h) || TRIKONA.includes(h);
  const push = (id: string, house: number, title: string, text: string, tone: ParashariFinding["tone"], planets: Planet[], source: ParashariSource) => F.push({ id, kind: "house", house, title, text, tone, planets: Array.from(new Set(planets)), source });

  // ---- Chapter 12: the 1st house ----
  const l1 = lordOf(1);
  const h1 = houseOf(l1);
  const l1Mal = maleficsWith(l1);
  const l1Dus = DUSTHANA.includes(h1);
  if (l1Mal.length || l1Dus) {
    push("pa-h1-12-1", 1, "Lagna lord afflicted", `${l1}, lord of the lagna, ${l1Dus ? `is in the ${ord(h1)}` : ""}${l1Dus && l1Mal.length ? " and " : ""}${l1Mal.length ? `is joined by ${list(l1Mal)}` : ""}. Parashara says physical felicity diminishes when the lagna lord is with a malefic or in the 6th, 8th or 12th.`, "strain", [l1, ...l1Mal], S(12, "1-2"));
  } else if (inKT(h1)) {
    push("pa-h1-12-2", 1, "Lagna lord in an angle or trine", `${l1}, lord of the lagna, is in the ${ord(h1)}, free of malefic company. Parashara promises comforts of the body at all times.`, "support", [l1], S(12, "1-2"));
  }
  const l1Weak = pos(l1).dignity === "Debilitated" ? "debilitated" : pos(l1).dignity === "Inimical" ? "in an enemy's sign" : combust(l1) ? "combust" : null;
  if (l1Weak) {
    const benKT = positions.filter((p) => p.planet !== l1 && deps.benefic(p, positions) && inKT(houseFrom(lagnaIdx, p.signIndex))).map((p) => p.planet);
    push("pa-h1-12-2b", 1, benKT.length ? "Disease from the lagna lord, relieved" : "Disease from the lagna lord", `${l1}, lord of the lagna, is ${l1Weak}, which Parashara reads as disease. ${benKT.length ? `A benefic in an angle or trine removes all disease, he adds, and ${list(benKT)} ${v(benKT, "stands", "stand")} so placed (the lagna lord itself is not counted).` : "No other benefic stands in an angle or trine to remove it."}`, benKT.length ? "mixed" : "strain", [l1, ...benKT], S(12, "2", benKT.length > 0));
  }
  // 12.3: lagna or Moon with or aspected by a malefic and without a benefic's aspect.
  for (const [what, si] of [["the lagna", signOfHouse(1)], ["the Moon", pos("Moon").signIndex]] as [string, number][]) {
    const malIn = inSign(si).filter((p) => !deps.benefic(p, positions) && p.planet !== "Moon").map((p) => p.planet);
    const malAsp = aspectingSign(si, "malefic");
    const benAsp = aspectingSign(si, "benefic");
    const benIn = inSign(si).filter((p) => deps.benefic(p, positions) && p.planet !== "Moon").map((p) => p.planet);
    if ((malIn.length || malAsp.length) && !benAsp.length && !benIn.length) {
      push(`pa-h1-12-3-${what === "the Moon" ? "moon" : "lagna"}`, 1, `${what === "the Moon" ? "Moon" : "Lagna"} under malefics alone`, `${what[0].toUpperCase()}${what.slice(1)} is ${malIn.length ? `joined by ${list(malIn)}` : ""}${malIn.length && malAsp.length ? " and " : ""}${malAsp.length ? `aspected by ${list(malAsp)}` : ""}, with no benefic aspect. Parashara denies bodily health in this case.`, "strain", [...(what === "the Moon" ? ["Moon" as Planet] : []), ...malIn, ...malAsp], S(12, "3"));
    }
  }
  // 12.4: appearance from planets in the lagna, felicity from a benefic joining or aspecting it.
  const inL = inSign(signOfHouse(1));
  const benL = inL.filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  const malL = inL.filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
  const benAspL = aspectingSign(signOfHouse(1), "benefic");
  if (benL.length || malL.length || benAspL.length) {
    const parts: string[] = [];
    if (benL.length) parts.push(`${list(benL)} in the lagna ${v(benL, "gives", "give")} a pleasing appearance`);
    if (malL.length) parts.push(`${list(malL)} in the lagna ${v(malL, "takes", "take")} from good looks`);
    if (benAspL.length) parts.push(`${list(benAspL)} aspecting the lagna ${v(benAspL, "brings", "bring")} felicity of the body`);
    push("pa-h1-12-4", 1, "Appearance and the lagna", `${parts.join("; ")}.`, benL.length && !malL.length ? "support" : malL.length && !benL.length && !benAspL.length ? "strain" : "mixed", [...benL, ...malL, ...benAspL], S(12, "4"));
  }
  // 12.5: lagna lord, Mercury, Jupiter or Venus in an angle or trine.
  const ktGroup = ([l1, "Mercury", "Jupiter", "Venus"] as Planet[]).filter((p, i, a) => a.indexOf(p) === i && inKT(houseOf(p)));
  if (ktGroup.length) {
    push("pa-h1-12-5", 1, "Long life, wealth and intelligence", `${list(ktGroup)} ${ktGroup.length === 1 ? "is" : "are"} in an angle or trine. Parashara names the lagna lord, Mercury, Jupiter and Venus so placed for long life, wealth, intelligence and the favour of the king.`, "support", ktGroup, S(12, "5"));
  }
  // 12.6a: lagna lord in a movable sign aspected by a benefic.
  if (pos(l1).signIndex % 3 === 0) {
    const asp = aspectingPlanet(l1, "benefic");
    if (asp.length) push("pa-h1-12-6", 1, "Fame from a movable lagna lord", `${l1}, lord of the lagna, is in ${SIGNS[pos(l1).signIndex]}, a movable sign, and is aspected by ${list(asp)}. Parashara gives fame, wealth, abundant pleasures and comforts of the body.`, "support", [l1, ...asp], S(12, "6"));
  }
  // 12.7: Mercury, Jupiter or Venus in the lagna with the Moon, or in an angle from the lagna.
  const royal = (["Mercury", "Jupiter", "Venus"] as Planet[]).filter((p) => (houseOf(p) === 1 && houseOf("Moon") === 1) || KENDRA.includes(houseOf(p)));
  if (royal.length) {
    push("pa-h1-12-7", 1, "Royal marks", `${list(royal)} ${royal.length === 1 ? "stands" : "stand"} in an angle from the lagna${royal.some((p) => houseOf(p) === 1 && houseOf("Moon") === 1) ? ", with the Moon in the lagna" : ""}. Parashara says such a native bears the marks of fortune.`, "support", royal, S(12, "7"));
  }
  // 12.8: coiled birth.
  if ([0, 1, 4].includes(lagnaIdx)) {
    const sm = (["Saturn", "Mars"] as Planet[]).filter((p) => houseOf(p) === 1);
    if (sm.length) push("pa-h1-12-8", 1, "Birth with the cord coiled", `${SIGNS[lagnaIdx]} rising with ${list(sm)} in the lagna. Parashara says the child is born with a coil around a limb, the limb fixed by the rising rasi or navamsa; a birth-record detail, not a life reading.`, "mixed", sm, S(12, "8"));
  }
  // 12.10: Sun and Moon in one house and one navamsa.
  if (pos("Sun").signIndex === pos("Moon").signIndex && navamsaSign(pos("Sun")) === navamsaSign(pos("Moon"))) {
    push("pa-h1-12-10", 1, "Sun and Moon in one house and navamsa", `The Sun and Moon share ${SIGNS[pos("Sun").signIndex]} and the same navamsa. Parashara says the child is nurtured by three mothers in its first three months and then raised by father and brother; 16.10 repeats it as three mothers or two fathers.`, "mixed", ["Sun", "Moon"], S(12, "10"));
  }

  // ---- Chapter 13: the 2nd house ----
  const l2 = lordOf(2);
  const h2 = houseOf(l2);
  const l11 = lordOf(11);
  const h11 = houseOf(l11);
  const in2 = inSign(signOfHouse(2));
  const ben2 = in2.filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  const mal2 = in2.filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
  if (h2 === 2 || inKT(h2)) {
    push("pa-h2-13-1", 2, "Wealth promoted by the 2nd lord", `${l2}, lord of the 2nd, is in the ${ord(h2)}${h2 === 2 ? ", its own house" : ", an angle or trine"}. Parashara says the 2nd lord so placed promotes wealth.`, "support", [l2], S(13, "1-2"));
  } else if (DUSTHANA.includes(h2)) {
    push("pa-h2-13-2", 2, "Wealth declines with the 2nd lord", `${l2}, lord of the 2nd, is in the ${ord(h2)}. Parashara says financial conditions decline when the 2nd lord is in the 6th, 8th or 12th.`, "strain", [l2], S(13, "1-2"));
  }
  if (ben2.length || mal2.length) {
    push("pa-h2-13-2b", 2, "Planets in the 2nd", `${ben2.length ? `${list(ben2)}, ${v(ben2, "a benefic", "benefics")} in the 2nd, ${v(ben2, "gives", "give")} wealth` : ""}${ben2.length && mal2.length ? "; " : ""}${mal2.length ? `${list(mal2)}, ${v(mal2, "a malefic", "malefics")} in the 2nd, ${v(mal2, "destroys", "destroy")} wealth` : ""}, by Parashara's plain rule for planets in the 2nd.`, ben2.length && !mal2.length ? "support" : mal2.length && !ben2.length ? "strain" : "mixed", [...ben2, ...mal2], S(13, "2"));
  }
  // 13.3: Jupiter in the 2nd as its lord, or with Mars.
  if (houseOf("Jupiter") === 2 && (l2 === "Jupiter" || pos("Mars").signIndex === pos("Jupiter").signIndex)) {
    push("pa-h2-13-3", 2, "Jupiter in the 2nd", `Jupiter is in the 2nd ${l2 === "Jupiter" ? "as its lord" : "with Mars"}. Parashara says the native is wealthy. The verse is read as Jupiter in the 2nd either as lord or with Mars; the pairing with Mars elsewhere is not counted.`, "support", l2 === "Jupiter" ? ["Jupiter"] : ["Jupiter", "Mars"], S(13, "3", true));
  }
  // 13.4: 2nd and 11th lords exchanged, or together in an angle or trine.
  if (l2 !== l11) {
    if (h2 === 11 && h11 === 2) push("pa-h2-13-4", 2, "2nd and 11th lords exchanged", `${l2}, lord of the 2nd, is in the 11th while ${l11}, lord of the 11th, is in the 2nd. Parashara says wealth is acquired.`, "support", [l2, l11], S(13, "4"));
    else if (pos(l2).signIndex === pos(l11).signIndex && inKT(h2)) push("pa-h2-13-4", 2, "2nd and 11th lords together", `${l2} and ${l11}, lords of the 2nd and 11th, are together in the ${ord(h2)}, an angle or trine. Parashara says wealth is acquired.`, "support", [l2, l11], S(13, "4"));
  }
  // 13.5: 2nd lord in an angle with the 11th lord in a trine from it, or the 11th lord with or aspected by Jupiter and Venus.
  if (KENDRA.includes(h2)) {
    const fromL2 = houseFrom(pos(l2).signIndex, pos(l11).signIndex);
    const jv = (["Jupiter", "Venus"] as Planet[]).filter((p) => p !== l11 && (pos(p).signIndex === pos(l11).signIndex || deps.aspect(p, pos(p).signIndex, pos(l11).signIndex) > 0));
    if ([5, 9].includes(fromL2) || jv.length) {
      push("pa-h2-13-5", 2, "2nd lord in an angle, 11th lord supported", `${l2}, lord of the 2nd, is in the ${ord(h2)}, an angle${[5, 9].includes(fromL2) ? `, and ${l11}, lord of the 11th, is in the ${ord(fromL2)} from it` : ""}${jv.length ? `${[5, 9].includes(fromL2) ? ";" : ", and"} ${l11}, lord of the 11th, is ${pos(jv[0]).signIndex === pos(l11).signIndex ? "joined" : "aspected"} by ${list(jv)}` : ""}. Parashara says the native is wealthy.${jv.length && jv.length < 2 ? " He names Jupiter and Venus together; one of the two is accepted here." : ""}`, "support", [l2, l11, ...jv], S(13, "5", jv.length > 0 && jv.length < 2));
    }
  }
  // 13.6-7: poverty.
  const l2Evil = DUSTHANA.includes(h2);
  const l11Evil = DUSTHANA.includes(h11);
  if (l2Evil && l11Evil && mal2.length) {
    push("pa-h2-13-6", 2, "Penury from the 2nd and 11th lords", `${l2}, lord of the 2nd, is in the ${ord(h2)} and ${l11}, lord of the 11th, in the ${ord(h11)}, while ${list(mal2)} ${mal2.length === 1 ? "occupies" : "occupy"} the 2nd. Parashara says the native is penniless. "Evil house" is read as the 6th, 8th and 12th.`, "strain", [l2, l11, ...mal2], S(13, "6", true));
  }
  const l2Aff = combust(l2) ? "combust" : maleficsWith(l2).length ? `with ${list(maleficsWith(l2))}` : null;
  const l11Aff = combust(l11) ? "combust" : maleficsWith(l11).length ? `with ${list(maleficsWith(l11))}` : null;
  if (l2Aff && l11Aff && l2 !== l11) {
    push("pa-h2-13-7", 2, "Penury from birth", `${l2}, lord of the 2nd, is ${l2Aff} and ${l11}, lord of the 11th, is ${l11Aff}. Parashara speaks of penury from birth when both lords are combust or with malefics. Combustion follows the Surya Siddhanta orbs quoted under 7.28-29.`, "strain", [l2, l11, ...maleficsWith(l2), ...maleficsWith(l11)], S(13, "7"));
  }
  // 13.8: loss through the king.
  if (l2Evil && l11Evil && houseOf("Mars") === 11 && houseOf("Rahu") === 2) {
    push("pa-h2-13-8", 2, "Loss of wealth through authority", `${l2} and ${l11}, lords of the 2nd and 11th, are in the ${ord(h2)} and ${ord(h11)}, Mars is in the 11th and Rahu in the 2nd. Parashara says wealth is lost through royal punishment.`, "strain", [l2, l11, "Mars", "Rahu"], S(13, "8"));
  }
  // 13.9: expenses on good accounts.
  const ben12 = inSign(signOfHouse(12)).filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  if (houseOf("Jupiter") === 11 && houseOf("Venus") === 2 && ben12.length && beneficsWith(l2).length) {
    push("pa-h2-13-9", 2, "Spending on good causes", `Jupiter is in the 11th, Venus in the 2nd, ${list(ben12)} in the 12th and ${l2}, lord of the 2nd, is joined by ${list(beneficsWith(l2))}. Parashara says expenses go to religious and charitable ends.`, "support", ["Jupiter", "Venus", ...ben12, l2], S(13, "9"));
  }
  // 13.10: 2nd lord in own sign or exalted.
  if (["Exalted", "Own sign", "Moolatrikona"].includes(pos(l2).dignity)) {
    push("pa-h2-13-10", 2, "Fame through the 2nd lord", `${l2}, lord of the 2nd, is ${pos(l2).dignity === "Exalted" ? "exalted" : "in its own sign"} in ${SIGNS[pos(l2).signIndex]}. Parashara says the native looks after his people, helps others and becomes famous.${pos(l2).dignity === "Moolatrikona" ? " Moolatrikona is taken as own sign." : ""}`, "support", [l2], S(13, "10", pos(l2).dignity === "Moolatrikona"));
  }
  // 13.11: 2nd lord with a benefic and in a good division such as Paravatamsa.
  const desig = vargas.planets.find((v) => v.planet === l2)?.designation?.dasa;
  if (beneficsWith(l2).length && desig && desig.good >= 6) {
    push("pa-h2-13-11", 2, "Effortless family wealth", `${l2}, lord of the 2nd, is joined by ${list(beneficsWith(l2))} and holds ${desig.name ?? "a high designation"} in the dasavarga (${desig.good} good vargas). Parashara says wealth of all kinds comes to the family without effort. "A good division like Paravatamsa" is read as Paravata or higher in the ten-varga scheme of 6.42-53.`, "support", [l2, ...beneficsWith(l2)], S(13, "11", true));
  }
  // 13.12: eyes.
  if (DUSTHANA.includes(h2)) {
    push("pa-h2-13-12", 2, "Eyes and the 2nd lord", `${l2}, lord of the 2nd, is in the ${ord(h2)}. Parashara reads disease or deformity of the eyes.`, "strain", [l2], S(13, "12"));
  } else if (strong(l2) === true) {
    push("pa-h2-13-12", 2, "Beautiful eyes", `${l2}, lord of the 2nd, has strength above its Shadbala requirement (27.32-33). Parashara says the native has beautiful eyes.`, "support", [l2], S(13, "12"));
  }
  // 13.13: 2nd house and its lord with malefics.
  if (mal2.length && maleficsWith(l2).length && h2 !== 2) {
    push("pa-h2-13-13", 2, "Speech under malefics", `${list(mal2)} ${mal2.length === 1 ? "occupies" : "occupy"} the 2nd and ${l2}, its lord, is joined by ${list(maleficsWith(l2))}. Parashara says the native carries tales, speaks untruth and suffers windy complaints.`, "strain", [...mal2, l2, ...maleficsWith(l2)], S(13, "13"));
  } else if (mal2.length && maleficsWith(l2).length && h2 === 2) {
    push("pa-h2-13-13", 2, "Speech under malefics", `${l2}, lord of the 2nd, sits in the 2nd with ${list(mal2)}. Parashara says the native carries tales, speaks untruth and suffers windy complaints.`, "strain", [l2, ...mal2], S(13, "13"));
  }
  // ---- Chapter 14: the 3rd house ----
  const l3 = lordOf(3);
  const s3 = signOfHouse(3);
  const in3 = inSign(s3);
  const ben3 = in3.filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  const benAsp3 = aspectingSign(s3, "benefic");
  if (ben3.length || benAsp3.length) {
    push("pa-h3-14-1", 3, "Co-born and courage", `The 3rd is ${ben3.length ? `occupied by ${list(ben3)}` : ""}${ben3.length && benAsp3.length ? " and " : ""}${benAsp3.length ? `aspected by ${list(benAsp3)}` : ""}. Parashara says the native has co-born and is courageous.`, "support", [...ben3, ...benAsp3], S(14, "1"));
  }
  const marsWithL3 = l3 === "Mars" || pos("Mars").signIndex === pos(l3).signIndex;
  const l3Asp3 = pos(l3).signIndex !== s3 && deps.aspect(l3, pos(l3).signIndex, s3) > 0;
  const marsAsp3 = pos("Mars").signIndex !== s3 && deps.aspect("Mars", pos("Mars").signIndex, s3) > 0;
  if (l3 !== "Mars" && ((l3Asp3 && marsAsp3 && marsWithL3) || (houseOf(l3) === 3 && houseOf("Mars") === 3))) {
    push("pa-h3-14-2", 3, "3rd lord and Mars favour the 3rd", `${l3}, lord of the 3rd, and Mars ${houseOf(l3) === 3 ? "stand together in the 3rd" : "aspect the 3rd together"}. Parashara promises the good results of the 3rd house.`, "support", [l3, "Mars"], S(14, "2"));
  }
  if (marsWithL3 && l3 !== "Mars") {
    const pair: Planet[] = [l3, "Mars"];
    const malWith = inSign(pos("Mars").signIndex).filter((p) => !pair.includes(p.planet) && !deps.benefic(p, positions)).map((p) => p.planet);
    const malSign = !["Jupiter", "Venus", "Moon", "Mercury"].includes(SIGN_LORD[pos("Mars").signIndex]);
    if (houseOf("Mars") === 8) {
      push("pa-h3-14-5", 3, "3rd lord and Mars in the 8th", `${list(pair)}, lord of the 3rd and Mars, stand in the 8th. Parashara reads harm to co-born here.`, "strain", pair, S(14, "5"));
    } else if (malWith.length || malSign) {
      push("pa-h3-14-3", 3, "3rd lord and Mars afflicted", `${list(pair)}, lord of the 3rd and Mars, ${malWith.length ? `are joined by ${list(malWith)}` : `stand in ${SIGNS[pos("Mars").signIndex]}, a sign owned by a malefic`}. Parashara reads the loss of co-born. Sign ownership uses the natural malefics Sun, Mars and Saturn.`, "strain", [...pair, ...malWith], S(14, "3", malSign && !malWith.length));
    }
  }
  // 14.4: sex of co-born from the 3rd lord, planets in the 3rd and the sign.
  {
    const MALE_PL: Planet[] = ["Sun", "Mars", "Jupiter"];
    const FEMALE_PL: Planet[] = ["Moon", "Venus"];
    const fem: string[] = [];
    const mal: string[] = [];
    if (FEMALE_PL.includes(l3)) fem.push(`${l3}, the 3rd lord, is a female planet`);
    if (MALE_PL.includes(l3)) mal.push(`${l3}, the 3rd lord, is a male planet`);
    const femIn = in3.filter((p) => FEMALE_PL.includes(p.planet)).map((p) => p.planet);
    const malIn = in3.filter((p) => MALE_PL.includes(p.planet)).map((p) => p.planet);
    if (femIn.length) fem.push(`${list(femIn)} in the 3rd`);
    if (malIn.length) mal.push(`${list(malIn)} in the 3rd`);
    if (s3 % 2 === 0) mal.push(`${SIGNS[s3]} is a male sign`); else fem.push(`${SIGNS[s3]} is a female sign`);
    if (fem.length || mal.length) {
      push("pa-h3-14-4", 3, "Sisters or brothers", `${fem.length ? `Towards younger sisters: ${fem.join("; ")}.` : ""}${fem.length && mal.length ? " " : ""}${mal.length ? `Towards younger brothers: ${mal.join("; ")}.` : ""}${fem.length && mal.length ? " Parashara says a mixed picture gives co-born of both sexes, to be settled by strength." : ""} Planet sex from 3.19, sign sex from 4.5.`, "mixed", [l3, ...femIn, ...malIn], S(14, "4"));
    }
  }
  // 14.6: Mars or the 3rd lord in an angle or trine, or exalted or in a friendly sign.
  {
    const good = Array.from(new Set<Planet>(["Mars", l3])).filter((p) => inKT(houseOf(p)) || ["Exalted", "Friendly"].includes(pos(p).dignity));
    const why6 = (p: Planet) => `${p}${p === l3 ? " (3rd lord)" : ""} ${inKT(houseOf(p)) ? `in the ${ord(houseOf(p))}` : pos(p).dignity === "Exalted" ? "exalted" : "in a friendly sign"}`;
    if (good.length) push("pa-h3-14-6", 3, "Happiness through co-born", `${list(good.map(why6))}. Parashara names Mars or the 3rd lord in an angle or trine, or exalted or in friendly divisions, and promises happiness through brothers and sisters. "Friendly divisions" is read as the rasi dignity only.`, "support", good, S(14, "6", true));
  }
  // 14.14: Sun, Saturn or Mars in the 3rd.
  {
    const adverse = (["Sun", "Saturn", "Mars"] as Planet[]).filter((p) => houseOf(p) === 3);
    if (adverse.length) push("pa-h3-14-14", 3, "Malefics in the 3rd", `${list(adverse)} in the 3rd. Parashara reads harm to ${adverse.map((p) => (p === "Sun" ? "elder co-born (Sun)" : p === "Saturn" ? "younger co-born (Saturn)" : "both elder and younger co-born (Mars)")).join(", ")}; 14.15 asks that the strength of such yogas be weighed first.`, "strain", adverse, S(14, "14"));
  }

  // ---- Chapter 15: the 4th house ----
  const l4 = lordOf(4);
  const l10 = lordOf(10);
  const l11b = lordOf(11);
  const s4 = signOfHouse(4);
  const in4 = inSign(s4);
  const benAsp4 = aspectingSign(s4, "benefic");
  if ((houseOf(l4) === 4 || houseOf(l1) === 4) && benAsp4.length) {
    push("pa-h4-15-2", 4, "Residential comforts", `${houseOf(l4) === 4 ? `${l4}, lord of the 4th,` : `${l1}, lord of the lagna,`} occupies the 4th and ${list(benAsp4)} ${v(benAsp4, "aspects", "aspect")} it. Parashara promises housing comforts in full.`, "support", [houseOf(l4) === 4 ? l4 : l1, ...benAsp4], S(15, "2"));
  }
  if (["Own sign", "Moolatrikona", "Exalted"].includes(pos(l4).dignity) || SIGN_LORD[navamsaSign(pos(l4))] === l4) {
    push("pa-h4-15-3", 4, "Lands, houses and conveyances", `${l4}, lord of the 4th, is ${pos(l4).dignity === "Exalted" ? "exalted" : ["Own sign", "Moolatrikona"].includes(pos(l4).dignity) ? "in its own sign" : "in its own navamsa"}. Parashara promises comforts of lands, conveyances, houses and musical instruments. Santhanam's text names the 5th lord here; the 4th lord is used because the chapter concerns the 4th house, so this is provisional.`, "support", [l4], S(15, "3", true));
  }
  if (l4 !== l10 && pos(l4).signIndex === pos(l10).signIndex && inKT(houseOf(l4))) {
    push("pa-h4-15-4", 4, "Beautiful mansions", `${l10}, lord of the 10th, joins ${l4}, lord of the 4th, in the ${ord(houseOf(l4))}, an angle or trine. Parashara says the native acquires beautiful mansions.`, "support", [l4, l10], S(15, "4"));
  }
  if (houseOf("Mercury") === 1 && ben(l4)) {
    const other = aspectingPlanet(l4, "benefic");
    if (other.length) push("pa-h4-15-5", 4, "Honoured by relatives", `Mercury is in the lagna and ${l4}, lord of the 4th and a benefic, is aspected by ${list(other)}. Parashara says the native is honoured by his relatives.`, "support", ["Mercury", l4, ...other], S(15, "5"));
  }
  {
    const ben4 = in4.filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
    if (ben4.length && pos(l4).dignity === "Exalted" && strong("Moon") !== false) {
      push("pa-h4-15-6", 4, "Long-living mother", `${list(ben4)} ${v(ben4, "occupies", "occupy")} the 4th, ${l4}, its lord, is exalted, and the Moon, indicator of the mother, ${strong("Moon") === true ? "has strength above its requirement" : "is not shown weak (no Shadbala available)"}. Parashara promises a long-living mother.`, "support", [...ben4, l4, "Moon"], S(15, "6", strong("Moon") === undefined));
    }
  }
  if (KENDRA.includes(houseOf(l4)) && KENDRA.includes(houseOf("Venus")) && pos("Mercury").dignity === "Exalted") {
    push("pa-h4-15-7", 4, "Happiness to the mother", `${l4}, lord of the 4th, and Venus are both in angles while Mercury is exalted. Parashara says the mother is happy.`, "support", [l4, "Venus", "Mercury"], S(15, "7"));
  }
  if (houseOf("Sun") === 4 && houseOf("Moon") === 9 && houseOf("Saturn") === 9 && houseOf("Mars") === 11) {
    push("pa-h4-15-8", 4, "Cattle", `Sun in the 4th, Moon and Saturn in the 9th and Mars in the 11th. Parashara says this yoga confers cows and buffaloes.`, "support", ["Sun", "Moon", "Saturn", "Mars"], S(15, "8"));
  }
  if (s4 % 3 === 0 && l4 !== "Mars" && pos(l4).signIndex === pos("Mars").signIndex && [6, 8].includes(houseOf(l4))) {
    push("pa-h4-15-9", 4, "Speech impaired", `The 4th falls in ${SIGNS[s4]}, a movable sign, and ${l4}, its lord, is with Mars in the ${ord(houseOf(l4))}. Parashara reads an impediment of speech.`, "strain", [l4, "Mars"], S(15, "9"));
  }
  // 15.10-14: conveyances and their timing.
  {
    const hits: { text: string; year: number; planets: Planet[]; verse: string }[] = [];
    if (ben(l1) && (pos(l4).dignity === "Debilitated" || houseOf(l4) === 11) && houseOf("Venus") === 12) hits.push({ text: `${l1}, lord of the lagna, is a benefic, ${l4}, lord of the 4th, is ${pos(l4).dignity === "Debilitated" ? "debilitated" : "in the 11th"} and Venus is in the 12th`, year: 12, planets: [l1, l4, "Venus"], verse: "10" });
    if (houseOf("Sun") === 4 && pos(l4).dignity === "Exalted" && l4 !== "Venus" && pos(l4).signIndex === pos("Venus").signIndex) hits.push({ text: `the Sun is in the 4th and ${l4}, lord of the 4th, is exalted with Venus`, year: 32, planets: ["Sun", l4, "Venus"], verse: "11" });
    if (l4 !== l10 && pos(l4).signIndex === pos(l10).signIndex && EXALT_SIGN[l4] === navamsaSign(pos(l4))) hits.push({ text: `${l4}, lord of the 4th, joins ${l10}, lord of the 10th, in its exaltation navamsa`, year: 42, planets: [l4, l10], verse: "12" });
    if (l4 !== l11b && houseOf(l4) === 11 && houseOf(l11b) === 4) hits.push({ text: `${l4} and ${l11b}, lords of the 4th and 11th, exchange houses`, year: 12, planets: [l4, l11b], verse: "13" });
    for (const h of hits) push(`pa-h4-15-${h.verse}`, 4, `Conveyances in the ${ord(h.year)} year`, `${h.text[0].toUpperCase()}${h.text.slice(1)}. Parashara times the acquisition of conveyances to the ${ord(h.year)} year.`, "support", h.planets, S(15, h.verse));
  }

  // ---- Chapter 16: the 5th house ----
  const l5 = lordOf(5);
  const l9 = lordOf(9);
  const h5 = houseOf(l5);
  const s5 = signOfHouse(5);
  const in5 = inSign(s5);
  const own = (pl: Planet) => ["Own sign", "Moolatrikona"].includes(pos(pl).dignity);
  const l5Deb = pos(l5).dignity === "Debilitated";
  const mal5 = in5.filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
  if ((own(l1) || inKT(houseOf(l1))) && (own(l5) || inKT(h5))) {
    push("pa-h5-16-1", 5, "Happiness through children", `${l1}, lord of the lagna, is ${own(l1) ? "in its own sign" : `in the ${ord(houseOf(l1))}, an angle or trine`}, and ${l5}, lord of the 5th, is ${own(l5) ? "in its own sign" : `in the ${ord(h5)}, an angle or trine`}. Parashara promises thorough happiness through children.`, "support", [l1, l5], S(16, "1-3"));
  }
  if (DUSTHANA.includes(h5)) {
    push("pa-h5-16-2", 5, "5th lord in a dusthana", `${l5}, lord of the 5th, is in the ${ord(h5)}. Parashara reads a denial of offspring here, and 16.8 counts the same placement among the yogas for children with difficulty; the promise of 16.16 below, where present, is the counterweight.`, "strain", [l5], S(16, "2"));
  }
  {
    const malWith5 = maleficsWith(l5);
    const weak = strong(l5) === false;
    if ((combust(l5) || malWith5.length) && weak) {
      push("pa-h5-16-3", 5, "5th lord weak and afflicted", `${l5}, lord of the 5th, is ${combust(l5) ? "combust" : `joined by ${list(malWith5)}`} and falls short of its Shadbala requirement. Parashara reads children denied or short-lived; the wording is his.`, "strain", [l5, ...malWith5], S(16, "3"));
    }
  }
  if (h5 === 6 && l1 !== "Mars" && pos(l1).signIndex === pos("Mars").signIndex) {
    push("pa-h5-16-4", 5, "First child and the 6th", `${l5}, lord of the 5th, is in the 6th while ${l1}, lord of the lagna, is with Mars. Parashara reads the loss of the first child and no further issue; a hard verse, to be weighed against 16.16 and the strength of Jupiter.`, "strain", [l5, l1, "Mars"], S(16, "4"));
  }
  if (l5Deb && DUSTHANA.includes(h5) && houseOf("Mercury") === 5 && houseOf("Ketu") === 5) {
    push("pa-h5-16-5", 5, "One child only", `${l5}, lord of the 5th, is debilitated in the ${ord(h5)} while Mercury and Ketu occupy the 5th. Parashara says one child only.`, "strain", [l5, "Mercury", "Ketu"], S(16, "5"));
  }
  if (l5Deb && pos(l5).signIndex !== s5 && deps.aspect(l5, pos(l5).signIndex, s5) === 0 && houseOf("Saturn") === 5 && houseOf("Mercury") === 5) {
    push("pa-h5-16-6", 5, "One child only", `${l5}, lord of the 5th, is debilitated and does not aspect the 5th, where Saturn and Mercury stand. Parashara says one child only.`, "strain", [l5, "Saturn", "Mercury"], S(16, "6"));
  }
  if (houseOf(l9) === 1 && l5Deb && houseOf("Ketu") === 5 && houseOf("Mercury") === 5) {
    push("pa-h5-16-7", 5, "Children after an ordeal", `${l9}, lord of the 9th, is in the lagna, ${l5}, lord of the 5th, is debilitated, and Ketu is with Mercury in the 5th. Parashara says progeny comes after a great deal of trial.`, "strain", [l9, l5, "Ketu", "Mercury"], S(16, "7"));
  }
  if (!DUSTHANA.includes(h5) && (pos(l5).dignity === "Inimical" || l5Deb || h5 === 5)) {
    push("pa-h5-16-8", 5, "Children with difficulty", `${l5}, lord of the 5th, is ${h5 === 5 ? "in the 5th itself" : l5Deb ? "debilitated" : "in an inimical sign"}. Parashara counts this among the placements that give children with difficulty. The clause "or in the 5th itself" is his and sits oddly with 16.1; shown as written.`, h5 === 5 && !l5Deb && pos(l5).dignity !== "Inimical" ? "mixed" : "strain", [l5], S(16, "8"));
  }
  {
    const aspBy5 = (["Mercury", "Jupiter", "Venus"] as Planet[]).filter((p) => pos(p).signIndex !== s5 && deps.aspect(p, pos(p).signIndex, s5) > 0 && strong(p) === true);
    if (strong(l5) === true && aspBy5.length === 3) push("pa-h5-16-12", 5, "Many children", `${l5}, lord of the 5th, is strong and the 5th is aspected by Mercury, Jupiter and Venus, all above their Shadbala requirement. Parashara says there will be many children.`, "support", [l5, ...aspBy5], S(16, "12"));
  }
  if (l5 !== "Moon" && pos(l5).signIndex === pos("Moon").signIndex) {
    push("pa-h5-16-13", 5, "Daughters", `${l5}, lord of the 5th, is with the Moon. Parashara reports that astrologers read daughters here. The alternative clause, the 5th lord in the Moon's decanate, is not evaluated.`, "mixed", [l5, "Moon"], S(16, "13", true));
  }
  {
    const juAsp = pos("Jupiter").signIndex === pos(l5).signIndex || deps.aspect("Jupiter", pos("Jupiter").signIndex, pos(l5).signIndex) > 0;
    const why = pos(l5).dignity === "Exalted" ? "exalted" : [2, 5, 9].includes(h5) ? `in the ${ord(h5)}` : juAsp && l5 !== "Jupiter" ? (pos("Jupiter").signIndex === pos(l5).signIndex ? "joined by Jupiter" : "aspected by Jupiter") : null;
    if (why) push("pa-h5-16-16", 5, "Children promised", `${l5}, lord of the 5th, is ${why}. Parashara says children are obtained.`, "support", why.includes("Jupiter") ? [l5, "Jupiter"] : [l5], S(16, "16"));
  }
  if (mal5.length >= 3 && l5Deb) {
    push("pa-h5-16-17", 5, "Children who stray", `${list(mal5)} occupy the 5th and ${l5}, its lord, is debilitated. Parashara reads children given to mean deeds; 16.17 excludes a benefic in the 5th from the count, and none is counted.`, "strain", [...mal5, l5], S(16, "17"));
  }
  if (houseOf("Jupiter") === 5 && l5 !== "Venus" && pos(l5).signIndex === pos("Venus").signIndex) {
    push("pa-h5-16-18", 5, "A child in the 32nd or 33rd year", `Jupiter is in the 5th and ${l5}, its lord, is with Venus. Parashara times a child to the 32nd or 33rd year.`, "support", ["Jupiter", l5, "Venus"], S(16, "18"));
  }
  if (KENDRA.includes(h5) && l5 !== "Jupiter" && pos(l5).signIndex === pos("Jupiter").signIndex) {
    push("pa-h5-16-19", 5, "A child at 30 or 36", `${l5}, lord of the 5th, is in the ${ord(h5)}, an angle, with Jupiter, the karaka. Parashara times a child to the age of 30 or 36.`, "support", [l5, "Jupiter"], S(16, "19"));
  }
  if (houseOf("Jupiter") === 9 && houseFrom(pos("Jupiter").signIndex, pos("Venus").signIndex) === 9 && l1 !== "Venus" && pos(l1).signIndex === pos("Venus").signIndex) {
    push("pa-h5-16-20", 5, "A child at 40", `Jupiter is in the 9th and Venus is in the 9th from Jupiter together with ${l1}, lord of the lagna. Parashara times a child to the age of 40.`, "support", ["Jupiter", "Venus", l1], S(16, "20"));
  }
  if (houseOf("Rahu") === 5 && maleficsWith(l5).length && pos("Jupiter").dignity === "Debilitated") {
    push("pa-h5-16-21", 5, "Grief through a child near 32", `Rahu is in the 5th, ${l5}, lord of the 5th, is joined by ${list(maleficsWith(l5))}, and Jupiter is debilitated. Parashara reads the loss of a child at 32; a hard verse, shown as written.`, "strain", ["Rahu", l5, "Jupiter"], S(16, "21"));
  }
  {
    const fifthFromJu = positions.filter((p) => !deps.benefic(p, positions) && houseFrom(pos("Jupiter").signIndex, p.signIndex) === 5).map((p) => p.planet);
    const others = mal5.filter((p) => !fifthFromJu.includes(p));
    if (fifthFromJu.length && others.length) push("pa-h5-16-22", 5, "Grief through children at 33 and 36", `${list(fifthFromJu)} ${v(fifthFromJu, "is", "are")} in the 5th from Jupiter and ${list(others)} in the 5th from the lagna. Parashara reads loss of children at 33 and 36; a hard verse, shown as written.`, "strain", [...fifthFromJu, ...others], S(16, "22"));
  }

  // ---- Chapter 17: the 6th house ----
  const l6 = lordOf(6);
  const l8 = lordOf(8);
  const l12 = lordOf(12);
  const h6 = houseOf(l6);
  const s6 = signOfHouse(6);
  const in6 = inSign(s6);
  const exch = (a: Planet, b: Planet, ha: number, hb: number) => a !== b && houseOf(a) === hb && houseOf(b) === ha;
  const withEach = (a: Planet, b: Planet) => a !== b && pos(a).signIndex === pos(b).signIndex;
  const natMal = (pl: Planet) => ["Sun", "Mars", "Saturn"].includes(pl);
  if ([1, 6, 8].includes(h6)) {
    push("pa-h6-17-2", 6, "Ulcers or bruises", `${l6}, lord of the 6th, is in the ${ord(h6)}. Parashara reads ulcers or bruises on the body, the limb shown by the sign of the 6th: ${SIGNS[s6]}, ${LIMB[s6]} in the Kalapurusha scheme of 4.4.`, "strain", [l6], S(17, "2"));
  }
  if (["Mars", "Mercury"].includes(SIGN_LORD[pos(l1).signIndex]) && l1 !== "Mercury" && (withEach(l1, "Mercury") || deps.aspect("Mercury", pos("Mercury").signIndex, pos(l1).signIndex) > 0)) {
    push("pa-h6-17-6", 6, "Ailments of the face", `${l1}, lord of the lagna, is in ${SIGNS[pos(l1).signIndex]}, a sign of ${SIGN_LORD[pos(l1).signIndex]}, and Mercury ${withEach(l1, "Mercury") ? "joins" : "aspects"} it. Parashara reads diseases of the face.`, "strain", [l1, "Mercury"], S(17, "6"));
  }
  if (["Mars", "Mercury"].includes(l1) && (["Moon", "Rahu", "Saturn"] as Planet[]).every((p) => withEach(l1, p))) {
    push("pa-h6-17-7", 6, "Skin disease", `${l1}, lord of the lagna, is joined by the Moon, Rahu and Saturn. Parashara reads leprosy; taken today as a serious skin disorder.`, "strain", [l1, "Moon", "Rahu", "Saturn"], S(17, "7"));
  }
  if (houseOf("Moon") === 1 && signOfHouse(1) !== 3) {
    const kinds: string[] = [];
    if (withEach("Moon", "Rahu")) kinds.push("Rahu (white leprosy in the text)");
    if (withEach("Moon", "Saturn")) kinds.push("Saturn (black leprosy)");
    if (withEach("Moon", "Mars")) kinds.push("Mars (blood leprosy)");
    if (kinds.length) push("pa-h6-17-8", 6, "Skin disease", `The Moon is in the lagna, which is not Cancer, together with ${list(kinds)}. Parashara reads skin disease of the kind named; the labels are his, read today as skin disorders.`, "strain", ["Moon", ...(withEach("Moon", "Rahu") ? ["Rahu" as Planet] : []), ...(withEach("Moon", "Saturn") ? ["Saturn" as Planet] : []), ...(withEach("Moon", "Mars") ? ["Mars" as Planet] : [])], S(17, "8"));
  }
  if (houseOf(l6) === 1 && houseOf(l8) === 1) {
    const DIS: Partial<Record<Planet, string>> = { Sun: "fever and tumours", Mars: "swelling and hardening of blood vessels, wounds and injuries by weapons", Mercury: "bilious complaints", Jupiter: "the destruction of disease", Venus: "disease through women", Saturn: "windy complaints", Rahu: "danger through men of low station", Ketu: "navel complaints", Moon: "danger through water and phlegmatic disorders" };
    const third = inSign(signOfHouse(1)).map((p) => p.planet).filter((p) => p !== l6 && p !== l8 && DIS[p]);
    if (third.length) push("pa-h6-17-9", 6, "Disease from the lagna", `${l6} and ${l8}, lords of the 6th and 8th, are in the lagna with ${list(third)}. Parashara reads ${list(third.map((p) => `${DIS[p]} (${p})`))}.`, third.includes("Jupiter") && third.length === 1 ? "support" : "strain", [l6, l8, ...third], S(17, "9-12"));
  }
  {
    const mal6 = in6.filter((p) => !deps.benefic(p, positions) && p.planet !== l6).map((p) => p.planet);
    const malL6 = maleficsWith(l6);
    if (withEach("Saturn", "Rahu") && mal6.length && malL6.length) {
      push("pa-h6-17-13", 6, "Recurring ill health", `Saturn is with Rahu, the 6th holds ${list(mal6)}, and ${l6}, its lord, is joined by ${list(malL6)}. Parashara reads illness through life; read today as a recurring liability to be weighed against the lagna lord's strength.`, "strain", ["Saturn", "Rahu", l6, ...mal6, ...malL6], S(17, "13"));
    }
  }
  if (houseOf("Mars") === 6 && h6 === 8) {
    push("pa-h6-17-14", 6, "Fever at 6 and 12", `Mars is in the 6th and ${l6}, lord of the 6th, is in the 8th. Parashara times severe fever to the ages of 6 and 12.`, "strain", ["Mars", l6], S(17, "14"));
  }
  if ([8, 11].includes(pos("Moon").signIndex) && houseOf("Jupiter") === 6) {
    push("pa-h6-17-15", 6, "Skin disease at 19 and 22", `The Moon is in ${SIGNS[pos("Moon").signIndex]} and Jupiter is in the 6th. Parashara times leprosy, read today as skin disease, to the ages of 19 and 22.`, "strain", ["Moon", "Jupiter"], S(17, "15"));
  }
  if (exch(l6, l12, 6, 12)) {
    push("pa-h6-17-17", 6, "Spleen at 29 and 30", `${l6} and ${l12}, lords of the 6th and 12th, exchange signs. Parashara times disorders of the spleen to the ages of 29 and 30.`, "strain", [l6, l12], S(17, "17"));
  }
  if (houseOf("Saturn") === 6 && houseOf("Moon") === 6) {
    push("pa-h6-17-18", 6, "Skin disease at 45", `Saturn and the Moon are together in the 6th. Parashara times blood leprosy, read today as a blood or skin disorder, to the age of 45.`, "strain", ["Saturn", "Moon"], S(17, "18"));
  }
  {
    const satEnemy = (["Sun", "Moon", "Mars"] as Planet[]).filter((p) => withEach("Saturn", p));
    if (satEnemy.length && houseOf(l1) === 1) {
      push("pa-h6-17-19", 6, "Rheumatic complaints at 59", `Saturn is joined by ${list(satEnemy)}, ${v(satEnemy, "its natural enemy", "its natural enemies")} by 3.55, and ${l1}, lord of the lagna, is in the lagna. Parashara times windy disorders such as rheumatism to the age of 59.`, "strain", ["Saturn", ...satEnemy, l1], S(17, "19"));
    }
  }
  if (withEach("Moon", l6) && houseOf(l8) === 6 && houseOf(l12) === 1) {
    push("pa-h6-17-20", 6, "Trouble from animals at 8", `The Moon is with ${l6}, lord of the 6th, ${l8}, lord of the 8th, is in the 6th, and ${l12}, lord of the 12th, is in the lagna. Parashara times trouble from animals to the age of 8.`, "strain", ["Moon", l6, l8, l12], S(17, "20"));
  }
  if (houseOf("Rahu") === 6 && houseFrom(pos("Rahu").signIndex, pos("Saturn").signIndex) === 8) {
    push("pa-h6-17-21", 6, "Fire and birds in infancy", `Rahu is in the 6th and Saturn is in the 8th from Rahu. Parashara reads danger through fire in the 1st and 2nd years and trouble from birds in the 3rd.`, "strain", ["Rahu", "Saturn"], S(17, "21-22"));
  }
  if ([6, 8].includes(houseOf("Sun")) && houseFrom(pos("Sun").signIndex, pos("Moon").signIndex) === 12) {
    push("pa-h6-17-23", 6, "Danger through water at 5 and 9", `The Sun is in the ${ord(houseOf("Sun"))} and the Moon is in the 12th from the Sun. Parashara reads danger through water in the 5th and 9th years.`, "strain", ["Sun", "Moon"], S(17, "23"));
  }
  if (houseOf("Saturn") === 8 && houseOf("Mars") === 7) {
    push("pa-h6-17-24", 6, "Eruptive fever at 10 and 30", `Saturn is in the 8th and Mars in the 7th. Parashara times smallpox, read today as eruptive fever or pox, to the 10th and 30th years.`, "strain", ["Saturn", "Mars"], S(17, "24"));
  }
  if (exch(l11, l6, 11, 6)) {
    push("pa-h6-17-26", 6, "Loss through enemies at 31", `${l11} and ${l6}, lords of the 11th and 6th, exchange signs. Parashara times a loss of wealth to the 31st year.`, "strain", [l11, l6], S(17, "26"));
  }
  if (h5 === 6 && withEach(l6, "Jupiter") && houseOf(l12) === 1) {
    push("pa-h6-17-27", 6, "Estrangement from children", `${l5}, lord of the 5th, is in the 6th, ${l6}, lord of the 6th, is with Jupiter, and ${l12}, lord of the 12th, is in the lagna. Parashara reads one's own sons as enemies; read as estrangement.`, "strain", [l5, l6, "Jupiter", l12], S(17, "27"));
  }
  if (exch(l1, l6, 1, 6)) {
    push("pa-h6-17-28", 6, "Fear from dogs at 10 and 19", `${l1} and ${l6}, lords of the lagna and 6th, exchange signs. Parashara times fear from dogs to the 10th and 19th years.`, "strain", [l1, l6], S(17, "28"));
  }

  // ---- Chapter 18: the 7th house ----
  const l7 = lordOf(7);
  const h7 = houseOf(l7);
  const s7 = signOfHouse(7);
  const in7 = inSign(s7);
  const disp = (pl: Planet) => SIGN_LORD[pos(pl).signIndex];
  const l7Deb = pos(l7).dignity === "Debilitated";
  const l7Exalt = pos(l7).dignity === "Exalted";
  const l7Own = own(l7) || l7Exalt;
  const navLagna = Math.floor(((lagnaLon % 360) + 360) % 360 / (30 / 9)) % 12;
  const navSeventh = (navLagna + 6 * 9) % 12;
  if (l7Own) {
    push("pa-h7-18-1", 7, "Happiness through the spouse", `${l7}, lord of the 7th, is ${l7Exalt ? "exalted" : "in its own sign"}. Parashara promises full happiness through the spouse and marriage.${l7Exalt ? " 18.6 adds that particular exaltation of the 7th lord can also mean more than one marriage." : ""}`, "support", [l7], S(18, "1"));
  } else if (DUSTHANA.includes(h7)) {
    push("pa-h7-18-2", 7, "Spouse's health", `${l7}, lord of the 7th, is in the ${ord(h7)}. Parashara reads a sickly spouse; he excludes the lord in own sign or exaltation, which does not hold here.`, "strain", [l7], S(18, "2"));
  }
  if (houseOf("Venus") === 7) {
    push("pa-h7-18-3a", 7, "Venus in the 7th", `Venus occupies the 7th. Parashara reads strong desire.`, "mixed", ["Venus"], S(18, "3"));
  }
  {
    const malVe = maleficsWith("Venus");
    if (malVe.length) push("pa-h7-18-3b", 7, "Venus with a malefic", `Venus is joined by ${list(malVe)} in the ${ord(houseOf("Venus"))}. Parashara reads harm to the spouse from Venus with a malefic in any house. The combination is common; his stricter tests are 18.16-17 and 18.35-39, and the 7th lord's condition weighs against it.`, "strain", ["Venus", ...malVe], S(18, "3"));
  }
  {
    const benW = beneficsWith(l7);
    const benA = aspectingPlanet(l7, "benefic").filter((p) => p !== l7);
    if (strong(l7) === true && (benW.length || benA.length)) {
      push("pa-h7-18-4", 7, "7th lord strong and befriended", `${l7}, lord of the 7th, is above its Shadbala requirement and ${benW.length ? `joined by ${list(benW)}` : ""}${benW.length && benA.length ? " and " : ""}${benA.length ? `aspected by ${list(benA)}` : ""}. Parashara promises wealth, honour, happiness and good fortune.`, "support", [l7, ...benW, ...benA], S(18, "4"));
    }
  }
  {
    const why = l7Deb ? "debilitated" : combust(l7) ? "combust" : pos(l7).dignity === "Inimical" ? "in an enemy's sign" : null;
    if (why) push("pa-h7-18-5", 7, "7th lord weakened", `${l7}, lord of the 7th, is ${why}. Parashara reads a spouse of poor health, or more than one marriage.`, "strain", [l7], S(18, "5"));
  }
  {
    const benA7 = aspectingPlanet(l7, "benefic").filter((p) => p !== l7);
    if (["Saturn", "Venus"].includes(disp(l7)) && !own(l7) && !l7Exalt && benA7.length) {
      push("pa-h7-18-6", 7, "More than one marriage", `${l7}, lord of the 7th, is in ${SIGNS[pos(l7).signIndex]}, a sign of ${disp(l7)}, and is aspected by ${list(benA7)}. Parashara reads more than one marriage here.`, "mixed", [l7, ...benA7], S(18, "6"));
    }
  }
  {
    const mal12 = inSign(signOfHouse(12)).filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
    const mal7 = in7.filter((p) => !deps.benefic(p, positions)).map((p) => p.planet);
    if (mal12.length && mal7.length && houseOf("Moon") === 5 && !ben("Moon")) {
      push("pa-h7-18-10", 7, "Spouse holds sway", `${list(mal12)} in the 12th, ${list(mal7)} in the 7th, and the waning Moon in the 5th. Parashara reads a native governed by the spouse, who is at odds with the family.`, "strain", [...mal12, ...mal7, "Moon"], S(18, "10"));
    }
  }
  {
    const ben7 = in7.filter((p) => deps.benefic(p, positions) && p.planet !== l1).map((p) => p.planet);
    if (l7Exalt && houseOf(l1) === 7 && strong(l1) === true && ben7.length) {
      push("pa-h7-18-14", 7, "A worthy spouse", `${l7}, lord of the 7th, is exalted, and the 7th holds ${l1}, lord of the lagna, above its Shadbala requirement, with ${list(ben7)}. Parashara promises a spouse of the seven virtues and a line continued through sons and grandsons.`, "support", [l7, l1, ...ben7], S(18, "14-15"));
    }
  }
  {
    const mal7 = in7.filter((p) => !deps.benefic(p, positions) && p.planet !== l7).map((p) => p.planet);
    const malL7 = maleficsWith(l7);
    if (mal7.length || malL7.length) {
      const weak = strong(l7) === false;
      push("pa-h7-18-16", 7, "Strain on the spouse", `${mal7.length ? `The 7th holds ${list(mal7)}` : ""}${mal7.length && malL7.length ? " and " : ""}${malL7.length ? `${l7}, lord of the 7th, is joined by ${list(malL7)}` : ""}. Parashara reads difficulties for the spouse, the more so when the 7th or its lord lacks strength${weak ? `, as ${l7} does here by Shadbala` : shadbala ? `; ${l7} meets its Shadbala requirement, which softens it` : ""}.`, "strain", [...mal7, l7, ...malL7], S(18, "16"));
    }
  }
  if ((strong(l7) === false && DUSTHANA.includes(h7)) || l7Deb) {
    push("pa-h7-18-17", 7, "Spouse's life under threat", `${l7}, lord of the 7th, is ${l7Deb ? "debilitated" : `in the ${ord(h7)} and short of its Shadbala requirement`}. Parashara reads the spouse's life as cut short; a hard verse, shown as written and to be weighed with 18.1-2 and the strength pass.`, "strain", [l7], S(18, "17"));
  }
  if (houseOf("Moon") === 7 && h7 === 12 && strong("Venus") === false) {
    push("pa-h7-18-18", 7, "Marital happiness withheld", `The Moon is in the 7th, ${l7}, lord of the 7th, is in the 12th, and Venus, the karaka, is short of its Shadbala requirement. Parashara denies marital happiness.`, "strain", ["Moon", l7, "Venus"], S(18, "18"));
  }
  {
    const neuter7 = ["Mercury", "Saturn"].includes(l7) || ["Mercury", "Saturn"].includes(SIGN_LORD[navSeventh]);
    const malSignWithMal = natMal(disp(l7)) && maleficsWith(l7).length > 0;
    if (neuter7 && (l7Deb || malSignWithMal)) {
      push("pa-h7-18-19", 7, "Two marriages", `${l7}, lord of the 7th, is ${l7Deb ? "debilitated" : `in a malefic's sign with ${list(maleficsWith(l7))}`}, and the 7th ${["Mercury", "Saturn"].includes(l7) ? "house" : "navamsa"} belongs to ${["Mercury", "Saturn"].includes(l7) ? l7 : SIGN_LORD[navSeventh]}, a neuter planet by 3.19. Parashara reads two marriages.`, "mixed", [l7, ...maleficsWith(l7)], S(18, "19"));
    }
  }
  if ((houseOf("Mars") === 7 && houseOf("Venus") === 7) || (houseOf("Saturn") === 7 && houseOf(l1) === 8)) {
    push("pa-h7-18-20", 7, "Three marriages", `${houseOf("Mars") === 7 && houseOf("Venus") === 7 ? "Mars and Venus are in the 7th" : `Saturn is in the 7th and ${l1}, lord of the lagna, is in the 8th`}. Parashara reads three marriages; shown as written.`, "mixed", houseOf("Mars") === 7 && houseOf("Venus") === 7 ? ["Mars", "Venus"] : ["Saturn", l1], S(18, "20"));
  }
  if (pos("Venus").signIndex % 3 === 2 && pos(disp("Venus")).dignity === "Exalted" && strong(l7) === true) {
    push("pa-h7-18-21", 7, "Many marriages", `Venus is in ${SIGNS[pos("Venus").signIndex]}, a dual sign, its dispositor ${disp("Venus")} is exalted, and ${l7}, lord of the 7th, is strong. Parashara reads many marriages; shown as written.`, "mixed", ["Venus", disp("Venus"), l7], S(18, "21"));
  }
  // 18.22-34: timing of marriage.
  const marry = (id: string, when: string, why: string, pls: Planet[], verse: string, prov?: boolean) => push(`pa-h7-18-${id}`, 7, `Marriage in the ${when}`, `${why}. Parashara times marriage to the ${when}; the ages are his and reflect the customs of his time.`, "support", pls, S(18, verse, prov));
  if (houseOf("Sun") === 7 && disp("Sun") !== "Venus" && withEach(disp("Sun"), "Venus")) {
    marry("23", "7th or 11th year", `The Sun is in the 7th and its dispositor ${disp("Sun")} is with Venus`, ["Sun", disp("Sun"), "Venus"], "23");
  }
  if (houseOf("Venus") === 2 && h7 === 11) {
    marry("24", "10th or 16th year", `Venus is in the 2nd and ${l7}, lord of the 7th, is in the 11th`, ["Venus", l7], "24");
  }
  if (KENDRA.includes(houseOf("Venus")) && [9, 10].includes(pos(l1).signIndex)) {
    marry("25", "11th year", `Venus is in the ${ord(houseOf("Venus"))}, an angle, and ${l1}, lord of the lagna, is in ${SIGNS[pos(l1).signIndex]}`, ["Venus", l1], "25");
  }
  if (KENDRA.includes(houseOf("Venus")) && houseFrom(pos("Venus").signIndex, pos("Saturn").signIndex) === 7) {
    marry("26", "12th or 19th year", `Venus is in the ${ord(houseOf("Venus"))}, an angle, and Saturn is in the 7th from Venus`, ["Venus", "Saturn"], "26");
  }
  if (houseFrom(pos("Moon").signIndex, pos("Venus").signIndex) === 7 && houseFrom(pos("Venus").signIndex, pos("Saturn").signIndex) === 7) {
    marry("27", "18th year", `Venus is in the 7th from the Moon and Saturn in the 7th from Venus`, ["Moon", "Venus", "Saturn"], "27");
  }
  if (houseOf(l2) === 11 && houseOf(l1) === 10) {
    marry("28", "15th year", `${l2}, lord of the 2nd, is in the 11th and ${l1}, lord of the lagna, is in the 10th`, [l2, l1], "28");
  }
  if (exch(l2, l11, 2, 11)) {
    marry("29", "13th year", `${l2} and ${l11}, lords of the 2nd and 11th, exchange signs`, [l2, l11], "29");
  }
  if (houseOf("Venus") === 2 && disp("Venus") !== "Mars" && withEach(disp("Venus"), "Mars")) {
    marry("30", "22nd or 27th year", `Venus is in the 2nd, the 7th from the 8th, and its dispositor ${disp("Venus")} is with Mars`, ["Venus", disp("Venus"), "Mars"], "30");
  }
  if (houseOf(l8) === 7 && navamsaSign(pos("Venus")) === navLagna) {
    marry("32", "25th or 33rd year", `${l8}, lord of the 8th, is in the 7th and Venus occupies the navamsa lagna, ${SIGNS[navLagna]}`, [l8, "Venus"], "32");
  }
  if (houseOf("Venus") === 5 && [5, 9].includes(houseOf("Rahu"))) {
    marry("33", "31st or 33rd year", `Venus is in the 5th, the 9th from the 9th, and Rahu is in the ${ord(houseOf("Rahu"))}`, ["Venus", "Rahu"], "33");
  }
  if (houseOf("Venus") === 1 && h7 === 7) {
    marry("34", "27th or 30th year", `Venus is in the lagna and ${l7}, lord of the 7th, is in the 7th itself`, ["Venus", l7], "34");
  }
  // 18.35-39, 18.42: hard verses on the spouse's life, shown as written.
  const bereave = (id: string, when: string, why: string, pls: Planet[], verse: string) => push(`pa-h7-18-${id}`, 7, `Spouse's life at risk in the ${when}`, `${why}. Parashara reads the loss of the spouse in the ${when}; a hard verse, shown as written and to be weighed against 18.1, 18.4 and the 7th lord's strength.`, "strain", pls, S(18, verse));
  if (l7Deb && houseOf("Venus") === 8) bereave("35", "18th or 33rd year", `${l7}, lord of the 7th, is debilitated and Venus is in the 8th`, [l7, "Venus"], "35");
  if (h7 === 8 && houseOf(l12) === 7) bereave("36", "19th year", `${l7}, lord of the 7th, is in the 8th and ${l12}, lord of the 12th, is in the 7th`, [l7, l12], "36");
  if (houseOf("Venus") === 8 && disp("Venus") !== "Saturn" && SIGN_LORD[pos(disp("Venus")).signIndex] === "Saturn") bereave("38", "12th or 21st year", `Venus is in the 8th and its dispositor ${disp("Venus")} is in ${SIGNS[pos(disp("Venus")).signIndex]}, a sign of Saturn`, ["Venus", disp("Venus")], "38");
  if (pos(l1).dignity === "Debilitated" && houseOf(l2) === 8) bereave("39", "13th year", `${l1}, lord of the lagna, is debilitated and ${l2}, lord of the 2nd, is in the 8th`, [l1, l2], "39");
  if (houseFrom(pos("Venus").signIndex, pos("Moon").signIndex) === 7 && houseFrom(pos("Moon").signIndex, pos("Mercury").signIndex) === 7 && houseOf(l8) === 5) {
    push("pa-h7-18-40", 7, "Three marriages at 10, 22 and 33", `The Moon is in the 7th from Venus, Mercury in the 7th from the Moon, and ${l8}, lord of the 8th, is in the 5th. Parashara times three marriages to the 10th, 22nd and 33rd years; shown as written.`, "mixed", ["Venus", "Moon", "Mercury", l8], S(18, "40-41"));
  }
  if (houseOf("Mars") === 6 && houseOf("Rahu") === 7 && houseOf("Saturn") === 8) {
    push("pa-h7-18-42", 7, "Spouse's life at risk", `Mars, Rahu and Saturn occupy the 6th, 7th and 8th in that order. Parashara reads the spouse's life as short; a hard verse, shown as written.`, "strain", ["Mars", "Rahu", "Saturn"], S(18, "42"));
  }

  // ---- Chapter 19: the 8th house ----
  const h8 = houseOf(l8);
  const s8 = signOfHouse(8);
  const mal8 = inSign(s8).filter((p) => !deps.benefic(p, positions) && p.planet !== l8).map((p) => p.planet);
  if (KENDRA.includes(h8)) {
    push("pa-h8-19-1", 8, "Long life", `${l8}, lord of the 8th, is in the ${ord(h8)}, an angle. Parashara reads long life${strong(l1) === false ? `, though 19.8 sets the lagna lord's weakness against the same placement, and ${l1} is short of its Shadbala requirement here` : ""}.`, strong(l1) === false ? "mixed" : "support", [l8], S(19, "1"));
  }
  if (h8 === 8 && (withEach(l8, l1) || maleficsWith(l8).length)) {
    const co = withEach(l8, l1) ? [l1] : maleficsWith(l8);
    push("pa-h8-19-2", 8, "Span curtailed", `${l8}, lord of the 8th, is in the 8th itself with ${list(co)}${withEach(l8, l1) ? ", the lagna lord" : ""}. Parashara counts this among the short-life yogas; 19.7 asks that planetary strength decide such matters, so this is a caution rather than a span.`, "strain", [l8, ...co], S(19, "2"));
  }
  {
    const ways: string[] = [];
    const pls: Planet[] = [];
    if (h6 === 12) { ways.push(`${l6}, lord of the 6th, is in the 12th`); pls.push(l6); }
    if (h6 === 6 && houseOf(l12) === 12) { ways.push(`${l6} and ${l12}, lords of the 6th and 12th, stand in their own houses`); pls.push(l6, l12); }
    if (l6 !== l12 && [1, 8].includes(h6) && [1, 8].includes(houseOf(l12)) && h6 !== houseOf(l12)) { ways.push(`${l6} and ${l12}, lords of the 6th and 12th, occupy the lagna and the 8th`); pls.push(l6, l12); }
    if (ways.length) push("pa-h8-19-4", 8, "Long life", `${list(ways)}. Parashara reads long life.`, "support", pls, S(19, "4"));
  }
  {
    const trio = Array.from(new Set<Planet>([l5, l8, l1]));
    const good = (p: Planet) => own(p) || pos(p).dignity === "Friendly" || SIGN_LORD[navamsaSign(pos(p))] === p;
    if (trio.every(good)) push("pa-h8-19-5", 8, "Long life", `${list(trio.map((p) => `${p} ${own(p) ? "in its own sign" : pos(p).dignity === "Friendly" ? "in a friendly sign" : "in its own navamsa"}`))}: the lords of the 5th, 8th and lagna are each well placed. Parashara reads a long span of life.`, "support", trio, S(19, "5"));
  }
  {
    const four = Array.from(new Set<Planet>([l1, l8, l10, "Saturn"]));
    const okH = (p: Planet) => inKT(houseOf(p)) || houseOf(p) === 11;
    if (four.every(okH)) push("pa-h8-19-6", 8, "Long life", `${list(four.map((p) => `${p} in the ${ord(houseOf(p))}`))}: the lords of the lagna, 8th and 10th and Saturn are each in an angle, a trine or the 11th. Parashara reads long life.`, "support", four, S(19, "6"));
  }
  if (strong(l1) === false && KENDRA.includes(h8)) {
    push("pa-h8-19-8", 8, "Span questioned", `${l1}, lord of the lagna, is short of its Shadbala requirement while ${l8}, lord of the 8th, is in the ${ord(h8)}, an angle. Parashara puts the span between 20 and 32 years here; 19.1 reads the same 8th lord as long life, and 19.7 leaves the decision to strength. Where the native is already past that age the verse speaks to health rather than span.`, "strain", [l1, l8], S(19, "8"));
  }
  if (pos(l8).dignity === "Debilitated" && mal8.length && strong(l1) === false) {
    push("pa-h8-19-9", 8, "Span curtailed", `${l8}, lord of the 8th, is debilitated, the 8th holds ${list(mal8)}, and ${l1}, lord of the lagna, is short of its Shadbala requirement. Parashara counts this among the short-life yogas; 19.7 asks that strength decide, so this is a caution rather than a span.`, "strain", [l8, ...mal8, l1], S(19, "9"));
  }
  if (pos(l1).dignity === "Exalted" && houseOf("Moon") === 11 && houseOf("Jupiter") === 8) {
    push("pa-h8-19-14", 8, "Long life", `${l1}, lord of the lagna, is exalted, the Moon is in the 11th and Jupiter in the 8th. Parashara reads long life.`, "support", [l1, "Moon", "Jupiter"], S(19, "14"));
  }
  {
    const benKT = aspectingPlanet(l1, "benefic").filter((p) => p !== l1 && KENDRA.includes(houseOf(p)));
    if (strong(l1) === true && (pos(l1).dignity === "Exalted" || own(l1)) && benKT.length) {
      push("pa-h8-19-15", 8, "Wealth, virtue and long life", `${l1}, lord of the lagna, is ${pos(l1).dignity === "Exalted" ? "exalted" : "in its own sign"} and above its Shadbala requirement, and ${list(benKT)} ${v(benKT, "aspects", "aspect")} it from the ${list(benKT.map((p) => ord(houseOf(p))))}, an angle. Parashara promises wealth, virtue and long life. "Exceedingly strong" is read as dignity plus Shadbala, so this is provisional.`, "support", [l1, ...benKT], S(19, "15", true));
    }
  }
  return F;
}

/** Limbs of the Kalapurusha by sign, BPHS 4.4. */
const LIMB = ["the head", "the face", "the arms", "the heart", "the stomach", "the hip", "the space below the navel", "the private parts", "the thighs", "the knees", "the ankles", "the feet"];

/** Exaltation signs, for the navamsa test of 15.12. */
const EXALT_SIGN: Partial<Record<Planet, number>> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };

export const HOUSE_CAVEATS = [
  "Not applied from chapter 14: the counting verses 14.7-13 (numbers of brothers and sisters), and 14.2-3 and 14.5 when Mars is itself the 3rd lord, since those verses pair the lord with Mars. From chapter 15: the closing rule of 15.14 (a benefic or malefic related to the 4th colours conveyances), already covered by the chapter 11 judgement. From chapter 16: 16.9 and 16.23 (Mandi is not computed), 16.11 (six planets in the 5th), 16.14-15 (parentage), and the counting verses 16.24-32. From chapter 17: 17.3-5 (ulcers to relatives through their karakas), 17.16 and 17.25 (Mandi and the 8th navamsa are not computed). From chapter 18: the descriptive verses 18.7-9 and 18.11-13 (spouse's character and conduct from the 7th house and Venus, which fire for a third of all charts by ownership alone), 18.22 (the translation wavers between a benefic's house and the 9th, and the ages 5 or 9 are child marriage), 18.31 (the lagna lord's navamsa clause is ambiguous) and 18.37. From chapter 19: 19.3 (the same tests repeated for Saturn and the 10th lord) and 19.10-13, which concern death at or soon after birth and do not apply to a living native.",
  "12.9 (twins), 12.11 (repeat the reading from the Moon) and 12.12-15 (decanates and limbs) are not applied; 12.11 is noted for the reader rather than duplicated.",
  "Chapter 18 speaks of a wife; the cards say spouse and apply the verses to charts of either sex, which the text does not itself authorise, so that reading is provisional. Ages in the timing verses of chapters 17-18 are given as written; 19.7 and 14.15 ask that planetary strength decide before any of the hard verses are read as outcomes.",
  "Malefic and benefic follow the natural classification used across this pass: the Moon benefic when waxing, Mercury when free of malefic company, nodes malefic.",
];
