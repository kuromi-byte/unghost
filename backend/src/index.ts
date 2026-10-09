import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeRouter } from "./routes/analyze";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "250kb" }));

// Safe error handler for oversized (413) and malformed (400) payloads
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction): void => {
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

app.use("/api", analyzeRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 un-ghost backend running on http://localhost:${PORT}`);
  });
}

export default app;
