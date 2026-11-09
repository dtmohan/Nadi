import test from "node:test";
import assert from "node:assert/strict";
import { BNN_SOURCE_SNAPSHOT } from "../shared/malayalam-bnn-snapshot";
import { readerPassage } from "../shared/reader-prose";
import { workContrastMalayalam, workQualifierMalayalam, workThemeMalayalam } from "../shared/malayalam-work-journey";
import type { Finding } from "../shared/rules";

test("work themes translate only for their matching source and derived meaning", () => {
  const source = BNN_SOURCE_SNAPSHOT["sa-su"];
  const theme = "Government, administration or a large institution.";
  assert.match(workThemeMalayalam("sa-su", source, theme) ?? "", /സർക്കാർ/);
  assert.equal(workThemeMalayalam("sa-su", source + " Additional condition.", theme), undefined);
  assert.equal(workThemeMalayalam("sa-su", source, "Work and personal identity may be closely linked."), undefined);
  assert.equal(workThemeMalayalam("unknown", source, theme), undefined);
});

test("editorial translations preserve the complete reviewed source, including conditions", () => {
  const id = "t-sa-me-ra";
  const source = BNN_SOURCE_SNAPSHOT[id].replace(/ linked by sign \(not necessarily in the same sign\):/, " together:");
  const finding: Finding = { ruleId: id, area: "career", text: source, score: 0, planets: [], relation: null, viaRetro: false };
  const passage = readerPassage("career", id, [finding]);
  assert.ok(passage);
  assert.equal(workThemeMalayalam(id, source, passage.en), passage.ml);
  assert.equal(workThemeMalayalam(id, `${source} Only under an additional condition.`, passage.en), undefined);
  assert.equal(workThemeMalayalam(id, source, passage.en + " Extra assertion."), undefined);
});

test("only reviewed exact contrast lines get Malayalam", () => {
  const original = "Another part of a selected rule mentions breaks and restarts in the career line.";
  assert.match(workContrastMalayalam(original) ?? "", /തൊഴിൽ/);
  assert.equal(workContrastMalayalam(`${original} Extra detail.`), undefined);
});

test("qualifier translation preserves each exact condition and refuses unknown additions", () => {
  assert.match(workQualifierMalayalam("The source adds: if the Moon is weak.") ?? "", /ചന്ദ്രൻ/);
  assert.match(workQualifierMalayalam("The source adds a Jupiter-aspect qualifier.") ?? "", /ദൃഷ്ടി/);
  assert.equal(workQualifierMalayalam("The source adds: if the Moon is weak. Extra condition."), undefined);
});
