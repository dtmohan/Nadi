// The chart itself: the birth line and the positions table.
import { fmtDeg, SIGNS } from "../astro";
import { fmtDate, type ReportModule, type ReportPara } from "./types";

export const chartModule: ReportModule = {
  id: "chart",
  label: "The chart",
  tab: "chart",
  build(ctx) {
    const { result, deceased, age, birthLocal, lagnaIdx, pos } = ctx;
    const { chart, positions } = result;
    const moon = pos("Moon");
    const paras: ReportPara[] = [];
    paras.push({
      kind: "lead",
      text: `${chart.name} was born on ${birthLocal.toFormat("cccc d LLLL yyyy")} at ${birthLocal.toFormat("HH:mm")} in ${chart.place}, with ${SIGNS[lagnaIdx]} rising at ${fmtDeg(result.jaimini.lagna.lon)} and the Moon in ${moon.nakshatra}, pada ${moon.pada}, in ${moon.sign}. The clock used is ${result.timeBasis.label}; the sidereal positions follow the ${chart.ayanamsa} ayanamsa (${result.ayanamsaValue.toFixed(3)}°) with the ${chart.nodeType} node.${deceased ? ` A date of passing is recorded (${fmtDate(chart.deathDate!)}); the ages in this report stop there and nothing here is a forecast.` : ` The native is ${Math.floor(age)} at the time of writing.`}`,
    });
    paras.push({
      kind: "table",
      head: ["Planet", "Sign", "Degree", "Nakshatra", "Notes"],
      rows: positions.map((p) => [
        p.planet,
        p.sign,
        fmtDeg(p.lon),
        `${p.nakshatra} ${p.pada}`,
        [
          p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu"
            ? "retrograde"
            : "",
          p.combust ? "combust" : "",
          p.dignity !== "Neutral" && p.dignity !== "—"
            ? p.dignity.toLowerCase()
            : "",
        ]
          .filter(Boolean)
          .join(", "),
      ]),
    });
    return [{ id: "chart", title: "The chart", paras }];
  },
};
