import { z } from "zod";

// ------------------------------------------------------------------
// Schema for a single message in the input transcript
// ------------------------------------------------------------------
export const MessageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  text: z.string(),
  timestamp: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// ------------------------------------------------------------------
// Schema for a single finding returned by the LLM
// ------------------------------------------------------------------
export const FindingSchema = z.object({
  category: z.enum([
    "things_i_owe",
    "waiting_on_me",
    "waiting_on_others",
    "changed_plans",
    "unresolved_questions",
    "urgent_actions",
  ]),
  summary: z.string().min(1).max(400),
  detail: z.string().optional(),
  sourceIds: z.array(z.string()),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

// ------------------------------------------------------------------
// Schema for the full LLM response
// ------------------------------------------------------------------
export const AnalysisResultSchema = z.object({
  findings: z.array(FindingSchema),
  summary: z.string().max(500),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ------------------------------------------------------------------
// Request body schema
// ------------------------------------------------------------------
export const AnalyzeRequestSchema = z.object({
  transcript: z.string().min(10).max(50000),
  userName: z.string().min(1).max(100),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
