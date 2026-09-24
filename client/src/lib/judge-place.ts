import { useSyncExternalStore } from "react";

/**
 * Where the astrologer is judging from. KP takes the ruling planets for the place and moment of
 * judgement, not the birth place (Astro Secrets & KP Part 3, pp. 161-162), so the rising sign
 * and the day lord must be computed for wherever the reader actually is. Null means the birth
 * place is used. Kept in Cache Storage so it survives reloads; nothing is sent anywhere except
 * the coordinates needed to compute the rising sign.
 */
export interface JudgePlace {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: "device" | "search";
}

const CACHE_NAME = "nadi-settings-v1";
const CACHE_KEY = "/__nadi__/judge-place.json";

let current: JudgePlace | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(CACHE_KEY);
    if (!res) return;
    const parsed = await res.json();
    if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number" && typeof parsed.timezone === "string") {
      current = parsed as JudgePlace;
      emit();
    }
  } catch {
    // Unavailable storage: session only.
  }
}

async function persist() {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    if (current) await cache.put(CACHE_KEY, new Response(JSON.stringify(current), { headers: { "content-type": "application/json" } }));
    else await cache.delete(CACHE_KEY);
  } catch {
    // ignore
  }
}

export function setJudgePlace(place: JudgePlace | null) {
  current = place;
  emit();
  void persist();
}

export function useJudgePlace(): JudgePlace | null {
  void load();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}

/** The device's timezone, the best guess for a geolocated position. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Ask the browser for the current position. Rejects when the API is missing or the user declines. */
export function locateDevice(): Promise<JudgePlace> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject(new Error("This browser does not offer location services"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({ label: `Device location ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, latitude, longitude, timezone: deviceTimezone(), source: "device" });
      },
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? "Location permission was declined; search for your place instead" : err.message || "Could not read the device location")),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
}
