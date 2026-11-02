# Nakshatra and pada: evaluation

Run `node --import tsx scripts/eval-nakshatra-context-fresh.ts` from the
repository root. Inputs, provenance and the distinction between preselected and
targeted cases are in the two fixture files and
[protocol](nakshatra-context-protocol.md). Birth-clock values come from
Astro-Databank; original certificates were not examined. Several clocks are
rounded. These checks test implementation and consistency, not whether an
astrological interpretation predicts events.

All ten public charts' reconstructed tropical Sun and Moon agree with the
published minute-rounded values to within 0.74 arcminutes. This comparison
checks the adopted instant and ephemeris against an external publication; it
does not independently certify the birth clock or the interpretation.

The first seven profiles were selected before examining the new solar-quarter
results and none had a planet affected by the correction. Two initial captures
used local mean time by mistake; the corrected explicit offsets and the
reconstructed old rule are documented in the protocol. Three additional
profiles were deliberately selected because a planet was within 3°20′ of the
Sun but across a quarter boundary. They are diagnostic examples, not a
representative or held-out sample:

| Published chart | Corrected BNN flag | Reconstructed old vs current natal BNN reading |
| --- | --- | --- |
| [Jamie Lee Curtis](https://www.astro.com/astro-databank/Curtis%2C_Jamie_Lee) | Venus no longer meets the same-quarter test | No finding added, removed or rescored; the pre-existing cancellation also mattered. |
| [Henri Cartier-Bresson](https://www.astro.com/astro-databank/Cartier-Bresson%2C_Henri) | Mercury no longer meets it | One Mercury-combust finding removed; five retained findings rescored. |
| [Gerald Carr](https://www.astro.com/astro-databank/Carr%2C_Gerald) | Jupiter no longer meets it | No finding added, removed or rescored; other conditions already modified it. |

The old results above are reconstructed by applying the former angular-distance
flag to the same positions and evaluator. They are not evidence that the new
interpretation better describes the person. Naik's source supports the
same-pada condition; excluding the Sun and nodes remains an app convention,
not a claim that the source resolves node treatment.

For independently reported events, the chosen-date and Validate paths agree
on the BNN and ordinary-school natal evidence for [Adriana Lima's 2009
wedding](https://peopleenespanol.com/article/adriana-lima-se-caso-en-secreto/)
and [2012 birth](https://www.usmagazine.com/celebrity-moms/news/adriana-lima-gives-birth-to-daughter-sienna-2012129/),
[Ashley Judd's 2001 wedding](https://www.chron.com/culture/main/article/judd-weds-racing-star-in-scotland-castle-2057216.php),
and [Curtis's 1984 wedding](https://www.usmagazine.com/celebrity-news/pictures/jamie-lee-curtis-christopher-guests-relationship-timeline/).
Lima's wedding clock is unknown and uses local noon; her child's 13:00 local
time was reported through a representative. Her two events permit 200
comparison-date sets. Validate and the recorded-time Rectify midpoint agree on
their catalogue comparisons, and their displayed comparison examples replay
with the same natal evidence. Other automated parity tests exercise the full
comparison set. Random dates are not verified non-events, and the two events do
not establish predictive performance.

The geometric regression test exercises all 108 boundaries at the edge and on
both sides, including the zodiac wrap, against the shared chart, D9,
Panchanga, KP-star and ALP point calculations. KP's unequal sub-lord divisions
are not replaced with equal quarters. Classical solar orbs remain separate
from the BNN same-pada rule. The ALP star timeline's sign at a midpoint exactly
on a sign boundary is now the following sign; the visible timeline already
lists both signs for a star spanning a boundary.
