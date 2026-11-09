// Astro Lagna Paddhati: the progressed lagna, its houses and the running periods.
import { fmtDeg, SIGNS } from "../astro";
import { computeAlp, DEFAULT_ALP_CONFIG } from "../alp";
import { ALP_SOURCE_SITE, ALP_SOURCE_BOOKS } from "../rules-alp";
import { defaultAlpForTopics } from "../school-topics-expanded";
import { alpMarriageParas } from "./alp-marriage-context";
import { DateTime } from "luxon";
import { translate } from "../localization";
import { alpEvidenceClauseMalayalam } from "../malayalam-alp-evidence";
import { areaSeason, mentionsHeldArea } from "../life-stage";
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
    const allowed = (area: "career" | "wealth" | "marriage" | "children") =>
      ctx.inSeason(area) && areaSeason(area, result.utc, alp.asOf, result.chart).inSeason;
    const site = cites.add("ALP astrology, introduction", ALP_SOURCE_SITE);
    const p = alp.point;
    const arp = alp.arp;
    const dayLabel = DateTime.fromISO(alp.asOf, { setZone: true }).setZone(result.chart.timezone).toFormat("d LLL yyyy");
    const lead = `Astro Lagna Paddhati moves the lagna forward at ${config.yearsPerSign} years per sign from its natal degree. On ${dayLabel} it stands at ${fmtDeg(p.lon)} ${p.sign} (lord ${p.lord}), in ${p.nakshatra} pada ${p.pada} (lord ${p.nakshatraLord}), the ${ORD(alp.houseFromJanma)} sign from the natal lagna. The Akshaya rasi, the Moon progressed the same way, is in ${arp.point.sign}, ${arp.point.nakshatra} pada ${arp.point.pada}; its nakshatra lord ${arp.dasa.lord} names the running ALP dasa (${fmtDate(arp.dasa.start)} to ${fmtDate(arp.dasa.end)}), with ${arp.bhukti.lord} bhukti to ${fmtDate(arp.bhukti.end)}.`;
    const names = [p.sign, p.lord, p.nakshatra, p.nakshatraLord, arp.point.sign, arp.point.nakshatra, arp.dasa.lord, arp.bhukti.lord];
    const mlNames = names.map((name) => translate("ml", name));
    const leadMl = mlNames.every((name, i) => name !== names[i])
      ? `ആസ്ട്രോ ലഗ്ന പദ്ധതിയിൽ ജനനസമയത്തെ അംശത്തിൽനിന്ന് ഒരു രാശിക്ക് ${config.yearsPerSign} വർഷം എന്ന നിരക്കിൽ ലഗ്നം മുന്നോട്ടു നീങ്ങുന്നു. ${dayLabel} തീയതിയിൽ അത് ${fmtDeg(p.lon)} ${mlNames[0]} രാശിയിൽ (${mlNames[1]} അധിപൻ), ${mlNames[2]} നക്ഷത്രത്തിന്റെ ${p.pada}-ാം പാദത്തിലാണ് (${mlNames[3]} അധിപൻ); ജന്മലഗ്നത്തിൽനിന്ന് ${alp.houseFromJanma}-ാം രാശിയാണിത്. അതേ രീതിയിൽ മുന്നോട്ടു നീക്കിയ ചന്ദ്രന്റെ സ്ഥാനമായ അക്ഷയരാശി ${mlNames[4]} രാശിയിൽ ${mlNames[5]} നക്ഷത്രത്തിന്റെ ${arp.point.pada}-ാം പാദത്തിലാണ്. അതിന്റെ നക്ഷത്രാധിപനായ ${mlNames[6]} ആണ് നിലവിലെ ALP ദശയുടെ അധിപൻ (${fmtDate(arp.dasa.start)} മുതൽ ${fmtDate(arp.dasa.end)} വരെ); ${mlNames[7]} ഭുക്തി ${fmtDate(arp.bhukti.end)} വരെ.` : undefined;
    const bookText = `By the book's whole-degree count (completed years times three, one degree per four months), the point is ${fmtDeg(alp.book.point.lon)} ${alp.book.point.sign}, ${alp.book.agreesWithContinuous ? "the same pada as the continuous count" : "a different pada from the continuous count; the continuous figure is used above"}.`;
    const bookSign = translate("ml", alp.book.point.sign);
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: lead,
        ...(leadMl ? { translationMl: { source: lead, text: leadMl } } : {}),
        cites: [site],
      },
      {
        kind: "note",
        text: bookText,
        ...(bookSign !== alp.book.point.sign ? { translationMl: { source: bookText, text: `പുസ്തകത്തിലെ പൂർണ അംശക്കണക്കനുസരിച്ച് (പൂർത്തിയായ വർഷങ്ങൾ മൂന്നുകൊണ്ട് ഗുണിക്കുന്നു; നാലു മാസത്തിന് ഒരു അംശം) ബിന്ദു ${fmtDeg(alp.book.point.lon)} ${bookSign} രാശിയിലാണ്. ${alp.book.agreesWithContinuous ? "തുടർച്ചയായ കണക്കിലെ അതേ പാദമാണിത്" : "തുടർച്ചയായ കണക്കിൽനിന്ന് വ്യത്യസ്ത പാദമാണിത്; മുകളിൽ തുടർച്ചയായ കണക്കാണ് ഉപയോഗിച്ചത്"}.` } } : {}),
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
    if (allowed("marriage")) paras.push(...alpMarriageParas(alp.marriage, (source, url) => cites.add(source, url)));
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
    // Findings and their supporting clauses can mention several life areas at once.
    // Withhold the whole finding if any of those areas is not yet in season.
    const fs = alp.findings.filter((f) => !mentionsHeldArea(
      [f.text, ...(f.here ?? [])].join(" "), (area) => !allowed(area),
    ));
    if (fs.length) {
      for (const f of fs) {
        const source = S(endStop(f.text));
        const text = S(`${endStop(f.text)}${f.here?.length ? ` Here: ${f.here.join("; ")}.` : ""}`);
        const translatedSource = translate("ml", source);
        const evidence = (f.here ?? []).map(alpEvidenceClauseMalayalam);
        const expected = `${source}${f.here?.length ? ` Here: ${f.here.join("; ")}.` : ""}`;
        const ml = text === expected && translatedSource !== source && evidence.every(Boolean)
          ? `${translatedSource}${evidence.length ? ` ഇവിടെ: ${evidence.join("; ")}.` : ""}` : undefined;
        const aside = f.planets.length ? list(f.planets) : undefined;
        const translatedPlanets = f.planets.map((p) => translate("ml", p));
        const asideMl = aside && translatedPlanets.every((p, i) => p !== f.planets[i]) ? translatedPlanets.join(", ") : undefined;
        paras.push({
          kind: "p",
          text,
          ...(ml ? { translationMl: { source: text, text: ml } } : {}),
          cites: [cites.add(f.source, f.sourceUrl)],
          aside,
          ...(aside && asideMl ? { asideTranslationMl: { source: aside, text: asideMl } } : {}),
          provisional: /notes|example|magazine/i.test(f.source),
        });
      }
    } else if (!alp.findings.length) {
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
