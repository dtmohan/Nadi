// Rectify: the scan the Rectify tab was looking at, one method at a time, with each interval's score
// and, for the event methods, its standing against random dates. A tool rather than a reading.
import { DateTime } from "luxon";
import { NAKSHATRAS, SIGNS } from "../astro";
import { RAO_SOURCE } from "../jaimini-areas";
import { scoreMarks } from "../body-marks";
import { KP_TRANSIT_EVIDENCE_SOURCE, kpTransitEvidence } from "../kp-transit-evidence";
import { AURORA_SOURCE } from "../kp-aurora";
import { auroraEvidenceParas, auroraV2EvidenceParas, auroraV2StagesParas } from "./kp-aurora";
import { AURORA_V2_SOURCE } from "../kp-aurora-v2";
import { transitEvidenceTable } from "./kp-transit-evidence";
import { describeEventMoment } from "../events";
import { EVENT_TRANSIT_SCOPE } from "../transit-context";
import { PARASHARI_VARGA_SOURCE } from "../parashari-varga-evidence";
import { parashariEvidenceParas } from "./parashari-varga-evidence";
import { MANLEY_SOURCE, RAO_EDUCATION_SOURCE } from "../manley-evidence";
import { FUNCTIONAL_SOURCE } from "../parashari-functional";
import { manleyEvidenceParas } from "./manley-evidence";
import { hierarchyParas } from "./parashari-hierarchy";
import { hierarchyWindowStages } from "../parashari-hierarchy";
import { parashariComparisonParas } from "./parashari-comparison";
import { kpCatalogueParas } from "./kp-catalogue-evidence";
import { parashariCatalogueParas } from "./parashari-catalogue-evidence";
import { additionalSchoolParas } from "./additional-school-event-evidence";
import { alpEventParas } from "./alp-event-evidence";
import { kpMatchedParas } from "./kp-matched-comparison";
import { alpMatchedParas } from "./alp-matched-comparison";
import { catalogueComparisonParas } from "./catalogue-comparison";
import { qualifiedScoreParas, qualifiedComparisonParas } from "./qualified-event-scores";
import { qualifiedComparable } from "../qualified-event-scores";
import { createPlanetContext } from "../planet-context";
import { nakshatraContextParas } from "./nakshatra-context";
import {
  RECTIFY_METHODS,
  QUALIFIED_RECTIFY_METHODS,
  EVENT_METHODS,
  baselineFor,
  isKpMatchedMethod,
  kpMatchedComparable,
  methodLabel,
  methodScore,
  highlightedCandidates,
  alpBandRanking,
  rawScoreCoverage,
  groupNemaniSegments,
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
    const withDate = (time: string, iso: string, civilDate?: string) => {
      const date = civilDate ?? iso.slice(0, 10);
      return date === result.chart.birthDate ? time : `${date} ${time}`;
    };
    const windowParas = (): ReportPara[] => {
      const paras: ReportPara[] = scan.vargaWindows?.length ? [{
      kind: "table",
      head: ["Division", "Recorded-time ascendant", "Recorded-time window", "Windows in scan"],
      rows: scan.vargaWindows.map((v) => {
        const w = v.windows.find((x) => x.given);
        return [v.division, w ? SIGNS[w.sign] : "—", w ? `${withDate(w.start, w.startIso, w.startDate)}–${withDate(w.end, w.endIso, w.endDate)}` : "—", String(v.windows.length)];
      }),
      cites: [cites.add(MANLEY_SOURCE.label)],
      provisional: true,
    }, {
      kind: "note",
      text: "Divisional windows are sampled, rounded to seconds and clipped to the scan; D60 is especially sensitive. Planetary divisional positions and period lords can change within an ascendant window. The windows do not identify a correct birth time. Other windows are available in the Rectify tab.",
      provisional: true,
      }] : [];
      if (scan.hierarchySelections?.length) {
        const funnel = hierarchyWindowStages(scan.hierarchySelections, scan.segments.map((s) => s.parashariHierarchy ?? []));
        if (funnel.stages.length) {
          paras.push({ kind: "note", provisional: true,
            text: `Earlier experimental strict event funnel, retained for diagnostics: its incomplete D1 condition can stop a candidate before its divisional strength is considered. These counts are not exclusions or birth-time recommendations. All slices remain unresolved when evidence is incomplete. In four fresh public cases, no slice passed the D1 gate for both selected events. ${funnel.unassessed.length ? `Unassessed events: ${funnel.unassessed.map((i) => `${scan.hierarchySelections![i].label} ${scan.hierarchySelections![i].date}`).join("; ")}.` : ""}` });
          paras.push({ kind: "table", head: ["Older strict stage", "Midpoint slices matching subset"],
            rows: funnel.stages.map((stage) => [stage.label, `${stage.indices.length} of ${scan.segments.length}`]), provisional: true });
        }
      }
      const sample = scan.segments.find((segment) => segment.given && segment.candidate);
      if (sample?.candidate) paras.push(...nakshatraContextParas(createPlanetContext(sample.candidate.positions, {
        kind: "natal", instant: sample.candidate.birthUtc, ascendant: sample.candidate.ascendantLon,
        ayanamsa: result.chart.ayanamsa || "lahiri", precision: "full",
      }), cites, `Recorded-time interval midpoint ${sample.midDate} ${sample.mid}`));
      return paras;
    };
    if (state.method === "kunda-d81") {
      const windows = scan.kundaD81 ?? [];
      const shown = windows.filter((w) => w.check.trine || w.given);
      return [{
        id: "rectify",
        title: "Kunda · D81 / 27 stars",
        kicker,
        paras: [
          { kind: "lead", text: m.short, cites: [cites.add(m.source)] },
          { kind: "p", text: `The D81 scan uses the chart's selected ayanamsa. It found ${windows.length} sampled intervals in ± ${scan.windowMinutes} minutes. The table shows matching intervals and the recorded-time interval; boundaries are rounded to seconds, and very rapid changes can be missed, especially near the poles. A match does not prove a birth time.`, provisional: true },
          ...windowParas(),
          ...(windows.length ? [{
            kind: "table" as const,
            head: ["From", "To", "Midpoint", "Kunda star", "Birth star", "Check"],
            rows: shown.map((w) => [withDate(w.start, w.startIso, w.startDate), withDate(w.end, w.endIso, w.endDate), `${w.midDate !== result.chart.birthDate ? `${w.midDate} ` : ""}${w.mid}`, NAKSHATRAS[w.check.kundaNakshatra], NAKSHATRAS[w.check.birthStar], `${w.check.trine ? "matches" : "does not match"}${w.given ? "; recorded" : ""}`]),
          }] : [{ kind: "note" as const, text: "No D81 intervals were supplied; run the scan again." }]),
        ],
      }];
    }
    if (state.method === "kunda") {
      return [{
        id: "rectify",
        title: "Kunda · Raman example",
        kicker,
        paras: [
          { kind: "lead", text: m.short, cites: [cites.add(m.source)] },
          { kind: "note", text: "These are midpoint samples, not complete Kunda intervals. Raman's arithmetic can change several times per second, so this scan does not rank or identify a birth time.", provisional: true },
          ...windowParas(),
          { kind: "table", head: ["Sample time", "Kunda star", "Birth star", "Check"], rows: scan.segments.map((s) => [`${s.midDate && s.midDate !== result.chart.birthDate ? `${s.midDate} ` : ""}${s.mid}`, s.kunda ? NAKSHATRAS[s.kunda.kundaNakshatra] : "—", s.kunda ? NAKSHATRAS[s.kunda.birthStar] : "—", s.kunda ? (s.kunda.trine ? "matches" : "does not match") : "—"]) },
        ],
      }];
    }
    if (state.method === "alp-marriage") {
      const bands = scan.alpComparisonBands ?? [];
      const comparisonsRequested = scan.segments.some((s) => s.kpMatched) || !!scan.baseline;
      const matchedBands = bands.some((b) => b.comparisonId !== undefined);
      const ranking = alpBandRanking(bands, comparisonsRequested);
      return [{ id: "rectify", title: "ALP · marriage pada comparison", kicker, paras: [
        { kind: "lead", text: m.short, cites: [cites.add(m.source)] },
        { kind: "note", provisional: true, text: `Source-scoped research: this is a single ALP condition. Registered date-independent clues count once per candidate and matter; this ALP condition is event-dependent. ${comparisonsRequested ? "" : "Quick scan: random-date comparisons were not computed."}` },
        { kind: "note", provisional: true, text: `Every selectable whole second was checked against the actual marriage dates${matchedBands ? " and the available sequence-preserving shared-offset date sets" : scan.baseline ? " and independently drawn date sets in this older result" : ""}; consecutive seconds with identical individual results are grouped. The end is exclusive. Instants between seconds are not measured. This partial rule does not establish a birth time. ${ranking.comparable ? "All bands reaching the exploratory comparison cutoff are highlighted when a comparison is available." : bands.length ? "Eligibility, comparison dates or availability differs, so the bands cannot be ranked." : "No ALP bands are available; run a new scan with a marriage event."}` },
        { kind: "note", provisional: true, text: "Additional marriage facts are evaluated at the ordinary segment midpoint containing the recorded time, not at every second in these ALP bands." },
        ...alpMatchedParas(scan.segments.find((s) => s.given)?.alpMatched),
        { kind: "table", head: ["From", "To (exclusive)", "Candidate", "Matches", "Comparison mean", "Mid-rank", ""],
          rows: bands.map((b, i) => [`${b.startDate !== result.chart.birthDate ? `${b.startDate} ` : ""}${b.start}`, `${b.endDate !== result.chart.birthDate ? `${b.endDate} ` : ""}${b.end}`,
            `${b.midDate !== result.chart.birthDate ? `${b.midDate} ` : ""}${b.mid}`, b.max ? `${b.score}/${b.max}` : "unavailable",
            b.baseline ? String(b.baseline.mean) : "—", b.baseline ? `${b.baseline.percentile}%` : "—",
            [b.given ? "recorded" : "", ranking.highlighted.includes(i) ? "highlighted" : ""].filter(Boolean).join(", ")]) },
        ...windowParas(),
      ] }];
    }
    if (state.method === "parashari-events" || state.method === "parashari-events-v2" || state.method === "parashari-events-v3") {
      const v3 = state.method === "parashari-events-v3";
      const specific = state.method !== "parashari-events";
      const scored = scan.segments.map((s) => ({ s, ...methodScore(s, state.method) }));
      const anyScore = scored.some((r) => r.max > 0);
      const comparable = scored.length > 0 && scored[0].max > 0 && scored.every((r) => r.max === scored[0].max);
      const coverage = comparable ? rawScoreCoverage(scored.map(({ s, score }) => ({ score, startIso: s.startIso, endIso: s.endIso, given: s.given }))) : undefined;
      const top = Math.max(0, ...scored.map((r) => r.score));
      const given = scored.find((r) => r.s.given);
      const focus = given?.s ?? scored[0]?.s;
      const specificChecks = v3 ? focus?.parashariDivisional : focus?.parashariSpecific;
      return [{
        id: "rectify", title: `Parashari · event rule matches · ${v3 ? "v3" : specific ? "v2" : "v1"}`, kicker,
        paras: [
          { kind: "lead", text: m.short, cites: [cites.add(m.source)] },
          { kind: "note", text: EVENT_TRANSIT_SCOPE },
          ...(state.includeComparisons === false ? [{ kind: "note" as const, provisional: true,
            text: "Quick scan: random-date comparisons were not computed. Candidate event conditions use the same rules as the full scan; run a full scan or Validate to compare dates." }] : []),
          { kind: "note", provisional: true, text: "Registered date-independent clues count once per candidate and matter in these totals; event timing checks remain per event. Other factors can overlap." },
          { kind: "note", text: `The ${v3 ? "eight" : specific ? "six" : "five"} equal points are an experimental Nadi synthesis. These older point totals do not require D1 to pass before awarding later points. The separate strict funnel has known gaps and is diagnostic only; the cross-chart clues below do not change this ranking. D1 and divisional support can coexist with difficult indications; neither proves an event was promised. Other or explicitly mixed or unfavourable events are omitted from these scores. The random-date comparison is exploratory and is not calibrated to select a birth time. Before the correction to repeated natal clues, ${v3 ? "ten public cases had v3's highest intervals touch the reported-time ±5-minute band in four and cover 29% of the scanned hour on average. Held-out event scores resembled nearby dates. Its added period-lord checks can overlap with the earlier factors and with each other." : specific ? "nine public cases had v2's top intervals touch the reported-time ±5-minute band in eight but cover 35% of the scanned hour on average. At the reported birth times, held-out event scores were nearly the same on nearby comparison dates." : "an initial eight-person public-case test found the v1 highest scores missed the reported-time ±5-minute band in all eight cases."} These are historical results, not a validation of the revised totals. The samples are small and some times are uncertain. Do not use this ranking on its own to change a birth time.`, provisional: true },
          ...windowParas(),
          ...(!comparable ? [{ kind: "note" as const, text: anyScore
            ? "The eligible events differ across candidate times, so the totals cannot be ranked. Check event dates and times relative to birth."
            : "No eligible event is available to score.", provisional: true }] : []),
          ...(coverage ? [{ kind: "p" as const, text: `At sampled midpoints, the highest raw score ${coverage.top} covers approximately ${coverage.percent}% of the window. The recorded-time interval midpoint scores ${coverage.recorded ?? "—"}. Midpoint values can differ from other instants in the same interval.`, provisional: true }] : []),
          ...catalogueComparisonParas(focus?.baseline?.catalogueComparison),
          ...(focus?.baseline?.parashari && scan.baseline ? parashariComparisonParas(focus.baseline.parashari,
            scan.baseline.trials, focus.baseline.parashariExample, result.chart.timezone) : []),
          ...(focus?.parashariHierarchy ?? []).flatMap((e) => e ? hierarchyParas(e) : []),
          ...(anyScore ? [{ kind: "table" as const, head: ["From", "To", "Rule matches", "Recorded"], rows: scored.map(({ s, score, max }) => [withDate(s.start, s.startIso, s.startDate), withDate(s.end, s.endIso, s.endDate), `${score}/${max}${comparable && score === top ? " · highest" : ""}`, s.given ? "yes" : ""]) }] : []),
          ...((focus?.manley?.length ?? 0) ? [
            { kind: "note" as const, text: `Manley-style event clues below use the recorded-time interval midpoint ${focus?.midDate} ${focus?.mid}. ${v3 ? "The main and subperiod primary divisional links contribute to v3; the third period is descriptive." : "They are descriptive and do not change this score."} A repeated lord is not independent confirmation. Missing event clocks use noon, missing zones use the birth zone. Nodes receive but do not cast aspects; one-hop sign-ruler links are shown separately. The full manual funnel and fourth/fifth period levels are not automated. Admission is not necessarily the first day of study.`, provisional: true, cites: [cites.add(MANLEY_SOURCE.label)] },
            ...(focus?.manley ?? []).flatMap((e) => manleyEvidenceParas(e, cites.add(MANLEY_SOURCE.label),
              e.educationFourth ? cites.add(RAO_EDUCATION_SOURCE.label, RAO_EDUCATION_SOURCE.url) : undefined,
              cites.add(FUNCTIONAL_SOURCE.label, FUNCTIONAL_SOURCE.url))),
          ] : []),
          ...(specific ? (specificChecks ?? []).map((p) => ({ kind: "p" as const, text: `At recorded interval midpoint ${focus?.mid}: ${p.label} ${p.date}, ${p.score}/${p.max}. ${p.factors.map((f) => `${f.label}: ${f.matched ? "match" : "no match"} (${f.details.join("; ") || "none found"})`).join(". ")}.${p.matter === "marriage" ? " The Vivah Saham check counts full aspects; Jupiter occupying the same sign is not counted." : ""} D1 difficult: ${p.d1Strain.join("; ") || "none found"}; ${p.division} difficult: ${p.divisionStrain.join("; ") || "none found"}.`, provisional: true,
            cites: [cites.add("K.N. Rao-guided Astrology and Timing of Marriage, ch. 2", "https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008"), cites.add("Astrological Assessment of Timing of Childbirth, §§2.6–2.7", "https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf"), cites.add("Vishnu Bhaskar, Advanced Techniques of Predictive Astrology, vol. 1 pp. 23–24", "https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html"), ...(v3 ? [cites.add(MANLEY_SOURCE.label)] : [])] })) : (focus?.parashariPromise ?? []).map((p) => ({ kind: "p" as const, text: `At recorded interval midpoint ${focus?.mid}: ${p.label} ${p.date}, ${p.score}/5. D1 support: ${p.d1Support.join("; ") || "none found"}; D1 difficult: ${p.d1Strain.join("; ") || "none found"}; ${p.division} support: ${p.divisionSupport.join("; ") || "none found"}; ${p.division} difficult: ${p.divisionStrain.join("; ") || "none found"}. ${p.periods.map((x) => `${x.level} ${x.planet}: ${x.links.join("; ") || "no house link"}`).join(". ")}. Shared transit: ${p.doubleTransitTargets.join("; ") || "none"}.`, provisional: true }))),
        ],
      }];
    }
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
    const qualifiedKey = QUALIFIED_RECTIFY_METHODS[state.method];
    const eventMethod = EVENT_METHODS.includes(state.method);
    const matchedRequested = isKpMatchedMethod(state.method) && scan.segments.some((s) => s.kpMatched);
    const matchedComparable = !matchedRequested || (kpMatchedComparable(scan.segments) && scored.every((r) => !!r.b));
    const comparable = matchedComparable && (!eventMethod || (maxOf > 0 && scored.every((r) => r.sc.max === maxOf))) && (!qualifiedKey || (maxOf > 0 && scored.every((r) => r.sc.max === maxOf) &&
      scored.every((r) => qualifiedComparable(scored[0].seg.events.map((e) => e.qualifiedScores), r.seg.events.map((e) => e.qualifiedScores), qualifiedKey)) &&
      (!scored.some((r) => r.b) || scored.every((r) => r.b))));
    const highlighted = new Set(comparable ? highlightedCandidates(scored.map((x) => ({ score: x.sc.score, b: x.b }))) : []);
    const best = scored.filter((_, i) => highlighted.has(i));
    const given = scan.segments.find((s) => s.given);
    const nemaniGroups = state.method === "kp-nemani-rp" ? groupNemaniSegments(scan.segments) : [];
    const zone = result.chart.timezone;
    const judgedAt = DateTime.fromISO(scan.ruling.asOf).setZone(
      scan.judgedAt.timezone,
    );
    const src = cites.add(m.source);
    const hasSelectedComparison = scored.some((r) => !!r.b);

    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `${m.system}, ${methodLabel(m)}: ${S(ctx.plain ? m.plainShort : m.short)}`,
        cites: [src],
      },
      {
        kind: "p",
        text: `The window runs ± ${scan.windowMinutes} minutes around the recorded time of ${scan.given.time} (${zone}), divided into ${scan.segments.length} sampled intervals. Each score uses its midpoint; other inputs can change within an interval. ALP boundaries for actual marriage dates are included; ALP changes at comparison dates are sampled at the midpoint.${m.needsJudge ? ` The judgment location is ${scan.judgedAt.label}, at ${judgedAt.toFormat("d LLL yyyy HH:mm:ss")}.` : ""}${m.needsEvents ? ` ${state.events.length} dated event${state.events.length === 1 ? "" : "s"} ${state.events.length === 1 ? "is" : "are"} read: ${list(state.events.map((e) => `${S(e.label)} (${e.date}, ${describeEventMoment(e, zone)})`))}. Without a time, noon is assumed; without a zone, the birth zone is assumed. Random dates retain each event's local time and zone.` : ""}${state.method === "bj-marks" ? ` Limbs confirmed to carry a mark: ${state.confirmedMarks.length ? list(state.confirmedMarks) : "none"}.` : ""}`,
      },
    ];
    if (m.needsEvents) paras.push({ kind: "note", text: EVENT_TRANSIT_SCOPE });
    if (qualifiedKey) paras.push({ kind: "note", provisional: true,
      text: "Registered date-independent clues count once per candidate and matter in these totals; other factors can overlap." });
    if (m.needsEvents && state.includeComparisons === false) paras.push({ kind: "note", provisional: true,
      text: "Quick scan: random-date comparisons were not computed. Candidate event conditions use the same rules as the full scan; run a full scan or Validate to compare dates." });
    paras.push(...windowParas());
    const coverage = state.method !== "bj-marks" && maxOf > 0 && comparable && !(state.method === "kp-nemani-rp" && top === 0) ? rawScoreCoverage(scored.map((r) => ({
      score: r.sc.score, startIso: r.seg.startIso, endIso: r.seg.endIso, given: r.seg.given,
    }))) : undefined;
    if (coverage) paras.push({
      kind: "p",
      text: `At sampled midpoints, the highest raw score (${fmtScore(coverage.top)} of ${maxOf}) covers approximately ${coverage.percent}% of this window.${coverage.recorded !== undefined ? ` The midpoint of the recorded-time interval scores ${fmtScore(coverage.recorded)} of ${maxOf}.` : ""} Scores can change within an interval; highlights use a separate comparison when available.`,
      provisional: true,
    });
    if (state.method === "kp-nemani-rp" && top === 0) paras.push({
      kind: "note",
      text: "No sampled interval matched all three levels. This is not evidence that the recorded time is wrong.",
      provisional: true,
    });
    if (best.length && state.method === "kp-nemani-rp") {
      const matches = nemaniGroups.filter((g) => g.first.nemani?.all).length;
      paras.push({ kind: "p", text: `All three levels link in ${matches} of ${nemaniGroups.length} groups. Adjacent samples are grouped only when their rising sign, lords and displayed connections agree. A match does not establish a birth time.`, provisional: true });
    } else if (best.length) {
      const ranges: Array<{ first: RectifySegment; last: RectifySegment }> = [];
      for (const row of best) {
        const previous = ranges.at(-1);
        if (previous && previous.last.endIso === row.seg.startIso) previous.last = row.seg;
        else ranges.push({ first: row.seg, last: row.seg });
      }
      const shown = ranges.slice(0, 8).map((r) =>
        `${withDate(r.first.start, r.first.startIso, r.first.startDate)} to ${withDate(r.last.end, r.last.endIso, r.last.endDate)}`);
      paras.push({
        kind: "p",
        text: `Highlighted intervals: ${list(shown)}${ranges.length > shown.length ? `, and ${ranges.length - shown.length} more ranges shown in the table` : ""}. ${eventMethod && hasSelectedComparison ? "Every interval reaching the exploratory 95th-percentile cutoff is highlighted; this is not a ranking by birth-time likelihood, and scores can differ within a highlighted range." : `The highest raw score is ${fmtScore(top)} of ${maxOf}.`}${given ? ` The recorded time falls in ${given.start.slice(0, 5)} to ${given.end.slice(0, 5)}, scoring ${fmtScore(methodScore(given, state.method, marksCtx).score)} of ${methodScore(given, state.method, marksCtx).max}.` : ""}`,
        tone: given && best.some((x) => x.seg.given) ? "support" : "mixed",
      });
    } else {
      paras.push({
        kind: "p",
        text: !comparable ? maxOf === 0 ? "No eligible events can be scored under this method." : "Eligibility or comparison availability differs across candidate intervals; these totals cannot be ranked." : eventMethod && hasSelectedComparison ? "No candidate meets the exploratory highlighting rule." : "No interval in the window scores under this method.",
      });
    }
    if (matchedRequested) paras.push(...kpMatchedParas(given?.kpMatched));
    if (state.method === "kp-events" && matchedRequested) paras.push({ kind: "note", provisional: true,
      text: "The score includes one fixed natal cusp point for each distinct matter and three period hits per event. The matched-date comparison measures only those period hits, excluding the fixed natal points; its actual and mean therefore use a different denominator from the displayed score." });
    if (eventMethod && scan.baseline && !matchedRequested) {
      const gb = given ? baselineFor(given, state.method) : undefined;
      paras.push({
        kind: "p",
        text: `Each candidate's events were rescored at ${scan.baseline.trials} sets of independently selected dates between ${scan.baseline.span[0]} and ${scan.baseline.span[1]}. The transits are recalculated for each date against that candidate's natal chart. The mid-rank percentile counts ties halfway; it is descriptive and does not adjust for choosing among candidates or related measures. Random dates need not preserve plausible event ages or order.${gb ? ` The recorded interval is at the ${gb.percentile}th percentile of its comparison.` : ""}`,
        provisional: true,
      });
    }
    const hasStability = scan.segments.some((sg) => sg.stability);
    const firmCol = hasStability ? ["Firm cusps"] : [];
    const head = eventMethod
      ? [
          "From",
          "To",
          "Lagna",
          "Sign / star / sub lord",
          ...firmCol,
          "Score",
          state.method === "kp-events" && matchedRequested ? "Timing-only comparison mean" : "Comparison mean",
          "Percentile",
          "",
        ]
      : [
          "From",
          "To",
          "Lagna",
          "Sign / star / sub lord",
          ...firmCol,
          "Score",
          "",
        ];
    if (hasStability && state.method !== "kp-nemani-rp") {
      const splits = scan.segments.filter(
        (sg) => sg.stability?.matterFirm === false,
      );
      paras.push({
        kind: "p",
        text: `Firm cusps counts the cusps, of twelve, whose sub lord agrees at the sampled start, midpoint and end. The scan also splits at sampled changes to event-related cusp sub lords; other cusps can change within an interval. Sorting ties uses matter-cusp stability, the number of firm cusps, and nearness to the recorded time; these are app conventions.${splits.length ? ` A named matter cusp still differs at sampled points in ${splits.length} interval${splits.length === 1 ? "" : "s"} (marked "splits").` : ""}`,
        provisional: true,
        cites: [
          cites.add(
            "Astro Secrets & KP, Part 1 pp. 176-177; Part 2 pp. 60-61; Part 3 p. 4, pp. 160-162 (uploaded PDFs)",
          ),
        ],
      });
    }
    if (state.method === "kp-nemani-rp") paras.push({
      kind: "table",
      head: ["From", "To", "Rising sign and lords", "Connections", "Recorded"],
      rows: nemaniGroups.map((g) => [
        withDate(g.first.start, g.first.startIso, g.first.startDate),
        withDate(g.last.end, g.last.endIso, g.last.endDate),
        `${g.first.sign} · ${g.first.signLord} / ${g.first.starLord} / ${g.first.subLord}`,
        g.first.nemani?.all ? "all three link" : "not all three link",
        g.given ? "yes" : "",
      ]),
    });
    else paras.push({
      kind: "table",
      head,
      rows: scored.map((x, i) => {
        const st = x.seg.stability;
        const base = [
          withDate(x.seg.start, x.seg.startIso, x.seg.startDate),
          withDate(x.seg.end, x.seg.endIso, x.seg.endDate),
          x.seg.sign,
          `${x.seg.signLord} / ${x.seg.starLord} / ${x.seg.subLord}`,
          ...(hasStability
            ? [
                st
                  ? `${st.firm}/12${st.matterFirm === false ? " (splits)" : ""}`
                  : "—",
              ]
            : []),
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
            highlighted.has(i) ? "highlighted" : "",
          ]
            .filter(Boolean)
            .join(", "),
        );
        return base;
      }),
    });

    const sub: ReportSection[] = [];
    // Comparison cutoffs do not select a birth time; show the recorded interval by default.
    const focus = given ?? best[0]?.seg;
    if (focus) {
      const ps: ReportPara[] = [];
      const label = `${withDate(focus.start, focus.startIso, focus.startDate)} to ${withDate(focus.end, focus.endIso, focus.endDate)}, ${focus.sign} rising, sub lord ${focus.subLord}`;
      if (eventMethod) for (const e of focus.parashariHierarchy ?? []) if (e) ps.push(...hierarchyParas(e));
      if (eventMethod && focus.manley?.length) {
        const source = cites.add(MANLEY_SOURCE.label);
        ps.push({ kind: "note", text: `Manley-style event clues use the interval midpoint ${focus.midDate} ${focus.mid}. They are descriptive and do not change this method's score or establish a birth time. Repeated lords are not independent confirmations. Missing event clocks use noon, and missing zones use the birth zone. Nodes receive but do not cast aspects; one-hop sign-ruler links are shown separately. The full manual funnel and fourth/fifth period levels are not automated. Admission is not necessarily the first day of study.`, cites: [source], provisional: true });
        for (const e of focus.manley) ps.push(...manleyEvidenceParas(e, source,
          e.educationFourth ? cites.add(RAO_EDUCATION_SOURCE.label, RAO_EDUCATION_SOURCE.url) : undefined,
          cites.add(FUNCTIONAL_SOURCE.label, FUNCTIONAL_SOURCE.url)));
      }
      if (state.method === "kp-rp") {
        const rp = focus.rp;
        ps.push({
          kind: "p",
          text: `Sign lord ${focus.signLord}: ${rp.sign ? `ruling${rp.via.sign ? ` (${rp.via.sign})` : ""}` : "not ruling"}. Star lord ${focus.starLord}: ${rp.star ? `ruling${rp.via.star ? ` (${rp.via.star})` : ""}` : "not ruling"}. Sub lord ${focus.subLord}: ${rp.sub ? `ruling${rp.via.sub ? ` (${rp.via.sub})` : ""}` : "not ruling"}. Score ${rp.score} of ${rp.max}; the sub lord has double weight by app convention. The additional RP Moon score uses Nadi's Dutta-inspired mixed natal/judgment-chart interpretation; this is distinct from Nemani's all-judgment-chart test and does not establish a birth time.`,
          cites: [src],
        });
      } else if (state.method === "kp-nemani-rp") {
        const n = focus.nemani;
        ps.push({
          kind: "p",
          text: n ? `At this interval's midpoint, the judgment Moon's sign, star and sub lords are ${n.moon.signLord}, ${n.moon.starLord} and ${n.moon.subLord}. Sign: ${n.via.sign}. Star: ${n.via.star}. Sub: ${n.via.sub}. ${n.all ? "All three levels link" : "Not all three levels link"}. Positions for both sides of a link come from the judgment chart. A direct or two-step star/sub chain in either direction is the app's interpretation. This match has not been validated to identify a birth time.` : "No Nemani check was supplied; rerun the scan.",
          cites: [src],
          provisional: true,
        });
      } else if (state.method === "kp-moon") {
        const ml = focus.moonLords;
        ps.push({
          kind: "p",
          text: `Birth star ${ml.birthStar} (lord ${ml.birthStarLord}), Moon in ${ml.moonSign} (lord ${ml.moonSignLord}). The lagna sub lord ${ml.subLord} ${ml.star.level ? `reaches the birth star: ${ml.star.via}` : "does not reach the birth star"}; it ${ml.sign.owns ? "owns" : ml.sign.occupies ? "stands in" : "neither owns nor stands in"} the Moon sign. Score ${ml.score} of ${ml.max}.`,
          cites: [src],
        });
      } else if (state.method === "bj-marks") {
        const mk = scan.marks[focus.marksKey ?? focus.drekkana];
        if (mk) {
          const sc = scoreMarks(mk, state.confirmedMarks);
          ps.push({
            kind: "p",
            text: `${mk.drekkanaLabel}. Limbs the chart marks: ${mk.marks.length ? list(mk.marks.map((x) => `${x.limb} (${x.planet})`)) : "none"}. Confirmed and explained: ${sc.hits.length ? list(sc.hits) : "none"}; marked by the chart but not confirmed: ${sc.misses.length ? list(sc.misses) : "none"}; confirmed but unexplained: ${sc.unexplained.length ? list(sc.unexplained) : "none"}. Score ${sc.score} of ${sc.max}; this settles the drekkana, not the minute.`,
            cites: [src],
          });
        }
      } else if (state.method === "bj-nashta") {
        ps.push({
          kind: "p",
          text: focus.bjNashta ? `At the midpoint: ${focus.bjNashta.via}. Score ${focus.bjNashta.score} of ${focus.bjNashta.max}.` : "No lost-horoscope check was supplied.",
          cites: [src],
          provisional: true,
        });
      } else if (state.method === "kp-aurora-v2") {
        ps.push({ kind: "note", provisional: true, text: "Aurora mixed-script v2 is a source-inspired research adapter. A supportive sub can carry a mixed star with caution; a mixed sub remains unresolved. The screen does not establish a birth time.", cites: [cites.add(AURORA_V2_SOURCE)] });
        ps.push(...auroraV2StagesParas(focus.events.map((e) => e.auroraV2), focus.baseline?.auroraV2Stages, scan.baseline?.trials));
        if (focus.baseline?.auroraV2 && focus.baseline.auroraV2.sd === 0 && focus.baseline.auroraV2.actual === focus.baseline.auroraV2.mean)
          ps.push({ kind: "note", provisional: true, text: "The comparison scores show no spread and match the events, so this comparison does not distinguish the dates. Random dates are not verified non-events." });
        for (const e of focus.events) if (e.auroraV2) ps.push(...auroraV2EvidenceParas(e.auroraV2, `${S(e.label)} · ${e.date}`, cites.add(AURORA_V2_SOURCE)));
      } else if (state.method === "kp-aurora") {
        ps.push({ kind: "note", provisional: true, text: "Aurora staged scripts are a strict app research adapter. Mixed or silent stages do not pass, later stages cannot rescue them, and no complete chains passed in a small fresh-case pilot.", cites: [cites.add(AURORA_SOURCE)] });
        for (const e of focus.events) if (e.aurora) ps.push(...auroraEvidenceParas(e.aurora, `${S(e.label)} · ${e.date}`, cites.add(AURORA_SOURCE)));
      } else if (qualifiedKey) {
        for (const event of focus.events) ps.push(...qualifiedScoreParas(event.qualifiedScores, `${S(event.label)} · ${event.date}`, (source, url) => cites.add(source, url), qualifiedKey));
        ps.push(...qualifiedComparisonParas(focus.baseline?.qualified));
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
                  "Basic cusp link",
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
            text: `Sun hint: the Sun's sub lord on the day of judgement is ${scan.sunNow.subLord}${focus.sunHint.sub ? ", which is this interval's lagna sub lord" : focus.sunHint.star ? ", which is this interval's lagna star lord" : ", which is neither the lagna's star nor sub lord here"} (${focus.sunHint.score} of ${focus.sunHint.max}). This hint is separate from the event-transit score and comparison.`,
            cites: [src],
          });
        if (state.method === "kp-transit" && focus.candidate && scan.eventTransits) {
          ps.push({
            kind: "note",
            text: "The broader event-day sky is descriptive and does not enter the two-period-lord score or its random-date comparison. Contacts shown in the practitioner appendix are major geometric aspects within 1°, an app display convention. Event times and zones are shown below; an event ascendant is not calculated.",
            cites: [cites.add(KP_TRANSIT_EVIDENCE_SOURCE.label, KP_TRANSIT_EVIDENCE_SOURCE.url)],
            provisional: true,
          });
          for (let i = 0; i < focus.events.length; i++) {
            const e = focus.events[i];
            const sky = scan.eventTransits[i];
            if (!sky) continue;
            ps.push({ kind: "p", text: `${S(e.label)} · ${e.date} · ${describeEventMoment(e, zone)}`, appendix: true });
            ps.push(transitEvidenceTable(e.label, kpTransitEvidence(sky.positions, focus.candidate.kpPlanets, focus.candidate.kpCusps, e.houses)));
          }
        }
        if (state.method === "jaimini-dasha")
          ps.push({
            kind: "note",
            text: `Read at this candidate midpoint for ${focus.jaiminiSign.name} rising in the chart's own ayanamsa, chara dasha ${focus.jaiminiSign.direction}. Period boundaries may differ between candidate times in the same sign.`,
            cites: [cites.add(RAO_SOURCE.label, RAO_SOURCE.url)],
          });
      }
      if (state.method.startsWith("kp-") && focus.events.length) {
        for (const e of focus.events) ps.push(...kpCatalogueParas(e.natalRules, `${e.label} · ${e.date}`, (source, url) => cites.add(source, url), ctx.plain));
        ps.push({ kind: "note", provisional: true, text: "The following cusp filters and event-day Sun/Moon links use the same four-step evaluator as the chart's dated reading and Validate. They are descriptive and do not change the existing event or transit score." });
        for (const e of focus.events) ps.push({ kind: "p", provisional: true,
          text: `${S(e.label)} · ${e.date}: cusp sub lord ${e.cuspSubLord ?? "not selected"}, matter houses ${e.cuspSignified.join(", ") || "none listed"}. ${(["dasa", "bhukti", "antara"] as const).map((level, i) => `${level}: ${e.filtered[i].map((f) => `house ${f.house} through ${f.cuspSubLord}: ${f.denied ? "denied in this filter" : f.kept ? "kept" : "directed elsewhere"}`).join("; ") || "no selected house"}`).join(". ")}. Sun/Moon period links ${e.transit.luminary.sun ? "yes" : "no"}/${e.transit.luminary.moon ? "yes" : "no"}.` });
      }
      (focus.parashariOrdinary ?? []).forEach((evidence, i) => ps.push(...parashariCatalogueParas(evidence, focus.events[i]?.label ?? "Event", (source, url) => cites.add(source, url), ctx.plain)));
      for (const event of focus.events) ps.push(...additionalSchoolParas(event.additionalNatal, event.label, (source, url) => cites.add(source, url), "all", ctx.plain));
      for (const event of focus.events) ps.push(...alpEventParas(event.alp, event.label, (source, url) => cites.add(source, url), ctx.plain));
      if (focus.parashariVargas?.length) {
        ps.push({
          kind: "note",
          text: "The Parashari cross-check reads the relevant D1 house and the D7, D9 or D10 at this candidate midpoint. It is separate from the selected method's score and does not confirm an event or rank birth times.",
          cites: [cites.add(PARASHARI_VARGA_SOURCE.label, PARASHARI_VARGA_SOURCE.url)],
          provisional: true,
        });
        for (const evidence of focus.parashariVargas) ps.push(...parashariEvidenceParas(evidence));
      }
      sub.push({
        id: "rectify-focus",
        title: `The interval ${label}`,
        paras: ps,
      });
    }
    paras.push({
      kind: "note",
      text: "The scores are the app's provisional tallies of the books' conditions. A high score can cover a wide range or favour a time away from the recorded one. Use it to examine candidates alongside other evidence; it does not establish the birth time.",
      provisional: true,
    });
    return [
      { id: "rectify", title: "The birth-time scan", kicker, paras, sub },
    ];
  },
};
