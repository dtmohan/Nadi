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
    push("pa-h1-12-10", 1, "Sun and Moon in one house and navamsa", `The Sun and Moon share ${SIGNS[pos("Sun").signIndex]} and the same navamsa. Parashara says the child is nurtured by three mothers in its first three months and then raised by father and brother.`, "mixed", ["Sun", "Moon"], S(12, "10"));
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
  return F;
}

export const HOUSE_CAVEATS = [
  "12.9 (twins), 12.11 (repeat the reading from the Moon) and 12.12-15 (decanates and limbs) are not applied; 12.11 is noted for the reader rather than duplicated.",
  "Malefic and benefic follow the natural classification used across this pass: the Moon benefic when waxing, Mercury when free of malefic company, nodes malefic.",
];
