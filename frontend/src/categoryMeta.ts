import type { FindingCategory } from "./types";

export interface CategoryConfig {
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const CATEGORY_META: Record<FindingCategory, CategoryConfig> = {
  things_i_owe: {
    label: "Things I owe",
    shortLabel: "Owed by me",
    description: "Tasks, files, or responses you explicitly committed to provide",
    badgeBg: "bg-[#F1F1EC]",
    badgeText: "text-[#2B2D29]",
    borderColor: "border-[#D6D6CE]",
  },
  waiting_on_me: {
    label: "Waiting on me",
    shortLabel: "Waiting on me",
    description: "Teammates or workflows explicitly blocked on your input",
    badgeBg: "bg-[#F3EFEA]",
    badgeText: "text-[#4A3222]",
    borderColor: "border-[#DDD2C6]",
  },
  waiting_on_others: {
    label: "Waiting on others",
    shortLabel: "Waiting on others",
    description: "Deliverables, credentials, or reviews you are blocked on",
    badgeBg: "bg-[#EDF2F4]",
    badgeText: "text-[#223B44]",
    borderColor: "border-[#CAD8DE]",
  },
  changed_plans: {
    label: "Changed plans",
    shortLabel: "Plan changes",
    description: "Deadlines, demo dates, scope shifts, or altered decisions",
    badgeBg: "bg-[#F0EDF5]",
    badgeText: "text-[#3D304E]",
    borderColor: "border-[#D1C9DE]",
  },
  unresolved_questions: {
    label: "Unresolved questions",
    shortLabel: "Open questions",
    description: "Questions without clear answers or unassigned responsibilities",
    badgeBg: "bg-[#EDEDE8]",
    badgeText: "text-[#3B3D37]",
    borderColor: "border-[#D1D1CA]",
  },
  urgent_actions: {
    label: "Urgent actions",
    shortLabel: "Urgent",
    description: "Time-critical items requiring immediate intervention",
    badgeBg: "bg-[#F6EBEB]",
    badgeText: "text-[#5E2424]",
    borderColor: "border-[#E0C0C0]",
  },
};
