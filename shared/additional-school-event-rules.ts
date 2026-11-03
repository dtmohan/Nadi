/** Existing BNN, Jaimini and Prasna natal findings carried into event work.
 * Broad area and house associations remain contextual; they do not become
 * event promises, horary judgments or a new combined score. */
import { EVENT_MATTERS } from "./events";
import { AREA_OF_RULE, type JaiminiArea } from "./jaimini-areas";
import type { JaiminiFinding, JaiminiResult } from "./jaimini";
import type { Finding, LifeArea, Reading } from "./rules";
import type { PrasnaHouseReading, PrasnaGulikaReading } from "./rules-prasna";
import type { GulikaNatalClues } from "./gulika-clues";
import { PARASHARI_EVENT_HOUSES } from "./parashari-event-natal-rules";
import { redactSensitive } from "./life-stage";
import type { GulikaMethod } from "./gulika-methods";
import type { KarmajivaCareerContext } from "./karmajiva";

export type EvidenceStatus = "assessed" | "unmapped" | "withheld";
export interface AdditionalSchoolNatalEvidence {
  matter: string;
  bnn: { status: EvidenceStatus; area?: LifeArea; findings: Finding[] };
  jaimini: { status: EvidenceStatus; area?: JaiminiArea; findings: JaiminiFinding[] };
  prasna: { status: EvidenceStatus; subjectHouse?: number; houseReading?: PrasnaHouseReading;
    gulikaMethod?: GulikaMethod; gulika?: PrasnaGulikaReading; gulikaClues?: GulikaNatalClues };
  brihatJataka?: { status: EvidenceStatus; career?: KarmajivaCareerContext };
}
export interface AdditionalSchoolSnapshots {
  bnn: Pick<Reading, "findings">;
  jaimini: Pick<JaiminiResult, "findings">;
  prasnaHouses: PrasnaHouseReading[];
  gulika?: PrasnaGulikaReading;
  gulikaClues?: GulikaNatalClues;
  gulikaMethod?: GulikaMethod;
  brihatJataka?: KarmajivaCareerContext;
  withhold?: boolean;
  allowed?: (matter: string) => boolean;
  areaAllowed?: (area: string) => boolean;
}

/** Use the same already evaluated ordinary readings, once per natal frame. */
export function createAdditionalSchoolNatalRules(snapshots: AdditionalSchoolSnapshots) {
  const bnn = snapshots.withhold ? redactSensitive(snapshots.bnn.findings) : snapshots.bnn.findings;
  const jai = snapshots.withhold ? redactSensitive(snapshots.jaimini.findings) : snapshots.jaimini.findings;
  const prasna = snapshots.withhold ? redactSensitive(snapshots.prasnaHouses) : snapshots.prasnaHouses;
  const cache = new Map<string, AdditionalSchoolNatalEvidence>();
  return (matter: string | undefined): AdditionalSchoolNatalEvidence | undefined => {
    if (!matter) return undefined;
    const cached = cache.get(matter);
    if (cached) return cached;
    const m = EVENT_MATTERS.find((v) => v.id === matter);
    const withheld = !!snapshots.allowed && !snapshots.allowed(matter);
    const bnnStatus: EvidenceStatus = withheld || !!(m && snapshots.areaAllowed && !snapshots.areaAllowed(m.bnn.area)) ? "withheld" : m ? "assessed" : "unmapped";
    const jStatus: EvidenceStatus = withheld || !!(m?.area && snapshots.areaAllowed && !snapshots.areaAllowed(m.area)) ? "withheld" : m?.area ? "assessed" : "unmapped";
    const house = PARASHARI_EVENT_HOUSES[matter];
    const pStatus: EvidenceStatus = withheld ? "withheld" : house ? "assessed" : "unmapped";
    // This is a livelihood reading, not a timing or job-loss judgment.
    const careerMatter = matter === "job" || matter === "business";
    const careerStatus: EvidenceStatus = withheld || !!(careerMatter && snapshots.areaAllowed && !snapshots.areaAllowed("career"))
      ? "withheld" : careerMatter && snapshots.brihatJataka ? "assessed" : "unmapped";
    const result: AdditionalSchoolNatalEvidence = {
      matter,
      bnn: { status: bnnStatus, area: m?.bnn.area, findings: bnnStatus === "assessed" ? bnn.filter((f) => f.area === m!.bnn.area).map(({ band: _band, ...f }) => f) : [] },
      jaimini: { status: jStatus, area: m?.area, findings: jStatus === "assessed" ? jai.filter((f) => AREA_OF_RULE[f.id] === m!.area) : [] },
      prasna: { status: pStatus, subjectHouse: house,
        ...(pStatus === "assessed" ? { houseReading: prasna.find((p) => p.house === house),
          gulikaMethod: snapshots.gulikaMethod,
          gulika: snapshots.gulika?.house === house ? snapshots.gulika : undefined,
          gulikaClues: matter === "child" ? snapshots.gulikaClues : undefined } : {}) },
      brihatJataka: { status: careerStatus, ...(careerStatus === "assessed" ? { career: snapshots.brihatJataka } : {}) },
    };
    cache.set(matter, result);
    return result;
  };
}
