// Pure astrological constants and helpers shared by client and server.
// No ephemeris calls live here — only arithmetic on longitudes.

export const PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_ABBR: Record<Planet, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

export const SIGN_ABBR = [
  "Ar",
  "Ta",
  "Ge",
  "Cn",
  "Le",
  "Vi",
  "Li",
  "Sc",
  "Sg",
  "Cp",
  "Aq",
  "Pi",
];

export const SIGN_LORD: Planet[] = [
  "Mars",
  "Venus",
  "Mercury",
  "Moon",
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Saturn",
  "Jupiter",
];

export const SIGN_ELEMENT = [
  "Fire",
  "Earth",
  "Air",
  "Water",
  "Fire",
  "Earth",
  "Air",
  "Water",
  "Fire",
  "Earth",
  "Air",
  "Water",
] as const;

export const SIGN_QUALITY = [
  "Movable",
  "Fixed",
  "Dual",
  "Movable",
  "Fixed",
  "Dual",
  "Movable",
  "Fixed",
  "Dual",
  "Movable",
  "Fixed",
  "Dual",
] as const;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

export const NAKSHATRA_LORD: Planet[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];

// Sign index (0 = Aries) of exaltation and debilitation for the seven classical planets.
export const EXALTATION: Partial<Record<Planet, { sign: number; deg: number }>> = {
  Sun: { sign: 0, deg: 10 },
  Moon: { sign: 1, deg: 3 },
  Mars: { sign: 9, deg: 28 },
  Mercury: { sign: 5, deg: 15 },
  Jupiter: { sign: 3, deg: 5 },
  Venus: { sign: 11, deg: 27 },
  Saturn: { sign: 6, deg: 20 },
};

export const OWN_SIGNS: Partial<Record<Planet, number[]>> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

export const MOOLATRIKONA: Partial<Record<Planet, number>> = {
  Sun: 4,
  Moon: 1,
  Mars: 0,
  Mercury: 5,
  Jupiter: 8,
  Venus: 6,
  Saturn: 10,
};

// Natural friendships as used in the Nadi texts (Rao, Naik). The nodes follow the
// Nadi convention: Rahu behaves like Saturn, Ketu like Mars; both are hostile to the luminaries.
export const FRIENDS: Record<Planet, Planet[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter", "Ketu"],
  Mercury: ["Sun", "Venus", "Rahu"],
  Jupiter: ["Sun", "Moon", "Mars", "Ketu"],
  Venus: ["Mercury", "Saturn", "Rahu"],
  Saturn: ["Mercury", "Venus", "Rahu"],
  Rahu: ["Saturn", "Venus", "Mercury"],
  Ketu: ["Mars", "Jupiter"],
};
export const ENEMIES: Record<Planet, Planet[]> = {
  Sun: ["Venus", "Saturn", "Rahu"],
  Moon: ["Rahu", "Ketu"],
  Mars: ["Mercury", "Rahu"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus", "Rahu"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
  Rahu: ["Sun", "Moon", "Mars"],
  Ketu: ["Sun", "Moon"],
};

// Nadi combustion: a planet within the same pada of the Sun, i.e. within 3°20' (Naik).
// Standard Parashari orbs are deliberately not used; BNN reads Sun + planet as a combination.
export const COMBUSTION_ORB_DEG = 10 / 3;

export type Dignity =
  | "Exalted"
  | "Moolatrikona"
  | "Own sign"
  | "Friendly"
  | "Neutral"
  | "Inimical"
  | "Debilitated"
  | "—";

export interface PlanetPosition {
  planet: Planet;
  lon: number; // sidereal longitude 0..360
  signIndex: number; // 0..11
  sign: Sign;
  degInSign: number;
  speed: number; // deg/day
  retrograde: boolean;
  /** Retrograde planet that entered its current sign moving backward (from the sign ahead). */
  retrogradeEntry?: boolean;
  nakshatraIndex: number;
  nakshatra: string;
  nakshatraLord: Planet;
  pada: number; // 1..4
  dignity: Dignity;
  combust: boolean;
  signLord: Planet;
}

export interface TransitPeriod {
  planet: "Jupiter" | "Saturn";
  signIndex: number;
  sign: Sign;
  start: string; // ISO date
  end: string; // ISO date
  retrogradeEntry: boolean; // entered by retrograde motion
}

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

export function signOf(lon: number): number {
  return Math.floor(norm360(lon) / 30);
}

export function fmtDeg(lon: number): string {
  const total = Math.round((norm360(lon) % 30) * 3600) % (30 * 3600);
  const deg = Math.floor(total / 3600);
  const min = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${String(deg).padStart(2, "0")}°${String(min).padStart(2, "0")}'${String(sec).padStart(2, "0")}"`;
}

export function fmtDegShort(lon: number): string {
  const total = Math.round((norm360(lon) % 30) * 60) % (30 * 60);
  const deg = Math.floor(total / 60);
  const min = total % 60;
  return `${deg}°${String(min).padStart(2, "0")}'`;
}

export function dignityOf(planet: Planet, signIndex: number, degInSign: number): Dignity {
  if (planet === "Rahu" || planet === "Ketu") return "—";
  const ex = EXALTATION[planet]!;
  if (signIndex === ex.sign) return "Exalted";
  if (signIndex === (ex.sign + 6) % 12) return "Debilitated";
  if (MOOLATRIKONA[planet] === signIndex) {
    // Moolatrikona is degree-bounded; keep simple: treat whole sign as MT for Sun/Mars etc. except Moon (3-30 Taurus)
    return "Moolatrikona";
  }
  if (OWN_SIGNS[planet]?.includes(signIndex)) return "Own sign";
  const lord = SIGN_LORD[signIndex];
  if (FRIENDS[planet]?.includes(lord)) return "Friendly";
  if (ENEMIES[planet]?.includes(lord)) return "Inimical";
  return "Neutral";
}

export function describePosition(planet: Planet, lon: number, speed: number, sunLon?: number): PlanetPosition {
  const L = norm360(lon);
  const signIndex = signOf(L);
  const degInSign = L - signIndex * 30;
  const nakLen = 360 / 27;
  const nakshatraIndex = Math.floor(L / nakLen);
  const pada = Math.floor((L - nakshatraIndex * nakLen) / (nakLen / 4)) + 1;
  const retrograde = planet === "Rahu" || planet === "Ketu" ? true : speed < 0;
  let combust = false;
  if (sunLon !== undefined && planet !== "Sun" && planet !== "Rahu" && planet !== "Ketu") {
    const dist = Math.abs(((L - sunLon + 540) % 360) - 180);
    combust = dist <= COMBUSTION_ORB_DEG;
  }
  return {
    planet,
    lon: L,
    signIndex,
    sign: SIGNS[signIndex],
    degInSign,
    speed,
    retrograde,
    nakshatraIndex,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraLord: NAKSHATRA_LORD[nakshatraIndex],
    pada,
    dignity: dignityOf(planet, signIndex, degInSign),
    combust,
    signLord: SIGN_LORD[signIndex],
  };
}

// Relative sign distance counted inclusively from `from` to `to` (1..12).
export function houseFrom(fromSign: number, toSign: number): number {
  return ((toSign - fromSign + 12) % 12) + 1;
}

// BNN relation between two planets by sign.
export type Relation =
  | "conjunct" // same sign
  | "next" // object is in the 2nd sign from subject (ahead)
  | "prev" // object is in the 12th sign from subject (behind)
  | "trine" // 5th or 9th
  | "opposite" // 7th
  | "none";

export function relationOf(subjectSign: number, objectSign: number): Relation {
  const h = houseFrom(subjectSign, objectSign);
  if (h === 1) return "conjunct";
  if (h === 2) return "next";
  if (h === 12) return "prev";
  if (h === 5 || h === 9) return "trine";
  if (h === 7) return "opposite";
  return "none";
}

// South Indian chart layout: fixed 4x4 grid, Aries at row 0 col 1, going clockwise.
export const SOUTH_INDIAN_CELLS: Array<{ signIndex: number; row: number; col: number }> = [
  { signIndex: 11, row: 0, col: 0 }, // Pisces
  { signIndex: 0, row: 0, col: 1 }, // Aries
  { signIndex: 1, row: 0, col: 2 }, // Taurus
  { signIndex: 2, row: 0, col: 3 }, // Gemini
  { signIndex: 3, row: 1, col: 3 }, // Cancer
  { signIndex: 4, row: 2, col: 3 }, // Leo
  { signIndex: 5, row: 3, col: 3 }, // Virgo
  { signIndex: 6, row: 3, col: 2 }, // Libra
  { signIndex: 7, row: 3, col: 1 }, // Scorpio
  { signIndex: 8, row: 3, col: 0 }, // Sagittarius
  { signIndex: 9, row: 2, col: 0 }, // Capricorn
  { signIndex: 10, row: 1, col: 0 }, // Aquarius
];

export const KARAKA: Record<Planet, { title: string; significations: string[] }> = {
  Sun: {
    title: "Pitru karaka",
    significations: ["father", "authority", "government", "soul & vitality", "medicine", "status"],
  },
  Moon: {
    title: "Matru karaka",
    significations: ["mother", "mind", "public", "travel", "liquids", "emotions"],
  },
  Mars: {
    title: "Bhratru karaka",
    significations: ["siblings", "land & property", "courage", "engineering", "surgery", "energy"],
  },
  Mercury: {
    title: "Vidya karaka",
    significations: ["education", "speech", "commerce", "intellect", "writing", "maternal uncle"],
  },
  Jupiter: {
    title: "Jeeva karaka",
    significations: ["the native", "children", "wisdom", "wealth", "guru", "dharma"],
  },
  Venus: {
    title: "Kalatra karaka",
    significations: ["spouse", "romance", "arts", "luxury", "vehicles", "finance"],
  },
  Saturn: {
    title: "Karma karaka",
    significations: ["profession", "livelihood", "labour", "discipline", "longevity", "delay"],
  },
  Rahu: {
    title: "Chaya graha",
    significations: ["foreign lands", "technology", "unconventional paths", "illusion", "sudden gains", "paternal grandfather"],
  },
  Ketu: {
    title: "Moksha karaka",
    significations: ["spirituality", "detachment", "obstruction", "healing", "occult", "maternal grandfather"],
  },
};
