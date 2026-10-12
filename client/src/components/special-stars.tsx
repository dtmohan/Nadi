import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Soft } from "@/lib/gentle";
import { PlanetName } from "@/components/planet-name";
import { Cite, SourceLink } from "@/components/source-link";
import {
  ModeText,
  SectionTitle,
  useDeceased,
  useNowLabel,
  usePlain,
} from "@/components/mode-text";
import { Expander, HOW_COMPUTED, Working } from "@/components/working";
import { cn } from "@/lib/utils";
import { areaSeason } from "@shared/life-stage";
import {
  MARS_MIN_DAYS,
  STAR_PLANETS,
  toneOf,
  type ShownStarPassage,
  type SpecialStars,
  type StarPlanet,
  type StarReading,
  type StarTone,
} from "@shared/special-stars";

const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const TONE_BORDER: Record<StarTone, string> = {
  support: "border-l-verdict-good/70",
  strain: "border-l-verdict-bad/70",
  mixed: "border-l-verdict-mixed/70",
};
const TONE_PILL: Record<StarTone, string> = {
  support: "bg-verdict-good/15 text-verdict-good",
  strain: "bg-verdict-bad/10 text-verdict-bad",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
};
const TONE_LABEL: Record<StarTone, string> = {
  support: "supportive",
  strain: "testing",
  mixed: "mixed",
};
const SOURCE_LABEL: Record<StarReading["source"], string> = {
  phaladeepika: "Mantreswara",
  sarvatobhadra: "Quoted Sarvatobhadra verses",
  sutton: "Sutton (modern)",
};
const KANE_URL =
  "https://vishvasa.github.io/kalpAntaram/dharmaH/nibandhaH/en/kANe/history/v5p1/2_Astrology_and_dharmashAstra/15_Units_of_kAla/";

function ordinal(n: number): string {
  const s =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${s}`;
}

/** The readings shown for a passage in the current mode. The plain reading has no line for the
 * quoted Sarvatobhadra verses, and holds back a career reading before the working years. */
function shownReadings(p: ShownStarPassage, plain: boolean, birthIso: string) {
  const early = !areaSeason("career", birthIso, p.start).inSeason;
  return p.readings
    .filter((r) => !plain || (r.plain && !(r.area === "career" && early)))
    .map((r) => ({ r, early: r.area === "career" && early }));
}

function nowAndNext(
  passages: ShownStarPassage[],
  planet: StarPlanet,
  asOfIso: string,
  ok: (p: ShownStarPassage) => boolean,
) {
  const at = Date.parse(asOfIso);
  const mine = passages.filter((p) => p.planet === planet && ok(p));
  return {
    now: mine.find((p) => Date.parse(p.start) <= at && at < Date.parse(p.end)),
    next: mine.find((p) => Date.parse(p.start) > at),
  };
}

function Passage({
  p,
  label,
  birthIso,
}: {
  p: ShownStarPassage;
  label: string;
  birthIso: string;
}) {
  const plain = usePlain();
  const items = shownReadings(p, plain, birthIso);
  const tone = toneOf(items.map((x) => x.r));
  const tones = new Set(items.map((x) => x.r.tone));
  const differ = !plain && tones.has("strain") && tones.has("support");
  return (
    <div
      className={cn("mt-2 border-l-4 pl-2", tone && TONE_BORDER[tone])}
      data-testid={`special-star-${p.planet}-${p.start.slice(0, 10)}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums">
          {fmtD(p.start)} – {fmtD(p.end)}
        </span>
        {p.returns && (
          <span>
            {plain ? "(it turns back and returns)" : "(retrograde return)"}
          </span>
        )}
        {tone && (
          <span
            className={cn("rounded px-1.5 py-0.5 text-2xs", TONE_PILL[tone])}
          >
            {TONE_LABEL[tone]}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-sm">
        {plain ? (
          <>
            Through {p.nakshatra}, {p.star.plain}
          </>
        ) : (
          <>
            {p.nakshatra}: {p.star.name}, the {ordinal(p.count)} from the janma
            {p.planet === "Mars" ? `, ${p.days} days in the star` : ""}
          </>
        )}
      </div>
      <ul className="mt-1 space-y-1 text-xs leading-relaxed">
        {items.map(({ r, early }) => (
          <li key={r.source}>
            {!plain && (
              <span className="font-medium">{SOURCE_LABEL[r.source]}: </span>
            )}
            <Soft>{plain ? r.plain : r.text}</Soft>
            {early && !plain && (
              <span className="text-muted-foreground">
                {" "}
                (before the working years)
              </span>
            )}{" "}
            <SourceLink source={r.cite} />
          </li>
        ))}
        {differ && (
          <li className="text-muted-foreground">
            The readings pull in different directions here; each is given as its
            source states it.
          </li>
        )}
      </ul>
    </div>
  );
}

function PlanetCard({
  planet,
  s,
  asOfIso,
  birthIso,
}: {
  planet: StarPlanet;
  s: SpecialStars;
  asOfIso: string;
  birthIso: string;
}) {
  const plain = usePlain();
  const deceased = useDeceased();
  const nowLabel = useNowLabel();
  const { now, next } = useMemo(
    () =>
      nowAndNext(
        s.passages,
        planet,
        asOfIso,
        (p) => shownReadings(p, plain, birthIso).length > 0,
      ),
    [s.passages, planet, asOfIso, plain, birthIso],
  );
  return (
    <li
      className="rounded-md border bg-card px-3 py-2"
      data-testid={`special-stars-${planet}`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <PlanetName planet={planet} />
        {planet === "Mars" && (
          <span className="text-xs font-normal text-muted-foreground">
            {plain
              ? "only when it lingers six weeks or more"
              : `stays of ${MARS_MIN_DAYS} days or more`}
          </span>
        )}
      </div>
      {now ? (
        <Passage p={now} label={nowLabel} birthIso={birthIso} />
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          {deceased
            ? "No reading from these stars at passing."
            : "No reading from these stars now."}
        </p>
      )}
      {!deceased &&
        (next ? (
          <Passage p={next} label="Next" birthIso={birthIso} />
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            No later reading within a hundred years of birth.
          </p>
        ))}
    </li>
  );
}

function AllPassages({ s, birthIso }: { s: SpecialStars; birthIso: string }) {
  const [planet, setPlanet] = useState<StarPlanet>("Saturn");
  const rows = s.passages.filter((p) => p.planet === planet);
  return (
    <div data-testid="special-stars-all">
      <div className="flex flex-wrap gap-1.5 text-xs">
        {STAR_PLANETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlanet(p)}
            className={cn(
              "rounded border px-2 py-0.5",
              p === planet
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50",
            )}
            aria-pressed={p === planet}
            data-testid={`special-stars-filter-${p}`}
          >
            {p} ({s.passages.filter((x) => x.planet === p).length})
          </button>
        ))}
      </div>
      <ul className="mt-2 space-y-1" data-testid="special-stars-list">
        {rows.map((p) => (
          <li key={p.start + p.nakshatraIndex}>
            <Passage
              p={p}
              label={p.current ? "Running" : ""}
              birthIso={birthIso}
            />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
            No passage of {planet} through these stars.
          </li>
        )}
      </ul>
    </div>
  );
}

export function SpecialStarsSection({
  s,
  asOfIso,
  birthIso,
}: {
  s: SpecialStars;
  asOfIso: string;
  birthIso: string;
}) {
  const plain = usePlain();
  const deceased = useDeceased();
  return (
    <section data-testid="special-stars">
      <SectionTitle
        plain="Special stars"
        technical="Special nakshatras from the birth star"
      />
      <ModeText
        plain={
          <>
            Counting from your birth star, {s.janma} (the star the Moon was in
            at birth), the texts name certain stars as sensitive. When a slow
            planet passes through one, they read it by the planet's nature:
            Saturn, Mars, Rahu and Ketu as malefics, Jupiter as a benefic. Each
            planet shows the passage running {deceased ? "at passing" : "now"}
            {deceased ? "" : " and the next one"}; Mars only when it lingers.
            These colour the periods above; they are not forecasts of their own.
          </>
        }
        practitioner={
          <>
            Stars counted in 27 from the janma nakshatra ({s.janma}). Three
            readings, each kept to its source: Mantreswara's rule (Phaladeepika
            26.27-28), the Sarvatobhadra verses the translator quotes under
            26.48 from other works, and Komilla Sutton's modern readings (The
            Nakshatras, 2014, ch. 9). Passages through the named stars only,
            first entry to final exit; a return within eight months joins the
            earlier stay. Mars only for stays of {MARS_MIN_DAYS} days or more.
          </>
        }
      />
      {!s.hasData ? (
        <p className="mt-2 rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
          The special stars are computed when a chart is cast; reopen this chart
          to see them.
        </p>
      ) : (
        <ul
          className="mt-3 grid gap-2 md:grid-cols-2"
          data-testid="special-stars-now"
        >
          {STAR_PLANETS.map((p) => (
            <PlanetCard
              key={p}
              planet={p}
              s={s}
              asOfIso={asOfIso}
              birthIso={birthIso}
            />
          ))}
        </ul>
      )}
      {!plain && s.hasData && (
        <Working
          id="special-stars-every"
          label="Show every passage over the life"
          count={s.passages.length}
          className="mt-4"
        >
          <AllPassages s={s} birthIso={birthIso} />
        </Working>
      )}
      {!plain && (
        <>
          <Expander
            testId="special-stars-caveats-toggle"
            label={HOW_COMPUTED}
            className="mt-3"
            contentClassName=""
          >
            <ul
              className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
              data-testid="special-stars-caveats"
            >
              <li>
                The count is in 27 stars, as Sutton counts; the
                Abhijit-inclusive 28-star count of the Sarvatobhadra chakra, and
                its Jati, Desa and Abhisheka stars for kings, are not used.
              </li>
              <li>
                Only occupation of a star is read. The chakra's line vedha, and
                Mantreswara's seven-line chakra for the Sun (26.26), are not
                computed.
              </li>
              <li>
                Sutton's summary table swaps the 16th and the 23rd. Her text,
                the quoted verses and{" "}
                <Cite href={KANE_URL}>
                  Kane, History of Dharmasastra, vol. 5
                </Cite>{" "}
                put Sanghatika at the 16th and Vainashika at the 23rd, which is
                used here.
              </li>
              <li>
                Sutton's nine-fold tara groups (sampat, vipat and the rest) are
                not applied to these slow passages: Pande's Gochara Deep Dive
                keeps the tara cycle to the Moon's daily transit.
              </li>
              <li>
                The Sarvatobhadra verses are ones the translator, V. Subrahmanya
                Sastri, quotes from other works (the first from the
                Jatakabharana); they are not Mantreswara's own.
              </li>
              <li>
                For the 23rd, Sutton names Saturn, Mars and Rahu; nothing is
                added for Ketu there. She gives no reading for Jupiter in the
                25th.
              </li>
              <li>
                The Sun, Mercury and Venus are not read: each crosses a star in
                about two weeks. The Moon's daily passage belongs to the
                Panchanga tab.
              </li>
            </ul>
          </Expander>
        </>
      )}
    </section>
  );
}
