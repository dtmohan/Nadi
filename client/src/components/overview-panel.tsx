import { useMemo } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { vimshottari } from "@shared/kp";
import { ageYears, lifeAsOf, areaSeason } from "@shared/life-stage";
import { LIFE_AREAS, type LifeArea } from "@shared/rules";
import type { Gender } from "@shared/marriage";
import {
  synthesize,
  AREA_TONE_LABEL,
  type AreaSynthesis,
  type AreaTone,
} from "@shared/synthesis";
import { Soft } from "@/lib/gentle";
import { PlanetName } from "@/components/planet-name";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<AreaTone, string> = {
  supportive: "border-verdict-good/40 text-verdict-good",
  mixed: "border-verdict-mixed/40 text-verdict-mixed",
  care: "border-verdict-bad/40 text-verdict-bad",
  contested: "border-dashed border-verdict-mixed/60 text-verdict-mixed",
  quiet: "border-border text-muted-foreground",
};

const joinList = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** The life area as a plain noun: "Career", "Marriage", "Children", "Wealth", "Health". */
const areaNoun = (area: LifeArea) =>
  LIFE_AREAS[area].label.split(" &")[0];

/** One sentence that says what the chart settles, what it asks care for, and what stays mixed. */
function glanceSentence(areas: AreaSynthesis[]): string {
  const firm = areas.filter((a) => a.tone === "supportive").map((a) => areaNoun(a.area).toLowerCase());
  const care = areas.filter((a) => a.tone === "care").map((a) => areaNoun(a.area).toLowerCase());
  const contested = areas
    .filter((a) => a.tone === "contested")
    .map((a) => areaNoun(a.area).toLowerCase());
  const parts: string[] = [];
  if (firm.length)
    parts.push(`${joinList(firm)} ${firm.length === 1 ? "rests" : "rest"} on firm ground`);
  if (care.length)
    parts.push(`${joinList(care)} ${care.length === 1 ? "needs" : "need"} care`);
  if (contested.length)
    parts.push(
      `${joinList(contested)} ${contested.length === 1 ? "is" : "are"} in dispute, with strong signs both ways`,
    );
  const mixedN = areas.filter((a) => a.tone === "mixed").length;
  if (mixedN) parts.push(parts.length ? "the rest is mixed" : "the picture is mixed");
  if (!parts.length)
    return "Nothing in this chart stands out strongly one way or the other; it is a quiet chart.";
  return `In this chart ${parts.join("; ")}.`;
}

/**
 * The overview: what a reader who is not a practitioner wants first. Identity, one glance sentence,
 * the life areas as a set of plain cards, and the period and slow planets running now. Everything
 * else on the page is the working behind these lines.
 */
export function OverviewPanel({ result }: { result: ChartResult }) {
  const { reading, chart, now, positions } = result;
  const gender = chart.gender as Gender;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const rising = result.jaimini.lagna.sign;

  const lifeAt = lifeAsOf(chart, now.asOf);
  const age = ageYears(result.utc, lifeAt);
  const deceased = lifeAt !== now.asOf;

  const allAreas = useMemo(() => synthesize(reading, gender), [reading, gender]);
  const areas = allAreas.filter((a) =>
    areaSeason(a.area, result.utc, lifeAt).inSeason,
  );
  const deferred = allAreas.filter(
    (a) => !areaSeason(a.area, result.utc, lifeAt).inSeason,
  );

  const glance = glanceSentence(areas);
  const firm = areas
    .filter((a) => a.tone === "supportive")
    .sort((x, y) => y.balance - x.balance);
  const watch = areas
    .filter((a) => a.tone === "care" || a.tone === "contested")
    .sort((x, y) => x.balance - y.balance);

  const vim = vimshottari(moon.lon, result.utc, lifeAt);
  const jupNow = now.positions.find((p) => p.planet === "Jupiter");
  const satNow = now.positions.find((p) => p.planet === "Saturn");

  return (
    <section
      className="animate-in fade-in-0 duration-300"
      data-testid="overview-panel"
      aria-label="Overview"
    >
      {/* Identity and the glance sentence */}
      <div className="rounded-lg border bg-card p-5 sm:p-6">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Overview · the chart in a minute
        </p>
        <h2
          className="font-display mt-2 max-w-[40ch] text-xl font-semibold leading-snug"
          data-testid="overview-glance"
        >
          {glance}
        </h2>
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="overview-identity"
        >
          {deceased ? "Read at age " : "Age "}
          {Math.floor(age)} · {rising} rising · {moon.sign} Moon
        </p>

        {(firm.length > 0 || watch.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {firm.length > 0 && (
              <div
                className="rounded-md border border-verdict-good/30 bg-verdict-good/[0.06] p-3"
                data-testid="overview-firm"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-good">
                  Firm ground
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(firm.map((a) => areaNoun(a.area)))}
                </p>
              </div>
            )}
            {watch.length > 0 && (
              <div
                className="rounded-md border border-verdict-bad/30 bg-verdict-bad/[0.05] p-3"
                data-testid="overview-watch"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-bad">
                  Asks for care
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(watch.map((a) => areaNoun(a.area)))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* The life areas as plain cards */}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <li
            key={a.area}
            className="rounded-md border bg-card p-3"
            data-testid={`overview-area-${a.area}`}
            data-tone={a.tone}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{areaNoun(a.area)}</span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  TONE_CLASS[a.tone],
                )}
              >
                {AREA_TONE_LABEL[a.tone]}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
              <Soft>{a.headline}</Soft>
            </p>
          </li>
        ))}
      </ul>
      {deferred.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {joinList(deferred.map((a) => areaNoun(a.area)))} is held back for
          later: {deferred.length === 1 ? "it is" : "they are"} not a present
          matter at this age.
        </p>
      )}

      {/* What is running now */}
      <div className="mt-4 rounded-lg border bg-card p-5 sm:p-6">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Right now
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex items-baseline gap-2">
            <dt className="shrink-0 text-muted-foreground">Period</dt>
            <dd className="flex flex-wrap items-baseline gap-x-1.5">
              <PlanetName planet={vim.current.dasa.lord} />
              <span className="text-muted-foreground">dasa ·</span>
              <PlanetName planet={vim.current.bhukti.lord} />
              <span className="text-muted-foreground">bhukti to</span>
              <span className="tabular">
                {DateTime.fromISO(vim.current.bhukti.end).toFormat("LLL yyyy")}
              </span>
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="shrink-0 text-muted-foreground">Sky</dt>
            <dd className="text-foreground">
              {jupNow && (
                <>
                  Jupiter in {jupNow.sign}
                  {jupNow.signIndex ===
                  positions.find((p) => p.planet === "Jupiter")?.signIndex
                    ? " (its natal sign)"
                    : ""}
                </>
              )}
              {satNow && (
                <>
                  {jupNow ? ", " : ""}Saturn in {satNow.sign}
                  {satNow.signIndex ===
                  positions.find((p) => p.planet === "Saturn")?.signIndex
                    ? " (its natal sign)"
                    : ""}
                </>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
