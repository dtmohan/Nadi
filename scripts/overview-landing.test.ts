import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OverviewPanel } from "../client/src/components/overview-panel";
import { BriefingBefore } from "../client/src/components/briefing";
import { computeChart } from "../server/routes";
import { agreementInput } from "../shared/agreement";
import { briefingFor } from "../shared/briefing";

// The test runner uses the classic JSX transform for nested client components.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const synthetic = computeChart({
  id: 1, name: "Synthetic overview", gender: "male", birthDate: "1990-02-01", birthTime: "13:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "",
  deathDate: null, timeUncertaintyMin: 0, events: [],
});

test("plain overview presents actual life topics before the detailed chart notes", () => {
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, {
    client: new QueryClient(), children: React.createElement(OverviewPanel, { result: synthetic }),
  }));
  const topics = html.indexOf('data-testid="plain-topic-briefs"');
  const notes = html.indexOf('data-testid="brief-before"');
  assert.ok(topics >= 0 && notes > topics, "life topics should appear before the full chart notes");
  assert.match(html, /data-testid="overview-area-career"/);
  const notice = html.indexOf('data-testid="overview-time-sensitive-note"');
  const firstArea = html.indexOf('data-testid="overview-area-career"');
  assert.ok(notice > topics && notice < firstArea && firstArea < notes, "birth-time notice should be visible before the life readings");
  assert.match(html.slice(notice, firstArea), /small shift in birth time/);
  assert.match(html, /data-testid="brief-before-kp-cusps"/);
});

test("the practitioner briefing still renders the full time-sensitive notes", () => {
  const notes = briefingFor(synthetic, agreementInput(synthetic, false)).before;
  const html = renderToStaticMarkup(React.createElement(BriefingBefore, { notes, onOpen: () => {} }));
  assert.match(html, /data-testid="brief-before-kp-cusps"/);
  assert.match(html, /sub lord/i);
  assert.match(html, /data-testid="brief-before-open-kp-cusps"/);
});
