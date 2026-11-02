/**
 * Qualified topic context from the ordinary Parashari house and yoga reading.
 * A house spans several subjects; inclusion is context, never an event verdict.
 */
import type { Planet } from "./astro";
import type { ParashariFinding, ParashariResult } from "./parashari";
import type { BhavaJudgement } from "./parashari-houses";

/** Primary D1 house for each event's broad subject, not a timing formula. */
export const PARASHARI_EVENT_HOUSES: Readonly<Record<string, number>> = {
  marriage: 7, child: 5, job: 10, "job-loss": 10, business: 10,
  property: 4, vehicle: 4, education: 4, abroad: 12, return: 4,
  illness: 6, accident: 8, father: 9, mother: 4, spouse: 7,
  move: 4, litigation: 6, loan: 6,
};

export interface ParashariCatalogueItem {
  role: "subject-house" | "subject-lord" | "connected-yoga";
  finding: ParashariFinding;
}
export interface ParashariNatalCatalogue {
  matter: string;
  status: "assessed" | "unmapped" | "withheld";
  subjectHouse?: number;
  /** The selected ordinary construction; event-research D1/Dn uses whole signs. */
  houseMethod: ParashariResult["houseMethod"];
  aspectFloor: ParashariResult["aspectFloor"];
  houseMethodNote?: string;
  assessment?: BhavaJudgement;
  rules: ParashariCatalogueItem[];
}
export interface ParashariDatedCatalogue {
  natal: ParashariNatalCatalogue;
  /** Explicitly named participants in ordinary findings; not a timing verdict. */
  periods: Array<{ level: "dasa" | "bhukti" | "antara"; planet: Planet; ruleIds: string[] }>;
}

/** Reuses the ordinary reading's already evaluated rules, conditions, sources,
 * counterindications and sensitivity filtering. The mapping does not turn a
 * whole-house result or a yoga involving its lord into an independent promise. */
export function createParashariNatalCatalogue(result: ParashariResult, allowed?: (matter: string) => boolean) {
  const cache = new Map<string, ParashariNatalCatalogue>();
  return (matter: string | undefined): ParashariNatalCatalogue | undefined => {
    if (!matter) return undefined;
    const cached = cache.get(matter);
    if (cached) return cached;
    const h = PARASHARI_EVENT_HOUSES[matter];
    const status = allowed && !allowed(matter) ? "withheld" : h ? "assessed" : "unmapped";
    const common = { matter, status, houseMethod: result.houseMethod, aspectFloor: result.aspectFloor,
      houseMethodNote: result.houseMethodNote } as const;
    if (status !== "assessed" || !h) {
      const out: ParashariNatalCatalogue = { ...common, rules: [] };
      cache.set(matter, out);
      return out;
    }
    const lord = result.bhavas.find((b) => b.house === h)?.lord;
    const rules: ParashariCatalogueItem[] = result.findings.flatMap<ParashariCatalogueItem>((finding) => {
      if (finding.kind === "house" && finding.house === h) return [{ role: "subject-house" as const, finding }];
      if (finding.kind === "lord" && finding.id.startsWith(`pa-lord-${h}-`)) return [{ role: "subject-lord" as const, finding }];
      if (finding.kind === "yoga" && lord && finding.planets.includes(lord)) return [{ role: "connected-yoga" as const, finding }];
      return [];
    });
    const out: ParashariNatalCatalogue = { ...common, subjectHouse: h,
      assessment: result.bhavaJudgement.find((b) => b.house === h), rules };
    cache.set(matter, out);
    return out;
  };
}

export function dateParashariNatalCatalogue(natal: ParashariNatalCatalogue | undefined,
  periods: [Planet, Planet, Planet] | null): ParashariDatedCatalogue | undefined {
  if (!natal) return undefined;
  const levels = ["dasa", "bhukti", "antara"] as const;
  return { natal, periods: (periods ?? []).map((planet, i) => ({ level: levels[i], planet,
    ruleIds: natal.rules.filter((rule) => rule.finding.planets.includes(planet)).map((rule) => rule.finding.id) })) };
}
