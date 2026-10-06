// Jaimini: karakas, padas, the Chara dasha and the life areas, from the same readings the tab shows.
import { fmtDeg, SIGNS } from "../astro";
import { CHARA_KARAKA_INFO } from "../jaimini";
import { readAreas } from "../jaimini-areas";
import { vimshottari, type KpPeriod } from "../kp";
import { lifePeriods } from "../life-stage";
import {
  endStop,
  fmtDate,
  fmtMonth,
  list,
  ORD,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

const SUTRAS_URL = "https://www.wisdomlib.org/hinduism/book/jaimini-sutras";

export const jaiminiModule: ReportModule = {
  id: "jaimini",
  label: "The Jaimini reading",
  short: "Jaimini",
  tab: "jaimini",
  build(ctx) {
    const { result, S, cites, lifeAt, deceased, inSeason, withheld, pos } = ctx;
    const { positions } = result;
    const j = result.jaimini;
    const ak = j.karakas[0];
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Jaimini ranks the planets by their degrees. ${ak.planet} is the Atmakaraka, the self; ${list(
          j.karakas
            .slice(1)
            .map((k) => `${k.planet} the ${CHARA_KARAKA_INFO[k.karaka].name}`),
        )}. The Karakamsa, ${ak.planet}'s navamsa sign, is ${j.karakamsa.sign}; the Arudha Lagna is ${j.arudhas[0].sign} and the Upapada ${j.arudhas[11].sign}.`,
        cites: [cites.add("Jaimini Sutras 1.1", SUTRAS_URL)],
      },
      {
        kind: "table",
        head: ["Karaka", "Planet", "Sign", "Degree"],
        rows: j.karakas.map((k) => [
          CHARA_KARAKA_INFO[k.karaka].name,
          k.planet,
          pos(k.planet).sign,
          fmtDeg(pos(k.planet).lon),
        ]),
      },
      {
        kind: "table",
        head: ["Pada", "Of the", "House sign", "Lord", "Falls in", "Matters"],
        rows: j.arudhas.map((a) => [
          a.label,
          ORD(a.house),
          SIGNS[a.houseSign],
          a.lord,
          a.sign,
          S(a.name.replace(/^[^:]*:\s*/, "")),
        ]),
      },
    ];
    const md = j.charaDasha.periods.find(
      (p) => p.start <= lifeAt && lifeAt < p.end,
    );
    if (md) {
      const ad = md.antardashas.find(
        (a) => a.start <= lifeAt && lifeAt < a.end,
      );
      const next = j.charaDasha.periods
        .filter((p) => p.start > lifeAt)
        .slice(0, 3);
      paras.push({
        kind: "p",
        text: `${deceased ? "At the date of passing the" : "The"} Chara dasha ${deceased ? "was" : "is"} ${md.signName} (${fmtDate(md.start)} to ${fmtDate(md.end)}, ${md.years} years)${ad ? `, ${ad.signName} antardasha` : ""}.${next.length && !deceased ? ` Next come ${list(next.map((p) => `${p.signName} (${fmtMonth(p.start)} to ${fmtMonth(p.end)})`))}.` : ""}`,
        aside:
          "Chara dasha by K.N. Rao's method: forward when the ninth from the lagna is a savya sign, twelve equal antardashas.",
      });
    }
    paras.push({
      kind: "table",
      head: ["Chara dasha", "From", "To", "Years"],
      rows: j.charaDasha.periods
        .filter((p) => p.start <= lifeAt || !deceased)
        .map((p) => [
          `${p.signName}${md && p.start === md.start ? (deceased ? " (at passing)" : " (running)") : ""}`,
          fmtDate(p.start),
          fmtDate(p.end),
          String(p.years),
        ]),
    });
    const sub: ReportSection[] = [];
    const areas = readAreas(j, positions, withheld);
    const held: string[] = [];
    for (const a of areas) {
      if (a.area !== "children" && !inSeason(a.area)) {
        held.push(a.label.toLowerCase());
        continue;
      }
      const fs = a.findingIds
        .map((id) => j.findings.find((f) => f.id === id))
        .filter(Boolean) as typeof j.findings;
      if (!fs.length && !a.blurb) continue;
      const ps: ReportPara[] = [
        {
          kind: "p",
          text: S(endStop(a.blurb)),
          aside:
            a.balance > 0
              ? "leans supportive"
              : a.balance < 0
                ? "leans strained"
                : "balanced",
        },
      ];
      for (const f of fs)
        ps.push({
          kind: "p",
          text: S(endStop(f.text)),
          cites: [
            cites.add(
              f.source.sutra
                ? `${f.source.label} ${f.source.sutra}`
                : f.source.label,
              f.source.url,
            ),
          ],
          aside: f.chart === "navamsa" ? "read in the navamsa" : undefined,
        });
      sub.push({ id: `jaimini-${a.area}`, title: a.label, paras: ps });
    }
    if (held.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: ${list(held)}.`,
      });
    {
      // Indu Lagna (Uttara Kalamrita IV.27): calculation classical, reading rules
      // from the DNA Astrology of Wealth book, pp. 92-93. Its own subsection.
      const uk = cites.add(
        "Kalidasa, Uttara Kalamrita IV.27 (V. Subrahmanya Sastri, trans. 1939)",
        "https://www.astrojyoti.com/uttarakalamritam2.htm",
      );
      const book = cites.add(
        "S. Prakash, DNA Astrology of Wealth (2022), pp. 92-93",
      );
      const i = j.indu;
      const moon = positions.find((x) => x.planet === "Moon")!;
      let dasas: KpPeriod[] = [];
      try {
        // Read at the reading date, or at the date of passing; later periods are dropped then.
        dasas = lifePeriods(
          vimshottari(moon.lon, result.utc, lifeAt).dasas,
          lifeAt,
          deceased,
        );
      } catch {
        dasas = [];
      }
      const timingIds = ["il-ben-dasha", "il-ben-trine", "il-ben-kendra", "il-second"];
      const induParas: ReportPara[] = [
        {
          kind: "p",
          text: `The Indu Lagna, the wealth ascendant: the 9th from the lagna is ${i.ninthFromLagna.sign} (${i.ninthFromLagna.lord}, ${i.ninthFromLagna.kala} kalas) and the 9th from the Moon in ${moon.sign} is ${i.ninthFromMoon.sign} (${i.ninthFromMoon.lord}, ${i.ninthFromMoon.kala} kalas). Their sum ${i.sum} leaves a remainder of ${i.remainder} modulo twelve, so the ${ORD(i.remainder)} sign from the Moon is the Indu Lagna: ${i.sign}.${i.sameLord ? ` ${i.ninthFromLagna.lord} rules both ninths and its kalas are counted twice.` : ""}`,
          cites: [uk],
          aside: "a Parashari-lineage special lagna; it feeds nothing in the Nadi reading",
        },
        ...[...i.classical, ...i.findings].map(
          (f): ReportPara => ({
            kind: "p",
            text:
              S(endStop(f.text)) +
              (timingIds.includes(f.id) && f.planets.length
                ? ` ${list(
                    f.planets
                      .map((pl) => {
                        const d = dasas.find((x) => x.lord === pl);
                        return d ? `${pl} ${fmtDate(d.start)} to ${fmtDate(d.end)}` : "";
                      })
                      .filter(Boolean),
                  )}.`
                : ""),
            cites: [
              f.source === "classical"
                ? cites.add(
                    f.sourceLabel ??
                      "Kalidasa, Uttara Kalamrita IV.27 (V. Subrahmanya Sastri, trans. 1939)",
                    "https://www.astrojyoti.com/uttarakalamritam2.htm",
                  )
                : book,
            ],
          }),
        ),
      ];
      sub.push({ id: "jaimini-indu", title: "Indu Lagna", paras: induParas });
    }
    return [
      {
        id: "jaimini",
        title: "The Jaimini reading",
        kicker: "Jaimini Sutras · K.N. Rao's Chara dasha",
        paras,
        sub,
      },
    ];
  },
};
