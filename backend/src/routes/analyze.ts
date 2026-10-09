import { Router, Request, Response } from "express";
import { AnalyzeRequestSchema } from "../schemas";
import { parseTranscript } from "../parser";
import { analyzeTranscript } from "../gemini";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req: Request, res: Response): Promise<void> => {
  console.log(`[unghost] Incoming POST /api/analyze at ${new Date().toISOString()}`);
  // Validate request body
  const bodyParsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request", details: bodyParsed.error.flatten() });
    return;
  }

  const { transcript, userName } = bodyParsed.data;

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    res.status(500).json({
      error: "GEMINI_API_KEY is not configured. Set it in backend/.env",
    });
    return;
  }

  // Parse transcript into stable-ID messages
  const messages = parseTranscript(transcript);
  if (messages.length === 0) {
    res.status(400).json({
      error: "Could not parse any messages from the transcript. Check the format.",
    });
    return;
  }

  try {
    const result = await analyzeTranscript(messages, userName, apiKey);
    res.json({
      messages,        // Return parsed messages so frontend can show sources
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[unghost] Analysis error:", message);
    const isConflict = message.includes("already in progress");
    const statusCode = (err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number")
      ? (err as { status: number }).status
      : 502;
    res.status(statusCode).json({
      error: isConflict ? "Analysis already in progress" : "AI analysis failed",
      details: message,
    });
  }
});
