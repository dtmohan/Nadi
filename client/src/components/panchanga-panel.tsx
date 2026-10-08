import { sensitiveGate } from "@shared/life-stage";
import { displayLocal } from "@shared/time-basis";
import { Soft } from "@/lib/gentle";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { SUNRISE_DEFINITIONS, type ChartResult } from "@shared/schema";
import type { PlanetPosition } from "@shared/astro";
import { NAKSHATRAS, SIGNS } from "@shared/astro";
import { adverseTara, taraFlag, type AdverseTara } from "@shared/tara";
import {
  PANCHANGA_CAVEATS,
  PANCHANGA_SOURCES,
  type LimbSegment,
  type PanchangaDay,
} from "@shared/panchanga";
import {
  computeGochara,
  GOCHARA_CAVEATS,
  BS_URL,
  PD_URL,
  type GocharaRow,
  type GocharaVerdict,
} from "@shared/gochara";
import { apiRequest } from "@/lib/queryClient";
import { useJudgePlace } from "@/lib/judge-place";
import { SourceLink, Cite } from "@/components/source-link";
import { PlanetName, SignName } from "@/components/planet-name";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { GocharaCalendarSection } from "@/components/gochara-calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fmtT = (iso: string, zone: string) =>
  DateTime.fromISO(iso).setZone(zone).toFormat("HH:mm");
const fmtDT = (iso: string, zone: string) =>
  DateTime.fromISO(iso).setZone(zone).toFormat("d LLL yyyy HH:mm");
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** One limb: the element in force plus the day's changes. */
function Limb({
  id,
  title,
  value,
  sub,
  run,
  zone,
  source,
  adverse,
}: {
  id: string;
  title: string;
  value: string;
  sub?: string;
  run: LimbSegment[];
  zone: string;
  source: { label: string; url: string; provisional?: boolean };
  adverse?: string;
}) {
  return (
    <div className="rounded-md border bg-card p-3 text-xs" data-testid={id}>
      <div className="text-2xs uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-1 text-base font-semibold" data-testid={`${id}-value`}>
        {value}
      </div>
      {sub && <div className="text-muted-foreground">{sub}</div>}
      {adverse && (
        <div className="mt-1 text-verdict-mixed" data-testid={`${id}-adverse`}>
          {adverse}
        </div>
      )}
      <div className="mt-1 text-2xs text-muted-foreground">
        <SourceLink source={source} />
      </div>
      <ul className="mt-2 space-y-0.5 border-t pt-2 text-muted-foreground">
        {run.map((s, i) => (
          <li
            key={i}
            className={cn(
              "flex justify-between gap-2",
              s.current && "text-foreground",
            )}
          >
            <span>
              {s.name}
              {s.detail && (
                <span className="text-muted-foreground"> · {s.detail}</span>
              )}
            </span>
            <span className="tabular-nums">
              {s.end ? `ends ${fmtT(s.end, zone)}` : "past next sunrise"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayGrid({
  day,
  zone,
  idPrefix,
  adverseStars,
}: {
  day: PanchangaDay;
  zone: string;
  idPrefix: string;
  adverseStars: AdverseTara[];
}) {
  const adverseNote = adverseStars.find(
    (a) => a.nakshatraName === day.nakshatra.name,
  );
  return (
    <>
      <div
        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground"
        data-testid={`${idPrefix}-day`}
      >
        <span
          title={
            SUNRISE_DEFINITIONS.find((d) => d.id === (day.sunriseDef ?? "edge"))
              ?.label
          }
        >
          Sunrise{" "}
          <span className="tabular-nums text-foreground">
            {fmtT(day.sunrise, zone)}
          </span>{" "}
          <span data-testid={`${idPrefix}-sunrise-def`}>
            (
            {
              SUNRISE_DEFINITIONS.find(
                (d) => d.id === (day.sunriseDef ?? "edge"),
              )?.short
            }
            )
          </span>
        </span>
        <span>
          Sunset{" "}
          <span className="tabular-nums text-foreground">
            {fmtT(day.sunset, zone)}
          </span>
        </span>
        <span>
          Next sunrise{" "}
          <span className="tabular-nums text-foreground">
            {fmtT(day.nextSunrise, zone)}
          </span>
        </span>
        <span>
          Moon {day.phase.waxing ? "waxing" : "waning"},{" "}
          {pct(day.phase.illumination)} lit
        </span>
        <span>
          Ayanamsa {day.ayanamsa.key} {day.ayanamsa.value.toFixed(3)}°
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <div
          className="rounded-md border bg-card p-3 text-xs"
          data-testid={`${idPrefix}-vara`}
        >
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">
            Vara
          </div>
          <div className="mt-1 text-base font-semibold">{day.vara.name}</div>
          <div className="text-muted-foreground">
            lord <PlanetName planet={day.vara.lord} />
          </div>
          <div className="mt-1 text-2xs text-muted-foreground">
            <SourceLink source={PANCHANGA_SOURCES.day} />
            {" · lord: "}
            <SourceLink source={PANCHANGA_SOURCES.varaLords} />
          </div>
          <ul className="mt-2 space-y-0.5 border-t pt-2 text-muted-foreground">
            <li className="flex justify-between gap-2">
              <span>from sunrise</span>
              <span className="tabular-nums">{fmtT(day.sunrise, zone)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>to next sunrise</span>
              <span className="tabular-nums">
                {fmtT(day.nextSunrise, zone)}
              </span>
            </li>
          </ul>
        </div>
        <Limb
          id={`${idPrefix}-tithi`}
          title="Tithi"
          value={`${day.tithi.paksha} ${day.tithi.name}`}
          sub={`${day.tithi.index} of 30 · ${pct(day.tithi.elapsed)} elapsed`}
          run={day.runs.tithi}
          zone={zone}
          source={PANCHANGA_SOURCES.tithi}
        />
        <Limb
          id={`${idPrefix}-nakshatra`}
          title="Nakshatra"
          value={`${day.nakshatra.name} ${day.nakshatra.pada}`}
          sub={`lord ${day.nakshatra.lord} · ${pct(day.nakshatra.elapsed)} elapsed`}
          run={day.runs.nakshatra}
          zone={zone}
          source={PANCHANGA_SOURCES.nakshatra}
          adverse={
            adverseNote
              ? `${adverseNote.name} tara of your birth star — avoid for muhurta.`
              : undefined
          }
        />
        <Limb
          id={`${idPrefix}-yoga`}
          title="Yoga"
          value={day.yoga.name}
          sub={`${day.yoga.index + 1} of 27 · ${pct(day.yoga.elapsed)} elapsed`}
          run={day.runs.yoga}
          zone={zone}
          source={PANCHANGA_SOURCES.yoga}
        />
        <Limb
          id={`${idPrefix}-karana`}
          title="Karana"
          value={day.karana.name}
          sub={`${day.karana.fixed ? "fixed" : "movable"} · ${pct(day.karana.elapsed)} elapsed`}
          run={day.runs.karana}
          zone={zone}
          source={PANCHANGA_SOURCES.karana}
        />
      </div>
    </>
  );
}

const PILL: Record<GocharaVerdict, string> = {
  favourable: "bg-verdict-good/15 text-verdict-good",
  obstructed: "bg-verdict-mixed/15 text-verdict-mixed",
  neutral: "bg-muted text-muted-foreground",
  unfavourable: "bg-verdict-bad/10 text-verdict-bad",
};
const BORDER: Record<GocharaVerdict, string> = {
  favourable: "border-l-verdict-good/70",
  obstructed: "border-l-verdict-mixed/70",
  neutral: "border-l-border",
  unfavourable: "border-l-verdict-bad/70",
};
const ORD = (h: number) =>
  `${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"}`;

function GocharaRowView({ r }: { r: GocharaRow }) {
  return (
    <li
      className={cn(
        "rounded-md border border-l-4 bg-card p-3 text-xs",
        BORDER[r.verdict],
      )}
      data-testid={`gochara-row-${r.planet}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="min-w-[5.5rem] text-sm font-medium">
          <PlanetName planet={r.planet} />
          {r.retrograde && (
            <span className="ml-1 text-2xs text-muted-foreground">R</span>
          )}
        </span>
        <span>
          <SignName signIndex={r.signIndex} />{" "}
          <span className="tabular-nums text-muted-foreground">
            {r.degInSign.toFixed(1)}°
          </span>
        </span>
        <span className="text-muted-foreground">
          {ORD(r.house)} from the Moon
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {r.vedhaBy.length > 0 && (
            <span
              className="text-2xs text-muted-foreground"
              data-testid={`gochara-vedha-${r.planet}`}
            >
              vedha by {r.vedhaBy.join(", ")} in the {ORD(r.vedhaPoint!)}
            </span>
          )}
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium",
              PILL[r.verdict],
            )}
            data-testid={`gochara-verdict-${r.planet}`}
          >
            {r.verdict}
          </span>
        </span>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {r.effect.bs && (
          <div>
            <dt className="text-2xs text-muted-foreground">
              <SourceLink source={r.effect.bs.source} />
            </dt>
            <dd>{r.effect.bs.text}</dd>
          </div>
        )}
        {r.effect.pd && (
          <div>
            <dt className="text-2xs text-muted-foreground">
              <SourceLink source={r.effect.pd.source} />
            </dt>
            <dd>{r.effect.pd.text}</dd>
          </div>
        )}
      </dl>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <span>
          {r.favourable ? "favourable" : "not favourable"} house ·{" "}
          {r.favourableSources.map((s, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <SourceLink source={s} />
            </span>
          ))}
        </span>
        {r.favourable && (
          <span>
            vedha point {r.vedhaPoint ? ORD(r.vedhaPoint) : "—"} ·{" "}
            <SourceLink source={r.vedhaSource} />
          </span>
        )}
        <span>
          felt in: {r.portion.bs ? `BS ${r.portion.bs}; ` : ""}PD {r.portion.pd}
        </span>
      </div>
      {r.dignityNote && (
        <p className="mt-1 text-xs" data-testid={`gochara-dignity-${r.planet}`}>
          {r.dignityNote.text}{" "}
          {r.dignityNote.sources.map((s, i) => (
            <span key={i} className="text-2xs text-muted-foreground">
              {i > 0 && ", "}
              <SourceLink source={s} />
            </span>
          ))}
        </p>
      )}
      {r.danger && (
        <p
          className="mt-1 text-xs text-verdict-bad"
          data-testid={`gochara-danger-${r.planet}`}
        >
          <Soft>{r.danger.text}</Soft>{" "}
          <SourceLink
            source={r.danger.source}
            className="text-2xs text-muted-foreground"
          />
        </p>
      )}
    </li>
  );
}

export function PanchangaPanel({ result }: { result: ChartResult }) {
  const chart = result.chart;
  const judge = useJudgePlace();
  const place = judge
    ? {
        latitude: judge.latitude,
        longitude: judge.longitude,
        timezone: judge.timezone,
        label: judge.label,
      }
    : {
        latitude: chart.latitude,
        longitude: chart.longitude,
        timezone: chart.timezone,
        label: chart.place,
      };
  const [date, setDate] = useState(() =>
    DateTime.now().setZone(place.timezone).toISODate()!,
  );
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && DateTime.fromISO(date).isValid;

  const dayQuery = useQuery<{ day: PanchangaDay; positions: PlanetPosition[] }>(
    {
      queryKey: [
        "panchanga",
        date,
        place.latitude,
        place.longitude,
        place.timezone,
        chart.ayanamsa,
        chart.nodeType,
        chart.sunriseDef,
      ],
      enabled: validDate,
      queryFn: async () =>
        (await (
          await apiRequest("POST", "/api/panchanga", {
            date,
            latitude: place.latitude,
            longitude: place.longitude,
            timezone: place.timezone,
            ayanamsa: chart.ayanamsa,
            nodeType: chart.nodeType === "true" ? "true" : "mean",
            sunriseDef: chart.sunriseDef,
          })
        ).json()) as { day: PanchangaDay; positions: PlanetPosition[] },
      staleTime: 5 * 60_000,
    },
  );

  const fortnightQuery = useQuery<{
    days: { date: string; nakshatraName: string }[];
  }>({
    queryKey: [
      "tara-fortnight",
      place.latitude,
      place.longitude,
      place.timezone,
      chart.ayanamsa,
      chart.nodeType,
      chart.sunriseDef,
    ],
    queryFn: async () =>
      (await (
        await apiRequest("POST", "/api/tara-fortnight", {
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: place.timezone,
          days: 14,
          ayanamsa: chart.ayanamsa,
          nodeType: chart.nodeType === "true" ? "true" : "mean",
          sunriseDef: chart.sunriseDef,
        })
      ).json()) as { days: { date: string; nakshatraName: string }[] },
    staleTime: 5 * 60_000,
  });

  const natalMoon = result.positions.find((p) => p.planet === "Moon")!;
  const birthStarIdx = Math.floor(natalMoon.lon / (360 / 27));
  const adverseStars = adverseTara(birthStarIdx);
  const adverseByStar = new Map(
    adverseStars.map((a) => [a.nakshatraName, a]),
  );
  const withheld =
    result.sensitive?.withheld ??
    sensitiveGate(chart, result.utc, result.now.asOf).withheld;
  const gochara = useMemo(() => {
    if (dayQuery.data)
      return computeGochara(
        natalMoon.signIndex,
        dayQuery.data.positions,
        dayQuery.data.day.sunrise,
        withheld,
      );
    return computeGochara(
      natalMoon.signIndex,
      result.now.positions,
      result.now.asOf,
      withheld,
    );
  }, [dayQuery.data, natalMoon.signIndex, result.now, withheld]);
  const gocharaAt = dayQuery.data
    ? `sunrise ${fmtDT(dayQuery.data.day.sunrise, place.timezone)} at ${place.label}`
    : `${fmtDT(result.now.asOf, chart.timezone)} at ${chart.place}`;

  const birth = result.panchanga;

  return (
    <div className="space-y-8" data-testid="panchanga-panel">
      <div>
        <h2 className="text-xl font-semibold">Panchanga and gochara</h2>
        <ModeText
          plain={
            <>
              The five limbs of the Hindu day for the birth and for any date,
              then the planets' transits counted from the birth Moon with the
              readings of two classical texts.
            </>
          }
          practitioner={
            <>
              Tithi, vara, nakshatra, nitya yoga and karana per Surya Siddhanta
              1.36 and 2.64-69 (tr. Burgess), with exact ending times from the
              ephemeris. Gochara from the natal Moon per{" "}
              <Cite href={BS_URL}>Brihat Samhita 104</Cite> and{" "}
              <Cite href={PD_URL}>Phaladeepika 26</Cite>, including vedha,
              dignity and danger houses. Not Parashari: BPHS treats transit only
              through Ashtakavarga.
            </>
          }
        />
      </div>

      {birth && (
        <section>
          <SectionTitle plain="Birth day" technical="Janma panchanga">
            <span className="text-xs font-normal text-muted-foreground">
              {displayLocal(
                birth.at,
                result.timeBasis,
                chart.timezone,
              ).toFormat("d LLL yyyy HH:mm")}{" "}
              at {chart.place}
            </span>
          </SectionTitle>
          <div className="mt-3">
            <DayGrid
              day={birth}
              zone={result.timeBasis?.displayZone ?? chart.timezone}
              idPrefix="panchanga-birth"
              adverseStars={adverseStars}
            />
          </div>
        </section>
      )}

      <section>
        <SectionTitle plain="Any day" technical="Dina panchanga" />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            Date at {place.label}
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 h-8 w-44 text-xs tabular"
              data-testid="panchanga-date"
            />
          </label>
          <button
            type="button"
            className="h-8 rounded-md border px-2 text-xs hover:bg-muted"
            onClick={() =>
              setDate(DateTime.now().setZone(place.timezone).toISODate()!)
            }
            data-testid="panchanga-today"
          >
            Today
          </button>
          <p className="text-2xs text-muted-foreground">
            {judge
              ? "Using the judging place set in the KP tab."
              : "Birth place; a place set under the KP tab's Judging from is used here too."}
          </p>
        </div>
        <div className="mt-3" data-testid="panchanga-day-result">
          {!validDate && (
            <p className="text-xs text-muted-foreground">Enter a date.</p>
          )}
          {validDate && dayQuery.isLoading && (
            <p className="text-xs text-muted-foreground">Computing the day…</p>
          )}
          {dayQuery.isError && (
            <p className="text-xs text-verdict-bad">
              Could not compute the panchanga for this date.
            </p>
          )}
          {dayQuery.data && (
            <DayGrid
              day={dayQuery.data.day}
              zone={place.timezone}
              idPrefix="panchanga-day"
              adverseStars={adverseStars}
            />
          )}
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-2xs text-muted-foreground">
          {PANCHANGA_CAVEATS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle plain="The coming fortnight" technical="Tara days" />
        <ModeText
          plain={
            <>
              The next two weeks, marking the days the Moon stands in a star
              that works against your birth star — the Vipat, Pratyari or Vadha
              (the 3rd, 5th and 7th) — or in a trijanma star (your birth star,
              the 10th and the 19th). These days are avoided for muhurta.
            </>
          }
          practitioner={
            <>
              Prasna Marga lists the trijanma nakshatras (birth, 10th, 19th)
              and the Vipat, Pratyak and Naidhana nakshatras as inauspicious
              days. The Moon's nakshatra per day is from Surya Siddhanta 2.64.
            </>
          }
        />
        <div className="mt-3" data-testid="tara-fortnight">
          {fortnightQuery.isLoading && (
            <p className="text-xs text-muted-foreground">Computing the fortnight…</p>
          )}
          {fortnightQuery.isError && (
            <p className="text-xs text-verdict-bad">
              Could not compute the fortnight.
            </p>
          )}
          {fortnightQuery.data && (
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
              {fortnightQuery.data.days.map((day) => {
                const flag = taraFlag(
                  birthStarIdx,
                  NAKSHATRAS.indexOf(
                    day.nakshatraName as (typeof NAKSHATRAS)[number],
                  ),
                );
                return (
                  <li
                    key={day.date}
                    className={cn(
                      "rounded-md border p-2 text-xs",
                      flag
                        ? "border-amber-400/50 bg-amber-400/10"
                        : "border-border",
                    )}
                    title={flag ?? "clear day"}
                  >
                    <div className="font-medium tabular">
                      {DateTime.fromISO(day.date).toFormat("d LLL")}
                    </div>
                    <div className="text-muted-foreground">
                      {day.nakshatraName}
                    </div>
                    {flag && (
                      <div className="mt-0.5 text-2xs font-medium text-amber-600">
                        {flag}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionTitle plain="Transits from the birth Moon" technical="Gochara">
          <span className="text-xs font-normal text-muted-foreground">
            Moon in {SIGNS[natalMoon.signIndex]} · planets at {gocharaAt}
          </span>
        </SectionTitle>
        <ModeText
          plain={
            <>
              Each planet's sign now is counted as a house from the sign the
              Moon held at birth. Both texts agree on which houses are good;
              Phaladeepika adds the vedha points that spoil a good house when
              another planet stands there, and the rule that a planet in its own
              or exaltation sign does no harm.
            </>
          }
          practitioner={
            <>
              Favourable houses BS 104.4 and PD 26.2; vedha PD 26.3-8; house
              results BS 104.5-45 and PD 26.9-24; dignity PD 26.31-32 and BS
              104.53, 55; danger houses PD 26.33-34; effective portion BS
              104.49-51 and PD 26.25. Verdict: favourable, obstructed
              (favourable house under vedha), unfavourable, or neutral when
              dignity cancels the house.
            </>
          }
        />
        <ul className="mt-3 space-y-2" data-testid="gochara-list">
          {gochara.rows.map((r) => (
            <GocharaRowView key={r.planet} r={r} />
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-2xs">
            Rahu and Ketu rows: Phaladeepika only
          </Badge>
          <Badge variant="outline" className="text-2xs">
            Ketu results provisional
          </Badge>
        </div>
        <ul
          className="mt-3 list-disc space-y-1 pl-5 text-2xs text-muted-foreground"
          data-testid="gochara-caveats"
        >
          {GOCHARA_CAVEATS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <GocharaCalendarSection result={result} zone={place.timezone} />
    </div>
  );
}
