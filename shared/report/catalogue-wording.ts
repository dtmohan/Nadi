import { soften } from "../gentle";
import type { ReportPara } from "./types";

/** Catalogue findings use the same reading-mode wording as the ordinary report. */
export function catalogueWording(paras: ReportPara[], plain: boolean): ReportPara[] {
  if (!plain) return paras;
  return paras.map((p) => ({ ...p, text: p.text === undefined ? undefined : soften(p.text) }));
}
