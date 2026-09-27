// Brihat Jataka adhyaya 8 (Dasantardasa), Varahamihira. The planetary periods keyed to the
// Ayurdaya years of chapter 7: the order of the dasas (8.1-2), the antardasa fractions (8.3-4),
// the grading of a dasa by the lord's position (8.5-8), the natural dasas (8.9) and the stated
// results of each planet's period (8.12-18), with the reading rules of 8.19-23. Verse text: Neely
// (wisdomlib) and Iyer 1885 pp. 77-90; the Sanskrit checked in the Adyar 1951 edition pp. 369-425.
// This is Varahamihira's own dasa, not Vimsottari; the Parashari tab's Vimsottari readings are
// untouched and the chapter's results are not applied to them.
import {
  EXALTATION,
  FRIENDS,
  ENEMIES,
  houseFrom,
  SIGN_LORD,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { navamsaOf } from "./jaimini";
import type { AyurdayaResult, Seven } from "./ayurdaya";
import type { ParashariSource } from "./parashari";
import type { ShadbalaResult } from "./shadbala";

const BJ_BASE =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc";
/** Verse page for Brihat Jataka 8.N on wisdomlib (Neely's translation). */
export const BJ8_URL = (verse: number) => `${BJ_BASE}${1501686 + verse}.html`;
const IYER = "https://archive.org/details/brihatjatakavar00iyergoog";
const V = (verse: string, provisional?: boolean): ParashariSource => ({
  label: `Brihat Jataka 8.${verse}`,
  url: BJ8_URL(parseInt(verse, 10)),
  provisional,
});

export const BJ_DASA_SOURCES = {
  order: V("1-2"),
  antar: V("3-4"),
  grades: V("5-7"),
  lagnaGrade: V("8"),
  naisargika: V("9"),
  commencement: V("10-11"),
  effects: V("12-18"),
  reading: V("19-23"),
  iyer: { label: "Iyer 1885, pp. 77-90", url: IYER } as ParashariSource,
  natureNames: {
    label: "Iyer 1885, p. 81 note (d)",
    url: IYER,
    provisional: true,
  } as ParashariSource,
};

export type DasaScheme = "pinda" | "amsa";
export type DasaNature = "benefic" | "malefic" | "mixed";
export type DasaLord = Seven | "Lagna";

export interface DasaGrade {
  /** The technical names that apply, in the order the verses give them. */
  names: string[];
  nature: DasaNature;
  reasons: string[];
  provisional: boolean;
}

export interface Antardasa {
  lord: Seven;
  /** Fraction of the lord's own share: 1, 1/2, 1/3, 1/7, 1/4. */
  fraction: string;
  numerator: number;
  years: number;
  start: number;
  end: number;
  placement: string;
  current: boolean;
}

export interface DasaEntry {
  lord: DasaLord;
  signIndex: number;
  years: number;
  start: number;
  end: number;
  group: "first" | "kendra" | "panaphara" | "apoklima";
  /** House from the reference sign. */
  houseFromRef: number;
  strength?: number;
  grade: DasaGrade;
  antardasas: Antardasa[];
  current: boolean;
}

export interface NaisargikaDasa {
  lord: Seven;
  years: number;
  start: number;
  end: number;
  current: boolean;
}

export interface BjDasaResult {
  scheme: DasaScheme;
  reference: DasaLord;
  referenceNote: string;
  referenceStrengths: { who: DasaLord; value?: number }[];
  order: DasaEntry[];
  total: number;
  current?: DasaEntry;
  currentAntar?: Antardasa;
  naisargika: NaisargikaDasa[];
  naisargikaCurrent?: NaisargikaDasa;
  /** 8.9: the natural dasa and the planetary dasa run together. */
  coincide: boolean;
  lagnaGrade: DasaGrade;
  shadbalaKnown: boolean;
  caveats: string[];
  sources: typeof BJ_DASA_SOURCES;
}

const SEVEN: Seven[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];
const isSeven = (p: Planet): p is Seven => (SEVEN as string[]).includes(p);
const norm360 = (x: number) => ((x % 360) + 360) % 360;
const KENDRA = [1, 4, 7, 10];
const PANAPHARA = [2, 5, 8, 11];

/** 8.9: the natural dasas, 120 years in all. */
export const NAISARGIKA_YEARS: { lord: Seven; years: number }[] = [
  { lord: "Moon", years: 1 },
  { lord: "Mars", years: 2 },
  { lord: "Mercury", years: 9 },
  { lord: "Venus", years: 20 },
  { lord: "Jupiter", years: 18 },
  { lord: "Sun", years: 20 },
  { lord: "Saturn", years: 50 },
];

/** 8.12-18, paraphrased. */
export const DASA_EFFECTS: Record<
  Seven,
  { verse: number; benefic: string; malefic: string }
> = {
  Sun: {
    verse: 12,
    benefic:
      "gain through perfumes, ivory and hide, gold, roads, the ruler and conflict; the person turns bold, persevering, renowned",
    malefic:
      "trouble through spouse, children, money, enemies, weapons, fire or the ruler; quarrels with dependants, an afflicted mind, pain in the chest",
  },
  Moon: {
    verse: 13,
    benefic:
      "gain through mantras, the learned, sugar-cane, milk and ghee, cloth, flowers, sesame and food; daughters, wisdom, wealth and renown",
    malefic:
      "sleep and idleness, loss of wisdom, wealth and renown, quarrels with the powerful and with kin",
  },
  Mars: {
    verse: 14,
    benefic:
      "victory over enemies; gain through a brother, the ruler, land, wool and goats",
    malefic:
      "hatred of children, friends, spouse, brothers and teachers; disease of blood, fever and bile, loss of limb; bad company, harsh speech, cruelty",
  },
  Mercury: {
    verse: 15,
    benefic:
      "gain as a messenger and through friends, teachers and the learned; fame among scholars, mixed metals, gold, land, comfort; service under others, growth of wisdom and virtue",
    malefic:
      "harsh speech, grief, confinement, pain of mind, disease of the three humours",
  },
  Jupiter: {
    verse: 16,
    benefic:
      "gain through worship, learning, valour, skill, bearing, martial fame, mantras, the ruler and the Vedas; gold, horses, gems, elephants, the friendship of good rulers",
    malefic:
      "hard study, trouble on journeys, pain in the ear, quarrels with the wicked",
  },
  Venus: {
    verse: 17,
    benefic:
      "music, pleasures, perfumes, fine food, drink, fine cloth, companions, gems; learning in the sastras, friends, skill in trade and farming, hidden treasure",
    malefic:
      "quarrels with crowds, the ruler, hunters and the wicked; suffering through one's own friends",
  },
  Saturn: {
    verse: 18,
    benefic:
      "asses, camels, birds, buffaloes, the elderly; rule over hamlets, villages or towns, renown, coarse grain",
    malefic:
      "phlegmatic and windy complaints, jealousy, anger, distraction, danger, idleness, grief; dependants and family rule over the person; defective organs",
  },
};

export const BJ_DASA_READING: { verse: string; rule: string }[] = [
  {
    verse: "19",
    rule: "A benefic dasa gives its good results, a malefic one its bad, a mixed one both; the lagna dasa gives the results of the lagna lord's dasa.",
  },
  {
    verse: "20",
    rule: "In a benefic dasa the metals of the planet are gained (2.12) and in a malefic one lost; in a planet's antardasa the living is the one named for it in chapter 10; the results stated for the houses, the signs, the aspects and every yoga except the Nabhasa yogas fall in the dasa of the strongest planet of that yoga.",
  },
  {
    verse: "21",
    rule: "In a planet's dasa the complexion and the senses take the colour of the planet's element (Mercury earth, Venus and the Moon water, Mars and the Sun fire, Saturn air, Jupiter ether).",
  },
  {
    verse: "22",
    rule: "The good of a benefic dasa is brought by the self within; the running dasa may be inferred from the results in hand; the results of powerless planets are met in dreams and reveries.",
  },
  {
    verse: "23",
    rule: "When one yoga makes a dasa lord benefic and another malefic, neither result comes; when two yogas agree against one, the two prevail; conflicting results assigned to two distinct planets both come to pass.",
  },
];

export const BJ_DASA_CAVEATS = [
  "This is Varahamihira's dasa of chapter 8, run on the years of chapter 7 (Pindayu or Amsayu as chosen above), and is shown as a witness beside Vimsottari, not in its place; the chapter's results (8.12-18) are not applied to the Vimsottari periods. The years are the planets' reduced years and the lagna's years before the krurodaya cut of 7.4, so the total may exceed the Ayurdaya total.",
  "8.1 begins with the strongest of the lagna, the Sun and the Moon; strength is Shadbala for the luminaries and Bhava bala for the lagna, which Varahamihira does not define here (provisional). Planets in the same class are ordered by Shadbala, then by the longer period; the last tie-break of 8.2 (which rises first) is not applied. The lagna's own dasa, when the lagna is not the reference, is placed by its house from the reference (provisional).",
  "8.3-4 give the antardasa shares (the lord 1, a planet with him 1/2, in the 5th or 9th 1/3, in the 7th 1/7, in the 4th or 8th 1/4); planets elsewhere from the lord receive none, as the verse says nothing of them. Iyer's note takes only the strongest planet of each place; every occupant is listed here instead.",
  "8.5-7 name the dasa by the lord's position; the reading of the names as benefic, malefic or mixed follows Iyer's note (d) and is provisional. Sampurna is taken as the exaltation sign within a degree of the exaltation point with Shadbala strength, Purna as the exaltation sign otherwise (the commentator's term), Rikta as the debilitation sign, Anishta the same in an enemy's navamsa; Arohini and Avarohini are the halves of the circle from the debilitation and exaltation points; Madhyama and Adhama, Misraphala as 8.6-7 state them.",
  "8.10-11 judge a dasa by the chart at its commencement and by the Moon's sign then; these are not computed.",
];

function gradePlanet(
  p: PlanetPosition,
  strong: boolean | undefined,
): DasaGrade {
  const ex = EXALTATION[p.planet]!;
  const exLon = ex.sign * 30 + ex.deg;
  const d = norm360(p.lon - exLon); // 0 at exaltation, 180 at debilitation
  const nav = navamsaOf(p.lon);
  const navLord = SIGN_LORD[nav.signIndex];
  const navOwn = navLord === p.planet;
  const navFriend = FRIENDS[p.planet].includes(navLord);
  const navEnemy = ENEMIES[p.planet].includes(navLord);
  const navExalt = nav.signIndex === ex.sign;
  const navDebil = nav.signIndex === (ex.sign + 6) % 12;
  const names: string[] = [];
  const reasons: string[] = [];
  let provisional = false;
  const goodSign =
    p.dignity === "Exalted" ||
    p.dignity === "Own sign" ||
    p.dignity === "Moolatrikona" ||
    p.dignity === "Friendly";
  if (p.dignity === "Exalted") {
    if (Math.abs(d) <= 1 || Math.abs(d - 360) <= 1) {
      if (strong === true) {
        names.push("Sampurna");
        reasons.push("at the exaltation degree and strong (8.5)");
      } else {
        names.push(strong === false ? "Purna" : "Sampurna or Purna");
        reasons.push(
          strong === false
            ? "at the exaltation degree but not strong; the commentator's Purna"
            : "at the exaltation degree; strength unknown",
        );
        provisional = true;
      }
    } else {
      names.push("Purna");
      reasons.push(
        "in the exaltation sign (the commentator's Purna, Iyer note b)",
      );
      provisional = true;
    }
  } else if (p.dignity === "Debilitated") {
    if (navEnemy || navDebil) {
      names.push("Anishta");
      reasons.push(
        "in the debilitation sign and an enemy's or the debilitation navamsa (8.5)",
      );
    } else {
      names.push("Rikta");
      reasons.push(
        Math.abs(d - 180) <= 1
          ? "at the debilitation degree (8.5)"
          : "in the debilitation sign (the commentator's Rikta, Iyer note c)",
      );
      if (Math.abs(d - 180) > 1) provisional = true;
    }
  }
  if (goodSign && (navDebil || navEnemy) && p.dignity !== "Exalted") {
    names.push("Misraphala");
    reasons.push(
      "well placed by sign but in a debilitation or enemy's navamsa (8.7)",
    );
  }
  if (!names.length) {
    if (d > 0 && d < 180) {
      if (navFriend || navExalt || navOwn) {
        names.push("Madhyama");
        reasons.push(
          `descending from exaltation toward debilitation, in ${navOwn ? "its own" : navExalt ? "the exaltation" : "a friend's"} navamsa (8.6)`,
        );
      } else {
        names.push("Avarohini");
        reasons.push(
          "descending from the exaltation point toward debilitation (8.6)",
        );
      }
    } else {
      if (navEnemy || navDebil) {
        names.push("Adhama");
        reasons.push(
          "ascending toward exaltation but in an enemy's or the debilitation navamsa (8.6)",
        );
      } else {
        names.push("Arohini");
        reasons.push(
          "ascending from the debilitation point toward exaltation (8.6)",
        );
      }
    }
  }
  const first = names[0];
  const nature: DasaNature =
    first === "Sampurna" ||
    first === "Purna" ||
    first === "Arohini" ||
    first === "Sampurna or Purna"
      ? "benefic"
      : first === "Rikta" ||
          first === "Anishta" ||
          first === "Avarohini" ||
          first === "Adhama"
        ? "malefic"
        : "mixed";
  return { names, nature, reasons, provisional };
}

/** 8.8: the lagna dasa by the rising drekkana and the sign's class. */
export function gradeLagna(lagnaLon: number): DasaGrade {
  const lon = norm360(lagnaLon);
  const si = Math.floor(lon / 30);
  const drek = Math.min(2, Math.floor((lon - si * 30) / 10));
  const cls = si % 3; // 0 movable, 1 fixed, 2 dual
  const table: Record<number, string[]> = {
    2: ["Adhama", "Madhyama", "Uttama"],
    0: ["Uttama", "Madhyama", "Adhama"],
    1: ["Adhama", "Uttama", "Madhyama"],
  };
  const name = table[cls][drek];
  const clsName = cls === 0 ? "movable" : cls === 1 ? "fixed" : "dual";
  return {
    names: [name],
    nature:
      name === "Uttama" ? "benefic" : name === "Adhama" ? "malefic" : "mixed",
    reasons: [
      `${["first", "second", "third"][drek]} drekkana of a ${clsName} sign (8.8)`,
    ],
    provisional: false,
  };
}

export function computeBjDasa(
  positions: PlanetPosition[],
  lagnaLon: number,
  ayur: AyurdayaResult,
  scheme: DasaScheme,
  shadbala?: ShadbalaResult,
  ageYears?: number,
): BjDasaResult {
  const caveats = [...BJ_DASA_CAVEATS];
  const lagnaIdx = Math.floor(norm360(lagnaLon) / 30);
  const seven = positions.filter((p) => isSeven(p.planet));
  const sb = (p: Planet) => shadbala?.planets.find((x) => x.planet === p);
  const strength = (p: Planet) => sb(p)?.total;
  const lagnaStrength = shadbala?.bhavas.find((b) => b.house === 1)?.total;
  const sk = shadbala !== undefined;
  const yearsOf = (p: Seven) => {
    const row = ayur.planets.find((x) => x.planet === p);
    if (!row) return 0;
    return scheme === "pinda" ? row.pinda.final : row.amsa.final;
  };
  const lagnaYears =
    scheme === "pinda" ? ayur.lagna.pindaYears : ayur.lagna.amsaYears;

  // 8.1: the strongest of lagna, Sun and Moon.
  const refStrengths: BjDasaResult["referenceStrengths"] = [
    { who: "Lagna", value: lagnaStrength },
    { who: "Sun", value: strength("Sun") },
    { who: "Moon", value: strength("Moon") },
  ];
  let reference: DasaLord;
  let referenceNote: string;
  if (sk && refStrengths.every((r) => r.value !== undefined)) {
    const best = refStrengths.reduce((a, b) => (b.value! > a.value! ? b : a));
    reference = best.who;
    referenceNote = `${best.who} is the strongest of the three (${refStrengths
      .map((r) => `${r.who} ${r.value!.toFixed(0)}`)
      .join(
        ", ",
      )} virupas; Bhava bala for the lagna, Shadbala for the luminaries).`;
  } else {
    reference = ayur.lagna.strong ? "Lagna" : "Moon";
    referenceNote = ayur.lagna.strong
      ? "Shadbala is not available; the lagna is taken as reference because it is strong by 1.19."
      : "Shadbala is not available; the Moon is taken as reference by default.";
    caveats.push(
      "Without Shadbala the reference and the order within each class are approximate.",
    );
  }
  const refSign =
    reference === "Lagna"
      ? lagnaIdx
      : positions.find((p) => p.planet === reference)!.signIndex;

  const sun = positions.find((p) => p.planet === "Sun")!;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const lagnaGrade = gradeLagna(lagnaLon);

  interface Cand {
    lord: DasaLord;
    signIndex: number;
    years: number;
    strength?: number;
    lon: number;
    grade: DasaGrade;
  }
  const cands: Cand[] = [];
  for (const p of seven) {
    cands.push({
      lord: p.planet as Seven,
      signIndex: p.signIndex,
      years: yearsOf(p.planet as Seven),
      strength: strength(p.planet),
      lon: p.lon,
      grade: gradePlanet(p, sb(p.planet)?.strong),
    });
  }
  cands.push({
    lord: "Lagna",
    signIndex: lagnaIdx,
    years: lagnaYears,
    strength: lagnaStrength,
    lon: norm360(lagnaLon),
    grade: lagnaGrade,
  });
  const first = cands.find((c) => c.lord === reference)!;
  const rest = cands.filter((c) => c.lord !== reference);
  const groupOf = (c: Cand): DasaEntry["group"] => {
    const h = houseFrom(refSign, c.signIndex);
    return KENDRA.includes(h)
      ? "kendra"
      : PANAPHARA.includes(h)
        ? "panaphara"
        : "apoklima";
  };
  const cmp = (a: Cand, b: Cand) => {
    const sa = a.strength ?? -1,
      sbv = b.strength ?? -1;
    if (sa !== sbv) return sbv - sa;
    if (a.years !== b.years) return b.years - a.years;
    return a.lon - b.lon;
  };
  const ordered: { c: Cand; group: DasaEntry["group"] }[] = [
    { c: first, group: "first" },
  ];
  for (const g of ["kendra", "panaphara", "apoklima"] as const) {
    const members = rest.filter((c) => groupOf(c) === g).sort(cmp);
    for (const c of members) ordered.push({ c, group: g });
  }

  // 8.3-4: antardasas.
  const FRAC: { houses: number[]; frac: string; num: number; place: string }[] =
    [
      { houses: [1], frac: "1/2", num: 42, place: "with the lord" },
      {
        houses: [5, 9],
        frac: "1/3",
        num: 28,
        place: "in the 5th or 9th from the lord",
      },
      { houses: [7], frac: "1/7", num: 12, place: "in the 7th from the lord" },
      {
        houses: [4, 8],
        frac: "1/4",
        num: 21,
        place: "in the 4th or 8th from the lord",
      },
    ];
  const buildAntar = (c: Cand, start: number, years: number): Antardasa[] => {
    const parts: Omit<Antardasa, "years" | "start" | "end" | "current">[] = [];
    if (c.lord !== "Lagna")
      parts.push({
        lord: c.lord,
        fraction: "1",
        numerator: 84,
        placement: "the lord himself",
      });
    for (const f of FRAC) {
      for (const p of seven) {
        if (p.planet === c.lord) continue;
        const h = houseFrom(c.signIndex, p.signIndex);
        if (f.houses.includes(h))
          parts.push({
            lord: p.planet as Seven,
            fraction: f.frac,
            numerator: f.num,
            placement: f.place,
          });
      }
    }
    const sum = parts.reduce((s, x) => s + x.numerator, 0);
    let t = start;
    return parts.map((x) => {
      const y = sum ? (years * x.numerator) / sum : 0;
      const a: Antardasa = {
        ...x,
        years: y,
        start: t,
        end: t + y,
        current: ageYears !== undefined && ageYears >= t && ageYears < t + y,
      };
      t += y;
      return a;
    });
  };

  let t = 0;
  const order: DasaEntry[] = ordered.map(({ c, group }) => {
    const e: DasaEntry = {
      lord: c.lord,
      signIndex: c.signIndex,
      years: c.years,
      start: t,
      end: t + c.years,
      group,
      houseFromRef: houseFrom(refSign, c.signIndex),
      strength: c.strength,
      grade: c.grade,
      antardasas: buildAntar(c, t, c.years),
      current:
        ageYears !== undefined && ageYears >= t && ageYears < t + c.years,
    };
    t += c.years;
    return e;
  });
  const total = t;
  const current = order.find((e) => e.current);
  const currentAntar = current?.antardasas.find((a) => a.current);

  // 8.9 natural dasas.
  let n = 0;
  const naisargika: NaisargikaDasa[] = NAISARGIKA_YEARS.map((x) => {
    const d: NaisargikaDasa = {
      lord: x.lord,
      years: x.years,
      start: n,
      end: n + x.years,
      current:
        ageYears !== undefined && ageYears >= n && ageYears < n + x.years,
    };
    n += x.years;
    return d;
  });
  const naisargikaCurrent = naisargika.find((d) => d.current);
  const coincide =
    !!current && !!naisargikaCurrent && current.lord === naisargikaCurrent.lord;

  if (!sun || !moon)
    caveats.push("Sun or Moon missing; the reference could not be judged.");

  return {
    scheme,
    reference,
    referenceNote,
    referenceStrengths: refStrengths,
    order,
    total,
    current,
    currentAntar,
    naisargika,
    naisargikaCurrent,
    coincide,
    lagnaGrade,
    shadbalaKnown: sk,
    caveats,
    sources: BJ_DASA_SOURCES,
  };
}
