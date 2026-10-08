// The yoga database: named planetary combinations harvested from the source texts, each entry
// citing its own text, chapter and stanza. Yogas are never blended across texts; the compute step
// only evaluates each entry's own predicate against the chart.
import {
  SIGN_QUALITY,
  houseFrom,
  naturalBenefic,
  type PlanetPosition,
} from "./astro";

export type YogaText =
  | "Brihat Jataka"
  | "BPHS"
  | "Sarvartha Chintamani"
  | "Prasna Marga"
  | "Jaimini";

export type YogaCategory =
  | "nabhasa-asraya"
  | "nabhasa-dala"
  | "nabhasa-akriti"
  | "nabhasa-sankhya"
  | "raja"
  | "lunar"
  | "solar"
  | "dvi-graha"
  | "ascetic";

export const YOGA_CATEGORY_LABEL: Record<YogaCategory, string> = {
  "nabhasa-asraya": "Nabhasa · Asraya (support)",
  "nabhasa-dala": "Nabhasa · Dala (lobe)",
  "nabhasa-akriti": "Nabhasa · Akriti (shape)",
  "nabhasa-sankhya": "Nabhasa · Sankhya (number)",
  raja: "Raja",
  lunar: "Lunar",
  solar: "Solar",
  "dvi-graha": "Two-planet",
  ascetic: "Ascetic (Sanyasa)",
};

export interface YogaSource {
  text: YogaText;
  chapter: number;
  stanza?: number;
  url?: string;
}

export interface Yoga {
  /** Stable slug, e.g. "rajju". */
  id: string;
  name: string;
  source: YogaSource;
  category: YogaCategory;
  /** The forming condition, plain text. */
  condition: string;
  /** The promised result, plain text. */
  result: string;
  /** A provisional reading, precedence or other caveat. */
  note?: string;
  /** Predicate over the chart; omitted for reference-only entries. */
  test?: (ctx: YogaContext) => boolean;
}

export interface YogaContext {
  positions: PlanetPosition[];
  /** Lagna sign index (0..11). */
  lagnaIdx: number;
}

export const YOGA_NOTE =
  "Brihat Jataka 12 counts the Nabhasa yogas from the seven planets — Rahu and Ketu take no part (ch. 12 note), and exaltation, moolatrikona and the waxing Moon are not considered. The Dala yogas' benefic/malefic call uses the app's BPHS 3.11 natural benefic rule (provisional where the Sun and Moon are concerned). A Sankhya yoga yields to any other Nabhasa yoga that holds at the same time (ch. 12, stanza 10 note).";

const BJ_BASE =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/";

const BJ = (chapter: number, stanza: number): YogaSource => ({
  text: "Brihat Jataka",
  chapter,
  stanza,
  url: BJ_BASE,
});

/** The seven planets (Rahu and Ketu take no part in the Nabhasa yogas). */
const seven = (positions: PlanetPosition[]) =>
  positions.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu");

const KENDRA = [1, 4, 7, 10];
const PANAPHARA_APOKLIMA = [2, 3, 5, 6, 8, 9, 11, 12];

const quality = (p: PlanetPosition) => SIGN_QUALITY[p.signIndex];

const house = (ctx: YogaContext, p: PlanetPosition) =>
  houseFrom(ctx.lagnaIdx, p.signIndex);

/** The set of houses the seven planets occupy. */
const houseSet = (ctx: YogaContext) =>
  new Set(seven(ctx.positions).map((p) => house(ctx, p)));

/** Every planet is in one of `hs`. */
const inHouses = (ctx: YogaContext, hs: number[]) =>
  seven(ctx.positions).every((p) => hs.includes(house(ctx, p)));

/** The occupied houses are exactly the set `hs` (same size, no extras). */
const exactlyHouses = (ctx: YogaContext, hs: number[]) => {
  const s = houseSet(ctx);
  return s.size === hs.length && hs.every((h) => s.has(h));
};

/** One of the target house-sets is occupied exactly. */
const oneOf = (ctx: YogaContext, sets: number[][]) =>
  sets.some((hs) => exactlyHouses(ctx, hs));

const ben = (ctx: YogaContext, p: PlanetPosition) =>
  naturalBenefic(p, ctx.positions);

/** The number of distinct signs the seven planets occupy. */
const distinctSigns = (ctx: YogaContext) =>
  new Set(seven(ctx.positions).map((p) => p.signIndex)).size;

/** The five tara grahas from Mars to Saturn (the "planets" of the lunar yogas). */
const FIVE = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
/** The natural benefics named for the Adhi and upachaya yogas: Mercury, Jupiter, Venus. */
const BENEFICS = ["Mercury", "Jupiter", "Venus"];

const moonSign = (ctx: YogaContext) =>
  ctx.positions.find((p) => p.planet === "Moon")!.signIndex;

const fromMoon = (ctx: YogaContext, p: PlanetPosition) =>
  houseFrom(moonSign(ctx), p.signIndex);

const UPACHAYA = [3, 6, 10, 11];

// ── Brihat Jataka ch. 12: the 32 Nabhasa yogas ──

const NABHASA: Yoga[] = [
  // Asraya (support), 12.2, effects 12.11
  {
    id: "rajju", name: "Rajju", source: BJ(12, 2), category: "nabhasa-asraya",
    condition: "all seven planets in movable signs",
    result: "jealous of others' wealth, goes to foreign lands, fond of travelling",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Movable"),
  },
  {
    id: "musala", name: "Musala", source: BJ(12, 2), category: "nabhasa-asraya",
    condition: "all seven planets in fixed signs",
    result: "respectable, rich, engages in various undertakings",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Fixed"),
  },
  {
    id: "nala", name: "Nala", source: BJ(12, 2), category: "nabhasa-asraya",
    condition: "all seven planets in common (dual) signs",
    result: "defective organs, settled views, rich, skilled in work",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Dual"),
  },
  // Dala (lobe), 12.2, effects 12.11
  {
    id: "srik", name: "Srik (Mala)", source: BJ(12, 2), category: "nabhasa-dala",
    condition: "the planets occupying the kendras are benefics",
    result: "lives in comfort and luxury",
    test: (ctx) => {
      const k = seven(ctx.positions).filter((p) => KENDRA.includes(house(ctx, p)));
      return k.length > 0 && k.every((p) => ben(ctx, p));
    },
  },
  {
    id: "sarpa", name: "Sarpa", source: BJ(12, 2), category: "nabhasa-dala",
    condition: "the planets occupying the kendras are malefics",
    result: "miserable in many ways",
    test: (ctx) => {
      const k = seven(ctx.positions).filter((p) => KENDRA.includes(house(ctx, p)));
      return k.length > 0 && k.every((p) => !ben(ctx, p));
    },
  },
  // Akriti (shape), 12.4, effects 12.13
  {
    id: "gada", name: "Gada", source: BJ(12, 4), category: "nabhasa-akriti",
    condition: "all seven planets in two adjacent kendras (1-4, 4-7, 7-10 or 10-1)",
    result: "performs sacrificial rites, rich, ever acquiring wealth",
    test: (ctx) => oneOf(ctx, [[1, 4], [4, 7], [7, 10], [10, 1]]),
  },
  {
    id: "sakata", name: "Sakata", source: BJ(12, 4), category: "nabhasa-akriti",
    condition: "all seven planets in the ascendant and the 7th house",
    result: "lives by carts, afflicted with diseases, mean wife",
    test: (ctx) => exactlyHouses(ctx, [1, 7]),
  },
  {
    id: "vihaga", name: "Vihaga (Andaja)", source: BJ(12, 4), category: "nabhasa-akriti",
    condition: "all seven planets in the 4th and 10th houses",
    result: "lives by carrying messages, fond of travel, causes quarrels",
    test: (ctx) => exactlyHouses(ctx, [4, 10]),
  },
  {
    id: "sringataka", name: "Sringataka", source: BJ(12, 4), category: "nabhasa-akriti",
    condition: "all seven planets in the ascendant, 5th and 9th houses",
    result: "happy in the latter end of life",
    test: (ctx) => exactlyHouses(ctx, [1, 5, 9]),
  },
  {
    id: "hala", name: "Hala", source: BJ(12, 4), category: "nabhasa-akriti",
    condition: "all seven planets in the other triangular houses (2-6-10, 3-7-11 or 4-8-12)",
    result: "tills lands",
    test: (ctx) => oneOf(ctx, [[2, 6, 10], [3, 7, 11], [4, 8, 12]]),
  },
  // Akriti, 12.5, effects 12.14
  {
    id: "vajra", name: "Vajra", source: BJ(12, 5), category: "nabhasa-akriti",
    condition: "benefics in the ascendant and 7th, malefics in the 4th and 10th",
    result: "happy at the beginning and end of life, a general favourite, bold in fight",
    test: (ctx) => {
      const s = seven(ctx.positions);
      if (!s.every((p) => KENDRA.includes(house(ctx, p)))) return false;
      const l = s.filter((p) => [1, 7].includes(house(ctx, p)));
      const r = s.filter((p) => [4, 10].includes(house(ctx, p)));
      return l.every((p) => ben(ctx, p)) && r.every((p) => !ben(ctx, p));
    },
  },
  {
    id: "yava", name: "Yava", source: BJ(12, 5), category: "nabhasa-akriti",
    condition: "malefics in the ascendant and 7th, benefics in the 4th and 10th",
    result: "powerful, happy in the middle of life",
    test: (ctx) => {
      const s = seven(ctx.positions);
      if (!s.every((p) => KENDRA.includes(house(ctx, p)))) return false;
      const l = s.filter((p) => [1, 7].includes(house(ctx, p)));
      const r = s.filter((p) => [4, 10].includes(house(ctx, p)));
      return l.every((p) => !ben(ctx, p)) && r.every((p) => ben(ctx, p));
    },
  },
  {
    id: "kamala", name: "Kamala (Padma)", source: BJ(12, 5), category: "nabhasa-akriti",
    condition: "all seven planets in the four kendras",
    result: "great renown, greatly happy, many attainments",
    test: (ctx) => exactlyHouses(ctx, KENDRA),
  },
  {
    id: "vapi", name: "Vapi", source: BJ(12, 5), category: "nabhasa-akriti",
    condition: "all seven planets in the panaphara and apoklima (non-kendra) houses",
    result: "poor comfort for a long time, buries wealth, a miser",
    test: (ctx) => inHouses(ctx, PANAPHARA_APOKLIMA),
  },
  // Akriti, 12.7, effects 12.15
  {
    id: "yupa", name: "Yupa", source: BJ(12, 7), category: "nabhasa-akriti",
    condition: "all seven planets in the four signs from the ascendant (1-2-3-4)",
    result: "liberal in gifts, performs high sacrificial rites",
    test: (ctx) => exactlyHouses(ctx, [1, 2, 3, 4]),
  },
  {
    id: "ishu", name: "Ishu (Bana)", source: BJ(12, 7), category: "nabhasa-akriti",
    condition: "all seven planets in the four signs from the 4th (4-5-6-7)",
    result: "indulges in torture, a jailor, makes arrows",
    test: (ctx) => exactlyHouses(ctx, [4, 5, 6, 7]),
  },
  {
    id: "sakti", name: "Sakti", source: BJ(12, 7), category: "nabhasa-akriti",
    condition: "all seven planets in the four signs from the 7th (7-8-9-10)",
    result: "disgraceful deeds, unskilled, without money and comfort",
    test: (ctx) => exactlyHouses(ctx, [7, 8, 9, 10]),
  },
  {
    id: "danda", name: "Danda", source: BJ(12, 7), category: "nabhasa-akriti",
    condition: "all seven planets in the four signs from the 10th (10-11-12-1)",
    result: "separated from the beloved, earns by servitude",
    test: (ctx) => exactlyHouses(ctx, [10, 11, 12, 1]),
  },
  // Akriti, 12.8, effects 12.16-17
  {
    id: "nau", name: "Nau", source: BJ(12, 8), category: "nabhasa-akriti",
    condition: "all seven planets in the seven signs from the ascendant (1-7)",
    result: "wide-spread fame, happy only now and then, a miser",
    test: (ctx) => exactlyHouses(ctx, [1, 2, 3, 4, 5, 6, 7]),
  },
  {
    id: "kuta", name: "Kuta", source: BJ(12, 8), category: "nabhasa-akriti",
    condition: "all seven planets in the seven signs from the 4th (4-10)",
    result: "indulges in lies, a jailor",
    test: (ctx) => exactlyHouses(ctx, [4, 5, 6, 7, 8, 9, 10]),
  },
  {
    id: "chhatra", name: "Chhatra", source: BJ(12, 8), category: "nabhasa-akriti",
    condition: "all seven planets in the seven signs from the 7th (7-12-1)",
    result: "makes his people happy, comfort in the latter end of life",
    test: (ctx) => exactlyHouses(ctx, [7, 8, 9, 10, 11, 12, 1]),
  },
  {
    id: "chapa", name: "Chapa", source: BJ(12, 8), category: "nabhasa-akriti",
    condition: "all seven planets in the seven signs from the 10th (10-12-1-4)",
    result: "delights in fight, comfort at the beginning and end of life",
    test: (ctx) => exactlyHouses(ctx, [10, 11, 12, 1, 2, 3, 4]),
  },
  {
    id: "ardha-chandra", name: "Ardha-Chandra", source: BJ(12, 8), category: "nabhasa-akriti",
    condition: "all seven planets in seven houses from a panaphara or apoklima",
    result: "a general favourite, agreeable person, respected by all",
    test: (ctx) =>
      oneOf(ctx, [
        [2, 3, 4, 5, 6, 7, 8], [3, 4, 5, 6, 7, 8, 9],
        [5, 6, 7, 8, 9, 10, 11], [6, 7, 8, 9, 10, 11, 12],
        [8, 9, 10, 11, 12, 1, 2], [9, 10, 11, 12, 1, 2, 3],
        [11, 12, 1, 2, 3, 4, 5], [12, 1, 2, 3, 4, 5, 6],
      ]),
  },
  // Akriti, 12.9, effects 12.17
  {
    id: "samudra", name: "Samudra", source: BJ(12, 9), category: "nabhasa-akriti",
    condition: "all seven planets in the six alternate houses from the 2nd (2-4-6-8-10-12)",
    result: "prosperous as a king, lives in comfort",
    test: (ctx) => exactlyHouses(ctx, [2, 4, 6, 8, 10, 12]),
  },
  {
    id: "chakra", name: "Chakra", source: BJ(12, 9), category: "nabhasa-akriti",
    condition: "all seven planets in the six alternate houses from the ascendant (1-3-5-7-9-11)",
    result: "an emperor, king of kings",
    test: (ctx) => exactlyHouses(ctx, [1, 3, 5, 7, 9, 11]),
  },
  // Sankhya (number), 12.10, effects 12.17-19
  {
    id: "vallaki", name: "Vallaki", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy seven signs",
    result: "intelligent, delights in music and dance",
    test: (ctx) => distinctSigns(ctx) === 7,
  },
  {
    id: "damini", name: "Damini", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy six signs",
    result: "liberal in gifts, delights in helping others, many cows",
    test: (ctx) => distinctSigns(ctx) === 6,
  },
  {
    id: "pasa", name: "Pasa", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy five signs",
    result: "with servants and kinsmen, earns wealth by proper means",
    test: (ctx) => distinctSigns(ctx) === 5,
  },
  {
    id: "kedara", name: "Kedara", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy four signs",
    result: "tills lands, useful to many by good deeds",
    test: (ctx) => distinctSigns(ctx) === 4,
  },
  {
    id: "sula", name: "Sula", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy three signs",
    result: "bold in fight, receives blows, fond of money but poor",
    test: (ctx) => distinctSigns(ctx) === 3,
  },
  {
    id: "yuga", name: "Yuga", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy two signs",
    result: "poor, acts in contravention of Vedic rules",
    test: (ctx) => distinctSigns(ctx) === 2,
  },
  {
    id: "gola", name: "Gola", source: BJ(12, 10), category: "nabhasa-sankhya",
    condition: "all seven planets occupy a single sign",
    result: "poor, dirty, ignorant, low deeds, unskilled, ill, wandering",
    test: (ctx) => distinctSigns(ctx) === 1,
  },
];

// ── Brihat Jataka ch. 14: the lunar (Chandra) yogas ──

const LUNAR: Yoga[] = [
  {
    id: "adhi",
    name: "Adhi",
    source: BJ(14, 2),
    category: "lunar",
    condition: "Mercury, Jupiter or Venus in the 6th, 7th or 8th house from the Moon",
    result: "a general, minister or king; great pleasures and wealth, subdued enemies, long life, free from disease and fear",
    test: (ctx) =>
      BENEFICS.some((b) => {
        const p = ctx.positions.find((x) => x.planet === b);
        return p && [6, 7, 8].includes(fromMoon(ctx, p));
      }),
  },
  {
    id: "sunapha",
    name: "Sunapha",
    source: BJ(14, 3),
    category: "lunar",
    condition: "a planet from Mars to Saturn in the 2nd house from the Moon (and none in the 12th)",
    result: "self-acquired property, a king or king-like, intelligent, wealthy, renown",
    note: "Effects per the yoga planet are 14.7-8 (Mars: active, fond of fight; Mercury: skilled, good speech; Jupiter: wealthy, virtuous; Venus: passionate, very wealthy; Saturn: enjoys others' wealth).",
    test: (ctx) => {
      const second = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 2,
      );
      const twelfth = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 12,
      );
      return second && !twelfth;
    },
  },
  {
    id: "anapha",
    name: "Anapha",
    source: BJ(14, 3),
    category: "lunar",
    condition: "a planet from Mars to Saturn in the 12th house from the Moon (and none in the 2nd)",
    result: "influence and authority, free from disease, control over passions, great renown, all pleasures, neat dress, free from grief",
    test: (ctx) => {
      const second = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 2,
      );
      const twelfth = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 12,
      );
      return !second && twelfth;
    },
  },
  {
    id: "durudhura",
    name: "Durudhura",
    source: BJ(14, 3),
    category: "lunar",
    condition: "planets from Mars to Saturn in both the 2nd and the 12th house from the Moon",
    result: "all pleasures, wealth and carriages, liberal in gifts, good servants",
    test: (ctx) => {
      const second = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 2,
      );
      const twelfth = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 12,
      );
      return second && twelfth;
    },
  },
  {
    id: "kemadruma",
    name: "Kemadruma",
    source: BJ(14, 3),
    category: "lunar",
    condition: "no planet from Mars to Saturn in the 2nd or 12th house from the Moon",
    result: "dirty, afflicted with grief, deeds unsuited to rank, poor, serves others, wicked",
    note: "Cancelled (14.3 note) when the Moon is in a kendra from the ascendant or accompanied by a planet.",
    test: (ctx) => {
      const second = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 2,
      );
      const twelfth = ctx.positions.some(
        (p) => FIVE.includes(p.planet) && fromMoon(ctx, p) === 12,
      );
      return !second && !twelfth;
    },
  },
  {
    id: "upachaya-dhana",
    name: "Upachaya dhana",
    source: BJ(14, 9),
    category: "lunar",
    condition: "Mercury, Jupiter or Venus in the upachaya (3rd, 6th, 10th, 11th) from the Ascendant or the Moon",
    result: "rich (the more such benefics, the greater the wealth)",
    test: (ctx) =>
      BENEFICS.some((b) => {
        const p = ctx.positions.find((x) => x.planet === b);
        if (!p) return false;
        return (
          UPACHAYA.includes(houseFrom(ctx.lagnaIdx, p.signIndex)) ||
          UPACHAYA.includes(fromMoon(ctx, p))
        );
      }),
  },
];

// ── Brihat Jataka ch. 15: the double-planetary (dvi-graha) yogas ──

const sameSign = (ctx: YogaContext, a: string, b: string) => {
  const pa = ctx.positions.find((p) => p.planet === a);
  const pb = ctx.positions.find((p) => p.planet === b);
  return !!pa && !!pb && pa.signIndex === pb.signIndex;
};

const dvi = (a: string, b: string, stanza: number, result: string): Yoga => ({
  id: `${a.toLowerCase()}-${b.toLowerCase()}`,
  name: `${a}–${b}`,
  source: BJ(15, stanza),
  category: "dvi-graha",
  condition: `${a} and ${b} in the same sign`,
  result,
  test: (ctx) => sameSign(ctx, a, b),
});

const DVI_GRAHA: Yoga[] = [
  dvi("Sun", "Moon", 1, "a maker of fire engines, works in stones"),
  dvi("Sun", "Mars", 1, "addicted to sinful deeds"),
  dvi("Sun", "Mercury", 1, "skilled in work, intelligent, famous, lives in comfort"),
  dvi("Sun", "Jupiter", 1, "cruel, works for other men"),
  dvi("Sun", "Venus", 1, "gains money by public sports and the use of weapons"),
  dvi("Sun", "Saturn", 1, "skilled in metal work and earthen-ware"),
  dvi("Moon", "Mars", 2, "earns by selling works of art, women, liquor and pots; troubles his mother"),
  dvi("Moon", "Mercury", 2, "sweet speech, skilled in literary interpretation, popular, famous"),
  dvi("Moon", "Jupiter", 2, "defeats enemies, important in his family, not of firm views, very rich"),
  dvi("Moon", "Venus", 2, "skilled in cloth work (weaving, stitching, dyeing)"),
  dvi("Moon", "Saturn", 2, "the son of a re-married woman"),
  dvi("Mars", "Mercury", 3, "deals in roots, oil and works of art, skilled in duels"),
  dvi("Mars", "Jupiter", 3, "chief of a town or a king, or a wealthy Brahmin"),
  dvi("Mars", "Venus", 3, "protects cows, duels, skilled in work, adulterous, a gambler"),
  dvi("Mars", "Saturn", 3, "afflicted with grief, a liar, despised by others"),
  dvi("Mercury", "Jupiter", 4, "skilled in duels, fond of music, learned in dance"),
  dvi("Mercury", "Venus", 4, "good speech, a ruler over countries and men"),
  dvi("Mercury", "Saturn", 4, "skilled in deceiving others, rejects his preceptor's advice"),
  dvi("Jupiter", "Venus", 4, "learned, wealth, a wife and various virtues"),
  dvi("Jupiter", "Saturn", 4, "a barber, a potman or a cook"),
  dvi("Venus", "Saturn", 5, "short-sighted, wealth through a young woman's friendship, skilled in writing and painting"),
];

// ── Brihat Jataka ch. 16: the ascetic (Sanyasa / Pravrajya) yogas ──

const ASCETIC: Yoga[] = [
  {
    id: "sanyasa",
    name: "Sanyasa (Pravrajya)",
    source: BJ(16, 1),
    category: "ascetic",
    condition: "four or more powerful planets in a single sign",
    result:
      "becomes an ascetic, of a class set by the most powerful planet — Mars: Sakya; Mercury: Ajivika; Jupiter: Bhikshuka; Moon: Vriddhasravaka; Venus: Chakra; Saturn: Nirgrantha; Sun: Vanyasana",
    note: "If no planet is powerful there is no Pravrajya; if the powerful planet suffered defeat in conjunction, the ascetic reverts (16.1-2). The predicate takes the sign holding four or more planets, the 'powerful' call being provisional.",
    test: (ctx) => {
      const count = new Map<number, number>();
      let max = 0;
      for (const p of seven(ctx.positions)) {
        const n = (count.get(p.signIndex) ?? 0) + 1;
        count.set(p.signIndex, n);
        if (n > max) max = n;
      }
      return max >= 4;
    },
  },
  {
    id: "chandra-sani-pravrajya",
    name: "Moon–Saturn Pravrajya",
    source: BJ(16, 3),
    category: "ascetic",
    condition:
      "the lord of the Moon's sign aspects Saturn unaspected by others; or Saturn aspects that lord when it is not powerful; or the Moon in Saturn's drekkana and Saturn's or Mars' navamsa aspected by Saturn",
    result: "becomes an ascetic",
    note: "Reference entry — the aspect and varga conditions are not yet computed.",
  },
];

// ── Brihat Jataka ch. 11: the raja-yoga rules (the general ones; the 96 named
//    configurations of 11.4-18 are enumerations, not individually harvested) ──

const RAJA: Yoga[] = [
  {
    id: "uccha-raja",
    name: "Uccha raja yoga",
    source: BJ(11, 1),
    category: "raja",
    condition: "three or more planets in their exaltation signs",
    result:
      "becomes a king — tyrannical if the exalted are malefics, good if benefics, and both by turns if mixed",
    note: "The same holds for planets in their moolatrikona (11.1 note). The 96 specific raja-yoga configurations of 11.4-18 are enumerations and not individually harvested.",
    test: (ctx) =>
      ctx.positions.filter((p) => p.dignity === "Exalted").length >= 3,
  },
  {
    id: "uccha-moola-raja",
    name: "Uccha/Moolatrikona raja yoga",
    source: BJ(11, 13),
    category: "raja",
    condition:
      "three or more powerful planets in their exaltation or moolatrikona signs (five or more to rule regardless of birth)",
    result:
      "a king if born in a king's family; with five or more, a king even in a low family; with fewer, rich but not a king",
    note: "The 'powerful' gate is provisional — the predicate counts exalted or moolatrikona planets without a strength check.",
    test: (ctx) =>
      ctx.positions.filter(
        (p) => p.dignity === "Exalted" || p.dignity === "Moolatrikona",
      ).length >= 3,
  },
  {
    id: "sukha-raja",
    name: "Comfort yoga",
    source: BJ(11, 20),
    category: "raja",
    condition:
      "Jupiter, Venus or Mercury in the ascendant, or Saturn in the 7th, or the Sun in the 10th",
    result: "lives in comfort and luxury",
    test: (ctx) => {
      const h = (p: PlanetPosition) => houseFrom(ctx.lagnaIdx, p.signIndex);
      const benInLagna = ctx.positions.some(
        (p) => ["Jupiter", "Venus", "Mercury"].includes(p.planet) && h(p) === 1,
      );
      const saturnIn7 = ctx.positions.some(
        (p) => p.planet === "Saturn" && h(p) === 7,
      );
      const sunIn10 = ctx.positions.some(
        (p) => p.planet === "Sun" && h(p) === 10,
      );
      return benInLagna || saturnIn7 || sunIn10;
    },
  },
];

export const YOGAS: Yoga[] = [...NABHASA, ...LUNAR, ...DVI_GRAHA, ...ASCETIC, ...RAJA];

/** The yogas whose predicate fires for the chart, applying the Nabhasa precedence. */
export function computeYogas(ctx: YogaContext): Yoga[] {
  const fired = YOGAS.filter((y) => y.test && y.test(ctx));
  const hasOtherNabhasa = fired.some(
    (y) => y.category.startsWith("nabhasa") && y.category !== "nabhasa-sankhya",
  );
  return fired.filter(
    (y) => y.category !== "nabhasa-sankhya" || !hasOtherNabhasa,
  );
}
