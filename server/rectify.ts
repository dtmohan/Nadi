/**
 * KP birth time rectification.
 *
 * Two checks from the books, run over every sub-lord interval of the lagna inside a window
 * around the recorded time:
 *
 * 1. Ruling planets (Astro Secrets & KP Part 1 pp. 173-178; Part 3 ch. 30 pp. 160-163): the
 *    sign lord, star lord and sub lord of the lagna at the true birth time agree with the ruling
 *    planets at the moment the astrologer sits down to judge. The sub lord is the decisive
 *    agreement (Part 3 p. 163). A node in a ruling planet's sign or star acts for it, and a
 *    retrograde ruling planet is replaced by its star lord (Part 1 p. 174).
 * 2. Dated events (Part 1 pp. 167-172; Part 2 p. 203): at each event the dasa, bhukti and antara
 *    lords must be significators of the houses of that matter, and the cusp of the matter must
 *    promise it through its sub lord.
 * 3. Transits (Part 2 p. 192, N. Nataraj; Part 2 p. 203): the sub the Sun transits on the day one
 *    works points to the lagna sub; and on the day of an event the dasa and bhukti lords transit
 *    the sign, star and sub of significators of the matter.
 *
 * 4. Jaimini chara dasha (K.N. Rao, Predicting through Jaimini's Chara Dasa): the chara dasha and
 *    antardasha running at each event, for the lagna sign of the interval, must carry the matter's
 *    life area, using that candidate's birth instant and natal positions.
 * 5. Moon lords (M.P. Shanmugham, Part 2 pp. 80-82, "Birth time verification"): the lagna cusp sub
 *    lord at the true time tells the birth star, either being its lord, or through its own star lord,
 *    its sub, sub-sub or sookshma lord, or the chain of the planet it is in the sub of; failing the
 *    star it should at least tell the Moon sign. The very birth star is the stronger confirmation.
 *
 * Every check is computed for every interval; the client chooses which method to score by.
 *
 * Nothing here is stored; the caller sends the chart and the events with each request.
 */
import { displayLocal } from "@shared/time-basis";
import { comparisonSeed, seeded } from "./validate";
import type {
  RectifyBaselineStat,
  RectifySegmentBaseline,
  RectifySegmentStability,
} from "@shared/rectify-types";
import { DateTime } from "luxon";
import { eventReadingAllowed } from "@shared/event-reading";
import { createCatalogueComparison } from "@shared/catalogue-comparison";
import { lifeAsOf, sensitiveGate } from "@shared/life-stage";
import { normaliseParashariHouseMethod, normaliseSunriseDef } from "@shared/schema";
import { norm360, NAKSHATRAS, type Planet } from "@shared/astro";
import { zodiacQuarter } from "@shared/zodiac-quarter";
import { nashtaNakshatra } from "@shared/brihat-jataka";
import {
  kpPoint,
  houseOf,
  kpNatalFrame,
  vimshottariLordsAtMs,
  rulingPlanets,
  NODES_KP,
  type KpCusp,
  type KpPlanet,
  type RulingPlanets,
} from "@shared/kp";
import type {
  RectifyRequest,
  RectifyEventCheck,
  RectifySegment,
  RectifyResult,
  MoonLordsCheck,
  DuttaRpMoonCheck,
  KundaCheck,
  BjNashtaCheck,
} from "@shared/rectify-types";
export type {
  RectifyRequest,
  RectifyEvent,
  RectifyEventCheck,
  RectifySegment,
  RectifyResult,
  JudgePlaceInput,
} from "@shared/rectify-types";
import {
  birthInstant,
  julianDay,
  utcAtJulianDay,
  positionsAt,
  positionsLite,
  shadbalaBase,
  planetLonAt,
  ascendantAt,
  cuspsAt,
  judgementNow,
  type EphemerisOptions,
} from "./ephemeris";
import { SIGNS, SIGN_LORD } from "@shared/astro";
import { additionalSchoolEvents } from "./additional-school-events";
import { createAlpEventScorer } from "@shared/alp-event-evidence";
import { qualifiedEventScores, qualifiedComparable, qualifiedTotals, QUALIFIED_SCORE_KEYS, type QualifiedEventScores, type QualifiedScoreKey } from "@shared/qualified-event-scores";
import { EVENT_MATTERS } from "@shared/events";
import { dashaFitAt } from "@shared/jaimini-areas";
import { comparisonDate, eventInstant } from "./event-time";
import { kundaD81Check, scanKundaD81 } from "./kunda";
import { vargaSignAt, vargaTopicFor } from "@shared/parashari-varga-evidence";
import type { VargaKey } from "@shared/vargas";
import { manleyTopicFor } from "@shared/manley-evidence";
import { MANLEY_WINDOW_DIVISIONS, scanVargaWindows } from "./varga-windows";
import { summarizeParashariComparisons, type ParashariComparisonExample, type ParashariObservation } from "@shared/parashari-comparison";
import { createParashariEventScorer, parashariObservation } from "./parashari-event";
import { computeParashariNatal, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { createParashariNatalCatalogue } from "@shared/parashari-event-natal-rules";
import { createKpEventScorer } from "@shared/kp-event-evidence";
import { KP_EVENT_NATAL_RULES } from "@shared/kp-event-natal-rules";
import { KP_RULES } from "@shared/rules-kp";
import { nemaniRpMoonCheck } from "@shared/kp-nemani-rp";
import { createPlanetContext } from "@shared/planet-context";
import { auroraAscendantLinks, auroraMatter } from "@shared/kp-aurora";
import { auroraV2StageCounts, AURORA_V2_STAGES, type AuroraV2Evidence } from "@shared/kp-aurora-v2";
import {
  computeBodyMarks,
  limbTermsFor,
  type BodyMarksResult,
} from "@shared/body-marks";

const MAX_WINDOW = 720;

/**
 * Nadi's Dutta-inspired mixed-chart linkage: does
 * the lagna's lord X at the candidate time link to the RP Moon's lord Z at the moment of judgement?
 * Linkage is any of his five conditions: the same planet; X in the sub of Z or the reverse; X in the
 * star of Z or the reverse; X in the sign of Z or the reverse; or X in the star or sub of a third
 * planet that appears as Z's star or sub lord (judged now). Nodes own no sign, so the sign
 * conditions fall away for them by themselves.
 */
function duttaLink(
  X: Planet,
  Z: Planet,
  xChart: KpPlanet | undefined,
  zNow: ReturnType<typeof kpPoint> | undefined,
): { linked: boolean; via: string } {
  if (X === Z) return { linked: true, via: `${X} and ${Z} are the same planet` };
  if (!xChart || !zNow)
    return { linked: false, via: "a position is missing for the linkage test" };
  if (xChart.subLord === Z)
    return { linked: true, via: `${X} stands in the sub of ${Z}` };
  if (zNow.subLord === X)
    return {
      linked: true,
      via: `${Z}, judged now, stands in the sub of ${X}`,
    };
  if (xChart.starLord === Z)
    return { linked: true, via: `${X} stands in the star of ${Z}` };
  if (zNow.starLord === X)
    return {
      linked: true,
      via: `${Z}, judged now, stands in the star of ${X}`,
    };
  if (SIGN_LORD[xChart.signIndex] === Z)
    return { linked: true, via: `${X} stands in ${Z}'s sign` };
  if (SIGN_LORD[zNow.signIndex] === X)
    return { linked: true, via: `${Z}, judged now, stands in ${X}'s sign` };
  const third = [zNow.starLord, zNow.subLord].find(
    (T) => xChart.starLord === T || xChart.subLord === T,
  );
  if (third)
    return {
      linked: true,
      via: `${X} stands in the star or sub of ${third}, which rules ${Z} at its ${zNow.starLord === third ? "star" : "sub"} level, judged now`,
    };
  return { linked: false, via: "no linkage at any of the five conditions" };
}

/** Mixed-chart interpretation for one candidate interval; the RP Moon's lords are fixed. */
function duttaRpMoonCheck(
  lagna: KpCusp,
  planets: KpPlanet[],
  rpm: { signLord: Planet; starLord: Planet; subLord: Planet },
  now: { positions: ReturnType<typeof positionsAt> },
): DuttaRpMoonCheck {
  const xAt = (p: Planet) => planets.find((x) => x.planet === p);
  const zPt = (p: Planet) => {
    const pos = now.positions.find((x) => x.planet === p);
    return pos ? kpPoint(pos.lon) : undefined;
  };
  const sign = duttaLink(lagna.signLord, rpm.signLord, xAt(lagna.signLord), zPt(rpm.signLord));
  const star = duttaLink(lagna.starLord, rpm.starLord, xAt(lagna.starLord), zPt(rpm.starLord));
  const sub = duttaLink(lagna.subLord, rpm.subLord, xAt(lagna.subLord), zPt(rpm.subLord));
  return {
    moon: rpm,
    linked: { sign: sign.linked, star: star.linked, sub: sub.linked },
    via: { sign: sign.via, star: star.via, sub: sub.via },
    score:
      (sign.linked ? 1 : 0) + (star.linked ? 1 : 0) + (sub.linked ? 2 : 0),
    max: 4,
  };
}

function lagnaKey(lon: number): string {
  const p = kpPoint(lon);
  return `${p.signLord}|${p.starLord}|${p.subLord}`;
}

type Accepted = { planet: Planet; reason: string; weight: number };

/**
 * Ruling planets plus their agents. A node in a ruling planet's sign or star acts for it at full
 * weight (KP convention, Part 3 p. 162). A retrograde ruling planet (not a node) is doubtful and
 * counts at half weight, and its star lord is admitted at half weight in its place (Part 1 p. 174).
 */
function acceptedRuling(
  ruling: RulingPlanets,
  now: { positions: ReturnType<typeof positionsAt> },
): Accepted[] {
  const out = new Map<Planet, Accepted>();
  const primaries = ruling.planets
    .filter((r) => r.count > 0)
    .map((r) => r.planet);
  for (const p of primaries) {
    const roles = ruling.list
      .filter((l) => l.planet === p && !l.role.includes("sub"))
      .map((l) => l.role.toLowerCase())
      .join(", ");
    const pos = now.positions.find((x) => x.planet === p);
    const retro = Boolean(pos?.retrograde) && !NODES_KP.includes(p);
    out.set(p, {
      planet: p,
      reason: retro ? `${roles}; retrograde, doubtful` : roles,
      weight: retro ? 0.5 : 1,
    });
  }
  for (const r of ruling.planets)
    if (r.count === 0 && !out.has(r.planet))
      out.set(r.planet, {
        planet: r.planet,
        reason: "node in a ruling planet's sign",
        weight: 1,
      });
  for (const node of NODES_KP) {
    const np = now.positions.find((p) => p.planet === node);
    if (!np || out.has(node)) continue;
    const star = kpPoint(np.lon).starLord;
    if (primaries.includes(star))
      out.set(node, {
        planet: node,
        reason: `node in the star of ${star}`,
        weight: 1,
      });
  }
  for (const p of primaries) {
    const pos = now.positions.find((x) => x.planet === p);
    if (pos?.retrograde && !NODES_KP.includes(p)) {
      const star = kpPoint(pos.lon).starLord;
      if (!out.has(star))
        out.set(star, {
          planet: star,
          reason: `star lord of retrograde ${p}`,
          weight: 0.5,
        });
    }
  }
  return Array.from(out.values());
}

/**
 * Part 2 pp. 80-82: does the lagna sub lord tell the birth star (levels a-d of the book) or the Moon sign?
 * Level 4: the sub lord is the birth star lord. 3: the sub lord's own star lord is. 2: its sub, sub-sub or
 * sookshma lord is. 1: the planet whose sub the sub lord sits in carries it in its own star-to-sookshma chain.
 * The Moon sign counts one more when the sub lord owns it or stands in it. The score doubles the star level
 * before adding the sign, so the very birth star always outranks a Moon-sign link (the book's preference).
 */
function moonLordsCheck(
  lagna: KpCusp,
  moon: KpPlanet,
  planets: KpPlanet[],
): MoonLordsCheck {
  const P = lagna.subLord;
  const S = moon.starLord;
  const p = planets.find((x) => x.planet === P)!;
  const chain = {
    starLord: p.starLord,
    subLord: p.subLord,
    subSubLord: p.subSubLord,
    sookshmaLord: p.sookshmaLord,
  };
  let star: MoonLordsCheck["star"] = {
    level: 0,
    via: `${P} does not reach ${S}, the birth star lord`,
  };
  if (P === S)
    star = {
      level: 4,
      via: `${P} is itself the lord of the birth star ${moon.nakshatra}`,
    };
  else if (chain.starLord === S)
    star = {
      level: 3,
      via: `${P} is in the star of ${S}, the birth star lord`,
    };
  else if (chain.subLord === S)
    star = { level: 2, via: `${P} is in the sub of ${S}, the birth star lord` };
  else if (chain.subSubLord === S)
    star = {
      level: 2,
      via: `${P} is in the sub-sub of ${S}, the birth star lord`,
    };
  else if (chain.sookshmaLord === S)
    star = {
      level: 2,
      via: `${P} is in the sookshma of ${S}, the birth star lord`,
    };
  else {
    const q = planets.find((x) => x.planet === chain.subLord)!;
    const step =
      q.starLord === S
        ? "star"
        : q.subLord === S
          ? "sub"
          : q.subSubLord === S
            ? "sub-sub"
            : q.sookshmaLord === S
              ? "sookshma"
              : null;
    if (step)
      star = {
        level: 1,
        via: `${P} is in the sub of ${q.planet}, and ${q.planet} is in the ${step} of ${S}, the birth star lord`,
      };
  }
  const sign = {
    owns: P === moon.signLord,
    occupies: p.signIndex === moon.signIndex,
  };
  return {
    birthStar: moon.nakshatra,
    birthStarLord: S,
    moonSign: moon.sign,
    moonSignLord: moon.signLord,
    subLord: P,
    chain,
    star,
    sign,
    score: 2 * star.level + (sign.owns || sign.occupies ? 1 : 0),
    max: 9,
  };
}

/**
 * The Kunda check (Prasna Marga 5.8-9): the lagna in arc-minutes, times 81, multiples of 12
 * expunged, read as a nakshatra counted from Aswini. When it is the birth star or its trines the
 * lagna reads accurate. Raman's translation divides by 12, which reaches only the first twelve
 * nakshatras, so the method is provisional; the classical division by 27 needs a different unit.
 */
export function kundaCheck(lagnaLon: number, moonLon: number): KundaCheck {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const raw = ((lagnaLon * 60 * 81) % 12 + 12) % 12;
  const remainder = Math.floor(raw); // 0..11
  const kundaNakshatra = (remainder + 11) % 12; // 0 = Aswini ... 11 = Uttara Phalguni
  const birthStar = zodiacQuarter(moonLon).starIndex;
  const trine =
    kundaNakshatra === birthStar ||
    kundaNakshatra === (birthStar + 9) % 27 ||
    kundaNakshatra === (birthStar + 18) % 27;
  return {
    remainder,
    kundaNakshatra,
    birthStar,
    trine,
    via: trine
      ? `${NAKSHATRAS[kundaNakshatra]} matches the birth star ${NAKSHATRAS[birthStar]} or its trine at this sampled time`
      : `${NAKSHATRAS[kundaNakshatra]} does not match the birth star ${NAKSHATRAS[birthStar]} or its trines at this sampled time`,
    score: trine ? 1 : 0,
    max: 1,
  };
}

/** Brihat Jataka 26.9-10 Lost Horoscope check: the nakshatra read from the lagna and its planets. */
function bjNashtaCheck(
  lagnaLon: number,
  moonLon: number,
  positions: { planet: string; signIndex: number }[],
): BjNashtaCheck {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const signIdx = Math.floor(norm(lagnaLon) / 30);
  const inSign = positions
    .filter((p) => p.signIndex === signIdx)
    .map((p) => p.planet as Planet);
  const nakshatra = nashtaNakshatra(lagnaLon, inSign);
  const birthStar = zodiacQuarter(moonLon).starIndex;
  const trine =
    nakshatra === birthStar ||
    nakshatra === (birthStar + 9) % 27 ||
    nakshatra === (birthStar + 18) % 27;
  return {
    nakshatra,
    birthStar,
    trine,
    via: trine
      ? `${NAKSHATRAS[nakshatra]} is the birth star ${NAKSHATRAS[birthStar]} or its trine — the lagna reads plausible (26.9-10)`
      : `${NAKSHATRAS[nakshatra]} is not the birth star ${NAKSHATRAS[birthStar]} nor its trines — the lagna wants shifting (26.9-10)`,
    score: trine ? 1 : 0,
    max: 1,
  };
}

export function rectify(req: RectifyRequest): RectifyResult {
  req = { ...req, events: [...req.events].sort((a, b) => a.date.localeCompare(b.date)) };
  const { chart } = req;
  const windowMinutes = Math.min(
    MAX_WINDOW,
    Math.max(1, Math.round(req.windowMinutes || 30)),
  );
  const opts: EphemerisOptions = {
    ayanamsa: "kp",
    nodeType: chart.nodeType === "true" ? "true" : "mean",
  };
  const optsJ: EphemerisOptions = {
    ayanamsa: chart.ayanamsa || "lahiri",
    nodeType: opts.nodeType,
    sunrise: normaliseSunriseDef(chart.sunriseDef),
  };
  const zone = chart.timezone;
  const limbTerms = limbTermsFor(chart.gender);
  const birth = birthInstant(chart);
  // A whole-sign lagna does not make every candidate in that sign identical:
  // the candidate birth instant can move a dasha boundary. Compute each
  // candidate separately and share only identical body-mark results.
  const marksByKey = new Map<number, BodyMarksResult>();
  const marksByContent = new Map<string, number>();
  const utc0 = birth.utc;
  const jd0 = julianDay(utc0);
  const w = windowMinutes / 1440;
  const judge = req.judge ?? {
    latitude: chart.latitude,
    longitude: chart.longitude,
    timezone: zone,
    label: chart.place,
  };
  const now = judgementNow(
    judge.latitude,
    judge.longitude,
    judge.timezone,
    opts.nodeType,
    req.judgedAsOf,
  );
  const ruling = rulingPlanets(now);
  const accepted = acceptedRuling(ruling, now);
  const acceptedSet = new Map(accepted.map((a) => [a.planet, a]));
  const sunNowPos = now.positions.find((p) => p.planet === "Sun")!;
  const sunNowPt = kpPoint(sunNowPos.lon);
  const sunNow = {
    lon: sunNowPos.lon,
    signLord: sunNowPt.signLord,
    starLord: sunNowPt.starLord,
    subLord: sunNowPt.subLord,
  };

  // Both real and comparison dates use each event's supplied or assumed local time and zone.
  const eventUtc = req.events.map((e) => eventInstant(e.date, e, zone).toUTC());
  const eventInstants = eventUtc.map((instant) => instant.toISO()!);
  const eventMilliseconds = eventUtc.map((instant) => instant.toMillis());
  // The event sky is used only for transit longitudes; retrograde-entry walks
  // belong to natal interpretation and do not change these longitudes.
  const eventPositions = eventUtc.map((instant) => positionsLite(julianDay(instant), opts));
  const eventPositionsJ = eventUtc.map((instant) => positionsLite(julianDay(instant), optsJ));

  // Comparison trials: the same events at random dates within the span they cover, with the
  // planetary positions of each trial date computed once and shared by every interval.
  const evMillis = req.events
    .map((e) => DateTime.fromISO(e.date, { zone: "utc" }).toMillis())
    .filter((m) => Number.isFinite(m));
  const spanLo = Math.min(...evMillis);
  const spanHi = Math.max(...evMillis);
  const baselineOn =
    req.includeComparisons !== false && req.events.length >= 2 && spanHi - spanLo >= 365 * 86400000;
  const trials = baselineOn ? BASELINE_TRIALS : 0;
  const rnd = seeded(comparisonSeed(req.events.map((e) => e.date)));
  const trialDates: string[][] = [];
  const trialInstants: string[][] = [];
  const trialMilliseconds: number[][] = [];
  const trialPositions: (ReturnType<typeof positionsAt> | null)[][] = [];
  const trialPositionsJ: (ReturnType<typeof positionsLite> | null)[][] = [];
  for (let t = 0; t < trials; t++) {
    const dates = req.events.map((e) => comparisonDate(rnd, spanLo, spanHi, e, zone));
    const utc = dates.map((date, i) => eventInstant(date, req.events[i], zone).toUTC());
    trialDates.push(dates);
    trialInstants.push(utc.map((instant) => instant.toISO()!));
    trialMilliseconds.push(utc.map((instant) => instant.toMillis()));
    trialPositions.push(utc.map((instant) => positionsLite(julianDay(instant), opts)));
    // Parashari uses the chart's own ayanamsa, not the KP comparison sky.
    trialPositionsJ.push(utc.map((instant) => positionsLite(julianDay(instant), optsJ)));
  }

  // Split at changes that affect the event checks, not just the rising sub lord.
  // In particular, the matter cusp can change while the lagna sub stays the same.
  // Scores are still samples at the midpoint: finer planetary divisions and
  // comparison-date period boundaries can change between sampled instants.
  const step = 10 / 86400;
  const asc = (jd: number) =>
    ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const ascJ = (jd: number) =>
    norm360(ascendantAt(jd, chart.latitude, chart.longitude, optsJ));
  const matterCusps = Array.from(
    new Set(
      req.events
        .flatMap((e) => {
          const ids = new Set(KP_EVENT_NATAL_RULES.filter((r) => r.matter === e.matter).map((r) => r.id));
          const catalogueCusps = KP_RULES.filter((r) => ids.has(r.id)).flatMap((r) =>
            [r.cusp, r.when.otherCusp?.cusp, ...(r.when.everyCusps?.cusps ?? [])]);
          return [e.cusp, ...(e.matter ? auroraMatter(e.matter)?.cusps ?? [] : []), ...catalogueCusps];
        })
        .filter((c): c is number => !!c && c >= 1 && c <= 12),
    ),
  ).sort((a, b) => a - b);
  const hasAuroraEvents = req.events.some((e) => e.matter && auroraMatter(e.matter));
  const vargaEvents = req.events.map((event, i) => ({ event, i })).filter(({ event }) => vargaTopicFor(event.matter));
  const manleyEvents = req.events.map((event, i) => ({ event, i })).filter(({ event }) => manleyTopicFor(event.matter));
  const vargaKeys: VargaKey[] = Array.from(new Set([
    ...vargaEvents.map(({ event }) => vargaTopicFor(event.matter)!.division),
    ...manleyEvents.map(({ event }) => manleyTopicFor(event.matter)!.division),
    // V2 childbirth additionally checks the D9 sign of the fifth lord from Jupiter.
    ...(vargaEvents.some(({ event }) => event.matter === "child") ? ["D9" as const] : []),
  ]));
  const keyAt = (jd: number) => {
    const cusps = cuspsAt(jd, chart.latitude, chart.longitude, opts);
    const positions = positionsLite(jd, opts);
    const moon = positions.find((p) => p.planet === "Moon")!;
    const instantMs = utcAtJulianDay(jd).toMillis();
    const planetFrame = positions.map((p) => {
      const point = kpPoint(p.lon);
      return `${point.signIndex}:${point.starLord}:${point.subLord}:${hasAuroraEvents ? `${point.subSubLord}:` : ""}${houseOf(p.lon, cusps)}`;
    });
    // A Parashari cross-check is evaluated at each candidate midpoint. Split at
    // the relevant divisional sign and period changes so a KP interval does not
    // silently span different D1/D7/D9/D10 evidence.
    const chartAsc = ascJ(jd);
    const chartPositions = vargaKeys.length ? positionsLite(jd, optsJ) : [];
    const chartMoon = chartPositions.find((p) => p.planet === "Moon");
    const chartSun = chartPositions.find((p) => p.planet === "Sun");
    const vargaFrame = vargaKeys.flatMap((key) => [
      vargaSignAt(key, chartAsc),
      ...chartPositions.map((p) => vargaSignAt(key, p.lon)),
    ]);
    const chartLagna = Math.floor(chartAsc / 30);
    const marriageSaham = vargaEvents.some(({ event }) => event.matter === "marriage")
      ? Math.floor(norm360(
          chartPositions.find((p) => p.planet === SIGN_LORD[chartLagna])!.lon +
          chartPositions.find((p) => p.planet === SIGN_LORD[(chartLagna + 6) % 12])!.lon,
        ) / 30)
      : -1;
    return [
      lagnaKey(cusps[0]),
      Math.floor(chartAsc / 10),
      ...cusps.map((lon) => kpPoint(lon).signLord),
      ...(hasAuroraEvents ? cusps.map((lon) => {
        const p = kpPoint(lon);
        return `${p.starLord}:${p.subLord}`;
      }) : []),
      ...matterCusps.map((c) => kpPoint(cusps[c - 1]).subLord),
      ...planetFrame,
      ...eventMilliseconds.map((eventMs) =>
        vimshottariLordsAtMs(moon.lon, instantMs, eventMs).join(":"),
      ),
      ...chartPositions.map((p) => vargaSignAt("D1", p.lon)),
      ...(chartMoon && chartSun ? [norm360(chartMoon.lon - chartSun.lon) < 180 ? "waxing" : "waning"] : []),
      ...vargaFrame,
      marriageSaham,
      ...(chartMoon ? vargaEvents.map(({ i }) => vimshottariLordsAtMs(chartMoon.lon, instantMs, eventMilliseconds[i]).join(":")) : []),
      ...(chartMoon ? manleyEvents.map(({ i }) => vimshottariLordsAtMs(chartMoon.lon, instantMs, eventMilliseconds[i]).join(":")) : []),
    ].join("|");
  };
  const boundaries: number[] = [];
  // More than one input can change inside the same ten-second sampling step.
  // Find each distinguishable transition rather than keeping only the first.
  const findTransitions = (lo: number, hi: number, left: string, right: string) => {
    if (left === right) return;
    if (hi - lo <= 0.2 / 86400) {
      boundaries.push(hi);
      return;
    }
    const mid = (lo + hi) / 2;
    const middle = keyAt(mid);
    findTransitions(lo, mid, left, middle);
    findTransitions(mid, hi, middle, right);
  };
  let prevJd = jd0 - w;
  let prevKey = keyAt(prevJd);
  while (prevJd < jd0 + w) {
    const jd = Math.min(prevJd + step, jd0 + w);
    const key = keyAt(jd);
    findTransitions(prevJd, jd, prevKey, key);
    prevKey = key;
    prevJd = jd;
  }
  const edges = [jd0 - w, ...boundaries, jd0 + w];

  const roundedUtc = (jd: number) => utcAtJulianDay(jd).plus({ milliseconds: 500 }).startOf("second");
  const roundedJd = (jd: number) => julianDay(roundedUtc(jd));
  const local = (jd: number) =>
    displayLocal(
      roundedUtc(jd),
      birth.basis,
      birth.basis.displayZone,
    );
  const fmtT = (jd: number) => local(jd).toFormat("HH:mm:ss");

  // D81's boundaries move independently of KP's cusps. Scan it separately
  // in the chart's own ayanamsa rather than treating a KP midpoint as an
  // entire Kunda interval.
  const kundaD81 = scanKundaD81(
    jd0 - w,
    jd0 + w,
    ascJ,
    (jd) => planetLonAt("Moon", jd, optsJ).lon,
  ).map((s) => ({
    start: fmtT(s.start),
    end: fmtT(s.end),
    mid: fmtT(s.mid),
    midDate: local(s.mid).toISODate()!,
    startIso: local(s.start).toISO()!,
    endIso: local(s.end).toISO()!,
    check: s.check,
    given: jd0 >= s.start && jd0 < s.end,
    selectable: (() => {
      const rounded = roundedJd(s.mid);
      if (rounded < s.start || rounded >= s.end) return false;
      const atRounded = kundaD81Check(ascJ(rounded), planetLonAt("Moon", rounded, optsJ).lon);
      return atRounded.kundaNakshatra === s.check.kundaNakshatra && atRounded.birthStar === s.check.birthStar;
    })(),
  }));
  const mappedWindows = scanVargaWindows(jd0 - w, jd0 + w, ascJ);
  const vargaWindows = MANLEY_WINDOW_DIVISIONS.map((division) => ({
    division,
    windows: mappedWindows[division].map((s) => ({
      start: fmtT(s.start), end: fmtT(s.end),
      startIso: local(s.start).toISO()!, endIso: local(s.end).toISO()!,
      sign: s.sign, given: jd0 >= s.start && jd0 < s.end,
    })),
  }));

  const segments: RectifySegment[] = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    if (b <= a) continue;
    const rawMid = (a + b) / 2;
    const roundedMid = roundedJd(rawMid);
    const selectable = roundedMid >= a && roundedMid < b && keyAt(roundedMid) === keyAt(rawMid);
    // Calculate at the same whole-second time that can be displayed and saved.
    const mid = selectable ? roundedMid : rawMid;
    // KP candidate checks use position, speed and retrograde state, but not
    // whether a retrograde planet entered this sign by backing into it.
    const positions = positionsLite(mid, opts);
    const cuspLons = cuspsAt(mid, chart.latitude, chart.longitude, opts);
    const birthIso = utcAtJulianDay(mid).toUTC().toISO()!;
    const kpContext = createPlanetContext(positions, { kind: "natal", instant: birthIso,
      latitude: chart.latitude, longitude: chart.longitude, timezone: zone, timeStandard: chart.timeStandard,
      ayanamsa: "kp", nodeType: opts.nodeType, houseMethod: "placidus", cusps: cuspLons, ascendant: cuspLons[0], division: "D1", precision: "lite" });
    const { cusps, planets, significators: sigs } = kpNatalFrame(kpContext, cuspLons);
    const readingAsOf = DateTime.utc().toISO()!;
    const scoreKp = createKpEventScorer(cusps, sigs, planets, {
      withhold: sensitiveGate(chart, birthIso, readingAsOf).withheld,
      allowed: (matter) => eventReadingAllowed(matter, birthIso, readingAsOf, chart),
    });
    const lagna = cusps[0];
    const moon = planets.find((p) => p.planet === "Moon")!;
    const birthMs = Date.parse(birthIso);

    const lagnaJ = norm360(
      ascendantAt(mid, chart.latitude, chart.longitude, optsJ),
    );
    const moonJ = planetLonAt("Moon", mid, optsJ).lon;
    const jSign = Math.floor(lagnaJ / 30);
    const posJ = positionsAt(mid, optsJ);
    const natalContext = createPlanetContext(posJ, { kind: "natal", instant: birthIso,
      latitude: chart.latitude, longitude: chart.longitude, timezone: zone, timeStandard: chart.timeStandard,
      ayanamsa: optsJ.ayanamsa, nodeType: optsJ.nodeType, sunrise: chart.sunriseDef || "edge",
      houseMethod: chart.parashariHouseMethod || "rashi", ascendant: lagnaJ, division: "D1", precision: "full" });
    const parashariNatal = computeParashariNatal(natalContext, lagnaJ, birthIso, lifeAsOf(chart, readingAsOf),
      shadbalaBase(mid, chart.latitude, chart.longitude, optsJ), DEFAULT_ASPECT_FLOOR,
      sensitiveGate(chart, birthIso, readingAsOf).withheld, normaliseParashariHouseMethod(chart.parashariHouseMethod));
    const ordinary = createParashariNatalCatalogue(parashariNatal,
      (matter) => eventReadingAllowed(matter, birthIso, readingAsOf, chart));
    const scoreParashari = createParashariEventScorer(natalContext, lagnaJ, birthIso, zone, { natalCatalogue: ordinary });
    const parashariByEvent = req.events.map((e, ei) => scoreParashari(e, e.date, eventInstants[ei], eventPositionsJ[ei]));
    const parashariVargas = parashariByEvent.flatMap((p) => p.varga ? [p.varga] : []);
    const parashariOrdinary = parashariByEvent.map((p) => p.ordinary);
    const parashariPromise = parashariByEvent.flatMap((p) => p.promise ? [p.promise] : []);
    const parashariSpecific = parashariByEvent.flatMap((p) => p.specific ? [p.specific] : []);
    const parashariDivisional = parashariByEvent.flatMap((p) => p.divisional ? [p.divisional] : []);
    const manley = parashariByEvent.flatMap((p) => p.manley ? [p.manley] : []);
    const parashariHierarchy = parashariByEvent.map((p) => p.hierarchy ?? null);
    const school = additionalSchoolEvents(natalContext, chart, mid, lagnaJ, birthIso, readingAsOf, optsJ);
    const scoreAlp = createAlpEventScorer(natalContext, lagnaJ, birthIso, chart, readingAsOf,
      (matter) => eventReadingAllowed(matter, birthIso, readingAsOf, chart));
    const jai = { j: school.jaimini, positions: posJ };
    // The result is constant within a Chara maha/antar period for this
    // candidate and area. Cache only inside this candidate so another birth
    // time can never inherit its period boundaries or natal positions.
    const jaiPeriods = jai.j.charaDasha.periods.map((p) => ({
      start: Date.parse(p.start), end: Date.parse(p.end),
      antars: p.antardashas.map((a) => ({ start: Date.parse(a.start), end: Date.parse(a.end) })),
    }));
    const jaiFits = new Map<string, RectifyEventCheck["jaimini"]>();
    const dIdx = Math.floor(lagnaJ / 10);
    const markResult = computeBodyMarks(posJ, lagnaJ, undefined, limbTerms);
    const markSignature = JSON.stringify(markResult);
    let marksKey = marksByContent.get(markSignature);
    if (marksKey === undefined) {
      marksKey = marksByKey.size;
      marksByContent.set(markSignature, marksKey);
      marksByKey.set(marksKey, markResult);
    }

    const rpVia: RectifySegment["rp"]["via"] = {};
    const weightOf = (p: Planet, k: "sign" | "star" | "sub") => {
      const r = acceptedSet.get(p);
      if (r) rpVia[k] = r.reason;
      return r?.weight ?? 0;
    };
    const wSign = weightOf(lagna.signLord, "sign");
    const wStar = weightOf(lagna.starLord, "star");
    const wSub = weightOf(lagna.subLord, "sub");
    const rpScore = wSign + wStar + 2 * wSub;
    const rpm = ruling.moon;
    const dutta = duttaRpMoonCheck(
      lagna,
      planets,
      { signLord: rpm.signLord, starLord: rpm.starLord, subLord: rpm.subLord },
      now,
    );
    const nemani = nemaniRpMoonCheck(lagna, rpm, now.positions);
    const checkEvent = (
      e: RectifyRequest["events"][number],
      dateIso: string,
      evPositions: ReturnType<typeof positionsAt> | null,
      evIso: string,
      evMs: number,
      includeAuroraTransit = true,
    ): RectifyEventCheck => {
      const houses = e.houses.filter((h) => h >= 1 && h <= 12);
      const lords = vimshottariLordsAtMs(moon.lon, birthMs, evMs);
      const checked = scoreKp(houses, e.cusp, lords, evPositions ?? [], e.matter, includeAuroraTransit);
      let jaimini: RectifyEventCheck["jaimini"] = null;
      if (e.area) {
        const pi = jaiPeriods.findIndex((p) => p.start <= evMs && evMs < p.end);
        const ai = pi < 0 ? -1 : jaiPeriods[pi].antars.findIndex((a) => a.start <= evMs && evMs < a.end);
        const key = `${e.area}:${pi}:${ai}`;
        if (!jaiFits.has(key)) {
          jaiFits.set(key, dashaFitAt(jai.j, jai.positions, e.area, evIso));
        }
        jaimini = jaiFits.get(key) ?? null;
      }
      return {
        ...checked,
        additionalNatal: school.catalogue(e.matter),
        alp: scoreAlp(e.matter, evIso),
        label: e.label,
        date: dateIso,
        time: e.time,
        timezone: e.timezone,
        houses,
        dasa: lords[0],
        bhukti: lords[1],
        antara: lords[2],
        jaimini,
      };
    };
    const qualify = (e: RectifyRequest["events"][number], date: string, instant: string,
      sky: ReturnType<typeof positionsLite> | null, checked: RectifyEventCheck,
      parashari: typeof parashariByEvent[number] | undefined): QualifiedEventScores => {
      const known = EVENT_MATTERS.find((m) => m.id === e.matter);
      const outcome = e.outcome ?? (known?.nature === "good" ? "favourable" : known?.nature === "bad" ? "unfavourable" : "mixed");
      const custom = !known || e.cusp !== known.cusp || [...e.houses].sort((a,b) => a-b).join(",") !== [...known.houses].sort((a,b) => a-b).join(",");
      return qualifiedEventScores({ matter: e.matter, outcome, custom,
        afterDeath: !!chart.deathDate && date > chart.deathDate, birthIso, eventIso: instant,
        gender: chart.gender, natalPositions: posJ, sky: sky ?? [], kp: checked,
        divisional: parashari?.divisional, ordinary: parashari?.ordinary, additional: checked.additionalNatal, alp: checked.alp });
    };
    const events: RectifyEventCheck[] = req.events.map((e, ei) => {
      const checked = checkEvent(e, e.date, eventPositions[ei], eventInstants[ei], eventMilliseconds[ei]);
      checked.qualifiedScores = qualify(e, e.date, eventInstants[ei], eventPositionsJ[ei], checked, parashariByEvent[ei]);
      return checked;
    });

    // Baseline: the same interval scored at the selected random dates.
    let baseline: RectifySegmentBaseline | undefined;
    if (trials > 0) {
      const sums = {
        kpEvents: [] as number[],
        aurora: [] as number[],
        auroraV2: [] as number[],
        transit: [] as number[],
        jaimini: [] as number[],
      };
      const stageSamples = { cusps: [] as number[], major: [] as number[], sub: [] as number[], third: [] as number[] };
      const actualStages = auroraV2StageCounts(events.map((e) => e.auroraV2));
      const actualParashari = parashariByEvent.map((p, i) => parashariObservation(p, req.events[i].outcome));
      const catalogueComparison = createCatalogueComparison(events.map((e, i) => ({ ...e, parashariOrdinary: parashariByEvent[i].ordinary })));
      const parashariTrials: ParashariObservation[][] = [];
      let parashariExample: ParashariComparisonExample[] | undefined;
      let auroraExample: RectifySegmentBaseline["auroraExample"];
      let auroraV2Example: RectifySegmentBaseline["auroraV2Example"];
      let catalogueExample: RectifySegmentBaseline["catalogueExample"];
      const qualifiedActual = events.map((e) => e.qualifiedScores);
      const qualifiedSamples: Record<QualifiedScoreKey, number[]> = { kp: [], parashari: [], alp: [], bnn: [] };
      const qualifiedValid: Record<QualifiedScoreKey, boolean> = { kp: true, parashari: true, alp: true, bnn: true };
      for (let t = 0; t < trials; t++) {
        let k = 0, aurora = 0, auroraV2 = 0,
          tr = 0,
          ja = 0;
        const trialParashari: ParashariObservation[] = [];
        const trialAuroraV2: Array<AuroraV2Evidence | undefined> = [];
        const qualifiedTrial: QualifiedEventScores[] = [];
        if (t === 0) parashariExample = [];
        if (t === 0) auroraExample = [];
        if (t === 0) auroraV2Example = [];
        if (t === 0) catalogueExample = [];
        req.events.forEach((e, ei) => {
          const c = checkEvent(e, trialDates[t][ei], trialPositions[t][ei], trialInstants[t][ei], trialMilliseconds[t][ei], t === 0);
          if (t === 0) catalogueExample!.push({ label: e.label, date: trialDates[t][ei], natalRules: c.natalRules, additionalNatal: c.additionalNatal, alp: c.alp });
          if (t === 0) auroraExample!.push({ label: e.label, date: trialDates[t][ei], time: e.time,
            timezone: e.timezone, evidence: c.aurora });
          if (t === 0) auroraV2Example!.push({ label: e.label, date: trialDates[t][ei], time: e.time,
            timezone: e.timezone, evidence: c.auroraV2 });
          k += c.score;
          if (c.aurora?.allSupported) aurora++;
          if (c.auroraV2?.allSupported) auroraV2++;
          trialAuroraV2.push(c.auroraV2);
          tr += c.transit.score;
          ja += c.jaimini?.score ?? 0;
          const sky = trialPositionsJ[t][ei];
          let trialOrdinary: typeof parashariByEvent[number]["ordinary"];
          let trialParashariResult: typeof parashariByEvent[number] | undefined;
          if (sky) {
            const date = trialDates[t][ei];
            const p = scoreParashari(e, date, trialInstants[t][ei], sky);
            trialParashariResult = p;
            trialOrdinary = p.ordinary;
            if (t === 0) catalogueExample![ei].parashariOrdinary = p.ordinary;
            trialParashari.push(parashariObservation(p, e.outcome));
            if (t === 0 && (actualParashari[ei].v1 !== undefined || actualParashari[ei].staged)) parashariExample!.push({ label: e.label, date, time: e.time, timezone: e.timezone,
              promise: p.promise, specific: p.specific, divisional: p.divisional, manley: p.manley, hierarchy: p.hierarchy });
          } else trialParashari.push({});
          const qualified = qualify(e, trialDates[t][ei], trialInstants[t][ei], sky, c, trialParashariResult);
          qualifiedTrial.push(qualified);
          if (t === 0) catalogueExample![ei].qualifiedScores = qualified;
          catalogueComparison.observe(ei, { alp: c.alp, parashariOrdinary: trialOrdinary });
        });
        for (const key of QUALIFIED_SCORE_KEYS) {
          if (!qualifiedComparable(qualifiedActual, qualifiedTrial, key)) qualifiedValid[key] = false;
          qualifiedSamples[key].push(qualifiedTotals(qualifiedTrial, key).score);
        }
        parashariTrials.push(trialParashari);
        sums.kpEvents.push(k);
        sums.aurora.push(aurora);
        sums.auroraV2.push(auroraV2);
        const trialStages = auroraV2StageCounts(trialAuroraV2);
        for (const stage of AURORA_V2_STAGES) stageSamples[stage].push(trialStages[stage]);
        sums.transit.push(tr);
        sums.jaimini.push(ja);
      }
      const parashari = summarizeParashariComparisons(actualParashari, parashariTrials);
      const qualified: Partial<Record<QualifiedScoreKey, RectifyBaselineStat>> = {};
      for (const key of QUALIFIED_SCORE_KEYS) {
        const total = qualifiedTotals(qualifiedActual, key);
        if (total.max && qualifiedValid[key]) qualified[key] = baselineStat(qualifiedSamples[key], total.score);
      }
      baseline = {
        qualified,
        kpEvents: baselineStat(
          sums.kpEvents,
          events.reduce((a, e) => a + e.score, 0),
        ),
        aurora: events.some((e) => e.aurora)
          ? baselineStat(sums.aurora, events.filter((e) => e.aurora?.allSupported).length) : undefined,
        auroraV2: events.some((e) => e.auroraV2)
          ? baselineStat(sums.auroraV2, events.filter((e) => e.auroraV2?.allSupported).length) : undefined,
        auroraV2Stages: actualStages.eligibleEvents ? {
          eligibleEvents: actualStages.eligibleEvents,
          cusps: baselineStat(stageSamples.cusps, actualStages.cusps),
          major: baselineStat(stageSamples.major, actualStages.major),
          sub: baselineStat(stageSamples.sub, actualStages.sub),
          third: baselineStat(stageSamples.third, actualStages.third),
        } : undefined,
        auroraExample,
        auroraV2Example,
        catalogueExample,
        catalogueComparison: catalogueComparison.result(),
        transit: baselineStat(
          sums.transit,
          events.reduce((a, e) => a + e.transit.score, 0),
        ),
        jaimini: baselineStat(
          sums.jaimini,
          events.reduce((a, e) => a + (e.jaimini?.score ?? 0), 0),
        ),
        parashari: Object.keys(parashari).length ? parashari : undefined,
        parashariExample: Object.keys(parashari).length ? parashariExample : undefined,
      };
    }

    const evScore = events.reduce((s, e) => s + e.score, 0);
    const evMax = events.reduce((s, e) => s + e.max, 0);
    // Firmness of the twelve cusp sub lords across the interval: the same at both ends and the middle.
    const EPS = Math.min(0.2 / 86400, (b - a) / 4);
    const subsAt = (t: number) =>
      cuspsAt(t, chart.latitude, chart.longitude, opts).map(
        (lon) => kpPoint(lon).subLord,
      );
    const subsA = subsAt(a + EPS);
    const subsB = subsAt(b - EPS);
    const changing = cusps
      .map((c, k) =>
        subsA[k] === c.subLord && subsB[k] === c.subLord ? 0 : k + 1,
      )
      .filter(Boolean);
    const stability: RectifySegmentStability = {
      firm: 12 - changing.length,
      changing,
      seconds: Math.round((b - a) * 86400),
      matterCusps,
      matterFirm: matterCusps.length
        ? matterCusps.every((c) => !changing.includes(c))
        : undefined,
    };
    segments.push({
      stability,
      start: fmtT(a),
      end: fmtT(b),
      mid: fmtT(mid),
      midDate: local(mid).toISODate()!,
      startIso: local(a).toISO()!,
      endIso: local(b).toISO()!,
      selectable,
      lagnaFrom: norm360(asc(a + EPS)),
      lagnaTo: norm360(asc(b - EPS)),
      sign: lagna.sign,
      signLord: lagna.signLord,
      starLord: lagna.starLord,
      subLord: lagna.subLord,
      rp: {
        sign: wSign > 0,
        star: wStar > 0,
        sub: wSub > 0,
        score: rpScore,
        max: 4,
        via: rpVia,
      },
      cuspSubLords: cusps.map((c) => c.subLord),
      moon: { starLord: moon.starLord, subLord: moon.subLord },
      moonLords: moonLordsCheck(lagna, moon, planets),
      // These are Prasna Marga and Brihat Jataka methods, not KP: use the
      // chart's selected ayanamsa for their lagna and Moon.
      kunda: selectable ? kundaCheck(lagnaJ, moonJ) : undefined,
      kundaD81: kundaD81Check(lagnaJ, moonJ),
      bjNashta: bjNashtaCheck(lagnaJ, moonJ, positionsLite(mid, optsJ)),
      dutta,
      nemani,
      jaiminiSign: {
        index: jSign,
        name: SIGNS[jSign],
        direction: jai.j.charaDasha.direction,
      },
      candidate: selectable ? { birthUtc: birthIso, kpMoonLon: moon.lon, ascendantLon: lagnaJ, positions: posJ, kpPlanets: planets.map(({ planet, lon }) => ({ planet, lon })), kpCusps: cuspLons } : undefined,
      drekkana: dIdx,
      marksKey,
      sunHint: {
        star: lagna.starLord === sunNow.subLord,
        sub: lagna.subLord === sunNow.subLord,
        score:
          (lagna.starLord === sunNow.subLord ? 1 : 0) +
          (lagna.subLord === sunNow.subLord ? 2 : 0),
        max: 3,
      },
      events,
      auroraAscendant: auroraAscendantLinks(planets, cusps),
      parashariVargas,
      parashariOrdinary,
      parashariPromise,
      parashariSpecific,
      parashariDivisional,
      manley,
      parashariHierarchy,
      score: rpScore + evScore,
      max: 4 + evMax,
      given: jd0 >= a && jd0 < b,
      baseline,
    });
  }

  const top = Math.max(...segments.map((s) => s.score));
  const best = segments
    .map((s, i) => (s.score === top && top > 0 ? i : -1))
    .filter((i) => i >= 0);
  return {
    hierarchySelections: req.events,
    ruling,
    judgedAt: {
      label:
        judge.label ??
        `${judge.latitude.toFixed(2)}°, ${judge.longitude.toFixed(2)}°`,
      timezone: judge.timezone,
    },
    sunNow,
    accepted,
    windowMinutes,
    marks: Object.fromEntries(marksByKey),
    given: { time: local(jd0).toFormat("HH:mm:ss"), lagna: norm360(asc(jd0)) },
    segments,
    eventTransits: req.events.map((event, i) => ({
      date: event.date,
      positions: eventPositions[i].map(({ planet, lon }) => ({ planet, lon })),
      example: trials > 0 && trialPositions[0][i] ? {
        date: trialDates[0][i],
        time: event.time,
        timezone: event.timezone,
        positions: trialPositions[0][i]!.map(({ planet, lon }) => ({ planet, lon })),
      } : undefined,
    })),
    kundaD81,
    vargaWindows,
    best,
    baseline: baselineOn
      ? {
          trials,
          span: [
            DateTime.fromMillis(spanLo, { zone: "utc" }).toISODate()!,
            DateTime.fromMillis(spanHi, { zone: "utc" }).toISODate()!,
          ],
        }
      : null,
  };
}

const BASELINE_TRIALS = 200;

/** Mid-rank percentile of the real score among the random trials, ties counted half. */
function baselineStat(xs: number[], actual: number): RectifyBaselineStat {
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
  const below = xs.filter((x) => x < actual).length;
  const equal = xs.filter((x) => x === actual).length;
  const percentile = Math.round(((below + equal / 2) / xs.length) * 100);
  return {
    actual,
    mean: Math.round(mean * 10) / 10,
    sd: Math.round(sd * 10) / 10,
    percentile,
    verdict: percentile >= 95 ? "above" : percentile <= 5 ? "below" : "chance",
  };
}
