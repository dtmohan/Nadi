# PVR-inspired rectification: limited research protocol

This is a reconstruction of named published examples, not a transcript or a
claim to reproduce the 2019 Saptarishis video. Rao's interpretation includes
context, multiple factors and judgment; this project does not know a complete
mechanical PVR rule. No result identifies or verifies a birth time.

## Sources and calculation choices

- [Vedic Astrology: An Integrated Approach, chapter 32](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=439)
  uses event-relevant divisions and advocates revisiting a previous choice if
  a later division conflicts. Chapter 6 suggests D4 house 9/12 and Rahu for
  foreign residence. Example 130 specifically combines Jupiter's ninth and
  twelfth lordships, seventh-house placement and association with Rahu. It
  uses D24 house 4 for education, with Jupiter's aspect and conjunction with
  the fourth lord. These are clues from an example, not necessary conditions.
- Chapter 16 example 53 relates childbearing to D7 fifth-house lordship,
  occupants, Jupiter and a particular yoga. Real-life example 5 and chapter
  32 example 130 describe D9 marriage associations. The new evidence module
  records selected whole-sign relationships, not the complete yoga judgment,
  strength of two possible co-lords, special lagnas, argala or transit method.
- [Chapter 24](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=301)
  advances Kalachakra through a 24-sign wheel and prefers 360-day savana years.
  The research calculation reports full major and subperiod intervals and
  handles repeated signs by their wheel position. Nadi's existing BPHS-based
  nine-sign repeat and 365.25-day year remain a separate implementation.
  The research Vimshottari path also uses 360-day years; Nadi's default is
  unchanged. Neither is presented as an independently verified prediction.
- The 2000 textbook uses forward D24 counting for even signs; Rao's
  [2013 transit article](https://www.vedicastrologer.org/articles/pp_transits.pdf#page=1)
  specifies reverse counting for those signs. This experiment calls them
  `book-2000-forward` and `article-2013-reverse-even`. It compares just that
  D24 sign choice: it does not reproduce the article's Pushya-paksha ayanamsa,
  other JHora settings, or its transit technique. For all charts use Lahiri,
  mean nodes, local historical birth time, geocentric Swiss Ephemeris, whole
  sign houses and the application's full sign-based planetary aspects. The
  application's single traditional lord is used for Scorpio/Aquarius; Rao's
  stronger co-lord procedure is not implemented.

## Frozen fresh-case comparison

The fixture is `scripts/fixtures/pvr-marriage-fresh.json`. The four people
were absent from existing structured Nadi fixtures. The published birth time
is a reference, not guaranteed ground truth; the underlying birth records were
not independently inspected. Dates are sourced independently of astrology
where possible and conflicting sources are noted. The cases are a small,
convenience-selected sample, not a representative or preregistered study.

Before computing their outcomes, define a **limited diagnostic**, motivated
by the marriage examples: does the running PVR Kalachakra *subperiod* sign
equal D9 lagna, D9 seventh, the D9 sign containing Venus, or the seventh sign
from D9 Venus? These four alternatives and a binary count are an app research
operationalisation, not Rao's universal rule. Each case uses one marriage; no
winner or birth time is inferred from the diagnostic. Report all four cases,
actual and six nearby date controls (−180, −120, −60, +60, +120, +180 days),
and the fraction of the 60-minute window around the reported birth time with
the diagnostic at the actual date. The birth window is sampled every 30
seconds, including the first but excluding the last endpoint. A shorter
feature can be missed. Full local event days are assessed by traversing the
actual subperiod boundaries, since the wedding clocks are unknown. Controls
are not confirmed non-events, are correlated and can fall during an existing
relationship. The reported-time calculation and all controls call the same
evaluator. Do not modify the diagnostic after seeing outcomes or describe
this as an independent validation of a selected time.

## Personal exploration

Use the supplied birth data and preserve family recollections as approximate
context. Inspect a broad range that includes previously discussed candidates
and both sides of a relevant rising-sign transition. Use the given event zones
and ranges; do not fabricate precise dates for month-only events. Where a clock
is unknown, inspect the full local calendar day. Show the D1 and appropriate
divisional frames and the relevant period clues, retain conflicts and alternative
D24 variants, and do not silently discard any candidate. The user's data,
outputs and scripts containing their data must not be saved in the repository.
Their previously disclosed events are exploratory, not a held-out confirmation.
PVR's retrospective examples and the above small case comparison do not
establish predictive accuracy.
