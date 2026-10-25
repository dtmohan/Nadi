/**
 * Combustion distances of the Surya Siddhanta, shared by the Parashari tab (vargas.ts and its users) and the
 * transit rules (gochara.ts). The interpretive verses give no distances: BPHS 7.28-29 says only that a combust
 * planet is powerless, and Phaladeepika 26.32 names eclipse (maudhya) without an orb. The distances are the
 * astronomers': Surya Siddhanta 9.6 gives Jupiter 11, Saturn 15 and Mars 17; 9.7 gives Venus 10, or 8 when it
 * sets in the west and rises in the east by retrograde motion; 9.8 gives Mercury 14, or 12 when retrograde; and
 * 10.1 gives the Moon 12 (Burgess's translation).
 *
 * The translator's note under BPHS 7.28-29 quotes this table with Saturn at 16 and a retrograde Mars at 8. The
 * Siddhanta has 15 for Saturn and no retrograde figure for the outer planets, which turn retrograde only far from
 * the Sun, so Mars keeps 17 either way. The Siddhanta reckons these as time-degrees at the horizon (kalamsa); the
 * app, like the note and most practice, applies them as degrees of longitude from the Sun.
 *
 * Kept apart: BNN's 3°20' (COMBUSTION_ORB_DEG in astro.ts, the `combust` flag on a position) and Iyer's limits
 * under Brihat Jataka 7.2 in the longevity module (ayurdaya.ts).
 */
import type { Planet, PlanetPosition } from "./astro";

export type CombustPlanet = "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";

/** Degrees from the Sun inside which the planet is combust: [direct, retrograde]. */
export const SS_COMBUST_ORB: Readonly<Record<CombustPlanet, readonly [number, number]>> = {
  Moon: [12, 12],
  Mars: [17, 17],
  Mercury: [14, 12],
  Jupiter: [11, 11],
  Venus: [10, 8],
  Saturn: [15, 15],
};

/** The short citation for user-facing text. */
export const SS_ORB_CITE = "Surya Siddhanta 9.6-9";

/** Practitioner detail: where the table departs from the translator's note the app first followed. */
export const SS_NOTE_DIFFERENCE =
  "The translator's note under BPHS 7.28-29 quotes these distances with Saturn at 16°; Surya Siddhanta 9.6 gives 15°, which the app uses.";

/** The distances in words, for methodology notes. */
export const SS_ORB_TEXT =
  "the Moon 12°, Mars 17°, Mercury 14° (12° retrograde), Jupiter 11°, Venus 10° (8° retrograde), Saturn 15°";

const isCombustPlanet = (p: Planet): p is CombustPlanet => Object.prototype.hasOwnProperty.call(SS_COMBUST_ORB, p);

/** Angular distance from the Sun in degrees, 0 to 180. */
export function sunDistance(p: Pick<PlanetPosition, "lon">, sunLon: number): number {
  return Math.abs(((((p.lon - sunLon) % 360) + 540) % 360) - 180);
}

/** The orb for `p` (direct or retrograde); undefined for the Sun and the nodes, which are never combust. */
export function ssCombustOrb(p: Pick<PlanetPosition, "planet" | "retrograde">): number | undefined {
  if (!isCombustPlanet(p.planet)) return undefined;
  return SS_COMBUST_ORB[p.planet][p.retrograde ? 1 : 0];
}

/** Combust by the Surya Siddhanta distances. */
export function ssCombust(p: Pick<PlanetPosition, "planet" | "retrograde" | "lon">, sunLon: number): boolean {
  const orb = ssCombustOrb(p);
  return orb !== undefined && sunDistance(p, sunLon) <= orb;
}
