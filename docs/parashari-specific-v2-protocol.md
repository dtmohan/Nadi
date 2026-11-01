# Parashari event-specific experiment, version 2

This protocol and the case manifest were written before the version 2 case scores were run. Version 1 remains available and is not redefined. The sources provide interpretive rules, not the six-point score below: equal points, whole-sign operationalisation and strict subsets are Nadi's choices. This is an exploratory match count, not a probability, full promise judgment or validated method of determining birth time. Do not tune this version on the new cases and report them as an independent evaluation.

## Scope and common assumptions

Use the selected ayanamsa and node type, whole-sign D1/D7/D9/D10 placements, conjunction by same sign, and full Parashari planetary sign aspects. Nodes may occupy or conjoin a sign, but do not cast aspects in this convention. Consider only ordinary marriage, childbirth and a new job or promotion; omit explicitly mixed/unfavourable outcomes and pre-birth events. No adverse indication means a marriage or child is impossible. No choice is conditioned on the case's identity, gender, reported time, or observed results. The event's supplied time and zone are used; otherwise use noon and the birth zone, as documented in the fixture.

Every eligible event contributes six Boolean matches, each weighted one by the app. The first two are the same partial checks as version 1: (1) any D1 support under the existing partial BPHS 11.14–16 house judgment, and (2) a natural-benefic occupant or full aspect to the relevant divisional matter house, or that house lord in its own/exaltation sign. D1 strain and divisional debilitation remain visible. Applying the D1-style house test to a division and treating any single favourable condition as one match are app conventions, not comprehensive promise rules. Natural-benefic status is based on the natal D1 chart. D9 house 7, D7 house 5 and D10 house 10 are used respectively. These two factors describe house condition, not whether an event is possible.

### Marriage: D1/D9 and a distinct transit point

Source: [K.N. Rao-guided *Astrology and Timing of Marriage*, chapter 2, pp. 13–15](https://www.scribd.com/document/1022561037/Kn-Rao-Astrology-and-Timing-of-Marriage-2008). The book's wider parameter considers both lagnas, 7th houses, their lords and associated planets in D1/D9, alongside other dasha and transit parameters. The present strict, computable subset does not implement its Chara-dasha parameter or all associated planets.

3–4. For each of the natal Moon-based Vimshottari maha-dasa and bhukti lords, separately, record direct position/aspect/conjunction (PAC) with the ascendant or seventh house or their lords in **both** D1 and D9. Direct PAC means the period lord is the ascendant/seventh lord, occupies or fully aspects that house, or shares a sign or a full aspect in either direction with the lord. Requiring a direct match in each division is an explicitly strict app interpretation of the source, rather than claiming it exhausts Rao's broader method.

5. At the event instant both transiting Jupiter and Saturn must occupy or fully aspect the **same** D1 target, chosen from the ascendant sign, seventh-house sign, natal ascendant-lord sign or natal seventh-lord sign. This is a narrow sign-based reading of the double transit; different targets do not qualify.

6. Jupiter fully aspects the sign obtained by adding the natal D1 longitudes of the ascendant lord and seventh lord and reducing modulo 360° (the book's Vivah Saham sign). The text states aspect; conjunction alone is not counted. This is a sign-level aspect, not a degree-orb calculation.

### Childbirth: different period and transit rules

Source: [*Astrological Assessment of Timing of Childbirth*, §§2.6.8–2.7, pp. 65–67](https://www.futuresamachar.com/download/astrological-assessment-of-timing-of-childbirth-487.pdf), which reproduces and attributes timing rules to *Phaladeepika*. This is a secondary reproduction of the traditional text; the study is observational and its accuracy claims are not accepted as validated probabilities. The more restrictive 'strongest' planet rule and medical, fertility and sex-of-child claims are not implemented.

3–4. The maha-dasa and bhukti lord, separately, must be one of: natal D1 ascendant lord, seventh lord, fifth lord, Jupiter, a planet occupying D1 house 5, or a planet fully aspecting D1 house 5. This is the source's enumerated possible timing set; no automatic inference of non-occurrence follows from a miss.

5. Identify the D1 fifth lord counted from natal Jupiter. At the event instant, transiting Jupiter is in the same sign as, or a trine sign from, either that planet's natal D1 sign or its natal D9 sign. This is the app's explicit sign-based reading of the cited transit rule.

6. The transiting D1 ascendant lord is in the natal D1 fifth-house sign, in the sign occupied by the natal fifth lord, or in the same sign as the transiting natal fifth lord. This is a **subset** of the source's ascendant-lord transit rule; its own/exaltation alternatives are not included. All transit planets use the event instant and the chart's selected ayanamsa.

### New job or promotion: distinct career timing

Source: [Vishnu Bhaskar, *Advanced Techniques of Predictive Astrology*, vol. 1, ch. 1, pp. 23–24](https://pdfcoffee.com/advanced-techniques-of-predictive-astrology-4-pdf-free.html), profession parameters, timing and promotion. The author's Narayana-dasha method in [P.V.R. Narasimha Rao, *Vedic Astrology: An Integrated Approach*, §18.5](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf) is a different method and is not represented as having been implemented.

3–4. The maha-dasa and bhukti lord, separately, must be the D1 ascendant lord, D1 tenth lord, or a natal planet in its exaltation sign. This is a narrow literal subset of Bhaskar's career timing list; the source's other alternatives are not treated as automatic failures.

5. Both transiting Jupiter and Saturn must each occupy or fully aspect one **same target within the ascendant group** (the D1 ascendant or its lord's natal sign) and one **same target within the career group** (D1 house 10 or its lord's natal sign). The two groups can use different targets. This strict interpretation operationalises the book's 'lagna or lord and 10th or lord' double-transit wording and should not be confused with every practitioner's interpretation.

6. In D10, the natal D1 tenth lord and the D10 ascendant lord are the same planet, share a sign, or fully aspect one another in either direction. This records the cited relationship as a possible indication; it does not claim the source assigns one point to it or that any relationship is favourable.

## Independent fresh-case evaluation

The fixed manifest is `scripts/fixtures/parashari-specific-v2-cases.json`. It consists of nine people absent from the prior public-figure and eight-person holdout fixtures: Sunil Gavaskar, Lionel Messi, Roger Federer, Justin Trudeau, Emmanuel Macron, Serena Williams, Prince William, Jane Goodall and Nicole Kidman. Their sources, event times/zones and disputed/rounded data are in the manifest. All are public figures, several related event dates concern the same family, and the sample is convenience-selected, not representative. Messi's birth certificate time differs from a report of his mother's recollection; Goodall's quoted time is rounded and biographical. Do not count twins twice. Include only a genuinely dated job start or appointment, not an award, rank or election win alone.

For each case, sort distinct event dates and take alternating dates as input and held out. Same-day events stay together. Two-event cases necessarily use one input and one held-out date; explicitly report these weak tests. Scan ±30 minutes around the reported time. To support a paired comparison and score held-out events across the same samples, compute all events per candidate but sum **only input-event** factors for each version's ranking. Held-out evidence is not used for ranking. The splitting boundaries may be finer than an input-only scan, since the same scan contains held-out event transitions. Use actual-time Validate scores at the reported instant, not the midpoint of its containing interval.

Primary diagnostics for each version: (a) duration occupied by tied top-score intervals as percentage of the hour, (b) whether any top interval touches a ±5-minute band around reported time, and (c) recorded-time score's duration-weighted midrank. For held-out events compare the recorded-time score with the duration-weighted mean over **all** top-scoring intervals. Do not select the top candidate nearest the reported time: that would use the answer to break ties. Ties and coarse sampling make these comparisons descriptive, not a birth-time estimate. Report category counts and preserve every case and miss. A category with very few held-out events is not separately validated.

As a descriptive geometry reference, compute the fraction of the scan where a uniformly drawn reference time's ±5-minute band would touch a top interval, using the expanded-and-merged top intervals. Since the scan itself is centred on the reported time this is not an independent population control or a p-value. In addition, for each held-out event at the **recorded birth time**, compare the actual event score to six calendar-date controls at −180, −120, −60, +60, +120 and +180 days. Keep local time and zone; exclude controls before birth and duplicate or actual dates. These controls are deliberately nearby in age but are correlated, need not be plausible event dates, and are not independent samples or calibrated predictive probabilities. Report all failures or excluded controls; neither this contrast nor a held-out score demonstrates that astrology or a birth time is true.

Use the old version on the same fresh cases without changing its rules, then show both methods and their widths side by side. Validate computation and source rule mappings independently with focused tests. If either version performs badly or ties broadly, leave that visible in app documentation and report; no data-driven weight tuning on these cases.
