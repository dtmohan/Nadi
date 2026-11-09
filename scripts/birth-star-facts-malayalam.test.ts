import assert from "node:assert/strict";
import test from "node:test";
import { birthStarReading } from "../shared/birth-star";
import { soften } from "../shared/gentle";
import { birthStarPlainFactsMalayalam } from "../shared/malayalam-birth-star-facts";
import { endStop } from "../shared/report/types";

test("all 27 selected stars preserve the four plain facts after the age gate", () => {
  for (let i = 0; i < 27; i++) for (const withhold of [true, false]) {
    const star = birthStarReading((i + 0.5) * 360 / 27, { withhold })!;
    const facts = star.facts.filter((f) => !f.practitionerOnly);
    const source = soften(facts.map((f) => endStop(`${f.label}: ${f.plain}`)).join(" "));
    const ml = birthStarPlainFactsMalayalam(star, source);
    assert.ok(ml, `${star.name}, withhold=${withhold}`);
    for (const label of ["നക്ഷത്രാധിപൻ", "ദേവത", "പ്രതീകം", "ജീവിതലക്ഷ്യം"]) assert.ok(ml.includes(label));
    assert.equal(birthStarPlainFactsMalayalam(star, `${source} Extra qualification.`), undefined);
  }
});

test("symbol alternatives and conjunctions remain distinct", () => {
  const render = (index: number) => {
    const star = birthStarReading((index + 0.5) * 360 / 27, { withhold: true })!;
    const source = soften(star.facts.filter((f) => !f.practitionerOnly).map((f) => endStop(`${f.label}: ${f.plain}`)).join(" "));
    return birthStarPlainFactsMalayalam(star, source)!;
  };
  assert.ok(render(15).includes("കുശവന്റെ ചക്രമോ കവാടകമാനമോ"));
  assert.ok(render(22).includes("മൃദംഗവും ഓടക്കുഴലും"));
});

test("a softened fact is never reconstructed from its original wording", () => {
  const star = birthStarReading(1, { withhold: true })!;
  const changed = { ...star, facts: star.facts.map((f) => f.key === "symbol" ? { ...f, plain: "death of mother and child, or of the child" } : f) };
  const raw = changed.facts.filter((f) => !f.practitionerOnly).map((f) => endStop(`${f.label}: ${f.plain}`)).join(" ");
  assert.notEqual(soften(raw), raw);
  assert.equal(birthStarPlainFactsMalayalam(changed, soften(raw)), undefined);
});
