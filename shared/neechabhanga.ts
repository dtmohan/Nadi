/**
 * Neechabhanga: cancellation of a planet's debilitation, for the Parashari reading.
 *
 * Canonical conditions are paraphrased from Mantreswara's Phaladeepika ch. 7 (Maharajayogas), in the
 * V. Subrahmanya Sastri translation (1950) published at wisdomlib.org:
 *   7.26 / 7.29-30  the lord of the debilitation sign, or the lord of the planet's exaltation sign, in a
 *                   kendra from the lagna or the Moon;
 *   7.27            those two lords in mutual kendras;
 *   7.28            the debilitated planet aspected by the lord of the sign it occupies, the more so when
 *                   the planet is not in the 6th, 8th or 12th.
 * Parashara's dasa and yoga verses (BPHS) do not state these cancellations, so the reading shows them as a
 * separate note and softens, never deletes, the strain verses they touch.
 *
 * Later-practice conditions found in modern compilations but not in the verses above are computed and
 * labelled provisional: exchange of signs with the dispositor; a planet exalted in the debilitation sign
 * standing in a kendra (Sastri's note 3 on 7.26 records this as a variant reading of the verse); the
 * debilitated planet itself in a kendra from the lagna or the Moon; the debilitated planet exalted in the
 * navamsa; the dispositor in the same sign.
 */
import { EXALTATION, SIGN_LORD, SIGNS, houseFrom, type Planet, type PlanetPosition } from "./astro";

export const PHALADEEPIKA_CH7_URL = "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621579.html";

export interface BhangaCondition {
  id: string;
  met: boolean;
  text: string;
  source: string;
  provisional?: boolean;
}

export interface NeechaBhanga {
  planet: Planet;
  sign: string;
  dispositor: Planet;
  exaltationLord: Planet;
  house: number;
  conditions: BhangaCondition[];
  /** True when at least one Phaladeepika condition is met. */
  cancelled: boolean;
  /** True when only later-practice conditions are met. */
  provisionalOnly: boolean;
  /** 7.28: in the 6th, 8th or 12th the cancellation is weaker. */
  inDusthana: boolean;
}

const KENDRA = [1, 4, 7, 10];

export function neechaBhanga(
  planet: Planet,
  positions: PlanetPosition[],
  lagnaIdx: number,
  aspect: (from: Planet, fromSign: number, toSign: number) => number,
): NeechaBhanga | null {
  const p = positions.find((x) => x.planet === planet);
  const ex = EXALTATION[planet];
  if (!p || !ex || p.dignity !== "Debilitated") return null;
  const pos = (pl: Planet) => positions.find((x) => x.planet === pl)!;
  const moonIdx = pos("Moon").signIndex;
  const dispositor = SIGN_LORD[p.signIndex];
  const exaltationLord = SIGN_LORD[ex.sign];
  const kendraFrom = (pl: Planet, from: number) => KENDRA.includes(houseFrom(from, pos(pl).signIndex));
  const kendraLagna = (pl: Planet) => kendraFrom(pl, lagnaIdx);
  const kendraMoon = (pl: Planet) => pl !== "Moon" && kendraFrom(pl, moonIdx);
  const house = houseFrom(lagnaIdx, p.signIndex);
  const inDusthana = [6, 8, 12].includes(house);
  const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

  const conditions: BhangaCondition[] = [];
  const add = (id: string, met: boolean, text: string, source: string, provisional?: boolean) => conditions.push({ id, met, text, source, provisional });

  const dL = kendraLagna(dispositor), dM = kendraMoon(dispositor);
  add("dispositor-kendra", dL || dM, `${dispositor}, lord of ${SIGNS[p.signIndex]}, ${dL || dM ? `is in the ${ord(houseFrom(dL ? lagnaIdx : moonIdx, pos(dispositor).signIndex))} from the ${dL ? "lagna" : "Moon"}, an angle` : "is in no angle from the lagna or the Moon"}`, "Phaladeepika 7.26, 7.29");
  const eL = exaltationLord !== planet && kendraLagna(exaltationLord), eM = exaltationLord !== planet && kendraMoon(exaltationLord);
  add("exaltation-lord-kendra", eL || eM, `${exaltationLord}, lord of ${SIGNS[ex.sign]} where ${planet} is exalted, ${eL || eM ? `is in the ${ord(houseFrom(eL ? lagnaIdx : moonIdx, pos(exaltationLord).signIndex))} from the ${eL ? "lagna" : "Moon"}, an angle` : "is in no angle from the lagna or the Moon"}`, "Phaladeepika 7.26, 7.29");
  const mutual = dispositor !== exaltationLord && KENDRA.includes(houseFrom(pos(dispositor).signIndex, pos(exaltationLord).signIndex));
  add("mutual-kendra", mutual, `${dispositor} and ${exaltationLord} ${mutual ? "stand in mutual angles" : "are not in mutual angles"}`, "Phaladeepika 7.27");
  const q = dispositor !== planet ? aspect(dispositor, pos(dispositor).signIndex, p.signIndex) : 0;
  add("dispositor-aspect", q >= 2, `${dispositor} ${q >= 2 ? `aspects ${planet} (${q === 4 ? "full" : "half or three-quarter"} sign aspect)` : q > 0 ? `casts only a quarter aspect on ${planet}, not counted` : `does not aspect ${planet}`}`, "Phaladeepika 7.28");

  // Later practice, provisional.
  const exchange = dispositor !== planet && SIGN_LORD[pos(dispositor).signIndex] === planet;
  add("exchange", exchange, `${planet} and ${dispositor} ${exchange ? "exchange signs" : "do not exchange signs"}`, "later practice", true);
  const exaltedHere = positions.find((x) => x.planet !== planet && EXALTATION[x.planet]?.sign === p.signIndex);
  const eh = exaltedHere && (kendraLagna(exaltedHere.planet) || kendraMoon(exaltedHere.planet));
  // Sastri's note 3 on 7.26 records a variant reading of taducca-natha as "the planet exalted in that sign"; kept provisional as a commentarial variant.
  add("exalted-in-sign-kendra", Boolean(eh), exaltedHere ? `${exaltedHere.planet}, exalted in ${SIGNS[p.signIndex]}, ${eh ? `is in an angle from the lagna or the Moon${exaltedHere.signIndex === p.signIndex ? `, conjunct ${planet}` : ""}` : "is in no angle from the lagna or the Moon"}` : `no planet is exalted in ${SIGNS[p.signIndex]}`, "Phaladeepika 7.26, variant reading in Sastri's note", true);
  const selfKendra = KENDRA.includes(house) || KENDRA.includes(houseFrom(moonIdx, p.signIndex));
  add("planet-kendra", selfKendra, `${planet} itself ${selfKendra ? `stands in the ${ord(house)} from the lagna and the ${ord(houseFrom(moonIdx, p.signIndex))} from the Moon` : "is in no angle from the lagna or the Moon"}`, "later practice", true);
  const navamsa = (p.signIndex * 9 + Math.floor(p.degInSign / (10 / 3))) % 12;
  const navExalted = navamsa === ex.sign;
  add("navamsa-exalted", navExalted, `${planet} is ${navExalted ? "exalted" : `in ${SIGNS[navamsa]}`} in the navamsa`, "later practice", true);
  const conj = dispositor !== planet && pos(dispositor).signIndex === p.signIndex;
  add("dispositor-conjunct", conj, `${dispositor} ${conj ? "is in the same sign" : "is not in the same sign"}`, "later practice", true);

  const canonical = conditions.some((c) => c.met && !c.provisional);
  const anyMet = conditions.some((c) => c.met);
  return { planet, sign: SIGNS[p.signIndex], dispositor, exaltationLord, house, conditions, cancelled: canonical, provisionalOnly: !canonical && anyMet, inDusthana };
}
