# Staged period-lord comparison on previously examined cases

The stricter, event-by-event hierarchy is implementable as a research check, but this exploratory test does not establish that it can identify a birth time. Adding the third level reduced the top-set coverage and the number of reported-time bands touched in both reused cohorts. A smaller top set has less opportunity to touch a reference band; the samples are too small and the references too uncertain to infer a calibrated accuracy or a statistically reliable difference.

The [protocol](parashari-staged-protocol.md) was written before this comparison but **after** earlier results for these same subjects were seen. Neither group is a fresh validation sample. Nadi's production scores are unchanged. The [machine-readable output](parashari-staged-results.json) contains source notes, case-level intervals, event details, date controls and computation hashes; no private user chart is included.

## The staged rule

The first-stage check counts an input event only when **both** its main and subperiod lords have one of the existing partial primary links in the relevant divisional chart. Candidates with the greatest number of such events survive together. Among those survivors only, the third stage counts events whose third lord also has a primary link. It retains all ties. An event with no first-stage links cannot earn its own third-stage point; an improvement at the third stage cannot promote a candidate with fewer first-stage-supported events over another candidate.

This is an app-defined operationalization of a proposed stricter check, not a literal scoring algorithm prescribed in Manley's book. It does **not** include all of his qualitative rules, supportive factors, yogas or indirect node links. D1 evidence is not made a mandatory Boolean condition. An absent match means *no link was found by this partial check*, not that a period or an event fails the full method. If no candidate has any first-stage-supported event, the whole scan remains unresolved instead of picking a winner. Repeated lords are not independent evidence.

## What happened

Every subject was scanned ±30 minutes around the **reported** time, using alternating dates as inputs and held-out events. The band-touch measure asks whether any tied top interval intersects ±5 minutes of the reported time. Coverage is the mean fraction of the scanned hour occupied by all tied top intervals. These are descriptive measures, not probabilities. The ±5-minute-expanded coverage gives a geometric reference for the extra opportunity that broad or fragmented sets have to touch a band.

| Previously examined group and measure | Stage 2: both broad lords | Stage 3: add the third lord |
| --- | ---: | ---: |
| Seven cases: reported-time ±5-minute touch | 3 / 7 | 1 / 7 |
| Seven cases: mean top-set coverage | 37.54% | 23.20% |
| Seven cases: mean expanded-coverage reference | 50.64% | 38.68% |
| Ten cases: reported-time ±5-minute touch | 6 / 10 | 4 / 10 |
| Ten cases: mean top-set coverage | 60.37% | 42.91% |
| Ten cases: mean expanded-coverage reference | 71.21% | 58.93% |

One of the ten cases had **no first-stage-supported input event anywhere in the scan**. It remained tied across the full hour and automatically touches the reported-time band; it should not be counted as a successful identification. Removing that unresolved case, stage 2 touched the band in **5/9** cases with **55.97%** mean coverage, and stage 3 in **3/9** with **36.56%** mean coverage. The same unresolved case is included in the table above to show the complete cohort.

In that case, “no first-stage support” refers only to the study's restricted D9 primary-link gate for the single input event, not all the evidence in the chart. A [follow-up window audit](parashari-staged-window-audit.md) shows D1 and supporting D9 links at the reported time and explores a wider window. The wider window is diagnostic, not a reason to discard the reported birth time.

The seven-case and ten-case groups had already appeared in the earlier third-period research. Their reported times include a mixture of quoted records and recollections; no original birth document was inspected by this project. A rounded or historically ambiguous time is not a verified ±5-minute target. A mismatch could reflect the model, missing rules, timing assumptions, the reported time, or other inputs; it cannot decide which explanation is correct.

## Held-out events and clocks

At reported birth times, the stricter three-lord condition held for **5/8** held-out events in the seven-case group, versus **29/48** shifted comparison dates. For the ten-case group it held for **8/15** held-out events and **43/90** comparison dates. These are joint, gated counts: all three levels must have the partial link for the event. The shifted dates are not verified non-events; the six shifts per event are correlated and do not preserve all plausible ages or event ordering. The numbers are a check on specificity, not a significance test.

At the reported birth times, the date-only clock scenarios 00:01, noon and 23:59 did not change the staged Boolean outcome for any of the **17** date-only events in the seven-case group or the **25** in the ten-case group. One third lord changed in each group without changing the staged Boolean. This sparse three-point check does not establish full-day stability. The candidate scan itself uses assumed noon for date-only events, so its ranked intervals depend on that assumption.

## Fourth and fifth periods

Manley's 345 discussion uses the third, fourth and fifth Vimshottari levels after the broad-period and chart analysis. The research utility [vimshottari-depth.ts](../shared/vimshottari-depth.ts) now calculates nested periods through the fifth, and a sixth calculation level for research. Automated tests compare the first three levels with Nadi's existing calculation and check fifth-level parent and boundary behavior. This is not independent validation of the calculation convention or astrological interpretation.

Fourteen events across the two reused groups have a stated local clock, six of them input events; some clocks are indirect or unverified. At the published birth times, shifting the stated clock by one hour either way changed the fourth or fifth lord in **2/14** events. These three clock scenarios and this selective sample do not quantify general sensitivity. The machine-readable output shows the lords and partial links for each scenario; no fourth- or fifth-level rank is assigned, and no fictitious noon-based fine-period result is assigned to date-only events.

Birth-time resolution matters too. In a **post-hoc**, single-case illustration, the reported 11:45 local clock for Audrey Hepburn's second wedding comes from a [contemporary newspaper](https://disco-legacy-data.s3.eu-central-1.amazonaws.com/public/upload/4/6/46347.pdf), and [Morges city](https://www.morges.ch/espace-presse/plaque-commemorative-du-mariage-d-audrey-hepburn-a-morges-8098) confirms the date and place. At 61 birth-time samples one second apart across ±30 seconds around the reported time, the calculated fifth lord changed **five** times between samples. This demonstrates sensitivity under the selected conventions; it does not establish her true birth time or show the method works. One-second sampling can itself miss changes. The [diagnostic output](parashari-fifth-resolution.json) can be reproduced with `node --import tsx scripts/eval-fifth-resolution.ts`.

The main scan's five-second grid can miss a shorter feature that begins and ends between samples; it refines only detected boundaries. In particular, it is not adequate to rank the fifth level across the full window. A responsible 345 evaluation needs boundary-aware candidate searches, explicit possible ranges for event clocks, tested dasha-year/ayanamsa/time-standard assumptions, and source-audited unseen cases. Additional chart or period layers should not be advertised as added precision until their sensitivity and predictive specificity are evaluated.

## Terminology and reproducibility

[P.V.R. Narasimha Rao](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=76) defines **Shodashavarga** as sixteen divisional charts, including D1, D4, D7, D9, D10, D16, D24 and D60. It is distinct from **Ashtakavarga**, a system based on eight reference points. It is also distinct from the nested levels of a dasha. Rao describes six named nested levels, including *deha* after *prana* ([chapter 16](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=221)); Manley's 345 procedure uses levels three through five. Nadi calculates the sixteen standard vargas in its chart engine, but this partial staged event test covers only D4, D7, D9, D10 and D24 where supported. It does not test all sixteen, D16 vehicle scoring or D60.

Run `node --import tsx scripts/eval-parashari-staged.ts > docs/parashari-staged-results.json`. Two runs produced byte-identical output; SHA-256 `438b17065a8a891dc68b9c05102effcd7a0691094ad481c3d452d56406cd988e`. The output hashes the protocol, cohorts and principal calculation files. A genuinely fresh evaluation must use cases and rules not previously chosen or inspected based on these results.
