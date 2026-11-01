# Fresh parity and date-sensitivity review

Run: `node --import tsx scripts/eval-reading-parity.ts`. The predeclared inputs and checks are in [the protocol](reading-parity-fresh-protocol.md); the [fixture](../scripts/fixtures/reading-parity-fresh.json) records sources, date assumptions and alternative clocks, and the [machine-readable output](reading-parity-fresh-results.json) records every comparison and source hash. This is an engineering and sensitivity check on four convenience cases, not a statistical demonstration that astrology predicts events or recovers birth times.

## Cross-surface results

All **11 dated events** agreed between the chosen-date chart reading and Validate. Their natal KP cusp results, mapped Aurora cusp stages and all running-planet Parashari frames agreed with the independently opened natal chart. For one event per person, all registered KP fields and complete Parashari objects also agreed between a Rectify midpoint and a fresh reading at that exact midpoint. The midpoint tests use the same matter, clock, zone and house definitions; they do not assert that the midpoint is the birth time.

| Person and reported birth source | Events in fixture | Birth and event-clock limitations |
| --- | --- | --- |
| [Hrithik Roshan](https://www.astro.com/astro-databank/Roshan%2C_Hrithik), actor, India | 2000 wedding; sons in 2006 and 2008 | 03:25 is an indirect family-connected report (A), not a birth certificate. The 2006 birth has reports of [15:08](https://filmibeat.com/bollywood/features/2006/hrithik-roshan-290306.html) and [about 15:30](https://www.bollywoodhungama.com/news/bollywood/hrithik-and-suzzanes-son-is-named-rehaan/); both yield the same compact scores here. The wedding's noon is assumed; 18:00 is an illustrative evening alternative. |
| [David Cameron](https://www.astro.com/astro-databank/Cameron%2C_David_%281966%29), politician, Britain | 1996 wedding; [2010 appointment as PM](https://www.gov.uk/government/history/past-prime-ministers/david-cameron); 2010 daughter's birth | 06:00 is reported from memory (A). 05:55 was attributed indirectly to his mother and 05:51 is a further adjusted estimate, not an independent clock. The daughter's noon is approximate; other unknown clocks are noon assumptions. |
| [Salma Hayek](https://www.astro.com/astro-databank/Hayek%2C_Salma), actor/producer, Mexico | 2007 daughter's birth; [2009 Paris wedding](https://www.abc.net.au/news/2009-02-16/salma-hayek-marries-french-tycoon/298124) | 06:40 is described as birth-certificate data (AA). Both event clocks are unknown and treated as noon. |
| [Nelson Mandela](https://www.astro.com/adbvip/adbvip_07_18.htm?nhor=432788), political leader, South Africa | [1958 marriage](https://www.nelsonmandela.org/uploads/files/genealogy_%281%29.pdf); [1994 inauguration](https://www.gcis.gov.za/sites/www.gcis.gov.za/files/docs/resourcecentre/yearbook/2012/MANDELA.pdf); [1998 marriage](https://www.nelsonmandela.org/on-this-day/entry/nelson-mandela-turns-80-and-marries-his-third-wife-graca-machel) | The published 14:54 is a previous astrologer's rectification from an unverified afternoon report (DD), not independent evidence for a minute. 13:00 and 16:00 are hypothetical sensitivity samples. Event clocks are unknown and treated as noon. |

The alternate Cameron time 05:51 changes his marriage's v2 score from 4 to 1; 05:55 leaves the compact scores in this sample unchanged. Mandela's hypothetical alternatives change several results. Those differences show sensitivity to assumptions, not which clock is correct.

## Recorded dates versus fixed-offset dates

Each of the 11 dates was compared with six dates at ±60, ±120 and ±180 days, retaining the event's stated or assumed clock and time zone. The table counts controls with the **same individual result** as the recorded date, not controls known to be non-events.

| Result compared | Same as recorded date |
| --- | ---: |
| KP four-step event tally | 54 / 66 |
| KP period-lord transit tally | 40 / 66 |
| Parashari v1 tally | 48 / 66 |
| Parashari v2 tally | 52 / 66 |
| Parashari v3 tally | 51 / 66 |
| Conditional named-pair flag | 63 / 66 |
| Conditional node-ruler flag | 66 / 66 |
| Conditional event-house combination flag | 66 / 66 |
| Aurora strict full-chain flag | 66 / 66 |
| Aurora mixed v2 full-chain flag | 66 / 66 |

Both Aurora full-chain flags were **false for all 11 recorded dates and all 66 controls**; that is an unresolved research screen, not proof those events were denied. The high number of repeated scores is consistent with slow-changing natal, period and transit inputs and with the coarse summaries. It does not measure false positives: these controls were not verified as days without the relevant event, and repeated events from a person are not independent observations. A reliable predictive or birth-time validation would require a larger, prespecified sample, documented reference clocks, appropriate true negatives and an independently held-out evaluation.

The previous five conditional-rule fresh cases were separately replayed and their full result objects reproduced exactly after the refactor. They are a regression check, not additional fresh cases in this table.
