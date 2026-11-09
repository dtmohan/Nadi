import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkKarmajivaSection } from "../client/src/components/work-karmajiva";
import type { WorkKarmajiva } from "../shared/work-karmajiva";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const reading: WorkKarmajiva = {
  state: "available", asOf: "2026-01-01", past: false, birthTimeSensitive: true,
  methodEn: "Method in English", methodMl: "രീതി", qualificationEn: "Translations differ", qualificationMl: "വിവർത്തനങ്ങൾ വ്യത്യസ്തമാണ്",
  sourceUrl: "https://example.org/1", alternateSourceUrl: "https://example.org/iyer",
  references: [{ reference: "Lagna", tenthLord: "Mercury", navamsaSign: "Aries", navamsaLord: "Mars",
    callingEn: "metals", callingMl: "ലോഹങ്ങൾ", en: "The full source chain.", ml: "ജാതകത്തിലെ പരമ്പരാഗത രീതി.",
    sourceUrl: "https://example.org/1", callingSourceUrl: "https://example.org/2" }],
};

test("traditional livelihood is separate, transparent about translations and uncertainty", () => {
  const html = renderToStaticMarkup(React.createElement(WorkKarmajivaSection, { reading, ml: false }));
  assert.match(html, /Brihat Jataka/);
  assert.match(html, /not predict a modern occupation/);
  assert.match(html, /Translations differ/);
  assert.match(html, /within the stated birth-time range/);
  assert.match(html, /href="https:\/\/example\.org\/1"/);
  assert.match(html, /href="https:\/\/example\.org\/2"/);
});

test("traditional livelihood has Malayalam and withholds a held reading", () => {
  const html = renderToStaticMarkup(React.createElement(WorkKarmajivaSection, { reading, ml: true }));
  assert.match(html, /ബൃഹജ്ജാതകം/);
  assert.match(html, /ജാതകത്തിലെ പരമ്പരാഗത രീതി/);
  assert.equal(renderToStaticMarkup(React.createElement(WorkKarmajivaSection, { reading: { ...reading, state: "held", references: [] }, ml: true })), "");
});

test("harsh historical examples stay in a separately labelled source disclosure", () => {
  const reference = { ...reading.references[0], reference: "Moon" as const, navamsaLord: "Saturn" as const,
    callingEn: "hard labour, killing and torture, carrying burdens, low crafts",
    callingMl: "കഠിനാധ്വാനം, കൊല്ലലും പീഡനവും, ഭാരം ചുമക്കൽ, താഴ്ന്നതായി കണക്കാക്കിയ കൈത്തൊഴിലുകൾ",
    en: "Historical examples include killing and torture.", ml: "പഴയ ഉദാഹരണങ്ങളിൽ കൊല്ലലും പീഡനവും ഉൾപ്പെടുന്നു." };
  const html = renderToStaticMarkup(React.createElement(WorkKarmajivaSection, { reading: { ...reading, references: [reference] }, ml: false }));
  assert.match(html, /<details class="work-detail" data-testid="work-karmajiva-historical-Moon">/);
  assert.match(html, /Historical source details with harsh wording/);
  assert.match(html, /Historical examples include killing and torture/);
  assert.match(html, /href="https:\/\/example\.org\/2"/);
  const mlHtml = renderToStaticMarkup(React.createElement(WorkKarmajivaSection, { reading: { ...reading, references: [reference] }, ml: true }));
  assert.match(mlHtml, /കഠിനമായ പഴയ വാചകങ്ങളുള്ള ഉറവിടവിശദാംശങ്ങൾ/);
  assert.match(mlHtml, /കൊല്ലലും പീഡനവും/);
});
