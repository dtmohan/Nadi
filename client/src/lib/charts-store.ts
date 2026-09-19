import { useQuery } from "@tanstack/react-query";
import { insertChartSchema, type Chart, type InsertChart } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

/**
 * Saved charts live in this browser only (localStorage). Nothing personal is sent to the
 * server except the birth data needed to compute a reading, which is not stored there.
 */
const KEY = "nadi.charts.v1";
export const CHARTS_QUERY_KEY = ["local-charts"] as const;

function read(): Chart[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => c && typeof c.id === "number" && typeof c.name === "string") : [];
  } catch {
    return [];
  }
}

function write(charts: Chart[]) {
  localStorage.setItem(KEY, JSON.stringify(charts));
  queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
}

function nextId(charts: Chart[], offset = 0): number {
  return Math.max(Date.now() + offset, ...charts.map((c) => c.id + 1));
}

export const chartsStore = {
  list(): Chart[] {
    // Newest first, like the old server listing.
    return read().sort((a, b) => b.id - a.id);
  },
  get(id: number): Chart | undefined {
    return read().find((c) => c.id === id);
  },
  create(data: InsertChart): Chart {
    const charts = read();
    const chart: Chart = { ...normalise(data), id: nextId(charts) };
    write([...charts, chart]);
    return chart;
  },
  update(id: number, data: Partial<InsertChart>): Chart | undefined {
    const charts = read();
    const i = charts.findIndex((c) => c.id === id);
    if (i < 0) return undefined;
    charts[i] = { ...charts[i], ...data };
    write(charts);
    return charts[i];
  },
  remove(id: number): boolean {
    const charts = read();
    const next = charts.filter((c) => c.id !== id);
    write(next);
    return next.length !== charts.length;
  },
  /** JSON text of every saved chart, for backup or moving to another device. */
  exportJson(): string {
    return JSON.stringify({ app: "nadi", version: 1, exportedAt: new Date().toISOString(), charts: read() }, null, 2);
  },
  /** Merge charts from an export file. Returns how many were added. */
  importJson(text: string): number {
    const parsed = JSON.parse(text);
    const incoming: unknown[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.charts) ? parsed.charts : [];
    const charts = read();
    let added = 0;
    for (const raw of incoming) {
      const r = insertChartSchema.safeParse(raw);
      if (!r.success) continue;
      const data = normalise(r.data);
      const dup = charts.some((c) => c.name === data.name && c.birthDate === data.birthDate && c.birthTime === data.birthTime && c.place === data.place);
      if (dup) continue;
      charts.push({ ...data, id: nextId(charts, added) });
      added++;
    }
    if (added) write(charts);
    return added;
  },
};

function normalise(data: InsertChart): Omit<Chart, "id"> {
  return {
    name: data.name,
    gender: data.gender ?? "unspecified",
    birthDate: data.birthDate,
    birthTime: data.birthTime,
    timezone: data.timezone,
    place: data.place,
    latitude: data.latitude,
    longitude: data.longitude,
    ayanamsa: data.ayanamsa ?? "lahiri",
    nodeType: data.nodeType ?? "mean",
    notes: data.notes ?? "",
  };
}

export function useSavedCharts() {
  return useQuery<Chart[]>({ queryKey: [...CHARTS_QUERY_KEY], queryFn: () => chartsStore.list() });
}
