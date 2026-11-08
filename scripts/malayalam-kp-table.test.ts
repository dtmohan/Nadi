import test from "node:test";
import assert from "node:assert/strict";
import { kpTableRowMalayalam } from "../shared/malayalam-kp-table";

test("KP appendix rows retain every planet, house, degree and conditional duration", () => {
  const cusp = ["Cusp", "Sign and degree", "Star lord", "Sub lord", "Sub lord holds (before / after)"];
  const row = ["1st", `Libra 01°02'03\"`, "Venus", "Saturn", "2 min 3 s / over an hour (conditional)"];
  const ml = kpTableRowMalayalam(cusp, row)!;
  for (const text of ["1-ാം", "തുലാം", `01°02'03\"`, "ശുക്രൻ", "ശനി", "2 മിനിറ്റ് 3 സെക്കൻഡ്", "ഒരു മണിക്കൂറിലധികം", "സോപാധികം"]) assert.ok(ml.join(" ").includes(text), text);
  assert.equal(kpTableRowMalayalam(cusp, [...row.slice(0, 4), "new timing"]), undefined);
  assert.equal(kpTableRowMalayalam([...cusp, "New condition"], [...row, "extra"]), undefined);
  const planet = ["Planet", "Sign and degree", "In house", "Star lord", "Sub lord", "Signifies (A-D)"];
  const translated = kpTableRowMalayalam(planet, ["Saturn R", `Scorpio 10°11'12\"`, "12th", "Venus", "Rahu", "1, 2, 11"])!;
  assert.match(translated[0], /ശനി.*വക്രം/);
  assert.equal(translated[2], "12-ാം");
  assert.equal(translated[5], "1, 2, 11");
});
