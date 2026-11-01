# Review of Manley's birth-time rectification book

Source: Paul Manley, *Birth Time Rectification: How to Find Your Exact Birth Time — A Step by Step Guide Using Divisional Charts*, Sita Ram Publications, 2022, ISBN 9798441589697, supplied Kindle edition. The book is not copied into this repository. Citations below refer to its printed page numbers; the author's examples and proposed rules are practitioner claims, not independent proof that a corrected time is accurate.

## Useful framework

Chapter 4, pp. 99–102, 115–128, sets out an event-based funnel. It first looks for links involving the event's house, that house's lord, and its natural significator; it then considers the divisional ascendant, the natal house lord in the division, and the house counted from itself (bhavat bhavam). The author compares clue counts and also judges their quality; the book does not prescribe a general weighted scoring formula. Chapter 5 applies the method to Prince Harry (especially pp. 135–168).

| Event | Division | Main house | Natural significator(s) |
|---|---|---|---|
| Change of residence | D4 | 4 | Moon |
| Childbirth | D7 | 5 | Jupiter |
| Marriage | D9 | 7 | Venus |
| Career | D10 | 10 | Sun, Mercury, Jupiter, Saturn |
| Education | D24 | 5 | Jupiter, Mercury |

The book also uses D1 as a general starting chart and D60 for a later cross-check. An international trip is not necessarily a change of residence, so `abroad` is not mapped automatically. Nadi's education event is labelled admission, but the book recommends the first day of study when known (p. 100). Career and residence events can likewise require a careful choice of date. These subject labels do not imply the same rules apply to job loss, property purchase, or every other kind of event.

## What Nadi adds

- Rectify and Validate display descriptive clues for the major, subperiod and third-period lords in D1 and the relevant one of D4, D7, D9, D10 and D24. The third level does not alter v3. The presentation separates the three main factors from supporting factors and exposes the selected node convention, clock and zone assumptions. In the separate v3 experiment, two primary D7/D9/D10 period links also contribute to a score; the other observations remain descriptive. None automatically establishes a birth time.
- Education additionally shows a separately cited D24 fourth-house/lord view from P.V.R. Narasimha Rao, *Vedic Astrology: An Integrated Approach*, ch. 8. It is not silently included in Manley's fifth-house links or in v3.
- Rectify displays ascendant-sign windows independently for D1, D4, D7, D9, D10, D24 and D60. These are sampled and clipped to the scan, not estimates of certainty. The planetary positions in a division and the event's period lords may change within a single ascendant window. The existing D60 convention remains provisional; rapid movement at extreme latitudes and different ephemeris or ayanamsa choices require caution.
- This is a limited implementation: full sign-based aspects and same-sign conjunctions are shown, nodes can receive aspects but do not cast them under the app's convention, and a node's sign lord is displayed. Indirect links through that lord, all yogas, contextual judgments, alternative significators, and the full funnel are not automated. The book's examples include node aspects, so the app's convention is not a complete reproduction.
- Manley's funnel does not use transit positions as a core test (ch. 4); other Nadi methods retain their separately stated transit checks. The book's later 3/4/5-level dasha refinement (pp. 114–115) is not used for ranking. Event-time assumptions and very short subperiods make finer precision particularly sensitive and require their own study.

These observations do not alter the v1 or v2 Parashari scores, KP score or Jaimini score. The separate v3 synthesis is described and tested in the [v3 evaluation](parashari-divisional-v3-validation.md). Adding D4/D24 transitions can subdivide displayed candidate intervals further, so interval boundaries are not a new ranking. The earlier [Parashari v2 protocol](parashari-specific-v2-protocol.md), scorer and case manifest remain frozen.

## Calculation reproduction: Harry's published example

For the book's reported 15 September 1984, 16:20 local time in London, using Swiss Ephemeris Lahiri and **true nodes**, Nadi reproduces the central D7 and D9 event clues at the reported time. In D7, Rahu/Venus for the 2019 childbirth includes Venus in the fifth with aspects from Sun and Jupiter. In D9, Rahu/Ketu for the 2018 marriage includes Rahu receiving aspects from Jupiter and Venus, and Ketu sharing Venus's sign. The book's diagram shows true-node divisional placements; mean nodes instead put Rahu and Ketu in different D9 signs here, changing those clues.

Using London 51.5014° N, 0.1419° W, Nadi's ascendant windows around 16:20 are D7 Aries **16:17:27–16:33:02** and D9 Virgo **16:15:39–16:27:57**. The corresponding precise chart labels in the book differ by roughly 6–7 seconds. Such differences can reflect calculation settings and geographic coordinates; they should not be interpreted as an accuracy estimate. The automated test allows 15 seconds.

The author ultimately prefers approximately **16:18** even though the book describes **16:20** as the recorded time (pp. 162–168). Nadi has not independently inspected a birth record or established which time is correct. Agreement with this selected worked example checks calculations and transcription, not whether the method reliably finds recorded birth times. A narrow window or a high clue count alone cannot settle that question.

## Evaluation and next work

The [v3 evaluation](parashari-divisional-v3-validation.md) fixes selection and scoring rules before testing ten new published cases, reports ties and coverage, and includes held-out dates and source limitations. It did not show better recovery than v2 in that sample. A separate [third-period evaluation](parashari-third-period-validation.md) compares research-only two- and three-lord counts on seven newly selected public cases and reanalyses the ten prior cases; it likewise does not support adding the third level to the ranking. A later [staged follow-up](parashari-staged-validation.md) requires the same event to have two earlier links before counting its third-period link; that exploratory comparison reuses both cohorts and cannot establish accuracy. A stronger future study should use a larger and more representative set, test true and mean nodes and time-zone/ayanamsa sensitivity, and evaluate practitioner judgments separately with the evaluator blinded to the reported birth time. The author's selected example and the user's case are not independent validation.
