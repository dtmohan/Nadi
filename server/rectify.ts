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
 *    life area. This is sign-level: every interval in one rising sign scores alike.
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
import { seeded } from "./validate";
import type {
  RectifyBaselineStat,
  RectifySegmentBaseline,
  RectifySegmentStability,
} from "@shared/rectify-types";
import { DateTime } from "luxon";
import { norm360, type Planet } from "@shared/astro";
import {
  kpPoint,
  houseOf,
  computeSignificators,
  vimshottariLordsAt,
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
  TransitCheck,
  MoonLordsCheck,
  DuttaRpMoonCheck,
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
  positionsAt,
  ascendantAt,
  cuspsAt,
  judgementNow,
  type EphemerisOptions,
} from "./ephemeris";
import { SIGNS, SIGN_LORD } from "@shared/astro";
import { computeJaimini, type JaiminiResult } from "@shared/jaimini";
import { dashaFitAt } from "@shared/jaimini-areas";
import {
  computeBodyMarks,
  limbTermsFor,
  type BodyMarksResult,
} from "@shared/body-marks";

const MAX_WINDOW = 720;

/**
 * Dutta's linkage test ("Birth Time Rectification through KP Astrology", the first testing): does
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

/** The whole first testing for one candidate interval; the RP Moon's lords are fixed for the scan. */
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

export function rectify(req: RectifyRequest): RectifyResult {
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
  };
  const zone = chart.timezone;
  const limbTerms = limbTermsFor(chart.gender);
  const birth = birthInstant(chart);
  // Jaimini is whole-sign: one computation per rising sign serves every interval in it.
  const jaiminiBySign = new Map<
    number,
    { j: JaiminiResult; positions: ReturnType<typeof positionsAt> }
  >();
  // The marks check is whole-drekkana: one computation per rising drekkana (0-35).
  const marksByDrekkana = new Map<number, BodyMarksResult>();
  // Jaimini dasha fit depends only on the rising sign, the area and the date; memoised across intervals and trials.
  const jaiminiFitCache = new Map<string, RectifyEventCheck["jaimini"]>();
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

  // Planetary positions at noon (birth zone) of each event day, for the transit check.
  const eventPositions = req.events.map((e) => {
    const d = DateTime.fromISO(e.date, { zone });
    if (!d.isValid) return null;
    return positionsAt(
      julianDay(
        d.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toUTC(),
      ),
      opts,
    );
  });

  // Shuffled-date trials for the baseline: the same events at random dates within the span they cover, with the
  // planetary positions of each trial date computed once and shared by every interval.
  const evMillis = req.events
    .map((e) => DateTime.fromISO(e.date, { zone: "utc" }).toMillis())
    .filter((m) => Number.isFinite(m));
  const spanLo = Math.min(...evMillis);
  const spanHi = Math.max(...evMillis);
  const baselineOn =
    req.events.length >= 2 && spanHi - spanLo >= 365 * 86400000;
  const trials = baselineOn ? BASELINE_TRIALS : 0;
  const rnd = seeded(
    req.events.reduce(
      (acc, e) => acc + e.date.length * 31 + e.label.length,
      req.events.length,
    ),
  );
  const trialDates: string[][] = [];
  const trialPositions: (ReturnType<typeof positionsAt> | null)[][] = [];
  for (let t = 0; t < trials; t++) {
    const dates = req.events.map(() =>
      DateTime.fromMillis(spanLo + Math.floor(rnd() * (spanHi - spanLo)), {
        zone: "utc",
      }).toISODate()!,
    );
    trialDates.push(dates);
    trialPositions.push(
      dates.map((d) => {
        const dt = DateTime.fromISO(d, { zone });
        return dt.isValid
          ? positionsAt(julianDay(dt.set({ hour: 12 }).toUTC()), opts)
          : null;
      }),
    );
  }

  // Scan the window and locate every change of the lagna's sign, star or sub lord to the second, and every change of
  // the rising drekkana in the chart's own ayanamsa (the Brihat Jataka marks check reads by drekkana).
  const step = 10 / 86400;
  const asc = (jd: number) =>
    ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const ascJ = (jd: number) =>
    norm360(ascendantAt(jd, chart.latitude, chart.longitude, optsJ));
  const keyAt = (jd: number) =>
    `${lagnaKey(asc(jd))}|${Math.floor(ascJ(jd) / 10)}`;
  const boundaries: number[] = [];
  let prevJd = jd0 - w;
  let prevKey = keyAt(prevJd);
  for (let jd = prevJd + step; jd <= jd0 + w + 1e-9; jd += step) {
    const key = keyAt(jd);
    if (key !== prevKey) {
      let lo = prevJd;
      let hi = jd;
      for (let i = 0; i < 12; i++) {
        const m = (lo + hi) / 2;
        if (keyAt(m) === prevKey) lo = m;
        else hi = m;
      }
      boundaries.push(hi);
      prevKey = key;
    }
    prevJd = jd;
  }
  const edges = [jd0 - w, ...boundaries, jd0 + w];

  const local = (jd: number) =>
    displayLocal(
      DateTime.fromMillis(
        Math.round(((jd - 2440587.5) * 86400000) / 1000) * 1000,
        { zone: "utc" },
      ),
      birth.basis,
      birth.basis.displayZone,
    );
  const fmtT = (jd: number) => local(jd).toFormat("HH:mm:ss");

  const segments: RectifySegment[] = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    if (b - a < 0.5 / 86400) continue;
    const mid = (a + b) / 2;
    const positions = positionsAt(mid, opts);
    const cuspLons = cuspsAt(mid, chart.latitude, chart.longitude, opts);
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
    const sig = new Map(
      computeSignificators(planets).map((s) => [s.planet, s.houses]),
    );
    const lagna = cusps[0];
    const moon = planets.find((p) => p.planet === "Moon")!;
    const birthIso = local(mid).toUTC().toISO()!;

    const lagnaJ = norm360(
      ascendantAt(mid, chart.latitude, chart.longitude, optsJ),
    );
    const jSign = Math.floor(lagnaJ / 30);
    if (!jaiminiBySign.has(jSign)) {
      const posJ = positionsAt(mid, optsJ);
      jaiminiBySign.set(jSign, {
        j: computeJaimini(posJ, lagnaJ, birthIso),
        positions: posJ,
      });
    }
    const jai = jaiminiBySign.get(jSign)!;
    const dIdx = Math.floor(lagnaJ / 10);
    if (!marksByDrekkana.has(dIdx))
      marksByDrekkana.set(
        dIdx,
        computeBodyMarks(jai.positions, lagnaJ, undefined, limbTerms),
      );

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

    const checkEvent = (
      e: RectifyRequest["events"][number],
      dateIso: string,
      evPositions: ReturnType<typeof positionsAt> | null,
    ): RectifyEventCheck => {
      const evDt = DateTime.fromISO(dateIso, { zone });
      const houses = e.houses.filter((h) => h >= 1 && h <= 12);
      const lords = vimshottariLordsAt(
        moon.lon,
        birthIso,
        evDt.isValid ? evDt.toUTC().toISO()! : birthIso,
      );
      const signified = lords.map((l) =>
        (sig.get(l) ?? []).filter((h) => houses.includes(h)),
      ) as [number[], number[], number[]];
      const hits = signified.map((s) => s.length > 0) as [
        boolean,
        boolean,
        boolean,
      ];
      let cuspSubLord: Planet | undefined;
      let promised: boolean | undefined;
      if (e.cusp && e.cusp >= 1 && e.cusp <= 12) {
        cuspSubLord = cusps[e.cusp - 1].subLord;
        promised = (sig.get(cuspSubLord) ?? []).some((h) => houses.includes(h));
      }
      const score = hits.filter(Boolean).length + (promised ? 1 : 0);
      const max = 3 + (e.cusp ? 1 : 0);
      const transitOf = (planet: Planet): TransitCheck => {
        const pos = evPositions?.find((p) => p.planet === planet);
        const lon = pos?.lon ?? 0;
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
      let jaimini: RectifyEventCheck["jaimini"] = null;
      if (e.area && evDt.isValid) {
        const key = `${jSign}|${e.area}|${dateIso}`;
        if (!jaiminiFitCache.has(key))
          jaiminiFitCache.set(
            key,
            dashaFitAt(
              jai.j,
              jai.positions,
              e.area,
              evDt.set({ hour: 12 }).toUTC().toISO()!,
            ),
          );
        jaimini = jaiminiFitCache.get(key)!;
      }
      return {
        label: e.label,
        date: dateIso,
        houses,
        dasa: lords[0],
        bhukti: lords[1],
        antara: lords[2],
        hits,
        signified,
        cuspSubLord,
        promised,
        score,
        max,
        transit: { dasa: tDasa, bhukti: tBhukti, score: tScore, max: 6 },
        jaimini,
      };
    };
    const events: RectifyEventCheck[] = req.events.map((e, ei) =>
      checkEvent(e, e.date, eventPositions[ei]),
    );

    // Baseline: the same interval scored at the shuffled dates.
    let baseline: RectifySegmentBaseline | undefined;
    if (trials > 0) {
      const sums = {
        kpEvents: [] as number[],
        transit: [] as number[],
        jaimini: [] as number[],
      };
      for (let t = 0; t < trials; t++) {
        let k = 0,
          tr = 0,
          ja = 0;
        req.events.forEach((e, ei) => {
          const c = checkEvent(e, trialDates[t][ei], trialPositions[t][ei]);
          k += c.score;
          tr += c.transit.score;
          ja += c.jaimini?.score ?? 0;
        });
        sums.kpEvents.push(k);
        sums.transit.push(tr);
        sums.jaimini.push(ja);
      }
      baseline = {
        kpEvents: baselineStat(
          sums.kpEvents,
          events.reduce((a, e) => a + e.score, 0),
        ),
        transit: baselineStat(
          sums.transit,
          events.reduce((a, e) => a + e.transit.score, 0),
        ),
        jaimini: baselineStat(
          sums.jaimini,
          events.reduce((a, e) => a + (e.jaimini?.score ?? 0), 0),
        ),
      };
    }

    const evScore = events.reduce((s, e) => s + e.score, 0);
    const evMax = events.reduce((s, e) => s + e.max, 0);
    // Firmness of the twelve cusp sub lords across the interval: the same at both ends and the middle.
    const EPS = 0.2 / 86400;
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
    const matterCusps = Array.from(
      new Set(
        req.events
          .map((e) => e.cusp)
          .filter((c): c is number => !!c && c >= 1 && c <= 12),
      ),
    ).sort((x, y) => x - y);
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
      startIso: local(a).toISO()!,
      endIso: local(b).toISO()!,
      lagnaFrom: norm360(asc(a + 0.2 / 86400)),
      lagnaTo: norm360(asc(b - 0.2 / 86400)),
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
      dutta,
      jaiminiSign: {
        index: jSign,
        name: SIGNS[jSign],
        direction: jai.j.charaDasha.direction,
      },
      drekkana: dIdx,
      sunHint: {
        star: lagna.starLord === sunNow.subLord,
        sub: lagna.subLord === sunNow.subLord,
        score:
          (lagna.starLord === sunNow.subLord ? 1 : 0) +
          (lagna.subLord === sunNow.subLord ? 2 : 0),
        max: 3,
      },
      events,
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
    marks: Object.fromEntries(marksByDrekkana),
    given: { time: local(jd0).toFormat("HH:mm:ss"), lagna: norm360(asc(jd0)) },
    segments,
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

/** Mid-rank percentile of the real score among the shuffled trials, ties counted half. */
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
