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
  /** Predicate over the chart; omitted for reference-only entries. */
  test?: (ctx: YogaContext) => boolean;
}

export interface YogaContext {
  positions: PlanetPosition[];
  /** Lagna sign index (0..11). */
  lagnaIdx: number;
}

export const YOGA_NOTE =
  "Brihat Jataka 12 counts the Nabhasa yogas from the seven planets — Rahu and Ketu take no part (ch. 12 note), and exaltation, moolatrikona and the waxing Moon are not considered. The Dala yogas' benefic/malefic call uses the app's BPHS 3.11 natural benefic rule (provisional where the Sun and Moon are concerned).";

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

const KENDRA = new Set([1, 4, 7, 10]);

const quality = (p: PlanetPosition) => SIGN_QUALITY[p.signIndex];

// ── Brihat Jataka ch. 12: the 32 Nabhasa yogas (Asraya and Dala groups first) ──

export const YOGAS: Yoga[] = [
  {
    id: "rajju",
    name: "Rajju",
    source: BJ(12, 2),
    category: "nabhasa-asraya",
    condition: "all seven planets in movable signs",
    result: "fond of travel, moving about, crafty, cruel, thievish",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Movable"),
  },
  {
    id: "musala",
    name: "Musala",
    source: BJ(12, 2),
    category: "nabhasa-asraya",
    condition: "all seven planets in fixed signs",
    result: "proud, learned, wealthy, steady, a favourite of kings",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Fixed"),
  },
  {
    id: "nala",
    name: "Nala",
    source: BJ(12, 2),
    category: "nabhasa-asraya",
    condition: "all seven planets in common (dual) signs",
    result: "addicted to gain, ready in business, of helpful nature, skilful",
    test: (ctx) => seven(ctx.positions).every((p) => quality(p) === "Dual"),
  },
  {
    id: "srik",
    name: "Srik (Mala)",
    source: BJ(12, 2),
    category: "nabhasa-dala",
    condition: "the planets occupying the kendras are benefics",
    result: "comforts, vehicles, wealth, good reputation, happiness from relatives",
    test: (ctx) => {
      const inKendra = seven(ctx.positions).filter((p) =>
        KENDRA.has(houseFrom(ctx.lagnaIdx, p.signIndex)),
      );
      return (
        inKendra.length > 0 &&
        inKendra.every((p) => naturalBenefic(p, ctx.positions))
      );
    },
  },
  {
    id: "sarpa",
    name: "Sarpa",
    source: BJ(12, 2),
    category: "nabhasa-dala",
    condition: "the planets occupying the kendras are malefics",
    result: "cruel, mean, penniless, earning by fraudulent means",
    test: (ctx) => {
      const inKendra = seven(ctx.positions).filter((p) =>
        KENDRA.has(houseFrom(ctx.lagnaIdx, p.signIndex)),
      );
      return (
        inKendra.length > 0 &&
        inKendra.every((p) => !naturalBenefic(p, ctx.positions))
      );
    },
  },
];

/** The yogas whose predicate fires for the chart. */
export function computeYogas(ctx: YogaContext): Yoga[] {
  return YOGAS.filter((y) => y.test && y.test(ctx));
}
