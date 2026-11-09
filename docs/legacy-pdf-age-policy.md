# Legacy chart PDF and age policy

`POST /api/pdf` retains its chart request schema, PDF content type and `nadi-<name>.pdf` filename. It continues to use the original English chart PDF for living adults whose life areas are in season.

When a life area is held by age, or a recorded passing date has occurred, the endpoint instead renders the modern plain report with Nadi, Jaimini and Panchanga. Its layout and coverage differ from the original PDF. This path applies the report's cross-topic age filter and its recorded-life snapshot, because the original PDF prints mixed-topic passages and current timings directly. Malayalam remains available through the separately configured `/api/report.pdf` endpoint; `/api/pdf` has no language option.

The cross-topic filter checks the original English text and evidence before translation and removes whole findings containing held subjects. It is a conservative lexical filter, not a complete semantic classifier: it can suppress benign mixed-topic text and cannot guarantee detection of every euphemism.
