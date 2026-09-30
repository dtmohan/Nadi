// The Bhrigu Nandi Nadi reading by life area, from the same synthesis the BNN tab shows.
import { LIFE_AREAS, RELATION_LABEL, type Finding } from "../rules";
import { synthesize, AREA_TONE_LABEL } from "../synthesis";
import { nextMarriageWindow } from "../marriage";
import { nextChildWindow } from "../children";
import { vimshottari, type KpPeriod } from "../kp";
import { AREA_ONSET } from "../life-stage";
import {
  endStop,
  fmtMonth,
  list,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

export const bnnModule: ReportModule = {
  id: "bnn",
  label: "The Nadi reading",
  short: "Nadi",
  tab: "bnn",
  build(ctx) {
    const { result, S, cites, asOf, deceased, inSeason, female } = ctx;
    const { reading, transits } = result;
    const roles = reading.roles;
    const areas = synthesize(reading, roles.gender);
    const rao = (s?: string) => cites.add(s ?? "R.G. Rao, Bhrigu Nandi Nadi");
    const relOf = (f: Finding) => {
      if (f.planets.length === 2) {
        if (f.relation && f.relation !== "conjunct")
          return `${f.planets[1]} ${RELATION_LABEL[f.relation]}${f.viaRetro ? ", via retrogression" : ""}`;
        return undefined;
      }
      const [subject, ...rest] = f.planets;
      const apart = rest
        .map((pl) => ({
          pl,
          r: reading.relations.find(
            (x) => x.subject === subject && x.object === pl,
          ),
        }))
        .filter((x) => x.r && x.r.relation !== "conjunct")
        .map((x) => `${x.pl} ${RELATION_LABEL[x.r!.relation]}`);
      return apart.length ? apart.join(", ") : undefined;
    };
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Bhrigu Nandi Nadi reads no houses. Jupiter is the Jeeva, the life itself${female ? ", and in a woman's chart Venus is the Deha, her person" : ""}; Saturn is the Karma, the work; the other planets are read by where they stand from these two, in the same sign, in trine, in the seventh, or in the signs before and behind. ${roles.spouse} stands for the ${female ? "husband" : "wife"}.`,
        cites: [
          rao(),
          cites.add("S. Naik, Prediction Secrets: Naadi Astrology"),
        ],
      },
      { kind: "p", text: S(reading.jeeva.summary) },
      { kind: "p", text: S(reading.karma.summary) },
    ];
    if (reading.deha) paras.push({ kind: "p", text: S(reading.deha.summary) });

    const sub: ReportSection[] = [];
    const deferred: string[] = [];
    for (const a of areas) {
      if (!inSeason(a.area)) {
        deferred.push(
          `${LIFE_AREAS[a.area].label.toLowerCase()} (from age ${AREA_ONSET[a.area]})`,
        );
        continue;
      }
      const ps: ReportPara[] = [
        {
          kind: "p",
          text: S(a.headline),
          tone:
            a.tone === "supportive"
              ? "support"
              : a.tone === "care"
                ? "strain"
                : "mixed",
          aside: AREA_TONE_LABEL[a.tone],
        },
      ];
      if (a.reconciliation) ps.push({ kind: "p", text: S(a.reconciliation) });
      if (a.contest)
        ps.push({
          kind: "note",
          text: "Contested: the strongest supportive rule and the strongest hard rule here are of comparable weight, so no single verdict is given. The threshold is the app's own convention, not a Nadi rule.",
          provisional: true,
        });
      for (const f of a.key) {
        ps.push({
          kind: "p",
          text: S(endStop(f.text)),
          cites: [rao(f.source)],
          aside:
            [relOf(f), f.modifier].filter(Boolean).join(" · ") || undefined,
          provisional: /provisional/i.test(f.text),
        });
      }
      if (a.area === "marriage") {
        const m = reading.marriage;
        const win = nextMarriageWindow(m, transits, asOf.slice(0, 10));
        ps.push({
          kind: "p",
          text: S(
            m.notes.join(" ").trim() ||
              "The headline above is the whole of what the karakas say; no further note applies.",
          ),
          cites: [rao()],
          aside: `Jupiter over ${m.spouseSign} or its trines brings the matter forward${win && !deceased ? `; next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}` : ""}.`,
        });
      }
      if (a.area === "children") {
        const c = reading.children;
        const win = nextChildWindow(c, transits, asOf.slice(0, 10), result.utc);
        const counted = c.inFifth.length + c.aspectingFifth.length;
        ps.push({
          kind: "p",
          text: S(
            `${c.notes.join(" ")}${counted ? ` The count from the fifth sign from Jupiter gives ${counted} planet${counted === 1 ? "" : "s"}, an upper bound rather than a promise.` : ""}`.trim() ||
              "The headline above is the whole of what the karaka says; no further note applies.",
          ),
          cites: [rao()],
          aside:
            win && !deceased
              ? `Next: Jupiter ${win.kind === "return" ? "returns to" : win.kind === "fifth" ? "over the fifth," : "in trine,"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}.`
              : undefined,
        });
      }
      sub.push({
        id: `bnn-${a.area}`,
        title: LIFE_AREAS[a.area].label,
        paras: ps,
      });
    }
    // Ashtalakshmi: the Venus-lagna wealth reading, kept beside the area verdicts
    // as its own subsection because it comes from a different source than the
    // Rao/Naik combinations above.
    {
      const l = reading.lakshmi;
      const book = cites.add(
        "S. Prakash, DNA Astrology of Wealth (2022), pp. 53-91, 173, 177",
      );
      const moon = result.positions.find((x) => x.planet === "Moon")!;
      let dasas: KpPeriod[] = [];
      try {
        dasas = vimshottari(moon.lon, result.utc, asOf).dasas;
      } catch {
        dasas = [];
      }
      const lakshmiParas: ReportPara[] = [
        {
          kind: "p",
          text: S(l.headline),
          cites: [book],
        },
        ...l.forms.map((f): ReportPara => {
          const d = dasas.find((x) => x.lord === f.planet);
          return {
            kind: "p",
            text: S(
              `${f.planet} in the ${f.house}${["th", "st", "nd", "rd"][f.house % 10 < 4 && (f.house < 11 || f.house > 13) ? f.house % 10 : 0]} from Venus — ${f.form}: ${f.domain}.${f.via === "case-study" ? " Read in the book's case studies, beyond the chapter diagrams." : ""}`,
            ),
            cites: [book],
            aside: d
              ? `Mahadasha ${fmtMonth(d.start)} to ${fmtMonth(d.end)}${d.current ? " (running)" : ""}`
              : undefined,
          };
        }),
        { kind: "note", text: l.notes.join(" ") },
      ];
      sub.push({
        id: "bnn-lakshmi",
        title: "Wealth: the eight Lakshmi forms",
        paras: lakshmiParas,
      });
    }
    // Nakshatra wealth: the twenty wealth stars and their rule lists (DNA
    // Astrology of Wealth, pp. 96-169). Its own subsection for the same reason.
    if (result.nakshatraWealth) {
      const nw = result.nakshatraWealth;
      const book2 = cites.add(
        "S. Prakash, DNA Astrology of Wealth (2022), pp. 96-169",
      );
      const nwParas: ReportPara[] = [
        { kind: "p", text: S(nw.headline), cites: [book2] },
        ...nw.hits.map(
          (h): ReportPara => ({
            kind: "p",
            text: S(h.text),
            cites: [book2],
            aside: `${h.nakshatra} · ${h.pages.replace("DNA Astrology of Wealth, ", "")}`,
          }),
        ),
        { kind: "note", text: nw.notes.join(" ") },
      ];
      sub.push({
        id: "bnn-nakshatra-wealth",
        title: "Wealth: the twenty nakshatras",
        paras: nwParas,
      });
    }
    if (deferred.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: ${list(deferred)}. The combinations exist in the chart; they are read when the matter comes into season.`,
      });
    return [
      {
        id: "bnn",
        title: "The Nadi reading",
        kicker: "Bhrigu Nandi Nadi · Rao, Naik",
        paras,
        sub,
      },
    ];
  },
};
