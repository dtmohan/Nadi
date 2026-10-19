// Periods by topic (provisional): the Vimshottari periods whose lords Parashara's chapter on the dasas of
// house lords speaks of for work, money, health and family, with each period's own lean.
//
// BPHS 48.2-8 (Santhanam, jyotishvidya.com ch. 48) says what the period of each house's lord brings: the
// 1st's physical well-being, the 4th's house and land, the 5th's learning and happiness from children, the
// 9th's learning, piety and unexpected gains of wealth, the 10th's recognition and awards from the government;
// the 6th's danger from enemies and ill health, the 7th's distress to the spouse, the 8th's financial losses,
// the 11th's obstacles to gains and disease, the 12th's distress and disease. 48.1 and 48.8 then judge the
// period by the lord's placement and dignity at birth and at the start of the period, which the period's
// lines already carry (parashari-dasa.ts). Filing each statement under a topic, keeping only the part of a
// statement that speaks to the topic, and calling a period favourable for a topic when the statement is
// favourable and the period's lines lean favourable are the app's conventions, so the section is provisional.
// The 2nd and 3rd lords' statements (distress, unfavourable effects) name no topic and are not filed; Rahu
// and Ketu rule no house, so 48.2-8 does not reach their periods.

import { DateTime } from "luxon";
import type { Planet } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { HOUSE_LORD_DASA, LEAN_CLAUSE, verdictOfLean, type DasaLean, type DasaSource, type Tone } from "./parashari-dasa";
import { AREA_ONSET, areaSeason } from "./life-stage";
import { listJoin, ordH, thePlanet } from "./house-gloss";

export type PeriodTopic = "career" | "wealth" | "health" | "family";

interface Statement {
  house: number;
  tone: "support" | "strain";
  /** The part of the 48.2-8 statement that speaks to the topic, close to the translation. */
  said: string;
  /** The same in plain words, worded as care where the verse is harsh. */
  saidPlain: string;
}

interface TopicDef {
  topic: PeriodTopic;
  label: string;
  labelPlain: string;
  /** The life area whose onset age holds the topic back for a minor (life-stage.ts); none for health. */
  area?: string;
  statements: Statement[];
}

export const PERIOD_TOPICS: TopicDef[] = [
  {
    topic: "career",
    label: "Career",
    labelPlain: "Work and standing",
    area: "career",
    statements: [
      { house: 10, tone: "support", said: "recognition from and awards by the government", saidPlain: "recognition and honours from those in authority" },
    ],
  },
  {
    topic: "wealth",
    label: "Wealth",
    labelPlain: "Money and property",
    area: "wealth",
    statements: [
      { house: 9, tone: "support", said: "unexpected gains of wealth", saidPlain: "unexpected gains" },
      { house: 4, tone: "support", said: "acquisition of house and land", saidPlain: "a home or land of your own" },
      { house: 11, tone: "strain", said: "obstacles in gains of wealth", saidPlain: "gains that come more slowly" },
      { house: 8, tone: "strain", said: "financial losses", saidPlain: "a need for care with money" },
    ],
  },
  {
    topic: "health",
    label: "Health",
    labelPlain: "Health",
    statements: [
      { house: 1, tone: "support", said: "physical well-being", saidPlain: "physical well-being" },
      { house: 6, tone: "strain", said: "danger from enemies and ill health", saidPlain: "a need to look after your health and steer clear of disputes" },
      { house: 11, tone: "strain", said: "the possibility of diseases", saidPlain: "a need to look after your health" },
      { house: 12, tone: "strain", said: "distress and danger from diseases", saidPlain: "a need to look after your health" },
    ],
  },
  {
    topic: "family",
    label: "Family",
    labelPlain: "Family",
    area: "marriage",
    statements: [
      { house: 5, tone: "support", said: "progress in education and happiness from the children", saidPlain: "happiness through children and progress in learning" },
      { house: 7, tone: "strain", said: "distress to the spouse", saidPlain: "a need for care with your spouse's well-being" },
    ],
  },
];

export const TOPIC_PERIODS_NOTE =
  "48.2-8 gives the period of each house's lord its result; 48.1 and 48.8 judge it by the lord's placement at birth and at the start of the period. Each statement is filed under the topic it speaks to, keeping only that part of it, and set beside the dasa's lean from its lines (28.1, 28.11-12). Favourable for the topic: the statement favourable and the dasa leaning favourable; adverse: both against; otherwise mixed. The filing and the test are the app's (provisional). Rahu and Ketu rule no house, so their periods are not filed; the 2nd and 3rd lords' statements name no topic.";

export const TOPIC_PERIODS_NOTE_PLAIN =
  "Parashara says what the period of each house's ruler brings: the ruler of your 10th brings recognition, of your 9th unexpected gains, of your 1st well-being, and so on. He then judges the period by where its planet stands. This list files his statements under four topics and sets each beside how the period's lines weigh up overall. A period is marked favourable for a topic when both point the same good way. The filing and that test are the app's, so treat the list as provisional. Rahu and Ketu rule no house, so their periods are not listed here.";

export interface TopicPeriod {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  /** The topic's houses this lord rules, in the topic's order. */
  houses: number[];
  /** support or strain when every statement filed for this lord agrees, else mixed. */
  statementTone: Tone;
  lean: DasaLean;
  /** The statement and the lean together: support when both favour, strain when both go against, else mixed. */
  tone: Tone;
  text: string;
  textPlain: string;
  sources: DasaSource[];
}

export interface TopicPeriods {
  topic: PeriodTopic;
  label: string;
  labelPlain: string;
  /** Set for a minor while the topic is out of season: the topic is held back, not read. */
  held?: string;
  periods: TopicPeriod[];
  summary: string;
  summaryPlain: string;
}

interface DasaLike {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  lean: DasaLean;
}

export interface TopicPeriodsInput {
  bhavas: { house: number; lord: Planet }[];
  dasaReadings: DasaLike[];
}

export interface TopicPeriodsOptions {
  birthIso: string;
  /** "Now": today for the living, the date of death for the deceased. */
  asOfIso: string;
  deceased: boolean;
  /** How many periods after the running one to read (default 3). */
  ahead?: number;
}

const WORD: Record<Tone, string> = { support: "favourable", strain: "adverse", mixed: "mixed" };
const WORD_PLAIN: Record<Tone, string> = { support: "favourable", strain: "needs care", mixed: "mixed" };
const yearOf = (iso: string) => DateTime.fromISO(iso).toUTC().year;
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/**
 * The periods to read: for the living, the running one and the next few, begun before 90; for the deceased,
 * every period of the life.
 */
function periodsToRead(dasas: DasaLike[], o: TopicPeriodsOptions): DasaLike[] {
  if (o.deceased) return dasas.filter((d) => d.start < o.asOfIso);
  const i = dasas.findIndex((d) => d.end > o.asOfIso);
  if (i < 0) return [];
  return dasas.slice(i, i + 1 + (o.ahead ?? 3)).filter((d) => d.ageStart < 90);
}

export function topicPeriods(par: TopicPeriodsInput, o: TopicPeriodsOptions): TopicPeriods[] {
  const rules = (p: Planet) => par.bhavas.filter((b) => b.lord === p).map((b) => b.house);
  const dasas = periodsToRead(par.dasaReadings, o);
  return PERIOD_TOPICS.map((t): TopicPeriods => {
    if (t.area && !areaSeason(t.area, o.birthIso, o.asOfIso).inSeason) {
      const held = `Held for later: read from age ${AREA_ONSET[t.area]}.`;
      return { topic: t.topic, label: t.label, labelPlain: t.labelPlain, held, periods: [], summary: held, summaryPlain: held };
    }
    const periods: TopicPeriod[] = [];
    for (const d of dasas) {
      const owned = rules(d.lord);
      const st = t.statements.filter((s) => owned.includes(s.house)).sort((a, b) => a.house - b.house);
      if (!st.length) continue;
      const statementTone: Tone = st.every((s) => s.tone === "support") ? "support" : st.every((s) => s.tone === "strain") ? "strain" : "mixed";
      const leanTone = verdictOfLean(d.lean);
      const tone: Tone = statementTone === "support" && leanTone === "support" ? "support" : statementTone === "strain" && leanTone === "strain" ? "strain" : "mixed";
      const verse = (h: number) => HOUSE_LORD_DASA[h - 1].verse;
      const P = thePlanet(d.lord);
      const Pc = cap(P);
      const ages = `${Math.floor(d.ageStart)}-${Math.floor(d.ageEnd)}`;
      const running = d.current && !o.deceased;
      const houses = st.map((s) => s.house);
      // Practitioner: the lordship, the verse's words for the topic, and the dasa's lean with its counts.
      const text = `${d.lord} dasa, ${DateTime.fromISO(d.start).toUTC().toFormat("LLL yyyy")} to ${DateTime.fromISO(d.end).toUTC().toFormat("LLL yyyy")} (ages ${ages})${running ? ", running" : ""}: lord of the ${listJoin(houses.map(ordH))}; ${listJoin(st.map((s) => `48.${verse(s.house)} reads ${s.said}`))}. ${d.lean.favour || d.lean.against ? `The dasa ${LEAN_CLAUSE[d.lean.step]} (${d.lean.favour} favourable, ${d.lean.against} trying)` : "The dasa's lines take no side"}${
        statementTone === "strain" && leanTone === "support"
          ? "; 48.1 and 48.8 let a well-placed lord turn the result"
          : statementTone === "support" && leanTone === "strain"
            ? "; 48.1 and 48.8 let an ill-placed lord spoil the result"
            : ""
      }.`;
      // Plain: who rules what, Parashara's reading for the topic worded as care where it is harsh, and the balance.
      const sup = st.filter((s) => s.tone === "support").map((s) => s.saidPlain);
      const str = Array.from(new Set(st.filter((s) => s.tone === "strain").map((s) => s.saidPlain)));
      const reads = sup.length
        ? `Parashara reads ${listJoin(sup)} in its period${str.length ? `, and also ${listJoin(str)}` : ""}`
        : `Parashara reads ${listJoin(str)} in its period`;
      const balance =
        leanTone === "support"
          ? `On balance the period ${LEAN_CLAUSE[d.lean.step]}${statementTone === "strain" ? ", which softens this" : ""}.`
          : leanTone === "strain"
            ? `On balance the period ${LEAN_CLAUSE[d.lean.step]}${statementTone === "support" ? ", which weakens this" : ""}.`
            : "On balance the period is evenly weighted.";
      const textPlain = `${Pc}'s period, ${DateTime.fromISO(d.start).toUTC().toFormat("LLLL yyyy")} to ${DateTime.fromISO(d.end).toUTC().toFormat("LLLL yyyy")} (ages ${Math.floor(d.ageStart)} to ${Math.floor(d.ageEnd)})${running ? ", running now" : ""}: ${P} rules your ${listJoin(houses.map(ordH))} house${houses.length > 1 ? "s" : ""}, and ${reads}. ${balance}`;
      const sources: DasaSource[] = Array.from(new Set(st.map((s) => verse(s.house)))).map((v) => ({ label: `Parashara 48.${v}`, url: BPHS_URL(48), provisional: true }));
      periods.push({ lord: d.lord, start: d.start, end: d.end, ageStart: d.ageStart, ageEnd: d.ageEnd, current: running, houses, statementTone, lean: d.lean, tone, text, textPlain, sources });
    }
    const span = (p: TopicPeriod) => `${yearOf(p.start)}-${yearOf(p.end)}`;
    const spanPlain = (p: TopicPeriod) => `${yearOf(p.start)} to ${yearOf(p.end)}`;
    // None in range: name the rulers whose favourable statements the topic waits on, and when their periods fall.
    const lordOf = (h: number) => par.bhavas.find((b) => b.house === h)!.lord;
    const elsewhere = Array.from(
      new Map(
        t.statements
          .filter((x) => x.tone === "support")
          .map((x) => [lordOf(x.house), x.house] as const)
          .filter(([lord]) => lord !== "Rahu" && lord !== "Ketu"),
      ),
    ).flatMap(([lord, house]) => {
      const d = par.dasaReadings.find((x) => x.lord === lord);
      return d ? [{ lord, house, d }] : [];
    });
    const none = o.deceased
      ? "No period of the life belongs to a ruler Parashara speaks of for this."
      : elsewhere.length
        ? `${listJoin(elsewhere.map((x) => `the ${ordH(x.house)} lord's dasa (${x.d.lord}, ${yearOf(x.d.start)}-${yearOf(x.d.end)})`))} ${elsewhere.length === 1 ? "falls" : "fall"} outside the periods read here.`
        : "No period in the years read here belongs to a ruler Parashara speaks of for this.";
    const nonePlain = o.deceased || !elsewhere.length
      ? none
      : `Parashara's good word for this belongs to the period of ${listJoin(elsewhere.map((x) => `${thePlanet(x.lord)}, ruler of your ${ordH(x.house)} house (${yearOf(x.d.start)} to ${yearOf(x.d.end)})`))}, outside the years read here.`;
    return {
      topic: t.topic,
      label: t.label,
      labelPlain: t.labelPlain,
      periods,
      summary: periods.length ? periods.map((p) => `${p.lord} ${span(p)}: ${WORD[p.tone]}`).join("; ") : cap(none),
      summaryPlain: periods.length
        ? cap(`${periods.map((p) => `${thePlanet(p.lord)}'s period, ${spanPlain(p)}: ${WORD_PLAIN[p.tone]}`).join("; ")}.`)
        : nonePlain,
    };
  });
}
