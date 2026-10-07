import type { AshtakavargaResult } from "./ashtakavarga";

/**
 * Prasna Marga Ch. XXXII, stanzas 59-72: the applications the text layers on the collective
 * (Samudaya) Ashtakavarga, which this app already computes (BPHS ch. 66-72). They are read from
 * the same per-sign rekha counts, so they belong to the Parashari tab's Ashtakavarga section even
 * though their source is Prasna Marga. Ported here as a single reading; the bindu tables,
 * reductions and pindas themselves are the Parashari ones and are not repeated.
 */

/** 32.63: the minimum rekhas each house needs to be considered strong. */
const MINIMUM_BINDUS = [25, 22, 29, 24, 25, 34, 19, 24, 29, 36, 54, 16];

export interface PrasnaAvReadings {
  /** 32.61: sum of the 2nd, 4th, 9th, 10th and 11th, against the 164 threshold. */
  vithaya: { total: number; verdict: "prosperous" | "high-expense" | "balanced"; text: string };
  /** 32.62: sum of the 6th, 8th and 12th, against the 76 threshold. */
  theertha: { total: number; verdict: "income-over" | "expense-over" | "balanced"; text: string };
  /** 32.63: each house's rekhas against its required minimum. */
  minimums: { house: number; required: number; actual: number; met: boolean }[];
  /** 32.69: the four tripartite totals and what each being largest promises. */
  categories: {
    bhanduka: number;
    sevaka: number;
    poshaka: number;
    ghataka: number;
    text: string;
  };
  /** 32.70-71: the happy third of life, by the sign-thirds and by the kendra/panapara/apoklima groups. */
  lifeThirds: { span: string; total: number; method: string }[];
  /** 32.72: the six inner houses against the six outer. */
  antarbhaga: { antarbhaga: number; bahirbhaga: number; text: string };
  sources: Record<string, string>;
}

const SRC = (v: string) => `Prasna Marga 32.${v}`;

export function computePrasnaAvReadings(av: AshtakavargaResult): PrasnaAvReadings {
  const rekhas = (house: number) => av.houses.find((h) => h.house === house)?.rekhas ?? 0;
  const sum = (houses: number[]) => houses.reduce((a, h) => a + rekhas(h), 0);
  const sumBySign = (signs: number[]) => signs.reduce((a, s) => a + av.sarva[s], 0);

  // 32.61 Vithaya — the wealth total.
  const vithayaTotal = sum([2, 4, 9, 10, 11]);
  const vithayaVerdict: PrasnaAvReadings["vithaya"]["verdict"] =
    vithayaTotal > 164 ? "prosperous" : vithayaTotal < 164 ? "high-expense" : "balanced";
  const vithaya = {
    total: vithayaTotal,
    verdict: vithayaVerdict,
    text:
      vithayaVerdict === "prosperous"
        ? `The wealth total (2, 4, 9, 10, 11) is ${vithayaTotal}, above 164: the native is prosperous.`
        : vithayaVerdict === "high-expense"
          ? `The wealth total (2, 4, 9, 10, 11) is ${vithayaTotal}, below 164: expenses run high.`
          : `The wealth total (2, 4, 9, 10, 11) is 164 exactly: income and expenditure balance.`,
  };

  // 32.62 Theertha — the expense total.
  const theerthaTotal = sum([6, 8, 12]);
  const theerthaVerdict: PrasnaAvReadings["theertha"]["verdict"] =
    theerthaTotal < 76 ? "income-over" : theerthaTotal > 76 ? "expense-over" : "balanced";
  const theertha = {
    total: theerthaTotal,
    verdict: theerthaVerdict,
    text:
      theerthaVerdict === "income-over"
        ? `The expense total (6, 8, 12) is ${theerthaTotal}, below 76: income outweighs expenses.`
        : theerthaVerdict === "expense-over"
          ? `The expense total (6, 8, 12) is ${theerthaTotal}, above 76: expenses outweigh income.`
          : `The expense total (6, 8, 12) is 76 exactly: the two balance.`,
  };

  // 32.63 minimum bindus per house.
  const minimums = MINIMUM_BINDUS.map((required, i) => ({
    house: i + 1,
    required,
    actual: rekhas(i + 1),
    met: rekhas(i + 1) > required,
  }));

  // 32.69 Bhanduka, Sevaka, Poshaka, Ghataka.
  const bhanduka = sum([1, 5, 9]);
  const sevaka = sum([2, 6, 10]);
  const poshaka = sum([3, 7, 11]);
  const ghataka = sum([4, 8, 12]);
  const largest = Math.max(bhanduka, sevaka, poshaka, ghataka);
  const catParts: string[] = [];
  if (ghataka > bhanduka && ghataka > sevaka && ghataka > poshaka) catParts.push("ghataka leads: the native is miserably poor");
  if (poshaka > ghataka) catParts.push("poshaka exceeds ghataka: wealth");
  if (bhanduka === largest) catParts.push("bhanduka leads: help from relatives and friends");
  if (sevaka === largest) catParts.push("sevaka leads: benefit from service");
  const categories = {
    bhanduka,
    sevaka,
    poshaka,
    ghataka,
    text: `Bhanduka ${bhanduka} · Sevaka ${sevaka} · Poshaka ${poshaka} · Ghataka ${ghataka}.${catParts.length ? " " + catParts.join("; ") + "." : ""}`,
  };

  // 32.70-71 the happy third of life, by two groupings.
  const signThirds = [
    { span: "childhood", total: sumBySign([11, 0, 1, 2]), method: "32.70" },
    { span: "youth", total: sumBySign([3, 4, 5, 6]), method: "32.70" },
    { span: "old age", total: sumBySign([7, 8, 9, 10]), method: "32.70" },
  ];
  const groupThirds = [
    { span: "childhood", total: sum([1, 4, 7, 10]), method: "32.71 (kendra)" },
    { span: "middle age", total: sum([2, 5, 8, 11]), method: "32.71 (panapara)" },
    { span: "old age", total: sum([3, 6, 9, 12]), method: "32.71 (apoklima)" },
  ];
  const lifeThirds = [...signThirds, ...groupThirds];

  // 32.72 antarbhaga and bahirbhaga.
  const antarbhagaTotal = sum([1, 4, 5, 7, 9, 10]);
  const bahirbhagaTotal = sum([2, 3, 6, 8, 11, 12]);
  const antarbhaga = {
    antarbhaga: antarbhagaTotal,
    bahirbhaga: bahirbhagaTotal,
    text:
      antarbhagaTotal > bahirbhagaTotal
        ? `The inner houses (1, 4, 5, 7, 9, 10) total ${antarbhagaTotal} against ${bahirbhagaTotal}: mental peace, good karma, education and culture.`
        : `The outer houses (2, 3, 6, 8, 11, 12) total ${bahirbhagaTotal} against ${antarbhagaTotal}: pomp, vanity, power and misery.`,
  };

  return {
    vithaya,
    theertha,
    minimums,
    categories,
    lifeThirds,
    antarbhaga,
    sources: {
      vithaya: SRC("61"),
      theertha: SRC("62"),
      minimums: SRC("63"),
      categories: SRC("69"),
      lifeThirds: SRC("70-71"),
      antarbhaga: SRC("72"),
    },
  };
}
