# Review: Pande, Gochara Deep Dive (2026)

The user's supplied text is source material for this review, not an instruction to change the app. The extract has OCR/reading-order defects, and its page numbers are unavailable, so references below use its chapter headings. The book distinguishes its own numerical methodology from its traditional reading; this audit does not republish the extract or adopt its proprietary weighting, overrides or untested accuracy claims.

## What Nadi already covers

| Subject in the book | Nadi's current reading | Qualification |
| --- | --- | --- |
| Moon-first gochara and favourable houses | Panchanga, overview and the calendar use `computeGochara` | [Phaladeepika 26.1–2](https://www.siva.sh/phaladeepika/26/1); many modifiers and their order are app interpretations. |
| Ascendant as a second lens | Panchanga practitioner checks | Modern, provisional; classical Moon-house tables are not automatically classical ascendant-house tables. The ascendant-relative position is shown separately in the event-time context. |
| Saturn's named passages, retrograde re-entry, Jupiter and Saturn aspects to the birth Moon | Panchanga practitioner and calendar checks | Names vary regionally; the sign-based aspects and any disagreement with the classical house table are shown. |
| Rahu and Ketu as an axis | Panchanga practitioner check | The paired house topics are descriptive; sign-dispositor interpretations are not a complete natal/period/transit combination. |
| Long Mars passages and Moon's daily tara | Panchanga practitioner checks | Four months is the practitioner's threshold, not a classical transit cutoff. The tara is calculated from actual star positions and not added to event scores. |
| Dasha and transit together | Separate Vimshottari period-lord transit strips and event-specific Parashari/KP checks | These have their own cited scope; the book's numerical combination is not imported or presented as validated. |

`shared/gochara-practice.ts` previously interpreted an `obstructed` Moon verdict as favourable when summarising the ascendant lens. It now keeps the obstruction explicit and gives that comparison a mixed tone. Both the screen and Panchanga report use this shared result.

## New date-specific access

The chart's Matter and date readings and Validate now expose the same Moon-based gochara engine at the chosen event's actual or assumed local time and time zone. The first reproducible comparison set is evaluated in the same way. Each shows the traditional Moon-relative house, the app's modified verdict and its contributing observations, the transit's ascendant-relative house as position only, and the transiting Moon's tara relative to the birth star. Plain exports include the Jupiter/Saturn and tara summary; practitioner exports also include the detailed tables and the sampled comparison.

These are descriptive observations: none becomes an event prediction, pass/fail gate, tie-breaker, rectification rank, or Monte Carlo score. The previously frozen [fresh-case experiment](moon-gochara-fresh-review.md) is historical; rerunning it after this change produces the same recorded and comparison scores, and its original hashes refer to the earlier implementation. KP and Parashari continue using their own event rules. The event context uses the selected chart ayanamsa, whereas KP uses KP ayanamsa. Panchanga's date picker evaluates sunrise, which can differ from the event's clock.

## Corrections and unresolved claims

- Chapter 6 says the Moon spends roughly 2½ days per nakshatra and takes about 23 days for the nine-tara sequence. In the equal 27-star system, each star spans 13°20′; [NASA gives a sidereal lunar period of 27.3217 days](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html). The average is therefore about one day per star and roughly nine days for nine successive stars, with actual durations varying. The app calculates the Moon's position rather than assuming either duration. A date without a known time may cross a star boundary.
- Chapter 8's hypothetical Libra-ascendant example calls Venus the yogakaraka, whereas the earlier list names Saturn for Libra. With standard sign lordships, Saturn owns the 4th and 5th for Libra; Venus owns the 1st and 8th. [BPHS 34.33–34](https://www.siva.sh/brihat-parashara-hora-shastra/34/33) describes Saturn as auspicious and Venus as neutral for Libra. The worked example's Venus claim is not adopted.
- The chapter 4 example that places Jupiter in the 8th from the Moon and gives it a 5th sign-based aspect on the Moon does not follow whole-sign counting. The app uses sign-based full aspects for this check and flags the discrepancy; a degree-based method would need its own stated orb and validation.
- The extract reports high effectiveness and mentions Monte Carlo work, but does not provide enough accessible case definitions, comparison dates, code or independent non-events here to reproduce those performance claims. Nor does it specify a complete event-specific formula for each category. They are hypotheses for research, not reasons to adjust a production score.

The Moon's birth star remaining unchanged within a birth-time window keeps star-based categories fixed, but its degree still changes. In Vimshottari, that degree sets the remaining balance of the birth period; exact transit contacts, KP sub-divisions and divisional placements can also change. General sign-from-Moon houses alone cannot separate two candidates in the same natal Moon sign.
