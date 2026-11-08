// Closed grammar for the plain 11.14–16 house weighing; every reason must translate.
import { listJoin, ordH, withGloss } from "./house-gloss";
import { translate } from "./localization";
import { parashariHouseGlossMalayalam } from "./school-topic-malayalam";

const names = ["the Sun", "the Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
function planets(source: string): string | undefined {
  // Reconstruct the exact list, so an unknown name or unmatched qualifier cannot disappear.
  const found = names.filter((name) => new RegExp(`(?:^|, | and )${name}(?=$|, | and )`).test(source));
  if (!found.length) return undefined;
  const ordered = found.sort((a, b) => source.indexOf(a) - source.indexOf(b));
  if (listJoin(ordered) !== source) return undefined;
  const ml = ordered.map((s) => translate("ml", s.replace(/^the /, "")));
  return ml.some((s, i) => s === ordered[i].replace(/^the /, "")) ? undefined : ml.join(", ");
}
function reason(source: string): string | undefined {
  let m = source.match(/^(.+), (a benefic, stands|benefics, stand|a benefic, looks|benefics, look) (in it|at it)$/);
  if (m) {
    const ps = planets(m[1]);
    const stand = m[2].endsWith("stand") || m[2].endsWith("stands");
    if (!ps || (stand ? m[3] !== "in it" : m[3] !== "at it")) return undefined;
    return `${ps} എന്ന ശുഭഗ്രഹ${m[2].startsWith("a ") ? "ം" : "ങ്ങൾ"} ഈ ഭാവത്തെ ${stand ? "അധിവസിക്കുന്നു" : "ദൃഷ്ടിക്കുന്നു"}`;
  }
  m = source.match(/^its ruler, (.+), sits in your (\d+)(st|nd|rd|th) and does not look back at it$/);
  if (m) {
    const p = planets(m[1]), h = Number(m[2]);
    if (!p || h < 1 || h > 12 || `${m[2]}${m[3]}` !== ordH(h)) return undefined;
    return `ഭാവാധിപനായ ${p} ${h}-ാം ഭാവത്തിൽ നിന്ന് ഈ ഭാവത്തെ ദൃഷ്ടിക്കുന്നില്ല`;
  }
  m = source.match(/^its ruler, (.+), stands in (it|your 10th \(work, honour and authority\))$/);
  if (m) {
    const p = planets(m[1]);
    if (!p || withGloss("parashari", 10) !== "10th (work, honour and authority)") return undefined;
    return `ഭാവാധിപനായ ${p} ${m[2] === "it" ? "ഈ ഭാവത്തിൽ" : `10-ാം ഭാവത്തിൽ (${parashariHouseGlossMalayalam(10)})`} നിലകൊള്ളുന്നു`;
  }
  m = source.match(/^its ruler, (.+), loses a planetary war, which takes strength away$/);
  if (m) { const p = planets(m[1]); return p ? `ഭാവാധിപനായ ${p} ഗ്രഹയുദ്ധത്തിൽ പരാജയപ്പെടുന്നതിനാൽ ബലം കുറയുന്നു` : undefined; }
  m = source.match(/^its ruler, (.+), shares a sign with (.+)$/);
  if (!m) return undefined;
  const lord = planets(m[1]);
  if (!lord) return undefined;
  const other = m[2];
  const mercury = other.match(/^(.+), (a harsher planet|harsher planets) and Mercury, which counts as a harsher planet beside (.+)$/);
  if (mercury) {
    const natural = planets(mercury[1]), companions = planets(mercury[3]);
    if (natural && companions && !/Mercury|the Moon/.test(mercury[1])) return `ഭാവാധിപനായ ${lord} കൂടുതൽ പ്രതികൂല സ്വഭാവമുള്ള ${natural}-യോടും ബുധനോടും ഒരേ രാശിയിലാണ്; ${companions}-നോടൊപ്പമായതിനാലാണ് ഇവിടെ ബുധനെ പ്രതികൂല ഗ്രഹമായി കണക്കാക്കുന്നത്`;
  }
  const moon = other.match(/^(.+), (a harsher planet|harsher planets) and the waning Moon, which counts as a harsher planet$/);
  if (moon) {
    const natural = planets(moon[1]);
    if (natural && !/Mercury|the Moon/.test(moon[1])) return `ഭാവാധിപനായ ${lord} കൂടുതൽ പ്രതികൂല സ്വഭാവമുള്ള ${natural}-യോടും ക്ഷയിച്ചുകൊണ്ടിരിക്കുന്ന ചന്ദ്രനോടും ഒരേ രാശിയിലാണ്`;
  }
  const harsher = other.match(/^(.+), (a harsher planet|harsher planets)$/);
  if (harsher) {
    const p = planets(harsher[1]);
    if (p && !/Mercury|the Moon/.test(harsher[1])) return `ഭാവാധിപനായ ${lord} കൂടുതൽ പ്രതികൂല സ്വഭാവമുള്ള ${p}-യോടൊപ്പം ഒരേ രാശിയിലാണ്`;
  }
  const waning = other === "the waning Moon, which counts as a harsher planet";
  if (waning) return `ഭാവാധിപനായ ${lord} കൂടുതൽ പ്രതികൂല സ്വഭാവമുള്ള ക്ഷയിച്ചുകൊണ്ടിരിക്കുന്ന ചന്ദ്രനോടൊപ്പം ഒരേ രാശിയിലാണ്`;
  const evil = other.match(/^(.+), ruler of your (6th|8th|12th) \(([^()]+)\)$/);
  if (evil) {
    const p = planets(evil[1]), h = parseInt(evil[2], 10);
    if (p && withGloss("parashari", h) === `${evil[2]} (${evil[3]})`) return `ഭാവാധിപനായ ${lord} ${h}-ാം ഭാവത്തിന്റെ (${parashariHouseGlossMalayalam(h)}) അധിപനായ ${p}-യോടൊപ്പം ഒരേ രാശിയിലാണ്`;
  }
  return undefined;
}

export function parashariWeighingMalayalam(source: string): string | undefined {
  const prefix = "Weighing the house as a whole, Parashara finds signs ";
  if (!source.startsWith(prefix)) return undefined;
  const body = source.slice(prefix.length);
  let support = "", strain = "";
  if (body.startsWith("both ways. In its favour: ")) {
    const m = body.match(/^both ways\. In its favour: (.+)\. Against it: (.+)\.$/);
    if (!m) return undefined;
    [, support, strain] = m;
  } else if (body.startsWith("in its favour: ") && body.endsWith(".")) support = body.slice(15, -1);
  else if (body.startsWith("against it: ") && body.endsWith(".")) strain = body.slice(12, -1);
  else return undefined;
  const translateReasons = (s: string) => s ? s.split("; ").map(reason) : [];
  const sp = translateReasons(support), st = translateReasons(strain);
  if ([...sp, ...st].some((s) => !s)) return undefined;
  return `ഭാവത്തെ മൊത്തത്തിൽ വിലയിരുത്തുമ്പോൾ പരാശരി ${support && strain ? "അനുകൂലവും പ്രതികൂലവുമായ സൂചനകൾ കാണുന്നു" : support ? "അനുകൂല സൂചനകൾ കാണുന്നു" : "പ്രതികൂല സൂചനകൾ കാണുന്നു"}.${support ? ` അനുകൂലമായി: ${sp.join("; ")}.` : ""}${strain ? ` പ്രതികൂലമായി: ${st.join("; ")}.` : ""}`;
}
