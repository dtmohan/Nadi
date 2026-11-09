import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { LocalizedTextValue } from "../client/src/lib/i18n";

test("Malayalam report labels override the English fallback and unknown text stays English", () => {
  const markup = renderToStaticMarkup(React.createElement("div", { lang: "en" },
    ...["Back to the chart", "Download PDF", "Untranslated control", "Provisional", "Plain reading", "Practitioner reading"].map((label) =>
      React.createElement(LocalizedTextValue, { locale: "ml", children: label, key: label })),
  ));
  assert.match(markup, /<span lang="ml">ജാതകത്തിലേക്ക് മടങ്ങുക<\/span>/);
  assert.match(markup, /<span lang="ml">PDF ഡൗൺലോഡ് ചെയ്യുക<\/span>/);
  assert.match(markup, /<span lang="en">Untranslated control<\/span>/);
  assert.match(markup, /<span lang="ml">താൽക്കാലികം<\/span>/);
  assert.match(markup, /<span lang="ml">ലളിതമായ വായന<\/span>/);
  assert.match(markup, /<span lang="ml">വിദഗ്ധ വായന<\/span>/);
});

test("report uses language-aware labels and retains English source citations", () => {
  const page = readFileSync(new URL("../client/src/pages/report.tsx", import.meta.url), "utf8");
  for (const label of ["Back to the chart", "Print", "Include", "Notes", "Provisional"]) {
    assert.ok(page.includes(`<LocalizedText>${label}</LocalizedText>`), label);
  }
  assert.match(page, /<LocalizedText>\{exporting \? "Preparing PDF" : "Download PDF"\}<\/LocalizedText>/);
  assert.match(page, /<LocalizedText>\{doc\.plain \? "Plain reading" : "Practitioner reading"\}<\/LocalizedText>/);
  assert.match(page, /<ol lang="en" className="mt-3 space-y-1/);
});
