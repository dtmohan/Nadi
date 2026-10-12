/**
 * Special stars counted from the birth star (the Moon's nakshatra at birth), and the passages of
 * Saturn, Jupiter, Rahu, Ketu and a lingering Mars through them. Three readings, each kept to its own
 * source and never blended:
 *
 * - Mantreswara, Phaladeepika 26.27-28 (tr. V. Subrahmanya Sastri): a malefic transiting the 1st,
 *   3rd, 5th, 7th, 10th, 19th or 23rd star from the birth star brings danger to life; if the planet
 *   is a benefic, failure in undertakings is the only result, and 26.27 says benefics there bring no
 *   danger to life.
 * - The Sarvatobhadra verses the translator quotes under 26.48 "from other works" (extract vv.
 *   45-50, the first of them from the Jatakabharana): a malefic's vedha on the 1st, 10th, 19th and
 *   23rd brings death, distress, being away from one's place and quarrels with relatives; on the
 *   18th something untoward, on the 16th loss; a benefic's vedha is auspicious. Only occupation of the
 *   star is read here; the chakra's line vedha is not computed. Practitioner reading only.
 * - Komilla Sutton, The Nakshatras: The Stars Beyond the Zodiac (Wessex, 2014), ch. 9, "Nadi
 *   Nakshatra" (e-book pp. 297-304): modern readings of transits through the named stars. Her
 *   nine-fold tara groups are not applied to these slow passages (Pande's Gochara Deep Dive keeps
 *   the tara cycle to the Moon's daily transit).
 *
 * The count is in 27 stars, the birth star being the 1st (Sutton; the Abhijit-inclusive 28-star
 * count of the Sarvatobhadra chakra is not used). Sutton's summary table swaps the 16th and the 23rd;
 * her text, the quoted Sarvatobhadra verses and Kane's History of Dharmasastra (vol. 5) put
 * Sanghatika at the 16th and Vainashika at the 23rd, which is used here.
 */
import type { NakshatraPeriod } from "./astro";
import { NAKSHATRAS } from "./astro";

export type StarPlanet = NakshatraPeriod["planet"];
export const STAR_PLANETS: StarPlanet[] = [
  "Saturn",
  "Jupiter",
  "Rahu",
  "Ketu",
  "Mars",
];
/** Mars is read only when it stays this many days in one star (a stay round a retrograde station). */
export const MARS_MIN_DAYS = 42;
/** A return to the same star within this many days joins the earlier stay (a retrograde dip). */
export const MERGE_GAP_DAYS = 240;

export const PHALADEEPIKA_CH26_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html";
export const SUTTON_BOOK =
  "Komilla Sutton, The Nakshatras: The Stars Beyond the Zodiac (Wessex, 2014), ch. 9";

export interface StarSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export interface NamedStar {
  count: number;
  /** The name the sources give the star. */
  name: string;
  /** Plain description used in the plain reading. */
  plain: string;
}

export const NAMED_STARS: NamedStar[] = [
  { count: 1, name: "Janma", plain: "your birth star" },
  { count: 3, name: "Vipat", plain: "the 3rd star from your birth star" },
  { count: 5, name: "Pratyara", plain: "the 5th star from your birth star" },
  { count: 7, name: "Vadha", plain: "the 7th star from your birth star" },
  { count: 8, name: "Matru", plain: "the 8th star, read for the mother" },
  { count: 10, name: "Karma", plain: "the 10th star, the star of work" },
  {
    count: 16,
    name: "Sanghatika",
    plain: "the 16th star, the star of close associations",
  },
  { count: 18, name: "Samudaya", plain: "the 18th star, the star of rising" },
  {
    count: 19,
    name: "Adhana",
    plain: "the 19th star, the star of new beginnings",
  },
  {
    count: 23,
    name: "Vainashika",
    plain: "the 23rd star from your birth star",
  },
  { count: 25, name: "Manasa", plain: "the 25th star, the star of the mind" },
  {
    count: 27,
    name: "Abhisheka",
    plain: "the 27th star, the star of standing",
  },
];
const STAR_BY_COUNT = new Map(NAMED_STARS.map((s) => [s.count, s]));

export function namedStar(count: number): NamedStar | undefined {
  return STAR_BY_COUNT.get(count);
}

/** The 27-star count of a nakshatra from the birth star (the birth star itself is the 1st). */
export function starCount(janmaIndex: number, nakshatraIndex: number): number {
  return ((nakshatraIndex - janmaIndex + 27) % 27) + 1;
}

/** True when the nakshatra is one of the named stars counted from this birth star. */
export function isNamedNakshatra(
  janmaIndex: number,
  nakshatraIndex: number,
): boolean {
  return STAR_BY_COUNT.has(starCount(janmaIndex, nakshatraIndex));
}

export function janmaIndexOf(moonLon: number): number {
  return Math.floor((((moonLon % 360) + 360) % 360) / (360 / 27)) % 27;
}

export interface StarPassage {
  planet: StarPlanet;
  nakshatraIndex: number;
  /** Count from the birth star, 1-27. */
  count: number;
  /** First entry and final exit (ISO instants). */
  start: string;
  end: string;
  /** Days actually spent in the star; less than end minus start when a retrograde dip interrupts. */
  days: number;
  /** True when the planet left the star and came back within the passage. */
  returns: boolean;
}

const DAY = 864e5;
const t = (iso: string) => Date.parse(iso);

/**
 * A planet's nakshatra periods merged into passages through the named stars: a return to the same
 * star within MERGE_GAP_DAYS joins the earlier stay. Mars keeps only stays of MARS_MIN_DAYS or more.
 * Used by the server to keep the chart result small; the reading itself is made in the client.
 */
export function starPassages(
  periods: NakshatraPeriod[],
  janmaIndex: number,
): StarPassage[] {
  const open = new Map<number, StarPassage>();
  const out: StarPassage[] = [];
  for (const p of [...periods].sort((a, b) => t(a.start) - t(b.start))) {
    const days = (t(p.end) - t(p.start)) / DAY;
    const prev = open.get(p.nakshatraIndex);
    if (prev && (t(p.start) - t(prev.end)) / DAY < MERGE_GAP_DAYS) {
      prev.end = p.end;
      prev.days += days;
      prev.returns = true;
      continue;
    }
    const passage: StarPassage = {
      planet: p.planet,
      nakshatraIndex: p.nakshatraIndex,
      count: starCount(janmaIndex, p.nakshatraIndex),
      start: p.start,
      end: p.end,
      days,
      returns: false,
    };
    open.set(p.nakshatraIndex, passage);
    out.push(passage);
  }
  return out
    .filter((x) => STAR_BY_COUNT.has(x.count))
    .filter((x) => x.planet !== "Mars" || x.days >= MARS_MIN_DAYS)
    .map((x) => ({ ...x, days: Math.round(x.days) }));
}

export type StarTone = "support" | "strain" | "mixed";
export type StarReadingSource = "phaladeepika" | "sarvatobhadra" | "sutton";

export interface StarReading {
  source: StarReadingSource;
  /** Practitioner wording, close to the source. */
  text: string;
  /** Plain wording, gentle. Empty when the reading is for practitioners only. */
  plain: string;
  cite: StarSource;
  tone: StarTone;
  /** Danger to life or death: withheld for a native under the gate age. */
  sensitive?: boolean;
  /** A reading of work or career, held back in the plain reading before the working years. */
  area?: "career";
}

const MALEFICS = new Set<StarPlanet>(["Saturn", "Mars", "Rahu", "Ketu"]);
export const isMaleficStar = (p: StarPlanet) => MALEFICS.has(p);

const PD = (verse: string): StarSource => ({
  label: `Phaladeepika 26.${verse}`,
  url: PHALADEEPIKA_CH26_URL,
});
const SBC: StarSource = {
  label: "Sarvatobhadra verses quoted under Phaladeepika 26.48",
  url: PHALADEEPIKA_CH26_URL,
};
const SUT = (page: string): StarSource => ({
  label: `Sutton 2014, ch. 9, e-book p. ${page}`,
  url: "",
});

/** Mantreswara's seven stars (26.28). */
const PD_STARS = new Set([1, 3, 5, 7, 10, 19, 23]);
/** The Sarvatobhadra verses' results for a malefic's vedha (extract vv. 49-50). */
const SBC_MALEFIC: Record<number, { result: string; sensitive?: boolean }> = {
  1: { result: "death", sensitive: true },
  10: { result: "distress" },
  19: { result: "being away from one's place" },
  23: { result: "quarrels with one's relatives" },
  18: { result: "something untoward" },
  16: { result: "loss" },
};

/** The readings of one planet's passage through one named star, in source order. */
export function starReadings(planet: StarPlanet, count: number): StarReading[] {
  const star = STAR_BY_COUNT.get(count);
  if (!star) return [];
  const malefic = MALEFICS.has(planet);
  const out: StarReading[] = [];

  if (PD_STARS.has(count)) {
    out.push(
      malefic
        ? {
            source: "phaladeepika",
            text: `A malefic transiting the ${ordinal(count)} star from the birth star (${star.name}) brings danger to life.`,
            plain: `Mantreswara counts this among the stars where a malefic's passage calls for extra care of health and safety.`,
            cite: PD("28"),
            tone: "strain",
            sensitive: true,
          }
        : {
            source: "phaladeepika",
            text: `A benefic transiting the ${ordinal(count)} star (${star.name}) brings only failure in undertakings; 26.27 adds that benefics there carry no threat of the kind a malefic brings.`,
            plain: `Mantreswara reads a benefic here as a time when undertakings may stall, without the harm a malefic brings.`,
            cite: PD("27-28"),
            tone: "mixed",
          },
    );
  }

  const sbc = SBC_MALEFIC[count];
  if (sbc)
    out.push(
      malefic
        ? {
            source: "sarvatobhadra",
            text: `A malefic's vedha on the ${star.name} star (${ordinal(count)}) brings ${sbc.result}. Read here for occupation of the star only.`,
            plain: "",
            cite: SBC,
            tone: "strain",
            sensitive: sbc.sensitive,
          }
        : {
            source: "sarvatobhadra",
            text: `A benefic's vedha on the ${star.name} star (${ordinal(count)}) is auspicious. Read here for occupation of the star only.`,
            plain: "",
            cite: SBC,
            tone: "support",
          },
    );

  const sut = suttonReading(planet, count, malefic);
  if (sut) out.push(sut);
  return out;
}

function suttonReading(
  planet: StarPlanet,
  count: number,
  malefic: boolean,
): StarReading | null {
  const r = (
    page: string,
    text: string,
    plain: string,
    tone: StarTone,
    area?: "career",
  ): StarReading => ({
    source: "sutton",
    text,
    plain,
    cite: SUT(page),
    tone,
    area,
  });
  switch (count) {
    case 1:
      return r(
        "299",
        "Transits to the janma nakshatra can create positive changes or negative issues.",
        "Sutton reads a passage over the birth star as able to bring change, for better or for worse.",
        "mixed",
      );
    case 8:
      return r(
        "301",
        "Transits to the matru nakshatra can improve or create problems in one's relationship with the mother and in her own life.",
        "Sutton reads this star for the mother: a passage here can ease or strain the bond with her, and touch her own life.",
        "mixed",
      );
    case 10:
      return r(
        "301",
        "Transits to the karma nakshatra can lead to major career success.",
        "Sutton reads a passage over the star of work as able to bring a major step in one's career.",
        "support",
        "career",
      );
    case 16:
      return malefic
        ? r(
            "302",
            "Sanghatika is the star of close associations that can hurt; malefics transiting it create problems.",
            "Sutton reads this star for close associations; a malefic passing through can bring trouble through them.",
            "strain",
          )
        : null;
    case 18:
      return r(
        "302",
        "Samudaya is one of the most positive stars of the chart; transits to it enhance the chart.",
        "Sutton counts this among the most positive stars; a passage here supports the whole chart.",
        "support",
      );
    case 19:
      return malefic
        ? r(
            "302",
            "Aadhana is the star of conception, new projects and the father; malefic transits to it can influence the father and one's creative abilities negatively.",
            "Sutton reads this star for new ventures and the father; a malefic passing through can weigh on both.",
            "strain",
          )
        : null;
    case 23:
      if (planet === "Jupiter")
        return r(
          "302",
          "Vinasha: even the benefics in this nakshatra may not be able to give good results.",
          "Sutton notes that even a benefic may not give good results while it passes through this star.",
          "mixed",
        );
      return planet === "Saturn" || planet === "Mars" || planet === "Rahu"
        ? r(
            "302",
            "Vinasha: be careful of the transits of Saturn, Mars or Rahu.",
            `Sutton names this star as one to be careful of while ${planet} passes through it.`,
            "strain",
          )
        : null;
    case 25:
      if (planet === "Saturn")
        return r(
          "302",
          "Saturn's transit through the manasa nakshatra creates pressures, stress and mental uncertainty that can lead to unwise decisions; Sutton takes Saturn's entry here as the practical start of sade sati.",
          "Sutton reads Saturn's passage through the star of the mind as a time of pressure and uncertainty, when decisions need extra care, and takes it as the practical start of sade sati.",
          "strain",
        );
      if (planet === "Rahu" || planet === "Ketu")
        return r(
          "302",
          `Transits of Saturn, Rahu and Ketu to the manasa nakshatra need watching: times of emotional stress and difficult decisions.`,
          `Sutton names ${planet}'s passage through the star of the mind as one to watch: a time of strain on the mind, when decisions need care.`,
          "strain",
        );
      if (planet === "Mars")
        return r(
          "302",
          "A Mars transit to the manasa nakshatra can be studied too, when it stays long (as in retrogression).",
          "Sutton says a lingering Mars can be felt here too: a time of strain on the mind, when decisions need care.",
          "strain",
        );
      return null;
    case 27:
      return malefic
        ? r(
            "304",
            "Abhishekha: transits to this nakshatra, especially of benefics, can raise one's status and bring good opportunities.",
            "Sutton counts this star as supportive: passages here, a benefic's above all, can raise one's standing.",
            "support",
          )
        : r(
            "304",
            "Abhishekha: transits to this nakshatra, especially of benefics, can raise one's status and bring many good opportunities.",
            "Sutton reads a benefic's passage through this star as able to raise one's standing and bring good openings.",
            "support",
          );
    default:
      return null;
  }
}

export function toneOf(readings: StarReading[]): StarTone | null {
  if (!readings.length) return null;
  const tones = new Set(readings.map((x) => x.tone));
  if (tones.size === 1) return readings[0].tone;
  if (tones.has("strain") && tones.has("support")) return "mixed";
  return tones.has("strain")
    ? "strain"
    : tones.has("support")
      ? "support"
      : "mixed";
}

export interface ShownStarPassage extends StarPassage {
  nakshatra: string;
  star: NamedStar;
  readings: StarReading[];
  tone: StarTone | null;
  /** The passage runs at the reading instant. */
  current: boolean;
}

export interface SpecialStars {
  hasData: boolean;
  janmaIndex: number;
  janma: string;
  passages: ShownStarPassage[];
  /** For each planet, the passage running at the reading instant and the next one after it. */
  byPlanet: {
    planet: StarPlanet;
    now?: ShownStarPassage;
    next?: ShownStarPassage;
  }[];
}

/**
 * The readings for every passage, with sensitive readings dropped when the gate is on. A passage
 * whose readings are all withheld is dropped too, so a minor sees no bare passage.
 */
export function specialStars(o: {
  passages: StarPassage[] | undefined;
  moonLon: number;
  asOfIso: string;
  withheld: boolean;
}): SpecialStars {
  const janmaIndex = janmaIndexOf(o.moonLon);
  const now = t(o.asOfIso);
  const shown: ShownStarPassage[] = (o.passages ?? [])
    .map((p) => {
      const star = STAR_BY_COUNT.get(p.count)!;
      const readings = starReadings(p.planet, p.count).filter(
        (x) => !(o.withheld && x.sensitive),
      );
      return {
        ...p,
        nakshatra: NAKSHATRAS[p.nakshatraIndex],
        star,
        readings,
        tone: toneOf(readings),
        current: t(p.start) <= now && now < t(p.end),
      };
    })
    .filter((p) => p.star && p.readings.length > 0)
    .sort((a, b) => t(a.start) - t(b.start));
  const byPlanet = STAR_PLANETS.map((planet) => {
    const mine = shown.filter((p) => p.planet === planet);
    return {
      planet,
      now: mine.find((p) => p.current),
      next: mine.find((p) => t(p.start) > now),
    };
  });
  return {
    hasData: !!o.passages,
    janmaIndex,
    janma: NAKSHATRAS[janmaIndex],
    passages: shown,
    byPlanet,
  };
}

function ordinal(n: number): string {
  const s =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${s}`;
}
