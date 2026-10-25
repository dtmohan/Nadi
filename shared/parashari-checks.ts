import { SIGNS, drishtiQuarters, type Planet, type PlanetPosition } from "./astro";
import { PARASHARI_HOUSE_METHOD_LABEL, type HouseView } from "./house-view";
import type { ShadbalaResult } from "./shadbala";
import { parashariCombust, parashariCombustOrb } from "./vargas";
import { houseGloss, withGlossList } from "./house-gloss";

/**
 * The shared checks behind the Parashari cards, read for one planet: house and lordship, dignity,
 * strength against the requirement (27.32-33), combustion by the Surya Siddhanta orbs of
 * 9.6-9, planetary war (27.20), aspects received (26.2-5) and planets in the same sign.
 *
 * They feed the folded "How this was found" panel on each card. A card's rule is a local check in
 * its own module and its branch-by-branch path is not recorded, so the panel shows these standard
 * checks for the planets the card names; the verse's own conditions are in the card's text.
 */

export type CheckKind =
  | "place"
  | "dignity"
  | "strength"
  | "combust"
  | "war"
  | "aspects"
  | "with";

export interface PlanetCheck {
  kind: CheckKind;
  /** Practitioner wording, with the figures and the verse. */
  text: string;
  /** Plain wording. */
  plain: string;
  /** The check tells against the planet: debilitated or in an enemy's sign, short of strength, combust, defeated in war. */
  against?: boolean;
  /** The full figures are in the strength table. */
  table?: "shadbala";
}

export interface ChecksInput {
  positions: PlanetPosition[];
  houseView: HouseView;
  /** Minimum aspect counted by the rules: 4 full only, 2 half or more, 1 any. */
  aspectFloor: 1 | 2 | 4;
  shadbala?: ShadbalaResult;
}

const ORDER: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
];

const FLOOR_LABEL: Record<1 | 2 | 4, string> = {
  4: "full aspects only",
  2: "half or stronger",
  1: "any aspect",
};

const ord = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Arc between two longitudes, 0 to 180. */
function arc(a: number, b: number): number {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
}

const fmt = (v: number) => v.toFixed(1);

/** A planet's name mid-sentence: "the Sun", "the Moon", otherwise the bare name. */
const nm = (p: Planet) => (p === "Sun" || p === "Moon" ? `the ${p}` : p);

function placeCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck {
  const { houseView } = inp;
  const h = houseView.houseOf(p);
  const owns: number[] = [];
  for (let k = 1; k <= 12; k++) if (houseView.lordOf(k) === p.planet) owns.push(k);
  const sign = SIGNS[p.signIndex];
  const byMethod =
    houseView.method === "rashi"
      ? ""
      : `; ${PARASHARI_HOUSE_METHOD_LABEL[houseView.method]}`;
  const gloss = houseGloss("parashari", h);
  const lords = owns.length ? `; lord of the ${withGlossList("parashari", owns, { the: true })}` : "";
  const retro = p.retrograde ? "; retrograde" : "";
  return {
    kind: "place",
    text: `${ord(h)} house (${gloss}${byMethod}), ${sign} ${p.degInSign.toFixed(1)}°${lords}${retro}.`,
    plain: `In the ${ord(h)} house (${gloss}), in ${sign}${
      owns.length ? `; it rules the ${withGlossList("parashari", owns, { the: true })}` : ""
    }${p.retrograde ? "; moving backward (retrograde)" : ""}.`,
  };
}

const DIGNITY_TEXT: Record<string, { text: string; plain: string; against?: boolean }> = {
  Exalted: { text: "Exalted.", plain: "Exalted: at its best by sign." },
  Moolatrikona: {
    text: "In its moolatrikona.",
    plain: "In its moolatrikona sign, next best to exaltation.",
  },
  "Own sign": { text: "In its own sign.", plain: "In its own sign." },
  Friendly: { text: "In a friend's sign.", plain: "In a friend's sign." },
  Neutral: { text: "In a neutral sign.", plain: "In a neutral sign." },
  Inimical: {
    text: "In an enemy's sign.",
    plain: "In an enemy's sign.",
    against: true,
  },
  Debilitated: {
    text: "Debilitated.",
    plain: "Debilitated: at its weakest by sign.",
    against: true,
  },
};

function dignityCheck(p: PlanetPosition): PlanetCheck | undefined {
  const d = DIGNITY_TEXT[p.dignity];
  if (!d) return undefined;
  return { kind: "dignity", text: d.text, plain: d.plain, against: d.against };
}

function strengthCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck | undefined {
  if (p.planet === "Rahu" || p.planet === "Ketu") {
    return {
      kind: "strength",
      text: "No Shadbala: chapter 27 measures the seven planets only.",
      plain: "Strength is not measured for the nodes.",
    };
  }
  const r = inp.shadbala?.planets.find((x) => x.planet === p.planet);
  if (!r) {
    return {
      kind: "strength",
      text: "Shadbala not computed for this chart (no ephemeris facts).",
      plain: "Strength could not be measured for this chart.",
    };
  }
  const pct = Math.round(r.ratio * 100);
  const parts = [
    `Sthana ${fmt(r.sthana.total)}`,
    `Dig ${fmt(r.dig)}`,
    `Kala ${fmt(r.kala.total)}`,
    `Chesta ${fmt(r.chesta)}`,
    `Naisargika ${fmt(r.naisargika)}`,
    `Drik ${fmt(r.drik)}`,
  ];
  if (r.yuddha) parts.push(`war ${r.yuddha > 0 ? "+" : ""}${fmt(r.yuddha)}`);
  const below = r.components.filter((c) => !c.ok);
  const partNote = below.length
    ? ` Below the part minimums of 27.34-36: ${list(
        below.map((c) => `${c.name} ${fmt(c.value)} of ${c.required}`),
      )}.`
    : " Every part meets its minimum (27.34-36).";
  return {
    kind: "strength",
    text: `Shadbala ${fmt(r.total)} of the ${r.required} virupas required (${pct}%), ${
      r.strong ? "strong" : "short"
    } (27.32-33): ${parts.join(", ")}.${partNote}`,
    plain: `${r.strong ? "Strong enough" : "Short of strength"}: a score of ${Math.round(
      r.total,
    )} against the ${r.required} Parashara asks of it (${pct}%).`,
    against: !r.strong,
    table: "shadbala",
  };
}

function combustCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck | undefined {
  const orb = parashariCombustOrb(p);
  const sun = inp.positions.find((x) => x.planet === "Sun");
  if (orb === undefined || !sun) return undefined;
  const d = arc(p.lon, sun.lon);
  const combust = parashariCombust(p, sun.lon);
  const retroOrb = p.retrograde ? " for a retrograde planet" : "";
  return combust
    ? {
        kind: "combust",
        text: `Combust: ${d.toFixed(1)}° from the Sun, inside the ${orb}° orb${retroOrb} (Surya Siddhanta orbs, 9.6-9).`,
        plain: `Combust: ${Math.round(d)} degrees from the Sun, close enough to be overpowered by it.`,
        against: true,
      }
    : {
        kind: "combust",
        text: `Not combust: ${d.toFixed(1)}° from the Sun, outside the ${orb}° orb${retroOrb}.`,
        plain: `Not combust: ${Math.round(d)} degrees from the Sun.`,
      };
}

function warCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck | undefined {
  const w = inp.shadbala?.wars.find(
    (x) => x.victor === p.planet || x.loser === p.planet,
  );
  if (!w) return undefined;
  const won = w.victor === p.planet;
  const other = won ? w.loser : w.victor;
  return {
    kind: "war",
    text: `Planetary war with ${other}, ${w.separation.toFixed(2)}° apart: ${
      won ? "wins, being further north" : "loses, being further south"
    } in latitude (27.20, by the Surya Siddhanta's rule of the northern planet). The difference of their Shadbala totals moves to the victor.`,
    plain: `In a planetary war with ${other}, within a degree of it: it ${won ? "wins" : "loses"}.`,
    against: !won,
  };
}

function aspectsCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck {
  const counted: string[] = [];
  const countedPlain: string[] = [];
  const weaker: string[] = [];
  for (const name of ORDER) {
    if (name === p.planet) continue;
    const q = inp.positions.find((x) => x.planet === name);
    if (!q) continue;
    const quarters = drishtiQuarters(q.planet, q.signIndex, p.signIndex);
    if (quarters <= 0) continue;
    const from = `${nm(q.planet)} from ${SIGNS[q.signIndex]}`;
    if (quarters >= inp.aspectFloor) {
      counted.push(quarters < 4 ? `${from} (${quarters} quarters)` : from);
      countedPlain.push(nm(q.planet));
    } else {
      weaker.push(`${nm(q.planet)} (${quarters} quarter${quarters > 1 ? "s" : ""})`);
    }
  }
  const setting = FLOOR_LABEL[inp.aspectFloor];
  const text = counted.length
    ? `Aspected by ${list(counted)} (26.2-5; counting ${setting}).`
    : `No aspect counted (26.2-5; counting ${setting}).`;
  const notCounted = weaker.length
    ? ` Weaker aspects not counted: ${list(weaker)}.`
    : "";
  const fully = inp.aspectFloor === 4 ? " in full" : "";
  return {
    kind: "aspects",
    text: text + notCounted,
    plain: counted.length
      ? `Looked at${fully} by ${list(countedPlain)}.`
      : `No planet looks at it${fully || " strongly enough to count"}.`,
  };
}

function withCheck(p: PlanetPosition, inp: ChecksInput): PlanetCheck | undefined {
  const others = ORDER.filter((name) => {
    if (name === p.planet) return false;
    const q = inp.positions.find((x) => x.planet === name);
    return q !== undefined && q.signIndex === p.signIndex;
  });
  if (!others.length) return undefined;
  return {
    kind: "with",
    text: `Shares ${SIGNS[p.signIndex]} with ${list(others.map(nm))}.`,
    plain: `Shares the sign with ${list(others.map(nm))}.`,
  };
}

/** The standard checks for one planet, in reading order. */
export function planetChecks(planet: Planet, inp: ChecksInput): PlanetCheck[] {
  const p = inp.positions.find((x) => x.planet === planet);
  if (!p) return [];
  return [
    placeCheck(p, inp),
    dignityCheck(p),
    strengthCheck(p, inp),
    combustCheck(p, inp),
    warCheck(p, inp),
    aspectsCheck(p, inp),
    withCheck(p, inp),
  ].filter((c): c is PlanetCheck => c !== undefined);
}

/** The checks for every planet of the chart. */
export function allPlanetChecks(
  inp: ChecksInput,
): Partial<Record<Planet, PlanetCheck[]>> {
  const out: Partial<Record<Planet, PlanetCheck[]>> = {};
  for (const planet of ORDER) {
    const c = planetChecks(planet, inp);
    if (c.length) out[planet] = c;
  }
  return out;
}
