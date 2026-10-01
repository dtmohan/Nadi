import { SlidersHorizontal } from "lucide-react";
import type { TimeBasis } from "@shared/time-basis";
import {
  SUNRISE_DEFINITIONS,
  normaliseSunriseDef,
  normaliseParashariHouseMethod,
  PARASHARI_HOUSE_METHOD_IDS,
  type Chart,
} from "@shared/schema";
import { chartsStore, CHARTS_QUERY_KEY } from "@/lib/charts-store";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChartLayout } from "@/components/chart-focus";

const fmtCoord = (v: number, pos: string, neg: string) =>
  `${Math.abs(v).toFixed(3)}° ${v >= 0 ? pos : neg}`;

/** The chart's computation settings, folded into one control so the header stays about the person. */
export function ChartSettings({
  chart,
  ayanamsaValue,
  timeBasis,
}: {
  chart: Chart;
  ayanamsaValue: number;
  timeBasis?: TimeBasis;
}) {
  const { layout, setLayout } = useChartLayout();
  const ayan = chart.ayanamsa.charAt(0).toUpperCase() + chart.ayanamsa.slice(1);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          data-testid="button-chart-settings"
          title="Ayanamsa, node, time zone and chart layout"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="tabular">
            {ayan} · {chart.nodeType} node
            {normaliseSunriseDef(chart.sunriseDef) !== "edge"
              ? ` · ${SUNRISE_DEFINITIONS.find((d) => d.id === normaliseSunriseDef(chart.sunriseDef))?.short} sunrise`
              : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 text-sm"
        data-testid="popover-chart-settings"
      >
        <dl className="grid grid-cols-[6rem_1fr] gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Ayanamsa</dt>
          <dd className="tabular">
            {ayan} · {ayanamsaValue.toFixed(3)}°
          </dd>
          <dt className="text-muted-foreground">Nodes</dt>
          <dd>{chart.nodeType} Rahu and Ketu</dd>
          <dt className="text-muted-foreground">Sunrise</dt>
          <dd>
            <select
              className="tabular block w-full rounded-md border bg-background px-1.5 py-0.5 text-xs"
              value={normaliseSunriseDef(chart.sunriseDef)}
              onChange={async (e) => {
                await chartsStore.update(chart.id, {
                  sunriseDef: normaliseSunriseDef(e.target.value),
                });
                await queryClient.invalidateQueries({
                  queryKey: ["chart-result", String(chart.id)],
                });
                await queryClient.invalidateQueries({
                  queryKey: CHARTS_QUERY_KEY,
                });
              }}
              aria-label="Sunrise definition"
              data-testid="select-settings-sunrise"
            >
              {SUNRISE_DEFINITIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <div
              className="mt-1 text-2xs text-muted-foreground"
              data-testid="text-sunrise-note"
            >
              {
                SUNRISE_DEFINITIONS.find(
                  (d) => d.id === normaliseSunriseDef(chart.sunriseDef),
                )?.note
              }{" "}
              Moves the vara boundary, the Panchanga runs, the Hora and Ghatika
              lagnas and the day-night split in Shadbala together.
            </div>
          </dd>
          <dt className="text-muted-foreground">Houses</dt>
          <dd>
            <select
              className="tabular block w-full rounded-md border bg-background px-1.5 py-0.5 text-xs"
              value={normaliseParashariHouseMethod(chart.parashariHouseMethod)}
              onChange={async (e) => {
                await chartsStore.update(chart.id, {
                  parashariHouseMethod: normaliseParashariHouseMethod(
                    e.target.value,
                  ),
                });
                await queryClient.invalidateQueries({
                  queryKey: ["chart-result", String(chart.id)],
                });
                await queryClient.invalidateQueries({
                  queryKey: CHARTS_QUERY_KEY,
                });
              }}
              aria-label="Parashari house method"
              data-testid="select-settings-parashari-house-method"
            >
              {PARASHARI_HOUSE_METHOD_IDS.map((m) => (
                <option key={m} value={m}>
                  {m === "rashi"
                    ? "Rashi (whole sign)"
                    : m === "sripati"
                      ? "Bhava chalit — Sripati"
                      : "Bhava chalit — equal"}
                </option>
              ))}
            </select>
            <div
              className="mt-1 text-2xs text-muted-foreground"
              data-testid="text-house-method-note"
            >
              Carries the Parashari house, node, house-effects and house-lord
              readings. The texts state their results by whole sign, so a chalit
              reading is marked provisional. KP keeps its Placidus cusps; the
              sign-counted yoga layers, Jaimini, BNN and ALP keep whole sign.
            </div>
          </dd>
          <dt className="text-muted-foreground">Time zone</dt>
          <dd>
            {chart.timezone}
            {timeBasis && (
              <div
                className="text-2xs text-muted-foreground"
                data-testid="text-chart-time-basis"
              >
                {timeBasis.label}
                {timeBasis.auto ? " (automatic)" : ""}. {timeBasis.note}
                {timeBasis.legal && (
                  <>
                    {" "}
                    <a
                      className="underline underline-offset-2"
                      href={timeBasis.legal.source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {timeBasis.legal.source.label}
                    </a>
                    {timeBasis.legal.provisional ? " (provisional)" : ""}
                  </>
                )}
              </div>
            )}
          </dd>
          <dt className="text-muted-foreground">Place</dt>
          <dd className="tabular">
            {fmtCoord(chart.latitude, "N", "S")},{" "}
            {fmtCoord(chart.longitude, "E", "W")}
          </dd>
        </dl>
        <div className="mt-3 border-t pt-3">
          <label
            className="text-xs text-muted-foreground"
            htmlFor="settings-death-date"
            title="Optional. Fixes the age the readings use and lets the lifespan methods be checked against a life that has run its course. Never used to compute or show a forecast."
          >
            Date of passing (optional)
          </label>
          <input
            id="settings-death-date"
            type="date"
            className="tabular mt-1 block w-full rounded-md border bg-background px-2 py-1 text-xs"
            value={chart.deathDate ?? ""}
            min={chart.birthDate}
            onChange={async (e) => {
              const v = e.target.value || null;
              await chartsStore.update(chart.id, { deathDate: v });
              await queryClient.invalidateQueries({
                queryKey: ["chart-result", String(chart.id)],
              });
              await queryClient.invalidateQueries({
                queryKey: CHARTS_QUERY_KEY,
              });
            }}
            data-testid="input-settings-death-date"
          />
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">Chart layout</p>
          <div
            role="radiogroup"
            aria-label="Chart layout"
            className="mt-1.5 inline-flex rounded-md border p-0.5 text-xs"
          >
            {(["south", "north"] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={layout === l}
                onClick={() => setLayout(l)}
                className={
                  layout === l
                    ? "rounded bg-primary px-2.5 py-1 text-primary-foreground"
                    : "rounded px-2.5 py-1 text-muted-foreground hover:text-foreground"
                }
                data-testid={`chart-layout-${l}`}
              >
                {l === "south" ? "South Indian" : "North Indian"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-2xs text-muted-foreground">
            South: signs fixed, Pisces top left. North: houses fixed, the first
            house at the top.
          </p>
        </div>
        <p className="mt-3 border-t pt-3 text-2xs text-muted-foreground">
          KP uses its own ayanamsa and Placidus cusps whatever is set here.
        </p>
      </PopoverContent>
    </Popover>
  );
}
