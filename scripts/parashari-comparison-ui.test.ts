import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParashariComparisonPanel } from "../client/src/components/parashari-comparison";
import type { ComparisonStat } from "@shared/parashari-comparison";

test("the staged comparison explains its conditional sample sizes and limits", () => {
  const stat: ComparisonStat = { actual: 1, mean: 0.7, sd: 0.5, percentile: 65, verdict: "chance" };
  const html = renderToStaticMarkup(React.createElement(ParashariComparisonPanel, {
    comparison: { v1: stat, staged: { eligibleEvents: 3, first: { ...stat, actual: 2 }, qualifyingDraws: [3, 20], third: stat } },
    trials: 200, birthZone: "Asia/Kolkata",
  }));
  assert.match(html, /3–20 qualifying dates out of 200/);
  assert.match(html, /recombined independently across events/);
  assert.match(html, /not the probability of a correct birth time/);
});

test("the staged comparison does not display a third-level percentile without qualifying dates", () => {
  const stat: ComparisonStat = { actual: 1, mean: 0.7, sd: 0.5, percentile: 65, verdict: "chance" };
  const html = renderToStaticMarkup(React.createElement(ParashariComparisonPanel, {
    comparison: { staged: { eligibleEvents: 1, first: stat, qualifyingDraws: [0] } },
    trials: 200, birthZone: "Asia/Kolkata",
  }));
  assert.match(html, /no third-stage percentile is available/);
  assert.doesNotMatch(html, /Third-level matches:/);
});
