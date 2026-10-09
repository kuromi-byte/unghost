import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeRouter } from "./routes/analyze";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "2mb" }));

app.use("/api", analyzeRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 un-ghost backend running on http://localhost:${PORT}`);
});
