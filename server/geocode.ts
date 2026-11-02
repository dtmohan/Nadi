import type { GeoHit } from "@shared/schema";

// These aliases add a specifically identified Indian city alongside ordinary
// worldwide matches; they never silently replace a same-named place elsewhere.
// Chennai: https://chennai.nic.in/about-district/
// Mumbai: https://mumbaicity.gov.in/en/about-district/
// Kolkata: https://industry.wb.gov.in/state_profile.html
// Bengaluru: https://bengaluruurban.nic.in/en/history/
// Varanasi: https://varanasi.nic.in/history/ and https://ycmou.ac.in/media/publication/ycmou_book/RVV_YB_125.pdf
// Puducherry: https://py.gov.in/districts
// Kochi: https://ernakulam.nic.in/en/queen-of-arabian-sea/
const ALIASES: Record<string, { name: string; region: string }> = {
  madras: { name: "Chennai", region: "Tamil Nadu" },
  bombay: { name: "Mumbai", region: "Maharashtra" },
  calcutta: { name: "Kolkata", region: "West Bengal" },
  bangalore: { name: "Bengaluru", region: "Karnataka" },
  banaras: { name: "Varanasi", region: "Uttar Pradesh" },
  benaras: { name: "Varanasi", region: "Uttar Pradesh" },
  benares: { name: "Varanasi", region: "Uttar Pradesh" },
  pondicherry: { name: "Puducherry", region: "Puducherry" },
  cochin: { name: "Kochi", region: "Kerala" },
};

type SourceHit = { name?: string; admin1?: string; country?: string; country_code?: string;
  latitude?: number; longitude?: number; timezone?: string };

export async function searchPlaces(query: string, request: typeof fetch = fetch): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const explicitIndia = /,\s*india\s*$/i.test(q);
  const aliasName = q.replace(/,\s*india\s*$/i, "").trim();
  const aliasKey = aliasName.toLowerCase();
  const alias = Object.hasOwn(ALIASES, aliasKey) ? ALIASES[aliasKey] : undefined;
  const find = async (name: string): Promise<SourceHit[]> => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=en&format=json`;
    const response = await request(url);
    if (!response.ok) throw new Error(`Geocoding returned HTTP ${response.status}`);
    const data = await response.json() as { results?: SourceHit[] };
    return data.results ?? [];
  };
  const [ordinary, alternate] = await Promise.all([
    find(explicitIndia && alias ? aliasName : q),
    alias ? find(alias.name).catch(() => []) : Promise.resolve([]),
  ]);
  const usable = (h: SourceHit): h is Required<Pick<SourceHit, "name" | "country" | "latitude" | "longitude" | "timezone">> & SourceHit =>
    !!h.name && !!h.country && Number.isFinite(h.latitude) && Number.isFinite(h.longitude) && !!h.timezone;
  const toHit = (h: SourceHit): GeoHit => ({
    name: h.name!, admin1: h.admin1, country: h.country!, latitude: h.latitude!, longitude: h.longitude!, timezone: h.timezone!,
  });
  const direct = ordinary.filter(usable).filter((h) => !explicitIndia || h.country_code === "IN" || h.country === "India").map(toHit);
  const match = alias && alternate.filter(usable).find((h) => h.name?.toLowerCase() === alias.name.toLowerCase()
    && (h.country_code === "IN" || h.country === "India") && h.admin1?.toLowerCase() === alias.region.toLowerCase());
  if (!match) return direct;
  const preferred: GeoHit = { ...toHit(match), matchedAlias: aliasName };
  return [preferred, ...direct.filter((h) => h.latitude !== preferred.latitude || h.longitude !== preferred.longitude)].slice(0, 8);
}
