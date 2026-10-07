// Rectification methods: one at a time, never blended; each cites its own source. Shared by the
// Rectify tab and the report module so both score an interval the same way.
import type {
  RectifyBaselineStat,
  RectifySegment,
  RectifyEvent,
  JudgePlaceInput,
} from "./rectify-types";
import { scoreMarks, type BodyMarksResult } from "./body-marks";

/** Rectification methods. One at a time, never blended; each cites its own source. */
export type RectifyMethod =
  | "kp-rp"
  | "kp-moon"
  | "kp-events"
  | "kp-transit"
  | "jaimini-dasha"
  | "bj-marks"
  | "kunda";
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
  {
    id: "kp-rp",
    system: "KP",
    label: "Ruling planets",
    plainLabel: "Planets ruling now",
    plainShort:
      "Krishnamurti holds that the planets ruling the sky at the moment you sit down to judge also rule the true rising degree: its sign ruler, star ruler and, most of all, its deciding planet should be among them. Rahu or Ketu can stand in for a planet whose sign or star they occupy; a planet moving backwards today is doubtful and its star ruler is admitted instead. Dutta's added test links the rising degree's sign, star and deciding planets, level by level, to the sign, star and deciding planets of the Moon ruling that same moment; all three levels linking is his mark of the correct time. Rerun on another day and trust the minutes that agree every time.",
    short:
      "At the true birth time the lagna's sign lord, star lord and sub lord agree with the ruling planets of the moment you sit down to judge; the sub lord is the decisive agreement. A node in a ruling planet's sign or star acts for it; a retrograde ruling planet is doubtful and its star lord is admitted in its place. Dutta's first testing adds a level-to-level link between those same three lagna lords and the sign, star and sub lords of the RP Moon: same planet, or one in the other's sign, star or sub, or through a third planet that rules the other at its star or sub level; all three levels linking confirms the time.",
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
      "For every event you remember with a date, the three planets whose periods were running that day should speak for the houses of that matter, and the house itself should be promised by its deciding planet. Minutes where the period planets fail an event are set aside.",
    short:
      "At each remembered event the dasa, bhukti and antara lords running that day must be significators of the houses of that matter, and the cusp of the matter must promise it through its sub lord. Intervals where the period lords fail an event are rejected.",
    source: "Astro Secrets & KP Part 1, pp. 167-172; Part 2, p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "kp-transit",
    system: "KP",
    label: "Transits",
    plainLabel: "Sky on the day",
    plainShort:
      "Two hints. The sub the Sun is passing through today points to the sub of the true rising degree (N. Nataraj). On the day of an event, the planets whose period and sub-period were running should be passing through the sign, star and sub of planets that speak for that matter; a candidate time whose planets fail this is doubtful.",
    short:
      "Two hints. The sub the Sun transits on the day you work points to the lagna sub (N. Nataraj). On the day of an event the dasa and bhukti lords transit the sign, star and sub of significators of the matter, so a candidate whose significators they fail is doubtful.",
    source: "Astro Secrets & KP Part 2, p. 192 and p. 203",
    needsJudge: false,
    needsEvents: true,
  },
  {
    id: "jaimini-dasha",
    system: "Jaimini",
    label: "Chara dasha",
    plainLabel: "Sign periods",
    plainShort:
      "K.N. Rao's check for a doubtful chart: run Jaimini's sign-based periods and ask whether the period and sub-period signs running on the day of an undisputed event carry that matter. The check is by rising sign, so every minute in one sign scores alike; widen the window to test the neighbouring signs.",
    short:
      "For a doubtful horoscope K.N. Rao runs the chara dasha and asks whether the mahadasha and antardasha signs running at indisputable events carry those matters: the area's karaka, pada or house counted from the dasha sign. The check is by rising sign, so every interval in one sign scores alike; widen the window to test the neighbouring signs.",
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
    label: "Kunda",
    plainLabel: "Kunda check",
    plainShort:
      "Prasna Marga's own check of the rising sign: the lagna in arc-minutes, times 81, with the multiples of 12 struck out, is read as a nakshatra from Aswini; when it is the birth star or its trines, the lagna reads accurate, otherwise it wants shifting.",
    short:
      "The lagna in arc-minutes, times the Kunda (81), with multiples of 12 expunged, read as a nakshatra counted from Aswini; if it is the birth star or its trines the lagna is accurate, otherwise add or subtract ten minutes per asterism (5.8-9).",
    source:
      "Prasna Marga 5.8-9 (B.V. Raman). The translation divides by 12, which reaches only the first twelve nakshatras; the classical division by 27 uses a different unit, so this is provisional.",
    needsJudge: false,
    needsEvents: false,
  },
];

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
  if (m === "bj-marks") {
    const r = marks?.table[s.drekkana];
    if (!r) return { score: 0, max: 0 };
    const sc = scoreMarks(r, marks!.confirmed);
    return { score: sc.score, max: sc.max };
  }
  if (m === "kunda") {
    const k = s.kunda;
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
    { score: s.sunHint.score, max: s.sunHint.max },
  );
}

/** The shuffled-date baseline of one interval under an event method, if the server computed one. */
export function baselineFor(
  s: RectifySegment,
  m: RectifyMethod,
): RectifyBaselineStat | undefined {
  if (m === "kp-events") return s.baseline?.kpEvents;
  if (m === "kp-transit") return s.baseline?.transit;
  if (m === "jaimini-dasha") return s.baseline?.jaimini;
  return undefined;
}

export const EVENT_METHODS: RectifyMethod[] = [
  "kp-events",
  "kp-transit",
  "jaimini-dasha",
];

/** What the Rectify tab is looking at, so a PDF export can rerun the same scan on the server. */
export interface RectifyExportState {
  method: RectifyMethod;
  windowMinutes: number;
  events: RectifyEvent[];
  judge?: JudgePlaceInput;
  /** Limbs the person confirmed a mark on (Brihat Jataka 5.24-26), for the marks method. */
  confirmedMarks: string[];
}
