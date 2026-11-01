import { test } from "node:test";
import assert from "node:assert/strict";
import express, { type Request, type Response } from "express";
import { gunzipSync } from "node:zlib";
import { sendRectifyJson } from "../server/rectify-response";

// Repeated stage evidence resembles a real response and lets us verify that
// compression is a transport choice, not a change to the calculation.
const payload = { segments: Array.from({ length: 80 }, (_, n) => ({ n, events: [
  { houses: [2, 5, 11], stages: ["cusp", "major", "sub", "sub-sub"], actual: 0, mean: 0 },
] })) };

function send(header?: string): Promise<{ headers: Record<string, string>; body: unknown }> {
  return new Promise((resolve) => {
    const req = Object.assign(Object.create(express.request), { headers: header ? { "accept-encoding": header } : {} }) as Request;
    const headers: Record<string, string> = {};
    const res = {
      vary(name: string) { headers.vary = name; return this; },
      type(value: string) { headers.type = value; return this; },
      set(name: string, value: string) { headers[name.toLowerCase()] = value; return this; },
      json(value: unknown) { resolve({ headers, body: value }); return this; },
      send(value: unknown) { resolve({ headers, body: value }); return this; },
    } as unknown as Response;
    sendRectifyJson(req, res, payload);
  });
}

test("rectification response compresses only for clients accepting gzip", async () => {
  const compressed = await send("gzip, deflate, br");
  assert.equal(compressed.headers.vary, "Accept-Encoding");
  assert.equal(compressed.headers["content-encoding"], "gzip");
  assert.equal(compressed.headers.type, "application/json");
  const bytes = compressed.body as Buffer;
  assert.deepEqual(JSON.parse(gunzipSync(bytes).toString("utf8")), payload);
  assert.ok(bytes.length < Buffer.byteLength(JSON.stringify(payload)) / 2);
  for (const header of [undefined, "gzip;q=0, identity;q=1"]) {
    const identity = await send(header);
    assert.equal(identity.headers["content-encoding"], undefined);
    assert.deepEqual(identity.body, payload);
    assert.equal(identity.headers.vary, "Accept-Encoding");
  }
});
