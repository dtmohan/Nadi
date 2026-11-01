# Event-only birth-time search: Prince William

This example uses independently checkable, dated life events to search the full reported day of birth. The event-only calculation returned **26 tied top intervals**, occupying **21.44% of the day**—about **5 hours 9 minutes** in total. It did not recover the published birth time of **21:03**, nor any time within five minutes of it. The closest top interval begins approximately **21:23**, about 20½ minutes later. This is a miss for this particular partial rule, not proof that the contemporaneous birth announcement or a candidate window is wrong.

This is a retrospective **non-blind** illustration: the subject, some events and the published birth time had appeared in earlier Nadi research and were known to the investigator before this scan. The search program itself did not read a recorded birth clock or use proximity to one, and it did not rank by the held-out events. Its [protocol](royal-event-only-protocol.md) and [event-only fixture](../scripts/fixtures/royal-event-only-case.json) specify the rules and events. The source documents support the dates and reported clocks, but the same underlying palace announcement appears in several news reports; multiple publications are not multiple independent medical observations.

## Events supplied to the search

| Event | Clock used as a range in local UK time | Sources |
| --- | --- | --- |
| Marriage, 29 April 2011 | 11:00–12:15, covering the service; the time of vows is not assumed | [Westminster Abbey](https://www.westminster-abbey.org/history/explore-our-history/the-wedding-of-william-and-kate), [Royal Family](https://www.royal.uk/wedding-prince-william-and-miss-catherine-middleton?page=4) |
| First child, 22 July 2013 | 16:24, tested ±5 minutes | [Royal Family](https://www.royal.uk/prince-george), [ITV](https://www.itv.com/news/2013-12-27/july-2013-an-heir-is-born) |
| First air-ambulance shift, 13 July 2015 | 07:00, tested ±30 minutes | [ITV interview](https://www.itv.com/news/anglia/update/2015-07-13/full-interview-with-prince-william-on-his-new-job-as-air-ambulance-pilot/), [contemporary shift-time report](https://www.standard.co.uk/news/uk/nervous-prince-william-begins-new-job-as-air-ambulance-pilot-10384795.html), [AirMed&Rescue](https://www.airmedandrescue.com/latest/news/prince-william-begins-role-hems-pilot) |

The ±5-minute and ±30-minute spans are **sensitivity assumptions**, not externally certified error bounds. Births of [Princess Charlotte](https://www.royal.uk/princess-charlotte) on 2 May 2015 and [Prince Louis](https://www.royal.uk/prince-louis) on 23 April 2018 were held out from selection. They are also reported by [The Gazette](https://www.thegazette.co.uk/all-notices/content/100028) and [Sky News](https://news.sky.com/story/prince-louis-birth-certificate-released-11354753), respectively. All three children are from one family and are correlated events.

## How the candidate times were chosen

The search assumed only the birth date and St Mary's Hospital, Paddington (approximate coordinates 51.5175° N, 0.1735° W). It used London civil time, Lahiri ayanamsa, mean nodes and Nadi's 365.25-day Vimshottari year. The [hospital location](https://www.quality.org/system/files/content_slice/attachments/2023/07/SERV%20Hospital%20Documentation.pdf) is approximate; it is not the exact room location.

For each event, the strict first stage required a relevant partial primary link in D9, D7 or D10 for **both** main and subperiod lords throughout the supplied event-clock range. The search retained all times with the highest number of such input events. Within that set, it kept all times with the largest number of those events also linking the third lord throughout its range. The best stage-2 count was **3/3 input events**, and the best third-stage count was also **3/3**. These are app-defined Boolean checks, not Manley's complete qualitative method and not calibrated probabilities. Each event time range is enumerated for possible third-period changes.

The stage-2 top set contained **30** intervals covering **35.30%** of the day. Refinement to the third level left **26** intervals covering **21.44%**. The scan samples candidate births every five seconds and refines detected boundaries; it can miss a feature that begins and ends between samples. The rounded times below must not be read as clinical precision.

| Approximate tied intervals in London local time | | |
| --- | --- | --- |
| 00:00–00:07 | 00:26–00:32 | 00:43–00:49 |
| 01:23–01:28 | 02:01–02:05 | 02:18–02:28 |
| 02:58–03:01 | 03:27–03:39 | 04:13–04:15 |
| 05:24–05:30 | 07:58–08:02 | 09:55–10:34 |
| 11:30–11:49 | 12:08–12:27 | 14:12–14:15 |
| 14:58–15:07 | 15:17–15:36 | 16:31–16:39 |
| 17:30–18:06 | 18:45–18:54 | 19:41–20:25 |
| 21:23–21:29 | 21:41–21:53 | 21:57–22:09 |
| 22:13–22:20 | 23:19–23:27 | |

The program did not choose one of these intervals. At representative midpoints near **00:03** and **21:26**, all three input events and both held-out births satisfy the three-level partial gate. The latter midpoint was picked for display *after* comparing with the reported birth time; it was not a blind prediction. The former is the first interval's midpoint. Their ability to explain the same five events under the rule illustrates why the apparent match is not unique.

For a concrete look at the 21:26 example, the wedding periods are Saturn/Saturn/Venus: in D9 the check finds Saturn and Venus in mutual full aspect, and Venus is the marriage significator. For the first child's birth, Saturn/Mercury/Venus has Saturn aspecting Mercury, the D7 fifth lord; Mercury itself is that lord, and Venus shares a sign with Jupiter, the child significator. For the first work shift, Saturn/Ketu/Ketu puts Saturn in the D10 tenth house, while Ketu links to its lord Jupiter and to career significators. These are descriptions under the app's rules, not independent confirmations: Saturn repeats in the wedding periods and Ketu repeats in the job periods.

The earliest midpoint also shows how the rule can become broad. Its work periods are Jupiter/Sun/Sun, and the D10 primary condition can be satisfied because Jupiter and Sun are among the app's four chosen career significators, even without a direct tenth-house or tenth-lord link for those periods. Counting the repeated Sun as two matching levels adds no independent planetary relationship. The experiment deliberately retained this pre-existing karaka-inclusive convention; requiring a direct house or lord link would be a different rule that needs a separately frozen test.

## What the documented birth time shows

A contemporary [London Gazette notice](https://www.thegazette.co.uk/London/issue/49027/page/8215/data.pdf) records 21:03, also repeated by the [Royal Family](https://www.royal.uk/the-prince-of-wales-0?page=4). These reports trace to the same announcement and are not separate hospital measurements. At that reference, the input marriage and work events satisfy the strict gate, but the first child's event does not satisfy its main/subperiod **primary D7** requirements. The partial search therefore gives it **2/3**, while the highest-scoring set has **3/3**.

The reference chart nevertheless has other clues for the child's birth. In D1, Saturn connects with Mars, the natal fifth lord; in D7, Saturn occupies the ninth, the fifth from the fifth, and Mercury aspects that house. The model excluded those supporting links from its gate. This distinction matters: an absent Boolean in the simplified rule is not a full astrological failure, and it gives no basis to reject the documented birth time.

Across the top third-stage intervals, Charlotte's held-out event met the strict three-level gate for **53.08%** of their duration and Louis's for **72.21%**; across the full day the corresponding figures were **35.69%** and **41.98%**. These are descriptive coverage figures for related events from one known person, not independent predictive probabilities. At the two displayed midpoints, the same gated criteria also matched **8/12** and **7/12** date-shifted held-out comparisons, respectively. The comparison dates are correlated and are not known non-events; they illustrate limited specificity, not measured false-positive rates.

## Reproduction

The [full event-only output](royal-event-only-results.json) includes every tied interval and each representative's facts; it contains no reference birth clock. The separate [reference comparison](royal-event-only-reference.json) records the documented time, nearby candidate and date-shift checks. Run `node --import tsx scripts/eval-royal-event-only.ts > docs/royal-event-only-results.json` before `node --import tsx scripts/compare-royal-reference.ts > docs/royal-event-only-reference.json`. The search output SHA-256 is `2a3d841edaccbf09f3e5e21efa35bdfc2aac2135f999ac8b2de60fd8e10153f0`; its file hashes identify the protocol, fixture and principal computation files.

This example does what was requested—searches using historical events before comparing against a reported birth clock—but the non-blind setup, approximate rule and broad tied sets cannot validate birth-time rectification. A genuinely unseen series would require a frozen rule, source-audited events, independent birth records and an evaluator blinded to those records.
