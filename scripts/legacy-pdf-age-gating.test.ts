import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";
import test from "node:test";
import { Settings } from "luxon";
import { registerRoutes } from "../server/routes";

const priorNow = Settings.now;
Settings.now = () => Date.parse("2026-11-08T12:00:00Z");
test.after(() => { Settings.now = priorNow; });
const chart = {
  name: "Synthetic", gender: "female", birthDate: "2018-02-01", birthTime: "13:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97,
  longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean",
};

test("legacy PDF uses the safe report for minors and historical charts", async (t) => {
  if (spawnSync("pdftotext", ["-v"]).error) return t.skip("pdftotext is not installed");
  const handlers = new Map<string, (req: any, res: any) => Promise<void>>();
  const app = { post: (path: string, fn: (req: any, res: any) => Promise<void>) => handlers.set(path, fn), get: () => {} };
  await registerRoutes({} as Parameters<typeof registerRoutes>[0], app as unknown as Parameters<typeof registerRoutes>[1]);
  const request = async (body: object) => {
    const chunks: Buffer[] = [];
    const res = new Writable({ write(chunk, _encoding, done) { chunks.push(Buffer.from(chunk)); done(); } }) as Writable & {
      setHeader: (key: string, value: string) => void; status: (code: number) => typeof res; json: (value: unknown) => typeof res;
    };
    const headers: Record<string, string> = {};
    res.setHeader = (name, value) => { headers[name.toLowerCase()] = value; };
    res.status = (code) => { throw new Error(`Unexpected HTTP ${code}`); };
    res.json = (value) => { throw new Error(`Unexpected JSON ${JSON.stringify(value)}`); };
    await handlers.get("/api/pdf")!({ body }, res);
    await finished(res);
    const pdf = Buffer.concat(chunks);
    assert.equal(headers["content-type"], "application/pdf");
    assert.match(headers["content-disposition"], /filename="nadi-Synthetic\.pdf"/);
    assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
    const text = spawnSync("pdftotext", ["-layout", "-", "-"], { input: pdf, encoding: "utf8" });
    assert.equal(text.status, 0, text.stderr);
    return text.stdout;
  };
  const child = await request(chart);
  assert.doesNotMatch(child, /Kalatra karaka|Putra karaka|a marriage in this stretch|work is found or kept only with strain/i);
  assert.match(child, /held back rather than read/i);
  const deceasedMinor = await request({ ...chart, birthDate: "2000-02-01", deathDate: "2010-02-01" });
  assert.doesNotMatch(deceasedMinor, /Kalatra karaka|Putra karaka|a marriage in this stretch/i);
  const deceasedAdult = await request({ ...chart, birthDate: "1980-01-01", deathDate: "2010-02-01" });
  assert.match(deceasedAdult.slice(0, 400), /generated 8 Nov 2026/i);
  assert.doesNotMatch(deceasedAdult.slice(0, 400), /as of 8 Nov 2026/i);
  assert.match(deceasedAdult, /At the date of passing the Chara dasha was/i);
  assert.doesNotMatch(deceasedAdult, /Next antardashas that carry the area|transits as of 8 Nov 2026/i);
  const adult = await request({ ...chart, birthDate: "1980-01-01" });
  assert.match(adult, /Kalatra karaka/i);
});
