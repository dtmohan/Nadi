import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

/**
 * Registered prasnas live in this browser only, like saved charts. A prasna is registered with its
 * question, the Arudha lagna, the reading summary and the moment it was asked, so that the outcome
 * can be confirmed later and the rules checked against what actually happened.
 */

export type PrasnaOutcome = "pending" | "yes" | "no" | "partial";

export interface PrasnaRecord {
  id: string;
  question: string;
  askedAt: string; // ISO instant
  arudhaIdx: number;
  arudhaSign: string;
  summary: string; // condensed house-effects reading, one line per occupied house
  outcome: PrasnaOutcome;
}

const CACHE_NAME = "nadi-prasnas-v1";
const CACHE_KEY = "/__nadi__/prasnas.json";
export const PRASNAS_QUERY_KEY = ["local-prasnas"] as const;

type Backend = {
  kind: "device" | "memory";
  load(): Promise<PrasnaRecord[]>;
  save(items: PrasnaRecord[]): Promise<void>;
};

const memoryBackend = (): Backend => {
  let items: PrasnaRecord[] = [];
  return {
    kind: "memory",
    load: async () => items,
    save: async (i) => void (items = i),
  };
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
        return Array.isArray(parsed) ? parsed.filter(isPrasna) : [];
      },
      async save(items) {
        await cache.put(
          CACHE_KEY,
          new Response(JSON.stringify(items), {
            headers: { "content-type": "application/json" },
          }),
        );
      },
    };
  } catch {
    return null;
  }
};

function isPrasna(x: any): x is PrasnaRecord {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.question === "string" &&
    typeof x.askedAt === "string"
  );
}

let backendPromise: Promise<Backend> | null = null;
let cached: PrasnaRecord[] | null = null;

function backend(): Promise<Backend> {
  if (!backendPromise)
    backendPromise = cacheBackend().then((b) => b ?? memoryBackend());
  return backendPromise;
}

async function read(): Promise<PrasnaRecord[]> {
  if (cached) return cached;
  cached = await (await backend()).load();
  return cached;
}

async function write(items: PrasnaRecord[]) {
  cached = items;
  await (await backend()).save(items);
  await queryClient.invalidateQueries({ queryKey: PRASNAS_QUERY_KEY });
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const prasnaStore = {
  async list(): Promise<PrasnaRecord[]> {
    return [...(await read())].sort((a, b) =>
      b.askedAt.localeCompare(a.askedAt),
    );
  },
  async register(
    record: Omit<PrasnaRecord, "id" | "outcome">,
  ): Promise<PrasnaRecord> {
    const full: PrasnaRecord = { ...record, id: newId(), outcome: "pending" };
    await write([full, ...(await read())]);
    return full;
  },
  async setOutcome(id: string, outcome: PrasnaOutcome): Promise<void> {
    await write(
      (await read()).map((r) => (r.id === id ? { ...r, outcome } : r)),
    );
  },
  async remove(id: string): Promise<void> {
    await write((await read()).filter((r) => r.id !== id));
  },
};

export function useSavedPrasnas() {
  return useQuery<PrasnaRecord[]>({
    queryKey: PRASNAS_QUERY_KEY,
    queryFn: () => prasnaStore.list(),
  });
}
