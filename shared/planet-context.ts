/**
 * Immutable positions and directional relationships for one explicitly identified frame.
 * School interpretations remain in their own evaluators. A birth chart, a KP-ayanamsa
 * frame, a divisional chart, a transit sky and a question chart are distinct contexts.
 */
import { houseFrom, type Planet, type PlanetPosition } from "./astro";
import { bestBnnRelation, type BnnRelation } from "./bnn-relations";
import { rasiAspects } from "./jaimini-core";
import { directedSignRelation, type DirectedPointRelation } from "./point-relations";
import type { ChartResult } from "./schema";
import { nakshatraContext, naikSolarContact, type NakshatraContext } from "./nakshatra-context";

export interface PlanetFrame {
  kind: "natal" | "divisional" | "transit" | "question" | "unspecified";
  instant?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  timeStandard?: string;
  ayanamsa?: string;
  nodeType?: string;
  sunrise?: string;
  houseMethod?: string;
  cusps?: readonly number[];
  gulikaMethod?: string;
  ascendant?: number;
  division?: string;
  /** Lite ephemeris positions do not carry the BNN retrograde-entry history. */
  precision?: "full" | "lite";
}

export interface PlanetFacts {
  readonly planet: Planet;
  /** Legacy position fields include Nadi-specific dignity/combustion interpretations; they are not universal. */
  readonly position: Readonly<PlanetPosition>;
  /** Descriptive D1 longitude geometry and Sutton-labelled tags, in this frame's ayanamsa. */
  readonly nakshatra: Readonly<NakshatraContext>;
  /** Naik's same-pada solar condition and the former angular-distance diagnostic. */
  readonly naikSolarContact?: ReturnType<typeof naikSolarContact>;
  readonly sameSign: readonly Planet[];
  /** Whole-sign count only; not a KP cusp or bhava-chalit house. */
  readonly wholeSignHouse?: number;
}

export interface PlanetContext {
  readonly type: "planet-context";
  readonly frame: Readonly<PlanetFrame>;
  readonly positions: readonly Readonly<PlanetPosition>[];
  readonly planets: readonly PlanetFacts[];
  readonly ascendantNakshatra?: Readonly<NakshatraContext>;
  planet(id: Planet): PlanetFacts | undefined;
  requirePlanet(id: Planet): PlanetFacts;
  occupants(signIndex: number): readonly PlanetFacts[];
  bnnRelation(from: Planet, to: Planet): Readonly<BnnRelation> | null;
  parashariRelation(from: Planet, to: Planet): Readonly<DirectedPointRelation>;
  parashariPointRelation(from: Planet, target: { id: string; signIndex: number }): Readonly<DirectedPointRelation>;
  jaiminiAspect(from: Planet, to: Planet): boolean;
}

export type PlanetInput = PlanetPosition[] | PlanetContext;

export function createPlanetContext(positions: readonly PlanetPosition[], frame: PlanetFrame): PlanetContext {
  const frameSnapshot = Object.freeze({ ...frame, cusps: frame.cusps ? Object.freeze([...frame.cusps]) : undefined });
  const snapshot = Object.freeze(positions.map((p) => Object.freeze({ ...p })));
  const sun = snapshot.find((p) => p.planet === "Sun");
  const byId = new Map<Planet, PlanetFacts>();
  const records = snapshot.map((position): PlanetFacts => {
    if (byId.has(position.planet)) throw new Error(`Duplicate planet ${position.planet} in a chart frame`);
    if (!Number.isInteger(position.signIndex) || position.signIndex < 0 || position.signIndex > 11)
      throw new Error(`Invalid sign for ${position.planet}`);
    const record = Object.freeze({ planet: position.planet, position, nakshatra: nakshatraContext(position.lon),
      naikSolarContact: sun ? naikSolarContact(position.planet, position.lon, sun.lon) : undefined,
      sameSign: Object.freeze(snapshot.filter((other) => other.planet !== position.planet && other.signIndex === position.signIndex).map((p) => p.planet)),
      wholeSignHouse: frameSnapshot.ascendant === undefined ? undefined : houseFrom(Math.floor(((frameSnapshot.ascendant % 360) + 360) % 360 / 30), position.signIndex),
    });
    byId.set(position.planet, record);
    return record;
  });
  const get = (id: Planet) => {
    const record = byId.get(id);
    if (!record) throw new Error(`Missing ${id} in ${frameSnapshot.kind} frame`);
    return record;
  };
  const bnn = new Map<string, Readonly<BnnRelation> | null>();
  const context: PlanetContext = {
    type: "planet-context", frame: frameSnapshot, positions: snapshot, planets: Object.freeze(records),
    ascendantNakshatra: frameSnapshot.ascendant === undefined ? undefined : nakshatraContext(frameSnapshot.ascendant),
    planet: (id) => byId.get(id), requirePlanet: get,
    occupants: (signIndex) => Object.freeze(records.filter((r) => r.position.signIndex === signIndex)),
    bnnRelation: (from, to) => {
      if (frameSnapshot.precision === "lite") throw new Error("BNN relationships require full retrograde-entry history");
      const key = `${from}:${to}`;
      if (!bnn.has(key)) {
        const value = bestBnnRelation(get(from).position as PlanetPosition, get(to).position as PlanetPosition, snapshot as unknown as PlanetPosition[]);
        bnn.set(key, value ? Object.freeze(value) : null);
      }
      return bnn.get(key)!;
    },
    parashariRelation: (from, to) => Object.freeze(directedSignRelation(get(from).position, { id: to, signIndex: get(to).position.signIndex })),
    parashariPointRelation: (from, target) => Object.freeze(directedSignRelation(get(from).position, target)),
    jaiminiAspect: (from, to) => rasiAspects(get(from).position.signIndex, get(to).position.signIndex),
  };
  return Object.freeze(context);
}

/** Compatibility bridge for existing pure school evaluators; the snapshot remains frozen. */
export function planetPositions(input: PlanetInput): PlanetPosition[] {
  return Array.isArray(input) ? input : input.positions as PlanetPosition[];
}

/** Legacy array inputs have unknown frame provenance, never an invented natal instant. */
export function asPlanetContext(input: PlanetInput): PlanetContext {
  return Array.isArray(input) ? createPlanetContext(input, { kind: "unspecified" }) : input;
}

/** Guard against accidentally pairing one chart's positions with another chart's ascendant. */
export function assertContextAscendant(context: PlanetContext, ascendant: number): void {
  if (context.frame.ascendant === undefined) return;
  const difference = Math.abs((((context.frame.ascendant - ascendant + 180) % 360) + 360) % 360 - 180);
  if (!Number.isFinite(difference) || difference > 1e-9)
    throw new Error("Ascendant does not belong to this planet context");
}

type ChartContextInput = Pick<ChartResult, "positions" | "jaimini" | "utc" | "chart" | "kp">;
export function natalPlanetContext(result: ChartContextInput): PlanetContext {
  const chart = result.chart;
  return createPlanetContext(result.positions, { kind: "natal", instant: result.utc,
    latitude: chart.latitude, longitude: chart.longitude, timezone: chart.timezone, timeStandard: chart.timeStandard,
    ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType || "mean", sunrise: chart.sunriseDef || "edge",
    houseMethod: chart.parashariHouseMethod || "rashi", gulikaMethod: chart.gulikaMethod || "kerala-ghati",
    ascendant: result.jaimini.lagna.lon, division: "D1", precision: "full" });
}

export function kpPlanetContext(result: ChartContextInput): PlanetContext {
  const chart = result.chart;
  return createPlanetContext(result.kp.positions, { kind: "natal", instant: result.utc,
    latitude: chart.latitude, longitude: chart.longitude, timezone: chart.timezone, timeStandard: chart.timeStandard,
    ayanamsa: "kp", nodeType: chart.nodeType || "mean", houseMethod: "placidus", cusps: result.kp.cusps,
    ascendant: result.kp.cusps[0], division: "D1", precision: "full" });
}
