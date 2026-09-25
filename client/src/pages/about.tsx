import { KARAKA, PLANETS } from "@shared/astro";
import { CHARA_KARAKAS, CHARA_KARAKA_INFO } from "@shared/jaimini";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ext = { target: "_blank", rel: "noreferrer" } as const;

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-8 md:px-10">
      <h1 className="font-display text-xl font-bold tracking-tight">How Nadi reads a chart</h1>
      <Tabs defaultValue="bnn" className="mt-4">
        <TabsList>
          <TabsTrigger value="bnn" data-testid="tab-about-bnn">
            Bhrigu Nandi Nadi
          </TabsTrigger>
          <TabsTrigger value="jaimini" data-testid="tab-about-jaimini">
            Jaimini
          </TabsTrigger>
          <TabsTrigger value="kp" data-testid="tab-about-kp">
            KP
          </TabsTrigger>
          <TabsTrigger value="parashari" data-testid="tab-about-parashari">
            Parashari
          </TabsTrigger>
        </TabsList>
        <TabsContent value="jaimini">
          <JaiminiMethod />
        </TabsContent>
        <TabsContent value="kp">
          <KpMethod />
        </TabsContent>
        <TabsContent value="parashari">
          <ParashariMethod />
        </TabsContent>
        <TabsContent value="bnn">
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
            <a href="https://saptarishisshop.com/product/fundamentals-of-raos-system-of-nadi-astrology/" target="_blank" rel="noreferrer">
              Rao, Fundamentals of Rao's System of Nadi Astrology
            </a>
            ), so it is evaluated from both signs, the previous one at half weight, and appears in both directional chains. Two caveats from the numbered progression rules taught in BNN classes: a planet that has already backed into its sign from the sign ahead is not read from the sign before that (rule 11), and a retro planet under Rahu or Ketu, taken here as a
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
          <a href="https://www.exoticindiaart.com/book/details/revelation-from-naadi-jyotisha-based-on-brighu-nandi-nadi-system-naj696/" target="_blank" rel="noreferrer">
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
          <a href="https://saptarishisshop.com/product/fundamentals-of-raos-system-of-nadi-astrology/" target="_blank" rel="noreferrer">
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
          <a href="https://www.exoticindiaart.com/book/details/bhrigu-nandi-nadi-uac236/" target="_blank" rel="noreferrer">
            Rao, Bhrigu Nandi Nadi (5th from Jupiter)
          </a>
          ,{" "}
          <a href="https://saptarishisshop.com/community/bhrigu-nandi-nadi/progeny-part-1-bhrigu-nandi-nadi/" target="_blank" rel="noreferrer">
            Sakurkar, Progeny in BNN
          </a>
          ,{" "}
          <a href="https://www.amazon.com/Naadi-Astrology-Raos-System-Calculation/dp/8170822815" target="_blank" rel="noreferrer">
            Rao, Nadi Astrology
          </a>{" "}
          and{" "}
          <a href="https://play.google.com/store/books/details/Satyanarayana_Naik_Prediction_Secrets_Naadi_Astrol?id=GUyFEAAAQBAJ" target="_blank" rel="noreferrer">
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
          <a href="https://www.exoticindiaart.com/book/details/bhrigu-nandi-nadi-uac236/" target="_blank" rel="noreferrer">
            Rao, Bhrigu Nandi Nadi
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
          <a href="https://astro-bnn.blogspot.com/2026/02/career-prediction-by-bhrigu-nandi-nadi.html" target="_blank" rel="noreferrer">
            career reading from Saturn (Astro BNN)
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
          <a href="https://thefuture.university/bootcamp/bhrigu-nandi-nadi-diploma" target="_blank" rel="noreferrer">
            Vaibhav Gupta's BNN diploma course
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
        <p>
          Life events (a marriage, a child, a job, an illness, each with its date and, if you wish, how it turned out) are saved with the chart and
          travel in the same backup file. Enter them once, under the chart's name or in the Rectify tab; every rectification method reads the same
          list, and a rectified copy inherits it.
        </p>
        <h2>Validate: the chart against what happened</h2>
        <p>
          The Validate tab reads each saved event back at its date with the birth time as recorded. For KP it asks whether the dasa, bhukti and
          antara lords running that day were significators of the matter's houses, whether the sub lord of the matter's cusp promised it, and
          whether the dasa and bhukti lords transited a significator's sign, star or sub that day (Astro Secrets &amp; KP Part 1, pp. 167-172; Part
          2, p. 203). The houses follow the same book: marriage 2, 7, 11; children 2, 5, 11; work 2, 6, 10, 11; and vehicles 3, 11, 12 rather
          than the 4th, which Part 1 calls a static house whose vehicles "though repaired cannot be put on the road", roadworthy ones coming
          through 3, 11 and 12 (pp. 135-137); the 4th cusp still carries the promise. For Jaimini it asks whether the chara dasha and antardasha carried the matter's life area (K.N. Rao). For Nadi, Jupiter is the timer and
          Saturn the second hand: six points per event for Jupiter over the matter's karaka (two; in trine or opposite, one), Saturn touching a
          karaka (one), both on the same karaka at once (one), Jupiter's count from the natal Jeeva, or the Deha in a female chart, falling in the
          matter's signs (one), and one of the chart's own combinations in that life area standing under the passage (one). The karakas are the
          matter's own: Venus or Mars for the spouse, Jupiter for children, Saturn for work, Sun and Moon for the parents, Mars for land, Rahu
          for foreign places. Four of six is strong. A second table turns the events round:
          for each planet, the houses it signifies give what KP expects of it in its periods (a planet tied to 6, 8, 12 turns harmful, one tied to
          2, 3, 10, 11 turns favourable, whatever its natural character; Part 1, pp. 17-19), and the outcomes of the events that fell in its dasa,
          bhukti or antara show how it behaved. A second expectation reads the same houses through their cusps: two articles in the same
          series hold that the sub lord of a cusp is the barometer of its house, so a period lord can give of a house only what the sub lord of
          that cusp signifies, and a cusp sub lord signifying the 12th from its cusp denies the matter even while a fitting period runs (Part 3,
          ch. 5, pp. 27-34; Part 2, ch. 7, pp. 52-54). The Validate tab therefore strikes through a period lord whose every hit is carried
          elsewhere by those cusp sub lords, marks a denied cusp, and shows both expectations side by side so the events can say which the chart
          follows. The same two articles supply nineteen cusp rules to the KP tab (the 12th sub lord on the improving houses blunting the 12th,
          the 8th sub lord on 1, 3, 10, 11 disarming the 8th, the 7th sub lord on the 6th denying marriage, and their kin). Poor agreement across several events is a hint about the birth time, and the Rectify tab is the
          next step.
        </p>
        <h2>Sources</h2>
        <ul>
          <li>R.G. Rao, Bhrigu Nandi Nadi (Sagar Publications).</li>
          <li>Satyanarayana Naik, Prediction Secrets: Naadi Astrology and Nadi Astrology Guide.</li>
          <li>Swiss Ephemeris, Astrodienst AG.</li>
        </ul>
      </div>
        </TabsContent>
      </Tabs>
    </article>
  );
}

function JaiminiMethod() {
  return (
    <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-base" data-testid="about-jaimini">
      <p>
        The Jaimini module is a separate mode on the chart page. It is ascendant-based and house-based, so nothing from it feeds the Nadi reading, and nothing from the Nadi reading feeds it. Both are
        computed from the same sidereal positions.
      </p>
      <h2>Eight chara karakas</h2>
      <p>
        The seven planets and Rahu are ranked by their degree within sign; the highest is the Atmakaraka (AK), the soul's significator, and the rest follow in order. Rahu moves backward, so it is ranked by
        thirty degrees minus its degree. This is the eight-karaka scheme K.N. Rao and most modern Jaimini authors use; the seven-karaka scheme (no Rahu, and the Putrakaraka doubling as Matrikaraka) is
        not offered. See{" "}
        <a href="https://astroshruti.ai/jyotish/jaimini-karakas" {...ext}>
          AstroShruti on chara karakas
        </a>{" "}
        and{" "}
        <a href="https://wiki.openfate.ai/en/vedic/jaimini-and-karakas/seven-vs-eight-chara-karakas" {...ext}>
          OpenFate on seven versus eight karakas
        </a>
        .
      </p>
      <ul>
        {CHARA_KARAKAS.map((k) => (
          <li key={k}>
            <strong>{k}</strong> {CHARA_KARAKA_INFO[k].name}: {CHARA_KARAKA_INFO[k].meaning}
          </li>
        ))}
      </ul>
      <h2>Navamsa and Karakamsa</h2>
      <p>
        Each sign is divided into nine parts of 3°20'. Movable signs start their navamsa count from themselves, fixed signs from the ninth sign from themselves, dual signs from the fifth; this is the usual
        Parashari scheme and the same for both systems. The navamsa sign of the Atmakaraka is the Karakamsa (Swamsa). Jaimini Sutras 1.2 read the native's temperament, profession and devotion from the
        Karakamsa sign, the planets in it, and the houses counted from it in the navamsa; the app applies those sutras there (
        <a href="https://vedichora.org/classical/jaimini-sutras" {...ext}>
          Jaimini Sutras, Vedic Hora
        </a>
        ).
      </p>
      <h2>Rasi drishti</h2>
      <p>
        Jaimini's aspects are between signs, not planets. A movable sign aspects the three fixed signs except the one next to it; a fixed sign aspects the three movable signs except the one before it;
        the dual signs aspect one another. A planet aspects whatever its sign aspects. In house terms a movable sign sees its 5th, 8th and 11th, a fixed sign its 3rd, 6th and 9th, and a dual sign its 4th, 7th and 10th.
        This is where readers used to Parashari aspects are most often surprised: there is no universal 7th aspect (Aries and Libra do not see each other), a group of planets in one sign always aspects together, and a
        movable sign's 8th is a full aspect. The chart page has a click-to-explore view of this (
        <a href="https://moonketu.com/learn/jaimini/rashi-drishti" {...ext}>
          Moonketu on rasi drishti
        </a>
        ).
      </p>
      <h2>Argala</h2>
      <p>
        Planets in the 2nd, 4th and 11th from a sign intervene in its affairs; the 5th gives a weaker, secondary intervention. Planets in the 12th, 10th, 3rd and 9th respectively obstruct them. The app
        treats an argala as obstructed when the obstructing house holds at least as many planets as the intervening one; the special reversal for Ketu is not implemented. Argala is shown for the lagna,
        the Arudha lagna and the Upapada (
        <a href="https://srath.com/jyoti%E1%B9%A3a/amateur/argala-planetary-intervention/" {...ext}>
          Sanjay Rath on argala
        </a>
        ).
      </p>
      <h2>Arudha padas</h2>
      <p>
        Count from a house to its lord, then the same distance again; the sign reached is the house's pada. When it falls in the house itself or the 7th from it, the pada is moved to the 10th from that
        sign. AL (the pada of the 1st) is how the world sees the native; UL (the pada of the 12th, the Upapada) governs marriage. The seven traditional lords are used, so Scorpio is read from Mars and
        Aquarius from Saturn, which is the common practice for padas (
        <a href="https://astroshruti.ai/jyotish/jaimini-arudha" {...ext}>
          AstroShruti on arudha padas
        </a>
        ). Interpretations of AL and UL follow Jaimini Sutras 1.3 and the Upapada chapter of Brihat Parashara Hora Sastra (
        <a href="http://jyotishvidya.com/ch30.htm" {...ext}>
          BPHS chapter 30
        </a>
        ).
      </p>
      <h2>Chara dasha, K.N. Rao's method</h2>
      <ul>
        <li>
          The first dasha is the lagna sign. The sequence runs forward when the 9th house from the lagna is a savya sign (Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius) and backward when it is
          apasavya (Cancer, Leo, Virgo, Capricorn, Aquarius, Pisces).
        </li>
        <li>
          A sign's years are the count from the sign to its lord, less one. Savya signs count forward, apasavya signs backward. A lord in its own sign gives twelve years. There is no addition or
          deduction for exaltation or debilitation.
        </li>
        <li>
          Scorpio has Mars and Ketu, Aquarius Saturn and Rahu. If both lords sit in the sign it gets twelve years; if one sits in it, the other gives the count; otherwise the lord whose sign holds more
          planets gives the count, and on a tie the one higher by degree.
        </li>
        <li>
          Each dasha has twelve antardashas of equal length. They begin from the sign next to the dasha sign, in the dasha sign's own direction, and end on the dasha sign itself.
        </li>
        <li>The second cycle repeats the same years, so the table covers 120 years.</li>
      </ul>
      <p>
        Sources:{" "}
        <a href="https://saptarishisastrology.com/jaiminis-chara-dasha-my-approach-part-1-k-n-rao/" {...ext}>
          K.N. Rao, "Jaimini's Chara Dasha, my approach" (Saptarishis Astrology)
        </a>
        ,{" "}
        <a href="https://www.journalofastrology.com/article.php?article_id=317" {...ext}>
          K.N. Rao, "Jaimini Chara Dasha, my approach", part 2 (Journal of Astrology)
        </a>
        ,{" "}
        <a href="https://moonketu.com/learn/jaimini/jaimini-chara-dasha" {...ext}>
          Moonketu on Chara dasha
        </a>
        ,{" "}
        <a href="https://astroleaf.in/chara-dasha-calculator/" {...ext}>
          Astroleaf Chara dasha notes
        </a>
        . Other schools (Raghava Bhatta, Sanjay Rath's Narayana dasha) differ on direction and on the ±1 adjustments; only Rao's method is implemented.
      </p>
      <h2>Life areas and timing</h2>
      <p>
        The Life areas view groups the chart into self, career, wealth, marriage, children, family and health. Each area rests on three things: its chara karaka (Amatyakaraka for career, Darakaraka for
        the spouse, Putrakaraka for children, Matri-, Pitri- and Bhratrikaraka for the family, Gnatikaraka for illness and rivals), its arudha pada (A10, UL and A7, A5, A4, A9 and A3, A6 and A8) and the
        matching house from the Karakamsa in the navamsa. A karaka is read by its dignity in the rasi and navamsa, by the planets joined with it and aspecting it by rasi drishti, and by Rao's rules
        that the Amatyakaraka in a kendra, trine or 11th from the Atmakaraka gives position with less struggle, while Atmakaraka or Amatyakaraka in the 6th, 8th or 12th makes it a struggle. A pada
        is read by its occupants, its aspects and unobstructed argala.
      </p>
      <ul>
        <li>
          Timing follows Rao's checklist: treat the running Chara dasha sign as the lagna and read the houses from it; the 10th for career, the 7th for marriage, the 5th for children and learning, the
          2nd and 11th for money and the 12th for outflow, the 4th and 9th for home and parents, the 6th and 8th for illness, disputes and reversals. Each antardasha sign is read the same way.
        </li>
        <li>
          A period also carries an area when its sign is the area's pada, holds the area's karaka, or is on the 1–7 axis with either or aspects it by rasi drishti. For marriage the Darakaraka's navamsa
          sign and the 7th lord are added to the anchors, as Rao does.
        </li>
        <li>
          Cautions from Rao are shown as strain: an antardasha 6th or 8th from the mahadasha sign (more so when the Atmakaraka aspects it); the Atmakaraka in the 8th from the running sign; Leo and
          Sagittarius as signs of rise and fall, Sagittarius under the Atmakaraka's aspect for violent events; the 6th from the lagna as a maraka house for children; the Atmakaraka's own period as one
          that can bring a fall as well as a rise.
        </li>
        <li>
          Transit check. Rao's confirming step is the transit of Jupiter and Saturn: a period is trusted when one of them, and best both at once (double transit), is on or aspecting the area's
          anchors, its karaka, its pada, its house from the lagna, or the running dasha sign. The check under each period and antardasha lists where the two planets stand, which anchors they touch,
          and the months in which both touch the same anchor. Rao reads these transits with the planets' own aspects, Jupiter to the 5th, 7th and 9th and Saturn to the 3rd, 7th and 10th, so that is
          what the check uses; it is kept apart from the rasi drishti of the dasha reading, and transits are read from the natal signs, not from the dasha sign as lagna.
        </li>
        <li>
          Rao also insists that Chara dasha results be confirmed against Vimshottari and the navamsa. The app keeps the dasha systems apart, so the dasha reading here is Jaimini alone; treat it as
          one witness, not a verdict.
        </li>
      </ul>
      <p>
        Sources:{" "}
        <a href="https://www.journalofastrology.com/product_details.php?item_id=131" {...ext}>
          K.N. Rao, Predicting through Jaimini's Chara Dasha (Vani Publications; listing at Journal of Astrology)
        </a>
        ,{" "}
        <a href="https://www.journalofastrology.com/article.php?article_id=321" {...ext}>
          K.N. Rao, "Jaimini Chara Dasha, my approach", part 3 (Journal of Astrology)
        </a>
        .
      </p>
      <h2>The sutra text and the rules drawn from it</h2>
      <p>
        The Rule book carries the text of Jaimini Sutras, Adhyayas 1 and 2 (388 sutras), in{" "}
        <a href="https://archive.org/details/in.ernet.dli.2015.134405" {...ext}>
          B. Suryanarain Rao's English translation
        </a>{" "}
        with his notes, recovered from a scanned copy and not yet proofread. Every finding that cites a sutra links to the passage, so the reading can be checked against the words. A second set of
        rules was written from that text: from 1.2, Ketu in the Karakamsa under different aspects, the 10th from the Karakamsa for steadiness and standing at work, the 4th and 5th for health and for
        skills, Venus or Mercury aspecting the Karakamsa and the Moon for vocation, Saturn and Venus in a malefic sign, and Rahu in the 5th or 9th; from 1.3, the planets in the 11th and 12th from
        the Arudha lagna as the sources of gain and expense, the nodes on the 7th, the Arudha lagna's house from the lagna, padas in the 6th, 8th and 12th, argala on the Arudha lagna, a planet aspecting
        the lagna, Hora lagna and Ghatika lagna together, and the lords' aspects of 1.3.38-41; for wealth, the Dhana pada (A2) and Labha pada (A11) counted from the Arudha lagna, argala on the 11th
        from the Arudha lagna with its 12th free of malefics, Jupiter, Venus, the Moon or an exalted planet in the 7th from it, and Mercury, Jupiter or Venus exalted in its 2nd, all from Parashara's
        Arudha chapter (
        <a href="http://jyotishvidya.com/ch29.htm" {...ext}>
          BPHS chapter 29
        </a>
        , verses 13-15, 25-37); the mutual placement of A2 and A11 is marked provisional because Parashara compares each pada with the Arudha lagna, not two padas with each other; from 1.4, the Atmakaraka on the 2nd of the Upapada, the 2nd for the spouse's health, the 7th and its
        5th for children, the 3rd and 11th for siblings, and the nodes on the 8th. The sutras that name a spouse's death or a marriage's end are phrased as strain or separation risk; the raw text stays
        in the library. Sutras 1.4.44-49 are not applied.
      </p>
      <p>
        Hora lagna and Ghatika lagna (1.1.31-32) are the Sun's sidereal position at the preceding sunrise advanced by 30° and 75° for each hour of birth; sunrise is taken from the Swiss Ephemeris for the
        birth place. Where the Karakamsa rules of 1.2.102-116 name "the Karakamsa or the 5th from it", both houses are now read.
      </p>
      <h2>Span of life, Adhyaya 2.1</h2>
      <p>
        The text's first method pairs three couples of signs, the lords of the lagna and the 8th, the Moon and Saturn, and the lagna with the Hora lagna, and reads each pair by the nature of its signs:
        two movable or two dual signs give a long span, two fixed a short one, one movable with one fixed a middle span, movable with dual a short span, fixed with dual a long span (2.1.1-6). The
        majority decides (2.1.7); when all three differ the lagna and Hora lagna pair is preferred (2.1.8); when the Moon is in the lagna or the 7th the Moon and Saturn pair decides (2.1.9). Saturn in
        the lagna or the 7th lowers the bracket by one step unless it is exalted, in its own sign, or under two or more malefic influences (2.1.10-13); Jupiter there, free of malefics, raises it
        (2.1.14). The app stops at this classification and does not attempt the Rudra, Maheswara and Brahma timing that follows in the text. The three brackets are wide, translators differ on the
        pair table, and the section is shown as a description of the chart's classical sort, not a forecast.
      </p>
      <h2>Benefics and malefics</h2>
      <p>
        For the Arudha and Upapada rules Jupiter, Venus and Mercury are benefic; Mars, Saturn, Rahu and Ketu are malefic; the Sun counts as benefic when exalted, in its own sign or in a friend's sign
        (Jaimini Sutras 1.4); the Moon is benefic in the bright half of the month, from new to full.
      </p>
      <h2>Ascendant</h2>
      <p>
        The ascendant is the sidereal rising degree computed by the Swiss Ephemeris for the birth time and place. Birth time precision matters far more here than in the Nadi reading: a few minutes can
        change the lagna sign and, with it, every pada and the whole Chara dasha sequence.
      </p>
    </div>
  );
}

function KpMethod() {
  return (
    <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-base" data-testid="about-kp">
      <p>
        Krishnamurti Paddhati (KP) is Prof. K.S. Krishnamurti's stellar method. It is a separate mode on the chart page and shares nothing with the Nadi, Jaimini or ALP readings except the birth data.
        Everything in it is recomputed with the Krishnamurti ayanamsa, whatever ayanamsa the chart was saved with, because the sub boundaries are narrow enough for the difference to matter.
      </p>
      <h2>Cusps, stars and subs</h2>
      <p>
        House cusps are Placidus, and a bhava runs from one cusp to the next, so a planet a few degrees before a cusp already belongs to the next house. Each nakshatra of 13°20' is divided into nine
        unequal subs in the Vimshottari proportion (7, 20, 6, 10, 7, 18, 16, 19, 17 out of 120), starting with the star's own lord, giving 249 subs across the zodiac; each sub is divided the same way
        again for the sub-sub. Every cusp and planet is therefore labelled by its sign lord, star lord, sub lord and sub-sub lord.
      </p>
      <h2>Significators</h2>
      <p>
        Krishnamurti's four steps rank a planet's signification: the house occupied by its star lord, the house it occupies itself, the houses owned by its star lord, and the houses it owns. The class
        notes add two further steps, the sub lord's occupancy and ownership, offered here as a 6-step toggle. Rahu and Ketu own no sign; they act for the lord of the sign they are in and for any planet
        sharing that sign or aspecting them. The house-wise table lists the same links from the house's side: planets in the star of the occupants, the occupants, planets in the star of the owner, the
        owner.
      </p>
      <h2>The cuspal sub lord decides</h2>
      <p>
        The rule that gives KP its shape: a house delivers its matters only if the sub lord of its cusp is a significator of houses favourable to them, and denies them if it signifies the houses that
        negate them. For the 7th cusp, marriage is promised when the sub lord signifies 2, 7 or 11 and denied when it signifies 1, 6 or 10 without them. The reading section applies this cusp by cusp.
        The 1st and 2nd cusp rules are from the Kalpurush Astrology class notes; the consolidated rules for all twelve cusps are paraphrased from chapter 6 of Astro Secrets & KP Part 3, cited by page; the house-by-house chapter of Part 1 (ch. 16) is being entered one house at a time and cross-checked against the bhava rules Dr. Andrew Dutta publishes freely.
        The badhaka house (11th for a movable lagna, 9th for fixed, 7th for dual) and the marakas (2nd and 7th) are marked wherever they appear.
      </p>
      <h2>Timing</h2>
      <p>
        Vimshottari dasa from the Moon's star, with the balance at birth taken from the Moon's progress through it. An event promised by the cusp fructifies when the dasa, bhukti and antara lords are
        all significators of the houses concerned; the joint period finder lists every such window in the next thirty years for a chosen matter. Transits are not yet applied.
      </p>
      <h2>Ruling planets</h2>
      <p>
        At the moment of judgement the lords of the rising sign and star, the Moon's sign and star, and the weekday (counted from the last sunrise) are the ruling planets. KP uses them to rectify
        birth time, to answer horary questions and to choose between competing significators. They belong to the place where the astrologer is judging, not the birth place: in the Part 3 case the
        native was born in Karur but the ruling planets were taken for Trivandrum, where the author sat with the chart (Part 3, pp. 161-162). The rising sign and the day lord change with
        longitude; only the Moon's lords are the same everywhere. The chart page therefore asks where you are judging from, either the device's location (if you allow it) or a place you type, and
        falls back to the birth place until you set one. The choice stays on this device.
      </p>
      <h2>Birth time rectification</h2>
      <p>
        Rectification has its own tab on the chart page, because it changes the birth time that every reading depends on and is not itself a reading. The tab scans a window around the recorded time,
        cuts it at every change of the lagna's sign, star or sub lord, and scores each interval by one method at a time, never blended, in the same way the reading systems are kept apart. One scan
        serves all methods. A chosen interval can be saved as a copy of the chart, with a note recording the method, its source and the inputs; the original is never altered.
      </p>
      <ul>
        <li>
          KP, ruling planets: the lagna's three lords at the true time agree with the ruling planets of the moment of judgement, the sub lord being decisive (Astro Secrets & KP Part 3 ch. 30, pp. 160-163; Part
          1 pp. 173-178). A node in a ruling planet's sign or star acts for it; a retrograde ruling planet is doubtful and its star lord is admitted in its place at half weight (Part 1 p. 174). The ruling
          planets belong to the astrologer's place and change with the hour, so repeat on another occasion and trust the interval that agrees every time.
        </li>
        <li>
          KP, Moon lords: the lagna cusp sub lord at the true time tells the birth star, being its lord or standing in that lord's star, sub, sub-sub or sookshma, or reaching it through the planet whose sub it occupies; failing the star it should at least own or stand in the Moon sign, the very birth star being the stronger confirmation (M.P. Shanmugham, "Birth time verification", Part 2 pp. 80-82). It needs no events and no ruling planets, so it serves as a first sieve; Shanmugham adds that the corrected time must stay within the time the family gave.
        </li>
        <li>
          KP, dated events: at each event the native remembers, the dasa, bhukti and antara lords must be significators of the houses of that matter and the cusp concerned must promise it through its sub
          lord (Part 1 pp. 167-172; Part 2 p. 203). The events are chosen from a list of matters with their KP houses.
        </li>
        <li>
          KP, transits: the sub the Sun transits on the day one works points to the lagna sub (N. Nataraj, Part 2 p. 192), scored as a hint; and on the day of an event the dasa and bhukti lords transit the
          sign, star and sub of significators of the matter (Part 2 p. 203), checked for each candidate against its own significators.
        </li>
        <li>
          Jaimini, chara dasha (K.N. Rao's method): when a horoscope is in doubt, run the chara dasha and see whether the mahadasha and antardasha signs running at indisputable events carry those matters, using the same triggers as the Jaimini tab's timing: the area's karaka in its house counted from the dasha sign, the dasha sign being the area's pada or the karaka's own sign, or facing them across the 1–7 axis. Rao's own statement of the step, verify indisputable events such as education, marriage, children and career with chara dasha before accepting a horoscope, is in{" "}
          <a href="https://www.journalofastrology.com/article.php?article_id=321" {...ext}>
            "Jaimini Chara Dasha, my approach", part 3 (Journal of Astrology)
          </a>
          , and the method itself in Predicting through Jaimini's Chara Dasha (Vani Publications). The check is whole-sign, so the table shows one row per rising sign; it settles the sign and leaves the minute to a KP method. Bhrigu Nandi Nadi reads without a lagna and offers no rectification method.
        </li>
      </ul>
      <h2>Sources</h2>
      <p>
        Astro Secrets & KP Parts 1 to 3 and the Kalpurush Astrology class notes (KP classes 3.1, 3.2 and 4.1), from the user's own copies; the rules are paraphrased, never reproduced, and each is
        cited by volume and page. Event rules per house are cross-checked against{" "}
        <a href="https://kpastrologylearning.com/free-kp-astrology-rules/" target="_blank" rel="noreferrer">
          Dr. Andrew Dutta's free KP bhava rules
        </a>
        , which the author asks to be shared with acknowledgement. General method also follows K.S. Krishnamurti's KP Readers as summarised at{" "}
        <a href="https://kpastrology.astrosage.com/kp-learning-home/resources" target="_blank" rel="noreferrer">
          kpastrology.astrosage.com
        </a>
        .
      </p>
    </div>
  );
}

function ParashariMethod() {
  const B = (ch: number) => `http://jyotishvidya.com/ch${ch}.htm`;
  return (
    <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-base" data-testid="about-parashari">
      <p>
        The Parashari mode follows Brihat Parashara Hora Sastra (BPHS) in R. Santhanam's English translation, as published chapter by chapter at{" "}
        <a href={B(24)} target="_blank" rel="noreferrer">jyotishvidya.com</a>. It is a separate mode and shares nothing with the Nadi, Jaimini, ALP or KP readings except the birth data. It uses the chart's saved
        ayanamsa (Lahiri by default) and whole-sign bhavas counted from the rising sign; the seven planets own their traditional signs and the nodes own none.
      </p>
      <h2>Lords in houses</h2>
      <p>
        Chapter 24 gives one verse for each of the 144 placements of a house lord in a house. Each is paraphrased in softened, modern wording with the verse number kept, so a reading can be checked
        against the text (<a href={B(24)} target="_blank" rel="noreferrer">BPHS 24.1-144</a>). Parashara ends the chapter by scaling every result to the lord's strength, full, half or a quarter, and
        cancelling contradictory results where a planet owns two houses (24.145-148). Shadbala is not yet computed, so the scaling is left to the reader.
      </p>
      <h2>Aspects</h2>
      <p>
        Graha drishti is taken sign to sign from chapter 26: every planet aspects the 7th fully; Saturn also the 3rd and 10th, Jupiter the 5th and 9th, Mars the 4th and 8th; otherwise 3rd and 10th a
        quarter, 5th and 9th a half, 4th and 8th three quarters (<a href={B(26)} target="_blank" rel="noreferrer">BPHS 26.2-5</a>). The degree-based Sphuta drishti of the same chapter is not applied. The nodes receive no aspecting
        power in the chapter and are given none.
      </p>
      <h2>Nature of the planets</h2>
      <p>
        Chapter 34 sets the general rule, angle lords neutralised, trine lords auspicious, lords of the 3rd, 6th and 11th inauspicious, the 8th lord unhelpful unless it also owns the lagna (34.2-7), the
        natural benefics and malefics (34.8-10), and then states for each rising sign which planets are auspicious, malefic, yoga-giving and killing (<a href={B(34)} target="_blank" rel="noreferrer">BPHS 34.19-44</a>).
        The panel shows Parashara's own lists for the chart's lagna, together with the generic class by lordship.
      </p>
      <h2>Yogas evaluated in this pass</h2>
      <ul>
        <li>Kendra-trikona relationship by conjunction, mutual aspect or exchange, with the dilution Parashara notes when the planet also owns a 3rd, 6th, 8th, 11th or 12th (34.11-15; also 41.28); a node in an angle with a trine lord or in a trine with an angle lord (34.16-17).</li>
        <li>Subha and Asubha, Gajakesari, Amala, Parvata, Chamara, Sankha, Khadga, Lakshmi and Kalanidhi from chapter 36 (<a href={B(36)} target="_blank" rel="noreferrer">BPHS 36.1-32</a>). Kahala, Bheri, Mridanga, Srinatha, Sarada, Matsya, Koorma, Kusuma, Kalpadruma and the Trimurti yogas need planetary strength or the navamsa and are not yet evaluated.</li>
        <li>The five Mahapurusha yogas, a planet in its own or exaltation sign in an angle from the lagna (<a href={B(75)} target="_blank" rel="noreferrer">BPHS 75.1-2</a>).</li>
        <li>Wealth through the 5th and 9th lords and planets joined to them, to be read in their periods (<a href={B(41)} target="_blank" rel="noreferrer">BPHS 41.16-17</a>). The specific 5th-11th combinations of 41.2-15 are not yet entered.</li>
        <li>Penury combinations involving the lagna lord, the 6th, 8th and 12th lords and the killer planets (<a href={B(42)} target="_blank" rel="noreferrer">BPHS 42.2-6</a>); Mars with Saturn in the 2nd is shown as provisional because its cancellations (42.16-18) are not yet evaluated.</li>
      </ul>
      <h2>Timing</h2>
      <p>
        Vimshottari dasa is computed from the Lahiri Moon with the same arithmetic as the KP mode. Each dasa lord is glossed by the houses it owns and occupies and by its functional role for the
        rising sign, and its period is then read from Parashara's own dasa chapters (Santhanam translation):
      </p>
      <ul>
        <li>
          Chapter 47, effects of dasas: the general rule (47.5-6: favourable when the lord is in the lagna, exalted, own or friendly sign; unfavourable in the 6th, 8th or 12th, debilitated or inimical) and the
          planet-by-planet conditions for each of the nine lords (47.7-89). The drekkana rule of 47.3-4 places the lord's results at the start, middle or end of the dasa, reversed when it is retrograde. Verses
          that turn on strength or on the navamsa are matched on dignity and the navamsa sign; each dasa reading also carries a Shadbala note from chapter 27 against the requirement of 27.32-33.
        </li>
        <li>
          Chapter 27, Shadbala: the six strengths in virupas for the seven planets. Sthana (Uchcha 27.1-2; Saptavargaja 27.2-4 over rasi, hora, drekkana, saptamsa, navamsa, dwadasamsa and trimsamsa, valued by the
          compound friendship of 3.55-58 with moolatrikona by the degree ranges of 3.51-54; Ojhayugma 27.4; Kendradi 27.5; Drekkana 27.6), Dig (27.7), Kala (Nathonnatha 27.8-9, Paksha 27.10-11, Tribhaga 27.12,
          lords of the year, month, day and hora 27.13, Ayana 27.15-17), Chesta (27.18 for the luminaries, 27.24-25 for the others, using mean longitudes), Naisargika (27.14) and Drik (27.19, with the aspect
          values of 26.6-12 and Jupiter and Mercury counted as benefics). Planetary war follows 27.20. Totals are set against 27.32-33 and the component requirements of 27.34-36, and the strength qualifier of
          24.145-148 is attached to each lord-in-house reading. Provisional points: the hora sequence, the drik sign convention, the war rule and the half and quarter thresholds are not spelt out in the text.
          Not applied: the motion table of 27.21-23 (the mean-motion arc is used instead). The Sun's Ayana bala is not doubled.
        </li>
        <li>
          Bhava bala, 27.26-31: each cusp (the lagna degree plus multiples of 30, so it stays inside the whole-sign house) is measured from the descendant, nadir, lagna or meridian according to the class of its
          sign (27.26-28), a quarter of each benefic aspect on it is added and of each malefic aspect taken away, the whole aspect of Jupiter and Mercury and the lord's Shadbala are added (27.29), Jupiter or
          Mercury in the house add a rupa and the Sun, Mars or Saturn take one (27.30), and 15 virupas go to head-rising signs for a day birth, back-rising for a night birth and dual signs at twilight (27.31,
          with the rising of the signs from chapter 4). Twilight as one ghati either side of sunrise or sunset, and Scorpio as head-rising, are provisional.
        </li>
        <li>
          Chapter 28, Ishta and Kashta phala: the Uchcha and Chesta rasmis (28.2-4, the Sun's Chesta kendra being the tropical Sun plus three signs and the Moon's its distance from the Sun), Subha and Asubha
          rasmis (28.5), Ishta and Kashta out of 60 (28.6, read so that the rasmis run one to seven and the Ishta phala is the mean of the two arcs in virupas), the Saptavarga subhankas and asubhankas (28.7-10)
          and the Dig bala as its own good and ill measure (28.11-12). Each dasa reading states the lord's tendency, as 28.1 directs. 28.13-14 (varga figures scaled by the Shadbala total) and 28.15-20 (net
          effects of the houses: bhava bala with the lord's Shadbala, split by the lord's Ishta and Kashta, then adjusted for planets in and aspecting the house, the lord's dignity and the Sarvashtakavarga
          rekhas of the sign) are applied as an "Effects of the houses" table. The verses give the direction of each step but no scale, so every amount there is marked provisional.
        </li>
        <li>
          Transit at the start of a dasa, 48.8: the dasa lord's sidereal position when the maha dasa begins is placed in a whole-sign house from the natal lagna; an angle or trine reads favourable and the
          6th, 8th or 12th adverse, as the verse says. Other houses are shown as neutral and marked provisional, since the verse names only those two groups. The same transit sign is then read by the dasa
          lord's own Ashtakavarga and by the aggregate (66.70-72, 72.3-5), and the lord's natal sign by the aggregate (72.5-6).
        </li>
        <li>
          Ashtakavarga, chapters 66-72: the rekha tables of 66.43-68 for the seven planets and the lagna, checked against the dot lists of 66.16-42 (the dot lists win where the two disagree, giving the
          usual totals 48, 49, 39, 54, 56, 52, 39 and 49); Trikona shodhana (67) and Ekadhipatya shodhana (68); the Rasi, Graha and Yoga pindas (69, with the multipliers of the printed chakras, the verse
          variants being noted); the significations and Saturn transit points of chapter 70 (the 9th from the Sun for father, the 4th from the Moon for mother, the 4th from Mercury, the 5th from Jupiter,
          the 7th from Venus, the 8th from Saturn, and the 3rd from Mars for co-borns as a provisional reading of 70.24-27), the years of distress of 70.37-40, the rekha longevity of 71.1-4, and the
          Sarvashtakavarga of chapter 72 with its bands (72.3-6), the wealth combination of 72.7-8 and the life-thirds of 72.9-10. The monthly dangers of 72.11-28 are not listed. Chapter 66 calls the
          benefic mark a rekha and the malefic a bindu; 28.15-20 says bindu for the benefic mark; the app counts benefic marks and calls them rekhas.
        </li>
        <li>
          Ashtakavarga transits: every sign Saturn and Jupiter pass from birth to a hundred years (retrograde re-entries listed separately) is read by the planet's own chart (66.70-72; 70.43-44 for
          Saturn, five or more rekhas of eight being taken as "more rekhas"), by the aggregate band of the sign (72.3-5) and, for Jupiter's year, by 72.29 and by the Sun's chart (70.19-20, provisional
          because the verse names the mean Jupiter). Saturn's passages are also matched against the nakshatra and sign points of chapter 70 and their trines, using Saturn's nakshatra ingresses from the
          ephemeris, and the ages of 70.37-40 are dated from birth. The father-arishta windows of 70.12-14 (transiting Rahu, Saturn or Mars in the 4th from the Sun during those passages, matured by a malefic on Saturn in the 9th from lagna or Moon or by the 4th lord's dasa, averted by a favourable dasa) are listed with the sign-aspect and dasa-verdict simplifications marked provisional. For the mother, 70.21-23 is applied as written: Saturn's passages over the nakshatra and sign named by the 4th from the Moon (death or distress, death may occur) and their trines (distress), the running dasa being shown only by analogy and marked provisional; the Moon's month lists the signs to avoid for auspicious functions from the Moon's own chart. Mars, Mercury and Venus are followed through their own charts for brothers, family and marriage (70.24-27, 70.28-29, 70.34-36), with the natal notes of those verses: brothers short-lived if Mars is weak, progeny from the 5th from Jupiter with the debilitation and enemy-sign limits and the navamsa count (70.30-33), and the directions of Venus' gains from the 7th from Venus and its trines by the sign directions of chapter 4.
        </li>
        <li>
          Chapter 48, dasas of house lords: the theme of each lordship (48.2-8) and the relationship rules of 48.9-20 (company or aspect of the 5th and 9th lords, angle lord in a trine or trine lord in an
          angle, exchanges of the 1st with the 9th or 10th, the 3rd, 6th and 11th lords and their company, maraka lords in the 2nd or 7th, occupation of the 8th). The lord's transit position when the dasa
          begins (48.8) is evaluated from the ephemeris, see below.
        </li>
        <li>
          Chapters 52 to 60, antar dasas: one chapter per dasa lord, nine sub-periods each, 81 entries in all. For every antar the app lists the placements Parashara names (angle or trine from the lagna,
          dignity, house from the dasa lord, company of the lagna lord or of malefics, 2nd/7th lordship) and shows the chapter's own favourable and adverse conditions, the stated course of the sub-period,
          its maraka note and the remedy named, paraphrased and cited to the verse range. The verdict column is a mechanical tally of matched conditions, not a reading.
        </li>
        <li>
          Chapter 61, pratyantar dasas: the general one-line effects of 61.2-82 are shown for the running antar only, with the caveat of 61.2 that they lapse when the lord is in a trine or an auspicious house.
          Chapters 62 and 63 (sookshma and prana levels) and chapter 64 (Kalachakra antars) are not applied; chapter 50 (Chara dasa effects) belongs with the Jaimini mode and is noted there for later.
        </li>
      </ul>
      <h2>Not yet here</h2>
      <p>
        Bhava chalit (unequal houses), the divisional charts beyond the navamsa and dasamsa already used elsewhere, Neecha Bhanga and Viparita raja yoga (which are not stated in
        these BPHS chapters and would be entered as provisional from Phaladeepika or a similar source), and the sookshma and prana levels. Any rule added from a non-classical source will carry a provisional mark.
      </p>
    </div>
  );
}
