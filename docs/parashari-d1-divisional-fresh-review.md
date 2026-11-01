# Preliminary fresh-case test of the D1 → division funnel

The fixed rules and preregistered test are in [the protocol](parashari-d1-divisional-hierarchy.md). The input cases, dates, source links and conflicts are in [the fixture](../scripts/fixtures/parashari-hierarchy-fresh.json). The reproducible output, including code and fixture hashes, is in [the results](parashari-d1-divisional-fresh-results.json).

**Result: this strict partial screen is not fit to identify a birth time.** In all four cases, no candidate slice in the reported-time ±30-minute window passed the partial D1 gate simultaneously for both selected events. Consequently no candidate reached a divisional or later period gate. This is an observed limitation of the app's screen, not evidence that the events did not happen or that the reported times are incorrect.

| Case | Reported birth-time source | Slices in scanned hour | Slices passing both D1 event gates | Held-out event through subperiod | Nearby controls through subperiod |
| --- | --- | ---: | ---: | --- | --- |
| Shah Rukh Khan | A, time recalled by the person; an older unverified time conflicts | 132 | 0 | 0/1 | 0/6 |
| Steven Spielberg | AA, Astro-Databank reports birth certificate | 130 | 0 | 0/1 | 0/6 |
| Michael Jordan | AA, Astro-Databank reports birth certificate | 148 | 0 | 0/1 | 0/6 |
| Monica Bellucci | AA, Astro-Databank quotes birth record; rounded clock | 154 | 0 | 0/1 | 0/6 |

The holdout and control rows use the reported birth time. They are not independent validation of any selected window: none was selected. For Spielberg the two filtering events span less than a year, so the app's 200-trial random-date baseline was unavailable; the six nearby holdout dates are still shown. For the other three, random-date simulations ran, but when the natal gate is unresolved, changing the event date cannot rescue it. Alternate dates for Bellucci's held-out event produce the same unresolved gates; the fixture also records a date conflict for Jordan's twins and a different date and clock report for Khan's daughter. All event clocks not documented in the fixture were assumed to be noon in the stated zone. Some cited birth clocks derive from astrology reports, not an independently inspected record.

This is a small convenience sample of public figures, with uncertain birth times, limited event types, potential dependence among reports and no representative control group. It does not validate astrology or quantify accuracy. The D1 check omits avasthas, yogas and other event-specific natal evidence; requiring a support-only result is an app convention, and mixed indications are deliberately unresolved. BPHS's [house-judgement verses](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf) list supportive and contrary factors, but do not state this application's universal binary gate. Manley's qualitative funnel likewise does not supply this binary formula. More comprehensive, source-specific rules require development and a genuinely new holdout before this hierarchy can be treated as a useful ranking method.
