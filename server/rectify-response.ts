import type { Request, Response } from "express";
import { constants, gzip } from "node:zlib";

/** The scan can contain many repeated event details. Compress only when the
 * client accepts gzip; callers that request identity still get ordinary JSON. */
export function sendRectifyJson(req: Request, res: Response, result: unknown): void {
  res.vary("Accept-Encoding");
  if (!req.headers["accept-encoding"] || req.acceptsEncodings("gzip", "identity") !== "gzip") {
    res.json(result);
    return;
  }
  const json = JSON.stringify(result);
  gzip(json, { level: constants.Z_BEST_SPEED }, (error, data) => {
    if (error) {
      res.json(result);
      return;
    }
    res.type("application/json").set("Content-Encoding", "gzip").send(data);
  });
}
