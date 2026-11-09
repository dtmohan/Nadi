# Reading-room integration validation

## Scope and cases

The cases in `cases.json` were selected before the integrated room's output was inspected. They are convenience examples, not a random or blinded sample. Astro-Databank attributes Gabriela Mistral's reported time to a birth certificate and gives Malala Yousafzai a family-estimated window; neither underlying record was independently inspected. The Malala run checks the reported midpoint and both ends of that window, without treating any as an established exact time. Independent Nobel sources document their public careers. See the fixture for links and source notes.

Four birth-time candidates from the user's chart were also checked locally. The private fixture and its readings are not part of this repository.

## What was checked

`scripts/eval-reading-room.ts` verifies deterministic composition, agreement between displayed topic tones and the computed synthesis, evidence references against underlying findings, age-held areas, and the recorded-date-of-passing snapshot. It also checks that marriage-specific language does not appear as a career closing. All four public chart variants and all four private candidates passed. This is a consistency and presentation check; it does not establish the accuracy of astrological predictions or select a birth time.

The school-context legacy regression retains its original hashes, using the documented legacy projection. The current rule audit keeps Nadi 12th-house support separate from Neecha Bhanga, labels source versus adjacent-sign relations, and marks Jupiter-aspect and weak-Moon qualifiers as untested. The encoded Jupiter-joins exception retains the separate job/detachment finding at its app-defined weight. Comparing ordered rule IDs and scores to the earlier all-or-nothing branch behavior, the four private candidates were unchanged; one of the four public variants gained that finding. A weight is an application convention, not a claim of source-derived calibration.

Synthetic regression tests cover the chart cache and concurrent writes, civil birthday and timezone boundaries, leap-day handling, historical readings, and held-topic filtering. The latter is conservative and lexical; it can hide benign text and cannot guarantee detection of every euphemism. A synthetic browser check exercised chart edits, navigation, focus handling and the Malayalam entry path.

The existing Malayalam guided reading and report translations are integrated; the editorial reading room remains English. English fallback and remaining coverage limits are documented in `research/malayalam-technical/review.md`. That review also records why browser print preview could not be verified in the automation environment; the PDF table regression is a separate check and does not establish browser pagination.

## Reproduce

```sh
node --import tsx scripts/eval-reading-room.ts
node --import tsx --test --test-concurrency=4 scripts/*.test.ts
npx tsc --noEmit --incremental false
```

Private chart evaluation uses the same evaluator with a local, untracked fixture and `--anonymous`; it is intentionally not reproducible from this repository alone.
