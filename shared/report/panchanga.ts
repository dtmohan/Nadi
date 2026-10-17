// The day of birth (Surya Siddhanta), the sky at the reading date, and the gochara from the natal Moon.
import { SUNRISE_DEFINITIONS } from "../schema";
import { fmtDeg, fmtDegShort, houseFrom, SIGNS } from "../astro";
import {
  BIRTH_STAR_CAVEATS,
  birthStarReading,
  birthStarSource,
  shownBirthStarItems,
  type BirthStarSource,
} from "../birth-star";
import { displayLocal } from "../time-basis";
import { PANCHANGA_SOURCES } from "../panchanga";
import { computeGochara, gocharaPlainEffect, GOCHARA_CAVEATS, natalOwnMarks } from "../gochara";
import { gocharaPractice, GOCHARA_PRACTICE_NOTES } from "../gochara-practice";
import {
  cap,
  endStop,
  fmtDate,
  ORD,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

export const panchangaModule: ReportModule = {
  id: "panchanga",
  label: "Day of birth and the sky today",
  short: "Panchanga",
  tab: "panchanga",
  build(ctx) {
    const { result, cites, asOf, deceased, pos, withheld } = ctx;
    const { chart, reading, now } = result;
    const out: ReportSection[] = [];

    if (result.panchanga) {
      const p = result.panchanga;
      const src = (k: keyof typeof PANCHANGA_SOURCES) =>
        cites.add(
          `Surya Siddhanta ${PANCHANGA_SOURCES[k].label.replace(/^Surya Siddhanta\s*/, "")}`,
          PANCHANGA_SOURCES[k].url,
        );
      const rise = displayLocal(
        p.sunrise,
        result.timeBasis,
        chart.timezone,
      ).toFormat("HH:mm");
      const set = displayLocal(
        p.sunset,
        result.timeBasis,
        chart.timezone,
      ).toFormat("HH:mm");
      out.push({
        id: "day",
        title: "The day of birth",
        kicker: "Panchanga · Surya Siddhanta",
        paras: [
          {
            kind: "p",
            text: `The birth fell on a ${p.vara.name}, the day of ${p.vara.lord}, counted from the sunrise at ${rise} (sunset ${set}; sunrise taken as the ${(SUNRISE_DEFINITIONS.find((d) => d.id === (p.sunriseDef ?? "edge"))?.label ?? "upper limb, with refraction").toLowerCase()}). The Moon stood ${Math.round(p.tithi.elapsed * 100)}% through ${p.tithi.name} of the ${p.tithi.paksha === "Shukla" ? "bright" : "dark"} fortnight, in ${p.nakshatra.name} (pada ${p.nakshatra.pada}, lord ${p.nakshatra.lord}); the yoga was ${p.yoga.name} and the karana ${p.karana.name}.`,
            cites: [
              src("day"),
              src("tithi"),
              src("nakshatra"),
              src("yoga"),
              src("karana"),
            ],
          },
          {
            kind: "note",
            text: "These are the five limbs of the day as the Surya Siddhanta defines them. The texts this report cites do not read character or fortune from the weekday, tithi, yoga or karana of birth, so no such reading is given here.",
          },
        ],
      });
    }

    // The birth star, a separate modern layer (Sutton, The Nakshatras, 2014). It reads the natal Moon
    // only and feeds no verdict; the selection and the adult-topic gate are the screen's own.
    const star = birthStarReading(pos("Moon").lon, { withhold: withheld });
    if (star) {
      const { plain, S } = ctx;
      const bc = (c: BirthStarSource) => cites.add(c.label, c.url);
      const QUARTER = ["first", "second", "third", "fourth"];
      const paras: ReportPara[] = [
        {
          kind: "p",
          text: plain
            ? `The Moon was in ${star.name} at birth, in its ${QUARTER[star.pada - 1]} quarter (${fmtDegShort(star.moonLon)} ${SIGNS[star.signIndex]}). What follows paraphrases Komilla Sutton's modern reading of this star. It is kept apart from the classical texts and shapes no verdict in this report.`
            : `Janma nakshatra ${star.name}${star.suttonName !== star.name ? ` (Sutton: ${star.suttonName})` : ""}, pada ${star.pada}: Moon ${fmtDeg(star.moonLon)} ${SIGNS[star.signIndex]}, navamsa ${SIGNS[star.navamsaSign]}. Paraphrased from Sutton's chapter on the star, with her pada qualifications (ch. 3) and the 48' gandanta limit (ch. 7). A modern single-author layer: it feeds no verdict, agreement, validation or rectification score.`,
          cites: [bc(birthStarSource(4, `${star.chapterPages[0]}–${star.chapterPages[1]}`))],
        },
      ];
      const facts = star.facts.filter((f) => !plain || !f.practitionerOnly);
      if (plain)
        paras.push({
          kind: "p",
          text: S(facts.map((f) => endStop(`${f.label}: ${f.plain}`)).join(" ")),
          cites: Array.from(new Set(facts.map((f) => bc(f.cite)))),
        });
      else
        paras.push({
          kind: "table",
          head: ["Fact", "Sutton", "Where"],
          rows: facts.map((f) => [
            f.technical ?? f.label,
            cap(f.text),
            f.cite.label.replace(/^Sutton 2014, /, "").replace("e-book ", ""),
          ]),
        });
      if (!plain)
        for (const n of star.notes)
          paras.push({ kind: "note", text: n.text, cites: [bc(n.cite)] });
      paras.push({ kind: "note", text: BIRTH_STAR_CAVEATS[0] });
      // Each reading under its own heading, as on the screen.
      const sub: ReportSection[] = shownBirthStarItems(star, plain, ctx.inSeason("marriage")).map((i) => ({
        id: `birth-star-${i.id}`,
        title: plain ? i.title : (i.technical ?? i.title),
        paras: [
          {
            kind: "p",
            text: S(endStop(plain ? i.plain : i.text)) + (i.early && !plain ? " (for the adult years)" : ""),
            cites: [bc(i.cite)],
          },
        ],
      }));
      out.push({
        id: "birth-star",
        title: "The birth star",
        kicker: "A modern reading · Sutton, The Nakshatras (2014)",
        paras,
        sub,
      });
    }

    if (!deceased) {
      const ju = now.positions.find((p) => p.planet === "Jupiter")!;
      const sa = now.positions.find((p) => p.planet === "Saturn")!;
      const jeeva = pos(reading.roles.native);
      const hj = houseFrom(jeeva.signIndex, ju.signIndex);
      const hs = houseFrom(jeeva.signIndex, sa.signIndex);
      const rel = (h: number) =>
        h === 1
          ? "over"
          : [5, 9].includes(h)
            ? "in trine to"
            : h === 7
              ? "opposite"
              : `in the ${ORD(h)} from`;
      const paras: ReportPara[] = [
        {
          kind: "p",
          text: `Jupiter stands in ${ju.sign}, ${rel(hj)} the natal Jeeva in ${jeeva.sign}; Saturn stands in ${sa.sign}, ${rel(hs)} it. In the Nadi method Jupiter's yearly passage is the clock and Saturn's the second hand: a matter ripens when Jupiter comes over its karaka or in trine to it while the chart already carries the combination.`,
          cites: [cites.add("R.G. Rao, Bhrigu Nandi Nadi")],
        },
      ];
      // Gochara from the natal Moon, Brihat Samhita 104 and Phaladeepika 26.
      const moon = pos("Moon");
      const g = computeGochara(
        moon.signIndex,
        now.positions,
        now.asOf,
        withheld,
        { ownMarks: natalOwnMarks(result.positions, result.jaimini.lagna.lon) },
      );
      const rows = g.rows.map((r) => {
        // Where a rule voids the house's own result, the plain reading names the rule, not the voided text.
        const plainVoid = ctx.plain && !!r.voided;
        const effects = plainVoid
          ? gocharaPlainEffect(r)
          : [r.effect.bs?.text, r.effect.pd?.text].filter(Boolean).join("; ");
        const vedha =
          r.favourable && r.vedhaBy.length
            ? `vedha by ${r.vedhaBy.join(", ")}`
            : "";
        // The rules that changed the house verdict: 26.41 marks, dignity 26.31-32, aspect 26.30.
        const notes = [...(plainVoid ? [] : [r.avNote?.text, r.dignityNote?.text, r.aspectNote?.text]), r.practiceName ? `name in practice (provisional): ${r.practiceName.text}` : undefined]
          .filter((t): t is string => !!t)
          .map((t) => ctx.S(t));
        return [
          r.planet,
          `${SIGNS[r.signIndex]}, ${ORD(r.house)} from the Moon`,
          r.verdict,
          [ctx.S(effects), vedha, ...notes].filter(Boolean).join(" · ") || "—",
        ];
      });
      const srcs = new Set<number>();
      for (const r of g.rows) {
        for (const s of r.favourableSources)
          srcs.add(cites.add(s.label, s.url));
        if (r.effect.bs)
          srcs.add(cites.add(r.effect.bs.source.label, r.effect.bs.source.url));
        if (r.effect.pd)
          srcs.add(cites.add(r.effect.pd.source.label, r.effect.pd.source.url));
        for (const n of [r.avNote, r.dignityNote, r.aspectNote])
          for (const s of n?.sources ?? []) srcs.add(cites.add(s.label, s.url));
      }
      paras.push({
        kind: "p",
        text: `Counted from the natal Moon in ${SIGNS[moon.signIndex]}, each transiting planet's sign is a house; the favourable houses and their vedha points follow the Brihat Samhita, the effects and the effective portion of each transit Phaladeepika 26.`,
        cites: Array.from(srcs),
      });
      paras.push({
        kind: "table",
        head: ["Planet", "Position", "Verdict", "Effect"],
        rows,
      });
      for (const c of GOCHARA_CAVEATS.slice(0, 3))
        paras.push({ kind: "note", text: c });
      // Practitioner checks: modern practice, provisional, never changing the verdicts above.
      const practice = gocharaPractice({
        natalMoonSign: moon.signIndex,
        natalLagnaSign: Math.floor(
          (((result.jaimini.lagna.lon % 360) + 360) % 360) / 30,
        ),
        birthStar: Math.floor(moon.lon / (360 / 27)),
        positions: now.positions,
        asOf: now.asOf,
        marsStay: now.marsStay,
        saturnPeriods: result.transits,
        fmtDate,
        classical: g.rows,
      });
      if (practice.length) {
        const pc = cites.add("Shivanshu Pande, Gochara Deep Dive (2026)");
        paras.push({
          kind: "p",
          text: "Beside the classical verdicts, a few checks from modern practice, paraphrased by chapter from one practitioner's book. They are not in Brihat Samhita or Phaladeepika and do not change the verdicts above.",
          cites: [pc],
          provisional: true,
        });
        paras.push({
          kind: "table",
          head: ["Check", "Reading"],
          rows: practice.map((c) => [
            `${c.title} (ch. ${c.sources
              .filter((s) => s.label.startsWith("Pande"))
              .map((s) => s.label.replace(/^.*ch\. /, ""))
              .join(", ")})`,
            c.lines
              .map((l) =>
                ctx.S(l.conflict ? `${l.text} ${l.conflict.text}` : l.text),
              )
              .join(" "),
          ]),
        });
        paras.push({ kind: "note", text: GOCHARA_PRACTICE_NOTES[5] });
      }
      out.push({
        id: "now",
        title: "The sky today",
        kicker: `Transits as of ${fmtDate(asOf)} · Brihat Samhita 104 · Phaladeepika 26`,
        paras,
      });
    }
    return out;
  },
};
