import { useMemo } from "react";
import { Soft } from "@/lib/gentle";
import { SourceLink } from "@/components/source-link";
import { ModeText, SectionTitle, usePlain } from "@/components/mode-text";
import { Expander, HOW_COMPUTED, HOW_FOUND } from "@/components/working";
import { areaSeason } from "@shared/life-stage";
import { SIGNS, fmtDeg, fmtDegShort } from "@shared/astro";
import {
  BIRTH_STAR_CAVEATS,
  GANDANTA_DEG,
  birthStarReading,
  birthStarSource,
  shownBirthStarItems,
} from "@shared/birth-star";

const QUARTER = ["first", "second", "third", "fourth"];
const NTH = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** A longitude as degrees and minutes in its sign. The end of a span on a sign boundary reads 30°00' of the sign it closes. */
function at(lon: number, end = false): string {
  const l = ((lon % 360) + 360) % 360;
  const onEdge = Math.abs(l / 30 - Math.round(l / 30)) < 1e-9;
  if (end && onEdge) return `30°00' ${SIGNS[(Math.round(l / 30) + 11) % 12]}`;
  return `${fmtDegShort(l)} ${SIGNS[Math.floor(l / 30 + 1e-9) % 12]}`;
}

/** An arc as degrees and minutes. */
function arc(deg: number): string {
  const total = Math.round(deg * 60);
  const d = Math.floor(total / 60);
  const m = total % 60;
  return d ? `${d}°${String(m).padStart(2, "0")}'` : `${m}'`;
}

const yesNo = (v: boolean) => (v ? "yes" : "no");

/**
 * The birth star read as a separate modern layer (Sutton, The Nakshatras, 2014). It reads the natal
 * Moon's star and quarter only, and feeds no verdict. Withholding for a native under 18 is applied
 * in the shared module before anything here renders.
 */
export function BirthStarSection({
  moonLon,
  birthIso,
  asOfIso,
  withheld,
}: {
  moonLon: number;
  birthIso: string;
  /** The reading date, or the recorded date of passing. */
  asOfIso: string;
  withheld: boolean;
}) {
  const plain = usePlain();
  const s = useMemo(
    () => birthStarReading(moonLon, { withhold: withheld }),
    [moonLon, withheld],
  );
  const relationshipsInSeason = areaSeason("marriage", birthIso, asOfIso).inSeason;
  if (!s) return null;
  const items = shownBirthStarItems(s, plain, relationshipsInSeason);
  const facts = s.facts.filter((f) => !plain || !f.practitionerOnly);
  // The fact box sits on the chapter's first page; only a fact cited from elsewhere carries its own chip.
  const boxCite = birthStarSource(4, s.chapterPages[0]);
  const starStart = s.starIndex * (40 / 3);
  const padaStart = starStart + (s.pada - 1) * (10 / 3);
  const ch3 = (pages: string) => birthStarSource(3, pages);
  return (
    <section data-testid="birth-star">
      <SectionTitle
        plain="Your birth star"
        technical="Janma nakshatra"
        term="nakshatra"
      />
      <ModeText
        plain={
          <>
            The star the Moon was in at birth, read the way Komilla Sutton
            describes it in The Nakshatras (2014). This is a modern reading, kept
            apart from the classical texts used elsewhere in the app; it shapes
            no verdict.
          </>
        }
        practitioner={
          <>
            Janma nakshatra of the natal Moon, paraphrased from Sutton, The
            Nakshatras (2014), ch. 4, with her pada qualifications (ch. 3) and the
            48′ gandanta limit (ch. 7). A modern single-author layer, kept
            separate: it feeds no verdict, agreement, validation or
            rectification score.
          </>
        }
      />
      <div
        className="mt-3 rounded-md border bg-card px-3 py-3"
        data-testid="birth-star-card"
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold" data-testid="birth-star-name">
            {s.name}
          </span>
          {!plain && s.suttonName !== s.name && (
            <span className="text-xs text-muted-foreground">
              Sutton spells it {s.suttonName}
            </span>
          )}
          <span className="rounded border px-1.5 py-0.5 text-2xs uppercase tracking-wide text-muted-foreground">
            Sutton (modern)
          </span>
        </div>
        <p
          className="mt-1 text-xs text-muted-foreground tabular"
          data-testid="birth-star-position"
        >
          {plain
            ? `The Moon was at ${fmtDegShort(s.moonLon)} in ${SIGNS[s.signIndex]}, in the ${QUARTER[s.pada - 1]} quarter of ${s.name}.`
            : `Moon ${fmtDeg(s.moonLon)} ${SIGNS[s.signIndex]} · pada ${s.pada} · navamsa ${SIGNS[s.navamsaSign]} · ${s.moonLon.toFixed(4)}° sidereal`}
        </p>

        <dl
          className="mt-3 grid grid-cols-[minmax(6rem,max-content)_1fr] gap-x-4 gap-y-1.5 text-xs"
          data-testid="birth-star-facts"
        >
          {facts.map((f) => (
            <div key={f.key} className="contents">
              <dt className="text-muted-foreground">
                {plain ? f.label : (f.technical ?? f.label)}
              </dt>
              <dd className="leading-relaxed" data-testid={`birth-star-fact-${f.key}`}>
                <Soft>{plain ? f.plain : cap(f.text)}</Soft>
                {f.cite.label !== boxCite.label && (
                  <>
                    {" "}
                    <SourceLink source={f.cite} />
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-1.5 text-2xs text-muted-foreground">
          {plain ? "From Sutton's summary of the star" : "Fact box"}{" "}
          <SourceLink source={boxCite} />
        </p>

        <ul className="mt-3 space-y-2.5" data-testid="birth-star-items">
          {items.map((i) => (
            <li key={i.id} data-testid={`birth-star-item-${i.id}`}>
              <p className="text-xs font-medium">
                {plain ? i.title : (i.technical ?? i.title)}
              </p>
              <p className="mt-0.5 max-w-[68ch] text-sm leading-relaxed">
                <Soft>{plain ? i.plain : i.text}</Soft>
                {i.early && !plain && (
                  <span className="text-muted-foreground">
                    {" "}
                    (for the adult years)
                  </span>
                )}{" "}
                <SourceLink source={i.cite} />
              </p>
            </li>
          ))}
        </ul>

        {!plain && s.notes.length > 0 && (
          <div className="mt-3" data-testid="birth-star-notes">
            <p className="text-xs font-medium">Where the book disagrees with itself</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {s.notes.map((n, k) => (
                <li key={k}>
                  {n.text} <SourceLink source={n.cite} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <Expander
          testId="birth-star-how-found"
          label={HOW_FOUND}
          className="mt-3 border-t pt-3"
          contentClassName=""
        >
          <ul
            className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
            data-testid="birth-star-found"
          >
            {plain ? (
              <>
                <li>
                  The Moon was at {fmtDegShort(s.moonLon)} in {SIGNS[s.signIndex]}.
                  Each star covers 13°20' and each quarter 3°20'. {s.name} runs
                  from {at(starStart)} to {at(starStart + 40 / 3, true)}, and its{" "}
                  {QUARTER[s.pada - 1]} quarter from {at(padaStart)} to{" "}
                  {at(padaStart + 10 / 3, true)}.
                </li>
                <li>
                  Divided into nine, the sign gives this quarter to{" "}
                  {SIGNS[s.navamsaSign]} (the {NTH[s.navamsaOfSign - 1]} of nine).
                </li>
                <li>
                  The same sign in both: {yesNo(s.flags.vargottama)}.{" "}
                  <SourceLink source={ch3("28–30")} />
                </li>
                <li>
                  One of the 24 nourishing quarters: {yesNo(s.flags.pushkara)}.{" "}
                  <SourceLink source={ch3("30–31")} />
                </li>
                <li>
                  The smaller division eighth from the sign:{" "}
                  {yesNo(s.flags.ashtamamsha)}.{" "}
                  <SourceLink source={ch3("33–37")} />
                </li>
                <li>
                  Within {arc(GANDANTA_DEG)} of a point where the sign and the star
                  change together: {yesNo(s.flags.gandanta)} ({arc(s.junctionDeg)}{" "}
                  away). <SourceLink source={birthStarSource(7, "267–270")} />
                </li>
              </>
            ) : (
              <>
                <li>
                  Moon {fmtDeg(s.moonLon)} {SIGNS[s.signIndex]} (
                  {s.moonLon.toFixed(4)}° sidereal, the chart's ayanamsa).
                </li>
                <li>
                  {s.name} {at(starStart)} – {at(starStart + 40 / 3, true)}; pada{" "}
                  {s.pada} {at(padaStart)} – {at(padaStart + 10 / 3, true)};{" "}
                  {s.offsetDeg.toFixed(4)}° into the star.
                </li>
                <li>
                  Navamsa {SIGNS[s.navamsaSign]}, the {NTH[s.navamsaOfSign - 1]}{" "}
                  navamsa of {SIGNS[s.signIndex]}.
                </li>
                <li>
                  Vargottama: {yesNo(s.flags.vargottama)}.{" "}
                  <SourceLink source={ch3("28–30")} />
                </li>
                <li>
                  Pushkara navamsa: {yesNo(s.flags.pushkara)} (fire signs the 7th
                  and 9th, earth the 3rd and 5th, air the 6th and 8th, water the
                  1st and 3rd). <SourceLink source={ch3("30–31")} />
                </li>
                <li>
                  Ashtamamsha, navamsa 8th from the rashi:{" "}
                  {yesNo(s.flags.ashtamamsha)}.{" "}
                  <SourceLink source={ch3("33–37")} />
                </li>
                <li>
                  Gandanta: {yesNo(s.flags.gandanta)}, {arc(s.junctionDeg)} from the
                  nearest water–fire junction (limit {arc(GANDANTA_DEG)}).{" "}
                  <SourceLink source={birthStarSource(7, "267–270")} />
                </li>
              </>
            )}
          </ul>
        </Expander>
      </div>

      <Expander
        testId="birth-star-method"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
          data-testid="birth-star-caveats"
        >
          {BIRTH_STAR_CAVEATS.map((c, k) => (
            <li key={k}>{c}</li>
          ))}
        </ul>
      </Expander>
    </section>
  );
}
