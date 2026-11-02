// Rectification methods: one at a time, never blended; each cites its own source. Shared by the
// Rectify tab and the report module so both score an interval the same way.
import type {
  RectifyBaselineStat,
  RectifySegment,
  RectifyEvent,
  JudgePlaceInput,
} from "./rectify-types";
import { scoreMarks, type BodyMarksResult } from "./body-marks";
import { qualifiedTotals, type QualifiedScoreKey } from "./qualified-event-scores";

/** Rectification methods. One at a time, never blended; each cites its own source. */
export type RectifyMethod =
  | "kp-rp"
  | "kp-nemani-rp"
  | "kp-moon"
  | "kp-events"
  | "kp-transit"
  | "kp-aurora"
  | "kp-aurora-v2"
  | "kp-qualified"
  | "parashari-events-v4"
  | "alp-marriage"
  | "bnn-marriage"
  | "jaimini-dasha"
  | "parashari-events"
  | "parashari-events-v2"
  | "parashari-events-v3"
  | "bj-marks"
  | "kunda"
  | "kunda-d81"
  | "bj-nashta";
export const RECTIFY_METHODS: Array<{
  id: RectifyMethod;
  system: string;
  label: string;
  plainLabel: string;
  short: string;
  plainShort: string;
  source: string;
  needsJudge: boolean;
  needsEvents: boolean;
}> = [
  { id: "kp-qualified", system: "KP", label: "Natal then periods · research", plainLabel: "Natal then periods · research",
    plainShort: "A conservative experiment checks natal indications before three period lords. Mixed or absent clues remain unresolved.",
    short: "Four app-defined sequential stages: the registered ordinary natal promise clues, then dasa, bhukti and antara. Missing or mixed clues stop the sequence, without denying the event. Matter-house links are partial, not the full KP method.",
    source: "M.P. Shanmugham, Astro Secrets & KP, Part 1 pp. 167–172 and Part 2 p. 203; Leena Aurora, The Ultimate Guide to KP Astrology Techniques, pp. 258–262, 266–268.", needsJudge: false, needsEvents: true },
  { id: "parashari-events-v4", system: "Parashari", label: "Children natal clue · v4 research", plainLabel: "Children natal clue · v4 research",
    plainShort: "The v3 event check adds one separately sourced children clue. Its points overlap and remain experimental.",
    short: "Adds BPHS 16.16's ordinary fifth-lord clue to v3 for children only; marriage and career retain v3. House methods may differ and the extra clue overlaps other factors.",
    source: "Brihat Parashara Hora Shastra 16.16; Paul Manley, Birth Time Rectification, ch. 4 pp. 101, 118–122.", needsJudge: false, needsEvents: true },
  { id: "alp-marriage", system: "ALP", label: "Marriage pada · research", plainLabel: "Marriage pada · research",
    plainShort: "Compare one marriage-specific progressed-lagna condition, which can last for a long period.",
    short: "One ordinary ALP pada-navamsa condition. The source also requires the chart to permit marriage, which this test does not establish.",
    source: "S. Pothuvudaimoorthy, Akshaya Lagna Paddhathi vol. 2 p. 35.", needsJudge: false, needsEvents: true },
  { id: "bnn-marriage", system: "BNN", label: "Marriage Jupiter contact · research", plainLabel: "Marriage Jupiter contact · research",
    plainShort: "Compare a single year-scale Jupiter contact with the natal spouse significator; this is a partial clue.",
    short: "Same-sign Jupiter contact with natal Venus in male or Mars in female charts. The cited Venus example specifies a second Jupiter round, which this partial clue does not check. Unspecified gender is unassessed.",
    source: "N. Srinivasan Shastry, Brighu Naadi Sangraha, introductory principles and Jupiter chapter.", needsJudge: false, needsEvents: true },
  {
    id: "kp-aurora-v2", system: "KP", label: "Aurora mixed scripts · v2 research",
    plainLabel: "Aurora mixed scripts · v2 research",
    plainShort: "Compare house and period scripts in order. A mixed star can proceed when its sub supports the event; a mixed sub remains unresolved. In an initial published-case check no complete chains passed and every sampled training window tied, so this cannot yet rank birth times.",
    short: "Direct occupied/owned houses, explicit node agents and self-significator promotions feed a staged screen. A supporting sub can carry a mixed star forward with caution; a mixed sub remains unresolved. In an initial published-case check no complete chains passed and every sampled training window tied. The node aspect, self-promotion and repeated-star/sub conventions are provisional. Transit evidence is descriptive.",
    source: "Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied Kindle capture pp. 260–262, 360–365, 462–474 and 582–599.",
    needsJudge: false, needsEvents: true,
  },
  {
    id: "kp-aurora", system: "KP", label: "Aurora strict scripts · v1 research",
    plainLabel: "Aurora staged scripts · research",
    plainShort: "Compare the source's cusp and period scripts in order. This strict research interpretation leaves mixed or silent stages unresolved and counts only fully supported chains. In a small fresh-case check, no chains passed and all sampled birth times tied; it cannot establish a birth time.",
    short: "The experimental adapter uses Nadi's four-step houses and Aurora's self-significator cusp links and own-star adjustment. A stage passes only when both script layers link to the matter without adverse houses; later stages cannot rescue an unresolved predecessor. These thresholds and house mappings are app conventions, not a complete transcription of Aurora's procedure.",
    source: "Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied Kindle capture pp. 252–261, 266–268, 335–341, 438–439 and 571–572.",
    needsJudge: false, needsEvents: true,
  },
  {
    id: "parashari-events-v3", system: "Parashari", label: "Divisional period lords · v3",
    plainLabel: "Divisional period lords · v3",
    plainShort: "An experimental event comparison that adds the two main period planets' direct links to the relevant divisional house, lord or significator. It also retains v2's event-day transit checks. A match cannot establish a promise or birth time.",
    short: "Eight app-defined checks per event: the unchanged six v2 factors plus one primary divisional-chart connection each for the dasa and bhukti lords. Equal weights, overlapping factors and this numerical synthesis are Nadi's choices, not a published formula.",
    source: "Paul Manley, Birth Time Rectification: How to Find Your Exact Birth Time (2022), ch. 4 pp. 101, 118–122, plus the sources of Nadi's v2 factors; this partial eight-point combination is an app experiment.",
    needsJudge: false, needsEvents: true,
  },
  {
    id: "parashari-events-v2", system: "Parashari", label: "Event-specific rules · v2",
    plainLabel: "Event-specific rules · v2",
    plainShort: "An experimental comparison with different timing rules for marriage, childbirth and new jobs or promotions. It combines partial D1 and divisional support, period links and event-day transits; a match cannot establish a promise or a birth time.",
    short: "Six app-defined event-specific checks: two partial D1/divisional support checks and four marriage-, childbirth- or career-specific timing/relationship checks. Equal weights and strict subsets are Nadi's experimental convention.",
    source: "BPHS 7.1–8 and 11.14–16; K.N. Rao-guided Astrology and Timing of Marriage ch. 2; Astrological Assessment of Timing of Childbirth §§2.6–2.7 (citing Phaladeepika); Vishnu Bhaskar, Advanced Techniques of Predictive Astrology vol. 1 ch. 1 pp. 23–24. The six-point synthesis is Nadi's, not a published formula.",
    needsJudge: false, needsEvents: true,
  },
  {
    id: "parashari-events", system: "Parashari", label: "D1, varga and event timing · v1",
    plainLabel: "Birth chart, division and events · v1",
    plainShort: "A provisional comparison of D1 and D9, D7 or D10 house support, the event's two main periods and Jupiter–Saturn transits. It counts documented rule matches for marriage, childbirth and a new job or promotion; it cannot confirm that an event was promised or establish the birth time.",
    short: "Five app-defined checks per supported event: partial D1 house support, D9/D7/D10 house support, dasa and bhukti links, and a narrow same-target Jupiter–Saturn double transit. Mixed indications are shown; equal weights are an experimental app convention.",
    source: "BPHS 7.1–8, 11.14–16; M.S. Mehta, Analysing Horoscope Through Modern Techniques, ch. XVIII; K.N. Rao-guided Astrology and Timing of Marriage, ch. 2; Astrological Assessment of Timing of Childbirth; P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, §§6.3, 9.3 and 18.5. This score is Nadi's synthesis, not a published formula.",
    needsJudge: false, needsEvents: true,
  },
  {
    id: "kp-nemani-rp",
    system: "KP",
    label: "RP Moon · Nemani",
    plainLabel: "Moon ruling now · Nemani",
    plainShort: "Nemani's separate check compares the birth ascendant's three rulers with the Moon's rulers at the moment of judgment. The connections between both planets are read in the judgment chart. All three levels must link for a match; a match does not establish the birth time.",
    short: "Nemani's three-level RP Moon check: compare the candidate lagna's sign, star and sub lords with the judgment Moon's corresponding lords. Equality or a direct or two-step star/sub chain in either direction, using judgment-chart positions, links a level. All three must link; no weighting or birth-time accuracy is inferred.",
    source: "Dr. Nemani Venkata Raghunatha Rao, Birth Time Rectification Methods, vol. 1, ch. 4, Kindle locations 305–350; the supplied edition and worked examples. The two-step directional chain is the app's explicit interpretation of the examples.",
    needsJudge: true,
    needsEvents: false,
  },
  {
    id: "kp-rp",
    system: "KP",
    label: "Ruling planets",
    plainLabel: "Planets ruling now",
    plainShort:
      "The rising degree's sign, star and deciding planets are compared with the planets ruling at judgment. The additional RP Moon check is Nadi's Dutta-inspired mixed-chart interpretation: it uses a natal position on one side and a judgment-time position on the other. It differs from Nemani's separately named judgment-chart procedure. These matches do not establish a birth time.",
    short:
      "Compare the lagna's sign, star and sub lords with the accepted ruling planets. The additional RP Moon links are an experimental mixed-chart interpretation inspired by Dutta: the lagna lord's natal position and the RP Moon lord's judgment-time position are compared. It is not Nemani's all-judgment-chart procedure, and the combined weights are app conventions.",
    source:
      "Astro Secrets & KP Part 3, ch. 30, pp. 160-163; Part 1, pp. 173-178; Andrew Dutta, Birth Time Rectification through KP Astrology (the RP-Moon three-level linkage, first testing)",
    needsJudge: true,
    needsEvents: false,
  },
  {
    id: "kp-moon",
    system: "KP",
    label: "Moon lords",
    plainLabel: "Moon's star",
    plainShort:
      "At the true birth time the deciding planet of the rising degree should point to the star the Moon was in at birth: it is that star's ruler, or stands in that ruler's star or in one of its finer divisions; failing that it should at least own or stand in the Moon's sign. It needs nothing but the chart, so it is the first sieve before the other methods, and the corrected time must stay inside what the family remembers.",
    short:
      "At the true birth time the lagna cusp sub lord tells the birth star: it is the star's lord, or it stands in that lord's star, sub, sub-sub or sookshma, or the planet whose sub it occupies does; failing the star it should at least own or stand in the Moon sign. Telling the very birth star is the stronger confirmation, and the corrected time must stay inside the time the family gave. Needs nothing but the chart, so it is a first sieve before the other methods.",
    source: "M.P. Shanmugham, Astro Secrets & KP Part 2, pp. 80-82",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "kp-events",
    system: "KP",
    label: "Dated events",
    plainLabel: "Dated events",
    plainShort:
      "For each dated event, check whether the three planets whose periods were running relate to the houses of that matter, and whether its cusp's deciding planet promises it. The score shows the app's tally; it cannot establish the birth time on its own.",
    short:
      "At each remembered event the dasa, bhukti and antara lords running that day are checked as significators of the matter's houses, and the matter's cusp is checked for a promise through its sub lord. The provisional tally does not establish the correct interval.",
    source: "Astro Secrets & KP Part 1, pp. 167-172; Part 2, p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "kp-transit",
    system: "KP",
    label: "Period-lord transits",
    plainLabel: "Period planets and the sky",
    plainShort:
      "The event-day check compares the transits of the period and sub-period planets with that candidate's natal significators. The Sun's current sub is shown separately as a judgment-day hint; it does not enter the event score or comparison.",
    short:
      "On the event day the dasa and bhukti lords transit the sign, star and sub of significators of the matter. The Sun's judgment-day sub (N. Nataraj) is displayed separately and is not part of the event score or its random-date comparison.",
    source: "Astro Secrets & KP Part 2, p. 192 and p. 203",
    needsJudge: true,
    needsEvents: true,
  },
  {
    id: "jaimini-dasha",
    system: "Jaimini",
    label: "Chara dasha",
    plainLabel: "Sign periods",
    plainShort:
      "K.N. Rao's check for a doubtful chart: run Jaimini's sign-based periods at each candidate time and ask whether the period and sub-period signs running on an event date carry that matter. Period boundaries can change even within one rising sign.",
    short:
      "For a doubtful horoscope K.N. Rao runs the chara dasha and asks whether the mahadasha and antardasha signs at events carry those matters: the area's karaka, pada or house counted from the dasha sign. Each candidate's birth time and natal positions determine its periods.",
    source:
      "K.N. Rao, Predicting through Jaimini's Chara Dasa, Vani Publications; the triggers are those of the Jaimini tab's timing",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "bj-marks",
    system: "Brihat Jataka",
    label: "Marks on the body",
    plainLabel: "Marks on the body",
    plainShort:
      "Varahamihira makes the twelve houses the parts of the body, head first, and which set of parts they stand for depends on which third of the rising sign is up: the head, the trunk or the lower body. A harsh planet in a house leaves a wound or scar on that part, a helpful one, or its gaze, a mole or birthmark; parts on the right for houses two to six, on the left for eight to twelve. Tick the marks you actually carry and see which third of the sign explains them. It settles the ten-degree third, not the minute.",
    short:
      "The twelve bhavas are the limbs of the body by the rising drekkana: the first drekkana gives the head, the second the trunk from the neck, the third the body from the pelvis; houses 2-6 are the right side, 8-12 the left. A malefic in a bhava wounds that limb, a benefic or a benefic's aspect marks it; own sign, own navamsa or a fixed sign makes the mark congenital. Three planets in one sign mark the limb without fail; a malefic in the 6th wounds. Confirm the limbs that carry marks and the drekkana that explains them is the sieve; it settles the drekkana, not the minute.",
    source:
      "Brihat Jataka 5.22-26 (Iyer 1885, pp. 49-53; Adyar 1951, pp. 301-308)",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "kunda",
    system: "Prasna Marga",
    label: "Kunda · Raman example",
    plainLabel: "Kunda · Raman example",
    plainShort:
      "Raman's worked example multiplies the rising longitude in arc-minutes by 81 and takes the remainder after division by 12. This provisional arithmetic changes faster than the scan's clock resolution, so the table samples midpoints only and cannot identify a birth-time interval.",
    short:
      "Raman's worked example multiplies lagna in arc-minutes by 81 and expunges multiples of 12. The remainder reaches only twelve stars and can change several times per second. The table samples the midpoint only; it is not a search of the full interval.",
    source:
      "Prasna Marga 5.8-9 (B.V. Raman), worked example. This arithmetic and its application to natal rectification are provisional; see the separately named D81 interpretation.",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "kunda-d81",
    system: "Prasna Marga",
    label: "Kunda · D81 / 27 stars",
    plainLabel: "Kunda · 27 stars",
    plainShort:
      "Multiply the rising longitude by 81, reduce it to a full circle, and compare its star with the Moon's birth star and its two trines. This variant is scanned separately because its boundaries do not follow the KP intervals.",
    short:
      "Nava-navamsa Kunda: multiply the natal lagna longitude by 81, reduce modulo 360°, and compare its nakshatra with the Moon's natal nakshatra and its 10th and 19th. The natal application and alternative to Raman's worked arithmetic are labelled separately.",
    source:
      "Prasna Marga 5.8-9; C.S. Patel, Navamsa in Astrology, ch. 14; Dr. Nemani Venkata Raghunatha Rao, Birth Time Rectification Methods, vol. 1, ch. 1, Kindle locations 66–145 (D81 natal interpretation).",
    needsJudge: false,
    needsEvents: false,
  },
  {
    id: "bj-nashta",
    system: "Brihat Jataka",
    label: "Lost horoscope",
    plainLabel: "Lost horoscope",
    plainShort:
      "Varahamihira's check from the lost-horoscope chapter: the rising degree, multiplied by its sign's factor and by the factor of each planet in it, then by seven, reads a birth star; when it lands on the querent's star or its trines, the time is plausible.",
    short:
      "The lagna, multiplied by the Rasi factor (Aries/Libra 7, Taurus/Leo 10, Gemini/Scorpio 8, Cancer 4, Virgo/Capricorn 5, Sagittarius 9, Aquarius 11, Pisces 12) and by the Graha factor of each planet in the rising sign (Jupiter 10, Mars 8, Venus 7, others 5), the products reduced by 12 and summed, multiplied by 7, adjusted by 9 for the sign's character and reduced by 27, gives the birth nakshatra (26.9-10).",
    source:
      "Brihat Jataka 26.9-10 (Usha-Shashi, Sagar Publications). The ±9 adjustment follows the text's note that every remainder is in signs; Bhatta-Utpala keys it to the rising drekkana, so it is provisional.",
    needsJudge: false,
    needsEvents: false,
  },
];

export const QUALIFIED_RECTIFY_METHODS: Partial<Record<RectifyMethod, QualifiedScoreKey>> = {
  "kp-qualified": "kp", "parashari-events-v4": "parashari", "alp-marriage": "alp", "bnn-marriage": "bnn",
};

/** Method label for running text; only "Moon" keeps its capital. */
export function methodLabel(m: { label: string }): string {
  return m.label.startsWith("Moon") ? m.label : m.label.toLowerCase();
}

/** Score of one interval under one method. */
export function methodScore(
  s: RectifySegment,
  m: RectifyMethod,
  marks?: { table: Record<number, BodyMarksResult>; confirmed: Set<string> },
): { score: number; max: number } {
  const qualifiedKey = QUALIFIED_RECTIFY_METHODS[m];
  if (qualifiedKey) return qualifiedTotals(s.events.map((e) => e.qualifiedScores), qualifiedKey);
  if (m === "kp-aurora-v2")
    return s.events.reduce((a, e) => e.auroraV2
      ? { score: a.score + (e.auroraV2.allSupported ? 1 : 0), max: a.max + 1 } : a,
      { score: 0, max: 0 });
  if (m === "kp-aurora")
    return s.events.reduce((a, e) => e.aurora
      ? { score: a.score + (e.aurora.allSupported ? 1 : 0), max: a.max + 1 } : a,
      { score: 0, max: 0 });
  if (m === "kp-nemani-rp")
    return s.nemani ? { score: s.nemani.all ? 1 : 0, max: 1 } : { score: 0, max: 0 };
  if (m === "parashari-events-v3")
    return (s.parashariDivisional ?? []).reduce((a, e) => ({ score: a.score + e.score, max: a.max + e.max }), { score: 0, max: 0 });
  if (m === "parashari-events-v2")
    return (s.parashariSpecific ?? []).reduce((a, e) => ({ score: a.score + e.score, max: a.max + e.max }), { score: 0, max: 0 });
  if (m === "parashari-events")
    return (s.parashariPromise ?? []).reduce((a, e) => ({ score: a.score + e.score, max: a.max + e.max }), { score: 0, max: 0 });
  if (m === "bj-marks") {
    const r = marks?.table[s.marksKey ?? s.drekkana];
    if (!r) return { score: 0, max: 0 };
    const sc = scoreMarks(r, marks!.confirmed);
    return { score: sc.score, max: sc.max };
  }
  if (m === "kunda") {
    const k = s.kunda;
    return k ? { score: k.score, max: k.max } : { score: 0, max: 0 };
  }
  if (m === "kunda-d81") {
    const k = s.kundaD81;
    return k ? { score: k.score, max: k.max } : { score: 0, max: 0 };
  }
  if (m === "bj-nashta") {
    const k = s.bjNashta;
    return k ? { score: k.score, max: k.max } : { score: 0, max: 0 };
  }
  if (m === "kp-rp")
    // The book RP agreement (max 4) plus Dutta's RP-Moon three-level linkage (max 4, absent on
    // cached results from before it was added); both rule the same judgement moment.
    return {
      score: s.rp.score + (s.dutta?.score ?? 0),
      max: s.rp.max + (s.dutta?.max ?? 0),
    };
  if (m === "kp-moon")
    return { score: s.moonLords.score, max: s.moonLords.max };
  if (m === "kp-events")
    return s.events.reduce(
      (acc, e) => ({ score: acc.score + e.score, max: acc.max + e.max }),
      { score: 0, max: 0 },
    );
  if (m === "jaimini-dasha")
    return s.events.reduce(
      (acc, e) => ({
        score: acc.score + (e.jaimini?.score ?? 0),
        max: acc.max + (e.jaimini?.max ?? 0),
      }),
      { score: 0, max: 0 },
    );
  return s.events.reduce(
    (acc, e) => ({
      score: acc.score + e.transit.score,
      max: acc.max + e.transit.max,
    }),
    { score: 0, max: 0 },
  );
}

/** The random-date comparison of one interval under an event method, if computed. */
export function baselineFor(
  s: RectifySegment,
  m: RectifyMethod,
): RectifyBaselineStat | undefined {
  const qualifiedKey = QUALIFIED_RECTIFY_METHODS[m];
  if (qualifiedKey) return s.baseline?.qualified?.[qualifiedKey];
  if (m === "kp-aurora-v2") return s.baseline?.auroraV2;
  if (m === "kp-aurora") return s.baseline?.aurora;
  if (m === "kp-events") return s.baseline?.kpEvents;
  if (m === "kp-transit") return s.baseline?.transit;
  if (m === "jaimini-dasha") return s.baseline?.jaimini;
  return undefined;
}

/** Coalesce adjacent samples only when every displayed Nemani input and link agrees. */
export function groupNemaniSegments(segments: RectifySegment[]): Array<{
  first: RectifySegment; last: RectifySegment; firstIndex: number; given: boolean;
}> {
  const groups: Array<{
    first: RectifySegment; last: RectifySegment; firstIndex: number; given: boolean; signature: string;
  }> = [];
  segments.forEach((s, firstIndex) => {
    const signature = JSON.stringify([s.midDate, s.sign, s.signLord, s.starLord, s.subLord, s.nemani]);
    const prev = groups[groups.length - 1];
    if (prev && prev.signature === signature && prev.last.endIso === s.startIso) {
      prev.last = s;
      prev.given ||= s.given;
    } else groups.push({ first: s, last: s, firstIndex, given: s.given, signature });
  });
  return groups;
}

/**
 * Fraction of the scanned duration represented by intervals whose midpoint has
 * the highest raw score. Rounded display endpoints make this an approximation;
 * it is not a claim that every instant within an interval has that score.
 */
export function rawScoreCoverage(
  rows: Array<{ score: number; startIso: string; endIso: string; given: boolean }>,
): { top: number; percent: number; recorded: number | undefined } | undefined {
  const timed = rows.map((r) => ({ ...r, ms: Date.parse(r.endIso) - Date.parse(r.startIso) }))
    .filter((r) => Number.isFinite(r.score) && Number.isFinite(r.ms) && r.ms > 0);
  if (!timed.length) return undefined;
  const top = Math.max(...timed.map((r) => r.score));
  const total = timed.reduce((sum, r) => sum + r.ms, 0);
  const topMs = timed.reduce((sum, r) => sum + (r.score === top ? r.ms : 0), 0);
  return { top, percent: Math.round((topMs / total) * 1000) / 10, recorded: rows.find((r) => r.given)?.score };
}

/** Highlight the same exploratory candidates in the panel and its report. */
export function highlightedCandidates(
  rows: Array<{ score: number; b?: RectifyBaselineStat }>,
): number[] {
  const hasComparison = rows.some((r) => r.b !== undefined);
  if (hasComparison) {
    // Rank only candidates that actually meet the displayed cutoff. A larger
    // raw excess with a wider comparison distribution may fail that cutoff.
    const top = Math.max(...rows.map((r) => r.b?.verdict === "above" ? r.b.actual - r.b.mean : -Infinity));
    return rows.flatMap((r, i) =>
      r.b?.verdict === "above" && Math.abs(r.b.actual - r.b.mean - top) < 1e-9
        ? [i] : [],
    );
  }
  const top = Math.max(0, ...rows.map((r) => r.score));
  return rows.flatMap((r, i) => top > 0 && r.score === top ? [i] : []);
}

export const EVENT_METHODS: RectifyMethod[] = [
  "kp-events",
  "kp-transit",
  "kp-aurora",
  "kp-aurora-v2",
  "kp-qualified",
  "parashari-events-v4",
  "alp-marriage",
  "bnn-marriage",
  "jaimini-dasha",
];

/** What the Rectify tab is looking at, so a PDF export can rerun the same scan on the server. */
export interface RectifyExportState {
  method: RectifyMethod;
  windowMinutes: number;
  events: RectifyEvent[];
  includeComparisons?: boolean;
  judge?: JudgePlaceInput;
  /** The displayed scan's actual judgment instant, for reproducible export. */
  judgedAsOf?: string;
  /** Limbs the person confirmed a mark on (Brihat Jataka 5.24-26), for the marks method. */
  confirmedMarks: string[];
}
