// The Bhrigu Nandi Nadi reading by life area, from the same synthesis the BNN tab shows.
import { LIFE_AREAS, RELATION_LABEL, type Finding } from "../rules";
import { synthesize, AREA_TONE_LABEL } from "../synthesis";
import { nextMarriageWindow } from "../marriage";
import { nextChildWindow } from "../children";
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
