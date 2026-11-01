import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopicReadingPanel } from "../client/src/components/topic-reading";
import { computeChart } from "../server/routes";

// The production bundle uses Vite's automatic JSX transform. The test runner's
// classic transform resolves React from the global scope for the nested panels.
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const chart = {
  id: 113, name: "Synthetic UI chart", gender: "male", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "",
  deathDate: null, timeUncertaintyMin: 0, events: [{ id: "sample", matter: "marriage", date: "2013-03-11" }],
};
const adult = computeChart(chart);
const render = (result: typeof adult, system: "parashari" | "kp") => renderToStaticMarkup(
  React.createElement(QueryClientProvider, { client: new QueryClient(), children: React.createElement(TopicReadingPanel, { result, system }) }),
);

test("the chart reading exposes natal foundations and a date selector without claiming an event", () => {
  const html = render(adult, "parashari");
  assert.match(html, /Natal foundations/);
  assert.match(html, /D1 and D9/);
  assert.match(html, /Saved event \(optional\)/);
  assert.match(html, /Outcome \(optional\)/);
  assert.match(html, /does not mean the event happened or will happen/);
});

test("the date selector holds minor-only subjects back in the chart reading", () => {
  const child = { ...adult, utc: "2016-01-01T06:30:00.000Z",
    chart: { ...adult.chart, birthDate: "2016-01-01", events: [] } };
  const html = render(child, "kp");
  assert.match(html, /value="education"/);
  assert.doesNotMatch(html, /value="marriage"/);
  assert.doesNotMatch(html, /value="accident"/);
});
