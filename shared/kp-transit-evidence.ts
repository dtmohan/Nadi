import { norm360, type Planet, type PlanetPosition } from "./astro";
import { computeSignificators, houseOf, kpPoint, NODES_KP, type KpPlanet } from "./kp";

export const KP_TRANSIT_EVIDENCE_SOURCE = {
  label: "K.S. Krishnamurti, KP Reader IV, pp. 113–114 (marriage example)",
  url: "https://www.scribd.com/document/1017596238/04-Jyotish-KP-Reader-4-Marriage-Married-Life-Children",
};

export interface KpTransitContact {
  target: string;
  kind: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  /** Difference in degrees from the exact geometrical aspect. */
  orb: number;
}

export interface KpTransitEvidence {
  planet: Planet;
  lon: number;
  house: number;
  signLord: Planet;
  starLord: Planet;
  subLord: Planet;
  /** Event houses signified by the respective lords in the natal chart. */
  signHouses: number[];
  starHouses: number[];
  subHouses: number[];
  contacts: KpTransitContact[];
}

/**
 * A descriptive event-day sky against a particular natal frame. The 1° filter
 * is an app display convention for major geometric contacts, not a sourced
 * KP verdict, a comprehensive aspect doctrine, or a weighted score.
 */
export function kpTransitEvidence(
  transits: Array<Pick<PlanetPosition, "planet" | "lon">>,
  natal: Array<Pick<PlanetPosition, "planet" | "lon">>,
  cusps: number[],
  eventHouses: number[],
): KpTransitEvidence[] {
  const owners = cusps.map((lon) => kpPoint(lon).signLord);
  const natalFrame: KpPlanet[] = natal.map((p) => ({
    ...kpPoint(p.lon), planet: p.planet, retrograde: false,
    house: houseOf(p.lon, cusps),
    owns: NODES_KP.includes(p.planet) ? [] : owners.map((owner, i) => owner === p.planet ? i + 1 : 0).filter(Boolean),
  }));
  const sig = new Map(computeSignificators(natalFrame).map((s) => [s.planet, s.houses]));
  const matching = (p: Planet) => (sig.get(p) ?? []).filter((h) => eventHouses.includes(h));
  const aspects = [
    { angle: 0, kind: "conjunction" },
    { angle: 60, kind: "sextile" },
    { angle: 90, kind: "square" },
    { angle: 120, kind: "trine" },
    { angle: 180, kind: "opposition" },
  ] as const;
  const targets = [
    ...natal.map((p) => ({ target: `natal ${p.planet}`, lon: p.lon })),
    ...cusps.map((lon, i) => ({ target: `natal cusp ${i + 1}`, lon })),
  ];
  return transits.map(({ planet, lon }) => {
    const point = kpPoint(lon);
    const contacts: KpTransitContact[] = [];
    for (const target of targets) {
      const diff = Math.abs(norm360(lon) - norm360(target.lon));
      const separation = Math.min(diff, 360 - diff);
      for (const aspect of aspects) {
        const orb = Math.abs(separation - aspect.angle);
        if (orb <= 1) contacts.push({ target: target.target, kind: aspect.kind, orb });
      }
    }
    contacts.sort((a, b) => a.orb - b.orb || a.target.localeCompare(b.target));
    return {
      planet, lon: norm360(lon), house: houseOf(lon, cusps),
      signLord: point.signLord, starLord: point.starLord, subLord: point.subLord,
      signHouses: matching(point.signLord), starHouses: matching(point.starLord),
      subHouses: matching(point.subLord), contacts,
    };
  });
}
