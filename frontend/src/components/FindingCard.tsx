import React, { useState } from "react";
import type { Finding, Message } from "../types";
import { CATEGORY_META } from "../categoryMeta";
import { User, Calendar, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  messages: Message[];
  index: number;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, messages, index }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[finding.category];
  const sourceMessages = messages.filter((m) => finding.sourceIds.includes(m.id));

  // Visual distinction indicator for commitment type
  const commitmentPill = (() => {
    switch (finding.category) {
      case "things_i_owe":
        return (
          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-[#20211F] bg-[#D8F36A] px-1.5 py-0.5 rounded">
            Your task
          </span>
        );
      case "waiting_on_me":
        return (
          <span className="inline-flex items-center text-[10px] font-medium tracking-wide text-[#7C3A18] bg-[#F7EFE9] px-1.5 py-0.5 rounded border border-[#EBDCD0]">
            Blocking others
          </span>
        );
      case "waiting_on_others":
        return (
          <span className="inline-flex items-center text-[10px] font-medium tracking-wide text-[#2B4957] bg-[#EEF4F6] px-1.5 py-0.5 rounded border border-[#D5E3E8]">
            External dependency
          </span>
        );
      case "urgent_actions":
        return (
          <span className="inline-flex items-center text-[10px] font-medium tracking-wide text-[#802323] bg-[#FAECEC] px-1.5 py-0.5 rounded border border-[#ECCECE]">
            Urgent
          </span>
        );
      default:
        return null;
    }
  })();

  const priorityBadge = finding.priority
    ? {
        high: "bg-[#FBF0EA] text-[#843615] border-[#EAD5C7]",
        medium: "bg-[#F3F3EF] text-[#474942] border-[#E2E2DC]",
        low: "bg-[#F5F5F2] text-[#696B64] border-[#E7E7E1]",
      }[finding.priority]
    : null;

  return (
    <article
      className="bg-white border border-[#E5E5DF] hover:border-[#D0D0CA] rounded-xl p-4.5 transition-all duration-150 animate-fade-in group shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row: category badge + commitment indicator + metadata */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded ${meta.badgeBg} ${meta.badgeText} border border-black/5`}
            >
              {meta.shortLabel}
            </span>

            {commitmentPill}

            {priorityBadge && (
              <span
                className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${priorityBadge}`}
              >
                {finding.priority}
              </span>
            )}

            {finding.owner && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#777A73]">
                <User size={11} className="text-[#8E918A]" />
                <span className="font-medium text-[#464843]">{finding.owner}</span>
              </span>
            )}

            {finding.dueDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#777A73]">
                <Calendar size={11} className="text-[#8E918A]" />
                <span>{finding.dueDate}</span>
              </span>
            )}
          </div>

          {/* Finding summary */}
          <h4 className="text-[14px] font-semibold text-[#20211F] leading-snug tracking-[-0.01em]">
            {finding.summary}
          </h4>

          {/* Optional detail */}
          {finding.detail && (
            <p className="mt-1 text-[13px] text-[#5A5C55] leading-relaxed">
              {finding.detail}
            </p>
          )}
        </div>

        {/* Source citation button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-md border transition-colors ${
            expanded
              ? "bg-[#F1F1ED] text-[#20211F] border-[#D6D6CE]"
              : "bg-[#F8F8F5] hover:bg-[#F1F1ED] text-[#777A73] hover:text-[#20211F] border-[#E5E5DF]"
          }`}
          title={expanded ? "Hide original messages" : "Inspect original messages"}
          aria-expanded={expanded}
        >
          <MessageSquare size={12} className="text-[#8E918A]" />
          <span>{finding.sourceIds.join(", ")}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expandable original source messages */}
      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#EDEDE8] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#777A73] mb-1 font-mono">
            <span>Original message evidence ({sourceMessages.length})</span>
            <span>Verified in transcript</span>
          </div>

          {sourceMessages.length > 0 ? (
            sourceMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-[#F8F8F5] border border-[#E6E6E0] rounded-lg p-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#20211F]">{msg.sender}</span>
                    {msg.timestamp && (
                      <span className="text-[11px] text-[#8E918A] font-mono">{msg.timestamp}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#777A73] bg-[#EFEFEA] px-1.5 py-0.2 rounded">
                    {msg.id}
                  </span>
                </div>
                <p className="text-[#3E4039] leading-relaxed select-text">{msg.text}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#8E918A] italic">
              Cited source IDs: {finding.sourceIds.join(", ")}
            </p>
          )}
        </div>
      )}
    </article>
  );
};
