import { sanitiseEvents } from "@shared/events";
import { useQuery } from "@tanstack/react-query";
import { insertChartSchema, type Chart, type InsertChart } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

/**
 * Saved charts live in this browser only. Nothing personal is sent to the server except the
 * birth data needed to compute a reading or a PDF, and the server keeps none of it.
 *
 * Persistence uses the browser's Cache Storage (origin-scoped, survives reloads and restarts).
 * Where that is unavailable (for example inside a sandboxed preview frame) the list is held in
 * memory for the session and the UI says so.
 */
const CACHE_NAME = "nadi-charts-v1";
const CACHE_KEY = "/__nadi__/charts.json";
export const CHARTS_QUERY_KEY = ["local-charts"] as const;

export type StorageKind = "device" | "memory";

interface Backend {
  kind: StorageKind;
  load(): Promise<Chart[]>;
  save(charts: Chart[]): Promise<void>;
}

const memoryBackend = (): Backend => {
  let items: Chart[] = [];
  return { kind: "memory", load: async () => items, save: async (c) => void (items = c) };
};

const cacheBackend = async (): Promise<Backend | null> => {
  try {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(CACHE_NAME);
    return {
      kind: "device",
      async load() {
        const res = await cache.match(CACHE_KEY);
        if (!res) return [];
        const parsed = await res.json();
        return Array.isArray(parsed) ? parsed.filter(isChart) : [];
      },
      async save(charts) {
        await cache.put(CACHE_KEY, new Response(JSON.stringify(charts), { headers: { "content-type": "application/json" } }));
      },
    };
  } catch {
    return null;
  }
};

function isChart(c: any): c is Chart {
  return c && typeof c.id === "number" && typeof c.name === "string" && typeof c.birthDate === "string";
}

let backendPromise: Promise<Backend> | null = null;
let cached: Chart[] | null = null;
const listeners = new Set<() => void>();

async function backend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = cacheBackend().then((b) => b ?? memoryBackend());
    void backendPromise.then((b) => {
      storageKind = b.kind;
      listeners.forEach((l) => l());
    });
  }
  return backendPromise;
}

export let storageKind: StorageKind | null = null;
export function onStorageKind(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

async function read(): Promise<Chart[]> {
  if (cached) return cached;
  // Charts saved before events existed get an empty list.
  cached = (await (await backend()).load()).map((c) => ({ ...c, timeStandard: (c as Partial<Chart>).timeStandard || "auto", events: sanitiseEvents((c as Partial<Chart>).events) }));
  return cached;
}

async function write(charts: Chart[]) {
  cached = charts;
  await (await backend()).save(charts);
  await queryClient.invalidateQueries({ queryKey: CHARTS_QUERY_KEY });
}

function nextId(charts: Chart[], offset = 0): number {
  return Math.max(Date.now() + offset, ...charts.map((c) => c.id + 1));
}

export const chartsStore = {
  async list(): Promise<Chart[]> {
    // Newest first, like the old server listing.
    return [...(await read())].sort((a, b) => b.id - a.id);
  },
  async get(id: number): Promise<Chart | undefined> {
    return (await read()).find((c) => c.id === id);
  },
  async create(data: InsertChart): Promise<Chart> {
    const charts = await read();
    const chart: Chart = { ...normalise(data), id: nextId(charts) };
    await write([...charts, chart]);
    return chart;
  },
  async update(id: number, data: Partial<InsertChart>): Promise<Chart | undefined> {
    const charts = [...(await read())];
    const i = charts.findIndex((c) => c.id === id);
    if (i < 0) return undefined;
    charts[i] = { ...charts[i], ...data };
    await write(charts);
    return charts[i];
  },
  async remove(id: number): Promise<boolean> {
    const charts = await read();
    const next = charts.filter((c) => c.id !== id);
    await write(next);
    return next.length !== charts.length;
  },
  /** JSON text of every saved chart, for backup or moving to another device. */
  async exportJson(): Promise<string> {
    return JSON.stringify({ app: "nadi", version: 1, exportedAt: new Date().toISOString(), charts: await read() }, null, 2);
  },
  /** Merge charts from an export file. Returns how many were added. */
  async importJson(text: string): Promise<number> {
    const parsed = JSON.parse(text);
    const incoming: unknown[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.charts) ? parsed.charts : [];
    const charts = [...(await read())];
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
    if (added) await write(charts);
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
    timeStandard: data.timeStandard || "auto",
    place: data.place,
    latitude: data.latitude,
    longitude: data.longitude,
    ayanamsa: data.ayanamsa ?? "lahiri",
    nodeType: data.nodeType ?? "mean",
    notes: data.notes ?? "",
    events: sanitiseEvents(data.events),
  };
}

export function useSavedCharts() {
  return useQuery<Chart[]>({ queryKey: [...CHARTS_QUERY_KEY], queryFn: () => chartsStore.list() });
}

/** "device" once persistent storage is confirmed, "memory" when the browser context offers none. */
export function useStorageKind(): StorageKind | null {
  const { data } = useQuery<StorageKind>({ queryKey: ["storage-kind"], queryFn: async () => (await backend()).kind });
  return data ?? storageKind;
}
