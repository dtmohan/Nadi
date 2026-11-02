/**
 * Event validation: the chart as it stands, checked against the life events saved with it.
 *
 * For each dated event, three independent readings are taken at the event date and compared with what
 * the systems say should be running when such a thing happens:
 *
 * 1. KP (Astro Secrets & KP Part 1 pp. 167-172; Part 2 p. 203): the dasa, bhukti and antara lords must
 *    be significators of the matter's houses, the sub lord of the matter's cusp must promise it, and on
 *    the day the dasa and bhukti lords should transit the sign, star or sub of a significator.
 * 2. Jaimini (K.N. Rao): the chara dasha and antardasha running at the event should carry the matter's
 *    life area. Same test as the chara dasha rectification method, at the recorded time only.
 * 3. Nadi (R.G. Rao; Naik): Jupiter is the timer, Saturn the second hand. Six points per event: Jupiter over
 *    the matter's karaka (2; in trine or opposite, 1), Saturn touching a karaka (1), both touching the same
 *    karaka at once, the double transit (1), Jupiter's count from the natal Jeeva (or the Deha in a female
 *    chart) falling in the matter's signs (1), and Jupiter's passage bringing one of the chart's own
 *    combinations in that life area to life (1). Karakas resolve by gender: the spouse is Venus or Mars,
 *    the Deha is Jupiter or Venus.
 *
 * 4. Timing windows, read both ways: each event is checked against the windows the systems themselves
 *    name in advance — Nadi, Jupiter's passage over the matter's karaka or its count-signs from the Jeeva;
 *    KP, the conjoined period of the matter's significators at the dasa-bhukti level, the level the books'
 *    worked marriages are dated by (Part 3 pp. 25, 65), with the antara carried as a refinement and counted
 *    separately as the full three-level match. The report lists which past windows caught a recorded event,
 *    and the comparison baseline carries the same measures so common windows remain visible.
 *
 * The planet tally then turns the events round: for each planet, the houses it signifies decide what KP
 * expects of it (Part 1 pp. 17-19: a planet tied to 6, 8, 12 turns harmful in its periods, one tied to
 * 2, 3, 10, 11 turns favourable, whatever its natural character), and the outcomes of the events that
 * fell in its dasa, bhukti or antara show how it actually behaved.
 *
 * Nothing here is stored; the caller sends the chart, with its events, on each request.
 */
import { DateTime } from "luxon";
import { eventReadingAllowed } from "@shared/event-reading";
import { createCatalogueComparison } from "@shared/catalogue-comparison";
import { lifeAsOf, sensitiveGate } from "@shared/life-stage";
import { stagedObservation, summarizeParashariComparisons, type ParashariObservation } from "@shared/parashari-comparison";
import { parashariLegacyScore } from "@shared/parashari-score-aggregation";
import {
  norm360,
  PLANETS,
  SIGNS,
  type Planet,
  type PlanetPosition,
} from "@shared/astro";
import {
  kpNatalFrame,
  vimshottariLordsAt,
  vimshottariLordsAtMs,
  vimshottari,
  jointPeriods,
} from "@shared/kp";
import { normaliseParashariHouseMethod, normaliseSunriseDef, type InsertChart } from "@shared/schema";
import {
  bnnKarakasFor,
  effectiveOutcome,
  matterOf,
  sanitiseEvents,
  type ChartEvent,
} from "@shared/events";
import type {
  BaselineMeasure,
  BaselineStat,
  BnnContact,
  BnnFit,
  ChanceBaseline,
  EventValidation,
  Nature,
  PlanetTally,
  ValidationResult,
  WindowsReport,
  BnnWindowHit,
  BnnWindowRow,
  KpWindowHit,
  KpWindowRow,
} from "@shared/validate-types";
import { scoreWindows } from "@shared/kp-windows";
import { rolesFor } from "@shared/rules";
import type { Gender } from "@shared/marriage";
import { createKpEventScorer } from "@shared/kp-event-evidence";
import { kpLegacyTotals } from "@shared/kp-legacy-aggregation";
import { additionalSchoolEvents } from "./additional-school-events";
import { createAlpEventScorer } from "@shared/alp-event-evidence";
import { qualifiedEventScores, qualifiedComparable, qualifiedTotals, QUALIFIED_SCORE_KEYS, type QualifiedEventScores, type QualifiedScoreKey } from "@shared/qualified-event-scores";
import { dashaFitAt } from "@shared/jaimini-areas";
import { comparisonDate, eventInstant } from "./event-time";
import { prepareKpMatchedDates, summarizeKpMatched } from "./kp-matched-comparison";
import { summarizeAlpMatched } from "./alp-matched-comparison";
import { kpTransitEvidence } from "@shared/kp-transit-evidence";
import { auroraV2StageCounts, AURORA_V2_STAGES } from "@shared/kp-aurora-v2";
import { vargaTopicFor } from "@shared/parashari-varga-evidence";
import { manleyTopicFor } from "@shared/manley-evidence";
import { createParashariEventScorer } from "./parashari-event";
import { computeParashariNatal, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { createParashariNatalCatalogue } from "@shared/parashari-event-natal-rules";
import { functionalObservation } from "@shared/parashari-functional";
import { conditionalObservations } from "@shared/parashari-conditional";
import { natalOwnMarks } from "@shared/gochara";
import { moonTransitContext } from "@shared/transit-context";
import { createPlanetContext } from "@shared/planet-context";
import {
  birthInstant,
  julianDay,
  positionsAt,
  positionsLite,
  shadbalaBase,
  whenSolarEventAvailable,
  ascendantAt,
  cuspsAt,
  transitPeriods,
  type EphemerisOptions,
} from "./ephemeris";

const GOOD_HOUSES = [2, 3, 10, 11];
const EVIL_HOUSES = [6, 8, 12];

function natureOf(good: number, evil: number): Nature {
  if (good === 0 && evil === 0) return "unknown";
  if (good > evil) return "benefic";
  if (evil > good) return "malefic";
  return "mixed";
}

export function validateEvents(chart: InsertChart, asOf = DateTime.utc().toISO()!, options: { includeKpMatched?: boolean } = {}): ValidationResult {
  const events = sanitiseEvents(chart.events);
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
  const { utc: utc0 } = birthInstant(chart);
  const jd0 = julianDay(utc0);
  const birthIso = utc0.toISO()!;

  // KP frame at the recorded time.
  const positions = positionsAt(jd0, opts);
  const cuspLons = cuspsAt(jd0, chart.latitude, chart.longitude, opts);
  const kpContext = createPlanetContext(positions, { kind: "natal", instant: birthIso,
    latitude: chart.latitude, longitude: chart.longitude, timezone: zone, timeStandard: chart.timeStandard,
    ayanamsa: "kp", nodeType: opts.nodeType, houseMethod: "placidus", cusps: cuspLons, ascendant: cuspLons[0], division: "D1", precision: "full" });
  const { cusps, planets, significators: sigs } = kpNatalFrame(kpContext, cuspLons);
  const sig = new Map(sigs.map((s) => [s.planet, s.houses]));
  const scoreKp = createKpEventScorer(cusps, sigs, planets, {
    withhold: sensitiveGate(chart, birthIso, asOf).withheld,
    allowed: (matter) => eventReadingAllowed(matter, birthIso, asOf, chart),
  });
  // Strict significators, the ordered hierarchy of Astro Secrets Part 2 p. 151: planets in the
  // stars of a bhava's occupants are its strongest significators; the occupants count only when
  // no planet sits in their stars; then the planets in the stars of the owner; then the owner.
  // The loose A-D union kept above uses every level at once; this map keeps, for each house,
  // only the first level that supplies any significator.
  const cov = (lv: "A" | "B" | "C") => {
    const s = new Set<number>();
    for (const sg of sigs) for (const h of sg.levels[lv]) s.add(h);
    return s;
  };
  const covA = cov("A");
  const covB = cov("B");
  const covC = cov("C");
  const strictOf = (sg: (typeof sigs)[number]): number[] => {
    const keep = (hs: number[], lv: "B" | "C" | "D") =>
      hs.filter((h) =>
        lv === "B"
          ? !covA.has(h)
          : lv === "C"
            ? !covA.has(h) && !covB.has(h)
            : !covA.has(h) && !covB.has(h) && !covC.has(h),
      );
    return Array.from(
      new Set([
        ...sg.levels.A,
        ...keep(sg.levels.B, "B"),
        ...keep(sg.levels.C, "C"),
        ...keep(sg.levels.D, "D"),
      ]),
    ).sort((a, b) => a - b);
  };
  const sigStrict = new Map(sigs.map((sg) => [sg.planet, strictOf(sg)]));
  const kpBy = new Map(planets.map((p) => [p.planet, p]));
  const moon = planets.find((p) => p.planet === "Moon")!;

  // Jaimini and Nadi frames use the chart's own ayanamsa.
  const positionsJ = positionsAt(jd0, optsJ);
  const lagnaJ = norm360(
    ascendantAt(jd0, chart.latitude, chart.longitude, optsJ),
  );
  const natalContext = createPlanetContext(positionsJ, { kind: "natal", instant: birthIso,
    latitude: chart.latitude, longitude: chart.longitude, timezone: zone, timeStandard: chart.timeStandard,
    ayanamsa: optsJ.ayanamsa, nodeType: optsJ.nodeType, sunrise: chart.sunriseDef || "edge",
    houseMethod: chart.parashariHouseMethod || "rashi", ascendant: lagnaJ, division: "D1", precision: "full" });
  const natalMoonJ = positionsJ.find((p) => p.planet === "Moon")!;
  const ownMarks = natalOwnMarks(positionsJ, lagnaJ);
  const parashariNatal = computeParashariNatal(natalContext, lagnaJ, birthIso, lifeAsOf(chart, asOf),
    whenSolarEventAvailable(() => shadbalaBase(jd0, chart.latitude, chart.longitude, optsJ)), DEFAULT_ASPECT_FLOOR,
    sensitiveGate(chart, birthIso, asOf).withheld, normaliseParashariHouseMethod(chart.parashariHouseMethod));
  const ordinary = createParashariNatalCatalogue(parashariNatal,
    (matter) => eventReadingAllowed(matter, birthIso, asOf, chart));
  const scoreParashari = createParashariEventScorer(natalContext, lagnaJ, birthIso, zone, { natalCatalogue: ordinary });
  const school = additionalSchoolEvents(natalContext, chart, jd0, lagnaJ, birthIso, asOf, optsJ);
  const { jaimini, reading } = school;
  const scoreAlp = createAlpEventScorer(natalContext, lagnaJ, birthIso, chart, asOf,
    (matter) => eventReadingAllowed(matter, birthIso, asOf, chart));
  const natalJupiter = positionsJ.find((p) => p.planet === "Jupiter")!;
  const gender = (chart.gender as Gender) ?? "unspecified";
  const roles = rolesFor(gender);
  const natalDeha = positionsJ.find((p) => p.planet === roles.deha)!;
  const natalSign = new Map(positionsJ.map((p) => [p.planet, p.signIndex]));
  const CONTACT_POINTS: Record<BnnContact, number> = {
    over: 2,
    trine: 1,
    opposite: 1,
  };
  /** Best contact a transiting sign makes with any of the karakas: over beats trine beats opposite. */
  const contactOf = (
    signIndex: number,
    karakas: Planet[],
  ): { contact: BnnContact; planet: Planet } | null => {
    let best: { contact: BnnContact; planet: Planet } | null = null;
    for (const k of karakas) {
      const rel = ((natalSign.get(k)! - signIndex + 12) % 12) + 1;
      const c: BnnContact | null =
        rel === 1
          ? "over"
          : rel === 5 || rel === 9
            ? "trine"
            : rel === 7
              ? "opposite"
              : null;
      if (c && (!best || CONTACT_POINTS[c] > CONTACT_POINTS[best.contact]))
        best = { contact: c, planet: k };
    }
    return best;
  };

  // Timing windows, named in advance: for every matter among the events, the Jupiter passages that put
  // the matter in season by Nadi rules, and the KP conjoined periods. The day-level checks ask what was
  // running on the date; these ask whether the date fell inside a window the system would have named first.
  const transitsJ = transitPeriods("Jupiter", jd0, jd0 + 100 * 365.25, optsJ);
  const vim = vimshottari(moon.lon, birthIso, birthIso);
  const asOfMs = Date.now();
  interface Held<T> {
    hit: T;
    startMs: number;
    endMs: number;
  }
  const heldOf = <T extends { start: string; end: string }>(hit: T): Held<T> => ({
    hit,
    startMs: Date.parse(hit.start),
    endMs: Date.parse(hit.end),
  });
  const windowsByMatter = new Map<
    string,
    { bnn: Held<BnnWindowHit>[]; kp: Held<KpWindowHit>[]; kpStrict: Held<KpWindowHit>[] }
  >();
  for (const e of events) {
    const m = matterOf(e.matter);
    if (windowsByMatter.has(m.id)) continue;
    const karakas = bnnKarakasFor(m.bnn, roles);
    const bnn: Held<BnnWindowHit>[] = [];
    for (const t of transitsJ) {
      const contact = contactOf(t.signIndex, karakas);
      const fj = ((t.signIndex - natalJupiter.signIndex + 12) % 12) + 1;
      const fd =
        roles.deha !== roles.native
          ? ((t.signIndex - natalDeha.signIndex + 12) % 12) + 1
          : null;
      const count =
        m.bnn.fromJeeva.includes(fj) ||
        (fd !== null && m.bnn.fromJeeva.includes(fd));
      if (!contact && !count) continue;
      bnn.push(
        heldOf({
          sign: t.sign,
          start: t.start,
          end: t.end,
          contact: contact?.contact ?? null,
          karaka: contact?.planet ?? null,
          fromJeeva: fj,
          via: contact && count ? "both" : contact ? "contact" : "count",
        }),
      );
    }
    // Strict KP windows (Part 2 p. 151; Part 3 pp. 25 and 108 date the worked marriages by the
    // conjoined periods of the significators, antara included): the same dasa-bhukti spans,
    // qualified by the ordered hierarchy instead of the A-D union, and a significator counts
    // only when deposited in the sub of another significator of the matter (fruitful sub; the
    // book states it for the job houses 2-6-10-11, so its use here for every matter is
    // provisional). The antara refinement is kept the same way as above.
    const sigFruit = new Map<Planet, number[]>(
      planets.map((p) => {
        const hs = (sigStrict.get(p.planet) ?? []).filter((h) =>
          m.houses.includes(h),
        );
        if (!hs.length) return [p.planet, []];
        const subIn = (sigStrict.get(kpBy.get(p.planet)!.subLord) ?? []).filter(
          (h) => m.houses.includes(h),
        );
        return [p.planet, subIn.length ? hs : []];
      }),
    );
    const strictPeriods = jointPeriods(vim, sigFruit, m.houses, birthIso, birthIso, 120);
    const strictScored = scoreWindows(
      strictPeriods,
      m.houses,
      m.cusp,
      planets,
      cusps,
      sigs,
      sig,
    );
    const strictByPair = new Map<
      string,
      {
        best: (typeof strictScored)[number];
        full: { lord: Planet; start: string; end: string }[];
      }
    >();
    for (const w of strictScored) {
      const key = `${w.dasaLord}-${w.bhuktiLord}`;
      const g = strictByPair.get(key) ?? { best: w, full: [] };
      if (w.score > g.best.score) g.best = w;
      g.full.push({ lord: w.antaraLord, start: w.start, end: w.end });
      strictByPair.set(key, g);
    }
    const kpStrict: Held<KpWindowHit>[] = [];
    for (const b of vim.bhuktis) {
      const hd = sigFruit.get(b.dasaLord) ?? [];
      const hb = sigFruit.get(b.lord) ?? [];
      if (!hd.length || !hb.length) continue;
      if (b.end <= birthIso) continue;
      const g = strictByPair.get(`${b.dasaLord}-${b.lord}`);
      kpStrict.push(
        heldOf({
          dasaLord: b.dasaLord,
          bhuktiLord: b.lord,
          start: b.start < birthIso ? birthIso : b.start,
          end: b.end,
          fullAntaras: g?.full ?? [],
          verdict: g?.best.verdict ?? "weak",
          score: g?.best.score ?? 0,
          max: g?.best.max ?? 20,
        }),
      );
    }
    // KP windows: the conjoined period of the significators at the dasa-bhukti level — every bhukti
    // whose two lords both signify the matter's houses (Part 3 p. 15 gives each matter's houses) — the
    // level the books' worked marriages are dated by (Part 3 pp. 25, 65). The antara windows within are
    // carried as the refinement (Part 2 p. 26: within the conjoined period the event takes place when
    // the luminaries transit the sensitive positions); the books never require the antara lord itself
    // to be a significator, so the full three-level match is counted, not assumed. Method I grades
    // (Part 2 p. 24) are carried on the window, not used to set it aside: a graded period is still a period.
    const scored = scoreWindows(
      jointPeriods(vim, sig, m.houses, birthIso, birthIso, 120),
      m.houses,
      m.cusp,
      planets,
      cusps,
      sigs,
      sig,
    );
    const byPair = new Map<
      string,
      {
        best: (typeof scored)[number];
        full: { lord: Planet; start: string; end: string }[];
      }
    >();
    for (const w of scored) {
      const key = `${w.dasaLord}-${w.bhuktiLord}`;
      const g = byPair.get(key) ?? { best: w, full: [] };
      if (w.score > g.best.score) g.best = w;
      g.full.push({
        lord: w.antaraLord,
        start: w.start,
        end: w.end,
      });
      byPair.set(key, g);
    }
    const kp: Held<KpWindowHit>[] = [];
    for (const b of vim.bhuktis) {
      const hd = (sig.get(b.dasaLord) ?? []).filter((h) =>
        m.houses.includes(h),
      );
      const hb = (sig.get(b.lord) ?? []).filter((h) => m.houses.includes(h));
      if (!hd.length || !hb.length) continue;
      if (b.end <= birthIso) continue;
      const g = byPair.get(`${b.dasaLord}-${b.lord}`);
      kp.push(
        heldOf({
          dasaLord: b.dasaLord,
          bhuktiLord: b.lord,
          start: b.start < birthIso ? birthIso : b.start,
          end: b.end,
          fullAntaras: g?.full ?? [],
          verdict: g?.best.verdict ?? "weak",
          score: g?.best.score ?? 0,
          max: g?.best.max ?? 20,
        }),
      );
    }
    windowsByMatter.set(m.id, { bnn, kp, kpStrict });
  }

  const scoreEvent = (e: ChartEvent, date: string, includeEvidence = false): EventValidation => {
    const m = matterOf(e.matter);
    const evDt = eventInstant(date, e, zone);
    const evIso = evDt.toUTC().toISO()!;
    const evMs = evDt.toUTC().toMillis();
    const held = windowsByMatter.get(m.id);
    const bnnHit =
      held?.bnn.find((t) => t.startMs <= evMs && evMs < t.endMs)?.hit ?? null;
    const kpHeld =
      held?.kp.find((t) => t.startMs <= evMs && evMs < t.endMs) ?? null;
    const ksHeld =
      held?.kpStrict.find((t) => t.startMs <= evMs && evMs < t.endMs) ?? null;
    const houses = m.houses;
    const lords = vimshottariLordsAt(moon.lon, birthIso, evIso);
    const dayPositions = positionsLite(julianDay(evDt.toUTC()), opts);
    const checked = scoreKp(houses, m.cusp, lords, dayPositions, e.matter, includeEvidence);
    const { hits, score } = checked;
    const cuspSubLord = checked.cuspSubLord!;
    const promised = checked.promised!;
    const verdict =
      promised && hits[0] && hits[1]
        ? "confirmed"
        : score > 0
          ? "partial"
          : "missed";

    const fit = m.area ? dashaFitAt(jaimini, positionsJ, m.area, evIso) : null;

    const dayJ = positionsLite(julianDay(evDt.toUTC()), optsJ);
    const jup = dayJ.find((p) => p.planet === "Jupiter")!;
    const sat = dayJ.find((p) => p.planet === "Saturn")!;
    const inSign = (s: number) =>
      positionsJ.filter((p) => p.signIndex === s).map((p) => p.planet);
    const karakas = bnnKarakasFor(m.bnn, roles);
    const jContact = contactOf(jup.signIndex, karakas);
    const sContact = contactOf(sat.signIndex, karakas);
    // Double transit: both timers touch the same karaka (over, trine or opposite) on the day.
    const touches = (signIndex: number, k: Planet) =>
      [1, 5, 7, 9].includes(((natalSign.get(k)! - signIndex + 12) % 12) + 1);
    const double = karakas.some(
      (k) => touches(jup.signIndex, k) && touches(sat.signIndex, k),
    );
    const fromJeeva = ((jup.signIndex - natalJupiter.signIndex + 12) % 12) + 1;
    const fromDeha =
      roles.deha !== roles.native
        ? ((jup.signIndex - natalDeha.signIndex + 12) % 12) + 1
        : null;
    const progression =
      m.bnn.fromJeeva.includes(fromJeeva) ||
      (fromDeha !== null && m.bnn.fromJeeva.includes(fromDeha));
    // The chart's own combinations in the matter's area that this passage of Jupiter ripens: a finding whose
    // planets Jupiter stands with, trines or faces (the same 1-5-9-7 test the BNN transit reading uses).
    const combo =
      reading.findings
        .filter(
          (f) =>
            f.area === m.bnn.area &&
            f.planets.some((p) => touches(jup.signIndex, p)),
        )
        .sort((a, b) => b.score - a.score)[0] ?? null;
    const bnnScore =
      (jContact ? CONTACT_POINTS[jContact.contact] : 0) +
      (sContact ? 1 : 0) +
      (double ? 1 : 0) +
      (progression ? 1 : 0) +
      (combo ? 1 : 0);
    const bnn: BnnFit = {
      jupiterSign: SIGNS[jup.signIndex],
      saturnSign: SIGNS[sat.signIndex],
      conjunct: inSign(jup.signIndex),
      trine: [
        ...inSign((jup.signIndex + 4) % 12),
        ...inSign((jup.signIndex + 8) % 12),
      ],
      opposite: inSign((jup.signIndex + 6) % 12),
      fromJeeva,
      fromDeha,
      saturnOver: inSign(sat.signIndex),
      karakas,
      jupiter: jContact,
      saturn: sContact,
      double,
      progression,
      combination: combo ? combo.text : null,
      score: bnnScore,
      max: 6,
      verdict: bnnScore >= 4 ? "strong" : bnnScore >= 2 ? "some" : "quiet",
    };

    const kpHit = kpHeld
      ? { ...kpHeld.hit, antaraSignifies: hits[2] }
      : null;
    const ksHit = ksHeld
      ? {
          ...ksHeld.hit,
          antaraSignifies: ksHeld.hit.fullAntaras.some(
            (a) => Date.parse(a.start) <= evMs && evMs < Date.parse(a.end),
          ),
        }
      : null;

    // The same scorer receives the actual or sampled event instant and its own
    // transit sky. Descriptive KP evidence remains separately controlled.
    const parashari = scoreParashari({ label: m.label, matter: m.id, outcome: e.outcome, time: e.time, timezone: e.timezone }, date, evIso, dayJ);
    const additionalNatal = school.catalogue(e.matter);
    const alp = scoreAlp(e.matter, evIso);
    const qualifiedScores = qualifiedEventScores({ matter: e.matter, outcome: effectiveOutcome(e),
      custom: e.matter !== m.id, afterDeath: !!chart.deathDate && date > chart.deathDate,
      birthIso, eventIso: evIso, gender: chart.gender, natalPositions: positionsJ, sky: dayJ,
      kp: checked, divisional: parashari.divisional, ordinary: parashari.ordinary, additional: additionalNatal, alp });
    return {
      id: e.id,
      matter: m.id,
      label: m.label,
      date,
      time: e.time,
      timezone: e.timezone,
      age: Math.round(evDt.diff(utc0, "years").years * 10) / 10,
      outcome: effectiveOutcome(e),
      houses,
      cusp: m.cusp,
      // Descriptive only, computed for the exact event instant and the first sampled comparison set.
      moonTransit: includeEvidence ? moonTransitContext(natalMoonJ, Math.floor(lagnaJ / 30), dayJ, evIso, ownMarks,
        vimshottariLordsAt(natalMoonJ.lon, birthIso, evIso)[0]) : undefined,
      parashariVargas: parashari.varga,
      parashariOrdinary: parashari.ordinary,
      additionalNatal,
      alp,
      qualifiedScores,
      manley: parashari.manley,
      parashariHierarchy: parashari.hierarchy,
      parashariPromise: parashari.promise,
      parashariSpecific: parashari.specific,
      parashariDivisional: parashari.divisional,
      kp: {
        ...checked,
        dasa: lords[0],
        bhukti: lords[1],
        antara: lords[2],
        cuspSubLord,
        promised,
        transit: {
          ...checked.transit,
          evidence: includeEvidence ? kpTransitEvidence(dayPositions, planets, cuspLons, houses) : undefined,
        },
        max: 4,
        verdict,
      },
      jaimini: fit
        ? {
            ...fit,
            mdSignName: SIGNS[fit.mdSign],
            adSignName: SIGNS[fit.adSign],
          }
        : null,
      bnn,
      windows: { bnn: bnnHit, kp: kpHit, kpStrict: ksHit },
    };
  };
  const out: EventValidation[] = events.map((e) => scoreEvent(e, e.date, true));

  // The report the panel lists: past windows of the recorded matters, and the events that fell inside.
  // Use the same supplied or assumed instant as the event-level checks.
  const eventMs = new Map(
    out.map((e) => [
      e.id,
      eventInstant(e.date, e, zone).toMillis(),
    ]),
  );
  const bnnRows: BnnWindowRow[] = [];
  const kpRows: KpWindowRow[] = [];
  const ksRows: KpWindowRow[] = [];
  let bnnPast = 0;
  let kpPast = 0;
  let ksPast = 0;
  for (const [matterId, list] of Array.from(windowsByMatter)) {
    const m = matterOf(matterId);
    const evs = out.filter((e) => e.matter === matterId);
    const inside = (t: { startMs: number; endMs: number }) =>
      evs.filter((e) => {
        const ms = eventMs.get(e.id)!;
        return t.startMs <= ms && ms < t.endMs;
      });
    for (const t of list.bnn) {
      if (t.endMs > asOfMs) continue;
      bnnPast++;
      const caught = inside(t);
      if (caught.length)
        bnnRows.push({
          ...t.hit,
          matter: m.id,
          matterLabel: m.label,
          events: caught.map((e) => ({ id: e.id, label: e.label, date: e.date })),
        });
    }
    for (const t of list.kp) {
      if (t.endMs > asOfMs) continue;
      kpPast++;
      const caught = inside(t);
      if (caught.length)
        kpRows.push({
          ...t.hit,
          matter: m.id,
          matterLabel: m.label,
          events: caught.map((e) => ({
            id: e.id,
            label: e.label,
            date: e.date,
            note: e.windows.kp
              ? e.windows.kp.antaraSignifies
                ? "full joint period"
                : "antara not a significator"
              : undefined,
          })),
        });
    }
    for (const t of list.kpStrict) {
      if (t.endMs > asOfMs) continue;
      ksPast++;
      const caught = inside(t);
      if (caught.length)
        ksRows.push({
          ...t.hit,
          matter: m.id,
          matterLabel: m.label,
          events: caught.map((e) => ({
            id: e.id,
            label: e.label,
            date: e.date,
            note: e.windows.kpStrict
              ? e.windows.kpStrict.antaraSignifies
                ? "full joint period"
                : "antara not a significator"
              : undefined,
          })),
        });
    }
  }
  const windows: WindowsReport = {
    bnn: bnnRows.sort((a, b) => a.start.localeCompare(b.start)),
    kp: kpRows.sort((a, b) => a.start.localeCompare(b.start)),
    kpStrict: ksRows.sort((a, b) => a.start.localeCompare(b.start)),
    bnnCaught: out.filter((e) => e.windows.bnn).length,
    kpCaught: out.filter((e) => e.windows.kp).length,
    kpFull: out.filter((e) => e.windows.kp?.antaraSignifies).length,
    kpStrictCaught: out.filter((e) => e.windows.kpStrict).length,
    kpStrictFull: out.filter((e) => e.windows.kpStrict?.antaraSignifies).length,
    bnnPast,
    kpPast,
    kpStrictPast: ksPast,
    events: out.length,
  };

  // Chance baseline: the same matters scored at random dates drawn from the span the real events cover.
  // A score that random dates reach as often as the real ones did is not evidence for the birth time.
  const baseline = chanceBaseline(events, out, scoreEvent, zone);
  const matchedEvents = events.map((e) => {
    const m = matterOf(e.matter);
    return { ...e, houses: m.houses, cusp: m.cusp };
  });
  const matchedSelection = options.includeKpMatched === false ? undefined : prepareKpMatchedDates(matchedEvents, zone, chart.deathDate, asOf)(Date.parse(birthIso));
  const kpMatched = matchedSelection && summarizeKpMatched(matchedEvents, matchedSelection, birthIso, out.map((e) => e.kp), (e, at) => {
    const lords = vimshottariLordsAtMs(moon.lon, Date.parse(birthIso), at.ms);
    const sky = positionsLite(julianDay(DateTime.fromMillis(at.ms, { zone: "utc" })), opts);
    return scoreKp(e.houses, e.cusp, lords, sky, e.matter, false);
  });
  const alpMatched = matchedSelection && summarizeAlpMatched(matchedEvents, matchedSelection, out.map((e) => e.alp), scoreAlp);

  // Planet tally: what KP expects of each planet, against how its periods went.
  const weights = { dasa: 2, bhukti: 2, antara: 1 } as const;
  const tallies: PlanetTally[] = PLANETS.map((planet) => {
    const signifies = sig.get(planet) ?? [];
    const good = signifies.filter((h) => GOOD_HOUSES.includes(h));
    const evil = signifies.filter((h) => EVIL_HOUSES.includes(h));
    const ran: PlanetTally["ran"] = [];
    let fav = 0;
    let unf = 0;
    let mix = 0;
    for (const e of out) {
      for (const level of ["dasa", "bhukti", "antara"] as const) {
        if (e.kp[level] !== planet) continue;
        ran.push({
          eventId: e.id,
          label: e.label,
          date: e.date,
          level,
          outcome: e.outcome,
        });
        const w = weights[level];
        if (e.outcome === "favourable") fav += w;
        else if (e.outcome === "unfavourable") unf += w;
        else mix += w;
      }
    }
    const expected = natureOf(good.length, evil.length);
    // Through the cusps (Part 3 ch. 5 pp. 27-34; Part 2 ch. 7 pp. 53-54): the sub lord of a cusp is the
    // barometer of that house, and a period lord can give of a house only what that sub lord signifies.
    const deliversFor = (h: number) => sig.get(cusps[h - 1].subLord) ?? [];
    // Read literally (Part 3 ch. 5 p. 34): the planet delivers, for each house it signifies, the houses the
    // sub lord of that cusp signifies; its effective portfolio is the union of those deliveries.
    const delivered = Array.from(new Set(signifies.flatMap(deliversFor))).sort(
      (x, y) => x - y,
    );
    const goodKept = delivered.filter((h) => GOOD_HOUSES.includes(h));
    const evilKept = delivered.filter((h) => EVIL_HOUSES.includes(h));
    const expectedByCusp = natureOf(goodKept.length, evilKept.length);
    const observed: Nature = ran.length === 0 ? "unknown" : natureOf(fav, unf);
    const decided = (n: Nature) => n === "benefic" || n === "malefic";
    const agrees =
      decided(expected) && decided(observed) ? expected === observed : null;
    const agreesByCusp =
      decided(expectedByCusp) && decided(observed)
        ? expectedByCusp === observed
        : null;
    return {
      planet,
      signifies,
      good,
      evil,
      expected,
      goodKept,
      evilKept,
      expectedByCusp,
      ran,
      favourable: fav,
      unfavourable: unf,
      mixed: mix,
      observed,
      agrees,
      agreesByCusp,
    };
  });

  const lagnaLon = cuspLons[0];
  const withArea = out.filter((e) => e.jaimini);
  return {
    birthTime: chart.birthTime,
    lagna: { sign: SIGNS[Math.floor(lagnaLon / 30)], degree: lagnaLon % 30 },
    events: out,
    planets: tallies,
    windows,
    baseline,
    kpMatched,
    alpMatched,
    summary: {
      events: out.length,
      confirmed: out.filter((e) => e.kp.verdict === "confirmed").length,
      partial: out.filter((e) => e.kp.verdict === "partial").length,
      missed: out.filter((e) => e.kp.verdict === "missed").length,
      kpScore: kpLegacyTotals(out).score,
      kpMax: kpLegacyTotals(out).max,
      transitScore: out.reduce((s, e) => s + e.kp.transit.score, 0),
      transitMax: out.reduce((s, e) => s + e.kp.transit.max, 0),
      jaiminiScore: withArea.reduce((s, e) => s + (e.jaimini?.score ?? 0), 0),
      jaiminiMax: withArea.reduce((s, e) => s + (e.jaimini?.max ?? 0), 0),
      jaiminiEvents: withArea.length,
      bnnScore: out.reduce((s, e) => s + e.bnn.score, 0),
      bnnMax: out.reduce((s, e) => s + e.bnn.max, 0),
      bnnStrong: out.filter((e) => e.bnn.verdict === "strong").length,
      agree: tallies.filter((t) => t.agrees === true).length,
      conflict: tallies.filter((t) => t.agrees === false).length,
      agreeByCusp: tallies.filter((t) => t.agreesByCusp === true).length,
      conflictByCusp: tallies.filter((t) => t.agreesByCusp === false).length,
      diverted: out.reduce(
        (n, e) =>
          n + e.kp.hits.filter((h, i) => h && !e.kp.effective[i]).length,
        0,
      ),
    },
  };
}

/** Deterministic generator so the baseline is reproducible for a given chart (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared date-only seed so Rectify and Validate compare the same ordered events. */
export function comparisonSeed(dates: string[]): number {
  let value = 2166136261;
  for (const date of dates) {
    for (const ch of date) value = Math.imul(value ^ ch.charCodeAt(0), 16777619);
    value = Math.imul(value ^ 124, 16777619);
  }
  return value >>> 0;
}

const BASELINE_TRIALS = 200;

function chanceBaseline(
  events: ChartEvent[],
  real: EventValidation[],
  scoreEvent: (e: ChartEvent, date: string, includeEvidence?: boolean) => EventValidation,
  birthZone: string,
): ChanceBaseline | null {
  if (events.length < 2) return null;
  const days = events.map((e) =>
    DateTime.fromISO(e.date, { zone: "utc" }).toMillis(),
  );
  const lo = Math.min(...days);
  const hi = Math.max(...days);
  if (hi - lo < 365 * 86400000) return null; // too short a span to draw meaningful alternatives
  const rnd = seeded(comparisonSeed(events.map((e) => e.date)));
  const measures: Record<BaselineMeasure, (vs: EventValidation[]) => number> = {
    confirmed: (vs) => vs.filter((v) => v.kp.verdict === "confirmed").length,
    aurora: (vs) => vs.filter((v) => v.kp.aurora?.allSupported).length,
    auroraV2: (vs) => vs.filter((v) => v.kp.auroraV2?.allSupported).length,
    kp: (vs) => kpLegacyTotals(vs).score,
    transit: (vs) => vs.reduce((s, v) => s + v.kp.transit.score, 0),
    jaimini: (vs) => vs.reduce((s, v) => s + (v.jaimini?.score ?? 0), 0),
    bnn: (vs) => vs.reduce((s, v) => s + v.bnn.score, 0),
    bnnWindow: (vs) => vs.filter((v) => v.windows.bnn).length,
    kpWindow: (vs) => vs.filter((v) => v.windows.kp).length,
    kpFullWindow: (vs) =>
      vs.filter((v) => v.windows.kp?.antaraSignifies).length,
    kpStrictWindow: (vs) => vs.filter((v) => v.windows.kpStrict).length,
    kpStrictFullWindow: (vs) =>
      vs.filter((v) => v.windows.kpStrict?.antaraSignifies).length,
    luminary: (vs) =>
      vs.filter((v) => v.kp.transit.luminary.sun || v.kp.transit.luminary.moon)
        .length,
  };
  const keys = Object.keys(measures) as BaselineMeasure[];
  const samples: Record<BaselineMeasure, number[]> = {
    confirmed: [],
    aurora: [],
    auroraV2: [],
    kp: [],
    transit: [],
    jaimini: [],
    bnn: [],
    bnnWindow: [],
    kpWindow: [],
    kpFullWindow: [],
    kpStrictWindow: [],
    kpStrictFullWindow: [],
    luminary: [],
  };
  let example: ChanceBaseline["example"];
  let auroraExample: ChanceBaseline["auroraExample"];
  let auroraV2Example: ChanceBaseline["auroraV2Example"];
  let parashariExample: ChanceBaseline["parashariExample"];
  const observe = (v: EventValidation): ParashariObservation => ({
    v1: v.parashariPromise?.score, v2: v.parashariSpecific?.score, v3: v.parashariDivisional?.score,
    v1Details: parashariLegacyScore(v.parashariPromise), v2Details: parashariLegacyScore(v.parashariSpecific),
    v3Details: parashariLegacyScore(v.parashariDivisional),
    staged: stagedObservation(v.manley), hierarchy: v.parashariHierarchy?.passes, crossTiming: v.parashariHierarchy?.crossChart?.timing,
    functional: functionalObservation(v.manley, v.outcome),
    conditional: conditionalObservations(v.manley, v.outcome),
  });
  const parashariTrials: ParashariObservation[][] = [];
  const catalogueComparison = createCatalogueComparison(real);
  const actualStages = auroraV2StageCounts(real.map((v) => v.kp.auroraV2));
  const stageSamples = { cusps: [] as number[], major: [] as number[], sub: [] as number[], third: [] as number[] };
  const qualifiedActual = real.map((v) => v.qualifiedScores);
  const qualifiedSamples: Record<QualifiedScoreKey, number[]> = { kp: [], parashari: [], alp: [], bnn: [] };
  const qualifiedValid: Record<QualifiedScoreKey, boolean> = { kp: true, parashari: true, alp: true, bnn: true };
  for (let t = 0; t < BASELINE_TRIALS; t++) {
    const trial = events.map((e) =>
      scoreEvent(
        e,
        comparisonDate(rnd, lo, hi, e, birthZone),
        t === 0,
      ),
    );
    trial.forEach((v, i) => catalogueComparison.observe(i, v));
    if (t === 0) {
      example = trial.map((v) => ({ label: v.label, date: v.date, time: v.time, timezone: v.timezone,
        evidence: v.kp.transit.evidence ?? [], moonTransit: v.moonTransit, natalRules: v.kp.natalRules, parashariOrdinary: v.parashariOrdinary, additionalNatal: v.additionalNatal, alp: v.alp, qualifiedScores: v.qualifiedScores }));
      auroraExample = trial.map((v) => ({ label: v.label, date: v.date, time: v.time, timezone: v.timezone, evidence: v.kp.aurora }));
      auroraV2Example = trial.map((v) => ({ label: v.label, date: v.date, time: v.time, timezone: v.timezone, evidence: v.kp.auroraV2 }));
      parashariExample = trial.flatMap((v, i) => {
        const original = observe(real[i]);
        return original.v1 !== undefined || original.staged ? [{ label: v.label, date: v.date, time: v.time, timezone: v.timezone,
          promise: v.parashariPromise, specific: v.parashariSpecific, divisional: v.parashariDivisional, manley: v.manley,
          hierarchy: v.parashariHierarchy }] : [];
      });
    }
    parashariTrials.push(trial.map(observe));
    const sampled = trial.map((v) => v.qualifiedScores);
    for (const key of QUALIFIED_SCORE_KEYS) {
      if (!qualifiedComparable(qualifiedActual, sampled, key)) qualifiedValid[key] = false;
      qualifiedSamples[key].push(qualifiedTotals(sampled, key).score);
    }
    for (const k of keys) samples[k].push(measures[k](trial));
    const stages = auroraV2StageCounts(trial.map((v) => v.kp.auroraV2));
    for (const stage of AURORA_V2_STAGES) stageSamples[stage].push(stages[stage]);
  }
  const summarize = (xs: number[], actual: number): BaselineStat => {
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    const sd = Math.sqrt(
      xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length,
    );
    const below = xs.filter((x) => x < actual).length;
    const equal = xs.filter((x) => x === actual).length;
    // Mid-rank percentile: share of random trials the real score beats, ties counted half.
    const percentile = Math.round(((below + equal / 2) / xs.length) * 100);
    return {
      actual,
      mean: Math.round(mean * 10) / 10,
      sd: Math.round(sd * 10) / 10,
      percentile,
      verdict:
        percentile >= 95 ? "above" : percentile <= 5 ? "below" : "chance",
    };
  };
  const stat = (k: BaselineMeasure) => summarize(samples[k], measures[k](real));
  const qualified: Partial<Record<QualifiedScoreKey, BaselineStat>> = {};
  for (const key of QUALIFIED_SCORE_KEYS) {
    const total = qualifiedTotals(qualifiedActual, key);
    if (total.max && qualifiedValid[key]) qualified[key] = summarize(qualifiedSamples[key], total.score);
  }
  const parashari = summarizeParashariComparisons(real.map(observe), parashariTrials);
  return {
    trials: BASELINE_TRIALS,
    example,
    qualified,
    catalogueComparison: catalogueComparison.result(),
    auroraExample,
    auroraV2Example,
    parashari: Object.keys(parashari).length ? parashari : undefined,
    parashariExample: Object.keys(parashari).length ? parashariExample : undefined,
    span: [
      DateTime.fromMillis(lo, { zone: "utc" }).toISODate()!,
      DateTime.fromMillis(hi, { zone: "utc" }).toISODate()!,
    ],
    confirmed: stat("confirmed"),
    aurora: real.some((v) => v.kp.aurora) ? stat("aurora") : undefined,
    auroraV2: real.some((v) => v.kp.auroraV2) ? stat("auroraV2") : undefined,
    auroraV2Stages: actualStages.eligibleEvents ? {
      eligibleEvents: actualStages.eligibleEvents,
      cusps: summarize(stageSamples.cusps, actualStages.cusps),
      major: summarize(stageSamples.major, actualStages.major),
      sub: summarize(stageSamples.sub, actualStages.sub),
      third: summarize(stageSamples.third, actualStages.third),
    } : undefined,
    kp: stat("kp"),
    transit: stat("transit"),
    jaimini: stat("jaimini"),
    bnn: stat("bnn"),
    bnnWindow: stat("bnnWindow"),
    kpWindow: stat("kpWindow"),
    kpFullWindow: stat("kpFullWindow"),
    kpStrictWindow: stat("kpStrictWindow"),
    kpStrictFullWindow: stat("kpStrictFullWindow"),
    luminary: stat("luminary"),
  };
}
