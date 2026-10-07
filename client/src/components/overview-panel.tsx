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
import { computeGochara, type GocharaVerdict } from "@shared/gochara";
import { Soft } from "@/lib/gentle";
import { useT } from "@/lib/i18n";
import { PlanetName, SignName } from "@/components/planet-name";
import { cn } from "@/lib/utils";

const VERDICT_PILL: Record<GocharaVerdict, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  obstructed: "bg-verdict-mixed/15 text-verdict-mixed",
  neutral: "bg-muted text-muted-foreground",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};

const ord = (h: number) =>
  h === 1 ? "1st" : h === 2 ? "2nd" : h === 3 ? "3rd" : `${h}th`;

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
  const t = useT();
  const { reading, chart, now, positions } = result;
  const gender = chart.gender as Gender;
  const moon = positions.find((p) => p.planet === "Moon")!;
  const rising = result.jaimini.lagna.sign;

  const lifeAt = lifeAsOf(chart, now.asOf);
  const age = ageYears(result.utc, lifeAt);
  const deceased = lifeAt !== now.asOf;

  const sun = positions.find((p) => p.planet === "Sun")!;

  // Notable planet states: retrogrades (the nodes always move "retrograde" and are left out)
  // and the dignities a reader actually notices — the strong and the weak, as the engine grades
  // them (effective dignity, after the cancellation rules), not the raw sign dignity.
  const retro = positions
    .filter((p) => p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu")
    .map((p) => p.planet);
  const NOTABLE_DIGNITY = new Set([
    "Exalted",
    "Moolatrikona",
    "Own sign",
    "Debilitated",
    "Inimical",
  ]);
  const dignityPhrase = (d: string) =>
    d === "Own sign"
      ? "in own sign"
      : d === "Inimical"
        ? "in inimical sign"
        : d === "Moolatrikona"
          ? "in moolatrikona"
          : d.toLowerCase();
  const noteParts: string[] = [];
  if (retro.length) noteParts.push(`${joinList(retro)} ${t("retrograde")}`);
  for (const s of reading.strength) {
    if (NOTABLE_DIGNITY.has(s.effectiveDignity)) {
      noteParts.push(`${s.planet} ${t(dignityPhrase(s.effectiveDignity))}`);
    } else if (
      NOTABLE_DIGNITY.has(s.dignity) &&
      s.dignity !== s.effectiveDignity
    ) {
      noteParts.push(`${s.planet} ${t(dignityPhrase(s.dignity))} ${t("(set aside)")}`);
    }
  }

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
  const dasaIdx = vim.dasas.findIndex((d) => d.current);
  const nextDasa =
    dasaIdx >= 0 && dasaIdx < vim.dasas.length - 1
      ? vim.dasas[dasaIdx + 1]
      : undefined;
  // A chart read after its 120-year Vimshottari sequence has ended (no date of death recorded).
  const pastEnd =
    !deceased && lifeAt >= vim.dasas[vim.dasas.length - 1].end;

  // Transits read against the natal Moon (Phaladeepika 26.1 names it the chief lagna for gochara).
  const gochara = useMemo(
    () =>
      computeGochara(
        moon.signIndex,
        now.positions,
        now.asOf,
        result.sensitive?.withheld ?? false,
      ),
    [moon.signIndex, now.positions, now.asOf, result.sensitive?.withheld],
  );
  const jupRow = gochara.rows.find((r) => r.planet === "Jupiter");
  const satRow = gochara.rows.find((r) => r.planet === "Saturn");

  // The next slow-planet sign change after today: the next "weather" turn.
  const nextIngress = useMemo(() => {
    const up = result.transits
      .filter(
        (t) =>
          (t.planet === "Jupiter" || t.planet === "Saturn") &&
          t.start > now.asOf,
      )
      .sort((a, b) => a.start.localeCompare(b.start));
    return up[0];
  }, [result.transits, now.asOf]);

  return (
    <section
      className="animate-in fade-in-0 duration-300"
      data-testid="overview-panel"
      aria-label="Overview"
    >
      {/* Identity and the glance sentence */}
      <div className="rounded-lg border bg-card p-5 sm:p-6">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("Overview · the chart in a minute")}
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
          {deceased ? t("Read at age ") : t("Age ")}
          {Math.floor(age)}
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Rising")}
            </dt>
            <dd className="text-sm font-medium">{rising}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Sun")}
            </dt>
            <dd className="text-sm font-medium">{sun.sign}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Moon")}
            </dt>
            <dd className="text-sm font-medium">{moon.sign}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
              {t("Birth star")}
            </dt>
            <dd className="text-sm font-medium">
              {moon.nakshatra} · {moon.nakshatraLord}, p{moon.pada}
            </dd>
          </div>
        </dl>
        {noteParts.length > 0 && (
          <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="overview-notable"
          >
            {noteParts.join(" · ")}
          </p>
        )}

        {(firm.length > 0 || watch.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {firm.length > 0 && (
              <div
                className="rounded-md border border-verdict-good/30 bg-verdict-good/[0.06] p-3"
                data-testid="overview-firm"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-good">
                  {t("Firm ground")}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(firm.map((a) => t(areaNoun(a.area))))}
                </p>
              </div>
            )}
            {watch.length > 0 && (
              <div
                className="rounded-md border border-verdict-bad/30 bg-verdict-bad/[0.05] p-3"
                data-testid="overview-watch"
              >
                <p className="text-2xs font-semibold uppercase tracking-wide text-verdict-bad">
                  {t("Asks for care")}
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  {joinList(watch.map((a) => t(areaNoun(a.area))))}
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
              <span className="text-sm font-semibold">
                {t(areaNoun(a.area))}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-2xs uppercase tracking-wide",
                  TONE_CLASS[a.tone],
                )}
              >
                {t(AREA_TONE_LABEL[a.tone])}
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
          {joinList(deferred.map((a) => t(areaNoun(a.area))))} is held back for
          later: {deferred.length === 1 ? "it is" : "they are"} not a present
          matter at this age.
        </p>
      )}

      {/* What is running now */}
      <div className="mt-4 rounded-lg border bg-card p-5 sm:p-6">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {deceased ? t("At passing") : pastEnd ? t("Past the periods") : t("Right now")}
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex items-baseline gap-2">
            <dt className="shrink-0 text-muted-foreground">{t("Period")}</dt>
            <dd className="text-sm">
              {pastEnd ? (
                <span className="text-muted-foreground">
                  the 120-year Vimshottari sequence has run its course
                </span>
              ) : (
                <>
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    <PlanetName planet={vim.current.dasa.lord} />
                    <span className="text-muted-foreground">{t("dasa")} ·</span>
                    <PlanetName planet={vim.current.bhukti.lord} />
                    <span className="text-muted-foreground">{t("bhukti")}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground tabular">
                    {t("bhukti")} to{" "}
                    {DateTime.fromISO(vim.current.bhukti.end).toFormat("LLL yyyy")} ·
                    {t("dasa")} to {DateTime.fromISO(vim.current.dasa.end).toFormat("LLL yyyy")}
                    {nextDasa ? ` · then ${nextDasa.lord} dasa` : ""}
                  </span>
                </>
              )}
            </dd>
          </div>
          {!deceased && nextIngress && (
            <div className="flex items-baseline gap-2">
              <dt className="shrink-0 text-muted-foreground">{t("Next")}</dt>
              <dd className="text-foreground">
                {nextIngress.planet} enters {nextIngress.sign} in{" "}
                {DateTime.fromISO(nextIngress.start).toFormat("LLL yyyy")}
              </dd>
            </div>
          )}
        </dl>

        {/* Transit weather: the slow planets read against the natal Moon (today's sky; the deceased are read at passing, not against it). */}
        {!deceased && (jupRow || satRow) && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[jupRow, satRow].filter(Boolean).map((r) => (
              <li
                key={r!.planet}
                className="rounded-md border bg-card p-3 text-xs"
                data-testid={`overview-weather-${r!.planet}`}
                data-verdict={r!.verdict}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">
                    <PlanetName planet={r!.planet} />
                  </span>
                  <span className="text-muted-foreground">
                    <SignName signIndex={r!.signIndex} /> · your {ord(r!.house)}{" "}
                    from the Moon
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded px-1.5 py-0.5 text-xs font-medium",
                      VERDICT_PILL[r!.verdict],
                    )}
                  >
                    {r!.verdict}
                  </span>
                </div>
                {r!.effect.pd && (
                  <p className="mt-1.5 leading-relaxed text-foreground/90">
                    <Soft>{r!.effect.pd.text}</Soft>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {!deceased && (
          <p className="mt-3 text-2xs text-muted-foreground">
            Counted from the natal Moon (Phaladeepika 26.1); the full gochara,
            with vedha, is on the Panchanga tab.
          </p>
        )}
      </div>
    </section>
  );
}
