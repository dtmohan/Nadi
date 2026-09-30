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
 *    KP, the conjoined period whose dasa, bhukti and antara lords all signify the matter (Method I, Part 2
 *    p. 24, weak windows set aside) — and the report lists which past windows caught a recorded event. The
 *    chance baseline carries the same measure, so a window that real events fall in no more often than
 *    random dates is reported as chance, not as a hit.
 *
 * The planet tally then turns the events round: for each planet, the houses it signifies decide what KP
 * expects of it (Part 1 pp. 17-19: a planet tied to 6, 8, 12 turns harmful in its periods, one tied to
 * 2, 3, 10, 11 turns favourable, whatever its natural character), and the outcomes of the events that
 * fell in its dasa, bhukti or antara show how it actually behaved.
 *
 * Nothing here is stored; the caller sends the chart, with its events, on each request.
 */
import { DateTime } from "luxon";
import {
  norm360,
  PLANETS,
  SIGNS,
  type Planet,
  type PlanetPosition,
} from "@shared/astro";
import {
  kpPoint,
  houseOf,
  computeSignificators,
  vimshottariLordsAt,
  vimshottari,
  jointPeriods,
  NODES_KP,
  type KpCusp,
  type KpPlanet,
} from "@shared/kp";
import type { InsertChart } from "@shared/schema";
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
  CuspFilter,
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
import { evaluate, rolesFor } from "@shared/rules";
import type { Gender } from "@shared/marriage";
import type { TransitCheck } from "@shared/rectify-types";
import { computeJaimini } from "@shared/jaimini";
import { dashaFitAt } from "@shared/jaimini-areas";
import {
  birthInstant,
  julianDay,
  positionsAt,
  positionsLite,
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

export function validateEvents(chart: InsertChart): ValidationResult {
  const events = sanitiseEvents(chart.events);
  const opts: EphemerisOptions = {
    ayanamsa: "kp",
    nodeType: chart.nodeType === "true" ? "true" : "mean",
  };
  const optsJ: EphemerisOptions = {
    ayanamsa: chart.ayanamsa || "lahiri",
    nodeType: opts.nodeType,
  };
  const zone = chart.timezone;
  const { utc: utc0 } = birthInstant(chart);
  const jd0 = julianDay(utc0);
  const birthIso = utc0.toISO()!;

  // KP frame at the recorded time.
  const positions = positionsAt(jd0, opts);
  const cuspLons = cuspsAt(jd0, chart.latitude, chart.longitude, opts);
  const cusps: KpCusp[] = cuspLons.map((lon, k) => ({
    ...kpPoint(lon),
    house: k + 1,
  }));
  const owners = cusps.map((c) => c.signLord);
  const planets: KpPlanet[] = positions.map((p) => ({
    ...kpPoint(p.lon),
    planet: p.planet,
    retrograde: p.retrograde,
    house: houseOf(p.lon, cuspLons),
    owns: NODES_KP.includes(p.planet)
      ? []
      : owners.map((o, k) => (o === p.planet ? k + 1 : 0)).filter(Boolean),
  }));
  const sigs = computeSignificators(planets);
  const sig = new Map(sigs.map((s) => [s.planet, s.houses]));
  const moon = planets.find((p) => p.planet === "Moon")!;

  // Jaimini and Nadi frames use the chart's own ayanamsa.
  const positionsJ = positionsAt(jd0, optsJ);
  const lagnaJ = norm360(
    ascendantAt(jd0, chart.latitude, chart.longitude, optsJ),
  );
  const jaimini = computeJaimini(positionsJ, lagnaJ, birthIso);
  const natalJupiter = positionsJ.find((p) => p.planet === "Jupiter")!;
  const gender = (chart.gender as Gender) ?? "unspecified";
  const roles = rolesFor(gender);
  const natalDeha = positionsJ.find((p) => p.planet === roles.deha)!;
  const reading = evaluate(positionsJ, undefined, gender);
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
    { bnn: Held<BnnWindowHit>[]; kp: Held<KpWindowHit>[]; weak: number }
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
    const kp: Held<KpWindowHit>[] = [];
    let weak = 0;
    for (const w of scoreWindows(
      jointPeriods(vim, sig, m.houses, birthIso, birthIso, 120),
      m.houses,
      m.cusp,
      planets,
      cusps,
      sigs,
      sig,
    )) {
      // Method I (Part 2 p. 24): a lord whose sub lord does not connect with the matter sets the
      // whole period aside; such windows are counted, not named.
      if (w.verdict === "weak") {
        weak++;
        continue;
      }
      kp.push(
        heldOf({
          dasaLord: w.dasaLord,
          bhuktiLord: w.bhuktiLord,
          antaraLord: w.antaraLord,
          start: w.start,
          end: w.end,
          verdict: w.verdict,
          score: w.score,
          max: w.max,
        }),
      );
    }
    windowsByMatter.set(m.id, { bnn, kp, weak });
  }

  const scoreEvent = (e: ChartEvent, date: string): EventValidation => {
    const m = matterOf(e.matter);
    const evDt = DateTime.fromISO(date, { zone }).set({
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const evIso = evDt.toUTC().toISO()!;
    const evMs = evDt.toUTC().toMillis();
    const held = windowsByMatter.get(m.id);
    const bnnHit =
      held?.bnn.find((t) => t.startMs <= evMs && evMs < t.endMs)?.hit ?? null;
    const kpHit =
      held?.kp.find((t) => t.startMs <= evMs && evMs < t.endMs)?.hit ?? null;
    const houses = m.houses;
    const lords = vimshottariLordsAt(moon.lon, birthIso, evIso);
    const signified = lords.map((l) =>
      (sig.get(l) ?? []).filter((h) => houses.includes(h)),
    ) as [number[], number[], number[]];
    const hits = signified.map((s) => s.length > 0) as [
      boolean,
      boolean,
      boolean,
    ];
    const cuspSubLord = cusps[m.cusp - 1].subLord;
    const cuspSignified = (sig.get(cuspSubLord) ?? []).filter((h) =>
      houses.includes(h),
    );
    const promised = cuspSignified.length > 0;
    // Cusp filter (Part 3 ch. 5 pp. 27-34; Part 2 ch. 7 pp. 52-54): a period lord moves, for each house it
    // signifies, only what the sub lord of that house's cusp signifies. A hit house whose cusp sub lord
    // signifies none of the matter's houses is diverted elsewhere; one whose cusp sub lord signifies the
    // 12th from that house (and not the house) is denied. A lord counts as effective when at least one of
    // its hit houses survives the filter.
    const filterHouses = (hs: number[]) =>
      hs.map((h) => {
        const sl = cusps[h - 1].subLord;
        const delivers = sig.get(sl) ?? [];
        const twelfth = ((h + 10) % 12) + 1;
        const kept = delivers.some((d) => houses.includes(d));
        const denied =
          !kept && delivers.includes(twelfth) && !delivers.includes(h);
        return { house: h, cuspSubLord: sl, delivers, kept, denied };
      });
    const filtered = signified.map(filterHouses) as [
      CuspFilter[],
      CuspFilter[],
      CuspFilter[],
    ];
    const effective = filtered.map((f) => f.some((x) => x.kept)) as [
      boolean,
      boolean,
      boolean,
    ];
    const deniedAtCusp =
      !promised &&
      (sig.get(cuspSubLord) ?? []).includes(((m.cusp + 10) % 12) + 1);
    const dayPositions = positionsLite(julianDay(evDt.toUTC()), opts);
    const transitOf = (planet: Planet): TransitCheck => {
      const lon = dayPositions.find((p) => p.planet === planet)?.lon ?? 0;
      const pt = kpPoint(lon);
      const signifies = (p: Planet) =>
        (sig.get(p) ?? []).some((h) => houses.includes(h));
      return {
        planet,
        lon,
        signLord: pt.signLord,
        starLord: pt.starLord,
        subLord: pt.subLord,
        hits: [
          signifies(pt.signLord),
          signifies(pt.starLord),
          signifies(pt.subLord),
        ],
      };
    };
    const tDasa = transitOf(lords[0]);
    const tBhukti = transitOf(lords[1]);
    const tScore = [...tDasa.hits, ...tBhukti.hits].filter(Boolean).length;
    const score = hits.filter(Boolean).length + (promised ? 1 : 0);
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

    return {
      id: e.id,
      matter: m.id,
      label: m.label,
      date,
      age: Math.round(evDt.diff(utc0, "years").years * 10) / 10,
      outcome: effectiveOutcome(e),
      houses,
      cusp: m.cusp,
      kp: {
        dasa: lords[0],
        bhukti: lords[1],
        antara: lords[2],
        hits,
        signified,
        cuspSubLord,
        promised,
        cuspSignified,
        filtered,
        effective,
        deniedAtCusp,
        transit: { dasa: tDasa, bhukti: tBhukti, score: tScore, max: 6 },
        score,
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
      windows: { bnn: bnnHit, kp: kpHit },
    };
  };
  const out: EventValidation[] = events.map((e) => scoreEvent(e, e.date));

  // The report the panel lists: past windows of the recorded matters, and the events that fell inside.
  // The event instant is noon in the birth zone, as the day-level checks take it.
  const eventMs = new Map(
    out.map((e) => [
      e.id,
      Date.parse(
        DateTime.fromISO(e.date, { zone })
          .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
          .toUTC()
          .toISO()!,
      ),
    ]),
  );
  const bnnRows: BnnWindowRow[] = [];
  const kpRows: KpWindowRow[] = [];
  let bnnPast = 0;
  let kpPast = 0;
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
          events: caught.map((e) => ({ id: e.id, label: e.label, date: e.date })),
        });
    }
  }
  const windows: WindowsReport = {
    bnn: bnnRows.sort((a, b) => a.start.localeCompare(b.start)),
    kp: kpRows.sort((a, b) => a.start.localeCompare(b.start)),
    bnnCaught: out.filter((e) => e.windows.bnn).length,
    kpCaught: out.filter((e) => e.windows.kp).length,
    bnnPast,
    kpPast,
    kpWeak: Array.from(windowsByMatter.values()).reduce((n, l) => n + l.weak, 0),
    events: out.length,
  };

  // Chance baseline: the same matters scored at random dates drawn from the span the real events cover.
  // A score that random dates reach as often as the real ones did is not evidence for the birth time.
  const baseline = chanceBaseline(events, out, scoreEvent);

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
    summary: {
      events: out.length,
      confirmed: out.filter((e) => e.kp.verdict === "confirmed").length,
      partial: out.filter((e) => e.kp.verdict === "partial").length,
      missed: out.filter((e) => e.kp.verdict === "missed").length,
      kpScore: out.reduce((s, e) => s + e.kp.score, 0),
      kpMax: out.reduce((s, e) => s + e.kp.max, 0),
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

const BASELINE_TRIALS = 200;

function chanceBaseline(
  events: ChartEvent[],
  real: EventValidation[],
  scoreEvent: (e: ChartEvent, date: string) => EventValidation,
): ChanceBaseline | null {
  if (events.length < 2) return null;
  const days = events.map((e) =>
    DateTime.fromISO(e.date, { zone: "utc" }).toMillis(),
  );
  const lo = Math.min(...days);
  const hi = Math.max(...days);
  if (hi - lo < 365 * 86400000) return null; // too short a span to draw meaningful alternatives
  const rnd = seeded(
    events.reduce(
      (s, e) => s + e.date.length * 31 + e.matter.length,
      events.length,
    ),
  );
  const measures: Record<BaselineMeasure, (vs: EventValidation[]) => number> = {
    confirmed: (vs) => vs.filter((v) => v.kp.verdict === "confirmed").length,
    kp: (vs) => vs.reduce((s, v) => s + v.kp.score, 0),
    transit: (vs) => vs.reduce((s, v) => s + v.kp.transit.score, 0),
    jaimini: (vs) => vs.reduce((s, v) => s + (v.jaimini?.score ?? 0), 0),
    bnn: (vs) => vs.reduce((s, v) => s + v.bnn.score, 0),
    bnnWindow: (vs) => vs.filter((v) => v.windows.bnn).length,
    kpWindow: (vs) => vs.filter((v) => v.windows.kp).length,
  };
  const keys = Object.keys(measures) as BaselineMeasure[];
  const samples: Record<BaselineMeasure, number[]> = {
    confirmed: [],
    kp: [],
    transit: [],
    jaimini: [],
    bnn: [],
    bnnWindow: [],
    kpWindow: [],
  };
  for (let t = 0; t < BASELINE_TRIALS; t++) {
    const trial = events.map((e) =>
      scoreEvent(
        e,
        DateTime.fromMillis(lo + Math.floor(rnd() * (hi - lo)), {
          zone: "utc",
        }).toISODate()!,
      ),
    );
    for (const k of keys) samples[k].push(measures[k](trial));
  }
  const stat = (k: BaselineMeasure): BaselineStat => {
    const xs = samples[k];
    const actual = measures[k](real);
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
  return {
    trials: BASELINE_TRIALS,
    span: [
      DateTime.fromMillis(lo, { zone: "utc" }).toISODate()!,
      DateTime.fromMillis(hi, { zone: "utc" }).toISODate()!,
    ],
    confirmed: stat("confirmed"),
    kp: stat("kp"),
    transit: stat("transit"),
    jaimini: stat("jaimini"),
    bnn: stat("bnn"),
    bnnWindow: stat("bnnWindow"),
    kpWindow: stat("kpWindow"),
  };
}
