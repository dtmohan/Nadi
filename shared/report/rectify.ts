// Rectify: the scan the Rectify tab was looking at, one method at a time, with each interval's score
// and, for the event methods, its standing against shuffled dates. A tool rather than a reading.
import { DateTime } from "luxon";
import { RAO_SOURCE } from "../jaimini-areas";
import { scoreMarks } from "../body-marks";
import {
  RECTIFY_METHODS,
  EVENT_METHODS,
  baselineFor,
  methodLabel,
  methodScore,
} from "../rectify-methods";
import type { RectifySegment } from "../rectify-types";
import {
  list,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

const fmtScore = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);

export const rectifyModule: ReportModule = {
  id: "rectify",
  label: "Rectify: the birth-time scan",
  short: "Rectify",
  tab: "rectify",
  tool: true,
  build(ctx) {
    const { result, S, cites, tools } = ctx;
    const r = tools.rectify;
    const kicker = "Rectify · one method at a time, never blended";
    if (!r) {
      return [
        {
          id: "rectify",
          title: "The birth-time scan",
          kicker,
          paras: [
            {
              kind: "note",
              text: "No scan was supplied for this export. Open the Rectify tab, choose a method and window, and export again.",
            },
          ],
        },
      ];
    }
    const { result: scan, state } = r;
    const m = RECTIFY_METHODS.find((x) => x.id === state.method)!;
    const marksCtx =
      state.method === "bj-marks"
        ? { table: scan.marks, confirmed: new Set(state.confirmedMarks) }
        : undefined;
    const scored = scan.segments.map((seg) => ({
      seg,
      sc: methodScore(seg, state.method, marksCtx),
      b: baselineFor(seg, state.method),
    }));
    const maxOf = Math.max(0, ...scored.map((x) => x.sc.max));
    const top = Math.max(0, ...scored.map((x) => x.sc.score));
    const best = scored.filter((x) => x.sc.score === top && top > 0);
    const given = scan.segments.find((s) => s.given);
    const zone = result.chart.timezone;
    const judgedAt = DateTime.fromISO(scan.ruling.asOf).setZone(
      scan.judgedAt.timezone,
    );
    const src = cites.add(m.source);
    const eventMethod = EVENT_METHODS.includes(state.method);

    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `${m.system}, ${methodLabel(m)}: ${S(ctx.plain ? m.plainShort : m.short)}`,
        cites: [src],
      },
      {
        kind: "p",
        text: `The window runs ± ${scan.windowMinutes} minutes around the recorded time of ${scan.given.time} (${zone}), cut into ${scan.segments.length} interval${scan.segments.length === 1 ? "" : "s"} wherever the lagna's sub lord changes.${m.needsJudge ? ` The ruling planets were taken for ${judgedAt.toFormat("d LLL yyyy HH:mm")} at ${scan.judgedAt.label}: ${scan.ruling.list.map((x) => `${x.planet} (${x.role})`).join(", ")}; day lord ${scan.ruling.dayLord}.` : ""}${m.needsEvents ? ` ${state.events.length} dated event${state.events.length === 1 ? "" : "s"} ${state.events.length === 1 ? "is" : "are"} read: ${list(state.events.map((e) => `${S(e.label)} (${e.date})`))}.` : ""}${state.method === "bj-marks" ? ` Limbs confirmed to carry a mark: ${state.confirmedMarks.length ? list(state.confirmedMarks) : "none"}.` : ""}`,
      },
    ];
    if (best.length) {
      const rng = (x: { seg: RectifySegment }) =>
        `${x.seg.start.slice(0, 5)} to ${x.seg.end.slice(0, 5)}`;
      paras.push({
        kind: "p",
        text: `Best score ${fmtScore(top)} of ${maxOf}: ${list(best.map((x) => `${rng(x)} (${x.seg.sign}, sub lord ${x.seg.subLord}${x.seg.given ? ", holds the recorded time" : ""})`))}.${given ? ` The recorded time falls in ${given.start.slice(0, 5)} to ${given.end.slice(0, 5)}, which scores ${fmtScore(methodScore(given, state.method, marksCtx).score)} of ${methodScore(given, state.method, marksCtx).max}.` : ""}`,
        tone: given && best.some((x) => x.seg.given) ? "support" : "mixed",
      });
    } else {
      paras.push({
        kind: "p",
        text: "No interval in the window scores under this method.",
      });
    }
    if (eventMethod && scan.baseline) {
      const gb = given ? baselineFor(given, state.method) : undefined;
      paras.push({
        kind: "p",
        text: `Each interval's events were also scored at ${scan.baseline.trials} sets of shuffled dates drawn from ${scan.baseline.span[0]} to ${scan.baseline.span[1]}. A sub lord that signifies many houses scores well whatever the dates; the percentile shows how much of an interval's score is that bias and how much is the dates.${gb ? ` The recorded interval stands at the ${gb.percentile}th percentile (${gb.verdict === "above" ? "above chance" : gb.verdict === "below" ? "below chance" : "indistinguishable from chance"}).` : ""}`,
        provisional: true,
      });
    }
    const head = eventMethod
      ? [
          "From",
          "To",
          "Lagna",
          "Sign / star / sub lord",
          "Score",
          "Chance mean",
          "Percentile",
          "",
        ]
      : ["From", "To", "Lagna", "Sign / star / sub lord", "Score", ""];
    paras.push({
      kind: "table",
      head,
      rows: scored.map((x) => {
        const base = [
          x.seg.start.slice(0, 5),
          x.seg.end.slice(0, 5),
          x.seg.sign,
          `${x.seg.signLord} / ${x.seg.starLord} / ${x.seg.subLord}`,
          `${fmtScore(x.sc.score)} / ${x.sc.max}`,
        ];
        if (eventMethod)
          base.push(
            x.b ? `${x.b.mean} ± ${x.b.sd}` : "—",
            x.b ? `${x.b.percentile}` : "—",
          );
        base.push(
          [
            x.seg.given ? "recorded" : "",
            x.sc.score === top && top > 0 ? "best" : "",
          ]
            .filter(Boolean)
            .join(", "),
        );
        return base;
      }),
    });

    const sub: ReportSection[] = [];
    // Detail of the best interval (or the recorded one) under the method.
    const focus = best.find((x) => x.seg.given)?.seg ?? best[0]?.seg ?? given;
    if (focus) {
      const ps: ReportPara[] = [];
      const label = `${focus.start.slice(0, 5)} to ${focus.end.slice(0, 5)}, ${focus.sign} rising, sub lord ${focus.subLord}`;
      if (state.method === "kp-rp") {
        const rp = focus.rp;
        ps.push({
          kind: "p",
          text: `Sign lord ${focus.signLord}: ${rp.sign ? `ruling${rp.via.sign ? ` (${rp.via.sign})` : ""}` : "not ruling"}. Star lord ${focus.starLord}: ${rp.star ? `ruling${rp.via.star ? ` (${rp.via.star})` : ""}` : "not ruling"}. Sub lord ${focus.subLord}: ${rp.sub ? `ruling${rp.via.sub ? ` (${rp.via.sub})` : ""}` : "not ruling"}. Score ${rp.score} of ${rp.max}; the sub lord's agreement is the decisive one.`,
          cites: [src],
        });
      } else if (state.method === "kp-moon") {
        const ml = focus.moonLords;
        ps.push({
          kind: "p",
          text: `Birth star ${ml.birthStar} (lord ${ml.birthStarLord}), Moon in ${ml.moonSign} (lord ${ml.moonSignLord}). The lagna sub lord ${ml.subLord} ${ml.star.level ? `reaches the birth star: ${ml.star.via}` : "does not reach the birth star"}; it ${ml.sign.owns ? "owns" : ml.sign.occupies ? "stands in" : "neither owns nor stands in"} the Moon sign. Score ${ml.score} of ${ml.max}.`,
          cites: [src],
        });
      } else if (state.method === "bj-marks") {
        const mk = scan.marks[focus.drekkana];
        if (mk) {
          const sc = scoreMarks(mk, state.confirmedMarks);
          ps.push({
            kind: "p",
            text: `${mk.drekkanaLabel}. Limbs the chart marks: ${mk.marks.length ? list(mk.marks.map((x) => `${x.limb} (${x.planet})`)) : "none"}. Confirmed and explained: ${sc.hits.length ? list(sc.hits) : "none"}; marked by the chart but not confirmed: ${sc.misses.length ? list(sc.misses) : "none"}; confirmed but unexplained: ${sc.unexplained.length ? list(sc.unexplained) : "none"}. Score ${sc.score} of ${sc.max}; this settles the drekkana, not the minute.`,
            cites: [src],
          });
        }
      } else {
        ps.push({
          kind: "table",
          head:
            state.method === "kp-events"
              ? [
                  "Event",
                  "Date",
                  "Dasa / bhukti / antara",
                  "Hits",
                  "Promised",
                  "Score",
                ]
              : state.method === "kp-transit"
                ? [
                    "Event",
                    "Date",
                    "Dasa lord transits",
                    "Bhukti lord transits",
                    "Score",
                  ]
                : ["Event", "Date", "Mahadasha", "Antardasha", "Score"],
          rows: focus.events.map((e) => {
            const hits = ["D", "B", "A"]
              .map((k, i) => (e.hits[i] ? k : "–"))
              .join(" ");
            if (state.method === "kp-events")
              return [
                S(e.label),
                e.date,
                `${e.dasa} / ${e.bhukti} / ${e.antara}`,
                hits,
                e.promised === undefined
                  ? "—"
                  : `${e.promised ? "yes" : "no"}${e.cuspSubLord ? ` (${e.cuspSubLord})` : ""}`,
                `${e.score} / ${e.max}`,
              ];
            if (state.method === "kp-transit") {
              const t = (c: typeof e.transit.dasa) =>
                `${c.planet}: ${c.signLord} / ${c.starLord} / ${c.subLord} (${c.hits.filter(Boolean).length} of 3)`;
              return [
                S(e.label),
                e.date,
                t(e.transit.dasa),
                t(e.transit.bhukti),
                `${e.transit.score} / ${e.transit.max}`,
              ];
            }
            const j = e.jaimini;
            return [
              S(e.label),
              e.date,
              j
                ? `${j.md.hot ? "carries" : j.md.score ? "touches" : "misses"}${j.md.triggers.length ? `: ${j.md.triggers.join("; ")}` : ""}`
                : "no area",
              j
                ? `${j.ad.hot ? "carries" : j.ad.score ? "touches" : "misses"}${j.ad.triggers.length ? `: ${j.ad.triggers.join("; ")}` : ""}`
                : "—",
              j ? `${j.score} / ${j.max}` : "—",
            ];
          }),
        });
        if (state.method === "kp-transit")
          ps.push({
            kind: "note",
            text: `Sun hint: the Sun's sub lord on the day of judgement is ${scan.sunNow.subLord}${focus.sunHint.sub ? ", which is this interval's lagna sub lord" : focus.sunHint.star ? ", which is this interval's lagna star lord" : ", which is neither the lagna's star nor sub lord here"} (${focus.sunHint.score} of ${focus.sunHint.max}).`,
            cites: [src],
          });
        if (state.method === "jaimini-dasha")
          ps.push({
            kind: "note",
            text: `Read for ${focus.jaiminiSign.name} rising in the chart's own ayanamsa, chara dasha ${focus.jaiminiSign.direction}; every interval in one sign scores alike.`,
            cites: [cites.add(RAO_SOURCE.label, RAO_SOURCE.url)],
          });
      }
      sub.push({
        id: "rectify-focus",
        title: `The interval ${label}`,
        paras: ps,
      });
    }
    paras.push({
      kind: "note",
      text: "The scores are the app's tallies of the books' conditions and are provisional. Rectification narrows the minutes; it does not prove them, and the corrected time must stay inside what the family remembers.",
      provisional: true,
    });
    return [
      { id: "rectify", title: "The birth-time scan", kicker, paras, sub },
    ];
  },
};
