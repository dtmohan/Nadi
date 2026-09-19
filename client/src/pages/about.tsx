import { KARAKA, PLANETS } from "@shared/astro";

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold tracking-tight">How Nadi reads a chart</h1>
      <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-base">
        <p>
          Bhrigu Nandi Nadi (BNN) is a branch of Nadi astrology systematised by R.G. Rao from palm-leaf manuscripts. It differs from Parashari practice in three ways that shape this app.
        </p>
        <h2>No lagna, no houses</h2>
        <p>
          The chart is read from the planets alone. Each planet is a karaka, a significator of people and matters in the native's life, and the sign it occupies plus its neighbours tell the
          story. Birth time is still needed for the Moon's degree and for retrograde and combustion states, but a few minutes' uncertainty rarely changes a Nadi reading.
        </p>
        <h2>Jupiter is the native, Saturn is the work</h2>
        <p>
          Jupiter is the Jeeva karaka: the person, their body and life direction. Saturn is the Karma karaka: livelihood and profession. Venus is the Kalatra karaka for marriage. A reading
          begins by seeing which planets sit with, ahead of, behind, in trine to or opposite these three.
        </p>
        <h2>Relations by sign</h2>
        <ul>
          <li>Conjunction: same sign. The strongest link.</li>
          <li>2nd and 12th: the adjacent signs. A planet behind (12th) pushes its qualities into the one ahead; a planet ahead (2nd) is where the subject is heading.</li>
          <li>Trines: the 5th and 9th signs share a direction (east 1-5-9, south 2-6-10, west 3-7-11, north 4-8-12) and are read as being in combination, at about three-quarter strength. Three-planet combinations count through trines as well.</li>
          <li>7th: opposition, a face-to-face influence at about half strength.</li>
          <li>
            Retrograde: a retrograde classical planet "will aspect the rear sign by 1/2 strength" (
            <a href="https://astrofoxx.wordpress.com/wp-content/uploads/2018/11/jyotish_fundamentals-of-raos-system-of-nadi-1.pdf" target="_blank" rel="noreferrer">
              Rao, Fundamentals
            </a>
            ), so it is evaluated from both signs, the previous one at half weight, and appears in both directional chains. Two caveats from the{" "}
            <a href="https://www.scribd.com/document/961070390/Brighu-Nandi-Naadi" target="_blank" rel="noreferrer">
              Bhrigu Naadi rules
            </a>
            : a planet that has already backed into its sign from the sign ahead is not read from the sign before that (rule 11), and a retro planet under Rahu or Ketu, taken here as a
            node in the same sign or trine, "will not have effect on previous sign" (rule 12). Rao is explicit that the principle "does not apply to Dragon Head and Dragon Tail, which
            always move in anti-clockwise direction": the nodes' perpetual retrogression is part of their nature, not a retrograde state, so it only fixes their direction of motion in the
            degree chains. Retrogression does not alter the degree order itself; "we count the degrees" (
            <a href="https://www.youtube.com/watch?v=qojbWOwQQks" target="_blank" rel="noreferrer">
              Vaibhav Gupta
            </a>
            ).
          </li>
        </ul>
        <h2>Female charts</h2>
        <p>
          Who stands for a woman in her own chart is debated. The popular teaching swaps the seat: Jupiter is the "male Jeeva" and Venus the "female Jeeva" (
          <a href="https://astroindus.com/bhrigu-nandi-nadi/marriage-timing/" target="_blank" rel="noreferrer">
            Astroindus
          </a>
          ). Naik keeps two levels: "in male and in female charts Jupiter represents Jeevakaraka, and Venus also becomes Jeevakaraka in female charts" (
          <a href="https://ia601601.us.archive.org/2/items/RevelationFromNaadiJyotisha/Revelation%20from%20naadi%20jyotisha.pdf" target="_blank" rel="noreferrer">
            Revelation from Naadi Jyotisha
          </a>
          ); Guru is the native at the subtle level as Jeeva, and the body, the Deha, is Mars for a man and Venus for a woman (
          <a href="https://www.barnesandnoble.com/w/celestial-matrix-in-naadi-astrology-satyanarayana-naik/1141985051" target="_blank" rel="noreferrer">
            Celestial Matrix in Naadi Astrology
          </a>
          ). The app follows Naik's dual reference. Jupiter remains the Jeeva in every chart: the self rules, the life-force houses and the Jupiter-Saturn timing read from him for both
          sexes. When a chart is saved as female, Venus is added as the Deha, the native as a person: her own card, the "self" rules that describe her temperament, the marriage promise (Mars
          counted from Venus), the husband's nature and profession from the planets with Mars and in the 2nd, 5th, 7th and 9th from him (Rao), and the transits of Jupiter and Saturn over
          Venus. Only the male-framed Venus-as-wife rules are set aside, replaced by Rao's female rules, for example Mars with the Sun for a proud, short-tempered husband from a well-to-do
          family, Mars with Saturn for a marriage in Saturn's second round, or Mars, Saturn and Venus for a husband in banking or a luxury trade. Jupiter remains the universal timer: his
          passages over Venus or Mars, or their trines, bring the marriage. The Rule book lets you filter rules by frame. Further sources:{" "}
          <a href="https://astrofoxx.wordpress.com/wp-content/uploads/2018/11/jyotish_fundamentals-of-raos-system-of-nadi-1.pdf" target="_blank" rel="noreferrer">
            Fundamentals of Rao's System of Nadi Astrology
          </a>
          ,{" "}
          <a href="https://saptarishisastrology.com/nadi-principles-for-marriage-and-married-life-by-bhausaheb-sakurkar/" target="_blank" rel="noreferrer">
            Sakurkar on female horoscopy
          </a>{" "}
          and{" "}
          <a href="https://nikhilastroworld.com/2016/12/17/nadi-astrology-and-married-life/" target="_blank" rel="noreferrer">
            Nikhil Astro World on Nadi and married life
          </a>
          .
        </p>
        <h2>Children from Jupiter</h2>
        <p>
          There is no 5th lord and no saptamsa here. Jupiter is the putra karaka in both charts, and the question is answered in three steps. Promise: the link between Jupiter and Venus, full in one
          sign, three-quarter in trine, half in the 7th, faint on the 2/12 axis, absent in the 4th, 6th, 8th or 10th. Count and sex: the planets standing in the 5th from Jupiter, and those aspecting
          it, give the number of children; Sun, Mars and Jupiter denote sons, Venus and the Moon daughters, Mercury and Saturn follow the parity of their sign (odd male, even female), and the nodes are
          left open. The app shows this count as an upper bound. Obstruction: Saturn with Jupiter delays and reduces, Rahu diverts through medical help or foreign places, Ketu brings anxiety around
          the first child (the old texts read loss, modern teachers a delay), a watery 5th from Jupiter troubles conception, and Naik's aspects to the Sun and Venus tell son from daughter. Timing:
          Jupiter's return over natal Jupiter is the classic window for a child, with his passage over the 5th from Jupiter and its trines next. Sources:{" "}
          <a href="https://astroindus.com/bhrigu-nandi-nadi/children-progeny/" target="_blank" rel="noreferrer">
            Children and progeny in BNN (Astroindus)
          </a>
          ,{" "}
          <a href="https://www.scribd.com/document/976539938/Bhrigu-Nandi-Nadi" target="_blank" rel="noreferrer">
            Bhrigu Naadi principles (5th from Jupiter)
          </a>
          ,{" "}
          <a href="https://saptarishisshop.com/community/bhrigu-nandi-nadi/progeny-part-1-bhrigu-nandi-nadi/" target="_blank" rel="noreferrer">
            Sakurkar, Progeny in BNN
          </a>
          ,{" "}
          <a href="https://www.scribd.com/doc/208041853/Nadi-Astrology-R-G-Rao" target="_blank" rel="noreferrer">
            Rao, Nadi Astrology
          </a>{" "}
          and{" "}
          <a href="https://pdfcoffee.com/jyotish-satyanarayana-naik-prediction-secrets-naadi-astrology-pdf-free.html" target="_blank" rel="noreferrer">
            Naik, Prediction Secrets
          </a>
          .
        </p>
        <h2>Marriage without house lords</h2>
        <p>
          Nadi never asks who rules the 7th. Marriage is read between karakas: in a male chart Jupiter is the native and Venus the wife; in a female chart Venus is the native and Mars the
          husband, following Rao (many teachers also read Jupiter for the husband, and the app notes when Jupiter supports Venus in a female chart). Rao's rule is that marriage is promised
          when the spouse karaka stands in the 1st, 5th or 9th (same direction), 3rd, 7th or 11th (mutual aspect) or 2nd or 12th (adjacent) from the native's karaka, or from Saturn, in which
          case it comes by karma and later. The 4th, 6th, 8th and 10th carry no signature; the dispositor of the spouse karaka is then read instead. Saturn with or in trine to the spouse karaka
          delays, Jupiter hastens, Rahu and Ketu bring obstacles and disputes, and Saturn with a node on the karaka approaches denial unless Jupiter aspects it. Timing is Jupiter's passage over
          the spouse karaka's sign or its trines, with Saturn's passage releasing a delayed marriage. The Marriage card on each chart applies these rules using the gender saved with the chart.
          Sources: R.G. Rao's rules as summarised in{" "}
          <a href="https://ijcrd.dvpublication.com/uploads/666011e4de3cf_223.pdf" target="_blank" rel="noreferrer">
            Marriage Life through Bhrigu Nandi Nadi (IJCRD)
          </a>
          , Bhausaheb Sakurkar's{" "}
          <a href="https://saptarishisastrology.com/nadi-principles-for-marriage-and-married-life-by-bhausaheb-sakurkar/" target="_blank" rel="noreferrer">
            Nadi principles for marriage
          </a>{" "}
          and{" "}
          <a href="https://astroindus.com/bhrigu-nandi-nadi/marriage-timing/" target="_blank" rel="noreferrer">
            Astroindus on marriage timing
          </a>
          .
        </p>
        <h2>Houses without an ascendant</h2>
        <p>
          BNN does use houses, but they are whole signs counted from a karaka, not from the rising degree. "Sage Brighu has not concentrated on Ascendent (Lagna); on the other hand, he
          concentrates on Jupiter, calling it the life force ... the author treats Jupiter as the ascendent and the 12 houses therefrom", and from that reference "trine 1, 5, 9 are best,
          quadrants 1, 4, 7, 10 good, 6, 8, 12 bad, and 2, 3, 11 not so good" (
          <a href="https://www.scribd.com/document/976539938/Bhrigu-Nandi-Nadi" target="_blank" rel="noreferrer">
            Bhrigu Naadi principles
          </a>
          ). Jupiter's whole rashi is the 1st house whatever its degree; there is no bhava madhya and no chalit. The reference planet shifts with the topic: Rao counts from Saturn for
          profession and from Venus for the spouse and comforts, and in a female chart Venus takes the 1st house (
          <a href="https://sitharsastrology.com/blog/bhrigu-nandi-nadi-rule-one-why-jupiter-becomes-your-first-house" target="_blank" rel="noreferrer">
            Sitharsastrology, rule one
          </a>
          ;{" "}
          <a href="https://mokshatrikona.com/2026/05/25/bhrigu-nandi-nadi-a-summary/" target="_blank" rel="noreferrer">
            Mokshatrikona summary
          </a>
          ). The chart page numbers every sign from the chosen karaka and lists what sits in each house with its meaning, condensed from{" "}
          <a href="https://sitharsastrology.com/blog/the-12-houses-counted-from-jupiter-bhrigu-nandi-nadi" target="_blank" rel="noreferrer">
            the 12 houses counted from Jupiter
          </a>{" "}
          and, for Saturn, from the{" "}
          <a href="https://www.scribd.com/document/746652825/BNN-Bootcamp-10-Profession" target="_blank" rel="noreferrer">
            BNN profession bootcamp
          </a>{" "}
          (the 12th from Saturn is the work environment; Saturn's 3rd, 7th and 10th mark the start, middle and end of the career). The 1st, 2nd, 12th, 5th, 9th and 7th are read by the
          combination rules; the rule book's h-* rules read planets in the 3rd, 4th, 6th, 8th, 10th and 11th from Jupiter and the 3rd, 7th, 10th and 12th from Saturn, at a lower weight
          than a true combination since these planets do not combine with the karaka. A retrograde planet does not move house: its own house is read at full strength, and the previous house is
          added at half strength only when rules 11 and 12 allow it (not when it backed into the sign, and not when it is under Rahu or Ketu). The houses panel marks such additions "by
          retro" and explains why a retrograde planet stays put.
        </p>
        <h2>Direction matters</h2>
        <p>
          Two planets that combine are not read symmetrically. Rao's first rule is that "degree-wise a planet ahead will give its karakatwa to the planet behind", and the bond is tightest when
          the two share a pada (3°20'), then a nakshatra, then merely the sign. So Saturn ahead of Mercury colours learning and commerce with work and duty, while Mercury ahead of Saturn makes
          the profession itself Mercurial. This is applied across the whole trine, not just the sign: the three signs of a trine are one direction (East Aries-Leo-Sagittarius, South
          Taurus-Virgo-Capricorn, West Gemini-Libra-Aquarius, North Cancer-Scorpio-Pisces), "planets in the same direction are conjunct, irrespective of their signs" and are "written in the
          ascending order of their degrees" (
          <a href="https://anandamoyee.home.blog/2021/02/10/bhrigu-nandi-nadi-principles-with-chart-analysis/" target="_blank" rel="noreferrer">
            Anandamoyee, BNN principles
          </a>
          ;{" "}
          <a href="https://www.scribd.com/document/915304966/Bhrigu-Nandi-Nadi-Diploma-Class-3-Astro-Vaibhav-Gupta" target="_blank" rel="noreferrer">
            Vaibhav Gupta, class 3
          </a>
          ). Planets within a degree of each other across signs stand "at the same degree", a tighter bond than a bare trine. Retrogression shows the direction of approach: a direct
          planet moves to higher degrees, a retrograde one and the nodes to lower, so two planets closing on each other bind more strongly than two separating. The reading shows this
          hand-off under each same-sign or trine finding and lists the full degree order for every occupied direction. Between the 2nd and 12th signs the direction is
          by sign order: the planet in the 2nd "indicates the next step in action" and the one in the 12th "the background under which the matter is progressed" (Naik), which is why the
          rule book has separate entries for a karaka with a planet ahead and behind it. Some modern teachers reverse the degree rule and treat the lower-degree planet as the giver, on the
          logic that it is moving toward the other; the app follows Rao and Naik.
        </p>
        <h2>Strength, the Nadi way</h2>
        <p>
          BNN keeps the classical words exalted, debilitated, friend and enemy, but not the Parashari mechanics. Dignity is conditional and degree order matters. The app applies these rules and
          shows the result in the planet table and the Planetary strength notes; a dignity struck through has been set aside by one of them.
        </p>
        <ul>
          <li>
            An exalted planet with an enemy conjunct or in its 2nd or 12th gives no exalted benefit (Rao, rule 5); nor does one with nothing in its 2nd, 12th, 7th or trines to deliver it
            (rule 8). An exchange of signs also replaces the exaltation with the exchange partner's story.
          </li>
          <li>A debilitated planet in exchange loses its debilitation (Naik); a friend conjunct, beside, opposite or in trine softens it.</li>
          <li>Among enemies sharing a sign, the one further along by degree is the winning planet and dictates the outcome.</li>
          <li>Friends on both sides (2nd and 12th) let a planet's significations flow; enemies on both sides obstruct them.</li>
          <li>
            Combustion is a planet within the Sun's pada, 3°20'. It is read as a Sun combination first: results still come, in lesser degree and coloured by the father, authority and status.
            A friendly association or exchange cancels the reduction. The wide Parashari orbs are not used.
          </li>
        </ul>
        <h2>Timing by transit</h2>
        <p>
          Nadi timing follows Jupiter's passage through the signs, about one sign a year in a twelve-year cycle. When transiting Jupiter reaches a natal planet, that planet's significations
          come to life, and with it the whole combination that planet belongs to: Jupiter over a natal Venus that sits with Mars ripens the Venus–Mars story, not Venus in the abstract. The Timing
          tab therefore scores each passage against this chart's own findings and lists what ripens. Each passage is also counted from the natal Jupiter and Saturn, the Nadi equivalent of a
          progression, and a double transit, when Saturn holds the same natal planets by conjunction, trine or opposition while Jupiter crosses them, is flagged as a period when events tend to
          materialise. Saturn's slower passage (about two and a half years a sign) marks periods of pressure and consolidation. The app computes exact sidereal ingress dates from the Swiss
          Ephemeris, including retrograde re-entries.
        </p>
        <h2>Karakas used here</h2>
        <table>
          <thead>
            <tr>
              <th>Planet</th>
              <th>Role</th>
              <th>Significations</th>
            </tr>
          </thead>
          <tbody>
            {PLANETS.map((p) => (
              <tr key={p}>
                <td>{p}</td>
                <td>{KARAKA[p].title}</td>
                <td>{KARAKA[p].significations.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Computation notes</h2>
        <ul>
          <li>Swiss Ephemeris (sweph) with full-precision data files for 1200–3000 CE.</li>
          <li>Default ayanamsa is Lahiri (Chitrapaksha). Raman, Krishnamurti and Yukteshwar are also available.</li>
          <li>Rahu is the mean lunar node by default; the true node is available. Ketu is always opposite Rahu.</li>
          <li>Birth time is converted from the birthplace's IANA time zone, including historical daylight-saving rules, before the Julian Day is computed.</li>
        </ul>
        <h2>Where your charts live</h2>
        <p>
          Saved charts are kept in this browser's own storage, on your device only. The server receives birth data to compute a reading or a PDF and
          keeps nothing. Other visitors to the site never see your charts. Because the list belongs to the browser, it does not follow you to another
          device or survive clearing site data: use Export on the home page to download a backup file, and Import to restore or move it.
        </p>
        <h2>Sources</h2>
        <ul>
          <li>R.G. Rao, Bhrigu Nandi Nadi (Sagar Publications).</li>
          <li>Satyanarayana Naik, Prediction Secrets: Naadi Astrology and Nadi Astrology Guide.</li>
          <li>Swiss Ephemeris, Astrodienst AG.</li>
        </ul>
      </div>
    </article>
  );
}
