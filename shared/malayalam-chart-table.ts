import { NAKSHATRAS, PLANETS, SIGNS } from "./astro";
import { translate } from "./localization";

/** The birth-chart positions table is generated from a closed set of names and notes.
 * Unknown headers, names or extra notes fall back to the original row. */
export function chartTableRowMalayalam(head: string[] | undefined, row: string[]): string[] | undefined {
  if (JSON.stringify(head) !== JSON.stringify(["Planet", "Sign", "Degree", "Nakshatra", "Notes"]) || row.length !== 5) return undefined;
  const [planet, sign, degree, starQuarter, notes] = row;
  if (!(PLANETS as readonly string[]).includes(planet) || !(SIGNS as readonly string[]).includes(sign)) return undefined;
  const match = /^(.+) ([1-4])$/.exec(starQuarter);
  if (!match || !(NAKSHATRAS as readonly string[]).includes(match[1])) return undefined;
  const planetMl = translate("ml", planet), signMl = translate("ml", sign), starMl = translate("ml", match[1]);
  if (planetMl === planet || signMl === sign || starMl === match[1]) return undefined;
  const labels: Record<string, string> = {
    retrograde: "വക്രം", combust: "അസ്തംഗതം", exalted: "ഉച്ചം", moolatrikona: "മൂലത്രികോണം",
    "own sign": "സ്വക്ഷേത്രം", friendly: "മിത്രരാശി", inimical: "ശത്രുരാശി", debilitated: "നീചം",
  };
  const pieces = notes ? notes.split(", ") : [];
  if (pieces.some((piece) => !labels[piece])) return undefined;
  return [planetMl, signMl, degree, `${starMl} ${match[2]}-ാം പാദം`, pieces.map((piece) => labels[piece]).join(", ")];
}
