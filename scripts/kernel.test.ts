// The combining kernel (shared/kernel.ts) and the agreement adapters (shared/agreement.ts).
//
// The kernel's rules are tested exhaustively on short sequences: the result depends only on which stances are
// present, a lean can create a dispute but never an agreement, and a contested voice keeps its dispute. The hard
// checks are each made to fail. The adapters are run end to end on synthetic charts (no real person's data).
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import {
  STANCES,
  KernelInputError,
  combineStances,
  makeKernel,
  proportion,
  verdictOf,
  type Evidence,
  type Stance,
  type Voice,
} from "@shared/kernel";
import {
  AGREEMENT_TOPIC_LABEL,
  agreementFor,
  agreementInput,
  computeAgreement,
  readTopic,
  type TopicAgreement,
} from "@shared/agreement";
import { withholdText } from "@shared/life-stage";
import { buildReport } from "@shared/report";
import { computeChart } from "../server/routes";

const throwsInput = (fn: () => unknown, re: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof KernelInputError && re.test(e.message));

// ---- combineStances -------------------------------------------------------------------------

/** Every sequence of n stances (7^n of them). */
function sequences(n: number): Stance[][] {
  if (n === 0) return [[]];
  return sequences(n - 1).flatMap((head) => STANCES.map((s) => [...head, s]));
}

const setKey = (xs: readonly Stance[]) =>
  Array.from(new Set(xs.filter((s) => s !== "silent"))).sort().join(",");

test("kernel: the combination depends only on the set of stances present (every sequence up to four)", () => {
  const bySet = new Map<string, Stance>();
  let n = 0;
  for (let len = 0; len <= 4; len++)
    for (const seq of sequences(len)) {
      const got = combineStances(seq);
      const key = setKey(seq);
      const seen = bySet.get(key);
      if (seen === undefined) bySet.set(key, got);
      else assert.equal(got, seen, `[${seq.join(", ")}] differs from another ordering or repetition of {${key}}`);
      n++;
    }
  assert.equal(n, 1 + 7 + 49 + 343 + 2401);
  // Repetition and silence change nothing.
  assert.equal(combineStances(["supports", "supports", "silent"]), combineStances(["supports"]));
});

test("kernel: the outcomes of combining", () => {
  const cases: [Stance[], Stance][] = [
    [[], "silent"],
    [["silent", "silent"], "silent"],
    [["supports"], "supports"],
    [["supports", "supports"], "supports"],
    [["strains", "strains"], "strains"],
    [["supports", "strains"], "contested"],
    [["supports", "mixed"], "leans-supports"],
    [["strains", "mixed"], "leans-strains"],
    [["supports", "leans-supports"], "leans-supports"],
    [["leans-supports"], "leans-supports"],
    [["leans-supports", "strains"], "contested"],
    [["leans-supports", "leans-strains"], "contested"],
    [["mixed", "mixed"], "mixed"],
    [["contested"], "contested"],
    [["contested", "supports"], "contested"],
    [["contested", "mixed"], "contested"],
  ];
  for (const [xs, want] of cases) assert.equal(combineStances(xs), want, `[${xs.join(", ")}]`);
  throwsInput(() => combineStances(["maybe" as Stance]), /unknown stance/);
});

test("kernel: a lean can make a dispute but never an agreement", () => {
  for (let len = 1; len <= 3; len++)
    for (const seq of sequences(len)) {
      if (!seq.some((s) => s.startsWith("leans-"))) continue;
      const got = combineStances(seq);
      assert.ok(got !== "supports" && got !== "strains", `[${seq.join(", ")}] became ${got}`);
    }
});

test("kernel: a dissent is never averaged away", () => {
  // However many voices support, one opposing voice, or one voice that is itself split, makes a dispute.
  for (const against of ["strains", "leans-strains", "contested"] as Stance[])
    assert.equal(combineStances(["supports", "supports", "supports", against]), "contested", against);
});

test("kernel: two-thirds weighing inside one book, with a two-sided rule counted half each way", () => {
  assert.equal(proportion(0, 0), "silent");
  assert.equal(proportion(1, 0), "supports");
  assert.equal(proportion(2, 1), "supports");
  assert.equal(proportion(1, 2), "strains");
  assert.equal(proportion(3, 2), "mixed");
  assert.equal(proportion(1, 1), "mixed");
  assert.throws(() => proportion(-1, 0), KernelInputError);
  const K = makeKernel({ s: { label: "S", texts: { b: { label: "B" } } } });
  const e = (tone: Evidence["tone"]): Evidence => ({ tone, text: tone, cite: { label: "B 1.1" }, tier: "sourced" });
  assert.equal(K.weigh("b", [e("support"), e("both")]).stance, "supports"); // 1.5 against 0.5
  assert.equal(K.weigh("b", [e("both")]).stance, "mixed");
  assert.equal(K.weigh("b", [e("support"), e("strain"), e("both")]).stance, "mixed");
  assert.equal(K.weigh("b", []).stance, "silent");
});

test("kernel: the verdict read off the combined stance", () => {
  assert.equal(verdictOf("supports", 1), "quiet");
  assert.equal(verdictOf("supports", 2), "agree");
  assert.equal(verdictOf("strains", 3), "agree");
  assert.equal(verdictOf("leans-supports", 2), "lean");
  assert.equal(verdictOf("leans-strains", 2), "lean");
  assert.equal(verdictOf("mixed", 2), "mixed");
  assert.equal(verdictOf("contested", 2), "disagree");
  assert.equal(verdictOf("silent", 0), "quiet");
});

// ---- The bound kernel: hard checks and provenance --------------------------------------------

const MANIFEST = {
  par: { label: "Par", texts: { b1: { label: "Book one" }, b2: { label: "Book two" } } },
  nadi: { label: "Nadi", texts: {} },
  kp: { label: "KP", texts: {} },
};
const K = makeKernel(MANIFEST);
const ev = (tone: Evidence["tone"], tier: Evidence["tier"] = "sourced", text = `a ${tone} rule`): Evidence => ({
  tone,
  text,
  cite: { label: "Book 1.1" },
  tier,
});
const school = (id: string, stance: Stance, tier: Voice["tier"] = "sourced"): Voice =>
  K.schoolVoice(id, { stance, tier, note: `${id} ${stance}`, cites: stance === "silent" ? [] : [{ label: `${id} p. 1` }] });

test("kernel: every outcome across schools", () => {
  const verdict = (...xs: Stance[]) =>
    K.combineSchools(xs.map((s, i) => school(["par", "nadi", "kp"][i], s))).verdict;
  assert.equal(verdict("supports", "supports"), "agree");
  assert.equal(verdict("supports", "mixed"), "lean");
  assert.equal(verdict("mixed", "mixed"), "mixed");
  assert.equal(verdict("supports", "strains"), "disagree");
  assert.equal(verdict("contested", "mixed"), "disagree");
  assert.equal(verdict("supports", "silent", "silent"), "quiet");
  assert.equal(verdict("silent", "silent", "silent"), "quiet");
  // A missing voice is silent: it neither supports nor dissents.
  assert.equal(verdict("supports", "supports", "silent"), "agree");
});

test("kernel: two books of one school are one school, never an agreement between schools", () => {
  const b1 = K.weigh("b1", [ev("support")]);
  const b2 = K.weigh("b2", [ev("support")]);
  const par = K.combineTexts("par", [b1, b2]);
  assert.equal(par.stance, "supports");
  assert.deepEqual(par.from?.map((v) => v.id), ["b1", "b2"]);
  const c = K.combineSchools([par, school("nadi", "silent"), school("kp", "silent")]);
  assert.equal(c.spoken, 1);
  assert.equal(c.verdict, "quiet");
  throwsInput(() => K.combineSchools([b1, b2]), /cannot stand in for a school/);
  throwsInput(() => K.combineSchools([par, par]), /given twice/);
});

test("kernel: hard checks throw before anything is combined", () => {
  throwsInput(() => K.weigh("b9", [ev("support")]), /unknown book/);
  throwsInput(() => K.weigh("b1", [{ ...ev("support"), cite: { label: " " } }]), /cite/);
  throwsInput(() => K.weigh("b1", [{ ...ev("support"), tone: "good" as Evidence["tone"] }]), /unknown tone/);
  throwsInput(() => K.weigh("b1", [{ ...ev("support"), tier: "folk" as Evidence["tier"] }]), /tier/);
  throwsInput(
    () => K.weigh("b1", [ev("strain", "sourced", "withheld text")], { gate: (t) => t.includes("withheld") }),
    /age gate/,
  );
  throwsInput(() => school("saravali", "supports"), /unknown school/);
  throwsInput(() => K.schoolVoice("nadi", { stance: "supports", tier: "sourced", note: "x", cites: [] }), /cite/);
  throwsInput(
    () =>
      K.schoolVoice(
        "nadi",
        { stance: "supports", tier: "sourced", note: "x", cites: [{ label: "p. 1" }] },
        { gate: (t) => t === "hidden", texts: ["hidden"] },
      ),
    /age gate/,
  );
  throwsInput(() => K.combineTexts("par", [school("nadi", "supports")]), /only book voices/);
  throwsInput(() => K.combineTexts("nadi", [K.weigh("b1", [ev("support")])]), /not a book of Nadi/);
  throwsInput(() => K.combineTexts("par", [K.weigh("b1", []), K.weigh("b1", [])]), /given twice/);
});

test("kernel: a combined stance carries the weakest provenance among the voices that spoke", () => {
  const b1 = K.weigh("b1", [ev("support"), ev("support", "keyword")]);
  assert.equal(b1.tier, "keyword");
  assert.ok(b1.reason);
  const silent = K.weigh("b2", []);
  assert.equal(silent.tier, "sourced");
  const prov = K.weigh("b2", [{ ...ev("support", "provisional"), reason: "a reading the app marks provisional" }]);
  assert.equal(prov.reason, "a reading the app marks provisional");
  assert.equal(K.combineTexts("par", [K.weigh("b1", [ev("support")]), prov]).tier, "provisional");
  // A silent book does not lower the school's footing.
  assert.equal(K.combineTexts("par", [K.weigh("b1", [ev("support")]), K.weigh("b2", [])]).tier, "sourced");
  const c = K.combineSchools([school("par", "supports", "provisional"), school("nadi", "supports", "keyword"), school("kp", "silent", "keyword")]);
  assert.equal(c.tier, "keyword");
});

// ---- The adapters, end to end on synthetic charts --------------------------------------------

const ADULT: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "male",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Chennai, India",
  latitude: 13.0827,
  longitude: 80.2707,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
};

const MINOR: Chart = { ...ADULT, name: "Synthetic minor", gender: "female", birthDate: "2016-08-20", birthTime: "05:40" };

const adult = computeChart(ADULT);
const minor = computeChart(MINOR);

function allNotes(ts: TopicAgreement[]): string[] {
  return ts.flatMap((t) => t.stances.flatMap((s) => [s.note, ...(s.texts ?? []).map((b) => b.note)]));
}

test("agreement: one voice per school on six questions, the parents read separately", () => {
  const ts = agreementFor(adult, false);
  assert.deepEqual(
    ts.map((t) => t.topic),
    ["marriage", "children", "career", "father", "mother"],
  );
  for (const t of ts) {
    assert.deepEqual(t.stances.map((s) => s.system), ["bnn", "parashari", "jaimini", "kp"], t.topic);
    const par = t.stances[1];
    assert.deepEqual(par.texts?.map((b) => b.id), ["bphs", "phaladeepika", "sarvartha"], t.topic);
    for (const s of t.stances) if (s.stance !== "silent") assert.ok(s.cites.length, `${t.topic}/${s.system} cites`);
    // The topic's footing is the weakest among the schools that spoke.
    const rank = { keyword: 0, provisional: 1, sourced: 2 } as const;
    const spoken = t.stances.filter((s) => s.stance !== "silent");
    const weakest = spoken.reduce((w, s) => (rank[s.tier] < rank[w] ? s.tier : w), "sourced" as keyof typeof rank);
    assert.equal(t.tier, weakest, t.topic);
    assert.ok(t.sentence.startsWith(`${t.label}:`));
  }
});

test("agreement: a closed or unknown topic is refused, never read", () => {
  const input = agreementInput(adult, false);
  throwsInput(() => readTopic("lifespan", input), /closed/);
  throwsInput(() => readTopic("parents" as never, input), /unknown topic/);
  const dead = agreementInput(computeChart({ ...ADULT, deathDate: "2010-06-01" }), false);
  assert.equal(readTopic("lifespan", dead).topic, "lifespan");
  assert.ok(computeAgreement(dead).some((t) => t.topic === "lifespan"));
  assert.ok(!computeAgreement({ ...dead, plain: true }).some((t) => t.topic === "lifespan"));
});

test("agreement: a book outside the manifest, or a withheld statement, stops the comparison", () => {
  const input = agreementInput(adult, false);
  const stranger = {
    id: "x-1",
    kind: "house" as const,
    house: 7,
    title: "A rule from another book",
    text: "The spouse is fortunate.",
    tone: "support" as const,
    planets: [],
    source: { label: "Saravali 34.1", url: "https://example.org" },
  };
  throwsInput(
    () => computeAgreement({ ...input, parashari: { ...input.parashari, findings: [...input.parashari.findings, stranger] } }),
    /not one of Parashari's books/,
  );
  // As if the server had not redacted a minor's statement: the kernel refuses it. The minor's own input, which the
  // server did redact, is the control.
  const young = agreementInput(minor, false);
  assert.equal(young.withheld, true);
  assert.doesNotThrow(() => computeAgreement(young));
  const leaked = { house: 4, stanza: 1, topic: "mother", text: "the early death of the mother", fidelity: "verbatim" };
  assert.ok(withholdText(`mother: ${leaked.text}`));
  throwsInput(
    () =>
      computeAgreement({
        ...young,
        sarvartha: { ...young.sarvartha!, findings: [...young.sarvartha!.findings, leaked as never] },
      }),
    /sarvartha: a statement the age gate withholds/,
  );
});

test("agreement: a minor's reading runs without any withheld statement reaching the kernel", () => {
  assert.equal(agreementInput(minor, false).withheld, true);
  for (const plain of [false, true]) {
    const ts = agreementFor(minor, plain);
    // Marriage, children and career are not yet in season at ten; the parents are read.
    assert.deepEqual(ts.map((t) => t.topic), ["father", "mother"]);
    for (const n of allNotes(ts)) assert.ok(!withholdText(n), `withheld text in a note: ${n}`);
  }
});

test("agreement: the report's table is the panel's, with Parashari's three books in its cell", () => {
  for (const plain of [false, true]) {
    const ts = agreementFor(adult, plain);
    const sec = buildReport(adult, { plain }).sections.find((s) => s.id === "agreement");
    assert.ok(sec, "agreement section");
    const rows = sec!.paras.flatMap((p) => (p.kind === "table" ? (p.rows ?? []) : []));
    assert.deepEqual(rows.map((r) => r[0]), ts.map((t) => AGREEMENT_TOPIC_LABEL[t.topic]));
    for (const r of rows) assert.match(r[2], /Sarvartha Chintamani/);
  }
});
