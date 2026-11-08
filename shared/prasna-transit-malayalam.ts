import type { Planet } from "./astro";
import { translate } from "./localization";

/** Translate only a fully recognized modifier line; unknown or edited text stays English. */
export function prasnaTransitModifierMalayalam(kind: "vedha" | "vipareeta", planet: Planet, house: number, source: string): string | undefined {
  if (!Number.isInteger(house) || house < 1 || house > 12) return undefined;
  const name = translate("ml", planet);
  if (name === planet) return undefined;
  if (kind === "vedha") {
    if (source !== `Vedha: obstructed by ${planet} in house ${house}`) return undefined;
    return `വേധം: ${house}-ാം ഭാവത്തിലുള്ള ${name} തടസ്സപ്പെടുത്തുന്നു`;
  }
  if (source !== `Vipareeta Vedha: possible relief from ${planet} in house ${house}`) return undefined;
  return `വിപരീത വേധം: ${house}-ാം ഭാവത്തിലുള്ള ${name} വഴി ആശ്വാസം ലഭിച്ചേക്കാം`;
}
