import { SIGN_LORD, type Planet } from "./astro";

/**
 * Prasna Marga Ch. XXI, the marriage kootas (21.17-50): the sources of agreement read from the
 * couple's Janma Rasi and birth star. The Rasi agreement (21.1-16) lives in rules-prasna.ts; this
 * module is the star- and lord-based kootas. The most important five (21.69) are Janma Rasi, lord
 * of the Rasi, Vasya, Mahendra and Yoni.
 *
 * Not applied here: Gotra (21.35-36, for Brahmins), Vihanga (21.37), the animal-yoni enmities
 * (21.38-42, whose list is damaged), Vaya by actual ages (21.51), the Ashtakavarga agreement
 * (21.52-53), the love override (21.54-55), Aya/Vyaya and Rinanukulya (21.56-60) and the 88th/
 * 108th navamsa (21.23).
 */

type Grade = "good" | "fair" | "bad";
interface Koota { grade: Grade; text: string }

const nak = (moonLon: number) => Math.floor((((moonLon % 360) + 360) % 360) / (360 / 27));
const count = (from: number, to: number) => (to - from + 27) % 27 + 1; // 1..27

// ── 21.17-18 Vasya: each Rasi's Vasya Rasi. ────────────────────────────────────────────────────
const VASYA: number[][] = [
  [4, 7], // Aries → Leo, Scorpio
  [3, 6], // Taurus → Cancer, Libra
  [5], // Gemini → Virgo
  [7, 8], // Cancer → Scorpio, Sagittarius
  [6], // Leo → Libra
  [2, 11], // Virgo → Gemini, Pisces
  [5, 9], // Libra → Virgo, Capricorn
  [3], // Scorpio → Cancer
  [11], // Sagittarius → Pisces
  [0, 10], // Capricorn → Aries, Aquarius
  [9], // Aquarius → Capricorn
  [9], // Pisces → Capricorn
];

// ── 21.19-20 Rasyadhipati: Satyacharya's friendships. ──────────────────────────────────────────
const FRIEND: Partial<Record<Planet, Planet[]>> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Jupiter", "Moon", "Sun"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};

// ── 21.32 Gana. ────────────────────────────────────────────────────────────────────────────────
const GANA: Array<"deva" | "nara" | "asura"> = [
  "deva", "nara", "asura", "nara", "deva", "nara", "deva", "deva", "asura",
  "asura", "nara", "nara", "deva", "asura", "deva", "asura", "deva", "asura",
  "asura", "nara", "nara", "deva", "asura", "asura", "nara", "nara", "deva",
];

// ── 21.30 Yoni (sex of the asterism). ──────────────────────────────────────────────────────────
const MALE_STARS = new Set([0, 1, 7, 8, 9, 11, 14, 15, 17, 18, 19, 21, 24, 25]);

// ── 21.27 Varna (caste by asterism), six repeating from Aswini. ────────────────────────────────
const VARNA = ["Brahmin", "Kshatriya", "Vaisya", "Sudra", "anuloma", "pratiloma"];
const VARNA_RANK: Record<string, number> = {
  Brahmin: 0, Kshatriya: 1, Vaisya: 2, Sudra: 3, anuloma: 4, pratiloma: 5,
};

// ── 21.45 Vedha pairs. ─────────────────────────────────────────────────────────────────────────
const VEDHA: Array<[number, number]> = [
  [0, 17], [1, 16], [5, 21], [2, 15], [3, 14], [8, 18], [9, 26], [7, 19],
  [6, 20], [10, 25], [12, 23], [11, 24],
];
const VEDHA_MUTUAL = [4, 13, 22]; // Mrigasira, Chitta, Dhanishta

// ── 21.50 Rajju, three groups of nine. ─────────────────────────────────────────────────────────
const RAJJU: number[][] = [
  [0, 5, 6, 11, 12, 17, 18, 23, 24],
  [1, 4, 7, 10, 13, 16, 19, 22, 25],
  [2, 3, 8, 9, 14, 15, 20, 21, 26],
];

// ── 21.47 Bhuta, five elements. ────────────────────────────────────────────────────────────────
const BHUTA: Array<"prithvi" | "jala" | "teja" | "vayu" | "akasa"> = [
  "prithvi", "prithvi", "prithvi", "prithvi", "prithvi",
  "jala", "jala", "jala", "jala", "jala", "jala",
  "teja", "teja", "teja", "teja", "teja",
  "vayu", "vayu", "vayu", "vayu", "vayu", "vayu",
  "akasa", "akasa", "akasa", "akasa", "akasa",
];

export interface KootaReading {
  vasya: Koota;
  rasyadhipati: Koota;
  mahendra: Koota;
  dina: Koota;
  streedeegha: Koota;
  gana: Koota;
  yoni: Koota;
  varna: Koota;
  vedha: Koota;
  rajju: Koota;
  bhuta: Koota;
  good: number;
  total: number;
}

const ord = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

/** The eleven star- and lord-based kootas for a match (male and female Moon longitudes). */
export function computeKootas(
  maleMoonLon: number,
  femaleMoonLon: number,
): KootaReading {
  const ms = Math.floor((((maleMoonLon % 360) + 360) % 360) / 30);
  const fs = Math.floor((((femaleMoonLon % 360) + 360) % 360) / 30);
  const mn = nak(maleMoonLon);
  const fn = nak(femaleMoonLon);

  // Vasya: the man's Rasi being the woman's Vasya, or mutual (21.17-18).
  const manIsWomanVasya = VASYA[fs].includes(ms);
  const womanIsManVasya = VASYA[ms].includes(fs);
  const vasya: Koota =
    manIsWomanVasya && womanIsManVasya
      ? { grade: "good", text: "mutually Vasya Rasis: a loving life (21.17-18)" }
      : manIsWomanVasya || womanIsManVasya
        ? { grade: "fair", text: "one Rasi is the other's Vasya (21.17-18)" }
        : { grade: "bad", text: "no Vasya between the Rasis (21.17-18)" };

  // Rasyadhipati: the lords are friends or one (21.19-20).
  const ml = SIGN_LORD[ms];
  const fl = SIGN_LORD[fs];
  const rasyadhipati: Koota =
    ml === fl
      ? { grade: "good", text: `the lords are one (${ml}) (21.19)` }
      : FRIEND[ml]?.includes(fl) || FRIEND[fl]?.includes(ml)
        ? { grade: "good", text: `the lords ${ml} and ${fl} are friends (21.19-20)` }
        : { grade: "bad", text: `the lords ${ml} and ${fl} are not friends (21.19-20)` };

  // Mahendra/Upendra: girl's star 4th or 7th from the boy's (21.24-25).
  const gFromB = count(mn, fn);
  const mahendra: Koota =
    gFromB === 4
      ? { grade: "good", text: "Mahendra: the girl's star is 4th from the boy's — wealth and grain (21.24-25)" }
      : gFromB === 7
        ? { grade: "good", text: "Upendra: the girl's star is 7th from the boy's — children (21.24-25)" }
        : { grade: "fair", text: `the girl's star is the ${ord(gFromB)} from the boy's (21.24-25)` };

  // Dina: the boy's star 3rd, 5th or 7th from the girl's is avoided (21.21-22).
  const bFromG = count(fn, mn);
  const dina: Koota =
    bFromG === 5
      ? { grade: "bad", text: "the boy's star is 5th from the girl's — much trouble (21.22)" }
      : bFromG === 3 || bFromG === 7
        ? { grade: "bad", text: `the boy's star is ${ord(bFromG)} from the girl's — trouble (21.21-22)` }
        : { grade: "good", text: `the boy's star is the ${ord(bFromG)} from the girl's (21.21-22)` };

  // Streedeergha: more than 15 from the girl to the boy (21.26).
  const girlToBoy = count(fn, mn);
  const streedeegha: Koota =
    girlToBoy > 15
      ? { grade: "good", text: `Streedeergha: ${girlToBoy} stars from the girl to the boy — long life for the husband (21.26)` }
      : { grade: "fair", text: `${girlToBoy} stars from the girl to the boy (21.26)` };

  // Gana (21.32-33).
  const bg = GANA[mn];
  const gg = GANA[fn];
  const ganaText = (b: string, g: string) =>
    b === g
      ? `both ${b} gana — highly propitious (21.33)`
      : b === "deva" && g === "nara"
        ? "Deva man, Nara woman — fairly good (21.33)"
        : b === "asura" && g === "nara"
          ? "Asura man, Nara woman — ordinary (21.33)"
          : b === "nara" && g === "deva"
            ? "Nara man, Deva woman — bad (21.33)"
            : b === "nara" && g === "asura"
              ? "Nara man, Asura woman — not to be brought together (21.33)"
              : "Deva with Asura — quarrels and even death (21.32)";
  const gana: Koota =
    bg === gg
      ? { grade: "good", text: ganaText(bg, gg) }
      : bg === "deva" && gg === "nara"
        ? { grade: "good", text: ganaText(bg, gg) }
        : bg === "asura" && gg === "nara"
          ? { grade: "fair", text: ganaText(bg, gg) }
          : { grade: "bad", text: ganaText(bg, gg) };

  // Yoni (sex of the star, 21.30).
  const bm = MALE_STARS.has(mn);
  const gm = MALE_STARS.has(fn);
  const yoni: Koota =
    bm && !gm
      ? { grade: "good", text: "a male star with a female star — happiness (21.30)" }
      : !bm && !gm
        ? { grade: "bad", text: "both female stars — loss of wealth (21.30)" }
        : bm && gm
          ? { grade: "bad", text: "both male stars — to be rejected (21.30)" }
          : { grade: "fair", text: "a female star with a male star (21.30)" };

  // Varna (21.27-28).
  const bv = VARNA[mn % 6];
  const gv = VARNA[fn % 6];
  const varna: Koota =
    bv === gv
      ? { grade: "good", text: `the same caste (${bv}) — best (21.28)` }
      : VARNA_RANK[bv] < VARNA_RANK[gv]
        ? { grade: "fair", text: `the man ${bv}, the woman ${gv} — admissible (21.28)` }
        : { grade: "bad", text: `the man ${bv}, the woman ${gv} — inadmissible (21.28)` };

  // Vedha (21.45).
  const vedhaHit =
    VEDHA.some(([a, b]) => (a === mn && b === fn) || (a === fn && b === mn)) ||
    (VEDHA_MUTUAL.includes(mn) && VEDHA_MUTUAL.includes(fn));
  const vedha: Koota = vedhaHit
    ? { grade: "bad", text: "the stars fall in a Vedha pair — ruin, and it prevails over other agreements (21.45-46)" }
    : { grade: "good", text: "no Vedha between the stars (21.45)" };

  // Rajju (21.50).
  const rajjuGroup = RAJJU.findIndex((g) => g.includes(mn));
  const rajju: Koota =
    rajjuGroup >= 0 && RAJJU[rajjuGroup].includes(fn)
      ? { grade: "bad", text: `both stars in the ${ord(rajjuGroup + 1)} Rajju group — not to be done (21.50)` }
      : { grade: "good", text: "the stars are in different Rajju groups (21.50)" };

  // Bhuta (21.47).
  const bb = BHUTA[mn];
  const gb = BHUTA[fn];
  const bhuta: Koota =
    bb === gb
      ? { grade: "good", text: `the same element (${bb}) — good (21.47)` }
      : (bb === "vayu" && gb === "teja") || (bb === "teja" && gb === "vayu")
        ? { grade: "good", text: "air with fire — equally good (21.47)" }
        : bb === "prithvi" || gb === "prithvi"
          ? { grade: "good", text: "earth with another element — good (21.47)" }
          : (bb === "jala" && gb === "teja") || (bb === "teja" && gb === "jala")
            ? { grade: "bad", text: "water with fire — bad (21.47)" }
            : { grade: "fair", text: "ethereal with another element — passable (21.47)" };

  const all = [vasya, rasyadhipati, mahendra, dina, streedeegha, gana, yoni, varna, vedha, rajju, bhuta];
  return {
    vasya, rasyadhipati, mahendra, dina, streedeegha, gana, yoni, varna, vedha, rajju, bhuta,
    good: all.filter((k) => k.grade === "good").length,
    total: all.length,
  };
}
