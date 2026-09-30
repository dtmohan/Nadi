// Ashtalakshmi: the Venus-Lagna wealth reading of S. Prakash's DNA Astrology of
// Wealth (2022). Venus is Lakshmi; taking her as Lagna, each planet standing in
// set houses from Venus promises one of her eight forms. The house sets are the
// book's own chart configurations (pp. 53-91), read from the diagrams; the two
// 3rd-house readings the book's case studies add beyond the diagrams are carried
// as "case-study" and marked as such. The forms are broad by design — four to
// ten of the twelve houses qualify for each planet — so this is a
// promise-plus-timing reading, not a discriminator, and the notes say so.
//
// Provenance: a 2022 self-published research work, not a classical BNN text.
// Every form carries its page cite; nothing here is silent about its source.

import { houseFrom, type Planet, type PlanetPosition, type Sign } from "./astro";

export interface LakshmiForm {
  planet: Planet;
  form: string;
  /** Plain-language domain of the form. */
  domain: string;
  /** House of the planet from Venus (1 = conjunct her). */
  house: number;
  /** "diagram": the book's chapter configurations; "case-study": read in the book's own case studies beyond the diagrams. */
  via: "diagram" | "case-study";
  pages: string;
}

export interface LakshmiReading {
  venusSign: Sign;
  forms: LakshmiForm[];
  headline: string;
  notes: string[];
}

export type LakshmiPlanet = Exclude<Planet, "Venus">;

interface Spec {
  form: string;
  domain: string;
  /** Houses from Venus shown in the chapter's chart configurations. */
  houses: number[];
  /** Houses the case studies read but the diagrams do not show. */
  caseStudy?: number[];
  pages: string;
}

// House 1 means conjunct Venus. The book draws conjunction charts only for the
// Sun, the Moon, Mercury and Saturn; for Mars, Jupiter and the nodes it shows no
// conjunction, and their sets do not include the 1st — whether conjunction
// counts for them is unstated, so the engine stays with the drawn sets.
export const LAKSHMI_SPECS: Record<LakshmiPlanet, Spec> = {
  Sun: {
    form: "Vijaya / Rajya Lakshmi",
    domain: "victory, authority and royalty; the book adds that this pair can make the spouse and the father very powerful",
    houses: [1, 2, 3, 11, 12],
    pages: "DNA Astrology of Wealth, pp. 54-57",
  },
  Moon: {
    form: "Dhanya Lakshmi",
    domain: "harvest and grains: nourishment, food and steady sustenance",
    houses: [1, 2, 3, 4, 5, 7, 9, 11],
    pages: "DNA Astrology of Wealth, pp. 58-61",
  },
  Mars: {
    form: "Veera / Dhairya Lakshmi",
    domain: "valour, vigour and patience in trouble; wealth won through courage",
    houses: [2, 3, 4, 5, 9, 10, 11, 12],
    pages: "DNA Astrology of Wealth, pp. 62-64",
  },
  Mercury: {
    form: "Vidya Lakshmi",
    domain: "knowledge and learning: study, skill, teaching and trade",
    houses: [1, 2, 11, 12],
    caseStudy: [3],
    pages: "DNA Astrology of Wealth, pp. 65-69; the 3rd from Venus is case study 9, p. 193",
  },
  Jupiter: {
    form: "Santana Lakshmi",
    domain: "offspring and progeny; wealth that grows through the family line",
    houses: [2, 3, 4, 7, 9, 10, 12],
    pages: "DNA Astrology of Wealth, pp. 69-74",
  },
  Saturn: {
    form: "Aadi Lakshmi",
    domain: "wealth earned by dedication, hard work and honest effort",
    houses: [1, 2, 4, 5, 7, 8, 9, 10, 11, 12],
    caseStudy: [3],
    pages: "DNA Astrology of Wealth, pp. 75-82; the 3rd from Venus is case study 2, p. 177",
  },
  Rahu: {
    form: "Dhana Lakshmi",
    domain: "material wealth, often in magnitude or suddenness",
    houses: [2, 3, 5, 6, 8, 9, 10, 11],
    pages: "DNA Astrology of Wealth, pp. 82-88",
  },
  Ketu: {
    form: "Gaja Lakshmi",
    domain: "power and strength; wealth from position, force and detachment",
    houses: [2, 8, 9, 11, 12],
    pages: "DNA Astrology of Wealth, pp. 88-91",
  },
};

export function assessLakshmi(positions: PlanetPosition[]): LakshmiReading {
  const venus = positions.find((p) => p.planet === "Venus")!;
  const forms: LakshmiForm[] = [];

  for (const [planet, spec] of Object.entries(LAKSHMI_SPECS) as [LakshmiPlanet, Spec][]) {
    const pos = positions.find((p) => p.planet === planet);
    if (!pos) continue;
    const h = houseFrom(venus.signIndex, pos.signIndex);
    const via = spec.houses.includes(h)
      ? ("diagram" as const)
      : spec.caseStudy?.includes(h)
        ? ("case-study" as const)
        : undefined;
    if (via) {
      forms.push({
        planet,
        form: spec.form,
        domain: spec.domain,
        house: h,
        via,
        pages: spec.pages,
      });
    }
  }

  const names = forms.map((f) => f.form.split(" / ").pop()!.replace(" Lakshmi", ""));
  const headline =
    forms.length === 0
      ? `Venus in ${venus.sign} stands alone in the Lakshmi scheme: no planet occupies the houses the book sets for her forms. Wealth is read from the Rao/Naik combinations instead.`
      : forms.length === 1
        ? `Venus in ${venus.sign}: one of her eight forms stands in this chart — ${names[0]} Lakshmi, through ${forms[0].planet} in the ${ord(forms[0].house)} from Venus.`
        : `Venus in ${venus.sign}: ${forms.length} of her eight forms stand in this chart — ${list(names)} Lakshmi, each through its planet's place from Venus.`;

  const notes: string[] = [
    "Each form ripens in the dasha of its planet: the book times its first case to the Rahu mahadasha for Rahu in the 2nd from Venus (p. 173). The dasha years are shown beside each form.",
    "The house sets are broad — four to ten of the twelve houses from Venus qualify for each planet — so most charts carry several forms at once. This is a promise-and-timing reading, not a test; the book's own case 2 reads three forms together (p. 177).",
    "Source: S. Prakash, DNA Astrology of Wealth (2022) — a modern research work on Bhrigu Nandi Nadi, not a classical text. It is read alongside the Rao/Naik combinations, never in their place.",
  ];
  const ext = forms.filter((f) => f.via === "case-study");
  if (ext.length) {
    notes.push(
      `${list(ext.map((f) => `${f.planet} in the ${ord(f.house)} from Venus`))} ${ext.length === 1 ? "is" : "are"} read in the book's case studies though the chapter diagrams do not show ${ext.length === 1 ? "it" : "them"} — carried as case-study-supported.`,
    );
  }

  return { venusSign: venus.sign, forms, headline, notes };
}

function list(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function ord(h: number): string {
  return `${h}${["th", "st", "nd", "rd"][h % 10 < 4 && (h < 11 || h > 13) ? h % 10 : 0]}`;
}
