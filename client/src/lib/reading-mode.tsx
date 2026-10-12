import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Two ways of reading the same chart.
 *  - "plain": one verdict per life area, the two or three signatures that carry it.
 *  - "practitioner": the same structure and order, plus every rule that fired, degree order, weights,
 *    sources, sutra text and the verse wording the plain reading softens.
 * The working and the method notes stay folded in both (components/working.tsx).
 * The choice is kept in this browser's Cache Storage, like the saved charts.
 */
export type ReadingMode = "plain" | "practitioner";

const CACHE_NAME = "nadi-prefs-v1";
const CACHE_KEY = "/__nadi__/reading-mode";

async function load(): Promise<ReadingMode | null> {
  try {
    if (typeof caches === "undefined") return null;
    const res = await (await caches.open(CACHE_NAME)).match(CACHE_KEY);
    const v = res ? await res.text() : null;
    return v === "plain" || v === "practitioner" ? v : null;
  } catch {
    return null;
  }
}

async function save(mode: ReadingMode) {
  try {
    if (typeof caches === "undefined") return;
    await (await caches.open(CACHE_NAME)).put(CACHE_KEY, new Response(mode, { headers: { "content-type": "text/plain" } }));
  } catch {
    /* memory only */
  }
}

const Ctx = createContext<{ mode: ReadingMode; setMode: (m: ReadingMode) => void }>({ mode: "plain", setMode: () => {} });

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ReadingMode>("plain");
  useEffect(() => {
    void load().then((m) => m && setModeState(m));
  }, []);
  const setMode = useCallback((m: ReadingMode) => {
    setModeState(m);
    void save(m);
  }, []);
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useReadingMode = () => useContext(Ctx);
