# Sarvartha, transit presentation and source follow-up

This reviews the supplied audit of `8ac60d4` against the current implementation, including the J.N. Bhasin translation of *Sarvarth Chintamani* (Sagar Publications, 1986; 2020 reprint) supplied by the user. The audit's rectification findings were subsequently addressed in `952be10`; this review does not treat the older commit as the current state.

## The nineteen reported predicates

A key is `house.stanza`; the printed chapter is in the catalogue. Corrections affect `computeSarvartha`, its ordinary chart and report findings, and the Sarvartha voice in cross-school agreement. The event and rectification score engines do not consume this Sarvartha catalogue; this change does not claim score parity with it.

| Key | Treatment | Reason |
| --- | --- | --- |
| 2.15 | Reference only | The predicate omitted exaltation, aspect alternatives, and the lagna lord's weakness and affliction. |
| 2.88 | Reference only | Both the Vaisheshikamsha and the D60 condition were absent. |
| 2.121 | Corrected | Require the second lord in an angle with both Venus and Moon. The conjunction test treats the ruler and its companions as distinct bodies. |
| 2.149 | Reference only | Two distinct Saturn and Rahu/Gulika alternatives had been collapsed into either planet alone; Gulika was not tested. |
| 3.2 | Reference only | The wrong lord was tested and the Mars/aspect clauses omitted; the resulting family-harm assertion should not be made from a partial test. |
| 3.24 | Reference only | Different lord identities are not planetary friendship; the catalogue combines friend and enemy outcomes. |
| 4.57 | Reference only | The app tested the fourth lord rather than the relevant divisional dispositors. Bhasin's translation instructs the reader to find the lord of the fourth lord's navamsa, then the lord of the sign occupied by that planet. The online [verse 4.57](https://vedicpupil.in/library/books/sarvartha-chintamani/chapter-4) has a different wording. The precise angular condition requires further interpretation; a single-dispositor shortcut would be premature. |
| 4.75 | Corrected against the supplied edition | Bhasin's translation says that the fourth is movable and its **lord is Mars**, the significator of built-up property. This is not a requirement that Mars occupy the fourth, as proposed in the audit. The app uses whole signs; of the twelve ascendants this condition selects Capricorn rising. It is a traditional textual indication, not evidence of property ownership. |
| 4.110 | Reference only | The lagna-lord, weakness and watery-planet clauses were absent; an unqualified death assertion is not appropriate. |
| 4.135 | Reference only | Absence of a benefic occupant is not a benefic aspect, and a mother's longevity is not established by this placement. |
| 4.148 | Reference only | Conjunction is not mutual friendship and the benefic association/aspect conditions were missing. |
| 6.9 | Reference only | The lagna lord's association was missing and the catalogue combines several planet-specific health alternatives. |
| 6.12 | Reference only | The duplicate seventh-lord clause omitted Venus. The source's categorical fertility claim is not appropriate as an automatic determination. |
| 6.13 | Reference only | Both the lagna lord and Saturn were omitted from the imprisonment combination. |
| 7.12 | Reference only | The predicate used the seventh lord's dignity instead of the stated Venus/Moon alternatives. An automated assertion about a spouse's death is not appropriate. |
| 7.73 | Reference only | Different houses are not planetary enmity; the catalogue combines friendly and inimical alternatives. |
| 8.17 | Reference only | The actual kendra, aspect and weak-lagna conditions were missing; the old test made an unqualified lifespan assertion. |
| 10.30 | Corrected | Require the sixth lord in the tenth and the tenth lord with Saturn in an angle or trine, as stated in Bhasin 8.30. |
| 12.13 | Corrected, provisional | Recognize conjunction or aspect from either the ninth lord or the Sun. The app's sign-based aspect model is an implementation convention, and the source's father-related interpretation is not an established outcome. |

A reference-only entry is **not tested**, not a failed condition. Reference entries are paraphrases and are labelled accordingly in the chart. These 19 do not constitute a complete audit of the remaining catalogue, source translations, or the validity of its interpretations.

### Follow-up beyond the nineteen

A further catalogue-to-code sweep found **88 additional active predicates** with apparent omitted clauses, incompatible meanings or multiple source outcomes combined in one result. These are listed by key in `SC_PENDING_SOURCE_REVIEW` and suspended from automatic findings and agreement pending a passage-by-passage source review. This does not assert that all 88 catalogue paraphrases are correct, or that every suspended predicate is wrong under every translation. For example, `5.58` compared the lords' houses rather than their friendship; `7.13` could print both a serious spouse-harm alternative and a separate one-wife alternative from a test of the latter alone; and `8.15` omitted the stated lagna-lord conditions. Several other entries need divisional or aspect rules that the old tests did not supply.

Two further conditions were clear in the supplied Bhasin edition and have been corrected: 8.16 (key `10.16`) requires the tenth lord in an angle as well as the Sun and Mars in the tenth; 8.27 (key `12.27`) requires Jupiter, Venus and Mercury **all** in the twelfth. Tests exercise each missing planet or condition. Together with the nineteen-key changes and the 88 temporary holds, the sample chart's computable house-rule count falls from 167 to 64. This is a substantial coverage reduction, not a completed source audit; additional careful reconstruction is needed before the held rules can be restored.

For 3.36 (key `2.36`) and other existing alternatives where an abandoned branch could leak an unrelated position or dignity, the alternatives are now represented as separate branches. The explanation traces a complete passing branch; a fact encountered in an abandoned conjunction no longer appears as part of the successful alternative. This explicit branch representation is required when future multi-clause alternatives are added; it is not a general symbolic proof system for arbitrary expressions.

## Fresh chart checks

The four independently selected public charts in [the fixture](../scripts/fixtures/sarvartha-audit-fresh.json) cover Vienna, São Paulo, Port Harcourt and Mumbai. The time sources include one quoted birth record and three reports from memory; Lamarr's birth year is disputed. The public sample's findings among these 19 keys changed from 14 to 4 after correction: 4→0, 3→2, 3→1 and 4→1 in fixture order. The new matches for Senna include 4.75 and 12.13; the new 12.13 conjunction/aspect alternatives appear in other charts too. These counts are rule-firing comparisons, not tests of a property or father-related prediction, and they must not be interpreted as evidence of predictive accuracy.

Synthetic truth-table tests exercise each corrected rule, rejected missing clauses, all twelve rising signs for 4.75, and the incomplete-branch explanation. Separate tests cover multiple transit obstructors, the two Venus tables, reverse Vedha, provisional display and the pre-birth date. The user's seven candidate times were run locally, but the private chart and its results are not included in the repository. These findings do not choose between those times.

## Source and presentation details

- Rao, *Vedic Astrology: An Integrated Approach*: first published 2001, Sagar reprint 2004; [publication page and relevant sections](https://storage.yandexcloud.net/j108/library/rptviqw0/P.V.R._Narasimha_Rao_-_Vedic_Astrology_-_An_Integrated_Approach.pdf).
- The navamsa sign sequence is given in [BPHS 6.12](https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-6). The quarter identity follows mathematically from the two equal 3°20′ grids, rather than being a separate prediction.
- The order and year table in this chapter numbering appear in [BPHS 46.12–16](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf); 62.1 and 63.1 address later subdivisions. Nadi's 365.25-day elapsed year is an app convention, not a year length asserted in those verses.
- ALP one-to-three-dot weights are app choices. The original text's transit tone and Vedha/Vipareeta Vedha are presented separately: colour reflects the source passage, while card badges show all qualifying obstructors. They do not alter event scores.
- A pre-birth dasa start retains its exact UTC instant for calculation; the reading shows its UTC date. The partial D1-to-division funnel is labelled experimental as well as diagnostic in the app, rule book and reports.
