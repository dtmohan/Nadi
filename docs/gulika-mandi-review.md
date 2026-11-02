# Gulika / Mandi calculation and reading review

## What can be resolved

The previous implementation calculated one provisional Saturn-portion point and called it
Gulika / Mandi. Its night formula incorrectly cycled through eight planetary lords, including
Rahu. In the sources below, the relevant lords are the seven weekday lords; an eighth portion is
unruled. At night the sequence starts with the fifth weekday lord, counted inclusively. The
correction changes the selected portion for Wednesday–Saturday nights: the former calculation
had selected the end of the correct Saturn portion instead of its beginning. It leaves the
start on Sunday–Tuesday nights unchanged.

There is not one universally agreed longitude behind the two names. The application now
computes and labels these conventions from a common day/night interval, location, sunrise
definition and ayanamsa:

| Method | Formula for rising instant | Source and scope |
| --- | --- | --- |
| Kerala weekday constants | Day: sunrise + day duration × `[26,22,18,14,10,6,2] / 30`; night: sunset + night duration × `[10,6,2,26,22,18,14] / 30`. Constants are ordered Sunday through Saturday. | B.V. Raman, [Prasna Marga 5.14–16 notes](https://pdfcoffee.com/prasna-marga-pdf-free.html), and *Prashnanushthana Paddhati* 3.9–10, extraction pp. 54–55. Raman says the Prasna Marga author uses the Mandi method under the name Gulika. This is the Prasna default. |
| Saturn portion start | First lord is weekday lord by day, the fifth weekday lord by night; seven lords cycle until Saturn. Use start of that eighth of the interval. | O.G. Sreenadh, [*Birth Time Rectification*, pp. 14–16](https://argala.ru/pdf-files/Sreenadh_OG_-_Birth_Time_Rectification.pdf), describes this as Gulika and contrasts it with Mandi. He interprets Parashara's wording this way; translators and practitioners differ. |
| Saturn portion midpoint | Use the midpoint of the same seven-lord eighth. | Sarajit Poddar's [worked upagraha example](https://varahamihira.blogspot.com/2008/02/aprakash-grahas-upagrahas-pranapada.html) calls this Mandi in his daytime illustration. |
| Poddar's printed Mandi table | Day: `[26,22,18,14,10,6,2] / 32`; night: `[10,6,2,30,26,22,18] / 32`. | The same [Poddar article](https://varahamihira.blogspot.com/2008/02/aprakash-grahas-upagrahas-pranapada.html) prints these values. By day and Sunday–Tuesday nights they match the midpoint above; Wednesday–Saturday nights are an eighth later. The article does not explain the discrepancy with its stated seven-lord night procedure, so the table is separately reproducible rather than silently treated as that procedure. |
| Saturn portion end | Use the end of the same eighth. | Raman's *Prasna Marga* notes and Poddar's example describe this as Gulika. This is different from Sreenadh's naming. |

The current user's supplied *Prashnanushthana Paddhati* is a related text, not proof that
every author or question chart used the same convention. The comparison options apply the
Prasna house text to alternative points for exploration only; they do not assert that source
intended the alternatives. A birth chart's application of this horary text is likewise an app
interpretation, not a validation of horary practice.

The chosen method drives the Prasna natal house reading, selected snapshot position and
Gulika-dependent natal sphutas. The snapshot is still calculated at the birth location and is
not a separately cast question chart. KP and Parashari event validation, rectification and
Monte Carlo scores do not use these Gulika points; no new scoring or rank was introduced.

## Published calculation checks

These are numerical calculation checks, not independent evidence that a prediction works.
See `scripts/gulika-methods.test.ts` for the inputs and tolerances.

* **John F. Kennedy:** In [Poddar's published example](https://varahamihira.blogspot.com/2008/02/aprakash-grahas-upagrahas-pranapada.html), the stated end-of-portion rising time yields Virgo 10°35′28″. Nadi computes within two arcseconds when supplied that same instant and published coordinates. When Nadi calculates its own sunrise and sunset, the end is about 2½ arcminutes away and the midpoint about 5 arcminutes away from the source, reflecting differing rise/set inputs. The published birth time is an A-rated recollection, not a documented minute-accurate birth record.
* **Delhi Friday night:** A [BPHS translation](https://storage.yandexcloud.net/j108/library/hr6fkynz/Maharishi_Parashara_-_Brihat_Parasara_Hora_Sastra_%28Vol._1%29.pdf), chapter 4 worked chart, prints Scorpio 28°32′06″. The corrected start calculation gives approximately Scorpio 28°45′35″ using an assumed modern Delhi centre, Lahiri and apparent upper-limb sunrise. Its exact coordinates, settings and underlying source details are not stated. The previous eight-lord cycle selects a different portion and sign in this example.
* **Ahmedabad day and night:** [Bhadoriya and Joshi's 26 January 2023 examples](https://saptarishisastrology.com/astrological-study-of-mandi-part-1-by-upendra-singh-bhadoriya-and-bhavini-joshi/) specify rising times of 10:08:30 and 02:30:15. At those instants, Nadi's ascendant is about 6.6 and 1.3 arcminutes, respectively, from the printed values under assumed coordinates and Lahiri. Independently calculated sunrise/sunset increase those differences to about 39 and 12 arcminutes. The sources leave some settings and coordinates unspecified; these are demonstration instants, not independently documented births.
* **1994 question in the supplied book:** The book prints Mandi Leo 4°44′, but the Kerala constants produce Leo 11°26′26″ with upper-limb sunrise. The midpoint gives Leo 4°37′15″ with upper-limb sunrise, or Leo 4°43′45″ if true-centre sunrise is assumed. The latter is roughly 15 arcseconds from the printout, but the book does not state that method or sunrise setting; it is a plausible explanation, not an established reconstruction. Run `node --import tsx scripts/eval-prashnanushthana.ts` for the full comparison.

## Fixed parenthood comparison

The [validation protocol](gulika-mandi-validation-protocol.md) fixes the inputs and criterion,
with outcomes independently sourced. Its first four cases were selected before calculation. A
four-case follow-up and then a five-case follow-up were fixed after previous batches showed no
fifth-house placement. The latter two sets are adaptive, not prospective independent trials. The
published birth records and parenthood outcomes are cited in the protocol; all calculations,
including the other conventions and ±5/±15 minute samples, are in
[the generated results](gulika-mandi-validation-results.json).

| Group | Person | Kerala point, nominal | Whole-sign house | ±15 min samples |
| --- | --- | --- | --- | --- |
| Initial | Nina Simone | Virgo 12°02′ | 9 | 9 throughout |
| Initial | Glenn T. Seaborg | Capricorn 18°07′ | 11 | 11 throughout |
| Initial | Terence Hill | Gemini 29°49′ | 11 | 11 throughout |
| Initial | Chaka Khan | Libra 8°04′ | 1 | 1 throughout |
| Follow-up | France Gall | Scorpio 1°50′ | 3 | 3 throughout |
| Follow-up | Zoë Saldaña | Libra 16°30′ | 4 | 4 throughout |
| Follow-up | Alberto Gironella | Cancer 25°33′ | 4 | 4 throughout |
| Follow-up | Aldo Miyashiro | Gemini 7°34′ | 1 | 1 throughout |
| Final follow-up | Penélope Cruz | Sagittarius 14°07′ | 9 | 10 at −15 min; 9 at other samples |
| Final follow-up | Antonio Banderas | Cancer 7°41′ | 6 | 6 throughout |
| Final follow-up | Ronaldinho | Capricorn 25°24′ | 1 | 1 throughout |
| Final follow-up | Neymar | Leo 6°01′ | 10 | 10 throughout |
| Final follow-up | Sebastián Piñera | Capricorn 18°14′ | 3 | 12 at −15/−5 min; 3 at other samples, across sunrise |

None triggers the fifth-house statement under the fixed assumptions. These thirteen outcomes are
**inconclusive for that statement**; a non-trigger does not count as an accurate prediction.
The parent-selected, non-random and non-blind samples cannot establish sensitivity,
specificity or general predictive value. Time uncertainty, rounding, alternative birth
locations/dates, ayanamsa and sunrise definitions remain relevant. The sample checks no actual
horary question and does not justify using these points in rectification scores.

Prasna Marga 14.67–70 associates the fifth placement with an adverse offspring claim. Nadi now
identifies this as a traditional source claim and says that the placement cannot establish
whether someone has children, instead of presenting childlessness as a fact. A more useful
future check would prospectively assemble independently recorded fifth-house cases and
comparison charts, including non-parents, before examining outcomes and conventions.

The subsequent [placement-first exploratory review](gulika-fifth-research.md) fixes a list of
fifth-house cases before looking up family outcomes and finds documented counterexamples. It
does not include a matched control group or establish accuracy for a full horary judgment.
