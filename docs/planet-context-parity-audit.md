# Shared planet context: workflow parity and boundaries

This audit records implemented code paths, not whether an astrological rule predicts an event.
The shared context has no universal scoring rule: a school and frame must be named, and an event,
query or judgment requires its own instant and other inputs. The Rule Book's coverage table is
backed by [`school-rule-paths.ts`](../shared/school-rule-paths.ts); its exhaustive method map
requires a family for each selectable rectification method.

| Family | Ordinary chart | Dated reading, Validate and comparison dates | Rectify | Scope and remaining gap |
| --- | --- | --- | --- | --- |
| BNN natal findings | `evaluate` uses the shared natal frame and BNN directional relation. | Mapped area findings are carried as context; the separate Jupiter/Saturn comparison selects a touched finding at each sky. | Mapped natal context is shown for each candidate; no BNN event-ranking method exists. | Broad area findings are not automatically event promises or evidence of timing. |
| KP ordinary interpretations | `computeKp` and `evaluateKp` use a KP-ayanamsa, Placidus frame. | A reviewed matter-specific subset uses the same four-step evaluator and appears for the actual and first comparison date. | The same subset is evaluated at each candidate. | Promise clues, modifiers and context remain distinct. The complete catalogue is not an event verdict; custom house/cusp definitions are not silently mapped. |
| KP cusp/period/transit and Aurora event subsets | The available natal portions are projected in the chart. | `createKpEventScorer` handles the mapped matter, period lords and event sky; the selected-date endpoint calls Validate. Comparison dates recompute the same scoring gates. | The same event scorer is called at each candidate. | Actual and first comparison-date outputs carry additional descriptive transit evidence; later trials need not retain the prose. Custom cusp/house inputs can intentionally differ. |
| KP Moon and ruling-planet diagnostics | Available natal facts only. | Not event checks. | Separate Moon, mixed-chart and Nemani judgment-chart methods. | No judgment instant is invented. |
| Parashari ordinary house and yoga readings | `computeParashari` uses the shared natal positions and the selected house/aspect settings. | Subject-house, house-lord and lord-connected yoga findings are context; named period-lord participants are descriptive. | The same context is evaluated at each candidate and shown for actual and first comparison events. | The complete catalogue is not automatically an event verdict. Ordinary readings use the selected house system; separate event research uses whole signs and full aspects. |
| Parashari D1/division and event subsets | `parashariNatalConditions` projects the same implemented foundations and all-planet Manley frames without inventing periods. | `createParashariEventScorer` combines those foundations with event periods and that event's transit sky. Trial dates use the same scorer. | Same scorer for each candidate and trial. | Event research uses whole signs and full sign aspects even if the ordinary chart is set to another house method. It remains a partial source-adapted screen. |
| Jaimini natal and Chara dasha | `computeJaimini` uses the natal context; timing windows and `dashaFitAt` share the same triggers. | Mapped-area natal findings are context; `dashaFitAt` handles dated readings and comparison dates. | Same natal context and dasha function for each candidate, with candidate-local cache. | Not every Jaimini natal finding is an event rule; an unmapped matter has no dasha check. |
| ALP | `computeAlp` evaluates natal positions against the selected progressed-lagna date. | Reviewed topic findings are computed at event and comparison instants; the first sampled set is shown. | The same event-instant evaluator is used at each candidate. | Context only, without an event score or ranking. The chart date picker uses start of day and can differ at a boundary. |
| Prasna Marga | Birth-chart house effects use the selected natal frame. The stored-sky view uses a transit snapshot and selected reference sign. | Mapped natal-house wording, selected Gulika convention and applicable Jupiter–Gulika clues are context. | The same context is shown at each candidate; Kunda diagnostics remain separate. | No horary question chart or event score is inferred without the relevant inputs. The Jupiter aspect is not automatic cancellation. |
| Brihat Jataka | No ordinary chart implementation of these two diagnostics. | Not event checks. | Body marks and lost-horoscope checks are separately named methods. | They require their respective observations or natal inputs, not a dated event. |

## Tests and regression evidence

* `school-context-legacy.test.ts` compares the complete six-school output against per-school
  hashes captured from commit `1289129` for three fixed synthetic charts. They cover Lahiri,
  Raman and KP ayanamsas; mean and true nodes; and rashi, equal and Sripati house options.
* `planet-context.test.ts` checks immutable snapshots; directional BNN, Parashari and Jaimini
  relations; incorrect KP ayanamsa/cusps; D1/D4/D7/D9/D10/D24 frame identity; school-specific
  per-planet indexing; BNN/Jaimini dated and candidate parity; and the complete method inventory.
* `reading-parity.test.ts`, `rectify-validation.test.ts`, `kp-aurora-integration.test.ts` and
  `parashari-monte-carlo.test.ts` compare the shared KP/Parashari natal, selected-date, candidate
  and sampled-date paths, including outcomes and event clocks/zones. The synthetic scan benchmark
  captures the complete response and 200 deterministic comparison trials.
* `briefing.test.ts` checks that the per-planet index appears only in practitioner mode for eligible
  adult readings and does not bypass the existing sensitive-content gate.
* `catalogue-event-parity.test.ts` checks registered KP IDs, cusp interpretation, ALP cache
  boundaries and ordinary/dated/Validate/candidate/first-comparison-date equality.

Passing tests establish the tested consistency and preservation of earlier output. They do not
show that every traditional rule has been implemented, that all indirect planet dependencies are
indexed, or that the experimental event scores establish a prediction or birth time.

The additional ordinary catalogue evidence does not contribute points to the existing KP,
Parashari, BNN or Jaimini comparison statistics. Natal context is fixed for a candidate across
comparison dates. ALP topic findings and ordinary Parashari period participants are recalculated
on every sampled date; per-event occurrence counts and identical-set counts are shown separately
from the existing scores. The first sampled set exposes contextual findings for direct comparison.
Rectify computes each segment at its displayed midpoint: ordinary Parashari and ALP context can
change inside an interval, so a grouped interval does not imply identical findings throughout.
