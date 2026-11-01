// Validate: the chart's dated events read back at their dates, with a random-date comparison.
// A tool rather than a reading; it is exported from its own tab and never joins the Report page picker.
import { RAO_SOURCE } from "../jaimini-areas";
import { KP_TRANSIT_EVIDENCE_SOURCE } from "../kp-transit-evidence";
import { transitEvidenceTable } from "./kp-transit-evidence";
import { describeEventMoment } from "../events";
import { PARASHARI_VARGA_SOURCE } from "../parashari-varga-evidence";
import { parashariEvidenceParas } from "./parashari-varga-evidence";
import { MANLEY_SOURCE, RAO_EDUCATION_SOURCE } from "../manley-evidence";
import { manleyEvidenceParas } from "./manley-evidence";
import { hierarchyParas } from "./parashari-hierarchy";
import { parashariComparisonParas } from "./parashari-comparison";
import type { BaselineStat } from "../validate-types";
import { AURORA_SOURCE } from "../kp-aurora";
import { auroraEvidenceParas, auroraV2EvidenceParas, auroraV2StagesParas } from "./kp-aurora";
import { AURORA_V2_SOURCE } from "../kp-aurora-v2";
import { agreeWord, KP_MARKED_KEY, markedHousesText } from "../validate-types";
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
        text: `${s.events} dated event${s.events === 1 ? "" : "s"} read against the chart as it stands (birth time ${v.birthTime}, ${v.lagna.sign} rising at ${v.lagna.degree.toFixed(2)}°). Without an event time the app assumes noon; without an event time zone it assumes the birth zone (${result.chart.timezone}). Random dates keep each event's local time and zone. KP has ${s.confirmed} period/cusp matches, ${s.partial} partial and ${s.missed} missed, ${s.kpScore} of ${s.kpMax} points; the separate transit check scores ${s.transitScore} of ${s.transitMax}; K.N. Rao's chara dasha check scores ${s.jaiminiScore} of ${s.jaiminiMax} over ${s.jaiminiEvents} event${s.jaiminiEvents === 1 ? "" : "s"} with an area; Nadi scores ${s.bnnScore} of ${s.bnnMax}, strong at ${s.bnnStrong}.`,
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
          `${e.kp.verdict === "confirmed" ? "period/cusp match" : e.kp.verdict} ${e.kp.score}/${e.kp.max}`,
          e.jaimini
            ? `${e.jaimini.mdSignName} / ${e.jaimini.adSignName} ${e.jaimini.score}/${e.jaimini.max}`
            : "—",
          `${e.bnn.verdict} ${e.bnn.score}/${e.bnn.max}`,
          `${e.windows.bnn ? `Ju ${e.windows.bnn.sign}` : "—"} / ${e.windows.kp ? `${e.windows.kp.dasaLord}-${e.windows.kp.bhuktiLord}${e.windows.kp.antaraSignifies ? " (+A)" : ""}` : "—"} / ${e.windows.kpStrict ? `${e.windows.kpStrict.dasaLord}-${e.windows.kpStrict.bhuktiLord}${e.windows.kpStrict.antaraSignifies ? " (+A)" : ""}` : "—"}`,
        ]),
      },
      {
        kind: "note",
        text: "Hits: D, B and A mark a dasa, bhukti or antara lord that signifies one of the matter's houses by the four-step rule. Promised: the sub lord of the matter's cusp signifies the matter. A KP period/cusp match requires the promise and both dasa and bhukti lords to signify; it does not include antara or transit. Partial means something links, missed means nothing does. The chara dasha column gives the mahadasha and antardasha signs and Rao's fit; the Nadi column scores Jupiter's and Saturn's contacts with the matter's karakas. Timing windows are shown separately. The scoring scales are the app's, not the books'.",
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

    if (v.events.some((e) => e.parashariVargas)) {
      paras.push({
        kind: "note",
        text: "Parashari cross-checks the relevant D1 house and D7, D9 or D10 at the recorded birth time. The placements are descriptive and do not alter the KP, Jaimini or Nadi scores.",
        cites: [cites.add(PARASHARI_VARGA_SOURCE.label, PARASHARI_VARGA_SOURCE.url)],
        provisional: true,
      });
      for (const e of v.events) if (e.parashariVargas) paras.push(...parashariEvidenceParas(e.parashariVargas));
    }
    for (const event of v.events) if (event.parashariPromise) {
      const p = event.parashariPromise;
      paras.push({ kind: "p", text: `${p.label} · ${p.date}: ${p.score}/5 experimental Parashari rule matches. D1 support: ${p.d1Support.join("; ") || "none found"}; D1 difficult: ${p.d1Strain.join("; ") || "none found"}; ${p.division} support: ${p.divisionSupport.join("; ") || "none found"}; ${p.division} difficult: ${p.divisionStrain.join("; ") || "none found"}. ${p.periods.map((x) => `${x.level} ${x.planet}: ${x.links.join("; ") || "no matter-house link"}`).join(". ")}. Double transit: ${p.doubleTransitTargets.join("; ") || "no shared target"}. Equal weights are an app convention, not proof of a promise.`, provisional: true });
    }
    if (v.events.some((event) => event.parashariPromise)) paras.push({ kind: "note", text: "In a small eight-person public-case test, the experimental Parashari ranking missed the reported-time ±5-minute band in all eight cases. Some birth times were uncertain; the matches do not establish a birth time or a promise.", provisional: true });
    for (const event of v.events) if (event.parashariSpecific) {
      const p = event.parashariSpecific;
      const source = p.matter === "marriage"
        ? cites.add("K.N. Rao-guided Astrology and Timing of Marriage, ch. 2", "https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008")
        : p.matter === "child"
          ? cites.add("Astrological Assessment of Timing of Childbirth, §§2.6–2.7", "https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf")
          : cites.add("Vishnu Bhaskar, Advanced Techniques of Predictive Astrology, vol. 1 pp. 23–24", "https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html");
      paras.push({ kind: "p", text: `${p.label} · ${p.date}: ${p.score}/6 experimental event-specific matches. ${p.factors.map((f) => `${f.label}: ${f.matched ? "match" : "no match"} (${f.details.join("; ") || "none found"})`).join(". ")}.${p.matter === "marriage" ? " The Vivah Saham check counts full aspects; Jupiter occupying the same sign is not counted." : ""} D1 difficult: ${p.d1Strain.join("; ") || "none found"}; ${p.division} difficult: ${p.divisionStrain.join("; ") || "none found"}. Equal weights and strict subsets are app choices.`, cites: [source], provisional: true });
    }
    if (v.events.some((event) => event.parashariSpecific)) paras.push({ kind: "note", text: "In nine new public cases, v2's top intervals touched the reported-time ±5-minute band in eight but covered 35% of the scanned hour on average. At the reported birth times, held-out event scores were nearly the same on nearby comparison dates. This is a small sample and the birth times are not independent proof.", provisional: true });
    if (v.events.some((event) => event.parashariDivisional)) {
      const source = cites.add(MANLEY_SOURCE.label);
      paras.push({ kind: "note", text: "V3 adds two divisional period-lord observations to v2. In ten fresh public cases, held-out event scores at the published birth times resembled nearby comparison dates. The eight equal points are an app convention; its factors can overlap and the book's full qualitative funnel is not automated. These matches do not establish a birth time.", cites: [source], provisional: true });
      for (const event of v.events) if (event.parashariDivisional) {
        const p = event.parashariDivisional;
        paras.push({ kind: "p", text: `${p.label} · ${p.date}: ${p.score}/${p.max} v3 rule matches. ${p.factors.map((f) => `${f.label}: ${f.matched ? "match" : "no match"} (${f.details.join("; ") || "none found"})`).join(". ")}. D1 difficult: ${p.d1Strain.join("; ") || "none found"}; ${p.division} difficult: ${p.divisionStrain.join("; ") || "none found"}.`, cites: [source], provisional: true });
      }
    }
    for (const event of v.events) if (event.parashariHierarchy) paras.push(...hierarchyParas(event.parashariHierarchy));
    if (v.events.some((event) => event.manley)) {
      const source = cites.add(MANLEY_SOURCE.label);
      paras.push({ kind: "note", text: "The following Manley-style D1 and divisional event clues are descriptive; the main and subperiod primary divisional links also contribute to v3. The third-period clues do not change that score. Repeated lords are not independent confirmations. Missing event times are evaluated at noon and missing event zones use the birth zone. Nodes receive but do not cast aspects in this subset. Indirect node-dispositor links, the full manual funnel and fourth/fifth period levels are omitted. Admission is not necessarily the first day of study.", cites: [source], provisional: true });
      for (const event of v.events) if (event.manley) paras.push(...manleyEvidenceParas(event.manley, source,
        event.manley.educationFourth ? cites.add(RAO_EDUCATION_SOURCE.label, RAO_EDUCATION_SOURCE.url) : undefined));
    }
    for (const e of v.events) if (e.kp.aurora) paras.push(...auroraEvidenceParas(e.kp.aurora, `${S(e.label)} · ${e.date}`, cites.add(AURORA_SOURCE)));
    paras.push(...auroraV2StagesParas(v.events.map((e) => e.kp.auroraV2), v.baseline?.auroraV2Stages, v.baseline?.trials));
    for (const e of v.events) if (e.kp.auroraV2) paras.push(...auroraV2EvidenceParas(e.kp.auroraV2, `${S(e.label)} · ${e.date}`, cites.add(AURORA_V2_SOURCE)));
    if (v.baseline?.aurora) paras.push({ kind: "note", provisional: true, text: `Aurora full chains: ${v.baseline.aurora.actual} on recorded dates, comparison mean ${v.baseline.aurora.mean} across ${v.baseline.trials} random-date trials. Random dates are not verified non-events.` });
    if (v.baseline?.auroraV2) paras.push({ kind: "note", provisional: true, text: `Aurora v2 full chains: ${v.baseline.auroraV2.actual} on recorded dates, comparison mean ${v.baseline.auroraV2.mean} across ${v.baseline.trials} random-date trials. ${v.baseline.auroraV2.sd === 0 && v.baseline.auroraV2.actual === v.baseline.auroraV2.mean ? "The comparison scores show no spread and match the events, so this comparison does not distinguish the dates. " : ""}Random dates are not verified non-events.` });
    if (v.events.some((e) => e.kp.transit.evidence)) {
      paras.push({
        kind: "note",
        text: "The practitioner appendix shows the event-day sky against natal houses, significators, planets and cusps. Major geometric contacts within 1° use an app display convention. These observations do not enter the two-period-lord score or random-date comparison. Event times and zones are shown below; an event ascendant is not calculated.",
        cites: [cites.add(KP_TRANSIT_EVIDENCE_SOURCE.label, KP_TRANSIT_EVIDENCE_SOURCE.url)],
        provisional: true,
      });
      for (const e of v.events) {
        if (!e.kp.transit.evidence) continue;
        paras.push({ kind: "p", text: `${S(e.label)} · ${e.date} · ${describeEventMoment(e, result.chart.timezone)}`, appendix: true });
        paras.push(transitEvidenceTable(e.label, e.kp.transit.evidence));
      }
    }
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
      const row = (name: string, st: BaselineStat) => [
        name,
        String(st.actual),
        `${st.mean} ± ${st.sd}`,
        `${st.percentile}`,
      ];
      sub.push({
        id: "validate-baseline",
        title: "Random-date comparison",
        paras: [
          {
            kind: "p",
            text: `Each matter was rescored at ${b.trials} sets of independently selected dates between ${b.span[0]} and ${b.span[1]}. Transits use each sampled date and the same natal chart. The mid-rank percentile counts scores below the actual score plus half the tied scores. These comparisons are descriptive and do not adjust for related measures or the selection of birth times. Random dates need not preserve plausible event ages or order.`,
          },
          {
            kind: "table",
            head: [
              "Measure",
              "Actual",
              "Comparison mean ± sd",
              "Percentile",
            ],
            rows: [
              row("KP period/cusp matches", b.confirmed),
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
            text: "The comparison describes results under this particular date-sampling rule; it does not establish whether a birth time or method is correct.",
          },
          ...(b.parashari ? parashariComparisonParas(b.parashari, b.trials, b.parashariExample, result.chart.timezone) : []),
        ],
      });
    } else {
      paras.push({
        kind: "note",
        text: "A random-date comparison needs at least two events spanning more than a year.",
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
            text: `For each planet, the houses it signifies give an expected nature (favourable through 2, 3, 10 and 11; harmful through 6, 8 and 12), read once directly and once through the sub lords of the cusps it signifies; the events that fell in its dasa, bhukti or antara give the observed nature. Read by the houses each signifies, ${s.agree} ran as KP expects and ${s.conflict} against; read through the sub lords of those cusps, ${s.agreeByCusp} as expected and ${s.conflictByCusp} against. The marked houses: ${KP_MARKED_KEY} (short meanings from Astro Secrets & KP Part 1 ch. 16).`,
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
              `${nat(p.expected)} (${markedHousesText(p.good, p.evil)})`,
              `${nat(p.expectedByCusp)} (delivers ${markedHousesText(p.goodKept, p.evilKept)})`,
              p.ran.length
                ? `${p.ran.length} (${p.favourable} fav., ${p.unfavourable} unfav., ${p.mixed} mixed)`
                : "—",
              nat(p.observed),
              p.agrees === null ? "—" : agreeWord(p.agrees),
              p.agreesByCusp === null ? "—" : agreeWord(p.agreesByCusp),
            ]),
          },
        ],
      });
    }
    return [{ id: "validate", title: "Events read back", kicker, paras, sub }];
  },
};
