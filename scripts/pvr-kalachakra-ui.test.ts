import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PvrKalachakraResearch } from "../client/src/components/pvr-kalachakra-research";
import { birthInstant, julianDay, positionsAt } from "../server/ephemeris";

test("dated PVR comparison displays the published example without altering scores", () => {
  const chart = { birthDate: "1966-11-30", birthTime: "10:36", timezone: "Asia/Kolkata",
    longitude: 77 + 47 / 60, latitude: 11 + 19 / 60 };
  const birth = birthInstant(chart).utc;
  const moon = positionsAt(julianDay(birth), { ayanamsa: "lahiri", nodeType: "mean" }).find((p) => p.planet === "Moon")!;
  const html = renderToStaticMarkup(createElement(PvrKalachakraResearch, { moonLon: moon.lon,
    birthIso: birth.toISO()!, asOfIso: "1996-12-15T06:30:00Z", birthZone: chart.timezone }));
  assert.match(html, /Major: <strong>Taurus<\/strong>/);
  assert.match(html, /Subperiod: <strong>Pisces<\/strong>/);
  assert.match(html, /does not change a rectification or validation score/);
});
