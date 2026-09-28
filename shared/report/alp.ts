// Astro Lagna Paddhati: the progressed lagna, its houses and the running periods.
import { fmtDeg, SIGNS } from "../astro";
import { computeAlp, DEFAULT_ALP_CONFIG } from "../alp";
import { ALP_SOURCE_SITE, ALP_SOURCE_BOOKS } from "../rules-alp";
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
  tab: "alp",
  build(ctx) {
    const { result, S, cites, asOf, lifeAt, deceased, withheld } = ctx;
    const config = DEFAULT_ALP_CONFIG;
    const alp = computeAlp(
      result.positions,
      result.jaimini.lagna.lon,
      result.utc,
      deceased ? lifeAt : asOf,
      config,
      withheld,
    );
    const site = cites.add("ALP astrology, introduction", ALP_SOURCE_SITE);
    const p = alp.point;
    const arp = alp.arp;
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Astro Lagna Paddhati moves the lagna forward at ${config.yearsPerSign} years per sign from its natal degree. ${deceased ? "At the date of passing it stood" : "It now stands"} at ${fmtDeg(p.lon)} ${p.sign} (lord ${p.lord}), in ${p.nakshatra} pada ${p.pada} (lord ${p.nakshatraLord}), the ${ORD(alp.houseFromJanma)} sign from the natal lagna. The Akshaya rasi, the Moon progressed the same way, is in ${arp.point.sign}, ${arp.point.nakshatra} pada ${arp.point.pada}; its nakshatra lord ${arp.dasa.lord} names the running ALP dasa (${fmtDate(arp.dasa.start)} to ${fmtDate(arp.dasa.end)}), with ${arp.bhukti.lord} bhukti to ${fmtDate(arp.bhukti.end)}.`,
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
    if (!deceased && alp.nakshatraPeriods.length)
      paras.push({
        kind: "table",
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
          text: S(endStop(f.text)),
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
      text: `The ALP rules entered so far come from the publisher's website, the two e-magazines and class notes of the basic course; the printed volumes are not in hand, so every reading in this section is provisional until checked against them. Sign counted from ${SIGNS[alp.natalLagna.signIndex]}, the natal lagna.`,
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
