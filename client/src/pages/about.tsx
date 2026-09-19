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
          <li>Trines: the 5th and 9th signs, harmonious support.</li>
          <li>7th: opposition, a face-to-face influence.</li>
          <li>Retrograde: a retrograde classical planet also delivers results from the previous sign, so it is evaluated from both.</li>
        </ul>
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
          come to life. Saturn's slower passage (about two and a half years a sign) marks periods of pressure and consolidation. The app computes exact sidereal ingress dates from the Swiss
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
