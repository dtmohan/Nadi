import { SIGNS, houseFrom, relationOf, type Planet, type PlanetPosition, type Relation, type Sign, type TransitPeriod } from "./astro";
import type { Gender } from "./marriage";

/**
 * Children, the Nadi way. No 5th lord and no D7: progeny is read from Jupiter, the
 * putra karaka, in both male and female charts.
 *
 *  - Promise: the Jupiter–Venus link (same sign, trine, 7th, then the 3/11 and 2/12 axes).
 *  - Some sources count planets in and aspecting the 5th from Jupiter and assign them sex.
 *    Nadi shows the placements but does not calculate a family-size or sex prediction.
 *  - Timing: Jupiter's return over natal Jupiter, and his passage over the 5th from Jupiter
 *    or its trines, are traditional windows rather than predictions of an event.
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
  /** Planets delivered through a node: held at the same degree (within 1° across the trinal
   *  directions) or standing in its star. These are symbolic associations, not outcomes. */
  takenOver: Array<{ planet: Planet; by: Planet; via: "degree" | "star" }>;
  /** House of Venus from Jupiter. */
  venusHouse: number;
  /** Legacy field name: the strength of one traditional link, not a promise of an outcome. */
  promised: "strong" | "moderate" | "weak" | "faint" | "unsigned";
  headline: string;
  notes: string[];
  /** Natal signs whose Jupiter passages bring children: Jupiter's own sign, the 5th from it, and their trines. */
  triggerSigns: Sign[];
}

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

/**
 * Node takeover, the precedence the lineage reads into combinations: the nodes are the
 * strongest agents, and a planet they hold at the same degree (within 1° across the trinal
 * directions — Rao's "at the same degree" bond) or that stands in their star is delivered
 * through them, not on its own. The degree bond is Rao's; extending it by the star follows
 * the DNA book's star principle, stated there for wealth — provisional for children. The
 * Sources attach further interpretations to these links; this calculation does not turn them
 * into predictions about a child's sex, timing or route to parenthood.
 */
function nodeGrip(
  node: PlanetPosition,
  p: PlanetPosition,
): { by: Planet; via: "degree" | "star" } | null {
  if (p.planet === node.planet) return null;
  if (![1, 5, 9].includes(houseFrom(node.signIndex, p.signIndex))) return null;
  if (Math.abs(node.degInSign - p.degInSign) <= 1) return { by: node.planet, via: "degree" };
  if (p.nakshatraLord === node.planet) return { by: node.planet, via: "star" };
  return null;
}

/**
 * A geometric/star link between Rahu and the Sun, shared by the Jupiter-Sun line and the card.
 */
export function rahuHoldsSun(positions: PlanetPosition[]): { via: "degree" | "star" } | null {
  const ra = positions.find((p) => p.planet === "Rahu");
  const su = positions.find((p) => p.planet === "Sun");
  const g = ra && su ? nodeGrip(ra, su) : null;
  return g ? { via: g.via } : null;
}

export function assessChildren(positions: PlanetPosition[], gender: Gender): ChildrenReading {
  const by = Object.fromEntries(positions.map((p) => [p.planet, p])) as Record<Planet, PlanetPosition>;
  const ju = by.Jupiter;
  const ve = by.Venus;
  const sa = by.Saturn;
  const notes: string[] = [];

  // Promise from the Jupiter–Venus link.
  const venusHouse = houseFrom(ju.signIndex, ve.signIndex);
  let promised: ChildrenReading["promised"];
  let headline: string;
  const pair = `Venus stands ${venusHouse === 1 ? "in the same sign as" : `in the ${houseWord(venusHouse)} from`} Jupiter, the putra karaka`;
  if (venusHouse === 1) {
    promised = "strong";
    headline = `${pair}. This tradition treats the connection as prominent when discussing children; it cannot establish whether or when someone has children.`;
  } else if (venusHouse === 5 || venusHouse === 9) {
    promised = "strong";
    headline = `${pair}. This tradition reads a trinal connection as relevant to children; it cannot establish an individual outcome or timing.`;
  } else if (venusHouse === 7) {
    promised = "moderate";
    headline = `${pair}. This tradition reads the opposition as a connection when discussing children; it cannot establish an individual outcome.`;
  } else if (venusHouse === 3 || venusHouse === 11) {
    promised = "weak";
    headline = `${pair}. This tradition treats the connection as less prominent; no individual timing or outcome follows from it.`;
  } else if (venusHouse === 2 || venusHouse === 12) {
    promised = "faint";
    headline = `${pair}. This tradition treats the connection as less prominent; it cannot establish a delay or number of children.`;
  } else {
    promised = "unsigned";
    headline = `${pair}. This particular Jupiter–Venus rule does not identify a connection; that is not a conclusion about children.`;
  }

  // The 5th from Jupiter: show actual placements without inferring a count or sex.
  const fifthIdx = (ju.signIndex + 4) % 12;
  const inFifth = positions.filter((p) => p.signIndex === fifthIdx).map((p) => p.planet);
  const aspectingFifth = positions
    .filter((p) => p.planet !== "Jupiter" && p.signIndex !== fifthIdx && [5, 7, 9].includes(houseFrom(fifthIdx, p.signIndex)))
    .map((p) => p.planet);
  const takenOver: Array<{ planet: Planet; by: Planet; via: "degree" | "star" }> = [];
  const gripOf = (p: PlanetPosition) => nodeGrip(by.Rahu, p) ?? nodeGrip(by.Ketu, p);
  for (const pl of [...inFifth, ...aspectingFifth]) {
    const g = gripOf(by[pl]);
    if (g) takenOver.push({ planet: pl, by: g.by, via: g.via });
  }
  const fifthSign = SIGNS[fifthIdx];
  if (inFifth.length) {
    notes.push(
      `${list(inFifth)} in ${fifthSign}, the 5th from Jupiter${aspectingFifth.length ? `, with ${list(aspectingFifth)} aspecting it` : ""}. Some traditional readings count these placements, but they cannot determine the number or sex of children.`,
    );
  } else if (aspectingFifth.length) {
    notes.push(`The 5th from Jupiter (${fifthSign}) is empty, but ${list(aspectingFifth)} aspect it. These placements do not determine the number or sex of children.`);
  } else {
    notes.push(`The 5th from Jupiter (${fifthSign}) is empty and unaspected in this sign-based calculation; no conclusion about children follows.`);
  }
  if ([3, 7, 11].includes(fifthIdx)) notes.push(`${fifthSign}, the 5th from Jupiter, is a watery sign. The traditional classification cannot assess fertility or pregnancy.`);
  if (takenOver.length)
    notes.push(
      `${list(takenOver.map((t) => `${t.planet} (linked to ${t.by} at ${t.via === "degree" ? "the same degree" : "its star"})`))}. The star extension is provisional; these links cannot establish timing or a route to parenthood.`,
    );
  if ([...inFifth, ...aspectingFifth].includes("Sun") && gripOf(by.Sun)?.by === "Rahu")
    notes.push(
      "Rahu is linked to the Sun by the traditional node rule; the calculation cannot determine a child's sex.",
    );

  // Companions of Jupiter and Venus.
  const nodesOnJu = (["Rahu", "Ketu"] as Planet[]).filter((n) => close(by[n], ju));
  if (close(sa, ju)) notes.push(`Saturn ${rel(sa, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: some Nadi readers consider this a timing factor; it does not establish a delay.`);
  if (close(by.Rahu, ju)) notes.push(`Rahu ${rel(by.Rahu, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: a traditional family-related link; it cannot determine the circumstances of parenthood.`);
  if (close(by.Ketu, ju)) notes.push(`Ketu ${rel(by.Ketu, ju) === "conjunct" ? "with" : "in trine to"} Jupiter: a traditional family-related link with differing interpretations; no individual outcome is established.`);
  if (close(by.Ketu, ve)) notes.push("Ketu with or in trine to Venus: a traditional family-related link, not evidence of a difficulty.");
  if (close(sa, ve) && !close(sa, ju)) notes.push("Saturn with or in trine to Venus: some Nadi readers consider Saturn a timing factor; it does not establish a delay.");
  if (close(by.Rahu, by.Sun)) notes.push("Rahu with or in trine to the Sun: a traditional link that cannot determine a child's sex or health.");
  if (close(ju, by.Sun)) notes.push(
    gripOf(by.Sun)?.by === "Rahu"
      ? "Jupiter is linked to the Sun, and the node rule also links Rahu to the Sun; it cannot determine a child's sex."
      : "Jupiter with or in trine to the Sun: a traditional children-related link; it cannot determine a child's sex.",
  );
  if (close(ju, ve) && !close(by.Ketu, ve)) {
    const gv = gripOf(ve);
    notes.push(
      `Jupiter with or in trine to Venus${gv ? `, with a ${gv.by} link` : ""}: a traditional family-related indicator, not a prediction of a child's sex or circumstances.`,
    );
  }
  if (close(ju, by.Sun) && close(ju, by.Mars)) notes.push("Sun, Mars and Jupiter are linked by sign; traditional counts from this combination cannot determine the number or sex of children.");
  if (close(by.Moon, ju)) notes.push("Moon with or in trine to Jupiter: a traditional association of children and care, not an assessment of conception.");
  if (nodesOnJu.length && close(sa, ju) && !close(ve, ju)) {
    notes.push(`Jupiter, Saturn and ${list(nodesOnJu)} are linked by sign without Venus: a traditional timing interpretation that cannot determine a delay or route to parenthood.`);
  }

  const triggerSigns = Array.from(new Set([ju.signIndex, (ju.signIndex + 4) % 12, (ju.signIndex + 8) % 12])).map((i) => SIGNS[i]);

  return {
    gender,
    karaka: "Jupiter",
    karakaSign: SIGNS[ju.signIndex],
    fifthSign,
    inFifth,
    aspectingFifth,
    takenOver,
    venusHouse,
    promised,
    headline,
    notes,
    triggerSigns,
  };
}

/** Next traditional Jupiter transit window; not a prediction that a child will be born. */
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

/** The most recent Jupiter passage over the children triggers that has already passed, read from age 18. */
export function lastChildWindow(
  c: ChildrenReading,
  transits: TransitPeriod[],
  fromIso: string,
  birthIso: string,
  minAge = 18,
): { period: TransitPeriod; kind: "return" | "fifth" | "trine" } | null {
  const birth = Date.parse(birthIso);
  const passed = transits
    .filter((t) => t.planet === "Jupiter" && t.end <= fromIso && c.triggerSigns.includes(t.sign))
    .filter((t) => (Date.parse(t.start) - birth) / (365.25 * 86400e3) >= minAge)
    .sort((a, b) => b.start.localeCompare(a.start));
  const first = passed[0];
  if (!first) return null;
  return { period: first, kind: first.sign === c.karakaSign ? "return" : first.sign === c.fifthSign ? "fifth" : "trine" };
}
