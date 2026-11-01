/**
 * Aurora mixed-house research adapter v2. Source: Leena Aurora, The Ultimate
 * Guide to KP Astrology Techniques (2024), supplied Kindle capture pp.
 * 260–262, 360–365, 470–474, 582–587 and 596–599. These are capture-page
 * indices, not printed page numbers. This partial operationalization does not
 * reproduce every interpretive decision or establish predictive validity.
 */
import { drishtiQuarters, type Planet, type PlanetPosition } from "./astro";
import { kpPoint, type KpCusp, type KpPlanet } from "./kp";
import { auroraMatter, auroraSelfSignificators } from "./kp-aurora";

export const AURORA_V2_SOURCE = "Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied Kindle capture pp. 260–262, 360–365, 462–474 and 582–599";

export type AuroraV2Status = "supported" | "supported-with-caution" | "mixed-sub" | "opposed" | "unresolved";
export interface AuroraV2Coordinate {
  planet: Planet;
  houses: number[];
  supporting: number[];
  adverse: number[];
  agents: Array<{ planet: Planet; via: string }>;
  /** Additional house coordinates promoted at the star layer from a self-significator. */
  promoted: Array<{ planet: Planet; houses: number[] }>;
}
export interface AuroraV2Layer {
  role: string;
  planet: Planet;
  ownStar: boolean;
  /** Experimental extension of the book's repeated-star/sub examples. */
  repeatedStarSub: boolean;
  star: AuroraV2Coordinate;
  sub: AuroraV2Coordinate;
  status: AuroraV2Status;
  eligible: boolean;
}
export interface AuroraV2Evidence {
  matter: string;
  label: string;
  supporting: number[];
  adverse: number[];
  layers: AuroraV2Layer[];
  firstUnresolved: string | null;
  allSupported: boolean;
  cautions: number;
  transit: Array<{ role: string; planet: Planet; signLord: Planet; starLord: Planet; subLord: Planet }>;
}
export type AuroraV2NatalEvidence = Pick<AuroraV2Evidence, "matter" | "label" | "supporting" | "adverse" | "layers" | "firstUnresolved" | "cautions"> & {
  /** Only the natal cusp stages; no event or period is implied. */
  allCuspsSupported: boolean;
};

export const AURORA_V2_STAGES = ["cusps", "major", "sub", "third"] as const;
export type AuroraV2Stage = (typeof AURORA_V2_STAGES)[number];
export type AuroraV2StageCounts = Record<AuroraV2Stage, number> & { eligibleEvents: number };
export type AuroraV2StageComparison<T> = Record<AuroraV2Stage, T> & { eligibleEvents: number };

/** In v2 each ordinary planet contributes its occupied and owned houses only;
 * do not dereference its star a second time. Nodes represent their sign lord,
 * same-sign planets and planets casting a full sign aspect. The use of full
 * sign aspects is a documented app convention where the author gives no orb. */
export function auroraV2AtomicCoordinates(planets: KpPlanet[], planet: Planet): { houses: number[]; agents: Array<{ planet: Planet; via: string }> } {
  const p = planets.find((x) => x.planet === planet);
  if (!p) throw new Error(`Missing KP planet ${planet}`);
  const houses = new Set<number>([p.house, ...p.owns]);
  const agents: Array<{ planet: Planet; via: string }> = [];
  if (planet === "Rahu" || planet === "Ketu") {
    for (const other of planets) {
      if (other.planet === "Rahu" || other.planet === "Ketu") continue;
      const via = [other.planet === p.signLord ? "sign lord" : "",
        other.signIndex === p.signIndex ? "same sign" : "",
        drishtiQuarters(other.planet, other.signIndex, p.signIndex) === 4 ? "full sign aspect" : ""].filter(Boolean);
      if (!via.length) continue;
      agents.push({ planet: other.planet, via: via.join(", ") });
      houses.add(other.house);
      other.owns.forEach((h) => houses.add(h));
    }
  }
  return { houses: Array.from(houses).sort((a, b) => a - b), agents };
}

/** A mixed star can proceed when the sub supports and carries no adverse
 * houses. A mixed sub remains unresolved: the book contains examples that
 * proceed and examples that do not, without a general tie-breaking rule. */
export function auroraV2Classify(
  star: Pick<AuroraV2Coordinate, "supporting" | "adverse">,
  sub: Pick<AuroraV2Coordinate, "supporting" | "adverse">,
): AuroraV2Status {
  if (sub.supporting.length && sub.adverse.length) return "mixed-sub";
  if (!sub.supporting.length && sub.adverse.length) return "opposed";
  if (!star.supporting.length || !sub.supporting.length) return "unresolved";
  return star.adverse.length ? "supported-with-caution" : "supported";
}
const passes = (status: AuroraV2Status) => status === "supported" || status === "supported-with-caution";

/** Count cumulative survival through the same staged evaluator, without
 * interpreting a stopped chain as evidence that the event could not occur. */
export function auroraV2StageCounts(items: Array<AuroraV2Evidence | undefined>): AuroraV2StageCounts {
  const counts: AuroraV2StageCounts = { eligibleEvents: 0, cusps: 0, major: 0, sub: 0, third: 0 };
  for (const evidence of items) {
    if (!evidence) continue;
    const cusps = evidence.layers.filter((l) => l.role.startsWith("Cusp "));
    const periods = ["Major period", "Sub-period", "Sub-sub-period"].map((role) => evidence.layers.find((l) => l.role === role));
    if (!cusps.length || periods.some((l) => !l)) continue;
    counts.eligibleEvents++;
    const supported = (l: AuroraV2Layer) => l.eligible && passes(l.status);
    if (!cusps.every(supported)) continue;
    counts.cusps++;
    if (!supported(periods[0]!)) continue;
    counts.major++;
    if (!supported(periods[1]!)) continue;
    counts.sub++;
    if (supported(periods[2]!)) counts.third++;
  }
  return counts;
}

interface Context {
  cusps: KpCusp[];
  byPlanet: Map<Planet, KpPlanet>;
  atoms: Map<Planet, ReturnType<typeof auroraV2AtomicCoordinates>>;
  self: ReturnType<typeof auroraSelfSignificators>;
  selfByPlanet: Map<Planet, ReturnType<typeof auroraSelfSignificators>[number]>;
  /** Static natal layers; eligibility is applied afresh in event order. */
  layersByMatter: Map<string, Map<Planet, Omit<AuroraV2Layer, "role" | "eligible">>>;
}
const contexts = new WeakMap<KpPlanet[], Context>();

/** One evaluator for chart topics, saved-event validation, rectification and
 * each comparison date. Only four event types are specified by this adapter. */
interface AuroraV2Input {
  matter: string;
  planets: KpPlanet[];
  cusps: KpCusp[];
  lords: Planet[];
  transits: Array<Pick<PlanetPosition, "planet" | "lon">>;
}
function auroraV2Core(input: AuroraV2Input): AuroraV2Evidence | undefined {
  const matter = auroraMatter(input.matter);
  if (!matter) return undefined;
  let context = contexts.get(input.planets);
  if (!context || context.cusps !== input.cusps) {
    const self = auroraSelfSignificators(input.planets, input.cusps);
    context = { cusps: input.cusps, byPlanet: new Map(input.planets.map((p) => [p.planet, p])),
      atoms: new Map(), self, selfByPlanet: new Map(self.map((s) => [s.planet, s])), layersByMatter: new Map() };
    contexts.set(input.planets, context);
  }
  const current = context;
  let matterLayers = current.layersByMatter.get(matter.matter);
  if (!matterLayers) { matterLayers = new Map(); current.layersByMatter.set(matter.matter, matterLayers); }
  const atom = (planet: Planet) => {
    let a = current.atoms.get(planet);
    if (!a) { a = auroraV2AtomicCoordinates(input.planets, planet); current.atoms.set(planet, a); }
    return a;
  };
  const coord = (planet: Planet, promoted: Array<{ planet: Planet; houses: number[] }> = []): AuroraV2Coordinate => {
    const a = atom(planet);
    const houses = Array.from(new Set([...a.houses, ...promoted.flatMap((x) => x.houses)])).sort((x, y) => x - y);
    return { planet, houses, supporting: houses.filter((h) => matter.supporting.includes(h)),
      adverse: houses.filter((h) => matter.adverse.includes(h)), agents: a.agents, promoted };
  };
  let proceeding = true;
  const layer = (role: string, planet: Planet): AuroraV2Layer => {
    let cached = matterLayers!.get(planet);
    if (!cached) {
      const p = current.byPlanet.get(planet);
      if (!p) throw new Error(`Missing KP planet ${planet}`);
      const ownStar = p.starLord === planet;
      const repeatedStarSub = p.starLord === p.subLord;
      const promoted = Array.from(new Set([planet, p.subLord])).flatMap((name) => {
        const s = current.selfByPlanet.get(name);
        if (!s) return [];
        return [{ planet: name, houses: Array.from(new Set([...atom(name).houses, ...s.cuspStar, ...s.cuspSub])).sort((a, b) => a - b) }];
      });
      const star = coord(ownStar ? p.subLord : p.starLord, promoted);
      const sub = coord(ownStar || repeatedStarSub ? p.subSubLord : p.subLord);
      cached = { planet, ownStar, repeatedStarSub, star, sub, status: auroraV2Classify(star, sub) };
      matterLayers!.set(planet, cached);
    }
    const eligible = proceeding;
    if (!passes(cached.status)) proceeding = false;
    return { role, ...cached, eligible };
  };
  const layers: AuroraV2Layer[] = [];
  for (const n of matter.cusps) {
    const cusp = input.cusps.find((c) => c.house === n);
    if (!cusp) throw new Error(`Missing KP cusp ${n}`);
    layers.push(layer(`Cusp ${n} sub lord`, cusp.subLord));
  }
  input.lords.forEach((planet, i) => layers.push(layer(["Major period", "Sub-period", "Sub-sub-period"][i], planet)));
  const transit = ([{ role: "Major period lord", planet: input.lords[0] },
    { role: "Sub-period lord", planet: input.lords[1] }, { role: "Sun", planet: "Sun" as Planet },
    { role: "Moon", planet: "Moon" as Planet }]).flatMap(({ role, planet }) => {
      if (!planet) return [];
      const position = input.transits.find((p) => p.planet === planet);
      if (!position) return [];
      const p = kpPoint(position.lon);
      return [{ role, planet, signLord: p.signLord, starLord: p.starLord, subLord: p.subLord }];
    });
  return { matter: matter.matter, label: matter.label, supporting: matter.supporting, adverse: matter.adverse,
    layers, firstUnresolved: layers.find((l) => l.eligible && !passes(l.status))?.role ?? null,
    allSupported: layers.every((l) => l.eligible && passes(l.status)),
    cautions: layers.filter((l) => l.eligible && l.status === "supported-with-caution").length, transit };
}

export function auroraV2Evidence(input: Omit<AuroraV2Input, "lords"> & { lords: [Planet, Planet, Planet] }): AuroraV2Evidence | undefined {
  return auroraV2Core(input);
}

/** The identical cusp stages without inventing an event or period lords. */
export function auroraV2NatalEvidence(input: Omit<AuroraV2Input, "lords" | "transits">): AuroraV2NatalEvidence | undefined {
  const result = auroraV2Core({ ...input, lords: [], transits: [] });
  return result && { matter: result.matter, label: result.label, supporting: result.supporting, adverse: result.adverse,
    layers: result.layers, firstUnresolved: result.firstUnresolved, cautions: result.cautions,
    allCuspsSupported: result.allSupported };
}
