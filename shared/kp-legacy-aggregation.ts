/** Aggregate the older four-point KP checks without multiplying one natal cusp
 * link merely because several dated events use the same matter and houses. */
export interface KpLegacyEvent {
  matter?: string;
  cusp?: number;
  houses: readonly number[];
  kp: { hits: readonly boolean[]; cuspSubLord?: string; promised?: boolean; score: number; max: number };
}

export function kpLegacyTotals(events: readonly KpLegacyEvent[]): { score: number; max: number } {
  const seen = new Map<string, boolean>();
  let score = 0, max = 0;
  for (const { matter, cusp, houses, kp } of events) {
    // Old stored scan responses may not include the target cusp. Preserve the
    // older total for those rows rather than incorrectly joining two cusps.
    if (!cusp || !kp.cuspSubLord || kp.hits.length !== 3 || kp.max !== 4) {
      score += kp.score; max += kp.max; continue;
    }
    score += kp.hits.filter(Boolean).length;
    max += 3;
    const key = JSON.stringify([matter ?? null, cusp, Array.from(new Set(houses)).sort((a, b) => a - b)]);
    const promised = !!kp.promised;
    const previous = seen.get(key);
    if (previous !== undefined) {
      if (previous !== promised) throw new Error(`Inconsistent natal KP cusp condition: ${key}`);
    } else {
      seen.set(key, promised);
      score += Number(promised); max++;
    }
  }
  return { score, max };
}
