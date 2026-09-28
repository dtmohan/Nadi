// Krishnamurti Paddhati: cusps, sub lords, significators and the findings per cusp.
import { fmtDeg } from "../astro";
import {
  computeKp,
  fmtHold,
  isConditional,
  nearestChangeText,
  KP_CONDITIONAL_SECONDS,
  KP_PRECEDENCE,
} from "../kp";
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
  short: "KP",
  tab: "kp",
  build(ctx) {
    const { result, S, cites, asOf, inSeason, withheld } = ctx;
    const kp = computeKp(result.kp, result.utc, asOf, false, withheld);
    const lagna = kp.cusps[0];
    const conditional = (kp.stability?.cusps ?? []).filter((p) =>
      isConditional(p),
    );
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Krishnamurti Paddhati divides each nakshatra into nine subs and judges a house by the sub lord of its cusp. The lagna cusp at ${fmtDeg(lagna.lon)} ${lagna.sign} falls in ${lagna.nakshatra}, star lord ${lagna.starLord}, sub lord ${lagna.subLord}.`,
        cites: [cites.add("Astro Secrets & KP, Part 1 (uploaded PDF)")],
      },
      {
        kind: "table",
        head: [
          "Cusp",
          "Sign and degree",
          "Star lord",
          "Sub lord",
          ...(kp.stability ? ["Sub lord holds (before / after)"] : []),
        ],
        rows: kp.cusps.map((c) => {
          const p = kp.stability?.cusps.find((x) => x.house === c.house);
          return [
            ORD(c.house),
            `${c.sign} ${fmtDeg(c.lon)}`,
            c.starLord,
            c.subLord,
            ...(kp.stability
              ? [
                  p
                    ? `${fmtHold(p.before)} / ${fmtHold(p.after)}${isConditional(p) ? " (conditional)" : ""}`
                    : "—",
                ]
              : []),
          ];
        }),
      },
      ...(kp.stability
        ? [
            {
              kind: "note" as const,
              text: `A cusp moves about a degree every four minutes and a sub spans 46' to 2°13', so a cusp sub lord holds for minutes; the books make a correct birth time the first condition of a reading. ${conditional.length ? `${conditional.length === 1 ? "One cusp" : `${conditional.length} cusps`} (${conditional.map((p) => ORD(p.house!)).join(", ")}) ${conditional.length === 1 ? "changes its" : "change their"} sub lord within ${KP_CONDITIONAL_SECONDS / 60} minutes of the recorded time, so ${conditional.length === 1 ? "its verdict is" : "their verdicts are"} conditional on the minute.` : `No cusp sub lord changes within ${KP_CONDITIONAL_SECONDS / 60} minutes of the recorded time.`} The Moon's sub lord ${nearestChangeText(kp.stability.moon)}. The two-minute margin is the app's convention.`,
              provisional: true,
              cites: [
                cites.add(
                  "Astro Secrets & KP, Part 1 pp. 172-173; Part 3 p. 12 (uploaded PDFs)",
                ),
              ],
            },
          ]
        : []),
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
      {
        kind: "note",
        text: "Where a matter's rules disagree, the principal cusp's sub lord read by its houses decides: marriage by the 7th, length of life by the lagna against the badhaka and maraka houses, children by the 5th, work by the 10th. The other reading is kept as a note and left out of the tally.",
        cites: [cites.add("Astro Secrets & KP, Part 3 p. 12 (uploaded PDF)")],
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
        paras: fs
          .slice()
          .sort(
            (a, b) =>
              Number(a.standing === "note") - Number(b.standing === "note"),
          )
          .map((f) => ({
            kind: "p" as const,
            text: S(
              f.standing === "note"
                ? `${f.topic}, as a note: ${endStop(f.text)} Overruled by the ${ORD(KP_PRECEDENCE.find((p) => p.topics.includes(f.topic))?.cusp ?? cusp)} cusp sub lord, the deciding factor for this matter; not counted.`
                : `${f.topic}: ${endStop(f.text)}`,
            ),
            cites: [
              cites.add(f.source, f.sourceUrl),
              ...(f.standing === "note"
                ? [cites.add("Astro Secrets & KP, Part 3 p. 12 (uploaded PDF)")]
                : []),
            ],
            aside: f.evidence,
            tone:
              f.standing === "note"
                ? ("mixed" as const)
                : f.polarity === "good"
                  ? ("support" as const)
                  : f.polarity === "bad"
                    ? ("strain" as const)
                    : ("mixed" as const),
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
