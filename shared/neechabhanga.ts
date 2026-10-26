/**
 * Neechabhanga: cancellation of a planet's debilitation, for the Parashari reading.
 *
 * Canonical conditions are paraphrased from two classical texts, each labelled by its own verse:
 *   Mantreswara, Phaladeepika ch. 7 (Maharajayogas), V. Subrahmanya Sastri translation (1950), wisdomlib.org:
 *     7.26 / 7.29-30  the lord of the debilitation sign, or the lord of the planet's exaltation sign, in a
 *                     kendra from the lagna or the Moon;
 *     7.27            those two lords in mutual kendras;
 *     7.28            the debilitated planet aspected by the lord of the sign it occupies, the more so when
 *                     the planet is not in the 6th, 8th or 12th.
 *   Vaidyanatha, Jataka Parijata ch. 7, vedicpupil.in edition and verse numbers:
 *     7.13            the same rule as Phaladeepika 7.26;
 *     7.14            the lord of the navamsa the debilitated planet occupies in a kendra or trikona, with a
 *                     movable lagna. The verse's second clause is hard to parse: its other reading, the lagna lord
 *                     in a movable-sign navamsa, is computed and kept provisional;
 *     7.20            two, three or four debilitated planets in the navamsa of their exaltation sign (the
 *                     verse's other branch, benefic shashtyamshas, is not computed);
 *     7.55            planets aspected by enemies or by debilitated planets give no royal yoga. Applied to
 *                     Vaidyanatha's own conditions only (the text-specific rule), on the debilitated planet, at
 *                     the aspect strength the rules count; Mantreswara's conditions are not touched.
 * Parashara's dasa and yoga verses (BPHS) do not state these cancellations, so the reading shows them as a
 * separate note, links each line that states a cancelled debility to the cancellation (`debilityLink`), and
 * softens, never deletes, the strain verses they touch. Counts are unchanged.
 *
 * Later-practice conditions found in modern compilations but not in the verses above are computed and
 * labelled provisional: exchange of signs with the dispositor; a planet exalted in the debilitation sign
 * standing in a kendra (Sastri's note 3 on 7.26 records this as a variant reading of the verse); the
 * debilitated planet itself in a kendra from the lagna or the Moon; a single debilitated planet exalted in the
 * navamsa (Jataka Parijata 7.20 asks for two to four); the dispositor in the same sign.
 */
import { ENEMIES, EXALTATION, SIGN_LORD, SIGNS, houseFrom, type Planet, type PlanetPosition } from "./astro";

export const PHALADEEPIKA_CH7_URL = "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621579.html";
export const JATAKA_PARIJATA_CH7_URL = "https://vedicpupil.in/library/books/jataka-parijata/chapter-7";

export interface BhangaCondition {
  id: string;
  met: boolean;
  text: string;
  source: string;
  provisional?: boolean;
  /** Phaladeepika ch. 7 verses a classical condition rests on. */
  pd?: string[];
  /** Jataka Parijata ch. 7 verses a classical condition rests on. */
  jp?: string[];
}

export interface NeechaBhanga {
  planet: Planet;
  sign: string;
  dispositor: Planet;
  exaltationLord: Planet;
  house: number;
  conditions: BhangaCondition[];
  /** True when a classical condition holds: one of Mantreswara's, or one of Vaidyanatha's that his 7.55 does not withhold. */
  cancelled: boolean;
  /** True when only later-practice (provisional) conditions are met. */
  provisionalOnly: boolean;
  /** 7.28: in the 6th, 8th or 12th the cancellation is weaker. */
  inDusthana: boolean;
  /** The Phaladeepika verses whose conditions hold, e.g. ["7.26", "7.29"]. */
  pdVerses: string[];
  /** The Jataka Parijata verses whose conditions hold and are not withheld by 7.55. */
  jpVerses: string[];
  /** The classical verses by book, e.g. "Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13"; empty when none. */
  verses: string;
  /** Jataka Parijata 7.55: enemies or debilitated planets aspecting the planet, which withhold Vaidyanatha's own yogas. */
  jp755?: { by: Planet[]; text: string };
}

const SEVEN: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const movable = (sign: number) => sign % 3 === 0;
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const uniqSorted = (xs: readonly string[]) =>
  xs.filter((x, i) => xs.indexOf(x) === i).sort((a, b) => Number(a.split(".")[1]) - Number(b.split(".")[1]));

/** Navamsa sign of a position: nine parts of 3°20', counted from the sign itself for movable signs. */
export function navamsaOf(p: Pick<PlanetPosition, "signIndex" | "degInSign">): number {
  return (p.signIndex * 9 + Math.floor(p.degInSign / (10 / 3))) % 12;
}

function versesText(pd: readonly string[], jp: readonly string[]): string {
  const parts: string[] = [];
  if (pd.length) parts.push(`Phaladeepika ${uniqSorted(pd).join(", ")}`);
  if (jp.length) parts.push(`Jataka Parijata ${uniqSorted(jp).join(", ")}`);
  return parts.join(" and ");
}

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

  const conditions: BhangaCondition[] = [];
  const add = (id: string, met: boolean, text: string, source: string, extra: Partial<BhangaCondition> = {}) =>
    conditions.push({ id, met, text, source, ...extra });

  const dL = kendraLagna(dispositor), dM = kendraMoon(dispositor);
  add("dispositor-kendra", dL || dM, `${dispositor}, lord of ${SIGNS[p.signIndex]}, ${dL || dM ? `is in the ${ord(houseFrom(dL ? lagnaIdx : moonIdx, pos(dispositor).signIndex))} from the ${dL ? "lagna" : "Moon"}, an angle` : "is in no angle from the lagna or the Moon"}`, "Phaladeepika 7.26, 7.29; Jataka Parijata 7.13", { pd: ["7.26", "7.29"], jp: ["7.13"] });
  const eL = exaltationLord !== planet && kendraLagna(exaltationLord), eM = exaltationLord !== planet && kendraMoon(exaltationLord);
  add("exaltation-lord-kendra", eL || eM, `${exaltationLord}, lord of ${SIGNS[ex.sign]} where ${planet} is exalted, ${eL || eM ? `is in the ${ord(houseFrom(eL ? lagnaIdx : moonIdx, pos(exaltationLord).signIndex))} from the ${eL ? "lagna" : "Moon"}, an angle` : "is in no angle from the lagna or the Moon"}`, "Phaladeepika 7.26, 7.29; Jataka Parijata 7.13", { pd: ["7.26", "7.29"], jp: ["7.13"] });
  const mutual = dispositor !== exaltationLord && KENDRA.includes(houseFrom(pos(dispositor).signIndex, pos(exaltationLord).signIndex));
  add("mutual-kendra", mutual, `${dispositor} and ${exaltationLord} ${mutual ? "stand in mutual angles" : "are not in mutual angles"}`, "Phaladeepika 7.27", { pd: ["7.27"] });
  const q = dispositor !== planet ? aspect(dispositor, pos(dispositor).signIndex, p.signIndex) : 0;
  add("dispositor-aspect", q >= 2, `${dispositor} ${q >= 2 ? `aspects ${planet} (${q === 4 ? "full" : "half or three-quarter"} sign aspect)` : q > 0 ? `casts only a quarter aspect on ${planet}, not counted` : `does not aspect ${planet} at the strength the rules count`}`, "Phaladeepika 7.28", { pd: ["7.28"] });

  // Jataka Parijata 7.14: the lord of the planet's navamsa in an angle or a trine, and a movable lagna; the
  // other reading of the second clause (the lagna lord in a movable navamsa) is provisional.
  const navamsa = navamsaOf(p);
  const navLord = SIGN_LORD[navamsa];
  const nh = houseFrom(lagnaIdx, pos(navLord).signIndex);
  const navGood = KENDRA.includes(nh) || TRIKONA.includes(nh);
  const place = KENDRA.includes(nh) && TRIKONA.includes(nh) ? "an angle and a trine" : KENDRA.includes(nh) ? "an angle" : TRIKONA.includes(nh) ? "a trine" : "neither an angle nor a trine";
  const who = navLord === planet ? `${planet} itself, in its own navamsa (${SIGNS[navamsa]}),` : `${navLord}, lord of the navamsa ${planet} occupies (${SIGNS[navamsa]}),`;
  const lagnaLord = SIGN_LORD[lagnaIdx];
  const lagnaLordNav = navamsaOf(pos(lagnaLord));
  if (navGood && movable(lagnaIdx))
    add("jp-navamsa-lord", true, `${who} is in the ${ord(nh)} from the lagna, ${place}, and the lagna, ${SIGNS[lagnaIdx]}, is a movable sign`, "Jataka Parijata 7.14", { jp: ["7.14"] });
  else if (navGood && movable(lagnaLordNav))
    add("jp-navamsa-lord", true, `${who} is in the ${ord(nh)} from the lagna, ${place}; the lagna, ${SIGNS[lagnaIdx]}, is not movable, but its lord ${lagnaLord} is in a movable navamsa (${SIGNS[lagnaLordNav]}), the other reading of the verse's second clause`, "Jataka Parijata 7.14, other reading of the second clause", { provisional: true });
  else
    add("jp-navamsa-lord", false, navGood ? `${who} is in the ${ord(nh)} from the lagna, ${place}, but the lagna, ${SIGNS[lagnaIdx]}, is not movable and its lord ${lagnaLord} is not in a movable navamsa` : `${who} is in the ${ord(nh)} from the lagna, ${place}`, "Jataka Parijata 7.14", { jp: ["7.14"] });

  // Later practice, provisional.
  const exchange = dispositor !== planet && SIGN_LORD[pos(dispositor).signIndex] === planet;
  add("exchange", exchange, `${planet} and ${dispositor} ${exchange ? "exchange signs" : "do not exchange signs"}`, "later practice", { provisional: true });
  const exaltedHere = positions.find((x) => x.planet !== planet && EXALTATION[x.planet]?.sign === p.signIndex);
  const eh = exaltedHere && (kendraLagna(exaltedHere.planet) || kendraMoon(exaltedHere.planet));
  // Sastri's note 3 on 7.26 records a variant reading of taducca-natha as "the planet exalted in that sign"; kept provisional as a commentarial variant.
  add("exalted-in-sign-kendra", Boolean(eh), exaltedHere ? `${exaltedHere.planet}, exalted in ${SIGNS[p.signIndex]}, ${eh ? `is in an angle from the lagna or the Moon${exaltedHere.signIndex === p.signIndex ? `, conjunct ${planet}` : ""}` : "is in no angle from the lagna or the Moon"}` : `no planet is exalted in ${SIGNS[p.signIndex]}`, "Phaladeepika 7.26, variant reading in Sastri's note", { provisional: true });
  const selfKendra = KENDRA.includes(house) || KENDRA.includes(houseFrom(moonIdx, p.signIndex));
  add("planet-kendra", selfKendra, `${planet} itself ${selfKendra ? `stands in the ${ord(house)} from the lagna and the ${ord(houseFrom(moonIdx, p.signIndex))} from the Moon` : "is in no angle from the lagna or the Moon"}`, "later practice", { provisional: true });
  // Jataka Parijata 7.20 when two to four debilitated planets are so placed; one alone is later practice.
  const navExalted = navamsa === ex.sign;
  const soPlaced = positions
    .filter((x) => SEVEN.includes(x.planet) && x.dignity === "Debilitated" && EXALTATION[x.planet] && navamsaOf(x) === EXALTATION[x.planet]!.sign)
    .map((x) => x.planet);
  const others = soPlaced.filter((x) => x !== planet);
  if (navExalted && soPlaced.length >= 2 && soPlaced.length <= 4)
    add("navamsa-exalted", true, `${planet} is exalted in the navamsa (${SIGNS[navamsa]}), and so ${others.length === 1 ? "is" : "are"} ${list(others)}, also debilitated: ${soPlaced.length} debilitated planets so placed`, "Jataka Parijata 7.20", { jp: ["7.20"] });
  else
    add("navamsa-exalted", navExalted, navExalted ? `${planet} is exalted in the navamsa (${SIGNS[navamsa]}), the only debilitated planet so placed; Jataka Parijata 7.20 asks for two to four` : `${planet} is in ${SIGNS[navamsa]} in the navamsa`, "later practice", { provisional: true });
  const conj = dispositor !== planet && pos(dispositor).signIndex === p.signIndex;
  add("dispositor-conjunct", conj, `${dispositor} ${conj ? "is in the same sign" : "is not in the same sign"}`, "later practice", { provisional: true });

  // Jataka Parijata 7.55, on Vaidyanatha's own conditions only.
  const hostile = positions.filter(
    (x) =>
      x.planet !== planet &&
      SEVEN.includes(x.planet) &&
      (ENEMIES[planet].includes(x.planet) || x.dignity === "Debilitated") &&
      aspect(x.planet, x.signIndex, p.signIndex) >= 2,
  );
  const jp755 = hostile.length
    ? {
        by: hostile.map((x) => x.planet),
        text: `${list(hostile.map((x) => `${x.planet} (${[ENEMIES[planet].includes(x.planet) ? `an enemy of ${planet}` : "", x.dignity === "Debilitated" ? "debilitated" : ""].filter(Boolean).join(", ")})`))} ${hostile.length === 1 ? "aspects" : "aspect"} ${planet}, so Jataka Parijata 7.55 withholds Vaidyanatha's royal yogas for it`,
      }
    : undefined;

  const classical = conditions.filter((c) => c.met && !c.provisional);
  const pdVerses = uniqSorted(classical.flatMap((c) => c.pd ?? []));
  const jpVerses = jp755 ? [] : uniqSorted(classical.flatMap((c) => c.jp ?? []));
  const cancelled = pdVerses.length > 0 || jpVerses.length > 0;
  const provisionalOnly = !cancelled && conditions.some((c) => c.met && c.provisional);
  return {
    planet,
    sign: SIGNS[p.signIndex],
    dispositor,
    exaltationLord,
    house,
    conditions,
    cancelled,
    provisionalOnly,
    inDusthana,
    pdVerses,
    jpVerses,
    verses: versesText(pdVerses, jpVerses),
    ...(jp755 ? { jp755 } : {}),
  };
}

/** The conditions a cancellation rests on: Mantreswara's, and Vaidyanatha's unless his 7.55 withholds them. */
export function classicalConditions(nb: NeechaBhanga): BhangaCondition[] {
  return nb.conditions.filter((c) => c.met && !c.provisional && ((c.pd?.length ?? 0) > 0 || ((c.jp?.length ?? 0) > 0 && !nb.jp755)));
}

/** The source of a cancellation: Mantreswara's verses when any hold, else Vaidyanatha's; `also` gives the second book. */
export function cancellationSources(nb: NeechaBhanga): { source: { label: string; url: string }; also?: { label: string; url: string } } {
  const pd = { label: `Phaladeepika ${nb.pdVerses.join(", ")}`, url: PHALADEEPIKA_CH7_URL };
  const jp = { label: `Jataka Parijata ${nb.jpVerses.join(", ")}`, url: JATAKA_PARIJATA_CH7_URL };
  if (nb.pdVerses.length && nb.jpVerses.length) return { source: pd, also: jp };
  return { source: nb.pdVerses.length ? pd : jp };
}

/** A cancelled debility, linked to a line that states it: shown beside the line in both views, not counted. */
export interface DebilityCancelled {
  planets: Planet[];
  /** The classical verses, e.g. "Phaladeepika 7.26, 7.29 and Jataka Parijata 7.13". */
  verses: string;
  /** Practitioner sentence beside the line. */
  text: string;
  /** Plain sentence beside the line. */
  plain: string;
  /** Inline forms, for tags and fact lists. */
  tag: string;
  tagPlain: string;
  /** For a single planet in the 6th, 8th or 12th: ", less fully in the 8th (Phaladeepika 7.28)". */
  less?: string;
}

/** Whose line it is: the clause says that author does not state the cancellation. */
export type LineAuthor = "Parashara" | "Mantreswara" | "Vaidyanatha" | "other";

export function authorOf(sourceLabel: string): LineAuthor {
  return /^(Parashara|BPHS)\b/.test(sourceLabel)
    ? "Parashara"
    : /^Phaladeepika\b/.test(sourceLabel)
      ? "Mantreswara"
      : /^Jataka Parijata\b/.test(sourceLabel)
        ? "Vaidyanatha"
        : "other";
}

const PLANET_ALT = "Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu";

/**
 * Whether a line names `planet` as debilitated: "Sun, lord of the 11th, is debilitated", "The Sun debilitated:",
 * "Sun, debilitated, a malefic", "Sun, Saturn debilitated in the sign", "Sun and Mars, debilitated", "a debilitated
 * Moon". With `own` (a line about that planet, such as its dasa notes), also "it is debilitated", "in the 6th and
 * debilitated" and "by its debilitated sign", unless the line names another planet as debilitated. A line that only
 * compares another state to debilitation ("combust, which Mantreswara counts like debilitation") does not count.
 */
export function statesDebility(text: string, planet: Planet, own = false): boolean {
  const more = `(?:(?:,\\s*|\\s+and\\s+)(?:the\\s+)?(?:${PLANET_ALT})\\b)*`;
  const re = new RegExp(`\\b${planet}\\b${more}(?:,[^,.;:]*,)?,?\\s+(?:(?:is|are|both|also)\\s+)*[Dd]ebilitated\\b|\\b[Dd]ebilitated\\s+${planet}\\b`);
  if (re.test(text)) return true;
  if (!own) return false;
  if (/\b[Ii]ts?\s+(?:is\s+)?(?:also\s+)?debilitat/.test(text)) return true;
  if (!/\b(?:and|is|also)\s+debilitated\b/.test(text)) return false;
  const ALL: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  return !ALL.some((o) => o !== planet && statesDebility(text, o));
}

const the = (p: Planet) => (p === "Sun" || p === "Moon" ? `the ${p}` : p);

/** The clause for one or more cancelled debilities, worded for a line by `author`. */
export function cancellationNote(nbs: readonly NeechaBhanga[], author: LineAuthor = "Parashara"): DebilityCancelled | undefined {
  const c = nbs.filter((h) => h.cancelled);
  if (!c.length) return undefined;
  const lessOf = (h: NeechaBhanga) => (h.inDusthana ? `, less fully in the ${ord(h.house)} (Phaladeepika 7.28)` : "");
  const one = (h: NeechaBhanga) => `debility cancelled in ${h.verses}${lessOf(h)}`;
  const tail =
    author === "Parashara"
      ? "Parashara does not state the cancellation"
      : author === "Mantreswara"
        ? "Mantreswara gives the cancellation in ch. 7, not in this verse"
        : author === "Vaidyanatha"
          ? "Vaidyanatha gives the cancellation in ch. 7, not in this verse"
          : "this verse does not state the cancellation";
  const body = c.map((h) => `${h.planet}: ${one(h)}`).join("; ");
  const part = c.some((h) => h.inDusthana);
  const whose = c.length === 1 ? "this weakness" : `the weakness of ${list(c.map((h) => the(h.planet)))}`;
  return {
    planets: c.map((h) => h.planet),
    verses: c.map((h) => h.verses).filter((v, i, a) => a.indexOf(v) === i).join("; "),
    text: `${body}; ${tail}.`,
    plain: `Another classical rule cancels ${whose}${part ? " in part" : ""}, so expect effort before results.`,
    tag: `${c.length === 1 ? one(c[0]) : body}; ${tail}`,
    tagPlain: `another classical rule cancels ${whose}${part ? " in part" : ""}`,
    ...(c.length === 1 && c[0].inDusthana ? { less: lessOf(c[0]) } : {}),
  };
}

/**
 * The cancellation linked to a line that states the debility of one of `candidates` (N1): undefined when the line
 * states no cancelled debility. `own` is the planet the line is about, for "it is debilitated".
 */
export function debilityLink(
  nbs: readonly NeechaBhanga[],
  text: string,
  candidates: readonly Planet[],
  opts: { own?: Planet; author?: LineAuthor } = {},
): DebilityCancelled | undefined {
  const hit = nbs.filter((nb) => nb.cancelled && candidates.includes(nb.planet) && statesDebility(text, nb.planet, opts.own === nb.planet));
  return hit.length ? cancellationNote(hit, opts.author) : undefined;
}
