# Work and direction prototype: validation notes

## Selection and scope

The public cases in `cases.json` were selected before viewing this prototype's outputs: a US composer and performer, a US gymnast, and a Brazilian clinician-scientist. Independent career sources and published birth-data citations are in the fixture. Birth certificates and family statements were not independently inspected. Several reported times for the performer are tested separately rather than treated as an exact time. The cases are a convenience sample, not random or blinded; this assessment is not a measure of predictive validity.

Four candidates for the user's chart were also checked locally. The private fixture, birth data and generated private readings are not included in this repository. Each candidate produced the same three selected work themes. One included information technology, which overlaps with the user's described work in computing; the other alternatives included administrative or scholarly occupations. This broad overlap is not evidence of a correct career prediction.

## What the readings showed

- **Lin-Manuel Miranda:** all four reported-time variants selected engineering/construction, machinery/mining/chemicals and service/administration examples. These selected themes do not identify his documented composing, writing or performing work. This is a miss, not a reason to choose a different time.
- **Alicia Sacramone:** the selected examples included information technology, technical work and scholarly occupations, but not her documented gymnastics career. This is a miss.
- **Ana Bedran-Russo:** selected themes include technical or research work and institutional responsibility, which overlap broadly with her documented research and academic roles; other listed examples do not establish her specific profession.

The prototype uses the existing guided reader's small, unranked selection of Nadi career findings. It does not infer that the chosen examples are the most likely occupation. Where two distinct selected passages explicitly share a broad category, a connection sentence identifies that common category and points back to both passages; the passages and their individual qualifications remain visible. The sample shows that the selection can be unrepresentative. It was not adjusted to the published biographies.

## Technical and language checks

`scripts/eval-work-journey.ts` checks deterministic composition, the age gate, date-of-passing snapshot and each displayed theme's unique rule ID and original source text. The model fails closed on missing or ambiguous source IDs and retains conditional source text instead of applying a stale paraphrase. Separate synthetic regressions exercise age-held topics, source changes, relation provenance, shared-theme connections and Malayalam matching.

In the four private candidates and the three public people, all three selected themes and their displayed source-rule passages had Malayalam matches; the chart-relation explanation also had Malayalam. This is coverage for these examples, not proof of complete translation or linguistic quality. Some other-school explanations and unusual conditions fall back to English with language labels. Independent native-speaker editorial review remains outstanding.

The timing section distinguishes selected Nadi transit passages from event predictions. It does not claim those passages establish what will happen or when. Browser checks use a fictional chart; no private chart content is sent to an external service.

## Reproduce

```sh
node --import tsx scripts/eval-work-journey.ts
node --import tsx --test scripts/work-journey.test.ts scripts/malayalam-work-journey.test.ts
```

The evaluator accepts a local private manifest and `--anonymous`, which suppresses private chart details and passages in its output.
