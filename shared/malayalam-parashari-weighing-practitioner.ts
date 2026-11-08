import { listJoin, ordH } from "./house-gloss";
import { translate } from "./localization";
import type { BhavaJudgement } from "./parashari-houses";

const P = "Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu";
const planet = (p: string) => { const v = translate("ml", p.replace(/^the /, "")); return v === p.replace(/^the /, "") ? undefined : v; };
function items(source: string): string[] | undefined {
  let depth = 0, start = 0;
  const parts: string[] = [];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "(") depth++;
    if (source[i] === ")") depth--;
    if (depth < 0) return undefined;
    const separator = depth === 0 && source.startsWith(", ", i) ? ", " : depth === 0 && source.startsWith(" and ", i) ? " and " : "";
    if (separator) { parts.push(source.slice(start, i)); i += separator.length - 1; start = i + 1; }
  }
  parts.push(source.slice(start));
  return depth === 0 && listJoin(parts) === source ? parts : undefined;
}
function planetList(source: string): string | undefined {
  const xs = items(source), ps = xs?.map(planet);
  return ps && ps.every(Boolean) ? ps.join(", ") : undefined;
}
function term(source: string): string | undefined {
  let m = source.match(new RegExp(`^(?:the )?(${P}) \\(waning, 3\\.11\\)$`));
  if (m && m[1] === "Moon") return "ക്ഷയിച്ചുകൊണ്ടിരിക്കുന്ന ചന്ദ്രൻ (3.11)";
  m = source.match(/^Mercury \(joined by (.+), 3\.11\)$/);
  if (m) { const ps = planetList(m[1]); return ps ? `ബുധൻ (${ps}-നോടൊപ്പമാണ്, 3.11)` : undefined; }
  m = source.match(new RegExp(`^(${P}) \\(lord of the (.+)\\)$`));
  if (m) {
    const ps = planet(m[1]), hs = items(m[2]);
    if (!ps || !hs?.every((x) => { const n = parseInt(x, 10); return n >= 1 && n <= 12 && ordH(n) === x; })) return undefined;
    return `${ps} (${hs.map((h) => `${parseInt(h, 10)}-ാം`).join(", ")} ഭാവാധിപൻ)`;
  }
  return planet(source);
}
function reason(source: string): string | undefined {
  let m = source.match(/^aspected by (.+)$/);
  if (m) { const ps = planetList(m[1]); return ps ? `${ps} ദൃഷ്ടിക്കുന്നു` : undefined; }
  m = source.match(/^(.+) in the house$/);
  if (m) { const ps = planetList(m[1]); return ps ? `${ps} ഈ ഭാവത്തിൽ` : undefined; }
  m = source.match(new RegExp(`^lord (${P}) in the (\\d+)(st|nd|rd|th)( does not aspect the house)?$`));
  if (m) {
    const p = planet(m[1]), h = Number(m[2]);
    if (!p || h < 1 || h > 12 || ordH(h) !== `${m[2]}${m[3]}`) return undefined;
    return `ഭാവാധിപനായ ${p} ${h}-ാം ഭാവത്തിലാണ്${m[4] ? "; ഈ ഭാവത്തെ ദൃഷ്ടിക്കുന്നില്ല" : ""}`;
  }
  m = source.match(new RegExp(`^lord (${P}) defeated in planetary war$`));
  if (m) return `ഭാവാധിപനായ ${planet(m[1])} ഗ്രഹയുദ്ധത്തിൽ പരാജയപ്പെട്ടു`;
  m = source.match(new RegExp(`^lord (${P}) with (?:the malefics? )?(.+)$`));
  if (m) {
    const ps = items(m[2])?.map(term);
    if (!ps || !ps.every(Boolean)) return undefined;
    const qualified = source.includes("with the malefic") ? "പാപഗ്രഹമായി കണക്കാക്കിയ " : "";
    return `ഭാവാധിപനായ ${planet(m[1])} ${qualified}${ps.join(", ")}-നോടൊപ്പമാണ്`;
  }
  return undefined;
}
function bhava(source: string): string | undefined {
  const m = source.match(/^By bhava \(provisional\): (.+)\.$/);
  if (!m) return undefined;
  const out = m[1].split("; ").map((x) => {
    let a = x.match(new RegExp(`^(${P}) (leaves for|enters from) the (\\d+)(st|nd|rd|th) under the (equal|Sripati) construction only$`));
    if (a) {
      const n = Number(a[3]);
      if (n < 1 || n > 12 || ordH(n) !== `${a[3]}${a[4]}`) return undefined;
      return `${planet(a[1])} ${a[5] === "equal" ? "സമഭാവ" : "ശ്രീപതി"} രീതിയിൽ മാത്രം ${n}-ാം ഭാവ${a[2] === "leaves for" ? "ത്തിലേക്ക് മാറുന്നു" : "ത്തിൽനിന്ന് ഇവിടെ വരുന്നു"}`;
    }
    a = x.match(new RegExp(`^(${P}) stays but at a sandhi \\(15\\.13\\)$`));
    return a ? `${planet(a[1])} ഇവിടെ തുടരുന്നു, പക്ഷേ സന്ധിയിലാണ് (15.13)` : undefined;
  });
  return out.every(Boolean) ? `ഭാവചലിതം അനുസരിച്ച് (താൽക്കാലികം): ${out.join("; ")}.` : undefined;
}
export function parashariPractitionerWeighingMalayalam(j: BhavaJudgement, source: string): string | undefined {
  if (j.tone === "none") return undefined;
  const expected = `${j.support.length ? `Signs of the house prospering: ${listJoin(j.support)}.` : ""} ${j.strain.length ? `Signs against it: ${listJoin(j.strain)}.` : ""}`.trim() + (j.chalitNote ? ` ${j.chalitNote}` : "");
  if (source !== expected) return undefined;
  const good = j.support.map(reason), bad = j.strain.map(reason), note = j.chalitNote ? bhava(j.chalitNote) : "";
  if ([...good, ...bad].some((x) => !x) || (j.chalitNote && !note)) return undefined;
  return `${good.length ? `ഭാവത്തിന്റെ അഭിവൃദ്ധിക്കുള്ള സൂചനകൾ: ${good.join("; ")}.` : ""}${bad.length ? `${good.length ? " " : ""}പ്രതികൂല സൂചനകൾ: ${bad.join("; ")}.` : ""}${note ? ` ${note}` : ""}`;
}
