// BPHS chapter 40 (yogas for royal association) and chapter 79 (yogas for asceticism),
// read from http://jyotishvidya.com/ch40.htm and ch79.htm. Chapter 40 uses Parashara's own
// karaka scheme (chapter 32) and arudhas (chapter 29); the karakas follow the eight-karaka
// ranking used in the Jaimini tab so that the two tabs never disagree about who is Atmakaraka.
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { charaKarakas, arudhaOf } from "./jaimini";
import { computeVargas } from "./vargas";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });
const SEVEN: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const navamsaSign = (p: PlanetPosition) => (p.signIndex * 9 + Math.floor(p.degInSign / (30 / 9))) % 12;
/** Drekkana sign, 6.7-8: the first third is the sign itself, the second the 5th sign from it, the third the 9th. */
const drekkanaSign = (p: PlanetPosition) => (p.signIndex + 4 * Math.min(2, Math.floor(p.degInSign / 10))) % 12;
const OWN_OR_EXALTED = ["Exalted", "Moolatrikona", "Own sign"];

/** Holy orders named in 79.2-3, one per planet. */
const ORDER: Record<string, string> = {
  Sun: "a Tapasvi (a life of penance)",
  Moon: "a Kapali (a skull-bearing mendicant)",
  Mars: "a red-robed mendicant",
  Mercury: "a staff-bearing (Ekadandi) ascetic",
  Jupiter: "a Yati",
  Venus: "a Chakradhara (wandering Vaishnava)",
  Saturn: "a Nirgrantha (naked ascetic)",
};

export const ROYAL_CAVEATS: string[] = [
  "Chapter 40 (royal association) is Parashara's own text but works with Atmakaraka, Amatyakaraka, the Arudha lagna, the Arudha of the 9th and the Karakamsa; those are taken exactly as the Jaimini tab computes them (eight karakas, Rahu ranked from the end of its sign), so the two tabs agree on the karakas. When Rahu is a karaka it casts no Parashari aspect and has no dignity here, so verses needing either are not shown for it. The king of the text is read as the state or those in power; the wording of the results is kept.",
  "40.14 counts Venus and the Moon from the Karakamsa in the navamsa chart, as chapter 33 does, and is marked provisional because the verse does not say which chart it means. Chapter 79 (asceticism) takes strength as Shadbala, so 79.2-5 and the stronger-of-two reading of 79.6 are withheld without it. 79.9 planetary war is the Shadbala module's (27.20). The dasa sequence of 79.13, which orders several holy orders in time, is not applied.",
];

export function royalFindings(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const lordOf = (h: number) => SIGN_LORD[signOfHouse(h)];
  const ben = (pl: Planet) => deps.benefic(pos(pl), positions);
  const withPl = (pl: Planet) => positions.filter((p) => p.signIndex === pos(pl).signIndex && p.planet !== pl);
  const beneficsWith = (pl: Planet) => withPl(pl).filter((p) => deps.benefic(p, positions)).map((p) => p.planet);
  const aspects = (a: Planet, b: Planet) => a !== b && deps.aspect(a, pos(a).signIndex, pos(b).signIndex) > 0;
  const aspectsSign = (a: Planet, si: number) => pos(a).signIndex !== si && deps.aspect(a, pos(a).signIndex, si) > 0;
  const joinedOrAspects = (a: Planet, b: Planet) => a !== b && (pos(a).signIndex === pos(b).signIndex || aspects(a, b));
  const aspectedBy = (pl: Planet) => positions.filter((p) => aspects(p.planet, pl)).map((p) => p.planet);
  const maleficOn = (si: number) => positions.filter((p) => !deps.benefic(p, positions) && (p.signIndex === si || aspectsSign(p.planet, si))).map((p) => p.planet);
  const inKT = (h: number) => KENDRA.includes(h) || TRIKONA.includes(h);
  const dignityOk = (pl: Planet) => OWN_OR_EXALTED.includes(pos(pl).dignity);
  const sb = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl);
  const strong = (pl: Planet) => sb(pl)?.strong;
  const push = (id: string, title: string, text: string, tone: ParashariFinding["tone"], planets: Planet[], source: ParashariSource) =>
    F.push({ id, kind: tone === "strain" ? "strain" : "yoga", title, text, tone, planets: Array.from(new Set(planets)), source });
  const vargas = computeVargas(positions, lagnaLon);
  const combust = (pl: Planet) => vargas.planets.find((v) => v.planet === pl)?.combust ?? false;

  // ---- Chapter 40: royal association ----
  const karakas = charaKarakas(positions);
  const AK = karakas.find((k) => k.karaka === "AK")!.planet;
  const AmK = karakas.find((k) => k.karaka === "AmK")!.planet;
  const l1 = lordOf(1), l5 = lordOf(5), l9 = lordOf(9), l10 = lordOf(10), l11 = lordOf(11);
  const dispOf = (pl: Planet) => SIGN_LORD[pos(pl).signIndex];
  const dispAK = dispOf(AK), dispAmK = dispOf(AmK);
  const tag = (pl: Planet, role: string) => `${pl} (${role})`;

  // 40.1
  {
    const byDisp = dispAmK !== l10 && joinedOrAspects(dispAmK, l10);
    const byAmK = AmK !== l10 && joinedOrAspects(AmK, l10);
    if (byDisp || byAmK) {
      const who = byAmK ? tag(AmK, "Amatyakaraka") : tag(dispAmK, `dispositor of Amatyakaraka ${AmK}`);
      const how = pos(byAmK ? AmK : dispAmK).signIndex === pos(l10).signIndex ? "is with" : "aspects";
      push("pa-royal-40-1", "10th lord joined to the Amatyakaraka", `${who} ${how} ${l10}, lord of the 10th. Parashara gives a chief place in the ruler's court, today a leading position in government or a large institution.`, "support", [l10, byAmK ? AmK : dispAmK], S(40, "1"));
    }
  }
  // 40.2
  {
    const m10 = maleficOn(signOfHouse(10)), m11 = maleficOn(signOfHouse(11));
    if (!m10.length && !m11.length && aspectsSign(l11, signOfHouse(11))) {
      push("pa-royal-40-2", "10th and 11th clean, 11th lord aspecting", `No malefic occupies or aspects the 10th or the 11th, and ${l11}, lord of the 11th, aspects its own house from the ${ord(houseOf(l11))}. Parashara gives a chief place in the ruler's court.`, "support", [l11], S(40, "2"));
    }
  }
  // 40.3
  if (dispAK !== AmK && pos(dispAK).signIndex === pos(AmK).signIndex) {
    push("pa-royal-40-3", "Amatyakaraka with the Atmakaraka's dispositor", `${tag(AmK, "Amatyakaraka")} is with ${dispAK}, dispositor of Atmakaraka ${AK}, in ${SIGNS[pos(AmK).signIndex]}. Parashara gives great intelligence and the standing of a minister.`, "support", [AmK, dispAK], S(40, "3"));
  }
  // 40.4
  {
    const bw = beneficsWith(AmK);
    const a = strong(AmK) === true && bw.length > 0;
    const b = dignityOk(AmK);
    if (a || b) {
      const why = b ? `is ${pos(AmK).dignity === "Exalted" ? "exalted" : "in its own sign"} in ${SIGNS[pos(AmK).signIndex]}` : `is above its Shadbala requirement and joined by ${list(bw)}`;
      push("pa-royal-40-4", "Amatyakaraka strong or in dignity", `${tag(AmK, "Amatyakaraka")} ${why}. Parashara says one surely becomes a minister to the ruler.`, "support", [AmK, ...(b ? [] : bw)], S(40, "4"));
    }
  }
  // 40.5
  if (TRIKONA.includes(houseOf(AmK))) {
    push("pa-royal-40-5", "Amatyakaraka in a trine", `${tag(AmK, "Amatyakaraka")} is in the ${ord(houseOf(AmK))}. Parashara gives a minister's office and fame, without doubt.`, "support", [AmK], S(40, "5"));
  }
  // 40.6
  {
    const ks = ([[AK, "Atmakaraka"], [AmK, "Amatyakaraka"]] as [Planet, string][]).filter(([pl]) => inKT(houseOf(pl)));
    if (ks.length) {
      push("pa-royal-40-6", "Karakas in angles or trines", `${list(ks.map(([pl, role]) => `${tag(pl, role)} in the ${ord(houseOf(pl))}`))}. Parashara gives the favour and patronage of those in power, and happiness from it.`, "support", ks.map(([pl]) => pl), S(40, "6"));
    }
  }
  // 40.7
  {
    const AL = arudhaOf(1, lagnaIdx, positions).signIndex;
    const refs: [string, number][] = [[`Atmakaraka ${AK}`, pos(AK).signIndex], ["the Arudha lagna", AL], ["the lagna", lagnaIdx]];
    const mal = (si: number) => positions.filter((p) => p.signIndex === si && !deps.benefic(p, positions)).map((p) => p.planet);
    const hits = refs.map(([name, si]) => ({ name, m3: mal((si + 2) % 12), m6: mal((si + 5) % 12) })).filter((r) => r.m3.length && r.m6.length);
    if (hits.length) {
      const h = hits[0];
      push("pa-royal-40-7", "Malefics in the 3rd and 6th", `${list(h.m3)} in the 3rd and ${list(h.m6)} in the 6th from ${h.name}${hits.length > 1 ? ` (also from ${list(hits.slice(1).map((x) => x.name))})` : ""}. Parashara gives command of forces, an army chief in his words.`, "support", [...h.m3, ...h.m6], S(40, "7"));
    }
  }
  // 40.8
  if ((inKT(houseOf(AK)) || dignityOk(AK)) && aspects(l9, AK)) {
    push("pa-royal-40-8", "Atmakaraka aspected by the 9th lord", `${tag(AK, "Atmakaraka")} is ${inKT(houseOf(AK)) ? `in the ${ord(houseOf(AK))}` : `in its own or exalted sign, ${SIGNS[pos(AK).signIndex]}`} and aspected by ${l9}, lord of the 9th. Parashara gives a minister's office.`, "support", [AK, l9], S(40, "8"));
  }
  // 40.9
  {
    const moonLord = SIGN_LORD[pos("Moon").signIndex];
    if (moonLord === AK && houseOf(AK) === 1 && beneficsWith(AK).length) {
      push("pa-royal-40-9", "Moon-sign lord as Atmakaraka in the lagna", `${AK}, lord of the Moon's sign and Atmakaraka, is in the lagna with ${list(beneficsWith(AK))}. Parashara gives a minister's office in later years.`, "support", [AK, ...beneficsWith(AK)], S(40, "9"));
    }
  }
  // 40.10
  if ([5, 7, 9, 10].includes(houseOf(AK)) && beneficsWith(AK).length) {
    push("pa-royal-40-10", "Atmakaraka with a benefic", `${tag(AK, "Atmakaraka")} is in the ${ord(houseOf(AK))} with ${list(beneficsWith(AK))}. Parashara gives wealth through the patronage of those in power.`, "support", [AK, ...beneficsWith(AK)], S(40, "10"));
  }
  // 40.11
  {
    const A9 = arudhaOf(9, lagnaIdx, positions).signIndex;
    const a = A9 === lagnaIdx, b = houseOf(AK) === 9;
    if (a || b) {
      push("pa-royal-40-11", "Arudha of the 9th or Atmakaraka in the 9th", `${a ? `The Arudha of the 9th falls in ${SIGNS[A9]}, the lagna itself` : ""}${a && b ? ", and " : ""}${b ? `${tag(AK, "Atmakaraka")} is in the 9th` : ""}. Parashara gives association with ruling circles.`, "support", b ? [AK] : [], S(40, "11"));
    }
  }
  // 40.12
  if (houseOf(l11) === 11 && !maleficOn(signOfHouse(11)).length && beneficsWith(AK).length) {
    push("pa-royal-40-12", "11th lord in the 11th, Atmakaraka with a benefic", `${l11}, lord of the 11th, is in its own house free of malefic aspect, and ${tag(AK, "Atmakaraka")} is with ${list(beneficsWith(AK))}. Parashara gives gains through association with those in power.`, "support", [l11, AK, ...beneficsWith(AK)], S(40, "12"));
  }
  // 40.13
  if (l1 !== l10 && pos(l10).signIndex === signOfHouse(1) && pos(l1).signIndex === signOfHouse(10)) {
    push("pa-royal-40-13", "Exchange of the lagna and 10th lords", `${l1}, lord of the lagna, is in the 10th and ${l10}, lord of the 10th, is in the lagna. Parashara gives association with the ruler in a great measure.`, "support", [l1, l10], S(40, "13"));
  }
  // 40.14
  {
    const ka = navamsaSign(pos(AK));
    const fourth = (ka + 3) % 12;
    if (navamsaSign(pos("Venus")) === fourth && navamsaSign(pos("Moon")) === fourth) {
      push("pa-royal-40-14", "Venus and Moon in the 4th from Karakamsa", `In the navamsa, Venus and the Moon are both in ${SIGNS[fourth]}, the 4th from the Karakamsa ${SIGNS[ka]} (navamsa sign of Atmakaraka ${AK}). Parashara gives the insignia of rulership.`, "support", ["Venus", "Moon", AK], S(40, "14", true));
    }
  }
  // 40.15
  {
    const cands = Array.from(new Set([l1, AK])).filter((pl) => pl !== l5 && pos(pl).signIndex === pos(l5).signIndex && inKT(houseOf(l5)));
    if (cands.length) {
      push("pa-royal-40-15", "5th lord joined by the lagna lord or Atmakaraka", `${list(cands.map((pl) => (pl === AK && pl !== l1 ? tag(pl, "Atmakaraka") : pl === l1 && pl === AK ? tag(pl, "lagna lord and Atmakaraka") : tag(pl, "lagna lord"))))} with ${l5}, lord of the 5th, in the ${ord(houseOf(l5))}. Parashara gives a minister's office.`, "support", [...cands, l5], S(40, "15"));
    }
  }

  // ---- Chapter 79: asceticism ----
  const losers = new Set<Planet>((shadbala?.wars ?? []).map((w) => w.loser));
  const relinquish = (pl: Planet) => (losers.has(pl) ? ` ${pl} loses a planetary war at birth, and 79.10 says the order once entered is given up.` : "");
  // 79.2-5
  if (shadbala) {
    const strongSeven = SEVEN.filter((pl) => strong(pl));
    for (let h = 1; h <= 12; h++) {
      const group = strongSeven.filter((pl) => houseOf(pl) === h);
      if (group.length < 4) continue;
      const lead = group.slice().sort((a, b) => (sb(b)?.total ?? 0) - (sb(a)?.total ?? 0))[0];
      const combustOnes = group.filter((pl) => pl !== "Sun" && combust(pl));
      const nonSun = group.filter((pl) => pl !== "Sun");
      let text: string;
      if (nonSun.length && combustOnes.length === nonSun.length && group.includes("Sun")) {
        text = `${list(group)}, all above their Shadbala requirement, share the ${ord(h)}; every planet but the Sun is combust. Parashara reads renunciation under the Sun, as ${ORDER.Sun}.`;
      } else if (combustOnes.includes(lead)) {
        text = `${list(group)}, all above their Shadbala requirement, share the ${ord(h)}, but ${lead}, the strongest, is combust. Parashara reads reverence for a holy order without entering it.`;
      } else {
        text = `${list(group)}, all above their Shadbala requirement, share the ${ord(h)}. Parashara reads a yoga for renunciation; ${lead} is the strongest of the group, so the order is that of ${lead}, ${ORDER[lead]}.${relinquish(lead)}`;
      }
      push(`pa-ascetic-79-2-${h}`, "Four strong planets in one house", text, "mixed", group, S(79, "2-5"));
      break;
    }
  }
  // 79.6-7
  {
    const moonLord = SIGN_LORD[pos("Moon").signIndex];
    const onLord = aspectedBy(moonLord);
    if (moonLord !== "Saturn" && !onLord.length && aspects(moonLord, "Saturn")) {
      const stronger = shadbala ? ((sb(moonLord)?.total ?? 0) >= (sb("Saturn")?.total ?? 0) ? moonLord : "Saturn") : null;
      push("pa-ascetic-79-6", "Moon-sign lord aspecting Saturn", `${moonLord}, lord of the Moon's sign ${SIGNS[pos("Moon").signIndex]}, receives no aspect and itself aspects Saturn. Parashara reads initiation into the order of the stronger of the two${stronger ? `: by Shadbala that is ${stronger}, ${ORDER[stronger]}` : ""}.${stronger ? relinquish(stronger) : ""}`, "mixed", [moonLord, "Saturn"], S(79, "6"));
    } else if (moonLord !== "Saturn" && strong(moonLord) === false && onLord.length === 1 && onLord[0] === "Saturn") {
      push("pa-ascetic-79-7", "Weak Moon-sign lord aspected only by Saturn", `${moonLord}, lord of the Moon's sign, falls short of its Shadbala requirement and is aspected by Saturn alone. Parashara reads initiation into Saturn's order, ${ORDER.Saturn}.${relinquish("Saturn")}`, "mixed", [moonLord, "Saturn"], S(79, "7"));
    }
  }
  // 79.8
  {
    const moon = pos("Moon");
    const dl = SIGN_LORD[drekkanaSign(moon)], nl = SIGN_LORD[navamsaSign(moon)];
    const where = dl === "Saturn" ? `Saturn's drekkana (${SIGNS[drekkanaSign(moon)]})` : nl === "Saturn" || nl === "Mars" ? `${nl}'s navamsa (${SIGNS[navamsaSign(moon)]})` : null;
    if (where && aspects("Saturn", "Moon")) {
      push("pa-ascetic-79-8", "Moon in Saturn's or Mars's portion, aspected by Saturn", `The Moon is in ${where} and aspected by Saturn. Parashara reads renunciation under Saturn's order, ${ORDER.Saturn}.${relinquish("Saturn")}`, "mixed", ["Moon", "Saturn"], S(79, "8"));
    }
  }
  // 79.14
  if (houseOf("Jupiter") === 9 && aspects("Saturn", "Jupiter") && aspects("Saturn", "Moon") && aspectsSign("Saturn", lagnaIdx)) {
    push("pa-ascetic-79-14", "Saturn aspecting Jupiter, Moon and lagna", "Jupiter is in the 9th, and Saturn aspects Jupiter, the Moon and the lagna. Parashara reads, for one who also holds a raja yoga, the founder of a school of thought or a holy order.", "mixed", ["Jupiter", "Saturn", "Moon"], S(79, "14"));
  }
  // 79.15
  if (houseOf("Saturn") === 9 && !aspectedBy("Saturn").length) {
    push("pa-ascetic-79-15", "Saturn alone in the 9th", "Saturn is in the 9th from the lagna and no planet aspects it. Parashara reads renunciation: with a raja yoga, before rising to high standing; without one, the life of a religious wanderer.", "mixed", ["Saturn"], S(79, "15"));
  }

  return F;
}
