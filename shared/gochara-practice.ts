/**
 * Practitioner checks shown beside the classical gochara. They are modern practice, paraphrased from Shivanshu Pande,
 * Gochara Deep Dive (2026), which cites no verses; none is in Brihat Samhita 104 or Phaladeepika 26, none changes the
 * verdict colours, and all are provisional. The book has no page numbers in the copy used, so it is cited by chapter.
 *
 * Left out on purpose: the author's weighting of dasa against gochara (ch. 7). It has no verse support, the author reserves
 * it as his own method, and choosing a dasa system would tie the neutral Panchanga tab to one school.
 */
import { houseFrom, NAKSHATRAS, SIGNS, type Planet, type PlanetPosition, type PlanetSignPeriod, type TransitPeriod } from "./astro";
import { BS, FAVOURABLE, PD, type GocharaSource } from "./gochara";
import { taraOf, type Tara } from "./tara";

export const PANDE = (ch: number): GocharaSource => ({
  label: `Pande, Gochara Deep Dive (2026), ch. ${ch}`,
  url: "",
  provisional: true,
});
/** The nine-fold count itself, as the app's tara table cites it (shared/tara.ts). */
export const TARA_SOURCE: GocharaSource = { label: "Sarvartha Chintamani 10.8-9", url: "" };

export type PracticeTone = "support" | "strain" | "mixed" | "info";

export interface PracticeLine {
  text: string;
  tone: PracticeTone;
  planet?: Planet;
  /** Where the check disagrees with the classical verdict, said plainly with the verses. */
  conflict?: { text: string; sources: GocharaSource[] };
}

export type PracticeCheckId = "lagna" | "moon-aspects" | "mars" | "saturn-loop" | "nodes" | "tara";

export interface PracticeCheck {
  id: PracticeCheckId;
  title: string;
  sources: GocharaSource[];
  lines: PracticeLine[];
}

export interface PracticeInput {
  natalMoonSign: number;
  natalLagnaSign: number;
  /** Birth nakshatra (the natal Moon's), 0..26. */
  birthStar: number;
  /** Transiting positions at the reading time, with the Moon (for the tara). */
  positions: PlanetPosition[];
  asOf: string;
  /** Mars's stay in its present sign around `asOf`. Without it the Mars check is left out. */
  marsStay?: PlanetSignPeriod;
  /** Saturn's sign periods, with retrograde re-entries flagged (the chart's slow-planet transits). */
  saturnPeriods?: TransitPeriod[];
  /** Formats an ISO instant as a calendar date for the reader. */
  fmtDate: (iso: string) => string;
}

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const DAY_MS = 864e5;

/** The planets read through both lenses: the slow movers the book treats as the year's weather (ch. 2). */
const LENS_PLANETS: Planet[] = ["Saturn", "Jupiter", "Rahu", "Ketu"];

/** House from the Moon from which each aspect of Saturn or Jupiter falls back on the birth Moon, counted sign to sign. */
const SATURN_ON_MOON: Record<number, number> = { 11: 3, 7: 7, 4: 10 };
const JUPITER_ON_MOON: Record<number, number> = { 9: 5, 7: 7, 5: 9 };

/** Plain topics of each pair of houses the nodes fall across, the lower house first. The usual house topics; these labels are the app's. */
export const NODE_AXIS_TOPICS: Record<number, string> = {
  1: "self and partnership",
  2: "family resources and sudden change",
  3: "effort and fortune",
  4: "home and career",
  5: "children and gains",
  6: "daily work and health, expense and retreat",
};

/** The book's character for each tara, in gentle words. */
const TARA_WORDS: Record<Tara["name"], { word: string; tone: PracticeTone }> = {
  Janma: { word: "mixed", tone: "mixed" },
  Sampat: { word: "supportive", tone: "support" },
  Vipat: { word: "less supportive", tone: "strain" },
  Kshema: { word: "supportive", tone: "support" },
  Pratyari: { word: "less supportive", tone: "strain" },
  Sadhaka: { word: "supportive", tone: "support" },
  Vadha: { word: "the least supportive of the nine", tone: "strain" },
  Mitra: { word: "supportive", tone: "support" },
  "Parama-Mitra": { word: "the most supportive of the nine", tone: "support" },
};

/** Mars counts only when it stays at least this long in one sign (the book's four months, taken as 120 days). */
export const MARS_LINGER_DAYS = 120;

/** A Saturn sign change that loops: first entry, retrograde slip back, and the settling re-entry. */
export interface SaturnLoop {
  sign: number;
  back: number;
  firstEntry: string;
  slipBack: string;
  settles: string;
}

/** Saturn loops whose first entry lies within `months` of `asOf`, read from the sign periods. */
export function saturnLoops(periods: TransitPeriod[], asOf: string, months = 18): SaturnLoop[] {
  const sat = periods.filter((p) => p.planet === "Saturn");
  const t = Date.parse(asOf);
  const span = months * 30.44 * DAY_MS;
  const out: SaturnLoop[] = [];
  for (let k = 0; k + 2 < sat.length; k++) {
    const a = sat[k];
    const b = sat[k + 1];
    const c = sat[k + 2];
    if (!b.retrogradeEntry || a.retrogradeEntry || c.signIndex !== a.signIndex) continue;
    if (b.signIndex !== (a.signIndex + 11) % 12) continue;
    if (Math.abs(Date.parse(a.start) - t) > span && Math.abs(Date.parse(c.start) - t) > span) continue;
    out.push({ sign: a.signIndex, back: b.signIndex, firstEntry: a.start, slipBack: b.start, settles: c.start });
  }
  return out;
}

export function gocharaPractice(input: PracticeInput): PracticeCheck[] {
  const { natalMoonSign: moon, natalLagnaSign: lagna, positions, fmtDate } = input;
  const pos = (p: Planet) => positions.find((x) => x.planet === p);
  const checks: PracticeCheck[] = [];

  // 1. The Moon first, the lagna second (ch. 2).
  const lens: PracticeLine[] = [];
  for (const planet of LENS_PLANETS) {
    const p = pos(planet);
    if (!p) continue;
    const hM = houseFrom(moon, p.signIndex);
    const hL = houseFrom(lagna, p.signIndex);
    const fM = FAVOURABLE[planet].includes(hM);
    const fL = FAVOURABLE[planet].includes(hL);
    const word = (f: boolean) => (f ? "favourable" : "not favourable");
    const reading =
      fM && fL
        ? "both lenses agree on support, so it counts for more"
        : !fM && !fL
          ? "both lenses agree on strain, so it weighs more"
          : !fM && fL
            ? "it may feel heavier inwardly while outward life holds"
            : "outward life may strain while the mind stays steady";
    lens.push({
      planet,
      text: `${planet}: ${ordinal(hM)} from the Moon (${word(fM)}), ${ordinal(hL)} from the lagna (${word(fL)}); ${reading}.`,
      tone: fM && fL ? "support" : !fM && !fL ? "strain" : "mixed",
    });
  }
  if (lens.length)
    checks.push({ id: "lagna", title: "The Moon first, the lagna as a second lens", sources: [PANDE(2)], lines: lens });

  // 2. Aspects falling back on the birth Moon (Saturn ch. 3, Jupiter ch. 4).
  const onMoon: PracticeLine[] = [];
  const sat = pos("Saturn");
  if (sat) {
    const h = houseFrom(moon, sat.signIndex);
    const n = SATURN_ON_MOON[h];
    if (n)
      onMoon.push({
        planet: "Saturn",
        text: `Saturn in the ${ordinal(h)} from the Moon casts its ${ordinal(n)} aspect on the birth Moon. The book gives Saturn's aspect the weight of its presence${n === 10 ? ", and the 10th aspect close to Saturn over the Moon itself" : ""}.`,
        tone: "strain",
        ...(h === 11
          ? {
              conflict: {
                text: "This disagrees with the colour: the 11th is one of Saturn's good houses in both texts, and the book's own house table calls it strongly supportive.",
                sources: [BS("4"), PD("2")],
              },
            }
          : {}),
      });
  }
  const jup = pos("Jupiter");
  if (jup) {
    const h = houseFrom(moon, jup.signIndex);
    const n = JUPITER_ON_MOON[h];
    if (n)
      onMoon.push({
        planet: "Jupiter",
        text: `Jupiter in the ${ordinal(h)} from the Moon casts its ${ordinal(n)} aspect on the birth Moon, which the book reads as protective. The ${ordinal(h)} is already one of Jupiter's good houses, so the colour is unchanged.`,
        tone: "support",
      });
  }
  if (!onMoon.length) onMoon.push({ text: "Neither Saturn nor Jupiter aspects the birth Moon, counting sign to sign.", tone: "info" });
  checks.push({ id: "moon-aspects", title: "Aspects on the birth Moon", sources: [PANDE(3), PANDE(4)], lines: onMoon });

  // 3. Mars, only when it lingers (ch. 6).
  const mars = pos("Mars");
  if (input.marsStay && mars) {
    const s = input.marsStay;
    const days = (Date.parse(s.end) - Date.parse(s.start)) / DAY_MS;
    const h = houseFrom(moon, s.signIndex);
    const when = `${fmtDate(s.start)} to ${fmtDate(s.end)}`;
    const line: PracticeLine =
      days >= MARS_LINGER_DAYS
        ? {
            planet: "Mars",
            text: `Mars stays in ${SIGNS[s.signIndex]}, the ${ordinal(h)} from the Moon, from ${when} (about ${Math.round(days / 30.44)} months${mars.retrograde ? ", retrograde now" : ""}): long enough that the book reads it with the slow planets.`,
            tone: FAVOURABLE.Mars.includes(h) ? "support" : "mixed",
          }
        : {
            planet: "Mars",
            text: `Mars passes through ${SIGNS[s.signIndex]} from ${when} (about ${Math.max(1, Math.round(days / 7))} weeks): under the book's four months, so it is read as a passing influence.`,
            tone: "info",
          };
    checks.push({ id: "mars", title: "Mars, only when it lingers", sources: [PANDE(6)], lines: [line] });
  }

  // 4. Saturn's retrograde loop across a sign boundary (ch. 3).
  if (input.saturnPeriods) {
    const loops = saturnLoops(input.saturnPeriods, input.asOf);
    const lines: PracticeLine[] = loops.length
      ? loops.map((l) => ({
          planet: "Saturn" as Planet,
          text: `Saturn first entered ${SIGNS[l.sign]} on ${fmtDate(l.firstEntry)}, slipped back into ${SIGNS[l.back]} by retrograde motion on ${fmtDate(l.slipBack)} and settles in ${SIGNS[l.sign]} from ${fmtDate(l.settles)}. The book notes that such a loop moves when the change is felt, earlier or later than the first entry.`,
          tone: "info" as PracticeTone,
        }))
      : [{ text: "No retrograde loop of Saturn across a sign boundary within eighteen months of this date.", tone: "info" }];
    checks.push({ id: "saturn-loop", title: "Saturn's retrograde loop", sources: [PANDE(3)], lines });
  }

  // 5. Rahu and Ketu read together as one axis from the Moon (ch. 5).
  const ra = pos("Rahu");
  const ke = pos("Ketu");
  if (ra && ke) {
    const hR = houseFrom(moon, ra.signIndex);
    const hK = houseFrom(moon, ke.signIndex);
    const low = Math.min(hR, hK);
    checks.push({
      id: "nodes",
      title: "Rahu and Ketu as one axis",
      sources: [PANDE(5)],
      lines: [
        {
          text: `Rahu in the ${ordinal(hR)} and Ketu in the ${ordinal(hK)} from the Moon: the ${ordinal(low)}-${ordinal(low + 6)} axis (${NODE_AXIS_TOPICS[low]}). The book reads the two nodes together across this pair of houses rather than each alone.`,
          tone: "info",
        },
      ],
    });
  }

  // 6. The tara of the Moon's present star from the birth star, for choosing days (ch. 6).
  const mo = pos("Moon");
  if (mo) {
    const star = mo.nakshatraIndex;
    const count = ((star - input.birthStar + 27) % 27) + 1;
    const t = taraOf(input.birthStar, star);
    const w = TARA_WORDS[t.name];
    checks.push({
      id: "tara",
      title: "The day's tara",
      sources: [PANDE(6), TARA_SOURCE],
      lines: [
        {
          text: `The Moon is in ${NAKSHATRAS[star]}, the ${ordinal(count)} star from the birth star ${NAKSHATRAS[input.birthStar]}: ${t.name} tara, ${w.word}. The book uses the tara for choosing days, not for judging the year.`,
          tone: w.tone,
        },
      ],
    });
  }
  return checks;
}

export const GOCHARA_PRACTICE_NOTES: string[] = [
  "These checks are modern practice from Shivanshu Pande, Gochara Deep Dive (2026), paraphrased by chapter; the book cites no verses. None of them changes the verdicts above, and all are provisional.",
  "The lagna lens counts the same good houses (Brihat Samhita 104.4, Phaladeepika 26.2) from the lagna instead of the Moon. Both texts read transits from the Moon (Phaladeepika 26.1), and the book too keeps the Moon first.",
  "Aspects on the birth Moon are counted sign to sign. Counted so, Jupiter's aspects reach the Moon only from the 5th, 7th and 9th, which are already good houses for Jupiter; the book's example of Jupiter in the 8th aspecting the Moon works only with aspects measured by degree.",
  "Saturn's 3rd aspect reaches the Moon from the 11th, a good house for Saturn in both texts and in the book's own table; the two readings are shown side by side, not reconciled.",
  "Mars counts only when it stays four months (taken as 120 days) or more in one sign, as the book suggests. The tara names and the count of nine follow the app's tara table.",
  "Not used: the author's weighting of dasa against gochara (ch. 7). It has no verse support, the author reserves it as his own method, and it would tie this neutral tab to one dasa system. Brihat Samhita 104.46 makes the dasa the condition of every transit; see the Vimshottari and Jaimini tabs.",
];
