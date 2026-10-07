// Engine regression tests. Pin the current correct outputs of the ephemeris wrapper and the
// pure engines (panchanga, dasa, synthesis, time basis, gentle wording) so that a refactor that
// changes a number, a rule count, a dasa lord or a softened phrase fails here.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import {
  birthInstant,
  julianDay,
  positionsAt,
  ayanamsaAt,
  ascendantAt,
  gulikaLongitude,
  type EphemerisOptions,
} from "../server/ephemeris";
import { tithiOf, nakshatraOf, yogaOf, karanaOf } from "@shared/panchanga";
import { vimshottari } from "@shared/kp";
import { evaluate } from "@shared/rules";
import { synthesize, type AreaSynthesis } from "@shared/synthesis";
import { soften } from "@shared/gentle";
import { resolveTimeBasis, birthUtc, parseFixedOffset } from "@shared/time-basis";
import {
  sphutaPlanetLon,
  computeProgeny,
  computeSantanaTrisphuta,
  computeSphutas,
  computeChatraRasi,
  arudhaFromHandful,
  ashtamangalaFromGroups,
  computeTertiaryPlanets,
  rasiAgreement,
  timeSphutasFromGhatis,
  computeFructificationTiming,
  computePrasnaVedha,
} from "@shared/rules-prasna";
import { computePrasnaAvReadings } from "@shared/prasna-av";
import { computeKootas } from "@shared/prasna-kootas";
import { kundaCheck } from "../server/rectify";
import { nashtaFactorSum, nashtaNakshatra } from "@shared/brihat-jataka";
import { scAmshaName, SC_BHAVAS, SC_BHAVA_RULES, computeSarvartha, SC_RAJYOGAS, SC_DASHA_PHALA, SC_LONGEVITY } from "@shared/sarvartha";
import type { AshtakavargaResult } from "@shared/ashtakavarga";

// -----------------------------------------------------------------------------------------------
// Reference chart: 1990-01-01 12:00 UTC, 0N/0E, Lahiri ayanamsa, mean node. Every value below is
// the output the deployed server produces for this chart; a change to the Swiss Ephemeris wrapper,
// the ayanamsa table, the sign/nakshatra arithmetic or the rule set moves at least one of them.
// -----------------------------------------------------------------------------------------------

const REFERENCE_CHART = {
  birthDate: "1990-01-01",
  birthTime: "12:00",
  timezone: "UTC",
  timeStandard: "auto",
  latitude: 0,
  longitude: 0,
};

const opts: EphemerisOptions = { ayanamsa: "lahiri", nodeType: "mean" };

const { utc } = birthInstant(REFERENCE_CHART);
const jd = julianDay(utc);
const positions = positionsAt(jd, opts);
const byPlanet = Object.fromEntries(positions.map((p) => [p.planet, p]));

/** Longitudes are pinned to ~0.0036″; the native sweph binary differs by ~1e-12 across platforms. */
const approxLon = (actual: number, expected: number, msg?: string) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${msg ?? "longitude"}: ${actual} !~ ${expected}`,
  );

test("ephemeris: Julian day and ayanamsa for the reference instant", () => {
  approxLon(jd, 2447893.000003784, "JD");
  approxLon(ayanamsaAt(jd, opts), 23.717425749502183, "Lahiri ayanamsa");
});

test("ephemeris: sidereal longitudes match the pinned snapshot", () => {
  const expected: Record<string, number> = {
    Sun: 257.093550746519,
    Moon: 309.546991790444,
    Mars: 226.279374105087,
    Mercury: 271.952110330263,
    Jupiter: 71.428079547754,
    Venus: 282.501246306518,
    Saturn: 261.936784818342,
    Rahu: 294.714269632697,
    Ketu: 114.714269632697,
  };
  for (const [planet, lon] of Object.entries(expected)) {
    approxLon(byPlanet[planet].lon, lon, `${planet} longitude`);
  }
});

test("ephemeris: Rahu and Ketu are exactly opposite", () => {
  const rahu = byPlanet["Rahu"].lon;
  const ketu = byPlanet["Ketu"].lon;
  approxLon((rahu + 180) % 360, ketu, "Rahu + 180 == Ketu");
});

test("ephemeris: sign, nakshatra and pada are self-consistent", () => {
  for (const p of positions) {
    const lon = ((p.lon % 360) + 360) % 360;
    assert.equal(p.signIndex, Math.floor(lon / 30), `${p.planet} sign`);
    assert.equal(
      p.nakshatraIndex,
      Math.floor(lon / (360 / 27)),
      `${p.planet} nakshatra`,
    );
    // pada is 1-indexed in the app.
    const pada = Math.floor((lon % (360 / 27)) / (360 / 27 / 4)) + 1;
    assert.equal(p.pada, pada, `${p.planet} pada`);
  }
});

test("ephemeris: the four ayanamsas are distinct and pinned", () => {
  const ayanamsa = (key: string) =>
    ayanamsaAt(jd, { ayanamsa: key, nodeType: "mean" });
  approxLon(ayanamsa("lahiri"), 23.717425749502183, "Lahiri");
  approxLon(ayanamsa("raman"), 22.271124, "Raman");
  approxLon(ayanamsa("kp"), 23.62057342377659, "KP");
  approxLon(ayanamsa("yukteshwar"), 22.339136, "Yukteshwar");
});

test("ephemeris: ascendant for the reference place (0N/0E)", () => {
  const asc = ascendantAt(jd, 0, 0, opts);
  approxLon(asc, 348.11250666377487, "ascendant");
});

// -----------------------------------------------------------------------------------------------

test("panchanga: tithi, nakshatra, yoga and karana for the reference instant", () => {
  const sun = byPlanet["Sun"].lon;
  const moon = byPlanet["Moon"].lon;
  const tithi = tithiOf(moon, sun);
  assert.equal(tithi.name, "Panchami");
  assert.equal(tithi.paksha, "Shukla");
  const nak = nakshatraOf(moon);
  assert.equal(nak.name, "Shatabhisha");
  assert.equal(nak.lord, "Rahu");
  assert.equal(yogaOf(moon, sun).name, "Siddhi");
  assert.equal(karanaOf(moon, sun).name, "Bava");
});

// -----------------------------------------------------------------------------------------------

test("vimshottari: birth dasa lord and balance for the reference Moon", () => {
  const moon = byPlanet["Moon"].lon;
  const vim = vimshottari(moon, utc.toISO()!, utc.toISO()!);
  // Moon in Shatabhisha (lord Rahu) → the running dasa at birth is Rahu.
  assert.equal(vim.dasas[0].lord, "Rahu");
  assert.equal(vim.current.dasa.lord, "Rahu");
  // Balance of Rahu maha dasa at birth ≈ 14.11 years.
  assert.ok(
    Math.abs(vim.balanceYears - 14.1116) < 0.01,
    `balanceYears ${vim.balanceYears}`,
  );
});

test("vimshottari: nine maha dasas, each lord appearing once", () => {
  const vim = vimshottari(byPlanet["Moon"].lon, utc.toISO()!, utc.toISO()!);
  assert.equal(vim.dasas.length, 9);
  assert.equal(new Set(vim.dasas.map((d) => d.lord)).size, 9);
});

// -----------------------------------------------------------------------------------------------

test("rules: the Nadi rule engine fires the pinned finding count", () => {
  const reading = evaluate(positions, undefined, "male");
  // 111 findings for the reference chart. A rule addition/removal/reweight moves this.
  assert.equal(reading.findings.length, 111);
  // Fixed roles for a male chart.
  assert.deepEqual(reading.roles, {
    gender: "male",
    native: "Jupiter",
    deha: "Jupiter",
    spouse: "Venus",
    karma: "Saturn",
  });
  assert.equal(reading.jeeva.sign, "Gemini");
  assert.equal(reading.karma.sign, "Sagittarius");
});

test("synthesis: every life area has a valid tone, a headline and a finite balance", () => {
  const reading = evaluate(positions, undefined, "male");
  const areas = synthesize(reading, "male");
  assert.ok(areas.length > 0, "expected at least one life area");
  const validTones = new Set([
    "supportive",
    "mixed",
    "care",
    "contested",
    "quiet",
  ]);
  for (const a of areas) {
    assert.ok(validTones.has(a.tone), `tone ${a.tone} for ${a.area}`);
    assert.ok(a.headline.length > 0, `headline for ${a.area}`);
    assert.ok(a.key.length <= 3, `key ≤ 3 for ${a.area}`);
    assert.ok(Number.isFinite(a.balance), `balance for ${a.area}`);
  }
});

// -----------------------------------------------------------------------------------------------

test("time basis: automatic standard applies birthplace LMT before standard time", () => {
  // Einstein: 14 Mar 1879 11:30 Ulm → LMT +0:39:57, not Berlin's +0:53:28.
  const e = resolveTimeBasis(
    "1879-03-14",
    "11:30",
    "Europe/Berlin",
    9.9876,
    "auto",
    48.4011,
  );
  assert.equal(e.mode, "lmt");
  assert.equal(e.offsetSeconds, Math.round(9.9876 * 240));
  assert.equal(birthUtc("1879-03-14", "11:30", e).toISO(), "1879-03-14T10:50:03.000Z");

  // Gandhi: 2 Oct 1869 07:12 Porbandar → LMT +4:38:31.
  const g = resolveTimeBasis(
    "1869-10-02",
    "07:12",
    "Asia/Kolkata",
    69.6293,
    "auto",
    21.6417,
  );
  assert.equal(g.mode, "lmt");
  assert.equal(birthUtc("1869-10-02", "07:12", g).toISO(), "1869-10-02T02:33:29.000Z");

  // Modern IST: 24 Apr 1973 13:00 → the zone database (+5:30).
  const m = resolveTimeBasis(
    "1973-04-24",
    "13:00",
    "Asia/Kolkata",
    72.833,
    "auto",
    18.967,
  );
  assert.equal(m.mode, "zone");
  assert.equal(birthUtc("1973-04-24", "13:00", m).toISO(), "1973-04-24T07:30:00.000Z");
});

test("time basis: fixed-offset parsing", () => {
  assert.equal(parseFixedOffset("+05:30"), 5 * 3600 + 30 * 60);
  assert.equal(parseFixedOffset("-07:52:58"), -(7 * 3600 + 52 * 60 + 58));
  assert.equal(parseFixedOffset("5.5"), Math.round(5.5 * 3600));
  assert.equal(parseFixedOffset("UTC+5:30"), 5 * 3600 + 30 * 60);
  assert.equal(parseFixedOffset("bogus"), undefined);
});

// -----------------------------------------------------------------------------------------------

test("gentle: sensitive phrases are softened, technical names stay", () => {
  assert.equal(soften("danger of death from drowning"), "grave danger from drowning");
  assert.equal(soften("the child dies soon after birth"), "the child is at risk soon after birth");
  assert.equal(soften("a maraka (killer) planet"), "a maraka planet");
  assert.equal(soften("death of father"), "loss of father");
  // The rewrite must not touch the word when it is already benign.
  assert.equal(soften("wealth and happiness"), "wealth and happiness");
});

// -----------------------------------------------------------------------------------------------
// Prasna Marga — worked examples from B.V. Raman's notes, pinned as anchors for the harvests.
// -----------------------------------------------------------------------------------------------

test("Prasna Marga 19.5 worked example: Beeja longitude of a planet", () => {
  // Jupiter at 12°2' Scorpio (222.033°), 8°42' into Anuradha → 39.15 ghatis → ÷5 = 7s 24.9°
  // = Scorpio 24.9° = 234.9°.
  const got = sphutaPlanetLon(222.033);
  assert.ok(Math.abs(got - 234.9) < 0.05, `sphuta ${got} !~ 234.9`);
});

test("Prasna Marga 19.18 worked example: nakshatra indexing", () => {
  // Leo 21°3' (141.05°) is Purva Phalguni, nakshatra index 10.
  const nak = Math.floor(141.05 / (360 / 27));
  assert.equal(nak, 10);
});

test("Prasna Marga progeny sphuta on the reference chart", () => {
  const male = computeProgeny(positions, "male");
  assert.equal(male.kind, "beeja");
  approxLon(male.longitude, 297.61766822134086, "beeja sphuta");
  assert.equal(male.verdict, "remedy");
  const female = computeProgeny(positions, "female");
  assert.equal(female.kind, "kshetra");
  assert.equal(female.verdict, "remedy");
});

test("Prasna Marga Santana Trisphuta on the reference chart", () => {
  const lagnaIdx = Math.floor(ascendantAt(jd, 0, 0, opts) / 30);
  const t = computeSantanaTrisphuta(positions, lagnaIdx);
  approxLon(t.trisphuta, 310.3431104235824, "trisphuta");
  assert.equal(t.nakshatraIndex, 23);
  assert.equal(t.inBadHouse, true);
});

test("Prasna Marga Gulika position on the reference chart", () => {
  const g = gulikaLongitude(jd, 0, 0, "UTC", opts);
  assert.equal(g.signIndex, 0);
  assert.equal(g.day, true);
});

test("Prasna Marga 21 Rasi agreement: the twelve relative houses", () => {
  const expected = ["good", "bad", "moderate", "moderate", "bad", "bad", "good", "bad", "good", "good", "good", "bad"];
  for (let h = 1; h <= 12; h++) {
    const maleMoon = (11 + h - 1) % 12; // bride's Moon = Pisces (11), groom at house h
    assert.equal(rasiAgreement(maleMoon, 11).verdict, expected[h - 1], `${h}h`);
  }
});

test("Prasna Marga 5.17-19 worked example: the six sphutas", () => {
  // Sun 301°12', Moon 18°29', Lagna 43°9', Gulika 64°26', Rahu 6°9'
  const s = computeSphutas(
    43 + 9 / 60,
    18 + 29 / 60,
    301 + 12 / 60,
    6 + 9 / 60,
    64 + 26 / 60,
  );
  approxLon(s.thrisphuta, 126 + 4 / 60, "thrisphuta");
  approxLon(s.chatusphuta, 67 + 16 / 60, "chatusphuta");
  approxLon(s.panchasphuta, 73 + 25 / 60, "panchasphuta");
  approxLon(s.pranasphuta, 280 + 11 / 60, "pranasphuta");
  approxLon(s.dehasphuta, 212 + 18 / 60, "dehasphuta");
  approxLon(s.mrityusphuta, 32 + 14 / 60, "mrityusphuta");
});

test("Prasna Marga 5.20-23 worked example: time-based sphutas", () => {
  // prasna 25.7 ghatis, day 31 ghatis, Sun 84° (Gemini, common sign), Thursday
  const s = timeSphutasFromGhatis(25.7, 31, 84, 4);
  // The text rounds the quotient to 99.48, so the results agree to within ~0.2°.
  const near = (got: number, want: number, msg: string) =>
    assert.ok(Math.abs(got - want) < 0.2, `${msg}: ${got} !~ ${want}`);
  near(s.pranasphutaAlt, 308.4, "Pranasphuta alt (Aquarius 8°24')");
  near(s.mrityusphutaAlt, 270.3, "Mrityusphuta alt (Capricorn 0°18')");
  near(s.kalasphuta, 30.3, "Kalasphuta (Taurus 0°18')");
});

test("Prasna Marga 8.1 worked example: Chatra Rasi", () => {
  // Arudha Vrishabha (Taurus=1), Lagna Simha (Leo=4), Sun in Mesha (Aries=0) → Chatra = Simha (Leo=4).
  assert.equal(computeChatraRasi(0, 1, 4), 4);
  // Sun in Scorpio → Veethi Gemini; Arudha Aries, Lagna Cancer (count 4) → Virgo.
  assert.equal(computeChatraRasi(7, 0, 3), 5);
});

test("Prasna Marga 4.38, 51-55 cowrie Arudha: remainder names the sign", () => {
  // Remainder 1 = Aries … 11 = Aquarius, 0 = Pisces.
  assert.equal(arudhaFromHandful(1), 0); // Aries
  assert.equal(arudhaFromHandful(7), 6); // Libra
  assert.equal(arudhaFromHandful(11), 10); // Aquarius
  assert.equal(arudhaFromHandful(12), 11); // Pisces (remainder 0)
  assert.equal(arudhaFromHandful(13), 0); // Aries (wraps)
  assert.equal(arudhaFromHandful(108), 11); // Pisces
});

test("Prasna Marga 4.54-55 Ashtamangala number: remainders of three ÷8 groups", () => {
  const a = ashtamangalaFromGroups(35, 40, 33);
  // 35 % 8 = 3, 40 % 8 = 0, 33 % 8 = 1 → 301
  assert.deepEqual(a.digits, [3, 0, 1]);
  assert.equal(a.number, 301);
  const b = ashtamangalaFromGroups(8, 16, 24);
  assert.deepEqual(b.digits, [0, 0, 0]);
  assert.equal(b.number, 0);
  const c = ashtamangalaFromGroups(3, 5, 7);
  assert.deepEqual(c.digits, [3, 5, 7]);
  assert.equal(c.number, 357);
});

test("Prasna Marga 14.72 tertiary planets: Upaketu + 30 returns the Sun", () => {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  for (const sun of [0, 84, 194.7, 301.2]) {
    const pts = computeTertiaryPlanets(sun);
    assert.equal(pts[0].name, "Dhuma");
    assert.ok(Math.abs(pts[0].lon - norm(sun + 133)) < 1e-9);
    // The text's own check: adding 30° to Upaketu (the fifth) returns the Sun's longitude.
    assert.ok(Math.abs(norm(pts[4].lon + 30) - norm(sun)) < 1e-9, `sun ${sun}`);
  }
});

test("Prasna Marga 32.61-72 Ashtakavarga readings: sums over the collective points", () => {
  // Synthetic collective: sign i has i+1 rekhas; house h has h rekhas (house 1 = 1 … 12 = 12).
  const av = {
    sarva: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      signIndex: i,
      rekhas: i + 1,
      band: "favourable" as const,
    })),
  } as unknown as AshtakavargaResult;
  const r = computePrasnaAvReadings(av);
  assert.equal(r.vithaya.total, 2 + 4 + 9 + 10 + 11); // 36
  assert.equal(r.theertha.total, 6 + 8 + 12); // 26
  assert.equal(r.categories.bhanduka, 1 + 5 + 9); // 15
  assert.equal(r.categories.sevaka, 2 + 6 + 10); // 18
  assert.equal(r.categories.poshaka, 3 + 7 + 11); // 21
  assert.equal(r.categories.ghataka, 4 + 8 + 12); // 24
  assert.equal(r.antarbhaga.antarbhaga, 1 + 4 + 5 + 7 + 9 + 10); // 36
  assert.equal(r.antarbhaga.bahirbhaga, 2 + 3 + 6 + 8 + 11 + 12); // 42
  // Sign-thirds: Pisces-Gemini 12+1+2+3=18, Cancer-Libra 4+5+6+7=22, Scorpio-Aquarius 8+9+10+11=38.
  assert.equal(r.lifeThirds[0].total, 18);
  assert.equal(r.lifeThirds[2].total, 38);
});

test("Prasna Marga 14.82 worked example: lagna navamsa lord times its navamsas", () => {
  // Rising navamsa Leo → lord Sun (Ayana, 6 months); the Sun in its 5th navamsa → 5 × 6 = 30 months.
  const planets = (
    [
      ["Sun", 14], ["Moon", 100], ["Mars", 200], ["Mercury", 50],
      ["Jupiter", 150], ["Venus", 250], ["Saturn", 300],
    ] as Array<[string, number]>
  ).map(([planet, lon]) => ({
    planet,
    lon,
    signIndex: Math.floor(lon / 30),
    degInSign: lon % 30,
  })) as unknown as Parameters<typeof computeFructificationTiming>[0];
  const t = computeFructificationTiming(planets, 14, 0);
  assert.equal(t.lagnaNavamsa.lord, "Sun");
  assert.equal(t.lagnaNavamsa.navamsas, 5);
  assert.ok(t.lagnaNavamsa.text.includes("30 months"), t.lagnaNavamsa.text);
  // The seven periods follow Brihat Jataka.
  assert.equal(t.periods.length, 7);
  assert.equal(t.periods.find((p) => p.planet === "Sun")?.classical, "Ayana");
});

test("Prasna Marga 21 kootas: star- and lord-based lookups", () => {
  // Male Aswini (0°), female Rohini (3rd star, 40°).
  const k = computeKootas(0, 3 * (360 / 27));
  assert.equal(k.mahendra.grade, "good"); // girl's star 4th from the boy's
  assert.equal(k.bhuta.grade, "good"); // both earthy (Prithvi)
  assert.equal(k.gana.grade, "good"); // Deva man, Nara woman
  // Aswini (0) → Brahmin; Rohini (3) → Sudra. Man Brahmin, woman Sudra → admissible (fair).
  assert.equal(k.varna.grade, "fair");
  assert.equal(k.total, 11);
});

test("Prasna Marga 22.34-53 Vedha: a favourable position obstructed by the Vedha sign", () => {
  // Moon in Aries (0); the Sun in the 3rd from it (Vedhya) with Mars in the 9th (Vedha).
  const mk = (planet: string, lon: number) => ({
    planet,
    lon,
    signIndex: Math.floor(lon / 30),
    degInSign: lon % 30,
  }) as Parameters<typeof computePrasnaVedha>[0][number];
  const v = computePrasnaVedha([mk("Sun", 60), mk("Mars", 240)], 0);
  assert.equal(v.length, 1);
  assert.equal(v[0].planet, "Sun");
  assert.equal(v[0].house, 3);
  assert.equal(v[0].vedhaHouse, 9);
  assert.equal(v[0].obstructor, "Mars");
});

test("Prasna Marga 5.8-9 Kunda worked example: lagna 11°34' → Aridra", () => {
  // 11°34' = 694' × 81 = 56214; mod 12 = 6 → Aridra (index 5); birth star Mrigasira (index 4).
  const k = kundaCheck(11 + 34 / 60, 4 * (360 / 27) + 1); // Moon just inside Mrigasira
  assert.equal(k.remainder, 6);
  assert.equal(k.kundaNakshatra, 5); // Aridra
  assert.equal(k.birthStar, 4); // Mrigasira
  assert.equal(k.trine, false); // Aridra is not Mrigasira nor its trines
});

test("Brihat Jataka 26.9 worked example: Rasi + Graha factor sum", () => {
  // Lagna 5s 10°20' (Virgo) with Jupiter and Venus in the rising sign → sum 9s 17°20'.
  const sum = nashtaFactorSum(160 + 20 / 60, ["Jupiter", "Venus"]);
  const expected = 9 + 17 / 30 + 20 / 1800; // 9s 17°20' = 9.5778 signs
  assert.ok(Math.abs(sum - expected) < 0.01, `sum ${sum} !~ ${expected}`);
  // The nakshatra from the same sum ×7 -9 (Virgo is common), reduced by 27.
  const nak = nashtaNakshatra(160 + 20 / 60, ["Jupiter", "Venus"]);
  assert.equal(Math.floor(((expected * 7 - 9) % 27 + 27) % 27), nak);
});

test("Sarvartha Chintamani 1.25-27 Amsha tiers and 2-8 house significations", () => {
  // Good-varga count → named amsha.
  const expect = ["", "", "Parijata", "Uttama", "Gopura", "Simhasana", "Paravata", "Devaloka", "Amar", "Airavata", "Vaisheshika"];
  for (let n = 2; n <= 10; n++) assert.equal(scAmshaName(n), expect[n]);
  assert.equal(scAmshaName(1), null);
  assert.equal(scAmshaName(11), "Vaisheshika");
  // Twelve houses with significations and a karaka.
  assert.equal(SC_BHAVAS.length, 12);
  for (let h = 1; h <= 12; h++) {
    const b = SC_BHAVAS[h - 1];
    assert.equal(b.house, h);
    assert.ok(b.significations.length >= 3, `house ${h} significations`);
    assert.ok(b.karaka.length > 0, `house ${h} karaka`);
  }
  assert.equal(SC_BHAVAS[1].karaka, "Jupiter"); // 2nd house
  assert.equal(SC_BHAVAS[7].karaka, "Saturn"); // 8th house
  assert.ok(SC_BHAVAS[1].significations.includes("accumulated wealth"));
});

test("Sarvartha Chintamani 2-3 bhava phala rules", () => {
  assert.equal(SC_BHAVA_RULES.length, 12);
  for (const h of SC_BHAVA_RULES) {
    assert.ok(h.rules.length >= 10, `house ${h.house} has enough rules`);
    for (const r of h.rules) {
      assert.ok(r.stanza > 0 && r.topic && r.when && r.then, `rule ${h.house}.${r.stanza}`);
    }
  }
  // A couple of pinned readings from the text.
  const h2 = SC_BHAVA_RULES[1].rules; // 2nd house
  assert.ok(h2.find((r) => r.stanza === 54)?.then.includes("bank balance"));
  assert.ok(h2.find((r) => r.stanza === 24)?.then.includes("innumerable"));
  const h1 = SC_BHAVA_RULES[0].rules; // 1st house
  assert.ok(h1.find((r) => r.stanza === 89)?.then.includes("consumption"));
  const h3 = SC_BHAVA_RULES[2].rules; // 3rd house
  assert.ok(h3.find((r) => r.stanza === 31)?.then.includes("patient, brave and learned"));
  const h4 = SC_BHAVA_RULES[3].rules; // 4th house
  assert.ok(h4.find((r) => r.stanza === 89)?.then.includes("costly house"));
  assert.ok(h4.find((r) => r.stanza === 168)?.then.includes("foreign land"));
  const h5 = SC_BHAVA_RULES[4].rules; // 5th house
  assert.ok(h5.find((r) => r.stanza === 33)?.then.includes("keen intelligence"));
  const h6 = SC_BHAVA_RULES[5].rules; // 6th house
  assert.ok(h6.find((r) => r.stanza === 13)?.then.includes("imprisoned"));
  assert.ok(h6.find((r) => r.stanza === 58)?.then.includes("good dishes"));
  const h7 = SC_BHAVA_RULES[6].rules; // 7th house
  assert.ok(h7.find((r) => r.stanza === 40)?.then.includes("chaste wife"));
  assert.ok(h7.find((r) => r.stanza === 70)?.then.includes("inferior status"));
  const h8 = SC_BHAVA_RULES[7].rules; // 8th house
  assert.ok(h8.find((r) => r.stanza === 19)?.then.includes("32"));
  const h9 = SC_BHAVA_RULES[8].rules; // 9th house
  assert.ok(h9.find((r) => r.stanza === 7)?.then.includes("religious institution"));
  assert.equal(SC_BHAVA_RULES.length, 12);
  const h10 = SC_BHAVA_RULES[9].rules;
  assert.ok(h10.find((r) => r.stanza === 15)?.then.includes("ruling powers"));
  const h12 = SC_BHAVA_RULES[11].rules;
  assert.ok(h12.find((r) => r.stanza === 15)?.then.includes("limb"));
});

test("Sarvartha Chintamani computeSarvartha evaluates rules against a chart", () => {
  const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
  const { utc } = birthInstant({ birthDate: "1982-11-01", birthTime: "07:20", timezone: "Asia/Kolkata" } as never);
  const jd = julianDay(utc);
  const positions = positionsAt(jd, opts as never);
  const asc = ascendantAt(jd, 9.93988, 76.26022, opts as never);
  const res = computeSarvartha(positions, asc);
  const total = SC_BHAVA_RULES.reduce((n, h) => n + h.rules.length, 0);
  assert.equal(res.total, total);
  assert.ok(res.computable > 100, `computable ${res.computable}`);
  assert.ok(res.findings.length > 0);
  // Deepak's Libra lagna with Venus in the 1st → 1.105 (Venus in lagna, happy first half) fires.
  const has = (house: number, stanza: number) => res.findings.some((f) => f.house === house && f.stanza === stanza);
  assert.ok(has(1, 105), "1.105 Venus in lagna should fire");
  // Shape check.
  for (const f of res.findings) {
    assert.ok(f.house >= 1 && f.house <= 12 && f.stanza > 0 && f.topic && f.text);
  }
  // Rajyogas (ch. 9) evaluate too; Deepak has Saturn in the lagna (Libra) → 9.22 does not fire.
  assert.ok(Array.isArray(res.rajyogas));
  assert.ok(SC_RAJYOGAS.length >= 12);
  assert.ok(SC_DASHA_PHALA.length >= 12);
  assert.ok(SC_DASHA_PHALA.find((r) => r.house === 8)?.then.includes("longevity"));
  assert.ok(SC_LONGEVITY.length >= 10);
  assert.ok(SC_LONGEVITY.find((r) => r.chapter === 10 && r.stanza === 7)?.then.includes("short"));
  for (const r of res.rajyogas) assert.ok(r.stanza > 0 && r.text);
});
