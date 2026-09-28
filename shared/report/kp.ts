// Krishnamurti Paddhati: cusps, sub lords, significators and the findings per cusp.
import { fmtDeg } from "../astro";
import { computeKp } from "../kp";
import { HOUSE_AREA } from "../life-stage";
import {
  endStop,
  list,
  ORD,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

export const kpModule: ReportModule = {
  id: "kp",
  label: "KP: cusps and sub lords",
  tab: "kp",
  build(ctx) {
    const { result, S, cites, asOf, inSeason, withheld } = ctx;
    const kp = computeKp(result.kp, result.utc, asOf, false, withheld);
    const lagna = kp.cusps[0];
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Krishnamurti Paddhati divides each nakshatra into nine subs and judges a house by the sub lord of its cusp. The lagna cusp at ${fmtDeg(lagna.lon)} ${lagna.sign} falls in ${lagna.nakshatra}, star lord ${lagna.starLord}, sub lord ${lagna.subLord}.`,
        cites: [cites.add("Astro Secrets & KP, Part 1 (uploaded PDF)")],
      },
      {
        kind: "table",
        head: ["Cusp", "Sign and degree", "Star lord", "Sub lord"],
        rows: kp.cusps.map((c) => [
          ORD(c.house),
          `${c.sign} ${fmtDeg(c.lon)}`,
          c.starLord,
          c.subLord,
        ]),
      },
      {
        kind: "table",
        head: [
          "Planet",
          "Sign and degree",
          "In house",
          "Star lord",
          "Sub lord",
          "Signifies (A-D)",
        ],
        rows: kp.planets.map((p) => {
          const sig = kp.significators.find((s) => s.planet === p.planet);
          return [
            `${p.planet}${p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " R" : ""}`,
            `${p.sign} ${fmtDeg(p.lon)}`,
            ORD(p.house),
            p.starLord,
            p.subLord,
            sig ? sig.houses.join(", ") : "—",
          ];
        }),
      },
      {
        kind: "note",
        text: "Significators by the four steps of the class notes: the houses of the planet's star lord's occupation and ownership, then the planet's own. The Placidus cusps and the KP ayanamsa are those of the KP tab.",
        cites: [cites.add("KP class 3.1-3.2, 4.1 (uploaded PDFs)")],
      },
    ];
    const sub: ReportSection[] = [];
    const byCusp = new Map<number, typeof kp.findings>();
    for (const f of kp.findings)
      byCusp.set(f.cusp, [...(byCusp.get(f.cusp) ?? []), f]);
    const held: number[] = [];
    for (const [cusp, fs] of Array.from(byCusp.entries()).sort(
      (a, b) => a[0] - b[0],
    )) {
      const area = HOUSE_AREA[cusp];
      if (area && !inSeason(area)) {
        held.push(cusp);
        continue;
      }
      sub.push({
        id: `kp-${cusp}`,
        title: `The ${ORD(cusp)} cusp`,
        paras: fs.map((f) => ({
          kind: "p" as const,
          text: S(`${f.topic}: ${endStop(f.text)}`),
          cites: [cites.add(f.source, f.sourceUrl)],
          aside: f.evidence,
          tone:
            f.polarity === "good"
              ? "support"
              : f.polarity === "bad"
                ? "strain"
                : "mixed",
        })),
      });
    }
    if (held.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: the ${list(held.map(ORD))} cusp${held.length === 1 ? "" : "s"}.`,
      });
    return [
      {
        id: "kp",
        title: "The cusps and their sub lords",
        kicker: "Krishnamurti Paddhati",
        paras,
        sub,
      },
    ];
  },
};
