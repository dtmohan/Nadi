// Prasna Marga's natal house walk, using exactly the inputs of the on-screen birth-chart view.
// The interactive question chart has a separate selected Arudha and is not part of this export.
import { computePrasna, computePrasnaFructification, PRASNA_BHAVA_SIGNIFICATIONS } from "../rules-prasna";
import { natalPlanetContext } from "../planet-context";
import { HOUSE_AREA, redactProse } from "../life-stage";
import { PRASNA_HOUSE_GLOSS } from "../house-gloss";
import { ORD, type ReportModule, type ReportPara } from "./types";

export const prasnaModule: ReportModule = {
  id: "prasna", label: "Prasna Marga: birth-chart houses", short: "Prasna Marga", tab: "prasna",
  build(ctx) {
    const { result, S, cites, withheld, inSeason } = ctx;
    const lagna = result.jaimini.lagna.signIndex;
    const readings = computePrasna(natalPlanetContext(result), lagna);
    const fructification = computePrasnaFructification(result.positions, result.reading.strength, lagna);
    const paras: ReportPara[] = [
      { kind: "lead", text: "These are the birth-chart houses counted from the natal rising sign. They are not a question-time chart and do not answer a horary question." },
      { kind: "note", text: "Each house covers several matters. The app's benefic/malefic classification and lord-and-karaka strength thresholds are provisional; empty houses are not negative conclusions.", provisional: true },
    ];
    for (const sig of PRASNA_BHAVA_SIGNIFICATIONS) {
      const h = sig.house;
      if (HOUSE_AREA[h] && !inSeason(HOUSE_AREA[h])) continue;
      const r = readings.find((x) => x.house === h);
      const f = fructification.find((x) => x.house === h);
      const clean = (s: string) => withheld ? redactProse(s) : s;
      const effects = ctx.plain ? [] : [r?.beneficText, r?.maleficText].filter((x): x is string => !!x).map(clean).filter(Boolean);
      paras.push({
        kind: "p", text: S(`${ORD(h)} house: ${ctx.plain ? PRASNA_HOUSE_GLOSS[h] : clean(sig.text)}. ${r ? `Occupants: ${r.occupants.map((p) => p.planet).join(", ")}.` : "No planet occupies this house."} ${effects.join(" ")} ${f ? ctx.plain ? "The ruler and significator are assessed for the whole house; this does not establish a specific outcome." : clean(f.note) : ""}`),
        cites: [cites.add(`Prasna Marga, B.V. Raman translation, ch. XIV, verses ${sig.stanza}, 39–41${r ? `, ${r.stanza}` : ""}`)], provisional: true,
      });
    }
    return [{ id: "prasna", title: "The birth-chart houses", kicker: "Prasna Marga", paras }];
  },
};
