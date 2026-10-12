/**
 * What each divisional chart is for, and which of its houses the sources read for that matter.
 * Display only: no rule, verdict or kernel code imports this module (guarded in
 * scripts/varga-meanings.test.ts), so nothing here moves a reading.
 *
 * Three voices, each labelled and never merged:
 * - Parashara: the matter of each chart (7.1-8, kept on VargaDef.matter), and the two navamsa
 *   houses his marriage verses read: the navamsa lagna (18.32) and the 7th of the navamsa (18.19).
 * - Mehta: M.S. Mehta, Analysing Horoscope Through Modern Techniques (3rd revised ed.), ch. XVIII
 *   "Vargas", cited by its numbered sections because the Kindle pages are not yet confirmed, and
 *   his profession cases, which read the Dasamsa's lagna and 10th. Paraphrased in our own words.
 * - Pande: Shivanshu Pande, Kundali Deep Dive, the opening method notes on the divisional charts.
 *   Paraphrased; the extract has no page numbers.
 *
 * A house no source reads in a chart is shown with its birth-chart meaning (11.2-13). Mehta reads
 * the 4th and 5th for education "not only in birth chart but also in" the D24, and Pande reads the
 * navamsa "as a standalone chart with its own lagna, its own house lords". Carrying every house's
 * birth-chart meaning into every chart extends that practice; the extension is the app's and is
 * marked provisional.
 */
import type { VargaKey } from "./vargas";
import { BPHS_URL } from "./parashari-data";

export type VargaVoice = "Parashara" | "Mehta" | "Pande";

export interface VargaCite {
  voice: VargaVoice;
  /** Verse, section or passage. */
  ref: string;
  /** Parashara's verses link to the translation. */
  url?: string;
}

export interface VargaHouseRead {
  /** Counted from the chart's own lagna. */
  house: number;
  /** The source reads the house's lord as well. */
  withLord: boolean;
  /** What the house is read for in this chart, in plain words. */
  plain: string;
  /** The practitioner wording. */
  text: string;
  cites: VargaCite[];
}

export interface VargaMeaning {
  key: VargaKey;
  /** Parashara's matter (7.1-8) in plain words. */
  plain: string;
  /** What Mehta says the chart is seen for, paraphrased. */
  mehta?: { text: string; ref: string };
  /** Pande's note, paraphrased, where he names the chart. */
  pande?: { text: string; ref: string };
  /** Houses a source reads in this chart for its matter. */
  houses: VargaHouseRead[];
  /** Set when the sources read the chart by something other than its houses. */
  notByHouses?: { plain: string; text: string; cites: VargaCite[] };
}

const P = (ch: number, verse: string): VargaCite => ({ voice: "Parashara", ref: `${ch}.${verse}`, url: BPHS_URL(ch) });
const XVIII = (section: string) => `ch. XVIII, ${section}`;
const M = (ref: string): VargaCite => ({ voice: "Mehta", ref });
const PANDE_REF = "opening method notes";
const PANDE: VargaCite = { voice: "Pande", ref: PANDE_REF };
const MEHTA_CAREER = "profession cases (the M.Tech. case, after Naval Singh)";

export const VARGA_MEANINGS: VargaMeaning[] = [
  {
    key: "D1",
    plain: "the body and the whole life",
    mehta: { text: "the base chart: what it and the dasa do not promise, no other chart can give", ref: XVIII("§1 Rasi") },
    houses: [],
  },
  {
    key: "D2",
    plain: "wealth",
    mehta: { text: "wealth and prosperity, the matters of the 2nd house", ref: XVIII("§2 Hora") },
    houses: [],
    notByHouses: {
      plain: "Every planet falls in Cancer (the Moon's half) or Leo (the Sun's half), so this chart is read by which half a planet is in, not by its houses.",
      text: "Parashara's hora puts every planet in Cancer or Leo; Mehta reads the chart by the Sun's and the Moon's horas.",
      cites: [P(6, "5-6"), M(XVIII("§2 Hora"))],
    },
  },
  {
    key: "D3",
    plain: "brothers and sisters",
    mehta: { text: "brothers and sisters, and relations with them", ref: XVIII("§4 Drekkan") },
    houses: [
      {
        house: 3,
        withLord: true,
        plain: "brothers and sisters, and the bond with them",
        text: "relations with brothers: malefics here do not help them, and the 3rd lord should be a friend of the birth chart's lagna lord",
        cites: [M(XVIII("§4 Drekkan, relation with brother"))],
      },
    ],
  },
  {
    key: "D4",
    plain: "fortune, property and homes",
    mehta: { text: "fate and fortune (bhagya), property movable and immovable, and conveyances; he has used it to predict building or owning a house", ref: XVIII("§5 Chaturthamsa") },
    houses: [],
  },
  {
    key: "D7",
    plain: "children and grandchildren",
    mehta: { text: "children, the happiness they bring, their sex and related matters", ref: XVIII("§6 Saptamsa") },
    pande: { text: "used for children where the question calls for it", ref: PANDE_REF },
    houses: [
      {
        house: 1,
        withLord: true,
        plain: "read with the 5th",
        text: "the lagna lord, read with the 5th lord: both strong and well placed, children bring every kind of happiness",
        cites: [M(XVIII("§6 Saptamsa"))],
      },
      {
        house: 5,
        withLord: true,
        plain: "children",
        text: "the 5th lord, read with the lagna lord",
        cites: [M(XVIII("§6 Saptamsa"))],
      },
    ],
  },
  {
    key: "D9",
    plain: "marriage and the spouse",
    mehta: { text: "marriage: its timing, married life, and the partner's looks, nature and character", ref: XVIII("§3 Navamsa") },
    pande: { text: "read as a chart of its own, with its own lagna, house lords and yogas", ref: PANDE_REF },
    houses: [
      {
        house: 1,
        withLord: true,
        plain: "read first",
        text: "the navamsa lagna: 18.32 times marriage by Venus there, with the 8th lord in the 7th; Pande reads the navamsa lagna lord in full",
        cites: [P(18, "32"), PANDE],
      },
      {
        house: 7,
        withLord: true,
        plain: "the spouse",
        text: "the 7th of the navamsa: 18.19 reads its lord; Mehta says most astrologers describe the spouse from it; Pande reads its lord in full",
        cites: [P(18, "19"), M(XVIII("§3 Navamsa")), PANDE],
      },
    ],
  },
  {
    key: "D10",
    plain: "career, standing and honour",
    mehta: { text: "profession and achievement in career, the trend of destiny, honour and success, and the ups and downs of a career", ref: XVIII("§9 Dasamsa") },
    pande: { text: "used for career where the question calls for it", ref: PANDE_REF },
    houses: [
      {
        house: 1,
        withLord: true,
        plain: "read with the 10th",
        text: "the lagna and its lord, read with the 10th: Mehta's cases weigh the strength of both",
        cites: [M(MEHTA_CAREER)],
      },
      {
        house: 10,
        withLord: true,
        plain: "career and standing",
        text: "the 10th and its lord, read with the lagna",
        cites: [M(MEHTA_CAREER)],
      },
    ],
  },
  {
    key: "D12",
    plain: "parents",
    mehta: { text: "the parents: their help and the happiness they bring, and their social and financial standing", ref: XVIII("§8 Dwadasamsa") },
    houses: [
      {
        house: 1,
        withLord: true,
        plain: "read with the 4th and 9th",
        text: "the lagna and its lord: with benefics joined or aspecting, every pleasure from the parents",
        cites: [M(XVIII("§8 Dwadasamsa"))],
      },
      {
        house: 4,
        withLord: true,
        plain: "mother",
        text: "the 4th and its lord, for the mother, whom 11.5 gives to the 4th",
        cites: [M(XVIII("§8 Dwadasamsa")), P(11, "5")],
      },
      {
        house: 9,
        withLord: true,
        plain: "father",
        text: "the 9th and its lord, for the father; Mehta heads his ch. IX the house of dharma, father and long journeys",
        cites: [M(XVIII("§8 Dwadasamsa")), M("ch. IX")],
      },
    ],
  },
  {
    key: "D16",
    plain: "vehicles and comforts",
    mehta: { text: "conveyances and general happiness; K.N. Rao has used it for vehicles and accidents", ref: XVIII("§10 Shodasamsa") },
    houses: [],
  },
  {
    key: "D20",
    plain: "worship and the spiritual life",
    mehta: { text: "worship (upasana) and what it brings: meditation, spiritual leaning and religious practice", ref: XVIII("§11 Vimsamsa") },
    houses: [],
  },
  {
    key: "D24",
    plain: "learning and education",
    mehta: { text: "education and learning", ref: XVIII("§12 Chaturvimshamsa") },
    houses: [
      {
        house: 4,
        withLord: true,
        plain: "education, with the 5th",
        text: "the 4th and its lord, read with the 5th here as in the birth chart; in the 6th, 8th or 12th, or aspected by malefics, they show breaks in study",
        cites: [M(XVIII("§12 Chaturvimshamsa"))],
      },
      {
        house: 5,
        withLord: true,
        plain: "education, with the 4th",
        text: "the 5th and its lord, read with the 4th here as in the birth chart",
        cites: [M(XVIII("§12 Chaturvimshamsa"))],
      },
    ],
  },
  {
    key: "D27",
    plain: "strengths and weaknesses",
    mehta: { text: "general strengths and weaknesses, bodily strength among them", ref: XVIII("§13 Saptvimshamsa") },
    houses: [],
  },
  {
    key: "D30",
    plain: "difficulties, and character",
    mehta: { text: "misfortunes (arishta), and character", ref: XVIII("§7 Trimsamsa") },
    houses: [],
    notByHouses: {
      plain: "The sources read this chart by the planet that rules the slice of the sign each planet falls in, not by its houses.",
      text: "Parashara's trimsamsa never falls in Cancer or Leo; Mehta reads it by the lord of each planet's trimsamsa, after Varahamihira, and gives it no house reading.",
      cites: [P(6, "27-28"), M(XVIII("§7 Trimsamsa"))],
    },
  },
  {
    key: "D40",
    plain: "good and difficult effects in general",
    mehta: { text: "the auspicious and inauspicious effects of the chart on the native", ref: XVIII("§14 Khavedamsa") },
    houses: [],
  },
  {
    key: "D45",
    plain: "general indications",
    mehta: { text: "character and conduct, and the general auspicious and inauspicious effects", ref: XVIII("§15 Akshvedamsa") },
    houses: [],
  },
  {
    key: "D60",
    plain: "general indications",
    mehta: { text: "general auspicious and inauspicious indications; he marks each of the sixty deities benefic or malefic", ref: XVIII("§16 Shashtiamsa") },
    houses: [],
  },
];

export const VARGA_MEANING_BY_KEY = Object.fromEntries(VARGA_MEANINGS.map((m) => [m.key, m])) as Record<VargaKey, VargaMeaning>;

export const VARGA_MEANING_NOTES = {
  base: "Mehta treats the birth chart as the base: what it and the running periods do not promise, the finer charts cannot give.",
  baseRef: XVIII("§1 Rasi"),
  time: "Pande uses the finer charts with full awareness of how much they depend on the birth time.",
  timeRef: PANDE_REF,
  houses:
    "A marked house is one a source reads in this chart. The others show their birth-chart meaning (11.2-13); reading them for this chart's matter follows the sources' practice, but the extension is the app's, so it is provisional.",
  mehtaRef: "Mehta is cited by the numbered sections of his ch. XVIII; the Kindle pages are not yet confirmed.",
};

/** 1 → "1st", 2 → "2nd", 11 → "11th". */
export function houseOrdinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}

/** Short house list for the overview: "lagna, 5th". */
export function housesRead(m: VargaMeaning): string {
  if (m.key === "D1") return "every house, by 11.2-13";
  if (m.notByHouses) return "not read by houses";
  if (!m.houses.length) return "none named";
  return m.houses.map((h) => (h.house === 1 ? "lagna" : houseOrdinal(h.house))).join(", ");
}
