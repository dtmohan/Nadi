# Review of the supplied rectification audit

This review compares selected claims in the supplied Qwen report with the implementation and the cited texts. “Not established” means the evidence reviewed here does not justify the report's conclusion; it does not by itself establish that the corresponding calculation is wrong. Source fidelity is distinct from evidence that a method predicts events or recovers a birth time.

| Report section | Assessment |
| --- | --- |
| Vimshottari | The report's blanket “verified” is broader than this review. The period table, year convention and boundary behavior require their own source and calculation checks. |
| KP ruling planets | The app distinguishes the five primary ruling-planet roles from separately displayed sub-lords and applies additional node and retrograde handling. The display of additional lords does not mean that seven roles all have equal score weight. The report's blanket verification is too broad. |
| KP significators | Four-rule and six-rule presentations are distinguished in the app. This alone does not validate every downstream interpretation. |
| Dutta | The cited [paper by Prof. Andrew Dutta](https://kpastrologeronline.com/wp-content/uploads/2021/09/Birth-Time-Rectification.pdf) describes comparing the judgment Moon's sign, star and sub lords with the birth ascendant's lords. It also gives a separate Rule of Origin. The report's event-period description and its claim that the user named “C.S. Dutta” are not supported by the supplied material. The app labels its mixed-chart approach as inspired by Dutta; it is not the entire procedure in the paper. |
| Nataraj Sun hint | Page 192 of the supplied *Astro-secrets & KP*, Part 2, instructs the reader to observe the Sun's sub on the judgment date. Matching that Sun's star and sub against the candidate ascendant and the 2:1 weighting are app conventions, not rules established by that passage. The hint is outside event scoring and random-date comparisons; labels now say so. |
| Kunda | The app exposes separately named Raman and D81 variants. The supplied *Prasna Marga* example on p. 74 uses a remainder-by-12 procedure; a 27-nakshatra D81 calculation is not numerically interchangeable with that example. The report's description of the Raman count is not the app's implementation. Do not conflate these variants or infer validation from similar labels. |
| Brihat Jataka Nashta | The report incorrectly calls the prior implementation verified. [Chapter XXVI](https://www.rarebooksocietyofindia.org/book_archive/196174216674_10151670519936675.pdf) frames the method using the query chart; the prior code substituted each candidate's natal chart and accepted additional stars as equivalent matches. The corrected diagnostic requires an explicitly supplied question instant and place, computes the query chart once, and compares the derived birth star with the candidate Moon's star. The associated planetary-factor table lists the seven visible planets; the app no longer invents factors for the nodes in this variant. Alternative ±9 arithmetic in the text belongs inside the derivation and is not blanket permission to count trine stars as matches. Older unmarked results are not evidence from the corrected method. |
| Nemani | The app describes its two-step combination as an interpretation. This review does not establish complete fidelity to every step in the source. |
| Shanmugham / Moon linking | The cited capture and implementation need a separate complete review; the report's verification is not independently established here. |
| Jaimini Chara Dasha | The app does use the running major and subperiod signs as reference points for house-based event analysis. The report does not give a sufficiently defined and sourced formula for its proposed additional “Chara Lagna / Kendra” to implement it safely. Different published dasha conventions should remain distinct. |
| ALP | The app presents its timing approach as partial and acknowledges practitioner conventions. That is not proof of full fidelity to an entire school. |
| BNN | The current marriage contact check is a partial clue. The report does not establish that all BNN contacts or later-cycle timing have been implemented. |

The report also calls a drekkana one third of a nakshatra. In the conventional divisional chart it is one third of a 30-degree sign, or 10 degrees; the relevant app calculation uses that sign division.

## Raman's separate sunrise diagnostic

In *Hindu Predictive Astrology*, chapter XI, pp. 49–50 of the 1996 edition, B. V. Raman gives a separate birth-star check based on elapsed vighatis since sunrise, multiplication by four and a remainder on division by nine. It is not the same procedure as either Kunda variant.

The printed example's 06:25:32 sunrise and 19:42:44 birth time differ by 13h 17m 12s, or 1,993 vighatis of 24 seconds. Its printed 33 ghatis 53 vighatis instead equal 2,033 vighatis. These yield different remainders. The example therefore cannot validate the method as printed without resolving the discrepancy.

`shared/raman-birth-star-diagnostic.ts` records the explicitly specified integer calculation for research. It returns inconclusive for missing sunrise, fractional vighatis and a zero remainder, because the reviewed passage does not specify the needed conventions. It is not connected to the UI, event scores, random-date comparisons or rectification rankings. In particular, a caller must provide the correct preceding sunrise; this helper does not calculate it.

## Scope of checks

Rectification and validation event comparisons use their shared school-specific event-scoring paths; tests should continue to verify this parity rather than treating random dates as known non-events. The Nashta query diagnostic and Nataraj hint are distinct from those event scores. Numerical agreement with an example or source text is a calculation and attribution check, not independent evidence of predictive accuracy or minute-level birth-time precision.
