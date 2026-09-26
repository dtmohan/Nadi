// BPHS chapter 44 (maraka planets), read from http://jyotishvidya.com/ch44.htm.
// The chapter ranks the planets whose periods Parashara calls marakas. He ties the
// result to the longevity span settled in chapter 43, which this app does not compute;
// where the span is unknown his own 44.19 applies: many strong marakas give disease
// and misery in their periods. Nothing here predicts a term of life.
import { SIGNS, SIGN_LORD, NAKSHATRAS, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL, LAGNA_NATURE } from "./parashari-data";
import { VIMSHOTTARI_ORDER, type Vimshottari } from "./kp";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara 44.${verse}`, url: BPHS_URL(44), provisional });
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
export const MARAKA_CH = BPHS_URL(44);

export interface MarakaEntry {
  planet: Planet;
  /** 1: lords of the 2nd and 7th, malefics there or with those lords (44.2-5). 2: the 8th and 6th lords, the 12th lord's benefic associate, first-rate malefics, the Moon's 2nd and 12th lords, nodes so placed (44.6-7, 18-22). 3: star and drekkana lords whose dasas the text also names (44.15-17). */
  tier: 1 | 2 | 3;
  reasons: { text: string; verse: string; provisional?: boolean }[];
}

export interface StarDasa {
  name: "Vipat" | "Pratyak" | "Vadha";
  /** Which life span the text pairs it with. */
  span: "short" | "medium" | "long";
  star: string;
  lord: Planet;
}

export interface MarakaResult {
  entries: MarakaEntry[];
  /** 44.9: Saturn ill-disposed and related to a maraka kills first. */
  saturnFirst?: string;
  starDasas: StarDasa[];
  star23: { star: string; lord: Planet };
  drekkana22: { signIndex: number; index: number; lord: Planet };
  moonLords: { house: 2 | 12; lord: Planet; malefic: boolean }[];
  nodes: { planet: Planet; reason: string }[];
  current: {
    dasa: Planet;
    bhukti: Planet;
    dasaTier?: 1 | 2 | 3;
    bhuktiTier?: 1 | 2 | 3;
    tone: "support" | "strain" | "mixed";
    text: string;
    verse: string;
  };
  /** 44.25-37: indications from the 3rd and 8th, shown as written. */
  asWritten: ParashariFinding[];
  caveats: string[];
}

export const MARAKA_CAVEATS: string[] = [
  "Chapter 44 names the maraka houses (the 2nd and 7th, the 12th from the two houses of longevity, 44.2) and ranks the planets whose periods can end life: lords of the 2nd and 7th, malefics in them or with their lords (44.3-5), a benefic tied to the 12th lord, the 8th lord and a first-rate malefic (44.6-7), then the 6th lord's dasa with the sub-periods of the 6th, 8th and 12th lords, the lords of the 2nd and 12th from the Moon, and the star and drekkana lords of 44.15-17. Rahu and Ketu take the power when in the lagna, 7th, 8th or 12th, or with or opposite a maraka lord (44.20-22).",
  "Parashara ties every maraka to the life span settled in chapter 43 (44.5, 10-14), which this app does not compute; he also says that many strong marakas give disease and misery in their periods rather than death (44.19). The current period is therefore read as strain on health and vitality only, and no term of life is stated. The three life spans of 44.10-14 are shown for reference.",
  "Provisional readings: a malefic is a natural malefic by 34.8-10; \"related\" is conjunction in one sign or graha drishti either way; a first-rate malefic is a natural malefic that is also a functional malefic for the lagna (ch. 34); \"ill-disposed\" Saturn is one in the 6th, 8th or 12th, debilitated, in an enemy's sign or combust; for the 3rd and 8th house verses an aspect means the full aspect only. The 22nd drekkana is the drekkana of the 8th sign matching the lagna's, with lords by the first, fifth and ninth signs.",
  "Not applied: the Gulika verse 44.28, the fate of the body 44.38-40 and the worlds before and after birth 44.41-45. The indications of the 3rd and 8th houses (44.25-37) are shown as written under their own toggle.",
];

const WATER_FIRE = ["poison, water or fire, a fall from a height or confinement"];

export function computeMarakas(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, vim: Vimshottari, shadbala?: ShadbalaResult): MarakaResult {
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const L = (h: number): Planet => SIGN_LORD[signOfHouse(h)] as Planet;
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const mal = (pl: Planet) => !isBen(pos(pl));
  const inHouse = (h: number) => positions.filter((p) => p.signIndex === signOfHouse(h)).map((p) => p.planet);
  const related = (a: Planet, b: Planet) => {
    if (a === b) return false;
    const pa = pos(a), pb = pos(b);
    return pa.signIndex === pb.signIndex || deps.aspect(a, pa.signIndex, pb.signIndex) > 0 || deps.aspect(b, pb.signIndex, pa.signIndex) > 0;
  };
  const strong = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl)?.strong;

  const map = new Map<Planet, MarakaEntry>();
  const add = (pl: Planet, tier: 1 | 2 | 3, text: string, verse: string, provisional?: boolean) => {
    const e = map.get(pl) ?? { planet: pl, tier, reasons: [] };
    e.tier = Math.min(e.tier, tier) as 1 | 2 | 3;
    e.reasons.push({ text, verse, provisional });
    map.set(pl, e);
  };

  // 44.2-5
  const l2 = L(2), l7 = L(7);
  if (l2 === l7) add(l2, 1, "lord of both the 2nd and the 7th, the maraka houses", "3-4");
  else { add(l2, 1, "lord of the 2nd, the stronger maraka house", "3-4"); add(l7, 1, "lord of the 7th", "3-4"); }
  for (const h of [2, 7] as const) for (const pl of inHouse(h)) if (mal(pl) && pl !== l2 && pl !== l7) add(pl, 1, `malefic in the ${ord(h)}`, "4");
  for (const lord of Array.from(new Set([l2, l7]))) for (const pl of positions.filter((p) => p.signIndex === pos(lord).signIndex && p.planet !== lord && !isBen(p)).map((p) => p.planet)) add(pl, 1, `malefic with the ${l2 === l7 ? "2nd and 7th" : lord === l2 ? "2nd" : "7th"} lord ${lord}`, "4");
  // 44.6-7
  const l12 = L(12), l8 = L(8), l6 = L(6);
  for (const p of positions) if (isBen(p) && p.planet !== l12 && related(p.planet, l12)) add(p.planet, 2, `benefic related to the 12th lord ${l12}`, "6", true);
  add(l8, 2, "lord of the 8th", "6-7");
  const nature = LAGNA_NATURE[lagnaIdx];
  for (const pl of positions.map((p) => p.planet)) if (mal(pl) && nature.malefic.includes(pl) && !["Rahu", "Ketu"].includes(pl)) add(pl, 2, "a first-rate malefic: natural and functional malefic for this lagna", "7", true);
  // 44.18-19
  add(l6, 2, "lord of the 6th, whose dasa and sub-periods the text names", "18");
  if (l12 !== l6 && l12 !== l8) add(l12, 3, "lord of the 12th, named for sub-periods", "18");
  // Moon's 2nd and 12th
  const moonSign = pos("Moon").signIndex;
  const moonLords = ([2, 12] as (2 | 12)[]).map((h) => {
    const lord = SIGN_LORD[(moonSign + h - 1) % 12] as Planet;
    const m = mal(lord);
    if (m) add(lord, 2, `malefic lord of the ${ord(h)} from the Moon`, "17-18");
    return { house: h, lord, malefic: m };
  });
  // 44.15-17 star dasas
  const birthStar = pos("Moon").nakshatraIndex;
  const starLord = (idx: number) => VIMSHOTTARI_ORDER[((idx % 27) + 27) % 27 % 9];
  const starDasas: StarDasa[] = ([["Vipat", 3, "short"], ["Pratyak", 5, "medium"], ["Vadha", 7, "long"]] as [StarDasa["name"], number, StarDasa["span"]][]).map(([name, n, span]) => {
    const idx = (birthStar + n - 1) % 27;
    const lord = starLord(idx);
    add(lord, 3, `lord of the ${name} star (${ord(n)} from the birth star), paired with a ${span} life`, "15-16");
    return { name, span, star: NAKSHATRAS[idx], lord };
  });
  const i23 = (birthStar + 22) % 27;
  const star23 = { star: NAKSHATRAS[i23], lord: starLord(i23) };
  add(star23.lord, 3, "lord of the 23rd star from the birth star", "17");
  const lagnaDeg = ((lagnaLon % 360) + 360) % 360 - lagnaIdx * 30;
  const dIdx = Math.min(2, Math.floor(lagnaDeg / 10));
  const d22Sign = (lagnaIdx + 7) % 12;
  const drekkana22 = { signIndex: d22Sign, index: dIdx, lord: SIGN_LORD[(d22Sign + dIdx * 4) % 12] as Planet };
  add(drekkana22.lord, 3, `lord of the 22nd drekkana (${SIGNS[d22Sign]}, ${ord(dIdx + 1)} drekkana)`, "17", true);
  // Nodes 44.20-22
  const nodes: { planet: Planet; reason: string }[] = [];
  const marakaLords = Array.from(map.values()).filter((e) => e.tier === 1).map((e) => e.planet);
  for (const nd of ["Rahu", "Ketu"] as Planet[]) {
    const h = houseOf(nd);
    const reasons: string[] = [];
    if ([1, 7, 8, 12].includes(h)) reasons.push(`in the ${ord(h)}`);
    for (const m of marakaLords) {
      if (m === nd) continue;
      if (houseFrom(pos(m).signIndex, pos(nd).signIndex) === 7) reasons.push(`opposite the maraka ${m}`);
      else if (pos(m).signIndex === pos(nd).signIndex) reasons.push(`with the maraka ${m}`);
    }
    if (reasons.length) {
      nodes.push({ planet: nd, reason: list(reasons) });
      add(nd, 2, `node ${list(reasons)}`, "20-22");
    }
  }
  // 44.9 Saturn
  let saturnFirst: string | undefined;
  {
    const sa = pos("Saturn");
    const h = houseOf("Saturn");
    const ill = [6, 8, 12].includes(h) || ["Debilitated", "Inimical"].includes(sa.dignity) || sa.combust;
    const rel = marakaLords.filter((m) => m !== "Saturn" && related("Saturn", m));
    if (ill && rel.length) saturnFirst = `Saturn is ill-disposed (${[6, 8, 12].includes(h) ? `in the ${ord(h)}` : sa.combust ? "combust" : sa.dignity.toLowerCase()}) and related to the maraka ${list(rel)}: Parashara gives it the first claim among the marakas (44.9).`;
  }

  const entries = Array.from(map.values()).sort((a, b) => a.tier - b.tier || b.reasons.length - a.reasons.length);

  // Current period, 44.5, 8, 18-19
  const cur = vim.current;
  const dasa = cur.dasa.lord, bhukti = cur.bhukti.lord;
  const dT = map.get(dasa)?.tier, bT = map.get(bhukti)?.tier;
  let tone: MarakaResult["current"]["tone"] = "support";
  let text: string;
  let verse = "5, 19";
  const subOnly = [l6, l8, l12].includes(bhukti);
  if (dT === 1 && (bT === 1 || (bT !== undefined && mal(bhukti)))) {
    tone = "strain";
    text = `The ${dasa} dasa and the ${bhukti} sub-period are both maraka periods by Parashara's ranking. He allows death only when the life span of chapter 43 has run, which is not judged here; otherwise he says disease and misery (44.19), so this is read as a stretch calling for care of health.`;
  } else if (dT !== undefined && mal(dasa) && bT === undefined && !mal(bhukti)) {
    tone = "mixed";
    text = `The ${dasa} dasa is a maraka period (tier ${dT}), but the sub-period of the benefic ${bhukti}, unrelated to the marakas, does not bring the result (44.8). Read as a milder stretch; care of health in the malefic sub-periods to come.`;
    verse = "8";
  } else if (dT !== undefined || bT !== undefined || subOnly) {
    tone = "mixed";
    const parts: string[] = [];
    if (dT !== undefined) parts.push(`the ${dasa} dasa is a maraka period (tier ${dT})`);
    if (bT !== undefined) parts.push(`the ${bhukti} sub-period is a maraka period (tier ${bT})`);
    else if (subOnly) parts.push(`the ${bhukti} sub-period belongs to a lord of the 6th, 8th or 12th, which the text names for sub-periods (44.18)`);
    text = `${parts.join("; ").replace(/^./, (c) => c.toUpperCase())}. Without the life span of chapter 43 this reads as strain on health and vitality, not as a term (44.19).${mal(bhukti) && dT !== undefined ? " A malefic sub-period counts even without relation to the dasa lord (44.8)." : ""}`;
    verse = subOnly && dT === undefined && bT === undefined ? "18-19" : "5, 8, 19";
  } else {
    text = `Neither the ${dasa} dasa nor the ${bhukti} sub-period belongs to a planet Parashara ranks as a maraka.`;
  }

  // 44.25-37 as written
  const asWritten: ParashariFinding[] = [];
  const W = (id: string, title: string, t: string, planets: Planet[], v: string, tone: ParashariFinding["tone"] = "mixed", provisional?: boolean) =>
    asWritten.push({ id: `mk-${id}`, kind: "yoga", title, text: t, tone, planets, source: S(v, provisional) });
  const third = signOfHouse(3);
  const on3 = (pl: Planet) => pos(pl).signIndex === third || deps.aspect(pl, pos(pl).signIndex, third) === 4;
  const occ3 = inHouse(3);
  const causes: Record<string, [string, string]> = {
    Sun: ["through those in power or the law", "25"],
    Moon: ["through consumption", "26"],
    Mars: ["through wounds, weapons, fire or thirst", "26"],
    Mercury: ["following fever", "29"],
    Jupiter: ["through swelling or tumours", "30"],
    Venus: ["through urinary disease", "30"],
  };
  const hits: string[] = [];
  const hitPl: Planet[] = [];
  for (const pl of Object.keys(causes) as Planet[]) {
    if (!on3(pl)) continue;
    if (pl === "Sun" && strong("Sun") === false) continue;
    hits.push(`${pl}: ${causes[pl][0]}`);
    hitPl.push(pl);
  }
  if (on3("Saturn") && on3("Rahu")) { hits.push(`Saturn and Rahu: ${WATER_FIRE[0]}`); hitPl.push("Saturn", "Rahu"); }
  if (hits.length) W("3rd-cause", "Occupants and aspects on the 3rd", `${hits.join("; ")}. ${hits.length > 1 ? "Many planets: through many diseases (44.31). " : ""}Parashara's verses on the manner of the end, shown as written.`, hitPl, "25-31", "mixed", true);
  if (occ3.length) {
    const b = occ3.filter((pl) => !mal(pl)), m = occ3.filter(mal);
    W("3rd-place", "Occupant of the 3rd and the place", b.length && m.length ? "Benefic and malefic together in the 3rd: a mixed reading of the place." : b.length ? `Benefic ${list(b)} in the 3rd: in an auspicious place, such as a shrine.` : `Malefic ${list(m)} in the 3rd: in a place the text calls sinful, shown as written.`, occ3, "32");
    W("3rd-mind", "Awareness at the end", occ3.some((pl) => pl === "Jupiter" || pl === "Venus") ? "Jupiter or Venus in the 3rd: consciousness prevails." : "Other planets in the 3rd: the text says unconsciousness before the end.", occ3, "33");
  }
  W("3rd-kind", `The 3rd is ${SIGNS[third]}`, `A ${third % 3 === 0 ? "movable sign: in a place other than one's own" : third % 3 === 1 ? "fixed sign: in one's own house" : "dual sign: on the way"} (44.34).`, [], "34");
  const occ8 = inHouse(8);
  const eighth: Partial<Record<Planet, string>> = { Sun: "fire", Moon: "water", Mars: "weapons", Mercury: "fever", Jupiter: "disease", Venus: "hunger", Saturn: "thirst" };
  const e8 = occ8.filter((pl) => eighth[pl]);
  if (e8.length) W("8th", "Occupant of the 8th", `${e8.map((pl) => `${pl}: through ${eighth[pl]}`).join("; ")} (44.35-36), shown as written.`, e8, "35-36");
  {
    const eightSign = signOfHouse(8);
    const benOn8 = positions.filter((p) => isBen(p) && (p.signIndex === eightSign || deps.aspect(p.planet, p.signIndex, eightSign) === 4)).map((p) => p.planet);
    const l9 = L(9);
    const benWith9 = positions.filter((p) => isBen(p) && p.planet !== l9 && p.signIndex === pos(l9).signIndex).map((p) => p.planet);
    if (benOn8.length && benWith9.length) W("8th-shrine", "Benefic on the 8th, 9th lord with a benefic", `${list(benOn8)} on the 8th and ${list(benWith9)} with the 9th lord ${l9}: the end in a shrine (44.37).`, [...benOn8, ...benWith9], "37", "support", true);
  }

  return {
    entries,
    saturnFirst,
    starDasas,
    star23,
    drekkana22,
    moonLords,
    nodes,
    current: { dasa, bhukti, dasaTier: dT, bhuktiTier: bT, tone, text, verse },
    asWritten,
    caveats: MARAKA_CAVEATS,
  };
}
