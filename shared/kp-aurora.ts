/**
 * An explicitly experimental, source-attributed KP script adapter.
 *
 * Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied
 * Kindle capture pp. 252–261, 266–268, 335–341, 438–439 and 571–572. Page
 * numbers refer to the supplied capture, not a printed edition. Her six-step
 * script is not the existing KP six-step significator toggle in this app.
 *
 * The source leaves mixed outcomes, node agency and some cusp relationships
 * under-specified. Here Nadi's four-step significations are a transparent
 * adapter, not a claim that the book prescribes them. A positive hit at each
 * level is a deliberately strict research convention; no score or prediction
 * is inferred from a partial or mixed chain.
 */
import type { Planet, PlanetPosition } from "./astro";
import { kpPoint, type KpCusp, type KpPlanet, type KpSignificators } from "./kp";

export const AURORA_SOURCE = "Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied Kindle capture pp. 252–261, 266–268, 335–341, 438–439, 571–572 and 634–637";

export type AuroraReason = "unoccupied-star" | "own-star" | "mutual-star";
export interface AuroraSelfSignificator {
  planet: Planet;
  reasons: AuroraReason[];
  tenants: Planet[];
  exchangeWith: Planet[];
  cuspStar: number[];
  cuspSub: number[];
}

/** The book's worked examples support interpreting an empty star as having no
 * natal body in a star ruled by this planet, not the impossible literal
 * reading that a body occupies no star. Only the nine KP bodies are supplied. */
export function auroraSelfSignificators(
  planets: Array<Pick<KpPlanet, "planet" | "starLord">>,
  cusps: Array<Pick<KpCusp, "house" | "starLord" | "subLord">> = [],
): AuroraSelfSignificator[] {
  const byName = new Map(planets.map((p) => [p.planet, p]));
  return planets.flatMap((p) => {
    const tenants = planets.filter((q) => q.starLord === p.planet).map((q) => q.planet);
    const exchangeWith = p.starLord !== p.planet && byName.get(p.starLord)?.starLord === p.planet ? [p.starLord] : [];
    const reasons: AuroraReason[] = [];
    if (tenants.length === 0) reasons.push("unoccupied-star");
    if (p.starLord === p.planet) reasons.push("own-star");
    if (exchangeWith.length) reasons.push("mutual-star");
    if (!reasons.length) return [];
    return [{ planet: p.planet, reasons, tenants, exchangeWith,
      cuspStar: cusps.filter((c) => c.starLord === p.planet).map((c) => c.house),
      cuspSub: cusps.filter((c) => c.subLord === p.planet).map((c) => c.house) }];
  });
}

export interface AuroraAscendantLinks {
  firstStar: Planet;
  firstSub: Planet;
  ninthSub: Planet;
  sameSub: boolean;
  firstStarMatchesNinthSub: boolean;
  sharedScriptLords: Planet[];
  firstSubHouse: number;
  ninthSubHouse: number;
  sameHouse: boolean;
}

/** Descriptive checks behind the author's first/ninth-cusp example. The book
 * also mentions other indirect links without a complete hierarchy, so none of
 * these is a necessary condition, a score, or a test of genetic relationship. */
export function auroraAscendantLinks(planets: KpPlanet[], cusps: KpCusp[]): AuroraAscendantLinks {
  const first = cusps.find((c) => c.house === 1), ninth = cusps.find((c) => c.house === 9);
  if (!first || !ninth) throw new Error("Missing first or ninth KP cusp");
  const p = planets.find((x) => x.planet === first.subLord), q = planets.find((x) => x.planet === ninth.subLord);
  if (!p || !q) throw new Error("Missing first or ninth cusp sub lord");
  const firstLords = new Set([p.starLord, p.subLord]);
  const sharedScriptLords = Array.from(new Set([q.starLord, q.subLord].filter((x) => firstLords.has(x))));
  return { firstStar: first.starLord, firstSub: first.subLord, ninthSub: ninth.subLord,
    sameSub: first.subLord === ninth.subLord, firstStarMatchesNinthSub: first.starLord === ninth.subLord,
    sharedScriptLords, firstSubHouse: p.house, ninthSubHouse: q.house, sameHouse: p.house === q.house };
}

interface AuroraMatter { matter: string; label: string; supporting: number[]; adverse: number[]; cusps: number[] }
// These combinations are a frozen research interpretation of the named
// chapters, not replacements for the existing KP event definitions. Job and
// business ask separately for the 6th or 7th as well as the 10th cusp.
export const AURORA_MATTERS: ReadonlyArray<AuroraMatter> = [
  { matter: "marriage", label: "Marriage", supporting: [2, 7, 11], adverse: [1, 6, 8, 10, 12], cusps: [7] },
  { matter: "child", label: "Childbirth", supporting: [2, 5, 11], adverse: [4, 8, 10, 12], cusps: [5] },
  { matter: "job", label: "Employment or promotion", supporting: [2, 6, 10, 11], adverse: [1, 3, 5, 8, 9, 12], cusps: [6, 10] },
  { matter: "business", label: "Business", supporting: [2, 7, 10, 11], adverse: [1, 3, 5, 8, 9, 12], cusps: [7, 10] },
];
export const auroraMatter = (matter: string): AuroraMatter | undefined => AURORA_MATTERS.find((m) => m.matter === matter);

export type AuroraStatus = "support" | "mixed" | "adverse" | "silent";
export interface AuroraLayer {
  role: string;
  planet: Planet;
  /** When the planet occupies its own star, compare the promoted sub and sub-sub. */
  ownStar: boolean;
  star: { planet: Planet; houses: number[]; supporting: number[]; adverse: number[]; addedCusps: number[] };
  sub: { planet: Planet; houses: number[]; supporting: number[]; adverse: number[]; addedCusps: number[] };
  status: AuroraStatus;
  /** True only while every predecessor has passed this app's strict adapter. */
  eligible: boolean;
}

export interface AuroraEventEvidence {
  matter: string;
  label: string;
  supporting: number[];
  adverse: number[];
  selfSignificators: AuroraSelfSignificator[];
  layers: AuroraLayer[];
  passed: number;
  firstUnresolved: string | null;
  allSupported: boolean;
  /** Descriptive event sky only; no contact is awarded a point. */
  transit: Array<{ role: string; planet: Planet; signLord: Planet; starLord: Planet; subLord: Planet }>;
}
export type AuroraNatalEvidence = Pick<AuroraEventEvidence, "matter" | "label" | "supporting" | "adverse" | "selfSignificators" | "layers" | "firstUnresolved"> & {
  /** Only the natal cusp stages; no dated period is implied. */
  allCuspsSupported: boolean;
};

type Coordinator = AuroraLayer["star"];
interface AuroraContext {
  cusps: KpCusp[];
  significators: KpSignificators[];
  byPlanet: Map<Planet, KpPlanet>;
  self: AuroraSelfSignificator[];
  selfByPlanet: Map<Planet, AuroraSelfSignificator>;
  sig: Map<Planet, number[]>;
  byMatter: Map<string, Map<Planet, Coordinator>>;
  layersByMatter: Map<string, Map<Planet, Omit<AuroraLayer, "role" | "eligible">>>;
}
// Validation and each rectification candidate reuse immutable natal arrays for
// hundreds of comparison dates. Cache natal work, never a dated event or sky.
const contexts = new WeakMap<KpPlanet[], AuroraContext>();

/** Shared by a chart topic, saved-event validation, rectification and random
 * date controls. Returns undefined for matters without a specified adapter. */
interface AuroraInput {
  matter: string;
  planets: KpPlanet[];
  cusps: KpCusp[];
  significators: KpSignificators[];
  lords: Planet[];
  transits: Array<Pick<PlanetPosition, "planet" | "lon">>;
}
function auroraEvidence(input: AuroraInput): AuroraEventEvidence | undefined {
  const m = auroraMatter(input.matter);
  if (!m) return undefined;
  let context = contexts.get(input.planets);
  if (!context || context.cusps !== input.cusps || context.significators !== input.significators) {
    const self = auroraSelfSignificators(input.planets, input.cusps);
    context = { cusps: input.cusps, significators: input.significators,
      byPlanet: new Map(input.planets.map((p) => [p.planet, p])),
      self, selfByPlanet: new Map(self.map((s) => [s.planet, s])),
      sig: new Map(input.significators.map((s) => [s.planet, s.houses])), byMatter: new Map(), layersByMatter: new Map() };
    contexts.set(input.planets, context);
  }
  const { byPlanet, self, sig } = context;
  let matterCache = context.byMatter.get(m.matter);
  if (!matterCache) { matterCache = new Map(); context.byMatter.set(m.matter, matterCache); }
  const bySelf = context.selfByPlanet;
  let matterLayers = context.layersByMatter.get(m.matter);
  if (!matterLayers) { matterLayers = new Map(); context.layersByMatter.set(m.matter, matterLayers); }
  const coordinators = (planet: Planet) => {
    const cached = matterCache.get(planet);
    if (cached) return cached;
    const special = bySelf.get(planet);
    const addedCusps = Array.from(new Set([...(special?.cuspStar ?? []), ...(special?.cuspSub ?? [])])).sort((a, b) => a - b);
    const houses = Array.from(new Set([...(sig.get(planet) ?? []), ...addedCusps])).sort((a, b) => a - b);
    const result = { planet, houses, supporting: houses.filter((h) => m.supporting.includes(h)),
      adverse: houses.filter((h) => m.adverse.includes(h)), addedCusps };
    matterCache.set(planet, result);
    return result;
  };
  let proceeding = true;
  const layer = (role: string, planet: Planet): AuroraLayer => {
    let cached = matterLayers!.get(planet);
    if (!cached) {
      const p = byPlanet.get(planet);
      if (!p) throw new Error(`Missing KP planet ${planet}`);
      const ownStar = p.starLord === planet;
      const star = coordinators(ownStar ? p.subLord : p.starLord);
      const sub = coordinators(ownStar ? p.subSubLord : p.subLord);
      const positive = star.supporting.length > 0 && sub.supporting.length > 0;
      const anyPositive = star.supporting.length > 0 || sub.supporting.length > 0;
      const negative = star.adverse.length > 0 || sub.adverse.length > 0;
      const status: AuroraStatus = anyPositive && negative ? "mixed" : positive ? "support"
        : sub.adverse.length ? "adverse" : "silent";
      cached = { planet, ownStar, star, sub, status };
      matterLayers!.set(planet, cached);
    }
    const eligible = proceeding;
    if (cached.status !== "support") proceeding = false;
    return { role, ...cached, eligible };
  };
  const layers: AuroraLayer[] = [];
  for (const n of m.cusps) {
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
  const passed = layers.filter((l) => l.eligible && l.status === "support").length;
  return { matter: m.matter, label: m.label, supporting: m.supporting, adverse: m.adverse,
    selfSignificators: self, layers, passed, firstUnresolved: layers.find((l) => l.eligible && l.status !== "support")?.role ?? null,
    allSupported: layers.every((l) => l.eligible && l.status === "support"), transit };
}

export function auroraEventEvidence(input: Omit<AuroraInput, "lords"> & { lords: [Planet, Planet, Planet] }): AuroraEventEvidence | undefined {
  return auroraEvidence(input);
}

/** The identical cusp stages without inventing an event or period lords. */
export function auroraNatalEvidence(input: Omit<AuroraInput, "lords" | "transits">): AuroraNatalEvidence | undefined {
  const result = auroraEvidence({ ...input, lords: [], transits: [] });
  return result && { matter: result.matter, label: result.label, supporting: result.supporting, adverse: result.adverse,
    selfSignificators: result.selfSignificators, layers: result.layers, firstUnresolved: result.firstUnresolved,
    allCuspsSupported: result.allSupported };
}
