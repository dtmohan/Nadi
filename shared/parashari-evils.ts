// BPHS chapter 9 (evils at birth, arishta) and chapter 10 (antidotes), read from
// http://jyotishvidya.com/ch9.htm and ch10.htm. Houses are whole signs from the lagna,
// aspects are Parashari drishti (chapter 26), benefics and malefics natural (chapter 3).
// 9.2 limits these evils to the first 24 years, so for an adult chart they are read as
// arishtas already lived through, and the parental verses (9.24-45) as facts to check.
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const APOKLIMA = [3, 6, 9, 12];
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const navamsaSign = (p: PlanetPosition) => (p.signIndex * 9 + Math.floor(p.degInSign / (30 / 9))) % 12;
/** Natural enemies, BPHS 3.55 (derived from the moolatrikona rule stated there). */
const ENEMIES: Partial<Record<Planet, Planet[]>> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

export const EVIL_CAVEATS: string[] = [
  "Chapter 9 is Parashara's list of evils at birth (arishta). 9.1 asks for these to be weighed before the twelve houses are read, and 9.2 says they hold only up to the 24th year, so for a native past that age the childhood verses (9.3-23) record arishtas already lived through, and the antidotes of chapter 10 show what held them off. The verses about the parents (9.24-45) describe facts that can be checked against the family history, which makes them useful for birth-time work. The hard wording is Parashara's and is shown as written.",
  "Houses are whole signs from the lagna, aspects are Parashari drishti and hemming means malefics in the two adjacent signs with no benefic in either. A decreasing Moon is one past full. 9.13 uses the Shadbala module's twilight flag (one ghati of sunrise or sunset) where 9.14 gives three ghatis, and the gandanta and the Moon's hora are not tested, so that card is provisional. The oriental and occidental halves in 9.15 are taken as the houses 10 to 3 and 4 to 9, provisional. Strength means Shadbala, so 9.23 and 9.26 are withheld without it.",
  "Chapter 10: every antidote that holds is listed, and 10.2 (Mercury, Jupiter or Venus in an angle) holds in most charts; Parashara says it destroys all the evils, and the text is applied as written. 10.5 depends on day or night birth, taken from the Shadbala module where present.",
];

export function evilFindings(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const ben = (pl: Planet) => isBen(pos(pl));
  const inSign = (si: number) => positions.filter((p) => p.signIndex === si);
  const inHouse = (h: number) => inSign(signOfHouse(h));
  const malIn = (h: number) => inHouse(h).filter((p) => !isBen(p)).map((p) => p.planet);
  const benIn = (h: number) => inHouse(h).filter(isBen).map((p) => p.planet);
  const withPl = (pl: Planet) => inSign(pos(pl).signIndex).filter((p) => p.planet !== pl);
  const malWith = (pl: Planet) => withPl(pl).filter((p) => !isBen(p)).map((p) => p.planet);
  const benWith = (pl: Planet) => withPl(pl).filter(isBen).map((p) => p.planet);
  const aspectsSign = (a: Planet, si: number) => pos(a).signIndex !== si && deps.aspect(a, pos(a).signIndex, si) > 0;
  const aspects = (a: Planet, b: Planet) => a !== b && aspectsSign(a, pos(b).signIndex);
  const malAspecting = (pl: Planet) => positions.filter((p) => !isBen(p) && aspects(p.planet, pl)).map((p) => p.planet);
  const benAspecting = (pl: Planet) => positions.filter((p) => isBen(p) && aspects(p.planet, pl)).map((p) => p.planet);
  const malAspectingSign = (si: number) => positions.filter((p) => !isBen(p) && aspectsSign(p.planet, si)).map((p) => p.planet);
  const benAspectingSign = (si: number) => positions.filter((p) => isBen(p) && aspectsSign(p.planet, si)).map((p) => p.planet);
  /** Hemmed between malefics: malefics in both adjacent signs, no benefic in either. */
  const hemmedByMal = (si: number) => {
    const a = inSign((si + 11) % 12), b = inSign((si + 1) % 12);
    return a.some((p) => !isBen(p)) && b.some((p) => !isBen(p)) && !a.some(isBen) && !b.some(isBen);
  };
  const hemmedByBen = (si: number) => {
    const a = inSign((si + 11) % 12), b = inSign((si + 1) % 12);
    return a.some(isBen) && b.some(isBen) && !a.some((p) => !isBen(p)) && !b.some((p) => !isBen(p));
  };
  const strong = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl)?.strong;
  const sun = pos("Sun"), moon = pos("Moon");
  const elong = (((moon.lon - sun.lon) % 360) + 360) % 360;
  const waning = elong >= 180;
  const push = (id: string, title: string, text: string, tone: ParashariFinding["tone"], planets: Planet[], source: ParashariSource) =>
    F.push({ id, kind: "evil", title, text, tone, planets: Array.from(new Set(planets)), source });
  const at = (pl: Planet, h: number) => houseOf(pl) === h;
  const H = (pl: Planet) => `${pl} in the ${ord(houseOf(pl))}`;

  // ---- 9.3-23: arishta in childhood ----
  // 9.3
  if ([6, 8, 12].includes(houseOf("Moon")) && malAspecting("Moon").length) {
    const b = benAspecting("Moon");
    push("pa-evil-9-3", "Moon in a dusthana under malefic aspect", `The Moon is in the ${ord(houseOf("Moon"))} and aspected by ${list(malAspecting("Moon"))}${b.length ? `, with ${list(b)} also aspecting` : ""}. Parashara reads an early end${b.length ? ", extended to the eighth year by the benefic aspect" : ""}; shown as written.`, "strain", ["Moon", ...malAspecting("Moon"), ...b], S(9, "3"));
  }
  // 9.4
  {
    const rb = positions.filter((p) => isBen(p) && p.retrograde && [6, 8, 12].includes(houseFrom(lagnaIdx, p.signIndex)) && malAspecting(p.planet).length);
    if (rb.length && !benIn(1).length) {
      const p = rb[0];
      push("pa-evil-9-4", "Retrograde benefic in a dusthana", `${p.planet}, retrograde in the ${ord(houseFrom(lagnaIdx, p.signIndex))}, is aspected by ${list(malAspecting(p.planet))} and no benefic occupies the lagna. Parashara reads death within a month of birth; shown as written.`, "strain", [p.planet, ...malAspecting(p.planet)], S(9, "4"));
    }
  }
  // 9.5
  if (at("Saturn", 5) && at("Mars", 5) && at("Sun", 5)) {
    push("pa-evil-9-5", "Saturn, Mars and Sun in the 5th", "Saturn, Mars and the Sun share the 5th. Parashara reads early loss of the mother and a brother; shown as written.", "strain", ["Saturn", "Mars", "Sun"], S(9, "5"));
  }
  // 9.6
  if ([1, 8].includes(houseOf("Mars")) && !benAspecting("Mars").length && !benWith("Mars").length) {
    const j = malWith("Mars").filter((p) => p === "Saturn" || p === "Sun");
    const a = malAspecting("Mars");
    if (j.length || a.length) {
      push("pa-evil-9-6", "Mars in the lagna or 8th, afflicted", `${H("Mars")} is ${j.length ? `joined by ${list(j)}` : `aspected by ${list(a)}`} and has no benefic on it. Parashara reads an early end; shown as written.`, "strain", ["Mars", ...j, ...a], S(9, "6"));
    }
  }
  // 9.7
  if (aspectsSign("Saturn", lagnaIdx) && aspectsSign("Mars", lagnaIdx) && sun.signIndex === pos("Rahu").signIndex && moon.signIndex === pos("Rahu").signIndex) {
    push("pa-evil-9-7", "Saturn and Mars on the lagna, luminaries with Rahu", "Saturn and Mars both aspect the lagna while the Sun and Moon are with Rahu. Parashara reads a life of a fortnight; shown as written.", "strain", ["Saturn", "Mars", "Sun", "Moon", "Rahu"], S(9, "7"));
  }
  // 9.8
  if (at("Saturn", 10) && at("Moon", 6) && at("Mars", 7)) push("pa-evil-9-8a", "Saturn 10th, Moon 6th, Mars 7th", "Saturn is in the 10th, the Moon in the 6th and Mars in the 7th. Parashara reads immediate death of the child with its mother; shown as written.", "strain", ["Saturn", "Moon", "Mars"], S(9, "8"));
  if (at("Saturn", 1) && at("Moon", 8) && at("Jupiter", 3)) push("pa-evil-9-8b", "Saturn 1st, Moon 8th, Jupiter 3rd", "Saturn is in the lagna, the Moon in the 8th and Jupiter in the 3rd. Parashara reads an immediate end; shown as written.", "strain", ["Saturn", "Moon", "Jupiter"], S(9, "8"));
  // 9.9
  if (at("Sun", 9) && at("Mars", 7) && at("Jupiter", 11) && at("Venus", 11)) push("pa-evil-9-9", "Sun 9th, Mars 7th, Jupiter and Venus 11th", "The Sun is in the 9th, Mars in the 7th, and Jupiter and Venus in the 11th. Parashara reads a life of one month; shown as written.", "strain", ["Sun", "Mars", "Jupiter", "Venus"], S(9, "9"));
  // 9.9-11
  {
    const four: Planet[] = ["Sun", "Moon", "Venus", "Rahu"];
    const in12 = four.filter((pl) => at(pl, 12));
    if (in12.length) {
      const relief = four.filter((pl) => !in12.includes(pl) && aspectsSign(pl, signOfHouse(12)));
      push("pa-evil-9-11", "Luminaries, Venus or Rahu in the 12th", `${list(in12)} in the 12th. Parashara names these four as the planets whose 12th-house place shortens life${relief.length ? `, but ${list(relief)} ${relief.length > 1 ? "aspect" : "aspects"} the 12th, which he says counteracts it` : ", and none of the other three aspects the 12th to counteract it"}.`, relief.length ? "mixed" : "strain", [...in12, ...relief], S(9, "9-11"));
    }
  }
  // 9.12
  if ([1, 7, 8].includes(houseOf("Moon")) && malWith("Moon").length && !benWith("Moon").length && !benAspecting("Moon").length) {
    push("pa-evil-9-12", "Moon with a malefic, no benefic relief", `The Moon is in the ${ord(houseOf("Moon"))} with ${list(malWith("Moon"))}, and no benefic joins or aspects it. Parashara reads an early end; shown as written.`, "strain", ["Moon", ...malWith("Moon")], S(9, "12"));
  }
  // 9.13 (provisional: twilight from the Shadbala module, gandanta and Moon's hora not tested)
  if (shadbala?.twilight && KENDRA.includes(houseOf("Moon"))) {
    const malK = positions.filter((p) => !isBen(p) && KENDRA.includes(houseFrom(lagnaIdx, p.signIndex))).map((p) => p.planet);
    if (malK.length) {
      push("pa-evil-9-13", "Twilight birth with Moon and malefics in angles", `The birth falls within a ghati of sunrise or sunset, the Moon is in the ${ord(houseOf("Moon"))} and ${list(malK)} occupy angles. Parashara reads an early end for a birth in the twilight junctions, the Moon's hora or gandanta with this array; only the twilight test is applied here, and with a narrower window than 9.14 gives.`, "strain", ["Moon", ...malK], S(9, "13-14", true));
    }
  }
  // 9.15 (provisional halves)
  if (lagnaIdx === 7) {
    const east = [10, 11, 12, 1, 2, 3];
    const mals = positions.filter((p) => !isBen(p)), bens = positions.filter(isBen);
    if (mals.length && bens.length && mals.every((p) => east.includes(houseFrom(lagnaIdx, p.signIndex))) && bens.every((p) => !east.includes(houseFrom(lagnaIdx, p.signIndex)))) {
      push("pa-evil-9-15", "Scorpio lagna, malefics east and benefics west", "Every malefic is in the rising half (houses 10 to 3) and every benefic in the setting half. Parashara reads an early end for a Scorpio birth so arranged; the halves are read as houses, which is provisional.", "strain", mals.map((p) => p.planet), S(9, "15", true));
    }
  }
  // 9.16
  if (hemmedByMal(lagnaIdx) && ((malIn(12).length && malIn(6).length) || (malIn(8).length && malIn(2).length))) {
    const pair = malIn(12).length && malIn(6).length ? [12, 6] : [8, 2];
    push("pa-evil-9-16", "Lagna hemmed, malefics in dusthanas", `The lagna is hemmed between malefics, with ${list(malIn(pair[0]))} in the ${ord(pair[0])} and ${list(malIn(pair[1]))} in the ${ord(pair[1])}. Parashara reads an early end; shown as written.`, "strain", [...malIn(12), ...malIn(6), ...malIn(8), ...malIn(2)], S(9, "16"));
  }
  // 9.17
  if (malIn(1).length && malIn(7).length && malWith("Moon").length && !benWith("Moon").length && !benAspecting("Moon").length) {
    push("pa-evil-9-17", "Malefics in the lagna and 7th, Moon afflicted", `${list(malIn(1))} in the lagna and ${list(malIn(7))} in the 7th, while the Moon is with ${list(malWith("Moon"))} and has no benefic relief. Parashara reads a premature end; shown as written.`, "strain", [...malIn(1), ...malIn(7), "Moon"], S(9, "17"));
  }
  // 9.18
  if (waning && at("Moon", 1) && malIn(8).length && [4, 7, 10].some((h) => malIn(h).length)) {
    const k = [4, 7, 10].find((h) => malIn(h).length)!;
    push("pa-evil-9-18", "Waning Moon in the lagna, malefics in the 8th and an angle", `The decreasing Moon is in the lagna, ${list(malIn(8))} in the 8th and ${list(malIn(k))} in the ${ord(k)}. Parashara reads an early end without doubt; shown as written.`, "strain", ["Moon", ...malIn(8), ...malIn(k)], S(9, "18"));
  }
  // 9.19-20
  if ([1, 7, 8, 12].includes(houseOf("Moon")) && hemmedByMal(moon.signIndex)) {
    const withMother = houseOf("Moon") === 1 && (malIn(7).length || malIn(8).length);
    push(withMother ? "pa-evil-9-20" : "pa-evil-9-19", "Moon hemmed between malefics", `The Moon in the ${ord(houseOf("Moon"))} has malefics in the signs on both sides of it${withMother ? `, and ${list([...malIn(7), ...malIn(8)])} in the ${malIn(7).length ? "7th" : "8th"}` : ""}. Parashara reads a premature end${withMother ? " of the child with its mother" : ""}; shown as written.`, "strain", ["Moon"], S(9, withMother ? "20" : "19"));
  }
  // 9.21
  if (at("Saturn", 12) && at("Sun", 9) && at("Mars", 8) && !["Saturn", "Sun", "Mars"].some((pl) => benAspecting(pl as Planet).length)) {
    push("pa-evil-9-21", "Saturn 12th, Sun 9th, Mars 8th", "Saturn is in the 12th, the Sun in the 9th and Mars in the 8th, none under a benefic aspect. Parashara reads an instant end; shown as written.", "strain", ["Saturn", "Sun", "Mars"], S(9, "21"));
  }
  // 9.22
  if (waning && at("Moon", 1)) {
    const lagnaDeg = lagnaLon - lagnaIdx * 30;
    const third = Math.min(2, Math.floor(lagnaDeg / 10));
    const risingDrek = inHouse(1).filter((p) => !isBen(p) && Math.min(2, Math.floor(p.degInSign / 10)) === third).map((p) => p.planet);
    if (malIn(7).length || risingDrek.length) {
      push("pa-evil-9-22", "Waning Moon in the lagna with a malefic in the 7th or rising drekkana", `The decreasing Moon is in the lagna and ${malIn(7).length ? `${list(malIn(7))} in the 7th` : `${list(risingDrek)} in the rising drekkana`}. Parashara reads an early end; shown as written.`, "strain", ["Moon", ...malIn(7), ...risingDrek], S(9, "22"));
    }
  }
  // 9.23
  if (shadbala) {
    const seven = positions.filter((p) => shadbala.planets.some((s) => s.planet === p.planet));
    if (seven.every((p) => APOKLIMA.includes(houseFrom(lagnaIdx, p.signIndex)) && strong(p.planet) === false)) {
      push("pa-evil-9-23", "All planets weak in apoklimas", "Every planet is below its Shadbala requirement and in a cadent house (3rd, 6th, 9th or 12th). Parashara reads a life of two or six months; shown as written.", "strain", seven.map((p) => p.planet), S(9, "23"));
    }
  }

  // ---- 9.24-33: the mother ----
  {
    const ma = malAspecting("Moon"), ba = benAspecting("Moon");
    if (ba.length && !ma.length) push("pa-evil-9-24b", "Benefics aspecting the Moon", `The Moon is aspected by ${list(ba)} and by no malefic. Parashara reads good for the mother.`, "support", ["Moon", ...ba], S(9, "24"));
  }
  if ((["Rahu", "Mercury", "Venus", "Sun", "Saturn"] as Planet[]).every((pl) => at(pl, 2))) {
    push("pa-evil-9-25", "Five planets in the 2nd", "Rahu, Mercury, Venus, the Sun and Saturn share the 2nd. Parashara reads a birth after the father's death and an early end for the mother; shown as written.", "strain", ["Rahu", "Mercury", "Venus", "Sun", "Saturn"], S(9, "25"));
  }
  if (shadbala) {
    const fromMal = positions.filter((p) => !isBen(p) && p.planet !== "Moon" && [7, 8].includes(houseFrom(p.signIndex, moon.signIndex))).map((p) => p.planet);
    const strongMal = malAspecting("Moon").filter((pl) => strong(pl) === true);
    if (fromMal.length && malWith("Moon").length && strongMal.length) {
      push("pa-evil-9-26", "Moon opposed, joined and aspected by malefics", `The Moon is in the 7th or 8th from ${list(fromMal)}, joined by ${list(malWith("Moon"))} and aspected by ${list(strongMal)}, strong by Shadbala. Parashara reads an early end for the mother; shown as written.`, "strain", ["Moon", ...fromMal, ...malWith("Moon"), ...strongMal], S(9, "26"));
    }
  }
  if (at("Sun", 7) && ["Exalted", "Debilitated"].includes(sun.dignity)) {
    push("pa-evil-9-27", "Sun exalted or debilitated in the 7th", `The Sun, ${sun.dignity.toLowerCase()} in ${SIGNS[sun.signIndex]}, is in the 7th. Parashara reads a child not raised on its mother's milk.`, "mixed", ["Sun"], S(9, "27"));
  }
  {
    const fourthFromMoon = (moon.signIndex + 3) % 12;
    const m = inSign(fourthFromMoon).filter((p) => !isBen(p) && p.dignity === "Inimical").map((p) => p.planet);
    if (m.length && !KENDRA.some((h) => benIn(h).length)) {
      push("pa-evil-9-28", "Malefic in an enemy's sign 4th from the Moon", `${list(m)} in ${SIGNS[fourthFromMoon]}, the 4th from the Moon and an enemy's sign, with no benefic in an angle from the lagna. Parashara reads early loss of the mother; shown as written.`, "strain", ["Moon", ...m], S(9, "28"));
    }
  }
  if (malIn(6).length && malIn(12).length) push("pa-evil-9-29a", "Malefics in the 6th and 12th", `${list(malIn(6))} in the 6th and ${list(malIn(12))} in the 12th. Parashara reads evils to the mother; shown as written.`, "strain", [...malIn(6), ...malIn(12)], S(9, "29"));
  if (malIn(4).length && malIn(10).length) {
    const cured = hemmedByBen(signOfHouse(4)) || hemmedByBen(signOfHouse(10)) || [1, 5, 9, 4, 7, 10].some((h) => benIn(h).length);
    push("pa-evil-9-29b", "Malefics in the 4th and 10th", `${list(malIn(4))} in the 4th and ${list(malIn(10))} in the 10th. Parashara reads evils to the father${cured ? ", but 10.8 turns this auspicious when the malefics are hemmed by benefics or benefics stand in angles or trines, which holds here" : ""}.`, cured ? "mixed" : "strain", [...malIn(4), ...malIn(10)], S(cured ? 10 : 9, cured ? "8" : "29"));
  }
  if (at("Mercury", 2) && malIn(1).length && malIn(7).length && malIn(12).length) {
    push("pa-evil-9-30", "Mercury in the 2nd, malefics in the 1st, 7th and 12th", `Mercury is in the 2nd while ${list(malIn(1))}, ${list(malIn(7))} and ${list(malIn(12))} hold the lagna, 7th and 12th. Parashara reads ruin of the whole family; shown as written.`, "strain", ["Mercury", ...malIn(1), ...malIn(7), ...malIn(12)], S(9, "30"));
  }
  if (at("Jupiter", 1) && at("Saturn", 2) && at("Rahu", 3)) push("pa-evil-9-31", "Jupiter 1st, Saturn 2nd, Rahu 3rd", "Jupiter is in the lagna, Saturn in the 2nd and Rahu in the 3rd. Parashara reads early loss of the mother; shown as written.", "strain", ["Jupiter", "Saturn", "Rahu"], S(9, "31"));
  if (waning) {
    const tri = [4, 8].map((k) => (moon.signIndex + k) % 12);
    const m = tri.flatMap((si) => inSign(si).filter((p) => !isBen(p)).map((p) => p.planet));
    if (m.length && tri.every((si) => inSign(si).some((p) => !isBen(p))) && !tri.some((si) => inSign(si).some(isBen))) {
      push("pa-evil-9-32", "Malefics in trines from a waning Moon", `${list(m)} occupy the 5th and 9th from the decreasing Moon, with no benefic joining them. Parashara reads the mother giving up the child; shown as written.`, "strain", ["Moon", ...m], S(9, "32"));
    }
  }
  if (pos("Mars").signIndex === pos("Saturn").signIndex && KENDRA.includes(houseFrom(moon.signIndex, pos("Mars").signIndex)) && navamsaSign(pos("Mars")) === navamsaSign(pos("Saturn"))) {
    push("pa-evil-9-33", "Mars and Saturn in one navamsa, angular to the Moon", `Mars and Saturn share ${SIGNS[pos("Mars").signIndex]}, an angle from the Moon, and the same navamsa (${SIGNS[navamsaSign(pos("Mars"))]}). Parashara reads two mothers and a short life; shown as written.`, "strain", ["Mars", "Saturn", "Moon"], S(9, "33"));
  }

  // ---- 9.34-42: the father ----
  if (at("Saturn", 1) && at("Mars", 7) && at("Moon", 6)) push("pa-evil-9-34", "Saturn 1st, Mars 7th, Moon 6th", "Saturn is in the lagna, Mars in the 7th and the Moon in the 6th. Parashara reads early loss of the father (9.34, repeated at 9.39); shown as written.", "strain", ["Saturn", "Mars", "Moon"], S(9, "34, 39"));
  if (at("Jupiter", 1) && (["Saturn", "Sun", "Mars", "Mercury"] as Planet[]).every((pl) => at(pl, 2))) push("pa-evil-9-35", "Jupiter in the lagna, four planets in the 2nd", "Jupiter is in the lagna while Saturn, the Sun, Mars and Mercury share the 2nd. Parashara reads loss of the father at the time of marriage; shown as written.", "strain", ["Jupiter", "Saturn", "Sun", "Mars", "Mercury"], S(9, "35"));
  {
    const seventhFromSun = (sun.signIndex + 6) % 12;
    const m7 = inSign(seventhFromSun).filter((p) => !isBen(p)).map((p) => p.planet);
    if (m7.length && (malWith("Sun").length || hemmedByMal(sun.signIndex))) {
      push("pa-evil-9-36", "Sun afflicted with a malefic opposite", `The Sun is ${malWith("Sun").length ? `with ${list(malWith("Sun"))}` : "hemmed between malefics"} and ${list(m7)} stands in the 7th from it. Parashara reads early loss of the father; shown as written.`, "strain", ["Sun", ...malWith("Sun"), ...m7], S(9, "36"));
    }
  }
  if (at("Sun", 7) && at("Mars", 10) && at("Rahu", 12)) push("pa-evil-9-37", "Sun 7th, Mars 10th, Rahu 12th", "The Sun is in the 7th, Mars in the 10th and Rahu in the 12th. Parashara reads little chance of the father surviving; shown as written.", "strain", ["Sun", "Mars", "Rahu"], S(9, "37"));
  if (at("Mars", 10) && pos("Mars").dignity === "Inimical") push("pa-evil-9-38", "Mars in an enemy's sign in the 10th", `Mars is in the 10th in ${SIGNS[pos("Mars").signIndex]}, an enemy's sign. Parashara reads early loss of the father without doubt; shown as written.`, "strain", ["Mars"], S(9, "38"));
  if (aspects("Saturn", "Sun") && [0, 7].includes(navamsaSign(sun))) push("pa-evil-9-40", "Sun in a Mars navamsa, aspected by Saturn", `The Sun is in the ${SIGNS[navamsaSign(sun)]} navamsa and aspected by Saturn. Parashara reads a father who left the family or died before the birth; shown as written.`, "strain", ["Sun", "Saturn"], S(9, "40"));
  if (malIn(4).length && malIn(10).length && malIn(12).length) push("pa-evil-9-41", "Malefics in the 4th, 10th and 12th", `${list(malIn(4))}, ${list(malIn(10))} and ${list(malIn(12))} hold the 4th, 10th and 12th. Parashara reads both parents leaving the child to its fate; shown as written.`, "strain", [...malIn(4), ...malIn(10), ...malIn(12)], S(9, "41"));
  if (pos("Rahu").signIndex === pos("Jupiter").signIndex && [1, 4].includes(houseOf("Jupiter")) && pos("Jupiter").dignity === "Inimical") {
    push("pa-evil-9-42", "Rahu and Jupiter in an enemy's sign", `Rahu and Jupiter share ${SIGNS[pos("Jupiter").signIndex]}, an enemy's sign for Jupiter, in the ${ord(houseOf("Jupiter"))}. Parashara reads a father unseen until the native's 23rd year; shown as written.`, "strain", ["Rahu", "Jupiter"], S(9, "42"));
  }

  // ---- 9.43-45: the parents in general ----
  for (const [lum, parent] of [["Sun", "father"], ["Moon", "mother"]] as [Planet, string][]) {
    const p = pos(lum);
    const asp = malAspecting(lum), hem = hemmedByMal(p.signIndex);
    const dus = [6, 8, 4].flatMap((k) => inSign((p.signIndex + k - 1) % 12).filter((q) => !isBen(q) && q.planet !== lum).map((q) => `${q.planet} in the ${ord(k)}`));
    if (asp.length || hem || dus.length) {
      const parts = [asp.length ? `aspected by ${list(asp)}` : "", hem ? "hemmed between malefics" : "", dus.length ? `with ${list(dus)} from it` : ""].filter(Boolean);
      const rated = [...asp, ...dus.map((d) => d.split(" ")[0] as Planet)].filter((pl, i, a) => a.indexOf(pl) === i && strong(pl) !== undefined);
      const weigh = rated.length ? ` By Shadbala ${list(rated.map((pl) => `${pl} is ${strong(pl) ? "strong" : "weak"}`))}, which 9.45 asks to be weighed.` : "";
      const three = lum === "Moon" && asp.length >= 3 ? " Three or more malefic aspects on the Moon are the evil to the mother of 9.24." : "";
      push(`pa-evil-9-43-${lum.toLowerCase()}`, `${lum} afflicted: the ${parent}`, `The ${lum}, indicator of the ${parent}, is ${list(parts)}. Parashara reads inauspicious results for the ${parent}.${three}${weigh}`, "strain", [lum, ...asp], S(9, three ? "24, 43-45" : "43-45"));
    }
  }

  // ---- Chapter 10: antidotes ----
  {
    const kb = (["Mercury", "Jupiter", "Venus"] as Planet[]).filter((pl) => KENDRA.includes(houseOf(pl)));
    if (kb.length) push("pa-evil-10-2", "Benefic in an angle", `${list(kb.map((pl) => H(pl)))}. Parashara says one of Mercury, Jupiter or Venus in an angle destroys all the evils, as the Sun does darkness.`, "support", kb, S(10, "2"));
    if (at("Jupiter", 1) && strong("Jupiter") === true) push("pa-evil-10-3", "Strong Jupiter in the lagna", "Jupiter is in the lagna and above its Shadbala requirement. Parashara says a single strong Jupiter so placed wards off all the evils.", "support", ["Jupiter"], S(10, "3"));
    const l1 = SIGN_LORD[lagnaIdx];
    if (KENDRA.includes(houseOf(l1)) && strong(l1) === true) push("pa-evil-10-4", "Strong lagna lord in an angle", `${l1}, lord of the lagna, is in the ${ord(houseOf(l1))} and above its Shadbala requirement. Parashara says the lagna lord alone, strong in an angle, counteracts all the evils.`, "support", [l1], S(10, "4"));
    const day = shadbala ? shadbala.daytime : (((lagnaLon - sun.lon) % 360) + 360) % 360 < 180;
    const bright = !waning;
    if (!day && bright && benAspectingSign(lagnaIdx).length) push("pa-evil-10-5", "Night birth in the bright half, benefic on the lagna", `A night birth in the bright fortnight, with ${list(benAspectingSign(lagnaIdx))} aspecting the lagna. Parashara says all the evils are destroyed.`, "support", benAspectingSign(lagnaIdx), S(10, "5"));
    if (day && !bright && malAspectingSign(lagnaIdx).length) push("pa-evil-10-5", "Day birth in the dark half, malefic on the lagna", `A day birth in the dark fortnight, with ${list(malAspectingSign(lagnaIdx))} aspecting the lagna. Parashara says all the evils are destroyed.`, "support", malAspectingSign(lagnaIdx), S(10, "5"));
    if (lagnaIdx === 6 && at("Sun", 12)) push("pa-evil-10-6", "Libra lagna with the Sun in the 12th", "For a Libra lagna the Sun in the 12th. Parashara gives a life of a hundred years.", "support", ["Sun"], S(10, "6"));
    if (pos("Mars").signIndex === pos("Jupiter").signIndex || aspects("Jupiter", "Mars")) push("pa-evil-10-7", "Mars joined or aspected by Jupiter", `Jupiter ${pos("Mars").signIndex === pos("Jupiter").signIndex ? "is with" : "aspects"} Mars. Parashara says this is auspicious for the mother and for the native.`, "support", ["Mars", "Jupiter"], S(10, "7"));
    const mals = positions.filter((p) => !isBen(p));
    if (mals.length && mals.every((p) => hemmedByBen(p.signIndex)) && [...KENDRA, ...TRIKONA].every((h) => benIn(h).length || !inHouse(h).length)) {
      push("pa-evil-10-9", "Malefics hemmed, angles and trines benefic", "Every malefic is hemmed between benefics and the occupied angles and trines hold only benefics. Parashara says the evils vanish soon and do not follow from the houses concerned.", "support", mals.map((p) => p.planet), S(10, "9", true));
    }
  }

  return F;
}
