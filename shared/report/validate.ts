// Validate: the chart's dated events read back at their dates, with the shuffled-date baseline.
// A tool rather than a reading; it is exported from its own tab and never joins the Report page picker.
import { RAO_SOURCE } from "../jaimini-areas";
import type { BaselineStat } from "../validate-types";
import {
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

const yn = (b: boolean) => (b ? "yes" : "no");
const hitMarks = (hits: [boolean, boolean, boolean]) =>
  ["D", "B", "A"].map((k, i) => (hits[i] ? k : "–")).join(" ");

export const validateModule: ReportModule = {
  id: "validate",
  label: "Validate: events read back",
  short: "Validate",
  tab: "validate",
  tool: true,
  build(ctx) {
    const { result, S, cites, tools } = ctx;
    const v = tools.validation;
    const kicker =
      "Validate · KP, Jaimini and Nadi timing against dated events";
    if (!v) {
      return [
        {
          id: "validate",
          title: "Events read back",
          kicker,
          paras: [
            {
              kind: "note",
              text: result.chart.events?.length
                ? "The validation could not be computed for this chart."
                : "No dated life events are saved on this chart, so there is nothing to read back. Add events on the chart page and export again.",
            },
          ],
        },
      ];
    }
    const kpSrc = cites.add(
      "Astro Secrets & KP, Part 1 pp. 167-172; Part 2 p. 203 (uploaded PDFs)",
    );
    const filterSrc = cites.add(
      "Astro Secrets & KP, Part 3 ch. 5; Part 2 ch. 7 (uploaded PDFs)",
    );
    const raoSrc = cites.add(RAO_SOURCE.label, RAO_SOURCE.url);
    const bnnSrc = cites.add("R.G. Rao, Bhrigu Nandi Nadi");
    const winSrc = cites.add("Astro Secrets & KP, Part 2 p. 24 (uploaded PDF)");
    const s = v.summary;
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `${s.events} dated event${s.events === 1 ? "" : "s"} read back at ${s.events === 1 ? "its" : "their"} date${s.events === 1 ? "" : "s"} against the chart as it stands (birth time ${v.birthTime}, ${v.lagna.sign} rising at ${v.lagna.degree.toFixed(2)}°). By Krishnamurti's period lords and cusp promise ${s.confirmed} ${s.confirmed === 1 ? "is" : "are"} confirmed, ${s.partial} partial and ${s.missed} missed, ${s.kpScore} of ${s.kpMax} points in all; the transit hint scores ${s.transitScore} of ${s.transitMax}; K.N. Rao's chara dasha check carries the matter in ${s.jaiminiScore} of ${s.jaiminiMax} points over ${s.jaiminiEvents} event${s.jaiminiEvents === 1 ? "" : "s"} with an area; the Nadi timers score ${s.bnnScore} of ${s.bnnMax}, strong at ${s.bnnStrong}.`,
        cites: [kpSrc, raoSrc, bnnSrc],
      },
      {
        kind: "table",
        head: [
          "Date",
          "Age",
          "Event",
          "Houses",
          "Dasa / bhukti / antara",
          "Hits",
          "Promised",
          "KP",
          "Chara dasha",
          "Nadi",
          "Window",
        ],
        rows: v.events.map((e) => [
          e.date,
          e.age.toFixed(1),
          S(e.label),
          e.houses.join(", "),
          `${e.kp.dasa} / ${e.kp.bhukti} / ${e.kp.antara}`,
          hitMarks(e.kp.hits),
          `${yn(e.kp.promised)} (${e.kp.cuspSubLord})`,
          `${e.kp.verdict} ${e.kp.score}/${e.kp.max}`,
          e.jaimini
            ? `${e.jaimini.mdSignName} / ${e.jaimini.adSignName} ${e.jaimini.score}/${e.jaimini.max}`
            : "—",
          `${e.bnn.verdict} ${e.bnn.score}/${e.bnn.max}`,
          `${e.windows.bnn ? `Ju ${e.windows.bnn.sign}` : "—"} / ${e.windows.kp ? `${e.windows.kp.dasaLord}-${e.windows.kp.bhuktiLord}${e.windows.kp.antaraSignifies ? " (+A)" : ""}` : "—"} / ${e.windows.kpStrict ? `${e.windows.kpStrict.dasaLord}-${e.windows.kpStrict.bhuktiLord}${e.windows.kpStrict.antaraSignifies ? " (+A)" : ""}` : "—"}`,
        ]),
      },
      {
        kind: "note",
        text: "Hits: D, B and A mark a dasa, bhukti or antara lord that signifies one of the matter's houses by the four-step rule; a dash marks one that does not. Promised: the sub lord of the matter's cusp signifies the matter. KP verdict: confirmed when promised and both dasa and bhukti lords signify, partial when something links, missed when nothing does. The chara dasha column gives the mahadasha and antardasha signs running that day and Rao's fit; the Nadi column scores Jupiter's and Saturn's contacts with the matter's karakas that day out of six. Window: the timing window each system names in advance, if one was open at the date — Jupiter's passage for Nadi (left of the slash), the KP dasa-bhukti joint period (right), with +A marking an antara lord that also signifies the matter. Within the conjoined period, the book's day trigger is the transiting Sun or Moon in the sign, star or sub of the period lords (Part 2 p. 26, provisional reading), shown in the app's transit column. The scoring scales are the app's, not the books'.",
        cites: [kpSrc, filterSrc],
        provisional: true,
      },
    ];
    if (s.diverted)
      paras.push({
        kind: "p",
        text: `${s.diverted} period-lord hit${s.diverted === 1 ? "" : "s"} ${s.diverted === 1 ? "is" : "are"} diverted by the cusp filter: the lord signifies the matter, but the sub lord of that house's cusp takes the result elsewhere.`,
        cites: [filterSrc],
      });

    const sub: ReportSection[] = [];
    {
      const w = v.windows;
      sub.push({
        id: "validate-windows",
        title: "Which timing windows the events fell in",
        paras: [
          {
            kind: "p",
            text: `The table above asks what was running on the day; this one asks the prior question: was the date inside a window the system itself names in advance? A Nadi window is a Jupiter passage over the matter's karaka or in its count-signs from the Jeeva; a KP joint period is the dasa-bhukti of the matter's significators — the level the books' worked marriages are dated by — with the antara carried as a refinement and counted separately as the full three-level match; Method I grades are carried on the window, not used to set it aside. The strict KP window rereads the same periods through the ordered significator hierarchy of Part 2 p. 151 (planets in the stars of a bhava's occupants first, then the occupants, then the stars of the owner, then the owner), keeping a significator only when deposited in the sub of another significator of the matter (the same page, stated for the job houses, so generalised here provisionally). Nadi windows caught ${w.bnnCaught} of ${w.events} event${w.events === 1 ? "" : "s"}, of ${w.bnnPast} past windows for these matters; KP joint periods caught ${w.kpCaught}, of ${w.kpPast}, of which ${w.kpFull} also had the antara lord signifying; the strict reading caught ${w.kpStrictCaught} of ${w.kpStrictPast}, of which ${w.kpStrictFull} full.`,
            cites: [bnnSrc, winSrc],
            provisional: true,
          },
          ...(w.bnn.length + w.kp.length + w.kpStrict.length
            ? [
                {
                  kind: "table" as const,
                  head: ["System", "Matter", "Window", "Open", "Caught"],
                  rows: [
                    ...w.bnn.map((r) => [
                      "Nadi",
                      S(r.matterLabel),
                      `Jupiter in ${r.sign}${
                        r.contact
                          ? `, ${r.contact} ${r.karaka}`
                          : `, ${r.fromJeeva} from the Jeeva`
                      }`,
                      `${r.start.slice(0, 10)} to ${r.end.slice(0, 10)}`,
                      r.events.map((e) => `${S(e.label)} ${e.date}`).join("; "),
                    ]),
                    ...w.kp.map((r) => [
                      "KP",
                      S(r.matterLabel),
                      `${r.dasaLord}-${r.bhuktiLord} (${r.verdict})`,
                      `${r.start.slice(0, 10)} to ${r.end.slice(0, 10)}`,
                      r.events
                        .map(
                          (e) =>
                            `${S(e.label)} ${e.date}${e.note ? ` (${S(e.note)})` : ""}`,
                        )
                        .join("; "),
                    ]),
                    ...w.kpStrict.map((r) => [
                      "KP strict",
                      S(r.matterLabel),
                      `${r.dasaLord}-${r.bhuktiLord} (${r.verdict})`,
                      `${r.start.slice(0, 10)} to ${r.end.slice(0, 10)}`,
                      r.events
                        .map(
                          (e) =>
                            `${S(e.label)} ${e.date}${e.note ? ` (${S(e.note)})` : ""}`,
                        )
                        .join("; "),
                    ]),
                  ],
                },
              ]
            : [
                {
                  kind: "note" as const,
                  text: "No past window caught a recorded event.",
                },
              ]),
          ...(v.events.some(
            (e) => !e.windows.bnn && !e.windows.kp && !e.windows.kpStrict,
          )
            ? [
                {
                  kind: "note" as const,
                  text: `No window of its matter was open at: ${v.events
                    .filter(
                      (e) => !e.windows.bnn && !e.windows.kp && !e.windows.kpStrict,
                    )
                    .map((e) => `${S(e.label)} (${e.date})`)
                    .join("; ")}.`,
                },
              ]
            : []),
        ],
      });
    }
    if (v.baseline) {
      const b = v.baseline;
      const measures = 7;
      const corrected = Math.round(100 - 5 / measures);
      const row = (name: string, st: BaselineStat) => [
        name,
        String(st.actual),
        `${st.mean} ± ${st.sd}`,
        `${st.percentile}`,
        st.verdict === "above"
          ? "above chance"
          : st.verdict === "below"
            ? "below chance"
            : "chance",
      ];
      sub.push({
        id: "validate-baseline",
        title: "Against chance",
        paras: [
          {
            kind: "p",
            text: `Each matter was re-scored at ${b.trials} sets of random dates between ${b.span[0]} and ${b.span[1]}. The percentile is the share of those trials the real dates beat; 50 is pure chance. Seven measures are read together, so one of them clears the 95th percentile by chance about ${Math.round((1 - Math.pow(0.95, measures)) * 100)}% of the time; a single measure is a signal only from the ${corrected}th percentile (Bonferroni, 5% over the family).`,
          },
          {
            kind: "table",
            head: [
              "Measure",
              "Actual",
              "Chance mean ± sd",
              "Percentile",
              "Verdict",
            ],
            rows: [
              row("KP confirmed events", b.confirmed),
              row("KP period-lord points", b.kp),
              row("KP transit points", b.transit),
              row("Chara dasha points", b.jaimini),
              row("Nadi timer points", b.bnn),
              row("Events inside a Nadi window", b.bnnWindow),
              row("Events inside a KP joint period", b.kpWindow),
              row("Events inside a full KP joint period", b.kpFullWindow),
              row("Events inside a strict KP joint period", b.kpStrictWindow),
              row("Events inside a full strict KP joint period", b.kpStrictFullWindow),
              row("Days the luminaries' trigger held", b.luminary),
            ],
          },
          {
            kind: "note",
            text: "A birth time whose events do no better than shuffled dates is not thereby wrong, and one that does better is not thereby right; the baseline shows how much of the score is the chart's structure and how much is the dates.",
          },
        ],
      });
    } else {
      paras.push({
        kind: "note",
        text: "No chance baseline: it needs at least two events spanning more than a year.",
      });
    }

    if (v.planets.length) {
      const nat = (n: string) => (n === "unknown" ? "—" : n);
      sub.push({
        id: "validate-planets",
        title: "How each planet's periods turned out",
        paras: [
          {
            kind: "p",
            text: `For each planet, the houses it signifies give an expected nature (favourable through 2, 3, 10 and 11; harmful through 6, 8 and 12), read once directly and once through the sub lords of the cusps it signifies; the events that fell in its dasa, bhukti or antara give the observed nature. ${s.agree} agree and ${s.conflict} conflict read directly; ${s.agreeByCusp} and ${s.conflictByCusp} read through the cusps.`,
            cites: [filterSrc],
            provisional: true,
          },
          {
            kind: "table",
            head: [
              "Planet",
              "Signifies",
              "Expected",
              "By cusp",
              "Ran at",
              "Observed",
              "Agrees",
              "By cusp",
            ],
            rows: v.planets.map((p) => [
              p.planet,
              p.signifies.join(", ") || "—",
              nat(p.expected),
              nat(p.expectedByCusp),
              p.ran.length
                ? `${p.ran.length} (${p.favourable} fav., ${p.unfavourable} unfav., ${p.mixed} mixed)`
                : "—",
              nat(p.observed),
              p.agrees === null ? "—" : yn(p.agrees),
              p.agreesByCusp === null ? "—" : yn(p.agreesByCusp),
            ]),
          },
        ],
      });
    }
    return [{ id: "validate", title: "Events read back", kicker, paras, sub }];
  },
};
