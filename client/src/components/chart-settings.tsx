import { SlidersHorizontal } from "lucide-react";
import type { TimeBasis } from "@shared/time-basis";
import type { Chart } from "@shared/schema";
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
