import { SIGNS, SIGN_LORD, EXALTATION, ENEMIES, type PlanetPosition, type PlanetSignPeriod } from "./astro";
import { bhinnaOf, type AshtakavargaResult } from "./ashtakavarga";
import { BPHS_URL } from "./parashari-data";
import type { ShadbalaResult } from "./shadbala";

/**
 * Parashara 70.24-36: the transits of Mars, Mercury and Venus through their own Ashtakavargas, with the
 * natal readings the same verses give for brothers (Mars' strength), progeny (5th from Jupiter) and the
 * directions of Venus' gains (7th from Venus and its trines).
 */
export type KinPlanet = "Mars" | "Mercury" | "Venus";
/** "lean" is the dots-heavy sign where the verse promises nothing; "distress" is Mars in a sign without rekhas (70.26). */
export type KinVerdict = "favourable" | "even" | "lean" | "distress";

export interface KinTransitRow {
  planet: KinPlanet;
  signIndex: number;
  start: string;
  end: string;
  current: boolean;
  /** Rekhas in the planet's own chart before reduction (66). */
  rekhas: number;
  givers: string[];
  /** Mars only: figure after Trikona shodhana, which 70.24 names. */
  trikona?: number;
  verdict: KinVerdict;
  text: string;
}

export interface KinTransitsReading {
  rows: Record<KinPlanet, KinTransitRow[]>;
  natal: { text: string; source: { label: string; url: string; provisional?: boolean }; tone: "support" | "strain" | "mixed" }[];
  sources: typeof KIN_SOURCES;
  caveats: string[];
  hasTransits: boolean;
}

export const KIN_SOURCES = {
  brothers: { label: "Parashara 70.24-27", url: BPHS_URL(70) },
  family: { label: "Parashara 70.28-29", url: BPHS_URL(70) },
  progeny: { label: "Parashara 70.30-33", url: BPHS_URL(70) },
  marriage: { label: "Parashara 70.34-36", url: BPHS_URL(70) },
  directions: { label: "Parashara 4.5-24 directions", url: BPHS_URL(4) },
  marsWeak: { label: "Parashara 70.25 with 27.32-33", url: BPHS_URL(70), provisional: true },
};

export const KIN_CAVEATS = [
  "\"Larger number of rekhas\" is read as five or more of eight and \"without rekhas\" as zero; three or fewer is shown as lean, a sign where the verse promises nothing, and four as even. The thresholds are not in the text (provisional).",
  "For Mars 70.24 names the figure after Trikona shodhana; the row shows both the unreduced count (which sets the verdict) and the reduced one. Mercury and Venus are read from the unreduced chart, as 70.28 and 70.34 name no reduction.",
  "\"Mars weak\" for the brothers' longevity (70.25) is taken as a Shadbala total below the requirement of 27.32-33 (provisional).",
  "The count of children by navamsas (70.32) is read as the ordinal of the navamsa the 5th lord occupies within its sign, one to nine; commentators differ on this verse.",
  "Directions of the signs follow chapter 4 (fire east, earth south, air west, Scorpio and Pisces north); Cancer's direction is not in the chapter 4 text used and north is taken from the pattern.",
  "Passages are computed for six months before and two years after the day the chart was opened; retrograde loops appear as repeated signs. Reopen the chart for a fresh span.",
];

const DIRECTION = ["east", "south", "west", "north", "east", "south", "west", "north", "east", "south", "west", "north"];

function verdictOf(rekhas: number): KinVerdict {
  return rekhas >= 5 ? "favourable" : rekhas <= 3 ? "lean" : "even";
}

export function readKinTransits(
  av: AshtakavargaResult,
  positions: PlanetPosition[],
  fast: PlanetSignPeriod[] | undefined,
  shadbala: ShadbalaResult | undefined,
  asOfIso: string,
): KinTransitsReading {
  const now = Date.parse(asOfIso);
  const isNow = (s: string, e: string) => Date.parse(s) <= now && now < Date.parse(e);
  const rows: Record<KinPlanet, KinTransitRow[]> = { Mars: [], Mercury: [], Venus: [] };
  for (const t of fast ?? []) {
    const planet = t.planet as KinPlanet;
    const chart = bhinnaOf(av, planet);
    if (!chart || !(planet in rows)) continue;
    const rekhas = chart.rekhas[t.signIndex];
    const verdict: KinVerdict = planet === "Mars" && rekhas === 0 ? "distress" : verdictOf(rekhas);
    let text: string;
    let trikona: number | undefined;
    if (planet === "Mars") {
      trikona = chart.trikona[t.signIndex];
      text =
        rekhas === 0
          ? `Mars in ${SIGNS[t.signIndex]}, a sign without rekhas in its chart: distress to brothers.`
          : verdict === "favourable"
            ? `Mars in ${SIGNS[t.signIndex]} with ${rekhas} rekhas (${trikona} after Trikona shodhana): gain of land, happiness from the wife and great happiness to a brother.`
            : verdict === "lean"
              ? `Mars in ${SIGNS[t.signIndex]} with only ${rekhas} rekhas (${trikona} after Trikona shodhana): little for brothers, valour or land.`
              : `Mars in ${SIGNS[t.signIndex]} with ${rekhas} rekhas (${trikona} after Trikona shodhana): an even passage.`;
    } else if (planet === "Mercury") {
      text =
        verdict === "favourable"
          ? `Mercury in ${SIGNS[t.signIndex]} with ${rekhas} rekhas: happiness to family, maternal uncle and friends.`
          : verdict === "lean"
            ? `Mercury in ${SIGNS[t.signIndex]} with only ${rekhas} rekhas: no such happiness is promised.`
            : `Mercury in ${SIGNS[t.signIndex]} with ${rekhas} rekhas: an even passage.`;
    } else {
      text =
        verdict === "favourable"
          ? `Venus in ${SIGNS[t.signIndex]} with ${rekhas} rekhas: gain of wealth, land, happiness and marriage.`
          : verdict === "lean"
            ? `Venus in ${SIGNS[t.signIndex]} with only ${rekhas} rekhas: no such gain is promised.`
            : `Venus in ${SIGNS[t.signIndex]} with ${rekhas} rekhas: an even passage.`;
    }
    rows[planet].push({ planet, signIndex: t.signIndex, start: t.start, end: t.end, current: isNow(t.start, t.end), rekhas, givers: chart.givers[t.signIndex], trikona, verdict, text });
  }
  for (const k of Object.keys(rows) as KinPlanet[]) rows[k].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  const natal: KinTransitsReading["natal"] = [];
  // 70.25: brothers short-lived if Mars weak.
  const marsBala = shadbala?.planets.find((p) => p.planet === "Mars");
  if (marsBala) {
    natal.push({
      text: marsBala.strong
        ? `Mars has ${marsBala.total.toFixed(1)} rupas against ${marsBala.required} required: not weak, so 70.25 does not shorten the brothers' lives.`
        : `Mars has ${marsBala.total.toFixed(1)} rupas against ${marsBala.required} required: weak, and 70.25 says the brothers will be short-lived.`,
      source: KIN_SOURCES.marsWeak,
      tone: marsBala.strong ? "support" : "strain",
    });
  }
  // 70.30-33: progeny from the 5th from Jupiter.
  const jup = positions.find((p) => p.planet === "Jupiter")!;
  const jChart = bhinnaOf(av, "Jupiter")!;
  const fifth = (jup.signIndex + 4) % 12;
  const fifthRekhas = jChart.rekhas[fifth];
  const fifthLord = SIGN_LORD[fifth];
  const debil = EXALTATION.Jupiter ? (EXALTATION.Jupiter.sign + 6) % 12 : 9;
  const enemySign = (ENEMIES.Jupiter ?? []).includes(fifthLord);
  const limited = fifth === debil || enemySign;
  const lordPos = positions.find((p) => p.planet === fifthLord)!;
  const navamsaOrdinal = Math.floor(lordPos.degInSign / (30 / 9)) + 1;
  natal.push({
    text:
      `The 5th from Jupiter is ${SIGNS[fifth]} with ${fifthRekhas} rekhas in Jupiter's chart: ${fifthRekhas >= 5 ? "great happiness from progeny" : fifthRekhas <= 3 ? "meagre happiness from progeny, the dots being more" : "an even promise for progeny"}. ` +
      (limited
        ? `${SIGNS[fifth]} is ${fifth === debil ? "Jupiter's debilitation sign" : `ruled by ${fifthLord}, Jupiter's enemy`}, so the children are very limited rather than ${fifthRekhas}. `
        : `The count by rekhas is ${fifthRekhas}. `) +
      `${fifthLord}, lord of that sign, stands in the ${navamsaOrdinal}${navamsaOrdinal === 1 ? "st" : navamsaOrdinal === 2 ? "nd" : navamsaOrdinal === 3 ? "rd" : "th"} navamsa of its sign, the alternative count.`,
    source: KIN_SOURCES.progeny,
    tone: fifthRekhas >= 5 && !limited ? "support" : fifthRekhas <= 3 || limited ? "strain" : "mixed",
  });
  // 70.35: directions of Venus' gains.
  const ven = positions.find((p) => p.planet === "Venus")!;
  const seventh = (ven.signIndex + 6) % 12;
  const trines = [seventh, (seventh + 4) % 12, (seventh + 8) % 12];
  const dirs = Array.from(new Set(trines.map((s) => DIRECTION[s])));
  natal.push({
    text: `Venus' gains come from the direction of the 7th from Venus, ${SIGNS[seventh]}, and its trines ${SIGNS[trines[1]]} and ${SIGNS[trines[2]]}: the ${dirs.join(" and ")}.`,
    source: KIN_SOURCES.marriage,
    tone: "mixed",
  });
  return { rows, natal, sources: KIN_SOURCES, caveats: KIN_CAVEATS, hasTransits: !!fast };
}

export const KIN_MATTER: Record<KinPlanet, string> = {
  Mars: "brothers, valour, land",
  Mercury: "family, maternal uncle, friends",
  Venus: "wealth, land, marriage",
};
