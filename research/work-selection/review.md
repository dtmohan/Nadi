# Work selection and career-context evaluation

## What changed

The earlier journey inherited a score-first three-finding sample from the general area synthesis. That synthesis can move a pair finding out of the displayed key when a trio contains the same planets, even if the two rules describe different work themes. The Work journey now retains unique, age-safe career findings separately, with their original app-rule wording, evidence and provenance. A short featured set retains eligible reviewed previous leads and, when possible, adds one different rule family. The cutoff and family choice are application presentation conventions, not a ranking of likely jobs. Additional findings are available in a disclosure; related rules are not independent confirmations.

Some occupation examples are modern wording in Nadi's rule catalogue and have not been checked individually against the books named in their catalogue attribution. The Work journey identifies the text as app rule wording, distinguishes provisional adjacent-sign extensions, and treats unaudited rule conditions as unresolved. It does not change the rules, event scores or rectification scores.

The journey also shows a separately attributed Brihat Jataka 10.1–3 livelihood context using the existing chart calculation. It keeps the three reference chains and source translations apart from Nadi. Historical examples are not translated into asserted modern occupations. The Aiyar edition's [chapter X](https://chestofbooks.com/new-age/astrology/Brihat-Jataka/Chapter-X-On-Avocation.html) does not impose the empty-tenth prerequisite previously attributed to it. The correction applies to the regular reading, event explanation, report, rule book and documentation; the empty-house field remains an informational calculation and scoring is unchanged.

## Case selection and what the comparisons mean

The [first four cases](holdout-cases.json) were chosen before inspecting the first selection's outputs, then their results informed the decision to preserve previous reviewed leads. The [next three](final-holdout-cases.json) were selected after that decision; their results were then reviewed while designing a generic exact-source continuity adapter. They are development comparisons, not untouched holdouts.

The [last three cases](last-check-cases.json) were chosen after deciding the adapter and before looking at their outputs. Each fixture records the published birth-data source and an independent career source. Original documents were not inspected; Worsley's year has conflicting reports. These are small convenience samples, neither random nor blinded, and the comparison is descriptive, not a measurement of astrological accuracy. Other prior cases were used during development. The baseline is the previously published prototype at `27a3643`, computed separately from an archived copy; the revised model is evaluated using the same input charts and reading date.

## Observations

- The four private chart candidates were checked locally. Each had four featured and eleven additional selected findings; each featured and additional finding had a Malayalam text match in this sample. The former prototype showed three featured themes. They all retained a computing-related finding and presented other work alternatives; a broad overlap with the user's shared engineering work does not establish a prediction. The private fixture and generated readings are not included in this repository.
- The first comparison set included Tadanobu Asano, Paulo Davim, François Roche and Beatrice Worsley. An early family-only selector moved Asano's arts clue out of the main view; the exact-source continuity adapter restores that previously selected clue. Davim's featured interpretations do not identify his medical and political work, and Roche's do not identify architecture. Worsley's computing-related clues are accessible in additional findings but were not in the final featured set. Her published birth year is disputed.
- In the second set, Bernice Durand retained the previously selected general research theme; Keith Livingstone gained a broad healing example alongside several unrelated ones. Drake's former short entertainment example is now in additional findings: its multi-clause rule lacks a fully reviewed plain passage, so it was not promoted by the one-clause continuity adapter. That is a regression in first-screen relevance.
- In the last set, Claire Keim's featured examples did not identify acting or singing, Venus Williams's did not identify tennis, and Paul Terasaki's did not identify transplant research. A research/healing clue appears in Terasaki's additional findings. The featured sets included other unrelated occupations. The separate classical examples likewise do not establish these careers. Greater breadth makes some clues discoverable but also increases the number of alternatives; it is not evidence of better occupational prediction.
- On the earlier development cases, Miranda's main view still misses his documented creative career; writing and arts are among many additional findings. Sacramone's selected interpretations still do not identify her gymnastics. Bedran-Russo has a broad research-related overlap among other interpretations. No rules were adjusted to these individuals' biographies.

## Checks and limitations

`scripts/eval-work-journey.ts` checks deterministic output, unique source IDs, source text and planets, age and death snapshots, and the three livelihood chains against the existing Karmajiva calculation. Synthetic tests cover source drift, false source attribution, overlapping pair/trio findings, held topics, exact-source translation and historical readings. Malayalam coverage in these cases is a string-presence check, not a native-speaker or traditional-text editorial review. Other-school technical text can still fall back to English.

```sh
node --import tsx scripts/eval-work-journey.ts research/work-selection/last-check-cases.json
node --import tsx --test scripts/work-journey.test.ts scripts/work-karmajiva.test.ts scripts/malayalam-work-journey.test.ts scripts/work-additional-ui.test.ts
```

The same evaluator accepts a local private manifest and `--anonymous`; it must not publish that fixture or its readings.
