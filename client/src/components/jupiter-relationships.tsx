import { useMemo, useState } from "react";
import { AYANAMSAS, type ChartResult } from "@shared/schema";
import { SIGNS, type Planet } from "@shared/astro";
import { natalPlanetContext } from "@shared/planet-context";
import { jupiterRelationships, type JupiterDivision } from "@shared/jupiter-relationships";
import { useLocale, useT } from "@/lib/i18n";
import { InfoBox, InfoBoxTitle, InfoBoxDescription, INFO_BOX_ROWS } from "@/components/info-box";

const ordinal = (n: number) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

/** A factual Parashari sign view; it does not run, cancel, or score a prediction. */
export function JupiterRelationshipsPanel({ result }: { result: ChartResult }) {
  const { locale } = useLocale();
  const t = useT();
  const [division, setDivision] = useState<JupiterDivision>("D1");
  const chart = useMemo(() => jupiterRelationships(natalPlanetContext(result), division, result.gulika?.signIndex), [result, division]);
  const ml = locale === "ml";
  const planets = (names: readonly Planet[]) => names.map((p) => t(p)).join(", ");
  const houses = (values: number[]) => values.map((h) => ml ? `${h}` : ordinal(h)).join(ml ? ", " : " and ");
  const ninth = chart.targets.find((target) => target.fromJupiter === 9)!;
  const ayanamsa = AYANAMSAS.find((a) => a.id === result.chart.ayanamsa)?.label ?? result.chart.ayanamsa;

  return <InfoBox className="mt-6 scroll-mt-5" data-testid="jupiter-relationships">
    <InfoBoxTitle>{ml ? "വ്യാഴത്തിന്റെ ബന്ധങ്ങൾ" : "Jupiter and its connections"}</InfoBoxTitle>
    <InfoBoxDescription>{ml
      ? "തിരഞ്ഞെടുത്ത ജാതകത്തിൽ വ്യാഴം നിൽക്കുന്ന ഇടവും അത് നോക്കുന്ന രാശികളും അവിടെയുള്ള ഗ്രഹങ്ങളും കാണാം. ഇവ പരാശരി രീതിയിലെ രാശി അടിസ്ഥാനത്തിലുള്ള വിവരങ്ങളാണ്."
      : "Explore where Jupiter stands, the signs it looks toward, and the planets in those signs. These are sign-based observations used in this Parashari view."}</InfoBoxDescription>
    <p className="mt-2 text-xs text-muted-foreground">{ml
      ? `${t(ayanamsa)} അയനാംശം · പൂർണരാശി ഭാവങ്ങൾ (മറ്റു ഭാവരീതികൾ തിരഞ്ഞെടുത്തിട്ടുണ്ടെങ്കിലും ഈ ദൃശ്യത്തിൽ പൂർണരാശി ഉപയോഗിക്കുന്നു).`
      : `${ayanamsa} ayanamsa · whole-sign houses (used in this view even if another house method is selected).`}</p>
    <div className="mt-4 max-w-xs">
      <label htmlFor="jupiter-division" className="block text-sm font-medium">{ml ? "ജാതകം തിരഞ്ഞെടുക്കുക" : "Choose a chart"}</label>
      <select id="jupiter-division" value={division} onChange={(event) => setDivision(event.target.value as JupiterDivision)}
        className="mt-1 min-h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        data-testid="jupiter-division">
        <option value="D1">{ml ? "ജനനജാതകം (D1)" : "Birth chart (D1)"}</option>
        <option value="D9">{ml ? "നവാംശം (D9)" : "Navamsa (D9)"}</option>
        <option value="D10">{ml ? "ദശാംശം (D10)" : "Dasamsa (D10)"}</option>
      </select>
    </div>
    <p className="mt-4 text-sm leading-relaxed" data-testid="jupiter-position">{ml
      ? `${division} ലഗ്നം ${t(SIGNS[chart.risingSign])} ആണ്. വ്യാഴം ${t(SIGNS[chart.signIndex])} രാശിയിൽ, ${chart.house}-ാം ഭാവത്തിലാണ്.`
      : `In ${division}, ${SIGNS[chart.risingSign]} is rising and Jupiter is in ${SIGNS[chart.signIndex]}, the ${ordinal(chart.house)} house.`}</p>
    <p className="mt-1 text-sm leading-relaxed text-muted-foreground" data-testid="jupiter-lordships">{division === "D1"
      ? ml ? `ഈ ലഗ്നത്തിൽ വ്യാഴം ${houses(chart.natalOwnedHouses)} ഭാവങ്ങളുടെ അധിപനാണ്.` : `From this rising sign, Jupiter rules the ${houses(chart.natalOwnedHouses)} houses.`
      : ml ? `ഈ വിഭജനജാതകത്തിൽ വ്യാഴം ${houses(chart.divisionOwnedHouses)} ഭാവങ്ങളുടെ അധിപനാണ്; ജനനജാതകത്തിലെ അധിപത്യം ${houses(chart.natalOwnedHouses)} ഭാവങ്ങളിലാണ്.`
        : `In this divisional chart Jupiter rules the ${houses(chart.divisionOwnedHouses)} houses. In the birth chart it rules the ${houses(chart.natalOwnedHouses)} houses.`}</p>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ml
      ? "ഭാവം ജീവിതത്തിന്റെ ഒരു മേഖലയെ സൂചിപ്പിക്കുന്നു. ‘നോട്ടം’ അഥവാ ദൃഷ്ടി രാശികൾ തമ്മിലുള്ള പരമ്പരാഗത ജ്യോതിഷബന്ധമാണ്; അത് സംഭവമോ ഫലമോ ഉറപ്പിക്കുന്നില്ല."
      : "A house represents an area of life. An aspect is a traditional relationship between signs; it does not by itself establish an outcome."}</p>

    <div className={`${INFO_BOX_ROWS} mt-4`}>
      {chart.targets.map((target) => <div className="nadi-info-row" key={target.fromJupiter} data-testid={`jupiter-target-${target.fromJupiter}`}>
        <p className="text-sm font-semibold">{ml ? `വ്യാഴത്തിൽനിന്ന് ${target.fromJupiter}-ാം രാശി` : `${ordinal(target.fromJupiter)} from Jupiter`}</p>
        <div className="min-w-0">
          <p className="text-sm font-medium">{ml ? `${t(SIGNS[target.signIndex])} · ${division}-ലെ ${target.house}-ാം ഭാവം` : `${SIGNS[target.signIndex]} · ${ordinal(target.house)} house in ${division}`}</p>
          <p className="mt-1 text-sm leading-relaxed">{ml
            ? `രാശിയിലുള്ള ഗ്രഹങ്ങൾ: ${target.occupants.length ? planets(target.occupants) : "ഒന്നുമില്ല"}. രാശ്യധിപൻ: ${t(target.lord)}.`
            : `Planets in the sign: ${target.occupants.length ? planets(target.occupants) : "none"}. Sign ruler: ${target.lord}.`}</p>
          {target.gulika && <p className="mt-1 text-xs text-muted-foreground">{ml ? "തിരഞ്ഞെടുത്ത ഗുളികയും ഈ രാശിയിലാണ്; അത് ഗ്രഹപ്പട്ടികയിൽ ഉൾപ്പെടുന്നില്ല." : "The selected Gulika point is also in this sign; it is not included in the planet list."}</p>}
        </div>
      </div>)}
    </div>
    {division !== "D1" && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ml
      ? "വിഭജനജാതകത്തിലെ ലഗ്നവും ഗ്രഹങ്ങളുടെ വിഭജനരാശികളും നൽകിയ ജനനസമയത്തെ ആശ്രയിക്കുന്നു; ചെറിയ സമയവ്യത്യാസത്തിൽ അവ മാറാം. ഇവിടെ ഗുളികയുടെ വിഭജനസ്ഥാനം കണക്കാക്കുന്നില്ല."
      : "Divisional rising signs and placements depend on the entered birth time and can change with a small time difference. Gulika is not projected into this view."}</p>}

    {division === "D1" && <details className="nadi-info-disclosure mt-4" data-testid="jupiter-research-note">
      <summary className="nadi-info-summary">{ml ? "ഒൻപതാം രാശിയെക്കുറിച്ചുള്ള ഗവേഷണ സൂചന" : "Research note: the ninth from Jupiter"}</summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed">
        <p>{ml
          ? `ഇവിടെ വ്യാഴത്തിൽനിന്ന് ഒൻപതാം രാശി ${t(SIGNS[ninth.signIndex])} ആണ്. പരമ്പരാഗത ഏഴ് ഗ്രഹങ്ങളിൽ അവിടെയുള്ളത്: ${ninth.classicalOccupants.length ? planets(ninth.classicalOccupants) : "ഒന്നുമില്ല"}; രാഹു/കേതു: ${ninth.nodeOccupants.length ? planets(ninth.nodeOccupants) : "ഇല്ല"}.`
          : `Here the ninth sign from Jupiter is ${SIGNS[ninth.signIndex]}. Classical planets there: ${ninth.classicalOccupants.length ? planets(ninth.classicalOccupants) : "none"}; Rahu or Ketu: ${ninth.nodeOccupants.length ? planets(ninth.nodeOccupants) : "none"}.`}</p>
        {chart.house === 5 && <p>{ml ? "ഈ ജാതകത്തിൽ വ്യാഴം അഞ്ചാം ഭാവത്തിലായതിനാൽ വ്യാഴത്തിൽനിന്നുള്ള ഒൻപതാം രാശി ലഗ്നരാശി തന്നെയാണ്. ഇവ രണ്ടും സ്വതന്ത്ര സൂചനകളല്ല." : "Because Jupiter is in the fifth house here, the ninth sign from Jupiter is also the rising sign. These are the same placement, not two independent clues."}</p>}
        <p>{ml
          ? "2026-ലെ പ്രഭാഷണത്തിൽ രാമൻ സുപ്രജരാമ, വ്യാഴം കാരകനായ ഭാവത്തിൽ നിൽക്കുമ്പോൾ ഉണ്ടാകാമെന്നു പറയുന്ന ഒരു പരമ്പരാഗത ആശങ്കയ്ക്ക് ഒൻപതാം രാശിയിലെ ഗ്രഹം പരിഹാരമാകാമെന്ന് നിർദ്ദേശിക്കുന്നു. ആ നിയമത്തിൽ രാഹുവിനെയും കേതുവിനെയും എണ്ണണമോ എന്ന് വ്യക്തമല്ല. ഇത് പരീക്ഷണപരമായ സൂചനയാണ്; ഇവിടെ യാന്ത്രികമായ ഒഴിവാക്കലോ പ്രവചനമോ ചെയ്യുന്നില്ല."
          : "In a 2026 lecture, Raman Suprajarama suggests that a planet in this ninth sign may counter a traditional concern when Jupiter occupies an area it signifies. Whether his rule includes the nodes is unspecified. This is an unverified research clue; the view does not automatically cancel a finding or make a prediction."}</p>
        <p className="text-xs text-muted-foreground">{ml
          ? "ഉറവിടം: Jupiter in your Horoscope, 2026, ഏകദേശം 22:25–22:59; പ്രഭാഷണ ട്രാൻസ്ക്രിപ്റ്റ്."
          : "Source: Jupiter in your Horoscope, 2026, approximately 22:25–22:59; lecture transcript."}</p>
      </div>
    </details>}

    <details className="nadi-info-disclosure mt-3" data-testid="jupiter-technical-note">
      <summary className="nadi-info-summary">{ml ? "കണക്കും സ്രോതസ്സുകളും" : "Calculation and sources"}</summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <p>{ml
          ? `${division} രാശികൾ പൂർണരാശി രീതിയിൽ എണ്ണുന്നു. വ്യാഴത്തിന്റെ 5, 7, 9 ദൃഷ്ടികൾ ഇവിടെ പൂർണ രാശിദൃഷ്ടികളായി കാണിക്കുന്നു; അംശബലം കണക്കാക്കുന്നില്ല. രാഹുവിനെയും കേതുവിനെയും സ്വീകരിക്കുന്ന സ്ഥാനങ്ങളായി കാണാം; പരാശരി ദൃഷ്ടി വീശുന്ന ഗ്രഹങ്ങളായി ഇവിടെ എണ്ണുന്നില്ല.`
          : `This ${division} view counts whole signs. Jupiter's 5th, 7th and 9th are displayed as full sign aspects, without degree-based aspect strength. Rahu and Ketu can receive an aspect here; this convention does not give them outgoing planetary aspects.`} <a className="underline" href="https://jyotishvidya.com/ch26.htm" target="_blank" rel="noreferrer">BPHS 26.2–5</a>.</p>
        <p>{ml
          ? "സഞ്ജയ് രഥ് ഗുരുദൃഷ്ടി പ്രഭാഷണത്തിൽ ഏഴാം ദൃഷ്ടിയെ അഞ്ചാം/ഒൻപതാം ദൃഷ്ടികളെക്കാൾ ദുർബലമായ അർധദൃഷ്ടിയായി കാണുന്നു. ആ ഭിന്നാഭിപ്രായം ഇവിടെ ദൃഷ്ടിയുടെ കണക്ക് മാറ്റുന്നില്ല."
          : "In his Guru Drishti lecture, Sanjay Rath treats the seventh as a weaker half aspect than the fifth and ninth. That alternative does not change the aspect calculation shown here."}</p>
        <p>{ml
          ? `വ്യാഴത്തിന്റെ അതേ രാശിയിൽ: ${chart.sameSign.length ? chart.sameSign.map((p) => `${t(p.planet)}${p.natalSeparation === null ? "" : ` (${p.natalSeparation.toFixed(1)}°)`}`).join(", ") : "മറ്റൊരു ഗ്രഹവുമില്ല"}. വ്യാഴത്തിലേക്ക് പൂർണ ദൃഷ്ടിയുള്ള ഗ്രഹങ്ങൾ: ${chart.incomingFullAspects.length ? planets(chart.incomingFullAspects) : "ഒന്നുമില്ല"}.`
          : `In Jupiter's sign: ${chart.sameSign.length ? chart.sameSign.map((p) => `${p.planet}${p.natalSeparation === null ? "" : ` (${p.natalSeparation.toFixed(1)}° apart)`}`).join(", ") : "no other planets"}. Planets with a full aspect toward Jupiter: ${chart.incomingFullAspects.length ? planets(chart.incomingFullAspects) : "none"}.`}</p>
        <p>{ml
          ? "ഒരേ രാശിയിലുള്ള ഗ്രഹങ്ങൾ എല്ലായ്പ്പോഴും അടുത്ത അംശങ്ങളിലായിരിക്കണമെന്നില്ല. D1-ൽ കാണുന്ന അകലം ജനനദീർഘാംശങ്ങൾ തമ്മിലുള്ളതാണ്. വ്യാഴത്തിന്റെ വക്രഗതി ജനനസമയത്തേതാണ്; ഈ ദൃശ്യത്തിൽ ദൃഷ്ടികളുടെ ക്രമം മാറ്റുന്നില്ല."
          : "Sharing a sign does not necessarily mean a close conjunction; D1 separations use natal longitudes. Retrograde, if present, is the natal apparent motion and does not reverse the sign count in this view."}</p>
        <p>{ml
          ? "സുപ്രജരാമയുടെ പ്രഭാഷണത്തിലെ വക്രഗ്രഹങ്ങളെ വിപരീതമായി എണ്ണുന്ന രീതി ഈ ദൃശ്യത്തിൽ പ്രയോഗിച്ചിട്ടില്ല."
          : "Suprajarama's lecture also describes reverse counting for retrograde planets; that alternative is not applied in this view."}</p>
        <p>{ml ? `ജനനസമയത്ത് വ്യാഴം ${chart.natalRetrograde ? "വക്രഗതിയിലായിരുന്നു" : "നേർഗതിയിലായിരുന്നു"}.` : `Jupiter's natal apparent motion was ${chart.natalRetrograde ? "retrograde" : "direct"}.`}</p>
        <p>{ml
          ? "രാശ്യധിപൻ പരമ്പരാഗത ഏഴ് ഗ്രഹങ്ങളിലുള്ള അധിപനാണ്. ചില രീതികളിൽ കുംഭത്തിനും വൃശ്ചികത്തിനും സഹ-അധിപന്മാരെയും പരിഗണിക്കുന്നു. ഈ ദൃശ്യം സ്കോറുകളോ മറ്റു രീതികളുടെ നിയമങ്ങളോ മാറ്റുന്നില്ല."
          : "Sign rulers use the seven classical planets. Some traditions also use co-rulers for Aquarius and Scorpio. This view does not change scores or other schools' rules."}</p>
      </div>
    </details>
  </InfoBox>;
}
