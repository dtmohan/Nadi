import { useMemo } from "react";
import type { ChartResult } from "@shared/schema";
import { normaliseParashariHouseMethod } from "@shared/schema";
import { synthesize } from "@shared/synthesis";
import { readAreas } from "@shared/jaimini-areas";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { computeKp } from "@shared/kp";
import { computeAgreement, type TopicAgreement } from "@shared/agreement";
import { areaSeason, lifeAsOf, sensitiveGate } from "@shared/life-stage";
import { useReadingMode } from "@/lib/reading-mode";

/** The cross-school agreement topics for a chart, shared by the Agreement panel and the Overview. */
export function useAgreement(result: ChartResult): TopicAgreement[] {
  const { mode } = useReadingMode();
  const plain = mode === "plain";
  const asOf = result.now.asOf;
  const lifeAt = lifeAsOf(result.chart, asOf);
  const withheld = sensitiveGate(result.chart, result.utc, asOf).withheld;
  return useMemo(() => {
    const bnn = synthesize(result.reading, result.reading.roles.gender);
    const jaimini = readAreas(result.jaimini, result.positions, withheld);
    const parashari = computeParashari(
      result.positions,
      result.jaimini.lagna.lon,
      result.utc,
      lifeAt,
      result.shadbala,
      result.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      withheld,
      normaliseParashariHouseMethod(result.chart.parashariHouseMethod),
    );
    const kp = computeKp(result.kp, result.utc, lifeAt, false, withheld);
    return computeAgreement({
      bnn,
      parashari,
      sarvartha: result.sarvartha,
      jaimini,
      kp,
      ayur: result.jaimini.ayur,
      withheld,
      plain,
      inSeason: (area) => areaSeason(area, result.utc, lifeAt).inSeason,
    });
  }, [result, lifeAt, withheld, plain]);
}
