import { EXALTATION, MOOLATRIKONA, OWN_SIGNS, type Planet } from "./astro";

/** BPHS 3.49–54: sign-level exaltation and degree-bounded dignity are
 * separate observations. The Moon and Mercury can satisfy both. */
export interface BphsDignityContext {
  exaltationSign: boolean;
  ownSign: boolean;
  moolatrikona: boolean;
  /** BPHS explicitly calls these portions exalted for the Moon and Mercury. */
  explicitExaltationPortion: boolean;
}

export function bphsDignityContext(planet: Planet, signIndex: number, degree: number): BphsDignityContext | undefined {
  if (planet === "Rahu" || planet === "Ketu") return undefined;
  if (!Number.isInteger(signIndex) || signIndex < 0 || signIndex > 11 || !Number.isFinite(degree) || degree < 0 || degree >= 30)
    throw new RangeError("A dignity position requires a sign index and degree within that sign");
  const moolatrikona = MOOLATRIKONA[planet] === signIndex && (
    planet === "Sun" ? degree < 20 :
    planet === "Moon" ? degree >= 3 :
    planet === "Mars" ? degree < 12 :
    planet === "Mercury" ? degree >= 15 && degree < 20 :
    planet === "Jupiter" ? degree < 10 :
    planet === "Venus" ? degree < 15 : degree < 20
  );
  return {
    exaltationSign: EXALTATION[planet]!.sign === signIndex,
    ownSign: OWN_SIGNS[planet]?.includes(signIndex) ?? false,
    moolatrikona,
    explicitExaltationPortion: (planet === "Moon" && signIndex === 1 && degree < 3) ||
      (planet === "Mercury" && signIndex === 5 && degree < 15),
  };
}
