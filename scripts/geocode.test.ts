import assert from "node:assert/strict";
import test from "node:test";
import { searchPlaces } from "../server/geocode";

const madras = { name: "Madras", admin1: "Oregon", country: "United States", country_code: "US", latitude: 44.6, longitude: -121.1, timezone: "America/Los_Angeles" };
const chennai = { name: "Chennai", admin1: "Tamil Nadu", country: "India", country_code: "IN", latitude: 13.08, longitude: 80.27, timezone: "Asia/Kolkata" };

test("an Indian historical name adds a labelled, region-checked option without hiding worldwide matches", async () => {
  const requested: string[] = [];
  const request: typeof fetch = async (url) => {
    const name = new URL(String(url)).searchParams.get("name")!;
    requested.push(name);
    const results = name === "Madras" ? [madras] : [
      { ...chennai, country: "United States", country_code: "US" }, chennai,
    ];
    return new Response(JSON.stringify({ results }), { status: 200 });
  };
  const hits = await searchPlaces("Madras", request);
  assert.deepEqual(requested.sort(), ["Chennai", "Madras"]);
  assert.equal(hits[0].name, "Chennai");
  assert.equal(hits[0].matchedAlias, "Madras");
  assert.equal(hits[0].timezone, "Asia/Kolkata");
  assert.equal(hits[1].name, "Madras");
  assert.equal(hits[1].country, "United States");
  assert.deepEqual((await searchPlaces("Madras, India", request)).map((h) => h.name), ["Chennai"]);
});

test("a failed alternate lookup preserves ordinary results, and a failed primary lookup is reported", async () => {
  const request: typeof fetch = async (url) => new URL(String(url)).searchParams.get("name") === "Chennai"
    ? new Response("error", { status: 503 }) : new Response(JSON.stringify({ results: [madras] }), { status: 200 });
  assert.deepEqual((await searchPlaces("Madras", request)).map((h) => h.name), ["Madras"]);
  await assert.rejects(() => searchPlaces("Madras", async () => new Response("error", { status: 503 })), /HTTP 503/);
});

test("other historical names resolve only to the intended Indian region", async () => {
  for (const [alias, name, region] of [["Banaras", "Varanasi", "Uttar Pradesh"], ["Benares", "Varanasi", "Uttar Pradesh"],
    ["Pondicherry", "Puducherry", "Puducherry"], ["Cochin", "Kochi", "Kerala"]]) {
    const request: typeof fetch = async (url) => {
      const q = new URL(String(url)).searchParams.get("name");
      return new Response(JSON.stringify({ results: q === name ? [
        { name, admin1: "Other", country: "India", country_code: "IN", latitude: 10, longitude: 10, timezone: "Asia/Kolkata" },
        { name, admin1: region, country: "India", country_code: "IN", latitude: 11, longitude: 11, timezone: "Asia/Kolkata" },
      ] : [] }), { status: 200 });
    };
    const hits = await searchPlaces(alias, request);
    assert.equal(hits[0]?.admin1, region);
    assert.equal(hits[0]?.matchedAlias, alias);
  }
});
