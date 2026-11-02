# Shared planet context: workflow parity and boundaries

This audit records implemented code paths, not whether an astrological rule predicts an event.
The shared context has no universal scoring rule: a school and frame must be named, and an event,
query or judgment requires its own instant and other inputs. The Rule Book's coverage table is
backed by [`school-rule-paths.ts`](../shared/school-rule-paths.ts); its exhaustive method map
requires a family for each selectable rectification method.

| Family | Ordinary chart | Dated reading, Validate and comparison dates | Rectify | Scope and remaining gap |
| --- | --- | --- | --- | --- |
| BNN natal findings | `evaluate` uses the shared natal frame and BNN directional relation. | The same evaluator supplies natal findings for the separate Jupiter/Saturn transit comparison. Each comparison date receives its own sky. | No BNN event method is implemented. | Natal combinations are not automatically evidence of timing. |
| KP ordinary interpretations | `computeKp` and `evaluateKp` use a KP-ayanamsa, Placidus frame. | The complete ordinary `KP_RULES` catalogue is not evaluated as an event verdict. | Same limitation. | The optional six-step reading is not silently substituted for the four-step event convention. |
| KP cusp/period/transit and Aurora event subsets | The available natal portions are projected in the chart. | `createKpEventScorer` handles the mapped matter, period lords and event sky; the selected-date endpoint calls Validate. Comparison dates recompute the same scoring gates. | The same event scorer is called at each candidate. | Actual and first comparison-date outputs carry additional descriptive transit evidence; later trials need not retain the prose. Custom cusp/house inputs can intentionally differ. |
| KP Moon and ruling-planet diagnostics | Available natal facts only. | Not event checks. | Separate Moon, mixed-chart and Nemani judgment-chart methods. | No judgment instant is invented. |
| Parashari ordinary house and yoga readings | `computeParashari` uses the shared natal positions and the selected house/aspect settings. | The complete ordinary chart catalogue is not automatically evaluated as an event verdict. | Same limitation. | Applying every house or yoga sentence to every event, or turning it into a score, needs separate rule-by-rule qualification. |
| Parashari D1/division and event subsets | `parashariNatalConditions` projects the same implemented foundations and all-planet Manley frames without inventing periods. | `createParashariEventScorer` combines those foundations with event periods and that event's transit sky. Trial dates use the same scorer. | Same scorer for each candidate and trial. | Event research uses whole signs and full sign aspects even if the ordinary chart is set to another house method. It remains a partial source-adapted screen. |
| Jaimini natal and Chara dasha | `computeJaimini` uses the natal context; the timing windows and `dashaFitAt` share the same underlying triggers. | The mapped area's `dashaFitAt` is used in Validate and the selected-date endpoint, including comparison dates. | Same function for each candidate, with cache scoped to that candidate. | Not every Jaimini natal finding is an event rule; a matter without a mapped area has no dasha check. |
| ALP | `computeAlp` evaluates natal positions against the selected progressed-lagna date. | The ALP date picker is a separate progression reading; no equivalent Validate event scorer or random-date comparison is implemented. | No ALP event method is implemented. | No outcome or score is inferred from the absence of that method. |
| Prasna Marga | Birth-chart house effects use the selected natal frame. The separate stored-sky view uses a transit snapshot and selected reference sign. | No equivalent Validate event scorer or random-date comparison is implemented. | Two separately named Kunda diagnostics, not the house-effects reading. | A stored sky snapshot is not a verified horary question chart. |
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

Passing tests establish the tested consistency and preservation of earlier output. They do not
show that every traditional rule has been implemented, that all indirect planet dependencies are
indexed, or that the experimental event scores establish a prediction or birth time.
