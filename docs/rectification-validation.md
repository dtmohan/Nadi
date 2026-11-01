# Rectification and event-validation pilot

This is an exploratory engineering check, not a clinical validation, statistical proof, or a claim that astrology can recover birth times. The sample is small and chosen for available published records. No weights or house rules were fitted to the results below.

## Cases and inputs

Seven public figures cover a physicist born in Germany, a British monarch, a California technology entrepreneur, a Hawaii-born public official, an Italian-born Indian political leader, an India-born cricketer and coach, and a Brazilian fashion model. Their birth times are documented in the [case manifest](../scripts/fixtures/rectification-evaluation.json), with links for each birth record and each event. The records are sometimes reports or transcripts of birth documents, and rounded times such as 17:00 must not be treated as accurate to a second. Bob Woolmer's 02:15 birth time is a report of what his certificate said, not an original examined here. His coaching events are announcement dates mapped provisionally to the app's job category; his actual duties began later. Public biographies are incomplete and heavily select noteworthy people and events.

Events with a verified zone use that zone; the [Royal Household](https://www.royal.uk/70-facts-about-queen-and-duke-edinburghs-wedding?page=1) gives Elizabeth II's wedding as 10:30 in London, so that known time is used. Other missing times default to noon. Where an event zone is not documented in the manifest, the app uses the birth zone. Some event labels are approximate; the manifest explains the exceptions. The older public-figures fixture has additional events; this pilot excludes those whose category or precise date is unclear. In particular, a degree award was not treated as admission to higher study, and an election announcement was not treated as taking office.

## Procedure

For each chart the evaluator scans ±30 minutes around the reported time. It sorts distinct event dates, uses alternating dates as the input set, and holds the other dates out. Events sharing a date would always stay together. It scores each sampled interval separately under each event-based method. For a diagnostic candidate, it chooses a selectable midpoint with the highest **raw input-event score**; where scores tie, it chooses the midpoint nearest the reported time. The latter uses knowledge of the reported time and favours it, so this is not a blind search. The held-out score is then compared at the candidate and the reported time. This split is a retrospective holdout, not a prospective forecast: some input events occur later than held-out ones. With only one to four held-out events per case, differences of one point are not dependable.

The table shows the percentage of the one-hour scan occupied by intervals whose **sampled midpoint** has the top raw input-event score. ✓ means at least one of those intervals touches the chosen ±5-minute band around the reported time; × means none does. The five-minute band is a reporting convention, not a claim about certificate precision. Midpoint scores do not guarantee that every second of the interval has the same score. This raw-score diagnostic differs from the app's current random-date highlight, which uses an exploratory 95th-percentile cutoff and a difference from the random-date mean.

| Case | KP dated events | KP period-lord transits | Jaimini Chara dasha |
|---|---:|---:|---:|
| Albert Einstein | × 28.3% | × 66.3% | ✓ 100% |
| Elizabeth II | × 16.2% | ✓ 51.2% | ✓ 42.6% |
| Steve Jobs | × 25.1% | × 25.5% | ✓ 42.3% |
| Barack Obama | ✓ 44.5% | × 18.1% | × 20.4% |
| Sonia Gandhi | ✓ 25.7% | × 6.1% | ✓ 75.0% |
| Bob Woolmer | ✓ 73.8% | ✓ 96.3% | × 37.1% |
| Gisele Bündchen | ✓ 32.9% | × 19.8% | ✓ 100% |

The Jaimini raw score is completely flat across the scan for Einstein and Bündchen. Its apparent ✓ in those cases therefore provides no narrowing. Bob Woolmer's transit top score covers nearly the entire scan. Conversely, a higher score selected away from a documented time can also score well on held-out events: for example, the selected Jobs KP event candidate is about 19 minutes earlier than the reported time and scores 15/16 on the held-out events versus 10/16 at the reported time. That is a warning that this implementation's event scores are not calibrated to select a birth time, not evidence that the reported birth record is wrong. The [full output](rectification-evaluation-results.json) gives each score, candidate offset, interval coverage, and held-out comparison.

The separate D81 Kunda check did not match the recorded-time window in any of these seven cases; matching windows occupied about 10.6–11.8% of the scan in this small sample. This does not by itself refute the traditional rule: reported birth times and the natal application have uncertainties, and no population inference can be drawn from these examples. Raman's distinct remainder-by-12 example is sampled too coarsely by the general scan to evaluate interval coverage. Ruling planets require the actual moment and place of judgment; body-mark checks require reliable observations of those marks. Neither is evaluated in this pilot. KP Moon-lord scores and fixed-chart Nadi comparisons are included in the machine-readable output but are descriptive, not independent validation.

## Parashari divisional cross-check

For a supported event, Rectify now exposes the relevant D1 house alongside D9 for marriage, D7 for children, or D10 for career. The [Brihat Parashara Hora Shastra, chapter 7.1–8](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf), associates these divisions with spouse, descendants, and power or position; the chosen divisional houses and ascendant rulers follow the separate Mehta references named in the interface. The check reports house rulers and their sign placements, occupants, full sign aspects, the divisional ascendant and its ruler, the D1 matter ruler in the division, and links from the event's Vimshottari period rulers. D1 additionally gets a partial house-support/strain assessment based on BPHS 11.14–16. Both charts use whole-sign houses and the chart's selected ayanamsa. This is not a complete assessment of strength, avasthas, yogas, or event promise; aspects from lunar nodes are omitted under the convention used here. D10 alone does not decide whether a career event is a gain or a loss. Other event categories are not automatically mapped to a divisional chart.

The scanner samples boundaries of the relevant D1 and divisional factors and event periods in addition to its existing KP and Jaimini boundaries. This can subdivide previously tied intervals and move the diagnostic midpoint chosen among ties without changing the underlying scoring rules. The scan samples at ten-second steps and the listed factors at a midpoint; it does not guarantee that every change or every second inside a segment has been captured.

The evaluator counts distinct patterns in the selected divisional factors among the highest-scoring sample intervals. Einstein's Jaimini score remains tied across 100% of the hour, but those samples contain **seven** distinct selected divisional-factor patterns; Bündchen's completely tied Jaimini samples contain **eight**. On the other hand, Sonia Gandhi's top KP period-lord transit samples have only **one** such pattern. These counts use only the input events and the selected factors, not full chart comparisons or held-out predictions. They show when there is something different to inspect; they do **not** show which candidate time is correct, that these factors predict events, or that adding a score would improve accuracy. The JSON also gives the number of broader combined D1, division, and period-link patterns.

No divisional scoring weights were fitted to these already-inspected cases. The subsequent source-informed scoring experiment and its new-person evaluation are documented separately in [Parashari holdout validation](parashari-holdout-validation.md); its initial results were poor and the ranking remains experimental.

A later event-specific version and a different nine-person evaluation are recorded in [version 2 validation](parashari-specific-v2-validation.md). Its top-score coverage and nearby-date controls continue to limit the usefulness of the ranking.

## Event sky and source check

At the documented 10:30 wedding time, Nadi calculates transiting Jupiter's KP sub-lord as Mars; at the earlier default of noon on the same date it calculates Rahu. The two-period-lord score for this particular wedding is unchanged because those period lords are Venus and Venus, but the broader event-sky evidence is different. Both the actual event and a random comparison date now use that event's supplied local time and zone; ambiguous and nonexistent local times are rejected rather than silently shifted. Random comparison dates falling in a daylight-saving gap or fold are redrawn.

As a separate source-conformance check, [K.S. Krishnamurti's KP Reader IV, pp. 113–114](https://www.scribd.com/document/1017596238/04-Jyotish-KP-Reader-4-Marriage-Married-Life-Children) gives a worked transit example for 24 June 1970. At noon in India, the engine reproduces the described Sun in Gemini/Ardra/Jupiter sub, Moon in Shatabhisha, Mercury in Mars' star/Rahu sub, and the nodes in Mercury sub. The source does not provide an exact event time for this comparison, and matching these positions does not validate the natal judgment or show that the forecast occurred. This is a check against one published worked example, not an independent numerical ephemeris validation.

## What was tuned

- Event time and time zone can be saved independently. Rectify, Validate, their event-sky displays, and their comparison trials use the same event instant. Missing values are explicitly identified as assumptions. Other date-based tools may still use the date only.
- Multiple events on the same civil date are paired with their own calculated sky instead of looking up the first sky with that date.
- A flat raw score is called out in Rectify. The highlight selector now chooses the greatest excess **among** candidates that meet its stated exploratory cutoff, rather than allowing an ineligible candidate to suppress all highlights.
- For KP, Jaimini, and the lost-horoscope check, Rectify and its PDF now show the approximate share of the window whose sampled midpoints have the highest raw score, together with the score at the midpoint of the interval containing the recorded time. This exposes broad ties and shows when the raw maximum differs from that interval; the highlight can use a different random-date criterion. Body-mark maxima can differ by candidate, while the two Kunda variants have different sampling rules, so the same coverage summary is not shown for those checks.
- No numerical astrology weights were tuned to these cases. Independent held-out people, more event types, accurate event locations/times, and an age- and event-aware comparison design are needed before choosing weights or presenting probabilities of correctness.

## Reproduce

From the repository root, with dependencies installed:

```sh
node --import tsx scripts/eval-rectification.ts > docs/rectification-evaluation-results.json
node --import tsx --test scripts/rectify-validation.test.ts
```

The evaluator uses 200 reproducible random-date sets per comparison. Dates are independently selected between the first and last observed events. They do not preserve plausible ages, event ordering, or biological constraints; the resulting percentiles describe this particular comparison, do not adjust for trying many candidates or measures, and are not probabilities that a birth time is correct. The ±30-minute scan itself presupposes the reported time is approximately known.
