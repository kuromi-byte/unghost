export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp?: string;
}

export type FindingCategory =
  | "things_i_owe"
  | "waiting_on_me"
  | "waiting_on_others"
  | "changed_plans"
  | "unresolved_questions"
  | "urgent_actions";

export interface Finding {
  category: FindingCategory;
  summary: string;
  detail?: string;
  sourceIds: string[];
  owner?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
}

export interface AnalysisResponse {
  messages: Message[];
  findings: Finding[];
  summary: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
