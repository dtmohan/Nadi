// Parashari dasa effects: BPHS ch. 47 (dasa effects by placement), ch. 48 (dasas of house lords and their
// relationships), ch. 52-60 (antar dasas) and ch. 61 (pratyantar general effects). Santhanam translation,
// jyotishvidya.com. Rules are evaluated on whole-sign houses from the Lahiri lagna. Verses that hinge on "strong"
// or "weak" are matched on dignity; the Shadbala of ch. 27, when supplied, is added as its own note against the
// requirement of 27.32-33 so the two measures stay visible side by side.
import {
  dignityOf,
  houseFrom,
  norm360,
  EXALTATION,
  SIGN_LORD,
  SIGNS,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { BPHS_URL, LAGNA_NATURE } from "./parashari-data";
import type { Vimshottari } from "./kp";
import { antarasOf, VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS } from "./kp";
import { DateTime } from "luxon";
import {
  ANTAR_DASA,
  PRATYANTAR,
  SOOKSHMA,
  PRANA,
  type AntarEntry,
} from "./parashari-dasa-data";
import { redactProse } from "./life-stage";
import { withGloss, withGlossList } from "./house-gloss";
import {
  compoundRelation,
  type Seven,
  type ShadbalaResult,
  type PlanetShadbala,
  type IshtaKashta,
  type DasaStartTransit,
} from "./shadbala";
import { PHALADEEPIKA_CH7_URL, type NeechaBhanga } from "./neechabhanga";
import { parashariCombust, parashariCombustOrb, type VargasResult, type SchemeScore } from "./vargas";
import { bhavaAnnotation, CHALIT_SOURCES, type ChalitResult } from "./chalit";
import type { AshtakavargaResult } from "./ashtakavarga";

export type Tone = "support" | "strain" | "mixed";

/**
 * How a dasa leans, from the tones of its lines. Parashara judges a period by which side predominates
 * (BPHS 28.1 and 28.11-12), not by every line agreeing. The app counts the lines: favourable when the
 * favourable lines outnumber the trying ones three to one or more, leaning favourable at three to two or
 * more, balanced in between, and the same the other way. Mixed lines count for neither side. Fewer than
 * three decisive lines can lean but not decide. Counting lines rather than weighing them, and both ratios,
 * are the app's convention (provisional).
 */
export type LeanStep =
  | "favourable"
  | "leans-favourable"
  | "balanced"
  | "leans-trying"
  | "trying";
export interface DasaLean {
  step: LeanStep;
  /** Lines that favour the period. */
  favour: number;
  /** Lines that go against it. */
  against: number;
}

export function leanOf(tones: readonly Tone[]): DasaLean {
  const favour = tones.filter((t) => t === "support").length,
    against = tones.filter((t) => t === "strain").length;
  const decided = favour + against >= 3;
  // Integer forms of (favour - against) / (favour + against) >= 1/2 and >= 1/5.
  const step: LeanStep =
    favour + against === 0
      ? "balanced"
      : decided && favour >= 3 * against
        ? "favourable"
        : 2 * favour >= 3 * against
          ? "leans-favourable"
          : decided && against >= 3 * favour
            ? "trying"
            : 2 * against >= 3 * favour
              ? "leans-trying"
              : "balanced";
  return { step, favour, against };
}

/** The three-way verdict the rest of the app reads: either favourable step is "support", either trying step "strain". */
export function verdictOfLean(l: DasaLean): Tone {
  return l.step === "favourable" || l.step === "leans-favourable"
    ? "support"
    : l.step === "trying" || l.step === "leans-trying"
      ? "strain"
      : "mixed";
}

/** Short label, for pills and table cells. */
export const LEAN_LABEL: Record<LeanStep, string> = {
  favourable: "favourable",
  "leans-favourable": "leans favourable",
  balanced: "balanced",
  "leans-trying": "leans trying",
  trying: "trying",
};
/** Pill text beside a period heading. */
export const LEAN_PILL: Record<LeanStep, string> = {
  favourable: "favourable on balance",
  "leans-favourable": "leans favourable",
  balanced: "balanced",
  "leans-trying": "leans trying",
  trying: "trying on balance",
};
/** Verb phrase after "it" or a period's name: "so on balance it leans favourable". */
export const LEAN_CLAUSE: Record<LeanStep, string> = {
  favourable: "reads favourable",
  "leans-favourable": "leans favourable",
  balanced: "is evenly balanced",
  "leans-trying": "leans trying",
  trying: "reads trying",
};
/** The lean with its counts: "leans favourable (5 favourable, 2 trying)", or "no clear lean" when no line takes a side. */
export function leanWithCounts(l: DasaLean): string {
  if (!l.favour && !l.against) return "no clear lean";
  return `${LEAN_LABEL[l.step]} (${l.favour} favourable, ${l.against} trying)`;
}

/**
 * After the minors' gate has dropped withheld lines (life-stage.ts), the lean and the antar verdicts are
 * recounted from what remains, so a withheld line cannot show through a tint or a pill.
 */
export function rejudgeAfterGate(readings: DasaReading[]): DasaReading[] {
  return readings.map((d) => {
    const lean = leanOf(countedTones(d.notes));
    return {
      ...d,
      lean,
      verdict: verdictOfLean(lean),
      antars: d.antars.map((a) => ({ ...a, verdict: antarVerdict(a.facts) })),
    };
  });
}

export interface DasaSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export interface DasaNote {
  id: string;
  /** Which chapter layer the note comes from. */
  layer:
    | "general"
    | "dignity"
    | "strength"
    | "ashtakavarga"
    | "planet"
    | "lordship"
    | "relation"
    | "condition"
    | "mantreswara";
  text: string;
  /** Shown in the practitioner reading only, after the text. */
  detail?: string;
  tone: Tone;
  source: DasaSource;
  /**
   * Set when the line is shown but left out of the lean, with the reason. Used for the BPHS 47 lines that fire on
   * combustion alone: combustion is counted once, by Phaladeepika 20.30 and 20.57 (provisional).
   */
  notCounted?: string;
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
  facts: {
    favourable: string[];
    adverse: string[];
    maraka: string | null;
    /** The plain wording of `maraka`; withheld with it under the sensitive-content gate (life-stage.ts). */
    marakaPlain?: string | null;
  };
  verdict: Tone;
  source: DasaSource;
  /** Only for the running antar: pratyantar general effects, ch. 61. */
  pratyantars?: {
    lord: Planet;
    start: string;
    end: string;
    current: boolean;
    text: string;
    source: DasaSource;
  }[];
}

export interface DasaReading {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  /** The five-step lean from the lines' tones (see leanOf). */
  lean: DasaLean;
  /** The lean as a three-way verdict (verdictOfLean). */
  verdict: Tone;
  /** Drekkana timing of the lord's results within the dasa, 47.3-4. */
  timing: {
    third: 1 | 2 | 3;
    reversed: boolean;
    text: string;
    source: DasaSource;
    /** 50.88: the lord's sign rises by the head (results at the commencement), the hind part (towards the end) or both. */
    rising: "head" | "hind" | "both";
  };
  notes: DasaNote[];
  antars: AntarReading[];
}

const S = (ch: number, verse: string, provisional?: boolean): DasaSource => ({
  label: `Parashara ${ch}.${verse}`,
  url: BPHS_URL(ch),
  provisional,
});

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const TRINE = [5, 9];
const DUSTHANA = [6, 8, 12];
const UPACHAYA = [3, 6, 10, 11];

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
const listH = (hs: number[]) =>
  hs.length ? hs.map(ord).join(" and ") : "no house";

/** Node dignities per 47.34-35 (exaltation Taurus/Scorpio, moolatrikona Gemini/Sagittarius, own Aquarius/Scorpio). */
function nodeDignity(
  p: Planet,
  sign: number,
): "Exalted" | "Moolatrikona" | "Own sign" | "Debilitated" | "Neutral" {
  if (p === "Rahu")
    return sign === 1
      ? "Exalted"
      : sign === 2
        ? "Moolatrikona"
        : sign === 10
          ? "Own sign"
          : sign === 7
            ? "Debilitated"
            : "Neutral";
  return sign === 7
    ? "Exalted"
    : sign === 8
      ? "Moolatrikona"
      : sign === 1
        ? "Debilitated"
        : "Neutral";
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
  /** Combust by the Surya Siddhanta orbs quoted under 7.28-29 (vargas.ts), not the Nadi 3°20'. */
  combust: (p: Planet) => boolean;
  withPlanet: (a: Planet, b: Planet) => boolean; // same sign, a != b
  withAny: (a: Planet, list: Planet[]) => Planet[];
  withMalefic: (a: Planet) => Planet[];
  withBenefic: (a: Planet) => Planet[];
  aspectedByBenefic: (a: Planet) => Planet[];
  aspectedByMalefic: (a: Planet) => Planet[];
  /** Rule aspect with the caller's floor applied. */
  aspect: (planet: Planet, fromSign: number, toSign: number) => number;
  isBenefic: (p: Planet) => boolean;
  waning: boolean;
  navamsaSign: (p: Planet) => number;
  yogakaraka: Planet[];
  /** Shadbala row for a planet when ch. 27 has been computed; nodes and missing data give undefined. */
  bala: (p: Planet) => PlanetShadbala | undefined;
  ishta: (p: Planet) => IshtaKashta | undefined;
  /** Where the dasa lord stands when its dasa begins (48.8), when the server supplied it. */
  transitAtStart: (p: Planet) => DasaStartTransit | undefined;
  /** Ashtakavarga of ch. 66-72, always available (needs only signs). */
  av: AshtakavargaResult | undefined;
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

function makeCtx(
  positions: PlanetPosition[],
  lagnaIdx: number,
  yogakaraka: Planet[],
  sb?: ShadbalaResult,
  starts?: DasaStartTransit[],
  av?: AshtakavargaResult,
  aspect: (
    planet: Planet,
    fromSign: number,
    toSign: number,
  ) => number = drishti,
): Ctx {
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const sun = pos("Sun"),
    moon = pos("Moon");
  const elong = (((moon.lon - sun.lon) % 360) + 360) % 360;
  const waning = elong >= 180;
  const isBenefic = (p: Planet) => {
    if (p === "Jupiter" || p === "Venus") return true;
    if (p === "Moon") return !waning;
    // 3.11: Mercury turns malefic in a malefic's company; the decreasing Moon is one of the malefics named there.
    if (p === "Mercury")
      return !positions.some(
        (x) =>
          x.signIndex === pos("Mercury").signIndex &&
          (["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(x.planet) ||
            (x.planet === "Moon" && waning)),
      );
    return false;
  };
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const lordOf = (h: number) => SIGN_LORD[(lagnaIdx + h - 1) % 12];
  const owns = (pl: Planet) =>
    pl === "Rahu" || pl === "Ketu"
      ? []
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => lordOf(h) === pl);
  const dignity = (pl: Planet) =>
    pl === "Rahu" || pl === "Ketu"
      ? nodeDignity(pl, pos(pl).signIndex)
      : pos(pl).dignity;
  const withAny = (a: Planet, list: Planet[]) =>
    list.filter((b) => b !== a && pos(b).signIndex === pos(a).signIndex);
  const all = positions.map((p) => p.planet);
  return {
    lagnaIdx,
    positions,
    pos,
    houseOf,
    lordOf,
    owns,
    dignity,
    strong: (pl) =>
      ["Exalted", "Moolatrikona", "Own sign"].includes(dignity(pl)),
    weak: (pl) =>
      ["Debilitated", "Inimical"].includes(dignity(pl)) ||
      parashariCombust(pos(pl), pos("Sun").lon),
    combust: (pl) => parashariCombust(pos(pl), pos("Sun").lon),
    withPlanet: (a, b) => a !== b && pos(a).signIndex === pos(b).signIndex,
    withAny,
    withMalefic: (a) => withAny(a, all).filter((b) => !isBenefic(b)),
    withBenefic: (a) => withAny(a, all).filter((b) => isBenefic(b)),
    aspectedByBenefic: (a) =>
      all.filter(
        (b) =>
          b !== a &&
          isBenefic(b) &&
          aspect(b, pos(b).signIndex, pos(a).signIndex) > 0,
      ),
    aspectedByMalefic: (a) =>
      all.filter(
        (b) =>
          b !== a &&
          !isBenefic(b) &&
          aspect(b, pos(b).signIndex, pos(a).signIndex) > 0,
      ),
    aspect,
    isBenefic,
    waning,
    navamsaSign: (pl) =>
      (pos(pl).signIndex * 9 + Math.floor(pos(pl).degInSign / (10 / 3))) % 12,
    yogakaraka,
    bala: (pl) => sb?.planets.find((x) => x.planet === pl),
    ishta: (pl) => sb?.ishta.find((x) => x.planet === pl),
    transitAtStart: (pl) => starts?.find((x) => x.lord === pl),
    av,
  };
}

// ---------- ch. 47: planet-specific dasa rules ----------
interface Rule {
  verse: string;
  when: (c: Ctx, p: Planet) => boolean;
  text: (c: Ctx, p: Planet) => string;
  tone: Tone;
  /** True when combustion is the only condition of `when` that holds; the line is then shown but not counted. */
  onlyCombust?: (c: Ctx, p: Planet) => boolean;
}

const PLANET_RULES: Record<Planet, Rule[]> = {
  Sun: [
    {
      verse: "7-11",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        KENDRA.includes(c.houseOf(p)) ||
        c.houseOf(p) === 11 ||
        c.withAny(p, [c.lordOf(9), c.lordOf(10)]).length > 0,
      text: (c, p) =>
        `The Sun ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : c.houseOf(p) === 11 ? "in the 11th" : "joined with the 9th or 10th lord"}: the dasa is said to bring wealth, standing and recognition from those in authority.`,
    },
    {
      verse: "8",
      tone: "support",
      when: (c, p) => c.withPlanet(p, c.lordOf(5)),
      text: (c) =>
        `Joined with the 5th lord ${c.lordOf(5)}: children are indicated.`,
    },
    {
      verse: "9",
      tone: "support",
      when: (c, p) => c.withPlanet(p, c.lordOf(2)),
      text: (c) => `Joined with the 2nd lord ${c.lordOf(2)}: gains of wealth.`,
    },
    {
      verse: "9",
      tone: "support",
      when: (c, p) => c.withPlanet(p, c.lordOf(4)),
      text: (c) =>
        `Joined with the 4th lord ${c.lordOf(4)}: comforts of conveyance.`,
    },
    {
      verse: "12-15",
      tone: "strain",
      when: (c, p) =>
        c.dignity(p) === "Debilitated" ||
        DUSTHANA.includes(c.houseOf(p)) ||
        c.withMalefic(p).length > 0 ||
        c.withAny(p, [c.lordOf(6), c.lordOf(8), c.lordOf(12)]).length > 0,
      text: (c, p) =>
        `The Sun ${c.dignity(p) === "Debilitated" ? "debilitated" : DUSTHANA.includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : "with a 6th, 8th or 12th lord"}: anxieties, losses, friction with kin and with authority, trouble to the father. ${c.aspectedByBenefic(p).length ? `A benefic aspect from ${c.aspectedByBenefic(p).join(", ")} gives some relief at times.` : c.aspectedByMalefic(p).length ? `The malefic aspect from ${c.aspectedByMalefic(p).join(", ")} keeps the results unfavourable.` : ""}`,
    },
  ],
  Moon: [
    {
      verse: "16-22",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        KENDRA.includes(c.houseOf(p)) ||
        [5, 9, 11].includes(c.houseOf(p)) ||
        c.withBenefic(p).length > 0 ||
        c.aspectedByBenefic(p).length > 0 ||
        c.withAny(p, [c.lordOf(10), c.lordOf(9), c.lordOf(4)]).length > 0,
      text: (c, p) =>
        `The Moon ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : [5, 9, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : "joined with the 10th, 9th or 4th lord"}: prosperity, good fortune, auspicious functions at home, children and conveyances are indicated through the dasa.${c.houseOf(p) === 2 ? " In the 2nd the gains are said to be exceptional." : ""}`,
    },
    {
      verse: "23",
      tone: "strain",
      when: (c, p) => c.waning || c.dignity(p) === "Debilitated",
      text: (c, p) =>
        `${c.waning ? "A waning Moon" : "A debilitated Moon"}: loss of wealth is indicated in the dasa.`,
    },
    {
      verse: "24",
      tone: "mixed",
      when: (c, p) => c.houseOf(p) === 3,
      text: () => "Moon in the 3rd: happiness comes and goes.",
    },
    {
      verse: "24-26",
      tone: "strain",
      when: (c, p) =>
        c.withMalefic(p).length > 0 ||
        (DUSTHANA.includes(c.houseOf(p)) && c.waning),
      text: (c, p) =>
        `Moon ${c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : `waning in the ${ord(c.houseOf(p))}`}: mental strain, trouble through subordinates and the mother, loss of wealth, friction with authority.`,
    },
    {
      verse: "26",
      tone: "mixed",
      when: (c, p) => DUSTHANA.includes(c.houseOf(p)) && !c.waning,
      text: (c, p) =>
        `A bright Moon in the ${ord(c.houseOf(p))}: troubles and good times alternate.`,
    },
  ],
  Mars: [
    {
      verse: "27-31",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        KENDRA.includes(c.houseOf(p)) ||
        [2, 11].includes(c.houseOf(p)) ||
        c.withBenefic(p).length > 0,
      text: (c, p) =>
        `Mars ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : [2, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `with ${c.withBenefic(p).join(", ")}`}: position, land and wealth, recognition, gains from abroad, good relations with siblings.${c.bala(p) ? ` The verse also asks for strength: Mars has ${c.bala(p)!.total.toFixed(0)} of ${c.bala(p)!.required} virupas${c.bala(p)!.strong ? ", so this condition holds" : ", short of the mark"}.` : " The verse also asks for a benefic navamsa and strength, which are not checked here."}`,
    },
    {
      verse: "32",
      tone: "mixed",
      when: (c, p) => KENDRA.includes(c.houseOf(p)) || c.houseOf(p) === 3,
      text: (c, p) =>
        `Mars in ${KENDRA.includes(c.houseOf(p)) ? "an angle" : "the 3rd"}: gains through courage, victory over rivals, happiness from spouse and children, with some unfavourable turn possible at the end of the dasa.`,
    },
    {
      verse: "33",
      tone: "strain",
      when: (c, p) =>
        c.dignity(p) === "Debilitated" ||
        c.weak(p) ||
        DUSTHANA.includes(c.houseOf(p)) ||
        c.withMalefic(p).length > 0 ||
        c.aspectedByMalefic(p).length > 0,
      onlyCombust: (c, p) =>
        c.combust(p) &&
        !["Debilitated", "Inimical"].includes(c.dignity(p)) &&
        !DUSTHANA.includes(c.houseOf(p)) &&
        c.withMalefic(p).length === 0 &&
        c.aspectedByMalefic(p).length === 0,
      text: (c, p) =>
        `Mars ${c.dignity(p) === "Debilitated" ? "debilitated" : c.weak(p) ? (c.dignity(p) === "Inimical" ? "inimical" : "combust") : DUSTHANA.includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : `aspected by ${c.aspectedByMalefic(p).join(", ")}`}: loss of wealth and distress are indicated.`,
    },
  ],
  Rahu: [
    {
      verse: "34-37",
      tone: "support",
      when: (c, p) => c.strong(p),
      text: (c, p) =>
        `Rahu ${c.dignity(p).toLowerCase()} (${SIGNS[c.pos(p).signIndex]}, per 47.34-35): wealth, conveyances through friends and authority, a new house, children, recognition from a foreign government.`,
    },
    {
      verse: "38-39",
      tone: "support",
      when: (c, p) =>
        (c.withBenefic(p).length > 0 ||
          c.aspectedByBenefic(p).length > 0 ||
          c.isBenefic(SIGN_LORD[c.pos(p).signIndex])) &&
        [1, 3, 4, 7, 10, 11].includes(c.houseOf(p)),
      text: (c, p) =>
        `Rahu in the ${ord(c.houseOf(p))} ${c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : "in a benefic's sign"}: comforts through authority, wealth from abroad, contentment at home.`,
    },
    {
      verse: "40",
      tone: "strain",
      when: (c, p) => [8, 12].includes(c.houseOf(p)),
      text: (c, p) =>
        `Rahu in the ${ord(c.houseOf(p))}: the dasa is described as troubled throughout.`,
    },
    {
      verse: "41-43",
      tone: "strain",
      when: (c, p) =>
        c.withMalefic(p).length > 0 ||
        c.withAny(p, [c.lordOf(2), c.lordOf(7)]).length > 0 ||
        c.dignity(p) === "Debilitated",
      text: (c, p) =>
        `Rahu ${c.dignity(p) === "Debilitated" ? "debilitated" : c.withMalefic(p).length ? `with ${c.withMalefic(p).join(", ")}` : "with a maraka lord"}: loss of position, trouble at home and to spouse and children. Loss at the start, some relief and gains at home in the middle, anxiety in the last part.`,
    },
  ],
  Jupiter: [
    {
      verse: "45-48",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        [5, 9, 10].includes(c.houseOf(p)) ||
        c.navamsaSign(p) === 8 ||
        c.navamsaSign(p) === 11 ||
        c.navamsaSign(p) === 3,
      text: (c, p) =>
        `Jupiter ${c.strong(p) ? "in dignity" : [5, 9, 10].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : "in its own or exalted navamsa"}: standing, recognition, conveyances, devotion, happiness through spouse and children.`,
    },
    {
      verse: "49-51",
      tone: "mixed",
      when: (c, p) =>
        c.dignity(p) === "Debilitated" ||
        c.combust(p) ||
        c.withMalefic(p).length > 0 ||
        [6, 8].includes(c.houseOf(p)),
      text: (c, p) =>
        `Jupiter ${c.dignity(p) === "Debilitated" ? "debilitated" : c.combust(p) ? "combust" : [6, 8].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `with ${c.withMalefic(p).join(", ")}`}: loss of residence, anxiety, trouble to children, pilgrimage. Parashara limits the bad results to the opening part; the later part brings gains and recognition.`,
    },
  ],
  Saturn: [
    {
      verse: "53-56",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        c.dignity(p) === "Friendly" ||
        [3, 11].includes(c.houseOf(p)) ||
        c.navamsaSign(p) === 9 ||
        c.navamsaSign(p) === 10 ||
        c.navamsaSign(p) === 6,
      text: (c, p) =>
        `Saturn ${c.strong(p) ? "in dignity" : c.dignity(p) === "Friendly" ? "in a friendly sign" : [3, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : "in its own or exalted navamsa"}: recognition, standing, success in learning, conveyances, wealth, property and children.`,
    },
    {
      verse: "57-58",
      tone: "strain",
      when: (c, p) =>
        DUSTHANA.includes(c.houseOf(p)) ||
        c.dignity(p) === "Debilitated" ||
        c.combust(p),
      onlyCombust: (c, p) =>
        c.combust(p) &&
        !DUSTHANA.includes(c.houseOf(p)) &&
        c.dignity(p) !== "Debilitated",
      text: (c, p) =>
        `Saturn ${c.dignity(p) === "Debilitated" ? "debilitated" : c.combust(p) ? "combust" : `in the ${ord(c.houseOf(p))}`}: illness, injury, separation from the father, trouble to spouse and children, displeasure of authority.`,
    },
    {
      verse: "59-60",
      tone: "support",
      when: (c, p) =>
        c.withBenefic(p).length > 0 ||
        c.aspectedByBenefic(p).length > 0 ||
        KENDRA.includes(c.houseOf(p)) ||
        TRINE.includes(c.houseOf(p)) ||
        [8, 11].includes(c.pos(p).signIndex),
      text: (c, p) =>
        `Saturn ${c.withBenefic(p).length ? `with ${c.withBenefic(p).join(", ")}` : c.aspectedByBenefic(p).length ? `aspected by ${c.aspectedByBenefic(p).join(", ")}` : KENDRA.includes(c.houseOf(p)) ? "in an angle" : TRINE.includes(c.houseOf(p)) ? "in a trine" : `in ${SIGNS[c.pos(p).signIndex]}`}: standing, conveyances and clothes are indicated.`,
    },
  ],
  Mercury: [
    {
      verse: "62-65",
      tone: "support",
      when: (c, p) =>
        c.strong(p) ||
        c.dignity(p) === "Friendly" ||
        [5, 9, 11].includes(c.houseOf(p)) ||
        c.aspectedByBenefic(p).length > 0 ||
        c.owns(p).includes(10),
      text: (c, p) =>
        `Mercury ${c.strong(p) ? "in dignity" : c.dignity(p) === "Friendly" ? "in a friendly sign" : [5, 9, 11].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : c.owns(p).includes(10) ? "as 10th lord" : `aspected by ${c.aspectedByBenefic(p).join(", ")}`}: wealth, reputation, learning, favour of authority, happiness through spouse and children, health and business profits.${c.houseOf(p) === 9 || c.owns(p).includes(10) || c.aspectedByBenefic(p).length ? " The 9th placement, 10th lordship or benefic aspect brings the good results in full." : ""}`,
    },
    {
      verse: "66",
      tone: "strain",
      when: (c, p) => c.withMalefic(p).length > 0,
      text: (c, p) =>
        `Mercury with ${c.withMalefic(p).join(", ")}: penalties from authority, friction with kin, travel abroad, dependence on others, urinary trouble.`,
    },
    {
      verse: "67-68",
      tone: "strain",
      when: (c, p) => DUSTHANA.includes(c.houseOf(p)),
      text: (c, p) =>
        `Mercury in the ${ord(c.houseOf(p))}: loss of wealth through indulgence, rheumatic or bilious illness, theft, loss of land.`,
    },
    {
      verse: "69-70",
      tone: "mixed",
      when: () => true,
      text: () =>
        "Sequence within the Mercury dasa: gains, learning and children at the start, recognition in the middle, distress in the last part.",
    },
  ],
  Ketu: [
    {
      verse: "72-74",
      tone: "support",
      when: (c, p) =>
        KENDRA.includes(c.houseOf(p)) ||
        TRINE.includes(c.houseOf(p)) ||
        c.houseOf(p) === 11 ||
        c.strong(p) ||
        c.isBenefic(SIGN_LORD[c.pos(p).signIndex]),
      text: (c, p) =>
        `Ketu ${c.strong(p) ? `${c.dignity(p).toLowerCase()} (${SIGNS[c.pos(p).signIndex]}, per 47.34-35)` : KENDRA.includes(c.houseOf(p)) ? "in an angle" : TRINE.includes(c.houseOf(p)) ? "in a trine" : c.houseOf(p) === 11 ? "in the 11th" : "in a benefic's sign"}: cordial relations with authority, leadership, conveyances, gains from abroad, happiness from children and spouse.`,
    },
    {
      verse: "75",
      tone: "support",
      when: (c, p) => [3, 6, 11].includes(c.houseOf(p)),
      text: (c, p) =>
        `Ketu in the ${ord(c.houseOf(p))}: standing, good friends and prized possessions.`,
    },
    {
      verse: "76",
      tone: "mixed",
      when: () => true,
      text: () =>
        "Sequence within the Ketu dasa: a raja-yoga tone at the start, apprehension in the middle, ailments and distant journeys in the last part.",
    },
    {
      verse: "77",
      tone: "strain",
      when: (c, p) =>
        [2, 8, 12].includes(c.houseOf(p)) || c.aspectedByMalefic(p).length > 0,
      text: (c, p) =>
        `Ketu ${[2, 8, 12].includes(c.houseOf(p)) ? `in the ${ord(c.houseOf(p))}` : `aspected by ${c.aspectedByMalefic(p).join(", ")}`}: confinement, loss of kin and residence, anxiety, poor company, disease.`,
    },
  ],
  Venus: [
    {
      verse: "79-80",
      tone: "support",
      when: (c, p) =>
        c.dignity(p) === "Exalted" ||
        c.dignity(p) === "Own sign" ||
        KENDRA.includes(c.houseOf(p)) ||
        TRINE.includes(c.houseOf(p)),
      text: (c, p) =>
        `Venus ${c.strong(p) ? "in dignity" : KENDRA.includes(c.houseOf(p)) ? "in an angle" : "in a trine"}: fine clothes and ornaments, conveyances, land, recognition, music and festivity.`,
    },
    {
      verse: "81-82",
      tone: "support",
      when: (c, p) => c.dignity(p) === "Moolatrikona",
      text: () =>
        "Venus in moolatrikona (Libra 0-15): position, a house, children and grandchildren, a marriage in the family, recovery of what was lost.",
    },
    {
      verse: "83-84",
      tone: "strain",
      when: (c, p) => DUSTHANA.includes(c.houseOf(p)),
      text: (c, p) =>
        `Venus in the ${ord(c.houseOf(p))}: friction with kin, trouble to the spouse, business losses, separations.`,
    },
    {
      verse: "85-87",
      tone: "support",
      when: (c, p) =>
        c.houseOf(p) === 4 || c.owns(p).includes(9) || c.owns(p).includes(10),
      text: (c, p) =>
        `Venus ${c.houseOf(p) === 4 ? "in the 4th" : `as ${listH(c.owns(p).filter((h) => h === 9 || h === 10))} lord`}: leadership, charitable works, energy in work, name and happiness through spouse and children. The verse reads the 4th placement together with 9th or 10th lordship; here ${c.houseOf(p) === 4 && (c.owns(p).includes(9) || c.owns(p).includes(10)) ? "both hold" : "only one of the two holds"}.`,
    },
    {
      verse: "88-89",
      tone: "strain",
      when: (c, p) => c.owns(p).includes(2) || c.owns(p).includes(7),
      text: (c, p) =>
        `Venus as ${listH(c.owns(p).filter((h) => h === 2 || h === 7))} lord: bodily pains and troubles; Mrityunjaya japa and charity are the stated remedies.`,
    },
  ],
};

// ---------- ch. 48.2-8: dasas of house lords ----------
/** 48.2-8: the period of each house's lord, house by house. */
export const HOUSE_LORD_DASA: { text: string; tone: Tone; verse: string }[] = [
  { verse: "2", tone: "support", text: "lord of the 1st: physical well-being" },
  {
    verse: "2",
    tone: "strain",
    text: "lord of the 2nd: distress and a threat to life (maraka)",
  },
  { verse: "3", tone: "strain", text: "lord of the 3rd: unfavourable results" },
  {
    verse: "3",
    tone: "support",
    text: "lord of the 4th: acquisition of house and land",
  },
  {
    verse: "4",
    tone: "support",
    text: "lord of the 5th: progress in learning, happiness from children",
  },
  {
    verse: "4",
    tone: "strain",
    text: "lord of the 6th: danger from enemies and ill health",
  },
  {
    verse: "5",
    tone: "strain",
    text: "lord of the 7th: distress to the spouse and a threat to life (maraka)",
  },
  {
    verse: "5",
    tone: "strain",
    text: "lord of the 8th: danger to life and financial losses",
  },
  {
    verse: "6",
    tone: "support",
    text: "lord of the 9th: learning, religious inclination, unexpected gains",
  },
  {
    verse: "6",
    tone: "support",
    text: "lord of the 10th: recognition and awards from authority",
  },
  {
    verse: "7",
    tone: "strain",
    text: "lord of the 11th: obstacles to gains and possible disease",
  },
  {
    verse: "7",
    tone: "strain",
    text: "lord of the 12th: distress and danger from disease",
  },
];

function relationNotes(c: Ctx, p: Planet): DasaNote[] {
  const out: DasaNote[] = [];
  const h = c.houseOf(p);
  const owns = c.owns(p);
  const l1 = c.lordOf(1),
    l4 = c.lordOf(4),
    l5 = c.lordOf(5),
    l9 = c.lordOf(9),
    l10 = c.lordOf(10);
  const isNode = p === "Rahu" || p === "Ketu";
  const push = (id: string, verse: string, text: string, tone: Tone, detail?: string) =>
    out.push({
      id: `${p}-${id}`,
      layer: "relation",
      text,
      ...(detail ? { detail } : {}),
      tone,
      source: S(48, verse),
    });

  // 48.1: exalted in an auspicious house overrides a malefic nature; debilitated in a bad house spoils a benefic.
  if (!isNode && c.dignity(p) === "Exalted" && !DUSTHANA.includes(h))
    push(
      "48-1",
      "1",
      `${p} is exalted in the ${ord(h)}: an exalted lord in an auspicious house gives favourable dasa results even if otherwise inauspicious.`,
      "support",
    );
  if (!isNode && c.dignity(p) === "Debilitated" && DUSTHANA.includes(h))
    push(
      "48-1b",
      "1",
      `${p} is debilitated in the ${ord(h)}: a lord debilitated in an inauspicious house gives adverse dasa results even if a benefic.`,
      "strain",
    );

  // 48.9-10: with the 5th lord; 9th/10th lord with 5th lord.
  if (p !== l5 && c.withPlanet(p, l5))
    push(
      "48-9",
      "9-10",
      `${p} is joined with the 5th lord ${l5}${owns.includes(9) || owns.includes(10) ? `, and as ${listH(owns.filter((x) => x === 9 || x === 10))} lord this makes the dasa beneficial` : ": any planet with the 5th lord gives a favourable dasa"}.`,
      "support",
    );
  // 48.11: 10th and 4th lords with the 9th lord.
  if (
    (owns.includes(10) || owns.includes(4)) &&
    p !== l9 &&
    c.withPlanet(p, l9)
  )
    push(
      "48-11",
      "11",
      `${p}, lord of the ${listH(owns.filter((x) => x === 4 || x === 10))}, is joined with the 9th lord ${l9}: a favourable dasa.`,
      "support",
    );
  // 48.12-13: kendra lord in trikona or trikona lord in kendra.
  const kInT = owns.some((x) => KENDRA.includes(x)) && TRINE.includes(h);
  const tInK = owns.some((x) => TRINE.includes(x)) && KENDRA.includes(h);
  if (kInT || tInK)
    push(
      "48-12",
      "12-13",
      `${p} is ${kInT ? `an angle lord (${listH(owns.filter((x) => KENDRA.includes(x)))}) placed in a trine` : `a trine lord (${listH(owns.filter((x) => TRINE.includes(x)))}) placed in an angle`}: the dasa is called extremely favourable.`,
      "support",
    );
  // 48.14: 6/8/12 lord with a trine lord.
  if (
    owns.some((x) => DUSTHANA.includes(x)) &&
    c.withAny(
      p,
      [l5, l9].filter((x) => x !== p),
    ).length
  )
    push(
      "48-14",
      "14",
      `${p}, a ${listH(owns.filter((x) => DUSTHANA.includes(x)))} lord, is joined with the trine lord ${c
        .withAny(
          p,
          [l5, l9].filter((x) => x !== p),
        )
        .join(", ")}: the dasa turns favourable.`,
      "support",
    );
  // 48.15: joined with a planet that is kendra-lord-in-trikona or trikona-lord-in-kendra.
  for (const q of c.positions.map((x) => x.planet)) {
    if (q === p || q === "Rahu" || q === "Ketu" || !c.withPlanet(p, q))
      continue;
    const qo = c.owns(q),
      qh = c.houseOf(q);
    if (
      (qo.some((x) => KENDRA.includes(x)) && TRINE.includes(qh)) ||
      (qo.some((x) => TRINE.includes(x)) && KENDRA.includes(qh))
    )
      push(
        `48-15-${q}`,
        "15",
        `${p} is joined with ${q}, an angle/trine lord placed in a trine/angle: the dasa of the companion is favourable too.`,
        "support",
      );
  }
  // 48.16: aspected by a kendra or trikona lord.
  const asp = c.positions
    .map((x) => x.planet)
    .filter(
      (q) =>
        q !== p &&
        !["Rahu", "Ketu"].includes(q) &&
        c.owns(q).some((x) => KENDRA.includes(x) || TRINE.includes(x)) &&
        c.aspect(q, c.pos(q).signIndex, c.pos(p).signIndex) > 0,
    );
  if (asp.length)
    push(
      "48-16",
      "16",
      `${p} receives the aspect of ${asp.join(", ")} (angle or trine lords): a favourable dasa.`,
      "support",
    );
  // 48.17: 9th lord in lagna and lagna lord in 9th; 10th lord in lagna and lagna lord in 10th.
  if ((p === l9 || p === l1) && c.houseOf(l9) === 1 && c.houseOf(l1) === 9)
    push(
      "48-17",
      "17",
      `Exchange of the 1st and 9th lords: the dasas of both ${l1} and ${l9} are extremely beneficial.`,
      "support",
    );
  if ((p === l10 || p === l1) && c.houseOf(l10) === 1 && c.houseOf(l1) === 10)
    push(
      "48-17b",
      "17",
      `Exchange of the 1st and 10th lords: high position in the dasas of both ${l1} and ${l10}.`,
      "support",
    );
  // 48.18: lords of 3/6/11, planets in 3/6/11, planets joined with them -> unfavourable (nodes exempt in those houses).
  const trishad = owns.filter((x) => [3, 6, 11].includes(x));
  if (trishad.length && !isNode)
    push(
      "48-18",
      "18",
      `${p} owns the ${listH(trishad)}: Parashara calls the dasas of 3rd, 6th and 11th lords unfavourable.`,
      "strain",
    );
  if ([3, 6, 11].includes(h))
    push(
      "48-18b",
      "18-20",
      isNode
        ? `${p} in the ${ord(h)}: a node in the 3rd, 6th or 11th is exempted and gives favourable results.`
        : `${p} occupies the ${ord(h)}: planets in the 3rd, 6th or 11th give unfavourable dasas.`,
      isNode ? "support" : "strain",
    );
  const withTri = c
    .withAny(
      p,
      c.positions.map((x) => x.planet),
    )
    .filter((q) =>
      [3, 6, 11].includes(c.houseOf(q))
        ? false
        : c.owns(q).some((x) => [3, 6, 11].includes(x)),
    );
  if (withTri.length && !trishad.length)
    push(
      "48-18c",
      "18",
      `${p} is joined with ${withTri.join(", ")} (3rd/6th/11th lord): the company makes the dasa unfavourable.`,
      "strain",
    );
  // 48.19: with 2nd/7th lords in the 2nd or 7th; placed in the 8th.
  const marakaCo = c
    .withAny(
      p,
      [c.lordOf(2), c.lordOf(7)].filter((x) => x !== p),
    )
    .filter(() => h === 2 || h === 7);
  if (marakaCo.length)
    push(
      "48-19",
      "19",
      `${p} is joined with ${marakaCo.join(", ")}, ${marakaCo.length > 1 ? "rulers" : "ruler"} of the ${listH(Array.from(new Set(marakaCo.flatMap((q) => c.owns(q).filter((x) => x === 2 || x === 7)))).sort((a, b) => a - b))}, in the ${withGloss("parashari", h)}: an unfavourable dasa.`,
      "strain",
      "The lords of the 2nd and 7th are the maraka lords (ch. 44).",
    );
  if (h === 8)
    push(
      "48-19b",
      "19",
      `${p} in the 8th: the dasa is listed as unfavourable.`,
      "strain",
    );
  return out;
}

// ---------- antar dasas, ch. 52-60 ----------
// ---------- 7.26-27 and 7.30-32: the period lord's twenty-point (Vimsopaka) strength ----------

const SCHEME_CHARTS: Record<SchemeScore["scheme"], string> = {
  shodasa: "sixteen",
  dasa: "ten",
  sapta: "seven",
  shad: "six",
};
/** The bands of 7.26-27 in gentle words. With the viswa of 7.24-25 the total cannot fall below 5. */
const BAND_SAYS: Record<SchemeScore["band"], string> = {
  "below five": "falls short of the strength to give its good results",
  "some good": "can give some good results",
  middling: "gives middling results",
  "wholly favourable": "can give its results in full",
};
const vimsopakaOf = (vargas: VargasResult | undefined, p: Planet) =>
  vargas?.planets.find((x) => x.planet === p)?.vimsopaka;
/** The sixteen-chart scheme is the app's choice; the verses do not name one. */
const v16Of = (vp?: SchemeScore[]) => vp?.find((x) => x.scheme === "shodasa");

function vimsopakaNote(p: Planet, vp: SchemeScore[]): DasaNote | undefined {
  const v16 = v16Of(vp);
  if (!v16) return undefined;
  const others = (["dasa", "sapta", "shad"] as const)
    .map((k) => vp.find((x) => x.scheme === k))
    .filter((x): x is SchemeScore => !!x)
    .map((x) => `${SCHEME_CHARTS[x.scheme]} charts ${x.total.toFixed(1)} (${x.band})`);
  return {
    id: `${p}-7-vimsopaka`,
    layer: "strength",
    tone:
      v16.band === "wholly favourable"
        ? "support"
        : v16.band === "below five"
          ? "strain"
          : "mixed",
    text: `Twenty-point strength ${v16.total.toFixed(1)} of 20 over the sixteen divisional charts: ${p} ${BAND_SAYS[v16.band]}. Parashara has the period's results declared by this strength (7.30-32), in the bands of 7.26-27.`,
    detail: `Other schemes: ${others.join(", ")}. The verses do not say which scheme to use; the sixteen-chart scheme is the app's choice.`,
    source: S(7, "26-27, 30-32", true),
  };
}

function antarFacts(
  c: Ctx,
  dasaLord: Planet,
  b: Planet,
  vp?: SchemeScore[],
): AntarReading["facts"] {
  const fav: string[] = [],
    adv: string[] = [];
  const h = c.houseOf(b);
  const fromD = houseFrom(c.pos(dasaLord).signIndex, c.pos(b).signIndex);
  const dig = c.dignity(b);
  if (KENDRA.includes(h) && TRIKONA.includes(h))
    fav.push("in the 1st (angle and trine)");
  else if (KENDRA.includes(h)) fav.push(`in an angle (${ord(h)})`);
  else if (TRINE.includes(h)) fav.push(`in a trine (${ord(h)})`);
  else if (h === 11) fav.push("in the 11th");
  if (["Exalted", "Moolatrikona", "Own sign"].includes(dig))
    fav.push(dig.toLowerCase());
  else if (dig === "Friendly") fav.push("in a friendly sign");
  if (b !== dasaLord) {
    if (fromD === 1) fav.push(`with the dasa lord ${dasaLord}`);
    else if (KENDRA.includes(fromD) || fromD === 9)
      fav.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
    else if (fromD === 5 || fromD === 11 || fromD === 3)
      fav.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
  }
  if (b !== c.lordOf(1) && c.withPlanet(b, c.lordOf(1)))
    fav.push(`joined with the lagna lord ${c.lordOf(1)}`);
  if (c.yogakaraka.includes(b))
    fav.push(
      LAGNA_NATURE[c.lagnaIdx]?.byRule?.includes(b)
        ? "a yogakaraka for this lagna, owning a kendra and a trikona (34.13-14)"
        : "a yogakaraka for this lagna (34.19-44)",
    );
  else if (LAGNA_NATURE[c.lagnaIdx]?.yogaPair?.includes(b)) {
    const pair = LAGNA_NATURE[c.lagnaIdx]!.yogaPair!;
    fav.push(
      `one half of this lagna's raja-yoga pair with ${pair[0] === b ? pair[1] : pair[0]} (${LAGNA_NATURE[c.lagnaIdx]!.verses}); the verse names the two in the dual, and neither owns both a kendra and a trikona alone`,
    );
  }
  if (c.withBenefic(b).length) fav.push(`with ${c.withBenefic(b).join(", ")}`);
  if (c.aspectedByBenefic(b).length)
    fav.push(`aspected by ${c.aspectedByBenefic(b).join(", ")}`);
  if (
    (b === "Rahu" || b === "Ketu") &&
    UPACHAYA.includes(h) &&
    !fav.some((f) => f.startsWith("in the 11th") || f.startsWith("in an angle"))
  )
    fav.push(`in an upachaya (${ord(h)}), which the chapters allow the nodes`);

  if (DUSTHANA.includes(h)) adv.push(`in the ${ord(h)} from the lagna`);
  if (b !== dasaLord && DUSTHANA.includes(fromD))
    adv.push(`${ord(fromD)} from the dasa lord ${dasaLord}`);
  if (dig === "Debilitated") adv.push("debilitated");
  else if (dig === "Inimical") adv.push("in an inimical sign");
  if (c.combust(b)) adv.push("combust");
  if (b === "Moon" && c.waning) adv.push("waning");
  if (b !== dasaLord && SEVEN_50.includes(b) && SEVEN_50.includes(dasaLord)) {
    const rel = compoundRelation(
      b as Seven,
      dasaLord as Seven,
      c.pos(b).signIndex,
      c.pos(dasaLord).signIndex,
    );
    if (rel === "great friend" || rel === "friend")
      fav.push(
        `a ${rel} of the dasa lord by natural and temporal relation (50.89)`,
      );
    else if (rel === "enemy" || rel === "great enemy")
      adv.push(
        `${rel === "enemy" ? "an enemy" : "a great enemy"} of the dasa lord by natural and temporal relation (50.89)`,
      );
  }
  if (c.withMalefic(b).length) adv.push(`with ${c.withMalefic(b).join(", ")}`);
  const mk = c.owns(b).filter((x) => x === 2 || x === 7);
  const inMk = (b === "Rahu" || b === "Ketu") && (h === 2 || h === 7);
  const maraka = mk.length
    ? `owns the ${listH(mk)} (maraka house)`
    : inMk
      ? `occupies the ${ord(h)} (maraka house)`
      : null;
  const marakaPlain = mk.length
    ? `rules the ${withGlossList("parashari", mk, { the: true })}, ${mk.length > 1 ? "the two houses" : "one of the two houses"} ch. 44 reads for strain on health`
    : inMk
      ? `stands in the ${withGloss("parashari", h)}, one of the two houses ch. 44 reads for strain on health`
      : null;
  // 7.30-32: the twenty-point strength decides the period only at the ends of the bands of 7.26-27.
  const v16 = v16Of(vp);
  if (v16?.band === "wholly favourable")
    fav.push(
      `twenty-point strength ${v16.total.toFixed(1)} of 20, enough to give its results in full (7.26-27)`,
    );
  else if (v16?.band === "below five")
    adv.push(
      `twenty-point strength ${v16.total.toFixed(1)} of 20, short of the strength to give its good results (7.26-27)`,
    );
  return { favourable: fav, adverse: adv, maraka, marakaPlain };
}

function antarVerdict(f: AntarReading["facts"]): Tone {
  const s = f.favourable.length,
    n = f.adverse.length + (f.maraka ? 1 : 0);
  if (s && !n) return "support";
  if (n && !s) return "strain";
  if (s >= 3 && n <= 1 && !f.maraka) return "support";
  if (n >= 3 && s <= 1) return "strain";
  return "mixed";
}

/** BPHS ch. 4: signs rising by the head (Sirshodaya), by the hind part (Prishthodaya), or both (Pisces). */
const RISING_50: Record<number, "head" | "hind" | "both"> = {
  0: "hind",
  1: "hind",
  2: "head",
  3: "hind",
  4: "head",
  5: "head",
  6: "head",
  7: "head",
  8: "head",
  9: "hind",
  10: "head",
  11: "both",
};
const SEVEN_50: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

// ── Mantreswara's period rules: Phaladeepika ch. 20 (provisional) ──
// 20.22, first half: a vargottama planet's dasa is favourable; mixed when the planet is combust or debilitated.
// 20.30: a dasa gives all, three-quarters, half, a quarter, little or none of its good as the lord is exalted, in
// moolatrikona, own, friendly, inimical or debilitation signs, ill results the other way; a combust (mudha) planet
// gives as a debilitated one. 20.57: even debilitated, in an enemy's sign or combust, a planet in an auspicious sign or
// navamsa gives a mixed dasa whose good comes in its second half. Only the combustion clause of 20.30 makes a line;
// its scale is practitioner detail. "Auspicious" is read by dignity. Main periods only; the second half of 20.22 is
// left out. Combustion is counted once, here: a BPHS 47 line that fires on combustion alone is shown, not counted.
export const PHALADEEPIKA_CH20_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621592.html";
const PD20 = (label: string): DasaSource => ({
  label: `Phaladeepika ${label}`,
  url: PHALADEEPIKA_CH20_URL,
  provisional: true,
});
/** Why a BPHS 47 line that fires on combustion alone is shown but left out of the lean. */
export const COMBUST_COUNTED_ONCE =
  "Combustion is counted once, by Mantreswara's lines (Phaladeepika 20.30 and 20.57), which grade it by sign and navamsa.";
/** The tones the lean counts: every line except those shown but not counted. */
export function countedTones(notes: DasaNote[]): Tone[] {
  return notes.filter((n) => !n.notCounted).map((n) => n.tone);
}
const SCALE_20_30: Record<string, string> = {
  Exalted: "all of its good",
  Moolatrikona: "three-quarters of its good",
  "Own sign": "half of its good",
  Friendly: "a quarter of its good",
  Inimical: "little of its good",
  Debilitated: "none of its good",
};
const IN_SIGN: Record<string, string> = {
  Exalted: "in its exaltation sign",
  Moolatrikona: "in its moolatrikona",
  "Own sign": "in its own sign",
  Friendly: "in a friend's sign",
  Neutral: "in a neutral sign",
  Inimical: "in an enemy's sign",
  Debilitated: "in its debilitation sign",
};
/** 20.57's auspicious sign or navamsa, read by dignity (provisional). */
const AUSPICIOUS_20_57 = ["Exalted", "Moolatrikona", "Own sign", "Friendly"];
const NAV_SEAT: Record<string, string> = {
  Exalted: "its exaltation sign",
  Moolatrikona: "its own sign",
  "Own sign": "its own sign",
  Friendly: "a friend's sign",
};

function mantreswaraNotes(c: Ctx, p: Planet): DasaNote[] {
  const out: DasaNote[] = [];
  const pp = c.pos(p);
  const dig = c.dignity(p);
  const nav = c.navamsaSign(p);
  const combust = c.combust(p);
  if (nav === pp.signIndex) {
    const bad = combust ? "combust" : dig === "Debilitated" ? "debilitated" : null;
    out.push({
      id: `${p}-pd-20-22`,
      layer: "mantreswara",
      tone: bad ? "mixed" : "support",
      text: bad
        ? `${p} is vargottama, in ${SIGNS[pp.signIndex]} in both the birth chart and the navamsa, which Mantreswara reads as favourable; but it is ${bad}, so he reads the period as mixed.`
        : `${p} is vargottama, in ${SIGNS[pp.signIndex]} in both the birth chart and the navamsa: Mantreswara reads the period as favourable.`,
      source: PD20("20.22"),
    });
  }
  if (combust) {
    const sun = c.pos("Sun");
    const dist = Math.abs(((((pp.lon - sun.lon) % 360) + 540) % 360) - 180);
    const test = `Combust by the Surya Siddhanta distances quoted under BPHS 7.28-29: ${dist.toFixed(1)}° from the Sun, within ${parashariCombustOrb(pp)}°${pp.retrograde ? " for a retrograde planet" : ""}. The verses give no distances.`;
    const scale = SCALE_20_30[dig]
      ? `On the scale of 20.30, ${p} ${IN_SIGN[dig]} would give ${SCALE_20_30[dig]}; combust, it is read at the debilitation step, with none.`
      : `The scale of 20.30 gives no step for a neutral sign; combust, ${p} is read at the debilitation step, with none.`;
    const reversal =
      "Ill results run the other way, as the Sanskrit reads (śubham and aśubham agree with phalam, the result); the translation reverses the scale for malefics and lords of bad houses instead.";
    const navDig = dignityOf(p, nav, 15);
    const seat = AUSPICIOUS_20_57.includes(dig)
      ? `${IN_SIGN[dig]} (${SIGNS[pp.signIndex]})`
      : AUSPICIOUS_20_57.includes(navDig)
        ? `in the navamsa of ${NAV_SEAT[navDig]} (${SIGNS[nav]})`
        : null;
    if (seat)
      out.push({
        id: `${p}-pd-20-57`,
        layer: "mantreswara",
        tone: "mixed",
        text: `${p} is combust, which Mantreswara counts like debilitation, but it stands ${seat}: he reads the period as mixed, with its good results in the second half.`,
        detail: `${scale} ${reversal} "Auspicious" in 20.57 is read by dignity: its own, exaltation, moolatrikona or a friend's sign, in the birth chart or the navamsa; reading it as a benefic's sign is the alternative. ${test}`,
        source: PD20("20.30, 20.57"),
      });
    else
      out.push({
        id: `${p}-pd-20-30`,
        layer: "mantreswara",
        tone: "strain",
        text: `${p} is combust: Mantreswara counts the period as he counts a debilitated planet's, which holds back its good results.`,
        detail: `${scale} ${reversal} Neither its sign nor its navamsa (${SIGNS[nav]}) is auspicious by dignity, so 20.57 does not soften it. ${test}`,
        source: PD20("20.30"),
      });
  }
  return out;
}

/**
 * Ch. 50 read on the lord of a Vimshottari dasa: the eighteen conditions and the named dasas of 50.73-83, the
 * measure by angle, panaphara or apoklima (50.87), the Dharma lord and Jupiter (50.84), retrogression (50.85), the
 * rising of the lord's sign for timing (50.88), and the planet rules of 50.29-34, 50.43-44 and 50.46-47.
 */
function conditionNotes(c: Ctx, p: Planet): DasaNote[] {
  const out: DasaNote[] = [];
  const pp = c.pos(p);
  const h = c.houseOf(p);
  const note = (
    id: string,
    verse: string,
    text: string,
    tone: Tone,
    provisional?: boolean,
    detail?: string,
  ) =>
    out.push({
      id: `${p}-50-${id}`,
      layer: "condition",
      text,
      ...(detail ? { detail } : {}),
      tone,
      source: S(50, verse, provisional),
    });
  const ex = EXALTATION[p];
  if (ex) {
    // 50.73-83: where the lord stands on the circle from deep exaltation to deep debilitation and back.
    const exLon = ex.sign * 30 + ex.deg;
    const arc = norm360(pp.lon - exLon); // 0 at deep exaltation, 180 at deep debilitation
    const dig = c.dignity(p);
    const nearEx = arc <= 1 || arc >= 359,
      nearDeb = Math.abs(arc - 180) <= 1;
    const descending = arc > 1 && arc < 179;
    const name = nearEx
      ? "in deep exaltation"
      : nearDeb
        ? "Rikta, in deep debilitation"
        : descending
          ? "Avarohini (descending)"
          : "Arohini (ascending)";
    const grade = ["Exalted", "Friendly", "Moolatrikona", "Own sign"].includes(
      dig,
    )
      ? "Madhya"
      : ["Debilitated", "Inimical"].includes(dig)
        ? "Adhama"
        : "";
    const sb = c.bala(p);
    const tone: Tone =
      nearEx || (grade === "Madhya" && !descending)
        ? "support"
        : nearDeb || grade === "Adhama"
          ? "strain"
          : "mixed";
    note(
      "condition",
      "73-83",
      `${p} at ${pp.degInSign.toFixed(1)} deg of ${SIGNS[pp.signIndex]} is ${arc <= 180 ? arc.toFixed(0) : (360 - arc).toFixed(0)} deg ${arc <= 180 ? "past" : "short of"} its deep exaltation point (${ex.deg} deg of ${SIGNS[ex.sign]}), so its dasa is ${name}${grade ? `, and by its ${dig === "Own sign" ? "own" : dig === "Moolatrikona" ? "moolatrikona" : dig === "Inimical" ? "enemy's" : dig === "Friendly" ? "friend's" : dig.toLowerCase()} sign ${grade}` : ""}: ${nearEx ? `the text promises a kingdom and property${sb?.strong ? " to a lord that also has full Shadbala, as this one has" : ", full strength permitting"}` : nearDeb ? "disease, loss of wealth and danger, shown as written" : descending ? "results the name describes as descending, read as waning through the period" : "results the name describes as ascending, read as growing through the period"}${grade === "Madhya" ? "; moderately good effects" : grade === "Adhama" ? "; dangers, distress and sorrow" : ""}. The text names the conditions without degrees; the half-circle from deep exaltation to deep debilitation is taken as the descending arc, and one degree either side as the deep points.`,
      tone,
      true,
    );
  }
  // 50.87 the measure by house class.
  const cls = [1, 4, 7, 10].includes(h)
    ? "angle"
    : [2, 5, 8, 11].includes(h)
      ? "panaphara"
      : "apoklima";
  note(
    "87",
    "84-87",
    `${p} stands in the ${ord(h)}, ${cls === "angle" ? "an angle, so the dasa gives its effects in full" : cls === "panaphara" ? "a panaphara house, so the dasa gives its effects in medium measure" : "an apoklima house, so the dasa gives little of its effects"} (50.87).`,
    cls === "angle" ? "support" : cls === "panaphara" ? "mixed" : "strain",
  );
  // 50.84 the Dharma lord and Jupiter related to the lord.
  const l9 = c.lordOf(9);
  const related = (q: Planet) =>
    q !== p &&
    (c.withPlanet(p, q) ||
      [1, 4, 7, 10].includes(
        houseFrom(c.pos(p).signIndex, c.pos(q).signIndex),
      ) ||
      drishti(q, c.pos(q).signIndex, c.pos(p).signIndex) === 4);
  const rel = Array.from(new Set([l9, "Jupiter" as Planet])).filter(related);
  if (rel.length)
    note(
      "84",
      "84",
      `${rel.map((q) => `${q}${q === l9 ? ", lord of the 9th" : ""}`).join(" and ")} ${rel.length === 1 ? "is" : "are"} with ${p}, in an angle from it or in full aspect to it: the dasa turns auspicious and augments fortune (50.84).`,
      "support",
      true,
    );
  // 50.85 retrogression at birth.
  if (pp.retrograde && p !== "Rahu" && p !== "Ketu")
    note(
      "85",
      "85",
      `${p} is retrograde at birth; the text says a planet with a fortunate yoga gives its good effects when free of retrogression and direct, so the good of this dasa is read as delayed rather than denied (50.85).`,
      "mixed",
      true,
    );
  // 50.88 rising of the lord's sign for the timing of results.
  const r = RISING_50[pp.signIndex];
  note(
    "88",
    "88",
    `${SIGNS[pp.signIndex]}, the lord's sign, rises ${r === "head" ? "by the head (Sirshodaya), so the results come at the commencement of the dasa" : r === "hind" ? "by the hind part (Prishthodaya), so the results come towards the end of the dasa" : "by both (Ubhayodaya), so the results come in the middle of the dasa"} (50.88); the drekkana timing of 47.3-4 is read separately.`,
    "mixed",
  );
  // 50.29-32 an inimical sign.
  if (c.dignity(p) === "Inimical")
    note(
      "29",
      "29-32",
      `${p} stands in ${SIGNS[pp.signIndex]}, a sign of its enemy: a dasa full of adversities (50.29-32).`,
      "strain",
    );
  // 50.33-34 hemmed between benefics, or benefics in the 2nd, 3rd and 4th from it.
  const benAt = (k: number) =>
    c.positions
      .filter(
        (q) =>
          q.planet !== p &&
          q.signIndex === (pp.signIndex + k) % 12 &&
          c.isBenefic(q.planet),
      )
      .map((q) => q.planet);
  const hem2 = benAt(1),
    hem12 = benAt(11);
  if (hem2.length && hem12.length)
    note(
      "33",
      "33-34",
      `${p} is hemmed between benefics, ${hem12.join(", ")} in the 12th and ${hem2.join(", ")} in the 2nd from it${c.isBenefic(p) ? "" : ", which the text says turns even a malefic favourable"}: a favourable dasa (50.33-34).`,
      "support",
    );
  else if ([1, 2, 3].every((k) => benAt(k).length))
    note(
      "34",
      "33-34",
      `${p} has benefics in the 2nd, 3rd and 4th from it: a favourable dasa (50.34).`,
      "support",
    );
  if (c.yogakaraka.includes(p))
    note(
      "33y",
      "33",
      `${p} is a yogakaraka for this lagna, whose dasa the text calls favourable (50.33).`,
      "support",
    );
  else if (LAGNA_NATURE[c.lagnaIdx]?.yogaPair?.includes(p)) {
    const pair = LAGNA_NATURE[c.lagnaIdx]!.yogaPair!;
    note(
      "33p",
      "33",
      `${p} is one half of this lagna's raja-yoga pair with ${pair[0] === p ? pair[1] : pair[0]} (Parashara ${LAGNA_NATURE[c.lagnaIdx]!.verses}). The verse names the two in the dual; neither owns both a kendra and a trikona, so the yoga comes only from the pair, and reading ${p}'s dasa as favourable by 50.33 extends the single-planet rule.`,
      "support",
      true,
    );
  }
  // 50.43-44 a maraka house.
  if (h === 2 || h === 7)
    note(
      "43",
      "43-44",
      `${p} stands in the ${withGloss("parashari", h)}: where the dasa is otherwise favourable the text still warns of displeasure of those in power and loss of wealth (50.43-44).`,
      "strain",
      false,
      "The 2nd and 7th are the maraka houses of ch. 44.",
    );
  // 50.46-47 the end of Rahu's dasa.
  if (p === "Rahu") {
    const m5 = c.positions
      .filter(
        (q) =>
          q.planet !== "Rahu" &&
          houseFrom(pp.signIndex, q.signIndex) === 5 &&
          !c.isBenefic(q.planet),
      )
      .map((q) => q.planet);
    const m9 = c.positions
      .filter(
        (q) =>
          q.planet !== "Rahu" &&
          houseFrom(pp.signIndex, q.signIndex) === 9 &&
          !c.isBenefic(q.planet),
      )
      .map((q) => q.planet);
    note(
      "46",
      "46-47",
      `The text places loss, confinement, exile and great distress at the end of Rahu's dasa, shown as written${m5.length && m9.length ? `; with ${m5.join(", ")} in the 5th and ${m9.join(", ")} in the 9th from Rahu it calls these effects definite` : "; it calls them definite only when malefics stand in the 5th and 9th from Rahu, which they do not here"} (50.46-47).`,
      m5.length && m9.length ? "strain" : "mixed",
    );
  }
  return out;
}

/** All dasa readings for the Vimshottari sequence. */
export function computeDasaReadings(
  positions: PlanetPosition[],
  lagnaIdx: number,
  yogakaraka: Planet[],
  vim: Vimshottari,
  birthIso: string,
  asOfIso: string,
  shadbala?: ShadbalaResult,
  dasaStarts?: DasaStartTransit[],
  av?: AshtakavargaResult,
  neecha: NeechaBhanga[] = [],
  chalit?: ChalitResult,
  aspect: (
    planet: Planet,
    fromSign: number,
    toSign: number,
  ) => number = drishti,
  vargas?: VargasResult,
): DasaReading[] {
  const c = makeCtx(
    positions,
    lagnaIdx,
    yogakaraka,
    shadbala,
    dasaStarts,
    av,
    aspect,
  );
  const birth = DateTime.fromISO(birthIso),
    asOf = DateTime.fromISO(asOfIso);
  return vim.dasas.map((d) => {
    const p = d.lord;
    const pp = c.pos(p);
    const h = c.houseOf(p);
    const notes: DasaNote[] = [];
    // 47.5-6 general.
    if (h === 1 || c.strong(p) || c.dignity(p) === "Friendly")
      notes.push({
        id: `${p}-47-5`,
        layer: "general",
        tone: "support",
        text: `${p} is ${h === 1 ? "in the lagna" : c.strong(p) ? c.dignity(p).toLowerCase() : "in a friendly sign"} (${SIGNS[pp.signIndex]}): the general rule reads the dasa as favourable.`,
        source: S(47, "5-6"),
      });
    if (
      DUSTHANA.includes(h) ||
      c.dignity(p) === "Debilitated" ||
      c.dignity(p) === "Inimical"
    )
      notes.push({
        id: `${p}-47-6`,
        layer: "general",
        tone: "strain",
        text: `${p} is ${DUSTHANA.includes(h) ? `in the ${ord(h)}` : c.dignity(p).toLowerCase()}${DUSTHANA.includes(h) && ["Debilitated", "Inimical"].includes(c.dignity(p)) ? ` and ${c.dignity(p).toLowerCase()}` : ""}: the general rule reads the dasa as unfavourable.`,
        source: S(47, "5-6"),
      });
    // Neechabhanga (Phaladeepika 7.26-28): a debilitated lord whose debility is cancelled. Parashara's verses do not state it, so the note softens rather than removes the strain.
    const nb = neecha.find((x) => x.planet === p);
    if (nb && (nb.cancelled || nb.provisionalOnly)) {
      const met = nb.conditions.filter((x) => x.met);
      notes.push({
        id: `${p}-neecha`,
        layer: "dignity",
        tone: nb.cancelled ? "mixed" : "strain",
        text: nb.cancelled
          ? `${p}'s debilitation is cancelled: ${met
              .filter((x) => !x.provisional)
              .map((x) => x.text)
              .join(
                "; ",
              )} (Phaladeepika 7.26-28). Read the debilitation results of this dasa as softened, not removed; Parashara's dasa verses do not state the cancellation.`
          : `${p} is debilitated; only later-practice cancellations apply (${met.map((x) => x.text).join("; ")}), which the classical verses do not state. Shown for information, not applied.`,
        source: {
          label: nb.cancelled
            ? `Phaladeepika 7.${Array.from(
                new Set(
                  met
                    .filter((x) => !x.provisional)
                    .flatMap((x) =>
                      Array.from(x.source.matchAll(/7\.(\d+)/g)).map((m) =>
                        Number(m[1]),
                      ),
                    ),
                ),
              )
                .sort((a, b) => a - b)
                .join(", 7.")}`
            : "Later practice",
          url: PHALADEEPIKA_CH7_URL,
          provisional: !nb.cancelled,
        },
      });
    }
    // Bhava chalit colour on the lord's placement: annotation only, the 47.5-6 reading above stays whole-sign.
    const bhava = chalit ? bhavaAnnotation(chalit, p) : undefined;
    if (bhava)
      notes.push({
        id: `${p}-bhava`,
        layer: "general",
        tone: "mixed",
        text: bhava,
        source: { ...CHALIT_SOURCES.effect, provisional: true },
      });
    // ch. 27 strength against the requirement of 27.32-33.
    const sb = c.bala(p);
    if (sb) {
      const short = sb.components
        .filter((x) => !x.ok)
        .map((x) => `${x.name} ${x.value.toFixed(0)}/${x.required}`);
      notes.push({
        id: `${p}-27-bala`,
        layer: "strength",
        tone: sb.strong ? "support" : "strain",
        text: `Shadbala ${sb.total.toFixed(0)} virupas against the ${sb.required} required for ${p} (${(sb.ratio * 100).toFixed(0)}%): ${sb.strong ? "strong, so the dasa lord can deliver what the verses promise" : "below the mark, so the verses' results arrive in reduced measure"}.${short.length ? ` Components short of 27.34-36: ${short.join(", ")}.` : " Every named component meets its own requirement (27.34-36)."}`,
        source: S(27, "32-36"),
      });
      const ik = c.ishta(p);
      if (ik) {
        notes.push({
          id: `${p}-28-ishta`,
          layer: "strength",
          tone: ik.tendency === "benefic" ? "support" : "strain",
          text: `Ishta phala ${ik.ishta.toFixed(0)}, Kashta phala ${ik.kashta.toFixed(0)} (Uchcha rasmi ${ik.uchchaRasmi.toFixed(1)}, Chesta rasmi ${ik.chestaRasmi.toFixed(1)}): the ${ik.tendency} tendency prevails, which Parashara names as the ground for judging a dasa good or bad (28.1). Saptavarga subhanka ${ik.saptavargaSubha.toFixed(0)} against asubhanka ${ik.saptavargaAsubha.toFixed(0)} (28.7-10).`,
          source: S(28, "1-6"),
        });
      }
    } else if (p === "Rahu" || p === "Ketu") {
      notes.push({
        id: `${p}-27-bala`,
        layer: "strength",
        tone: "mixed",
        text: `${p} has no Shadbala: chapter 27 gives strengths for the seven planets only. Read its strength through its sign lord ${SIGN_LORD[pp.signIndex]}${c.bala(SIGN_LORD[pp.signIndex]) ? ` (${c.bala(SIGN_LORD[pp.signIndex])!.total.toFixed(0)} of ${c.bala(SIGN_LORD[pp.signIndex])!.required} virupas)` : ""}.`,
        source: S(27, "32-33", true),
      });
    }
    // 7.30-32: the period judged by the lord's twenty-point strength (seven planets only).
    {
      const vp = vimsopakaOf(vargas, p);
      const vn = vp && vimsopakaNote(p, vp);
      if (vn) notes.push(vn);
    }
    // 48.8: the lord's transit house when the dasa begins.
    const tr = c.transitAtStart(p);
    if (tr) {
      const th = ((tr.signIndex - lagnaIdx + 12) % 12) + 1;
      const good = [1, 4, 5, 7, 9, 10].includes(th),
        bad = [6, 8, 12].includes(th);
      notes.push({
        id: `${p}-48-transit`,
        layer: "general",
        tone: good ? "support" : bad ? "strain" : "mixed",
        text: `When this dasa begins ${p} transits ${SIGNS[tr.signIndex]}, the ${ord(th)} house from the natal lagna: ${good ? "an auspicious house (angle or trine), so Parashara expects favourable results from the period" : bad ? "the 6th, 8th or 12th, which he says yields only adverse results in the dasa" : "neither an angle or trine nor the 6th, 8th or 12th; the verse names only those, so the transit is read as neutral"}. He asks that birth placement and this transit both be weighed.`,
        source: S(48, "8", !good && !bad),
      });
      // 66.70-72 and 72.5: the same transit sign read by the lord's own Ashtakavarga and by the aggregate.
      const own = c.av?.charts.find((x) => x.owner === p);
      if (own && c.av) {
        const rk = own.rekhas[tr.signIndex],
          sv = c.av.sarva[tr.signIndex],
          band = c.av.band[tr.signIndex];
        // Five or more of eight favourable, four even, three or fewer adverse: the same count as the
        // Transits section (av-transit.ts) and the Panchanga pills (gochara-av.ts).
        notes.push({
          id: `${p}-66-transit`,
          layer: "ashtakavarga",
          tone:
            rk >= 5 && band !== "adverse"
              ? "support"
              : rk <= 3 || band === "adverse"
                ? "strain"
                : "mixed",
          text: `${SIGNS[tr.signIndex]} carries ${rk} of 8 rekhas in ${p}'s own Ashtakavarga (${rk >= 5 ? "a favourable transit sign" : rk <= 3 ? "a sign where its transit yields unfavourable results" : "an even sign, four rekhas against four dots"}, 66.70-72) and ${sv} in the aggregate, ${band === "favourable" ? "above 30 and favourable" : band === "medium" ? "between 25 and 30, medium" : "below 25 and adverse"} (72.3-5).`,
          detail:
            "The verses give the rule mark by mark; reading five or more of the eight as favourable, four as even and three or fewer as adverse is the app's count, as in the Transits section.",
          source: S(66, "70-72", true),
        });
      }
    }
    // 72.5-6: the natal sign of the dasa lord by the aggregate.
    if (c.av && p !== "Rahu" && p !== "Ketu") {
      const sv = c.av.sarva[pp.signIndex],
        band = c.av.band[pp.signIndex];
      const own = c.av.charts.find((x) => x.owner === p)!;
      notes.push({
        id: `${p}-72-natal`,
        layer: "ashtakavarga",
        tone:
          band === "favourable"
            ? "support"
            : band === "adverse"
              ? "strain"
              : "mixed",
        text: `At birth ${p} stands in ${SIGNS[pp.signIndex]} with ${sv} rekhas in the Sarvashtakavarga (${band}) and ${own.rekhas[pp.signIndex]} in its own chart: Parashara says a planet in a sign with a favourable count gives auspicious effects and in an unfavourable one evil results.`,
        source: S(72, "3-6"),
      });
    }
    // 47 planet-specific.
    for (const r of PLANET_RULES[p] ?? [])
      if (r.when(c, p))
        notes.push({
          id: `${p}-47-${r.verse}`,
          layer: "planet",
          tone: r.tone,
          text: r.text(c, p),
          source: S(47, r.verse),
          ...(r.tone !== "mixed" && r.onlyCombust?.(c, p)
            ? { notCounted: COMBUST_COUNTED_ONCE }
            : {}),
        });
    // 48.2-8 lordship.
    for (const hh of c.owns(p)) {
      const e = HOUSE_LORD_DASA[hh - 1];
      notes.push({
        id: `${p}-48-h${hh}`,
        layer: "lordship",
        tone: e.tone,
        text: `As ${e.text}.`,
        source: S(48, e.verse),
      });
    }
    if (p === "Rahu" || p === "Ketu")
      notes.push({
        id: `${p}-node`,
        layer: "lordship",
        tone: "mixed",
        text: `${p} owns no house; read it through its sign lord ${SIGN_LORD[pp.signIndex]} (lord of the ${listH(c.owns(SIGN_LORD[pp.signIndex]))}) and the planets in its company (34.16-17).`,
        source: { label: "Parashara 34.16-17", url: BPHS_URL(34) },
      });
    notes.push(...relationNotes(c, p));
    notes.push(...conditionNotes(c, p));
    notes.push(...mantreswaraNotes(c, p));
    // 47.3-4 drekkana timing.
    const third = (Math.floor(pp.degInSign / 10) + 1) as 1 | 2 | 3;
    const reversed = pp.retrograde;
    const eff = reversed ? ([3, 2, 1][third - 1] as 1 | 2 | 3) : third;
    const when = eff === 1 ? "commencement" : eff === 2 ? "middle" : "end";
    const timing = {
      third: eff,
      reversed,
      text: `${p} at ${pp.degInSign.toFixed(1)} deg of ${SIGNS[pp.signIndex]} is in the ${ord(third)} drekkana${reversed ? ", retrograde, so the order reverses" : ""}: its results are felt mainly at the ${when} of the dasa.`,
      source: S(47, "3-4"),
      rising: RISING_50[pp.signIndex],
    };

    const lean = leanOf(countedTones(notes));

    // Antars.
    const bhuktis = vim.bhuktis.filter((b) => b.dasaLord === p);
    const antars: AntarReading[] = bhuktis.map((b) => {
      const bl = b.bhuktiLord ?? b.lord;
      const entry = ANTAR_DASA[p]?.[bl];
      const facts = antarFacts(c, p, bl, vimsopakaOf(vargas, bl));
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
          return {
            lord: a.lord,
            start: a.start,
            end: a.end,
            current: a.current,
            text: e?.text ?? "",
            source: S(61, e?.verse ?? "2"),
          };
        });
      }
      return reading;
    });

    return {
      lord: p,
      start: d.start,
      end: d.end,
      ageStart: d.ageStart,
      ageEnd: d.ageEnd,
      current: d.current,
      lean,
      verdict: verdictOfLean(lean),
      timing,
      notes,
      antars,
    };
  });
}

export interface FinePeriod {
  lord: Planet;
  start: string;
  end: string;
  current: boolean;
  text: string;
  source: DasaSource;
}

/**
 * Sub-periods of a Vimshottari period by the proportional rule of 62.1 and 63.1: each sub-period is the parent span
 * multiplied by the sub-lord's dasa years over 120, starting from the parent lord and following the dasa order.
 * `chain` is the list of lords from the maha dasa down to the parent (e.g. [dasa, antar, pratyantar] for sookshmas);
 * the parent's full span is rebuilt from its end so that a span clipped at birth still divides correctly.
 */
export function finePeriodsOf(
  chain: Planet[],
  parentEndIso: string,
  level: "sookshma" | "prana",
  birthIso: string,
  asOfIso: string,
  /** Sensitive-content gate: verse effects tagged longevity, loss or peril are withheld for a minor. */
  withhold = false,
): FinePeriod[] {
  const parent = chain[chain.length - 1];
  const fullDays = chain.reduce(
    (d, p) => (d * VIMSHOTTARI_YEARS[p]) / 120,
    120 * 365.25,
  );
  const end = DateTime.fromISO(parentEndIso);
  const birth = DateTime.fromISO(birthIso);
  const asOf = DateTime.fromISO(asOfIso);
  let t = end.minus({ days: fullDays });
  const idx = VIMSHOTTARI_ORDER.indexOf(parent);
  const table = level === "sookshma" ? SOOKSHMA : PRANA;
  const ch = level === "sookshma" ? 62 : 63;
  const out: FinePeriod[] = [];
  for (let k = 0; k < 9; k++) {
    const lord = VIMSHOTTARI_ORDER[(idx + k) % 9];
    const e = t.plus({ days: (fullDays * VIMSHOTTARI_YEARS[lord]) / 120 });
    if (e > birth) {
      const s = t < birth ? birth : t;
      const entry = table[parent]?.[lord];
      out.push({
        lord,
        start: s.toISO()!,
        end: e.toISO()!,
        current: asOf >= s && asOf < e,
        text: withhold ? redactProse(entry?.text ?? "") : (entry?.text ?? ""),
        source: S(ch, entry?.verse ?? "1"),
      });
    }
    t = e;
  }
  return out;
}

export const LAYER_LABEL: Record<DasaNote["layer"], string> = {
  general: "General rule (47.5-6)",
  dignity: "Cancelled debility (Phaladeepika 7)",
  strength: "Strength (ch. 7, 27-28)",
  ashtakavarga: "Ashtakavarga (ch. 66-72)",
  planet: "Placement (ch. 47)",
  lordship: "House lordship (48.2-8)",
  relation: "Relationships (48.9-20)",
  condition: "Condition of the lord (ch. 50)",
  mantreswara: "Mantreswara (Phaladeepika 20)",
};
