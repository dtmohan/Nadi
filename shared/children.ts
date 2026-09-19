import { SIGNS, houseFrom, relationOf, type Planet, type PlanetPosition, type Relation, type Sign, type TransitPeriod } from "./astro";
import type { Gender } from "./marriage";

/**
 * Children, the Nadi way. No 5th lord and no D7: progeny is read from Jupiter, the
 * putra karaka, in both male and female charts.
 *
 *  - Promise: the Jupiter–Venus link (same sign, trine, 7th, then the 3/11 and 2/12 axes).
 *  - Count and sex: the planets in the 5th from Jupiter, and those aspecting it (trines and
 *    7th); male planets denote sons, female planets daughters; Mercury and Saturn follow the
 *    parity of their sign.
 *  - Obstruction: Saturn delays, Rahu brings the unusual or medical route, Ketu the loss or
 *    anxiety, a watery 5th from Jupiter troubles conception.
 *  - Timing: Jupiter's return over natal Jupiter, and his passage over the 5th from Jupiter
 *    or its trines.
 */

export interface ChildrenReading {
  gender: Gender;
  karaka: Planet;
  karakaSign: Sign;
  /** Sign of the 5th from Jupiter and the planets standing in it. */
  fifthSign: Sign;
  inFifth: Planet[];
  /** Planets aspecting the 5th from Jupiter (its trines and 7th), excluding Jupiter. */
  aspectingFifth: Planet[];
  sons: number;
  daughters: number;
  /** Planets counted whose sex depends on sign parity or is left open (nodes). */
  undecided: Planet[];
  /** House of Venus from Jupiter. */
  venusHouse: number;
  promised: "strong" | "moderate" | "weak" | "faint" | "unsigned";
  headline: string;
  notes: string[];
  /** Natal signs whose Jupiter passages bring children: Jupiter's own sign, the 5th from it, and their trines. */
  triggerSigns: Sign[];
}

const MALE: Planet[] = ["Sun", "Mars", "Jupiter"];
const FEMALE: Planet[] = ["Venus", "Moon"];
const NEUTER: Planet[] = ["Mercury", "Saturn"];

function rel(a: PlanetPosition, b: PlanetPosition): Relation {
  return relationOf(a.signIndex, b.signIndex);
}
function close(a: PlanetPosition, b: PlanetPosition): boolean {
  const r = rel(a, b);
  return r === "conjunct" || r === "trine";
}
function houseWord(h: number): string {
  return ["", "same sign", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][h];
}
function list(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export function assessChildren(positions: PlanetPosition[], gender: Gender): ChildrenReading {
  const by = Object.fromEntries(positions.map((p) => [p.planet, p])) as Record<Planet, PlanetPosition>;
  const ju = by.Jupiter;
  const ve = by.Venus;
  const sa = by.Saturn;
  const female = gender === "female";
  const notes: string[] = [];

  // Promise from the Jupiter–Venus link.
  const venusHouse = houseFrom(ju.signIndex, ve.signIndex);
  let promised: ChildrenReading["promised"];
  let headline: string;
  const pair = `Venus stands ${venusHouse === 1 ? "in the same sign as" : `in the ${houseWord(venusHouse)} from`} Jupiter, the putra karaka`;
  if (venusHouse === 1) {
    promised = "strong";
    headline = `${pair}: children are strongly promised, usually more than one, and come without much delay.`;
  } else if (venusHouse === 5 || venusHouse === 9) {
    promised = "strong";
    headline = `${pair}: same direction, three-quarter strength; children are promised in good time.`;
  } else if (venusHouse === 7) {
    promised = "moderate";
    headline = `${pair}: mutual aspect at half strength; children are promised, the rest depends on the companions of Jupiter.`;
  } else if (venusHouse === 3 || venusHouse === 11) {
    promised = "weak";
    headline = `${pair}: a supporting axis; children come later or with effort, the signature is not prominent.`;
  } else if (venusHouse === 2 || venusHouse === 12) {
    promised = "faint";
    headline = `${pair}: a faint signature; children often delayed or fewer than hoped, and wanted with focus.`;
  } else {
    promised = "unsigned";
    headline = `${pair}, an axis with no progeny signature; children are read from the 5th from Jupiter and his companions alone.`;
  }

  // The 5th from Jupiter: count and sex.
  const fifthIdx = (ju.signIndex + 4) % 12;
  const inFifth = positions.filter((p) => p.signIndex === fifthIdx).map((p) => p.planet);
  const aspectingFifth = positions
    .filter((p) => p.planet !== "Jupiter" && p.signIndex !== fifthIdx && [5, 7, 9].includes(houseFrom(fifthIdx, p.signIndex)))
    .map((p) => p.planet);
  let sons = 0;
  let daughters = 0;
  const undecided: Planet[] = [];
  for (const pl of [...inFifth, ...aspectingFifth]) {
    if (MALE.includes(pl)) sons++;
    else if (FEMALE.includes(pl)) daughters++;
    else if (NEUTER.includes(pl)) {
      // Odd signs are male, even signs female (Sakurkar).
      if (by[pl].signIndex % 2 === 0) sons++;
      else daughters++;
      undecided.push(pl);
    } else undecided.push(pl); // nodes: left open
  }
  const fifthSign = SIGNS[fifthIdx];
  if (inFifth.length) {
    notes.push(
      `${list(inFifth)} in ${fifthSign}, the 5th from Jupiter${aspectingFifth.length ? `, with ${list(aspectingFifth)} aspecting it` : ""}: the count of children is read from these planets, male planets for sons, female planets for daughters.`,
    );
  } else if (aspectingFifth.length) {
    notes.push(`The 5th from Jupiter (${fifthSign}) is empty, but ${list(aspectingFifth)} aspect it: children are read from the aspecting planets, fewer than a tenanted 5th would give.`);
  } else {
    notes.push(`The 5th from Jupiter (${fifthSign}) is empty and unaspected: the count is not fixed by the chart; children come through Jupiter's own companions and transits.`);
  }
  if ([3, 7, 11].includes(fifthIdx)) notes.push(`${fifthSign}, the 5th from Jupiter, is a watery sign: trouble or delay in getting children; care in pregnancy.`);

  // Companions of Jupiter and Venus.
  const nodesOnJu = (["Rahu", "Ketu"] as Planet[]).filter((n) => close(by[n], ju));
  if (close(sa, ju)) notes.push(`Saturn ${rel(sa, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: a later first child and fewer children overall; delay rather than denial.`);
  if (close(by.Rahu, ju)) notes.push(`Rahu ${rel(by.Rahu, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: an unusual route to children, after a long wait, through medical help or far from home.`);
  if (close(by.Ketu, ju)) notes.push(`Ketu ${rel(by.Ketu, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: anxiety around the first child; the classical texts read loss, the modern lineage a delay and a spiritually inclined child.`);
  if (close(by.Ketu, ve)) notes.push("Ketu with or in trine to Venus: setbacks or delay in progeny.");
  if (close(sa, ve) && !close(sa, ju)) notes.push("Saturn with or in trine to Venus: delay in begetting a child.");
  if (close(by.Rahu, by.Sun)) notes.push("Rahu with or in trine to the Sun: difficulty for a male child, or a son of delicate health.");
  if (close(ju, by.Sun)) notes.push("Jupiter with or in trine to the Sun: a son is indicated.");
  if (close(ju, ve) && !close(by.Ketu, ve)) notes.push("Jupiter with or in trine to Venus: a daughter is indicated.");
  if (close(ju, by.Sun) && close(ju, by.Mars)) notes.push("Sun, Mars and Jupiter combined: Rao reads at least two male children.");
  if (close(by.Moon, ju)) notes.push(`Moon with or in trine to Jupiter: ${female ? "motherhood is a source of joy; conception is easy" : "the wife conceives easily; children bring joy to the home"}.`);
  if (nodesOnJu.length && close(sa, ju) && !close(ve, ju)) {
    notes.push(`Jupiter, Saturn and ${list(nodesOnJu)} together without Venus: the heaviest progeny signature; adoption or a very late child is read.`);
  }

  const triggerSigns = Array.from(new Set([ju.signIndex, (ju.signIndex + 4) % 12, (ju.signIndex + 8) % 12])).map((i) => SIGNS[i]);

  return {
    gender,
    karaka: "Jupiter",
    karakaSign: SIGNS[ju.signIndex],
    fifthSign,
    inFifth,
    aspectingFifth,
    sons,
    daughters,
    undecided,
    venusHouse,
    promised,
    headline,
    notes,
    triggerSigns,
  };
}

/** Next Jupiter passage that brings children: over natal Jupiter (the classic window), or over the 5th from Jupiter or its trines, after the given age. */
export function nextChildWindow(
  c: ChildrenReading,
  transits: TransitPeriod[],
  fromIso: string,
  birthIso: string,
  minAge = 18,
): { period: TransitPeriod; kind: "return" | "fifth" | "trine" } | null {
  const birth = Date.parse(birthIso);
  const upcoming = transits
    .filter((t) => t.planet === "Jupiter" && t.end >= fromIso && c.triggerSigns.includes(t.sign))
    .filter((t) => (Date.parse(t.end) - birth) / (365.25 * 86400e3) >= minAge)
    .sort((a, b) => a.start.localeCompare(b.start));
  const first = upcoming[0];
  if (!first) return null;
  return { period: first, kind: first.sign === c.karakaSign ? "return" : first.sign === c.fifthSign ? "fifth" : "trine" };
}
