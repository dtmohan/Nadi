# Rectification scan performance

The fixed synthetic workload is reproducible with
`node --import tsx scripts/benchmark-rectify.ts 10`. It has three dated events,
51 sampled birth-time segments and 200 random-date sets for each segment. No
personal birth or event data is used. Times are illustrative wall-clock samples
on the development machine, not a guarantee on another server or network.

| Implementation | Local ±10-minute run | Result comparison |
| --- | ---: | --- |
| Before this work (`37adfe1`) | 5.22 s | Original response SHA-256 `6f863a4cff8c9e8e305dc7aa314a164ac875c5f393a687b0b1765b5407de644f` |
| Source-scoped scores added (`c526072`) | 2.63 s | Pre-existing fields identical to the original after removing new fields |
| Topic-independent ALP frame reuse | 1.94 s | Complete response identical to `c526072`; SHA-256 `bd45a3a61617511b4e2b34cc8380a4722400ff4583e3e9215228bee60ad88106` |

The ±30-minute, three-event workload has 161 segments. On the same machine the
first integrated version took 7.28 s and the follow-up took 5.47 s; their complete
39,371,242-byte JSON responses have the same SHA-256
`82c1116ec1f75d0ddd20f36a3b3cc92c37546c838246fafa9720e91e1246ec48`.
Response transfer and rendering can add time. The endpoint compresses responses
when the client accepts gzip.

The faster Parashari path runs the same natal house/yoga rules and sensitivity gate
without constructing date-only period timelines that event checks do not use. ALP
shares the same ordinary rule frame without building chart-only timelines; within a
single candidate, the topic-independent result is reused only when the progressed
points, sensitivity gate and actual ARP main/subperiod all agree. A small margin
around period boundaries forces ordinary reevaluation. Near an ALP pada boundary,
the cache key also falls back to the ordinary date arithmetic. No cached frame is
shared between different candidate birth times. Tests compare full and optimized
findings, topic projections and period boundaries, and replay all 200 comparison
sets through the same event evaluator.

A live run of the first integrated version (`c526072`) on Render took 73.49 s for
the ±10-minute synthetic workload, much longer than locally. The server's CPU,
load, startup and network contribute; the measurement does not establish the
cause. The follow-up should therefore be checked on that host before claiming a
corresponding live improvement. Wider windows and larger event lists still cost
more because the app evaluates each sampled candidate and comparison date.
