import React, { useState, useRef } from "react";
import { analyzeTranscript } from "../api";
import type { AnalysisResponse, FindingCategory } from "../types";
import { ResultsPanel } from "./ResultsPanel";
import { SAMPLE_TRANSCRIPT } from "../sampleData";
import {
  LayoutGrid,
  CheckSquare,
  Clock,
  UserCheck,
  Calendar,
  HelpCircle,
  AlertCircle,
  Menu,
  X,
  RotateCcw,
  ArrowRight,
  FileText,
} from "lucide-react";
import axios from "axios";

// Minimal geometric ghost mark with acid-lime eye accents
const GhostGeometricMark = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M12 2.5C7.30558 2.5 3.5 6.30558 3.5 11V20.5L6.5 18.5L9.5 20.5L12 18.5L14.5 20.5L17.5 18.5L20.5 20.5V11C20.5 6.30558 16.6944 2.5 12 2.5Z"
      fill="#20211F"
    />
    <circle cx="8.5" cy="10.5" r="1.5" fill="#D8F36A" />
    <circle cx="15.5" cy="10.5" r="1.5" fill="#D8F36A" />
  </svg>
);

interface NavItem {
  id: FindingCategory | "all";
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "all", label: "Overview", icon: LayoutGrid },
  { id: "things_i_owe", label: "Things I owe", icon: CheckSquare },
  { id: "waiting_on_me", label: "Waiting on me", icon: Clock },
  { id: "waiting_on_others", label: "Waiting on others", icon: UserCheck },
  { id: "changed_plans", label: "Changed plans", icon: Calendar },
  { id: "unresolved_questions", label: "Unresolved questions", icon: HelpCircle },
  { id: "urgent_actions", label: "Urgent actions", icon: AlertCircle },
];

export const App: React.FC = () => {
  const [transcript, setTranscript] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FindingCategory | "all">("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"workspace" | "input">("input");

  // Inflight lock preventing concurrent submissions
  const inflightRef = useRef(false);

  const canSubmit = transcript.trim().length >= 10 && userName.trim().length >= 1;

  // Real category counts derived from validated results
  const categoryCounts = React.useMemo(() => {
    if (!result) return {};
    const counts: Record<string, number> = {};
    for (const f of result.findings) {
      counts[f.category] = (counts[f.category] || 0) + 1;
    }
    return counts;
  }, [result]);

  const handleAnalyze = async () => {
    if (!canSubmit || inflightRef.current) return;
    inflightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeTranscript(transcript.trim(), userName.trim());
      setResult(data);
      setViewMode("workspace");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        const detail = err.response.data.details ? ` — ${err.response.data.details}` : "";
        setError(`${err.response.data.error}${detail}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during analysis.");
      }
    } finally {
      inflightRef.current = false;
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTranscript("");
    setUserName("");
    setResult(null);
    setError(null);
    setActiveFilter("all");
    setViewMode("input");
  };

  const handleLoadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setUserName("Alex");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleAnalyze();
    }
  };

  const handleNavSelect = (id: FindingCategory | "all") => {
    setActiveFilter(id);
    if (result) {
      setViewMode("workspace");
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-[#20211F] flex flex-col md:flex-row antialiased">
      {/* 1. SLIM SIDEBAR (225px wide) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[225px] shrink-0 bg-[#F8F8F5] border-r border-[#E5E5DF] flex flex-col justify-between z-40 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="h-14 px-5 border-b border-[#E5E5DF] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GhostGeometricMark />
              <span className="font-semibold text-base tracking-[-0.02em] text-[#20211F]">
                un-ghost
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-[#777A73] hover:text-[#20211F]"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#8E918A]">
              Workspace
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFilter === item.id;
              const count =
                item.id === "all" ? result?.findings.length : categoryCounts[item.id];

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavSelect(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[#ECECE8] text-[#20211F]"
                      : "text-[#5C5E57] hover:text-[#20211F] hover:bg-[#F1F1ED]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={isSelected ? "text-[#20211F]" : "text-[#8E918A]"} />
                    <span>{item.label}</span>
                  </div>

                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[11px] font-mono font-medium px-1.5 py-0.2 rounded ${
                        isSelected ? "bg-white text-[#20211F]" : "bg-[#EAEAE4] text-[#555750]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Privacy Disclosure */}
        <div className="p-4 border-t border-[#E5E5DF]">
          <div className="text-[11px] leading-[1.4] text-[#777A73] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#484A44]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D8F36A]" />
              <span>AI Processing Notice</span>
            </div>
            <p>
              Conversations are processed via Google Gemini. Only submit transcripts you are
              comfortable sharing.
            </p>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
        />
      )}

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="h-14 border-b border-[#E5E5DF] bg-[#F8F8F5]/90 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-[#5C5E57] hover:text-[#20211F] -ml-2 p-1.5"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 text-xs text-[#777A73]">
              <span className="font-semibold text-[#20211F]">un-ghost</span>
              <span>/</span>
              <span className="text-[#555750]">
                {result ? "Workspace queue" : "New transcript"}
              </span>
              {userName && (
                <>
                  <span>/</span>
                  <span className="font-medium text-[#20211F]">@{userName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#777A73]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20211F]" />
              <span>Gemini 3.5 Flash-Lite</span>
            </div>

            {/* View switcher when results exist */}
            {result && (
              <div className="flex items-center gap-1 bg-[#EFEFEA] p-0.5 rounded-lg border border-[#E5E5DF] text-xs">
                <button
                  onClick={() => setViewMode("workspace")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === "workspace"
                      ? "bg-white text-[#20211F] shadow-xs"
                      : "text-[#5C5E57] hover:text-[#20211F]"
                  }`}
                >
                  Results ({result.findings.length})
                </button>
                <button
                  onClick={() => setViewMode("input")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === "input"
                      ? "bg-white text-[#20211F] shadow-xs"
                      : "text-[#5C5E57] hover:text-[#20211F]"
                  }`}
                >
                  Transcript
                </button>
              </div>
            )}

            {(transcript || result || error) && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs text-[#777A73] hover:text-[#20211F] px-2 py-1 rounded-md hover:bg-[#EFEFEA] transition-colors"
                title="Reset conversation session"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
          {/* Dismissible Error Alert */}
          {error && (
            <div className="mb-6 flex items-start justify-between gap-3 bg-[#FCF4F4] border border-[#ECD1D1] rounded-xl p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={15} className="text-[#8B2424] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#8B2424]">Analysis error</h4>
                  <p className="text-[#5E2B2B] mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-[#8B2424] hover:text-[#5E2B2B] p-1"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* VIEW: RESULTS WORKSPACE */}
          {result && viewMode === "workspace" && (
            <ResultsPanel
              findings={result.findings}
              messages={result.messages}
              summary={result.summary}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onEditTranscript={() => setViewMode("input")}
            />
          )}

          {/* VIEW: INPUT / LANDING EXPERIENCE */}
          {(!result || viewMode === "input") && (
            <div className="space-y-6 animate-fade-in">
              {/* Editorial Header */}
              <div className="pb-2">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider text-[#20211F] bg-[#D8F36A] px-2 py-0.5 rounded font-semibold">
                    Inbox Catch-up
                  </span>
                  <span className="text-xs text-[#777A73]">You were gone. We've got you.</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-[#20211F]">
                  Catch up without catching up on everything.
                </h1>
                <p className="text-sm text-[#777A73] mt-1.5 leading-relaxed">
                  Find the commitments, changes, and loose ends hiding in your conversations.
                </p>
              </div>

              {/* Input Card */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* User handle field */}
                <div>
                  <label className="block text-xs font-semibold text-[#20211F] mb-1.5 tracking-[-0.01em]">
                    Your name or handle
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Alex, @sarah, Jordan"
                    disabled={loading}
                    className="w-full sm:max-w-xs rounded-xl border border-[#E5E5DF] bg-[#FDFDFB] px-3.5 py-2.5 text-xs text-[#20211F] placeholder:text-[#9EA19A] focus:outline-none focus:ring-1 focus:ring-[#20211F] focus:border-[#20211F] transition-all"
                  />
                  <p className="text-[11px] text-[#777A73] mt-1">
                    Used to separate your commitments from things you are waiting on.
                  </p>
                </div>

                {/* Transcript input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#20211F] tracking-[-0.01em]">
                      Conversation transcript
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSample}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#464842] hover:text-[#20211F] hover:underline transition-colors"
                    >
                      <FileText size={12} className="text-[#777A73]" />
                      <span>Load sample conversation</span>
                    </button>
                  </div>

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    rows={12}
                    placeholder={`Paste messages from Slack, Teams, Discord, or WhatsApp...\n\nExample format:\n[09:15] Sarah: Hey everyone, quick check-in before the sprint ends\n[09:16] Marcus: Alex, did you finish the payment integration? We're blocked on QA\n[09:16] Alex: Not yet, should be done by EOD today`}
                    className="w-full rounded-xl border border-[#E5E5DF] bg-[#FDFDFB] p-3.5 text-xs text-[#20211F] placeholder:text-[#9EA19A] focus:outline-none focus:ring-1 focus:ring-[#20211F] focus:border-[#20211F] transition-all font-mono leading-relaxed resize-y"
                  />

                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#777A73]">
                    <span>Original messages are cited as evidence for every finding.</span>
                    <span className="font-mono">
                      {transcript.length > 0 ? `${transcript.length.toLocaleString()} chars` : ""}
                    </span>
                  </div>
                </div>

                {/* Actions & Loading Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#F0F0EB]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={!canSubmit || loading}
                      className="inline-flex items-center justify-center gap-2 bg-[#20211F] hover:bg-[#343632] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl py-2.5 px-5 transition-colors tracking-[-0.01em]"
                    >
                      {loading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Untangling the conversation…</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D8F36A]" />
                          <span>Find my loose ends</span>
                          <ArrowRight size={13} className="text-white/60 ml-0.5" />
                        </>
                      )}
                    </button>

                    {result && (
                      <button
                        type="button"
                        onClick={() => setViewMode("workspace")}
                        className="text-xs font-medium text-[#5C5E57] hover:text-[#20211F] px-3 py-2 rounded-lg hover:bg-[#EFEFEA] transition-colors"
                      >
                        Return to current results ({result.findings.length})
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-[#8E918A]">
                    Press <kbd className="px-1 py-0.5 bg-[#EAEAE4] rounded font-mono text-[10px]">Ctrl+Enter</kbd> to run
                  </span>
                </div>
              </div>

              {/* Restrained Loading Banner */}
              {loading && (
                <div className="bg-white border border-[#E5E5DF] rounded-2xl p-6 text-center space-y-3 animate-fade-in shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#20211F]">
                    <span className="w-2 h-2 rounded-full bg-[#D8F36A] animate-pulse-subtle" />
                    <span>Untangling the conversation…</span>
                  </div>
                  <p className="text-xs text-[#777A73] max-w-sm mx-auto leading-relaxed">
                    Analyzing conversation structure, assigning stable message citations, and
                    validating commitments against your handle.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="mt-auto border-t border-[#E5E5DF] py-5 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8E918A]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#20211F]">un-ghost</span>
              <span>·</span>
              <span>You were gone. We've got you.</span>
            </div>
            <span>Powered by Gemini 3.5 Flash-Lite · Zero hardcoded conclusions</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
