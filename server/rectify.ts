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
 *
 * Nothing here is stored; the caller sends the chart and the events with each request.
 */
import { DateTime } from "luxon";
import { norm360, type Planet } from "@shared/astro";
import { kpPoint, houseOf, computeSignificators, vimshottari, rulingPlanets, NODES_KP, type KpCusp, type KpPlanet, type RulingPlanets } from "@shared/kp";
import type { RectifyRequest, RectifyEventCheck, RectifySegment, RectifyResult } from "@shared/rectify-types";
export type { RectifyRequest, RectifyEvent, RectifyEventCheck, RectifySegment, RectifyResult, JudgePlaceInput } from "@shared/rectify-types";
import { localToUtc, julianDay, positionsAt, ascendantAt, cuspsAt, judgementNow, type EphemerisOptions } from "./ephemeris";

const MAX_WINDOW = 180;

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
function acceptedRuling(ruling: RulingPlanets, now: { positions: ReturnType<typeof positionsAt> }): Accepted[] {
  const out = new Map<Planet, Accepted>();
  const primaries = ruling.planets.filter((r) => r.count > 0).map((r) => r.planet);
  for (const p of primaries) {
    const roles = ruling.list.filter((l) => l.planet === p && !l.role.includes("sub")).map((l) => l.role.toLowerCase()).join(", ");
    const pos = now.positions.find((x) => x.planet === p);
    const retro = Boolean(pos?.retrograde) && !NODES_KP.includes(p);
    out.set(p, { planet: p, reason: retro ? `${roles}; retrograde, doubtful` : roles, weight: retro ? 0.5 : 1 });
  }
  for (const r of ruling.planets) if (r.count === 0 && !out.has(r.planet)) out.set(r.planet, { planet: r.planet, reason: "node in a ruling planet's sign", weight: 1 });
  for (const node of NODES_KP) {
    const np = now.positions.find((p) => p.planet === node);
    if (!np || out.has(node)) continue;
    const star = kpPoint(np.lon).starLord;
    if (primaries.includes(star)) out.set(node, { planet: node, reason: `node in the star of ${star}`, weight: 1 });
  }
  for (const p of primaries) {
    const pos = now.positions.find((x) => x.planet === p);
    if (pos?.retrograde && !NODES_KP.includes(p)) {
      const star = kpPoint(pos.lon).starLord;
      if (!out.has(star)) out.set(star, { planet: star, reason: `star lord of retrograde ${p}`, weight: 0.5 });
    }
  }
  return Array.from(out.values());
}

export function rectify(req: RectifyRequest): RectifyResult {
  const { chart } = req;
  const windowMinutes = Math.min(MAX_WINDOW, Math.max(1, Math.round(req.windowMinutes || 30)));
  const opts: EphemerisOptions = { ayanamsa: "kp", nodeType: chart.nodeType === "true" ? "true" : "mean" };
  const zone = chart.timezone;
  const utc0 = localToUtc(chart.birthDate, chart.birthTime, zone);
  const jd0 = julianDay(utc0);
  const w = windowMinutes / 1440;
  const judge = req.judge ?? { latitude: chart.latitude, longitude: chart.longitude, timezone: zone, label: chart.place };
  const now = judgementNow(judge.latitude, judge.longitude, judge.timezone, opts.nodeType);
  const ruling = rulingPlanets(now);
  const accepted = acceptedRuling(ruling, now);
  const acceptedSet = new Map(accepted.map((a) => [a.planet, a]));

  // Scan the window and locate every change of the lagna's sign, star or sub lord to the second.
  const step = 10 / 86400;
  const asc = (jd: number) => ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const boundaries: number[] = [];
  let prevJd = jd0 - w;
  let prevKey = lagnaKey(asc(prevJd));
  for (let jd = prevJd + step; jd <= jd0 + w + 1e-9; jd += step) {
    const key = lagnaKey(asc(jd));
    if (key !== prevKey) {
      let lo = prevJd;
      let hi = jd;
      for (let i = 0; i < 12; i++) {
        const m = (lo + hi) / 2;
        if (lagnaKey(asc(m)) === prevKey) lo = m;
        else hi = m;
      }
      boundaries.push(hi);
      prevKey = key;
    }
    prevJd = jd;
  }
  const edges = [jd0 - w, ...boundaries, jd0 + w];

  const local = (jd: number) => DateTime.fromMillis(Math.round(((jd - 2440587.5) * 86400000) / 1000) * 1000, { zone });
  const fmtT = (jd: number) => local(jd).toFormat("HH:mm:ss");

  const segments: RectifySegment[] = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    if (b - a < 0.5 / 86400) continue;
    const mid = (a + b) / 2;
    const positions = positionsAt(mid, opts);
    const cuspLons = cuspsAt(mid, chart.latitude, chart.longitude, opts);
    const cusps: KpCusp[] = cuspLons.map((lon, k) => ({ ...kpPoint(lon), house: k + 1 }));
    const owners = cusps.map((c) => c.signLord);
    const planets: KpPlanet[] = positions.map((p) => ({
      ...kpPoint(p.lon),
      planet: p.planet,
      retrograde: p.retrograde,
      house: houseOf(p.lon, cuspLons),
      owns: NODES_KP.includes(p.planet) ? [] : owners.map((o, k) => (o === p.planet ? k + 1 : 0)).filter(Boolean),
    }));
    const sig = new Map(computeSignificators(planets).map((s) => [s.planet, s.houses]));
    const lagna = cusps[0];
    const moon = planets.find((p) => p.planet === "Moon")!;
    const birthIso = local(mid).toUTC().toISO()!;

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

    const events: RectifyEventCheck[] = req.events.map((e) => {
      const evDt = DateTime.fromISO(e.date, { zone });
      const houses = e.houses.filter((h) => h >= 1 && h <= 12);
      const v = vimshottari(moon.lon, birthIso, evDt.isValid ? evDt.toUTC().toISO()! : birthIso);
      const lords: [Planet, Planet, Planet] = [v.current.dasa.lord, v.current.bhukti.lord, v.current.antara.lord];
      const signified = lords.map((l) => (sig.get(l) ?? []).filter((h) => houses.includes(h))) as [number[], number[], number[]];
      const hits = signified.map((s) => s.length > 0) as [boolean, boolean, boolean];
      let cuspSubLord: Planet | undefined;
      let promised: boolean | undefined;
      if (e.cusp && e.cusp >= 1 && e.cusp <= 12) {
        cuspSubLord = cusps[e.cusp - 1].subLord;
        promised = (sig.get(cuspSubLord) ?? []).some((h) => houses.includes(h));
      }
      const score = hits.filter(Boolean).length + (promised ? 1 : 0);
      const max = 3 + (e.cusp ? 1 : 0);
      return { label: e.label, date: e.date, houses, dasa: lords[0], bhukti: lords[1], antara: lords[2], hits, signified, cuspSubLord, promised, score, max };
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
      rp: { sign: wSign > 0, star: wStar > 0, sub: wSub > 0, score: rpScore, max: 4, via: rpVia },
      cuspSubLords: cusps.map((c) => c.subLord),
      moon: { starLord: moon.starLord, subLord: moon.subLord },
      events,
      score: rpScore + evScore,
      max: 4 + evMax,
      given: jd0 >= a && jd0 < b,
    });
  }

  const top = Math.max(...segments.map((s) => s.score));
  const best = segments.map((s, i) => (s.score === top && top > 0 ? i : -1)).filter((i) => i >= 0);
  return {
    ruling,
    judgedAt: { label: judge.label ?? `${judge.latitude.toFixed(2)}°, ${judge.longitude.toFixed(2)}°`, timezone: judge.timezone },
    accepted,
    windowMinutes,
    given: { time: local(jd0).toFormat("HH:mm:ss"), lagna: norm360(asc(jd0)) },
    segments,
    best,
  };
}
