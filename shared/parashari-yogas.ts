/**
 * BPHS chapters 35-38: Nabhasa yogas (ch. 35), the yogas of ch. 36 not already handled in parashari.ts,
 * lunar yogas (ch. 37) and solar yogas (ch. 38). Text: Santhanam's translation at jyotishvidya.com.
 * Readings the text does not state outright are marked provisional.
 */
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });
const SEVEN: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const PANAPHARA = [2, 5, 8, 11];
const APOKLIMA = [3, 6, 9, 12];
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const navamsaSign = (p: PlanetPosition) => (p.signIndex * 9 + Math.floor(p.degInSign / (30 / 9))) % 12;
/** Natural friends, BPHS 3.55 (derived from the moolatrikona rule stated there). */
const FRIENDS: Partial<Record<Planet, Planet[]>> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const OWN_OR_EXALTED = ["Exalted", "Moolatrikona", "Own sign"];

export const YOGA_CAVEATS: string[] = [
  "Nabhasa yogas (chapter 35) are judged from the seven planets, Rahu and Ketu excluded, as 35.13 speaks of all seven. Where the text says the planets occupy a set of houses, every house in the set must hold a planet. A Sankhya yoga is shown only when no other Nabhasa yoga holds (35.17), and 35.50 says the results of these yogas are felt through every dasa. Ardhachandra is named in 35.3-6 and given effects in 35.40 but not defined in this text; the usual reading (seven continuous houses starting from a house that is not an angle) is used and marked provisional.",
  "Strength in chapter 36 is Shadbala against the 27.32-33 requirement, so Kahala, the second Sankha, Bheri, Mridanga and Sarada cards that need it are withheld when Shadbala is absent. Verses 36.38-39 (Parijatamsa and the other divisional dignities of the lagna lord) are not applied.",
  "In chapters 37 and 38 a planet means one of the seven; Rahu and Ketu are not counted. The 37.6 clause for a single benefic in an upachaya from the Moon (negligible wealth) is not shown. In 37.2-4 the contrary case is read as a Moon in a neutral navamsa, since the Moon has no natural enemies by 3.55; that reading is provisional.",
];

export function yogaFindings(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const lordOf = (h: number) => SIGN_LORD[signOfHouse(h)];
  const ben = (pl: Planet) => deps.benefic(pos(pl), positions);
  const inHouse = (h: number) => positions.filter((p) => houseFrom(lagnaIdx, p.signIndex) === h);
  const strong = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl)?.strong;
  const inKT = (h: number) => KENDRA.includes(h) || TRIKONA.includes(h);
  const push = (id: string, title: string, text: string, tone: ParashariFinding["tone"], planets: Planet[], source: ParashariSource) =>
    F.push({ id, kind: tone === "strain" ? "strain" : "yoga", title, text, tone, planets: Array.from(new Set(planets)), source });

  // ---- Chapter 35: Nabhasa yogas, from the seven planets ----
  const seven = SEVEN.map(pos);
  const h7 = (p: PlanetPosition) => houseFrom(lagnaIdx, p.signIndex);
  const conf = (houses: number[]) => seven.every((p) => houses.includes(h7(p)));
  const occ = (houses: number[]) => houses.every((h) => seven.some((p) => h7(p) === h));
  const ben7 = seven.filter((p) => ben(p.planet));
  const mal7 = seven.filter((p) => !ben(p.planet));
  let nabhasa = false;

  // Asraya, 35.7
  const quality = seven.map((p) => p.signIndex % 3);
  if (quality.every((q) => q === quality[0])) {
    nabhasa = true;
    const q = quality[0];
    if (q === 0) push("pa-nabhasa-rajju", "Rajju yoga", "All seven planets are in movable signs. Parashara gives a love of travel, charm and earnings in foreign lands, and adds cruelty and mischief; the last two are his words.", "mixed", SEVEN, S(35, "7, 18"));
    else if (q === 1) push("pa-nabhasa-musala", "Musala yoga", "All seven planets are in fixed signs. Parashara gives honour, wisdom, wealth, the favour of rulers, fame, many children and a firm disposition.", "support", SEVEN, S(35, "7, 19"));
    else push("pa-nabhasa-nala", "Nala yoga", "All seven planets are in dual signs. Parashara gives an uneven build, a keen interest in saving money, great skill, helpfulness to relatives and charm.", "support", SEVEN, S(35, "7, 20"));
  }

  // Dala, 35.8
  {
    const inK = seven.filter((p) => KENDRA.includes(h7(p)));
    const kOcc = KENDRA.filter((h) => inK.some((p) => h7(p) === h));
    if (kOcc.length === 3 && inK.length) {
      if (inK.every((p) => ben(p.planet))) {
        nabhasa = true;
        push("pa-nabhasa-maala", "Maala yoga", `Three angles (the ${list(kOcc.map(ord))}) hold benefics only: ${list(inK.map((p) => p.planet))}. Parashara gives lasting happiness, conveyances, clothes, food and pleasures, and splendour. The text does not say whether a malefic in an angle would spoil the yoga; only the case of benefics alone is shown.`, "support", inK.map((p) => p.planet), S(35, "8, 21", true));
      } else if (inK.every((p) => !ben(p.planet))) {
        nabhasa = true;
        push("pa-nabhasa-sarpa", "Sarpa yoga", `Three angles (the ${list(kOcc.map(ord))}) hold malefics only: ${list(inK.map((p) => p.planet))}. Parashara reads a crooked and cruel nature, poverty, misery and dependence on others for food; shown as written.`, "strain", inK.map((p) => p.planet), S(35, "8, 22", true));
      }
    }
  }

  // Akriti, 35.9-15: first match wins.
  {
    const akriti = (id: string, title: string, where: string, effect: string, tone: ParashariFinding["tone"], verse: string, provisional?: boolean) => {
      nabhasa = true;
      push(`pa-nabhasa-${id}`, title, `${where} ${effect}`, tone, SEVEN, S(35, verse, provisional));
    };
    const gadaPair = [[1, 4], [4, 7], [7, 10], [10, 1]].find((pr) => conf(pr) && occ(pr));
    const run = (start: number, n: number) => Array.from({ length: n }, (_, i) => ((start - 1 + i) % 12) + 1);
    const yupa = [1, 4, 7, 10].find((s) => conf(run(s, 4)));
    const nauka = [1, 4, 7, 10].find((s) => conf(run(s, 7)) && occ(run(s, 7)));
    const ardha = [2, 3, 5, 6, 8, 9, 11, 12].find((s) => conf(run(s, 7)) && occ(run(s, 7)));
    const odd = [1, 3, 5, 7, 9, 11], even = [2, 4, 6, 8, 10, 12];
    const halaTriple = [[2, 6, 10], [3, 7, 11], [4, 8, 12]].find((t) => conf(t) && occ(t));
    if (gadaPair) akriti("gada", "Gada yoga", `All seven planets are in two successive angles, the ${ord(gadaPair[0])} and ${ord(gadaPair[1])}.`, "Parashara gives constant effort to earn, ritual observance, skill in the sastras and in song, and wealth in gold and gems.", "support", "9, 23");
    else if (conf([1, 7]) && occ([1, 7])) akriti("sakata", "Sakata yoga", "All seven planets are in the lagna and the 7th.", "Parashara reads illness, poor nails, folly, a hard trade (his phrase is pulling carts), poverty and a want of friends and relatives; shown as written.", "strain", "9, 24");
    else if (conf([4, 10]) && occ([4, 10])) akriti("vihaga", "Vihaga yoga", "All seven planets are in the 4th and the 10th.", "Parashara reads a roving life, work as a messenger, shamelessness and a taste for quarrels; his remark on livelihood is left unquoted.", "strain", "9, 25");
    else if (conf([1, 5, 9]) && occ([1, 5, 9])) akriti("sringataka", "Sringataka yoga", "All seven planets are in the lagna, 5th and 9th.", "Parashara gives a love of contest, happiness, the favour of rulers, a good spouse and riches, and adds a dislike of women.", "mixed", "9-10, 26");
    else if (halaTriple) akriti("hala", "Hala yoga", `All seven planets are in the ${list(halaTriple.map(ord))}, three houses four apart.`, "Parashara reads a large appetite, poverty, farming, misery, desertion by kin and service; shown as written.", "strain", "10, 27");
    else if (conf(KENDRA) && ben7.length && mal7.length && ben7.every((p) => [1, 7].includes(h7(p))) && mal7.every((p) => [4, 10].includes(h7(p)))) akriti("vajra", "Vajra yoga", "The benefics are all in the lagna and 7th and the malefics all in the 4th and 10th.", "Parashara gives happiness at the start and end of life, valour and charm, but little desire or fortune and a hostile streak.", "mixed", "11, 28");
    else if (conf(KENDRA) && ben7.length && mal7.length && ben7.every((p) => [4, 10].includes(h7(p))) && mal7.every((p) => [1, 7].includes(h7(p)))) akriti("yava", "Yava yoga", "The benefics are all in the 4th and 10th and the malefics all in the lagna and 7th.", "Parashara gives fasts and observances, auspicious acts, and happiness, wealth and children in mid-life, with charity and firmness.", "support", "11, 29");
    else if (conf(KENDRA) && occ(KENDRA)) akriti("kamala", "Kamala yoga", "All seven planets are in the four angles.", "Parashara gives riches, virtue, long life, wide fame, purity, hundreds of auspicious acts and kingly standing.", "support", "12, 30");
    else if ((conf(PANAPHARA) && occ(PANAPHARA)) || (conf(APOKLIMA) && occ(APOKLIMA))) akriti("vapi", "Vapi yoga", `All seven planets are in the ${conf(PANAPHARA) ? "succedent" : "cadent"} houses.`, "Parashara gives a capacity to accumulate lasting wealth, happiness and children, freedom from eye trouble and kingly standing.", "support", "12, 31");
    else if (yupa === 1) akriti("yupa", "Yupa yoga", "All seven planets are in the four houses from the lagna.", "Parashara gives spiritual knowledge, ritual observance, a spouse, strength, fasts and distinction.", "support", "13, 32");
    else if (yupa === 4) akriti("sara", "Sara yoga", "All seven planets are in the four houses from the 4th.", "Parashara reads harsh trades: arrow-making, charge of a prison, earning through animals, meat and cruelty; shown as written.", "strain", "13, 33");
    else if (yupa === 7) akriti("sakthi", "Sakthi yoga", "All seven planets are in the four houses from the 7th.", "Parashara reads want of wealth, failure, misery and laziness, yet long life, skill in war and firmness.", "strain", "13, 34");
    else if (yupa === 10) akriti("danda", "Danda yoga", "All seven planets are in the four houses from the 10th.", "Parashara reads loss of children and spouse (as written), indigence, unkindness, separation from one's people and service to the mean.", "strain", "13, 35");
    else if (nauka === 1) akriti("nauka", "Nauka yoga", "All seven planets occupy the seven houses from the lagna.", "Parashara gives a livelihood through water, wealth and fame, and adds wickedness, wretchedness and miserliness; his words.", "mixed", "14, 36");
    else if (nauka === 4) akriti("koota", "Koota yoga", "All seven planets occupy the seven houses from the 4th.", "Parashara reads falsehood, charge of a jail, poverty, craft and a life in hills and forts; shown as written.", "strain", "14, 37");
    else if (nauka === 7) akriti("chatra", "Chatra yoga", "All seven planets occupy the seven houses from the 7th.", "Parashara gives help to one's own people, kindness, the regard of many rulers, intelligence, happiness at the start and end of life, and long life.", "support", "14, 38");
    else if (nauka === 10) akriti("chapa", "Chapa yoga", "All seven planets occupy the seven houses from the 10th.", "Parashara reads falsehood, secrecy, theft, wandering in forests and want of luck, with happiness in mid-life; shown as written.", "strain", "14, 39");
    else if (ardha) akriti("ardhachandra", "Ardhachandra yoga", `All seven planets occupy the seven houses from the ${ord(ardha)}, which is not an angle.`, "Parashara gives command of an army, a splendid body, the favour of rulers, strength, and gems, gold and ornaments. The definition is not in this text and is provisional.", "support", "40", true);
    else if (conf(odd) && occ(odd)) akriti("chakra", "Chakra yoga", "All seven planets occupy the six alternate houses from the lagna (1st, 3rd, 5th, 7th, 9th, 11th).", "Parashara gives imperial standing, with kings bowing at the native's feet.", "support", "15, 41");
    else if (conf(even) && occ(even)) akriti("samudra", "Samudra yoga", "All seven planets occupy the six alternate houses from the 2nd (2nd, 4th, 6th, 8th, 10th, 12th).", "Parashara gives many gems, abundant and lasting wealth, pleasures, popularity and a good disposition.", "support", "15, 42");
  }

  // Sankhya, 35.16-17: only when no other Nabhasa yoga holds.
  if (!nabhasa) {
    const n = new Set(seven.map((p) => p.signIndex)).size;
    const SANKHYA: Record<number, [string, string, ParashariFinding["tone"], string]> = {
      1: ["Gola yoga", "Parashara reads strength, but want of wealth, learning and intelligence, and sorrow; shown as written.", "strain", "16-17, 49"],
      2: ["Yuga yoga", "Parashara reads heterodoxy, want of wealth, rejection by others and want of children, mother and virtue; shown as written.", "strain", "16-17, 48"],
      3: ["Soola yoga", "Parashara reads sharpness and indolence, want of wealth, harshness, valour and fame through conflict.", "strain", "16-17, 47"],
      4: ["Kedara yoga", "Parashara gives usefulness to many, agriculture, truthfulness, happiness and wealth, with a fickle mind.", "mixed", "16-17, 46"],
      5: ["Paasa yoga", "Parashara reads a liability to confinement, skill in work, a deceptive disposition, much talk and many servants.", "strain", "16-17, 45"],
      6: ["Daama yoga", "Parashara gives helpfulness, righteously earned wealth, affluence, fame, many children and gems, and courage.", "support", "16-17, 44"],
      7: ["Veena yoga", "Parashara gives a love of song, dance and instruments, skill, happiness, wealth and leadership.", "support", "16-17, 43"],
    };
    const [title, effect, tone, verse] = SANKHYA[n];
    push(`pa-nabhasa-sankhya-${n}`, title, `The seven planets occupy ${n === 1 ? "a single sign" : `${n} signs`}, and no Asraya, Dala or Akriti yoga holds. ${effect}`, tone, SEVEN, S(35, verse));
  }

  // ---- Chapter 36: remaining yogas ----
  const l1 = lordOf(1), l2 = lordOf(2), l4 = lordOf(4), l7 = lordOf(7), l9 = lordOf(9), l10 = lordOf(10);
  const mutualKendra = (a: Planet, b: Planet) => a !== b && KENDRA.includes(houseFrom(pos(a).signIndex, pos(b).signIndex));
  const together = (a: Planet, b: Planet) => a !== b && pos(a).signIndex === pos(b).signIndex;
  const movable = (pl: Planet) => pos(pl).signIndex % 3 === 0;
  const dign = (pl: Planet) => pos(pl).dignity;
  const strengthText = (pl: Planet, role: string) => `${pl}, the ${role}, is above its Shadbala requirement`;

  // Kahala, 36.9-10
  if (l4 !== "Jupiter" && mutualKendra(l4, "Jupiter") && strong(l1) === true) {
    push("pa-yoga-kahala", "Kahala yoga", `${l4}, lord of the 4th, and Jupiter are ${together(l4, "Jupiter") ? `together in ${SIGNS[pos(l4).signIndex]}, which counts as the 1st, an angle, from each other` : `in mutual angles (the ${ord(houseFrom(pos(l4).signIndex, pos("Jupiter").signIndex))} from each other)`}, and ${strengthText(l1, "lagna lord")}. Parashara gives energy, adventure and command of forces, with authority over a small territory; he adds cunning.`, "support", [l4, "Jupiter", l1], S(36, "9-10"));
  } else if (l4 !== l10 && OWN_OR_EXALTED.includes(dign(l4)) && together(l4, l10)) {
    push("pa-yoga-kahala", "Kahala yoga", `${l4}, lord of the 4th, is ${dign(l4) === "Exalted" ? "exalted" : "in its own sign"} in ${SIGNS[pos(l4).signIndex]} together with ${l10}, lord of the 10th. Parashara gives energy, adventure and command of forces, with authority over a small territory; he adds cunning.`, "support", [l4, l10], S(36, "9-10"));
  }

  // Sankha, second form, 36.13-14
  if (movable(l1) && movable(l10) && strong(l9) === true) {
    push("pa-yoga-sankha-2", "Sankha yoga (second form)", `${l1 === l10 ? `${l1}, lord of the lagna and the 10th, is` : `${l1}, the lagna lord, and ${l10}, the 10th lord, are`} in ${l1 === l10 ? "a movable sign" : "movable signs"}, and ${strengthText(l9, "9th lord")}. Parashara gives wealth, spouse and children, kindness, merit, intelligence and long life.`, "support", [l1, l10, l9], S(36, "13-14"));
  }

  // Bheri, 36.15-16
  if (strong(l9) === true) {
    if ([12, 1, 2, 7].every((h) => inHouse(h).length)) {
      push("pa-yoga-bheri", "Bheri yoga", `The 12th, lagna, 2nd and 7th are all occupied, and ${strengthText(l9, "9th lord")}. Parashara gives wealth, spouse and children, kingly standing, fame, virtue, good conduct and pleasures.`, "support", [l9, ...[12, 1, 2, 7].flatMap((h) => inHouse(h).map((p) => p.planet))], S(36, "15-16"));
    } else if ([("Venus" as Planet), "Jupiter" as Planet, l1].every((pl) => KENDRA.includes(houseOf(pl)))) {
      push("pa-yoga-bheri", "Bheri yoga", `Venus, Jupiter and ${l1}, the lagna lord, are each in an angle, and ${strengthText(l9, "9th lord")}. Parashara gives wealth, spouse and children, kingly standing, fame, virtue, good conduct and pleasures.`, "support", ["Venus", "Jupiter", l1, l9], S(36, "15-16"));
    }
  }

  // Mridanga, 36.17
  if (strong(l1) === true) {
    const others = SEVEN.filter((pl) => pl !== l1);
    if (others.every((pl) => inKT(houseOf(pl)) || OWN_OR_EXALTED.includes(dign(pl)))) {
      push("pa-yoga-mridanga", "Mridanga yoga", `${strengthText(l1, "lagna lord")}, and every other planet is in an angle or trine, or in its own or exaltation sign. Parashara gives kingly standing, or its equal, and happiness.`, "support", SEVEN, S(36, "17"));
    }
  }

  // Srinatha, 36.18
  if (houseOf(l7) === 10 && dign(l10) === "Exalted" && together(l10, l9)) {
    push("pa-yoga-srinatha", "Srinatha yoga", `${l7}, lord of the 7th, is in the 10th; ${l10}, lord of the 10th, is exalted in ${SIGNS[pos(l10).signIndex]} with ${l9}, lord of the 9th. Parashara likens the native to Indra.`, "support", [l7, l10, l9], S(36, "18"));
  }

  // Sarada, 36.19-20
  if (houseOf(l10) === 5 && KENDRA.includes(houseOf("Mercury")) && pos("Sun").signIndex === 4 && strong("Sun") === true) {
    push("pa-yoga-sarada", "Sarada yoga", `${l10}, lord of the 10th, is in the 5th, Mercury is in the ${ord(houseOf("Mercury"))}, an angle, and the Sun is in Leo above its Shadbala requirement. Parashara gives wealth, spouse and children, happiness, learning, the favour of rulers, piety and virtue.`, "support", [l10, "Mercury", "Sun"], S(36, "19-20"));
  } else if (houseOf("Mars") === 11) {
    const fromMoon = (pl: Planet) => houseFrom(pos("Moon").signIndex, pos(pl).signIndex);
    const trine = (["Jupiter", "Mercury"] as Planet[]).filter((pl) => [5, 9].includes(fromMoon(pl)));
    if (trine.length) {
      push("pa-yoga-sarada", "Sarada yoga (second form)", `${list(trine)} ${trine.length > 1 ? "are" : "is"} in a trine from the Moon (the ${list(trine.map((pl) => ord(fromMoon(pl))))} from it) and Mars is in the 11th. Parashara gives wealth, spouse and children, happiness, learning, the favour of rulers, piety and virtue.`, "support", [...trine, "Mars", "Moon"], S(36, "19-20"));
    }
  }

  // Matsya, 36.21-22
  {
    const onlyBen = (h: number) => inHouse(h).length > 0 && inHouse(h).every((p) => deps.benefic(p, positions));
    const onlyMal = (h: number) => inHouse(h).length > 0 && inHouse(h).every((p) => !deps.benefic(p, positions));
    const mixed5 = inHouse(5).some((p) => deps.benefic(p, positions)) && inHouse(5).some((p) => !deps.benefic(p, positions));
    if (onlyBen(9) && onlyBen(1) && mixed5 && onlyMal(4) && onlyMal(8)) {
      push("pa-yoga-matsya", "Matsya yoga", "Benefics in the 9th and the lagna, a mix of benefics and malefics in the 5th, and malefics in the 4th and 8th. Parashara gives an astrologer: kind, virtuous, strong, handsome, famous, learned and pious.", "support", [1, 9, 5, 4, 8].flatMap((h) => inHouse(h).map((p) => p.planet)), S(36, "21-22"));
    }
    // Koorma, 36.23-24
    const benFriendly = (h: number) => inHouse(h).length > 0 && inHouse(h).every((p) => deps.benefic(p, positions) && [...OWN_OR_EXALTED, "Friendly"].includes(p.dignity));
    const malOwn = (h: number) => inHouse(h).length > 0 && inHouse(h).every((p) => !deps.benefic(p, positions) && OWN_OR_EXALTED.includes(p.dignity));
    if ([5, 6, 7].every(benFriendly) && [3, 11, 1].every(malOwn)) {
      push("pa-yoga-koorma", "Koorma yoga", "Benefics in own, exaltation or friendly signs occupy the 5th, 6th and 7th while malefics in own or exaltation signs occupy the 3rd, 11th and lagna. Parashara gives kingly standing, courage, virtue, fame, helpfulness, happiness and leadership.", "support", [5, 6, 7, 3, 11, 1].flatMap((h) => inHouse(h).map((p) => p.planet)), S(36, "23-24"));
    }
  }

  // Kusuma, 36.29-30: fixed lagna only.
  if (lagnaIdx % 3 === 1 && KENDRA.includes(houseOf("Venus")) && TRIKONA.includes(houseOf("Moon")) && houseOf("Saturn") === 10) {
    const withMoon = positions.filter((p) => p.planet !== "Moon" && p.signIndex === pos("Moon").signIndex && deps.benefic(p, positions)).map((p) => p.planet);
    if (withMoon.length) {
      push("pa-yoga-kusuma", "Kusuma yoga", `With ${SIGNS[lagnaIdx]}, a fixed sign, rising: Venus is in the ${ord(houseOf("Venus"))}, an angle; the Moon is in the ${ord(houseOf("Moon"))}, a trine, with ${list(withMoon)}; Saturn is in the 10th. Parashara gives kingly standing or its equal, charity, pleasures, happiness, pre-eminence among one's people and virtue.`, "support", ["Venus", "Moon", ...withMoon, "Saturn"], S(36, "29-30"));
    }
  }

  // Kalpadruma, 36.33-34
  {
    const a = l1;
    const b = SIGN_LORD[pos(a).signIndex];
    const c = SIGN_LORD[pos(b).signIndex];
    const d = SIGN_LORD[navamsaSign(pos(c))];
    const four = Array.from(new Set([a, b, c, d]));
    const ok = (pl: Planet) => inKT(houseOf(pl)) || dign(pl) === "Exalted";
    if (four.every(ok)) {
      const how = (pl: Planet) => (inKT(houseOf(pl)) ? `in the ${ord(houseOf(pl))}` : "exalted");
      const chain = [`${a}, the lagna lord`, b === a ? "in its own sign and so its own dispositor" : `its dispositor ${b}`, c === b ? (b === a ? "" : `${b} likewise in its own sign`) : `${b}'s dispositor ${c}`, `${c}'s navamsa dispositor ${d}`].filter(Boolean);
      push("pa-yoga-kalpadruma", "Kalpadruma yoga", `${chain.slice(0, -1).join(", ")}, and ${chain[chain.length - 1]}: ${four.length === 1 ? "the one planet is" : "all are"} in angles or trines or exalted (${four.map((pl) => `${pl} ${how(pl)}`).join("; ")}). Parashara gives wealth of every kind, kingly standing, piety, strength, a taste for contest and mercy.`, "support", four, S(36, "33-34"));
    }
  }

  // Trimurti, 36.35-36
  {
    const benAt = (fromSign: number, h: number) => positions.filter((p) => houseFrom(fromSign, p.signIndex) === h && deps.benefic(p, positions)).map((p) => p.planet);
    const tri = (id: string, title: string, ref: Planet, refRole: string, houses: number[]) => {
      const found = houses.map((h) => benAt(pos(ref).signIndex, h));
      if (found.every((f) => f.length)) {
        push(`pa-yoga-${id}`, `${title} yoga`, `Counted from ${ref}, the ${refRole}, benefics occupy the ${list(houses.map(ord))} (${houses.map((h, i) => `${list(found[i])} in the ${ord(h)}`).join("; ")}). Parashara gives happiness, learning, wealth and children.`, "support", [ref, ...found.flat()], S(36, "35-36"));
      }
    };
    tri("hari", "Hari", l2, "2nd lord", [2, 12, 8]);
    tri("hara", "Hara", l7, "7th lord", [4, 9, 8]);
    tri("brahma", "Brahma", l1, "lagna lord", [4, 10, 11]);
  }

  // Lagnadhi, 36.37
  {
    const b7 = inHouse(7), b8 = inHouse(8);
    const allBen = (ps: PlanetPosition[]) => ps.length > 0 && ps.every((p) => deps.benefic(p, positions));
    const malAspect = positions.some((p) => !deps.benefic(p, positions) && (deps.aspect(p.planet, p.signIndex, signOfHouse(7)) > 0 || deps.aspect(p.planet, p.signIndex, signOfHouse(8)) > 0));
    if (allBen(b7) && allBen(b8) && !malAspect) {
      push("pa-yoga-lagnadhi", "Lagnadhi yoga", `Benefics occupy the 7th (${list(b7.map((p) => p.planet))}) and the 8th (${list(b8.map((p) => p.planet))}) with no malefic joining or aspecting them. Parashara gives greatness, learning in the sastras and happiness.`, "support", [...b7, ...b8].map((p) => p.planet), S(36, "37"));
    }
  }

  // ---- Chapter 37: lunar yogas ----
  const moon = pos("Moon"), sun = pos("Sun");
  const fromMoon = (p: PlanetPosition) => houseFrom(moon.signIndex, p.signIndex);
  const sixFromMoon = SEVEN.filter((pl) => pl !== "Sun" && pl !== "Moon").map(pos);

  // 37.1
  {
    const hm = houseFrom(sun.signIndex, moon.signIndex);
    const cls = KENDRA.includes(hm) ? "an angle" : PANAPHARA.includes(hm) ? "a succedent house" : "a cadent house";
    const eff = KENDRA.includes(hm) ? ["little", "strain"] : PANAPHARA.includes(hm) ? ["middling", "mixed"] : ["excellent", "support"];
    push("pa-lunar-37-1", "Moon's place from the Sun", `The Moon is in the ${ord(hm)} from the Sun, ${cls}. Parashara grades wealth, intelligence and skill as ${eff[0]} for this placement.`, eff[1] as ParashariFinding["tone"], ["Moon", "Sun"], S(37, "1"));
  }

  // 37.2-4
  {
    // Day birth when the Sun is above the horizon: it has risen (lies behind the ascendant degree) and not yet set.
    const day = (((lagnaLon - sun.lon) % 360) + 360) % 360 < 180;
    const helper: Planet = day ? "Jupiter" : "Venus";
    const navLord = SIGN_LORD[navamsaSign(moon)];
    const ownOrFriend = navLord === "Moon" || (FRIENDS.Moon ?? []).includes(navLord);
    const aspected = deps.aspect(helper, pos(helper).signIndex, moon.signIndex) > 0;
    if (aspected) {
      const navText = `${navLord === "Moon" ? "its own" : `${navLord}'s`} navamsa (${SIGNS[navamsaSign(moon)]})`;
      if (ownOrFriend) {
        push("pa-lunar-37-2", "Moon aspected in a friendly navamsa", `A ${day ? "day" : "night"} birth: the Moon is in ${navText}, ${navLord === "Moon" ? "its own" : "a friend's by 3.55"}, and is aspected by ${helper}. Parashara gives wealth and happiness.`, "support", ["Moon", helper], S(37, "2-4"));
      } else {
        push("pa-lunar-37-2", "Moon aspected in a neutral navamsa", `A ${day ? "day" : "night"} birth: the Moon is aspected by ${helper} but stands in ${navText}, neither its own nor a friend's by 3.55. Parashara reads little wealth for the contrary case; the contrary is taken to mean this neutral navamsa, which is provisional.`, "strain", ["Moon", helper], S(37, "2-4", true));
      }
    }
  }

  // 37.5 Adhi yoga
  {
    const bens = sixFromMoon.filter((p) => deps.benefic(p, positions));
    const at = (h: number) => bens.filter((p) => fromMoon(p) === h);
    const allThree = [6, 7, 8].every((h) => at(h).length);
    const trio = (["Mercury", "Jupiter", "Venus"] as Planet[]).every((pl) => [6, 7, 8].includes(fromMoon(pos(pl))) && ben(pl));
    if (allThree || trio) {
      const parts = bens.filter((p) => [6, 7, 8].includes(fromMoon(p)));
      const strongOnes = parts.filter((p) => strong(p.planet) === true).map((p) => p.planet);
      push("pa-lunar-adhi", "Adhi yoga from the Moon", `Benefics occupy the 6th, 7th and 8th from the Moon (${parts.map((p) => `${p.planet} in the ${ord(fromMoon(p))}`).join(", ")}). Parashara gives a king, a minister or an army chief by the strength of the planets taking part${shadbala ? strongOnes.length ? `; ${list(strongOnes)} ${strongOnes.length > 1 ? "are" : "is"} above the Shadbala requirement` : "; none of them reaches its Shadbala requirement" : ""}.${allThree ? "" : " Not every one of the three houses is occupied; the yoga is taken from all three benefics lying within them, which is provisional."}`, "support", ["Moon", ...parts.map((p) => p.planet)], S(37, "5", !allThree));
    }
  }

  // 37.6 Dhana yoga from the Moon
  {
    const bens = sixFromMoon.filter((p) => deps.benefic(p, positions) && [3, 6, 10, 11].includes(fromMoon(p)));
    if (bens.length >= 2) {
      push("pa-lunar-dhana", "Wealth from benefics in upachaya from the Moon", `${list(bens.map((p) => `${p.planet} in the ${ord(fromMoon(p))}`))} from the Moon, ${bens.length === 3 ? "all three benefics" : "two benefics"} in upachaya houses. Parashara gives ${bens.length === 3 ? "great affluence" : "a middling measure of wealth"}.`, "support", ["Moon", ...bens.map((p) => p.planet)], S(37, "6"));
    }
  }

  // 37.7-13 Sunapha, Anapha, Duradhara, Kemadruma
  {
    const second = sixFromMoon.filter((p) => fromMoon(p) === 2).map((p) => p.planet);
    const twelfth = sixFromMoon.filter((p) => fromMoon(p) === 12).map((p) => p.planet);
    const withMoon = sixFromMoon.filter((p) => fromMoon(p) === 1).map((p) => p.planet);
    if (second.length && twelfth.length) {
      push("pa-lunar-duradhara", "Duradhara yoga", `${list(second)} in the 2nd from the Moon and ${list(twelfth)} in the 12th. Parashara gives pleasures, charity, wealth, conveyances and a good retinue.`, "support", ["Moon", ...second, ...twelfth], S(37, "7-10"));
    } else if (second.length) {
      push("pa-lunar-sunapha", "Sunapha yoga", `${list(second)} in the 2nd from the Moon. Parashara gives kingly standing or its equal, intelligence, fame and self-earned wealth.`, "support", ["Moon", ...second], S(37, "7-10"));
    } else if (twelfth.length) {
      push("pa-lunar-anapha", "Anapha yoga", `${list(twelfth)} in the 12th from the Moon. Parashara gives kingly standing, freedom from disease, virtue, fame, charm and happiness.`, "support", ["Moon", ...twelfth], S(37, "7-10"));
    } else if (!withMoon.length && !sixFromMoon.some((p) => KENDRA.includes(h7(p)))) {
      push("pa-lunar-kemadruma", "Kemadruma yoga", "Apart from the Sun, no planet is with the Moon, in the 2nd or 12th from it, or in an angle from the lagna. Parashara reads reproach, want of learning and penury; shown as written and to be weighed against the yogas above.", "strain", ["Moon"], S(37, "11-13"));
    }
  }

  // ---- Chapter 38: solar yogas ----
  {
    const five = SEVEN.filter((pl) => pl !== "Sun" && pl !== "Moon").map(pos);
    const fromSun = (p: PlanetPosition) => houseFrom(sun.signIndex, p.signIndex);
    const second = five.filter((p) => fromSun(p) === 2);
    const twelfth = five.filter((p) => fromSun(p) === 12);
    const toneOf = (ps: PlanetPosition[]): ParashariFinding["tone"] => (ps.every((p) => deps.benefic(p, positions)) ? "support" : ps.every((p) => !deps.benefic(p, positions)) ? "strain" : "mixed");
    const qual = (ps: PlanetPosition[]) => (toneOf(ps) === "support" ? "" : toneOf(ps) === "strain" ? " Formed by malefics, so 38.4 gives the contrary effects." : " Formed by a mix of benefics and malefics; 38.4 gives the stated effects for the benefics and their contrary for the malefics.");
    const names = (ps: PlanetPosition[]) => list(ps.map((p) => p.planet));
    if (second.length && twelfth.length) {
      const both = [...second, ...twelfth];
      push("pa-solar-ubhayachari", "Ubhayachari yoga", `${names(second)} in the 2nd from the Sun and ${names(twelfth)} in the 12th. Parashara gives kingly standing or its equal, and happiness.${qual(both)}`, toneOf(both), ["Sun", ...both.map((p) => p.planet)], S(38, "1-4"));
    } else if (second.length) {
      push("pa-solar-vesi", "Vesi yoga", `${names(second)} in the 2nd from the Sun. Parashara gives even sight, truthfulness, a tall frame, indolence, happiness and modest wealth.${qual(second)}`, toneOf(second), ["Sun", ...second.map((p) => p.planet)], S(38, "1-4"));
    } else if (twelfth.length) {
      push("pa-solar-vosi", "Vosi yoga", `${names(twelfth)} in the 12th from the Sun. Parashara gives skill, charity, fame, learning and strength.${qual(twelfth)}`, toneOf(twelfth), ["Sun", ...twelfth.map((p) => p.planet)], S(38, "1-4"));
    }
  }

  return F;
}
