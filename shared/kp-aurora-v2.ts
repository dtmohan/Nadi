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

interface Context {
  cusps: KpCusp[];
  byPlanet: Map<Planet, KpPlanet>;
  atoms: Map<Planet, ReturnType<typeof auroraV2AtomicCoordinates>>;
  self: ReturnType<typeof auroraSelfSignificators>;
}
const contexts = new WeakMap<KpPlanet[], Context>();

/** One evaluator for chart topics, saved-event validation, rectification and
 * each comparison date. Only four event types are specified by this adapter. */
export function auroraV2Evidence(input: {
  matter: string;
  planets: KpPlanet[];
  cusps: KpCusp[];
  lords: [Planet, Planet, Planet];
  transits: Array<Pick<PlanetPosition, "planet" | "lon">>;
}): AuroraV2Evidence | undefined {
  const matter = auroraMatter(input.matter);
  if (!matter) return undefined;
  let context = contexts.get(input.planets);
  if (!context || context.cusps !== input.cusps) {
    context = { cusps: input.cusps, byPlanet: new Map(input.planets.map((p) => [p.planet, p])),
      atoms: new Map(), self: auroraSelfSignificators(input.planets, input.cusps) };
    contexts.set(input.planets, context);
  }
  const current = context;
  const self = new Map(current.self.map((s) => [s.planet, s]));
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
    const p = current.byPlanet.get(planet);
    if (!p) throw new Error(`Missing KP planet ${planet}`);
    const ownStar = p.starLord === planet;
    const repeatedStarSub = p.starLord === p.subLord;
    const promoted = Array.from(new Set([planet, p.subLord])).flatMap((name) => {
      const s = self.get(name);
      if (!s) return [];
      return [{ planet: name, houses: Array.from(new Set([...atom(name).houses, ...s.cuspStar, ...s.cuspSub])).sort((a, b) => a - b) }];
    });
    const star = coord(ownStar ? p.subLord : p.starLord, promoted);
    const sub = coord(ownStar || repeatedStarSub ? p.subSubLord : p.subLord);
    const status = auroraV2Classify(star, sub);
    const eligible = proceeding;
    if (!passes(status)) proceeding = false;
    return { role, planet, ownStar, repeatedStarSub, star, sub, status, eligible };
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
