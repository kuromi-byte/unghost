import React, { useState } from "react";
import type { FindingCategory, Finding, Message } from "../types";
import { CATEGORY_META } from "../categoryMeta";
import { FindingCard } from "./FindingCard";
import {
  Copy,
  Check,
  Edit3,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Inbox,
} from "lucide-react";

interface ResultsPanelProps {
  findings: Finding[];
  messages: Message[];
  summary: string;
  activeFilter: FindingCategory | "all";
  onFilterChange: (filter: FindingCategory | "all") => void;
  onEditTranscript: () => void;
}

const ORDERED_CATEGORIES: FindingCategory[] = [
  "things_i_owe",
  "waiting_on_me",
  "waiting_on_others",
  "changed_plans",
  "unresolved_questions",
  "urgent_actions",
];

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  findings,
  messages,
  summary,
  activeFilter,
  onFilterChange,
  onEditTranscript,
}) => {
  const [copied, setCopied] = useState(false);

  // Grouped findings by category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of findings) {
      counts[f.category] = (counts[f.category] || 0) + 1;
    }
    return counts;
  }, [findings]);

  // "What needs your attention" derived strictly from actual findings
  const highPriorityItems = React.useMemo(
    () => findings.filter((f) => f.priority === "high" || f.category === "urgent_actions"),
    [findings]
  );
  const changedPlanItems = React.useMemo(
    () => findings.filter((f) => f.category === "changed_plans"),
    [findings]
  );
  const questionItems = React.useMemo(
    () => findings.filter((f) => f.category === "unresolved_questions"),
    [findings]
  );

  const filteredFindings = React.useMemo(() => {
    if (activeFilter === "all") return findings;
    return findings.filter((f) => f.category === activeFilter);
  }, [findings, activeFilter]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP SUMMARY CARD */}
      <section className="bg-white border border-[#E5E5DF] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#F0F0EB]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#20211F] tracking-[-0.01em]">
              Your loose ends
            </h2>
            <span className="inline-flex items-center text-xs font-mono font-medium text-[#20211F] bg-[#D8F36A] px-2 py-0.5 rounded-full">
              {findings.length} findings
            </span>
            <span className="text-xs text-[#777A73]">
              · {messages.length} messages parsed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4D4F48] hover:text-[#20211F] bg-[#F8F8F5] hover:bg-[#EFEFEA] px-2.5 py-1.5 rounded-lg border border-[#E5E5DF] transition-colors"
              title="Copy summary text"
            >
              {copied ? <Check size={13} className="text-[#20211F]" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy summary"}</span>
            </button>

            <button
              onClick={onEditTranscript}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4D4F48] hover:text-[#20211F] bg-[#F8F8F5] hover:bg-[#EFEFEA] px-2.5 py-1.5 rounded-lg border border-[#E5E5DF] transition-colors"
              title="Edit original transcript"
            >
              <Edit3 size={13} />
              <span>Edit transcript</span>
            </button>
          </div>
        </div>

        <p className="text-[13.5px] text-[#343630] leading-[1.65] font-normal selection:bg-[#EBF8B8]">
          {summary}
        </p>
      </section>

      {/* 2. WHAT NEEDS YOUR ATTENTION SECTION */}
      {(highPriorityItems.length > 0 || changedPlanItems.length > 0 || questionItems.length > 0) && (
        <section className="bg-white border border-[#E5E5DF] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20211F]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777A73]">
                What needs your attention
              </h3>
            </div>
            <span className="text-[11px] text-[#8E918A]">
              Derived from verified findings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Attention Card 1: High Priority / Urgent */}
            <div className="bg-[#FAF9F6] border border-[#EBEBE5] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#802323] mb-1.5">
                  <AlertCircle size={13} />
                  <span>High priority & urgent ({highPriorityItems.length})</span>
                </div>
                {highPriorityItems.length > 0 ? (
                  <ul className="space-y-1.5 mt-2">
                    {highPriorityItems.slice(0, 2).map((item, i) => (
                      <li key={i} className="text-xs text-[#20211F] line-clamp-2 font-medium">
                        • {item.summary}
                      </li>
                    ))}
                    {highPriorityItems.length > 2 && (
                      <li className="text-[11px] text-[#777A73]">
                        + {highPriorityItems.length - 2} more high-priority items
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-[#8E918A] mt-1">None reported</p>
                )}
              </div>
            </div>

            {/* Attention Card 2: Changed plans */}
            <div className="bg-[#FAF9F6] border border-[#EBEBE5] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#443854] mb-1.5">
                  <Calendar size={13} />
                  <span>Changed plans ({changedPlanItems.length})</span>
                </div>
                {changedPlanItems.length > 0 ? (
                  <ul className="space-y-1.5 mt-2">
                    {changedPlanItems.slice(0, 2).map((item, i) => (
                      <li key={i} className="text-xs text-[#20211F] line-clamp-2 font-medium">
                        • {item.summary}
                      </li>
                    ))}
                    {changedPlanItems.length > 2 && (
                      <li className="text-[11px] text-[#777A73]">
                        + {changedPlanItems.length - 2} more plan changes
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-[#8E918A] mt-1">No shifted dates or scope</p>
                )}
              </div>
            </div>

            {/* Attention Card 3: Unresolved questions */}
            <div className="bg-[#FAF9F6] border border-[#EBEBE5] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3B4039] mb-1.5">
                  <HelpCircle size={13} />
                  <span>Open questions ({questionItems.length})</span>
                </div>
                {questionItems.length > 0 ? (
                  <ul className="space-y-1.5 mt-2">
                    {questionItems.slice(0, 2).map((item, i) => (
                      <li key={i} className="text-xs text-[#20211F] line-clamp-2 font-medium">
                        • {item.summary}
                      </li>
                    ))}
                    {questionItems.length > 2 && (
                      <li className="text-[11px] text-[#777A73]">
                        + {questionItems.length - 2} more open questions
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-[#8E918A] mt-1">No open questions detected</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. CATEGORY TABS & FILTER BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E5DF] text-xs">
        <button
          onClick={() => onFilterChange("all")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-[#20211F] text-white"
              : "text-[#5C5E57] hover:text-[#20211F] hover:bg-[#EFEFEA]"
          }`}
        >
          <Layers size={13} />
          <span>All</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
              activeFilter === "all" ? "bg-white/20 text-white" : "bg-[#EAEAE4] text-[#4F514B]"
            }`}
          >
            {findings.length}
          </span>
        </button>

        {ORDERED_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] || 0;
          const meta = CATEGORY_META[cat];
          const isSelected = activeFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isSelected
                  ? "bg-[#20211F] text-white"
                  : "text-[#5C5E57] hover:text-[#20211F] hover:bg-[#EFEFEA]"
              }`}
            >
              <span>{meta.label}</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#EAEAE4] text-[#4F514B]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. WORK QUEUE LIST */}
      <section className="space-y-3">
        {filteredFindings.length > 0 ? (
          filteredFindings.map((finding, idx) => (
            <FindingCard
              key={`${finding.category}-${idx}`}
              finding={finding}
              messages={messages}
              index={idx}
            />
          ))
        ) : (
          <div className="bg-white border border-[#E5E5DF] rounded-2xl py-12 px-6 text-center">
            <Inbox size={24} className="mx-auto text-[#A5A8A0] mb-2" />
            <h4 className="text-sm font-semibold text-[#20211F]">
              No loose ends in this category
            </h4>
            <p className="text-xs text-[#777A73] mt-1 max-w-sm mx-auto">
              {activeFilter !== "all"
                ? `No items identified for "${CATEGORY_META[activeFilter].label}" in this conversation.`
                : "No loose ends found. You are caught up!"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
