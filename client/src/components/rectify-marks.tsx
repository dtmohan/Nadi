import {
  TWELVE_LIMBS,
  limbChecklist,
  type LimbTerms,
  bodyMarkLines,
  limbLabel,
  predictedLimbs,
  scoreMarks,
  type BodyMarksResult,
} from "@shared/body-marks";
import { SIGNS } from "@shared/astro";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { cn } from "@/lib/utils";

/** The limbs a person ticks: any scar, wound, mole or birthmark they carry. Held in memory only. */
export function MarksChecklist({
  confirmed,
  onToggle,
  plain,
  terms,
}: {
  confirmed: Set<string>;
  onToggle: (limb: string) => void;
  plain: boolean;
  terms: LimbTerms;
}) {
  const groups = limbChecklist(terms);
  return (
    <div
      className="mt-3 rounded-md border p-3"
      data-testid="rectify-marks-checklist"
    >
      <p className="text-xs font-medium">
        {plain
          ? "Tick every part of the body that carries a scar, wound, mole or birthmark"
          : "Confirmed marks: tick every limb carrying a scar, wound, mole or birthmark"}
        <span className="ml-1 font-normal text-muted-foreground">
          ({confirmed.size} ticked; kept only while this page is open)
        </span>
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.region}>
            <div className="text-2xs uppercase tracking-wide text-muted-foreground">
              {g.region}{" "}
              <span className="normal-case tracking-normal">
                ({["first", "second", "third"][g.drekkana - 1]} drekkana)
              </span>
            </div>
            <ul className="mt-1 columns-2 gap-x-3 text-xs sm:columns-1">
              {g.limbs.map((l) => {
                const id = `rectify-mark-${l.replace(/\s+/g, "-")}`;
                return (
                  <li key={l} className="break-inside-avoid">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 py-0.5">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-foreground"
                        checked={confirmed.has(l)}
                        onChange={() => onToggle(l)}
                        data-testid={id}
                      />
                      {l}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Green when the person confirmed the limb, grey otherwise. */
export function LimbDots({
  r,
  confirmed,
}: {
  r: BodyMarksResult;
  confirmed: Set<string>;
}) {
  const predicted = predictedLimbs(r);
  if (!predicted.length)
    return (
      <span className="text-muted-foreground">
        no planet or benefic aspect on any house: no mark predicted
      </span>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {predicted.map((l) => {
        const on = confirmed.has(l);
        return (
          <span
            key={l}
            className="inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full align-middle",
                on ? "bg-verdict-good" : "bg-muted-foreground/25",
              )}
              aria-label={on ? "confirmed" : "not confirmed"}
            />
            {l}
          </span>
        );
      })}
    </span>
  );
}

const KIND_CLASS: Record<string, string> = {
  wound: "text-verdict-bad",
  both: "text-verdict-mixed",
  mark: "text-verdict-good",
  aspect: "text-verdict-good",
  none: "text-muted-foreground",
};

/** The full reading of one drekkana: the twelve limbs, the birth-room attendants, build and complexion. */
export function MarksDetail({
  r,
  confirmed,
  plain,
  degrees,
}: {
  r: BodyMarksResult;
  confirmed: Set<string>;
  plain: boolean;
  degrees: string;
}) {
  const src = r.sources;
  const sc = scoreMarks(r, confirmed);
  const lines = bodyMarkLines(r);
  const sixthLimb = TWELVE_LIMBS[5];
  return (
    <div
      className="mt-3 rounded-md border p-3 text-xs"
      data-testid="rectify-marks-detail"
    >
      <p className="font-medium">
        {r.drekkanaLabel}{" "}
        <span className="font-normal text-muted-foreground">
          ({degrees} of <SignName signIndex={r.lagnaSign} />
          ):{" "}
          {plain
            ? `the ${["head", "trunk", "lower body"][r.drekkana - 1]} table`
            : `houses read as the ${["head", "trunk from the neck", "body from the pelvis"][r.drekkana - 1]}`}
          , <SourceLink source={src.v24} />
        </span>
      </p>
      <p className="mt-1 text-muted-foreground">
        {sc.max
          ? `${sc.score} of ${sc.max} predicted limbs confirmed${sc.unexplained.length ? `; ticked but not predicted here: ${sc.unexplained.join(", ")}` : ""}.`
          : "No limb predicted for this drekkana."}
        {plain
          ? " Harsh planets in a house wound that part; helpful planets, or their gaze, leave a mole or mark."
          : " A malefic in a house wounds the limb, a benefic or its aspect marks it,"}{" "}
        <SourceLink source={src.v25} />
      </p>
      <ol
        className="mt-2 grid gap-x-6 gap-y-0.5 sm:grid-cols-2"
        data-testid="rectify-marks-limbs"
      >
        {lines.map((l) => (
          <li
            key={l.house}
            className={cn("flex gap-2", KIND_CLASS[l.kind])}
            data-testid={`rectify-marks-house-${l.house}`}
            data-kind={l.kind}
          >
            <span className="w-4 shrink-0 tabular text-muted-foreground">
              {l.house}
            </span>
            <span className={cn(l.kind === "none" && "text-muted-foreground")}>
              {l.text}
              {confirmed.has(limbLabel(r.limbs[l.house - 1])) && (
                <span className="ml-1 rounded border px-1 text-2xs uppercase tracking-wide text-muted-foreground">
                  ticked
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div data-testid="rectify-marks-526">
          <div className="font-medium">
            Three in a sign; the 6th house <SourceLink source={src.v26} />
          </div>
          {r.crowded.length ? (
            r.crowded.map((c) => (
              <p key={c.house} className="text-muted-foreground">
                {c.planets.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <PlanetName planet={p} abbr />
                  </span>
                ))}{" "}
                together in house {c.house}: a mark on the {limbLabel(c)}{" "}
                without fail.
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">
              No sign holds three planets.
            </p>
          )}
          <p className="text-muted-foreground">
            {r.sixth.malefics.length ? (
              <>
                Malefic{r.sixth.malefics.length > 1 ? "s" : ""} in the 6th (
                {r.sixth.malefics.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <PlanetName planet={p} abbr />
                  </span>
                ))}
                ): a wound about the {sixthLimb} (the 6th limb of the
                twelve-fold body, 1.4)
                {r.sixth.aspectedByBenefic
                  ? "; under a benefic's aspect it is a dark and a white mole instead"
                  : ""}
                .
              </>
            ) : (
              "No malefic in the 6th."
            )}
            {r.sixth.benefics.length ? (
              <>
                {" "}
                Benefic{r.sixth.benefics.length > 1 ? "s" : ""} in the 6th:
                dense hair there <SourceLink source={src.commentary} />.
              </>
            ) : null}
          </p>
        </div>
        <div data-testid="rectify-marks-522">
          <div className="font-medium">
            {plain ? "People in the birth room" : "Attendants at the birth"}{" "}
            <SourceLink source={src.v22} />
          </div>
          {r.attendants.length ? (
            <ul className="text-muted-foreground">
              {r.attendants.map((a) => (
                <li key={a.planet}>
                  <PlanetName planet={a.planet} abbr /> in house {a.house}:{" "}
                  {a.visible ? "outside the room" : "inside the room"},{" "}
                  {a.wellDressed ? "well dressed" : "poorly dressed"}
                </li>
              ))}
              <li>
                {r.attendants.length} attendant
                {r.attendants.length > 1 ? "s" : ""} in all; some commentators
                reverse inside and outside.
              </li>
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No planet between the lagna and the Moon: the verse names no
              attendant.
            </p>
          )}
          <div className="mt-2 font-medium">
            Build and complexion <SourceLink source={src.v23} />
          </div>
          <p className="text-muted-foreground">
            Build after <PlanetName planet={r.build.navamsaLord} abbr />, lord
            of the rising navamsa ({SIGNS[r.build.navamsaSign]}); complexion
            after <PlanetName planet={r.complexion.navamsaLord} abbr />, lord of
            the Moon's navamsa ({SIGNS[r.complexion.navamsaSign]}):{" "}
            {r.complexion.colour}, <SourceLink source={src.colours} />. Iyer's
            commentator adds that country and climate temper the colour.
          </p>
        </div>
      </div>

      <div
        className="mt-3 text-muted-foreground"
        data-testid="rectify-marks-caveats"
      >
        <div className="font-medium">Readings marked provisional</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {r.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <p className="mt-1">
          <SourceLink source={src.iyer} /> <SourceLink source={src.adyar} />{" "}
          <SourceLink source={src.commentary} />
        </p>
      </div>
    </div>
  );
}
