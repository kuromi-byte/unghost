import axios from "axios";
import type { AnalysisResponse } from "./types";

const client = axios.create({ baseURL: "/api" });

export async function analyzeTranscript(
  transcript: string,
  userName: string
): Promise<AnalysisResponse> {
  const res = await client.post<AnalysisResponse>("/analyze", { transcript, userName });
  return res.data;
}
