import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Simple per-client rate limit for the API (chart computation is not free).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;
const rateBuckets = new Map<string, { count: number; reset: number }>();
app.use("/api", (req, res, next) => {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + RATE_WINDOW_MS };
    rateBuckets.set(key, b);
  }
  b.count += 1;
  if (rateBuckets.size > 5000) rateBuckets.forEach((v, k) => { if (v.reset < now) rateBuckets.delete(k); });
  if (b.count > RATE_MAX) {
    res.setHeader("Retry-After", Math.ceil((b.reset - now) / 1000));
    return res.status(429).json({ message: "Too many requests, please slow down" });
  }
  next();
});

// Request log: method, path, status and duration only. Response bodies hold birth data and are never logged.
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
  });
  next();
});

// Liveness probe for the host's health check; returns before any heavy work is done.
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      // On macOS, port 5000 is commonly held by the AirPlay Receiver (ControlCenter).
      console.error(
        `Port ${port} is already in use. ` +
          `On macOS this is often the AirPlay Receiver; disable it in System Settings, ` +
          `or start on another port with PORT=5100 npm run dev.`,
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
