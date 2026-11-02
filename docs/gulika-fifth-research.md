# Fifth-house Kerala Gulika: placement-first case review

This exploratory follow-up checks the isolated fifth-house statement against publicly documented
family histories. It does **not** validate a full birth-chart interpretation, a horary judgment,
the numerical accuracy of a birth record, or a birth-time rectification method.

## What the text actually says

B.V. Raman's translation of [Prasna Marga, volume I, chapter 14.67–70](https://pdfcoffee.com/prasna-marga-pdf-free.html),
page 186, associates Gulika in the fifth with being “deprived of issues” (offspring), as well as
disrespect for elders and teachers. A literal, unqualified reading means absence of children; it
does not specify infertility, loss, delay, or a reason. We are not testing the separate statement
about elders. The previous app text obscured the exact offspring claim; the revised practitioner
text identifies it but does not present it as a prediction established by that placement.

The book is a work of horary astrology, even though it also discusses birth horoscopes. Its
[volume II, 19.68](https://studyres.com/doc/6415459/prasnamarga-ii---saptarishis-astrology)
discusses other childbearing combinations; the accompanying notes explicitly use positions in
the *prasna* chart and treat Jupiter trine Gulika as one favourable factor. Its verse and notes
also differ in their wording of another longitudes sum. These are reasons to distinguish an
individual line from the book's complete procedure; they do not establish that a birth-chart
Jupiter condition automatically cancels 14.67–70. No actual question chart was tested here.

## Frozen screen and assumptions

The [discovery protocol](gulika-fifth-discovery-protocol.md) specifies eligibility, deterministic
selection and the literal hypothesis. From Astro-Databank's [C-name sample](https://www.astro.com/adbexport/),
revision 19 September 2026, 1,735 entries met the stated input criteria, 85 had nominal fifth-house
Kerala Gulika, and 75 retained the fifth house and day/night interval at ±5 minutes. From these,
the first 20 by fixed hash order, with at most four per country, were fixed **before** the family
outcomes below were sought. This is a placement-first exploratory screen, not a blinded or
independently preregistered trial. The list and public inputs are in
[discovery screen](gulika-fifth-discovery-screen.json).

All calculations use the source's local civil time and fixed offset, Lahiri ayanamsa, apparent
upper-limb sunrise, Kerala weekday constants and whole-sign houses. The case-specific birth
links below are reports of certificates or Gauquelin records, not certificates we independently
examined. AA indicates Astro-Databank's source rating; it does not ensure exact minutes. The
independently sourced family histories are observational records, not measures of fertility.

The [generated calculations](gulika-fifth-discovery-results.json) include all 20, the other four
Gulika conventions and ±15/±5 minute samples. For the eight cases below, each of the 31 whole-minute
samples from −15 to +15 minutes stays in the fifth and the same day/night interval. At the
nominal time, all eight remain in the fifth under each of four sunrise definitions and both
Lahiri and Raman ayanamsas. This tests samples and settings, not an unknown true birth time.
Reproduce with `node --import tsx scripts/eval-gulika-fifth-discovery.ts`.

## Assessed cases

| Person; reported birth | Birth source | Ascendant; Kerala Gulika | Independent family source and comparison |
| --- | --- | --- | --- |
| Witold Conti; Berlin, 2 Feb 1908 09:30 UTC+1 | [Astro-Databank](https://www.astro.com/astro-databank/Conti%2C_Witold), reports certificate on file | Pisces; Cancer 8.20° | [Polish film biography](https://www.filmweb.pl/person/Witold%2BConti-83840/biography) records a son. Contradicts literal absence. |
| Ray Crowe; Indiana, 30 May 1915 06:00 UTC−6 | [Astro-Databank](https://www.astro.com/astro-databank/Crowe%2C_Ray), reports certificate | Gemini; Libra 23.22° | [Obituary](https://www.legacy.com/us/obituaries/legacyremembers/ray-crowe-obituary?id=18516772) names four children. Contradicts literal absence. |
| Guy Camberabero; Saubion, 17 May 1936 08:00 UTC+1 | [Open Gauquelin](https://opengauquelin.org/group/ertel-9-second-european) lists time and place; [Astro-Databank](https://www.astro.com/astro-databank/Camberabero%2C_Guy) catalogued AA | Gemini; Libra 12.06° | [Rugby profile of Didier](https://finalesrugby.fr/personnes/camberabero-didier) identifies him as Guy's son. Contradicts literal absence. These birth listings may share Gauquelin source lineage. |
| Celia Cruz; Havana, 21 Oct 1925 21:00 UTC−5 | [Astro-Databank](https://www.astro.com/astro-databank/Cruz%2C_Celia), reports certificate registered in 1961 | Taurus; Virgo 12.03° | [Telemundo](https://www.telemundo.com/shows/un-nuevo-dia/familia/celia-cruz-su-familia-el-exito-de-su-gran-amor-y-por-que-no-tuvo-hijos-tmna3339483) reports no biological children; her husband had children from earlier relationships. Consistent with the narrower biological-offspring reading, subject to the date issue below. |
| Bobby Clancy; Carrick-on-Suir, 11 May 1927 23:30 UTC+1 | [Astro-Databank](https://www.astro.com/astro-databank/Clancy%2C_Bobby), reports certificate | Scorpio; Pisces 18.77° | [His daughter Aoife's biography](https://www.aoifeclancy.com/about) identifies Bobby as her father. Contradicts literal absence. |
| Cachimbal, Juan Guillermo Brenes Castillo; Cartago, 13 Apr 1924 08:20 UTC−6 | [Astro-Databank](https://www.astro.com/astro-databank/Cachimbal), quotes certificate | Taurus; Virgo 6.94° | [La Nación obituary](https://www.nacion.com/archivo/cachimbal-murio-anoche-en-cervantes-de-alvarado/PAMZ5LNFFFARRCUNGWZ55L2EHA/story/) names three children. Contradicts literal absence. |
| Nicole Calfan; Neuilly-sur-Seine, 4 Mar 1947 08:15 UTC+1 | [Astro-Databank](https://www.astro.com/astro-databank/Calfan%2C_Nicole), Gauquelin collection | Pisces; Cancer 2.35° | In [an interview](https://lequotidien.lu/culture/nicole-calfan-marraine-du-festival-du-film-damour-de-mons/), she speaks of raising her two sons. Contradicts literal absence. |
| Mercedes Cabanillas; Bellavista, 22 May 1947 19:00 UTC−5 | [Astro-Databank](https://www.astro.com/astro-databank/Cabanillas%2C_Mercedes), reports certificate | Scorpio; Pisces 19.78° | Her [statement hosted by the Peruvian Congress](https://www2.congreso.gob.pe/Sicr/ApoyComisiones/informes.nsf/fae19ad9f65c7e59052577fa0051368c/c5fb1f7836427fb1052578d400735090/%24FILE/LA%20VERDAD%20SOBRE%20BAGUA-fin.pdf) refers to her children. Contradicts literal absence. |

For Cruz, [her estate](https://celiacruz.com/celia-cruz-makes-history-once-more/) also gives 1925,
but [Fania Records](https://fania.com/record/cuba-y-puerto-rico/) gives 1924. If the same time and offset are *hypothetically* applied to
21 October 1924, Nadi gives Taurus rising and Kerala Gulika in Aries, the 12th, not the fifth.
The time is not independently established for that alternate year. Thus the 1925 result is
reported with a significant birth-year qualification; it must not be counted as an unambiguous
confirmation. For Cachimbal, other sources specify Cervantes in Cartago province; recomputing
at Cervantes rather than the listed Cartago city coordinates still gives Taurus rising and Virgo
Gulika in the fifth at the reported time. Different Gulika methods can change the result: for
example Clancy's Saturn-portion start gives fourth, midpoint fifth and Poddar's printed table
sixth. These are comparisons, not evidence that the text meant one of those conventions.

## Audit of the app's existing D1 and D7 children checks

At the reported birth times, the generated results also run the existing Parashari
`parashariVargaEvidence` and `parashariPromiseNatal` checks. This is a retrospective descriptive
audit, not a predeclared test of a combined Gulika rule. These checks use a limited BPHS-based D1
house assessment and an app-selected D7 fifth-house subset, and are **different** from the
Prasna Marga question-chart combinations in 19.68. A “none listed” result means only that this
subset produced no supporting indicator; it is not a denial or a complete judgment.

| Case | Family observation | D1 support listed | D7 support listed |
| --- | --- | --- | --- |
| Witold Conti | Parent | Jupiter in fifth | None |
| Ray Crowe | Parent | Venus aspects fifth | None |
| Guy Camberabero | Parent | Venus aspects fifth | None |
| Celia Cruz | No biological children reported; 1925 conditional | None | Venus in fifth; Jupiter aspects fifth |
| Bobby Clancy | Parent | Jupiter in fifth; Moon aspects fifth | None |
| Cachimbal | Parent | None | None |
| Nicole Calfan | Parent | Moon in fifth; Jupiter and Venus aspect fifth | Moon in fifth |
| Mercedes Cabanillas | Parent | None | Moon aspects fifth |

The app also lists contrary D1 factors for several cases, recorded in the generated JSON.
The cited D1/D7 rules do not authorize declaring that any of these indicators automatically
overrules the Gulika claim. The observed parent with no listed D1 or D7 support and the
conditional non-parent case with listed D7 support also prevent treating these partial checks
as a reliable yes/no classifier. Earlier results and source limitations remain applicable.

## Every fixed-list outcome

The seven parent cases above contradict the literal standalone no-offspring claim at their
reported births under the stated conventions. Cruz is a conditional match to the narrower
biological claim, with the significant birth-year uncertainty just described. A case with a
documented child is a counterexample to the unqualified statement; it does not disprove a more
complex rule that explicitly combines other factors. Eleven additional cases remain unresolved
because this limited search did not establish their family histories to the required standard;
they must not be assumed to have no children. A twelfth, Vittoria Crispo, is unresolved because
[Astro-Databank](https://www.astro.com/astro-databank/Crispo%2C_Vittoria) gives 1905 while
[a film source](https://www.mymovies.it/persone/vittoria-crispo/30824/) gives 1900. Both the
birth year and family outcome require further investigation.

| Fixed-list member | Outcome status |
| --- | --- |
| Witold Conti | Parent, counterexample |
| Ray Crowe | Parent, counterexample |
| Vittoria Crispo | Birth year and family outcome unresolved |
| Del M. Clawson | Family outcome unresolved |
| Guy Camberabero | Parent, counterexample |
| Richard Cunningham | Family outcome unresolved |
| Celia Cruz | No biological children reported; match conditional on disputed 1925 birth year |
| Luis Cernuda | Family outcome unresolved |
| Giorgio Comaschi | Family outcome unresolved |
| José Manuel Cabanillas | Family outcome unresolved; −15 minutes crosses sunrise and the calculated house changes |
| Bobby Clancy | Parent, counterexample |
| Luigi Colaussi | Family outcome unresolved |
| Guido Caroselli | Family outcome unresolved |
| Cyril Collard | Family outcome unresolved |
| Cachimbal | Parent, counterexample |
| Gilles Colpart | Family outcome unresolved |
| Nicole Calfan | Parent, counterexample |
| Mercedes Cabanillas | Parent, counterexample |
| José Antonio Chang Escobedo | Family outcome unresolved |
| Walter Campbell | Family outcome unresolved |

**Interpretation:** even multiple counterexamples are sufficient to reject an absolute standalone
rule in this sample. The 7-to-1 assessed count is not a predicted probability, sensitivity,
specificity or measure of general accuracy. This is a C-name convenience sample with selective
public biographies, incomplete outcomes, uncertain or possibly rounded birth times, and no
control group without the placement. A convincing test of a *combined* interpretation would
specify its exact combinations and decision rule first, then use an independently selected set
with reliably verified outcomes and an appropriate comparison group. None of these cases tests
a specific event date, and none demonstrates that Gulika can select a birth time.
