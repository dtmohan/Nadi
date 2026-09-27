import { useMemo, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { MiniChart, type MiniPlanet } from "@/components/mini-chart";
import { PlanetName } from "@/components/planet-name";
import { SIGNS, type Planet } from "@shared/astro";
import { Trash2, ArrowRight, Loader2, Download, Upload } from "lucide-react";
import { PlaceSearch } from "@/components/place-search";
import { apiRequest } from "@/lib/queryClient";
import {
  chartsStore,
  useSavedCharts,
  useStorageKind,
} from "@/lib/charts-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AYANAMSAS,
  type Chart,
  type GeoHit,
  type InsertChart,
} from "@shared/schema";
import {
  TIME_STANDARDS,
  parseFixedOffset,
  resolveTimeBasis,
} from "@shared/time-basis";

const EMPTY: InsertChart = {
  name: "",
  gender: "unspecified",
  birthDate: "",
  birthTime: "",
  timezone: "",
  timeStandard: "auto",
  place: "",
  latitude: 0,
  longitude: 0,
  ayanamsa: "lahiri",
  nodeType: "mean",
  notes: "",
  events: [],
};

interface ChartSummary {
  positions: MiniPlanet[];
  lagnaIdx: number;
  dasa: { lord: Planet; end: string };
  bhukti: { lord: Planet; end: string };
  transit: { jupiter: number; saturn: number; moon: number };
  asOf: string;
}

function ageOf(c: Chart) {
  const b = DateTime.fromISO(`${c.birthDate}T${c.birthTime}`, {
    zone: c.timezone,
  });
  return b.isValid ? Math.floor(DateTime.now().diff(b, "years").years) : null;
}

/** A saved chart as a card: thumbnail, birth data, the period running now and today's slow transits. */
function ChartCard({
  chart,
  onDelete,
}: {
  chart: Chart;
  onDelete: () => void;
}) {
  const { id, ...body } = chart;
  const summary = useQuery<ChartSummary>({
    queryKey: [
      "summary",
      body.birthDate,
      body.birthTime,
      body.timezone,
      body.latitude,
      body.longitude,
      body.ayanamsa,
      body.nodeType,
    ],
    queryFn: async () =>
      (await apiRequest("POST", "/api/summary", body)).json(),
    staleTime: 6 * 60 * 60 * 1000,
  });
  const s = summary.data;
  const age = ageOf(chart);
  const born = DateTime.fromISO(chart.birthDate);
  return (
    <Card className="hover-elevate">
      <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-3 p-4">
        <Link
          href={`/chart/${id}`}
          className="shrink-0 sm:row-span-2"
          aria-hidden
          tabIndex={-1}
        >
          {s ? (
            <MiniChart
              positions={s.positions}
              lagnaIdx={s.lagnaIdx}
              className="h-[72px] w-[72px] sm:h-[104px] sm:w-[104px]"
            />
          ) : (
            <div className="h-[72px] w-[72px] animate-pulse rounded-sm bg-muted sm:h-[104px] sm:w-[104px]" />
          )}
        </Link>
        <Link
          href={`/chart/${id}`}
          className="min-w-0 self-center"
          data-testid={`card-chart-${id}`}
        >
          <div className="flex items-baseline gap-2">
            <span className="truncate font-display text-base font-semibold">
              {chart.name}
            </span>
            {age !== null && (
              <span className="shrink-0 text-xs text-muted-foreground tabular">
                age {age}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground tabular">
            {born.isValid ? born.toFormat("d LLL yyyy") : chart.birthDate} ·{" "}
            {chart.birthTime} · {chart.place}
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="self-start"
          aria-label={`Delete ${chart.name}`}
          onClick={onDelete}
          data-testid={`button-delete-${id}`}
        >
          <Trash2 />
        </Button>
        <Link
          href={`/chart/${id}`}
          className="col-span-3 min-w-0 sm:col-span-2 sm:col-start-2"
          tabIndex={-1}
        >
          {s ? (
            <dl
              className="grid gap-y-1 text-xs"
              data-testid={`card-summary-${id}`}
            >
              <div className="flex items-baseline gap-2">
                <dt className="w-14 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
                  Rising
                </dt>
                <dd>{SIGNS[s.lagnaIdx]}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-14 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
                  Period
                </dt>
                <dd className="flex flex-wrap items-baseline gap-x-1.5">
                  <PlanetName planet={s.dasa.lord} />
                  <span className="text-muted-foreground">dasa,</span>
                  <PlanetName planet={s.bhukti.lord} />
                  <span className="whitespace-nowrap text-muted-foreground tabular">
                    bhukti to{" "}
                    {DateTime.fromISO(s.bhukti.end).toFormat("LLL yyyy")}
                  </span>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-14 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
                  Today
                </dt>
                <dd className="text-muted-foreground">
                  Jupiter in {SIGNS[s.transit.jupiter]}
                  {s.positions.some(
                    (p) =>
                      p.planet === "Jupiter" &&
                      p.signIndex === s.transit.jupiter,
                  )
                    ? " (its natal sign)"
                    : ""}
                  , Saturn in {SIGNS[s.transit.saturn]}
                  {s.positions.some(
                    (p) =>
                      p.planet === "Saturn" && p.signIndex === s.transit.saturn,
                  )
                    ? " (its natal sign)"
                    : ""}
                </dd>
              </div>
            </dl>
          ) : summary.isError ? (
            <p className="text-xs text-muted-foreground">
              Summary unavailable; open the chart to read it.
            </p>
          ) : (
            <div className="space-y-1.5">
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
          )}
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<InsertChart>(EMPTY);
  const set = <K extends keyof InsertChart>(k: K, v: InsertChart[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { data: charts, isLoading } = useSavedCharts();
  const storageKind = useStorageKind();
  const fileInput = useRef<HTMLInputElement>(null);

  const create = useMutation({
    mutationFn: async (data: InsertChart) => {
      // The server validates and computes; the chart itself is kept in this browser only.
      await apiRequest("POST", "/api/compute", data);
      return await chartsStore.create(data);
    },
    onSuccess: (chart: Chart) => navigate(`/chart/${chart.id}`),
    onError: (e: Error) =>
      toast({
        title: "Could not cast chart",
        description: e.message,
        variant: "destructive",
      }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => chartsStore.remove(id),
  });

  const exportCharts = async () => {
    const blob = new Blob([await chartsStore.exportJson()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nadi-charts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCharts = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = await chartsStore.importJson(await file.text());
      toast({
        title: added
          ? `Imported ${added} chart${added === 1 ? "" : "s"}`
          : "Nothing new to import",
        description: added
          ? undefined
          : "Every chart in the file is already saved here.",
      });
    } catch (e: any) {
      toast({
        title: "Could not import",
        description: e.message,
        variant: "destructive",
      });
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const timeStandard = form.timeStandard ?? "auto";
  const standardMode =
    timeStandard === "auto" || timeStandard === "zone" || timeStandard === "lmt"
      ? timeStandard
      : "fixed";
  const fixedText =
    standardMode === "fixed" && timeStandard !== "fixed" ? timeStandard : "";
  const basis = useMemo(() => {
    if (!form.birthDate || !form.birthTime || !form.timezone) return undefined;
    if (standardMode === "fixed" && parseFixedOffset(fixedText) === undefined)
      return undefined;
    return resolveTimeBasis(
      form.birthDate,
      form.birthTime,
      form.timezone,
      form.longitude,
      timeStandard,
      form.latitude,
    );
  }, [
    form.birthDate,
    form.birthTime,
    form.timezone,
    form.longitude,
    form.latitude,
    timeStandard,
    standardMode,
    fixedText,
  ]);
  const valid = useMemo(
    () =>
      form.name.trim() &&
      form.birthDate &&
      form.birthTime &&
      form.timezone &&
      form.place &&
      (form.latitude !== 0 || form.longitude !== 0),
    [form],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
        <section aria-labelledby="cast-heading">
          <h1
            id="cast-heading"
            className="font-display text-xl font-bold tracking-tight"
          >
            Cast a chart
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sidereal positions from the Swiss Ephemeris. No lagna is needed:
            Nadi reads the planets by sign alone.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) create.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Who is this chart for?"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="gender"
                  title="Female charts are read with Venus as the native and Mars as the husband (Rao). Unspecified reads as male."
                >
                  Gender
                </Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => set("gender", v)}
                >
                  <SelectTrigger id="gender" data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Unspecified</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date of birth</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                  className="tabular"
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Local time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.birthTime}
                  onChange={(e) => set("birthTime", e.target.value)}
                  className="tabular"
                  data-testid="input-time"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="place">Place of birth</Label>
              <PlaceSearch
                value={form.place}
                onPick={(h) =>
                  setForm((f) => ({
                    ...f,
                    place: [h.name, h.admin1, h.country]
                      .filter(Boolean)
                      .join(", "),
                    latitude: h.latitude,
                    longitude: h.longitude,
                    timezone: h.timezone,
                  }))
                }
              />
              {form.place && (
                <p
                  className="text-xs text-muted-foreground tabular"
                  data-testid="text-coords"
                >
                  {form.latitude.toFixed(3)}°, {form.longitude.toFixed(3)}° ·{" "}
                  {form.timezone}
                </p>
              )}
            </div>

            <details className="group rounded-md border border-card-border">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-muted-foreground">
                Ayanamsa, nodes & time standard
              </summary>
              <div className="grid gap-4 border-t border-card-border p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ayanamsa">Ayanamsa</Label>
                  <Select
                    value={form.ayanamsa}
                    onValueChange={(v) => set("ayanamsa", v)}
                  >
                    <SelectTrigger id="ayanamsa" data-testid="select-ayanamsa">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AYANAMSAS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="node">Rahu / Ketu</Label>
                  <Select
                    value={form.nodeType}
                    onValueChange={(v) => set("nodeType", v)}
                  >
                    <SelectTrigger id="node" data-testid="select-node">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mean">Mean node</SelectItem>
                      <SelectItem value="true">True node</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tz">Time zone</Label>
                  <Input
                    id="tz"
                    value={form.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                    placeholder="Asia/Kolkata"
                    data-testid="input-timezone"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tstd">Time standard</Label>
                  <Select
                    value={standardMode}
                    onValueChange={(v) =>
                      set(
                        "timeStandard",
                        v === "fixed" ? fixedText || "+05:30" : v,
                      )
                    }
                  >
                    <SelectTrigger id="tstd" data-testid="select-time-standard">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_STANDARDS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {standardMode === "fixed" && (
                    <Input
                      value={fixedText}
                      onChange={(e) =>
                        set("timeStandard", e.target.value || "fixed")
                      }
                      placeholder="+05:30 or +05:53:20"
                      className="tabular"
                      data-testid="input-fixed-offset"
                    />
                  )}
                  <p
                    className="text-2xs text-muted-foreground"
                    data-testid="text-time-basis"
                  >
                    {TIME_STANDARDS.find((t) => t.id === standardMode)?.help}
                    {basis && (
                      <>
                        {" "}
                        <span
                          className={
                            basis.error ? "text-verdict-bad" : "text-foreground"
                          }
                        >
                          {basis.note}
                        </span>
                        {basis.legal && (
                          <>
                            {" "}
                            <a
                              className="underline underline-offset-2"
                              href={basis.legal.source.url}
                              target="_blank"
                              rel="noreferrer"
                              data-testid="link-time-basis-source"
                            >
                              {basis.legal.source.label}
                            </a>
                            {basis.legal.provisional ? " (provisional)" : ""}
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0001"
                      value={form.latitude}
                      onChange={(e) => set("latitude", Number(e.target.value))}
                      className="tabular"
                      data-testid="input-lat"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lon">Longitude</Label>
                    <Input
                      id="lon"
                      type="number"
                      step="0.0001"
                      value={form.longitude}
                      onChange={(e) => set("longitude", Number(e.target.value))}
                      className="tabular"
                      data-testid="input-lon"
                    />
                  </div>
                </div>
              </div>
            </details>

            <Button
              type="submit"
              disabled={!valid || create.isPending}
              className="w-full sm:w-auto"
              data-testid="button-cast"
            >
              {create.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              Cast and read
            </Button>
          </form>
        </section>

        <section aria-labelledby="recent-heading" className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Saved charts
            </h2>
            <div className="flex items-center gap-1">
              {charts && charts.length > 0 && (
                <span className="mr-1 text-xs text-muted-foreground tabular">
                  {charts.length}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInput.current?.click()}
                data-testid="button-import-charts"
                title="Import charts from a backup file"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCharts}
                disabled={!charts?.length}
                data-testid="button-export-charts"
                title="Download every saved chart as a backup file"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => importCharts(e.target.files?.[0])}
                data-testid="input-import-charts"
              />
            </div>
          </div>
          <p
            className="mt-1 text-xs text-muted-foreground"
            data-testid="text-storage-note"
          >
            {storageKind === "memory"
              ? "This preview cannot keep charts between reloads; the published site saves them on your device. Nothing is stored online."
              : "Saved on this device only. Nothing is stored online; export a backup to keep them or move them to another device."}
          </p>

          {isLoading && (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          )}

          {charts && charts.length === 0 && (
            <div className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
              <p>No charts saved yet.</p>
              <p className="mt-2">
                Once you cast one, you will see Jupiter as the Jeeva karaka (the
                native), Saturn as the Karma karaka (the profession), and how
                the other planets sit with them by sign, adjacency, trine and
                opposition.
              </p>
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {charts?.map((c) => (
              <li key={c.id}>
                <ChartCard chart={c} onDelete={() => remove.mutate(c.id)} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
