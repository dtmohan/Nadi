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
import { DateTime } from "luxon";
import { norm360, type Planet } from "@shared/astro";
import {
  kpPoint,
  houseOf,
  computeSignificators,
  vimshottari,
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
import { SIGNS } from "@shared/astro";
import { computeJaimini, type JaiminiResult } from "@shared/jaimini";
import { dashaFitAt } from "@shared/jaimini-areas";
import {
  computeBodyMarks,
  limbTermsFor,
  type BodyMarksResult,
} from "@shared/body-marks";

const MAX_WINDOW = 720;

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

    const events: RectifyEventCheck[] = req.events.map((e, ei) => {
      const evDt = DateTime.fromISO(e.date, { zone });
      const houses = e.houses.filter((h) => h >= 1 && h <= 12);
      const v = vimshottari(
        moon.lon,
        birthIso,
        evDt.isValid ? evDt.toUTC().toISO()! : birthIso,
      );
      const lords: [Planet, Planet, Planet] = [
        v.current.dasa.lord,
        v.current.bhukti.lord,
        v.current.antara.lord,
      ];
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
        const pos = eventPositions[ei]?.find((p) => p.planet === planet);
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
      const jaimini =
        e.area && evDt.isValid
          ? dashaFitAt(
              jai.j,
              jai.positions,
              e.area,
              evDt.set({ hour: 12 }).toUTC().toISO()!,
            )
          : null;
      return {
        label: e.label,
        date: e.date,
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
    });

    const evScore = events.reduce((s, e) => s + e.score, 0);
    const evMax = events.reduce((s, e) => s + e.max, 0);
    segments.push({
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
  };
}
