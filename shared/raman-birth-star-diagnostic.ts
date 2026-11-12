/**
 * A limited, stand-alone implementation of B. V. Raman, Hindu Predictive Astrology,
 * ch. XI, pp. 49–50: birth vighatis × 4, divided by 9, counting inclusively
 * from Ashwini, Magha or Mula. This is a traditional consistency check, not an
 * event score or evidence that a particular birth time is correct.
 *
 * https://www.slideshare.net/slideshow/b-v-raman-hindu-predictive-astrology-1996-pdf/269710678
 *
 * The printed worked example is internally inconsistent: the stated 13h 17m
 * 12s is 1,993 vighatis, not the stated 33 ghatis 53 vighatis (2,033).
 * Only the latter gives the printed remainder 5.
 *
 * Raman's example uses whole vighatis and does not establish how fractional
 * vighatis or a zero remainder are to be interpreted. We return those cases as
 * inconclusive rather than impose a rounding or zero-to-nine convention.
 */
export type RamanBirthStarDiagnostic =
  | { status: "inconclusive"; reason: "missing-sunrise" | "invalid-input" | "fractional-vighati" | "zero-remainder" }
  | { status: "match" | "mismatch"; elapsedVighatis: number; remainder: number; possibleStarIndexes: number[] };

/**
 * `sunriseSeconds` must be the last observed sunrise at or before birth, not
 * the sunrise on the same civil date for a birth before sunrise. Both instants
 * are absolute epoch seconds. The caller is responsible for choosing and
 * exposing the sunrise convention and for obtaining the actual Moon star
 * index, in zodiacal order, with Ashwini at 0. A missing sunrise is not replaced
 * by a clock time or a guessed solar day.
 */
export function ramanBirthStarDiagnostic(
  birthSeconds: number,
  sunriseSeconds: number | null | undefined,
  moonStarIndex: number,
): RamanBirthStarDiagnostic {
  if (sunriseSeconds == null) return { status: "inconclusive", reason: "missing-sunrise" };
  if (!Number.isFinite(birthSeconds) || !Number.isFinite(sunriseSeconds) || birthSeconds < sunriseSeconds ||
      !Number.isInteger(moonStarIndex) || moonStarIndex < 0 || moonStarIndex >= 27) {
    return { status: "inconclusive", reason: "invalid-input" };
  }
  const seconds = birthSeconds - sunriseSeconds;
  const vighatis = Math.round(seconds / 24);
  // Admit only 1 ms of numerical representation error, not a rounding policy.
  if (Math.abs(seconds - vighatis * 24) > 0.001) {
    return { status: "inconclusive", reason: "fractional-vighati" };
  }
  const remainder = (vighatis * 4) % 9;
  if (remainder === 0) return { status: "inconclusive", reason: "zero-remainder" };
  const possibleStarIndexes = [remainder - 1, remainder + 8, remainder + 17];
  return { status: possibleStarIndexes.includes(moonStarIndex) ? "match" : "mismatch", elapsedVighatis: vighatis, remainder, possibleStarIndexes };
}
