# NOTARYFIX — Agentic Notary Operations Platform

A mobile-first, AI-powered operations platform for notary businesses. Built to move from a human-operated dashboard toward autonomous task execution with compliance guardrails, confidence scoring, and full audit trails.

---

## Tech Stack
- **React + Vite** — SPA with BrowserRouter
- **Tailwind CSS** — mobile-first styling
- **Recharts** — KPI and revenue charts
- **Framer Motion** — animations
- **Vercel** — hosting + serverless API proxy
- **Firebase Identity Toolkit + Firestore REST** — real auth + cloud persistence

---

## Architecture

### Context Slices (src/context/slices/)
Business logic is split into three focused slice factories:
- crudOps.js — appointments, clients, invoices, journal, mileage, compliance
- dispatchOps.js — team dispatch, jobs, payouts, notes
- agentOps.js — AI closeout agent, AR scan, lead intake, weekly digest

DataContext.jsx orchestrates slice ops and now syncs authenticated user data to Firestore (`users/{uid}/private/appData`) with one-time legacy localStorage migration.


### Launch-Critical Platform Guarantees
- **Real identity layer**: protected routes use authenticated sessions (Firebase token-backed), not onboarding flags.
- **Cloud persistence**: appointments, invoices, journal entries, and client data are synced to Firestore per-user docs.
- **Background automation handoff**: AR scans and weekly digest triggers enqueue automation jobs in Firestore (`users/{uid}/automationJobs/*`) so server-side workers/Cloud Functions can execute even with no browser tab open.

### AI Agent Service (src/services/agentService.js)
All Gemini calls route through the /api/gemini Vercel serverless proxy. API key never reaches the browser. Capabilities:
- Closeout Agent — drafts journal entries + invoices post-appointment
- Lead Intake Parser — parses SMS/email/voicemail into structured appointment data
- AR Scan Agent — flags overdue invoices and drafts payment reminders
- Weekly Digest — summarises business performance with AI narrative

### Autonomy Modes
Three-tier agent autonomy controlled via Settings:
- assistive — AI drafts only, notary creates manually
- supervised — AI drafts surface in Review Queue for one-tap approve/reject
- autonomous — AI auto-executes low-risk actions (Phase 3, planned)

---

## Features

### Agent Command Center (/agent)
- Pending suggestion queue with confidence scores + compliance warnings
- KPIs: approval rate, edit rate, pending count
- Lead intake parser (paste SMS/email to structured appointment)
- Weekly AI digest

### Review Queue (/review)
- Dedicated page for all pending agent suggestions
- Filter by type (Closeout / AR / Lead), sort by date or confidence
- Approve: journal + invoice created atomically
- Nav badge shows live pending count

### ArriveMode (/arrive/:id)
- On-site appointment workflow assistant
- Type-aware checklists (Loan Signing, I-9, Apostille, RON, GNW)
- State-aware ID requirements and fee cap warnings

### Compliance Layer
- All 50 states + DC with per-state fee caps, required journal fields, thumbprint rules
- Conditional rules (e.g. CA thumbprint required for deeds + POAs)

### Feature Gating
- Three plan tiers: free / pro / agency
- Role-based access: owner / admin / dispatcher / notary
- Soft journal entry limit (10/month on free tier)

---

## Getting Started

npm install
npm run dev

### Environment Variables

Local (.env.local):
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

Vercel (dashboard environment variables):
GEMINI_API_KEY=your_key_here
BASE_URL=/

---

### Auth Configuration Troubleshooting
- **"Firebase config missing (VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID)"**: add both vars to `.env.local` and restart `npm run dev`.
- **"Google Sign-In not configured"**: add `VITE_GOOGLE_CLIENT_ID` (Google Identity Web client) to `.env.local`.
- The Auth page now shows inline config status and disables unavailable sign-in methods until env vars are set.


## Deployment

### Vercel (recommended)
1. Import repo into Vercel
2. Set GEMINI_API_KEY and BASE_URL=/ in environment variables
3. Deploy — vercel.json handles SPA rewrites and API routing

### GitHub Pages (static, no AI features)
- AI calls fall back to deterministic heuristics
- Base path defaults to /NOTARYFIX/

---

See SECURITY.md for API key handling and rate limiting details.
See docs/AUTONOMY_ROADMAP.md for the 4-phase autonomy plan.
