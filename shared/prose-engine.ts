// The deterministic prose engine: renders thesaurus fragments for a chart.
// No generation — only selection and substitution. Every fragment carries its
// source note. The Internal Ear's promise, without the narrator.
import { houseFrom, type PlanetPosition } from "./astro";
import { soften } from "./gentle";
import { PROSE_THESAURUS as T, thesaurusNote } from "./prose-thesaurus";

export interface ProseFragment {
  /** what kind of fragment this is */
  kind: "graha_in_bhava" | "nakshatra" | "dignity" | "combustion";
  planet: string;
  /** the rendered text — only thesaurus strings and planet names, never new prose */
  text: string;
  /** the source note of the block the fragment came from */
  source: string;
}

const DIGNITY_MAP: Record<string, string> = {
  Exalted: "Exalted",
  Moolatrikona: "Mooltrikona",
  Debilitated: "Debilitated",
  "Own sign": "Own Sign",
  Friendly: "Friend Sign",
  Neutral: "Neutral Sign",
  Inimical: "Enemy Sign",
};

function dignityFragment(p: PlanetPosition): { text: string; source: string } | null {
  const key = DIGNITY_MAP[p.dignity];
  if (!key) return null;
  const entry = (T.dignity as unknown as Record<string, { effect?: string } | undefined>)[key];
  const eff = entry?.effect;
  if (!eff) return null;
  return { text: soften(eff.replace(/\{graha\}/g, p.planet)), source: thesaurusNote(T.dignity as unknown as Record<string, unknown>) };
}

export function renderPlanetFragments(
  positions: PlanetPosition[],
  lagnaIdx: number,
): ProseFragment[] {
  const out: ProseFragment[] = [];
  for (const p of positions) {
    const house = houseFrom(lagnaIdx, p.signIndex);
    const hk = `H${house}`;

    // 1. graha-in-bhava (planet in house — PD Ch.8 primary)
    const gbh = (T.graha_in_bhava as unknown as Record<string, Record<string, unknown>>)[p.planet];
    if (gbh) {
      const text = soften(typeof gbh[hk] === "string" ? gbh[hk] : "");
      if (text) {
        out.push({
          kind: "graha_in_bhava",
          planet: p.planet,
          text,
          source: thesaurusNote(T.graha_in_bhava as unknown as Record<string, unknown>),
        });
      }
    }

    // 2. nakshatra core (the planet's nakshatra — BPHS primary)
    const nak = (T.nakshatra as unknown as Record<string, { core?: string } | string>)[p.nakshatra];
    if (nak && typeof nak === "object" && typeof nak.core === "string") {
      out.push({
        kind: "nakshatra",
        planet: p.planet,
        text: soften(nak.core),
        source: thesaurusNote(T.nakshatra as unknown as Record<string, unknown>),
      });
    }

    // 3. dignity effect (with {graha} substituted)
    const dig = dignityFragment(p);
    if (dig) {
      out.push({ kind: "dignity", planet: p.planet, text: dig.text, source: dig.source });
    }

    // 4. combustion (only for the planets the thesaurus carries)
    const comb = (T.combustion as unknown as Record<string, { effect?: string } | string>)[p.planet];
    const combText = typeof comb === "string" ? comb : comb?.effect;
    if (typeof combText === "string" && p.combust) {
      out.push({
        kind: "combustion",
        planet: p.planet,
        text: soften(combText),
        source: thesaurusNote(T.combustion as unknown as Record<string, unknown>),
      });
    }
  }
  return out;
}
