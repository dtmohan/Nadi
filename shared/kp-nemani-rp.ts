import type { Planet } from "./astro";
import { kpPoint } from "./kp";

type Lords = { starLord: Planet; subLord: Planet };
type Level = "sign" | "star" | "sub";

export interface NemaniRpMoonCheck {
  moon: { signLord: Planet; starLord: Planet; subLord: Planet };
  linked: Record<Level, boolean>;
  via: Record<Level, string>;
  all: boolean;
}

/**
 * Nemani's RBT procedure uses the judgment chart for *both* planets in a
 * connection. A direct star/sub link or a two-step star/sub chain can run in
 * either direction, as illustrated by the worked examples. Sign-only links,
 * arbitrary chains of greater length and shared dispositors are not inferred.
 * The three-level conjunction is a method match, not evidence of accuracy.
 */
export function nemaniRpMoonCheck(
  asc: { signLord: Planet; starLord: Planet; subLord: Planet },
  moon: { signLord: Planet; starLord: Planet; subLord: Planet },
  positions: Array<{ planet: Planet; lon: number }>,
): NemaniRpMoonCheck {
  const lords = new Map<Planet, Lords>(positions.map(({ planet, lon }) => {
    const p = kpPoint(lon);
    return [planet, { starLord: p.starLord, subLord: p.subLord }];
  }));
  const edge = (from: Planet, to: Planet): string | undefined => {
    const p = lords.get(from);
    if (p?.starLord === to) return `${from} is in ${to}'s star`;
    if (p?.subLord === to) return `${from} is in ${to}'s sub`;
    return undefined;
  };
  const link = (a: Planet, b: Planet): { linked: boolean; via: string } => {
    if (a === b) return { linked: true, via: `${a} is the same planet at both levels` };
    for (const [from, to] of [[a, b], [b, a]] as const) {
      const direct = edge(from, to);
      if (direct) return { linked: true, via: `${direct} in the judgment chart` };
    }
    for (const [from, to] of [[b, a], [a, b]] as const) {
      const p = lords.get(from);
      for (const third of [p?.starLord, p?.subLord]) {
        if (!third || third === from || third === to) continue;
        const first = edge(from, third);
        const second = edge(third, to);
        if (first && second) return { linked: true, via: `${first}; ${second} in the judgment chart` };
      }
    }
    return { linked: false, via: "No direct or two-step star/sub link in the judgment chart" };
  };
  const sign = link(asc.signLord, moon.signLord);
  const star = link(asc.starLord, moon.starLord);
  const sub = link(asc.subLord, moon.subLord);
  return {
    moon,
    linked: { sign: sign.linked, star: star.linked, sub: sub.linked },
    via: { sign: sign.via, star: star.via, sub: sub.via },
    all: sign.linked && star.linked && sub.linked,
  };
}
