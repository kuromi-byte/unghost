# un-ghost

> **You were gone. We've got you.**

un-ghost analyses chat transcripts with Google Gemini and surfaces every loose end so you can re-enter any conversation fully caught up.

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com) API key (free tier works)

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_actual_key
```

### 3. Start the backend (Terminal 1)

```bash
cd backend
npm run dev
# → 🚀 un-ghost backend running on http://localhost:3001
```

### 4. Start the frontend (Terminal 2)

```bash
cd frontend
npm run dev
# → Local: http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Usage

1. Enter your name or handle (e.g. `Alex`, `@sarah`)
2. Paste a chat transcript — any format with `Sender: text` lines works
3. Click **Analyze transcript** (or press `Ctrl+Enter`)
4. View your findings — click the message icon on any card to see the source messages
5. Click **Clear session** to start over

> **Demo**: Click **Load sample** to insert a pre-written group chat and run a real analysis on it.

---

## What it finds (from your perspective)

| Category | What it surfaces |
|---|---|
| 🚨 Urgent Actions | Time-sensitive items needing immediate attention |
| ⏳ People Waiting on Me | Someone is explicitly waiting for you to act |
| 📦 Things I Owe | Tasks, files, or responses you owe someone |
| 🔄 Waiting on Others | Things you're waiting on from other people |
| 📅 Changed Plans | Deadlines, meetings, or decisions that changed |
| ❓ Unresolved Questions | Open questions with no clear answer yet |

---

## Architecture

```
unghost/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/App.tsx          # Main UI
│       ├── components/FindingCard.tsx  # Individual finding with source citation
│       ├── components/ResultsPanel.tsx # Grouped results
│       ├── api.ts                      # Backend API client (no key exposure)
│       ├── types.ts                    # Shared TypeScript types
│       └── sampleData.ts              # Demo transcript
└── backend/           # Node.js + Express + TypeScript
    └── src/
        ├── index.ts              # Express server entry
        ├── schemas.ts            # Zod request/response schemas
        ├── parser.ts             # Transcript → stable-ID messages
        ├── gemini.ts             # Gemini API integration + validation
        └── routes/analyze.ts    # POST /api/analyze handler
```

### Key design decisions

- **API key never leaves the server** — the frontend only calls `/api/analyze`, never Gemini directly
- **Stable message IDs** — every message gets an ID before Gemini sees it; every finding must cite real IDs
- **Reference validation** — any `sourceId` that doesn't match a real message is stripped; findings with no valid sources are dropped
- **No hardcoded results** — all analysis comes from a live Gemini API call; sample button loads text, not pre-canned results
- **No persistence** — transcripts and results are never stored

---

## Privacy Notice

Conversation content is sent to Google's Gemini API for cloud AI processing. This app never stores transcripts or results. See [Google's Privacy Policy](https://policies.google.com/privacy) for details on Gemini data handling.

---

## Development

```bash
# Backend type-check
cd backend && npx tsc --noEmit

# Frontend type-check  
cd frontend && npx tsc --noEmit

# Frontend production build
cd frontend && npm run build
```
