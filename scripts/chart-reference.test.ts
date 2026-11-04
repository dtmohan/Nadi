import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { computeChart } from "../server/routes";
import { chartReferenceFrame, referenceDegree } from "../client/src/lib/chart-reference";
import { ReferenceChart } from "../client/src/components/reference-chart";
import { SouthIndianChart } from "../client/src/components/south-indian-chart";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const result = computeChart({
  id: 0, name: "Synthetic reference", gender: "male", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "",
  deathDate: null, timeUncertaintyMin: 0, events: [],
});

test("the reference changes all KP positions and the rising sign together at a sign boundary", () => {
  const frameChart = structuredClone(result);
  frameChart.jaimini.lagna.signIndex = 0;
  frameChart.kp.cusps[0] = 359.9999;
  frameChart.positions[0].signIndex = 0;
  frameChart.kp.positions[0].signIndex = 11;
  frameChart.now.positions[0].signIndex = 1;
  frameChart.kp.now.positions[0].signIndex = 2;
  const natal = chartReferenceFrame(frameChart, "bnn")!;
  const kp = chartReferenceFrame(frameChart, "kp")!;
  assert.equal(natal.risingSign, 0);
  assert.equal(kp.risingSign, 11);
  assert.equal(natal.positions[0].signIndex, 0);
  assert.equal(kp.positions[0].signIndex, 11);
  assert.equal(natal.positions, frameChart.positions);
  assert.equal(kp.positions, frameChart.kp.positions);
  for (const mode of ["overview", "jaimini", "alp", "parashari", "prasna", "rectify", "validate"])
    assert.equal(chartReferenceFrame(frameChart, mode)?.positions, frameChart.positions, mode);
  assert.deepEqual(kp.transits, frameChart.kp.now.positions.filter((p) => p.planet === "Jupiter" || p.planet === "Saturn"));
  assert.equal(kp.transitAsOf, frameChart.kp.now.asOf);
});

test("an unavailable KP cusp never falls back to the chart's other ayanamsa", () => {
  const frameChart = structuredClone(result);
  frameChart.kp.cusps = [];
  assert.equal(chartReferenceFrame(frameChart, "kp"), null);
  assert.ok(chartReferenceFrame(frameChart, "overview"));
});

test("displayed degrees stay in their actual sign at either side of a boundary", () => {
  assert.equal(referenceDegree(29.99999), "29°59′59″");
  assert.equal(referenceDegree(30), "0°00′00″");
  assert.equal(referenceDegree(359.99999), "29°59′59″");
  assert.equal(referenceDegree(360), "0°00′00″");
});

test("KP's sign chart labels the frame and does not draw whole-sign house numbers", () => {
  const html = renderToStaticMarkup(React.createElement(ReferenceChart, {
    result, mode: "kp", selected: "Moon", onSelect: () => {}, showTransits: true,
    onToggleTransits: () => {}, instance: "dialog",
  }));
  assert.match(html, /data-frame="kp"/);
  assert.match(html, /Placidus cusps/);
  assert.doesNotMatch(html, /data-testid="house-number-/);
  assert.match(html, /Sky snapshot/);
  assert.match(html, /At birth, Moon was in/);
  assert.match(html, /All birth positions/);
});

test("the North Indian view can draw a sky position in an otherwise empty sign", () => {
  const onePlanet = [{ ...result.positions[0], signIndex: 0 }];
  const transit = [{ ...result.now.positions.find((p) => p.planet === "Jupiter")!, signIndex: 6 }];
  const html = renderToStaticMarkup(React.createElement(SouthIndianChart, {
    positions: onePlanet, transit, lagnaSign: 0, layout: "north", showHouseNumbers: false,
  }));
  assert.doesNotMatch(html, /NaN/);
  assert.match(html, /tJu/);
});
