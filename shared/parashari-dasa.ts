// Parashari dasa effects: BPHS ch. 47 (dasa effects by placement), ch. 48 (dasas of house lords and their
// relationships), ch. 52-60 (antar dasas) and ch. 61 (pratyantar general effects). Santhanam translation,
// jyotishvidya.com. Rules are evaluated on whole-sign houses from the Lahiri lagna. Verses that hinge on "strong"
// or "weak" are matched on dignity; the Shadbala of ch. 27, when supplied, is added as its own note against the
// requirement of 27.32-33 so the two measures stay visible side by side.
import { houseFrom, SIGN_LORD, SIGNS, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { Vimshottari } from "./kp";
import { antarasOf } from "./kp";
import { DateTime } from "luxon";
import { ANTAR_DASA, PRATYANTAR, type AntarEntry } from "./parashari-dasa-data";
import type { ShadbalaResult, PlanetShadbala } from "./shadbala";

export type Tone = "support" | "strain" | "mixed";

export interface DasaSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export interface DasaNote {
  id: string;
  /** Which chapter layer the note comes from. */
  layer: "general" | "strength" | "planet" | "lordship" | "relation";
  text: string;
  tone: Tone;
  source: DasaSource;
}

export interface AntarReading {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  past: boolean;
  entry: AntarEntry;
  /** Placement facts of the antar lord that the chapter's conditions turn on. */
  facts: { favourable: string[]; adverse: string[]; maraka: string | null };
  verdict: Tone;
  source: DasaSource;
  /** Only for the running antar: pratyantar general effects, ch. 61. */
  pratyantars?: { lord: Planet; start: string; end: string; current: boolean; text: string; source: DasaSource }[];
}

export interface DasaReading {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  verdict: Tone;
  /** Drekkana timing of the lord's results within the dasa, 47.3-4. */
  timing: { third: 1 | 2 | 3; reversed: boolean; text: string; source: DasaSource };
  notes: DasaNote[];
  antars: AntarReading[];
}

const S = (ch: number, verse: string, provisional?: boolean): DasaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const TRINE = [5, 9];
const DUSTHANA = [6, 8, 12];
const UPACHAYA = [3, 6, 10, 11];

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
const listH = (hs: number[]) => (hs.length ? hs.map(ord).join(" and ") : "no house");

/** Node dignities per 47.34-35 (exaltation Taurus/Scorpio, moolatrikona Gemini/Sagittarius, own Aquarius/Scorpio). */
function nodeDignity(p: Planet, sign: number): "Exalted" | "Moolatrikona" | "Own sign" | "Debilitated" | "Neutral" {
  if (p === "Rahu") return sign === 1 ? "Exalted" : sign === 2 ? "Moolatrikona" : sign === 10 ? "Own sign" : sign === 7 ? "Debilitated" : "Neutral";
  return sign === 7 ? "Exalted" : sign === 8 ? "Moolatrikona" : sign === 1 ? "Debilitated" : "Neutral";
}

interface Ctx {
  lagnaIdx: number;
  positions: PlanetPosition[];
  pos: (p: Planet) => PlanetPosition;
  houseOf: (p: Planet) => number;
  lordOf: (h: number) => Planet;
  owns: (p: Planet) => number[];
  dignity: (p: Planet) => string;
  strong: (p: Planet) => boolean; // exalted / MT / own
  weak: (p: Planet) => boolean; // debilitated / inimical / combust
  withPlanet: (a: Planet, b: Planet) => boolean; // same sign, a != b
  withAny: (a: Planet, list: Planet[]) => Planet[];
  withMalefic: (a: Planet) => Planet[];
  withBenefic: (a: Planet) => Planet[];
  aspectedByBenefic: (a: Planet) => Planet[];
  aspectedByMalefic: (a: Planet) => Planet[];
  isBenefic: (p: Planet) => boolean;
  waning: boolean;
  navamsaSign: (p: Planet) => number;
  yogakaraka: Planet[];
  /** Shadbala row for a planet when ch. 27 has been computed; nodes and missing data give undefined. */
  bala: (p: Planet) => PlanetShadbala | undefined;
}

function drishti(planet: Planet, fromSign: number, toSign: number): number {
  if (planet === "Rahu" || planet === "Ketu") return 0;
  const h = houseFrom(fromSign, toSign);
  if (h === 7) return 4;
  if (h === 3 || h === 10) return planet === "Saturn" ? 4 : 1;
  if (h === 5 || h === 9) return planet === "Jupiter" ? 4 : 2;
  if (h === 4 || h === 8) return planet === "Mars" ? 4 : 3;
  return 0;
}

function makeCtx(positions: PlanetPosition[], lagnaIdx: number, yogakaraka: Planet[], sb?: ShadbalaResult): Ctx {
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const sun = pos("Sun"), moon = pos("Moon");
  const elong = (((moon.lon - sun.lon) % 360) + 360) % 360;
  const waning = elong >= 180;
  const isBenefic = (p: Planet) => {
    if (p === "Jupiter" || p === "Venus") return true;
    if (p === "Moon") return !waning;
    if (p === "Mercury") return !positions.some((x) => x.signIndex === pos("Mercury").signIndex && ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(x.planet));
    return false;
  };
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const lordOf = (h: number) => SIGN_LORD[(lagnaIdx + h - 1) % 12];
  const owns = (pl: Planet) => (pl === "Rahu" || pl === "Ketu" ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => lordOf(h) === pl));
  const dignity = (pl: Planet) => (pl === "Rahu" || pl === "Ketu" ? nodeDignity(pl, pos(pl).signIndex) : pos(pl).dignity);
  const withAny = (a: Planet, list: Planet[]) => list.filter((b) => b !== a && pos(b).signIndex === pos(a).signIndex);
  const all = positions.map((p) => p.planet);
  return {
    lagnaIdx,
    positions,
    pos,
    houseOf,
    lordOf,
    owns,
    dignity,
    strong: (pl) => ["Exalted", "Moolatrikona", "Own sign"].includes(dignity(pl)),
    weak: (pl) => ["Debilitated", "Inimical"].includes(dignity(pl)) || pos(pl).combust,
    withPlanet: (a, b) => a !== b && pos(a).signIndex === pos(b).signIndex,
    withAny,
    withMalefic: (a) => withAny(a, all).filter((b) => !isBenefic(b)),
    withBenefic: (a) => withAny(a, all).filter((b) => isBenefic(b)),
    aspectedByBenefic: (a) => all.filter((b) => b !== a && isBenefic(b) && drishti(b, pos(b).signIndex, pos(a).signIndex) > 0),
    aspectedByMalefic: (a) => all.filter((b) => b !== a && !isBenefic(b) && drishti(b, pos(b).signIndex, pos(a).signIndex) > 0),
    isBenefic,
    waning,
    navamsaSign: (pl) => (pos(pl).signIndex * 9 + Math.floor(pos(pl).degInSign / (10 / 3))) % 12,
    yogakaraka,
    bala: (pl) => sb?.planets.find((x) => x.planet === pl),
  };
}

// ---------- ch. 47: planet-specific dasa rules ----------
interface Rule {
  verse: string;
  when: (c: Ctx, p: Planet) => boolean;
  text: (c: Ctx, p: Planet) => string;
  tone: Tone;
}

const PLANET_RULES: Record<Planet, Rule[]> = {
  Sun: [
    { verse: "7-11", tone: "support", when: (c, p) => c.strong(p) || KENDRA.includes(c.houseOf(p)) || c.houseOf(p) === 11 || c.withAny(p, [c.lordOf(9), c.lordOf(10)]).length > 0, text: (c, p) => `The Sun ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : c.houseOf(p) === 11 ? "in the 11th" : "joined with the 9th or 10th lord"}: the dasa is said to bring wealth, standing and recognition from those in authority.` },
    { verse: "8", tone: "support", when: (c, p) => c.withPlanet(p, c.lordOf(5)), text: (c) => `Joined with the 5th lord ${c.lordOf(5)}: children are indicated.` },
    { verse: "9", tone: "support", when: (c, p) => c.withPlanet(p, c.lordOf(2)), text: (c) => `Joined with the 2nd lord ${c.lordOf(2)}: gains of wealth.` },
    { verse: "9", tone: "support", when: (c, p) => c.withPlanet(p, c.lordOf(4)), text: (c) => `Joined with the 4th lord ${c.lordOf(4)}: comforts of conveyance.` },
    { verse: "12-15", tone: "strain", when: (c, p) => c.dignity(p) === "Debilitated" || DUSTHANA.includes(c.houseOf(p)) || c.withMalefic(p).length > 0 || c.withAny(p, [c.lordOf(6), c.lordOf(8), c.lordOf(12)]).length > 0, text: (c, p) => `The Sun ${c.dignity(p) === "Debilitated" ? "debilitated" : DUSTHANA.includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : "with a 6th, 8th or 12th lord"}: anxieties, losses, friction with kin and with authority, trouble to the father. ${c.aspectedByBenefic(p).length ? `A benefic aspect from ${c.aspectedByBenefic(p).join(", ")} gives some relief at times.` : c.aspectedByMalefic(p).length ? `The malefic aspect from ${c.aspectedByMalefic(p).join(", ")} keeps the results unfavourable.` : ""}` },
  ],
  Moon: [
    { verse: "16-22", tone: "support", when: (c, p) => c.strong(p) || KENDRA.includes(c.houseOf(p)) || [5, 9, 11].includes(c.houseOf(p)) || c.withBenefic(p).length > 0 || c.aspectedByBenefic(p).length > 0 || c.withAny(p, [c.lordOf(10), c.lordOf(9), c.lordOf(4)]).length > 0, text: (c, p) => `The Moon ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : [5, 9, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : "joined with the 10th, 9th or 4th lord"}: prosperity, good fortune, auspicious functions at home, children and conveyances are indicated through the dasa.${c.houseOf(p) === 2 ? " In the 2nd the gains are said to be exceptional." : ""}` },
    { verse: "23", tone: "strain", when: (c, p) => c.waning || c.dignity(p) === "Debilitated", text: (c, p) => `${c.waning ? "A waning Moon" : "A debilitated Moon"}: loss of wealth is indicated in the dasa.` },
    { verse: "24", tone: "mixed", when: (c, p) => c.houseOf(p) === 3, text: () => "Moon in the 3rd: happiness comes and goes." },
    { verse: "24-26", tone: "strain", when: (c, p) => c.withMalefic(p).length > 0 || (DUSTHANA.includes(c.houseOf(p)) && c.waning), text: (c, p) => `Moon ${c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : `waning in the ${ord(c.houseOf(p))}`}: mental strain, trouble through subordinates and the mother, loss of wealth, friction with authority.` },
    { verse: "26", tone: "mixed", when: (c, p) => DUSTHANA.includes(c.houseOf(p)) && !c.waning, text: (c, p) => `A bright Moon in the ${ord(c.houseOf(p))}: troubles and good times alternate.` },
  ],
  Mars: [
    { verse: "27-31", tone: "support", when: (c, p) => c.strong(p) || KENDRA.includes(c.houseOf(p)) || [2, 11].includes(c.houseOf(p)) || c.withBenefic(p).length > 0, text: (c, p) => `Mars ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : [2, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `with ${c.withBenefic(p).join(", ")}`}: position, land and wealth, recognition, gains from abroad, good relations with siblings.${c.bala(p) ? ` The verse also asks for strength: Mars has ${c.bala(p)!.total.toFixed(0)} of ${c.bala(p)!.required} virupas${c.bala(p)!.strong ? ", so this condition holds" : ", short of the mark"}.` : " The verse also asks for a benefic navamsa and strength, which are not checked here."}` },
    { verse: "32", tone: "mixed", when: (c, p) => KENDRA.includes(c.houseOf(p)) || c.houseOf(p) === 3, text: (c, p) => `Mars in ${KENDRA.includes(c.houseOf(p)) ? "an angle" : "the 3rd"}: gains through courage, victory over rivals, happiness from spouse and children, with some unfavourable turn possible at the end of the dasa.` },
    { verse: "33", tone: "strain", when: (c, p) => c.dignity(p) === "Debilitated" || c.weak(p) || DUSTHANA.includes(c.houseOf(p)) || c.withMalefic(p).length > 0 || c.aspectedByMalefic(p).length > 0, text: (c, p) => `Mars ${c.dignity(p) === "Debilitated" ? "debilitated" : c.weak(p) ? c.dignity(p).toLowerCase() : DUSTHANA.includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : `aspected by ${c.aspectedByMalefic(p).join(", ")}`}: loss of wealth and distress are indicated.` },
  ],
  Rahu: [
    { verse: "34-37", tone: "support", when: (c, p) => c.strong(p), text: (c, p) => `Rahu ${c.dignity(p).toLowerCase()} (${SIGNS[c.pos(p).signIndex]}, per 47.34-35): wealth, conveyances through friends and authority, a new house, children, recognition from a foreign government.` },
    { verse: "38-39", tone: "support", when: (c, p) => (c.withBenefic(p).length > 0 || c.aspectedByBenefic(p).length > 0 || c.isBenefic(SIGN_LORD[c.pos(p).signIndex])) && [1, 3, 4, 7, 10, 11].includes(c.houseOf(p)), text: (c, p) => `Rahu in the ${ord(c.houseOf(p))} ${c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : "in a benefic's sign"}: comforts through authority, wealth from abroad, contentment at home.` },
    { verse: "40", tone: "strain", when: (c, p) => [8, 12].includes(c.houseOf(p)), text: (c, p) => `Rahu in the ${ord(c.houseOf(p))}: the dasa is described as troubled throughout.` },
    { verse: "41-43", tone: "strain", when: (c, p) => c.withMalefic(p).length > 0 || c.withAny(p, [c.lordOf(2), c.lordOf(7)]).length > 0 || c.dignity(p) === "Debilitated", text: (c, p) => `Rahu ${c.dignity(p) === "Debilitated" ? "debilitated" : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : "with a maraka lord"}: loss of position, trouble at home and to spouse and children. Loss at the start, some relief and gains at home in the middle, anxiety in the last part.` },
  ],
  Jupiter: [
    { verse: "45-48", tone: "support", when: (c, p) => c.strong(p) || [5, 9, 10].includes(c.houseOf(p)) || c.navamsaSign(p) === 8 || c.navamsaSign(p) === 11 || c.navamsaSign(p) === 3, text: (c, p) => `Jupiter ${c.strong(p) ? "in dignity" : [5, 9, 10].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : "in its own or exalted navamsa"}: standing, recognition, conveyances, devotion, happiness through spouse and children.` },
    { verse: "49-51", tone: "mixed", when: (c, p) => c.dignity(p) === "Debilitated" || c.pos(p).combust || c.withMalefic(p).length > 0 || [6, 8].includes(c.houseOf(p)), text: (c, p) => `Jupiter ${c.dignity(p) === "Debilitated" ? "debilitated" : c.pos(p).combust ? "combust" : [6, 8].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `with ${c.withMalefic(p).join(", ")}`}: loss of residence, anxiety, trouble to children, pilgrimage. Parashara limits the bad results to the opening part; the later part brings gains and recognition.` },
  ],
  Saturn: [
    { verse: "53-56", tone: "support", when: (c, p) => c.strong(p) || c.dignity(p) === "Friendly" || [3, 11].includes(c.houseOf(p)) || c.navamsaSign(p) === 9 || c.navamsaSign(p) === 10 || c.navamsaSign(p) === 6, text: (c, p) => `Saturn ${c.strong(p) ? "in dignity" : c.dignity(p) === "Friendly" ? "in a friendly sign" : [3, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : "in its own or exalted navamsa"}: recognition, standing, success in learning, conveyances, wealth, property and children.` },
    { verse: "57-58", tone: "strain", when: (c, p) => DUSTHANA.includes(c.houseOf(p)) || c.dignity(p) === "Debilitated" || c.pos(p).combust, text: (c, p) => `Saturn ${c.dignity(p) === "Debilitated" ? "debilitated" : c.pos(p).combust ? "combust" : `in the ${ord(c.houseOf(p))}`}: illness, injury, separation from the father, trouble to spouse and children, displeasure of authority.` },
    { verse: "59-60", tone: "support", when: (c, p) => c.withBenefic(p).length > 0 || c.aspectedByBenefic(p).length > 0 || KENDRA.includes(c.houseOf(p)) || TRINE.includes(c.houseOf(p)) || [8, 11].includes(c.pos(p).signIndex), text: (c, p) => `Saturn ${c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : KENDRA.includes(c.houseOf(p)) ? "in an angle" : TRINE.includes(c.houseOf(p)) ? "in a trine" : `in ${SIGNS[c.pos(p).signIndex]}`}: standing, conveyances and clothes are indicated.` },
  ],
  Mercury: [
    { verse: "62-65", tone: "support", when: (c, p) => c.strong(p) || c.dignity(p) === "Friendly" || [5, 9, 11].includes(c.houseOf(p)) || c.aspectedByBenefic(p).length > 0 || c.owns(p).includes(10), text: (c, p) => `Mercury ${c.strong(p) ? "in dignity" : c.dignity(p) === "Friendly" ? "in a friendly sign" : [5, 9, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.owns(p).includes(10) ? "as 10th lord" : `aspected by ${c.aspectedByBenefic(p).join(", ")}`}: wealth, reputation, learning, favour of authority, happiness through spouse and children, health and business profits.${c.houseOf(p) === 9 || c.owns(p).includes(10) || c.aspectedByBenefic(p).length ? " The 9th placement, 10th lordship or benefic aspect brings the good results in full." : ""}` },
    { verse: "66", tone: "strain", when: (c, p) => c.withMalefic(p).length > 0, text: (c, p) => `Mercury with ${c.withMalefic(p).join(", ")}: penalties from authority, friction with kin, travel abroad, dependence on others, urinary trouble.` },
    { verse: "67-68", tone: "strain", when: (c, p) => DUSTHANA.includes(c.houseOf(p)), text: (c, p) => `Mercury in the ${ord(c.houseOf(p))}: loss of wealth through indulgence, rheumatic or bilious illness, theft, loss of land.` },
    { verse: "69-70", tone: "mixed", when: () => true, text: () => "Sequence within the Mercury dasa: gains, learning and children at the start, recognition in the middle, distress in the last part." },
  ],
  Ketu: [
    { verse: "72-74", tone: "support", when: (c, p) => KENDRA.includes(c.houseOf(p)) || TRINE.includes(c.houseOf(p)) || c.houseOf(p) === 11 || c.strong(p) || c.isBenefic(SIGN_LORD[c.pos(p).signIndex]), text: (c, p) => `Ketu ${c.strong(p) ? `${c.dignity(p).toLowerCase()} (${SIGNS[c.pos(p).signIndex]}, per 47.34-35)` : KENDRA.includes(c.houseOf(p)) ? "in an angle" : TRINE.includes(c.houseOf(p)) ? "in a trine" : c.houseOf(p) === 11 ? "in the 11th" : "in a benefic's sign"}: cordial relations with authority, leadership, conveyances, gains from abroad, happiness from children and spouse.` },
    { verse: "75", tone: "support", when: (c, p) => [3, 6, 11].includes(c.houseOf(p)), text: (c, p) => `Ketu in the ${ord(c.houseOf(p))}: standing, good friends and prized possessions.` },
    { verse: "76", tone: "mixed", when: () => true, text: () => "Sequence within the Ketu dasa: a raja-yoga tone at the start, apprehension in the middle, ailments and distant journeys in the last part." },
    { verse: "77", tone: "strain", when: (c, p) => [2, 8, 12].includes(c.houseOf(p)) || c.aspectedByMalefic(p).length > 0, text: (c, p) => `Ketu ${[2, 8, 12].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `aspected by ${c.aspectedByMalefic(p).join(", ")}`}: confinement, loss of kin and residence, anxiety, poor company, disease.` },
  ],
  Venus: [
    { verse: "79-80", tone: "support", when: (c, p) => c.dignity(p) === "Exalted" || c.dignity(p) === "Own sign" || KENDRA.includes(c.houseOf(p)) || TRINE.includes(c.houseOf(p)), text: (c, p) => `Venus ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : "in a trine"}: fine clothes and ornaments, conveyances, land, recognition, music and festivity.` },
    { verse: "81-82", tone: "support", when: (c, p) => c.dignity(p) === "Moolatrikona", text: () => "Venus in moolatrikona (Libra 0-15): position, a house, children and grandchildren, a marriage in the family, recovery of what was lost." },
    { verse: "83-84", tone: "strain", when: (c, p) => DUSTHANA.includes(c.houseOf(p)), text: (c, p) => `Venus in the ${ord(c.houseOf(p))}: friction with kin, trouble to the spouse, business losses, separations.` },
    { verse: "85-87", tone: "support", when: (c, p) => c.houseOf(p) === 4 || c.owns(p).includes(9) || c.owns(p).includes(10), text: (c, p) => `Venus ${c.houseOf(p) === 4 ? "in the 4th" : `as ${listH(c.owns(p).filter((h) => h === 9 || h === 10))} lord`}: leadership, charitable works, energy in work, name and happiness through spouse and children. The verse reads the 4th placement together with 9th or 10th lordship; here ${c.houseOf(p) === 4 && (c.owns(p).includes(9) || c.owns(p).includes(10)) ? "both hold" : "only one of the two holds"}.` },
    { verse: "88-89", tone: "strain", when: (c, p) => c.owns(p).includes(2) || c.owns(p).includes(7), text: (c, p) => `Venus as ${listH(c.owns(p).filter((h) => h === 2 || h === 7))} lord: bodily pains and troubles; Mrityunjaya japa and charity are the stated remedies.` },
  ],
};

// ---------- ch. 48.2-8: dasas of house lords ----------
const HOUSE_LORD_DASA: { text: string; tone: Tone; verse: string }[] = [
  { verse: "2", tone: "support", text: "lord of the 1st: physical well-being" },
  { verse: "2", tone: "strain", text: "lord of the 2nd: distress and a threat to life (maraka)" },
  { verse: "3", tone: "strain", text: "lord of the 3rd: unfavourable results" },
  { verse: "3", tone: "support", text: "lord of the 4th: acquisition of house and land" },
  { verse: "4", tone: "support", text: "lord of the 5th: progress in learning, happiness from children" },
  { verse: "4", tone: "strain", text: "lord of the 6th: danger from enemies and ill health" },
  { verse: "5", tone: "strain", text: "lord of the 7th: distress to the spouse and a threat to life (maraka)" },
  { verse: "5", tone: "strain", text: "lord of the 8th: danger to life and financial losses" },
  { verse: "6", tone: "support", text: "lord of the 9th: learning, religious inclination, unexpected gains" },
  { verse: "6", tone: "support", text: "lord of the 10th: recognition and awards from authority" },
  { verse: "7", tone: "strain", text: "lord of the 11th: obstacles to gains and possible disease" },
  { verse: "7", tone: "strain", text: "lord of the 12th: distress and danger from disease" },
];

function relationNotes(c: Ctx, p: Planet): DasaNote[] {
  const out: DasaNote[] = [];
  const h = c.houseOf(p);
  const owns = c.owns(p);
  const l1 = c.lordOf(1), l4 = c.lordOf(4), l5 = c.lordOf(5), l9 = c.lordOf(9), l10 = c.lordOf(10);
  const isNode = p === "Rahu" || p === "Ketu";
  const push = (id: string, verse: string, text: string, tone: Tone) => out.push({ id: `${p}-${id}`, layer: "relation", text, tone, source: S(48, verse) });

  // 48.1: exalted in an auspicious house overrides a malefic nature; debilitated in a bad house spoils a benefic.
  if (!isNode && c.dignity(p) === "Exalted" && !DUSTHANA.includes(h)) push("48-1", "1", `${p} is exalted in the ${ord(h)}: an exalted lord in an auspicious house gives favourable dasa results even if otherwise inauspicious.`, "support");
  if (!isNode && c.dignity(p) === "Debilitated" && DUSTHANA.includes(h)) push("48-1b", "1", `${p} is debilitated in the ${ord(h)}: a lord debilitated in an inauspicious house gives adverse dasa results even if a benefic.`, "strain");

  // 48.9-10: with the 5th lord; 9th/10th lord with 5th lord.
  if (p !== l5 && c.withPlanet(p, l5)) push("48-9", "9-10", `${p} is joined with the 5th lord ${l5}${owns.includes(9) || owns.includes(10) ? `, and as ${listH(owns.filter((x) => x === 9 || x === 10))} lord this makes the dasa beneficial` : ": any planet with the 5th lord gives a favourable dasa"}.`, "support");
  // 48.11: 10th and 4th lords with the 9th lord.
  if ((owns.includes(10) || owns.includes(4)) && p !== l9 && c.withPlanet(p, l9)) push("48-11", "11", `${p}, lord of the ${listH(owns.filter((x) => x === 4 || x === 10))}, is joined with the 9th lord ${l9}: a favourable dasa.`, "support");
  // 48.12-13: kendra lord in trikona or trikona lord in kendra.
  const kInT = owns.some((x) => KENDRA.includes(x)) && TRINE.includes(h);
  const tInK = owns.some((x) => TRINE.includes(x)) && KENDRA.includes(h);
  if (kInT || tInK) push("48-12", "12-13", `${p} is ${kInT ? `an angle lord (${listH(owns.filter((x) => KENDRA.includes(x)))}) placed in a trine` : `a trine lord (${listH(owns.filter((x) => TRINE.includes(x)))}) placed in an angle`}: the dasa is called extremely favourable.`, "support");
  // 48.14: 6/8/12 lord with a trine lord.
  if (owns.some((x) => DUSTHANA.includes(x)) && c.withAny(p, [l5, l9].filter((x) => x !== p)).length) push("48-14", "14", `${p}, a ${listH(owns.filter((x) => DUSTHANA.includes(x)))} lord, is joined with the trine lord ${c.withAny(p, [l5, l9].filter((x) => x !== p)).join(", ")}: the dasa turns favourable.`, "support");
  // 48.15: joined with a planet that is kendra-lord-in-trikona or trikona-lord-in-kendra.
  for (const q of c.positions.map((x) => x.planet)) {
    if (q === p || q === "Rahu" || q === "Ketu" || !c.withPlanet(p, q)) continue;
    const qo = c.owns(q), qh = c.houseOf(q);
    if ((qo.some((x) => KENDRA.includes(x)) && TRINE.includes(qh)) || (qo.some((x) => TRINE.includes(x)) && KENDRA.includes(qh))) push(`48-15-${q}`, "15", `${p} is joined with ${q}, an angle/trine lord placed in a trine/angle: the dasa of the companion is favourable too.`, "support");
  }
  // 48.16: aspected by a kendra or trikona lord.
  const asp = c.positions.map((x) => x.planet).filter((q) => q !== p && !["Rahu", "Ketu"].includes(q) && c.owns(q).some((x) => KENDRA.includes(x) || TRINE.includes(x)) && drishti(q, c.pos(q).signIndex, c.pos(p).signIndex) > 0);
  if (asp.length) push("48-16", "16", `${p} receives the aspect of ${asp.join(", ")} (angle or trine lords): a favourable dasa.`, "support");
  // 48.17: 9th lord in lagna and lagna lord in 9th; 10th lord in lagna and lagna lord in 10th.
  if ((p === l9 || p === l1) && c.houseOf(l9) === 1 && c.houseOf(l1) === 9) push("48-17", "17", `Exchange of the 1st and 9th lords: the dasas of both ${l1} and ${l9} are extremely beneficial.`, "support");
  if ((p === l10 || p === l1) && c.houseOf(l10) === 1 && c.houseOf(l1) === 10) push("48-17b", "17", `Exchange of the 1st and 10th lords: high position in the dasas of both ${l1} and ${l10}.`, "support");
  // 48.18: lords of 3/6/11, planets in 3/6/11, planets joined with them -> unfavourable (nodes exempt in those houses).
  const trishad = owns.filter((x) => [3, 6, 11].includes(x));
  if (trishad.length && !isNode) push("48-18", "18", `${p} owns the ${listH(trishad)}: Parashara calls the dasas of 3rd, 6th and 11th lords unfavourable.`, "strain");
  if ([3, 6, 11].includes(h)) push("48-18b", "18-20", isNode ? `${p} in the ${ord(h)}: a node in the 3rd, 6th or 11th is exempted and gives favourable results.` : `${p} occupies the ${ord(h)}: planets in the 3rd, 6th or 11th give unfavourable dasas.`, isNode ? "support" : "strain");
  const withTri = c.withAny(p, c.positions.map((x) => x.planet)).filter((q) => [3, 6, 11].includes(c.houseOf(q)) ? false : c.owns(q).some((x) => [3, 6, 11].includes(x)));
  if (withTri.length && !trishad.length) push("48-18c", "18", `${p} is joined with ${withTri.join(", ")} (3rd/6th/11th lord): the company makes the dasa unfavourable.`, "strain");
  // 48.19: with 2nd/7th lords in the 2nd or 7th; placed in the 8th.
  const marakaCo = c.withAny(p, [c.lordOf(2), c.lordOf(7)].filter((x) => x !== p)).filter(() => h === 2 || h === 7);
  if (marakaCo.length) push("48-19", "19", `${p} is joined with the maraka lord ${marakaCo.join(", ")} in the ${ord(h)}: an unfavourable dasa.`, "strain");
  if (h === 8) push("48-19b", "19", `${p} in the 8th: the dasa is listed as unfavourable.`, "strain");
  return out;
}

function tally(tones: Tone[]): Tone {
  const s = tones.filter((t) => t === "support").length, n = tones.filter((t) => t === "strain").length;
  if (!s && !n) return "mixed";
  if (s && !n) return "support";
  if (n && !s) return "strain";
  return "mixed";
}

// ---------- antar dasas, ch. 52-60 ----------
function antarFacts(c: Ctx, dasaLord: Planet, b: Planet): AntarReading["facts"] {
  const fav: string[] = [], adv: string[] = [];
  const h = c.houseOf(b);
  const fromD = houseFrom(c.pos(dasaLord).signIndex, c.pos(b).signIndex);
  const dig = c.dignity(b);
  if (KENDRA.includes(h) && TRIKONA.includes(h)) fav.push("in the 1st (angle and trine)");
  else if (KENDRA.includes(h)) fav.push(`in an angle (${ord(h)})`);
  else if (TRINE.includes(h)) fav.push(`in a trine (${ord(h)})`);
  else if (h === 11) fav.push("in the 11th");
  if (["Exalted", "Moolatrikona", "Own sign"].includes(dig)) fav.push(dig.toLowerCase());
  else if (dig === "Friendly") fav.push("in a friendly sign");
  if (b !== dasaLord) {
    if (fromD === 1) fav.push(`with the dasa lord ${dasaLord}`);
    else if (KENDRA.includes(fromD) || fromD === 9) fav.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
    else if (fromD === 5 || fromD === 11 || fromD === 3) fav.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
  }
  if (b !== c.lordOf(1) && c.withPlanet(b, c.lordOf(1))) fav.push(`joined with the lagna lord ${c.lordOf(1)}`);
  if (c.yogakaraka.includes(b)) fav.push("a yogakaraka for this lagna (34.19-44)");
  if (c.withBenefic(b).length) fav.push(`with ${c.withBenefic(b).join(", ")}`);
  if (c.aspectedByBenefic(b).length) fav.push(`aspected by ${c.aspectedByBenefic(b).join(", ")}`);
  if ((b === "Rahu" || b === "Ketu") && UPACHAYA.includes(h) && !fav.some((f) => f.startsWith("in the 11th") || f.startsWith("in an angle"))) fav.push(`in an upachaya (${ord(h)}), which the chapters allow the nodes`);

  if (DUSTHANA.includes(h)) adv.push(`in the ${ord(h)} from the lagna`);
  if (b !== dasaLord && DUSTHANA.includes(fromD)) adv.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
  if (dig === "Debilitated") adv.push("debilitated");
  else if (dig === "Inimical") adv.push("in an inimical sign");
  if (c.pos(b).combust) adv.push("combust");
  if (b === "Moon" && c.waning) adv.push("waning");
  if (c.withMalefic(b).length) adv.push(`with ${c.withMalefic(b).join(", ")}`);
  const mk = c.owns(b).filter((x) => x === 2 || x === 7);
  const inMk = (b === "Rahu" || b === "Ketu") && (h === 2 || h === 7);
  const maraka = mk.length ? `owns the ${listH(mk)} (maraka house)` : inMk ? `occupies the ${ord(h)} (maraka house)` : null;
  return { favourable: fav, adverse: adv, maraka };
}

function antarVerdict(f: AntarReading["facts"]): Tone {
  const s = f.favourable.length, n = f.adverse.length + (f.maraka ? 1 : 0);
  if (s && !n) return "support";
  if (n && !s) return "strain";
  if (s >= 3 && n <= 1 && !f.maraka) return "support";
  if (n >= 3 && s <= 1) return "strain";
  return "mixed";
}

/** All dasa readings for the Vimshottari sequence. */
export function computeDasaReadings(positions: PlanetPosition[], lagnaIdx: number, yogakaraka: Planet[], vim: Vimshottari, birthIso: string, asOfIso: string, shadbala?: ShadbalaResult): DasaReading[] {
  const c = makeCtx(positions, lagnaIdx, yogakaraka, shadbala);
  const birth = DateTime.fromISO(birthIso), asOf = DateTime.fromISO(asOfIso);
  return vim.dasas.map((d) => {
    const p = d.lord;
    const pp = c.pos(p);
    const h = c.houseOf(p);
    const notes: DasaNote[] = [];
    // 47.5-6 general.
    if (h === 1 || c.strong(p) || c.dignity(p) === "Friendly") notes.push({ id: `${p}-47-5`, layer: "general", tone: "support", text: `${p} is ${h === 1 ? "in the lagna" : c.strong(p) ? c.dignity(p).toLowerCase() : "in a friendly sign"} (${SIGNS[pp.signIndex]}): the general rule reads the dasa as favourable.`, source: S(47, "5-6") });
    if (DUSTHANA.includes(h) || c.dignity(p) === "Debilitated" || c.dignity(p) === "Inimical") notes.push({ id: `${p}-47-6`, layer: "general", tone: "strain", text: `${p} is ${DUSTHANA.includes(h) ? `in the ${ord(h)}` : c.dignity(p).toLowerCase()}${DUSTHANA.includes(h) && ["Debilitated", "Inimical"].includes(c.dignity(p)) ? ` and ${c.dignity(p).toLowerCase()}` : ""}: the general rule reads the dasa as unfavourable.`, source: S(47, "5-6") });
    // ch. 27 strength against the requirement of 27.32-33.
    const sb = c.bala(p);
    if (sb) {
      const short = sb.components.filter((x) => !x.ok).map((x) => `${x.name} ${x.value.toFixed(0)}/${x.required}`);
      notes.push({
        id: `${p}-27-bala`,
        layer: "strength",
        tone: sb.strong ? "support" : "strain",
        text: `Shadbala ${sb.total.toFixed(0)} virupas against the ${sb.required} required for ${p} (${(sb.ratio * 100).toFixed(0)}%): ${sb.strong ? "strong, so the dasa lord can deliver what the verses promise" : "below the mark, so the verses' results arrive in reduced measure"}.${short.length ? ` Components short of 27.34-36: ${short.join(", ")}.` : " Every named component meets its own requirement (27.34-36)."}`,
        source: S(27, "32-36"),
      });
    } else if (p === "Rahu" || p === "Ketu") {
      notes.push({ id: `${p}-27-bala`, layer: "strength", tone: "mixed", text: `${p} has no Shadbala: chapter 27 gives strengths for the seven planets only. Read its strength through its sign lord ${SIGN_LORD[pp.signIndex]}${c.bala(SIGN_LORD[pp.signIndex]) ? ` (${c.bala(SIGN_LORD[pp.signIndex])!.total.toFixed(0)} of ${c.bala(SIGN_LORD[pp.signIndex])!.required} virupas)` : ""}.`, source: S(27, "32-33", true) });
    }
    // 47 planet-specific.
    for (const r of PLANET_RULES[p] ?? []) if (r.when(c, p)) notes.push({ id: `${p}-47-${r.verse}`, layer: "planet", tone: r.tone, text: r.text(c, p), source: S(47, r.verse) });
    // 48.2-8 lordship.
    for (const hh of c.owns(p)) {
      const e = HOUSE_LORD_DASA[hh - 1];
      notes.push({ id: `${p}-48-h${hh}`, layer: "lordship", tone: e.tone, text: `As ${e.text}.`, source: S(48, e.verse) });
    }
    if (p === "Rahu" || p === "Ketu") notes.push({ id: `${p}-node`, layer: "lordship", tone: "mixed", text: `${p} owns no house; read it through its sign lord ${SIGN_LORD[pp.signIndex]} (lord of the ${listH(c.owns(SIGN_LORD[pp.signIndex]))}) and the planets in its company (34.16-17).`, source: { label: "Parashara 34.16-17", url: BPHS_URL(34) } });
    notes.push(...relationNotes(c, p));
    // 47.3-4 drekkana timing.
    const third = (Math.floor(pp.degInSign / 10) + 1) as 1 | 2 | 3;
    const reversed = pp.retrograde;
    const eff = reversed ? ([3, 2, 1][third - 1] as 1 | 2 | 3) : third;
    const when = eff === 1 ? "commencement" : eff === 2 ? "middle" : "end";
    const timing = { third: eff, reversed, text: `${p} at ${pp.degInSign.toFixed(1)} deg of ${SIGNS[pp.signIndex]} is in the ${ord(third)} drekkana${reversed ? ", retrograde, so the order reverses" : ""}: its results are felt mainly at the ${when} of the dasa.`, source: S(47, "3-4") };

    // Antars.
    const bhuktis = vim.bhuktis.filter((b) => b.dasaLord === p);
    const antars: AntarReading[] = bhuktis.map((b) => {
      const bl = b.bhuktiLord ?? b.lord;
      const entry = ANTAR_DASA[p]?.[bl];
      const facts = antarFacts(c, p, bl);
      const reading: AntarReading = {
        lord: bl,
        start: b.start,
        end: b.end,
        ageStart: b.ageStart,
        ageEnd: b.ageEnd,
        current: b.current,
        past: DateTime.fromISO(b.end) < asOf,
        entry: entry!,
        facts,
        verdict: antarVerdict(facts),
        source: S(entry?.ch ?? 52, entry?.verses ?? ""),
      };
      if (b.current) {
        reading.pratyantars = antarasOf(b, birth, asOf).map((a) => {
          const e = PRATYANTAR[bl]?.[a.lord];
          return { lord: a.lord, start: a.start, end: a.end, current: a.current, text: e?.text ?? "", source: S(61, e?.verse ?? "2") };
        });
      }
      return reading;
    });

    return { lord: p, start: d.start, end: d.end, ageStart: d.ageStart, ageEnd: d.ageEnd, current: d.current, verdict: tally(notes.map((n) => n.tone)), timing, notes, antars };
  });
}

export const LAYER_LABEL: Record<DasaNote["layer"], string> = {
  general: "General rule (47.5-6)",
  strength: "Shadbala (ch. 27)",
  planet: "Placement (ch. 47)",
  lordship: "House lordship (48.2-8)",
  relation: "Relationships (48.9-20)",
};

