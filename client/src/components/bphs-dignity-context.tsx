import React from "react";
import type { PlanetContext } from "@shared/planet-context";

/** BPHS degree facts are descriptive until a rule explicitly selects them. */
export function BphsDignityContextPanel({ context }: { context: PlanetContext }) {
  const planets = context.planets.filter((p) => p.bphsDignity);
  return <details className="nadi-info-card mt-4 text-xs" data-testid="bphs-dignity-context">
    <summary className="nadi-info-summary">Sign and degree dignity · BPHS</summary>
    <p className="mt-2 text-muted-foreground">BPHS identifies exaltation signs and specific moolatrikona degree ranges. These facts can overlap; for example, the Moon can be in its exaltation sign and in the moolatrikona range. <a href="https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" target="_blank" rel="noreferrer" className="underline">BPHS 3.49–54</a>.</p>
    <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[32rem] text-left">
      <thead><tr className="border-b text-muted-foreground"><th>Planet</th><th>Sign · degree</th><th>Existing sign label</th><th>BPHS facts</th></tr></thead>
      <tbody>{planets.map(({ planet, position, bphsDignity: d }) => <tr key={planet} className="border-b last:border-0">
        <td className="py-1">{planet}</td><td>{position.sign} · {position.degInSign.toFixed(2)}°</td><td>{position.dignity}</td>
        <td>{[d!.exaltationSign && "exaltation sign", d!.ownSign && "own sign", d!.moolatrikona && "moolatrikona degree range", d!.explicitExaltationPortion && "specified exaltation portion"].filter(Boolean).join("; ") || "no listed special band"}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="mt-2 text-muted-foreground">The existing general reading uses a single sign-based label. Shadbala and the BPHS 47.81–82 Venus period rule use the degree-bounded moolatrikona fact. This table does not change event scores; other rules still need individual source review.</p>
  </details>;
}
