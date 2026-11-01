# Moon-based gochara: exploratory fresh-case results

The fixed experiment in [the protocol](moon-gochara-protocol.md) found a modest average separation in this small sample, but not enough to establish predictive value or justify adding a gochara gate, weight, or tie-breaker to production scores. The raw event observations, all comparison offsets, score values and file hashes are in [the results](moon-gochara-fresh-results.json); public event/birth citations and uncertainty are in [the fixture](../scripts/fixtures/moon-gochara-fresh.json).

## What was tested

Twelve documented events from eight people: six marriages, five births of children and one job appointment. Each recorded date was compared to 200 reproducibly sampled dates 8–365 days earlier or later, at the same local clock and timezone. The dates are not verified non-events. The primary experimental feature counts Jupiter and Saturn whose full Nadi gochara verdict is favourable. The count and equal weights are research choices; the traditional source does not prescribe them as an event score. The full verdict also contains the app's provisional choices for Ashtakavarga, aspects, vedha, dignity and combustion.

A midrank represents the fraction of comparison dates that scored lower, with tied dates given half credit. Fifty percent is the midpoint of that event's comparison distribution, not a 50% chance of the event or a forecast accuracy. The table gives means of those paired ranks. The right column averages each person's event means so that people with several events do not dominate.

| Measurement | Mean across 12 events | Mean across 8 people |
| --- | ---: | ---: |
| Moon-based full verdict: Jupiter + Saturn | 53.9% | 57.3% |
| Moon-based favourable houses only: Jupiter + Saturn | 51.5% | 51.9% |
| Existing KP period/cusp score | 49.9% | 47.0% |
| Existing KP period/cusp score, with gochara tie-break | 54.3% | 54.0% |
| Existing KP transit score | 58.4% | 54.8% |
| Existing KP transit score, with gochara tie-break | 60.1% | 57.9% |
| Existing Parashari divisional v3 score | 50.9% | 53.5% |
| Existing Parashari divisional v3 score, with gochara tie-break | 54.6% | 59.5% |

The tie-break lifted the rank of four recorded events, lowered three, and left five unchanged for each of the three existing scores. It only resolves ties in an existing score; it is not a proposed additive weight. The full two-planet verdict gave zero favourable planets for eight events, one for four and two for none; 1,819 of 2,400 comparison dates also scored zero. Many distinctions are therefore unavailable. The separate exploratory seven-planet count averaged 54.0% per event and 54.5% per person. None of these small, retrospective differences demonstrates a reliable advantage; multiple secondary comparisons, selection effects, related events and unobserved events on control dates matter.

The production Validate path and the direct research scorers agreed on KP period, KP transit and Parashari v3 numerical results for all 12 events and one independently submitted sampled date per event. This tests numerical parity of these paths, not the astrological validity of either method. KP uses its own KP ayanamsa; the gochara and Parashari computations use the selected Lahiri ayanamsa.

## Concrete limitations and examples

- Andy Murray's documented 2015 wedding had favourable Jupiter and unfavourable Saturn in the full app reading; its two-planet midrank was 77%. Sources include [a contemporaneous report](https://www.the-independent.com/news/people/andy-murray-to-wed-kim-sears-in-scottish-home-town-of-dunblane-10169323.html) and the [ATP biography](https://www.atptour.com/-/media/files/media-guide/2020/2020-atp-media-guide-player-bios-l-to-q.pdf).
- Helen Hunt's 2004 child birth had neither Jupiter nor Saturn favourable in this interpretation; the feature tied all 200 comparison dates, giving a 50% midrank. [Reuters via ABC](https://www.abc.net.au/news/2004-05-22/actress-helen-hunt-gives-birth-to-daughter/1980006) reports the date, not the time.
- Of 10 events without a confirmed clock, the transiting Moon occupied different signs at the four checked times in five, the two-planet favourable count changed in one, and the seven-planet count changed in four. The four snapshots are a sensitivity check, not proof of a continuous all-day range.
- Rafael Nadal's birth certificate time and an alternative he reportedly gave differ, and Mani Shankar Aiyar's civil date/clock interpretation is uncertain; the fixture retains alternatives without selecting a winner. Aiyar's alternative uses +05:30 to demonstrate a 30-minute instant shift, while his suggested offset interpretation could instead represent the same instant.
- After the initial run, an additional [contemporaneous report](https://eldiariony.com/2019/10/19/boda-sin-telefonos-rafael-nadal-se-caso-y-sus-invitados-no-pudieron-ingresar-con-sus-moviles/) was found stating that Nadal's wedding ceremony was around 13:00 local time. The prespecified primary case used noon; a separate post-run check at 13:00 yielded the same two-planet count, seven-planet count, KP scores and Parashari v3 score as noon. The independent post-run check does not alter the frozen comparison set.
- The 01:00 clock for Gwyneth Paltrow's first child's birth is attributed by [Astro-Databank](https://www.astro.com/astro-databank/Martin%2C_Apple?lang=e&nho2=432617) to a media report; it is not independently certified. Multiple outlets may repeat the same public announcement and should not be mistaken for independent witnesses.

The sample is predominantly marriage/childbirth among public figures and is not representative across places, occupations or event types. Date selection, seasonality and time-of-day uncertainty can influence results. A stronger follow-up would prespecify event-specific, sourced transit rules and compare them on a larger held-out collection with independently checked events and comparison windows, including actual non-events where those can be established. The user's private chart was evaluated separately and is not stored in the repository.

## Reproduce

From the repository root:

```sh
node --import tsx scripts/eval-moon-gochara.ts > /tmp/nadi-moon-gochara-results.json
node --import tsx --test scripts/moon-gochara-research.test.ts
```

The `--stdin` mode accepts a chart, events and candidate times for a private run; callers are responsible for keeping their input and output private.
