# House and dispositor context: first implementation

This change separates descriptive chart geometry from school-specific readings. A sign lord, star lord and D9 sign lord are distinct relationships; the D9 sign and a star quarter describe the same 3°20′ interval and must not be treated as independent confirmations. A KP sub-lord is a different, unequal subdivision.

## Calculation and sources

- The lord-distance supplement from Shweta's *Decoding the Bhavas*, vol. 2, §§2.2–2.3, now counts signs from the sign used for a house to its lord's actual sign. It separately retains the distance between selected bhavas. Under Sripati or equal houses the sign used for the house is the midpoint sign; applying this modern sign reading to that construction is provisional. Equal counts for §2.2 are compared with the house sign's count from the lagna sign. The supplement still adds no event points.
- [BPHS 11.14–16](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf) lists an absent lord aspect among concerns; it does not explicitly state the converse as a separate favourable rule. [Phaladeepika 15.1, Sastri translation](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621587.html) includes the house lord's aspect as one favourable condition even for a malefic lord, with additional conditions. Nadi displays that aspect as a provisional partial clue, without claiming the entire verse is satisfied, changing the BPHS tone, adding points, or asserting an event promise.
- [Brihat Jataka 10.1–3](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501718.html) supplies a specific tenth-lord → D9 sign → D9 lord chain for livelihood. Its existing evaluator obtains that geometry from the shared planet context. A prior claim that Aiyar requires an empty tenth house was incorrect: [his chapter X translation](https://chestofbooks.com/new-age/astrology/Brihat-Jataka/Chapter-X-On-Avocation.html) reads all three chains without that prerequisite. The app still records empty classical-planet occupancy as a separate fact; it does not gate this reading.
- Whole-sign houses have nine complete star quarters. Sripati and equal bhavas use the calculated sandhi endpoints; KP Placidus houses use the KP frame's cusps. Each house is intersected with the actual quarters, including partial intervals and the 0° boundary. The generic explorer does not infer a prediction or change a school score.

The ordinary Parashari house evidence, including the partial aspect clue, is reused as contextual evidence in eligible dated readings, validation, rectification and comparison-date examples. It is not a universal event rule. Other existing school evaluators retain their own sources and frames; new interpretations must be qualified and wired independently before they can affect an event calculation.

## Fresh public cases and reproducibility

The preselected engineering fixture is [`scripts/fixtures/core-framework-fresh.json`](../scripts/fixtures/core-framework-fresh.json). It covers Karin Herrera (Guatemala), Elis Regina (Brazil), Buzz Aldrin (US) and Alain Trautmann (France), from different professional backgrounds. Astro-Databank reports birth records rated AA; the original certificates were not reviewed and several clocks are rounded. Tropical Sun and Moon positions agreed with the cited rounded published values to within 0.60 arcminutes. This is a cross-check of input and calculation, not independent verification of a birth time.

In the three house constructions, three of the four charts had at least one sign-count/bhava-count difference under Sripati or equal; none differed under whole signs. The livelihood chain agreed with the shared D9 facts in all four charts. For the two charts with dated events, the ordinary natal evidence matched a selected-date reading and the replayed comparison-date example; each baseline ran 200 trials. A one-minute Elis Regina rectification also matched the candidate's cast chart and the corresponding validation, including an event whose fifth-house aspect clue is present. The random dates are not verified non-events.

The first execution exposed that validation needs at least two events spanning a year before it produces random-date comparisons. A second sourced event was then added for each of the two eligible cases without selecting on the outcome. Herrera's marriage date comes from Astro-Databank's report of a certificate margin, not an independently inspected second source; her inauguration time is unknown. Maria Rita's reported 6 p.m. birth time is speculative and is not used. The other two cases have no dated-event test here.

```sh
node --import tsx scripts/eval-core-framework-fresh.ts
node --import tsx --test scripts/core-framework.test.ts scripts/nakshatra-context.test.ts scripts/parashari-house-prose.test.ts
```

These checks establish calculation and pathway consistency. They do not measure whether the partial aspect clue or the shared context predicts events, discriminate birth times, or generalize to a population.
