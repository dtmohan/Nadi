import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Planet } from "@shared/astro";

/**
 * Linked highlighting. Hovering a planet anywhere on the page (a table row, a PlanetName, a chart
 * glyph) lights the same planet everywhere else; the chart also tints the planet's sign. Purely
 * visual: the reading's own "selected planet" state stays with each panel.
 */
export type ChartLayout = "south" | "north";

interface FocusState {
  hovered: Planet | null;
  setHovered: (p: Planet | null) => void;
  layout: ChartLayout;
  setLayout: (l: ChartLayout) => void;
}

const FocusCtx = createContext<FocusState>({
  hovered: null,
  setHovered: () => {},
  layout: "south",
  setLayout: () => {},
});

const CACHE_NAME = "nadi-prefs-v1";
const CACHE_KEY = "/__nadi__/prefs.json";

async function loadPrefs(): Promise<{ layout?: ChartLayout }> {
  try {
    if (typeof caches === "undefined") return {};
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(CACHE_KEY);
    return res ? await res.json() : {};
  } catch {
    return {};
  }
}

async function savePrefs(prefs: { layout?: ChartLayout }) {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      CACHE_KEY,
      new Response(JSON.stringify(prefs), {
        headers: { "content-type": "application/json" },
      }),
    );
  } catch {
    /* preview frames without Cache Storage keep the choice for the session only */
  }
}

export function ChartFocusProvider({ children }: { children: ReactNode }) {
  const [hovered, setHoveredState] = useState<Planet | null>(null);
  const [layout, setLayoutState] = useState<ChartLayout>("south");
  useEffect(() => {
    let alive = true;
    loadPrefs().then((p) => {
      if (alive && (p.layout === "south" || p.layout === "north"))
        setLayoutState(p.layout);
    });
    return () => void (alive = false);
  }, []);
  const setHovered = useCallback((p: Planet | null) => setHoveredState(p), []);
  const setLayout = useCallback((l: ChartLayout) => {
    setLayoutState(l);
    void savePrefs({ layout: l });
  }, []);
  const value = useMemo(
    () => ({ hovered, setHovered, layout, setLayout }),
    [hovered, setHovered, layout, setLayout],
  );
  return <FocusCtx.Provider value={value}>{children}</FocusCtx.Provider>;
}

export const useChartFocus = () => useContext(FocusCtx);
export const useChartLayout = () => {
  const { layout, setLayout } = useContext(FocusCtx);
  return { layout, setLayout };
};

/** Mouse handlers that light a planet across the page; spread onto any element that names one. */
export function useFocusHandlers(planet: Planet) {
  const { setHovered } = useChartFocus();
  return useMemo(
    () => ({
      onMouseEnter: () => setHovered(planet),
      onMouseLeave: () => setHovered(null),
      onFocus: () => setHovered(planet),
      onBlur: () => setHovered(null),
    }),
    [planet, setHovered],
  );
}
