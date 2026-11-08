// BPHS 47.3-4 timing sentence: translate the complete source, including reversal.
import { SIGNS, type PlanetPosition } from "./astro";
import { ordH } from "./house-gloss";
import { translate } from "./localization";
import type { DasaReading } from "./parashari-dasa";

export function parashariDrekkanaMalayalam(
  reading: DasaReading, positions: PlanetPosition[], source: string,
): string | undefined {
  const position = positions.find((p) => p.planet === reading.lord);
  if (!position || !Number.isFinite(position.degInSign) || position.degInSign < 0 || position.degInSign >= 30 || !Number.isInteger(position.signIndex) || position.signIndex < 0 || position.signIndex >= SIGNS.length) return undefined;
  const planet = translate("ml", reading.lord), sign = translate("ml", SIGNS[position.signIndex]);
  if (planet === reading.lord || sign === SIGNS[position.signIndex]) return undefined;
  const third = Math.floor(position.degInSign / 10) + 1;
  const effective = position.retrograde ? 4 - third : third;
  if (reading.timing.third !== effective || reading.timing.reversed !== position.retrograde) return undefined;
  const when = effective === 1 ? "commencement" : effective === 2 ? "middle" : "end";
  const expected = `${reading.lord} at ${position.degInSign.toFixed(1)} deg of ${SIGNS[position.signIndex]} is in the ${ordH(third)} drekkana${position.retrograde ? ", retrograde, so the order reverses" : ""}: its results are felt mainly at the ${when} of the dasa.`;
  if (source !== expected || reading.timing.text !== expected) return undefined;
  const whenMl = effective === 1 ? "ആരംഭത്തിൽ" : effective === 2 ? "മധ്യത്തിൽ" : "അവസാനത്തിൽ";
  return `${planet} ${sign} രാശിയിൽ ${position.degInSign.toFixed(1)} ഡിഗ്രിയിൽ, ${third}-ാം ദ്രേക്കാണത്തിലാണ്${position.retrograde ? "; വക്രഗതിയായതിനാൽ ക്രമം വിപരീതമാകുന്നു" : ""}. ഈ ഗ്രഹത്തിന്റെ ഫലങ്ങൾ പ്രധാനമായും ദശയുടെ ${whenMl} അനുഭവപ്പെടുമെന്നാണ് വ്യാഖ്യാനം.`;
}
