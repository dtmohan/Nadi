import type { ReactNode } from "react";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";
import { BPHS_URL } from "@shared/parashari-data";
import type { DashaGloss, ParashariFinding } from "@shared/parashari";
import type {
  NowTone,
  NowTransit,
  RunningCombination,
  TimingChange,
  TimingNow,
} from "@shared/timing-now";
import { Badge } from "@/components/ui/badge";
import { PlanetName } from "@/components/planet-name";
import { SectionTitle, useNowLabel, usePlain } from "@/components/mode-text";
import { SourceLink } from "@/components/source-link";
import { cn } from "@/lib/utils";

const fmtM = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const ord = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

const TONE_PILL: Record<NowTone, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};
const FINDING_TONE: Record<ParashariFinding["tone"], NowTone> = {
  support: "favourable",
  strain: "unfavourable",
  mixed: "mixed",
};

function Pill({ tone }: { tone?: NowTone }) {
  if (!tone) return null;
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium",
        TONE_PILL[tone],
      )}
    >
      {tone}
    </span>
  );
}

/** Scroll a section of the chapter into view. Hash routing rules out anchor links. */
export function jumpTo(testId: string) {
  document
    .querySelector(`[data-testid="${testId}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const SECTIONS = [
  {
    id: "now",
    target: "parashari-timing-now",
    plain: "Now and next",
    technical: "Now and next",
  },
  {
    id: "periods",
    target: "parashari-timing-periods",
    plain: "Life periods",
    technical: "Vimshottari",
  },
  {
    id: "transits",
    target: "parashari-timing-transits",
    plain: "Transits",
    technical: "Ashtakavarga transits",
  },
  {
    id: "year",
    target: "parashari-timing-year",
    plain: "Year by year",
    technical: "Sudarshana",
  },
  {
    id: "clocks",
    target: "parashari-other-clocks",
    plain: "Other clocks",
    technical: "Other dasas",
  },
] as const;

/** The chapter's contents, as buttons that scroll to each part. */
export function TimingContents() {
  const plain = usePlain();
  return (
    <nav
      className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"
      aria-label="Parts of the timing chapter"
      data-testid="timing-contents"
    >
      <span className="mr-1 text-muted-foreground">Jump to</span>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => jumpTo(s.target)}
          className="rounded border px-2 py-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          data-testid={`timing-jump-${s.id}`}
        >
          {plain ? s.plain : s.technical}
        </button>
      ))}
    </nav>
  );
}

function Details({ to, id }: { to: string; id: string }) {
  return (
    <button
      type="button"
      onClick={() => jumpTo(to)}
      className="ml-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      data-testid={`timing-now-jump-${id}`}
    >
      details
    </button>
  );
}

function Row({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[7rem_1fr]"
      data-testid={`timing-now-${id}`}
    >
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

function TransitLine({ t, plain }: { t: NowTransit; plain: boolean }) {
  return (
    <>
      In {SIGNS[t.signIndex]}, the {ord(t.house)}, from {fmtM(t.start)} to{" "}
      {fmtM(t.end)} <Pill tone={t.tone} />{" "}
      <span className="text-muted-foreground">
        {plain ? `${t.points} points` : `${t.points} in the Sarvashtakavarga`}
      </span>
    </>
  );
}

/** The incoming period's gloss: plain houses ruled, or the technical first sentence. */
function glossLine(g: DashaGloss | undefined, plain: boolean): string {
  if (!g) return "";
  if (plain) return g.plain;
  const first = g.summary.split(". ")[0];
  return first.endsWith(".") ? first : `${first}.`;
}

function ChangeLine({ c, plain }: { c: TimingChange; plain: boolean }) {
  const W = {
    spell: plain ? "spell" : "pratyantar",
    sub: plain ? "sub-period" : "antar",
    period: plain ? "period" : "dasa",
  };
  switch (c.kind) {
    case "spell":
      return (
        <>
          <PlanetName planet={c.lord!} /> {W.spell} begins, to {fmtD(c.end!)}
        </>
      );
    case "sub-period":
      return (
        <>
          <PlanetName planet={c.lord!} /> {W.sub} begins, to {fmtM(c.end!)}{" "}
          <Pill tone={c.tone} />
        </>
      );
    case "period":
      return (
        <>
          <PlanetName planet={c.lord!} /> {W.period} begins, {c.years} years{" "}
          <Pill tone={c.tone} />{" "}
          <span className="text-muted-foreground">
            {glossLine(c.gloss, plain)}
          </span>
        </>
      );
    case "year":
      return (
        <>
          {plain
            ? `The ${ord(c.house!)} house takes the year`
            : `Year-lagna moves to the ${ord(c.house!)} bhava`}{" "}
          <Pill tone={c.tone} />
        </>
      );
    case "transit": {
      const t = c.transit!;
      return (
        <>
          {t.planet} {t.retrogradeEntry ? "returns to" : "enters"}{" "}
          {SIGNS[t.signIndex]}, the {ord(t.house)} <Pill tone={t.tone} />{" "}
          <span className="text-muted-foreground">
            {plain
              ? `${t.points} points`
              : `${t.points} in the Sarvashtakavarga`}
          </span>
        </>
      );
    }
  }
}

const CHANGE_TARGET: Record<TimingChange["kind"], string> = {
  spell: "parashari-timing-periods",
  "sub-period": "parashari-timing-periods",
  period: "parashari-timing-periods",
  year: "parashari-timing-year",
  transit: "parashari-timing-transits",
};

/**
 * "Now and next": the running periods, this year of life, Saturn and Jupiter now, the
 * combinations the running lords take part in, and the changes within eighteen months.
 * Every line summarises a section further down the chapter and links to it.
 */
export function TimingNowPanel({
  now,
  combos,
  deceased,
}: {
  now: TimingNow;
  combos: RunningCombination[];
  deceased: boolean;
}) {
  const plain = usePlain();
  const nowLabel = useNowLabel();
  const W = {
    period: plain ? "period" : "dasa",
    sub: plain ? "sub-period" : "antar",
    spell: plain ? "spell" : "pratyantar",
  };
  const { dasa, antar, pratyantar, year, saturn, jupiter } = now;
  const lordsTied = combos.some((c) => c.sourced);
  return (
    <section
      className="mt-4 scroll-mt-24 rounded-md border bg-card px-4 py-3"
      data-testid="parashari-timing-now"
    >
      <SectionTitle
        plain="Now and next"
        technical="Running periods, year, transits and coming changes"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {deceased
          ? plain
            ? "Where this chart stood on Parashara's clocks at the recorded date of passing. Each line sums up a part of the chapter below."
            : "The running Vimshottari levels, Sudarshana year and Ashtakavarga transits at the recorded date of passing; each line summarises a section below."
          : plain
            ? "Where this chart stands on Parashara's clocks today, and what changes in the next eighteen months. Each line sums up a part of the chapter below."
            : "The running Vimshottari levels, the Sudarshana year-lagna, Saturn and Jupiter by Ashtakavarga, and the changes within eighteen months; each line summarises a section below."}
      </p>
      <dl className="mt-3 space-y-2.5">
        {dasa && (
          <Row label={nowLabel} id="periods">
            <span className="block">
              <PlanetName planet={dasa.lord} /> {W.period}, {fmtM(dasa.start)}{" "}
              to {fmtM(dasa.end)} <Pill tone={dasa.tone} />
            </span>
            {antar && (
              <span className="mt-0.5 block">
                <span className="text-muted-foreground">within it, </span>
                <PlanetName planet={antar.lord} /> {W.sub}, {fmtM(antar.start)}{" "}
                to {fmtM(antar.end)} <Pill tone={antar.tone} />
              </span>
            )}
            {pratyantar && (
              <span className="mt-0.5 block">
                <span className="text-muted-foreground">and the </span>
                <PlanetName planet={pratyantar.lord} /> {W.spell},{" "}
                {fmtD(pratyantar.start)} to {fmtD(pratyantar.end)}
                <Details to="parashari-timing-periods" id="periods" />
              </span>
            )}
          </Row>
        )}
        {year && (
          <Row
            label={plain ? (deceased ? "That year" : "This year") : "Sudarshana"}
            id="year"
          >
            {plain
              ? `The ${ord(year.house)} house ${deceased ? "took that" : "takes this"} year of life, ${fmtD(year.start)} to ${fmtD(year.end)}`
              : `Year-lagna in the ${ord(year.house)} bhava, ${fmtD(year.start)} to ${fmtD(year.end)}`}{" "}
            <Pill tone={year.tone} />{" "}
            <span className="text-muted-foreground">
              {plain
                ? `${year.plus} placements for it, ${year.minus} against`
                : `tally +${year.plus} −${year.minus}`}{" "}
              <SourceLink
                source={{ label: "Parashara 74.24-26", url: BPHS_URL(74) }}
              />
            </span>
            <Details to="parashari-timing-year" id="year" />
          </Row>
        )}
        {saturn && (
          <Row label="Saturn" id="saturn">
            <TransitLine t={saturn} plain={plain} />
            <Details to="parashari-timing-transits" id="saturn" />
          </Row>
        )}
        {jupiter && (
          <Row label="Jupiter" id="jupiter">
            <TransitLine t={jupiter} plain={plain} />
            <Details to="parashari-timing-transits" id="jupiter" />
          </Row>
        )}
        {combos.length > 0 && (
          <Row label={plain ? "Combinations" : "Yogas"} id="combinations">
            <span className="text-muted-foreground">
              {plain
                ? "Combinations in this chart that the running planets take part in:"
                : "Yogas of the running dasa and antar lords:"}
            </span>
            <ul className="mt-1 space-y-1">
              {combos.map((c) => (
                <li
                  key={c.finding.id}
                  className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
                  data-testid={`timing-now-combination-${c.finding.id}`}
                >
                  <span className="font-medium">{c.finding.title}</span>
                  <Pill tone={FINDING_TONE[c.finding.tone]} />
                  <span className="text-xs text-muted-foreground">
                    through {c.lords.join(" and ")}
                  </span>
                  {c.sourced ? (
                    <span className="text-xs text-muted-foreground">
                      tied to these periods by{" "}
                      <SourceLink source={c.finding.source} mark={false} />
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-2xs">
                      provisional link
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              {lordsTied
                ? "Parashara says the 5th and 9th lords give wealth in their own periods (41.16-17). For the other combinations the text does not say they come due in their planets' periods, so those links are provisional."
                : "Parashara ties only the wealth of the 5th and 9th lords to their periods (41.16-17), and that rule does not involve the running planets here. For these combinations the text does not say they come due in their planets' periods, so the links are provisional."}
            </p>
          </Row>
        )}
      </dl>
      {!deceased && now.next.length > 0 && (
        <>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {plain ? "Coming changes" : "Changes within eighteen months"}
          </h4>
          <ol className="mt-1.5 space-y-1.5" data-testid="timing-next">
            {now.next.map((c, i) => (
              <li
                key={`${c.kind}-${c.date}-${i}`}
                className="grid gap-x-3 sm:grid-cols-[7rem_1fr]"
                data-testid={`timing-next-${c.kind}`}
              >
                <span className="tabular text-xs text-muted-foreground sm:pt-0.5">
                  {fmtD(c.date)}
                </span>
                <span className="text-sm leading-relaxed">
                  <ChangeLine c={c} plain={plain} />
                  <Details to={CHANGE_TARGET[c.kind]} id={`next-${i}`} />
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
