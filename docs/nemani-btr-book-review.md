# Review of Nemani's birth-time rectification book

Source: Dr. Nemani Venkata Raghunatha Rao, *Birth Time Rectification Methods*, volume 1, supplied Kindle edition. Kindle locations below identify the supplied edition; the book is not copied into this repository. The methods and examples are practitioner assertions, not independent evidence that a rectified time is accurate.

## What it contributes

| Method | Book location | Relationship to Nadi |
|---|---|---|
| Kunda | Ch. 1, about locations 66–145 | The natal application multiplies the sidereal ascendant by 81, reduces it to a circle, and compares its nakshatra with the Moon's birth nakshatra and its two trines. This matches the existing `kunda-d81` calculation; Raman's distinct worked arithmetic remains separately named. The author describes the natal use as an extension of the cited Prasna rule. |
| Pranapada | Ch. 2, about locations 155–205 | The chapter calculates a sunrise-based point using the Sun and asks whether its D9 placement is a trine or seventh from the Moon in D9. Its introduction also mentions a separate relationship to the natal ascendant. Nadi does not yet implement this rectification check. |
| Cosmic planetary vibrations | Ch. 3, about locations 210–275 | A name-number scheme is compared with the Moon and ascendant rulers or their star-ruler dispositors. It is a coarse sign or star check, not a dated-event method. Spelling and transliteration choices must be made explicit before it could be meaningfully evaluated. |
| KP ruling Moon | Ch. 4, about locations 305–443 | The candidate ascendant's sign, star and sub lords are compared to the judgment Moon's corresponding lords. The example connections use the judgment chart for both planets. A separate experimental `kp-nemani-rp` implementation now records the links and requires all three; it does not change the earlier Parashari scores. |

The introductory discussion recommends D1, divisional charts and dated life events, but does not specify a complete event-specific marriage, childbirth or career scoring algorithm. It therefore does not justify changing the frozen Parashari version-2 weights or calling that ranking validated.

## KP implementation and example checks

Nadi's prior `kp-rp` score includes a Dutta-inspired mixed-chart link: it looks up the candidate ascendant lord's position in the natal chart and the corresponding judgment Moon lord's position at judgment. That is not the all-judgment-chart method described in Nemani's chapter. The interface now identifies the earlier check as a mixed-chart interpretation instead of presenting it as equivalent to the book. Its historical score is unchanged.

The new check uses equality, or a direct star/sub connection, or a directional two-step star/sub chain in either direction, with **both** planets and the intermediate planet located in the judgment chart. The two-step interpretation is grounded in the author's worked chains. It does not infer a sign-only link, an arbitrary longer chain, or a common third-party ruler. Those choices matter because broader interpretations can create more ties. A candidate is shown as a match only when all three levels link; the binary indicator is not a probability or a judgment that the time is correct.

As a **calculation check**, the supplied first KP example's stated judgment instant (September 9, 2007, 21:35:22 at UTC−05:00) reproduces the book's Moon lords and all three links using its reported ascendant lords. The book's third example reproduces its negative star-level result. These examples were selected by the author and are not a blind or independent accuracy test. The application uses the real moment and location of judgment; the published example instants are used only in the automated calculation tests.

Exporting a displayed scan preserves its judgment instant when the server rebuilds the report. If a report is requested before a scan, it uses the moment of export. A subsequent new scan takes a new judgment moment and may produce different links.

## Kunda arithmetic checks and limitations

The first worked example's reported JHora ascendant longitudes reproduce its Kunda positions and change from a nonmatch to a match in Nadi. The book also contains worked values that need care:

- In the Indira Gandhi example, the printed Kunda longitude 148.05° is labelled Purva Phalguni, but 148.05° lies in Uttara Phalguni. The birth star and trines listed in that same example include Uttara Phalguni. Taking the stated ascendant degrees, minutes and seconds at face value and multiplying without premature rounding also lands in Uttara Phalguni. Thus the stated reported-time calculation already satisfies the book's own listed Kunda condition; its proposed correction cannot be treated as verified by that example.
- In the Sanjay Gandhi example, the printed 40.95° longitude is labelled Krittika, although 40.95° lies in Rohini. Both are outside the example's listed accepted stars, so this label discrepancy does not by itself change that example's match/nonmatch conclusion.
- The introduction and detailed chapters use different shorthand for star counting. Nadi's implementation follows the actual birth-star-and-trine set demonstrated by the examples, not an ambiguous ordinal alone.

Multiplying by 81 magnifies small differences in the ascendant and in ayanamsa or time conventions. The supplied book says it uses True Lahiri/Chitra-Paksha; Nadi's `lahiri` setting uses Swiss Ephemeris Lahiri and is not represented as an exact reproduction of that stated setup. The book's second-level time suggestions and its selected charts are not ground truth. In Nadi's earlier seven-person engineering pilot, none of the exact intervals containing the reported time met the D81 condition, while matching intervals occupied around 10.6–11.8% of each scanned window. That small retrospective sample is not a population test or evidence that a reported time is wrong.

Pranapada is promising as a separate future comparison, but needs a fixed sunrise definition, ayanamsa, D9 convention and independent case protocol. Its rapidly changing position can produce several short matching intervals in a wider window; short intervals alone do not establish seconds-level accuracy. A later study should report all matching intervals and their combined coverage, as well as source uncertainty and nonmatching cases.
