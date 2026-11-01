# Window and Moon sensitivity: one unresolved public case

This is a **post-hoc** exploration of Emily Deschanel's case from the [staged experiment](parashari-staged-validation.md). It is not independent validation or a rectified birth time. The earlier experiment's one input event was the 25 September 2010 wedding; childbirth was held out. Its binary gate required a primary D9 house, house-lord or significator link for **each** of the first two period lords. No candidate in the original ±30-minute window met that particular gate. It was inaccurate to describe this as if the chart had no possible support for the event.

At the reported 22:56 birth time, the research calculation gives Rahu/Moon for the wedding and no primary D9 link for either lord. However, it also identifies D1 Rahu together with Venus and the Moon together with Jupiter, the D1 seventh lord. In D9, the Moon is with that same D1 seventh lord Jupiter, a supporting link considered in Manley's framework. Rahu has additional bhavat-bhavam-lord context in D9. These links were shown by the evidence engine but were **not counted** in the strict primary-D9 gate. Their presence does not establish the correct birth time, but it shows why a missing Boolean primary link is not a complete judgment.

## Time-window exploration

[Astro-Databank](https://www.astro.com/astro-databank/Deschanel%2C_Emily) is cited by the fixture for 22:56 on 11 October 1976; its AA birth-record attribution was not independently inspected here. A [contemporaneous CBS report](https://www.cbsnews.com/news/emily-deschanel-and-david-hornsby-tie-the-knot/) describes the wedding as an evening ceremony but does not give an exact clock. The original study used noon for date-only events. This audit uses **20:00 only as an illustrative evening scenario**; the childbirth clock is unknown and remains assumed noon. It does not exhaust time uncertainty.

The exploratory script samples birth instants on a five-second grid from three hours before to three hours after the reported time. Its first and last samples are approximate boundaries; a shorter change between samples could be missed. Under the specified clock and rules:

* In the original ±30-minute window, the Moon remains in Krittika and the wedding's main/sub lords remain Rahu/Moon. The D9 ascendant nevertheless passes through five signs, and no sampled candidate meets the study's D9 primary gate for both lords.
* An earlier range of approximately **21:13–21:39 on the stated birth date** meets that wedding gate. On the same samples, the childbirth event also meets the two-lord D7 gate under the noon assumption. Both events have already been inspected, and the D7 condition also matched many shifted comparison dates; this is not an independent confirmation.
* Another wedding-match range, approximately **00:09–00:23 the following day**, is incompatible with the reported birth date. It must not be silently treated as an alternative on 11 October.

The same-day earlier range is roughly 76–103 minutes before the cited time, which is attributed to a birth record. Finding a match there is not evidence that the birth record is wrong: the simplified gate, other omitted factors, assumed event clocks, calculation conventions and source uncertainty are all possible explanations. Do not widen a search until a match is found and then report that match as proof.

## Same star, shifted periods

In the original window the Moon stays in Krittika, and the wedding remains in Rahu/Moon at the sampled points. This does not mean the calculated schedule is identical. With Nadi's 365.25-day-year convention and the 20:00 event scenario, moving the candidate birth **10 minutes later** moves the calculated Rahu/Moon end by about **13.5 days**. The change comes from the Moon's fraction of the nakshatra at birth affecting the initial dasha balance. A deeper period can cross an event date even while the star and the broader period lords stay the same. [P.V.R. Narasimha Rao](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=437) discusses the same type of birth-time sensitivity in nakshatra-dasha dates.

Run `node --import tsx scripts/audit-staged-window.ts` for the [machine-readable audit](parashari-staged-window-audit.json), which includes the assumptions, candidate ranges, chart links and period-boundary examples. It uses only the existing public fixture. As with all research checks here, the astrological links are model output, not independently demonstrated predictions.
