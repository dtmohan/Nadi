import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdditionalWorkTheme } from "../client/src/components/work-evidence";
import type { WorkTheme } from "../shared/work-journey";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const theme: WorkTheme = {
  id: "synthetic-extra", text: { en: "A source names creative work." },
  evidence: { ruleId: "synthetic-extra", en: "A chart connection.", ml: "ഒരു ജാതകബന്ധം.",
    source: "Synthetic source", sourceText: "Creative work.", planets: [],
    provisional: true, timeSensitive: true, sourceUnverified: false, provenance: "extension",
    testedQualifiers: [], untestedQualifiers: [] },
};

test("additional work interpretation retains its qualifications and source in Malayalam view", () => {
  const html = renderToStaticMarkup(React.createElement(AdditionalWorkTheme, { theme, ml: true }));
  assert.match(html, /lang="en">A source names creative work/);
  assert.match(html, /ഇത് ഇപ്പോൾ ഇംഗ്ലീഷിൽ ലഭ്യമാണ്/);
  assert.match(html, /താൽക്കാലിക വ്യാഖ്യാനം/);
  assert.match(html, /ജനനസമയ പരിധിയിൽ/);
  assert.match(html, /Synthetic source/);
  assert.match(html, /സമീപരാശി വിപുലീകരണ/);
  assert.match(html, /<details/);
});

test("additional work interpretation displays a matched Malayalam passage", () => {
  const translated = { ...theme, text: { en: theme.text.en, ml: "കലാപരമായ തൊഴിൽ." } };
  const html = renderToStaticMarkup(React.createElement(AdditionalWorkTheme, { theme: translated, ml: true }));
  assert.match(html, /lang="ml">കലാപരമായ തൊഴിൽ/);
});
