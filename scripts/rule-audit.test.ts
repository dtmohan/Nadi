import assert from "node:assert/strict";
import test from "node:test";
import { provenanceOf, qualifiersOf, RULES } from "../shared/rules";

test("provenance separates source trines from the app's adjacent extension", () => {
  const source = "R.G. Rao; adjacent-sign extension provisional";
  assert.equal(provenanceOf(source, [{ relation: "trine" }]), "source");
  assert.equal(provenanceOf(source, [{ relation: "prev" }]), "extension");
  assert.equal(provenanceOf(source, [{ relation: "trine" }, { relation: "prev" }]), "mixed");
  assert.equal(provenanceOf("R.G. Rao", [{ relation: "prev" }]), "source");
});

test("rule-text qualifiers are carried, not dropped", () => {
  assert.deepEqual(qualifiersOf("misunderstandings unless Jupiter joins"), ["The source adds: unless Jupiter joins."]);
  assert.deepEqual(qualifiersOf("a possible separation; Jupiter's aspect on the combination brings compromise"), ["The source adds a Jupiter-aspect qualifier."]);
  assert.deepEqual(qualifiersOf("misunderstandings if the Moon is weak"), ["The source adds: if the Moon is weak."]);
  assert.deepEqual(qualifiersOf("ordinary result"), []);
});

test("the Mars–Ketu rule now encodes the Jupiter exception", () => {
  const rule = RULES.find((r) => r.id === "f-ma-ke");
  assert.equal(rule?.when.without?.planet, "Jupiter");
  assert.deepEqual(rule?.when.without?.relation, ["conjunct"]);
});
