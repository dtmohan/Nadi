import { PLANETS, SIGNS } from "./astro";
import { translate } from "./localization";

/** Only the two known KP appendix tables: an unknown schema or value falls back. */
export function kpTableRowMalayalam(head: string[] | undefined, row: string[]): string[] | undefined {
  const cusp = ["Cusp", "Sign and degree", "Star lord", "Sub lord"];
  const planet = ["Planet", "Sign and degree", "In house", "Star lord", "Sub lord", "Signifies (A-D)"];
  const withHold = [...cusp, "Sub lord holds (before / after)"];
  const schema = JSON.stringify(head);
  if (schema !== JSON.stringify(cusp) && schema !== JSON.stringify(withHold) && schema !== JSON.stringify(planet)) return undefined;
  if (row.length !== head?.length) return undefined;
  const ordinal = (value: string) => {
    const match = /^(1st|2nd|3rd|[4-9]th|1[0-2]th)$/.exec(value);
    return match ? `${parseInt(match[1], 10)}-ാം` : undefined;
  };
  const signDeg = (value: string) => {
    const match = /^([A-Za-z]+) (\d{2}°\d{2}'\d{2}\")$/.exec(value);
    if (!match || !(SIGNS as readonly string[]).includes(match[1])) return undefined;
    const name = translate("ml", match[1]);
    return name !== match[1] ? `${name} ${match[2]}` : undefined;
  };
  const name = (value: string) => {
    const match = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)( R)?$/.exec(value);
    if (!match || !(PLANETS as readonly string[]).includes(match[1])) return undefined;
    const translated = translate("ml", match[1]);
    return translated !== match[1] ? `${translated}${match[2] ? " (വക്രം)" : ""}` : undefined;
  };
  if (schema === JSON.stringify(planet)) {
    const fields = [name(row[0]), signDeg(row[1]), ordinal(row[2]), name(row[3]), name(row[4])];
    if (fields.some((x) => !x) || !/^(?:—|\d{1,2}(?:, \d{1,2})*)$/.test(row[5])) return undefined;
    return [...fields as string[], row[5]];
  }
  const fields = [ordinal(row[0]), signDeg(row[1]), name(row[2]), name(row[3])];
  if (fields.some((x) => !x)) return undefined;
  if (row.length === 5) {
    const hold = row[4];
    if (hold !== "—" && !/^(?:over an hour|\d+ min(?: \d+ s)?|\d+ s) \/ (?:over an hour|\d+ min(?: \d+ s)?|\d+ s)(?: \(conditional\))?$/.test(hold)) return undefined;
    fields.push(hold.replaceAll("over an hour", "ഒരു മണിക്കൂറിലധികം").replaceAll(" min", " മിനിറ്റ്").replaceAll(" s", " സെക്കൻഡ്").replace(" (conditional)", " (സോപാധികം)"));
  }
  return fields as string[];
}
