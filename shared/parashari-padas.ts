// BPHS chapters 29-33 as Parashara gives them: bhava and graha padas (29), the Upapada (30),
// Argala (31), the chara karakas and constant significators (32) and the Karakamsa (33).
// Read from http://jyotishvidya.com/ch29.htm .. ch33.htm. The arithmetic of the padas and of
// rasi drishti is shared with the Jaimini tab; the readings here are Parashara's own and are
// kept apart from the Rao-based Jaimini readings.
import { EXALTATION, SIGNS, SIGN_LORD, OWN_SIGNS, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { arudhaOf, navamsaOf, rasiAspects } from "./jaimini";
import type { ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (ch: number, verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUS = [6, 8, 12];
/** Signs owned by the natural malefics Sun, Mars and Saturn (provisional reading of "a malefic's sign"). */
const MALEFIC_SIGNS = [0, 4, 7, 9, 10];
const NODES: Planet[] = ["Rahu", "Ketu"];

export const PADA_CH = { 29: BPHS_URL(29), 30: BPHS_URL(30), 31: BPHS_URL(31), 32: BPHS_URL(32), 33: BPHS_URL(33) };

// ── Types ───────────────────────────────────────────────────────────────────────

export interface BhavaPada {
  house: number;
  /** AL, A2 .. A11, UL. */
  label: string;
  houseSign: number;
  lord: Planet;
  lordSign: number;
  signIndex: number;
  /** 29.4-5: the count fell in the house or its 7th and was moved on. */
  exception: boolean;
}

export interface GrahaPada {
  planet: Planet;
  ownSign: number;
  signIndex: number;
  /** The planet owns two signs; both padas are given (29.7 asks for the stronger, which is not decided here). */
  alternative: boolean;
}

export const KARAKA_NAMES_32 = [
  { id: "AK", name: "Atmakaraka", matters: "the self; the king of the chart (32.8-12)" },
  { id: "AmK", name: "Amatyakaraka", matters: "the minister: work and counsel" },
  { id: "BK", name: "Bhratrikaraka", matters: "brothers and sisters" },
  { id: "MK", name: "Matrikaraka (and Putrakaraka, 32.16)", matters: "mother, and children by the merged reading" },
  { id: "PiK", name: "Pitrikaraka", matters: "father" },
  { id: "GK", name: "Gnatikaraka", matters: "kin and rivals" },
  { id: "DK", name: "Darakaraka (Streekaraka)", matters: "the spouse" },
] as const;

export interface Karaka32 {
  id: (typeof KARAKA_NAMES_32)[number]["id"];
  name: string;
  matters: string;
  planet: Planet;
  degInSign: number;
}

export interface ConstantKaraka {
  matter: string;
  planet: Planet;
  /** House counted from the planet that also shows the matter, 32.22-24. */
  house?: number;
  note?: string;
}

export interface ArgalaEntry {
  /** 2, 4, 11 (primary) or 5 (secondary); for a node the reversed house is given here too. */
  house: number;
  planets: Planet[];
  obstructingHouse: number;
  obstructedBy: Planet[];
  /** Vipareeta: three or more malefics in the 3rd, 31.5. */
  vipareeta?: boolean;
  /** Argala prevails: more planets than obstructors, or equal in number and stronger by Shadbala (31.4). */
  prevails: boolean;
}

export interface ArgalaOn {
  target: string;
  signIndex: number;
  entries: ArgalaEntry[];
  /** Planets whose argala on this sign prevails. */
  net: Planet[];
  benefics: Planet[];
  malefics: Planet[];
}

export interface HouseArgala {
  house: number;
  signIndex: number;
  net: Planet[];
  tone: "support" | "strain" | "mixed" | "none";
  /** 31.12-17. */
  matter: string;
}

export interface YogaKaraka32 {
  planet: Planet;
  dignity: string;
  house: number;
  /** Planets with dignity in mutual angles from this one. */
  partners: Planet[];
}

export interface PadaResult {
  padas: BhavaPada[];
  grahaPadas: GrahaPada[];
  karakas: Karaka32[];
  constants: ConstantKaraka[];
  yogaKarakas: YogaKaraka32[];
  karakamsa: { signIndex: number; ak: Planet; akDegNavamsa: number; lagnaNavamsa: number };
  /** Navamsa sign of every planet, used for the Karakamsa readings. */
  navamsa: { planet: Planet; signIndex: number }[];
  argalas: ArgalaOn[];
  houseArgalas: HouseArgala[];
  findings: ParashariFinding[];
  caveats: string[];
}

export const PADA_CAVEATS: string[] = [
  "Padas follow 29.1-5: count from a house to its lord and as far again; when that lands in the house itself the 10th from it is taken, when in its 7th the 4th from the house (which is where the lord stands, 29.5). The Upapada is the pada of the 12th, the translator's \"bhava following the natal ascendant\" read as the house preceding it, as the Jaimini tradition does (provisional). Graha padas (29.6-7) are counted from a planet to its own sign and as far again; for the five planets that own two signs both padas are listed, since the text asks for the stronger sign without saying how it is weighed. Aspect in chapters 29-33 is taken as rasi drishti, the sign aspect used with padas and karakas (movable signs see the fixed signs but the next one, fixed signs see the movable signs but the previous one, dual signs see one another); Parashara does not name the aspect in these chapters, so this is provisional. Benefics are Jupiter, Venus, the bright Moon and Mercury not with a malefic (34.8-10); a malefic's sign is one owned by Sun, Mars or Saturn (provisional).",
  "Chapter 32 gives the seven-planet scheme first (32.1: \"from among the 7 planets viz. the Sun to Saturn\"), so the karakas here are seven, with Matrikaraka and Putrakaraka merged as 32.16 allows; the Jaimini tab keeps the eight-karaka scheme with Rahu that 32.2 records as another view, so the two tables can differ. Constant significators follow 32.18-24; the stronger of Sun and Venus for the father and of Moon and Mars for the mother is decided by Shadbala, and defaults to the Sun and the Moon when no Shadbala is present (provisional). Yogakarakas of 32.25-30 are planets in own, exalted, moolatrikona or friendly signs standing in mutual angles (1, 4, 7, 10 from one another), the translation's \"mutual angles identical with own signs, exaltation, or friendly sign\"; the sentence that planets with such dignity in other houses also qualify is not applied, since it would make the angle condition idle.",
  "Argala (31.2-9) counts planets in the 2nd, 4th and 11th from a sign as intervening and those in the 12th, 10th and 3rd as obstructing, the 5th intervening and the 9th obstructing; the argala prevails when its planets outnumber the obstructors or, when equal, weigh more by Shadbala (31.4, provisional without Shadbala: equal numbers then count as obstructed). Three or more malefics in the 3rd make Vipareeta argala, favourable (31.5). Rahu and Ketu are counted in reverse (31.6): a node in the 12th intervenes as if in the 2nd, in the 10th as if in the 4th, in the 3rd as if in the 11th and in the 9th as if in the 5th, and obstructs from the opposite side. The quarter-of-sign rule of 31.10 is not applied. The house effects of 31.12-17 are read for each house with a prevailing argala, benefic or malefic by the planets that cause it.",
  "Karakamsa is the navamsa sign of the Atmakaraka (33.1); planets \"in Karakamsa\" and in the houses counted from it are taken in the navamsa, and aspects there by rasi drishti (provisional; some read the Karakamsa sign in the rasi chart instead). 33.9 uses the lagna's navamsa. Not applied: 33.11 (Upakheta), 33.20 (Shadvargas), 33.23-24 and 33.38 (Gulika is not computed), 33.28 (parentage) and 33.54 (six identical vargas). The Kemadruma of 33.94-99 is tested on the Karakamsa in the navamsa and on the Arudha lagna in the rasi chart, with malefics in both the 2nd and 8th from either. Verses on power (\"king\") are glossed as standing among those in power; verses whose wording is hard (thief, others' spouses, mean deities) are shown as written with Parashara's words marked.",
];

// ── Computation ─────────────────────────────────────────────────────────────────

export function computePadas(positions: PlanetPosition[], lagnaIdx: number, lagnaLon: number, deps: HouseDeps, shadbala?: ShadbalaResult): PadaResult {
  const F: ParashariFinding[] = [];
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const benSet = new Set(positions.filter(isBen).map((p) => p.planet));
  const ben = (pl: Planet) => benSet.has(pl);
  const sb = (pl: Planet) => shadbala?.planets.find((x) => x.planet === pl);
  const strong = (pl: Planet): boolean | undefined => (shadbala ? !!sb(pl)?.strong : undefined);
  const rupas = (pl: Planet) => sb(pl)?.total ?? 0;
  const signOfHouse = (h: number) => (lagnaIdx + h - 1) % 12;
  const isOdd = (si: number) => si % 2 === 0;
  const exalted = (pl: Planet) => pos(pl).dignity === "Exalted";
  const debil = (pl: Planet) => pos(pl).dignity === "Debilitated";
  const ownSign = (pl: Planet) => pos(pl).dignity === "Own sign" || pos(pl).dignity === "Moolatrikona";
  const navExalted = (pl: Planet, nav: number) => EXALTATION[pl]?.sign === nav;
  const navDebil = (pl: Planet, nav: number) => EXALTATION[pl] !== undefined && (EXALTATION[pl]!.sign + 6) % 12 === nav;
  const glossKing = "Parashara's word is king: standing among those in power.";

  type Pt = { planet: Planet; signIndex: number };
  const rasiPts: Pt[] = positions.map((p) => ({ planet: p.planet, signIndex: p.signIndex }));
  const navamsa: Pt[] = positions.map((p) => ({ planet: p.planet, signIndex: navamsaOf(p.lon).signIndex }));
  const occ = (pts: Pt[], si: number) => pts.filter((p) => p.signIndex === si).map((p) => p.planet);
  const asp = (pts: Pt[], si: number) => pts.filter((p) => rasiAspects(p.signIndex, si)).map((p) => p.planet);
  const infl = (pts: Pt[], si: number) => Array.from(new Set([...occ(pts, si), ...asp(pts, si)]));
  const rel = (base: number, h: number) => (base + h - 1) % 12;
  const push = (id: string, title: string, text: string, tone: ParashariFinding["tone"], planets: Planet[], ch: number, verse: string, provisional?: boolean) => {
    if (F.some((f) => f.id === id)) return;
    F.push({ id, kind: "yoga", title: cap(title), text: cap(text), tone, planets: Array.from(new Set(planets)), source: S(ch, verse, provisional) });
  };

  // Padas (29.1-5) and graha padas (29.6-7).
  const padas: BhavaPada[] = Array.from({ length: 12 }, (_, i) => {
    const a = arudhaOf(i + 1, lagnaIdx, positions);
    return { house: a.house, label: a.label, houseSign: a.houseSign, lord: a.lord, lordSign: a.lordSign, signIndex: a.signIndex, exception: a.corrected };
  });
  const AL = padas[0].signIndex;
  const UL = padas[11].signIndex;
  const A7 = padas[6].signIndex;
  const A2 = padas[1].signIndex;
  const grahaPadas: GrahaPada[] = [];
  for (const pl of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as Planet[]) {
    const owns = OWN_SIGNS[pl] ?? [];
    for (const own of owns) {
      const p = pos(pl);
      let pada = (2 * own - p.signIndex + 24) % 12;
      const r = houseFrom(p.signIndex, pada);
      if (r === 1 || r === 7) pada = (pada + 9) % 12;
      grahaPadas.push({ planet: pl, ownSign: own, signIndex: pada, alternative: owns.length > 1 });
    }
  }

  // Chara karakas, seven-planet scheme (32.1, 32.3-8, 32.13-17).
  const seven: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const ranked = seven.map((pl) => ({ pl, d: pos(pl).degInSign })).sort((a, b) => b.d - a.d);
  const karakas: Karaka32[] = ranked.map((r, i) => ({ id: KARAKA_NAMES_32[i].id, name: KARAKA_NAMES_32[i].name, matters: KARAKA_NAMES_32[i].matters, planet: r.pl, degInSign: r.d }));
  const AK = karakas[0].planet;
  const akNav = navamsaOf(pos(AK).lon);
  const KA = akNav.signIndex;
  const lagnaNav = navamsaOf(lagnaLon).signIndex;

  // Constant significators, 32.18-24.
  const stronger = (a: Planet, b: Planet) => (shadbala ? (rupas(a) >= rupas(b) ? a : b) : a);
  const father = stronger("Sun", "Venus");
  const mother = stronger("Moon", "Mars");
  const constants: ConstantKaraka[] = [
    { matter: "Father", planet: father, house: 9, note: shadbala ? `the stronger of Sun and Venus by Shadbala; the 9th from the Sun also shows the father` : "Sun by default; the text asks for the stronger of Sun and Venus" },
    { matter: "Mother", planet: mother, house: 4, note: shadbala ? `the stronger of Moon and Mars by Shadbala; the 4th from the Moon also shows the mother` : "Moon by default; the text asks for the stronger of Moon and Mars" },
    { matter: "Brothers, sister, brother-in-law", planet: "Mars", house: 3 },
    { matter: "Maternal relatives", planet: "Mercury", house: 6 },
    { matter: "Paternal grandfather; sons", planet: "Jupiter", house: 5 },
    { matter: "Husband (in a woman's chart); spouse", planet: "Venus", house: 7 },
    { matter: "Sons; death", planet: "Saturn", house: 8 },
    { matter: "Spouse, parents, parents-in-law, maternal grandfather", planet: "Ketu" },
  ];

  // Yogakarakas, 32.25-30.
  const dignified = positions.filter((p) => ["Exalted", "Moolatrikona", "Own sign", "Friendly"].includes(p.dignity));
  const yogaKarakas: YogaKaraka32[] = dignified
    .map((p) => {
      const partners = dignified.filter((q) => q.planet !== p.planet && KENDRA.includes(houseFrom(p.signIndex, q.signIndex))).map((q) => q.planet);
      return { planet: p.planet, dignity: p.dignity, house: houseFrom(lagnaIdx, p.signIndex), partners };
    })
    .filter((y) => y.partners.length > 0);
  if (yogaKarakas.length) {
    const tenth = yogaKarakas.filter((y) => y.house === 10).map((y) => y.planet);
    push(
      "pd-32-yogakaraka",
      "Yogakarakas",
      `${list(yogaKarakas.map((y) => `${y.planet} (${y.dignity.toLowerCase()}, ${ord(y.house)})`))} stand in mutual angles with dignity, Parashara's yogakarakas; ${yogaKarakas.length > 2 ? "with several such planets the text promises rank and affluence even to one of modest birth" : "the effect follows the number of such planets and the native's station"}.${tenth.length ? ` ${list(tenth)} in the 10th counts especially (32.27).` : ""}`,
      "support",
      yogaKarakas.map((y) => y.planet),
      32,
      "25-30",
      true,
    );
  }

  // Argala, 31.2-9.
  const PAIRS = [
    { house: 2, obs: 12 },
    { house: 4, obs: 10 },
    { house: 11, obs: 3 },
    { house: 5, obs: 9 },
  ];
  const argalaOn = (si: number): ArgalaEntry[] => {
    const at = (h: number, reverse: boolean) => rasiPts.filter((p) => (NODES.includes(p.planet) === reverse) && houseFrom(si, p.signIndex) === h).map((p) => p.planet);
    return PAIRS.map(({ house, obs }) => {
      // Ordinary planets in the argala house, nodes in the obstructing house (reverse count) intervene.
      const planets = [...at(house, false), ...at(obs, true)];
      const obstructedBy = [...at(obs, false), ...at(house, true)];
      const vipareeta = house === 11 && obstructedBy.filter((pl) => !ben(pl)).length >= 3;
      let prevails = planets.length > obstructedBy.length;
      if (!prevails && planets.length > 0 && planets.length === obstructedBy.length && shadbala) {
        const sum = (xs: Planet[]) => xs.reduce((s, pl) => s + rupas(pl), 0);
        prevails = sum(planets) > sum(obstructedBy);
      }
      return { house, planets, obstructingHouse: obs, obstructedBy, vipareeta, prevails };
    }).filter((e) => e.planets.length > 0 || e.vipareeta);
  };
  const argalaSummary = (target: string, si: number): ArgalaOn => {
    const entries = argalaOn(si);
    const net = Array.from(new Set(entries.flatMap((e) => (e.prevails ? e.planets : e.vipareeta ? e.obstructedBy : []))));
    return { target, signIndex: si, entries, net, benefics: net.filter(ben), malefics: net.filter((pl) => !ben(pl)) };
  };
  const argalas: ArgalaOn[] = [
    argalaSummary("Lagna", lagnaIdx),
    argalaSummary("Arudha lagna", AL),
    argalaSummary("7th from lagna", signOfHouse(7)),
    argalaSummary("7th from Arudha lagna", (AL + 6) % 12),
  ];
  const HOUSE_ARGALA_MATTER = ["fame", "wealth and grain", "happiness from co-born", "residence, cattle and relatives", "children, grandchildren and intelligence", "fear from enemies", "wealth and marital happiness", "difficulties", "fortune", "honour from the state", "gains", "expenses"];
  const houseArgalas: HouseArgala[] = Array.from({ length: 12 }, (_, i) => {
    const si = signOfHouse(i + 1);
    const a = argalaSummary(`${ord(i + 1)} house`, si);
    const tone: HouseArgala["tone"] = a.net.length === 0 ? "none" : a.benefics.length && a.malefics.length ? "mixed" : a.benefics.length ? "support" : "strain";
    return { house: i + 1, signIndex: si, net: a.net, tone, matter: HOUSE_ARGALA_MATTER[i] };
  });
  if (argalas.every((a) => a.net.length > 0)) {
    push("pd-31-11", "Argala on the lagna, its pada and both their 7ths", `All four of the lagna, the Arudha lagna and the 7th from each carry a prevailing argala (${argalas.map((a) => `${a.target}: ${a.net.join(", ")}`).join("; ")}): Parashara promises fame and fortune.`, "support", argalas.flatMap((a) => a.net), 31, "11");
  }
  if ([1, 5, 9].every((h) => houseArgalas[h - 1].net.length > 0)) {
    push("pd-31-18", "Argala on the 1st, 5th and 9th", `The lagna, the 5th and the 9th each carry a prevailing argala (${[1, 5, 9].map((h) => `${ord(h)}: ${houseArgalas[h - 1].net.join(", ")}`).join("; ")}). ${glossKing} Parashara adds fortunate.`, "support", [1, 5, 9].flatMap((h) => houseArgalas[h - 1].net), 31, "18");
  }
  const vip = argalas.filter((a) => a.entries.some((e) => e.vipareeta));
  for (const a of vip) push(`pd-31-5-${a.signIndex}`, `Vipareeta argala on the ${a.target}`, `Three or more malefics in the 3rd from ${SIGNS[a.signIndex]} (${a.entries.find((e) => e.vipareeta)!.obstructedBy.join(", ")}): Parashara calls this a more effective intervention, harmless and very favourable.`, "support", a.entries.find((e) => e.vipareeta)!.obstructedBy, 31, "5");

  // ── Chapter 29 rules from a pada, also read from the Karakamsa (29.29). ──
  const padaRules = (base: number, pts: Pt[], tag: string, from: string, prov: boolean, canArgala: boolean) => {
    const h = (n: number) => rel(base, n);
    const in11 = occ(pts, h(11));
    const in12 = occ(pts, h(12));
    const in7 = occ(pts, h(7));
    const in2 = occ(pts, h(2));
    if (in11.length) {
      const b = in11.filter(ben), m = in11.filter((pl) => !ben(pl));
      const means = b.length && m.length ? "through both fair and questionable means" : b.length ? "through fair means" : "through means Parashara calls questionable";
      const dig = in11.filter((pl) => exalted(pl) || ownSign(pl));
      push(`pd-29-8-${tag}`, `Planets in the 11th from ${from}`, `${list(in11)} in the 11th from ${from} (${SIGNS[h(11)]}): happiness and wealth, ${means}.${dig.length ? ` ${list(dig)} in ${dig.length > 1 ? "their own or exaltation signs" : exalted(dig[0]) ? "exaltation" : "own sign"}: plenty of gains and happiness (29.11).` : ""}`, m.length && !b.length ? "mixed" : "support", in11, 29, "8-11", prov);
    }
    const asp11 = asp(pts, h(11)), asp12 = asp(pts, h(12));
    if (asp11.length && !asp12.length && !in12.length) push(`pd-29-12-${tag}`, `Gains uninterrupted from ${from}`, `The 11th from ${from} is aspected (${list(asp11)}) while its 12th is neither aspected nor occupied: the gains come uninterrupted.`, "support", asp11, 29, "12", true);
    const q = infl(pts, h(11));
    if (q.length && canArgala) {
      const ag = argalaOn(h(11)).filter((e) => e.prevails);
      const agPl = ag.flatMap((e) => e.planets);
      const bAg = agPl.filter(ben);
      const clean12 = !in12.some((pl) => !ben(pl)) && !asp12.some((pl) => !ben(pl));
      push(`pd-29-13-${tag}`, `Measure of gains from ${from}`, `${q.length} planet${q.length > 1 ? "s" : ""} (${list(q)}) in or aspecting the 11th from ${from}; the text grades the gains by this count.${agPl.length ? ` Argala on that 11th by ${list(agPl)}${bAg.length ? `, benefic through ${list(bAg)}${bAg.some(exalted) ? " in exaltation" : ""}` : ""}: more gains.` : ""}${clean12 ? " Its 12th is free of malefics, as the verse requires." : " Its 12th carries a malefic, which the verse asks to be absent."}`, clean12 ? "support" : "mixed", q, 29, "13-15", true);
    }
    const src = (house: number, pls: Planet[], hName: string, verb: string) => {
      const has = (pl: Planet) => pls.includes(pl);
      const aspH = asp(pts, h(house));
      if (has("Sun") && has("Venus") && has("Rahu")) push(`pd-29-18-${house}-${tag}`, `Sun, Venus and Rahu in the ${hName} from ${from}`, `${verb} through the state${aspH.includes("Moon") ? ", more so with the Moon's aspect" : ""}.`, house === 12 ? "strain" : "support", ["Sun", "Venus", "Rahu"], 29, house === 12 ? "18" : "18, 22", prov);
      if (has("Mercury")) {
        const withB = pls.some((pl) => pl !== "Mercury" && ben(pl)) || aspH.some(ben);
        const withM = pls.some((pl) => pl !== "Mercury" && !ben(pl)) || aspH.some((pl) => !ben(pl));
        if (withB) push(`pd-29-19b-${house}-${tag}`, `Mercury in the ${hName} from ${from}`, `Mercury with or aspected by a benefic: ${verb.toLowerCase()} through paternal relatives.`, house === 12 ? "mixed" : "support", ["Mercury"], 29, house === 12 ? "19" : "19, 22", prov);
        if (withM) push(`pd-29-19m-${house}-${tag}`, `Mercury in the ${hName} from ${from}`, `Mercury with or aspected by a malefic: ${verb.toLowerCase()} through disputes.`, house === 12 ? "strain" : "mixed", ["Mercury"], 29, house === 12 ? "19" : "19, 22", prov);
      }
      if (has("Jupiter")) push(`pd-29-20-${house}-${tag}`, `Jupiter in the ${hName} from ${from}`, `${verb} through taxes and on one's own account.`, house === 12 ? "mixed" : "support", ["Jupiter"], 29, house === 12 ? "20" : "20, 22", prov);
      if (has("Saturn") && has("Mars")) push(`pd-29-21-${house}-${tag}`, `Saturn and Mars in the ${hName} from ${from}`, `${verb} through brothers and sisters.`, house === 12 ? "mixed" : "support", ["Saturn", "Mars"], 29, house === 12 ? "21" : "21, 22", prov);
    };
    src(12, in12, "12th", "Expenses");
    src(11, in11, "11th", "Gains");
    const all12 = infl(pts, h(12));
    if (all12.some(ben) && all12.some((pl) => !ben(pl))) push(`pd-29-16-${tag}`, `Benefics and malefics on the 12th from ${from}`, `${list(all12)} occupy or aspect the 12th from ${from}: abundant earnings and plenty of expenses, fair through the benefics and otherwise through the malefics.`, "mixed", all12, 29, "16-17", prov);
    const seventhLike = (house: number, pls: Planet[], hName: string, verses: string) => {
      const aspH = asp(pts, h(house));
      const nodes = pls.filter((pl) => NODES.includes(pl));
      if (nodes.length) push(`pd-29-23-${house}-${tag}`, `${list(nodes)} in the ${hName} from ${from}`, `Parashara warns of stomach disorders or trouble from fire.`, "strain", nodes, 29, `23${verses}`, prov);
      if (pls.includes("Ketu") && (pls.some((pl) => pl !== "Ketu" && !ben(pl)) || aspH.some((pl) => !ben(pl)))) push(`pd-29-24-${house}-${tag}`, `Ketu with a malefic in the ${hName} from ${from}`, `Adventurous, with early grey hair.`, "mixed", ["Ketu"], 29, `24${verses}`, prov);
      const wealthy = pls.filter((pl) => ["Jupiter", "Venus", "Moon"].includes(pl));
      if (wealthy.length) push(`pd-29-25-${house}-${tag}`, `${list(wealthy)} in the ${hName} from ${from}`, `Very wealthy${wealthy.length > 1 ? ", the more for each of Jupiter, Venus and the Moon present" : ""}.`, "support", wealthy, 29, `25${verses}`, prov);
      const ex = pls.filter(exalted);
      if (ex.length) push(`pd-29-26-${house}-${tag}`, `${list(ex)} exalted in the ${hName} from ${from}`, `Affluent and well known, whether the exalted planet is benefic or malefic.`, "support", ex, 29, `26${verses}`, prov);
    };
    seventhLike(7, in7, "7th", "");
    seventhLike(2, in2, "2nd", ", 27");
    const ex2 = in2.filter((pl) => ["Mercury", "Jupiter", "Venus"].includes(pl) && exalted(pl) && strong(pl) !== false);
    if (ex2.length) push(`pd-29-28-${tag}`, `${list(ex2)} exalted in the 2nd from ${from}`, `Exalted${shadbala ? " and strong by Shadbala" : ""}: rich.`, "support", ex2, 29, "28", prov || !shadbala);
    if (in2.includes("Mercury")) push(`pd-29-30-${tag}`, `Mercury in the 2nd from ${from}`, `Authority over the land. ${glossKing}`, "support", ["Mercury"], 29, "30", prov);
    if (in2.includes("Venus")) push(`pd-29-30v-${tag}`, `Venus in the 2nd from ${from}`, `A poet or a speaker.`, "support", ["Venus"], 29, "30", prov);
  };
  padaRules(AL, rasiPts, "al", "the Arudha lagna", false, true);
  padaRules(KA, navamsa, "ka", "the Karakamsa", true, false);

  // 29.31-37: Arudha lagna against the Dara pada and Dhana pada.
  const mutual = (a: number, b: number) => houseFrom(a, b);
  const pairRule = (other: number, name: string, tag: string) => {
    const r = mutual(AL, other);
    const kt = KENDRA.includes(r) || TRIKONA.includes(r);
    const strongIn = (si: number) => occ(rasiPts, si).filter((pl) => strong(pl));
    if (kt) push(`pd-29-31-${tag}`, `${cap(name)} in an angle or trine from the Arudha lagna`, `${name} (${SIGNS[other]}) is in the ${ord(r)} from the Arudha lagna (${SIGNS[AL]}): rich and well known in one's country${tag === "a7" ? "; the couple in accord (29.35)" : ""}.${[3, 11].includes(r) || kt ? ` The same mutual placement in an angle, trine, 3rd or 11th is the "king" yoga of 29.36-37. ${glossKing}` : ""}`, "support", [], 29, tag === "a7" ? "31-33, 35-37" : "37", tag !== "a7");
    else if ([3, 11].includes(r)) push(`pd-29-36-${tag}`, `${cap(name)} in the ${ord(r)} from the Arudha lagna`, `Mutually 3rd and 11th. ${glossKing}`, "support", [], 29, tag === "a7" ? "36" : "37", true);
    else if (DUS.includes(r)) push(`pd-29-34-${tag}`, `${cap(name)} in the ${ord(r)} from the Arudha lagna`, `${name} (${SIGNS[other]}) falls in the ${ord(r)} from the Arudha lagna: Parashara says poor${tag === "a7" ? ", and enmity between the couple (29.35)" : ""}.`, "strain", [], 29, tag === "a7" ? "34-35" : "37", tag !== "a7");
    if (shadbala && strongIn(AL).length && strongIn(other).length) push(`pd-29-33-${tag}`, `Strong planets in both the Arudha lagna and ${name}`, `${list(strongIn(AL))} in the Arudha lagna and ${list(strongIn(other))} in ${name}, all strong by Shadbala: rich and famous in one's country.`, "support", [...strongIn(AL), ...strongIn(other)], 29, "33", tag !== "a7");
  };
  pairRule(A7, "the Dara pada", "a7");
  pairRule(A2, "the Dhana pada", "a2");
  if (shadbala) {
    const inALor7 = [1, 7].flatMap((h) => occ(rasiPts, (AL + h - 1) % 12).filter((pl) => strong(pl)));
    if (inALor7.length) push("pd-29-35", "Strong planet in the Arudha lagna or its 7th", `${list(Array.from(new Set(inALor7)))}, strong by Shadbala, in the Arudha lagna or the 7th from it: happiness between the spouses.`, "support", Array.from(new Set(inALor7)), 29, "35", true);
  }

  // ── Chapter 30: Upapada. ──
  const ulOcc = occ(rasiPts, UL), ulAsp = asp(rasiPts, UL), ulInfl = infl(rasiPts, UL);
  const sunMal = () => !(exalted("Sun") || pos("Sun").dignity === "Friendly" || ownSign("Sun"));
  const malOn = (pls: Planet[]) => pls.filter((pl) => (pl === "Sun" ? sunMal() : !ben(pl)));
  const benOn = (pls: Planet[]) => pls.filter(ben);
  if (benOn(ulInfl).length) push("pd-30-3", "Benefic on the Upapada", `${list(benOn(ulInfl))} ${benOn(ulInfl).length > 1 ? "join or aspect" : "joins or aspects"} the Upapada (${SIGNS[UL]}): full happiness from spouse and children.`, "support", benOn(ulInfl), 30, "1-3, 40");
  if (MALEFIC_SIGNS.includes(UL) || malOn(ulInfl).length) {
    const saved = benOn(ulInfl).length > 0;
    push("pd-30-4", saved ? "Malefic on the Upapada, relieved" : "Malefic on the Upapada", `The Upapada (${SIGNS[UL]})${MALEFIC_SIGNS.includes(UL) ? " is a malefic's sign" : ""}${malOn(ulInfl).length ? `${MALEFIC_SIGNS.includes(UL) ? " and" : ""} carries ${list(malOn(ulInfl))}` : ""}. ${saved ? `Parashara's renunciation or want of a spouse does not come to pass because a benefic (${list(benOn(ulInfl))}) also joins or aspects (30.6).` : "Parashara speaks of renunciation and going without a spouse; a benefic joining or aspecting would relieve it, and none does."} ${ulInfl.includes("Sun") ? "The Sun counts as malefic only when debilitated or in an enemy's sign (30.6)." : ""}`, saved ? "mixed" : "strain", [...malOn(ulInfl)], 30, "4-6", true);
  }
  const u2 = (UL + 1) % 12;
  const u2Occ = occ(rasiPts, u2), u2Infl = infl(rasiPts, u2);
  const u2Nav = (pl: Planet) => navamsa.find((n) => n.planet === pl)!.signIndex;
  if (!MALEFIC_SIGNS.includes(u2) || benOn(u2Infl).length) {
    const why = [!MALEFIC_SIGNS.includes(u2) ? `${SIGNS[u2]} is a benefic's sign` : "", benOn(u2Infl).length ? `${list(benOn(u2Infl))} ${benOn(u2Infl).length > 1 ? "join or aspect it" : "joins or aspects it"}` : ""].filter(Boolean).join(" and ");
    push("pd-30-7", "Benefic 2nd from the Upapada", `The 2nd from the Upapada (${SIGNS[u2]}): ${why}. The same happiness from spouse and children; the spouse is described as beautiful, fortunate and virtuous (30.15).`, "support", benOn(u2Infl), 30, "7, 15", MALEFIC_SIGNS.includes(u2) === false && benOn(u2Infl).length === 0);
  }
  const u2Bad = u2Occ.filter((pl) => debil(pl) || navDebil(pl, u2Nav(pl)) || u2Occ.some((q) => q !== pl && (debil(q) || !ben(q))));
  if (u2Bad.length) {
    const relief = benOn(u2Infl).length;
    push("pd-30-8", relief ? "Afflicted 2nd from the Upapada, relieved" : "Afflicted 2nd from the Upapada", `${list(u2Occ)} in the 2nd from the Upapada (${SIGNS[u2]}), ${u2Occ.some((pl) => debil(pl) || navDebil(pl, u2Nav(pl))) ? "debilitated in sign or navamsa" : "in the company of a malefic"}. Parashara's words are destruction of the spouse, shown as written.${relief ? ` A benefic (${list(benOn(u2Infl))}) joins or aspects, which 30.22 gives as the relief.` : ""}`, relief ? "mixed" : "strain", u2Occ, 30, "8", true);
  }
  const u2Ex = u2Occ.filter((pl) => exalted(pl) || navExalted(pl, u2Nav(pl)));
  if (u2Ex.length) push("pd-30-9", "Exalted planet in the 2nd from the Upapada", `${list(u2Ex)} exalted in sign or navamsa in the 2nd from the Upapada: Parashara speaks of more than one spouse, charming and virtuous.`, "mixed", u2Ex, 30, "9", true);
  if (u2 === 2) push("pd-30-10", "Gemini 2nd from the Upapada", `The 2nd from the Upapada is Gemini, which the text alone reads as more than one spouse.`, "mixed", [], 30, "10");
  const ulLord = SIGN_LORD[UL], u2Lord = SIGN_LORD[u2];
  if (pos(ulLord).signIndex === UL || pos(u2Lord).signIndex === u2 || (ownSign(ulLord) && pos(ulLord).signIndex !== UL) || (ownSign(u2Lord) && pos(u2Lord).signIndex !== u2)) {
    push("pd-30-11", "Lord of the Upapada or of its 2nd in own sign", `${pos(ulLord).signIndex === UL ? `${ulLord} stands in the Upapada it owns` : pos(u2Lord).signIndex === u2 ? `${u2Lord} stands in the 2nd from the Upapada, its own sign` : `${ownSign(ulLord) && pos(ulLord).signIndex !== UL ? ulLord : u2Lord} is in its other own sign`}: the spouse's death only at an advanced age, that is, a long married life.`, "support", [pos(ulLord).signIndex === UL || (ownSign(ulLord) && pos(ulLord).signIndex !== UL) ? ulLord : u2Lord], 30, "11-12");
  }
  const l7 = SIGN_LORD[signOfHouse(7)];
  const spouseSig: Planet[] = Array.from(new Set<Planet>([l7, "Venus"]));
  const sigOwn = spouseSig.filter(ownSign);
  if (sigOwn.length) push("pd-30-13", "Spouse's significator in own sign", `${list(sigOwn)}, ${sigOwn.includes(l7) ? "lord of the 7th" : "constant significator of the spouse"}, in own sign: loss of the spouse only late in life.`, "support", sigOwn, 30, "13");
  const noble = Array.from(new Set<Planet>([ulLord, ...spouseSig])).filter(exalted);
  const humble = Array.from(new Set<Planet>([ulLord, ...spouseSig])).filter(debil);
  if (noble.length) push("pd-30-14", "Upapada lord or spouse's significator exalted", `${list(noble)} exalted: the spouse from a noble family.`, "support", noble, 30, "14");
  if (humble.length) push("pd-30-14d", "Upapada lord or spouse's significator debilitated", `${list(humble)} debilitated: Parashara says the reverse of a noble family, shown as written.`, "strain", humble, 30, "14", true);
  // 30.16-22 pairs in the 2nd from the Upapada, relieved by a benefic (30.22).
  const has2 = (pl: Planet) => u2Occ.includes(pl);
  const pair = (id: string, pls: Planet[], text: string, verse: string, cond = true) => {
    if (!cond || !pls.every(has2)) return;
    const rel2 = benOn(u2Infl).filter((pl) => !pls.includes(pl));
    push(`pd-30-${id}`, `${list(pls)} in the 2nd from the Upapada`, `${text}${rel2.length ? ` Relieved by ${list(rel2)} joining or aspecting (30.22).` : ""}`, rel2.length ? "mixed" : "strain", pls, 30, verse, true);
  };
  pair("16", ["Saturn", "Rahu"], "Parashara speaks of losing the spouse through calumny or death, shown as written.", "16");
  pair("17", ["Venus", "Ketu"], "The spouse troubled by disorders of the blood.", "17");
  pair("18", ["Mercury", "Ketu"], "Breakage of bones for the spouse.", "18");
  pair("18b", ["Rahu", "Saturn", "Sun"], "Distress of the bones for the spouse.", "18");
  pair("19", ["Mercury", "Rahu"], "A stout-bodied spouse.", "19");
  pair("20", ["Mars", "Saturn"], "Nasal disorders for the spouse, the 2nd from the Upapada being a sign of Mercury or Mars.", "20", [2, 5, 0, 7].includes(u2));
  pair("21", ["Jupiter", "Saturn"], "Disorders of the ears or eyes for the spouse.", "21");
  pair("21b", ["Mercury", "Mars"], "Dental disorders for the spouse.", "21", !ownSign("Mercury") && !ownSign("Mars"));
  pair("21c", ["Rahu", "Jupiter"], "Dental disorders for the spouse.", "21");
  pair("22", ["Saturn", "Rahu"], "Lameness or windy disorders for the spouse, the 2nd from the Upapada being a sign of Saturn.", "22", [9, 10].includes(u2));
  // 30.23-28: sons from the 9th of the lagna, the Arudha lagna and the 7th from the Upapada.
  const sonBases: Array<[string, number]> = [["the lagna", lagnaIdx], ["the Arudha lagna", AL], ["the 7th from the Upapada", (UL + 6) % 12]];
  for (const [name, base] of sonBases) {
    const n9 = (base + 8) % 12;
    const o = occ(rasiPts, n9);
    const oddNote = isOdd(n9) ? "an odd sign, which favours many" : "an even sign, which favours few";
    const tag = name.replace(/\W+/g, "");
    if ((["Saturn", "Moon", "Mercury"] as Planet[]).every((pl) => o.includes(pl))) push(`pd-30-25-${tag}`, `Saturn, Moon and Mercury in the 9th from ${name}`, `Parashara's words are no son at all, shown as written; ${SIGNS[n9]} is ${oddNote}.`, "strain", ["Saturn", "Moon", "Mercury"], 30, "23-28", true);
    if ((["Sun", "Jupiter", "Rahu"] as Planet[]).every((pl) => o.includes(pl))) push(`pd-30-25b-${tag}`, `Sun, Jupiter and Rahu in the 9th from ${name}`, `A number of sons, strong and successful; ${SIGNS[n9]} is ${oddNote}.`, "support", ["Sun", "Jupiter", "Rahu"], 30, "23-28", true);
    if (o.length === 1 && o[0] === "Moon") push(`pd-30-26-${tag}`, `The Moon alone in the 9th from ${name}`, `A son; ${SIGNS[n9]} is ${oddNote}.`, "support", ["Moon"], 30, "23-28", true);
    if ((["Mars", "Saturn"] as Planet[]).every((pl) => o.includes(pl))) push(`pd-30-27-${tag}`, `Mars and Saturn in the 9th from ${name}`, `Parashara's words are no son, or a son by adoption, shown as written; ${SIGNS[n9]} is ${oddNote}.`, "strain", ["Mars", "Saturn"], 30, "23-28", true);
  }
  if (UL === 4 && asp(rasiPts, UL).includes("Moon")) push("pd-30-29", "Leo Upapada aspected by the Moon", "A limited number of children.", "mixed", ["Moon"], 30, "29");
  if (UL === 5 && asp(rasiPts, UL).includes("Moon")) push("pd-30-30", "Virgo Upapada aspected by the Moon", "Many daughters.", "support", ["Moon"], 30, "30");
  // 30.31-36: co-born from the 3rd and 11th of the Arudha lagna.
  const al3 = occ(rasiPts, (AL + 2) % 12), al11 = occ(rasiPts, (AL + 10) % 12);
  const both311 = [...al3, ...al11];
  const asp311 = [...asp(rasiPts, (AL + 2) % 12), ...asp(rasiPts, (AL + 10) % 12)];
  if (both311.includes("Rahu") && both311.includes("Saturn")) push("pd-30-31", "Rahu and Saturn in the 3rd or 11th from the Arudha lagna", `Parashara's words are loss of co-born, elder through the 11th and younger through the 3rd, shown as written. Rahu in the ${al3.includes("Rahu") ? "3rd" : "11th"}, Saturn in the ${al3.includes("Saturn") ? "3rd" : "11th"}.`, "strain", ["Rahu", "Saturn"], 30, "31", true);
  else if (both311.includes("Saturn") && !both311.includes("Mars") && !asp311.includes("Mars")) push("pd-30-35", "Saturn alone in the 3rd or 11th from the Arudha lagna", `Saturn in the ${al3.includes("Saturn") ? "3rd" : "11th"} from the Arudha lagna without Mars: the native is spared while the co-born suffer, in Parashara's words.`, "mixed", ["Saturn"], 30, "35", true);
  if ((["Saturn", "Mars"] as Planet[]).every((pl) => both311.includes(pl) || asp311.includes(pl)) && !(both311.includes("Rahu") && both311.includes("Saturn"))) push("pd-30-34", "Saturn and Mars on the 3rd or 11th from the Arudha lagna", "Saturn and Mars occupy or aspect the 3rd or 11th from the Arudha lagna: Parashara's words are loss of younger (Saturn) and elder (Mars) co-born, shown as written.", "strain", ["Saturn", "Mars"], 30, "34", true);
  if (both311.includes("Venus") || houseFrom(lagnaIdx, pos("Venus").signIndex) === 8 || houseFrom(AL, pos("Venus").signIndex) === 8) push("pd-30-32", "Venus in the 3rd or 11th from the Arudha lagna, or in the 8th", `Venus in the ${both311.includes("Venus") ? (al3.includes("Venus") ? "3rd" : "11th") + " from the Arudha lagna" : houseFrom(lagnaIdx, pos("Venus").signIndex) === 8 ? "8th from the lagna" : "8th from the Arudha lagna"}: Parashara says the mother had a miscarriage earlier, a fact to check rather than a prediction.`, "mixed", ["Venus"], 30, "32");
  const valor = both311.filter((pl) => ["Moon", "Jupiter", "Mercury", "Mars"].includes(pl));
  if (valor.length) push("pd-30-33", `${list(valor)} in the 3rd or 11th from the Arudha lagna`, `Many valorous co-born.`, "support", valor, 30, "33");
  if (both311.includes("Ketu")) push("pd-30-36", "Ketu in the 3rd or 11th from the Arudha lagna", "Abundant happiness from sisters.", "support", ["Ketu"], 30, "36");
  // 30.37-43 other matters from the Arudha lagna.
  const al6 = occ(rasiPts, (AL + 5) % 12);
  if (al6.some((pl) => !ben(pl)) && !infl(rasiPts, (AL + 5) % 12).some(ben)) push("pd-30-37", "Malefic in the 6th from the Arudha lagna", `${list(al6.filter((pl) => !ben(pl)))} in the 6th from the Arudha lagna with no benefic joining or aspecting. Parashara's word is thief, shown as written.`, "strain", al6.filter((pl) => !ben(pl)), 30, "37", true);
  const rahuH = houseFrom(AL, pos("Rahu").signIndex);
  if ([7, 12].includes(rahuH) || [7, 12].some((h) => rasiAspects(pos("Rahu").signIndex, (AL + h - 1) % 12))) push("pd-30-38", "Rahu on the 7th or 12th from the Arudha lagna", `Rahu ${[7, 12].includes(rahuH) ? `in the ${ord(rahuH)}` : "aspecting the 7th or 12th"} from the Arudha lagna: spiritual knowledge and good fortune.`, "support", ["Rahu"], 30, "38", ![7, 12].includes(rahuH));
  const alOcc = occ(rasiPts, AL);
  if (alOcc.includes("Mercury")) push("pd-30-39m", "Mercury in the Arudha lagna", `Authority over the land. ${glossKing}`, "support", ["Mercury"], 30, "39");
  if (alOcc.includes("Jupiter")) push("pd-30-39j", "Jupiter in the Arudha lagna", "A knower of all things.", "support", ["Jupiter"], 30, "39");
  if (alOcc.includes("Venus")) push("pd-30-39v", "Venus in the Arudha lagna", "A poet or a speaker.", "support", ["Venus"], 30, "39");
  const al2 = occ(rasiPts, (AL + 1) % 12);
  if (al2.some(ben)) push("pd-30-40", "Benefic in the 2nd from the Arudha lagna", `${list(al2.filter(ben))} in the 2nd from the Arudha lagna: endowed with all kinds of wealth, and intelligent.`, "support", al2.filter(ben), 30, "40");
  if (houseFrom(lagnaIdx, pos(u2Lord).signIndex) === 2 && occ(rasiPts, pos(u2Lord).signIndex).some((pl) => pl !== u2Lord && !ben(pl))) push("pd-30-41", "Lord of the 2nd from the Upapada in the 2nd with a malefic", `${u2Lord} in the 2nd house with ${list(occ(rasiPts, pos(u2Lord).signIndex).filter((pl) => pl !== u2Lord && !ben(pl)))}. Parashara's word is thief, shown as written.`, "strain", [u2Lord], 30, "41", true);
  const ul7Lord = SIGN_LORD[(UL + 6) % 12];
  const from7L = (pl: Planet) => houseFrom(pos(ul7Lord).signIndex, pos(pl).signIndex) === 2;
  if (from7L("Rahu")) push("pd-30-42r", "Rahu 2nd from the lord of the 7th from the Upapada", "Long, projecting teeth.", "mixed", ["Rahu"], 30, "42-43");
  if (from7L("Ketu")) push("pd-30-42k", "Ketu 2nd from the lord of the 7th from the Upapada", "A stammer.", "mixed", ["Ketu"], 30, "42-43");
  if (from7L("Saturn")) push("pd-30-42s", "Saturn 2nd from the lord of the 7th from the Upapada", "Parashara's word is ugly, shown as written.", "mixed", ["Saturn"], 30, "42-43");

  // ── Chapter 33: Karakamsa in the navamsa. ──
  const kOcc = occ(navamsa, KA), kAsp = asp(navamsa, KA), kInfl = infl(navamsa, KA);
  const kh = (n: number) => (KA + n - 1) % 12;
  const kOccH = (n: number) => occ(navamsa, kh(n));
  const kAspH = (n: number) => asp(navamsa, kh(n));
  const kInflH = (n: number) => infl(navamsa, kh(n));
  const SIGN_33: Array<[string, ParashariFinding["tone"]]> = [
    ["nuisance from rats and cats, more with a malefic joining", "strain"],
    ["happiness from cattle and other quadrupeds", "support"],
    ["affliction by itches and skin trouble", "strain"],
    ["fear from water", "strain"],
    ["fear from tigers and wild beasts", "strain"],
    ["trouble from itches, corpulence and fire", "strain"],
    ["a trader, skilful in making garments", "support"],
    ["trouble from snakes, and affliction to the mother's breasts", "strain"],
    ["falls from heights and from vehicles", "strain"],
    ["gains from water-dwelling beings, conch, pearl and coral", "support"],
    ["one who builds tanks and waterworks", "support"],
    ["final emancipation", "support"],
  ];
  {
    const [txt, tone] = SIGN_33[KA];
    const relief = kAsp.some(ben);
    push("pd-33-2", `Karakamsa ${SIGNS[KA]}`, `${AK}, the Atmakaraka, in the ${SIGNS[KA]} navamsa: ${txt}.${tone === "strain" ? (relief ? ` A benefic (${list(kAsp.filter(ben))}) aspects the Karakamsa, which removes the evil (33.8).` : kAsp.some((pl) => !ben(pl)) ? ` A malefic (${list(kAsp.filter((pl) => !ben(pl)))}) aspects, which the text says does no good.` : "") : ""}`, tone === "strain" && relief ? "mixed" : tone, [AK], 33, "2-8", true);
  }
  if (kOcc.every(ben) && occ(navamsa, lagnaNav).every(ben) && kOcc.length + occ(navamsa, lagnaNav).length > 0 && kAsp.some(ben)) push("pd-33-9", "Only benefics in the Karakamsa and the lagna navamsa", `Benefics alone in the Karakamsa (${list(kOcc)}) and the lagna navamsa${occ(navamsa, lagnaNav).length ? ` (${list(occ(navamsa, lagnaNav))})` : ""}, aspected by benefics. ${glossKing}`, "support", [...kOcc, ...occ(navamsa, lagnaNav)], 33, "9", true);
  {
    const kt = Array.from(new Set([...KENDRA, ...TRIKONA])).filter((h) => h !== 1).flatMap((h) => kOccH(h));
    if (kt.length && kt.every(ben)) push("pd-33-10", "Benefics in the angles and trines from the Karakamsa", `${list(kt)} in the angles and trines from the Karakamsa with no malefic among them: wealth and learning.`, "support", kt, 33, "10", true);
    else if (kt.length && kt.some(ben)) push("pd-33-10m", "Benefics and malefics in the angles and trines from the Karakamsa", `${list(kt)}: mixed results in wealth and learning.`, "mixed", kt, 33, "10", true);
  }
  if (["Moon", "Mars", "Venus"].includes(SIGN_LORD[KA])) push("pd-33-12", `Karakamsa in a sign of ${SIGN_LORD[KA]}`, `The Karakamsa falls in a division of ${SIGN_LORD[KA]}. Parashara's words concern going to others' spouses, shown as written.`, "strain", [AK], 33, "12", true);
  const bright = (() => { const mo = pos("Moon"), su = pos("Sun"); const e = ((mo.lon - su.lon) % 360 + 360) % 360; return e >= 90 && e < 270; })();
  const IN_KA: Partial<Record<Planet, [string, ParashariFinding["tone"], string]>> = {
    Sun: ["engaged in the affairs of the state", "support", "13"],
    Moon: [bright ? "the bright Moon: pleasures and scholarship" + (kAsp.includes("Venus") ? ", the more for Venus aspecting" : "") : "the Moon, though the verse asks for the full Moon: pleasures and scholarship", "support", "14"],
    Mars: [strong("Mars") === false ? "one who wields the spear, lives by fire, an alchemist; the verse asks for a strong Mars, which Shadbala does not grant here" : "strong Mars: one who wields the spear, lives by fire, an alchemist", "mixed", "15"],
    Mercury: [strong("Mercury") === false ? "skilful in the arts and in trade, intelligent and educated; the verse asks for a strong Mercury, which Shadbala does not grant here" : "strong Mercury: skilful in the arts and in trade, intelligent and educated", "support", "15"],
    Jupiter: ["good deeds, a spiritual bent and Vedic learning", "support", "16"],
    Venus: ["long life, sensuous, one who looks after affairs of state", "support", "16"],
    Saturn: ["a livelihood such as the family follows", "mixed", "17"],
    Rahu: ["Parashara's list is thief, bowman, maker of machines, physician of poisons, shown as written", "mixed", "17"],
    Ketu: ["dealing in elephants, and Parashara's word thief, shown as written", "mixed", "18"],
  };
  for (const pl of kOcc) {
    if (pl === AK) continue;
    const e = IN_KA[pl];
    if (e) push(`pd-33-13-${pl}`, `${pl} in the Karakamsa`, `${pl} with the Atmakaraka in the ${SIGNS[KA]} navamsa: ${e[0]}.`, e[1], [pl], 33, e[2], true);
  }
  if (kOcc.includes("Rahu") && kOcc.includes("Sun")) {
    const rel = kAsp.some(ben);
    push("pd-33-19", "Rahu and the Sun in the Karakamsa", `Fear from snakes${rel ? `, removed by the benefic aspect of ${list(kAsp.filter(ben))}` : kAsp.some((pl) => !ben(pl)) ? ", made grave by a malefic aspect" : ""}.${kAsp.includes("Mars") ? " With Mars aspecting Parashara speaks of fire to one's own or another's house (33.21)." : ""}`, rel ? "mixed" : "strain", ["Rahu", "Sun"], 33, "19-22", true);
  }
  if (kOcc.includes("Ketu") && kAsp.length) {
    const a = kAsp;
    const parts: string[] = [];
    if (a.some((pl) => !ben(pl))) parts.push("a malefic aspects: trouble to the ears");
    if (a.includes("Venus") && !a.includes("Sun") && !a.includes("Mercury")) parts.push("Venus aspects: initiation into a religious order");
    if (a.includes("Mercury") && a.includes("Saturn")) parts.push("Mercury and Saturn aspect: want of strength");
    if (a.includes("Saturn") && !a.includes("Mercury")) parts.push("Saturn aspects: penance, service, or what Parashara calls a pseudo-ascetic");
    if (a.includes("Venus") && a.includes("Sun")) parts.push("Venus and the Sun aspect: service to the state");
    if (parts.length) push("pd-33-25", "Ketu in the Karakamsa, aspected", `Ketu in the Karakamsa; ${parts.join("; ")}.`, "mixed", ["Ketu", ...a], 33, "25-29", true);
  }
  // 2nd from Karakamsa.
  const k2 = kh(2);
  if (["Venus", "Mars"].includes(SIGN_LORD[k2])) {
    const lasting = kAspH(2).some((pl) => pl === "Venus" || pl === "Mars");
    const ketu = kOccH(2).includes("Ketu");
    push("pd-33-30", `2nd from the Karakamsa in a sign of ${SIGN_LORD[k2]}`, `${ketu ? "Ketu stands there, which the text says removes the tendency" : `Parashara's words concern others' spouses, shown as written${lasting ? "; with Venus or Mars aspecting he says it lasts" : ""}`}.${kOccH(2).includes("Jupiter") ? " Jupiter there brings the evil, in his words." : ""}${kOccH(2).includes("Rahu") ? " Rahu there destroys wealth." : ""}`, ketu ? "mixed" : "strain", kOccH(2), 33, "30-31", true);
  } else if (kOccH(2).includes("Rahu")) push("pd-33-31", "Rahu in the 2nd from the Karakamsa", "Rahu in the 2nd from the Karakamsa: destruction of wealth, in the text's words.", "strain", ["Rahu"], 33, "31", true);
  if (kOccH(2).includes("Ketu") || kOccH(3).includes("Ketu")) push("pd-33-93", `Ketu in the ${kOccH(2).includes("Ketu") ? "2nd" : "3rd"} from the Karakamsa`, `Defective speech${[...kAspH(2), ...kAspH(3)].some((pl) => !ben(pl)) ? ", more so with a malefic aspecting Ketu" : ""}.`, "strain", ["Ketu"], 33, "93", true);
  // 3rd and 6th.
  for (const [h, v] of [[3, "32"], [6, "46"]] as Array<[number, string]>) {
    const o = kOccH(h);
    if (!o.length) continue;
    const m = o.filter((pl) => !ben(pl)), b = o.filter(ben);
    push(`pd-33-${v}`, `Planets in the ${ord(h)} from the Karakamsa`, `${m.length ? `${list(m)} (malefic): ${h === 3 ? "valorous" : "an agriculturist"}` : ""}${m.length && b.length ? "; " : ""}${b.length ? `${list(b)} (benefic): ${h === 3 ? "timid" : "indolent"}` : ""}.`, m.length && !b.length ? (h === 3 ? "support" : "mixed") : b.length && !m.length ? "strain" : "mixed", o, 33, v, true);
  }
  // 4th.
  {
    const o = kOccH(4);
    const parts: string[] = [];
    if (o.includes("Venus") && o.includes("Moon")) parts.push("Venus and the Moon: large buildings");
    const ex = o.filter((pl) => navExalted(pl, kh(4)));
    if (ex.length) parts.push(`${list(ex)} exalted: large buildings`);
    if (o.includes("Rahu") && o.includes("Saturn")) parts.push("Rahu and Saturn: a house of stone");
    if (o.includes("Mars") && o.includes("Ketu")) parts.push("Mars and Ketu: a house of brick");
    if (o.includes("Jupiter")) parts.push("Jupiter: a house of wood");
    if (o.includes("Sun")) parts.push("the Sun: a house of grass");
    if (parts.length) push("pd-33-33", "Planets in the 4th from the Karakamsa", `${parts.join("; ")}.`, "mixed", o, 33, "33-35", true);
    const moonAsp = o.includes("Moon") ? kAspH(4) : [];
    if (moonAsp.includes("Venus")) push("pd-33-79v", "Moon in the 4th from the Karakamsa aspected by Venus", "Parashara names white leprosy, a skin affliction.", "strain", ["Moon", "Venus"], 33, "79", true);
    if (moonAsp.includes("Mars")) push("pd-33-79m", "Moon in the 4th from the Karakamsa aspected by Mars", "Disorders of blood and bile.", "strain", ["Moon", "Mars"], 33, "79", true);
    if (moonAsp.includes("Ketu")) push("pd-33-79k", "Moon in the 4th from the Karakamsa aspected by Ketu", "Parashara names black leprosy, a skin affliction.", "strain", ["Moon", "Ketu"], 33, "79", true);
  }
  // 4th or 5th (33.36-40, 77-84).
  for (const h of [4, 5]) {
    const o = kOccH(h), a = kAspH(h);
    const tag = `${h}`;
    if (o.includes("Rahu") && o.includes("Mars")) push(`pd-33-36-${tag}`, `Rahu and Mars in the ${ord(h)} from the Karakamsa`, `Parashara names consumption of the lungs${a.includes("Moon") ? ", made certain by the Moon's aspect" : ""}.`, "strain", ["Rahu", "Mars"], 33, h === 5 ? "36, 80" : "80", true);
    else if (o.includes("Mars") && o.length === 1) push(`pd-33-81-${tag}`, `Mars alone in the ${ord(h)} from the Karakamsa`, "Boils or ulcers.", "strain", ["Mars"], 33, "81", true);
    if (o.includes("Ketu") && !o.includes("Mars")) {
      if (o.length === 1) push(`pd-33-83-${tag}`, `Ketu alone in the ${ord(h)} from the Karakamsa`, "A maker of watches and fine instruments; also dysentery and water-borne complaints (33.82).", "mixed", ["Ketu"], 33, "82-83", true);
      else push(`pd-33-82-${tag}`, `Ketu in the ${ord(h)} from the Karakamsa`, "Dysentery and complaints from impure water.", "strain", ["Ketu"], 33, "82", true);
    }
    if (o.includes("Saturn") && o.length === 1) push(`pd-33-83s-${tag}`, `Saturn alone in the ${ord(h)} from the Karakamsa`, "Skill in archery.", "support", ["Saturn"], 33, "83", true);
    if (o.includes("Mercury")) push(`pd-33-84m-${tag}`, `Mercury in the ${ord(h)} from the Karakamsa`, "An ascetic of the highest order, or one holding the staff.", "mixed", ["Mercury"], 33, h === 5 ? "38, 84" : "84", true);
    if (o.includes("Rahu") && !o.includes("Mars")) push(`pd-33-84r-${tag}`, `Rahu in the ${ord(h)} from the Karakamsa`, "One who works with machines.", "mixed", ["Rahu"], 33, "84", true);
    if (o.includes("Sun")) push(`pd-33-84s-${tag}`, `Sun in the ${ord(h)} from the Karakamsa`, "One who uses the knife, in the text's words: a surgeon or a soldier.", "mixed", ["Sun"], 33, "84", true);
    if (o.includes("Mars") && o.length > 1 && !o.includes("Rahu")) push(`pd-33-84ma-${tag}`, `Mars in the ${ord(h)} from the Karakamsa`, "One who uses the spear or arrow.", "mixed", ["Mars"], 33, "84", true);
    if (h === 5 && a.includes("Mars") && !o.includes("Mars")) push("pd-33-37", "Mars aspecting the 5th from the Karakamsa", "Boils or ulcers.", "strain", ["Mars"], 33, "37", true);
    if (h === 5 && a.includes("Ketu") && !o.includes("Ketu")) push("pd-33-37k", "Ketu aspecting the 5th from the Karakamsa", "Dysentery and complaints from impure water.", "strain", ["Ketu"], 33, "37", true);
  }
  // Karakamsa or 5th: learning (33.41-45, 85-92).
  {
    const both = Array.from(new Set([...kOcc.filter((pl) => pl !== AK), ...kOccH(5)]));
    const where = (pl: Planet) => (kOcc.includes(pl) ? "in the Karakamsa" : "in the 5th from the Karakamsa");
    const LEARN: Partial<Record<Planet, string>> = {
      Jupiter: "a knower of all things, a writer versed in the Vedas and Vedanta, a grammarian, yet not one to speak in an assembly",
      Mars: "a logician; 33.90 adds a judge",
      Mercury: "a follower of Mimamsa, the school of scriptural interpretation",
      Saturn: "ineffective in an assembly",
      Sun: "a musician, learned in Vedanta",
      Moon: "a follower of Sankhya, versed in rhetoric and song",
      Venus: "a poet and eloquent speaker",
      Rahu: "an astrologer",
      Ketu: "an astrologer and mathematician" + (kInflH(5).includes("Jupiter") || kInfl.includes("Jupiter") ? ", the learning inherited since Jupiter is related (33.91)" : ""),
    };
    if (both.includes("Jupiter") && both.includes("Moon")) push("pd-33-41", "Jupiter and the Moon in the Karakamsa or its 5th", "An author versed in every branch of learning.", "support", ["Jupiter", "Moon"], 33, "41, 85", true);
    for (const pl of both) {
      const t = LEARN[pl];
      if (t) push(`pd-33-42-${pl}`, `Learning: ${pl} ${where(pl)}`, `${pl} ${where(pl)}: ${t}.${pl !== "Jupiter" && (kInfl.includes("Jupiter") || kInflH(5).includes("Jupiter")) ? " Jupiter's relation makes the effect sure (33.45)." : ""}`, pl === "Saturn" ? "strain" : "support", [pl], 33, "41-45, 85-92", true);
    }
  }
  // 7th: the spouse.
  {
    const o = kOccH(7);
    const parts: string[] = [];
    if (o.includes("Moon") && o.includes("Jupiter")) parts.push("Moon and Jupiter: a very beautiful spouse");
    if (o.includes("Venus")) parts.push("Venus: a sensuous spouse");
    if (o.includes("Mercury")) parts.push("Mercury: a spouse versed in the arts");
    if (o.includes("Sun")) parts.push("the Sun: a spouse confined to the home");
    if (o.includes("Saturn")) parts.push("Saturn: a spouse older in years, or pious, or sickly");
    if (o.includes("Rahu")) parts.push("Rahu: a spouse who was widowed before, in the text's words");
    if (parts.length) push("pd-33-47", "Planets in the 7th from the Karakamsa", `${parts.join("; ")}.`, o.includes("Rahu") || o.includes("Saturn") ? "mixed" : "support", o, 33, "47-48", true);
  }
  // 8th: span of life.
  {
    const o = kOccH(8);
    if (o.length) {
      const good = o.filter((pl) => ben(pl) || pl === SIGN_LORD[kh(8)]);
      const bad = o.filter((pl) => !ben(pl) && pl !== SIGN_LORD[kh(8)]);
      push("pd-33-49", "Planets in the 8th from the Karakamsa", `${list(o)} in the 8th from the Karakamsa: ${good.length && bad.length ? "benefic and malefic together, a middling span of life" : good.length ? "a benefic or the sign's own lord, a long span of life" : "a malefic, which the text says shortens the span"}.`, good.length && bad.length ? "mixed" : good.length ? "support" : "strain", o, 33, "49", true);
    }
  }
  // 9th.
  {
    const i9 = kInflH(9), o9 = kOccH(9);
    const parts: string[] = [];
    if (i9.some(ben)) parts.push(`benefic (${list(i9.filter(ben))}): truthful, devoted to elders, attached to one's own faith`);
    if (i9.some((pl) => !ben(pl))) parts.push(`malefic (${list(i9.filter((pl) => !ben(pl)))}): devout in youth, given to falsehood in age, in the text's words`);
    if (i9.includes("Saturn") && i9.includes("Rahu")) parts.push("Saturn and Rahu: betrayal of elders and aversion to ancient learning");
    if (i9.includes("Jupiter") && i9.includes("Sun")) parts.push("Jupiter and the Sun: disobedience to elders");
    if (i9.includes("Mercury") && i9.includes("Moon")) parts.push("Mercury and the Moon: Parashara speaks of confinement through a woman not one's own, shown as written");
    if (i9.length === 1 && i9[0] === "Jupiter") parts.push("Jupiter alone: given to pleasures");
    if (parts.length) push("pd-33-50", "Planets on the 9th from the Karakamsa", `${parts.join("; ")}.`, i9.some(ben) && !i9.some((pl) => !ben(pl)) && !(i9.length === 1 && i9[0] === "Jupiter") ? "support" : i9.some(ben) ? "mixed" : "strain", Array.from(new Set([...i9, ...o9])), 33, "50-56", true);
  }
  // 10th.
  {
    const i10 = kInflH(10);
    const parts: string[] = [];
    if (i10.some(ben)) parts.push(`benefic (${list(i10.filter(ben))}): firm riches, sagacity and strength`);
    if (i10.some((pl) => !ben(pl))) parts.push(`malefic (${list(i10.filter((pl) => !ben(pl)))}): harm to the profession and want of the father's blessing`);
    if (i10.includes("Mercury") && i10.includes("Venus")) parts.push("Mercury and Venus: many gains in business and great undertakings");
    if ((i10.includes("Sun") || i10.includes("Moon")) && (kOccH(10).includes("Jupiter") || kAspH(10).includes("Jupiter") || kInflH(10).includes("Jupiter"))) parts.push(`the luminaries with Jupiter: a kingdom, that is, high office`);
    if (parts.length) push("pd-33-57", "Planets on the 10th from the Karakamsa", `${parts.join("; ")}.`, i10.some(ben) && !i10.some((pl) => !ben(pl)) ? "support" : i10.some(ben) ? "mixed" : "strain", i10, 33, "57-60", true);
  }
  // 11th.
  {
    const i11 = kInflH(11), o11 = kOccH(11);
    const parts: string[] = [];
    if (i11.some(ben)) parts.push(`benefic (${list(i11.filter(ben))}): happiness from co-born and gain in every undertaking`);
    if (o11.some((pl) => !ben(pl))) parts.push(`malefic in the 11th (${list(o11.filter((pl) => !ben(pl)))}): gains by means Parashara calls questionable, yet fame and valour`);
    if (parts.length) push("pd-33-61", "Planets on the 11th from the Karakamsa", `${parts.join("; ")}.`, i11.some(ben) && !o11.some((pl) => !ben(pl)) ? "support" : "mixed", Array.from(new Set([...i11, ...o11])), 33, "61-62", true);
  }
  // 12th.
  {
    const o12 = kOccH(12), a12 = kAspH(12), k12 = kh(12);
    const parts: string[] = [];
    if (!o12.length) parts.push("the 12th is vacant: expenses on good account");
    if (o12.some(ben)) parts.push(`benefic (${list(o12.filter(ben))}): expenses on good account`);
    if (o12.some((pl) => !ben(pl) && pl !== "Ketu")) parts.push(`malefic (${list(o12.filter((pl) => !ben(pl) && pl !== "Ketu"))}): expenses on bad account`);
    const heaven = o12.filter((pl) => ben(pl) && (navExalted(pl, k12) || OWN_SIGNS[pl]?.includes(k12)));
    if (heaven.length) parts.push(`${list(heaven)} exalted or in own sign: the text promises heaven after death`);
    if (o12.includes("Ketu")) {
      const benRel = [...o12, ...a12].some((pl) => pl !== "Ketu" && ben(pl));
      const malRel = [...o12, ...a12].some((pl) => pl !== "Ketu" && !ben(pl));
      if ([0, 8].includes(k12) && a12.some(ben)) parts.push("Ketu in Aries or Sagittarius aspected by a benefic: final emancipation");
      else if (benRel) parts.push("Ketu with a benefic joining or aspecting: heaven after death");
      if (malRel) parts.push("Ketu with a malefic joining or aspecting: the text withholds emancipation");
      if (o12.includes("Sun")) parts.push("Sun and Ketu: a worshipper of Shiva");
      if (o12.includes("Moon")) parts.push("Moon and Ketu: a worshipper of Gauri");
      if (o12.includes("Venus")) parts.push("Venus and Ketu: a worshipper of Lakshmi, and wealthy");
      if (o12.includes("Mars")) parts.push("Mars and Ketu: a worshipper of Subramanya");
      if (o12.length === 1) parts.push("Ketu alone: a worshipper of Subramanya or Ganesha");
    }
    if (o12.includes("Rahu")) parts.push("Rahu: a worshipper of Durga, or of what Parashara calls a mean deity");
    if (o12.includes("Saturn") && MALEFIC_SIGNS.includes(k12)) parts.push(`Saturn${o12.includes("Venus") ? " and Venus" : ""} in a malefic's sign: Parashara's words are mean deities, shown as written`);
    push("pd-33-63", "The 12th from the Karakamsa", `${parts.join("; ")}.`, o12.some((pl) => !ben(pl) && pl !== "Ketu") ? (o12.some(ben) ? "mixed" : "strain") : "support", o12, 33, "63-74", true);
  }
  // Two malefics in a trine (33.75-76).
  {
    const tri = [...kOccH(5), ...kOccH(9)].filter((pl) => !ben(pl));
    if (tri.length >= 2) {
      const a = [...kAspH(5), ...kAspH(9)];
      push("pd-33-75", "Two malefics in a trine from the Karakamsa", `${list(tri)}: knowledge of mantra and tantra${a.some((pl) => !ben(pl)) ? ", turned by a malefic aspect to ill use" : a.some(ben) ? ", turned by a benefic aspect to the public good" : ""}.`, "mixed", tri, 33, "75-76", true);
    }
  }
  // Moon in the Karakamsa aspected (33.77-78).
  if (kOcc.includes("Moon")) {
    if (kAsp.includes("Venus")) push("pd-33-77", "Moon in the Karakamsa aspected by Venus", "An alchemist.", "support", ["Moon", "Venus"], 33, "77", true);
    if (kAsp.includes("Mercury")) push("pd-33-78", "Moon in the Karakamsa aspected by Mercury", "A physician able to cure every disease.", "support", ["Moon", "Mercury"], 33, "78", true);
  }
  // Kemadruma from malefics (33.94-99).
  {
    const malIn = (pts: Pt[], si: number) => occ(pts, si).some((pl) => !ben(pl));
    const kaK = malIn(navamsa, KA) && malIn(navamsa, kh(2)) && malIn(navamsa, kh(8));
    const alK = malIn(rasiPts, AL) && malIn(rasiPts, (AL + 1) % 12) && malIn(rasiPts, (AL + 7) % 12);
    if (kaK || alK) push("pd-33-94", "Kemadruma from malefics", `Malefics in ${kaK ? "the Karakamsa and its 2nd and 8th (navamsa)" : ""}${kaK && alK ? " and in " : ""}${alK ? "the Arudha lagna and its 2nd and 8th" : ""}: Parashara's Kemadruma of this chapter, felt in the dasas of the signs and planets concerned${(kaK ? asp(navamsa, KA) : asp(rasiPts, AL)).includes("Moon") ? ", and heavier with the Moon's aspect" : ""}.`, "strain", [], 33, "94-99", true);
  }

  return { padas, grahaPadas, karakas, constants, yogaKarakas, karakamsa: { signIndex: KA, ak: AK, akDegNavamsa: akNav.degInSign, lagnaNavamsa: lagnaNav }, navamsa, argalas, houseArgalas, findings: F, caveats: PADA_CAVEATS };
}
