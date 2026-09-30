import {
  SIGNS,
  houseFrom,
  relationOf,
  type Planet,
  type PlanetPosition,
  type Relation,
  type Sign,
  type TransitPeriod,
} from "./astro";

/**
 * Marriage, the Nadi way. There are no house lords: marriage is read between karakas.
 *
 * Male chart: Jupiter is the native, Venus the wife. Female chart: Venus is the native as a person (Deha),
 * Mars the husband (Rao; some teachers read Jupiter for the husband, which the app notes).
 * Rao's rule: marriage is promised when the spouse karaka stands in the 1st, 2nd, 3rd, 5th,
 * 7th, 9th, 11th or 12th from the native's karaka, or from Saturn (then it comes by karma,
 * later). The 4th, 6th, 8th and 10th carry no signature; the dispositor's link is then read.
 */

export type Gender = "male" | "female" | "unspecified";

export interface MarriageReading {
  gender: Gender;
  native: Planet;
  spouse: Planet;
  nativeSign: Sign;
  spouseSign: Sign;
  /** House of the spouse karaka counted from the native's karaka. */
  house: number;
  /** House of the spouse karaka counted from Saturn. */
  houseFromSaturn: number;
  promised:
    | "strong"
    | "moderate"
    | "weak"
    | "by-karma"
    | "through-dispositor"
    | "absent";
  headline: string;
  notes: string[];
  /** Natal signs whose Jupiter passages activate marriage: the spouse karaka's sign and its trines. */
  triggerSigns: Sign[];
}

const PROMISING = new Set([1, 2, 3, 5, 7, 9, 11, 12]);

function linked(a: PlanetPosition, b: PlanetPosition): boolean {
  return PROMISING.has(houseFrom(a.signIndex, b.signIndex));
}

function rel(a: PlanetPosition, b: PlanetPosition): Relation {
  return relationOf(a.signIndex, b.signIndex);
}

function close(a: PlanetPosition, b: PlanetPosition): boolean {
  const r = rel(a, b);
  return r === "conjunct" || r === "trine";
}

function touches(a: PlanetPosition, b: PlanetPosition): boolean {
  const r = rel(a, b);
  return r === "conjunct" || r === "trine" || r === "opposite";
}

function houseWord(h: number): string {
  return [
    "",
    "same sign",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th",
    "12th",
  ][h];
}

export function assessMarriage(
  positions: PlanetPosition[],
  gender: Gender,
): MarriageReading {
  const by = Object.fromEntries(positions.map((p) => [p.planet, p])) as Record<
    Planet,
    PlanetPosition
  >;
  const female = gender === "female";
  const native = female ? by.Venus : by.Jupiter;
  const spouse = female ? by.Mars : by.Venus;
  const saturn = by.Saturn;
  const jupiter = by.Jupiter;
  const spouseWord = female ? "husband" : gender === "male" ? "wife" : "spouse";

  const house = houseFrom(native.signIndex, spouse.signIndex);
  const houseFromSaturn = houseFrom(saturn.signIndex, spouse.signIndex);
  const notes: string[] = [];

  let promised: MarriageReading["promised"];
  let headline: string;
  const pair = `${spouse.planet} (${spouseWord}) stands ${house === 1 ? "in the same sign as" : `in the ${houseWord(house)} from`} ${native.planet} (the native)`;
  if (house === 1) {
    promised = "strong";
    headline = `${pair}: the strongest marriage signature, full combination.`;
  } else if (house === 5 || house === 9) {
    promised = "strong";
    headline = `${pair}: same direction, three-quarter strength; marriage is well promised.`;
  } else if (house === 7) {
    promised = "moderate";
    headline = `${pair}: mutual aspect at half strength; marriage is promised, the partner a counterweight.`;
  } else if (house === 3 || house === 11) {
    promised = "weak";
    headline = `${pair}: a supporting axis; marriage is promised at lesser strength, often later or by circumstance.`;
  } else if (house === 2 || house === 12) {
    promised = "weak";
    headline = `${pair}: ${house === 2 ? "the next step in the native's affairs" : "the background the native carries"}; marriage is promised at lesser strength.`;
  } else if (PROMISING.has(houseFromSaturn)) {
    promised = "by-karma";
    headline = `${pair}, a position with no marriage signature, but ${spouse.planet} is linked to Saturn (${houseWord(houseFromSaturn)}): marriage comes by karma, later and through duty.`;
  } else {
    const disp = by[spouse.signLord];
    if (
      disp.planet !== spouse.planet &&
      (linked(native, disp) || linked(saturn, disp))
    ) {
      promised = "through-dispositor";
      headline = `${pair}, with no direct link and none through Saturn; the dispositor ${disp.planet} (lord of ${spouse.sign}) does link to ${linked(native, disp) ? native.planet : "Saturn"}, so marriage is read through it, indirectly.`;
    } else {
      promised = "absent";
      headline = `${pair}, with no link through Saturn or the dispositor either: the structural signature is absent; marriage, if it comes, is read from transits and combinations alone.`;
    }
  }

  // Delay and ease.
  if (close(saturn, spouse) && saturn.planet !== spouse.planet) {
    notes.push(
      `Saturn ${rel(saturn, spouse) === "conjunct" ? "with" : "in trine to"} ${spouse.planet}: the classic delay; marriage tends to come later than the family norm (the delay is sourced; any specific age is provisional).`,
    );
  } else if (rel(saturn, spouse) === "opposite") {
    notes.push(
      `Saturn opposite ${spouse.planet}: delay, or a partner of very different temperament.`,
    );
  }
  if (!female && close(jupiter, by.Venus)) {
    notes.push(
      `Jupiter ${rel(jupiter, by.Venus) === "conjunct" ? "with" : "in trine to"} Venus: timely or early marriage; Jupiter's passages over Venus's sign or its trines bring it.`,
    );
  }
  if (female && close(jupiter, spouse)) {
    notes.push(
      `Jupiter ${rel(jupiter, spouse) === "conjunct" ? "with" : "in trine to"} Mars: the husband's karaka is blessed; timely marriage, a principled husband.`,
    );
  }
  if (female && !close(jupiter, spouse) && close(jupiter, native)) {
    notes.push(
      `Jupiter with or in trine to Venus: in a female chart many teachers read Jupiter itself for the husband, so this too favours marriage.`,
    );
  }

  // Nodes and denial.
  const nodesOnSpouse = (["Rahu", "Ketu"] as Planet[]).filter((n) =>
    close(by[n], spouse),
  );
  const nodesWithSpouse = nodesOnSpouse.filter(
    (n) => rel(by[n], spouse) === "conjunct",
  );
  const saturnClose = close(saturn, spouse);
  const jupiterAspects =
    jupiter.planet !== spouse.planet && touches(jupiter, spouse);
  if (nodesWithSpouse.length && saturnClose) {
    notes.push(
      `${spouse.planet}, Saturn and ${nodesWithSpouse.join(" and ")} in one sign: Nadi reads this as denial or a very late, unconventional marriage${jupiterAspects ? "; Jupiter's aspect softens it to compromise" : ""}.`,
    );
  } else if (nodesOnSpouse.length) {
    const inSign = nodesWithSpouse.length > 0;
    notes.push(
      `${nodesOnSpouse.join(" and ")} ${inSign ? "with" : "in trine to"} ${spouse.planet}: obstacles before marriage and disputes after it${inSign ? "" : ", at trine strength"}${nodesOnSpouse.includes("Rahu") ? "; a partner from another community, region or country is likely" : ""}${jupiterAspects ? "; Jupiter's aspect brings compromise" : ""}.`,
    );
  }
  if (!female) {
    if (close(by.Mars, by.Venus) && close(by.Rahu, by.Venus))
      notes.push(
        "Mars, Venus and Rahu together: a passionate but unsettled married life.",
      );
    if (close(by.Mars, by.Venus) && close(by.Ketu, by.Venus))
      notes.push(
        `Mars, Venus and Ketu together: disputes between the partners, separation possible${jupiterAspects ? "; Jupiter's aspect brings compromise" : ""}.`,
      );
  }
  // Hemmed between Mars and Mercury (lover and husband).
  const prevSign = (spouse.signIndex + 11) % 12;
  const nextSign = (spouse.signIndex + 1) % 12;
  const flank = new Set([by.Mars.signIndex, by.Mercury.signIndex]);
  if (
    flank.has(prevSign) &&
    flank.has(nextSign) &&
    by.Mars.signIndex !== by.Mercury.signIndex &&
    spouse.planet === "Venus"
  ) {
    notes.push(
      "Venus hemmed between Mars and Mercury: the heart is divided between a lover and the spouse.",
    );
  }
  if (promised === "absent" || promised === "through-dispositor") {
    notes.push(
      "With no direct link, Nadi reads the dispositor of the spouse karaka and waits for Jupiter's passage over it.",
    );
  }

  const triggerSigns = [
    spouse.signIndex,
    (spouse.signIndex + 4) % 12,
    (spouse.signIndex + 8) % 12,
  ].map((i) => SIGNS[i]);
  return {
    gender,
    native: native.planet,
    spouse: spouse.planet,
    nativeSign: native.sign,
    spouseSign: spouse.sign,
    house,
    houseFromSaturn,
    promised,
    headline,
    notes,
    triggerSigns,
  };
}

/** Next Jupiter passage over the spouse karaka's sign (full) or its trines (three-quarter). */
export function nextMarriageWindow(
  m: MarriageReading,
  transits: TransitPeriod[],
  fromIso: string,
): { period: TransitPeriod; kind: "over" | "trine" } | null {
  const upcoming = transits
    .filter(
      (t) =>
        t.planet === "Jupiter" &&
        t.end >= fromIso &&
        m.triggerSigns.includes(t.sign),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const first = upcoming[0];
  if (!first) return null;
  return {
    period: first,
    kind: first.sign === m.spouseSign ? "over" : "trine",
  };
}

/** The most recent Jupiter passage over the marriage triggers that has already passed, read from adulthood. */
export function lastMarriageWindow(
  m: MarriageReading,
  transits: TransitPeriod[],
  fromIso: string,
  birthIso: string,
  minAge = 16,
): { period: TransitPeriod; kind: "over" | "trine" } | null {
  const birth = Date.parse(birthIso);
  const passed = transits
    .filter(
      (t) =>
        t.planet === "Jupiter" &&
        t.end <= fromIso &&
        m.triggerSigns.includes(t.sign),
    )
    .filter((t) => (Date.parse(t.start) - birth) / (365.25 * 86400e3) >= minAge)
    .sort((a, b) => b.start.localeCompare(a.start));
  const first = passed[0];
  if (!first) return null;
  return {
    period: first,
    kind: first.sign === m.spouseSign ? "over" : "trine",
  };
}
