// Shadbala, the six-fold strength of the seven planets, per Brihat Parashara Hora Sastra ch. 27
// (Santhanam translation, jyotishvidya.com). Aspect values come from ch. 26.6-12 and the planetary
// relationships from ch. 3.55-61. The nodes get no Shadbala in the chapter and are left out.
//
// The ephemeris facts that need the Swiss Ephemeris (declinations, tropical longitudes, meridian,
// sunrise and sunset) arrive in `ShadbalaBase` from the server; everything else is arithmetic here so
// the client can show the working and the dasa rules can consult it.
import { EXALTATION, MOOLATRIKONA, SIGN_LORD, houseFrom, norm360, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";

export const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
export type Seven = (typeof SEVEN)[number];

export interface ShadbalaBase {
  jd: number;
  ayanamsa: number;
  /** Sidereal ascendant and meridian (10th cusp). */
  asc: number;
  mc: number;
  /** Julian days of the last sunrise before birth, the sunset after it, and the next sunrise. */
  sunriseJd: number;
  sunsetJd: number;
  nextSunriseJd: number;
  /** Local mean time at birth, hours since midnight (longitude-based). */
  lmtHours: number;
  /** Weekday of the Hindu day running from that sunrise, 0 = Sunday. */
  weekday: number;
  /** Elapsed days from the Kali epoch (18 Feb 3102 BCE) to the birth day. */
  ahargana: number;
  /** Per planet: declination, ecliptic latitude and tropical (sayana) longitude. */
  bodies: Record<Seven, { decl: number; lat: number; tropLon: number }>;
}

export interface BalaSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export interface VargaDignity {
  varga: string;
  /** Sign or lord that the planet falls under in this division. */
  lord: Planet;
  relation: string;
  virupas: number;
}

export interface PlanetShadbala {
  planet: Seven;
  sthana: {
    uchcha: number;
    saptavarga: VargaDignity[];
    saptavargaTotal: number;
    ojhayugma: number;
    kendradi: number;
    drekkana: number;
    total: number;
  };
  dig: number;
  kala: {
    nathonnatha: number;
    paksha: number;
    tribhaga: number;
    varsha: number;
    masa: number;
    dina: number;
    hora: number;
    ayana: number;
    total: number;
  };
  chesta: number;
  naisargika: number;
  drik: number;
  /** Planetary war adjustment, 27.20; zero when not at war. */
  yuddha: number;
  total: number;
  required: number;
  /** total / required. */
  ratio: number;
  /** 27.32-33: at or above the requirement. */
  strong: boolean;
  /** 27.34-36: the five named components against their own requirements. */
  components: { name: string; value: number; required: number; ok: boolean }[];
  /** Full / half / quarter effect for 24.145, from the ratio (thresholds provisional). */
  effect: "full" | "half" | "quarter";
  notes: string[];
}

export interface ShadbalaResult {
  planets: PlanetShadbala[];
  lords: { varsha: Seven; masa: Seven; dina: Seven; hora: Seven };
  /** Birth in daytime (sunrise to sunset). */
  daytime: boolean;
  wars: { victor: Seven; loser: Seven; separation: number }[];
  sources: Record<string, BalaSource>;
  caveats: string[];
}

const S = (ch: number, verse: string, provisional?: boolean): BalaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

export const SHADBALA_SOURCES: Record<string, BalaSource> = {
  uchcha: S(27, "1-2"),
  saptavarga: S(27, "2-4"),
  ojhayugma: S(27, "4.5"),
  kendradi: S(27, "5"),
  drekkana: S(27, "6"),
  dig: S(27, "7"),
  nathonnatha: S(27, "8-9"),
  paksha: S(27, "10-11"),
  tribhaga: S(27, "12"),
  lords: S(27, "13", true),
  naisargika: S(27, "14"),
  ayana: S(27, "15-17"),
  chestaLuminaries: S(27, "18"),
  drik: S(27, "19", true),
  yuddha: S(27, "20", true),
  chesta: S(27, "24-25"),
  required: S(27, "32-33"),
  componentsRequired: S(27, "34-36"),
  relations: S(3, "55-58"),
  moolatrikona: S(3, "51-54"),
  aspects: S(26, "6-12"),
  effect: S(24, "145-148", true),
};

// ---------- planetary relationships, ch. 3 ----------

/** Natural friends and enemies of the seven planets, BPHS 3.55; everyone else is neutral. */
const NATURAL: Record<Seven, { friends: Seven[]; enemies: Seven[] }> = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"] },
  Moon: { friends: ["Sun", "Mercury"], enemies: [] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"] },
  Venus: { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"] },
  Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon"] },
};

export type Compound = "great friend" | "friend" | "neutral" | "enemy" | "great enemy";

/** Compound (panchadha) relationship of `a` towards `b`: natural (3.55) combined with temporary (3.56) per 3.57-58. */
export function compoundRelation(a: Seven, b: Seven, signA: number, signB: number): Compound {
  const nat = NATURAL[a].friends.includes(b) ? 1 : NATURAL[a].enemies.includes(b) ? -1 : 0;
  const h = houseFrom(signA, signB);
  const temp = [2, 3, 4, 10, 11, 12].includes(h) ? 1 : -1;
  const sum = nat + temp;
  if (sum === 2) return "great friend";
  if (sum === 1) return "friend";
  if (sum === 0) return "neutral";
  if (sum === -1) return "enemy";
  return "great enemy";
}

/** Moolatrikona by degree range, BPHS 3.51-54. */
export function inMoolatrikona(p: Seven, sign: number, deg: number): boolean {
  if (MOOLATRIKONA[p] !== sign) return false;
  switch (p) {
    case "Sun": return deg < 20;
    case "Moon": return deg >= 3;
    case "Mars": return deg < 12;
    case "Mercury": return deg >= 15 && deg < 20;
    case "Jupiter": return deg < 10;
    case "Venus": return deg < 15;
    case "Saturn": return deg < 20;
  }
}

const RELATION_VIRUPAS: Record<Compound, number> = { "great friend": 20, friend: 15, neutral: 10, enemy: 4, "great enemy": 2 };

// ---------- divisional lords ----------

const isOdd = (sign: number) => sign % 2 === 0; // Aries = 0 is odd

function horaLord(sign: number, deg: number): Seven {
  const first = deg < 15;
  return isOdd(sign) ? (first ? "Sun" : "Moon") : first ? "Moon" : "Sun";
}
function drekkanaSign(sign: number, deg: number) {
  return (sign + 4 * Math.floor(deg / 10)) % 12;
}
function saptamsaSign(sign: number, deg: number) {
  return (sign + (isOdd(sign) ? 0 : 6) + Math.floor(deg / (30 / 7))) % 12;
}
export function navamsaSign(sign: number, deg: number) {
  return (sign * 9 + Math.floor(deg / (10 / 3))) % 12;
}
function dwadasamsaSign(sign: number, deg: number) {
  return (sign + Math.floor(deg / 2.5)) % 12;
}
function trimsamsaLord(sign: number, deg: number): Seven {
  if (isOdd(sign)) return deg < 5 ? "Mars" : deg < 10 ? "Saturn" : deg < 18 ? "Jupiter" : deg < 25 ? "Mercury" : "Venus";
  return deg < 5 ? "Venus" : deg < 12 ? "Mercury" : deg < 20 ? "Jupiter" : deg < 25 ? "Saturn" : "Mars";
}

// ---------- aspects in degrees, ch. 26.6-12 ----------

/** Sphuta drishti of `aspecting` on a point `d` degrees ahead of it (0-360), in virupas (0-60). */
export function sphutaDrishti(aspecting: Seven, d: number): number {
  d = norm360(d);
  // Special slabs first.
  if (aspecting === "Saturn") {
    if (d > 30 && d <= 60) return (d - 30) * 2;
    if (d > 60 && d <= 90) return 60 - (d - 60) / 2;
    if (d > 240 && d <= 270) return d - 240 + 30;
    if (d > 270 && d <= 300) return (300 - d) * 2;
  }
  if (aspecting === "Mars") {
    if ((d > 90 && d <= 120) || (d > 210 && d <= 240)) return 60 - (d % 30);
    if (d > 60 && d <= 90) return (d - 60) * 1.5 + 15;
  }
  if (aspecting === "Jupiter") {
    if ((d > 90 && d <= 120) || (d > 210 && d <= 240)) return (d % 30) / 2 + 45;
    if ((d > 120 && d <= 150) || (d > 240 && d <= 270)) return 60 - (d % 30);
  }
  // General slabs, 26.6-8: beyond 180 the difference is taken from 300.
  const x = d > 180 ? 300 - d : d;
  if (x <= 30) return 0;
  if (x <= 60) return (x - 30) / 2;
  if (x <= 90) return x - 60 + 15;
  if (x <= 120) return (120 - x) / 2 + 30;
  if (x <= 150) return 150 - x;
  if (x <= 180) return (x - 150) * 2;
  return 0;
}

// ---------- constants ----------

const NAISARGIKA: Record<Seven, number> = { Sun: 60, Moon: (60 / 7) * 6, Venus: (60 / 7) * 5, Jupiter: (60 / 7) * 4, Mercury: (60 / 7) * 3, Mars: (60 / 7) * 2, Saturn: 60 / 7 };
const REQUIRED: Record<Seven, number> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };
const COMPONENT_REQUIRED: Record<Seven, [number, number, number, number, number]> = {
  Jupiter: [165, 35, 50, 112, 30],
  Mercury: [165, 35, 50, 112, 30],
  Sun: [165, 35, 50, 112, 30],
  Moon: [133, 50, 30, 100, 40],
  Venus: [133, 50, 30, 100, 40],
  Mars: [96, 30, 40, 67, 20],
  Saturn: [96, 30, 40, 67, 20],
};
const WEEKDAY_LORD: Seven[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** Mean longitudes (mean equinox of date), degrees; Meeus, Astronomical Algorithms, Table 31.A and 25.2. */
function meanLongitudes(jd: number): Record<Seven, number> {
  const T = (jd - 2451545) / 36525;
  return {
    Sun: norm360(280.46646 + 36000.76983 * T),
    Moon: 0,
    Mercury: norm360(252.250906 + 149472.6746358 * T),
    Venus: norm360(181.979801 + 58517.815676 * T),
    Mars: norm360(355.433275 + 19140.2993313 * T),
    Jupiter: norm360(34.351484 + 3034.9056746 * T),
    Saturn: norm360(50.077471 + 1222.1137943 * T),
  };
}

const arc = (a: number, b: number) => {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
};

// ---------- the computation ----------

export function computeShadbala(positions: PlanetPosition[], lagnaIdx: number, base: ShadbalaBase): ShadbalaResult {
  const pos = (p: Planet) => positions.find((x) => x.planet === p)!;
  const sun = pos("Sun"), moon = pos("Moon");
  const elong = norm360(moon.lon - sun.lon);
  const waxing = elong < 180;
  const isBenefic = (p: Seven) => {
    if (p === "Jupiter" || p === "Venus") return true;
    if (p === "Moon") return waxing;
    if (p === "Mercury") return !positions.some((x) => x.signIndex === pos("Mercury").signIndex && ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(x.planet));
    return false;
  };

  const daytime = base.jd >= base.sunriseJd && base.jd < base.sunsetJd;
  const dayLen = base.sunsetJd - base.sunriseJd;
  const nightLen = base.nextSunriseJd - base.sunsetJd;

  // Lords of the year, month, day and hora, 27.13. Year and month by 360- and 30-day counts from the Kali epoch (Friday);
  // the hora as equal hours from sunrise, each lord six places on from the last.
  const epochDayWeek = 5;
  const varsha = WEEKDAY_LORD[(epochDayWeek + 3 * Math.floor(base.ahargana / 360)) % 7];
  const masa = WEEKDAY_LORD[(epochDayWeek + 2 * Math.floor(base.ahargana / 30)) % 7];
  const dina = WEEKDAY_LORD[base.weekday];
  const hoursSinceRise = Math.max(0, (base.jd - base.sunriseJd) * 24);
  const hora = WEEKDAY_LORD[(base.weekday + 5 * Math.floor(hoursSinceRise)) % 7];

  const desc = norm360(base.asc + 180), ic = norm360(base.mc + 180);
  const means = meanLongitudes(base.jd);

  // Paksha bala for benefics, 27.10-11.
  const pakshaBenefic = arc(moon.lon, sun.lon) / 3;
  // Nathonnatha, 27.8-9: local mean time, distance from midnight in ghatis (0-30).
  const ghatis = base.lmtHours * 2.5;
  const unnata = Math.min(ghatis, 60 - ghatis);
  const natha = 2 * (30 - unnata);

  const rows: PlanetShadbala[] = SEVEN.map((p) => {
    const pp = pos(p);
    const b = base.bodies[p];
    const notes: string[] = [];

    // Sthana: uchcha, 27.1-2.
    const ex = EXALTATION[p]!;
    const debilitation = norm360(ex.sign * 30 + ex.deg + 180);
    const uchcha = arc(pp.lon, debilitation) / 3;

    // Saptavargaja, 27.2-4.
    const vargaValue = (varga: string, lord: Seven, rasi: boolean): VargaDignity => {
      if (lord === p) {
        const mt = rasi && inMoolatrikona(p, pp.signIndex, pp.degInSign);
        return { varga, lord, relation: mt ? "moolatrikona" : "own", virupas: mt ? 45 : 30 };
      }
      const rel = compoundRelation(p, lord, pp.signIndex, pos(lord).signIndex);
      return { varga, lord, relation: rel, virupas: RELATION_VIRUPAS[rel] };
    };
    const lordOf = (sign: number) => SIGN_LORD[sign] as Seven;
    const saptavarga: VargaDignity[] = [
      vargaValue("Rasi", lordOf(pp.signIndex), true),
      vargaValue("Hora", horaLord(pp.signIndex, pp.degInSign), false),
      vargaValue("Drekkana", lordOf(drekkanaSign(pp.signIndex, pp.degInSign)), false),
      vargaValue("Saptamsa", lordOf(saptamsaSign(pp.signIndex, pp.degInSign)), false),
      vargaValue("Navamsa", lordOf(navamsaSign(pp.signIndex, pp.degInSign)), false),
      vargaValue("Dwadasamsa", lordOf(dwadasamsaSign(pp.signIndex, pp.degInSign)), false),
      vargaValue("Trimsamsa", trimsamsaLord(pp.signIndex, pp.degInSign), false),
    ];
    const saptavargaTotal = saptavarga.reduce((s, v) => s + v.virupas, 0);

    // Ojhayugma, 27.4.5: Venus and Moon in even signs, others in odd; rasi and navamsa.
    const femaleLike = p === "Venus" || p === "Moon";
    const nav = navamsaSign(pp.signIndex, pp.degInSign);
    const ojhayugma = (isOdd(pp.signIndex) !== femaleLike ? 15 : 0) + (isOdd(nav) !== femaleLike ? 15 : 0);

    // Kendradi, 27.5 (whole-sign house from the lagna).
    const h = houseFrom(lagnaIdx, pp.signIndex);
    const kendradi = [1, 4, 7, 10].includes(h) ? 60 : [2, 5, 8, 11].includes(h) ? 30 : 15;

    // Drekkana, 27.6.
    const drek = Math.floor(pp.degInSign / 10) + 1;
    const gender = p === "Sun" || p === "Mars" || p === "Jupiter" ? 1 : p === "Moon" || p === "Venus" ? 2 : 3;
    const drekkana = drek === gender ? 15 : 0;

    const sthanaTotal = uchcha + saptavargaTotal + ojhayugma + kendradi + drekkana;

    // Dig bala, 27.7.
    const digPoint = p === "Sun" || p === "Mars" ? ic : p === "Jupiter" || p === "Mercury" ? desc : p === "Venus" || p === "Moon" ? base.mc : base.asc;
    const dig = arc(pp.lon, digPoint) / 3;

    // Kala bala.
    const nathonnatha = p === "Mercury" ? 60 : p === "Moon" || p === "Mars" || p === "Saturn" ? natha : 60 - natha;
    const benefic = p === "Moon" ? true : isBenefic(p);
    const paksha = benefic ? pakshaBenefic : 60 - pakshaBenefic;
    if (p === "Moon" && !waxing) notes.push("The Moon is counted with the benefics for Paksha bala whatever its phase, so a bright Moon stays strong; the chapter says only 'benefics'.");
    let tribhaga = 0;
    if (p === "Jupiter") tribhaga = 60;
    else if (daytime) {
      const part = Math.min(2, Math.floor(((base.jd - base.sunriseJd) / dayLen) * 3));
      tribhaga = (["Mercury", "Sun", "Saturn"] as Seven[])[part] === p ? 60 : 0;
    } else {
      const part = Math.min(2, Math.max(0, Math.floor(((base.jd - base.sunsetJd) / nightLen) * 3)));
      tribhaga = (["Moon", "Venus", "Mars"] as Seven[])[part] === p ? 60 : 0;
    }
    const varshaB = varsha === p ? 15 : 0, masaB = masa === p ? 30 : 0, dinaB = dina === p ? 45 : 0, horaB = hora === p ? 60 : 0;
    // Ayana, 27.15-17: north declination adds for Sun, Mars, Jupiter, Venus; south adds for Moon and Saturn; always adds for Mercury.
    const d = b.decl;
    const signed = p === "Mercury" ? Math.abs(d) : p === "Moon" || p === "Saturn" ? -d : d;
    const ayana = Math.max(0, Math.min(60, ((24 + signed) / 48) * 60));
    const kalaTotal = nathonnatha + paksha + tribhaga + varshaB + masaB + dinaB + horaB + ayana;

    // Chesta, 27.18 and 24-25.
    let chesta: number;
    if (p === "Sun") chesta = ayana;
    else if (p === "Moon") chesta = paksha;
    else {
      const meanSun = means.Sun, meanP = means[p];
      const kendra = p === "Mercury" || p === "Venus" ? meanP - (meanSun + b.tropLon) / 2 : meanSun - (meanP + b.tropLon) / 2;
      chesta = arc(kendra, 0) / 3;
    }

    // Drik, 27.19 with 26.6-12: a quarter of each benefic's aspect added, a quarter of each malefic's taken away;
    // Jupiter and Mercury always on the benefic side.
    let drik = 0;
    for (const q of SEVEN) {
      if (q === p) continue;
      const v = sphutaDrishti(q, pp.lon - pos(q).lon);
      if (v <= 0) continue;
      const good = q === "Jupiter" || q === "Mercury" ? true : isBenefic(q);
      drik += good ? v / 4 : -v / 4;
    }

    const total0 = sthanaTotal + dig + kalaTotal + chesta + NAISARGIKA[p] + drik;
    const req = COMPONENT_REQUIRED[p];
    const components = [
      { name: "Sthana", value: sthanaTotal, required: req[0], ok: sthanaTotal >= req[0] },
      { name: "Dig", value: dig, required: req[1], ok: dig >= req[1] },
      { name: "Kala", value: kalaTotal, required: req[2], ok: kalaTotal >= req[2] },
      { name: "Chesta", value: chesta, required: req[3], ok: chesta >= req[3] },
      { name: "Ayana", value: ayana, required: req[4], ok: ayana >= req[4] },
    ];
    if (pp.retrograde && p !== "Sun" && p !== "Moon") notes.push("Retrograde: the Chesta kendra method (27.24-25) is used, not the eight-motion table of 27.21-23.");

    return {
      planet: p,
      sthana: { uchcha, saptavarga, saptavargaTotal, ojhayugma, kendradi, drekkana, total: sthanaTotal },
      dig,
      kala: { nathonnatha, paksha, tribhaga, varsha: varshaB, masa: masaB, dina: dinaB, hora: horaB, ayana, total: kalaTotal },
      chesta,
      naisargika: NAISARGIKA[p],
      drik,
      yuddha: 0,
      total: total0,
      required: REQUIRED[p],
      ratio: total0 / REQUIRED[p],
      strong: total0 >= REQUIRED[p],
      components,
      effect: "full",
      notes,
    };
  });

  // Planetary war, 27.20: two of Mars to Saturn within one degree; the one further north wins (Surya Siddhanta convention).
  const wars: ShadbalaResult["wars"] = [];
  const fighters: Seven[] = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  for (let i = 0; i < fighters.length; i++) {
    for (let j = i + 1; j < fighters.length; j++) {
      const a = fighters[i], c = fighters[j];
      const sep = arc(pos(a).lon, pos(c).lon);
      if (sep > 1) continue;
      const victor = base.bodies[a].lat >= base.bodies[c].lat ? a : c;
      const loser = victor === a ? c : a;
      const ra = rows.find((r) => r.planet === victor)!, rl = rows.find((r) => r.planet === loser)!;
      const diff = Math.abs(ra.total - rl.total);
      ra.yuddha += diff;
      rl.yuddha -= diff;
      wars.push({ victor, loser, separation: sep });
    }
  }
  for (const r of rows) {
    r.total = r.total + r.yuddha;
    r.ratio = r.total / r.required;
    r.strong = r.total >= r.required;
    r.effect = r.ratio >= 1 ? "full" : r.ratio >= 0.75 ? "half" : "quarter";
  }

  const caveats = [
    "Kendradi bala uses whole-sign houses from the lagna; the chapter speaks of angles, succedent and cadent houses without fixing the house system.",
    "Nathonnatha bala is taken from local mean time (birth longitude), not the apparent time the verse names; the difference is the equation of time, a few minutes at most.",
    "Ayana bala uses the true declination in place of the three-khanda sine table of 27.15-17, which the table approximates. The Sun's Ayana bala is not doubled, since the chapter does not say so.",
    "Year and month lords follow the 360-day and 30-day counts from the Kali epoch that later manuals use; 27.13 names the lords but not how to find them. The hora is an equal hour from sunrise.",
    "Drik bala reads 'superadd the entire aspect of Mercury and Jupiter' (27.19) as those two always counting on the benefic side; their aspects are not added a second time.",
    "Rasi dignity in Saptavargaja bala follows the text: moolatrikona 45, own sign 30, otherwise the compound relationship with the sign lord, so an exaltation sign counts as its lord's sign (3.55-58). Moolatrikona follows the degree ranges of 3.51-54.",
    "Bhava bala (27.26-31) and Ishta-Kashta phala (ch. 28) are not computed.",
  ];

  return { planets: rows, lords: { varsha, masa, dina, hora }, daytime, wars, sources: SHADBALA_SOURCES, caveats };
}

export function shadbalaOf(sb: ShadbalaResult | undefined, p: Planet): PlanetShadbala | undefined {
  return sb?.planets.find((x) => x.planet === p);
}
