
# NOTARYFIX — Notary Operations Suite

A mobile-first operations dashboard for notary businesses:
- Executive dashboard (Owner / Operator views)
- Scheduling (calendar + “smart add” parsing)
- Clients CRM (smart fill from pasted text or scanned filename)
- Invoices (smart fill + receipt filename parsing)
- Mileage tracking (smart fill + GPS auto-calc + export)
- Journal / Signer Portal / Team Dispatch / AI Trainer (Phase 1 scaffolds)

> Built as a fast-moving MVP: clean UI, real CRUD in local state, and upgrade-ready modules.

---

## Tech Stack
- React + Vite
- Tailwind CSS
- React Router
- Recharts charts
- Framer Motion animations

---

## Features (Current)
### Dashboard
- KPI cards + revenue charts
- “Owner View” vs “Operator View” quick actions

### Schedule
- Month calendar
- Create/edit appointments
- “Smart Calendar Input” → parses date/time/amount/type/client

### Clients
- Add clients with smart parsing for email/phone/company

### Invoices
- Add/edit invoices
- Smart fill supports parsing amount/due/status/client from pasted text or filename

### Mileage
- Trip log CRUD
- GPS “Start/Stop” tracking to auto-calc miles
- Year-to-date deduction calculation

### Scaffolds (ready for next pass)
- Journal
- Signer Portal
- Team Dispatch
- AI Trainer

---

## Getting Started
```bash
npm install
npm run dev
