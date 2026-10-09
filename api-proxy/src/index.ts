import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3002;

// 1. Enforce 250KB body size limit
app.use(express.json({ limit: "250kb" }));

// 2. Safe error handler for oversized (413) and malformed (400) payloads
app.use((err: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (err && typeof err === "object") {
    if ("type" in err && (err as { type: string }).type === "entity.too.large") {
      res.status(413).json({ error: "Payload too large. Maximum size is 250KB." });
      return;
    }
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ error: "Malformed JSON payload." });
      return;
    }
  }
  next(err);
});

// 3. Best-effort in-memory sliding-window rate limiter (5 requests / 60 seconds per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const bestEffortRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const clientRecord = rateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (clientRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((clientRecord.resetTime - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: "Too many analysis requests. Please wait before submitting again.",
    });
    return;
  }

  clientRecord.count += 1;
  next();
};

// 4. Primary analysis endpoint (POST /api/analyze only)
app.post("/api/analyze", bestEffortRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    console.error("[api-proxy] Configuration error: BACKEND_URL is missing.");
    res.status(500).json({ error: "Service configuration error" });
    return;
  }

  const startTime = Date.now();

  try {
    const targetUrl = new URL("/api/analyze", backendBase);

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const durationMs = Date.now() - startTime;
    console.log(`[api-proxy] POST /api/analyze upstream status: ${upstreamResponse.status} (${durationMs}ms)`);

    const contentType = upstreamResponse.headers.get("content-type") || "";
    res.status(upstreamResponse.status);

    if (contentType.includes("application/json")) {
      const data = await upstreamResponse.json();
      res.json(data);
    } else {
      const text = await upstreamResponse.text();
      res.send(text);
    }
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorType = err instanceof Error ? err.name : "UnknownError";
    console.error(`[api-proxy] Upstream connection failed after ${durationMs}ms [${errorType}]`);

    res.status(502).json({
      error: "Service temporarily unavailable. Please try again later.",
    });
  }
});

// Explicit 405 Method Not Allowed for non-POST calls to /api/analyze
app.all("/api/analyze", (_req: Request, res: Response): void => {
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Method not allowed. Use POST /api/analyze." });
});

// Health check endpoint for proxy liveness
app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok", service: "api-proxy" });
});

// Catch-all 404 for unmapped endpoints
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Run local listener only when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 api-proxy running on http://localhost:${PORT}`);
  });
}

export default app;
