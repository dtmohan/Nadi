// Birth-time windows for the sixteen divisional lagnas: the minutes before and after the recorded
// moment during which each chart's lagna keeps its sign. The ascendant is sampled every ten seconds
// outward from the birth moment, and each change is bisected to about a second.
import { ascendantAt, type EphemerisOptions } from "./ephemeris";
import { VARGAS } from "@shared/vargas";
import { WINDOW_LIMIT_MIN, type LagnaWindows } from "@shared/time-windows";

const STEP_S = 10;

export function lagnaWindows(
  jd: number,
  latitude: number,
  longitude: number,
  opts: EphemerisOptions,
  limitMin = WINDOW_LIMIT_MIN,
): LagnaWindows {
  const asc = (t: number) => ascendantAt(t, latitude, longitude, opts);
  const signIn = (i: number, lon: number) => {
    const s = Math.floor(lon / 30) % 12;
    return VARGAS[i].signOf(s, lon - s * 30);
  };
  const lon0 = asc(jd);
  const s0 = VARGAS.map((_, i) => signIn(i, lon0));
  const before: number[] = [], after: number[] = [];
  const capped: [boolean[], boolean[]] = [[], []];
  const steps = Math.floor((limitMin * 60) / STEP_S);
  ([-1, 1] as const).forEach((dir, side) => {
    const open = new Set(VARGAS.map((_, i) => i));
    let prev = jd;
    for (let k = 1; open.size && k <= steps; k++) {
      const t = jd + (dir * k * STEP_S) / 86400;
      const lon = asc(t);
      for (const i of Array.from(open)) {
        if (signIn(i, lon) === s0[i]) continue;
        let a = prev, b = t;
        for (let j = 0; j < 4; j++) {
          const m = (a + b) / 2;
          if (signIn(i, asc(m)) === s0[i]) a = m;
          else b = m;
        }
        (side ? after : before)[i] = (Math.abs((a + b) / 2 - jd) * 1440);
        open.delete(i);
      }
      prev = t;
    }
    for (const i of Array.from(open)) {
      (side ? after : before)[i] = limitMin;
      capped[side][i] = true;
    }
  });
  const out: LagnaWindows = {};
  VARGAS.forEach((v, i) => {
    out[v.key] = {
      before: Math.round(before[i] * 10) / 10,
      after: Math.round(after[i] * 10) / 10,
      ...(capped[0][i] ? { beforeCapped: true } : {}),
      ...(capped[1][i] ? { afterCapped: true } : {}),
    };
  });
  return out;
}
