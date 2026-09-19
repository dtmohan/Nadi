import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Trash2, ArrowRight, Loader2, Download, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { chartsStore, useSavedCharts } from "@/lib/charts-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AYANAMSAS, type Chart, type GeoHit, type InsertChart } from "@shared/schema";

const EMPTY: InsertChart = {
  name: "",
  gender: "unspecified",
  birthDate: "",
  birthTime: "",
  timezone: "",
  place: "",
  latitude: 0,
  longitude: 0,
  ayanamsa: "lahiri",
  nodeType: "mean",
  notes: "",
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function PlaceSearch({ value, onPick }: { value: string; onPick: (hit: GeoHit) => void }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q, 300);
  const { data: hits, isFetching } = useQuery<GeoHit[]>({
    queryKey: ["/api/geocode?q=" + encodeURIComponent(dq)],
    enabled: dq.trim().length >= 2 && open,
  });
  useEffect(() => setQ(value), [value]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="place"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="City of birth"
          className="pl-9"
          autoComplete="off"
          data-testid="input-place"
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && hits && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-popover-border bg-popover shadow-md" role="listbox">
          {hits.map((h, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover-elevate"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(h);
                  setQ([h.name, h.admin1, h.country].filter(Boolean).join(", "));
                  setOpen(false);
                }}
                data-testid={`option-place-${i}`}
              >
                <span className="truncate">
                  {h.name}
                  {h.admin1 ? `, ${h.admin1}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{h.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<InsertChart>(EMPTY);
  const set = <K extends keyof InsertChart>(k: K, v: InsertChart[K]) => setForm((f) => ({ ...f, [k]: v }));

  const { data: charts, isLoading } = useSavedCharts();
  const fileInput = useRef<HTMLInputElement>(null);

  const create = useMutation({
    mutationFn: async (data: InsertChart) => {
      // The server validates and computes; the chart itself is kept in this browser only.
      await apiRequest("POST", "/api/compute", data);
      return chartsStore.create(data);
    },
    onSuccess: (chart: Chart) => navigate(`/chart/${chart.id}`),
    onError: (e: Error) => toast({ title: "Could not cast chart", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({ mutationFn: async (id: number) => chartsStore.remove(id) });

  const exportCharts = () => {
    const blob = new Blob([chartsStore.exportJson()], { type: "application/json" });
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
      const added = chartsStore.importJson(await file.text());
      toast({
        title: added ? `Imported ${added} chart${added === 1 ? "" : "s"}` : "Nothing new to import",
        description: added ? undefined : "Every chart in the file is already saved here.",
      });
    } catch (e: any) {
      toast({ title: "Could not import", description: e.message, variant: "destructive" });
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const valid = useMemo(
    () => form.name.trim() && form.birthDate && form.birthTime && form.timezone && form.place && (form.latitude !== 0 || form.longitude !== 0),
    [form],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
        <section aria-labelledby="cast-heading">
          <h1 id="cast-heading" className="font-display text-xl font-bold tracking-tight">
            Cast a chart
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sidereal positions from the Swiss Ephemeris. No lagna is needed: Nadi reads the planets by sign alone.
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
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Who is this chart for?" data-testid="input-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" title="Female charts are read with Venus as the native and Mars as the husband (Rao). Unspecified reads as male.">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
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
                <Input id="date" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} className="tabular" data-testid="input-date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Local time</Label>
                <Input id="time" type="time" value={form.birthTime} onChange={(e) => set("birthTime", e.target.value)} className="tabular" data-testid="input-time" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="place">Place of birth</Label>
              <PlaceSearch
                value={form.place}
                onPick={(h) =>
                  setForm((f) => ({
                    ...f,
                    place: [h.name, h.admin1, h.country].filter(Boolean).join(", "),
                    latitude: h.latitude,
                    longitude: h.longitude,
                    timezone: h.timezone,
                  }))
                }
              />
              {form.place && (
                <p className="text-xs text-muted-foreground tabular" data-testid="text-coords">
                  {form.latitude.toFixed(3)}°, {form.longitude.toFixed(3)}° · {form.timezone}
                </p>
              )}
            </div>

            <details className="group rounded-md border border-card-border">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-muted-foreground">Ayanamsa & nodes</summary>
              <div className="grid gap-4 border-t border-card-border p-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ayanamsa">Ayanamsa</Label>
                  <Select value={form.ayanamsa} onValueChange={(v) => set("ayanamsa", v)}>
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
                  <Select value={form.nodeType} onValueChange={(v) => set("nodeType", v)}>
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
                  <Input id="tz" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Kolkata" data-testid="input-timezone" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input id="lat" type="number" step="0.0001" value={form.latitude} onChange={(e) => set("latitude", Number(e.target.value))} className="tabular" data-testid="input-lat" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lon">Longitude</Label>
                    <Input id="lon" type="number" step="0.0001" value={form.longitude} onChange={(e) => set("longitude", Number(e.target.value))} className="tabular" data-testid="input-lon" />
                  </div>
                </div>
              </div>
            </details>

            <Button type="submit" disabled={!valid || create.isPending} className="w-full sm:w-auto" data-testid="button-cast">
              {create.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
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
              {charts && charts.length > 0 && <span className="mr-1 text-xs text-muted-foreground tabular">{charts.length}</span>}
              <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()} data-testid="button-import-charts" title="Import charts from a backup file">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="ghost" size="sm" onClick={exportCharts} disabled={!charts?.length} data-testid="button-export-charts" title="Download every saved chart as a backup file">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importCharts(e.target.files?.[0])} data-testid="input-import-charts" />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground" data-testid="text-storage-note">
            Saved in this browser only. Nothing is stored online; export a backup to keep them or move them to another device.
          </p>

          {isLoading && (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          )}

          {charts && charts.length === 0 && (
            <div className="mt-4 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
              <p>No charts saved yet.</p>
              <p className="mt-2">
                Once you cast one, you will see Jupiter as the Jeeva karaka (the native), Saturn as the Karma karaka (the profession), and how the other planets sit with them by sign,
                adjacency, trine and opposition.
              </p>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {charts?.map((c) => (
              <li key={c.id}>
                <Card className="hover-elevate">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Link href={`/chart/${c.id}`} className="min-w-0 flex-1" data-testid={`card-chart-${c.id}`}>
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground tabular">
                        {c.birthDate} · {c.birthTime} · {c.place}
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => remove.mutate(c.id)}
                      data-testid={`button-delete-${c.id}`}
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
