import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisResult, AnalysisResultSchema } from "./schemas";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Guard against overlapping concurrent analysis requests on the server
let isAnalysisInProgress = false;

// Structured output schema enforcing exact category values at generation time
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: [
              "things_i_owe",
              "waiting_on_me",
              "waiting_on_others",
              "changed_plans",
              "unresolved_questions",
              "urgent_actions",
            ],
          },
          summary: { type: Type.STRING },
          detail: { type: Type.STRING },
          sourceIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          owner: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ["high", "medium", "low"],
          },
        },
        required: ["category", "summary", "sourceIds"],
      },
    },
    summary: { type: Type.STRING },
  },
  required: ["findings", "summary"],
};

function buildPrompt(messages: Message[], userName: string): string {
  const messagesJson = JSON.stringify(messages, null, 2);

  return `You are a professional assistant that helps people catch up after being away.
The user's name/handle is: "${userName}"

You will receive a numbered list of chat messages, each with a stable "id" field.

YOUR TASK:
Analyse the conversation and extract ONLY genuine, factual loose-ends. 
Do NOT invent anything. Do NOT fabricate message IDs, owners, deadlines, or decisions.

REQUIRED CATEGORY VALUES (MUST BE EXACT):
Every finding's "category" field MUST be EXACTLY one of these six strings (lowercase, exact match):
- "things_i_owe"
- "waiting_on_me"
- "waiting_on_others"
- "changed_plans"
- "unresolved_questions"
- "urgent_actions"

Do NOT use any other category names or variations.

CATEGORY DEFINITIONS (from ${userName}'s perspective):
- things_i_owe: tasks, files, responses, or items ${userName} explicitly owes someone
- waiting_on_me: people are explicitly waiting for ${userName} to act or respond
- waiting_on_others: ${userName} is waiting for something from another person
- changed_plans: deadlines, meetings, or decisions that changed during this conversation
- unresolved_questions: open questions with no clear answer yet
- urgent_actions: time-sensitive items needing immediate attention

RULES:
1. Every sourceId in "sourceIds" MUST exactly match an "id" from the messages list below.
2. If you cannot find a genuine source message for a finding, omit that finding.
3. Keep findings concise and actionable.
4. Only include findings that are relevant to ${userName}.
5. If there are no findings in a category, simply omit entries for that category.
6. Return ONLY valid JSON matching the schema.

MESSAGES:
${messagesJson}`;
}

// ---------------------------------------------------------------------------
// Retry helpers
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 3_000; // Delays: 3s → 6s for transient 5xx server spikes

/**
 * Extract an HTTP status code from an SDK error object, if available.
 * @google/genai may surface it on .status, .code, or embed it in .message.
 */
function extractHttpStatus(err: unknown): number | null {
  if (err == null || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;

  if (typeof e["status"] === "number") return e["status"] as number;
  if (typeof e["code"] === "number") return e["code"] as number;

  // Fallback: parse status code from message string, e.g. "503 UNAVAILABLE"
  if (typeof e["message"] === "string") {
    const match = /\b([45]\d{2})\b/.exec(e["message"] as string);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Returns true only for transient 5xx server errors that are safe to retry.
 * Excludes:
 *   - Quota exhaustion / 429 rate limit (avoid unnecessary duplicate retries)
 *   - Request timeouts (avoiding back-to-back 60s stalls)
 *   - Permanent 4xx errors (401 bad key, 400 bad request, 404 not found)
 */
function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Do not retry timeouts or quota / rate-limit failures
    if (err.name === "AbortError" || msg.includes("timeout") || msg.includes("quota") || msg.includes("resource_exhausted")) {
      return false;
    }
  }
  const status = extractHttpStatus(err);
  if (status === null) return false;
  if (status === 429) return false; // Avoid duplicate retries on 429 rate/quota limits
  if (status >= 500 && status <= 599) return true; // Transient 5xx server errors (e.g. 503)
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls `fn` up to MAX_ATTEMPTS times for retryable errors.
 * Immediately throws on non-retryable errors (e.g., 429 quota exhaustion, timeouts).
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      if (!isRetryable(err)) {
        throw err;
      }

      const status = extractHttpStatus(err) ?? "5xx";
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 3s, 6s

      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `[unghost] Gemini HTTP ${status} on attempt ${attempt}/${MAX_ATTEMPTS}. ` +
            `Retrying in ${delayMs / 1000}s…`
        );
        await sleep(delayMs);
      } else {
        console.error(
          `[unghost] Gemini HTTP ${status} — all ${MAX_ATTEMPTS} attempts exhausted.`
        );
      }
    }
  }

  const status = extractHttpStatus(lastErr);
  throw new Error(
    `The Gemini API is temporarily unavailable [server error (${status ?? "5xx"})]. ` +
      `All ${MAX_ATTEMPTS} attempts failed. Please wait a moment and try again.`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeTranscript(
  messages: Message[],
  userName: string,
  apiKey: string
): Promise<AnalysisResult> {
  if (isAnalysisInProgress) {
    const conflictErr = new Error("An analysis request is already in progress. Please wait for it to complete.");
    (conflictErr as unknown as { status: number }).status = 429;
    throw conflictErr;
  }

  isAnalysisInProgress = true;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(messages, userName);

    // Call generateContent using SDK-supported responseSchema and 60-second timeout
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: analysisResponseSchema,
          httpOptions: {
            timeout: 60000,
          },
        },
      })
    );

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Gemini response was not valid JSON: ${rawText.slice(0, 200)}`);
    }

    // Validate shape with Zod
    const validated = AnalysisResultSchema.safeParse(parsed);
    if (!validated.success) {
      const issueDetails = validated.error.issues.map((i) => {
        const path = i.path.join(".");
        return `field '${path || "root"}': ${i.message}`;
      });
      console.error(`[unghost] Schema validation failed: ${issueDetails.join("; ")}`);
      throw new Error(`Gemini response failed schema validation: ${issueDetails.join("; ")}`);
    }

    const result = validated.data;
    const validIds = new Set(messages.map((m) => m.id));

    // Strip any sourceId that doesn't correspond to a real input message
    result.findings = result.findings
      .map((f) => ({
        ...f,
        sourceIds: f.sourceIds.filter((id) => {
          const valid = validIds.has(id);
          if (!valid) {
            console.warn(`[unghost] Removed invalid sourceId reference: ${id}`);
          }
          return valid;
        }),
      }))
      .filter((f) => f.sourceIds.length > 0); // drop findings with no valid sources

    return result;
  } finally {
    isAnalysisInProgress = false;
  }
}
