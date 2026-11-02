# Prashnanushthana Paddhati: source and calculation audit

The user supplied a text extraction of *Prashnanushthana Paddhati*, translated and annotated by K. Guru Rajesh, second edition. References below identify chapters, verses and **extraction page markers**; they are not guaranteed to match the printed page numbers. The text contains OCR errors and omits some diagrams. No book text or personal consultations are included in this repository.

## Question, Arudha and cowries

Chapter 2, verses 3–8 (extract pp. 40–44) describes a question-specific procedure using a zodiac diagram and gold or fruit placed on a sign; it also describes an Arudha navamsa method and notes a different rising-navamsa practice. The essential 3 × 3 diagram is absent from the extraction, so the exact grid should not be reconstructed from OCR alone. Chapter 2, verse 14 (p. 52) describes recording the question details and ritual observations. Nadi's snapshot uses the birth location and is not an established question-time chart. A real consultation requires its own time, place, and recorded Arudha method.

Chapter 5, verses 12–13 and 19 (pp. 92–95) uses 108 cowries in three heaps, with left/north, middle and right/south contributing hundreds, tens and units. The worked counts 34, 39, 35 yield 2, 7, 3. The commentary describes digits 1–8, and chapter 4 (p. 86) gives an 8 + 8 + 4 example. Treating a **positive** multiple of eight as 8 is a reasonable interpretation, but the extract does not explicitly say that a zero remainder must be replaced with 8. Nadi therefore presents the ordinary 0–7 remainders and this separately labelled interpretation. For 32, 40, 36, they yield 004 and 884 respectively. This is arithmetic, not a validated prediction.

The two cited sources distinguish the gold-placement Arudha from the three heaps. B.V. Raman's *Prasna Marga*, 4.38 and 4.51–55, does not establish Nadi's simulated handful-by-12 Arudha method; the UI and code now call it an exploratory simulation. The observed-heaps calculator does not assign an Arudha or cast a horary chart. The simulated split now has three positive heaps; changing the manually selected Arudha clears the previous simulated-cast description.

## Gulika / Mandi: a source mismatch to resolve

Chapter 3, verses 9–10 (pp. 54–55) gives day and night weekday constants for a rising instant relative to sunrise or sunset, scaled by actual day or night length. B.V. Raman's *Prasna Marga* 5.14–16 notes give the same Mandi constants and explain that some authors distinguish Mandi and Gulika; both books apply the Mandi approach under the Kerala usage discussed there. Nadi currently uses a different, provisional eight-part Saturn-portion calculation for `gulika`, including for points derived from it. The difference is not merely a label and can change signs or derived points. A separate research function implements the constants; it has **not** replaced the existing chart calculation.

The source's Sunday example presents 29 ghatis 15 vighatis × 26 / 30 as 25 ghatis 16 vighatis. With 60 vighatis per ghati, the stated arithmetic gives **25 ghatis 21 vighatis**. Its Thursday-night example gives 23 ghatis 28 vighatis, which agrees with the formula. These are arithmetic checks, not a reason to claim one tradition is universally correct.

### Worked-chart reproduction

The worked question at 11 November 1994, 19:25 IST, 10°31′ N, 76°13′ E is credited to K. K. Janardhan Kurup, *Deva Prashnam* (2009), in chapter 6 (extract pp. 107–108). For a mechanical comparison, assume Lahiri, mean node and refracted upper-limb sunrise, because the extract does not establish the original settings. Run:

```sh
node --import tsx scripts/eval-prashnanushthana.ts
```

| Quantity | Book | Nadi, assumptions above |
| --- | --- | --- |
| Ascendant | Taurus 17°32′ | Taurus 17°32′30″ |
| Sun | Libra 25°09′ | Libra 25°09′37″ |
| Moon | Aquarius 10°55′ | Aquarius 10°55′27″ |
| Mandi / Gulika | Leo 4°44′ | Existing calculation: Leo 16°01′54″; Kerala-constant research method: Leo 11°26′26″ |

The ascendant, Sun and Moon are close under these assumptions; neither Gulika calculation reproduces the example. Friday-night constant 18 / 30 places the research rising instant around 01:23:14 IST on 12 November, using the specified sunrise definition. The remaining approximately 6°42′ discrepancy needs investigation against the original example, its stated settings, and any corrections before changing production. Sunrise convention, rounding, location and ayanamsa may matter, but the cause has not been established. The question's published outcome is attributed to an astrological source; it has not been independently corroborated here. This is not a predictive or historical-outcome validation.

Chapter 13 (extract pp. 279–281) also gives a marriage question for 11 December 2008, 08:25 IST, 15°50′ N, 78°03′ E, with Aquarius Arudha. Under Lahiri, the question ascendant reproduces the book's Sagittarius 20° to within an arcminute. Its stated sunrise, day length, and Thursday 6/30 constant give a Yama Shukra rising time of 08:51:41.6 and a sidereal ascendant of Sagittarius 26°29′42″, instead of its printed Sagittarius 24°53′. Even using the book's stated sunrise and day length leaves a difference of about 1°37′. The diagram and OCR warrant checking against the original edition. The example asserts a judgment; it does not provide independently verified outcomes. Yama Shukra and the marriage rule are not implemented on that basis.

## Natal condition relevant to earlier rectification discussions

Chapter 15, verse 22 (extract p. 355) describes circumstances in which a malefic may give beneficial results: strength, occupation of benefic planets' vargas, **and** aspects from benefics themselves in benefic vargas. It also describes the opposite possibility for a weak benefic. This supports testing qualified divisional context rather than treating an adverse D1 indication alone as conclusive. It does not establish that any one favourable division automatically overturns every D1 condition, and it does not by itself validate a rectification gate.

Verse 23 and the translator's accompanying notes discuss relations between a house and the ascendant as well as periods and transits. The translator describes a broader set of possible connections than the verse's short formulation; neither has been added as a universal mandatory event gate. These source-specific interpretations need operational definitions and prospective or held-out event testing before they affect natal readings or scores.

## Boundaries and next useful evidence

The new reference is a related tradition, not interchangeable with every *Prasna Marga* rule. Keep each rule's frame, source, method and uncertainty explicit. The extraction contains claims about illness, longevity and other sensitive outcomes; no new such predictions have been added. Before adding the Arudha-navamsa grid, obtain the missing diagram or another independently checkable edition. Before evaluating real horary performance, collect prospectively recorded questions with actual question time and place, the Arudha and heap procedure, and independently verifiable outcomes; natal-only published cases cannot test that procedure.
