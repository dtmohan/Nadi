// Effects for rasi dasas applied to the Kalachakra periods: BPHS ch. 50 (effects of the Chara and other
// rasi dasas, http://jyotishvidya.com/ch50.htm), ch. 51.12 (the Kalachakra antar-dasa span), ch. 64
// (antar dasas in the Kalachakra by the lord of the sub-period sign, http://jyotishvidya.com/ch64.htm)
// and ch. 65 (dasas of rasis in the several amsas, http://jyotishvidya.com/ch65.htm), which parallels
// 49.6-34 and is shown where it departs from it. R. Santhanam's translation as posted there.
import { SIGNS, SIGN_LORD, FRIENDS, ENEMIES, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";

const CH50 = BPHS_URL(50);
const CH64 = BPHS_URL(64);
export const KC_CH50 = CH50;
export const KC_CH64 = CH64;
export const KC_CH65 = BPHS_URL(65);

export interface RasiReading {
  label: string;
  text: string;
  source: { label: string; url: string; provisional?: boolean };
  tone: "support" | "strain" | "mixed";
}

/**
 * Ch. 65 where it departs materially from 49.6-34, keyed by dasa sign then sub-period step. Entries of
 * the same sense in other words are not repeated. Gemini's seventh sub-period, missing in 49.11-12, is
 * supplied from 65.6-8.
 */
export const VARIANT_65: Record<number, Record<number, string>> = {
  0: { 5: "happiness from the spouse (65.1-3)" },
  1: { 8: "danger from poison (65.4-5)" },
  2: { 5: "progress in education (65.6-8)", 6: "assaults from enemies (65.6-8)", 7: "quarrels (65.6-8)" },
  3: { 0: "enjoyments (65.9-10)", 6: "public disgrace (65.9-10)", 7: "loss in business (65.9-10)" },
  4: { 4: "happiness and sorrow both (65.11-13)", 7: "distress (65.11-13)" },
  6: { 2: "happiness from brothers and uncles (65.16-18)", 5: "gain of property and happiness (65.16-18)" },
  7: { 0: "loss of wealth (65.19-20)", 4: "distress from disorders of the blood (65.19-20)", 5: "happiness (65.19-20)", 7: "loss of wealth (65.19-20)" },
  9: { 3: "danger from animals (65.24-25)", 7: "danger from enemies (65.24-25)", 8: "danger from poison (65.24-25)" },
  10: { 5: "growth of knowledge and learning (65.26-28)" },
  11: { 5: "growth of knowledge and wealth (65.29-31)" },
};
export const VERSES_65: Record<number, string> = { 0: "1-3", 1: "4-5", 2: "6-8", 3: "9-10", 4: "11-13", 5: "14-15", 6: "16-18", 7: "19-20", 8: "21-23", 9: "24-25", 10: "26-28", 11: "29-31" };

/** Ch. 64.2-55: antar dasa of the sign owned by each planet within the dasa of each sign (Savya). */
const LORD_EFFECT_64: Record<number, Partial<Record<Planet, string>>> = {
  0: { Mars: "wounds and fever", Mercury: "happiness of every kind", Venus: "happiness of every kind", Moon: "happiness of every kind", Jupiter: "happiness of every kind", Sun: "danger from an enemy" },
  1: { Saturn: "quarrels and disease", Jupiter: "gains in learning and bodily ease", Mars: "going away from home, distress from fevers, danger to life shown as written", Venus: "clothes and happy company", Mercury: "clothes and happy company", Sun: "danger from those in power and from animals" },
  2: { Venus: "gain of wealth and clothes", Mars: "loss of parents, danger, fever, wounds, distant travel", Jupiter: "growth of intelligence, success in learning, prosperity and popularity", Saturn: "foreign journeys, disease, fear, loss of wealth and kin", Mercury: "success in learning, clothes, happiness from spouse and children, respect" },
  3: { Moon: "happiness from spouse and children, wealth, public respect", Sun: "danger from enemies, animals and the ruling family, anxiety, fear of disease", Mercury: "happiness from spouse, children and friends, wealth, name and fame", Venus: "happiness from spouse, children and friends, wealth, name and fame", Mars: "danger from poison, weapons and fevers", Jupiter: "wealth, bodily ease, honours from those in power", Saturn: "rheumatic trouble, danger from snakes and scorpions, distress" },
  4: { Mars: "disease of the mouth, bilious fever, danger from weapons", Mercury: "clothes, happiness from spouse and children", Venus: "clothes, happiness from spouse and children", Moon: "danger of a fall, meagre gains, foreign journeys", Sun: "danger from enemies, fevers, loss of judgement, fear", Jupiter: "wealth and grain, favour of those in power and the learned, progress in education" },
  5: { Saturn: "many troubles, distant travel, fevers, want", Jupiter: "wealth through the favour of those in power, arrival of friends and kin, success in learning", Mars: "bilious fever, distant travel, danger from fire and weapons", Mercury: "wealth through children and employees, many enjoyments", Venus: "wealth through children and employees, many enjoyments", Moon: "wealth through children and employees, many enjoyments", Sun: "travel to distant lands, disease, quarrels with kin, danger from weapons" },
  6: { Venus: "wisdom, comforts, happiness from spouse, children, wealth and clothes", Mars: "distress to the father, enmity with friends, disease of the forehead, fever, poison, weapons", Jupiter: "wealth, authority, religious rites, honours and happiness all round", Saturn: "distant travel, grave disease, agricultural loss, danger from enemies", Mercury: "birth of a son, wealth, happiness from the spouse, dawn of fortune" },
  7: { Moon: "wealth and grain in many ways, freedom from disease, enjoyments", Mercury: "wealth and grain in many ways, freedom from disease, enjoyments", Venus: "wealth and grain in many ways, freedom from disease, enjoyments", Sun: "danger from enemies, loss of wealth, distress to the father, danger from wild animals", Mars: "wind and bile troubles, wounds, danger from fire and weapons", Jupiter: "wealth, grain and gems, devotion, favour of those in power", Saturn: "loss of wealth, separation from kin, anxiety, enemies, disease" },
  8: { Mars: "heartburn, fevers, colds, disease of the mouth, many troubles", Venus: "growth of wealth, property and fortune, progress in learning, defeat of enemies, favour of those in power", Mercury: "growth of wealth, property and fortune, progress in learning, defeat of enemies, favour of those in power", Moon: "growth of wealth, property and fortune, progress in learning, defeat of enemies, favour of those in power", Sun: "loss of spouse and wealth, quarrels, danger from those in power, distant travel", Jupiter: "charity, austerity, honours, growth of piety, happiness from the spouse, wealth" },
  9: { Saturn: "displeasure of the learned, of the gods and of those in power, loss of kin, leaving the homeland", Venus: "devotion, austerity, honours from the state", Mercury: "devotion, austerity, honours from the state", Moon: "devotion, austerity, honours from the state", Jupiter: "devotion, austerity, honours from the state", Mars: "disease of the forehead, injury to hands and feet, dysentery, blood and bile troubles" },
  10: { Venus: "learning of many kinds, property, happiness from spouse and children, health, wealth", Mars: "fevers, danger from fire and enemies, anxiety", Saturn: "wind, bile and phlegm troubles, quarrels, foreign journey, wasting disease", Jupiter: "freedom from ill health, happiness, honours and joy", Mercury: "happiness from spouse, children and wealth, joy, good fortune" },
  11: { Moon: "wisdom and learning, happiness from the spouse, freedom from disease, friends and joy", Sun: "quarrels with kin, danger from thieves, anxiety, loss of position", Mercury: "victory in conflict, birth of a son, land and cattle, wealth", Venus: "victory in conflict, birth of a son, land and cattle, wealth", Mars: "bile troubles, dissension in the family, danger from enemies", Jupiter: "wealth and grain, happiness from the spouse, honours, name and fame", Saturn: "loss of wealth, anxiety, leaving the homeland through bad company" },
};
const VERSES_64: Record<number, string> = { 0: "2", 1: "3-5", 2: "6-10", 3: "11-16", 4: "17-21", 5: "22-26", 6: "27-31", 7: "32-33", 8: "34-40", 9: "41-44", 10: "45-49", 11: "50-55" };

export interface LordEffect {
  lord: Planet;
  /** 64.2-55 text for the Savya chakra, if given. */
  text?: string;
  verses: string;
  /** 64.56-58: friend or enemy of the dasa lord (natural relations). */
  relation: "friend" | "enemy" | "neutral" | "same";
}

/** Effect of a Kalachakra sub-period by the lord of its sign, ch. 64. */
export function lordEffect64(dasaSign: number, subSign: number): LordEffect {
  const lord = SIGN_LORD[subSign];
  const dl = SIGN_LORD[dasaSign];
  const relation = lord === dl ? "same" : FRIENDS[dl].includes(lord) ? "friend" : ENEMIES[dl].includes(lord) ? "enemy" : "neutral";
  return { lord, text: LORD_EFFECT_64[dasaSign]?.[lord], verses: VERSES_64[dasaSign], relation };
}

/** BPHS ch. 4: Sirshodaya signs rise by the head, Prishthodaya by the hind part, Pisces by both. */
const RISING: Record<number, "head" | "hind" | "both"> = { 0: "hind", 1: "hind", 2: "head", 3: "hind", 4: "head", 5: "head", 6: "head", 7: "head", 8: "head", 9: "hind", 10: "head", 11: "both" };

export interface RasiDasaDeps {
  positions: PlanetPosition[];
  lagnaIdx: number;
  benefic: (p: PlanetPosition) => boolean;
  /** Shadbala effect for the sign lord, 50.1-3, when computed. */
  strength?: (p: Planet) => "full" | "half" | "quarter" | undefined;
  /** Moon in the bright half, for 50.70. */
  brightMoon?: boolean;
}

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const names = (ps: PlanetPosition[]) => ps.map((p) => p.planet).join(", ");
const vb = (ps: PlanetPosition[], one: string, many: string) => (ps.length === 1 ? one : many);
const FULL_ASPECT: Partial<Record<Planet, number[]>> = { Sun: [7], Moon: [7], Mercury: [7], Venus: [7], Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };

/** Ch. 50 read on one Kalachakra dasa sign. */
export function rasiDasaReadings(D: number, deps: RasiDasaDeps): RasiReading[] {
  const { positions, lagnaIdx, benefic } = deps;
  const out: RasiReading[] = [];
  const S = (verse: string, provisional?: boolean) => ({ label: `Parashara 50.${verse}`, url: CH50, provisional });
  const inH = (h: number) => positions.filter((p) => houseFrom(D, p.signIndex) === h);
  const occ = inH(1);
  const isMal = (p: PlanetPosition) => !benefic(p);
  const mal = (ps: PlanetPosition[]) => ps.filter(isMal);
  const ben = (ps: PlanetPosition[]) => ps.filter((p) => !isMal(p));
  const lord = SIGN_LORD[D];
  const lordPos = positions.find((p) => p.planet === lord)!;
  const lordBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(lord);
  const lordOf = (h: number) => SIGN_LORD[(lagnaIdx + h - 1) % 12];
  const exalted = (p: PlanetPosition) => p.dignity === "Exalted";
  const fallen = (p: PlanetPosition) => p.dignity === "Debilitated";
  const movable = D % 3 === 0;
  const good: string[] = [];
  const bad: string[] = [];

  // 50.1-3 strength of the lord.
  const st = deps.strength?.(lord);
  if (st) out.push({ label: "Strength of the lord", text: `${lord}, lord of ${SIGNS[D]}, has ${st === "full" ? "full" : st === "half" ? "middling" : "little"} Shadbala, so the text expects the sign's results ${st === "full" ? "in full" : st === "half" ? "in moderate measure" : "only in small measure"}.`, source: S("1-3"), tone: st === "full" ? "support" : st === "half" ? "mixed" : "strain" });

  // 50.4-10 planets around the sign and the owner-occupant pairing.
  const m589 = [...mal(inH(5)), ...mal(inH(8)), ...mal(inH(9))];
  if (m589.length) bad.push(`${names(m589)} malefic in the 5th, 8th or 9th from ${SIGNS[D]} ${vb(m589, "makes", "make")} the dasa distressful (50.4)`);
  const m36 = [...mal(inH(3)), ...mal(inH(6))];
  if (m36.length) good.push(`${names(m36)} malefic in the 3rd or 6th from the sign ${vb(m36, "gives", "give")} victory over enemies and happiness (50.4-5)`);
  const b36 = [...ben(inH(3)), ...ben(inH(6))];
  if (b36.length) bad.push(`${names(b36)} benefic in the 3rd or 6th from the sign ${vb(b36, "gives", "give")} defeat (50.5)`);
  if (inH(11).length) good.push(`${names(inH(11))} in the 11th from the sign ${vb(inH(11), "gives", "give")} conquests and happiness (50.6)`);
  const bIn = ben(occ), mIn = mal(occ);
  let pairTone: "support" | "strain" | "mixed" | undefined;
  if (lordBenefic && mIn.length && !bIn.length) { bad.push(`a benefic-owned sign occupied by ${names(mIn)}: favourable in the first part of the dasa, adverse in the latter (50.7)`); pairTone = "mixed"; }
  else if (!lordBenefic && bIn.length && !mIn.length) { good.push(`a malefic-owned sign occupied by ${names(bIn)}: favourable first, adverse later (50.8)`); pairTone = "mixed"; }
  else if (!lordBenefic && mIn.length && !bIn.length) { bad.push(`a malefic-owned sign occupied by ${names(mIn)} always yields unfavourable results (50.8)`); pairTone = "strain"; }
  else if (lordBenefic && bIn.length && !mIn.length) { good.push(`a benefic-owned sign occupied by ${names(bIn)}: the reverse, favourable throughout (50.9)`); pairTone = "support"; }
  else if (lordBenefic && bIn.length && mIn.length) { bad.push(`a benefic-owned sign holding both kinds (${names(occ)}): adverse first, favourable in the latter part (50.10)`); pairTone = "mixed"; }
  else if (lordBenefic && !occ.length) good.push(`owned by ${lord}, a benefic: beneficial effects (50.6)`);
  // 50.18 benefic in the sign and in the sign before it.
  if (bIn.length && ben(inH(12)).length) good.push(`${names(bIn)} in the sign with ${names(ben(inH(12)))} benefic in the sign before it: favourable (50.18)`);

  // 50.20-21 badhaka for movable signs; 50.23 Rahu in badhaka, 12th, 6th, 8th.
  if (movable) {
    const badhaka = mal(inH(11));
    const withLord = mal(positions.filter((p) => p.signIndex === lordPos.signIndex && p.planet !== lord));
    if (badhaka.length || withLord.length) bad.push(`${SIGNS[D]} is movable, so its 11th, ${SIGNS[(D + 10) % 12]}, is its Badhaka sign: ${[badhaka.length ? `${names(badhaka)} there` : "", withLord.length ? `${names(withLord)} with the sign's lord ${lord}` : ""].filter(Boolean).join(" and ")} bring great sorrow, confinement and disease (50.20-21)`);
  }
  const rahu = positions.find((p) => p.planet === "Rahu")!;
  const rh = houseFrom(D, rahu.signIndex);
  if ([12, 6, 8].includes(rh) || (movable && rh === 11)) bad.push(`Rahu in the ${ord(rh)} from the sign${movable && rh === 11 ? ", its Badhaka" : ""}: great danger, confinement on a journey, displeasure of those in power and trouble from enemies (50.23)`);

  // 50.22, 50.56-59, 50.66-67, 50.72 occupants.
  const ownLord = occ.find((p) => p.planet === lord);
  const exIn = occ.filter(exalted);
  if (ownLord || exIn.length) good.push(`${[ownLord ? `${lord}, its own lord` : "", exIn.length ? `${names(exIn)} exalted` : ""].filter(Boolean).join(" and ")} in the sign: a favourable dasa with gains (50.22, 50.56)`);
  if (!occ.length) bad.push(`no planet occupies ${SIGNS[D]}, which the text calls adverse (50.22)`);
  const evilOcc = occ.filter((p) => ["Sun", "Mars", "Saturn"].includes(p.planet) || p.planet === lordOf(8) || p.planet === lordOf(12));
  if (evilOcc.length) bad.push(`${names(evilOcc)} occupying the sign (the Sun, Mars, Saturn, or the lords of the 8th and 12th): evil effects, loss through the displeasure of those in power (50.24, 50.59)`);
  if (occ.some((p) => p.planet === "Rahu")) bad.push(`Rahu in the sign: loss through the displeasure of those in power (50.24)`);
  const growth = occ.filter((p) => [1, 4, 5, 9, 10, 11].some((h) => lordOf(h) === p.planet));
  if (growth.length) good.push(`${growth.map((p) => `${p.planet}, lord of the ${[1, 4, 5, 9, 10, 11].filter((h) => lordOf(h) === p.planet).map(ord).join(" and ")}`).join("; ")} in the sign: growth of those houses in proportion to their strength (50.66); with Jupiter, Venus or a trine lord there, well-being, opulence and devotion (50.67), and with the lords of the 1st, 9th or 10th, an exalted planet or benefics, success in all ventures (50.72)`);
  else if (occ.some((p) => ["Jupiter", "Venus"].includes(p.planet))) good.push(`${names(occ.filter((p) => ["Jupiter", "Venus"].includes(p.planet)))} in the sign: well-being, opulence, glory and devotion (50.67), success in ventures (50.72)`);

  // 50.25-28, 50.40-41 trines from the sign.
  const tri = [...inH(5), ...inH(9)];
  const fallenTri = tri.filter(fallen);
  if (fallenTri.length) bad.push(`${names(fallenTri)} debilitated in a trine from the sign: the text speaks of danger to life, shown as written (50.25), and of loss of fortune, wealth and produce with disease (50.40-41)`);
  const exTri = tri.filter(exalted);
  if (exTri.length) good.push(`${names(exTri)} exalted in a trine from the sign: enjoyment, headship of a town, birth of a son, gains, good fortune and advancement (50.26-27)`);
  const jup = positions.find((p) => p.planet === "Jupiter")!;
  const jupAspects = (si: number) => lord !== "Jupiter" && (FULL_ASPECT.Jupiter ?? []).includes(houseFrom(jup.signIndex, si));
  if (["Jupiter", "Venus", "Mercury", "Moon"].includes(SIGN_LORD[lordPos.signIndex]) && jupAspects(lordPos.signIndex)) good.push(`${lord}, the dasa lord, stands in ${SIGNS[lordPos.signIndex]}, a benefic-owned sign, under Jupiter's aspect: gains, well-being and birth of a son (50.28)`);
  const fallenIn = occ.filter(fallen);
  if (fallenIn.length || fallen(lordPos)) bad.push(`${[fallenIn.length ? `${names(fallenIn)} debilitated in the sign` : "", fallen(lordPos) ? `${lord}, its lord, debilitated` : ""].filter(Boolean).join(" and ")}: loss of fortune, wealth and produce, and disease (50.40-41)`);

  // 50.42 nodes in their own stretch of signs.
  const ketu = positions.find((p) => p.planet === "Ketu")!;
  if (rahu.signIndex === D && [10, 11, 0, 1].includes(D)) good.push(`Rahu in ${SIGNS[D]}, within the four signs from Aquarius the text assigns to him: a dasa productive of good (50.42)`);
  if (ketu.signIndex === D && [7, 8, 9, 10].includes(D)) good.push(`Ketu in ${SIGNS[D]}, within the four signs from Scorpio the text assigns to him: a dasa productive of good (50.42)`);

  // 50.60-63.
  const nodesTri = tri.filter((p) => p.planet === "Rahu" || p.planet === "Ketu");
  if (nodesTri.length) bad.push(`${names(nodesTri)} in a trine from the sign: distress to children, life abroad and continual disturbance (50.60)`);
  const bad6 = inH(6).filter((p) => isMal(p) || fallen(p) || p.combust), bad8 = inH(8).filter((p) => isMal(p) || fallen(p) || p.combust);
  if (bad6.length && bad8.length) bad.push(`${names(bad6)} in the 6th and ${names(bad8)} in the 8th from the sign, malefic, debilitated or combust: danger from enemies, from those in power, and disease (50.61)`);
  const bad4 = inH(4).filter((p) => isMal(p) || fallen(p));
  if (bad4.length) {
    const spec = bad4.map((p) => p.planet === "Mars" ? "with Mars, loss of the house through negligence" : p.planet === "Saturn" ? "with Saturn, heart pain and danger from the state" : p.planet === "Rahu" ? "with Rahu, losses all round, poison and thieves" : "").filter(Boolean);
    bad.push(`${names(bad4)} malefic or debilitated in the 4th from the sign: loss of house, land and fields (50.62)${spec.length ? `; ${spec.join("; ")} (50.63)` : ""}`);
  }
  // 50.64-66, 50.68-71.
  if (rh === 10) good.push(`Rahu in the 10th from the sign: pilgrimage to holy places (50.64)`);
  const b91011 = [9, 10, 11].filter((h) => ben(inH(h)).length);
  if (b91011.length) good.push(`benefics in the ${b91011.map(ord).join(", ")} from the sign${b91011.length === 3 ? "" : " (the text names all three of the 9th, 10th and 11th)"}: earnings, religious acts, wealth, renown and success in ventures (50.65)`);
  const b579 = [5, 7, 9].filter((h) => inH(h).some((p) => !isMal(p) || exalted(p)));
  if (b579.length) good.push(`benefic or exalted planets in the ${b579.map(ord).join(", ")} from the sign${b579.length === 3 ? "" : " (the text names all three of the 5th, 7th and 9th)"}: children, happiness from the spouse and recognition from the state (50.66)`);
  const f4 = inH(4);
  const conv = f4.filter((p) => exalted(p) || p.planet === lordOf(5) || p.planet === lordOf(9));
  if (conv.length) good.push(`${names(conv)} exalted or a trine lord in the 4th from the sign: more conveyances and cattle (50.68)`);
  if (f4.some((p) => p.planet === "Moon")) good.push(`the Moon in the 4th from the sign gives grain and provisions${deps.brightMoon ? ", and a bright Moon treasure and jewels" : ""} (50.69-70)`);
  if (f4.some((p) => p.planet === "Venus")) good.push(`Venus in the 4th from the sign: enjoyment of music and the arts (50.70)`);
  if (f4.some((p) => p.planet === "Jupiter")) good.push(`Jupiter in the 4th from the sign: a fine conveyance (50.71)`);

  const partial = (b91011.length && b91011.length < 3) || (b579.length && b579.length < 3);
  if (good.length) out.push({ label: "Favourable marks", text: good.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(". ") + ".", source: S("4-72", !!partial), tone: "support" });
  if (bad.length) out.push({ label: "Adverse marks", text: bad.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(". ") + ".", source: S("4-63"), tone: pairTone === "mixed" && bad.length === 1 ? "mixed" : "strain" });

  // 50.88 when in the dasa the results come, by how the sign rises.
  const r = RISING[D];
  out.push({ label: "When within the dasa", text: `${SIGNS[D]} rises ${r === "head" ? "by the head (Sirshodaya)" : r === "hind" ? "by the hind part (Prishthodaya)" : "by both (Ubhayodaya)"} in Parashara's description of the signs (ch. 4), so by 50.88 its results come ${r === "head" ? "early in the dasa" : r === "hind" ? "towards its end" : "in its middle"}. The verse speaks of planets in such signs; applying it to the dasa sign itself is a reading${D === 7 ? ", and Scorpio's rising is inferred from its day strength, the translation not stating it" : D === 8 ? "; the translation gives Sagittarius as rising by the head, against the usual lists" : ""}.`, source: S("88", true), tone: "mixed" });
  return out;
}

export const RASI_DASA_CAVEATS: string[] = [
  "Ch. 50, Parashara's rules for the dasas of signs (the Chara and the other rasi dasas), is read here on each Kalachakra dasa sign: planets counted from the dasa sign (50.4-10, 23-28, 40-41, 60-71), the owner-occupant pairing (50.6-10), the Badhaka of a movable sign as its 11th (50.20-21; the text gives no Badhaka for fixed or dual signs, so none is applied), the sign lord's Shadbala for the measure of results (50.1-3) and the rising type for timing (50.88, provisional). The transit rules of 50.11-17, the graha-dasa rules of 50.29-39 and 50.73-87, and the sign antar-dasas of 50.90-96, which begin from the dasa lord's sign and belong to the Chara type, are not applied to the Kalachakra; its sub-periods follow 51.12, each sign's share of the dasa in proportion to its years.",
  "Sub-period readings pair 49.6-34 with ch. 65, which repeats the same table with some departures; the second reading is shown where the two differ in sense. Ch. 64 adds the effect by the lord of the sub-period sign, stated for the Savya chakra (64.2-55); for Apsavya births 64.56-58 says to judge by the lord's nature and its friendship with the dasa lord, which is shown as the natural relation of the two. Capricorn's list in 64.41-44 gives Saturn twice and no Sun; the first Saturn line is kept and the Sun is left ungiven.",
];
