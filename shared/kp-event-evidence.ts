/** Four-step KP event checks, shared across readings, validation and scans. */
import type { Planet, PlanetPosition } from "./astro";
import { kpPoint, type KpCusp, type KpPlanet, type KpSignificators } from "./kp";
import { auroraEventEvidence, type AuroraEventEvidence } from "./kp-aurora";
import { auroraV2Evidence, type AuroraV2Evidence } from "./kp-aurora-v2";
import type { CuspFilter } from "./validate-types";
import type { TransitCheck } from "./rectify-types";
import { createKpEventNatalRules, kpRuleFrame, type KpEventNatalRules } from "./kp-event-natal-rules";

export interface KpEventRules {
  signified: [number[], number[], number[]];
  hits: [boolean, boolean, boolean];
  cuspSubLord?: Planet;
  cuspSignified: number[];
  promised?: boolean;
  filtered: [CuspFilter[], CuspFilter[], CuspFilter[]];
  effective: [boolean, boolean, boolean];
  deniedAtCusp: boolean;
  score: number;
  max: number;
  transit: { dasa: TransitCheck; bhukti: TransitCheck; score: number; max: number;
    luminary: { sun: boolean; moon: boolean } };
  aurora?: AuroraEventEvidence;
  auroraV2?: AuroraV2Evidence;
  /** Qualified findings from the ordinary four-step natal catalogue. */
  natalRules?: KpEventNatalRules;
}

/** Natal cusp condition used without inventing any running period. */
export function createKpCuspScorer(cusps: KpCusp[], significators: KpSignificators[]) {
  const sig = new Map(significators.map((s) => [s.planet, s.houses]));
  return (houses: number[], cusp?: number) => {
    const cuspSubLord = cusp && cusp >= 1 && cusp <= 12 ? cusps[cusp - 1]?.subLord : undefined;
    const cuspSignified = cuspSubLord ? (sig.get(cuspSubLord) ?? []).filter((h) => houses.includes(h)) : [];
    const promised = cuspSubLord ? cuspSignified.length > 0 : undefined;
    const deniedAtCusp = !!cusp && !!cuspSubLord && !promised
      && (sig.get(cuspSubLord) ?? []).includes(((cusp + 10) % 12) + 1);
    return { cuspSubLord, cuspSignified, promised, deniedAtCusp };
  };
}

/** Inputs are explicit: an event's own clock and sky must be supplied by each
 * caller. This intentionally uses the four-step significator set, even when a
 * chart window separately offers the optional six-step interpretation. */
export function createKpEventScorer(cusps: KpCusp[], significators: KpSignificators[], planets: KpPlanet[],
  natalPolicy: { withhold?: boolean; allowed?: (matter: string) => boolean } = {}) {
  const sig = new Map(significators.map((s) => [s.planet, s.houses]));
  const scoreCusp = createKpCuspScorer(cusps, significators);
  const natalRules = createKpEventNatalRules(kpRuleFrame(cusps, planets, significators), natalPolicy);
  const stagedCache = new Map<string, { aurora?: AuroraEventEvidence; auroraV2?: AuroraV2Evidence }>();
  return (houses: number[], cusp: number | undefined, lords: [Planet, Planet, Planet],
    sky: Array<Pick<PlanetPosition, "planet" | "lon">>, matter?: string, includeAuroraSky = true): KpEventRules => {
    const signified = lords.map((p) => (sig.get(p) ?? []).filter((h) => houses.includes(h))) as [number[], number[], number[]];
    const hits = signified.map((h) => h.length > 0) as [boolean, boolean, boolean];
    const { cuspSubLord, cuspSignified, promised, deniedAtCusp } = scoreCusp(houses, cusp);
    const filtered = signified.map((hs) => hs.map((house): CuspFilter => {
      const sub = cusps[house - 1]?.subLord;
      if (!sub) throw new Error(`Missing KP cusp ${house}`);
      const delivers = sig.get(sub) ?? [];
      const twelfth = ((house + 10) % 12) + 1;
      const kept = delivers.some((h) => houses.includes(h));
      return { house, cuspSubLord: sub, delivers, kept,
        denied: !kept && delivers.includes(twelfth) && !delivers.includes(house) };
    })) as [CuspFilter[], CuspFilter[], CuspFilter[]];
    const effective = filtered.map((f) => f.some((x) => x.kept)) as [boolean, boolean, boolean];
    const point = (planet: Planet) => {
      const position = sky.find((p) => p.planet === planet);
      if (!position) throw new Error(`Missing event-sky position for ${planet}`);
      return kpPoint(position.lon);
    };
    const transitOf = (planet: Planet): TransitCheck => {
      const pt = point(planet);
      const signifies = (p: Planet) => (sig.get(p) ?? []).some((h) => houses.includes(h));
      return { planet, lon: pt.lon, signLord: pt.signLord, starLord: pt.starLord, subLord: pt.subLord,
        hits: [signifies(pt.signLord), signifies(pt.starLord), signifies(pt.subLord)] };
    };
    const dasa = transitOf(lords[0]), bhukti = transitOf(lords[1]);
    const score = hits.filter(Boolean).length + (promised ? 1 : 0);
    const luminaryTrigger = (p: Planet) => { const pt = point(p); return [pt.signLord, pt.starLord, pt.subLord].some((l) => lords.includes(l)); };
    let staged: { aurora?: AuroraEventEvidence; auroraV2?: AuroraV2Evidence } = {};
    if (matter) {
      const key = `${matter}|${lords.join(":")}`;
      const cached = !includeAuroraSky ? stagedCache.get(key) : undefined;
      if (cached) staged = cached;
      else {
        const transits = includeAuroraSky ? sky : [];
        staged = { aurora: auroraEventEvidence({ matter, planets, cusps, significators, lords, transits }),
          auroraV2: auroraV2Evidence({ matter, planets, cusps, lords, transits }) };
        if (!includeAuroraSky) stagedCache.set(key, staged);
      }
    }
    return { signified, hits, cuspSubLord, cuspSignified, promised, filtered, effective, deniedAtCusp,
      natalRules: natalRules(matter, houses, cusp),
      score, max: 3 + (cuspSubLord ? 1 : 0), transit: { dasa, bhukti,
        score: [...dasa.hits, ...bhukti.hits].filter(Boolean).length, max: 6,
        luminary: { sun: luminaryTrigger("Sun"), moon: luminaryTrigger("Moon") } }, ...staged };
  };
}
