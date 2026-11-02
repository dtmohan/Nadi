// Astro Lagna Paddhati: the progressed lagna, its houses and the running periods.
import { fmtDeg, SIGNS } from "../astro";
import { computeAlp, DEFAULT_ALP_CONFIG } from "../alp";
import { ALP_SOURCE_SITE, ALP_SOURCE_BOOKS } from "../rules-alp";
import { defaultAlpForTopics } from "../school-topics-expanded";
import { alpMarriageParas } from "./alp-marriage-context";
import { DateTime } from "luxon";
import {
  endStop,
  fmtDate,
  list,
  ORD,
  type ReportModule,
  type ReportPara,
} from "./types";

export const alpModule: ReportModule = {
  id: "alp",
  label: "ALP: the progressed lagna",
  short: "ALP",
  tab: "alp",
  build(ctx) {
    const { result, S, cites, asOf, lifeAt, deceased, withheld } = ctx;
    const config = DEFAULT_ALP_CONFIG;
    const alp = defaultAlpForTopics(result, withheld, ctx.tools.alpAsOf);
    const site = cites.add("ALP astrology, introduction", ALP_SOURCE_SITE);
    const p = alp.point;
    const arp = alp.arp;
    const dayLabel = DateTime.fromISO(alp.asOf, { setZone: true }).setZone(result.chart.timezone).toFormat("d LLL yyyy");
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Astro Lagna Paddhati moves the lagna forward at ${config.yearsPerSign} years per sign from its natal degree. On ${dayLabel} it stands at ${fmtDeg(p.lon)} ${p.sign} (lord ${p.lord}), in ${p.nakshatra} pada ${p.pada} (lord ${p.nakshatraLord}), the ${ORD(alp.houseFromJanma)} sign from the natal lagna. The Akshaya rasi, the Moon progressed the same way, is in ${arp.point.sign}, ${arp.point.nakshatra} pada ${arp.point.pada}; its nakshatra lord ${arp.dasa.lord} names the running ALP dasa (${fmtDate(arp.dasa.start)} to ${fmtDate(arp.dasa.end)}), with ${arp.bhukti.lord} bhukti to ${fmtDate(arp.bhukti.end)}.`,
        cites: [site],
      },
      {
        kind: "note",
        text: `By the book's whole-degree count (completed years times three, one degree per four months), the point is ${fmtDeg(alp.book.point.lon)} ${alp.book.point.sign}, ${alp.book.agreesWithContinuous ? "the same pada as the continuous count" : "a different pada from the continuous count; the continuous figure is used above"}.`,
        cites: [cites.add("ALP books (publisher's list)", ALP_SOURCE_BOOKS)],
        provisional: true,
      },
      {
        kind: "table",
        appendix: true,
        head: ["House from ALP", "Sign", "Lord", "Planets", "House from janma"],
        rows: alp.houses.map((h) => [
          ORD(h.house),
          h.sign,
          h.lord,
          h.planets.length ? h.planets.join(", ") : "—",
          ORD(h.houseFromJanma),
        ]),
      },
      {
        kind: "table",
        appendix: true,
        head: ["ALP sign", "From", "To", "Ages"],
        rows: alp.signPeriods
          .filter((s) => !deceased || s.start <= lifeAt)
          .map((s) => [
            `${s.sign}${s.current ? (deceased ? " (at passing)" : " (running)") : ""}`,
            fmtDate(s.start),
            fmtDate(s.end),
            `${Math.floor(s.ageStart)}–${Math.floor(s.ageEnd)}`,
          ]),
      },
    ];
    if (alp.ageYears >= 18) paras.push(...alpMarriageParas(alp.marriage, (source, url) => cites.add(source, url)));
    if (!deceased && alp.nakshatraPeriods.length)
      paras.push({
        kind: "table",
        appendix: true,
        head: ["Nakshatra in this sign", "Lord", "From", "To"],
        rows: alp.nakshatraPeriods.map((n) => [
          `${n.nakshatra ?? ""}${n.current ? " (running)" : ""}`,
          n.nakshatraLord ?? "",
          fmtDate(n.start),
          fmtDate(n.end),
        ]),
      });
    const fs = alp.findings;
    if (fs.length) {
      for (const f of fs)
        paras.push({
          kind: "p",
          text: S(`${endStop(f.text)}${f.here?.length ? ` Here: ${f.here.join("; ")}.` : ""}`),
          cites: [cites.add(f.source, f.sourceUrl)],
          aside: f.planets.length ? list(f.planets) : undefined,
          provisional: /notes|example|magazine/i.test(f.source),
        });
    } else {
      paras.push({
        kind: "note",
        text: "No entered ALP rule fires on this progressed lagna at the reading date.",
      });
    }
    paras.push({
      kind: "note",
      text: `The entered ALP rules include selected material from Volume 2, the publisher's website, two e-magazines and Book 1 class notes. Coverage is partial, and interpretations from class notes and worked examples remain provisional. Sign counted from ${SIGNS[alp.natalLagna.signIndex]}, the natal lagna.`,
      provisional: true,
    });
    return [
      {
        id: "alp",
        title: "The progressed lagna",
        kicker: "Astro Lagna Paddhati",
        paras,
      },
    ];
  },
};
