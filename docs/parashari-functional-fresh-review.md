# Functional lordship: fresh public-case review

The direct-lord subset has **not demonstrated that it can distinguish the reported ascendant from a neighbouring sign or an event date from nearby dates**. Across five new public birth charts, its two reference-event counts favoured the reported-sign side of the nearest boundary once and tied on four pairs. Of 30 nearby dates, 29 had the same held-out-event count as the actual date. The two sides are each 30 seconds from the same boundary; the reported birth times themselves need not be near it.

The [protocol](parashari-functional-lordship-protocol.md), [case sources and uncertainties](../scripts/fixtures/parashari-functional-fresh.json), and rule were fixed before the completed scoring run. The diagnostic counts distinct main/subperiod planets that directly own the mapped event house and have an individually auspicious or yogakaraka classification in the same D1 or relevant divisional frame. This is a deliberately narrow Nadi convention, not a published BPHS score. An absent match leaves the event unresolved. The functional role, all owned houses, sign, sign dignity, paired-yoga context and other event links remain separately visible.

| Case | Published-sign / opposite-sign reference counts | Held-out count at reported clock | Nearby dates with the same count | Reference actual vs random mean |
| --- | ---: | ---: | ---: | ---: |
| Bill Gates | 1 / 1 | 1 | 6 / 6 | 1 / 1.0 |
| Joe Biden | 1 / 1 | 0 | 6 / 6 | 0 / 0.0 |
| Diana, Princess of Wales | 1 / 0 | 2 | 5 / 6 | Unavailable: span under one year |
| Yuvraj Singh | 0 / 0 | 0 | 6 / 6 | 0 / 0.0 |
| Céline Dion | 0 / 0 | 1 | 6 / 6 | 1 / 0.6 |

The five held-out events averaged 0.80 direct-lord matches and the 30 shifted dates averaged about 0.77. These 30 dates are correlated and are **not verified non-events**. Neither the small difference nor the reported-sign comparison establishes event specificity, accuracy, or the correct birth time. A given D1 sign can contain many different divisional ascendants and period boundaries: for Diana and Dion, the reported instant and the adjacent boundary-side candidate can have different counts even though their D1 signs agree.

After the first completed audit, a missing-frame handling defect was corrected so absent evidence is unavailable rather than counted as zero. Every evaluated case had both frames, and a complete rerun produced identical case results. The published output hashes the corrected implementation; no lordship rules, weights or cases were changed to improve the outcome.

The five subjects are a nonrepresentative convenience sample. Published birth clocks may be rounded, remembered, disputed, or indirect. Gates's 22:00 and Diana's 19:45 each have earlier alternative reports; Dion's 12:15 and 00:30 reports conflict. Biden's 08:30 is reported through an astrologer and disputed. Singh's son's reported date coincides with the announcement date, and the study treats it as uncertain. Dion's twins' reported clock also conflicts with an afternoon news description. Alternate-clock and date scenarios are included in the [full results](parashari-functional-fresh-results.json); the [fixture](../scripts/fixtures/parashari-functional-fresh.json) links to the underlying sources. Diana's son William was also a chart in an earlier study, making his birth a shared event, even though Diana herself is a new case.

The boundary procedure compares candidate charts near one sign transition, not the reported instant with a validated alternate time. Several divisional ascendants may change along with D1. The test does not show that the direct-lord subset supports the event, nor that it should be used as a birth-time gate. Other event types, adverse outcomes, indirect links, complete planetary strength and transits need their own sourced and independently evaluated rules.

Reproduce with `node --import tsx scripts/eval-parashari-functional.ts > docs/parashari-functional-fresh-results.json`. The results include hashes of the protocol, fixture, evaluator and relevant calculation code.
